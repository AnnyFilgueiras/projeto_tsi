# Playbook 02 — Evolução Arquitetural, ADRs e Retroalimentação

> **Quando usar:** Ao tomar novas decisões arquiteturais, detalhar ou revisar um ADR existente, modelar o framework conceitual de gamificação (6D/Octalysis), ajustar diagramas C4/Classes ou retroalimentar artefatos da Fase 1 ou da Fase 2.

---

## 1. Ordem de Precedência Documental

Em caso de conflito entre textos do repositório, aplique sempre esta hierarquia:

1. **Artefatos Aprovados da Fase** (ex.: `regras-de-negocio.md`, `atributos-qualidade.md`, `c4-*.md`, `diagrama-classes.md`, `openapi.yaml`, `padroes-de-projeto.md`)
2. **ADRs vigentes** em [`../fase2/adr/`](../fase2/02-adr/) (incluindo suas seções finais de `Detalhamento`)
3. **Painel de Estado Vivo** ([`../../STATE.md`](../../STATE.md))
4. **Briefing da Fase** ([`../fase2/briefing-fase2.md`](../fase2/briefing-fase2.md))

---

## 2. Como Evoluir ou Alterar um ADR

Os ADRs em [`../fase2/adr/adr-001..015-*.md`](../fase2/02-adr/) seguem a regra de **registro histórico imutável**:

### Caso A: Detalhamento, Extensão ou Estratégia de Implementação em Estágios
Quando a decisão central do ADR continua válida, mas ganha um refinamento técnico (ex.: dividir a implementação em Estágio 1 e Estágio 2 do MVP, ou detalhar um adaptador de deploy):
- **NÃO apague** o texto original da seção `## Decisão`.
- Adicione ao final do arquivo uma seção datada:
  ```markdown
  ## Detalhamento (<Etapa ou Contexto> — DD/MM/AAAA)

  - **<Tópico>:** <Explicação clara do detalhamento, impacto nos componentes e rastreio para atributos A##/RNs>.
  ```

### Caso B: Substituição de uma Decisão Central
Quando uma decisão é revogada por completo (ex.: trocar React Native por Flutter, ou abandonar o Monólito Modular):
1. Crie um novo arquivo `docs/fase2/02-adr/adr-NNN-<titulo>.md` com os campos obrigatórios (`Status`, `Data`, `Autores`, `Atributos`, `Rastreio`, `ADRs relacionados`, `Contexto`, `Decisão`, `Alternativas consideradas`, `Consequências`, `Riscos relacionados`, `Quando revisitar`).
2. No ADR antigo, altere apenas a linha `- **Status:**` para:
   `- **Status:** Substituído por ADR-016 em DD/MM/AAAA`.

---

## 3. Cadeia de Rastreabilidade Obrigatória

Nenhuma decisão, componente, classe ou regra de gamificação existe "solta" no projeto. Ao criar ou alterar um elemento, mantenha os elos da cadeia:

```text
História/Regra (US## / RN## / RNF##)
   └── Atributo de Qualidade (A01..A14 em atributos-qualidade.md)
        └── Decisão Arquitetural (ADR-001..015 em docs/fase2/adr/)
             └── Container e Componente (c4-containers.md / c4-componentes.md)
                  └── Classes, Padrões e Contrato (diagrama-classes.md / padroes-de-projeto.md / openapi.yaml)
                       └── Caso de Teste / Vetor JSON (casos-de-teste.md / suítes de teste)
```

---

## 4. Protocolo de Retroalimentação entre Fases

### 4.1. Retroalimentação dentro da Fase 2 (Fase 2 -> Fase 2)
- Mudanças que afetam artefatos da própria Fase 2 são aplicadas **diretamente nos arquivos da Fase 2** na mesma tarefa/PR (atualizando a versão no cabeçalho do arquivo, ex.: `v1.1 -> v1.2`) e listadas no campo `### Artefatos alterados (retroalimentação)` do [`../fase2/diario_de_bordo-fase2.md`](../fase2/diario_de_bordo-fase2.md).

### 4.2. Retroalimentação para a Fase 1 (Fase 2 ou Gamificação -> Fase 1)
- Como a Fase 1 possui linha de base fechada (tag `backlog-validado-v1.0`), qualquer alteração em artefatos de [`../fase1/`](../fase1/) (ex.: novas Regras de Negócio vindas do framework de gamificação 6D/Octalysis, ajustes em Casos de Uso ou Critérios de Aceite) **deve ser registrada via GitHub Issue de Retroalimentação**.
- Ao aplicar a Issue na Fase 1, atualize também o [`../fase1/1.3-documentacao/documento-de-requisitos.md`](../fase1/1.3-documentacao/documento-de-requisitos.md) e a [`../fase1/1.4-validacao/matriz-rastreabilidade.md`](../fase1/1.4-validacao/matriz-rastreabilidade.md) para manter o documento consolidado sincronizado com os arquivos-fonte.

---

## 5. Diretriz para a Futura Modelagem de Gamificação (6D / Octalysis)

Quando a tarefa de modelagem com framework conceitual de gamificação for iniciada:
1. **Rastreio Metodológico:** Documentar quais elementos do framework escolhido (ex.: *Core Drives* do Octalysis ou passos do *6D*) justificam cada mecânica do Panelada (coleção por culinária, evolução de pratos, badges temáticos e novas dinâmicas que surgirem).
2. **Isolamento Arquitetural (`A12`):** No código e nos diagramas da Fase 2, toda regra de cálculo de progresso e recompensas deve permanecer encapsulada em `UnlockCalculator` (App) e `UnlockRules` (API, módulo `progress`), consumindo definições declarativas de marcos (`MilestoneDefinition`) e validada pela suíte compartilhada de vetores JSON. Evite espalhar condicionais de gamificação dentro dos módulos `catalog`, `routine` ou `profile`.
