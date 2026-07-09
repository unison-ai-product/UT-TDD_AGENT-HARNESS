---
plan_id: PLAN-L6-62-design-doc-secret-scan-gate
title: "PLAN-L6-62 (add-design): docs/design 横断 secret-scan ゲート + 資格情報ローテーション運用 (ZIP verify_files.py/package.py + 57 相当)"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-09
owner: PO / Codex
parent_design: docs/plans/PLAN-L4-16-security-design-slot.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-intra-runtime-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: 2026-07-09T14:39:36+09:00
    tests_green_at: 2026-07-09T14:39:36+09:00
    scope: "PLAN-L6-62。L4 security slot confirmed 後、L6 secret-scan 契約 / L7 oracle / doctor hard gate / distribution preflight の接続を確認。"
    verdict: approve
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\secret-scan.test.ts tests\\doctor-rule-quality.test.ts tests\\cli-surface.test.ts tests\\relation-graph.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: 2026-07-09T14:39:36+09:00
        evidence_path: tests/secret-scan.test.ts
        output_digest: "sha256:32714975273040a2215bb85f166194a44f8c463711ac551efbc908f5e82e019f"
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: 2026-07-09T14:39:36+09:00
        evidence_path: src/lint/secret-scan.ts
        output_digest: "sha256:32714975273040a2215bb85f166194a44f8c463711ac551efbc908f5e82e019f"
agent_slots:
  - role: tl
    slot_label: "TL - docs 横断 secret-scan ゲートの契約設計、既存 secret.ts (narrow guard) との境界確認"
  - role: se
    slot_label: "SE - AWS キー/秘密鍵ブロック/Bearer トークン/パスワード直書き検出パターン確定 + CI/CD 資格情報ローテーション運用の明文化"
generates:
  - artifact_path: docs/plans/PLAN-L6-62-design-doc-secret-scan-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/secret.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: src/lint/secret-scan.ts
    artifact_type: source_module
  - artifact_path: src/doctor/rule-quality.ts
    artifact_type: source_module
  - artifact_path: src/doctor/check-definition-groups.ts
    artifact_type: source_module
  - artifact_path: src/cli/distribution.ts
    artifact_type: source_module
  - artifact_path: tests/secret-scan.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L4-16-security-design-slot.md
  requires:
    - docs/plans/PLAN-L4-16-security-design-slot.md
  references:
    - docs/plans/PLAN-L4-16-security-design-slot.md
    - docs/design/harness/L6-function-design/secret.md
    - src/secret.ts
    - src/lint/readability.ts
    - src/cli/distribution.ts
    - .ut-tdd/audit/A-185-vmodel-docgen-reference-mining-2026-07-07.md
---

# PLAN-L6-62: docs/design 横断 secret-scan ゲート + 資格情報ローテーション運用

## Status

confirmed (2026-07-09)。`PLAN-L4-16` の L4 security slot confirmed を前提に、L6 `secret` contract、
L7 `U-DOCSECRET-*` oracle、doctor hard gate、distribution preflight へ降下した。

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

## 2. L6 freeze contract

`docs/design/harness/L6-function-design/secret.md` に以下を追加し、既存 narrow guard と広域 scanner を分離した。

| contract | responsibility | fail policy |
|---|---|---|
| `SECRET_PATTERN` / `isSecretLike` | memory / projection / audit / search 取り込み時の既知 prefix narrow guard | caller が永続化前に fail-close |
| `analyzeSecretScan` | docs / audit / handover / logs / memory / Pack 対象の横断 credential marker 検出 | violation>0 を fail-close |
| `loadSystemSecretScanArtifacts` | active prose/runtime state の scan band を収集 | vendor/archive は通常対象外 |
| `checkSecretScan` | doctor full profile の hard gate | repoRoot 不在・読込不能・violation を fail-close |
| distribution secret preflight | `sync-stage` / `sync-pack` / `package` の copy/prune/tar 前検査 | violation 時は materialize しない |

検出 marker は AWS access key、GitHub token、private key block、Bearer token、password / credential 直書き、
既存 narrow token family とする。dummy / placeholder / redacted / fixture / test-only が同一行に明示された
説明用 payload だけを例外扱いする。例外は実秘密値の保存許可ではなく、説明用であることを機械判定可能にする
記録である。

## 3. L7 oracle / implementation descent

`docs/test-design/harness/L7-unit-test-design.md` に `U-DOCSECRET-001..006` を追加し、以下を oracle 化した。

- pattern family の検出。
- dummy / placeholder 例外境界。
- path:line:marker message。
- `.ut-tdd/memory` を含む active runtime state の scan band。
- doctor hard gate。
- distribution materialize 前の fail-close。

実装は `src/lint/secret-scan.ts` を新設し、`src/doctor/rule-quality.ts` /
`src/doctor/check-definition-groups.ts` / `src/doctor/profiles.ts` に doctor hard gate として接続した。
配布は `src/cli/distribution.ts` の `sync-stage` / `sync-pack` / `package` で copy/prune/tar 前に
同じ scanner を走らせる。

## 4. 受け入れ条件 (design freeze 時)

- [x] `PLAN-L4-16` (security-design-slot) のセキュリティ slot confirmed が本 PLAN の前提条件であることを
  `requires` で明示した。
- [x] docs 横断 secret-scan の対象範囲・検出パターンを L6 `secret` sub-doc の非破壊拡張として固定した。
- [x] 配布直前 secret-scan ゲートの発火点 (`sync-stage` / `sync-pack` / `package` materialize 前) を明記した。
- [x] 資格情報ローテーションは設計 (方針明文化) のみが本 PLAN のスコープであり、実行は人間承認必須の
  別 runbook であることを明記した。
