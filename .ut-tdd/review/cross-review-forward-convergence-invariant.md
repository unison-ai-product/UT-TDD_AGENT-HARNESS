# DESK REVIEW 依頼 (cross-review, role=tl) — Forward 集約不変条件と機械強制の穴

## これは DESK REVIEW です (最優先制約・先に読め)

- **対象 = 下記「診断」と「提案」という *設計議論* の妥当性**。リポジトリの直近 commit / 最新 PLAN のコードレビューでは**ない**。
- `git log` の最新差分や working tree の変更を漁って評価先を差し替えない。**本書に書かれた診断・提案そのものを評価**せよ。
- 必要に応じて引用先ファイル (`src/lint/backfill-pairing.ts`, `src/vmodel/lint.ts`, `docs/process/modes/README.md`) を確認してよいが、評価の主語は常に「この不変条件と提案が正しいか」。

## 背景 (PO が主張する不変条件)

PO 発言 (2026-06-26):
> 「別フローはフォワード外を安全に隔離するためのもので、最終実態はフォワードに集約されないといけない。フォワードが最終正本として成立しなくなる。フォワードはきれいな状態を保った製本であるべき。」

= **Forward (L0-L14 spine) = きれいな最終正本 (製本)。別フロー (Reverse/Add-feature/Discovery/Scrum/Recovery/Incident/Refactor/Retrofit/impl) は Forward 外の作業を安全に隔離する装置であり、その最終実態は必ず Forward へ集約 (back-fill / Forward 合流) されねばならない。未集約の別フローが宙に浮いたまま「Forward freeze = 最終正本成立」を主張してはならない。**

この不変条件は設計正本 `docs/process/modes/README.md` に既に明文化されている:
- §1 「mode は出口を必ず Forward L0-L14 に合流する」
- §5 「出口=Forward 合流。mode 固有で完結させない」
- §LOWER-L-REVERSE-BACKPROP (§6.8.8) 「L4-L14 の addition は backprop_decision 必須。requires_* が open のまま accept/close 不可」

## 診断 (Claude/Opus による。これの真偽を検証せよ)

設計に原則はあるが、機械強制に 2 つの穴がある、と Claude は主張する。

### 穴① back-fill 強制が kind を選り好みする
`src/lint/backfill-pairing.ts:7` `KIND_BACKFILL`:
```
add-impl: required
refactor / retrofit / troubleshoot: conditional
impl: none, poc: none, reverse: none, recovery: none, design: none, add-design: none, charter: none
```
同ファイル :180-181 で `req === "none"` の kind は集約検査を `continue` で完全スキップ。
→ §6.8.8 は「L4-L14 のあらゆる addition は backprop_decision 必須」と言うのに、**kind=impl / poc が新規 addition を作っても集約義務から抜ける**。

### 穴② freeze gate が未集約の別フローを見ない
`src/vmodel/lint.ts` の L0-L7 freeze 判定 `analyzeVerificationGroups` / `frozen` 条件 (:384-391):
```
frozen = total>0 && draft===0 && !hasOrphan && confirmed>0
         && missingPlanIds.length===0 && evidenceMissingPlanIds.length===0
```
ここで参照するのは (a) L1-L6 設計 sub-doc の confirmed 数 と (b) ハードコードされた 9 本の automation PLAN (`L0_L7_AUTOMATION_PLAN_IDS`, :212-222) のみ。
→ 「**spine 外に、Forward 設計から降りていない impl/poc が landing していないか**」を一切検査しない。だから未集約の別フローが何件あっても「✅ freeze 完了 → 最終正本」と表示される (absence-blindness: 不在≠違反)。

### 具体インスタンス
現在 non-terminal な 3 draft はいずれも **kind=impl**:
- `PLAN-L7-157-distribution-clean-pull` (配布チャネル = 新規 capability)
- `PLAN-L7-141-web-dashboard-component-derived` (中央UI)
- `PLAN-L7-146-serverless-readonly-share` (中央UI 共有)

これらは Forward roadmap spine に未登録 (program-coverage の登録 span にない) かつ kind=impl ゆえ穴①で集約義務 none、穴②で freeze gate の視界外。= Forward の L3/L4/L6 設計に一度も降りていない実装計画が宙に浮く。

## 提案 (Claude による方向性。妥当性・代替・リスクを評価せよ)

1. **集約義務の網羅化**: 「Forward spine 未登録の kind=impl/poc が新規 addition を作るなら backprop_decision 必須」を強制 (spine 内 = 既に L6→L3 descent 済なので不要、spine 外 = 集約必須)。
2. **freeze gate を完全性ベースに**: L0-L7 freeze / 最終正本判定を「ハードコード 9 本」でなく「**未集約の別フロー = 0**」で fail-close 化。
3. 既存の `descent-obligation` / `impl-plan-trace` と二重化させず SSoT を整理。

## あなた (Codex/tl) が答えるべきこと

1. **診断の真偽**: 穴①②は実在するか。私が見落とした既存の統制 (別の lint/gate/doctor チェックで既に spine 外 impl/poc の Forward 集約を強制しているもの) はあるか。あるなら具体名で示せ。
2. **kind=impl の扱い**: spine 外 impl を「add-impl にすべき mis-kind」と見るべきか、それとも「impl のまま集約義務を課す」べきか。harness の §1.3 kind taxonomy / §1.10 排他制約と整合する正しい設計はどちらか。
3. **提案の健全性**: 「spine 外実装は backprop_decision 経由で集約されるまで freeze 不成立」という不変条件を fail-close 強制する方向は正しいか。過剰 (誤検知で正当作業を止める) リスク・回避すべき設計はあるか。
4. **進め方**: Discovery (metamodel PoC) → Reverse back-fill の正規サイクルが適切か、それとも先に 157/141/146 個別 kind 是正で実体集約を先行すべきか。
5. **総合判定**: AGREE / PARTIAL / DISAGREE を明示し、理由と推奨アクションを箇条書きで。

出力は上記 1-5 の番号付きで、簡潔に。
