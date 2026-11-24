import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button, type ButtonVariant, TextLink } from '../../../src/shared/ui';

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'unlock', 'danger'];

describe('Button', () => {
  it.each(VARIANTS)('%s fires onPress in both sizes', (variant) => {
    const onPress = jest.fn();
    render(
      <>
        <Button label="Médio" variant={variant} onPress={onPress} />
        <Button label="Grande" variant={variant} size="lg" onPress={onPress} />
      </>,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Médio' }));
    fireEvent.press(screen.getByRole('button', { name: 'Grande' }));
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it.each(VARIANTS)('%s does not fire when disabled', (variant) => {
    const onPress = jest.fn();
    render(<Button label="Salvar" variant={variant} onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Salvar' });
    expect(button).toBeDisabled();
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows the progress label while loading and blocks presses', () => {
    const onPress = jest.fn();
    render(<Button label="Salvar avaliação" loadingLabel="Salvando…" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Salvando…' });
    expect(button).toBeDisabled();
    expect(button).toBeBusy();
    expect(screen.queryByText('Salvar avaliação')).toBeNull();
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders a leading icon without changing the accessible name', () => {
    render(<Button label="Quero cozinhar" icon="plus" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Quero cozinhar' })).toBeTruthy();
  });
});

describe('TextLink', () => {
  it.each(['primary', 'unlock', 'onDark'] as const)('%s tone is a pressable link', (tone) => {
    const onPress = jest.fn();
    render(<TextLink label="Ver" tone={tone} onPress={onPress} />);
    fireEvent.press(screen.getByRole('link', { name: 'Ver' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
