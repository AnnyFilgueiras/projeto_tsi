import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import { router } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import { BackHandler } from 'react-native';
import type { MobileDependencies } from '../src/app/composition';
import {
  approvalMarksKitchenNews,
  completionFinishesCooking,
  profileChangesInvalidate,
} from '../src/app/composition/feature-ports';
import { createKitchenNews } from '../src/app/composition/kitchen-news';
import { LOCAL_MIGRATIONS } from '../src/core/local-db/migrations';
import { runMigrations } from '../src/core/local-db/migrator';
import { createFetchHttpClient } from '../src/core/network/fetch-http-client-adapter';
import { createDirectOnlineOperationEnqueuer } from '../src/core/sync/direct-online-operation-enqueuer-adapter';
import { createOnboardingRepository } from '../src/features/profile/data/onboarding-repository';
import { createProfileRepository } from '../src/features/profile/data/profile-repository';
import { restrictionProjectors } from '../src/features/profile/data/restriction-repository';
import { createRegisterRestrictions } from '../src/features/profile/domain/register-restrictions';
import { createRevokeRestriction } from '../src/features/profile/domain/revoke-restriction';
import { createProgressRepository } from '../src/features/progress/data/progress-repository';
import { projectRatingRegistered } from '../src/features/progress/data/rating-repository';
import { loadRatingContext } from '../src/features/progress/domain/rating-context';
import { createRegisterRating } from '../src/features/progress/domain/register-rating';
import { createCandidatesReader } from '../src/features/recipe/data/candidates-reader';
import { createCookingStateRepository } from '../src/features/recipe/data/cooking-state-repository';
import { createRecipeRepository } from '../src/features/recipe/data/recipe-repository';
import { createRecipeFeature } from '../src/features/recipe/domain';
import { createSuggestionsGateway } from '../src/features/suggestions/data/suggestions-gateway';
import { createSuggestionsLocalStore } from '../src/features/suggestions/data/suggestions-local-store';
import { createSuggestionRound } from '../src/features/suggestions/domain/suggestion-round';
import { seedCatalog } from './progress/fixtures';
import { recipe } from './recipe/fixtures';
import { createFakeFetch, type RecordedRequest } from './support/fake-fetch';
import { createFakeLocalDatabase, type FakeLocalDatabase } from './support/fake-local-database';
import { createFakeTokenStore, tokenPair } from './support/fake-token-store';

// The real composition root opens SQLCipher and SecureStore, which only exist in the native build.
const mockCreateDependencies = jest.fn<Promise<MobileDependencies>, []>();
jest.mock('../src/app/composition', () => ({
  createMobileDependencies: () => mockCreateDependencies(),
}));

async function fakeDependencies(db: FakeLocalDatabase): Promise<MobileDependencies> {
  return {
    localDatabase: db,
    onboarding: createOnboardingRepository(db),
    profile: {
      prepareAccount: async () => 'ready',
      registerRestrictions: async () => ({ status: 'saved' }),
      listCuisines: async () => [],
      saveCulinaryPreferences: async () => 'saved',
      readProfile: createProfileRepository(db).read,
      revokeRestriction: async () => ({ status: 'removed' }),
      savePreferences: async () => 'saved',
    },
    // An empty round: the Discover tab renders its "round over" state without network.
    suggestions: {
      loadSuggestions: async () => ({
        status: 'ready',
        cards: [],
        position: 1,
        total: 0,
        hasRestrictions: false,
      }),
      approveSuggestion: async () => 'done',
      discardSuggestion: async () => 'done',
      snapshot: () => ({ cards: [], position: 1, total: 0, hasRestrictions: false }),
      photoUri: async () => null,
      invalidate: () => undefined,
      version: () => 0,
    },
    recipe: {
      loadRecipe: async () => ({ status: 'not-found' }),
      startCooking: async () => ({ status: 'not-found' }),
      saveStep: async () => undefined,
      loadKitchen: async () => ({ cooking: [], candidates: [] }),
    },
    // No catalog yet: the Rating modal falls back to its generic title.
    progress: {
      registerRating: { execute: async () => ({ status: 'offline', opId: 'op-1' }) },
      loadRatingContext: async () => ({ dishName: null, previousCount: 0 }),
      snapshots: createProgressRepository(db),
      collection: createProgressRepository(db),
    },
    kitchenNews: createKitchenNews(),
    syncInBackground: async () => undefined,
  } as Partial<MobileDependencies> as MobileDependencies;
}

describe('Navigation shell (MVP-01: onboarding + 4 fixed tabs, A8)', () => {
  let db: FakeLocalDatabase;

  beforeEach(async () => {
    db = createFakeLocalDatabase();
    await runMigrations(db, LOCAL_MIGRATIONS);
    mockCreateDependencies.mockImplementation(() => fakeDependencies(db));
  });

  afterEach(() => db.close());

  it('shows onboarding on first launch and enters the tabs when it ends', async () => {
    renderRouter('./app', { initialUrl: '/' });

    fireEvent.press(await screen.findByRole('button', { name: 'Começar' }));
    fireEvent.press(await screen.findByRole('button', { name: 'Não tenho restrições' }));
    fireEvent.press(await screen.findByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText('Rodada concluída')).toBeTruthy();
    expect(db.rows('SELECT onboarded_at FROM profile_local')).toHaveLength(1);
  });

  it('opens straight into the four tabs once onboarding is done', async () => {
    await db.execute("INSERT INTO profile_local (id, onboarded_at) VALUES (1, '2026-11-23')");

    renderRouter('./app', { initialUrl: '/' });

    expect(await screen.findByText('Rodada concluída')).toBeTruthy();
    for (const label of ['Descobrir', 'Cozinha', 'Coleção', 'Perfil']) {
      expect(screen.getByRole('tab', { name: label })).toBeTruthy();
    }
    expect(screen.getByRole('tab', { name: 'Descobrir' })).toBeSelected();
  });

  it('switches tabs through the shared TabBar', async () => {
    await db.execute("INSERT INTO profile_local (id, onboarded_at) VALUES (1, '2026-11-23')");

    renderRouter('./app', { initialUrl: '/' });

    fireEvent.press(await screen.findByRole('tab', { name: 'Perfil' }));
    expect(await screen.findByText('Conta anônima neste aparelho')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Perfil' })).toBeSelected();
  });

  it('opens the Kitchen tab from the local copy', async () => {
    await db.execute("INSERT INTO profile_local (id, onboarded_at) VALUES (1, '2026-11-23')");

    renderRouter('./app', { initialUrl: '/kitchen' });

    expect(await screen.findByText('Nenhum prato ainda')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Cozinha' })).toBeSelected();
  });

  it('opens the Collection tab straight on the sub-view named by `view` (#85)', async () => {
    await db.execute("INSERT INTO profile_local (id, onboarded_at) VALUES (1, '2026-11-23')");

    renderRouter('./app', { initialUrl: '/collection?view=badges' });

    expect(await screen.findByRole('tab', { name: 'Badges', selected: true })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Coleção' })).toBeSelected();

    fireEvent.press(screen.getByRole('tab', { name: 'Histórico' }));
    expect(await screen.findByText('Sua coleção começa no primeiro prato avaliado.')).toBeTruthy();
    expect(screen).toHaveSearchParams({ view: 'history' });
  });

  it('labels active restrictions on the Profile tab from the rules entrypoint (A7)', async () => {
    await db.execute("INSERT INTO profile_local (id, onboarded_at) VALUES (1, '2026-11-23')");
    await db.execute(
      "INSERT INTO restrictions_local (restriction_type, consent_at) VALUES ('amendoim', '2026-11-23T14:05:00.000Z')",
    );

    renderRouter('./app', { initialUrl: '/profile' });

    expect(await screen.findByText('Amendoim')).toBeTruthy();
  });

  it.each([
    ['/recipe/dish-1', 'Receita'],
    ['/recipe/dish-1/rate', 'Avaliar prato'],
    // Empty local copy: the Celebration falls back to its generic confirmation.
    ['/recipe/dish-1/celebrate', 'Avaliação salva!'],
  ])('%s renders "%s" without the tab bar (§1.1)', async (initialUrl, title) => {
    await db.execute("INSERT INTO profile_local (id, onboarded_at) VALUES (1, '2026-11-23')");

    renderRouter('./app', { initialUrl });

    expect(await screen.findByRole('header', { name: title })).toBeTruthy();
    expect(screen.queryByRole('tab')).toBeNull();
  });

  it.each([
    ['Voltar para Cozinha', '/kitchen', {}],
    ['Ver na Coleção', '/collection', { view: 'cuisines' }],
  ])('"%s" closes the Celebration onto %s (§9)', async (action, pathname, params) => {
    await db.execute("INSERT INTO profile_local (id, onboarded_at) VALUES (1, '2026-11-23')");
    const view = renderRouter('./app', { initialUrl: '/kitchen' });
    await screen.findByText('Nenhum prato ainda');
    // Real flow: Kitchen → recipe → rating, which is replaced by the Celebration (#83 contract).
    act(() => router.push('/recipe/dish-1'));
    act(() => router.push('/recipe/dish-1/rate'));
    act(() => router.replace('/recipe/dish-1/celebrate?ratingId=r-1&evolutions=&badges=&repeat=0'));
    fireEvent.press(await screen.findByRole('button', { name: action }));

    expect(await screen.findByRole('tab', { name: 'Cozinha' })).toBeTruthy();
    expect(screen).toHavePathname(pathname);
    expect(screen).toHaveSearchParams(params);
    // The recipe and its modals are gone from the root stack: back never reopens the sent flow.
    expect(view.getRouterState().routes.map((route) => route.name)).toEqual(['(tabs)']);
  });

  it('Android back on the Celebration goes to the Kitchen only while it is focused (§9)', async () => {
    const listeners = new Set<() => boolean | null | undefined>();
    const spy = jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_, handler) => {
      listeners.add(handler);
      return { remove: () => listeners.delete(handler) };
    });
    const pressBack = () => [...listeners].at(-1)?.();
    await db.execute("INSERT INTO profile_local (id, onboarded_at) VALUES (1, '2026-11-23')");
    const view = renderRouter('./app', { initialUrl: '/kitchen' });
    await screen.findByText('Nenhum prato ainda');
    act(() => router.push('/recipe/dish-1'));
    act(() => router.replace('/recipe/dish-1/celebrate?ratingId=r-1&evolutions=&badges=&repeat=0'));
    await screen.findByText('Avaliação salva!');

    // "Conhecer" pushes the evolution on top: back there returns to the Celebration.
    act(() => router.push('/recipe/dish-2'));
    await screen.findByText('Receita');
    act(() => {
      pressBack();
    });
    await screen.findByText('Avaliação salva!');
    expect(screen.queryByRole('tab')).toBeNull();

    let handled: boolean | null | undefined;
    act(() => {
      handled = pressBack();
    });
    expect(handled).toBe(true);
    expect(await screen.findByRole('tab', { name: 'Cozinha' })).toBeTruthy();
    expect(view.getRouterState().routes.map((route) => route.name)).toEqual(['(tabs)']);
    spy.mockRestore();
  });

  it('serves the dev UI catalog in development builds', async () => {
    renderRouter('./app', { initialUrl: '/dev/ui-catalog' });

    expect(await screen.findByRole('header', { name: 'Catálogo de componentes' })).toBeTruthy();
    // Default + compact fail-closed variants.
    expect(screen.getAllByRole('alert', { name: /Compatibilidade não confirmada/ })).toHaveLength(
      2,
    );
  });
});

const NOW = new Date('2026-11-25T18:00:00.000Z');
const ITALIAN = '00000000-0000-4000-8000-0000000000a1';
const AGLIO = '50000000-0000-4000-8000-000000000001';
const CARBONARA = '50000000-0000-4000-8000-000000000002';
const SUGGESTION = '70000000-0000-4000-8000-000000000001';

const CATALOG = {
  dishes: [
    { id: AGLIO, name: 'Spaghetti Aglio e Olio', cuisineId: ITALIAN, baseDishId: null },
    { id: CARBONARA, name: 'Spaghetti alla Carbonara', cuisineId: ITALIAN, baseDishId: AGLIO },
  ],
  cuisines: [{ id: ITALIAN, name: 'Italiana', continents: ['europa'], totalDishes: 2 }],
  badgeDefinitions: [],
};

const AGLIO_SUMMARY = {
  dishId: AGLIO,
  name: 'Spaghetti Aglio e Olio',
  cuisineId: ITALIAN,
  prepTimeMinutes: 20,
  difficulty: 'easy',
  allergenState: 'verified',
};

const AGLIO_RECIPE = recipe({
  dishId: AGLIO,
  name: 'Spaghetti Aglio e Olio',
  cuisineId: ITALIAN,
  ingredients: [
    {
      ingredientId: 'i-1',
      name: 'Espaguete',
      allergens: [],
      quantity: '200 g',
    },
  ],
  steps: ['Cozinhe a massa.', 'Doure o alho.'],
  allergens: [],
  // RN08: an empty list only counts as allergen-free once a curator confirms it.
  confirmedAllergenFree: true,
});

/**
 * Happy journey of the Onda 1A (#86, A02) with the real features over a fake API and the
 * in-memory database, wired through the same feature ports as the composition root.
 */
async function journeyDependencies(db: FakeLocalDatabase, requests: RecordedRequest[][]) {
  let nextOp = 0;
  const confirmOperations = (request: RecordedRequest) => {
    const { operations } = request.body as {
      operations: { opId: string; type: string }[];
    };
    return {
      status: 200,
      body: {
        results: operations.map(({ opId, type }) => ({
          opId,
          status: 'confirmed',
          repeated: false,
          // RN02: rating the base dish unlocks its evolution.
          unlocks: type === 'rating.register' ? { evolutions: [CARBONARA], badgeAwards: [] } : {},
        })),
        minPackageVersion: PACKAGE_VERSION,
      },
    };
  };
  const api = createFakeFetch({
    'POST /v1/sync/operations': confirmOperations,
    'GET /v1/suggestions': () => ({
      status: 200,
      body: {
        suggestions: [{ id: SUGGESTION, status: 'presented', dish: AGLIO_SUMMARY }],
        noResult: false,
        minPackageVersion: PACKAGE_VERSION,
      },
    }),
    [`POST /v1/suggestions/${SUGGESTION}/approve`]: () => ({
      status: 200,
      body: { id: SUGGESTION, status: 'candidate', dish: AGLIO_SUMMARY },
    }),
    [`GET /v1/recipes/${AGLIO}`]: () => ({ status: 200, body: AGLIO_RECIPE }),
  });
  requests.push(api.requests);
  const http = createFetchHttpClient({
    baseUrl: 'http://api.test',
    fetch: api.fetch,
    tokenStore: createFakeTokenStore(tokenPair('1')),
    packageVersion: PACKAGE_VERSION,
    now: () => NOW,
  });
  const enqueuer = createDirectOnlineOperationEnqueuer({
    http,
    localDatabase: db,
    projectors: { 'rating.register': projectRatingRegistered, ...restrictionProjectors },
    newOperationId: () => `0192f0a0-0000-7000-8000-${String(++nextOp).padStart(12, '0')}`,
    now: () => NOW,
  });
  const noPhotos = { getLocalUri: async () => null, ensureDownloaded: async () => undefined };

  const kitchenNews = createKitchenNews();
  const round = createSuggestionRound({
    gateway: createSuggestionsGateway({ http, sessions: { ensureSession: async () => undefined } }),
    store: createSuggestionsLocalStore(db),
    photos: { localUri: async () => null },
    newIdempotencyKey: () => `key-${++nextOp}`,
  });
  const cooking = createCookingStateRepository(db);
  const progress = createProgressRepository(db);

  const deps = {
    localDatabase: db,
    onboarding: createOnboardingRepository(db),
    profile: profileChangesInvalidate(
      {
        prepareAccount: async () => 'ready' as const,
        registerRestrictions: createRegisterRestrictions({ enqueuer, now: () => NOW }),
        listCuisines: async () => [{ id: ITALIAN, name: 'Italiana' }],
        saveCulinaryPreferences: async () => 'saved' as const,
        readProfile: createProfileRepository(db).read,
        revokeRestriction: createRevokeRestriction({ enqueuer }),
        savePreferences: async () => 'saved' as const,
      },
      round,
    ),
    suggestions: approvalMarksKitchenNews(round, kitchenNews),
    recipe: createRecipeFeature({
      recipes: createRecipeRepository({ http, localDatabase: db, photos: noPhotos }),
      cooking,
      candidates: createCandidatesReader(db),
      now: () => NOW,
    }),
    progress: {
      registerRating: createRegisterRating({
        enqueuer,
        progress,
        completionListener: completionFinishesCooking(cooking),
      }),
      loadRatingContext: (dishId: string) => loadRatingContext(progress, dishId),
      snapshots: progress,
      collection: progress,
    },
    kitchenNews,
    syncInBackground: async () => undefined,
  };
  return deps as Partial<MobileDependencies> as MobileDependencies;
}

describe('Onda 1A happy journey (#86, A02)', () => {
  let db: FakeLocalDatabase;
  let requests: RecordedRequest[][];

  beforeEach(async () => {
    db = createFakeLocalDatabase();
    await runMigrations(db, LOCAL_MIGRATIONS);
    await seedCatalog(db, CATALOG as never);
    requests = [];
    mockCreateDependencies.mockImplementation(() => journeyDependencies(db, requests));
  });

  const suggestionFetches = () =>
    (requests[0] ?? []).filter(
      (request) => request.method === 'GET' && request.url.includes('/v1/suggestions'),
    ).length;

  afterEach(() => db.close());

  const press = async (name: string | RegExp) =>
    fireEvent.press(await screen.findByRole('button', { name }));
  const kitchenTab = () => screen.getByRole('tab', { name: /^Cozinha/ });

  it('onboarding → Discover → Kitchen → recipe → rating → celebration → Collection', async () => {
    renderRouter('./app', { initialUrl: '/' });

    // Onboarding with one restriction (RN09: consent before anything leaves the device).
    await press('Começar');
    fireEvent.press(await screen.findByRole('checkbox', { name: 'Amendoim' }));
    fireEvent.press(
      screen.getByRole('checkbox', { name: 'Concordo com o uso das minhas restrições' }),
    );
    await press('Salvar e continuar');
    await press('Pular');

    // Discover: "Quero cozinhar" puts a dot on the Kitchen tab.
    expect(await screen.findByText('Spaghetti Aglio e Olio')).toBeTruthy();
    expect(kitchenTab()).toHaveAccessibleName('Cozinha');
    await press('Quero cozinhar');
    expect(await screen.findByRole('tab', { name: 'Cozinha, novidade' })).toBeTruthy();

    // Kitchen: focusing the tab clears the dot; the candidate starts cooking.
    fireEvent.press(kitchenTab());
    fireEvent.press(await screen.findByRole('tab', { name: /Candidatas/ }));
    expect(await screen.findByRole('tab', { name: 'Cozinha' })).toBeTruthy();
    await press(/Cozinhar/);

    // Recipe: steps, then finish and rate.
    expect(await screen.findByText('Cozinhe a massa.')).toBeTruthy();
    await press('Próximo ›');
    await press('Concluir e avaliar prato');

    // Rating → Celebration.
    // The star row is hidden from assistive tech (the stepper is the accessible input).
    fireEvent.press(await screen.findByTestId('star-4-right', { includeHiddenElements: true }));
    await press('Salvar avaliação');
    expect(await screen.findByText(/Spaghetti alla Carbonara/)).toBeTruthy();
    await press('Ver na Coleção');

    // Collection shows the completed dish; the evolution is revealed.
    const italian = await screen.findByRole('button', { name: /^Italiana: 1 de 2 pratos/ });
    fireEvent.press(italian);
    expect(
      within(screen.getByTestId(`cuisine-${ITALIAN}`)).getByLabelText(
        'Spaghetti Aglio e Olio, concluído, nota 4 de 5',
      ),
    ).toBeTruthy();
    expect(screen.getByLabelText('Spaghetti alla Carbonara, ainda não preparado')).toBeTruthy();

    // The rated dish left "Em preparo" (#86).
    fireEvent.press(kitchenTab());
    expect(await screen.findByText('Nada em preparo.')).toBeTruthy();
    expect(db.rows('SELECT dish_id FROM local_cooking_state')).toEqual([]);
  });

  it('removing a restriction on the Profile makes Discover fetch a new round', async () => {
    await db.execute("INSERT INTO profile_local (id, onboarded_at) VALUES (1, '2026-11-23')");
    await db.execute(
      "INSERT INTO restrictions_local (restriction_type, consent_at) VALUES ('amendoim', '2026-11-23T14:05:00.000Z')",
    );
    renderRouter('./app', { initialUrl: '/' });
    expect(await screen.findByText('Spaghetti Aglio e Olio')).toBeTruthy();

    // Switching tabs alone keeps the round in memory.
    fireEvent.press(screen.getByRole('tab', { name: 'Perfil' }));
    fireEvent.press(screen.getByRole('tab', { name: 'Descobrir' }));
    expect(await screen.findByText('Spaghetti Aglio e Olio')).toBeTruthy();
    expect(suggestionFetches()).toBe(1);

    fireEvent.press(screen.getByRole('tab', { name: 'Perfil' }));
    await press('Remover Amendoim');
    fireEvent.press(
      within(screen.getByTestId('remove-restriction-sheet')).getByRole('button', {
        name: 'Remover',
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Remover Amendoim' })).toBeNull(),
    );
    fireEvent.press(screen.getByRole('tab', { name: 'Descobrir' }));

    expect(await screen.findByText('Spaghetti Aglio e Olio')).toBeTruthy();
    await waitFor(() => expect(suggestionFetches()).toBe(2));
  });
});
