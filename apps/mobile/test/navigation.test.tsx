import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import type { MobileDependencies } from '../src/app/composition';
import { LOCAL_MIGRATIONS } from '../src/core/local-db/migrations';
import { runMigrations } from '../src/core/local-db/migrator';
import { createOnboardingRepository } from '../src/features/profile/data/onboarding-repository';
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
    checkApi: async () => true,
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

  it('shows onboarding on first launch and enters the tabs after "Começar"', async () => {
    renderRouter('./app', { initialUrl: '/' });

    expect(await screen.findByText('Bem-vindo ao Panelada')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Começar' }));

    expect(
      await screen.findByText('Sugestões de pratos para o seu perfil aparecerão aqui.'),
    ).toBeTruthy();
    expect(db.rows('SELECT onboarded_at FROM profile_local')).toHaveLength(1);
  });

  it('opens straight into the four tabs once onboarding is done', async () => {
    await db.execute("INSERT INTO profile_local (id, onboarded_at) VALUES (1, '2026-11-23')");

    renderRouter('./app', { initialUrl: '/' });

    expect(
      await screen.findByText('Sugestões de pratos para o seu perfil aparecerão aqui.'),
    ).toBeTruthy();
    for (const label of ['Descobrir', 'Cozinha', 'Coleção', 'Perfil']) {
      expect(screen.getByRole('tab', { name: label })).toBeTruthy();
    }
    expect(screen.getByRole('tab', { name: 'Descobrir' })).toBeSelected();
  });

  it('switches tabs through the shared TabBar', async () => {
    await db.execute("INSERT INTO profile_local (id, onboarded_at) VALUES (1, '2026-11-23')");

    renderRouter('./app', { initialUrl: '/' });

    fireEvent.press(await screen.findByRole('tab', { name: 'Perfil' }));
    expect(await screen.findByText('Servidor: conectado')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Perfil' })).toBeSelected();
  });

  it('shows the allergen rules version on the Profile tab (A7 entrypoint bundles)', async () => {
    await db.execute("INSERT INTO profile_local (id, onboarded_at) VALUES (1, '2026-11-23')");

    renderRouter('./app', { initialUrl: '/profile' });

    expect(await screen.findByText(/Versão das regras de alérgenos: 1\.0\.0/)).toBeTruthy();
    expect(await screen.findByText('Servidor: conectado')).toBeTruthy();
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
