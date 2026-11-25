import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../../../shared/theme';
import { ActionSheet, Button, Notice } from '../../../shared/ui';
import { PROFILE_COPY } from './copy';
import type { SheetError } from './sheet-error';

export interface RemoveRestrictionSheetProps {
  /** Label of the restriction being removed; `null` keeps the sheet closed. */
  readonly label: string | null;
  /** Removing the last restriction also withdraws the LGPD consent (RN09). */
  readonly isLast: boolean;
  readonly busy: boolean;
  readonly error: SheetError | null;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export function RemoveRestrictionSheet({
  label,
  isLast,
  busy,
  error,
  onConfirm,
  onCancel,
}: RemoveRestrictionSheetProps) {
  const shown = label ?? '';
  return (
    <ActionSheet
      visible={label !== null}
      onClose={busy ? noop : onCancel}
      title={PROFILE_COPY.removeTitle(shown)}
      testID="remove-restriction-sheet"
      actions={
        <>
          <View style={styles.action}>
            <Button
              label={PROFILE_COPY.cancel}
              variant="secondary"
              onPress={onCancel}
              disabled={busy}
            />
          </View>
          <View style={styles.action}>
            <Button
              label={error ? PROFILE_COPY.retry : PROFILE_COPY.remove}
              variant="danger"
              onPress={onConfirm}
              loadingLabel={busy ? PROFILE_COPY.removing : undefined}
            />
          </View>
        </>
      }
    >
      <Text style={styles.body}>
        {PROFILE_COPY.removeBody(shown)}
        {isLast ? ` ${PROFILE_COPY.removeRevokesConsent}` : ''}
      </Text>
      {error ? (
        <Notice
          type={error === 'offline' ? 'offline' : 'error'}
          message={error === 'offline' ? PROFILE_COPY.offline : PROFILE_COPY.failed}
        />
      ) : null}
    </ActionSheet>
  );
}

function noop() {}

const styles = StyleSheet.create({
  action: { flex: 1 },
  body: { ...typography.body, color: colors.textSecondary },
});
