# Sequência — UC04, Visualizar receita (com UC09)

> Fase 2.6 — Classes, sequências e contratos. Papel da IA: arquiteto, designer de componentes e de padrões (SOLID).
> Destino: `/docs/fase2/sequencia-uc04.md`. Versão 1.0 — 07/10/2026 — status: a revisar pela dupla.
> Rastreio: UC04 (fluxo principal, FA1, FA3), UC09; RN02, RN08, RN15, RN16, RN17, RN22; US05, US09, US10, US15; A04, A06; ADR-001, ADR-012, ADR-014.
> Os participantes seguem os componentes do `c4-componentes.md` v1.1 e as classes do `diagrama-classes.md`.

## 1. Abrir a receita

```mermaid
sequenceDiagram
  actor U as Usuário
  participant RP as Receita e Preparo (App)
  participant CA as CarregarReceita
  participant FR as FonteDeReceita (local ou remota)
  participant AC as AvaliarCompatibilidade
  participant RG as Pacote de Alérgenos
  participant RE as RepositorioRestricoes
  participant GF as Gerenciador de Fotos
  participant API as Catálogo (API)

  U->>RP: abre um prato
  RP->>CA: executar(pratoId)
  CA->>FR: obter(pratoId)
  alt receita baixada (planejada, em preparo ou preparada)
    FR-->>CA: receita, foto local e data dos alérgenos
  else candidata e há rede
    FR->>API: GET /v1/receitas/{pratoId}
    API-->>FR: receita, alérgenos por ingrediente, substitutos e foto
    FR-->>CA: receita
    CA->>GF: baixar(hash da foto)
  else sem rede e não baixada
    FR-->>CA: indisponível
    CA-->>RP: precisa de conexão
    RP-->>U: informa que precisa de conexão
  end
  CA->>AC: executar(receita)
  AC->>RE: lê restrições, só no aparelho
  AC->>RG: classificarReceita(receita, restricoes)
  RG-->>AC: resultado e motivos
  AC-->>CA: classificação
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

- A classificação roda **no aparelho**, também para candidata. O servidor não recebe a restrição nessa consulta (RNF06, A05). A mesma `RegraAlergenos` roda nos dois lados, com a mesma suíte de vetores (ADR-014).
- Sem restrição cadastrada, o resultado é `compativel` e o estado dos alérgenos fica visível (RN16). Com restrição, vale a RN08 completa. Estado "declarado pela fonte" é `compativel` quando não há alérgeno da restrição, sempre com o aviso "compatibilidade não confirmada".
- Receita sem estado de alérgenos ou com lista vazia, sem confirmação, classifica como `nao_confirmada`.
- Sem rede e sem receita baixada, a tela diz isso. A preparada de instalação nova volta quando o usuário abre com rede (R15).
- Medida (H): abrir offline em até 2 s com SQLCipher no emulador de referência (A04).

## 2. Substituições e passo a passo

```mermaid
sequenceDiagram
  actor U as Usuário
  participant RP as Receita e Preparo (App)
  participant RS as ResolverSubstituicoes
  participant RR as RepositorioReceitas
  participant RG as Pacote de Alérgenos
  participant EP as EstadoPreparoLocal

  RP->>RS: executar(receita)
  RS->>RR: lê despensa local e substitutos da receita
  RS->>RG: identifica ingredientes incompatíveis (RN08)
  RG-->>RS: ingredientes incompatíveis
  Note over RS: problemáticos = faltantes na despensa ou incompatíveis
  loop para cada ingrediente problemático (UC09)
    loop para cada substituto cadastrado
      RS->>RG: substitutoPermitido(substituto, restricoes) (RN22)
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

- Os substitutos chegam com a receita, cada um com seus alérgenos. O filtro da RN22 roda no aparelho. Substituto sem alérgenos declarados fica `nao_verificado` e some para quem tem restrição.
- "Em preparo" é só uma marca local, sem operação na fila. É apagada quando a avaliação é salva (UC10). Abrir o passo a passo sem item de rotina não marca nada.
- A receita de candidata só é gravada no aparelho **quando o passo a passo abre**. Antes disso a consulta é só leitura.
- Nenhum log, métrica ou erro leva restrição ou resultado ligado a usuário (ADR-014, itens 6 e 9).
