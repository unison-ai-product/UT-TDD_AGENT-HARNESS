---
plan_id: PLAN-L5-05-internal-asset
title: "PLAN-L5-05 (design/internal-asset): L5 詳細設計 — 内部資産 (roster/skill/command/asset-drift) の module 結合粒度 back-fill"
kind: design
layer: L5
sub_doc: module-decomposition
drive: fullstack
status: draft
created: 2026-06-01
updated: 2026-06-01
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — roster/skills module 内部分割 / asset-drift rule の module 結合境界レビュー (別 runtime)"
generates:
  - artifact_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/internal-processing.md
    artifact_type: markdown_doc
skip_sub_doc: []
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L8
dependencies:
  parent: docs/plans/PLAN-L5-00-master.md
  requires:
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/design/harness/L4-basic-design/function.md
    - docs/adr/ADR-004-internal-asset-ts-control-boundary.md
    - docs/design/harness/L5-detailed-design/module-decomposition.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
  references:
    - docs/migration/internal-asset-inventory.md
    - docs/governance/gate-design.md
    - docs/plans/PLAN-L4-11-roster.md
    - docs/plans/PLAN-L4-12-skill-pack.md
    - docs/plans/PLAN-L4-13-drift-lint.md
related_adr: docs/adr/ADR-004-internal-asset-ts-control-boundary.md
related_l0_extra: docs/design/harness/L1-requirements/functional-requirements.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L5-05 (design/internal-asset): L5 内部資産 module 結合粒度 back-fill

## §0 PLAN

Recovery PLAN-REC-001 close 後の Forward 継続 (PO 指示「L5/L6 内部資産 back-fill 継続」、A-88)。L4 で増分した内部資産次元 (architecture §3.1 roster/skills + §4.1 asset-drift / function §1.1 roster + §2 CLI) を **L5 詳細設計 = module 結合粒度** へ back-fill する。**L4→L5→L6 の中間段 (A-81「L5 を挟む」)**: L4 = system 粒度 (束ね、⇔L9) → **本 PLAN L5 = module 結合粒度 (中間分解、⇔L8 結合テスト設計)** → L6 = 関数仕様=単体粒度 (最終分解、⇔L7)。**成果物 = module-decomposition.md + internal-processing.md 増分 ⇔ L8 結合テスト設計ペア** (PLAN-L4-10 §0.1)。

> **back-fill 位置づけ (A-83/A-84)**: 本 PLAN は L4/L9 の `placeholder_deps` のうち **waiting_layer:L6 (関数 signature) は解消しない** (それは L6 PLAN の役割)。L5 は roster/skill/command/asset-drift を **module 内部分割 + module 間結合 IF** まで詳細化し、L8 結合テスト設計ペアを書ける状態にする。関数 signature は §carry で L6 へ依存明示。

## §1 目的

L4 内部資産設計を **実装単位の module 分割 + 結合 IF** へ詳細化する: ① `roster` module 新設 (内部関数群・責務・公開 IF・依存方向)、② `skill` module (既存 §1/§5 stub) の内部分割具体化、③ 内部資産 command (`ut-tdd roster`/`ut-tdd asset`) の操作を internal-processing D-API 棚卸しへ追加、④ `asset-drift` rule を §4 `dependency-drift` と並置 (別 rule、IMP-033)、⑤ roster↔guard 結合 IF (移行段階含む)。L6 機能設計 (関数仕様 pseudocode) の入力粒度に整える。

## §2 背景

- 上流: architecture.md §3.1 (roster/skills building block、依存先=schema/fs 一方向) / §4.1 (asset-drift = IMP-033 rule) / function.md §1.1 (roster building block、roster→guard 一方向) / §2 (内部資産 CLI)
- 境界正本: ADR-004 (層1 markdown 正本 / 層2 TS 検証注入統制)
- 既存 L5 状態 (調査 A-88): module-decomposition §1/§5 に **skill stub 既出・roster 未記載**。§4 に `dependency-drift` (ADR-002/IMP-032、import グラフ) 既出 = **asset-drift とは別物**。agent-guard は §2.3 で実装済完備。
- 棚卸し evidence: internal-asset-inventory.md (subagent 19 / skill 107 / command 0)
- L4 child: PLAN-L4-11 (roster) / L4-12 (skill) / L4-13 (drift-lint)

## §3 設計計画 (Step)

### Step 1: roster module 新設 (module-decomposition §1/§2/§5)
§1 インベントリ表 + §5 未実装責務境界表に `roster` 行追加 (path = `src/roster/`、責務 = `.claude/agents/*.md` frontmatter → capability class/model family 構築、依存 = schema/fs、carry = L6/L7)。§2.N 新節 = 責務境界 (関数 export は L6 確定と注記)。

### Step 2: skill module の内部分割具体化 (module-decomposition §2/§5)
既存 skill stub (§1/§5) を internal 分割へ: catalog 構築 / recommender / injector の 3 内部責務。`docs/skills/**/*.md` (層1) → 注入セット (層2)。依存 = schema/fs 一方向。

### Step 3: 内部資産 command の D-API 追加 (internal-processing §1/§2/§3/§4)
§1 D-API 棚卸し表に `roster list`/`roster check`/`ut-tdd asset` 操作行追加。§2 処理フロー (markdown scan → 検証/整合 → 出力)。§3/§4 DbC pre/post (例: `roster check` post = .md↔guard allowlist 乖離 0 or fail-close)。全て「未実装 carry L6 pseudocode」マーク。

### Step 4: asset-drift rule の module 結合 (module-decomposition §4 / §6 lint 様式)
§4 に `asset-drift` を `dependency-drift` と**並置** (別 rule、IMP-033 rule engine インスタンス)。doc registry が `.claude/agents/*.md`/`docs/skills/` を scan → auto-enroll。§6 lint 共通様式 (`loadX→analyzeX`) との整合。

### Step 5: roster↔guard 結合 IF + 移行段階 (module-decomposition §2/§4)
roster (SSoT 受動提供) ↔ agent-guard (enforcement 能動参照) の **`runtime → roster` 一方向結合** (Critical-1 是正準拠、循環なし)。roster 未実装期間の guard ハードコード allowlist 維持 = 移行段階 (`placeholder_deps:{waiting_layer:L7}`、実装状態解消型) を §carry/該当節に記述。

### Step 6: L8 結合テスト設計ペア (IT-ASSET)
L8 §1.5 IT-ASSET 新節 (書ける範囲): roster module 結合 / skill catalog load 結合 / asset-drift rule 実行 / roster↔guard allowlist 整合 (module 間 IF 単位)。未確定は placeholder_deps + 依存明示。§2 量閉じ一覧へ trace。

### Step 7: 依存方向の物理保証 (module-decomposition §4)
roster/skill が schema へ一方向依存のみ・循環禁止 (architecture §3 原則踏襲) を import グラフレベルで保証。fs は loadX 端点隔離。

### Step 8: carry → L6/L7
各 module 内部関数の signature/pseudocode = L6 機能設計 (関数仕様、`waiting_layer:L6` placeholder 解消先)。実装 = L7。移行段階解消 = L7 (実装状態解消型)。

### Step 9: self-review (code-reviewer / pmo-sonnet)

## §4 受入条件 / DoD

- [ ] module-decomposition に `roster` module 新設 (§1/§2/§5、責務・公開 IF・依存方向 schema/fs 一方向)
- [ ] `skill` module 内部分割具体化 (catalog/recommender/injector)
- [ ] internal-processing に内部資産 command の D-API 操作 + DbC pre/post 追加
- [ ] `asset-drift` rule を §4 `dependency-drift` と並置 (別 rule、IMP-033、二重定義なし)
- [ ] roster↔guard `runtime → roster` 一方向結合 + 移行段階 placeholder_deps 記述 (循環なし)
- [ ] L8 IT-ASSET ペア追加 (書ける範囲) + 未確定 placeholder_deps + 依存明示
- [ ] 関数 signature を L6 carry に明示 (waiting_layer:L6、back-fill 対象を残す)
- [ ] architecture §3.1/§4.1 / function §1.1 との 1:1 整合 (二重定義なし)
- [ ] §6 用語更新 / §7 機能要求更新 が存在
- [ ] self-review 通過

## §5 関連 PLAN / ADR / docs

- 関連 PLAN: 親 = PLAN-L5-00-master / L4 = PLAN-L4-11/12/13 / 後続 = **PLAN-L6-03-internal-asset (L6 関数仕様、waiting_layer:L6 placeholder 解消)**
- 関連 ADR: ADR-004 (層1/層2 境界) / ADR-002 (dependency-drift 並置) / ADR-001 (TS 再実装)
- 参照 docs: architecture §3.1/§4.1 / function §1.1/§2 / internal-asset-inventory / gate-design §5

## §6 用語更新 (living glossary delta)

| 用語 | 種別 | 定義 / 変更点 | L0 §10 back-merge |
|---|---|---|---|
| roster / capability class | 参照 | 内部資産 subagent の registry (層2 TS) と分類。ADR-004 由来、独自ドメイン語でなく実装用語 | back-merge 不要 |
| asset-drift | 参照 | IMP-033 rule 型 (内部資産 .md の HELIX 前提・roster↔guard 乖離検出)。dependency-drift と並置 | back-merge 不要 |

> 内部資産分割は architecture の内部詳細化。新規ドメイン用語は導入しない (実装用語は src/roster·src/skills 確定時に追従)。

## §7 機能要求更新 (FR registry delta)

> 現時点: **機能要求更新なし**。本 PLAN は FR-L1-46〜49 (L1 で起票済、A-77/A-79) の **実現方式の module 結合詳細化**。新規 FR-L1 は生まない。FR-L1-46〜49 → L5 設計要素 → L8 IT-ASSET の trace を本 PLAN で接続。
