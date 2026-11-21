# Revisão e auditoria de issues

Índice:
- [Rubrica de 10 dimensões](#rubrica-de-10-dimensões)
- [Sinais de alerta](#sinais-de-alerta)
- [Formato do parecer](#formato-do-parecer)
- [Comentário de triagem](#comentário-de-triagem)
- [Auditoria em lote](#auditoria-em-lote)

---

## Rubrica de 10 dimensões

Pontue cada dimensão em **0 / 1 / 2**. Total 0–20.
Regra de leitura: 0 = ausente ou inútil · 1 = presente mas insuficiente · 2 = pronto para uso.

Julgue pelo tipo da issue. Um chore de upgrade de dependência não precisa de "quem é o usuário" — nesses casos, a dimensão vale 2 se o que faz sentido para o tipo está lá.

| # | Dimensão | 0 | 1 | 2 |
|---|---|---|---|---|
| 1 | **Título** | Vago ("bug no login") ou enganoso | Entendível só com o corpo | Funciona isolado, buscável, ≤72 chars |
| 2 | **Problema / valor** | Não se sabe por que isso existe | Motivo genérico, sem evidência | Dor concreta, quem sente, com evidência ou justificativa |
| 3 | **Evidência** (bug: repro · feature: demanda) | Nenhuma | Passos incompletos ou log sem contexto | Reproduzível por terceiro / demanda documentada |
| 4 | **Escopo e fronteiras** | Aberto | Escopo implícito | Escopo claro + o que está fora |
| 5 | **Critérios de aceite** | Ausentes | Presentes mas subjetivos ou só caminho feliz | Verificáveis, cobrem limite e erro |
| 6 | **Contexto técnico** | Nenhum | Menção solta a um módulo | Arquivos/símbolos, comando de validação, links, versões |
| 7 | **Tamanho** | Épico disfarçado ou trivial inflado; épico sem sub-issue nenhuma | Grande mas tratável | Cabe em uma iteração ou está fatiada em sub-issues vinculadas |
| 8 | **Metadados** | Nada | Parciais | Tipo, labels no padrão do projeto, no projeto do repo, milestone quando aplicável |
| 9 | **Rastreabilidade** | Isolada, possível duplicata | Cita algo sem link | Relações explícitas (`#N`, blocked-by, PR, doc) |
| 10 | **Ambiguidade** | Cheia de termos elásticos; decisões deixadas "para a implementação" | Alguns pontos abertos | Sem termo elástico; decisões fechadas em **Decisões**; o que não pôde ser decidido marcado como `❓ A confirmar` |

**Veredito:**

- **16–20 — Pronta.** Confirme brevemente e siga. Não invente melhorias cosméticas.
- **10–15 — Ajustar.** Entregue o **corpo reescrito completo**, pronto para colar, mais 2–4 linhas dizendo o que mudou e por quê. Reescrever é o trabalho; listar sugestões é meia entrega.
- **0–9 — Bloqueada.** Faltam dados que só o autor tem. Entregue perguntas específicas e agrupadas (nunca "pode dar mais detalhes?"), e proponha a label de bloqueio do repo.

Quando a nota cai por **falta de informação** (dimensões 3 e 6), o caminho é perguntar — não inventar um corpo bonito preenchido com suposições plausíveis. Uma issue reescrita com fatos inventados é pior que a original ruim, porque parece confiável.

## Sinais de alerta

Coisas que derrubam a nota mesmo quando o texto parece bom:

- **Termos elásticos**: melhorar, otimizar, simplificar, robusto, escalável, intuitivo, adequado, "etc.", "entre outros". Cada ocorrência é uma decisão não tomada, empurrada para quem implementa.
- **Solução no lugar do problema** (dimensão 2 cai): o título prescreve a implementação e o corpo não explica a dor.
- **Critério circular**: "o bug deve estar corrigido", "a feature deve funcionar".
- **Template não preenchido**: seções com `<!-- comentário do template -->`, `N/A` em série, placeholders intactos.
- **Log despejado**: 200 linhas de stack sem indicar a linha que importa.
- **"Não funciona"** sem esperado vs. obtido — os dois são necessários; o esperado revela a premissa do autor, que às vezes é o próprio bug.
- **Conversa vira requisito**: corpo é um copia-e-cola de thread. A decisão precisa estar destilada.
- **Escopo em crescimento**: comentários adicionando trabalho novo a uma issue já fechada em escopo → propor issue derivada.
- **Épico oco**: tipo Epic sem nenhuma sub-issue vinculada. Só passa em duas situações, e ambas precisam estar explícitas na issue: o corpo já traz a descrição completa do trabalho (e aí cabe perguntar se é épico mesmo), ou o fatiamento está declaradamente bloqueado por falta de informação, com label de scoping. Fora isso, o parecer entrega o fatiamento proposto, não só a nota.
- **Zumbi**: sem atualização há meses, sem assignee, com contexto perdido. Proponha fechar com justificativa ou revalidar com o autor.
- **Duplicata quase-exata**: mesmo sintoma, título diferente. Sempre buscar antes de escrever.
- **Fato envelhecido**: arquivo movido, símbolo renomeado, comando que não existe mais, `#N` que virou outra coisa, bug já corrigido depois da abertura. Derruba as dimensões 6 e 9 e às vezes muda o veredito para "fechar" — por isso a verificação contra o repositório vem antes da nota, não depois.

## Formato do parecer

Use este formato ao revisar uma issue. Mantenha curto — o parecer não deve competir em tamanho com a issue.

```markdown
## Parecer: #<n> — <título atual>
**Nota <x>/20 — <Pronta | Ajustar | Bloqueada>**

<Uma frase sobre o problema central. Se for "Pronta", uma frase e acabou.>

**Pontos fracos**
- Dimensão N (<nome>): <o que falta, concretamente>

**Perguntas que destravam** (só se Bloqueada)
1. ...

---

### Corpo reescrito
<markdown completo, pronto para colar — só quando Ajustar>

### Metadados sugeridos
Título: `...`
Tipo/labels: `...`
Relações: `...`
```

Depois do parecer, ofereça — sem executar por conta própria: aplicar via `gh issue edit`, postar como comentário, ou apenas entregar o texto.

## Comentário de triagem

Quando o parecer vira comentário público na issue, o tom muda: é uma pessoa real do outro lado, geralmente voluntária, que gastou tempo abrindo aquilo.

Estrutura que funciona:

1. Reconheça o reporte em uma linha, sem bajulação.
2. Diga o **estado**: reproduzido / não reproduzido / precisa de informação / duplicata de #N.
3. Peça o que falta em lista numerada, com **como obter** (`node -v`, `gh --version`, "menu Ajuda → Sobre"). Pedir "sua versão" sem dizer como pegar gera mais uma rodada.
4. Diga o que acontece a seguir e em que prazo, se souber.

Nunca cole a rubrica ou a nota num comentário público — é ferramenta interna de avaliação, não feedback para o autor.

## Auditoria em lote

`scripts/audit_issues.py` cobre as dimensões mecanicamente detectáveis: presença de seções, evidência, critérios de aceite, metadados, tamanho, staleness, títulos suspeitos, possíveis duplicatas e placeholders não preenchidos. É triagem, não julgamento — a nota do script é um **filtro de atenção**.

```bash
python3 scripts/audit_issues.py --repo OWNER/REPO --state open --limit 100
python3 scripts/audit_issues.py --repo OWNER/REPO --label bug --min-score 12
python3 scripts/audit_issues.py --repo OWNER/REPO --json /tmp/audit.json
```

Ele não sabe se o critério de aceite é verificável, se o título condiz com o corpo, ou se duas issues são de fato a mesma coisa. Isso é sua parte: pegue as piores, leia, aplique a rubrica.

**Ao apresentar a auditoria**, entregue um plano, não um despejo de dados:

```markdown
## Auditoria — <repo>, <n> issues abertas
Nota média X/20 · <n> abaixo de 10 · <n> paradas há +90 dias

### Ação sugerida
| # | Título | Nota | Ação |
|---|---|---|---|
| 42 | ... | 6 | Reescrever — sem repro nem critérios |
| 17 | ... | 8 | Pedir info ao autor (versão, passos) |
| 91 | ... | 5 | Fechar — resolvida por #88 |
| 23 | ... | 9 | Fundir com #42 |

### Padrões no backlog
<2–4 observações sobre causas sistêmicas: template ausente, labels
inconsistentes, épicos sem fatias — e o que mudar no processo>
```

O bloco de padrões costuma valer mais que a tabela: se 30 issues não têm passos de reprodução, o problema é a falta de issue form, não as 30 issues. Nesse caso, proponha instalar os formulários de `references/issue-forms.md`.
