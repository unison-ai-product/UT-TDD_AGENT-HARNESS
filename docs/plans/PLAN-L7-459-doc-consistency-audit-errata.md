---
plan_id: PLAN-L7-459-doc-consistency-audit-errata
title: "PLAN-L7-459: 2026-07-22 ドキュメント整合性監査 errata 一括是正 (用語不整合・相反記述)"
kind: troubleshoot
layer: L7
drive: fullstack
status: confirmed
created: 2026-07-22
updated: 2026-07-22
owner: Claude
backprop_decision: not_required
backprop_decision_reason: "本 PLAN は 2026-07-22 全ドキュメント監査で検出した stale prose / 誤参照 / 表記矛盾の errata 一括是正であり、対象の design/governance/test-design doc 自体が是正先 SSoT である。要件・設計の意味変更は含まず (schema/実装は全件 ground truth として正、doc 側のみ追従)、上流 backprop は発生しない。"
agent_slots:
  - role: tl
    slot_label: "TL - errata 是正の網羅確認と confirmed doc への correction note 規律検証"
generates:
  - artifact_path: docs/plans/PLAN-L7-459-doc-consistency-audit-errata.md
    artifact_type: markdown_doc
  - artifact_path: CLAUDE.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/README.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/gate-design.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-agent-contracts.md
    artifact_type: markdown_doc
  - artifact_path: docs/process/README.md
    artifact_type: markdown_doc
  - artifact_path: docs/process/modes/refactor.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L2-screen/screen-list.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L2-screen/screen-flow.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L2-screen/ui-element.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L2-screen/wireframe.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L3-functional/README.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/fr-unit-coverage.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L1-requirements/screen-requirements.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L1-requirements/technical-requirements.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L14-operational-test-design.md
    artifact_type: test_design
  - artifact_path: docs/governance/harness-v2-update-strategy.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/reverse-fullback-backprop-audit-2026-06-22.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/conditional-backfill-decision-audit-2026-06-22.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L3-functional/roadmap.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/secret.md
    artifact_type: design_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-89-plan-errata-supersession-gate.md
review_evidence:
  - reviewer: codex-blind-reviewer
    review_kind: cross_provider
    reviewed_at: "2026-07-22T20:10:00+09:00"
    tests_green_at: "2026-07-22T20:10:00+09:00"
    verdict: pass
    scope: "PLAN-L7-459 errata batch (commit d7dcc320, 24 files)。blind review 判定 PASS: ground truth 整合 (VALID_SUB_DOCS/VALID_DRIVES/checkRosterConsistency fail-close)、correction note 規律、FR-L1-16 再マッピングの意味整合 (analyzeL6FrCoverage 51/51 green)、機械ゲート 5 種 green を reviewer 自走で実測。攻撃試行 (self-pair 残存/再誤配線/prose 逆転/無注記上書き) は全て反駁済。"
    worker_model: claude-sonnet-5
    reviewer_model: gpt-5.6-sol
    green_commands:
      - kind: lint
        command: "bun src/cli.ts plan lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-22T20:10:00+09:00"
        evidence_path: docs/plans/PLAN-L7-459-doc-consistency-audit-errata.md
        anchor_commit: d7dcc32017418e5ab465072bd249641c0f04c490
---

# PLAN-L7-459: 2026-07-22 ドキュメント整合性監査 errata 一括是正

> **採番注記 (2026-07-27)**: 本 PLAN は当初 `PLAN-L7-453` として起票したが、同一連番を
> PR #106 (`PLAN-L7-453-snapshot-runner-root-guard`) と PR #125
> (`PLAN-L7-453-provider-execution-receipt-contract`) が並行に確保しており、prose 内の
> 「PLAN-L7-453」参照が merge 後に多義化する。連番の先取りは PR #106 (最先着) を正とし、
> 本 PLAN を `PLAN-L7-459` へ改番した。内容・review evidence の対象成果物は不変
> (改番前 commit `d7dcc320` / `db8d01bc`)。連番衝突が機械検出されない構造欠陥
> (`plan lint` の `duplicate_plan_id` は plan_id 全文一致のみ判定) は別途 Issue 起票。

## 背景

PO 指示 (2026-07-22) による全ドキュメント監査 (governance 41 / adr 8 / process 24 /
design 58 / test-design 8 = 139 doc 全文精読、plans 819 件は機械ゲート + サンプリング) で
用語不整合・相反記述 24 件を検出した。Fable advisor (claude-fable-5、`ut-tdd advisor`) の
triage と、`src/schema/index.ts` / `src/assets/catalog.ts` / `src/lint/l6-fr-coverage.ts` の
実装 ground truth 裏取りを経て、mechanical fix 群を本 PLAN で一括是正する。

方針: **実装/schema は全件正しい** (VALID_SUB_DOCS / VALID_DRIVES / roster fail-close は
検証済み)。是正は doc 側の stale prose / 誤参照 / 表記矛盾のみ。confirmed doc への修正は
silent overwrite せず、該当箇所に correction note (本 PLAN ID 引用) を残す。

## 是正項目 (DoD)

### High

- [x] **H1 読み順統一**: `repository-structure.md` §1 の governance 中核 5 点定義を裁定と
      し、root `CLAUDE.md` Read Order へ `repository-structure.md` を追加、
      `docs/governance/README.md` 「現行の正本」へ `extraction-plan_v0.1.md` を復元 +
      番号重複 (7 が 2 回) を修正。vmodel-* 4 doc は「V-model 機構正本 (中核 5 点への追加
      読み)」として区分を明示。
- [x] **H2 VMS-008/009 二重所有**: `vmodel-agent-contracts.md` VAGENT-002 と VAGENT-004 の
      `defines` 重複を単一所有へ再割当 (typed-spec-definitions.md §4 不変条件準拠)。
- [x] **H3 stale skill パス**: `docs/process/modes/refactor.md:22` の `docs/skills/refactoring.md`
      を `skills/refactoring.md` へ訂正 (ADR-004 訂正注記へ追従)。confirmed 済 PLAN 21 件の
      同種残存は歴史記録として不変更 (errata 規律)。
- [x] **H4 L2 self-pair 残存**: L2-screen 4 doc (screen-list / screen-flow / ui-element /
      wireframe) の本文中 self-pair 断定記述 (「本 mock 自体が③ペア」等) を
      PLAN-RECOVERY-09 後の frontmatter (`pair_artifact` = L10-ux-validation-test-design.md)
      準拠へ是正。
- [x] **H5 L3 README stale**: `L3-functional/README.md` の「L3 では screen sub-doc を起こさ
      ない」宣言と 3 件表を、`screen-functional.md` (schema 登録済 sub_doc) を含む 4 件へ
      更新。`roadmap.md` §6 の「enum 3 種」記述も同時訂正。
- [x] **H6 roster nameMismatch**: `L5-detailed-design/module-decomposition.md` §5 の
      「nameMismatch WARN」を実装実挙動 (fail-close / exit 1、`src/assets/catalog.ts`) に
      合わせ訂正。internal-processing.md の DbC が正。
- [x] **H7 L5 sub_doc 一覧**: `physical-data.md` §3 の VALID_SUB_DOCS L5 snippet へ
      `ui-detail` を追補 (schema 実体 5 件と一致させる)。
- [x] **H8 FR-L1-16 再マッピング**: `fr-unit-coverage.md:54` の FR-L1-16 行を
      forced-stop-feedback.md から、既存の本番障害機構 (function-spec.md 失敗 routing 全順序
      Incident > Recovery > Reverse > Refactor / `docs/process/modes/incident.md`) へ付け替え。
      再マッピング後 `analyzeL6FrCoverage` を再実行し green を確認。なお欠落が残る場合のみ
      後継 PLAN を起票 (現時点の検証では設計実体は存在、参照誤りのみ)。

### Medium (mechanical)

- [x] **M1**: `gate-design.md` §1 G2 行の「FR-13 未定義 defer 中」を §2 台帳 (PO サインオフ
      2026-06-22 PASS) と同期。
- [x] **M4**: `harness-v2-update-strategy.md` Wave 2 の PLAN-L7-303 行へ
      `version-up-route-debt-2026-07-10.md` (landed / immutable legacy debt) への
      cross-reference note を追記 (双方向化)。
- [x] **M6**: `docs/process/README.md` へ「plan-asset-v2.md / design-detection-self-proof.md
      は ADR-008 (Proposed) 付随の draft であり正本化済宣言の対象外」を明記。
- [x] **M7**: `L1-requirements/screen-requirements.md` / `L2-screen/ui-element.md` の HM-01
      「FR-L1 47 件」を 51 件 (functional-requirements.md 確定値) へ更新 (`src/web` 未実装
      につき doc のみ)。
- [x] **M8**: `L1-requirements/technical-requirements.md` の「DB は L2/L4 で検討」を
      `.ut-tdd/harness.db` 採用済 (functional-requirements.md / L4 data.md 準拠) へ更新。
- [x] **M10**: `L4-basic-design/data.md` §10 の `drive: ...|normal` から `normal` を除去
      (schema VALID_DRIVES 5 種と一致、検証済)。
- [x] **M13 NFR-02 帰属**: `L14-operational-test-design.md:158` の「L4↔L9 pair で被覆」を
      「L4 carry (L12 AT-NFR-02 として lift)」へ訂正 (L9 の scope 自己宣言 :78 と L12 carry
      台帳に整合、L14:156 の自記述とも一致)。
- [x] **Low ついで**: `module-decomposition.md` の Appendix B 見出し重複を解消 (B/C へ改番)。

### TL 判断で処理 (本 PLAN 内、軽微)

- [x] **M2**: `docs/governance/README.md` へ「『正本』の 2 用法 (repo 全体の必読 canonical 集合
      vs 各 doc の domain 内 SSoT 自己宣言) は両立し、後者は前者を上書きしない」旨の用語注記を
      1 文追加。
- [x] **M12**: `L6-function-design/secret.md` §1 へ「session-log.sanitize() は循環依存回避の
      独立実装 (意図的非共有)」を明記、または統合を refactor 候補として登録。

### 対象外 (本 PLAN で扱わない、記録のみ)

- **M5** (backprop_scope vs backprop_decision): 姉妹機構である旨の note は両 audit doc へ
  追記するが統合はしない。
- **M9** (WCAG 2.1→2.2): 既存 follow-up PLAN 動線があるため out-of-band 修正しない
  (着手繰上げを推奨するに留める)。
- **M11** (analyzeReviewEvidence result shape 統合): contract-compiler 系 PLAN (L7-420 等) の
  入力になるため、統合形は当該 PLAN 側で確定する。
- **M3** (disposition catalog パス表記): 現状機械解決されておらず不活性。resolver 実装時に
  正規化する (当該 PLAN の AC へ委譲)。
- **doctor 拡張 gap**: 「同一 typed-spec ID の複数 doc 所有を機械検出する仕組みの不在」(H2 の
  根因) と「l6-fr-coverage の意味整合非検証」(H8 の根因) は別途 gap 起票候補。

## 検証

- `ut-tdd plan lint` green。
- `analyzeL6FrCoverage` 再実行で FR-L1-16 再マッピング後も ok (H8)。
- `checkSubDocCatalogDrift` / `checkModuleDrift` / `checkAssetDrift` / `checkPlanSupersession`
  green 維持 (是正が既存機械ゲートを破らないこと)。
- 監査で挙げた各行番号の記述が是正後に消滅していることを grep で確認。
