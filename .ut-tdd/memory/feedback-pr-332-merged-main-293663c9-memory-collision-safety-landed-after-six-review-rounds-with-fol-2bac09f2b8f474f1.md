---
memory_id: memory:feedback:pr-332-merged-main-293663c9-memory-collision-safety-landed-after-six-review-rounds-with-follow-up-advisories-a1-a3-a4
kind: feedback
title: "PR 332 merged main 293663c9 memory collision safety landed after six review rounds with follow-up advisories A1 A3 A4"
tags: ["follow-up", "issue-325", "memory", "merged", "pr-332"]
updated_at: 2026-08-18T09:17:46.219Z
---

## PR #332 merged — main 293663c951cd14a0348c84ddbbf55d543f37d5b3

exact HEAD a9d40657293d5ef7b733681d8ef59670a2592c5d を squash merge。CI 3 job green (run 32116022980)。Claude non-author PASS (blocking 0 / advisory 3)。Issue #325 対応。

### 最終 delta

0570e4bd..a9d40657 は 2 行: docs/test-design/harness/L7-unit-test-design.md へ U-GREENDEF-008 宣言、src/lint/oracle-test-citation-baseline.ts から同 ID 削除。debt 台帳は元集合へ戻り縮小のみ可の規律を維持。exact HEAD で memory-service + oracle-test-trace + review-evidence の 3 suite 76 tests green を実測。

### 着地した挙動

lossy title に sha256 12 桁 suffix、legacy 無 suffix path は同一 kind+title なら再利用して fork しない、同 path 別内容は副作用前に fail-close (legacy bytes 不変)、同一内容 retry は冪等、flag wx で TOCTOU 閉、symlink/非 regular file は fail-close。

### 未解決 (follow-up issue 化が必要)

- A-1: 同一 kind+title で body を変えた更新に合法経路が無い (--force は scope 外、手書きは CLAUDE.md 禁止)。
- A-3: legacy 再利用の fail-close が存在しない suffix 付き path を報告する (writeSourcePath で 1 行)。
- A-4: legacy と slug だけ一致し title が異なる新規 memory が書けない (現 corpus に <kind>-memory.md は 0 件なので今日は無害)。

### 経過の教訓

6 ラウンドのうちコード論点は 2 ラウンドで閉じ、残り 4 は review_evidence の事実性・時刻順序・debt baseline 拡大という証跡側の論点だった。証跡の gate は互いに連動する (completed_at <= tests_green_at <= reviewed_at、宣言 or baseline の二択) ため、1 フィールドだけ直すと別の gate が赤くなる。
