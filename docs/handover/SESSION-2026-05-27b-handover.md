> **⚠️ SUPERSEDED by `SESSION-2026-05-27c-handover.md`** — §2 Next Action「frontmatter schema zod化(L7)」は同 session 後半で **W-model 順 (次は L1)** に方針転換し held 化。L1 業務要求 確定・企画書/G0.5 軽量化・phase-aware PLAN ID・self-review ルールは 27c を正本とする。本書の cleanup/charter 導入記録は有効。

# Session Handover — 2026-05-27b (企画書整理 + kind=charter / G0.5 新設 + L0 骨組み)

> 目的: 企画書 (governance) のファイル整理 + 中身の不整合修正を行い、`kind=charter` と G0.5 企画突合を新設して **L0 から回せる骨組み**を整えた、その引き継ぎ。
> session: 2026-05-27b (前 `SESSION-2026-05-27-handover.md` の TS pivot を前提に継続。本 session は cleanup + spec 整合)。
> 担当: PM (Opus) 直接実装。governance/schema は policy 系のため PM 直編集、企画書群の構造化レビューは pmo-sonnet へ委譲。
> **前 `SESSION-2026-05-27-handover.md` を §2 Next Action について supersede** (背景の TS pivot は有効)。

## §0 このセッションでやったこと

「企画書を整理して L0 から回せる状態にする」依頼。スコープ確定 = ファイル整理 + 中身見直し / L0 到達点 = ディレクトリ骨組みまで / Phase 5 spec 追加も実施。

1. **ファイル整理**: 旧版 docs と旧 Python-port PLAN を archive へ退避、L0-L14 artifact 置き場の骨組み作成。
2. **中身の不整合修正**: 正本間 (concept_v3.1 ↔ requirements_v1.2) の旧番号残存・branch prefix 食い違い・stale tree を修正。
3. **L0 起動の spec 整備**: `kind=charter` 新設 + G0.5 企画突合 fail-close (§2.1.1) を確定。

## §1 現在の状態

### ファイル配置 (Phase 1)

| 処置 | 対象 |
|---|---|
| `docs/archive/` へ退避 | `concept_v3.0` / `requirements_v1.1` (governance は最新版のみ) |
| `docs/archive/plans/` へ退避 | 旧 Python-port `PLAN-001..004` 全 8 ファイル (docs/plans/ は空) |
| 骨組み作成 (`.gitkeep`) | `docs/design/` (①設計) / `docs/test-design/` (③テスト設計) / `docs/skills/` |
| 対応不要 | `*.md.lock` は元々 untracked (gitignore `docs/plans/*.lock` 済) |

### spec の変更 (Phase 5 + Phase 2)

- **`kind=charter` 新設** (VALID_KINDS 11→**12 種**)。L0 企画書 (背景/目的/スコープ/ROI/KGI・KPI/risk)、layer=L0、`parent_design` 不要 (root)、必須 role=`po`。
- **新 §2.1.1「G0.5 企画突合 fail-close」**: L0 企画書 → L1 業務要求への trace + frontier-reviewer の adversarial review 必須 (単一 AI 時は §7.8.7.1 専門サブエージェント review で代替)。
- requirements 同期: §1.3 (charter 行 + layer 旧番号 remap: impl/add-impl/refactor/retrofit/troubleshoot → **L7**、design → L1-L6、add-design → L3-L6、research → L1-L4) / §1.6 (charter×drive 行 + 列名「L5 Visual Refinement」→「**L10 UX磨き**」) / §1.8 (L0=po 必須行) / §6.1 (charter を design/* branch に相乗り、全 12 kind) / §1.10 B・用語集の "11 種"→"12 種" / §9.1 (stale `*-lint.sh` 4本 + 重複 `scripts/package.json,tsconfig` 除去、§7.1/repository-structure.md 整合)。
- concept_v3.1 同期: §2.3「必須4方向」→「**必須8 directed edge**」/ §3.1.1 に charter 参照 / §4.5 forward_routing に `gap-only` / §7.3 branch prefix を §6.1 (SoT) に同期 (6→10種)。
- ai-dev-team-operations: "対応構想書 v7" → 現行 `ai-dev-team-concept_v1.1.md` へのマッピング明記 (Reference-only)。

### schema / tests (drift 解消)

- `src/schema/index.ts`: VALID_KINDS に `charter` 追加 (12)。**VALID_ARTIFACT_TYPES を 14→19 種に補完** (前 handover §2 の既知 TODO 解消: yaml_config/json_config/workflow_config/github_config/other 追加)。
- `tests/schema.test.ts`: kind 数 12 + charter assertion、artifact_types 19 種の length lock を追加。
- 検証: `bun run typecheck` clean / `bun run test` **8 pass** / `bun run lint` exit 0 / 旧番号残存 grep ゼロ。

### git

- 本 handover commit で main に直接反映 (PO 単独 maintainer、PR ceremony 不要)。

## §2 Next Action (次 session)

前 handover §2 から **schema artifact_types 補完は完了**。残りの優先順:

1. **frontmatter schema を zod 化**: requirements §1.1 (plan_id/kind/layer/drive/status/agent_slots/generates/dependencies/parent_design) を `src/schema` に。`charter` の parent_design 不要・L0 専用条件も含める。
2. **`ut-tdd plan lint` 実装**: §1 enum + §1.10 受入条件 (kind×drive matrix §1.6 / 必須 role §1.8 / parent_design / charter の root 例外)。stub → 実装。
3. **`ut-tdd vmodel lint` 実装**: §2.4 必須 8 directed edge + §2.2 W-model freeze (G1-G6 pair → G7 trace)。
4. **`ut-tdd gate G0.5` 実装**: 新設 §2.1.1 の fail-close (企画書→L1 trace + frontier-reviewer/専門サブエージェント review、mode 参照)。判断ゲート系 (G0.5/G2/G4-G7) の mode 別挙動 §7.8.7。
5. **`status`/`doctor` 強化**: detect の capability probe + Windows wrapper 検出 (現 `where` が拡張子なし codex wrapper を拾わず `claude-only` 誤判定。既知バグ継続)。
6. **`ut-tdd route`**: §7.8 配線 (signal→mode / RecommendedCommandV1 / orchestration_mode 注入)。

### 着手前に再読

- `requirements_v1.2` §1 (enum、特に新 §1.3 charter / §2.1.1 G0.5) / §2 (W-model) / §7.8 (配線)
- `src/schema/index.ts` (現 enum 正本、charter/19 artifact 反映済) / `docs/governance/repository-structure.md`
- ADR-001 (実装シーケンス)

## §3 carry / TODO

- **Phase 3 pointer 化は意図的に見送り**: concept §3.1.4 は既に §7.8.7.1 へのポインタを持ち、§2.1.2.1 は 3ティアレビューの核心概念のため現状維持 (PM 判断、冗長ではなく load-bearing)。
- **migration 系 / templates の旧 PLAN 参照**: `helix-porting-map.md` / `cutover-strategy.md` / `templates/state/vmodel.json` / `templates/prompts/effort-classify.md` に PLAN-001..004 や requirements_v1.1 への**「superseded」明記済みの歴史的言及**が残る。パスリンク切れではないため対象外。気になれば後続で historical 整理。
- **ADR-001 follow-up**: tl-advisor (別 runtime) の adversarial cross-check は依然未実施 (PO 選択で後回し継続)。
- **gate G8-G14 機械検証 / CI (`.github/workflows/harness-check`)**: 未着手 (requirements §6/§2.7)。
- **repository-structure.md §1**: design/test-design/skills が `[予定]` 表記のまま (dir は作成済、content が [予定])。気になれば注記更新。

## §4 環境

- Bun 1.3.14 + Node v24.13.0。tsc/vitest/biome は devDep。
- Codex Windows sandbox blocker 継続 (8009001d)。委譲時は task 埋め込み。本 session は Opus 直接 + pmo-sonnet (read-only レビュー) で完遂。
- main 直運用 (PO 単独 maintainer)。

## §5 次 session チェックリスト

1. `git log --oneline -5` で本 handover commit が最新か確認。
2. `bun install && bun run typecheck && bun run test && bun run lint` 全 green 再確認 (8 test pass)。
3. 本 handover + `requirements_v1.2` §1.3/§2.1.1 (charter/G0.5) + `src/schema/index.ts` を Read。
4. §2 優先1 (frontmatter schema zod 化) から再開。L0 を実際に回す場合は `kind=charter` で PLAN 起票 → G0.5 → L1。
