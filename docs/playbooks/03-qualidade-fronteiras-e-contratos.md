# Playbook 03 — Qualidade, Fronteiras Modulares, Contratos e TDD

> **Quando usar:** Ao validar artefatos técnicos da Fase 2 (OpenAPI, Bruno, Classes) e durante toda a implementação de código do monorepo (`packages/allergen-rules`, `apps/api`, `apps/mobile`).

---

## 1. Fiscalização de Fronteiras Modulares (`eslint-plugin-boundaries`)

O estilo Monólito Modular no servidor ([ADR-002](../fase2/02-adr/adr-002-estilo-servidor-monolito-modular.md)) e a organização *Feature-First* no app são garantidos por regras automáticas de lint documentadas na Seção 6 de [`../fase2/padroes-de-projeto.md`](../fase2/03-modelagem/padroes-de-projeto.md).

### Regras Críticas do Servidor (`apps/api` — `S1` a `S8`)
- **`S1`:** Nenhum módulo importa `internal/` de outro módulo; apenas `public/`.
- **`S2`:** Módulos de domínio (`catalog`, `profile`, `routine`, `progress`, `importer`) nunca importam componentes transversais (`identity`, `sync`, `suggestion-search`). `catalog`, `profile` e `routine` não importam outros módulos de domínio; `progress` e `importer` importam apenas `catalog/public`.
- **`S3` (Segurança LGPD — `A05`):** Somente `cross-cutting/suggestion-search` pode importar `modules/profile/public/restrictions-for-filter`.
- **`S4`:** Somente `modules/importer` pode importar `modules/catalog/public/catalog-write`.
- **`S5`:** Somente `modules/profile` pode importar `support/field-encryption`.
- **`S6`:** `packages/allergen-rules` é 100% puro (zero dependências do servidor ou módulos nativos do Node). O ponto de entrada `invariants` só é importado no servidor.
- **`S7`:** Zero ciclos de importação (`import/no-cycle`).
- **`S8`:** Esquemas de tabela ficam privados dentro de `internal/` de cada módulo dono. Transações que cruzam módulos passam obrigatoriamente o contexto opaco `tx: Tx` (`src/shared/`).

### Regras Críticas do App (`apps/mobile` — `A1` a `A8`)
- **`A1`:** Uma feature nunca importa outra feature.
- **`A2` e `A3`:** Somente o adaptador `SqlCipherDatabase` importa o driver nativo do banco, e somente a camada `data/` (repositórios) de cada feature importa a porta `LocalDatabase`.
- **`A4`:** Features importam apenas a porta `OperationEnqueuer` (nunca `PendingOperations` nem `Synchronizer`).
- **`A5`:** Somente `network` e `local-db` importam `expo-secure-store`; somente o adaptador de lembretes importa `expo-notifications`.
- **`A6`:** `UnlockCalculator` e `ReminderScheduler` são funções puras (zero imports de React Native ou núcleo).
- **`A7`:** O app importa apenas o ponto de entrada `rules` de `packages/allergen-rules`.
- **`A8`:** A raiz de composição (`src/app/composition`) é o único ponto que instancia adaptadores concretos e os injeta nas features (sem padrão Singleton global).

> **Prova Obrigatória de Configuração:** Ao configurar ou alterar o ESLint no monorepo, crie intencionalmente um import proibido (ex.: `routine` importando `catalog/internal`), confirme que `npm run lint` falha, e reverta o import de teste.

---

## 2. Estratégia Incremental do MVP (2 Estágios) e Portas Plugáveis

Conforme detalhado no [ADR-008](../fase2/02-adr/adr-008-estrategia-offline-e-sincronizacao.md), no [ADR-004](../fase2/02-adr/adr-004-demonstracao-docker-e-alvo.md) e em [`../fase2/padroes-de-projeto.md`](../fase2/03-modelagem/padroes-de-projeto.md):

1. **Nunca pule as Portas nos Casos de Uso:**
   - No App, casos de uso que alteram estado (`RegisterRating`, `Routine`, `Profile`) chamam sempre a interface `OperationEnqueuer` (`P04`).
   - No **Estágio 1 do MVP (Primeiro Deploy)**, a raiz de composição (`src/app/composition`) injeta `DirectOnlineOperationEnqueuer` (que exige rede, envia direto à API com `Idempotency-Key` e atualiza o `SqlCipherDatabase` local), enquanto a leitura das receitas planejadas/em preparo já funciona 100% offline a partir do `SqlCipherDatabase`.
   - No **Estágio 2 do MVP (Offline Completo)**, a raiz de composição injeta `OutboxOperationEnqueuer` + `Synchronizer`, ativando a fila persistente sem modificar nenhum caso de uso ou tela.
2. **Paridade Local vs. Cloud Gratuita (`PhotoStorage` — `P02f`):**
   - A API nunca acessa o sistema de arquivos diretamente nos serviços de domínio de fotos; ela usa a porta `PhotoStorage`.
   - No Docker Compose local, injeta-se `LocalDiskPhotoStorage` (volume local).
   - No deploy em Cloud Gratuita (Supabase PostgreSQL + Supabase Storage + PaaS container), injeta-se `SupabasePhotoStorage`.
   - **Atenção LGPD (`A05`):** O Supabase é utilizado estritamente como banco PostgreSQL e bucket de imagens por trás da API Fastify. As colunas de restrição alimentar no PostgreSQL do Supabase jamais recebem texto claro — passam sempre pelo componente `FieldCipher` (`AES-256-GCM`) dentro da API antes de qualquer `INSERT`/`UPDATE`.

---

## 3. Contratos de API (`openapi.yaml`) e Coleção Bruno

- **Fonte da Verdade:** [`../fase2/04-contratos/openapi.yaml`](../fase2/04-contratos/openapi.yaml) (OpenAPI 3.1, identificadores e rotas em inglês conforme [ADR-015](../fase2/02-adr/adr-015-idioma-dos-identificadores.md)).
- **Validação de Lint do Contrato:**
  - Sempre que editar `docs/fase2/04-contratos/openapi.yaml`, valide a sintaxe YAML/OpenAPI (ex.: via `npx @redocly/cli lint docs/fase2/04-contratos/openapi.yaml` ou script Python/Node de verificação de `$ref`).
- **Sincronia com o Bruno:**
  - Qualquer alteração nas rotas de curadoria/importação (`/v1/curation/...`) ou autenticação (`/v1/sessions/...`) em `openapi.yaml` deve ser refletida imediatamente na coleção [`../fase2/04-contratos/bruno/panelada-curadoria/`](../fase2/04-contratos/bruno/panelada-curadoria/).

---

## 4. Matriz de Testes e TDD

Siga a política de testes aprovada na Seção 9 de [`../fase2/padroes-de-projeto.md`](../fase2/03-modelagem/padroes-de-projeto.md):

| Prática | Componentes Alvo | Regra de Execução |
|---|---|---|
| **Test-First (TDD Estrito)** | `AllergenRules` e `CatalogInvariants` (`A06`), `UnlockCalculator` e `UnlockRules` (`RN03`/`RN04`), `ReminderScheduler` (`A07`), `PublicationGate` (`A09`), registro de `OperationApplier`, `SyncService` + `ProcessedOperation` (`A08`), `SessionService`, `FieldCipher` (`A05`), `RegisterRating` | Escrever o teste (e os vetores JSON compartilhados) primeiro, vê-lo falhar (RED), implementar o código mínimo (GREEN) e refatorar. Cada teste deve citar no `describe`/`it` o ID do `UC`, `RN` ou atributo `A##`. |
| **Teste de Contrato** | `KimiProvider` e `RecordedProvider` (`P02b`) | Ambos os adaptadores devem passar exatamente na mesma suíte de validação de esquema JSON. |
| **Teste Depois** | Telas React Native e fluxos visuais | Testes de componente após o fechamento do layout da feature. |
| **Medição Empírica (`H`)** | Abertura offline em $\le 2\text{ s}$ com SQLCipher (`A04`), tamanho do conjunto baixado e consumo de tokens da IA (`ADR-011`) | Medir no emulador de referência (Android, 4 GB RAM) ou script de benchmark e registrar no Diário de Bordo. |
