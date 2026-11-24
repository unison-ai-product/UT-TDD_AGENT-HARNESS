---
title: "L7 GitHub CI の Node の版の参照の集約 テスト設計"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/github-ci-node-version-file.md
status: confirmed
updated: 2026-11-20
issue: 1873
---

# GitHub CI の Node の版の参照を .node-version に集約する テスト設計 (Issue #1873)

## 1. 版の参照を `.node-version` へ集約する候補 oracle (Issue #1873)

正本は `docs/design/harness/L6-function-design/github-ci-node-version-file.md` である (L5 `internal-processing.md` の「Node toolchain authority」節の項目 2 の source workflow pin の持ち方を改める)。
source workflow と Pack template は `node-version-file: .node-version` を要求し、consumer template は literal を保って
`NODE_TOOLCHAIN_POLICY.nodeVersion` との一致を要求する。`U-CIPOL-040` / `U-CIPOL-041` は「pin が `24.22.3` と一致する」
比較であり、Green で「`node-version-file: .node-version` を持つ」比較へ読み替える（版の値の一致は `toolchain-pin` の
`U-TOOLPIN-001` が `.node-version` について担う）。本節は候補であり、正式 ID への昇格は別 PR で行う。

| ID | 対象・入力 | 期待 / Red にする変異 |
| --- | --- | --- |
| `CANDIDATE-U-CIPOL-042` | 実 `harness-check.yml` の runtime 各脚の setup-node の `with` | `node-version-file: .node-version` を持ち、`node-version` を持たない。変異: 1 か所を `node-version: "24.22.3"` へ戻す / パスを `.nvmrc` に変える。いずれも policy 違反 |
| `CANDIDATE-U-CIPOL-043` | aggregate の setup-node (`harnessAggregateSteps`) | 同上。変異: aggregate だけ literal へ戻す |
| `CANDIDATE-U-CIPOL-044` | `node-version` と `node-version-file` の併存 | 違反。変異: `node-version-file` を残したまま `node-version: "24.22.3"` を足す |
| `CANDIDATE-U-CIPOL-045` | `review-attestation.yml` (`attestation_runtime`) と Pack template / Pack policy fixture | 3 者とも `node-version-file: .node-version`。変異: attestation だけ literal、または template だけ literal。U-CIPOL-040/041 の後継 |
| `CANDIDATE-U-CIPOL-046` | consumer template (`CONSUMER_CI_WORKFLOW`、`docs/templates/github/common/harness-check.yml`) の literal | literal は `NODE_TOOLCHAIN_POLICY.nodeVersion` と一致する。変異: template の literal だけ別の版へ変える（上げ漏れ）。consumer template を `node-version-file` へ変えるのも違反（`.node-version` が無い repo で実行が不定になる） |
| `CANDIDATE-U-CIPOL-047` | 版の鎖 | `.node-version` を上げて `NODE_TOOLCHAIN_POLICY.nodeVersion` を上げない場合は `toolchain-pin` の `node-version-mismatch`。上げて consumer template の literal を上げない場合は 046 の違反。workflow は追従不要のまま緑を保つ（上げ漏れが workflow 側で起きない回帰の確認） |
| `CANDIDATE-U-CIPOL-048` | checkout 順序 | 各 setup-node は同 job で `actions/checkout` より後ろにある。変異: setup-node を checkout の前へ移す。`node-version-file` が読めず失敗するため違反 |

Green の PR は、候補を正式 ID へ昇格し、`it.fails` を `it` へ戻す最小実装を行う。Node の封印
(`node-toolchain-provenance.json`、executable receipt) の検査は変更せず、既存の oracle を弱めない。
