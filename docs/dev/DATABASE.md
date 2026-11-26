# Banco de Dados e Migrations (PostgreSQL + Drizzle) — Panelada

> **Leia quando:** subir o PostgreSQL local, rodar migrations, resetar/popular o banco (`db:reset`), criar tabelas em um módulo (`S8`) ou configurar transações cross-módulo (`tx: Tx`).
> **Referências canônicas:** [`ADR-002`](../fase2/02-adr/adr-002-estilo-servidor-monolito-modular.md), [`ADR-004`](../fase2/02-adr/adr-004-demonstracao-docker-e-alvo.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md) e [`PRIVACY.md`](./PRIVACY.md).

---

## 1. Ambiente Containerizado (Zero Postgres no Host)

O PostgreSQL roda exclusivamente via Docker Compose (`postgres:16-alpine`), sempre com `TZ=UTC` e `PGTZ=UTC`:

- **`panelada_dev`** — banco padrão da API (`docker-compose.yml`) e do desenvolvimento local.
- **`panelada_test`** — banco isolado criado automaticamente no primeiro boot pelo script `infra/postgres/init/01-create-test-db.sql`, exclusivo para testes de integração.

```bash
# Subir PostgreSQL + API (http://localhost:3000/v1/health)
docker compose up -d --build

# Se precisar recriar os bancos do zero (inclusive panelada_test)
docker compose down -v && docker compose up -d --build
```

> Copie `.env.example` para `.env` apenas se precisar sobrescrever variáveis localmente (por exemplo, `POSTGRES_PORT=5434` caso outra stack já ocupe a porta `5432` no host). Nunca versione `.env` nem credenciais reais.

---

## 2. Comandos de Banco (`pnpm` local ou no `PATH`)

Se `pnpm` não estiver instalado globalmente na máquina, troque `pnpm` por `./node_modules/.bin/pnpm`.

| Comando | O que faz |
|---|---|
| `pnpm db:migrate` | Aplica as migrations Drizzle em `apps/api/drizzle/` sobre `DATABASE_URL` (padrão: `panelada_dev`). |
| `pnpm db:seed` | Executa o seed determinístico e idempotente (`apps/api/src/db/seed.ts`, via `apps/api/src/seed-main.ts`, que publica as fotos no `PhotoStorage` escolhido por `PHOTO_STORAGE_DRIVER`). |
| `pnpm db:reset` | Recria os schemas `drizzle` e `public`, aplica todas as migrations e roda o seed. Pode ser executado várias vezes seguidas sem erro. |

### Travas de segurança (`apps/api/src/db/test-guard.ts`)
- **`db:reset`** recusa executar se o nome do banco em `DATABASE_URL` não terminar em `_dev` ou `_test`.
- **`test:integration`** recusa iniciar se `DATABASE_URL` não terminar em `_test` (impedindo destruir `panelada_dev`).

---

## 3. Regras de Schema e Fronteira Modular (`S8`, `T01`)

1. **Um schema por módulo dono:** tabelas ficam apenas em `apps/api/src/modules/<modulo>/internal/schema.ts` (ou `cross-cutting/<comp>/internal/schema.ts`), descobertas por `apps/api/drizzle.config.ts`.
2. **Prefixo obrigatório:** toda tabela usa prefixo do módulo dono (`catalog_*`, `profile_*`, `routine_*`, `progress_*`, `importer_*`).
3. **Sem `JOIN` cross-módulo:** o `eslint-plugin-boundaries` impede imports entre `internal/` de módulos, mas não analisa SQL em string — consultas diretas em tabelas de outro módulo são proibidas na revisão de PR.
4. **Transações cross-módulo (`tx: Tx`):** métodos em `public/` que escrevem exigem `tx: Tx` (`apps/api/src/shared/tx.ts`) como parâmetro obrigatório, obtido via `dbClient.withTransaction(...)` (`apps/api/src/db/client.ts`).
5. **Seed vivo:** a partir das fatias funcionais (`MVP-04A+`), toda feature visível em tela deve estender `apps/api/src/db/seed.ts` de forma idempotente (`ON CONFLICT DO NOTHING`) no mesmo PR.
6. **Dados sensíveis (`A05`):** colunas de restrição alimentar jamais recebem texto claro — passam sempre pelo `FieldCipher` (`AES-256-GCM`) antes do `INSERT`/`UPDATE`, tanto no Docker local quanto no Supabase.
