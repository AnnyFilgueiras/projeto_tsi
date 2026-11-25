import type { components } from '../../../core/network/openapi.generated';

/** `GET /v1/recipes/{dishId}` payload, stored whole in `recipes_local.data` (ADR-008 layer 2). */
export type Recipe = components['schemas']['Recipe'];
export type RecipeIngredient = components['schemas']['RecipeIngredient'];
export type IngredientSubstitution = components['schemas']['IngredientSubstitution'];
export type Difficulty = components['schemas']['Difficulty'];
