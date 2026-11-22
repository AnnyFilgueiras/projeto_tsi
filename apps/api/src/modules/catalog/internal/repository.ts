import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { businessRuleProblem, ProblemError } from '../../../shared/problem.js';
import type { Tx } from '../../../shared/tx.js';
import type {
  ApprovedRecipeDto,
  BaseDishChainInfo,
  CatalogDishSummaryDto,
  CatalogReadPort,
  CuisineDto,
  DishPhotoDto,
  IngredientDto,
  SubstitutionDto,
  UtensilDto,
} from '../public/catalog-read.js';
import type {
  CatalogWritePort,
  CreateCuisineWriteInput,
  CreateIngredientWriteInput,
  CreateSubstitutionWriteInput,
  CreateUtensilWriteInput,
  PublishApprovedDishInput,
} from '../public/catalog-write.js';
import {
  catalogCuisines,
  catalogDishes,
  catalogDishPhotos,
  catalogIngredients,
  catalogIngredientSubstitutions,
  catalogRecipeIngredients,
  catalogRecipes,
  catalogRecipeUtensils,
  catalogUtensils,
} from './schema.js';

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const candidate = error as { code?: string; cause?: { code?: string } };
  return candidate.code === '23505' || candidate.cause?.code === '23505';
}

function asDb(tx: Tx): NodePgDatabase {
  return tx as unknown as NodePgDatabase;
}

export class DrizzleCatalogRepository implements CatalogReadPort, CatalogWritePort {
  constructor(private readonly db: NodePgDatabase) {}

  async getApprovedRecipe(dishId: string): Promise<ApprovedRecipeDto | null> {
    const [dish] = await this.db
      .select()
      .from(catalogDishes)
      .where(and(eq(catalogDishes.id, dishId), eq(catalogDishes.publicationState, 'approved')))
      .limit(1);

    if (!dish) {
      return null;
    }

    const [[recipe], [photo], ingredientRows, utensilRows] = await Promise.all([
      this.db.select().from(catalogRecipes).where(eq(catalogRecipes.dishId, dishId)).limit(1),
      this.db.select().from(catalogDishPhotos).where(eq(catalogDishPhotos.dishId, dishId)).limit(1),
      this.db
        .select({
          ingredientId: catalogRecipeIngredients.ingredientId,
          position: catalogRecipeIngredients.position,
          quantity: catalogRecipeIngredients.quantity,
          unit: catalogRecipeIngredients.unit,
          name: catalogIngredients.name,
          allergens: catalogIngredients.allergens,
        })
        .from(catalogRecipeIngredients)
        .innerJoin(
          catalogIngredients,
          eq(catalogRecipeIngredients.ingredientId, catalogIngredients.id),
        )
        .where(eq(catalogRecipeIngredients.dishId, dishId))
        .orderBy(asc(catalogRecipeIngredients.position)),
      this.db
        .select({
          id: catalogUtensils.id,
          name: catalogUtensils.name,
        })
        .from(catalogRecipeUtensils)
        .innerJoin(catalogUtensils, eq(catalogRecipeUtensils.utensilId, catalogUtensils.id))
        .where(eq(catalogRecipeUtensils.dishId, dishId))
        .orderBy(asc(catalogUtensils.name)),
    ]);

    if (!recipe || !photo) {
      return null;
    }

    const ingredientIds = ingredientRows.map((row) => row.ingredientId);
    const substitutions = await this.getSubstitutionsForIngredients(ingredientIds);

    const photoDto: DishPhotoDto = {
      hash: photo.fileHash,
      author: photo.author,
      ...(photo.title !== null ? { title: photo.title } : {}),
      sourceUrl: photo.sourceUrl,
      license: photo.license,
      ...(photo.licenseUrl !== null ? { licenseUrl: photo.licenseUrl } : {}),
      modified: photo.modified,
    };

    return {
      dishId: dish.id,
      name: dish.name,
      cuisineId: dish.cuisineId,
      baseDishId: dish.baseDishId,
      prepTimeMinutes: recipe.prepTimeMinutes,
      difficulty: recipe.difficulty,
      ingredients: ingredientRows.map((row) => ({
        ingredientId: row.ingredientId,
        name: row.name,
        allergens: row.allergens,
        quantity: row.quantity,
        unit: row.unit,
      })),
      utensils: utensilRows.map((row) => ({ id: row.id, name: row.name })),
      steps: recipe.steps,
      allergens: recipe.allergens,
      allergenState: recipe.allergenState,
      allergensUpdatedAt: recipe.allergensUpdatedAt.toISOString(),
      sourceName: recipe.sourceName,
      sourceUrl: recipe.sourceUrl,
      photo: photoDto,
      substitutions: substitutions.map((item) => ({
        id: item.id,
        ingredientId: item.ingredientId,
        substituteId: item.substituteId,
        substituteName: item.substituteName,
        substituteAllergens: item.substituteAllergens,
        allergenState: item.allergenState,
        origin: item.origin,
      })),
      updatedAt: recipe.updatedAt.toISOString(),
    };
  }

  async listApprovedDishes(): Promise<readonly CatalogDishSummaryDto[]> {
    const rows = await this.db
      .select({
        dishId: catalogDishes.id,
        name: catalogDishes.name,
        cuisineId: catalogDishes.cuisineId,
        baseDishId: catalogDishes.baseDishId,
        prepTimeMinutes: catalogRecipes.prepTimeMinutes,
        difficulty: catalogRecipes.difficulty,
        allergens: catalogRecipes.allergens,
        allergenState: catalogRecipes.allergenState,
        confirmedAllergenFree: catalogRecipes.confirmedAllergenFree,
        photoHash: catalogDishPhotos.fileHash,
      })
      .from(catalogDishes)
      .innerJoin(catalogRecipes, eq(catalogDishes.id, catalogRecipes.dishId))
      .leftJoin(catalogDishPhotos, eq(catalogDishes.id, catalogDishPhotos.dishId))
      .where(eq(catalogDishes.publicationState, 'approved'))
      .orderBy(asc(catalogDishes.name));

    return rows.map((row) => ({
      dishId: row.dishId,
      name: row.name,
      cuisineId: row.cuisineId,
      baseDishId: row.baseDishId,
      prepTimeMinutes: row.prepTimeMinutes,
      difficulty: row.difficulty,
      allergens: row.allergens,
      allergenState: row.allergenState,
      confirmedAllergenFree: row.confirmedAllergenFree,
      photoHash: row.photoHash ?? null,
    }));
  }

  async getCuisineById(cuisineId: string, tx?: Tx): Promise<CuisineDto | null> {
    const executor = tx ? asDb(tx) : this.db;
    const [row] = await executor
      .select()
      .from(catalogCuisines)
      .where(eq(catalogCuisines.id, cuisineId))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      continents: row.continents,
    };
  }

  async getIngredientsByIds(
    ids: readonly string[],
    tx?: Tx,
  ): Promise<ReadonlyMap<string, IngredientDto>> {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) {
      return new Map();
    }

    const executor = tx ? asDb(tx) : this.db;
    const rows = await executor
      .select()
      .from(catalogIngredients)
      .where(inArray(catalogIngredients.id, uniqueIds));

    const map = new Map<string, IngredientDto>();
    for (const row of rows) {
      map.set(row.id, {
        id: row.id,
        name: row.name,
        allergens: row.allergens,
        lactoseFree: row.lactoseFree,
      });
    }
    return map;
  }

  async getUtensilsByIds(
    ids: readonly string[],
    tx?: Tx,
  ): Promise<ReadonlyMap<string, UtensilDto>> {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) {
      return new Map();
    }

    const executor = tx ? asDb(tx) : this.db;
    const rows = await executor
      .select()
      .from(catalogUtensils)
      .where(inArray(catalogUtensils.id, uniqueIds));

    const map = new Map<string, UtensilDto>();
    for (const row of rows) {
      map.set(row.id, {
        id: row.id,
        name: row.name,
      });
    }
    return map;
  }

  async getSubstitutionsForIngredients(
    ingredientIds: readonly string[],
    tx?: Tx,
  ): Promise<readonly SubstitutionDto[]> {
    const uniqueIds = [...new Set(ingredientIds)];
    if (uniqueIds.length === 0) {
      return [];
    }

    const executor = tx ? asDb(tx) : this.db;
    const rows = await executor
      .select({
        id: catalogIngredientSubstitutions.id,
        ingredientId: catalogIngredientSubstitutions.ingredientId,
        substituteId: catalogIngredientSubstitutions.substituteId,
        substituteName: catalogIngredients.name,
        substituteAllergens: catalogIngredientSubstitutions.substituteAllergens,
        allergenState: catalogIngredientSubstitutions.allergenState,
        confirmedAllergenFree: catalogIngredientSubstitutions.confirmedAllergenFree,
        origin: catalogIngredientSubstitutions.origin,
      })
      .from(catalogIngredientSubstitutions)
      .innerJoin(
        catalogIngredients,
        eq(catalogIngredientSubstitutions.substituteId, catalogIngredients.id),
      )
      .where(inArray(catalogIngredientSubstitutions.ingredientId, uniqueIds))
      .orderBy(asc(catalogIngredients.name));

    return rows.map((row) => ({
      id: row.id,
      ingredientId: row.ingredientId,
      substituteId: row.substituteId,
      substituteName: row.substituteName,
      substituteAllergens: row.substituteAllergens,
      allergenState: row.allergenState,
      confirmedAllergenFree: row.confirmedAllergenFree,
      origin: row.origin,
    }));
  }

  async getBaseDishChain(
    baseDishId: string,
    candidateDishId: string,
    maxDepth = 10,
    tx?: Tx,
  ): Promise<BaseDishChainInfo> {
    if (baseDishId === candidateDishId) {
      return { exists: true, depthFromRoot: 1, hasCycle: true, descendantDepth: 0 };
    }

    const executor = tx ? asDb(tx) : this.db;
    const visited = new Set<string>([candidateDishId]);
    let currentId: string | null = baseDishId;
    let depth = 0;

    while (currentId !== null) {
      if (visited.has(currentId)) {
        return { exists: true, depthFromRoot: depth, hasCycle: true, descendantDepth: 0 };
      }
      visited.add(currentId);

      const [dish] = await executor
        .select({
          id: catalogDishes.id,
          baseDishId: catalogDishes.baseDishId,
          publicationState: catalogDishes.publicationState,
        })
        .from(catalogDishes)
        .where(eq(catalogDishes.id, currentId))
        .limit(1);

      if (!dish || dish.publicationState !== 'approved') {
        return { exists: false, depthFromRoot: depth, hasCycle: false, descendantDepth: 0 };
      }

      depth += 1;
      if (depth > maxDepth) {
        return { exists: true, depthFromRoot: depth, hasCycle: false, descendantDepth: 0 };
      }

      currentId = dish.baseDishId;
    }

    // Also measure approved descendants below candidateDishId so reparenting an already-approved
    // dish cannot create a chain deeper than maxDepth (RN18, ADR-016).
    const descendantResult = await executor.execute(sql`
      WITH RECURSIVE descendants AS (
        SELECT id, 1 AS depth, ARRAY[id] AS path
        FROM catalog_dishes
        WHERE base_dish_id = ${candidateDishId}::uuid
          AND publication_state = 'approved'
        UNION ALL
        SELECT d.id, desc_tree.depth + 1, desc_tree.path || d.id
        FROM catalog_dishes d
        INNER JOIN descendants desc_tree ON d.base_dish_id = desc_tree.id
        WHERE d.publication_state = 'approved'
          AND desc_tree.depth < ${maxDepth + 1}
          AND NOT (d.id = ANY(desc_tree.path))
      )
      SELECT COALESCE(MAX(depth), 0)::int AS max_depth FROM descendants
    `);
    const descendantRow = descendantResult.rows[0] as { max_depth?: number } | undefined;
    const descendantDepth = Number(descendantRow?.max_depth ?? 0);

    return { exists: true, depthFromRoot: depth, hasCycle: false, descendantDepth };
  }

  async getCatalogIndex(): Promise<{
    readonly dishes: readonly CatalogDishSummaryDto[];
    readonly cuisines: readonly CuisineDto[];
  }> {
    const [dishes, cuisineRows] = await Promise.all([
      this.listApprovedDishes(),
      this.db.select().from(catalogCuisines).orderBy(asc(catalogCuisines.name)),
    ]);

    return {
      dishes,
      cuisines: cuisineRows.map((row) => ({
        id: row.id,
        name: row.name,
        continents: row.continents,
      })),
    };
  }

  async createIngredient(input: CreateIngredientWriteInput, tx: Tx): Promise<IngredientDto> {
    const dbTx = asDb(tx);
    try {
      const [inserted] = await dbTx
        .insert(catalogIngredients)
        .values({
          id: input.id,
          name: input.name,
          allergens: [...input.allergens],
          lactoseFree: input.lactoseFree,
        })
        .returning();

      if (!inserted) {
        throw new Error('Failed to insert canonical ingredient.');
      }

      return {
        id: inserted.id,
        name: inserted.name,
        allergens: inserted.allergens,
        lactoseFree: inserted.lactoseFree,
      };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ProblemError(
          businessRuleProblem('Já existe um ingrediente canônico cadastrado com este nome.'),
        );
      }
      throw error;
    }
  }

  async createUtensil(input: CreateUtensilWriteInput, tx: Tx): Promise<UtensilDto> {
    const dbTx = asDb(tx);
    try {
      const [inserted] = await dbTx
        .insert(catalogUtensils)
        .values({
          id: input.id,
          name: input.name,
        })
        .returning();

      if (!inserted) {
        throw new Error('Failed to insert canonical utensil.');
      }

      return {
        id: inserted.id,
        name: inserted.name,
      };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ProblemError(
          businessRuleProblem('Já existe um utensílio cadastrado com este nome.'),
        );
      }
      throw error;
    }
  }

  async createCuisine(input: CreateCuisineWriteInput, tx: Tx): Promise<CuisineDto> {
    const dbTx = asDb(tx);
    try {
      const [inserted] = await dbTx
        .insert(catalogCuisines)
        .values({
          id: input.id,
          name: input.name,
          continents: [...input.continents],
        })
        .returning();

      if (!inserted) {
        throw new Error('Failed to insert cuisine.');
      }

      return {
        id: inserted.id,
        name: inserted.name,
        continents: inserted.continents,
      };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ProblemError(
          businessRuleProblem('Já existe uma culinária cadastrada com este nome.'),
        );
      }
      throw error;
    }
  }

  async createSubstitution(input: CreateSubstitutionWriteInput, tx: Tx): Promise<SubstitutionDto> {
    const dbTx = asDb(tx);

    const [substitute] = await dbTx
      .select({ id: catalogIngredients.id, name: catalogIngredients.name })
      .from(catalogIngredients)
      .where(eq(catalogIngredients.id, input.substituteId))
      .limit(1);

    const [ingredient] = await dbTx
      .select({ id: catalogIngredients.id })
      .from(catalogIngredients)
      .where(eq(catalogIngredients.id, input.ingredientId))
      .limit(1);

    if (!ingredient || !substitute) {
      throw new ProblemError(
        businessRuleProblem('Ingrediente original e substituto devem existir no catálogo.'),
      );
    }

    try {
      const [inserted] = await dbTx
        .insert(catalogIngredientSubstitutions)
        .values({
          id: input.id,
          ingredientId: input.ingredientId,
          substituteId: input.substituteId,
          substituteAllergens: [...input.substituteAllergens],
          allergenState: input.allergenState,
          confirmedAllergenFree: input.confirmedAllergenFree,
          origin: input.origin,
          approvedBy: input.approvedBy,
        })
        .returning();

      if (!inserted) {
        throw new Error('Failed to insert ingredient substitution.');
      }

      return {
        id: inserted.id,
        ingredientId: inserted.ingredientId,
        substituteId: inserted.substituteId,
        substituteName: substitute.name,
        substituteAllergens: inserted.substituteAllergens,
        allergenState: inserted.allergenState,
        confirmedAllergenFree: inserted.confirmedAllergenFree,
        origin: inserted.origin,
      };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ProblemError(
          businessRuleProblem('Esta substituição dirigida já está cadastrada no catálogo.'),
        );
      }
      throw error;
    }
  }

  async publishApprovedDish(input: PublishApprovedDishInput, tx: Tx): Promise<void> {
    await this.upsertApprovedDish(input, tx);
  }

  async updatePublishedRecipe(input: PublishApprovedDishInput, tx: Tx): Promise<void> {
    await this.upsertApprovedDish(input, tx);
  }

  async updatePublishedDishPhoto(
    dishId: string,
    photo: DishPhotoDto,
    now: Date,
    tx: Tx,
  ): Promise<void> {
    const dbTx = asDb(tx);

    await dbTx
      .insert(catalogDishPhotos)
      .values({
        dishId,
        fileHash: photo.hash,
        author: photo.author,
        title: photo.title ?? null,
        sourceUrl: photo.sourceUrl,
        license: photo.license,
        licenseUrl: photo.licenseUrl ?? null,
        modified: photo.modified,
      })
      .onConflictDoUpdate({
        target: catalogDishPhotos.dishId,
        set: {
          fileHash: photo.hash,
          author: photo.author,
          title: photo.title ?? null,
          sourceUrl: photo.sourceUrl,
          license: photo.license,
          licenseUrl: photo.licenseUrl ?? null,
          modified: photo.modified,
        },
      });

    await dbTx.update(catalogDishes).set({ updatedAt: now }).where(eq(catalogDishes.id, dishId));

    await dbTx
      .update(catalogRecipes)
      .set({ updatedAt: now })
      .where(eq(catalogRecipes.dishId, dishId));
  }

  private async upsertApprovedDish(input: PublishApprovedDishInput, tx: Tx): Promise<void> {
    const dbTx = asDb(tx);

    await dbTx
      .insert(catalogDishes)
      .values({
        id: input.dishId,
        name: input.name,
        cuisineId: input.cuisineId,
        baseDishId: input.baseDishId,
        publicationState: 'approved',
        createdAt: input.now,
        updatedAt: input.now,
      })
      .onConflictDoUpdate({
        target: catalogDishes.id,
        set: {
          name: input.name,
          cuisineId: input.cuisineId,
          baseDishId: input.baseDishId,
          publicationState: 'approved',
          updatedAt: input.now,
        },
      });

    await dbTx
      .insert(catalogRecipes)
      .values({
        dishId: input.dishId,
        prepTimeMinutes: input.prepTimeMinutes,
        difficulty: input.difficulty,
        steps: [...input.steps],
        allergens: [...input.allergens],
        allergenState: input.allergenState,
        confirmedAllergenFree: input.confirmedAllergenFree,
        allergensUpdatedAt: input.allergensUpdatedAt,
        sourceName: input.sourceName,
        sourceUrl: input.sourceUrl,
        origin: input.origin,
        updatedAt: input.now,
      })
      .onConflictDoUpdate({
        target: catalogRecipes.dishId,
        set: {
          prepTimeMinutes: input.prepTimeMinutes,
          difficulty: input.difficulty,
          steps: [...input.steps],
          allergens: [...input.allergens],
          allergenState: input.allergenState,
          confirmedAllergenFree: input.confirmedAllergenFree,
          allergensUpdatedAt: input.allergensUpdatedAt,
          sourceName: input.sourceName,
          sourceUrl: input.sourceUrl,
          updatedAt: input.now,
        },
      });

    await dbTx
      .delete(catalogRecipeIngredients)
      .where(eq(catalogRecipeIngredients.dishId, input.dishId));

    if (input.ingredients.length > 0) {
      await dbTx.insert(catalogRecipeIngredients).values(
        input.ingredients.map((item, position) => ({
          dishId: input.dishId,
          ingredientId: item.ingredientId,
          position,
          quantity: item.quantity,
          unit: item.unit,
        })),
      );
    }

    await dbTx.delete(catalogRecipeUtensils).where(eq(catalogRecipeUtensils.dishId, input.dishId));

    const uniqueUtensilIds = [...new Set(input.utensilIds)];
    if (uniqueUtensilIds.length > 0) {
      await dbTx.insert(catalogRecipeUtensils).values(
        uniqueUtensilIds.map((utensilId) => ({
          dishId: input.dishId,
          utensilId,
        })),
      );
    }

    await dbTx
      .insert(catalogDishPhotos)
      .values({
        dishId: input.dishId,
        fileHash: input.photo.hash,
        author: input.photo.author,
        title: input.photo.title ?? null,
        sourceUrl: input.photo.sourceUrl,
        license: input.photo.license,
        licenseUrl: input.photo.licenseUrl ?? null,
        modified: input.photo.modified,
      })
      .onConflictDoUpdate({
        target: catalogDishPhotos.dishId,
        set: {
          fileHash: input.photo.hash,
          author: input.photo.author,
          title: input.photo.title ?? null,
          sourceUrl: input.photo.sourceUrl,
          license: input.photo.license,
          licenseUrl: input.photo.licenseUrl ?? null,
          modified: input.photo.modified,
        },
      });
  }
}
