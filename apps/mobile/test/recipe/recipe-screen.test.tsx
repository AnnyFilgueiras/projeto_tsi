import type { AllergenCode } from '@panelada/allergen-rules/rules';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import {
  evaluateRecipeSafety,
  type Recipe,
  type RecipeFeature,
  type RecipeView,
} from '../../src/features/recipe/domain';
import { RecipeScreen } from '../../src/features/recipe/ui/RecipeScreen';
import { BASE_DISH_ID, DISH_ID, PEANUT_ID, recipe } from './fixtures';

function downloaded(
  options: {
    data?: Recipe;
    restrictions?: AllergenCode[];
    currentStep?: number | null;
    locked?: boolean;
  } = {},
): RecipeView {
  const data = options.data ?? recipe();
  const restrictions = options.restrictions ?? [];
  return {
    status: 'downloaded',
    recipe: data,
    safety: evaluateRecipeSafety(data, restrictions),
    restrictions,
    evolution: options.locked
      ? { locked: true, baseDish: { id: BASE_DISH_ID, name: 'Aglio e Olio' } }
      : { locked: false, baseDish: null },
    cuisineName: 'Tailandesa',
    photoUri: null,
    downloadedAt: new Date('2026-11-23T09:30:00.000Z'),
    currentStep: options.currentStep === undefined ? null : options.currentStep,
  };
}

function setup(
  views: RecipeView[],
  start: Awaited<ReturnType<RecipeFeature['startCooking']>> = {
    status: 'started',
  },
) {
  const queue = [...views];
  const recipes = {
    loadRecipe: jest.fn(async () => (queue.length > 1 ? queue.shift()! : queue[0]!)),
    startCooking: jest.fn(async () => start),
    saveStep: jest.fn(async () => undefined),
  };
  const callbacks = { onBack: jest.fn(), onOpenDish: jest.fn(), onRate: jest.fn() };
  render(<RecipeScreen dishId={DISH_ID} recipes={recipes} {...callbacks} />);
  return { recipes, ...callbacks };
}

describe('RecipeScreen (UX-01D, §7)', () => {
  it('shows the fail-closed alert on top and above the completion action (A06)', async () => {
    setup([downloaded({ restrictions: ['amendoim'], currentStep: 0 })]);

    const alerts = await screen.findAllByRole('alert');
    expect(alerts).toHaveLength(2);
    expect(
      within(alerts[0]!).getByText('Esta receita contém Amendoim, que está nas suas restrições.'),
    ).toBeTruthy();

    fireEvent.press(screen.getByRole('tab', { name: 'Ingredientes' }));
    expect(screen.getByText('Contém alérgeno do seu perfil')).toBeTruthy();
  });

  it('names the missing verification for an unverified recipe', async () => {
    setup([downloaded({ data: recipe({ allergenState: 'unverified' }), restrictions: ['ovo'] })]);

    expect(
      (await screen.findAllByText('Os alérgenos desta receita ainda não foram verificados.'))
        .length,
    ).toBeGreaterThan(0);
  });

  it('never alerts a user without restrictions but always shows the seal', async () => {
    setup([downloaded()]);

    expect(await screen.findByLabelText('Alérgenos: verificado')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText('Contém alérgeno do seu perfil')).toBeNull();
    expect(screen.getByText('Offline')).toBeTruthy();
  });

  it('lists declared allergens by plain name', async () => {
    setup([
      downloaded({
        data: recipe({ allergens: ['trigo_centeio_cevada_aveia', 'leite', 'lactose'] }),
      }),
    ]);

    expect(
      await screen.findByText('Contém: trigo, centeio, cevada e aveia, leite, lactose'),
    ).toBeTruthy();
  });

  it('opens the seal meaning sheet', async () => {
    setup([downloaded()]);

    fireEvent.press(await screen.findByLabelText('Alérgenos: verificado'));
    expect(screen.getByText('A curadoria conferiu os alérgenos desta receita.')).toBeTruthy();
  });

  it('lists only safe swaps and says how many were hidden (RN22)', async () => {
    const data = recipe({
      substitutions: [
        {
          id: 's1',
          ingredientId: PEANUT_ID,
          substituteId: 'i1',
          substituteName: 'Semente de girassol',
          substituteAllergens: [],
          allergenState: 'verified',
          confirmedAllergenFree: true,
        },
        {
          id: 's2',
          ingredientId: PEANUT_ID,
          substituteId: 'i2',
          substituteName: 'Castanha-de-caju',
          substituteAllergens: ['castanha_caju'],
          allergenState: 'verified',
        },
      ],
    });
    setup([downloaded({ data, restrictions: ['castanha_caju'] })]);

    fireEvent.press(await screen.findByLabelText('Trocas para Amendoim'));

    const sheet = screen.getByTestId('substitutions-sheet');
    expect(within(sheet).getByText('Semente de girassol')).toBeTruthy();
    expect(within(sheet).queryByText('Castanha-de-caju')).toBeNull();
    expect(
      within(sheet).getByText(
        '1 opção ocultada por conter alérgeno do seu perfil ou não ter verificação.',
      ),
    ).toBeTruthy();
  });

  it('says so explicitly when there is no safe swap', async () => {
    setup([downloaded()]);

    fireEvent.press(await screen.findByLabelText('Trocas para Talharim de arroz'));

    expect(screen.getByText('Nenhum substituto seguro cadastrado')).toBeTruthy();
  });

  it('saves every step move and keeps the step across tabs', async () => {
    const { recipes } = setup([downloaded({ currentStep: 1 })]);

    expect(await screen.findByText('Passo 2 de 4')).toBeTruthy();
    fireEvent.press(screen.getByTestId('next-step'));
    expect(recipes.saveStep).toHaveBeenLastCalledWith(DISH_ID, 2);

    fireEvent.press(screen.getByRole('tab', { name: 'Ingredientes' }));
    fireEvent.press(screen.getByRole('tab', { name: 'Passo a passo' }));
    expect(screen.getByText('Passo 3 de 4')).toBeTruthy();

    fireEvent.press(screen.getByLabelText(/^Passo 1,/));
    expect(recipes.saveStep).toHaveBeenLastCalledWith(DISH_ID, 0);
    expect(screen.getByText('Passo 1 de 4')).toBeTruthy();
  });

  it('turns "Próximo" into "Concluir e avaliar prato" on the last step', async () => {
    const { onRate } = setup([downloaded({ currentStep: 3 })]);

    fireEvent.press(await screen.findByTestId('finish-and-rate'));

    expect(screen.queryByTestId('next-step')).toBeNull();
    expect(onRate).toHaveBeenCalled();
  });

  it('disables cooking and rating on a locked evolution and links to the base dish (RN02)', async () => {
    const { onOpenDish } = setup([downloaded({ locked: true })]);

    expect(await screen.findByText(/Evolução bloqueada/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Iniciar passo a passo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Avaliar prato' })).toBeDisabled();
    expect(screen.getByText('Conclua Aglio e Olio para liberar')).toBeTruthy();

    fireEvent.press(screen.getByText('Abrir Aglio e Olio'));
    expect(onOpenDish).toHaveBeenCalledWith(BASE_DISH_ID);
  });

  it('downloads on "Cozinhar agora" and opens the first step', async () => {
    const remote = downloaded();
    const { recipes } = setup([
      { ...remote, status: 'remote' } as RecipeView,
      downloaded({ currentStep: 0 }),
    ]);

    fireEvent.press(await screen.findByRole('button', { name: 'Cozinhar agora' }));

    expect(await screen.findByText('Passo 1 de 4')).toBeTruthy();
    expect(recipes.startCooking).toHaveBeenCalledWith(DISH_ID);
  });

  it('keeps the summary and offers a retry when the download fails offline', async () => {
    const remote = downloaded();
    setup([{ ...remote, status: 'remote' } as RecipeView], { status: 'offline' });

    fireEvent.press(await screen.findByRole('button', { name: 'Cozinhar agora' }));

    await waitFor(() => expect(screen.getByText('Sem conexão agora.')).toBeTruthy());
    expect(screen.getByText('Pad Thai')).toBeTruthy();
    expect(screen.queryByText('Offline')).toBeNull();
  });

  it('shows the offline notice when a not-downloaded recipe cannot be fetched', async () => {
    const { recipes } = setup([{ status: 'offline' }]);

    fireEvent.press(await screen.findByText('Tentar novamente'));

    await waitFor(() => expect(recipes.loadRecipe).toHaveBeenCalledTimes(2));
  });
});
