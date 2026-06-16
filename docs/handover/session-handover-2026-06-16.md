# Session Handover - 2026-06-16

> このセッション(Claude Code)の実体で上書き。直前の「Codex Windows runtime-portability 検証依頼」は本セッションで**完了**したため付録に縮約済み(§7)。auto-scaffold の §1-§2 digest は前セッション(PLAN-L7-58)を拾った stale 値だったため破棄。

## §1 このセッションの完了スコープ (Claude Code)

- **Codex の Windows runtime-portability 検証依頼(旧 §6)を完了**: Windows 実機で 9 項目すべて green。typecheck / lint(biome 167 files)/ doctor(全 gate 到達)/ db rebuild(findings `[]`)/ node-fallback / runtime-hook+cli-surface+runtime(17)/ full test **81 files 672 tests** / PowerShell wrapper `status --json`(mode `hybrid`)。working tree clean、origin 同期。
- **クロスレビュー機構を実機検証**: 判定ゲート `evaluateGateReview`(hybrid で cross_agent 必須・same-model 拒否・self-review 拒否・未指定拒否)/ `team run` dry-run の cross-provider 割付 + 同一 provider fail-close / slot・直列依存・失敗伝播。**機構は正しい**。
- **/goal 使えない機能の洗い出しと対策** → 監査 `.ut-tdd/audit/A-137-unusable-provider-dispatch-audit.md` を作成。
  - **usable と判明(ライブ実証)**: `ut-tdd claude --execute` は native `claude.exe`(`%APPDATA%\Claude\claude-code\2.1.138`)解決で動作(`CLAUDE-DISPATCH-OK` 取得)。
  - **unusable**: `ut-tdd codex --execute` / `team run --execute` / hybrid 実クロスレビュー。

## §2 成果物

- `.ut-tdd/audit/A-137-unusable-provider-dispatch-audit.md`(洗い出し+対策+証跡、正本)
- `.ut-tdd/handover/provider/20260616091932-claude-to-codex-plan-l7-68.json`(claude→codex 委譲)
- memory `project_cross_review_live_dispatch_blocked`(訂正済み)
- コード変更なし(検証 + 監査 doc + handover のみ)

## §3 Next Action — Codex が A-137 の対策を実装

provider handover = `.ut-tdd/handover/provider/20260616091932-claude-to-codex-plan-l7-68.json`。

1. `.ut-tdd/audit/A-137-...md` を読み、`PLAN-L7-68`(provider dispatch portability)を起票(PLAN 起票は Codex の仕事)。
2. **#2**: `team run` の runCommand を `adapterCommand(provider, command)` 経由にする(`src/cli.ts:1452`)→ team の claude 側が即復活。
3. **#1**: `resolveCodexNativeCommand`(`AppData\Roaming\npm\codex.cmd`/`.exe` 優先・新規 `UT_TDD_CODEX_BIN` override 尊重・Windows `.cmd` spawn 対応)を追加し `adapterCommand` を codex にも拡張(`src/cli.ts:201/229`)→ codex 単体 + team 復活 → 実クロスレビュー成立。**HELIX_* 名を新設しない**。
4. **#4(本丸)**: `detect` に capability probe(`<resolved-bin> --version` exit0 で初めて available)を追加し false-positive `hybrid` を fail-close 化(`src/runtime/detect.ts:21` の将来課題を着地)。
5. **#6(クリーンアップ)**: HELIX_* runtime env 残債を UT_TDD_* へ。`HELIX_CLAUDE_BIN`→`UT_TDD_CLAUDE_BIN`、`HELIX_ALLOW_RAW_*`/`_REASON`(`src/cli.ts:182-202`)は dev-kit ラッパー専用で native 解決着地後は dead → 除去。HELIX は reference-only。
6. (任意 #5)`newestExisting` を semver ソートへ。
- **DoD**: live `team run --execute` cross-provider が成功し、`status` の availability が実 spawnability を反映する。

## §4 carry (未了・先送り)

- A-137 対策の実装一式(#1/#2/#4 = open、#5 = low)。本 PLAN として Codex が起票・実装。

## §5 未了 PO 判断 (bootstrap)

- 委譲経路 `ut-tdd codex` 自体が #1 で壊れている(鶏卵)。**(A)** 環境修正 = PATH で `AppData\Roaming\npm`(動く `codex.cmd` 0.128.0)を dev-kit `cli\`(壊れ `codex.ps1`)より前に出す。codex には bin-override env が今は無いので PATH 並べ替えが唯一の手(claude は既に native 解決で動く)。PO が (A) を実施 → `ut-tdd codex` 復活 → 委譲、が筋。または Codex が別経路で #1/#2 を先に着地。HELIX 名に依存・新設しない。

## §6 壊さない / 再発させない

- `ut-tdd claude --execute` は既に native 解決で動く。`adapterCommand` refactor 時に**これを退行させない**。
- クロスレビュー方針(worker≠reviewer model、同一 provider fail-close)を保持。
- capability probe は **fail-close**(availability=spawnability)。fail-open にして false-positive を再生産しない=presence≠spawnable。

## §7 付録: Codex Windows runtime-portability 検証 (COMPLETED 2026-06-16)

旧 §6 の検証依頼は本セッションで完了。対象 = untracked 非ignore runtime drift への fail-close(`U-RPORT-005`)、Windows wrapper(PowerShell/`.cmd`/`cmd.exe`)、SQLite fallback(`bun:sqlite`/`node:sqlite`)、`CLAUDE_CODE_EFFORT_LEVEL`・team/provider dry-run の machine-readability。pushed head `574271b`。すべて green を実機確認済み。Residual boundary(全 Windows host の外部 CLI 導入は保証外)は A-137 で provider dispatch 観点として具体化された。
