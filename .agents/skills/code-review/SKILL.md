---
name: code-review
description: Perform risk-focused code reviews for Panelada (adapted from Sentry engineering practices). Use when reviewing pull requests, inspecting `git diff development...HEAD` in step 5.1 of `solve-issue`, or auditing code quality, security (`A05`/`A06`), modular boundaries (`S1`–`S8`/`A1`–`A8`), performance, and tests.
---

# Code Review (Panelada)

Risk-focused code review guidelines adapted from Sentry engineering practices to Panelada's stack (**TypeScript · Fastify · PostgreSQL · React Native/Expo**) and architectural invariants.

> **Goal:** risk reduction, not perfect code. Do not block PRs over stylistic preferences already handled by Prettier/ESLint.

---

## Scope & Entry Point

When reviewing a branch before opening a PR (step 5.1 of `solve-issue`), run in a clean context over:

```bash
git diff development...HEAD
```

Read only the changed files (and directly referenced neighbors/contracts) so the review stays sharp and independent of the implementation thread.

---

## Review Checklist

### 1. Identifying Problems
- **Runtime errors:** null/undefined dereferences, unhandled promise rejections, out-of-bounds access, missing error handling on I/O boundaries.
- **Performance:** unbounded $O(n^2)$ loops, N+1 queries inside loops, unnecessary re-renders or allocations in mobile lists.
- **Side effects:** unintended behavioral changes affecting other modules or offline state.
- **Backwards compatibility:** breaking changes to `docs/fase2/04-contratos/openapi.yaml`, sync operation payloads, or SQLite/Postgres migrations without a safe path.
- **Database queries:** unparameterized SQL, missing indexes on hot filters, or queries leaking across transactions.
- **Security vulnerabilities:** SQL injection, broken access control (missing `accountId` scoping), secrets or PII leakage.

### 2. Panelada Critical Checks (What Linters Cannot Catch)
- **Cross-module SQL (`S8`, `R19`):** `eslint-plugin-boundaries` cannot inspect SQL strings. Confirm no query reads or `JOIN`s a table prefixed with another module's name (`catalog_*`, `profile_*`, `routine_*`, `progress_*`).
- **Transactional integrity (`T01`):** cross-module writes must pass and actually use the mandatory `tx: Tx` handle rather than falling back to the global DB pool.
- **Privacy & LGPD (`A05`, `A13`, `ADR-005`, `ADR-006`, `RNF06`):**
  - Dietary restrictions pass through `FieldCipher` (AES-256-GCM, unique IV, `accountId` as AAD) before touching Postgres (including Supabase).
  - Zero dietary restrictions, tokens, or encryption keys in logs (`support/technical-log`) or sent to `AiProvider`.
  - Revoking a restriction deletes the row (no soft-delete); `DELETE /v1/account` wipes all user data.
- **Allergen safety (`A06`, `RN08`, `RN22`, `ADR-014`):**
  - `allergenState !== "verified"` or unconfirmed ingredients must **fail closed** (never `compatible` for users with restrictions).
  - The 19 ANVISA allergen codes remain in the closed Portuguese enum; substitutions validate `isSubstituteAllowed`.
- **Mobile boundaries (`A1`–`A8`, `P04`):** concrete adapters are instantiated only in `apps/mobile/src/app/composition/`; state mutations go through `OperationEnqueuer`.
- **Contracts, Seed & Bilingual Policy (`ADR-015`):**
  - Route/payload changes match `openapi.yaml` (and Bruno collection for `/v1/curation` or `/v1/sessions`).
  - Features visible on screen extend the development seed (`db:reset`) in the same PR (from `MVP-02` onward).
  - Code, identifiers, comments, and commits are in **English**; UI copy, docs, and PR text are in **Brazilian Portuguese**; zero AI attribution in code/commits/PRs.

### 3. Design & Test Coverage
- Does the change keep modules deep (small public interface in `public/`, complex logic hidden in `internal/`) and avoid shallow pass-through wrappers (`codebase-design`)?
- Do tests verify observable behavior through public interfaces (and cite `UC`/`RN`/`A##` for critical domain rules), covering happy path, boundary conditions, and error paths without excessive branching in test code?
- For pure domain/critical services, follow Playbook 03's TDD matrix; do not demand rigid TDD on exploratory React Native UI layout.

### 4. High-Impact Changes (Flag Explicitly for Human Attention)
Call out explicitly in the summary whenever a diff modifies:
- Database schemas or migrations (Postgres or SQLCipher)
- API contracts (`openapi.yaml`) or sync operation schemas
- Encryption, authentication, or allergen classification logic
- New third-party dependencies or framework upgrades
- Performance-critical paths (offline cold open ≤ 2s, `A04`)

---

## Common Patterns to Flag

### TypeScript / PostgreSQL (N+1, SQL Injection, and `tx: Tx`)

```ts
// Bad: N+1 query inside a loop and touching another module's table directly
for (const item of routineItems) {
  const dish = await db.query(`SELECT * FROM catalog_dishes WHERE id = '${item.dishId}'`);
}

// Good: parameterized query within the owning module, or batch read via CatalogRead public facade
const dishes = await catalogRead.findByIds(routineItems.map((i) => i.dishId));
```

```ts
// Bad: receives `tx` but accidentally queries the global pool
async function createProfile(tx: Tx, accountId: string) {
  await pool.query("INSERT INTO profile_profiles (account_id) VALUES ($1)", [accountId]);
}

// Good: uses the passed `tx` so cross-module writes remain atomic (T01)
async function createProfile(tx: Tx, accountId: string) {
  await tx.query("INSERT INTO profile_profiles (account_id) VALUES ($1)", [accountId]);
}
```

### TypeScript / React Native

```ts
// Bad: missing dependency in useEffect causes stale data for a new dish
useEffect(() => {
  loadRecipe(dishId);
}, []);

// Good: include all reactive dependencies (and handle cancellation on unmount)
useEffect(() => {
  let cancelled = false;
  loadRecipe(dishId).then((r) => {
    if (!cancelled) setRecipe(r);
  });
  return () => {
    cancelled = true;
  };
}, [dishId, loadRecipe]);
```

---

## Feedback & Classification Format

### Tone & Approval
- Be direct, constructive, and actionable — explain *why* something is a risk and propose a concrete fix.
- Phrase uncertain points as questions (*"Have you considered...?"*).
- Approve when no correctness, security, or boundary risks remain.

### Finding Classification (Integrated with `solve-issue` Step 5.1)
Group every finding with file/line reference into one of three buckets:
1. **Confirmado no escopo** — concrete bug, security/LGPD/allergen issue, or boundary violation in the current PR (fix before opening/merging PR).
2. **Fora do escopo** — real issue outside this PR's approved plan (report in summary, or open a follow-up issue when running with `--triage`).
3. **Duvidoso** — possible edge case or trade-off needing human confirmation (report as a question, do not edit on a guess).

---

## References

- Adapted from [Sentry Code Review Guidelines](https://develop.sentry.dev/engineering-practices/code-review/)
- Panelada invariants: `docs/dev/ARCHITECTURE.md`, `docs/dev/PRIVACY.md`, `docs/playbooks/03-qualidade-fronteiras-e-contratos.md`
