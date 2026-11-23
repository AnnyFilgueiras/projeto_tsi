import { randomUUID } from 'node:crypto';
import {
  checkInvariants,
  type AllergenCode,
  type IngredientForInvariants,
} from '@panelada/allergen-rules/invariants';
import type { DatabaseClient } from '../../../db/client.js';
import { hashCanonicalPayload } from '../../../shared/canonical-hash.js';
import {
  businessRuleProblem,
  inProgressProblem,
  keyReusedProblem,
  notFoundProblem,
  ProblemError,
  publicationGateProblem,
} from '../../../shared/problem.js';
import type { Tx } from '../../../shared/tx.js';
import type {
  CatalogReadPort,
  Continent,
  CuisineDto,
  Difficulty,
  DishPhotoDto,
  IngredientDto,
  PhotoLicense,
  UtensilDto,
} from '../../catalog/public/catalog-read.js';
import type { CatalogWritePort } from '../../catalog/public/catalog-write.js';
import type { PhotoStorage } from '../../catalog/public/photo-storage.js';
import { processDishPhoto } from './photo-processor.js';
import { evaluatePublicationGate, MAX_EVOLUTION_CHAIN_DEPTH } from './publication-gate.js';
import type { DrizzleImporterRepository, ProposalRecord } from './repository.js';
import type {
  ProposalIngredientData,
  StoredProposalData,
  StoredProposalPhoto,
  StoredVerificationChecklist,
} from './schema.js';

const IDEMPOTENCY_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export interface IdempotentResult<T> {
  readonly statusCode: number;
  readonly body: T;
}

export interface ProposalResponseDto {
  readonly id: string;
  readonly publicationState: 'proposed' | 'approved' | 'deactivated';
  readonly origin: 'manual' | 'ai';
  readonly data: StoredProposalData;
  readonly photo: DishPhotoDto | null;
  readonly uncertainties: readonly string[];
  readonly rawOutput: Record<string, unknown> | null;
  readonly model: string | null;
  readonly schemaVersion: string | null;
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  readonly verifiedBy: string | null;
  readonly verifiedAt: string | null;
  readonly approvedBy: string | null;
  readonly approvedAt: string | null;
  readonly createdAt: string;
}

export interface ProposalSummaryDto {
  readonly id: string;
  readonly name: string;
  readonly publicationState: 'proposed' | 'approved' | 'deactivated';
  readonly allergenState: 'verified' | 'source_declared' | 'unverified';
  readonly origin: 'manual' | 'ai';
  readonly createdAt: string;
}

export interface SubstitutionResponseDto {
  readonly id: string;
  readonly ingredientId: string;
  readonly substituteId: string;
  readonly substituteName: string;
  readonly substituteAllergens: readonly AllergenCode[];
  readonly allergenState: 'verified' | 'source_declared' | 'unverified';
  readonly origin: 'manual' | 'ai';
}

export interface SubmitManualRecipeInput {
  readonly name: string;
  readonly cuisineId: string;
  readonly baseDishId?: string | null;
  readonly prepTimeMinutes: number;
  readonly difficulty: Difficulty;
  readonly ingredients: readonly ProposalIngredientData[];
  readonly utensilIds?: readonly string[];
  readonly steps: readonly string[];
  readonly allergens: readonly AllergenCode[];
  readonly allergenState: 'source_declared' | 'unverified';
  readonly sourceName: string;
  readonly sourceUrl: string;
}

export interface EditProposalInput {
  readonly name?: string;
  readonly cuisineId?: string;
  readonly baseDishId?: string | null;
  readonly prepTimeMinutes?: number;
  readonly difficulty?: Difficulty;
  readonly ingredients?: readonly ProposalIngredientData[];
  readonly utensilIds?: readonly string[];
  readonly steps?: readonly string[];
  readonly allergens?: readonly AllergenCode[];
  readonly allergenState?: 'source_declared' | 'unverified';
  readonly sourceName?: string;
  readonly sourceUrl?: string;
}

export interface AttachPhotoInput {
  readonly rawBytes: Buffer;
  readonly author: string;
  readonly title?: string;
  readonly sourceUrl: string;
  readonly license: PhotoLicense;
  readonly licenseUrl?: string;
  readonly modified: boolean;
}

export interface CurationServiceDeps {
  readonly dbClient: DatabaseClient;
  readonly repository: DrizzleImporterRepository;
  readonly catalogRead: CatalogReadPort;
  readonly catalogWrite: CatalogWritePort;
  readonly photoStorage: PhotoStorage;
  readonly clock?: () => Date;
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const candidate = error as { code?: string; cause?: { code?: string } };
  return candidate.code === '23505' || candidate.cause?.code === '23505';
}

function deduplicate<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}

function toProposalResponse(record: ProposalRecord): ProposalResponseDto {
  return {
    id: record.id,
    publicationState: record.publicationState,
    origin: record.origin,
    data: record.data,
    photo: record.photo,
    uncertainties: record.uncertainties,
    rawOutput: record.rawOutput,
    model: record.model,
    schemaVersion: record.schemaVersion,
    inputTokens: record.inputTokens,
    outputTokens: record.outputTokens,
    verifiedBy: record.verifiedBy,
    verifiedAt: record.verifiedAt ? record.verifiedAt.toISOString() : null,
    approvedBy: record.approvedBy,
    approvedAt: record.approvedAt ? record.approvedAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
  };
}

export class CurationService {
  private readonly clock: () => Date;

  constructor(private readonly deps: CurationServiceDeps) {
    this.clock = deps.clock ?? (() => new Date());
  }

  private async executeIdempotent<T>(params: {
    readonly accountId: string;
    readonly idempotencyKey: string;
    readonly endpoint: string;
    readonly payload: unknown;
    readonly work: (tx: Tx, now: Date) => Promise<IdempotentResult<T>>;
  }): Promise<IdempotentResult<T>> {
    const payloadHash = hashCanonicalPayload(params.endpoint, params.payload);
    const now = this.clock();

    try {
      return await this.deps.dbClient.withTransaction(async (tx) => {
        await this.deps.repository.acquireIdempotencyLock(
          params.accountId,
          params.idempotencyKey,
          tx,
        );

        const existing = await this.deps.repository.findIdempotencyKey(
          params.accountId,
          params.idempotencyKey,
          tx,
        );

        if (existing) {
          if (existing.expiresAt.getTime() > now.getTime()) {
            if (existing.payloadHash !== payloadHash) {
              throw new ProblemError(keyReusedProblem());
            }
            return {
              statusCode: existing.statusCode,
              body: existing.responseBody as T,
            };
          }
          await this.deps.repository.deleteIdempotencyKey(
            params.accountId,
            params.idempotencyKey,
            tx,
          );
        }

        const result = await params.work(tx, now);

        await this.deps.repository.saveIdempotencyKey(
          {
            accountId: params.accountId,
            idempotencyKey: params.idempotencyKey,
            endpoint: params.endpoint,
            payloadHash,
            statusCode: result.statusCode,
            responseBody: result.body,
            now,
            expiresAt: new Date(now.getTime() + IDEMPOTENCY_TTL_MS),
          },
          tx,
        );

        return result;
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        const winner = await this.deps.repository.findIdempotencyKey(
          params.accountId,
          params.idempotencyKey,
        );
        if (winner) {
          if (winner.payloadHash !== payloadHash) {
            throw new ProblemError(keyReusedProblem());
          }
          return {
            statusCode: winner.statusCode,
            body: winner.responseBody as T,
          };
        }
        throw new ProblemError(inProgressProblem());
      }
      throw error;
    }
  }

  async registerIngredient(
    curatorId: string,
    idempotencyKey: string,
    input: {
      readonly name: string;
      readonly allergens: readonly AllergenCode[];
      readonly lactoseFree?: boolean;
    },
  ): Promise<IdempotentResult<IngredientDto>> {
    const allergens = deduplicate(input.allergens);
    const lactoseFree = input.lactoseFree ?? false;
    const trimmedName = input.name.trim();

    return this.executeIdempotent({
      accountId: curatorId,
      idempotencyKey,
      endpoint: 'POST /v1/curation/ingredients',
      payload: { name: trimmedName, allergens, lactoseFree },
      work: async (tx) => {
        // ADR-014 invariant: dairy declaring `leite` without `lactose` requires lactoseFree = true.
        if (allergens.includes('leite') && !allergens.includes('lactose') && !lactoseFree) {
          throw new ProblemError(
            businessRuleProblem('Ingrediente com leite sem lactose exige lactoseFree = true.'),
          );
        }

        const created = await this.deps.catalogWrite.createIngredient(
          {
            id: randomUUID(),
            name: trimmedName,
            allergens,
            lactoseFree,
          },
          tx,
        );
        return { statusCode: 201, body: created };
      },
    });
  }

  async registerUtensil(
    curatorId: string,
    idempotencyKey: string,
    input: { readonly name: string },
  ): Promise<IdempotentResult<UtensilDto>> {
    const trimmedName = input.name.trim();

    return this.executeIdempotent({
      accountId: curatorId,
      idempotencyKey,
      endpoint: 'POST /v1/curation/utensils',
      payload: { name: trimmedName },
      work: async (tx) => {
        const created = await this.deps.catalogWrite.createUtensil(
          { id: randomUUID(), name: trimmedName },
          tx,
        );
        return { statusCode: 201, body: created };
      },
    });
  }

  async registerCuisine(
    curatorId: string,
    idempotencyKey: string,
    input: { readonly name: string; readonly continents: readonly Continent[] },
  ): Promise<IdempotentResult<CuisineDto>> {
    const trimmedName = input.name.trim();
    const continents = deduplicate(input.continents);

    return this.executeIdempotent({
      accountId: curatorId,
      idempotencyKey,
      endpoint: 'POST /v1/curation/cuisines',
      payload: { name: trimmedName, continents },
      work: async (tx) => {
        const created = await this.deps.catalogWrite.createCuisine(
          { id: randomUUID(), name: trimmedName, continents },
          tx,
        );
        return { statusCode: 201, body: created };
      },
    });
  }

  async registerSubstitution(
    curatorId: string,
    idempotencyKey: string,
    input: {
      readonly ingredientId: string;
      readonly substituteId: string;
      readonly substituteAllergens: readonly AllergenCode[];
    },
  ): Promise<IdempotentResult<SubstitutionResponseDto>> {
    const substituteAllergens = deduplicate(input.substituteAllergens);

    return this.executeIdempotent({
      accountId: curatorId,
      idempotencyKey,
      endpoint: 'POST /v1/curation/substitutions',
      payload: {
        ingredientId: input.ingredientId,
        substituteId: input.substituteId,
        substituteAllergens,
      },
      work: async (tx) => {
        if (input.ingredientId === input.substituteId) {
          throw new ProblemError(
            businessRuleProblem('Um ingrediente não pode ser substituto de si mesmo.'),
          );
        }

        const ingredients = await this.deps.catalogRead.getIngredientsByIds(
          [input.ingredientId, input.substituteId],
          tx,
        );
        const original = ingredients.get(input.ingredientId);
        const substitute = ingredients.get(input.substituteId);
        if (!original || !substitute) {
          throw new ProblemError(
            businessRuleProblem('Ingrediente original e substituto devem existir no catálogo.'),
          );
        }

        // A06 / RN22: Never allow a substitution to omit allergens already declared on the
        // canonical substitute ingredient, which would cause fail-open filtering.
        const missingCanonicalAllergens = substitute.allergens.filter(
          (code) => !substituteAllergens.includes(code),
        );
        if (missingCanonicalAllergens.length > 0) {
          throw new ProblemError(
            businessRuleProblem(
              'substituteAllergens deve incluir todos os alérgenos declarados no ingrediente substituto canônico.',
            ),
          );
        }

        if (
          substituteAllergens.includes('leite') &&
          !substituteAllergens.includes('lactose') &&
          !substitute.lactoseFree
        ) {
          throw new ProblemError(
            businessRuleProblem(
              'Substituto com leite sem lactose exige que o ingrediente substituto tenha lactoseFree = true.',
            ),
          );
        }

        // RN22 / ADR-014: Substitutes without declared allergens stay unverified (fail-closed).
        const allergenState = substituteAllergens.length === 0 ? 'unverified' : 'verified';

        const created = await this.deps.catalogWrite.createSubstitution(
          {
            id: randomUUID(),
            ingredientId: input.ingredientId,
            substituteId: input.substituteId,
            substituteAllergens,
            allergenState,
            confirmedAllergenFree: false,
            origin: 'manual',
            approvedBy: curatorId,
          },
          tx,
        );

        return {
          statusCode: 201,
          body: {
            id: created.id,
            ingredientId: created.ingredientId,
            substituteId: created.substituteId,
            substituteName: created.substituteName,
            substituteAllergens: created.substituteAllergens,
            allergenState: created.allergenState,
            origin: created.origin,
          },
        };
      },
    });
  }

  private async validateCatalogReferences(
    proposalId: string,
    data: StoredProposalData,
    tx: Tx,
  ): Promise<void> {
    const uniqueIngredientIds = new Set(data.ingredients.map((item) => item.ingredientId));
    if (uniqueIngredientIds.size !== data.ingredients.length) {
      throw new ProblemError(
        businessRuleProblem('A receita não pode repetir o mesmo ingrediente canônico.'),
      );
    }

    const cuisine = await this.deps.catalogRead.getCuisineById(data.cuisineId, tx);
    if (!cuisine) {
      throw new ProblemError(businessRuleProblem('A culinária informada não existe no catálogo.'));
    }

    const ingredientMap = await this.deps.catalogRead.getIngredientsByIds(
      [...uniqueIngredientIds],
      tx,
    );
    if (ingredientMap.size !== uniqueIngredientIds.size) {
      throw new ProblemError(
        businessRuleProblem('Um ou mais ingredientes informados não existem no catálogo.'),
      );
    }

    const uniqueUtensilIds = new Set(data.utensilIds);
    const utensilMap = await this.deps.catalogRead.getUtensilsByIds(data.utensilIds, tx);
    if (utensilMap.size !== uniqueUtensilIds.size) {
      throw new ProblemError(
        businessRuleProblem('Um ou mais utensílios informados não existem no catálogo.'),
      );
    }

    if (data.baseDishId !== null) {
      const chain = await this.deps.catalogRead.getBaseDishChain(
        data.baseDishId,
        proposalId,
        MAX_EVOLUTION_CHAIN_DEPTH,
        tx,
      );
      if (chain.hasCycle) {
        throw new ProblemError(businessRuleProblem('A cadeia de evolução não pode conter ciclos.'));
      }
      if (!chain.exists) {
        throw new ProblemError(
          businessRuleProblem('O prato base informado não existe ou ainda não está aprovado.'),
        );
      }
      if (chain.depthFromRoot + 1 + chain.descendantDepth > MAX_EVOLUTION_CHAIN_DEPTH) {
        throw new ProblemError(
          businessRuleProblem(
            `A cadeia de evolução excede o limite máximo de ${MAX_EVOLUTION_CHAIN_DEPTH} níveis.`,
          ),
        );
      }
    }
  }

  async submitManualRecipe(
    curatorId: string,
    idempotencyKey: string,
    input: SubmitManualRecipeInput,
  ): Promise<IdempotentResult<ProposalResponseDto>> {
    const normalizedData: StoredProposalData = {
      name: input.name.trim(),
      cuisineId: input.cuisineId,
      baseDishId: input.baseDishId ?? null,
      prepTimeMinutes: input.prepTimeMinutes,
      difficulty: input.difficulty,
      ingredients: input.ingredients.map((item) => ({
        ingredientId: item.ingredientId,
        quantity: item.quantity ?? null,
        unit: item.unit ?? null,
      })),
      utensilIds: deduplicate(input.utensilIds ?? []),
      steps: input.steps.map((step) => step.trim()),
      allergens: deduplicate(input.allergens),
      allergenState: input.allergenState,
      sourceName: input.sourceName.trim(),
      sourceUrl: input.sourceUrl.trim(),
    };

    return this.executeIdempotent({
      accountId: curatorId,
      idempotencyKey,
      endpoint: 'POST /v1/curation/recipes',
      payload: normalizedData,
      work: async (tx, now) => {
        const proposalId = randomUUID();
        await this.validateCatalogReferences(proposalId, normalizedData, tx);

        const created = await this.deps.repository.createProposal(
          {
            id: proposalId,
            origin: 'manual',
            data: normalizedData,
            now,
          },
          tx,
        );

        return { statusCode: 201, body: toProposalResponse(created) };
      },
    });
  }

  async listProposals(params: {
    readonly state?: 'proposed' | 'approved' | 'deactivated';
    readonly page: number;
    readonly size: number;
  }): Promise<{
    readonly items: readonly ProposalSummaryDto[];
    readonly page: number;
    readonly total: number;
  }> {
    const result = await this.deps.repository.listProposals(params);
    return {
      items: result.items.map((item) => ({
        id: item.id,
        name: item.data.name,
        publicationState: item.publicationState,
        allergenState: item.data.allergenState,
        origin: item.origin,
        createdAt: item.createdAt.toISOString(),
      })),
      page: params.page,
      total: result.total,
    };
  }

  async getProposal(proposalId: string): Promise<ProposalResponseDto> {
    const proposal = await this.deps.repository.findProposalById(proposalId);
    if (!proposal) {
      throw new ProblemError(notFoundProblem('Proposta não encontrada.'));
    }
    return toProposalResponse(proposal);
  }

  private async runPublicationGateForProposal(
    proposalId: string,
    data: StoredProposalData,
    confirmedAllergenFree: boolean,
    photo: StoredProposalPhoto | null,
    tx: Tx,
  ) {
    const ingredientIds = data.ingredients.map((item) => item.ingredientId);
    const cuisine = await this.deps.catalogRead.getCuisineById(data.cuisineId, tx);
    const ingredientMap = await this.deps.catalogRead.getIngredientsByIds(ingredientIds, tx);
    const substitutions = await this.deps.catalogRead.getSubstitutionsForIngredients(
      ingredientIds,
      tx,
    );
    const baseDishChain =
      data.baseDishId !== null
        ? await this.deps.catalogRead.getBaseDishChain(
            data.baseDishId,
            proposalId,
            MAX_EVOLUTION_CHAIN_DEPTH,
            tx,
          )
        : { exists: true, depthFromRoot: 0, hasCycle: false, descendantDepth: 0 };

    return evaluatePublicationGate({
      proposalId,
      name: data.name,
      cuisineId: data.cuisineId,
      cuisineExists: cuisine !== null,
      baseDishId: data.baseDishId,
      baseDishChain,
      prepTimeMinutes: data.prepTimeMinutes,
      difficulty: data.difficulty,
      steps: data.steps,
      allergens: data.allergens,
      allergenState: data.allergenState,
      confirmedAllergenFree,
      sourceName: data.sourceName,
      sourceUrl: data.sourceUrl,
      photo,
      ingredients: data.ingredients.map((item) => {
        const canonical = ingredientMap.get(item.ingredientId);
        return {
          ingredientId: item.ingredientId,
          exists: canonical !== undefined,
          allergens: canonical?.allergens ?? [],
          lactoseFree: canonical?.lactoseFree ?? false,
        };
      }),
      substitutes: substitutions.map((sub) => ({
        id: sub.id,
        allergens: sub.substituteAllergens,
        allergenState: sub.allergenState,
        confirmedAllergenFree: sub.confirmedAllergenFree,
      })),
    });
  }

  async editProposal(proposalId: string, input: EditProposalInput): Promise<ProposalResponseDto> {
    const now = this.clock();

    return this.deps.dbClient.withTransaction(async (tx) => {
      const existing = await this.deps.repository.findProposalById(proposalId, tx);
      if (!existing) {
        throw new ProblemError(notFoundProblem('Proposta não encontrada.'));
      }
      if (existing.publicationState === 'deactivated') {
        throw new ProblemError(
          businessRuleProblem('Não é possível editar uma proposta descartada.'),
        );
      }

      const allergensOrIngredientsChanged =
        input.allergens !== undefined || input.ingredients !== undefined;

      // ADR-010 item 10: Changing allergens or ingredients downgrades `verified` until re-verified.
      let nextAllergenState = existing.data.allergenState;
      let nextConfirmedAllergenFree = existing.confirmedAllergenFree;
      let nextVerifiedBy = existing.verifiedBy;
      let nextVerifiedAt = existing.verifiedAt;
      let nextChecklist = existing.verificationChecklist;

      if (input.allergenState !== undefined) {
        nextAllergenState = input.allergenState;
        nextConfirmedAllergenFree = false;
        nextVerifiedBy = null;
        nextVerifiedAt = null;
        nextChecklist = null;
      } else if (allergensOrIngredientsChanged && existing.data.allergenState === 'verified') {
        nextAllergenState = 'unverified';
        nextConfirmedAllergenFree = false;
        nextVerifiedBy = null;
        nextVerifiedAt = null;
        nextChecklist = null;
      }

      const nextData: StoredProposalData = {
        name: input.name !== undefined ? input.name.trim() : existing.data.name,
        cuisineId: input.cuisineId ?? existing.data.cuisineId,
        baseDishId: input.baseDishId !== undefined ? input.baseDishId : existing.data.baseDishId,
        prepTimeMinutes: input.prepTimeMinutes ?? existing.data.prepTimeMinutes,
        difficulty: input.difficulty ?? existing.data.difficulty,
        ingredients:
          input.ingredients !== undefined
            ? input.ingredients.map((item) => ({
                ingredientId: item.ingredientId,
                quantity: item.quantity ?? null,
                unit: item.unit ?? null,
              }))
            : existing.data.ingredients,
        utensilIds:
          input.utensilIds !== undefined ? deduplicate(input.utensilIds) : existing.data.utensilIds,
        steps: input.steps !== undefined ? input.steps.map((s) => s.trim()) : existing.data.steps,
        allergens:
          input.allergens !== undefined ? deduplicate(input.allergens) : existing.data.allergens,
        allergenState: nextAllergenState,
        sourceName:
          input.sourceName !== undefined ? input.sourceName.trim() : existing.data.sourceName,
        sourceUrl: input.sourceUrl !== undefined ? input.sourceUrl.trim() : existing.data.sourceUrl,
      };

      await this.validateCatalogReferences(proposalId, nextData, tx);

      if (existing.publicationState === 'approved') {
        const violations = await this.runPublicationGateForProposal(
          proposalId,
          nextData,
          nextConfirmedAllergenFree,
          existing.photo,
          tx,
        );
        if (violations.length > 0) {
          throw new ProblemError(publicationGateProblem(violations));
        }
      }

      const updated = await this.deps.repository.updateProposal(
        {
          id: proposalId,
          data: nextData,
          confirmedAllergenFree: nextConfirmedAllergenFree,
          verificationChecklist: nextChecklist,
          verifiedBy: nextVerifiedBy,
          verifiedAt: nextVerifiedAt,
          updatedAt: now,
        },
        tx,
      );

      if (updated.publicationState === 'approved' && updated.photo) {
        await this.deps.catalogWrite.updatePublishedRecipe(
          {
            dishId: updated.id,
            name: updated.data.name,
            cuisineId: updated.data.cuisineId,
            baseDishId: updated.data.baseDishId,
            prepTimeMinutes: updated.data.prepTimeMinutes,
            difficulty: updated.data.difficulty,
            ingredients: updated.data.ingredients.map((item) => ({
              ingredientId: item.ingredientId,
              quantity: item.quantity ?? null,
              unit: item.unit ?? null,
            })),
            utensilIds: updated.data.utensilIds,
            steps: updated.data.steps,
            allergens: updated.data.allergens,
            allergenState: updated.data.allergenState,
            confirmedAllergenFree: updated.confirmedAllergenFree,
            allergensUpdatedAt: now,
            sourceName: updated.data.sourceName,
            sourceUrl: updated.data.sourceUrl,
            origin: updated.origin,
            photo: updated.photo,
            now,
          },
          tx,
        );
      }

      return toProposalResponse(updated);
    });
  }

  async attachPhoto(proposalId: string, input: AttachPhotoInput): Promise<DishPhotoDto> {
    const existing = await this.deps.repository.findProposalById(proposalId);
    if (!existing) {
      throw new ProblemError(notFoundProblem('Proposta não encontrada.'));
    }
    if (existing.publicationState === 'deactivated') {
      throw new ProblemError(
        businessRuleProblem('Não é possível anexar foto a uma proposta descartada.'),
      );
    }

    const processed = await processDishPhoto(input.rawBytes);
    await this.deps.photoStorage.save(processed.hash, processed.webpBytes);

    const photo: StoredProposalPhoto = {
      hash: processed.hash,
      author: input.author.trim(),
      ...(input.title && input.title.trim().length > 0 ? { title: input.title.trim() } : {}),
      sourceUrl: input.sourceUrl.trim(),
      license: input.license,
      ...(input.licenseUrl && input.licenseUrl.trim().length > 0
        ? { licenseUrl: input.licenseUrl.trim() }
        : {}),
      modified: input.modified,
    };

    const now = this.clock();

    await this.deps.dbClient.withTransaction(async (tx) => {
      const fresh = await this.deps.repository.findProposalById(proposalId, tx);
      if (!fresh) {
        throw new ProblemError(notFoundProblem('Proposta não encontrada.'));
      }
      if (fresh.publicationState === 'deactivated') {
        throw new ProblemError(
          businessRuleProblem('Não é possível anexar foto a uma proposta descartada.'),
        );
      }

      const updated = await this.deps.repository.updateProposal(
        {
          id: proposalId,
          photo,
          updatedAt: now,
        },
        tx,
      );

      if (updated.publicationState === 'approved') {
        // ADR-012 / ADR-010: Replacing only the dish photo must preserve allergens_updated_at.
        await this.deps.catalogWrite.updatePublishedDishPhoto(updated.id, photo, now, tx);
      }
    });

    return photo;
  }

  async markVerified(
    curatorId: string,
    idempotencyKey: string,
    proposalId: string,
    checklist: StoredVerificationChecklist,
  ): Promise<IdempotentResult<ProposalResponseDto>> {
    return this.executeIdempotent({
      accountId: curatorId,
      idempotencyKey,
      endpoint: `POST /v1/curation/proposals/${proposalId}/verify`,
      payload: checklist,
      work: async (tx, now) => {
        const existing = await this.deps.repository.findProposalById(proposalId, tx);
        if (!existing) {
          throw new ProblemError(notFoundProblem('Proposta não encontrada.'));
        }
        if (existing.publicationState === 'deactivated') {
          throw new ProblemError(
            businessRuleProblem('Não é possível verificar uma proposta descartada.'),
          );
        }

        const ingredientIds = existing.data.ingredients.map((item) => item.ingredientId);
        const ingredientMap = await this.deps.catalogRead.getIngredientsByIds(ingredientIds, tx);
        const substitutions = await this.deps.catalogRead.getSubstitutionsForIngredients(
          ingredientIds,
          tx,
        );

        const ingredientsList: IngredientForInvariants[] = [];
        let hasLactoseFreeIngredient = false;
        for (const item of existing.data.ingredients) {
          const canonical = ingredientMap.get(item.ingredientId);
          if (!canonical) {
            throw new ProblemError(
              businessRuleProblem('Todos os ingredientes da proposta devem existir no catálogo.'),
            );
          }
          if (canonical.lactoseFree) {
            hasLactoseFreeIngredient = true;
          }
          ingredientsList.push({
            id: canonical.id,
            allergens: canonical.allergens,
            lactoseFree: canonical.lactoseFree,
          });
        }

        if (hasLactoseFreeIngredient && checklist.lactoseFreeChecked !== true) {
          throw new ProblemError(
            businessRuleProblem(
              'A verificação exige lactoseFreeChecked = true quando algum ingrediente é marcado como sem lactose.',
            ),
          );
        }

        const confirmedAllergenFree = checklist.confirmedAllergenFree === true;
        if (existing.data.allergens.length > 0 && confirmedAllergenFree) {
          throw new ProblemError(
            businessRuleProblem(
              'Receita com alérgenos declarados não pode marcar confirmedAllergenFree = true.',
            ),
          );
        }
        if (existing.data.allergens.length === 0 && !confirmedAllergenFree) {
          throw new ProblemError(
            businessRuleProblem(
              'Receita sem alérgenos exige confirmedAllergenFree = true no checklist para ser marcada como verified (RN08).',
            ),
          );
        }

        const invariantViolations = checkInvariants(
          {
            id: existing.id,
            allergens: existing.data.allergens,
            allergenState: 'verified',
            confirmedAllergenFree,
            substitutes: substitutions.map((sub) => ({
              id: sub.id,
              allergens: sub.substituteAllergens,
              allergenState: sub.allergenState,
              confirmedAllergenFree: sub.confirmedAllergenFree,
            })),
          },
          ingredientsList,
        );

        if (invariantViolations.length > 0) {
          throw new ProblemError(
            businessRuleProblem(invariantViolations.map((item) => item.message).join(' ')),
          );
        }

        const updatedData: StoredProposalData = {
          ...existing.data,
          allergenState: 'verified',
        };

        const updated = await this.deps.repository.updateProposal(
          {
            id: proposalId,
            data: updatedData,
            confirmedAllergenFree,
            verificationChecklist: checklist,
            verifiedBy: curatorId,
            verifiedAt: now,
            updatedAt: now,
          },
          tx,
        );

        if (updated.publicationState === 'approved' && updated.photo) {
          await this.deps.catalogWrite.updatePublishedRecipe(
            {
              dishId: updated.id,
              name: updated.data.name,
              cuisineId: updated.data.cuisineId,
              baseDishId: updated.data.baseDishId,
              prepTimeMinutes: updated.data.prepTimeMinutes,
              difficulty: updated.data.difficulty,
              ingredients: updated.data.ingredients.map((item) => ({
                ingredientId: item.ingredientId,
                quantity: item.quantity ?? null,
                unit: item.unit ?? null,
              })),
              utensilIds: updated.data.utensilIds,
              steps: updated.data.steps,
              allergens: updated.data.allergens,
              allergenState: updated.data.allergenState,
              confirmedAllergenFree: updated.confirmedAllergenFree,
              allergensUpdatedAt: now,
              sourceName: updated.data.sourceName,
              sourceUrl: updated.data.sourceUrl,
              origin: updated.origin,
              photo: updated.photo,
              now,
            },
            tx,
          );
        }

        return { statusCode: 200, body: toProposalResponse(updated) };
      },
    });
  }

  async approveProposal(
    curatorId: string,
    idempotencyKey: string,
    proposalId: string,
  ): Promise<IdempotentResult<ProposalResponseDto>> {
    return this.executeIdempotent({
      accountId: curatorId,
      idempotencyKey,
      endpoint: `POST /v1/curation/proposals/${proposalId}/approve`,
      payload: { proposalId },
      work: async (tx, now) => {
        const existing = await this.deps.repository.findProposalById(proposalId, tx);
        if (!existing) {
          throw new ProblemError(notFoundProblem('Proposta não encontrada.'));
        }
        if (existing.publicationState === 'deactivated') {
          throw new ProblemError(
            businessRuleProblem('Não é possível aprovar uma proposta descartada.'),
          );
        }
        if (existing.publicationState === 'approved') {
          return { statusCode: 200, body: toProposalResponse(existing) };
        }

        const violations = await this.runPublicationGateForProposal(
          existing.id,
          existing.data,
          existing.confirmedAllergenFree,
          existing.photo,
          tx,
        );

        if (violations.length > 0) {
          throw new ProblemError(publicationGateProblem(violations));
        }

        // Photo presence is guaranteed once PublicationGate passes with 0 violations.
        const approvedPhoto = existing.photo!;

        const updated = await this.deps.repository.updateProposal(
          {
            id: existing.id,
            publicationState: 'approved',
            approvedBy: curatorId,
            approvedAt: now,
            updatedAt: now,
          },
          tx,
        );

        await this.deps.catalogWrite.publishApprovedDish(
          {
            dishId: updated.id,
            name: updated.data.name,
            cuisineId: updated.data.cuisineId,
            baseDishId: updated.data.baseDishId,
            prepTimeMinutes: updated.data.prepTimeMinutes,
            difficulty: updated.data.difficulty,
            ingredients: updated.data.ingredients.map((item) => ({
              ingredientId: item.ingredientId,
              quantity: item.quantity ?? null,
              unit: item.unit ?? null,
            })),
            utensilIds: updated.data.utensilIds,
            steps: updated.data.steps,
            allergens: updated.data.allergens,
            allergenState: updated.data.allergenState,
            confirmedAllergenFree: updated.confirmedAllergenFree,
            allergensUpdatedAt: updated.verifiedAt ?? now,
            sourceName: updated.data.sourceName,
            sourceUrl: updated.data.sourceUrl,
            origin: updated.origin,
            photo: approvedPhoto,
            now,
          },
          tx,
        );

        return { statusCode: 200, body: toProposalResponse(updated) };
      },
    });
  }

  async discardProposal(
    curatorId: string,
    idempotencyKey: string,
    proposalId: string,
  ): Promise<IdempotentResult<null>> {
    return this.executeIdempotent({
      accountId: curatorId,
      idempotencyKey,
      endpoint: `POST /v1/curation/proposals/${proposalId}/discard`,
      payload: { proposalId },
      work: async (tx, now) => {
        const existing = await this.deps.repository.findProposalById(proposalId, tx);
        if (!existing) {
          throw new ProblemError(notFoundProblem('Proposta não encontrada.'));
        }
        if (existing.publicationState === 'approved') {
          throw new ProblemError(
            businessRuleProblem(
              'Pratos já aprovados não podem ser descartados por esta rota (RN21).',
            ),
          );
        }

        if (existing.publicationState !== 'deactivated') {
          await this.deps.repository.updateProposal(
            {
              id: proposalId,
              publicationState: 'deactivated',
              updatedAt: now,
            },
            tx,
          );
        }

        return { statusCode: 204, body: null };
      },
    });
  }
}
