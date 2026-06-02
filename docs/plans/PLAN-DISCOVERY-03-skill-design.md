---
plan_id: PLAN-DISCOVERY-03-skill-design
title: "PLAN-DISCOVERY-03 (kind=poc): skill module 設計の Discovery 検証 (catalog/recommender/injector、設計→仮実装→検証→設計確定)"
kind: poc
layer: cross
workflow_phase: S1
drive: fullstack
status: draft
decision_outcome: null
created: 2026-06-01
updated: 2026-06-01
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: po
    slot_label: "PO — 工程タグ駆動 recommender の方向確定済 (2026-06-01) + S4 成否最終判断"
  - role: tl
    slot_label: "TL — skills module (catalog/recommender/injector) 設計の検証レビュー (別 runtime)"
generates:
  - artifact_path: docs/plans/PLAN-DISCOVERY-03-skill-design.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-DISCOVERY-01-workflow-metamodel.md
    - docs/plans/PLAN-DISCOVERY-02-roster-design.md
    - docs/plans/PLAN-L5-06-skill.md
    - docs/plans/PLAN-L4-12-skill-pack.md
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/adr/ADR-004-internal-asset-ts-control-boundary.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-DISCOVERY-03 (kind=poc): skill module 設計の Discovery 検証

## §0 位置づけ

roster (PLAN-DISCOVERY-02) に続く 2 件目の Discovery-for-design ([[PLAN-DISCOVERY-01]] §1.1)。skill module (FR-L1-47: catalog / recommender / injector) の L5 設計を**紙上で確定する前に仮実装で実証して確定**する。skill は **recommender (工程→skill 推挙/発火) の方式が最も不確実**で、roster より Discovery 適性が高い (PO 確定「skill Discovery を回す」)。

> **recommender 基盤の方向 (PO 確定 2026-06-01)**: 「ワークフロー上にスキル発火を設け、スキルを **category タグ + 工程タグ**で分けて **工程単位で推挙**させる仕組み」。当初 PM が枠組んだ「PLAN/keyword → search」型 (HELIX gpt-5.4-mini freeform) は誤り → **工程タグ駆動の決定論推挙/発火**に訂正 (§1.1 詰まり②)。

> **roster との違い (なぜ skill も Discovery)**: roster は scan 対象 (`.claude/agents/`) が実在し agent-guard で scan 実証済だった。skill は **catalog source (`docs/skills/`) が空** (curate 未実施) + **recommender が本質的にヒューリスティック** = roster 以上に紙上で確証が持てない。

## §1 設計 (S1、provisional) — skill module 設計仮説 + 核心的不確実性

architecture §3.1 skills building block = `loadCatalog()` / `recommendSkill()` / `injectByLayer()`。検証対象 (仮説、紙上で無理に確定しない):

| 設計要素 | 仮説 | 確証度 |
|---|---|---|
| **catalog (loadCatalog)** | skill `SKILL.md` frontmatter (`name/description/層/gate/role/tier`) を scan → in-memory catalog (永続なし、fs 正本、ADR-004) | 中 — scan 自体は roster 同型だが **source 不在** (下記 詰まり①) |
| **recommender (recommendByPhase)** | skill を **category タグ + 工程(layer/gate) タグ**で分類 → ワークフローの各工程で当該タグ skill を**決定論で推挙/発火** (PO 確定方向、freeform/LLM search 不採用) | 中 — タグ設計 + phase lookup が per-phase で sensible な skill set を出すか未実証 |
| **injector (injectByLayer)** | recommendByPhase が選んだ工程別 skill 本文を context へ注入 (FR-12) | 中 — 注入セット定義は L6 carry |

### §1.1 S1 で surface した設計の詰まり (Discovery で解くべき核心)

- **詰まり① catalog source 空 (curate 依存)**: UT-TDD の catalog source `docs/skills/**/*.md` は **空 (`.gitkeep` のみ)**。curate (FR-L1-47: vendor/helix-source/skills の ~100 skill を UT-TDD 用に選別・`helix_*` ラベル除去/relabel) が**前提依存** (porting-map W10、L7 = 実装状態解消型 `placeholder_deps:{waiting_layer:L7}`)。**spike は vendor skills を sample catalog として使い、catalog/recommender 機構を実証**する (curate そのものは検証対象外)。
- **詰まり② recommender 基盤 = 工程タグ駆動 (PO 確定方向 2026-06-01)**: PO 指摘「スキルをカテゴリタグで分けて**工程単位で推挙させる仕組み**にすべき」。**HELIX の task-description → gpt-5.4-mini freeform search は不採用** (LLM 依存 + 「TS にそろえる」非整合、[[feedback-ts-native-over-helix-cli]])。代わりに **skill を category タグ + 工程(layer/gate) タグで分類し、ワークフローの各工程で当該タグを持つ skill を決定論で推挙/発火する** (= FR-12 `injectByLayer` + 既存「工程別 subagent 起動マップ mandatory-by-phase」と同型、TS-native、LLM 不要)。HELIX skill は既に `helix_layer`/`helix_gate` タグを持つので、curate で ut-tdd 工程へ relabel + category 付与すれば成立する見込み。**spike は「工程 → タグ lookup が per-phase で sensible な skill set を出すか」を検証**。出なければ pivot (タグ設計の見直し)。

## §2 仮実装計画 (S2、PoC spike)

- **ブランチ**: `poc/skill-spike` (使い捨て、`poc/*` → main 直 PR 物理ブロック)
- **実装**: PM-authored TS (Codex は 8009001d で broken、env-forced fallback = roster PLAN-DISCOVERY-02 A-96 で確立済の path)
- **spike 範囲** (`src/skill/` に最小):
  1. `scanSkills()`: `vendor/helix-source/skills/**/SKILL.md` を scan → catalog (`{id, description, layers, gate, role, tier}`)。frontmatter parse は roster spike 流用
  2. `recommendByPhase(layer, opts?)`: skill の 工程(layer/gate) タグ + category で、指定**工程**に該当する skill を**決定論で抽出** → per-phase skill set。LLM 不使用。HELIX `helix_layer` を ut-tdd 工程へ map する relabel も spike 内で簡易実装
  3. (injector は stub、recommendByPhase の出力を注入する骨子のみ。本筋は工程→タグ lookup)
- **検証用**: 各**工程** (例 L1 要求 / L4 基本設計 / L5 詳細設計 / G2 / G4) に対し、推挙される per-phase skill set が直感に合うか観察 (PLAN keyword 入力でなく**工程**入力)

## §3 検証計画 (S3)

| 検証点 | 期待 | 設計への含意 |
|---|---|---|
| catalog scan が skill を拾うか | vendor skills 全件 catalog 化 (frontmatter parse 成立) | catalog 設計の成立 |
| **工程タグ駆動 recommender が sensible な per-phase skill set を出すか** | 各**工程**に対し category+工程タグで該当 skill が出る (例: L5 詳細設計 → design/spec-driven/adr 系、G2 → adversarial-review/security 系、L4 → tdd/test 系) | **recommender 基盤の成否** (詰まり②)。出なければタグ設計 pivot |
| 工程タグ relabel が機能するか | HELIX `helix_layer` → ut-tdd 工程 の map + category 付与で per-phase 抽出が成立 | curate のタグ relabel 方針の成立 |

## §4 設計確定 (S4、decision_outcome = PO)

- **confirmed**: 工程タグ駆動 recommender が使える → skill 設計を PLAN-L5-06 へ Forward 確定 (catalog/recommendByPhase/injector の module 結合粒度 + 工程タグスキーマ)。出口 `promotion_strategy` = redesign (spike 破棄、本実装 L7)
- **pivot**: 工程タグ駆動で per-phase 推挙が弱い → タグ設計 (category 粒度 / 工程 map) を見直して再検証 (詰まり② の別案)
- **rejected**: skill module 方式自体が成立しない (考えにくい)

## §5 検証記録 (S2/S3 実施時に追記)

> S2/S3 実施後にここへ記録 (PLAN-DISCOVERY-02 §5 と同形式)。現時点 S1 (未実施)。

## §6 carry / 関係

- **Forward 着地先**: confirmed → PLAN-L5-06-skill (kind=design、L5↔L8 ペア)
- **curate 依存**: catalog source の curate (FR-L1-47) は L7 / porting-map W10 (実装状態解消型)。spike は vendor sample で代替
- **兄弟**: roster (PLAN-DISCOVERY-02、confirmed 済) / drift (FR-L1-49、未判定)
- **メタモデル dogfood**: 所見は [[PLAN-DISCOVERY-01]] §7.1 へ back-merge (Discovery-for-design 2 件目)
- **L6 carry**: recommender スコアリング詳細 / injector の layer 別注入セット定義 (waiting_layer:L6)

## §7 DoD (S1→S4)

- [x] **S1**: skill 設計仮説 + 核心的不確実性 (詰まり①②) を §1 に provisional 記述
- [ ] **S2**: `poc/skill-spike` で `src/skill/` spike (scanSkills / 決定論 recommendSkills) を PM 実装 (env-forced)
- [ ] **S3**: sample PLAN で推挙を観察、§5 に記録 (決定論で使えるか)
- [ ] self-review (code-reviewer / pmo-sonnet) が検証の信頼性を確認 (前置 MUST)
- [ ] **S4**: PO が `decision_outcome` (confirmed=決定論採用 / pivot=LLM hybrid / rejected) + `promotion_strategy`
- [ ] confirmed 時: PLAN-L5-06-skill へ Forward 確定 + PLAN-DISCOVERY-01 §7.1 back-merge + spike 破棄
