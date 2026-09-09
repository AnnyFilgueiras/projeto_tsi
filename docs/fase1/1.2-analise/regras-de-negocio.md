# Regras de Negócio — Panelada

> Fase 1.2 — Análise. IDs estáveis (RN##); toda RN é rastreável a US/RF.
> Destino no repositório: `/docs/fase1/1.2-analise/regras-de-negocio.md`.

## Fundamentos da gamificação

RN01 — Um prato é considerado concluído por um usuário somente quando existe ao
menos uma avaliação salva por ele para esse prato. Histórico, coleção, badges e
desbloqueio de evolução consideram exclusivamente pratos concluídos.
Origem: US12, US14, US15, US16; RF11, RF13, RF14, RF15 | Status: a validar na 1.4

RN02 — Uma evolução é desbloqueada para o usuário quando ele salva a primeira
avaliação do prato base correspondente; enquanto bloqueada, a evolução exibe qual
prato base precisa ser avaliado. Avaliações adicionais do mesmo prato base não
geram novo desbloqueio.
Origem: US15; RF14 | Status: a validar na 1.4

RN03 — O marco de um badge é verificável e assume uma das formas: (a) avaliação
de um prato específico (ex.: Mini Chef — avaliar Ratatouille); (b) avaliação de
ao menos um prato de uma culinária (ex.: Chegando na Arábia); (c) avaliação de
pratos de N culinárias distintas (ex.: 10 culinárias); (d) avaliação de ao menos
um prato de cada continente do catálogo — América, África, Europa, Ásia e Oceania
(ex.: Rei do Mundo); (e) avaliação de pratos de todas as culinárias de um conjunto
temático definido pelo curador (ex.: Grandes Civilizações — Egito, Grécia, Itália).
Origem: US16; RF15 | Status: a validar na 1.4

RN04 — Um badge é concedido uma única vez por usuário, no momento em que seu marco
passa a ser atendido, registrando a data de desbloqueio; o perfil exibe os badges
conquistados e os critérios dos não obtidos; badges nunca são revogados ou perdidos.
Origem: US16; RF15, RNF09 | Status: a validar na 1.4

## Avaliação, histórico e coleção

RN05 — A nota da avaliação é obrigatória e assume valores de 0 a 5, em passos
de 0,5 (0; 0,5; 1; 1,5; …; 5); relato e alterações são opcionais.
Origem: US12; RF11, RNF10 | Status: a validar na 1.4

RN06 — Cada avaliação registrada é um preparo distinto no histórico, com data
própria; repetir um prato gera um novo registro, sem sobrescrever avaliações
anteriores.
Origem: US12; RF11 | Status: a validar na 1.4

RN07 — A coleção do usuário é o conjunto de pratos distintos que ele concluiu
(RN01), agrupados por culinária. O progresso de uma culinária é o percentual
(pratos concluídos ÷ total de pratos da culinária no catálogo); culinárias
incompletas exibem quantos pratos faltam.
Origem: US14; RF13 | Status: a validar na 1.4

## Perfil e restrições

RN08 — Um prato é incompatível com o usuário quando sua receita declara ao menos
um alérgeno associado a alguma restrição alimentar do perfil. Sugestões não
apresentam pratos incompatíveis; na busca e na visualização, pratos incompatíveis
são claramente sinalizados.
Origem: US09, US04; RF07 | Status: a validar na 1.4

RN09 — O cadastro de restrições alimentares só é persistido após consentimento
explícito do usuário, com informação de que se trata de dado sensível; o usuário
pode revogar o consentimento e excluir restrições a qualquer momento.
Origem: US09; RNF06 | Status: a validar na 1.4

## Sugestão

RN10 — As sugestões consideram o perfil (preferências e restrições, RN08) e o
histórico (prato já concluído não é apresentado como novidade). Quando o usuário
informa a despensa, as sugestões priorizam pratos compatíveis e destacam os
ingredientes faltantes; pratos que exigem utensílios ausentes são sinalizados.
Origem: US01, US03, US11; RF01, RF03, RF19 | Status: a validar na 1.4

RN11 — Aprovar uma sugestão torna-a candidata, disponível para o planejamento;
descartar impede seu retorno na mesma sessão, mas ela pode reaparecer em sessões
futuras.
Origem: US02; RF02 | Status: a validar na 1.4

## Rotina e lembretes

RN12 — Um item de rotina associa um prato candidato a uma data de preparo dentro
do período do plano; reagendar substitui a data anterior. Item cuja data passou
sem avaliação permanece "planejado", pode ser reagendado ou removido, e nenhuma
penalidade é aplicada.
Origem: US06; RF04, RNF09 | Status: a validar na 1.4

RN13 — O usuário recebe notificação com a lista de compras na data de compra e
lembrete com o prato do dia na data de preparo. Frequência e tipos são
configuráveis; se os lembretes estiverem desativados, nenhuma notificação é
enviada.
Origem: US08; RF06, RNF07 | Status: a validar na 1.4

## Lista de compras

RN14 — A lista consolida os ingredientes de todos os itens do plano, sem
duplicatas e sem quantidades (v1); o usuário define a data de compra e marca
itens como comprados; existe no máximo uma lista por plano; regenerar recalcula
a lista a partir do plano atual, preservando a marcação dos ingredientes que
permanecerem.
Origem: US07; RF05 | Status: a validar na 1.4

## Substituições e alérgenos

RN15 — Ao visualizar uma receita, para cada ingrediente faltante (ausente da
despensa) ou incompatível com restrição do perfil, o sistema sugere os
substitutos globais cadastrados; se não houver substituto cadastrado, o sistema
informa isso explicitamente, sem inventar uma troca.
Origem: US10; RF08 | Status: a validar na 1.4

RN16 — Toda receita que declara alérgenos exibe alerta na visualização; alérgenos
associados a restrições do usuário são destacados como incompatíveis.
Origem: US09; RF07 | Status: a validar na 1.4

## Catálogo

RN17 — Toda receita importada registra e exibe a fonte pública de origem.
Origem: US18; RNF08 | Status: a validar na 1.4

RN18 — Ao cadastrar um prato que participa de uma cadeia, o curador indica
exatamente um prato base; prato sem base indicada é a raiz da cadeia; cadeias
podem ter profundidade maior que dois níveis (evolução de evolução).
Origem: US18, US15; RF18, RF14 | Status: a validar na 1.4

## Regras futuras e excluídas

RN19 — (FUTURA — condicionada à US13, prioridade Could) Se a US13 entrar no
escopo: ao salvar a avaliação, o usuário recebe pontos pela dificuldade da
receita (fácil = 10, média = 20, difícil = 30), mais bônus de ineditismo de 50%
quando o prato é concluído pela primeira vez por ele; repetições recebem apenas
os pontos base; o saldo exibe a origem de cada pontuação.
Origem: US13; RF12 | Status: futura — fora do modelo conceitual v1 (decisão D1);
valores provisórios, a revisar quando priorizada (D13b)

RN20 — (EXCLUÍDA — Won't) Ranking entre amigos (ex-RF16): descartado na 1.1 por
falta de interesse dos entrevistados e custo de implementação cuidadosa do
social; nenhuma regra ativa nesta versão; candidato a revisão futura.
Origem: RF16 | Status: excluída (Won't)
