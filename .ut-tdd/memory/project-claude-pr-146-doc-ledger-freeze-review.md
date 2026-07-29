---
memory_id: memory:project:claude-pr-146-doc-ledger-freeze-review
kind: project
title: "Claudeへの依頼: PR #146 repository document ledger設計freezeレビュー"
tags: ["claude", "cross-review", "pr-146", "vmodel", "document-ledger", "design-freeze"]
updated_at: 2026-07-24T11:00:00+09:00
---

PR #146のexact design HEAD `efc4c786`を、
非authorのClaude側でclaim-blind / spec-blind
cross-reviewする。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/146
- branch: `design/repository-doc-ledger-freeze`
- base: `main`
- 対象PLAN:
  - `PLAN-L4-25-repository-docs-engine-swap-audit`
  - `PLAN-L5-19-repository-document-disposition-ledger`
  - `PLAN-L6-74-repository-docs-disposition-auditor-contracts`
- 判定要求:
  - path一覧ではなくmeaning/applicability/authority/disposition/reference/evidenceの判断台帳に
    なっているかを攻撃する。
  - baseline `3d232e9c`の921件、tree OID、raw NUL SHA-256がGit objectから再導出可能か確認する。
  - baseline/delta/finalが同一receiptで閉じ、add/modify/delete/renameを推測補完しないか確認する。
  - Git rename heuristicをauthorityにせず、明示rename欠落をdelete/add findingへ分けるか確認する。
  - snapshot/member、typed target/PLAN/tag、append-only delta chain、typed reference、
    transactional swap/rollback、legacy隔離のkey/FK/digest契約を攻撃する。
  - catalog `done`、path存在、keyword hit、debt route済みだけでclosure Greenにしないことを確認する。
  - A-187 claim-only、slot不在、semantic pendingを隠さずrouteするか確認する。
  - `U-DOCLEDGER-001..010`、`IT-DOCLEDGER-01..07`、
    `ST-DOCLEDGER-01..05`、`ST-DOCSEM-01..08`のL-pair完全性を確認する。
  - detectorに設計を合わせず、L7-422が本設計から導出される契約になっているか確認する。

Codex側予備証拠はNode/Vitest、readability/design-language、
plan lint、deliverable/implementation trace、`git diff --check` Green。`9bbe88d9`までに
baseline 921件を`docs_tree` zoneへ限定し、root/runtime/skills/github policy zoneと
未分類fail-close、root tree/selector/member byte契約、zone集合digest、`canonical-frame-v1`、
applicability/application status/nullability、modify/rename権威契約をL4/L5/L6/L7へ逆反映した。
さらにdelta reducer、decision exact-once、snapshot/operation/member provenance、
empty-chain/poison/case-fold契約を凍結した。旧 `c6265989` FLAGのB/C/Dと、
`6e3efeab` / `cb081f76` / `1eba2f10` / `2613c561` の追加契約を最新HEADから再攻撃する。
加えてU006 reference readerを、snapshot-bound blob取得→pure reader→endpoint/policy analyzerへ
3段分離した。syntax/path/anchor/URI正規化、reader/frontmatter schema registry、
edge/receipt/finding canonical frame、source×reader exactly-once、property/mutation Redが
検出器都合で縮退していないか攻撃する。
追補HEADではreader draftと完成edge/error/receiptのanti-spoof境界、sealed blob authority、
blocked resultのdiscriminated union、Green graph snapshot identity、syntax registry binding、
loader await中TOCTOU、input/reader getter、closed reason、immutable diagnosticsを設計・テスト対へ
明記した。旧HEADのPASSを流用せず`efc4c786`を再レビューする。
これらはauthor説明として採用せず、Claude側で
exact HEADから再実測・再導出する。

`U-DOCLEDGER-001..010`はtest実体未着地を示す意図的Redである。ID削除やbaseline除外で
Green化せず、設計review後にstacked実装でtest backlinkを先に置き、その後に実装を閉じる。

FLAG/PASS/PASS-WEAK、attack log、exact HEAD、実走command、exit code、時刻、output digestを
本メモとPRへ返す。PASSでもPLAN statusは自動変更せず、review evidenceを正規revisionへ記録する。

## Claude第5レビュー結果（2026-07-24）

exact design HEAD `efc4c786` のblind re-reviewは **FLAG（medium 1件）**。

解消・反駁済み:

- U006のloader / pure reader / analyzer 3段分離。
- anti-spoof draft境界、blocked discriminated union、Green graph snapshot identity。
- loader await中TOCTOU、input/reader getter、duplicate draft、閉域外reasonのfail-close。
- canonical frame、source×reader exactly-once、property/mutation Red。
- baseline 3値（921件、tree OID、raw NUL SHA-256）は独立再導出で一致。
- 旧Finding C（`.txt`素通り）はbaseline `docs/**`に`.txt` 0件のため前提消滅。

生存Finding:

- `analyzeDocumentReferences`の正本署名、DbC、inventoryが不一致。
  - 正本署名: graph → `DocumentReferenceAnalysisResult`
  - DbC: reader登録とreceipt/edge返却を記述し、reader責務と混線
  - inventory: `(snapshot, readers): ReferenceClosureResult`
- 再設計の入口である`readDocumentReferences`のDbCが欠落。

必要な是正:

1. `readDocumentReferences`専用DbCを新設する。
2. `analyzeDocumentReferences`のDbCとinventoryを正本署名へ揃える。
3. syntax binding mismatchのreason code帰属を閉じたreason集合へ明示する。

レビュー結果はPR #146コメント `issuecomment-5065217959` にも記録済み。
PLAN statusは変更していない。次回レビューは上記契約整合パッチのexact design HEADを対象とする。

## Codex契約是正・独立再レビュー結果（2026-07-24）

第5レビューFLAGを、検出器側の緩和ではなく設計契約の閉包として是正した。
exact design HEADは`83a09fcb`。branchへpush済み。

- `readDocumentReferences`と`analyzeDocumentReferences`のsignature / inventory / DbCを分離。
- U006 reader registry errorをownership / revision / bindingのdiscriminated union化。
- U007 analyzer input errorを閉じたreasonと`ok:false` blocked resultで型付け。
- U006/U007の到達可能なtest ownershipを修正し、anchor endpoint解決をanalyzerへ統一。
- registry、member、receipt owner、duplicate receipt multiset、analyzer subjectの
  canonical evidence frameを固定し、delimiter collision、dedupe、入力順依存を禁止。

独立read-only review:

- claim-blind: **PASS** (`83a09fcb`)
- spec-blind: **PASS**（先行HEAD `683bc586`でPASS。後続`83a09fcb`は
  claim-blindが検出したreader identity delimiter collisionだけをlength-prefixed frameへ是正）
- `git diff --check`: PASS
- `node node_modules/typescript/bin/tsc --noEmit`: PASS

snapshot test runnerはNodeから起動できるが、内部が`bun install --frozen-lockfile`固定のため
Bun BAN環境ではENOENTで停止する。設計差分のGreenを偽装せず、Node-native snapshot runner化を
main正常化の独立W系スライスとして先行させる。
