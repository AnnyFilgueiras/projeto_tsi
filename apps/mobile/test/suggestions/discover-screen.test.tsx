import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import type {
  ActionOutcome,
  LoadOutcome,
  RoundSnapshot,
  SuggestionCardData,
  SuggestionRound,
} from '../../src/features/suggestions/domain/suggestion-round';
import { DiscoverScreen } from '../../src/features/suggestions/ui/DiscoverScreen';
import { SCOPE_BANNER_TEXT } from '../../src/shared/ui/allergen/copy';

function card(n: number, overrides: Partial<SuggestionCardData> = {}): SuggestionCardData {
  return {
    suggestionId: `s-${n}`,
    dishId: `d-${n}`,
    name: `Prato ${n}`,
    cuisineName: 'Tailandesa',
    prepTimeMinutes: 35,
    difficulty: 'medium',
    allergenState: 'verified',
    photoHash: null,
    hint: null,
    ...overrides,
  };
}

/** In-memory round double: `load` and per-action outcomes are scripted by each test. */
function fakeRound(
  initial: readonly SuggestionCardData[],
  options: {
    load?: () => LoadOutcome['status'];
    approve?: () => ActionOutcome;
    discard?: () => ActionOutcome;
    hasRestrictions?: boolean;
  } = {},
): SuggestionRound & { cards: SuggestionCardData[] } {
  const total = initial.length;
  const state = { cards: [...initial] };
  const snapshot = (): RoundSnapshot => ({
    cards: state.cards,
    position: total - state.cards.length + 1,
    total,
    hasRestrictions: options.hasRestrictions ?? false,
  });
  const act = (outcome: ActionOutcome, id: string) => {
    if (outcome === 'done') state.cards = state.cards.filter((c) => c.suggestionId !== id);
    return outcome;
  };
  return {
    get cards() {
      return state.cards;
    },
    async loadSuggestions() {
      const status = options.load?.() ?? 'ready';
      return status === 'ready' ? { status, ...snapshot() } : ({ status } as LoadOutcome);
    },
    approveSuggestion: async (id) => act(options.approve?.() ?? 'done', id),
    discardSuggestion: async (id) => act(options.discard?.() ?? 'done', id),
    snapshot,
    photoUri: async () => null,
    invalidate: () => undefined,
    version: () => 0,
  };
}

function renderScreen(round: SuggestionRound) {
  const handlers = {
    onOpenRecipe: jest.fn(),
    onGoToKitchen: jest.fn(),
    onGoToProfile: jest.fn(),
  };
  render(<DiscoverScreen round={round} {...handlers} />);
  return handlers;
}

describe('DiscoverScreen (UX-01B)', () => {
  it('shows one card with seal (icon + text) outside the photo, meta and position', async () => {
    renderScreen(fakeRound([card(1), card(2)]));

    const shown = await screen.findByTestId('suggestion-card-s-1');
    expect(within(shown).getByText('Prato 1')).toBeTruthy();
    expect(within(shown).getByText('Verificado')).toBeTruthy();
    expect(within(shown).getByText('Tailandesa')).toBeTruthy();
    expect(within(shown).getByText('35 min')).toBeTruthy();
    expect(within(shown).getByText('Média')).toBeTruthy();
    expect(screen.getByText('1 de 2')).toBeTruthy();
    expect(screen.queryByTestId('suggestion-card-s-2')).toBeNull();

    // The seal sits in the card body, not inside the photo button.
    const photo = within(shown).getByRole('button', { name: 'Ver receita de Prato 1' });
    expect(within(photo).queryByTestId('allergen-seal-verified')).toBeNull();
  });

  it('shows the selo for every allergen state', async () => {
    renderScreen(fakeRound([card(1, { allergenState: 'source_declared' })]));

    expect(await screen.findByTestId('allergen-seal-source_declared')).toBeTruthy();
  });

  it('shows the cuisine hint with the bold name', async () => {
    renderScreen(
      fakeRound([card(1, { hint: { kind: 'first-cuisine', cuisineName: 'Tailandesa' } })]),
    );

    const hint = await screen.findByTestId('curiosity-hint');
    expect(within(hint).getByText('Tailandesa')).toBeTruthy();
  });

  it('keeps the evolution a mystery in the hint (#86)', async () => {
    renderScreen(fakeRound([card(1, { hint: { kind: 'evolution' } })]));

    const hint = await screen.findByTestId('curiosity-hint');
    expect(within(hint).getByText('Abre uma evolução misteriosa')).toBeTruthy();
  });

  it('shows the RN16 banner only when the user has restrictions', async () => {
    const { rerender } = render(
      <DiscoverScreen
        round={fakeRound([card(1)])}
        onOpenRecipe={jest.fn()}
        onGoToKitchen={jest.fn()}
        onGoToProfile={jest.fn()}
      />,
    );
    await screen.findByTestId('suggestion-card-s-1');
    expect(screen.queryByText(SCOPE_BANNER_TEXT)).toBeNull();

    rerender(
      <DiscoverScreen
        round={fakeRound([card(1)], { hasRestrictions: true })}
        onOpenRecipe={jest.fn()}
        onGoToKitchen={jest.fn()}
        onGoToProfile={jest.fn()}
      />,
    );
    expect(await screen.findByText(SCOPE_BANNER_TEXT)).toBeTruthy();
  });

  it('opens the recipe from the photo and from the name', async () => {
    const { onOpenRecipe } = renderScreen(fakeRound([card(1)]));

    fireEvent.press(await screen.findByRole('button', { name: 'Ver receita de Prato 1' }));
    fireEvent.press(screen.getByText('Prato 1'));

    expect(onOpenRecipe.mock.calls).toEqual([['d-1'], ['d-1']]);
  });

  it('discard advances to the next card without confirmation', async () => {
    renderScreen(fakeRound([card(1), card(2)]));

    fireEvent.press(await screen.findByRole('button', { name: 'Descartar sugestão' }));

    expect(await screen.findByTestId('suggestion-card-s-2')).toBeTruthy();
    expect(screen.getByText('2 de 2')).toBeTruthy();
  });

  it('approve advances and shows the toast whose "Ver" opens the Kitchen', async () => {
    const { onGoToKitchen } = renderScreen(fakeRound([card(1), card(2)]));

    fireEvent.press(await screen.findByRole('button', { name: 'Quero cozinhar' }));

    expect(await screen.findByText('Foi para Candidatas')).toBeTruthy();
    expect(screen.getByTestId('suggestion-card-s-2')).toBeTruthy();
    fireEvent.press(screen.getByRole('link', { name: 'Ver' }));
    expect(onGoToKitchen).toHaveBeenCalled();
  });

  it.each([
    ['Quero cozinhar', { approve: () => 'offline' as const }],
    ['Descartar sugestão', { discard: () => 'offline' as const }],
  ])('"%s" offline keeps the card and shows the no-connection toast', async (label, options) => {
    renderScreen(fakeRound([card(1), card(2)], options));

    fireEvent.press(await screen.findByRole('button', { name: label }));

    expect(await screen.findByText('Sem conexão. Tente de novo.')).toBeTruthy();
    expect(screen.getByTestId('suggestion-card-s-1')).toBeTruthy();
  });

  it('shows the skeleton while loading', async () => {
    let release: () => void = () => undefined;
    const round = fakeRound([card(1)]);
    const gate = new Promise<void>((resolve) => (release = resolve));
    const slow: SuggestionRound = {
      ...round,
      loadSuggestions: async () => {
        await gate;
        return round.loadSuggestions();
      },
    };
    renderScreen(slow);

    expect(screen.getByTestId('discover-skeleton')).toBeTruthy();
    release();
    expect(await screen.findByTestId('suggestion-card-s-1')).toBeTruthy();
  });

  it('shows the empty state when the round is over, with Kitchen and Profile exits', async () => {
    const handlers = renderScreen(fakeRound([card(1)]));

    fireEvent.press(await screen.findByRole('button', { name: 'Descartar sugestão' }));

    expect(await screen.findByText('Rodada concluída')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Ir para a Cozinha' }));
    fireEvent.press(screen.getByRole('link', { name: 'Ajustar perfil' }));
    expect(handlers.onGoToKitchen).toHaveBeenCalled();
    expect(handlers.onGoToProfile).toHaveBeenCalled();
  });

  it('shows the offline state and retries the load', async () => {
    let online = false;
    renderScreen(fakeRound([card(1)], { load: () => (online ? 'ready' : 'offline') }));

    expect(await screen.findByText('Sem conexão')).toBeTruthy();
    online = true;
    fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(screen.getByTestId('suggestion-card-s-1')).toBeTruthy());
  });

  it('shows the error state when the round cannot be read, instead of loading forever', async () => {
    const round = fakeRound([card(1)]);
    renderScreen({
      ...round,
      loadSuggestions: async () => {
        throw new Error('local read failed');
      },
    });

    expect(await screen.findByText('Algo deu errado')).toBeTruthy();
  });

  it('ignores a second tap while the first decision is still in flight', async () => {
    const round = fakeRound([card(1), card(2), card(3)]);
    const approve = jest.fn(round.approveSuggestion);
    renderScreen({ ...round, approveSuggestion: approve });

    const button = await screen.findByRole('button', { name: 'Quero cozinhar' });
    fireEvent.press(button);
    fireEvent.press(button);

    expect(await screen.findByTestId('suggestion-card-s-2')).toBeTruthy();
    expect(approve).toHaveBeenCalledTimes(1);
  });
});
