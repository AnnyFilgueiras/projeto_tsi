import type { AllergenCode, AllergenState } from '@panelada/allergen-rules/rules';
import type { Tx } from '../../../shared/tx.js';

export type Continent = 'america' | 'africa' | 'europe' | 'asia' | 'oceania';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type PublicationState = 'proposed' | 'approved' | 'deactivated';
export type PhotoLicense = 'public_domain' | 'cc0' | 'cc_by' | 'cc_by_sa' | 'own_work';
export type CatalogOrigin = 'manual' | 'ai';

export interface IngredientDto {
  readonly id: string;
  readonly name: string;
  readonly allergens: readonly AllergenCode[];
  readonly lactoseFree: boolean;
}

export interface UtensilDto {
  readonly id: string;
  readonly name: string;
}

export interface CuisineDto {
  readonly id: string;
  readonly name: string;
  readonly continents: readonly Continent[];
}

export interface SubstitutionDto {
  readonly id: string;
  readonly ingredientId: string;
  readonly substituteId: string;
  readonly substituteName: string;
  readonly substituteAllergens: readonly AllergenCode[];
  readonly allergenState: AllergenState;
  readonly confirmedAllergenFree: boolean;
  readonly origin: CatalogOrigin;
}

export interface DishPhotoDto {
  readonly hash: string;
  readonly author: string;
  readonly title?: string;
  readonly sourceUrl: string;
  readonly license: PhotoLicense;
  readonly licenseUrl?: string;
  readonly modified: boolean;
}

export interface RecipeIngredientDto {
  readonly ingredientId: string;
  readonly name: string;
  readonly allergens: readonly AllergenCode[];
  readonly quantity: string | null;
  readonly unit: string | null;
}

export interface ApprovedRecipeDto {
  readonly dishId: string;
  readonly name: string;
  readonly cuisineId: string;
  readonly baseDishId: string | null;
  readonly prepTimeMinutes: number;
  readonly difficulty: Difficulty;
  readonly ingredients: readonly RecipeIngredientDto[];
  readonly utensils: readonly UtensilDto[];
  readonly steps: readonly string[];
  readonly allergens: readonly AllergenCode[];
  readonly allergenState: AllergenState;
  readonly allergensUpdatedAt: string;
  readonly sourceName: string;
  readonly sourceUrl: string;
  readonly photo: DishPhotoDto;
  readonly substitutions: readonly {
    readonly id: string;
    readonly ingredientId: string;
    readonly substituteId: string;
    readonly substituteName: string;
    readonly substituteAllergens: readonly AllergenCode[];
    readonly allergenState: AllergenState;
    readonly origin: CatalogOrigin;
  }[];
  readonly updatedAt: string;
}

export interface CatalogDishSummaryDto {
  readonly dishId: string;
  readonly name: string;
  readonly cuisineId: string;
  readonly baseDishId: string | null;
  readonly prepTimeMinutes: number;
  readonly difficulty: Difficulty;
  readonly allergens: readonly AllergenCode[];
  readonly allergenState: AllergenState;
  readonly confirmedAllergenFree: boolean;
  readonly photoHash: string | null;
}

export interface BaseDishChainInfo {
  readonly exists: boolean;
  readonly depthFromRoot: number;
  readonly hasCycle: boolean;
  readonly descendantDepth: number;
}

/**
 * Public read-only catalog facade (P06, S1, RN21).
 *
 * Only `approved` dishes and canonical reference entities are exposed here;
 * unpublished or discarded proposals never leak into catalog read queries.
 */
export interface CatalogReadPort {
  getApprovedRecipe(dishId: string): Promise<ApprovedRecipeDto | null>;
  listApprovedDishes(): Promise<readonly CatalogDishSummaryDto[]>;
  getCuisineById(cuisineId: string, tx?: Tx): Promise<CuisineDto | null>;
  getIngredientsByIds(ids: readonly string[], tx?: Tx): Promise<ReadonlyMap<string, IngredientDto>>;
  getUtensilsByIds(ids: readonly string[], tx?: Tx): Promise<ReadonlyMap<string, UtensilDto>>;
  getSubstitutionsForIngredients(
    ingredientIds: readonly string[],
    tx?: Tx,
  ): Promise<readonly SubstitutionDto[]>;
  getBaseDishChain(
    baseDishId: string,
    candidateDishId: string,
    maxDepth?: number,
    tx?: Tx,
  ): Promise<BaseDishChainInfo>;
  getCatalogIndex(): Promise<{
    readonly dishes: readonly CatalogDishSummaryDto[];
    readonly cuisines: readonly CuisineDto[];
  }>;
}
