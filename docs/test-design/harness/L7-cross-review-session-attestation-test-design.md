---
title: "L7 cross-review session attestation test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
updated: 2026-10-14
---

# cross-review セッション実在照合 gate テスト設計 (issue #131 / #958)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/cross-review-session-attestation.md` である。本書は同文書 §2 の
照合契約を fixture で固定する oracle を定義する。検出器は未実装のため、ID は `CANDIDATE-U-XREV-*` のままとし、
実装 PR で Red を置いてから `U-XREV-*` へ昇格する。候補は実テストの citation として数えない。

## 2. oracle

| ID | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| CANDIDATE-U-XREV-001 | 痕跡なしの cross-runtime claim fixture | violation (Red) | 痕跡の実在確認を外す |
| CANDIDATE-U-XREV-002 | provider 方向が逆 (著者と同族の痕跡) の fixture | violation | 方向の整合確認を外す |
| CANDIDATE-U-XREV-003 | 正当な痕跡付き claim fixture | green (誤検知の負例) | 正常な claim を弾く |
| CANDIDATE-U-XREV-004 | `intra_runtime_subagent` fallback の明示 claim と、cross claim へ偽装した fixture | 前者は green、後者は violation | fallback の偽装を見逃す |
| CANDIDATE-U-XREV-005 | 痕跡ログ破損 fixture | fail-close (claim 不成立) | 破損を silent pass に倒す |
| CANDIDATE-U-XREV-006 | 監査スモーク痕跡 (role / plan_id 不一致) | 突合に採用されない | role / plan_id を突合キーから外す |
| CANDIDATE-U-XREV-007 | 2026-07-22 の実測パターン (claude-* 方向が 7 日間ゼロのまま hybrid が継続) を再現する fixture | warn | stale-direction-drift を検出しない / violation に格上げする |
