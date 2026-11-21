# STATE.md — Painel Vivo de Estado, Tarefas e Handoff (Panelada)

> **Instrução para Agentes de IA:** Leia [`./AGENTS.md`](./AGENTS.md) e este arquivo no início de toda sessão. Na Fase 3, atualize este painel ao concluir um **marco/etapa relevante** (`GOV-##`, `MVP-01`–`MVP-04`, mudança de ADR) ou na promoção semanal `development` → `main` (evitando conflitos de merge em micro-PRs paralelos).

---

## 1. Panorama Atual do Projeto

- **Fase Acadêmica Atual:** **Fase 2 — Projeto Arquitetural (CONCLUÍDA — tag `architecture-design--v1.0` na `main`)**; **Governança Multi-Agente (`GOV-04`) concluída**; pronta para iniciar a **Fase 3 — Implementação do MVP e Deploy em Cloud Gratuita (`MVP-01` → `MVP-04`)**.
- **Branch de Integração (Fase 3):** `development` (criada a partir da `main` em `architecture-design--v1.0`; entrega atual em `chore/gov-04-agent-workflow-and-skills`).
- **Última Atualização:** `21/11/2026`
- **Status Geral das Fases:**
  - ✅ **Fase 1 (Engenharia de Requisitos):** Concluída (`validated-backlog--v1.0`) e sincronizada com Lote 1 (#30), Gamificação (`ADR-016`) e Lote 3 (#32).
  - ✅ **Fase 2 (Projeto Arquitetural):** Concluída integralmente (`2.1`–`2.9`, `architecture-design--v1.0`), com `ADR-001`–`ADR-016`, `openapi.yaml` v1.2.0-2.8 (0 erros Redocly CLI), coleção Bruno (33 reqs + fixture), revisão adversarial (`R1`–`R21`) e fechamento.
  - ✅ **Frente Transversal — Gamificação Metodológica:** Concluída ([`framework-gamificacao.md`](./docs/fase2/03-modelagem/framework-gamificacao.md) e [ADR-016](./docs/fase2/02-adr/adr-016-framework-conceitual-gamificacao.md)) — híbrido **6D + Octalysis**, 8 marcos declarativos (`RN03 a–h`), 0 novas tabelas (`A12`).
  - ✅ **Frente A — Governança Multi-Agente (`GOV-01` a `GOV-04`):** Concluída com `docs/dev/`, `.agents/skills/` (portável para Linux/Windows via `scripts/setup-agent-skills.mjs`), `.github/ISSUE_TEMPLATE/`, `.plans/` no `.gitignore` e fluxo de branches `development` → `main`.
  - ⏳ **Fase 3 (Implementação do MVP e Deploy em Cloud Gratuita):** Pronta para início (`MVP-01` a `MVP-04`).

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

### Frente D — Implementação do MVP e Primeiro Deploy (Fase 3)
- [ ] **MVP-01:** Definir o recorte funcional prioritário de histórias/telas para o primeiro deploy (Estágio 1) via `grilling` + `github-issue-craft`.
- [ ] **MVP-02:** Configurar o esqueleto do monorepo (`pnpm` workspaces, TypeScript, `eslint-plugin-boundaries` com prova de falha intencional `S1`–`S8`/`A1`–`A8`, `docker-compose.yml` com Postgres dev/test + API em `0.0.0.0:3000`, trava `_test`, seed vivo `db:reset`, CI com *path filters* + criação de `docs/dev/DATABASE.md` e `docs/dev/TESTING.md` com comandos reais).
- [ ] **MVP-03:** Implementar `packages/allergen-rules` com TDD estrito e 100% dos vetores JSON (`A06`).
- [ ] **MVP-04:** Implementar fatia vertical do Estágio 1 na `apps/api` + `apps/mobile` e realizar o primeiro deploy em Cloud Gratuita (Supabase PostgreSQL TLS + Storage + PaaS container).

---

## 4. Handoff da Última Sessão

- **Data e Agente:** `21/11/2026` — Antigravity CLI (papel: Engenheiro de Plataforma / Governança Multi-Agente).
- **Branch de Trabalho:** `chore/gov-04-agent-workflow-and-skills` (criada a partir da nova branch `development`, que saiu de `main` em `architecture-design--v1.0`).
- **O que foi feito:**
  1. Debatida e fechada a transição do repositório para a Fase 3 (9 decisões de governança + análise crítica de trade-offs e 7 riscos residuais aceitos).
  2. Criada a camada operacional `docs/dev/` (`GLOSSARY.md`, `ARCHITECTURE.md`, `PRIVACY.md`), enxugado `AGENTS.md` (~115 linhas) e `CLAUDE.md`, atualizados `docs/playbooks/01..03`, `README.md` e `STATE.md`.
  3. Adaptadas e instaladas todas as 7 skills multi-agente em `.agents/skills/` (`grilling`, `github-issue-craft` + `audit_issues.py`, `solve-issue`, `code-review` adaptada da Sentry, `tdd`, `codebase-design`, `code-comments`), criado `.github/ISSUE_TEMPLATE/`, `.gitattributes`, `.gitignore`, e o script portátil Linux/Windows `scripts/setup-agent-skills.mjs`; removidos `./guia-agentes/` e `./docs/superpowers/`.
- **Decisões tomadas:**
  - Monorepo único preservando `docs/fase1/` e `docs/fase2/` como referência + `docs/dev/` vivo sob demanda (`DATABASE.md` e `TESTING.md` nascem no `MVP-02`).
  - Fluxo de branches `feat|fix|docs|chore/*` → `development` → `main` (mão única).
  - Planos locais visíveis em `.plans/` (no `.gitignore`) e skills unificadas em `.agents/skills/` + `scripts/setup-agent-skills.mjs` para Claude Code.
- **Arquivos criados/alterados:** `AGENTS.md`, `CLAUDE.md`, `STATE.md`, `README.md`, `.gitattributes`, `.gitignore`, `scripts/setup-agent-skills.mjs`, `docs/dev/{GLOSSARY,ARCHITECTURE,PRIVACY}.md`, `docs/playbooks/01..03`, `.github/ISSUE_TEMPLATE/{config,feature,bug,task}.yml`, `.agents/skills/**`; removidos `guia-agentes/` e `docs/superpowers/`.
- **Próximo passo recomendado:**
  1. Revisar, commitar e subir `development` + abrir PR de `chore/gov-04-agent-workflow-and-skills` → `development` (e promover para `main` para ativar os `.github/ISSUE_TEMPLATE/` na branch padrão).
  2. Iniciar **`MVP-01`** (usando `grilling` + `github-issue-craft`) e **`MVP-02`** (monorepo + Docker Compose + `eslint-plugin-boundaries` + CI).
