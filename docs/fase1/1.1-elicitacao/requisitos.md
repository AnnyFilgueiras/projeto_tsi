# Requisitos — Panelada

> Fase 1.1 — Elicitação. Meta renegociada com a dupla: 15–18 RF e 8–10 RNF (briefing original: 10–15 RF e 5–8 RNF). Resultado: 18 RF ativos e 10 RNF. RF16 foi descartado e preservado aqui para rastreabilidade (IDs nunca são renumerados).
> v1.1 (09/09/2026): correções da validação (Fase 1.4) aplicadas em RF02, RNF02 e RNF07 — ver `ata-revisao.md`.

## Visão do produto (v1.0, aprovada)

**Elevator pitch:** Para pessoas que gostam de cozinhar e querem escapar da rotina de repetir sempre os mesmos pratos, o Panelada é um aplicativo mobile de culinária internacional que transforma o ato de cozinhar em uma experiência divertida e recompensadora. Diferente dos apps de receitas tradicionais, ele estimula o usuário a aprender pratos novos continuamente, combinando o planejamento da rotina de cozinha com mecânicas de jogo que celebram cada receita concluída como uma conquista.

**Declaração de visão:** Ser a principal referência em culinária internacional para cozinheiros amadores que buscam variedade e diversão na cozinha. O Panelada busca tornar o processo de cozinhar mais divertido e estimular o aprendizado de pratos novos: o usuário descobre receitas de diferentes países conforme seu perfil, organiza sua rotina de refeições (escolha do prato, data de compra dos ingredientes e data de preparo), registra avaliações e adaptações pessoais, e compartilha a experiência com amigos — com catálogo inicial alimentado por plataformas públicas de receitas.

**Conceito de gamificação:** abordagem híbrida com três camadas — coleção/exploração como espinha dorsal ("Pokédex de pratos"), maestria via cadeias de evolução (prato base → versões mais complexas) e desafio social leve como consequência (sugestões entre amigos). Interação social aprofundada despriorizada nesta versão.

## Stakeholders

- **Do produto (geram requisitos):** cozinheiro/jogador (usuário principal; interesse secundário documentado: interação com amigos — se o social subir de prioridade, "amigo" volta a ser stakeholder separado); curador/admin de receitas.
- **Do projeto (influem o processo):** dupla de desenvolvimento; professor (avaliador).
- **Externo/restrição:** plataformas públicas de receitas (origem do conteúdo; exigem atribuição).

## Requisitos funcionais

| ID | Requisito | Origem |
|---|---|---|
| RF01 | O sistema deve sugerir pratos com base no perfil do usuário (preferências, restrições e histórico de preparos) | M, D1, D2 |
| RF02 | O sistema deve permitir aprovar ou descartar cada prato sugerido com um único toque (alinhado à US02 e ao RNF04) | D2, M |
| RF03 | O sistema deve permitir registrar os ingredientes disponíveis em casa e sugerir pratos compatíveis, indicando os ingredientes faltantes | M, R, D1 |
| RF04 | O sistema deve permitir planejar refeições da semana ou quinzena, associando cada prato a uma data de preparo | M, C |
| RF05 | O sistema deve gerar uma lista de compras consolidada a partir dos pratos planejados, com data de compra | M, D1, BM-SideChef |
| RF06 | O sistema deve enviar lembretes nas datas de compra e de preparo definidas pelo usuário | D2, C, BM-Duolingo |
| RF07 | O sistema deve permitir cadastrar restrições alimentares no perfil, filtrar automaticamente as sugestões e alertar sobre alérgenos presentes em uma receita | C, D2, BM-Yummly |
| RF08 | O sistema deve sugerir substituições para ingredientes marcados como indisponíveis ou restritos ao usuário | D1, R, C |
| RF09 | O sistema deve permitir buscar receitas por nome, país/culinária, ingrediente ou tempo de preparo | Escopo |
| RF10 | O sistema deve exibir cada receita com imagem, tempo de preparo, nível de dificuldade, ingredientes e passo a passo | BM-Tasty, M, R |
| RF11 | O sistema deve permitir registrar avaliação pessoal de cada prato concluído (nota, relato e alterações feitas), mantendo o histórico de preparos do usuário | D1, D2, C, M |
| RF12 | O sistema deve atribuir pontos por prato concluído, calculados a partir da dificuldade da receita e do ineditismo para o usuário | Escopo, R |
| RF13 | O sistema deve manter a coleção pessoal de pratos do usuário, exibindo o progresso por país/culinária | R, M, decisão de gamificação |
| RF14 | O sistema deve organizar pratos em cadeias de evolução, em que uma versão base desbloqueia versões mais complexas | Decisão de gamificação, todos |
| RF15 | O sistema deve conceder badges ao atingir marcos definidos (ex.: pratos de N países distintos) | Escopo, C, R |
| ~~RF16~~ | ~~O sistema deve exibir um ranking de pontos entre o usuário e seus amigos~~ — **DESCARTADO (Won't):** apenas 1 dos 5 entrevistados demonstrou interesse; social despriorizado pela dupla | Escopo, R |
| RF17 | O sistema deve permitir sugerir um prato a um amigo | Escopo, D1, C, R |
| RF18 | O sistema deve permitir ao curador importar e manter o catálogo de receitas, incluindo dificuldade, alérgenos e cadeias de evolução | Decisão de fonte de conteúdo |
| RF19 | O sistema deve informar os utensílios necessários em cada receita e sinalizar, nas sugestões, os pratos inviáveis pelos utensílios que o usuário declarou possuir | D1, R |

## Requisitos não funcionais

| ID | Requisito | Origem |
|---|---|---|
| RNF01 | O sistema deve ser um aplicativo mobile | Decisão da dupla |
| RNF02 | O sistema deve levar o usuário do primeiro acesso à primeira sugestão de prato em até 2 minutos, com no máximo 3 campos obrigatórios antes do primeiro uso | D1, D2, M, C, BM-Yummly (anti-req.) |
| RNF03 | O sistema deve responder a uma solicitação de sugestão de pratos em até 2,5 segundos | Derivado (decisão rápida, D2) |
| RNF04 | O sistema deve permitir iniciar qualquer fluxo principal (sugestões, planejamento, registro de avaliação) em até 2 toques a partir da tela inicial | C, D1, D2 |
| RNF05 | O sistema deve permitir consultar offline as receitas já planejadas ou em preparo | C (cozinha/bancada) |
| RNF06 | O sistema deve tratar dados de restrições alimentares como dados sensíveis, com consentimento explícito, conforme a LGPD | C, D2 |
| RNF07 | O sistema deve permitir configurar frequência e tipos de notificação, com limite padrão de 1 notificação por evento (compra ou preparo) e no máximo 2 por dia | D2, BM-Duolingo (anti-req.) |
| RNF08 | O sistema deve exibir a atribuição da fonte pública de cada receita importada | Stakeholder externo |
| RNF09 | O sistema não deve punir o usuário por inatividade (sem perda de pontos, sequências ou progresso) | BM-Duolingo (anti-req.) |
| RNF10 | O registro de avaliação deve ter apenas a nota como campo obrigatório; relato e alterações são opcionais | R, walkthrough da dupla |

## Anti-requisitos (benchmarking dirigido)

- Sem cadastro longo antes do primeiro uso (Yummly como contraexemplo).
- Sem conteúdo gerado por usuários na v1 (Cookpad como contraexemplo; catálogo curado).
- Sem punição por inatividade ou pressão excessiva por notificações (Duolingo como contraexemplo parcial).
- Sem integração de e-commerce de supermercado (SideChef como contraexemplo de escopo).
- Ranking nunca como elemento central — descartado nesta versão.
