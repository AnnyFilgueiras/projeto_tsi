import { fireEvent, render, screen } from '@testing-library/react-native';
import { BadgeIcon, FieldLabel, SearchField, Star, Stepper } from '../../../src/shared/ui';

describe('Star', () => {
  it.each(['empty', 'half', 'full'] as const)('renders the %s fill', (fill) => {
    render(<Star fill={fill} />);
    expect(screen.getByTestId(`star-${fill}`)).toBeTruthy();
  });

  it('is a labelled button when tappable', () => {
    const onPress = jest.fn();
    render(<Star fill="empty" onPress={onPress} accessibilityLabel="3 estrelas" />);
    fireEvent.press(screen.getByRole('button', { name: '3 estrelas' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('Stepper', () => {
  it('shows the value with a decimal comma and steps both ways', () => {
    const onDecrease = jest.fn();
    const onIncrease = jest.fn();
    render(<Stepper value={4.5} onDecrease={onDecrease} onIncrease={onIncrease} />);
    expect(screen.getByText('4,5')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Diminuir' }));
    fireEvent.press(screen.getByRole('button', { name: 'Aumentar' }));
    expect(onDecrease).toHaveBeenCalledTimes(1);
    expect(onIncrease).toHaveBeenCalledTimes(1);
  });

  it('disables the buttons at the limits', () => {
    const onIncrease = jest.fn();
    render(<Stepper value={5} onDecrease={jest.fn()} onIncrease={onIncrease} />);
    const increase = screen.getByRole('button', { name: 'Aumentar' });
    expect(increase).toBeDisabled();
    fireEvent.press(increase);
    expect(onIncrease).not.toHaveBeenCalled();
  });
});

describe('FieldLabel', () => {
  it('shows the label and the optional hint', () => {
    render(<FieldLabel label="Sua nota" hint="obrigatória" />);
    expect(screen.getByText('Sua nota')).toBeTruthy();
    expect(screen.getByText('obrigatória')).toBeTruthy();
  });
});

describe('SearchField', () => {
  it('uses the placeholder as accessible name and reports typing', () => {
    const onChangeText = jest.fn();
    render(<SearchField value="" onChangeText={onChangeText} placeholder="Buscar alérgeno" />);
    fireEvent.changeText(screen.getByLabelText('Buscar alérgeno'), 'leite');
    expect(onChangeText).toHaveBeenCalledWith('leite');
  });
});

describe('BadgeIcon', () => {
  it.each([
    ['earned', 'Primeiro prato, conquistado'],
    ['locked', 'Primeiro prato, ainda não conquistado'],
  ] as const)('%s is an image read as "%s"', (state, label) => {
    render(<BadgeIcon state={state} accessibilityLabel={label} />);
    expect(screen.getByRole('image', { name: label })).toBeTruthy();
    expect(screen.getByTestId(`badge-${state}`)).toBeTruthy();
  });
});
