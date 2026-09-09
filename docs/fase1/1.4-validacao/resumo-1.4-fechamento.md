# Resumo de Encerramento — Fase 1.4 (Validação) + Fechamento da Fase 1

> Decisões, pendências, instruções de repositório, entrada do diário de bordo e lista de evidências para o slide. Anexar este arquivo na conversa do slide, junto com os artefatos da 1.4.

## 1. Artefatos produzidos nesta conversa

| Artefato | Conteúdo | Destino no repositório |
|---|---|---|
| `checklist.md` | Inspeção de 46 itens (8 critérios + caça às palavras-armadilha); 3 críticas, 11 menores, 4 observações, todas com correção antes→depois | `/docs/fase1/1.4-validacao/checklist.md` |
| `casos-de-teste.md` | 27 CTs (1 por critério das 12 US Must), 27/27 passando | `/docs/fase1/1.4-validacao/casos-de-teste.md` |
| `matriz-rastreabilidade.md` | RF → US → UC → classes → RN sem órfãos; cobertura de RNF; revisão das RN de gamificação/rotina | `/docs/fase1/1.4-validacao/matriz-rastreabilidade.md` |
| `ata-revisao.md` | Falhas por severidade, correções, walkthrough simulado, decisão final | `/docs/fase1/1.4-validacao/ata-revisao.md` |

## 2. Instruções para o GitHub (ordem sugerida)

1. **Aplicar as 14 correções de texto** (antes→depois prontos em `checklist.md`):
   - `requisitos.md`: RF02, RNF02, RNF07
   - `backlog.md`: US01-c1, US01-c2, US02-c2, US06-c1, US08-c2, US09-c1, US12-c3, US18-c1, US18-c2, US11-c1, US16-c1
   - `documento-de-requisitos.md`: mesmas alterações das US/RF/RNF acima (ele espelha os modulares)
2. **Editar o corpo das issues** correspondentes às US corrigidas (US01, US02, US06, US08, US09, US12, US18, US11, US16) com os critérios corrigidos.
3. **Commitar os 4 artefatos da 1.4** em `/docs/fase1/1.4-validacao/`.
4. **Atualizar o README:** status da 1.3 de 🚧 para ✅; status da 1.4 para ✅; trocar "Em produção" da seção 1.4 pelos links dos 4 artefatos; adicionar a nota `backlog validado v1.0`.
5. **Issues no Projects:** mover as 18 para a coluna `Validado`; aplicar a label `validacao`; adicionar na US13 um comentário registrando a pendência da RN19 (revisar valores ao priorizar — D13b).
6. **Fechar a milestone** `Fase 1 — Engenharia de Requisitos`.
7. **Criar a tag/release** `backlog-validado-v1.0` (marca o estado exigido pelo briefing 1.4).
8. **Anexar a entrada 1.4** (seção 4 abaixo) ao `/docs/diario-de-bordo.md`.
9. **Merge** da branch `project-design` na `main`.

## 3. Definition of Done da 1.4 — status final

| Critério | Status |
|---|---|
| 100% dos RF/RNF/US inspecionados | ✅ 46/46 (Must em profundidade; Should/Could em varredura) |
| Zero falhas críticas abertas em itens Must | ✅ 3 encontradas, 3 corrigidas com texto aprovado (efetivação no commit do passo 1) |
| Toda US Must com caso de teste derivado e passando | ✅ 27/27 CTs |
| Matriz de rastreabilidade sem órfãos | ✅ verificação bidirecional limpa |
| RN de pontuação, badges, ranking e rotina verificáveis | ✅ (pontuação = RN19 futura documentada; ranking = Won't documentado) |
| Issues em `Validado`; pendências comentadas | ⬜ instruções prontas (passo 5) — ação da dupla |
| Ata commitada; milestone fechada; repo v1.0 | ⬜ instruções prontas (passos 3, 6, 7) — ação da dupla |
| Diário de bordo com 4 entradas | ✅ 1.1, 1.2 e 1.3 confirmadas pela dupla; 1.4 redigida abaixo |

## 4. Entrada do diário de bordo (anexar a `/docs/diario-de-bordo.md`)

```markdown
## [09/09/2026] — Conversa 1.4 (Validação de requisitos)

- **Papel da IA:** revisor/engenheiro de QA — inspetor independente ("terceiro
  revisor"), gerador de casos de teste e avaliador externo simulado.
- **Técnicas aplicadas:** inspeção item a item com checklist de 8 critérios de
  qualidade; caça às palavras-armadilha ("rápido", "adequado", "intuitivo",
  "etc." e variantes); derivação de casos de teste no formato Given/When/Then;
  matriz de rastreabilidade com verificação bidirecional; walkthrough simulado
  com perguntas de avaliador externo.
- **Prompts-chave usados:** briefing da 1.4 com papel e roteiro da seção 4;
  confirmação de pré-condições (checklist da 1.3 fechado, repositório público);
  rodadas de aprovação da dupla para cada correção proposta; pergunta da dupla
  sobre terminologia ("candidata" × "escolhida").
- **Artefatos produzidos:** checklist.md (46 itens inspecionados),
  casos-de-teste.md (27 CTs), matriz-rastreabilidade.md, ata-revisao.md.
- **Decisões tomadas:** 14 correções aprovadas (3 críticas + 11 menores);
  "candidata" confirmado como termo canônico e "escolhido" rejeitado como termo
  formal (estado já coberto por ItemDeRotina "planejado"); ranking e pontuação
  tratados como N/A na validação v1 (Won't e Could documentados).
- **Iterações relevantes:**
  1. Inspeção encontrou 3 falhas críticas em US Must (US01-c1, US08-c2,
     US09-c1) — todas ambiguidades/não testabilidades invisíveis para quem
     escreveu; correções com antes/depois aprovadas pela dupla.
  2. Caça às palavras-armadilha zerou "adequado/intuitivo/etc." e converteu
     termos vagos em métricas (RNF07 ganhou limite de 2 notificações/dia).
  3. Divergência detectada: o briefing 1.4 pedia validação de ranking e
     pontuação, decididos como Won't/Could na 1.1 — briefing desatualizado,
     verificações marcadas como N/A com registro.
  4. Acesso direto ao GitHub falhou; walkthrough feito sobre o README
     adicionado ao espaço — encontrou status desatualizado da 1.3.
- **Pendências para a conversa do slide:** aplicar as correções e commitar os
  artefatos da 1.4; mover issues para `Validado`; fechar milestone e criar a
  tag `backlog-validado-v1.0`; registrar a revisão humana cruzada da dupla;
  merge da branch project-design.
```

## 5. Lista de evidências para o slide

1. **Números da validação:** 46 itens inspecionados (100%); 3 falhas críticas + 11 menores encontradas e corrigidas; 27/27 casos de teste passando; matriz sem órfãos nas duas direções.
2. **Antes/depois mais didáticos para slides:** US08-c2 ("se aproxima" → "chega"); US09-c1 ("filtrados ou sinalizados" → regra por contexto, RN08); RNF07 ("sem envio excessivo" → "máx. 2/dia"). Mostram a IA caçando o que o autor não vê.
3. **Tabela da caça às palavras-armadilha** (checklist.md, seção 2) — visualização pronta de termo × ocorrências × veredito.
4. **Matriz de rastreabilidade** como prova de completude — um print da tabela principal.
5. **Walkthrough simulado** (ata, seção 4) — as 10 perguntas de avaliador com resposta mostram o repositório "preparado para a banca".
6. **Cadeia de artefatos da Fase 1:** léxico/personas → RF/RNF → backlog MoSCoW → modelo conceitual → UC/RN → documento consolidado → issues → validação (checklist + CTs + matriz + ata) — o fio contínuo que a disciplina pede.
7. **Diário de bordo com 4 entradas** — a evidência processual: papel da IA, técnicas, prompts-chave e iterações por sub-etapa.
8. **Iterações marcantes do processo todo (além da 1.4):** D13a (IA propôs nota 1–5, dupla corrigiu para 0–5 em passos de 0,5); divergência briefing 1.2 × artefatos 1.1 resolvida a favor da 1.1 (D1); D11a (Avaliacao–Prato, não Receita).
9. **Estado final do repositório:** issues em `Validado`, milestone fechada, tag `backlog-validado-v1.0` — capturar screenshots após o passo 2.

## 6. Contexto para a próxima conversa (slide)

- Levar: este resumo + `ata-revisao.md` + `checklist.md` (tabela de palavras-armadilha) + o diário de bordo completo.
- O slide deve responder: o que a IA generativa fez em cada sub-etapa, onde ela errou/foi corrigida pela dupla (D13a é o melhor exemplo), e onde ela encontrou falhas que os humanos não viram (as 3 críticas da 1.4).
- Decisão final da fase: **aprovado com ressalvas** — ressalvas listadas na ata, seção 5, nenhuma bloqueante.
