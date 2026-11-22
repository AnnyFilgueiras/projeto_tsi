# STATE.md — Painel Vivo de Estado, Tarefas e Handoff (Panelada)

> **Instrução para Agentes de IA:** Leia [`./AGENTS.md`](./AGENTS.md) e este arquivo no início de toda sessão. Na Fase 3, atualize este painel ao concluir um **marco/etapa relevante** (`GOV-##`, `MVP-01`–`MVP-04`, mudança de ADR) ou na promoção semanal `development` → `main` (evitando conflitos de merge em micro-PRs paralelos).

---

## 1. Panorama Atual do Projeto

- **Fase Acadêmica Atual:** **Fase 3 — Implementação do MVP e Deploy em Cloud Gratuita (EM ANDAMENTO — `MVP-01` integrado via PR #47, `MVP-02` #36 integrado via PR #48, `MVP-03` #37 integrado na `development` e `MVP-04A` #39 concluído em branch pronta para PR; próximo passo: `MVP-04B` #40)**.
- **Branch de Integração (Fase 3):** `development` (atualizada em `e3b87ac` com `GOV-04`, `MVP-01`, `MVP-02`, `MVP-03` e retroalimentação Opção A do `ADR-014`).
- **Última Atualização:** `21/11/2026`
- **Status Geral das Fases:**
  - ✅ **Fase 1 (Engenharia de Requisitos):** Concluída (`validated-backlog--v1.0`) e sincronizada com Lote 1 (#30), Gamificação (`ADR-016`) e Lote 3 (#32).
  - ✅ **Fase 2 (Projeto Arquitetural):** Concluída integralmente (`2.1`–`2.9`, `architecture-design--v1.0`), com `ADR-001`–`ADR-016`, `openapi.yaml` v1.2.0-2.8 (0 erros Redocly CLI), coleção Bruno (33 reqs + fixture), revisão adversarial (`R1`–`R21`) e fechamento.
  - ✅ **Frente Transversal — Gamificação Metodológica:** Concluída ([`framework-gamificacao.md`](./docs/fase2/03-modelagem/framework-gamificacao.md) e [ADR-016](./docs/fase2/02-adr/adr-016-framework-conceitual-gamificacao.md)) — híbrido **6D + Octalysis**, 8 marcos declarativos (`RN03 a–h`), 0 novas tabelas (`A12`).
  - ✅ **Frente A — Governança Multi-Agente (`GOV-01` a `GOV-04`):** Concluída e integrada na `development` (PR #34).
  - 🚧 **Fase 3 (Implementação do MVP e Deploy em Cloud Gratuita):** `MVP-01` (PR #47), `MVP-02` (#36, PR #48), `MVP-03` (#37) e **`MVP-04A` (#39)** concluídos; em andamento **`MVP-04` (#38 — Onda 1A)** com próxima sub-issue **`#40` (`MVP-04B`)**.

---

## 2. Diretrizes Estratégicas Vigentes (Governança, Arquitetura, MVP e Deploy)

1. **Topologia Monorepo + Camada Viva `docs/dev/` (`Opção 1B` + `GOV-04`):**
   - Único repositório contendo `docs/` (`docs/dev/` vivo de engenharia + `docs/fase1/` e `docs/fase2/` como referência histórica) e, na Fase 3, `packages/allergen-rules/`, `apps/api/` e `apps/mobile/`.
   - **Multi-agente (Antigravity, Codex, Kimi, Claude Code — Linux/Windows):** `AGENTS.md` enxuto como fonte única, skills versionadas em `.agents/skills/`, espelhamento local para Claude Code via `node scripts/setup-agent-skills.mjs` (symlink/junction), planos visíveis em `.plans/` (ignorado no git) e `.gitattributes` forçando `LF`.
   - **Fluxo de branches:** mão única `feat|fix|docs|chore/*` → `development` (integração com CI) → `main` (marcos/deploys estáveis). Mudanças de regra/doc e features entram em PRs separados na `development`.
   - **Política de IA vs. Disciplina:** zero menção a IA em código, comentários, commits e PRs (`Co-Authored-By` proibido); registro de IA obrigatório apenas neste `STATE.md` e no `diario_de_bordo` (cadência por marco/semana).
2. **Ponto de Extensão Isolado e Modelagem 6D + Octalysis de Gamificação (`Opção 2A` — [ADR-016](./docs/fase2/02-adr/adr-016-framework-conceitual-gamificacao.md)):**
   - Regras de progresso/recompensa isoladas em `UnlockCalculator` (App) e `UnlockRules` (API, módulo `progress`), orientadas aos 8 marcos (`RN03 a–h`) e testadas por vetores JSON comuns (`A12`).
3. **Offline-First em 2 Estágios Reversíveis (`Opção 3C` — [ADR-008](./docs/fase2/02-adr/adr-008-estrategia-offline-e-sincronizacao.md)):**
   - **Estágio 1:** leitura offline via `SqlCipherDatabase` (`P02a`) + mutações online via `DirectOnlineOperationEnqueuer` atrás da porta `OperationEnqueuer` (`P04`).
   - **Estágio 2:** troca na raiz de composição (`src/app/composition/`) para `OutboxOperationEnqueuer` + `Synchronizer` + `ProcessedOperation` (`P05`) sem alterar telas nem casos de uso.
4. **Containers Locais + Deploy Real em Cloud Gratuita (`Opção 4C` — [ADR-004](./docs/fase2/02-adr/adr-004-demonstracao-docker-e-alvo.md), [ADR-012](./docs/fase2/02-adr/adr-012-fotos.md)):**
   - **Docker Compose local (`MVP-02`):** PostgreSQL (`TZ=UTC`, bancos `panelada_dev` e `panelada_test`) + API Fastify (`0.0.0.0:3000`) + volume de fotos (`LocalDiskPhotoStorage`), com trava `_test` na suíte de integração e seed vivo idempotente (`db:reset`). Apenas Emulador Android/Expo rodam no host.
   - **Nuvem Gratuita:** Supabase exclusivamente como PostgreSQL gerenciado (TLS/SSL) + Object Storage (`SupabasePhotoStorage`, sem SDK BaaS no cliente) + API Fastify em PaaS gratuita de container, preservando `FieldCipher` (`AES-256-GCM`) na API ([ADR-006](./docs/fase2/02-adr/adr-006-criptografia-restricao-alimentar.md)).

### Riscos Residuais de Governança Aceitos (`GOV-04` — 21/11/2026)
1. Adesão probabilística dos 4 agentes às instruções em Markdown (mitigado por revisão de diff/PR e cortes em `.plans/`).
2. SQL cross-módulo não detectado por `eslint-plugin-boundaries` (`S8` — mitigado por prefixos `R19` e checklist de review).
3. Deriva documental lenta entre `docs/dev/`, `openapi.yaml` e código (mitigado por atualização no mesmo PR + coleção Bruno).
4. Peculiaridades locais de Windows/WSL2 + Docker + Emulador Android (mitigado por troubleshooting vivo em `docs/dev/`).
5. `Closes #N` diferido enquanto `main` for a branch padrão (mitigado por promoções frequentes `development` → `main`; reversível em 5 min se gerar atrito).
6. Higiene local de `.plans/` e handoff entre membros via comentário na Issue.
7. Tensão entre rigor das skills e prazo de 1,5 mês (mitigado por `--no-cut` em tarefas triviais, proporcionalidade de camadas e Diário por marco).

---

## 3. Quadro de Tarefas e Pendências (Backlog Ativo)

### Frente A — Governança e Automação de Fluxo
- [x] **GOV-01:** Reestruturar `/docs/fase2/` em 5 pastas lógicas (`01-fundamentos/` a `05-fechamento/`).
- [x] **GOV-02:** Criar `AGENTS.md`, `CLAUDE.md`, `STATE.md`, `docs/playbooks/01..03` e atualizar `README.md`.
- [x] **GOV-03:** Registrar detalhamentos arquiteturais de MVP/Deploy/Gamificação (`2A`, `3C`, `4C`) nos ADRs e modelagem.
- [x] **GOV-04:** Reestruturar governança para a Fase 3 — `docs/dev/` (`GLOSSARY`, `ARCHITECTURE`, `PRIVACY`), skills multi-agente em `.agents/skills/` (`grilling`, `github-issue-craft` + `audit_issues.py`, `solve-issue`, `code-review` adaptada da Sentry, `tdd`, `codebase-design`, `code-comments`), `scripts/setup-agent-skills.mjs` (Linux/Windows), `.github/ISSUE_TEMPLATE/`, `.gitattributes`, `.gitignore` (`.plans/`), branch `development` e limpeza de `guia-agentes/` + `docs/superpowers/`.

### Frente B — Fechamento e Higiene da Fase 2 (Concluída — `architecture-design--v1.0`)
- [x] **F2-01** (Lote 3 / #32) · [x] **F2-02** (Higiene Lote 2 + RDC 727/2022) · [x] **F2-03** (OpenAPI 0 erros + Bruno 33 reqs) · [x] **F2-04** (Revisão 2.8, `R1`–`R21`) · [x] **F2-05** (Fechamento 2.9).

### Frente C — Modelagem do Framework de Gamificação (Concluída)
- [x] **GAM-01** (`framework-gamificacao.md` + `ADR-016`) · [x] **GAM-02** (Retroalimentação Fase 1 + 8 marcos declarativos).

### Frente D — Implementação do MVP e Primeiro Deploy (Fase 3 — Milestone `Fase 3 — MVP (Estágio 1)`)
- [x] **MVP-01:** Recorte funcional prioritário de histórias/telas para o primeiro deploy (Estágio 1 em Onda 1A + Onda 1B), baseline técnico (`Drizzle`, `Zod`, `pino` redact, `node:crypto`, `openapi-typescript`, `Expo Router` + `StyleSheet`, `Vitest`/`Jest`, `Render` + `Supabase`) e backlog executável publicado no GitHub (`#36`–`#46`) via `grilling` + `github-issue-craft` (integrado via PR #47).
- [x] **MVP-02 (#36):** Configurar o esqueleto do monorepo (`pnpm` workspaces, TypeScript, Drizzle, Zod, `openapi-typescript`, `eslint-plugin-boundaries` com prova de falha intencional `S1`–`S8`/`A1`–`A8`, `docker-compose.yml` com Postgres dev/test + API em `0.0.0.0:3000`, trava `_test`, seed base `db:reset`, CI + `docs/dev/DATABASE.md` e `docs/dev/TESTING.md`) — integrado via PR #48.
- [x] **MVP-03 (#37):** Implementar `packages/allergen-rules` com TDD estrito e 100% dos vetores JSON (`A06`, `ADR-014` — Opção A *fail-closed* estrito, `PACKAGE_VERSION = 1.0.0`, 56 testes no pacote + 9 na API + 35 no Mobile/Jest).
- [ ] **MVP-04 (#38 — Épico Onda 1A, Primeiro Deploy):** Implementar núcleo jogável de ponta a ponta + gamificação 6D/Octalysis e realizar o primeiro deploy em Cloud 4C (Supabase PostgreSQL TLS + Storage + Render Docker) — sub-issues: **`#39` (`MVP-04A` — concluída na branch `feat/issue-39-identity-field-cipher-profile`)**, `#40` (`MVP-04B`), `#41` (`MVP-04C`), `#42` (`MVP-04D`), `#43` (`MVP-04E`), `#44` (`MVP-04F`) e `#45` (`MVP-04G`).
- [ ] **MVP-05 (#46 — Épico Onda 1B, Fechamento Estágio 1):** Rotina (`US06`/`US07`/`US08`), Despensa (`US03`), Busca (`US04`), Utensílios (`US11`), Conta completa (`POST /v1/account/email`, `DELETE /v1/account`) e Curadoria assistida por IA (`US18` Kimi/Recorded) — fatiamento em sub-issues após concluir `#38`.

---

## 4. Handoff da Última Sessão

- **Data e Agente:** `21/11/2026` — Antigravity CLI (papel: Engenheiro Backend/Segurança/TDD e Revisor Independente de Código — `solve-issue` + `tdd` + `code-comments` + `code-review`).
- **Branch de Trabalho:** `feat/issue-39-identity-field-cipher-profile` (criada a partir da `development` em `e3b87ac`, enviada ao remoto para PR em `development`).
- **O que foi feito (`MVP-04A` / `#39`):**
  1. Implementado `support/field-encryption` (`AesGcmFieldCipher` AES-256-GCM com IV aleatório 12 B, tag 16 B, `accountId` como AAD, `keyVersion` e validação Base64 estrita + porta `KeyProvider` `P02c` com `EnvOrFileKeyProvider` e `InMemoryKeyProvider`) em TDD estrito (`A05`, `ADR-006`).
  2. Implementado `cross-cutting/identity` (`POST /v1/accounts/anonymous` atômico com `ProfileLifecycle.createProfile` em `tx: Tx`, `POST /v1/sessions/sign-in` com Argon2id OWASP 19 MiB/t=2/p=1 via `@noble/hashes` em formato PHC, `POST /v1/sessions/refresh` com janela concorrente de 60 s e revogação de família, `POST /v1/sessions/sign-out`, JWT HS256 45 min `user | curator` e rate limiting limitado em memória).
  3. Implementado `modules/profile` (`public/{index,profile-lifecycle,profile-query,restrictions-for-filter}.ts`, `PUT /v1/profile/preferences`, `ProfileApplier` para `restriction.register` cifrado com `consentAt` obrigatório e `restriction.revoke` com `DELETE` físico idempotente — `RN09`, `S1`/`S3`/`S5`/`S8`) e `cross-cutting/sync` (`POST /v1/sync/operations`, `OperationApplierRegistry` `P01`, `SyncService` + `sync_processed_operations` `P05` na mesma `tx: Tx`).
  4. Gerada migration Drizzle `0001_identity_profile_sync.sql` (6 tabelas com prefixos por dono `S8`), estendido `apps/api/src/db/seed.ts` (19 `profile_restriction_types` + conta curadora idempotente), reforçada redação `A13` em `logger.ts` + `setErrorHandler` RFC 9457, atualizados `.env.example`, `docker-compose.yml` e `docs/dev/ARCHITECTURE.md` (fatia de referência API).
  5. Executado `code-review` independente em subagente limpo sobre todas as alterações, corrigindo 6 achados confirmados no escopo (corrida na janela de 60 s do refresh, corrida `PG 23505` no sync, isolamento de `ProblemError` por item no lote, Base64 estrito, limite de buckets/IP no rate limiter e fail-fast para `JWT_SECRET` curto), com 100% das verificações verdes (`format:check`, `lint`, `typecheck`, `allergen-rules` 56 + `api` 24 + `mobile` 35 + integração `panelada_test` 3/3 + `db:reset`/`db:seed` + `contracts`) e 6/6 critérios marcados na `#39`.
- **Decisões tomadas:**
  - **Papel no JWT (`user | curator`)** e **lote sync (`HTTP 200` com `results[i].error = { type: 'key-reused', status: 422 }`)**: alinhados estritamente ao contrato aprovado (`openapi.yaml` e `ADR-015`).
  - **Argon2id via `@noble/hashes` (`argon2idAsync`, formato PHC em `src/shared/password-hash.ts`):** mantém compatibilidade com `node:22-alpine` sem toolchain C++, permitindo migração futura transparente para `node:crypto.argon2` nativo ao evoluir para `node:24-alpine`.
  - **Guarda de auth neutra em `src/shared/auth.ts`:** injetada via `src/app.ts` em `profile` e `sync`, preservando `S2` sem alterar `eslint.config.mjs`.
- **Arquivos criados/alterados:** `apps/api/src/{app,main,db/seed,shared/{auth,operation-applier,password-hash,problem},support/{field-encryption/*,technical-log/logger},modules/profile/{public/*,internal/*},cross-cutting/{identity/*,sync/*}}.ts`, `apps/api/drizzle/0001_identity_profile_sync.sql` (+ `meta/`), `apps/api/test/{unit/{field-cipher,logger,profile-applier,session-service,sync-service},integration/identity-profile-sync.integration}.test.ts`, `apps/api/package.json`, `pnpm-lock.yaml`, `.env.example`, `docker-compose.yml`, `docs/dev/ARCHITECTURE.md`, `STATE.md` e `docs/fase3/diario_de_bordo-fase3.md`.
- **Próximo passo recomendado:**
  1. Abrir/integrar PR de `feat/issue-39-identity-field-cipher-profile` → `development` (com `Closes #39`).
  2. Iniciar **`MVP-04B` (#40)** via `solve-issue` (catálogo + `PublicationGate` + rotas de curadoria manual + seed dos ~20 pratos verificados + `PhotoStorage`).
