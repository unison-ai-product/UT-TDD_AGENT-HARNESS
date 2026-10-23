---
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L6-function-design/test-oracle-strength-helper-resolution.md
related_function: src/lint/ddd-tdd-rules.ts
issue: 1290
---

# L7 テスト設計: test-oracle-strength の同一ファイル helper 解決 (Issue #1290)

> **状態**: 非著者 family の closing review 前の draft。候補 ID は正式 oracle の宣言ではない。テストの起動・実装・Green の結果は記録していない。

## 1. 対象と根拠

pair L6: `docs/design/harness/L6-function-design/test-oracle-strength-helper-resolution.md`。

対象: `src/lint/ddd-tdd-rules.ts` の `analyzeDddTddRules` (内部の `assertionSummary` / `testOracleViolations`)。テストの置き場は既存の `tests/ddd-tdd-rules.test.ts` とする (既存の `baseInputs` を使う)。

## 2. テストの組み方

- 各候補は `analyzeDddTddRules(baseInputs({ docs: [<fixture>] }))` を呼び、`rule === "test-oracle-strength"` の violation の件数と message を検証する。fixture は `scope: "test"` の 1 ファイルで、`it` を 1 本だけ持つ (候補 013 を除く)。
- 期待値は 3 通りで書く: **なし** (violation 0 件)、**oracle なし** (1 件、message `Test cases must contain an explicit expect/assert oracle.`)、**弱い** (1 件、message `Test cases must not rely only on toBeTruthy/toBeFalsy weak assertions.`)。
- fixture は文字列であり、実行しない。import 先のファイルや識別子が実在しなくてよい。
- 1 つの候補は 1 つの境界を反証する。複数の境界を 1 つの parameterized assertion にまとめて、片方の破損を隠さない。
- 実 repo の guard (`U-DDDTDD-008`) は従来どおり violations `[]` を保つ。本契約は違反を増やさないので (L6 §3.1)、実 repo guard の期待値は変えない。

## 3. 候補 oracle

各行の「落とす mutation」は、正しい実装と比べて、その fixture の期待値が変わることを確かめた mutation である (§4)。

| 候補 ID | 境界 | 入力 (fixture の要点) | 期待値 | 落とす mutation |
|---|---|---|---|---|
| CANDIDATE-U-ORACLEHELPER-001 | 本物の assertion を持つ helper の認識 | top-level の `function h(x) { expect(x).toBe(1); }`、callback は `h(1);` だけ | なし | helper を解決しない (現行の挙動)。名前の規則だけで通す案 C (`h` は名前に一致しない) |
| CANDIDATE-U-ORACLEHELPER-002 | 中身が空の helper | `function h(x) {}`、callback は `h(1);` だけ | oracle なし | 解決できた helper の呼び出しを、本体を見ずに assertion 1 本と数える |
| CANDIDATE-U-ORACLEHELPER-003 | truthiness だけの helper (`weakOnly` の伝播) | `function h(x) { expect(x).toBeTruthy(); }`、callback は `h(1);` だけ | 弱い | helper の `weak` を合計に足さない。`weakOnly` を callback 本文の数だけで計算する。解決できた helper を本体を見ずに強い assertion と数える |
| CANDIDATE-U-ORACLEHELPER-004 | 合計による `weakOnly` の解除 | `function h(x) { expect(x).toBe(1); }`、callback は `expect(1).toBeTruthy(); h(1);` | なし | `weakOnly` を callback 本文の数だけで計算する (結果が「弱い」になる)。helper を解決しない |
| CANDIDATE-U-ORACLEHELPER-005 | 解決できない呼び出し (scope の外・import) | (a) `describe("d", () => { function h(x) { expect(x).toBe(1); } });` の外の `it` から `h(1);`。(b) `import { expectOk } from "./helpers";`、callback は `expectOk(1);` | (a)(b) とも oracle なし | ファイル全体から名前で探す (a を「なし」にする)。解決できない呼び出しを assertion と数える (a・b を「なし」にする) |
| CANDIDATE-U-ORACLEHELPER-006 | shadowing | top-level に強い `h` があり、(a) callback の中で `const h = () => {}; h();`。(b) callback の中で `const h = makeNoop(); h();`。(c) `function wrap(h: () => void) { h(); }` があり、callback は `wrap(() => {});` | (a)(b)(c) とも oracle なし | ファイル全体から名前で探す。top-level だけで探す。最も内側の束縛が helper 宣言でないとき外側へ進む (b・c を「なし」にする)。仮引数を束縛として扱わない (c を「なし」にする) |
| CANDIDATE-U-ORACLEHELPER-007 | helper の中の、呼ばれない入れ子の関数 | `function h(x) { const lazy = () => expect(x).toBe(1); }`、callback は `h(1);` | oracle なし | helper を text の regex で数える (入れ子の関数を除かない) |
| CANDIDATE-U-ORACLEHELPER-008 | callback の中の、呼ばれない入れ子の関数からの helper 呼び出し | 強い `h` があり、callback は `const f = () => h(1);` だけ | oracle なし | 入れ子の関数の中の呼び出しも起点にする |
| CANDIDATE-U-ORACLEHELPER-009 | 循環参照で停止する | (a) `function a() { b(); }`、`function b() { a(); }`、callback は `a();`。(b) `a` だけに `expect(1).toBe(1);` を足し、callback は `b();` | (a) oracle なし、(b) なし。どちらも例外を出さずに返る | 訪問済み集合と深さの上限を両方外す (無限再帰で例外になる) |
| CANDIDATE-U-ORACLEHELPER-010 | 深さの上限 3 の境界 | (a) `h1 → h2 → h3` の連鎖で、`h3` だけに `expect(1).toBe(1);`、callback は `h1();`。(b) `h1 → h2 → h3 → h4` の連鎖で、`h4` だけに assertion | (a) なし、(b) oracle なし | 深さの上限を外す (b を「なし」にする)。上限を 2 にする (a を「oracle なし」にする) |
| CANDIDATE-U-ORACLEHELPER-011 | assertion を除く・弱めると違反が復活する | 同じ名前 `expectStatus` の helper で 3 版を作る。(a) `expect(x).toBe(200);`。(b) 本体を空にする。(c) `expect(x).toBeTruthy();` に弱める。callback はどれも `expectStatus(1);` | (a) なし、(b) oracle なし、(c) 弱い | 名前の規則 (`expect*` / `assert*`) だけで通す案 C (b・c を「なし」にする)。解決できた helper を本体を見ずに assertion と数える |
| CANDIDATE-U-ORACLEHELPER-012 | 現行の regex 判定の維持 | (a) callback に `expect(1).toBe(1);`。(b) assertion なし。(c) `expect(1).toBeTruthy();` だけ。(d) `const later = () => expect(1).toBe(1);` だけ (入れ子の関数の中の一致を現行どおり数える)。(e) `it.fails("x", () => { const v = 1; })` | (a) なし、(b) oracle なし、(c) 弱い、(d) なし、(e) violation 0 件 (判定対象外のまま) | callback 本文も AST の浅い走査で数える (d を「oracle なし」にする)。callback 本文の数を足さない (a・c・d を変える)。`it.fails` を判定対象に加える (e を「oracle なし」にする) |
| CANDIDATE-U-ORACLEHELPER-013 | 実例の形 (入れ子の scope の helper、`try` の中の呼び出し、arrow の引数) | U-CMDINPUT-007 と同じ形: `describe` の本体に `captureError` と `expectPercentTokenError` (expect 3 本) を宣言し、`forEach` → `describe` の中の `it` が `try { expectPercentTokenError(() => build(...), root); } finally { ... }` を呼ぶ | なし | top-level の宣言だけで探す。helper を解決しない |
| CANDIDATE-U-ORACLEHELPER-014 | helper 宣言の形 | (a) `const h = (x: number) => expect(x).toBe(1);` (式本体の arrow)、callback は `h(1);`。(b) 同じ本体を `let h = ...` で宣言 | (a) なし、(b) oracle なし | `let` / `var` の関数も helper 宣言として扱う (b を「なし」にする)。ファイル全体から名前で探す |
| CANDIDATE-U-ORACLEHELPER-015 | helper の `assert` 計数とコメント | (a) `function h(x) { assert.equal(x, 1); }`、callback は `h(1);`。(b) `function h(x) { // expect(x).toBe(1);\n }`、callback は `h(1);` | (a) なし、(b) oracle なし | helper の `assert` を数えない (a を「oracle なし」にする)。helper を text の regex で数える (b を「なし」にする) |

上の 15 件を本契約の候補範囲とする。正式 ID (`U-ORACLEHELPER-NNN`) への昇格は、Red の証拠と pair の整合を review したあとに行う。

## 4. mutation が区別できることの確認

契約の作成時に、L6 §3 を写した使い捨ての試作 (repo には入れていない) と、上の各 mutation を切り替える試作を作り、全候補の fixture を流した。各行で宣言した mutation は、その行の fixture のうち少なくとも 1 件で、正しい実装と違う結果を返した (012 の (e) の `it.fails` の mutation だけは試作に入れておらず、callee の text の比較から導いた)。たとえば「入れ子の関数の中の呼び出しを起点にする」を落とすのは 008 だけであり、「停止の保証を外す」で例外になるのは 009 だけである。

試作は実装の正本ではない。実装の PR では、各候補の Red が対象の assertion で落ちること (import や setup の不備ではないこと) を canonical runner で確かめる。

確認の範囲: 試作を origin/main (`62524999b`) の `tests/**/*.ts` 343 本に当てたところ、現行と判定が変わる callback は 0 件だった (U-CMDINPUT-007 / 008 はまだ `it.fails` で、判定対象の外にある)。候補 013 は、`it` に戻したあとの形で「なし」になる。

## 5. Red → Green → Refactor の工程

1. **契約確認**: L6 と本書の pair、`docs/governance/ddd-tdd-rules.md` の `test-oracle-strength` を照合する。
2. **Red**: 契約の merge 後、source を変えずに、現行で落ちる候補 (001・003・004・009 の (b)・010 の (a)・011 の (a) と (c)・013・014 の (a)・015 の (a)) を `it.fails` で登録する。現行ですでに期待値どおりの候補 (002・005〜008 など) は `it` で登録し、`it.fails` に偽装しない。
3. **Green**: L6 の最小実装で、全候補と既存の `tests/ddd-tdd-rules.test.ts` を通す。
4. **Refactor**: Green のあとに限る。`tests/` の差分 0 で、判定の境界を変えない。

## 6. 非目標

- 他ファイルの helper、method、property 経由の呼び出しの解決。
- 名前の規則による helper の判定。
- `it.fails` / `it.each` / `test.skip` などを判定対象に加えること。
- callback 本文の regex 計数の癖 (コメントや入れ子の関数の中の一致を数える) を直すこと。
- 解析時間の計測をテストの合否にすること (L6 §7 は実装上の注意であり、oracle ではない)。
- 新しい PLAN、共有の `L7-unit-test-design.md` / `function-spec.md` への索引の追加。
