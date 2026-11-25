import { StyleSheet, Text } from 'react-native';
import {
  AllergenSeal,
  BottomSheet,
  IngredientRow,
  Notice,
  colors,
  typography,
} from '../../../shared';
import type { SafeSubstitutes } from '../domain';

export interface SubstitutionsSheetProps {
  readonly ingredientName: string;
  readonly substitutes: SafeSubstitutes;
  readonly onClose: () => void;
}

function hiddenText(count: number): string {
  return count === 1
    ? '1 opção ocultada por conter alérgeno do seu perfil ou não ter verificação.'
    : `${count} opções ocultadas por conter alérgeno do seu perfil ou não ter verificação.`;
}

/** Only catalog swaps approved by `isSubstituteAllowed` (RN15, RN22); never invented ones. */
export function SubstitutionsSheet({
  ingredientName,
  substitutes,
  onClose,
}: SubstitutionsSheetProps) {
  const { allowed, hiddenCount } = substitutes;
  return (
    <BottomSheet
      visible
      onClose={onClose}
      overline="Trocas seguras"
      title={ingredientName}
      testID="substitutions-sheet"
    >
      {allowed.length === 0 ? (
        <Notice
          type="info"
          title="Nenhum substituto seguro cadastrado"
          message="Não inventamos trocas: se precisar adaptar, registre o que fez na avaliação."
        />
      ) : (
        allowed.map((item) => (
          <IngredientRow
            key={item.id}
            name={item.name}
            trailing={<AllergenSeal state={item.allergenState} compact />}
          />
        ))
      )}
      {hiddenCount > 0 ? <Text style={styles.hidden}>{hiddenText(hiddenCount)}</Text> : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  hidden: { ...typography.caption, color: colors.textSecondary },
});
