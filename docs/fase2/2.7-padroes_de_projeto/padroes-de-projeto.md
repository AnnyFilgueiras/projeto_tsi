# Padrões de projeto justificados — Panelada (Fase 2.7)

> Fase 2.7 — Padrões de projeto. Papel da IA: arquiteto, designer de componentes e de padrões (SOLID).
> Destino: `/docs/fase2/padroes-de-projeto.md`. Versão 1.1 — 07/10/2026 — status: a revisar pela dupla.
> Insumos: `briefing-passagem-2.7.md`, `briefing-fase2.md` v1.3, `diario_de_bordo-fase2.md` (entrada 2.6), `diagrama-classes.md` v1.0, `sequencia-uc10.md`, `sequencia-uc04.md`, `sequencia-uc08.md`, `sequencia-uc12.md`, `modelo-conceitual.md`, `regras-de-negocio.md`, ADR-001 a ADR-014, `c4-componentes.md` v1.1, `atributos-qualidade.md` v1.3.
> Convenção de língua (ADR-015): textos em português (Brasil); **identificadores de código, pastas e contrato em inglês**. Equivalências em `glossario-identificadores.md`. Neste documento, os nomes de classe aparecem em inglês, com o nome da 2.6 entre parênteses na primeira ocorrência de cada padrão.
> Alterações da v1.1: varredura do catálogo de padrões (seção 5.1), regra A8 (raiz de composição do app) e seção 9 (testabilidade e TDD).

## 1. Critério de entrada

Um padrão só entra se tiver (1) um problema concreto do projeto, (2) as classes envolvidas, (3) a alternativa mais simples considerada e (4) o motivo de ela não bastar. Sem os quatro, o padrão sai e o código usa a alternativa simples. Rastreio por atributo (A##), ADR e UC.

## 2. Resumo das decisões

| ID | Padrão ou técnica | Onde | Decisão |
|---|---|---|---|
| P01 | Registro de `OperationApplier` (Strategy com registro) | API: Sincronização | Mantido |
| P02a | Porta `LocalDatabase` | App | Mantido |
| P02b | Porta `AiProvider` | API: Importação | Mantido |
| P02c | Porta `KeyProvider` | API: Cifra | Mantido |
| P02d | Porta `NotificationAdapter` | App: Lembretes | Mantido, mínimo (função injetada) |
| P02e | Porta `RecipeSource` | App: Receita e Preparo | Mantido (primeiro a cortar) |
| P03 | Repositório por feature | App | Mantido |
| P04 | Transactional Outbox | App: avaliação e fila | Mantido (já existia no desenho) |
| P05 | Idempotent Receiver | API: Sincronização | Mantido (já existia no desenho) |
| P06 | Facade de módulo (interfaces públicas) | API | Mantido (já existia no desenho) |
| T01 | Contexto transacional explícito (`Tx`) | API | Convenção que substitui o Unit of Work |
| R01 | Unit of Work formal | API | Removido |
| R02 | Lista de regras do `PublicationGate` | API: Importação | Removido |
| R03 | Calculadora de desbloqueio por tipo de marco | App e API | Removido (`switch` com checagem de exaustividade) |

## 3. Padrões mantidos

### P01 — Registro de `OperationApplier`

- **Problema:** a Sincronização recebe oito tipos de operação que pertencem a três módulos (rotina, progresso, perfil). Ela não pode conhecer os internos desses módulos (ADR-002), e a mudança da RN19 (pontuação) deve ficar em um só módulo (A12).
- **Classes:** `SyncService` (`ServicoSincronizacao`), `OperationApplier` (`AplicadorDeOperacao`), `RatingApplier`, `RoutineApplier`, `ProfileApplier`. O contrato `OperationApplier` fica em `src/shared/`, e cada aplicador fica no módulo dono do tipo.
- **Alternativa mais simples:** `switch` central em `SyncService`.
- **Por que não basta:** o `switch` obriga a Sincronização a importar três módulos só para despachar, e cada tipo novo mexe nela. A verificação de inicialização (tipo duplicado; tipo da lista de oito sem aplicador) fica natural com um `Map`.
- **Forma mínima:** um `Map<tipo, aplicador>` preenchido na raiz de composição (`src/app.ts`). Sem carregamento dinâmico nem framework de plugins.
- **Rastreio:** A08, A12; ADR-002, ADR-008; UC05, UC08, UC10.

### P02 — Portas e adaptadores (cinco, avaliadas uma a uma)

| ID | Porta e adaptadores | Problema | Alternativa mais simples | Decisão |
|---|---|---|---|---|
| P02a | `LocalDatabase` (`BancoLocal`): `SqlCipherDatabase`; falso em testes | SQLCipher é nativo e não roda no Jest. Sem porta não há teste unitário de `RegisterRating` (A04, A08). | Chamar `expo-sqlite` direto | Mantido |
| P02b | `AiProvider` (`ProvedorIA`): `KimiProvider` e `RecordedProvider` | O adaptador gravado evita custo (teto de R$ 20) e envio de texto a terceiros em testes e demo. Troca de provedor fica possível (R11). Os dois passam a mesma suíte de contrato. | Chamar a Kimi direto | Mantido (o motivo mais forte) |
| P02c | `KeyProvider` (`ProvedorDeChave`): `FileKey` (demo) e `SecretManagerKey` (alvo) | Há duas implementações reais (ADR-006, ADR-004). | `if` por ambiente | Mantido |
| P02d | `NotificationAdapter` (`AdaptadorNotificacoes`): `expo-notifications` e falso | O limite de 2 por dia (A07) se testa com um falso. O `ReminderScheduler` já é puro. | Chamar `expo-notifications` direto | Mantido como **função injetada**, sem hierarquia de classes |
| P02e | `RecipeSource` (`FonteDeReceita`): `LocalRecipeSource` e `RemoteRecipeSource` | Isola o caminho offline da receita (A04, crítico). `LoadRecipe` testa sem rede e sem banco. | `if` local/remoto dentro de `LoadRecipe` | Mantido, sem fábrica. São só dois ramos: **primeiro candidato a corte** se a dupla achar pesado. |

### P03 — Repositório por feature (app)

- **Problema:** só os repositórios devem conhecer as tabelas. As features não escrevem SQL, e as mudanças de esquema ficam isoladas no `Migrator` (ADR-005).
- **Classes:** `RatingRepository`, `RoutineRepository`, `RecipeRepository`, `RestrictionRepository`, `LocalDatabase`, `Migrator`.
- **Alternativa mais simples:** acesso direto ao banco nos casos de uso.
- **Por que não basta:** `RegisterRating` grava avaliação, desbloqueios e operação da fila na mesma transação. Com SQL espalhado, qualquer mudança de esquema atinge todas as features.
- **Forma mínima:** um repositório por feature, só com os métodos usados. Sem `Repository<T>` genérico. Os repositórios recebem o manipulador de transação de `LocalDatabase`.
- **No servidor:** o acesso a dados fica em `internal/` de cada módulo. Isso é a fronteira do ADR-002, não um padrão extra.
- **Rastreio:** A04, A05, A08; ADR-005, ADR-006.

### P04 — Transactional Outbox no app

- **Problema:** salvar a avaliação e perder a operação de sincronização (ou o contrário) viola A08 ("0 avaliações perdidas").
- **Classes:** `RegisterRating`, `OperationEnqueuer` (`EnfileiradorDeOperacoes`), `SyncQueue` (`FilaSincronizacao`), `QueuedOperation` (`OperacaoFila`), `LocalDatabase.transaction`.
- **Alternativa mais simples:** uma coluna `synced` em cada tabela, com varredura para enviar.
- **Por que não basta:** a revogação de restrição **apaga a linha** (decisão da 2.6), então não há linha onde marcar a operação. A coluna também não guarda o `opId` estável nem a ordem de criação.
- **Rastreio:** A08, A04; ADR-005, ADR-008; UC08, UC10.

### P05 — Idempotent Receiver no servidor

- **Problema:** a reconexão reenvia operações. O servidor não pode duplicar o preparo nem aplicar duas vezes o mesmo efeito (A08).
- **Classes:** `SyncService`, `OperationRepository`, `ProcessedOperation` (`OperacaoProcessada`), `OperationApplier`.
- **Alternativa mais simples:** restrição de unicidade nos dados, já que `Rating.id` e o `id` do item de rotina são o `opId`.
- **Por que não basta (análise do arquiteto, a conferir na revisão):** a unicidade cobre só a avaliação e a criação de item. Para reagendar, marcar item e definir lembretes, reaplicar uma operação antiga pode sobrescrever um estado mais novo. A tabela guarda também o `payloadHash` (reuso do `opId` com carga diferente devolve 422) e a resposta (o reenvio recebe a mesma resposta).
- **Detalhes fixados:** chave `(accountId, opId)`, validade de 90 dias, gravação na mesma transação do efeito.
- **Rastreio:** A08; ADR-008; UC05, UC08, UC10.

### P06 — Facade de módulo (interfaces públicas)

- **Problema:** o ADR-002 exige que um módulo só acesse outro pela interface pública, e o Fastify não impõe isso.
- **Classes:** `CatalogRead`, `CatalogWrite`, `ProfileLifecycle`, `ProfileQuery`, `RestrictionsForFilter`, `RoutinePublic`, `ProgressPublic`.
- **Alternativa mais simples:** importar os internos do outro módulo.
- **Por que não basta:** sem interface estreita, a RN19 espalha alterações (A12) e `RestrictionsForFilter`, que entrega a restrição decifrada, ficaria ao alcance de qualquer módulo (RNF06).
- **Forma mínima:** uma interface por arquivo em `public/`, o que permite a regra S3 da seção 6.
- **Rastreio:** A12, A05; ADR-002, ADR-006.

## 4. Convenção que substitui um padrão

### T01 — Contexto transacional explícito (`Tx`)

- **Problema:** duas escritas em módulos diferentes precisam ser atômicas. `AccountService` cria `Account` e o perfil (`ProfileLifecycle.createProfile`) juntos. `SyncService` grava o efeito do aplicador e `ProcessedOperation` juntos. Módulos não podem tocar nas tabelas uns dos outros.
- **Decisão (aprovada pela dupla em 07/10/2026):** toda interface pública que escreve recebe um parâmetro `tx: Tx`, tipo opaco definido em `src/shared/`. Quem inicia a transação a passa adiante, e o módulo dono usa o `tx` nas suas tabelas.
- **Efeito no ADR-002:** o item 4 diz que o pacote de alérgenos é a única dependência comum. Passa a haver também `src/shared/` (tipo `Tx` e contrato `OperationApplier`). Entra como nota "Detalhamento (2.7)" no ADR-002, sem substituí-lo.

## 5. Padrões avaliados e removidos

| ID | Candidato | Motivo da remoção | Alternativa adotada | Reavaliar quando |
|---|---|---|---|---|
| R01 | Unit of Work formal | Rastrear mudanças e confirmar em bloco é exagero para duas transações conhecidas | T01 (`Tx` explícito) | Escritas envolverem mais de três módulos |
| R02 | Lista de regras no `PublicationGate` (`PortaoPublicacao`) | O requisito é devolver **todas** as violações, e quatro verificações atendem isso. Uma interface de regra não pagaria o custo. | Função com helpers privados, um por verificação, sem interface nem classe | Mais de seis regras |
| R03 | Calculadora de desbloqueio por tipo de marco | Os cinco tipos da RN03 são fixos, carregados por seed pela dupla | `switch` sobre união discriminada com checagem `never` (a compilação falha se surgir um sexto tipo) | Sexto tipo de marco |

### Regra de desbloqueio nos dois lados

O app calcula o desbloqueio localmente e o servidor o recalcula (só acrescenta, RN04). Decisão da dupla (opção B): **duas implementações** (`UnlockCalculator` no app, `UnlockRules` no módulo `progress` do servidor), com **uma suíte comum de vetores** em arquivo JSON usado só nos testes, no mesmo modelo dos vetores do Pacote de Alérgenos (ADR-014). Não há pacote compartilhado novo. Risco: as duas implementações podem divergir se um vetor não for atualizado; a CI roda a suíte nos dois lados.

### 5.1 Varredura do catálogo de padrões

Na v1.0 avaliei os seis candidatos do briefing e quatro que surgiram na análise (Unit of Work, Facade, Outbox, Idempotent Receiver). A varredura do catálogo clássico (GoF) foi feita depois, a pedido da dupla.

| Padrão | Onde poderia entrar | Decisão | Motivo |
|---|---|---|---|
| Strategy | Aplicadores de operação, provedores de IA, chave, fonte de receita, calculadora de marco | **Adotado** em P01, P02b, P02c e P02e. Rejeitado para a calculadora (R03). | Há variação real em P01 e P02. Na calculadora os cinco tipos são fixos. |
| Adapter | Cada porta de P02 | **Adotado** (P02a a P02e) | Isola SQLCipher, Kimi, Secret Manager, notificações e rede |
| Command | `QueuedOperation`: operação persistida como dado (tipo e carga), executada depois pelo aplicador | **Já presente**, sem classe nova | A fila e o registro de P01 formam Command mais manipulador. Só ganha nome. |
| Singleton | `LocalDatabase`, `HttpClient`, chave, instância do Fastify | **Não adotado** | Estado global e dependência escondida atrapalham o teste. A instância única vem da raiz de composição, que cria uma vez e injeta (regra A8). |
| Factory | Escolha do `AiProvider` por `PROVEDOR_IA` e do `KeyProvider` por ambiente | **Função simples** na raiz de composição | Um `if` basta, sem classe de fábrica |
| Iterator | Percorrer lotes da fila e o conjunto baixado | **Não adotado** | É recurso da linguagem (`for...of`, geradores). `nextPending(n)` é leitura em lote. |
| Visitor | Operar sobre tipos fixos (marcos da RN03, tipos de operação) | **Não adotado** | Em TypeScript, união discriminada com `switch` exaustivo faz o mesmo com menos código (R03) |
| Observer | Sinal "sincronizar" depois de salvar | **Não adotado** | Há um só interessado (`Synchronizer`); chamada direta basta |
| State | Ciclo de `Suggestion`, estado da operação da fila, rotação de `RefreshSession` | **Não adotado** | Poucos estados e transições. Enumeração mais função pura de transição basta. |
| Decorator | Reenvio com espera progressiva sobre o `HttpClient` | **Não adotado** | A espera fica no `OperationSender`, único usuário |
| Chain of Responsibility | Verificações do `PublicationGate` | **Não adotado** (R02) | Quatro verificações que devem todas rodar |
| Facade | Interfaces públicas dos módulos | **Adotado** (P06) | Fronteira do ADR-002 |
| Repository | Acesso a dados do app | **Adotado** (P03) | Isola SQL |

Observação: `DownloadSetBuilder` (`MontadorDeConjunto`) não é o padrão Builder; é só o serviço que monta o conjunto baixado.

## 6. Verificação das fronteiras entre módulos

### 6.1 Ferramenta

`eslint-plugin-boundaries` (aviso no editor), com `import/no-cycle` para ciclos. Ambos gratuitos. Pré-requisitos a conferir na instalação: ESLint 9 ou superior, parser TypeScript e resolver TypeScript. Em `boundaries/dependency-nodes`, habilitar `dynamic-import` e `require` para pegar imports que escapam. Testes ficam fora via `boundaries/ignore`. `boundaries/no-unknown-files` em modo estrito obriga todo arquivo a pertencer a um tipo de elemento.

### 6.2 Estrutura de pastas do servidor

- `src/modules/{catalog,profile,routine,progress,importer}/`
- `src/cross-cutting/{identity,sync,suggestion-search}/`
- `src/support/{field-encryption,technical-log}/`
- `src/shared/` (tipo `Tx` e contrato `OperationApplier`)
- `src/app.ts` e `src/main.ts` (raiz de composição, pode importar tudo)
- `packages/allergen-rules/` (pacote com os pontos de entrada `rules` e `invariants`)
- Dentro de cada módulo: `public/` (uma interface por arquivo) e `internal/` (o resto, incluindo as tabelas)

### 6.3 Regras do servidor

| # | Regra | Protege |
|---|---|---|
| S1 | Ninguém importa `internal/` de outro módulo; só `public/` | ADR-002, P06 |
| S2 | Catalog, Profile e Routine não importam outro módulo de domínio. Progress e Importer importam só Catalog. Transversais: `suggestion-search` importa Catalog, Profile, Routine e Progress; `sync` importa Routine, Progress, Profile e Catalog; `identity` importa Profile. Módulo de domínio nunca importa transversal. | Fronteira de domínio, A12 |
| S3 | Só `suggestion-search` importa `profile/public/restrictions-for-filter` (tipo de elemento próprio, modo arquivo) | RNF06, A05 |
| S4 | Só `importer` importa `catalog/public/catalog-write` | UC12, RN21 |
| S5 | Só o módulo `profile` importa `support/field-encryption` | ADR-006 |
| S6 | `packages/allergen-rules` não importa nada do servidor nem módulos nativos do Node. `invariants` só é importado no servidor. | ADR-014, pureza |
| S7 | Sem ciclos de importação | ADR-002 |
| S8 | Esquemas de tabela ficam em `internal/` de cada módulo, sem arquivo único com todas as tabelas | Tabelas privadas |

### 6.4 Regras do app (aceitas pela dupla)

| # | Regra | Protege |
|---|---|---|
| A1 | Uma feature não importa outra feature | Feature-first |
| A2 | Só o adaptador SQLCipher importa o driver do banco | P02a |
| A3 | Casos de uso não importam `LocalDatabase`; só a pasta `data/` da própria feature o importa | P03 |
| A4 | A feature importa `OperationEnqueuer`, nunca `PendingOperations` nem `Synchronizer`; só o núcleo de sync importa a fila de pendentes | Segregação de interfaces |
| A5 | Só `network` e `local-db` importam `expo-secure-store`; só o adaptador de lembretes importa `expo-notifications` | P02d, guarda do token |
| A6 | `UnlockCalculator` e `ReminderScheduler` não importam núcleo nem bibliotecas do React Native | Funções puras |
| A7 | O app importa só o ponto de entrada `rules` do pacote de alérgenos | ADR-014 |
| A8 | A raiz de composição do app (`src/app/composition`) é o único lugar que importa adaptadores concretos e features ao mesmo tempo. Ela cria as instâncias únicas e as injeta. | Instância única sem Singleton (seção 5.1) |

### 6.5 Prova e limitações

- **Prova de que funciona:** criar de propósito um import proibido (por exemplo, `routine` importando `catalog/internal`), ver o lint falhar e remover o import. Sem essa prova, uma regra mal escrita passa em silêncio.
- **Execução:** `npm run lint` local e na CI gratuita do GitHub.
- **Limitação declarada:** o lint não vê SQL em texto que consulte a tabela de outro módulo. Mitigação: item de checklist de PR ("nenhuma consulta toca tabela de outro módulo") e revisão da 2.8.
- **Não verificado nesta etapa:** versões das ferramentas, sintaxe exata das regras, o tratamento de módulos nativos do Node em `boundaries/external` (se não funcionar, usar `no-restricted-imports`) e a regra `import/no-cycle` com o resolver TypeScript.

## 7. Correções de SOLID da 2.6 que não são padrão formal

Ficam fora deste documento, por serem divisão de responsabilidade ou segregação de interface: #1, #5, #7, #8, #9, #11 (S) e #4, #10 (I, além de P06). A #2 vira P02e, a #3 vira P03 e a #12 vira P02c. A #6 (`HttpClient` genérico mais clientes por assunto) permanece como decisão de SOLID.

## 8. Impacto no `diagrama-classes.md` (v1.1)

1. Todos os nomes passam para o inglês pelo glossário (ADR-015).
2. `Tx` entra nas interfaces que escrevem: `ProfileLifecycle`, `RoutinePublic`, `ProgressPublic`, `OperationApplier.apply`, `OperationRepository.save`.
3. `OperationApplier` passa para `src/shared/`.
4. `PublicationGate` deixa de ser classe: função com helpers privados.
5. Entra `UnlockRules` no módulo `progress` (servidor), pura, com os mesmos vetores do `UnlockCalculator`.
6. Seção 13.3 (condições da 2.7) é marcada como fechada; a seção 14 registra a verificação de fronteiras.
7. C4 e ADRs não são contraditos. Os C4 mantêm nomes em português. O ADR-002 recebe a nota de `src/shared/` e do mecanismo de verificação.

## 9. Testabilidade e TDD

Test-first nas partes onde o teste define o comportamento e custa pouco; teste depois nas telas e nas medições de dispositivo. Aprovado pela dupla em 07/10/2026.

| Nível | Partes | Prática |
|---|---|---|
| Test-first | `AllergenRules` e `CatalogInvariants` (A06), `UnlockCalculator` e `UnlockRules`, `ReminderScheduler` (A07), `PublicationGate`, registro de `OperationApplier`, `SyncService` e `ProcessedOperation` (A08), `SessionService` (rotação e tolerância de 60 s), `FieldCipher`, `RegisterRating` com falsos | Os vetores comuns de alérgenos e de desbloqueio são os testes escritos primeiro. Os falsos de P02 fazem o papel das portas. |
| Teste depois | Telas e fluxos de interface | Testes de componente depois de a feature estar fechada |
| Medição | Abertura offline em 2 s com SQLCipher, tamanho do conjunto baixado, tokens da IA | Medição no dispositivo de referência (hipóteses H), não TDD |
| Contrato | `KimiProvider` e `RecordedProvider` | Mesma suíte de contrato nos dois adaptadores |

Rastreabilidade: cada caso de teste cita o UC, a RN ou o atributo (A##) de origem. Commits em inglês; PRs e issues em português (ADR-015).

## 10. Definition of Done (2.7)

- Cada padrão tem problema, classes e alternativa mais simples: sim (seções 3, 4 e 5).
- Padrões sem motivo removidos: sim (seção 5 e 5.1).
- Mecanismo das fronteiras fechado (pendência do ADR-002): sim (seção 6), com a prova ainda a executar na implementação.

## 11. Pendências

- Lint do OpenAPI e execução da coleção Bruno, antes da 2.8.
- Aplicar a renomeação em `diagrama-classes.md` v1.1, nas quatro sequências, no `openapi.yaml` v1.1 e na coleção Bruno (ADR-015, escopo B).
- Aplicar as notas "Detalhamento (2.7)" no ADR-002 e abrir a issue #31 (Lote 3, Fase 1).
