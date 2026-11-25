import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type {
  EnqueueResult,
  OperationEnqueuer,
  OperationRequest,
} from '../../src/core/sync/operation-enqueuer';
import type { ProgressSnapshotSource } from '../../src/features/progress/domain/progress-model';
import { loadRatingContext } from '../../src/features/progress/domain/rating-context';
import { createRegisterRating } from '../../src/features/progress/domain/register-rating';
import { RatingScreen } from '../../src/features/progress/ui/rating/RatingScreen';
import { BADGE, CATALOG, DISH } from './fixtures';

const OP_ID = '0192f0a0-0000-7000-8000-000000000001';
const OP_ID_2 = '0192f0a0-0000-7000-8000-000000000002';

/**
 * Real RegisterRating over a scripted enqueuer: the screen is tested against the use case it
 * ships with, and the enqueuer records exactly what would go to the server.
 */
function setup({
  replies = [] as EnqueueResult['status'][],
  previousRatings = 0,
  unlocks = {},
} = {}) {
  const sent: OperationRequest[] = [];
  const enqueuer: OperationEnqueuer = {
    enqueue: async (request) => {
      sent.push(request);
      const status = replies.shift() ?? 'confirmed';
      const opId = request.opId ?? (sent.length === 1 ? OP_ID : OP_ID_2);
      if (status === 'unavailable') {
        return { status, opId, reason: 'offline', operation: { ...request, opId } as never };
      }
      if (status === 'rejected') return { status, opId, problem: undefined };
      return { status: 'confirmed', opId, repeated: false, unlocks, localCopy: 'updated' };
    },
  };
  const progress: ProgressSnapshotSource = {
    load: async () => ({
      catalog: CATALOG,
      ratings: Array.from({ length: previousRatings }, (_, index) => ({
        id: `r${index}`,
        dishId: DISH.feijoada,
        score: 8,
        date: '2026-11-01',
      })),
      unlocks: [],
      lastSyncAt: null,
    }),
  };
  const registerRating = createRegisterRating({
    enqueuer,
    progress,
    completionListener: { onDishCompleted: async () => undefined },
  });
  const onSaved = jest.fn();
  const onClose = jest.fn();

  render(
    <RatingScreen
      dishId={DISH.feijoada}
      loadContext={() => loadRatingContext(progress, DISH.feijoada)}
      registerRating={(input) => registerRating.execute(input)}
      onSaved={onSaved}
      onClose={onClose}
    />,
  );
  return { sent, onSaved, onClose };
}

// The 26 dp halves are hidden from screen readers (the stepper is the accessible path, §8).
const starHalf = (testID: string) => screen.getByTestId(testID, { includeHiddenElements: true });
const saveButton = () => screen.getByRole('button', { name: /Salvar avaliação|Tentar novamente/ });

describe('RatingScreen (UX-01E, US12)', () => {
  it('shows the dish and keeps Save disabled until a score is picked', async () => {
    setup();

    expect(await screen.findByText('Feijoada')).toBeTruthy();
    expect(screen.getByText('Como ficou?')).toBeTruthy();
    expect(saveButton()).toBeDisabled();
    expect(screen.getByText('Escolha uma nota para salvar')).toBeTruthy();
  });

  it('enables Save with 0 stars given through the stepper', async () => {
    setup();
    await screen.findByText('Feijoada');

    fireEvent.press(screen.getByRole('button', { name: 'Diminuir nota' }));

    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('Não rolou dessa vez')).toBeTruthy();
    expect(saveButton()).toBeEnabled();
    expect(screen.queryByText('Escolha uma nota para salvar')).toBeNull();
  });

  it('starts at half a star with + and steps by half', async () => {
    setup();
    await screen.findByText('Feijoada');

    fireEvent.press(screen.getByRole('button', { name: 'Aumentar nota' }));
    fireEvent.press(screen.getByRole('button', { name: 'Aumentar nota' }));

    expect(screen.getByText('1')).toBeTruthy();
  });

  it('left half of the 4th star → 3,5; right half → 4', async () => {
    setup();
    await screen.findByText('Feijoada');

    fireEvent.press(starHalf('star-4-left'));
    expect(screen.getByText('3,5')).toBeTruthy();
    expect(screen.getByText('Ficou bom')).toBeTruthy();

    fireEvent.press(starHalf('star-4-right'));
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('Muito bom!')).toBeTruthy();
  });

  it('saves with only the score (score 7) and replaces the screen with the Celebration', async () => {
    const { sent, onSaved } = setup({
      unlocks: { evolutions: [DISH.feijoadaLight], badgeAwards: [BADGE.firstDish] },
    });
    await screen.findByText('Feijoada');

    fireEvent.press(starHalf('star-4-left'));
    fireEvent.press(saveButton());

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(sent).toEqual([
      { type: 'rating.register', payload: { dishId: DISH.feijoada, score: 7, itemId: null } },
    ]);
    expect(onSaved).toHaveBeenCalledWith({
      dishId: DISH.feijoada,
      ratingId: OP_ID,
      evolutions: DISH.feijoadaLight,
      badges: BADGE.firstDish,
      repeat: '0',
    });
  });

  it('sends the trimmed optional texts and shows the Toque Pessoal hint for changes', async () => {
    const { sent } = setup();
    await screen.findByText('Feijoada');

    fireEvent.press(starHalf('star-5-right'));
    fireEvent.changeText(screen.getByLabelText('Relato pessoal'), '  Ficou ótimo com pão. ');
    expect(screen.queryByText('Conta para Toque Pessoal')).toBeNull();
    fireEvent.changeText(screen.getByLabelText('Alterações que eu fiz'), 'Sem linguiça');
    expect(screen.getByText('Conta para Toque Pessoal')).toBeTruthy();
    fireEvent.press(saveButton());

    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]?.payload).toEqual({
      dishId: DISH.feijoada,
      score: 10,
      comment: 'Ficou ótimo com pão.',
      changes: 'Sem linguiça',
      itemId: null,
    });
  });

  it('offline: keeps the draft, offers "Tentar novamente" and resends the same opId', async () => {
    const { sent, onSaved } = setup({ replies: ['unavailable'] });
    await screen.findByText('Feijoada');

    fireEvent.press(starHalf('star-3-right'));
    fireEvent.changeText(screen.getByLabelText('Relato pessoal'), 'Bom');
    fireEvent.press(saveButton());

    expect(await screen.findByText('Sem conexão')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeEnabled();
    expect(screen.getByLabelText('Relato pessoal').props.value).toBe('Bom');
    expect(screen.getByText('3')).toBeTruthy();
    expect(onSaved).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(sent.map((request) => request.opId)).toEqual([undefined, OP_ID]);
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ ratingId: OP_ID }));
  });

  it('offline then edited draft: the next save is a new operation', async () => {
    const { sent } = setup({ replies: ['unavailable'] });
    await screen.findByText('Feijoada');

    fireEvent.press(starHalf('star-3-right'));
    fireEvent.press(saveButton());
    await screen.findByText('Sem conexão');

    fireEvent.press(starHalf('star-4-right'));
    expect(saveButton()).toHaveTextContent('Salvar avaliação');
    fireEvent.press(saveButton());

    await waitFor(() => expect(sent).toHaveLength(2));
    expect(sent[1]?.opId).toBeUndefined();
  });

  it('offline then the same score tapped again: the draft did not change, so it resends the same opId', async () => {
    const { sent } = setup({ replies: ['unavailable'] });
    await screen.findByText('Feijoada');

    fireEvent.press(starHalf('star-3-right'));
    fireEvent.press(saveButton());
    await screen.findByText('Sem conexão');

    fireEvent.press(starHalf('star-3-right'));
    fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(sent).toHaveLength(2));
    expect(sent[1]?.opId).toBe(OP_ID);
  });

  it('rejected: shows a short error and keeps the draft', async () => {
    const { onSaved } = setup({ replies: ['rejected'] });
    await screen.findByText('Feijoada');

    fireEvent.press(starHalf('star-2-right'));
    fireEvent.press(saveButton());

    expect(await screen.findByText('Não deu para salvar. Tente de novo.')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('RN06: explains the new entry only when the dish was rated before', async () => {
    setup({ previousRatings: 2 });

    expect(
      await screen.findByText(
        'Você já preparou este prato 2 vezes. Este preparo vira um novo registro.',
      ),
    ).toBeTruthy();
  });

  it('has no repeat note for a first rating', async () => {
    setup();
    await screen.findByText('Feijoada');

    expect(screen.queryByText(/Você já preparou/)).toBeNull();
  });

  it('marks the Celebration as a repeat', async () => {
    const { onSaved } = setup({ previousRatings: 1 });
    await screen.findByText(/1 vez\./);

    fireEvent.press(starHalf('star-5-right'));
    fireEvent.press(saveButton());

    await waitFor(() =>
      expect(onSaved).toHaveBeenCalledWith(
        expect.objectContaining({ repeat: '1', evolutions: '', badges: '' }),
      ),
    );
  });

  it('closes without saving', async () => {
    const { sent, onClose } = setup();
    await screen.findByText('Feijoada');

    fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));

    expect(onClose).toHaveBeenCalled();
    expect(sent).toEqual([]);
  });
});
