---
plan_id: PLAN-DISCOVERY-07-design-bottomup-mode
title: "PLAN-DISCOVERY-07 (kind=poc): design-bottomup 駆動モデル (画面後付け駆動) — backend から FE 要件を洗い出す ① elicitation engine を新規追加し、② mock 具体化 / ③ Forward 降下は Discovery 合成で再利用する feasibility 検証 + PoC 実装"
kind: poc
layer: cross
workflow_phase: S3
scrum_type: design-spike
drive: fullstack
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: aim
    slot_label: "AIM — design-bottomup の入口条件設計 (既存 Discovery/Add-feature/Forward との区別)"
  - role: tl
    slot_label: "TL (別 runtime=Codex) — engine 設計クロスレビュー + Discovery 合成の重複判定"
  - role: po
    slot_label: "PO — 新 mode の concept/requirements 正本化採否 (規範変更 = S4 gate)"
generates:
  - artifact_path: docs/plans/PLAN-DISCOVERY-07-design-bottomup-mode.md
    artifact_type: markdown_doc
  - artifact_path: src/workflow/design-elicitation.ts
    artifact_type: source_module
  - artifact_path: tests/design-elicitation.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires:
    - PLAN-DISCOVERY-01-workflow-metamodel
    - PLAN-L4-14-ui-standard
  references:
    - PLAN-L7-141-web-dashboard-component-derived
    - PLAN-L7-146-serverless-readonly-share
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T12:50:00+09:00"
    tests_green_at: "2026-06-25T12:48:00+09:00"
    verdict: approve
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
    scope: "① engine (design-elicitation.ts) + Discovery 合成 (contracts.ts design-bottomup) を code-reviewer=sonnet が PM=opus 成果を別 model family で desk review (hybrid だが claude intra_runtime_subagent fallback、.claude/CLAUDE.md)。verdict=APPROVE-WITH-CHANGES (Critical 0)。非重複 (composeDesignBottomupDiscovery が routeSignalToMode 再利用で discovery routing に乗る = mode 再発明なし) / substance≠coverage (detectFeDesignGaps が has_body 実体判定) / absence-blindness (derive 不能画面を warn 可視化) を PASS。Important I-1 (groundingFor が screen 非依存で generic cap へ潰れる) を screen-specific (trace primary) へ修正、I-2/I-3/M-3 (slots=[] gap + r.ok assert) をテスト追加で反映。10 tests green。"
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests/design-elicitation.test.ts (10 tests: elicit×3 / detectGaps×3 / compose×2 / runBottomup×2)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T12:48:00+09:00"
        evidence_path: tests/design-elicitation.test.ts
        output_digest: "sha256:5daff4dcbff64a52fa22ccc89ebf42e060eb494726fb2e4889801311dca407e7"
      - kind: unit_test
        command: "bunx vitest run tests/design-elicitation.test.ts (engine 本体 elicit/detectGaps/compose/runDesignBottomup 実挙動)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T12:48:00+09:00"
        evidence_path: src/workflow/design-elicitation.ts
        output_digest: "sha256:cdd1a991273e21469cca5b78e1b42f85967f3ce8b280cfdd2face6d9a39ce0df"
---

# PLAN-DISCOVERY-07 (kind=poc): design-bottomup 駆動モデル

## 0. Objective (PO 指示 2026-06-25)

PO 発話: 「Design bottom up みたいな駆動モデルを作りたい」「バックエンドからフロントの要件を
洗い出す仕組み。そして画面モックを作って具体化させてフォワードで落としていく」。

ハーネスは backend 主軸 (CLI / harness.db) で、中央 UI (L2 で G2 freeze 済の 15 画面) を後付け
したい。だが FE 設計左腕 (L3 screen-functional / L5 ui-detail / L6 screen-spec) は slot 登録のみで
body が空 (coverage≠substance、[[feedback_coverage_not_substance]])。実体があるのは L2 画面設計群と
L4 ui-standard のみ。`src/web` は破棄済で空 (`76479d3`)。

この「backend が確立済の system に画面を後付けする」入口条件を持つ駆動モデルが存在しないため、
新 mode **design-bottomup** を Discovery dogfood で確定する。

## 1. Gap (なぜ既存 mode で足りないか) — 重複分析

| flow 段階 (PO 定義) | 既存機構 | 状態 |
|---|---|---|
| ② 画面 mock で具体化 | screen-design (Forward L2 工程専門、wireframe=③mock) + Discovery (`design_uncertain`) | 既にある |
| ③ Forward で落とす | Discovery 合流点 (設計確証→L3-L6) + Forward 本線 | 既にある |
| ① **backend から FE 要件を洗い出す** | **無い**。`classifyDriveTddFits` は静的分類のみ、`red_triggers` は contracts.ts 内の文字列で発火されない。backend (L4 data / projection / CLI capability) を読んで FE 要件を derive する engine は不在 | **本当の gap** |

よって新規実装は **① elicitation engine に限定**し、②③ は Discovery / screen-design / Forward を
**合成 (再利用)** する。新 mode を②③まで新造すると Discovery と重複 = デグレ
([[project_plan_governance_already_checks_dep_existence]] の PLAN-L7-56 ~95% 重複 revert の教訓)。

## 2. 駆動モデル定義 (入口条件で他 mode と区別)

| 駆動モデル | 入口 | 設計の向き |
|---|---|---|
| Forward (design-first) | greenfield | UI 設計を先に降ろしてから実装 |
| Add-feature 経路B | 汎用機能を build | L6/L7 build → L3 **要件** を back-fill |
| **design-bottomup (新)** | **backend が主軸で確立済 + UI 後付け** | 確立した backend を "下" として L4 data (= FE 設計の backend 対応物) / harness.db projection / CLI capability から FE 要件を **derive** → mock 具体化 → Forward 降下 |

- drive (専門職) = `fe` / `fullstack` ([[feedback_drive_is_specialist_not_mode]]、mode≠drive)。
- 出口 = 全 mode 共通原則どおり Forward L0-L14 へ合流 (Discovery の設計確証合流点 L3-L6)。

## 3. PoC 実装 (S2 build、2026-06-25。promotion_strategy=reuse-with-hardening)

① engine を新規モジュールに実装した (使い捨てでなく hardening 前提で promote する PoC、
DISCOVERY-01/06 と同じ reuse-with-hardening)。

**成果物 (本 commit)**:
- `src/workflow/design-elicitation.ts` — ① engine。
  - `elicitFeRequirements`: backend reality (screens / capabilities / screen_trace) から FE 要件候補を
    各画面 × FE 設計鎖 3 slot (L3/L5/L6) で derive。各候補は backend capability に `derived_from` で
    grounding (prose でなく実体で substantiate)。grounding 不能画面は `fe-requirement-ungrounded` warn
    で可視化 (absence-blindness 対策、[[project_descent_absence_blindness]])。
  - `detectFeDesignGaps`: 候補ありかつ slot body 不在 (`has_body=false`) を gap として `screen_requirement_gap`
    / `ui_detail_gap` / `screen_spec_gap` で発火 (coverage≠substance: body 実在のみ green)。
  - `composeDesignBottomupDiscovery`: gap を Discovery (`design_uncertain`) エントリへ合成。
    既存 `routeSignalToMode` を再利用し entry_signal が discovery routing に確実に乗ることを保証 (mode 再発明しない)。
    stage = elicit → mock 具体化 (screen-design) → Forward 降下 (L3/L5/L6) → Discovery S4。forward_merge=L3-L6。
  - `runDesignBottomup`: 上記を連鎖する end-to-end 駆動。
- `src/workflow/contracts.ts` — design-bottomup を `DRIVE_TDD_FITS` (mode taxonomy、strong fit) と
  `ROUTE_SIGNAL_MAP` (入口 signal routing) へ配線。
- `tests/design-elicitation.test.ts` — 10 テスト (engine + 合成 + taxonomy。code-reviewer cross-review の I-1/I-2/I-3/M-3 反映済)。

## 4. Acceptance Criteria (falsifiable / ut-tdd or test コマンド引用、prose 禁止)

- **AC-1 engine green**: `bunx vitest run tests/design-elicitation.test.ts` exit 0 (10 tests passed)。
- **AC-2 mode taxonomy 登録**: `classifyDriveTddFits({modes:["design-bottomup"]})` が strong fit 1 件を返し
  `red_triggers` に `screen_requirement_gap` を含む (tests/design-elicitation.test.ts の "mode taxonomy" ケース)。
- **AC-3 Discovery 合成 (mode 再発明しない)**: composeDesignBottomupDiscovery の entry_signal が
  `routeSignalToMode` で `discovery` 候補に乗る (同 test の compose ケース)。
- **AC-4 無回帰**: `ut-tdd doctor` exit 0 かつ `bun run test` (vitest 全量) green。
- **AC-5 plan/lint**: `ut-tdd plan lint` exit 0 + `bun run lint` (biome) + `bun run typecheck` 通過。

### AC 充足状況 (confirmed scope = ① engine + Discovery 合成、2026-06-25)

- **AC-1 ✓**: `tests/design-elicitation.test.ts` 10 tests green。
- **AC-2 ✓ / AC-3 ✓**: 同 test の "mode taxonomy" / "compose" ケースで充足 (`routeSignalToMode` 再利用)。
- **AC-4 ✓**: `ut-tdd doctor` EXIT 0 (残り green-command-digest は advisory note。contracts.ts 編集による
  共有ファイル digest 波及で、coordinated restamp は別メンテ = cd34975 型)。`bun run test` (vitest 全量) green。
- **AC-5 ✓**: `ut-tdd plan lint` EXIT 0 / `bun run lint` (biome) / `bun run typecheck` 通過。
- review: code-reviewer (sonnet) cross-review = APPROVE-WITH-CHANGES (Critical 0)、Important/Minor 反映済
  (frontmatter `review_evidence` 参照)。

> **本 PLAN の confirmed scope = ① elicitation engine + Discovery 合成 (Step 1-4)**。Step 5 (S4 正本化
> back-merge + 中央 UI dogfood) は **decision_outcome 未設定 = PO-gated の後続スコープ**。S4 ADOPT 決定後に
> concept §2.5 / requirements / docs/process/modes へ back-merge し、`PLAN-REVERSE-*` で Reverse 合流する
> (confirmed poc の IMP-064 義務はその時点で発生)。本 confirm は engine + 合成の着地のみを意味する。

## 5. §工程表 schedule (並列/直列 明示、review step 必須)

| Step | 内容 | 並列/直列 | 直列理由 |
|------|------|-----------|----------|
| 1 | ① engine 設計 + Red test 先行 + impl (`design-elicitation.ts` + test) | [直列] | downstream_dependency (engine signal 名が後続の配線・合成に必須) |
| 2 | design-bottomup を mode taxonomy へ配線 (contracts.ts: DriveTddFit + ROUTE_SIGNAL_MAP) | [直列] | file_conflict (contracts.ts 共有) + downstream_dependency (Step1 の signal 名に依存) |
| 3 | 検証 (typecheck / biome / vitest 全量 / doctor / plan lint) | [直列] | shared_state (HEAD 基準の全量検証は Step1-2 の着地後にのみ意味を持つ) |
| 4 | クロスレビュー (別 runtime=Codex / intra_runtime_subagent) — engine 設計 + Discovery 重複判定 | [直列] | downstream_dependency (定量 green 後にレビュー、IMP-077 定量→定性順) |
| 5 | S4 decision → 正本 back-merge (concept §2.5 9→10 mode / requirements §1.3·§1.6 / docs/process/modes/design-bottomup.md) + 中央 UI dogfood (engine が 15 画面の FE 要件を駆動) | [直列] | downstream_dependency + PO gate (規範変更は concept/requirements 先行・PO サインオフ必須) |

## 6. S4 exit 条件 (本 spike の決着点)

- AC-1〜AC-5 充足 (定量)。
- クロスレビューで「① engine が Discovery と非重複」「②③ が既存合成で再利用」が支持される (定性)。
- 上記を踏まえ **S4 で新 mode の正本化採否を PO 判断**:
  - ADOPT なら concept §2.5 (9→10 mode) / requirements §1.3 VALID_KINDS·§1.6 / docs/process/modes/
    design-bottomup.md + README 台帳 / signal routing へ back-merge し、`PLAN-REVERSE-*` で Reverse 合流
    (confirmed poc の IMP-064 義務)。中央 UI を最初の駆動ケースで dogfood (L3/L5/L6 → L7)。
  - 規範変更 (concept は最上位正本) は PO 確認前に書かない (modes README 規則「規範変更は concept/
    requirements 先行」)。本 spike 段階では taxonomy 配線 (contracts) + engine + test に留め、concept/
    requirements/process 本文は S4 ADOPT 後に編集する。

## 7. 壊さない / 再発させない

- **② mock 具体化 / ③ Forward 降下を新造しない**: Discovery / screen-design / Forward を合成
  (`routeSignalToMode` 再利用で機械担保)。重複 mode を作らない。
- **coverage≠substance**: detectFeDesignGaps は slot の `has_body` (実体) を見る。slot 登録だけでは green に
  しない ([[feedback_coverage_not_substance]])。
- **absence-blindness 対策**: backend から derive 不能な画面を `fe-requirement-ungrounded` で可視化する
  (不在を黙って素通りさせない、[[project_descent_absence_blindness]])。
- **規範変更は PO gate**: concept/requirements/process modes の本文編集は S4 ADOPT 後に限る。
- **中央 UI 不変条件**: dogfood (Step5) でも S5=b (read-only) / S-01 / CC2 / ADR-005 D2 を変えない。
