import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import eslintConfigPrettier from 'eslint-config-prettier';
import importX from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Node built-in modules forbidden inside packages/allergen-rules (S6, ADR-014).
const NODE_BUILTINS = [
  'assert',
  'buffer',
  'child_process',
  'cluster',
  'crypto',
  'dgram',
  'dns',
  'events',
  'fs',
  'http',
  'http2',
  'https',
  'inspector',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'querystring',
  'readline',
  'stream',
  'string_decoder',
  'timers',
  'tls',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'worker_threads',
  'zlib',
];

const BOUNDARY_ELEMENTS = [
  // Shared pure allergen rules package (ADR-014, S6, A7).
  {
    type: 'allergen-rules-entry',
    pattern: 'packages/allergen-rules/src/rules.ts',
    mode: 'full',
  },
  {
    type: 'allergen-rules-invariants',
    pattern: 'packages/allergen-rules/src/invariants.ts',
    mode: 'full',
  },
  {
    type: 'allergen-rules-src',
    pattern: 'packages/allergen-rules/src/**/*.ts',
    mode: 'full',
  },

  // API server modular monolith (ADR-002, S1-S8).
  {
    type: 'api-profile-restrictions-port',
    pattern: 'apps/api/src/modules/profile/public/restrictions-for-filter.ts',
    mode: 'full',
  },
  {
    type: 'api-profile-restrictions-owner-sync-port',
    pattern: 'apps/api/src/modules/profile/public/restrictions-for-owner-sync.ts',
    mode: 'full',
  },
  {
    type: 'api-catalog-write-port',
    pattern: 'apps/api/src/modules/catalog/public/catalog-write.ts',
    mode: 'full',
  },
  {
    type: 'api-module-public',
    pattern: 'apps/api/src/modules/*/public/**/*.ts',
    mode: 'full',
    capture: ['module'],
  },
  {
    type: 'api-module-internal',
    pattern: 'apps/api/src/modules/*/internal/**/*.ts',
    mode: 'full',
    capture: ['module'],
  },
  {
    type: 'api-cross-cutting',
    pattern: 'apps/api/src/cross-cutting/*/**/*.ts',
    mode: 'full',
    capture: ['component'],
  },
  {
    type: 'api-field-encryption',
    pattern: 'apps/api/src/support/field-encryption/**/*.ts',
    mode: 'full',
  },
  {
    type: 'api-technical-log',
    pattern: 'apps/api/src/support/technical-log/**/*.ts',
    mode: 'full',
  },
  {
    type: 'api-shared',
    pattern: 'apps/api/src/shared/**/*.ts',
    mode: 'full',
  },
  {
    type: 'api-db',
    pattern: 'apps/api/src/db/**/*.ts',
    mode: 'full',
  },
  {
    type: 'api-composition',
    pattern: 'apps/api/src/{app,main}.ts',
    mode: 'full',
  },

  // Mobile Feature-First app (ADR-003, A1-A8).
  {
    type: 'mobile-composition',
    pattern: 'apps/mobile/src/app/composition/**/*.{ts,tsx}',
    mode: 'full',
  },
  {
    type: 'mobile-router',
    pattern: 'apps/mobile/app/**/*.{ts,tsx}',
    mode: 'full',
  },
  {
    type: 'mobile-pure-domain',
    pattern: 'apps/mobile/src/features/*/domain/{unlock-calculator,reminder-scheduler}.ts',
    mode: 'full',
    capture: ['feature'],
  },
  {
    type: 'mobile-feature-ui',
    pattern: 'apps/mobile/src/features/*/ui/**/*.{ts,tsx}',
    mode: 'full',
    capture: ['feature'],
  },
  {
    type: 'mobile-feature-domain',
    pattern: 'apps/mobile/src/features/*/domain/**/*.{ts,tsx}',
    mode: 'full',
    capture: ['feature'],
  },
  {
    type: 'mobile-feature-data',
    pattern: 'apps/mobile/src/features/*/data/**/*.{ts,tsx}',
    mode: 'full',
    capture: ['feature'],
  },
  {
    type: 'mobile-core-sqlcipher',
    pattern: 'apps/mobile/src/core/local-db/sqlcipher*.{ts,tsx}',
    mode: 'full',
  },
  {
    type: 'mobile-core-local-db-port',
    pattern: 'apps/mobile/src/core/local-db/local-database.ts',
    mode: 'full',
  },
  {
    type: 'mobile-core-local-db',
    pattern: 'apps/mobile/src/core/local-db/**/*.{ts,tsx}',
    mode: 'full',
  },
  {
    type: 'mobile-core-sync-enqueuer',
    pattern: 'apps/mobile/src/core/sync/operation-enqueuer.ts',
    mode: 'full',
  },
  {
    type: 'mobile-core-sync-adapter',
    pattern: 'apps/mobile/src/core/sync/**/*-adapter.{ts,tsx}',
    mode: 'full',
  },
  {
    type: 'mobile-core-sync-internal',
    pattern: 'apps/mobile/src/core/sync/**/*.{ts,tsx}',
    mode: 'full',
  },
  // Types generated from openapi.yaml: a shared contract, not network behavior, so ports outside
  // core/network (e.g. OperationEnqueuer) may reference operation and payload types.
  {
    type: 'mobile-api-contract',
    pattern: 'apps/mobile/src/core/network/openapi.generated.ts',
    mode: 'full',
  },
  {
    type: 'mobile-core-adapter',
    pattern: 'apps/mobile/src/core/*/**/*-adapter.{ts,tsx}',
    mode: 'full',
    capture: ['coreArea'],
  },
  {
    type: 'mobile-core-network',
    pattern: 'apps/mobile/src/core/network/**/*.{ts,tsx}',
    mode: 'full',
  },
  {
    type: 'mobile-core-notifications',
    pattern: 'apps/mobile/src/core/notifications/**/*.{ts,tsx}',
    mode: 'full',
  },
  {
    type: 'mobile-core-other',
    pattern: 'apps/mobile/src/core/*/**/*.{ts,tsx}',
    mode: 'full',
    capture: ['coreArea'],
  },
  {
    type: 'mobile-shared',
    pattern: 'apps/mobile/src/shared/**/*.{ts,tsx}',
    mode: 'full',
  },
];

const BOUNDARY_RULES = [
  // S6: packages/allergen-rules stays 100% pure and isolated from apps.
  {
    from: ['allergen-rules-entry', 'allergen-rules-invariants', 'allergen-rules-src'],
    allow: ['allergen-rules-entry', 'allergen-rules-invariants', 'allergen-rules-src'],
  },

  // S1, S2: catalog, profile, and routine do not import other domain modules or cross-cutting.
  {
    from: [
      ['api-module-public', { module: 'catalog' }],
      ['api-module-internal', { module: 'catalog' }],
    ],
    allow: [
      ['api-module-public', { module: 'catalog' }],
      ['api-module-internal', { module: 'catalog' }],
      'api-catalog-write-port',
      'api-shared',
      'api-db',
      'api-technical-log',
      'allergen-rules-entry',
      'allergen-rules-invariants',
    ],
  },
  {
    from: [
      ['api-module-public', { module: 'profile' }],
      ['api-module-internal', { module: 'profile' }],
    ],
    allow: [
      ['api-module-public', { module: 'profile' }],
      ['api-module-internal', { module: 'profile' }],
      'api-profile-restrictions-port',
      'api-profile-restrictions-owner-sync-port',
      // S5: only modules/profile imports support/field-encryption.
      'api-field-encryption',
      'api-shared',
      'api-db',
      'api-technical-log',
      'allergen-rules-entry',
      'allergen-rules-invariants',
    ],
  },
  {
    from: [
      ['api-module-public', { module: 'routine' }],
      ['api-module-internal', { module: 'routine' }],
    ],
    allow: [
      ['api-module-public', { module: 'routine' }],
      ['api-module-internal', { module: 'routine' }],
      'api-shared',
      'api-db',
      'api-technical-log',
      'allergen-rules-entry',
    ],
  },
  // S2: progress may read catalog/public only.
  {
    from: [
      ['api-module-public', { module: 'progress' }],
      ['api-module-internal', { module: 'progress' }],
    ],
    allow: [
      ['api-module-public', { module: 'progress' }],
      ['api-module-internal', { module: 'progress' }],
      ['api-module-public', { module: 'catalog' }],
      'api-shared',
      'api-db',
      'api-technical-log',
      'allergen-rules-entry',
    ],
  },
  // S2, S4: importer may import catalog/public and catalog/public/catalog-write.
  {
    from: [
      ['api-module-public', { module: 'importer' }],
      ['api-module-internal', { module: 'importer' }],
    ],
    allow: [
      ['api-module-public', { module: 'importer' }],
      ['api-module-internal', { module: 'importer' }],
      ['api-module-public', { module: 'catalog' }],
      'api-catalog-write-port',
      'api-shared',
      'api-db',
      'api-technical-log',
      'allergen-rules-entry',
      'allergen-rules-invariants',
    ],
  },
  {
    from: ['api-profile-restrictions-port'],
    allow: [
      ['api-module-internal', { module: 'profile' }],
      ['api-module-public', { module: 'profile' }],
      'api-shared',
      'allergen-rules-entry',
    ],
  },
  {
    from: ['api-profile-restrictions-owner-sync-port'],
    allow: [
      ['api-module-internal', { module: 'profile' }],
      ['api-module-public', { module: 'profile' }],
      'api-shared',
      'allergen-rules-entry',
    ],
  },
  {
    from: ['api-catalog-write-port'],
    allow: [
      ['api-module-internal', { module: 'catalog' }],
      ['api-module-public', { module: 'catalog' }],
      'api-shared',
      'allergen-rules-entry',
      'allergen-rules-invariants',
    ],
  },

  // S3: only cross-cutting/suggestion-search may import profile/public/restrictions-for-filter.
  {
    from: [['api-cross-cutting', { component: 'suggestion-search' }]],
    allow: [
      ['api-cross-cutting', { component: 'suggestion-search' }],
      'api-module-public',
      'api-profile-restrictions-port',
      'api-shared',
      'api-db',
      'api-technical-log',
      'allergen-rules-entry',
    ],
  },
  {
    from: [['api-cross-cutting', { component: 'sync' }]],
    allow: [
      ['api-cross-cutting', { component: 'sync' }],
      'api-module-public',
      // A05: only sync may read owner restrictions+consent to build GET /v1/sync/download-set.
      'api-profile-restrictions-owner-sync-port',
      'api-shared',
      'api-db',
      'api-technical-log',
      'allergen-rules-entry',
    ],
  },
  {
    from: [['api-cross-cutting', { component: 'identity' }]],
    allow: [
      ['api-cross-cutting', { component: 'identity' }],
      'api-module-public',
      'api-shared',
      'api-db',
      'api-technical-log',
      'allergen-rules-entry',
    ],
  },
  {
    from: ['api-field-encryption'],
    allow: ['api-field-encryption', 'api-shared', 'api-technical-log'],
  },
  {
    from: ['api-technical-log'],
    allow: ['api-technical-log', 'api-shared'],
  },
  {
    from: ['api-shared'],
    allow: ['api-shared', 'allergen-rules-entry', 'allergen-rules-invariants'],
  },
  {
    from: ['api-db'],
    allow: ['api-db', 'api-shared', 'api-technical-log'],
  },
  {
    from: ['api-composition'],
    allow: [
      'api-composition',
      'api-module-public',
      'api-profile-restrictions-port',
      'api-profile-restrictions-owner-sync-port',
      'api-catalog-write-port',
      'api-cross-cutting',
      'api-field-encryption',
      'api-technical-log',
      'api-shared',
      'api-db',
      'allergen-rules-entry',
      'allergen-rules-invariants',
    ],
  },

  // Mobile Feature-First boundaries (A1-A8).
  {
    from: ['mobile-router'],
    allow: ['mobile-composition', 'mobile-feature-ui', 'mobile-shared', 'allergen-rules-entry'],
  },
  // A8: only src/app/composition instantiates concrete adapters.
  {
    from: ['mobile-composition'],
    allow: [
      'mobile-composition',
      'mobile-feature-ui',
      'mobile-feature-domain',
      'mobile-feature-data',
      'mobile-pure-domain',
      'mobile-core-sqlcipher',
      'mobile-core-local-db-port',
      'mobile-core-local-db',
      'mobile-core-sync-enqueuer',
      'mobile-core-sync-adapter',
      'mobile-core-sync-internal',
      'mobile-core-adapter',
      'mobile-core-network',
      'mobile-api-contract',
      'mobile-core-notifications',
      'mobile-core-other',
      'mobile-shared',
      'allergen-rules-entry',
    ],
  },
  // A6: pure domain calculators never import core or other features.
  {
    from: ['mobile-pure-domain'],
    allow: [
      ['mobile-pure-domain', { feature: '${from.feature}' }],
      'mobile-shared',
      'allergen-rules-entry',
    ],
  },
  // A1: features stay isolated from one another.
  {
    from: ['mobile-feature-ui'],
    allow: [
      ['mobile-feature-ui', { feature: '${from.feature}' }],
      ['mobile-feature-domain', { feature: '${from.feature}' }],
      ['mobile-pure-domain', { feature: '${from.feature}' }],
      'mobile-shared',
      'allergen-rules-entry',
    ],
  },
  {
    from: ['mobile-feature-domain'],
    allow: [
      ['mobile-feature-domain', { feature: '${from.feature}' }],
      ['mobile-pure-domain', { feature: '${from.feature}' }],
      ['mobile-feature-data', { feature: '${from.feature}' }],
      // A4: features import only the OperationEnqueuer port.
      'mobile-core-sync-enqueuer',
      'mobile-api-contract',
      'mobile-shared',
      'allergen-rules-entry',
    ],
  },
  {
    from: ['mobile-feature-data'],
    allow: [
      ['mobile-feature-data', { feature: '${from.feature}' }],
      ['mobile-feature-domain', { feature: '${from.feature}' }],
      ['mobile-pure-domain', { feature: '${from.feature}' }],
      // A3: only features/<f>/data imports LocalDatabase.
      'mobile-core-local-db-port',
      'mobile-core-sync-enqueuer',
      'mobile-core-network',
      'mobile-api-contract',
      'mobile-shared',
      'allergen-rules-entry',
    ],
  },
  {
    from: ['mobile-core-sqlcipher', 'mobile-core-local-db-port', 'mobile-core-local-db'],
    allow: ['mobile-core-local-db-port', 'mobile-core-local-db', 'mobile-shared'],
  },
  {
    from: ['mobile-core-sync-enqueuer'],
    allow: ['mobile-api-contract', 'mobile-shared', 'allergen-rules-entry'],
  },
  {
    from: ['mobile-core-sync-adapter', 'mobile-core-sync-internal'],
    allow: [
      'mobile-core-sync-enqueuer',
      'mobile-core-sync-internal',
      'mobile-core-local-db-port',
      'mobile-core-network',
      'mobile-api-contract',
      'mobile-shared',
      'allergen-rules-entry',
    ],
  },
  {
    from: ['mobile-core-network'],
    allow: ['mobile-core-network', 'mobile-api-contract', 'mobile-shared', 'allergen-rules-entry'],
  },
  {
    from: ['mobile-core-notifications'],
    allow: ['mobile-core-notifications', 'mobile-shared', 'allergen-rules-entry'],
  },
  {
    from: ['mobile-core-adapter'],
    allow: [
      ['mobile-core-other', { coreArea: '${from.coreArea}' }],
      'mobile-core-network',
      'mobile-api-contract',
      'mobile-core-notifications',
      'mobile-core-local-db-port',
      'mobile-shared',
      'allergen-rules-entry',
    ],
  },
  {
    from: ['mobile-core-other'],
    allow: [
      ['mobile-core-other', { coreArea: '${from.coreArea}' }],
      'mobile-shared',
      'allergen-rules-entry',
    ],
  },
  {
    from: ['mobile-shared'],
    allow: ['mobile-shared', 'allergen-rules-entry'],
  },
];

// Shared restricted-import specs composed across mobile flat-config blocks so later blocks
// extend rather than silently overwrite earlier restrictions (ESLint 9 flat config replaces rules).
const MOBILE_BASE_RESTRICTED_PATHS = [
  {
    name: '@panelada/allergen-rules/invariants',
    message: 'A7 / S6: apps/mobile may only import @panelada/allergen-rules/rules.',
  },
  {
    name: '@panelada/allergen-rules',
    message: 'A7: import explicitly from @panelada/allergen-rules/rules.',
  },
];

const MOBILE_BASE_RESTRICTED_PATTERNS = [
  {
    group: ['@supabase/*'],
    message: 'A05: Supabase BaaS SDK is forbidden on the mobile client.',
  },
];

const MOBILE_SQLITE_RESTRICTED_PATHS = [
  {
    name: 'expo-sqlite',
    message: 'A2: native SQLite/SQLCipher drivers may only be imported by SqlCipherDatabase.',
  },
  {
    name: '@op-engineering/op-sqlite',
    message: 'A2: native SQLite/SQLCipher drivers may only be imported by SqlCipherDatabase.',
  },
  {
    name: 'react-native-quick-sqlite',
    message: 'A2: native SQLite/SQLCipher drivers may only be imported by SqlCipherDatabase.',
  },
];

const MOBILE_PURE_DOMAIN_RESTRICTED_PATHS = [
  {
    name: 'react-native',
    message: 'A6: pure domain calculators must not import react-native.',
  },
  {
    name: 'expo',
    message: 'A6: pure domain calculators must not import expo.',
  },
];

const MOBILE_PURE_DOMAIN_RESTRICTED_PATTERNS = [
  {
    group: ['expo-*'],
    message: 'A6: pure domain calculators must not import expo-* modules.',
  },
];

function createModuleRestrictionSelectors(moduleName, message) {
  return [
    { selector: `ImportDeclaration[source.value="${moduleName}"]`, message },
    { selector: `ExportNamedDeclaration[source.value="${moduleName}"]`, message },
    { selector: `ExportAllDeclaration[source.value="${moduleName}"]`, message },
    { selector: `ImportExpression[source.value="${moduleName}"]`, message },
  ];
}

const SECURE_STORE_SELECTORS = createModuleRestrictionSelectors(
  'expo-secure-store',
  'A5: expo-secure-store may only be imported inside core/network or core/local-db.',
);

const NOTIFICATIONS_SELECTORS = createModuleRestrictionSelectors(
  'expo-notifications',
  'A5: expo-notifications may only be imported inside features/reminders/data or core/notifications.',
);

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.expo/**',
      'apps/api/src/shared/openapi.generated.ts',
      'apps/mobile/src/core/network/openapi.generated.ts',
      'docs/**',
      '.plans/**',
      '.worktrees/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mjs,js}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      boundaries,
      'import-x': importX,
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          noWarnOnMultipleProjects: true,
          project: [
            './tsconfig.base.json',
            './packages/allergen-rules/tsconfig.json',
            './apps/api/tsconfig.json',
            './apps/mobile/tsconfig.json',
          ],
        },
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          noWarnOnMultipleProjects: true,
          project: [
            './tsconfig.base.json',
            './packages/allergen-rules/tsconfig.json',
            './apps/api/tsconfig.json',
            './apps/mobile/tsconfig.json',
          ],
        },
      },
      'boundaries/elements': BOUNDARY_ELEMENTS,
      'boundaries/dependency-nodes': ['import', 'dynamic-import', 'require', 'export'],
      'boundaries/include': [
        'packages/allergen-rules/src/**/*.{ts,tsx}',
        'apps/api/src/**/*.{ts,tsx}',
        'apps/mobile/src/**/*.{ts,tsx}',
        'apps/mobile/app/**/*.{ts,tsx}',
      ],
    },
    rules: {
      // S7: disallow circular imports across the monorepo.
      'import-x/no-cycle': ['error', { maxDepth: 10 }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: [
      'packages/allergen-rules/src/**/*.{ts,tsx}',
      'apps/api/src/**/*.{ts,tsx}',
      'apps/mobile/src/**/*.{ts,tsx}',
      'apps/mobile/app/**/*.{ts,tsx}',
    ],
    rules: {
      'boundaries/no-unknown': 'error',
      'boundaries/no-unknown-files': 'error',
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: BOUNDARY_RULES,
        },
      ],
    },
  },
  {
    // S6 (ADR-014): packages/allergen-rules must not import Node built-ins.
    files: ['packages/allergen-rules/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: NODE_BUILTINS.map((name) => ({
            name,
            message:
              'S6 / ADR-014: packages/allergen-rules must stay 100% pure without Node built-ins.',
          })),
          patterns: [
            {
              group: ['node:*'],
              message:
                'S6 / ADR-014: packages/allergen-rules must stay 100% pure without Node built-ins.',
            },
          ],
        },
      ],
    },
  },
  {
    // A7 & A05: mobile may only import @panelada/allergen-rules/rules and never Supabase BaaS SDK.
    files: ['apps/mobile/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: MOBILE_BASE_RESTRICTED_PATHS,
          patterns: MOBILE_BASE_RESTRICTED_PATTERNS,
        },
      ],
    },
  },
  {
    // A2: only SqlCipherDatabase adapter may import native SQLite/SQLCipher drivers.
    files: ['apps/mobile/src/**/*.{ts,tsx}', 'apps/mobile/app/**/*.{ts,tsx}'],
    ignores: ['apps/mobile/src/core/local-db/sqlcipher*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [...MOBILE_BASE_RESTRICTED_PATHS, ...MOBILE_SQLITE_RESTRICTED_PATHS],
          patterns: MOBILE_BASE_RESTRICTED_PATTERNS,
        },
      ],
    },
  },
  {
    // A5 (disjoint set 1/3): files outside both allowlists may import neither expo-secure-store nor expo-notifications.
    files: ['apps/mobile/src/**/*.{ts,tsx}', 'apps/mobile/app/**/*.{ts,tsx}'],
    ignores: [
      'apps/mobile/src/core/network/**/*.{ts,tsx}',
      'apps/mobile/src/core/local-db/**/*.{ts,tsx}',
      'apps/mobile/src/features/reminders/data/**/*.{ts,tsx}',
      'apps/mobile/src/core/notifications/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-syntax': ['error', ...SECURE_STORE_SELECTORS, ...NOTIFICATIONS_SELECTORS],
    },
  },
  {
    // A5 (disjoint set 2/3): core/network and core/local-db may use expo-secure-store, never expo-notifications.
    files: [
      'apps/mobile/src/core/network/**/*.{ts,tsx}',
      'apps/mobile/src/core/local-db/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-syntax': ['error', ...NOTIFICATIONS_SELECTORS],
    },
  },
  {
    // A5 (disjoint set 3/3): reminders/data and core/notifications may use expo-notifications, never expo-secure-store.
    files: [
      'apps/mobile/src/features/reminders/data/**/*.{ts,tsx}',
      'apps/mobile/src/core/notifications/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-syntax': ['error', ...SECURE_STORE_SELECTORS],
    },
  },
  {
    // A6: UnlockCalculator and ReminderScheduler must stay pure TypeScript while retaining A2/A7/A05 bans.
    files: ['apps/mobile/src/features/*/domain/{unlock-calculator,reminder-scheduler}.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...MOBILE_BASE_RESTRICTED_PATHS,
            ...MOBILE_SQLITE_RESTRICTED_PATHS,
            ...MOBILE_PURE_DOMAIN_RESTRICTED_PATHS,
          ],
          patterns: [...MOBILE_BASE_RESTRICTED_PATTERNS, ...MOBILE_PURE_DOMAIN_RESTRICTED_PATTERNS],
        },
      ],
    },
  },
  {
    files: ['apps/mobile/**/*.{js,cjs}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  eslintConfigPrettier,
);
