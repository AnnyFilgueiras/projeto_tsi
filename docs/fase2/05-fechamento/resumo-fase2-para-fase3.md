# Resumo da Fase 2 para a Fase 3 (MVP) e Roteiro de Slides — Panelada (Etapa 2.9)

> **Fase 2.9 — Fechamento da Fase 2 e Handoff para Implementação.** Papel da IA: revisor e consolidador.
> **Destino:** `/docs/fase2/05-fechamento/resumo-fase2-para-fase3.md`. Versão 1.0 — `20/11/2026`.
> **Público-alvo:** Dupla de desenvolvimento (execução da Fase 3 / MVP), agentes de IA que atuarão no código (via `AGENTS.md` + `STATE.md`) e base direta para os slides de apresentação da Fase 2 exigidos pelo professor.

---

## 1. Síntese Executiva da Arquitetura Fechada

O **Panelada** foi projetado para equilibrar **segurança de saúde (`A06`)**, **privacidade legal (`A05` — LGPD)**, **uso real na cozinha sem internet (`A04`/`A08`)**, **gamificação motivacional não punitiva (`ADR-016`)** e **entrega viável em 1,5 mês com custo de infraestrutura zero**.

| Dimensão | Decisão fechada | ADRs de referência |
|---|---|---|
| **Estilo do Sistema** | **Offline-first parcial com sincronização** (receitas planejadas, em preparo e preparadas offline; sugestões, busca e candidatas online) | `ADR-001`, `ADR-008` |
| **Estratégia Incremental de Offline** | **2 Estágios plugáveis via `OperationEnqueuer` (`P04`)**: Estágio 1 (leitura offline no SQLCipher + escrita online via `DirectOnlineOperationEnqueuer`); Estágio 2 (Outbox completo + `Synchronizer` + `ProcessedOperation` sem alterar telas/casos de uso) | `ADR-008` (Opção 3C) |
| **Servidor (`apps/api`)** | **Monólito Modular** em **Node.js + Fastify + TypeScript** (5 módulos de domínio + 3 transversais + 2 apoio + `src/shared/`), fronteiras fiscalizadas por `eslint-plugin-boundaries` (`S1`–`S8`) | `ADR-002`, `ADR-015` |
| **App Móvel (`apps/mobile`)** | **React Native + TypeScript (Expo *development build*)**, organizado em *feature-first* (`A1`–`A8`), demo em emulador Android (4 GB RAM) | `ADR-003`, `ADR-005` |
| **Segurança e LGPD (`A05`)** | Restrição alimentar cifrada em repouso no aparelho (**SQLCipher** + chave via `expo-secure-store`, fora do backup do Android) e no servidor (**AES-256-GCM** na aplicação, chave fora do banco, `accountId` como AAD); 0 restrições em logs (`A13`); exclusão completa de conta (`DELETE /v1/account`) | `ADR-005`, `ADR-006`, `ADR-007` |
| **Regra de Alérgenos (`A06`)** | **Pacote TypeScript puro compartilhado** (`packages/allergen-rules`) com pontos de entrada `rules` e `invariants`, **19 códigos** (18 da **ANVISA RDC nº 727/2022 Anexo III** conferida + `lactose`), fail-closed (`RN08`, `RN22`) e vetores JSON comuns | `ADR-014` |
| **Catálogo e IA (`A09`)** | **Curadoria via endpoints de API + coleção Bruno** (33 requisições validadas, sem tela admin na v1). Fluxo manual principal + fluxo assistido opcional por **Kimi K3** atrás da porta `AiProvider` (`P02b`, com `RecordedProvider` para demo/testes), teto rígido de **R$ 20**, aprovação humana obrigatória (`RN21`) | `ADR-010`, `ADR-011`, `ADR-012`, `ADR-013` |
| **Gamificação (`ADR-016`)** | **Framework Híbrido 6D (Werbach & Hunter) + Octalysis (Yu-kai Chou)**, 100% *White Hat* não punitivo (`RNF09`), 8 tipos declarativos de marco (`RN03 a–h`) isolados em `UnlockCalculator` (App) e `UnlockRules` (API, módulo `progress`), 0 novas tabelas (`A12`) | `ADR-016`, `framework-gamificacao.md` |
| **Implantação e Paridade** | **Docker Compose local** (`api` + `postgres` + `LocalDiskPhotoStorage`) com paridade 100% para **Cloud Gratuita (Opção 4C)**: **Supabase** estritamente como PostgreSQL + Object Storage (`SupabasePhotoStorage`, sem SDK BaaS no cliente) + **PaaS gratuita de container** para a API Fastify | `ADR-004`, `ADR-012` |
| **Contratos e Idioma** | **OpenAPI 3.1** (`openapi.yaml` v1.2.0-2.8, 35 operações, validado pelo Redocly CLI com 0 erros). Código, rotas e commits em **inglês**; documentação, issues, PRs e UI em **português (Brasil)** (exceção: os 19 códigos ANVISA) | `ADR-015` |

---

## 2. Topologia do Monorepo para a Fase 3

```text
projeto_tsi/
├── docs/                          # Fase 1 (baseline + Issues #30/#32), Fase 2 (fechada) e playbooks
├── packages/
│   └── allergen-rules/            # Pacote TS 100% puro (ADR-014): rules + invariants + vetores JSON
├── apps/
│   ├── api/                       # Monólito Modular Fastify + TS (ADR-002)
│   │   └── src/
│   │       ├── modules/           # catalog, profile, routine, progress, importer (cada um: public/ + internal/)
│   │       ├── cross-cutting/     # identity, sync, suggestion-search
│   │       ├── support/           # field-encryption, technical-log
│   │       ├── shared/            # Tx (opaco) e OperationApplier
│   │       ├── app.ts             # Raiz de composição (registra aplicadores e adaptadores)
│   │       └── main.ts            # Bootstrap HTTP
│   └── mobile/                    # React Native + Expo dev build (ADR-003)
│       └── src/
│           ├── features/          # suggestions, pantry, recipe, routine, profile, progress, reminders
│           ├── core/              # local-db (SqlCipher), network, sync, photos
│           ├── shared/            # componentes UI e tipos puros
│           └── app/composition/   # Raiz de composição única (regra A8 — Estágio 1 → Estágio 2)
└── docker-compose.yml             # Paridade local: api + postgres + volume de fotos
```

---

## 3. Roteiro Recomendado de Execução da Fase 3 (Frente D — `MVP-01` a `MVP-04`)

### Etapa 1 — Recorte Funcional do Primeiro Deploy (`MVP-01`)
Definir o conjunto mínimo demonstrável de ponta a ponta (Estágio 1 do `ADR-008`):
1. **Fluxo Curador (API + Bruno):** seed de curador + ~20 pratos verificados (cobrindo 5 continentes e ao menos 1 cadeia de evolução com 3 níveis para exercitar os 8 marcos do `ADR-016`), executando a coleção `docs/fase2/04-contratos/bruno/panelada-curadoria/` com 100% de aprovação (manual + assistido via `KimiProvider`/`RecordedProvider`).
2. **Fluxo Cozinheiro/Jogador (App + API):** conta anônima (`A02`) → cadastro de restrição com consentimento (`A05`/`A06`) → sugestões filtradas (`US01`/`US02`) → visualização da receita baixada offline no SQLCipher com passo a passo e substituições seguras (`US05`/`US10`) → avaliação e desbloqueio de coleção, evolução e badges 6D + Octalysis (`US12`/`US14`/`US15`/`US16`).
3. **Rotina e Lembretes:** plano semanal/quinzenal, lista de compras consolidada e agendador local de lembretes $\le 2$/dia (`US06`/`US07`/`US08`).

### Etapa 2 — Fundação do Monorepo e Guardrails (`MVP-02`)
1. Configurar workspaces (`npm`/`pnpm`), `tsconfig.base.json`, Vitest/Jest e CI no GitHub Actions.
2. Configurar `eslint-plugin-boundaries` + `import/no-cycle` com as 16 regras (`S1`–`S8` e `A1`–`A8`) e executar a **prova obrigatória de falha intencional** (Playbook 03).
3. Subir `docker-compose.yml` com `api` + `postgres` + migrations iniciais (tabelas prefixadas por módulo conforme mitigação de `R19`).

### Etapa 3 — Núcleo Puro com TDD Estrito (`MVP-03`)
Implementar **test-first** (vetores JSON primeiro → RED → GREEN → REFACTOR):
1. `packages/allergen-rules` (`classifyRecipe`, `filterCandidates`, `isSubstituteAllowed`, `checkInvariants`) — **0 violações em 100% dos vetores (`A06`)**.
2. `UnlockRules` (API) e `UnlockCalculator` (App) sobre a suíte única de vetores JSON cobrindo todos os 8 tipos de marco (`RN03 a–h`, `ADR-016`, mitigando `R18`).
3. `FieldCipher` (AES-256-GCM com testes de IV único, adulteração e AAD — `A05`), `ReminderScheduler` ($\le 2$/dia — `A07`) e `PublicationGate` (`A09`).

### Etapa 4 — Fatia Vertical (Estágio 1), Medições `(H)` e Deploy Cloud (`MVP-04`)
1. Implementar módulos da API aderentes ao `openapi.yaml` v1.2.0-2.8 e validar a coleção Bruno contra a API real rodando no Docker Compose.
2. Implementar o app mobile com `SqlCipherDatabase` (leitura offline) e `DirectOnlineOperationEnqueuer` (Estágio 1).
3. Medir as hipóteses críticas no emulador de referência (abertura SQLCipher $\le 2\text{ s}$; 3–5 receitas no Kimi K3 dentro do teto de R$ 20; inspeção binária do arquivo SQLite e do dump Postgres comprovando 0 restrições em texto claro).
4. Realizar o primeiro deploy real na **Opção 4C** (Supabase PostgreSQL + Supabase Storage atrás da porta `PhotoStorage` + API Fastify em PaaS gratuita de container).
5. **Estágio 2 (pós-primeiro deploy):** plugar `OutboxOperationEnqueuer` + `Synchronizer` na raiz de composição e executar o teste de 100 ciclos de queda e reenvio (`A08`), respeitando o gatilho de 10 dias corridos (`R4`).

---

## 4. Roteiro-Base para os Slides de Apresentação da Fase 2 (Entrega do Professor)

O `briefing-fase2.md` (§1) prevê um conjunto curto de slides após a 2.9 cobrindo **processo, escolhas técnicas e diagramas**. Sugestão enxuta de **10 slides**:

| Slide | Título | Conteúdo-chave e diagrama fonte |
|---|---|---|
| **1** | Capa e Visão do Produto | Panelada: culinária internacional gamificada; dupla, disciplina e recorte do MVP (12 US Must, 4 Should; 1,5 mês; custo zero) |
| **2** | Processo Assistido por IA (2.1 a 2.9) | Evolução iterativa documentada no Diário de Bordo, governança multi-agente (`AGENTS.md`/`STATE.md`), retroalimentação controlada para a Fase 1 (Issues #30 e #32) |
| **3** | Atributos de Qualidade e Trade-offs (`2.1`) | Priorização: Críticos (`A06` Alérgenos, `A05` LGPD, `A08` Integridade/Sync, `A04` Offline) e conflitos principais (`A04 × A06`, `A05 × A04`, `A13 × A05`) |
| **4** | Estilo e Proposta Escolhida (`2.2`–`2.3`) | Offline-first parcial + Monólito Modular (`P1` vencendo `P2` Supabase e `P3` Flutter nos 4 cenários de sensibilidade); por que não microsserviços nem BaaS direto |
| **5** | Arquitetura em C4 — Contexto e Containers (`2.5`) | Diagramas de `c4-contexto.md` e `c4-containers.md` (App + SQLCipher, API Fastify, Postgres, Fotos, Bruno e Kimi K3) + paridade Docker Local × Cloud Gratuita (Opção 4C) |
| **6** | Arquitetura Interna e Fronteiras (`2.5`–`2.7`) | Diagramas de `c4-componentes.md` + regras `S1`–`S8` e `A1`–`A8` (`eslint-plugin-boundaries`) + padrões mantidos (`P01`–`P06`, `T01`) e removidos (`R01`–`R03`) |
| **7** | Segurança Alimentar (`A06`) e LGPD (`A05`) | Pacote compartilhado `allergen-rules` (19 códigos ANVISA RDC 727/2022 + `lactose`, fail-closed) + defesa em profundidade (SQLCipher + AES-256-GCM + AAD + 0 logs) |
| **8** | Agente de IA na Curadoria (`ADR-010`/`011`) | Fluxo `sequencia-uc12.md`: IA assistente opcional (Kimi K3 via porta `AiProvider` + `RecordedProvider`), teto de R$ 20, 0 dados de usuário, `PublicationGate` + aprovação humana |
| **9** | Gamificação Metodológica (`ADR-016`) | Framework Híbrido **6D + Octalysis** (*White Hat* não punitivo), pirâmide DMC e 8 marcos declarativos (`RN03 a–h`) isolados no módulo `progress` (`A12`) |
| **10** | Contratos, Revisão Cética (`2.8`) e Próximos Passos (`Fase 3`) | OpenAPI 3.1 validado (Redocly CLI 0 erros) + Bruno (33 reqs); principais achados da revisão adversarial (`R1`–`R21`) e estratégia de MVP em 2 estágios (`ADR-008`) |
