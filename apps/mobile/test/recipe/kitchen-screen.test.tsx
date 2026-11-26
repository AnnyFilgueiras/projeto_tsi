import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import type {
  CookingDish,
  KitchenCandidate,
  KitchenView,
  RecipeFeature,
  StartCookingResult,
} from '../../src/features/recipe/domain';
import { KitchenScreen } from '../../src/features/recipe/ui/kitchen/KitchenScreen';
import { BASE_DISH_ID, DISH_ID } from './fixtures';

const THIRD_DISH_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

function cookingDish(overrides: Partial<CookingDish> = {}): CookingDish {
  return {
    dishId: DISH_ID,
    name: 'Pad Thai',
    photoUri: null,
    currentStep: 1,
    stepCount: 4,
    allergenState: 'verified',
    alert: null,
    ...overrides,
  };
}

function candidate(overrides: Partial<KitchenCandidate> = {}): KitchenCandidate {
  return {
    suggestionId: 's-1',
    dishId: BASE_DISH_ID,
    name: 'Aglio e Olio',
    cuisineName: 'Italiana',
    prepTimeMinutes: 20,
    allergenState: 'verified',
    photoUri: null,
    ...overrides,
  };
}

function setup(
  views: KitchenView[],
  start: (dishId: string) => Promise<StartCookingResult> = async () => ({ status: 'started' }),
) {
  const queue = [...views];
  const kitchen: Pick<RecipeFeature, 'loadKitchen' | 'startCooking'> = {
    loadKitchen: jest.fn(async () => (queue.length > 1 ? queue.shift()! : queue[0]!)),
    startCooking: jest.fn(start),
  };
  const callbacks = { onOpenRecipe: jest.fn(), onFinish: jest.fn(), onGoToDiscover: jest.fn() };
  const ui = (refreshKey: number) => (
    <KitchenScreen kitchen={kitchen} refreshKey={refreshKey} {...callbacks} />
  );
  const view = render(ui(0));
  return { kitchen, ...callbacks, refocus: (key: number) => view.rerender(ui(key)) };
}

const tab = (name: string) => screen.getByRole('tab', { name });

describe('KitchenScreen (UX-01C, §6, #81)', () => {
  it('shows a skeleton while the local copy is read', async () => {
    setup([{ cooking: [], candidates: [candidate()] }]);

    expect(screen.getByTestId('kitchen-skeleton')).toBeTruthy();
    expect(await screen.findByText('Aglio e Olio')).toBeTruthy();
  });

  it('opens on "Em preparo" when something is cooking', async () => {
    const { onOpenRecipe, onFinish } = setup([
      { cooking: [cookingDish()], candidates: [candidate()] },
    ]);

    expect(await screen.findByText('Passo 2 de 4')).toBeTruthy();
    expect(tab('Em preparo')).toBeSelected();
    expect(screen.queryByText('Aglio e Olio')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.press(screen.getByRole('link', { name: 'Concluir' }));
    expect(onOpenRecipe).toHaveBeenCalledWith(DISH_ID);
    expect(onFinish).toHaveBeenCalledWith(DISH_ID);
  });

  it('keeps the compact fail-closed alert on a cooking dish (A06)', async () => {
    setup([
      {
        cooking: [
          cookingDish({
            allergenState: 'unverified',
            alert: { reasons: ['allergen_state_unverified'], matchedAllergens: [] },
          }),
        ],
        candidates: [],
      },
    ]);

    expect(await screen.findByTestId('fail-closed-alert')).toBeTruthy();
    expect(screen.getByTestId('allergen-seal-unverified')).toBeTruthy();
  });

  it('switches between the two segments', async () => {
    setup([{ cooking: [cookingDish()], candidates: [candidate()] }]);
    await screen.findByText('Pad Thai');

    fireEvent.press(tab('Candidatas'));

    expect(screen.getByText('Aglio e Olio')).toBeTruthy();
    expect(screen.getByText('Italiana')).toBeTruthy();
    expect(screen.queryByText('Pad Thai')).toBeNull();
    // Something is already cooking: no candidate gets the primary CTA.
    expect(screen.getByRole('button', { name: 'Cozinhar' })).toBeTruthy();
  });

  it('opens on "Candidatas" when nothing is cooking, with one short line under the other tab', async () => {
    setup([{ cooking: [], candidates: [candidate()] }]);

    expect(await screen.findByText('Aglio e Olio')).toBeTruthy();
    expect(tab('Candidatas')).toBeSelected();

    fireEvent.press(tab('Em preparo'));
    expect(screen.getByText('Nada em preparo.')).toBeTruthy();
  });

  it('shows only the empty state, pointing to Discover, when there is nothing at all', async () => {
    const { onGoToDiscover } = setup([{ cooking: [], candidates: [] }]);

    expect(await screen.findByText('Nenhum prato ainda')).toBeTruthy();
    expect(screen.queryByRole('tab')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Descobrir pratos' }));
    expect(onGoToDiscover).toHaveBeenCalled();
  });

  it('downloads and opens the recipe on "Cozinhar", then lands on "Em preparo"', async () => {
    const { kitchen, onOpenRecipe, refocus } = setup([
      { cooking: [], candidates: [candidate()] },
      { cooking: [cookingDish({ dishId: BASE_DISH_ID, name: 'Aglio e Olio' })], candidates: [] },
    ]);

    fireEvent.press(await screen.findByRole('button', { name: 'Cozinhar' }));

    await waitFor(() => expect(onOpenRecipe).toHaveBeenCalledWith(BASE_DISH_ID));
    expect(kitchen.startCooking).toHaveBeenCalledWith(BASE_DISH_ID);

    refocus(1);
    expect(await screen.findByText('Passo 2 de 4')).toBeTruthy();
    expect(tab('Em preparo')).toBeSelected();
  });

  it('shows "Baixando…" on the tapped card while the others stay tappable', async () => {
    let finish: (result: StartCookingResult) => void = () => undefined;
    const { kitchen } = setup(
      [
        {
          cooking: [],
          candidates: [
            candidate(),
            candidate({ suggestionId: 's-2', dishId: THIRD_DISH_ID, name: 'Shakshuka' }),
          ],
        },
      ],
      (dishId) =>
        dishId === BASE_DISH_ID
          ? new Promise((resolve) => (finish = resolve))
          : Promise.resolve({ status: 'offline' }),
    );

    const [first] = await screen.findAllByRole('button', { name: 'Cozinhar' });
    fireEvent.press(first!);

    const busy = await screen.findByRole('button', { name: 'Baixando…' });
    expect(busy).toBeDisabled();
    fireEvent.press(busy);
    expect(kitchen.startCooking).toHaveBeenCalledTimes(1);

    const other = within(screen.getByTestId('candidate-card-s-2'));
    fireEvent.press(other.getByRole('button', { name: 'Cozinhar' }));
    await waitFor(() => expect(kitchen.startCooking).toHaveBeenCalledWith(THIRD_DISH_ID));

    finish({ status: 'started' });
    await waitFor(() => expect(screen.queryByText('Baixando…')).toBeNull());
  });

  it('keeps the candidate and explains inline when there is no network', async () => {
    const { onOpenRecipe } = setup([{ cooking: [], candidates: [candidate()] }], async () => ({
      status: 'offline',
    }));

    fireEvent.press(await screen.findByRole('button', { name: 'Cozinhar' }));

    expect(await screen.findByText('Sem conexão. Tente de novo.')).toBeTruthy();
    expect(screen.getByText('Aglio e Olio')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cozinhar' })).toBeEnabled();
    expect(onOpenRecipe).not.toHaveBeenCalled();
  });

  it('says so when the dish is gone', async () => {
    setup([{ cooking: [], candidates: [candidate()] }], async () => ({ status: 'not-found' }));

    fireEvent.press(await screen.findByRole('button', { name: 'Cozinhar' }));

    expect(await screen.findByText('Este prato não está mais disponível.')).toBeTruthy();
  });

  it('offers a retry when the local copy cannot be read', async () => {
    const loadKitchen = jest
      .fn<Promise<KitchenView>, []>()
      .mockRejectedValueOnce(new Error('locked'))
      .mockResolvedValue({ cooking: [], candidates: [candidate()] });
    render(
      <KitchenScreen
        kitchen={{ loadKitchen, startCooking: jest.fn() }}
        refreshKey={0}
        onOpenRecipe={jest.fn()}
        onFinish={jest.fn()}
        onGoToDiscover={jest.fn()}
      />,
    );

    expect(await screen.findByText('Algo deu errado')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('Aglio e Olio')).toBeTruthy();
  });

  it('ignores an older read that finishes after a newer one', async () => {
    let resolveStale!: (view: KitchenView) => void;
    const loadKitchen = jest
      .fn<Promise<KitchenView>, []>()
      .mockReturnValueOnce(new Promise((resolve) => (resolveStale = resolve)))
      .mockResolvedValue({ cooking: [cookingDish()], candidates: [] });
    const props = {
      kitchen: { loadKitchen, startCooking: jest.fn() },
      onOpenRecipe: jest.fn(),
      onFinish: jest.fn(),
      onGoToDiscover: jest.fn(),
    };
    const view = render(<KitchenScreen {...props} refreshKey={0} />);
    view.rerender(<KitchenScreen {...props} refreshKey={1} />);
    expect(await screen.findByText('Pad Thai')).toBeTruthy();

    await act(async () => resolveStale({ cooking: [], candidates: [candidate()] }));

    expect(screen.getByText('Pad Thai')).toBeTruthy();
    expect(screen.queryByText('Aglio e Olio')).toBeNull();
  });
});
