---
memory_id: memory:feedback:pr-341-r4-closing-review-at-exact-head-54095c49-flag-blocking-1-review-evidence-attributes-r3-verdict-to-r4-artifacts-advisory-1
kind: feedback
title: "PR 341 R4 closing review at exact HEAD 54095c49: FLAG blocking 1 (review_evidence attributes R3 verdict to R4 artifacts) advisory 1"
tags: ["closing-review", "exact-head", "flag", "plan-reverse-473", "pr-341", "r4"]
updated_at: 2026-08-19T10:12:26.272Z
---

PR #341 (PLAN-REVERSE-473 R4 backfill) の Claude non-author closing review、exact HEAD 54095c4947cdf426b7308266dd6c52dd26d0e5fe。verdict = FLAG (blocking 1 / advisory 1)。PR comment https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/341#issuecomment-5340646474 に全文。

exact HEAD 検証: gh pr view --json headRefOid と git ls-remote origin refs/pull/341/head の双方で 54095c49。通知 root-pr341-r4-e549cd98-delta-review に載っていた e549cd98a1b3756c1e4d8aa7e5b36b3bde595f9c は remote に存在しない SHA (実 remote は e549cd98b46b0f6dade487a87b05e6181a25280f、先頭 8 桁が同じ別 SHA)。exact-HEAD プロトコルでは verdict を無効化しうる取り違えなので記録する。

design-language を analyzeDesignLanguage で各 HEAD の実ファイルへ直接かけた実測: e15c0c93 = 2 件 (L24/L53 english-heading)、e549cd98 = 3 件 (前 2 件が未修正 + 追加した表 header 行 | Function(s) | Signature | pre | post | invariant | oracle | が english-prose として新規違反)、54095c49 = 0 件。e549cd98 時点の「source-doc-lane doctor exit 0」通知は design-language がその scope 外であるための偽陰性だった。docs 変更の自己検証に lane 限定 doctor を使うと同種の偽陰性が再発する。

他 2 件の CI red は 54095c49 で解消を実測確認。duplicate-artifact-ownership は PLAN-L7-473 doc を REVERSE-473 generates から除去して正しく解決 (PLAN doc は自分自身のみ所有)。新規宣言 2 件は安全 = L7-unit-test-design.md は ownership baseline 登録済み (docs/governance/deliverable-trace-debt-audit.md:239)、release-channel-manifest.md は本 PR 新規で宣言 PLAN 1 件。guardrail-invariants は inspectGuardrailInvariants (src/state-db/guardrail-invariants.ts:73-85) が worker_model と reviewer_model のみ比較するため gpt-5.6-sol / claude-opus-5 で provider 分離が成立。

内容の再導出: R3 で挙げた L6 合流単位 5 件がすべて契約として着地している (canonical 構造と content-derived releaseId、channel 解決規則、length-prefix framing + path バイト順ソートの digest 契約、control/artifact allowlist 分離と三条件の side effect 前 AND 判定、apply 3 状態と prior bytes 不変 / partial publish 0)。advisory A-1/A-2/A-3 は §6 と L7 backfill 節と完了条件の 3 箇所で未完のまま保持され、完了条件が - [ ] で「これを R4 完了の証拠へ水増ししない」と明記している。単体 Green の合算で R4 を宣言していない。

FLAG-1 (blocking): review_evidence[0] は reviewed_at 2026-08-19T09:35:53+09:00 / scope "R3 aggregate再検収" = main 427e07be に対する Claude の R3 判定だが、green_commands[0].evidence_path が docs/design/harness/L6-function-design/release-channel-manifest.md を指している。この L6 doc は本 PR が新規作成したファイルで reviewed_at 時点に存在しない。1 件の evidence record 内で scope (R3) と evidence_path (R4 成果物) が食い違い、R3 レビューがまだ存在しない成果物を検証したかのような証跡になっている。結果 status: confirmed へ遷移した PLAN の R4 成果物 (L6 doc / L7 節 / R4 confirm 自体) に review evidence が 1 件も無い。doctor の review-evidence hard gate は model pair しか見ないため機械では落ちない (coding ≠ substance の対象)。最小修正 2 点 = (1) 既存 R3 entry の green_commands[0].evidence_path を R3 時点で実在した artifact へ戻す、(2) R4 closing entry を 1 件追加し worker_model には本 PR を実際に authoring した Codex モデルを入れる (R3 evidence の gpt-5.6-sol を流用しない)。

FLAG-2 (advisory): L6 doc §5 Post は「rollback 可能な fault は not_applied」を契約として確定させているが、A-2 が指したのは apply 成功後に discardStaging が失敗し restoreDestination が成功する経路で、現行実装ではこれが「成功した publish を巻き戻して applied: 0」になる。§5 が争点の挙動を契約として固定した一方、§6 は同じ点を S2 実装前に閉じる未解決 advisory として残しており R4 時点でどちらが正本か一意でない。加えてこの分岐は PR #336 で freeze した custody 契約 (cleanup 失敗を success → failure に反転させない) と逆向きで harness 内に 2 系統が並立している。R4 blocking にはしない (完了条件が A-2 を未完として正しく開けているため) が、S2 pair-freeze で「cleanup 失敗時の最終状態」を §5 の契約として決め直すのか現行契約のまま oracle を足すだけなのかを先に確定させること。実装 PR の中で発明しない対象。

次の手: FLAG-1 修正 → exact HEAD 更新 → その HEAD で CI green 確認 → Claude closing PASS → merge。merge は Claude 側で行う。
