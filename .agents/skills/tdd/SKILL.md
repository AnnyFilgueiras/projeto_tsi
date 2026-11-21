---
name: tdd
description: Test-driven development (vertical red-green-refactor). Use when implementing domain rules, pure packages, backend services, or bugfixes in Panelada, or when the user mentions "tdd" or "red-green-refactor".
---

# Test-Driven Development (Panelada)

## Scope Policy in Panelada (Playbook 03)

Apply TDD **where tests define behavior and pay back**, not blindly everywhere:

| Level | Targets in Panelada | Practice |
|---|---|---|
| **Strict Test-First (TDD)** | `packages/allergen-rules` (`A06`), `UnlockCalculator` & `UnlockRules` (`RN03`/`RN04`/`ADR-016`), `ReminderScheduler` (`A07`), `PublicationGate` (`A09`), `OperationApplier` registry, `SyncService` & `ProcessedOperation` (`A08`), `SessionService`, `FieldCipher` (`A05`), `RegisterRating` with port fakes, bugfixes (regression test first) | RED → GREEN → REFACTOR vertically. Reference the originating `UC##`, `RN##`, or `A##` ID in `describe`/`it` names. |
| **Shared JSON Vectors** | `packages/allergen-rules` and `UnlockCalculator`/`UnlockRules` | The shared JSON vector files are the contract spec; activate or add vectors incrementally (one scenario → make it pass → next) so every vector fails before the rule exists. |
| **Contract Suite** | `KimiProvider` & `RecordedProvider` (`P02b`), `LocalDiskPhotoStorage` & `SupabasePhotoStorage` (`P02f`) | Both adapters pass the exact same contract test suite. |
| **Test After** | React Native screens and exploratory UI flows (`apps/mobile/src/features/*/ui/`) | Write component tests after the feature layout settles; do not churn snapshot tests during UI exploration. |
| **Empirical Measurement (`H`)** | SQLCipher cold open ≤ 2s (`A04`), download-set size, AI token budget (`ADR-011`) | Measure on the reference Android emulator or benchmark script and record in `diario_de_bordo`. |

---

## Philosophy

**Core principle:** Tests verify observable behavior through public interfaces (`public/` facades, package entrypoints, HTTP endpoints, use-case interfaces), not implementation details. Code can be refactored completely; tests should stay green.

- **Good tests** describe *what* the system guarantees (e.g. `"RN08: returns unconfirmed when recipe allergenState is unverified"`).
- **Bad tests** mock internal collaborators, test private helpers, or assert call order/counts on internal objects. If renaming an internal helper breaks tests while behavior is unchanged, the test is coupled to implementation.

See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for boundary mocking guidelines.

## Anti-Pattern: Horizontal Slices

**DO NOT write all tests first, then all implementation.**

```text
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  RED→GREEN: test3→impl3
```

Write **one test**, confirm it fails **for the right reason** (a test that passes before you touch code proves nothing), write the minimal code to make it pass, then move to the next behavior.

## Workflow

### 1. Planning
Read `AGENTS.md`, `docs/dev/GLOSSARY.md`, and the relevant ADR/RN so test names and interface vocabulary match Panelada's domain language (English identifiers, `ADR-015`; 19 ANVISA allergen codes in Portuguese).

Confirm before coding:
- Public interface shape and seam placement (see `codebase-design` skill).
- Priority behaviors to test (happy path, boundary values, error/security cases).

### 2. Tracer Bullet
Write ONE test confirming the core end-to-end path through the public interface:
- **RED:** run the targeted test and verify the failure reason.
- **GREEN:** write the minimal code to pass.

### 3. Incremental Loop
Repeat one behavior at a time:
- One test at a time; minimal code to pass; no speculative features.
- Keep test records identifiable by stable ID, never by list position.

### 4. Refactor (only while GREEN)
After all tests pass, check [refactoring.md](refactoring.md):
- Extract genuine duplication (not premature abstractions).
- Deepen shallow modules behind clean interfaces.
- Re-run tests after each refactor step. **Never refactor while RED.**

## Checklist Per Cycle

- [ ] Test describes behavior (and cites `UC`/`RN`/`A##` when applicable)
- [ ] Test uses public interface / port fakes only
- [ ] Test failed for the right reason before implementation
- [ ] Code is minimal for the current test
- [ ] No speculative features added
