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
