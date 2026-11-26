# Deploy Cloud 4C — Render + Supabase

> **Leia quando:** publicar ou atualizar a API na nuvem, rotacionar segredos, preparar a apresentação (*cold start*) ou registrar as medições `(H)` do Estágio 1 (`MVP-04G`, issue #45).

Arquitetura (`ADR-004` Opção 4C, `ADR-012`):

```text
App (emulador) ──HTTPS──▶ Render Free (Docker, virginia) ──TLS verificado──▶ Supabase Postgres (us-east-1)
                                     └──────────────HTTPS (service role)──▶ Supabase Storage (bucket privado)
```

- O app fala **só** com a API. Não existe SDK do Supabase no app nem na API: o Storage é acessado por REST atrás da porta `PhotoStorage` (`PRIVACY.md` §4).
- A API e o banco ficam na mesma região da AWS. O usuário paga um único trajeto Brasil↔EUA por request, e não um por query.
- Custo zero: Render Free + Supabase Free.

## 1. Pré-requisitos

- Conta no GitHub com acesso ao repositório (o Render faz login pelo GitHub).
- Docker e o monorepo instalados localmente (`pnpm install`). O seed da nuvem roda **da sua máquina**, porque gera as fotos com `sharp`.
- `openssl` para gerar segredos.

## 2. Supabase (banco + fotos)

1. Crie a conta em <https://supabase.com> e um projeto novo:
   - **Region:** `East US (North Virginia)` (`us-east-1`).
   - **Database password:** gere uma senha forte e guarde-a num gerenciador de senhas.
2. **Bucket de fotos:** *Storage → New bucket* com o nome `dish-photos` e a opção **Public bucket desligada**. A API lê as fotos com a *service role*, e o app nunca acessa o bucket.
3. **Connection string:** *Connect → Connection string → **Session pooler***. Copie a URI, que tem o formato:
   ```text
   postgresql://postgres.<project-ref>:<db-password>@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```
   Não use a *Direct connection*: ela só tem IPv6, e o Render não sai por IPv6.
4. **Certificado da CA:** *Project Settings → Database → SSL Configuration → Download certificate*. O conteúdo PEM vai em `DATABASE_SSL_CA`.
   - O `pg` trata `sslmode=require` como `verify-full`, e a CA do Supabase não está no *trust store* do Node. Sem `DATABASE_SSL_CA`, a conexão falha com `self-signed certificate in certificate chain`. Desligar a verificação (`rejectUnauthorized: false`) **não** é uma alternativa aceita.
   - Com a CA configurada, a API remove `sslmode`/`ssl*` da URL, porque o `pg` deixaria esses parâmetros sobrescreverem a CA (`apps/api/src/db/client.ts`).
5. **Chaves da API:** *Project Settings → API Keys*. Copie a **Project URL** (`SUPABASE_URL`) e a **`service_role`** (`SUPABASE_SERVICE_ROLE_KEY`). A `service_role` ignora RLS: ela só existe no Render e no seu `.env.cloud`.

## 3. Banco e fotos a partir da sua máquina

```bash
cp .env.cloud.example .env.cloud     # .env.cloud é ignorado pelo git
# preencha DATABASE_URL, DATABASE_SSL_CA, SUPABASE_*, CURATOR_PASSWORD (senha forte e nova)
set -a; . ./.env.cloud; set +a
pnpm db:migrate
pnpm db:seed
```

- O `db:seed` (`apps/api/src/seed-main.ts`) usa o `PhotoStorage` escolhido por `PHOTO_STORAGE_DRIVER`. Com `supabase`, as 20 fotos WebP sobem para o bucket (`x-upsert`, idempotente).
- Rodar de novo é seguro: o seed usa `ON CONFLICT DO NOTHING`, e o upload sobrescreve o mesmo hash.
- Feche o terminal depois (ou rode `unset DATABASE_URL DATABASE_SSL_CA SUPABASE_SERVICE_ROLE_KEY CURATOR_PASSWORD`) para não apontar um `db:reset` local para a nuvem por engano. O `db:reset` já recusa bancos que não terminem em `_dev`/`_test`.

## 4. Render (API)

1. Crie a conta em <https://render.com> com *Sign in with GitHub* e autorize o repositório.
2. *New → Blueprint*, escolha o repositório e a branch a publicar. O Render lê o [`render.yaml`](../../render.yaml): serviço `panelada-api`, Docker, plano Free, região `virginia`, health check em `/v1/health`.
3. Preencha os segredos (`sync: false`) que o Render pedir:

   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | URI do Session pooler (passo 2.3) |
   | `DATABASE_SSL_CA` | Conteúdo do PEM (passo 2.4). Se o campo não aceitar quebra de linha, cole com `\n` literal. |
   | `JWT_SECRET` | `openssl rand -hex 32` (novo, **nunca** o de dev) |
   | `FIELD_ENCRYPTION_KEY` | `openssl rand -base64 32` (novo, **nunca** o de dev) |
   | `SUPABASE_URL` | Project URL (passo 2.5) |
   | `SUPABASE_SERVICE_ROLE_KEY` | `service_role` (passo 2.5) |

4. Aplique o Blueprint. O primeiro build leva alguns minutos. A cada start, o container roda as migrations (idempotentes) e depois sobe o servidor, porque o plano Free não tem *pre-deploy command*.
5. Guarde uma cópia de `FIELD_ENCRYPTION_KEY` num gerenciador de senhas. **Sem ela, as restrições cifradas no banco ficam ilegíveis para sempre.**

Com `NODE_ENV=production`, a API **falha fechado**: se faltar `JWT_SECRET` (mínimo de 32 caracteres) ou `FIELD_ENCRYPTION_KEY`, ela não sobe.

## 5. Verificação

```bash
API=https://panelada-api.onrender.com     # URL mostrada no painel do Render

curl -sf "$API/v1/health"                 # {"status":"ok",...}

TOKEN=$(curl -s -X POST "$API/v1/accounts/anonymous" -H 'content-type: application/json' -d '{}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0)).tokens.accessToken")
HASH=<file_hash de catalog_dish_photos>   # SQL Editor: select file_hash from catalog_dish_photos limit 1;
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' -H "Authorization: Bearer $TOKEN" "$API/v1/photos/$HASH"
# 200 image/webp
```

## 6. App e Bruno contra a nuvem

- **App:** em `apps/mobile`, rode `EXPO_PUBLIC_API_BASE_URL=$API npx expo start --dev-client`. A variável entra no bundle, então reinicie o Metro com `--clear` ao trocar de URL.
- **Bruno:** ambiente **Cloud** da coleção `docs/fase2/04-contratos/bruno/panelada-curadoria/`:
  ```bash
  export PANELADA_CLOUD_API_URL=$API CURATOR_EMAIL=... CURATOR_PASSWORD=...
  cd docs/fase2/04-contratos/bruno/panelada-curadoria
  npx @usebruno/cli run 00-session 01-base-catalog 02-manual-flow 04-negatives 05-query --env Cloud
  ```

## 7. Cold start (apresentação)

O Render Free hiberna após cerca de 15 min sem tráfego, e o primeiro request leva de 30 a 60 s.

- **Antes de apresentar:** `curl -sf "$API/v1/health"` uns 2 min antes e de novo logo antes de abrir o app.
- Se o Render estiver fora do ar, use o fallback (§9). Para isso, basta trocar `EXPO_PUBLIC_API_BASE_URL` para `http://10.0.2.2:3000`.

## 8. Rotação de segredos

| Segredo | Como rotacionar | Efeito |
|---|---|---|
| `JWT_SECRET` | Novo valor no Render → *Save, rebuild and deploy* | Todos os access tokens caem. O app renova a sessão pelo refresh token (opaco, guardado no banco). |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase *API Keys* → gerar nova → atualizar Render e `.env.cloud` | Nenhum, depois do redeploy. |
| Senha do banco | Supabase *Database → Reset password* → atualizar `DATABASE_URL` no Render e no `.env.cloud` | A API cai até o redeploy. |
| `CURATOR_PASSWORD` | Seed não altera conta existente: trocar a senha exige um fluxo próprio (fora do Estágio 1) | — |
| `FIELD_ENCRYPTION_KEY` | **Não** troque sozinha: os dados existentes foram cifrados com a versão atual. A rotação exige uma nova versão em `FIELD_ENCRYPTION_KEYS` + `FIELD_ENCRYPTION_KEY_VERSION` e a recifragem (`ADR-006`). | Trocar sem recifrar torna as restrições ilegíveis. |

Se um segredo vazar (chat, commit, print), rotacione na hora e registre no Diário.

## 9. Fallback local (Docker Compose)

O mesmo `apps/api/Dockerfile` roda localmente, 100% offline:

```bash
docker compose up -d --build
pnpm db:migrate && pnpm db:seed
docker cp apps/api/.data/photos/. projeto_tsi-api-1:/data/photos/   # fotos do seed no volume
curl -sf http://localhost:3000/v1/health
```

- A imagem roda como o usuário `node` (não root). Um volume `panelada_photos` criado **antes** do `MVP-04G` tem o diretório como `root`, e o upload da curadoria falha com `EACCES`. Corrija uma vez com:
  ```bash
  docker run --rm -v projeto_tsi_panelada_photos:/d alpine chown -R 1000:1000 /d
  ```
  Volumes novos já nascem com o dono certo.

## 10. Solução de problemas

| Sintoma | Causa provável | Correção |
|---|---|---|
| `self-signed certificate in certificate chain` | `DATABASE_SSL_CA` ausente ou incompleto | Cole o PEM inteiro, com `BEGIN`/`END` |
| `ENETUNREACH` / `connect ... 2600:` | Usou a *Direct connection* (IPv6) | Troque para o Session pooler |
| Boot falha com `JWT_SECRET must be configured` | Segredo ausente em produção | Preencha no Render |
| `GET /v1/photos/{hash}` → 404 | Seed rodou com `PHOTO_STORAGE_DRIVER=local` | Rode o `db:seed` de novo com o `.env.cloud` |
| Fotos → 500 depois de 10 s | Storage lento ou fora do ar (`PHOTO_STORAGE_TIMEOUT_MS`) | Veja o status do Supabase e os logs do Render |
| App mostra "sem conexão" no 1º acesso | *Cold start* | Aqueça com `curl` (§7) |

## 11. Evidências `(H)` — Estágio 1

> Preenchido na Fase C da issue #45. Não registre segredos, tokens ou códigos de restrição reais aqui.

**Ambiente:** API `<url>` (commit `<hash>`), Supabase `us-east-1`, emulador `<AVD / RAM>`, data `<AAAA-MM-DD>`.

### H1 — `A05` servidor: 0 restrições em texto claro no Supabase

- **Como:** no SQL Editor do Supabase, `select encrypted_type, key_version from profile_restrictions limit 5;` (esperado: base64 opaco) e `select count(*) from profile_restrictions where encrypted_type ilike any (array[<19 códigos de profile_restriction_types com %>]);` (esperado: 0).
- **Resultado:** _pendente_

### H2 — `A05` aparelho: 0 restrições em texto claro no SQLite

- **Como:** `adb exec-out run-as br.edu.panelada.app cat databases/panelada.db > panelada.db`; `strings panelada.db | grep -ciE '<19 códigos>'` (esperado: 0); `sqlite3 panelada.db '.tables'` sem chave falha com `file is not a database`.
- **Resultado:** _pendente_

### H3 — `A04` desempenho offline: receita com foto ≤ 2 s

- **Como:** baixar a receita, ligar o modo avião, abrir a receita 3 vezes e anotar o tempo até a foto WebP renderizar (mediana).
- **Resultado:** _pendente_ (medições: `_ / _ / _` ms, mediana `_` ms, WebP sem erro: _)

### H4 — `A09` contrato/curadoria: Bruno contra a nuvem

- **Como:** a coleção sem `03-assisted-flow` (importação assistida, `MVP-05`), com o comando do §6. Cada execução publica um "Crepe simples" na nuvem.
- **Resultado:** _pendente_ (`<n>` requisições, `<n>` asserts aprovados)

### Jornada E2E da Onda 1A no emulador

Onboarding → Restrição cifrada → Sugestões → "Cozinhar agora" → Modo avião na receita → Avaliação → Coleção/Evoluções/Badges: _pendente_
