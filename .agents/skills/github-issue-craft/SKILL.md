---
name: github-issue-craft
description: Escreve, revisa e audita issues/tasks do GitHub do Panelada com qualidade — títulos precisos em PT-BR (`<ID-ESTÁVEL> — <Ação>`), escopo fatiado, critérios de aceite verificáveis, decisões fechadas, rastreabilidade (`US`/`UC`/`RN`/`A##`/`ADR`) e metadados do Playbook 01 — e publica direto no projeto com labels e dependências. Use SEMPRE que o usuário quiser criar issue, abrir bug, registrar feature/task/chore/spike, transformar notas ou conversa em issue, quebrar épico em sub-issues, revisar uma issue existente ou auditar o backlog.
argument-hint: "<notas | #N> [--review] [--project N] [--no-project]"
---

# GitHub Issue Craft (Panelada)

Uma issue existe para que outra pessoa (ou outro agente) execute o trabalho **sem precisar reconstruir o contexto que você tinha na cabeça** — e sem precisar de uma nova rodada de perguntas antes de começar. Quem pega a issue encontra nela todas as decisões fechadas; só o plano técnico arquivo a arquivo fica para quem implementa (`solve-issue`).

## Convenções Obrigatórias do Panelada (Playbook 01 + ADR-015)

Estas convenções **sempre vencem** templates genéricos:

1. **Idioma:** título, corpo e comentários em **português (Brasil)** (`ADR-015`). Identificadores de código, nomes de arquivos e rotas citados no corpo permanecem em inglês (exceção: os 19 códigos ANVISA).
2. **Formato do título:** `<ID-ESTÁVEL> — <Ação clara e objetiva>` (≤ 72 caracteres sempre que possível; nunca coloque `[docs]` ou `[bug]` no título — isso vai nas labels). Nunca pré-reserve número `#NN` do GitHub antes de a issue existir.
   - Exemplos: `MVP-02 — Configurar monorepo, Docker Compose e eslint-plugin-boundaries`, `US01 — Filtrar sugestões por restrição alimentar cifrada`.
3. **Estrutura canônica (4 seções do Playbook 01 + `## Decisões Fechadas`):**
   - `## 1. Contexto e Rastreabilidade` (Fase/Etapa, IDs `US##`, `UC##`, `RN##`, `RNF##`, `A##`, `ADR-###`, objetivo em 1–2 frases)
   - `## 2. Escopo e Camada` (checkboxes de camada `docs/` / `packages/allergen-rules` / `apps/api` / `apps/mobile`, arquivos/módulos previstos e **Fora de escopo**)
   - `## Decisões Fechadas` (vinculante para quem implementa: regra de negócio, contrato, códigos de erro, bordas; o que não pôde ser decidido entra como `> ❓ A confirmar: ... — bloqueia a implementação? sim/não`)
   - `## 3. Critérios de Aceite` (verificáveis, cobrindo caminho feliz, limite e erro)
   - `## 4. Verificação e Testes` (abordagem TDD/contrato/teste depois conforme Playbook 03 + comando exato)
   *(Também espelhada nos formulários YAML de `.github/ISSUE_TEMPLATE/`.)*
4. **Taxonomia oficial de Labels (2–3 labels: 1 Tipo + 1 Camada + prioridade MoSCoW quando aplicável):**
   - **Tipo:** `implementacao`, `arquitetura`, `retroalimentacao`, `governanca`
   - **Camada:** `docs`, `allergen-rules`, `api`, `mobile`
   - **Prioridade (quando aplicável):** `must`, `should`, `could`
   - Nunca invente labels fora da tabela do [`docs/playbooks/01-sessao-issues-e-diario.md`](../../../docs/playbooks/01-sessao-issues-e-diario.md) sem confirmar com o usuário.
5. **Portabilidade (Linux + Windows):** nunca use `$TMPDIR` ou `/tmp` para passar `--body-file` ao `gh`. Escreva temporariamente em `.plans/tmp-issue-body.md` (já ignorado pelo `.gitignore`) e apague o arquivo logo após o comando `gh`.

---

## Opções e Modos

| Flag | Efeito |
|---|---|
| _(nenhuma)_ | Explora o repo, entrevista o que faltar, publica direto, adiciona ao projeto, aplica labels e registra dependências. |
| `--review` | Não publica: grava rascunhos em `.pending-issues/` (ignorado pelo `.gitignore`) e espera aprovação. |
| `--project N` | Adiciona ao projeto `N` (quando houver mais de um projeto ativo). |
| `--no-project` | Não adiciona a projeto nenhum. |

| Modo | Sinal do usuário | Fluxo |
|---|---|---|
| **Criar** | "abre uma issue", "registra esse bug", "quebra em issues" | [Fluxo de criação](#fluxo-de-criação) |
| **Revisar** | "essa issue tá boa?", "melhora a #42" | [Fluxo de revisão](#fluxo-de-revisão) |
| **Auditar** | "audita o backlog", "quais issues estão ruins" | [Fluxo de auditoria](#fluxo-de-auditoria) |

---

## Regras nos Três Modos

1. **Verifique convenções e duplicatas no GitHub antes de escrever:**
   ```bash
   gh auth status
   gh label list --limit 100
   gh issue list --search "palavras chave" --state all --limit 10
   ```
   Se `gh auth status` falhar ou faltar permissão, não contorne: entregue o markdown pronto e os comandos exatos para o usuário.
2. **A issue sai com as decisões fechadas:**
   - **O que o repositório responde, o repositório responde:** cheque primeiro `STATE.md`, `docs/dev/`, `docs/fase2/02-adr/`, `docs/fase2/04-contratos/openapi.yaml`, `docs/fase1/1.2-analise/regras-de-negocio.md` e o código em `apps/` e `packages/`.
   - **O que sobrar aberto vira entrevista** no estilo da skill `grilling`: 1 pergunta por vez, sempre com recomendação explícita.
   - **Nunca preencha lacuna com suposição plausível.**
3. **Uma issue = um resultado verificável (e preferencialmente uma camada principal):** se precisa mexer em `packages/allergen-rules`, `apps/api` e `apps/mobile`, prefira fatiar em sub-issues encadeadas por dependência (`blocked_by`).
4. **Dependência real vira relação nativa (`blocked_by` / `blocking`)** contra as issues da mesma leva e do backlog aberto (ver `references/gh-cli.md`); se a API não estiver disponível, registre `Bloqueado por #NN` explícito no corpo.
5. **Épico define as próprias sub-issues** na mesma entrega (salvo exceção explícita de scoping pendente).
6. **Publique direto após a entrevista** (exceto com `--review`, issue de outro autor no modo Revisar, ou fechar/apagar issue — sempre pergunte nesses casos).
7. **Projeto e Milestone:** se o repo tiver exatamente 1 Project V2 aberto, adicione toda issue criada a ele (sem mover o Status padrão) e vincule ao Milestone ativo (`Fase 3 — MVP (Estágio 1)` etc.). Se faltar escopo `project` no `gh`, avise o comando exato (`gh auth refresh -s project`) e continue sem perder o trabalho.

---

## Fluxo de Criação

1. **Classifique o tipo** (`Feature`, `Bug`, `Task / Chore`, `Spike`, `Epic`) — anatomias detalhadas em `references/padroes.md`.
2. **Explore o repositório e entreviste** apenas o que não está fechado nos docs/código. Teste de suficiência: alguém lendo só a issue e o código consegue montar o plano sem precisar fazer perguntas ao autor?
3. **Escreva** usando o formato canônico do Panelada + contexto executável (caminhos prováveis, símbolos, comando de validação, links de ADRs/RNs). Corte seções vazias em vez de preencher `N/A`.
4. **Autoavalie** com a rubrica de `references/revisao.md` (nota mínima **16/20** antes de publicar).
5. **Publique** usando `--body-file .plans/tmp-issue-body.md` (nunca body inline com aspas!) na ordem das dependências (épico antes das filhas, bloqueadora antes da bloqueada) e remova `.plans/tmp-issue-body.md` depois. Com `--review`, grave em `.pending-issues/{slug}.md` com bloco de metadados `<!-- ... -->` (removido antes de publicar).
6. **Feche relações e projeto:** adicione ao Project V2, confirme labels oficiais, aplique milestone, registre `blocked_by`/`blocking` e sub-issues, e entregue um resumo curto com URLs e relações.

---

## Fluxo de Revisão

1. Busque a issue: `gh issue view N --json title,body,labels,comments,author,milestone`.
2. **Verifique fatos contra o repositório** (`rg` em `apps/`/`packages/`/`docs/`, `git log`, cross-refs `#N`) antes de pontuar.
3. Aplique a rubrica de 10 dimensões de `references/revisao.md`:
   - **16–20 (Pronta):** confirme brevemente e siga.
   - **10–15 (Ajustar):** reescreva no formato canônico do Panelada preservando todo o conteúdo factual (aplique com `gh issue edit` se for do próprio usuário; se for de outra pessoa ou `--review`, salve em `.pending-issues/issue-N.md` e pergunte).
   - **0–9 (Bloqueada):** entreviste ou entregue perguntas objetivas que destravam.

---

## Fluxo de Auditoria

Use o script local para triagem estrutural em lote (rápido e determinístico):

```bash
python3 .agents/skills/github-issue-craft/scripts/audit_issues.py --state open --limit 100
python3 .agents/skills/github-issue-craft/scripts/audit_issues.py --min-score 12
```

Pegue as 5–10 piores notas, aplique a rubrica semântica (`references/revisao.md`) e apresente um plano de saneamento antes de editar em massa.

---

## Arquivos desta Skill

- `references/padroes.md` — anatomias por tipo, títulos, critérios de aceite e fatiamento
- `references/revisao.md` — rubrica de 10 dimensões (0–20) e formato do parecer
- `references/gh-cli.md` — receitas de `gh` CLI (issues, sub-issues, dependências, Projects V2)
- `references/issue-forms.md` — referência para manutenção de `.github/ISSUE_TEMPLATE/`
- `scripts/audit_issues.py` — auditoria heurística em lote adaptada aos IDs e labels do Panelada
