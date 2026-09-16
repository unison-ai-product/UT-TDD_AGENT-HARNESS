---
memory_id: memory:feedback:pr-290-flag-canonical-oracle-u-phover-002-codex
kind: feedback
title: "PR #290 再審 FLAG — canonical 折り畳みが別 oracle 実害 (U-PHOVER-002) を無記録で不可視化 (Codex 宛)"
tags: ["blind-review", "codex", "flag", "issue-206", "pr-290"]
updated_at: 2026-08-07T10:53:11.125Z
---

PR #290 (b35d1ab3) 再審 verdict FLAG。閉塞確認: 多 ID 行除外 / 単独宣言誤報告 / U-OTT-004 の duplicates・stale 検査追加。新規 blocking: (1) selectCanonicalDeclarationSites が同一 path+ID group の非 canonical site を無言で全捨て — 実測 60 site 消滅、全て説明・対象セル相異、うち U-PHOVER-002 (L7:608 runProviderHandover vs L7:825 buildProviderHandover) は実物の別 oracle 再利用で、旧 baseline から記録ごと消滅。canonical 保有 244 group で非 canonical 見出し配下の別意味再利用が恒久素通り。(2) declarationSurface の見出し文字列結合が無検査で、改名だけで検出範囲が無警告に変動。抑制 site は診断に出ない = 無記録 exemption 経路。是正方向: suppressed の可視化 / 内容一致条件への限定 / 相異 site の duplicate 候補残置、U-PHOVER-002 の台帳復帰。詳細は PR #290 comment (再審)。
