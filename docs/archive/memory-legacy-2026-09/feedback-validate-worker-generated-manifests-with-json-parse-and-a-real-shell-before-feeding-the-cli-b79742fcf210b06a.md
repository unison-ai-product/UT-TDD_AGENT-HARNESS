---
memory_id: memory:feedback:validate-worker-generated-manifests-with-json-parse-and-a-real-shell-before-feeding-the-cli-or-db-accept-by-canonical-receipt-and-diff-not-by-worker-report--727caadb168e
kind: feedback
title: "Validate worker-generated manifests with JSON.parse and a real shell before feeding the CLI or DB; accept by canonical receipt and diff, not by worker report"
tags: ["manifest", "plan-revision", "shell", "windows", "worker-acceptance"]
updated_at: 2026-09-10T04:35:47.404Z
---

worker (委譲先モデル) が生成した manifest / JSON を CLI や harness DB へ投入する前に、**root (orchestrator / TL) が
内容そのものを読み、`JSON.parse` と実 shell での再現確認を通す**。worker の「作成した」「通った」という報告は
検収の根拠にしない。検収の根拠は正規 receipt と `git diff` の実物である。

**Why:** worker は自分が走る shell を誤認する。2026-09-08 の実例 (PR #521 の修正): worker が PowerShell へ POSIX の
heredoc 構文を渡し、`ParserError` の文字列が未追跡 manifest に混入した。root が JSON を読んで CLI / DB 投入前に
検出して停止したため ledger は汚れなかった。同じ manifest が `ut-tdd plan revise` に入っていれば、不正 JSON が
正規 revision として ledger に載っていた。Windows では Node の既定 shell = cmd.exe、Codex は PowerShell、Claude は
Git Bash が混在するため、shell 依存の構文 (heredoc、単一引用符、`|`) は特に誤りやすい。

**How to apply:**

1. worker の草案は保持する (破棄しない)。root が有効 JSON を作り直して正規経路 (`ut-tdd plan revise` 等) で投入する。
2. 投入前に `node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))' <manifest>` を通す。
3. 失敗した manifest は誤再利用を防ぐため削除し、実際に発行した manifest と tracked 証跡だけを残す。
4. TL の検収は worker 報告ではなく、正規 receipt (`.ut-tdd/review/receipts/`) と diff で行う。
