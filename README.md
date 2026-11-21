# Panelada: Culinária internacional gamificada

Aplicativo mobile que transforma o ato de cozinhar em uma experiência divertida e recompensadora: sugere pratos internacionais conforme o perfil do usuário, organiza a rotina de refeições (escolha do prato, data de compra e data de preparo) e celebra cada receita concluída como uma conquista — coleção por culinária ("Pokédex de pratos"), cadeias de evolução e badges.

> **Elevator pitch:** Para pessoas que gostam de cozinhar e querem escapar da rotina de repetir sempre os mesmos pratos, o Panelada é um aplicativo mobile de culinária internacional que transforma o ato de cozinhar em uma experiência divertida e recompensadora. Diferente dos apps de receitas tradicionais, ele estimula o usuário a aprender pratos novos continuamente, combinando o planejamento da rotina de cozinha com mecânicas de jogo que celebram cada receita concluída como uma conquista.

## Contexto

Repositório do trabalho da disciplina **Tópicos em Sistemas de Informação** (Ciência da Computação), cujo tema é o uso de **IA generativa aplicada ao ciclo de vida de desenvolvimento de software**. Cada fase do processo é conduzida com IA generativa como copiloto, e os artefatos são consolidados neste repositório, fase a fase.

- **Dupla:** Anny Filgueiras ([@AnnyFilgueiras](https://github.com/AnnyFilgueiras)) e Gabryel Souza ([@gabryelsouzz](https://github.com/gabryelsouzz))
- **Professor(a):** Patrick Henrique
- **Fase atual:** Fase 2 — Projeto Arquitetural (**Concluída — Sub-etapas 2.1 a 2.9 + Gamificação 6D + Octalysis**); preparando transição para a Fase 3 (MVP)

---

## Governança Multi-Agente e Setup Local

Este repositório é estruturado para desenvolvimento colaborativo entre a dupla e múltiplos agentes de IA (**Antigravity, Claude Code, Codex e Kimi**), em **Linux, macOS e Windows**:

- **[`AGENTS.md`](./AGENTS.md):** Guia enxuto de engenharia e ponto de entrada único para todos os agentes (comandos, arquitetura, regras com o porquê e tabela *"Leia Quando"*).
- **[`CLAUDE.md`](./CLAUDE.md):** Ponteiro enxuto para Claude Code apontando para `AGENTS.md`, `STATE.md` e `.agents/skills/`.
- **[`STATE.md`](./STATE.md):** Painel vivo de progresso, decisões estratégicas vigentes, backlog ativo e *Handoff* entre marcos.
- **[`.agents/skills/`](./.agents/skills/):** Fonte única das skills do projeto (`grilling`, `github-issue-craft`, `solve-issue`, `code-review`, `tdd`, `codebase-design`, `code-comments`).
- **[`docs/dev/`](./docs/dev/):** Documentação operacional viva para codificação (*"1 pergunta por página"*): [`GLOSSARY.md`](./docs/dev/GLOSSARY.md), [`ARCHITECTURE.md`](./docs/dev/ARCHITECTURE.md) e [`PRIVACY.md`](./docs/dev/PRIVACY.md) (`DATABASE.md` e `TESTING.md` entram em `MVP-02`).
- **[`docs/playbooks/`](./docs/playbooks/):** Manuais operacionais de processo ([`01`](./docs/playbooks/01-sessao-issues-e-diario.md), [`02`](./docs/playbooks/02-arquitetura-adrs-e-retroalimentacao.md), [`03`](./docs/playbooks/03-qualidade-fronteiras-e-contratos.md)).

### Setup de Skills por Clone (Claude Code em Linux/Windows)
Antigravity, Codex e Kimi descobrem `.agents/skills/` automaticamente. Para o **Claude Code**, rode uma vez após clonar o repositório:

```bash
node scripts/setup-agent-skills.mjs
```

O script cria um symlink relativo em Linux/macOS ou uma *directory junction* em Windows (sem precisar de privilégio de administrador nem Developer Mode) ligando `.claude/skills` a `.agents/skills`.

### Fluxo de Branches (Fase 3)
- Toda tarefa (`feat/*`, `fix/*`, `docs/*`, `chore/*`) sai de **`development`** atualizada e abre PR para **`development`**.
- **`main`** recebe apenas promoções estáveis de `development` (marcos e deploys). Nunca commite diretamente na `main`.
- Planos de trabalho dos agentes ficam visíveis em `.plans/` (ignorado pelo `.gitignore`).

---

## Status e Documentação da Fase 2 — Projeto Arquitetural

| Sub-etapa | Artefato principal | Status |
|---|---|---|
| 2.1 Requisitos de Qualidade | [Cenários de qualidade priorizados (A01–A14)](./docs/fase2/01-fundamentos/atributos-qualidade.md) | ✅ Concluída |
| 2.2 Estilo Arquitetural | [Offline-first parcial + Monólito Modular](./docs/fase2/01-fundamentos/estilo-arquitetural.md) | ✅ Concluída |
| 2.3 Propostas Arquiteturais | [Comparação de propostas de MVP e escolha da P1](./docs/fase2/01-fundamentos/propostas-arquiteturais.md) | ✅ Concluída |
| 2.4 Decisões Arquiteturais (ADRs) | [ADR-001 a ADR-016](./docs/fase2/02-adr/) | ✅ Concluída |
| 2.5 Modelo C4 | [Contexto](./docs/fase2/03-modelagem/c4-contexto.md), [Containers e Implantação](./docs/fase2/03-modelagem/c4-containers.md), [Componentes](./docs/fase2/03-modelagem/c4-componentes.md) | ✅ Concluída |
| 2.6 Classes, Fluxos e Contratos | [Classes](./docs/fase2/03-modelagem/diagrama-classes.md), Sequências ([UC04](./docs/fase2/03-modelagem/sequencia-uc04.md), [UC08](./docs/fase2/03-modelagem/sequencia-uc08.md), [UC10](./docs/fase2/03-modelagem/sequencia-uc10.md), [UC12](./docs/fase2/03-modelagem/sequencia-uc12.md)), [OpenAPI 3.1](./docs/fase2/04-contratos/openapi.yaml), [Glossário](./docs/fase2/04-contratos/glossario-identificadores.md) e [Coleção Bruno](./docs/fase2/04-contratos/bruno/panelada-curadoria/) | ✅ Concluída |
| 2.7 Padrões de Projeto e Fronteiras | [Padrões justificados, regras `eslint-plugin-boundaries` e TDD](./docs/fase2/03-modelagem/padroes-de-projeto.md) | ✅ Concluída |
| Frente Transversal — Gamificação | [Modelagem Conceitual 6D + Octalysis](./docs/fase2/03-modelagem/framework-gamificacao.md) e [ADR-016](./docs/fase2/02-adr/adr-016-framework-conceitual-gamificacao.md) | ✅ Concluída |
| 2.8 Revisão Arquitetural | [Revisão pesada ("advogado do diabo") e registro de riscos R1–R21](./docs/fase2/05-fechamento/revisao-arquitetural.md) | ✅ Concluída |
| 2.9 Fechamento da Fase 2 | [Checklist final](./docs/fase2/05-fechamento/checklist-final.md) e [Resumo para a Fase 3 + roteiro de slides](./docs/fase2/05-fechamento/resumo-fase2-para-fase3.md) | ✅ Concluída |

- **Documento-mestre da Fase 2:** [Briefing da Fase 2](./docs/fase2/briefing-fase2.md)
- **Diário de Bordo da Fase 2:** [Registro incremental do processo com IA na Fase 2](./docs/fase2/diario_de_bordo-fase2.md)

### Índice de ADRs (`docs/fase2/02-adr/`)
- [ADR-001 — Estilo do sistema: offline-first com sincronização](./docs/fase2/02-adr/adr-001-estilo-sistema-offline-first.md)
- [ADR-002 — Estilo do servidor: monólito modular](./docs/fase2/02-adr/adr-002-estilo-servidor-monolito-modular.md)
- [ADR-003 — Stack móvel: React Native com Expo (Android)](./docs/fase2/02-adr/adr-003-stack-movel-react-native-android.md)
- [ADR-004 — Demonstração em Docker Compose, arquitetura-alvo e deploy cloud](./docs/fase2/02-adr/adr-004-demonstracao-docker-e-alvo.md)
- [ADR-005 — Armazenamento local cifrado (SQLCipher) e fila](./docs/fase2/02-adr/adr-005-armazenamento-local-e-fila.md)
- [ADR-006 — Criptografia da restrição alimentar (LGPD)](./docs/fase2/02-adr/adr-006-criptografia-restricao-alimentar.md)
- [ADR-007 — Autenticação: conta anônima, e-mail opcional e JWT/Refresh](./docs/fase2/02-adr/adr-007-autenticacao.md)
- [ADR-008 — Estratégia offline, sincronização idempotente e estágios do MVP](./docs/fase2/02-adr/adr-008-estrategia-offline-e-sincronizacao.md)
- [ADR-009 — Notificações locais agendadas no aparelho](./docs/fase2/02-adr/adr-009-notificacoes-locais.md)
- [ADR-010 — Catálogo curado, fluxo manual e importação](./docs/fase2/02-adr/adr-010-catalogo-e-importacao.md)
- [ADR-011 — Agente de IA na importação assistida (Kimi K3)](./docs/fase2/02-adr/adr-011-agente-ia-importacao.md)
- [ADR-012 — Fotos das receitas: licença aberta, atribuição TASL e armazenamento](./docs/fase2/02-adr/adr-012-fotos.md)
- [ADR-013 — Política de custo zero e ferramentas de estudante](./docs/fase2/02-adr/adr-013-custo-e-ferramentas-estudante.md)
- [ADR-014 — Regra de alérgenos em pacote TypeScript compartilhado](./docs/fase2/02-adr/adr-014-regra-alergenos-compartilhada.md)
- [ADR-015 — Idioma dos identificadores, código e artefatos](./docs/fase2/02-adr/adr-015-idioma-dos-identificadores.md)
- [ADR-016 — Framework conceitual de gamificação: abordagem híbrida 6D + Octalysis e extensão declarativa de marcos](./docs/fase2/02-adr/adr-016-framework-conceitual-gamificacao.md)

---

## Status e Documentação da Fase 1 — Engenharia de Requisitos (Baseline `backlog-validado-v1.0`)

| Sub-etapa | Artefato principal | Status |
|---|---|---|
| 1.1 Elicitação | Léxico, personas, RF/RNF, backlog MoSCoW | ✅ Concluída |
| 1.2 Análise | Modelo conceitual (UML/Mermaid), casos de uso, regras de negócio | ✅ Concluída |
| 1.3 Documentação | Documento de requisitos consolidado | ✅ Concluída |
| 1.4 Validação | Casos de teste, matriz de rastreabilidade, ata de revisão, resumo de fechamento | ✅ Concluída |

**Leitura recomendada da Fase 1:** o [Documento de Requisitos consolidado](./docs/fase1/1.3-documentacao/documento-de-requisitos.md) amarra visão, personas, requisitos, backlog, modelo conceitual, casos de uso, regras de negócio e rastreabilidade.

### 1.1 — Elicitação
- [Léxico do domínio](./docs/fase1/1.1-elicitacao/lexico.md)
- [Personas](./docs/fase1/1.1-elicitacao/personas.md)
- [Requisitos funcionais e não funcionais](./docs/fase1/1.1-elicitacao/requisitos.md)
- [Backlog de histórias de usuário (MoSCoW, com critérios de aceite)](./docs/fase1/1.1-elicitacao/backlog.md)

### 1.2 — Análise
- [Modelo conceitual do domínio (diagrama de classes UML em Mermaid)](./docs/fase1/1.2-analise/modelo-conceitual.md)
- [Casos de uso (UC01–UC13)](./docs/fase1/1.2-analise/casos-de-uso.md)
- [Regras de negócio (RN01–RN22)](./docs/fase1/1.2-analise/regras-de-negocio.md)

### 1.3 — Documentação
- [Documento de requisitos consolidado](./docs/fase1/1.3-documentacao/documento-de-requisitos.md)

### 1.4 — Validação
- [Casos de teste (CT01–CT31)](./docs/fase1/1.4-validacao/casos-de-teste.md)
- [Matriz de rastreabilidade](./docs/fase1/1.4-validacao/matriz-rastreabilidade.md)
- [Ata de revisão](./docs/fase1/1.4-validacao/ata-revisao.md)
- [Resumo de fechamento da 1.4](./docs/fase1/1.4-validacao/resumo-1.4-fechamento.md)
- [Diário de bordo da Fase 1](./docs/fase1/diario_de_bordo-fase1.md)

---

## Estrutura do Repositório

```text
/
├── AGENTS.md                        Guia enxuto de engenharia e governança (fonte única multi-agente)
├── CLAUDE.md                        Ponteiro enxuto para Claude Code
├── STATE.md                         Painel vivo de progresso, decisões, backlog e handoff
├── README.md                        Este arquivo
├── .agents/skills/                  Skills versionadas (Antigravity, Codex, Kimi + Claude via script)
├── .github/ISSUE_TEMPLATE/          Formulários YAML de Issues (Playbook 01)
├── scripts/setup-agent-skills.mjs   Espelha `.agents/skills` -> `.claude/skills` (Linux/Windows)
└── docs/
    ├── dev/                         Docs operacionais vivos de código (GLOSSARY, ARCHITECTURE, PRIVACY)
    ├── playbooks/                   Manuais operacionais (sessão/issues/diário, ADRs, qualidade/TDD)
    ├── fase1/                       [Referência] Artefatos da Fase 1 (1.1 a 1.4, assets e diário)
    └── fase2/                       [Referência] Artefatos da Fase 2 (ADRs, C4, OpenAPI, Bruno e diário)
```
