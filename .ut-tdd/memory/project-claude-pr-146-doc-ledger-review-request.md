---
memory_id: memory:project:claude-pr-146-doc-ledger-review-request
kind: project
title: "Claudeへの依頼: PR #146 repository document ledger設計freezeレビュー"
tags: ["claude", "cross-review", "pr-146", "vmodel", "document-ledger", "design-freeze"]
updated_at: 2026-07-23T20:34:00+09:00
---

PR #146のexact design HEAD
`9bbe88d965a1f281a1fee6a34da0ad06c4b4280d`を、非authorのClaude側で
claim-blind / spec-blind cross-reviewする。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/146
- branch: `design/repository-doc-ledger-freeze`
- current PR HEAD: memory-only commit follows exact design HEAD
- 対象PLAN:
  - `PLAN-L4-25-repository-docs-engine-swap-audit`
  - `PLAN-L5-19-repository-document-disposition-ledger`
  - `PLAN-L6-74-repository-docs-disposition-auditor-contracts`
- 必須攻撃:
  - path一覧ではなくmeaning/applicability/authority/disposition/reference/evidenceの
    判断台帳として閉じていること。
  - baseline `3d232e9c`の921件、tree OID、raw NUL SHA-256をGit objectから再導出すること。
  - baseline/delta/final同一receipt、append-only delta、typed reference、
    transactional rollback、legacy隔離を攻撃すること。
  - catalog `done`、path存在、keyword hit、debt routeだけでclosure Greenにしないこと。
  - A-187 claim-only、slot不在、163件pending_reviewを隠さないこと。
  - `U-DOCLEDGER-001..010`、`IT-DOCLEDGER-01..07`、
    `ST-DOCLEDGER-01..05`、`ST-DOCSEM-01..08`のL-pairを検証すること。
- Codex予備証拠:
  - Node/Vitest 5 files / 100 tests Green
  - readability / design-language / plan lint / trace / diff-check Green
  - `9bbe88d9`までにbaseline 921件を`docs_tree` zoneへ限定し、root/runtime/skills/
    github policy zone、未分類fail-close、root tree/selector/member byte契約、
    zone集合digest、`canonical-frame-v1`、applicability正規化契約を追加
  - delta reducer、decision exact-once、snapshot/operation/member provenance、
    empty-chain/poison/case-fold契約を追加。旧 `c6265989` FLAGのB/C/Dを再攻撃する
  - U006 reference処理をsnapshot-bound blob取得、pure reader、endpoint/policy analyzerへ分離。
    syntax/normalization、registry revision、edge/receipt/finding frame、property/mutation Redを再攻撃する
  - `U-DOCLEDGER-001..010`はtest実体未着地を示す意図的Red。ID削除や
    baseline除外でGreen化せず、設計review後にstacked実装でtest backlink→実装の順に閉じる

PASS/FLAG/PASS-WEAK、attack log、exact HEAD、実走command、exit code、時刻、
output digestを本メモとPRへ返す。PASSでもPLAN statusは自動変更せず、正規review evidenceへ記録する。

**2026-07-23 Claude blind cross-review 完了 (design HEAD `1f7935ef`)**: 総合**FLAG**。必須攻撃6種は全REFUTED — 特に baseline `3d232e9c` の3値 (921件 / tree OID `310ec6de…` / SHA-256 `02b618ce…f47382`) をGit objectから独立再導出し完全一致 (exit 0, 09:39 UTC)。anti-surrogate closure・A-187/163件 pending_review非隠蔽・L-pair双方向traceも引用で確認。**FLAG根拠 (生存攻撃1件)**: L6 `captureRepositoryDocsSnapshot` の捕捉scope (docs/ + root canonical + `.ut-tdd`帯) が baseline 921 (docs/**のみ) +「baseline 921 exactly once」+「全snapshot path exactly once判定」+ 単一`docs_tree_oid`と同時成立しない — 実装者がL6 DbCに従うとIT-DOCLEDGER-01を満たせない。是正はerrata級 (scopeをdocs/**に限定 or baselineをbroadenして再pin)。軽微: L5-19本文にIT-DOCLEDGER ID引用なし (層対応非対称)。Codex予備証跡「5 files/100 tests」は実測 8 files/58 tests (disposition suite、本freezeのoracleではない) と不一致 — 本freezeのDOCLEDGER oracleは設計自身が実装前Redを宣言しており再現対象なし。readability等gateはBun依存のため未実走。PLAN status (3件draft) は変更していない。結果はPR #146コメント (issuecomment-5057047336) に記録済み。残待ち: Codex側のscope矛盾errata対応。

**2026-07-23 Claude blind re-review 完了 (design HEAD `b15e5c0c`)**: 総合**FLAG (軽度・errata級)**。前回のhard FLAG (scope↔921矛盾) はzone modelで**解消** — 921のzone限定・`repository_tree_oid`+`document_snapshot_zones`・coverage-expansion delta・`doc-selection-unclassified` fail-closeを引用確認、baseline 3値再導出は退行なし完全一致。必須攻撃6種は全REFUTED維持、「意図的Red」宣言は隠蔽でない (Green偽装経路の禁止明記)。**生存 Finding A (中)**: zone reworkがdesign doc/test-designのみで**3生成元PLAN未更新** (`git diff ...docs/plans/`=空) — 特にPLAN-L5-19のsnapshot identity frame (`docs_tree_oid`ベース) がphysical-data.mdの新frame (`repository_tree_oid`+selection/member_set_digest) とsnapshot_digest計算で不一致。是正=zone taxonomy/新frame/delta定義をL4-25/L5-19/L6-74へback-propagate。低優先: Finding B (baseline後delta意味論の二読み)、C (`.txt` 3件がunclassified検出4拡張子外で素通り)、D (zone同語異義)、L5-19のIT-DOCLEDGER非引用残存。PLAN status変更なし。結果はPR #146コメント (issuecomment-5057275829) に記録済み。残待ち: Codex側のPLAN back-propagate。

**2026-07-23 Claude blind re-review 第3ラウンド完了 (design HEAD `c6265989`)**: 総合**FLAG (低・errata級のみ)**。R1 hard FLAGとR2 Finding Aは**いずれも解消** — 3生成元PLANがback-propagateされ、L5-19のsnapshot identityがphysical-data.mdと9 field同順同名一致 (`repository_identity..member_set_digest`)。applicability正規化契約はfail-open無し (enum CHECK fail-close、U-DOCLEDGER-004 Red固定)。baseline 3値・必須攻撃6種・Red-freeze退行なし。残存 (全てdoc精度パッチ範囲): Finding B (coverage-expansion deltaの参照フレーム未定義 — baseline既存pathのaddが「存在path add拒否」invariantと厳格読みで衝突、IT-DOCLEDGER-01期待Greenで意図は明白)、C (`.txt` 3件素通り)、D (zone同語異義)、新規 (application state 5値/status 3値の名称近接、historical_only remap注記欠如)、L5-19のIT-DOCLEDGER非引用。設計中核は実質健全、再構築不要。PLAN status変更なし。結果はPR #146コメント (issuecomment-5057514255) に記録済み。残待ち: Codex側のdoc精度パッチ (Finding B定義文が主)。

**2026-07-23 Claude blind re-review 第4ラウンド完了 (design HEAD `9bbe88d9`)**: 総合**FLAG (低 — 持ち越しdoc精度のみ)**。**Finding B = REFUTED (解消)**: reducer遷移表のadd事前条件 (after path不在=reducer state基準) + `document_effective_paths`の排他origin分割 (`baseline|add`) で衝突消失。新規delta reducer (decision exactly-once双方向 / poison後state非適用+partial非公開 / empty-chain seed比較 / case-fold双方blocked / 昇順replay / provenance束縛 / 遷移表reason網羅) とU006/U007 reference分離 (blob port=固定commit Git objectのみ / pure reader / error edge-0昇格禁止 / receipt exactly-once / 正規化決定的 / property・mutation Red変異kill) は攻撃全て不成立=PASS相当。baseline 3値一致・必須攻撃6種REFUTED維持・Red-freeze残存 (src/tests/document-disposition=0 filesで意図的Red維持、Green詐称なし)。残存 (低・未着手): Finding C (`.txt`素通り)、D (zone同語異義)、state(5)/status(3)名称近接、historical_only remap注記、L5-19 IT-DOCLEDGER非引用。設計は4ラウンドで収束、実質健全、残件は精度パッチのみ。PLAN status変更なし。結果はPR #146コメント (issuecomment-5058028218) に記録済み。任意推奨: reducer初期state=baseline docs_tree dispositions (921) の一文明記。

**2026-07-23 Claude側設計レビュー収束 (PO指示による)**: blocking級指摘 (R1 scope矛盾 / R2 identity drift / R3 Finding B) は全解消済みのため、**Claude側の設計freezeレビューはPASS-WEAKで収束**。残存はFinding C/D等の非ブロッキングdoc精度errata 6件のみ (PR #146コメント issuecomment-5058153984 に列挙)。以後の再レビューは errata反映HEAD か substantiveな設計変更時のみ (doc精度パッチのみのHEAD前進は再レビュー不要)。本収束は設計内容の判定であり、PR merge可否 (draft解除・harness-check green・PLAN status gate) とは独立。PR自体は現在 draft + CI 3本Red + HEAD前進中のためclose/merge不可。

**2026-07-24 Claude blind re-review 第5ラウンド完了 (design HEAD `efc4c786`, U006 reader authority 再設計)**: 総合**FLAG (medium 1件)**。U006 3段分離 / anti-spoof draft境界 / blocked DU / Green graph snapshot identity / TOCTOU隔離 / fail-close (getter例外・duplicate draft・閉域外reason) は全REFUTED (function-spec.md L1145-1216)。canonical frame / exactly-once / property・mutation Redは縮退なし (U-DOCLEDGER-006はkill対象拡張)。baseline 3値は独立再導出で完全一致 (921 / `310ec6de…` / `02b618ce…f47382`)。**旧Finding Cは前提消滅を実測** (baseline docs配下に`.txt` 0件、拡張子分布合計921) — close。Red詐称なし・L-pair trace維持・detector逆転なし。**生存 Finding-1 [medium]**: `analyzeDocumentReferences` の契約層自己矛盾 — 正本署名 (L1176: graph→`DocumentReferenceAnalysisResult`) に対しDbC (L1352) がreaderの責務 (readers登録・receipt/edge返却) を記述、inventory (L904) は `(snapshot, readers): ReferenceClosureResult` と三者三様。かつ再設計核心の `readDocumentReferences` のDbC不在。L904/L1352は本diff未変更 (先行HEAD残存) だが、freeze対象契約層の自己矛盾として生存。是正=readDocumentReferences用DbC新設 + analyzer DbC/inventoryを正本署名へ整合。付随: [low] syntaxBinding mismatch fail-closeのreason code未帰属 (閉12値に不在、安全側)、[info] L5-19のIT-DOCLEDGER非引用残存。PLAN status変更なし。結果はPR #146コメント (issuecomment-5065217959) に記録済み。残待ち: Codex側のFinding-1契約整合パッチ。

**2026-07-24 Claude blind re-review 第6ラウンド完了 (design HEAD `83a09fcb`, Finding-1/-2 契約整合パッチ)**: 総合**PASS (両レーン)**。**Finding-1解消** — analyzeDocumentReferencesのinventory (L904) / 型宣言 (L1223) / DbC (L1473) が三者一致、旧`ReferenceClosureResult`残骸grep 0件、`readDocumentReferences`専用DbC新設 (L1458、型宣言L1218と一致)、analyzer DbCからreader責務混線除去、他関数への同型不一致新規混入なし。**Finding-2解消** — `syntax-binding-mismatch`/`reader-revision-missing`が閉じたregistry reason集合 (L1350) へ型付き帰属、U-DOCLEDGER-006 kill対象と整合。表面対応でなく強化: receipt-owner subjectのdelimiter collisionを`receipt_owner_digest` (length-prefixed canonical-frame-v1のSHA-256) 化で能動閉鎖、multiset dedupe禁止、入力順全permutation property固定。REFUTED済み実体契約に退行なし、baseline 3値・意図的Red・L-pair trace不変または強化 (U007はok:false blocked追記でRed強化)、detector逆転なし。残存はinfo 3件のみ (L5-19のIT-DOCLEDGER非引用持続 / U006 kill列は代表列挙 / analyzer input-errorにregistry digest欠落reason不在—実装フェーズ要確認)。**Claude側設計freezeレビューはPASSで収束** (以後の再レビューはsubstantive設計変更時のみ)。merge可否はdraft解除・harness-check green・PLAN status gateと独立。PLAN status変更なし。結果はPR #146コメント (issuecomment-5065528771) に記録済み。
