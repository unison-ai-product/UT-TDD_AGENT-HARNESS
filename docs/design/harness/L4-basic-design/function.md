---
layer: L4
sub_doc: function
status: confirmed
pair_artifact: docs/test-design/harness/L9-system-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L9
plan: docs/plans/PLAN-L4-03-function.md
v2_import: docs/migration/v2-import-ledger.md
---

> **SSoT 参照**: 構造 (集約) = [data.md](./data.md) / 方式 (module・依存) = [architecture.md](./architecture.md) / 上流 FR = [L3 functional-requirements](../../../design/harness/L3-functional/functional-requirements.md) / 様式 = arc42 §5 (functional building block) + IEEE 1016 §5 ([document-system-map](../../../governance/document-system-map.md) §2)。本 doc は L3 FR を**どの機能単位で実現するか**を担い、構造/方式は data/architecture に委ねる。
>
> **用語更新 (G.9) / 機能要求更新 (G.10) の所在**: per-工程 delta は生成元 [PLAN-L4-03](../../../plans/PLAN-L4-03-function.md) の §6/§7 に記録 (data.md/architecture.md と同規約)。
> **V-pair**: `pair_artifact = L9-system-test-design.md` は L4 sub-doc 群の集合 pair (PLAN-L4-00-master 経由)。

# UT-TDD Agent Harness — L4 基本設計: 機能設計 (Function)

L3 functional の FR 26 件 + P1 carry 10 件を **機能 building block** (arc42 §5) に分解する (PLAN-L4-03-function)。各機能は architecture.md の module に配置され、data.md の集約を操作する。

## §1 機能カテゴリ分類

L3 FR 26 件 (FR-01〜18 + FR-45 + FR-23〜27 / FR-29 / FR-30) を 11 カテゴリに grouping。**FR-28 は L3 に存在しない** (workflow core = FR-23/24/25/26/27/29/30 の 7 件、L3 §1 注記)。

| カテゴリ | 含む FR | 操作する集約 (data.md) | 主担当 module (architecture.md) |
|---|---|---|---|
| **C1 PLAN 管理** | FR-01 / FR-04 / FR-24 | Plan | cli + plan + schema |
| **C2 TDD・gate・trace** | FR-02 / FR-03 / FR-05 / FR-13 | Artifact / Workflow | cli + vmodel + doctor |
| **C3 state・hook** | FR-06 / FR-07 | Plan / Artifact / Workflow (state hook 横断、data.md §8) | runtime + (将来 hook) |
| **C4 mode routing** | FR-08 | Workflow | runtime(detect) + doctor |
| **C5 workflow エンジン** | FR-13〜16 / FR-23〜27 / FR-29 / FR-30 | Plan / Workflow | `src/workflow/contracts.ts` + `src/workflow/readiness.ts` |
| **C6 AI ガード** | FR-09 | (操作なし、検証) | runtime(agent-guard、既存) |
| **C7 検出 doctor** | FR-18 / FR-11 | 全集約 (横断) | doctor + lint |
| **C8 CI 連携** | FR-17 | Workflow / Artifact | (将来 CI 配線) |
| **C9 doc-review** | FR-45 | Artifact | (将来 review module) |
| **C10 文脈注入** | FR-12 | Plan | `src/skills/recommend.ts` + `src/workflow/contracts.ts#suggestSkillInjection` |
| **C11 Recovery** | FR-10 | Workflow / Handover | (将来 cutover) |
| **C12 内部資産 (roster/skill/command)** | FR-L1-46 / FR-L1-47 / FR-L1-48 | Plan (agent_slot) のみ — roster/skill は**集約なし** (in-memory scan-on-demand、fs 正本、data.md §1/§8) | `src/runtime/agent-slots.ts#resolveRosterCapability` + `src/skills/recommend.ts` + `src/assets/catalog.ts` + cli |

> 11 → **12 カテゴリ** (C12 = 内部資産 roster/skill/command を A-85 で追加、Recovery PLAN-RECOVERY-01 / FR-L1-46/47/48 / BR-22。**skill (FR-L1-47) の building block は architecture §3.1 skills 行 (PLAN-L4-12)**、roster/command (FR-L1-46/48) は本 doc §1.1 が正本)。L7 完遂時点の実装証跡は C2(vmodel/doctor lint 群) + C4(detect) + C5(workflow contracts/readiness) + C6(agent-guard) + C10(skill recommend/injection) + C12(roster/skill/asset catalog) + review/cutover/builder CLI surface。**26 件マップ漏れ 0** (FR-01〜18 + FR-23〜27 + FR-29 + FR-30 + FR-45)。C12 は L1 FR-L1 由来 (L3 では §3 carry 宣言、内部資産設計増分)。

### §1.1 C12 内部資産 roster の機能 building block (FR-L1-46/48、ADR-004 準拠)

ADR-004 の **層1 markdown 正本 / 層2 TS 統制**境界に従う。TS は markdown を**生成でなく検証/注入/統制**する。本 §1.1 は C12 のうち roster/command (FR-L1-46/48、function 面)。**skill pack (FR-L1-47)** の building block は architecture §3.1 skills 行 (PLAN-L4-12) に分離。

| 機能 | 層 | building block | 内容 |
|---|---|---|---|
| **roster registry** | 層2 (TS) | `src/runtime/agent-slots.ts#resolveRosterCapability` | `.claude/agents/*.md` (層1 正本) の frontmatter (model family / capability) を読み、roster metadata を構築。subagent の存在・属性の SSoT |
| **capability class 解決** | 層2 (TS) | roster module | **FR-L1-46 の機能**: subagent を capability class (PMO/PdM/review/...) に分類。FR-L1-37 (model 推挙) へ入力を提供する**連携先**だが、FR-L1-37 自体は C12 実装対象外 (別境界 = PLAN-L4-NN-model-suggestion、§6 P1 carry) |
| **guard allowlist 統合** | 層2 (TS) | runtime (agent-guard 既存) が roster を読む (`runtime → roster` 一方向、循環なし) | roster が allowlist の **SSoT** (受動提供)、agent-guard が **enforcement** (能動参照、実装済 15 種 allowlist + model family 一致 fail-close)。roster と guard の二重定義を排除 |
| **subagent 本文** | 層1 (markdown) | `.claude/agents/*.md` | prompt 本文は markdown 正本のまま (TS literal 化しない)。legacy source 前提 (絶対パス / legacy runtime command direct call) 除去は drift lint (FR-L1-49) の fail-close 対象 |
| **command** | 層2 (TS) | cli (§2 内部資産 command) | 内部資産操作の CLI subcommand (roster 一覧 / 整合確認 / asset カタログ)。各 subcommand の関数粒度は L6 で確定 (back-fill) |

> **roster ↔ guard の関係 (依存方向、Critical-1 是正)**: agent-guard.ts は既存実装 (subagent_type allowlist 15 + model family 一致、fail-close)。roster registry はその allowlist の **設計上の SSoT** を `.claude/agents/*.md` 群から構築する層 (依存先 = schema/fs のみ、guard に依存しない)。統合は **agent-guard (runtime) が roster を読む = `runtime → roster` の一方向**で実現 (循環なし、architecture §3.1)。
> **roster / guard integration status (Critical-2 closure)**: agent-guard keeps the fail-close allowlist enforcement path. The roster capability resolver is implemented as `src/runtime/agent-slots.ts#resolveRosterCapability`, guard/asset consistency is checked through `src/lint/asset-drift.ts`, and stale L7-waiting placeholders are blocked by the dedicated `placeholder-deps` doctor gate. The former implementation-state bridge is closed.
> **粒度 (L4=L9 総合テスト)**: 本 §1.1 は「内部資産 roster が system として動く」を L9 総合テスト粒度で束ねる。各 subcommand signature / capability resolver アルゴリズム / model family 解決の関数粒度は **L5 (module 結合) → L6 (関数仕様=単体テスト設計) で段階分解** (PLAN-L4-11 §3、L5 を挟む)。L4 で書けない関数仕様は placeholder + 依存 (`waiting_layer: L6`) として残し back-fill (PLAN-L4-10 §0.1)。

### §1.2 C2 trace の descent-obligation building block (FR-03 / FR-L1-03、PLAN-L6-35 add-design)

C2 (TDD・gate・trace) の FR-03 (V字双方向 trace) は当初「宣言された pair link の照合」(`vmodel pair-freeze` / `trace check`) として実装された (document-driven)。これは **在る成果物の link 整合**は見るが「**在るべき下流/pair 成果物の不在**」を検出できない (absence-blindness)。A-136 後の skill 片肺 (impl 着地済だが L6 単体テスト設計不在) がこの穴を素通りした。

本 building block は FR-03 の **降下完全性 (抜け漏れ検出)** を absence-detecting に強化する:

| 機能 | 層 | building block | 内容 |
|---|---|---|---|
| **層隣接 obligation matrix** | 層2 (TS) | lint (descent-obligation) | `document-system-map.md §1` の層×成果物×V-pair を機械可読 rule (descent/pair × condition) に集約 (SSoT、現状 6 lint に暗黙分散していた隣接規則を単一化) |
| **上流駆動 obligation 生成** | 層2 (TS) | lint + relation-graph 再利用 | 上流 (要件 FR) + matrix から「在るべき下流/pair 成果物」を生成し、不在を fail-close。下流の自己宣言に依存しない (pair-freeze の一般化) |
| **defer ledger + impl-ahead ガード** | 層2 (TS) | lint + placeholder_deps (physical-data §7) | open defer を `(traceKey, waitingLayer, dischargeCondition, owner)` で台帳化。src 着地済 + 未 discharge defer = impl-ahead 違反 (impl→設計 back-fill 未完の機械検出) |

> **粒度 (L4=L9 総合テスト)**: 本 §1.2 は「降下鎖が層を取りこぼさず system として閉じる」を L9 総合テスト粒度で束ねる。各関数 signature / obligation 生成アルゴリズム / defer 有効性判定は **L5 (module 結合) → L6 (関数仕様=単体テスト設計) で段階分解** (機能設計 = `descent-obligation.md`、③ ペア = L7-unit §1.22 U-DESC)。lint 実装 + harness.db `descent_obligations` projection + doctor 配線は L7 (別 add-impl PLAN、Codex 委譲)。

## §2 CLI コマンド面の機能 building block

FR → `ut-tdd` サブコマンドの対応 (architecture.md cli module に集約、副作用端点)。

| コマンド (将来形) | 実現 FR | 現状 | 操作 |
|---|---|---|---|
| `ut-tdd status` | FR-13 | **実装済** (scaffold) | mode 検出表示 |
| `ut-tdd plan draft/lint/delete` | FR-01 / FR-04 / FR-24 | 実装済み (段階拡張) | `plan lint` は schedule 最小強制 + `--gate governance/frontmatter` の PLAN frontmatter/cross-record 厳格検査 + `--gate G1-trace/G3-trace` の trace gate を提供。doctor は governance debt を warning-first で件数 surface |
| `ut-tdd sprint start/check` | FR-02 | 未 | TDD 強制 (Red→Green→refactor 順序、本体実装前 Red 必須 fail-close) |
| `ut-tdd gate <G-ID>` | FR-05 / FR-13 | 実装済み (段階拡張) | execution mode 別 review-tier 判定 + deterministic static gate 合成。G1/G3 trace、G2/G4/G5/G6 layer pair、G7 4 artifact evidence + coverage summary を JSON 証跡化 |
| `ut-tdd trace check` | FR-03 | (vmodel lint で部分) | 4 artifact 双方向 trace |
| `ut-tdd doctor` | FR-18 / FR-08 / FR-11 | **実装済** (scaffold) | 横断検出集約 + routing |
| `ut-tdd route eval --signal <s> --format json` | FR-08 / FR-L1-12 | **実装済** | signal を mode へ解決し、人間向け `suggest_command` と機械契約 `recommended_command` (RecommendedCommandV1) を分離して返す。escalation 境界は mode 非依存で human approval 必須に昇格する |
| `ut-tdd reverse --type` | FR-14 / FR-23 | 未 | Reverse / fullback R0-R4 |
| `ut-tdd incident open` | FR-16 | 未 | 緊急 hotfix 経路 |
| `ut-tdd interrupt / resume` | FR-11 | 未 | 割り込み制御 |
| `ut-tdd review --uncommitted` | FR-45 | 実装済 | doctor + verification-profile による review packet 生成 |
| `ut-tdd skill suggest` | FR-12 | 実装済 | harness.db の plan/layer/drive context から L 別 skill 推挙 |
| `ut-tdd route --mode` | FR-08 | 未 | 手動 mode 切替 (S-03) |
| `ut-tdd cutover --to` | FR-10 / FR-26 | 実装済 (dry-run / approval gate) | ロールバック計画と事前 check を出力。実適用は human-approved runbook 必須 |
| `ut-tdd roster list/check` | FR-L1-46 | 未 (roster module 実装前は guard ハードコード allowlist で動作継続、移行段階 = §1.1 note / ST-ASSET-07) | 内部資産 subagent roster 一覧 / .md↔guard allowlist 整合確認 |
| `ut-tdd asset catalog` / `ut-tdd builder catalog` | FR-L1-48 | 実装済 | 内部資産 (skill pack / command / builder) カタログ (porting-map W11/W12/W16) |

> コマンドの Precondition/Postcondition (DbC 契約) は L5 D-API で確定 (§8 carry)。各 subcommand の関数粒度 signature は L6 機能設計 (=仕様設計) で単体テスト設計粒度に分解 (back-fill、PLAN-L4-11)。

## §3 workflow オーケストレーション機能 (Forward spine + 9 駆動モデル + 2 工程専門)

FR-12〜16 / FR-23〜30 の workflow を機能単位で外部設計する。この harness の**中核価値 = 適切なオーケストレーションで開発コストを下げる (CLAUDE.md 柱 5)** の本体であり、L4 では各 mode の **外部から見える設計 (入口 signal / 状態遷移 what / 出口 contract / 担当 building block / gate)** を確定する。状態遷移の内部ロジック (pseudocode) ・CLI signature は §3 末尾で L5/L6 へ明示 defer (正規 carry = under-design ではない)。設計の操作詳細の正本は `docs/process/modes/*.md` (9 mode spike)、本 §3 はそれを L4 外部設計粒度に確定したもの。

> **mode taxonomy (IMP-069 reconciled、PO 2026-06-05「Forward=spine」確定)**: canonical 構成 = **Forward spine (主線、合流先) + 駆動モデル (entry mode、9 種) + 工程専門 (screen/frontend、2)**。9 駆動モデル = `docs/process/modes/` の 9 = Discovery / Scrum / Reverse / Recovery / Incident / Refactor / Retrofit / Add-feature / **Research** (Forward を除き Research を含む)。**Forward は駆動モデルの 1 つでなく、全駆動モデルが出口で合流する終着 (spine)**。旧 §3「10 mode」(Forward を mode に算入) は解消。
> **legacy framing との橋渡し (重要、カウント混乱防止)**: concept §2.5 の「**9-mode ecosystem**」表は別グルーピング = **Forward + 8 (Research 除く)** で数えたもの。本 §3 の「9 駆動モデル」とは **同一 universe を起点違いで数えた表記差** (9-mode = Forward 起点 / 9 駆動モデル = entry 起点 + Research)。両者の対応の正本 = `docs/process/modes/README.md §3`。L5 以降で mode を数えるときは **本 §3 の「Forward spine + 9 駆動モデル + 2 工程専門」を operational 正本**とする。L9 ST-FUNC ペアも本構成。

### §3.1 駆動モデル (entry mode) の外部設計 — 9 種

各駆動モデルは状況 signal で発動し、固有 phase/step を経て、**出口で必ず Forward spine の特定 L 工程へ合流**する (concept §2.5)。kind は §1.3 VALID_KINDS、非1:1 対応は §3.2。

| 駆動モデル | kind | 入口 signal | 状態遷移 (phase/step + 各 what) | 出口 contract → Forward 合流先 | gate / 人間サインオフ |
|---|---|---|---|---|---|
| **Discovery** | poc | `requirement_undefined` / `feasibility_unknown` / `success_condition_unclear` / `design_uncertain` | S0 backlog 構築 → S1 sprint plan + AC 確定 → S2 PoC 実装 → S3 verify 実行 → S4 decide (decision_outcome 記録) | **confirmed** = verify 成功必須 → L1 要求 or L3-L6 設計 + 終点で Reverse 昇華。rejected/pivot は backlog 記録 | S3 verify fail-close (失敗を completed にしない) / S4 decision |
| **Scrum** | poc | `user_feedback_iteration` / `requirement_continuous_refinement` | S0 product backlog → S1 sprint backlog + AC → S2 increment (1 PLAN) → S3 ユーザーレビュー + retro → S4 受入判定 ↺ | S4 受入 pass **かつ Reverse fullback で V 昇華完了**まで exit しない → L1/L3/L4/L5 (L8-L14 不可、IMP-044) | S4 受入 (informal) + Reverse R4 |
| **Reverse** | reverse | `drift` (schema/contract) / Discovery 終点 / Scrum increment 完了 / drift-check 横断検出 | R0 evidence 収集 + has_existing_tests 調査 → R1 observed contracts → R2 as-is design + ③逆復元 → R3 intent 仮説 + gap (po 検証) → R4 gap & routing | R4 `forward_routing` 確定 + ③テスト設計状態確定 + 再入先 pair-freeze gate 義務明示 → **L1/L3/L4/L5/gap-only** (5値、L7/L8-L14 除外) | R3 po 検証 fail-close / R4 routing / 再入先 G1/G3/G4/G5 |
| **Recovery** | recovery | `agent_runaway` / `context_exhaustion` / `regression_dev` / `runaway` / **`forced_stop`** | (phase なし) 収束 5 step: 全事象収集 (a/b/c/d 分類) → PO 提示・認識確認 → reopen point 特定 → top-down 修正 → fullback | reopen point 確定 + **再発防止 doc (root cause + guard/test/rule/hook 具体変更 + L14 route) 作成済** → 中断 L 工程へ復帰 / 再発防止 → L14 | **tl (reopen 確認) + po (スコープ承認) 人間サインオフ必須**。`doctor` forced-stop 検出 (fail-open) |
| **Incident** | troubleshoot + recovery (内包) | `production_incident` / `hotfix_required` / `regression_prod` (env=prod) | (phase なし) 6 step: 検出 → トリアージ → hotfix (kind=troubleshoot PLAN) → 即リリース → 収束確認 (kind=recovery PLAN) → 事後昇華 | hotfix 暫定収束 (SLO/KPI 正常化) + 恒久対策 Forward 昇華 PLAN 起票 + postmortem → **L12/L13、恒久策 → L1-L6 (Reverse 経由)、postmortem → L14** | **オンコール + tl + pm 三者サインオフ必須**。`harness-check` サブセット CI |
| **Refactor** | refactor | `debt_degradation` / `code_smell` / `structural` | (phase なし) 5 step: 保護網 (golden master) → 小ステップ変更 → テスト緑確認 → commit → 反復 | 振る舞い不変 (L8/L9 全件緑) + 負債解消記録 + G7 directed edge 欠落なし → **L7 内部完結 (L1/L4 設計不変)**。振る舞い変化検出 → Add-feature/troubleshoot/Incident へ切替 | G7 (directed edge 維持) |

> **Refactor brush-up extension (2026-06-23)**: Refactor の Green は「テストが通った」だけではなく、`assertRefactorInvariant` が before/after behavior 一致、regression exit_code=0、linked `test_id` ありを満たすこと。`harness.db` の `findings` / `quality_signals` / `feedback_events` / `impact_results` / `artifact_progress` は Refactor 発火元として使えるが、DB は projection であり authoring source ではない。relation-graph の required action (sibling test、L6 contract review、paired design update、DB rebuild check) が残る間は Red として扱い、Yellow は PLAN 登録済みかつ regression fence 未完了/依存確認中、Green は test-ID-linked evidence と impact closure 済みを意味する。
| **Retrofit** | retrofit | `dependency_outdated` / `upgrade` / `config_drift` | (phase なし) 5 step: 現状把握 → 影響評価 (retrofit-matrix) → 移行計画 → 段階移行 → 検証 (L8 回帰 + 性能 + DB 整合) | 回帰全件緑 + 性能維持 + DB 整合 + matrix 完了 → **L7、アーキ/DB 変更時 L4/L5 追補、要件変化時 L1/L3 (Add-feature 併用)** | `doctor --preflight upgrade` (fail-close) / G7。config_drift は **tl サインオフ必須** |
| **Add-feature** | add-design + add-impl (内包) | `feature_addition` / `scope_extension` | (phase なし) step 集合: 影響範囲特定 → (A 要件追補 / B 後送) → add-design (parent 必須) → add-impl (parent 必須) → テスト確認 → V 整合 | 追補が工程 doc 反映 + G7 孤児0 + 既存テスト緑 + `dependencies.parent` 設定済 → **既存 parent PLAN へ接続。経路 B (最頻): G7 trace 凍結は Reverse G3 通過後まで保留** | G7 (孤児0) / 経路 B は G3 (Reverse 完了後) |
| **Research** | research | `tech_decision_required` / `option_comparison_needed` / `adr_required` | (phase なし) 5 step: 調査課題定義 → 候補調査 → 比較評価 → ADR 記録 → research-memo | ADR (ADR-NNN) 記録完了 + Forward 接続先確定 (L1 or L4 を ADR 内に明記) + research-memo 保存 → **L4 基本設計 or L1 要求の判断材料**。「作れるか不明」→ Discovery 切替 | gate = 人間 (ADR PR レビュー)。**機械化条件は明示 defer** (G? 未割当 → IMP-052、§3.7 carry。doc-only で完了にしない) |

> **Discovery / Scrum → Reverse 昇華の機械着地先 (F-3、可視化)**: §3.1 の Discovery 出口「終点で Reverse 昇華」/ Scrum 出口「Reverse fullback で V 昇華完了まで exit しない」は **doctor `checkScrumReverse` (scrum-reverse lint) が機械 enforce 済** — 「confirmed poc は Reverse 合流済」を検査し、Reverse 無き poc 完了を surface する。出口 contract が doc-only でなく機械担保される (柱 2)。
> **定量テスト → 定性レビュー順序 (全駆動モデル普遍、IMP-077 / IMP-108)**: 上表の各駆動モデルの状態遷移は **定量 verify step → 定性 review/サインオフ step** の順 (Discovery=S3 verify→S4 decide / Scrum=increment テスト→S3 レビュー / Reverse=③テスト設計状態確定→R4 / Incident=収束確認→postmortem / Refactor=テスト緑確認→commit / Retrofit=L8 回帰→exit / Add-feature=テスト確認→V 整合 / Research=候補比較→ADR)。共通機械アンカー = `review_evidence.tests_green_at ≤ reviewed_at` を doctor `checkReviewEvidence` が fail-close (concept §2.1.2.1 核心ルール 6)。2026-06-23 以降の confirmed/completed review evidence はさらに `review_evidence.green_commands[]` で command / runner / scope / exit_code=0 / evidence_path / output_digest を持つ。未検証成果物、または green command 証跡が再現不能な成果物をレビュー済み green と扱わせない。

### §3.2 signal → mode routing (優先度モデル、FR-08)

検出 signal は `runtime(detect)` + `mode-routing.yaml` を介して駆動モデルへ自動 routing される。`ut-tdd route eval --signal <s> --format json` はこの routing の公開 surface として、mode 解決結果、表示用 `suggest_command`、実行契約 `recommended_command` (RecommendedCommandV1) を返す。`.ut-tdd/config/route-map.yaml` または `--route-map` 由来の command も `ut-tdd` 始まりのみ許可し、legacy runtime command name が混入した場合は exit 1 として runnable command を返さない。route-map config テキスト自体も legacy DB / 個人絶対パスを含めば exit 1 として、`.ut-tdd/` state / `.ut-tdd/harness.db` projection 境界から外れた依存を許可しない。`requires_human_approval=true` の経路は `.ut-tdd/config/approval-policy.yaml` を解決し、未解決/未承認なら exit 1 として `.ut-tdd/audit/route-approval.jsonl` に block 記録を残す。signal が escalation 境界 (本番影響/認証/認可/決済/PII/ライセンス/destructive 等) を含む場合、route eval は `escalation_boundaries[]` を返し、route mode に関係なく `requires_human_approval=true` に昇格する。`mode: "*", condition: "escalation"` または該当 mode の approval rule が無ければ exit 1 とする。**失敗 routing の全順序 (total order、concept §2.6 / gate-design §1.1 正本)** — 複数の失敗系 signal が競合したときの解決順:

Route helper は `route eval` と同じ route-map / 最長 token 優先で解決する。`drift` は reverse、`new_requirement` / `po_change` は add-feature、incident route は要件 §7.8.1 の `production_incident` / `hotfix_required` / `regression_prod` をすべて `mode=incident` として扱い、承認未解決時は `ut-tdd doctor` 推奨を返しつつ exit 1 にする。複数 token が同時に一致した場合は最長 token を優先し、`regression_prod` が汎用 `regression` に吸われて Reverse へ誤 routing されることを防ぐ。

```text
Incident (env=prod 障害) > Recovery (暴走/forced_stop/dev 回帰) > Reverse (drift) > Refactor (劣化)
```

この 4 mode は**失敗 routing の優先度を持つ** (gate fail / 劣化 signal が競合したら上位を採る。例: env=prod 障害 + drift 同時 → Incident)。他の駆動モデル (Retrofit/Add-feature/Scrum/Research/Discovery) は**固有 signal で入る能動 mode** で、上記失敗 routing 順序とは競合しない (rank=—)。

| 失敗 routing rank | signal 群 | → mode | 特記 |
|---|---|---|---|
| **1 (最優先)** | `production_incident` / `hotfix_required` / `regression_prod` (env=prod) | Incident | 三者サインオフ |
| **2** | `agent_runaway` / `runaway` / `context_exhaustion` / `forced_stop` / `regression_dev` | Recovery | tl+po サインオフ。forced_stop は dangling-turn 推定 |
| **3** | `drift` (schema/contract) | Reverse | drift-check 横断検出で自動 |
| **4** | `debt_degradation` / `code_smell` / `structural` | Refactor | doctor debt 検出 |
| — (固有) | `dependency_outdated` / `upgrade` / `config_drift` | Retrofit | upgrade はpreflight 必須 |
| — (固有) | `feature_addition` / `scope_extension` | Add-feature | |
| — (固有) | `user_feedback_iteration` / `requirement_continuous_refinement` | Scrum | |
| — (固有) | `tech_decision_required` / `option_comparison_needed` / `adr_required` | Research | PoC 不要 (机上完結) |
| — (固有) | `requirement_undefined` / `feasibility_unknown` / `success_condition_unclear` / `design_uncertain` | Discovery | uncertainty 高 = 上流委譲 |
| 分岐 | `interrupt` (design_gap/new_requirement/constraint/po_change) | 4 方向分岐 | runaway 併発→Recovery / 要件昇格→Discovery / 軽微追加→Add-feature / 設計 gap のみ→Forward spot 修正 |

**mode ↔ kind の非1:1 (§1.3 整合)**: ① Discovery と Scrum は同一 `kind=poc`、入口 (mode) で識別し frontmatter では区別しない / ② Incident は独立 kind を持たず `troubleshoot`(L7) + `recovery`(cross) の 2 PLAN に分割 (`recovery` PLAN の `dependencies.requires` に `troubleshoot` PLAN を宣言) / ③ Add-feature は `add-design`(L3-L6) + `add-impl`(L7) を内包。ID-legibility の射程は §1.10.A (横断駆動 = mode token / layer-bound = layer token + kind 識別)。

### §3.3 工程専門 (Forward spine 内、独立 mode でない) — 2 種

screen-design / frontend-design は**独立した駆動モデルでなく、Forward の特定工程内の専門タスク** (concept §2.5「mode でない」)。独立 kind/layer/workflow_phase を持たない。

| 工程専門 | 実現 FR | Forward 内位置 | 状態遷移 (what) | 出口 / gate | drive 別要否 |
|---|---|---|---|---|---|
| **screen-design** | FR-29 | L2 内 (G1 通過後) | 画面一覧 → 画面遷移 → wireframe → UI 要素 (4 sub-doc) | G2 凍結 → L3 進行。mock 自体が ③ ペア (`self-pair`、pair-freeze 孤児扱い外) | be/db=skip 可、fe/fullstack/agent=必須 |
| **frontend-design** | FR-30 | L10 内 (G9 通過後) | 本番実データで画面・表示が UX/ビジュアル/表現品質で成立するか磨く (右腕「実データ検証」) | G10 UX 承認 → L11。不承認 → L2 画面設計へ差し戻し | fe=厚い、be/db=薄い、fullstack=標準、agent=会話UI/デモ |

### §3.3 TDD型駆動モデルへの組み込み

全駆動モデルを同じ強度で TDD 化しない。Red を「失敗したテスト」だけに狭めず、設計欠落・依存 impact・DB projection の未解消 signal も Red として扱う。Yellow は PLAN/対象登録済みだが保護網や依存確認が未完了の状態、Green は test/design/review evidence が紐づき、該当 gate が通った状態とする。

| 対象 | TDD適性 | Red 発火点 | Green 条件 |
| --- | --- | --- | --- |
| Forward design / `kind=design` | strong | `descent_obligation_missing` / `pair_artifact_missing` / `test_design_missing` | design doc + test-design + trace edge + review after green |
| Add-feature (`add-design` + `add-impl`) | strong | `feature_addition` / `scope_extension` / `acceptance_gap` | add-design + add-impl + regression green + Reverse back-fill if needed |
| Refactor | strong | `code_smell` / `structural` / `debt_degradation` / `artifact_progress_red` | behavior unchanged + linked test IDs + relation impact closed |
| Reverse | strong | `drift` / `schema_contract_gap` / `as_is_test_design_missing` | as-is design + intent confirmed + forward routing + backprop artifacts |
| Retrofit | strong | `dependency_outdated` / `upgrade` / `config_drift` / stale `dependency_edges` | migration + config + rollback + regression green |
| Recovery / Incident | strong | `regression_dev` / `regression_prod` / `forced_stop` / quality failure | reproduction or recovery test + guard/rule + postmortem/handover |
| screen-design | strong | `screen_requirement_gap` / `wireframe_missing` / `screen_impl_pair_gap` | screen list + flow + wireframe + UI elements + pair trace |
| frontend-design | strong | `a11y_regression` / `visual_regression` / `token_drift` / UX feedback | visual + tokens + a11y + VRT + UX review |
| Discovery / Scrum | partial | uncertainty / user feedback | hypothesis or increment verified + decision + Forward/Reverse route |
| Research | weak | technical decision required / ADR required | memo + sources + ADR candidate |

DB発火点は `findings`、`quality_signals`、`feedback_events`、`graph_nodes`、`dependency_edges`、`impact_results`、`artifact_progress` を使う。DB は projection であり正本ではないため、発火結果は PLAN 入力または workflow signal とし、設計文書や PLAN の authored state を直接置換しない。機械契約は `src/workflow/contracts.ts#classifyDriveTddFits` が提供する。

### §3.4 skill 文脈注入の外部形状 (FR-12)

**中核価値 = context/skill 動的注入で AI 認知負荷を下げる (CLAUDE.md 柱 4)** の入口。`ut-tdd skill suggest --plan <path>` の外部形状:

- **入力**: PLAN context (`kind` / `layer` / `drive` / task 文 / 現在 step)。
- **出力**: 該当 skill の ranked 推挙 + **注入規約** (どの skill を どの step で注入するか)。**全 skill を常時ロードしない** (柱 4 = 必要工程でのみ注入)。override 制御は `L3-injection.yaml` 相当 (AC-FR-12-01〜03)。

**Provider materialization (PLAN-L7-135, 2026-06-23)**: `ut-tdd skill suggest --inject --json`
is the provider-neutral context manifest. It emits skill paths and reasons only
(`required_paths`, `optional_paths`, `missing_skill_ids`), never skill bodies.
`ut-tdd codex --plan ...` / `ut-tdd claude --plan ...` and `ut-tdd team run
--plan ...` materialize the same manifest into adapter stdin under `UT-TDD
context injection`, so Claude and Codex receive identical scoped skill context
while argv remains fixed command metadata. `ut-tdd task route --plan ... --execute`
uses the same materialization path after cost-tier/model routing, so difficulty
routing and skill injection meet in the provider adapter plan.
- **担当 building block**: 将来 `src/skills/` (architecture.md §3.1) + orchestration module。判定アルゴリズム (capability resolver) は L6 carry。

### §3.5 担当 building block / 制御フロー (外部設計)

オーケストレーションの実行時担当は architecture.md の building block にマップする (二重定義回避、§7 依存と整合):

| 担当 | 役割 | 出典 building block |
|---|---|---|
| `runtime(detect)` + `mode-routing.yaml` | signal 検出 → 優先度 routing (§3.2)。公開 surface は `ut-tdd route eval` | architecture.md §3.1 runtime / §4.1 |
| **workflow orchestration module** | 駆動モデルの phase/step 駆動 + Forward 合流 | `src/workflow/contracts.ts` / `src/workflow/readiness.ts` |
| `Workflow` 集約 (phase/gate state) | mode の進行状態 (phase↔gate) の唯一状態源 | data.md §4 Workflow 集約 / §7 phase↔gate |
| `ut-tdd` CLI 各サブコマンド | 各 mode の人手起動口 (reverse/incident/cutover/skill 等) | function.md §2 |
| gate (各 phase) | phase 遷移は gate pass が前提 | gate-design §1.1 / data.md §7 |

> 制御フローの実行時ビュー (代表シナリオ) は architecture.md §5。workflow orchestration は `src/workflow/contracts.ts` の drive/model routing 契約と `src/workflow/readiness.ts` の DB projection readiness で L7 実装済み。

### §3.6 実行モード (3+1 パターン) × オーケストレーション (FR-08/FR-L1-42)

**中核価値 = 適切なオーケストレーションで開発コストを下げる (柱 5)** の本質は、**利用可能な runtime に合わせてオーケストレーションを変える**こと。§3.1-§3.5 の駆動モデル設計は runtime 非依存で書いたが、**実行担当・review・委譲は execution mode (concept §2.1.1) で変わる**。orchestration は `ut-tdd status` が検出する **3+1 パターン** で振る舞いを切り替える (single fallback でなく明示縮退、§2.1.2.1)。

| execution mode | 判断 / 実装の割当 | 駆動モデルの review/gate tier | 委譲 (worker/reviewer 分散) |
|---|---|---|---|
| **hybrid** (Claude+Codex、mix) | 判断系 (frontier-reviewer) ↔ 実行系 (worker) を**別 runtime に分散** (二重実行禁止、concept §2.1.0) | **① cross-agent review** (別 runtime/model) で full enforce。worker と reviewer の (provider,model) 同一なら承認無効化 | 可。orchestration_mode の `*_codex_impl` 系が完全実体化 |
| **claude-only** | PM(Opus) 判断 + Claude が実装も担う | **② intra_runtime_subagent review を hard 必須** (`.claude/agents/code-reviewer` 等、明文化 checklist)。`review_kind=intra_runtime_subagent` + `cross_agent_review=unavailable` 記録 | 不可 → orchestration_mode は §2.1.2.1 縮退規則で別 mode へ (silent fallback 禁止、不在を明示記録) |
| **codex-only** | Codex(TL) 主導 + ② reviewer-role | 同上 (② hard 必須) | 不可 → 同上縮退 |
| **standalone** (AI なし) | 機械 lint のみ | サブエージェント起動不可 → **判断ゲートは人間レビュー必須** を `next_action` に出す (自動 pass 不可) | 不可 |

- **mode-invariant な人間サインオフ (§2.1.2.1 point 5)**: §3.1 の **Recovery (tl+po) / Incident (オンコール+tl+pm) / Retrofit config_drift (tl)** + escalation 境界 (本番影響/認証/認可/決済/PII/ライセンス/destructive) は **execution mode を問わず人間サインオフ必須** (② でも代替不可、hard-block)。execution mode で縮退するのは「AI レビューの tier」であり、人間サインオフ点は不変。L7 着地 (2026-06-23): `ut-tdd route eval` が signal から escalation 境界を検出し、承認未解決なら exit 1 にする。
- **orchestration_mode 注入**: 各駆動モデルの drive×layer に `orchestration_mode` (5値) を注入 (§2.6.4)。`claude_judge_codex_impl` / `codex_impl_qa_verify` は hybrid 前提で、単体 mode では §2.1.2.1 の縮退規則に従う。**判断ゲートは必ず execution mode を参照する** (orchestration_mode と execution mode を独立に扱うとレビューゲートが崩れる、§2.6.4)。
- **review_kind / cross_agent_review の記録着地先 (F-2)**: claude-only/codex-only で記録する `review_kind=intra_runtime_subagent` + `cross_agent_review=unavailable` は **PLAN frontmatter の `review_evidence` (reviewer/review_kind/verdict/scope/worker_model/reviewer_model/tests_green_at/green_commands) に着地** (data.md §6 Plan 不変条件)。**`doctor checkReviewEvidence` が hard 検証** (review-skip freeze を fail-close、IMP-071 / same-model cross-agent 僭称を fail-close、IMP-076 / テスト前レビューを fail-close、IMP-077 / green command 証跡欠落を fail-close、IMP-108) = mode 別 review tier 縮退が doc-only でなく機械担保される。L5 D-CONTRACT では CLI/gate 結果 JSON との詳細接続を確定する。
- **実装タスクの worker 委譲設計 (PO 問い)**: 実装は **Claude subagent でなく Codex worker へ委譲**する。agent-guard allowlist 15 = PMO/PdM/review の **判断・レビュー系のみ** (be-\*/db-schema/general-purpose は block → Codex SE/PE 委譲経由、.claude/CLAUDE.md / architecture §3.2 / roster §1.1)。hybrid では判断 (`frontier-reviewer`) と実装 (`worker`) を**別 runtime に分散** (二重実行禁止、concept §2.1.0)。どの Codex model がどの role (TL/SE/PE) を担うかの具体割当は runtime policy (.claude/CLAUDE.md) = L4 altitude 外 (orchestration_mode の cell 値は requirements defer、§3.7)。
- **cross-review の semantic 強制 (PO 問い、IMP-076 + 2026-06-08 review-tier 着地済)**: concept §2.1.2.1 の cross-review 実行時強制のうち、① `same_model_approval: forbidden` (cross_agent なのに worker≡reviewer の同一 (provider,model) なら承認無効化し exit) と ② `review_kind` ↔ execution mode 整合の静的担保 (claude-only/codex-only が相異 model を供給できず `cross_agent` を僭称できない) は **review_evidence の `worker_model` / `reviewer_model` + doctor `checkReviewEvidence` に機械着地済** (IMP-076)。③ checklist 逐条 pass/fail/n-a 記録 (§7.8.7 checklist) は `ut-tdd gate <判断ゲート>` の `evaluateGateReview` + `docs/skills/review-checklist.yaml` に機械着地済 (fail / 根拠なし n-a / checklist 欠落で exit 1)。orchestration_mode cell / worker roster の詳細割当は別 scope の carry。
- **担当 building block**: mode 検出 = `runtime` (`detectMode()`、§3.5 / architecture §5)。provider 引継ぎ (Claude↔Codex context+PLAN+budget、FR-L1-42) = `runtime/provider-handover.ts` + `ut-tdd handover provider export/status` (package は `.ut-tdd/handover/provider/` に保存)。runtime 委譲 surface = `ut-tdd codex` / `ut-tdd claude` dry-run contract plan + `--execute` 明示実行 + Windows ARG_MAX 回避用 `--task-file`。provider CLI 実行形状は Codex=`codex exec -` + stdin、Claude=`claude --print --input-format text` + stdin。`--plan` は harness 側の plan_id metadata / session-log 付与であり、provider CLI 引数へ転送しない。
- **ペア**: execution-mode degradation の総合検証 = L9 **ST-EXT-02** (Codex 不在→claude-only / 双方不在→standalone) + 駆動モデルの review-tier 縮退 = ST-FUNC-06 (mode-aware サインオフ/review)。

### §3.7 carry → L5 / L6 / requirements (正規 defer、under-design ではない)

L4 は外部設計 (what/形状) で確定。以下は altitude 上 L4 の範囲外として**明示 defer** (CLAUDE.md「正規 defer は under-design でない」):

- 各 mode の **CLI subcommand signature / エラー型 / リトライ** → L5 D-API (IMP-018、external-if §7 境界と整合)。
- 駆動モデルの **状態遷移 pseudocode / 内部処理** → L6 機能設計 (IEEE 1016 §5.7、IMP-019)。
- **orchestration_mode の cell matrix (drive×layer → 5値の具体割当)** → requirements §1/§7 (concept §2.6.4)。**L7 着地 (2026-06-23)**: `ut-tdd vmodel show <drive> <layer> --injection` が `owner_role` / `mandatory_agents` / `recommended_skills` / `recommended_commands` / `orchestration_mode` を返す公開 surface として実装済み。execution mode 別の縮退実行も `--mode <mode>` / runtime detection で `degraded_from` / `degraded_to` / `degradation_reason` を出すため、silent fallback せず記録される。
- **Scrum 6 type × Reverse 5 type の 30-cell routing matrix** → requirements §3 (concept §4.4、現状 stub)。
- **Scrum 出口の L8-L14 直接合流禁止 (IMP-044、F-4)** → 機械着地先 = `ForwardRouting` enum (`VALID_FORWARD_ROUTING` = L1/L3/L4/L5/gap-only、L7/L8-L14 を含めない、data.md §3) + doctor `checkScrumReverse` (Reverse 経由を強制)。enum 値が L8-L14 を構造的に排除する = under-design でなく実装済の値域制約。本 carry は「§3.7 で着地先を明示」する記録。
- **Recovery 再発防止 artifact schema** → 後続 PLAN (recovery.md §4 carry)。
- **G8-G14 の機械検証条件** → IMP-052 (gates.md §1 注記、現状概念定義)。

## §4 detector / hook 機能

| 機能 | 実現 FR | building block | 出力 |
|---|---|---|---|
| **5 イベント hook** | FR-07 | (将来 hook、`.ut-tdd/hooks/` TS) | PLAN 起票 / コード変更 / Codex 実行 / gate 通過 / 停止 → state 自動更新 |
| **doctor 集約 detector** | FR-18 | doctor module + lint 群 | 依存漏れ / 契約漏れ / 接続欠損 / デグレ を集約 |
| **mode routing** | FR-08 | runtime(detect) + `mode-routing.yaml` | drift/劣化/暴走/障害 → mode 自動 routing (優先度 Incident>Recovery>Reverse>Refactor) |
| **横断 4 機構** | FR-11 | (将来 cross-cutting) | interrupt / debt / drift-check / readiness (現工程を block しない並列 PLAN) |

> **agent-guard hook (FR-09) は既存実装済** (`.claude/hooks/agent-guard.ts`、architecture.md §6)。他 hook は UT-TDD CLI 整備後に有効化 (architecture.md §6 と整合)。

## §5 AI ガード / 観測機能 (IMP-013)

| 機能 | 実現 FR | 状態 | business-detail (BR-21) 接続 |
|---|---|---|---|
| **agent-guard** | FR-09 (AC-FR-09-01〜04) | **実装済** | — (ガードは Learning Engine 非依存) |
| **観測層 (invocation_log)** | FR-L1-20 (P1、L4 carry) | 未 (Phase A 設計) | **business-detail §2 (BR-21 計測対象) / §5 (集計 → Learning Engine 入力) に接続** |
| accuracy_score / detector_result / gate_evidence / kpi | FR-L1-20 (observability) | 未 (data.md §9 候補) | business-detail §2/§5 の KPI 集計経路 |

> **IMP-013 接続明示**: FR-L1-20 の観測値 (invocation_log = AI 呼び出し記録 / accuracy_score = 判定精度 / gate_evidence = ゲート証跡) は、**Phase A で `.ut-tdd/audit/*.jsonl` に append-only 記録** (data.md §8 Evaluation 集約) され、**business-detail §2 (BR-21 計測対象定義) の入力 + §5 (Learning Engine 集計) の経路**となる。AC-FR-BR21-02 (business-detail) の Phase A 前提 = 「観測層が記録のみ稼働、学習エンジン本実装は Phase B」と整合。観測 (Phase A) と学習 (Phase B、FR-L1-19) を分離。

## §6 P1 carry 10 件の機能 building block 着地先

L3 §3.1 の P1 carry を L4 sub-PLAN として機能境界を割り当て (§3.1 表と 1:1)。

| FR-L1 | 機能 building block | L4 sub-PLAN (着地先) | 配置 module |
|---|---|---|---|
| FR-L1-21 (テスト観点 W 字ゲート) | 設計→テスト観点抜け + レベル間重複検出 (static) | PLAN-L4-NN-test-perspective-gate | lint/vmodel |
| FR-L1-22 (FE detector 5 軸) | mock-promotion / token-drift / a11y / visual / state-drift | PLAN-L4-NN-fe-detector | (将来 fe detector) |
| FR-L1-28 (W 2 段設計) | Phase1 一般 + Phase2 agent 昇華 (drive=agent) | PLAN-L4-NN-w2-stage | (将来 workflow) |
| FR-L1-37 (model 推挙) | task×drive×L 別 model + reasoning effort 選定 | PLAN-L4-NN-model-suggestion | (将来 skill/orchestration) |
| FR-L1-39 (タスク難易度) | 規模/依存/不確実性×drive スコアリング | PLAN-L4-NN-task-complexity | (将来 orchestration) |
| FR-L1-40 (drive 別 state 分離) | `.ut-tdd/drive/<drive>/` 区画 + skip_sub_doc 強制 | PLAN-L4-NN-drive-state-isolation | runtime/state |
| FR-L1-41 (drive 自動判定) | PLAN/コード/拡張子 → drive 分類 → routing | PLAN-L4-NN-drive-auto-classify | runtime(detect) |
| FR-L1-42 (provider 引継ぎ) | Claude↔Codex context+PLAN+budget 連携 | implemented 2026-06-08 (`provider-handover.v1`) | runtime(adapter) |
| FR-L1-44 (onboarding) | 既存 repo へ harness baseline 確立 | PLAN-L4-NN-onboarding | cli(setup) |
| FR-L1-51 (artifact progress color projection) | source/test/impact/recovery を `artifact_progress` 赤黄緑 state に正規化 | PLAN-L7-56 / PLAN-REVERSE-56 | state-db/projection-writer + cli(progress) |

> P2 (FR-L1-31〜35) は PLAN-L4-NN-infra-readiness、Phase B (FR-L1-19/20) は telemetry carry (data.md §9)。sub-PLAN の `NN` 採番は各起票時に確定。

## §7 機能間依存 / 呼び出し関係

architecture.md §3 の依存方向 (schema 一方向・循環禁止) と整合する機能呼び出し。

| 呼び出し元 → 先 | 種別 | 内容 |
|---|---|---|
| plan draft → state hook → registry | event | PLAN 起票 (FR-01) が hook (FR-07) を発火し registry 更新 |
| gate → trace check → detector | sequential | gate (FR-05) が trace (FR-03) を呼び doctor detector (FR-18) で証拠集約 |
| doctor → mode routing → plan draft | conditional | doctor (FR-18) 検出 → routing (FR-08) → 対応 kind PLAN 自動起票 (FR-01) |
| workflow → gate (各 phase) | sequential | workflow (FR-13〜30) の phase 遷移は gate pass が前提 (data.md §7 phase↔gate) |
| 全コマンド → schema validate | dependency | 全機能が schema (zod) で frontmatter/state を検証 (architecture §3 一方向) |

## §8 carry → L5 詳細設計 / L6 機能設計

- 各 CLI コマンドの **Precondition/Postcondition** (DbC) = L5 D-API / internal-processing (IMP-014、edge 5-8 docstring)
- workflow エンジン状態遷移ロジック / detector アルゴリズム = L6 機能設計 (IEEE 1016 §5.7 pseudocode、IMP-019)
- P1 sub-PLAN 9 件 = L4 詳細 PLAN として個別起票 (本 doc では機能境界のみ、§6)
- 観測層 (FR-L1-20) の値オブジェクト/state schema = L5 physical-data (data.md §9 carry)
- mode-routing.yaml / gate-checks.yaml の DSL schema = L5 D-CONTRACT
## Appendix B: L4 trace coverage addendum (descent-obligation)

This L4 function sub-doc is the machine-readable L3->L4 landing point for the functional building-block coverage below. The rows are trace coverage for existing function / CLI / workflow / guard content, not new feature scope.

| trace set | L4 receiving block |
|---|---|
| FR-L1-01 / FR-L1-02 / FR-L1-04 / FR-L1-05 / FR-L1-06 / FR-L1-07 / FR-L1-09 / FR-L1-10 / FR-L1-11 / FR-L1-13 / FR-L1-14 / FR-L1-15 / FR-L1-16 / FR-L1-17 / FR-L1-18 | Function categories C1-C11 and CLI command surface |
| FR-L1-23 / FR-L1-24 / FR-L1-25 / FR-L1-26 / FR-L1-27 / FR-L1-29 / FR-L1-30 | Workflow orchestration function blocks |
| FR-L1-36 / FR-L1-38 / FR-L1-43 | BR-21 / business-detail Phase B evaluation hooks carried through workflow/evaluation blocks |
| FR-L1-45 / FR-L1-50 / FR-L1-51 | doc-review, DDD/TDD strictness guard, and artifact progress projection blocks |
