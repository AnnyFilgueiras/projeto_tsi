# Briefing da Fase 2 — Projeto Arquitetural (Panelada) — v1.3"

> Documento-mestre da Fase 2. Deve ser anexado em TODA conversa de sub-etapa
> (2.1 a 2.9), junto com o `diario-de-bordo-fase2.md`. Ele dá o mapa da fase
> inteira; o estado atual vem do briefing de passagem e dos artefatos.

## 1. Propósito da fase e produto final
- **Objetivo:** transformar as histórias de usuário (US01–US18) e as
  restrições de negócio em decisões técnicas de arquitetura de um app móvel
  de culinária gamificada (Panelada), com justificativa por trade-offs.
  **Não existe arquitetura perfeita:** toda escolha troca um atributo por outro.
- **Disciplina:** Tópicos em Sistemas de Informação — IA generativa aplicada
  ao ciclo de vida de software. Trabalho em dupla, uma conversa por sub-etapa.
- **Produto exigido pelo professor ao final:** conjunto curto de slides
  (processo, escolhas técnicas, diagramas). Os slides só são trabalhados
  depois da 2.9.
- **Idioma:** português (Brasil), em conversas e artefatos.

## 2. Contexto e restrições
### Herdadas da Fase 1 (baseline: tag `backlog-validado-v1.0`)
- Ranking = Won't; pontuação = Could (RN19 futura; revisar valores só se
  priorizada, D13b).
- Catálogo curado e importado de fontes públicas; usuário não submete receita na v1.
- "Candidata" é o termo canônico; o estado "planejado" é de `ItemDeRotina`.
- Avaliação liga-se a Prato (D11a); nota de 0 a 5 em passos de 0,5 (D13a).
- RNF07: no máximo 2 notificações por dia.
- Gamificação: coleção (Must), evolução e badges (Should).
- Filtros: utensílios do perfil e checagem estrita de alérgenos/restrições.

### Informadas pela dupla para a Fase 2
- **Prazo:** MVP em 1,5 mês.
- **Custo:** infraestrutura gratuita; pagamento único baixo é aceitável.
- **Escala:** milhares de usuários (micro a pequeno porte).
- **Stack:** experiência com React e TypeScript; Flutter não descartado
  (a comparação acontece na 2.3). Hipóteses iniciais não são decisões.
- **Offline parcial:** receitas planejadas, em preparo e preparadas; candidatas não ficam offline (RNF05 aprovada, A04).
- **IA (exigência do professor):** uso de IA no desenvolvimento e no uso da aplicação, via API. O uso da IA pelo curador na importação conta como "uso na aplicação" (confirmado pela dupla em 06/10/2026).
- A definição de "prato concluído" (gatilho de coleção, evolução, badges e
  base da lista offline) deve ser conferida na 2.1.

## 3. Mapa das sub-etapas
| Etapa | Objetivo | Artefato principal | Alimenta | Pode reabrir |
|---|---|---|---|---|
| 2.1 | Atributos de qualidade como cenários mensuráveis e priorizados | `atributos-qualidade.md` | 2.2, 2.3, 2.8 | Artefatos da Fase 1 (via issue) |
| 2.2 | Estilo arquitetural com trade-offs | `estilo-arquitetural.md` | 2.3, 2.4 | 2.1 |
| 2.3 | Pelo menos 2 propostas de MVP, matriz com critérios e escolha | `propostas-arquiteturais.md` | 2.4, 2.5 | 2.1, 2.2 |
| 2.4 | Registro das decisões (ADR) | `/docs/fase2/adr/adr-NNN-*.md` | 2.5 a 2.9 | 2.2, 2.3 |
| 2.5 | C4 níveis 1 a 3 (nível 4 só onde fizer sentido) | `c4-contexto.md`, `c4-containers.md`, `c4-componentes.md` | 2.6 | ADRs |
| 2.6 | Classes, sequências e contratos | `diagrama-classes.md`, `sequencia-*.md`, `openapi.yaml`, coleção Bruno | 2.7 | C4, ADRs |
| 2.7 | Padrões de projeto justificados | `padroes-de-projeto.md` | 2.8 | 2.6 |
| 2.8 | Revisão pesada ("advogado do diabo") | `revisao-arquitetural.md` | 2.9 | Qualquer artefato da Fase 2 |
| 2.9 | Checklist final e resumo para a Fase 3 | `checklist-final.md`, `resumo-fase2-para-fase3.md` | Fase 3 e slides | Nenhum, só registra |

## 4. Peso dos artefatos por etapa
Legenda: **N** = núcleo (ler a fundo) · A = apoio · C = contexto · — = não usar.

| Artefato | 2.1 | 2.2 | 2.3 | 2.4 | 2.5 | 2.6 | 2.7 | 2.8 | 2.9 |
|---|---|---|---|---|---|---|---|---|---|
| `requisitos.md` (RF/RNF) | N | — | C | — | — | — | — | — | — |
| `backlog.md` (US, MoSCoW) | N | — | A | — | — | — | — | — | — |
| `regras-de-negocio.md` | N | — | — | — | — | N | A | A | — |
| `casos-de-uso.md` | — | — | — | — | A | N | — | — | — |
| `modelo-conceitual.md` | — | — | — | — | — | N | A | — | — |
| `resumo-1.4-fechamento.md` | A | — | — | — | — | — | — | — | — |
| `matriz-rastreabilidade.md` | — | — | — | — | — | — | — | A | C |
| `atributos-qualidade.md` | — | N | N | A | A | A | A | N | A |
| `estilo-arquitetural.md` | — | — | N | N | A | — | — | A | — |
| `propostas-arquiteturais.md` | — | — | — | N | N | A | — | A | — |
| ADRs | — | — | — | — | N | N | A | N | N |
| C4 | — | — | — | — | — | N | A | A | A |
| Classes e sequências | — | — | — | — | — | — | N | A | A |
| `revisao-arquitetural.md` | — | — | — | — | — | — | — | — | N |

Toda etapa também recebe: `briefing-fase2.md`, `diario-de-bordo-fase2.md`,
o briefing de passagem e o resumo de decisões da etapa anterior.
Anexe só o que a coluna da etapa marca como N ou A.

## 5. Papéis da IA
| Etapa | Papel |
|---|---|
| 2.1 | Arquiteto de software sênior (analista de qualidade) |
| 2.2 e 2.3 | Arquiteto de software, com análise de trade-offs |
| 2.4 | Arquiteto, redator técnico de ADR |
| 2.5 | Arquiteto, modelador C4 |
| 2.6 e 2.7 | Arquiteto, designer de componentes e de padrões (SOLID) |
| 2.8 | Revisor cético / avaliador externo simulado |
| 2.9 | Revisor e consolidador |

## 6. Convenções
- **Repositório:** `/docs/fase2/` para artefatos; `/docs/fase2/adr/` para ADRs.
- **Diagramas como código** (Mermaid; PlantUML se o C4 exigir); Draw.io só
  para acabamento de slide. Imagens exportadas em `/assets`.
- **ADR:** Markdown, um arquivo por decisão, numerado. Campos: status, data,
  autores, contexto, decisão, alternativas, consequências, quando revisitar.
  ADR antigo nunca é apagado; é marcado "Substituído por ADR-00X".
- **Contrato de API:** OpenAPI (YAML) como fonte da verdade; Bruno como
  cliente, com a coleção versionada no repositório.
- **Rastreabilidade:** todo atributo cita US/RN/RNF; toda decisão cita
  atributo; todo componente cita US/UC.
- **Ferramentas:** apenas gratuitas, ou de pagamento único baixo, quando
  justificado em ADR.
- **Diário:** toda conversa termina com entrada no `diario-de-bordo-fase2.md`
  (campos da Fase 1 mais "Artefatos alterados (retroalimentação)" e
  "Riscos aceitos").

## 7. Definition of Done por sub-etapa
- **2.1:** cada atributo é um cenário mensurável, rastreado a US/RN/RNF e
  priorizado com justificativa; conflitos entre atributos listados; "prato
  concluído" conferido; sem palavras-armadilha ("rápido", "seguro", "fácil").
- **2.2:** pelo menos 3 estilos comparados contra os atributos prioritários;
  estilo escolhido com o que se perde com ele e quando revisitar.
- **2.3:** pelo menos 2 propostas concretas; critérios com pesos derivados da
  2.1 (incluindo prazo, custo zero, curva de aprendizado); proposta escolhida
  e descartadas justificadas.
- **2.4:** um ADR por decisão relevante (estilo, stack mobile, backend/banco,
  autenticação, estratégia offline, notificações, catálogo, fotos), com
  alternativas reais e consequências negativas honestas.
- **2.5:** níveis 1 a 3 coerentes entre si (mesmos nomes); atores e sistemas
  externos presentes; cada container ligado a pelo menos um ADR.
- **2.6:** classes de projeto rastreadas ao modelo conceitual; sequências para
  3 a 4 casos de uso críticos; OpenAPI válido e coleção Bruno executável;
  conferência de SOLID por componente.
- **2.7:** cada padrão tem problema que resolve, classes envolvidas e
  alternativa mais simples considerada; padrões sem motivo foram removidos.
- **2.8:** perguntas difíceis respondidas ou registradas como risco aceito
  (escala, indisponibilidade da fonte do catálogo, offline, alérgenos com
  dado incompleto, LGPD); ajustes refletidos nos artefatos.
- **2.9:** checklist (justificativa, simplicidade, coerência com SOLID,
  consistência entre diagramas, cobertura das US Must) preenchido; resumo
  para a Fase 3 pronto.

## 8. Precedência e divergência
1. Ordem de precedência: **artefatos aprovados > ADRs > briefing de
   passagem > este briefing-mestre.**
2. Em caso de divergência entre o material do professor, um briefing e os
   artefatos aprovados, siga os artefatos e registre no diário.
3. Mudança neste briefing exige motivo registrado no diário e nova versão
   (seção 9). Mudança em artefato anterior exige o campo de retroalimentação
   e, se afetar a Fase 1, uma issue.

## 9. Briefing de passagem
Cada conversa N entrega, além do artefato e da entrada do diário, o
**briefing da conversa N+1** (uma página): papel, objetivo, anexos exatos,
decisões fechadas (ADRs), restrições, artefatos reabríveis, roteiro em
incrementos, Definition of Done (cópia da seção 7) e a cláusula da seção 8.
A dupla revisa o briefing antes de usá-lo.

## 10. Histórico de revisões
| Versão | Data | Mudança | Motivo |
|---|---|---|---|
| v1.0 | 05/10/2026 | Criação | Conversa 2.0 |
| v1.1 | 05/10/2026 | Remoção do campo Divisão de tarefas | Decisão da dupla na 2.0: campo descontinuado |
| v1.2 | 06/10/2026 | Requisito de IA; offline corrigido; pasta dos ADRs | Conversa 2.4 (retroalimentação) |
| v1.3 | 06/10/2026 | Correções editoriais: título, linha da v1.2 e fragmento órfão | Conversa 2.5 (registro de divergências) |