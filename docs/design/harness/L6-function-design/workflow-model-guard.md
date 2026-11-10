---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_workflow_model_guard
pair_artifact: docs/test-design/harness/L7-workflow-model-guard-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1604
---

> **L6 contract marker**: `evaluateWorkflowGuard(input, ctx) => GuardDecision` と `scanWorkflowScript(source) => ScanResult` は unit-test-granularity contract である (未実装の目標契約)。DbC は §8 にまとめる。oracle は `docs/test-design/harness/L7-workflow-model-guard-test-design.md` が候補 ID `CANDIDATE-U-WFGUARD-001` から固定する。実装 PR の前に §2 の「未実測の点」を実測して本書へ追記する。

# Workflow tool の agent のモデルを Haiku と Sonnet に限る guard — 関数設計 (issue #1604)

## 1. 目的

Claude Code の Workflow tool (ultracode を含む) は、script の `agent()` で agent を大量に起動する。agent-guard は `PreToolUse(Agent|Task)` だけを見るので、workflow の中の agent は素通りし、Fable / Opus が workflow の中で大量に走る事故が起きうる。本書は、workflow が起動する agent のモデルを Haiku と Sonnet に限り、これを機械で止める契約を定める。

- 上位モデル (Opus / Fable) による検証は workflow の外で行う。手を動かす層なら Agent tool の subagent、判断する層なら委譲経路 (`ut-tdd claude|codex --role <role>`) である (`agent-guard-delegation-boundary.md` §9 の 2 層)。
- **workflow の中で上位モデルを通す例外は設けない** (PO 2026-11-10)。環境変数などの bypass も作らない。

## 2. 前提 (実測、2026-11-10)

| 前提 | 根拠 |
| --- | --- |
| `Workflow` の呼び出しで `PreToolUse` が発火する。`tool_name` は `Workflow` | 記録だけを行う一時 hook での実測 (#1604 のコメント) |
| script を直接渡した呼び出しでは、`tool_input.script` に script の全文が入る。key は `script` だけだった | 同上 |
| workflow の `agent()` が起動する agent では `PreToolUse(Agent\|Task)` は発火しない | 同上 |
| workflow の agent で `SubagentStart` は発火する。`agent_type` は `workflow-subagent`。モデルの欄は無い | 同上 (agent 単位の hook ではモデルが見えないので、agent-guard を広げる方式は採らない) |
| Workflow tool の入力には `script` のほかに `scriptPath` (script ファイルの path)、`name` (保存済み workflow の名前)、`args`、`resumeFromRunId` がある | tool の定義 (公開の仕様) |
| agent のモデルは、script の `model` 指定 > 環境変数 `CLAUDE_CODE_SUBAGENT_MODEL` > session のモデル、の順で決まる | 公式文書 |
| `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` は Agent tool の subagent まで固定する。`availableModels` は main session にも効き、拒否ではなく置き換えになる | 公式文書 (どちらも採らない。§9) |
| script API: `agent(prompt, opts)` の `opts` は `model` のほかに `agentType` (custom subagent 型) を持つ。`workflow(nameOrRef, args)` は別の保存済み workflow か script file を inline で実行する。`meta.phases[]` の各 entry は `model` を持てる。`meta` は pure literal である | workflow-authoring skill の API 一覧 |

### 未実測の点 (実装 PR の前に実測して本書へ追記する)

1. `scriptPath` を渡した呼び出しで、hook の `tool_input` に何が入るか (`scriptPath` だけか、script の全文も入るか)。`scriptPath` が相対 path のときの基準 (hook の cwd か `CLAUDE_PROJECT_DIR` か)。
2. `name` だけを渡した呼び出しで、`tool_input` に何が入るか。保存済み workflow の解決規則 (`.claude/workflows/` などのどこをどの順で探すか)。
3. `settings.json` の `env` に置いた値が、hook の子プロセスの `process.env` に届くか。
4. `agent()` の `agentType` を指定した agent のモデルが、`opts.model` の省略時に何で決まるか (型の定義か、環境変数か)。
5. script の中で agent を起動できる API が `agent()` と `workflow()` のほかに無いか (`pipeline()` / `parallel()` は `agent()` を包むだけと読んでいる)。

実測が済むまで、1・2 は §4 の W3 の既定 (拒否) に従い、3 は届かない前提で §6 の拒否 (`workflow_default_model_unset`) に倒れる。

## 3. 決定 1: hook の登録と入口

- 新しい hook `.claude/hooks/workflow-guard.ts` を `.claude/settings.json` の `PreToolUse` に matcher `Workflow` で登録する。`command` は `node`、`args` は `["${CLAUDE_PROJECT_DIR}/.claude/hooks/workflow-guard.ts"]`、`onFailure` は `"block"` とする。agent-guard と同じ形である。
- 実行系は node (Bun は使わない)。`.claude/hooks/*.ts` の入口なので、`windows-hide-default.md` §3 の規則に従い、`src/runtime/windows-hide.ts` を最初に副作用 import する。hook 内で子プロセスを起動しない (起動する場合は `windowsHide: true` を literal で書く)。
- 判定本体は `src/runtime/workflow-guard.ts` の純粋関数 `evaluateWorkflowGuard(input, ctx)` に置き、hook はその薄い殻にする。`ctx` は `{ env, readScript(path) }` で、ファイル読みと環境変数は ctx から注入する (単体テストで fs を使わないため)。
- block は stderr + exit 2。agent-guard と同じ `[ut-tdd-guard] BLOCK:` の書き出しにする。

## 4. 決定 2: 判定の順序

`evaluateWorkflowGuard` は次の順で最初に当たった規則で終わる。

1. **W1**: stdin が空・JSON として解析できない・`tool_name` が文字列でない → `workflow_guard_input_invalid` (exit 2)。
2. **W2**: `tool_name` が `Workflow` でない → exit 0 (matcher 外。通常は届かない)。
3. **W3 (script の取得)**:
   - `tool_input.script` が非空の文字列ならそれを使う。
   - なければ `tool_input.scriptPath` が非空の文字列のとき、`ctx.readScript` で読む。読めない (不在・権限・非 UTF-8) なら `workflow_script_unreadable`。
   - `script` も `scriptPath` も無く `name` だけがある呼び出しは、解決の規則を実測で確かめるまで `workflow_script_unreadable` で拒否する (fail-close)。実測後の改訂で、解決した実体を読んで W4 以降へ進める経路を足してよい。
   - どれも無ければ `workflow_script_unreadable`。
4. **W4 (走査)**: `scanWorkflowScript(source)` (§5) の結果を次の順で見る。最初に当たった規則で終わる。
   1. 走査できない (文字列・template・comment の閉じ忘れ、括弧の不整合) → `workflow_script_unreadable`。
   2. `workflow(` の呼び出しがある → `workflow_nested_not_scannable`。入れ子の workflow は別の script であり、本 hook からは中身を検査できない。
   3. `agentType` の指定がある → `workflow_agent_type_not_allowed`。custom subagent 型は、型の定義がモデルを決める可能性があり (未実測 4)、静的には確かめられない。
   4. `model` の値が文字列 literal でない → `workflow_model_not_literal`。
   5. `model` の値が literal で、許可されたモデルでない → `workflow_model_not_allowed`。
   6. `model` を省いた `agent()` の呼び出しがある、かつ `ctx.env.CLAUDE_CODE_SUBAGENT_MODEL` が許可されたモデルでない (未設定を含む) → `workflow_default_model_unset`。
5. **W5**: すべて通れば exit 0。

W4 の 4 を 5 より先に置くのは、「値が見えないもの」を「見えて不許可のもの」より先に報告するためで、どちらも block である。

## 5. 決定 3: 走査 (静的な文字列の解析)

JavaScript を実行しない。`scanWorkflowScript(source)` は文字列の走査だけで次を返す。

```
ScanResult = {
  unreadable: boolean,
  nested: boolean,               // workflow( がある
  agentTypeUsed: boolean,        // agentType の指定がある
  models: Array<{ kind: "literal", value: string } | { kind: "dynamic" }>,
  omittedModelCalls: number,     // model を省いた agent( の呼び出しの数
}
```

- **方式**: 正規表現と、文字列・template literal・comment・括弧の対応を数える小さな走査器で書く。`package.json` の dependencies (`commander` / `entities` / `marked` / `semver` / `yaml` / `zod`) に JavaScript の parser は無く、`typescript` は devDependency で hook の実行時に使えない。**新しい依存は足さない**。
- **`model` の指定の検出**: 次の形をすべて `model` の指定として数える。`agent()` の opts と `meta.phases[].model` は区別しない。
  - `model:` (key が識別子・単引用符・二重引用符・逆引用符のどれでも)。
  - shorthand (`{ model }`、`{ model, label }`)。値が変数なので `dynamic`。
  - 代入 (`x.model = ...`、`x["model"] = ...`)。右辺が literal なら literal、でなければ `dynamic`。
- **値の判定**: `model` の直後の値が、単引用符・二重引用符の文字列、または `${` を含まない逆引用符の文字列で、その直後が `,` / `}` / `)` / `]` / 改行 / 終端のどれかなら literal。それ以外 (識別子・式・`'a' + b`・三項・`${}` を含む template・関数呼び出し・spread) は `dynamic`。
- **許可の判定 (literal の値)**: 前後の空白を trim し、agent-guard と同じ `normalizeModelFamily` (`src/runtime/agent-guard.ts`) で family を解決し、`haiku` か `sonnet` なら許可する。`opus`・`fable`・その全名・解決できない値・複数の family に当たる曖昧な値は許可しない。
  - **全名 (`claude-haiku-*` / `claude-sonnet-*`) は許可する**。根拠は 2 つ。(1) agent-guard が同じ関数で全名を受けており、model 名の正規化を 1 か所に揃えると、catalog (`CLAUDE_MODEL_FAMILY_CATALOG`。`tests/model-id-ssot-drift.test.ts` が `MODEL_IDS.claude` との一致を照合する) の更新に自動で追随する。(2) 全名を拒否すると、世代を固定したい利用者に回避の動機が生まれる。曖昧な値 (`haiku-or-opus`) は `normalizeModelFamily` が null を返すので拒否される。
- **`agent(` の呼び出しの検出**: `\bagent\s*\(` に当たる位置から、対応する閉じ括弧までを 1 つの呼び出しとして切り出す。その切り出しの中に `model` の指定が無ければ `omittedModelCalls` を 1 増やす。`agent(prompt, opts)` のように opts が変数のときも、切り出しの中に `model` が無いので「省略」として数える (opts の定義側の `model` は別途、上の規則で検査される)。
- **`workflow(` / `agentType` の検出**: `\bworkflow\s*\(` と、`agentType` の key (`model` と同じ key の形) の存在で判定する。
- **誤検出は拒否側に倒す (fail-close)**: 走査は comment と文字列の中身も `model:` / `agent(` / `workflow(` / `agentType` の検出の対象にする。comment や prompt の文章に `model: opus` と書いた script は拒否される。直し方は「その語を言い換える」ことである。見逃し (拒否すべきものを通す側の誤り) は許さない。
- **限界 (記録)**: key を計算で作る (`{ ["mod" + "el"]: "opus" }`)、`eval` / `Function` で組み立てる、といった意図的な回避は静的な走査では見つけられない。本 guard の目的は、不注意な指定と既定の漏れによる事故の防止であり、悪意のある script の封じ込めではない。

## 6. 決定 4: `model` の省略と既定のモデル

- `model` を省いた `agent()` は拒否しない。代わりに `.claude/settings.json` の `env` に `CLAUDE_CODE_SUBAGENT_MODEL=haiku` を置き、省いた agent が Haiku で走るようにする (公式の優先順位で、script の指定が無いときの既定になる)。
- hook は `ctx.env.CLAUDE_CODE_SUBAGENT_MODEL` を `normalizeModelFamily` で解決し、`haiku` か `sonnet` でなければ (未設定・空・解決できない値を含む)、`model` を省いた `agent()` を含む script を `workflow_default_model_unset` で拒否する。環境変数が効いていない環境で、省略が session のモデルに落ちるのを防ぐためである。
- 環境変数が `haiku` / `sonnet` のとき、`model` を省いた呼び出しは通す。
- **Agent tool の subagent は影響を受けない**: agent-guard が `model` の明示を必須にしている (G4) ので、この既定は Agent tool の subagent に効かない。`CLAUDE_CODE_SUBAGENT_MODEL_FORCE` は設定しない。
- `model` を全 `agent()` に明示した script は、環境変数の値に関係なく通る (W4 の 6 が当たらない)。

## 7. 決定 5: 拒否の符号 (reason) と stderr

stderr は `[ut-tdd-guard] BLOCK: <reason>: <何が拒否されたか>。<直し方>` の 1 行にする。「直し方」は次の表の 1 文である。

| reason | 当たる条件 | 直し方 (1 文) |
| --- | --- | --- |
| `workflow_model_not_allowed` | `model` が literal で、haiku / sonnet 以外 | model を haiku か sonnet にする。上位モデルの検証は Agent tool か委譲経路 (`ut-tdd claude` / `ut-tdd codex` の `--role`) で行う。 |
| `workflow_model_not_literal` | `model` が literal でない (変数・式・template) | model は haiku か sonnet の文字列 literal で直接書く。 |
| `workflow_script_unreadable` | script を取得できない、または走査できない | script を直接渡すか、読める scriptPath を渡す (name だけの呼び出しは使えない)。 |
| `workflow_default_model_unset` | `model` を省いた agent() があり、`CLAUDE_CODE_SUBAGENT_MODEL` が haiku / sonnet でない | 全ての agent() に model を明示するか、CLAUDE_CODE_SUBAGENT_MODEL を haiku か sonnet にする。 |
| `workflow_guard_input_invalid` | stdin が壊れている、`tool_name` が無い | hook の入力を検証できない。続く場合は hook の配線を確認する。 |
| `workflow_nested_not_scannable` | `workflow(` の呼び出しがある | 入れ子の workflow は使わず、1 つの script にまとめる。 |
| `workflow_agent_type_not_allowed` | `agentType` の指定がある | agentType を外し、model を haiku か sonnet にする。 |

最後の 2 行は、静的に検査できない経路を閉じるための追加の符号である。実測 (§2 の未実測 4・5) で検査できると分かれば、本書を改訂して条件を緩める。

## 8. 不変条件 (DbC)

- `evaluateWorkflowGuard(input, ctx) => { code: 0 | 2, message?: string, reason?: Reason }`。
- pre: `input` は JSON として解析済みの値、または解析に失敗したことを示す印である。`ctx.env` は環境変数の写し、`ctx.readScript(path)` は path から UTF-8 の本文を返すか、読めなければ throw する。
- post: code 0 のとき、script の中のすべての `model` の指定は haiku / sonnet の literal であり、`model` を省いた `agent()` があれば `CLAUDE_CODE_SUBAGENT_MODEL` は haiku / sonnet である。それ以外はすべて code 2 と §7 のどれか 1 つの reason である。
- invariant:
  - 純粋である。JavaScript を実行しない。fs と環境変数は ctx からだけ読む。
  - **例外・迂回の経路を持たない**。環境変数・marker file・引数での bypass を設けない (agent-guard の `UT_TDD_ALLOW_RAW_AGENT` に当たるものは無い)。W1 を含め、どの block も無条件である。
  - 判定できないものは block する (fail-close)。「通してよいと確かめられたもの」だけが code 0 になる。
  - agent-guard の判定を変えない。hook は別 entrypoint であり、`evaluateAgentGuard` を呼ばない。
  - `normalizeModelFamily` を共有し、model 名の許可の判定を 2 つ作らない。
- `scanWorkflowScript` の post: 返す `models` は、script の中のすべての `model` の指定を過不足なく含む (見逃しが無い。誤検出は許す)。

## 9. 採らない案と根拠

- **agent-guard を広げて `SubagentStart` で止める**: `SubagentStart` にはモデルの欄が無く、agent が起動してからでは遅い (§2)。
- **`CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`**: Agent tool の subagent のモデルまで固定してしまい、agent-guard の「明示必須」の設計と、Opus / Sonnet の使い分けを壊す。
- **`availableModels`**: main session にも効き、拒否ではなく置き換えになる。main session のモデルを黙って変える副作用が大きい。
- **workflow の中で上位モデルを通す例外 (環境変数での bypass、検証の段だけ Opus を許す)**: PO 決定 (2026-11-10) により採らない。上位モデルの検証は workflow の外にある。
- **`model` を省いた `agent()` を一律に拒否**: script の記述が冗長になる。環境変数の既定 (§6) で Haiku に落とせば、省略は安全に扱える。

## 10. 範囲外

- consumer へ配る template (setup が生成する `.claude/settings.json`) への配線。本 PR では入れない。入れるかどうかは別 Issue で判断する。
- Codex の hook (`.codex/hooks.json`)。Codex に Workflow tool は無い。
- agent-guard (`evaluateAgentGuard`) の変更。
- `SubagentStart` / `SubagentStop` の hook の変更。

## 11. 実装 PR の範囲

本契約の PR は設計文書とテスト設計だけを足し、`.claude/` と `src/` を変えない。次は実装 PR の範囲である。

1. 実装の前に §2 の未実測の点 1〜5 を実測し、本書へ追記する。
2. `src/runtime/workflow-guard.ts` (`evaluateWorkflowGuard` / `scanWorkflowScript`)、`.claude/hooks/workflow-guard.ts` (windows-hide を最初に import)、`.claude/settings.json` の `PreToolUse` (matcher `Workflow`) と `env` の `CLAUDE_CODE_SUBAGENT_MODEL=haiku`。
3. `.claude/CLAUDE.md` の §Hooks の一覧に `PreToolUse(Workflow)` の行を足す。`.claude/settings.json` との機械照合 (`U-RDRIFT-007`、`src/lint/rule-drift.ts` の `analyzeHookParity`) の対象になり、片側だけの変更は fail-close する。両方を同じ PR で更新する。
4. `.claude/CLAUDE.md` に規律の文を足す: 「workflow の agent は Haiku が既定で、条件が複雑な段だけ Sonnet。上位モデルの検証は Agent tool か委譲経路で行う」。Claude Code だけの機構なので、Rule Placement Convention に従いアダプタの `.claude/CLAUDE.md` に置く。
5. 順序は 1、次に 2 と 3 (同じ PR、Red を先に)、最後に 4。実装 PR は本書の方式を変えない。

## 12. 受け入れ

- model が `opus` / `fable` の workflow、`model` が変数の workflow、読めない `scriptPath` の呼び出し、`name` だけの呼び出しが、実際の Claude Code で block され、理由と直し方が表示されることを 1 回確かめた記録を含める (自動テストの oracle ではない)。
- `model: 'haiku'` の workflow が従来どおり動く。
- oracle `CANDIDATE-U-WFGUARD-*` が Green になる。

## 13. 根拠

- issue #1604 (方式の案と、2026-11-10 の実測のコメント)、PO 決定 2026-11-10 (workflow の中に例外を設けない)。
- 既存の契約との関係: `agent-guard-delegation-boundary.md` (2 層、G1〜G6)、`windows-hide-default.md` §3 (hook 入口の wrapper)。
