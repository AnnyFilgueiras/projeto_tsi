import { ALLERGEN_CODES } from '@panelada/allergen-rules/rules';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { AuthGuard } from '../../../shared/auth.js';
import {
  businessRuleProblem,
  payloadTooLargeProblem,
  ProblemError,
  unauthenticatedProblem,
  unsupportedMediaTypeProblem,
  validationProblem,
} from '../../../shared/problem.js';
import type { PhotoLicense } from '../../catalog/public/catalog-read.js';
import { MAX_PHOTO_UPLOAD_BYTES } from './photo-processor.js';
import type { CurationService } from './service.js';

const allergenCodeSchema = z.enum(ALLERGEN_CODES);
const continentSchema = z.enum(['america', 'africa', 'europe', 'asia', 'oceania']);
const difficultySchema = z.enum(['easy', 'medium', 'hard']);
const publicationStateSchema = z.enum(['proposed', 'approved', 'deactivated']);
const editableAllergenStateSchema = z.enum(['source_declared', 'unverified']);
const ALLOWED_PHOTO_LICENSES = new Set<PhotoLicense>([
  'public_domain',
  'cc0',
  'cc_by',
  'cc_by_sa',
  'own_work',
]);

const uuidSchema = z.string().uuid();

const httpUrlSchema = z
  .string()
  .url()
  .refine(
    (value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'A URL deve usar protocolo http ou https.' },
  );

const registerIngredientBodySchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    allergens: z.array(allergenCodeSchema),
    lactoseFree: z.boolean().optional().default(false),
  })
  .strict();

const registerUtensilBodySchema = z
  .object({
    name: z.string().trim().min(2).max(80),
  })
  .strict();

const registerCuisineBodySchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    continents: z.array(continentSchema).min(1),
  })
  .strict();

const registerSubstitutionBodySchema = z
  .object({
    ingredientId: z.string().uuid(),
    substituteId: z.string().uuid(),
    substituteAllergens: z.array(allergenCodeSchema),
  })
  .strict();

const proposalIngredientSchema = z
  .object({
    ingredientId: z.string().uuid(),
    quantity: z.string().nullable().optional(),
    unit: z.string().nullable().optional(),
  })
  .strict();

const proposalInputBodySchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    cuisineId: z.string().uuid(),
    baseDishId: z.string().uuid().nullable().optional(),
    prepTimeMinutes: z.number().int().min(1),
    difficulty: difficultySchema,
    ingredients: z.array(proposalIngredientSchema).min(1),
    utensilIds: z.array(z.string().uuid()).optional().default([]),
    steps: z.array(z.string().trim().min(1).max(2000)).min(1),
    allergens: z.array(allergenCodeSchema),
    allergenState: editableAllergenStateSchema,
    sourceName: z.string().trim().min(2).max(200),
    sourceUrl: httpUrlSchema,
  })
  .strict();

const proposalEditBodySchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    cuisineId: z.string().uuid().optional(),
    baseDishId: z.string().uuid().nullable().optional(),
    prepTimeMinutes: z.number().int().min(1).optional(),
    difficulty: difficultySchema.optional(),
    ingredients: z.array(proposalIngredientSchema).min(1).optional(),
    utensilIds: z.array(z.string().uuid()).optional(),
    steps: z.array(z.string().trim().min(1).max(2000)).min(1).optional(),
    allergens: z.array(allergenCodeSchema).optional(),
    allergenState: editableAllergenStateSchema.optional(),
    sourceName: z.string().trim().min(2).max(200).optional(),
    sourceUrl: httpUrlSchema.optional(),
  })
  .strict();

const verificationChecklistBodySchema = z
  .object({
    checkedIngredients: z.literal(true),
    secondSourceChecked: z.boolean(),
    secondSourceDescription: z.string().max(300).optional(),
    unionChecked: z.literal(true),
    lactoseFreeChecked: z.boolean().optional(),
    confirmedAllergenFree: z.boolean().optional(),
  })
  .strict();

const listProposalsQuerySchema = z.object({
  state: publicationStateSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(50).default(20),
});

const proposalIdParamsSchema = z.object({
  proposalId: z.string().uuid(),
});

function requireCuratorAccountId(request: FastifyRequest): string {
  const principal = request.auth;
  if (!principal) {
    throw new ProblemError(unauthenticatedProblem());
  }
  return principal.accountId;
}

function requireIdempotencyKey(request: FastifyRequest): string {
  const raw = request.headers['idempotency-key'];
  const headerValue = Array.isArray(raw) ? raw[0] : raw;
  const parsed = uuidSchema.safeParse(headerValue);
  if (!parsed.success) {
    throw new ProblemError(
      validationProblem('O cabeçalho Idempotency-Key (UUID válido) é obrigatório.', [
        { field: 'Idempotency-Key', message: 'UUID inválido ou ausente.' },
      ]),
    );
  }
  return parsed.data;
}

function parseBooleanFormField(raw: string | undefined): boolean | null {
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }
  return null;
}

export interface ImporterRoutesDeps {
  readonly curationService: CurationService;
  readonly authGuard: AuthGuard;
}

export function registerImporterRoutes(app: FastifyInstance, deps: ImporterRoutesDeps): void {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const requireCurator = deps.authGuard.requireRole('curator');

  typedApp.post(
    '/v1/curation/ingredients',
    {
      preHandler: requireCurator,
      schema: { body: registerIngredientBodySchema },
    },
    async (request, reply) => {
      const curatorId = requireCuratorAccountId(request);
      const idempotencyKey = requireIdempotencyKey(request);
      const result = await deps.curationService.registerIngredient(
        curatorId,
        idempotencyKey,
        request.body,
      );
      return reply.code(result.statusCode).send(result.body);
    },
  );

  typedApp.post(
    '/v1/curation/utensils',
    {
      preHandler: requireCurator,
      schema: { body: registerUtensilBodySchema },
    },
    async (request, reply) => {
      const curatorId = requireCuratorAccountId(request);
      const idempotencyKey = requireIdempotencyKey(request);
      const result = await deps.curationService.registerUtensil(
        curatorId,
        idempotencyKey,
        request.body,
      );
      return reply.code(result.statusCode).send(result.body);
    },
  );

  typedApp.post(
    '/v1/curation/cuisines',
    {
      preHandler: requireCurator,
      schema: { body: registerCuisineBodySchema },
    },
    async (request, reply) => {
      const curatorId = requireCuratorAccountId(request);
      const idempotencyKey = requireIdempotencyKey(request);
      const result = await deps.curationService.registerCuisine(
        curatorId,
        idempotencyKey,
        request.body,
      );
      return reply.code(result.statusCode).send(result.body);
    },
  );

  typedApp.post(
    '/v1/curation/substitutions',
    {
      preHandler: requireCurator,
      schema: { body: registerSubstitutionBodySchema },
    },
    async (request, reply) => {
      const curatorId = requireCuratorAccountId(request);
      const idempotencyKey = requireIdempotencyKey(request);
      const result = await deps.curationService.registerSubstitution(
        curatorId,
        idempotencyKey,
        request.body,
      );
      return reply.code(result.statusCode).send(result.body);
    },
  );

  typedApp.post(
    '/v1/curation/recipes',
    {
      preHandler: requireCurator,
      schema: { body: proposalInputBodySchema },
    },
    async (request, reply) => {
      const curatorId = requireCuratorAccountId(request);
      const idempotencyKey = requireIdempotencyKey(request);
      const result = await deps.curationService.submitManualRecipe(
        curatorId,
        idempotencyKey,
        request.body,
      );
      return reply.code(result.statusCode).send(result.body);
    },
  );

  typedApp.get(
    '/v1/curation/proposals',
    {
      preHandler: requireCurator,
      schema: { querystring: listProposalsQuerySchema },
    },
    async (request, reply) => {
      const result = await deps.curationService.listProposals(request.query);
      return reply.code(200).send(result);
    },
  );

  typedApp.get(
    '/v1/curation/proposals/:proposalId',
    {
      preHandler: requireCurator,
      schema: { params: proposalIdParamsSchema },
    },
    async (request, reply) => {
      const proposal = await deps.curationService.getProposal(request.params.proposalId);
      return reply.code(200).send(proposal);
    },
  );

  typedApp.patch(
    '/v1/curation/proposals/:proposalId',
    {
      preHandler: requireCurator,
      schema: {
        params: proposalIdParamsSchema,
        body: proposalEditBodySchema,
      },
    },
    async (request, reply) => {
      const proposal = await deps.curationService.editProposal(
        request.params.proposalId,
        request.body,
      );
      return reply.code(200).send(proposal);
    },
  );

  typedApp.put(
    '/v1/curation/proposals/:proposalId/photo',
    {
      preHandler: requireCurator,
      schema: { params: proposalIdParamsSchema },
    },
    async (request, reply) => {
      if (!request.isMultipart()) {
        throw new ProblemError(
          unsupportedMediaTypeProblem('Esta rota exige envio em multipart/form-data.'),
        );
      }

      const fields = new Map<string, string>();
      let imageBytes: Buffer | null = null;

      for await (const part of request.parts()) {
        if (part.type === 'file') {
          if (part.fieldname === 'image') {
            const chunks: Buffer[] = [];
            let total = 0;
            for await (const chunk of part.file) {
              const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
              total += bufferChunk.length;
              if (total > MAX_PHOTO_UPLOAD_BYTES) {
                throw new ProblemError(
                  payloadTooLargeProblem('A foto enviada excede o limite máximo de 5 MB.'),
                );
              }
              chunks.push(bufferChunk);
            }
            if (part.file.truncated) {
              throw new ProblemError(
                payloadTooLargeProblem('A foto enviada excede o limite máximo de 5 MB.'),
              );
            }
            imageBytes = Buffer.concat(chunks);
          } else {
            // Drain unexpected file parts so the multipart stream finishes cleanly.
            for await (const _chunk of part.file) {
              // intentional drain
            }
          }
        } else {
          fields.set(part.fieldname, String(part.value));
        }
      }

      const author = fields.get('author')?.trim() ?? '';
      const sourceUrl = fields.get('sourceUrl')?.trim() ?? '';
      const rawLicense = fields.get('license')?.trim() ?? '';
      const title = fields.get('title')?.trim();
      const licenseUrl = fields.get('licenseUrl')?.trim();
      const modified = parseBooleanFormField(fields.get('modified')?.trim());

      const missingErrors: { field: string; message: string }[] = [];
      if (!imageBytes) {
        missingErrors.push({ field: 'image', message: 'O arquivo de imagem é obrigatório.' });
      }
      if (author.length === 0) {
        missingErrors.push({ field: 'author', message: 'O autor da foto é obrigatório.' });
      }
      if (!httpUrlSchema.safeParse(sourceUrl).success) {
        missingErrors.push({ field: 'sourceUrl', message: 'URL HTTP(S) da fonte inválida.' });
      }
      if (licenseUrl && !httpUrlSchema.safeParse(licenseUrl).success) {
        missingErrors.push({ field: 'licenseUrl', message: 'URL HTTP(S) da licença inválida.' });
      }
      if (rawLicense.length === 0) {
        missingErrors.push({ field: 'license', message: 'A licença da foto é obrigatória.' });
      }
      if (modified === null) {
        missingErrors.push({
          field: 'modified',
          message: 'O campo modified deve ser true ou false.',
        });
      }

      if (missingErrors.length > 0) {
        throw new ProblemError(
          validationProblem('Os metadados da foto enviados são inválidos.', missingErrors),
        );
      }

      // ADR-012 / openapi.yaml: Disallowed licenses (NC, ND, proprietary) return 422 business-rule.
      if (!ALLOWED_PHOTO_LICENSES.has(rawLicense as PhotoLicense)) {
        throw new ProblemError(
          businessRuleProblem(
            'Licença de imagem não aceita (ADR-012). Utilize public_domain, cc0, cc_by, cc_by_sa ou own_work.',
          ),
        );
      }

      const photo = await deps.curationService.attachPhoto(request.params.proposalId, {
        rawBytes: imageBytes!,
        author,
        ...(title ? { title } : {}),
        sourceUrl,
        license: rawLicense as PhotoLicense,
        ...(licenseUrl ? { licenseUrl } : {}),
        modified: modified!,
      });

      return reply.code(200).send(photo);
    },
  );

  typedApp.post(
    '/v1/curation/proposals/:proposalId/verify',
    {
      preHandler: requireCurator,
      schema: {
        params: proposalIdParamsSchema,
        body: verificationChecklistBodySchema,
      },
    },
    async (request, reply) => {
      const curatorId = requireCuratorAccountId(request);
      const idempotencyKey = requireIdempotencyKey(request);
      const result = await deps.curationService.markVerified(
        curatorId,
        idempotencyKey,
        request.params.proposalId,
        request.body,
      );
      return reply.code(result.statusCode).send(result.body);
    },
  );

  typedApp.post(
    '/v1/curation/proposals/:proposalId/approve',
    {
      preHandler: requireCurator,
      schema: { params: proposalIdParamsSchema },
    },
    async (request, reply) => {
      const curatorId = requireCuratorAccountId(request);
      const idempotencyKey = requireIdempotencyKey(request);
      const result = await deps.curationService.approveProposal(
        curatorId,
        idempotencyKey,
        request.params.proposalId,
      );
      return reply.code(result.statusCode).send(result.body);
    },
  );

  typedApp.post(
    '/v1/curation/proposals/:proposalId/discard',
    {
      preHandler: requireCurator,
      schema: { params: proposalIdParamsSchema },
    },
    async (request, reply) => {
      const curatorId = requireCuratorAccountId(request);
      const idempotencyKey = requireIdempotencyKey(request);
      const result = await deps.curationService.discardProposal(
        curatorId,
        idempotencyKey,
        request.params.proposalId,
      );
      if (result.statusCode === 204) {
        return reply.code(204).send();
      }
      return reply.code(result.statusCode).send(result.body);
    },
  );
}
