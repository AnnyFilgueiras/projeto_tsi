# Casos de Teste Derivados — Panelada

> Fase 1.4 — Validação. Um caso de teste (CT##) por critério de aceite das 12 histórias Must (27 critérios → 27 CTs), derivados do formato Given/When/Then, conforme o briefing 1.4.
> CTs de critérios corrigidos na inspeção usam o **texto corrigido e aprovado** (ver `checklist.md`), provando que a correção restaura a testabilidade.
> Convenção de resultado: como ainda não há implementação, "Passa" significa que o critério gera um resultado esperado determinístico e verificável na especificação (teste de papel contra os artefatos). A execução contra o software ocorrerá nas fases seguintes, reutilizando estes mesmos CTs.

## Cobertura

| US | RF | CTs | Status |
|---|---|---|---|
| US01 | RF01 | CT01, CT02 | 2/2 passam |
| US02 | RF02 | CT03, CT04 | 2/2 passam |
| US03 | RF03 | CT05, CT06 | 2/2 passam |
| US05 | RF10 | CT07, CT08 | 2/2 passam |
| US06 | RF04 | CT09, CT10, CT11 | 3/3 passam |
| US07 | RF05 | CT12, CT13 | 2/2 passam |
| US08 | RF06 | CT14, CT15, CT16 | 3/3 passam |
| US09 | RF07 | CT17, CT18 | 2/2 passam |
| US10 | RF08 | CT19, CT20 | 2/2 passam |
| US12 | RF11 | CT21, CT22, CT23 | 3/3 passam |
| US14 | RF13 | CT24, CT25 | 2/2 passam |
| US18 | RF18 | CT26, CT27 | 2/2 passam |

Cobertura adicional de RNF exercitada pelos CTs: RNF03 (CT01), RNF07 (CT16), RNF10/RN05 (CT21), RNF08/RN17 (CT26).

---

## US01 — Sugestões alinhadas ao perfil

```
CT01 — Origem: US01 (critério 1, texto corrigido)
Dado que meu perfil declara a restrição "intolerância à lactose" (alérgeno
associado: lactose) e a preferência "culinária italiana",
e o catálogo contém "Risoto" (italiano, declara lactose), "Espaguete ao
pomodoro" (italiano, sem lactose) e "Feijoada" (brasileira, sem lactose),
quando abro as sugestões,
então "Risoto" nunca é apresentado (RN08), as sugestões exibidas respeitam
minha preferência por culinária italiana (RN10) e a resposta chega em até
2,5 segundos (RNF03).
Resultado: [x] Passa  [ ] Falha → motivo:
```

```
CT02 — Origem: US01 (critério 2, texto corrigido)
Dado que já registrei avaliação de "Espaguete ao pomodoro" (prato concluído,
RN01),
quando abro as sugestões,
então "Espaguete ao pomodoro" não é apresentado novamente (RN10; UC01 passo 3).
Resultado: [x] Passa  [ ] Falha → motivo:
```

## US02 — Aprovar ou descartar com um toque

```
CT03 — Origem: US02 (critério 1)
Dado que estou vendo a sugestão "Pad Thai",
quando a descarto,
então a próxima sugestão é apresentada e "Pad Thai" não retorna em nenhuma
posição daquela sessão (RN11).
Resultado: [x] Passa  [ ] Falha → motivo:
```

```
CT04 — Origem: US02 (critério 2, texto corrigido)
Dado que estou vendo a sugestão "Ratatouille",
quando a aprovo,
então sua situação vira "candidata" (RN11) e "Ratatouille" aparece na lista
de pratos candidatos disponíveis para o planejamento (UC05 passo 2).
Resultado: [x] Passa  [ ] Falha → motivo:
```

## US03 — Cozinhar na hora com a despensa

```
CT05 — Origem: US03 (critério 1)
Dado que registrei na despensa {arroz, ovos, cebola},
quando peço sugestões,
então todo prato exibido usa ao menos um desses ingredientes (RN10).
Resultado: [x] Passa  [ ] Falha → motivo:
```

```
CT06 — Origem: US03 (critério 2)
Dado que a sugestão "Arroz frito" exige {arroz, ovos, cebola, óleo de gergelim}
e "óleo de gergelim" não está na minha despensa,
quando a visualizo,
então "óleo de gergelim" aparece destacado como faltante (RN10).
Resultado: [x] Passa  [ ] Falha → motivo:
```

## US05 — Visualizar receita completa

```
CT07 — Origem: US05 (critério 1)
Dado que abro a receita de "Ratatouille",
quando a tela carrega,
então vejo os cinco elementos: imagem, tempo de preparo, nível de dificuldade,
lista de ingredientes e passo a passo numerado (UC04 passo 2–3).
Resultado: [x] Passa  [ ] Falha → motivo:
```

```
CT08 — Origem: US05 (critério 2)
Dado que estou no passo 2 do passo a passo,
quando avanço para o passo 3,
então o passo 3 fica destacado e o passo 2 perde o destaque.
Resultado: [x] Passa  [ ] Falha → motivo:
```

## US06 — Montar plano de refeições

```
CT09 — Origem: US06 (critério 1, texto corrigido)
Dado que tenho os pratos candidatos "Ratatouille" e "Cuscuz",
quando monto o plano,
então consigo associar "Ratatouille" a 12/09 e "Cuscuz" a 13/09, e cada
associação vira um item de rotina com status "planejado" (RN12).
Resultado: [x] Passa  [ ] Falha → motivo:
```

```
CT10 — Origem: US06 (critério 2)
Dado que escolhi o período "quinzena" (início em 12/09),
quando visualizo o plano,
então vejo os pratos organizados por data dentro de 12/09 a 25/09.
Resultado: [x] Passa  [ ] Falha → motivo:
```

```
CT11 — Origem: US06 (critério 3)
Dado que "Ratatouille" está planejado para 12/09,
quando o reagendo para 14/09,
então a data 12/09 é substituída e o item consta apenas em 14/09 (RN12).
Resultado: [x] Passa  [ ] Falha → motivo:
```

## US07 — Lista de compras consolidada

```
CT12 — Origem: US07 (critério 1)
Dado que o plano contém "Ratatouille" (usa cebola) e "Sopa de legumes"
(também usa cebola),
quando gero a lista de compras,
então ela consolida os ingredientes dos dois pratos, "cebola" aparece uma
única vez e nenhum item tem quantidade (v1 — RN14).
Resultado: [x] Passa  [ ] Falha → motivo:
```

```
CT13 — Origem: US07 (critério 2)
Dado que a lista foi gerada,
quando a visualizo,
então consigo definir a data de compra (ex.: 11/09) e marcar "cebola" como
comprada, e a marcação permanece ao reabrir a lista (RN14).
Resultado: [x] Passa  [ ] Falha → motivo:
```

## US08 — Lembretes de compra e preparo

```
CT14 — Origem: US08 (critério 1)
Dado que defini 11/09 como data de compra e os lembretes estão ativos,
quando chega o dia 11/09,
então recebo uma notificação contendo a lista de compras (RN13).
Resultado: [x] Passa  [ ] Falha → motivo:
```

```
CT15 — Origem: US08 (critério 2, texto corrigido)
Dado que defini 12/09 como data de preparo de "Ratatouille" e os lembretes
estão ativos,
quando chega o dia 12/09,
então recebo um lembrete indicando "Ratatouille" como o prato do dia (RN13).
Resultado: [x] Passa  [ ] Falha → motivo:
```

```
CT16 — Origem: US08 (critério 3)
Dado que desativei os lembretes nas configurações,
quando chegam as datas de compra (11/09) e de preparo (12/09),
então nenhuma notificação é enviada (RN13, RNF07).
Resultado: [x] Passa  [ ] Falha → motivo:
```

## US09 — Restrições alimentares e alertas

```
CT17 — Origem: US09 (critério 1, texto corrigido)
Dado que cadastrei a restrição "doença celíaca" (alérgeno associado: glúten)
com consentimento explícito (RN09),
quando recebo sugestões,
então nenhum prato que declara glúten é apresentado; e, ao buscar ou
visualizar "Pão de queijo" (declara glúten), ele aparece claramente
sinalizado como incompatível (RN08).
Resultado: [x] Passa  [ ] Falha → motivo:
```

```
CT18 — Origem: US09 (critério 2)
Dado que a receita de "Pad Thai" declara amendoim,
quando a visualizo,
então o alerta de alérgeno é exibido; e, se amendoim estiver associado a uma
restrição do meu perfil, ele é destacado como incompatível (RN16).
Resultado: [x] Passa  [ ] Falha → motivo:
```

## US10 — Substituições de ingredientes

```
CT19 — Origem: US10 (critério 1)
Dado que a receita de "Bechamel" usa leite, que o leite é incompatível com a
minha restrição (lactose) e que "leite → leite de aveia" está cadastrado
como substituição global,
quando visualizo a receita,
então vejo "leite de aveia" como substituição sugerida para o leite (RN15).
Resultado: [x] Passa  [ ] Falha → motivo:
```

```
CT20 — Origem: US10 (critério 2)
Dado que o ingrediente "queijo pecorino" não tem substituto cadastrado,
quando o visualizo marcado como faltante,
então o sistema informa explicitamente "sem substituto cadastrado" e não
sugere nenhuma troca (RN15).
Resultado: [x] Passa  [ ] Falha → motivo:
```

## US12 — Avaliação e histórico

```
CT21 — Origem: US12 (critério 1)
Dado que concluí "Cuscuz",
quando registro a avaliação informando apenas a nota 4,5 (sem relato e sem
alterações),
então a avaliação é salva (RNF10, RN05); e, se tento salvar sem nota, o
sistema impede o salvamento (UC10-FE1).
Resultado: [x] Passa  [ ] Falha → motivo:
```

```
CT22 — Origem: US12 (critério 2)
Dado que tenho avaliações registradas,
quando acesso o histórico,
então vejo cada preparo com data, nota e alterações (RN06).
Resultado: [x] Passa  [ ] Falha → motivo:
```

```
CT23 — Origem: US12 (critério 3, texto corrigido)
Dado que repeti "Cuscuz" em data posterior,
quando o registro é feito novamente,
então o histórico guarda os dois preparos separadamente, cada um com sua
data e sua nota, sem sobrescrita (RN06).
Resultado: [x] Passa  [ ] Falha → motivo:
```

## US14 — Coleção por culinária

```
CT24 — Origem: US14 (critério 1)
Dado que concluí 2 pratos italianos e o catálogo tem 8 pratos italianos,
quando abro a coleção,
então vejo os pratos concluídos agrupados por culinária e "Italiana" exibe
25% de progresso (2 ÷ 8 — RN07).
Resultado: [x] Passa  [ ] Falha → motivo:
```

```
CT25 — Origem: US14 (critério 2)
Dado que a culinária italiana está incompleta (2 de 8),
quando a visualizo,
então vejo que faltam 6 pratos (RN07).
Resultado: [x] Passa  [ ] Falha → motivo:
```

## US18 — Catálogo (curador)

```
CT26 — Origem: US18 (critério 1, texto corrigido)
Dado que importo uma receita de plataforma pública,
quando a cadastro,
então registro fonte, ingredientes, utensílios, dificuldade, tempo, passo a
passo e alérgenos (RNF08); e, se a fonte estiver ausente, o sistema bloqueia
a publicação (RN17, UC12-FE1).
Resultado: [x] Passa  [ ] Falha → motivo:
```

```
CT27 — Origem: US18 (critério 2, texto corrigido)
Dado que o prato "Cuscuz recheado" faz parte de uma cadeia como evolução,
quando o cadastro,
então indico exatamente um prato base ("Cuscuz" — RN18); e um prato sem base
indicada permanece como raiz da cadeia.
Resultado: [x] Passa  [ ] Falha → motivo:
```

---

## Notas

1. Nenhum critério deixou de gerar caso de teste após as correções — o que confirma que as 3 falhas críticas eram de fato bloqueadores de testabilidade e foram resolvidas.
2. Estes CTs são a semente da suíte de aceitação das fases de implementação/QA: cada CT já referencia US, RN, UC e RNF envolvidos.
3. CTs negativos embutidos: CT16 (desativação total de lembretes), CT20 (ausência de substituto), CT21 (nota ausente), CT26 (fonte ausente) — cobrem os fluxos de exceção FE1 dos UCs correspondentes.
