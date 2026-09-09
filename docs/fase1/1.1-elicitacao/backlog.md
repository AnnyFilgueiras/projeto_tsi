# Backlog de Histórias de Usuário — Panelada

> Fase 1.1 — Elicitação. 18 histórias (US01–US18), com rastreabilidade US → RF e priorização MoSCoW final aprovada pela dupla. Meta do briefing (12–20 US) atendida.
> v1.1 (09/09/2026): critérios de aceite corrigidos na validação (Fase 1.4) — US01, US02, US06, US08, US09, US12, US18, US11, US16; ver `ata-revisao.md`.

## Priorização MoSCoW (visão geral)

| Prioridade | Histórias |
|---|---|
| **Must** (12) | US01, US02, US03, US05, US06, US07, US08, US09, US10, US12, US14, US18 |
| **Should** (4) | US15 *(primeiro)*, US04, US11, US16 |
| **Could** (2) | US13, US17 |
| **Won't** (1) | Ranking entre amigos (ex-RF16): apenas 1 dos 5 entrevistados tinha interesse; social exige implementação cuidadosa; dupla optou por foco |

Decisões de priorização: a identidade de gamificação é coleção (Must) → evolução (primeiro Should) → badges (Should); pontuação (US13) é Could por ser mecânica "batida". US08 (lembretes) é Must por fundamentação em computação persuasiva, desde que não irritante (RNF07).

---

## Must

```
US01 — Como Marina, quero receber sugestões de pratos alinhadas ao meu perfil,
para decidir rápido o que cozinhar sem cair na rolagem infinita.
Origem: RF01 | Prioridade: Must
Critérios de aceite:
- Dado que meu perfil tem preferências e restrições cadastradas, quando abro as
  sugestões, então nenhum prato incompatível com minhas restrições é
  apresentado (RN08) e os pratos exibidos respeitam minhas preferências
  culinárias declaradas (RN10).
- Dado que já preparei um prato, quando recebo sugestões, então ele não é
  apresentado novamente nas sugestões (RN10).
```

```
US02 — Como Marina, quero aprovar ou descartar cada sugestão com um toque,
para montar minha lista de candidatos sem fricção.
Origem: RF02 | Prioridade: Must
Critérios de aceite:
- Dado que estou vendo uma sugestão, quando a descarto, então a próxima
  sugestão aparece e a descartada não retorna naquela sessão.
- Dado que aprovei uma sugestão, quando a aprovo, então ela fica marcada como
  candidata e disponível para o planejamento.
```

```
US03 — Como Rafael, quero informar os ingredientes que tenho em casa,
para descobrir o que dá para cozinhar na hora.
Origem: RF03 | Prioridade: Must
Critérios de aceite:
- Dado que registrei meus ingredientes disponíveis, quando peço sugestões,
  então vejo pratos que usam esses ingredientes.
- Dado que um prato sugerido exige ingredientes faltantes, quando o visualizo,
  então os faltantes aparecem claramente destacados.
```

```
US05 — Como Cleusa, quero ver a receita com foto, tempo, dificuldade,
ingredientes e passo a passo, para avaliar se consigo prepará-la.
Origem: RF10 | Prioridade: Must
Critérios de aceite:
- Dado que abro uma receita, quando a tela carrega, então vejo imagem, tempo
  de preparo, nível de dificuldade, lista de ingredientes e passo a passo
  numerado.
- Dado que estou no passo a passo, quando avanço um passo, então o passo
  atual fica destacado.
```

```
US06 — Como Marina, quero montar o plano de refeições da semana ou da quinzena
associando cada prato a uma data de preparo, para organizar minha rotina.
Origem: RF04 | Prioridade: Must
Critérios de aceite:
- Dado que tenho pratos candidatos, quando monto o plano, então consigo
  associar cada prato a uma data de preparo.
- Dado que escolhi o período (semana ou quinzena), quando visualizo o plano,
  então vejo os pratos organizados por data.
- Dado que um prato já tem data, quando o reagendo, então a nova data
  substitui a anterior.
```

```
US07 — Como Marina, quero que o app gere a lista de compras consolidada do meu
plano, com data de compra, para comprar os ingredientes com calma.
Origem: RF05 | Prioridade: Must
Critérios de aceite:
- Dado que meu plano tem pratos com datas, quando gero a lista de compras,
  então ela consolida os ingredientes de todos os pratos, sem itens duplicados.
- Dado que a lista foi gerada, quando a visualizo, então consigo definir a
  data de compra e marcar cada item como comprado.
```

```
US08 — Como Cleusa, quero receber lembretes nas datas de compra e de preparo,
para não esquecer o que planejei.
Origem: RF06 | Prioridade: Must
Critérios de aceite:
- Dado que defini uma data de compra, quando ela chega, então recebo uma
  notificação com a lista de compras.
- Dado que defini uma data de preparo, quando ela chega, então recebo um
  lembrete indicando o prato do dia (RN13).
- Dado que desativei os lembretes nas configurações, quando uma data chega,
  então nenhuma notificação é enviada.
```

```
US09 — Como Cleusa, quero cadastrar as restrições alimentares da família no
perfil e ser alertada sobre alérgenos, para cozinhar com segurança.
Origem: RF07 | Prioridade: Must
Critérios de aceite:
- Dado que cadastrei uma restrição (ex.: diabetes), quando recebo sugestões,
  então pratos incompatíveis não aparecem nas sugestões; na busca e na
  visualização, são claramente sinalizados (RN08).
- Dado que uma receita contém um alérgeno comum (ex.: glúten, lactose,
  amendoim), quando a visualizo, então o alerta de alérgeno é exibido.
```

```
US10 — Como Cleusa, quero ver substituições sugeridas para ingredientes que
não tenho ou não posso consumir, para adaptar receitas sem desistir delas.
Origem: RF08 | Prioridade: Must
Critérios de aceite:
- Dado que um ingrediente da receita está marcado como indisponível ou
  restrito no meu perfil, quando visualizo a receita, então vejo ao menos uma
  substituição sugerida para ele.
- Dado que não há substituto cadastrado, quando visualizo o ingrediente,
  então o sistema informa isso explicitamente, em vez de inventar uma troca.
```

```
US12 — Como Cleusa, quero registrar nota, relato e alterações de cada prato
que fiz, mantendo meu histórico, para ter meu caderno digital de receitas.
Origem: RF11 | Prioridade: Must
Critérios de aceite:
- Dado que concluí um prato, quando registro a avaliação, então apenas a
  nota é obrigatória; relato e alterações são opcionais (RNF10).
- Dado que tenho avaliações, quando acesso o histórico, então vejo cada
  preparo com data, nota e alterações.
- Dado que repeti um prato, quando o registro é feito novamente, então o
  histórico guarda os dois preparos separadamente.
```

```
US14 — Como Rafael, quero ver minha coleção de pratos por país/culinária com
o progresso, para saber o que falta completar.
Origem: RF13 | Prioridade: Must
Critérios de aceite:
- Dado que concluí pratos, quando abro a coleção, então os vejo agrupados por
  culinária com o percentual de progresso de cada uma.
- Dado que uma culinária está incompleta, quando a visualizo, então vejo
  quantos pratos faltam.
```

```
US18 — Como curador de conteúdo, quero importar e manter o catálogo de
receitas com todos os atributos, para que o app tenha conteúdo confiável.
Origem: RF18 | Prioridade: Must
Critérios de aceite:
- Dado que importo uma receita de plataforma pública, quando a cadastro,
  então registro fonte, ingredientes, utensílios, dificuldade, tempo, passo a
  passo e alérgenos (RNF08).
- Dado que um prato faz parte de uma cadeia como evolução, quando o cadastro,
  então indico exatamente um prato base (RN18).
```

## Should

```
US15 — Como Rafael, quero desbloquear versões mais complexas de um prato ao
concluir a versão base, para ter um caminho de evolução.
Origem: RF14 | Prioridade: Should (primeiro dos Should — diferencial do produto)
Critérios de aceite:
- Dado que concluí o prato base de uma cadeia (ex.: cuscuz), quando o
  registro é salvo, então a evolução (ex.: cuscuz recheado) é desbloqueada.
- Dado que uma evolução está bloqueada, quando a visualizo, então vejo qual
  prato base preciso concluir.
```

```
US04 — Como Cleusa, quero buscar receitas por nome, país, ingrediente ou tempo
de preparo, para encontrar rápido o que cabe na minha rotina.
Origem: RF09 | Prioridade: Should
Critérios de aceite:
- Dado que estou na busca, quando filtro por "até 30 minutos", então só vejo
  receitas com tempo de preparo de até 30 minutos.
- Dado que busco por uma culinária, quando confirmo, então vejo apenas
  receitas dessa culinária.
```

```
US11 — Como Rafael, quero ver os utensílios que cada receita exige e que as
sugestões respeitem o que tenho na cozinha, para não começar um prato que
não consigo terminar.
Origem: RF19 | Prioridade: Should
Critérios de aceite:
- Dado que cadastrei meus utensílios (ex.: fogão e micro-ondas, sem forno),
  quando recebo sugestões, então pratos que exigem utensílios ausentes vêm
  sinalizados (RN10).
- Dado que abro uma receita, quando vejo os detalhes, então a lista de
  utensílios aparece junto da lista de ingredientes.
- Dado que um prato exige utensílio que não tenho, quando o visualizo,
  então o sistema indica qual utensílio falta antes do preparo.
```

```
US16 — Como Cleusa, quero receber badges ao atingir marcos, para ter orgulho
da minha trajetória na cozinha.
Origem: RF15 | Prioridade: Should
Critérios de aceite:
- Dado que concluí pratos de 10 culinárias distintas, quando o décimo é
  registrado, então recebo o badge correspondente.
- Dado que abro meu perfil, quando vejo os badges, então vejo os conquistados
  e os critérios dos ainda não obtidos.
```

## Could

```
US13 — Como Rafael, quero ganhar pontos por prato concluído conforme
dificuldade e ineditismo, para sentir progresso real.
Origem: RF12 | Prioridade: Could
Critérios de aceite:
- Dado que concluí e avaliei um prato, quando o registro é salvo, então
  recebo pontos calculados a partir da dificuldade da receita.
- Dado que o prato é inédito para mim, quando concluo, então recebo um bônus
  de ineditismo; se for repetição, o bônus não se aplica.
- Dado que recebi pontos, quando consulto meu saldo, então vejo a origem de
  cada pontuação.
```

```
US17 — Como Cleusa, quero sugerir um prato a um amigo, para trocar
experiências como faço com minhas irmãs.
Origem: RF17 | Prioridade: Could
Critérios de aceite:
- Dado que estou vendo um prato, quando escolho sugerir a um amigo, então ele
  recebe a sugestão.
- Dado que recebi uma sugestão, quando a abro, então posso aceitá-la (vira
  candidata) ou recusá-la.
```

## Won't

- **Ranking entre amigos (ex-RF16):** descartado nesta versão. Justificativa: apenas Rafael (1 dos 5 entrevistados) demonstrou interesse; a dupla despriorizou o social por exigir implementação cuidadosa. Candidato a revisão em versões futuras, junto com a possível resseparação do stakeholder "amigo do usuário".
