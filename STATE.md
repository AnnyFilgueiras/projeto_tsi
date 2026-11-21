# STATE.md — Painel Vivo de Estado, Tarefas e Handoff (Panelada)

> **Instrução para Agentes de IA:** Leia este arquivo no início de toda sessão (junto com o [`./AGENTS.md`](./AGENTS.md)) e **atualize-o obrigatoriamente ao final da sessão** antes de encerrar. Ele substitui os antigos "briefings de passagem" manuais e mantém qualquer agente ou nova thread situado em segundos.

---

## 1. Panorama Atual do Projeto

- **Fase Acadêmica Atual:** **Fase 2 — Projeto Arquitetural (CONCLUÍDA — Etapas `2.1` a `2.9` + Gamificação 6D + Octalysis)**; pronta para transição para a **Fase 3 — Implementação do MVP e Deploy em Cloud Gratuita**.
- **Branch de Referência:** `docs/fase2-closing-frente-b` (construída sobre `feat/gamification-framework-6d-octalysis`, pronta para merge na `main`; baseline da Fase 1 na tag `backlog-validado-v1.0`).
- **Última Atualização:** `20/11/2026`
- **Status Geral das Fases:**
  - ✅ **Fase 1 (Engenharia de Requisitos):** Concluída (`1.1` Elicitação, `1.2` Análise, `1.3` Documentação, `1.4` Validação). Retroalimentações aplicadas e sincronizadas: Lote 1 (Issue #30), Gamificação 6D + Octalysis (`ADR-016`) e Lote 3 (Issue #31 — [`issue-31-lote-3.md`](./docs/fase2/05-fechamento/issue-31-lote-3.md)).
  - ✅ **Fase 2 (Projeto Arquitetural):** Concluída integralmente (`2.1` a `2.9`) em [`./docs/fase2/`](./docs/fase2/), com higiene do Lote 2 aplicada, ANVISA RDC 727/2022 conferida oficialmente, `openapi.yaml` v1.2.0-2.8 validado pelo `@redocly/cli lint` (0 erros), coleção Bruno (33 requisições + fixture) validada, revisão adversarial (`2.8` — [`revisao-arquitetural.md`](./docs/fase2/05-fechamento/revisao-arquitetural.md)) e fechamento (`2.9` — [`checklist-final.md`](./docs/fase2/05-fechamento/checklist-final.md) e [`resumo-fase2-para-fase3.md`](./docs/fase2/05-fechamento/resumo-fase2-para-fase3.md)).
  - ✅ **Frente Transversal — Gamificação Metodológica:** Concluída ([`framework-gamificacao.md`](./docs/fase2/03-modelagem/framework-gamificacao.md) e [ADR-016](./docs/fase2/02-adr/adr-016-framework-conceitual-gamificacao.md)), aplicando o framework híbrido **6D (Werbach & Hunter) + Octalysis (Yu-kai Chou)** e expandindo declarativamente `RN03` e `UnlockCalculator`/`UnlockRules` para 8 tipos de marco sem novas tabelas (`A12`).
  - ⏳ **Fase 3 (Implementação do MVP e Deploy em Cloud Gratuita):** Pronta para início (`MVP-01` a `MVP-04`) com topologia de monorepo e estratégia incremental de 2 estágios definidas e auditadas.

---

## 2. Diretrizes Estratégicas Vigentes (Governança, Arquitetura, MVP e Deploy)

Qualquer agente que trabalhe em documentação ou código deve respeitar estas 4 decisões estruturais aprovadas pela dupla em `18/11/2026` (Design Doc em [`./docs/superpowers/specs/2026-11-18-governance-and-architecture-refactoring-design.md`](./docs/superpowers/specs/2026-11-18-governance-and-architecture-refactoring-design.md)):

1. **Topologia Monorepo + Governança Baseada em Repositório (`Opção 1B`):**
   - Único repositório contendo `docs/`, e futuramente `packages/allergen-rules/`, `apps/api/` e `apps/mobile/`.
   - Caminhos físicos de [`./docs/fase2/`](./docs/fase2/) organizados em 5 blocos lógicos (`01-fundamentos/`, `02-adr/`, `03-modelagem/`, `04-contratos/`, `05-fechamento/`) + `briefing-fase2.md` e `diario_de_bordo-fase2.md` na raiz, batendo 100% com os cabeçalhos `> Destino:` dos artefatos.
   - Controle de tarefas centrado em **GitHub Issues** espelhadas neste `STATE.md`, guiado pelos manuais em [`./docs/playbooks/`](./docs/playbooks/).
2. **Ponto de Extensão Isolado e Modelagem 6D + Octalysis de Gamificação (`Opção 2A` — [ADR-016](./docs/fase2/02-adr/adr-016-framework-conceitual-gamificacao.md) e [`framework-gamificacao.md`](./docs/fase2/03-modelagem/framework-gamificacao.md)):**
   - O "framework de gamificação" exigido na disciplina foi modelado com a abordagem híbrida **6D Framework (Werbach & Hunter) + Octalysis (Yu-kai Chou)**.
   - Tecnicamente, toda regra de progresso/recompensa permanece isolada nas funções puras `UnlockCalculator` (App) e `UnlockRules` (API, módulo `progress`), orientadas às 8 definições declarativas de marcos (`Milestone` na `RN03 a–h`: `dish`, `cuisine`, `n_cuisines`, `all_continents`, `set`, `total_dishes`, `evolution_level`, `adaptation_count`) e testadas por vetores JSON comuns, sem vazar para outros módulos (`A12`).
3. **Implementação do Offline-First em 2 Estágios Reversíveis (`Opção 3C` — [ADR-008](./docs/fase2/02-adr/adr-008-estrategia-offline-e-sincronizacao.md)):**
   - **Estágio 1 (Primeiro Deploy do MVP):** O app já utiliza o banco local cifrado (`SqlCipherDatabase` atrás da porta `LocalDatabase` — `P02a`) para **leitura offline** das receitas planejadas/em preparo e checagem local de alérgenos (`A04`, `A05`, `A06`). Porém, **escritas/mutações** (avaliar prato, agendar rotina, editar restrição) exigem rede no Estágio 1. Para garantir transição sem retrabalho para o offline completo, os casos de uso chamam desde o início a porta `OperationEnqueuer` (`P04`), injetada na raiz de composição (`src/app/composition`) com o adaptador `DirectOnlineOperationEnqueuer`.
   - **Estágio 2 (Offline-First Completo):** Troca-se na raiz de composição o adaptador para `OutboxOperationEnqueuer` + `Synchronizer` e ativa-se a tabela `ProcessedOperation` (`Idempotent Receiver` — `P05`), sem alterar nenhuma tela ou caso de uso.
4. **Deploy Real em Cloud Gratuita com Paridade Local (`Opção 4C` — [ADR-004](./docs/fase2/02-adr/adr-004-demonstracao-docker-e-alvo.md) e [ADR-012](./docs/fase2/02-adr/adr-012-fotos.md)):**
   - **Nuvem Gratuita:** Utiliza **Supabase (Free Tier)** exclusivamente como **PostgreSQL gerenciado** e **Object Storage para fotos WebP** (atrás da porta `PhotoStorage` — `P02f`), **sem usar o SDK BaaS no cliente**. Todo o tráfego passa pelo container da `API Panelada` (Fastify) hospedado em PaaS gratuita (Render / Fly.io / Koyeb), garantindo que as restrições alimentares continuem cifradas em memória com `AES-256-GCM` ([ADR-006](./docs/fase2/02-adr/adr-006-criptografia-restricao-alimentar.md)) antes de persistir no banco.
   - **Paridade Local:** O `docker-compose.yml` local (`api` + `postgres` + volume de fotos via `LocalDiskPhotoStorage`) permanece 100% funcional para desenvolvimento e como fallback offline garantido para apresentação.

---

## 3. Quadro de Tarefas e Pendências (Backlog Ativo)

### Frente A — Governança e Automação de Fluxo
- [x] **GOV-01:** Reestruturar `/docs/fase2/` para bater com os cabeçalhos canônicos (`adr/`, `bruno/`, raiz `fase2/`).
- [x] **GOV-02:** Criar `AGENTS.md`, `CLAUDE.md`, `STATE.md`, `docs/playbooks/01..03` e atualizar `README.md`.
- [x] **GOV-03:** Registrar detalhamentos arquiteturais de MVP/Deploy/Gamificação (`2A`, `3C`, `4C`) em `ADR-002`, `ADR-004`, `ADR-008`, `ADR-012`, `c4-containers.md`, `padroes-de-projeto.md` e `diagrama-classes.md`.
- [ ] **GOV-04:** Criar workflows/skills dedicados para (1) geração automatizada de GitHub Issues a partir dos artefatos e (2) implementação guiada de Issues.

### Frente B — Fechamento e Higiene da Fase 2 (Etapas 2.6 a 2.9)
- [x] **F2-01 (Retroalimentação Fase 1 — Lote 3):** Especificação canônica da Issue #31 criada em [`docs/fase2/05-fechamento/issue-31-lote-3.md`](./docs/fase2/05-fechamento/issue-31-lote-3.md) e aplicada na Fase 1 (`UC08-FA2/FA3`, `UC12` FA2/FE2 via API, `RN03e` por seed, `RN05` nota `score` 0–10, `RN08` com `confirmadoSemAlergenos`, `RN09` + `RNF06` exclusão completa de conta, `RN16` typo, `modelo-conceitual.md` nota de `"em preparo"` local, `US09`/`CT01`/`CT17`/`CT19`/`CT30`, `documento-de-requisitos.md` e `matriz-rastreabilidade.md`).
- [x] **F2-02 (Higiene dos ADRs — Lote 2):** Padronizadas seções `Detalhamento` nos ADRs `005`–`014` (com identificadores `ADR-015`), removidos marcadores soltos de citação, fechados os `[CONFIRMAR]` de `ADR-010` e `ADR-012` (`R10`), confirmados `R18` e `R19` (`ADR-002`), conferida oficialmente a **ANVISA RDC nº 727/2022 (Anexo III)** (18/18 itens) e higienizados `atributos-qualidade.md`, `estilo-arquitetural.md`, `propostas-arquiteturais.md`, `briefing-fase2.md` v1.6, `diagrama-classes.md`, `sequencia-uc12.md` e `padroes-de-projeto.md`.
- [x] **F2-03 (Validação de Contratos — DoD 2.6):** Corrigido bug real em `Proposal.data` (criado `ProposalData` permitindo `allergenState = verified` em respostas), extraídos os 8 schemas nomeados de `Milestone` com `discriminator.mapping`, executado `@redocly/cli lint docs/fase2/openapi.yaml` (**0 erros**, 1 aviso intencional de `localhost`), adicionado fixture JPEG em `docs/fase2/04-contratos/bruno/panelada-curadoria/fixtures/dish-example.jpg` e validadas todas as 33 requisições Bruno (**0 erros**).
- [x] **F2-04 (Etapa 2.8 — Revisão Arquitetural):** Revisão adversarial ("advogado do diabo") concluída em [`docs/fase2/05-fechamento/revisao-arquitetural.md`](./docs/fase2/05-fechamento/revisao-arquitetural.md) (27 perguntas em 6 frentes, 5 defeitos concretos corrigidos e registro mestre consolidado de riscos `R1`–`R21`).
- [x] **F2-05 (Etapa 2.9 — Fechamento da Fase 2):** Publicados [`docs/fase2/05-fechamento/checklist-final.md`](./docs/fase2/05-fechamento/checklist-final.md) e [`docs/fase2/05-fechamento/resumo-fase2-para-fase3.md`](./docs/fase2/05-fechamento/resumo-fase2-para-fase3.md) (incluindo roteiro-base de 10 slides para apresentação da Fase 2).

### Frente C — Modelagem do Framework de Gamificação
- [x] **GAM-01:** Selecionar e aplicar o framework conceitual de gamificação (**Abordagem Híbrida 6D + Octalysis**) ao domínio do Panelada ([`docs/fase2/03-modelagem/framework-gamificacao.md`](./docs/fase2/03-modelagem/framework-gamificacao.md) e [ADR-016](./docs/fase2/02-adr/adr-016-framework-conceitual-gamificacao.md)).
- [x] **GAM-02:** Retroalimentar artefatos da Fase 1 (`RN03 a–h`, `US16`, Léxico, Documento Consolidado e Matriz de Rastreabilidade) e estender declarativamente os 8 tipos de marco do módulo `progress` (`UnlockCalculator` / `UnlockRules` / schema `Milestone` no `openapi.yaml`).

### Frente D — Implementação do MVP e Primeiro Deploy (Fase 3)
- [ ] **MVP-01:** Definir o recorte funcional prioritário de histórias/telas para o primeiro deploy (Estágio 1).
- [ ] **MVP-02:** Configurar o esqueleto do monorepo (`package.json` workspaces, TypeScript, `eslint-plugin-boundaries` com prova de falha intencional das regras `S1..S8` e `A1..A8`).
- [ ] **MVP-03:** Implementar `packages/allergen-rules` com TDD e 100% dos vetores de teste (`A06`).
- [ ] **MVP-04:** Implementar fatia vertical do Estágio 1 na `apps/api` + `apps/mobile` e realizar o primeiro deploy em Cloud Gratuita (Supabase PostgreSQL/Storage + PaaS container).

---

## 4. Handoff da Última Sessão

- **Data e Agente:** `20/11/2026` — Antigravity CLI (papel: Revisor Cético / Consolidador da Fase 2).
- **Branch de Trabalho:** `docs/fase2-closing-frente-b` (criada a partir de `feat/gamification-framework-6d-octalysis`).
- **O que foi feito:**
  1. **F2-01 (Issue #31 — Lote 3):** Criada a especificação canônica [`docs/fase2/05-fechamento/issue-31-lote-3.md`](./docs/fase2/05-fechamento/issue-31-lote-3.md) e aplicadas todas as retroalimentações na Fase 1 (curadoria via API em `UC12` FA2/FE2 e `CT30`, exclusão completa de conta em `RNF06`/`RN09`/`UC08-FA3`, `RN08` com `confirmadoSemAlergenos`, `RN05` com nota `score` 0–10, `"em preparo"` local no modelo conceitual, códigos canônicos `lactose`/`trigo_centeio_cevada_aveia` em `US09`/`CT01`/`CT17`/`CT19` e sincronização de `documento-de-requisitos.md` e `matriz-rastreabilidade.md`).
  2. **F2-02 e F2-03 (Higiene Lote 2 + Validação Formal de Contratos):** Confirmados pela dupla `R18`, `R19` e os `[CONFIRMAR]` de `ADR-010`/`ADR-012` (`R10`); conferida oficialmente a **ANVISA RDC nº 727/2022 (Anexo III)** (18/18 itens idênticos); removidos marcadores soltos e typos nos ADRs e artefatos da Fase 2; corrigido bug real em `openapi.yaml` (`ProposalData` permitindo `verified` em respostas) e eliminados 16 avisos do `@redocly/cli lint` (**0 erros**, 1 aviso intencional de `localhost`); adicionado fixture JPEG e auditadas todas as 33 requisições Bruno (**0 erros**).
  3. **F2-04 e F2-05 (Etapas 2.8 e 2.9):** Concluída a revisão adversarial em [`docs/fase2/05-fechamento/revisao-arquitetural.md`](./docs/fase2/05-fechamento/revisao-arquitetural.md) (27 perguntas em 6 frentes e tabela consolidada `R1`–`R21`), além do fechamento oficial em [`docs/fase2/05-fechamento/checklist-final.md`](./docs/fase2/05-fechamento/checklist-final.md) e [`docs/fase2/05-fechamento/resumo-fase2-para-fase3.md`](./docs/fase2/05-fechamento/resumo-fase2-para-fase3.md).
- **Decisões tomadas:**
  - Confirmação formal de `R18`, `R19` e política de direitos/licenças (`ADR-010` item 9 e `ADR-012` item 1), mantendo `R10` como risco aceito documentado.
  - Exclusão completa de conta formalizada em `RNF06`, `RN09` e `UC08-FA3` (LGPD art. 18, VI), sem criar nova US.
  - Novos riscos `R20` (erro humano de curadoria/contaminação cruzada) e `R21` (pausa de 7 dias no Supabase Free Tier + cold start na Opção 4C) registrados em `revisao-arquitetural.md`.
- **Arquivos criados/alterados:** `docs/fase2/05-fechamento/issue-31-lote-3.md`, `docs/fase2/05-fechamento/revisao-arquitetural.md`, `docs/fase2/05-fechamento/checklist-final.md`, `docs/fase2/05-fechamento/resumo-fase2-para-fase3.md`, `docs/fase2/04-contratos/openapi.yaml` (v1.2.0-2.8), `docs/fase2/04-contratos/bruno/panelada-curadoria/` (fixture JPEG + ajustes), `docs/fase2/02-adr/adr-{002,005,006,007,009,010,011,012,014}-*.md`, `docs/fase2/{atributos-qualidade,estilo-arquitetural,propostas-arquiteturais,briefing-fase2,diagrama-classes,sequencia-uc12,padroes-de-projeto,diario_de_bordo-fase2}.md`, `docs/fase1/` (8 arquivos da Issue #31), `AGENTS.md`, `README.md` e `STATE.md`.
- **Próximo passo recomendado:** Fazer PR/merge de `docs/fase2-closing-frente-b` na `main` (e registrar/fechar a Issue #31 no GitHub a partir de `docs/fase2/05-fechamento/issue-31-lote-3.md`), produzir os slides finais da Fase 2 usando o roteiro de [`resumo-fase2-para-fase3.md`](./docs/fase2/05-fechamento/resumo-fase2-para-fase3.md) (§4) e iniciar **GOV-04** ou **Frente D (`MVP-01` → `MVP-04`)**.
