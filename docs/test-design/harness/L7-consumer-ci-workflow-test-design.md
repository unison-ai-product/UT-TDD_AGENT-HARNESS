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

- consumer workflow の行 (001..005, 011, 012) は、`src/setup/templates.ts` が出す `harness-check.yml` の YAML 文字列と構造を検査する。
  CI 実行には依存しない。
- 本体の行 (013, 014) は、source repo の `.github/workflows/harness-check.yml` ファイルのテキストと、`src/lint/github-ci-policy.ts` が
  期待する guard step の文字列 (policy が固定する期待テキスト) を、文字列として読んで検査する。CI 実行は不要で、guard 自体は動かさない。
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
| `CANDIDATE-U-CICONS-013` | 本体 workflow の guard 呼び出し | 入力: source repo の `.github/workflows/harness-check.yml` のテキスト。期待: guard step が `--base-ref` を渡し、`--commit-file` を含まず、`git log` の出力を事前にファイルへ書く行も無い。反例: `git log --format=%s -n 20 > file` と `--commit-file` の旧形が残る |
| `CANDIDATE-U-CICONS-014` | CI policy の期待 step | 入力: `src/lint/github-ci-policy.ts` が guard step として期待する文字列と、旧形 (`-n 20` + `--commit-file`) の workflow を policy へ通した結果。期待: 期待 step は `--base-ref` を含み `--commit-file` を含まない。旧形の workflow は policy が違反として検出し、新形は通す。反例: policy が旧形を固定したまま、または新旧どちらも通す |
| `CANDIDATE-U-CICONS-015` | 20 件を超える範囲 | 入力: 非 Conventional な commit を先頭に、その後ろに Conventional な commit を 25 件積んだ PR branch (違反 commit は直近 20 件の外、範囲の内)。`--base-ref <base>` を `--commit-file` なしで実行。期待: 範囲全体を見て違反を検出し fail する。反例: 直近 20 件 (`git log -n 20`) だけを読んで pass する (ref の存在確認だけして `-n 20` を読む実装を落とす) |
| `CANDIDATE-U-CICONS-016` | 範囲外の commit は対象外 | 入力: base branch 側で merge-base より前に非 Conventional な commit があり、PR branch の commit はすべて Conventional。期待: 範囲 `<base>..HEAD` の外なので報告せず pass する。反例: base 側の過去 commit を拾って fail する |
| `CANDIDATE-U-CICONS-017` | `origin/<base>` 優先 | 入力: `origin/<base>` と local `<base>` を異なる commit に置く。local `<base>` を古い位置に、`origin/<base>` を新しい位置に進め、両者の差分に当たる commit に違反を置く (どちらを基点にするかで判定が変わる構成)。期待: `origin/<base>` を基点にした範囲で判定する。反例: local `<base>` を優先して判定が逆になる |
| `CANDIDATE-U-CICONS-018` | `--commit-file` は上書き | 入力: 有効な (Conventional な) subject だけを書いた `--commit-file` を渡し、導出範囲には違反 commit がある。期待: `--commit-file` の内容だけで判定して pass する (範囲の違反は見ない)。反例: `--commit-file` と導出範囲を合算して fail する |
