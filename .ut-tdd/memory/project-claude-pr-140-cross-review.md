---
memory_id: memory:project:claude-pr-140-cross-review
kind: project
title: "Claudeへの依頼: PR #140 merged-plan canonical target cross-review"
tags: ["claude", "cross-review", "issue-138", "merged-plan", "pr-140", "stacked-pr"]
updated_at: 2026-07-23T10:58:00+09:00
---

Codex起票PR #140の非author cross-reviewをClaude側へ依頼する。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/140
- branch: `fix/issue-138-merged-plan-target-evidence`
- base: `main`
- Issue: #138
- 変更概要: stacked PRのimmediate base SHAをmainへlanded済みと誤認していた`merged-plan-status`を、repository default branchのcanonical target evidenceへ固定する。
- 重点レビュー:
  - immediate base ref/SHAが証拠に残るだけでlanded判定へ使われないか。
  - target ref/SHA、subject HEAD、merge-baseのbindingが十分か。
  - Git repoでtarget解決不能時にworking treeへfail-openしないか。
  - 非Git fixtureのdisk fallback互換が本番Git判定へ漏れないか。
  - main上の真のdraft負債を隠さず、stack親PRの未merge成果物だけを除外するか。

初回HEAD `2c989a3e`のblind reviewはFLAG: 任意ref override、非main defaultのmain横滑り、artifact decision破棄、境界test不足。HEAD `79b8e796`でoverrideを削除し、known default解決失敗をfail-close化、artifact decisionsをPLAN rowへ保持、負例を追加した。CI detached checkoutではremote refが無いことが判明したため、HEAD `09c262f9`で`pull_request.base.ref == repository.default_branch`のときだけevent base SHAをcanonical targetとして採用する。stacked PR (`base.ref != default`) は採用しない。Recovery必須`aim`も追加済み。

最新TDD証拠: target evidence 6件 + plan-lint 63件Green、既存merged-plan-status 14件は前HEADでGreen。Biome対象3ファイルGreen。最新HEAD `09c262f9`を再度claim-blind / spec-blindレビューし、初回3攻撃が引用で反駁できるか確認すること。

**Codex独立再review**: claim-blind PASS / spec-blind PASS-WEAK。GitHub CI run `29972640499`はWindows Green、Linuxはmainの真負債 `PLAN-L7-452` / `PLAN-RECOVERY-16`だけでRed。Issue #138対象の`PLAN-L7-454` stacked-base false positiveは消滅し、PR #140固有Red=0。main負債を隠さない設計どおりの結果であり、PR #117収束後に再CI・mergeする。

**2026-07-23 Claude blind review 完了 (旧HEAD `2c989a3e`)**: 総合FLAG (機能欠陥なし)。focus 1/2/4/5 PASS (80件独立worktree Node実走green、fail-close throwはprobe実走で挙動確認、main draft負債PLAN-L7-452/RECOVERY-16は隠されないことを実確認)。FLAG根拠 = fail-close throwのcommitted回帰テスト0件 (PLAN-RECOVERY-17「Red化」主張未実証)。追加所見: 本PR merge後にPLAN-RECOVERY-17自身が自己言及violationとしてsurfaceするためaccept時confirm必須。結果はPR #140コメント (issuecomment-5053447033) に記録済み。**新HEAD `09c262f9` の再review 完了 (2026-07-23)**: 総合**PASS (merge可)**。初回3攻撃は全反駁 (override完全除去 grep 0件 / 非main default fail-close test L139 / artifactDecisions保持 test L102-106)、前回FLAGのfail-close throw回帰テストもtest L117で解消 — いずれも独立worktreeでNode実走PASS (計83 green + Biome clean、Windows)。event base SHA限定採用の敵対検証: spoof probe P1でstacked注入経路の遮断を実証、P2 (base.ref==default偽装時のancestry無検証採用) はGitHub制御プレーン生成のため脅威モデル外の信頼境界 — PLAN/ADRへの文書化推奨 (任意)。**merge条件: accept時にPLAN-RECOVERY-17をconfirm** (自己言及violation回避)。結果はPR #140コメント (issuecomment-5053485042) に記録済み。Claude側review作業はこれで完了、残待ち: PR #117収束後の再CI・merge判断 (Codex/PO側)。
