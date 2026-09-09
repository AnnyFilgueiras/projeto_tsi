# Ata de Revisão — Validação de Requisitos (Fase 1.4)

- **Data:** 09/09/2026
- **Participantes:** Anny Filgueiras e Gabryel Souza (dupla); IA generativa (Perplexity) atuando como revisor/QA — inspetor independente, gerador de casos de teste e avaliador simulado (papel definido no briefing 1.4)
- **Artefatos inspecionados:** `requisitos.md`, `backlog.md`, `lexico.md` (1.1); `modelo-conceitual.md`, `casos-de-uso.md`, `regras-de-negocio.md` (1.2); `documento-de-requisitos.md`, `issues-lote-1.3.md`, `README.md` (1.3)
- **Escopo:** 18 RF ativos + 10 RNF + 18 US (12 Must em profundidade; 4 Should e 2 Could em varredura) + 13 UC + 20 RN + 13 classes conceituais — 100% de cobertura
- **Artefatos produzidos nesta revisão:** `checklist.md`, `casos-de-teste.md` (27 CTs), `matriz-rastreabilidade.md`, esta ata

## 1. Falhas por severidade

### Críticas (3) — todas corrigidas com texto aprovado pela dupla

| Item | Falha | Antes → Depois |
|---|---|---|
| US01-c1 | "Apenas pratos compatíveis com elas" misturava restrição (regra rígida, RN08) com preferência (sem regra) — teste indeterminado | → "nenhum prato incompatível com minhas restrições é apresentado (RN08) e os pratos exibidos respeitam minhas preferências culinárias declaradas (RN10)" |
| US08-c2 | "Quando ela se aproxima" indefinido e inconsistente com RN13/léxico | → "quando ela chega" (simétrico ao critério 1) |
| US09-c1 | "Filtrados ou claramente sinalizados" — dois resultados sem regra de decisão | → "não aparecem nas sugestões; na busca e na visualização, são claramente sinalizados (RN08)" |

### Menores (11) — correções definidas e aprovadas

| Item | Falha | Correção |
|---|---|---|
| RF02 | "rapidamente" sem métrica | "com um único toque (alinhado à US02 e ao RNF04)" |
| RNF02 | "cadastro extenso" indefinido | "no máximo 3 campos obrigatórios antes do primeiro uso" |
| RNF07 | "sem envio excessivo" sem limiar | "limite padrão de 1 notificação por evento e no máximo 2 por dia; configurável" |
| US01-c2 | "novidade" fora do léxico | "não é apresentado novamente nas sugestões (RN10)" |
| US02-c2 | "escolhida" ≠ termo canônico | "candidata" (léxico, RN11) |
| US06-c1 | "escolhidos" ≠ termo canônico | "pratos candidatos" |
| US12-c3 | verbo ausente ("quando o registro novamente") | "quando o registro é feito novamente" |
| US18-c1 | omite "passo a passo" (exigido por RF10/UC12) | incluído na lista de atributos |
| US18-c2 | "receita faz parte de uma cadeia" — cadeias são de pratos | "um prato faz parte de uma cadeia como evolução ... indico exatamente um prato base (RN18)" |
| US11-c1 | "sinalizados ou são filtrados" (mesmo padrão do "ou") | "vêm sinalizados (RN10)" |
| US16-c1 | "10 países" × RN03 "10 culinárias" | "10 culinárias distintas" |

### Observações (5) — sem bloqueio

1. `Badge.marco`: explicitar que o atributo carrega os parâmetros verificáveis do critério (N, conjunto de culinárias, prato) — a forma (e) da RN03 não tem associação Badge–Culinaria no modelo (melhoria sugerida, não bloqueia)
2. US05 usa "foto"; RF10 e modelo usam "imagem" — sinonímia sem impacto de teste
3. US09-c2 "alérgeno comum" × RN16 "qualquer alérgeno declarado" — alinhar em revisão futura
4. Remoção de item do plano (RN12) e regeneração da lista (RN14) sem critério explícito em US06/US07 — avaliar pós-v1
5. README marca a 1.3 como "em andamento" — atualizar para concluída no commit das correções

### Decisão terminológica registrada

"Candidata" confirmado como termo canônico para sugestão aprovada. A dupla propôs reservar "escolhido" para o prato a preparar; o revisor recomendou **não** criar o termo, pois o estado já existe como ItemDeRotina "planejado" (RN12) — dois nomes para um estado é a ambiguidade que esta inspeção caça. Cadeia canônica: apresentada → candidata → planejado → em preparo → concluído. "Escolhidos" pode existir apenas como copy de interface, fora dos artefatos formais. **Dupla de acordo.**

## 2. Casos de teste derivados

27 CTs (CT01–CT27), um por critério de aceite das 12 US Must, redigidos sobre o texto corrigido: **27/27 passam** no teste de especificação. Nenhum critério ficou sem gerar teste após as correções — evidência de que as 3 críticas eram bloqueadores reais de testabilidade. CTs negativos cobrem os fluxos de exceção (CT16, CT20, CT21, CT26). Detalhes em `casos-de-teste.md`.

## 3. Matriz de rastreabilidade

Cadeia RF → US → UC → classes → RN **sem órfãos em nenhuma direção**: 18/18 RF com US; 12/12 US Must com UC; 13/13 UC com US de origem; 13/13 classes em ao menos um UC; 18/18 RN ativas com origem. Vazios restantes são descartes/adiamentos documentados (RF16 Won't; US13/US17 Could; US04/US11/US16 Should sem UC). Revisão dedicada: RN de badges (RN03/RN04), evolução (RN02/RN18), coleção (RN07) e rotina atrasada (RN12) todas em formato verificável; pontuação (RN19) futura e calculável, com valores provisórios pendentes de revisão (D13b); ranking N/A (Won't — briefing 1.4 estava desatualizado neste ponto). Detalhes em `matriz-rastreabilidade.md`.

## 4. Walkthrough simulado (avaliador externo)

Percorrendo o repositório pelo README, as perguntas incômodas e as respostas que a documentação já sustenta:

| Pergunta do avaliador | Resposta registrada |
|---|---|
| "Por que 13 classes, se o briefing 1.2 pedia 8–12?" | Desvio justificado e registrado (D3): cada classe é exigida por ao menos uma US Must/Should; cortar mais quebraria a rastreabilidade |
| "Por que não existe a classe Lembrete?" | D2: Lembrete é evento derivado das datas de compra/preparo; a configuração é atributo de Usuario; o ator Tempo (UC07) dispara o evento — sem duplicar dados no modelo |
| "Por que Avaliacao liga-se a Prato e não a Receita?" | D11a: avaliação é registro de preparo (léxico); coleção, evolução e badges operam sobre pratos; a Receita é alcançada via Prato 1–1 |
| "A US09 fala em 'restrições da família', mas o modelo tem só Usuario — cadê a família?" | D7: na v1, as restrições da família são gerenciadas na conta única do usuário, sem perfis por membro — decisão de escopo registrada na 1.2 |
| "Como testo usabilidade? Cadê 'intuitivo'?" | O termo não existe nos artefatos: a caça às palavras-armadilha zerou "intuitivo/adequado/etc."; usabilidade tem métricas concretas (RNF02: 2 min; RNF03: 2,5 s; RNF04: 2 toques) |
| "E se a data de preparo passar sem o usuário cozinhar?" | RN12: o item permanece "planejado", pode ser reagendado ou removido, sem nenhuma penalidade (RNF09) |
| "Como o sistema verifica o badge 'Grandes Civilizações'?" | RN03 forma (e): marco verificável por avaliações; os parâmetros ficam em `Badge.marco` — observação registrada para explicitar isso (única ressalva de modelagem da revisão) |
| "Por que o ranking sumiu? Gamificação não pede ranking?" | Won't baseado em evidência: 1 dos 5 entrevistados interessado; descarte registrado em 4 artefatos (requisitos, backlog, léxico, RN20) e nos anti-requisitos |
| "RF12 (pontos) está nos requisitos mas fora do modelo — contradição?" | Não: US13 é Could; o modelo cobre Must+Should (D1); a regra existe como RN19 futura e calculável, com revisão de valores pendente (D13b) |
| "O que garante que a lista de compras não duplica itens?" | RN14 (consolidação sem duplicatas, regeneração preserva marcações) + CT12 com exemplo concreto (cebola 1×) |

## 5. Pendências remanescentes

1. **Aplicação das 14 correções** nos arquivos-fonte e nas issues (texto antes→depois pronto em `checklist.md`) — ação da dupla
2. **Revisão humana cruzada** (exigência do briefing 1.4, seção 8): quem redigiu cada artefato não pode ser seu único revisor humano — registrar na conversa do slide quem revisou o quê
3. Badge.marco: explicitar parâmetros do critério (melhoria, não bloqueia)
4. RN19: revisar valores provisórios quando US13 for priorizada (D13b)
5. Alinhar "alérgeno comum" → "declarado" na US09-c2 em revisão futura
6. Avaliar pós-v1: critérios explícitos para remoção de item (RN12) e regeneração da lista (RN14)

## 6. Decisão final

**APROVADO COM RESSALVAS.** Zero falhas críticas abertas: as 3 críticas e 11 menores têm correção redigida e aprovada pela dupla, com testabilidade comprovada pelos 27 CTs. As ressalvas são as pendências da seção 5 — nenhuma bloqueia o início da Fase 2. O estado `backlog validado v1.0` se efetiva com o commit das correções, a movimentação das issues para `Validado`, o fechamento da milestone e a tag no repositório (instruções em `resumo-1.4-fechamento.md`).
