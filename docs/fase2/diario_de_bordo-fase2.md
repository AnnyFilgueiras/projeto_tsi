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