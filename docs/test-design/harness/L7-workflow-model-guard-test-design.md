---
title: "L7 workflow model guard test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/workflow-model-guard.md
status: draft
updated: 2026-11-10
issue: 1604
---

# Workflow の agent のモデルを Haiku と Sonnet に限る guard テスト設計 (issue #1604)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/workflow-model-guard.md` (未実装の目標契約) の §3 hook の登録、§4 判定の順序、§5 走査、§6 既定のモデル、§7 拒否の符号、§8 不変条件である。共有の `docs/test-design/harness/L7-unit-test-design.md` には索引行を足さない。本書が詳細の正本であり、oracle を候補 ID `CANDIDATE-U-WFGUARD-001` から続き番号で宣言する。

正式 ID (`U-WFGUARD-*`) は、src を含まない昇格 PR で Red (`it.fails`) と一緒に入れる (候補の扱いは `L7-consumer-worktree-runtime-test-design.md` の `CANDIDATE-U-CWTRT-*` と同じ流儀)。進め方は設計保護 gate の三段階に従う。

1. **Red**: 候補 ID を引用した `it.fails` を入れる。
2. **昇格 (src を含まない)**: 接頭辞 `CANDIDATE-` を外した正式 ID へ全件改め、テスト名の引用を同時に書き換える。昇格を Red より先に入れると、未引用の正式 ID を `oracle-test-trace` が拒否する。
3. **実装 PR**: `it.fails` を `it` に戻して Green にする。実装 PR は `docs/test-design/` を変えない。

## 2. fixture とテストレベル

- **unit (純粋関数)**: `scanWorkflowScript` と `evaluateWorkflowGuard` を直接呼ぶ。`ctx` は `{ env, readScript }` を差し込み、fs も実環境変数も使わない。入力は `{ tool_name, tool_input }` の envelope。
- **hook process**: temp directory に `.claude/hooks/workflow-guard.ts` を呼べる最小の構成を作り、hook を `node` の子プロセスで起動して stdin を渡し、stderr と exit code を観測する。`scriptPath` のケースは temp directory に script ファイルを置く。
- **static (静的照合)**: `.claude/settings.json` と `.claude/CLAUDE.md` の実体を読む。開発 repo を読むテストファイルは `src/doctor/test-repository-isolation.ts` の `repositoryReadContracts` に登録行が要る (Red と同じ PR に登録行だけを足す)。
- script の例は、`export const meta = { ... }` で始まる plain JavaScript の文字列とする。

## 3. 候補の oracle

### 3.1 通す例 (exit 0)

| ID | レベル | 入力 | 期待 |
|---|---|---|---|
| `CANDIDATE-U-WFGUARD-001` | unit | script: `agent("p", { model: "haiku" })` 1 つ。env `CLAUDE_CODE_SUBAGENT_MODEL` は未設定 | code 0。`model` を全 agent() に明示した script は環境変数に依存しない。反例: 明示があっても環境変数を要求する実装 |
| `CANDIDATE-U-WFGUARD-002` | unit | script: `agent("p", { model: "sonnet" })` のみ。env 未設定 | code 0 |
| `CANDIDATE-U-WFGUARD-003` | unit | script: `agent("p", { label: "x" })` (model 省略)。env `CLAUDE_CODE_SUBAGENT_MODEL=haiku` | code 0。env が `sonnet` でも code 0 |
| `CANDIDATE-U-WFGUARD-004` | unit | `meta.phases` の entry に `model: "haiku"` があり、agent() は全て `model: "sonnet"` を明示している | code 0。`meta.phases[].model` も検査され、許可値なら通る |
| `CANDIDATE-U-WFGUARD-005` | unit | script: `agent("p", { model: "claude-haiku-5-5" })` と `{ model: "claude-sonnet-5-5" }`。さらに `{ model: " Haiku " }` (前後の空白・大文字) | 3 つとも code 0。全名は `normalizeModelFamily` の結果に従って通る。反例: 全名を一律に拒否する実装、大文字を拒否する実装 |
| `CANDIDATE-U-WFGUARD-006` | unit | `tool_name` が `Workflow` でない envelope (例: `Bash`) | code 0 (W2) |
| `CANDIDATE-U-WFGUARD-007` | hook process | `tool_input.script` に 001 の script。env を未設定にして hook を起動 | exit 0、stderr は空。反例: 通る呼び出しで stderr に出力する実装 |

### 3.2 拒否する例 (exit 2 と reason)

| ID | レベル | 入力 | 期待 |
|---|---|---|---|
| `CANDIDATE-U-WFGUARD-008` | unit | script: `agent("p", { model: "opus" })`、および `{ model: "fable" }`、`{ model: "claude-opus-5-5" }`、`{ model: "claude-fable-5-1" }` | 各々 code 2、reason `workflow_model_not_allowed`。反例: 全名なら通す実装、`opus` を通す実装 |
| `CANDIDATE-U-WFGUARD-009` | unit | `meta.phases` の entry の `model: "opus"`、agent() は全て `haiku` を明示 | code 2、`workflow_model_not_allowed`。反例: agent() の opts だけを検査して `meta.phases[].model` を見落とす実装 |
| `CANDIDATE-U-WFGUARD-010` | unit | script: `const m = "opus"; agent("p", { model: m })`、`agent("p", { model })` (shorthand)、`agent("p", { model: pick() })`、`agent("p", { model: "ha" + "iku" })`、`agent("p", { model: cond ? "haiku" : "sonnet" })` | 各々 code 2、`workflow_model_not_literal`。反例: 変数・式・shorthand を通す実装 |
| `CANDIDATE-U-WFGUARD-011` | unit | script: ``agent("p", { model: `${x}` })`` (置換あり)。比較: ``{ model: `haiku` }`` (置換なしの逆引用符) | 前者は code 2、`workflow_model_not_literal`。後者は code 0。反例: template を一律に拒否する実装、置換ありを通す実装 |
| `CANDIDATE-U-WFGUARD-012` | unit | 代入の形: `opts.model = "opus"`、`opts["model"] = x`、`{ "model": "opus" }`、`{ 'model': "opus" }` | 各々 code 2 (literal の opus は `workflow_model_not_allowed`、変数は `workflow_model_not_literal`)。反例: `model:` の識別子形だけを数える実装 |
| `CANDIDATE-U-WFGUARD-013` | unit | `tool_input.scriptPath` のみ。`readScript` が不在で throw する | code 2、`workflow_script_unreadable`。比較: `readScript` が 001 の script を返すと code 0。`script` と `scriptPath` が両方あるときは `script` を使い、`readScript` を呼ばない |
| `CANDIDATE-U-WFGUARD-014` | unit | `tool_input` が `{ name: "saved-workflow" }` だけ (`script` / `scriptPath` 無し)。`args` や `resumeFromRunId` を足しても同じ | code 2、`workflow_script_unreadable`。`readScript` を呼ばない。反例: name を見て通す実装 |
| `CANDIDATE-U-WFGUARD-015` | unit | script: `agent("p", { label: "x" })` (model 省略)。env を (a) 未設定 (b) 空文字 (c) `opus` (d) `unknown` にする | 各々 code 2、`workflow_default_model_unset`。反例: 省略を session のモデルとして通す実装、env が空でも通す実装 |
| `CANDIDATE-U-WFGUARD-016` | unit | script: 2 つの agent() のうち 1 つだけ `model: "haiku"`、もう 1 つは省略。env 未設定 | code 2、`workflow_default_model_unset` (1 つでも省略があれば env を要求する)。env `haiku` なら code 0 |
| `CANDIDATE-U-WFGUARD-017` | unit | script: `agent(prompt, opts)` (opts が変数で、切り出しの中に `model` が無い)。env 未設定 | code 2、`workflow_default_model_unset`。env `haiku` なら code 0。定義側の `const opts = { model: "opus" }` を足すと `workflow_model_not_allowed` |
| `CANDIDATE-U-WFGUARD-018` | unit | script: `workflow("other", args)`、`workflow({ scriptPath: "x.js" })` | 各々 code 2、`workflow_nested_not_scannable` |
| `CANDIDATE-U-WFGUARD-019` | unit | script: `agent("p", { agentType: "code-reviewer", model: "haiku" })` | code 2、`workflow_agent_type_not_allowed` |
| `CANDIDATE-U-WFGUARD-020` | unit | 閉じていない文字列 / template / comment、対応しない括弧を含む script | 各々 code 2、`workflow_script_unreadable`。反例: 走査を諦めて通す実装 |
| `CANDIDATE-U-WFGUARD-021` | unit | comment `// model: "opus"` だけを含む script と、prompt 文字列に `model: opus` を含む script (agent() は全て haiku を明示) | 各々 code 2 (fail-close の誤検出)。本ケースは設計 §5 の「誤検出は拒否側」の挙動を固定する。反例: 誤検出を避けるために comment や文字列の中を読み飛ばす実装 (見逃しの余地が生まれる) |
| `CANDIDATE-U-WFGUARD-022` | unit | `scanWorkflowScript` の返り値: model が 3 か所 (agent() の opts 2、`meta.phases` 1)、model 省略の agent() が 1 | `models` が 3 件で過不足が無い。`omittedModelCalls` は 1。反例: 重複を落とす・数え漏らす実装 |

### 3.3 入力の検証と bypass の不在

| ID | レベル | 入力 | 期待 |
|---|---|---|---|
| `CANDIDATE-U-WFGUARD-023` | hook process | stdin が (a) 空 (b) 壊れた JSON (c) `{}` (`tool_name` 無し) (d) `{"tool_name": 1}` | 各々 exit 2、stderr に `workflow_guard_input_invalid`。反例: 空 stdin を「入力無し」として通す実装 |
| `CANDIDATE-U-WFGUARD-024` | hook process | opus の script を渡し、環境変数 `UT_TDD_ALLOW_RAW_AGENT=1`、`UT_TDD_ALLOW_FOREIGN_EDIT=1`、および `.ut-tdd/state/foreign-edit-override` に理由を書いた marker を置いて起動する | 全てで exit 2。bypass の経路が無い。反例: agent-guard の bypass を流用する実装 |
| `CANDIDATE-U-WFGUARD-025` | hook process | 008 / 010 / 013 / 014 / 015 の拒否ケース | stderr が `[ut-tdd-guard] BLOCK: <reason>:` で始まる 1 行で、設計 §7 の表の「直し方」の文を含む。`workflow_model_not_allowed` は「haiku か sonnet」と「Agent tool か委譲経路」の両方に触れる。反例: 符号だけで直し方が無い実装、複数行の出力 |
| `CANDIDATE-U-WFGUARD-026` | static | `src/runtime/workflow-guard.ts` と `.claude/hooks/workflow-guard.ts` の source text | `evaluateAgentGuard` を呼ばず、`UT_TDD_ALLOW_*` の環境変数名を含まず、`eval` / `Function(` / `vm` を使わず (JavaScript を実行しない)、`child_process` を使う場合は `windowsHide: true` を literal で持つ。hook の最初の import が `windows-hide.ts` である。判定は `normalizeModelFamily` を import して共有し、許可 family の独自の表を持たない |

### 3.4 hook 一覧との照合

| ID | レベル | 入力 | 期待 |
|---|---|---|---|
| `CANDIDATE-U-WFGUARD-027` | static | `.claude/settings.json` の `PreToolUse` | matcher `Workflow` の entry があり、`command` が `node`、`args` が `.claude/hooks/workflow-guard.ts` を指し、`onFailure` が `"block"`。`env.CLAUDE_CODE_SUBAGENT_MODEL` が `haiku`。`CLAUDE_CODE_SUBAGENT_MODEL_FORCE` が無く、`availableModels` が無い |
| `CANDIDATE-U-WFGUARD-028` | static | `analyzeHookParity` (`src/lint/rule-drift.ts`) に実 repo の `.claude/CLAUDE.md` と `settings.json` | `documentedOnly` と `configuredOnly` が空で `ok`。`.claude/CLAUDE.md` の §Hooks に `PreToolUse(Workflow)` の行がある。比較として、doc の当該行を消した入力と、settings の entry を消した入力が、各々 `ok: false` になる (片側だけの変更が fail-close する。既存の `U-RDRIFT-007` と同じ検査の追加分) |
| `CANDIDATE-U-WFGUARD-029` | static | `.claude/CLAUDE.md` の本文 | 規律の文 (workflow の agent は Haiku が既定で、条件が複雑な段だけ Sonnet。上位モデルの検証は Agent tool か委譲経路で行う) が 1 か所にある。`CLAUDE.md` と `AGENTS.md` には複製されない (Rule Placement Convention)。marker 節 (`UT-TDD Adapter Rule Markers`) は変わらない |

## 4. 実装前の実測 (oracle ではない)

設計 §2 の未実測 1〜5 は、実装 PR の前に実測し、結果を設計文書へ追記する。結果に応じて次を改める。

- 実測 1・2: `scriptPath` と `name` の解決が分かれば、`CANDIDATE-U-WFGUARD-013` / `014` に解決できる場合の通す例・拒否する例を足す。
- 実測 3: env が hook に届かないと分かった場合、設計 §6 の環境変数の読み方 (settings.json を hook が直接読む) を改訂し、`CANDIDATE-U-WFGUARD-015` の fixture を改める。
- 実測 4・5: `agentType` の扱いと `workflow(` の扱いを緩められるなら、`CANDIDATE-U-WFGUARD-018` / `019` を改める。

## 5. 注記

- 本書の候補は、昇格前に正式 oracle として扱わない (§1)。
- 受け入れの 1 回の実機確認 (設計 §12) は自動テストの oracle ではない。
- `CANDIDATE-U-WFGUARD-028` は既存の `U-RDRIFT-007` と同じ検査器 (`analyzeHookParity`) を使う。既存のテストは変えず、実装 PR で新しい行が両側に揃うことだけを確かめる。
