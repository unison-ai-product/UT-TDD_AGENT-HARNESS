# PLAN の仕分け (設計正本への移行の前段)

v4 工程 ② (PLAN を設計へ反映して設計正本を凍結する。#530 の PO 決定 6051336079、補足 6051373331、進行 6052098864) の最初の段として、`docs/plans/` の PLAN 1004 本を仕分けた結果です。#648 の移行手順 (意味分類 → 三者照合 → 移行証跡) の前段に当たります。基準は main `3581ee5c` (2026-10-08) です。

全件の区分は [plan-design-migration-triage.tsv](plan-design-migration-triage.tsv) にあります。列は `plan_id` / `class` / `source` (判定の出どころ) / `reason` です。

## 結果

| 区分 | 意味 | 件数 | 扱い |
|---|---|---:|---|
| A | 移行対象。設計契約が PLAN にしか無い | 13 | 工程 ② で設計文書へ移す |
| N | 移行しない。契約が設計文書にある、本文が 4 項目相当、または作業記録だけ | 672 | そのまま凍結する |
| C | supersede 済み。後継が frontmatter か本文に明記されている | 16 | 凍結する |
| D | 廃止予定。v4 で廃止が決まった対象だけに関わる | 8 | v4 で廃止する |
| E1 | 生きた draft。紐づく issue が open | 56 | issue と一緒に、該当する工程で処理する |
| E2 | 放置 draft。issue が closed か、無い | 239 | 廃止候補 |
| 計 | | 1004 | |

## A: 移行対象 13 本と移行先の候補

| PLAN | 移行が要る契約 (設計文書に無いもの) | 移行先の候補 |
|---|---|---|
| PLAN-L4-30-execution-ledger-github-architecture | ExecutionEvent / recurrence_id / reentry_policy | L4 function.md、L5 physical-data.md |
| PLAN-L4-32-resource-governed-execution-kernel | ExecutionSpec / ExecutionEvent の journal、OS の process-tree custody | L4 architecture.md、L5 internal-processing.md |
| PLAN-L5-23-execution-ledger-github-physical-data | (episode_id, event_sequence) などの key、execution_evidence_refs | L5 physical-data.md |
| PLAN-L6-50-execution-assignment-ledger | assignment-target-missing などの error code、archived_reason | L6 function-spec.md (または新設) |
| PLAN-L6-63-pack-staged-release-rollback | artifactInventoryDigest / validSymlink / releases.<id>.artifacts[]、設計判断節 (§8) | L6 release-channel-manifest.md |
| PLAN-L6-64-cli-shell-completion | PowerShell 登録、--cursor / --list、PO 採択の記録 | L4 external-if.md |
| PLAN-L6-832-plan-revise-omission-preserve-contract | admission.clear / bindPlanSourceToAdmission / 省略時の保存 | L5 internal-processing.md |
| PLAN-L7-365-harness-db-currency-hook | rebuild の trigger と staleness の判定 | L6 function-spec.md |
| PLAN-L7-419-forward-fsm-transition-workflow-cli | state × event × evidence の遷移契約、workflow status / explain | L6 function-spec.md (Forward FSM 節) |
| PLAN-L7-451-github-ops-phase1-visibility-and-policy | github-ops の方針 (PO 採択 2026-07-17) | L4 security.md (または新設) |
| PLAN-L7-497-green-command-anchor-required | 全 entry 必須、可変参照の禁止、実在検査の撤回 (A/B/C の判断) | L6 review-evidence.md |
| PLAN-L7-742-release-aggregate-v2-inventory-cardinality | 基数の契約 (採用 A2)、entries[].path と destinationPath の対応 | L6 release-channel-manifest.md |
| PLAN-RECOVERY-20-merged-plan-premerge-landing | landed_on_target / classifyTargetArtifacts の契約と不変条件 | L4 architecture.md (merged-plan-status 節) |

移行先は候補です。三者照合 (PLAN・設計文書・実装) のときに確定します。

## 判定の方法

1. **機械集計**: 全 PLAN の frontmatter と本文から、kind / layer / status / 更新日 / 本文の行数 / 設計判断の節の有無 / supersede の記載 / docs/design への参照数を取りました。
2. **2 モデルでの独立判定**: 同じ規則を Haiku 5.5 と Sonnet にそれぞれ与え、node スクリプトで一括判定しました。「移行済み」と「作業記録だけ」を同じ「移行しない」とみなすと、1004 本中 916 本 (91.2%) で一致しました。一致したものは、その区分を採用しています。
3. **本文での判定**: 判定が食い違ったもの、両モデルが保留にしたもの、両モデルが A と判定したもの、計 125 本を本文で判定しました。決め手は「その契約の文が docs/design / docs/test-design に既にあるか」です。各 PLAN の設計判断の語を設計文書全体で照合し、A の候補は主要な語を grep で確かめました。保留は 0 本です。
4. **抜き取り確認**: A のうち 2 本を control が実物で確かめました。PLAN-L7-497 は PLAN に `anchor` が 36 件あるのに、review-evidence.md には 0 件です。PLAN-RECOVERY-20 は PLAN に `landed_on_target` があるのに、設計文書とテスト設計には 0 件です。

## 限界

- N の大半は機械照合による判定で、全文は読んでいません。三者照合の段で A に変わるものがありえます。根拠が弱い N は次のとおりです: PLAN-L7-493 (語の一致率 63%、専用のテスト設計が無い)、PLAN-L7-455 / 461 (CI lane の方針)、PLAN-L7-428 (stage-bound の語が 0 件)、PLAN-L7-453 (一致率 32%)、PLAN-L7-462 (Bun の撤去。D の可能性あり)。
- PLAN-L4-02 と PLAN-L4-32 は、frontmatter の supersedes が自分自身を指しています (#209 の自己 supersede)。C にはしていません。
- E1 / E2 は、紐づく issue の open / closed で分けています。issue 番号が無い draft は E2 です。

## 次の段

1. 設計書を保護する gate (#898) を先に入れます (補足 6051373331)。
2. A の 13 本を、移行先が近いものごとに 2〜3 本の PR にまとめ、#648 の手順で移します。
3. E2 (239 本) の廃止と、D (8 本) の扱いは、v4 の移行 (工程 ④〜⑥) でまとめて決めます。
