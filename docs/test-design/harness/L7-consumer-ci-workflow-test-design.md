---
title: "L7 consumer CI workflow test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/setup-solo-team.md
status: draft
updated: 2026-11-04
issue: 1522
---

# consumer CI workflow の fail-close 化と guard 範囲導出のテスト設計 (Issue #1522 / #1523)

## 1. 根拠と範囲

正本は `docs/design/harness/L6-function-design/setup-solo-team.md` の「2026-11-04 consumer CI workflow の
fail-close 化と guard 範囲導出」節。本書はその契約を検証する候補 oracle を置く。
実装・Red 化は後続の実装 PR で行い、本書は ID 昇格前の候補である。

## 2. Fixture

- workflow の行は、`src/setup/templates.ts` が出す `harness-check.yml` の YAML 文字列と構造を検査する。
  実 repo の `.github/workflows/` や CI 実行には依存しない。
- guard の行は、テストごとに作る一時 git repo (base branch + PR branch + 合成 merge commit) を使う。
  実 repo の履歴・作業ツリーは読まない。

## 3. 候補 oracle

| ID | 対象 | 入力・期待・反例 |
| --- | --- | --- |
| `CANDIDATE-U-CICONS-001` | activation 不在 | 入力: 生成 workflow の activation 確認 step。期待: `active.json` 不在で `::error::` を出し非 0 で終了する。反例: `::notice::` を出して成功する、または harness step が `hashFiles(...) != ''` で条件付けされ飛ばされる |
| `CANDIDATE-U-CICONS-002` | release 導入 step と単一 env block | 入力: 生成 YAML。期待: release asset 取得 step と `setup --consumer-runtime-release <dir> --expected-consumer-digest <digest>` を含み、version と digest の値は workflow 先頭の `env:` block の 1 箇所だけにある。反例: step 内への値の直書き・複製、`env:` block が複数 |
| `CANDIDATE-U-CICONS-003` | setup 後の dirty 検査 | 入力: 生成 YAML と、setup 後に未追跡・変更ファイルが残る一時 repo。期待: setup step の後に `git status --porcelain` の出力が非空なら fail する step がある。反例: 検査 step が無い、出力を無視する、setup より前に置かれる |
| `CANDIDATE-U-CICONS-004` | 再生成で env 値を保持 | 入力: pin を別の version / digest に書き換えた既存 workflow に setup を再実行。期待: 出力の `env:` block が書き換え後の値と一致する。反例: 既定値へ巻き戻る、env block が重複する |
| `CANDIDATE-U-CICONS-005` | 初回生成の既定値 | 入力: workflow が無い状態で setup。期待: `env:` block に既定の version / digest が 1 組書かれる。反例: 空値のまま生成される |
| `CANDIDATE-U-CICONS-006` | guard の範囲導出 | 入力: base branch から分岐し、非 Conventional な実 commit 1 件 + 合成 merge commit を持つ一時 repo。`github guard --base-ref <base>` を `--commit-file` なしで実行。期待: `<base>..HEAD` から実 commit を検出して fail する。反例: 合成 merge commit だけを見て pass する |
| `CANDIDATE-U-CICONS-007` | PR title の `Merge` | 入力: PR title が `Merge ...` で始まり Conventional でない。期待: title は skip されず検査される (違反なら fail)。反例: title が `Merge` 接頭辞で skip される |
| `CANDIDATE-U-CICONS-008` | commit subject の `Merge` skip | 入力: 範囲内に `Merge ...` subject の commit と Conventional な実 commit。期待: merge subject は skip し、実 commit だけを判定する。反例: merge subject を違反として fail する |
| `CANDIDATE-U-CICONS-009` | base ref 不在 | 入力: 存在しない `--base-ref`。期待: fail-close で終了する。反例: 範囲が空として pass する |
| `CANDIDATE-U-CICONS-010` | `--commit-file` の後方互換 | 入力: `--commit-file` に違反 subject を書いて指定。期待: その内容が commit subject として判定される。反例: option が無視される |
| `CANDIDATE-U-CICONS-011` | 生成 checkout の fetch-depth | 入力: 生成 YAML の `actions/checkout` step。期待: `fetch-depth: 0` を持つ。反例: 指定なし (shallow 既定) |
| `CANDIDATE-U-CICONS-012` | 生成 guard step の呼び出し | 入力: 生成 YAML の branch-type guard step。期待: `--commit-file` と `git log ... > file` の事前ファイル化を含まず、`--base-ref` を渡す。反例: 旧 `git log -n 20` の出力ファイルを渡す |
