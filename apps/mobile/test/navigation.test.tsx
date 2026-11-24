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
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it('shows the allergen rules version on the Profile tab (A7 entrypoint bundles)', async () => {
    await db.execute("INSERT INTO profile_local (id, onboarded_at) VALUES (1, '2026-11-23')");

    renderRouter('./app', { initialUrl: '/profile' });

    expect(await screen.findByText(/Versão das regras de alérgenos: 1\.0\.0/)).toBeTruthy();
    expect(await screen.findByText('Servidor: conectado')).toBeTruthy();
  });
});
