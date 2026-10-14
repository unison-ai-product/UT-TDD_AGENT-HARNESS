---
title: "L7 V モデル由来の未実装 gate テスト設計"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
updated: 2026-10-14
---

# V モデル由来の未実装 gate — candidate oracle (issue #958 還流)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/vmodel-unimplemented-gates.md` である。
本書の oracle はすべて `CANDIDATE-` であり、実装 PR で test path / 実測を引用できたものだけが `U-*` へ昇格する。
旧 PLAN にあった受入条件 (real-repo regression で false positive 0 を実測する) を各 gate に課す。

## 2. candidate oracle

| ID | 対象 (設計 §) | 検証内容 |
|---|---|---|
| CANDIDATE-VMUG-001 | FILL §2 | `confirmed` artifact の裸 `TBD` / `TODO`・プレースホルダ残りが finding になり gate が fail-close する |
| CANDIDATE-VMUG-002 | FILL §2 | 粒度乖離 (薄い詳細宣言 / 厚い簡易宣言) は情報表示のみで gate は green のまま |
| CANDIDATE-VMUG-003 | FILL §2 | 実 repo の done 済み文書群で false positive 0 (実 repo を対象にした回帰テスト) |
| CANDIDATE-VMUG-004 | ADV §3 | 反駁されない攻撃 1 件で FLAG、全反駁で PASS、試行ログ 3 件未満の `no_attack` は無効 |
| CANDIDATE-VMUG-005 | ADV §3 | 作成関与モデルを攻撃者 / 防御者のどちらにも割り当てられない |
| CANDIDATE-VMUG-006 | ADV §3 | 抜き打ち指名が同一 seed で run 間安定し、`human_check` 記入まで変わらない。seed がソース / DB に存在しない |
| CANDIDATE-VMUG-007 | ADV §3 | `attacks` / `verdicts` の既存行改変が guard / doctor で拒否され、追記だけが通る |
| CANDIDATE-VMUG-008 | DIFF §4 | 意味単位 diff があり記録 (history / PLAN / ledger) が無いと「記録なき変更」で fail-close、記録があれば green |
| CANDIDATE-VMUG-009 | DIFF §4 | ledger / body-sync gate と同一入力で二重 finding にならない |
| CANDIDATE-VMUG-010 | UNDECL §5 | 未宣言 doc を三層分類し、初期は warn、閾値到達後だけ gate 昇格する。閾値未設定は設計不備として拒否する |
| CANDIDATE-VMUG-011 | ADR §6 | ADR のみ / 台帳のみの記載を方向別 finding にする (双方向) |
| CANDIDATE-VMUG-012 | DIGEST §7 | digest は全ビュー種別に編集禁止マーカーを持ち、`agent_contracts` から決定論的に再生成される。正本は書き換えない |
| CANDIDATE-VMUG-013 | HOOK §8 | 対象 path の Edit / Write 直後に軽量 check が走り、赤で非ゼロ終了する。既存のログ記録は維持される |
| CANDIDATE-VMUG-014 | HOOK §8 | Claude と Codex の両 hook で対象範囲・再帰防止・timeout が対称である |
