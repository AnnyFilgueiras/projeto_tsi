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
  - ✅ **Frente Transversal — Gamificação Metodológica:** Concluída na branch `feat/gamification-framework-6d-octalysis` ([`framework-gamificacao.md`](./docs/fase2/framework-gamificacao.md) e [ADR-016](./docs/fase2/adr/adr-016-framework-conceitual-gamificacao.md)), aplicando o framework híbrido **6D (Werbach & Hunter) + Octalysis (Yu-kai Chou)** e expandindo declarativamente `RN03` e `UnlockCalculator`/`UnlockRules` para 8 tipos de marco sem novas tabelas (`A12`).
  - ⏳ **Fase 3 (Implementação do MVP e Deploy em Cloud Gratuita):** Topologia do monorepo e estratégia incremental de 2 estágios definidas e documentadas nos ADRs.

---

## 2. Diretrizes Estratégicas Vigentes (Governança, Arquitetura, MVP e Deploy)

Qualquer agente que trabalhe em documentação ou código deve respeitar estas 4 decisões estruturais aprovadas pela dupla em `18/11/2026` (Design Doc em [`./docs/superpowers/specs/2026-11-18-governance-and-architecture-refactoring-design.md`](./docs/superpowers/specs/2026-11-18-governance-and-architecture-refactoring-design.md)):

1. **Topologia Monorepo + Governança Baseada em Repositório (`Opção 1B`):**
   - Único repositório contendo `docs/`, e futuramente `packages/allergen-rules/`, `apps/api/` e `apps/mobile/`.
   - Caminhos físicos de [`./docs/fase2/`](./docs/fase2/) batem 100% com os cabeçalhos dos artefatos (`/docs/fase2/*.md`, `/docs/fase2/adr/` e `/docs/fase2/bruno/`).
   - Controle de tarefas centrado em **GitHub Issues** espelhadas neste `STATE.md`, guiado pelos manuais em [`./docs/playbooks/`](./docs/playbooks/).
2. **Ponto de Extensão Isolado e Modelagem 6D + Octalysis de Gamificação (`Opção 2A` — [ADR-016](./docs/fase2/adr/adr-016-framework-conceitual-gamificacao.md) e [`framework-gamificacao.md`](./docs/fase2/framework-gamificacao.md)):**
   - O "framework de gamificação" exigido na disciplina foi modelado com a abordagem híbrida **6D Framework (Werbach & Hunter) + Octalysis (Yu-kai Chou)**.
   - Tecnicamente, toda regra de progresso/recompensa permanece isolada nas funções puras `UnlockCalculator` (App) e `UnlockRules` (API, módulo `progress`), orientadas às 8 definições declarativas de marcos (`Milestone` na `RN03 a–h`: `dish`, `cuisine`, `n_cuisines`, `all_continents`, `set`, `total_dishes`, `evolution_level`, `adaptation_count`) e testadas por vetores JSON comuns, sem vazar para outros módulos (`A12`).
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
- [x] **GAM-01:** Selecionar e aplicar o framework conceitual de gamificação (**Abordagem Híbrida 6D + Octalysis**) ao domínio do Panelada ([`docs/fase2/framework-gamificacao.md`](./docs/fase2/framework-gamificacao.md) e [ADR-016](./docs/fase2/adr/adr-016-framework-conceitual-gamificacao.md)).
- [x] **GAM-02:** Retroalimentar artefatos da Fase 1 (`RN03 a–h`, `US16`, Léxico, Documento Consolidado e Matriz de Rastreabilidade) e estender declarativamente os 8 tipos de marco do módulo `progress` (`UnlockCalculator` / `UnlockRules` / schema `Milestone` no `openapi.yaml`).

### Frente D — Implementação do MVP e Primeiro Deploy (Fase 3)
- [ ] **MVP-01:** Definir o recorte funcional prioritário de histórias/telas para o primeiro deploy (Estágio 1).
- [ ] **MVP-02:** Configurar o esqueleto do monorepo (`package.json` workspaces, TypeScript, `eslint-plugin-boundaries` com prova de falha intencional das regras `S1..S8` e `A1..A8`).
- [ ] **MVP-03:** Implementar `packages/allergen-rules` com TDD e 100% dos vetores de teste (`A06`).
- [ ] **MVP-04:** Implementar fatia vertical do Estágio 1 na `apps/api` + `apps/mobile` e realizar o primeiro deploy em Cloud Gratuita (Supabase PostgreSQL/Storage + PaaS container).

---

## 4. Handoff da Última Sessão

- **Data e Agente:** `18/11/2026` — Antigravity CLI (papel: Arquiteto de Software e Designer de Gamificação).
- **Branch de Trabalho:** `feat/gamification-framework-6d-octalysis`
- **O que foi feito:**
  1. Levantamento e comparação de 5 frameworks conceituais de gamificação (*6D*, *Octalysis*, *MDA*, *Hexad* e *SDT*), com escolha e aplicação completa da **Abordagem Híbrida 6D (Werbach & Hunter) + Octalysis (Yu-kai Chou)** em [`docs/fase2/framework-gamificacao.md`](./docs/fase2/framework-gamificacao.md) e formalização no [`ADR-016`](./docs/fase2/adr/adr-016-framework-conceitual-gamificacao.md).
  2. Adoção do **Nível 2 de intervenção arquitetural**: expansão declarativa da `RN03` e da união discriminada `Milestone` de 5 para **8 tipos de marco** (`dish`, `cuisine`, `n_cuisines`, `all_continents`, `set`, `total_dishes`, `evolution_level`, `adaptation_count`), cobrindo *Onboarding/Consistência* (6D/CD2), *Maestria em Cadeia de Evolução* (6D/CD2) e *Expressão Criativa* (CD3) usando dados já existentes em `Rating` e `Dish` (zero novas tabelas, mantendo `A12`).
  3. Retroalimentação sincronizada nos artefatos da Fase 2 (`openapi.yaml`, `glossario-identificadores.md`, `diagrama-classes.md`, `padroes-de-projeto.md`, `sequencia-uc10.md`, `diario_de_bordo-fase2.md`) e da Fase 1 (`regras-de-negocio.md`, `backlog.md`, `lexico.md`, `documento-de-requisitos.md`, `matriz-rastreabilidade.md`).
- **Decisões tomadas:**
  - **6D + Octalysis (`ADR-016`):** 6D estrutura a engenharia (D1 a D6, *Engagement Loop*, *Progression Stair* e Pirâmide DMC) e Octalysis fundamenta a psicologia motivacional (8 Core Drives e design *White Hat* não punitivo para `RNF09`, `RN04`, `RN12` e `RN20`).
  - **8 tipos fixos de marco em `UnlockCalculator` / `UnlockRules` (`R03`):** mantido o `switch` exaustivo com checagem `never` e validação por suíte compartilhada de vetores JSON.
- **Arquivos criados/alterados:** `docs/fase2/framework-gamificacao.md`, `docs/fase2/adr/adr-016-framework-conceitual-gamificacao.md`, `docs/fase2/openapi.yaml`, `docs/fase2/glossario-identificadores.md`, `docs/fase2/diagrama-classes.md`, `docs/fase2/padroes-de-projeto.md`, `docs/fase2/sequencia-uc10.md`, `docs/fase2/diario_de_bordo-fase2.md`, `docs/fase1/1.2-analise/regras-de-negocio.md`, `docs/fase1/1.1-elicitacao/backlog.md`, `docs/fase1/1.1-elicitacao/lexico.md`, `docs/fase1/1.3-documentacao/documento-de-requisitos.md`, `docs/fase1/1.4-validacao/matriz-rastreabilidade.md`, `AGENTS.md`, `README.md` e `STATE.md`.
- **Próximo passo recomendado:** Revisar e fazer merge da branch `feat/gamification-framework-6d-octalysis` na `main` (ou abrir PR/Issue correspondente) e seguir para (a) **GOV-04** (criação das skills/workflows de Issues) ou (b) **F2-01 a F2-05** (fechamento das etapas 2.8 e 2.9 da Fase 2).
