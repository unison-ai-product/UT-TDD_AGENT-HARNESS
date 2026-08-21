---
memory_id: memory:project:issue-108-admission-audit-at-main-2f3f15af-gap-is-real-and-unmet-but-l6-89-not-implementation-admissible-plan-dod-only-scans-l7-plans-and-plan-l7-456-does-not-exist
kind: project
title: "Issue 108 admission audit at main 2f3f15af: gap is real and unmet, but L6-89 not implementation-admissible; plan-dod only scans L7 PLANs and PLAN-L7-456 does not exist"
tags: ["admission-audit", "exact-main", "flag", "issue-108", "plan-l6-89", "u-lvc"]
updated_at: 2026-08-19T11:11:25.161Z
---

Issue #108 (L 別設計検証契約) の Opus read-only admission 監査。exact main = 2f3f15af0e221deff792fc137c6fe2f6c61aad44。**verdict = 課題としては PASS (未充足の実在 gap であり superseded でも実装済みでもない) / 実装 admission は FLAG (blocking 3)**。luna は起動しない。編集 / 起票 / branch / PR / merge は一切していない。

## (1) #108 は今も未充足の gap である (AC 別の実測)

- AC-1 (requirements/concept/ADR へ design-verification contract を backprop): 未実装。
- AC-2 (L4↔L9 / L5↔L8 / L6↔L7 の pair schema 定義): 未確認部分あり。既存 vmodel pair lint は存在するが #108 が要求する「L 別検証契約の pair schema」としての正規化は無い。
- AC-3 (PLAN frontmatter へ verification_contract / proves / falsifies / evidence を正規化): **未実装**。`git grep "verification_contract\|proves\|falsifies" -- src/schema/` が **0 件**。
- AC-4 (unchecked DoD / orphan test / claim-only evidence / scope mismatch の Red oracle): **部分のみ**。`src/lint/plan-dod.ts` は unchecked DoD を confirmed/completed で fail-close するが、**走査対象が `/^PLAN-L7-.*\.md$/` に限定されており L0〜L6 設計 PLAN を見ていない**。#108 の要求は「L0〜L6 の各設計成果物」なので対象がずれている。さらに plan-dod は `## DoD|Definition of Done|完了条件` 節の checkbox を見るだけで、**DoD 項目から test/evidence ID への双方向 trace は行っていない** (実装に U- / oracle 突合が無い)。orphan test は oracle-test-trace が、evidence digest は PLAN-L7-420 (confirmed) が別途カバーする。
- AC-5 (PR #103 型「primitive Green だが bundle 未実装」を fixture で拒否): 未実装。
- AC-6 (Linux/Windows/aggregate + main post-merge gate Green): **部分**。`.github/workflows/harness-check.yml` は `on: push: branches: [main]` を持ち main 実行はあるが、これは PR と同一 gate であって #108 が要求する「merge 後に状態・証跡・設計契約を**再評価する** aggregate gate」ではない。
- AC-7 (cross-runtime blind review PASS): 前段未了のため未着手。

→ **superseded でも実装済みでもない。実在する未充足 gap。**

## (2) 所有と重複の写像

- **PLAN-L6-89-layer-verification-contract** (kind=add-design, status=**draft**, updated 2026-07-21, github_issue_id: 108, revision 3, admission_receipt v2 あり) が #108 の設計正本。`generates` は自 PLAN doc 1 件のみ、`review_evidence: []`、`next_pair_freeze: L7`。
- **PLAN-L6-89 は `supersedes: [PLAN-L6-72-forward-fsm-evidence-policy-contracts]` を宣言**。双方向 back-reference は成立している (PLAN-L6-72:66-71 に「訂正注記 (2026-07-21)」があり、`plan-supersession` gate は満たす)。
- **supersede の範囲は部分である**。L6-72 の注記は「本 PLAN の **evidence policy 契約部分**は PLAN-L6-89 が訂正・拡張する」「**Forward FSM 遷移契約 (`U-FSM-001..007` / `P-FSM-001`) は本 PLAN のまま存続する**」と明記。したがって FSM oracle の設計正本は L6-72 (confirmed) のままであり、evidence policy 契約の正本だけが L6-89 (draft) へ移っている。
- **PLAN-L7-419 との交差**: L7-419 の `parent_design` は PLAN-L6-72 であり、**部分 supersede の対象外側 (FSM 遷移契約) に正しく紐づいている**。よって L7-419 と #108 は**同じ L6-72 を親に持つが担当領域が分かれる**。ただし L7-419 が扱う evidence policy 側の要求 (typed EvidenceRecord) は L6-89 の守備範囲へ移っている点に注意。
- **PLAN-L7-450-test-traceability-detector-hardening** (confirmed, 2026-07-17) は検出器強化で、#108 の「設計契約を正本として検出器を生成・更新する」(要求 7) とは方向が逆 (検出器側の強化)。重複ではないが、#108 実装時に検出器の生成元をどちらにするかの整理が要る。
- **PLAN-L7-420-ci-strict-evidence-gates** (confirmed, 2026-07-21) は green-command-digest 不一致の CI 実効化で、#108 AC-4 の claim-only evidence 部分を既にカバーする。重複を避けるため #108 実装は L7-420 の gate を再実装せず参照すること。なお `docs/plans/` には `PLAN-L7-420-ci-strict-evidence-gates.md` と `PLAN-L7-420-vmodel-contract-compiler-registry.md` の **2 ファイルが同一 numeric core を持つ** (issue #145 の rekey debt に該当)。
- **active worktree / PR**: open PR は 0 件。#108 / L6-89 を担当する PR も worktree も観測されない。

## (3) 実装 admission が FLAG である理由 (blocking 3)

- **B-1 実装 PLAN が存在しない**: L6-89 が指す実装 target `PLAN-L7-456-layer-verification-contract-gates` は **main に存在しない** (`git ls-tree 2f3f15af docs/plans/` に該当なし)。`next_pair_freeze: L7` の対が未作成。
- **B-2 Red-freeze がゼロ**: `U-LVC` は docs/test-design/ にも tests/ にも **0 件**。#108 の AC-4 / AC-5 が要求する Red oracle が 1 本も登録されていない。件数ではなく存在自体が無い。
- **B-3 L6-89 自身が draft で review_evidence 空**: add-design であり、pair-freeze 前に実装へ降ろせない。

## (4) 最小の次 slice (docs-only、実装は停止)

**L7 pair-freeze を 1 本**。`src/` と `tests/` に触れない。

1. `PLAN-L7-456-layer-verification-contract-gates` を新規作成 (kind=add-impl、`requires: [PLAN-L6-89-...]` は L6-89 が draft のため**不可** — 先に L6-89 を confirm するか、`references` に置いて L6-89 confirm と同 PR で閉じるかを決める。plan-governance の requires_not_ready を踏まないこと。L6-89 の revision_note は過去に同じ理由で PLAN-L6-86 を requires から references へ移した前例がある)。
2. `docs/test-design/harness/L7-unit-test-design.md` へ **U-LVC candidate 群**を登録する。最小集合の提案 = `CANDIDATE-U-LVC-001` unchecked DoD を持つ **L0〜L6** 設計 PLAN の confirmed 昇格が fail-close する (plan-dod の L7 限定を超える点が新規性)、`-002` DoD 項目から test/evidence ID への双方向 trace 欠落を検出する、`-003` coverage scope mismatch (部分実装 Green の上位昇格) を PR #103 型 fixture で拒否する、`-004` claim-only evidence を拒否する (PLAN-L7-420 の既存 gate を再実装せず参照で満たす場合はその旨を候補に明記)、`-005` main post-merge の aggregate 再評価が PR gate と別判定を返す。各候補に Red 入力と期待結果を書き、件数を証拠にしない。
3. `verification_contract` / `proves` / `falsifies` / `evidence` の frontmatter 正規化案 (schema 変更は次 slice)。
4. Reverse 対の要否を確定する: kind=add-impl なら Reverse 対必須。`PLAN-REVERSE-456` を同時に起票するか、`backprop_decision: not_required` + 理由を書くか。
5. `generates` に `src/**` を先行宣言しない (実装 commit と同一 commit で昇格)。特に `src/lint/plan-dod.ts` は既存 owner を数えてから宣言すること (2 件目かつ ownership baseline 非登録なら duplicate-artifact-ownership が即赤化する)。

**luna worker 契約は出さない**。B-1〜B-3 が閉じるまで実装は起動しない。次の依存は「上記 docs-only PR が exact HEAD CI green + Claude 非著者 closing PASS で main へ到達すること」。

## 攻撃観点の記録

claim-blind: 「L6-89 が L6-72 を supersede した」という記述を鵜呑みにせず back-reference 本文を読み、**部分 supersede (evidence policy のみ、FSM 遷移契約は L6-72 存続)** であることを確認した。これにより L7-419 の parent_design=L6-72 が誤りでないと判定できた。spec-blind: 「unchecked DoD gate は既にある」という一般論を plan-dod.ts の実装で検証し、**走査対象が PLAN-L7-* に限定**されていて #108 の対象 (L0〜L6) を外していることを検出した。prose と test 件数を証拠にしていない。
