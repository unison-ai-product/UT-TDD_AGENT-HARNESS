# A-172 - Pack Comprehensive Review (GitHub fresh clone)

- **date**: 2026-07-02
- **scope**: 公開 Pack repo `unison-ai-product/UT-TDD_AGENT-HARNESS-Pack` の総合レビュー (PO 依頼)。GitHub 上の実体 (fresh clone) を対象に、配布境界 / README 正確性 / docs 品質 / source⇄pack 同期整合 / consumer 実動線 / CI・skills の 6 次元 + 実機 smoke。
- **pack main**: `9ec7d6c refactor: sync setup and doctor module split` (= source `952e839` 同期)
- **release**: `v0.1.3` published (A-169/A-171 の外部 close 境界は本レビュー時点も未変化)
- **method**: fresh `git clone` (scratchpad) に対する実機 smoke (install → typecheck → lint → 規定 test → `setup --solo` → `doctor --setup-smoke` → full `doctor` → full `vitest run`) + 多 agent 並列レビュー (6 次元、所見ごとに反証型 verify)。verify agent の一部が session limit で欠落したため、critical / 主要 important は本 session が実機で再現・実証した。棄却 (refuted) 所見は 0。

## Commands (実行実体)

```sh
gh repo view unison-ai-product/UT-TDD_AGENT-HARNESS-Pack --json visibility,licenseInfo,pushedAt
git clone https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS-Pack.git pack-review
bun install && bun run typecheck && bun run lint && bun run test        # 全緑 (test=60件)
bun src/cli.ts setup --solo                                             # fresh copy (pack-smoke)
bun src/cli.ts doctor --setup-smoke                                     # OK (checked=22, failed=0)
bun .ut-tdd/bin/ut-tdd.mjs status                                       # wrapper 動作 OK
bun src/cli.ts doctor                                                   # exit 1 / violation 123 件
bunx vitest run                                                         # 47/122 file fail (66/1214 test fail)
bun src/cli.ts plan lint                                                # ENOENT 生例外 (docs/plans 不在)
git ls-tree -r HEAD  # source HEAD 952e839 vs pack 9ec7d6c の全 blob hash 照合 (src/tests/skills/docs)
gh run list -R unison-ai-product/UT-TDD_AGENT-HARNESS-Pack --limit 8    # 直近 8 run 全 success
```

## Observed State (健全側)

- 配布導通: fresh clone で install / typecheck / lint (290 files) / 規定 `bun run test` (60 tests) / `setup --solo` / `doctor --setup-smoke` (22 checks) / 生成 wrapper がすべて緑。Pack CI (`harness-check`) も直近 8 run 全緑。
- 同期整合: src (168) / tests (121) / skills (57) / docs (74) の全追跡 434 file が source HEAD `952e839` と blob hash 一致。除外は意図分のみ (`src/web/.gitkeep`、`tests/doctor-runtime-surface.test.ts`、dogfood 監査 doc 5 件、plan/prompt/state テンプレ 4 件)。除外テンプレへの runtime 参照は 0 (setup は builtin fallback、`src/setup/index.ts:410-425`)。
- 漏えい実体: 実クレデンシャル / メールアドレス / session id / hostname / 個人名は 0 件。mojibake 0 件 (U+FFFD・半角カナ全 tree スキャン。唯一のヒットは `tests/readability.test.ts` の検出器 fixture で意図的)。
- README コマンド早見表は 2 箇所の軽微誤りを除き CLI 実装と一致。LICENSE (MIT / UNISON-TECHNOLOGY) と README License 節は整合。

## Findings

### Critical (consumer 実動線の構造欠陥、実機実証済み)

| # | 所在 | 内容 | 実証 |
|---|---|---|---|
| C-1 | `docs/templates/github/common/harness-check.yml` (consumer 向け生成 CI template) + `src/setup/templates.ts:464` (builtin) | 生成 CI の最終 step が full `bun .ut-tdd/bin/ut-tdd.mjs doctor` を実行するが、full doctor は fresh consumer で構造的に緑にならない。README (:264-267) 自身が「full doctor を初期導入判定に使うな」と明記しており自己矛盾 | fresh setup 直後の `doctor` = exit 1 / violation 123 件 (proposal-document-coverage が source 固有 `docs/design/harness/...` 名を要求、`src/lint/proposal-document-coverage-policy.ts:4` 等に self-application パス焼き込み) |
| C-2 | `src/lint/project-hook.ts` / `src/lint/codex-hook-adapter.ts` の gate 要求 vs `src/setup/` 生成物 | doctor の project-hook / codex-hook-adapter gate は source repo 配線 (`.claude/hooks/agent-guard.ts` + `src/cli.ts session start`) を要求する一方、setup が生成する settings.json は wrapper 配線 → setup 出力が自製品の doctor を通らない。生成 CI 第一 step (`github guard`) の wrapper も CI runner 上で 3 段解決すべて不能 (2 段目 = setup 実行機の絶対パス埋め込みを wrapper 実物で確認) | fresh setup 直後の `doctor` に `project-hook - violation 6 (missing_hook)` + `codex-hook-adapter - violation 5 (missing_hook)` |

根本原因は共通で、**doctor のガバナンス gate 群が self-application 前提のまま配布エンジンに焼き付いており consumer profile が未分離**。進行中の setup/doctor リファクタ (`952e839` 系) と同領域。

### Important

- README.md:21 の badge が `status: internal (private)` のまま — public MIT repo と矛盾。
- 個人パス焼き込み: 維持者の Windows ユーザーパス (`C:` 配下ユーザー名 literal) が `src/lint/project-hook.ts:79`・`src/lint/asset-drift.ts:42` (禁止パターン定数、legacy repo 名 `ai-dev-kit-vscode` 含む) と `tests/handover.test.ts:109` ほか fixture 群に残存。guard がこのユーザー名固定のため外部環境で個人パスガードとして機能しない機能欠陥を兼ねる。皮肉にも同 test (:138,175-176) が「no username leak」を仕様として assert しており自己矛盾。
- `sync-pack` (`src/cli.ts` collectDistributionCandidatePaths) が git HEAD でなく **working tree をファイルシステム走査でコピー** (clean-tree 確認なし、manifest は gitHead() を名乗る)。hybrid 運用 (相手 runtime の未コミット編集が常在) では公開 Pack への混入リスクが構造的。今回 sync 分は全 hash 照合で非発現を確認済み。また pack `9ec7d6c` の commit message が `chore: sync clean pack <source-sha>` 規約を外れ source SHA 未記録 (provenance が全 tree 照合でしか復元できない)。
- 公開 governance/process doc に Pack 非同梱物へのデッドリンク: `recovery-workflow.md:73`、`process/modes/recovery.md:130-132`、`document-system-map.md:80`、`concept_v3.1.md:1131` (計 6+)。`docs/governance/README.md:12` の read order が非同梱 `../adr/ADR-001` を指す。`repository-structure.md` は source repo tree を「正本」として記述。
- Pack CI が ubuntu-latest のみ — Windows-first 主張・`.cmd` spawn の既知 CI 盲点 (A-147) と不整合。
- 同梱 tests の 47/122 file が Pack 内で実行不能 (source 専用 docs/plans / docs/design / root CLAUDE.md 等前提)。規定 `bun run test` は緑で README 検証節にも境界明記済みだが、`vitest run` / `test:source` 一発で赤の山。

### Minor

- 私的 memory wikilink `[[feedback_*]]` が docs 4 箇所 (`document-system-map.md:132` 等) + src コメント複数に残存 (Pack 内解決不能)。
- `skills/estimation.md:22` が「`ut-tdd task classify` は存在しない」と虚偽記述 (CLI 実在、README 早見表とも矛盾)。
- `skills/SKILL_MAP.md` の自己記述が `docs/skills/` のまま (Pack では root `skills/`)。
- README: `skill suggest --plan <path>` は実際は PLAN id (`src/cli.ts:1367`)。`codex exec - -m <model>` の引数順が実実装 (`codex exec -m <model> -`) と逆。
- adapter agent テンプレ 19 本に UTF-8 BOM。
- `package.json` version `0.1.0` vs 最新 release `v0.1.3` の乖離。
- `plan lint` が docs/plans 不在 repo で violation でなく生 ENOENT 例外。
- `.gitignore` が source 版そのまま (PLAN-L7-144 / legacy runtime 等、Pack に存在しない内部残渣への言及コメント付き。実害なし)。
- `src/lint/cycle-p4-verification.ts:66-72` / `src/lint/l14-close-audit.ts:156-162` / `src/state-db/projection-writer.ts:145-146` に source 専用 PLAN/監査 doc 名の定数焼き込み (C-1 の一部として consumer doctor 赤に寄与)。

## Judgement

- **local L10-L14 close / Pack-ready complete (A-169/A-170/A-171) の判定は本レビューで覆らない**: 配布 artifact 境界 (A-157/A-165/A-166/A-167) と同期整合は健全で、Pack repo 自身の CI green も正当 (setup-smoke 限定は意図的スコープ)。
- ただし **A-171 External Close Checklist の「PO / user UAT」「real consumer tag-pin update」境界は、C-1/C-2 未修正のままだと fail する見込みが高い** (実 consumer が生成 CI を commit した時点で構造的 red、doctor は生成直後から missing_hook)。UAT 実施前に C-1/C-2 の修正 (consumer 向け CI から full doctor を外す or doctor consumer-profile 分離 + project-hook gate と setup 生成配線の整合) を先行させるべき。
- 修正の受け皿: C-1/C-2 は進行中の setup/doctor governance module 分割リファクタと同領域のため、同工程へ合流させるのが自然。sync-pack clean-tree guard / 個人パス一般化 / doc curation / README badge 等は個別 item として PLAN 起票対象。着手順は PO 判断待ち。

## Non-Goals

- 本レビューは所見の記録であり、修正 commit は含まない (PO の対応方針決定後に PLAN 経由で実施)。
- Pack repo の公開履歴・release asset には一切手を入れていない (clone は scratchpad、読み取りのみ)。
