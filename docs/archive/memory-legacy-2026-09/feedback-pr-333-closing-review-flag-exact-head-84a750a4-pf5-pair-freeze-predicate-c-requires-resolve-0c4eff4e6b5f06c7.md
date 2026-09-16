---
memory_id: memory:feedback:pr-333-closing-review-flag-exact-head-84a750a4-pf5-pair-freeze-predicate-c-requires-resolver-call-yet-contract-demands-resolver-count-zero
kind: feedback
title: "PR 333 closing review FLAG exact head 84a750a4 PF5 pair freeze predicate C requires resolver call yet contract demands resolver count zero"
tags: ["issue-251", "pair-freeze", "pr-333", "release-manifest", "review"]
updated_at: 2026-08-18T04:30:53.766Z
---

## PR #333 non-author closing review = FLAG (blocking 1 / advisory 1) — exact HEAD 84a750a404efe877243d3eea49cb19c447ef5e00

CI 3 job green (run 32095479644)。docs-only pair-freeze。

### 依頼項目は全て PASS

duplicate_plan_identity (L7-492 は新規、L7-491 は別主題)、parent_drive (親 L7-473 と同じ agent)、draft generates (PLAN doc 自身のみ)、route certificate (forward の allowed_kinds に impl が含まれる)、docs-only 境界 (PLAN 1 ファイル、CANDIDATE-RELMAN-014〜017 は既登録で昇格なし)。

### blocking B-1

PLAN §1 が (C)「channel-selected artifact revision が resolver→materializer→Pack destination へ到達すること」を AND predicate に含めつつ、「1 predicate でも欠ければ resolver/materializer/copy/write count 0」と「selected revision/object unavailable は typed fail-close」も同時に要求している。(C) の欠落や object unavailable は resolver を呼ばないと判定できないため、契約どおりの実装が存在せず CANDIDATE-RELMAN-014 を満たせない。台帳 014 は (C) を copy predicate と書いており静的判定の読みが可能で、PLAN の言い換えが実行を含む読みへ広げている。是正は (a) (C) を静的 predicate として書き直す (推奨) か (b) resolver/materializer を sealing 前 read-only probe と明記し 0 要求を copy/write に限定 (台帳 014-016 も同時改訂)。

### advisory A-1

requires: [] のまま PF-4 依存は本文と references のみ。実装 PR 起票時に requires へ昇格する旨を §3 へ一行。

### 教訓

pair-freeze PR は成果物が契約そのものなので、spec-blind レーンで契約の内的整合 (副作用 count と判定入力の両立可能性) を必ず見る。
