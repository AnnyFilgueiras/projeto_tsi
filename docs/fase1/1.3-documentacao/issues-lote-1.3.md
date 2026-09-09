# Lote de Issues — Fase 1.3 (uma issue por US)

> **Como usar:** 18 issues (US01–US18), no formato obrigatório do briefing 1.3. Para cada uma: copie o título, cole o corpo, aplique as labels e o milestone indicados.
> **Labels:** todas levam `elicitacao` (fase de origem) + a label de prioridade (`must`, `should` ou `could`).
> **Milestone (todas):** `Fase 1 — Engenharia de Requisitos`.
> **Nota sobre "Origem":** US04, US11, US16 (Should) e US13, US17 (Could) não têm UC especificado nesta versão — o campo UC fica "—" com a referência de onde o comportamento está coberto. RN19 (pontuação) permanece provisória e **não** vira issue Must (pendência da 1.2).
> Alternativa automatizada: rodar o script `criar-issues.sh` (mesma base de texto) com o GitHub CLI.

---

## Issue 1 — Must

**Título:** `US01 — Receber sugestões de pratos alinhadas ao perfil`
**Labels:** `must`, `elicitacao`

```markdown
## História
Como Marina, quero receber sugestões de pratos alinhadas ao meu perfil, para decidir rápido o que cozinhar sem cair na rolagem infinita.

## Critérios de aceite
- Dado que meu perfil tem preferências e restrições cadastradas, quando abro as sugestões, então vejo apenas pratos compatíveis com elas.
- Dado que já preparei um prato, quando recebo sugestões, então ele não é apresentado como novidade.

## Origem
RF01 | UC01 | Prioridade: Must
```

---

## Issue 2 — Must

**Título:** `US02 — Aprovar ou descartar sugestões com um toque`
**Labels:** `must`, `elicitacao`

```markdown
## História
Como Marina, quero aprovar ou descartar cada sugestão com um toque, para montar minha lista de candidatos sem fricção.

## Critérios de aceite
- Dado que estou vendo uma sugestão, quando a descarto, então a próxima sugestão aparece e a descartada não retorna naquela sessão.
- Dado que aprovei uma sugestão, quando a aprovo, então ela fica marcada como "escolhida" e disponível para o planejamento.

## Origem
RF02 | UC02 | Prioridade: Must
```

---

## Issue 3 — Must

**Título:** `US03 — Informar os ingredientes disponíveis em casa`
**Labels:** `must`, `elicitacao`

```markdown
## História
Como Rafael, quero informar os ingredientes que tenho em casa, para descobrir o que dá para cozinhar na hora.

## Critérios de aceite
- Dado que registrei meus ingredientes disponíveis, quando peço sugestões, então vejo pratos que usam esses ingredientes.
- Dado que um prato sugerido exige ingredientes faltantes, quando o visualizo, então os faltantes aparecem claramente destacados.

## Origem
RF03 | UC03 | Prioridade: Must
```

---

## Issue 4 — Must

**Título:** `US05 — Visualizar receita completa com passo a passo`
**Labels:** `must`, `elicitacao`

```markdown
## História
Como Cleusa, quero ver a receita com foto, tempo, dificuldade, ingredientes e passo a passo, para avaliar se consigo prepará-la.

## Critérios de aceite
- Dado que abro uma receita, quando a tela carrega, então vejo imagem, tempo de preparo, nível de dificuldade, lista de ingredientes e passo a passo numerado.
- Dado que estou no passo a passo, quando avanço um passo, então o passo atual fica destacado.

## Origem
RF10 | UC04 | Prioridade: Must
```

---

## Issue 5 — Must

**Título:** `US06 — Montar plano de refeições da semana ou quinzena`
**Labels:** `must`, `elicitacao`

```markdown
## História
Como Marina, quero montar o plano de refeições da semana ou da quinzena associando cada prato a uma data de preparo, para organizar minha rotina.

## Critérios de aceite
- Dado que tenho pratos marcados como "escolhidos", quando monto o plano, então consigo associar cada prato a uma data de preparo.
- Dado que escolhi o período (semana ou quinzena), quando visualizo o plano, então vejo os pratos organizados por data.
- Dado que um prato já tem data, quando o reagendo, então a nova data substitui a anterior.

## Origem
RF04 | UC05 | Prioridade: Must
```

---

## Issue 6 — Must

**Título:** `US07 — Gerar lista de compras consolidada do plano`
**Labels:** `must`, `elicitacao`

```markdown
## História
Como Marina, quero que o app gere a lista de compras consolidada do meu plano, com data de compra, para comprar os ingredientes com calma.

## Critérios de aceite
- Dado que meu plano tem pratos com datas, quando gero a lista de compras, então ela consolida os ingredientes de todos os pratos, sem itens duplicados.
- Dado que a lista foi gerada, quando a visualizo, então consigo definir a data de compra e marcar cada item como comprado.

## Origem
RF05 | UC06 | Prioridade: Must
```

---

## Issue 7 — Must

**Título:** `US08 — Receber lembretes de compra e preparo`
**Labels:** `must`, `elicitacao`

```markdown
## História
Como Cleusa, quero receber lembretes nas datas de compra e de preparo, para não esquecer o que planejei.

## Critérios de aceite
- Dado que defini uma data de compra, quando ela chega, então recebo uma notificação com a lista de compras.
- Dado que defini uma data de preparo, quando ela se aproxima, então recebo um lembrete indicando o prato do dia.
- Dado que desativei os lembretes nas configurações, quando uma data chega, então nenhuma notificação é enviada.

## Origem
RF06 | UC07 | Prioridade: Must
```

---

## Issue 8 — Must

**Título:** `US09 — Cadastrar restrições alimentares e receber alertas de alérgenos`
**Labels:** `must`, `elicitacao`

```markdown
## História
Como Cleusa, quero cadastrar as restrições alimentares da família no perfil e ser alertada sobre alérgenos, para cozinhar com segurança.

## Critérios de aceite
- Dado que cadastrei uma restrição (ex.: diabetes), quando recebo sugestões, então pratos incompatíveis são filtrados ou claramente sinalizados.
- Dado que uma receita contém um alérgeno comum (ex.: glúten, lactose, amendoim), quando a visualizo, então o alerta de alérgeno é exibido.

## Origem
RF07 | UC08 | Prioridade: Must
```

---

## Issue 9 — Must

**Título:** `US10 — Ver substituições sugeridas para ingredientes`
**Labels:** `must`, `elicitacao`

```markdown
## História
Como Cleusa, quero ver substituições sugeridas para ingredientes que não tenho ou não posso consumir, para adaptar receitas sem desistir delas.

## Critérios de aceite
- Dado que um ingrediente da receita está marcado como indisponível ou restrito no meu perfil, quando visualizo a receita, então vejo ao menos uma substituição sugerida para ele.
- Dado que não há substituto cadastrado, quando visualizo o ingrediente, então o sistema informa isso explicitamente, em vez de inventar uma troca.

## Origem
RF08 | UC09 | Prioridade: Must
```

---

## Issue 10 — Must

**Título:** `US12 — Registrar avaliação de prato concluído com histórico`
**Labels:** `must`, `elicitacao`

```markdown
## História
Como Cleusa, quero registrar nota, relato e alterações de cada prato que fiz, mantendo meu histórico, para ter meu caderno digital de receitas.

## Critérios de aceite
- Dado que concluí um prato, quando registro a avaliação, então apenas a nota é obrigatória; relato e alterações são opcionais (RNF10).
- Dado que tenho avaliações, quando acesso o histórico, então vejo cada preparo com data, nota e alterações.
- Dado que repeti um prato, quando o registro novamente, então o histórico guarda os dois preparos separadamente.

## Origem
RF11 | UC10 | Prioridade: Must
```

---

## Issue 11 — Must

**Título:** `US14 — Ver coleção de pratos por país/culinária com progresso`
**Labels:** `must`, `elicitacao`

```markdown
## História
Como Rafael, quero ver minha coleção de pratos por país/culinária com o progresso, para saber o que falta completar.

## Critérios de aceite
- Dado que concluí pratos, quando abro a coleção, então os vejo agrupados por culinária com o percentual de progresso de cada uma.
- Dado que uma culinária está incompleta, quando a visualizo, então vejo quantos pratos faltam.

## Origem
RF13 | UC11 | Prioridade: Must
```

---

## Issue 12 — Must

**Título:** `US18 — Importar e manter catálogo de receitas (curador)`
**Labels:** `must`, `elicitacao`

```markdown
## História
Como curador de conteúdo, quero importar e manter o catálogo de receitas com todos os atributos, para que o app tenha conteúdo confiável.

## Critérios de aceite
- Dado que importo uma receita de plataforma pública, quando a cadastro, então registro fonte, ingredientes, utensílios, dificuldade, tempo e alérgenos (RNF08).
- Dado que uma receita faz parte de uma cadeia, quando a cadastro, então indico qual é o prato base.

## Origem
RF18 | UC12 | Prioridade: Must
```

---

## Issue 13 — Should (primeiro dos Should)

**Título:** `US15 — Desbloquear evoluções de pratos ao concluir a versão base`
**Labels:** `should`, `elicitacao`

```markdown
## História
Como Rafael, quero desbloquear versões mais complexas de um prato ao concluir a versão base, para ter um caminho de evolução.

## Critérios de aceite
- Dado que concluí o prato base de uma cadeia (ex.: cuscuz), quando o registro é salvo, então a evolução (ex.: cuscuz recheado) é desbloqueada.
- Dado que uma evolução está bloqueada, quando a visualizo, então vejo qual prato base preciso concluir.

## Origem
RF14 | UC13 | Prioridade: Should (primeiro dos Should — diferencial do produto)
```

---

## Issue 14 — Should

**Título:** `US04 — Buscar receitas por nome, país, ingrediente ou tempo`
**Labels:** `should`, `elicitacao`

```markdown
## História
Como Cleusa, quero buscar receitas por nome, país, ingrediente ou tempo de preparo, para encontrar rápido o que cabe na minha rotina.

## Critérios de aceite
- Dado que estou na busca, quando filtro por "até 30 minutos", então só vejo receitas com tempo de preparo de até 30 minutos.
- Dado que busco por uma culinária, quando confirmo, então vejo apenas receitas dessa culinária.

## Origem
RF09 | UC: — (Should sem UC especificado nesta versão) | Prioridade: Should
```

---

## Issue 15 — Should

**Título:** `US11 — Ver utensílios exigidos e filtrar por utensílios disponíveis`
**Labels:** `should`, `elicitacao`

```markdown
## História
Como Rafael, quero ver os utensílios que cada receita exige e que as sugestões respeitem o que tenho na cozinha, para não começar um prato que não consigo terminar.

## Critérios de aceite
- Dado que cadastrei meus utensílios (ex.: fogão e micro-ondas, sem forno), quando recebo sugestões, então pratos que exigem utensílios ausentes vêm sinalizados ou são filtrados.
- Dado que abro uma receita, quando vejo os detalhes, então a lista de utensílios aparece junto da lista de ingredientes.
- Dado que um prato exige utensílio que não tenho, quando o visualizo, então o sistema indica qual utensílio falta antes do preparo.

## Origem
RF19 | UC: — (comportamento coberto pelo FA2 do UC01 e pela RN10) | Prioridade: Should
```

---

## Issue 16 — Should

**Título:** `US16 — Receber badges ao atingir marcos`
**Labels:** `should`, `elicitacao`

```markdown
## História
Como Cleusa, quero receber badges ao atingir marcos, para ter orgulho da minha trajetória na cozinha.

## Critérios de aceite
- Dado que concluí pratos de 10 países distintos, quando o décimo é registrado, então recebo o badge correspondente.
- Dado que abro meu perfil, quando vejo os badges, então vejo os conquistados e os critérios dos ainda não obtidos.

## Origem
RF15 | UC: — (RN03/RN04 verificadas no UC10) | Prioridade: Should
```

---

## Issue 17 — Could

**Título:** `US13 — Ganhar pontos por prato concluído (dificuldade e ineditismo)`
**Labels:** `could`, `elicitacao`

```markdown
## História
Como Rafael, quero ganhar pontos por prato concluído conforme dificuldade e ineditismo, para sentir progresso real.

## Critérios de aceite
- Dado que concluí e avaliei um prato, quando o registro é salvo, então recebo pontos calculados a partir da dificuldade da receita.
- Dado que o prato é inédito para mim, quando concluo, então recebo um bônus de ineditismo; se for repetição, o bônus não se aplica.
- Dado que recebi pontos, quando consulto meu saldo, então vejo a origem de cada pontuação.

## Origem
RF12 | UC: — (Could; regra RN19 futura, fora do modelo conceitual v1) | Prioridade: Could
```

---

## Issue 18 — Could

**Título:** `US17 — Sugerir prato a um amigo`
**Labels:** `could`, `elicitacao`

```markdown
## História
Como Cleusa, quero sugerir um prato a um amigo, para trocar experiências como faço com minhas irmãs.

## Critérios de aceite
- Dado que estou vendo um prato, quando escolho sugerir a um amigo, então ele recebe a sugestão.
- Dado que recebi uma sugestão, quando a abro, então posso aceitá-la (vira candidata) ou recusá-la.

## Origem
RF17 | UC: — (Could; fora do modelo conceitual v1) | Prioridade: Could
```

---

## Referência: labels e milestone a criar antes das issues

| Label | Cor sugerida | Descrição |
|---|---|---|
| `must` | `#B60205` | Prioridade Must — MoSCoW |
| `should` | `#FBCA04` | Prioridade Should — MoSCoW |
| `could` | `#0E8A16` | Prioridade Could — MoSCoW |
| `elicitacao` | `#1D76DB` | Artefato da sub-etapa 1.1 — Elicitação |
| `analise` | `#5319E7` | Artefato da sub-etapa 1.2 — Análise |
| `validacao` | `#F9D0C4` | Artefato da sub-etapa 1.4 — Validação |

**Milestone:** título `Fase 1 — Engenharia de Requisitos`; descrição: "Consolidação da Engenharia de Requisitos do Panelada: elicitação, análise, documentação e validação."
