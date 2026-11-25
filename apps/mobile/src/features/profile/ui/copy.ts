import { formatDate, formatTime } from '../../../shared/format';

// Profile tab copy (#78). Kept short on purpose: one line per state, no technical detail.
export const PROFILE_COPY = {
  title: 'Perfil',
  restrictions: 'Restrições',
  consent: (at: Date) => `Protegidas · consentimento em ${formatDate(at)} às ${formatTime(at)}`,
  emptyRestrictions: 'Alguém tem alergia ou intolerância? Adicione para filtrarmos as sugestões.',
  add: 'Adicionar',
  addRestriction: 'Adicionar restrição',
  cuisines: 'Cozinhas preferidas',
  account: 'Conta',
  anonymous: 'Conta anônima neste aparelho',
  removeTitle: (label: string) => `Remover ${label}?`,
  removeBody: (label: string) => `Pratos com ${label.toLowerCase()} podem voltar às sugestões.`,
  removeRevokesConsent: 'Seu consentimento também será retirado.',
  remove: 'Remover',
  removing: 'Removendo…',
  cancel: 'Cancelar',
  save: 'Salvar',
  saving: 'Salvando…',
  retry: 'Tentar novamente',
  offline: 'Sem conexão. Nada foi alterado.',
  failed: 'Algo deu errado. Tente novamente.',
  loadFailed: 'Não foi possível abrir seu perfil.',
} as const;
