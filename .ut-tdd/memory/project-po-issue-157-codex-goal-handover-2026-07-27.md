# Issue #157 収束レーン — Codex へのゴール引き継ぎ (2026-07-27, Claude 5時間上限前の handover)

## ゴール (PO 指示)

溜まった open PR を収束させる。main を green に保ちながら、PR を原始的に細かく閉じる。
虚偽 confirm・detector allowlist・恒久 bypass・test skip 化は禁止。

## 現在の到達点 (HEAD 基準)

- main は GREEN (直近 merge #107 まで post-merge run success 確認済み、run 30252344109)。
- 本日 merge 済み: #160 #114 #133 #106 #140 #115 #161 #116 #107 (open 19 → 10)。
- main 負債 (PLAN-L7-452 / PLAN-RECOVERY-16 merged-plan-status) は正規経路で confirm 済み。

## 必須の作業規律

1. **post-merge 罠**: merged-plan-status は PR CI では base tree 判定だが merge 後は main tree 判定。
   merge 前に「PR が持ち込む未 confirm PLAN + deliverable (src/tests/scripts/.claude 配下)」を必ず確認し、
   draft のままなら先に正規経路で confirm してから merge する (虚偽 confirm 禁止)。
2. merge のたびに main の run 終局 (green) を確認する。
3. vitest は `bun scripts/run-vitest-snapshot.ts` 経由 (committed HEAD を測る)。doctor は singleton、並行起動禁止。
4. conflict は main 側を正とし、自 PR の意図ファイルのみ最小解消。
5. `docs/governance/plan-admission-receipts.json` の conflict は rechain 手法
   (main 版を正、branch 追加 record を tail へ再チェーン append。receipt_id/receipt_digest/decision_digest/binding 不変)。
   スクリプト: Claude session scratchpad `rechain-receipts.ts` (usage: bun rechain-receipts.ts <repoRoot> <mainJson> <branchJson> <baseJson> <outJson>)。

## 残 PR と次アクション (診断済み、優先順)

- **#126** (work/l7-457-fence-stream-db-vacuum): CI Red。PLAN-L7-457 は confirm 済み (DoD 8箱 check 済み)。
  最新 run の失敗を診断→最小修正→push→green→merge。
- **#110** (work/recovery-14-db-orphan-closure): 診断済み。
  (A) docs/plans/PLAN-L7-456-gate-run-orphan-projection-fix.md は kind=recovery なのに L7 命名で
  plan-id-naming 違反 → **PLAN-RECOVERY-19-gate-run-orphan-projection-fix.md へ改名** (plan_id/artifact_path/参照追従)。
  (B) main から 190 commit 遅れ → origin/main を merge。
  (C) post-merge 罠: PLAN-RECOVERY-14 / 改名後 RECOVERY-19 の status 要確認。
- **#111** (work/l7-454-token-telemetry-ingestion): 診断済み。
  (A) src/state-db/token-tracker.ts:360 JSDoc にユーザーローカル絶対パス → 一般化 (runtime-portability 違反)。
  (B) tests/token-tracker.test.ts:478 の codexSessionBelongsToRepo assertion に { platform: "win32" } を明示。
  (C) main から 220 commit 遅れ → merge。PLAN-L7-454 status 要確認。
- **#112** (work/l7-455-ci-cost-phase1): 診断済み。158 commit 遅れ → main merge でほぼ解消。
  残るなら orphan-deliverable tests/change-lane.test.ts の deliverable 登録を構造化形式で追記。PLAN-L7-455 status 要確認。
- **#122** (work/add-feature-l6-91-disposition-claim-integrity): 診断済み。158 commit 遅れ → main merge。
  残る plan-governance violation (parent_drive_mismatch=1 / requires_not_ready=1) は PLAN ID を特定して報告
  (判断が要る場合は修正先走り禁止)。PLAN-L6-91 status 要確認。
- **#113** (work/l7-420-strict-evidence-gates): 診断 subagent 結果未着。CI ログから根因診断が必要。
- **#117 / #125 / #130**: Codex レーン (部分 Red)。同様に stale 診断 → main merge → 修正。
- **#146 / #147 / #156**: 構造判断案件。機械修正で closable でないため PO へ選択肢提示してから着手。

## 注意 (2026-07-27 に起きた失敗)

- Claude から `ut-tdd codex --role se --execute` で #110/#111/#112/#122 の修正を委譲したが、
  `hook: SessionStart Failed` で起動失敗した可能性が高い (ログ /tmp/codex-110.log 等)。
  **上記4本の修正は未実行前提で再着手すること。**
- 発見済み構造課題 (後続起票候補): post-merge 罠 (merged-plan-status の base tree 判定)、
  PLAN 番号衝突が lint 素通り、genesis rev1 の projection 非掲載による cross-asset 検証限界。
