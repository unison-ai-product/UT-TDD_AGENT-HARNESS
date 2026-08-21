---
memory_id: memory:feedback:pr-361-flag-remediated-at-exact-head-2bb4e6d5
kind: feedback
title: "PR 361 FLAG remediated at exact head 2bb4e6d5"
tags: ["issue-191", "pr-361", "remediation", "review-request"]
updated_at: 2026-08-20T11:21:54.233Z
---

PR #361 に対する Codex non-author FLAG (blocking 2、exact HEAD 8d1dc6be6af90de97402cb411d06184ba7fbabcf) は Claude 側で是正し、new exact HEAD 2bb4e6d5d8de77f8c79613745cbaf4a2e4932912 を push した。是正報告: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/361#issuecomment-5355161618 この HEAD に対する delta review を依頼する。CI は実行中で、結果は PR へ追記する。

B-1 (自己申告 completed_at による grandfather 迂回) の是正。指摘は正しく、判定入力の completed_at は書き手が自由に書ける値なので新規 entry でも過去日時を書けば anchor 無しで通せた。閾値を厳しくするのではなく時間軸を判定から外し、全 entry で anchor 必須にした。grandfather が必要だった原因である既存 8 件の anchor 無しは plan digest-migrate --execute で実 anchor を backfill して解消した (applied=8 files=5 skipped_already_anchored=0 suspect=0、output_digest は不変)。suspect=0 なので推測で埋めた anchor は 1 件も無い。GREEN_COMMAND_ANCHOR_ENFORCED_FROM は削除した。

B-2 (実在しない SHA が anchor として通る) の是正。anchorCommitExistsFor(repoRoot) を追加し doctor 経路で実在検査を注入する。git rev-parse --is-shallow-repository が false の面だけで実在検査を提供し、shallow clone や非 git 面では undefined を返して従来どおり形式のみに留める。これは GC で消えた正当な anchor と捏造を区別できない面で推測 fail させないためで、green-command-digest が unverifiable を fail-open にしている既存の設計判断と整合する。analyzeReviewEvidence は純関数のままで、観測面依存を ReviewEvidenceOptions として受ける。

副次的な配慮として anchor 検査を既存 reason の後ろへ移した。先頭に置くと completed_after_tests_green_at 等の既存診断を先食いして reason が変わるためで、既存テストが赤くなったのはこの副作用だった。

検証は tests/review-evidence.test.ts の issue #191 ブロックを 7 件へ書き直し (自己申告の過去日時でも missing_anchor_commit、anchor 無しは violation、anchor 付きは通る、main のような可変参照は invalid_anchor_commit、実在しない 40 桁 hex + 実在検査ありは unknown_anchor_commit、実在検査なしの面では検査しない、出荷済み corpus は anchor violation 0)。既存 fixture 2 件 U-GREENDEF-003 と -006 には anchor を持たせた (全 entry 必須化の意図した影響)。review-evidence 36 件 + green-command-digest + plan-governance の計 54 件 green、tsc --noEmit clean、biome check clean。

本 PR に含めなかった残件として、green-command-digest 側の unverifiable fail-open はそのままにした。捏造 anchor は review-evidence の hard gate で先に弾かれるため到達しない。digest 監査自体を advisory から hard へ変えるのは別 gate の性質変更なので別 issue の論点とする。
