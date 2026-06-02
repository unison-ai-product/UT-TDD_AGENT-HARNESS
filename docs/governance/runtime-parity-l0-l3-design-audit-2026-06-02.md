# Runtime Parity L0-L3 Design Audit (2026-06-02)

## Scope

Claude Code / Codex 共存を前提に、L0 concept / L1 requirements / L2 screen placeholder / L3 functional + L12 test design / governance requirements / active PLAN を上から精読し、件数、trace、review 証跡、TS/Bun 再実装方針の不備を確認した。

本 audit の「Codex 側カバー」は **Codex 用への書き換え**ではない。Claude Code と Codex が同じ `ut-tdd` core / governance rules を参照し、`standalone` / `claude-only` / `codex-only` / `hybrid` の各 mode で同一判定・同一 exit code を保つための runtime parity audit である。

参照した主な正本:

- `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`
- `docs/design/harness/L1-requirements/*.md`
- `docs/design/harness/L2-screen/*.md`
- `docs/design/harness/L3-functional/*.md`
- `docs/test-design/harness/L1-operational-test-design.md`
- `docs/test-design/harness/L3-acceptance-test-design.md`
- `docs/migration/internal-asset-inventory.md`
- `docs/plans/PLAN-L1-*.md`, `docs/plans/PLAN-L3-*.md`, `docs/plans/PLAN-RECOVERY-01-internal-asset-recovery.md`

## Fixed Defects

| ID | Severity | Defect | Fix |
|---|---|---|---|
| C-L0L3-01 | Critical | BR-22 追加後も business 件数が `BR 9 件` のままで、BR-22 が件数宣言から漏れていた | business 件数を BR 10 件へ更新 |
| C-L0L3-02 | Critical | BR-22 が OT-22 に紐付いていたが、OT-22 は FR-L1-37/39/40/41/42 用で ID 衝突していた | BR-22 専用の OT-46 を追加し、BR-22→OT-46 へ修正 |
| C-L0L3-03 | Critical | G1-trace R1/R3 が BR-22 / FR-L1-45 追加前の `12 件 / P0 18 件` のままだった | L0 concept / requirements / L1 screen / L1 OT / L1 PLAN を `13 件 / P0 19 件` へ更新 |
| C-L0L3-04 | High | BR-22 が screen trace に接続されておらず、R1 で孤児化する状態だった | BR-22 を HM-02 / HM-05 / GD-01 に接続し、HM-02 reverse trace に FR-L1-46〜49 を追加 |
| C-L0L3-05 | High | L3 acceptance G3-trace R1/R2 が旧い P0 18 件 / 18 FR 式のままで、FR-45 / workflow core / BR-22 carry を説明できていなかった | L3 acceptance の R1/R2 を L3 FR 26 件 + BR-22 carry + AT 117 件に合わせて更新 |
| C-L0L3-06 | High | requirements / extraction plan / inventory に Python port / 移植前提が active requirement として残っていた | TS/Bun 再実装、markdown/docs curate、無修正参照のみの 3 区分へ更新 |
| C-L0L3-07 | High | command 資産分類が W12/W16 のみで builder=W11 を落としていた | FR-L1-48 / inventory / L4 function に W11/W12/W16 と `ut-tdd builder` を反映 |
| C-L0L3-08 | High | single-runtime gate review の証跡が `self-review` 表現のままで、naive self-review と区別しづらかった | `intra_runtime_subagent review (code-reviewer checklist)` と `review_kind: intra_runtime_subagent` を明記。Claude Code / Codex 共存時の cross-agent review は維持 |
| C-L0L3-09 | Medium | Recovery 証跡が stale な `vitest 66 pass` のままだった | 2026-06-02 再検証 `vitest 85 pass` に更新 |

## Current Carry / Not A Defect

| Area | Status | Rationale |
|---|---|---|
| L2 screen sub-docs | intentional placeholder | `L2-screen/README.md` で L0→L3 時点の明示 carry として扱い、PLAN-L2-01〜04 で本確定する規約がある |
| L2 wireframe | optional / case-by-case | Low-Fi は harness 内保持がデフォルト、High-Fi は外部依頼含め案件判断 |
| `vendor/helix-source/**` | read-only reference | runtime 正本・無修正実行入力にしない。historical evidence / regression idea としてのみ参照可 |
| `docs/migration/v2-import-ledger.md` の古い pass 数・件数 | historical ledger | 当時の監査履歴として残す。現行正本値は concept / requirements / L1-L3 docs 側で上書き済み |

## Classification: TS vs Reuse

| Class | Target | Decision |
|---|---|---|
| TS/Bun reimplementation required | `cli/lib/**`, `cli/helix-*`, hook guard / lint / runtime 判定 | `src/**` と `ut-tdd` subcommand に作り直す |
| Curate / modify without TS literalization | subagent prompt, skill body, command docs, plan/handover/team templates | markdown / docs / templates として UT-TDD 正本へ取り込み、registry / catalog / injector / CLI behavior は TS |
| No-modification reference only | `vendor/helix-source/**`, `docs/v2/**`, old PLAN / audit evidence | runtime 転用不可。evidence / reference のみ |

Runtime として修正せず転用できるものは 0 件。

## Verification Evidence

- `rg` residual check: active docs の `BR 9`, `BR 12`, `P0 18 件のみ`, `P0 18 件 = FR-01〜18`, `FR-L1 42 件`, `OT-22 + BR-22`, `porting-map W12/W16`, `Python コード`, `移植要件`, `移植候補`, `移植済み` は解消 (末尾 2 パターンは下記 Post-Review Additional Fixes で追補解消)。残りは historical ledger / superseded map / legacy seed test 記録。
- `bun run typecheck`: pass
- `bun run test`: pass (12 files / 85 tests)

## Post-Review Additional Fixes (2026-06-02, intra_runtime_subagent review)

commit 前の review 前置 (`code-reviewer` + `pmo-sonnet` 並行、`claude-only` の cross-agent 代替) で、上記 9 件の fix 後も **同一文脈で stale なまま残った件数表記 4 箇所**を検出 → 本 commit に同梱して解消した。機械検証 (vitest 85 pass) は全件 green を維持。

| ID | Severity | 残存 stale | Fix |
|---|---|---|---|
| R-01 | Important | `L3-acceptance-test-design.md` §0 量閉じ原則が `P0 18 件 = FR-01〜18` のままで、同 doc §4 R2 の `L3 FR 26 件` と矛盾 | §0 を `L3 FR 26 件 (= FR-01〜18 + FR-45 + workflow core 7 件)` へ更新 |
| R-02 | Important | 同 doc §2 量閉じ一覧 functional 節が `18 FR × 3 AC = 54` のままで FR-45 / workflow core 7 件を孤児チェックから落としていた | §2 functional 節を L3 FR 26 件へ更新し §1.4 件数まとめ (AT-FR 79 件) を参照 |
| R-03 | Important | `screen-requirements.md` HM-01 画面仕様が `FR-L1 42 件` (中間値) のままで、同 doc §5.3 の `FR-L1 P0 19 件 / 46 件版` と矛盾 | HM-01 一覧行・情報要素を `FR-L1 46 件` へ更新 |
| R-04 | Important | `PLAN-L1-02` §3.1 見出しが `P0 18 件優先` のままで、同 PLAN §0/§7 carry note の `P0 19 件` と矛盾 | 見出しを `P0 19 件優先` へ更新 |

**accepted-historical (修正せず carry)**: `PLAN-L1-02` §6 DoD `[x] P0 18 件翻案完了 (PO 承認済 2026-05-28)` は FR-L1-45 追加 (A-49) 前の milestone 記録のため日付つきで保持。`L1-operational-test-design.md` OT-14 `FR-L1-01〜35 (P0 18 件)` は HELIX 由来 35 件中の P0 サブセットを正しく指すため保持。`v2-import-ledger.md` / `docs/archive/**` の旧件数は historical ledger / superseded として許容。

## Residual Risk

- L2 screen placeholder の `pair_artifact: (TBD...)` は現 validator が L2 placeholder を対象にした場合に invalid frontmatter として扱われる可能性がある。現設計上は明示 carry だが、L2 PLAN-L2-01〜04 着手時に placeholder exemption / replacement を機械検証に接続する必要がある。
- historical ledger は旧件数・旧 pass 数を大量に含む。履歴保持として許容するが、AI が ledger を current state と誤読しないよう、今後 ledger 参照時は正本 doc の現行値を優先する。
