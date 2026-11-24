# STATE.md — Painel Vivo de Estado, Tarefas e Handoff (Panelada)

> **Instrução para Agentes de IA:** Leia [`./AGENTS.md`](./AGENTS.md) e este arquivo no início de toda sessão. Na Fase 3, atualize este painel ao concluir um **marco/etapa relevante** (`GOV-##`, `MVP-01`–`MVP-04`, mudança de ADR) ou na promoção semanal `development` → `main` (evitando conflitos de merge em micro-PRs paralelos).

---

## 1. Panorama Atual do Projeto

- **Fase Acadêmica Atual:** **Fase 3 — Implementação do MVP e Deploy em Cloud Gratuita (EM ANDAMENTO — `MVP-01` PR #47, `MVP-02` #36 PR #48, `MVP-03` #37 PR #51, `MVP-04A` #39 PR #53, `MVP-04B` #40 PR #55 e `MVP-04C` #41 PR #59 integrados na `development`; backlog de UX/protótipo da Onda 1A `UX-01` `#60`–`#68` e refinamento pós-MVP `UX-02` `#69` publicados; próximos passos: `MVP-04D` #42 e/ou `UX-01` #60–#68)**.
- **Branch de Integração (Fase 3):** `development` (atualizada em `22c774b` com `GOV-04`, `MVP-01`, `MVP-02`, `MVP-03`, `MVP-04A`, `MVP-04B`, `MVP-04C` e retroalimentação Opção A do `ADR-014`).
- **Última Atualização:** `23/11/2026`
- **Status Geral das Fases:**
  - ✅ **Fase 1 (Engenharia de Requisitos):** Concluída (`validated-backlog--v1.0`) e sincronizada com Lote 1 (#30), Gamificação (`ADR-016`) e Lote 3 (#32).
  - ✅ **Fase 2 (Projeto Arquitetural):** Concluída integralmente (`2.1`–`2.9`, `architecture-design--v1.0`), com `ADR-001`–`ADR-016`, `openapi.yaml` v1.2.0-2.8 (0 erros Redocly CLI), coleção Bruno (33 reqs + fixture), revisão adversarial (`R1`–`R21`) e fechamento.
  - ✅ **Frente Transversal — Gamificação Metodológica:** Concluída ([`framework-gamificacao.md`](./docs/fase2/03-modelagem/framework-gamificacao.md) e [ADR-016](./docs/fase2/02-adr/adr-016-framework-conceitual-gamificacao.md)) — híbrido **6D + Octalysis**, 8 marcos declarativos (`RN03 a–h`), 0 novas tabelas (`A12`).
  - ✅ **Frente A — Governança Multi-Agente (`GOV-01` a `GOV-04`):** Concluída e integrada na `development` (PR #34).
  - 🚧 **Fase 3 (Implementação do MVP e Deploy em Cloud Gratuita):** `MVP-01` (PR #47), `MVP-02` (#36, PR #48), `MVP-03` (#37, PR #51), `MVP-04A` (#39, PR #53), `MVP-04B` (#40, PR #55) e `MVP-04C` (#41, PR #59) integrados na `development`; em andamento **`MVP-04` (#38 — Onda 1A)** com frente de UX/protótipo **`UX-01` (#60–#68)** bloqueando `#43` e `#44` (sem bloquear `#42`).

---

## 2. Diretrizes Estratégicas Vigentes (Governança, Arquitetura, MVP e Deploy)

1. **Topologia Monorepo + Camada Viva `docs/dev/` (`Opção 1B` + `GOV-04`):**
   - Único repositório contendo `docs/` (`docs/dev/` vivo de engenharia + `docs/fase1/` e `docs/fase2/` como referência histórica) e, na Fase 3, `packages/allergen-rules/`, `apps/api/` e `apps/mobile/`.
   - **Multi-agente (Antigravity, Codex, Kimi, Claude Code — Linux/Windows):** `AGENTS.md` enxuto como fonte única, skills versionadas em `.agents/skills/` (incluindo `using-git-worktree` e `solve-issue --use-worktree` para trabalho paralelo em múltiplas issues), espelhamento local para Claude Code via `node scripts/setup-agent-skills.mjs` (symlink/junction), planos visíveis em `.plans/` e worktrees isolados em `.worktrees/` (ambos ignorados no git, ESLint, Prettier e Docker), e `.gitattributes` forçando `LF`.
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
- [x] **GOV-04:** Reestruturar governança para a Fase 3 — `docs/dev/` (`GLOSSARY`, `ARCHITECTURE`, `PRIVACY`), skills multi-agente em `.agents/skills/` (`grilling`, `github-issue-craft` + `audit_issues.py`, `solve-issue` com flag `--use-worktree`, `using-git-worktree`, `code-review` adaptada da Sentry, `tdd`, `codebase-design`, `code-comments`), `scripts/setup-agent-skills.mjs` (Linux/Windows), `.github/ISSUE_TEMPLATE/`, `.gitattributes`, `.gitignore` (`.plans/`, `.worktrees/`), branch `development` e limpeza de `guia-agentes/` + `docs/superpowers/`.

### Frente B — Fechamento e Higiene da Fase 2 (Concluída — `architecture-design--v1.0`)
- [x] **F2-01** (Lote 3 / #32) · [x] **F2-02** (Higiene Lote 2 + RDC 727/2022) · [x] **F2-03** (OpenAPI 0 erros + Bruno 33 reqs) · [x] **F2-04** (Revisão 2.8, `R1`–`R21`) · [x] **F2-05** (Fechamento 2.9).

### Frente C — Modelagem do Framework de Gamificação (Concluída)
- [x] **GAM-01** (`framework-gamificacao.md` + `ADR-016`) · [x] **GAM-02** (Retroalimentação Fase 1 + 8 marcos declarativos).

### Frente D — Implementação do MVP e Primeiro Deploy (Fase 3 — Milestone `Fase 3 — MVP (Estágio 1)`)
- [x] **MVP-01:** Recorte funcional prioritário de histórias/telas para o primeiro deploy (Estágio 1 em Onda 1A + Onda 1B), baseline técnico (`Drizzle`, `Zod`, `pino` redact, `node:crypto`, `openapi-typescript`, `Expo Router` + `StyleSheet`, `Vitest`/`Jest`, `Render` + `Supabase`) e backlog executável publicado no GitHub (`#36`–`#46`) via `grilling` + `github-issue-craft` (integrado via PR #47).
- [x] **MVP-02 (#36):** Configurar o esqueleto do monorepo (`pnpm` workspaces, TypeScript, Drizzle, Zod, `openapi-typescript`, `eslint-plugin-boundaries` com prova de falha intencional `S1`–`S8`/`A1`–`A8`, `docker-compose.yml` com Postgres dev/test + API em `0.0.0.0:3000`, trava `_test`, seed base `db:reset`, CI + `docs/dev/DATABASE.md` e `docs/dev/TESTING.md`) — integrado via PR #48.
- [x] **MVP-03 (#37):** Implementar `packages/allergen-rules` com TDD estrito e 100% dos vetores JSON (`A06`, `ADR-014` — Opção A *fail-closed* estrito, `PACKAGE_VERSION = 1.0.0`, 56 testes no pacote + 9 na API + 35 no Mobile/Jest).
- [ ] **UX-01 (#60 — UX e Protótipo Inicial da Onda 1A):** Definir decisões transversais (tokens semânticos, navegação, tom *White Hat*, padrão visual de alérgenos `A06`, estados/offline Estágio 1, acessibilidade na cozinha) e protótipo HTML/CSS navegável (importável no Figma) em 8 sub-issues nativas por tela: `#61` (`UX-01A` Onboarding), `#62` (`UX-01B` Descobrir), `#63` (`UX-01C` Cozinha), `#64` (`UX-01D` Receita Offline), `#65` (`UX-01E` Avaliação), `#66` (`UX-01F` Celebração), `#67` (`UX-01G` Coleção) e `#68` (`UX-01H` Perfil). **Não bloqueia `#42`; bloqueia `#43` e `#44`.**
- [ ] **MVP-04 (#38 — Épico Onda 1A, Primeiro Deploy):** Implementar núcleo jogável de ponta a ponta + gamificação 6D/Octalysis e realizar o primeiro deploy em Cloud 4C (Supabase PostgreSQL TLS + Storage + Render Docker) — sub-issues: `#39` (`MVP-04A` — PR #53), `#40` (`MVP-04B` — PR #55), `#41` (`MVP-04C` — PR #59), `#42` (`MVP-04D` — desbloqueada), `#43` (`MVP-04E` — bloqueada por `#60`), `#44` (`MVP-04F` — bloqueada por `#60`) e `#45` (`MVP-04G`).
- [ ] **UX-02 (#69 — Refinamento Visual e Revisão Heurística Pós-MVP):** Rodada de *UI polish* e revisão heurística com o app rodando no emulador (bloqueada por `#60`, `#43` e `#44`), desdobrada em novas sub-issues referenciando `UX-01A`–`UX-01H` (sem reabrir as issues fechadas da v1).
- [ ] **MVP-05 (#46 — Épico Onda 1B, Fechamento Estágio 1):** Rotina (`US06`/`US07`/`US08`), Despensa (`US03`), Busca (`US04`), Utensílios (`US11`), Conta completa (`POST /v1/account/email`, `DELETE /v1/account`) e Curadoria assistida por IA (`US18` Kimi/Recorded) — fatiamento em sub-issues após concluir `#38`.

---

## 4. Handoff da Última Sessão

- **Data e Agente:** `23/11/2026` — Antigravity CLI (papel: Engenheiro de Plataforma / Governança Multi-Agente).
- **Branch de Trabalho:** `development` (alterações locais de governança prontas para commit/PR na `development`).
- **O que foi feito (Setup de `using-git-worktree` e `--use-worktree` no `solve-issue`):**
  1. Adaptada a skill pré-pronta [`.agents/skills/using-git-worktree/SKILL.md`](./.agents/skills/using-git-worktree/SKILL.md) ao contexto do Panelada (em PT-BR conforme `ADR-015`): detecção de isolamento existente + guarda de submódulo, preferência por ferramenta nativa do harness com fallback em `.worktrees/<slug>`, saída obrigatória de `origin/development` (ou branch pai em sub-issues empilhadas como `#60` → `#61`–`#68`), dois perfis de setup (Perfil A sem `pnpm install` para docs/UX/protótipo HTML; Perfil B com `pnpm install --frozen-lockfile` + `TZ=UTC pnpm test` para código), alerta de serialização para `panelada_test` no Docker Compose e passo explícito de teardown (`git worktree remove`).
  2. Adicionada a flag **`--use-worktree`** à skill [`.agents/skills/solve-issue/SKILL.md`](./.agents/skills/solve-issue/SKILL.md) (passos 0, 3, 4, 7.4/7.5, `--resume` e `--separate`), preservando o portão somente leitura antes da aprovação do plano e criando o worktree isolado no início da implementação sem sujar o checkout principal.
  3. Blindados `.gitignore`, `eslint.config.mjs`, `.prettierignore` e `.dockerignore` contra `.worktrees/`, atualizada a lista de skills em `AGENTS.md` e registrado o setup no `STATE.md` e no `docs/fase3/diario_de_bordo-fase3.md`.
- **Decisões tomadas:**
  - **Diretório canônico `.worktrees/<slug>` com `/` achatado para `-`:** evita subdiretórios aninhados e limites de caminho no Windows, mantendo isolamento total de Git, ESLint, Prettier e contexto de build Docker.
  - **Criação do worktree apenas no passo 4 do `solve-issue --use-worktree`:** mantém passos 1–3 estritamente somente leitura e evita worktrees órfãos caso o plano seja cancelado ou ajustado.
  - **Setup em dois perfis (A: docs/UX vs. B: código) + guarda de concorrência em `panelada_test`:** evita instalar `node_modules` em worktrees de protótipo/UX (`#60`–`#68`) e previne corridas quando múltiplos worktrees rodam testes de integração contra o mesmo Postgres Docker.
- **Arquivos criados/alterados:** `.agents/skills/using-git-worktree/SKILL.md`, `.agents/skills/solve-issue/SKILL.md`, `.gitignore`, `.prettierignore`, `.dockerignore`, `eslint.config.mjs`, `AGENTS.md`, `STATE.md` e `docs/fase3/diario_de_bordo-fase3.md`.
- **Próximo passo recomendado:**
  1. Revisar e integrar este setup de governança na `development`, e em seguida iniciar **`UX-01` (#60 e sub-issues `#61`–`#68`)** e/ou **`MVP-04D` (#42)** em paralelo usando `/solve-issue --use-worktree`.
