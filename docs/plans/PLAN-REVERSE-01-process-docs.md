---
plan_id: PLAN-REVERSE-01-process-docs
title: "PLAN-REVERSE-01 (kind=reverse): docs/process 正本化 — DISCOVERY-04 dogfood 実績 (V1-V7) から forward/modes/gates を as-is 復元し gap を Forward へ routing"
kind: reverse
layer: cross
workflow_phase: R3
drive: fullstack
status: draft
created: 2026-06-02
updated: 2026-06-02
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — as-is 復元 (R0-R2) + gap routing 確定 (R4)。別 runtime、claude-only 時は code-reviewer/pmo-sonnet 代替"
  - role: po
    slot_label: "PO — R3 Intent 検証 + V7 drive 概念 (§1.6 再設計) の判断"
generates:
  - artifact_path: docs/process/forward/
    artifact_type: doc_update
  - artifact_path: docs/process/modes/
    artifact_type: doc_update
  - artifact_path: docs/process/gates.md
    artifact_type: doc_update
dependencies:
  parent: null
  requires:
    - PLAN-DISCOVERY-04-process-workflows
  references:
    - docs/plans/PLAN-DISCOVERY-04-process-workflows.md
    - docs/plans/PLAN-DISCOVERY-01-workflow-metamodel.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    - docs/governance/repository-structure.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-REVERSE-01 (kind=reverse): docs/process 正本化

## §0 位置づけ

PLAN-DISCOVERY-04 (Discovery、S4 confirmed 2026-06-02) の **終点 Reverse** (§3.1)。Discovery で回した docs/process spike (forward L0-L14 + 駆動モデル9種 + gates) を、**dogfood 実績 (V1-V7) を evidence に as-is 復元し、gap を Forward 各層へ routing して正本化**する。

> **Discovery → Reverse 配線 (PO 確定、メタモデル標準)**: docs/process の正本は forward で机上起草せず、Discovery で回した実績から Reverse で再整備する。本 PLAN がその「再整備本体」。requirements §1.2 / DISCOVERY-01 §6 と同配線。

**reverse_type = design/fullback** (既存 spike + dogfood 実績からの設計復元 + 完了 Discovery の文書整合)。design/normalization 型は **R1 (Observed Contracts) skip** 可 (§3.3)。

## §1 evidence (R0-R2 の入力)

| evidence | 内容 |
|----------|------|
| ① DISCOVERY-04 spike | `docs/process/{README, forward/*, modes/*, gates.md}` (PROVISIONAL、本 PLAN で正本化) |
| ② dogfood 実績 | DISCOVERY-04 §S2-S3: L1-L6 sub-doc ⇔ 実 PLAN 整合 / 実使用 mode frontmatter 整合 / V-pair 成立 |
| ③ gap register | DISCOVERY-04 V1-V7 (下記 §2) |
| ④ 移植元 | `vendor/helix-source/docs/v2/process/` + `helix-process/` (なぞり禁止、翻案元) |

## §2 gap register (R3-R4 で Forward へ routing)

| # | gap | forward_routing 候補 | promotion_strategy 候補 |
|---|-----|---------------------|------------------------|
| **V7** (最重要) | **`drive` 概念の歪み**: drive=専門職 (be/fe/fullstack/db/agent) だが §1.6 enum に mode 値 (scrum/reverse/poc/troubleshoot) が混在 + 「駆動モデル」と命名衝突 | **L3** (requirements §1.6 VALID_DRIVES 再設計 + concept §2.5/§2.6.4 用語分離 + DISCOVERY-01 metamodel) | redesign (drive 軸を専門職のみに再定義) |
| V3 | recovery drive: §1.6 `recovery→troubleshoot 固定` vs 実 PLAN-RECOVERY-01=fullstack。**V7 に包含** (recovery は work 専門職を継承) | L3 (V7 と同時) | (V7 従属) |
| V1 | `forward_routing` enum (L1/L3/L4/L5/gap-only) に helix の L7/L8-L11(fullback) routing が無い | L3 (requirements §3.4 / schema enum 拡張要否) | reuse-with-hardening or redesign |
| V2 | `docs/research/` が canonical tree 未登録だが research.md が参照 | L4→repository-structure (tree 追加 or docs/adr 寄せ) | reuse-with-hardening |
| V4 | L4/L5 の内部資産拡張 sub-doc (roster/skill/drift) が forward spike の sub-doc enum に未記載 | L3/L4 (sub-doc enum 拡張点注記) | reuse-with-hardening |

> V5/V6 (mode≠kind 非1:1 / phase 命名) は DISCOVERY-04 で翻案解決済 = gap でない。

## §3 工程表 (R0-R4)

### Step R0: Evidence Acquisition

- §1 evidence を収集・整理 (spike 群 + dogfood 実績 + gap register + 移植元)。
- 状態: ✅ §R0 実績参照 (drive 使用集計 + spike + DISCOVERY-04 §S2-S3)。

### Step R1: Observed Contracts (design/fullback 型は skip)

- reverse_type=design/fullback のため **skip** (§3.3、RG1 を持たない)。skip 理由 = 設計復元 (既存 spike + dogfood 実績) であり観測契約抽出工程を要しない。
- 状態: ✅ (skip 記録済)

### Step R2: As-Is Design

- spike (forward/modes/gates) を「現状あるべき定義」として整理。dogfood で「回った」部分 (V-pair / sub-doc 整合 / mode frontmatter) を as-is 正本候補に昇格。
- 状態: ✅ §R2 実績参照 (現 §1.6 drive enum 9 種 + 実 PLAN drive 使用 as-is)。

### Step R3: Intent Hypotheses (po 検証必須)

- gap register (V1/V2/V4/V7) の「あるべき姿」仮説を作成。**特に V7 (drive 再設計) は PO 検証必須** (§1.8 R3→po)。drive=専門職のみ / mode 値分離 / recovery は work 専門職継承 の方向を PO 確認。
- 状態: ✅ **V7 intent (A-G) 起草 + self-review (APPROVE-with-fixes 是正) + PO 方向確定 (drive=専門職、2026-06-02) → §R3-impl で実装**。V1/V2/V4 intent は R4 で詰める。

### Step R4: Gap & Routing (forward_routing + promotion_strategy 必須)

- 各 gap の `forward_routing` (大半 L3=requirements) + `promotion_strategy` を確定。docs/process/{forward,modes,gates} の正本昇格 + recovery-workflow.md 移管判断 (repository-structure §2)。
- 状態: 🟡 **V7 = `forward_routing=L3` (requirements §1.6) + `promotion_strategy=redesign` で実装済 (§R3-impl)**。V1/V2/V4 の routing + docs/process 正本化 (PROVISIONAL 外し) は未了。

### Step R-review: self-review 前置 (MUST)

- PO へ R4 routing 確定を求める前に code-reviewer / pmo-sonnet で as-is 復元の正確性・gap routing の妥当性を self-review (claude-only の tl 代替)。
- 状態: ✅ **R3 intent を code-reviewer self-review = APPROVE-with-fixes (Critical 1 + Important 3 是正済)**:
  - (Crit) §R0 集計数 35→34 是正 (glob 実数 + 件数合計一致を明記)
  - (Imp-1) 案D に troubleshoot/recovery kind の matrix 扱い + modes/README Incident/Recovery 行を明示
  - (Imp-2) 案G③ に requirements §1.1 poc variant サンプル `drive:scrum` 修正を追加
  - (Imp-3) 案G③ に modes/README 台帳 drive 列 (Discovery/Scrum/Reverse/Recovery/Incident) 更新を明示
  - (Minor) REVERSE-01 自己適用明記 / agent 代替の orchestration_mode 差 / Scrum drive 方針 追記
  - good practice: §G 2 フェーズ破壊回避 / V3→V7 包含 / mode↔drive 命名分離を評価

## §R0-R3 実績 (2026-06-02、V7 = drive 軸再設計を先行駆動)

V7 (最重要 gap) は他 gap と独立に解決可能なため R0→R2→R3 を先行駆動した (R1 は design 型 skip)。

### §R0 evidence (drive 使用実態)

全 PLAN の `drive` 集計 (34 PLAN = `docs/plans/PLAN-*.md` glob 実数、下表件数合計 18+9+4+2+1=34 と一致):

| drive | 件数 | 種別 | PLAN |
|-------|------|------|------|
| `fullstack` | 18 | **専門職** | L4/L5/L6 design + RECOVERY-01 |
| `be` | 9 | **専門職** | L1/L3 design + L5-03 |
| `db` | 2 | **専門職** | L4-01 / L5-01 |
| `poc` | 4 | **mode 値** | DISCOVERY-01/02/03/04 (kind=poc) |
| `reverse` | 1 | **mode 値** | REVERSE-01 (kind=reverse) |
| `fe` `agent` `scrum` `troubleshoot` | 0 | (be/db/fullstack 以外の専門職 + 未使用 mode 値) | — |

→ **mode 値 drive (poc/reverse) を使う PLAN は 5 件のみ。scrum/troubleshoot は未使用**。専門職 drive (be/db/fullstack、29 件) は変更不要 = migration は小規模。

### §R2 as-is (現 §1.6 drive)

`src/schema/index.ts` `VALID_DRIVES` = `[be, fe, fullstack, db, agent, scrum, reverse, poc, troubleshoot]` (9 種)。専門職 5 + mode/状況値 4 が混在。kind×drive matrix: poc→scrum/poc、reverse→reverse、recovery→troubleshoot、troubleshoot→troubleshoot (= mode 値固定)。§1.6 説明文で `scrum=仮説検証` と誤ラベル。

### §R3 intent — drive 軸再設計案 (PO 検証対象、R3 gate)

> **方針 (PO framing「drive=専門職」)**: drive = 「どの専門職/専門エージェントを招集するか」のみ。mode 概念 (入口パターン) は駆動モデル (§2.5、modes/) が担い、drive から分離する。

**A. VALID_DRIVES = 専門職 5 種のみ**: `[be, fe, fullstack, db, agent]`。**削除**: `scrum / reverse / poc / troubleshoot` (= mode/状況値、drive でない)。

**B. drive 定義 (§1.6 改訂文)**: 「その PLAN にどの専門職/専門エージェントを招集するか (owner_role / mandatory_agents / orchestration_mode を決める)」。`scrum=仮説検証` 等の mode 説明を削除。

**C. 横断駆動 kind (poc/reverse/recovery) の drive**: 探索/逆引き/復旧 **対象 work の専門職を宣言** (継承)。技術モジュール対象なら its specialist、harness methodology/process 対象なら `fullstack` (UT-TDD harness = TS fullstack) を default。→ V3 決着 (recovery→対象専門職、PLAN-RECOVERY-01=fullstack が正)。

**D. kind×drive matrix 改訂**: **全 12 kind** (charter/design/impl/add-design/add-impl/refactor/retrofit/research/poc/reverse/recovery/troubleshoot) → `be/fe/fullstack/db/agent` のいずれか (対象 work の専門職)。旧 mode 値固定 (poc→scrum/poc / reverse→reverse / **recovery→troubleshoot** / **troubleshoot→troubleshoot**) を全廃止。
- **recovery kind**: 旧 `recovery→troubleshoot` 固定行を削除 (PLAN-RECOVERY-01=fullstack を合法化、V3 決着)。
- **troubleshoot kind**: 旧 `troubleshoot→troubleshoot` を削除し障害対象の専門職に。Incident mode (kind=troubleshoot+recovery 内包) の意味分けは **drive でなく kind/mode 側で担保** (drive は「誰が直すか」)。
- → **modes/README 台帳の Recovery 行 (`drive=troubleshoot`) / Incident 行 (`drive=troubleshoot`) も専門職継承へ更新対象** (§G に含む)。

**E. mode↔drive 分離 (concept §2.5/§2.6.4)**: 駆動モデル (mode) = 入口パターン。drive = 招集専門職。Discovery/Scrum は共に exploratory mode だが drive は対象専門職。命名も「駆動モデル」と「drive」を区別 (用語集更新)。

**F. 既存 PLAN migration (5 件、poc/reverse → 専門職)**:

| PLAN | 現 drive | 新 drive (案) | 根拠 |
|------|---------|--------------|------|
| DISCOVERY-01 (workflow metamodel) | poc | `fullstack` | harness methodology = UT-TDD TS fullstack work |
| DISCOVERY-02 (roster module) | poc | `fullstack` | roster は harness 内部 module (L4/L5 roster PLAN も fullstack) |
| DISCOVERY-03 (skill module) | poc | `fullstack` | skill は harness 内部 module |
| DISCOVERY-04 (process docs) | poc | `fullstack` | process methodology = harness work |
| REVERSE-01 (process docs、本PLAN) | reverse | `fullstack` | 同上 (**本 PLAN 自身を自己適用**。実装①で本 PLAN frontmatter も書換) |

> 代替案 (PO 判断): 純 methodology の DISCOVERY-01/04・REVERSE-01 は `agent` も候補。本案は既存 harness design PLAN (全 fullstack) + RECOVERY-01 (fullstack) との一貫性で `fullstack` 統一を default とした。`agent` は concept §2.6.4 で `orchestration_mode=pm_lead` 系 (AI 実装・保守) を注入、`fullstack` は `claude_design_impl` 系を注入する差があり、PO は注入 mode の観点でも比較可。
> **Scrum mode の drive**: Scrum (kind=poc) も Discovery 同様、対象 work の専門職を drive とする (mode=反復で固める入口、drive=誰が実装するか、で分離)。

**G. 実装順序 (R4 routing 後、L3 で破壊回避)**:
1. **先に 5 PLAN の drive を migration** (poc/reverse→fullstack、frontmatter)。
2. `VALID_DRIVES` から mode 値 (scrum/reverse/poc/troubleshoot) 削除 + kind×drive matrix 改訂 (`src/schema/index.ts` + requirements §1.6 表)。
3. **正本文書の追随修正** (削除前提の記述を全洗い): ① **requirements §1.1 poc variant サンプル YAML の `drive: scrum`** → 専門職値 / ② concept §2.5 mode 表 + §2.6.4 drive×layer injection の drive 説明 / ③ `docs/process/README.md` §1 drive 表 (是正済) / ④ **`docs/process/modes/README.md` 台帳の drive 列** (Discovery=`poc`→fullstack / Scrum=`scrum`→専門職 / Reverse=`reverse`→fullstack / Recovery=`troubleshoot`→継承 / Incident=`troubleshoot`→継承)。
4. frontmatter test + plan-id-naming 回帰。
- **順序逆 (enum 削除を先) だと既存 PLAN が即 fail** (driveSchema zod parse。DISCOVERY-04 V3 衝突リスクと同根)。なお kind×drive matrix 違反は **現状 schema 未実装** (frontmatter.ts は将来実装) のため、matrix 改訂は doc 正本先行 + 実装は別途。

**R3 gate (PO 検証必須)**: 上記 A-G を PO が承認 → R4 で `forward_routing=L3` + `promotion_strategy` 確定 → L3 design PLAN (requirements §1.6 改訂) として実装。

### §R3-impl — V7 実装記録 (2026-06-02、PO 方向確定 drive=専門職)

PO が drive=専門職の方向を確定 (DISCOVERY-04 S4 + V7 連続指摘) し、goal 駆動で本 session に §G 順序で実装 (可逆・本番影響なし、PO 追認/調整可)。`forward_routing=L3` / `promotion_strategy=redesign` (drive 軸を専門職のみへ再定義)。

| # (§G) | 実装 | 対象 |
|--------|------|------|
| ① | 5 PLAN の drive migration (poc/reverse→fullstack) | DISCOVERY-01/02/03/04 + REVERSE-01 (自己適用) |
| ② | `VALID_DRIVES` を 5 種 (専門職) に縮小 | `src/schema/index.ts` (単一正本、§1.10.F) + test fixture 3 箇所 |
| ③a | §1.6 表 (5種) + kind×drive matrix (全12kind→専門職) + V7 注記 | requirements §1.6 |
| ③b | §1.1 / §1.1.reverse サンプル `drive:scrum`/`reverse`→fullstack、§1.10 enum 数 9→5 | requirements §1.1/§1.10 |
| ③c | drive 表・台帳 drive 列 (Discovery/Scrum/Reverse/Recovery/Incident=専門職継承) | docs/process/README.md + modes/README.md + 各 mode 早見表 |
| ④ | frontmatter + plan-id-naming 全回帰 | vitest **71 pass** |

**残 (本 PLAN 継続分)**: V1 (forward_routing enum) / V2 (docs/research tree) / V4 (sub-doc 拡張) の R4 routing + **docs/process/{forward,modes,gates} の PROVISIONAL→正本化**。concept §2.6.4 は enum を requirements に委譲のため追随不要 (drive=専門職の含意は §1.6 で確定)。
**PO 追認事項**: ① migration default = fullstack (代替 agent 可) / ② mode↔drive の呼称分離 (用語集) は未了。

## §4 Forward 合流

R4 routing 確定後、docs/process/{forward,modes,gates} を **L3 要件正本**として確定 + V7 を requirements §1.6 へ接続 (drive 軸再設計)。recovery-workflow.md の docs/process 移管も判断。

## §5 成否

- 正本化完了: forward/modes/gates が PROVISIONAL を外れ正本化、V1-V7 が Forward 各層 (主に L3 requirements §1.6) へ routing され閉塞。
- open 残: V7 (drive 再設計) が requirements §1.6 改訂を要する場合は L3 design PLAN へ blocks。

## §実装計画

| 項目 | 情報源 |
|------|--------|
| as-is 復元 (R0-R2) | DISCOVERY-04 spike (docs/process/*) + §S2-S3 dogfood 実績 |
| gap 仮説 (R3) | DISCOVERY-04 V1-V7 + requirements §1.6 (drive) / §3.4 (forward_routing) / repository-structure (tree) |
| routing 確定 (R4) | concept §2.5/§2.6 (mode↔drive) / requirements §1.5/§1.6 / DISCOVERY-01 metamodel |
| drive 再設計 (V7) | PO framing (drive=専門職) + concept §2.6.4 layer-context injection (owner_role/mandatory_agents) |
