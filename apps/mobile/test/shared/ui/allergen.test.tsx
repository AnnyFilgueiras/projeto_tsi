import { fireEvent, render, screen } from '@testing-library/react-native';
import {
  AllergenScopeBanner,
  AllergenSeal,
  AllergenTag,
  FailClosedAlert,
} from '../../../src/shared/ui';

describe('AllergenSeal (§1.4b)', () => {
  it.each([
    ['verified', 'Verificado', 'Alérgenos: verificado'],
    ['source_declared', 'Declarado pela fonte', 'Alérgenos: declarado pela fonte'],
    ['unverified', 'Não verificado', 'Alérgenos: não verificado'],
  ] as const)('%s shows "%s" and reads "%s"', (state, label, spoken) => {
    render(<AllergenSeal state={state} />);
    expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByLabelText(spoken)).toBeTruthy();
  });

  it('compact hides the text but keeps the full spoken label', () => {
    render(<AllergenSeal state="unverified" compact />);
    expect(screen.queryByText('Não verificado')).toBeNull();
    expect(screen.getByLabelText('Alérgenos: não verificado')).toBeTruthy();
  });

  it('becomes a button when the screen offers the explanation sheet', () => {
    const onPress = jest.fn();
    render(<AllergenSeal state="verified" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Alérgenos: verificado' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('AllergenScopeBanner (§1.4a)', () => {
  it.each(['default', 'compact'] as const)('%s shows the fixed RN16 text', (size) => {
    render(<AllergenScopeBanner size={size} />);
    expect(
      screen.getByText(
        'Verificamos apenas os 19 alérgenos do vocabulário controlado (ANVISA + lactose). Confira sempre o rótulo dos ingredientes.',
      ),
    ).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('FailClosedAlert (§1.4c)', () => {
  it('names a single matched allergen', () => {
    render(<FailClosedAlert reasons={['allergen_match']} matchedAllergens={['amendoim']} />);
    expect(screen.getByText('Compatibilidade não confirmada')).toBeTruthy();
    expect(
      screen.getByText('Esta receita contém Amendoim, que está nas suas restrições.'),
    ).toBeTruthy();
  });

  it('lists several matched allergens in plural', () => {
    render(
      <FailClosedAlert
        reasons={['allergen_match']}
        matchedAllergens={['amendoim', 'soja', 'ovo']}
      />,
    );
    expect(
      screen.getByText('Esta receita contém Amendoim, Soja e Ovos, que estão nas suas restrições.'),
    ).toBeTruthy();
  });

  it.each([
    [['allergen_state_unverified'], 'Os alérgenos desta receita ainda não foram verificados.'],
    [['empty_allergens_unconfirmed'], 'Os alérgenos desta receita ainda não foram verificados.'],
    [['invalid_allergen_code'], 'Os alérgenos desta receita ainda não foram verificados.'],
    [
      ['source_declared_unconfirmed'],
      'A lista de alérgenos vem da fonte original e não foi confirmada pela curadoria.',
    ],
  ] as const)('%j → "%s"', (reasons, text) => {
    render(<FailClosedAlert reasons={reasons} />);
    expect(screen.getByText(text)).toBeTruthy();
  });

  it.each(['default', 'compact'] as const)('%s is an alert with no close button', (size) => {
    render(<FailClosedAlert reasons={['allergen_state_unverified']} size={size} />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('AllergenTag', () => {
  it('shows the fixed text', () => {
    render(<AllergenTag />);
    expect(screen.getByText('Contém alérgeno do seu perfil')).toBeTruthy();
  });
});
