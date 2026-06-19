# A-140 — IMP-083 unit-oracle-substance cross_agent review (2026-06-19)

- review_kind: `cross_agent` / worker: Claude (claude-opus-4-8) / reviewer: Codex QA (gpt-5.5)
- via `ut-tdd codex --role qa --task-file .ut-tdd/codex-tasks/imp083-unit-oracle-substance-review.md --execute`
- **初回 verdict=fail → 全指摘 remediate → 再検証 green**:
  - **Critical (regex 多セグメント取りこぼし)**: `U-[A-Z0-9]+-[0-9]+` を `U-[A-Z0-9-]+-[0-9]+` へ拡張
    (`U-FR-L1-21-01` / `U-DBPROJ-ATOMIC-01` 等を捕捉、targeted 239→248)。
  - **Important (SSoT 未登録)**: `unit-oracle-substance` を `REQUIRED_RULE_IDS` + SSoT
    `docs/governance/ddd-tdd-rules.md` + test baseInputs policy へ登録 (rule contract 化)。
  - **Minor (inline `|` 誤分割)**: substance を最終セル → `cells.slice(2).join(" ")` (ID+target 除く残り連結) へ。
- 再検証: 実 repo 248 U-* 行 violations 0、ddd-tdd-rules 11 tests + doctor EXIT=0 green。

---

## 初回 verdict 全文 (remediate 前)

**Verdict: fail**

**Critical**
- `^\|\s*U-[A-Z0-9]+-[0-9]+\s*\|` is narrower than "U-* row with trailing numeric ID". It only matches one
  name segment before the numeric suffix, so valid multi-segment IDs are skipped. 247 numeric-suffix U rows
  exist by a broader pattern but only 239 are checked. Missed: `U-FR-L1-21-01`, `U-FR-L1-36`,
  `U-DBPROJ-ATOMIC-01`, `U-CHGIMPACT-NONGIT-01`. Direct false-negative against the stated residual.

**Important**
- The new hard rule is not registered in `REQUIRED_RULE_IDS` or the DDD/TDD Rules SSoT. The analyzer policy
  explicitly checks SSoT rule drift, so `unit-oracle-substance` is an active rule outside the declared
  DDD/TDD rule contract. "No new canonical FR" is fine, but the rule must be represented under the existing
  FR-L1-50 / DDD-TDD rule surface.

**Minor**
- `line.split("|")` is not Markdown-table aware; inline `|` inflates cell count. Current rows stay green
  because the final fragment is long, but a valid expected behavior ending near an inline pipe could
  false-positive. Risk, not a current blocker.

On the requested points: final-column-as-expected is acceptable for the current L7 shape but brittle;
L7-only scope is defensible; the `<6` + skeleton marker threshold is reasonable as a minimal hard guard;
overlap with `integration-gwt` is low (L8 GWT vs L7 unit oracle substance are distinct).

Verification run: `bun test tests/ddd-tdd-rules.test.ts` passed; `doctor` reported `ddd-tdd-rules - OK`.
