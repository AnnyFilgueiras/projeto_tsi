# Regras de Negócio — Panelada

> Fase 1.2 — Análise. IDs estáveis (RN##); toda RN é rastreável a US/RF.
> Destino no repositório: `/docs/fase1/1.2-analise/regras-de-negocio.md`.

## Fundamentos da gamificação (6D Framework + Octalysis — ADR-016)

RN01 — Um prato é considerado concluído por um usuário somente quando existe ao
menos uma avaliação salva por ele para esse prato. Histórico, coleção, badges e
desbloqueio de evolução consideram exclusivamente pratos concluídos.
Origem: US12, US14, US15, US16; RF11, RF13, RF14, RF15 | Status: validado

RN02 — Uma evolução é desbloqueada para o usuário quando ele salva a primeira
avaliação do prato base correspondente; enquanto bloqueada, a evolução exibe qual
prato base precisa ser avaliado. Avaliações adicionais do mesmo prato base não
geram novo desbloqueio.
Origem: US15; RF14 | Status: validado

RN03 — O marco de um badge é verificável, definido declarativamente por seed da
dupla e fundamentado no framework híbrido 6D + Octalysis (ADR-016), assumindo
uma das oito formas: (a) avaliação de um prato específico (ex.: Mini Chef —
avaliar Ratatouille); (b) avaliação de ao menos um prato de uma culinária (ex.:
Chegando na Arábia); (c) avaliação de pratos de N culinárias distintas (ex.: 10
culinárias); (d) avaliação de ao menos um prato de cada continente do catálogo —
América, África, Europa, Ásia e Oceania (ex.: Rei do Mundo); (e) avaliação de pratos de todas as culinárias de um conjunto temático definido declarativamente por seed pela dupla/curador
(ex.: Grandes Civilizações — Egito, Grécia, Itália); (f) avaliação de ao menos
N pratos distintos do catálogo (ex.: Primeiro Fogo — 1 prato; Chef de Rotina —
5 pratos; Onboarding e consistência — 6D Progression Stair / CD2); (g) avaliação
de ao menos um prato com nível de profundidade ≥ k (k ≥ 2) em uma cadeia de
evolução, onde o prato raiz tem nível 1, sua evolução direta nível 2 e assim
sucessivamente (ex.: Além do Básico / Mestre da Evolução — Maestria CD2); (h)
registro de avaliação com alterações pessoais na receita (`alteracoes` não vazio)
em ao menos N preparos (ex.: Toque Pessoal / Alquimista da Cozinha — Expressão
Criativa CD3).
Origem: US16, US12, US15; RF15, RF11, RF14; ADR-016 | Status: validado (estendido na retroalimentação 6D + Octalysis)

RN04 — Um badge é concedido uma única vez por usuário, no momento em que seu marco
passa a ser atendido, registrando a data de desbloqueio; o perfil exibe os badges
conquistados e os critérios dos não obtidos; badges nunca são revogados ou perdidos.
Origem: US16; RF15, RNF09 | Status: validado

## Avaliação, histórico e coleção

RN05 — A nota da avaliação é obrigatória e assume valores de 0 a 5, em passos
de 0,5 (0; 0,5; 1; 1,5; …; 5); relato e alterações são opcionais. Nota técnica
(Fase 2): no contrato de API e na persistência, a nota é representada como
inteiro `score` de 0 a 10 (meios-pontos), preservando a exibição e validação de
0 a 5 em passos de 0,5 na interface.
Origem: US12; RF11, RNF10 | Status: validado

RN06 — Cada avaliação registrada é um preparo distinto no histórico, com data
própria; repetir um prato gera um novo registro, sem sobrescrever avaliações
anteriores.
Origem: US12; RF11 | Status: validado

RN07 — A coleção do usuário é o conjunto de pratos distintos que ele concluiu
(RN01), agrupados por culinária. O progresso de uma culinária é o percentual
(pratos concluídos ÷ total de pratos da culinária no catálogo); culinárias
incompletas exibem quantos pratos faltam.
Origem: US14; RF13 | Status: validado

## Perfil e restrições

RN08 — Para usuário com ao menos uma restrição alimentar cadastrada, um prato é
incompatível quando sua receita declara ao menos um alérgeno associado a alguma
restrição do perfil, ou quando seu estado de alérgenos for "não verificado". A
lista de alérgenos vazia significa "não verificado", nunca "sem alérgenos",
salvo quando o curador confirma explicitamente no checklist de verificação que a
receita não contém nenhum dos 19 códigos do vocabulário controlado
(`confirmadoSemAlergenos = true`, ADR-014). Para usuário sem restrições
cadastradas, receitas não verificadas continuam classificadas como compatíveis,
sempre exibindo seu estado de alérgenos (RN16). Sugestões não apresentam pratos
incompatíveis; na busca e na visualização, pratos incompatíveis são claramente
sinalizados com aviso sobre a incompatibilidade.
Origem: US09, US04; RF07 | Status: validado (refinada na Fase 2 — Lote 3)

RN09 — O cadastro de restrições alimentares só é persistido após consentimento
explícito do usuário, com informação de que se trata de dado sensível; o usuário
pode revogar o consentimento e excluir restrições — bem como solicitar a
exclusão completa da conta e de todos os dados pessoais e sensíveis associados
(LGPD art. 18, VI; ADR-007) — a qualquer momento.
Origem: US09; RNF06 | Status: validado (refinada na Fase 2 — Lote 3)

## Sugestão

RN10 — As sugestões consideram o perfil (preferências e restrições com alérgenos verificados, RN08) e o
histórico (prato já concluído não é apresentado como novidade). Quando o usuário
informa a despensa, as sugestões priorizam pratos compatíveis e destacam os
ingredientes faltantes; pratos que exigem utensílios ausentes são sinalizados.
Origem: US01, US03, US11; RF01, RF03, RF19 | Status: validado

RN11 — Aprovar uma sugestão torna-a candidata, disponível para o planejamento;
descartar impede seu retorno na mesma sessão, mas ela pode reaparecer em sessões
futuras.
Origem: US02; RF02 | Status: validado

## Rotina e lembretes

RN12 — Um item de rotina associa um prato candidato a uma data de preparo dentro
do período do plano; reagendar substitui a data anterior. Item cuja data passou
sem avaliação permanece "planejado", pode ser reagendado ou removido, e nenhuma
penalidade é aplicada.
Origem: US06; RF04, RNF09 | Status: validado

RN13 — O usuário recebe notificação com a lista de compras na data de compra e
lembrete com o prato do dia na data de preparo. Frequência e tipos são
configuráveis; se os lembretes estiverem desativados, nenhuma notificação é
enviada.
Origem: US08; RF06, RNF07 | Status: validado

## Lista de compras

RN14 — A lista consolida os ingredientes de todos os itens do plano, sem
duplicatas e sem quantidades (v1); o usuário define a data de compra e marca
itens como comprados; existe no máximo uma lista por plano; regenerar recalcula
a lista a partir do plano atual, preservando a marcação dos ingredientes que
permanecerem.
Origem: US07; RF05 | Status: validado

## Substituições e alérgenos

RN15 — Ao visualizar uma receita, para cada ingrediente faltante (ausente da
despensa) ou incompatível com restrição do perfil, o sistema sugere os
substitutos globais cadastrados (vindos de cadastro manual ou de proposta de IA
aprovada pelo curador); se não houver substituto cadastrado, o sistema
informa isso explicitamente, sem inventar uma troca.
Origem: US10; RF08 | Status: validado

RN16 — Toda receita exibe seu estado de alérgenos (verificado, declarado pela fonte, não verificado) na visualização; caso possua alérgenos
associados às restrições do usuário ou tenha o estado "não verificado", o sistema alerta com "compatibilidade não confirmada".
Origem: US09; RF07 | Status: validado

RN21 — Todo substituto de ingrediente proposto por agente de IA só é cadastrado e disponibilizado no catálogo após revisão e aprovação do curador.
Origem: US10, US18; RF08 RF18 | Status: validado

RN22 — Um substituto cadastrado só é sugerido para um ingrediente incompatível se não contiver alérgenos associados ao perfil. Se o substituto tiver a lista de alérgenos não verificada, ele não é sugerido a quem possui alguma restrição.
Origem: US10; RF08; RN08 | Status: validado

## Catálogo

RN17 — Toda receita importada registra e exibe a fonte pública de origem.
Origem: US18; RNF08 | Status: validado

RN18 — Ao cadastrar um prato que participa de uma cadeia, o curador indica
exatamente um prato base; prato sem base indicada é a raiz da cadeia; cadeias
podem ter profundidade maior que dois níveis (evolução de evolução).
Origem: US18, US15; RF18, RF14 | Status: validado

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
