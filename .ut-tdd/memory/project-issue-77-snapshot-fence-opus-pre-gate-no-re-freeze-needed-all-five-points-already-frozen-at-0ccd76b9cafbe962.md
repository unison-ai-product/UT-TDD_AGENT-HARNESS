---
memory_id: memory:project:issue-77-snapshot-fence-opus-pre-gate-no-re-freeze-needed-all-five-points-already-frozen-at-main-2f3f15af-by-pr-337-luna-cleared-with-three-conditions
kind: project
title: "Issue 77 snapshot fence Opus pre-gate: no re-freeze needed, all five points already frozen at main 2f3f15af by PR 337; luna cleared with three conditions"
tags: ["cleared", "issue-77", "luna", "plan-recovery-11", "pre-gate", "snapshot-fence"]
updated_at: 2026-08-19T10:54:28.830Z
---

Issue #77 / PLAN-RECOVERY-11 snapshot fence の Opus pre-gate 結果: **再 freeze 不要。要求された 5 点は main 2f3f15af で既に freeze 済み**。luna 実装へ進んでよい (下記 3 条件付き)。

通知は「foreign evidence / producer と runner の session 分離 / fenceRoot 外 sidecar / multi-event aggregation / residual 優先 fail-close を Opus pre-gate で freeze せよ」と要求したが、これは **PR #337 (d6a9f327、Claude closing PASS blocking 0 / advisory 4、exact HEAD a274247d) で既に完了している**。main の PLAN-RECOVERY-11 (158 行) を読み直して 5 点すべての着地を確認した。重複 freeze は drift 源になるので行わない。

注意 (基準点): ローカル working tree の PLAN-RECOVERY-11 は 97 行の **stale** 版だった (branch feat/plan-l7-465-d3-trusted-custody が古い)。判定は origin/main の 158 行版に対して行った。CLAUDE.md「引き継ぎ・検証の基準点 = HEAD」のとおり。

## 5 点の着地確認 (main 2f3f15af の PLAN-RECOVERY-11)

1. **foreign evidence**: schema_version=snapshot-fence-foreign/v1、event_id / producer_session_id / runner_session_id / before_head / after_head / changed_paths / observed_at / event_signature。event_signature = sha256(canonical(changed_paths_sorted|before_head|after_head))。有効条件も明記 (run の開始・終了時刻内、実測差分と集合一致、producer_session_id != runner_session_id)。sidecar 欠落・不正・期限外・不一致、および changed_paths が testOwnedPaths と交差する場合は foreign と認定しない。
2. **producer/runner session 分離**: producer_session_id != runner_session_id を検証条件に明記。producer は src/runtime/session-log.ts の拡張 (両ランタイムの hook から実際に呼ばれ session_id を第一級で持つ)。test code 自体は sidecar を書けない境界を前提とする、と明記。
3. **fenceRoot 外 sidecar**: <git-common-dir>/ut-tdd-runtime/snapshot-fence/。tests/support/git-workspace-fingerprint.ts:40 が root 直下の .git を inventory から除外するため、新たな除外契約を足さずに fenceRoot 外が構造的に成立する。worktree 内の .ut-tdd/logs/session/ は fence 内なので使わないと明記。
4. **multi-event aggregation**: observed_at 順に時系列集約。before_head = 先頭 event の before_head、after_head = 最後 event の after_head、changed_paths = 和集合。時系列不連続 (prev.after_head != next.before_head) は unknown として検証不能 → 残留扱いへ倒す。
5. **residual 優先 fail-close**: テスト残留候補が 1 件でもあれば foreign の有無に関係なく fail-close、indeterminate へ降格しない。foreign のみなら fence_indeterminate_foreign_activity (exit code 2、再実行指示付き)。分類不能な差分は残留候補として fail-close。HEAD 移動だけでは foreign にしない。CANDIDATE-R11-004 が同時発生を固定。

## luna 実装の条件 (3 点)

- **C-1 (generates 昇格)**: PLAN-RECOVERY-11 は status: draft のまま。実装対象 (tests/support/git-workspace-fingerprint.ts、tests/global-setup.ts、src/runtime/session-log.ts、docs/test-design/harness/L7-unit-test-design.md) を **実装 commit と同じ commit で generates へ昇格**し confirm と対で閉じる。先行宣言は merged-plan-status / duplicate-artifact-ownership を fail-close させる。特に src/runtime/session-log.ts は既存 source なので、宣言前に既存 owner PLAN を数えること (2 件目の宣言かつ ownership baseline 非登録なら即赤化する。#338/#339 で 3 回踏んだ罠)。
- **C-2 (A-1 の信頼根を実測で閉じる)**: event_signature は keyless sha256 で真正性を持たない。信頼根は「test code が sidecar を書けない権限境界」ただ 1 つであり、freeze 本文もその実測を実装 PR へ委ねている。実装 PR は producer session と runner session の分離、および fenceRoot 外の sidecar write/read を **実測して固定する**こと。prose で主張しない。
- **C-3 (#77 の disposition を明記する)**: **本 slice を完了しても issue #77 の実シナリオは閉じない**。#77 の 2026-07-16 実測事象は apply_patch 等の外部 API 呼び出し面で発生しており、freeze はこの surface を明示的に対象外 (unknown → 従来どおり Red) としている。AC にも「当該 surface 外で発生した差分は観測不能として unknown 扱い」と書かれている。したがって **実装完了をもって #77 を close しない**。残余 surface の扱いを #77 のコメントか後続 issue に残すこと。これは advisory A-3 の carry。

## carry している他の advisory

A-2: changed_paths の和集合は revert 系列 (A→B→A) で実測差分と一致せず偽の不一致になりうる。fail-close 側なので blocking ではないが、正常な foreign 活動が indeterminate ではなく Red になる偽陽性が残る。A-4: PLAN 本文の list marker 混在 (* と -)。

## 対の状態

PLAN-REVERSE-77-snapshot-fence-foreign-activity-backfill は kind=reverse / workflow_phase=R0 / status=draft (updated 2026-08-18) で実在する。PLAN-RECOVERY-11 は kind=recovery / backprop_decision=not_required + 理由あり / aim slot あり (recovery route の要件を満たす)。

実装 = gpt-5.6-luna、Opus は非著者 closing review。Claude は PR 運用担当であり実装しない。
