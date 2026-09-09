# Casos de Uso — Panelada

> Fase 1.2 — Análise. Um UC para cada US Must (US01, US02, US03, US05–US10,
> US12, US14, US18), mais UC13 para US15 (Should, registro opcional aprovado).
> Destino no repositório: `/docs/fase1/1.2-analise/casos-de-uso.md`.
> Diagrama visual de casos de uso é opcional (PlantUML) e não foi produzido —
> o valor está na especificação, conforme o briefing 1.2.

## Atores

- **Usuario** — cozinheiro/jogador (personas Marina, Rafael, Cleusa): descobre, planeja, prepara e registra pratos.
- **Curador** — importa e mantém o catálogo de receitas (fonte, dificuldade, alérgenos, cadeias de evolução).
- **Tempo** — ator secundário: dispara os lembretes nas datas de compra e de preparo (UC07). Necessário porque Lembrete é evento derivado, não classe (decisão D2).

---

## UC01 — Receber sugestões alinhadas ao perfil

Ator: Usuario | Origem: US01 | Classes: Usuario, Sugestao, Prato, RestricaoAlimentar, Avaliacao

Fluxo principal:
1. Usuario abre a área de sugestões.
2. Sistema seleciona pratos do catálogo compatíveis com as preferências e restrições do perfil (RN08, RN10).
3. Sistema exclui pratos já concluídos pelo usuário, que não voltam como novidade (RN01, RN10).
4. Sistema apresenta uma sugestão por vez, com nome, imagem, tempo e dificuldade.

Fluxos alternativos/exceção:
- FA1 Primeiro acesso (perfil vazio): sistema sugere a partir do catálogo geral, respeitando o limite de 2 minutos até a primeira sugestão (RNF02).
- FA2 Prato que exige utensílio ausente é apresentado com sinalização (RN10).
- FE1 Nenhum prato compatível: sistema informa e propõe revisar restrições.

## UC02 — Aprovar ou descartar sugestão

Ator: Usuario | Origem: US02 | Classes: Usuario, Sugestao, Prato

Fluxo principal:
1. Com uma sugestão apresentada (UC01), Usuario escolhe aprovar ou descartar.
2. Se aprovada: situação vira "candidata" e o prato fica disponível para o planejamento (UC05).
3. Se descartada: situação vira "descartada" e a sugestão não retorna naquela sessão (RN11).
4. Sistema apresenta a próxima sugestão.

Fluxos alternativos/exceção:
- FA1 Sugestão descartada pode reaparecer em sessões futuras (RN11).

## UC03 — Cozinhar na hora com a despensa

Ator: Usuario | Origem: US03 | Classes: Usuario, Ingrediente, Sugestao, Prato, Receita

Fluxo principal:
1. Usuario registra ou atualiza os ingredientes que tem em casa (despensa).
2. Sistema sugere pratos que usam esses ingredientes (RN10).
3. Para cada sugestão com ingredientes faltantes, sistema destaca os faltantes.
4. Usuario aprova a sugestão (UC02) ou abre a receita (UC04).

Fluxos alternativos/exceção:
- FA1 Despensa vazia: sistema orienta o cadastro de ingredientes.
- FE1 Nenhum prato totalmente compatível: sistema apresenta os pratos com menos faltantes, destacando-os.

## UC04 — Visualizar receita

Ator: Usuario | Origem: US05 | Classes: Usuario, Prato, Receita, Ingrediente, Utensilio, RestricaoAlimentar

Fluxo principal:
1. Usuario abre um prato (a partir de sugestão, busca, plano ou coleção).
2. Sistema exibe imagem, tempo de preparo, dificuldade, ingredientes, utensílios e fonte (RN17).
3. Usuario inicia o passo a passo numerado.
4. A cada avanço, o passo atual fica destacado.

Fluxos alternativos/exceção:
- FA1 Receita com alérgenos: sistema exibe alerta; alérgeno associado a restrição do usuário é destacado como incompatível (RN08, RN16).
- FA2 Ingrediente faltante ou restrito: usuário aciona substituições (UC09).
- FA3 Prato é evolução bloqueada: sistema indica qual prato base precisa ser avaliado (RN02).

## UC05 — Montar plano de refeições

Ator: Usuario | Origem: US06 | Classes: Usuario, PlanoDeRotina, ItemDeRotina, Sugestao, Prato

Fluxo principal:
1. Usuario inicia um novo plano e escolhe o período (semana ou quinzena).
2. Sistema lista os pratos candidatos.
3. Para cada prato, Usuario associa uma data de preparo; cada associação vira um item de rotina "planejado" (RN12).
4. Sistema apresenta o plano organizado por data.

Fluxos alternativos/exceção:
- FA1 Reagendamento: a nova data substitui a anterior (RN12).
- FA2 Data vencida sem avaliação: item permanece "planejado"; usuário reagenda ou remove, sem punição (RN12, RNF09).
- FE1 Sem pratos candidatos: sistema orienta o retorno às sugestões (UC01).

## UC06 — Gerar lista de compras consolidada

Ator: Usuario | Origem: US07 | Classes: Usuario, PlanoDeRotina, ListaDeCompras, Ingrediente

Fluxo principal:
1. Com o plano contendo itens com datas, Usuario solicita a lista de compras.
2. Sistema consolida os ingredientes de todos os itens, sem duplicatas e sem quantidades (RN14).
3. Usuario define a data de compra.
4. Durante a compra, Usuario marca cada item como comprado.

Fluxos alternativos/exceção:
- FA1 Regeneração após alterar o plano: sistema recalcula a lista preservando a marcação dos ingredientes que permanecem (RN14).
- FE1 Plano sem itens: sistema impede a geração e orienta o planejamento (UC05).

## UC07 — Receber lembretes de compra e preparo

Ator: Usuario | Ator secundário: Tempo | Origem: US08 | Classes: Usuario, PlanoDeRotina, ItemDeRotina, ListaDeCompras

Fluxo principal:
1. Na data de compra, o sistema envia notificação com a lista de compras.
2. Na data de preparo, o sistema envia lembrete indicando o prato do dia.
3. Usuario pode configurar frequência e tipos de lembrete no perfil (RN13).

Fluxos alternativos/exceção:
- FA1 Lembretes desativados: nenhuma notificação é enviada (RN13).
- FA2 Item reagendado: o lembrete passa a seguir a nova data (RN12).

## UC08 — Cadastrar restrições alimentares

Ator: Usuario | Origem: US09 | Classes: Usuario, RestricaoAlimentar, Receita

Fluxo principal:
1. Usuario abre o perfil e informa uma restrição alimentar.
2. Sistema informa que se trata de dado sensível e solicita consentimento explícito (RN09).
3. Com o consentimento, a restrição é salva e passa a filtrar as sugestões (RN08).
4. Ao visualizar receita com alérgeno associado à restrição, Usuario vê o alerta de incompatibilidade (RN16).

Fluxos alternativos/exceção:
- FA1 Consentimento negado: a restrição não é persistida (RN09).
- FA2 Revogação: usuário exclui a restrição e a filtragem deixa de aplicá-la (RN09).

## UC09 — Consultar substituições de ingredientes

Ator: Usuario | Origem: US10 | Classes: Usuario, Receita, Ingrediente, RestricaoAlimentar

Fluxo principal:
1. Ao visualizar uma receita (UC04), o sistema marca os ingredientes faltantes (ausentes da despensa) ou incompatíveis com restrições do perfil (RN08).
2. Para cada ingrediente marcado, o sistema exibe os substitutos globais cadastrados (RN15).
3. Usuario decide adotar ou não a substituição no preparo.

Fluxos alternativos/exceção:
- FA1 Sem substituto cadastrado: sistema informa explicitamente, sem inventar uma troca (RN15).

## UC10 — Registrar avaliação de prato

Ator: Usuario | Origem: US12 | Classes: Usuario, Avaliacao, Prato, ItemDeRotina, Badge

Fluxo principal:
1. Após preparar um prato, Usuario inicia o registro da avaliação.
2. Usuario informa a nota (obrigatória, 0 a 5 em passos de 0,5 — RN05) e, opcionalmente, relato e alterações.
3. Sistema salva a avaliação com a data: o prato passa a constar como concluído (RN01) e o preparo entra no histórico (RN06).
4. Sistema verifica desbloqueios decorrentes: evoluções do prato (RN02) e badges (RN03, RN04).

Fluxos alternativos/exceção:
- FA1 Prato repetido: novo registro separado, sem sobrescrever avaliações anteriores (RN06).
- FA2 Avaliação iniciada a partir de um item do plano: o item passa a "concluído".
- FE1 Nota ausente: sistema impede o salvamento (RN05, RNF10).

## UC11 — Consultar coleção por culinária

Ator: Usuario | Origem: US14 | Classes: Usuario, Prato, Culinaria

Fluxo principal:
1. Usuario abre a coleção.
2. Sistema agrupa os pratos concluídos (RN01) por culinária.
3. Para cada culinária, sistema exibe o percentual de progresso (RN07).
4. Em uma culinária incompleta, sistema exibe quantos pratos faltam (RN07).

Fluxos alternativos/exceção:
- FA1 Coleção vazia: sistema convida o usuário a concluir o primeiro prato.

## UC12 — Importar e manter catálogo de receitas

Ator: Curador | Origem: US18 | Classes: Prato, Receita, Culinaria, Ingrediente, Utensilio

Fluxo principal:
1. Curador importa uma receita de plataforma pública.
2. Curador cadastra o prato (nome, imagem, culinária) e a receita (ingredientes, utensílios, dificuldade, tempo, passo a passo, alérgenos e fonte — RN17).
3. Se o prato for uma evolução, Curador indica exatamente um prato base (RN18).
4. Sistema valida os campos obrigatórios e publica no catálogo.

Fluxos alternativos/exceção:
- FA1 Ingrediente, utensílio ou culinária inexistentes: Curador cadastra no ato (uma culinária pode existir temporariamente sem pratos — D11c).
- FE1 Fonte ausente: sistema bloqueia a publicação (RN17, RNF08).

## UC13 — Desbloquear evolução de prato

Ator: Usuario | Origem: US15 (Should — registro opcional aprovado) | Classes: Usuario, Prato, Avaliacao

Fluxo principal:
1. Usuario salva a avaliação de um prato que é base de uma cadeia (UC10).
2. Sistema identifica as evoluções diretas desse prato (RN18).
3. Cada evolução direta é desbloqueada para o usuário (RN02).
4. A evolução desbloqueada passa a poder aparecer em sugestões e a ser planejada e preparada.

Fluxos alternativos/exceção:
- FA1 Evolução já desbloqueada: avaliações posteriores do mesmo prato base não geram novo desbloqueio (RN02).
- FA2 Evolução ainda bloqueada: ao visualizá-la, o sistema indica qual prato base precisa ser avaliado (RN02; UC04, FA3).
- FA3 Cadeia profunda: uma evolução desbloqueada pode ser base do nível seguinte; o próximo desbloqueio exige avaliação dela (D4, RN18).

---

## Rastreabilidade US → UC

| US | Prioridade | UC |
|---|---|---|
| US01 | Must | UC01 |
| US02 | Must | UC02 |
| US03 | Must | UC03 |
| US05 | Must | UC04 |
| US06 | Must | UC05 |
| US07 | Must | UC06 |
| US08 | Must | UC07 |
| US09 | Must | UC08 |
| US10 | Must | UC09 |
| US12 | Must | UC10 |
| US14 | Must | UC11 |
| US18 | Must | UC12 |
| US15 | Should | UC13 (registro opcional) |

US04, US11 e US16 (Should) não têm UC especificado nesta versão; seus comportamentos aparecem como fluxos alternativos e RNs referenciados (FA2 do UC01, FA1 do UC04, RN03/RN04 no UC10).
