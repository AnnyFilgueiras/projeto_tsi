import type { Difficulty } from '../domain/suggestion-round';

// Discover copy, deliberately shorter than ux-onda1a §5: one signal per state, no sentence that
// repeats what a button or label already says. Allergen texts are NOT here: they live in
// shared/ui/allergen/copy.ts and are never rewritten by screens (A06).
export const DISCOVER_COPY = {
  title: 'Descobrir',
  loading: 'Carregando sugestões',
  discard: 'Descartar sugestão',
  approve: 'Quero cozinhar',
  openRecipe: (name: string) => `Ver receita de ${name}`,
  position: (position: number, total: number) => `${position} de ${total}`,
  positionA11y: (position: number, total: number) => `Sugestão ${position} de ${total}`,
  minutes: (minutes: number) => `${minutes} min`,
  hintEvolution: 'Abre a evolução ',
  hintFirstCuisine: 'Primeira receita ',
  approvedToast: 'Foi para Candidatas',
  approvedToastAction: 'Ver',
  actionOffline: 'Sem conexão. Tente de novo.',
  actionFailed: 'Não deu para salvar. Tente de novo.',
  emptyTitle: 'Rodada concluída',
  emptyMessage: 'Novas sugestões na próxima visita.',
  goToKitchen: 'Ir para a Cozinha',
  adjustProfile: 'Ajustar perfil',
  offlineTitle: 'Sem conexão',
  offlineMessage: 'Suas receitas baixadas estão na Cozinha.',
  failedTitle: 'Algo deu errado',
  failedMessage: 'Tente de novo em instantes.',
  retry: 'Tentar novamente',
} as const;

export const DIFFICULTY_LABELS: Readonly<Record<Difficulty, string>> = {
  easy: 'Fácil',
  medium: 'Média',
  hard: 'Difícil',
};
