import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  buildProgressModel,
  type ProgressModel,
  type ProgressSnapshot,
  type StoredRating,
  type StoredUnlock,
} from '../../src/features/progress/domain/progress-model';
import { CollectionScreen } from '../../src/features/progress/ui/collection/CollectionScreen';
import type { CollectionView } from '../../src/features/progress/ui/collection/collection-view';
import { BADGE, CATALOG, CUISINE, DISH } from './fixtures';

const RATINGS: StoredRating[] = [
  {
    id: 'r1',
    dishId: DISH.feijoada,
    score: 9,
    date: '2026-11-18T15:00:00.000Z',
    comment: 'Ficou ótima com farofa.',
  },
  {
    id: 'r2',
    dishId: DISH.feijoada,
    score: 7,
    date: '2026-11-22T15:00:00.000Z',
    comment: 'Segunda vez, mais rápida.',
    changes: 'Usei bacon defumado.',
  },
];

const UNLOCKS: StoredUnlock[] = [
  { kind: 'evolution', targetId: DISH.feijoadaLight, unlockedAt: null },
  { kind: 'badge', targetId: BADGE.firstDish, unlockedAt: '2026-11-18T15:00:00.000Z' },
];

function snapshot(ratings = RATINGS, unlocks = UNLOCKS): ProgressSnapshot {
  return { catalog: CATALOG, ratings, unlocks, lastSyncAt: '2026-11-23T10:00:00.000Z' };
}

function setup({
  initialView = 'cuisines' as CollectionView,
  load = async (): Promise<ProgressModel> => buildProgressModel(snapshot()),
} = {}) {
  const progress = { loadProgress: jest.fn(load) };
  const callbacks = {
    onOpenRecipe: jest.fn(),
    onGoToDiscover: jest.fn(),
    onGoToKitchen: jest.fn(),
  };
  let refresh: () => void = () => undefined;
  // Stands in for the route: `view` lives in the URL there.
  function Harness() {
    const [view, setView] = useState<CollectionView>(initialView);
    const [refreshKey, setRefreshKey] = useState(0);
    refresh = () => setRefreshKey((key) => key + 1);
    return (
      <CollectionScreen
        progress={progress}
        refreshKey={refreshKey}
        view={view}
        onChangeView={setView}
        {...callbacks}
      />
    );
  }
  render(<Harness />);
  return { progress, refresh: () => act(() => refresh()), ...callbacks };
}

describe('CollectionScreen (§10, #85)', () => {
  // The bar animation runs on real timers outside act(); its behavior is ProgressBar's own test.
  beforeEach(() => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  });
  afterEach(() => jest.restoreAllMocks());

  it('shows the skeleton while the local copy is read', async () => {
    let resolve: (model: ProgressModel) => void = () => undefined;
    setup({ load: () => new Promise((done) => (resolve = done)) });

    expect(screen.getByTestId('collection-skeleton')).toBeTruthy();
    await act(async () => resolve(buildProgressModel(snapshot())));
    expect(screen.queryByTestId('collection-skeleton')).toBeNull();
  });

  it('US14: summary line and cuisine cards with what is missing, expandable to the dish grid', async () => {
    setup();

    expect(await screen.findByText('1 prato, 1 culinária e 1 de 5 continentes')).toBeTruthy();
    expect(screen.getByText('Faltam 3')).toBeTruthy();
    expect(screen.getByText('Faltam 2')).toBeTruthy();
    expect(screen.queryByText(/de 4/)).toBeNull();

    const brasileira = screen.getByRole('button', {
      name: 'Brasileira: 1 de 4 pratos, faltam 3',
    });
    expect(screen.queryByTestId(`dish-tile-${DISH.feijoada}`)).toBeNull();
    fireEvent.press(brasileira);

    // Latest preparation wins (RN06): 7/2 = 3,5.
    expect(screen.getByLabelText('Feijoada, concluído, nota 3,5 de 5')).toBeTruthy();
    expect(screen.getByLabelText('Moqueca, ainda não preparado')).toBeTruthy();
    expect(
      within(screen.getByTestId(`cuisine-${CUISINE.japonesa}`)).queryByText('Sushi'),
    ).toBeNull();
  });

  it('US15 / #86: a locked node is a mystery that names its base and opens it', async () => {
    const { onOpenRecipe } = setup({ initialView: 'evolutions' });

    expect(await screen.findByText('Concluído')).toBeTruthy();
    expect(screen.getByText('Pronto para cozinhar')).toBeTruthy();
    expect(screen.queryByText('Feijoada vegana')).toBeNull();
    expect(screen.getByText('Prato misterioso')).toBeTruthy();
    const locked = screen.getByRole('button', {
      name: 'Prato misterioso. Conclua Feijoada leve para revelar',
    });

    fireEvent.press(locked);
    expect(onOpenRecipe).toHaveBeenLastCalledWith(DISH.feijoadaLight);
    fireEvent.press(screen.getByRole('button', { name: 'Feijoada leve. Pronto para cozinhar' }));
    expect(onOpenRecipe).toHaveBeenLastCalledWith(DISH.feijoadaLight);
  });

  // Only a dish outside the chain was cooked: the empty state stays away, the chain is untouched.
  const MOQUECA_ONLY: StoredRating[] = [
    { id: 'r9', dishId: DISH.moqueca, score: 8, date: '2026-11-18T15:00:00.000Z' },
  ];

  it('#86: a mystery under another mystery shows every level but no name and no action', async () => {
    setup({
      initialView: 'evolutions',
      load: async () => buildProgressModel(snapshot(MOQUECA_ONLY, [])),
    });

    expect(await screen.findByText(/Conclua/)).toBeTruthy();
    expect(screen.getAllByText('Prato misterioso')).toHaveLength(2);
    expect(screen.getByText('Revele o prato acima primeiro')).toBeTruthy();
    expect(screen.queryByText(/Feijoada leve|Feijoada vegana/)).toBeNull();
    expect(screen.getAllByRole('button', { name: /Prato misterioso/ })).toHaveLength(1);
  });

  it('#86: the cuisine grid hides a mystery dish but keeps it in the count', async () => {
    setup({ load: async () => buildProgressModel(snapshot(MOQUECA_ONLY, [])) });

    const brasileira = await screen.findByRole('button', {
      name: 'Brasileira: 1 de 4 pratos, faltam 3',
    });
    fireEvent.press(brasileira);

    expect(screen.getAllByLabelText('Prato misterioso, ainda não revelado')).toHaveLength(2);
    expect(screen.queryByText('Feijoada leve')).toBeNull();
    expect(screen.getByLabelText('Feijoada, ainda não preparado')).toBeTruthy();
  });

  it('US15: after the base dish is rated, the node shows unlocked when the tab regains focus', async () => {
    let ratings = RATINGS;
    let unlocks = UNLOCKS;
    const { refresh } = setup({
      initialView: 'evolutions',
      load: async () => buildProgressModel(snapshot(ratings, unlocks)),
    });
    expect(await screen.findByText(/Conclua/)).toBeTruthy();

    ratings = [
      ...RATINGS,
      { id: 'r3', dishId: DISH.feijoadaLight, score: 8, date: '2026-11-24T12:00:00.000Z' },
    ];
    unlocks = [
      ...UNLOCKS,
      { kind: 'evolution', targetId: DISH.feijoadaVegana, unlockedAt: '2026-11-24T12:00:00.000Z' },
    ];
    refresh();

    expect(
      await screen.findByRole('button', { name: 'Feijoada vegana. Pronto para cozinhar' }),
    ).toBeTruthy();
    expect(screen.queryByText(/Conclua/)).toBeNull();
  });

  it('US16: earned badges without a date, next milestones with criterion and bar', async () => {
    setup({ initialView: 'badges' });

    expect(await screen.findByText('Conquistados')).toBeTruthy();
    const earned = screen.getByTestId(`earned-${BADGE.firstDish}`);
    expect(within(earned).getByText('Primeiro prato')).toBeTruthy();
    // #86: an earned badge keeps saying what earned it (RN04: criteria stay visible).
    expect(within(earned).getByText('Conclua um prato.')).toBeTruthy();
    expect(within(earned).queryByText(/Conquistado em/)).toBeNull();
    expect(screen.getByText('Próximos marcos')).toBeTruthy();
    expect(screen.getByText('Conclua pratos de 2 culinárias.')).toBeTruthy();
    expect(screen.getByLabelText('Dupla cozinha: 1 de 2')).toBeTruthy();
    expect(screen.getByText('1 de 2')).toBeTruthy();
  });

  it('US12 / RN06: a repeated dish shows both records; the sheet has the full record', async () => {
    const { onOpenRecipe } = setup({ initialView: 'history' });

    expect(await screen.findByText('22/11/2026')).toBeTruthy();
    expect(screen.getByText('18/11/2026')).toBeTruthy();
    expect(screen.getAllByText('Feijoada')).toHaveLength(2);
    expect(screen.getByLabelText('Nota 3,5 de 5')).toBeTruthy();
    expect(screen.getByLabelText('Nota 4,5 de 5')).toBeTruthy();
    expect(screen.getAllByText('Toque pessoal')).toHaveLength(1);

    fireEvent.press(screen.getByTestId('history-r2'));
    const sheet = within(screen.getByTestId('history-sheet'));
    expect(sheet.getByText('3,5')).toBeTruthy();
    expect(sheet.getByText('Relato')).toBeTruthy();
    expect(sheet.getByText('Segunda vez, mais rápida.')).toBeTruthy();
    expect(sheet.getByText('Alterações')).toBeTruthy();
    expect(sheet.getByText('Usei bacon defumado.')).toBeTruthy();

    fireEvent.press(sheet.getByRole('button', { name: 'Ver receita' }));
    expect(onOpenRecipe).toHaveBeenCalledWith(DISH.feijoada);
  });

  it('RN01: a record of a dish that left the catalog has no recipe to open', async () => {
    setup({
      initialView: 'history',
      load: async () =>
        buildProgressModel(
          snapshot([{ id: 'r9', dishId: 'gone', score: 6, date: '2026-11-20T12:00:00.000Z' }], []),
        ),
    });

    fireEvent.press(await screen.findByTestId('history-r9'));
    const sheet = within(screen.getByTestId('history-sheet'));
    expect(sheet.getByText('Prato indisponível')).toBeTruthy();
    expect(sheet.queryByText('Relato')).toBeNull();
    expect(sheet.queryByRole('button', { name: 'Ver receita' })).toBeNull();
  });

  it('switching segments changes the sub-view', async () => {
    setup();
    await screen.findByText('Faltam 3');

    fireEvent.press(screen.getByTestId('segment-badges'));

    expect(await screen.findByText('Próximos marcos')).toBeTruthy();
  });

  it('empty: one message, a primary CTA and a text link; badges still show the milestones', async () => {
    const empty = async () => buildProgressModel(snapshot([], []));
    const { onGoToDiscover, onGoToKitchen } = setup({ load: empty });

    expect(await screen.findByText('Sua coleção começa no primeiro prato avaliado.')).toBeTruthy();
    expect(screen.queryByText(/continentes/)).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Descobrir pratos' }));
    fireEvent.press(screen.getByRole('link', { name: 'Ir para a Cozinha' }));
    expect(onGoToDiscover).toHaveBeenCalled();
    expect(onGoToKitchen).toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('segment-badges'));
    expect(await screen.findByText('Primeiro prato')).toBeTruthy();
    expect(screen.queryByText('Sua coleção começa no primeiro prato avaliado.')).toBeNull();
    expect(screen.queryByText('Conquistados')).toBeNull();
  });

  it('a local read failure offers a retry instead of a spinning skeleton', async () => {
    let fail = true;
    setup({
      load: async () => {
        if (fail) throw new Error('locked');
        return buildProgressModel(snapshot());
      },
    });

    expect(await screen.findByText('Algo deu errado')).toBeTruthy();
    fail = false;
    fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('Faltam 3')).toBeTruthy();
  });
});
