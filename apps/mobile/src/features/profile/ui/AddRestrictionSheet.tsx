import type { AllergenCode } from '@panelada/allergen-rules/rules';
import { StyleSheet, View } from 'react-native';
import { ActionSheet, Button, Notice } from '../../../shared/ui';
import { AllergenPicker } from './components/AllergenPicker';
import { ConsentCard } from './components/ConsentCard';
import { PROFILE_COPY } from './copy';
import type { SheetError } from './sheet-error';

export interface AddRestrictionSheetProps {
  readonly visible: boolean;
  /** Active codes, left out of the picker. */
  readonly active: readonly AllergenCode[];
  readonly picked: readonly AllergenCode[];
  /** Without an active restriction there is no consent on record, so it must be asked again. */
  readonly needsConsent: boolean;
  readonly consent: boolean;
  readonly consentInvalid: boolean;
  readonly busy: boolean;
  readonly error: SheetError | null;
  readonly onToggle: (code: AllergenCode) => void;
  readonly onConsentChange: (accepted: boolean) => void;
  readonly onSave: () => void;
  readonly onCancel: () => void;
}

export function AddRestrictionSheet(props: AddRestrictionSheetProps) {
  const { busy, error, picked } = props;
  return (
    <ActionSheet
      visible={props.visible}
      onClose={busy ? noop : props.onCancel}
      title={PROFILE_COPY.addRestriction}
      testID="add-restriction-sheet"
      // Pinned, not at the end of the long picker: its "marque o consentimento" error must be
      // visible right where Salvar was pressed.
      footer={
        props.needsConsent && picked.length > 0 ? (
          <ConsentCard
            accepted={props.consent}
            onChange={props.onConsentChange}
            invalid={props.consentInvalid}
          />
        ) : null
      }
      actions={
        <>
          <View style={styles.action}>
            <Button
              label={PROFILE_COPY.cancel}
              variant="secondary"
              onPress={props.onCancel}
              disabled={busy}
            />
          </View>
          <View style={styles.action}>
            <Button
              label={error ? PROFILE_COPY.retry : PROFILE_COPY.save}
              onPress={props.onSave}
              disabled={picked.length === 0}
              loadingLabel={busy ? PROFILE_COPY.saving : undefined}
            />
          </View>
        </>
      }
    >
      <AllergenPicker selected={picked} onToggle={props.onToggle} hidden={props.active} />
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
});
