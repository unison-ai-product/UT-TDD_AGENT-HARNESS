---
plan_id: PLAN-L5-12-externalization-by-design
title: "PLAN-L5-12 (add-design/internal-processing): 変動点外部化設計 (externalization by design) — C.2c を全設計 doc へ一般化した左肺義務 + 過大外部化防止の変動点判定基準 + 設計時 lint 契約"
kind: add-design
layer: L5
sub_doc: internal-processing
drive: be
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-07
updated: 2026-07-07
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-07T19:12:54+09:00"
    tests_green_at: "2026-07-07T19:11:44+09:00"
    verdict: approve
    scope: "変動点外部化設計 (C.7) = C.2c を全設計 doc へ一般化した左肺義務。過大外部化防止の判定基準・opt-out・設計時 lint 契約を code-reviewer (Sonnet、cross-runtime codex wrapper がプロバイダ auth でハングのため intra_runtime_subagent fallback) で検証。初回 verdict=revise (Critical 0 / Important 4)。全 4 件 fix-forward: (1) item④ が config 不在のみで version-up 穴 (registry キー欠落→fail-open) を閉じていない → 未知キー fail-close を必須要件化 + IT-EXT-05 回帰ガード追加。(2) 「発生源を潰す」が under-declaration に over-claim → 射程を『宣言された変動点のみ、見落としは TL 設計 gate レビューが最終防衛線』に精密化。(3) router 固有 doc 配置の discoverability gap → coding-rules.md へ C.7 相互参照追加。(4) opt-out の形骸理由が gameable → 4 類型への反証 + TL 承認 record 必須へ厳格化 + IT-EXT-03 更新。Minor 3 件 (L6 descent / 単一機械判定 / a-d 軸) も反映。tests_green_at は fix 後の doctor full exit 0 実走時刻。"
    worker_model: claude-fable-5
    reviewer_model: claude-sonnet-5
    green_commands:
      - kind: doctor
        command: "bun run src/cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-07T19:11:44+09:00"
        evidence_path: docs/design/harness/L5-detailed-design/internal-processing.md
        output_digest: "sha256:26e8caee84184b0f84e29922ca295de9eb1a46ebaa4ea50eff8b8fa9f49d522a"
        anchor_commit: 0803c5abfb646743717b3bf03b6996e3384392a8
      - kind: lint
        command: "bun run src/cli.ts plan lint docs/plans/PLAN-L5-12-externalization-by-design.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T19:11:44+09:00"
        evidence_path: docs/test-design/harness/L8-integration-test-design.md
        output_digest: "sha256:871c0c06c4f9c322ae4932df2a47164fdd869e32c7cf533b6dbb883c07f31d14"
        anchor_commit: 0803c5abfb646743717b3bf03b6996e3384392a8
owner: PM / PO
parent_design: docs/design/harness/L5-detailed-design/internal-processing.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL — 変動点判定基準の過不足 (過大外部化=speculative generality 防止 / 真の変動点の取りこぼし) と lint 契約の fail-close 妥当性レビュー"
  - role: se
    slot_label: "SE — C.7 節 (変動点表スキーマ + 判定基準 + opt-out + lint 契約) の詳細設計"
generates:
  - artifact_path: docs/plans/PLAN-L5-12-externalization-by-design.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/internal-processing.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
dependencies:
  parent: docs/plans/PLAN-L5-03-internal-processing.md
  requires: []
  references:
    - docs/plans/PLAN-L5-10-drive-model-router-redesign.md
    - docs/design/harness/L1-requirements/functional-requirements.md
    - docs/plans/PLAN-RECOVERY-09-test-design-right-arm-placement.md
    - docs/plans/PLAN-L4-17-version-up-design-bottomup-band.md
---

# PLAN-L5-12 (add-design): 変動点外部化設計 (externalization by design)

## Status

draft 起票 (2026-07-07、PO 指摘「変更や追加がありそうなものは、あらかじめ外部化の設計を設計書に内包
できるか。頻出パターンだ」)。C.2c (router 縛りルールの外部化) を **全設計 doc の変動点へ一般化**し、
観測性設計 (FR-L1-20) と同格の**左肺設計義務**として C.7 を追加する。

## 背景 — 頻出する retrofit 失敗モードの根絶

本 harness の作業で反復している高コスト失敗モード = 「変動点をハードコード → 後で痛い retrofit
(クロスレビュー + errata + Reverse 合流) で外部化」。実例:

- **self-pair**: pair 規約を lint に例外ハードコード → RECOVERY-09/REVERSE-12 で 3 commit の retrofit。
- **version-up / design-bottomup band**: `ROUTE_MODE_ALLOWED_KINDS` が add-feature のみハードコード →
  `if (!allowedKinds) return []` の穴 → PLAN-L4-17 で retrofit。mode→kind→layer は本質的に増える集合。
- 逆に**既に本標準を満たす例**: route-map override (`.ut-tdd/config/route-map.yaml`) / harness-db
  table registry (append で table 追加) / C.2c policy 外部化。

変動点を設計時に外部化しておけば、これらの retrofit は発生しなかった。本標準は**発生源**を潰す。

## 設計 — C.7 追加 (internal-processing、C.2c の一般化)

> **配置判断**: 左肺設計義務 (両肺原理 = internal-processing:180 / C.2c) の locus に合わせて Appendix C
> へ C.7 を置く。C.7 は router 固有でなく**全設計 doc への一般標準**である旨を節冒頭で明示する
> (将来 design-methodology 専用 doc を新設する場合は C.7 を移送する forward note を付す)。

1. **原理 (左肺義務)**: 変動点 (variation point / hotspot) = 変更・追加が頻出する箇所。これを設計時に
   外部化 (config / registry / policy) し、**外部化設計を設計 doc に内包**する。観測性設計と同格。
2. **変動点の判定基準 (過大外部化 = speculative generality / YAGNI の防止、PO caveat)**: 以下の
   いずれかに該当する箇所**のみ**を変動点として宣言する — (a) project/consumer ごとに異なる (policy)、
   (b) 種類が増える集合 (registry: mode/kind/gate/rule/view/adapter/table)、(c) 差し替え可能な実装
   (adapter/renderer)、(d) 閾値・語彙・対応表 (data-driven)。**該当しない (真に固定・単一実装・不変
   条件) は外部化しない** — 変動しないものの外部化は純損失 (間接化・config-drift 面の増大)。
3. **外部化設計の内容 (設計 doc に内包する変動点表)**: {何が変わるか / 外部化機構 (config schema・
   registry・policy hook) / 固定される契約・不変条件 / config 不在時の fail-close 既定}。
4. **理由付き opt-out**: 変動しないと判断した箇所は「非該当」を理由付きで明示 (無言の非外部化と区別、
   opt-out 一覧は doctor 出力に常時表示)。C.2c の opt-out 規約と同型。
5. **機械強制 (設計時 lint 契約、fail-close)**: 宣言された変動点に外部化設計 (config schema か registry
   参照) が無ければ**永続エラー** (C.2c「未作成は永続エラー」と同型、absence-blindness 根治)。lint の
   **実装は後続 add-impl (L7) の scope** (C.6 carry)。本 PLAN は標準 + lint 契約の設計まで。

## 非対象

- lint / config loader の**実装**は後続 add-impl (L7)。本 PLAN は C.7 標準 + lint 契約の設計。
- 既存ハードコード点の遡及的外部化は個別 retrofit (本標準は新規発生の予防。既存負債は別 PLAN)。
- design-methodology 専用 doc の新設判断は PO scope (現状は C.7 = Appendix C に置き forward note +
  coding-rules.md へ相互参照で discoverability を確保)。
- under-declaration (変動点の見落とし) は宣言駆動 lint では検出不能。設計 gate の TL レビュー (変動点
  判定基準での分類チェック) が最終防衛線であり、本 lint はそれを代替しない (over-claim 防止、cross-review 指摘)。

## §3 工程表

### Step 1: C.7 節 (原理 + 変動点判定基準 + 変動点表スキーマ) の設計 (SE) [直列]

internal-processing へ C.7 を追記 (file_conflict = 同ファイル)。判定基準が過大/過少にならないことを
重視。

### Step 2: opt-out 規約 + 設計時 lint 契約の設計 [直列]

Step 1 の変動点表を参照する lint 契約 (downstream_dependency)。C.2c/proposal-document-coverage の
shrinkage-guard・永続エラー パターンを踏襲。

### Step 3: ③ 結合テスト設計ペア (L8) 追補 [並列]

別 doc のため並列可。lint 契約の結合テスト設計 (変動点宣言あり×外部化なし→fail / opt-out→pass) を
GWT で L8 へ追加。

### Step 4: cross-runtime 設計レビュー (code-reviewer / codex) [直列]

判定基準の過不足・lint 契約の fail-close・C.2c との整合を別観点でレビュー (downstream_dependency)。

## §3.1 実装計画

internal-processing.md に C.7 (変動点外部化設計) 節を追記し、pair_artifact の L8-integration-test-design.md
に lint 契約の結合テスト設計を追加 → G5 詳細設計凍結 (L5↔L8 pair) → 後続 add-impl (L7) が設計時 lint
(変動点宣言×外部化設計の存在検査、fail-close) を実装する。判定基準は TL が過大外部化 (speculative
generality) と真の変動点取りこぼしの両面でレビューする。

## DoD / 受入基準

- [ ] internal-processing.md に C.7 (変動点外部化設計) があり、変動点判定基準 (4 該当類型 + 非該当は
      外部化しない) が明記される (過大外部化防止)。
- [ ] 変動点表スキーマ (何が変わる/機構/固定契約/config不在時fail-close) と理由付き opt-out 規約がある。
- [ ] 設計時 lint 契約 (変動点宣言×外部化設計不在→永続エラー、実装は add-impl carry) が明記される。
- [ ] pair_artifact (L8-integration-test-design.md) に lint 契約の③ペアがあり pair-freeze 孤児 0。
- [ ] cross-runtime レビュー (approve) が review_evidence に記録される。
- [ ] `ut-tdd plan lint` / `ut-tdd doctor` が green。
