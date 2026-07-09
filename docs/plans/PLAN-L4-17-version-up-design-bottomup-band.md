---
plan_id: PLAN-L4-17-version-up-design-bottomup-band
title: "PLAN-L4-17 (add-design/function): 拡張2 mode (design-bottomup / version-up) を L4 §3.1 外部設計へ back-fill — route-map 実在 mode の SSoT 正本化 (L5-10 C.2 暫定 band 消化)"
kind: add-design
layer: L4
sub_doc: function
drive: be
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-07
updated: 2026-07-07
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-07T18:37:01+09:00"
    tests_green_at: "2026-07-07T18:36:43+09:00"
    verdict: approve
    scope: "拡張2 mode (design-bottomup / version-up) の L4 §3.1 外部設計 back-fill。route-map token 一致・L5-10 C.2 暫定 band 一致・出口 Forward 合流先の妥当性を code-reviewer (Sonnet、cross-runtime codex wrapper がプロバイダ auth でハングのため intra_runtime_subagent fallback) で検証。初回 verdict=revise。Important 2 件を fix-forward: (1) §3.1 を 11 種にしたのに §3 見出し・前文・taxonomy コールアウトが「9」のまま自己矛盾 → §3 全体のカウント表記を 11 へ統一し design-bottomup/version-up を列挙 (concept §10.3 用語集 11 種と一致)、工程表 Step 1 へ再発防止として明示。(2) references の PLAN-DISCOVERY-08-discovery-metamodel.md が dangling (実在は PLAN-REVERSE-08-discovery-metamodel.md) → 修正。Critical 0 (route-map token 完全一致・C.2 band 一致は確認済)。tests_green_at は fix 後の doctor full exit 0 実走時刻。"
    worker_model: claude-fable-5
    reviewer_model: claude-sonnet-5
    green_commands:
      - kind: doctor
        command: "bun run src/cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-07T18:36:43+09:00"
        evidence_path: docs/design/harness/L4-basic-design/function.md
        output_digest: "sha256:e8a9e964e364cfb393e853cd56f38b7b285bcb7197ac35cbc27957f15887c6e3"
      - kind: lint
        command: "bun run src/cli.ts plan lint docs/plans/PLAN-L4-17-version-up-design-bottomup-band.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T18:36:43+09:00"
        evidence_path: docs/test-design/harness/L9-system-test-design.md
        output_digest: "sha256:7889ed4c9419179f2ed3c20d514c849ab162fae5bee8323087b4f6797eaa8419"
owner: PM / PO
parent_design: docs/design/harness/L4-basic-design/function.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL — 2 mode の入口 signal / 状態遷移 / 出口合流先 / layer band の L5-10 C.2 暫定表との一致レビュー"
  - role: se
    slot_label: "SE — §3.1 表 + §3.2 routing 表への 2 mode 追記 (route-map 実装との token 一致)"
generates:
  - artifact_path: docs/plans/PLAN-L4-17-version-up-design-bottomup-band.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L9-system-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L9
dependencies:
  parent: docs/plans/PLAN-L4-00-master.md
  requires: []
  references:
    - docs/plans/PLAN-DISCOVERY-07-design-bottomup-mode.md
    - docs/plans/PLAN-REVERSE-08-discovery-metamodel.md
    - docs/plans/PLAN-L5-10-drive-model-router-redesign.md
    - src/schema/route-map.ts
---

# PLAN-L4-17 (add-design): 拡張2 mode の L4 §3.1 外部設計 back-fill

## Status

draft 起票 (2026-07-07)。PLAN-L5-10 C.2 の carry「design-bottomup / version-up の L4 §3.1 外部設計
back-fill」の消化。両 mode は route-map 実装 (`ROUTE_SIGNAL_MAP`) に実在し、feasibility は
DISCOVERY-07/08 で confirmed 済だが、L4 §3.1 の駆動モデル外部設計表 (9 種) に未掲載 = SSoT 欠落。
L5-10 は暫定 band で fail-close していたが「正本性は L4 back-fill 完了で完成する」と明示していた。
本 PLAN で L4 §3.1 を 11 種に拡張し、その約束を果たす。

## 背景 — なぜ version-up 起票が今できないか

router 決定表 (L5-10 C.2) は「single source = L4 §3.1」を不変条件とする。version-up は route-map で
mode 解決されるが L4 §3.1 に無いため、`ROUTE_MODE_ALLOWED_KINDS` へ正式登録できず、version-up 駆動の
PLAN が正しい kind/layer band で起票できない (実装は後続 add-impl だが、その前提の外部設計正本が本 PLAN)。

## 設計 — L4 §3.1 追記 (function-spec 外部設計)

DISCOVERY-07/08 と route-map、L5-10 C.2 暫定 band から確定する 2 mode を §3.1 表 (6 列同型) と §3.2
routing 表 (固有 signal、rank=—) へ追加する。

1. **design-bottomup (画面後付け駆動)**: 既存 backend から FE 要件を洗い出す (DISCOVERY-07 で確立)。
   - kind: add-design + add-impl (内包、Add-feature 同型)。
   - 入口 signal: `screen_addition_to_backend` / `design_bottomup` / `backend_derived_screen` /
     `add_ui_to_backend`。
   - 状態遷移: backend から FE 要件 elicitation (Discovery 合成再利用) → mock 具体化 (L2 screen 系
     sub_doc) → add-design (L2-L6、parent 必須) → add-impl (L7、parent 必須)。
   - 出口 → Forward 合流: **add-design L2-L6 (screen 系 sub_doc) / add-impl L7**。要件 (L1/L3) は
     bottom-up 後追いで Reverse back-fill。
   - gate: G2 (screen pair freeze) / add-impl G7 孤児0 / PO (elicitation 採否)。
2. **version-up (後送要件駆動)**: 現バージョンで後送した要件を次バージョンで着手 (deferral 台帳)。
   - kind: add-design。
   - 入口 signal: `version_deferral` / `version-up` / `version_up` / `future_version`。
   - 状態遷移: 後送要件を deferral 台帳へ記録 → 次バージョン着手時に add-feature 決定表へ合流 →
     add-design (L3-L6)。
   - 出口 → Forward 合流: **add-design L3-L6**。着手時に add-feature と同型化。
   - gate: 着手時 add-feature の G7。deferral 記録の台帳 lint 化は carry。
3. **§3.1 見出し「9 種」→「11 種」** + §3.2 routing 表へ 2 固有 signal 行 + 「能動 mode」列挙へ 2 mode 追加。

## 非対象

- `ROUTE_MODE_ALLOWED_KINDS` / `ALLOWED_LAYER_BY_KIND` への 2 mode 実装登録は後続 add-impl (L7) の scope
  (L5-10 C.6 carry)。本 PLAN は外部設計正本のみ。
- deferral 台帳の lint 化は version-up 着手時の別 carry。
- L5-10 internal-processing の暫定 note は歴史的に正確 (「暫定 until L4 back-fill」) なため書き換えない。
  本 PLAN が carry を果たしたことは本 PLAN と L4 §3.1 の掲載で追跡可能。

## §3 工程表

### Step 1: §3.1 表へ 2 mode 追記 + §3 全体のカウント表記統一 (SE) [直列]

function.md §3.1 を編集 (file_conflict = 同ファイル)。route-map token と一致させる。**§3.1 表だけでなく
§3 見出し・前文・mode taxonomy コールアウトの「9 駆動モデル / 9 mode spike / entry mode 9 種」を
すべて「11」へ統一**し、同一節内の数値矛盾を残さない (concept §10.3 用語集 11 種と一致させる)。

### Step 2: §3.2 routing 表 + 能動 mode 列挙の更新 [直列]

Step 1 と同ファイル (file_conflict)。固有 signal 2 行 + 「他の駆動モデル」列挙へ追加。

### Step 3: L9 ③ ペア (system-test-design) 追補 [並列]

別 doc のため並列可。2 mode の mode-entry→exit-Forward合流 の受入を GWT で L9 へ追加。

### Step 4: cross-runtime 設計レビュー (code-reviewer / codex) [直列]

L5-10 C.2 暫定 band との一致・route-map token 整合・Forward 合流先の妥当性をレビュー
(downstream_dependency)。

## §3.1 実装計画

function.md §3.1 表 (6 列同型) と §3.2 routing 表へ design-bottomup / version-up を追記し、見出しを
「11 種」へ更新 → pair_artifact の L9-system-test-design.md に ST-FUNC-08/09 (2 mode の
mode-entry→exit-Forward合流 を GWT で) を追加 → G4 基本設計凍結 (L4↔L9 pair)。route-map token
(`src/schema/route-map.ts`) との一致を SE が突合し、L5-10 C.2 暫定 band と入口 signal / layer band が
一致することを TL がレビューする。実装 (`ROUTE_MODE_ALLOWED_KINDS` 登録) は後続 add-impl (L7)。

## DoD / 受入基準

- [ ] function.md §3.1 に design-bottomup / version-up が 6 列同型で追記され、見出しが「11 種」。
- [ ] §3.2 routing 表に 2 固有 signal 行があり route-map token (`src/schema/route-map.ts`) と一致。
- [ ] pair_artifact (L9-system-test-design.md) に 2 mode の③ペアがあり pair-freeze 孤児 0。
- [ ] 2 mode の入口 signal / layer band が L5-10 C.2 暫定表と一致 (SSoT 正本化)。
- [ ] cross-runtime レビュー (approve) が review_evidence に記録される。
- [ ] `ut-tdd plan lint` / `ut-tdd doctor` が green。
