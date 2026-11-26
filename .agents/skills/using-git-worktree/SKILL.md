---
name: using-git-worktree
description: Cria e prepara um git worktree isolado para o Panelada (`.worktrees/<slug>`) a partir de `development` (ou de uma branch pai em sub-issues empilhadas), permitindo resolver múltiplas issues em paralelo sem sujar o checkout principal. Use quando iniciar trabalho que precise de isolamento, ao rodar múltiplas issues em paralelo ou quando acionado por `solve-issue --use-worktree`.
---

# Using Git Worktree (Panelada)

## Visão Geral

Garante que a implementação ocorra em um workspace Git isolado, mantendo o checkout principal livre para trabalhar em múltiplas issues em paralelo (ex.: `MVP-04D` `#42` junto com `UX-01` `#60`–`#68`, ou múltiplas sub-issues independentes).

**Princípio central:** detecte isolamento existente primeiro → prefira ferramentas nativas de worktree do harness → recorra a `git worktree` manual em `.worktrees/` apenas se não houver ferramenta nativa. Nunca brigue com o harness.

**Anuncie no início:** "Usando a skill `using-git-worktree` para preparar um workspace isolado."

---

## Passo 0: Detectar Isolamento Existente

**Antes de criar qualquer coisa, verifique se você já está em um worktree vinculado:**

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

**Guarda de submódulo:** `GIT_DIR != GIT_COMMON` também ocorre dentro de submódulos Git. Confirme que não é submódulo:

```bash
# Se retornar um caminho, você está em um submódulo — trate como checkout normal
git rev-parse --show-superproject-working-tree 2>/dev/null
```

- **Se `GIT_DIR != GIT_COMMON` (e não for submódulo):** você já está em um worktree isolado. **Pule para o Passo 2 (Setup do Panelada).** Não crie outro worktree aninhado.
  - Em branch nomeada: informe `"Já em workspace isolado em <caminho> na branch <nome>."`
  - Em `detached HEAD`: informe `"Já em workspace isolado em <caminho> (detached HEAD). Criar branch antes do push."`
- **Se `GIT_DIR == GIT_COMMON`:** você está no checkout principal.
  - Se o usuário já pediu worktree explicitamente (ou via `solve-issue --use-worktree`), prossiga sem perguntar novamente.
  - Caso contrário, peça confirmação antes de criar: *"Deseja criar um worktree isolado em `.worktrees/` para não afetar o checkout atual?"*

---

## Passo 1: Criar o Workspace Isolado

### 1a. Ferramenta Nativa do Harness (preferida)

Se o agente/harness oferecer ferramenta nativa de worktree (ex.: `EnterWorktree`, `WorktreeCreate`, comando `/worktree` ou workspace `share`/`branch`), **use-a** e pule para o Passo 2. Ferramentas nativas gerenciam caminho, branch e limpeza; rodar `git worktree add` por fora cria estado invisível ao harness.

### 1b. Fallback Manual com `git worktree`

Use somente se não houver ferramenta nativa disponível.

#### 1. Local padrão e verificação de segurança

No Panelada, o diretório canônico de worktrees locais é **`.worktrees/`** na raiz do repositório (já ignorado em `.gitignore`, `eslint.config.mjs`, `.prettierignore` e `.dockerignore`).

**Sempre confirme que `.worktrees` está ignorado antes de criar:**

```bash
git check-ignore -q .worktrees/
```

Se retornar código diferente de `0`, adicione `.worktrees/` ao `.gitignore` (e `eslint.config.mjs`/`.prettierignore`/`.dockerignore`) antes de prosseguir. **Nunca crie um worktree em diretório não ignorado.**

#### 2. Branch base (`development` ou branch pai)

No Panelada, toda branch de trabalho sai de **`development` atualizada** (nunca de `main`, salvo instrução explícita) — ou de uma **branch pai/bloqueadora** quando trabalhando em sub-issues empilhadas (ex.: sub-issues `#61`–`#68` saindo da branch da `#60` antes do merge na `development`).

Atualize a referência remota **sem trocar a branch nem mexer no working tree do checkout principal**:

```bash
git fetch origin development
```

- Se a base for `development`, prefira `origin/development` (ou `development` local se estiver à frente com commits ainda não enviados).
- Se a base for uma branch pai (ex.: `docs/issue-60-ux-transverse`), use essa branch como `<base-ref>`.

#### 3. Nome do diretório (`<slug>`) e criação

Branches do Panelada seguem `ADR-015` em inglês com barra (`feat/issue-42-mobile-foundation`, `docs/issue-61-ux-onboarding`). Para evitar subdiretórios aninhados e caminhos longos no Windows, achate `/` para `-` no nome da pasta do worktree:

```bash
# Exemplo:
# BRANCH_NAME="docs/issue-61-ux-onboarding"
# SLUG="docs-issue-61-ux-onboarding"
# BASE_REF="origin/development"   # ou a branch pai, ex.: docs/issue-60-ux-transverse

git worktree add ".worktrees/$SLUG" -b "$BRANCH_NAME" "$BASE_REF"
cd ".worktrees/$SLUG"
```

> **Branch já existente (ex.: retomada ou PR em andamento):** use `git worktree add ".worktrees/$SLUG" "$BRANCH_NAME"` (sem `-b`).

**Fallback de sandbox:** se `git worktree add` falhar por restrição de permissão do sandbox, informe o usuário claramente e trabalhe no diretório atual (sem forçar contorno).

---

## Passo 2: Setup do Projeto Panelada no Worktree

Escolha o perfil conforme as camadas tocadas pela issue:

### Perfil A — Issue apenas de documentação / UX / protótipo HTML (`docs/`, `UX-01` `#60`–`#68`, governança)

Não altera código em `packages/` ou `apps/` nem precisa rodar `pnpm test`/`typecheck`:
- **Pule `pnpm install`** (economiza tempo e centenas de MB de `node_modules`).
- Garanta `.plans/` disponível no worktree se for gravar plano/arquivos temporários do `gh`.

### Perfil B — Issue de código (`packages/allergen-rules`, `apps/api`, `apps/mobile`, scripts/config)

1. **Dependências (`pnpm` do monorepo, sem precisar de instalação global):**
   ```bash
   # Reaproveita o binário pnpm já instalado no checkout principal (ou use `pnpm` se estiver no PATH)
   ../../node_modules/.bin/pnpm install --frozen-lockfile
   # Alternativa caso o checkout principal ainda não tenha node_modules:
   # npx --yes pnpm install --frozen-lockfile
   ```
2. **Variáveis de ambiente locais (`.env`):**
   `.env` é ignorado pelo Git e não é copiado automaticamente. Se o worktree precisar rodar testes de integração ou scripts `db:*`, copie o `.env` da raiz principal (ou `.env.example` como base) **sem nunca commitar `.env`**:
   ```bash
   cp ../../.env .env 2>/dev/null || true
   ```
3. **Espelhamento de skills para Claude Code (opcional):**
   Se for abrir o Claude Code dentro do worktree, rode uma vez:
   ```bash
   node scripts/setup-agent-skills.mjs
   ```

### Atenção — Concorrência de Docker e Banco (`panelada_dev` / `panelada_test`)

Todos os worktrees compartilham, por padrão, o mesmo `docker-compose.yml` do host (PostgreSQL na porta `5432` com `panelada_dev`/`panelada_test` e API na porta `3000`):

- **100% seguro rodar em paralelo entre worktrees:** `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm contracts:lint`, `pnpm contracts:check` e **`TZ=UTC pnpm test`** (unitários + Jest mobile — não acessam PostgreSQL).
- **NÃO rode em paralelo contra o mesmo banco:** `TZ=UTC pnpm test:integration`, `pnpm db:migrate`, `pnpm db:seed` e `pnpm db:reset`. Eles truncam/recriam `panelada_test` (ou `panelada_dev`) e causam corrida se dois worktrees executarem ao mesmo tempo.
  - **Regra:** serialize comandos de banco/integração (um worktree por vez) ou aponte `DATABASE_URL` no `.env` do worktree para um banco/porta isolado mantendo obrigatoriamente o sufixo `_test` (trava `assertTestDatabaseUrl`).

---

## Passo 3: Validar Baseline Limpo

- **Perfil A (docs/UX/protótipo):** confirme `git status --porcelain` vazio e que `git log -1 --oneline` corresponde ao `<base-ref>` esperado.
- **Perfil B (código):** rode a verificação rápida com `TZ=UTC` obrigatório:
  ```bash
  ./node_modules/.bin/pnpm typecheck && TZ=UTC ./node_modules/.bin/pnpm test
  ```
  - Se falhar no baseline: reporte as falhas completas e pergunte ao usuário se deve investigar ou prosseguir.
  - Se passar: reporte pronto.

### Formato de Relatório

```text
Worktree pronto em .worktrees/<slug> (branch <BRANCH_NAME> a partir de <BASE_REF>)
Perfil: <docs/UX (sem install) | código (pnpm + baseline verde: N testes, 0 falhas)>
Pronto para trabalhar em <issue/feature>.
```

---

## Passo 4: Padrões Paralelos e Limpeza (Teardown)

### Trabalho paralelo em Issue Pai + Sub-issues (ex.: `#60` + `#61`–`#68`)

1. **Decisões transversais primeiro (`#60`):** conclua a issue pai em um worktree próprio a partir de `origin/development` (ou integre-a na `development`).
2. **Sub-issues em paralelo (`#61`–`#68`):** cada sub-issue ganha seu próprio worktree (`.worktrees/<slug>`) saindo de `origin/development` (se a pai já foi integrada) **ou** da branch da issue pai (PR empilhado, informando `--base <branch-pai>`).
3. **Sem conflito em `STATE.md` / Diário:** conforme `AGENTS.md` e `Playbook 01`, não atualize `STATE.md` nem o Diário de Bordo em cada sub-issue paralela; consolide o registro ao fechar o marco pai ou na promoção `development` → `main`.

### Limpeza após merge (ou descarte)

Worktrees mantêm a branch travada e acumulam `node_modules` em disco. **Não remova o worktree enquanto o PR ainda estiver em revisão** (pode haver ajustes). Após o merge (ou descarte), execute a partir do checkout principal:

```bash
git worktree remove .worktrees/<slug>
git worktree prune
# Se a branch já foi integrada em development:
git branch -d <BRANCH_NAME>
```

---

## Referência Rápida

| Situação | Ação |
|---|---|
| Já está em worktree vinculado (`GIT_DIR != GIT_COMMON`) | Pule a criação (Passo 0) |
| Dentro de submódulo | Trate como checkout normal (guarda do Passo 0) |
| Harness tem ferramenta nativa de worktree | Use-a (Passo 1a) |
| Sem ferramenta nativa | `git worktree add .worktrees/<slug> -b <branch> <base-ref>` (Passo 1b) |
| `.worktrees` não ignorado | Bloqueie e adicione ao `.gitignore` antes de criar |
| Issue só de `docs/` ou protótipo HTML (`UX-01`) | Perfil A — pule `pnpm install` |
| Issue de código (`packages/`, `apps/`) | Perfil B — `pnpm install --frozen-lockfile` + `TZ=UTC pnpm test` |
| Testes de integração em 2 worktrees simultâneos | Serialize ou use banco `*_test` isolado |
| Pós-merge do PR | `git worktree remove .worktrees/<slug>` no checkout principal |
