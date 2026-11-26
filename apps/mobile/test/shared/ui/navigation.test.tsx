import { fireEvent, render, screen } from '@testing-library/react-native';
import { IconButton, TabBar, type TabBarItem, Topbar } from '../../../src/shared/ui';

describe('Topbar', () => {
  it('shows the title as a header with a "Voltar" action', () => {
    const onBack = jest.fn();
    render(<Topbar title="Tian provençal" leading="back" onLeadingPress={onBack} />);

    expect(screen.getByRole('header', { name: 'Tian provençal' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('uses "Fechar" for modals and renders the trailing slot', () => {
    render(<Topbar title="Avaliar" leading="close" onLeadingPress={jest.fn()} trailing={<></>} />);
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeTruthy();
  });

  it('has no leading button without a handler', () => {
    render(<Topbar title="Coleção" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('IconButton', () => {
  it('exposes its label and fires onPress', () => {
    const onPress = jest.fn();
    render(<IconButton icon="close" accessibilityLabel="Descartar sugestão" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Descartar sugestão' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', () => {
    const onPress = jest.fn();
    render(<IconButton icon="plus" accessibilityLabel="Aumentar" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Aumentar' });
    expect(button).toBeDisabled();
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('TabBar', () => {
  const items = (onPress: jest.Mock): TabBarItem[] => [
    { key: 'discover', label: 'Descobrir', icon: 'tab-discover', active: true, onPress },
    {
      key: 'kitchen',
      label: 'Cozinha',
      icon: 'tab-kitchen',
      active: false,
      hasNews: true,
      onPress,
    },
    { key: 'collection', label: 'Coleção', icon: 'tab-collection', active: false, onPress },
    { key: 'profile', label: 'Perfil', icon: 'tab-profile', active: false, onPress },
  ];

  it('always shows the four labels and marks the active tab as selected', () => {
    render(<TabBar items={items(jest.fn())} />);

    for (const label of ['Descobrir', 'Coleção', 'Perfil']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getByRole('tab', { name: 'Descobrir' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Perfil' })).not.toBeSelected();
  });

  it('announces the novelty dot without a counter', () => {
    render(<TabBar items={items(jest.fn())} />);
    expect(screen.getByRole('tab', { name: 'Cozinha, novidade' })).toBeTruthy();
    expect(screen.getByTestId('tab-kitchen-news')).toBeTruthy();
    expect(screen.queryByTestId('tab-discover-news')).toBeNull();
  });

  it('calls the tab handler on press', () => {
    const onPress = jest.fn();
    render(<TabBar items={items(onPress)} />);
    fireEvent.press(screen.getByRole('tab', { name: 'Perfil' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
