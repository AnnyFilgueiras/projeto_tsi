export const COLLECTION_VIEWS = ['cuisines', 'evolutions', 'badges', 'history'] as const;

export type CollectionView = (typeof COLLECTION_VIEWS)[number];

/**
 * Reads the `view` route param (e.g. the Celebration opens `?view=badges`). Anything unknown,
 * repeated or missing opens the first sub-view instead of an empty screen.
 */
export function parseCollectionView(value: string | readonly string[] | undefined): CollectionView {
  return COLLECTION_VIEWS.find((view) => view === value) ?? 'cuisines';
}
