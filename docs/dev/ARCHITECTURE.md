# Arquitetura de Implementação — Panelada

> **Leia quando:** criar um módulo ou feature nova, adicionar uma rota/repositório, ligar adaptadores na raiz de composição ou revisar fronteiras modulares (`S1`–`S8`, `A1`–`A8`).
> **Referências canônicas:** [`padroes-de-projeto.md`](../fase2/03-modelagem/padroes-de-projeto.md), [`c4-componentes.md`](../fase2/03-modelagem/c4-componentes.md), [`diagrama-classes.md`](../fase2/03-modelagem/diagrama-classes.md) e [`openapi.yaml`](../fase2/04-contratos/openapi.yaml).

---

## 1. Topologia do Monorepo

```text
projeto_tsi/
├── packages/allergen-rules/      # TS 100% puro (ADR-014): entrypoints `rules` e `invariants` + vetores JSON
├── apps/api/                     # Fastify + TypeScript — Monólito Modular (ADR-002)
├── apps/mobile/                  # React Native + Expo dev build — Feature-First (ADR-003)
├── docs/dev/                     # Documentação operacional viva (este diretório)
├── docs/fase1/ & docs/fase2/     # Especificação e referência acadêmica (somente sob demanda)
└── docker-compose.yml            # Paridade local (MVP-02): Postgres (dev+test) + API + volume fotos
```

---

## 2. Backend (`apps/api`) — Monólito Modular

A organização na raiz é **vertical por domínio**, nunca horizontal por camada técnica:

```text
apps/api/src/
├── modules/
│   ├── catalog/                  # Catálogo aprovado e receitas
│   ├── profile/                  # Perfil, despensa e restrições cifradas
│   ├── routine/                  # Plano semanal/quinzenal e lista de compras
│   ├── progress/                 # Avaliações, coleção, evoluções, badges (UnlockRules)
│   └── importer/                 # Curadoria manual e assistida por IA (Kimi/Recorded)
├── cross-cutting/
│   ├── identity/                 # Conta anônima, e-mail opcional, JWT/Refresh, exclusão
│   ├── sync/                     # Idempotent Receiver (P05) + OperationApplier (P01)
│   └── suggestion-search/        # Sugestões e busca filtrada por alérgenos
├── support/
│   ├── field-encryption/         # FieldCipher (AES-256-GCM) + KeyProvider (P02c)
│   └── technical-log/            # Log estruturado sem dados sensíveis (A13)
├── shared/                       # Tipo opaco `Tx` (T01) e contrato `OperationApplier` (P01)
├── app.ts                        # Raiz de composição modularizada
└── main.ts                       # Bootstrap HTTP (escuta em 0.0.0.0 para Docker/emulador)
```

### Anatomia interna de cada módulo (`public/` + `internal/`)

```text
modules/<modulo>/
├── public/                       # Uma interface/facade por arquivo (P06) — única porta de entrada externa
└── internal/
    ├── routes.ts                 # Plugin Fastify: declara rota, auth, valida payload (schema), delega
    ├── service.ts                # Regras de domínio, permissões e fronteira transacional (`tx: Tx`)
    ├── repository.ts             # Único lugar que escreve SQL (apenas tabelas `<modulo>_*`)
    └── schema.ts                 # Definições de tabelas privadas e schemas de validação
```

**Regras de proporcionalidade e composição:**
- **Sem camadas vazias (*shallow modules*):** em leituras triviais sem regra de domínio nem transação (ex.: listar culinárias estáticas), `routes.ts` pode chamar `repository.ts` diretamente sem criar um `service.ts` pass-through.
- **Raiz de composição modularizada:** cada módulo exporta um helper `create<Module>Module(deps)` para que `src/app.ts` apenas conecte os módulos (~40 linhas estáveis, reduzindo conflitos de merge).
- **Transações cross-módulo (`T01`):** métodos em `public/` que escrevem exigem `tx: Tx` como parâmetro **obrigatório** (sem fallback para o pool global), impedindo escritas fora da transação em tempo de compilação.

### Regras de fronteira do servidor (`eslint-plugin-boundaries` — `S1`–`S8`)
- `S1`: Ninguém importa `internal/` de outro módulo; apenas `public/`.
- `S2`: `catalog`, `profile` e `routine` não importam outros módulos de domínio; `progress` e `importer` importam apenas `catalog/public`; módulos de domínio nunca importam `cross-cutting/`.
- `S3`: Somente `cross-cutting/suggestion-search` importa `profile/public/restrictions-for-filter` (`A05`).
- `S4`: Somente `modules/importer` importa `catalog/public/catalog-write` (`RN21`).
- `S5`: Somente `modules/profile` importa `support/field-encryption` (`ADR-006`).
- `S6`: `packages/allergen-rules` é 100% puro; `invariants` só é importado no servidor.
- `S7`: Zero ciclos de importação (`import/no-cycle`).
- `S8`: Esquemas de tabela ficam em `internal/` de cada módulo, com prefixo `<modulo>_*` (`R19`). **Limitação conhecida:** o lint não analisa strings SQL; qualquer `JOIN` ou consulta em tabela de outro módulo é proibido e verificado na revisão de PR.

---

## 3. Mobile (`apps/mobile`) — Feature-First

```text
apps/mobile/src/
├── features/                     # suggestions, pantry, recipe, routine, profile, progress, reminders
│   └── <feature>/
│       ├── ui/                   # Telas e componentes React Native
│       ├── domain/               # Casos de uso e funções puras (ex.: UnlockCalculator, ReminderScheduler)
│       └── data/                 # Repositórios da feature (único ponto que importa LocalDatabase)
├── core/                         # local-db (SqlCipher), network, sync, photos
├── shared/                       # Componentes UI genéricos e tipos puros
└── app/composition/              # Raiz de composição única (regra A8 — sem Singletons)
```

### Regras de fronteira do app (`A1`–`A8`)
- `A1`: Uma feature nunca importa outra feature.
- `A2` / `A3`: Só `SqlCipherDatabase` importa o driver nativo; só `features/<f>/data/` importa a porta `LocalDatabase`.
- `A4`: Features importam apenas `OperationEnqueuer` (nunca `PendingOperations` nem `Synchronizer`).
- `A5`: Só `core/network` e `core/local-db` importam `expo-secure-store`; só o adaptador de lembretes importa `expo-notifications`.
- `A6`: `UnlockCalculator` e `ReminderScheduler` são 100% puros (zero imports de React Native ou `core/`).
- `A7`: O app importa apenas o entrypoint `rules` de `packages/allergen-rules` (nunca `invariants`).
- `A8`: `src/app/composition/` é o único ponto que instancia adaptadores concretos e os injeta nas features (sem construtor com `?? new ConcreteAdapter()` dentro de features).

---

## 4. Portas Plugáveis e Ambiente Containerizado

| Porta | Adaptador Local / Teste | Adaptador Produção (Cloud 4C) |
|---|---|---|
| `PhotoStorage` (`P02f`) | `LocalDiskPhotoStorage` (volume Docker) / fake | `SupabasePhotoStorage` (Object Storage, sem SDK BaaS no cliente) |
| `AiProvider` (`P02b`) | `RecordedProvider` (zero custo em dev/testes) | `KimiProvider` (teto R$ 20, aprovação humana obrigatória) |
| `KeyProvider` (`P02c`) | `FileKey` (dev) / fake | `SecretManagerKey` (variável/segredo fora do banco) |
| `OperationEnqueuer` (`P04`) | `DirectOnlineOperationEnqueuer` (**Estágio 1**) | `OutboxOperationEnqueuer` + `Synchronizer` (**Estágio 2**) |

### Estratégia de Containers (`docker-compose.yml`)
- **No Docker (`docker-compose.yml`):** PostgreSQL (`postgres:16-alpine`, `TZ=UTC`, com bancos separados `panelada_dev` e `panelada_test` inicializado em `infra/postgres/init/01-create-test-db.sql`) + API Fastify escutando em `0.0.0.0:3000` (`GET /v1/health`) + volume `panelada_photos`. Ninguém instala Postgres no host. Detalhes operacionais em [`DATABASE.md`](./DATABASE.md).
- **No host:** apenas Emulador Android + Expo/React Native (`apps/mobile`), que acessa a API no Docker via `10.0.2.2:3000` (Android emulator) ou `localhost:3000`.
- **Fatia vertical de referência (API — `MVP-04A`):** leia `apps/api/src/modules/profile/` (`public/{index,profile-lifecycle,profile-query,restrictions-for-filter}.ts` + `internal/{schema,repository,service,applier,routes}.ts`) e a composição em `apps/api/src/app.ts` antes de criar o próximo módulo. No Mobile, a fatia de referência será registrada em `MVP-04E`.
