---
title: "L7 runtime-env doctor test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
updated: 2026-10-14
---

# runtime-env 検査 テスト設計 (#958)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/runtime-env-doctor.md` である。本書は同文書 §2・§3 の検査契約を
fixture で固定する oracle を定義する。検出器は未実装のため、ID は `CANDIDATE-U-RTENV-*` のままとし、実装 PR で Red を
置いてから `U-RTENV-*` へ昇格する。候補は実テストの citation として数えない。

## 2. oracle

| ID | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| CANDIDATE-U-RTENV-001 | 版ずれ fixture (cache の `client_version` が CLI 版より新しい) | violation + 修復レシピ付きで検出 | major.minor 照合を外す |
| CANDIDATE-U-RTENV-002 | 廃止キー fixture (`approval_mode`)。台帳に新キーを追補した fixture | 検出される。追補した新キーも台帳だけで検出できる | 廃止キーを検出器内にハードコードする |
| CANDIDATE-U-RTENV-003 | `mcpServers` を誤配置した fixture と、正位置にだけ定義した fixture | 前者は検出、後者は green | 位置を見ずに存在だけで判定する |
| CANDIDATE-U-RTENV-004 | 環境ファイル不在 fixture (Codex 未インストール) | skip として明示 report される (silent pass の負例) | 不在を pass に倒す |
| CANDIDATE-U-RTENV-005 | 検査の実行前後 | 対象設定ファイルの digest が不変 (doctor は書き換えない) | 検査中に修復を自動適用する |
| CANDIDATE-U-RTENV-006 | 秘密情報を含む fixture 設定 | 秘密の原文が violation メッセージへ漏れない (キー名と期待形だけ) | 値を原文転記する |
| CANDIDATE-U-RTENV-007 | 発火が未実証の matcher に `blockOnFailure` の guard が載った fixture | violation として検出される。実機スモークの結果を台帳初期値へ反映する | 未実証 matcher を warn へ降格する |
