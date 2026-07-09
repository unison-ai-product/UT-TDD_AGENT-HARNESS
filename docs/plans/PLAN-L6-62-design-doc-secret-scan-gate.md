---
plan_id: PLAN-L6-62-design-doc-secret-scan-gate
title: "PLAN-L6-62 (add-design): docs/design 横断 secret-scan ゲート + 資格情報ローテーション運用 (ZIP verify_files.py/package.py + 57 相当)"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / Codex
parent_design: docs/plans/PLAN-L4-16-security-design-slot.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - docs 横断 secret-scan ゲートの契約設計、既存 secret.ts (narrow guard) との境界確認"
  - role: se
    slot_label: "SE - AWS キー/秘密鍵ブロック/Bearer トークン/パスワード直書き検出パターン確定 + CI/CD 資格情報ローテーション運用の明文化"
generates:
  - artifact_path: docs/plans/PLAN-L6-62-design-doc-secret-scan-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L4-16-security-design-slot.md
  requires:
    - docs/plans/PLAN-L4-16-security-design-slot.md
  references:
    - docs/plans/PLAN-L4-16-security-design-slot.md
    - docs/design/harness/L6-function-design/secret.md
    - src/secret.ts
    - src/lint/readability.ts
    - src/setup/distribution.ts
    - .ut-tdd/audit/A-185-vmodel-docgen-reference-mining-2026-07-07.md
---

# PLAN-L6-62: docs/design 横断 secret-scan ゲート + 資格情報ローテーション運用

## 0. 背景 (ZIP 再監査 2026-07-08、advisor 相談済み、PO 指示による起票)

`docs/design/harness/L6-function-design/secret.md` は既に「本 module は網羅的 credential scanner では
ない。既知 prefix の narrow guard として使い、広範な検出は別 scanner の責務とする」と自己の scope 境界を
明記している。ZIP `verify_files.py` はテキスト UTF-8 検証・置換文字検出・YAML 破損検出に加え、
**AWS キー/GitHub トークン/秘密鍵ブロック/Bearer トークン/パスワード直書きの横断検出**を持つ。
UT-TDD 側の `src/secret.ts` (`isSecretLike`) は特定トークン形式 (`sk-`/`ghp_`/`github_pat_`/`xox`) のみで
状態 DB/memory/audit/search 取り込み時の狭いガードに限定され、`docs/design/` 配下を横断走査する用途では
未使用と裏取り済み。

また ZIP `package.py` は配布 zip 生成直後に `verify_files` の zip 検査を自動実行する (配布直前の
自動 secret-scan)。UT-TDD 側 `src/setup/distribution.ts` (`ut-tdd distribution sync-pack`) には対応する
配布直前 secret-scan が無い。ZIP `57_シークレット鍵管理設計書` のうち UT-TDD 自身に関連する部分
(KMS/テナント鍵ではなく CI/CD 資格情報・API キーのローテーション運用) も本 PLAN のスコープに含める。

## 1. 設計スコープ

1. `docs/design/`・`docs/plans/` 等ドキュメントツリー全体を横断する secret-scan ゲート (AWS キー・
   秘密鍵ブロック・Bearer トークン・パスワード直書き検出) を、既存 `secret.ts` の narrow guard とは
   別レイヤーとして設計する。
2. `ut-tdd distribution sync-pack` 実行前に自動発火する secret-scan ゲートを設計する。
3. CI/CD 資格情報・API キーのローテーション運用方針 (頻度・手順・記録先) を governance へ明文化する
   経路を設計する。**設計する範囲は方針の明文化のみ**であり、実際のローテーション実行 (鍵の失効・
   再発行) は本 PLAN の scope 外、人間承認を要する別 runbook とする。

## 2. 受け入れ条件 (design freeze 時)

- `PLAN-L4-16` (security-design-slot) のセキュリティ slot 確定が本 PLAN の前提条件であることが
  `requires` で明示される。`L4-16` が不採択となった場合の fallback (親設計の代替先) を design freeze
  時に確定する。
- docs 横断 secret-scan の対象範囲・検出パターンが L6 `secret` sub-doc の非破壊拡張として固定される。
- 配布直前 secret-scan ゲートの発火点 (`sync-pack` 前) が明記される。
- 資格情報ローテーションは設計 (方針明文化) のみが本 PLAN のスコープであり、実行は人間承認必須の
  別 runbook であることが明記される。
