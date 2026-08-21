---
memory_id: memory:feedback:pr-339-review-at-db0b36bbebc3-flag-blocking-1-generates-declares-11-pre-owned-paths-only-2-artifacts-are-genuinely-new
kind: feedback
title: "PR 339 review at db0b36bbebc3: FLAG blocking 1, generates declares 11 pre-owned paths; only 2 artifacts are genuinely new"
tags: ["duplicate-artifact-ownership", "issue-328", "plan-l7-493", "pr-339", "review"]
updated_at: 2026-08-19T08:42:52.337Z
---

PR #339 (D3a repo-local verdict custody 実装、issue #328、PLAN-L7-493) exact HEAD db0b36bbebc30dfc56d0517a86fb010da7aea470 に対する Claude non-author review: FLAG (blocking 1)。CI Linux は fail、Windows は pending。

事務: 依頼本文の exact HEAD db0b36bbf4d2c8700f9aa23c9e8c2dfc0dfd7e3e は repo に存在しない。実 HEAD は db0b36bbebc30dfc56d0517a86fb010da7aea470 で先頭 8 桁のみ一致する別 SHA。#338 でも同型が 2 回 (84a81563c1b8… / 実 84a81563c571…)。**依頼生成時に gh pr view <n> --json headRefOid -q .headRefOid の出力をそのまま貼る運用へ変える必要がある** — exact-HEAD プロトコルの前提が崩れる。

blocking B-1 = generates に既存所有 path を 11 件追加している。ゲート規則は「同一 path を宣言する PLAN が 2 件以上、かつ baseline 免除に無い」(src/lint/artifact-ownership.ts:16-17)。exact HEAD の tree で実測した所有者: .gitignore=L7-213、live-review-projection.ts と同 test と review-live-cli.test.ts=L7-465、review-attestation.ts / review-verdict-contract.ts と各 test=L7-470、review-guard.ts と test=L7-85、tests/support/git-workspace-fingerprint.ts=L7-421。いずれも L7-493 が後から追加した形。

本 PR で真に新規作成されたのは 2 件のみ (origin/main に不在を git cat-file -e で確認): src/feedback/review-verdict-custody.ts (+323) と tests/review-verdict-custody.test.ts。最小是正は generates をこの 2 件 + PLAN doc 自身に絞り、既存ファイルへの編集は宣言しないこと。編集対象は既に owner PLAN と baseline に被覆済み (同 run で impl-plan-trace — OK, NEW orphan 0)。所有移転の意図があるなら supersedes + 相互 back-reference が必要で片側追加は必ず落ちる。docs/test-design/harness/L7-unit-test-design.md と src/cli/delegation.ts は複数宣言だが baseline 免除側で violation に出ていないため触らなくてよい。

未判定: Windows CI pending かつ Linux は doctor で落ちているため後段ゲートの結果自体が無い。実装本体 (review-verdict-custody.ts +323 / review-attestation.ts +165-34 / delegation.ts +117-85) の振る舞い判定は B-1 是正後の exact HEAD で 3 job green を確認してから行う。次の判定では #336 で freeze した契約 (監査 sink = <git-common-dir>/ut-tdd-runtime/review-custody/、verdicts の repo-local custody) との 1:1 照合を行う。

パターン: duplicate-artifact-ownership による CI 赤はこれで 3 PR 連続 (#338 で 2 回、#339 で 1 回)。実装 PR が「触った全ファイル」を generates に書く癖が原因で、正しくは「この PLAN が新規に作る成果物」だけを書く。既存ファイルの編集は baseline と owner PLAN が既に被覆している。
