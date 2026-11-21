# Playbook 01 — Ciclo de Sessão, GitHub Issues e Diário de Bordo

> **Quando usar:** Em toda sessão de agente de IA, bem como por futuros workflows/skills automatizados de criação e implementação de GitHub Issues.

---

## 1. Checklist de Início de Sessão

1. **Ler [`../../AGENTS.md`](../../AGENTS.md) e [`../../STATE.md`](../../STATE.md):** Identificar a fase atual, o bloco *Handoff da Última Sessão* e a tarefa/Issue alvo.
2. **Sincronizar com GitHub Issues e branch `development` (quando aplicável):**
   - Garantir base atualizada: `git switch development && git pull`
   - Listar issues abertas: `gh issue list --state open`
   - Ler detalhes da issue alvo: `gh issue view <NUMERO>`
3. **Carregar somente os artefatos necessários:** Seguir a tabela **"Leia Quando"** do [`../../AGENTS.md`](../../AGENTS.md). Para criar/auditar issues use a skill `.agents/skills/github-issue-craft`; para implementar ponta a ponta use `.agents/skills/solve-issue`.

---

## 2. Governança de GitHub Issues, Labels, Milestones, Project e Tags

### 2.1. Regra de Numeração Compartilhada (Issues × PRs)
- No GitHub, **Issues e Pull Requests compartilham a mesma sequência numérica** (`#28` Issue → `#29` PR → `#30` Issue → `#31` PR → `#32` Issue).
- **Regra obrigatória:** **nunca pré-reserve um número `#NN` do GitHub** na documentação antes de a issue existir de fato. Nos artefatos e no [`STATE.md`](../../STATE.md), use sempre o **ID estável da tarefa** (`US##`, `F2-##`, `Lote N`, `GOV-##`, `MVP-##`) e vincule `#NN` somente após a criação.

### 2.2. Convenção de Títulos (sem prefixos de label)
- **Idioma:** português (Brasil) ([ADR-015](../fase2/02-adr/adr-015-idioma-dos-identificadores.md)).
- **Formato:** `<ID-ESTÁVEL> — <Ação clara e objetiva>` (nunca colocar `[docs]` ou `[bug]` no título; isso pertence às **Labels**).
  - Exemplos:
    - `US01 — Receber sugestões de pratos alinhadas ao perfil`
    - `Lote 3 — Retroalimentação da Fase 2 para a Fase 1 (curadoria API, alérgenos e exclusão de conta)`
    - `GOV-04 — Criar workflows/skills de geração e execução de Issues`
    - `MVP-02 — Configurar monorepo, TypeScript e eslint-plugin-boundaries`

### 2.3. Taxonomia Oficial de Labels (máx. 2–3 labels por Issue)
Toda issue recebe **1 label de Tipo** + **1 label de Camada** (+ prioridade MoSCoW quando aplicável):

| Grupo | Label | Cor | Descrição |
|---|---|---|---|
| **Prioridade (Fase 1)** | `must` | `#B60205` | Prioridade Must — MoSCoW |
| **Prioridade (Fase 1)** | `should` | `#FBCA04` | Prioridade Should — MoSCoW |
| **Prioridade (Fase 1)** | `could` | `#0E8A16` | Prioridade Could — MoSCoW |
| **Etapa (Fase 1 — histórico)** | `elicitacao` | `#1D76DB` | Artefato da sub-etapa 1.1 — Elicitação |
| **Etapa (Fase 1 — histórico)** | `analise` | `#5319E7` | Artefato da sub-etapa 1.2 — Análise |
| **Etapa (Fase 1 — histórico)** | `validacao` | `#F9D0C4` | Artefato da sub-etapa 1.4 — Validação |
| **Tipo de trabalho** | `arquitetura` | `#0052CC` | Decisões arquiteturais, ADRs, C4, contratos e revisões |
| **Tipo de trabalho** | `retroalimentacao` | `#D93F0B` | Ajustes de retroalimentação entre fases (ex.: Fase 2 → Fase 1) |
| **Tipo de trabalho** | `governanca` | `#5319E7` | Processos, playbooks, CI, automação e workflows/skills |
| **Tipo de trabalho** | `implementacao` | `#0E8A16` | Desenvolvimento de funcionalidades e testes (Fase 3 / MVP) |
| **Camada técnica** | `docs` | `#0075CA` | Documentação em `docs/`, `README.md`, `STATE.md` e `AGENTS.md` |
| **Camada técnica** | `allergen-rules` | `#E99695` | Pacote compartilhado `packages/allergen-rules` |
| **Camada técnica** | `api` | `#1D76DB` | Servidor Fastify em `apps/api` |
| **Camada técnica** | `mobile` | `#006B75` | App React Native/Expo em `apps/mobile` |

### 2.4. Milestones, GitHub Project e Tags de Baseline
- **Milestones (um por marco de entrega):**
  - `Fase 1 — Engenharia de Requisitos` *(fechado)*
  - `Fase 2 — Projeto Arquitetural` *(fechar após merge do PR da Frente B)*
  - `Fase 3 — MVP (Estágio 1)` *(primeiro deploy com leitura offline + escrita online)*
  - `Fase 3 — Offline Completo (Estágio 2)` *(Outbox + Synchronizer + 100 ciclos)*
- **GitHub Project:** manter **um único Project** para todo o repositório com visões separadas por fase (filtro `is:issue` para não misturar PRs nos cards; colunas na Fase 3: `Backlog | Em andamento | Em revisão | Concluído`).
- **Vínculo Issue ↔ PR (evidência):** todo PR que resolve uma issue deve conter `Closes #<NN>` no corpo (ou `Refs #<NN>` para entrega parcial), criando rastreabilidade automática no GitHub.
- **Tags de Baseline (na `main`, após merge):**
  - Fase 1: `validated-backlog--v1.0` *(criada)*
  - Fase 2: `architecture-design--v1.0` *(criar após merge do PR da Fase 2)*
  - Fase 3: `mvp-stage1--v1.0` *(futuro primeiro deploy)*

### 2.5. Template Canônico de GitHub Issue

Toda Issue criada no repositório (manualmente ou via workflow/skill de criação de Issues) deve seguir estritamente esta estrutura em **português (Brasil)** ([ADR-015](../fase2/02-adr/adr-015-idioma-dos-identificadores.md)) para que qualquer agente implementador tenha contexto determinístico:

```markdown
## 1. Contexto e Rastreabilidade
- **Fase / Etapa:** [Ex.: Fase 2 (2.8) | Gamificação | Fase 3 (MVP - Estágio 1)]
- **Origem (Requisitos / Arquitetura):** [Ex.: US12, RN01, RNF05, A04, ADR-008]
- **Objetivo:** [Descrição direta em 1–2 frases do problema ou entrega]

## 2. Escopo e Camada
- **Camada afetada:** [ ] `docs/`  [ ] `packages/allergen-rules`  [ ] `apps/api`  [ ] `apps/mobile`
- **Arquivos/Módulos previstos:**
  - `caminho/do/arquivo`
- **Fora de escopo:** [O que NÃO deve ser alterado nesta Issue]

## Decisões Fechadas
- [Regras de negócio, contrato, códigos de erro e comportamento em bordas já decididos — vinculante para quem implementa; pendências reais entram como `> ❓ A confirmar: ...`]

## 3. Critérios de Aceite
- [ ] Critério 1 (ou cenário `Dado / Quando / Então`)
- [ ] Critério 2

## 4. Verificação e Testes
- **Abordagem de Teste:** [Ex.: Test-first (TDD) | Validação de contrato OpenAPI | Revisão documental]
- **Comando / Evidência de conclusão:**
  - `[comando exato ou checagem verificável]`
```

*(Os formulários correspondentes estão instalados em `.github/ISSUE_TEMPLATE/`.)*

---

## 3. Fluxo de Implementação de uma Issue (`solve-issue`)

1. **Fluxo de branches em mão única (`development` → `main`):**
   - Toda branch de trabalho (`feat/issue-NN-short-name`, `fix/issue-NN-short-name`, `docs/issue-NN-short-name`, `chore/issue-NN-short-name`) sai de **`development`** atualizada e abre PR para **`development`**.
   - Mudanças de regra de negócio/docs e features de código entram em **PRs separados** na `development`.
   - `main` recebe apenas promoções estáveis de `development` (marcos/deploys semanais ou por fatia concluída). Nunca commite direto na `main`.
2. **Planos visíveis em `.plans/`:** salve planos de trabalho e cortes de contexto em `.plans/<branch>.md` (ignorado no `.gitignore`).
3. **Seguir TDD onde aplicável:** Conforme [`../fase2/03-modelagem/padroes-de-projeto.md`](../fase2/03-modelagem/padroes-de-projeto.md) (§9) e a skill `.agents/skills/tdd`, regras puras e serviços de atributos críticos (`A05`, `A06`, `A07`, `A08`) exigem RED → GREEN → REFACTOR vertical.
4. **Respeitar Fronteiras, Idioma e Política de IA:**
   - Código, identificadores, comentários, branches e commits em **inglês** ([ADR-015](../fase2/02-adr/adr-015-idioma-dos-identificadores.md)); **zero** atribuição de IA (`Co-Authored-By` ou rodapés) em commits, código e PRs.
   - Documentação, Issues e PRs em **português (Brasil)**.
5. **Rodar Verificação e `code-review`:** Executar os comandos definidos na Seção 4 da Issue, confirmar fronteiras modulares e SQL (`S8`), e rodar revisão em contexto limpo (ver [Playbook 03](./03-qualidade-fronteiras-e-contratos.md)).

---

## 4. Registro Obrigatório no Diário de Bordo e Cadência na Fase 3

O Diário de Bordo ([Fase 1](../fase1/diario_de_bordo-fase1.md) / [Fase 2](../fase2/diario_de_bordo-fase2.md) / futura Fase 3) é a **evidência acadêmica central** avaliada pelo professor e o único lugar (junto com o `STATE.md`) onde o uso de IA é registrado explicitamente.

- **Cadência sustentável na Fase 3:** para evitar burocracia e conflitos de merge em PRs paralelos, **não** atualize o Diário nem o `STATE.md` em micro-PRs triviais. Faça uma entrada consolidada ao concluir cada **marco/fatia relevante** (`GOV-##`, `MVP-01`–`MVP-04`, mudança de ADR) ou na **promoção semanal `development` → `main`**.

Sempre que registrar uma entrada, adicione ao final do diário da fase vigente com este formato:

```markdown
## [DD/MM/AAAA] — <Identificador e Título da Etapa ou Tarefa>

- **Papel da IA:** <papel assumido pelo agente, ex.: arquiteto de software, engenheiro de testes>
- **Técnicas aplicadas:** <técnicas de engenharia de software e de prompt utilizadas>
- **Prompts-chave / Contexto da sessão:**
  1. <resumo objetivo das instruções e direcionamentos da dupla>
- **Insumos usados:** <lista de arquivos lidos como base>
- **Artefatos produzidos:** <lista de arquivos criados ou atualizados>

### Decisões tomadas
1. <decisão 1 com justificativa e trade-off>

### Artefatos alterados (retroalimentação)
- `<arquivo>`: <o que mudou e por quê>

### Iterações relevantes (erros e retrabalho da IA)
1. <registro honesto de hipóteses corrigidas pela dupla ou ajustes durante a sessão>

### Divergências registradas (briefing/professor × artefatos)
- <divergências encontradas e como foram resolvidas pela regra de precedência>

### Riscos aceitos
- <novos riscos R## ou confirmação dos existentes>

### Pendências para a próxima sessão
- <itens concretos que ficaram para a sequência>
```

---

## 5. Atualização do `STATE.md` (Passagem de Bastão)

Antes de encerrar seu último turno:
1. Atualize o status da tarefa na tabela de pendências do [`../../STATE.md`](../../STATE.md) (`[ ]` -> `[x]`).
2. Substitua o bloco **Seção 4 — Handoff da Última Sessão** no [`../../STATE.md`](../../STATE.md) mantendo o histórico conciso:
   - **Data e Agente:** data e ferramenta utilizada.
   - **O que foi feito:** resumo em até 3 bullets.
   - **Decisões tomadas:** referência aos ADRs/seções atualizados.
   - **Arquivos criados/alterados:** caminhos principais.
   - **Próximo passo recomendado:** a próxima ação exata da fila.
