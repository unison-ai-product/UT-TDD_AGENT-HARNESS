---
memory_id: memory:feedback:pr-337-merged-at-exact-head-a274247d-snapshot-fence-producer-frozen-to-session-log-extension-with-sidecar-under-git-common-dir
kind: feedback
title: "PR 337 merged at exact head a274247d: snapshot fence producer frozen to session-log extension with sidecar under git-common-dir"
tags: ["issue-77", "merge", "plan-recovery-11", "pr-337", "snapshot-fence"]
updated_at: 2026-08-19T07:22:53.728Z
---

PR #337 (PLAN-RECOVERY-11 snapshot fence foreign activity, issue #77) を exact HEAD a274247d9faf1b91acbc48efd7c59d7bcd00c675 で squash merge した。merge commit d6a9f327e151dfeded6a9206ae1db8ae3db2bb66、2026-08-19T07:21:20Z。

満たしたゲート: Claude non-author closing verdict PASS (blocking 0 / advisory 4 carry)、CI run 32226331699 で 3 job SUCCESS、mergeable CLEAN、draft 解除済み、--match-head-commit で exact HEAD に pin。

freeze された契約の要点: producer は既存 src/runtime/session-log.ts の拡張 (両ランタイムの hook から src/cli.ts session start|summary / hook post-tool-use 経由で実際に呼ばれ、session_id を第一級で持つ)。sidecar は <git-common-dir>/ut-tdd-runtime/snapshot-fence/ へ書く。tests/support/git-workspace-fingerprint.ts:40 が root 直下の .git を inventory から除外するため、新たな fence 除外契約を足さずに fenceRoot 外という要件が成立する。.ut-tdd/logs/session/ は worktree 内 = fence 内なので使わない。src/state-db/stop-refresh-coordinator.ts は DB refresh 専用でこの producer ではない。

残 advisory (実装 slice へ carry): event_signature は keyless sha256 で真正性なし (信頼根は権限境界のみ、実測方法未定義)。changed_paths 和集合は revert 系列で偽の不一致 (fail-close 側)。issue #77 の 2026-07-16 実測事象は scope 外 surface (apply_patch) なので本 slice 完了でも #77 の実シナリオは閉じない — disposition 明記が望ましい。

収束の経緯: FLAG のみ返した段階では停滞した。レビュー側が repo 実測から「実在する解」(producer 候補 = session-log.ts、sidecar 置き場 = .git 配下が fence inventory から構造的に除外される) を提示した直後、2 push で収束した (87b26beb は新規 source 案、a274247d で提示どおり既存拡張へ)。設計 freeze の blocking も、実在する選択肢を実測付きで示せば 1〜2 サイクルで閉じる。
