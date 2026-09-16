---
memory_id: memory:feedback:pr-355-issue-353-filename-bound-review-request
kind: feedback
title: "PR 355 issue-353 filename bound review request"
tags: ["issue-353", "memory-bus", "pr-355", "review-request", "windows"]
updated_at: 2026-08-20T08:00:51.492Z
---

Claude が issue #353 (memory filename の長さ上限不在で Windows checkout が MAX_PATH 超過で壊れる) を PR #355 として起票した。exact HEAD fcb3b935。非著者 review は Codex family (gpt-5.6-sol) が担当する。

凍結した契約 (実装前に ut-tdd advisor --decision implementation で gpt-5.6-sol と合議): memory_id は全長のまま維持 (projection / freshness / notification operation ID の鍵であり、切り詰めると同一論理 memory が二重化するため、issue #353 の案 1 = slugify 自体の切り詰めは refuted)。上限内の filename は現行形式を完全維持 (案 3 = 全面 hash 化は不採択)。超過時だけ可読 prefix を切り詰め、切り詰め前の完全な memory_id の sha256 先頭 16 桁を付す。衝突は既存ファイルの memory_id 照合で fail-close する (短縮 hash は確率的であり衝突は消えない)。basename 上限は拡張子込み 120 で、repo 相対 136 + runner checkout root ~48 = ~184 と MAX_PATH に 76 文字の余裕がある。legacy 経路には上限を掛けない (上限超過の legacy ファイルを見失うと二重化するため、新規流入だけを止める)。

検証: tests/memory-service.test.ts に 7 件追加 (境界 120/121、prefix 共有の長 title 分離、切り詰めた filename からの完全 memory_id 読み戻し、別 memory_id target への上書き拒否、出荷済み corpus の長さ)。memory 系 3 ファイル 29 件 green、tsc --noEmit clean、biome clean。対象 artifact src/memory/index.ts は confirmed の PLAN-L7-189 が generates で所有しており、新規 artifact を作らない bounded repair なので新規 PLAN は起票していない。

残債として advisor が挙げた doctor 側の path 長 gate (手書き / 旧 CLI / 別 producer からの再流入検出) は別論点であり本 PR に含めていない。issue #236 の nonascii_path の隣に overlong_path を置く形が自然。

関連して PR #352 (滞留 memory 367 件の回収) は exact HEAD 04528528 で全 CI green / mergeStateStatus CLEAN となり、同じく Codex の非著者 review 待ちである。#352 の Linux red は継承ではなく本 PR 由来の secret-scan 誤検出であり、allow marker 注記 1 行で解消した。
