# spec-ir-invalid-subdoc トリアージ表 (2026-07-13)

対象: `signal_type=detector_route_candidate:spec-ir-invalid-subdoc` の 22 件
(`bun src/cli.ts feedback list --json` から抽出、`created_at: 2026-07-13T08:40:31.073Z` 一括生成)。

## 前提 (整合確認済み)

- 判定基準は既存 `docs/plans/PLAN-L7-429-spec-ir-detector-scope.md` §1 の 2026-07-13 確定 triage
  (cluster A/B/C) と一致することを、22 件それぞれ実 doc 参照して裏取りした。
- 真正/誤検知の判定基準は cluster F (`git show 42cb1667`) と揃えた: 「参照先パスが実在しない/リネーム
  未追随」= 真正、「detector の除外条件不足によるメタ doc 誤判定」= 誤検知。
- detector 実装 (`src/state-db/spec-ir-projections.ts`) の修正は本タスクの scope 外 (docs-only)。
  cluster B の是正は `PLAN-L7-429` (add-impl, draft) が担当し、本 triage はその追認。

## 仕分け表

| # | finding (doc / subdoc key) | 対象 doc | 参照/frontmatter 根拠 | 判定 | 根拠 |
|---|---|---|---|---|---|
| 1 | L1:L1-business-requirements | `docs/design/harness/L1-business-requirements.md` | 5-way split 後の空 "(moved)" stub | 解消済み (真正だったが対応完了) | commit `09a51747` (2026-07-13) で stub 削除済み。detector 検知後・再走査前のstale finding。cluster C。 |
| 2 | L2:README | `docs/design/harness/L2-screen/README.md` | frontmatter `doc_type: index` | 誤検知 (detector改善候補) | メタ doc (index) を `shouldValidateDesignSubDoc` が除外できていない。cluster B。 |
| 3 | L3:README | `docs/design/harness/L3-functional/README.md` | frontmatter `doc_type: index` | 誤検知 (detector改善候補) | 上記と同型。cluster B。 |
| 4 | L3:roadmap | `docs/design/harness/L3-functional/roadmap.md` | frontmatter `doc_type: verification-roadmap` | 誤検知 (detector改善候補) | メタ doc (verification-roadmap) 除外条件欠落。cluster B。 |
| 5 | L6:agent-slots | `docs/design/harness/L6-function-design/agent-slots.md` | 独自 topic 命名 sub_doc | 真正・既知 (対応先 PLAN-L7-245) | ファイル実在確認済み。PLAN-L7-245 (draft) が VALID_SUB_DOCS 拡張で引き取る scope。 |
| 6 | L6:backfill-pairing | 同上 `backfill-pairing.md` | 同上 | 真正・既知 (対応先 PLAN-L7-245) | 同上 |
| 7 | L6:context | 同上 `context.md` | 同上 | 真正・既知 (対応先 PLAN-L7-245) | 同上 |
| 8 | L6:descent-obligation | 同上 `descent-obligation.md` | 同上 | 真正・既知 (対応先 PLAN-L7-245) | 同上 |
| 9 | L6:forced-stop-feedback | 同上 `forced-stop-feedback.md` | 同上 | 真正・既知 (対応先 PLAN-L7-245) | 同上 |
| 10 | L6:fr-unit-coverage | 同上 `fr-unit-coverage.md` | 同上 | 真正・既知 (対応先 PLAN-L7-245) | 同上 |
| 11 | L6:function-spec-addendum (governance-enforcement) | 同上 `governance-enforcement.md` | 同上 | 真正・既知 (対応先 PLAN-L7-245) | 同上 |
| 12 | L6:graph | 同上 `graph.md` | 同上 | 真正・既知 (対応先 PLAN-L7-245) | 同上 |
| 13 | L6:handover-mechanism | 同上 `handover-mechanism.md` | 同上 | 真正・既知 (対応先 PLAN-L7-245) | 同上 |
| 14 | L6:memory | 同上 `memory.md` | 同上 | 真正・既知 (対応先 PLAN-L7-245) | 同上 |
| 15 | L6:module-drift | 同上 `module-drift.md` | 同上 | 真正・既知 (対応先 PLAN-L7-245) | 同上 |
| 16 | L6:review-evidence | 同上 `review-evidence.md` | 同上 | 真正・既知 (対応先 PLAN-L7-245) | 同上 |
| 17 | L6:secret | 同上 `secret.md` | 同上 | 真正・既知 (対応先 PLAN-L7-245) | 同上 |
| 18 | L6:session-log | 同上 `session-log.md` | 同上 | 真正・既知 (対応先 PLAN-L7-245) | 同上 |
| 19 | L6:setup-solo-team | 同上 `setup-solo-team.md` | 同上 | 真正・既知 (対応先 PLAN-L7-245) | 同上 |
| 20 | L6:skill-admission | 同上 `skill-admission.md` | 同上 | 真正・既知 (対応先 PLAN-L7-245) | 同上 |
| 21 | L6:skill-index | 同上 `skill-index.md` | 同上 | 真正・既知 (対応先 PLAN-L7-245) | 同上 |
| 22 | L6:vmodel-pair-freeze | 同上 `vmodel-pair-freeze.md` | 同上 | 真正・既知 (対応先 PLAN-L7-245) | 同上 |

## 集計

- 真正 (要修正、既存 PLAN が引き取り済み) = 18 件 (# 5-22、cluster A → `PLAN-L7-245`、draft)
- 誤検知 (detector 改善候補) = 3 件 (# 2-4、cluster B → `PLAN-L7-429`、draft)
- 解消済み (真正だったが既に対応完了、stale finding) = 1 件 (# 1、cluster C、commit `09a51747`)
- 保留 = 0 件
- 合計 = 22 件

本 triage は `PLAN-L7-429` §1 の確定内容 (cluster A=18 / B=3 / C=1) と 1 対 1 で一致することを
22 件全件の実 doc 参照で裏取りした (新規判定なし、既存 PLAN 判断の追認)。

## 修正実施

本タスクは docs-only スコープで、機械的に安全な単純参照修正の対象は無かった (今回の 22 件は
「detector 側の除外条件不足」または「機能追加相当の sub_doc schema 拡張」であり、いずれも
判断を伴う実装変更のため、既存 add-impl PLAN (`PLAN-L7-429` / `PLAN-L7-245`) の scope に留め、
本 triage では doc 修正を行っていない)。cluster C の対象ファイルは既に別コミットで削除済み。

## 推奨次アクション

1. `PLAN-L7-429` (draft) を実行し、cluster B 3 件の detector 除外条件を追加する
   (`shouldValidateDesignSubDoc` に `doc_type: index` / `doc_type: verification-roadmap` 除外)。
2. `PLAN-L7-245` (draft) を実行し、cluster A 18 件の `VALID_SUB_DOCS` 拡張または
   supplemental role 区別 lint を追加する。
3. cluster C (# 1) は再走査 (`bun src/cli.ts doctor` 等) で finding が自然消滅することを確認し、
   消滅しない場合は projection 側の再生成漏れとして別途起票する。
4. 上記 2 PLAN が完了した時点で本 triage の 22 件は 0 件に収束する想定。再走査結果が
   この想定とずれた場合は差分を `PLAN-L7-429` の review Step で説明する (PLAN 本文に既定済み)。

## 注意点

- 本表は `.ut-tdd/` 配下の監査証跡であり、PLAN 本体の正本ではない。判断の一次情報は
  `docs/plans/PLAN-L7-429-spec-ir-detector-scope.md` / `docs/plans/PLAN-L7-245-sub-doc-schema-integrity.md`
  を参照する。
- `spec-ir-orphan-relation` (53 件、同日生成) は別 signal_type であり本 triage の対象外
  (`PLAN-L7-429` §1 cluster D/E に既述)。
