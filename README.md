# Panelada: Culinária internacional gamificada

Aplicativo mobile que transforma o ato de cozinhar em uma experiência divertida e recompensadora: sugere pratos internacionais conforme o perfil do usuário, organiza a rotina de refeições (escolha do prato, data de compra e data de preparo) e celebra cada receita concluída como uma conquista — coleção por culinária ("Pokédex de pratos"), cadeias de evolução e badges.

> **Elevator pitch:** Para pessoas que gostam de cozinhar e querem escapar da rotina de repetir sempre os mesmos pratos, o Panelada é um aplicativo mobile de culinária internacional que transforma o ato de cozinhar em uma experiência divertida e recompensadora. Diferente dos apps de receitas tradicionais, ele estimula o usuário a aprender pratos novos continuamente, combinando o planejamento da rotina de cozinha com mecânicas de jogo que celebram cada receita concluída como uma conquista.

## Contexto

Repositório do trabalho da disciplina **Tópicos em Sistemas de Informação** (Ciência da Computação), cujo tema é o uso de **IA generativa aplicada ao ciclo de vida de desenvolvimento de software**. Cada fase do processo é conduzida com IA generativa como copiloto, e os artefatos são consolidados neste repositório, fase a fase.

- **Dupla:** Anny Filgueiras ([@AnnyFilgueiras](https://github.com/AnnyFilgueiras)) e Gabryel Souza ([@gabryelsouzz](https://github.com/gabryelsouzz))
- **Professor(a):** Patrick Henrique
- **Fase atual:** Fase 1 — Engenharia de Requisitos

## Status da Fase 1

| Sub-etapa | Artefato principal | Status |
|---|---|---|
| 1.1 Elicitação | Léxico, personas, RF/RNF, backlog MoSCoW | ✅ Concluída |
| 1.2 Análise | Modelo conceitual (UML/Mermaid), casos de uso, regras de negócio | ✅ Concluída |
| 1.3 Documentação | Este repositório + documento de requisitos consolidado | ✅ Concluída |
| 1.4 Validação | Checklist de qualidade, matriz de rastreabilidade, ata de revisão | 🚧 Em andamento |

## Documentação da Fase 1

**Leitura recomendada:** o [Documento de Requisitos consolidado](./docs/fase1/1.3-documentacao/documento-de-requisitos.md) amarra, em texto único, visão, personas, requisitos, backlog, modelo conceitual, casos de uso, regras de negócio e rastreabilidade.

### 1.1 — Elicitação
- [Léxico do domínio](./docs/fase1/1.1-elicitacao/lexico.md)
- [Personas](./docs/fase1/1.1-elicitacao/personas.md)
- [Requisitos funcionais e não funcionais](./docs/fase1/1.1-elicitacao/requisitos.md)
- [Backlog de histórias de usuário (MoSCoW, com critérios de aceite)](./docs/fase1/1.1-elicitacao/backlog.md)

### 1.2 — Análise
- [Modelo conceitual do domínio (diagrama de classes UML em Mermaid)](./docs/fase1/1.2-analise/modelo-conceitual.md)
- [Casos de uso (UC01–UC13)](./docs/fase1/1.2-analise/casos-de-uso.md)
- [Regras de negócio (RN01–RN20)](./docs/fase1/1.2-analise/regras-de-negocio.md)

### 1.3 — Documentação
- [Documento de requisitos consolidado](./docs/fase1/1.3-documentacao/documento-de-requisitos.md)

### 1.4 — Validação
- Em produção (checklist de qualidade, matriz de rastreabilidade e ata de revisão serão publicados aqui).

## Gestão do backlog

- **Issues:** uma issue por história de usuário (US01–US18), cada uma com história, critérios de aceite em Given/When/Then, origem (RF/UC), labels de prioridade (`must`, `should`, `could`) e de fase (`elicitacao`, `analise`, `validacao`).
- **Milestone:** `Fase 1 — Engenharia de Requisitos`.
- **Kanban (Projects):** [quadro do projeto](https://github.com/users/AnnyFilgueiras/projects/1) com as colunas `Backlog | Em refinamento | Validado` (movimentação ocorre na sub-etapa 1.4).

## Estrutura do repositório

```
/docs
  /fase1
    /1.1-elicitacao      lexico.md, personas.md, requisitos.md, backlog.md
    /1.2-analise         modelo-conceitual.md, casos-de-uso.md, regras-de-negocio.md
    /1.3-documentacao    documento-de-requisitos.md
    /1.4-validacao       checklist.md, matriz-rastreabilidade.md, ata-revisao.md (em produção)
  diario-de-bordo.md     registro do processo, atualizado a cada sub-etapa
/assets                  PNG/SVG dos diagramas (insumo do slide final)
README.md                este arquivo
```

## Diário de bordo

O [diário de bordo](./docs/diario-de-bordo.md) registra, a cada sub-etapa, o papel da IA generativa, as técnicas aplicadas, os prompts-chave, as decisões tomadas, as iterações e as pendências. Ele é a evidência do processo de geração de requisitos com IA — e o insumo do slide final da fase.
