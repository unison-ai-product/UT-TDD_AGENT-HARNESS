# UT-TDD コーディング規約

本書は TypeScript/Node core の coding-rule SSoT であり、コード・テスト・設計文書の量と分割の目安も持つ。
Requirements reference: `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` §7.6.1.
実行ゲート: `src/lint/coding-rules.ts` を `ut-tdd doctor` から実行する。

## 最小実装原則 (anti-over-engineering)

要件を満たす最短・最小の実装を選ぶ。over-engineering (投機的なコード・機能の大量生産) は品質欠陥として扱う。

- 新しい型・契約・層・registry・receipt・機能を足す前に、既存の型/関数/データで解けないかを先に問う (YAGNI)。将来の投機で契約や抽象を増やさない。
- 同じ問題は「コード・機能を大量に作る」より「短く解く」方を優先する。行数・型数・分岐が増える解は、要件が実際に要求している場合だけ採る。
- object-oriented DDD を採る理由は、ドメインを小さく凝集した型で表現して code 量と分散を減らすためであって、ceremony (wrapper / envelope / registry の積み増し) を増やすためではない。DDD が code を膨張させているなら設計を疑う。
- 設計 review / freeze では各契約・型・層について「要件のどの falsifiable な必要から来るか」を問い、答えられない追加は削るか後続 revision へ送る。

## Workflow Placement / workflow 上の位置づけ

coding-rule 文書は workflow step であり、事後の CI note ではない。

- Forward L6: G6/G7 handoff 前に `docs/governance/coding-rules.md` が不変で現在も適用可能か確認する。差分があれば function design delta として更新する。
- Add-feature: `add-design` PLAN が coding-rule 影響を記録する。`add-impl` は影響が `unchanged` か、この SSoT と対応 U-CODE tests に反映済みの場合だけ開始する。
- Refactor / Retrofit / Recovery / Reverse fullback: 実装言語、lint tool、命名、型付け、error-handling style、generated-code boundary を変える場合は implementation freeze 前にこの SSoT を更新する。
- Review: reviewer approval 前に `npm run typecheck`、`npm run lint`、`npx vitest run`、`ut-tdd doctor` を green にする。

## 機械判定ポリシー

以下の block は `loadCodingRulePolicy` が機械読取する。Rule ID は lint 実装と一致させる。

```yaml
coding_rules:
  version: 1
  applies_to:
    source:
      - "src/**/*.ts"
    tests:
      - "tests/**/*.ts"
  rules:
    - id: no-explicit-any
      severity: error
      scope: ["source", "test"]
      description: "explicit any を使わず、unknown、generics、具体型を使う。"
    - id: no-suppression-comment
      severity: error
      scope: ["source", "test"]
      description: "TypeScript、ESLint、Biome の suppression comments を使わない。"
    - id: file-name-kebab
      severity: error
      scope: ["source", "test"]
      description: "TypeScript ファイル名は kebab-case、kebab-case .test.ts、または index.ts にする。"
    - id: max-source-params
      severity: error
      scope: ["source"]
      description: "source の関数、method、constructor、arrow function の引数は最大 3 個とし、それを超える場合は input object を使う。"
    - id: structured-error-handling
      severity: error
      scope: ["source"]
      description: "catch block は記録、変換、明示的な失敗 state の返却、または fail-open intent の文書化を行う。未文書化の空 catch と rethrow-only catch は禁止する。"
    - id: module-boundary
      severity: error
      scope: ["source"]
      description: "core module は定義済み依存方向に反する import をしてはならない。共有 logic は lower-level module へ移す。"
    - id: machine-surface-language
      severity: error
      scope: ["source", "test"]
      description: "機械向け CLI、doctor、lint、gate、JSON、env、status、oracle surface は安定した ASCII English decision token を使う。"
```

## ドメイン・構造設計規約 (PLAN-L4-21)

本節は ZIP 94/95 相当の L4 設計契約である。上の `coding_rules` YAML は現行 hard gate の正本であり、本節の
追加 rule は L6/L7 実装 PLAN で analyzer と oracle を追加してから YAML の hard gate へ昇格する。

### 値オブジェクト

- VO は完全コンストラクタを持つ。必須値を後から setter で埋める初期化は禁止する。
- VO は immutable とし、public mutable field / setter / mutable collection の外部公開を避ける。
- user input 由来の `create` と persisted/projection 由来の `reconstruct` を分離する。
- invalid input は `null` / `false` で潰さず、typed finding、zod issue、または explicit error state として返す。
- VO 値域と正規化は呼び出し側へ散らさず、schema SSoT または VO module に置く。

### クラス・メソッド構造

| rule id | 設計閾値 | 目的 |
|---|---|---|
| `max-nesting-depth` | source function 内の制御ネストは原則 3 以下 | main path を浅くし、guard clause / helper 抽出を促す |
| `max-function-lines` | source function / method は概ね 80 nonblank lines 以下 | 1 関数 1 責務を保つ |
| `max-cyclomatic-complexity` | source function の分岐点は概ね 12 以下 | policy table / registry / strategy への外部化を促す |
| `command-query-separation` | command は mutation、query は読み取りに分離 | 副作用と戻り値の混在による検証不能性を避ける |
| `prefer-guard-clause` | 正常系を深い `else` に閉じ込めない | 変更時の局所性とレビュー容易性を上げる |

hard gate 化の順序:

1. 既存 repo の実測値を L7 実装 PLAN で記録する。
2. false-positive が出やすい CQS / guard clause は限定 pattern から始める。
3. 既存超過は silent grandfather にせず、refactor candidate または期限付き例外として記録する。
4. analyzer 実装と L7 oracle が揃った rule だけ `coding_rules` YAML の hard gate へ昇格する。

## 量・分割・Refactor の目安

本節は、コード・テスト・設計文書の量と分割、重複の統合、「Refactor なし」の判定について、どこを見ればよいかを 1 か所にまとめる。値の持ち主が別にあるものは写さず、path と節で指す。上の `coding_rules` YAML が hard gate の正本であり、本節の目安は、ここに明記したものを除いて gate ではない。

### 量の上限

| 対象 | 上限 | 値の持ち主 | 状態 |
|---|---|---|---|
| 設計文書 (L6 topic・L7 topic・layer 文書) の行数と責務の数 | 値は写さない | `docs/design/harness/L6-function-design/doc-split-gate.md` §4.2 | 未実装 (#1307〜#1309) |
| src・tests のファイルの行数 | 未定 | #1310 で決める | 未定 |
| 関数の行数 | 80 nonblank 行 | 本書「クラス・メソッド構造」の `max-function-lines` | gate ではない (gate 化は #1310) |
| 循環的複雑度 | 12 | 本書「クラス・メソッド構造」の `max-cyclomatic-complexity` | gate ではない (gate 化は #1310) |
| 制御のネスト | 3 | 本書「クラス・メソッド構造」の `max-nesting-depth` | gate ではない (gate 化は #1310) |
| 関数の引数 | 3 | 本書「機械判定ポリシー」の `max-source-params` | hard (`src/lint/coding-rules.ts`) |
| PR の量 | 1 論点 | `CLAUDE.md` §PR スコープ規律 3 (新規 source_module 1 個 + 対になるテスト + 最小配線) | 規律 |

次の値は、設計上の上限ではなく、Refactor の候補を出す値である。超えたものは負債候補として登録され、Refactor の入力になる。超えたこと自体は違反ではなく、上の上限とは意味が違う。

| 指標 | 現行値 | 持ち主 |
|---|---|---|
| 循環的複雑度 | 関数あたり 15 超 | `docs/governance/vmodel-refactor-qa-release-gates.md` §2.1 |
| 重複コード率 | 5% 超 | 同上 |
| 関数の行数 (helper 抽出の候補) | 120 行 | `src/state-db/refactor-candidate-policy.ts` の `extractHelperLines` |
| module の行数 (分割の候補) | 700 行 | 同 `splitModuleLines` |
| module の export 数 (分割の候補) | 24 | 同 `splitModuleExports` |
| 重複した関数 (統合の候補) | 10 行以上 | 同 `dedupeFunctionMinLines` |

### 責務の数え方と分割の判断

- 設計文書: 責務の数え方は `docs/design/harness/L6-function-design/doc-split-gate.md` §3 に従う。
- 関数: 1 関数 1 責務とする。
- module: 1 module の責務の数え方とファイル単位の上限は #1310 で決める。
- PR: 新規 source_module 1 個を 1 つの論点とする (`CLAUDE.md` §PR スコープ規律 3)。

判断は次のとおりとする。上限を超えたら分割する。上限の内側でも、変更理由が 2 つ以上あるなら分割を検討する。

### 重複を統合する条件

重複を作らず 1 か所に置く規則文は、`CLAUDE.md` §Rule Placement Convention が持つ。設計文書・コード・tests の重複について、統合を義務にする閾値は #1304 で確定する。確定するまで、本節は閾値を持たない。

### 「Refactor なし」でよい条件と判定者

- 条件: 実装 PR で「Refactor なし (理由)」と書いてよい条件は、#1300 で確定する。確定するまで、本節は条件を持たない。
- 判定者: 条件を満たすかは、成果物を書いていない非著者 family の reviewer が判定する。著者の自己申告は根拠にしない。
- 区別: 実装 PR の中の Refactor commit (Green の後の `refactor:`。`CLAUDE.md` §PR スコープ規律 5 と `skills/test-driven-development.md`) と、Refactor mode (独立した作業。`docs/process/modes/refactor.md`) は別のものとして扱う。
- 大きな構造変更の行き先: PLAN ではなく、Refactor Issue と設計文書とする (PLAN 凍結、#1166)。

## 機械 surface の言語

機械読取・機械解析される surface は安定した ASCII English token を使う。
人間向け prose は日本語でよい。ただし tools、agents、logs、tests が依存する判定語は、
日本語文字列や記号に依存してはいけない。

必須 ASCII 判定 token の例:

- `OK`
- `violation`
- `warning`
- `skipped`
- `note`
- `error`
- `ready` / `not ready`

これは CLI output、`doctor` messages、lint/gate messages、JSON keys、
environment variable names、rule IDs、oracle IDs、status words、およびそれらの
surface に対する test assertions に適用する。日本語説明は token の後に置けるが、
token 自体は ASCII のままにする。

## 人間向けメモ

- `npm run typecheck`、`npm run lint`、`npx vitest run`、`ut-tdd doctor` は TypeScript core 変更の最小 verification set である。
- test helper の引数数は `max-source-params` の上限対象外とする。ただし tests も no-any、suppression comment 禁止、命名規則には従う。
- fail-open は catch block が明示 state を返す/記録する、または fail-open intent をその場に文書化する場合だけ許可する。silent catch block と rethrow-only catch block は例外ではない。
- boundary rules は v2 では意図的に最小とする。`lint` は pure、`runtime` は governance checks より下位、`schema` は feature modules より下位に置く。
- 例外は inline comment で処理しない。先に policy PLAN を追加し、この SSoT と lint tests を同時に更新する。
- **変動点外部化 (左肺設計義務、定義 = `docs/design/harness/L5-detailed-design/internal-processing.md` C.7)**: 設計 doc の変動点 (変更・追加が頻出する箇所 = project 差 / 増える集合 / 差し替え実装 / 閾値対応表) は設計時に外部化 (config/registry/policy) し、外部化設計 (何が変わる/機構/固定契約/未知キー fail-close) を doc に内包する。ハードコード→後日 retrofit の発生源を潰す。変動しない箇所の外部化は禁止 (過大外部化 = YAGNI)。他 layer 設計 author も本義務に従う。
