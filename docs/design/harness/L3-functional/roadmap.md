---
doc_type: roadmap
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

# UT-TDD Agent Harness — 検証 / 改善ロードマップ (v0.1)

> **位置付け**: 本書は「**要件定義 (L3) が出揃った後に、どの順番で・どの粒度で harness 自身を検証し改善していくか**」を定義する **設計ドキュメントレベルのロードマップ** (PO 2026-06-04) である。L3 マイルストーンで起票する設計層の計画 doc として `docs/design/harness/L3-functional/roadmap.md` に置く。concept / requirements のような governance 正本ではなく、また V-model の標準 sub_doc (テスト設計と pair する artifact) でもない、**L3 設計層の計画文書**。scope は L0-L14 横断だが起票点は L3。CLAUDE.md / AGENTS.md が**常時参照**する。
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
              L7 実装  ← Phase 3 (workflow 自動化) / Phase 4 (DB 統合)
```

> **L11 は Phase 5 と Phase 6 の共有層** (overlap は意図的)。Phase 5 では L11 を「観点 A: 右腕テスト実施が機能するか」の総合レビューとして、Phase 6 では L11 を「観点 B: L3⇔L12 / L1⇔L14 の要件巻き取り trace の起点」として扱う (§3 Phase 5/6 参照)。

| V-pair | 左腕 (設計) | ③ テスト設計 | 右腕 (実施) |
|--------|------------|--------------|-------------|
| L1 ⇔ L14 | 要求定義 | 運用テスト設計 | 運用検証 |
| L2 ⇔ L10 | 画面設計 | ワイヤーモック自体 | UX 磨き |
| L3 ⇔ L12 | 要件定義 | 受入テスト設計 | デプロイ+受入 |
| L4 ⇔ L9 | 基本設計 | 総合テスト設計 | 総合テスト |
| L5 ⇔ L8 | 詳細設計 | 結合テスト設計 | 結合テスト |
| L6 ⇔ L7 | 機能設計 | 単体テスト設計 | 実装スプリント内 |

出典: requirements §1.4 VALID_LAYERS / docs/process/forward/overview.md。

---

## §3 フェーズ詳細

各フェーズは §1 の 1 改善サイクルを回す。entry = 前フェーズ exit (Phase 1 は L3 要件定義 confirmed)。

### Phase 1 — L0〜L3 検証 / 改善サイクル

- **対象**: L0 企画 / L1 要求 / L2 画面 / L3 要件 (左腕上段)。
- **検証**: 観点 A (L0-L3 に関わる mode の workflow が動くか) + 観点 B (L1⇔L14 運用TD / L3⇔L12 受入TD / L2⇔L10 mock が同粒度か)。
- **このフェーズの追加任務**: §1 の観点 A/B を全フェーズ共通テンプレートとして**確定・明文化**する (PO が Phase 1 を「検証対象 + 観点定義の場」と指定)。
- **出力**: 課題/アイディア → improvement-backlog。
- **現状接地**: L0=concept_v3.1 既済 / L1=draft (5 sub-doc) / L2=placeholder / L3=draft (3 sub-doc)。

### Phase 2 — L4〜L6 改善サイクル

- **対象**: L4 基本設計 / L5 詳細設計 / L6 機能設計 (左腕下段)。
- **検証**: 観点 B (L4⇔L9 総合TD / L5⇔L8 結合TD / L6⇔L7 単体TD の同粒度) + 観点 A。
- **現状接地**: L4-L6 設計 PLAN は多数 draft、L6 は一部 confirmed (session-log / forced-stop / setup / handover)。L4/L5 テスト設計 doc は欠落 (要起票)。

### GATE-A — L0〜L6 総合見直し改善サイクル

- **対象**: 左腕全体 (設計降下 + テスト設計)。
- **判定**: L0-L6 の横断 trace 整合 (G0.5/G1/G2/G3/G4/G5/G6 の概念ゲートが全層で閉じるか)、設計⇔テスト設計の同粒度がバンド横断で保たれるか、Phase 1-2 で backlog 登録した課題が verified へ到達したか。
- **fail-close**: 孤児 (片側のみのペア) が残るバンドがあれば Phase 1/2 へ差し戻し。

### Phase 3 — L7 ワークフロー自動化の実装 / 改善サイクル

- **対象**: L7 実装 (谷) のうち **harness ワークフロー自動化** = `ut-tdd` CLI / hook / `plan lint` (現 stub) / gate 機械検証 / クロスチェックエンジン (IMP-033)。
- **検証**: 観点 A を**実装で裏付ける** (workflow が doc 上だけでなくコードで動く)。L6⇔L7 単体テスト設計の TDD Red 先行。
- **現状接地**: src/ に session-log / forced-stop / setup / handover / doctor / agent-guard 実装済。plan lint は stub、gate 自動検証は未。

### Phase 4 — L7 データベース統合の実装 / 改善サイクル

- **対象**: L7 のうち **state DB 統合** = `.ut-tdd/state` の二層 schema、V-model 整合 (孤児 0) の機械保証、PLAN/handover/ledger/backlog の state 化。
- **検証**: 観点 B の機械保証を DB 側で完成させる ([[feedback_vmodel_state_db_completeness]])。doctor / vmodel lint が未充足ペアを fail-close 検知。
- **現状接地**: handover は CURRENT.json で機械ポインタ化済。state DB 本体・登録トリガ (FR-L1-07 hook) は未。

### GATE-B — L0〜L7 総合改善サイクル

- **対象**: 左腕 + 谷 (設計 → 実装) の縦断。
- **判定**: G7 (4 artifact trace: ①設計 ⇔ ②実装 ⇔ ③テスト設計 ⇔ ④テストコード の 8 directed edge + coverage) がバンド横断で閉じるか。Phase 3/4 の自動化・DB が観点 A/B を機械保証するか。

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

## §4 ゲート位置 (2 つの横断ゲート)

| ゲート | 位置 | 束ねる範囲 | 通過条件 (概念) |
|--------|------|-----------|----------------|
| **GATE-A** | Phase 2 の後 | L0〜L6 (左腕) | 設計降下 + テスト設計の横断 trace 整合・同粒度・backlog verified 到達 |
| **GATE-B** | Phase 4 の後 | L0〜L7 (左腕 + 谷) | G7 4-artifact trace の縦断整合 + 自動化/DB による観点 A/B の機械保証 |

両ゲートとも fail-close: 未充足バンドがあれば該当 Phase へ差し戻す。判断ゲートのため **po-gate** + review 前置 (別 runtime `frontier-reviewer` / 単体 mode は `intra_runtime_subagent`) を通す。

---

## §5 現在地 (2026-06-04)

| Phase | 状態 | 備考 |
|-------|------|------|
| Phase 1 (L0-L3) | **進行中** | L0 済 / L1-L3 draft。観点 A/B の明文化 (本書 §1) が当面の任務 |
| Phase 2 (L4-L6) | 部分着手 | L6 一部 confirmed、L4/L5 設計 draft + テスト設計欠落 |
| GATE-A | 未 | — |
| Phase 3 (L7 自動化) | 部分着手 | src/ に複数機能実装済。**ただし `src/plan/lint.ts` は stub = §1.10 PLAN 起票ルールが未強制 (当面 .claude/CLAUDE.md の人手 binding)**、gate 自動化も未 |
| Phase 4 (L7 DB) | 未 | handover ポインタのみ機械化済 |
| GATE-B / Phase 5-7 | 未 | — |

> 現在は **Phase 1 の渦中**であり、L0-L6 の設計・実装が並走している。本ロードマップはこの並走を「バンド単位の改善サイクル」に整列させる。

### 実施した改善サイクル (ログ)

| 日付 | サイクル | 観点 | 主な結果 | 機能一覧への登録 |
|------|---------|------|---------|----------------|
| 2026-06-04 | Phase 1/2 検証 (PO /goal) | B (設計⇔テスト設計の同粒度) + A (workflow⇔設計対応) | **粒度対照性**: 6 V-pair 中 5/6 が左右対照 (L6⇔L7 / L5⇔L8 / L4⇔L9 / L3⇔L12 / L1⇔L14)、L2⇔L10 のみ右腕 doc 不在で × (モック=ペア方針未明文化)。最小単位 L6 機能設計⇔L7 単体テスト設計は○。監査中に会話で「L8 単体」と表現したが全 doc は「単体=L6作成/L7実施・結合=L5作成/L8実施」で統一済 (doc 不整合なし)。軽微整合事項 = test-design の layer 表記非対称 / L1op frontmatter 欠落(本cycle修正) / U-RULE 束ね / ST-ASSET back-fill。**workflow⇔設計対応**: Forward は L0-L14 整合写像で pair-freeze 内蔵、非 Forward 8 mode は「出口 Forward 合流」で間接接続。critical = Add-feature×gate 境界 / Scrum→L8-L14 routing 欠落 / DISCOVERY-01 旧drive残存(本cycle修正)。 | IMP-037〜046 起票。本cycleで改善実施: IMP-038 (L1op frontmatter) / IMP-042 (DISCOVERY-01 drive V7) / IMP-039 (L2 mock=③ペア明文化) / IMP-043 (Add-feature×gate 境界明文化) / IMP-044 (Scrum 昇華経路正確化) / IMP-045 (Incident ③-first) / IMP-046 (Research layer 規則)。**IMP-037 (test-design layer 規約統一) のみ REVERSE-01/vmodel-lint へ routing 継続** |

---

## §6 配置・常時参照と back-fill 義務

### 配置 (PO 2026-06-04 確定)

本書は **設計ドキュメントレベル**の artifact として `docs/design/harness/L3-functional/roadmap.md` に置く。governance 昇格 (concept / requirements と同列の正本扱い) は取り下げた。V-model の標準 sub_doc (functional-requirement / business-requirement / nfr-grade) とは別の、L3 で起票する**設計層の計画 doc** (テスト設計と pair しない companion artifact) として扱う。

> **スキーマ補足**: 現 PLAN スキーマ (requirements §1.10.G.1) の L3 sub_doc enum は `business-requirement / functional-requirement / nfr-grade` の 3 種で roadmap 型を持たない。本書は sub_doc pair artifact ではないため `kind=design + sub_doc` の起票導線には乗らない。これを正式な design PLAN で機械追跡するなら sub_doc enum の扱い (拡張 or 非 sub_doc design doc の許容) を整理する必要がある → IMP-036 の back-fill で扱う。当面 `ut-tdd plan lint` は stub のため強制されない。

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
