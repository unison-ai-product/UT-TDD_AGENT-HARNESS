# DESK REVIEW 依頼 (cross-review, role=tl) — version-up mode + S4 forward-convergence fail-close (統合設計)

## これは DESK REVIEW です (最優先制約)

- 対象 = **下記 2 つの設計提案の妥当性**。リポジトリの直近 commit のレビューではない。
- 評価の主語は「この 2 設計が正しく・既存統制と非重複・誤検知なく・PO 不変条件と整合するか」。
- 参照可: `docs/plans/PLAN-DISCOVERY-09-version-up-mode.md`, `docs/plans/PLAN-DISCOVERY-08-forward-convergence-invariant.md`,
  `src/lint/forward-convergence.ts`, `src/lint/backfill-pairing.ts`, `docs/process/modes/README.md`。

## 文脈

PO 不変条件: Forward = きれいな最終正本。別フローの最終実態は Forward 集約まで freeze 不成立。今回 PO が追加要請:
**version-up 駆動モデル**を足し、中央UI(画面) を「いまは入れないが将来版で必ず入れる」= 保全 (preserve) として明示したい。

## 設計A: version-up 駆動モデル (PLAN-DISCOVERY-09)

- mode=version-up。入口=`version_deferral` (capability を将来版へ保全。今スコープ外だが破棄しない)。
- **新 kind を作らない**。保全中は既存 kind 維持 + status=draft + frontmatter **`version_target: <label>`** (例 future/v2) を機械正本。
- archived (破棄) でも plain draft (WIP) でも Add-feature (今追加) でも Retrofit (依存upgrade) でもない第4の状態 =
  deferred-but-committed-future。
- Forward 合流点 = 将来版 activation 時に add-feature (L2/L3 → L7) で合流。それまで parked。
- forward-convergence では `version_target` 付き = 正当な deferred(version-up) 種別 (未 landing ゆえ unconverged-landed でない)。
- outstanding で active draft と version-up parked を分離表示。
- 規範変更 (concept §2.5 mode / requirements / modes README) は S4 後。

## 設計B: S4 forward-convergence fail-close 化 (PLAN-DISCOVERY-08 Step 5)

- 現状 report-only の forward-convergence を **gating (doctor.ok 連動) へ昇格**。
- baseline 2 件 (PLAN-L7-147 / PLAN-L7-62) は **audited legacy debt allowlist** で grandfather
  (backfill-pairing の `LEGACY_CONDITIONAL_BACKFILL_DEBT_PLAN_IDS` と同型: 既存債務を audit doc に列挙、
  gate は **NEW 違反のみ fail-close**、legacy は別途 disposition follow-up)。
- gate の ok = **NEW unconverged-landed = 0** (legacy は ok を落とさないが surface)。
- DISCOVERY-08 を decision_outcome=confirmed + promotion_strategy=reuse-with-hardening にし、
  `PLAN-REVERSE-*` を起こして requirements §6.8.8 / modes README へ正本 back-merge (scrum-reverse / IMP-064 義務)。

## あなた (Codex/tl) が答えるべきこと

1. **version-up の mode 妥当性**: 新 kind を作らず mode + `version_target` marker で表す設計は、§1.3 kind taxonomy /
   §1.10 排他制約 / modes README 台帳と整合するか。archived/draft/Add-feature/Retrofit と非重複か。
2. **version-up と forward-convergence の整合**: `version_target` 付きを deferred(version-up) として扱い
   unconverged-landed から除外する分割は、不変条件 (将来必ず Forward 集約) を弱めないか。逆に「version-up と
   書けば永久 parked で集約逃れ」になる抜け穴を作らないか。作るなら何の歯止めが要るか。
3. **fail-close の legacy debt allowlist**: 既存 2 件を grandfather し NEW のみ fail-close する設計は、backfill-pairing
   の前例と一貫し妥当か。legacy 2 件の最終 disposition (Forward 集約 or local_impl_only or version-up) はどれが筋か。
4. **正本 back-merge の射程**: requirements §6.8.8 / modes README / concept §2.5 のどこまでを S4 で触るべきか。
   過剰 (concept 最上位まで一気に) を避けつつ不変条件を機械正本化する最小十分な範囲は。
5. **総合判定**: 設計A・設計B それぞれ APPROVE / APPROVE-WITH-CHANGES / REJECT を明示し、Critical/Important/Minor を箇条書きで。

出力は 1-5 の番号付きで簡潔に。
