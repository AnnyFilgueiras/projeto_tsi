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

---

## [22/11/2026] — MVP-04B (#40): API — Catálogo, Curadoria Manual, Fotos WebP, Error Handler 4xx e Seed Inicial

- **Papel da IA:** Engenheiro Backend/Catálogo/TDD e Revisor Independente de Código (Antigravity CLI), aplicando as skills `.agents/skills/solve-issue`, `.agents/skills/tdd`, `.agents/skills/code-comments` e `.agents/skills/code-review` (em subagente independente de leitura sobre o diff completo).
- **Técnicas aplicadas:** validação prévia de pré-requisitos e número de issue antes de criar branch; planejamento somente leitura em `.plans/feat-issue-40-catalog-curation-photos-seed.md` com aprovação explícita; TDD vertical (`RED → GREEN → REFACTOR`) para `PublicationGate` cumulativo (`R02`), `PhotoProcessor` + suíte de contrato compartilhada de `PhotoStorage` (`InMemoryPhotoStorage`, `LocalDiskPhotoStorage` e `SupabasePhotoStorage` via mock de `fetch`) e `setErrorHandler` global para erros 4xx nativos do Fastify (`415`/`413`, `A13`); testes de integração HTTP (`fastify.inject()`) em PostgreSQL 16 (`panelada_test`) cobrindo o fluxo completo da coleção Bruno manual + idempotência `runSeed` 2×; revisão de código independente focada em segurança alimentar (`A06`/`RN22`), concorrência de pool/idempotência e convenção bilíngue (`ADR-015`).
- **Prompts-chave / Contexto da sessão:**
  1. Invocação inicial com `#49` (identificada pela IA como PR #49 já merged, corrigida pela dupla para `/solve-issue #40 --no-cut --no-push`).
  2. Aprovação do plano acompanhada da observação crítica da dupla de que o projeto ainda não tinha padronização explícita dos tipos de entrada (`webp`, `jpeg`, `png`), dimensões máximas e proporção das imagens, incorporada ao `PhotoProcessor` e documentada em `docs/dev/ARCHITECTURE.md`.
  3. Solicitação explícita de atualização do `STATE.md` e do Diário de Bordo com commit local na branch.
- **Insumos usados:** Issue `#40`, `AGENTS.md`, `STATE.md`, `docs/dev/{ARCHITECTURE,GLOSSARY,DATABASE,TESTING}.md`, `docs/fase2/02-adr/adr-012-fotos.md`, `docs/fase2/03-modelagem/{diagrama-classes,framework-gamificacao}.md`, `docs/fase2/04-contratos/{openapi.yaml,bruno/panelada-curadoria/**/*}`, `eslint.config.mjs`, `packages/allergen-rules/src/{types,invariants}.ts` e `.plans/feat-issue-40-catalog-curation-photos-seed.md`.
- **Artefatos produzidos:**
  - **Módulo `catalog` (`S1`, `S4`, `S8`, `P02f`, `P06`, `T01`):** `apps/api/src/modules/catalog/{internal/{schema,repository,photo-storage,routes},public/{index,catalog-read,catalog-write,photo-storage}}.ts` (9 tabelas `catalog_*`, fachadas `CatalogReadPort`/`CatalogWritePort`, adaptadores `LocalDiskPhotoStorage`, `SupabasePhotoStorage` e `InMemoryPhotoStorage`, rotas `GET /v1/photos/{hash}` e `GET /v1/recipes/{dishId}`).
  - **Módulo `importer` (`R02`, `RN17`, `RN18`, `RN21`, `RN22`, `P05`):** `apps/api/src/modules/importer/{internal/{schema,publication-gate,photo-processor,repository,service,routes},public/index}.ts` (2 tabelas `importer_*`, `PublicationGate` cumulativo integrado a `@panelada/allergen-rules/invariants`, `PhotoProcessor` com `@fastify/multipart` + `sharp`, e todas as rotas manuais `/v1/curation/*` protegidas por `curator`).
  - **Módulo `progress` (tabela de badges para o seed `S8`):** `apps/api/src/modules/progress/internal/schema.ts` (`progress_badge_definitions`).
  - **Shared, Composição, Migration e Seed:** `apps/api/src/shared/{canonical-hash,problem}.ts`, `apps/api/src/cross-cutting/sync/internal/canonical-hash.ts`, `apps/api/src/app.ts` (`@fastify/multipart` + `setErrorHandler` 4xx RFC 9457), `apps/api/drizzle/0002_catalog_importer_badges.sql` (+ `meta/`), `apps/api/src/db/{seed,seed-catalog-data}.ts` (10 culinárias nos 5 continentes, 20 pratos verificados com cadeia de evolução de 3 níveis, 7 substituições seguras/inseguras, 11 badges `RN03 a–h` e fotos WebP), `apps/api/package.json` (`@fastify/multipart`, `sharp`), `pnpm-lock.yaml`, `.env.example`, `.gitignore`, `docker-compose.yml` e correção da fixture `docs/fase2/04-contratos/bruno/panelada-curadoria/fixtures/dish-example.jpg`.
  - **Suítes de Teste:** `apps/api/test/unit/{publication-gate,photo-storage,error-handler}.test.ts` (41 testes unitários totais na API) e `apps/api/test/integration/catalog-curation.integration.test.ts` (3/3 suítes de integração, 5/5 testes verdes em `panelada_test`).

### Decisões tomadas
1. **Padronização de imagens do catálogo (`ADR-012`):** definidos tipos de entrada aceitos por *magic bytes* (`image/webp`, `image/jpeg`, `image/png`; outros → `415`), teto de upload de `5 MiB` (`413`), saída sempre normalizada em **`image/webp`** (qualidade `82`, rotação EXIF aplicada e metadados/EXIF removidos), dimensão máxima **`1024 × 1024` px** (`fit: 'inside'`, `withoutEnlargement: true`, preservando a proporção original sem cortes — recomendada `4:3` ou `16:9` na curadoria), hash SHA-256 e `Cache-Control: public, max-age=31536000, immutable`.
2. **Idempotência própria na curadoria (`S2`, `P05`):** mantida a tabela `importer_idempotency_keys` no módulo `importer` com lock transacional `pg_advisory_xact_lock` por `(accountId, idempotencyKey)` e helper puro `src/shared/canonical-hash.ts` (preservando formato `{ type, payload }` retrocompatível com `sync_processed_operations`), evitando importar `cross-cutting/sync`.
3. **Exposição de `GET /v1/recipes/{dishId}` já em `MVP-04B`:** incluída no módulo `catalog` (sem restrições de usuário, apenas pratos `approved`) para validar de ponta a ponta o passo final da coleção Bruno (`05-query/02-published-recipe.bru`) e o isolamento de `CatalogRead`.
4. **Alinhamento ao contrato OpenAPI (`ADR-015`):** mantidos papel `'user' | 'curator'` (em vez de `cook` no texto da issue) e continente `'america'` (em vez de `americas` em trechos de prosa do `framework-gamificacao.md`).

### Artefatos alterados (retroalimentação)
- `docs/dev/ARCHITECTURE.md`: documentada a padronização oficial de tipos, dimensões, teto de tamanho e normalização WebP das fotos do catálogo (`ADR-012`, `MVP-04B`).
- `docs/fase2/04-contratos/bruno/panelada-curadoria/fixtures/dish-example.jpg`: substituída fixture JPEG corrompida da Fase 2.7 (sem marcador SOS) por JPEG válido 64×48 px.
- `.env.example`, `docker-compose.yml` e `.gitignore`: adicionados `PHOTO_STORAGE_DRIVER` / variáveis opcionais do Supabase Storage e `.data/` no `.gitignore` para fallback local no host.
- `STATE.md` e `docs/fase3/diario_de_bordo-fase3.md`: fechamento de `MVP-04B` (#40) e handoff para `MVP-04C` (#41).

### Iterações relevantes (erros e retrabalho da IA)
1. **Colisão de snapshots Drizzle (`0000_snapshot.json` × `0001_snapshot.json`):** `drizzle-kit generate` falhou inicialmente porque `0000_snapshot.json` tinha `id === prevId === 00000000-...`, colidindo com `0001_snapshot.json`; corrigido normalizando `0000_snapshot.json.id` e `0001_snapshot.json.prevId` para `00000000-0000-4000-8000-000000000000` sem alterar nenhuma migration SQL anterior.
2. **Fixture JPEG corrompida no Bruno (`dish-example.jpg`):** o teste TDD do `PhotoProcessor` revelou que a fixture da Fase 2.7 falhava no `libvips`/`sharp` por faltar marcador SOS (`0xFF 0xDA`); a fixture foi regenerada e o teste passou a validar a conversão real JPEG → WebP.
3. **8 achados confirmados capturados pelo `code-review` independente em subagente (todos corrigidos e revalidados):**
   - **`A06`/`RN22` em `registerSubstitution`:** bloqueio explícito (`422`) caso `substituteAllergens` omita qualquer alérgeno já declarado no ingrediente canônico substituto (evitando *fail-open*).
   - **Prevenção de *pool starvation* / deadlock em transações:** `CatalogReadPort` passou a aceitar `tx?: Tx` opcional, repassado por `CurationService` em leituras dentro de `withTransaction`.
   - **Corrida na idempotência concorrente (`P05`):** adicionado `pg_advisory_xact_lock` por `(accountId, idempotencyKey)` antes da checagem/execução para evitar falso `422 business-rule` em índices `UNIQUE`.
   - **Preservação de `allergens_updated_at` em `attachPhoto`:** criado método focado `CatalogWritePort.updatePublishedDishPhoto` em vez de reescrever a receita publicada inteira.
   - **Consistência em `markVerified`:** bloqueio (`422`) quando `confirmedAllergenFree: true` é enviado em receita com alérgenos declarados.
   - **Profundidade total em reparentamento (`RN18`):** `getBaseDishChain` passou a calcular também `descendantDepth` (via `WITH RECURSIVE` em `catalog_dishes`) validando `depthFromRoot + 1 + descendantDepth <= 10`.
   - **Convenção bilíngue (`ADR-015`):** chaves TypeScript de `seed-catalog-data.ts` renomeadas de português para inglês, preservando textos de UI e os 19 códigos ANVISA em PT-BR.
   - **Retrocompatibilidade do hash canônico no `sync`:** restaurado formato `{ type, payload }` em `shared/canonical-hash.ts` para não invalidar hashes existentes em `sync_processed_operations`.

### Divergências registradas (briefing/professor × artefatos)
- Divergências textuais menores (`cook` na issue `#40` vs. `user` no `openapi.yaml`; `americas` em prosa do `framework-gamificacao.md` vs. `america` no `openapi.yaml`) mantidas estritamente alinhadas ao contrato OpenAPI v1.2.0-2.8 (`ADR-015`).

### Riscos aceitos
- Achados fora de escopo/duvidosos registrados no `code-review` para acompanhamento em fatias futuras: (a) `runSeed` grava fotos WebP apenas em disco local (na etapa Cloud 4C `MVP-04G` será necessário sincronizar as fotos do seed com o bucket Supabase); (b) pratos do seed são inseridos direto em `catalog_*` sem criar linhas espelho em `importer_proposals`; (c) `extractValidationErrors` (`MVP-04A`) ainda repassa mensagem padrão do Zod em `invalid_enum_value` (sanitização `A13` em follow-up); (d) validar em `MVP-04G` se a versão alvo do Supabase Storage retorna HTTP `404` (ou `400` legado) e avaliar `AbortSignal.timeout` no `SupabasePhotoStorage`; (e) confirmar build Docker do `sharp` em `node:22-alpine`.
- Caso a dupla deseje formalizar a padronização de fotos também como `## Detalhamento` no `ADR-012`, deve entrar em PR separado de docs conforme `AGENTS.md`.

### Pendências para a próxima sessão
- Enviar `feat/issue-40-catalog-curation-photos-seed` ao remoto, validar `docker compose up -d --build` com `sharp` e integrar PR → `development` (`Closes #40`).
- Iniciar **`MVP-04C` (#41)** via `solve-issue` (sugestões filtradas por restrições/alérgenos, avaliações via sync, `UnlockRules` pura com vetores JSON compartilhados, coleção e badges).


---

## [23/11/2026] — MVP-04C (#41): API — Sugestões Filtradas, Receitas com Substituições, Avaliações, Gamificação 6D/Octalysis e Download-Set

- **Papel da IA:** Engenheiro Backend/Gamificação/TDD e Revisor Independente de Código (Antigravity CLI), aplicando as skills `.agents/skills/solve-issue`, `.agents/skills/tdd`, `.agents/skills/codebase-design`, `.agents/skills/code-comments` e `.agents/skills/code-review` (em subagente independente de leitura sobre o diff completo).
- **Técnicas aplicadas:** planejamento somente leitura em `.plans/feat-issue-41-suggestions-progress-sync.md` com revisão crítica de Clean Code / Deep Modules antes de iniciar código; TDD vertical (`RED → GREEN → REFACTOR`) para endurecimento *fail-closed* de `ProfileService.getActiveRestrictionCodes` (`A06`/D3), função pura `UnlockRules` sobre suíte compartilhada de 13 vetores JSON (`tests/vectors/unlock-vectors.json` cobrindo `RN03 a–h`), `RatingApplier` (`P01`, `T01`) e `SuggestionService` (`S3`, `RN08`, `RN10`, `RN11`, `A13 × A05`); prova prática de fronteiras `eslint-plugin-boundaries` com imports proibidos intencionais revertidos; testes de integração HTTP (`fastify.inject()`) em PostgreSQL 16 (`panelada_test`) + `db:reset` 2×; revisão independente de código focada em determinismo HTTP 304, isolamento multi-tenant, concorrência de transições e segurança de grafos de evolução.
- **Prompts-chave / Contexto da sessão:**
  1. Invocação de `/solve-issue #41 --no-cut --no-push` acompanhada da solicitação de criar um arquivo em `docs/` descrevendo a arquitetura implementada e a responsabilidade de cada arquivo.
  2. Questionamento da dupla sobre aderência do plano aos padrões de Clean Code — levando a 3 refinamentos antes da codificação (eliminação de `service.ts` raso em `progress`, extração DRY de `shared/http-idempotency.ts` preservando `S8` e isolamento de helpers puros de ranking/versão/índice).
  3. Solicitação explícita de atualização de `STATE.md` e Diário de Bordo com commit e `git push` da branch.
- **Insumos usados:** Issue `#41`, `AGENTS.md`, `STATE.md`, `docs/dev/{ARCHITECTURE,GLOSSARY,PRIVACY,DATABASE,TESTING}.md`, `docs/fase1/1.2-analise/regras-de-negocio.md`, `docs/fase2/02-adr/{adr-014,adr-016}.md`, `docs/fase2/03-modelagem/{diagrama-classes,padroes-de-projeto,framework-gamificacao,sequencia-uc10}.md`, `docs/fase2/04-contratos/openapi.yaml`, `eslint.config.mjs` e `.plans/feat-issue-41-suggestions-progress-sync.md`.
- **Artefatos produzidos:**
  - **Vetores compartilhados (`ADR-016`, `A12`):** `tests/vectors/unlock-vectors.json` (13 cenários cobrindo todos os 8 tipos de marco `RN03 a–h`, `RN02`, `RN04`, `RN06`, guarda anti-ciclo e sincronização fora de ordem `A08`, reutilizável pelo `UnlockCalculator` mobile em `MVP-04F`).
  - **Módulo `progress` (`S1`, `S2`, `S8`, `P01`, `P06`, `R03`, `T01`):** `apps/api/src/modules/progress/{public/{index,progress-public},internal/{schema,unlock-rules,repository,rating-applier}}.ts` (`progress_ratings` com PK composta `(user_id, id)`, `progress_evolution_unlocks`, `progress_badge_awards`, `calculateUnlocks` pura com `switch` exaustivo/`assertNever` e `RatingApplier`).
  - **Módulo `routine` — ciclo `Suggestion` (`RN11`, `P05`, `P06`, `S8`):** `apps/api/src/modules/routine/{public/{index,routine-public},internal/{schema,repository,service}}.ts` (`routine_suggestions` com índice único parcial de candidata + `routine_idempotency_keys` + `FOR UPDATE` nas transições `approve`/`discard`).
  - **Cross-cutting `suggestion-search` e `sync` (`S3`, `A05`, `A06`, `A13`):** `apps/api/src/cross-cutting/suggestion-search/{index,internal/{service,routes}}.ts` (`GET /v1/suggestions`, `POST /v1/suggestions/:suggestionId/approve|discard`) e `apps/api/src/cross-cutting/sync/{index,internal/{routes,download-set-builder}}.ts` (`GET /v1/sync/download-set` `200`/`304`).
  - **Endurecimento `profile`, paridade `catalog`, shared e migration:** `apps/api/src/modules/profile/{public/{index,profile-query,restrictions-for-owner-sync},internal/{repository,service}}.ts`, `apps/api/src/modules/catalog/{public/catalog-read,internal/repository}.ts`, `apps/api/src/shared/http-idempotency.ts`, `apps/api/src/app.ts`, `apps/api/drizzle/0003_progress_and_suggestions.sql` (+ `meta/`) e `eslint.config.mjs`.
  - **Contrato OpenAPI e documentação de arquitetura:** `docs/fase2/04-contratos/openapi.yaml`, `apps/api/src/shared/openapi.generated.ts` e `docs/fase3/arquitetura-implementacao-mvp-04c.md`.
  - **Suítes de Teste:** `apps/api/test/unit/{profile-applier,unlock-rules,rating-applier,suggestion-service}.test.ts` (62 testes unitários na API; 153 no monorepo) e `apps/api/test/integration/suggestions-progress-sync.integration.test.ts` (4/4 suítes / 6/6 testes verdes em `panelada_test`).

### Decisões tomadas
1. **Isolamento dedicado de restrições para `DownloadSet` (`A05`, `S3`):** criada a porta estreita `modules/profile/public/restrictions-for-owner-sync.ts` permitida no `eslint.config.mjs` exclusivamente para `cross-cutting/sync` e `app.ts`, mantendo `S3` (`restrictions-for-filter.ts` → apenas `suggestion-search`) intacta e bloqueando acesso por módulos de domínio ou `identity`.
2. **Dono do ciclo `Suggestion` em `modules/routine` (`diagrama-classes.md` §3/§5 + `S2`):** `routine_suggestions` e `routine_idempotency_keys` residem em `modules/routine` atrás de `RoutinePublicPort` para que `suggestion-search` e `sync` (`DownloadSetBuilder`) leiam candidatas sem acoplamento proibido entre componentes transversais, mantendo `/v1/plans` e lista de compras fora de escopo para `MVP-05`.
3. **Refinamentos de Clean Code / Deep Modules:** eliminado `service.ts` pass-through em `modules/progress`; extraído `apps/api/src/shared/http-idempotency.ts` (DRY sem quebrar `S8`); derivação de `sessionKey` por SHA-256 irreversível do token Bearer normalizado sem alterar os claims mínimos do JWT (`ADR-007`).
4. **Sincronização do contrato OpenAPI:** adicionados `X-Allergen-Package-Version` + `minPackageVersion` em `GET /v1/suggestions`, `candidates` em `DownloadSet` e `confirmedAllergenFree` em `Recipe`/`IngredientSubstitution` (garantindo paridade online/offline em `classifyRecipe` e `isSubstituteAllowed` para pratos/substitutos verificados sem alérgenos).

### Artefatos alterados (retroalimentação)
- `docs/fase2/04-contratos/openapi.yaml` e `apps/api/src/shared/openapi.generated.ts`: sincronizados com os requisitos verificados da Issue `#41` e paridade de `confirmedAllergenFree` (`0` erros no `@redocly/cli lint`).
- `eslint.config.mjs`: adicionada fronteira `api-profile-restrictions-owner-sync-port`, validada com prova de falha intencional revertida.
- `docs/fase3/arquitetura-implementacao-mvp-04c.md`: documentação completa da arquitetura da implementação `MVP-04C` e responsabilidade de cada arquivo.
- `STATE.md` e `docs/fase3/diario_de_bordo-fase3.md`: fechamento de `MVP-04C` (#41) e handoff para `MVP-04D` (#42).

### Iterações relevantes (erros e retrabalho da IA)
1. **Regressão capturada em `session-service.test.ts` ao adicionar `issuedAt` em `AuthenticatedPrincipal`:** a tentativa inicial de expor `iat` em `AuthenticatedPrincipal` quebrou asserções de igualdade estrita de `TokenIssuer.verify()` (`ADR-007`); revertida integralmente em favor do hash SHA-256 do token Bearer em `suggestion-search/internal/routes.ts` (zero alterações em `identity` e melhor isolamento de rotação no mesmo segundo).
2. **Assinatura de `hashCanonicalPayload`:** `typecheck` sinalizou chamada com 1 argumento em `http-idempotency.ts` e `download-set-builder.ts`; ajustada para o contrato canônico de 2 argumentos `(type, payload)` preservado da `MVP-04B`.
3. **4 achados confirmados capturados pelo `code-review` independente em subagente (todos corrigidos e revalidados):**
   - **`C1` — Determinismo do hash `304` em `DownloadSet`:** adicionada ordenação canônica por `restrictionType` em `getDecryptedRestrictionsWithConsent` (e `ORDER BY created_at, id` em `listRestrictions`) + desempate `asc(catalogDishes.id)` em `listApprovedDishes`.
   - **`C2` — Colisão cross-tenant de `opId` em `progress_ratings`:** alterada PK de `progress_ratings` para composta `(user_id, id)` + `ON CONFLICT DO NOTHING` em `insertRating` (regeração limpa da migration `0003`) e adicionado teste de integração comprovando envio do mesmo `opId` por duas contas distintas sem HTTP 500.
   - **`C3` — Corrida em `approve`/`discard` e duplicação de candidatas entre sessões:** adicionado `.for('update')` em `findSuggestionByIdForUser(tx)`, verificação de candidata existente por `(userId, dishId)` em `approveSuggestion` e índice único parcial `routine_suggestions_user_dish_candidate_uidx` (`WHERE status = 'candidate'`).
   - **`C4` — Inflação de profundidade em ciclos de `baseDishId` em `UnlockRules`:** `computeDishDepth` passou a retornar `0` ao detectar ciclo (`visited.has(currentId)`) e `VEC-GAM-12` foi endurecido para verificar também `minLevel: 2`.

### Divergências registradas (briefing/professor × artefatos)
- Mantida a convenção `'america'` (singular) de `openapi.yaml` e `catalog_cuisines` em `UnlockRules` e `tests/vectors/unlock-vectors.json` (em vez de `'americas'` em prosa do `framework-gamificacao.md`).

### Riscos aceitos
- Achados fora de escopo registrados no `code-review` para acompanhamento em ondas futuras: (a) cascata de exclusão de conta (`DELETE /v1/account`) na Onda 1B deverá invocar `progressModule.publicPort.deleteData` e `routineModule.publicPort.deleteData` (ambos já implementados e obrigatórios nas portas públicas); (b) `usePantry`, `missingIngredients` e `missingUtensils` permanecem vazios até `MVP-05` (Onda 1B); (c) migração futura do `importer` para o helper `shared/http-idempotency.ts` em PR separado de refactor.

### Pendências para a próxima sessão
- Abrir e integrar PR de `feat/issue-41-suggestions-progress-sync` → `development` (`Closes #41`).
- Iniciar **`MVP-04D` (#42)** via `solve-issue` (fundação do app mobile: SQLCipher, `HttpClient`, auth/sessão anônima e `OperationEnqueuer` Estágio 1).

---

## [23/11/2026] — UX-01 (#60–#68) e UX-02 (#69): Estratégia de UX, Decisões Transversais e Backlog de Protótipo Inicial da Onda 1A

- **Papel da IA:** Product/UX Strategist e Engenheiro de Backlog (Antigravity CLI), aplicando a skill `.agents/skills/github-issue-craft` e o `docs/playbooks/01-sessao-issues-e-diario.md`.
- **Técnicas aplicadas:** análise de escopo técnico vs. visual das issues mobile abertas (`#42`, `#43`, `#44`); mapeamento das 8 telas da Onda 1A sobre o framework híbrido 6D + Octalysis (`framework-gamificacao.md`) e requisitos de segurança alimentar (`A06`) / offline (`ADR-008`); avaliação crítica de boas práticas de engenharia de software sobre reabertura de issues fechadas vs. issues de evolução v2; publicação estruturada com hierarquia nativa de sub-issues e dependências `blocked_by`.
- **Prompts-chave / Contexto da sessão:**
  1. Levantamento pela dupla da ausência de design/Figma e de detalhamento de fluxos de UX (usabilidade prática e *nudges* de gamificação) antes das issues mobile `#42`, `#43` e `#44`, questionando se `#42` também precisaria ser bloqueada e propondo um protótipo inicial simples seguido de refinamento ao fim do MVP.
  2. Discussão sobre subdividir o trabalho pré-`#43`/`#44` em 1 issue pai + 8 sub-issues (1 por tela) e análise de se seria boa prática a issue de encerramento pós-MVP reabrir as issues das telas para aprofundamento ou abrir novas issues referenciando a v1.
  3. Alinhamento da dupla para ignorar o antigo teto de 1,5 mês (focar em executar o quanto antes com qualidade para a apresentação), aprovar o protótipo navegável em HTML/CSS (importável no Figma), criar as issues deixando explícitas as decisões transversais na issue pai sem iniciar implementação, e registrar tudo no Diário de Bordo e `STATE.md` diretamente na `development`.
- **Insumos usados:** Issues `#38`, `#42`, `#43`, `#44`, `STATE.md`, `docs/dev/ARCHITECTURE.md`, `docs/playbooks/01-sessao-issues-e-diario.md`, `docs/fase2/03-modelagem/framework-gamificacao.md` e `docs/fase2/05-fechamento/resumo-fase2-para-fase3.md`.
- **Artefatos produzidos:**
  - **10 GitHub Issues publicadas** no milestone `Fase 3 — MVP (Estágio 1)`:
    - Issue pai **`#60` (`UX-01`)** — UX, decisões transversais e protótipo inicial da Onda 1A (`arquitetura`, `mobile`, `Must`).
    - **8 sub-issues nativas** vinculadas a `#60`: `#61` (`UX-01A` Onboarding), `#62` (`UX-01B` Descobrir), `#63` (`UX-01C` Cozinha), `#64` (`UX-01D` Receita Offline), `#65` (`UX-01E` Avaliação), `#66` (`UX-01F` Feedback Celebratório), `#67` (`UX-01G` Coleção) e `#68` (`UX-01H` Perfil).
    - Issue de refinamento pós-MVP **`#69` (`UX-02`)** — Refinamento visual (*UI polish*) e revisão heurística pós-MVP (`arquitetura`, `mobile`, `Should`).
  - **Relações nativas registradas:** `sub_issues` (`#61`–`#68` → `#60`) e `blocked_by` (`#43` e `#44` bloqueadas por `#60`; `#69` bloqueada por `#60`, `#43` e `#44`; `#42` mantida livre).
  - Atualização de `STATE.md` e desta entrada no `docs/fase3/diario_de_bordo-fase3.md`.

### Decisões tomadas
1. **`#42` (`MVP-04D`) não bloqueada por UX/design:** como ~90% da `#42` é fundação arquitetural de risco alto (SQLCipher, `expo-secure-store`, `HttpClient`, `OperationEnqueuer` Estágio 1, Metro com `@panelada/allergen-rules` e raiz de composição `A8`), ela segue livre usando tokens semânticos provisórios em `src/shared/theme/` e o shell de 4 abas já definido na `#38`.
2. **Fatiamento `UX-01` pai + 8 sub-issues com 6 decisões transversais obrigatórias:** a issue pai `#60` fixa o contrato comum de (1) arquitetura de informação/navegação, (2) design tokens semânticos, (3) tom *White Hat* (`ADR-016`, `RNF09`), (4) hierarquia visual de segurança alimentar (`A06`/`RN16`), (5) padrão de estados e offline no Estágio 1 (`ADR-008`) e (6) usabilidade prática/acessibilidade na cozinha, evitando fragmentação visual entre as 8 telas (`#61`–`#68`).
3. **Novas issues de refinamento (`UX-02` `#69`) em vez de reabrir issues fechadas:** descartada a reabertura de `#60`–`#68` após o MVP por violar a definição de pronto, distorcer milestones e poluir a linha do tempo de PRs/contexto de agentes; a rodada v2 abrirá novas sub-issues referenciando `UX-01A`–`UX-01H` (`Refs #NN`).
4. **Protótipo navegável em HTML/CSS como entregável inicial:** permite validação interativa imediata das 8 telas em proporção mobile no navegador e importação opcional para o Figma (`html.to.design` ou reprodução de frames), fechando `#60`–`#68` sem depender de integração Figma MCP.
5. **Diretriz de ritmo:** o teto anterior de 1,5 mês deixa de ser usado como restrição de planejamento; o foco passa a ser concluir o quanto antes com qualidade para a apresentação.

### Artefatos alterados (retroalimentação)
- `STATE.md`: atualizado com a integração de `MVP-04C` (#41, PR #59) na `development`, inclusão de `UX-01` (`#60`–`#68`) e `UX-02` (`#69`) na Frente D e novo handoff.
- `docs/fase3/diario_de_bordo-fase3.md`: registro consolidado da estratégia e backlog de UX da Onda 1A.

### Iterações relevantes (erros e retrabalho da IA)
1. **Incompatibilidade de `gh issue view` padrão com Projects (classic):** a chamada inicial `gh issue view 42` falhou por tentar consultar o campo depreciado `projectCards`; contorno imediato com `--json number,title,state,labels,body` permitiu leitura limpa de `#38`, `#42`, `#43` e `#44`.
2. **Refinamento da proposta inicial pela dupla:** a proposta inicial da IA era uma única issue `UX-01`; a dupla optou por maior granularidade (1 pai + 8 sub-issues por tela) com destaque explícito das decisões transversais na issue pai para facilitar revisão humana tela a tela.

### Divergências registradas (briefing/professor × artefatos)
- Nenhuma divergência arquitetural; o prazo de 1,5 mês mencionado em artefatos anteriores (`STATE.md`, `resumo-fase2-para-fase3.md`) deixa de ser tratado como restrição operacional ativa por decisão da dupla, priorizando entrega rápida e qualidade para a apresentação.

### Riscos aceitos
- Manter `#42` desbloqueada com tokens semânticos provisórios exige que `#42` nomeie os tokens semanticamente (`surface`, `primary`, `textMuted`, etc.) para que os valores finais de `UX-01` (`#60`) entrem em `src/shared/theme/` sem retrabalho estrutural.

### Pendências para a próxima sessão
- Executar **`MVP-04D` (#42)** via `solve-issue` (desbloqueada) e/ou iniciar o desenho de **`UX-01` (#60–#68)** (decisões transversais + 8 telas + protótipo HTML) para desbloquear `#43` e `#44`.
