# Léxico do Domínio — Panelada

> Fase 1.1 — Elicitação. Termos do domínio do app de culinária internacional gamificada.

| Termo | Definição |
|---|---|
| **Prato** | Item culinário que o usuário pode preparar; unidade básica da coleção. |
| **Receita** | Conjunto de instruções de um prato: ingredientes, utensílios, passo a passo, tempo de preparo, dificuldade, alérgenos e fonte. |
| **Culinária** | Conjunto de pratos de um país ou região (ex.: japonesa, italiana, nordestina). |
| **Coleção** | Conjunto dos pratos que o usuário já concluiu, organizado por culinária, com progresso de completude ("Pokédex de pratos"). |
| **Prato base** | Versão mais simples de uma cadeia de evolução (ex.: cuscuz). |
| **Evolução** | Versão mais complexa de um prato, desbloqueada ao concluir o prato base (ex.: cuscuz recheado). |
| **Cadeia de evolução** | Sequência que liga um prato base às suas evoluções. |
| **Ponto** | Unidade de pontuação recebida por prato concluído, calculada por dificuldade e ineditismo (prioridade Could). |
| **Ineditismo** | Condição de um prato nunca preparado pelo usuário; gera bônus de pontuação. |
| **Badge** | Conquista concedida ao atingir um marco definido (ex.: pratos de 10 países distintos). |
| **Despensa** | Registro dos ingredientes que o usuário declara ter em casa; base para sugestões de "cozinhar na hora". |
| **Utensílios** | Equipamentos de cozinha que o usuário declara possuir (ex.: fogão, forno); sugestões respeitam essa disponibilidade. |
| **Sugestão** | Prato recomendado pelo sistema com base no perfil, restrições, despensa e utensílios do usuário. |
| **Candidata** | Sugestão aprovada pelo usuário com um toque; fica disponível para o planejamento. |
| **Plano** | Conjunto de pratos candidatos associados a datas de preparo em um período (semana ou quinzena). |
| **Lista de compras** | Ingredientes consolidados dos pratos do plano, sem duplicatas, com data de compra definida pelo usuário. |
| **Lembrete** | Notificação enviada na data de compra ou de preparo; configurável em frequência e tipo. |
| **Avaliação** | Registro pessoal de um preparo concluído: nota (obrigatória), relato e alterações na receita (opcionais). |
| **Histórico** | Todos os preparos realizados pelo usuário, cada um com data e avaliação; repetições são registradas separadamente. |
| **Restrição alimentar** | Condição declarada no perfil (ex.: diabetes) que filtra sugestões; tratada como dado sensível (LGPD). |
| **Alérgeno** | Substância presente em uma receita com risco de reação alérgica; gera alerta na visualização. |
| **Substituição** | Ingrediente alternativo sugerido pelo sistema para um ingrediente indisponível ou restrito; se não houver substituto cadastrado, o sistema informa explicitamente. |
| **Curador** | Papel responsável por importar e manter o catálogo de receitas (fonte, dificuldade, alérgenos, cadeias de evolução). |
| **Catálogo** | Conjunto curado de receitas importadas de plataformas públicas; usuários não submetem receitas na v1. |
| **Ranking** | Comparação de pontos entre amigos. **Descartado (Won't)** nesta versão: apenas 1 dos 5 entrevistados demonstrou interesse e a implementação cuidadosa do social foi despriorizada. |
