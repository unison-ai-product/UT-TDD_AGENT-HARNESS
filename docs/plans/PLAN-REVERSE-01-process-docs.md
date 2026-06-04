---
plan_id: PLAN-REVERSE-01-process-docs
title: "PLAN-REVERSE-01 (kind=reverse): docs/process 正本化 — DISCOVERY-04 dogfood 実績 (V1-V7) から forward/modes/gates を as-is 復元し gap を Forward へ routing"
kind: reverse
layer: cross
workflow_phase: R3
confirmed_reverse_type: design
drive: fullstack
status: confirmed
created: 2026-06-02
updated: 2026-06-02
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — as-is 復元 (R0-R2) + gap routing 確定 (R4)。別 runtime、claude-only 時は code-reviewer/pmo-sonnet 代替"
  - role: po
    slot_label: "PO — R3 Intent 検証 + V7 drive 概念 (§1.6 再設計) の判断"
generates:
  - artifact_path: docs/process/forward/
    artifact_type: doc_update
  - artifact_path: docs/process/modes/
    artifact_type: doc_update
  - artifact_path: docs/process/gates.md
    artifact_type: doc_update
dependencies:
  parent: null
  requires:
    - PLAN-DISCOVERY-04-process-workflows
  references:
    - docs/plans/PLAN-DISCOVERY-04-process-workflows.md
    - docs/plans/PLAN-DISCOVERY-01-workflow-metamodel.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    - docs/governance/repository-structure.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-REVERSE-01 (kind=reverse): docs/process 正本化

## §0 位置づけ

PLAN-DISCOVERY-04 (Discovery、S4 confirmed 2026-06-02) の **終点 Reverse** (§3.1)。Discovery で回した docs/process spike (forward L0-L14 + 駆動モデル9種 + gates) を、**dogfood 実績 (V1-V7) を evidence に as-is 復元し、gap を Forward 各層へ routing して正本化**する。

> **Discovery → Reverse 配線 (PO 確定、メタモデル標準)**: docs/process の正本は forward で机上起草せず、Discovery で回した実績から Reverse で再整備する。本 PLAN がその「再整備本体」。requirements §1.2 / DISCOVERY-01 §6 と同配線。

**confirmed_reverse_type = `design`** (既存 spike + dogfood 実績からの**設計復元**。Discovery 終点 fullback の文脈だが、reverse_type enum 上は観測契約抽出を要さない `design` 型)。design 型は **R1 (Observed Contracts) skip** 可 (§3.3)。

## §1 evidence (R0-R2 の入力)

| evidence | 内容 |
|----------|------|
| ① DISCOVERY-04 spike | `docs/process/{README, forward/*, modes/*, gates.md}` (PROVISIONAL、本 PLAN で正本化) |
| ② dogfood 実績 | DISCOVERY-04 §S2-S3: L1-L6 sub-doc ⇔ 実 PLAN 整合 / 実使用 mode frontmatter 整合 / V-pair 成立 |
| ③ gap register | DISCOVERY-04 V1-V7 (下記 §2) |
| ④ 移植元 | `vendor/helix-source/docs/v2/process/` + `helix-process/` (なぞり禁止、翻案元) |

## §2 gap register (R3-R4 で Forward へ routing)

| # | gap | forward_routing 候補 | promotion_strategy 候補 |
|---|-----|---------------------|------------------------|
| **V7** (最重要) | **`drive` 概念の歪み**: drive=専門職 (be/fe/fullstack/db/agent) だが §1.6 enum に mode 値 (scrum/reverse/poc/troubleshoot) が混在 + 「駆動モデル」と命名衝突 | **L3** (requirements §1.6 VALID_DRIVES 再設計 + concept §2.5/§2.6.4 用語分離 + DISCOVERY-01 metamodel) | redesign (drive 軸を専門職のみに再定義) |
| V3 | recovery drive: §1.6 `recovery→troubleshoot 固定` vs 実 PLAN-RECOVERY-01=fullstack。**V7 に包含** (recovery は work 専門職を継承) | L3 (V7 と同時) | (V7 従属) |
| V1 | `forward_routing` enum (L1/L3/L4/L5/gap-only) に helix の L7/L8-L11(fullback) routing が無い | L3 (requirements §3.4 / schema enum 拡張要否) | reuse-with-hardening or redesign |
| V2 | `docs/research/` が canonical tree 未登録だが research.md が参照 | L4→repository-structure (tree 追加 or docs/adr 寄せ) | reuse-with-hardening |
| V4 | L4/L5 の内部資産拡張 sub-doc (roster/skill/drift) が forward spike の sub-doc enum に未記載 | L3/L4 (sub-doc enum 拡張点注記) | reuse-with-hardening |

> V5/V6 (mode≠kind 非1:1 / phase 命名) は DISCOVERY-04 で翻案解決済 = gap でない。

## §2.1 追加 gap — 成果物契約/カバレッジ多角レビュー (2026-06-02、Reverse+Forward workflow、12/15 confirmed)

PO 問い「リバースは③テスト設計を引く仕組みか / フォワードも成果物契約は堅牢か / 設計書カバレッジは適切か」への多角検証 (各3レンズ並列→adversarial verify) で確定。**critical 1 (PLAN-REVERSE-01 frontmatter の confirmed_reverse_type 欠落 = validator fail-close) は本 PLAN に即修正済** (`c203d32`)。残りを routing 先別に記録。

| # | gap (severity) | 対象 | routing / 対処 |
|---|----------------|------|----------------|
| V8 | **(impt) Reverse が③テスト設計を引かない**: R2 as-is に③復元なし / R0 に既存テスト有無(`has_existing_tests`)調査なし / R4 gap-register に③不在(`missing_pair_artifacts`)追跡なし。helix 翻案時に test_design が丸ごと脱落 | reverse.md R0/R2/§3 + requirements §3.5 | 本 PLAN R2-R4 正本化で reverse.md に③復元stub追記 + §3.5 受入条件に「①あり③不在 layer は missing_pair_artifacts 必須記録→再入先 pair freeze 前にテスト設計PLAN起票」 |
| V9 | **(impt) Reverse 再入時の pair freeze gate 通過義務が未明記** (routing=L3→G3 / L4→G4 / L5→G5)。①だけ渡り③が宙に浮く誤読リスク (担保は Forward gate のみ) | reverse.md §4/§3 + requirements §3.5 (gate-design §1.1 は既定義) | 本 PLAN正本化で reverse.md §4 に「再入先 gate 通過義務」列 + §3 exit に「R4 routing確定後 再入先 pair freeze 通過まで L7 着手禁止」 |
| V10 | **(impt) generates 契約不全**: Reverse が③/④を産まない明示宣言なし / phase表に artifact_type 列なし | reverse.md + requirements §3.3/§1.7 | §3.3 に「kind=reverse の generates は design_doc/yaml_config 限定、test_design/test_code 含むと fail-close」+ reverse.md phase表 artifact_type 列 |
| V11 | **(impt) ③ test_design の所有 PLAN 未特定**: L1-01..05 が同一 pair_artifact を重複参照、`generates[]` に③所有者なし → pair freeze 機械検証が③所有を一意特定不可 | 各層 master hub の generates + §G.13 | §G.13 triage: 各層 hub に test_design generates 1件登録 (**L1-00/L3-00 hub 未起票** = 要起票 or 代表child) |
| V12 | **(impt) L4-L6 child 13件の `artifact_type=markdown_doc` が §2.1 `design_doc` 規則違反** (L1/L3 は design_doc、docs/design/配下を指すのに型不一致) | PLAN-L4-01..04 / L5-01..07 / L6-01..02 + §1.7 | normalization: 13 PLAN を design_doc 統一 + §1.7/§G.13 に「docs/design/配下=design_doc / plans自己参照=markdown_doc」明記 |
| V13 | **(impt) 設計書カバレッジ欠落**: セキュリティ/脅威モデル + arc42 §7 Deployment/§8 Cross-Cutting が architecture 必須§外 (現状 arc42 §4+§9 のみ)。G4 出口「threat model 確認」と機械検証成果物が未リンク | requirements §G.6 + G4 fail-close | §G.6 architecture 行に §脅威モデル(STRIDE簡易)/§デプロイ構成/§横断関心事 追記 + G4 検証項目化 (VALID_SUB_DOCS enum 追加は不要、必須§拡張で) |
| V14 | (minor) `L7-unit-test-design.md` の `layer: L7` (③は左腕L6帰属、`next_pair_freeze: L6` と矛盾) | docs/test-design/harness/L7-unit-test-design.md | layer:L6 + executed_at_layer:L7 に修正 |
| V15 | (minor) error/例外設計・データ移行設計の独立§不在 / 「評価系BR」定義不在(L3 skip条件) / L13 V-pair省略の記録薄 / G8-G14 fail-close が概念のみ | requirements §G + spike正本化 | 正本化時に §G.6/§G.13 拡張 + 注記。AP-7/AP-8(§2.7既定義)と G8-G14 接続 |
| V16 | (minor) gates.md cross-mode 注記 / forward overview §6 freeze 注記 / `REVERSE_ROUTING_GATE_MAP` (schema TODO、gate cmd 実装時) / pair_artifact を kind=design 条件付き必須に昇格(lint) | gates.md/forward/overview/src/schema/src/plan/lint.ts | spike正本化 + ut-tdd gate/lint 実装 PLAN |
| **V17** | **(impt) L2 skip ルールの正本間 drift**: requirements §1.10.G.3 (機械検証、L426) 「drive=be で L2 を skip無し→P1 warning (skip推奨)」が、**concept §3.7 (L740-754、2026-05-28 PO 修正「UI を持つ be は画面要求3必須=skipするな」) と矛盾**。§G.3 が旧 drive-binary 前提のまま §3.7 の UI-presence 二段ルールに未追随 | requirements §1.10.G.3 → §3.7 整合 | §G.3 を「**UI 有→画面要求3必須 (drive非依存) / wireframe のみ drive で省略可 / UI完全不在のみ全skip**」に書換。db 行追加 |
| **V18** | (minor) §G.3 drive×sub_doc ルールに **db が欠落** (be/fe/fullstack/agent のみ。§3.7 では db UI無→全skip / 管理画面→画面要求3必須) | requirements §1.10.G.3 | §G.3 に db 行追加 (V17 と同時) |
| **V19** | **(impt・設計判断) 「UI 有無」(=サービス特性) が first-class でない**: 「be(UI有)」と「be(BE-only)」を drive で区別できず skip_sub_doc 理由文で間接表現。L2 skip ライン (= 既に UI 有無=サービス特性で選択) が宣言的に駆動されない。data基盤/ML/infra 等の archetype は未分化 (UI 有無の二値のみ) | **PO 設計判断**: ①現状(drive proxy + skip理由) 据置 / ②UI-presence flag 一級化 / ③service_profile/archetype 軸新設 | 前回 workflow S1-S3 が射程。REVERSE-01 R4→L3 (requirements §1.6/§G) or 別 Discovery |

> **L2 skip 質問への回答 (2026-06-02)**: L2 スキップラインの正本は **concept §3.7 (UI 有無で引く)**。UI 完全不在 (be-only/db無UI) のみ全 skip、UI 有れば画面要求3は drive 非依存で必須 (wireframe のみ drive 省略可)。
>
> **V17/V18 修正済 (本 session)**: requirements §1.10.G.3 (drive×sub_doc 整合) を §3.7 に追随 (L2 画面要求3を UI 有無で判定・drive 非依存、be/db を UI 有無で分岐、reason テキストで弁別) + §G.13 L2 行 + §H.6 G1 entry/content (「5件全件」→「必須件、screen は UI 有り時のみ」) を同期。スキーマ変更なしの正本整合。
>
> **V19 deep workflow 結論 (archetype 全網羅、20/21 confirmed)**: 設計書は「固定普遍セット + サービス選択」の併存で**選択は既に発生**。drive 5種は Web/業務アプリ・API 専業には十分だが、データ基盤/ML/インフラ/CLI/ストリーミングには粗い (drive=専門職 ≠ サービス種別、§1.6 V7)。**推奨 = service_profile/archetype enum 新設は不採用 (NFR-07 過剰設計 + V7 と衝突)、代わりに (B) UI-presence の宣言化を段階導入** (第1段=reason テキスト判定で §G.3 駆動 [本 session 済] / 第2段=`has_ui` optional フィールド化 → **R4→L3 carry**)。非 Web archetype 固有観点 (lineage/モデル版/SLO/CLI 仕様等) は新 sub-doc を即足さず **PLAN-DISCOVERY-01 backlog (status=observed)** に登録し dogfood で詰まってから PoC 検証 (process-for-record / G0.5 triage バイパス回避)。

> **即修正済 (本 session、PO 確定 2026-06-02)**:
> - critical (confirmed_reverse_type、`c203d32`)
> - **V12**: L4-L6 の **16 child PLAN** (L4-01..04/11/12/13 + L5-01..07 + L6-01/02。workflow の当初 13 件想定に L4-11/12/13 を補完) を `markdown_doc`→`design_doc` 統一。master hub (docs/plans/ 自己参照) は `markdown_doc` 維持。requirements §1.7 に artifact_path×type 整合ルール明記。
> - **V14**: `L7-unit-test-design.md` を `layer: L6` + `executed_at_layer: L7` に修正。
>
> **routing 確定 (PO 2026-06-02)**: **V13** (設計書カバレッジ拡張 = 脅威モデル/arc42§7/§8) は本 PLAN **R4→`forward_routing=L3`** で requirements §G.6 改訂として処理。
>
> **V8/V9 spike 反映済 (本 session、reverse.md)**: reverse.md に **③ テスト設計復元機構 (§2.1: R0 既存テスト有無調査 / R2 as-is-test-design 逆復元 / R4 `missing_pair_artifacts`)** + **再入先 Pair freeze gate 通過義務 (§4: routing L1→G1/L3→G3/L4→G4/L5→G5、③ 不在のまま L7 着手禁止)** を追記。これで「Reverse がテスト設計を引かない」(発端の gap) を定義上解消。requirements §3.5 への**機械検証**反映は carry。
>
> **正本化(本PLAN R2-R4)/別PLAN carry**: V8/V9 の requirements §3.5 機械検証 + V10 (generates 契約 §3.3) / V11 (③所有 hub、L1-00/L3-00 起票) / V13 (R4→L3 §G.6) / V15/V16 (要件改訂 / lint 実装) / V19 第2段 (`has_ui` flag) / 非Web archetype (DISCOVERY-01 backlog)。reverse.md/forward/gates の PROVISIONAL→正本化は R2-R4 で。

## §2.2 駆動モデル全監査 — 発火点/収束点/起票ルール (2026-06-02、audit workflow 50 agents、37/45 confirmed)

ゴール「全駆動モデルの発火点と収束点・PLAN起票ルールを見直し不備をなくす」の横断監査。**鉄則**: modes/*.md は PROVISIONAL、規範変更は concept/requirements (正本) 先行 → modes へ下ろす。下記は実ファイル裏取り済。

### A. 本 session 修正済 (doc整合 / 副作用ゼロ fail-close / 正本既存意図の実装)
- **incident.md 誤記**: Reverse fullback `F0-F4`(HELIX 旧) → `R0-R4` (`confirmed_reverse_type=fullback`)。
- **Incident 2-PLAN 分割明記**: incident.md §2 に「hotfix=troubleshoot(token=L7) + 復旧=recovery(token=RECOVERY)、recovery が troubleshoot を requires/references で連鎖、恒久対策は reverse fullback」を起票導線として明記。
- **scrum.md 発火 signal**: `requirement_continuous_refinement` 追記 (README §4 整合)。Scrum↔Discovery は frontmatter 非区別=mode 入口識別 を明記。
- **Add-feature 起票 fail-close**: `frontmatter.ts` に `add-design→L3-L6 / add-impl→L7` ガード追加 (§1.3 強制、副作用ゼロ)。
- **scrum_type 実装** (要求の実装漏れ解消): `VALID_SCRUM_TYPES` 6種 + `scrum_type` フィールド + S3以降必須 superRefine + 既存 poc PLAN backfill (DISCOVERY-01/02/04=design-spike) + test。
- **発火点 named signal** (機械判定漏れ解消): requirements §7.8.1 + concept §2.6.1 に Discovery (`requirement_undefined`/`feasibility_unknown`/`success_condition_unclear`) / Research (`tech_decision_required`/`option_comparison_needed`/`adr_required`) / interrupt (4分岐 routing) 追加。`runaway`=`agent_runaway` alias を明記 (正規化)。
- **Research 必須 role**: requirements §1.8 に `kind=research→tl 必須` 追加 (validator は §1.8 全体と同じく lint engine 側で実装、frontmatter.ts は intra-record 限定の設計)。
- **docs/research/ 実体化**: `.gitkeep` + repository-structure 登録。
- **plan_id mode legibility 明文化**: §1.10.A に「横断駆動3種=mode token / layer-bound=layer token+kind 識別」を意図的設計として確定 (scrum_type は 6 仮説タイプで Discovery/Scrum 区別軸でない旨も訂正)。
- **runaway**: §7.8.1/§2.6.1/README で `agent_runaway` alias に統一。

### B. PM アーキ判断で確定 (PO 後追認可、unilateral だが正本/V-model 根拠あり)
- **forward_routing は 5 値 (L1/L3/L4/L5/gap-only) で確定 (拡張せず)**: Reverse は必ず設計層に再入し ①⇔③ pair-freeze (G1/G3/G4/G5) を通すのが V-model 規律。L7/L8-L11 直 routing は pair-freeze バイパス違反 (helix の緩いモデル)。「実装だけ」は L5 経由、fullback 文書整合は対象③の設計層 or gap-only。§3.4 + reverse.md §4 に理由明記。**旧 V1 の「enum 拡張要否」は本判断で close**。
- **plan_id token 拡張は行わない (現設計で確定)**: 横断駆動3種=mode token / layer-bound mode=layer token+kind 識別 が意図的設計 (§1.10.A)。

### C. lint engine 実装に委ねる (src/plan/lint.ts stub 解消時、cross-record 検証)
- **mode exit の機械検証**: Scrum の Reverse fullback 昇華 / Incident の昇華 PLAN 起票 / Recovery の resume_layer / Research の ADR→Forward 接続 / Reverse 再入先 pair-freeze 通過。exit 条件自体は各 mode §3 + §3.5 に明記済、**cross-record 検証は §1.8 必須role・§1.10 C-E と同じく lint engine 側で実装** (frontmatter.ts は intra-record 限定の既存設計、本 session で新規欠陥ではない)。
- Recovery resume_layer / Research ADR 接続フィールドの要否も lint engine PLAN で確定。

### D. 残る PO 判断 (任意の将来拡張、現状は確定済で blocking でない)
- **Discovery/Scrum の frontmatter 区別が必要になった場合**の `poc_mode` 新設 (現状は mode 入口識別で足り、scrum_type は別軸=仮説タイプ)。

## §2.3 連携(連鎖)パターン網羅 + ケーススタディ監査 (2026-06-02、chaining audit workflow 24 agents、3/11 confirmed)

10 mode (Forward + 8 + Research) を有向遷移グラフ化し、各 §6「他 mode との連鎖」/ §4 合流点 / signal routing / interrupt 分岐から **88 連鎖エッジ**を抽出。gap 候補 11 件を敵対検証 → **3 件 confirmed (全て reciprocal 非対称、軽微) / 8 件棄却**。

### A. 本 session 修正済 (reciprocal 非対称 = 片側 mode の §6 にしか書かれていない連鎖を相手側へ補記、1行追記)
- **Retrofit→Reverse** (Important): retrofit.md は「依存更新の影響評価で Reverse(`upgrade`) を前段起動」と書くが reverse.md §6 に Retrofit が呼び出し元になる記述が無かった → reverse.md §6 + README §5 に reciprocal 追記。
- **Incident→Discovery** (Important): README §5 は「要件未確定なら Incident 前段に Discovery」と書くが incident.md §6 本体に無かった → incident.md §6 に前段行を追記 (既存「post-deploy trigger」行と方向が逆である旨も明示)。
- **Research→Discovery** (Minor): research.md は「作れるか不明→Discovery 切替」と書くが discovery.md §6 に reciprocal が無かった → discovery.md §6 に切替行を追記。

### B. 敵対検証で棄却 (= 既に記述済 or 設計上意図的に不在、欠陥でない)
- **Discovery↔Scrum 相互**: 両者の §6 + README §4 に双方向記述あり (密度差であって欠落でない)。
- **Recovery→再開 layer**: governance/recovery-workflow.md §2.1 に reopen point 5 区分テーブル (L1/L3・L4-L6・L7・commit のみ・gap-only) + 判定主体 (Step2 PO/Step3 TL) + 記録先 (PLAN §6) が既定。Reverse の forward_routing と同等粒度。
- **Recovery→Incident 分岐**: recovery.md §6 + README §4 に `env=prod`/`regression_prod`→Incident が明記 (recovery-workflow.md 本体に無いのは文書スコープ分担で正)。
- **Refactor 前段 Discovery/Reverse**: 意図的不在。Refactor 入口は「振る舞い不変が確定」が条件で、不確実性は到達前に別 mode へ routing される (README §5 が Incident/Add-feature のみ明示=意図的選択)。
- **Research→Scrum / Research fullback**: 意図的不在。Research は ADR 文書のみ出力 (実装物なし) で Reverse fullback 不要、Scrum へは `requirement_continuous_refinement` signal の 2 step 経由 (直接連鎖を足すと入口 signal 分離が壊れる)。

### C. ケーススタディ (end-to-end 走行例) — PO 判断事項として escalation
- **現状: 全 10 mode・governance・README を通じて複数 mode 横断の走行シナリオ (walkthrough) は皆無** (synth は Critical 評価)。ただし敵対検証は **PROVISIONAL SPIKE の意図的先送り**と判定 (docs/process/README §4 + forward/overview §8 が「正本化=走行確認は終点 Reverse の dogfood 実績から行う」と明記)。
- よって**欠陥ではなく「未着手の予定作業」**。**作成時期 (今 / REVERSE-01 正本化と同時 / 後続) は PO 判断**。synth 推奨の最初の 3 本 = ① Reverse fullback→Forward 再合流 (drift 起点) / ② Recovery 収束→再開 layer 確定→Forward 再開 / ③ Discovery confirmed→Scrum→Reverse fullback→L1。

## §2.4 右腕/テスト戻し/Forward PLANルール + GitHub統合 監査 (2026-06-02、2 verify workflows、6+0 confirmed)

ゴール延長 (PO 連続質問: テスト戻し / 右腕カバー / Forward PLAN ルール / GitHub 運用統合) の検証。**鉄則の追加**: 「ハーネス開発 (今の作業=個人/solo/main直)」と「ハーネス利用 (チーム/branch-default)」を混同しない ([[feedback_harness_dev_vs_harness_usage]])。branch-default は製品が利用者に課す仕様であって開発手順ではない。

### A. 本 session 修正済 (spike consistency、副作用ゼロ)
- **L11 戻しの schema 矛盾是正** (Critical): 右腕差し戻し表が「L11→L1/L3 add-design」と書くが add-design は L3-L6 限定 (frontmatter.ts fail-close) で **L1 add-design は exit 1**。表を「L3=add-design / L1=kind=design 新規 PLAN」に分岐 (L08-L14-verification-phase.md §右腕差し戻しルール)。schema 変更なし=既存 doc を schema 正本に整合させる修正。
- **L13/L14 戻し欠落補完** (Critical/Important): 差し戻し表 L8-L12 のみ→ L13 (smoke 全断→`regression_prod`→Incident / 軽微→L12 再デプロイ)、L14 (観点不足→次サイクル L1/L3 / 重大 NFR→Incident or L1) を 2 行追加 + L13→Incident 橋渡しを明示。
- **正本化 carry note 追記**: L10-L14 は spike 拡張、正本 concept §3.1.5 は L8/L9 のみ である旨を表下に明記 (→ その後 **下記 B で concept §3.1.5 を L8-L14 に正本化**し、本 note は「正本化済・concept §3.1.5 のミラー」へ更新済)。

### B. 正本化 (REVERSE-01 R2-R4 で実施済、正本先行)
- ✅ **concept §3.1.5 を「右腕工程の差し戻しルール (L8-L14)」へ改訂済** (2026-06-02): L10-L14 差し戻し (L10→L2 / L11→L3(add-design)・L1(design) / L12→L3/L7 / L13→Incident(`regression_prod`) / L14→L1/L3・Incident) を正本へ昇格、各先を V-pair に対応づけ + 右腕 CI 失敗→Issue 自動起票 (§6.8.4) を接続。spike (L08-L14-verification-phase.md §右腕差し戻しルール) は正本ミラーに格下げ、requirements §6.8.4 の参照も §3.1.5 正本へ更新。

### C. PO 判断 + 移行必須 (独断実装不可)
- **kind×layer guard 未強制** (Important): frontmatter.ts は charter→L0 / add-design→L3-L6 / add-impl→L7 のみ enforce。**design/impl/refactor/retrofit/troubleshoot/research に上限 layer ガードが無く `kind=design,layer=L12` 等が schema を通る**。右腕 L8-L14 は PLAN authoring 対象外 (実行専用) という設計意図が機械強制されていない。[[project_kind_drive_matrix_not_enforced]] と同枠。**実装前に既存 PLAN 全件 layer 値の破壊なし検証 + PO 確認必須**。

### D. GitHub 運用の工程統合 (G-1/G-2/G-3 = 全件「実欠陥でない」と確定)
- **私の 3 候補は敵対検証で全否定 (意図的分離 = 補助2軸)**: git 統制は concept §2.2 の「補助2 = 全経路共通基盤」で V-model layer/gate と**直交**する独立層。branch×kind×harness-check で requirements §6 に完結定義。solo→team は **§6.5 Phase 0-A (solo, Branch Protection 無) / Phase 0-B (team, CODEOWNERS)** が既定。execution mode は review tier を制御し git topology は Phase が制御 (直交)。→ 工程に git を埋め込まないのは欠陥でなく設計。
- **ただし critic が実ギャップ 4 件を発見 (工程↔git の"接続点"未記述、製品が利用者チームに課す配線)**: 【high】3 段階 freeze ↔ PR/merge timing / mode 連鎖時の branch 切替 (poc/*→Reverse→feature/*) / L7 7step ↔ commit 粒度 / Reverse・Recovery の branch 処置。

### E. 本 session 正本化済 (PO GO 2026-06-02、TL review GO-with-fixes 反映)

PO 連続指摘「PLAN 起票時の branch/commit/PR/Issue タイミングを決定論化、特に off-Forward、Issue 起票」を受け、**Issue=問題起点スパイン**として requirements に新設:

- **§6.8 PLAN git ライフサイクル**: Issue 起点スパイン (Forward も発注元 Issue 起点) / 1 Issue=1 PLAN/hub=1 branch 粒度 / status×freeze→git アクション対応表 / **右腕 CI 失敗→Issue 自動起票→差し戻し** (TL Critical fix) / **設計 PLAN 完了 PR で vmodel-lint 必須** (G1-G6 を CI 担保、hook bypass 防止、TL Important fix)。
- **§6.9 CI 起動単位とコスト方針**: 無料枠 (private 2,000分/月・public 無制限) / **CI アンカー=G7** / 設計=PLAN・hub 完了で 1 回 / 右腕=post-merge / poc=非 CI / **workflow paths フィルタ禁止→job if + dorny/paths-filter + aggregator** (pending 永久ブロック回避、TL Critical fix + 公式 doc 裏取り) / Merge Queue 不採用 (Free private 不可) / harness-check.yml 雛形。
- **schema**: `github_issue_id` (optional, 正の整数) を frontmatter base に追加 + test (close 漏れ機械検知の足場)。
- **mode README §6**: mode 別 git ライフサイクル要約表を追記 (正本は §6.8/§6.9)。

**TL 相談記録 (Codex TL 不在→ code-reviewer + pmo-tech-docs 代替、cross-agent 不在を明示)**: 判定 **GO-with-fixes** (Critical 0 / Important 4 を本文に反映済)。tech 裏取りで「single aggregator harness-check が pending 問題の正式回避策」「Merge Queue は Free private 不可」「段階的 CI は Fowler 原則と整合」を確認。**残 carry**: 右腕 CI 失敗→差し戻しの Accept 時間窓の精緻化、signal→Issue 自動起票の webhook 化 (Phase 0 は手動 default) は将来 PLAN。関連 [[feedback_harness_dev_vs_harness_usage]]。

## §3 工程表 (R0-R4)

### Step R0: Evidence Acquisition

- §1 evidence を収集・整理 (spike 群 + dogfood 実績 + gap register + 移植元)。
- 状態: ✅ §R0 実績参照 (drive 使用集計 + spike + DISCOVERY-04 §S2-S3)。

### Step R1: Observed Contracts (design/fullback 型は skip)

- confirmed_reverse_type=`design` のため **skip** (§3.3、RG1 を持たない)。skip 理由 = 設計復元 (既存 spike + dogfood 実績) であり観測契約抽出工程を要しない。
- 状態: ✅ (skip 記録済)

### Step R2: As-Is Design

- spike (forward/modes/gates) を「現状あるべき定義」として整理。dogfood で「回った」部分 (V-pair / sub-doc 整合 / mode frontmatter) を as-is 正本候補に昇格。
- 状態: ✅ §R2 実績参照 (現 §1.6 drive enum 9 種 + 実 PLAN drive 使用 as-is)。

### Step R3: Intent Hypotheses (po 検証必須)

- gap register (V1/V2/V4/V7) の「あるべき姿」仮説を作成。**特に V7 (drive 再設計) は PO 検証必須** (§1.8 R3→po)。drive=専門職のみ / mode 値分離 / recovery は work 専門職継承 の方向を PO 確認。
- 状態: ✅ **V7 intent (A-G) 起草 + self-review (APPROVE-with-fixes 是正) + PO 方向確定 (drive=専門職、2026-06-02) → §R3-impl で実装**。V1/V2/V4 intent は R4 で詰める。

### Step R4: Gap & Routing (forward_routing + promotion_strategy 必須)

- 各 gap の `forward_routing` (大半 L3=requirements) + `promotion_strategy` を確定。docs/process/{forward,modes,gates} の正本昇格 + recovery-workflow.md 移管判断 (repository-structure §2)。
- 状態: ✅ **完了 (2026-06-04、PO 委譲「全リバースの検証・実行で完全クローズ」)**。V7 = `forward_routing=L3` + `redesign` 実装済 (§R3-impl)。**残も完遂**: V1 = forward_routing 5 値で確定 (拡張せず、§3.4/reverse.md §4 に理由、line 122 で close) / V2 = `docs/research/` を repository-structure tree へ登録済 (memo 未投入のため [予定]、tree 未登録 gap は解消) / V4 = 内部資産拡張 sub-doc (roster/skill/drift) を requirements §1.10.G.1 に拡張点注記 / **docs/process {forward,modes,gates} 16 ファイルの PROVISIONAL→正本化済** (banner + body、grep PROVISIONAL = 0)。

### Step R-review: self-review 前置 (MUST)

- PO へ R4 routing 確定を求める前に code-reviewer / pmo-sonnet で as-is 復元の正確性・gap routing の妥当性を self-review (claude-only の tl 代替)。
- 状態: ✅ **R3 intent を code-reviewer self-review = APPROVE-with-fixes (Critical 1 + Important 3 是正済)**:
  - (Crit) §R0 集計数 35→34 是正 (glob 実数 + 件数合計一致を明記)
  - (Imp-1) 案D に troubleshoot/recovery kind の matrix 扱い + modes/README Incident/Recovery 行を明示
  - (Imp-2) 案G③ に requirements §1.1 poc variant サンプル `drive:scrum` 修正を追加
  - (Imp-3) 案G③ に modes/README 台帳 drive 列 (Discovery/Scrum/Reverse/Recovery/Incident) 更新を明示
  - (Minor) REVERSE-01 自己適用明記 / agent 代替の orchestration_mode 差 / Scrum drive 方針 追記
  - good practice: §G 2 フェーズ破壊回避 / V3→V7 包含 / mode↔drive 命名分離を評価

## §R0-R3 実績 (2026-06-02、V7 = drive 軸再設計を先行駆動)

V7 (最重要 gap) は他 gap と独立に解決可能なため R0→R2→R3 を先行駆動した (R1 は design 型 skip)。

### §R0 evidence (drive 使用実態)

全 PLAN の `drive` 集計 (34 PLAN = `docs/plans/PLAN-*.md` glob 実数、下表件数合計 18+9+4+2+1=34 と一致):

| drive | 件数 | 種別 | PLAN |
|-------|------|------|------|
| `fullstack` | 18 | **専門職** | L4/L5/L6 design + RECOVERY-01 |
| `be` | 9 | **専門職** | L1/L3 design + L5-03 |
| `db` | 2 | **専門職** | L4-01 / L5-01 |
| `poc` | 4 | **mode 値** | DISCOVERY-01/02/03/04 (kind=poc) |
| `reverse` | 1 | **mode 値** | REVERSE-01 (kind=reverse) |
| `fe` `agent` `scrum` `troubleshoot` | 0 | (be/db/fullstack 以外の専門職 + 未使用 mode 値) | — |

→ **mode 値 drive (poc/reverse) を使う PLAN は 5 件のみ。scrum/troubleshoot は未使用**。専門職 drive (be/db/fullstack、29 件) は変更不要 = migration は小規模。

### §R2 as-is (現 §1.6 drive)

`src/schema/index.ts` `VALID_DRIVES` = `[be, fe, fullstack, db, agent, scrum, reverse, poc, troubleshoot]` (9 種)。専門職 5 + mode/状況値 4 が混在。kind×drive matrix: poc→scrum/poc、reverse→reverse、recovery→troubleshoot、troubleshoot→troubleshoot (= mode 値固定)。§1.6 説明文で `scrum=仮説検証` と誤ラベル。

### §R3 intent — drive 軸再設計案 (PO 検証対象、R3 gate)

> **方針 (PO framing「drive=専門職」)**: drive = 「どの専門職/専門エージェントを招集するか」のみ。mode 概念 (入口パターン) は駆動モデル (§2.5、modes/) が担い、drive から分離する。

**A. VALID_DRIVES = 専門職 5 種のみ**: `[be, fe, fullstack, db, agent]`。**削除**: `scrum / reverse / poc / troubleshoot` (= mode/状況値、drive でない)。

**B. drive 定義 (§1.6 改訂文)**: 「その PLAN にどの専門職/専門エージェントを招集するか (owner_role / mandatory_agents / orchestration_mode を決める)」。`scrum=仮説検証` 等の mode 説明を削除。

**C. 横断駆動 kind (poc/reverse/recovery) の drive**: 探索/逆引き/復旧 **対象 work の専門職を宣言** (継承)。技術モジュール対象なら its specialist、harness methodology/process 対象なら `fullstack` (UT-TDD harness = TS fullstack) を default。→ V3 決着 (recovery→対象専門職、PLAN-RECOVERY-01=fullstack が正)。

**D. kind×drive matrix 改訂**: **全 12 kind** (charter/design/impl/add-design/add-impl/refactor/retrofit/research/poc/reverse/recovery/troubleshoot) → `be/fe/fullstack/db/agent` のいずれか (対象 work の専門職)。旧 mode 値固定 (poc→scrum/poc / reverse→reverse / **recovery→troubleshoot** / **troubleshoot→troubleshoot**) を全廃止。
- **recovery kind**: 旧 `recovery→troubleshoot` 固定行を削除 (PLAN-RECOVERY-01=fullstack を合法化、V3 決着)。
- **troubleshoot kind**: 旧 `troubleshoot→troubleshoot` を削除し障害対象の専門職に。Incident mode (kind=troubleshoot+recovery 内包) の意味分けは **drive でなく kind/mode 側で担保** (drive は「誰が直すか」)。
- → **modes/README 台帳の Recovery 行 (`drive=troubleshoot`) / Incident 行 (`drive=troubleshoot`) も専門職継承へ更新対象** (§G に含む)。

**E. mode↔drive 分離 (concept §2.5/§2.6.4)**: 駆動モデル (mode) = 入口パターン。drive = 招集専門職。Discovery/Scrum は共に exploratory mode だが drive は対象専門職。命名も「駆動モデル」と「drive」を区別 (用語集更新)。

**F. 既存 PLAN migration (5 件、poc/reverse → 専門職)**:

| PLAN | 現 drive | 新 drive (案) | 根拠 |
|------|---------|--------------|------|
| DISCOVERY-01 (workflow metamodel) | poc | `fullstack` | harness methodology = UT-TDD TS fullstack work |
| DISCOVERY-02 (roster module) | poc | `fullstack` | roster は harness 内部 module (L4/L5 roster PLAN も fullstack) |
| DISCOVERY-03 (skill module) | poc | `fullstack` | skill は harness 内部 module |
| DISCOVERY-04 (process docs) | poc | `fullstack` | process methodology = harness work |
| REVERSE-01 (process docs、本PLAN) | reverse | `fullstack` | 同上 (**本 PLAN 自身を自己適用**。実装①で本 PLAN frontmatter も書換) |

> 代替案 (PO 判断): 純 methodology の DISCOVERY-01/04・REVERSE-01 は `agent` も候補。本案は既存 harness design PLAN (全 fullstack) + RECOVERY-01 (fullstack) との一貫性で `fullstack` 統一を default とした。`agent` は concept §2.6.4 で `orchestration_mode=pm_lead` 系 (AI 実装・保守) を注入、`fullstack` は `claude_design_impl` 系を注入する差があり、PO は注入 mode の観点でも比較可。
> **Scrum mode の drive**: Scrum (kind=poc) も Discovery 同様、対象 work の専門職を drive とする (mode=反復で固める入口、drive=誰が実装するか、で分離)。

**G. 実装順序 (R4 routing 後、L3 で破壊回避)**:
1. **先に 5 PLAN の drive を migration** (poc/reverse→fullstack、frontmatter)。
2. `VALID_DRIVES` から mode 値 (scrum/reverse/poc/troubleshoot) 削除 + kind×drive matrix 改訂 (`src/schema/index.ts` + requirements §1.6 表)。
3. **正本文書の追随修正** (削除前提の記述を全洗い): ① **requirements §1.1 poc variant サンプル YAML の `drive: scrum`** → 専門職値 / ② concept §2.5 mode 表 + §2.6.4 drive×layer injection の drive 説明 / ③ `docs/process/README.md` §1 drive 表 (是正済) / ④ **`docs/process/modes/README.md` 台帳の drive 列** (Discovery=`poc`→fullstack / Scrum=`scrum`→専門職 / Reverse=`reverse`→fullstack / Recovery=`troubleshoot`→継承 / Incident=`troubleshoot`→継承)。
4. frontmatter test + plan-id-naming 回帰。
- **順序逆 (enum 削除を先) だと既存 PLAN が即 fail** (driveSchema zod parse。DISCOVERY-04 V3 衝突リスクと同根)。なお kind×drive matrix 違反は **現状 schema 未実装** (frontmatter.ts は将来実装) のため、matrix 改訂は doc 正本先行 + 実装は別途。

**R3 gate (PO 検証必須)**: 上記 A-G を PO が承認 → R4 で `forward_routing=L3` + `promotion_strategy` 確定 → L3 design PLAN (requirements §1.6 改訂) として実装。

### §R3-impl — V7 実装記録 (2026-06-02、PO 方向確定 drive=専門職)

PO が drive=専門職の方向を確定 (DISCOVERY-04 S4 + V7 連続指摘) し、goal 駆動で本 session に §G 順序で実装 (可逆・本番影響なし、PO 追認/調整可)。`forward_routing=L3` / `promotion_strategy=redesign` (drive 軸を専門職のみへ再定義)。

| # (§G) | 実装 | 対象 |
|--------|------|------|
| ① | 5 PLAN の drive migration (poc/reverse→fullstack) | DISCOVERY-01/02/03/04 + REVERSE-01 (自己適用) |
| ② | `VALID_DRIVES` を 5 種 (専門職) に縮小 | `src/schema/index.ts` (単一正本、§1.10.F) + test fixture 3 箇所 |
| ③a | §1.6 表 (5種) + kind×drive matrix (全12kind→専門職) + V7 注記 | requirements §1.6 |
| ③b | §1.1 / §1.1.reverse サンプル `drive:scrum`/`reverse`→fullstack、§1.10 enum 数 9→5 | requirements §1.1/§1.10 |
| ③c | drive 表・台帳 drive 列 (Discovery/Scrum/Reverse/Recovery/Incident=専門職継承) | docs/process/README.md + modes/README.md + 各 mode 早見表 |
| ④ | frontmatter + plan-id-naming 全回帰 | vitest **71 pass** |

**残 (本 PLAN 継続分) → ✅ 完遂 (2026-06-04)**: V1 (forward_routing 5 値で確定・拡張せず close) / V2 (docs/research tree 登録済) / V4 (内部資産拡張 sub-doc を §1.10.G.1 に注記) の R4 routing + **docs/process/{forward,modes,gates} 16 ファイルの PROVISIONAL→正本化済** (grep PROVISIONAL = 0)。concept §2.6.4 は enum を requirements に委譲のため追随不要 (drive=専門職の含意は §1.6 で確定)。

**R3 最終クローズ (2026-06-04、PO 委譲 + intra_runtime_subagent + 客観 evidence)**: V7 (drive=専門職) は PO 方向確定済 (2026-06-02)。V1/V2/V4 + PROVISIONAL外し は as-is 復元 = redesign でなく実績の正本昇格であり新規判断を含まない (V1 は 5 値確定が V-model pair-freeze 規律に grounded、V2/V4 は注記、PROVISIONAL外し は dogfood 実績の正本化)。**PO 追認事項** (① migration default=fullstack ② mode↔drive 呼称分離) は用語/既定値の軽追認で blocking でない (carry)。R3 intent 充足、クローズ。
**PO 追認事項**: ① migration default = fullstack (代替 agent 可) / ② mode↔drive の呼称分離 (用語集) は未了。

## §4 Forward 合流

R4 routing 確定後、docs/process/{forward,modes,gates} を **L3 要件正本**として確定 + V7 を requirements §1.6 へ接続 (drive 軸再設計)。recovery-workflow.md の docs/process 移管も判断。

## §5 成否

- 正本化完了: forward/modes/gates が PROVISIONAL を外れ正本化、V1-V7 が Forward 各層 (主に L3 requirements §1.6) へ routing され閉塞。
- open 残: V7 (drive 再設計) が requirements §1.6 改訂を要する場合は L3 design PLAN へ blocks。

## §実装計画

| 項目 | 情報源 |
|------|--------|
| as-is 復元 (R0-R2) | DISCOVERY-04 spike (docs/process/*) + §S2-S3 dogfood 実績 |
| gap 仮説 (R3) | DISCOVERY-04 V1-V7 + requirements §1.6 (drive) / §3.4 (forward_routing) / repository-structure (tree) |
| routing 確定 (R4) | concept §2.5/§2.6 (mode↔drive) / requirements §1.5/§1.6 / DISCOVERY-01 metamodel |
| drive 再設計 (V7) | PO framing (drive=専門職) + concept §2.6.4 layer-context injection (owner_role/mandatory_agents) |
