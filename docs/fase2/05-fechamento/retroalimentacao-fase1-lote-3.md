# Lote 3 — Retroalimentação da Fase 2 para a Fase 1 (Issue #32)

> Artefato canônico de especificação da GitHub Issue #32 ([Playbook 01](../../playbooks/01-sessao-issues-e-diario.md)), consolidando os itens de retroalimentação acumulados das etapas `2.5`, `2.6` e `2.7` para os artefatos da Fase 1. *(Nota: o placeholder histórico `#31` foi consumido pelo PR da Issue `#30`, portanto a issue do Lote 3 corresponde à `#32`.)*

## 1. Contexto e Rastreabilidade
- **Fase / Etapa:** Fase 2 (Fechamento — Frente B / `F2-01`, retroalimentação para a baseline `validated-backlog--v1.0` da Fase 1)
- **Origem (Requisitos / Arquitetura):** `UC08`, `UC10`, `UC12` (FA2/FE2); `RN03e`, `RN05`, `RN08`, `RN09`, `RN16`; `RNF06`, `RNF11`; `US09`, `US12`, `US18`; `CT01`, `CT17`, `CT19`, `CT30`; `A05`, `A06`, `A09`; `ADR-005`, `ADR-007`, `ADR-008`, `ADR-010`, `ADR-011`, `ADR-014`, `ADR-015`
- **Objetivo:** Sincronizar os artefatos da Fase 1 com as decisões fechadas na Fase 2 (curadoria exclusiva via API, vocabulário controlado de 19 códigos de alérgenos baseado na ANVISA RDC 727/2022 + `lactose`, regra `confirmadoSemAlergenos`, status local `"em preparo"`, exclusão completa de conta pela LGPD e representação da nota `0..10` no contrato), mantendo `documento-de-requisitos.md` e `matriz-rastreabilidade.md` íntegros.

## 2. Escopo e Camada
- **Camada afetada:** [x] `docs/`  [ ] `packages/allergen-rules`  [ ] `apps/api`  [ ] `apps/mobile`
- **Arquivos/Módulos previstos:**
  - `docs/fase1/1.1-elicitacao/requisitos.md` (`RNF06` — exclusão completa de conta e dados)
  - `docs/fase1/1.1-elicitacao/backlog.md` (`US09` — vocabulário controlado `lactose` e `trigo_centeio_cevada_aveia`)
  - `docs/fase1/1.2-analise/regras-de-negocio.md` (`RN03e`, `RN05`, `RN08`, `RN09`, `RN16`)
  - `docs/fase1/1.2-analise/casos-de-uso.md` (`UC08` revogação/exclusão de conta; `UC12` FA2/FE2 via API sem tela)
  - `docs/fase1/1.2-analise/modelo-conceitual.md` (nota de `"em preparo"` local em `ItemDeRotina`)
  - `docs/fase1/1.4-validacao/casos-de-teste.md` (`CT01`, `CT17`, `CT19`, `CT30` e tabela de cobertura)
  - `docs/fase1/1.3-documentacao/documento-de-requisitos.md` (re-sincronização completa + correções editoriais)
  - `docs/fase1/1.4-validacao/matriz-rastreabilidade.md` (re-sincronização de `RNF06`, `RN08`, `RN09` e `UC12`)
- **Fora de escopo:** Alterações de escopo funcional (novas US/RF), renumeração de IDs estáveis ou alterações de código-fonte.

## 3. Critérios de Aceite
- [x] `UC12` (FA2 e FE2) e `CT30` refletem curadoria exclusiva via API (sem tela administrativa na v1, retorno de erro estruturado com `manualFlowAvailable = true` — `ADR-010`, `ADR-011`).
- [x] `RN03e` explicita que os conjuntos temáticos e marcos de badge são definidos declarativamente via seed pela dupla/curador.
- [x] `RN08` explicita que `"não verificado"` bloqueia sugestões apenas para usuários com restrição cadastrada (decisão 5 da 2.1) e documenta a exceção `confirmadoSemAlergenos` para lista vazia verificada pelo curador (`ADR-014`).
- [x] `RN05` registra nota de representação no contrato (`score` inteiro `0..10` equivalente a `0..5` em passos de `0,5` na interface).
- [x] `RNF06`, `RN09` e `UC08` formalizam a exclusão completa da conta e de todos os dados associados a pedido do usuário (LGPD art. 18, VI; `ADR-007` item 9; `DELETE /v1/account`).
- [x] `modelo-conceitual.md` inclui nota explícita de que `ItemDeRotina.status = "em preparo"` é mantido apenas localmente no aparelho (`LocalCookingState`, `ADR-005`/`ADR-008`), enquanto o servidor persiste `{planejado, concluído}`.
- [x] `US09`, `CT01`, `CT17` e `CT19` alinham os exemplos aos códigos canônicos `lactose` e `trigo_centeio_cevada_aveia` do vocabulário controlado de 19 códigos (`ADR-014`, ANVISA RDC 727/2022).
- [x] `documento-de-requisitos.md` e `matriz-rastreabilidade.md` estão 100% sincronizados com os arquivos-fonte da Fase 1, sem typos residuais.

## 4. Verificação e Testes
- **Abordagem de Teste:** Revisão documental cruzada (Fase 1 × ADRs × `openapi.yaml` × `diagrama-classes.md`).
- **Comando / Evidência de conclusão:**
  - Conferência de divergências por `grep` em `docs/fase1/` (zero ocorrências de `"redireciona para o fluxo"`, `"sitema"`, `"cconfigurar"`, `"Pão de queijo" (declara glúten)` e presença de `confirmadoSemAlergenos`, `trigo_centeio_cevada_aveia`, `manualFlowAvailable` e exclusão de conta em `RNF06`/`RN09`).
