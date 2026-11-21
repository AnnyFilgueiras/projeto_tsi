# Receitas `gh` / API do GitHub

Confirme antes de qualquer escrita:

```bash
gh auth status && gh repo view --json nameWithOwner,defaultBranchRef
```

Sem `gh` autenticado, não tente contornar: entregue o markdown pronto para o usuário colar na interface web.

## Descobrir convenções do repositório

```bash
ls .github/ISSUE_TEMPLATE/ && cat .github/ISSUE_TEMPLATE/*
gh label list --limit 100
gh issue list --limit 20 --json number,title,labels,state
gh api repos/{owner}/{repo}/milestones --jq '.[] | {number, title}'
```

Issue types (nível de organização) — prefira-os a labels de categoria quando existirem:

```bash
gh api graphql -f query='{ organization(login:"ORG"){ issueTypes(first:20){ nodes{ id name } } } }' \
  --jq '.data.organization.issueTypes.nodes[].name'
```

## Criar

Sempre com `--body-file` (em `.plans/tmp-issue.md`, que é portátil entre Linux/macOS/Windows e ignorado pelo `.gitignore`; apague o arquivo após enviar). Markdown com crases, `$`, `!` e quebras de linha quebra de formas silenciosas quando passado inline.

```bash
mkdir -p .plans
cat > .plans/tmp-issue.md <<'EOF'
## 1. Contexto e Rastreabilidade
...
EOF

gh issue create --repo OWNER/REPO \
  --title "MVP-02 — Configurar monorepo, Docker Compose e eslint-plugin-boundaries" \
  --body-file .plans/tmp-issue.md \
  --label "implementacao" --label "api" \
  --milestone "Fase 3 — MVP (Estágio 1)" --assignee "@me"
rm -f .plans/tmp-issue.md
```

`gh issue create` **não** suporta issue types. Para definir tipo, use a REST API:

```bash
gh api repos/OWNER/REPO/issues -X POST \
  -f title="..." \
  -f body="$(cat .plans/tmp-issue.md)" \
  -f type="Bug" \
  -f "labels[]=implementacao" \
  --jq '{number, html_url}'
```

Criar a partir de um template do repositório (abre no navegador, útil quando o usuário quer conferir antes):

```bash
gh issue create --template "bug.yml" --web
```

## Editar

```bash
gh issue edit 42 --title "..." --body-file .plans/tmp-novo.md \
  --add-label "implementacao" --remove-label "governanca" \
  --add-assignee usuario --milestone "Fase 3 — MVP (Estágio 1)"

gh issue comment 42 --body-file .plans/tmp-comentario.md
gh issue close 42 --reason "not planned" --comment "Resolvido por #88"
gh issue reopen 42
```

Preserve o que não vai mudar: leia antes de editar.

```bash
gh issue view 42 --json title,body,labels,assignees,milestone,comments
```

## Sub-issues (hierarquia nativa)

Melhor que checklist de links: o progresso é calculado automaticamente e a hierarquia aparece em Projects.

```bash
# id interno da issue filha (≠ número da issue)
CHILD_ID=$(gh api repos/OWNER/REPO/issues/57 --jq '.id')

# vincular filha (57) ao pai (10)
gh api repos/OWNER/REPO/issues/10/sub_issues -X POST -F sub_issue_id="$CHILD_ID"

# listar
gh api repos/OWNER/REPO/issues/10/sub_issues --jq '.[] | {number, title, state}'

# desvincular
gh api repos/OWNER/REPO/issues/10/sub_issue -X DELETE -F sub_issue_id="$CHILD_ID"
```

## Dependências (bloqueia / bloqueado por)

```bash
gh api repos/OWNER/REPO/issues/42/dependencies/blocked_by \
  -X POST -F issue_id="$(gh api repos/OWNER/REPO/issues/30 --jq '.id')"

gh api repos/OWNER/REPO/issues/42/dependencies/blocked_by --jq '.[] | {number,title}'
gh api repos/OWNER/REPO/issues/42/dependencies/blocking   --jq '.[] | {number,title}'
```

Se a API de dependências não estiver disponível no plano/instância, caia para a convenção textual — mas deixe explícito no corpo: `Bloqueado por #30`.

## Buscar e listar

```bash
# duplicatas antes de criar
gh issue list --search "upload 5MB in:title,body" --state all --limit 10

# backlog sem metadados
gh issue list --state open --search "no:label no:assignee" --limit 50

# paradas
gh issue list --state open --search "updated:<2026-05-01 sort:updated-asc" --limit 50

# entre repositórios
gh search issues "sso 500" --owner ORG --state open --limit 20
```

Qualificadores úteis: `is:issue`, `label:`, `-label:`, `no:label`, `no:assignee`, `no:milestone`, `created:>=`, `updated:<`, `comments:>5`, `linked:pr`, `sort:updated-asc`.

Exportar em massa para auditoria:

```bash
gh issue list --state open --limit 200 \
  --json number,title,body,labels,assignees,milestone,createdAt,updatedAt,comments,url \
  > /tmp/issues.json
```

## Projects V2

```bash
# em quais projetos o repo está (resourcePath diz se o dono é org ou usuário)
gh repo view OWNER/REPO --json projectsV2 \
  --jq '.projectsV2.Nodes[] | select(.closed|not) | {number,title,resourcePath}'

gh project item-add 7 --owner ORG --url https://github.com/OWNER/REPO/issues/42
gh project field-list 7 --owner ORG
```

Padrão de labels praticado no projeto, por repositório — é a referência da regra 8, não a lista de labels de um repo só:

```bash
gh project item-list 7 --owner ORG --limit 300 --format json \
  --jq '.items[] | select(.content.type=="Issue") | "\(.content.repository)\t\(.labels|join(","))"' \
  | sort | uniq -c | sort -rn
```

Copiar uma label de um repositório irmão do projeto, com a mesma cor e descrição:

```bash
gh label list --repo ORG/IRMAO --json name,color,description \
  --jq '.[] | select(.name=="tech-debt")'
gh label create tech-debt --repo ORG/ALVO --color FBCA04 \
  --description "Refactoring or cleanup with no behaviour change"
```

## Instalar issue forms num repositório

Os YAMLs prontos (bug, feature, task e `config.yml`) estão em `references/issue-forms.md` — leia esse arquivo quando for instalá-los.

## Erros comuns

| Sintoma | Causa provável |
|---|---|
| `could not resolve to a Repository` | Falta `--repo`, ou fora do diretório do repo |
| Corpo com markdown quebrado | Body passado inline em vez de `--body-file` |
| `Validation Failed` ao criar | Label ou milestone inexistente — liste antes |
| `--type` não reconhecido | Flag não existe no `gh issue create`; use `gh api` |
| Sub-issue não vincula | Foi usado o número da issue no lugar do `id` interno |
| Escrita nega permissão | Token sem escopo `repo` / sem acesso de escrita |
