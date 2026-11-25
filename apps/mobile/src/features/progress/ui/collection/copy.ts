import { formatDate, formatStars } from '../../../../shared/format';

// Collection copy (§10), trimmed for a clean screen (user request, 25/11): no emoji, no sync
// line, one indicator per fact. Counts the progress bar already shows live only in a11y labels.
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export const COLLECTION_COPY = {
  title: 'Coleção',
  loading: 'Carregando a coleção',
  summary: (dishes: number, cuisines: number, continents: number, totalContinents: number) =>
    `${plural(dishes, 'prato', 'pratos')}, ${plural(cuisines, 'culinária', 'culinárias')} e ${continents} de ${totalContinents} continentes`,
  segments: 'Seção da coleção',
  cuisinesSegment: 'Culinárias',
  evolutionsSegment: 'Evoluções',
  badgesSegment: 'Badges',
  historySegment: 'Histórico',

  missing: (missing: number) => (missing === 1 ? 'Falta 1' : `Faltam ${missing}`),
  complete: 'Completa',
  cuisineA11y: (name: string, completed: number, total: number, missing: number) =>
    `${name}: ${completed} de ${total} pratos, ${missing === 1 ? 'falta 1' : `faltam ${missing}`}`,
  expand: 'Mostrar pratos',
  collapse: 'Ocultar pratos',
  dishDoneA11y: (name: string, stars: number) =>
    `${name}, concluído, nota ${formatStars(stars)} de 5`,
  dishPendingA11y: (name: string) => `${name}, ainda não preparado`,
  // #86 format C: an evolution stays nameless until its base dish is cooked.
  mysteryDish: 'Prato misterioso',
  mysteryDishA11y: 'Prato misterioso, ainda não revelado',

  completed: 'Concluído',
  readyToCook: 'Pronto para cozinhar',
  lockedPrefix: 'Conclua ',
  lockedSuffix: ' para revelar',
  revealAboveFirst: 'Revele o prato acima primeiro',
  lockedA11y: (base: string) => `Prato misterioso. Conclua ${base} para revelar`,
  lockedDeepA11y: 'Prato misterioso. Revele o prato acima primeiro',

  earned: 'Conquistados',
  next: 'Próximos marcos',
  earnedAt: (iso: string) => `Conquistado em ${formatDate(new Date(iso))}`,
  badgeEarnedA11y: (name: string) => `${name}, conquistado`,
  badgeLockedA11y: (name: string) => `${name}, ainda não conquistado`,
  milestone: (current: number, target: number) => `${current} de ${target}`,
  milestoneA11y: (name: string, current: number, target: number) =>
    `${name}: ${current} de ${target}`,

  date: (iso: string) => formatDate(new Date(iso)),
  stars: formatStars,
  starsA11y: (stars: number) => `Nota ${formatStars(stars)} de 5`,
  unavailableDish: 'Prato indisponível',
  personalTouch: 'Toque pessoal',
  comment: 'Relato',
  changes: 'Alterações',
  seeRecipe: 'Ver receita',

  // One sentence only: the spec's second line repeated the first (user request).
  emptyTitle: 'Sua coleção começa no primeiro prato avaliado.',
  goToDiscover: 'Descobrir pratos',
  goToKitchen: 'Ir para a Cozinha',
  failedTitle: 'Algo deu errado',
  failedMessage: 'Tente de novo.',
  retry: 'Tentar novamente',
} as const;
