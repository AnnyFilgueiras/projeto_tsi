# AGENTS.md — Guia Mestre de Governança para Agentes de IA (Panelada)

> **Leitura obrigatória ao iniciar qualquer sessão.** Este documento orienta qualquer agente de IA (Antigravity CLI, Claude Code, Codex, Cursor, ou IAs web) sobre a arquitetura, as regras inegociáveis, a localização dos artefatos e o protocolo de trabalho no repositório do **Panelada**.

---

## 1. Visão Geral do Projeto

- **Produto:** **Panelada** — Aplicativo mobile de culinária internacional gamificada. Sugere pratos conforme perfil/despensa/restrições alimentares, organiza a rotina (planejamento, lista de compras e passo a passo offline na cozinha) e celebra cada prato concluído (avaliação salva) com mecânicas de jogo (coleção "Pokédex de pratos", cadeias de evolução e badges).
- **Contexto Acadêmico:** Disciplina de **Tópicos em Sistemas de Informação** (Ciência da Computação) — *IA generativa aplicada ao ciclo de vida de desenvolvimento de software*.
- **Dupla:** Anny Filgueiras ([@AnnyFilgueiras](https://github.com/AnnyFilgueiras)) e Gabryel Souza ([@gabryelsouzz](https://github.com/gabryelsouzz)).
- **Professor:** Patrick Henrique.
- **Evidência Acadêmica:** Todo o processo assistido por IA é auditado pelos **Diários de Bordo** ([Fase 1](./docs/fase1/diario_de_bordo-fase1.md) e [Fase 2](./docs/fase2/diario_de_bordo-fase2.md)) e pelas **GitHub Issues**.

---

## 2. Protocolo Obrigatório de Sessão (Início e Fim)

Todo agente deve seguir estritamente este ciclo de 4 passos em cada sessão/conversa:

### Ao Iniciar a Sessão
1. **Ler o Estado Vivo (`STATE.md`):** Abra [`./STATE.md`](./STATE.md) antes de qualquer outra ação. Ele contém a fase atual, as decisões estratégicas vigentes, o quadro de Issues/pendências e o **Handoff da Última Sessão**.
2. **Carregar Apenas o Contexto Necessário:** Consulte a **Seção 5 (Matriz de Leitura por Tipo de Tarefa)** abaixo para ler apenas os arquivos relevantes à sua tarefa. Não leia o repositório inteiro sem necessidade.
3. **Consultar o Playbook Operacional:** Abra o manual correspondente em [`./docs/playbooks/`](./docs/playbooks/):
   - Ciclo de sessão, GitHub Issues e Diário de Bordo: [`01-sessao-issues-e-diario.md`](./docs/playbooks/01-sessao-issues-e-diario.md)
   - Evolução de ADRs, C4 e Retroalimentação entre fases: [`02-arquitetura-adrs-e-retroalimentacao.md`](./docs/playbooks/02-arquitetura-adrs-e-retroalimentacao.md)
   - Qualidade, Fronteiras Modulares, OpenAPI/Bruno e TDD: [`03-qualidade-fronteiras-e-contratos.md`](./docs/playbooks/03-qualidade-fronteiras-e-contratos.md)

### Ao Encerrar a Sessão
4. **Handoff e Registro:**
   - Atualize [`./STATE.md`](./STATE.md) (marque itens concluídos e preencha o bloco **Handoff da Última Sessão**).
   - Se a sessão concluiu uma sub-etapa da disciplina ou alterou artefatos consolidados, adicione a entrada padronizada no diário da fase correspondente (ex.: [`./docs/fase2/diario_de_bordo-fase2.md`](./docs/fase2/diario_de_bordo-fase2.md)).
   - Faça commits atômicos com mensagens em **inglês** seguindo o [ADR-015](./docs/fase2/adr/adr-015-idioma-dos-identificadores.md).

---

## 3. Regras de Ouro e Precedência Documental

1. **Ordem de Precedência (em caso de divergência entre documentos):**
   $$\text{Artefatos Aprovados da Fase} > \text{ADRs (com notas de Detalhamento)} > \text{STATE.md} > \text{briefing-fase2.md}$$
2. **Convenção Bilíngue ([ADR-015](./docs/fase2/adr/adr-015-idioma-dos-identificadores.md)):**
   - **Português (Brasil):** Documentação (`docs/`, `README.md`, `STATE.md`), títulos e corpos de Pull Requests, GitHub Issues, Diários de Bordo e textos de interface do usuário (UI). Diagramas C4 (níveis 1 a 3) mantêm nomes em português.
   - **Inglês:** Identificadores de código (classes, funções, variáveis, tipos, tabelas), nomes de arquivos e pastas de código (`apps/`, `packages/`), comentários no código, rotas/campos/enums do [`openapi.yaml`](./docs/fase2/openapi.yaml), coleção Bruno e mensagens de commit (`feat:`, `fix:`, `docs:`, `refactor:`). Equivalências canônicas estão no [Glossário de Identificadores](./docs/fase2/glossario-identificadores.md).
   - **Exceção:** Os 19 códigos de alérgenos do vocabulário controlado (`leite`, `lactose`, `trigo_centeio_cevada_aveia`, etc.) permanecem em português por rastreabilidade direta com a norma da ANVISA (RDC 727/2022).
3. **Imutabilidade de ADRs:**
   - Nunca apague um ADR nem reescreva silenciosamente uma decisão histórica em [`./docs/fase2/adr/`](./docs/fase2/adr/).
   - Evoluções incrementais entram como seção datada `## Detalhamento (<Contexto> — DD/MM/AAAA)` ao final do ADR. Se uma decisão central for trocada, crie um novo `ADR-NNN` e marque o antigo como `Substituído por ADR-NNN`.
4. **Fronteiras Modulares e SOLID ([ADR-002](./docs/fase2/adr/adr-002-estilo-servidor-monolito-modular.md) e [Padrões de Projeto](./docs/fase2/padroes-de-projeto.md)):**
   - **Servidor (`apps/api`):** Monólito modular em Fastify + TypeScript. Módulos de domínio (`catalog`, `profile`, `routine`, `progress`, `importer`) só se comunicam via interfaces em `public/`. Ninguém importa `internal/` de outro módulo (regras `S1..S8` fiscalizadas por `eslint-plugin-boundaries`). Escritas cross-módulo usam contexto transacional explícito `tx: Tx` (`T01`).
   - **App (`apps/mobile`):** React Native + Expo (*development build*), organizado por feature (`feature-first`). Features nunca importam outras features e nunca escrevem SQL direto (regras `A1..A8`).
5. **Segurança e LGPD (`A05`, [ADR-005](./docs/fase2/adr/adr-005-armazenamento-local-e-fila.md), [ADR-006](./docs/fase2/adr/adr-006-criptografia-restricao-alimentar.md)):**
   - Restrição alimentar é dado sensível: cifrada em repouso no aparelho com **SQLCipher** e no servidor com **AES-256-GCM** na camada de aplicação (mesmo usando PostgreSQL gerenciado na nuvem).
   - **Proibido** registrar restrição alimentar em logs técnicos (`A13`) ou enviar qualquer dado de usuário ao provedor de IA (`RNF06`, `R11`).

---

## 4. Mapa de Navegação do Repositório

### Governança e Operação
- [`./AGENTS.md`](./AGENTS.md) — Este guia mestre para agentes.
- [`./CLAUDE.md`](./CLAUDE.md) — Ponteiro de inicialização rápida para agentes compatíveis com Claude Code.
- [`./STATE.md`](./STATE.md) — Painel vivo de status, diretrizes de MVP/Deploy/Gamificação, Issues e Handoff.
- [`./README.md`](./README.md) — Apresentação pública do repositório para avaliação acadêmica.
- [`./docs/playbooks/`](./docs/playbooks/) — Manuais operacionais objetivos (`01`, `02`, `03`).

### Fase 1 — Engenharia de Requisitos (Concluída — Baseline `backlog-validado-v1.0`)
- **Consolidado:** [`./docs/fase1/1.3-documentacao/documento-de-requisitos.md`](./docs/fase1/1.3-documentacao/documento-de-requisitos.md)
- **1.1 Elicitação:** [`lexico.md`](./docs/fase1/1.1-elicitacao/lexico.md) · [`personas.md`](./docs/fase1/1.1-elicitacao/personas.md) · [`requisitos.md`](./docs/fase1/1.1-elicitacao/requisitos.md) (RF01–RF18, RNF01–RNF11) · [`backlog.md`](./docs/fase1/1.1-elicitacao/backlog.md) (US01–US18)
- **1.2 Análise:** [`modelo-conceitual.md`](./docs/fase1/1.2-analise/modelo-conceitual.md) · [`casos-de-uso.md`](./docs/fase1/1.2-analise/casos-de-uso.md) (UC01–UC13) · [`regras-de-negocio.md`](./docs/fase1/1.2-analise/regras-de-negocio.md) (RN01–RN22)
- **1.4 Validação:** [`matriz-rastreabilidade.md`](./docs/fase1/1.4-validacao/matriz-rastreabilidade.md) · [`casos-de-teste.md`](./docs/fase1/1.4-validacao/casos-de-teste.md) (CT01–CT30) · [`ata-revisao.md`](./docs/fase1/1.4-validacao/ata-revisao.md) · [`resumo-1.4-fechamento.md`](./docs/fase1/1.4-validacao/resumo-1.4-fechamento.md)
- **Diário da Fase 1:** [`./docs/fase1/diario_de_bordo-fase1.md`](./docs/fase1/diario_de_bordo-fase1.md)

### Fase 2 — Projeto Arquitetural (`/docs/fase2/`)
- **Coordenação e Diário:** [`briefing-fase2.md`](./docs/fase2/briefing-fase2.md) · [`diario_de_bordo-fase2.md`](./docs/fase2/diario_de_bordo-fase2.md)
- **2.1 Atributos de Qualidade:** [`atributos-qualidade.md`](./docs/fase2/atributos-qualidade.md) (Cenários `A01` a `A14`)
- **2.2 Estilo Arquitetural:** [`estilo-arquitetural.md`](./docs/fase2/estilo-arquitetural.md) (Offline-first parcial + Monólito Modular)
- **2.3 Propostas de MVP:** [`propostas-arquiteturais.md`](./docs/fase2/propostas-arquiteturais.md) (Escolha da P1 + Agente de IA na curadoria)
- **2.4 ADRs (`ADR-001` a `ADR-016`):** [`./docs/fase2/adr/`](./docs/fase2/adr/)
- **2.5 Modelo C4 (Níveis 1 a 3 + Implantação):** [`c4-contexto.md`](./docs/fase2/c4-contexto.md) · [`c4-containers.md`](./docs/fase2/c4-containers.md) · [`c4-componentes.md`](./docs/fase2/c4-componentes.md)
- **2.6 Classes, Sequências e Contratos:** [`diagrama-classes.md`](./docs/fase2/diagrama-classes.md) · [`sequencia-uc04.md`](./docs/fase2/sequencia-uc04.md) · [`sequencia-uc08.md`](./docs/fase2/sequencia-uc08.md) · [`sequencia-uc10.md`](./docs/fase2/sequencia-uc10.md) · [`sequencia-uc12.md`](./docs/fase2/sequencia-uc12.md) · [`openapi.yaml`](./docs/fase2/openapi.yaml) · [`glossario-identificadores.md`](./docs/fase2/glossario-identificadores.md) · [`./docs/fase2/bruno/panelada-curadoria/`](./docs/fase2/bruno/panelada-curadoria/)
- **2.7 Padrões de Projeto e Fronteiras:** [`padroes-de-projeto.md`](./docs/fase2/padroes-de-projeto.md)
- **2.8 Revisão Arquitetural ("Advogado do Diabo"):** [`revisao-arquitetural.md`](./docs/fase2/revisao-arquitetural.md)
- **2.9 Fechamento da Fase 2:** [`checklist-final.md`](./docs/fase2/checklist-final.md) · [`resumo-fase2-para-fase3.md`](./docs/fase2/resumo-fase2-para-fase3.md) · [`issue-31-lote-3.md`](./docs/fase2/issue-31-lote-3.md)
- **Gamificação Metodológica (6D + Octalysis):** [`framework-gamificacao.md`](./docs/fase2/framework-gamificacao.md) · [`adr-016-framework-conceitual-gamificacao.md`](./docs/fase2/adr/adr-016-framework-conceitual-gamificacao.md)

### Topologia Reservada para Implementação (Monorepo — Fase 3 / MVP)
Quando as tarefas de código iniciarem, o monorepo seguirá exatamente esta disposição:
- `packages/allergen-rules/` — Pacote TypeScript puro compartilhado ([ADR-014](./docs/fase2/adr/adr-014-regra-alergenos-compartilhada.md)), com pontos de entrada `rules` e `invariants` + vetores JSON de teste.
- `apps/api/` — Servidor Node.js + Fastify + TypeScript ([ADR-002](./docs/fase2/adr/adr-002-estilo-servidor-monolito-modular.md)): `src/modules/{catalog,profile,routine,progress,importer}`, `src/cross-cutting/{identity,sync,suggestion-search}`, `src/support/{field-encryption,technical-log}`, `src/shared/`.
- `apps/mobile/` — App React Native + Expo + TypeScript ([ADR-003](./docs/fase2/adr/adr-003-stack-movel-react-native-android.md)): `src/features/`, `src/core/`, `src/shared/`, `src/app/composition/`.

---

## 5. Matriz de Leitura por Tipo de Tarefa

Para economizar contexto e evitar alucinações, carregue **apenas** os arquivos indicados para o seu escopo:

| Tipo de Tarefa | Leitura Obrigatória (Núcleo) | Leitura de Apoio (Sob Demanda) |
|---|---|---|
| **Qualquer tarefa (Sempre)** | [`STATE.md`](./STATE.md) + Playbook correspondente em [`docs/playbooks/`](./docs/playbooks/) | [`AGENTS.md`](./AGENTS.md) |
| **Modelagem de Gamificação (6D / Octalysis)** | [`framework-gamificacao.md`](./docs/fase2/framework-gamificacao.md), [`adr-016`](./docs/fase2/adr/adr-016-framework-conceitual-gamificacao.md), [`regras-de-negocio.md`](./docs/fase1/1.2-analise/regras-de-negocio.md) (RN01–RN07, RN18–RN20), [`backlog.md`](./docs/fase1/1.1-elicitacao/backlog.md) (US12–US17), [`diagrama-classes.md`](./docs/fase2/diagrama-classes.md) (módulo `progress`), [`padroes-de-projeto.md`](./docs/fase2/padroes-de-projeto.md) (§5) | [`modelo-conceitual.md`](./docs/fase1/1.2-analise/modelo-conceitual.md), [`sequencia-uc10.md`](./docs/fase2/sequencia-uc10.md) |
| **Revisão Arquitetural (2.8) e Fechamento (2.9)** | [`briefing-fase2.md`](./docs/fase2/briefing-fase2.md), [`atributos-qualidade.md`](./docs/fase2/atributos-qualidade.md), ADRs (`001`–`016`), [`c4-componentes.md`](./docs/fase2/c4-componentes.md), [`padroes-de-projeto.md`](./docs/fase2/padroes-de-projeto.md) | [`diagrama-classes.md`](./docs/fase2/diagrama-classes.md), [`openapi.yaml`](./docs/fase2/openapi.yaml), [`matriz-rastreabilidade.md`](./docs/fase1/1.4-validacao/matriz-rastreabilidade.md) |
| **Implementação Backend (`apps/api`)** | [`padroes-de-projeto.md`](./docs/fase2/padroes-de-projeto.md) (§3–§6, §9), [`diagrama-classes.md`](./docs/fase2/diagrama-classes.md), [`openapi.yaml`](./docs/fase2/openapi.yaml), ADRs do módulo alvo | Sequência do UC correspondente (`sequencia-uc*.md`), [`regras-de-negocio.md`](./docs/fase1/1.2-analise/regras-de-negocio.md) |
| **Implementação Mobile (`apps/mobile`)** | [`padroes-de-projeto.md`](./docs/fase2/padroes-de-projeto.md) (§3, §6.4, §9), [`diagrama-classes.md`](./docs/fase2/diagrama-classes.md), [`c4-componentes.md`](./docs/fase2/c4-componentes.md) (§1 e §3), [`adr-005`](./docs/fase2/adr/adr-005-armazenamento-local-e-fila.md), [`adr-008`](./docs/fase2/adr/adr-008-estrategia-offline-e-sincronizacao.md) | [`sequencia-uc04.md`](./docs/fase2/sequencia-uc04.md), [`sequencia-uc10.md`](./docs/fase2/sequencia-uc10.md) |
| **Pacote `allergen-rules`** | [`adr-014-regra-alergenos-compartilhada.md`](./docs/fase2/adr/adr-014-regra-alergenos-compartilhada.md), [`regras-de-negocio.md`](./docs/fase1/1.2-analise/regras-de-negocio.md) (RN08, RN10, RN16, RN22), [`sequencia-uc04.md`](./docs/fase2/sequencia-uc04.md) | [`casos-de-teste.md`](./docs/fase1/1.4-validacao/casos-de-teste.md) (CT01, CT17, CT19, CT29) |

---

## 6. Convenção para Issues, Workflows e Skills

O gerenciamento de tarefas é feito via **GitHub Issues** espelhadas no [`STATE.md`](./STATE.md). Para suportar automação por workflows e skills de agentes CLI:

1. **Contrato de Metadados de Issue:** Toda Issue criada (seja de código, documentação ou retroalimentação) deve conter as 4 seções definidas no [`docs/playbooks/01-sessao-issues-e-diario.md`](./docs/playbooks/01-sessao-issues-e-diario.md):
   - `## 1. Contexto e Rastreabilidade` (IDs de `US`, `UC`, `RN`, `RNF`, `A##` e `ADR` relacionados).
   - `## 2. Escopo e Camada` (`docs`, `packages/allergen-rules`, `apps/api`, `apps/mobile` e arquivos previstos).
   - `## 3. Critérios de Aceite` (Checklists objetivos ou cenários `Given/When/Then`).
   - `## 4. Verificação e Testes` (Comandos de teste/lint ou critérios de validação documental).
2. **Skills e Workflows do Projeto:**
   - Os procedimentos determinísticos residem em [`./docs/playbooks/`](./docs/playbooks/) e servem como base direta para skills locais do repositório.
