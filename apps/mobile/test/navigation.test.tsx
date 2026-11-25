import { router } from 'expo-router';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { BackHandler } from 'react-native';
import type { MobileDependencies } from '../src/app/composition';
import { LOCAL_MIGRATIONS } from '../src/core/local-db/migrations';
import { runMigrations } from '../src/core/local-db/migrator';
import { createOnboardingRepository } from '../src/features/profile/data/onboarding-repository';
import { createProfileRepository } from '../src/features/profile/data/profile-repository';
import { createProgressRepository } from '../src/features/progress/data/progress-repository';
import { createFakeLocalDatabase, type FakeLocalDatabase } from './support/fake-local-database';

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
