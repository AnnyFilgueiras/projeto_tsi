# Matriz de Rastreabilidade — Panelada

> Fase 1.4 — Validação. Cadeia RF → US → UC → Classes → RN para todos os 19 RF (18 ativos + RF16 descartado), com verificação bidirecional (órfãos em nenhuma direção), cobertura dos RNF e revisão dedicada das RN de gamificação e rotina (passo 6 do briefing 1.4).
> Classes e RN por linha refletem o que o UC correspondente referencia; US sem UC (decisão documentada da 1.2) trazem a cobertura indireta.

## Matriz principal

| RF | US | UC | Classes | RN | Status |
|---|---|---|---|---|---|
| RF01 | US01 (Must) | UC01 | Usuario, Sugestao, Prato, RestricaoAlimentar, Avaliacao | RN01, RN08, RN10 | Validado |
| RF02 | US02 (Must) | UC02 | Usuario, Sugestao, Prato | RN11 | Validado |
| RF03 | US03 (Must) | UC03 | Usuario, Ingrediente, Sugestao, Prato, Receita | RN10 | Validado |
| RF04 | US06 (Must) | UC05 | Usuario, PlanoDeRotina, ItemDeRotina, Sugestao, Prato | RN12 | Validado |
| RF05 | US07 (Must) | UC06 | Usuario, PlanoDeRotina, ListaDeCompras, Ingrediente | RN14 | Validado |
| RF06 | US08 (Must) | UC07 | Usuario, PlanoDeRotina, ItemDeRotina, ListaDeCompras | RN13 | Validado |
| RF07 | US09 (Must) | UC08 | Usuario, RestricaoAlimentar, Receita | RN08, RN09, RN16 | Validado |
| RF08 | US10 (Must) | UC09 | Usuario, Receita, Ingrediente, RestricaoAlimentar | RN15 | Validado |
| RF09 | US04 (Should) | — (Should sem UC — decisão documentada) | Receita, Culinaria, Ingrediente (dimensões de busca) | RN08 (sinalização na busca) | Validado com ressalva documentada |
| RF10 | US05 (Must) | UC04 | Usuario, Prato, Receita, Ingrediente, Utensilio, RestricaoAlimentar | RN02, RN08, RN16, RN17 | Validado |
| RF11 | US12 (Must) | UC10 | Usuario, Avaliacao, Prato, ItemDeRotina, Badge | RN01, RN02, RN03, RN04, RN05, RN06 | Validado |
| RF12 | US13 (Could) | — | Pontuacao — fora do modelo v1 (decisão D1) | RN19 (futura, provisória) | Fora da v1 — Could (documentado) |
| RF13 | US14 (Must) | UC11 | Usuario, Prato, Culinaria | RN01, RN07 | Validado |
| RF14 | US15 (Should) | UC13 | Usuario, Prato, Avaliacao | RN02, RN18 | Validado |
| RF15 | US16 (Should) | — (RN03/RN04 exercitadas no UC10, passo 4) | Usuario, Avaliacao, Badge | RN03, RN04 | Validado com ressalva documentada |
| RF16 | — (Won't) | — | — | RN20 (excluída) | Descartado — Won't (registro consistente em requisitos, backlog, léxico e RN20) |
| RF17 | US17 (Could) | — | Amizade — fora do modelo v1 (decisão D1) | — | Fora da v1 — Could (documentado) |
| RF18 | US18 (Must) | UC12 | Prato, Receita, Culinaria, Ingrediente, Utensilio | RN17, RN18 | Validado |
| RF19 | US11 (Should) | — (comportamento no FA2 do UC01) | Usuario, Utensilio, Receita, Sugestao | RN10 | Validado com ressalva documentada |

## Verificação bidirecional (caça a órfãos)

| Direção | Resultado |
|---|---|
| RF sem US | **0** — 18/18 ativos cobertos; RF16 descartado com justificativa registrada |
| US Must sem UC | **0** — 12/12 cobertas (UC01–UC12) |
| US Should sem UC | 3 (US04, US11, US16) — decisão documentada na 1.2; comportamento coberto por FA de UC existente + RN (FA2-UC01, FA1-UC04, passo 4 do UC10) |
| US Could sem UC | 2 (US13, US17) — esperado para Could; RN19 futura documenta a pontuação |
| UC sem US de origem | **0** — UC01–UC13 todos com Origem declarada |
| US sem RF de origem | **0** — US01–US18 todas com Origem: RF## |
| Classe órfã (sem UC) | **0** — 13/13 classes aparecem em ao menos um UC (tabela abaixo) |
| RN sem origem (US/RF) | **0** — RN01–RN18 com origem declarada; RN19 (futura) e RN20 (excluída) documentadas |

### Cobertura das classes (conferida contra o modelo conceitual)

| Classe | Casos de uso |
|---|---|
| Usuario | UC01–UC11, UC13 |
| RestricaoAlimentar | UC01, UC04, UC08, UC09 |
| Utensilio | UC04, UC12 |
| Ingrediente | UC03, UC04, UC06, UC09, UC12 |
| Culinaria | UC11, UC12 |
| Prato | UC01–UC05, UC10–UC13 |
| Receita | UC03, UC04, UC08, UC09, UC12 |
| Sugestao | UC01, UC02, UC03, UC05 |
| PlanoDeRotina | UC05, UC06, UC07 |
| ItemDeRotina | UC05, UC07, UC10 |
| ListaDeCompras | UC06, UC07 |
| Avaliacao | UC01, UC10, UC13 |
| Badge | UC10 |

## Cobertura dos RNF

| RNF | Onde é exercitado | Veredito |
|---|---|---|
| RNF01 (mobile) | — | Verificável por inspeção (restrição de plataforma) |
| RNF02 (2 min no 1º acesso) | UC01-FA1 | Coberto |
| RNF03 (≤ 2,5 s) | CT01 | Coberto por caso de teste |
| RNF04 (≤ 2 toques) | US02 / RF02 (texto corrigido) | Coberto |
| RNF05 (offline) | — | Sem UC — RNF de qualidade, verificação direta (modo avião); não exige cadeia RF→UC |
| RNF06 (LGPD) | RN09, UC08 | Coberto |
| RNF07 (notificações configuráveis) | RN13, US08-c3, CT16 | Coberto (limiar definido na correção do checklist) |
| RNF08 (atribuição de fonte) | RN17, UC12-FE1, CT26 | Coberto |
| RNF09 (sem punição) | RN04, RN12 | Coberto |
| RNF10 (só nota obrigatória) | RN05, UC10-FE1, CT21 | Coberto |

## Revisão dedicada: RN de gamificação e rotina (passo 6 do briefing)

| Pergunta do briefing | Resposta da inspeção |
|---|---|
| A fórmula de pontos é calculável? | **Sim, mas fora da v1.** RN19 (futura, condicionada à US13-Could): fácil 10 / média 20 / difícil 30 + 50% de ineditismo na 1ª conclusão; repetições sem bônus; saldo com origem de cada pontuação. Valores provisórios — pendência registrada: revisar ao priorizar (D13b). |
| A condição de cada badge é observável? | **Sim.** RN03 admite 5 formas de marco, todas função de avaliações salvas (prato específico; culinária; N culinárias; todos os continentes — usa `Culinaria.continentes`, D11f/D12; conjunto temático do curador). RN04 garante concessão única com `dataDesbloqueio` e nenhuma revogação. **[obs]** Recomendação (não bloqueia): explicitar que o atributo `Badge.marco` carrega os parâmetros verificáveis do critério (ex.: N=10; conjunto={Egito, Grécia, Itália}; prato=Ratatouille), pois o conjunto temático da forma (e) não tem associação Badge–Culinaria no modelo. |
| O ranking tem critério de desempate? | **N/A.** Ranking é Won't (RN20, ex-RF16) — o briefing 1.4 foi escrito antes dessa decisão da 1.1. Nenhuma regra ativa nesta versão; divergência briefing × artefatos já registrada. |
| A regra de rotina atrasada está definida? | **Sim.** RN12: item cuja data passou sem avaliação permanece "planejado", pode ser reagendado ou removido, sem penalidade (coerente com RNF09). "Atrasado" é estado derivado (`dataPreparo < hoje` ∧ status = planejado), por isso não existe no enum do modelo — decisão consistente. |

### Vereditos complementares das RN ativas de gamificação

- **RN01** (definição única de "concluído" = avaliação salva) é a fonte única usada por histórico, coleção, badges e evolução — sem definições concorrentes ✓
- **RN02** (desbloqueio na 1ª avaliação do base; avaliações adicionais não re-desbloqueiam) é idempotente e observável ✓ — coberta por CT27 e UC13
- **RN07** (percentual = concluídos ÷ total da culinária no catálogo; faltantes = total − concluídos) é calculável ✓ — coberta por CT24/CT25 com exemplo numérico (2/8 = 25%, faltam 6)
- **RN18** (exatamente um prato base; raiz sem base; profundidade livre) fecha a modelagem da cadeia ✓ — coerente com a autoassociação `Prato 0..* -- 0..1 Prato`

## Conclusão da matriz

Cadeia completa sem órfãos em nenhuma direção para o escopo v1 (Must + Should); os únicos "vazios" são os descartes/adiamentos deliberados e documentados (RF16, RF12/US13, RF17/US17, US04/US11/US16 sem UC). RN de pontuação, badges, evolução, coleção e rotina em formato verificável. **Critério de pronto do briefing atendido.**
