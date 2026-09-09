---
memory_id: memory:project:pr-464-merged-plan-l7-519-pair-freeze-po-nonce-cardinality--2a546c29461d
kind: project
title: "PR #464 merged: PLAN-L7-519 pair-freeze (PO 指摘の nonce cardinality 継承が正しく閉じた)"
tags: ["issue-414", "merged", "nonce-cardinality", "plan-l7-519", "pr-464", "review"]
updated_at: 2026-08-28T04:19:58.984Z
---

PR #464 (Issue #414 / PLAN-L7-519 Pack publication adapter 実装契約) を
exact HEAD 0634223761501f39c70f12739c9f07ede91f93bc で MERGED (reason=merge_ready)。
receipt 78d178eed0ecc75ddd7444a3632915723961bf4f361d16c766bc486cbf0a5c09 が PASS-WEAK / blocking 0、
CI run 33140609471 が Linux/Windows/aggregate 3/3 pass。

経緯: PO が「approval nonce cardinality が契約未確定・PO 判断待ちという状態が発生するのはおかしい」と
指摘したのが起点。実測で PLAN-L7-515 §2 が既に per-mutation nonce を pin していることを確認し、
PO 判断待ちではなく既存契約の継承漏れと再分類した。旧 PR #447 は scope 規律違反で close され、
契約 PR として #464 に分割再出された。

#464 の PLAN-L7-519 §3 は見出しが「nonce cardinality（既存判断の継承）」で、本文が
「nonce粒度は新規判断ではない。PLAN-L7-515 §2〜§4 に従い remote mutation 単位で新しい
approval receipt と single-use nonce を発行する」と始まる。3 ファイルに「PO 判断」「未確定」の語は
grep 0 件。PO の指摘は正しく、機構に反映された。

review 経過: 初回 exact HEAD 73e3924d で FLAG / blocking 2。
1. 昇格 gate の置換で 5 軸が落ちる — confirmed 上位 registry が CANDIDATE-PACKPUB-003-A..S2 の
   23 行を要求しているのに、519 側は独自の 519-001..009 の 9 行を唯一の gate と宣言していた。
   欠落は 003-A (approval 欠落/wrong approver/期限切れ)、003-C (drift)、003-E (暗黙補完拒否)、
   003-N (cleanup 失敗)、003-Q (direct push/pointer identity 混同)。特に 003-A は本 PLAN の主題である
   human approval nonce の否定側 oracle そのもの。
2. 対応関係を宣言しない再採番 — 519-004..009 は 003 系と同一単軸 mutation の別 ID 化で、
   3 ファイルに CANDIDATE-PACKPUB-003 の言及が grep 0 件。同一 namespace への 1 対 1 昇格を
   両 registry が要求するため重複テストか片方放置が構造的に発生する。

是正 (b1fa5c2a): 私は対応表の追加を推奨したが、Codex は 519-* registry を全廃して上位 23 行を
ID 無変更で束縛した。対応表という二重管理点自体が消えるためこちらが優れる。実測で
003-* 参照 23 件 / 519-* 残存 0 件を確認し PASS-WEAK / blocking 0。

confirm delta (06342237): #457 で発生した anchor-digest-mismatch の罠を回避できていた。
output_digest sha256:8aeaa864... は anchor_commit b1fa5c2a の bytes と一致し、b1fa5c2a は
06342237 の ancestor で到達可能。

残る非 blocking: L7-pack-publication-remote-adapter-test-design.md は confirmed だが、
generates で所有を宣言している PLAN-REVERSE-519 は draft のままという所有宣言と status のねじれ。
b1fa5c2a 以前から存在する弱点。
