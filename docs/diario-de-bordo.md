# Diário de Bordo — Fase 1

> Registro do processo de geração de requisitos com IA generativa. Insumo direto do slide final (processo, papel da IA, ferramentas, acertos, erros e iterações).

## 08/09/2026 — Conversa 1.1 (Elicitação)

- **Papel da IA:** engenheiro de requisitos, acumulando três funções: entrevistador, simulador de personas/stakeholders e analista de benchmarking.
- **Técnicas aplicadas:** elevator pitch e declaração de visão; mapeamento de stakeholders; personas; entrevista simulada (3 personas + 2 desenvolvedores, roteiro de 11 perguntas); benchmarking dirigido (Tasty, Cookpad, Yummly, SideChef, Duolingo); especificação de RF/RNF com IDs estáveis; histórias de usuário com critérios Given/When/Then; priorização MoSCoW.
- **Prompts-chave usados:**
  1. Prompt de abertura da sub-etapa (papel + roteiro da seção 4 do briefing + incrementos pequenos).
  2. Reação da dupla à v0.1 do pitch: "não é simplesmente ter pontos e ranking que torna uma aplicação gamificada" — provocou a discussão conceitual de gamificação (maestria × coleção × desafio social).
  3. Pedido da dupla de personas cobrindo 4 casos reais (indecisão, acessibilidade, cozinhar na hora, planejamento).
  4. Walkthrough da dupla contando toques para derrubar o RNF04 original.
- **Artefatos produzidos:** `lexico.md`, `personas.md`, `requisitos.md`, `backlog.md` (18 RF ativos, 10 RNF, 18 US), esta entrada de diário.
- **Decisões tomadas:**
  - Nome do app: **Panelada**; plataforma mobile; catálogo curado importado de plataformas públicas (usuários não submetem receitas na v1).
  - Gamificação híbrida: coleção (Must) → evolução (primeiro Should) → badges (Should); pontos rebaixados a Could por serem mecânica "batida"; ranking descartado (Won't).
  - Social despriorizado; stakeholder "amigo do usuário" fundido ao usuário principal como interesse secundário; professor reclassificado como stakeholder do projeto, não do produto.
  - Metas renegociadas: 15–18 RF e 8–10 RNF (briefing: 10–15 e 5–8).
  - US08 (lembretes) como Must, com justificativa de computação persuasiva (desde que não irritante — RNF07).
- **Iterações relevantes (erros e retrabalho da IA):**
  1. Pitch v0.1 rejeitado por citar mecânicas específicas (pontos/badges/ranking) antes de definir a experiência de jogo.
  2. Lista inicial de stakeholders tinha 6 itens; após desafio da dupla, amigo fundido e professor reclassificado.
  3. RNF04 original mal formulado (confundia *iniciar* com *concluir* um fluxo); reescrito após walkthrough de contagem de toques da dupla.
  4. IA omitiu o sinal de "utensílios domésticos" presente na entrevista do Dev 1; capturado na revisão da dupla, gerando RF19 + US11.
  5. MoSCoW rebalanceado em 3 rodadas (15 Must → 12 Must), com troca fina: evolução preservada como diferencial, pontuação rebaixada.
- **Pendências para a próxima conversa (1.2 — Análise):**
  - Decidir notação do modelo conceitual: diagrama de classes UML conceitual ou DER (guia admite ambos).
  - Detalhar regras de negócio (RN##): cálculo de pontuação por dificuldade/ineditismo, critérios de desbloqueio de evoluções e de badges, o que define "prato concluído".
  - Derivar casos de uso (UC##) das US Must/Should, mantendo a cadeia US → UC → classe.
  - Verificar na modelagem: todo RF Must precisa aparecer em ao menos um UC; toda classe precisa nascer de uma US/UC.

## [08/09/2026] — Conversa 1.2 (Análise — modelo conceitual do domínio)

- **Papel da IA:** analista/modeladora de domínio, acumulando modelagem, revisão crítica e verificação de consistência.
- **Técnicas aplicadas:** análise de substantivos sobre léxico e histórias; filtragem de candidatos por escopo MoSCoW; modelagem UML conceitual em Mermaid; derivação de regras de negócio verificáveis; especificação de casos de uso; verificação bidirecional de rastreabilidade.
- **Prompts-chave usados:** prompt de abertura do briefing 1.2 (papel + roteiro da seção 4); rodadas de respostas da dupla às perguntas de decisão, que geraram o registro D1–D14; pedido de badges temáticos e desbloqueio por avaliação (D9, D10).
- **Artefatos produzidos:** modelo-conceitual.md (13 classes, Mermaid v1.1), casos-de-uso.md (UC01–UC13), regras-de-negocio.md (RN01–RN20).
- **Decisões tomadas:** D1–D14 (ver registro no resumo de encerramento da 1.2).
- **Iterações relevantes:**
  1. IA seguiu a lista-semente do briefing (Pontuacao, Amizade, Ranking), que divergia dos artefatos aprovados da 1.1 — divergência detectada na revisão crítica e resolvida a favor da 1.1 (D1), com RN19 futura e RN20 excluída.
  2. IA propôs nota inteira de 1 a 5; a dupla corrigiu para 0–5 em passos de 0,5 (D13a).
  3. IA recomendou Receita–Utensilio 1..*; a dupla manteve 0..* (D11b).
  4. Desvio consciente do exemplo do briefing: Avaliacao liga-se a Prato, não a Receita (D11a).
  5. Atributos continentes e alergenosAssociados emergiram durante a escrita das RNs para torná-las testáveis (D12) — o requisito dirigiu o diagrama, não o contrário.
- **Pendências para a próxima conversa:** renderizar/exportar o Mermaid v1.1; montar repositório, Issues e Projects; consolidar o documento de requisitos.

---

## [09/09/2026] — Conversa 1.3 (Documentação)

- **Papel da IA:** redatora técnica, acumulando arquitetura da informação (estrutura do repositório e do documento consolidado), geração de conteúdo (README, issues, documento consolidado) e instrução de execução (passo a passo git/GitHub).
- **Técnicas aplicadas:** arquitetura da informação com links relativos; consolidação documental sem re-elicitação (migração fiel); geração em lote de issues no formato padrão do briefing; automação com GitHub CLI (`gh`); verificação de navegabilidade em aba anônima.
- **Prompts-chave usados:** prompt de abertura do briefing 1.3 (papel + roteiro da seção 4); validação do uso do GitHub Projects (coluna "A fazer" × Kanban do briefing); [PREENCHER: 1–2 prompts da dupla durante a execução].
- **Artefatos produzidos:** repositório estruturado em `/docs/fase1/...`; `documento-de-requisitos.md` consolidado (9 seções); `README.md` como índice navegável; 6 labels + milestone "Fase 1 — Engenharia de Requisitos" + 18 issues (US01–US18); quadro Projects com as colunas `Backlog | Em refinamento | Validado`.
- **Decisões tomadas:**
  1. [PREENCHER: estratégia de branch escolhida — consolidar na `main` ou manter `project-design` com PR].
  2. PNG/SVG dos diagramas ficam em `/assets` (briefing 1.3), revisando o registrado em `modelo-conceitual.md` ("fora do repositório-fonte") — divergência sinalizada conforme a convenção 7 do Guia Geral.
  3. Campo Status do Projects renomeado para `Backlog | Em refinamento | Validado` (o template padrão usava "A fazer"); todas as issues em `Backlog` até a 1.4.
  4. Issues criadas no repositório (não como drafts soltos no Projects), para carregar labels e milestone — drafts já criados foram [PREENCHER: convertidos em issues / substituídos].
- **Iterações relevantes:**
  1. A IA gerou o script de automação com um comando inexistente (`gh milestone create`); a dupla detectou o erro na execução e a correção foi feita com `gh api` +   aplicação de metadados via `gh issue edit` (v2 do script).
  2. Acesso anônimo aos links do GitHub falhou para a IA no início da conversa — reforçou a obrigatoriedade do teste em aba anônima pela dupla (que passou).
- **Divisão de tarefas:** [PREENCHER: quem executou estrutura/docs (git) e quem executou issues/Projects (web ou gh)].
- **Pendências para a próxima conversa (1.4 — Validação):** checklist de qualidade dos requisitos; matriz de rastreabilidade formal; ata de revisão; backlog validado v1.0; mover issues no quadro (Backlog → Em refinamento → Validado) conforme a revisão. Nenhuma re-elicitação foi feita durante a migração; eventuais lacunas percebidas devem ser registradas aqui e tratadas na 1.4: [PREENCHER ou escrever "nenhuma"].
