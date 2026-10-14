---
layer: L6
artifact_type: design_doc
status: draft
sub_doc: function-spec
artifact_role: topic_runtime_env_doctor
pair_artifact: docs/test-design/harness/L7-runtime-env-doctor-test-design.md
---

# runtime-env 検査 (AI CLI / 拡張の設定ドリフト) 契約 (未実装の目標契約)

> **実装状態**: 本書の契約は未実装である。2026-10-14 時点で `src/doctor/` に `runtime-env` scope と検出器は無い。
> 本書は PLAN-L6-95 から還流した目標契約であり、oracle は `CANDIDATE-U-RTENV-*` のまま、実装 PR で Red を置いてから昇格する。

## 1. 目的

UT-TDD は Claude Code / Codex CLI を委譲・hook 面の前提基盤とする。しかしその実行環境 (CLI バージョン、グローバル /
プロジェクト設定、拡張バンドル) のドリフトは、どの gate も検査していない。2026-07-22 の手動多重監査で、次の実欠陥が
同日に検出された。

1. **版ずれ**: npm の codex-cli 0.144.1 に対し、VSCode 拡張内蔵の 0.145.0 が書いた `models_cache.json` をパースできず、
   起動のたびに `failed to load models cache: missing field 'supports_reasoning_summaries'` が出た (advisor 経路で実発生)。
2. **廃止キー**: `~/.codex/config.toml` の `approval_mode = "full-auto"` は、現行スキーマ (`approval_policy`) で廃止済みの
   レガシーキーのまま、黙示の互換パスに乗っていた。
3. **設定誤配置**: `~/.claude/settings.json` 内の `mcpServers` 定義は Claude Code にサイレント無視される既知問題であり
   (正位置はユーザースコープの `~/.claude.json`)、playwright MCP が一度もロードされていなかった。

いずれも「実測値と期待スキーマの照合」で決定論的に検知できるが、人手の監査でしか見つからなかった。本書はこの検査面を
doctor の契約として固定する。

## 2. 検査契約

新設 scope `runtime-env` (`ut-tdd doctor --scope runtime-env`) が次を検査する。全項目 read-only で決定論的、数秒以内とする
(doctor は singleton の長時間検査であるため、本 scope に長時間検査を含めない)。

| 検査 | 照合内容 | 違反時 |
|---|---|---|
| cli-version-coherence | `codex --version` (実行可能なら) と `~/.codex/models_cache.json` の `client_version` の major.minor 整合 | violation + 修復レシピ (npm 更新、または cache 削除) |
| codex-config-schema | `~/.codex/config.toml` に既知の廃止キー (`approval_mode` 等、台帳管理) が残存しないか | violation + rename レシピ |
| claude-mcp-placement | `~/.claude/settings.json` / `.claude/settings.json` に `mcpServers` が定義されていないか (サイレント無視の誤配置検知) | violation + 正位置への移設レシピ |
| hook-adapter-parity | `.claude/settings.json` と `.codex/hooks.json` の hook 対応面が rule-drift の対と整合するか (既存 rule-drift の runtime-env 面への拡張)。加えて Codex 側 matcher の発火実効性を台帳照合する (§3) | violation |
| hook-timeout-sanity | hook `timeout` が正の秒数で、公式仕様の単位 (秒) を前提とした妥当域か | warn |

不変条件:

1. **検知は機械、修復は提案止まり** (fail-close)。doctor は設定ファイルを自動書換しない。修復レシピは
   「バックアップ、実測の裏取り、置換、スモーク」の手順文字列として violation メッセージに含める。
2. 外部スキーマ (公式 CLI 仕様) は変動するため、廃止キーと誤配置パターンは検出器内のハードコードではなく台帳 (data) として持つ。
   追補は doc と fixture の対で行う。
3. 環境ファイル不在 (Codex 未インストール等) は検査 skip として明示 report し、silent pass にしない (absence-blindness 対策)。
4. ユーザーグローバル設定の内容 (秘密情報を含みうる) を violation メッセージや evidence へ原文転記しない。キー名と期待形だけを報告する。

## 3. Codex hook matcher の発火実効性

2026-07-22 の CLI 設定監査で、Codex CLI の PreToolUse hooks が Bash 系ツールにしか発火しない可能性が判明した
(コミュニティ報告ベース、未実証)。事実であれば、`.codex/hooks.json` の `apply_patch|write_file` matcher (work-guard の Codex
ミラー) は形だけ整合し、実際には一度も走らない。hybrid の foreign-edit 防御が Codex 側で片肺になる。

hook-adapter-parity 検査は、設定ファイルの形の一致に加えて次を契約に含める。

1. **発火実効性台帳**: matcher ごとに「当該 Codex CLI 版で発火が実証済みか」を台帳で持つ。実証とは、hook 実行痕跡ログ、
   または upstream 仕様の明記を指す (prose 主張は不可)。
2. 未実証 matcher に guard 責務 (`blockOnFailure=true`) が載っている場合は warn ではなく **violation** とする
   (防御が置物である状態を green にしない)。
3. L7 実装時に `apply_patch` 発火の実機検証 (Codex 実版でのスモーク) を Red oracle `CANDIDATE-U-RTENV-007` として先行実施し、
   結果 (発火する / しない) を台帳の初期値にする。発火しない場合の是正 (upstream issue 起票、代替防御) は別 PLAN で扱う。

## 4. VSCode 拡張レイヤの台帳初期内容 (2026-07-22 の read-only 監査)

拡張固有の設定は薄く、実体は CLI 側の設定ファイルに集約されている。台帳へ次を初期登録する。

1. `extensions.autoUpdate: "off"` は版ずれの再発ベクトルである。拡張内蔵 CLI が固定される一方で npm 側が更新される (逆も) ため、
   cli-version-coherence が検査で補完する前提の運用とする。設定そのものの変更は要求せず、意図的な OFF を尊重する。
2. 拡張経由で CLI を一本化する方法は取らない (禁止レシピ)。`chatgpt.cliExecutable` は「DEVELOPMENT ONLY」と明記された
   開発者向けキーであり、版整合の修復レシピとして設定させない。整合は「npm 側を拡張内蔵版へ追随更新」で取る。
3. 危険側キーの安全既定チェック (warn 級の台帳候補): `claudeCode.allowDangerouslySkipPermissions` /
   `claudeCode.initialPermissionMode` / `security.workspace.trust.untrustedFiles` が安全側の既定から外れていたら warn とする。
   2026-07-22 時点は全て安全側だった (前 2 者は未設定、後者は "open" で情報提供済み)。

## 5. 範囲の境界と依存

- WIP の陳腐判定、PR 帰属のような判断依存の不備は対象外である。2026-07-22 の監査で誤判定と復元が実際に起きた層であり、
  自動修復はもちろん自動判定も fail-close で人間ゲートへ送る。upstream 未修正の問題 (Windows hook ポップアップ等) は
  「既知・対応不能」のラベル付き情報項目として report してよいが、violation にはしない。
- 検査基盤は既存の `src/doctor/toolchain.ts` (doctor toolchain scope、実装済み) と共有し、二重実装しない。これは責務 A
  (runtime-env 検査) が責務 B (toolchain scope の scope 解決・check 登録) の成果を使う実在の依存である。
- doctor の singleton 規律 (二重起動は exit 2) に従い、scope 追加で既定 full 実行の所要時間を増やさない。

## 6. 受け入れ条件

- 上記 5 検査と不変条件 4 件を関数契約として固定する。
- 2026-07-22 の実測 3 欠陥の再現 fixture を、`CANDIDATE-U-RTENV-*` の Red として全件検出する。
- doctor の既定 full 実行時間への影響を計測し、長時間化しないことを示す。
- 廃止キーと誤配置の台帳形式と、追補の手順が定義される。
- 非著者 family の review が PASS し、L7 add-impl (+ Reverse back-fill 対) へ降下する。降下先は `src/doctor/runtime-env.ts`
  検出器、scope 配線 (`--scope runtime-env`)、台帳 loader、テストである。

## 7. 検証の対

`docs/test-design/harness/L7-runtime-env-doctor-test-design.md` (`CANDIDATE-U-RTENV-001..007`)。
