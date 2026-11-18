# Playbook 01 — Ciclo de Sessão, GitHub Issues e Diário de Bordo

> **Quando usar:** Em toda sessão de agente de IA, bem como por futuros workflows/skills automatizados de criação e implementação de GitHub Issues.

---

## 1. Checklist de Início de Sessão

1. **Ler [`../../STATE.md`](../../STATE.md):** Identificar a fase atual, o bloco *Handoff da Última Sessão* e a tarefa/Issue alvo.
2. **Sincronizar com GitHub Issues (quando aplicável):**
   - Listar issues abertas: `gh issue list --state open`
   - Ler detalhes da issue alvo: `gh issue view <NUMERO>`
3. **Carregar somente os artefatos necessários:** Seguir a **Matriz de Leitura (Seção 5 do [`../../AGENTS.md`](../../AGENTS.md))**.

---

## 2. Template Canônico de GitHub Issue

Toda Issue criada no repositório (manualmente ou via workflow/skill de criação de Issues) deve seguir estritamente esta estrutura em **português (Brasil)** ([ADR-015](../fase2/adr/adr-015-idioma-dos-identificadores.md)) para que qualquer agente implementador tenha contexto determinístico:

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

## 3. Critérios de Aceite
- [ ] Critério 1 (ou cenário `Dado / Quando / Então`)
- [ ] Critério 2

## 4. Verificação e Testes
- **Abordagem de Teste:** [Ex.: Test-first (TDD) | Validação de contrato OpenAPI | Revisão documental]
- **Comando / Evidência de conclusão:**
  - `[comando exato ou checagem verificável]`
```

---

## 3. Fluxo de Implementação de uma Issue

1. **Preparar branch (se solicitado):** Nomes de branch em inglês (`feat/issue-NN-short-name`, `docs/issue-NN-short-name`, `fix/issue-NN-short-name`).
2. **Seguir TDD onde aplicável:** Conforme [`../fase2/padroes-de-projeto.md`](../fase2/padroes-de-projeto.md) (§9), regras puras (`allergen-rules`, `UnlockCalculator`, `UnlockRules`, `ReminderScheduler`, `PublicationGate`) e serviços de atributos críticos (`A05`, `A06`, `A07`, `A08`) exigem que o teste seja escrito e falhe **antes** da implementação.
3. **Respeitar Fronteiras e Idioma:**
   - Código, identificadores, rotas e commits em **inglês** ([ADR-015](../fase2/adr/adr-015-idioma-dos-identificadores.md)).
   - Documentação e comentários na Issue/PR em **português (Brasil)**.
4. **Rodar Verificação:** Executar os comandos definidos na Seção 4 da Issue e confirmar que nenhum link ou fronteira modular quebrou (ver [Playbook 03](./03-qualidade-fronteiras-e-contratos.md)).

---

## 4. Registro Obrigatório no Diário de Bordo

O Diário de Bordo ([Fase 1](../fase1/diario_de_bordo-fase1.md) / [Fase 2](../fase2/diario_de_bordo-fase2.md)) é a **evidência acadêmica central** avaliada pelo professor e o insumo direto para os slides de fechamento de cada fase.

Sempre que uma sessão concluir uma sub-etapa, refatoração relevante ou tomada de decisão arquitetural/de requisitos, adicione ao final do diário da fase vigente uma entrada com este formato:

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
