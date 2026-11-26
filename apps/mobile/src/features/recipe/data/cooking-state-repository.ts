import type { LocalDatabase } from '../../../core/local-db/local-database';
import type { Recipe } from '../domain/model';
import { upsertRecipe } from './recipe-repository';

export interface CookingState {
  readonly dishId: string;
  readonly startedAt: Date;
  readonly currentStep: number;
}

/**
 * "Em preparo" per dish (`local_cooking_state`, migration v2). Device-only state that never syncs
 * (GLOSSARY): losing the database key loses only this.
 */
export interface CookingStateRepository {
  get(dishId: string): Promise<CookingState | null>;
  /**
   * Marks the dish as cooking at step 0. With `download`, the recipe is stored in the same
   * transaction, so a cooking dish always has its offline copy.
   */
  start(dishId: string, at: Date, download?: Recipe): Promise<void>;
  saveStep(dishId: string, step: number): Promise<void>;
  /** Wired to RegisterRating in #86. */
  finish(dishId: string): Promise<void>;
  listActive(): Promise<readonly CookingState[]>;
}

interface Row {
  dish_id: string;
  started_at: string;
  current_step: number;
}

const toState = (row: Row): CookingState => ({
  dishId: row.dish_id,
  startedAt: new Date(row.started_at),
  currentStep: row.current_step,
});

export function createCookingStateRepository(db: LocalDatabase): CookingStateRepository {
  return {
    async get(dishId) {
      const [row] = await db.query<Row>(
        'SELECT dish_id, started_at, current_step FROM local_cooking_state WHERE dish_id = ?',
        [dishId],
      );
      return row ? toState(row) : null;
    },

    async start(dishId, at, download) {
      await db.transaction(async (tx) => {
        if (download) await upsertRecipe(tx, download, at);
        // OR IGNORE: a second start (double tap, Kitchen + Recipe) keeps the saved step.
        await tx.execute(
          'INSERT OR IGNORE INTO local_cooking_state (dish_id, started_at, current_step) VALUES (?, ?, 0)',
          [dishId, at.toISOString()],
        );
      });
    },

    async saveStep(dishId, step) {
      await db.execute('UPDATE local_cooking_state SET current_step = ? WHERE dish_id = ?', [
        step,
        dishId,
      ]);
    },

    async finish(dishId) {
      await db.execute('DELETE FROM local_cooking_state WHERE dish_id = ?', [dishId]);
    },

    async listActive() {
      const rows = await db.query<Row>(
        'SELECT dish_id, started_at, current_step FROM local_cooking_state ORDER BY started_at',
      );
      return rows.map(toState);
    },
  };
}
