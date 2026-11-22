# Diário de Bordo — Fase 3 (Implementação do MVP e Deploy em Cloud Gratuita) — Panelada

> Registro acadêmico consolidado por marco/fatia relevante (`MVP-01`–`MVP-05` e promoções `development` → `main`), conforme `docs/playbooks/01-sessao-issues-e-diario.md` (§4). Único local (junto com `STATE.md`) onde o uso de IA é documentado explicitamente.

---

## [21/11/2026] — MVP-01: Recorte Funcional do Primeiro Deploy (Estágio 1) e Backlog da Fase 3

- **Papel da IA:** Product/Tech Lead e Engenheiro de Backlog (Antigravity CLI), aplicando as skills `.agents/skills/grilling` e `.agents/skills/github-issue-craft`.
- **Técnicas aplicadas:** leitura prévia do repositório para evitar re-perguntar decisões fechadas; entrevista incremental de uma decisão por vez com recomendação justificada (`grilling`); fatiamento por camada e ondas (`Onda 1A` vs. `Onda 1B`); validação de conformidade contra contrato OpenAPI 3.1, regras de negócio (`RN01`–`RN22`) e padrões de projeto (`P01`–`P06`, `T01`, `R02`, `R03`); publicação estruturada com sub-issues nativas, dependências `blocked_by` e auditoria heurística (`audit_issues.py`).
- **Prompts-chave / Contexto da sessão:**
  1. Solicitação da dupla para avançar à Frente D (`MVP-01`).
  2. Rodada de 6 decisões abertas de recorte, navegação, curadoria, baseline técnico e publicação de issues.
  3. Perguntas técnicas da dupla durante a definição do baseline: diferenciação de papéis entre Drizzle ORM (substitui Prisma/ORM) vs. Zod (validação em runtime na borda HTTP), bibliotecas complementares de conformidade (`pino` redact, `node:crypto`, `@fastify/jwt`) e papel do `openapi-typescript` na geração de tipos diretamente do `openapi.yaml`.
- **Insumos usados:** `STATE.md`, `docs/dev/{ARCHITECTURE,GLOSSARY,PRIVACY}.md`, `docs/playbooks/01-sessao-issues-e-diario.md`, `docs/fase1/1.1-elicitacao/backlog.md`, `docs/fase1/1.2-analise/regras-de-negocio.md`, `docs/fase2/02-adr/adr-{004,008,014}-*.md`, `docs/fase2/03-modelagem/padroes-de-projeto.md`, `docs/fase2/04-contratos/openapi.yaml` e `docs/fase2/05-fechamento/resumo-fase2-para-fase3.md`.
- **Artefatos produzidos:**
  - Milestone `Fase 3 — MVP (Estágio 1)` (#4) no GitHub.
  - 11 GitHub Issues publicadas no Project #1 (`TSI`) com nota média `20.0/20` na auditoria (`audit_issues.py`):
    - Fundação e Núcleo Puro: `#36` (`MVP-02`), `#37` (`MVP-03`).
    - Épico Onda 1A (`#38` — `MVP-04`) + 7 sub-issues nativas vinculadas: `#39` (`MVP-04A`), `#40` (`MVP-04B`), `#41` (`MVP-04C`), `#42` (`MVP-04D`), `#43` (`MVP-04E`), `#44` (`MVP-04F`), `#45` (`MVP-04G`).
    - Épico Onda 1B (`#46` — `MVP-05`).
  - Atualização de `STATE.md` e criação deste `docs/fase3/diario_de_bordo-fase3.md`.

### Decisões tomadas
1. **Estágio 1 fatiado em duas ondas (`Onda 1A` + `Onda 1B`):** a Onda 1A (`#38`) coloca o núcleo jogável completo + gamificação 6D/Octalysis (`US01`, `US02`, `US05`, `US09`, `US10`, `US12`, `US14`, `US15`, `US16`, `US18` manual/seed + conta anônima) rodando em Cloud 4C e Emulador Android cedo; a Onda 1B (`#46`) adiciona Rotina (`US06`/`US07`/`US08`), Despensa (`US03`), Busca (`US04`), Utensílios (`US11`), Conta completa (`POST /v1/account/email` e `DELETE /v1/account`) e Curadoria assistida por IA (`US18` Kimi/Recorded).
2. **`Could` fora da Fase 3:** `US13` (pontos) e `US17` (sugerir a amigo) ficam explicitamente fora do escopo da Fase 3, preservando o foco no prazo de 1,5 mês e evitando a *PBL Fallacy* (`ADR-016`).
3. **Arquitetura de navegação e ponte UX na Onda 1A:** Onboarding rápido (conta anônima + aviso LGPD + restrições/preferências opcionais) + 4 abas fixas (`Descobrir`, `Cozinha`, `Coleção`, `Perfil`). Sem `US06` ainda na Onda 1A, a aba `Cozinha` exibe `Candidatas` e `Em preparo (offline)` com ação **"Cozinhar agora"** (baixa receita + foto WebP para o SQLCipher e ativa `LocalCookingState`), encaixando `Plano` e `Compras` sem retrabalho na Onda 1B.
4. **Curadoria na Onda 1A:** seed idempotente (`db:reset` com ~20 pratos verificados cobrindo os 5 continentes + ≥1 cadeia de evolução de 3 níveis + substituições + fotos WebP) + endpoints de curadoria manual (`PublicationGate` + coleção Bruno manual); importação assistida por IA (`RecordedProvider`/`KimiProvider`) entra na Onda 1B.
5. **Baseline técnico fechado para `MVP-02`/`MVP-04`:** Drizzle ORM (`pg` + `drizzle-kit`, mantendo `internal/schema.ts` por módulo para blindar `S8`), Zod (`fastify-type-provider-zod`), `pino` com `redact` (`A13`), `node:crypto` nativo (`AES-256-GCM`), `openapi-typescript` (geração de tipos direto do `openapi.yaml`), Expo Router + `StyleSheet` com tokens, Vitest (API/`allergen-rules`) + Jest/`jest-expo` (Mobile), Render Free Web Service (Docker) + Supabase (PostgreSQL TLS + Object Storage).
6. **Scoping progressivo da Onda 1B (`#46`):** o épico da Onda 1B foi registrado com as 5 fatias planejadas, adiando deliberadamente a quebra em sub-issues executáveis para logo após a conclusão do primeiro deploy (`#38`), evitando especificação prematura.

### Artefatos alterados (retroalimentação)
- `STATE.md`: conclusão de `MVP-01`, vinculação dos números `#36`–`#46` à Frente D e atualização do handoff.
- `docs/fase3/diario_de_bordo-fase3.md`: criado como diário oficial da Fase 3.

### Iterações relevantes (erros e retrabalho da IA)
1. **Conferência de casing das labels no GitHub:** a consulta prévia via `gh label list` revelou que as labels de prioridade no repositório usam inicial maiúscula (`Must`, `Should`) enquanto o Playbook 01 citava minúsculas (`must`, `should`). A checagem evitou falhas de validação na criação das 11 issues.
2. **Alinhamento de `DELETE /v1/account`:** a IA recomendou inicialmente antecipar `DELETE /v1/account` para a Onda 1A; a dupla optou por manter todo o pacote de gestão de conta (e-mail + exclusão) consolidado na Onda 1B junto com `US04` e `US11`, preservando a Onda 1A mais enxuta para o primeiro deploy.
3. **Esclarecimento de stack (Drizzle × Zod × `openapi-typescript`):** a dupla questionou a sobreposição entre Drizzle, Zod e `openapi-typescript`, levando à explicitação das três camadas complementares (persistência/schema modular × validação runtime HTTP × tipos estáticos gerados do `openapi.yaml`) já registradas em `#36` (`MVP-02`).

### Divergências registradas (briefing/professor × artefatos)
- Nenhuma divergência em relação aos ADRs fechados; a escolha do Render Free Web Service para o container da API na Cloud 4C respeita o Detalhamento de 18/11/2026 do `ADR-004` (o antigo descarte do Render na 2.3 referia-se ao Postgres de 30 dias, agora hospedado no Supabase).

### Riscos aceitos
- `DELETE /v1/account` entra na Onda 1B (`#46`) logo após o primeiro deploy da Onda 1A (`#38`), sendo a Onda 1A usada apenas pela dupla em testes internos até o fechamento do Estágio 1.
- *Cold start* do Render gratuito (~50–60 s) mitigado pelo ambiente `docker-compose.yml` local como fallback garantido para demonstrações.

### Pendências para a próxima sessão
- Integrar a branch `docs/mvp-01-scope-and-backlog` em `development` via PR.
- Iniciar **`MVP-02` (#36)** via skill `solve-issue` (esqueleto do monorepo, Docker Compose, Drizzle, Zod, `openapi-typescript`, `eslint-plugin-boundaries` com prova de falha intencional e CI).

---

## [21/11/2026] — MVP-02 (#36): Fundação do Monorepo, Docker Compose, Drizzle, Fronteiras e CI

- **Papel da IA:** Engenheiro de Plataforma/Monorepo e Revisor de Código (Antigravity CLI), aplicando as skills `.agents/skills/solve-issue` (com corte de contexto via `.plans/chore-issue-36-monorepo-foundation.md`) e `.agents/skills/code-review`.
- **Técnicas aplicadas:** planejamento somente leitura com aprovação explícita antes de editar código; separação estrita de fronteiras em tempo de lint (`eslint-plugin-boundaries` + `import-x/no-cycle`) validada por prova obrigatória de falha intencional (`Playbook 03`); geração e checagem de drift de tipos OpenAPI sem sujar o working tree; trava fail-fast de banco de teste (`*_test`); execução em corte de contexto limpo do `code-review` sobre `git diff development...HEAD`.
- **Prompts-chave / Contexto da sessão:**
  1. Execução da issue `#36` (`MVP-02`) via `/solve-issue` com `--no-push`, seguida de aprovação do plano e opção da dupla por manter `pnpm` como `devDependency` local sem instalação global na máquina.
  2. Retomada em contexto limpo (`/solve-issue --resume .plans/chore-issue-36-monorepo-foundation.md`) para rodar o `code-review`, corrigir achados confirmados no escopo, revalidar toda a suíte e atualizar os critérios da issue `#36`.
  3. Solicitação de atualização do `STATE.md` e do Diário de Bordo ao fechar o marco `MVP-02`.
- **Insumos usados:** Issue `#36`, `AGENTS.md`, `STATE.md`, `docs/dev/{ARCHITECTURE,GLOSSARY,PRIVACY}.md`, `docs/playbooks/{01-sessao-issues-e-diario,03-qualidade-fronteiras-e-contratos}.md`, `docs/fase2/04-contratos/openapi.yaml` e `.plans/chore-issue-36-monorepo-foundation.md`.
- **Artefatos produzidos:**
  - **Raiz e CI:** `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.npmrc`, `tsconfig.base.json`, `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `docker-compose.yml`, `.dockerignore`, `.env.example`, `infra/postgres/init/01-create-test-db.sql`, `scripts/check-contracts.mjs`, `.github/workflows/ci.yml`.
  - **`packages/allergen-rules`:** `package.json`, `tsconfig.json`, `vitest.config.ts`, `src/{rules,invariants}.ts` (exports explícitos `./rules` e `./invariants` sem barrel `"."`), `test/rules.test.ts`.
  - **`apps/api`:** `Dockerfile`, `package.json`, `tsconfig*.json`, `vitest*.config.ts`, `drizzle.config.ts`, `drizzle/0000_baseline.sql` (+ `meta/`), `src/{main,app}.ts` (`GET /v1/health` conforme OpenAPI com RFC 9457 no `503`), `src/shared/{tx,operation-applier,openapi.generated}.ts`, `src/support/technical-log/logger.ts` (`pino` redact em 1 e 2 níveis), `src/support/field-encryption/index.ts`, `src/db/{client,test-guard,migrate,seed,reset}.ts`, esqueletos de `modules/{catalog,profile,routine,progress,importer}` e `cross-cutting/{identity,sync,suggestion-search}`, e testes unitários (8) + integração (1 contra `panelada_test` em `UTC`).
  - **`apps/mobile`:** `package.json`, `tsconfig.json`, `app.json`, `babel.config.js`, `metro.config.js` (monorepo `pnpm`), `jest.config.js` (`jest-expo`), `app/{_layout,index}.tsx`, `src/app/composition/index.ts`, `src/core/{local-db/local-database,network/api-client,network/fetch-api-client-adapter,sync/operation-enqueuer}.ts`, `src/features/suggestions/{ui/FoundationScreen,domain/index,data/index}.ts`, `src/shared/index.ts` e `test/foundation.test.tsx`.
  - **Documentação viva:** `docs/dev/DATABASE.md`, `docs/dev/TESTING.md`, atualização de `AGENTS.md`, `docs/dev/ARCHITECTURE.md`, `STATE.md` e este Diário.

### Decisões tomadas
1. **`pnpm` local na raiz sem instalação global:** incluído `"pnpm": "10.11.0"` em `devDependencies` (além de `packageManager`) e `.npmrc` com `node-linker=hoisted` (compatibilidade Metro/Expo) e `manage-package-manager-versions=false` (execução offline via `./node_modules/.bin/pnpm`, mantendo `pnpm` padrão na CI e no Docker).
2. **Override `react-dom: 18.3.1`:** resolvido conflito de dependências hoisted causado por `@redocly/cli` puxando `react-dom@19` junto ao `react@18.3.1` do Expo SDK 52, viabilizando `pnpm contracts:lint` 100% offline.
3. **Portas configuráveis no Docker Compose (`${POSTGRES_PORT:-5432}`, `${API_PORT:-3000}`):** preserva `5432`/`3000` como padrão documental e permite convivência com outros bancos Docker no host sem alterar containers de terceiros.
4. **Migration inicial baseline (`0000_baseline.sql`):** criada migration idempotente (`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`) exercitando o pipeline real do Drizzle (`migrate` + `db:reset`) sem introduzir tabelas de domínio fora do escopo de `MVP-02`.
5. **Convenção verificável para `A8` no mobile:** portas puras (`api-client.ts`, `local-database.ts`, `operation-enqueuer.ts`) separadas de adaptadores concretos (`*-adapter.ts` / `sqlcipher*.ts`), permitindo ao `eslint-plugin-boundaries` restringir instâncias concretas exclusivamente a `src/app/composition/`.
6. **Prettier focado em código/config:** `.prettierignore` exclui markdowns históricos (`docs/`, `*.md`, `.agents/`) para evitar ruído de formatação em PRs de implementação.

### Artefatos alterados (retroalimentação)
- `AGENTS.md`: tabela de comandos atualizada com os scripts reais do monorepo e removida a nota provisória "a ativar em `MVP-02`".
- `docs/dev/ARCHITECTURE.md`: seção de containers atualizada para refletir `docker-compose.yml` e `infra/postgres/init/01-create-test-db.sql`.
- `docs/dev/DATABASE.md` e `docs/dev/TESTING.md`: criados documentando bootstrap sem `pnpm` global, comandos de banco/testes, trava `_test`, prova de fronteiras e jobs da CI.
- `STATE.md` e `docs/fase3/diario_de_bordo-fase3.md`: fechamento do marco `MVP-02` e handoff para `MVP-03`.

### Iterações relevantes (erros e retrabalho da IA)
1. **Conflito de porta `5432` no host:** durante a validação do Docker Compose, a porta `5432` estava ocupada por container Postgres de outro projeto; a IA parametrizou `POSTGRES_PORT` no `docker-compose.yml` e validou o stack isoladamente na porta `5434` (`GET http://localhost:3000/v1/health` retornando `200 OK` e `test:integration` + `db:reset` 2x verdes).
2. **Tipagem Fastify 5 e retorno de `SHOW TIME ZONE`:** anotar explicitamente `: FastifyInstance` em `buildApp` conflitou com o 4º genérico de `loggerInstance: TechnicalLogger` (corrigido mantendo retorno inferido); na integração, `SHOW TIME ZONE` retornou coluna `TimeZone`, trocado para `SELECT current_setting('TIMEZONE') AS tz`.
3. **Achados críticos capturados pelo `code-review` em contexto limpo (pós-corte):**
   - **Sobrescrita silenciosa de regras no ESLint 9 flat config:** dois blocos distintos usando `no-restricted-syntax` faziam o segundo bloco (`expo-notifications`) sobrescrever o primeiro (`expo-secure-store`), deixando `A5` desprotegida na maioria dos arquivos mobile; além disso, o bloco `A6` (`unlock-calculator.ts`/`reminder-scheduler.ts`) sobrescrevia `no-restricted-imports` e descartava `A05`/`A2`/`A7`. Corrigido com 3 conjuntos mutuamente disjuntos para `A5` e composição explícita dos arrays de restrição em `A6`, comprovado em nova prova intencional de falha (4/4 erros capturados).
   - **Endurecimento de fronteira `A8` e resiliência de runtime:** `createApiClient` foi separado da porta `api-client.ts` para `fetch-api-client-adapter.ts` (bloqueado fora de `composition`), adicionado `pool.on('error')` no `pg.Pool` para evitar crash em desconexão ociosa, shutdown idempotente no `main.ts`, redação Pino em 2 níveis (`*.*.<field>`) e `.npmrc` incluído no filtro `root` da CI.

### Divergências registradas (briefing/professor × artefatos)
- Nenhuma divergência arquitetural; todas as fronteiras `S1`–`S8`, `A1`–`A8`, `ADR-002`–`ADR-004`, `ADR-014` e `ADR-015` foram preservadas integralmente.

### Riscos aceitos
- Aviso único do `@redocly/cli` (`no-server-example.com` para `http://localhost:3000` em `openapi.yaml`) segue aceito conforme Fase 2 (0 erros).

### Pendências para a próxima sessão
- Integrar a branch `docs/mvp-02-state-and-log` na `development` e confirmar o 7º critério (CI remoto) na issue `#36` após a execução do workflow `.github/workflows/ci.yml` no PR #48 / `development`.
- Iniciar **`MVP-03` (#37)** via `solve-issue` + `tdd` (`packages/allergen-rules` com 100% dos vetores JSON compartilhados — `A06`, `ADR-014`).

---

## [21/11/2026] — MVP-03 (#37): Pacote Compartilhado `allergen-rules` com TDD Estrito e Vetores JSON

- **Papel da IA:** Engenheiro de Domínio/TDD e Revisor Independente de Código (Antigravity CLI), aplicando as skills `.agents/skills/solve-issue`, `.agents/skills/tdd`, `.agents/skills/code-comments` e `.agents/skills/code-review` (executada em subagente independente de leitura sobre `git diff development...HEAD`).
- **Técnicas aplicadas:** pré-checagem documental com detecção de contradição antes do plano; TDD vertical estrito (`RED → GREEN → REFACTOR`) orientado a tabelas de vetores JSON compartilhados; execução da mesma suíte de vetores em dois runtimes distintos (Node/Vitest e Mobile/Jest); revisão de código independente focada em risco de segurança alimentar (`A06`), privacidade (`A05`/`A13`) e fronteiras (`S6`/`A7`).
- **Prompts-chave / Contexto da sessão:**
  1. Invocação de `/solve-issue --no-push #37`, seguida de limpeza de working tree e 7 branches locais já integradas na `development`.
  2. Pedido da dupla de explicação comparativa das 3 opções de semântica para receitas `source_declared` diante de usuário com restrições, com aprovação explícita da **Opção A (*fail-closed* estrito)** e do plano em `.plans/feat-issue-37-allergen-rules.md` (seguindo sem cortes manuais).
  3. Pergunta conceitual da dupla sobre o papel de `invariants` e dos arquivos `vectors/*.json` com exemplos práticos no Panelada, seguida de instrução para registrar o marco no `STATE.md` e no Diário, fazer push e abrir o PR para `development`.
- **Insumos usados:** Issue `#37`, `AGENTS.md`, `STATE.md`, `docs/dev/{ARCHITECTURE,GLOSSARY,PRIVACY}.md`, `docs/playbooks/{01,02,03}-*.md`, `docs/fase1/1.2-analise/regras-de-negocio.md`, `docs/fase2/02-adr/adr-014-regra-alergenos-compartilhada.md`, `docs/fase2/03-modelagem/{diagrama-classes,sequencia-uc04,sequencia-uc12}.md`, `docs/fase2/04-contratos/openapi.yaml` e `.plans/feat-issue-37-allergen-rules.md`.
- **Artefatos produzidos:**
  - **`packages/allergen-rules`:** `package.json` (`1.0.0`, exports `./rules` e `./invariants`), `src/types.ts` (vocabulário fechado dos 19 códigos ANVISA RDC nº 727/2022 Anexo III + `lactose`, `isAllergenCode`, `AllergenState`, `CompatibilityResult`, `Classification`, tipos de `InvariantViolation`), `src/rules.ts` (`PACKAGE_VERSION`, `classifyRecipe`, `filterCandidates`, `isSubstituteAllowed`), `src/invariants.ts` (`INVARIANTS_PACKAGE_VERSION`, `checkInvariants`), `vectors/allergen-vectors.json` (33 vetores), `vectors/invariant-vectors.json` (16 vetores), `test/rules.test.ts` (38 testes) e `test/invariants.test.ts` (18 testes).
  - **Provas multi-runtime:** `apps/api/test/unit/allergen-rules.test.ts` (resolução de `./rules` e `./invariants` em Node/Vitest) e `apps/mobile/test/allergen-rules.test.ts` (execução de 100% de `allergen-vectors.json` via `@panelada/allergen-rules/rules` no Jest/React Native, preservando `A7`).
  - **Governança e Registro:** atualização dos 5/5 critérios de aceite na issue `#37`, atualização de `STATE.md` e desta entrada no Diário de Bordo.

### Decisões tomadas
1. **Opção A (*fail-closed* estrito) para `source_declared`:** quando o usuário declarou restrições alimentares, receitas e substitutos com `allergenState: 'source_declared'` sem interseção de alérgenos retornam `unconfirmed` (`reasons: ['source_declared_unconfirmed']`), são excluídos de `filterCandidates` e retornam `false` em `isSubstituteAllowed` (alinhado a `PRIVACY.md` §3.3, `RN10` e `sequencia-uc12.md:110`). Quando há interseção explícita com uma restrição, retornam `incompatible` com `matchedAllergens` em ordem canônica.
2. **Versionamento da regra (`PACKAGE_VERSION = '1.0.0'`):** promovido do stub `0.1.0` (`MVP-02`) para `1.0.0` (sincronizado com `package.json`), seguindo `PRIVACY.md` §3.3 e `ADR-014`.
3. **Imports relativos sem extensão `.js` em `packages/allergen-rules/src/`:** mantidos extensionless (compatível com `"moduleResolution": "Bundler"` nos 3 `tsconfig.json`, Vitest, `tsx`, Metro e `jest-expo`), evitando quebra do `moduleNameMapper` do Jest mobile.
4. **Retorno de `targetId` em `InvariantViolation`:** incluído para rastreabilidade de auditoria interna de receita/ingrediente/substituto (`ADR-014` item 7), sem qualquer dado de usuário (`A05`/`A13`).

### Artefatos alterados (retroalimentação)
- `STATE.md`: conclusão de `MVP-03` (#37) na Frente D e handoff para `MVP-04` (#38 / `#39`).
- `docs/fase3/diario_de_bordo-fase3.md`: registro consolidado do marco `MVP-03`.

### Iterações relevantes (erros e retrabalho da IA)
1. **Detecção antecipada de contradição documental (`source_declared`):** na leitura de pré-planejamento, a IA identificou divergência real entre `diagrama-classes.md:94`/`sequencia-uc04.md:57` (`compatible` com aviso) e `PRIVACY.md:40`/`RN10`/`sequencia-uc12.md:110` (bloqueio de `allergenState !== 'verified'`), escalando as 3 opções à dupla antes de escrever qualquer código.
2. **Achados confirmados pelo `code-review` independente em subagente:**
   - `classifyRecipe` propagava `recipe.allergenState` sem normalização quando recebia um estado corrompido em runtime (ex.: cache offline SQLite malformado) e lançava `TypeError` se `restrictions` ou `recipe.allergens` chegassem como `null`/`undefined`. Corrigido com normalização prévia para `'unverified'`, guardas `!Array.isArray(...)` *fail-closed* e simplificação de `isSubstituteAllowed` delegando diretamente a `classifyRecipe`, acompanhados de testes de regressão em TDD (RED → GREEN) e revalidação completa (`format:check`, `typecheck`, `lint`, 100/100 testes verdes no monorepo).

### Divergências registradas (briefing/professor × artefatos)
- **Divergência interna de documentação da Fase 2 sobre `source_declared`:** `docs/fase2/03-modelagem/diagrama-classes.md:94` e `docs/fase2/03-modelagem/sequencia-uc04.md:57` ainda descrevem `source_declared` como `compatible` com aviso, enquanto `docs/dev/PRIVACY.md:40`, `RN10` e `docs/fase2/03-modelagem/sequencia-uc12.md:110` exigem `verified` para usuários com restrições. Resolvida pela dupla em favor da **Opção A (*fail-closed* estrito)**; a retroalimentação documental na Fase 2 (`diagrama-classes.md`, `sequencia-uc04.md` e `Detalhamento` no `ADR-014`) fica registrada como pendência de PR separado de docs (`AGENTS.md` e `Playbook 02` §2 Caso A).

### Riscos aceitos
- `InvariantViolation` inclui `targetId?: string` para auditoria interna, enquanto `PublicationGateProblem.violations[]` em `openapi.yaml` define `additionalProperties: false`: ao ligar `checkInvariants` nas rotas HTTP de curadoria (`MVP-04B`/`MVP-04C`), a API deve projetar apenas `{ code, field, message }` na resposta 422.
- Pontos de design classificados como duvidosos no `code-review` (precedência entre `invalid_allergen_code` e `allergen_match` em entradas mistas corrompidas; eventual re-export de `isAllergenState` em `./rules`; vetor extra explícito de `confirmedAllergenFree: true` em receitas não verificadas) permanecem documentados para ajuste futuro se necessário.

### Pendências para a próxima sessão
- **Retroalimentação documental (PR separado de docs na `development`):** alinhar `docs/fase2/03-modelagem/diagrama-classes.md:94`, `docs/fase2/03-modelagem/sequencia-uc04.md:57` e adicionar seção `## Detalhamento (MVP-03 — 21/11/2026)` em `docs/fase2/02-adr/adr-014-regra-alergenos-compartilhada.md` consolidando a Opção A (*fail-closed* estrito para `source_declared`).
- Iniciar **`MVP-04` (#38 — Épico Onda 1A)** pela sub-issue **`#39` (`MVP-04A`)** via `solve-issue`.


---

## [21/11/2026] — MVP-04A (#39): API — Conta Anônima, FieldCipher AES-256-GCM, Perfil Cifrado e Base de Sync Idempotente

- **Papel da IA:** Engenheiro Backend/Segurança/TDD e Revisor Independente de Código (Antigravity CLI), aplicando as skills `.agents/skills/solve-issue`, `.agents/skills/tdd`, `.agents/skills/code-comments` e `.agents/skills/code-review` (em subagente independente de leitura).
- **Técnicas aplicadas:** conferência prévia entre issue e artefatos aprovados da Fase 2 antes do código (alinhamento de `role` `user | curator`, semântica de lote em `POST /v1/sync/operations` e estratégia de Argon2id compatível com `node:22-alpine`); TDD vertical estrito (`RED → GREEN → REFACTOR`) para `FieldCipher`/`KeyProvider`, `SessionService`/`AccountService`/`Hs256TokenIssuer`, `SyncService`/`OperationApplierRegistry` e `ProfileApplier`/`ProfileService`; testes de integração HTTP (`fastify.inject()`) contra PostgreSQL 16 real (`panelada_test`) com inspeção SQL de ausência de texto claro (`A05`), exclusão física (`RN09`) e prova de redação de logs (`A13`); revisão independente focada em concorrência, segurança e fronteiras modulares (`S1`–`S8`).
- **Prompts-chave / Contexto da sessão:**
  1. Invocação de `/solve-issue --no-push #39`, com apresentação do plano somente leitura em `.plans/feat-issue-39-identity-field-cipher-profile.md` e 3 pontos de alinhamento.
  2. Questionamentos técnicos da dupla sobre (a) por que `POST /v1/sync/operations` retorna HTTP `200` com `error.status: 422` (`key-reused`) por item em vez de HTTP `422` no lote inteiro (`ADR-008` item 10 — falha parcial sem bloquear a fila) e (b) impacto do `node:22-alpine` na escolha de `@noble/hashes` (Argon2id pure JS) vs. alternativas nativas e eventual issue futura de baixa prioridade para migrar para `node:24-alpine` + `node:crypto.argon2`.
  3. Aprovação do plano com `--no-cut`, execução completa com `code-review` independente, pedido de explicação abstrata e classificação de gravidade (baixa/média/alta) dos achados duvidosos/fora de escopo, além de atualização de `STATE.md`, Diário de Bordo, commit e push.
- **Insumos usados:** Issue `#39`, `AGENTS.md`, `STATE.md`, `docs/dev/{ARCHITECTURE,GLOSSARY,PRIVACY,DATABASE,TESTING}.md`, `docs/playbooks/03-qualidade-fronteiras-e-contratos.md`, `docs/fase1/1.2-analise/regras-de-negocio.md` (`RN09`), `docs/fase2/02-adr/adr-{006,007,008}-*.md`, `docs/fase2/03-modelagem/{diagrama-classes,padroes-de-projeto,sequencia-uc08}.md`, `docs/fase2/04-contratos/{openapi.yaml,glossario-identificadores.md,bruno/panelada-curadoria/00-session/*}` e `.plans/feat-issue-39-identity-field-cipher-profile.md`.
- **Artefatos produzidos:**
  - **Shared & Logs (`A13`, `S2`, `ADR-007`):** `apps/api/src/shared/{auth,password-hash,problem,operation-applier}.ts` e ampliação de `REDACTED_LOG_PATHS` em `apps/api/src/support/technical-log/logger.ts`.
  - **Criptografia (`ADR-006`, `A05`, `S5`, `P02c`):** `apps/api/src/support/field-encryption/{index,key-provider,aes-gcm-field-cipher}.ts`.
  - **Identidade (`ADR-007`, `ADR-008`, `T01`):** `apps/api/src/cross-cutting/identity/{index,internal/{schema,token-issuer,repository,session-service,account-service,rate-limiter,auth-guard,routes}}.ts`.
  - **Perfil Cifrado (`RN09`, `A05`, `S1`/`S3`/`S5`/`S8`, `P06`):** `apps/api/src/modules/profile/{public/{index,profile-lifecycle,profile-query,restrictions-for-filter},internal/{schema,repository,service,applier,routes}}.ts`.
  - **Sync Idempotente (`ADR-008`, `P01`, `P05`):** `apps/api/src/cross-cutting/sync/{index,internal/{schema,canonical-hash,applier-registry,repository,sync-service,routes}}.ts`.
  - **Composição, Banco e Ambiente:** `apps/api/src/{app,main}.ts`, `apps/api/drizzle/0001_identity_profile_sync.sql` (+ `meta/`), `apps/api/src/db/seed.ts` (19 `profile_restriction_types` + conta curadora), `apps/api/package.json` (`@noble/hashes`), `pnpm-lock.yaml`, `.env.example`, `docker-compose.yml`, `docs/dev/ARCHITECTURE.md`.
  - **Suítes de Teste:** `apps/api/test/unit/{field-cipher,session-service,sync-service,profile-applier,logger}.test.ts` (24 testes unitários na API) e `apps/api/test/integration/identity-profile-sync.integration.test.ts` (3 testes de integração contra `panelada_test`).

### Decisões tomadas
1. **Precedência do contrato aprovado sobre texto da issue (`ADR-015`):** adotado `role: 'user' | 'curator'` (no lugar de `cook | curator`) e resposta HTTP `200` por lote em `POST /v1/sync/operations` com `results[i].error = { type: 'key-reused', status: 422 }` (em vez de HTTP `422` global / `chave-reutilizada`), preservando falha parcial sem bloquear a fila (`ADR-008` item 10).
2. **Argon2id portável em formato PHC (`@noble/hashes/argon2.js` — `argon2idAsync`):** implementa parâmetros OWASP (`19 MiB`, `t=2`, `p=1`) sem binário C++ em `node:22-alpine` e isolado em `src/shared/password-hash.ts` para permitir troca transparente futura por `node:crypto.argon2` nativo (quando o projeto migrar para `node:24-alpine`).
3. **JWT HS256 atrás de `TokenIssuer`:** implementado via `node:crypto` (`createHmac` + `timingSafeEqual`, claims estritamente `sub`, `role`, `iat`, `exp`, 45 min), sem dependência adicional e 100% testável com `clock` injetável.
4. **Desacoplamento de guarda JWT (`S2`):** interface `AuthGuard` colocada em `src/shared/auth.ts` e injetada via `src/app.ts` em `modules/profile` e `cross-cutting/sync`, mantendo 0 violações no `eslint-plugin-boundaries` sem alterar `eslint.config.mjs`.
5. **Unicidade e exclusão física sem texto claro nem blind-index (`A05`, `RN09`):** `ProfileService` serializa escritas do usuário via `SELECT ... FOR UPDATE` em `profile_users`, decifra as ≤ 19 linhas da conta em memória e realiza upsert com novo IV (`register`) ou `DELETE` físico (`revoke`).

### Artefatos alterados (retroalimentação)
- `docs/dev/ARCHITECTURE.md`: registrada `apps/api/src/modules/profile/` como primeira fatia vertical de referência na API (`MVP-04A`).
- `.env.example` e `docker-compose.yml`: adicionados defaults apenas de desenvolvimento para `JWT_SECRET`, `FIELD_ENCRYPTION_KEY`, `CURATOR_EMAIL` e `CURATOR_PASSWORD`.
- `STATE.md` e `docs/fase3/diario_de_bordo-fase3.md`: fechamento de `MVP-04A` (#39) e handoff para `MVP-04B` (#40).

### Iterações relevantes (erros e retrabalho da IA)
1. **Genérico de logger no Fastify 5 (`tsc`):** `Fastify({ loggerInstance: logger })` inferia `TechnicalLogger` incompatível com `FastifyInstance` padrão nos plugins `registerRoutes`; corrigido parametrizando `Fastify<RawServerDefault, RawRequestDefaultExpression, RawReplyDefaultExpression, FastifyBaseLogger>`.
2. **Achados críticos capturados pelo `code-review` independente em subagente (todos corrigidos e revalidados com testes de regressão):**
   - **Concorrência na janela de 60 s do `SessionService.refresh`:** `graceCache.set` rodava após o `COMMIT` e `now` era capturado antes do `FOR UPDATE`, podendo causar revogação indevida da família sob duas requisições simultâneas; corrigido movendo `now` para após o lock e populando `graceCache` antes do `COMMIT` (com limpeza em `catch`).
   - **Corrida `PG 23505` em `SyncService.processSingle`:** dois reenvios concorrentes de um mesmo `(accountId, opId)` inédito colidiam na PK e devolviam 500; corrigido capturando `23505` fora da transação abortada para resolver idempotência (`repeated: true` ou `422 key-reused`).
   - **Isolamento de erro por item no lote sync:** `ProblemError(404)` em `ProfileService.registerRestriction` escapava de `ProfileApplier` e derrubava o lote inteiro; corrigido convertendo para `{ status: 'rejected', error }`.
   - **Base64/Base64URL estrito (`A05`), rate limiter limitado e `JWT_SECRET` fail-fast:** adicionada validação estrita contra caracteres inválidos silenciosamente descartados por `Buffer.from(..., 'base64')`, teto de buckets + limite por IP em `sign-in`, e rejeição imediata de `JWT_SECRET` explícito curto ou fallback fora de `development`/`test`.

### Divergências registradas (briefing/professor × artefatos)
- Pequenas divergências textuais no corpo da issue `#39` (`cook` vs `user`, `chave-reutilizada` vs `key-reused`) resolvidas em favor do contrato OpenAPI v1.2.0-2.8 e `ADR-015`.

### Riscos aceitos
- Pontos classificados como duvidosos/baixa-média gravidade no `code-review` (índice/leitura de `sync_processed_operations.expires_at` após 90 dias; limite de tamanho do `graceCache` em memória ociosa; comportamento de código decifrado desconhecido em `getActiveRestrictionCodes` a endurecer ao ligar `MVP-04C`; mapeamento 4xx nativo do Fastify como `415`; e futura migração `node:22-alpine` → `node:24-alpine` com `node:crypto.argon2` nativo) permanecem documentados para acompanhamento nas próximas fatias.

### Pendências para a próxima sessão
- Integrar a branch `feat/issue-39-identity-field-cipher-profile` em `development` via PR (`Closes #39`).
- Iniciar **`MVP-04B` (#40)** via `solve-issue` (módulos `catalog` + `importer`, `PublicationGate`, `PhotoStorage` e seed dos ~20 pratos verificados).
