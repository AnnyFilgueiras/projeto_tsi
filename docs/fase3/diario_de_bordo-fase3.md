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
