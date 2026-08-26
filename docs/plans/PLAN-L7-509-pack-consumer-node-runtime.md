---
plan_id: PLAN-L7-509-pack-consumer-node-runtime
title: "PLAN-L7-509 (troubleshoot): Pack/consumer 配布契約の Node 化 — run-bun 間接層の削除と生成物の Bun 依存撤去"
kind: troubleshoot
layer: L7
drive: agent
route_signal: incident
route_mode: incident
status: confirmed
created: 2026-08-25
updated: 2026-08-26
backprop_decision: not_required
backprop_decision_reason: "consumer へ生成する adapter 配線の実行 runtime を Bun から Node へ差し替える。ADR-001 が既に Bun を『新規依存・fallback・検出器 runtime として禁止し、既存経路だけを期限付き migration debt として段階撤去する』と確定しており (ADR-001:26)、本 PLAN はその段階撤去の consumer 面である。導入済み consumer は 0 件 (PO 実確認 2026-08-25) のため外部互換の requirement 変更は発生しない。"
owner: PM / PO
github_issue_id: 408
agent_slots:
  - role: aim
    slot_label: "AIM - run-bun 間接層の削除方式と consumer runtime 契約 (Node 直結) の設計判断"
  - role: tl
    slot_label: "TL - 生成 hook 配線の等価性 (source 形式 / wrapper 形式) と lint 二面の同期のレビュー"
  - role: se
    slot_label: "SE - templates / project-hook / codex-hook-adapter / setup-smoke / distribution readiness の Node 化実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-509-pack-consumer-node-runtime.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - docs/plans/PLAN-L7-462-bun-runtime-withdrawal.md
    - docs/plans/PLAN-L7-507-compiled-distribution-contract-retraction.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence:
  - reviewer: codex-cross-agent-delta
    review_kind: cross_agent
    reviewed_at: "2026-08-26T03:06:26Z"
    tests_green_at: "2026-08-26T02:20:00Z"
    verdict: "FLAG (blocking 3) at 36382aac → 本 HEAD で全件是正 (r3 delta review 依頼中)"
    scope: >-
      Pack/consumer 実行 runtime の Node 化。blocking 1 (wrapper の setup Pack checkout 依存が
      confirmed PLAN-L6-101 §1.1 / §2 に違反) は advisor 諮問の上で選択肢 C (consumer 内で
      解決できなければ typed fail-close) を採択し §2.3-10 として freeze、U-HOOKEXEC-011 /
      U-SETUP-009b3 で oracle 化した。blocking 2 は forbidden_bun_runtime を起動語判定へ改め
      U-CIPOL-027 (bun/bunx/bun.exe を拒否、bundle-check とコメント言及は通す 7 ケース) を追加。
      blocking 3 は PR body の green evidence を新 anchor で再生成。self-contained runtime の
      materialization 契約と upgrade atomicity は issue #420 の後続 PLAN が所有する。
    worker_model: claude-opus-5
    reviewer_model: gpt-5.6-sol
    evidence_path: tests/setup.test.ts
    citations:
      - "tests/setup.test.ts: U-SETUP-004b2 / 009b / 009b2 / 009b3"
      - "tests/hook-native-launcher.test.ts: U-HOOKEXEC-001 / 011"
      - "tests/github-ci-policy.test.ts: U-CIPOL-027"
      - "tests/model-id-ssot-drift.test.ts: (b) adapter mirror"
      - "tests/doctor-test-repository-isolation.test.ts: U-TESTHYGIENE-015"
    green_commands:
      - kind: unit_test
        command: "node scripts/run-vitest-snapshot.ts tests/setup.test.ts tests/project-hook.test.ts tests/codex-hook-adapter.test.ts tests/doctor-setup-smoke.test.ts tests/hook-native-launcher.test.ts tests/runtime-portability.test.ts tests/github-ci-policy.test.ts tests/model-id-ssot-drift.test.ts tests/doctor-test-repository-isolation.test.ts --reporter=dot"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-26T02:20:00Z"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:5c9488817e22d39c2f9ec6ac437a476818684016a0b1b8d7839c30792a90fc66"
        anchor_commit: 6f2c2f9224d1a52549f7e819eac5ac86efdd0fdc
---

# PLAN-L7-509 (troubleshoot): Pack/consumer 配布契約の Node 化

## 1. 背景と優先度

PO 判断 (2026-08-25): 当面のゴールは **Pack の先行リリースと他プロジェクトへの導入**であり、
Bun 是正はその障害物除去である。導入済み consumer は **0 件** (PO 実確認)。

現状の Pack を導入すると、生成物が導入先へ Bun のインストールを強制する。Bun 不在の
プロジェクトでは hook が全数

```
throw new Error("native Bun executable not found; install Bun or add bun.exe/bun to PATH")
```

で落ちる (`src/setup/templates.ts` の `common/run-bun.ts` テンプレート、`findBun()`)。
これが「導入時に邪魔になる」の実体である。`PLAN-L7-462` はこの面を「Pack 解禁時の
後続 PLAN へ deferral」として明示的に残しており (同 PLAN §step 2 fixture 例外節)、
本 PLAN がその後続である。Issue #408 を所有する。

## 2. 設計判断 (freeze)

### 2.1 方式: run-bun 間接層の削除 (置き換えではない)

実測 (main `6c9d773b`) により、consumer 側 CLI entrypoint は既に runtime 非依存である:

```js
// common/ut-tdd.mjs (テンプレート、src/setup/templates.ts:255)
const result = spawnSync(process.execPath, [resolvedCli, ...process.argv.slice(2)], {...})
```

`process.execPath` を使うため node で起動すれば node で CLI が走る。Node 24 は TypeScript を
native に type-strip する (source repo 自身が `node src/cli.ts` で稼働している実証)。
一方 hook 配線は

```
settings.json:  "command": "node", args: [".ut-tdd/bin/run-bun.ts", ".ut-tdd/bin/ut-tdd.mjs", ...]
```

と node → run-bun.ts → findBun() → bun という間接層を挟んでおり、この層の機能は
**Bun を強制することだけ**である。よって新しい launcher を発明せず、**間接層を削除して
hook を `node .ut-tdd/bin/ut-tdd.mjs <sub>` へ直結する**。

`wrapperArgs` (src/lint/project-hook.ts) は既に `WRAPPER_CLI` (= `.ut-tdd/bin/ut-tdd.mjs`)
から始まる配列であり、この方式は既存契約から一意に導かれる (advisor 相談は不要と判断:
新方式の発明ではなく、既存 entrypoint 契約への直結)。

### 2.2 却下した代替

| 案 | 判定 | 理由 |
|---|---|---|
| `run-node.ts` を新設して間接層を維持 | 却下 | 間接層の機能は runtime 強制だけであり、node 直起動で同じ argv 契約が成立する。層を残す理由がない (最小実装原則) |
| shebang 依存 (`#!/usr/bin/env node` で直接実行) | 却下 | Windows で shebang は機能しない。hook は executable=node + argv 完全一致が既存の受理形式 |

### 2.3 契約変更点 (freeze)

1. **hook 配線 (Claude `settings.json` / Codex `hooks.json` 生成物)**:
   `node .ut-tdd/bin/run-bun.ts .ut-tdd/bin/ut-tdd.mjs <sub...>` → `node .ut-tdd/bin/ut-tdd.mjs <sub...>`。
   単一定義源は従来どおり `src/lint/project-hook.ts` の `REQUIRED[].wrapperArgs`
   (PLAN-RECOVERY-06 の同期原則は不変)。
2. **`WRAPPER_HOOK_LAUNCHER` 定数と `common/run-bun.ts` テンプレートを削除**。
   生成物 `.ut-tdd/bin/run-bun.ts` は生成されなくなる。
3. **`common/ut-tdd.mjs` の shebang** を `#!/usr/bin/env bun` → `#!/usr/bin/env node`
   (Windows では実行に関与しないが、POSIX 直接実行と文書としての正しさのため)。
4. **codex 向け prose command (`wrapperCommand`)**: `bun .ut-tdd/bin/ut-tdd.mjs <sub>` →
   `node .ut-tdd/bin/ut-tdd.mjs <sub>`。
5. **consumer CI テンプレート**: `oven-sh/setup-bun@v2` → `actions/setup-node@v4`、
   `bun install --frozen-lockfile` → `npm ci` (PR #406 で `package-lock.json` が Pack に
   同梱済みであることが前提)、`bun run typecheck|test` → `npm run typecheck|test`、
   `bun .ut-tdd/bin/ut-tdd.mjs ...` → `node .ut-tdd/bin/ut-tdd.mjs ...`。
6. **consumer readiness preflight** (`buildConsumerReadinessPlan`): blocking 条件
   `bun>=1.3` → `node>=24`。`src/cli/distribution.ts` の `bun --version` probe と
   `~/.bun/bin` 探索路を撤去し、node probe へ差し替える。
7. **setup-smoke doctor**: 必須ファイルから `run-bun.ts` を除去、
   `native-bun-launcher-contract` チェックを撤去、期待 invocation から launcher を除去。
8. **runtime-portability の Bun debt allowlist**: 撤去で実カウントが減る path の pin を
   実測値へ切り下げる (pin は上限であり超過のみ違反だが、stale pin は再流入の余地になる)。
9. **`common/ut-tdd.mjs` の npm package 解決分岐 (`node_modules/ut-tdd/src/cli.ts`) を削除**
   (実装中に判明した実バグの是正、freeze への追記)。Node は `node_modules/` 配下の
   TypeScript を type stripping できず `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` で
   失敗する (`--experimental-transform-types` でも不可、実測)。launcher を bun から node へ
   倒した結果この分岐は**構造的に実行不能な死路**になるため、置換ではなく削除する。
   consumer の解決経路は repo-local source (`src/cli.ts`) 1 本に縮約され、未解決時の
   エラーメッセージも「dependency を追加せよ」から「setup Pack checkout を保持せよ」へ改める。

10. **consumer wrapper は setup 元 Pack checkout を解決先にしない (C 形、delta review 是正)**。
   `{{UT_TDD_SOURCE_CLI_JSON}}` placeholder と `SETUP_SOURCE_CLI` 埋め込みを撤去し、解決先を
   consumer 内 `<repo>/src/cli.ts` (+ `src/setup/index.ts` の同時存在) のみとする。不在なら
   `consumer_runtime_absent` で exit 127 の typed fail-close。

   **根拠**: confirmed `PLAN-L6-101` §1.1 は「source development repository、source worktree、
   source `.ut-tdd`、ローカル Pack checkout は runtime discovery 入力にしてはならない」と定め、
   §2 は development repo / worktree / local Pack checkout が物理的に存在しない状態での導入再現
   (`CANDIDATE-PACKISO-001`) を要求する。setup 元絶対パスの埋め込みはこの confirmed 契約への
   違反であり、issue への後送では解消できない。

   **選択肢と判断** (advisor `claude-fable-5`、`--decision design`):
   - A: harness source を consumer の runtime root へ materialize (node_modules 外なので
     type strip 実行可能) → **方向としては終着形だが本 PR 内実装は却下**。配置形式・digest 束縛は
     方式判断であり pair-freeze が必要で、かつ `PLAN-L6-93` の sealed compiled ESM と
     「consumer 側 harness 実体の配置形式」の所有権が衝突する (interim か supersede かを契約側で
     先に決めないと duplicate-artifact-ownership 型の drift になる)。
   - B: 契約違反のまま merge して issue #420 へ後送 → **却下**。運用規律再締結 (2026-08-03) が
     名指しで禁じたパターンであり、§2 の source 不在 oracle を最初から赤にする負債を作る。
   - C: consumer 内で解決できなければ typed fail-close → **採択**。本 PR の論点 (Node 化 +
     実行不能な死路の削除) に収まり、契約違反を silent に残さない。導入済み consumer は 0 件なので
     壊す実行系が無い。
   materialization 契約 (配置先 / artifact digest 束縛 / L6-93 との関係) の freeze は後続 PLAN
   (issue #420) が所有する。初回 materialize + digest 束縛が 1 論点、upgrade atomicity は次の論点
   (consumer 0 件の現時点では upgrade 経路が存在しない)。

### 2.4 対象外

- `bun.lock` の Pack 同梱と `.gitattributes` の `bun.lockb binary` 行 (PR #406 が
  「bun.lock + package-lock.json 両方」を oracle にしたばかりであり、lockfile 集合の
  変更は別論点)。
- source repo 自身の `bun:sqlite` 二重ドライバ (別 PR、`PLAN-L7-507` §4.2)。
- `tests/distribution-acceptance.test.ts` の acceptance 実行系全体の書き換えは、
  生成物の変更に追随する最小限に留める。

## 3. 受け入れ条件

- AC-1: `ut-tdd setup` の生成物 (settings.json / hooks.json / .ut-tdd/bin/*) に `bun` を
  参照する行が存在しない。`run-bun.ts` が生成されない。
- AC-2: 生成 hook 配線が `node .ut-tdd/bin/ut-tdd.mjs <sub>` の argv 完全一致形式で、
  project-hook / codex-hook-adapter 両 lint が受理する (単一定義源の同期が保たれる)。
- AC-3: consumer readiness が Bun 不在・Node 24 以上の環境で blocking を出さない。
- AC-4: consumer CI テンプレートが Bun 系 action / コマンドを含まない。
- AC-5: `harness-check` (typecheck / vitest / biome / doctor) が緑。
- AC-6: Bun 不在を模した消費側の smoke (fake PATH で bun を隠した状態) で hook 起動が
  成立する oracle が存在する。

## 4. 検証

`node scripts/run-vitest-snapshot.ts tests/setup.test.ts tests/project-hook.test.ts
tests/codex-hook-adapter.test.ts tests/doctor-setup-smoke.test.ts
tests/hook-native-launcher.test.ts tests/runtime-portability.test.ts --reporter=dot`
を根拠とする。green_commands は実装 PR の confirm と同時に記録する。
