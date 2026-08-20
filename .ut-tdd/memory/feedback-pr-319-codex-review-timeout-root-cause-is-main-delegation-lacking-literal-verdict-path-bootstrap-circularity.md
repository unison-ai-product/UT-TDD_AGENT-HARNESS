---
memory_id: memory:feedback:pr-319-codex-review-timeout-root-cause-is-main-delegation-lacking-literal-verdict-path-bootstrap-circularity
kind: feedback
title: "PR 319 codex review timeout root cause is main delegation lacking literal verdict path bootstrap circularity"
tags: ["bootstrap", "d3a", "pr-319", "review-timeout", "root-cause"]
updated_at: 2026-08-17T06:45:17.580Z
---

## review_timeout の原因診断 (read-only 実測)

Codex の 15 分 timeout は provider 側のリソース問題ではなく、**#319 が直そうとしているバグそのもの**である可能性が高いです。

### 実測 1: 委譲セッションは session_start だけで途絶している

`.ut-tdd/logs/session/codex-1786945695888.jsonl` (14:48、`plan_id: PLAN-L7-465`) は 1 行のみ:

```
{"ts":"2026-08-17T05:48:25.742Z","session_id":"codex-1786945695888","plan_id":"PLAN-L7-465","event_type":"session_start"}
```

`tool_use` も完了イベントもありません。provider は起動したが verdict 収集まで到達していない、という報告と整合します。

### 実測 2: main の delegation には literal path 注入が無い

```
$ git show origin/main:src/cli/delegation.ts | grep -n reviewOutputContract
13:import { REVIEW_OUTPUT_CONTRACT } from "../feedback/review-verdict-contract.ts";
341:  const taskForAdapter = routing.review_lane ? `${task}\n\n${REVIEW_OUTPUT_CONTRACT}` : task;
```

main は**定数をそのまま注入**しており、path を本文へ埋め込む `reviewOutputContract(verdictFilePath)` は存在しません (この関数は 36decc47 で追加したもので、main には未到達)。したがって main から起動した reviewer は **env 変数名だけを渡され、path を解決できない**。verdict を stdout に出しても verdict file が 0 件になり、呼び出し側は待ち続けます。2026-08-14 に delegated Claude で観測した恒久 fail と同一の失敗様式で、reviewer family が Codex に変わっても構造は同じです。

### 結論: bootstrap の循環

#319 の merge には Codex cross-review が必要 → review は委譲経路を通る → 委譲経路は main のコードで動く → main には #319 が直すバグが残っている → review が完了しない。

### 回避策

**`0a6fd103` の worktree `~/ut-pr319b` を cwd にして委譲を起動してください。** そこには修正済み実装があり、literal path が契約本文へ入ります (`U-RVATT-029` が env を一切読まない provider stub で behavioral に固定済み)。

そちらの記録では worktree の snapshot runner を試したとありますが、**委譲そのものをどの root から起動したかが不明**です。main から起動していた場合、次の正規セッションでも同じ 15 分を溶かします。再開前に cwd を確認してください。

私からは起動しません (自分が author の PR の review を自分で回さない)。再送でもありません — 前回通知に無い新規の診断です。
