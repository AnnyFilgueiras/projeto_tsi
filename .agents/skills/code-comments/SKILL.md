---
name: code-comments
description: Decide what to comment, what to leave uncommented, and how to word it — "code tells you how, comments tell you why". Use whenever writing or editing comments, JSDoc, TODO/FIXME notes, workarounds, or reviewing comment quality in Panelada code.
---

# Code Comments (Panelada)

Comments are read far more often than they are written, and always by someone with less context than the author had. A bad comment is worse than no comment: it costs reading time, needs maintenance, and quietly goes stale while the reader still trusts it.

The guiding line: **code tells you _how_, comments tell you _why_.**

## The filter

Before writing any comment, ask: *does this say something the code cannot say by itself?*

If the answer is no, you have two better moves than commenting:

1. **Rename or restructure** so the code says it. A good name beats a comment because it cannot drift out of date.
2. **Write nothing.** Silence is cheaper than noise.

Only when the answer is yes — the information lives outside the code (intent, a business rule, an ADR constraint, a standard, a hazard) — does a comment earn its place.

## What earns a comment

### Non-obvious business rules and ADR constraints (Panelada)

Prefer **stable project IDs** (`RN08`, `A05`, `A06`, `ADR-006`, `ADR-014`) over ephemeral issue numbers (`#42`) or process notes ("deploy does not run seeds"), because IDs and rules remain meaningful long after an issue closes.

```ts
// RN08 / A06: Fail closed when allergen state is unverified so unreviewed
// recipes are never shown as safe to users with dietary restrictions.
if (recipe.allergenState !== "verified") {
  return "unconfirmed";
}
```

### Unidiomatic or surprising code

If a line looks redundant, wrong, or over-complicated but is deliberate, explain why — otherwise a future reader will "simplify" it and reintroduce the bug. Do not comment ordinary language idioms.

### Copied code and external references

Link the spec, RFC, regulatory norm (e.g. ANVISA RDC 727/2022), vendor doc, or Stack Overflow URL directly beside the code it explains.

### Bug fixes and workarounds

Record what broke, where, and under what conditions so nobody deletes the workaround later.

### Incomplete implementations

Use the conventional marker (`TODO`, `FIXME`, `HACK`) and state specifically what is missing and what it would take. Never write a bare `// TODO: fix this`.

## What does not earn a comment

- **Restating the code:** `i = i + 1; // Add one to i`
- **Covering for unclear names or tangled functions:** rename or split instead.
- **JSDoc on private/internal helpers:** reserve JSDoc for public module interfaces (`public/` facades, `packages/allergen-rules` entrypoints).
- **Commented-out code:** Git remembers it. Delete it.
- **Ephemeral process trivia:** commit messages and PRs hold process context, not source comments.

## When the comment is hard to write

Treat this as a signal about the code, not your writing. If you cannot explain a function clearly in a couple of sentences, the function is probably doing too much or the abstraction is wrong. Simplifying the code is usually cheaper than taping prose onto a tangled function.

## Language and wording (ADR-015)

- **Write all code comments in English**, even though docs, issues, PRs, and UI copy are in Brazilian Portuguese.
- **Use clear, simple English:** short sentences, concrete subjects, plain verbs (*use*, *skip*, *retry*, *fail*), present tense. Keep domain terms exact (`allergenState`, `idempotent`, `AAD`).

## Reviewing existing comments

When cleaning up comments or reviewing a diff, check in order:
1. Is it still true? (Fix or delete first.)
2. Does it duplicate the code? (Delete.)
3. Is it covering for a bad name or tangled function? (Refactor the code.)
4. Is it clear to someone who has never seen this file? (Rewrite in plain English.)
5. What is missing? (Workaround, magic constant, or ADR/RN constraint without explanation.)
