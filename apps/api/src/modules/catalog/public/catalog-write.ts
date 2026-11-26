import type { AllergenCode, AllergenState } from '@panelada/allergen-rules/rules';
import type { Tx } from '../../../shared/tx.js';
import type {
  CatalogOrigin,
  Continent,
  CuisineDto,
  Difficulty,
  DishPhotoDto,
  IngredientDto,
  SubstitutionDto,
  UtensilDto,
} from './catalog-read.js';

export interface CreateIngredientWriteInput {
  readonly id: string;
  readonly name: string;
  readonly allergens: readonly AllergenCode[];
  readonly lactoseFree: boolean;
}

export interface CreateUtensilWriteInput {
  readonly id: string;
  readonly name: string;
}

export interface CreateCuisineWriteInput {
  readonly id: string;
  readonly name: string;
  readonly continents: readonly Continent[];
}

export interface CreateSubstitutionWriteInput {
  readonly id: string;
  readonly ingredientId: string;
  readonly substituteId: string;
  readonly substituteAllergens: readonly AllergenCode[];
  readonly allergenState: AllergenState;
  readonly confirmedAllergenFree: boolean;
  readonly origin: CatalogOrigin;
  readonly approvedBy: string;
}

export interface PublishRecipeIngredientInput {
  readonly ingredientId: string;
  readonly quantity: string | null;
  readonly unit: string | null;
}

export interface PublishApprovedDishInput {
  readonly dishId: string;
  readonly name: string;
  readonly cuisineId: string;
  readonly baseDishId: string | null;
  readonly prepTimeMinutes: number;
  readonly difficulty: Difficulty;
  readonly ingredients: readonly PublishRecipeIngredientInput[];
  readonly utensilIds: readonly string[];
  readonly steps: readonly string[];
  readonly allergens: readonly AllergenCode[];
  readonly allergenState: AllergenState;
  readonly confirmedAllergenFree: boolean;
  readonly allergensUpdatedAt: Date;
  readonly sourceName: string;
  readonly sourceUrl: string;
  readonly origin: CatalogOrigin;
  readonly photo: DishPhotoDto;
  readonly now: Date;
}

/**
 * Restricted catalog write facade (S4, RN21, T01).
 *
 * Only `modules/importer` (and composition wiring) may import this file.
 * Every write requires a mandatory `tx: Tx` so publication stays atomic.
 */
export interface CatalogWritePort {
  createIngredient(input: CreateIngredientWriteInput, tx: Tx): Promise<IngredientDto>;
  createUtensil(input: CreateUtensilWriteInput, tx: Tx): Promise<UtensilDto>;
  createCuisine(input: CreateCuisineWriteInput, tx: Tx): Promise<CuisineDto>;
  createSubstitution(input: CreateSubstitutionWriteInput, tx: Tx): Promise<SubstitutionDto>;
  publishApprovedDish(input: PublishApprovedDishInput, tx: Tx): Promise<void>;
  updatePublishedRecipe(input: PublishApprovedDishInput, tx: Tx): Promise<void>;
  updatePublishedDishPhoto(dishId: string, photo: DishPhotoDto, now: Date, tx: Tx): Promise<void>;
}
