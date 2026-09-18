---
memory_id: memory:feedback:pr-319-flag-blocking-1-inbox-filename-truncation-drops-operationid-retry-dispatch-fails
kind: feedback
title: "PR 319 FLAG blocking 1 inbox filename truncation drops operationId retry dispatch fails"
tags: ["blocking", "claude-memory-wake", "flag", "pr-319", "self-bootstrap"]
updated_at: 2026-08-17T08:49:06.321Z
---

## FLAG (blocking 1) — exact HEAD 0a6fd1035d3fb4140f585283f1a2558666d28289

指示された self-bootstrap の手順 1 を実行して発見しました。**私の PASS (@ dbf59e1b) はこれを見落としています。** 現 HEAD でも未修正のため verdict を FLAG へ改めます。

### Blocking: inbox projection のファイル identity から operationId が脱落する

src/runtime/claude-memory-wake.ts:99-101 の safeFilePart は 160 文字で切り捨てます。publishClaudeInboxEntry (:185-188) はこれをファイル名にしますが、entry.id は memory:<memory_id>:workspace:<64hex>:op:<operationId> という構造のため、**memory_id が長いと op 以降が丸ごと落ちます**。

実測: memory_id 109 文字 → full id 189 文字 → 異なる operationId 2 件が同一ファイル名へ潰れる (same file? true)。

実ファイルでも確認: 当該エントリは ..._workspace_441a1b419cc26db381ec61e2e9ea3581552b0fca.json と workspace hash 途中で切れ、_op_ 以降が存在しない (memory_id が短い 17:05 のエントリには _op_pr31 が残っており対照的)。

### 影響

同一 memory + 同一 workspace への 2 回目の review 操作は内容差異により claude_inbox_projection_conflict (:206) で fail-close する。operationId は操作識別のために存在するのにファイル identity から脱落するため機能していない。

**再現**: review live-dispatch --pr 319 --head 0a6fd103... → review_wake_publish_failed。切り分けの結果、build と identity 検証は通り publish が既存エントリとの conflict で throw していた。

これは本 PR が実現しようとしている custody の retry 経路そのものを塞ぐ。timeout 後に同じ memory で dispatch し直せないため復旧路が閉じており、**現に #319 がこの状態で止まっている**。

### 是正案

safeFilePart の切り捨てで identity を失わないよう、ファイル名へ entry.id の hash 短縮 (sha256 先頭 8-12 文字) を suffix として付ける。truncate 自体は Windows path 長対策として妥当なので、衝突耐性だけを足す最小修正でよい。

oracle は「160 文字超の memory_id で operationId だけが異なる 2 件を publish して別ファイルになること」を固定すること。現行テストは短い memory_id しか使わずこの経路へ到達していない。

### 私の PASS の訂正

dbf59e1b の closing review でこの欠陥を検出できなかった。長い memory_id のケースを踏まず oracle にも該当ケースが無いため。当該 verdict のこの点に関する主張は撤回する。

差し戻しなので私は修正しない (差し戻しと自力修正は排他)。merge も本件が閉じるまで進めない。
