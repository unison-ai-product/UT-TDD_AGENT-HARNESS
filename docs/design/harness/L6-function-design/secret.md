---
layer: L6
sub_doc: secret
status: draft
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
plan: docs/plans/PLAN-L7-329-module-l6-design-backfill.md
---

# UT-TDD Agent Harness — L6 機能設計: secret (secret-like トークン検出の共有コア)

## §1 概要と配置

- 目的: memory / projection / audit / search など複数モジュールが再利用する、依存を持たない
  secret-like トークンの一次検出パターンを 1 箇所に保つこと。低レベルモジュールが
  state-db 経由で循環依存を作らずに同一パターンを再利用できるようにする。
- 実装先: `src/secret.ts` (既存、17 行)。テストは `tests/secret.test.ts` 相当 (未確認、pair_artifact 参照)。
- 呼び出し元: `src/memory/index.ts` (`assertMemorySafe`/`parseMemoryFile`)、
  `src/state-db/projection-writer.ts`、`src/state-db/index.ts`、`src/audit/quality.ts`、
  `src/state-db/guardrail-invariants.ts`、`src/search/index.ts`。

## §2 IF 契約

```ts
// 依存なし (node:crypto 等の外部 import も無い、純粋な正規表現ベース検出)
export const SECRET_PATTERN: RegExp;

export function isSecretLike(value: string): boolean;
```

`SECRET_PATTERN` はエクスポートされる定数であり、呼び出し側が独自に `.test()` することも許容される
設計 (`isSecretLike` はその薄いラッパ)。

## §3 事前/事後条件・不変条件

| 関数 | 事前条件 | 事後条件 | 不変条件 |
|---|---|---|---|
| `isSecretLike` | `value` は任意文字列 | `SECRET_PATTERN` にマッチすれば `true`、それ以外は `false` | 純関数、副作用なし、例外を投げない |

## §4 失敗モード

- 方針: **fail-close の一次防波堤として使われる**が、module 自身は失敗しない (例外を投げない純粋な
  正規表現テスト)。fail-close/fail-open の判断は呼び出し側 (例: `assertMemorySafe` は検出時に throw
  = fail-close) に委ねられる。
- 入力異常時の挙動:

| 異常 | 挙動 | 根拠 |
|---|---|---|
| 空文字列 | `false` (マッチしない) | 空文字は secret ではない、誤検知を避ける |
| 非 ASCII / 制御文字を含む文字列 | 通常のマッチング (パターンは ASCII トークン家系のみを対象) | パターンは `sk-`/`ghp_`/`github_pat_`/`xox[baprs]-` の既知プレフィクス限定、汎用スキャナではない (module コメント「narrow first-line guard」参照) |
| 未知の secret フォーマット (パターン外) | `false` (検出されない) | 本 module は網羅的シークレットスキャナを意図しない設計制約 (§ 冒頭コメント)。広範なクレデンシャル発見には専用スキャナを使う方針 |

## §5 データ形 (具体例)

```json
// 入力例 (代表 1 件 + 特徴的な 1 件、実トークンではなく記述形)
{ "value": "my api key is <sk- で始まる 16 文字以上の英数字トークン>" }
```

```json
// 上に対応する期待出力
{ "isSecretLike": true }
```

```json
// 非マッチ例
{ "value": "this is a normal memory body with no secrets" }
```

```json
{ "isSecretLike": false }
```

## §6 エッジケース表

| # | ケース | 入力の特徴 | 期待挙動 | oracle |
|---|---|---|---|---|
| 1 | 境界: 空入力 | `value = ""` | `false` | U-SECRET-EMPTY (起票時に採番) |
| 2 | 正常系: `sk-` プレフィクス (16 文字以上) | `"sk-" + 20 chars` | `true` | U-SECRET-SK |
| 3 | 正常系: `ghp_` / `github_pat_` / `xox[baprs]-` の各プレフィクス | 各家系 1 件ずつ | いずれも `true` | U-SECRET-FAMILIES |
| 4 | 境界: プレフィクスはあるが長さ不足 (16 文字未満) | `"sk-abc"` | `false` (量指定子 `{16,}` 未達) | U-SECRET-SHORT |
| 5 | 異常: 長文中の一部にのみ secret-like トークンが埋め込まれる | 通常文 + 途中に `ghp_` トークン | `true` (部分マッチで検出、`test()` は全文一致を要求しない) | U-SECRET-EMBEDDED |

## §7 検証接続

- pair: frontmatter `pair_artifact` (L7 unit-test-design)。§6 の oracle 列が対応表。
- 回帰 fence: `bun run test` full green (特に `tests/memory-*.test.ts` 系の secret ガード経由テストも
  間接的に本 module を回帰する)。

## §8 carry / 非スコープ

- 網羅的クレデンシャルスキャン (本 module の意図的な非スコープ、コメントに明記済み)。
- パターン家系の追加/削除判断は本 doc の対象外 (呼び出し側の要求から起票する別 PLAN)。
