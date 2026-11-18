# Sequência — UC04, Visualizar receita (com UC09)

> Fase 2.6 — Classes, sequências e contratos; revisão da 2.7. Papel da IA: arquiteto, designer de componentes e de padrões (SOLID).
> Destino: `/docs/fase2/sequencia-uc04.md`. Versão 1.1 — 07/10/2026 — status: a revisar pela dupla.
> Rastreio: UC04 (fluxo principal, FA1, FA3), UC09; RN02, RN08, RN15, RN16, RN17, RN22; US05, US09, US10, US15; A04, A06; ADR-001, ADR-012, ADR-014, ADR-015.
> Os participantes seguem os componentes do `c4-componentes.md` v1.1 (nomes em português) e as classes do `diagrama-classes.md` v1.1 (identificadores em inglês, ADR-015).
> Alterações da v1.1: identificadores em inglês pelo glossário.

## 1. Abrir a receita

```mermaid
sequenceDiagram
  actor U as Usuário
  participant RP as Receita e Preparo (App)
  participant CA as LoadRecipe
  participant FR as RecipeSource (local ou remota)
  participant AC as EvaluateCompatibility
  participant RG as Pacote de Alérgenos
  participant RE as RestrictionRepository
  participant GF as Gerenciador de Fotos
  participant API as Catálogo (API)

  U->>RP: abre um prato
  RP->>CA: execute(dishId)
  CA->>FR: get(dishId)
  alt receita baixada (planejada, em preparo ou preparada)
    FR-->>CA: receita, foto local e data dos alérgenos
  else candidata e há rede
    FR->>API: GET /v1/recipes/{dishId}
    API-->>FR: receita, alérgenos por ingrediente, substitutos e foto
    FR-->>CA: receita
    CA->>GF: download(photo hash)
  else sem rede e não baixada
    FR-->>CA: indisponível
    CA-->>RP: precisa de conexão
    RP-->>U: informa que precisa de conexão
  end
  CA->>AC: execute(recipe)
  AC->>RE: lê restrições, só no aparelho
  AC->>RG: classifyRecipe(recipe, restrictions)
  RG-->>AC: result e reasons
  AC-->>CA: classification
  CA-->>RP: receita, estado dos alérgenos, classificação, atribuição e fonte
  alt prato é evolução bloqueada (FA3, RN02)
    RP-->>U: mostra qual prato base precisa ser avaliado
  end
  alt incompatível ou não confirmada (FA1, RN16)
    RP-->>U: alerta destacado e data da última atualização
  else compatível
    RP-->>U: receita com o estado dos alérgenos visível
  end
  RP-->>U: imagem, tempo, dificuldade, ingredientes, utensílios e fonte (RN17)
```

- A classificação roda **no aparelho**, também para candidata. O servidor não recebe a restrição nessa consulta (RNF06, A05). A mesma `AllergenRules` roda nos dois lados, com a mesma suíte de vetores (ADR-014).
- `LoadRecipe` recebe a fonte (`LocalRecipeSource` ou `RemoteRecipeSource`) por injeção, montada na raiz de composição (P02e, regra A8).
- Sem restrição cadastrada, o resultado é `compatible` e o estado dos alérgenos fica visível (RN16). Com restrição, vale a RN08 completa. Estado `source_declared` é `compatible` quando não há alérgeno da restrição, sempre com o aviso "compatibilidade não confirmada".
- Receita sem estado de alérgenos ou com lista vazia, sem confirmação, classifica como `unconfirmed`.
- Sem rede e sem receita baixada, a tela diz isso. A preparada de instalação nova volta quando o usuário abre com rede (R15).
- Medida (H): abrir offline em até 2 s com SQLCipher no emulador de referência (A04).

## 2. Substituições e passo a passo

```mermaid
sequenceDiagram
  actor U as Usuário
  participant RP as Receita e Preparo (App)
  participant RS as ResolveSubstitutions
  participant RR as RecipeRepository
  participant RG as Pacote de Alérgenos
  participant EP as LocalCookingState

  RP->>RS: execute(recipe)
  RS->>RR: lê despensa local e substitutos da receita
  RS->>RG: identifica ingredientes incompatíveis (RN08)
  RG-->>RS: ingredientes incompatíveis
  Note over RS: problemáticos = faltantes na despensa ou incompatíveis
  loop para cada ingrediente problemático (UC09)
    loop para cada substituto cadastrado
      RS->>RG: isSubstituteAllowed(substitute, restrictions) (RN22)
      RG-->>RS: permitido ou não
    end
    alt há substituto permitido
      RS-->>RP: lista de substitutos seguros
    else sem substituto seguro (FA1, RN15)
      RS-->>RP: sem substituto seguro cadastrado, sem inventar troca
    end
  end
  RP-->>U: ingredientes faltantes e restritos com substituições
  U->>RP: inicia o passo a passo
  opt há item de rotina planejado para o prato
    RP->>EP: marca em preparo local
  end
  alt receita de candidata ainda não gravada
    RP->>RR: grava a receita para uso offline
  end
  loop a cada avanço
    U->>RP: avança o passo
    RP-->>U: passo atual destacado (US05)
  end
```

- Os substitutos chegam com a receita, cada um com seus alérgenos. O filtro da RN22 roda no aparelho. Substituto sem alérgenos declarados fica `unverified` e some para quem tem restrição.
- "Em preparo" é só uma marca local (`LocalCookingState`), sem operação na fila. É apagada quando a avaliação é salva (UC10). Abrir o passo a passo sem item de rotina não marca nada.
- A receita de candidata só é gravada no aparelho **quando o passo a passo abre**. Antes disso a consulta é só leitura.
- Nenhum log, métrica ou erro leva restrição ou resultado ligado a usuário (ADR-014, itens 6 e 9).
