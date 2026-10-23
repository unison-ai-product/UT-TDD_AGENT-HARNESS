---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_test_oracle_strength_helper_resolution
pair_artifact: docs/test-design/harness/L7-test-oracle-strength-helper-resolution-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_requirement: docs/governance/ddd-tdd-rules.md
next_pair_freeze: L7
issue: 1290
---

# L6 機能設計: test-oracle-strength の同一ファイル helper 解決 (Issue #1290)

> **L6 contract marker**: `analyzeDddTddRules(inputs) => DddTddResult` の `test-oracle-strength` 判定 (module 内部の `assertionSummary` / `testOracleViolations`) を対象とする unit-test-granularity contract である。DbC は §4、oracle は専用 L7 の `U-ORACLEHELPER-001`〜`017` が固定する。

> **契約状態**: #1290 で凍結済みの未実装目標契約である。今回の ID 昇格は source 実装・Green・本 PR の closing review PASS を示さない。

## 1. 目的と範囲

`src/lint/ddd-tdd-rules.ts` の `test-oracle-strength` は、`it` / `test` の callback 本文を regex で数え、`expect` / `assert` が無いか truthiness だけなら違反とする (`docs/governance/ddd-tdd-rules.md` の `test-oracle-strength` と `DDD-INV-004` が要求の正本)。callback が同じファイルの helper を呼び、helper の中に本物の assertion がある場合 (例: `tests/runtime-adapter.test.ts` の `expectPercentTokenError` と U-CMDINPUT-007 / 008) も、現状は「oracle なし」と判定する。

本書は、**同じファイルの中で静的に解決できる helper の assertion を、callback の assertion として数える**契約を定める。対象は `assertionSummary` / `testOracleViolations` の判定だけである。次は範囲外とする。

- 名前の規則 (`expect*` / `assert*` 等) だけで helper を assertion とみなすこと (advisor `gpt-6.1-sol` が却下した案 C。検査を弱めるため)。
- 他ファイルからの import、method、property 経由の呼び出しの解決。
- `it` / `test` 以外の callee (`it.fails`、`it.each`、`test.skip` 等) の扱い、callback が関数リテラルでない場合の扱い。いずれも現状維持 (§6)。
- violation の message・行番号・baseline debt key の形式の変更。
- `unit-oracle-substance` など他 rule の変更。

## 2. 用語

| 用語 | 定義 |
|---|---|
| callback | `it(name, fn)` / `test(name, fn)` の第 2 引数で、arrow function か function expression であるもの。現行の判定対象と同じ。 |
| function-like node | `ArrowFunction` / `FunctionExpression` / `FunctionDeclaration` / `MethodDeclaration` / `GetAccessor` / `SetAccessor` / `Constructor` / `ClassDeclaration` / `ClassExpression`。 |
| 浅い走査 (shallow walk) | ある本体の子孫を走査し、本体自身以外の function-like node に入らない走査。 |
| 直接の呼び出し | 本体を浅い走査して見つかる `CallExpression` のうち、callee が単独の `Identifier` であるもの。`try` / `if` / ループ / 引数式の中にあってもよいが、入れ子の function-like node の中にあるものは含まない。 |
| helper 宣言 | 次のどちらかだけ。(a) 本体を持つ `FunctionDeclaration`。(b) `const` 宣言で、名前が単独の `Identifier`、初期化子が `ArrowFunction` か `FunctionExpression` であるもの。 |
| 解決 | 直接の呼び出しの callee 名を、§3.2 の規則で 1 つの helper 宣言に結びつけること。 |
| 書き込み | 名前が単独の `Identifier` で、代入の対象になっているもの。代入演算子 (`=` と `+=` / `??=` などの複合代入) の左辺、`++` / `--` の対象、分割代入の対象、宣言でない `for-in` / `for-of` の左辺を含む。 |

## 3. 判定の契約

### 3.1 全体の流れ

数の組 (`expect` / `assert` / `weak`) から 1 つの判定を出す式 (**判定式**) は、現行 `assertionSummary` と同じである。

- `expect + assert = 0` なら「oracle なし」違反 (`Test cases must contain an explicit expect/assert oracle.`)。
- `assert = 0` かつ `expect > 0` かつ `expect = weak` なら「truthiness だけ」違反 (`Test cases must not rely only on toBeTruthy/toBeFalsy weak assertions.`)。
- それ以外は違反なし。

判定の強さを「oracle なし < truthiness だけ < 違反なし」と順序付ける。callback ごとに次の判定を作り、**最も強いもの**をその callback の判定とする。

1. **callback 本文の判定 (現行のまま)**: callback 本文の text に、現行 `assertionSummary` と同じ 3 つの regex (`\bexpect\s*\(`、`\bassert(?:\.|\s*\()`、`\.toBe(?:Truthy|Falsy)\s*\(\s*\)`) を当てた数に、判定式を当てた結果。入れ子の関数やコメントの中の一致も、現行どおり数える。
2. **helper ごとの判定**: callback から到達できる helper 宣言それぞれについて、その helper 本体だけを §3.3 の AST 計数で数え、判定式を当てた結果。helper 同士の数も、helper と callback 本文の数も、合計しない。

**単調性**: 結果は callback 本文の判定と helper ごとの判定の最大値なので、callback 本文の判定 (= 現行の判定) より弱くなることはない。helper を足す・強めると判定は同じか強い側へしか動かず、本契約で**新しく違反が増えることはない**。変わりうるのは、(a) 違反が消える (到達できる helper のどれかが判定式で違反なし)、(b) 「oracle なし」が「truthiness だけ」に変わる (callback 本文に assertion が無く、helper が truthiness だけ)、の 2 通りだけである。violation の行番号と rule は変わらないので、baseline debt key (`path:line:rule`) も変わらない。

数を合計してから判定式を当てる方式は採らない。regex は `weak` を `expect` と独立に数えるので `weak > expect` がありうる (例: `const e = expect(1); e.toBeTruthy(); e.not.toBeFalsy();` は (1, 0, 2) で違反なし)。ここへ helper の (1, 0, 0) を足すと (2, 0, 2) になり、`expect = weak` で「truthiness だけ」違反が新しく生じる。helper 同士を合計しても同じことが起きる。

### 3.2 名前の解決 (lexical scope)

直接の呼び出しの callee 名は、呼び出し位置から外側へ lexical scope を 1 つずつたどり、**その名前を束縛している最も内側の scope** で決める。最も内側の束縛が helper 宣言でなければ、外側の scope へは進まず「解決できない」とする (shadowing による誤認の防止)。

| scope | その scope の束縛 |
|---|---|
| `SourceFile` / `Block` / `ModuleBlock` / `CaseBlock` | 直下の文の `function` 宣言名、`const` / `let` / `var` の束縛名 (分割代入を含む)、`class` / `enum` 名。`SourceFile` では import の束縛名も含む。 |
| function-like node | 仮引数の束縛名 (分割代入を含む)、function expression 自身の名前、本体を浅い走査して見つかる `var` の束縛名 (hoisting)。 |
| `for` / `for-in` / `for-of` | 初期化子の `const` / `let` / `var` 束縛名。 |
| `catch` 節 | catch 変数の束縛名。 |

解決の結果は次の 3 通りに限る。

- **解決できた**: 最も内側の束縛が、ちょうど 1 つの helper 宣言であり (本体の無い overload signature は数えない)、かつファイルのどこにもその名前への書き込みが無い。
- **解決できない**: 最も内側の束縛が仮引数・`let` / `var`・初期化子が関数でない `const`・import・class / enum・catch 変数のいずれかである。同じ scope に同じ名前の束縛が 2 つ以上ある。どの scope にも束縛が無い (global、未宣言)。ファイルのどこかに同じ名前への書き込みがある (書き込みの位置の scope や、書き込みが実行されるかは問わない)。
- 解決できない呼び出しは **assertion の証拠にしない** (何も足さない)。その先もたどらない。

`let` / `var` の helper を外すのは、再代入でき、静的に本体を 1 つに決められないためである。`function` 宣言も同じ理由で再代入できる (例: `function h() { expect(1).toBe(1); } h = () => {};` のあとの `h()` は assertion を実行しない) ので、書き込みがあれば解決しない。書き込みの判定は同じ名前の一致だけで行い、scope を解決しない。別の scope の同名変数への書き込みでも解決しなくなるが、これは違反が残る方向の誤り (§5) である。

### 3.3 helper の assertion 計数 (AST)

helper の本体 (arrow function の式本体を含む) を浅い走査し、次の `CallExpression` を数える。入れ子の function-like node (helper の中にある、呼ばれない `() => expect(...)` など) とコメント・文字列の中は数えない。

| 数 | 数える呼び出し |
|---|---|
| `expect` | callee が `Identifier` の `expect` である呼び出し。 |
| `assert` | callee が `Identifier` の `assert`、または左辺が `Identifier` の `assert` である property access (`assert.equal(...)` など) の呼び出し。 |
| `weak` | callee が名前 `toBeTruthy` / `toBeFalsy` の property access で、引数が 0 個の呼び出し (`.not.` を挟む場合を含む)。 |

callback 本文 (§3.1 の 1) とは数え方が違う。callback 本文は現行の regex のまま変えず (§6)、helper は新しく導入する証拠なので、コメントや入れ子の関数で水増しされない AST 計数にする。

### 3.4 到達と深さの上限

- 起点は callback 本文の直接の呼び出しである。解決できた helper 宣言を深さ 1 とし、その helper 本体の直接の呼び出し (helper の宣言位置ではなく、呼び出し位置から §3.2 で解決する) を深さ 2 とする。
- **深さの上限は 3** とする (callback → helper → helper → helper)。深さ 4 以上の helper は数えない。
- 探索は幅優先とし、同じ helper 宣言は 1 回だけ判定する (訪問済み集合)。これで循環参照 (自己再帰・相互再帰) があっても停止し、同じ helper を 2 回呼んでも判定は変わらない。
- 停止は深さの上限だけで保証する。訪問済み集合は重複計数の防止を担う。
- callback 本文の中の入れ子の関数 (例: `const f = () => helper();` で、f が呼ばれない) にある呼び出しは起点にしない。

## 4. DbC

関数署名は既存の `analyzeDddTddRules(inputs: DddTddInputs): DddTddResult` を保つ。`assertionSummary` / `testOracleViolations` は module 内部の関数であり、新しい export や source module を足さない。

| DbC | 契約 |
| --- | --- |
| pre | 入力は `scope: "test"` の文書の text だけである。型情報・他ファイル・実行結果を使わない。text が構文として不完全でも、TypeScript parser が返す木の上で判定し、例外で doctor を止めない。 |
| post | callback ごとの判定は §3.1 の 3 通り (oracle なし違反 / truthiness だけ違反 / 違反なし) のどれか 1 つで、callback 本文の判定と helper ごとの判定の最大値である。helper ごとの判定に使うのは §3.2 で解決できた、深さ 3 以内の helper 宣言だけである。解決できない呼び出しは判定に加えない。 |
| invariant | (1) callback 本文の regex 計数と、`it` / `test` の判定対象の選び方は変えない。(2) 判定は helper について単調である。結果は callback 本文の判定より弱くならず、helper を足す・強めても違反は増えない (§3.1 の単調性)。逆に、helper の assertion を除くとその helper の判定は oracle なしになり、結果は残りの判定の最大値へ戻る (helper が 1 つなら callback 本文の判定。違反が復活する)。truthiness に弱めると、その helper の判定は truthiness だけになる。(3) 解析は必ず停止し、callback ごとに訪れる helper 宣言はファイル内の helper 宣言数以下である。(4) violation の message・行番号・rule・baseline debt key の形式は変えない。 |
| oracle | pair の L7 テスト設計の `U-ORACLEHELPER-001`〜`017` が、解決・計数・合成・停止・現行挙動の維持を、それぞれ独立に反証する。正式 oracle ID は同じ L7 pair で定義する。 |

## 5. 失敗の方向

本契約の誤りは、すべて「違反が残る」方向に倒す (fail-close)。

- 解決できない、深さを超える、shadowing されている、同じ名前への書き込みがある、の場合は、helper の assertion を数えない。違反は残り、作者は callback に直接 assertion を書くか、helper を同じファイルの `function` / `const` に置く。
- 呼ばれない入れ子の関数の中の assertion は数えない。
- helper の中で、配列の `forEach` などに渡す callback の中に assertion を書いた場合も、入れ子の関数なので数えない。これは既知の過剰検出 (false positive) であり、名前や実行結果で補わない。

## 6. 変えない挙動

- callback 本文に直接書いた `expect` / `assert` の regex 判定 (コメントや入れ子の関数の中の一致を数える現行の癖を含む)。この癖を直すことは本書の範囲外である。
- 判定対象は callee の text が厳密に `it` / `test` で、第 2 引数が関数リテラルの呼び出しだけ。`it.fails` は対象外のまま (Red 中の `it.fails` は従来どおり検査されない)。
- `docs/governance/ddd-tdd-rules.md` の rule ID 集合、`DDD-INV-004` の文言、baseline debt の書式。

## 7. 実装上の注意 (非機能)

- scope ごとの束縛表は 1 ファイルの解析中に 1 回だけ作り、使い回す。呼び出しのたびに scope を作り直すと、テストファイル数に比例して doctor が遅くなる。
- 新しい依存は足さない。parse 済みの `ts.SourceFile` の上で、TypeChecker を使わずに判定できる。

## 8. 対になるテスト設計

正式 oracle と、それぞれが落とす mutation は pair artifact `docs/test-design/harness/L7-test-oracle-strength-helper-resolution-test-design.md` に記す。
