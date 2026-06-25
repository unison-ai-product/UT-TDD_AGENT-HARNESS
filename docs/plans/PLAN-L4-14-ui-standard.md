---
plan_id: PLAN-L4-14-ui-standard
title: "PLAN-L4-14 (design): 各 L (L0-L14) の FE/UI 設計ドキュメントを定義 (document-system-map §1c フロント設計 doc coverage) + その L4 cell = FE 設計標準 (ui-standard: UI設計標準/UI部品カタログ/design tokens) を実体化。L10 を impl 後 UX 磨きへ是正し L7-141/L7-146 の descent 前提を正す"
kind: design
layer: L4
sub_doc: ui-standard
drive: fe
status: confirmed
created: 2026-06-24
updated: 2026-06-24
status_note: "PLAN status=confirmed は『定義作業 + L4 cell 実体化 + descent 是正が完了し intra_runtime review 済』を示す。各 design doc (ui-standard.md / §1c) の confirmed 昇格は別途 G4 PO サインオフ。"
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — V-model 層配置 (部品/色=L4 方式設計 vs L10 impl後磨き) の設計レビュー (別 runtime / Codex)"
generates:
  - artifact_path: docs/design/harness/L4-basic-design/ui-standard.md
    artifact_type: design_doc
  - artifact_path: src/schema/index.ts
    artifact_type: source_module
  - artifact_path: docs/governance/document-system-map.md
    artifact_type: doc_update
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: doc_update
skip_sub_doc: []
pair_artifact: docs/test-design/harness/L9-system-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L9
dependencies:
  parent: docs/plans/PLAN-L4-00-master.md
  requires:
    - docs/design/harness/L2-screen/ui-element.md
    - docs/design/harness/L4-basic-design/data.md
  references:
    - docs/governance/document-system-map.md
    - docs/test-design/harness/proposal-document-coverage-routing.md
    - docs/plans/PLAN-L7-141-web-dashboard-component-derived.md
    - docs/plans/PLAN-L7-146-serverless-readonly-share.md
    - src/schema/index.ts
related_adr: docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-24T22:55:00+09:00"
    tests_green_at: "2026-06-24T22:53:00+09:00"
    verdict: approve
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
    scope: "§1c per-layer FE/UI 設計 doc 定義 + 層配置の核 (部品/色=L4 vs L10=impl後) を V_MODEL_PAIRS (L2↔L10) + 業界標準 (Nablarch 方式設計/IPA 外部設計) + doc 整合で検証 = APPROVE (Critical 0)。3 点同期 (schema↔要件§G.1↔§1b) + 回帰 U-SDCD-009 健全。Important 2 (本 review_evidence 記録 I-2 / L10 pair 注記 I-1) は本 land で反映。code-reviewer=sonnet が PM=opus 成果を別 model family で cross-review (claude-only intra_runtime fallback、.claude/CLAUDE.md)。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/sub-doc-catalog-drift.test.ts tests/schema.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-24T22:52:59+09:00"
        evidence_path: tests/sub-doc-catalog-drift.test.ts
        output_digest: "sha256:35df696d3b87117bd588a2a2378ee1667c3d0241391f3b5b3a1ff3401edde01e"
      - kind: typecheck
        command: "bun run typecheck (VALID_SUB_DOCS[L4] += ui-standard、3 点同期)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-24T22:52:59+09:00"
        evidence_path: src/schema/index.ts
        output_digest: "sha256:f1e8da4b64c1ab75b87ddd29fbf110d4014acc03cf8607632b7f170488e21f1e"
---

# PLAN-L4-14 (design/ui-standard): L4 FE 設計標準 (部品/色の降下先確定)

## §0 PLAN

L4 Master (`PLAN-L4-00-master`) の外部設計カタログ (`document-system-map` §1b) に **欠けている FE
設計標準** を追加する design PLAN。出力 = 新 L4 sub_doc `docs/design/harness/L4-basic-design/ui-standard.md`
(UI設計標準 + UI部品カタログ + design tokens) と、その正本 3 点同期 (schema `VALID_SUB_DOCS[L4]` /
`document-system-map` §1b / 要件 §1.10.G.1)。あわせて誤配置されていた L10 と、それに依存する L7-141 /
L7-146 の descent 前提を是正する。

## §1 確定した穴 (PO 指摘「フロント設計 doc のカバレッジが定義できてない」を診断確定)

V-model 設計層 (L0-L14) は層を定義するが、**FE 設計の降下先が L3-L6 で未定義**だった。具体的には:

- L2 = 画面設計 (画面一覧 / 遷移 / UI 要素 / wireframe) = **画面の棚卸し**。confirmed への昇格は G2。
- L3-L6 の設計 sub_doc は実質 BE 中心 (`data` / `architecture` / `function` / `external-if` /
  `module-decomposition` / `function-spec` 等)。
- → **「UI 部品 (component) と色 (design tokens / visual standard) がどの層に降りるか」が未定義 = 穴**。
- 直近 (`d8a5d2c`) はその穴を **L10 (`docs/design/harness/L10-ux/visual-design.md` + `tokens.yaml`)** に
  埋めたが、これは **層配置の誤り**だった (§3 で是正)。

> 正本での裏付け: `document-system-map` §1b (L4 外部設計 標準成果物カタログ) に `data` (= DB 設計標準) は
> あるが、その **FE 対応物 (UI 設計標準) が無い**。一方 §1 表 L10 行は「FE デザイン確定 / UX 検証 (WCAG)」=
> L2 の右腕ペア (impl 後の磨き、`V_MODEL_PAIRS` L2↔L10、`src/schema/index.ts:107`)。つまり L10 は
> impl **後**の検証ペアであり、impl **前**に必要な再利用 FE 設計標準の降下先ではない。

## §2 背景 — 業界標準 grounding (downloads/ research corpus)

PO 収集の design-template corpus (`downloads/design-template-hunt/`、reference 材料、coverage routing §3
「external templates は reference / 変換時のみ UT-TDD evidence 化」に従う) が層配置を裏付ける。

- **Nablarch 開発標準 (Fintan)**: FE 設計は 3 段に降りる。
  - 要件定義 / 画面設計: `画面一覧` + `画面遷移図` → 当方 **L2**。
  - **方式設計 / 開発標準 / 設計標準**: `UI標準(画面)` + `UI部品カタログ` + `共通コンポーネント設計標準`
    → 当方 **L4 基本設計 (方式設計)**。これは同フォルダの `DB設計標準` (= 当方 `data`) と同じ階層 =
    **「部品/色」は方式設計の開発標準に降りる**。
  - アプリ設計 / `システム機能設計書(画面)` per-screen → 当方 **L6 機能設計**。
  - `画面モックアップ` = HTML mock (grid / CSS framework) = システム機能設計書(画面) の input → L2 wireframe / L10 mock。
- **IPA 共通フレーム 2013 外部設計成果物** = 画面 / 帳票 / IF / データ / 業務処理。`document-system-map` §0/§1b の
  grounding と同一。UI 設計標準は方式設計 (開発標準) として外部設計に属す。
- **同型 precedent (2026-06-22)**: L4 カタログへ `report`/`batch`/`notification`/`code-value` を「②
  プロダクト選択」で追加した拡張 (要件 §G.1)。理由は「標準成果物は業界標準で確定済 = 自己スコープ
  (harness 自身が帳票を持たない) を理由にした先送りは [[judge-tooling-by-mission-not-self-scope]] に
  反する」。**FE 設計標準も同じ標準成果物で、同じ理由でカタログに入るべきだった (本 PLAN で解消)**。

## §3 設計 (resolution)

### §3.1 部品/色の降下先 = L4 新 sub_doc `ui-standard`

`data` (DB/ドメイン設計標準) の **FE 対応物**として L4 に `ui-standard` sub_doc を新設する。内容:

1. **UI 設計標準**: レイアウト方針 / グリッド / 状態種別の標準 5 値 (ok/warn/error/empty/loading) /
   a11y 標準 (WCAG 2.2 AA、色のみ非依存) / read-only + CLI コピー (S5=b) の表現規約。
2. **UI 部品カタログ**: L2 `ui-element` §2 の設計部品 (`HierarchyPulldown` / `HeatmapGrid` /
   `DataTable` / `StatusBadge` / `CopyButton` 等) の再利用契約 (props / state / event / 状態網羅)。
3. **design tokens (色/寸法/タイポ)**: `tokens.yaml` を L4 へ re-home し token SSoT とする。

区分 = **② プロダクト選択 (UI 有時)** (report/batch 等と同じ。BE-only / no-UI / 自明 UI は
`skip_sub_doc[].reason` で省略可)。harness 中央 UI 製品は本 sub_doc を起票する (re-home 先)。

### §3.2 L10 の役割を是正 (impl 後の UX 磨き / WCAG 検証へ戻す)

`document-system-map` §1 L10 行 (「FE デザイン確定 / UX 検証」) と `V_MODEL_PAIRS` L2↔L10 のとおり、L10 =
**impl 後**に実装済 UI を磨き WCAG で検証する L2 の右腕ペア。再利用 FE 設計標準 (部品/色) は L10 ではなく
§3.1 の L4 に置く。`d8a5d2c` は #1 (impl 前に要る設計標準) を #2 (impl 後の磨き) に混入させていた。

### §3.3 是正後の FE descent 鎖 (canonical)

```
L2 画面設計 (画面一覧/遷移/UI要素/wireframe, G2)
  → L4 ui-standard (UI設計標準 + 部品カタログ + tokens, 本 PLAN, impl 前)
  → L6 機能設計 (per-screen function-spec)
  → L7 src/web 実装 (component-derived, L2 部品 × L4 標準)
  → L10 UX 磨き / WCAG 検証 (impl 後, L2 の右腕ペア)
```

test-design coverage (proposal-document-coverage-routing §2 `frontend-design` 行 → L7/L8/L9/L12/L14) は
検証層マップであり本 descent (設計左腕) と別物。frontend-design 行の Notes に本 descent への参照を追記する。

## §4 deliverables (SSoT 3 点同期 = 機械強制、coverage ≠ substance)

| # | 成果物 | 種別 |
|---|---|---|
| **D0 (主)** | `document-system-map` **§1c 各 L (L0-L14) の FE/UI 設計ドキュメント定義** (フロント設計 doc coverage、PO 指示「各 L のフロント/UI 設計 doc を先に定義」) | governance 定義 |
| D1 | `src/schema/index.ts` `VALID_SUB_DOCS[L4]` に `ui-standard` 追加 (+ `VALID_SUB_DOC_VALUES`) = §1c の L4 cell を slot 化 | schema 正本 |
| D2 | `document-system-map` §1b カタログ表に UI 設計標準行を追加 / §1 L10 行を「impl 後 UX 磨き」へ明確化 | governance |
| D3 | 要件 §1.10.G.1 `VALID_SUB_DOCS` mirror 表に `ui-standard` 追加 (drift gate 整合) | governance |
| D4 | `docs/design/harness/L4-basic-design/ui-standard.md` 作成 (d8a5d2c substance を re-home) | design doc |
| D5 | `tokens.yaml` を L4 へ re-home (token SSoT) | design asset |
| D6 | L10 `visual-design.md` を impl 後 UX 磨き placeholder へ reframe (or 撤回) | design doc |
| D7 | L7-141 §1 / L7-146 §1 の descent 鎖を §3.3 へ是正 (誤「L10 ✓」を除去) | plan |

## §5 受入基準 (AC、機械検証 = 主張の substance)

- [ ] **AC-1**: `ut-tdd doctor` の `sub-doc-catalog-drift` gate が green (schema `VALID_SUB_DOCS[L4]` ↔
  要件 §G.1 表 ↔ document-system-map §1b の 3 点で `ui-standard` が drift 0)。
- [ ] **AC-2**: `ut-tdd plan lint` が本 PLAN green (`sub_doc=ui-standard ∈ VALID_SUB_DOCS[L4]`)。
- [ ] **AC-3**: `ui-standard.md` が L2 `ui-element` §2 部品から降ろした再利用契約 + tokens SSoT を持ち、
  汎用 table-dumper を禁ずる ([[feedback_central_ui_kouteihyou_mission_not_coverage]])。
- [ ] **AC-4**: L7-141 / L7-146 から誤「L10 ✓ (impl 前)」descent 主張が除去され §3.3 鎖を引用する。
- [ ] **AC-5**: `bun run test` + `bun run lint` + typecheck が green (schema 変更の regression 0)。
- [x] **AC-6**: review が §3 の層配置 (部品/色=L4 vs L10) を approve。本セッションは claude-only intra_runtime fallback (code-reviewer=sonnet が PM=opus を別 model family で cross-review) で APPROVE (Critical 0) を取得 (`review_evidence`)。Codex live dispatch は任意の追加検証 (残差なし、PO へ escalation 不要)。

## §6 schedule

| Step | 内容 | mode |
|---|---|---|
| 1 | SSoT 3 点同期 (D1-D3) | serial (drift gate 整合のため) |
| 2 | L4 `ui-standard.md` + tokens re-home (D4-D5) | serial (Step 1 後) |
| 3 | L10 reframe + L7-141/146 是正 (D6-D7) | parallel (Step 2 と独立) |
| 4 | 機械検証 (AC-1〜5) + Codex cross-review (AC-6) | serial (最後) |

## §7 errata / 是正記録

`d8a5d2c` (feat(design): author L10 UX-refinement design, PLAN-L7-141 Step 1) は FE 設計標準を L10 へ
誤配置した。L7-141 は draft のため formal supersession は不要だが、本 PLAN がその層配置を是正する
(visual-design / tokens を L4 へ re-home)。L7-141 / L7-146 の §1 descent 前提を §3.3 へ更新する。
