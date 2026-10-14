# PLAN → 設計文書 還流証跡 (slice backflow-s6c、issue #958)

目的: L6 後半 35 PLAN について、使い捨てられないもの (未達 DoD・carry・実在する依存・PLAN にしか無い oracle・責務の範囲) を設計文書へ還流し、区分を決める。
基準 commit: `d5ad67fb50c148ea8dd6d5475bab4b88f2d4cd4c` (origin/main)。

処理済み: 8 / 35 件。

## 件数 (区分ごと、処理済み分)

- 使い捨て可: 0 件
- 還流済み: 8 件
- 廃止: 0 件
- 要判断: 0 件

## 本体

| PLAN | blob sha256 (origin/main) | 区分 | 移し先 (path と節) | 剥離した依存 | 備考 |
|---|---|---|---|---|---|
| `PLAN-L6-82-universal-pr-trigger-contract.md` | `0f4b7744f3f1e04c30e0c737a7cafd97b92f6af9343ee1b8feb2acc888310d76` | 還流済み | docs/design/harness/L6-function-design/ci-verification-contracts.md §1 | なし | 契約 5 項は設計に無く還流。oracle は L7-unit-test-design の U-CIPOL-001..012 に既存。実装 PLAN-L7-434 は confirmed |
| `PLAN-L6-83-forward-escape-issue-contract.md` | `00ddb0c033085b1d2f49edc57a7c6f44d92c5dc8bb3eeac334fc4df50a4876d1` | 還流済み | docs/design/harness/L6-function-design/forward-escape-reentry-merge.md §1、oracle は docs/test-design/harness/ci-verification-contracts-test-design.md の CANDIDATE-U-EXISSUE-001..006 | blocks の L7-436/437・L6-84 は順序の都合で剥離。requires の PLAN-L6-72 は実在する依存として §1 に記載 | function-spec と architecture.md に既存の分は重複させず、フィールド表・custody・未達 DoD を追加。三面 route_mode 照合の可用 E-state が未定義で、上流設計の判断待ち (移していない) |
| `PLAN-L6-84-drive-model-reentry-verification-contract.md` | `ebf3226307c17c97c2053b954a72554f6390ba1910d7160abb89a50bfd78f21f` | 還流済み | docs/design/harness/L6-function-design/forward-escape-reentry-merge.md §2、CANDIDATE-U-REENTRY-001..004 | blocks の L7-438・L6-85 は順序の都合で剥離 | ReentryCertificate の reducer は src に無く、未実装の目標契約と明記 |
| `PLAN-L6-85-automated-pr-cross-review-merge-contract.md` | `a9faa25127d041bbbf8858e305afe86357008a5ddcd0f6e6ba8a1d4c1cfa80c0` | 還流済み | docs/design/harness/L6-function-design/forward-escape-reentry-merge.md §3、CANDIDATE-U-PRFLOW-001..007 | requires の L6-82 は責務依存として §3 に記載。blocks の L7-439 は剥離 | closure と binding は実装済み、draft PR 自動生成と障害耐性は未実装。external-if §10.4 の trace block 語彙とは重複させていない |
| `PLAN-L6-86-drive-plan-admission-contract.md` | `cac70ec0cf630a20c1180839dfa7bb3e0b98fc6911448bd9336bd827de5923fc` | 還流済み | docs/design/harness/L6-function-design/forward-escape-reentry-merge.md §4 | blocks の L7-435 は剥離 (confirmed) | oracle は U-PADM-001..011 に昇格済みで既存。遷移方向軸・journal 順序・receipt v2 を追加 |
| `PLAN-L6-87-nfr-contract-evidence-gate-contracts.md` | `c694edf467ef8ff34ed52df396ef23148efc84628fb20f07675471ec6c1da03b` | 還流済み | docs/design/harness/L6-function-design/ci-verification-contracts.md §2、CANDIDATE-U-NFRGATE-001..003 | requires の PLAN-L3-03 は完了済みのため剥離 | 実装なし。generates に function-spec.md とあるが該当節は無く、新文書へ移した |
| `PLAN-L6-89-layer-verification-contract.md` | `e122f7180fa451795e1672ae36fb8811528f8bb3bec111271702c11664898e65` | 還流済み | docs/design/harness/L6-function-design/ci-verification-contracts.md §3、CANDIDATE-U-LVC-001..007 | requires の PLAN-L6-72 は supersede 関係として §3 に記載 | PLAN の U-LVC 8 件のうち scope 照合は 005 に統合。実装 PLAN-L7-456 の状態は未確認 |
| `PLAN-L6-90-ci-responsibility-contract.md` | `75a90dd6b8c81a1414f55f74087c75c613fd007031e256cf6676f5f5e504f0cc` | 還流済み | docs/design/harness/L6-function-design/ci-verification-contracts.md §4、CANDIDATE-U-CIRESP-001..006 | requires の L6-82 は §4 に前提として記載 | 実装 PLAN-L7-457 は想定のみ。参照: PLAN-L7-455 の lane 分類器 |

## 残り (未処理)

- PLAN-L6-91-disposition-claim-integrity-gate.md
- PLAN-L6-92-resource-kernel-function-contracts.md
- PLAN-L6-93-node-bootstrap-contract.md
- PLAN-L6-94-cross-review-session-attestation.md
- PLAN-L6-95-runtime-env-doctor-contract.md
- PLAN-L6-96-advisor-consultation-telemetry.md
- PLAN-L6-97-memory-episode-retirement-contract.md
- PLAN-L6-98-oracle-test-citation-contract.md
- PLAN-L6-99-doctor-result-envelope-measurement-contract.md
- PLAN-L6-100-workflow-suggest-add-design.md
- PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
- PLAN-L6-102-release-promotion-rollback-gate.md
- PLAN-L6-103-claude-wake-liveness-deferred-routing.md
- PLAN-L6-104-memory-clean-cut-replacement.md
- PLAN-L6-105-consumer-safe-upgrade-contract.md
- PLAN-L6-106-report-write-security-contract.md
- PLAN-L6-107-consumer-report-command-and-intake.md
- PLAN-L6-600-codex-review-wake-contract.md
- PLAN-L6-661-worktree-safe-remove-contract.md
- PLAN-L6-711-merge-time-receipt-rechain-contract.md
- PLAN-L6-789-token-ingest-retirement.md
- PLAN-L6-816-release-notes-draft-contract.md
- PLAN-L6-832-plan-revise-omission-preserve-contract.md
- PLAN-L6-833-confirmed-document-placeholder-detection.md
- PLAN-L6-834-design-protection-diff-gate.md
- PLAN-L6-935-claude-inbox-explicit-ack.md
- PLAN-L6-971-consumer-trace-gates.md
