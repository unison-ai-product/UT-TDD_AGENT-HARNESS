---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: secret
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-01-function-spec.md
---

# L6 機能設計: secret

> **L6 contract marker**: `SECRET_PATTERN` と `isSecretLike` は unit-test 粒度の contracts とする。DbC pre/post/invariant は §2-§3、L7 oracle family は U-SECRET-001..005。

## §1 概要

`secret` module は、memory / projection / audit / search など複数 module が共有する secret-like token の一次検出 guard である。依存を持たない正規表現ベースの薄い module として、低レベル module が state-db などに循環依存せず同じ pattern を使えるようにする。

本 module は網羅的 credential scanner ではない。既知 prefix の narrow guard として使い、広範な検出は別 scanner の責務とする。

## §2 IF 契約

| 関数 | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `SECRET_PATTERN` | SECRET_PATTERN: RegExp | なし | `sk-` / `ghp_` / `github_pat_` / `xox[baprs]-` 系の長い token に match する | 定数。runtime state に依存しない | U-SECRET-001 |
| `isSecretLike` | isSecretLike(value: string) => boolean | `value` は任意文字列 | pattern に match すれば `true`、それ以外は `false` | 純関数。副作用なし、例外を投げない | U-SECRET-002 |

## §3 失敗方針

- module 自体は throw しない。fail-close / fail-open の判断は caller が行う。
- memory authoring など永続化 surface では `isSecretLike` の `true` を fail-close として扱う。
- 未知形式の credential は false になる可能性があるため、網羅的 scan の代替として扱わない。

## §4 エッジケース

| # | ケース | 期待挙動 | oracle |
|---|---|---|---|
| 1 | 空文字列 | `false` | U-SECRET-001 |
| 2 | `sk-` prefix かつ十分長い token | `true` | U-SECRET-002 |
| 3 | `ghp_` / `github_pat_` / `xox[baprs]-` family | `true` | U-SECRET-003 |
| 4 | prefix はあるが短い | `false` | U-SECRET-004 |
| 5 | 長文中に token が埋め込まれる | 部分 match で `true` | U-SECRET-005 |

## §5 検証接続

L7 unit-test design の U-SECRET-* が本 doc の contract を検証する。`tests/secret.test.ts` 相当と、memory fail-close tests が間接的な回帰 fence になる。
