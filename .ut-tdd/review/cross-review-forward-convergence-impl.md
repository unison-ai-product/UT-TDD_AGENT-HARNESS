# DESK REVIEW 依頼 (cross-review, role=tl) — forward-convergence analyzer 実装 (PLAN-DISCOVERY-08 Step 1-4)

## これは DESK REVIEW です (最優先制約)

- 対象 = **本 PLAN の PoC 実装** (`src/lint/forward-convergence.ts` + `tests/forward-convergence.test.ts` +
  `src/doctor/index.ts` への report-only 配線)。リポジトリの他の最新 commit のレビューではない。
- 評価の主語は「この analyzer が DISCOVERY-08 §2 の判定語彙・不変条件を正しく・非重複・誤検知なく実装しているか」。

## 文脈 (前段クロスレビューで AGREE 済)

- 不変条件: Forward (L0-L14 spine) = きれいな最終正本。spine-外で landed (confirmed/completed) な
  kind=impl が Forward 未集約 (backprop_decision / Reverse 合流なし) なら freeze 不成立。
- SSoT 非重複: poc は scrum-reverse (IMP-064)、add-impl/refactor/retrofit/troubleshoot は backfill
  (KIND_BACKFILL) が担う。本 analyzer は残ギャップ = **kind=impl の spine-外 landed 未集約のみ**を担う。
- report-only: doctor で surface するが doctor.ok を gate しない (fail-close 昇格は S4 ADOPT 後)。

## 実装サマリ (`src/lint/forward-convergence.ts`)

- `CONVERGENCE_SCOPE_KINDS = {"impl"}` のみ対象 (poc/add-impl 等は別 SSoT に委譲、二重計上防止)。
- `isSpineConnected(plan, roadmapSpanIds)`: 次のいずれかで true —
  ① roadmap span に plan_id 登録 ② parent_design が `docs/design/` を含む
  ③ requires が `PLAN-L[1-6]-` または `docs/design/` を指す。
- `isLanded`: status ∈ {confirmed, completed}。
- `hasLocalImplOnlyDisposition`: backprop_decision ∈ {local_impl_only, not_required}。not_required は
  理由 10 文字以上必須 (空 prose 免除を不許可)。
- 分類順: spine-internal → (未 landing) draft-deferred → local-impl-only → (Reverse 参照) converged →
  さもなくば **unconverged-landed** (違反候補)。
- SSoT 再利用: requires=backfill-pairing.parseRequires / reverse links=scrum-reverse.parseLinks /
  roadmap span=roadmap-registry.loadRoadmaps / fmValue=shared。
- 配線: `src/doctor/index.ts` `checkForwardConvergence` を greenCommandDigest と同様 report-only で
  messages にのみ追加 (doctor.ok の連鎖には入れない)。lint-wiring=wired (死蔵でない)。

## 現リポ baseline 実測 (report-only)

未集約 landed impl = **2 件**:
- `PLAN-L7-147-refactor-candidate-detector` (kind=impl/confirmed、parent_design=docs/process/modes/refactor.md、
  requires=PLAN-L7-133。docs/design でも L1-L6 PLAN でもないため spine-外)
- `PLAN-L7-62-runtime-portability-guard` (kind=impl/completed、parent_design=docs/adr/ADR-001、
  requires=ADR-001 + repository-structure.md。同様に spine-外)

その他: spine-internal 33 / converged 0 / local-impl-only 0 / draft-deferred 0。

## 検証 (定量)

- `bunx vitest run tests/forward-convergence.test.ts` = 14 tests passed。
- `bun run typecheck` exit 0 / `bunx biome check` (新 3 file) クリーン / `ut-tdd plan lint` exit 0。
- `bun run test` (全量 vitest) は実行中 (結果は確定後に PLAN review_evidence へ記録)。

## あなた (Codex/tl) が答えるべきこと

1. **判定語彙の実装妥当性**: isSpineConnected の 3 条件は過不足ないか。特に parent_design が
   `docs/process/` や `docs/adr/` を指す場合に「spine-外」とするのは正しいか、それとも設計/ADR 由来も
   spine 接続とみなすべきか (= 上記 2 baseline 件が真陽性か偽陽性かの判断)。
2. **SSoT 非重複**: kind=impl のみを対象にして poc=scrum-reverse / add-impl 等=backfill に委ねる分割は、
   重複も漏れも無いか。impl 以外で本来 spine-外集約を要する kind の取りこぼしはないか。
3. **誤検知**: draft/deferred を violation にしない・spine 接続済を flag しない・local_impl_only を許す、の
   3 つは正しく効いているか (test ケースで担保されているか)。
4. **report-only 配線**: doctor.ok 非連動で surface のみ、は妥当か。S4 ADOPT で fail-close 昇格する設計に
   一貫しているか。
5. **総合判定**: APPROVE / APPROVE-WITH-CHANGES / REJECT を明示し、Critical/Important/Minor を箇条書きで。

出力は 1-5 の番号付きで簡潔に。
