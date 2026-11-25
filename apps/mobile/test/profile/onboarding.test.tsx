import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { MobileDependencies, ProfileDependencies } from '../../src/app/composition';
import { LOCAL_MIGRATIONS } from '../../src/core/local-db/migrations';
import { runMigrations } from '../../src/core/local-db/migrator';
import { createFetchHttpClient } from '../../src/core/network/fetch-http-client-adapter';
import { createDirectOnlineOperationEnqueuer } from '../../src/core/sync/direct-online-operation-enqueuer-adapter';
import { createOnboardingRepository } from '../../src/features/profile/data/onboarding-repository';
import { restrictionProjectors } from '../../src/features/profile/data/restriction-repository';
import { createRegisterRestrictions } from '../../src/features/profile/domain/register-restrictions';
import { createFakeFetch, type FakeReply, type RecordedRequest } from '../support/fake-fetch';
import { createFakeLocalDatabase, type FakeLocalDatabase } from '../support/fake-local-database';
import { createFakeTokenStore, tokenPair } from '../support/fake-token-store';

const mockCreateDependencies = jest.fn<Promise<MobileDependencies>, []>();
jest.mock('../../src/app/composition', () => ({
  createMobileDependencies: () => mockCreateDependencies(),
}));

const NOW = new Date('2026-11-24T14:05:00.000Z');
const FR = { id: '00000000-0000-4000-8000-0000000000f1', name: 'Francesa' };
// The fake Discover round below is empty, so Descobrir lands on its "round over" state.
const DISCOVER_TEXT = 'Rodada concluída';

type SyncHandler = (request: RecordedRequest) => FakeReply | Promise<FakeReply>;

const confirmAll: SyncHandler = (request) => ({
  status: 200,
  body: {
    results: (request.body as { operations: { opId: string }[] }).operations.map(({ opId }) => ({
      opId,
      status: 'confirmed',
      repeated: false,
      unlocks: {},
    })),
    minPackageVersion: '1.0.0',
  },
});

describe('Onboarding (UX-01A, US09, RN09, RN10)', () => {
  let db: FakeLocalDatabase;
  let syncHandler: SyncHandler;
  let sync: ReturnType<typeof createFakeFetch>;
  let profile: {
    [K in keyof ProfileDependencies]: jest.Mock;
  };

  beforeEach(async () => {
    db = createFakeLocalDatabase();
    await runMigrations(db, LOCAL_MIGRATIONS);
    syncHandler = confirmAll;
    sync = createFakeFetch({ 'POST /v1/sync/operations': (request) => syncHandler(request) });

    let nextOp = 0;
    const enqueuer = createDirectOnlineOperationEnqueuer({
      http: createFetchHttpClient({
        baseUrl: 'http://api.test',
        fetch: sync.fetch,
        tokenStore: createFakeTokenStore(tokenPair('1')),
        packageVersion: PACKAGE_VERSION,
        now: () => NOW,
      }),
      localDatabase: db,
      projectors: restrictionProjectors,
      newOperationId: () => `0192f0a0-0000-7000-8000-${String(++nextOp).padStart(12, '0')}`,
      now: () => NOW,
    });

    profile = {
      prepareAccount: jest.fn(async () => 'ready'),
      registerRestrictions: jest.fn(createRegisterRestrictions({ enqueuer, now: () => NOW })),
      listCuisines: jest.fn(async () => [FR]),
      saveCulinaryPreferences: jest.fn(async () => 'saved'),
    };

    mockCreateDependencies.mockImplementation(async () => {
      return {
        localDatabase: db,
        onboarding: createOnboardingRepository(db),
        profile: profile as unknown as ProfileDependencies,
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
        checkApi: async () => true,
        syncInBackground: async () => undefined,
      } as Partial<MobileDependencies> as MobileDependencies;
    });
  });

  afterEach(() => db.close());

  const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
  const restrictions = () => db.rows('SELECT restriction_type, consent_at FROM restrictions_local');

  async function reachRestrictions() {
    renderRouter('./app', { initialUrl: '/' });
    fireEvent.press(await screen.findByRole('button', { name: 'Começar' }));
    expect(await screen.findByRole('header', { name: 'Alguma restrição alimentar?' })).toBeTruthy();
  }

  it('short path: 3 taps reach Descobrir with no restriction saved', async () => {
    renderRouter('./app', { initialUrl: '/' });

    fireEvent.press(await screen.findByRole('button', { name: 'Começar' }));
    fireEvent.press(await screen.findByRole('button', { name: 'Não tenho restrições' }));
    fireEvent.press(await screen.findByRole('button', { name: 'Pular' }));

    expect(await screen.findByText(DISCOVER_TEXT)).toBeTruthy();
    expect(restrictions()).toEqual([]);
    expect(sync.requests).toHaveLength(0);
    expect(profile.saveCulinaryPreferences).not.toHaveBeenCalled();
    expect(db.rows('SELECT onboarded_at FROM profile_local')).toHaveLength(1);
  });

  it('saves amendoim with consent_at only after the server confirms', async () => {
    let confirm!: () => void;
    syncHandler = (request) =>
      new Promise((resolve) => {
        confirm = () => resolve(confirmAll(request) as FakeReply);
      });
    await reachRestrictions();

    fireEvent.press(screen.getByRole('checkbox', { name: 'Amendoim' }));
    fireEvent.press(
      screen.getByRole('checkbox', { name: 'Concordo com o uso das minhas restrições' }),
    );
    press('Salvar e continuar');

    await waitFor(() => expect(sync.requests).toHaveLength(1));
    expect(sync.requests[0]?.body).toMatchObject({
      operations: [
        {
          type: 'restriction.register',
          payload: { restrictionType: 'amendoim', consentAt: NOW.toISOString() },
        },
      ],
    });
    expect(restrictions()).toEqual([]);

    await act(async () => confirm());

    expect(
      await screen.findByRole('header', { name: 'Quais cozinhas você quer explorar?' }),
    ).toBeTruthy();
    expect(restrictions()).toEqual([
      { restriction_type: 'amendoim', consent_at: NOW.toISOString() },
    ]);
  });

  it('without consent it sends nothing and asks for it inline', async () => {
    await reachRestrictions();

    fireEvent.press(screen.getByRole('checkbox', { name: 'Amendoim' }));
    press('Salvar e continuar');

    expect(screen.getByRole('alert')).toHaveTextContent('Marque o consentimento para salvar.');
    expect(profile.registerRestrictions).not.toHaveBeenCalled();
    expect(sync.requests).toHaveLength(0);
  });

  it('hides the consent card and clears the consent when every chip is unchecked', async () => {
    await reachRestrictions();
    const amendoim = () => screen.getByRole('checkbox', { name: 'Amendoim' });
    const consent = () =>
      screen.getByRole('checkbox', { name: 'Concordo com o uso das minhas restrições' });

    fireEvent.press(amendoim());
    fireEvent.press(consent());
    fireEvent.press(amendoim());

    expect(screen.queryByTestId('consent-card')).toBeNull();
    fireEvent.press(amendoim());
    expect(consent()).not.toBeChecked();
  });

  it('offline on step 1: shows the message and retries', async () => {
    profile.prepareAccount.mockResolvedValueOnce('offline');
    renderRouter('./app', { initialUrl: '/' });

    fireEvent.press(await screen.findByRole('button', { name: 'Começar' }));

    expect(
      await screen.findByText('Sem conexão. Precisamos de internet neste primeiro acesso.'),
    ).toBeTruthy();
    press('Tentar novamente');
    expect(await screen.findByRole('header', { name: 'Alguma restrição alimentar?' })).toBeTruthy();
  });

  it('offline while saving restrictions: keeps the selection and retries the same operation', async () => {
    syncHandler = () => {
      throw new TypeError('Network request failed');
    };
    await reachRestrictions();

    fireEvent.press(screen.getByRole('checkbox', { name: 'Amendoim' }));
    fireEvent.press(
      screen.getByRole('checkbox', { name: 'Concordo com o uso das minhas restrições' }),
    );
    press('Salvar e continuar');

    expect(await screen.findByText('Sem conexão. Sua seleção continua aqui.')).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Amendoim' })).toBeChecked();
    expect(restrictions()).toEqual([]);

    syncHandler = confirmAll;
    press('Tentar novamente');

    expect(
      await screen.findByRole('header', { name: 'Quais cozinhas você quer explorar?' }),
    ).toBeTruthy();
    const opIds = sync.requests.map(
      (request) => (request.body as { operations: { opId: string }[] }).operations[0]?.opId,
    );
    expect(new Set(opIds).size).toBe(1);
    expect(restrictions()).toHaveLength(1);
  });

  it('a consent withdrawn after a failed save starts a new attempt (RN09)', async () => {
    syncHandler = () => {
      throw new TypeError('Network request failed');
    };
    await reachRestrictions();
    const consent = () =>
      screen.getByRole('checkbox', { name: 'Concordo com o uso das minhas restrições' });

    fireEvent.press(screen.getByRole('checkbox', { name: 'Amendoim' }));
    fireEvent.press(consent());
    press('Salvar e continuar');
    expect(await screen.findByText('Sem conexão. Sua seleção continua aqui.')).toBeTruthy();

    fireEvent.press(consent());
    fireEvent.press(consent());
    syncHandler = confirmAll;
    press('Tentar novamente');

    expect(
      await screen.findByRole('header', { name: 'Quais cozinhas você quer explorar?' }),
    ).toBeTruthy();
    // No pending retry: the new acceptance gets its own consentAt and opId.
    expect(profile.registerRestrictions.mock.calls[1]?.[0]).toMatchObject({ retry: undefined });
    const opIds = sync.requests.map(
      (request) => (request.body as { operations: { opId: string }[] }).operations[0]?.opId,
    );
    expect(new Set(opIds).size).toBe(2);
  });

  it('filters chips by search and explains an empty result', async () => {
    await reachRestrictions();

    fireEvent.changeText(screen.getByLabelText('Buscar alérgeno'), 'castanha');
    expect(screen.getByRole('checkbox', { name: 'Castanha-de-caju' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Castanha-do-pará' })).toBeTruthy();
    expect(screen.queryByRole('checkbox', { name: 'Amendoim' })).toBeNull();

    // Accents are ignored both ways.
    fireEvent.changeText(screen.getByLabelText('Buscar alérgeno'), 'peca');
    expect(screen.getByRole('checkbox', { name: 'Pecã' })).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('Buscar alérgeno'), 'chocolate');
    expect(screen.getByText('Nenhum alérgeno com esse nome.')).toBeTruthy();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('sends the chosen cuisines and finishes in Descobrir', async () => {
    await reachRestrictions();
    press('Não tenho restrições');

    fireEvent.press(await screen.findByRole('checkbox', { name: 'Francesa' }));
    press('Ver sugestões');

    expect(await screen.findByText(DISCOVER_TEXT)).toBeTruthy();
    expect(profile.saveCulinaryPreferences).toHaveBeenCalledWith([FR.id]);
  });

  it('keeps the choice on screen when saving cuisines fails offline', async () => {
    profile.saveCulinaryPreferences.mockResolvedValueOnce('unavailable');
    await reachRestrictions();
    press('Não tenho restrições');

    fireEvent.press(await screen.findByRole('checkbox', { name: 'Francesa' }));
    press('Ver sugestões');

    expect(await screen.findByText('Sem conexão. Suas escolhas continuam aqui.')).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Francesa' })).toBeChecked();
    expect(db.rows('SELECT onboarded_at FROM profile_local')).toHaveLength(0);
  });

  it('without a local catalog the last step only offers to continue', async () => {
    profile.listCuisines.mockResolvedValueOnce([]);
    await reachRestrictions();
    press('Não tenho restrições');

    expect(await screen.findByText('Você pode escolher depois no Perfil.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Ver sugestões' })).toBeNull();
    press('Continuar');

    expect(await screen.findByText(DISCOVER_TEXT)).toBeTruthy();
    expect(profile.saveCulinaryPreferences).not.toHaveBeenCalled();
  });

  it('goes back from step 2 to the welcome step', async () => {
    await reachRestrictions();

    press('Voltar');

    expect(await screen.findByRole('button', { name: 'Começar' })).toBeTruthy();
  });
});
