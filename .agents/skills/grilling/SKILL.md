---
name: grilling
description: Interview the user relentlessly about a plan, feature slice, or design until no ambiguity remains. Use when stress-testing a plan before building, refining MVP scope, or when the user asks to be grilled/interviewed.
---

# Grilling (Panelada)

Interview the user relentlessly about every open aspect of the plan until both sides reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one by one.

## Rules

1. **Check the repository first — do not re-ask settled decisions.**
   Before asking any question, check if the answer already lives in `STATE.md`, `docs/dev/`, `docs/fase2/02-adr/`, `docs/fase2/04-contratos/openapi.yaml`, `docs/fase1/1.2-analise/regras-de-negocio.md`, or the existing code in `apps/` and `packages/`. Most product and architectural decisions in Panelada are already settled — only interview what is genuinely open (MVP slicing, UX/UI details, edge cases, operational trade-offs), and never reopen a closed ADR unless the user asks or a concrete conflict emerged.
2. **One question at a time.**
   Ask a single clear question per turn and wait for feedback before continuing. Asking multiple questions at once is bewildering. Use interactive question tools when the harness offers them; otherwise ask directly in plain text.
3. **Lead with a recommendation.**
   For every question, state your recommended answer and briefly explain *why* (never present a neutral menu without a take).
4. **Stop when no ambiguity blocks execution.**
   Close with a short summary of the decisions settled so they can go straight into an issue (`github-issue-craft`) or a plan in `.plans/`.
