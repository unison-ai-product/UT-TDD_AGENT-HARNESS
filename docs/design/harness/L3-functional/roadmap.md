---
doc_type: verification-roadmap
layer: L3
scope: cross-layer (L0-L14。起票点は L3 マイルストーン)
status: draft
version: v0.1
created: 2026-06-04
provenance: PO /goal (2026-06-04)。要件定義の後段に検証/改善ロードマップ構築フェーズを置く方針。設計ドキュメントレベルの artifact として L3 design 配下に配置 (PO 2026-06-04 訂正、governance 昇格を取り下げ)。
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_requirements: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
related_process: docs/process/forward/overview.md
related_backlog: docs/improvement-backlog.md
---

# UT-TDD Agent Harness — 検証ロードマップ (v0.1)

> **名称 = 検証ロードマップ**: V-model 層群 (例: L0-L3 / L4-L6 / L7 / L8-L14) の Forward が freeze 完了した**節目を機械的に検知して検証サイクルを発火**させる **全体調整 (崩れ防止) の band**。検証タイミングを人の記憶でなく **V-model 単位の構造**に従わせ、層群の freeze 完了 → 検証発火を機械化する (**実装済 = IMP-068**: doctor `checkVerificationGroups` が L0-L3 / L4-L6 / L0-L6 の層群 freeze を surface。pair-freeze lint の層群 freeze 集計が素地。発火 = surface まで、検証 PLAN 起票は人間トリガー)。改善は検証で出た課題を backlog へ還流する従属作業であり、本書の主語は**検証**。

> **位置付け**: 本書は「**要件定義 (L3) が出揃った後に、どの順番で・どの粒度で harness 自身を検証し改善していくか**」を定義する **設計ドキュメントレベルのロードマップ** (PO 2026-06-04) である。L3 マイルストーンで起票する設計層の計画 doc として `docs/design/harness/L3-functional/roadmap.md` に置く。concept / requirements のような governance 正本ではなく、また V-model の標準 sub_doc (テスト設計と pair する artifact) でもない、**L3 設計層の計画文書**。scope は L0-L14 横断だが起票点は L3。**CLAUDE.md / AGENTS.md の read order には含めず、常時参照しない**。本書は **節目（層群の Forward が一区切りついた時点。例: L0-L3 / L4-L6 / L0-L6）に検証/改善サイクルを回すときだけ動的に参照する** band であり、**定常（Forward 工程 L0→L14）の driver / 主語ではない**。定常作業を本書の Phase / サイクルで語らない（[[feedback_roadmap_is_design_doc_level]]）。
>
> **DRAFT 注記**: 本 v0.1 は PO /goal (2026-06-04) を受けた初版ドラフト。フェーズ境界・ゲート条件は PO 確定 (po-gate) 前。

---

## §0 なぜ要件定義の後にロードマップを置くか

要件定義 (L3、FR + AC) が出た時点では「**何を作るか**」は決まるが、「**作りながら / 作った後に、どの層から・どの粒度で検証と改善を回すか**」は未定義だった。この空白を埋めずに L4 以降へ進むと、

- 設計とテスト設計の **V-pair 同粒度** ([[feedback_design_granularity_equals_test_design]]) が層ごとにバラつき、後段の trace 整合 (G1-trace / G3-trace) が破綻する。
- ワークフロー (各 mode の入口 → PLAN 合成 → 駆動 → exit → fullback) が**実際に動くか**を検証する場が無いまま機能だけ増える。
- 検証中に出た**課題・アイディアが機能一覧 (改善 backlog) に還流せず**、属人的に消える ([[feedback_process_for_record_not_weight]])。

そこで本ロードマップを **L3 直後の standing 成果物**として起票し、harness 開発の全期間で参照する。これは harness **自己開発**のロードマップであり、harness が利用者に課す製品仕様とは別レイヤー ([[feedback_harness_dev_vs_harness_usage]])。

> **運用原則 (PO 2026-06-04)**: 本ロードマップと **機能一覧 (`docs/improvement-backlog.md`)** は、進捗に合わせて**都度調整する living document** である。この 2 つが**ブレない** (= 進捗の現在地と次にやることが常に最新に保たれる) ことで、**進捗ズレの回収**と**デグレ (degrade) リスク**を大幅に下げられる — 両者が「あるべき姿」の anchor となり、実装が逸れたら差分として検出できるため。ただしこれは **あくまでドキュメントコンテキストレベル**の運用であり、現段階で lint / gate による機械強制を足す話ではない (機械化は IMP-033 クロスチェックエンジン等の将来 PLAN で別途整理)。各フェーズ exit / 各改善サイクルの節目で本書 §5 現在地と機能一覧を更新するのが運用ディシプリン。

---

## §1 改善サイクルの単位 (全フェーズ共通テンプレート)

各フェーズは下記の **1 改善サイクル**を回す。これは既存の improvement-backlog → ledger 機構 (requirements §1.10.G.12) を「対象層バンド」に適用したものであり、新機構を足さない。

```
[1] 検証      対象層バンドの「① ワークフローが正しく動くか」+
              「② ドキュメント ⇔ テスト設計が V-pair で同粒度か」を点検
        ↓
[2] 課題抽出  検出した不備・アイディアを列挙 (observed)
        ↓
[3] 機能一覧へ登録  docs/improvement-backlog.md に IMP-* として追記
              (= PO の言う「機能一覧に追加」。lint / FR / policy / doc へ triage)
        ↓
[4] 機能化    triaged → implemented (該当 PLAN を起票し V-model を通す)
        ↓
[5] 検証 + 台帳  verified。ledger (v2-import-ledger A-*) と相互参照で決定を残す
        ↓
   (verified 以外の openCount が次サイクルの trigger)
```

**2 つの検証観点 (PO 指定、Phase 1 で明文化し全フェーズ共通)**:

- **観点 A — ワークフローが正しく動くか**: 当該バンドに関わる mode の入口判定・PLAN 合成 (①必須 + ②選択 sub-doc)・駆動・exit・fullback が設計どおり機能するか。正本検証は `PLAN-DISCOVERY-01` (workflow メタモデル PoC) を通す ([[project_workflow_metamodel_poc]])。
- **観点 B — ドキュメント ⇔ テスト設計の同粒度**: 当該層の ① 設計 doc と ③ テスト設計 doc が V-pair で**同じ粒度**に落ちているか (設計粒度 = 単体テスト設計粒度の原則)。孤児 0 は state DB 側で機械保証する ([[feedback_vmodel_state_db_completeness]])。

---

## §2 V-model バンドへの写像

PO 提示の 7 フェーズ + 2 ゲートを、V-model (L0-L14) のバンドへ写像する。

```
左腕 (設計降下)              谷          右腕 (検証上昇)
L0 企画   ┐                            ┌ L14 運用検証        ┐
L1 要求   │ Phase 1 (L0-L3)            │ L13 デプロイ後検証   │ Phase 6
L2 画面   │                            │ L12 デプロイ+受入   │ (L11-L14)
L3 要件   ┘                            │ L11 総合レビュー+UAT ┘ ← Phase 5/6 共有層
L4 基本   ┐                            │ L10 UX 磨き         ┐
L5 詳細   │ Phase 2 (L4-L6)            │ L9 総合テスト       │ Phase 5
L6 機能   ┘                            └ L8 結合テスト       ┘ (L8-L11)
              L7 実装  ← Phase 3 (workflow 自動化) / Cycle P4 (L7 DB 統合)
```

> **用語規約 (2026-06-12)**: UT-TDD ロードマップの L7 DB 統合サイクルは **Cycle P4 / L7-DB** と呼ぶ。以後、旧DBフェーズ表現は禁止し、Run 層 (L9-L11) と L7 DB の完了判定を混同しない。移植元名は歴史資料・vendor 参照に限定し、現行工程名・完了判定・doctor message の主語にしない。
>
> **L11 は Phase 5 と Phase 6 の共有層** (overlap は意図的)。Phase 5 では L11 を「観点 A: 右腕テスト実施が機能するか」の総合レビューとして、Phase 6 では L11 を「観点 B: L3⇔L12 / L1⇔L14 の要件巻き取り trace の起点」として扱う (§3 Phase 5/6 参照)。

| V-pair | 左腕 (設計) | ③ テスト設計 | 右腕 (実施) |
|--------|------------|--------------|-------------|
| L1 ⇔ L14 | 要求定義 | 運用テスト設計 | 運用検証 |
| L2 ⇔ L10 | 画面設計 | ワイヤーモック自体 (wireframe=self pair、L10 独立 doc 不要 = IMP-039/058) | UX 磨き |
| L3 ⇔ L12 | 要件定義 | 受入テスト設計 | デプロイ+受入 |
| L4 ⇔ L9 | 基本設計 | 総合テスト設計 | 総合テスト |
| L5 ⇔ L8 | 詳細設計 | 結合テスト設計 | 結合テスト |
| L6 ⇔ L7 | 機能設計 | 単体テスト設計 | 実装スプリント内 |

出典: requirements §1.4 VALID_LAYERS / docs/process/forward/overview.md。

> **テスト設計 frontmatter の layer 規約 (IMP-037/059 確定、PO「解消して」2026-06-04)**: ③/④ テスト設計 doc の `layer` は **作成層 (= 左腕設計層 = V-pair の pairing key、`next_pair_freeze` と一致)** を正本とし、実施層は `executed_at_layer` で別保持する (両保持 = 情報損失ゼロ)。例: 単体テスト設計 = `layer:L6` + `executed_at_layer:L7` / 受入テスト設計 = `layer:L3` + `executed_at_layer:L12`。vmodel-lint は `layer` を pairing key として左腕設計と突合する。**ファイル名 (L7-unit/L8-integration/L9-system は実施層、L1-operational/L3-acceptance は作成層) は歴史的経緯で混在するが、機械正本は frontmatter `layer`=作成層**。L7-unit が template。

---

## §3 フェーズ詳細

各フェーズは §1 の 1 改善サイクルを回す。entry = 前フェーズ exit (Phase 1 は L3 要件定義 confirmed)。

### Phase 1 — L0〜L3 検証 / 改善サイクル

- **対象**: L0 企画 / L1 要求 / L2 画面 / L3 要件 (左腕上段)。
- **検証**: 観点 A (L0-L3 に関わる mode の workflow が動くか) + 観点 B (L1⇔L14 運用TD / L3⇔L12 受入TD / L2⇔L10 mock が同粒度か)。
- **このフェーズの追加任務**: §1 の観点 A/B を全フェーズ共通テンプレートとして**確定・明文化**する (PO が Phase 1 を「検証対象 + 観点定義の場」と指定)。
- **出力**: 課題/アイディア → improvement-backlog。
- **現状接地**: L0=concept_v3.1 既済 / L1=draft (5 sub-doc) / **L2=5 sub-doc 実在** (screen-flow/screen-list/ui-element/wireframe + README、全件 `status:placeholder`。③ペア=mock 自体・L10 独立 doc 不要を README で明文化済 = IMP-039) / L3=draft (3 sub-doc + roadmap)。

### Phase 2 — L4〜L6 改善サイクル

- **対象**: L4 基本設計 / L5 詳細設計 / L6 機能設計 (左腕下段)。
- **検証**: 観点 B (L4⇔L9 総合TD / L5⇔L8 結合TD / L6⇔L7 単体TD の同粒度) + 観点 A。
- **現状接地**: L4-L6 設計 PLAN は多数 draft、L6 は一部 confirmed (session-log / forced-stop / setup / handover)。L4/L5 テスト設計 doc は欠落 (要起票)。

### 設計検証サイクルゲート (旧 GATE-A) — L0〜L6 総合検証サイクル

> **命名正規化 (PLAN-REVERSE-36、PO 2026-06-10)**: Phase 連番由来の「GATE-A」を廃し、**V-model band で命名する検証サイクルゲート**へ正規化した。これは Forward の per-layer 正規ゲート (G0.5〜G7、gate-design §2) とは別レイヤーであり、検証ロードマップ固有の **band 単位で機械発火する検証サイクル**である (driver にしない、[[feedback_roadmap_is_design_doc_level]])。発火タイミングは doctor `checkVerificationGroups` が surface し、ゲート名の単一正本は `src/vmodel/lint.ts` の `VERIFICATION_GROUPS`。

- **対象**: 左腕全体 (設計降下 + テスト設計)。L0-L6 band = 下位 2 band (L3 検証サイクルゲート = L0-L3 上流 / L6 検証サイクルゲート = L4-L6 設計) の累積。
- **発火 (機械)**: 各 band の Forward freeze 完了 (draft 0 + pair 孤児0 + confirmed≥1、placeholder=park 許容) を doctor が検知して検証サイクル発火を surface する。人の記憶でなく V-model 構造に従わせる = 崩れ防止の全体調整。
- **判定 (検証サイクル中身)**: L0-L6 の横断 trace 整合 (G0.5/G1/G2/G3/G4/G5/G6 の per-layer ゲートが全層で閉じるか)、設計⇔テスト設計の同粒度がバンド横断で保たれるか、Phase 1-2 で backlog 登録した課題が verified へ到達したか。
- **fail-close**: 孤児 (片側のみのペア) が残るバンドがあれば Phase 1/2 へ差し戻し。

### Phase 3 — L7 ワークフロー自動化の実装 / 改善サイクル

- **対象**: L7 実装 (谷) のうち **harness ワークフロー自動化** = `ut-tdd` CLI / hook / `plan lint` / gate・doctor 機械検証 / cross-artifact relation graph / verification profile / dependency-drift / regression expansion / canonical document export。
- **検証**: 観点 A を**実装で裏付ける** (workflow が doc 上だけでなくコードで動く)。L6⇔L7 単体テスト設計の TDD Red 先行。
- **現状接地**: src/ に session-log / forced-stop / setup / handover / doctor / agent-guard / plan lint / roadmap registry / review evidence / relation graph / dependency-drift / regression expansion / verification-profile / tool-adapter / document export pure core 実装済。Phase 3 検証サイクルでは、これらが `doctor` / unit test / trace lint で一体に動くかを検証する。DB projection への自動登録・feedback/監査 DB は Cycle P4 / L7-DB。

### Cycle P4 — L7 データベース統合の実装 / 改善サイクル

- **対象**: L7 のうち **state DB 統合** = `.ut-tdd/state` の二層 schema、V-model 整合 (孤児 0) の機械保証、PLAN/handover/ledger/backlog の state 化。
- **検証**: 観点 B の機械保証を DB 側で完成させる ([[feedback_vmodel_state_db_completeness]])。doctor / vmodel lint が未充足ペアを fail-close 検知。
- **現状接地**: handover は CURRENT.json で機械ポインタ化済。state DB 本体・登録トリガ (FR-L1-07 hook) は未。

### 実装検証サイクルゲート (旧 GATE-B) — L0〜L7 総合検証サイクル

- **対象**: 左腕 + 谷 (設計 → 実装) の縦断 (L0-L7 band)。
- **判定**: G7 (4 artifact trace: ①設計 ⇔ ②実装 ⇔ ③テスト設計 ⇔ ④テストコード の 8 directed edge + coverage) がバンド横断で閉じるか。Phase 3/4 の自動化・DB が観点 A/B を機械保証するか。
- **発火 (機械)**: L7 band の Forward freeze 検知は `VERIFICATION_GROUPS` の L0-L7 group で機械 surface 済み (PLAN-L7-43)。L7 roadmap G-L7.E 到達時に doctor が `実装検証サイクルゲート [L0-L7]` を発火可として表示する。

### Phase 5 — L8〜L11 改善サイクル

- **対象**: L8 結合テスト / L9 総合テスト / L10 UX 磨き / L11 総合レビュー+UAT (右腕下段)。
- **検証**: 右腕が左腕ペアの ③ テスト設計を ④ テストコードとして実施できるか (L5⇔L8 / L4⇔L9 / L2⇔L10)。
- **L11 の扱い (Phase 6 と共有)**: Phase 5 では L11 を **観点 A 寄り** = 「右腕のテスト実施 (L8-L10) が機能として総合的に成立するかのレビュー」として扱う。要件巻き取りの trace 完結は Phase 6 へ持ち越す。
- **現状接地**: L8/L9 テスト設計 doc あり (コード未)。L10/L11 未着手。

### Phase 6 — L11〜L14 改善サイクル

- **対象**: L11 総合レビュー+UAT / L12 デプロイ+受入 / L13 デプロイ後検証 / L14 運用検証+改善 (右腕上段)。
- **L11 overlap は意図的**: 総合レビュー+UAT を Phase 5/6 両方で扱う。Phase 6 側の L11 は **観点 B 寄り** = 「L3⇔L12 / L1⇔L14 の要件巻き取り trace の起点」として扱い、Phase 5 の総合レビュー結果を要件突合へ接続する。
- **検証**: L14 で次サイクル feedback が improvement-backlog へ還流するループが閉じるか。

### Phase 7 — テスト用システム構築による改善サイクル

- **対象**: harness を実際に当てる「**テスト対象システム** (sample target repo)」を構築し、UT-TDD を end-to-end で dogfood する。
- **検証**: 観点 A/B を**第三者リポジトリで再現**できるか (harness が自 repo 以外でも機能するか)。ここで出た課題が最終的に backlog → 機能化へ還流。
- **位置付け**: ロードマップの収束点。harness の「利用者に課す仕様」が実 target で動くことの最終確認。

---

## §4 検証サイクルゲートの位置 (V-model band 単位、機械発火)

> 旧「GATE-A / GATE-B」を band 命名へ正規化 (PLAN-REVERSE-36)。これらは Forward の per-layer 正規ゲート (G0.5〜G7) とは別レイヤーの **検証ロードマップ固有の band 単位検証サイクル**。ゲート名の単一正本 = `src/vmodel/lint.ts` `VERIFICATION_GROUPS`。

| 検証サイクルゲート | 発火 (band freeze) | 束ねる範囲 | 検証サイクルの中身 (通過条件 概念) |
|--------|------|-----------|----------------|
| **L3 検証サイクルゲート** | L0-L3 freeze 後 | L0〜L3 (上流 要求〜要件) | 上流設計降下 + テスト設計の trace 整合・同粒度 |
| **L6 検証サイクルゲート** | L4-L6 freeze 後 | L4〜L6 (設計 基本〜機能) | 設計降下 + テスト設計の trace 整合・同粒度 |
| **設計検証サイクルゲート** (旧 GATE-A) | L0-L6 freeze 後 (Phase 2 の後) | L0〜L6 (左腕全体 = 上記累積) | 設計降下 + テスト設計の横断 trace 整合・同粒度・backlog verified 到達 |
| **実装検証サイクルゲート** (旧 GATE-B) | L0-L7 freeze 後 (Phase 3 automation slice 完了後。Cycle P4 / L7-DB は同 gate から派生する次 cycle) | L0〜L7 (左腕 + 谷) | G7 4-artifact trace の縦断整合 + 自動化による観点 A の機械保証。DB による feedback/監査機構の完全化は Cycle P4 / L7-DB |

各ゲートとも fail-close: 未充足バンドがあれば該当 Phase へ差し戻す。検証サイクルの判断は **po-gate** + review 前置 (別 runtime `frontier-reviewer` / 単体 mode は `intra_runtime_subagent`) を通す。発火 (いつ検証するか) は doctor の band freeze 集計で機械化済 (人手駆動でない)。

---

## §5 現在地 (2026-06-09)

> **読み方 (本書は anchor であって driver でない)**: 下表「状態」欄は **§1 の検証/改善サイクルが各バンドにいつ適用されたか**を記録するものであり、Forward 工程の進行・freeze を**駆動・先行する正本ではない**。工程の確定 (freeze) 権限は gate プロセス (gate-design.md §2 台帳 / G_N) にあり、本書はそれを後追いで反映する companion (§6 配置)。

| Phase | 検証/改善サイクル状態 | 備考 (Forward 側の実態は gate-design §2 / 各層 status が正本) |
|-------|------|------|
| Phase 1 (L0-L3) | **検証/改善サイクル完了 (4 巡)** | サイクル完了を受けて Forward 側で L0-L3 freeze 済 (gate-design §2: G0.5/G1/G3、2026-06-04、A-100 が正本記録)。本書はそれを反映するのみ。`roadmap.md` 自身は living で draft 維持 (frozen 対象外) |
| Phase 2 (L4-L6) | **全件見直し完了 / quantitative+qualitative findings fixed+routed** | L4/G4、L5/G5、L6/G6 は gate-design §2 で PASS 再確定済 (A-101〜A-104 / A-109〜A-111 / A-115)。L4⇔L9、L5⇔L8、L6⇔L7 の V-pair は doctor pair-freeze 孤児0、L6 completion は G6 PASS、FR registry 47件は L6 unit contract / U-* oracle に接続。A-110 で L6 substance 指摘が出て、A-111 で blocker 解消を再確認。A-116 は verification readiness と source-isolation hardening、A-117 は no-finding 過剰主張の補正、A-118 は定量 evidence と定性 workflow/substance review を束ねた L4-L6/L7-L9/PLAN 全件レビューの完了記録。A-122 で自動化/UT DB/共通化/マルチ協調の pre-close hardening を追加し、IMP-107..116 として Phase 3 / Cycle P4 carry へ routing 済 |
| 設計検証サイクルゲート (旧 GATE-A) | **検証サイクル発火可 (機械) / per-layer Forward gate は PO サインオフ済** | L0-L6 全設計層は doctor `verification — 設計検証サイクルゲート [L0-L6] (全設計層) ✅ freeze 完了 → 検証サイクル発火可` を満たす。**per-layer の正規 Forward gate G0.5/G1/G3/G4/G5/G6 は gate-design §2 で PO サインオフ済 (G2 のみ DEFER)** = 受入の着地点はここ。本 band ゲートは検証ロードマップ固有の機械発火であって別建ての手動 accept ceremony は持たない (PO 2026-06-10 是正「フォワードのワークフロー上じゃない？」、PLAN-REVERSE-36)。2026-06-10 セッション跨ぎ再検証 clean (vitest 332 / typecheck・biome・doctor exit 0 / mojibake 0)、L0-L6 freeze 後の退行なし。A-118 で Phase 2 artifacts 全件見直し (stale/overclaim 修正)、残 placeholder_deps / roster / skill catalog / IMP-087/088 は明示 carry routing。A-122 の GreenDefinition / UT evidence history projection は設計補強済・実装は Phase 3/4 carry |
| Phase 3 (L7 自動化) | **検証サイクル完了** | src/ に複数機能実装済。`asset-drift`、relation-graph、dependency-drift、regression expansion、MCP profile、tool adapter、doc export pure core は L7 roadmap span で doctor / unit test に接続済。Phase 3 検証サイクルは `docs/handover/phase3-workflow-automation-verification-2026-06-11.md` に証跡化 |
| Cycle P4 (L7 DB) | **検証サイクル完了** | harness.db roadmap/review evidence projection は `PLAN-M-01-cutover-backfill` で completed。L8-L14 verification band execution は `PLAN-M-00-verify-cutover` + `.ut-tdd/audit/A-132-l8-l14-verification-band-execution.md` に証跡化済。L12/L13 の production / PO signoff は local band 外として `human_required=1` で記録 |
| 実装検証サイクルゲート (旧 GATE-B) / Phase 5-7 | **検証サイクル発火可 (機械)** | `VERIFICATION_GROUPS` に L0-L7 group 追加済 (PLAN-L7-43)。doctor が `verification — 実装検証サイクルゲート [L0-L7]` を surface |

> Phase 1 (L0-L3) は検証/改善サイクル完了。Phase 2 (L4-L6) は A-118 で全件見直し完了。ただし「no finding」ではなく、stale/overclaim を修正し、残 work を carry routing した完了である。今後の規範変更は Reverse/Recovery または add-design/add-impl の差分 PLAN を通す。roadmap は完了状態を反映する companion であり、freeze 権限元ではない。

### 実施した改善サイクル (ログ)

| 日付 | サイクル | 観点 | 主な結果 | 機能一覧への登録 |
|------|---------|------|---------|----------------|
| 2026-06-04 | Phase 1/2 検証 (PO /goal) | B (設計⇔テスト設計の同粒度) + A (workflow⇔設計対応) | **粒度対照性 (成熟度 caveat 付き)**: 既存 doc は 6 V-pair 中 5/6 で左右の構造が並行 (L2⇔L10 のみ右腕 doc 不在で ×)。**ただし主 Forward spine は L3 で停止中** = L1/L3/L4 PLAN 全 draft、L5/L6 は Add-feature slice の L5-05・L6-04・L6-05・L6-06 のみ confirmed。したがって L4⇔L9 / L5⇔L8 / L6⇔L7 の主 spine 部分は **draft 同士の構造並行**であって gate 凍結済の検証済対照ではない。**確定対照と言えるのは confirmed な Add-feature slice (L6-04/05/06 ⇔ L7-unit U-FSF/U-SETUP/U-HOVER) のみ**。L4-L6 主設計 (function-spec/edge-case/data/architecture 等) の粒度対照性 verify+improve は、当該層を Forward で実開発する **Phase 2 で本検証** (L3 停止中の現時点では暫定)。最小単位 L6 機能設計⇔L7 単体テスト設計は (slice では) ○。「L8 単体」は会話の言い違い (単体=L6作成/L7実施・結合=L5作成/L8実施 で doc 一貫)。軽微整合事項 = test-design の layer 表記非対称 / L1op frontmatter 欠落(本cycle修正) / U-RULE 束ね / ST-ASSET back-fill。**workflow⇔設計対応**: Forward は L0-L14 整合写像で pair-freeze 内蔵、非 Forward 8 mode は「出口 Forward 合流」で間接接続。critical = Add-feature×gate 境界 / Scrum→L8-L14 routing 欠落 / DISCOVERY-01 旧drive残存(本cycle修正)。 | IMP-037〜046 起票。本cycleで改善実施: IMP-038 (L1op frontmatter) / IMP-042 (DISCOVERY-01 drive V7) / IMP-039 (L2 mock=③ペア明文化) / IMP-043 (Add-feature×gate 境界明文化) / IMP-044 (Scrum 昇華経路正確化) / IMP-045 (Incident ③-first) / IMP-046 (Research layer 規則)。**IMP-037 (test-design layer 規約統一) のみ REVERSE-01/vmodel-lint へ routing 継続** |
| 2026-06-04 | **Phase 1 (L0-L3) 2巡目** (PO /goal「carry 整理と解消 + 2巡目完遂」) | A (workflow) + B (V-pair 同粒度) を L0-L3 へ再適用 + carry 棚卸し | **1巡目残課題の検証と新残差の解消**。観点A残差: roadmap §3 現状接地ドリフト (L2=placeholder→5 doc 実在、修正済) / gates G8-G14 機械化 PLAN 未起票 carry (IMP-052 登録) / Incident layer の §1.10 排他制約の読み方 (README 明文化) / recovery.md §6 正本二重 (IMP-060、PO 方針要) / DISCOVERY-01 S4 未実施→concept §2.5 promote ブロック (PO gate)。観点B残差: **IMP-037 (作成層 vs 実施層の layer 規約) は未解消継続** (4 doc 実施層 vs L7-unit 二重表記、IMP-059 として派生明示) / L1-operational §0 を L3-acc §0 と同形式の件数表へ統一 (IMP-053) / L3-acc §1.2 注記内訳統一 (IMP-054) / wireframe.md pair_artifact:(TBD) (IMP-058、IMP-037 波及)。**即時 carry**: agent-slots の release 漏れ (最後の slot 永久 running) を `sweepStaleGuardSlots`+SessionStart self-heal で構造解消 (IMP-057、U-SLOT-007 +3) / PLAN-L7-05 confirmed 化。検証: typecheck 0 / vitest 162 pass / biome CLEAN / doctor agent-slots OK / code-reviewer APPROVE。 | IMP-052〜060 起票。本cycle implemented: 053/054/055/056/057。triaged 継続 (PO/規約 gate): 037/058/059/060。observed: 052。**DISCOVERY-01 S4 + layer 規約 (037) は PO 判断要として handover §5 記録** |
| 2026-06-04 | **Phase 1 (L0-L3) 3巡目** (PO /goal「3件の問題を解消 + 3巡目刊行」) | 2巡目の PO 判断要 3件を解消 + 整合 sweep | **2巡目で「PO 判断要」とした 3件を PO「解消して」授権で解消**: ① **layer 表記規約 (IMP-037/059)** → `layer`=作成層(V-pair key=next_pair_freeze 一致) + `executed_at_layer`=実施層 の両保持に全 5 test-design 統一、規約を §2 明文化、L2 pair_artifact 確定 (IMP-058)。② **DISCOVERY-01 S4 confirmed** (decision_outcome=confirmed / promotion_strategy=reuse-with-hardening、dogfood 実績根拠) → concept §2.5 Discovery 定義に「確証なき設計」適用 + 合流点 L1/L3-L6 を promote (2巡目 FIND-A-02/A-07 同時解消)。③ **recovery 正本二重 (IMP-060)** → recovery-workflow.md を recovery.md へ統合 (トリガー分類/本線5-step/reopen可変/適用記録)、superseded 化、repository-structure §2 更新。**3巡目 sweep 残差** IMP-061 (.gitkeep stale) / IMP-063 (roadmap §2 self-pair 注記) も同 cycle 解消、IMP-062 は確認のみで verified。検証: typecheck 0 / vitest 162 pass / biome CLEAN / pmo-sonnet 整合 OK (A-1〜A-5) / code-reviewer 前置。 | IMP-061〜063 起票・全解消。implemented: 037/058/059/060/061/063。verified: 062。**Phase 1 の主要懸案 (layer 規約 / DISCOVERY-01 S4 / recovery 二重) を全クローズ** — 残 PO 判断要は 0 |
| 2026-06-04 | **Phase 1 (L0-L3) 4巡目** (PO /goal「A/B/C 実装+検証 + 4巡目完遂」) | 強制機構 A/B/C を実装し、新 lint で L0-L3 を再 sweep | **過去3巡で review 依存だった process 漏れを機械強制化** (plan lint engine を待たず CI vitest ベクトルに乗せ fail-close)。**A** = `src/lint/scrum-reverse.ts` (PoC confirmed⇔Reverse 合流、IMP-064)。**B** = backfill を doctor.ok hard-fail へ昇格 (IMP-051)。**C** = `src/lint/propagation.ts` (concept §2.6 ⇔ requirements §7.8.1 signal 語彙、IMP-065)。**新 lint が即 round-4 finding を2件検出・解消**: DISCOVERY-02 frontmatter `promotion_strategy` 欠落 (IMP-066) / forced_stop・design_uncertain の signal table 非対称 (両 governance sync)。discipline = L6-09 設計 + L7-10 実装 + REVERSE-09 back-fill (自 PLAN が自 lint を dogfood 通過)。検証: typecheck 0 / **vitest 177 pass** (+15) / biome CLEAN / doctor exit 0 (scrum-reverse・propagation OK)。 | IMP-066 起票・解消。IMP-064/065/051 を **machine-enforced (verified)** へ昇格。**3巡まで review でしか捕まらなかった漏れが、4巡目で CI hard-fail に変わった** = enforcement の質的転換 |
| 2026-06-04 | **Phase 1 (L0-L3) 検証/改善サイクル完了の記録** (PO「フィックス」) | サイクル終了 → Forward 側 freeze を反映 | **改善/検証サイクル 4 巡完走 (残 PO 判断要 0)。これを受けて Forward 側で L0-L3 freeze (G0.5/G1/G3) を PO 再確定サインオフ (A-100、正本記録 = gate-design §2)**。本書は freeze の権限元ではなく、サイクル完了とその結果を反映するのみ。Forward 側で実施されたこと: ① L1 設計 doc 5 + L3 設計 doc 4 (roadmap=living 除く) + L1/L3 PLAN 8 = 17 ファイル `status: confirmed` 化 ② gate-design §2 台帳の再確定 (旧 A-41/A-60 は正規式前スコープ) ③ L4-L6 (G4/G5) を park=要再評価へ rollback (RECOVERY-02 正規式で仕切り直し)。検証: vitest 177 pass / doctor exit 0。 | freeze 記録 (新 IMP なし)。本書の Phase 2 検証/改善サイクルは L4-L6 が Forward 設計降下された後に適用する (本書は先行起動しない) |
| 2026-06-09 | **Phase 2 (L4-L6) + GATE-A (現 設計検証サイクルゲート) readiness 補正** (Codex TL) | A (workflow/descent) + B (V-pair 同粒度) + source-isolation hard gate | **L4-L6 Forward 設計降下後の technical readiness を確認**。G4/G5/G6 は gate-design §2 で PASS、doctor は pair-freeze 38 pair 孤児0 / l6-fr-coverage 47FR / l6-completion G6 PASS / review-evidence OK / verification L0-L6 freeze 完了→検証サイクル発火可を surface。追加で **asset-drift hard gate** を実装し `.claude/agents` / `docs/skills` / `docs/templates/prompts` の legacy personal path residue、legacy command delegation residue、docs-skills vacancy、guard allowlist missing を検出対象化。現 repo は asset-drift OK。A-117 で、これは full no-finding substance audit の証明ではないと補正。 | A-116/A-117 追加。残 carry は L6 blocker でない IMP-087/088、placeholder_deps back-fill、relation-graph/dependency-drift/regression expansion、PO accept |
| 2026-06-09 | **Phase 2 full review 完了** (Codex TL) | L4-L6 design + L7-L9 test-design + PLAN inventory + prior audit findings | **Phase 2 artifacts を全件見直し**。対象 29 design/test-design doc は全件 confirmed、関連 PLAN 51件は全件 confirmed + review_evidence + tests_green_at。定量は doctor/typecheck/lint/test + pair-freeze/L6 completion/FR coverage/review ordering で確認。定性は workflow descent、L4/L5/L6 と L7/L8/L9 の整合、current-vs-future 境界、A-110/A-111 substance remediation を確認。発見: L7 historical draft wording、L9 placeholder_deps doctor overclaim、L4 asset-drift/roster stale wording、A-118 自体の定量/定性 bundle 記録不足。修正済。残る placeholder_deps dedicated rule / roster / full skill catalog / green-definition schema は A-118 で L7/L9 carry routing。 | A-118 更新。doctor/typecheck/lint/test pass。Phase 2 full review PASS / PO accept 待ち |
| 2026-06-09 | **Phase 2 pre-close feature hardening** (Codex TL) | automation + UT database + common/multi-agent lenses | PO question「自動化上 / UT database 化で不足はないか」に対し、Phase 2 close 前の追加棚卸しを実施。`placeholder_deps` dedicated rule、GreenDefinition、UT evidence history projection、DB collector/rebuild/migration、relation graph、skill injector metrics、team-run lifecycle、CI evidence matrix、guardrail/security invariants、meta-audit taxonomy を IMP-107..116 として起票。L5 physical-data §9.4、L6 test-before-review §8、L6 function-spec DB addendum を強化。 | A-122 / IMP-107..116。Phase 2 full review PASS は維持し、PO accept 前の explicit carry として Phase 3/4 PLAN seed へ routing。 |

---

## §6 配置・常時参照と back-fill 義務

### 配置 (PO 2026-06-04 確定)

本書は **設計ドキュメントレベル**の artifact として `docs/design/harness/L3-functional/roadmap.md` に置く。governance 昇格 (concept / requirements と同列の正本扱い) は取り下げた。V-model の標準 sub_doc (functional-requirement / business-requirement / nfr-grade) とは別の、L3 で起票する**設計層の計画 doc** (テスト設計と pair しない companion artifact) として扱う。

> **スキーマ補足**: 現 PLAN スキーマ (requirements §1.10.G.1) の L3 sub_doc enum は `business-requirement / functional-requirement / nfr-grade` の 3 種で roadmap 型を持たない。本書は sub_doc pair artifact ではないため `kind=design + sub_doc` の起票導線には乗らない。これを正式な design PLAN で機械追跡するなら sub_doc enum の扱い (拡張 or 非 sub_doc design doc の許容) を整理する必要がある → IMP-036 の back-fill で扱う。現行 `ut-tdd plan lint` は schedule/G1-trace/G3-trace を実装済みだが、本 roadmap 型の sub_doc schema 拡張はまだ対象外。

### 常時参照配線

PO 指示どおり次の 2 ファイルから**常時参照**させる:

- `CLAUDE.md` — Claude Code Read Order
- `AGENTS.md` — Core Reads

> governance 正本リスト (`CLAUDE.md` の「正本ドキュメント」節 / `docs/governance/README.md` の Current Source Of Truth) には**載せない** = 本書は governance 正本ではなく設計層の doc であるため。

### back-fill 義務 (follow-up)

PO 指示「要件定義の後に検証/改善ロードマップ構築フェーズを入れる」は、canonical Forward プロセスへの**フェーズ挿入**でもある。本書確定後、`docs/process/forward/` および requirements の該当 § へ **Reverse back-fill** で反映する (別 PLAN)。この未了作業は `docs/improvement-backlog.md` の **IMP-036** (observed) として登録済 (§1 改善サイクルの自己適用)。

---

## §7 関連 doc

- `docs/governance/ut-tdd-agent-harness-concept_v3.1.md` (L0 構想、§2.3 V-model)
- `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` (§1.4 layers / §1.10.G.12 backlog→ledger / §2.2 gate)
- `docs/design/harness/L3-functional/` (本書が属する L3 設計層 sub-doc 群)
- `docs/process/forward/overview.md` (V-model 概要、PROVISIONAL spike)
- `docs/improvement-backlog.md` (機能一覧 = 改善サイクルの sink)
- `docs/plans/PLAN-DISCOVERY-01-workflow-metamodel.md` (観点 A workflow 検証の正本)
