import type { AllergenCode } from '@panelada/allergen-rules/rules';

export type AllergenGroup =
  | 'Glúten'
  | 'Leite'
  | 'Ovos'
  | 'Peixes e frutos do mar'
  | 'Leguminosas'
  | 'Castanhas e nozes'
  | 'Outros';

/** Display order of the groups in allergen selection (§1.4). */
export const ALLERGEN_GROUPS: readonly AllergenGroup[] = [
  'Glúten',
  'Leite',
  'Ovos',
  'Peixes e frutos do mar',
  'Leguminosas',
  'Castanhas e nozes',
  'Outros',
];

/** Friendly pt-BR label and selection group of each controlled allergen code (§1.4). */
export const ALLERGEN_LABELS: Readonly<
  Record<AllergenCode, { readonly label: string; readonly group: AllergenGroup }>
> = {
  trigo_centeio_cevada_aveia: { label: 'Trigo, centeio, cevada e aveia (glúten)', group: 'Glúten' },
  leite: { label: 'Leite (proteína do leite)', group: 'Leite' },
  lactose: { label: 'Lactose (intolerância)', group: 'Leite' },
  ovo: { label: 'Ovos', group: 'Ovos' },
  peixe: { label: 'Peixes', group: 'Peixes e frutos do mar' },
  crustaceos: { label: 'Crustáceos', group: 'Peixes e frutos do mar' },
  amendoim: { label: 'Amendoim', group: 'Leguminosas' },
  soja: { label: 'Soja', group: 'Leguminosas' },
  amendoa: { label: 'Amêndoa', group: 'Castanhas e nozes' },
  avela: { label: 'Avelã', group: 'Castanhas e nozes' },
  castanha_caju: { label: 'Castanha-de-caju', group: 'Castanhas e nozes' },
  castanha_brasil: { label: 'Castanha-do-pará', group: 'Castanhas e nozes' },
  macadamia: { label: 'Macadâmia', group: 'Castanhas e nozes' },
  noz: { label: 'Nozes', group: 'Castanhas e nozes' },
  peca: { label: 'Pecã', group: 'Castanhas e nozes' },
  pistache: { label: 'Pistache', group: 'Castanhas e nozes' },
  pinoli: { label: 'Pinoli', group: 'Castanhas e nozes' },
  castanha_castanea: { label: 'Castanha-portuguesa', group: 'Castanhas e nozes' },
  latex: { label: 'Látex natural', group: 'Outros' },
};

export function allergenLabel(code: AllergenCode): string {
  return ALLERGEN_LABELS[code].label;
}
