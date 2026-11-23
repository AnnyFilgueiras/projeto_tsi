# STATE.md — Painel Vivo de Estado, Tarefas e Handoff (Panelada)

> **Instrução para Agentes de IA:** Leia [`./AGENTS.md`](./AGENTS.md) e este arquivo no início de toda sessão. Na Fase 3, atualize este painel ao concluir um **marco/etapa relevante** (`GOV-##`, `MVP-01`–`MVP-04`, mudança de ADR) ou na promoção semanal `development` → `main` (evitando conflitos de merge em micro-PRs paralelos).

---

## 1. Panorama Atual do Projeto

- **Fase Acadêmica Atual:** **Fase 3 — Implementação do MVP e Deploy em Cloud Gratuita (EM ANDAMENTO — `MVP-01` PR #47, `MVP-02` #36 PR #48, `MVP-03` #37, `MVP-04A` #39 PR #53 integrados na `development`, e `MVP-04B` #40 concluído em branch pronta para PR; próximo passo: `MVP-04C` #41)**.
- **Branch de Integração (Fase 3):** `development` (atualizada em `f79c5dc` com `GOV-04`, `MVP-01`, `MVP-02`, `MVP-03`, `MVP-04A` e retroalimentação Opção A do `ADR-014`).
- **Última Atualização:** `23/11/2026`
- **Status Geral das Fases:**
  - ✅ **Fase 1 (Engenharia de Requisitos):** Concluída (`validated-backlog--v1.0`) e sincronizada com Lote 1 (#30), Gamificação (`ADR-016`) e Lote 3 (#32).
  - ✅ **Fase 2 (Projeto Arquitetural):** Concluída integralmente (`2.1`–`2.9`, `architecture-design--v1.0`), com `ADR-001`–`ADR-016`, `openapi.yaml` v1.2.0-2.8 (0 erros Redocly CLI), coleção Bruno (33 reqs + fixture), revisão adversarial (`R1`–`R21`) e fechamento.
  - ✅ **Frente Transversal — Gamificação Metodológica:** Concluída ([`framework-gamificacao.md`](./docs/fase2/03-modelagem/framework-gamificacao.md) e [ADR-016](./docs/fase2/02-adr/adr-016-framework-conceitual-gamificacao.md)) — híbrido **6D + Octalysis**, 8 marcos declarativos (`RN03 a–h`), 0 novas tabelas (`A12`).
  - ✅ **Frente A — Governança Multi-Agente (`GOV-01` a `GOV-04`):** Concluída e integrada na `development` (PR #34).
  - 🚧 **Fase 3 (Implementação do MVP e Deploy em Cloud Gratuita):** `MVP-01` (PR #47), `MVP-02` (#36, PR #48), `MVP-03` (#37), `MVP-04A` (#39, PR #53) e **`MVP-04B` (#40)** concluídos; em andamento **`MVP-04` (#38 — Onda 1A)** com próxima sub-issue **`#41` (`MVP-04C`)**.

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
- [ ] **MVP-04 (#38 — Épico Onda 1A, Primeiro Deploy):** Implementar núcleo jogável de ponta a ponta + gamificação 6D/Octalysis e realizar o primeiro deploy em Cloud 4C (Supabase PostgreSQL TLS + Storage + Render Docker) — sub-issues: `#39` (`MVP-04A` — integrada via PR #53), **`#40` (`MVP-04B` — concluída na branch `feat/issue-40-catalog-curation-photos-seed`)**, `#41` (`MVP-04C`), `#42` (`MVP-04D`), `#43` (`MVP-04E`), `#44` (`MVP-04F`) e `#45` (`MVP-04G`).
- [ ] **MVP-05 (#46 — Épico Onda 1B, Fechamento Estágio 1):** Rotina (`US06`/`US07`/`US08`), Despensa (`US03`), Busca (`US04`), Utensílios (`US11`), Conta completa (`POST /v1/account/email`, `DELETE /v1/account`) e Curadoria assistida por IA (`US18` Kimi/Recorded) — fatiamento em sub-issues após concluir `#38`.

---

## 4. Handoff da Última Sessão

- **Data e Agente:** `22–23/11/2026` — Antigravity CLI (papel: Engenheiro Backend/Catálogo/TDD e Revisor Independente de Código — `solve-issue` + `tdd` + `code-comments` + `code-review`).
- **Branch de Trabalho:** `feat/issue-40-catalog-curation-photos-seed` (criada a partir da `development` em `f79c5dc`, commits locais prontos para push/PR em `development`).
- **O que foi feito (`MVP-04B` / `#40`):**
  1. Implementado `modules/catalog` (`catalog_*` 9 tabelas `S8`, fachadas `CatalogReadPort` restrita a `approved` e `CatalogWritePort` `S4`/`T01` com `tx: Tx` obrigatório, porta `PhotoStorage` `P02f` com `LocalDiskPhotoStorage`, `SupabasePhotoStorage` via REST HTTP e `InMemoryPhotoStorage`, além das rotas `GET /v1/photos/{hash}` com `Cache-Control` imutável e `GET /v1/recipes/{dishId}`).
  2. Implementado `modules/importer` (tabelas `importer_proposals` e `importer_idempotency_keys` com `pg_advisory_xact_lock`, `PublicationGate` cumulativo em TDD estrito via `@panelada/allergen-rules/invariants` + checagem anti-ciclo/`MAX_DEPTH = 10` incluindo `descendantDepth`, `PhotoProcessor` com `@fastify/multipart` + `sharp` normalizando WebP/JPEG/PNG até `5 MiB` para `image/webp` ≤ `1024 × 1024` px sem EXIF, e todas as rotas manuais `/v1/curation/*` protegidas por `curator`).
  3. Estendido `setErrorHandler` global em `apps/api/src/app.ts` para mapear erros 4xx nativos do Fastify (`415`, `413`, `406`, `400`, etc.) para `application/problem+json` estático preservando redação `A13`, gerada migration `0002_catalog_importer_badges.sql` (incluindo `progress_badge_definitions`) e estendido o seed idempotente (`db:reset`) com 10 culinárias nos 5 continentes, 20 pratos verificados (cadeia de evolução de 3 níveis + pratos `confirmedAllergenFree = true`), 7 substituições seguras/inseguras, 11 badges (`RN03 a–h`) e fotos WebP.
  4. Executado `code-review` independente em subagente limpo sobre todas as alterações, corrigindo 8 achados confirmados no escopo (omissão de alérgenos canônicos em substituições `A06`/`RN22`, `tx?: Tx` em `CatalogReadPort` contra *pool starvation*, `pg_advisory_xact_lock` na idempotência concorrente, `updatePublishedDishPhoto` preservando `allergens_updated_at`, bloqueio de `confirmedAllergenFree = true` com alérgenos presentes, `descendantDepth` em `RN18`, chaves TS em inglês no seed `ADR-015` e preservação de `{ type, payload }` no hash do `sync`), com 100% das verificações verdes (`format:check`, `lint`, `typecheck`, `allergen-rules` 56 + `api` 41 unit + `mobile` 35 + integração `panelada_test` 3/3 suites / 5/5 testes + `db:reset` 2× + `contracts`) e 6/6 critérios marcados na `#40`.
- **Decisões tomadas:**
  - **Padronização de fotos do catálogo (`ADR-012`, documentada em `docs/dev/ARCHITECTURE.md`):** entrada `image/webp`, `image/jpeg` e `image/png` (validados por *magic bytes*, limite `5 MiB`), saída normalizada `image/webp` q82, EXIF rotacionado/removido, teto `1024 × 1024` px (`fit: 'inside'`, `withoutEnlargement: true`, proporção recomendada `4:3` ou `16:9` na curadoria) e hash SHA-256.
  - **Precedência do contrato OpenAPI (`ADR-015`):** mantidos papel `'user' | 'curator'` e continente `'america'` (singular).
  - **Idempotência da curadoria isolada (`S2`, `P05`):** `importer_idempotency_keys` próprio no módulo `importer` + helper puro `src/shared/canonical-hash.ts` mantendo formato `{ type, payload }` retrocompatível com `sync_processed_operations`.
- **Arquivos criados/alterados:** `apps/api/src/{app,shared/{canonical-hash,problem},cross-cutting/sync/internal/canonical-hash,db/{seed,seed-catalog-data},modules/catalog/{public/*,internal/*},modules/importer/{public/*,internal/*},modules/progress/internal/schema}.ts`, `apps/api/drizzle/0002_catalog_importer_badges.sql` (+ `meta/`), `apps/api/test/{unit/{publication-gate,photo-storage,error-handler},integration/catalog-curation.integration}.test.ts`, `apps/api/package.json`, `pnpm-lock.yaml`, `.env.example`, `.gitignore`, `docker-compose.yml`, `docs/dev/ARCHITECTURE.md`, `docs/fase2/04-contratos/bruno/panelada-curadoria/fixtures/dish-example.jpg`, `STATE.md` e `docs/fase3/diario_de_bordo-fase3.md`.
- **Próximo passo recomendado:**
  1. Enviar `feat/issue-40-catalog-curation-photos-seed` ao remoto e integrar PR → `development` (com `Closes #40`, conferindo build Docker do `sharp` em `node:22-alpine`).
  2. Iniciar **`MVP-04C` (#41)** via `solve-issue` (sugestões filtradas por alérgenos/preferências, `RatingApplier`, `UnlockRules` pura com vetores JSON compartilhados, coleção e badges).
