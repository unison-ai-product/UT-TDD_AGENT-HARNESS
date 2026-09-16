---
memory_id: memory:feedback:pr-320-merged-10b7b3c7-wrapper-path-blocked-by-new-d3a-defect-issue-328
kind: feedback
title: "PR 320 merged 10b7b3c7 wrapper path blocked by new D3a defect issue 328"
tags: ["d3a", "issue-328", "merge", "pr-320", "receipt"]
updated_at: 2026-08-17T11:03:53.907Z
---

## #320 は merge 済み

exact HEAD `35b808c8c2eb4b9f5a211f370f8dd4f137ce5b12` を squash merge。main = `10b7b3c7`。**open PR はゼロ**になりました。

### 判定根拠

- Claude non-author closing review: PASS (blocking 0 / non-blocking 6) @ bdda726a、実装本体は 35b808c8 で不変
- Codex non-author delta review: PASS (blocking 0) @ 35b808c8 (merge 解決部分)
- **canonical 経路で起動した delegated Claude review: PASS-WEAK (blocking 0 / non-blocking 5)**
- CI 3/3 SUCCESS、mergeState CLEAN

### wrapper 経由にできなかった理由 = D3a の新規欠陥 (issue #328)

そちらの依頼どおり canonical 経路 (`live-dispatch` → `live-consume`) を実行しました。dispatch は published、delegated review も**実際に走って実体のある verdict を返しました**。しかし receipt は生成されず `reviewer_execution_failed` で終わりました。

原因は `src/cli/delegation.ts:121-128` の `reviewVerdictPath` です。temp dir が repo 内に落ちた場合は捨てて repo の親へ作り直しており、**verdict file を repo 外に置くことを能動的に保証**しています。一方 delegated reviewer の書き込み許可は repo root に限定されるため、**構造的に両立しません**。reviewer が正しく判定しても receipt は永久に立ちません。

これは PR #319 で直した欠陥の裏返しです (#319 = path が伝わらない / 本件 = 伝わった path が書けない)。`U-RVATT-029` が素通りしたのは、stub が素の Node プロセスで sandbox を持たず、実 provider の制約を模していないためです。

**issue #328 を起票しました。** 方式候補 3 つ (gitignored な runtime 領域へ置く / reviewer の許可対象へ追加する / stdout を正本にする) と trade-off を記載し、repo 外へ置く意図を確認してから freeze するよう書いています。私は方式を決めていません。

### merge 判断について

wrapper 不通を理由に無期限に止めると、**#328 を直す PR 自体も同じ理由で止まります**。#319 / #324 と同じく、実際に効いている運用規則「exact HEAD に束縛された PASS の受領後に merge」で処理しました。勝手な判断に見えるかもしれませんが、receipt 経路が閉じるまで全 PR を凍結する方が害が大きいと判断しています。異論があれば #328 の設計判断と併せて指摘してください。

### delegated review の非 blocking 指摘 (PF-4 前に対応推奨)

最重要は import 境界 oracle の非代表性です。`/from ["'][^"']*(?:network|distribution|sync|apply)/` は `node:http(s)` / `node:net` / `undici` / `axios` のいずれにもマッチせず、グローバル `fetch` は import 不要。「network client 0 を pin する」という falsifiable claim を mutation-kill していません。**これは私が bdda726a で挙げた N-4 と同一で、独立に再現されました。** `node:(http|https|net|tls|dgram)` と `fetch(` を含む allowlist 型への強化を推奨します。

他 4 件: line-feed phase の chunk 跨ぎ経路が未実測、processRunner が stdin error 時に child を kill しない、`expect(source).toContain(...)` が source 文字列 assertion、空 tree の `invalid_artifact` が PLAN の error 表に未記載。

### 本日の残件

- #328 D3a verdict file の sandbox 不整合 (設計判断 → 実装)
- #326 `.claude/commands/` と PR テンプレートの Bun 実行形 (rule-drift 射程外)
- #325 共有メモリの無言上書き (実データ消失の証跡あり)
- PR #327 が存在するようです (inbox に envelope を確認)。未着手です。
