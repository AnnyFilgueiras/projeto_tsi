import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import type { MobileDependencies } from '../src/app/composition';
import { LOCAL_MIGRATIONS } from '../src/core/local-db/migrations';
import { runMigrations } from '../src/core/local-db/migrator';
import { createOnboardingRepository } from '../src/features/profile/data/onboarding-repository';
import { createProfileRepository } from '../src/features/profile/data/profile-repository';
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
    ['/recipe/dish-1/rate', 'Avaliação'],
    ['/recipe/dish-1/celebrate', 'Celebração'],
  ])('%s renders "%s" without the tab bar (§1.1)', async (initialUrl, title) => {
    await db.execute("INSERT INTO profile_local (id, onboarded_at) VALUES (1, '2026-11-23')");

    renderRouter('./app', { initialUrl });

    expect(await screen.findByRole('header', { name: title })).toBeTruthy();
    expect(screen.queryByRole('tab')).toBeNull();
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
