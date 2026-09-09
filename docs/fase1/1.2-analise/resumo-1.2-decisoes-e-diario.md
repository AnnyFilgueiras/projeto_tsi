# Resumo de Encerramento — Fase 1.2 (Análise)

> Decisões, pendências e entrada do diário de bordo. Anexar este arquivo na
> conversa 1.3 (Documentação), junto com o Guia Geral, o briefing 1.3 e os
> artefatos da 1.1 e 1.2.

---

## 1. Artefatos produzidos nesta conversa

| Artefato | Conteúdo |
|---|---|
| `modelo-conceitual.md` | Notação justificada (UML conceitual), Mermaid v1.1, 13 classes, conceitos derivados, divergências, matriz de rastreabilidade |
| `casos-de-uso.md` | 3 atores + UC01–UC13 (12 Must + US15 como registro opcional) + tabela US→UC |
| `regras-de-negocio.md` | RN01–RN20 (18 ativas, 1 futura, 1 excluída), cobrindo pontuação, badges, ranking e rotina |

## 2. Registro de decisões (D1–D14)

| ID | Decisão |
|---|---|
| D1 | Modelo cobre apenas Must+Should; Pontuacao/Amizade fora (RN19 futura); Ranking Won't (RN20) |
| D2 | Lembrete é evento derivado das datas; configuração (frequência, tipos) é atributo de Usuario |
| D3 | 13 classes (acima da faixa 8–12 do briefing) com justificativa: toda classe é exigida por US Must/Should |
| D4 | Evolução: cada prato tem no máximo um prato base (0..1); profundidade da cadeia livre |
| D5 | Substituição global por ingrediente (autoassociação), mantida pelo curador |
| D6 | Lista de compras sem quantidades; no máximo uma lista por plano |
| D7 | Restrições alimentares vinculadas à conta do usuário, sem membros familiares |
| D8 | Notação: diagrama de classes UML conceitual (critério de desempate do briefing) |
| D9 | Badges temáticos e compostos com marco verificável baseado em avaliações (Mini Chef, Chegando na Arábia, Rei do Mundo, Grandes Civilizações) — RN03 |
| D10 | Desbloqueio de evolução somente após avaliação salva do prato base — RN02 |
| D11a | Avaliacao liga-se a Prato (não Receita) — desvio do exemplo do briefing |
| D11b | Receita pode exigir nenhum utensílio (0..*) — recomendação da IA (1..*) rejeitada |
| D11c | Culinaria pode existir sem pratos (0..*) |
| D11d | ItemDeRotina: {planejado, em preparo, concluído}; sem "perdido", sem punição (RNF09) |
| D11e | Sessão não é classe; regra de descarte coberta pela RN11 |
| D11f | Continentes da v1: América, África, Europa, Ásia e Oceania |
| D12 | Novos atributos: Culinaria.continentes (multivalorado); RestricaoAlimentar.alergenosAssociados |
| D13a | Nota da avaliação: 0 a 5, em passos de 0,5 — RN05 (proposta da IA de inteiros 1–5 corrigida) |
| D13b | Pontuação futura provisória: fácil 10 / média 20 / difícil 30 + 50% de ineditismo — RN19 |
| D13c | Regenerar a lista preserva marcações "comprado" dos ingredientes que permanecem — RN14 |
| D14 | UC13 especificado para US15 (Should) como registro opcional |

## 3. Critérios de pronto da 1.2 (Definition of Done)

| Critério | Status |
|---|---|
| Notação escolhida com justificativa | Fechado (D8) |
| 8–12 classes conceituais | Fechado com ressalva registrada: 13 classes (D3) |
| Diagrama Mermaid versionado e renderizando sem erros | Versionado (v1.1); renderização a confirmar pela dupla no mermaid.live |
| RNs cobrindo pontuação, badges, ranking e rotina | Fechado (RN19, RN03–RN04, RN20, RN12–RN13) |
| Um UC para cada US Must | Fechado (12/12 + UC13) |
| Verificação bidirecional | Fechado — sem órfãos |
| PNG/SVG exportado (insumo do slide) | Pendente — exportação manual no mermaid.live |
| Artefatos consolidados + diário de bordo | Fechado (este arquivo + entrada abaixo) |

## 4. Pendências para a conversa 1.3

1. Renderizar o Mermaid v1.1 no mermaid.live; se houver erro de sintaxe, corrigir e registrar a iteração.
2. Exportar PNG/SVG do modelo (insumo do slide final).
3. Criar a estrutura do repositório e publicar os artefatos da 1.1 e 1.2 em `/docs/fase1/...`.
4. Criar Issues por US (labels must/should/could) e o Projects (Kanban: Backlog | Em refinamento | Validado).
5. RN19 (pontuação) permanece provisória e fora do escopo; não virar Issue Must.
6. Badges exemplares da RN03 (Mini Chef, Chegando na Arábia, Rei do Mundo, Grandes Civilizações) são catálogo inicial conceitual; o cadastro efetivo é do curador.

## 5. Entrada do diário de bordo (anexar a `/docs/diario-de-bordo.md`)

```markdown
## [08/09/2026] — Conversa 1.2 (Análise — modelo conceitual do domínio)

- **Papel da IA:** analista/modeladora de domínio, acumulando modelagem, revisão
  crítica e verificação de consistência.
- **Técnicas aplicadas:** análise de substantivos sobre léxico e histórias;
  filtragem de candidatos por escopo MoSCoW; modelagem UML conceitual em Mermaid;
  derivação de regras de negócio verificáveis; especificação de casos de uso;
  verificação bidirecional de rastreabilidade.
- **Prompts-chave usados:** prompt de abertura do briefing 1.2 (papel + roteiro
  da seção 4); rodadas de respostas da dupla às perguntas de decisão, que
  geraram o registro D1–D14; pedido de badges temáticos e desbloqueio por
  avaliação (D9, D10).
- **Artefatos produzidos:** modelo-conceitual.md (13 classes, Mermaid v1.1),
  casos-de-uso.md (UC01–UC13), regras-de-negocio.md (RN01–RN20).
- **Decisões tomadas:** D1–D14 (ver registro neste arquivo).
- **Iterações relevantes:**
  1. IA seguiu a lista-semente do briefing (Pontuacao, Amizade, Ranking), que
     divergia dos artefatos aprovados da 1.1 — divergência detectada na revisão
     crítica e resolvida a favor da 1.1 (D1), com RN19 futura e RN20 excluída.
  2. IA propôs nota inteira de 1 a 5; a dupla corrigiu para 0–5 em passos de
     0,5 (D13a).
  3. IA recomendou Receita–Utensilio 1..*; a dupla manteve 0..* (D11b).
  4. Desvio consciente do exemplo do briefing: Avaliacao liga-se a Prato, não a
     Receita (D11a).
  5. Atributos continentes e alergenosAssociados emergiram durante a escrita
     das RNs para torná-las testáveis (D12) — o requisito dirigiu o diagrama,
     não o contrário.
- **Pendências para a próxima conversa:** renderizar/exportar o Mermaid v1.1;
  montar repositório, Issues e Projects; consolidar o documento de requisitos.
```
