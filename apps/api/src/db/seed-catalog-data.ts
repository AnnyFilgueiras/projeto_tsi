export type SeedContinent = 'america' | 'africa' | 'europe' | 'asia' | 'oceania';
export type SeedDifficulty = 'easy' | 'medium' | 'hard';

export interface SeedCuisine {
  readonly id: string;
  readonly name: string;
  readonly continents: readonly SeedContinent[];
}

export interface SeedIngredient {
  readonly id: string;
  readonly name: string;
  readonly allergens: readonly string[];
  readonly lactoseFree: boolean;
}

export interface SeedUtensil {
  readonly id: string;
  readonly name: string;
}

export interface SeedSubstitution {
  readonly id: string;
  readonly ingredientId: string;
  readonly substituteId: string;
  readonly substituteAllergens: readonly string[];
  readonly allergenState: 'verified' | 'source_declared' | 'unverified';
  readonly confirmedAllergenFree: boolean;
  readonly origin: 'manual' | 'ai';
}

export interface SeedDishRecipe {
  readonly id: string;
  readonly name: string;
  readonly cuisineId: string;
  readonly baseDishId: string | null;
  readonly prepTimeMinutes: number;
  readonly difficulty: SeedDifficulty;
  readonly ingredients: readonly {
    readonly ingredientId: string;
    readonly quantity: string;
    readonly unit: string;
  }[];
  readonly utensilIds: readonly string[];
  readonly steps: readonly string[];
  readonly sourceName: string;
  readonly sourceUrl: string;
  readonly photoColor: readonly [number, number, number];
}

export interface SeedBadgeDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly milestone: Record<string, unknown>;
}

// Deterministic UUIDs across all catalog & gamification fixtures so db:seed / db:reset stay idempotent.
export const CUISINE_IDS = {
  italian: '10000000-0000-4000-8000-000000000001',
  french: '10000000-0000-4000-8000-000000000002',
  greek: '10000000-0000-4000-8000-000000000003',
  arab: '10000000-0000-4000-8000-000000000004',
  japanese: '10000000-0000-4000-8000-000000000005',
  thai: '10000000-0000-4000-8000-000000000006',
  brazilian: '10000000-0000-4000-8000-000000000007',
  mexican: '10000000-0000-4000-8000-000000000008',
  moroccan: '10000000-0000-4000-8000-000000000009',
  australian: '10000000-0000-4000-8000-000000000010',
} as const;

export const SEED_CUISINES: readonly SeedCuisine[] = [
  { id: CUISINE_IDS.italian, name: 'Italiana', continents: ['europe'] },
  { id: CUISINE_IDS.french, name: 'Francesa', continents: ['europe'] },
  { id: CUISINE_IDS.greek, name: 'Grega', continents: ['europe'] },
  { id: CUISINE_IDS.arab, name: 'Árabe', continents: ['asia', 'africa'] },
  { id: CUISINE_IDS.japanese, name: 'Japonesa', continents: ['asia'] },
  { id: CUISINE_IDS.thai, name: 'Tailandesa', continents: ['asia'] },
  { id: CUISINE_IDS.brazilian, name: 'Brasileira', continents: ['america'] },
  { id: CUISINE_IDS.mexican, name: 'Mexicana', continents: ['america'] },
  { id: CUISINE_IDS.moroccan, name: 'Marroquina', continents: ['africa'] },
  { id: CUISINE_IDS.australian, name: 'Australiana', continents: ['oceania'] },
];

export const INGREDIENT_IDS = {
  wheatPasta: '20000000-0000-4000-8000-000000000001',
  wheatFlour: '20000000-0000-4000-8000-000000000002',
  riceFlour: '20000000-0000-4000-8000-000000000003',
  wholeMilk: '20000000-0000-4000-8000-000000000004',
  lactoseFreeMilk: '20000000-0000-4000-8000-000000000005',
  oatDrink: '20000000-0000-4000-8000-000000000006',
  coconutMilk: '20000000-0000-4000-8000-000000000007',
  egg: '20000000-0000-4000-8000-000000000008',
  parmesanCheese: '20000000-0000-4000-8000-000000000009',
  fetaCheese: '20000000-0000-4000-8000-000000000010',
  minasCheese: '20000000-0000-4000-8000-000000000011',
  nutritionalYeast: '20000000-0000-4000-8000-000000000012',
  oliveOil: '20000000-0000-4000-8000-000000000013',
  garlic: '20000000-0000-4000-8000-000000000014',
  tomato: '20000000-0000-4000-8000-000000000015',
  eggplant: '20000000-0000-4000-8000-000000000016',
  zucchini: '20000000-0000-4000-8000-000000000017',
  groundBeef: '20000000-0000-4000-8000-000000000018',
  chickenBreast: '20000000-0000-4000-8000-000000000019',
  whiteFish: '20000000-0000-4000-8000-000000000020',
  salmon: '20000000-0000-4000-8000-000000000021',
  shrimp: '20000000-0000-4000-8000-000000000022',
  peanut: '20000000-0000-4000-8000-000000000023',
  cashewNut: '20000000-0000-4000-8000-000000000024',
  almond: '20000000-0000-4000-8000-000000000025',
  soySauce: '20000000-0000-4000-8000-000000000026',
  coconutAminos: '20000000-0000-4000-8000-000000000027',
  tofu: '20000000-0000-4000-8000-000000000028',
  chickpea: '20000000-0000-4000-8000-000000000029',
  bulgurWheat: '20000000-0000-4000-8000-000000000030',
  japaneseRice: '20000000-0000-4000-8000-000000000031',
  riceNoodles: '20000000-0000-4000-8000-000000000032',
  sourTapiocaStarch: '20000000-0000-4000-8000-000000000033',
  avocado: '20000000-0000-4000-8000-000000000034',
  cornTortilla: '20000000-0000-4000-8000-000000000035',
  lime: '20000000-0000-4000-8000-000000000036',
  couscousSemolina: '20000000-0000-4000-8000-000000000037',
  shreddedCoconut: '20000000-0000-4000-8000-000000000038',
  cocoaPowder: '20000000-0000-4000-8000-000000000039',
  fishSauce: '20000000-0000-4000-8000-000000000040',
} as const;

export const SEED_INGREDIENTS: readonly SeedIngredient[] = [
  {
    id: INGREDIENT_IDS.wheatPasta,
    name: 'Massa de trigo',
    allergens: ['trigo_centeio_cevada_aveia'],
    lactoseFree: false,
  },
  {
    id: INGREDIENT_IDS.wheatFlour,
    name: 'Farinha de trigo',
    allergens: ['trigo_centeio_cevada_aveia'],
    lactoseFree: false,
  },
  { id: INGREDIENT_IDS.riceFlour, name: 'Farinha de arroz', allergens: [], lactoseFree: false },
  {
    id: INGREDIENT_IDS.wholeMilk,
    name: 'Leite integral',
    allergens: ['leite', 'lactose'],
    lactoseFree: false,
  },
  {
    id: INGREDIENT_IDS.lactoseFreeMilk,
    name: 'Leite sem lactose',
    allergens: ['leite'],
    lactoseFree: true,
  },
  {
    id: INGREDIENT_IDS.oatDrink,
    name: 'Bebida de aveia',
    allergens: ['trigo_centeio_cevada_aveia'],
    lactoseFree: false,
  },
  { id: INGREDIENT_IDS.coconutMilk, name: 'Leite de coco', allergens: [], lactoseFree: false },
  { id: INGREDIENT_IDS.egg, name: 'Ovo', allergens: ['ovo'], lactoseFree: false },
  {
    id: INGREDIENT_IDS.parmesanCheese,
    name: 'Queijo parmesão',
    allergens: ['leite', 'lactose'],
    lactoseFree: false,
  },
  {
    id: INGREDIENT_IDS.fetaCheese,
    name: 'Queijo feta',
    allergens: ['leite', 'lactose'],
    lactoseFree: false,
  },
  {
    id: INGREDIENT_IDS.minasCheese,
    name: 'Queijo minas cura',
    allergens: ['leite', 'lactose'],
    lactoseFree: false,
  },
  {
    id: INGREDIENT_IDS.nutritionalYeast,
    name: 'Levedura nutricional',
    allergens: [],
    lactoseFree: false,
  },
  { id: INGREDIENT_IDS.oliveOil, name: 'Azeite de oliva', allergens: [], lactoseFree: false },
  { id: INGREDIENT_IDS.garlic, name: 'Alho', allergens: [], lactoseFree: false },
  { id: INGREDIENT_IDS.tomato, name: 'Tomate', allergens: [], lactoseFree: false },
  { id: INGREDIENT_IDS.eggplant, name: 'Berinjela', allergens: [], lactoseFree: false },
  { id: INGREDIENT_IDS.zucchini, name: 'Abobrinha', allergens: [], lactoseFree: false },
  { id: INGREDIENT_IDS.groundBeef, name: 'Carne bovina moída', allergens: [], lactoseFree: false },
  { id: INGREDIENT_IDS.chickenBreast, name: 'Peito de frango', allergens: [], lactoseFree: false },
  {
    id: INGREDIENT_IDS.whiteFish,
    name: 'Filé de peixe branco',
    allergens: ['peixe'],
    lactoseFree: false,
  },
  { id: INGREDIENT_IDS.salmon, name: 'Salmão', allergens: ['peixe'], lactoseFree: false },
  { id: INGREDIENT_IDS.shrimp, name: 'Camarão', allergens: ['crustaceos'], lactoseFree: false },
  {
    id: INGREDIENT_IDS.peanut,
    name: 'Amendoim torrado',
    allergens: ['amendoim'],
    lactoseFree: false,
  },
  {
    id: INGREDIENT_IDS.cashewNut,
    name: 'Castanha-de-caju',
    allergens: ['castanha_caju'],
    lactoseFree: false,
  },
  {
    id: INGREDIENT_IDS.almond,
    name: 'Amêndoa laminada',
    allergens: ['amendoa'],
    lactoseFree: false,
  },
  { id: INGREDIENT_IDS.soySauce, name: 'Molho shoyu', allergens: ['soja'], lactoseFree: false },
  {
    id: INGREDIENT_IDS.coconutAminos,
    name: 'Molho de coco aminos',
    allergens: [],
    lactoseFree: false,
  },
  { id: INGREDIENT_IDS.tofu, name: 'Tofu firme', allergens: ['soja'], lactoseFree: false },
  { id: INGREDIENT_IDS.chickpea, name: 'Grão-de-bico cozido', allergens: [], lactoseFree: false },
  {
    id: INGREDIENT_IDS.bulgurWheat,
    name: 'Trigo para quibe',
    allergens: ['trigo_centeio_cevada_aveia'],
    lactoseFree: false,
  },
  { id: INGREDIENT_IDS.japaneseRice, name: 'Arroz japonês', allergens: [], lactoseFree: false },
  { id: INGREDIENT_IDS.riceNoodles, name: 'Macarrão de arroz', allergens: [], lactoseFree: false },
  {
    id: INGREDIENT_IDS.sourTapiocaStarch,
    name: 'Polvilho azedo',
    allergens: [],
    lactoseFree: false,
  },
  { id: INGREDIENT_IDS.avocado, name: 'Abacate', allergens: [], lactoseFree: false },
  { id: INGREDIENT_IDS.cornTortilla, name: 'Tortilha de milho', allergens: [], lactoseFree: false },
  { id: INGREDIENT_IDS.lime, name: 'Limão', allergens: [], lactoseFree: false },
  {
    id: INGREDIENT_IDS.couscousSemolina,
    name: 'Semolina de cuscuz marroquino',
    allergens: ['trigo_centeio_cevada_aveia'],
    lactoseFree: false,
  },
  { id: INGREDIENT_IDS.shreddedCoconut, name: 'Coco ralado', allergens: [], lactoseFree: false },
  { id: INGREDIENT_IDS.cocoaPowder, name: 'Cacau em pó', allergens: [], lactoseFree: false },
  {
    id: INGREDIENT_IDS.fishSauce,
    name: 'Molho de peixe',
    allergens: ['peixe'],
    lactoseFree: false,
  },
];

export const UTENSIL_IDS = {
  saucepan: '30000000-0000-4000-8000-000000000001',
  fryingPan: '30000000-0000-4000-8000-000000000002',
  wok: '30000000-0000-4000-8000-000000000003',
  bakingSheet: '30000000-0000-4000-8000-000000000004',
  foodProcessor: '30000000-0000-4000-8000-000000000005',
  mixingBowl: '30000000-0000-4000-8000-000000000006',
} as const;

export const SEED_UTENSILS: readonly SeedUtensil[] = [
  { id: UTENSIL_IDS.saucepan, name: 'Panela média' },
  { id: UTENSIL_IDS.fryingPan, name: 'Frigideira antiaderente' },
  { id: UTENSIL_IDS.wok, name: 'Wok' },
  { id: UTENSIL_IDS.bakingSheet, name: 'Assadeira' },
  { id: UTENSIL_IDS.foodProcessor, name: 'Processador de alimentos' },
  { id: UTENSIL_IDS.mixingBowl, name: 'Tigela grande' },
];

// Global substitutions covering both safe (verified/confirmedAllergenFree) and unsafe/unverified cases (US10, RN22).
export const SEED_SUBSTITUTIONS: readonly SeedSubstitution[] = [
  {
    id: '40000000-0000-4000-8000-000000000001',
    ingredientId: INGREDIENT_IDS.wholeMilk,
    substituteId: INGREDIENT_IDS.lactoseFreeMilk,
    substituteAllergens: ['leite'],
    allergenState: 'verified',
    confirmedAllergenFree: false,
    origin: 'manual',
  },
  {
    id: '40000000-0000-4000-8000-000000000002',
    ingredientId: INGREDIENT_IDS.wholeMilk,
    substituteId: INGREDIENT_IDS.oatDrink,
    substituteAllergens: ['trigo_centeio_cevada_aveia'],
    allergenState: 'verified',
    confirmedAllergenFree: false,
    origin: 'manual',
  },
  {
    id: '40000000-0000-4000-8000-000000000003',
    ingredientId: INGREDIENT_IDS.wholeMilk,
    substituteId: INGREDIENT_IDS.coconutMilk,
    substituteAllergens: [],
    allergenState: 'verified',
    confirmedAllergenFree: true,
    origin: 'manual',
  },
  {
    id: '40000000-0000-4000-8000-000000000004',
    ingredientId: INGREDIENT_IDS.wheatFlour,
    substituteId: INGREDIENT_IDS.riceFlour,
    substituteAllergens: [],
    allergenState: 'verified',
    confirmedAllergenFree: true,
    origin: 'manual',
  },
  {
    id: '40000000-0000-4000-8000-000000000005',
    ingredientId: INGREDIENT_IDS.parmesanCheese,
    substituteId: INGREDIENT_IDS.nutritionalYeast,
    substituteAllergens: [],
    allergenState: 'verified',
    confirmedAllergenFree: true,
    origin: 'manual',
  },
  {
    id: '40000000-0000-4000-8000-000000000006',
    ingredientId: INGREDIENT_IDS.peanut,
    substituteId: INGREDIENT_IDS.cashewNut,
    substituteAllergens: ['castanha_caju'],
    allergenState: 'verified',
    confirmedAllergenFree: false,
    origin: 'manual',
  },
  {
    id: '40000000-0000-4000-8000-000000000007',
    ingredientId: INGREDIENT_IDS.soySauce,
    substituteId: INGREDIENT_IDS.coconutAminos,
    substituteAllergens: [],
    allergenState: 'unverified',
    confirmedAllergenFree: false,
    origin: 'manual',
  },
];

export const DISH_IDS = {
  // 3-level Italian evolution chain (RN18): Aglio e Olio (L1) -> Carbonara (L2) -> Tagliatelle al Ragù (L3)
  aglioEOlio: '50000000-0000-4000-8000-000000000001',
  carbonara: '50000000-0000-4000-8000-000000000002',
  raguBolognese: '50000000-0000-4000-8000-000000000003',
  ratatouille: '50000000-0000-4000-8000-000000000004',
  classicCrepe: '50000000-0000-4000-8000-000000000005',
  greekSalad: '50000000-0000-4000-8000-000000000006',
  chickenSouvlaki: '50000000-0000-4000-8000-000000000007',
  hummus: '50000000-0000-4000-8000-000000000008',
  bakedKibbeh: '50000000-0000-4000-8000-000000000009',
  salmonOnigiri: '50000000-0000-4000-8000-000000000010',
  tofuYakisoba: '50000000-0000-4000-8000-000000000011',
  shrimpPadThai: '50000000-0000-4000-8000-000000000012',
  greenChickenCurry: '50000000-0000-4000-8000-000000000013',
  fishMoqueca: '50000000-0000-4000-8000-000000000014',
  cheeseBread: '50000000-0000-4000-8000-000000000015',
  guacamole: '50000000-0000-4000-8000-000000000016',
  beefTacos: '50000000-0000-4000-8000-000000000017',
  almondChickenTagine: '50000000-0000-4000-8000-000000000018',
  moroccanCouscous: '50000000-0000-4000-8000-000000000019',
  lamington: '50000000-0000-4000-8000-000000000020',
} as const;

export const SEED_DISHES: readonly SeedDishRecipe[] = [
  {
    id: DISH_IDS.aglioEOlio,
    name: 'Spaghetti Aglio e Olio',
    cuisineId: CUISINE_IDS.italian,
    baseDishId: null,
    prepTimeMinutes: 20,
    difficulty: 'easy',
    ingredients: [
      { ingredientId: INGREDIENT_IDS.wheatPasta, quantity: '200', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.oliveOil, quantity: '4', unit: 'colheres de sopa' },
      { ingredientId: INGREDIENT_IDS.garlic, quantity: '4', unit: 'dentes' },
    ],
    utensilIds: [UTENSIL_IDS.saucepan, UTENSIL_IDS.fryingPan],
    steps: [
      'Cozinhe a massa em água salgada até ficar al dente.',
      'Doure o alho fatiado lentamente no azeite em fogo baixo.',
      'Envolva a massa na frigideira com um pouco da água do cozimento e sirva.',
    ],
    sourceName: 'Acervo Curado Panelada (Clássicos Italianos)',
    sourceUrl: 'https://panelada.app/sources/spaghetti-aglio-e-olio',
    photoColor: [219, 179, 89],
  },
  {
    id: DISH_IDS.carbonara,
    name: 'Spaghetti alla Carbonara',
    cuisineId: CUISINE_IDS.italian,
    baseDishId: DISH_IDS.aglioEOlio,
    prepTimeMinutes: 25,
    difficulty: 'medium',
    ingredients: [
      { ingredientId: INGREDIENT_IDS.wheatPasta, quantity: '200', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.egg, quantity: '3', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.parmesanCheese, quantity: '60', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.oliveOil, quantity: '1', unit: 'colher de sopa' },
    ],
    utensilIds: [UTENSIL_IDS.saucepan, UTENSIL_IDS.fryingPan, UTENSIL_IDS.mixingBowl],
    steps: [
      'Misture os ovos com o queijo ralado e pimenta-do-reino em uma tigela.',
      'Cozinhe a massa al dente reservando meia xícara da água do cozimento.',
      'Fora do fogo, emulsione a massa quente com o creme de ovos e a água reservada.',
    ],
    sourceName: 'Acervo Curado Panelada (Clássicos Italianos)',
    sourceUrl: 'https://panelada.app/sources/spaghetti-alla-carbonara',
    photoColor: [232, 195, 102],
  },
  {
    id: DISH_IDS.raguBolognese,
    name: 'Tagliatelle al Ragù Bolognese',
    cuisineId: CUISINE_IDS.italian,
    baseDishId: DISH_IDS.carbonara,
    prepTimeMinutes: 90,
    difficulty: 'hard',
    ingredients: [
      { ingredientId: INGREDIENT_IDS.wheatPasta, quantity: '250', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.groundBeef, quantity: '350', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.tomato, quantity: '400', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.wholeMilk, quantity: '100', unit: 'ml' },
      { ingredientId: INGREDIENT_IDS.parmesanCheese, quantity: '50', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.oliveOil, quantity: '2', unit: 'colheres de sopa' },
    ],
    utensilIds: [UTENSIL_IDS.saucepan, UTENSIL_IDS.fryingPan],
    steps: [
      'Sele a carne moída no azeite até dourar bem.',
      'Adicione os tomates pelados e cozinhe em fogo bem baixo por 60 minutos.',
      'Finalize com leite para suavizar a acidez, envolva a massa fresca e polvilhe queijo.',
    ],
    sourceName: 'Acervo Curado Panelada (Clássicos Italianos)',
    sourceUrl: 'https://panelada.app/sources/tagliatelle-al-ragu-bolognese',
    photoColor: [168, 62, 46],
  },
  {
    id: DISH_IDS.ratatouille,
    name: 'Ratatouille Provençal',
    cuisineId: CUISINE_IDS.french,
    baseDishId: null,
    prepTimeMinutes: 45,
    difficulty: 'easy',
    ingredients: [
      { ingredientId: INGREDIENT_IDS.eggplant, quantity: '1', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.zucchini, quantity: '2', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.tomato, quantity: '4', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.garlic, quantity: '3', unit: 'dentes' },
      { ingredientId: INGREDIENT_IDS.oliveOil, quantity: '3', unit: 'colheres de sopa' },
    ],
    utensilIds: [UTENSIL_IDS.bakingSheet, UTENSIL_IDS.fryingPan],
    steps: [
      'Refogue metade dos tomates com alho e azeite para formar o molho base.',
      'Fatie berinjela, abobrinha e tomates em rodelas finas e intercale na assadeira.',
      'Regue com azeite e asse a 190 °C por 35 minutos até ficarem macios e dourados.',
    ],
    sourceName: 'Acervo Curado Panelada (Cozinha Francesa)',
    sourceUrl: 'https://panelada.app/sources/ratatouille-provencal',
    photoColor: [194, 72, 54],
  },
  {
    id: DISH_IDS.classicCrepe,
    name: 'Crepe Clássico Francês',
    cuisineId: CUISINE_IDS.french,
    baseDishId: null,
    prepTimeMinutes: 25,
    difficulty: 'easy',
    ingredients: [
      { ingredientId: INGREDIENT_IDS.wheatFlour, quantity: '1', unit: 'xícara' },
      { ingredientId: INGREDIENT_IDS.egg, quantity: '2', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.wholeMilk, quantity: '250', unit: 'ml' },
    ],
    utensilIds: [UTENSIL_IDS.fryingPan, UTENSIL_IDS.mixingBowl],
    steps: [
      'Bata farinha, ovos e leite até obter uma massa lisa e fluida.',
      'Despeje uma concha fina na frigideira aquecida girando para espalhar.',
      'Doure dos dois lados e dobre para servir.',
    ],
    sourceName: 'Acervo Curado Panelada (Cozinha Francesa)',
    sourceUrl: 'https://panelada.app/sources/crepe-classico-frances',
    photoColor: [228, 189, 118],
  },
  {
    id: DISH_IDS.greekSalad,
    name: 'Salada Grega Tradicional',
    cuisineId: CUISINE_IDS.greek,
    baseDishId: null,
    prepTimeMinutes: 15,
    difficulty: 'easy',
    ingredients: [
      { ingredientId: INGREDIENT_IDS.tomato, quantity: '3', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.fetaCheese, quantity: '120', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.oliveOil, quantity: '3', unit: 'colheres de sopa' },
      { ingredientId: INGREDIENT_IDS.lime, quantity: '1', unit: 'un' },
    ],
    utensilIds: [UTENSIL_IDS.mixingBowl],
    steps: [
      'Corte os tomates em gomos rústicos e disponha em uma tigela.',
      'Adicione o queijo feta em cubos ou fatia inteira por cima.',
      'Finalize com azeite de oliva, gotas de limão e orégano.',
    ],
    sourceName: 'Acervo Curado Panelada (Mediterrâneo)',
    sourceUrl: 'https://panelada.app/sources/salada-grega-tradicional',
    photoColor: [92, 152, 88],
  },
  {
    id: DISH_IDS.chickenSouvlaki,
    name: 'Souvlaki de Frango com Limão',
    cuisineId: CUISINE_IDS.greek,
    baseDishId: null,
    prepTimeMinutes: 30,
    difficulty: 'easy',
    ingredients: [
      { ingredientId: INGREDIENT_IDS.chickenBreast, quantity: '400', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.lime, quantity: '1', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.garlic, quantity: '2', unit: 'dentes' },
      { ingredientId: INGREDIENT_IDS.oliveOil, quantity: '2', unit: 'colheres de sopa' },
    ],
    utensilIds: [UTENSIL_IDS.fryingPan, UTENSIL_IDS.mixingBowl],
    steps: [
      'Marine os cubos de frango com suco de limão, alho picado e azeite por 15 minutos.',
      'Grelhe em frigideira bem quente virando até dourar por igual.',
      'Sirva quente com gotas extras de limão.',
    ],
    sourceName: 'Acervo Curado Panelada (Mediterrâneo)',
    sourceUrl: 'https://panelada.app/sources/souvlaki-de-frango',
    photoColor: [204, 152, 68],
  },
  {
    id: DISH_IDS.hummus,
    name: 'Homus de Grão-de-Bico',
    cuisineId: CUISINE_IDS.arab,
    baseDishId: null,
    prepTimeMinutes: 15,
    difficulty: 'easy',
    ingredients: [
      { ingredientId: INGREDIENT_IDS.chickpea, quantity: '250', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.garlic, quantity: '1', unit: 'dente' },
      { ingredientId: INGREDIENT_IDS.lime, quantity: '1', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.oliveOil, quantity: '3', unit: 'colheres de sopa' },
    ],
    utensilIds: [UTENSIL_IDS.foodProcessor],
    steps: [
      'Bata o grão-de-bico cozido com alho, suco de limão e um fio de água gelada.',
      'Adicione azeite gradualmente até atingir textura cremosa e homogênea.',
      'Sirva em prato raso regado com azeite.',
    ],
    sourceName: 'Acervo Curado Panelada (Oriente Médio)',
    sourceUrl: 'https://panelada.app/sources/homus-de-grao-de-bico',
    photoColor: [218, 198, 148],
  },
  {
    id: DISH_IDS.bakedKibbeh,
    name: 'Quibe Assado Tradicional',
    cuisineId: CUISINE_IDS.arab,
    baseDishId: null,
    prepTimeMinutes: 50,
    difficulty: 'medium',
    ingredients: [
      { ingredientId: INGREDIENT_IDS.bulgurWheat, quantity: '200', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.groundBeef, quantity: '400', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.garlic, quantity: '2', unit: 'dentes' },
      { ingredientId: INGREDIENT_IDS.oliveOil, quantity: '3', unit: 'colheres de sopa' },
    ],
    utensilIds: [UTENSIL_IDS.bakingSheet, UTENSIL_IDS.mixingBowl],
    steps: [
      'Hidrate o trigo para quibe por 20 minutos e escorra bem o excesso de água.',
      'Misture com a carne moída, alho e temperos até dar liga.',
      'Espalhe na assadeira, faça cortes em losangos, regue com azeite e asse por 30 minutos.',
    ],
    sourceName: 'Acervo Curado Panelada (Oriente Médio)',
    sourceUrl: 'https://panelada.app/sources/quibe-assado-tradicional',
    photoColor: [148, 86, 52],
  },
  {
    id: DISH_IDS.salmonOnigiri,
    name: 'Onigiri de Salmão Grelhado',
    cuisineId: CUISINE_IDS.japanese,
    baseDishId: null,
    prepTimeMinutes: 30,
    difficulty: 'easy',
    ingredients: [
      { ingredientId: INGREDIENT_IDS.japaneseRice, quantity: '200', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.salmon, quantity: '150', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.soySauce, quantity: '1', unit: 'colher de sopa' },
    ],
    utensilIds: [UTENSIL_IDS.saucepan, UTENSIL_IDS.fryingPan],
    steps: [
      'Cozinhe o arroz japonês até ficar macio e levemente aderente.',
      'Grelhe o salmão, desfie em lascas e tempere com shoyu.',
      'Modele triângulos de arroz com o recheio de salmão ao centro.',
    ],
    sourceName: 'Acervo Curado Panelada (Cozinha Japonesa)',
    sourceUrl: 'https://panelada.app/sources/onigiri-de-salmao',
    photoColor: [232, 134, 114],
  },
  {
    id: DISH_IDS.tofuYakisoba,
    name: 'Yakisoba de Legumes e Tofu',
    cuisineId: CUISINE_IDS.japanese,
    baseDishId: null,
    prepTimeMinutes: 30,
    difficulty: 'medium',
    ingredients: [
      { ingredientId: INGREDIENT_IDS.wheatPasta, quantity: '200', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.tofu, quantity: '200', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.zucchini, quantity: '1', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.soySauce, quantity: '3', unit: 'colheres de sopa' },
      { ingredientId: INGREDIENT_IDS.garlic, quantity: '2', unit: 'dentes' },
    ],
    utensilIds: [UTENSIL_IDS.wok, UTENSIL_IDS.saucepan],
    steps: [
      'Cozinhe o macarrão al dente e reserve.',
      'Doure o tofu em cubos no wok e salteie a abobrinha fatiada com alho.',
      'Incorpore a massa e o shoyu mexendo em fogo alto por 2 minutos.',
    ],
    sourceName: 'Acervo Curado Panelada (Cozinha Japonesa)',
    sourceUrl: 'https://panelada.app/sources/yakisoba-de-legumes-e-tofu',
    photoColor: [132, 92, 58],
  },
  {
    id: DISH_IDS.shrimpPadThai,
    name: 'Pad Thai de Camarão',
    cuisineId: CUISINE_IDS.thai,
    baseDishId: null,
    prepTimeMinutes: 35,
    difficulty: 'medium',
    ingredients: [
      { ingredientId: INGREDIENT_IDS.riceNoodles, quantity: '200', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.shrimp, quantity: '200', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.egg, quantity: '2', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.peanut, quantity: '40', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.soySauce, quantity: '2', unit: 'colheres de sopa' },
      { ingredientId: INGREDIENT_IDS.fishSauce, quantity: '1', unit: 'colher de sopa' },
      { ingredientId: INGREDIENT_IDS.lime, quantity: '1', unit: 'un' },
    ],
    utensilIds: [UTENSIL_IDS.wok, UTENSIL_IDS.mixingBowl],
    steps: [
      'Hidrate o macarrão de arroz em água morna até ficar maleável.',
      'Salteie o camarão no wok, empurre para o lado e mexa os ovos rapidamente.',
      'Junte o macarrão, shoyu e molho de peixe; sirva com amendoim picado e limão.',
    ],
    sourceName: 'Acervo Curado Panelada (Sudeste Asiático)',
    sourceUrl: 'https://panelada.app/sources/pad-thai-de-camarao',
    photoColor: [204, 118, 52],
  },
  {
    id: DISH_IDS.greenChickenCurry,
    name: 'Curry Verde de Frango com Leite de Coco',
    cuisineId: CUISINE_IDS.thai,
    baseDishId: null,
    prepTimeMinutes: 35,
    difficulty: 'medium',
    ingredients: [
      { ingredientId: INGREDIENT_IDS.chickenBreast, quantity: '350', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.coconutMilk, quantity: '300', unit: 'ml' },
      { ingredientId: INGREDIENT_IDS.zucchini, quantity: '1', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.fishSauce, quantity: '1', unit: 'colher de sopa' },
      { ingredientId: INGREDIENT_IDS.garlic, quantity: '2', unit: 'dentes' },
    ],
    utensilIds: [UTENSIL_IDS.saucepan],
    steps: [
      'Aqueça metade do leite de coco com alho e ervas verdes até perfumar.',
      'Adicione o frango em tiras e sele rapidamente.',
      'Junte o restante do leite de coco, a abobrinha e o molho de peixe; cozinhe por 15 minutos.',
    ],
    sourceName: 'Acervo Curado Panelada (Sudeste Asiático)',
    sourceUrl: 'https://panelada.app/sources/curry-verde-frango',
    photoColor: [112, 156, 86],
  },
  {
    id: DISH_IDS.fishMoqueca,
    name: 'Moqueca Baiana de Peixe',
    cuisineId: CUISINE_IDS.brazilian,
    baseDishId: null,
    prepTimeMinutes: 40,
    difficulty: 'medium',
    ingredients: [
      { ingredientId: INGREDIENT_IDS.whiteFish, quantity: '500', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.coconutMilk, quantity: '200', unit: 'ml' },
      { ingredientId: INGREDIENT_IDS.tomato, quantity: '3', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.lime, quantity: '1', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.garlic, quantity: '3', unit: 'dentes' },
      { ingredientId: INGREDIENT_IDS.oliveOil, quantity: '2', unit: 'colheres de sopa' },
    ],
    utensilIds: [UTENSIL_IDS.saucepan],
    steps: [
      'Tempere as postas de peixe com limão e alho amassado.',
      'Monte camadas de tomate e peixe na panela e regue com azeite e leite de coco.',
      'Cozinhe tampado em fogo brando por 20 minutos sem mexer para não desmanchar o peixe.',
    ],
    sourceName: 'Acervo Curado Panelada (Cozinha Brasileira)',
    sourceUrl: 'https://panelada.app/sources/moqueca-baiana-de-peixe',
    photoColor: [218, 108, 38],
  },
  {
    id: DISH_IDS.cheeseBread,
    name: 'Pão de Queijo Mineiro',
    cuisineId: CUISINE_IDS.brazilian,
    baseDishId: null,
    prepTimeMinutes: 35,
    difficulty: 'easy',
    ingredients: [
      { ingredientId: INGREDIENT_IDS.sourTapiocaStarch, quantity: '250', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.wholeMilk, quantity: '120', unit: 'ml' },
      { ingredientId: INGREDIENT_IDS.egg, quantity: '2', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.minasCheese, quantity: '150', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.oliveOil, quantity: '60', unit: 'ml' },
    ],
    utensilIds: [UTENSIL_IDS.saucepan, UTENSIL_IDS.bakingSheet, UTENSIL_IDS.mixingBowl],
    steps: [
      'Ferva o leite com azeite e escalde o polvilho azedo na tigela.',
      'Quando amornar, incorpore os ovos e o queijo ralado até formar massa moldável.',
      'Enrole bolinhas e asse a 200 °C por 25 minutos até dourar.',
    ],
    sourceName: 'Acervo Curado Panelada (Cozinha Brasileira)',
    sourceUrl: 'https://panelada.app/sources/pao-de-queijo-mineiro',
    photoColor: [226, 188, 106],
  },
  {
    id: DISH_IDS.guacamole,
    name: 'Guacamole Fresco com Tortilhas de Milho',
    cuisineId: CUISINE_IDS.mexican,
    baseDishId: null,
    prepTimeMinutes: 10,
    difficulty: 'easy',
    ingredients: [
      { ingredientId: INGREDIENT_IDS.avocado, quantity: '2', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.tomato, quantity: '1', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.lime, quantity: '1', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.cornTortilla, quantity: '120', unit: 'g' },
    ],
    utensilIds: [UTENSIL_IDS.mixingBowl],
    steps: [
      'Amasse grosseiramente o abacate maduro com um garfo na tigela.',
      'Misture tomate picado em cubinhos, sal e suco fresco de limão.',
      'Sirva imediatamente acompanhado das tortilhas de milho crocantes.',
    ],
    sourceName: 'Acervo Curado Panelada (Cozinha Mexicana)',
    sourceUrl: 'https://panelada.app/sources/guacamole-fresco',
    photoColor: [108, 166, 74],
  },
  {
    id: DISH_IDS.beefTacos,
    name: 'Tacos de Carne com Salsa Fresca',
    cuisineId: CUISINE_IDS.mexican,
    baseDishId: null,
    prepTimeMinutes: 25,
    difficulty: 'easy',
    ingredients: [
      { ingredientId: INGREDIENT_IDS.cornTortilla, quantity: '6', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.groundBeef, quantity: '300', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.tomato, quantity: '2', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.garlic, quantity: '2', unit: 'dentes' },
      { ingredientId: INGREDIENT_IDS.lime, quantity: '1', unit: 'un' },
    ],
    utensilIds: [UTENSIL_IDS.fryingPan],
    steps: [
      'Doure a carne moída com alho em frigideira bem quente.',
      'Aqueça rapidamente as tortilhas de milho na frigideira seca.',
      'Monte os tacos com a carne, tomate picado e gotas de limão.',
    ],
    sourceName: 'Acervo Curado Panelada (Cozinha Mexicana)',
    sourceUrl: 'https://panelada.app/sources/tacos-de-carne',
    photoColor: [188, 92, 54],
  },
  {
    id: DISH_IDS.almondChickenTagine,
    name: 'Tagine de Frango com Amêndoas e Limão',
    cuisineId: CUISINE_IDS.moroccan,
    baseDishId: null,
    prepTimeMinutes: 50,
    difficulty: 'medium',
    ingredients: [
      { ingredientId: INGREDIENT_IDS.chickenBreast, quantity: '450', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.almond, quantity: '50', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.lime, quantity: '1', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.garlic, quantity: '3', unit: 'dentes' },
      { ingredientId: INGREDIENT_IDS.oliveOil, quantity: '2', unit: 'colheres de sopa' },
    ],
    utensilIds: [UTENSIL_IDS.saucepan],
    steps: [
      'Doure o frango no azeite com alho e especiarias suaves.',
      'Junte água quente e rodelas de limão e cozinhe tampado por 30 minutos.',
      'Finalize com amêndoas laminadas tostadas antes de servir.',
    ],
    sourceName: 'Acervo Curado Panelada (Norte da África)',
    sourceUrl: 'https://panelada.app/sources/tagine-frango-amendoas',
    photoColor: [212, 148, 56],
  },
  {
    id: DISH_IDS.moroccanCouscous,
    name: 'Cuscuz Marroquino de Legumes',
    cuisineId: CUISINE_IDS.moroccan,
    baseDishId: null,
    prepTimeMinutes: 20,
    difficulty: 'easy',
    ingredients: [
      { ingredientId: INGREDIENT_IDS.couscousSemolina, quantity: '200', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.zucchini, quantity: '1', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.tomato, quantity: '2', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.oliveOil, quantity: '2', unit: 'colheres de sopa' },
    ],
    utensilIds: [UTENSIL_IDS.fryingPan, UTENSIL_IDS.mixingBowl],
    steps: [
      'Hidrate a semolina em água fervente com sal e azeite, tampada por 5 minutos.',
      'Salteie abobrinha e tomate em cubos rapidamente na frigideira.',
      'Solte os grãos do cuscuz com garfo e misture os legumes.',
    ],
    sourceName: 'Acervo Curado Panelada (Norte da África)',
    sourceUrl: 'https://panelada.app/sources/cuscuz-marroquino-legumes',
    photoColor: [224, 178, 86],
  },
  {
    id: DISH_IDS.lamington,
    name: 'Lamington Australiano',
    cuisineId: CUISINE_IDS.australian,
    baseDishId: null,
    prepTimeMinutes: 45,
    difficulty: 'medium',
    ingredients: [
      { ingredientId: INGREDIENT_IDS.wheatFlour, quantity: '200', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.egg, quantity: '3', unit: 'un' },
      { ingredientId: INGREDIENT_IDS.wholeMilk, quantity: '120', unit: 'ml' },
      { ingredientId: INGREDIENT_IDS.cocoaPowder, quantity: '40', unit: 'g' },
      { ingredientId: INGREDIENT_IDS.shreddedCoconut, quantity: '100', unit: 'g' },
    ],
    utensilIds: [UTENSIL_IDS.bakingSheet, UTENSIL_IDS.mixingBowl],
    steps: [
      'Asse um pão-de-ló simples com farinha, ovos e leite e corte em cubos após esfriar.',
      'Prepare uma calda rápida com leite e cacau em pó.',
      'Banhe cada cubo de bolo na calda de cacau e envolva no coco ralado.',
    ],
    sourceName: 'Acervo Curado Panelada (Oceania)',
    sourceUrl: 'https://panelada.app/sources/lamington-australiano',
    photoColor: [104, 68, 52],
  },
];

// 11 canonical badges exercising all 8 declarative Milestone variants (RN03 a-h, ADR-016).
export const SEED_BADGES: readonly SeedBadgeDefinition[] = [
  {
    id: '60000000-0000-4000-8000-000000000001',
    name: 'Primeiro Fogo',
    description: 'Concluiu seu primeiro prato no Panelada.',
    milestone: { type: 'total_dishes', quantity: 1 },
  },
  {
    id: '60000000-0000-4000-8000-000000000002',
    name: 'Mini Chef',
    description: 'Preparou e avaliou o clássico Ratatouille.',
    milestone: { type: 'dish', dishId: DISH_IDS.ratatouille },
  },
  {
    id: '60000000-0000-4000-8000-000000000003',
    name: 'Toque Pessoal',
    description: 'Registrou sua primeira adaptação criativa em uma receita.',
    milestone: { type: 'adaptation_count', quantity: 1 },
  },
  {
    id: '60000000-0000-4000-8000-000000000004',
    name: 'Chegando na Arábia',
    description: 'Concluiu ao menos um prato da culinária árabe.',
    milestone: { type: 'cuisine', cuisineId: CUISINE_IDS.arab },
  },
  {
    id: '60000000-0000-4000-8000-000000000005',
    name: 'Além do Básico',
    description: 'Desbloqueou e concluiu a primeira evolução de um prato (nível 2).',
    milestone: { type: 'evolution_level', minLevel: 2 },
  },
  {
    id: '60000000-0000-4000-8000-000000000006',
    name: 'Chef de Rotina',
    description: 'Concluiu 5 pratos distintos do catálogo.',
    milestone: { type: 'total_dishes', quantity: 5 },
  },
  {
    id: '60000000-0000-4000-8000-000000000007',
    name: 'Alquimista da Cozinha',
    description: 'Registrou alterações pessoais em 5 preparos.',
    milestone: { type: 'adaptation_count', quantity: 5 },
  },
  {
    id: '60000000-0000-4000-8000-000000000008',
    name: 'Grandes Civilizações',
    description: 'Concluiu pratos das culinárias italiana, grega e árabe.',
    milestone: {
      type: 'set',
      cuisineIds: [CUISINE_IDS.italian, CUISINE_IDS.greek, CUISINE_IDS.arab],
    },
  },
  {
    id: '60000000-0000-4000-8000-000000000009',
    name: 'Mestre da Evolução',
    description: 'Concluiu o topo de uma cadeia de evolução de 3 níveis.',
    milestone: { type: 'evolution_level', minLevel: 3 },
  },
  {
    id: '60000000-0000-4000-8000-000000000010',
    name: 'Passaporte Carimbado',
    description: 'Concluiu pratos de 10 culinárias distintas.',
    milestone: { type: 'n_cuisines', quantity: 10 },
  },
  {
    id: '60000000-0000-4000-8000-000000000011',
    name: 'Rei do Mundo',
    description: 'Concluiu ao menos um prato de cada um dos 5 continentes.',
    milestone: { type: 'all_continents' },
  },
];
