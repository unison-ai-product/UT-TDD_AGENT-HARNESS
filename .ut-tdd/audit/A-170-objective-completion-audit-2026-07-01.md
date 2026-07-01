# A-170 - 目標文 Completion Audit

- **date**: 2026-07-01
- **scope**: PO 目標文の要求を、現 HEAD / Pack / gate / audit 証拠へ対応付ける。
- **status input**: `bun src\cli.ts status --json` は `activeDraftTotal=0`、`openDefers=0`、`nonTerminalPlansTotal=3`、すべて `versionUpParked=3`。
- **source / Pack state**: source `work/l10-l14-local-close` と Pack `main` は clean。

## 判定

local L10-L14 close と配布基盤の成立は証明済み。full public / production release close は未宣言。残る blocker は signed tarball signature、PO / user UAT、post-release telemetry、実 consumer tag-pin / rollback acceptance であり、A-169 の通り外部・人間境界である。

## 要求別 Audit

| 要求 | 現証拠 | 判定 |
|---|---|---|
| L10-L14 workflow close | A-143 matrix、A-132、A-136、`doctor --strict-green-command-digest`、CI `28519402464` | local close 済み。L12/L13/PO signoff は外部境界 |
| ワークフロー / ドキュメント定義が適切 | `docs/process/forward/*`、`docs/process/modes/*`、roadmap / program-coverage / drive-model-passage / pair-freeze gates | 証明済み |
| システム開発の基盤として成立 | `doctor` hard gates、`runtime-portability`、`db rebuild`、full CI、A-143 `system-foundation` | 証明済み |
| Claude Code と Codex 両方で成立 | `AGENTS.md`、`CLAUDE.md`、`.claude/CLAUDE.md`、`.codex/hooks.json`、`codex-hook-adapter`、`codex-wrapper-parity` | direct CLI / IDE surface は証明済み。hosted/API tool interception は明示 caveat |
| 配布パッケージ化 | Pack repo `unison-ai-product/UT-TDD_AGENT-HARNESS-Pack`、Release `v0.1.3`、Pack main `847d3b4`、A-160/A-162/A-165/A-167/A-168 | clean Pack / tarball / checksum / manifest は証明済み。`.sig` は未公開 |
| バージョンアップで既存を破壊しない | A-164 Pack version-up smoke、setup managed-block、tag-pin contract、rollback managed paths | local smoke 済み。実 consumer UAT は人間境界 |
| 実装中 project に自然導入できる | A-163 brownfield setup smoke、`doctor --setup-smoke`、existing `AGENTS.md` / `CLAUDE.md` preservation | local brownfield smoke 済み。実 consumer UAT は人間境界 |
| skill / command / hook / subagent / Codex plugin 周辺設定を配布 | `docs/templates/adapter/.claude/*`、`.codex/*`、root `skills/*`、Pack clone verification | 証明済み |
| 設計系 docs の日本語化と gate | `design-language`、`readability`、`runtime-readability` gates | 証明済み |
| 軽量 task の subagent 並列 / orchestration | agent-slot / team routing / model policy / advisor command、A-143 orchestration evidence | local policy / command surface 済み。実モデル実行 telemetry は運用境界 |
| 1 PC 複数 project setup | project-local `.ut-tdd/bin/ut-tdd.mjs` wrapper、setup smoke、A-163/A-164 | 証明済み |
| 配布物フォルダの理論分離 | root `skills/`、`src/skill-engine/`、`docs/templates/*`、Pack excludes `docs/design` / `docs/test-design` / `docs/plans` / `.ut-tdd` | 証明済み |
| agent が読む workflow / governance / rule docs の分離 | `docs/process`、`docs/governance`、`docs/templates/adapter`、root `skills` | 証明済み |
| Pack 側 tests が HARNESS 自己開発テストに偏らない | Pack-safe `bun run test`、A-165、Pack CI `28518093319` | 証明済み |
| 自己開発 docs / DB / dogfood state を Pack に含めない | U-SETUP-011c2、A-166、A-167、A-168、Pack clone verification | 証明済み |
| cross-review 原則強化 | adapter docs、`review-evidence` / `guardrail-invariants`、`nextAction=cross-review-ready` | 証明済み。単一 runtime 時の substitute は明示 caveat |
| model / effort routing | `team/model-policy`、`advisor` surface、AGENTS/CLAUDE routing rules | 証明済み |

## 残境界

- `v0.1.3.tar.gz.sig` の作成・公開。
- PO / user UAT。
- 実 consumer project での post-release telemetry。
- 実 consumer tag-pin / rollback acceptance。

これらは local repo だけでは生成できないため、goal 全体の full release completion は未達。local close / Pack-ready completion は維持する。
