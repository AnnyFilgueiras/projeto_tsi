import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, BackHandler } from 'react-native';
import type {
  ProgressSnapshot,
  StoredRating,
} from '../../src/features/progress/domain/progress-model';
import {
  CelebrationScreen,
  type CelebrationRouteParams,
} from '../../src/features/progress/ui/celebration/CelebrationScreen';
import { BADGE, CATALOG, DISH } from './fixtures';

const RATING_ID = 'r0000000-0000-4000-8000-000000000001';

function rating(overrides: Partial<StoredRating> = {}): StoredRating {
  return { id: RATING_ID, dishId: DISH.feijoada, score: 9, date: '2026-11-25', ...overrides };
}

function setup(
  ratings: StoredRating[],
  params: Partial<CelebrationRouteParams> = {},
  load?: () => Promise<ProgressSnapshot>,
) {
  const progress = {
    load: jest.fn(
      load ?? (async () => ({ catalog: CATALOG, ratings, unlocks: [], lastSyncAt: null })),
    ),
  };
  const callbacks = {
    onOpenDish: jest.fn(),
    onOpenCollection: jest.fn(),
    onGoToKitchen: jest.fn(),
    onGoToDiscover: jest.fn(),
  };
  render(
    <CelebrationScreen
      progress={progress}
      routeParams={{
        dishId: DISH.feijoada,
        ratingId: RATING_ID,
        evolutions: '',
        badges: '',
        repeat: '0',
        ...params,
      }}
      {...callbacks}
    />,
  );
  return callbacks;
}

describe('CelebrationScreen (§9, #84)', () => {
  // The bar animation runs on real timers outside act(); its behavior is ProgressBar's own test.
  beforeEach(() => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  });
  afterEach(() => jest.restoreAllMocks());

  it('state 1: confirmation, cuisine progress, unlocked evolution and earned badge', async () => {
    const { onOpenDish, onOpenCollection } = setup([rating()], {
      evolutions: DISH.feijoadaLight,
      badges: BADGE.firstDish,
    });

    expect(await screen.findByText('Prato concluído!')).toBeTruthy();
    expect(screen.getByText('Feijoada')).toBeTruthy();
    expect(screen.getByLabelText('Sua nota: 4,5 de 5 estrelas')).toBeTruthy();
    expect(screen.getByText('Faltam 3 pratos da culinária Brasileira')).toBeTruthy();
    expect(screen.getByLabelText('Culinária Brasileira: 1 de 4 pratos')).toBeTruthy();
    expect(screen.getByText('Evolução desbloqueada')).toBeTruthy();
    expect(screen.getByText('Feijoada leve')).toBeTruthy();
    expect(screen.getByText('Primeiro prato')).toBeTruthy();
    expect(screen.getByText('Conclua um prato.')).toBeTruthy();
    expect(screen.getByText('É seu para sempre.')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Conhecer' }));
    fireEvent.press(screen.getByRole('button', { name: 'Ver na Coleção' }));
    expect(onOpenDish).toHaveBeenCalledWith(DISH.feijoadaLight);
    expect(onOpenCollection).toHaveBeenCalledWith('badges');
  });

  it('state 2: only confirmation and cuisine progress when nothing was unlocked', async () => {
    const { onOpenCollection, onGoToKitchen, onGoToDiscover } = setup([rating()]);

    expect(await screen.findByText('Faltam 3 pratos da culinária Brasileira')).toBeTruthy();
    expect(screen.queryByText('Evolução desbloqueada')).toBeNull();
    expect(screen.queryByText('É seu para sempre.')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Ver na Coleção' }));
    fireEvent.press(screen.getByRole('button', { name: 'Voltar para Cozinha' }));
    fireEvent.press(screen.getByRole('link', { name: 'Descobrir mais' }));
    expect(onOpenCollection).toHaveBeenCalledWith('cuisines');
    expect(onGoToKitchen).toHaveBeenCalled();
    expect(onGoToDiscover).toHaveBeenCalled();
  });

  it('state 3: a repeat shows the preparation count and badges, without cuisine progress', async () => {
    setup(
      [
        rating({ changes: 'Sem linguiça' }),
        rating({ id: 'r-old', date: '2026-11-01' }),
        rating({ id: 'r-older', date: '2026-10-01' }),
      ],
      { repeat: '1', badges: BADGE.firstAdaptation },
    );

    expect(await screen.findByText('Mais um registro!')).toBeTruthy();
    expect(screen.getByText('Você já registrou 3 preparos deste prato.')).toBeTruthy();
    expect(screen.getByText('Do meu jeito')).toBeTruthy();
    expect(screen.queryByText(/culinária Brasileira/)).toBeNull();
  });

  it('a failed local read still confirms the save and offers the exits', async () => {
    setup([], { badges: BADGE.firstDish }, async () => {
      throw new Error('locked');
    });

    expect(await screen.findByText('Avaliação salva!')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ver na Coleção' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Voltar para Cozinha' })).toBeTruthy();
  });

  it('Android back goes to the Kitchen instead of the sent rating form', async () => {
    const listeners: (() => boolean | null | undefined)[] = [];
    const spy = jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_, handler) => {
      listeners.push(handler);
      return { remove: jest.fn() };
    });
    const { onGoToKitchen } = setup([rating()]);
    await screen.findByText('Prato concluído!');

    let handled: boolean | null | undefined;
    act(() => {
      handled = listeners.at(-1)?.();
    });
    expect(handled).toBe(true);
    expect(onGoToKitchen).toHaveBeenCalled();
    spy.mockRestore();
  });
});
