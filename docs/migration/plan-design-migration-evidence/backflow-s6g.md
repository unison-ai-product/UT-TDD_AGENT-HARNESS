# 設計還流の証跡 — backflow-s6g (issue #958、L6 slice g)

目的: 担当 14 PLAN (L6) について、PLAN に残る使い捨てられないもの (未達の DoD、carry、実在する依存、PLAN にしか無い oracle、責務の範囲) を設計文書 (`docs/design/`) と対になる test-design (`docs/test-design/`) へ移し、各 PLAN を「使い捨て可」にする。PLAN は書き換えていない。

基準 commit: origin/main `52e774724a2144a4872b87e2c754dbfcd5e42318`。blob sha256 は `git cat-file blob origin/main:docs/plans/<file> | sha256sum` で取得した。

## 件数

| 区分 | 件数 | PLAN |
|---|---|---|
| 使い捨て可 | 4 | L6-833、L6-834、L6-935、L6-971 |
| 還流済み | 10 | L6-104、L6-105、L6-106、L6-107、L6-600、L6-661、L6-711、L6-789、L6-816、L6-832 |
| 廃止 | 0 | — |
| 要判断 | 0 | — |

## 触った文書

新規の設計文書 (`docs/design/harness/L6-function-design/`): `codex-review-wake.md`、`consumer-safe-upgrade.md`、`trouble-submission-write-security.md`、`trouble-submission-command-intake.md`、`worktree-safe-remove.md`、`merge-time-receipt-rechain.md`、`token-ingest-retirement.md`、`release-notes-draft.md`。

追記した設計文書: `docs/design/harness/L6-function-design/memory.md` (§4.3 を §5 の前に追加)、`docs/design/harness/L5-detailed-design/internal-processing.md` (付録 F.2 末尾に test-design への pointer を 1 項目)。

新規の test-design (`docs/test-design/harness/`): `L7-worktree-safe-remove-test-design.md` (`CANDIDATE-WTRM-O1..O27`)、`L7-release-notes-draft-test-design.md` (`CANDIDATE-RNOTES-001..018`)、`L7-plan-revise-omission-preserve-test-design.md` (`CANDIDATE-PREVISE-C1..C9`)。

## 本体

「剥離した依存」の `requires` は、依存先がいずれも `confirmed` (2026-10-14 実測) で完了済みのため剥離とした。

| PLAN | blob sha256 (origin/main) | 区分 | 移し先 (path と節) | 剥離した依存 | 備考 |
|---|---|---|---|---|---|
| PLAN-L6-104-memory-clean-cut-replacement | `f2cfad7b31419f9ff9e19a5069bccb5cecab4575ecefd3e4b0a86c6b3e5a853f` | 還流済み | `docs/design/harness/L6-function-design/memory.md` §4.3 (PO 決定 1-8 の契約、non-read 保証、curation 基準と台帳、残余リスク)。oracle は既存 `docs/test-design/harness/L7-memory-clean-cut-replacement-test-design.md` が U-MEMCUT / CANDIDATE-P-MEMCUT で保持 (既存) | なし (requires 空)。順序依存 PR-0→PR-1→PR-2 は PLAN-L7-566 で実行済み | 実装済み (`src/memory/curation-ledger.ts`、`src/memory/legacy-archive-manifest.ts`、`tests/memory-clean-cut-*.test.ts`、`docs/archive/memory-legacy-2026-09/`)。実測 baseline (607/302 件) と PR-0 の実行制約 §9/§10 (ledger 移送、533 の archived 不可 = Issue #623) は実行時のエピソード記録で設計の責務ではないため移さない。実装 PLAN の番号予約 (§3.2) は PLAN-L7-566 で解消済み |
| PLAN-L6-105-consumer-safe-upgrade-contract | `310b7200d151e6fd08fb4b0f913ba2cf6c2b4ece8e243273ad9566ac2cfad368` | 還流済み | `docs/design/harness/L6-function-design/consumer-safe-upgrade.md` (baseline F1-F11、D1-D5、AC1-AC9、Windows/Linux の差、PR 分割、未確認 M1-M4、open O1-O4、PO 承認待ち P1-P3、責務の依存)。oracle は既存 `L7-consumer-safe-upgrade-test-design.md` が CANDIDATE-U-SAFEUP-* で保持 (既存) | なし (requires 空) | 未実装の目標契約と本文に明記 (`src/` に ownership 表・registry・backup は無い)。F 系の行番号は 2026-10-01 時点の main 6b5effbc のまま記録した (現 HEAD での再実測はしていない)。起草者/reviewer の利用上限に関する記録 (§1 注記) は移さない |
| PLAN-L6-106-report-write-security-contract | `01e915d30aa130fe15dbce0d510f03128b18c49560624cce1a5890c283d53d2e` | 還流済み | `docs/design/harness/L6-function-design/trouble-submission-write-security.md` (baseline、2.1-2.7 の設計判断、F1/F2 位相、2.5.2 の内部 endpoint 規則 R-U1..R-U5 と N1..N4、関数仕様、受入条件 1-8)。oracle は既存 `L7-report-write-security-test-design.md` (既存) | `requires: PLAN-L6-62` を剥離 (confirmed)。PR 順序依存 PR-1→PR-4 は設計文書 §6 に責務依存として記述 | 未実装の目標契約と明記。旧 PLAN-L6-816 (別内容の旧版、PR #817) への言及は 2.7 に旧 PLAN 名で残した。利用不能 reviewer の記録 (§10) と起票経緯は移さない。S2 の記述は PO 判断 (2026-10-05) で上書き済みのため設計文書 §7 に反映 |
| PLAN-L6-107-consumer-report-command-and-intake | `2d6d1ebcd7542807294bec6793252ff4efd880260327cd100db54cbbdecd16de` | 還流済み | `docs/design/harness/L6-function-design/trouble-submission-command-intake.md` (PO 判断、allowlist と定型表、layout、`runReportCommand` の出力経路・exit code、issue フォーム、運用、PR 分割、受入条件 1-7)。oracle は既存 `L7-consumer-report-command-test-design.md` (既存) | `requires: PLAN-L6-62, PLAN-L7-451` を剥離 (confirmed)。S1 実装への依存 (CLI は `buildReport` に依存) は設計文書 §7 に責務依存として記述 | 未実装の目標契約。supersede 宣言を伴わない文言訂正の記録 (§3.2) は設計文書 §2.2 に要点だけ移した。advisor 記録 (§10) は設計判断の根拠なので採択理由として 3 節の却下案に吸収 |
| PLAN-L6-600-codex-review-wake-contract | `e451708fb126d8e5c89b043a35308c0c082ee3d47c263cfa013c29db683da5ba` | 還流済み | `docs/design/harness/L6-function-design/codex-review-wake.md` (R1-R5: request-before-wake と backlog、project-scoped inbox、hook surface、claim/lease/terminal/FIFO/orphan、production composition)。oracle は既存 `L7-unit-test-design.md` の `CANDIDATE-CODEXWAKE-001..011` (既存) | `requires: PLAN-L7-472` を剥離 (confirmed) | 未実装の目標契約 (2026-10-14 実測: `git grep -i codex-memory-wake -- src .codex` が 0 件。`publishCodexReviewWake` は optional 依存のまま) |
| PLAN-L6-661-worktree-safe-remove-contract | `a60abe8beb516c997f71aa707901a71ab16b223739f0b063c206c232697db3e3` | 還流済み | `docs/design/harness/L6-function-design/worktree-safe-remove.md` (D1-D5、C1-C9、G1-G7、実装順序 S1-S4) と、PLAN にだけあった oracle O1-O27 を `docs/test-design/harness/L7-worktree-safe-remove-test-design.md` へ `CANDIDATE-WTRM-O*` として新規 | `requires: PLAN-L7-513` を剥離 (confirmed)。S1→S2→S3 の順序契約 (D2→D1 guard→D3) は設計文書 §5 の責務依存として残した | 未実装 (`git grep -E "worktree-guard|worktree remove" -- src .claude .codex scripts tests` が 0 件)。事故記録 (通算 5 回) と npm ci の実測は設計文書 §1・D2 に残した |
| PLAN-L6-711-merge-time-receipt-rechain-contract | `2f984421644f3bc30085ed765d9d7e2a0ed268c10fc36df3ceafa8e6e9289616` | 還流済み | `docs/design/harness/L6-function-design/merge-time-receipt-rechain.md` (2.1 自動 re-chain、2.2 再適用規則、2.3 whitelist 検証器、2.4 引き継ぎと CI、2.5 CLAUDE.md 例外文言、2.6 入力形、S0 の確認範囲)。oracle は既存 `L7-unit-test-design.md` の `U-RECHAIN-001..007,011,012,014..019` と `CANDIDATE-U-RECHAIN-008,009,010,013` (既存。全 19 件が存在することを確認) | `requires: PLAN-RECOVERY-16` を剥離 (confirmed) | S2 (`verifyRechainDelta`) は実装済み (`src/plan-admission/rechain-verifier.ts`)。S3 (adapter・`ut-tdd pr merge` 配線・CLAUDE.md 例外文言) は未実装と設計文書の冒頭に明記。§8 の改訂履歴 (rev 1-9) は経緯のため、契約に効く判断 (中間 blob、legacy 除外の健全性と実測、`receipt_digest` の源) だけ移した |
| PLAN-L6-789-token-ingest-retirement | `372842b9c9231573217508cdf76da7f5a4f409452e17e35976b043c910aa1fe3` | 還流済み | 段階と FR は既存 (`function-spec.md` の `projectModelEvaluations` 行、`functional-requirements.md` FR-L1-38 と「Issue #789 の段階的退役境界」、`fr-unit-coverage.md`、`L14-operational-test-design.md` OT-18、`L7-unit-test-design.md` の `CANDIDATE-U-TOKRET-001..005`)。無かった「退役する契約・継承する契約の範囲」と scan の表示専用の不変条件を `docs/design/harness/L6-function-design/token-ingest-retirement.md` へ新規 | なし (requires 空)。supersede / 部分退役注記の境界 (PLAN-L7-57 / 454 / 58 / 423 / 53) は PLAN-governance の台帳事項で、設計の責務は退役範囲として §1-§2 に記述 | 退役は未完了 (caller 残存) と冒頭に明記。formal supersede を 1 件に限る判断 (§3.1、前例 #424) と implementation_target の選定 (§3.4) は PLAN 起票規律の判断で設計の責務ではないため移さない |
| PLAN-L6-816-release-notes-draft-contract | `4b1a348baa3912a06fc448634a7f74b12c45531448aa137d65a22f83a1ec05e7` | 還流済み | `docs/design/harness/L6-function-design/release-notes-draft.md` (判断 A-H、素材 commit の信頼根、identity 表、出力形式、`--check`、残余リスク)。PLAN にだけあった oracle U-RNOTES-001..018 を `docs/test-design/harness/L7-release-notes-draft-test-design.md` へ `CANDIDATE-RNOTES-001..018` として新規 | `requires: PLAN-L7-628` を剥離 (confirmed)。operator の C1 trailer 手順への依存は設計文書 §3 に責務依存として記述 | 未実装 (`git grep -n release-notes -- src scripts` が 0 件)。PLAN の `status: confirmed` だが実装 PLAN は未起票 |
| PLAN-L6-832-plan-revise-omission-preserve-contract | `f8c8f8c64fc0a264b5852d260d6df1c909b8a9ad5a4fce6acbae00621ca749e3` | 還流済み | g5 で移行済み: `docs/design/harness/L5-detailed-design/internal-processing.md` 付録 F.1 / F.2 (既存)。残っていた候補 oracle C1-C9 を `docs/test-design/harness/L7-plan-revise-omission-preserve-test-design.md` へ `CANDIDATE-PREVISE-C1..C9` として新規し、付録 F.2 末尾から pointer を張った | `requires: PLAN-RECOVERY-16` を剥離 (confirmed)。#711 S3 との実装順序は順序の都合のみ (internal-processing.md に 1 行) | g5 は C1-C9 を「テスト設計の範囲」として移行しなかったが、本 slice の手順 (PLAN にしか無い oracle は対の test-design へ CANDIDATE- で書く) に従って移した。F.2 の契約本体は再移行していない |
| PLAN-L6-833-confirmed-document-placeholder-detection | `96030dea90bf5a9f935479e2711171c94848fd0eec2bb27e08cb710e8280dae0` | 使い捨て可 | 本文は設計系 PLAN の 4 項目 (設計文書 `confirmed-document-placeholder-detection.md` と test-design 2 本への pointer と digest)。設計文書 (§1 目的〜§6 非スコープ) と `L7-confirmed-document-placeholder-detection-test-design.md` が存在することを確認 | なし (requires 空) | 完了条件 4 項目は PLAN 手順の DoD (revise・lint・CI・review) で設計の責務ではない |
| PLAN-L6-834-design-protection-diff-gate | `8bec66a8a270727babef40e3a26fcdb2d9d261ebd0acab8befeb222296568e97` | 使い捨て可 | 本文は 4 項目。設計文書 `design-protection-diff-gate.md`、test-design `L7-design-protection-diff-gate-test-design.md`、`tests/design-protection.test.ts`・`tests/design-protection-repository-contract.test.ts` (candidate 26 件 + 6 件の引用) が存在。PLAN にだけある「subject module の解決失敗は個別 candidate の Red 証拠でない」注記は test-design 75 行目に既存 | なし (requires 空) | 完了条件は PLAN 手順の DoD |
| PLAN-L6-935-claude-inbox-explicit-ack | `970c738c991c4d9e920f858c839d3fc1b2cca4890f644a413f592fb71a009d77` | 使い捨て可 | 本文は 4 項目。設計文書 `claude-inbox-explicit-ack.md` (「実装への引き渡し条件」節を含む) と test-design 2 本が存在。「実装と実 inbox の ACK は本契約起草に含めない」は設計文書の範囲節・引き渡し条件に既存 | なし (requires 空) | 完了条件は PLAN 手順の DoD |
| PLAN-L6-971-consumer-trace-gates | `60e8cba08b8e7afb00460d5c5aaed1241e3ad1f4966477590afa3e6c14ac0d8b` | 使い捨て可 | 本文は 4 項目 (draft、使い捨て可の想定どおり)。設計文書 `consumer-trace-gates.md` (§7 空集合、reader 注入) と `L7-consumer-trace-gates-test-design.md` が存在 | なし (requires 空) | 完了条件は PLAN 手順の DoD |

## 未検証

- 還流した契約の行番号・件数 (PLAN-L6-105 の F1-F11、PLAN-L6-711 の 413 record など) は、PLAN が記録した時点 (2026-10-01〜10-05) の実測を設計文書の「実測」として写したもので、現 HEAD では再測定していない。未実装の契約は、各文書の冒頭に「未実装の目標契約」と明記した。
- 設計文書の `pair_artifact` に指した test-design のうち、PLAN-L6-105 / 106 / 107 の既存 test-design は `pair_artifact` が PLAN を指したまま (本 slice では書き換えていない)。
