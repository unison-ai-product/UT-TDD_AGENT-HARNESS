---
memory_id: memory:feedback:pr-341-merged-at-exact-head-19d26a47-as-2f3f15af-open-prs-now-0-a-2-contract-ambiguity-carried-to-s2-pair-freeze
kind: feedback
title: "PR 341 merged at exact HEAD 19d26a47 as 2f3f15af; open PRs now 0; A-2 contract ambiguity carried to S2 pair-freeze"
tags: ["advisory-a2", "exact-head", "merged", "plan-reverse-473", "pr-341", "r4"]
updated_at: 2026-08-19T10:48:51.641Z
---

PR #341 (PLAN-REVERSE-473 R4 backfill) を merge した。exact HEAD 19d26a471aac322543d28eeecb2a5b5536cb12de、squash merge commit 2f3f15af0e221deff792fc137c6fe2f6c61aad44、mergedAt 2026-08-19T10:47:49Z。open PR は 0 件になった。

merge 根拠: CI run 32243313698 を headSha で照合して 19d26a47 に一致、conclusion=success、harness-check / harness-check-linux / harness-check-windows の 3 つとも pass、完了 2026-08-19T10:46:01Z。gh pr view で mergeStateStatus=CLEAN。merge は --match-head-commit 19d26a47… 付きで実行した。remote branch docs/issue224-r4-473 は削除済み。local branch 削除は worktree ~/ut-r4-473 が保持しているため失敗したが、これは Codex 側の worktree なので Claude は触らない (hybrid 協調規律)。

最終 HEAD 19d26a47 の内容確認: 7fbe432a からの差分は R4 closing evidence 1 ブロックの追加のみ。Codex は worker_model に gpt-5.6-sol を入れた。Claude は「R3 entry の gpt-5.6-sol を流用するな」と指示していたが、R4 backfill は検証/設計タスクであり repo の task-kind routing 上 gpt-5.6-sol が正しい割当なので受け入れた (著者しか知り得ない値であり routing 表とも整合、provider 分離も成立)。

Claude が提示した YAML の誤りを Codex が正しく訂正した点を記録する: Claude は kind: ci / runner: github-actions を提案したが、src/schema/frontmatter.ts:191-203 の enum は kind = unit_test|integration_test|typecheck|lint|doctor|vmodel_lint|smoke、runner = bun|powershell|bash|ci であり、Claude 案のままなら CI が赤化していた。Codex は integration_test / ci へ翻訳した。review で YAML を提示するときは enum を先に確認すること。

未完として持ち越す advisory (FLAG-2、R4 blocking にしなかったもの): L6 doc docs/design/harness/L6-function-design/release-channel-manifest.md の §5 Post は「rollback 可能な fault は not_applied」を契約として確定させているが、A-2 が指したのは apply 成功後に discardStaging が失敗し restoreDestination が成功する経路で、現行実装ではこれが「成功した publish を巻き戻して applied: 0」になる。§6 は同じ点を S2 実装前に閉じる未解決 advisory として残しており、どちらが正本か R4 時点で一意でない。加えて PR #336 で freeze した custody 契約 (cleanup 失敗を success → failure に反転させない) と逆向きで harness 内に 2 系統が並立している。S2 pair-freeze で「cleanup 失敗時の最終状態」を §5 の契約として決め直すのか現行契約のまま oracle を足すだけなのかを先に確定させること。実装 PR の中で発明しない。

親 Issue #224 は close していない (依頼どおり)。PF5 advisory A-1〜A-3 は PLAN-REVERSE-473 の完了条件で - [ ] のまま保持されている。
