---
name: codebase-design
description: Shared vocabulary for designing deep modules, seams, and adapters. Use when designing or improving a module's public interface, deciding where a port/seam belongs, avoiding shallow pass-through layers, or exploring alternative interfaces.
---

# Codebase Design (Panelada)

Design **deep modules**: significant behavior behind a small interface, placed at a clean seam, testable through that interface. This directly reinforces Panelada's modular monolith facades (`P06`), pluggable ports (`P02a`–`P02f`, `P04`), and minimalism rule (`padroes-de-projeto.md` §1 & §5).

## Glossary

Use these terms consistently when discussing design:

- **Module** — anything with an interface and an implementation (a function, class, package, or domain slice).
- **Interface** — everything a caller must know to use the module correctly: type signature, invariants, ordering constraints, error modes, transactional requirement (`tx: Tx`), and performance characteristics.
- **Implementation** — what sits inside a module (in Panelada API modules, everything inside `internal/`).
- **Depth** — leverage at the interface: the amount of behavior a caller (or test) can exercise per unit of interface they have to learn. Deep = small interface + rich behavior; shallow = large interface + thin pass-through (avoid).
- **Seam** *(Michael Feathers)* — the location where an interface lives so behavior can vary without editing callers (e.g., `PhotoStorage`, `AiProvider`, `OperationEnqueuer`). *(Note: reserve the word "boundary" for `eslint-plugin-boundaries` rules `S1`–`S8`/`A1`–`A8` so the two concepts stay distinct.)*
- **Adapter** — a concrete implementation filling a seam (e.g., `KimiProvider` vs. `RecordedProvider`).
- **Leverage / Locality** — leverage is what callers get from depth; locality is what maintainers get when change concentrates in one module (`A12`).

## Deep vs. Shallow

```text
DEEP MODULE (good):                 SHALLOW MODULE (avoid):
┌─────────────────────┐             ┌─────────────────────────────┐
│   Small Interface   │             │       Large Interface       │
├─────────────────────┤             ├─────────────────────────────┤
│ Deep Implementation │             │    Thin Pass-Through        │
└─────────────────────┘             └─────────────────────────────┘
```

When designing an interface (`modules/*/public/` or a feature use case), ask:
- Can I reduce the number of methods?
- Can I simplify the parameters?
- Can I hide more complexity inside `internal/`?
- Does a trivial read really need a pass-through `service.ts`, or is it just indirection?

## Principles

- **Depth is a property of the interface, not the implementation.** Internal helpers and internal seams stay private inside `internal/`.
- **The deletion test.** Imagine deleting the wrapper. If complexity vanishes, it was a shallow pass-through. If complexity reappears across N callers, it earns its keep.
- **The interface is the test surface.** Callers and tests cross the same seam.
- **One adapter means a hypothetical seam. Two adapters means a real one.** Do not introduce a port unless at least two concrete adapters exist (production + fake/test, or local + cloud like `P02f`, or Stage 1 + Stage 2 like `P04`).
- **Composition Root owns concrete adapters (Panelada `A8`).** Accept dependencies via parameters/constructor without default concrete fallbacks inside features or domain modules; wire concrete adapters in `apps/api/src/app.ts` and `apps/mobile/src/app/composition/`.

## Designing for Testability

1. **Accept dependencies, don't instantiate them internally.**
2. **Prefer pure calculations that return results over side-effecting mutations** (e.g., `AllergenRules`, `UnlockCalculator`, `UnlockRules`, `ReminderScheduler`).
3. **Keep surface area small:** fewer methods and parameters mean simpler, stronger tests.

## Going Deeper

- **Deepening a cluster given its dependencies:** see [DEEPENING.md](DEEPENING.md).
- **Exploring radically different interfaces in parallel:** see [DESIGN-IT-TWICE.md](DESIGN-IT-TWICE.md) (use `docs/dev/GLOSSARY.md` + `AGENTS.md` for domain vocabulary).
