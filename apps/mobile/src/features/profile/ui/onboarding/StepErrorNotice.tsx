import { Notice } from '../../../../shared/ui';
import type { StepError } from './step-error';

export interface StepErrorNoticeProps {
  readonly error: StepError;
  readonly offlineMessage: string;
}

/**
 * The one status signal of a failed step (no extra offline bar): the footer button already turns
 * into "Tentar novamente", so the notice carries no retry link of its own.
 */
export function StepErrorNotice({ error, offlineMessage }: StepErrorNoticeProps) {
  return error === 'offline' ? (
    <Notice type="offline" message={offlineMessage} />
  ) : (
    <Notice type="error" message="Algo deu errado. Tente novamente." />
  );
}
