import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, spacing, typography } from '../../../../shared/theme';
import {
  Button,
  FieldLabel,
  Notice,
  OfflineBar,
  Pill,
  TextArea,
  Topbar,
} from '../../../../shared/ui';
import type { RatingContext } from '../../domain/rating-context';
import {
  MAX_RATING_TEXT_LENGTH,
  type RegisterRatingInput,
  type RegisterRatingResult,
} from '../../domain/register-rating';
import { ratingCaption } from './rating-caption';
import { StarRatingInput } from './StarRatingInput';

/**
 * Route params of the Celebration (#84): ids as comma-separated lists, `repeat` as '1' | '0'.
 * A type alias, not an interface, so it fits expo-router's string-indexed params.
 */
export type CelebrationParams = {
  readonly dishId: string;
  readonly ratingId: string;
  readonly evolutions: string;
  readonly badges: string;
  readonly repeat: '1' | '0';
};

export interface RatingScreenProps {
  readonly dishId: string;
  readonly loadContext: () => Promise<RatingContext>;
  readonly registerRating: (input: RegisterRatingInput) => Promise<RegisterRatingResult>;
  readonly onSaved: (params: CelebrationParams) => void;
  /** Drops the draft: it only lives in this screen's state. */
  readonly onClose: () => void;
}

type Status = 'editing' | 'sending' | 'offline' | 'error';

/**
 * Full-screen Rating modal (UX-01E §8, US12). Only the score is required; the optional texts
 * and the score stay on screen through every failure, so nothing typed is ever lost.
 */
export function RatingScreen({
  dishId,
  loadContext,
  registerRating,
  onSaved,
  onClose,
}: RatingScreenProps) {
  const [context, setContext] = useState<RatingContext | null>(null);
  const [stars, setStars] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [changes, setChanges] = useState('');
  const [status, setStatus] = useState<Status>('editing');
  // opId of the last attempt that may have reached the server; cleared when the draft changes.
  const retryOpId = useRef<string | undefined>(undefined);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    loadContext()
      .then((loaded) => {
        if (mounted.current) setContext(loaded);
      })
      // Without the context the form still works: generic title and no repeat note.
      .catch(() => undefined);
    return () => {
      mounted.current = false;
    };
  }, [loadContext]);

  const sending = status === 'sending';

  function edit<T>(current: T, setter: (value: T) => void) {
    return (value: T) => {
      // Re-tapping the chosen star is not an edit: dropping the opId then could rate twice (RN06).
      if (sending || value === current) return;
      setter(value);
      // A changed draft is a different rating: it must not reuse the failed attempt's opId.
      retryOpId.current = undefined;
      setStatus('editing');
    };
  }

  async function save() {
    if (stars === null || sending) return;
    setStatus('sending');
    let result: RegisterRatingResult;
    try {
      result = await registerRating({
        dishId,
        stars,
        comment,
        changes,
        ...(retryOpId.current !== undefined && { opId: retryOpId.current }),
      });
    } catch {
      // e.g. an expired session: same short message, the draft stays.
      if (mounted.current) setStatus('error');
      return;
    }
    if (!mounted.current) return;

    if (result.status === 'saved') {
      onSaved({
        dishId,
        ratingId: result.ratingId,
        evolutions: (result.unlocks.evolutions ?? []).join(','),
        badges: (result.unlocks.badgeAwards ?? []).join(','),
        repeat: result.isRepeat ? '1' : '0',
      });
      return;
    }
    if (result.status === 'offline') {
      retryOpId.current = result.opId;
      setStatus('offline');
      return;
    }
    setStatus('error');
  }

  const caption = ratingCaption(stars);
  const previousCount = context?.previousCount ?? 0;

  return (
    <SafeAreaView style={styles.screen}>
      {status === 'offline' ? <OfflineBar message="Sua avaliação continua aqui." /> : null}
      <Topbar
        title={context?.dishName ?? 'Avaliar prato'}
        leading="close"
        onLeadingPress={() => {
          if (!sending) onClose();
        }}
      />
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading} accessibilityRole="header">
            Como ficou?
          </Text>
          {previousCount > 0 ? (
            <Notice
              type="info"
              message={`Você já preparou este prato ${previousCount} ${
                previousCount === 1 ? 'vez' : 'vezes'
              }. Este preparo vira um novo registro.`}
            />
          ) : null}

          <View style={styles.section}>
            <FieldLabel label="Sua nota" hint="obrigatória" />
            <StarRatingInput value={stars} onChange={edit(stars, setStars)} disabled={sending} />
            {caption ? <Text style={styles.caption}>{caption}</Text> : null}
          </View>

          <View style={styles.section}>
            <FieldLabel label="Relato pessoal" hint="opcional" />
            <TextArea
              value={comment}
              onChangeText={edit(comment, setComment)}
              placeholder="Como foi?"
              accessibilityLabel="Relato pessoal"
              maxLength={MAX_RATING_TEXT_LENGTH}
              editable={!sending}
            />
          </View>

          <View style={styles.section}>
            <FieldLabel label="Alterações que eu fiz" hint="opcional" />
            <TextArea
              value={changes}
              onChangeText={edit(changes, setChanges)}
              placeholder="Ex.: troquei o tomilho por ervas de Provence"
              accessibilityLabel="Alterações que eu fiz"
              maxLength={MAX_RATING_TEXT_LENGTH}
              editable={!sending}
            />
            {/* Same rule as the server: only non-blank changes count as an adaptation (RN03h). */}
            {changes.trim() ? (
              <Pill type="unlock" label="Conta para Toque Pessoal" icon="sparkle" />
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {status === 'error' ? (
            <Notice type="error" message="Não deu para salvar. Tente de novo." />
          ) : null}
          <Button
            label={status === 'offline' ? 'Tentar novamente' : 'Salvar avaliação'}
            onPress={save}
            size="lg"
            disabled={stars === null}
            loadingLabel={sending ? 'Salvando…' : undefined}
          />
          {stars === null ? <Text style={styles.caption}>Escolha uma nota para salvar</Text> : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  content: { gap: spacing.md, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  heading: { ...typography.title, color: colors.textPrimary },
  section: { gap: spacing.sm },
  caption: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
