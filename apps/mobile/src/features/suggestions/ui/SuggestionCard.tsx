import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, elevation, radius, spacing, typography } from '../../../shared/theme';
import { AllergenSeal, DishThumb, Icon } from '../../../shared/ui';
import type { SuggestionCardData } from '../domain/suggestion-round';
import { DIFFICULTY_LABELS, DISCOVER_COPY } from './copy';
import { CuriosityHintPill } from './CuriosityHintPill';

export interface SuggestionCardProps {
  readonly card: SuggestionCardData;
  /** Resolves the downloaded photo; null keeps the vector placeholder (no photo or no network). */
  readonly loadPhoto: (photoHash: string) => Promise<string | null>;
  readonly onOpen: (dishId: string) => void;
}

export function SuggestionCard({ card, loadPhoto, onOpen }: SuggestionCardProps) {
  const photoUri = usePhoto(card.photoHash, loadPhoto);
  const open = () => onOpen(card.dishId);

  return (
    <View style={styles.card} testID={`suggestion-card-${card.suggestionId}`}>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={DISCOVER_COPY.openRecipe(card.name)}
      >
        <DishThumb variant="cover" image={photoUri ? { uri: photoUri } : undefined} />
      </Pressable>

      <View style={styles.body}>
        {/* Below the photo, never on it: the seal must not depend on image contrast (§5). */}
        <AllergenSeal state={card.allergenState} />

        <Pressable onPress={open} accessibilityRole="button">
          <Text style={styles.name} numberOfLines={2}>
            {card.name}
          </Text>
        </Pressable>

        <View style={styles.meta}>
          {card.cuisineName ? (
            <>
              <Text style={styles.metaText}>{card.cuisineName}</Text>
              <Text style={styles.metaDot}>·</Text>
            </>
          ) : null}
          <Icon name="clock" size={16} color={colors.textSecondary} />
          <Text style={styles.metaText}>{DISCOVER_COPY.minutes(card.prepTimeMinutes)}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{DIFFICULTY_LABELS[card.difficulty]}</Text>
        </View>

        {card.hint ? <CuriosityHintPill hint={card.hint} /> : null}
      </View>
    </View>
  );
}

function usePhoto(
  photoHash: string | null,
  loadPhoto: (photoHash: string) => Promise<string | null>,
): string | null {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    setUri(null);
    if (!photoHash) return;
    let active = true;
    loadPhoto(photoHash)
      .then((found) => active && setUri(found))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [photoHash, loadPhoto]);

  return uri;
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...elevation.card,
  },
  body: { gap: spacing.sm, padding: spacing.md },
  name: { ...typography.title, color: colors.textPrimary },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
  metaText: { ...typography.caption, color: colors.textSecondary },
  metaDot: { ...typography.caption, color: colors.textMuted },
});
