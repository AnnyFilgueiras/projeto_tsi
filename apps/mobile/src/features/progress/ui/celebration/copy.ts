// Celebration copy (§9), trimmed for a clean screen (user request: short text, nothing
// redundant). Numbers the progress bar already shows live only in accessibility labels.
export const CELEBRATION_COPY = {
  firstTitle: 'Prato concluído!',
  repeatTitle: 'Mais um registro!',
  genericTitle: 'Avaliação salva!',
  starsA11y: (stars: number) => `Sua nota: ${String(stars).replace('.', ',')} de 5 estrelas`,
  cuisineMissing: (missing: number, name: string) =>
    missing === 1
      ? `Falta 1 prato da culinária ${name}`
      : `Faltam ${missing} pratos da culinária ${name}`,
  cuisineComplete: (name: string) => `Culinária ${name} completa!`,
  cuisineA11y: (name: string, completed: number, total: number) =>
    `Culinária ${name}: ${completed} de ${total} pratos`,
  evolutionLabel: 'Evolução desbloqueada',
  meet: 'Conhecer',
  badgeA11y: (name: string) => `${name}, conquistado`,
  // RN04: a badge is never taken back.
  badgeForever: 'É seu para sempre.',
  repeatCount: (count: number) => `Você já registrou ${count} preparos deste prato.`,
  seeCollection: 'Ver na Coleção',
  backToKitchen: 'Voltar para Cozinha',
  discoverMore: 'Descobrir mais',
} as const;
