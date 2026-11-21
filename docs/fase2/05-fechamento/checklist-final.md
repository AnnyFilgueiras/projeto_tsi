# Checklist Final da Fase 2 — Projeto Arquitetural (Panelada — Etapa 2.9)

> **Fase 2.9 — Fechamento da Fase 2.** Papel da IA: revisor e consolidador.
> **Destino:** `/docs/fase2/05-fechamento/checklist-final.md`. Versão 1.0 — `20/11/2026` — status: Fase 2 pronta para fechamento e transição para a Fase 3 (MVP).
> **Base:** `briefing-fase2.md` v1.6 (seção 7 — DoD 2.1 a 2.9), `revisao-arquitetural.md` v1.0, `ADR-001` a `ADR-016`, `openapi.yaml` v1.2.0-2.8 e `matriz-rastreabilidade.md`.

---

## 1. Checklist Consolidado do DoD da Etapa 2.9

| Critério (Briefing §7 — 2.9) | Status | Evidência objetiva no repositório |
|---|---|---|
| **1. Justificativa das decisões** | ✅ Aprovado | 16 ADRs versionados em `/docs/fase2/02-adr/` (`ADR-001` a `ADR-016`), todos contendo contexto, alternativas reais descartadas, consequências negativas honestas, riscos relacionados e gatilhos de revisão. Nenhum marcador `[CONFIRMAR]` em aberto. |
| **2. Simplicidade (sem over-engineering)** | ✅ Aprovado | Monólito modular em processo único (`ADR-002`); notificações locais sem servidor push (`ADR-009`); curadoria via API + Bruno sem tela admin (`ADR-010`); 3 padrões rejeitados por simplicidade (`R01` UoW → `T01` `Tx`; `R02` regras do `PublicationGate` → função; `R03` Strategy de marcos → `switch` exaustivo); varredura GoF rejeitando Singleton, Visitor, Observer, State, Decorator e Iterator (`padroes-de-projeto.md` §5.1); offline incremental em 2 estágios (`ADR-008` Opção 3C). |
| **3. Coerência com SOLID e fronteiras** | ✅ Aprovado | 12 ajustes de SOLID aplicados na 2.6 (`diagrama-classes.md` §13); 16 regras de fronteira automatizáveis via `eslint-plugin-boundaries` + `import/no-cycle` (`S1`–`S8` no servidor e `A1`–`A8` no app, `padroes-de-projeto.md` §6); limitação de SQL em string literal registrada e confirmada como `R19`. |
| **4. Consistência entre diagramas, ADRs e contratos** | ✅ Aprovado | Nomes consistentes nos C4 níveis 1–3 (`c4-contexto.md`, `c4-containers.md`, `c4-componentes.md`); mapeamento PT↔EN formalizado no `glossario-identificadores.md` (`ADR-015`); 13/13 classes conceituais rastreadas em `diagrama-classes.md`; 4 sequências críticas (`UC04`, `UC08`, `UC10`, `UC12`) coerentes com C4 e `Tx`; `openapi.yaml` v1.2.0-2.8 validado pelo `@redocly/cli lint` (**0 erros**, 1 aviso intencional de `localhost` da demo); 33 requisições Bruno + fixture JPEG validadas com **0 erros**; gamificação 6D + Octalysis sincronizada em 8 marcos (`ADR-016`, `framework-gamificacao.md`, `openapi.yaml`, `RN03 a–h`). |
| **5. Cobertura das US Must (e Should)** | ✅ Aprovado | **12/12 US Must** e **4/4 US Should** cobertas ponta a ponta (ver Seção 2 abaixo). **11/11 RNF** rastreados a cenários `A01`–`A13`, ADRs e contratos. Retroalimentação completa para a Fase 1 (Issues #30 e #32) sincronizada em `documento-de-requisitos.md` e `matriz-rastreabilidade.md`. |
| **6. Resumo para a Fase 3 pronto** | ✅ Aprovado | Publicado em [`resumo-fase2-para-fase3.md`](./resumo-fase2-para-fase3.md), contendo recorte arquitetural do monorepo, ordem de implementação (`MVP-01` a `MVP-04`), plano de validação de hipóteses `(H)` e roteiro-base dos slides da Fase 2. |

---

## 2. Matriz de Cobertura Funcional da Fase 2 (US Must + Should → Arquitetura)

| US | Prioridade | UC | Módulo API | Feature App | ADRs | Contrato OpenAPI (`openapi.yaml`) |
|---|---|---|---|---|---|---|
| **US01** | Must | UC01 | `suggestion-search` + `catalog` + `profile` + `progress` | `Sugestões` | 001, 002, 014 | `GET /v1/suggestions` |
| **US02** | Must | UC02 | `routine` (`RoutinePublic`) | `Sugestões` | 001, 002 | `POST /v1/suggestions/{suggestionId}/approve`, `.../discard` |
| **US03** | Must | UC03 | `profile` + `suggestion-search` | `Despensa` | 001, 008 | `PUT /v1/profile/pantry`, `GET /v1/suggestions` |
| **US05** | Must | UC04 | `catalog` | `Receita e Preparo` | 001, 005, 012, 014 | `GET /v1/recipes/{dishId}`, `GET /v1/photos/{hash}`, `GET /v1/sync/download-set` |
| **US06** | Must | UC05 | `routine` + `sync` | `Rotina e Lista de Compras` | 001, 005, 008 | `POST /v1/plans`, `POST /v1/plans/{planId}/items`, `POST /v1/sync/operations` |
| **US07** | Must | UC06 | `routine` + `sync` | `Rotina e Lista de Compras` | 008 | `POST /v1/plans/{planId}/shopping-list`, `POST /v1/sync/operations` |
| **US08** | Must | UC07 | `profile` (preferências) | `Lembretes` + `Perfil e Restrições` | 002, 008, 009 | `POST /v1/sync/operations` (`reminders.set`) |
| **US09** | Must | UC08 | `profile` + `field-encryption` + `identity` | `Perfil e Restrições` + `Pacote de Alérgenos` | 005, 006, 007, 008, 014 | `POST /v1/sync/operations` (`restriction.register`/`revoke`), `DELETE /v1/account` |
| **US10** | Must | UC09 | `catalog` + `importer` | `Receita e Preparo` + `Pacote de Alérgenos` | 010, 011, 014 | `GET /v1/recipes/{dishId}`, `POST /v1/curation/substitutions` |
| **US12** | Must | UC10 | `progress` + `sync` | `Avaliação e Coleção` | 001, 005, 008, 016 | `POST /v1/sync/operations` (`rating.register`) |
| **US14** | Must | UC11 | `progress` + `catalog` (índice leve) | `Avaliação e Coleção` | 001, 008, 016 | `GET /v1/sync/download-set` |
| **US18** | Must | UC12 | `importer` + `catalog` | *(Curador via Bruno — sem tela)* | 007, 010, 011, 012, 013, 014 | `POST /v1/curation/*`, `PATCH/GET/PUT /v1/curation/proposals/*` (14 rotas) |
| **US15** | Should | UC13 | `progress` (`UnlockRules`) + `catalog` | `Avaliação e Coleção` (`UnlockCalculator`) | 008, 016 | `POST /v1/sync/operations`, `GET /v1/sync/download-set` |
| **US04** | Should | — *(FA)* | `suggestion-search` | `Sugestões` / Busca | 001, 014 | `GET /v1/search` |
| **US11** | Should | — *(FA2 UC01)* | `profile` + `suggestion-search` | `Despensa` + `Receita e Preparo` | 001, 008 | `PUT /v1/profile/utensils`, `GET /v1/suggestions` |
| **US16** | Should | — *(UC10 p.4)* | `progress` (`UnlockRules`, 8 marcos) | `Avaliação e Coleção` (`UnlockCalculator`) | 002, 008, 016 | `Milestone` (`oneOf` 8 variantes), `BadgeDefinition`, `BadgeAward` |

---

## 3. Status por Sub-Etapa da Fase 2 (`2.1` a `2.9`)

| Sub-etapa | Artefato(s) canônico(s) | DoD atendido? |
|---|---|---|
| **2.1 Atributos de Qualidade** | [`atributos-qualidade.md`](../01-fundamentos/atributos-qualidade.md) v1.4 | ✅ Cenários `A01`–`A14` mensuráveis, priorizados, com conflitos e "prato concluído" conferido |
| **2.2 Estilo Arquitetural** | [`estilo-arquitetural.md`](../01-fundamentos/estilo-arquitetural.md) v1.1 | ✅ 4 estilos de sistema + 3 de servidor comparados; trade-offs e gatilhos registrados |
| **2.3 Propostas Arquiteturais** | [`propostas-arquiteturais.md`](../01-fundamentos/propostas-arquiteturais.md) v1.2 | ✅ 3 propostas (`P1`–`P3`) + sensibilidade; `P1` escolhida com agente de IA na curadoria |
| **2.4 ADRs** | [`adr/adr-001`](../02-adr/adr-001-estilo-sistema-offline-first.md) a [`adr-016`](../02-adr/adr-016-framework-conceitual-gamificacao.md) | ✅ 16 ADRs completos, sem `[CONFIRMAR]`, RDC 727/2022 conferida, `R18`/`R19`/`R10` confirmados |
| **2.5 Modelo C4** | [`c4-contexto.md`](../03-modelagem/c4-contexto.md), [`c4-containers.md`](../03-modelagem/c4-containers.md), [`c4-componentes.md`](../03-modelagem/c4-componentes.md) | ✅ Níveis 1 a 3 + 3 vistas de implantação (Demo, Alvo e Cloud Gratuita Opção 4C) |
| **2.6 Classes, Sequências e Contratos** | [`diagrama-classes.md`](../03-modelagem/diagrama-classes.md), `sequencia-uc04/08/10/12.md`, [`openapi.yaml`](../04-contratos/openapi.yaml) v1.2.0-2.8, [`bruno/panelada-curadoria/`](../04-contratos/bruno/panelada-curadoria/) | ✅ 13/13 classes rastreadas, 4 sequências, SOLID conferido, Redocly CLI **0 erros**, Bruno 33 requisições + fixture validados |
| **2.7 Padrões de Projeto** | [`padroes-de-projeto.md`](../03-modelagem/padroes-de-projeto.md) v1.2, [`glossario-identificadores.md`](../04-contratos/glossario-identificadores.md) | ✅ Padrões `P01`–`P06`, `T01`, removidos `R01`–`R03`, regras `S1`–`S8` e `A1`–`A8`, política de TDD |
| **Transversal — Gamificação** | [`framework-gamificacao.md`](../03-modelagem/framework-gamificacao.md) v1.0, [`adr-016`](../02-adr/adr-016-framework-conceitual-gamificacao.md) | ✅ Framework híbrido **6D + Octalysis**, 8 marcos `RN03 a–h`, 0 novas tabelas (`A12`) |
| **2.8 Revisão Arquitetural** | [`revisao-arquitetural.md`](./revisao-arquitetural.md) v1.0 | ✅ 27 perguntas críticas em 6 frentes, 5 defeitos reais corrigidos, riscos `R1`–`R21` consolidados |
| **2.9 Fechamento** | [`checklist-final.md`](./checklist-final.md) v1.0, [`resumo-fase2-para-fase3.md`](./resumo-fase2-para-fase3.md) v1.0 | ✅ Checklist aprovado e handoff executivo pronto para a Fase 3 |

---

## 4. Inventário de Hipóteses `(H)` a Validar Empiricamente na Fase 3

Nenhuma hipótese técnica não medida é tratada como fato; todas têm critério objetivo de validação na Fase 3:

| Prioridade | Hipótese `(H)` | Meta / Critério | ADR / Atributo | Plano B / Gatilho se falhar |
|---|---|---|---|---|
| **1 (Bloqueante)** | Abertura offline com `expo-sqlite` + SQLCipher no emulador de referência (Android, 4 GB RAM) | $\le 2{,}0\text{ s}$ em 30 aberturas com seed de 20 pratos | `A04`, `ADR-005` | Trocar para `op-sqlite` com SQLCipher (nunca remover criptografia) |
| **2 (Bloqueante)** | Consumo real de tokens e validação JSON Mode do Kimi K3 | Medir com 3–5 receitas em outro idioma; ficar dentro do teto de R$ 20 | `A09`, `ADR-011`, `ADR-013` | Testar `kimi-k2.6`, reduzir `reasoning_effort` ou usar fluxo manual |
| **3 (Estágio 2)** | Protótipo da fila offline e sincronização idempotente | $\le 10$ dias corridos; 0 perdas e 0 duplicações em 100 ciclos; início em $\le 60\text{ s}$ | `A08`, `ADR-008` | Permanecer no Estágio 1 para o MVP ou avaliar biblioteca de sync / Plano B (`P2`) |
| **4 (Qualidade)** | Salvar avaliação + calcular 8 marcos localmente | $\le 1{,}0\text{ s}$ no emulador | `A04`, `ADR-016` | Otimizar índices SQLite / cache em memória do `catalogIndex` |
| **5 (Armazenamento)** | Renderização WebP no *dev build* e peso do conjunto baixado (índice leve + 20 fotos) | Renderizar sem erro; download fluido em 4G simulada | `A04`, `ADR-012` | Reduzir largura máxima (< 1.024 px) ou usar JPEG |
| **6 (Deploy Cloud)** | Latência de `GET /v1/suggestions` e cold start na PaaS gratuita + Supabase (Opção 4C) | $\le 2{,}5\text{ s}$ em 95% (quente); `/v1/health` responsivo | `A01`, `A11`, `ADR-004` | Cache do catálogo em memória na API; fallback garantido no Docker Compose local |
| **7 (Segurança)** | Prova de configuração do `eslint-plugin-boundaries` + inspeção binária do SQLCipher e dump Postgres | Lint falha em import proibido intencional; 0 strings em claro no arquivo SQLite e no dump SQL | `A05`, `ADR-002`, `ADR-006` | Ajustar regras ESLint / corrigir abertura da chave SQLCipher antes de prosseguir |
| **8 (Usabilidade)** | Tempo até a primeira sugestão (`A02`) | $\le 2\text{ min}$ em teste com 5 pessoas | `A02`, `RNF02`, `ADR-007` | Simplificar onboarding (conta anônima já elimina formulário) |
