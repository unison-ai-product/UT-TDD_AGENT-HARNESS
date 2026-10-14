> **正本化済** (PLAN-RECOVERY-07 で PLAN-DISCOVERY-07 Step 5 back-merge、2026-07-02。PO サインオフ = PO /goal 指示 + RECOVERY-07 実行承認)。

# design-bottomup 駆動モデル (画面後付け駆動)

出典: PLAN-DISCOVERY-07 (S4 confirmed、① elicitation engine + Discovery 合成) / concept v3.1 §2.5 (11-mode 化) / `src/schema/route-map.ts` (`design-bottomup`) / `src/workflow/design-elicitation.ts`

---

## 1. 概要

**backend 実装が先行し、画面 / FE 要件が後付けになる**状況の入口 mode。backend の実体
(API / データ / 状態遷移) から FE 要件を機械的に洗い出し (① elicitation engine)、mock 具体化 (②)
を経て Forward の画面設計文脈へ降下する (③)。②③ は Discovery 合成
(`composeDesignBottomupDiscovery` が discovery routing を再利用) であり、mode を再発明しない。

| 項目 | 値 |
|------|-----|
| kind | `poc` (Discovery 合成。elicitation → mock → 検証 → 確定) |
| drive | 専門職継承 (対象 work、多くは fe / fullstack) |
| layer | `cross` |
| workflow_phase | **S0-S4** |
| owner | aim + uiux |
| 承認者 | — (人間サインオフ不要) |
| 自動 routing signal | `screen_addition_to_backend` / `design_bottomup` / `backend_derived_screen` / `add_ui_to_backend` |

## 2. フロー

```
backend 実体 → ① FE 要件 elicitation (design-elicitation.ts) → ② mock 具体化 (S2)
  → ③ 検証 (S3) → S4 decide → Forward 合流 (L2 画面設計 / L3 画面要件 back-fill)
```

- ① は `detectFeDesignGaps` で「画面 doc の実体 (has_body) が無い backend 機能」を warn 可視化する
  (absence-blindness 対策。derive 不能画面も warn)。
- ② mock を飛ばして実装へ降りない (中央 UI と同じ「L2 設計から降ろす」規律)。

## 3. exit 条件

| 条件 | 検証方法 |
|------|---------|
| FE 要件が L3 画面要件 / L2 画面設計へ back-fill 済 | screen requirements / screen trace の差分確認 |
| S4 decision 記録 (`decision_outcome`) | plan lint / poc S4 規律 |
| V-model 整合 (画面 doc 孤児なし) | doctor (screen 系 gate) |

## 4. 他 mode との区別

| mode | 違い |
|------|------|
| Discovery | 要件そのものが未確定。design-bottomup は backend 実体が既にあり、FE 要件が後付けの点で入口が異なる (エンジンで機械導出可能) |
| Add-feature | 既存システムへの差分追加。design-bottomup は「作った backend に UI を与える」画面駆動の逆向き |
| screen-design (工程専門) | Forward L2 内の設計工程。design-bottomup は L2 へ**入る前**の要件洗い出し入口 |

## 5. ① elicitation engine の出力契約 (PLAN-DISCOVERY-07 の還流、実装 = `src/workflow/design-elicitation.ts`)

engine は 4 つの純関数 (I/O なし) を連鎖する。入力は backend の実体 (画面 15 件の `ScreenRef`、供給源の `BackendCapability` = `data_entity` / `cli_command` / `projection`、`screen_trace`) と FE 設計 slot の現況 (`FeDesignSlotState`)。

| 関数 | 契約 |
|------|------|
| `elicitFeRequirements` | 画面ごとに FE 設計鎖 3 slot (`L3:screen-functional` / `L5:ui-detail` / `L6:screen-spec`) の要件候補を作る。各候補は `derived_from` に backend の実体を持つ (grounding。画面固有の `screen_trace` を主、category が要する capability を従とし、全画面が同一 capability に潰れるのを避ける)。L2 (画面棚卸し) と L4 (ui-standard) は別経路で確定済みなので対象外。grounding できない画面は候補を作らず `fe-requirement-ungrounded` を warn で出し、どの画面も derive できなければ `fe-requirement-empty` を warn で出す (不在を黙って通さない) |
| `detectFeDesignGaps` | 候補があるのに slot の `has_body` が false の slot を gap にする。`has_body=true` は gap にしない (slot の登録だけでは green にしない)。gap の signal は slot ごとに `screen_requirement_gap` / `ui_detail_gap` / `screen_spec_gap` |
| `composeDesignBottomupDiscovery` | gap が 1 つ以上あれば Discovery (`entry_signal=design_uncertain`) のエントリを合成する。`routeSignalToMode` を再利用して discovery routing に乗ることを `route_candidates` で示し、mode を新設しない。stage は elicit → concretize (L2 wireframe) → descend (L3 / L5 / L6) → decide (Discovery S4)、`forward_merge=L3-L6`。gap 0 件なら `discovery=null` |
| `runDesignBottomup` | 上の 3 つを連鎖し、finding を連結して返す。`ok` は error severity の finding が無いことで決まる (上の finding はすべて warn なので、engine 単体では fail-close しない) |

mode 分類 (`DRIVE_TDD_FITS` の strong fit、`red_triggers` に `screen_requirement_gap`) と入口 signal の routing (`ROUTE_SIGNAL_MAP`) は `src/workflow/contracts.ts` 側に配線済み。

**未実装・未実施の部分 (2026-10-14 時点の実測)**:

- engine は純関数群のままで、CLI・doctor のどちらにも配線していない (`src/` で `design-elicitation.ts` を import する箇所は無く、呼び出し元は `tests/design-elicitation.test.ts` だけである)。gap は warn の finding としてしか現れず、門 (gate) にはなっていない。
- 中央 UI の 15 画面を最初の駆動ケースとして engine に通す dogfood (PLAN-DISCOVERY-07 の Step 5 の一部) は未実施である。実施する場合は L3 / L5 / L6 の FE 設計 slot の body 実体化が先行する (現状、slot は登録のみで body が空の箇所がある)。
- L4 `function.md` §3.1 の mode 表には design-bottomup の行 (入口 signal / 手順 / 出口) が掲載済みである。L5 `internal-processing.md` C.2 の routeFiling 決定表は、この mode の layer band を暫定扱いにしている (同 C.2 の注記を参照)。
