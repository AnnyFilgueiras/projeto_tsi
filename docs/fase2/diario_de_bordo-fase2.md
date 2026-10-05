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
- Nenhum artefato da Fase 1 foi alterado nesta conversa. Alterações propostas, a abrir em uma issue agrupada: RNF05 (e RNF novo ou emenda), RN08/RN10/RN16/RF18/US09 (estado de alérgenos), US09 (diabetes), US12-c1 e US13 (redação), status das RNs, conferência do modelo conceitual. Detalhes na seção 7 de `atributos-qualidade.md`.

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
