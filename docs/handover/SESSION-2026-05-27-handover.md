> **⚠️ SUPERSEDED by `SESSION-2026-05-27b-handover.md`** (同日 2 回目の session: 企画書整理 + `kind=charter`/G0.5 新設 + L0 骨組み)。本書の §2 Next Action は 27b §2 に更新済み。背景 (TS pivot) は引き続き有効。

# Session Handover — 2026-05-27 (V2 取り込み + TS 全面再設計へ pivot)

> 目的: HELIX V2 の工程・モード・配線をチーム開発向けに governance へ取り込み、実装言語を TypeScript に確定して TS scaffold まで到達した、その引き継ぎ。
> session: 2026-05-27 (V2 import → governance v3.1/v1.2 → ADR-001 TS 採用 → W1-W3a Python 破棄 → TS scaffold → 構成ルール → Biome → main 直反映)
> 担当: PM (Opus) 直接実装。
> **⚠️ 前 handover `SESSION-2026-05-22-handover.md` は本 session で superseded** (下記 §6)。

## §0 最重要: このセッションの方針転換

前 session までは「HELIX vendor の Python を `src/ut_tdd/` へ wave 移植 (W1-W3a 完了)」路線だった。本 session で以下に **転換**した:

1. **HELIX は設計概念のみ取り込み、内部は全面再実装** (コードは port しない)。
2. **実装言語 = TypeScript / Bun に確定** (ADR-001)。← 旧 Python port は破棄。
3. governance 正本を **concept v3.1 / requirements v1.2** に更新 (V2 の L0-L14 + W-model / 9-mode / 配線 / 2マスト原則 / レビューゲート / 専門サブエージェント必須 checklist を反映)。

→ 旧 W1-W3a の `src/ut_tdd/*.py` (23 files) と PLAN-001..004 は **破棄 / archived**。pytest 293 PASS 等の旧実績はもう参照しない。

## §1 現在の状態

### 正本ドキュメント (現行)

| doc | 役割 |
|---|---|
| `docs/governance/ut-tdd-agent-harness-concept_v3.1.md` | 構想 (V2 L0-L14 + W-model / 9-mode / 配線 §2.6 / 2マスト原則 §2.1.0 / レビューゲート §2.1.2.1) |
| `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` | 要件 (L0-L14 enum / W-model freeze / 配線要件 §7.8 / 専門サブエージェント checklist §7.8.7.1) |
| `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md` | 再設計方針 + 実装言語 = TypeScript/Bun |
| `docs/governance/repository-structure.md` | リポジトリ構成ルール (配置 / V-model 4 artifact 配置 / config 最小化方針 §8) |
| 旧 `concept_v3.0` / `requirements_v1.1` | superseded banner 付きで残置 (正本ではない) |

### TS scaffold (現行コード)

- runtime: **Bun 1.3.14** (グローバル導入済)。Node v24.13.0 も在。
- `src/`: `cli.ts` (commander) / `schema/index.ts` (**zod 単一正本**: VALID_KINDS/LAYERS(L0-L14)/DRIVES/STATUSES/ROLES/WORKFLOW_PHASES/ARTIFACT_TYPES/ORCHESTRATION_MODES + RecommendedCommandV1) / `runtime/detect.ts` (mode 検出) / `plan/lint.ts`・`vmodel/lint.ts`・`doctor/index.ts` (stub)。
- `tests/`: vitest、**7 PASS**。
- `scripts/ut-tdd` + `ut-tdd.ps1`: 薄い entrypoint。
- config: `package.json` / `tsconfig.json` (strict) / `biome.json` (lint+format 1枚) / `bun.lock`。
- 検証: `bun run typecheck` (tsc clean) / `bun run test` (7 pass) / `bun run lint` (biome exit 0) / `ut-tdd status --json` 動作 (この環境は `claude-only` 判定)。

### git / branch

- **main に全反映済み・push 済み** (origin/main = 最新)。本 session は org repo `unison-ai-product/UT-TDD_AGENT-HARNESS` の main へ直接運用 (PO が単独 maintainer のため PR ceremony 不要)。
- 本 session の commit 列 (vendor更新 → governance v3.1/v1.2 → TS採用+doc整合 → TS scaffold+Python破棄 → 構成ルール+pyproject削除 → Biome+config方針 → .gitignore補強 → 本 handover)。

## §2 Next Action (次 session 開始時)

TS rebuild の core 実装。優先順:

1. **`src/schema` 完成**: `VALID_ARTIFACT_TYPES` を requirements_v1.2 §1.7 の全 19 種へ補完 (現 scaffold は既知14 + TODO)。frontmatter schema (§1.1: plan_id/kind/layer/drive/status/agent_slots/generates/dependencies/parent_design) を zod 化。
2. **`ut-tdd plan lint` 実装**: §1 enum + §1.10 受入条件を zod で検証 (kind×drive matrix §1.6 / 必須 role §1.8 / parent_design §1.1)。stub を実装に。
3. **`ut-tdd vmodel lint` 実装**: §2.4 必須 8 directed edge + §2.2 W-model freeze (G1/G3/G4/G5/G6 pair → G7 trace) + 逆ピラミッド。
4. **`ut-tdd status` / `doctor` 強化**: detect の **capability probe + Windows wrapper 対応** (現 `where` が拡張子なし codex wrapper を拾わず `claude-only` 誤判定。§6 既知問題)。doctor 横断検出 (relation-graph / drift / regression) は後続。
5. **`ut-tdd gate` / `ut-tdd route`**: §7.8 配線 (signal→mode / RecommendedCommandV1 / orchestration_mode 注入) + §2.1.2.1 レビューゲート切り分け (単一 mode の専門サブエージェント checklist 強制)。
6. PLAN は v1.2 の流儀で起票 (`docs/plans/PLAN-NNN-slug.md`、layer=L7 impl は `parent_design` 必須、impl template = `docs/templates/plan/impl/template.md` 済 TS 化)。

### 着手前に再読

- `docs/adr/ADR-001-...md` (実装シーケンス §実装シーケンス)
- `docs/governance/repository-structure.md` (配置ルール)
- `requirements_v1.2` §1 (enum) / §2 (W-model) / §7.8 (配線)
- `src/schema/index.ts` (現 enum 正本) / `src/runtime/detect.ts`

## §3 carry / TODO

- **schema**: `VALID_ARTIFACT_TYPES` 19 種補完 (TODO コメント在 in `src/schema/index.ts`)。
- **detect**: capability probe (`--version` 実行) + Windows の拡張子なし wrapper 検出 (現 `claude-only` 誤判定)。
- **ADR-001 follow-up**: 着手前に **tl-advisor (Codex、別 runtime) の adversarial cross-check** (本 session は PO 選択で後回し)。
- **gate G8-G14 機械検証**: 現 §2 は G7 まで。G8-G14 は将来 PLAN (requirements §2.7 に明記)。
- **CI**: `.github/workflows/harness-check` 未構築 (要件 §6)。TS なら vitest+tsc+biome+plan/vmodel lint を束ねる。
- **`.claude/hooks/`**: 旧 HELIX hook 群が残存 (settings.json は `hooks:{}` 安全設定)。UT-TDD hook の package-local 化は後続。
- **移植系 doc**: `helix-porting-map.md` / `cutover-strategy.md` の code-port 部は ADR-001 で superseded (能力参照としてのみ)。

## §4 環境

- **Bun 1.3.14** + **Node v24.13.0** + npm 11.6.2。tsc/vitest/biome は devDep。
- **Codex Windows sandbox blocker 継続** (8009001d、memory `project_codex_windows_sandbox`)。委譲時は task 埋め込み。本 session は Opus 直接実装で完遂。
- **main 直運用**: PO が単独 maintainer。feature branch / PR ceremony 不要、main へ直接 commit+push してよい (本 session 末に PO 承認)。
- `git checkout` 時に HELIX 由来 git hook が `.helix/runtime/index.json` を生成 (gitignored、無害)。

## §5 次 session チェックリスト

1. `git log --oneline -8` で最新 (本 handover commit が最新) を確認。
2. `git status` clean を確認。
3. 本 handover + ADR-001 + repository-structure.md + requirements_v1.2 §1/§2/§7.8 を Read。
4. `bun install && bun run typecheck && bun run test && bun run lint` が全 green を再確認 (7 test pass / tsc clean / biome exit 0)。
5. §2 の優先1 (schema 完成) から再開。

## §6 superseded / 既知問題

- **`SESSION-2026-05-22-handover.md` は superseded** (W1-W3a Python port 前提。本 session で破棄)。
- **PLAN-001..004 は `status: archived`** (Python port plan)。
- 旧 `concept_v3.0` / `requirements_v1.1` は superseded banner 付き。
- 既知バグ: `ut-tdd status` が native Windows で codex を検出できず `claude-only` 誤判定 (`where` が拡張子なし wrapper を拾わない、§3 carry)。
