## [30/09/2026] — Conversa 2.0 (Planejamento da Fase 2)

- **Papel da IA:** arquiteto de software sênior e consultor de projetos
  acadêmicos, acumulando planejamento da fase, mapeamento de insumos por
  sub-etapa e verificação de pendências herdadas da Fase 1.
- **Técnicas aplicadas:** decomposição da fase em sub-etapas incrementais
  (2.1–2.9); definição de insumos mínimos por sub-etapa; modelo de diário
  incremental com campo de retroalimentação; levantamento de pendências da
  Fase 1 a partir do `resumo-1.4-fechamento.md`.
- **Prompts-chave usados:**
  1. Prompt de planejamento (contexto + papel + ação + formato + raciocínio
     passo a passo).
  2. Correções da dupla: pedir só os artefatos necessários por sub-etapa;
     sub-etapas incrementais com diário de bordo; incluir o Bruno; ADR em
     Markdown no repositório; slides só ao final.
  3. Envio do diário da Fase 1 para adaptar o formato.
  4. Questionamento da dupla sobre RN19 e "candidata" listados como
     "decisões a tratar" (ver iterações).
- **Insumos usados:** `requisitos.md`, `backlog.md`, `regras-de-negocio.md`,
  `resumo-1.4-fechamento.md` (anexos); diário da Fase 1 (colado na conversa).
- **Artefatos produzidos:** guia de execução da Fase 2; modelo de
  `diario-de-bordo-fase2.md`; abertura pronta da conversa 2.1.

### Decisões tomadas (planejamento)
1. ADR em Markdown no repositório (`docs/adr/`), um arquivo por decisão.
2. Bruno como cliente de API, com coleção versionada no repositório;
   contrato em OpenAPI.
3. Diagramas como código (Mermaid, com PlantUML se o C4 exigir).
4. Slides apenas ao final da Fase 2.
5. Cada sub-etapa anexa só o artefato da anterior e a fatia necessária da
   Fase 1, e termina com entrada no diário.

### Restrições da Fase 2 informadas pela dupla
- MVP em 1,5 mês; infraestrutura gratuita (custo baixo de pagamento único
  aceitável); escala de milhares de usuários.
- Stack: experiência com React e TypeScript; Flutter não descartado
  (comparar na 2.3).
- Offline parcial: apenas pratos candidatos e pratos já preparados.

### Linha de base da Fase 1 (confirmada pela dupla em 30/09/2026)
- 14 correções da 1.4 aplicadas.
- Artefatos da 1.4 commitados.
- Merge de `project-design` na `main` feito.
- Milestone "Fase 1 — Engenharia de Requisitos" fechado.
- Pendências de processo da Fase 1 resolvidas.
- Tag `backlog-validado-v1.0`: criada em 30/09

### Restrições herdadas da Fase 1 (não são pendências)
- Ranking = Won't; pontuação = Could (RN19 futura; D13b só vale se a
  pontuação for priorizada).
- Catálogo curado e importado; usuário não submete receita na v1.
- "Candidata" é o termo canônico; estado "planejado" via `ItemDeRotina`.
- Avaliação liga-se a Prato (D11a); nota de 0 a 5 em passos de 0,5 (D13a).
- RNF07: no máximo 2 notificações por dia.

### Iterações relevantes (erros e retrabalho da IA)
1. A primeira versão do guia pedia todos os artefatos da Fase 1 de uma vez;
   a dupla exigiu só os necessários por sub-etapa.
2. A leitura dos arquivos do projeto pela IA falhou (causa desconhecida);
   anexar na conversa passou a ser o caminho padrão.
3. A IA listou RN19 e "candidata" como "decisões a tratar", mas eram
   restrições herdadas já documentadas; a dupla questionou e a IA corrigiu a
   classificação.
4. A IA listou como pendentes itens que a dupla já havia concluído;
   lição: confirmar o estado do repositório antes de listar pendências.

### Divergências registradas (briefing/professor × artefatos)
- Nenhuma até o momento.

### Riscos aceitos
- Nenhum nesta conversa.

### Pendências para a próxima conversa (2.1)
- Na 2.1, conferir a definição de "prato concluído" (gatilho de coleção,
  evolução e badges; base da lista offline de pratos já preparados).



## [05/10/2026] — Conversa 2.0 (continuação: estratégia de briefings)

- **Papel da IA:** arquiteto de software sênior e consultor de projetos
  acadêmicos, acumulando desenho do processo da fase e redação do
  documento-mestre.
- **Técnicas aplicadas:** análise das falhas de briefing da Fase 1;
  separação entre briefing global (mapa) e briefing de passagem (estado);
  matriz de peso dos artefatos por sub-etapa; Definition of Done por etapa.
- **Prompts-chave usados:**
  1. Pergunta da dupla sobre como cada thread saberia a fase seguinte e a
     relevância de cada artefato para sua sucessora.
  2. Observação da dupla de que a abordagem de briefings de passagem ainda
     contextualizava pouco a fase inteira, com proposta de um arquivo único
     de recapitulação da Fase 2.
  3. Confirmação de que a 2.1 recebe apenas o briefing-mestre, o diário e
     os artefatos definidos para ela.
- **Artefatos produzidos:** `briefing-fase2.md` v1.0 (briefing-mestre);
  modelo de briefing de passagem; prompt de abertura da 2.1 simplificado.
- **Insumos usados:** diário da Fase 1 (colado na conversa);
  `resumo-1.4-fechamento.md` (anexo, para levantar pendências herdadas).

### Decisões tomadas
1. **Dois níveis de briefing:** o briefing-mestre (`briefing-fase2.md`) é
   anexo fixo de toda sub-etapa; o briefing de passagem é escrito ao final
   de cada conversa para a seguinte.
2. **Briefing de passagem gerado no fim da etapa anterior**, não planejado
   de antemão, para evitar a divergência vista na Fase 1 (briefings 1.2 e 1.4).
3. **Precedência em caso de conflito:** artefatos aprovados > ADRs >
   briefing de passagem > briefing-mestre.
4. **Alterações no briefing-mestre** exigem motivo registrado no diário e
   nova versão, como as ADRs.
5. **Entrega de cada sub-etapa passa a ser:** artefato + entrada do diário +
   briefing da próxima + (se couber) proposta de alteração do mestre.
6. **A 2.1 não recebe briefing de passagem** (é a primeira etapa). Anexos:
   `briefing-fase2.md`, `diario-de-bordo-fase2.md`, `requisitos.md`,
   `backlog.md`, `regras-de-negocio.md`, `resumo-1.4-fechamento.md`.
7. **Linha de base confirmada em 05/10/2026:** tag `backlog-validado-v1.0`
   criada e histórico de revisões do `briefing-fase2.md` preenchido (v1.0).
8. **Campo "Divisão de tarefas" descontinuado** (briefing-mestre v1.1): a
   dupla decidiu não registrar essa informação.

### Iterações relevantes (erros e retrabalho da IA)
1. A proposta inicial de briefings de passagem contextualizava só a etapa
   vizinha; a dupla apontou a falta de visão da fase inteira, o que levou
   ao briefing-mestre.
2. A matriz de peso dos artefatos foi escrita sem conferir o conteúdo de
   `casos-de-uso.md` e `modelo-conceitual.md`, que não foram anexados;
   pode precisar de ajuste (v1.1) quando esses arquivos forem usados.

### Divergências registradas (briefing/professor × artefatos)
- Nenhuma nesta conversa. [CONFIRMAR: o material do professor da Fase 2
  contradiz alguma decisão da Fase 1?]

### Riscos aceitos
- Briefing-mestre pode ficar desatualizado; mitigado por versionamento e
  pela regra de precedência.

### Pendências para a próxima conversa (2.1)
- Commitar `briefing-fase2.md` e o diário atualizado em `/docs/fase2/`.
- Na 2.1, conferir a definição de "prato concluído" nas RNs.


## [05/10/2026] — Conversa 2.1 (Requisitos de qualidade)

- **Papel da IA:** arquiteto de software sênior (analista de qualidade).
- **Técnicas aplicadas:** conferência de "prato concluído" contra RN01, RN05 e o texto das US; levantamento de atributos candidatos a partir de RNF, RN e restrições do briefing; cenários de qualidade (estímulo, fonte, ambiente, resposta, medida); priorização em faixas com justificativa; lista de conflitos e riscos aceitos.
- **Prompts-chave usados:**
  1. Abertura da 2.1 com confirmação de fase, papel e insumos e instrução de perguntar antes de fechar a priorização.
  2. Respostas da dupla sobre offline (RNF05), alérgenos, diabetes, observabilidade e escopo do catálogo.
  3. Ajustes de prioridade (A07 para Médio, A09 para Alto) e de escala (1.500 usuários).
- **Insumos usados:** `briefing-fase2.md` (seções 3, 5, 7 e 8), `diario-de-bordo-fase2.md`, `requisitos.md`, `backlog.md`, `regras-de-negocio.md`, `resumo-1.4-fechamento.md`.
- **Artefatos produzidos:** `atributos-qualidade.md` v1.0; briefing de passagem da 2.2.

### Decisões tomadas
1. Vale a RNF05; offline cobre receitas planejadas, em preparo e preparadas. Candidatas não ficam offline.
2. "Em preparo" é o prato aberto no passo a passo.
3. Avaliação salva offline, com sincronização posterior; evolução e badge são desbloqueados offline, desde que as receitas planejadas tenham sido baixadas.
4. "Prato concluído" mantém a RN01 (concluir = salvar avaliação).
5. Alérgenos têm estado (verificado, declarado pela fonte, não verificado); lista vazia = não verificado; receita não verificada não é sugerida a quem tem restrição.
6. MVP trata só alérgenos; diabetes é risco aceito, com aviso.
7. A13 (observabilidade técnica) e A14 (engajamento) separados; A14 fora do MVP.
8. Priorização: Crítico A06, A05, A08, A04; Alto A09, A01, A02; Médio A07, A03, A11, A13; Baixo A12.
9. Dimensionamento: 1.500 usuários ativos em dia de pico; catálogo de 350 pratos; lançamento com 100 pratos verificados.

### Artefatos alterados (retroalimentação)
- `requisitos.md`: incluídos RNF11 (apoio opcional de IA), RNF08 ampliado para IA e RNF06 com restrição de envio de dados para IA.
- `regras-de-negocio.md`: incluídas RN21 (aprovação explícita de IA pelo curador) e RN22 (segurança de alérgenos em substitutos).
- `backlog.md`: atualizados critérios de aceite das histórias US09, US10 e US18.
- `modelo-conceitual.md`: adicionado atributo `alergenos` na classe `Ingrediente`.
- `casos-de-uso.md`: atualizado UC09 (substitutos seguros via RN22) e UC12 com o fluxo alternativo FA2 (IA) e exceção FE2.
- `matriz-rastreabilidade.md`: mapeamento atualizado para cobrir RN21, RN22 e RNF11.
- `casos-de-teste.md`: atualizados CT19 e CT20; adicionados CT28 (RN21), CT29 (RN22) e CT30 (RNF11).
- `lexico.md`: incluídos os termos *Estado de alérgenos*, *Em preparo*, *Proposta de IA* e *Agente de IA*.
- `documento-de-requisitos.md`: re-sincronizado com os arquivos fontes.

### Iterações relevantes (erros e retrabalho da IA)
1. Na primeira resposta, a IA tratou o texto das US12 e US13 como possível mudança de regra; a dupla manteve a RN01 e a correção ficou só de redação.
2. A IA não havia considerado condições além de alergias (diabetes); a dupla apontou e a regra do estado de alérgenos foi criada.
3. A dupla comentou valores de cache e de catálogo (500 pratos) que não constavam da conversa; a IA reapresentou as propostas como hipóteses, e a dupla ajustou o catálogo para 350 pratos e a escala para 1.500 usuários.
4. A IA propôs 1.000 a 5.000 usuários; a dupla reduziu para 1.500.

### Divergências registradas (briefing/professor × artefatos)
- O briefing-mestre diz que o offline cobre "candidatos e já preparados"; a RNF05 aprovada diz "planejadas ou em preparo". Segue a RNF05, ajustada pela dupla (planejadas, em preparo e preparadas). Proposta de alteração do briefing-mestre na próxima versão.
- O arquivo `briefing-mestre-v1.1.md` ainda traz título v1.0, sem linha v1.1 no histórico, e um trecho solto sobre "Divisão de tarefas" na seção 6. A dupla informou ter versão local corrigida, ainda não commitada.

### Riscos aceitos
- R1: diabetes e outras condições não verificadas no MVP, com aviso fixo.
- R2: alérgenos possivelmente desatualizados durante o uso offline, com data da última atualização exibida.
- R3: A14 fora do MVP.

### Pendências para a próxima conversa (2.2)
- Anexar a versão corrigida do briefing-mestre e commitar.
- Abrir a issue agrupada de retroalimentação da Fase 1.
- Revalidar na 2.3 as medidas marcadas (H): dispositivo de referência, 2 s de abertura offline, 24 h de exclusão e limites da camada gratuita.
- Conferir se o modelo conceitual comporta o estado de alérgenos e o conceito de "em preparo".


## [06/10/2026] — Conversa 2.2 (Estilo arquitetural)

- **Papel da IA:** arquiteto de software, com análise de trade-offs.
- **Técnicas aplicadas:** definição de estilos candidatos; matriz estilo × atributos prioritários com pesos da 2.1 (crítico = 3, alto = 2); separação em duas decisões (sistema e servidor); regra de um estilo dominante por nível com táticas justificadas; análise do que se perde e dos gatilhos de revisão; fechamento de lacunas por perguntas numeradas antes de gerar os artefatos.
- **Prompts-chave usados:**
  1. Abertura da 2.2 com o briefing-mestre (seções 3, 5, 7 e 8), o briefing de passagem e o diário, com instrução de parar se faltasse algum anexo.
  2. Instrução de gerar os arquivos somente depois de fechar todas as lacunas sobre estilos.
  3. Respostas da dupla às lacunas: sugestão no servidor, checagem de alérgenos, desbloqueio com servidor apenas confirmando, limite de protótipo de sincronização em 10 dias.
  4. Perguntas da dupla sobre misturar estilos, sobre "por feature" ser arquitetura ou estilo e sobre o motivo da separação em duas decisões.
  5. Correção da dupla após a entrega: a criptografia no dispositivo é obrigatória pela LGPD e não pode ser adiada.
- **Insumos usados:** `briefing-fase2.md`, `briefing-passagem-2.2.md`, `diario-de-bordo-fase2.md` (com a entrada 2.1), `atributos-qualidade.md` v1.0.
- **Artefatos produzidos:** `estilo-arquitetural.md` v1.0; esta entrada; briefing de passagem da 2.3.

### Decisões tomadas
1. **Estilo do sistema (D1):** E2, offline-first com sincronização (confirmado expressamente pela dupla), restrito ao conjunto baixado (planejadas, em preparo, preparadas). Alternativa viva: E3 (BaaS). Descartados: E1 (não cobre A04 e A08) e E5 puro (conflito com a LGPD, A05, e curva alta).
2. **Estilo interno do servidor (D2):** monólito modular; microsserviços descartados.
3. **Sugestão e busca (A01) no servidor.** Nota do E2 em A01 caiu de 5 para 3; total do E2 em 70 (E3 e E5 com 60, E1 com 55).
4. **Checagem de alérgenos:** servidor para sugestão e busca; cliente para abrir receita baixada; mesma suíte de testes nos dois lados.
5. **Desbloqueio de evolução e badge:** local no cliente; servidor apenas confirma, sem revogar (RN04).
6. **Regra do projeto:** um estilo dominante por nível, mais táticas justificadas, com registro do atributo resolvido e do custo.
7. **Idempotência:** só o princípio na 2.2 (identificador estável gerado no cliente; reenvio tratado como repetição); mecanismo na 2.6.
8. **Gatilho do protótipo de sincronização:** 10 dias corridos (cerca de 22% dos 45 dias do MVP).
9. **Criptografia da restrição alimentar:** requisito do estilo, e não risco aceito. Cobre TLS, repouso no servidor e repouso no dispositivo (banco local, fila e backups). Fundamento: LGPD art. 46 e §2º. A dupla corrigiu a decisão anterior de adiar; mecanismo na 2.3 e na 2.4.
10. **Organização por feature:** diretriz do cliente (feature-first, com camadas dentro de cada feature), não estilo na matriz; detalhamento na 2.5 e na 2.7.
11. **Pipeline de importação e notificações assíncronas:** a avaliar na 2.3 e na 2.4.
12. **Prazo, custo e curva de aprendizado:** colunas de apoio na 2.2; peso formal na 2.3.
13. Esta etapa não gera ADR; o ADR de estilo (e o de servidor) nasce na 2.4.

### Iterações relevantes (erros e retrabalho da IA)
1. A IA interrompeu a primeira tentativa por não localizar `briefing-fase2.md` entre os arquivos (existia `briefing-mestre-v1.1.md` com o mesmo tamanho); a dupla anexou o arquivo.
2. Na primeira entrega, a IA gerou os arquivos antes de fechar as lacunas e condensou os passos de confirmação do roteiro; a dupla pediu para discutir antes, e os arquivos foram refeitos.
3. A IA considerou, na primeira matriz, que a sugestão rodava sobre catálogo local, o que contradizia a decisão da 2.1 de que candidatas não ficam offline; a dupla decidiu que a sugestão roda no servidor, e a nota de A01 foi corrigida.
4. A IA misturou estilos de sistema e de servidor na mesma matriz (E4 perdia em A04, que é problema de cliente); a separação em D1 e D2 corrige isso.
5. A IA tinha usado "2 semanas" como gatilho de sincronização por hipótese própria; a dupla definiu 10 dias.
6. A dupla trocou os termos ao descrever "layer-first com camadas dentro de cada feature"; esclarecido que a proposta é feature-first.
7. A IA aceitou adiar a criptografia e a registrou como risco aceito (R5) em vez de contestar; a dupla corrigiu. Lição: obrigação legal não se registra como risco aceito; deve virar requisito. O mesmo cuidado vale para o resto da Fase 2 (LGPD, A05, A13).

### Divergências registradas (briefing/professor × artefatos)
- **Numeração de atributos:** o briefing de passagem da 2.2 usa AQ01–AQ12; o artefato aprovado usa A01–A14. Seguidos os IDs do artefato; "AQ01 a AQ07" lido como A06, A05, A08, A04, A09, A01 e A02. O briefing da 2.3 usa só os IDs A##.
- As divergências sobre o escopo do offline e sobre a versão do briefing-mestre já constam na entrada 2.1 e seguem válidas.

### Riscos aceitos
- R4: complexidade de sincronização consumir o prazo; mitigada pelo escopo mínimo e pelo gatilho de 10 dias.
- R5: sugestão online dependente de rede e da camada gratuita (A01 × A11); medição na 2.3.
- A criptografia da restrição alimentar não é risco aceito; é requisito (decisão 9).

### Artefatos alterados (retroalimentação)
- Nenhum artefato anterior alterado.
- **A05 reaberto (proposta):** acrescentar a medida "0 registros de restrição alimentar em texto claro no dispositivo, no servidor e nos backups; comunicação somente por TLS". A alteração em `atributos-qualidade.md` ainda não foi feita.
- `atributos-qualidade.md`: medidas (H) de A04 e A08 viram critérios do protótipo de sincronização; revalidar A01 na 2.3.
- Fase 1: nenhuma issue nova; a issue agrupada da 2.1 segue pendente.

### Pendências para a próxima conversa (2.3)
- Atualizar `atributos-qualidade.md` com a medida de criptografia em A05 (nova versão).
- Definir o mecanismo de criptografia (dispositivo, servidor, backups) e medir o efeito em A04 e no prazo.
- Revisão final da dupla sobre o `estilo-arquitetural.md` e commit em `/docs/fase2/`.
- Verificar limites da camada gratuita (A11, A01, cold start) e revalidar as medidas (H).
- Comparar stack móvel e opções de backend e banco, com pesos formais de prazo, custo zero e curva de aprendizado.
- Avaliar pipeline de importação do catálogo e notificações assíncronas.
- Corrigir as datas [CONFIRMAR] no histórico do briefing-mestre e commitar a versão corrigida.


## [06/10/2026] — Conversa 2.3 (Propostas arquiteturais)

- **Papel da IA:** arquiteto de software, com análise de trade-offs.
- **Técnicas aplicadas:** levantamento de opções por camada; verificação dos limites gratuitos e de preços em fontes públicas; três propostas concretas de MVP; critérios e pesos derivados da 2.1 (prazo, custo zero, curva de aprendizado e demonstrabilidade local); matriz com análise de sensibilidade; separação entre ambiente de demonstração e arquitetura-alvo; desenho de agente de IA com aprovação humana; conferência da US10 contra RN15, UC09 e modelo conceitual; conferência do estado atual dos artefatos da Fase 1; estimativa de custo da API de IA com conversão cambial; preparação do artefato da issue de retroalimentação.
- **Prompts-chave usados:**
  1. Abertura da 2.3 com o briefing de passagem como guia prioritário, o briefing-mestre (seções 3, 5, 7 e 8) e o diário, com instrução de parar se faltasse algum anexo.
  2. Correção da dupla: considerar ferramentas de estudante (GitHub Student Developer Pack).
  3. Correção da dupla: a entrega é uma demonstração local (Docker, simulador); a arquitetura de lançamento é só proposta.
  4. Informação da dupla: não há Mac; o Student Developer Pack ainda não está verificado; o professor exige IA via API no desenvolvimento e no uso da aplicação.
  5. Decisão da dupla: abordagem A pura (IA na importação do catálogo, também propondo substituições da US10).
  6. Confirmações da dupla: P1 e divisão demonstração × alvo; uso da IA pelo curador conta como "uso na aplicação"; RNF05 corrigido na Fase 1 (conferido nos arquivos).
  7. Escolha do provedor (Kimi K3) e informação de preço; correção da moeda (yuan, e não iene) e do custo.
  8. Pergunta da dupla sobre a IA ser a única forma de curadoria; decisão de mantê-la como assistente opcional, com fluxo manual.
  9. Decisões sobre a RN22, `alergenos` em `Ingrediente` e fontes de receitas (custo alto ou outro idioma; importação assistida ou manual).
- **Insumos usados:** `briefing-passagem-2.3.md`, `briefing-fase2.md`, `diario-de-bordo-fase2.md` (com as entradas 2.1 e 2.2), `atributos-qualidade.md` v1.1, `estilo-arquitetural.md` v1.0, `backlog.md`, `requisitos.md`; consulta pontual a `regras-de-negocio.md`, `casos-de-uso.md` e `modelo-conceitual.md`.
- **Artefatos produzidos:** `propostas-arquiteturais.md` v1.1; `issue-retroalimentacao-fase1.md` v1.3 (artefato de apoio, texto da issue); esta entrada; briefing de passagem da 2.4.

### Decisões tomadas (confirmadas pela dupla em 06/10/2026)
1. **Proposta escolhida: P1** (React Native + TypeScript, servidor TypeScript próprio, monólito modular, Postgres). Total ponderado: P1 126, P2 114, P3 111 (máximo 155). P1 lidera nos quatro cenários de sensibilidade.
2. **Duas camadas:** demonstração local (Docker Compose com API, Postgres e agente de importação; app no emulador Android) e arquitetura-alvo documentada (Cloud Run + Neon, ou Azure com crédito de estudante; a decidir na 2.4).
3. **Plataforma da demo: Android** (sem Mac). iOS só no alvo.
4. **P2 (Supabase)** vira plano B; **P3 (Flutter)** descartada; **Render** descartado.
5. **Pesos:** crítico = 3, alto = 2, médio = 1; prazo = 3, custo zero = 3, curva = 2, demonstrabilidade local = 2.
6. **IA como assistente opcional da curadoria (abordagem A pura):** o fluxo manual do UC12 continua principal; o fluxo assistido recebe o texto da receita fornecido pelo curador, traduz para português do Brasil, extrai campos, mapeia ingredientes, propõe alérgenos e substitutos e grava como `proposto`. Só o curador aprova e só o curador marca "verificado". O fluxo misto (fonte estruturada) foi descartado.
7. **Fontes de receitas:** APIs e bancos pesquisados têm custo alto ou dados em outro idioma; a importação será assistida por IA ou manual.
8. **Provedor de IA: Kimi K3** (Moonshot AI), por API compatível com o protocolo da OpenAI, atrás de uma interface de provedor. Formalização em ADR na 2.4.
9. **Preço do Kimi K3:** ¥20 por milhão de tokens de entrada e ¥100 por milhão de saída, em **yuan** (US$ 3 e US$ 15 na documentação em dólares). A conversão inicial, feita como iene, estava errada em cerca de 24 vezes. Com 1 CNY ≈ R$ 0,75 (cotação de 05/10/2026, aproximada): entrada ≈ R$ 15 e saída ≈ R$ 75 por milhão. Estimativa de teto (4.000 tokens de entrada e 10.000 de saída por receita): 20 pratos ≈ R$ 16; 100 pratos ≈ R$ 81; 350 pratos ≈ R$ 284. Custo único por carga; **não é custo zero**; exige limite de gasto no console e medição com 3 a 5 receitas.
10. **RN22:** o substituto sugerido não pode conter alérgeno da restrição do usuário; substituto sem alérgenos declarados fica "não verificado" e não é sugerido a quem tem restrição (extensão proposta, coerente com a RN08).
11. **`alergenos` fica em `Ingrediente`** (e não na relação de substituição).
12. **Criptografia (mecanismo proposto):** SQLCipher no dispositivo (inclui a fila), chave de 256 bits no Keystore; AES-256-GCM de aplicação nos campos de restrição no servidor; TLS no alvo, com limitação declarada na demo local.
13. **Notificações locais;** autenticação por conta anônima com e-mail e senha opcionais.
14. **Confirmado pela dupla:** o uso da IA pelo curador atende a exigência de "uso na aplicação".
15. **Student Developer Pack:** será submetido; aprovação considerada praticamente certa, mas **ainda não verificada**; o ADR de custos não deve depender dele.

### Artefatos alterados (retroalimentação)
- Nenhum artefato anterior foi alterado por esta conversa.
- **Já resolvido pela dupla (conferido em 06/10/2026):** RNF05 reescrito; RNF06 com criptografia; estado de alérgenos em RF18, RN08, RN10, RN16, US09 e modelo conceitual; status das RNs "validado".
- **Fase 1 (issue agrupada; texto em `issue-retroalimentacao-fase1.md` v1.3):** (a) correções de texto (RN15, US09, RN16, tabela do modelo conceitual); (b) novo RNF11 (apoio opcional de IA, com tradução e aprovação), ajuste do RF18, RNF06 e RNF08; (c) `alergenos` em `Ingrediente`, RN15 ajustada, RN21 e RN22 novas; (d) UC09, UC12, US10 e US18; (e) conferência de `documento-de-requisitos.md`, `casos-de-uso.md`, `casos-de-teste.md`, `matriz-rastreabilidade.md` e `lexico.md`.
- `atributos-qualidade.md`: proposta de v1.2 (exclusão offline conta 24 h a partir do recebimento pelo servidor; TLS da demo local; cenário de qualidade da saída da IA).
- `estilo-arquitetural.md`: sem mudança.

### Iterações relevantes (erros e retrabalho da IA)
1. A primeira versão avaliou o P1 pensando em implantação real (cold start, cota, cartão, taxas), sem perguntar se haveria implantação, e ignorou ferramentas de estudante; a dupla corrigiu e a v1.0 separou demonstração e alvo.
2. O requisito de IA via API deveria ter sido capturado na Fase 1 ou na 2.0; só foi identificado na 2.3. O custo foi baixo porque a importação já era um ponto aberto (A09).
3. A leitura direta dos arquivos do projeto não retornou conteúdo; a busca nos arquivos do projeto resolveu.
4. A IA propôs inicialmente IA sob demanda no app para a US10, mas a RN15 proíbe "inventar uma troca"; a consulta ao texto da regra levou à abordagem A pura.
5. Na conferência da Fase 1, a IA constatou que o RNF05 já estava corrigido, enquanto uma versão anterior desta entrada o tratava como pendente; o registro foi corrigido.
6. A IA redigiu o RNF11 e o plano de custo como se toda importação passasse pela IA; a dupla perguntou se era a única forma de curadoria, e a redação passou a tratar a IA como assistente opcional.
7. A IA levantou a hipótese de fonte de receitas com dados estruturados (fluxo misto); a dupla informou que as fontes têm custo alto ou outro idioma, e a hipótese foi descartada.
8. A conversão do preço do Kimi K3 foi feita pela dupla como iene (32 por real); a IA identificou que o símbolo na página é o yuan e corrigiu, com cotação pública de 05/10/2026.
9. Algumas notas da matriz (P2 em demonstrabilidade, por exemplo) são julgamento, não medição; os limites do Supabase e do Student Developer Pack vêm de fontes secundárias.
10. A primeira entrega saiu sem as perguntas de fechamento do roteiro (incrementos 1 e 5), como já ocorrera na 2.2; as perguntas foram feitas nas mensagens seguintes.

### Divergências registradas (briefing/professor × artefatos)
- O briefing-mestre (seção 2) descreve o offline como "candidatas e preparadas"; vale o artefato aprovado.
- `requisitos.md` (RNF05): divergência encerrada; o texto corrigido pela dupla está de acordo com o artefato da 2.1.
- **Material do professor × briefing:** a exigência de IA via API (desenvolvimento e uso) não consta do briefing-mestre; foi acrescentada como restrição no briefing da 2.4 e na issue de retroalimentação. Proposta de nova versão do briefing-mestre (v1.2).
- O diário do projeto se chama `diario_de_bordo-fase2.md`; os briefings citam `diario-de-bordo-fase2.md`.

### Riscos aceitos
- R6: no alvo, conta de faturamento com cartão (Cloud Run); alternativa Azure com crédito de estudante.
- R7: diferença P1 × P2 baseada em notas de julgamento; plano B e gatilho de 10 dias.
- R8: o agente de IA pode errar tradução, alérgenos ou substitutos; mitigado por estado "não verificado" por padrão, aprovação humana, validação por esquema e RN22.
- R9: custo (R$ 16 a R$ 284 por carga, hipótese), disponibilidade e mudança de oferta do Kimi K3; mitigado por interface de provedor, fluxo manual como alternativa real, execução gravada, seed pequeno e limite de gasto.
- R10: direitos autorais e termos de uso das fontes ao traduzir e publicar receitas; mitigado por atribuição, conferência dos termos de cada fonte e preferência por fontes com licença aberta (a verificar).
- R4 e R5 (2.2) seguem; R5 vale só para o alvo e não será medido na demo.
- A criptografia da restrição alimentar não é risco aceito; é requisito.

### Pendências para a próxima conversa (2.4)
- Verificar o GitHub Student Developer Pack após a submissão e decidir se o alvo cita Azure e outras ofertas.
- Confirmar o preço do Kimi K3 no console, definir limite de gasto e medir tokens com 3 a 5 receitas; testar a saída estruturada por JSON Schema.
- Definir o esquema de saída do agente e a interface de provedor.
- Conferir os termos de uso e as licenças das fontes de receitas.
- Abrir a issue agrupada de retroalimentação da Fase 1 (texto pronto em `issue-retroalimentacao-fase1.md`).
- Revisar `estilo-arquitetural.md` e commitar em `/docs/fase2/`.
- Conferir criptografia em repouso e backups do provedor do alvo em documentação oficial.


## [06/10/2026] — Conversa 2.4 (Registro das decisões — ADR)

- **Papel da IA:** arquiteto de software, redator técnico de ADR.
- **Técnicas aplicadas:** ADR por decisão, com alternativas reais, consequências negativas, riscos, verificações pendentes e gatilhos de revisão; verificação em documentação oficial (Neon, Cloud Run, Azure PostgreSQL, Expo, Android, Node, Kimi API, OWASP, Creative Commons); fronteira explícita entre ADRs que tocam o mesmo tema (001, 005, 008); redação e confirmação de um ADR por vez; registro do que é hipótese (H).
- **Prompts-chave usados:**
  1. Abertura da 2.4 com o briefing de passagem e instrução de parar se faltasse algum anexo.
  2. Respostas da dupla: manter `/docs/fase2/adr/`; briefing-mestre e issue como entregáveis da 2.4; placeholder `#30`; não citar ferramentas de estudante que o ADR não use.
  3. Decisão pelos 13 ADRs previstos mais um (ADR-014).
  4. Respostas às lacunas: preço do Kimi K3 conferido, teto de R$ 20, fotos de licença aberta, preenchimento manual do catálogo como principal, autor "Dupla".
  5. Perguntas da dupla sobre "esvaziar" o módulo de notificações e sobre "preferência" da interface do curador; decisões: remover o módulo e adotar só endpoints de curadoria com Bruno.
  6. Decisão da dupla de usar a observabilidade para detectar dado de alérgeno errado.
  7. Confirmações dos itens marcados [CONFIRMAR] em cada ADR.
- **Insumos usados:** `briefing-passagem-2.4.md`, `briefing-fase2.md` v1.1, `diario_de_bordo-fase2.md` (2.0 a 2.3), `propostas-arquiteturais.md` v1.1 (com a duplicação já removida), `estilo-arquitetural.md` v1.0, `atributos-qualidade.md` v1.1.
- **Artefatos produzidos:** ADR-001 a ADR-014 (criados pela dupla em `/docs/fase2/adr/`); esta entrada; briefing de passagem da 2.5; propostas de alteração de `briefing-fase2.md` (v1.2), `atributos-qualidade.md` (v1.2), `propostas-arquiteturais.md` (v1.2) e `estilo-arquitetural.md` (v1.1).

### Decisões tomadas (confirmadas pela dupla em 06/10/2026)

| ADR | Decisão | Status |
|---|---|---|
| 001 | Estilo do sistema: offline-first com sincronização, restrito ao conjunto baixado (inclui fotos) | Aceito |
| 002 | Servidor: monólito modular com Fastify; sem módulo de notificações; interface do curador só por endpoints | Aceito |
| 003 | React Native + TypeScript (Expo, *dev build*); demo no emulador Android; iOS só no alvo | Aceito |
| 004 | Demo em Compose (API + Postgres); alvo documentado: Cloud Run e Neon em São Paulo; Azure como alternativa; Supabase como plano B | Aceito com condições |
| 005 | SQLite com SQLCipher (`expo-sqlite`); chave via `expo-secure-store`; fila na mesma base; `op-sqlite` como plano B de biblioteca | Aceito com condições |
| 006 | Criptografia: SQLCipher no aparelho; AES-256-GCM de aplicação no servidor, com chave fora do banco; backup do Android desativado e com exclusões | Aceito com condições |
| 007 | Conta anônima emitida pelo servidor; e-mail e senha opcionais; JWT curto e refresh token opaco sem rotação; sem recuperação de senha por e-mail na v1 | Aceito com condições |
| 008 | Sincronização por operações idempotentes; restrição entra na fila; sincronização só em primeiro plano; um aparelho por conta | Aceito com condições |
| 009 | Notificações locais; no máximo uma por tipo e 2 por dia; sem push; sem reengajamento | Aceito com condições |
| 010 | Catálogo: fluxo manual principal e assistido opcional, mesmo esquema e portão de publicação; reescrita com palavras próprias | Aceito com condições |
| 011 | Agente de IA: Kimi K3 atrás de interface, JSON Mode com validação no servidor, teto de R$ 20 controlado na aplicação | Aceito com condições |
| 012 | Fotos: licença aberta, atribuição TASL, WebP, download junto com as planejadas | Aceito com condições |
| 013 | Custos: demo sem custo exceto IA (teto de R$ 20); nenhuma decisão depende de benefício de estudante | Aceito |
| 014 | Regra de alérgenos em pacote TypeScript compartilhado, com vetores de teste e invariantes de catálogo | Aceito |

### Artefatos alterados (retroalimentação)

- **Nenhum artefato foi alterado nesta conversa.** Alterações propostas (a aplicar pela dupla):
  - `propostas-arquiteturais.md` v1.2; `atributos-qualidade.md` v1.2; `estilo-arquitetural.md` v1.1; `briefing-fase2.md` v1.2 (detalhes na entrega).
  - **Fase 1 (issue agrupada, `#30` como placeholder):** a v1.3 do texto precisa ser anexada; acréscimos desta etapa listados na entrega.

### Iterações relevantes (erros e retrabalho da IA)

1. A primeira pergunta sobre a interface do curador usou "preferência" sem explicar do quê; a dupla questionou e a IA reformulou com opções e recomendação.
2. O ADR-002 trazia um módulo de notificações no servidor, incoerente com as notificações locais; a IA apontou o ponto antes da redação, e a dupla aprovou remover o módulo.
3. A P1 dizia "chave de 256 bits no Keystore"; a documentação indica que a chave fica protegida pelo Keystore via `expo-secure-store`. Corrigido no ADR-005 e na proposta v1.2.
4. A 2.3 afirmou que o K3 trabalha sempre em raciocínio máximo e citou JSON Schema; a documentação mostra esforço configurável e JSON Mode. Corrigido no ADR-011 e na proposta v1.2.
5. A 2.3 deixou a cota do Cloud Run em São Paulo como não confirmada; a página oficial lista a região entre as de preço Tier 1. Atualizado, ainda com confirmação no console.
6. Em duas respostas, a IA levantou lacunas que a dupla já havia tratado ou que dependiam de decisão posterior (ex.: ADR-014 como ADR novo). A dupla decidiu pelo ADR-014 e aprovou.
7. O `issue-retroalimentacao-fase1.md` v1.3, citado no briefing, não estava nos arquivos do projeto; a issue da Fase 1 ficou pendente.

### Divergências registradas (briefing/professor × artefatos)

- Pasta dos ADRs: o briefing-mestre trazia `docs/adr/` (seção 3 e diário 2.0) e `/docs/fase2/adr/` (seção 6). Adotado `/docs/fase2/adr/`.
- Nome do diário: `diario_de_bordo-fase2.md` (arquivo) × `diario-de-bordo-fase2.md` (briefings). Tratados como o mesmo arquivo.
- A seção 4 de `propostas-arquiteturais.md` v1.1 descrevia o agente como "comando"; o ADR-010 o torna módulo da API. Pela precedência, a proposta precisa da v1.2.
- A lista de módulos de `estilo-arquitetural.md` previa "notificações" no servidor; o ADR-002 e o ADR-009 a removem. Registrado para a v1.1.
- A exigência de IA via API não estava no briefing-mestre; entra na v1.2.

### Riscos aceitos

- **R11 (confirmado pela dupla):** as fontes divergem sobre o uso de dados da API da Kimi para treinamento; mitigado por enviar só texto de receita, nunca dado de usuário.
- **R12 (confirmado pela dupla):** conta anônima sem e-mail e sem recuperação de senha é irrecuperável ao perder o aparelho (ADR-007, ADR-008); mitigado por incentivo ao vínculo de e-mail e sincronização rápida.
- **R13 (reescrito na 2.5; reconfirmar pela dupla):** o roubo de um refresh token dá acesso até a próxima rotação, a revogação ou o fim da validade (ADR-007). Com rotação, o reuso de um token antigo é rejeitado e revoga a sessão, mas uma renovação cuja resposta se perde (queda de rede) pode encerrar a sessão legítima (hipótese a testar). Mitigado por validade máxima, revogação no servidor, armazenamento em `expo-secure-store` e teste de rotação do ADR-007.
- R1 a R10 seguem. A criptografia continua sendo requisito, não risco.

### Pendências para a próxima conversa (2.5)

- Aplicar as alterações propostas nos quatro artefatos e commitar `/docs/fase2/adr/` e o diário.
- Anexar o `issue-retroalimentacao-fase1.md` v1.3 e issue aberta e concluída: #30
- Definir o vocabulário de alérgenos e o critério de "verificado" (antes da 2.6).
- Medidas e testes (H), em ordem de prioridade: tokens com 3 a 5 receitas e JSON Mode (ADR-011); abertura offline em 2 s com SQLCipher (ADR-005); protótipo de sincronização em 10 dias (ADR-008); WebP e peso das fotos (ADR-012); cota do Cloud Run e limite do console da Kimi (ADR-004, ADR-011, ADR-013).
- Na 2.5, decidir em qual módulo do servidor ficam as preferências de lembrete.
- Na 2.6, detalhar o mecanismo de idempotência, o esquema de saída do agente, o OpenAPI e a coleção Bruno de curadoria.
- Na 2.7, definir como verificar as fronteiras entre módulos.
- Verificação do benefício de estudante: sem impacto nas decisões desta etapa.

## [06/10/2026 a 07/10/2026] — Conversa 2.5 (C4 níveis 1 a 3)

- **Papel da IA:** arquiteto, modelador C4.
- **Técnicas aplicadas:** modelagem C4 como código (Mermaid `C4Context`, `C4Container`, `C4Deployment` nos níveis 1 e 2; fluxogramas Mermaid na convenção C4 no nível 3); lacunas fechadas por perguntas numeradas, com recomendação e trade-off; rastreabilidade container × ADR e componente × UC/US; revisão pesada do próprio artefato (consistência entre níveis, ADRs e Fase 1); registro de divergências em lotes de correção.
- **Prompts-chave usados:**
  1. Execução do briefing da 2.5 (a IA parou ao perceber que o anexo era o briefing da 2.4 e pediu o correto).
  2. Perguntas numeradas da IA (Bruno, nível 4, Google Play, preferências de lembrete, lacuna do servidor), respondidas pela dupla.
  3. Pergunta da dupla: "precisa baixar todos os dados? o que é prioritário?" (conjunto baixado).
  4. Pedido de checkup de inconsistências nos níveis 1 e 3 e, depois, "revisão pesada" do nível 3.
  5. Pergunta sobre corrigir artefatos da Fase 2 sem issue e sobre como usar o registro de divergências (lotes).
  6. Relato da dupla de que os diagramas do nível 3 ficaram ilegíveis; pedido de nova forma de desenhá-los.
- **Insumos usados:** `briefing-passagem-2.5.md`, `briefing-fase2.md` (v1.2), `diario_de_bordo-fase2.md` (com a entrada 2.4), `propostas-arquiteturais.md` v1.2, ADR-001 a ADR-014, `estilo-arquitetural.md` v1.1, `atributos-qualidade.md` v1.2, `casos-de-uso.md`; consultas pontuais a `modelo-conceitual.md` e `regras-de-negocio.md` (Fase 1).
- **Artefatos produzidos:** `c4-contexto.md` v1.1, `c4-containers.md` v1.1, `c4-componentes.md` v1.1, `registro-divergencias-2.5.md`, `guia-correcoes-lote-1.md`, `pendencias-lotes-2-e-3.md`, `briefing-passagem-2.6.md`.

### Decisões tomadas

**Nível 1 (contexto)**
1. Elementos: Usuário, Curador, Panelada, Bruno e Provedor de IA (Kimi K3).
2. Bruno mantido como sistema externo, com a ausência de tela de curadoria explícita.
3. Google Play fora do nível 1; aparece só na implantação do alvo.
4. Acentos mantidos nos nomes ("Usuário" corresponde à classe `Usuario` da Fase 1).

**Nível 2 (containers e implantação)**
5. Cinco containers: App Móvel Panelada, Banco Local Cifrado, API Panelada, Banco do Servidor e Armazenamento de Fotos. Fotos locais do app são componente, não container.
6. Sem nível 4 de código. No lugar, dois diagramas de implantação (demo detalhada; alvo enxuto).
7. Chave da API de IA no alvo no Secret Manager, separada da chave AES. Fotos do alvo por URL estática com hash no nome (na demo, pela API).

**Nível 3 (componentes)**
8. Preferências de lembrete no módulo Perfil e Restrições (frequência e tipos são atributos de `Usuario`).
9. Três componentes transversais na API: Identidade e Sessões, Sincronização, Sugestão e Busca.
10. Componentes de apoio: Sincronizador e Registro Técnico (app); Cifra de Campos Sensíveis e Registro Técnico (API); Pacote de Alérgenos compartilhado.
11. Importação mostrada em tabela (seis partes) por legibilidade do diagrama.
12. Despensa, utensílios e preferências culinárias: cópia local de leitura, edição só online.
13. Índice leve do catálogo no aparelho (nomes, cadeias, continentes, definições de badge, totais), sem receita nem foto.
14. Conjunto baixado em três camadas (opção A): texto leve sempre; planejadas e em preparo com foto; preparadas sob demanda em instalação nova.
15. Criar item de plano exige rede (opção B); offline continuam reagendar, remover, data de compra, marcar comprado e avaliar.
16. Lista de compras (data de compra e marcações) sincroniza como operação de rotina. Definições de badge no Progresso e Avaliação, por seed.
17. **Forma dos diagramas do nível 3:** o Mermaid C4 nativo (`C4Component`) foi reprovado pela dupla por ilegibilidade (14 elementos no app e 11 na API). Trocado por fluxogramas Mermaid na convenção C4, divididos por assunto: 3 diagramas para o app e 4 para a API, com cores por tipo de componente e relações sem repetição entre diagramas. Tabelas, rastreio e decisões não mudaram (`c4-componentes.md` v1.1).

**Processo**
18. Divergência entre ADR e briefing: prevalece o ADR (refresh token rotativo, ADR-007).
19. Artefatos da Fase 2 são corrigidos sem issue, com registro no diário; Fase 1 por issue agrupada ao final da 2.6.
20. Correções em três lotes: 1 antes da 2.6; 2 higiene antes da 2.8; 3 issue da Fase 1 ao final da 2.6.

### Restrições

- Herdadas das entradas 2.0 a 2.4 (MVP em 1,5 mês; infraestrutura gratuita; 1.500 usuários no pico; 350 pratos; seed de cerca de 20; demo local; teto de R$ 20 na IA; nenhum dado de usuário vai ao provedor de IA; logs sem restrição; LGPD é requisito).
- Candidatas não ficam offline; a sugestão e a busca são online.
- Fronteiras entre módulos do servidor não são impostas pelo framework (verificação na 2.7).

### Iterações relevantes (erros e retrabalho da IA)

1. O primeiro anexo era o briefing da 2.4 com o nome de 2.5; a IA parou e pediu o correto. O segundo anexo veio com trechos da 2.4 colados no meio.
2. No rascunho do nível 1, a IA incluiu o Google Play sem necessidade técnica; a dupla questionou e foi removido.
3. O checkup do nível 1 achou: rastreio com a US04 (sem UC), rótulo "HTTP" sem a ressalva de TLS, falta do seed e do comando como entrada de catálogo, "seed" no lugar de "seed ou comando" (ADR-007) e o Android como sistema externo no nível 2.
4. O nível 2 saiu com o rastreio da API incompleto (faltavam UC04 a UC07 e UC13) e sem a US16 nos níveis 1 e 2; achado na revisão do nível 3.
5. O nível 3 v0.1 tinha erros: faltava a relação Receita e Preparo → rede; rótulo App → Catálogo incompleto; nota sobre o Gerenciador de Fotos incorreta; afirmação falsa de cobertura (UC12 no app); definições de badge sem dono; planejamento offline contradizia candidatas online; mecanismo de idempotência antecipado; "uma de cada tipo" apresentada como fato. Uma relação inválida do Banco do Servidor consigo mesmo foi removida antes da entrega.
6. A análise do conjunto baixado revelou lacunas não previstas nos ADRs: despensa e utensílios offline, e o índice leve do catálogo para desbloquear badges e evolução sem rede.
7. **Diagramas do nível 3 ilegíveis:** a IA entregou o nível 3 em Mermaid C4 nativo sem poder renderizá-lo e havia deixado o risco anotado apenas como "a verificar". Na conferência, a dupla constatou que os diagramas do app e da API ficaram ilegíveis. Correção: fluxogramas Mermaid na convenção C4, divididos por assunto (decisão 17). Lição: para mais de cerca de 10 elementos, usar fluxogramas por assunto desde o primeiro rascunho. Os diagramas dos níveis 1 e 2 seguem em Mermaid C4 nativo e não foram relatados como problema.

### Divergências registradas (briefing/professor × artefatos)

Lista completa em `registro-divergencias-2.5.md` (19 itens). Principais:

- ADR-007 (refresh token rotativo) × briefing 2.5 e R13 ("sem rotação"): prevalece o ADR; R13 reescrito, a reconfirmar.
- ADR-007 ("seed ou comando") × briefing 2.5 e ADR-010 ("só por seed"): prevalece o ADR-007.
- `atributos-qualidade.md` dizia que "em preparo" não existe no modelo; o `modelo-conceitual.md` o tem como status de `ItemDeRotina`.
- Roteiro do briefing 2.5 citava "lojas" no nível 1; a dupla retirou.
- Anexo do briefing 2.5 com trechos da 2.4; título do briefing-mestre em v1.1 com revisão v1.2; versão da issue (v1.3 × v1.4); `[CONFIRMAR]` e marcadores soltos nos ADRs; "Ver ADR-012" no lugar de ADR-013; "Fastify ou NestJS" na P1.
- Fase 1: UC12, fluxo FE2, supõe interface de usuário (item #15, Lote 3).

### Artefatos alterados (retroalimentação)

| Artefato | Mudança | Status |
|---|---|---|
| `c4-contexto.md` v1.1, `c4-containers.md` v1.1 | Criados e corrigidos na 2.5 | Feito |
| `c4-componentes.md` v1.1 | Criado na 2.5 (v1.0 em C4 nativo); v1.1 troca os diagramas por fluxogramas Mermaid na convenção C4, sem mudar tabelas nem decisões | Feito |
| `atributos-qualidade.md` | RNF05 "reescrita proposta" → "corrigido" (item #9) | Feito pela dupla |
| `atributos-qualidade.md` v1.3 | "Em preparo" existe como status de `ItemDeRotina` (item #17) | Feito pela dupla (Lote 1) |
| ADR-001, 002, 004, 008, 012 | Seção "Detalhamento (2.5)" | Feito pela dupla (Lote 1) |
| ADR-010 | Papel de curador "seed ou comando" (item #14) | Feito pela dupla (Lote 1) |
| Diário (entrada 2.4) e `propostas-arquiteturais.md` §16 | R13 reescrito (item #2) | Feito pela dupla (Lote 1); reconfirmação do R13 a registrar |
| `briefing-fase2.md` v1.3 | Correções editoriais (itens #4 e #5) | Feito pela dupla (Lote 1) |
| Issue #30 | Versão do arquivo da issue e "#30 provisório" (item #8) | Feito pela dupla (Lote 1) |
| Demais ADRs, propostas | Higiene (Lote 2) | Pendente, antes da 2.8 |
| Fase 1 (`casos-de-uso.md`, UC12 FE2 e itens do Lote 3) | Por issue agrupada | Pendente, ao final da 2.6 |

### Riscos aceitos

- R1 a R12 seguem como na entrada 2.4 (R11 e R12 confirmados). A criptografia continua sendo requisito, não risco.
- **R13 (reescrito na 2.5; reconfirmar pela dupla):** o roubo de um refresh token dá acesso até a próxima rotação, a revogação ou o fim da validade (ADR-007). Com rotação, o reuso de um token antigo é rejeitado e revoga a sessão, mas uma renovação cuja resposta se perde pode encerrar a sessão legítima (hipótese a testar).
- **R14 (proposto na 2.5, a confirmar):** criar item de plano exige rede; sem conexão o usuário não consegue incluir pratos no plano. Mitigação: reagendar, remover, marcar comprado e avaliar continuam offline; as receitas planejadas ficam baixadas.
- **R15 (proposto na 2.5, a confirmar):** em instalação nova, as receitas preparadas só voltam ao abrir com rede, o que estreita o RNF05 ao pé da letra. Mitigação: conta de um aparelho só (ADR-007, ADR-008); quem vincula e-mail recupera o histórico (R12).

### Pendências para a próxima conversa (2.6)

- **Para a 2.6:** mecanismo de idempotência; esquema de saída do agente; OpenAPI e coleção Bruno de curadoria; vocabulário de alérgenos e critério de "verificado"; "em preparo" para prato aberto sem item de rotina; regra de edição de avaliação; retenção de contas anônimas, vida dos tokens e limites da fila; definição de badges de conjunto temático.
- **Medidas (H), em ordem de prioridade:** tokens com 3 a 5 receitas e JSON Mode (ADR-011); abertura offline em 2 s com SQLCipher (ADR-005); protótipo de sincronização em 10 dias (ADR-008); WebP e peso das fotos (ADR-012); tamanho do índice leve e do conjunto do seed; cota do Cloud Run e limite do console da Kimi (ADR-004, ADR-011, ADR-013).
- **Para a 2.7:** como verificar as fronteiras entre módulos.
- **Para a 2.8:** Lote 2
- **Ao final da 2.6:** abrir a issue agrupada da Fase 1 (Lote 3).


## [07/10/2026] — Conversa 2.6 (Classes, sequências e contratos)

- **Papel da IA:** arquiteto, designer de componentes e de padrões (SOLID).
- **Técnicas aplicadas:** fechamento de pendências por perguntas numeradas, com recomendação e custo; mapeamento das 13 classes conceituais para classes de projeto, separando App, API e Pacote de Alérgenos; diagramas de classe por assunto (no máximo cerca de 12 elementos); sequências Mermaid para quatro casos de uso críticos, com os componentes do C4; contrato OpenAPI 3.1 como fonte da verdade; coleção Bruno derivada do contrato; validação por script dos esquemas e dos corpos de exemplo; conferência de SOLID por componente, com correções aplicadas; busca de fontes públicas (ANVISA, Idempotency-Key, Bruno).
- **Prompts-chave usados:**
  1. Abertura da 2.6 com o briefing de passagem, instrução de parar se faltasse anexo e confirmação das pendências (R13, R14, R15, R10, legibilidade do nível 3, commit do C4).
  2. Respostas da dupla às nove perguntas de fechamento (vocabulário, "verificado", idempotência, "em preparo", avaliação, tokens, badges, pacote de alérgenos, esquema do agente).
  3. Pergunta da dupla: "intolerância à lactose foi descontinuado mesmo?" (levou à correção da IA e ao 19º código).
  4. Correção da dupla: JWT de acesso de 45 minutos, por causa do uso no passo a passo.
  5. Decisão da dupla: "em preparo" só local, sem sincronizar.
  6. Pergunta da dupla sobre as vantagens e desvantagens de separar `Usuario` e `Conta`.
  7. Aceitação de cada incremento (classes, sequências, OpenAPI, Bruno, SOLID), com ajustes pedidos pela IA.
- **Insumos usados:** `briefing-passagem-2.6.md`, `briefing-fase2.md` v1.3, `diario_de_bordo-fase2.md` (entrada 2.5 colada na conversa), `c4-contexto.md`, `c4-containers.md`, `c4-componentes.md` (v1.1), ADR-001 a ADR-014, `regras-de-negocio.md`, `casos-de-uso.md`, `modelo-conceitual.md`; consultas pontuais a `backlog.md` e `casos-de-teste.md` (exemplos de lactose e glúten); fontes externas: texto da RDC 26/2015, Idempotency-Key (IETF e Stripe), documentação do Bruno.
- **Artefatos produzidos:** `diagrama-classes.md` v1.0; `sequencia-uc10.md`, `sequencia-uc04.md`, `sequencia-uc08.md`, `sequencia-uc12.md`; `openapi.yaml` v1.0.0-2.6; coleção Bruno `panelada-curadoria` (46 arquivos); `retroalimentacao-2.6.md` (notas de detalhamento dos ADR, texto da issue do Lote 3 e divergências); esta entrada; `briefing-passagem-2.7.md`.

### Decisões tomadas

**Alérgenos**
1. Vocabulário controlado v1 de 19 códigos: os 18 itens da lista da ANVISA (RDC 26/2015, consolidada pela RDC 727/2022) mais `lactose`, a pedido da dupla. `leite` cobre alergia; `lactose` cobre intolerância. Leite sem lactose declara só `leite`.
2. Invariante nova (ADR-014): ingrediente com `leite` e sem `lactose` só passa com `semLactose = true`, conferido pelo curador.
3. Restrição do usuário é escolha em catálogo fixo (`TipoRestricao`, por seed), cada tipo mapeado para códigos.
4. "Verificado" exige checklist do curador. A segunda fonte é recomendada, não obrigatória. Receita sem alérgenos só é `verificado` com `confirmadoSemAlergenos`; sem isso, lista vazia continua `nao_verificado` (RN08).
5. Sem restrição cadastrada, a receita classifica como `compativel`, com o estado dos alérgenos visível. "Declarado pela fonte" é `compativel` quando não há alérgeno da restrição, sempre com o aviso "compatibilidade não confirmada".
6. Pacote de Alérgenos com três funções puras (`classificarReceita`, `filtrarCandidatas`, `substitutoPermitido`) mais `verificarInvariantes` em ponto de entrada separado. A versão do pacote avisa e não bloqueia (`X-Pacote-Alergenos-Versao`, `pacoteVersaoMinima`).

**Idempotência, sessões e fila**
7. Idempotência: UUID gerado no cliente, tabela `OperacaoProcessada` com chave `(contaId, opId)`, gravada na mesma transação do efeito, validade de 90 dias. Mesma chave com conteúdo diferente: 422 (`chave-reutilizada`).
8. `Avaliacao.id` é o `opId`. O `id` do `ItemDeRotina` é o `opId` da operação que o cria; as demais operações do item têm `opId` próprio. Criar item exige rede e usa `Idempotency-Key`.
9. JWT de acesso de 45 minutos. Refresh de 30 dias, rotativo, com tolerância de 60 s (`usadoEm`, `sucessorId`, `familiaId`). Conta anônima sem sincronização por 12 meses é excluída. Fila com no máximo 500 operações e 90 dias; espera progressiva de 5 s a 1 h; limite de login de 5 tentativas por 15 min.
10. `Usuario` e `Conta` separados, com a mesma chave primária e criação em uma transação.
11. "Em preparo" só existe com item de rotina e só no aparelho; o servidor conhece `planejado` e `concluido`.
12. Avaliação só se acrescenta, sem edição nem exclusão (salvo exclusão de conta). O servidor recalcula os desbloqueios e só acrescenta. Prato aprovado nunca é apagado, só desativado. Operação com falha permanente só pode ser descartada (sem reenvio na v1). O desbloqueio local sobrevive à rejeição.
13. Badges de conjunto temático: marco tipado (`prato`, `culinaria`, `n_culinarias`, `todos_continentes`, `conjunto`), carregado por seed.

**Restrição alimentar e revogação**
14. A revogação apaga a linha da restrição (sem `revogadoEm`). O app mostra "revogação pendente de envio" enquanto a operação estiver na fila. Se um cadastro for rejeitado, a restrição continua ativa no aparelho. O prazo de 24 h conta do recebimento pelo servidor.

**Classes, sequências e importação**
15. Promoção das classes-associação `ConquistaBadge`, `ItemDeCompra` e `SubstituicaoIngrediente`. `DesbloqueioEvolucao` registra a confirmação do servidor.
16. `AplicadorDeOperacao` por tipo de operação (falha na inicialização por tipo duplicado ou sem aplicador); `ProvedorGravado` ativo só por `PROVEDOR_IA=gravado`, com `modelo = "gravado"`.
17. Casos de uso das sequências: UC10 (com UC13 e UC11), UC04 (com UC09), UC08 e UC12 (fluxo assistido).
18. Importação: `marcarVerificado` em chamada separada; o portão permite publicar com `nao_verificado` ou `declarado_fonte`; texto de entrada de até 20.000 caracteres (hipótese); falha do provedor ou saída inválida não grava proposta, mas registra os tokens.
19. Conferência de SOLID: 12 correções aplicadas nas classes (divisão de `AbrirReceita`, repositórios, interfaces de fila, `Sincronizador`, cliente de rede, Identidade, Sincronização, Catálogo e Perfil, Importação, `ProvedorDeChave`), 3 condições e o dono do ciclo da sugestão (Rotina e Planejamento). Nenhum ADR nem o C4 foi contradito.

**Contrato**
20. OpenAPI 3.1 com prefixo `/v1`, 35 operações, erros em `application/problem+json`, `Idempotency-Key` nas rotas que criam recurso, nota como inteiro de 0 a 10 (meios-pontos), teto de IA com 402 e falha do provedor com 502, ambos com `fluxoManualDisponivel`.
21. Coleção Bruno em `/docs/fase2/bruno/panelada-curadoria/` e contrato em `/docs/fase2/openapi.yaml`.

### Artefatos alterados (retroalimentação)

| Artefato | Mudança | Status |
|---|---|---|
| ADR-005, 006, 007, 008, 009, 010, 011, 012, 014 | Seção "Detalhamento (2.6)" (texto pronto em `retroalimentacao-2.6.md`) | Pendente (aplicar e commitar) |
| `atributos-qualidade.md` | Nenhuma mudança obrigatória. "Em preparo" local e prazo de 24 h já são coerentes com A04 e A05. | Sem ação |
| `c4-componentes.md` | Nenhuma mudança obrigatória. As 12 correções de SOLID ficam dentro dos componentes, em classes e interfaces. | Sem ação |
| `briefing-fase2.md` | Proposta: v1.4 com o nome correto do diário (`diario_de_bordo-fase2.md`) e a correção da referência à RDC. | Proposto |
| Fase 1 (`casos-de-uso.md`, `regras-de-negocio.md`, `backlog.md`, `casos-de-teste.md`, `modelo-conceitual.md`) | Issue agrupada do Lote 3 (texto pronto em `retroalimentacao-2.6.md`) | Pendente (abrir ao final da 2.6) |

### Iterações relevantes (erros e retrabalho da IA)

1. A IA indicou a RDC 26/2015 como referência do vocabulário sem saber que foi revogada. A conferência mostrou a revogação pela RDC 727/2022. A lista foi lida na RDC 26; a consolidação pela 727 vem de fonte secundária e ficou marcada para conferência.
2. Ao propor o vocabulário, a IA escreveu "intolerância à lactose continua fora", juntando-a ao diabetes. A dupla perguntou, e a Fase 1 mostrou que a lactose é restrição suportada (US09, CT01, CT19). Resultado: `lactose` virou o 19º código.
3. A IA propôs `id` do `ItemDeRotina` igual ao `opId`, sem notar que o item recebe várias operações. A dupla aceitou, e a IA corrigiu depois: o `id` é o `opId` da operação que cria o item.
4. A IA sugeriu "em preparo" sincronizado e JWT de 15 minutos. A dupla escolheu "em preparo" local e 45 minutos. A IA observou que o passo a passo não depende do JWT, pois roda do banco local.
5. Uma pergunta numerada (3a) foi repetida sem rótulo claro, e a dupla não soube a que ela se referia.
6. A lacuna do ADR-014 (receita sem alérgenos nunca poderia ser `verificada`) só apareceu ao montar os dados de teste da coleção Bruno. Corrigida com `confirmadoSemAlergenos`.
7. `Proposta.dados` exigia `culinariaId`, o que contradizia a proposta de IA (que devolve a culinária em texto). Corrigido ao montar a coleção.
8. A conferência de SOLID aconteceu depois das classes e achou 12 correções. Lição: aplicar SOLID já no primeiro rascunho das classes (como na lição dos diagramas da 2.5).
9. O ambiente de execução reiniciou duas vezes e apagou os arquivos gerados. O `openapi.yaml` e a coleção foram regerados na última rodada.

### Divergências registradas (briefing/professor × artefatos)

- **RDC 26/2015 × RDC 727/2022:** o briefing de passagem cita a RDC 26/2015, revogada. Segue-se a RDC 727/2022, a conferir.
- **RN08 × decisão 5 da 2.1:** a RN08 lida literalmente trata "não verificado" como incompatível para qualquer usuário; a 2.1 diz "para quem tem restrição". Seguida a 2.1. Redação da RN08 vai ao Lote 3, junto com a regra de lista vazia confirmada.
- **UC12 (FA2 e FE2) × ADR-010:** a Fase 1 supõe interface de usuário ("sistema notifica e redireciona"); o ADR-010 diz que a curadoria é só por API. Segue o ADR; Lote 3.
- **US09, CT01, CT17 e CT19 × vocabulário:** os exemplos usam "lactose" e "glúten" como alérgenos. Os códigos são `lactose` e `trigo_centeio_cevada_aveia`. Lote 3.
- **Briefing de passagem 2.6 × ADR-010 e ADR-012:** o briefing diz que os `[CONFIRMAR]` estavam resolvidos; nos arquivos continuam abertos. O R10 não foi feito.
- **Modelo conceitual × projeto:** `ItemDeRotina.status` tem "em preparo" no modelo; no projeto esse valor é local. Lote 3 (nota no modelo).

### Riscos aceitos

- R1 a R12 seguem como antes. R13 reconfirmado; R14 e R15 confirmados. R10 continua pendente de verificação.
- **R16 (proposto, a confirmar):** a revogação de restrição só chega ao servidor quando o app abre com rede, então a cópia no servidor pode existir por mais de 24 h. Mitigação: indicação de "revogação pendente de envio" e texto de consentimento claro.
- **R17 (proposto, a confirmar):** a tolerância de 60 s no refresh token (para não derrubar a sessão legítima quando a resposta se perde) amplia um pouco a janela de uso de um token roubado. Mitigação: janela curta, família revogada em reuso fora dela.

### Pendências para a próxima conversa (2.7)

- **Para fechar antes de implementar:** lint do `openapi.yaml` num validador completo; abrir a coleção no Bruno e conferir `auth: inherit`, `@file(...)` e `body:multipart-form`; conferir a lista vigente da RDC 727/2022.
- **Documentos a aplicar e commitar:** notas de detalhamento nos ADR (em `retroalimentacao-2.6.md`); `diagrama-classes.md`, as quatro sequências, `openapi.yaml` e a coleção Bruno em `/docs/fase2/`.
- **Fase 1:** abrir a issue agrupada do Lote 3 (UC12 FE2 e FA2, RN03e, RN08, exclusão de conta, exemplos de lactose e glúten, modelo conceitual).
- **R10 e ADR-010 e ADR-012:** verificar licenças e termos de uso das fontes; resolver os `[CONFIRMAR]` restantes.
- **Lote 2 (antes da 2.8):** itens #1, #6, #7, #11, #12 e #13.
- **Para a 2.7:** padrões de projeto justificados (candidatos: registro de aplicadores, portas e adaptadores, repositório, unidade de trabalho, lista de regras do portão, mecanismo de verificação das fronteiras entre módulos).
- **Medidas (H), em ordem de prioridade:** tokens com 3 a 5 receitas e JSON Mode (ADR-011); abertura offline em 2 s com SQLCipher (ADR-005); protótipo de sincronização em 10 dias (ADR-008); WebP e peso das fotos (ADR-012); tamanho do índice leve; cota do Cloud Run e limite do console da Kimi.
- **Em aberto:** valores de `frequencia` dos lembretes; política de limpeza do armazenamento local de fotos preparadas; existência de US ou RNF de exclusão de conta.
