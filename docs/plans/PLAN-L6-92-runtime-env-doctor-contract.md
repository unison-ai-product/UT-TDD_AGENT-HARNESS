---
plan_id: PLAN-L6-92-runtime-env-doctor-contract
title: "PLAN-L6-92 (add-design/function-spec): runtime-env 検査契約 — AI CLI/拡張の設定ドリフト
  自動検知と修復レシピ提示 (2026-07-22 監査所見の機構化)"
kind: add-design
layer: L6
drive: be
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-22
updated: 2026-07-22
revision_note: "rev2: VSCode 拡張レイヤ所見 (§2.1) を台帳初期内容として追補。autoUpdate off
  の版ずれベクトル、cliExecutable 禁止レシピ、危険側キー warn 候補"
owner: PO / Claude (Fable orchestrator)
parent_design: docs/plans/PLAN-L6-01-function-spec.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: "TL - 検知/修復の責務境界 (検知=機械、修復=提案止まり) と fail-open 禁止の不変条件"
  - role: se
    slot_label: "SE - runtime-env 検査項目の検出器契約と修復レシピ出力形式"
  - role: qa
    slot_label: "QA - 版ずれ/廃止キー/誤配置 fixture の Red oracle と誤検知負例"
generates:
  - artifact_path: docs/plans/PLAN-L6-92-runtime-env-doctor-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-01-function-spec.md
  requires:
    - docs/plans/PLAN-L7-358-doctor-toolchain-scope.md
  references:
    - docs/plans/PLAN-L7-345-toolchain-pin-gate.md
    - docs/plans/PLAN-L7-139-codex-hook-adapter.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
  blocks: []
review_evidence: []
status: draft
sub_doc: edge-case
---

# PLAN-L6-92: runtime-env 検査契約 — AI CLI/拡張の設定ドリフト自動検知

## 1. 目的と実測根拠 (2026-07-22 監査)

UT-TDD は Claude Code / Codex CLI を委譲・hook 面の前提基盤とするが、その実行環境
(CLI バージョン、グローバル/プロジェクト設定、拡張バンドル) のドリフトは現状どの gate
も検査していない。2026-07-22 の手動多重監査で以下の実欠陥が同日に検出された:

1. **版ずれ**: npm codex-cli 0.144.1 に対し VSCode 拡張内蔵 0.145.0 が書いた
   `models_cache.json` をパースできず、起動毎に `failed to load models cache:
   missing field 'supports_reasoning_summaries'` ERROR (advisor 経路で実発生)。
2. **廃止キー**: `~/.codex/config.toml` の `approval_mode = "full-auto"` は現行スキーマ
   (`approval_policy`) で廃止済みのレガシーキーのまま黙示互換パスに乗っていた。
3. **設定誤配置**: `~/.claude/settings.json` 内の `mcpServers` 定義は Claude Code に
   サイレント無視される既知問題 (正位置はユーザースコープ `~/.claude.json`)。実際に
   playwright MCP が一度もロードされていなかった。

いずれも「実測値 vs 期待スキーマ」の照合で決定論的に検知可能だが、人手監査でしか
発見されなかった。本 PLAN はこの検査面を doctor の契約として固定する。

## 2. 検査契約 (function-spec)

新設 scope `runtime-env` (`ut-tdd doctor --scope runtime-env`) は以下を検査する。
全項目 read-only・決定論的・数秒以内 (PLAN-L7-442 doctor 規律に従い長時間検査を含めない)。

| 検査 | 照合内容 | 違反時 |
|---|---|---|
| cli-version-coherence | `codex --version` (実行可能なら) と `~/.codex/models_cache.json` の `client_version` の major.minor 整合 | violation + 修復レシピ (npm 更新 or cache 削除) |
| codex-config-schema | `~/.codex/config.toml` に既知の廃止キー (`approval_mode` 等、台帳管理) が残存しないか | violation + rename レシピ |
| claude-mcp-placement | `~/.claude/settings.json` / `.claude/settings.json` に `mcpServers` が定義されていないか (サイレント無視の誤配置検知) | violation + 正位置への移設レシピ |
| hook-adapter-parity | `.claude/settings.json` と `.codex/hooks.json` の hook 対応面が rule-drift の対と整合するか (既存 rule-drift の runtime-env 面への拡張) | violation |
| hook-timeout-sanity | hook `timeout` が正の秒数で、公式仕様の単位 (秒) を前提とした妥当域か | warn |

不変条件:

1. **検知は機械、修復は提案止まり** (fail-close)。doctor が設定ファイルを自動書換する
   ことは禁止する。修復レシピは「バックアップ → 実測裏取り → 置換 → スモーク」の
   手順文字列として violation メッセージに含める。
2. 外部スキーマ (公式 CLI 仕様) は変動するため、廃止キー・誤配置パターンは検出器内
   ハードコードでなく台帳 (data) として持ち、追補を doc + fixture の対で行う。
3. 環境ファイル不在 (Codex 未インストール等) は検査 skip として明示 report し、
   silent pass にしない (absence-blindness 対策)。
4. ユーザーグローバル設定の内容 (秘密情報を含みうる) を violation メッセージや
   evidence へ原文転記しない。キー名と期待形のみ報告する。

### 2.1 VSCode 拡張レイヤの監査所見 (2026-07-22 追補、台帳の初期内容)

同日の read-only 監査で拡張レイヤも棚卸しした。結論: 拡張固有設定は薄く実体は
CLI 側設定ファイルに集約されるが、以下を台帳へ初期登録する。

1. **`extensions.autoUpdate: "off"` は版ずれの再発ベクトル**。拡張内蔵 CLI が固定
   される一方 npm 側が更新される (逆も) ため、§2 cli-version-coherence が検査で
   補完する前提の運用とする (設定自体の変更は要求しない。意図的 OFF を尊重)。
2. **拡張経由の CLI 一本化は行わない (禁止レシピ)**。`chatgpt.cliExecutable` は
   「DEVELOPMENT ONLY」と明記された開発者向けキーであり、版整合の修復レシピとして
   これを設定させてはならない。整合は「npm 側を拡張内蔵版へ追随更新」で取る。
3. **危険側キーの安全既定チェック (warn 級の台帳候補)**: `claudeCode.
   allowDangerouslySkipPermissions` / `claudeCode.initialPermissionMode` /
   `security.workspace.trust.untrustedFiles` が安全側既定から外れていたら warn。
   2026-07-22 時点は全て安全側 (前 2 者未設定、後者は "open" で情報提供済み)。

## 3. 判断を要する不備は対象外 (スコープ境界)

WIP の陳腐判定・PR 帰属のような判断依存の不備は本検査の対象外とする (2026-07-22 監査
で誤判定→復元が実際に起きた層。自動修復どころか自動判定も fail-close で人間ゲートへ
送る)。upstream 未修正問題 (Windows hook ポップアップ等) は「既知・対応不能」の
ラベル付き情報項目として report してよいが violation にしない。

## 4. L6↔L7 pair / oracle

L7 test-design に `U-RTENV-*` を追加し、少なくとも次を固定する。

1. 版ずれ fixture (cache client_version > CLI 版) が violation + レシピ付きで検出される。
2. 廃止キー fixture (`approval_mode`) が検出され、台帳追補で新キーも検出できる。
3. `mcpServers` 誤配置 fixture が検出される (正位置定義のみの場合は green)。
4. 環境ファイル不在 fixture が skip として明示 report される (silent pass の負例)。
5. doctor が対象ファイルを書き換えない (実行前後の digest 不変)。
6. 秘密情報を含む fixture 設定の原文が violation メッセージへ漏れない。

## 5. AC

- [ ] 検査契約 (§2 の 5 検査 + 不変条件 4 件) が function-spec として固定される。
- [ ] 2026-07-22 実測 3 欠陥の再現 fixture を `U-RTENV-*` Red として全件検出する。
- [ ] doctor 既定 full 実行時間への影響が計測され、長時間化しない (PLAN-L7-442 整合)。
- [ ] 廃止キー/誤配置の台帳形式と追補手順が定義される。
- [ ] cross-runtime blind review PASS、L7 実装 PLAN (add-impl + Reverse pairing) を経て
      confirmed 化する。

## 6. 降下先

L7 実装 (add-impl、Reverse back-fill 対で起票): `src/doctor/runtime-env.ts` 検出器、
scope 配線 (`--scope runtime-env`)、台帳 loader、`U-RTENV-*` テスト。既存
`src/doctor/toolchain.ts` (PLAN-L7-358) と検査基盤を共有し二重実装しない。
