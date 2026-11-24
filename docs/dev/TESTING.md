# Testes, Qualidade e CI — Panelada

> **Leia quando:** instalar dependências, rodar lint/typecheck/testes localmente, verificar fronteiras modulares (`eslint-plugin-boundaries`), validar o contrato OpenAPI ou depurar a CI.
> **Referências canônicas:** [`Playbook 03`](../playbooks/03-qualidade-fronteiras-e-contratos.md) e [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## 1. Bootstrap sem Instalação Global do `pnpm`

O `pnpm` está declarado em `devDependencies` na raiz do monorepo (`package.json`), permitindo trabalhar sem instalar pacotes globais na máquina:

```bash
# 1. Primeira instalação no clone (sem instalação global)
npx --yes pnpm install

# 2. A partir daí, use o binário local do repositório (ou `pnpm` se já estiver no PATH)
./node_modules/.bin/pnpm lint
./node_modules/.bin/pnpm test
```

> Na CI e no `Dockerfile` da API, o `pnpm` é disponibilizado no ambiente containerizado; os scripts do `package.json` funcionam de forma idêntica nos dois modos.

---

## 2. Comandos de Verificação

| Comando | Camada | O que valida |
|---|---|---|
| `pnpm lint` | Monorepo | ESLint 9 + `eslint-plugin-boundaries` (`S1`–`S8`, `A1`–`A8`) + `import-x/no-cycle` (`S7`) + restrições `A05`/`A2`/`A5`/`A6`/`A7`/`S6`. |
| `pnpm format:check` | Monorepo | Formatação Prettier (`format` aplica correção automática). |
| `pnpm typecheck` | Todos os workspaces | `tsc --noEmit` em `packages/allergen-rules`, `apps/api` e `apps/mobile`. |
| `TZ=UTC pnpm test` | Unitários + Mobile | Vitest (`packages/allergen-rules`, `apps/api/test/unit`) e Jest (`apps/mobile/test`). |
| `TZ=UTC pnpm test:integration` | Integração API | Vitest contra PostgreSQL real em Docker (`panelada_test`). Exige `docker compose up -d`. |
| `pnpm contracts:lint` | Contrato OpenAPI | `@redocly/cli lint docs/fase2/04-contratos/openapi.yaml` (meta: 0 erros). |
| `pnpm contracts:generate` | Tipos OpenAPI | Regenera `apps/api/src/shared/openapi.generated.ts` e `apps/mobile/src/core/network/openapi.generated.ts` a partir do `openapi.yaml`. |
| `pnpm contracts:check` | Drift de contrato | Falha se qualquer um dos dois `openapi.generated.ts` (API ou mobile) estiver dessincronizado com `openapi.yaml` (sem sujar o working tree). |

---

## 3. Política de Testes e Trava `_test`

- **Fuso horário obrigatório:** rode testes sempre com `TZ=UTC` (mesmo padrão da CI e do Postgres Docker).
- **Trava `_test`:** `apps/api/test/integration/setup.ts` executa `assertTestDatabaseUrl` antes de qualquer suíte. Se `DATABASE_URL` apontar para `panelada_dev` (ou qualquer banco sem sufixo `_test`), a execução aborta imediatamente com erro explícito.
- **TDD estrito vs. teste depois:** siga a matriz da Seção 4 do [`Playbook 03`](../playbooks/03-qualidade-fronteiras-e-contratos.md) — TDD estrito (red-green-refactor) para regras puras/segurança/sync/services e teste de componente depois para telas React Native.
- **Banco local nos testes do mobile:** `apps/mobile/test/support/fake-local-database.ts` implementa `LocalDatabase` sobre o SQLite embutido do Node (`node:sqlite`, sem flag a partir do **Node 22.13**), compartilhando com o `SqlCipherDatabase` a mesma lógica de transação serializada (`core/local-db/serialized-database.ts`). Assim `Migrator`, repositórios e o `DirectOnlineOperationEnqueuer` executam SQL real no Jest; só a cifra fica de fora (validada no emulador, Seção 5).
- **Prova de fronteiras (`eslint-plugin-boundaries`):** sempre que alterar regras em `eslint.config.mjs`, introduza temporariamente um import proibido (servidor + mobile), confirme que `pnpm lint` falha e reverta antes de commitar.

---

## 4. Pipeline de CI (`.github/workflows/ci.yml`)

A CI roda em PRs e pushes para `development` e `main` usando *path filters* (`dorny/paths-filter`):
- **`contracts`:** roda quando `openapi.yaml`, `apps/api/**`, `apps/mobile/**` ou arquivos raiz mudam (`contracts:lint` + `contracts:check`).
- **`quality`:** roda `lint`, `format:check` e `typecheck` para qualquer alteração de código ou config raiz.
- **`allergen-rules`:** executa a suíte pura de `packages/allergen-rules` com `TZ=UTC`.
- **`api`:** sobe serviço `postgres:16-alpine` (`TZ=UTC`, `panelada_test`), roda testes unitários, `db:migrate`, `db:seed`, `db:reset` e `test:integration`.
- **`mobile`:** executa a suíte Jest (`jest-expo`) de `apps/mobile` com `TZ=UTC`.

---

## 5. Verificação no *Development Build* (Emulador Android)

O app usa módulos nativos (`expo-sqlite` com SQLCipher, `expo-secure-store`), então **Expo Go não serve**: é preciso o *development build*. A pasta `apps/mobile/android/` é gerada (CNG) e fica fora do git — rode `prebuild --clean` sempre que mudar `app.json`/plugins ou dependências nativas.

```bash
docker compose up -d                                  # API em http://localhost:3000 (10.0.2.2:3000 no emulador)
cd apps/mobile
pnpm exec expo prebuild --clean -p android            # aplica expo.sqlite.useSQLCipher=true no gradle.properties
pnpm exec expo run:android                            # compila, instala e sobe o Metro
```

- **URL da API:** `EXPO_PUBLIC_API_BASE_URL` (padrão `http://10.0.2.2:3000`). A aba **Perfil** mostra a versão das regras de alérgenos (prova o bundle Metro de `@panelada/allergen-rules/rules`) e se o servidor respondeu ao `GET /v1/health`.
- **Prova de cifra em disco (`A05`, `ADR-005`):** o arquivo do banco não pode ser legível como SQLite plano.

  ```bash
  adb exec-out run-as br.edu.panelada.app cat files/SQLite/panelada.db > /tmp/panelada.db
  head -c 16 /tmp/panelada.db | xxd                    # NÃO pode começar com "SQLite format 3"
  sqlite3 /tmp/panelada.db 'select count(*) from sqlite_master;'  # esperado: "file is not a database (26)"
  ```

  > `.tables` falha em silêncio em algumas versões do `sqlite3` — use a consulta acima, que força a leitura do esquema.

  ```bash
  strings /tmp/panelada.db | grep -c CREATE         # esperado: 0 (nenhum esquema em texto claro)
  ```

- **Fail-closed:** se o build não tiver SQLCipher, `PRAGMA key` seria ignorado em silêncio; o `SqlCipherDatabase` checa `PRAGMA cipher_version` e recusa abrir o banco (a tela de erro de inicialização aparece).
