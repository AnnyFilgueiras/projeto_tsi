// Kitchen copy, deliberately shorter than ux-onda1a §6 (user request: less text, no technical
// details such as downloads or sync times). Allergen texts are NOT here: they live in
// shared/ui/allergen/copy.ts and are never rewritten by screens (A06).
export const KITCHEN_COPY = {
  title: 'Cozinha',
  loading: 'Carregando a cozinha',
  segments: 'Seção da cozinha',
  cookingSegment: 'Em preparo',
  candidatesSegment: 'Candidatas',
  noCooking: 'Nada em preparo.',
  noCandidates: 'Nenhuma candidata.',
  step: (current: number, total: number) => `Passo ${current} de ${total}`,
  progressA11y: (name: string, current: number, total: number) =>
    `${name}: passo ${current} de ${total}`,
  resume: 'Continuar',
  finish: 'Concluir',
  minutes: (minutes: number) => `${minutes} min`,
  cook: 'Cozinhar',
  downloading: 'Baixando…',
  cookOffline: 'Sem conexão. Tente de novo.',
  cookFailed: 'Não deu para baixar. Tente de novo.',
  cookNotFound: 'Este prato não está mais disponível.',
  emptyTitle: 'Nenhum prato ainda',
  emptyMessage: 'Aprove pratos em Descobrir.',
  goToDiscover: 'Descobrir pratos',
  failedTitle: 'Algo deu errado',
  failedMessage: 'Tente de novo.',
  retry: 'Tentar novamente',
} as const;
