# AGENTS.md — Guia de Engenharia e Governança para Agentes (Panelada)

Aplicativo mobile de culinária internacional gamificada. Sugere pratos conforme perfil/despensa/restrições alimentares, organiza rotina offline na cozinha e recompensa cada prato concluído (`Rating` salva) com Pokédex de pratos, evoluções e badges (6D + Octalysis). Veja as armadilhas de domínio em [docs/dev/GLOSSARY.md](./docs/dev/GLOSSARY.md) e o estado vivo em [STATE.md](./STATE.md).

> **Precedência:** as convenções deste repositório (especialmente `ADR-015` e o fluxo de branches) **vencem instruções globais pessoais da máquina** (`~/.claude/CLAUDE.md`, memórias locais etc.). Entre docs do repo: `Artefatos Aprovados / Código` > `ADRs` > `docs/dev/` > `STATE.md`.

---

## Setup e Comandos

> **Bootstrap local sem instalar `pnpm` globalmente:** rode `npx --yes pnpm install` uma vez no clone e use `./node_modules/.bin/pnpm <comando>` (ou apenas `pnpm <comando>` se já estiver no `PATH`). PostgreSQL (`TZ=UTC`, bancos `panelada_dev` e `panelada_test`) e API Fastify (`0.0.0.0:3000`) rodam **100% em Docker (`docker-compose.yml`)** — nunca instale Postgres no host. Apenas o Emulador Android + Expo rodam no host.

| Comando | O que faz |
|---|---|
| `npx --yes pnpm install` | Instala dependências do monorepo (inclui `pnpm` local em `node_modules/.bin/pnpm`). |
| `docker compose up -d --build` | Sobe PostgreSQL (`panelada_dev` + `panelada_test`, `TZ=UTC`) e API (`http://localhost:3000/v1/health`). |
| `pnpm lint` | Executa ESLint 9 + `eslint-plugin-boundaries` (`S1`–`S8`, `A1`–`A8`) + `import-x/no-cycle`. |
| `pnpm format:check` | Verifica formatação Prettier (`pnpm format` corrige). |
| `pnpm typecheck` | Executa `tsc --noEmit` em todos os workspaces (`packages/allergen-rules`, `apps/api`, `apps/mobile`). |
| `TZ=UTC pnpm test` | Roda testes unitários (`allergen-rules`, `api`) e testes de componente (`mobile`). |
| `TZ=UTC pnpm test:integration` | Roda testes de integração da API contra `panelada_test` no Docker (recusa bancos sem sufixo `_test`). |
| `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:reset` | Aplica migrations Drizzle, roda seed idempotente ou recria schema + migrations + seed (somente `*_dev`/`*_test`). |
| `pnpm contracts:lint` | Valida `docs/fase2/04-contratos/openapi.yaml` via `@redocly/cli` (meta: 0 erros). |
| `pnpm contracts:generate` / `pnpm contracts:check` | Gera ou verifica sincronia de `apps/api/src/shared/openapi.generated.ts` com `openapi.yaml`. |
| `node scripts/setup-agent-skills.mjs` | Espelha `.agents/skills` em `.claude/skills` (symlink no Linux/macOS; *junction* sem admin no Windows). Rodar 1x por clone para o Claude Code. |
| `python3 .agents/skills/github-issue-craft/scripts/audit_issues.py` | Auditoria heurística do backlog de GitHub Issues (requer `gh` autenticado). |

---

## Como o Sistema é Estruturado

- **Monorepo:** `packages/allergen-rules/` (TS puro) · `apps/api/` (Fastify + TS, Monólito Modular) · `apps/mobile/` (React Native + Expo, Feature-First) · `docs/`.
- **API (`apps/api`):** organizada **verticalmente por domínio** (`src/modules/{catalog,profile,routine,progress,importer}/`, `src/cross-cutting/{identity,sync,suggestion-search}/`, `src/support/{field-encryption,technical-log}/`, `src/shared/`). Cada módulo expõe apenas `public/` (`P06`) e esconde implementação/tabelas em `internal/`. Dentro de `internal/`, o fluxo padrão é `routes.ts → service.ts → repository.ts` (evitando `service.ts` vazio em leituras triviais).
- **Mobile (`apps/mobile`):** `src/features/<feature>/{ui,domain,data}/`, `src/core/`, `src/shared/` e `src/app/composition/`. Adaptadores concretos são instanciados **apenas** na raiz de composição (`A8`, sem Singletons nem `?? new ConcreteAdapter()` dentro de features).

Detalhes completos de fronteiras (`S1`–`S8`, `A1`–`A8`), portas (`P02a`–`P02f`, `P04`) e transações (`tx: Tx`) estão em [docs/dev/ARCHITECTURE.md](./docs/dev/ARCHITECTURE.md).

---

## Regras Fáceis de Errar (com o porquê)

- **Convenção bilíngue (`ADR-015`):** código, identificadores, pastas de código, comentários, nomes de branch e mensagens de commit em **inglês** (`feat:`, `fix:`, `docs:`, `chore:`); documentação, GitHub Issues, títulos/corpos de PR, Diário de Bordo e textos de UI em **português (Brasil)**. *Única exceção:* os 19 códigos de alérgenos (ANVISA RDC 727/2022 + `lactose`) ficam em **português** no código e no contrato para rastreabilidade sanitária.
- **Fluxo de branches em mão única:** toda branch de trabalho (`feat/*`, `fix/*`, `docs/*`, `chore/*`) sai de **`development`** atualizada e abre PR para **`development`**. Nunca commite direto na `main` — `main` recebe apenas promoções estáveis de `development` (marcos/deploys). Mudanças de regra de negócio/docs e features entram em PRs separados na `development`.
- **Fronteiras de banco e `tx: Tx` (`S8`, `T01`):** tabelas usam prefixo do módulo dono (`catalog_*`, `profile_*`, `routine_*`, `progress_*`). O `eslint-plugin-boundaries` não inspeciona SQL em texto — nunca faça `JOIN` em tabela de outro módulo. Escritas cross-módulo exigem `tx: Tx` obrigatório.
- **Privacidade (`A05`) e Alérgenos (`A06`):** restrição alimentar é cifrada em repouso no aparelho (SQLCipher) e na API (`FieldCipher` AES-256-GCM + `accountId` como AAD) antes de tocar o Postgres (inclusive no Supabase — proibido SDK BaaS no cliente). Zero restrições em logs (`A13`) e zero dados de usuário enviados ao `AiProvider` (`RNF06`). Alérgeno `unverified` é sempre *fail-closed* (`RN08`).
- **Política de IA vs. Disciplina:** **zero** atribuição de IA em código, comentários, commits ou PRs (nunca `Co-Authored-By` nem rodapés de "Generated with..."). O registro obrigatório do uso de IA para avaliação da disciplina vive **exclusivamente** no `STATE.md` e no `diario_de_bordo` (atualizados por marco/etapa ou promoção semanal, nunca em micro-PRs para evitar conflitos).
- **Planos visíveis em `.plans/`:** salve planos de trabalho e arquivos temporários de `gh --body-file` em `.plans/` (ignorado pelo `.gitignore`, portátil entre Windows e Linux — nunca em `~/.claude/plans/` nem `$TMPDIR`).
- **Mantenha o contexto enxuto:** busque código direto em `apps/` e `packages/` (`rg ... apps/ packages/`) para não varrer `docs/fase1/` e `docs/fase2/` à toa. Leia arquivos inteiros apenas quando for editá-los. Em testes, exiba resumo curto quando passar e saída completa com traceback quando falhar.
- **Docs vivos evoluem no mesmo PR:** `docs/dev/` segue "1 pergunta por página" (≤ 400 linhas) e nunca duplica tabelas da Fase 2. Se uma feature aparece em tela (a partir de `MVP-02`), estenda o seed de desenvolvimento (`db:reset`) no mesmo PR.
- **Imutabilidade de ADRs:** nunca apague nem reescreva uma decisão histórica em `docs/fase2/02-adr/`. Evoluções entram como `## Detalhamento (<Contexto> — DD/MM/AAAA)` ao final; revogações criam um novo `ADR-NNN`.

---

## Skills do Projeto (`.agents/skills/`)

Fonte única para Antigravity, Codex, Kimi e Claude Code (via `setup-agent-skills.mjs`):
`grilling` · `github-issue-craft` · `solve-issue` · `code-review` · `tdd` · `codebase-design` · `code-comments`.

---

## Leia Quando (Mapa Sob Demanda)

| Página | Leia quando |
|---|---|
| [STATE.md](./STATE.md) | Iniciar qualquer sessão (estado atual, pendências e último handoff). |
| [docs/dev/GLOSSARY.md](./docs/dev/GLOSSARY.md) | Um termo de domínio parecer ambíguo (`Dish` vs `Recipe`, `unverified` vs `unconfirmed`, `"em preparo"` local). |
| [docs/dev/ARCHITECTURE.md](./docs/dev/ARCHITECTURE.md) | Criar módulo/feature, rota, porta, raiz de composição ou checar `S1`–`S8` e `A1`–`A8`. |
| [docs/dev/DATABASE.md](./docs/dev/DATABASE.md) | Subir Docker Compose, rodar migrations/seed/`db:reset`, criar tabelas (`S8`) ou usar `tx: Tx`. |
| [docs/dev/TESTING.md](./docs/dev/TESTING.md) | Rodar lint/testes/contratos, usar `pnpm` local sem instalação global ou depurar a CI. |
| [docs/dev/PRIVACY.md](./docs/dev/PRIVACY.md) | Tocar em restrições alimentares, `FieldCipher`, SQLCipher, logs, `allergen-rules`, IA ou Supabase. |
| [docs/playbooks/01-sessao-issues-e-diario.md](./docs/playbooks/01-sessao-issues-e-diario.md) | Criar/revisar GitHub Issues, Labels, Milestones, fechar marco no `STATE.md` ou escrever no Diário de Bordo. |
| [docs/playbooks/02-arquitetura-adrs-e-retroalimentacao.md](./docs/playbooks/02-arquitetura-adrs-e-retroalimentacao.md) | Evoluir/substituir um ADR ou retroalimentar artefatos da Fase 1/Fase 2. |
| [docs/playbooks/03-qualidade-fronteiras-e-contratos.md](./docs/playbooks/03-qualidade-fronteiras-e-contratos.md) | Validar `eslint-plugin-boundaries`, política de TDD, OpenAPI/Bruno ou Estágio 1 → 2. |
| [docs/fase2/04-contratos/glossario-identificadores.md](./docs/fase2/04-contratos/glossario-identificadores.md) | Nomear uma classe, método, enum ou rota nova (dicionário PT→EN canônico do `ADR-015`). |
| [docs/fase2/04-contratos/openapi.yaml](./docs/fase2/04-contratos/openapi.yaml) | Implementar ou alterar endpoints/payloads da API (e sincronizar `bruno/panelada-curadoria/`). |
| [docs/fase1/1.2-analise/regras-de-negocio.md](./docs/fase1/1.2-analise/regras-de-negocio.md) | Conferir a regra de negócio exata (`RN01`–`RN22`) antes de escrever testes ou código. |
| [docs/fase2/02-adr/](./docs/fase2/02-adr/) | Consultar justificativa ou detalhamento de uma decisão arquitetural (`ADR-001` a `ADR-016`). |
| [docs/fase2/05-fechamento/resumo-fase2-para-fase3.md](./docs/fase2/05-fechamento/resumo-fase2-para-fase3.md) | Planejar recortes e sequência da Fase 3 (`MVP-01` a `MVP-04`). |
