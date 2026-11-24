import { fireEvent, render, screen } from '@testing-library/react-native';
import { Chip, Pill, SegmentedControl } from '../../../src/shared/ui';

describe('Chip', () => {
  it('reports checked state and toggles via onPress', () => {
    const onPress = jest.fn();
    render(
      <>
        <Chip label="Leite" selected={false} onPress={onPress} />
        <Chip label="Ovos" selected onPress={onPress} />
      </>,
    );
    expect(screen.getByRole('checkbox', { name: 'Leite' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Ovos' })).toBeChecked();
    fireEvent.press(screen.getByRole('checkbox', { name: 'Leite' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', () => {
    const onPress = jest.fn();
    render(<Chip label="Soja" selected={false} onPress={onPress} disabled />);
    fireEvent.press(screen.getByRole('checkbox', { name: 'Soja' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('SegmentedControl', () => {
  it('selects one option and reports changes by key', () => {
    const onChange = jest.fn();
    render(
      <SegmentedControl
        options={[
          { key: 'ingredients', label: 'Ingredientes' },
          { key: 'steps', label: 'Modo de preparo' },
        ]}
        selectedKey="ingredients"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('tab', { name: 'Ingredientes' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Modo de preparo' })).not.toBeSelected();
    fireEvent.press(screen.getByRole('tab', { name: 'Modo de preparo' }));
    expect(onChange).toHaveBeenCalledWith('steps');
  });
});

describe('Pill', () => {
  it.each(['offline', 'unlock', 'soon'] as const)(
    '%s shows its label and is not tappable',
    (type) => {
      render(<Pill type={type} label="Status" />);
      expect(screen.getByText('Status')).toBeTruthy();
      expect(screen.queryByRole('button')).toBeNull();
    },
  );
});
