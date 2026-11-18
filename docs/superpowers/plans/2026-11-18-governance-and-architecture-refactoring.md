# Governance & Architecture Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `/docs/fase2/` to match canonical file header paths, establish CLI agent governance (`AGENTS.md`, `CLAUDE.md`, `STATE.md`, `docs/playbooks/`), and document the incremental MVP/Deploy/Gamification architectural refinements (`2A`, `3C`, `4C`).

**Architecture:** File-system reorganization using `git mv` so `/docs/fase2/` matches its declared header destinations (`/docs/fase2/*.md`, `/docs/fase2/adr/`, `/docs/fase2/bruno/`). Multi-agent governance anchored at the repository root (`AGENTS.md`, `CLAUDE.md`, `STATE.md`) backed by deterministic operational playbooks (`docs/playbooks/01..03-*.md`) ready for future Issue-creation and Issue-implementation skills. Non-destructive architectural refinements appended as dated `Detalhamento` sections in existing ADRs, C4, and Design Patterns artifacts.

**Tech Stack:** Markdown, Mermaid, OpenAPI 3.1, Git, Bash verification commands.

**Spec:** `docs/superpowers/specs/2026-11-18-governance-and-architecture-refactoring-design.md`

## Global Constraints

- **Precedence rule:** Approved artifacts > ADRs > `STATE.md` > `briefing-fase2.md`.
- **Bilingual convention (`ADR-015`):** All documentation text, PRs, Issues, and Diário de Bordo entries in **Portuguese (Brazil)**; code identifiers, code folder names, OpenAPI routes, Bruno collection, and commit messages in **English**.
- **ADR immutability:** Never delete an ADR or rewrite its historical decision body; add dated `## Detalhamento (Governança e MVP — 18/11/2026)` sections.
- **History preservation:** Use `git mv` for all file moves in `docs/fase2/`.

## Review Focus

1. **Stale relative links after moving `docs/fase2/` files:** The spec itself (`docs/superpowers/specs/2026-11-18-governance-and-architecture-refactoring-design.md`) and `README.md` must resolve every Markdown link to actual files on disk with zero broken targets.
2. **Leftover empty numbered folders in `docs/fase2/`:** After `git mv`, directories `2.1-requisitos_de_qualidade` through `2.7-padroes_de_projeto` must not remain on disk.
3. **Bruno collection integrity:** Moving `2.6-diagramas_fluxos_contratos/bruno/panelada-curadoria` to `docs/fase2/bruno/panelada-curadoria` must preserve all 43 `.bru` and `.json` files intact.
4. **Supabase LGPD (`A05`) boundary in `ADR-004` and `c4-containers.md`:** The documentation must explicitly state that Supabase is used solely as managed PostgreSQL + Object Storage behind the Fastify API (no client BaaS SDK), preserving application-level `AES-256-GCM` encryption of dietary restrictions (`ADR-006`).
5. **Future Issue workflow readiness:** `AGENTS.md` and `docs/playbooks/01-sessao-issues-e-diario.md` must define the exact Issue metadata contract (`Origem`, `Camada`, `Critérios de Aceite`, `Verificação`) so future issue-creation and issue-execution skills can parse and produce them deterministically.

---

### Task 1: Restructure `/docs/fase2/` Directory Tree (`Option 1B`)

**Files:**
- Move: `docs/fase2/2.1-requisitos_de_qualidade/atributos-qualidade.md` -> `docs/fase2/atributos-qualidade.md`
- Move: `docs/fase2/2.2-estilo_arquitetural/estilo-arquitetural.md` -> `docs/fase2/estilo-arquitetural.md`
- Move: `docs/fase2/2.3-propostas_arquiteturais/propostas-arquiteturais.md` -> `docs/fase2/propostas-arquiteturais.md`
- Move: `docs/fase2/2.4-ADRs` -> `docs/fase2/adr`
- Move: `docs/fase2/2.5-c4/c4-contexto.md` -> `docs/fase2/c4-contexto.md`
- Move: `docs/fase2/2.5-c4/c4-containers.md` -> `docs/fase2/c4-containers.md`
- Move: `docs/fase2/2.5-c4/c4-componentes.md` -> `docs/fase2/c4-componentes.md`
- Move: `docs/fase2/2.6-diagramas_fluxos_contratos/*.md` -> `docs/fase2/*.md`
- Move: `docs/fase2/2.6-diagramas_fluxos_contratos/openapi.yaml` -> `docs/fase2/openapi.yaml`
- Move: `docs/fase2/2.6-diagramas_fluxos_contratos/bruno` -> `docs/fase2/bruno`
- Move: `docs/fase2/2.7-padroes_de_projeto/padroes-de-projeto.md` -> `docs/fase2/padroes-de-projeto.md`
- Modify: `docs/superpowers/specs/2026-11-18-governance-and-architecture-refactoring-design.md`

**Interfaces:**
- Consumes: Existing `/docs/fase2/2.*` directory tree.
- Produces: Canonical paths `/docs/fase2/*.md`, `/docs/fase2/openapi.yaml`, `/docs/fase2/adr/adr-001..015-*.md`, and `/docs/fase2/bruno/panelada-curadoria/`.

- [ ] **Step 1: Verify target layout does not exist yet (failing check)**

Run: `test -d docs/fase2/adr && test -f docs/fase2/openapi.yaml && echo "READY" || echo "NOT_MOVED"`
Expected: `NOT_MOVED`

- [ ] **Step 2: Move all Phase 2 files with `git mv` and remove empty numbered directories**

```bash
git mv docs/fase2/2.1-requisitos_de_qualidade/atributos-qualidade.md docs/fase2/atributos-qualidade.md
git mv docs/fase2/2.2-estilo_arquitetural/estilo-arquitetural.md docs/fase2/estilo-arquitetural.md
git mv docs/fase2/2.3-propostas_arquiteturais/propostas-arquiteturais.md docs/fase2/propostas-arquiteturais.md
git mv docs/fase2/2.4-ADRs docs/fase2/adr
git mv docs/fase2/2.5-c4/c4-contexto.md docs/fase2/c4-contexto.md
git mv docs/fase2/2.5-c4/c4-containers.md docs/fase2/c4-containers.md
git mv docs/fase2/2.5-c4/c4-componentes.md docs/fase2/c4-componentes.md
git mv docs/fase2/2.6-diagramas_fluxos_contratos/diagrama-classes.md docs/fase2/diagrama-classes.md
git mv docs/fase2/2.6-diagramas_fluxos_contratos/sequencia-uc04.md docs/fase2/sequencia-uc04.md
git mv docs/fase2/2.6-diagramas_fluxos_contratos/sequencia-uc08.md docs/fase2/sequencia-uc08.md
git mv docs/fase2/2.6-diagramas_fluxos_contratos/sequencia-uc10.md docs/fase2/sequencia-uc10.md
git mv docs/fase2/2.6-diagramas_fluxos_contratos/sequencia-uc12.md docs/fase2/sequencia-uc12.md
git mv docs/fase2/2.6-diagramas_fluxos_contratos/glossario-identificadores.md docs/fase2/glossario-identificadores.md
git mv docs/fase2/2.6-diagramas_fluxos_contratos/mapa-renomeacao-openapi.md docs/fase2/mapa-renomeacao-openapi.md
git mv docs/fase2/2.6-diagramas_fluxos_contratos/openapi.yaml docs/fase2/openapi.yaml
git mv docs/fase2/2.6-diagramas_fluxos_contratos/bruno docs/fase2/bruno
git mv docs/fase2/2.7-padroes_de_projeto/padroes-de-projeto.md docs/fase2/padroes-de-projeto.md
rmdir docs/fase2/2.1-requisitos_de_qualidade docs/fase2/2.2-estilo_arquitetural docs/fase2/2.3-propostas_arquiteturais docs/fase2/2.5-c4 docs/fase2/2.6-diagramas_fluxos_contratos docs/fase2/2.7-padroes_de_projeto
```

- [ ] **Step 3: Update relative links in `docs/superpowers/specs/2026-11-18-governance-and-architecture-refactoring-design.md`**

Replace `../../fase2/2.4-ADRs/` with `../../fase2/adr/` in `docs/superpowers/specs/2026-11-18-governance-and-architecture-refactoring-design.md`.

- [ ] **Step 4: Verify canonical layout, Bruno file count, and absence of old directories**

Run: `test -d docs/fase2/adr && test -f docs/fase2/openapi.yaml && test $(find docs/fase2/bruno/panelada-curadoria -type f | wc -l) -eq 43 && test $(find docs/fase2 -maxdepth 1 -type d -name "2.*" | wc -l) -eq 0 && echo "PASS"`
Expected: `PASS`

- [ ] **Step 5: Commit**

```bash
git add -A docs/fase2 docs/superpowers/specs/2026-11-18-governance-and-architecture-refactoring-design.md
git commit -m "refactor(docs): align phase 2 file paths with canonical header destinations"
```

---

### Task 2: Create Root Agent Entrypoints (`AGENTS.md`, `CLAUDE.md`) and Update `README.md`

**Files:**
- Create: `AGENTS.md`
- Create: `CLAUDE.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: Canonical paths from Task 1.
- Produces:
  - `AGENTS.md`: Root agent guide with sections `## 1. Visão Geral do Projeto`, `## 2. Protocolo Obrigatório de Sessão (Início e Fim)`, `## 3. Regras de Ouro e Precedência`, `## 4. Mapa de Navegação do Repositório`, `## 5. Matriz de Leitura por Tipo de Tarefa`, `## 6. Convenção para Issues, Workflows e Skills`.
  - `CLAUDE.md`: Pointer loading `AGENTS.md` and `STATE.md`.
  - `README.md`: Updated project overview covering Phase 1, Phase 2 (2.1–2.7), and Multi-Agent Governance.

- [ ] **Step 1: Verify governance entrypoints do not exist yet (failing check)**

Run: `test -f AGENTS.md && test -f CLAUDE.md && grep -q "Fase 2" README.md && echo "READY" || echo "MISSING"`
Expected: `MISSING`

- [ ] **Step 2: Create `AGENTS.md` and `CLAUDE.md`**

Write `AGENTS.md` in Portuguese (Brazil) covering:
1. **Visão Geral:** Panelada (aplicativo mobile de culinária internacional gamificada), disciplina de TSI (IA generativa aplicada ao ciclo de vida de software), dupla Anny Filgueiras e Gabryel Souza.
2. **Protocolo Obrigatório de Sessão:**
   - **Ao iniciar:** (1) Ler `STATE.md`; (2) Identificar a Issue/tarefa alvo; (3) Ler apenas os artefatos listados na Matriz de Leitura da seção 5 e o playbook correspondente em `docs/playbooks/`.
   - **Ao encerrar:** (1) Executar verificações do playbook; (2) Atualizar `STATE.md` (tabela de tasks e bloco `Handoff da Última Sessão`); (3) Registrar entrada no `docs/faseX/diario_de_bordo-faseX.md` quando a tarefa fechar ou alterar artefato de fase; (4) Commitar em inglês (`ADR-015`).
3. **Regras de Ouro e Precedência:**
   - Precedência: **Artefatos aprovados > ADRs > `STATE.md` > `briefing-fase2.md`**.
   - Idioma (`ADR-015`): textos de documentação, PRs, Issues e Diário em português (Brasil); código, pastas de código, rotas/campos OpenAPI, Bruno e mensagens de commit em inglês.
   - Fronteiras (`ADR-002` e `padroes-de-projeto.md` §6): regras `S1..S8` (API) e `A1..A8` (App); transações cross-módulo via `Tx` explícito (`T01`).
   - Segurança e LGPD (`A05`, `ADR-006`): zero restrição alimentar em texto claro em disco, logs ou provedor de IA.
4. **Mapa de Navegação do Repositório:** Links diretos para todos os arquivos de `docs/fase1/`, `docs/fase2/`, `docs/playbooks/`, além da topologia reservada de código do monorepo (`apps/api/`, `apps/mobile/`, `packages/allergen-rules/`).
5. **Matriz de Leitura por Tipo de Tarefa:** O que ler para (a) Requisitos/Gamificação, (b) Arquitetura/ADRs/C4, (c) Backend API (`apps/api`), (d) Mobile (`apps/mobile`), (e) Pacote `allergen-rules`.
6. **Convenção para Issues, Workflows e Skills:** Estrutura de metadados de toda GitHub Issue (`Origem`, `Camada`, `Critérios de Aceite`, `Verificação`) e caminhos para playbooks (`docs/playbooks/`) e futuras skills do projeto.

Write `CLAUDE.md` pointing directly to `AGENTS.md` and `STATE.md` as mandatory first reads.

- [ ] **Step 3: Update `README.md` to reflect Phase 1, Phase 2, and Governance**

Update `README.md` with:
- Current status covering **Fase 1 (Concluída)** and **Fase 2 (Etapas 2.1 a 2.7 concluídas; 2.8 e 2.9 em andamento)**.
- Section **Governança Multi-Agente** linking to `AGENTS.md`, `STATE.md`, and `docs/playbooks/`.
- Complete links to all Phase 2 artifacts at their new canonical paths (`docs/fase2/...`).
- Updated repository tree diagram.

- [ ] **Step 4: Verify all Markdown file links in `AGENTS.md`, `CLAUDE.md`, and `README.md` resolve on disk**

Run: `python3 -c '
import re, pathlib, sys
for doc in ["AGENTS.md", "CLAUDE.md", "README.md"]:
    text = pathlib.Path(doc).read_text()
    for target in re.findall(r"\]\(\./([^)#]+)\)", text):
        if not pathlib.Path(target).exists():
            print(f"BROKEN in {doc}: {target}")
            sys.exit(1)
print("ALL_LINKS_VALID")
'`
Expected: `ALL_LINKS_VALID`

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md CLAUDE.md README.md
git commit -m "docs(governance): add AGENTS.md, CLAUDE.md and update README for phase 2"
```

---

### Task 3: Create Operational Playbooks (`docs/playbooks/01..03-*.md`) and Live State (`STATE.md`)

**Files:**
- Create: `docs/playbooks/01-sessao-issues-e-diario.md`
- Create: `docs/playbooks/02-arquitetura-adrs-e-retroalimentacao.md`
- Create: `docs/playbooks/03-qualidade-fronteiras-e-contratos.md`
- Create: `STATE.md`

**Interfaces:**
- Consumes: `AGENTS.md` conventions from Task 2 and `docs/fase2/diario_de_bordo-fase2.md` pending items.
- Produces:
  - `docs/playbooks/01-sessao-issues-e-diario.md`
  - `docs/playbooks/02-arquitetura-adrs-e-retroalimentacao.md`
  - `docs/playbooks/03-qualidade-fronteiras-e-contratos.md`
  - `STATE.md`

- [ ] **Step 1: Verify playbooks and `STATE.md` do not exist yet (failing check)**

Run: `test -f STATE.md && test -f docs/playbooks/01-sessao-issues-e-diario.md && test -f docs/playbooks/02-arquitetura-adrs-e-retroalimentacao.md && test -f docs/playbooks/03-qualidade-fronteiras-e-contratos.md && echo "READY" || echo "MISSING"`
Expected: `MISSING`

- [ ] **Step 2: Create the 3 operational playbooks in `docs/playbooks/`**

1. `docs/playbooks/01-sessao-issues-e-diario.md`:
   - Checklist de início de sessão (`STATE.md` + `gh issue`).
   - Template canônico para criação de GitHub Issues (campos `## Contexto e Origem (US/RN/RNF/ADR)`, `## Escopo e Camada`, `## Critérios de Aceite (Given/When/Then ou Checklist)`, `## Verificação / Testes`) preparado para a futura skill de criação de issues.
   - Fluxo de implementação de uma Issue (branch, TDD conforme `padroes-de-projeto.md` §9, commit em inglês).
   - Template obrigatório de entrada no `diario_de_bordo-faseX.md` (Papel da IA, Técnicas aplicadas, Prompts-chave/Contexto, Insumos usados, Artefatos produzidos, Decisões tomadas, Artefatos alterados, Iterações relevantes, Divergências, Riscos aceitos, Pendências).
   - Template de atualização do `Handoff da Última Sessão` em `STATE.md`.
2. `docs/playbooks/02-arquitetura-adrs-e-retroalimentacao.md`:
   - Regras para evoluir ADRs (seção `## Detalhamento (<Etapa/Contexto> — DD/MM/AAAA)` vs. substituição formal por `ADR-NNN`).
   - Cadeia de rastreabilidade obrigatória (`US/RN/RNF <-> Atributo A## <-> ADR <-> C4 <-> Classes/Sequências/OpenAPI`).
   - Protocolo de retroalimentação: Fase 2 -> Fase 2 (edição direta + registro no diário) vs. Fase 2/3 -> Fase 1 (agrupamento em Issue de retroalimentação no GitHub).
3. `docs/playbooks/03-qualidade-fronteiras-e-contratos.md`:
   - Regras de fronteira modular do servidor (`S1..S8`) e do app (`A1..A8`) com `eslint-plugin-boundaries` e a prova de falha intencional.
   - Validação de contrato (`openapi.yaml` v1.1+ e sincronia com `docs/fase2/bruno/panelada-curadoria`).
   - Suítes de vetores JSON compartilhados (`allergen-rules` para `A06` e `UnlockRules`/`UnlockCalculator` para `RN03`/`RN04`).
   - Matriz de testes por camada (Test-first vs. Teste depois vs. Medição de hipótese `H`).

- [ ] **Step 3: Create `STATE.md` at repository root**

Write `STATE.md` containing:
- **1. Panorama Atual:** Fase 2 (pós-2.7), branch `phase2-architecture`, status de cada fase.
- **2. Diretrizes Estratégicas Vigentes (Governança, MVP, Deploy e Gamificação):**
  - Monorepo (`docs/`, `packages/allergen-rules/`, `apps/api/`, `apps/mobile/`).
  - Gamificação (`Opção 2A`): futura etapa com framework metodológico (6D / Octalysis) isolada em `UnlockCalculator` / `UnlockRules` e definições declarativas de marcos.
  - Offline em 2 Estágios (`Opção 3C`): Estágio 1 com SQLCipher para leitura offline de planejadas + `DirectOnlineOperationEnqueuer` na porta `OperationEnqueuer`; Estágio 2 com `OutboxOperationEnqueuer` + `Synchronizer` + `ProcessedOperation`.
  - Deploy Cloud Gratuita (`Opção 4C`): Supabase (PostgreSQL + Storage gratuitos, sem BaaS SDK no cliente, mantendo cifra `AES-256-GCM` na API) + container Fastify em PaaS gratuita (Render/Fly.io/Koyeb), em paridade com Docker Compose local via porta `PhotoStorage`.
- **3. Quadro de Tarefas e Pendências (Sincronizado com GitHub Issues e Diário 2.7):**
  - **Frente A — Fechamento da Fase 2:**
    - `[ ]` Confirmar riscos `R18` e `R19` e resolver `[CONFIRMAR]` de licenças (`R10`, `ADR-010`, `ADR-012`).
    - `[ ]` Aplicar notas de detalhamento pendentes da 2.6/2.7 nos ADRs e higiene do Lote 2.
    - `[ ]` Abrir/fechar Issue #31 (Lote 3 de retroalimentação da Fase 1).
    - `[ ]` Executar lint do `openapi.yaml` e validar coleção Bruno.
    - `[ ]` Etapa 2.8 — Revisão Arquitetural ("advogado do diabo" -> `revisao-arquitetural.md`).
    - `[ ]` Etapa 2.9 — Checklist Final e Resumo para Fase 3 (`checklist-final.md`, `resumo-fase2-para-fase3.md`).
  - **Frente B — Evolução de Gamificação e Workflows:**
    - `[ ]` Criar workflows/skills de geração e implementação de GitHub Issues.
    - `[ ]` Modelar gamificação com framework conceitual especializado (ex.: 6D ou Octalysis) e retroalimentar RNs/marcos do módulo `progress`.
  - **Frente C — MVP e Primeiro Deploy (Fase 3):**
    - `[ ]` Definir recorte funcional do Estágio 1 do MVP.
    - `[ ]` Inicializar workspaces do monorepo (`packages/allergen-rules`, `apps/api`, `apps/mobile`) com lint de fronteiras.
    - `[ ]` Configurar deploy no Supabase (Postgres + Storage) + PaaS do container da API.
- **4. Handoff da Última Sessão:** Preenchido com o resumo desta refatoração (18/11/2026).

- [ ] **Step 4: Verify all required sections exist in `STATE.md` and playbooks**

Run: `grep -q "Handoff da Última Sessão" STATE.md && grep -q "Template Canônico de GitHub Issue" docs/playbooks/01-sessao-issues-e-diario.md && grep -q "Detalhamento" docs/playbooks/02-arquitetura-adrs-e-retroalimentacao.md && grep -q "eslint-plugin-boundaries" docs/playbooks/03-qualidade-fronteiras-e-contratos.md && echo "PASS"`
Expected: `PASS`

- [ ] **Step 5: Commit**

```bash
git add STATE.md docs/playbooks/
git commit -m "docs(governance): add STATE.md and operational playbooks for CLI agents"
```

---

### Task 4: Apply Architectural Refinements (`2A`, `3C`, `4C`) to ADRs, C4, Patterns, Briefing, and Diário de Bordo

**Files:**
- Modify: `docs/fase2/adr/adr-002-estilo-servidor-monolito-modular.md`
- Modify: `docs/fase2/adr/adr-004-demonstracao-docker-e-alvo.md`
- Modify: `docs/fase2/adr/adr-008-estrategia-offline-e-sincronizacao.md`
- Modify: `docs/fase2/adr/adr-012-fotos.md`
- Modify: `docs/fase2/c4-containers.md`
- Modify: `docs/fase2/padroes-de-projeto.md`
- Modify: `docs/fase2/diagrama-classes.md`
- Modify: `docs/fase2/briefing-fase2.md`
- Modify: `docs/fase2/diario_de_bordo-fase2.md`

**Interfaces:**
- Consumes: Spec §4 and §5.3 (`Options 2A, 3C, 4C`).
- Produces:
  - `ADR-002`: `## Detalhamento (2.7)` covering `src/shared/` (`Tx` and `OperationApplier`) and `eslint-plugin-boundaries`.
  - `ADR-004`: `## Detalhamento (Governança e Estratégia de Deploy MVP — 18/11/2026)` documenting `Option 4C` (Supabase PostgreSQL + Storage behind Fastify API + PaaS container deploy, preserving local Docker Compose parity and `ADR-006` application-level `AES-256-GCM` encryption).
  - `ADR-008`: `## Detalhamento (Implementação Incremental em 2 Estágios para o MVP — 18/11/2026)` documenting `Option 3C` (`DirectOnlineOperationEnqueuer` in Stage 1 vs. `OutboxOperationEnqueuer` in Stage 2 via `OperationEnqueuer` port, with SQLCipher offline reads active from Stage 1).
  - `ADR-012`: `## Detalhamento (Governança e Estratégia de Deploy MVP — 18/11/2026)` documenting `PhotoStorage` port (`LocalDiskPhotoStorage` vs. `SupabasePhotoStorage`).
  - `c4-containers.md`: Section `## 5.1. Implantação do MVP em Cloud Gratuita (Detalhamento 18/11/2026 — Opção 4C)` with Mermaid deployment diagram and notes.
  - `padroes-de-projeto.md` and `diagrama-classes.md`: Port `P02f` (`PhotoStorage`), Stage 1/2 adapters for `OperationEnqueuer` (`P04`), and methodological gamification extension point note on `UnlockCalculator` / `UnlockRules` (`Option 2A`).
  - `briefing-fase2.md`: v1.5 revision history entry referencing `AGENTS.md`, `STATE.md`, and canonical `/docs/fase2/` paths.
  - `diario_de_bordo-fase2.md`: Dated entry `## [18/11/2026] — Refatoração de Governança Multi-Agente e Alinhamento Arquitetural para MVP`.

- [ ] **Step 1: Verify target refinements are not yet present in Phase 2 artifacts (failing check)**

Run: `grep -q "PhotoStorage" docs/fase2/padroes-de-projeto.md && grep -q "DirectOnlineOperationEnqueuer" docs/fase2/adr/adr-008-estrategia-offline-e-sincronizacao.md && echo "PRESENT" || echo "MISSING"`
Expected: `MISSING`

- [ ] **Step 2: Append dated `Detalhamento` sections to `ADR-002`, `ADR-004`, `ADR-008`, and `ADR-012`**

- In `docs/fase2/adr/adr-002-estilo-servidor-monolito-modular.md`: add `## Detalhamento (2.7)` recording `src/shared/` (`Tx` opaque transaction context and `OperationApplier` interface) and boundary enforcement via `eslint-plugin-boundaries` (`S1..S8`).
- In `docs/fase2/adr/adr-004-demonstracao-docker-e-alvo.md`: add `## Detalhamento (Governança e Estratégia de Deploy MVP — 18/11/2026)` recording `Option 4C`:
  - Deploy real do MVP em cloud gratuita usando **Supabase (Free Tier)** apenas como **PostgreSQL gerenciado e Object Storage de fotos** (sem uso de SDK BaaS no cliente; todo tráfego passa pela API Fastify, preservando a cifra `AES-256-GCM` de aplicação do `ADR-006` para `A05`).
  - Hospedagem do container Docker da `API Panelada` em PaaS gratuita (Render / Fly.io / Koyeb) configurada por variáveis de ambiente.
  - Paridade integral mantida com o `docker compose` local para desenvolvimento e fallback offline de apresentação.
- In `docs/fase2/adr/adr-008-estrategia-offline-e-sincronizacao.md`: add `## Detalhamento (Implementação Incremental em 2 Estágios para o MVP — 18/11/2026)` recording `Option 3C`:
  - **Estágio 1 (Primeiro Deploy do MVP):** `SqlCipherDatabase` ativo para leitura offline das receitas planejadas/em preparo e checagem local de alérgenos (`A04`, `A05`, `A06`). Mutações usam a porta `OperationEnqueuer` conectada na raiz de composição ao adaptador `DirectOnlineOperationEnqueuer` (envio imediato com `Idempotency-Key` e atualização da cópia local, exigindo rede).
  - **Estágio 2 (Offline-First Completo):** Substituição na raiz de composição pelo `OutboxOperationEnqueuer` + `Synchronizer` e ativação da tabela `ProcessedOperation` para fila offline persistente sem alterar telas ou casos de uso.
- In `docs/fase2/adr/adr-012-fotos.md`: add `## Detalhamento (Governança e Estratégia de Deploy MVP — 18/11/2026)` recording the `PhotoStorage` port (`LocalDiskPhotoStorage` in local Docker Compose vs. `SupabasePhotoStorage` in cloud deploy).

- [ ] **Step 3: Update `c4-containers.md`, `padroes-de-projeto.md`, and `diagrama-classes.md`**

- In `docs/fase2/c4-containers.md`: add subsection `### 5.1. Implantação do MVP em Cloud Gratuita (Detalhamento 18/11/2026 — Opção 4C)` detailing the PaaS container host + Supabase PostgreSQL & Storage topology alongside the existing GCP target and local Docker Compose deployment.
- In `docs/fase2/padroes-de-projeto.md`:
  - Add `P02f` (`PhotoStorage`: `LocalDiskPhotoStorage` and `SupabasePhotoStorage`) to the summary table (§2) and Ports table (§3, `P02`).
  - In `P04` (`Transactional Outbox`), document the two-stage composition strategy (`DirectOnlineOperationEnqueuer` in MVP Stage 1 -> `OutboxOperationEnqueuer` in Stage 2 via `src/app/composition`).
  - In §5 (`Regra de desbloqueio nos dois lados`), document that `UnlockCalculator` and `UnlockRules` + declarative `MilestoneDefinition` seed data serve as the isolated extension point for the upcoming methodological gamification framework (e.g., 6D or Octalysis — `Option 2A`).
- In `docs/fase2/diagrama-classes.md`: register `PhotoStorage` interface in the `importer`/`catalog` module notes and the `DirectOnlineOperationEnqueuer` / `OutboxOperationEnqueuer` realization of `OperationEnqueuer`.

- [ ] **Step 4: Update `briefing-fase2.md` (v1.5) and append entry to `diario_de_bordo-fase2.md`**

- In `docs/fase2/briefing-fase2.md`: add row `v1.5 | 18/11/2026` in section 10 (`Histórico de revisões`) and a note at the top pointing CLI agents to `AGENTS.md` and `STATE.md` as the active governance entrypoints.
- In `docs/fase2/diario_de_bordo-fase2.md`: append `## [18/11/2026] — Refatoração de Governança Multi-Agente e Alinhamento Arquitetural para MVP` following the canonical diary structure (Papel da IA, Técnicas aplicadas, Contexto, Insumos, Artefatos produzidos/movidos, Decisões tomadas `1B`, `2A`, `3C`, `4C`, Artefatos alterados, Riscos e Pendências).

- [ ] **Step 5: Verify all new sections and commit**

Run: `grep -q "P02f" docs/fase2/padroes-de-projeto.md && grep -q "DirectOnlineOperationEnqueuer" docs/fase2/adr/adr-008-estrategia-offline-e-sincronizacao.md && grep -q "Supabase" docs/fase2/adr/adr-004-demonstracao-docker-e-alvo.md && grep -q "18/11/2026" docs/fase2/diario_de_bordo-fase2.md && echo "PASS"`
Expected: `PASS`

```bash
git add docs/fase2/
git commit -m "docs(architecture): record MVP two-stage offline, cloud PaaS deploy and gamification extension points"
```
