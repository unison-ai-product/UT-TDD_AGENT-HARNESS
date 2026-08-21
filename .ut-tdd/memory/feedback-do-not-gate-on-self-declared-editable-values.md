---
memory_id: memory:feedback:do-not-gate-on-self-declared-editable-values
kind: feedback
title: "Do not gate on self-declared editable values"
tags: ["gate-design", "issue-191", "lesson", "pr-361", "review"]
updated_at: 2026-08-20T11:20:34.759Z
---

2026-08-20、PR #361 (issue #191 green_command anchor_commit 必須化) で Codex が blocking 2 を返し、両方とも正しかった。gate 設計の一般教訓として残す。

第一。gate の適用範囲を書き手が自由に編集できる値で決めてはならない。初版は「発効時刻以降に記録された entry だけ anchor 必須」とし、判定入力に completed_at を使った。この値は書き手の自己申告なので、新規 entry でも過去日時を書けば anchor 無しで通せた。grandfather を時間で切ること自体が迂回路を作る。正しい直し方は閾値を厳しくすることではなく、時間軸を判定から外して全 entry 必須にし、grandfather が必要だった原因 (既存 8 件が anchor 無し) をデータ側で解消することだった。plan digest-migrate --execute が applied=8 files=5 suspect=0 で実 anchor を backfill できたため、grandfather 集合そのものが不要になった。baseline や grandfather を導入する前に、対象データを直せないかを先に確認する。

第二。識別子の形式検査は実在検査の代わりにならない。anchor_commit は 7 から 40 桁 hex の字面しか見ておらず、全 0 の 40 桁 SHA が通った。さらに green-command-digest は commit 不在を unverifiable として無視する fail-open (GC/shallow 対応) なので、捏造 anchor は digest 監査もすり抜けた。形式 gate と実在 gate が両方無いと「証跡が存在する」という主張は成立しない。

第三。実在検査を入れるときは、判定できない面で推測 fail させない。shallow clone や非 git 面では GC で消えた正当な anchor と捏造を区別できない。git rev-parse --is-shallow-repository が false のときだけ実在検査を注入し、それ以外は形式のみに留めた。純関数 analyzeReviewEvidence には ReviewEvidenceOptions で観測面依存を注入する形にして、lint の純粋層へ git I/O を持ち込まないようにした。

第四。新しい検査を既存 reason の前に挿すと既存診断の優先度が変わる。anchor 検査を先頭に置いたとき、completed_after_tests_green_at を期待する既存テストが missing_anchor_commit を返して赤くなった。挙動の意図しない変更なので、新規検査は既存 reason の後ろへ置いた。既存テストが赤くなったら「テストを直す」前に「優先度を変えてしまっていないか」を疑う。
