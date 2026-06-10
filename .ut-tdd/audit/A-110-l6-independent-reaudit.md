# A-110 L6 Independent Re-Audit (合否判定)

Date: 2026-06-09
Gate: G6 (re-audit of A-109)
Auditor: Claude Opus (PM) + 5× pmo-sonnet substance reviewers (read-only)
Scope: 全 L6 機能設計 (`docs/design/harness/L6-function-design/*.md` 18 doc) + L7 pair + 機械チェック + traceability。
**Verdict: CONDITIONAL PASS (条件付き合格)** — A-109 の unconditional PASS を **条件付き**へ訂正。

## 方法

機械層 (typecheck / lint / vitest / doctor / l6-completion / l6-fr-coverage / pair-freeze) を独立再走し、18 doc + L7 を 4 グループに分けて pmo-sonnet で substance 精読 (coverage≠substance、descent を中身で検証)。

## 機械層 (全 green)

- `bun run typecheck`: exit 0 / `bun run lint`: 67 files clean。
- `npx vitest run`: **283/283 pass (34 files)**。
  - 注: Bash tool 経由だと `runtime-hook-entrypoints.test.ts` が 5 件 fail するが、原因は **テスト環境の PATH に `cmd.exe` が無い** (spawnSync ENOENT) ためで製品欠陥ではない。System32 を PATH に足すと 6/6 pass。テスト portability の Minor (cmd.exe を PATH 前提でハードコード)。
- `doctor`: exit 0。l6-completion OK (18 docs / L7 confirmed / G6 PASS)、l6-fr-coverage OK (FR 46)、pair-freeze OK (38 pair 孤児0)、change-impact OK、module-drift OK、verification L4-L6 freeze 完了 26/26 confirmed。
- status: 18 L6 doc 全 confirmed / L6 PLAN 00–22 全 confirmed / L7-unit-test-design confirmed / gate-design G6 ✅PASS→A-109。

→ **freeze 規則 (PLAN-L6-00 §L6 final completion rule) は機械的に充足**。

## Substance 所見 (中身を読んで検証)

中核 doc (function-spec の実装済関数 / edge-case / session-log / forced-stop / handover / setup / backfill / vmodel-pair / module-drift / review-evidence / cross-review / test-before-review) は **hollow でなく実体のある契約**を持つ。L6 設計層は実在し空虚ではない。ただし下記の must-fix がある。

### MUST-1 [Critical] 凍結済 2 doc に文字化け (readability 違反)

- `gate-confirm.md` h1: `—` (em dash) が `U+2001 + "E"` に破損 → `# gate-confirm lint  Efunction design`。可逆。
- `plan-schedule-lint.md`: `実装計画` → `実裁E␣␣画` (**U+FFFD ×2 = 不可逆データ欠損**、L22 contract / L42 U-PLANSCH-006 oracle)。
- **HEAD (コミット済) は両方 clean (U+FFFD 0件)** → 破損は **本セッションの未コミット編集が新規混入**。`git checkout HEAD -- <file>` で復元後に意図編集を再適用 (非可逆逆変換に頼らない、[[feedback_freeze_check_full_doc_readability]])。
- src は U+FFFD clean。`src/plan/lint.ts` は正しい `実装計画` + CP932 寛容正規表現を使うため lint は壊れておらず U-PLANSCH テストも green (実害は doc 可読性に限定)。
- **A-109 の "readability recheck 8/8 clean" は対象が旧 8 doc のみで IMP-079/081 の新 doc を漏らした coverage gap**。これが A-109 を unconditional から条件付きへ訂正する第一根拠。

### MUST-2 [Important→Critical] function-spec §1 addendum 33 関数の under-design

- 2026-06-09 addendum で FR registry 被覆のため一括追加した 33 関数 (routeSignalToMode / emitFeedbackEvents / classifyDrive / rebuildHarnessDb 等) は **`XInput/XDeps=>XResult` の汎用 signature のみ**で、① Input/Result の型 body が doc 内に無い ② **pseudocode が 0 件** ③ 対象関数の大半は **src にも未実装** (型 body の参照先 `src/schema` も未在)。
- `l6-fr-coverage` は「FR→L6 path + unit contract + U-* oracle の ID マッピング存在」しか見ず pseudocode/型 substance を gate しないため **OK を返す = false-confidence** ([[feedback_coverage_not_substance]])。
- pseudocode は L6 の明示 DoD (PLAN-L6-00 §4 IMP-019 / IEEE 1016 §5.7 grounding)。33 関数の pseudocode 欠落は L6 自身の DoD 未達。**型 body を inline するか、明示 defer 宣言 (skip_sub_doc + reason / carry) で正規化**するまで FR addendum 部分は substance 不足。

### SHOULD-3 [Important] governance-enforcement §2.4 の hollow FR-alias

- `evaluateGateReview` / `checkReviewEvidence` が FR-alias 表で列挙のみ、pre/post は prose・**pseudocode 無**、L7 oracle body は fr-unit-coverage へ委譲で未展開 → design→test pair が alias 経由で切れる。
- これは A-108 の orphan `src/gate/review-tier.ts` (PLAN 無し実装) の **設計側の症状**。IMP-087 (orphan back-fill) と連動して解消すべき。

### SHOULD-4 [Important] agent-slots §2.3.1 浮いた断片

- `resolveRosterCapability(...)` テーブルが §1 責務 / §2 型 / §3 oracle のどこにも接続されず、Input/Result 型未定義・oracle 欄が別 FR (U-FR-L1-46) を指す浮遊断片。統合または別 doc へ移動 (技術負債クリーンアップ MUST)。

### Minor

- edge-case §3: rule engine 10 型中 edge 表は 6 型のみ (upstream-coverage / id-format / glossary-delta / backlog-format 欠)。function-spec §4.2 と非対称。
- vmodel-pair §7.3.1 `analyzeTestPerspectiveGate` の oracle U-FR-L1-21 が L7 未展開。
- module-drift `analyzeAssetDrift` carry が §3.1 alias のみ (§7 carry 未記載)。
- gate-confirm `analyzeGateConfirm` の fail-open invariant が散文のみ (DbC 節未整理)。
- fr-unit-coverage FR-L1-20 が 2 contract を 1 行 (unit-granularity 崩れ)。

## Traceability / governance (L6 blocker でない carry)

- **A-108 orphan 4 件** (review-tier / rule-drift / team-run / provider-handover) は PLAN 無し実装 → IMP-087 (back-fill) / IMP-088 (impl↔PLAN traceability lint) で記録済。freeze 規則の scope 外だが MUST-3 と同根。
- L7-22/23 / REVERSE-21/22 / L7-20 PLAN が **draft** のまま実装 (l6-completion.ts / l6-fr-coverage.ts) が shipped & wired = impl-ahead-of-confirmed-PLAN。L6 (設計層) では許容 (L7 phase 未着手) だが L7 へ carry。

## 改善 backlog 候補 (要 domesticate)

- **IMP-089(候補)**: freeze readability check を「全対象 doc を毎回 mojibake scan (U+FFFD + U+2001+latin + CP932 二重)」へ拡張し doctor で機械化 (A-109 の coverage gap 再発防止)。
- **IMP-090(候補)**: l6-fr-coverage に pseudocode/型 body substance gate を追加 (ID マッピングだけで OK にしない、MUST-2 の false-confidence 対策)。

## 決定

**CONDITIONAL PASS**。L6 設計層は機械 green かつ中核 substance 実在で freeze 規則充足。ただし unconditional G6 を立てる前に **MUST-1 (文字化け復元) と MUST-2 (33 関数の pseudocode/型 or 明示 defer)** を解消必須、SHOULD-3/4 を推奨解消。gate-design G6 行 (現 unconditional PASS→A-109) は本 A-110 の条件付きへ訂正されるべき。
