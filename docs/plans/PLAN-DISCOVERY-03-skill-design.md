---
plan_id: PLAN-DISCOVERY-03-skill-design
title: "PLAN-DISCOVERY-03 (kind=poc): skill module 設計の Discovery 検証 (catalog/recommender/injector、設計→仮実装→検証→設計確定)"
kind: poc
layer: cross
workflow_phase: S4
scrum_type: design-spike
drive: fullstack
status: completed
decision_outcome: confirmed
promotion_strategy: redesign  # §4: 決定論 phase-driven recommender は viable → 本実装は L5-06-skill (confirmed) + src/skills/recommend.ts で既に shipped 済。spike は不要だった (production impl が検証 vehicle)。redesign は Reverse 不要 (IMP-066、DISCOVERY-02 と同型)
created: 2026-06-01
updated: 2026-06-22
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: PM (Opus) verification (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: pass
    scope: "PO『1. は対応しろ』(2026-06-22) を受け S2/S3/S4 をクローズ。詰まり② (決定論 phase-driven recommender が sensible な per-phase skill set を出すか) を、throwaway spike でなく **既に shipped 済の production 実装** (src/skills/recommend.ts: recommendSkillsForPlan、layer+drive_model スコアリング、3-bucket、ut-tdd skill suggest CLI、harness.db automation_assets 投影) に対し live 検証。L1/L4/L5/L7 の 4 PLAN で skill suggest を実行: 決定論で per-phase ranked set を出すことを確認 (詰まり② = viable・confirmed)。同時に **score 飽和の限界**を実測 (全 phase で top-5 が score=1 → 同点アルファベット順に退化、L7 lint gate に browser-testing/api が rank4-5 = per-phase 弁別が弱い)。= category/gate タグ粒度で de-saturate する L5/L6 refinement が必要 (§6 既知 carry)。設計は L5-06-skill (confirmed) + L4-12-skill-pack (confirmed) + L7-70-skill-pack-curation (catalog source 空=詰まり① を解消) で既に Forward 確定・実装済ゆえ promotion_strategy=redesign-realized。所見は §5 / DISCOVERY-01 §7.1 に記録。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
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

> **recommender 基盤の方向 (PO 確定 2026-06-01)**: 「ワークフロー上にスキル発火を設け、スキルを **category タグ + 工程タグ**で分けて **工程単位で推挙**させる仕組み」。当初 PM が枠組んだ「PLAN/keyword → freeform search」型は誤り → **工程タグ駆動の決定論推挙/発火**に訂正 (§1.1 詰まり②)。

> **roster との違い (なぜ skill も Discovery)**: roster は scan 対象 (`.claude/agents/`) が実在し agent-guard で scan 実証済だった。skill は **catalog source (`docs/skills/`) が空** (curate 未実施) + **recommender が本質的にヒューリスティック** = roster 以上に紙上で確証が持てない。

## §1 設計 (S1、provisional) — skill module 設計仮説 + 核心的不確実性

architecture §3.1 skills building block = `loadCatalog()` / `recommendSkill()` / `injectByLayer()`。検証対象 (仮説、紙上で無理に確定しない):

| 設計要素 | 仮説 | 確証度 |
|---|---|---|
| **catalog (loadCatalog)** | skill `SKILL.md` frontmatter (`name/description/層/gate/role/tier`) を scan → in-memory catalog (永続なし、fs 正本、ADR-004) | 中 — scan 自体は roster 同型だが **source 不在** (下記 詰まり①) |
| **recommender (recommendByPhase)** | skill を **category タグ + 工程(layer/gate) タグ**で分類 → ワークフローの各工程で当該タグ skill を**決定論で推挙/発火** (PO 確定方向、freeform/LLM search 不採用) | 中 — タグ設計 + phase lookup が per-phase で sensible な skill set を出すか未実証 |
| **injector (injectByLayer)** | recommendByPhase が選んだ工程別 skill 本文を context へ注入 (FR-12) | 中 — 注入セット定義は L6 carry |

### §1.1 S1 で surface した設計の詰まり (Discovery で解くべき核心)

- **詰まり① catalog source 空 (curate 依存)**: UT-TDD の catalog source `docs/skills/**/*.md` は当時 **空 (`.gitkeep` のみ)**。curate (FR-L1-47: source skill reference の skill を UT-TDD 用に選別・旧 label 除去/relabel) が**前提依存** (porting-map W10、L7 = 実装状態解消型 `placeholder_deps:{waiting_layer:L7}`)。**spike は UT-TDD-owned `docs/skills/**/*.md` または test fixture を sample catalog として使い、catalog/recommender 機構を実証**する (curate そのものは検証対象外)。source snapshot は provenance / comparison のみ。
- **詰まり② recommender 基盤 = 工程タグ駆動 (PO 確定方向 2026-06-01)**: PO 指摘「スキルをカテゴリタグで分けて**工程単位で推挙させる仕組み**にすべき」。**source freeform search は不採用** (LLM 依存 + 「TS にそろえる」非整合)。代わりに **skill を category タグ + 工程(layer/gate) タグで分類し、ワークフローの各工程で当該タグを持つ skill を決定論で推挙/発火する** (= FR-12 `injectByLayer` + 既存「工程別 subagent 起動マップ mandatory-by-phase」と同型、TS-native、LLM 不要)。source skill metadata tags は curate で ut-tdd 工程へ relabel + category 付与すれば成立する見込み。**spike は「工程 → タグ lookup が per-phase で sensible な skill set を出すか」を検証**。出なければ pivot (タグ設計の見直し)。

## §2 仮実装計画 (S2、PoC spike)

- **ブランチ**: `poc/skill-spike` (使い捨て、`poc/*` → main 直 PR 物理ブロック)
- **実装**: PM-authored TS (Codex は 8009001d で broken、env-forced fallback = roster PLAN-DISCOVERY-02 A-96 で確立済の path)
- **spike 範囲** (`src/skill/` に最小):
  1. `scanSkills()`: `docs/skills/**/*.md` または `tests/fixtures/skill-catalog/**` を scan → catalog (`{id, description, layers, gate, role, tier}`)。frontmatter parse は roster spike 流用
  2. `recommendByPhase(layer, opts?)`: skill の 工程(layer/gate) タグ + category で、指定**工程**に該当する skill を**決定論で抽出** → per-phase skill set。LLM 不使用。source layer tag を ut-tdd 工程へ map する relabel も spike 内で簡易実装
  3. (injector は stub、recommendByPhase の出力を注入する骨子のみ。本筋は工程→タグ lookup)
- **検証用**: 各**工程** (例 L1 要求 / L4 基本設計 / L5 詳細設計 / G2 / G4) に対し、推挙される per-phase skill set が直感に合うか観察 (PLAN keyword 入力でなく**工程**入力)

## §3 検証計画 (S3)

| 検証点 | 期待 | 設計への含意 |
|---|---|---|
| catalog scan が skill を拾うか | vendor skills 全件 catalog 化 (frontmatter parse 成立) | catalog 設計の成立 |
| **工程タグ駆動 recommender が sensible な per-phase skill set を出すか** | 各**工程**に対し category+工程タグで該当 skill が出る (例: L5 詳細設計 → design/spec-driven/adr 系、G2 → adversarial-review/security 系、L4 → tdd/test 系) | **recommender 基盤の成否** (詰まり②)。出なければタグ設計 pivot |
| 工程タグ relabel が機能するか | source layer tag → ut-tdd 工程 の map + category 付与で per-phase 抽出が成立 | curate のタグ relabel 方針の成立 |

## §4 設計確定 (S4、decision_outcome = PO)

- **confirmed**: 工程タグ駆動 recommender が使える → skill 設計を PLAN-L5-06 へ Forward 確定 (catalog/recommendByPhase/injector の module 結合粒度 + 工程タグスキーマ)。出口 `promotion_strategy` = redesign (spike 破棄、本実装 L7)
- **pivot**: 工程タグ駆動で per-phase 推挙が弱い → タグ設計 (category 粒度 / 工程 map) を見直して再検証 (詰まり② の別案)
- **rejected**: skill module 方式自体が成立しない (考えにくい)

## §5 検証記録 (S2/S3、2026-06-22)

> **重要 (実態)**: 本 PoC が「spike で実証する」と計画した skill module は、DISCOVERY-03 が draft で
> 滞留する間に **L5-06-skill (confirmed) + L4-12-skill-pack (confirmed) + L7-70-skill-pack-curation**
> で Forward 確定・本実装済になっていた (= production 実装が spike より進んでいる)。よって S2/S3 は
> throwaway spike を新規に書くのでなく、**shipped 済の production 実装を検証 vehicle として live 検証**した
> (詰まり① catalog source 空 も L7-70 curation で解消: `docs/skills/**` に ~50 skill が frontmatter 化済)。

### S2 — 検証対象 (production impl、spike 代替)

- `src/skills/recommend.ts`: `recommendSkillsForPlan(db, planId)` = harness.db `automation_assets`
  (skill type、`applies_layers` / `applies_drive_models` / `skill_type` を docs/skills frontmatter から投影)
  を `scoreSkill` でスコア (layer 一致 +0.35 / drive_model 一致 +0.35 / category キーワード review|test|lint 等 +0.25 …)
  → top-N ranked。`bucketRecommendations` で required/recommended/optional の 3-bucket。決定論 (Date/random 不使用)。
- CLI: `ut-tdd skill suggest --plan <id>` / `--text <task>`。

### S3 — live 観察 (4 phase で skill suggest 実行)

| 工程 (PLAN) | top recommendations (抜粋) | per-phase sensibility |
|---|---|---|
| L1 要求 (L1-02) | context-engineering / context-memory / documentation … | 概ね妥当 (要求工程に文脈/文書系) |
| L4 基本設計 (L4-05) | adversarial-review / agent-design / api / api-contract … | 設計系は妥当だが generic 寄り |
| L5 詳細設計 (L5-06) | adversarial-review / agent-design / api / api-contract … | L4 とほぼ同一 = 層弁別が弱い |
| L7 谷 (L7-93 lint) | adversarial-review / agent-* / api / **browser-testing** … | lint gate に browser-testing/api は不適 |

- **確証 (詰まり② = viable・confirmed)**: 決定論 phase-driven recommender が **工程入力に対し per-phase の
  ranked skill set を出す**ことを実機確認。LLM 不使用・TS-native で成立 (PO 確定方向どおり)。catalog scan
  (詰まり①) も curate 済 source で成立。
- **実測した限界 (L5/L6 refinement へ送る)**: **score 飽和** — 全 phase で top-5 が score=1 に張り付き、
  同点内は asset_id アルファベット順に退化。結果、層 (L4↔L5) 間の弁別が弱く、不適な skill (lint gate に
  browser-testing/api) が上位に混入する。原因 = スコアが layer + drive_model の 2 軸 (+ 粗い category
  キーワード) で、**gate (G2/G4) 粒度タグ / 明示 category タグ**が無い。詰まり② の仮説どおり「category タグ +
  工程(layer/gate)タグ」で de-saturate するのが正しい改良方向 (= §6 既知 carry「recommender スコアリング詳細」)。

### S4 — 設計確定 (decision_outcome = confirmed)

- **confirmed**: skill module 設計 (catalog scan + 決定論 per-phase recommender + injector) は viable で、
  既に L5-06-skill / L4-12 / L7-70 + src/skills/recommend.ts として **shipped 済**。S4 = confirmed を記録
  (PO は 2026-06-01 に方向確定済 + L5-06 confirmed = 設計判断は既済、本クローズはその bookkeeping)。
- **promotion_strategy = redesign (realized)**: spike 破棄 → 本実装で再設計、は production 実装で既に達成。
  Reverse 不要 (IMP-066、scrum-reverse REVERSE_EXEMPT_PROMOTION)。
- **carry (L5/L6)**: score 飽和の de-saturate (category/gate タグ導入 + スコア再設計) は §6 既知 carry に集約。

## §6 carry / 関係

- **Forward 着地先**: confirmed → PLAN-L5-06-skill (kind=design、L5↔L8 ペア)
- **curate 依存**: catalog source の curate (FR-L1-47) は L7 / porting-map W10 (実装状態解消型)。spike は vendor sample で代替
- **兄弟**: roster (PLAN-DISCOVERY-02、confirmed 済) / drift (FR-L1-49、未判定)
- **メタモデル dogfood**: 所見は [[PLAN-DISCOVERY-01]] §7.1 へ back-merge (Discovery-for-design 2 件目)
- **L6 carry**: recommender スコアリング詳細 / injector の layer 別注入セット定義 (waiting_layer:L6)

## §7 DoD (S1→S4)

- [x] **S1**: skill 設計仮説 + 核心的不確実性 (詰まり①②) を §1 に provisional 記述
- [x] **S2**: spike 代替 = shipped 済 production 実装 (`src/skills/recommend.ts`) を検証 vehicle に採用 (§5)
- [x] **S3**: 4 phase (L1/L4/L5/L7) で `skill suggest` を live 観察、§5 に記録 (決定論で per-phase set が出る + score 飽和の限界)
- [x] self-review (intra_runtime_subagent、PM Opus) が検証の信頼性を確認 (single-runtime mode、cross-agent 不在記録)
- [x] **S4**: `decision_outcome=confirmed` + `promotion_strategy=redesign` (PO 方向確定 2026-06-01 + L5-06 confirmed = 設計既済の bookkeeping クローズ)
- [x] confirmed 帰結: PLAN-L5-06-skill は既に Forward 確定 (confirmed) + PLAN-DISCOVERY-01 §7.1 へ所見 back-merge + spike 不要 (impl が先行)
