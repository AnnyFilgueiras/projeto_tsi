# Issue forms (`.github/ISSUE_TEMPLATE/`)

Instale isto num repositório quando a auditoria revelar um padrão sistêmico —
muitas issues sem passos de reprodução, sem versão, sem critérios de aceite.
Nesse caso o problema não são as issues, é a ausência de formulário: corrigir
30 issues uma a uma não impede a 31ª.

Formulários em YAML (issue forms) são superiores a templates markdown porque
permitem **campos obrigatórios** — o autor não consegue abrir a issue sem
informar versão e passos.

```bash
mkdir -p .github/ISSUE_TEMPLATE
# criar os arquivos abaixo, ajustando OWNER/REPO no config.yml
```

Os arquivos só valem depois de mergeados na branch padrão.
Ajuste os `labels` para labels que **existem** no repositório, senão o GitHub
ignora silenciosamente.

## `bug_report.yml`

```yaml
name: Bug
description: Algo se comporta de forma diferente do esperado
labels: ["bug", "triage"]
body:
  - type: markdown
    attributes:
      value: |
        Antes de abrir: confira se já existe uma issue com o mesmo sintoma.
        Passos de reprodução são o que mais acelera a correção.

  - type: textarea
    id: resumo
    attributes:
      label: Resumo
      description: Uma frase — o que quebra e em que condição.
    validations:
      required: true

  - type: textarea
    id: reproducao
    attributes:
      label: Passos para reproduzir
      description: Comece de um estado conhecido (usuário novo, banco limpo, branch main).
      value: |
        1. A partir de ...
        2.
        3.
    validations:
      required: true

  - type: textarea
    id: esperado
    attributes:
      label: Comportamento esperado
      description: O que deveria acontecer — e por quê (documentação, contrato, versão anterior).
    validations:
      required: true

  - type: textarea
    id: obtido
    attributes:
      label: Comportamento obtido
    validations:
      required: true

  - type: textarea
    id: evidencia
    attributes:
      label: Evidência
      description: Trecho relevante do log ou stack trace, print, vídeo. Não cole o arquivo inteiro.
      render: shell

  - type: input
    id: versao
    attributes:
      label: Versão / commit
      placeholder: v2.3.1 ou a1b2c3d
    validations:
      required: true

  - type: input
    id: ambiente
    attributes:
      label: Ambiente
      placeholder: macOS 15 · Chrome 140 · Node 22 · staging
    validations:
      required: true

  - type: dropdown
    id: frequencia
    attributes:
      label: Frequência
      options:
        - Sempre
        - Intermitente
        - Aconteceu uma vez
    validations:
      required: true

  - type: textarea
    id: impacto
    attributes:
      label: Impacto e contorno
      description: Quem é afetado, com que gravidade. Existe alguma forma de contornar?

  - type: checkboxes
    id: checks
    attributes:
      label: Confirmações
      options:
        - label: Busquei issues existentes com o mesmo sintoma
          required: true
        - label: Testei na versão mais recente disponível
```

## `feature_request.yml`

```yaml
name: Feature
description: Uma capacidade nova ou melhoria de comportamento
labels: ["enhancement", "triage"]
body:
  - type: textarea
    id: problema
    attributes:
      label: Problema
      description: Quem sente, em que situação, qual o custo hoje. Evidência ajuda (ticket, métrica, pesquisa).
    validations:
      required: true

  - type: textarea
    id: resultado
    attributes:
      label: Resultado esperado
      description: O que passa a ser possível. Descreva o resultado, não a implementação.
    validations:
      required: true

  - type: textarea
    id: criterios
    attributes:
      label: Critérios de aceite
      description: Afirmações verificáveis por terceiro. Cubra caminho feliz, limite e erro.
      value: |
        - [ ] 
        - [ ] 
        - [ ] 
    validations:
      required: true

  - type: textarea
    id: fora
    attributes:
      label: Fora de escopo
      description: O que este trabalho explicitamente não cobre.

  - type: textarea
    id: alternativas
    attributes:
      label: Alternativas consideradas

  - type: textarea
    id: contexto
    attributes:
      label: Contexto adicional
      description: Links, protótipos, decisões anteriores, dependências.
```

## `task.yml`

```yaml
name: Task / Chore
description: Trabalho técnico sem mudança de comportamento visível
labels: ["chore"]
body:
  - type: textarea
    id: objetivo
    attributes:
      label: Objetivo
      description: O que muda, em uma frase.
    validations:
      required: true

  - type: textarea
    id: motivacao
    attributes:
      label: Por que agora
      description: Dívida que trava algo, CVE, deprecação com data, atrito recorrente.
    validations:
      required: true

  - type: textarea
    id: escopo
    attributes:
      label: Escopo
      description: Arquivos, módulos ou serviços afetados.

  - type: textarea
    id: criterios
    attributes:
      label: Critérios de aceite
      value: |
        - [ ] 
        - [ ] Comportamento externo inalterado
        - [ ] Testes e lint passando
    validations:
      required: true

  - type: textarea
    id: risco
    attributes:
      label: Risco e reversão
```

## `config.yml — seletor de template`

```yaml
blank_issues_enabled: false
contact_links:
  - name: Dúvidas e suporte
    url: https://github.com/OWNER/REPO/discussions
    about: Para perguntas de uso, prefira Discussions — issues são para trabalho rastreável.
  - name: Guia de contribuição
    url: https://github.com/OWNER/REPO/blob/main/CONTRIBUTING.md
    about: Leia antes de abrir issues ou PRs.
  - name: Vulnerabilidades de segurança
    url: https://github.com/OWNER/REPO/security/advisories/new
    about: Não abra issue pública para falhas de segurança.
```

`blank_issues_enabled: false` força o uso dos formulários — quem tem permissão
de escrita ainda vê a opção em branco, marcada como "Maintainers only".
`contact_links` desvia perguntas de suporte para Discussions, o que reduz muito
o volume de issues que não são trabalho rastreável.
