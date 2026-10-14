# PLAN → 設計文書 還流証跡 (slice backflow-s6b、issue #958 / #959)

目的: L6 中盤 36 PLAN を「使い捨て可」または「廃止 / supersede 済み」にするため、PLAN にしか無い契約・依存・carry を設計文書へ移す。
基準 commit: `d5ad67fb50c148ea8dd6d5475bab4b88f2d4cd4c` (origin/main)

本ファイルは **途中経過 (第 1 回 commit)** である。処理済みは下表の 16 件、残りは末尾に列挙する。

| 区分 | 件数 (処理済みのみ) |
| --- | ---: |
| 使い捨て可 | 9 |
| 還流済み | 7 |
| 廃止 | 0 |
| 要判断 | 0 |

設計文書の略称: FS = `docs/design/harness/L6-function-design/function-spec.md`、UMG = `docs/design/harness/L6-function-design/vmodel-unimplemented-gates.md` (本 slice で新設)。

| PLAN | blob sha256 (origin/main) | 区分 | 移し先 (path と節) | 剥離した依存 | 備考 |
| --- | --- | --- | --- | --- | --- |
| PLAN-L6-47-agent-contract-authoring-source.md | cbb2880629496027ca453f95b3911988bd412367eda4acd33491ae41235b7177 | 使い捨て可 | FS `parseAgentContractRows` / `analyzeAgentContractIntegrity` / `checkAgentContractDetection`、`docs/governance/vmodel-agent-contracts.md`、L7 `U-AGENT-CONTRACT-R1..R4` | parent / requires (PLAN-L7-390、完了済み) | VMS-008 は `docs/governance/vmodel-typed-spec-definitions.md` に実在 (grep で確認) |
| PLAN-L6-49-refactor-and-qa-release-gates.md | 5ff5b5f27f362aeff211b5938552b587d2b6e2cfddf2600182cdb17b7da1f501 | 使い捨て可 | `docs/governance/vmodel-refactor-qa-release-gates.md` (VMS-012 の authoring source)、L7 unit-test-design の refactor-qa-release oracle | parent (PLAN-L7-393、完了済み) | 後続 gate 実装は PLAN-L7-394 が所有 |
| PLAN-L6-50-execution-assignment-ledger.md | 9dcae0aa6813c2a955a00aa6e6a0c9d290f73644c76bee554f8d5e89ea56960c | 使い捨て可 | FS §PLAN-L6-50 ID 単位実行割当台帳追補 (row / gate ID 契約は「未実装」と明記済み)、L7 `U-ASSIGN-LEDGER-*` | requires PLAN-L7-386 (完了済み) | g2 で移行済み。実装未起票のまま FS が所有を明記している |
| PLAN-L6-51-substance-fill-gate.md | eafab6861d086e735f6cec9b40c4261df06ffab14a98e80d9a6da90e779258b7 | 還流済み | UMG §2、test-design `CANDIDATE-VMUG-001..003` | requires PLAN-L7-390 (完了済み) | src に実装なし。未実装の目標契約として記載 |
| PLAN-L6-52-signals-schedule-live-handover.md | b51ca9050c5ad0fb08e8cf9888bddaafcf2eb2520cbe4813702a5cdbc963bc1e | 使い捨て可 | FS `selectScheduleLiveState` / `selectSessionStartDigest` (固定 4 段、fail-open、authoring_rag 不変)、`handover-mechanism.md`、L7 `U-SCHEDULE-LIVE-001..004` | requires PLAN-L7-383 / L7-385 (完了済み) | L6-54 との境界 (実行時 signal 軸 vs spec 内容軸) は UMG §4 に記載 |
| PLAN-L6-53-adversarial-review-mechanism.md | 86e1ab9537e6dc74d0469f81dea33c1cca9cfdb39bbd3d93d5e01ef7ef27d57a | 還流済み | UMG §3、test-design `CANDIDATE-VMUG-004..007` | requires PLAN-L7-384 (完了済み) | src に実装なし。PASS-WEAK は review custody の語彙と同義と明記 |
| PLAN-L6-54-unrecorded-change-diff-gate.md | 94eb933551a11c3b2ce245d526b9b4b34bf0012c4775e0b202a349f6ff368396 | 還流済み | UMG §4、test-design `CANDIDATE-VMUG-008..009` | requires PLAN-L7-388 (完了済み) | src に実装なし |
| PLAN-L6-55-undeclared-doc-trace-gap-detection.md | 345d627c6cfe1dab99b833466cae348cbd23e3ad25e332bb4ebef7b19a31177c | 還流済み | UMG §5、test-design `CANDIDATE-VMUG-010` | requires PLAN-L7-387 (完了済み) | サンセット閾値 N は実装前 freeze で確定 (未確定のまま記載) |
| PLAN-L6-56-adr-ledger-bidirectional-consistency.md | 2fb03603f97ab280baf3e09ebd9bb28ec78082eacb4b1469d99494be9cf47cef | 還流済み | UMG §6、test-design `CANDIDATE-VMUG-011` | (requires なし) | PLAN-L7-275 との統合可否は実装前 freeze の判断事項として記載 |
| PLAN-L6-57-scope-detection-dry-run-preview.md | fd3c9f317089d25557fd191af4d696ccc4d58a8a09dcdc2cc4bfa26e69bc11ea | 使い捨て可 | FS `buildScopeDryRunPreview` (入出力・失敗時の扱い・doctor との境界)、L7 `U-SCOPE-PREVIEW-R1..R4` | requires PLAN-L7-385 (完了済み) | FS が PLAN-L6-57 / PLAN-L7-398 を明記 |
| PLAN-L6-58-agent-contract-digest-export.md | c1eb97fb42601922ab50b4cbb8abcfd69e2f887908449aea5de9ca4cab65e3c1 | 還流済み | UMG §7、test-design `CANDIDATE-VMUG-012` | requires PLAN-L7-391 (完了済み) | src に実装なし |
| PLAN-L6-59-design-doc-cross-integrity-check.md | a941af1fb605c6b9512bde85c9c6d16d9efaa69dd3aa596380246b7822aa5d90 | 使い捨て可 | FS `analyzeDesignDocCrossIntegrity` (duplicate / cycle、module 級 cycle との境界)、L7 `U-DESIGN-CROSS-*` | requires PLAN-L6-43 (完了済み) |  |
| PLAN-L6-60-trace-impact-traversal-command.md | 06cd40c6ef0faf76b43bca833da2ef477ec6c912aebea5310f646f1c059083af | 使い捨て可 | FS §PLAN-L6-60 `analyzeTraceImpact` / `ut-tdd trace impact`、L7 `U-TRACE-IMPACT-*` | requires なし | 実装済み (`src/trace/impact.ts`) |
| PLAN-L6-61-spec-rag-closure-ledger.md | 776fe1d1e1fca19ac7929cbf3d80068c917591881debb2e6479ad98602830f3a | 使い捨て可 | FS §PLAN-L6-61 `deriveSpecRagClosureEntries` / `ut-tdd trace rag`、工程 RAG との分離 | requires PLAN-L6-43 / L6-60 (完了済み) | 実装済み。L5 physical-data に table 契約あり |
| PLAN-L6-65-hook-immediate-revalidation-gate.md | bfaa9e565634690d2e3fa398573b076da1f3fa6ac540167c37bf7fe3ea55ed97 | 還流済み | UMG §8、test-design `CANDIDATE-VMUG-013..014` | (requires なし) | src に実装なし。既存ログ記録の非破壊を明記 |
| PLAN-L6-66-code-minimalism-skill.md | 77b091b590c233f3206b76668413778d9511f711698dc0bc1a074cd5d94b2a40 | 使い捨て可 | `skills/code-minimalism.md`、`skills/SKILL_MAP.md` (どちらも実在) | (requires なし) | 成果物は skill 本体が正本。PLAN は skill の存在確認のみで足りる |

## 未処理 (別の worker または次回に引き継ぐ)

PLAN-L6-48 (L2 / L5 freeze 契約の現行 owner を要確認)、PLAN-L6-62、PLAN-L6-63 (g1 の d 行が未照合)、PLAN-L6-64 (g4 で移行済みの照合のみ)、
PLAN-L6-67、PLAN-L6-68、PLAN-L6-69、PLAN-L6-70-source-catalog-profile-resolver-contracts、PLAN-L6-70-vmodel-judgement-skill-pack、
PLAN-L6-71、PLAN-L6-72 (FS / L7 に FSM 表が既存。L6-89 との分担を照合)、PLAN-L6-73、PLAN-L6-74、PLAN-L6-75、PLAN-L6-76、PLAN-L6-77、
PLAN-L6-78、PLAN-L6-79、PLAN-L6-80、PLAN-L6-81。

読了済みの所見 (判断は未了): L6-70-vmodel-judgement-skill-pack は skills/ に design-family-* 9 本を含め大半が実在し、PLAN 本文の「ファミリ 9 本は未作成」は stale。
