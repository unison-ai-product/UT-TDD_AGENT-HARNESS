---
plan_id: PLAN-L4-29-security-design-substance
title: "PLAN-L4-29 (add-design): L4 security 設計の実体化 — 脅威モデル / 供給網 / 鍵・秘密 / 監査ログ + 非採用判断の明文化"
kind: add-design
layer: L4
sub_doc: security
drive: fullstack
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-13
updated: 2026-07-13
owner: PO / TL
parent_design: docs/plans/PLAN-L4-16-security-design-slot.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L9
agent_slots:
  - role: tl
    slot_label: "TL - 脅威モデル手法選定 (STRIDE 相当) と HARNESS 適用境界の設計判断"
  - role: se
    slot_label: "SE - 供給網 (依存/配布)・鍵/秘密ローテーション・監査ログ要件の設計"
  - role: qa
    slot_label: "QA - L9 security verification (ZIP-DOC-102 相当) への trace 接続"
generates:
  - artifact_path: docs/design/harness/L4-basic-design/security.md
    artifact_type: design_doc
  - artifact_path: docs/plans/PLAN-L4-29-security-design-substance.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L4-16-security-design-slot.md
  requires:
    - docs/plans/PLAN-L4-16-security-design-slot.md
    - docs/plans/PLAN-L6-62-design-doc-secret-scan-gate.md
  blocks: []
  references:
    - .ut-tdd/audit/A-187-vmodel-checked-zip-divergence-audit-2026-07-13.md
    - docs/governance/vmodel-document-disposition-catalog.md
    - docs/design/harness/L1-requirements/nfr.md
review_evidence:
  - reviewer: claude-blind-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-13T17:40:00+09:00"
    tests_green_at: "2026-07-13T17:33:00+09:00"
    verdict: approve
    scope: "Claude blind review (claim-blind / spec-blind 二 lane、author claim 秘匿、opus reviewer)。初回 FLAG 1 件 (§10 排他性文が行単位『一方のみ』と言い過ぎ、ZIP-DOC-057 の概念分解分類と字義矛盾) を概念単位分類の明文化で修正し、再判定で PASS (生存攻撃 0)。事実主張は全数実体照合 (src/secret.ts / analyzeSecretScan / checkReviewEvidence / foreign-edit-overrides.jsonl / nfr.md:73 / NFR-17 / ST-DATA-05)。orchestrator 検品で §5 欠番 renumber と §7.2 誤参照を起草段階で是正済み。Codex は L7-421/wave3 実装中のため cross_agent ではなく intra_runtime_subagent fallback を記録。"
    worker_model: claude-sonnet-5
    reviewer_model: claude-opus-4-8
    green_commands:
      - kind: lint
        command: "bun src/cli.ts plan lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-13T17:32:00+09:00"
        evidence_path: docs/plans/PLAN-L4-29-security-design-substance.md
        output_digest: "sha256:900445a04bdfad711fb1100f616771aa53458b84a4989137d672433dddee1ac9"
        anchor_commit: c873f7bc4943c79638ebf79679fe538e96e5166a
      - kind: doctor
        command: "bun src/cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-13T17:33:00+09:00"
        evidence_path: docs/design/harness/L4-basic-design/security.md
        output_digest: "sha256:49c777c9803b52db31f6ed72902a494c71f0ab2f231ed254c10ea170297f3849"
        anchor_commit: c873f7bc4943c79638ebf79679fe538e96e5166a
---

# PLAN-L4-29 (add-design): L4 security 設計の実体化

## 1. 問題 (A-187 §3)

PLAN-L4-16 は `security` slot の新設と正本 body 起票までを freeze したが、disposition catalog が
`docs/design/harness/L4-basic-design/security.md` へ merge すると宣言する ZIP-DOC-010 / 036 / 056 / 057 / 067
の中核概念のうち、以下が受け皿に存在しない:

- 体系的脅威モデル (STRIDE 相当)。escalation gate / AI runtime / hook 面を持つ HARNESS 自身への適用。
- 供給網セキュリティ (ZIP-DOC-056): 依存パッケージ監査・Pack 配布物の完全性。HARNESS は bun 依存と
  distribution 経路を実際に持つため製品境界外にできない。
- 鍵・秘密管理 (ZIP-DOC-057): rotation 方針の設計面 (L6-62 の scan 契約の上流)。
- 監査ログ要件: 何をいつどの粒度で記録するか (A-174 F-4 の部分被覆残)。

`nfr.md:73` の「詳細は L4 で確定」委譲が宣言のみで行き止まりになっており (A-187)、catalog の merge 宣言と
実体が乖離している。

## 2. 設計範囲

1. security.md へ脅威モデル節を追加する: 資産列挙 (docs/DB/hook/CLI/配布物)・脅威分類・対策 trace。
2. 供給網セキュリティ節: 依存監査 (lockfile/更新判断)・distribution preflight との接続。
3. 鍵・秘密の設計節: 非保持原則の明文化 + rotation / 漏えい時手順の設計 (L6-62 契約の上流固定)。
4. 監査ログ要件節: evidence/telemetry 記録の security 観点の要件。
5. 非採用の明文化: RBAC 権限マトリクス・KEK-DEK 階層・IdP プロビジョニング等、マルチテナント SaaS 前提の
   概念は HARNESS 製品境界で `not_applicable` とする判断理由を security.md と disposition catalog の双方に
   残す (silent gap を宣言済み判断へ変換する)。

## 3. 受入条件

- ZIP-DOC-010/036/056/057/067 の各中核概念が「security.md に設計実体がある」か「理由付き not_applicable」の
  いずれかへ排他的に分類され、宙吊り概念が 0 件である。
- 脅威モデル節は HARNESS の実資産を列挙し、各脅威が対策または受容判断へ trace する。
- L9 system-test-design の security verification (ZIP-DOC-102 相当) へ V-pair trace が接続される。
- `ut-tdd plan lint` / doctor green。

## 4. 降下先

L6 契約 (検出可能な security 検査の関数契約) と L7 gate は本 PLAN の freeze 後に後続起票する。
