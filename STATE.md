# STATE.md — Painel Vivo de Estado, Tarefas e Handoff (Panelada)

> **Instrução para Agentes de IA:** Leia este arquivo no início de toda sessão (junto com o [`./AGENTS.md`](./AGENTS.md)) e **atualize-o obrigatoriamente ao final da sessão** antes de encerrar. Ele substitui os antigos "briefings de passagem" manuais e mantém qualquer agente ou nova thread situado em segundos.

---

## 1. Panorama Atual do Projeto

- **Fase Acadêmica Atual:** **Fase 2 — Projeto Arquitetural** (Etapas `2.1` a `2.7` concluídas; Governança Multi-Agente implantada; preparando fechamento `2.8`/`2.9`, modelagem de Gamificação e início da Fase 3 / MVP).
- **Branch de Referência:** `main` (Fase 1 e Fase 2 consolidadas; baseline da Fase 1 na tag `validated-backlog--v1.0`).
- **Última Atualização:** `18/11/2026`
- **Status Geral das Fases:**
  - ✅ **Fase 1 (Engenharia de Requisitos):** Concluída (`1.1` Elicitação, `1.2` Análise, `1.3` Documentação, `1.4` Validação). Recebe atualizações apenas via GitHub Issues agrupadas de retroalimentação (Lote 1 concluído na Issue #30; Lote 3 pronto para Issue #31).
  - 🔄 **Fase 2 (Projeto Arquitetural):** `2.1` a `2.7` concluídas e reorganizadas em caminhos canônicos em [`./docs/fase2/`](./docs/fase2/). Pendentes: higiene final (Lote 2), validação executável de OpenAPI/Bruno, `2.8` (Revisão Arquitetural) e `2.9` (Checklist Final).
  - ⏳ **Frente Transversal — Gamificação Metodológica:** Requisito adicionado após a Fase 2 para fundamentar e expandir a gamificação do projeto usando um **framework conceitual especializado** (ex.: **Octalysis** ou **6D**).
  - ⏳ **Fase 3 (Implementação do MVP e Deploy em Cloud Gratuita):** Topologia do monorepo e estratégia incremental de 2 estágios definidas e documentadas nos ADRs.

---

## 2. Diretrizes Estratégicas Vigentes (Governança, Arquitetura, MVP e Deploy)

Qualquer agente que trabalhe em documentação ou código deve respeitar estas 4 decisões estruturais aprovadas pela dupla em `18/11/2026` (Design Doc em [`./docs/superpowers/specs/2026-11-18-governance-and-architecture-refactoring-design.md`](./docs/superpowers/specs/2026-11-18-governance-and-architecture-refactoring-design.md)):

1. **Topologia Monorepo + Governança Baseada em Repositório (`Opção 1B`):**
   - Único repositório contendo `docs/`, e futuramente `packages/allergen-rules/`, `apps/api/` e `apps/mobile/`.
   - Caminhos físicos de [`./docs/fase2/`](./docs/fase2/) batem 100% com os cabeçalhos dos artefatos (`/docs/fase2/*.md`, `/docs/fase2/adr/` e `/docs/fase2/bruno/`).
   - Controle de tarefas centrado em **GitHub Issues** espelhadas neste `STATE.md`, guiado pelos manuais em [`./docs/playbooks/`](./docs/playbooks/).
2. **Ponto de Extensão Isolado para Framework Conceitual de Gamificação (`Opção 2A`):**
   - O "framework de gamificação" exigido na disciplina é um **framework metodológico/conceitual** (como **6D** ou **Octalysis**), não uma biblioteca externa de código.
   - Tecnicamente, toda regra de progresso/recompensa permanece isolada nas funções puras `UnlockCalculator` (App) e `UnlockRules` (API, módulo `progress`), orientadas a definições declarativas de marcos (`MilestoneDefinition`) e testadas por vetores JSON comuns. Quando a modelagem 6D/Octalysis ocorrer em conversa futura, ela atualizará os requisitos (Fase 1) e estenderá o módulo `progress` sem vazar para outros módulos (`A12`).
3. **Implementação do Offline-First em 2 Estágios Reversíveis (`Opção 3C` — [ADR-008](./docs/fase2/adr/adr-008-estrategia-offline-e-sincronizacao.md)):**
   - **Estágio 1 (Primeiro Deploy do MVP):** O app já utiliza o banco local cifrado (`SqlCipherDatabase` atrás da porta `LocalDatabase` — `P02a`) para **leitura offline** das receitas planejadas/em preparo e checagem local de alérgenos (`A04`, `A05`, `A06`). Porém, **escritas/mutações** (avaliar prato, agendar rotina, editar restrição) exigem rede no Estágio 1. Para garantir transição sem retrabalho para o offline completo, os casos de uso chamam desde o início a porta `OperationEnqueuer` (`P04`), injetada na raiz de composição (`src/app/composition`) com o adaptador `DirectOnlineOperationEnqueuer`.
   - **Estágio 2 (Offline-First Completo):** Troca-se na raiz de composição o adaptador para `OutboxOperationEnqueuer` + `Synchronizer` e ativa-se a tabela `ProcessedOperation` (`Idempotent Receiver` — `P05`), sem alterar nenhuma tela ou caso de uso.
4. **Deploy Real em Cloud Gratuita com Paridade Local (`Opção 4C` — [ADR-004](./docs/fase2/adr/adr-004-demonstracao-docker-e-alvo.md) e [ADR-012](./docs/fase2/adr/adr-012-fotos.md)):**
   - **Nuvem Gratuita:** Utiliza **Supabase (Free Tier)** exclusivamente como **PostgreSQL gerenciado** e **Object Storage para fotos WebP** (atrás da porta `PhotoStorage` — `P02f`), **sem usar o SDK BaaS no cliente**. Todo o tráfego passa pelo container da `API Panelada` (Fastify) hospedado em PaaS gratuita (Render / Fly.io / Koyeb), garantindo que as restrições alimentares continuem cifradas em memória com `AES-256-GCM` ([ADR-006](./docs/fase2/adr/adr-006-criptografia-restricao-alimentar.md)) antes de persistir no banco.
   - **Paridade Local:** O `docker-compose.yml` local (`api` + `postgres` + volume de fotos via `LocalDiskPhotoStorage`) permanece 100% funcional para desenvolvimento e como fallback offline garantido para apresentação.

---

## 3. Quadro de Tarefas e Pendências (Backlog Ativo)

### Frente A — Governança e Automação de Fluxo
- [x] **GOV-01:** Reestruturar `/docs/fase2/` para bater com os cabeçalhos canônicos (`adr/`, `bruno/`, raiz `fase2/`).
- [x] **GOV-02:** Criar `AGENTS.md`, `CLAUDE.md`, `STATE.md`, `docs/playbooks/01..03` e atualizar `README.md`.
- [x] **GOV-03:** Registrar detalhamentos arquiteturais de MVP/Deploy/Gamificação (`2A`, `3C`, `4C`) em `ADR-002`, `ADR-004`, `ADR-008`, `ADR-012`, `c4-containers.md`, `padroes-de-projeto.md` e `diagrama-classes.md`.
- [ ] **GOV-04:** Criar workflows/skills dedicados para (1) geração automatizada de GitHub Issues a partir dos artefatos e (2) implementação guiada de Issues.

### Frente B — Fechamento e Higiene da Fase 2 (Etapas 2.6 a 2.9)
- [ ] **F2-01 (Retroalimentação Fase 1 — Lote 3):** Abrir e aplicar a GitHub Issue #31 de retroalimentação da Fase 1 (ajustes de texto em `UC12` FA2/FE2 para curadoria via API, `RN03e` marcos por seed, redação da `RN08` para `confirmadoSemAlergenos`, nota de `em preparo` local no modelo conceitual e exemplos `lactose`/`trigo_centeio_cevada_aveia`).
- [ ] **F2-02 (Higiene dos ADRs — Lote 2):** Aplicar notas de detalhamento da 2.6 nos ADRs `005` a `014`, resolver marcadores `[CONFIRMAR]` de licenças (`R10`, `ADR-010`, `ADR-012`), confirmar `R18` e `R19` com a dupla e revisar lista da RDC 727/2022.
- [ ] **F2-03 (Validação de Contratos — DoD 2.6):** Executar lint formal do [`docs/fase2/openapi.yaml`](./docs/fase2/openapi.yaml) e validar a coleção Bruno [`docs/fase2/bruno/panelada-curadoria/`](./docs/fase2/bruno/panelada-curadoria/).
- [ ] **F2-04 (Etapa 2.8 — Revisão Arquitetural):** Executar revisão crítica ("advogado do diabo") contra cenários de escala, queda da fonte do catálogo, offline, alérgenos incompletos e LGPD, produzindo `docs/fase2/revisao-arquitetural.md`.
- [ ] **F2-05 (Etapa 2.9 — Fechamento da Fase 2):** Produzir `docs/fase2/checklist-final.md` e `docs/fase2/resumo-fase2-para-fase3.md`.

### Frente C — Modelagem do Framework de Gamificação
- [ ] **GAM-01:** Selecionar e aplicar o framework conceitual de gamificação (ex.: **Octalysis** ou **6D**) ao domínio do Panelada.
- [ ] **GAM-02:** Retroalimentar artefatos da Fase 1 (RNs, US, Léxico) e estender declarativamente os tipos de marco/regras do módulo `progress` (`UnlockCalculator` / `UnlockRules`) e seus vetores JSON.

### Frente D — Implementação do MVP e Primeiro Deploy (Fase 3)
- [ ] **MVP-01:** Definir o recorte funcional prioritário de histórias/telas para o primeiro deploy (Estágio 1).
- [ ] **MVP-02:** Configurar o esqueleto do monorepo (`package.json` workspaces, TypeScript, `eslint-plugin-boundaries` com prova de falha intencional das regras `S1..S8` e `A1..A8`).
- [ ] **MVP-03:** Implementar `packages/allergen-rules` com TDD e 100% dos vetores de teste (`A06`).
- [ ] **MVP-04:** Implementar fatia vertical do Estágio 1 na `apps/api` + `apps/mobile` e realizar o primeiro deploy em Cloud Gratuita (Supabase PostgreSQL/Storage + PaaS container).

---

## 4. Handoff da Última Sessão

- **Data e Agente:** `18/11/2026` — Antigravity CLI (papel: Arquiteto de Software e Governança Multi-Agente).
- **O que foi feito:**
  1. Reorganização física completa de `/docs/fase2/` (`Opção 1B`), alinhando todos os arquivos aos destinos canônicos declarados nos cabeçalhos (`/docs/fase2/*.md`, `/docs/fase2/adr/` e `/docs/fase2/bruno/`).
  2. Implantação do sistema de governança para agentes CLI: criação de `AGENTS.md`, `CLAUDE.md`, `STATE.md`, três manuais operacionais em `docs/playbooks/` (`01`, `02`, `03`) e atualização completa do `README.md`.
  3. Registro das decisões arquiteturais de preparação para o MVP e Gamificação (`Opções 2A, 3C e 4C`) nos ADRs (`002`, `004`, `008`, `012`), `c4-containers.md`, `padroes-de-projeto.md`, `diagrama-classes.md`, `briefing-fase2.md` (v1.5) e `diario_de_bordo-fase2.md`.
- **Decisões tomadas:**
  - Monorepo mantido; caminhos de `docs/fase2/` achatados com subpastas apenas para `adr/` e `bruno/`.
  - Gamificação reconhecida como framework conceitual/metodológico (6D/Octalysis) a ser modelado em conversa futura, tendo `UnlockCalculator`/`UnlockRules` como ponto de extensão isolado (`2A`).
  - Offline-First dividido em 2 estágios plugáveis via porta `OperationEnqueuer` (`DirectOnlineOperationEnqueuer` no Estágio 1 com leitura SQLCipher offline -> `OutboxOperationEnqueuer` no Estágio 2) (`3C`).
  - Deploy real em nuvem gratuita via Supabase (PostgreSQL + Storage por trás da API Fastify, mantendo cifra `AES-256-GCM` na aplicação) + PaaS container gratuita, em paridade com o Docker Compose local via porta `PhotoStorage` (`4C`).
- **Arquivos criados/alterados:** `AGENTS.md`, `CLAUDE.md`, `STATE.md`, `README.md`, `docs/playbooks/01..03-*.md`, `docs/superpowers/specs/2026-11-18-governance-and-architecture-refactoring-design.md`, `docs/superpowers/plans/2026-11-18-governance-and-architecture-refactoring.md` e artefatos movidos/atualizados em `docs/fase2/`.
- **Próximo passo recomendado:** Definir em nova conversa uma das três frentes imediatas do backlog: (a) **GOV-04** (criação das skills/workflows de Issues), (b) **GAM-01** (modelagem do framework conceitual de gamificação) ou (c) **F2-01 a F2-05** (fechamento das etapas 2.8 e 2.9 da Fase 2).
