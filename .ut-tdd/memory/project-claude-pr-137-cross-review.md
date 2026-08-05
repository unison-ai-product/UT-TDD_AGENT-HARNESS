---
memory_id: memory:project:claude-pr-137-cross-review
kind: project
title: "Claudeへの依頼: PR #137 Node control-plane cutover cross-review"
tags: ["bun-ban", "claude", "cross-review", "node", "pr-137", "redesign"]
updated_at: 2026-07-23T10:38:00+09:00
---

Codex起票PR #137の非author cross-reviewをClaude側へ依頼する。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/137
- branch: `design/node-control-plane-cutover`
- base: `work/resource-kernel-native-companion` (PR #135)
- drive model: `redesign`（PLANの専門職driveは`fullstack`）
- 変更概要: 既存の単一owner `PLAN-L4-32` / `PLAN-L5-25`へBun永久BANのL4↔L9とNode packaging/deploymentのL5↔L8を統合し、Node代替Green前の旧検出経路削除とNode primary後のBun fallbackを禁止する。
- 重点レビュー:
  - `PLAN-L4-32` cutover state machineとL9 `ST-NODE-CUTOVER-01..12`が双方向traceできるか。
  - `PLAN-L5-25` portとL8 `IT-NODE-CUTOVER-001..012`がpackage/SQLite/hook/Pack/rollbackの物理契約を覆うか。
  - Bun zero detectorが単純grepへ縮退せず、source/config/generated bundle/runtime processを覆うか。
  - scanner欠測、別HEAD/別bundle、片OS Green、Bun fallbackがfail-closeか。
  - Node代替未成立のまま現行検出器を削除する工程になっていないか。
  - `PLAN-L6-92`へ統合したscanner/Node self-host契約と`PLAN-L7-458`のatomic TDD sliceが、禁止壁自身のBun依存循環を断てているか。
  - `U-BUNBAN-001..012` / `U-NODEBOOT-001..012`が`no-new`と最終`zero`を混同せず、既存debtをallowlistで隠していないか。

PRはdraftであり、L6/L7降下、Node実装、clean-host system evidence、独立reviewが未完了のためmerge禁止。FLAGは設計へ戻し、検出器へ設計を合わせないこと。

初回CIで新規`PLAN-L4-33` / `PLAN-L5-26`が既存sub-doc ownerと重複すると判明したため、二重所有PLANは削除し既存ownerへ統合した。stacked PR基部の未merge生成物をmerge済みと誤判定する別負債はIssue #138へ起票済み。

Codex側adversarial review（HEAD `fb6f7a64`）はFLAG: 正本L5/L6未更新、L7 generates不足、redesign route不整合、bootstrap循環、既存debtの実質allowlist化、scanner coverage不足。HEAD `f14c319e`で次を修正したため再reviewを依頼する。

- L5/L6 canonical designへpackage/observer/scanner/bootstrap契約を反映。
- L4-L6 routeを`redesign`へ整合し、L7はredesign freeze後のForward再合流として明記。
- L7 generatesへpackage/lock/build/CLI/SQLite/runner/runtime observerを追加。
- `bootstrap Red → minimal compiled Node host → scanner Red/Green → self-host`へTDD順を修正。
- delta guardとoverall三値complianceを分離し、既存debt中は常に`NonCompliant` Red。
- `U-BUNBAN-013..020`でglobal/env/lock/setup/shell alias/binary/current-doc/runtime observerを追加。

再reviewでは上記5攻撃が引用で反駁できるかを確認し、未反駁があればmerge禁止を維持すること。

**2026-07-23 Claude blind re-review 完了 (HEAD `900842de`)**: 5攻撃すべて引用でREFUTED、総合PASS (spec-blind PASS-WEAK)。5攻撃根拠のmerge禁止は解除可、ただし解除条件 = `harness-check` を実merge head上でgreen化 (doc引用検証は機械gate実走の代替でない)。非ブロッキングerrata: L6-92散文に旧語`Zero`残存。結果はPR #137コメント (issuecomment-5053293255) に記録済み。残待ち: PR固有CI green化とmerge判断 (Codex/PO側)。

CI run `29919575500`で追加判明したPR固有RedをHEAD `900842de`で是正した。L7-458をRedesign後の正規Forward再合流として`kind: impl` / `route_mode: forward`へ変更し、Reverse backfillを捏造しない。既存owner資産は`generates`から外してreferencesへ移し、新規差分だけを所有する。実test code未接続の32件は`CAND-*`候補へ戻し、実装commitと同時に正式`U-*`へpromoteする。英語見出しも日本語化した。最新HEADで再CI後にreviewすること。

**2026-07-23 route再監査更新 (HEAD `a7dfbf67`)**: L5閉域契約によりplain `kind=impl / route_mode=forward`の新規L7起票は不正だった。L7-458を`kind=add-impl / route_mode=add-feature`へ正規化し、実装採用後の設計追従を`PLAN-REVERSE-458`として追加した。Redesign（設計差替え→Forward合流→再実装）とReverse（採用実装→設計backfill）を両方保持する。対象テストはbackfill 23件 + plan lint 63件 Green。最新HEADのclaim-blind再reviewを依頼する。

**2026-07-23 Claude claim-blind 再々review 完了 (HEAD `a7dfbf67`)**: 総合**PASS**。差分3ファイル (L6-92 1行 / L7-458 frontmatter / PLAN-REVERSE-458 新規) を検証 — route正規化は `src/schema/route-filing.ts` (add-feature許容kind=add-impl、L7 band内) と lint機械強制 (parent_design実在 + drive一致) に整合、PLAN-REVERSE-458実在・3経路参照、5攻撃反駁は全維持・退行なし。「backfill 23件 + lint 63件 Green」はUNVERIFIED (別ブランチのworking treeのためlint実走不可、prose claimとして不採用)。merge解除条件は前回同様 = 機械gate (`plan lint` / `doctor` / `harness-check`) の実merge head green確認。非ブロッキングerrata: L6-92旧語`Zero`残、L7-458↔REVERSE-458 back-ref非対称。結果はPR #137コメント (issuecomment-5053414478) に記録済み。
