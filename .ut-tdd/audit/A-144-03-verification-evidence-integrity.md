# A-144-03 - Verification & evidence integrity

- **index**: [A-144 judge audit index](./A-144-judge-audit-index.md)
- **related units**: [04 db registration](./A-144-04-db-registration-projection.md) (test_runs facade = same projected digests)
- **related PLANs**: [PLAN-L7-188](../../docs/plans/PLAN-L7-188-verification-strategy-design-time-logging.md) (the structural remedy)
- **memory**: [[feedback_coverage_not_substance]], [[project_refactor_before_screens_contracts_megafile]], [[feedback_verification_strategy_design_time_logging]]

## VER-1 [HIGH] `green-evidence-integrity=closed` rests on a digest restamp not bound to a re-run

A-143 marks `green-evidence-integrity` `closed` (green-command-digest = OK, 0 mismatch). That OK state was produced by commit `8111a92 "chore: synchronize green command digests"`, which:
- changed `output_digest` sha256 values across ~24 PLAN files,
- touched **no** `src/` or `tests/` files,
- carried no green-re-run evidence (message = "synchronize" only).

The digest gate proves **hash matches the evidence file**, not that each green command was **re-run and passed against the current file**. A-143 records one `bun run test` (1185 passed), but it is not bound to the restamp commit.

**Verdict**: this is the *shape* the harness itself forbids — "mechanical restamp = audit tampering; only green-re-run-backed coordinated correction is allowed" ([[project_refactor_before_screens_contracts_megafile]]). Even if benign, the evidence chain is `coverage`, not `substance`.

**Recommendation**: bind the restamp to an actual green re-run (cite the run, or re-run the affected commands and record), and do not harden the digest advisory into a hard close condition until restamp-vs-rerun is enforced.

## VER-2 [MED] several `closed` items are "locally-closed", not operationally verified

A-143 `closed` rows for `brownfield-onboarding` / `cross-project-test-workflow` are **local managed-block / local acceptance** only; gap columns admit "real consumer validation remains post-publication". `claude-codex-parity` is correctly `partial` (real Codex-session hook firing unproven). But the word `closed` reads stronger than "locally-closed", and combined with DIST-1/DIST-2 the consumer-side operation is in fact unproven.

**Recommendation**: relabel `closed` → `locally-closed` (or annotate unmissably) so `closed=N` is not read as "N done in production". Tie consumer operation to a real-consumer smoke (see DIST-2).

## VER-3 [MED] no Vitest coverage threshold (GPT-5 #7) — NOT touched

`vitest.config.ts` `coverage` declares `reporter: ["text","html","clover","json-summary"]` only — no `thresholds` (lines/statements/branches/functions). A platform that sells "strict verification" has no coverage floor.

**Verdict (verified TRUE)**. **Recommendation**: add a coverage threshold at least for core modules; add the negative tests called for by SEC-1/SEC-2/DB-1.

## Theme

All three are the same root: verification accepts `presence / hash-match / local-green` in place of `real-green / real-operation / real-provenance`. The structural fix is [PLAN-L7-188](../../docs/plans/PLAN-L7-188-verification-strategy-design-time-logging.md): design-time provenance logging + an L7 debug live-run evidence step + a gate that fail-closes any fired/used/works claim resting on projection alone.
