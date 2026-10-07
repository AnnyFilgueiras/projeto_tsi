# ADR-015 — Idioma dos identificadores de código e do contrato

- **Status:** Aceito
- **Data:** 07/10/2026
- **Autores:** Dupla
- **Atributos:** A12 (modificabilidade) e A09 (manutenibilidade), como apoio
- **Rastreio:** exigência da dupla na conversa 2.7
- **ADRs relacionados:** ADR-002, ADR-007, ADR-010, ADR-014

## Contexto

Os artefatos da 2.6 (`diagrama-classes.md`, sequências, `openapi.yaml`, coleção Bruno) usam nomes de classe, rotas e campos em português. A dupla decidiu, na 2.7, que o código deve estar em inglês. Se só o código mudasse, haveria dois vocabulários (diagramas em um idioma, código em outro) e eles tenderiam a divergir. O código ainda não foi escrito, o lint do OpenAPI não foi executado e a coleção Bruno não foi aberta, então este é o momento de menor custo para a mudança.

## Decisão

1. **Em inglês:** nomes de pastas, arquivos, classes, funções, variáveis, tabelas e colunas, comentários de código, rotas e campos do contrato (OpenAPI), valores de enumeração (por exemplo `unverified`, `approved`), tipos de operação da fila, cabeçalhos HTTP próprios e identificadores de erro (por exemplo `key-reused`).
2. **Commits em inglês.** Pull requests e issues em português (Brasil).
3. **Em português do Brasil:** textos dos artefatos, ADRs, diário e briefings; textos exibidos ao usuário no app; mensagens de erro legíveis. Os diagramas C4 mantêm os nomes de componente em português.
4. **Exceção, vocabulário de alérgenos:** os 19 códigos do vocabulário v1 (ADR-014) continuam como estão, por serem dado de domínio ligado à lista da ANVISA e referenciado na Fase 1 (US09, CT01, CT17, CT19). Cada código tem rótulo legível em português no seed.
5. **Equivalência:** o `glossario-identificadores.md` (aprovado em 07/10/2026) é a fonte da tradução. Termo novo entra no glossário antes de entrar no código.
6. **Artefatos afetados (escopo B):** `diagrama-classes.md` v1.1, as quatro sequências v1.1, `openapi.yaml` e a coleção Bruno.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| A. Só o código em inglês; contrato e diagramas em português | Cria vocabulário misto na fronteira da API, com camada de tradução que precisa de testes, e dois idiomas para a mesma coisa nos diagramas e no código |
| C. Incluir também os códigos de alérgenos | Exigiria emendar o seed, os casos de teste da Fase 1 e a issue #31, sem ganho de manutenção |
| Manter tudo em português | Contraria a exigência da dupla |

## Consequências

**Positivas**
- Um só vocabulário entre diagramas, contrato e código.
- A mudança acontece antes de existir código e antes da primeira execução do contrato.

**Negativas**
- Retrabalho mecânico em quatro grupos de artefatos da 2.6 (diagramas, sequências, OpenAPI, Bruno com 46 arquivos), com risco de renomeação inconsistente.
- Os C4 ficam com rótulos em português, e os diagramas de classe em inglês. Mitigação: o glossário (seção 8) liga cada componente C4 à sua pasta.
- Os termos de domínio da Fase 1 (Prato, Receita, Candidata) exigem tradução consistente, que é decisão da dupla e pode divergir do uso de mercado.
- Os códigos de alérgenos continuam em português, uma exceção à regra.

## Quando revisitar

| Gatilho | Ação |
|---|---|
| Tradução de um termo de domínio gerar ambiguidade | Corrigir o glossário e registrar no diário |
| Professor ou colaborador externo exigir outro idioma no código | Revisar este ADR |

## Pontos em aberto

- A lista completa de rotas e campos do OpenAPI a traduzir será levantada ao aplicar o `openapi.yaml` v1.1.
- Regra de lint para nomes em inglês: não faz parte da 2.7; sugestão para a Fase 3.
