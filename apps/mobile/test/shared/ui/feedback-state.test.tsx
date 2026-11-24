import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import {
  EmptyState,
  LastSync,
  Notice,
  OfflineBar,
  ProgressBar,
  Skeleton,
  Toast,
} from '../../../src/shared/ui';

describe('OfflineBar', () => {
  it('says there is no connection and that local data is kept', () => {
    render(<OfflineBar />);
    expect(screen.getByText('Sem conexão')).toBeTruthy();
    expect(screen.getByText('O que está salvo no aparelho continua disponível.')).toBeTruthy();
  });
});

describe('Notice', () => {
  it.each(['info', 'offline', 'error'] as const)('%s shows its message', (type) => {
    render(<Notice type={type} message="Mensagem de aviso." />);
    expect(screen.getByText('Mensagem de aviso.')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('error offers "Tentar novamente"', () => {
    const onRetry = jest.fn();
    render(
      <Notice
        type="error"
        title="Sem conexão agora."
        message="Nada foi perdido."
        onRetry={onRetry}
      />,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    fireEvent.press(screen.getByRole('link', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('Toast', () => {
  it('shows the message and an optional action', () => {
    const onAction = jest.fn();
    render(<Toast message="Adicionado à sua cozinha" actionLabel="Ver" onAction={onAction} />);
    expect(screen.getByText('Adicionado à sua cozinha')).toBeTruthy();
    fireEvent.press(screen.getByRole('link', { name: 'Ver' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('has no action when none is given', () => {
    render(<Toast message="Salvo" />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});

describe('LastSync', () => {
  it('formats lastSyncAt in pt-BR (TZ=UTC in tests)', () => {
    render(<LastSync syncedAt={new Date(Date.UTC(2026, 10, 23, 9, 10))} />);
    expect(screen.getByText('Disponível offline · atualizado em 23/11 às 09:10')).toBeTruthy();
  });
});

// Animated components read the reduce-motion setting asynchronously; fake timers keep their
// animation frames from firing after the assertions.
describe('ProgressBar', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('exposes a clamped percentage to screen readers', async () => {
    render(<ProgressBar value={1.4} accessibilityLabel="Culinária francesa" />);
    await act(async () => undefined);
    expect(
      screen.getByRole('progressbar', { name: 'Culinária francesa' }),
    ).toHaveAccessibilityValue({ min: 0, max: 100, now: 100 });
  });

  it('stays static when reduce motion is on', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    render(<ProgressBar value={0.33} accessibilityLabel="Progresso" />);
    await act(async () => undefined);
    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ now: 33 });
  });
});

describe('Skeleton', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('is hidden from screen readers', async () => {
    render(<Skeleton height={20} />);
    await act(async () => undefined);
    expect(screen.queryByTestId('skeleton')).toBeNull();
    expect(screen.getByTestId('skeleton', { includeHiddenElements: true })).toBeTruthy();
  });
});

describe('EmptyState', () => {
  it('shows title, message and one constructive CTA', () => {
    const onAction = jest.fn();
    render(
      <EmptyState
        title="Sua coleção começa no primeiro prato"
        message="Avalie um prato para ele aparecer aqui."
        actionLabel="Descobrir pratos"
        onAction={onAction}
      />,
    );
    expect(
      screen.getByRole('header', { name: 'Sua coleção começa no primeiro prato' }),
    ).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Descobrir pratos' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
