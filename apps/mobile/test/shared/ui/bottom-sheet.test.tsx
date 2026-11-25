import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BottomSheet } from '../../../src/shared/ui';

describe('BottomSheet', () => {
  it('shows overline, title and content, and closes from "Fechar"', () => {
    const onClose = jest.fn();
    render(
      <BottomSheet visible onClose={onClose} overline="Trocas seguras" title="Ovos">
        <Text>Conteúdo</Text>
      </BottomSheet>,
    );

    expect(screen.getByText('Trocas seguras')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Ovos' })).toBeTruthy();
    expect(screen.getByText('Conteúdo')).toBeTruthy();

    const closers = screen.getAllByRole('button', { name: 'Fechar' });
    fireEvent.press(closers[closers.length - 1]!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
