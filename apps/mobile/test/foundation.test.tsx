import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import { render, screen } from '@testing-library/react-native';
import { FoundationScreen } from '../src/features/suggestions/ui/FoundationScreen';

describe('FoundationScreen (ADR-003, A7)', () => {
  it('renders the app title and allergen rules package version', () => {
    render(<FoundationScreen />);

    expect(screen.getByText('Panelada')).toBeTruthy();
    expect(screen.getByText(`Versão das regras de alérgenos: ${PACKAGE_VERSION}`)).toBeTruthy();
  });
});
