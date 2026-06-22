---
plan_id: PLAN-DISCOVERY-05-roadmap-registration
title: "PLAN-DISCOVERY-05 (kind=poc): 工程表 (gated layer-decomposition roadmap) を第一級・機械登録エンティティ化する metamodel 検証"
kind: poc
layer: cross
workflow_phase: S4
scrum_type: design-spike
drive: fullstack
status: confirmed
decision_outcome: confirmed  # S4 = 工程表=第一級機械登録エンティティ化の PoC 採用。dogfood 成功 + 採用 (roadmap-registry が doctor で load-bearing 稼働) + concept §10 promote 済 (RECOVERY-04/REVERSE-44) を実体で確認、PO goal directive (2026-06-22「A の 3 本の drift 解消」) で授権。promotion_strategy=reuse-with-hardening。
promotion_strategy: reuse-with-hardening
created: 2026-06-10
updated: 2026-06-22
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: PM (Opus) verification (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: pass
    scope: "poc (工程表 = gated layer-decomposition roadmap を第一級・機械登録エンティティ化) の S4 status drift (spike src merge 済なのに draft 放置) を解消し confirmed 化。spike 成果物 src/schema/roadmap.ts + src/lint/roadmap-registry.ts + tests/roadmap.test.ts は 2026-06-12 (239cb32) で merge 済 + doctor checkRoadmap (roadmap-rollup / program-coverage / 各 band の gate+span) として load-bearing 稼働中。S4 exit 義務 (§3 段4: confirmed → concept §2.5/§10 へ promote) は既に discharge 済 = concept §10 glossary (行 1134-1138) が 工程表/roadmap・§工程表・human/AI plane・全プログラム被覆・program rollup を定義し、まさに src/schema/roadmap.ts + src/lint/roadmap-registry.ts を機械登録機構として明記 (RECOVERY-04 / REVERSE-44 経由)。= dogfood 成功 + 採用 + promote 済 + load-bearing。Vitest 787/787 green / doctor EXIT=0。decision_outcome=confirmed / promotion_strategy=reuse-with-hardening。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: aim
    slot_label: "AIM — 工程表登録 metamodel の新方向性策定 + L1 接続判断"
  - role: po
    slot_label: "PO — 工程表の登録機構 framing 承認 + 成否最終判断"
  - role: tl
    slot_label: "TL — registry schema / doctor 検証の設計レビュー (別 runtime)"
generates:
  - artifact_path: docs/plans/PLAN-DISCOVERY-05-roadmap-registration.md
    artifact_type: markdown_doc
  - artifact_path: src/schema/roadmap.ts
    artifact_type: source_module
  - artifact_path: src/lint/roadmap-registry.ts
    artifact_type: source_module
  - artifact_path: tests/roadmap.test.ts
    artifact_type: test_code
# dogfood (S3): L7 層工程表を本 PoC plan に登録する。master-hub 配置は S4 confirmed 後 Reverse で移送。
# 塊C (L7-32..35) は実在 PLAN、塊A/B/D/E は未起票 → doctor が「孤児 span = work queue」として surface する。
roadmap:
  layer: L7
  gates:
    - id: G-L7.A
      name: orphan governance guard
      exit_criteria: "impl-plan-trace lint green + orphan 0 (doctor fail-close)"
    - id: G-L7.B
      name: substance-gate lints
      exit_criteria: "tracked⊆canonical + oracle⇔test 突合 green"
    - id: G-L7.C1
      name: relation-graph core (collect + impact)
      exit_criteria: "collectRelationGraphProjection + analyzeRelationImpact green (U-RELGRAPH-001..006)"
    - id: G-L7.C2
      name: relation-graph export + evidence
      exit_criteria: "exportRelationDiagram + collectVerificationEvidenceProjection green (U-RELGRAPH-007..010)"
    - id: G-L7.C
      name: L7 Forward 本線 families
      exit_criteria: "relation-graph(2 span)/MCP/tool-adapter/doc-export family 実装 + pair-freeze + review (各 1〜3 機能 span に分割、D3)"
    - id: G-L7.D
      name: relation-graph 依存キャリー
      exit_criteria: "regression expansion + dependency-drift 実装 (scaffold stub 解消)"
    - id: G-L7.E
      name: layer exit (実装検証サイクルゲート)
      exit_criteria: "VERIFICATION_GROUPS に L0-L7 group 追加 (L7 freeze 後発火)"
  spans:
    - plan_id: PLAN-REVERSE-40-orphan-governance
      after_gate: entry
      before_gate: G-L7.A
    - plan_id: PLAN-REVERSE-41-substance-lints
      after_gate: G-L7.A
      before_gate: G-L7.B
    - plan_id: PLAN-L7-32-cross-artifact-relation-graph
      after_gate: G-L7.B
      before_gate: G-L7.C1
    - plan_id: PLAN-L7-36-relation-graph-export
      after_gate: G-L7.C1
      before_gate: G-L7.C2
    - plan_id: PLAN-L7-33-mcp-profile-config-safety
      after_gate: G-L7.C2
      before_gate: G-L7.C
    - plan_id: PLAN-L7-34-tool-adapter-probes
      after_gate: G-L7.C2
      before_gate: G-L7.C
    - plan_id: PLAN-L7-35-canonical-document-export
      after_gate: G-L7.C2
      before_gate: G-L7.C
    - plan_id: PLAN-REVERSE-42-regression-dependency-drift
      after_gate: G-L7.C
      before_gate: G-L7.D
    - plan_id: PLAN-L7-43-implementation-verification-group
      after_gate: G-L7.D
      before_gate: G-L7.E
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-DISCOVERY-01-workflow-metamodel.md
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    - docs/governance/gate-design.md
    - src/schema/frontmatter.ts
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-DISCOVERY-05 (kind=poc): 工程表を第一級・機械登録エンティティ化する metamodel 検証

## §0 位置づけ

PO 指示 (2026-06-10、4 連続メッセージ) の正規化:

1. 「工程表作らないの?」「工程表でグルーピングして塊で実装するのがいい」
2. 「実際の SaaS 開発だと L7 は膨大 → 工程表に分解して進めないと」
3. 「工程表内でゲートを作って、そのゲート間がプラン起票じゃないの?」
4. 「**工程表自体も登録できる仕組みにするんやで?**」

= **大層 (実 SaaS の L7 は膨大) を 1 層 1 ゲートで回すのは破綻する。層を「工程表」に分解し、工程表内に中間ゲートを置き、ゲート間の 1 区間 = 1 PLAN とする。そしてこの工程表自身を floating doc にせず、PLAN や gate 台帳と同じく機械が読む第一級登録エンティティにする。**

これは Forward 凍結 PLAN ではなく **検証 (PoC) 駆動プラン**。「工程表登録」という機構仮説が高不確実なため、§1.1 (DISCOVERY-01) の **設計 → 仮実装 → 検証 → 設計確定** パターンを自己適用する。DISCOVERY-01 (workflow metamodel 本体) は confirmed/凍結済のため、本 PLAN は**その上に乗る新仮説**として別 Discovery で起票する (§1.10 A uniqueness、既存 DISCOVERY-01〜04 と非重複)。

> **dogfood 対象**: いまの L7 (キャリー lint 群 + 外部ツーリング family) を最初の登録工程表として回し、機構が実タスクできれいに回るかを実証する。

## §1 hypothesis (何を検証)

**H1**: 工程表を `roadmap{layer, gates[], spans[]}` として登録でき、`span` が `plan_id` を指し、doctor が「span の PLAN 実在 + 各 gate の exit 達成状況 (進捗)」を機械検証・surface できる。

**H2**: この登録工程表は既存機械骨格の上に**薄い拡張**で乗る (net-new な大規模 subsystem ではない):

| 4 段階層 | 既存機構 | 本 PoC で足す net-new |
|---|---|---|
| ① 工程表 (層分解) | `master_hub: true` frontmatter (PLAN-L5-00-master 等で既存) | `roadmap:` ブロック (gates[] + spans[]) を master-hub frontmatter に登録可能化 |
| ② 区間 = PLAN | 個々の child PLAN (既存 plan_id registry) | `span.plan_id` → 既存 PLAN への参照 (実在検証) |
| ③ 層内ゲート | gate-design §2 台帳 (層間 G0.5-G7) / `VERIFICATION_GROUPS` (band) | `roadmap.gates[]` = **層内**中間ゲート (exit_criteria) |
| ④ PLAN 内 Step | §G.4 §工程表 (Step + review Step) | (変更なし) |

**H3**: これにより「大層を場当たりに PLAN を生やす」(A-108 orphan の温床) を構造的に防げる — 工程表が先に gate/span を宣言し、PLAN は宣言された span を埋める形でしか起票されない。

## §2 既存骨格との接続 (重要前提)

DISCOVERY-01 §1 が示す通り「新規構築でなく既存骨格の拡張」。`master_hub: true` は既にあるが**実体 (gates/spans 構造) を持たない単なる flag** であり、機械はそれを読まない。本 PoC は master_hub を「読める登録工程表」へ実体化する。gate-design 台帳 (層間ゲート) と `VERIFICATION_GROUPS` (band 検証サイクルゲート) は触らず、その**層内版**として `roadmap.gates[]` を足す (命名・参照は gate-design を単一正本に保つ)。

## §3 method (どう検証)

§1.1 設計→仮実装→検証→設計確定:

| 段 | phase | 内容 |
|---|---|---|
| 1. 設計 (provisional) | S1 | `roadmapSchema` 形状 + 格納場所 + doctor 検証規則を本 PLAN §4 に暫定設計 |
| 2. 仮実装 (spike) | S2 | `src/schema/` に roadmap schema (zod) + doctor surface を **TDD Red 先行**で薄く仮実装 (使い捨て可、本実装は Reverse 後) |
| 3. 検証 | S3 | L7 工程表 (§5) を登録し、doctor が span 実在 + gate 進捗を正しく surface するか観察 (詰まり/欠落) |
| 4. 設計確定 | S4 | `decision_outcome` (PO)。confirmed → Reverse で FR + concept §2.5/§10 へ promote、本実装ゲートへ |

## §4 registration mechanism 設計 (provisional, S1)

### §4.1 格納場所
master-hub PLAN frontmatter の `roadmap:` ブロック (専用 registry ファイルを新設せず、既存 plan_id registry に相乗り = state 単一正本)。

### §4.2 schema 形状 (zod、暫定)
```
roadmap:
  layer: <layer>            # 対象大層 (例 L7)
  gates:                    # 層内中間ゲート (順序)
    - id: <gate_id>         # 例 G-L7.A
      name: <string>
      exit_criteria: <string>   # 機械検証可能な達成条件 (doctor が照合する surface)
  spans:                    # ゲート間区間 = PLAN 群
    - plan_id: <plan_id>    # 既存 PLAN 参照 (実在必須)
      after_gate: <gate_id|entry>
      before_gate: <gate_id>
```

### §4.3 doctor 検証 (hard/fail-close)
- **span 実在**: 各 `span.plan_id` が docs/plans/ に実在し status を解決できる (孤児 span = fail-close 候補)。
- **gate 進捗**: 各 gate について、その直前 spans の PLAN が全 confirmed なら gate=reached を surface (gate-confirm 同型、ただし層内)。
- **gate 順序整合**: `after_gate`/`before_gate` が gates[] 内に存在し循環しない。

## §4.4 工程表 粒度ドクトリン (span sizing — PO 指摘 2026-06-10、定義の正本)

> **背景**: §4 は登録「機構 (器)」を定義したが「span をどの粒度にすべきか」の定義が無く、初回 dogfood で過大 span が出た (REVERSE-41 が別関心 2 lint、塊C が 4 family を 1 gate)。器に定義を伴わせる (柱2 doc×機械)。

**D1. 1 span = 1 PLAN = 1 cohesive V-model unit**: design⇄test-design⇄テストコード⇄impl が一体で freeze できる最小単位。粒度の基準 = **単体テスト設計粒度** ([[feedback_design_granularity_equals_test_design]])。1 つの cohesive な unit-test 設計 (GWT/oracle 群) が書ける単位を 1 span とする。別関心を 1 span に lump しない ([[feedback_plan_per_requirement]]、REVERSE-41 が違反例)。

**D2. TDD 2× 計上 (PO 2026-06-10)**: 各 span は「テスト実装 (Red) → impl (Green) → review」。**span の実コスト ≈ impl の最低 2倍 (test+impl)**、full V-model では 4 artifact (L6 設計 + L7/L8 テスト設計 + テストコード + src)。**見積り・gate sizing は impl LOC でなく test+impl で行う**。「impl だけ見て小さい」と誤認しない。

**D3. span 粒度 = 1〜3 機能 (PO 2026-06-10)**: 1 span ≈ **1〜3 機能 (関数)**。**1 PLAN=1 関数は細かすぎ** (over-fragmentation)、**大型 module 丸ごと=粗すぎ**。TDD 2× (test+impl) 込みで **1 Red→Green→review cycle に収まる範囲** = 概ね 1〜3 機能。判定補助: 独立 freeze 可能な oracle 群が 1〜3 個に収まるか。例: **L7-32 relation-graph の 4 関数 → 2 span** (例 collect+impact の 2 機能 / export+verification-projection の 2 機能、各 test+impl で 1 cycle)。4 関数を 1 span は過大、4 span は過細。

**D4. gate 配置**: 各 cohesive unit の freeze/review 境界ごとに gate。独立並列 span は同一 gate 間隔に複数可 (直列化 3 条件に該当しなければ並列、[[並列実行]])、依存は直列 gate。

**D5. 機械担保 (define+enforce の対、方向)**: checkRoadmap を拡張し ① 各 span plan_id が pair_artifact (V-pair) を持つか ② span PLAN の宣言 oracle 数 / §工程表 Step 数が閾値超なら「過大 span」warn、を surface する (S4 confirmed 後の本実装で着地)。定義 (本 §4.4) を機械が守らせる降下先。

## §5 dogfood インスタンス — L7 層工程表 (登録対象)

```
G-L7.0 (entry) ✅ = L6 設計 band freeze 済 (設計検証サイクルゲート PASS)
塊A [span: Reverse→L6→L7] orphan 統制の土台
   IMP-088 impl→PLAN trace lint (FR-L1-18 拡張) + IMP-087 orphan4件 back-fill + rule-drift FR
G-L7.A = impl-plan-trace green + orphan 0 (doctor fail-close) ← 以降の span を守るガード
塊B [span: Reverse→L6→L7] substance-gate lint 群
   IMP-127 tracked⊆canonical (asset-drift 拡張) + IMP-128/083 oracle⇔実test 突合
G-L7.B = 両 lint green
塊C [span: 各 1〜3 機能 = 1 PLAN、D3 粒度] L7 Forward 本線 ★L7 初手 = この先頭
   L7-32 relation-graph core (collect+impact, 2機能) → G-L7.C1
   L7-36 relation-graph export+evidence (2機能) → G-L7.C2
   L7-33 MCP / L7-34 tool-adapter / L7-35 doc-export (各 build 時に 1〜3 機能 span へ分割)
G-L7.C = 全 family 実装 + pair-freeze + review 済
塊D [span: Reverse→L6→L7] relation-graph 依存キャリー
   regression expansion (L7-32 依存) + dependency-drift (IMP-032)
G-L7.D = doctor scaffold stub 解消
G-L7.E (layer exit) = 実装検証サイクルゲート: VERIFICATION_GROUPS に L0-L7 group 追加 (L7 freeze 後発火可 = 実装検証サイクルゲート機械化)
```

> 当初ゴール「キャリー潰して L7 の初手まで」= 塊A・塊B (キャリー) を span PLAN で潰す → 塊C 先頭 = L7-32 Red entry。旧 GATE-B carry は `PLAN-L7-43` / `PLAN-REVERSE-43` で L0-L7 `VERIFICATION_GROUPS` に機械着地し、G-L7.E reached として閉じた。Phase 4 DB はこの automation evidence を projection DB へ引き込む次 cycle。

## §工程表

### Step 1: [直列] registry schema + doctor 検証規則の provisional 設計確定 (S1)

直列理由: downstream_dependency. §4 の schema/doctor 規則が確定しないと spike (Step 2) が書けない。

### Step 2: [直列] spike 仮実装 — roadmap schema (zod) + doctor surface の TDD Red → Green (S2)

直列理由: downstream_dependency + file_conflict. Step 1 設計に依存し、`src/schema/` + `src/doctor/` の同一領域を書く。IMP-077 順序 (定量テスト green 後にレビュー) を守り Red 先行。

### Step 3: [直列] L7 工程表 (§5) を登録し doctor surface を検証 (S3)

直列理由: downstream_dependency. spike (Step 2) green が前提。dogfood で詰まり/欠落を観察し §7 に記録。

### Step 4: [直列] review (固定 review Step)

直列理由: downstream_dependency. typecheck / lint / vitest / doctor green 後に review evidence を記録。`claude-only`/`standalone` は intra_runtime_subagent (pmo-sonnet/code-reviewer)、`hybrid` は別 runtime frontier-reviewer。

### Step 5: [直列] S4 decision (PO) → confirmed なら Reverse promote 経路を宣言

直列理由: downstream_dependency. PO の decision_outcome 後に exit 分岐 (§6) を確定。

## §実装計画

- **Step 1 設計**: 情報源 = §4 本文 + src/schema/frontmatter.ts (既存 master_hub flag) + gate-design.md §2 (層間ゲート命名正本) + DISCOVERY-01 §1 (既存骨格表)。
- **Step 2 spike**: 情報源 = src/schema/team.ts (zod schema の既存実装パターン) + src/doctor/index.ts (check 追加パターン)。使い捨て前提のため最小スライス (roadmap 1 件 parse + span 実在 + gate 進捗 surface)。
- **Step 3 dogfood**: 情報源 = §5 L7 工程表 + docs/plans/ の実 PLAN 群 (L7-32..35 / 塊A-D の span PLAN は未起票なので placeholder span 許容)。
- **Step 4 review**: 情報源 = requirements §7.8.7 review 前置 + IMP-077 順序。
- **Step 5 exit**: 情報源 = §6 exit enum + DISCOVERY-01 §1.1 promote 経路 ([[project_workflow_metamodel_poc]])。

## §6 exit 3 分岐 (既存 enum マップ)

- **confirmed** (`promotion_strategy: reuse-with-hardening`): 工程表登録機構を採用。Reverse PLAN で ① FR 起票 (工程表登録 = 新 FR) ② concept §2.5/§10 へ用語 promote ③ spike → 本実装ゲート。
- **pivot**: 格納場所 (master-hub frontmatter) や schema 形状を直して再検証。
- **rejected** (`discard`): 工程表は markdown doc のままとし機械登録しない (master_hub flag 据え置き)。

## §7 S3 verify 記録 (dogfood 所見、decision は S4=PO)

**spike 実装 (Step 2)**: `src/schema/roadmap.ts` (zod schema + 構造整合 `validateRoadmapStructure`) + `src/lint/roadmap-registry.ts` (extract/parse/span 実在/gate 進捗/load) + doctor `checkRoadmap` (hard/fail-close) + `tests/roadmap.test.ts` (U-ROADMAP-001〜010, 10 green)。typecheck/lint clean・vitest・doctor exit 0。

**dogfood 登録 (Step 3)**: 本 PoC plan frontmatter に L7 層工程表 (§5) を `roadmap:` block で登録 → doctor が以下を surface:

```
roadmap — PLAN-DISCOVERY-05 [L7]: gates 0/5 到達, spans 8, 孤児 span 4, 構造 issue 0
  G-L7.A: ⏳ pending (0/1 span confirmed)   ... G-L7.E まで全 pending
```

**所見 (H1-H3 検証)**:

- **H1 (登録+機械追跡) 成立**: 工程表が第一級登録され、doctor が gate 到達 (before_gate span 全 confirmed か) + 孤児 span を機械 surface。draft の L7-32..35 が正しく未到達、未起票の塊A/B/D/E span 4 件が「孤児 span = work queue」として可視化 (柱3 state DB feedback)。
- **H2 (薄い拡張) 成立**: 新 module を作らず src/schema + src/lint 既存 module 内に収まった (module-drift 孤児ゼロ)。frontmatter schema は unknown key strip で `roadmap:` と非破壊共存。
- **H3 (場当たり PLAN 抑止) 部分実証**: 工程表が span を先に宣言 → 未起票 span が孤児として出る = 「次に起こすべき PLAN」が機械から読める。
- **詰まり/finding**:
  1. **配置**: master-hub-at-impl-layer (PLAN-L7-00-master) の意味論が未確立 (既存 master hub は kind=design L1-L6)。spike は PoC plan に仮置き。本配置 (master hub or dedicated registry) は S4 confirmed 後 Reverse で判断。
  2. **塊=複数 PLAN**: 1 塊 = Reverse+L6+L7 の複数 PLAN。span=1 PLAN だが同一 (after,before) gate に複数 span entry を並べれば表現可 (model で吸収済)。
  3. **孤児 span の hard 化**: 完了。宣言済 span が未起票の場合、`checkRoadmap.ok=false` として doctor が fail-close する。

## §6 用語更新 (§G.9)

| 語 | 定義 (暫定) | 確定経路 |
|---|---|---|
| 工程表 (roadmap) | 大層を gates[] と spans[] (区間=PLAN) に分解し機械登録する第一級エンティティ | S4 confirmed 時 concept §10 へ promote (Reverse 経由) |
| 層内ゲート (intra-layer gate) | 工程表内の中間チェックポイント。層間ゲート (G0.5-G7) / band 検証サイクルゲートの層内版 | 同上、gate-design を単一正本に参照 |
| span (区間) | 2 ゲート間の 1 区間 = 1 PLAN | 同上 |

## §8 DoD (S1→S3 進行、S4 は PO)

- [ ] §4 registry schema / doctor 検証規則の provisional 設計が確定 (S1)。
- [ ] spike: roadmap schema + doctor surface が TDD Red 先行で green (S2)。
- [ ] L7 工程表 (§5) を登録し doctor が span 実在 + gate 進捗を surface (S3、§7 記録)。
- [ ] review 前置を通し evidence 記録。
- [ ] S4 decision_outcome は PO。confirmed なら Reverse promote 経路を宣言。
