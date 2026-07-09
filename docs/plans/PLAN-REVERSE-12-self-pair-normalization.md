---
plan_id: PLAN-REVERSE-12-self-pair-normalization
title: "PLAN-REVERSE-12 (reverse/normalization): self-pair 用語の正本正規化 — RECOVERY-09 の branch→main 合流 (概念用語集 / roadmap / L2 README / L4 function 整合)"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: normalization
drive: be
status: confirmed
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-07
updated: 2026-07-07
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-07T17:57:38+09:00"
    tests_green_at: "2026-07-07T17:54:04+09:00"
    verdict: approve
    scope: "self-pair 用語の正本正規化 (概念用語集 retired 化 + roadmap/L2 README/L4 function 訂正 + IMP/REVERSE-10 errata、歴史 cycle ログ不変)。code-reviewer (Sonnet、cross-runtime codex wrapper がプロバイダ auth でハングのため intra_runtime_subagent fallback) の初回 verdict=revise。Important 2 件を fix-forward で解消: (1) reverse/R4/fullback の過剰 backprop 機構が terminology 訂正に不釣合い → confirmed_reverse_type を normalization へ変更 (意味的にも rogue 用語の正規化で正確、fullback 専用 backprop_scope 要求を回避)。(2) DoD の完全性主張に持続的裏付けが無い → tests/self-pair-normative-guard.test.ts を新設し 4 正本の normative self-pair 再発を fail-close で検出 (PLAN claim discipline)。Minor (出所 citation 精度 / design_gap 多義性 / fallback 明記) も本文へ反映。tests_green_at は guard test 4 green の実走時刻、reviewed_at は fix-forward 後の doctor 検証時刻。"
    worker_model: claude-fable-5
    reviewer_model: claude-sonnet-5
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/self-pair-normative-guard.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T17:54:04+09:00"
        evidence_path: tests/self-pair-normative-guard.test.ts
        output_digest: "sha256:88beeda1f37fc4bf4cb5050827d6e4d3a872ca53a6a34e7fae6a38fd440b2439"
        anchor_commit: d7b9912a9b61240267ca341fe107699b931abdb9
      - kind: vmodel_lint
        command: "bun run src/cli.ts doctor (pair-freeze / test-design-naming)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T17:54:04+09:00"
        evidence_path: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
        output_digest: "sha256:4b2b5d9339dfcec8ee0ade8bfdb25706cd68840d3731565a1e03cf21b922ab12"
        anchor_commit: d7b9912a9b61240267ca341fe107699b931abdb9
      - kind: lint
        command: "bun run src/cli.ts plan lint docs/plans/PLAN-REVERSE-12-self-pair-normalization.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T17:54:04+09:00"
        evidence_path: docs/design/harness/L4-basic-design/function.md
        output_digest: "sha256:c13588c91c6a47e78832749643167fbab5f33b7dde7cccc043819ebfc4158192"
        anchor_commit: d7b9912a9b61240267ca341fe107699b931abdb9
owner: PM / PO
agent_slots:
  - role: tl
    slot_label: "TL — 正本正規化の範囲 (normative 訂正 vs 歴史ログ不変) と errata 双方向性のレビュー"
  - role: po
    slot_label: "PO — self-pair 撤去の正本反映 (概念用語集を含む) の確定サインオフ"
generates:
  - artifact_path: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L3-functional/roadmap.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L2-screen/README.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: tests/self-pair-normative-guard.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-RECOVERY-09-test-design-right-arm-placement.md
  references:
    - docs/plans/PLAN-REVERSE-10-vmodel-pair-lint.md
---

# PLAN-REVERSE-12 (reverse/normalization): self-pair 用語の正本正規化

## §0 位置づけ (出所必須)

出所 = **PLAN-RECOVERY-09**。RECOVERY-09 が機構 (vmodel pair-freeze lint の self / group-hub 分岐、
G2 mock gate) と L6 機能設計から無承認 self-pair 例外を撤去し、L2↔L10 の③正本 (L10 UX 検証テスト設計)
を新設した。本 Reverse はその訂正を**上位正本 (概念用語集 / roadmap / L2 README / L4 function) へ合流**
させる (branch→main 合流義務、internal-processing.md Appendix C.2b / function-spec.md Reverse 出所必須
invariant)。新規設計は追加せず、撤去済み事実を正本へ正規化するのみ (reuse-as-is)。

いきなり Reverse ではない: Recovery branch を出所とする合流であり、Reverse 出所必須 invariant を満たす。
本 `design_gap` は interrupt subtype ではなく top-level drift signal (route_mode=reverse)。

reverse type = **normalization** (rogue 用語 self-pair を正規形へ正規化。cross-layer 設計本体の
back-propagation は伴わないため fullback ではない。要件本文・L4/L5 設計本体は無変更)。

## §1 変更範囲 (normative 訂正 vs 歴史ログ不変)

**訂正する (normative = 現行規約を述べている箇所、本 PLAN の generates)**:

| 正本 | 訂正内容 |
|---|---|
| 概念用語集 (governance concept §10.3 `self-pair` 行) | **撤去済み用語**として retired 化 (定義を「PLAN-RECOVERY-09 で撤去、L2 sub-doc は L10 UX 検証テスト設計を直接参照、`pair_artifact: self` は ref-unresolved 孤児として fail-close」へ)。用語行は git 履歴検索用に残す |
| roadmap (L3-functional/roadmap.md、V-pair 表 L2⇔L10 行) | self-pair 記述を「L10 UX 検証テスト設計が③ (RECOVERY-09)」へ訂正 |
| L2 README (L2-screen/README.md、③ペア所在注記) | 「独立 test-design doc を作らない」を撤回し L10 ③ doc を正本と明記 |
| L4 function (L4-basic-design/function.md、screen-design 行) | `self-pair` セルを「③ = L10 UX 検証テスト設計 (RECOVERY-09 で撤去)」へ訂正 |

**訂正しない (歴史ログ = 履歴改ざん禁止、accepted-historical)**:

- roadmap の日付き改善 cycle ログ (`2026-06-04` サイクル記録)。当時の判断の記録であり事後改変しない。
  IMP 台帳と同様、誤りは errata 注記で前方参照する。

**errata 双方向 (silent 上書き禁止、非 design/governance 面のため generates 外)**:

- IMP-039 / IMP-058 / IMP-063 行 (improvement-backlog.md) に訂正注記 (RECOVERY-09/REVERSE-12 を後継として明記)。
- PLAN-REVERSE-10 §6 の self-pair 記述に撤回注記 (self-pair 部分のみ撤回、pair-freeze lint 本体は有効)。

## §2 再発防止 (falsifiable claim の持続的裏付け)

「正本の normative 面に self-pair が現行規約として再発しない」ことを一回性 grep でなく**永続 regression
test** で担保する (PLAN claim discipline、coding ≠ substance)。`tests/self-pair-normative-guard.test.ts`
が上記4正本を走査し、`self-pair` / `pair_artifact: self` の出現行が (a) retired 用語行 (b) errata /
撤去注記 (c) 日付き歴史ログ のいずれかに該当しなければ fail する。機構レベルの self 孤児化
(`tests/vmodel-pair.test.ts`) とは別レイヤー (prose 再発を検出)。

## §工程表

### Step 1: [直列] 概念用語集の self-pair retired 化
- 直列理由 = **file_conflict** (概念 doc を編集)。用語行を撤去済みへ書換。

### Step 2: [並列] 設計正本 3 箇所の normative 訂正 (roadmap / L2 README / L4 function)
- 並列理由 = 別ファイル・相互依存なし。self-pair 記述を L10 ③ doc 参照へ訂正。

### Step 3: [並列] errata 注記 + 永続 guard test
- 並列理由 = 別ファイル。IMP 台帳 / PLAN-REVERSE-10 へ前方参照注記 (歴史は書換えず注記のみ) +
  再発防止 test を追加。

### Step 4: [直列] review (intra_runtime_subagent / cross-runtime)
- 直列理由 = **downstream_dependency**。正本訂正の非矛盾・errata 双方向性・guard test 妥当性をレビュー。

## §実装計画 (手順・検証・rollback)

- **手順**: Step 1-3 を明示 path 編集 → guard test 追加 → `db rebuild`。歴史ログ行は touch しない。
- **検証 (fence)**: ① `doctor` full EXIT=0 / ② guard test green (`vitest run tests/self-pair-normative-guard.test.ts`) /
  ③ canonical normative 面で self-pair の**現行規約としての**記述が 0 (retired 行・歴史ログ・errata・機構
  コメントは除外) / ④ pair-freeze 50 pair 孤児 0 維持。cross-runtime 不可時は intra_runtime_subagent
  fallback とし review_evidence.scope へ記録する。
- **rollback**: 本 Reverse commit の単一 revert + `db rebuild`。

## §7 DoD

- [ ] 概念用語集 self-pair 行が retired 化され RECOVERY-09 を指す。
- [ ] roadmap / L2 README / L4 function の normative self-pair 記述が L10 ③ doc 参照へ訂正。
- [ ] IMP-039/058/063 + PLAN-REVERSE-10 に errata 前方参照注記 (双方向)。
- [ ] 歴史 cycle ログは不変 (書換え 0)。
- [ ] 再発防止 guard test (`tests/self-pair-normative-guard.test.ts`) が追加され fail-close する。
- [ ] review_evidence 記録 + `ut-tdd doctor` full green。
