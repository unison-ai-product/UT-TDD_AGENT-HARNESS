---
plan_id: PLAN-DISCOVERY-09-version-up-mode
title: "PLAN-DISCOVERY-09 (kind=poc): version-up 駆動モデル — 将来版へ保全 (deferred-but-committed-future) する mode。中央UI(画面) を第一ケースに「いまは入れないが将来的に入れる」を明示・機械追跡する"
kind: poc
layer: cross
workflow_phase: S4
scrum_type: design-spike
drive: be
status: confirmed
decision_outcome: confirmed
promotion_strategy: reuse-with-hardening
created: 2026-06-26
updated: 2026-06-26
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: aim
    slot_label: "AIM — version-up の入口条件設計 (Add-feature/Retrofit/archived との区別)"
  - role: tl
    slot_label: "TL (別 runtime=Codex) — mode 設計クロスレビュー + forward-convergence deferred 種別との整合"
  - role: po
    slot_label: "PO — version-up の正本化採否 (concept §2.5 / requirements / modes README、規範変更 = S4 gate)"
generates:
  - artifact_path: docs/plans/PLAN-DISCOVERY-09-version-up-mode.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - PLAN-DISCOVERY-01-workflow-metamodel
  references:
    - docs/plans/PLAN-DISCOVERY-08-forward-convergence-invariant.md
    - docs/plans/PLAN-L7-141-web-dashboard-component-derived.md
    - docs/plans/PLAN-L7-146-serverless-readonly-share.md
    - docs/plans/PLAN-L7-157-distribution-clean-pull.md
review_evidence:
  - reviewer: codex
    review_kind: cross_agent
    reviewed_at: "2026-06-26T15:30:00+09:00"
    tests_green_at: "2026-06-26T15:20:00+09:00"
    verdict: approve
    worker_model: claude-opus-4-8
    reviewer_model: gpt-5.5
    scope: "version-up 駆動モデル (frontmatter version_target = status=draft 限定 + ledger 照合 / forward-convergence の version-up-parked bucket / outstanding 分離 / UI 141/146 適用) を別 runtime (Codex gpt-5.5, role=tl) が desk review。verdict=APPROVE-WITH-CHANGES (Critical 0、証跡 .ut-tdd/review/cross-review-versionup-and-s4-failclose.md)。Critical (version_target status=draft 限定 / landing 除外禁止 / ledger label) 反映済。正本 back-merge = PLAN-REVERSE-140。"
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests/forward-convergence.test.ts (version-up parked + guards)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T15:20:00+09:00"
        evidence_path: tests/forward-convergence.test.ts
        output_digest: "sha256:f069920038d511eb8f00e6aaa1fa6fa223062f237b21e88085e7ba8f13e8e9d5"
      - kind: unit_test
        command: "bunx vitest run tests/outstanding.test.ts (active draft / version-up parked 分離)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T15:20:00+09:00"
        evidence_path: tests/outstanding.test.ts
        output_digest: "sha256:6cd0c414c6d50bff523e284608cc3df8640c4b0bc3b658f95fa1f87060600155"
---

# PLAN-DISCOVERY-09 (kind=poc): version-up 駆動モデル

## 0. Objective (PO 指示 2026-06-26)

PO 発話: 「駆動モデルでバージョンアップって駆動モデルを追加して欲しい。今回だと画面がバージョンアップの
対象として保全して、いまは入れないが、将来的に入れるを明示的にしておきたい。」

= **version-up** = 確立済/計画済の capability を **将来の製品バージョンへ保全 (preserve) する** 駆動モデル。
**いま Forward freeze / 配布スコープには入れない**が、**archived (破棄) ではなく将来版で必ず Forward へ入れる**
ことを **明示・機械追跡**する。第一ケース = 中央UI (画面、[[PLAN-L7-141]] / [[PLAN-L7-146]])。配布 ([[PLAN-L7-157]]
R2) は「画面なしで配布」なので、画面は version-up 対象として保全するのが正しい位置づけ。

## 1. Gap (なぜ既存 mode / 既存状態で足りないか)

| 既存 | なぜ version-up を表せないか |
|---|---|
| status=draft | 「作業中 (WIP)」と「将来版へ意図的保全」を弁別できない。今の UI 注記は draft + prose で曖昧 |
| status=archived | archived = 破棄。version-up は「将来必ず入れる」= 破棄ではない |
| Add-feature | 「いま」追加。version-up は「将来版で」追加 (時間軸が違う) |
| Retrofit | 依存/基盤の upgrade。製品機能の version 繰り延べではない |
| roadmap park (PARKED_BANDS) | band (層群) 単位。feature/PLAN 単位の「将来版保全」を表せない |

→ feature/PLAN 単位で「**deferred-but-committed-future**」を第一級・明示・機械追跡する mode が無い = gap。

## 2. 駆動モデル定義 (入口条件で他 mode と区別、最小 churn)

| 項目 | 内容 |
|---|---|
| mode | version-up |
| 入口 signal | `version_deferral` (PO 決定: ある capability を将来版へ保全。今スコープ外だが破棄しない) |
| kind | **新 kind を作らない**。保全中は当該 PLAN の既存 kind を維持 (例: impl) + status=draft + 明示マーカー |
| 明示マーカー | frontmatter `version_target: <label>` (例 `future` / `v2`)。これが「version-up 対象 = 将来版保全」の機械正本 |
| 保全 (保存) | design/PLAN artifact を**消さない** (archived にしない)。slot/設計は preserve |
| Forward 合流点 | **将来版 activation 時に add-feature (L2/L3 → L7) で Forward へ合流**。それまでは parked |
| forward-convergence との関係 | `version_target` 付き PLAN = 正当な **deferred (version-up) 種別**。未 landing なので unconverged-landed ではない。plain draft (WIP) とも archived とも区別して surface |
| outstanding との関係 | `ut-tdd status` で「active draft」と「version-up parked」を分離表示 (将来版保全を WIP と混同しない) |

- drive (専門職) = 対象 work を継承 (UI なら fe/fullstack)。出口 = 全 mode 共通の Forward 合流。
- 規範変更 (concept §2.5 mode 追加 / requirements / modes README 台帳 / signal routing) は **S4 ADOPT 後**に限る。

## 3. PoC 計画 (S2 build、最小スライス)

- 明示マーカー `version_target` の schema 受理 (frontmatter optional) + parse。
- `ut-tdd status` outstanding を「active draft / version-up parked」に分離集計 (report-only)。
- forward-convergence analyzer ([[PLAN-DISCOVERY-08]]) の deferred 判定に version-up を反映 (draft-deferred の内訳に version-up を明示)。
- modes README §2 台帳へ version-up 行追加は **S4 後** (規範)。本 spike は marker + 集計 + test に留める。

## 4. Acceptance Criteria (falsifiable / コマンド引用)

> status=draft (PoC 未実施)。下記は S2 で充足する目標。

- **AC-1**: `version_target` を持つ PLAN を status/outstanding が「version-up parked」として active draft と分離集計する (test)。
- **AC-2**: forward-convergence が version-up PLAN を unconverged-landed にせず deferred(version-up) として分類する (test)。
- **AC-3 UI 適用**: 中央UI [[PLAN-L7-141]] / [[PLAN-L7-146]] に `version_target` が付き「将来版保全」が明示される。
- **AC-4 無回帰**: `ut-tdd doctor` exit 0 / `bun run test` 全量 green / `ut-tdd plan lint` / biome / typecheck 通過。
- **AC-5**: クロスレビューで version-up が Add-feature/Retrofit/archived と非重複、forward-convergence と整合と支持される。

## 5. §工程表 schedule (並列/直列 明示、review step 必須)

| Step | 内容 | 並列/直列 | 直列理由 |
|------|------|-----------|----------|
| 1 | version-up 設計 + Codex クロスレビュー (本 PLAN draft の妥当性) | [直列] | downstream_dependency (設計確定が後続 marker/集計の前提) |
| 2 | `version_target` marker schema 受理 + parse + Red test 先行 | [直列] | downstream_dependency (marker が集計/分類の入力) |
| 3 | status outstanding 分離 + forward-convergence deferred 内訳 + test | [直列] | file_conflict (outstanding.ts / forward-convergence.ts 共有) |
| 4 | 検証 (typecheck / biome / vitest 全量 / doctor / plan lint) | [直列] | shared_state (HEAD 基準全量検証は Step2-3 着地後) |
| 5 | S4 decision → 正本 back-merge (concept §2.5 mode 追加 / requirements / modes README) + UI 141/146 を version-up 化 + `PLAN-REVERSE-*` 合流 | [直列] | downstream_dependency + PO gate (規範変更は concept/requirements 先行・PO サインオフ) |

## 6. S4 exit 条件

- AC-1〜AC-5 充足。クロスレビュー支持。
- S4 で正本化採否を PO 判断: ADOPT なら concept §2.5 (mode 追加) / requirements §1.3 (kind 据置・mode 追加) /
  modes README 台帳 / signal routing へ back-merge し、UI 141/146 を version-up 化、`PLAN-REVERSE-*` で合流。
- 規範変更は PO サインオフ前に書かない。

## 7. 壊さない / 再発させない

- **新 kind を増やさない** (taxonomy churn 回避)。version-up は mode + marker で表す。
- **archived と混同しない**: version-up は保全 (将来必ず Forward)。破棄ではない。
- **plain draft (WIP) と混同しない**: version-up は明示マーカー付き = 意図的将来保全。
- **forward-convergence と二重定義しない**: deferred 種別の単一正本を保つ ([[project_forward_convergence_invariant]])。
- **規範変更は PO gate**: concept/requirements/modes 本文は S4 ADOPT 後。
- **base = push 済 HEAD**。他ランタイム commit を破壊しない。
