import { fireEvent, render, screen } from '@testing-library/react-native';
import { DishThumb, IngredientRow, StepItem, SwapButton } from '../../../src/shared/ui';

describe('DishThumb', () => {
  it('draws the vector placeholder when there is no photo', () => {
    render(<DishThumb accessibilityLabel="Tian provençal" />);
    expect(screen.getByTestId('dish-thumb-placeholder')).toBeTruthy();
    expect(screen.getByLabelText('Tian provençal')).toBeTruthy();
  });

  it.each(['thumb', 'cover'] as const)('%s shows the photo when given', (variant) => {
    render(
      <DishThumb
        image={{ uri: 'file:///dish.webp' }}
        variant={variant}
        accessibilityLabel="Foto"
      />,
    );
    expect(screen.queryByTestId('dish-thumb-placeholder')).toBeNull();
    expect(screen.getByRole('image', { name: 'Foto' })).toBeTruthy();
  });
});

describe('IngredientRow', () => {
  it('default shows name and quantity without the allergen tag', () => {
    render(<IngredientRow name="Berinjela" quantity="1 média" />);
    expect(screen.getByText('Berinjela')).toBeTruthy();
    expect(screen.getByText('1 média')).toBeTruthy();
    expect(screen.queryByText('Contém alérgeno do seu perfil')).toBeNull();
  });

  it('restricted adds the fixed allergen tag (text, not only color)', () => {
    render(<IngredientRow name="Queijo" quantity="100 g" restricted />);
    expect(screen.getByText('Contém alérgeno do seu perfil')).toBeTruthy();
  });

  it('renders the trailing swap button', () => {
    const onPress = jest.fn();
    render(
      <IngredientRow
        name="Berinjela"
        trailing={<SwapButton onPress={onPress} accessibilityLabel="Ver trocas para Berinjela" />}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Ver trocas para Berinjela' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('StepItem', () => {
  it.each([
    ['default', 'Passo 1: Separe os ingredientes.'],
    ['done', 'Passo 1, concluído: Separe os ingredientes.'],
    ['next', 'Passo 1, próximo: Separe os ingredientes.'],
    ['current', 'Passo 1, atual: Separe os ingredientes.'],
  ] as const)('%s reads "%s"', (state, spoken) => {
    render(<StepItem number={1} text="Separe os ingredientes." state={state} />);
    expect(screen.getByLabelText(spoken)).toBeTruthy();
  });
});
