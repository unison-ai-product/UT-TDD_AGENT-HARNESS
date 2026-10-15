# 設計還流 証跡: backflow-s6d (L6 PLAN-L6-16〜30、issue #958)

## 目的

②の完了基準 (PO 2026-10-14、#958 comment 6161185671) に従い、担当 15 PLAN の
使い捨てられないもの (未達 DoD / carry / 実在する依存 / PLAN にしか無い oracle / 責務範囲) を設計文書へ移すか、
既に設計文書にあることを確かめる。各 PLAN は全文を読み、逆方向の参照 (設計文書・test-design が PLAN を指すか) も grep で確認した。

- 基準 commit: `6a50a74834bbc008abd69359e91300c96dd7392d` (origin/main)
- 件数: 使い捨て可 12 / 還流済み 3 / 廃止 0 / 要判断 0 (計 15)

## 一覧

| PLAN | blob sha256 (origin/main) | 区分 | 移し先 (path と節) | 剥離した依存 | 備考 |
|---|---|---|---|---|---|
| PLAN-L6-16-handover-quality | aec8f720ecde8d6884dcd7bb355c1e179507b2ce81fca64e173d20134a4e6d2f | 使い捨て可 | 既存: `L6-function-design/handover-mechanism.md` §2.7 (5 gap)、`L7-unit-test-design.md` U-SLOG-006 / U-HOVER-011〜012 | parent PLAN-L6-06 (完了済み)、L7-17 / REVERSE-16 ペア (完了済み) | DoD 全件 [x]。逆参照: handover-mechanism.md §2.7 見出しと L7 §782 が PLAN-L6-16 を指す |
| PLAN-L6-17-gate-confirm | a0e246c790792aa8aa54175367e06c4c3fc77fc5c922d4033397edf99105baf5 | 使い捨て可 | 既存: `L6-function-design/gate-confirm.md` (§2 関数 / §2.1 DbC / §3 doctor)、L7 U-GCONF-001〜006 | parent PLAN-L6-00-master (完了済み) | 未チェック DoD 3 件はすべて設計・実装・テストで充足済み (`tests/gate-confirm.test.ts`、PLAN-L7-18 / REVERSE 起票済み)。PLAN の「parse 失敗時 fail-open」は古く、設計と実装 (`src/lint/gate-confirm.ts` の `skipped=true, ok=false`) は fail-close。設計を正とする |
| PLAN-L6-18-review-evidence-stale | fe2c6b4ee62959141c4a2deeee0429acf2bf78949625fa90ac807740e17f74d4 | 使い捨て可 | 既存: `L6-function-design/review-evidence-stale.md` §2〜§4、L7 U-REVIEW-007 / 008 | parent PLAN-L6-12 (完了済み) | 未チェック DoD 2 件 (draft+approve 検出 / confirmed+approve・draft 証跡なしは ok) は設計 §3 と `tests/review-evidence.test.ts` で充足 |
| PLAN-L6-19-plan-schedule-lint | 8b3018b33e1fca57b59794d42504acecc943a15a66dbe33c871dad20445a6b6b | 使い捨て可 | 既存: `L6-function-design/plan-schedule-lint.md` §2〜§4、L7 U-PLANSCH-001〜006 | parent PLAN-L6-00-master (完了済み) | 未チェック DoD (欠落検出) は設計 §2 / §4 と `tests/plan-lint.test.ts` で充足。doctor hard/fail-close も §3 に記載済み |
| PLAN-L6-20-runtime-adapter-session-lifecycle | 5cec6f48737a56c8280651ef6013fd7c104a148b44983af78391a70e2cdf4bc0 | 還流済み | `L6-function-design/session-log.md` 「Runtime Adapter Lifecycle 追補」末尾に 4 項目追記 (adapter lifecycle wrapper の契約 / hook 入口の共有と shim / `--task-file` と stdin / provider 解決)。既存: L4 `function.md` §委譲 surface、L7 U-SLOG-007 / U-ADAPTER-001〜013 | requires PLAN-L6-03 (完了済み) | 実装 `src/cli/delegation.ts` を確認して記述。session-log.md には `plan_id` 受け渡しと `session_end` しか無かったため、wrapper の起動前後 lifecycle・handover warnings・`--task-file` の排他契約を補った |
| PLAN-L6-21-fr-unit-coverage | baab19c21bc347be29d1f8e241bf3a98c1aa974fe3b1f0fc4bf6f8bbc9367751 | 還流済み | `L6-function-design/fr-unit-coverage.md` 「Issue #848 の完了条件と後続工程の責務（未達の目標条件）」に、未達 DoD 4 件を目標条件として、後続工程 (Red 登録 → formal 昇格 → 実装 Green) の責務と依存の向きを追記。既存: 同書「Issue #848」節 (退役 coverage 契約)、`function-spec.md` 「Issue #848」節、L7 `CANDIDATE-U-FRCOV-007〜023` (独立した正例・負例を含む) | requires PLAN-L6-00-master (完了済み) は剥離。実在する依存 (設計検収 → Red 登録 → formal 昇格 → 実装 Green、実装 owner は PLAN-L7-22 / REVERSE-21) は設計文書へ移したため PLAN 側では不要 | PLAN は変更しない。旧 DoD の [x] は既存 coverage の歴史的証跡で、#848 追補の完了証跡ではない。改訂 receipt は発行事実だけで review PASS を意味しない |
| PLAN-L6-22-l6-completion-readiness | 49a97f90443699e82e5b89b16b53b7e5730b2a2c3a61e82972f831805689db4a | 還流済み | `L6-function-design/function-spec.md` 「L6 completion readiness 追補」に doctor 配線 (hard/fail-close、`ok = ready`、入力不能は violation) を追記。`L7-unit-test-design.md` U-L6COMP-003 を実装に合わせて是正 | parent PLAN-L6-00-master・`fr-unit-coverage.md` (完了済み) | **設計と実装の差**: L7 U-L6COMP-003 は warn-only と書かれていたが、`src/doctor/process-quality.ts` の `checkL6Completion` は `ok = r.ready` で hard (`check-definition-groups.ts` に `l6-completion` として登録)。実装に合わせて是正した |
| PLAN-L6-23-coding-rules-workflow | 2cf454914a5ddda54f6648bf46725667e3bc39d560c87b839d384aedf1abf400 | 使い捨て可 | 既存: `docs/governance/coding-rules.md`、`module-drift.md` 「Coding Rules 追補」、L7 U-CODE-001〜 | parent PLAN-L6-00-master (完了済み) | DoD 全件 [x]。`CODING-RULE-WORKFLOW` anchor と doctor `coding-rules` 配線も既存 |
| PLAN-L6-24-structured-error-handling | 5e62d22efaf49c947d6b4890a28b65e62b750b5f27e795546961f7298d76305f | 使い捨て可 | 既存: `coding-rules.md` rule `structured-error-handling`、`module-drift.md` 「error handling」、L7 U-CODE-008 | requires PLAN-L6-23 (完了済み) | 空 catch / rethrow-only catch の違反形が設計・oracle に既存 |
| PLAN-L6-25-module-boundary-rule | 4ffa4b0ae27f801f57bbf0790979c0c5a4fdc9b19ddd96daf56d14263430a6c1 | 使い捨て可 | 既存: `coding-rules.md` rule `module-boundary`、`module-drift.md` 「module boundary」(lint / runtime / schema の禁止方向)、L7 U-CODE-009 | requires PLAN-L6-23 (完了済み) | 禁止 import の行列は module-drift.md と `ddd-tdd-rules.md` の domain boundary map に既存 |
| PLAN-L6-26-domain-boundary-lint | f1f173c32dd136bda690a80acae107160c50d5941c5523a5516737adbc1f45aa | 使い捨て可 | 既存: `docs/governance/ddd-tdd-rules.md` (rule `domain-boundary` と boundary map)、`module-drift.md` 「DDD/TDD strictness 追補」、L7 U-DDDTDD-007 | parent PLAN-L6-00-master (完了済み) | FR-L1-50 の trace (L3 functional-requirements) からも指される |
| PLAN-L6-27-invariant-test-trace | 13744dcef4b45412b6a7f1796cf452925b7794b0b69d12ed22631b40e11d6495 | 使い捨て可 | 既存: `ddd-tdd-rules.md` (`invariant-test-trace`、`DDD-INV-*` 宣言形式)、L7 U-DDDTDD-002 | parent PLAN-L6-00-master (完了済み) | — |
| PLAN-L6-28-red-first-tdd-evidence | 4bb46b5d65331419fe1276a943917dbd519be811c86c9aa91c9749f3d12935dd | 使い捨て可 | 既存: `ddd-tdd-rules.md` (`red-first-evidence`、`tdd_red_required` / `red_at <= green_at`)、L7 U-DDDTDD-003 | parent PLAN-L6-00-master (完了済み) | — |
| PLAN-L6-29-test-oracle-strength | d211095ebc6d02edaf334f0c6e52ffe1c6b994a09dd4c2f85b502dbe058fba1e | 使い捨て可 | 既存: `ddd-tdd-rules.md` (`test-oracle-strength`)、L7 U-DDDTDD-004 | parent PLAN-L6-00-master (完了済み) | — |
| PLAN-L6-30-integration-gwt-lint | a7522a905437f688402272a18f01fc2eed66222f4c2bf9fd8f845d9db49ec471 | 使い捨て可 | 既存: `ddd-tdd-rules.md` (`integration-gwt`、workflow placement)、`module-drift.md`、L7 U-DDDTDD-005 | parent PLAN-L6-00-master (完了済み) | 対象の L8 IT 行の GWT 粒度は `L8-integration-test-design.md` が持つ |

## 要判断

なし。PLAN-L6-21 は前版で「要判断」としたが、未達 DoD と後続工程の責務は設計の責務であり、PLAN に保持せず設計文書へ移した (上の表)。

## 触った設計文書

- `docs/design/harness/L6-function-design/fr-unit-coverage.md` (PLAN-L6-21)
- `docs/design/harness/L6-function-design/session-log.md` (PLAN-L6-20)
- `docs/design/harness/L6-function-design/function-spec.md` (PLAN-L6-22)
- `docs/test-design/harness/L7-unit-test-design.md` (U-L6COMP-003 の是正、PLAN-L6-22)
