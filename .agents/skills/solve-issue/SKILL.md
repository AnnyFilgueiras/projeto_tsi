---
name: solve-issue
description: Implementa uma ou mais issues do GitHub do Panelada de ponta a ponta (#42 #57) — parte de `development`, lê issues e comentários, grava plano visível em `.plans/` e aguarda aprovação, implementa seguindo fronteiras (`S1`–`S8`/`A1`–`A8`), TDD e convenção bilíngue (`ADR-015`), verifica, executa `code-review`, atualiza checkboxes/Project (`Em revisão`), commita em inglês (sem atribuição de IA), dá push e abre PR em PT-BR para `development`. Use quando o usuário pedir "resolve a #42", "implementa a issue 42", "pega essa issue" ou passar URL de issue.
argument-hint: "#N [#N...] [--use-worktree] [--separate] [--no-plan] [--triage] [--draft] [--no-push] [--no-commit] [--no-cut] | --resume <plano.md>"
---

# Solve Issue (Panelada)

Recebe **um ou mais números de issue** (`#42`, `42` ou a URL) e conduz a entrega até o PR em **`development`**.

O fluxo tem um portão no meio: depois de atualizar `development` (passo 0), tudo até a aprovação do plano em `.plans/` (passo 3) é **somente leitura**. Aprovado o plano, o fluxo segue até o PR sem pedir nova confirmação — parando apenas nos [cortes de contexto](#cortes-de-contexto) (quando ativos) ou se surgir mudança relevante no plano.

> **Atalho para tarefa trivial:** se a issue for uma correção minúscula (ex.: typo ou 1 arquivo pequeno sem risco arquitetural), use `--no-cut` para evitar burocracia de múltiplos cortes de contexto.

---

## Opções

| Flag | Efeito |
|---|---|
| _(nenhuma)_ | Todas as issues num plano em `.plans/`, numa branch e num PR para `development`. |
| `--use-worktree` | Executa a entrega em um git worktree isolado via skill `using-git-worktree` (`.worktrees/<slug>`), sem alterar a branch nem exigir working tree limpo no checkout principal (ideal para resolver múltiplas issues em paralelo). |
| `--separate` | Uma branch e um PR por issue, com um único plano e aprovação (ver [Modo separado](#modo-separado)). |
| `--no-plan` | Pula a pausa de aprovação no passo 3 (o plano ainda é salvo em `.plans/` e aparece no resumo). |
| `--triage` | Age sobre achados fora de escopo do `code-review`: corrige no PR o que for pequeno/seguro ou abre issue via `github-issue-craft`. |
| `--draft` | Abre o PR como rascunho. |
| `--no-push` | Commita localmente e para (sem push/PR). |
| `--no-commit` | Deixa tudo no working tree, sugere comandos `git add` + mensagens de commit e para. |
| `--no-cut` | Roda o fluxo inteiro sem paradas de corte de contexto (ideal para tarefas pequenas). |
| `--resume <plano.md>` | Retoma após um corte de contexto a partir do arquivo em `.plans/` (pula passos 0–3). |

---

## Planos Visíveis em `.plans/` e Cortes de Contexto

**Regra multi-agente (Codex, Claude, Kimi, Antigravity):** grave **SEMPRE** o plano em **`.plans/<branch>.md`** dentro do workspace (nunca em `~/.claude/plans/` nem em diretório temporário fora do projeto). A pasta `.plans/` está no `.gitignore` para ficar visível no editor sem sujar o git.

### Memória viva do plano
Além das seções do passo 3.2, o arquivo em `.plans/<branch>.md` mantém três seções atualizadas **no momento em que o fato acontece**:
- **Decisões** — toda decisão fechada na issue ou na conversa (definitivas após um corte).
- **Armadilhas encontradas** — fatos descobertos no código/ambiente que custariam caro redescobrir.
- **Progresso** — passo atual, commits feitos (hash + assunto), o que falta e achados do review.

> **Regra de ouro antes de qualquer corte:** nunca peça `/clear` antes de gravar no arquivo `.plans/<branch>.md` todas as decisões novas, armadilhas e o próximo passo exato.

### Pontos de corte (desativados com `--no-cut`)
1. **Após aprovação do plano (passo 3.3):** implementação começa limpa lendo só os arquivos que vai editar.
2. **Com várias issues, após o commit de cada uma (exceto a última).**
3. **Verificação (passo 5) verde, antes do `code-review`:** revisão roda em contexto limpo sobre `git diff development...HEAD`.
4. **PR aberto, se `--triage` deixou issues novas para criar.**

Ao parar para um corte, encerre o turno com:
> Corte de contexto (N de M). O estado está em `.plans/<branch>.md`. Rode `/clear` e depois retome com `solve-issue --resume .plans/<branch>.md`.

Ao retomar (`--resume`): leia o arquivo inteiro; se o plano registrar `Worktree: .worktrees/<slug>`, entre nesse diretório antes de validar o estado Git. Confira `git status --porcelain`, `git branch --show-current` e `git log --oneline development..HEAD`; se divergir do **Progresso**, pare e mostre a diferença.

---

## 0. Parta da `development` atualizada

Todo trabalho da Fase 3 sai de **`development`** (nunca direto de `main`, salvo instrução explícita do usuário):

### Fluxo padrão (sem `--use-worktree`)

```bash
git status --porcelain          # precisa estar vazio
git switch development
git pull
```

- Há alterações não commitadas? Pare e pergunte antes de trocar de branch (nunca rode `stash`/`reset`/`checkout` por conta própria).
- `development` ainda não existe no remoto? Avise o usuário e confirme o ponto de partida antes de seguir.

### Fluxo isolado (com `--use-worktree`)

- **Não troque a branch** do checkout principal e **não exija** que o checkout principal esteja limpo.
- Atualize a referência base sem tocar no working tree:
  ```bash
  git fetch origin development
  ```
- Se você já estiver dentro de um worktree vinculado (Passo 0 de `using-git-worktree`), apenas confirme a branch/base atual. Caso contrário, os passos 1–3 continuam **somente leitura** e o worktree só é criado no início do **passo 4** (evitando worktrees órfãos caso o plano seja cancelado).

## 1. Leia as issues inteiras

```bash
gh issue view 42 --json number,title,body,state,labels,assignees,milestone,url,comments,projectItems
gh api repos/{owner}/{repo}/issues/42/sub_issues --jq '.[] | {number,title,state}'
gh api repos/{owner}/{repo}/issues/42/dependencies/blocked_by --jq '.[] | {number,title,state}'
```

Leia também os **comentários** (comentário mais recente vence contradição no corpo — confirme com o usuário se houver conflito). Extraia:
- **Resultado esperado** (1 frase)
- **Decisões fechadas** (siga sem reabrir)
- **Critérios de aceite** (a lista a marcar no passo 6)
- **Fora de escopo** (instrução estrita)
- **Rastreabilidade** (`US`/`UC`/`RN`/`A##`/`ADR`)

## 2. Pare se a issue não estiver pronta

| Situação | Ação |
|---|---|
| Já está `closed` | Pergunte se é para reabrir ou se o alvo é outro |
| Bloqueada por dependência aberta fora do lote | Informe e pergunte se segue mesmo assim |
| Atribuída a outra pessoa | Avise antes de começar |
| Critérios de aceite ausentes ou ambíguos | Pergunte tudo em uma rodada |
| Decisão da issue contradiz código/ADR atual | Mostre a contradição e pergunte |
| Mistura entregas distintas de camadas diferentes | Proponha fatiar com `github-issue-craft` ou confirmar o recorte |

## 3. Planeje e aguarde aprovação (somente leitura)

Até a aprovação (salvo `--no-plan`), **não edite código, não crie branch e não altere issues**. Se o harness oferecer modo plan (`EnterPlanMode`), use-o após o passo 0; se não oferecer (Codex, Kimi, Antigravity), apenas respeite o modo somente leitura e grave o plano em `.plans/<branch>.md`.

### 3.1 Situe-se no repositório (mantendo o contexto enxuto)
- Leia `AGENTS.md`, `docs/dev/GLOSSARY.md` e `docs/dev/ARCHITECTURE.md` (mais `docs/dev/PRIVACY.md` se tocar em restrições/auth/IA/logs).
- Busque código diretamente em `apps/` e `packages/` (`rg ... apps/ packages/`) para não inundar o contexto com arquivos de `docs/fase1/` e `docs/fase2/`. Só abra ADRs/OpenAPI/RNs específicos citados na issue.

### 3.2 Escreva o plano em `.plans/<branch>.md`
Inclua:
- **Resultado esperado** (por issue)
- **Abordagem e Fronteiras** (módulos/features tocados, checagem das regras `S1`–`S8`/`A1`–`A8`, `tx: Tx` se houver escrita cross-módulo, e atualização de seed se aparecer em tela)
- **Arquivos** (criar/alterar com caminho)
- **Testes** (política do Playbook 03: TDD estrito / vetores JSON / contrato / teste depois)
- **Verificação** (comandos exatos para validar cada critério de aceite)
- **Branch e commits** (em **inglês**, saindo de `development`, ex.: `feat/issue-42-short-name`; com `--use-worktree`, registre também **`Worktree: .worktrees/<slug>`** e a `<base-ref>` prevista)
- **PR** (título e resumo em **PT-BR**, base `development`, uma linha `Closes #N` por issue)
- **Fora de escopo**
- Seções vivas: **Decisões**, **Armadilhas encontradas** e **Progresso**

### 3.3 Apresente e espere
Mostre o caminho `.plans/<branch>.md` e um resumo claro do plano e **encerre o turno aguardando aprovação**. Se o plano precisar mudar de forma relevante durante a implementação, pare e peça nova aprovação.

## 4. Implemente

### Sem `--use-worktree`

Crie a branch a partir de `development`:

```bash
git switch -c feat/issue-42-short-name development
```

### Com `--use-worktree`

Acione a skill **`using-git-worktree`** para:
1. Detectar se já está em um worktree isolado (Passo 0) ou criar `.worktrees/<slug>` na branch planejada a partir de `origin/development` (ou da branch pai, quando empilhada).
2. Executar o setup do Panelada adequado ao perfil da issue (Perfil A sem `pnpm install` para docs/UX/protótipo HTML; Perfil B com `pnpm install --frozen-lockfile` + baseline `TZ=UTC` para código) e respeitar a serialização de `panelada_test` em testes de integração.
3. Copiar/mover `.plans/<branch>.md` para `.plans/` dentro do worktree (mantendo o caminho atualizado no campo `Worktree:` para eventuais `--resume`) e executar os passos 4–7 inteiramente dentro do worktree.

- Implemente uma issue por vez na ordem do plano, commitando cada uma ao ficar verificada.
- Siga a skill **`tdd`** nas camadas de TDD estrito/contrato/regressão (Playbook 03) e a skill **`code-comments`** (comentários em inglês explicando o *porquê*, citando `RN##`/`A##`/`ADR-###`).
- **Seed vivo:** se a feature aparece em tela (a partir de `MVP-02`), estenda o seed de desenvolvimento no mesmo PR.
- **Docs vivos:** se mudou convenção ou contrato, atualize `docs/dev/` (e `openapi.yaml`/Bruno se mudou rota) no mesmo PR.
- Registre qualquer armadilha descoberta imediatamente em `.plans/<branch>.md`.

## 5. Verifique

Rode todas as verificações disponíveis no repositório (lint incluindo `eslint-plugin-boundaries`, `format:check`, `typecheck`, testes unitários e integração com `TZ=UTC`, validação do `openapi.yaml` se alterado).
- Quando passar, reporte só o resumo; quando falhar, mostre a saída completa com traceback.
- **Nunca siga para o push com verificação vermelha.**

### 5.1 Rode a skill `code-review` (em contexto limpo)
Faça o corte 3 (salvo `--no-cut`) e execute a skill **`code-review`** sobre `git diff development...HEAD`.
- **Confirmado no escopo:** corrija, revalide o passo 5 e inclua no commit (`--amend` se for o último, ou `fix:` próprio com `See #N`).
- **Fora de escopo:** sem `--triage`, relate no resumo final; com `--triage`, corrija no PR apenas o que for pequeno/baixo risco ao lado do código já tocado, ou abra issue via `github-issue-craft` após abrir o PR.
- **Duvidoso:** relate ao usuário sem alterar código por palpite.

## 6. Atualize as issues

1. Baixe o corpo atualizado em `.plans/tmp-issue-42.md` (`gh issue view 42 --json body --jq '.body' > .plans/tmp-issue-42.md`), marque `- [x]` **apenas** nos critérios efetivamente verificados no passo 5 (sem alterar texto/ordem nem marcar sub-issues `#NN`), envie com `gh issue edit 42 --body-file .plans/tmp-issue-42.md` e apague o arquivo temporário.
2. **Não feche a issue manualmente** (salvo pedido explícito do usuário). O fechamento virá do `Closes #N` quando a entrega chegar à branch padrão.

## 7. Entregue

### 7.1 Commits (em inglês — ADR-015, sem atribuição de IA)
Um commit por issue, adicionando arquivos explicitamente pelo caminho (nunca `git add -A` nem `git add .`). Formato:

```text
feat(allergen-rules): enforce fail-closed check for unverified recipes

See #42
```

**Proibido:** nunca adicione `Co-Authored-By` ou qualquer menção/rodapé de IA em commits, código ou PRs.

### 7.2 Push e PR (em PT-BR — base `development`)
Escreva o corpo do PR em `.plans/tmp-pr-body.md`, abra o PR apontando para **`development`** e apague o arquivo temporário:

```bash
git push -u origin feat/issue-42-short-name
gh pr create --base development --title "US01 — Filtrar sugestões por restrição alimentar" --body-file .plans/tmp-pr-body.md
```

- **Corpo do PR (PT-BR):** resumo curto do que mudou + uma linha `Closes #N` por issue (nunca agrupe `Closes #42, #57` na mesma linha) + nota de variável de ambiente/deploy se houver. Zero atribuição de IA.
- **Lembrete sobre branch default:** se `main` for a branch padrão do repositório, o `Closes #N` só fecha a issue automaticamente na promoção `development` → `main` — não trate isso como erro.

### 7.3 Atualize Status no Project (`Em revisão`)
Se a issue estiver em exatamente 1 Project V2 com coluna `Em revisão` (ou `In review`), mova o Status para ela. Se faltar escopo `project` no `gh`, informe `gh auth refresh -s project` no resumo.

### 7.4 Higiene local e Registro Acadêmico
- **Plano local:** avise que o plano em `.plans/<branch>.md` pode ser removido após o merge (ou remova-o se o fluxo terminou sem corte 4 pendente).
- **Worktree (`--use-worktree`):** **não** remova o worktree automaticamente enquanto o PR puder receber revisão; informe no resumo final o caminho `.worktrees/<slug>` e o comando de limpeza pós-merge (`git worktree remove .worktrees/<slug>`).
- **`STATE.md` e Diário de Bordo:** na Fase 3, **não** atualize `STATE.md` em todo micro-PR (para evitar conflitos de merge em paralelo). Atualize `STATE.md` e `diario_de_bordo` quando a issue fechar um **marco/etapa relevante** (`GOV-##`, `MVP-01`–`MVP-04`, decisão arquitetural) ou na promoção semanal `development` → `main`.

### 7.5 Resumo final
Feche o turno em poucas linhas com: URL do PR (ou ponto de parada pelas flags), resumo por issue, o que foi marcado/não marcado nas issues, achados fora de escopo (e destino se `--triage`), caminho/limpeza do worktree (se `--use-worktree`), e lembrete de `STATE.md`/Diário se fechou marco.

---

## Modo Separado (`--separate`)

Um plano único com um bloco por issue (branch, base, commits, PR) e uma aprovação. Sem dependência no lote → sai de `development` com PR para `development`; bloqueada por outra do lote → sai da branch da bloqueadora com PR empilhado para ela (avisando para re-apontar para `development` se o repo não apagar branches no merge). Combinado com `--use-worktree`, cada branch independente (ou empilhada) recebe seu próprio worktree em `.worktrees/<slug>`, permitindo executar múltiplas sub-issues em paralelo.

## Sem `gh` disponível

Se `gh auth status` falhar, implemente e commite normalmente (como `--no-push`) e entregue o corpo atualizado da issue e o texto do PR prontos para colar no GitHub.
