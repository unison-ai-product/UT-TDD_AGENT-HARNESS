---
layer: L3
sub_doc: functional
status: confirmed
pair_artifact: docs/test-design/harness/L3-acceptance-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
related_l1_functional: docs/design/harness/L1-requirements/functional-requirements.md
related_l1_screen: docs/design/harness/L1-requirements/screen-requirements.md
next_pair_freeze: L12
v2_import: docs/migration/v2-import-ledger.md
created: 2026-05-28
updated: 2026-05-28
---

> **SSoT 参照**: ユビキタス言語 = L0 概念層 §10 用語集 / Bounded Context = L0 §2.5 (9-mode) + screen sub-doc §6 (PM/HM/GD 3 カテゴリ) / 業界標準整合 = ISO/IEC/IEEE 29148 (要件記述) + BDD Given-When-Then (AC 形式) + ISTQB Foundation Level (境界値分析)。
> **件数確定**: L3 FR は **26 件** = P0 18 件 (FR-01〜18、L1 FR-L1-01〜18 と 1:1 対応) + FR-45 (P0、doc-reviewer back-propagation A-49) + workflow core 7 件 (FR-23〜30、A-50 で L3 直接詳細化)。残 P1 10 件 + P2 5 件は L4 carry (§3 / §3.1)。BR-21 経路 (FR-L1-36 / FR-L1-38 / FR-L1-43 + 関連 P2) は business-detail.md 担当 (重複回避)。FR-L1-36 / FR-L1-38 / FR-L1-43 はすべて PLAN-L7-53 で実装済み (2026-06-15)。g3-trace lint の l3Fr=26 と一致。
> **AC 件数**: 全 FR で AC 最低 3 件 (正常 / 異常 / 境界)、計 54+ AC を予定。**人間判断点 列必須** (CC2 carry)。
> **L12 接続規約**: `next_pair_freeze: L12`。L12 受入テスト設計は本 sub-doc の全 AC を AT-* で被覆 (孤児 AC = 0)。
> **正規式モデル (PLAN-RECOVERY-02、2026-06-04)**: L3 要件の検証本質 = **本番受入** (本番環境で FR+AC が満たせるか、L12 で実施。データ実在性エスカレーションの本番 band)。画面要求は L1 (screen sub-doc) が担い L3 では起こさない (L2=L1 フェーズ分離)。

# UT-TDD Agent Harness — L3 機能要件 (functional)

## §1 目的・背景

L1 機能要求 (FR-L1-*、ユーザー視点の「何の機能が必要か」) を L3 機能要件 (FR-*、システム視点の「何を満たすべきか」) に詳細化する sub-doc。各 FR に **入出力 / 振る舞い / 受入条件 (AC)** を確定し、L7 実装スプリント (TDD Red) の入力として機械検証可能な粒度に整える。

スコープ: **L3 FR 26 件** = P0 18 件 (FR-01〜18) + FR-45 (P0、back-propagation) + workflow core 7 件 (FR-23〜30、A-50 で「ワークフロー = harness ガードレール」として L3 直接詳細化)。残 P1 10 件は L4 基本設計で carry (§3.1)、P2 5 件 + BR-21 経路は PLAN-L3-02 (business-detail) に委譲。

## §2 FR-* + AC-* 一覧 (本体)

### 表形式: FR-* 概要 + 対応軸

| FR-ID | L1 FR-L1 | カテゴリ画面 | 対応 mode | 対応 drive | 人間判断点 |
|-------|----------|-------------|-----------|-----------|----------|
| FR-01 | FR-L1-01 | PM-02 / PM-01 | Forward (主) / 全 mode | all | PLAN 起票時の kind / drive 選定 (PO/TL) |
| FR-02 | FR-L1-02 | PM-02 (L7) / HM-07 | Forward | all (be/fe/fullstack 中心) | TDD Red のテスト観点承認 (TL) |
| FR-03 | FR-L1-03 | PM-04 / HM-07 | Forward / Reverse | all | trace 抜け検出時の修正方針 (TL/PO) |
| FR-04 | FR-L1-04 | PM-02 / HM-01 | 全 mode | all | kind 不明時の選定 (TL) |
| FR-05 | FR-L1-05 | PM-03 / HM-07 | 全 mode | all | gate fail 時の bypass / 修正判断 (PO の S-03) |
| FR-06 | FR-L1-06 | HM-04 / HM-01 | 全 mode | all (drive 別区画 = FR-L1-40 連動) | state 不整合検出時の手動修正 (運用者) |
| FR-07 | FR-L1-07 | HM-04 / HM-03 | 全 mode | all | hook 発火失敗時の手動再実行 (運用者) |
| FR-08 | FR-L1-08 | PM-01 / HM-03 | Discovery / Recovery / Reverse / Refactor 自動起動 | all | mode 自動 routing の上書き判断 (PO/TL) |
| FR-09 | FR-L1-09 | HM-05 / HM-03 | 全 mode | agent (主) / all | bypass 承認 (PO 専属 S-03) / budget 上限変更 (PO) |
| FR-10 | FR-L1-10 | HM-06 / PM-03 | Recovery (主) / Incident | all | 再開ポイント選定 (PO/TL) / ロールバック実行 (運用者) |
| FR-11 | FR-L1-11 | PM-03 / HM-07 | 全 mode 横断 | all | interrupt 発生時の優先度判断 (PO) / debt 返済 PLAN 採用 (TL) |
| FR-12 | FR-L1-12 | HM-05 / HM-02 | 全 mode | all (drive 別 skill 選定) | skill 推奨 override (TL) |
| FR-13 | FR-L1-13 | PM-01 / PM-02 | Forward | all | gate サインオフ (G1/G3/G7/G11 = PO / G4-G6 = TL) |
| FR-14 | FR-L1-14 | PM-02 / HM-07 | Reverse | reverse / all | R4 routing 先選定 (L1/L3/L4/L5/gap-only) (TL) / promotion strategy (PO/TL) |
| FR-15 | FR-L1-15 | PM-02 / HM-05 | Discovery | poc / all | 仮説起票 (PO) / S4 decide (PO 専属) |
| FR-16 | FR-L1-16 | PM-03 / HM-06 | Incident | troubleshoot / all | hotfix 緊急判断 (PO 専属) / postmortem 確定 (TL/PO) |
| FR-17 | FR-L1-17 | PM-03 / HM-07 | 全 mode | all | CI fail 時の修正 vs 再実行判断 (TL) |
| FR-18 | FR-L1-18 | HM-07 / PM-04 | 全 mode | all | doctor 検出結果の優先度トリアージ (TL/運用者) |
| FR-23 | FR-L1-23 (workflow core、A-50) | PM-02 (Scrum 工程) | Scrum (主) / Forward 合流 | scrum / all | fullback 起動判断 (TL) / decision_outcome confirmed 承認 (PO) |
| FR-24 | FR-L1-24 (workflow core、A-50) | PM-02 (Add-feature) | Add-feature (主) | all | parent PLAN 選定 (TL) / 影響範囲承認 (PO/TL) |
| FR-25 | FR-L1-25 (workflow core、A-50) | PM-02 (Refactor) / HM-07 | Refactor (主) | all | refactor 範囲承認 (TL) / regression 結果判断 |
| FR-26 | FR-L1-26 (workflow core、A-50) | PM-02 (Retrofit) | Retrofit (主) | all | retrofit-matrix 承認 (TL) / 段階 rollback 判断 (PO) |
| FR-27 | FR-L1-27 (workflow core、A-50) | GD-01 (ADR) / PM-02 | Research (主) | all | ADR 採用判断 (PO/TL) / generates skip 判断 |
| FR-29 | FR-L1-29 (workflow core、A-50) | PM-02 (L2 工程) | screen-design (専門) | fe / fullstack / all | L2 sub-doc 起票判断 (TL) / wireframe 外部依頼 (PO) |
| FR-30 | FR-L1-30 (workflow core、A-50) | PM-02 (L10 工程) | frontend-design (専門) | fe / fullstack | token SSOT 承認 (TL/uiux) / a11y warn 受容判断 (PO) |
| FR-45 | FR-L1-45 (BR-08 派生、A-49 back-propagation) | PM-03 / HM-05 | 全 mode (大規模 doc 改定 trigger) | all | doc-reviewer 召喚判断 / bypass (PO 専属 S-03) |

---

### FR-01: V字モデル全工程の PLAN 起票・進捗管理

- **L1 上流**: FR-L1-01
- **入力**: 工程 (L0-L14)、機能名、kind (charter/design/impl/poc/reverse/...)、drive、記載項目
- **出力**: PLAN ファイル (`docs/plans/PLAN-NNN-slug.md`、frontmatter + §工程表 + §実装計画 内蔵) / plan_registry エントリ
- **振る舞い**: `ut-tdd plan draft` 起動 → frontmatter 必須 fields 自動補完 → §0-§7 構造起票 → registry 自動登録 (FR-07 連動)

#### AC-FR-01-01 (正常系)
- **Given**: ユーザーが `ut-tdd plan draft --title "新機能X" --kind design --layer L3 --drive be` を実行
- **When**: コマンドが完了
- **Then**: `docs/plans/PLAN-NNN-新機能X.md` が生成 / frontmatter (plan_id / title / kind / layer / drive / status / agent_slots / generates / dependencies) 全件入力済 / `.ut-tdd/plan_registry/` に登録 / 終了コード 0

#### AC-FR-01-02 (異常系)
- **Given**: 既に同一 plan_id (`PLAN-005-X`) のファイルが存在
- **When**: 同じ ID で `ut-tdd plan draft` を再実行
- **Then**: fail-close で `Error: plan_id PLAN-005-X already exists` 出力 / 既存ファイル変更なし / next_action: `--plan-id <別ID> を指定するか、ut-tdd plan delete PLAN-005-X 後に再実行` / 終了コード 1

#### AC-FR-01-03 (境界系)
- **Given**: kind=charter で layer ≠ L0 を指定 (§1.1 排他制約違反)
- **When**: `ut-tdd plan draft --kind charter --layer L4` 実行
- **Then**: schema 検証 fail / `Error: kind=charter は layer=L0 のみ (§1.3)` 出力 / PLAN 生成されず / 終了コード 1

---

### FR-02: TDD 強制フロー (テストファースト順序)

- **L1 上流**: FR-L1-02
- **入力**: L6 機能設計 (関数仕様 / クラス設計 / エッジケース)
- **出力**: テストコード (Red 状態) → 本体実装 (Green) → refactor の 3 段階記録
- **振る舞い**: `ut-tdd sprint start` で L7 実装入り → Red テスト未存在で本体実装試行 → fail-close で block

#### AC-FR-02-01 (正常系)
- **Given**: L6 機能設計確定 + Red テスト先行作成 (test ファイルあり、コミット済)
- **When**: 本体実装ファイル commit
- **Then**: `ut-tdd sprint check` が Red→Green 順序を確認 / TDD trace に Red commit ID → Green commit ID 記録 / pass

#### AC-FR-02-02 (異常系)
- **Given**: 本体実装ファイルだけ存在、対応 test ファイル無し
- **When**: `ut-tdd gate G7` 実行
- **Then**: fail-close `Error: 本体実装 src/X.ts に対応する Red テストが見つからない (TDD 違反、FR-02 / FR-L1-02)` / next_action: `tests/X.test.ts を Red 状態で先行作成してください` / 終了コード 1

#### AC-FR-02-03 (境界系)
- **Given**: Red テスト存在、本体実装空 (関数 stub のみ)、テスト pass 可能 (assertion 緩い)
- **When**: `ut-tdd sprint check`
- **Then**: warn `Warning: Red テストが緑のままです (assertion 不十分の可能性、AC 観点抜け確認)` / fail-close せず継続可 / 修正は人間判断

---

### FR-03: V字双方向 trace (設計 ⇔ テスト設計 4 artifact pair)

- **L1 上流**: FR-L1-03
- **入力**: 設計 PLAN + テスト設計 PLAN
- **出力**: trace 整合レポート (`.ut-tdd/artifact/trace/`) / 抜け漏れ検出ログ
- **振る舞い**: `ut-tdd trace check` で 4 artifact (設計 / 実装 / テスト設計 / テストコード) の双方向 12 directed edge を全件照合
- **振る舞い (descent obligation、PLAN-L6-35 add-design)**: 宣言された link の照合だけでなく、上流 (要件 FR) + 層隣接 obligation matrix から「在るべき下流/pair 成果物」を**生成**し、不在 (= 取りこぼし) を fail-close で検出する (absence-blind 是正)。src/test 着地済の trace key に未 discharge の設計/テスト設計 defer があれば impl-ahead 違反とする (機能設計 = `descent-obligation.md`)

#### AC-FR-03-01 (正常系)
- **Given**: PLAN-005 が generates: 設計 doc + 実装 + テスト設計 + テストコード 4 artifact 全件指定
- **When**: `ut-tdd trace check --plan PLAN-005`
- **Then**: 4 artifact 全件存在確認 / 双方向 ID 照合 pass / レポート出力 `trace integrity: PASS (12/12 edges)`

#### AC-FR-03-02 (異常系)
- **Given**: PLAN-005 設計 doc あり、対応テスト設計欠落
- **When**: `ut-tdd trace check`
- **Then**: fail-close `Error: PLAN-005 で設計 doc → テスト設計の trace 断絶` / next_action: `pair_artifact フィールド確認、テスト設計 PLAN 追加起票` / 終了コード 1

#### AC-FR-03-03 (境界系)
- **Given**: PLAN-005 が pair_artifact のみ宣言、generates なし (片方向のみ)
- **When**: `ut-tdd trace check`
- **Then**: warn `Warning: generates 未宣言、L7 実装前に補完推奨` / fail-close せず / 終了コード 0

#### AC-FR-03-04 (descent obligation — 不在検出 / impl-ahead、PLAN-L6-35)
- **Given**: trace key K の src/test が着地済だが、K の L6 単体テスト設計が不在 (= skill 片肺と同型)
- **When**: `ut-tdd doctor` (descent-obligation 検査)
- **Then**: fail-close `unmet obligation: K の L6→L7 pair が不在` または `impl-ahead: K は src 着地済だが設計/テスト設計 defer 未 discharge` / next_action: `機能設計⇔単体テスト設計 pair を back-fill、または有効 defer (discharge条件+owner) を宣言` / 上流が park/placeholder のときは obligation を生成しない (誤検出しない)

---

### FR-04: PLAN kind による逸脱記録・ドキュメント生成計画

- **L1 上流**: FR-L1-04
- **入力**: モード種別、成果物パス、依存 PLAN
- **出力**: kind 付き PLAN レコード、generates 宣言、requires/blocks 依存グラフ
- **振る舞い**: PLAN frontmatter の kind enum (12 種) 検証 / generates / requires / blocks の循環依存検出

#### AC-FR-04-01 (正常系)
- **Given**: PLAN-L4-05 が kind=design / generates: [design_doc] / requires: [PLAN-L0-01-charter]
- **When**: `ut-tdd plan lint PLAN-L4-05`
- **Then**: kind enum pass / 依存 PLAN-L0-01 存在確認 / 循環依存なし / lint pass

#### AC-FR-04-02 (異常系)
- **Given**: PLAN-L4-05 requires: [PLAN-L4-05] (自己依存)
- **When**: `ut-tdd plan lint`
- **Then**: fail-close `Error: 循環依存検出 PLAN-L4-05 → PLAN-L4-05` / 終了コード 1

#### AC-FR-04-03 (境界系)
- **Given**: kind=impl (L7) で parent_design 未指定
- **When**: `ut-tdd plan lint`
- **Then**: schema 検証 fail `Error: kind=impl (L7) は parent_design 必須 (§1.1.parent_design)` / 終了コード 1

---

### FR-05: 決定論的 static ゲート (fail-close、AI 不要)

- **L1 上流**: FR-L1-05
- **入力**: 工程 (gate-id)、成果物、数値品質指標
- **出力**: pass/fail 判定、ゲート証跡 (`.ut-tdd/phase.yaml` + `.ut-tdd/gate_runs/`)
- **振る舞い**: `ut-tdd gate <G-ID>` で `docs/governance/gate-checks.yaml` をロード → 全 check を決定論的に実行 (AI 呼ばない) → pass/fail 判定 + 証跡記録

#### AC-FR-05-01 (正常系)
- **Given**: G3 ゲート全 check pass 条件満たす (5 sub-doc 全件存在 + L14 OT 量閉じ + trace 整合)
- **When**: `ut-tdd gate G3`
- **Then**: pass / `.ut-tdd/phase.yaml` の G3 status = passed / 証跡 `.ut-tdd/gate_runs/G3-<timestamp>.json` 生成 / 終了コード 0

#### AC-FR-05-02 (異常系)
- **Given**: G3 で trace 整合 fail (孤児 FR-L1 = 3 件)
- **When**: `ut-tdd gate G3`
- **Then**: fail-close `Error: G3-trace fail: 孤児 FR-L1 3 件 (FR-L1-XX, FR-L1-YY, FR-L1-ZZ)` / next_action `screen §5 trace マトリクス更新` / 終了コード 1

#### AC-FR-05-03 (境界系)
- **Given**: PO が `UT_TDD_GATE_BYPASS=1` 環境変数で bypass 試行 (S-03 例外権行使)
- **When**: `ut-tdd gate G3`
- **Then**: bypass 警告 + audit 記録 `.ut-tdd/audit/gate-bypass-<timestamp>.json` (PO ID + 理由必須) / phase.yaml は bypassed 状態 / KPI D-08 集計対象 / 終了コード 0 (bypass 成功)

---

### FR-06: V モデル本線 state 一元管理

- **L1 上流**: FR-L1-06 (drive 別区画 = FR-L1-40 連動)
- **入力**: PLAN / コード / テスト / カバレッジ
- **出力**: `.ut-tdd/` 配下 6 種 state (plan_registry / code_catalog / contract_registry / skill_catalog / gate_runs / artifact)
- **振る舞い**: drive 別区画 (`.ut-tdd/drive/<be|fe|...>/`) で state 隔離 / skip_sub_doc 機械強制

#### AC-FR-06-01 (正常系)
- **Given**: PLAN-005 (drive=be) を起票
- **When**: state 自動登録 (FR-07 hook 発火)
- **Then**: `.ut-tdd/drive/be/plan_registry/PLAN-005.json` 生成 / `.ut-tdd/drive/fe/` には登録されない / 区画隔離 pass

#### AC-FR-06-02 (異常系)
- **Given**: 手動で `.ut-tdd/drive/be/plan_registry/PLAN-005.json` を `.ut-tdd/drive/fe/` に複製 (区画跨ぎ汚染)
- **When**: `ut-tdd doctor`
- **Then**: fail-close `Error: drive 区画跨ぎ検出: PLAN-005 (drive=be) が drive/fe にも存在` / 終了コード 1

#### AC-FR-06-03 (境界系)
- **Given**: PLAN-005 frontmatter で `skip_sub_doc: ["L2-wireframe"]` 指定 (concept §3.7 整合)
- **When**: G2 ゲート実行
- **Then**: L2-wireframe 不在を許容 / G2 pass / audit に skip 理由記録

---

### FR-07: state 自動登録 (5 イベント hook)

- **L1 上流**: FR-L1-07
- **入力**: hook イベント (PLAN 起票 / コード変更 / Codex 実行 / ゲート通過 / 停止)
- **出力**: state 自動更新、手動登録漏れ排除
- **振る舞い**: `.ut-tdd/hooks/` 配下に 5 種 hook (TS、bun 実行) を実装 / Claude Code/git/Codex 経由でイベント捕捉
- **振る舞い (extended, PLAN-REVERSE-02 fullback)**: state 登録 (fail-close) とは別系統の **session-log 観測 hook** (SessionStart/PostToolUse/Stop、`src/cli.ts` session/hook entrypoints → `src/runtime/session-log.ts`) を **fail-open** で実装。session イベントを append-only 記録し、PLAN 単位ダイジェスト (`.ut-tdd/logs/plan/<plan_id>.digest.json`) に圧縮 → handover/audit/FR-19 接続。秘匿: sanitize で secret/PII を載せない
- **振る舞い (extended, PLAN-REVERSE-03 fullback)**: session-log の facet として **forced-stop 検出** (`src/runtime/forced-stop.ts`) を実装。専用 hook 不在のため SessionStart 時に session ログ群を走査し `session_end` で閉じない dangling session を **強制停止と推定**して `forced_stop` 記録。停止後メッセージは Haiku 意味解析 (managed pmo-haiku、raw API なし) で是正/間違えを分類し、**是正のみ**フィードバックログ (`.ut-tdd/logs/feedback/<plan_id>.jsonl`) へ記録 → `forced_stop` を concept §2.6.1 の `agent_runaway` 級 Recovery trigger とし、アテンション高は Recovery 起票候補として agent が提示 (起票は人間 yes)。fail-open + 曖昧時は是正寄りに倒す

#### AC-FR-07-01 (正常系)
- **Given**: 開発者が `git commit` で src/X.ts 変更
- **When**: PostCommit hook 発火
- **Then**: `.ut-tdd/code_catalog/` に src/X.ts エントリ追加 / 関連 PLAN 検索 + `last_modified` 更新 / hook 終了コード 0

#### AC-FR-07-02 (異常系)
- **Given**: hook 実行中に書込み失敗 (`.ut-tdd/` permission denied)
- **When**: hook 続行
- **Then**: fail-close `Error: state 自動登録失敗 (.ut-tdd/code_catalog/ 書込み不可)` / 元 git commit は成功扱い (post-hook のため) / next_action `chmod 確認、ut-tdd doctor で整合性チェック` / hook 終了コード 2 (warn 通知)

#### AC-FR-07-03 (境界系)
- **Given**: 5 hook のうち 1 つが未実装状態 (placeholder)
- **When**: 該当イベント発火
- **Then**: skip + audit `hook event Y skipped (not implemented)` / 他 hook は正常動作 / 終了コード 0

#### AC-FR-07-04 (session-log 観測 hook、fail-open、PLAN-REVERSE-02 back-fill)
- **Given**: session-log hook 実行中に I/O 失敗 (`.ut-tdd/logs/` 書込み不可) または stdin/JSON 不正
- **When**: SessionStart / PostToolUse / Stop 発火
- **Then**: **常に終了コード 0 (fail-open、作業を止めない。state 登録 hook の fail-close と逆)** / 記録できた分のみ append / Stop 時 PLAN 単位ダイジェストを生成し、**同一 (plan_id, session_id) を 2 回以上 onStop しても event counts が増殖しない (折り畳み済み session_id を skip = idempotent。同一バッチ内の複数 event は正規にカウント)** / `plan_id=null` のみの session は digest 書かない / secret/PII は sanitize (`name=value` 形式の token/key/password 等を `name=***` マスク + 120 字 truncate) で除外 / **hook I/F: `hook_event_name` ∈ {SessionStart, PostToolUse, Stop} で dispatch、未知値は PostToolUse へ fallback (契約は L6 session-log.md §5)** (検証: U-SLOG-001〜005)

#### AC-FR-07-05 (forced-stop 検出 + フィードバックログ、fail-open、PLAN-REVERSE-03 back-fill)
- **Given**: 前 session が `session_end` で閉じず途切れた (強制停止)。次 session 開始
- **When**: SessionStart で `scanDanglingStops` 発火 → dangling 推定 → 停止後メッセージを Haiku 分類
- **Then**: **常に終了コード 0 (fail-open)** / `session_end` で閉じた正常 session は対象外 / `forced_stop` 既記録の session は再記録しない (idempotent) / 分類 `category="feedback"` (AI やらかし) のみフィードバックログへ記録し **`category="mistake"` (ユーザー誤操作) は記録しない** / 分類失敗・曖昧時は **`feedback`+`low`+unclassified に倒す (取りこぼし回避)** / 記録は**内容キー (session_id+plan_id+attention+summary+reason) で idempotent (ts が変わっても同一内容は重複記録しない)** / 生文・PII・credential を durable に残さず sanitize / アテンション高は `recovery_proposed=true` で Recovery 起票候補 (起票は人間 yes、§2.6.3) / 意味判定は managed pmo-haiku に分離 (raw API なし) (検証: U-FSF-001〜007)

---

### FR-08: 検出 → モード自動ルーティング

- **L1 上流**: FR-L1-08 (drive 自動判定 = FR-L1-41 を入力)
- **入力**: 検出シグナル (drift / 劣化 / 暴走 / 障害 / drive 判定結果)
- **出力**: モード発動トリガー、対応 kind PLAN 自動起票
- **振る舞い**: `ut-tdd doctor` 検出結果 → `mode-routing.yaml` ルックアップ → Recovery / Incident / Reverse / Refactor のいずれかを自動 routing

#### AC-FR-08-01 (正常系)
- **Given**: drift 検出 (設計 doc 変更後 7 日経過、対応 test 設計未更新)
- **When**: `ut-tdd doctor` 実行
- **Then**: Reverse mode 自動 routing 提案 / `ut-tdd plan draft --kind reverse --workflow-phase R0` 候補 next_action 出力

#### AC-FR-08-02 (異常系)
- **Given**: 複数シグナル同時検出 (drift + 劣化 + 暴走)
- **When**: `ut-tdd doctor`
- **Then**: 優先度ルール (Incident > Recovery > Reverse > Refactor) で Recovery routing / 他シグナルは warn として記録

#### AC-FR-08-03 (境界系)
- **Given**: 検出シグナル無し、PO が手動で `ut-tdd route --mode reverse` 強制
- **When**: 強制実行
- **Then**: warn `Warning: 検出シグナル無しで手動 mode 切替 (S-03 PO override 扱い)` + audit 記録 / routing 実行

---

### FR-09: AI エージェントガード (agent_mandatory 監査 + budget + lock)

- **L1 上流**: FR-L1-09
- **入力**: AI 操作ログ、役割定義 (agent_slots)、budget 上限
- **出力**: 逸脱警告 / 停止 / audit ログ
- **振る舞い**: `.claude/hooks/agent-guard.ts` (既存実装、PreToolUse Agent) で許可リスト 15 件 + model 明示 + override 禁止を fail-close

#### AC-FR-09-01 (正常系)
- **Given**: Claude Code が `Agent({subagent_type: "pmo-sonnet", model: "sonnet"})` 呼び出し
- **When**: agent-guard 検証
- **Then**: 許可リスト pass / model 明示 pass / opus override なし / 終了コード 0 / audit `.ut-tdd/audit/agent-invocations/` 記録

#### AC-FR-09-02 (異常系)
- **Given**: Claude Code が許可リスト外の `Agent({subagent_type: "be-api"})` 呼び出し
- **When**: agent-guard 検証
- **Then**: fail-close `Error: subagent be-api は許可リスト 15 件外 (CLAUDE.md Subagent Guard)` / Agent 起動 block / 終了コード 2

#### AC-FR-09-03 (境界系)
- **Given**: `UT_TDD_ALLOW_RAW_AGENT=1` 環境変数で bypass 試行 (PO 専属 S-03)
- **When**: 同じ呼び出し
- **Then**: warn + audit `bypass used by PO (reason: ...)` 記録必須 / KPI D-06 集計対象 / Agent 起動許可 / 終了コード 0

#### AC-FR-09-04 (異常系: opus override 禁止、A-54 audit C-04 / 軸4 補完)
- **Given**: Claude Code が `Agent({subagent_type: "pmo-sonnet", model: "opus"})` 呼び出し (pdm-* 以外への opus 指定)
- **When**: agent-guard 検証 (model family 解決)
- **Then**: fail-close `Error: model opus は pmo-sonnet の frontmatter (sonnet) と不一致、opus は pdm-* のみ許可` / Agent 起動 block / 終了コード 2 / audit に block 記録 ([[feedback-subagent-model-explicit]] / weekly quota 保護)

---

### FR-10: Recovery 収束フロー

- **L1 上流**: FR-L1-10
- **入力**: 暴走状態ログ、PLAN 履歴
- **出力**: recovery-log (再開ポイント、認識訂正履歴) + `ut-tdd cutover` ロールバックコマンド
- **振る舞い**: HM-06 Recovery ビューに CLI ロールバックコマンドコピー UI (S5=b、UI 直接実行なし)

#### AC-FR-10-01 (正常系)
- **Given**: AI 暴走検出 (5 連続 gate fail + budget 超過)
- **When**: Recovery mode 自動起動
- **Then**: 最終正常 gate を再開ポイント候補として提示 / `ut-tdd cutover --to <gate-id>` CLI コマンド生成 / クリップボードコピー UI 提供

#### AC-FR-10-02 (異常系)
- **Given**: 再開ポイント候補なし (全 gate fail 履歴)
- **When**: Recovery mode 起動
- **Then**: warn `Warning: 再開ポイント候補なし。初期化推奨` / next_action `ut-tdd reset --to-charter (PO 専属確認)`

#### AC-FR-10-03 (境界系)
- **Given**: PO が UI からロールバック実行ボタンを誤クリック (S5=b 違反試行)
- **When**: UI 操作
- **Then**: UI に「ロールバックは CLI 実行のみ。コマンドコピー後ターミナルで実行」表示 / 直接実行不可

---

### FR-11: 横断 4 機構 (interrupt / debt / drift-check / readiness)

- **L1 上流**: FR-L1-11
- **入力**: 割り込みイベント / 負債台帳 / drift 検出 / 後工程 readiness 判定
- **出力**: sprint interrupted / debt-register / 乖離レポート / PLAN 先送り判定
- **振る舞い**: 4 機構が独立 PLAN として並列起動可能 (cross-cutting)、現工程を block しない

#### AC-FR-11-01 (正常系)
- **Given**: L4 設計中に PO が緊急バグ修正を interrupt 要請
- **When**: `ut-tdd interrupt --reason "P0 bug" --pause-plan PLAN-040`
- **Then**: PLAN-040 status=interrupted / 新規 PLAN-041 (kind=troubleshoot) 起票 / PLAN-040 復帰時の context handover 保存

#### AC-FR-11-02 (異常系)
- **Given**: 既に interrupted 状態の PLAN を再度 interrupt 試行
- **When**: `ut-tdd interrupt --pause-plan PLAN-040`
- **Then**: fail-close `Error: PLAN-040 はすでに interrupted` / next_action `ut-tdd resume PLAN-040 を先に実行`

#### AC-FR-11-03 (境界系)
- **Given**: debt-register に 30 件以上累積 (閾値超過、readiness check 該当)
- **When**: 後工程 PLAN 起票試行
- **Then**: readiness warn `Warning: debt 30 件超過。返済 PLAN 推奨` / 起票続行可 / 起票は block しない

---

### FR-12: L 単位文脈注入 (skill / workflow / agent / command / orchestration)

- **L1 上流**: FR-L1-12 (工程別スキル推挙 = FR-L1-37 連動)
- **入力**: L 種別、`docs/skills/<L>-injection.yaml`
- **出力**: AI の選択空間限定、迷い排除
- **振る舞い**: PLAN frontmatter から L 自動判定 → 該当 yaml 読み込み → 5 要素を AI コンテキストに注入

#### AC-FR-12-01 (正常系)
- **Given**: PLAN-005 (layer=L3) 着手
- **When**: `ut-tdd skill suggest --plan PLAN-005`
- **Then**: `docs/skills/L3-injection.yaml` ロード / 推奨 skill 5 件 (例: requirements-elicitation / ac-design / ...) 提示 / 選定根拠ログ付き

#### AC-FR-12-02 (異常系)
- **Given**: L3-injection.yaml 未整備 (file 不在)
- **When**: skill suggest
- **Then**: fail-close `Error: L3-injection.yaml 不在` / next_action `skill 定義を起票してください`

#### AC-FR-12-03 (境界系)
- **Given**: PLAN-005 frontmatter で skill override 指定 (`skill_override: ["custom-skill"]`)
- **When**: skill suggest
- **Then**: 推奨 skill より override 優先 / TL 承認 audit 必須 (人間判断点)

---

### FR-13: Forward ワークフロー (L0→L14 順行)

- **L1 上流**: FR-L1-13
- **入力**: 各工程 gate 通過条件
- **出力**: 工程進行 + ゲート証跡
- **振る舞い**: `ut-tdd status` で現 phase 表示 / `ut-tdd next` で次工程候補提示

#### AC-FR-13-01 (正常系)
- **Given**: 現 phase = L3、G3 pass
- **When**: `ut-tdd next`
- **Then**: 次工程 = L4 (基本設計) 提示 / 推奨 PLAN 起票コマンド出力 / phase.yaml 更新

#### AC-FR-13-02 (異常系)
- **Given**: G3 未通過状態で L4 PLAN 起票試行
- **When**: `ut-tdd plan draft --layer L4`
- **Then**: fail-close `Error: G3 未通過、L4 着手不可 (V-model 順序遵守)` / next_action `ut-tdd gate G3 実行`

#### AC-FR-13-03 (境界系)
- **Given**: L3 段階で並行して L7 troubleshoot PLAN 起票 (Incident mode、kind=troubleshoot)
- **When**: 起票
- **Then**: 許可 (Incident 例外) / L7 影響範囲を audit / L3 主線は中断しない

---

### FR-14: Reverse ワークフロー (5 type、R0-R4 + RGC)

- **L1 上流**: FR-L1-14 (onboarding context = FR-L1-44 前段)
- **入力**: 既存コード / 設計文書 / 依存
- **出力**: Rn 成果物 (evidence / contracts / as-is-design / gap-register / routing)
- **振る舞い**: `ut-tdd reverse --type <code|design|upgrade|normalization|fullback>` 起動 → R0→R4 順次実行 → R4 で Forward 合流 routing

#### AC-FR-14-01 (正常系)
- **Given**: 既存 src/ コード 1000 行に Reverse 適用
- **When**: `ut-tdd reverse --type code` → R0 (evidence) 完了
- **Then**: `.ut-tdd/reverse/R0-evidence.json` 生成 / 検出された関数 / クラス / 依存リスト記録 / 次 step R1 案内

#### AC-FR-14-02 (異常系)
- **Given**: confirmed_reverse_type 未指定で R PLAN 起票
- **When**: schema 検証
- **Then**: fail-close `Error: kind=reverse は confirmed_reverse_type 必須 (§3.3)` / 終了コード 1

#### AC-FR-14-03 (境界系)
- **Given**: R4 routing 先 = `gap-only` (Forward 合流せず gap 記録のみ)
- **When**: R4 完了
- **Then**: `.ut-tdd/reverse/R4-routing.json` に gap-only 記録 / Forward 起動なし / gap-register に追加

---

### FR-15: Discovery ワークフロー (仮説 → PoC → verify → decide)

- **L1 上流**: FR-L1-15
- **入力**: 仮説定義、verify script
- **出力**: poc PLAN / verify script / decision_outcome (confirmed / rejected / pivot)
- **振る舞い**: S0-S4 順次実行 / S4 で decision_outcome 必須 / confirmed → Forward L3 合流

#### AC-FR-15-01 (正常系)
- **Given**: 仮説「Tauri が Electron より bundle size 50% 小」を S0 起票
- **When**: S2 PoC 実装 + S3 verify (実測)
- **Then**: verify script 実行結果 (`tauri-bundle.json` 等) 記録 / S4 で `decision_outcome: confirmed` 設定可能

#### AC-FR-15-02 (異常系)
- **Given**: S4 で decision_outcome 未指定
- **When**: schema 検証
- **Then**: fail-close `Error: kind=poc + S4 は decision_outcome 必須 (§1.1)` / 終了コード 1

#### AC-FR-15-03 (境界系)
- **Given**: S4 で decision_outcome=pivot (仮説変更)
- **When**: 確定
- **Then**: 旧仮説 PLAN archive / 新仮説 PLAN 自動起票案内 / Forward 合流なし

---

### FR-16: Incident ワークフロー (本番障害)

- **L1 上流**: FR-L1-16 (Reverse fullback で V モデル昇華)
- **入力**: 本番障害アラート / SLO 逸脱
- **出力**: troubleshoot / recovery PLAN / postmortem / L14 フィードバック
- **振る舞い**: 緊急 hotfix → 即リリース → 収束後 Reverse fullback で V モデル昇華

#### AC-FR-16-01 (正常系)
- **Given**: 本番 SLO 逸脱検出 (例: error rate > 5%)
- **When**: `ut-tdd incident open --severity P0`
- **Then**: kind=troubleshoot PLAN 自動起票 / 通常 gate 順序 bypass 許可 (PO 自動承認 S-03 + audit) / hotfix 経路提示

#### AC-FR-16-02 (異常系)
- **Given**: Incident 開放後 hotfix 未実装で 24h 経過
- **When**: `ut-tdd doctor`
- **Then**: warn `Warning: Incident PLAN-XXX 未収束 24h 超 (postmortem 要起票)` / next_action 提示

#### AC-FR-16-03 (境界系)
- **Given**: 複数 Incident 同時オープン (P0 + P1)
- **When**: 並列管理
- **Then**: P0 優先 routing / P1 は queue / audit に同時オープン記録

---

### FR-17: CI/PR 連携 (ローカル証跡 → CI 検証 → branch protection)

- **L1 上流**: FR-L1-17
- **入力**: ゲート証跡、push イベント
- **出力**: PR 許可 / 拒否、CI チェック結果
- **振る舞い**: GitHub Actions で `ut-tdd gate <G-ID>` 再実行 → ローカル証跡と照合 → branch protection 連動

#### AC-FR-17-01 (正常系)
- **Given**: ローカルで G7 pass、push
- **When**: GHA workflow `.github/workflows/ut-tdd-gate.yml` 起動
- **Then**: CI 側 G7 再実行 pass / branch protection check pass / PR merge 可

#### AC-FR-17-02 (異常系)
- **Given**: ローカル G7 pass、CI G7 fail (環境差異)
- **When**: PR
- **Then**: PR block / CI 側 fail 詳細を `.ut-tdd/audit/ci-divergence/` に記録 / next_action `ローカル環境差異調査 (NFR-13 dev-local+CI 整合)`

#### AC-FR-17-03 (境界系)
- **Given**: hotfix branch (Incident mode) で CI 全 gate skip 要請
- **When**: PR
- **Then**: workflow が Incident PLAN 存在を確認 / G7 のみ pass 必須、他 gate skip 許可 / audit 記録

---

### FR-18: 横断検出 (ut-tdd doctor 一括集約)

- **L1 上流**: FR-L1-18
- **入力**: 全 detector 実行結果
- **出力**: 横断検出レポート、モードルーティング先
- **振る舞い**: `ut-tdd doctor` で依存漏れ / 契約漏れ / 接続欠損 / デグレ を全件集約 → HM-07 Doctor 結果ビューに表示

#### AC-FR-18-01 (正常系)
- **Given**: 全 detector 実装済、検出 0 件
- **When**: `ut-tdd doctor`
- **Then**: HM-07 ビューに `All clean (0 detections)` 表示 / 終了コード 0 / audit に実行記録

#### AC-FR-18-02 (異常系)
- **Given**: detector 5 件、検出 3 件 (error: 1 / warn: 2)
- **When**: `ut-tdd doctor`
- **Then**: HM-07 ビューに 3 件分類表示 (severity 別) / each 検出に next_action 提示 / error 1 件で終了コード 1

#### AC-FR-18-03 (境界系)
- **Given**: detector 1 件が timeout (例: trace check 巨大 repo で 30s 超)
- **When**: `ut-tdd doctor --timeout 30s`
- **Then**: 該当 detector のみ skip + warn `detector X timeout (30s)` / 他 detector 結果は集約 / next_action `--timeout 拡大 or detector tuning`

---

### FR-23: Scrum → V モデル昇華ワークフロー (workflow core、A-50 PO 指摘で carry→詳細化)

- **L1 上流**: FR-L1-23
- **入力**: スプリント完成インクリメント (kind=poc with workflow_phase=S0〜S4)
- **出力**: F0-F4 成果物、Reverse fullback 経由で V モデル各工程 doc 追補
- **振る舞い**: Scrum sprint 完了時に `ut-tdd reverse --type fullback` 自動起動 → R0-R4 を経て Forward L1/L3/L4-L6/L8-L9 へ統合

#### AC-FR-23-01 (正常系)
- **Given**: kind=poc / workflow_phase=S4 / decision_outcome=confirmed の PLAN 完了
- **When**: `ut-tdd reverse --type fullback --from-poc <plan-id>`
- **Then**: F0-F4 成果物が `.ut-tdd/reverse/F{0..4}.json` 生成 / Forward L3 合流 routing 提示 / 終了コード 0

#### AC-FR-23-02 (異常系: confirmed 以外で fullback 試行)
- **Given**: decision_outcome=rejected の PoC PLAN
- **When**: `ut-tdd reverse --type fullback`
- **Then**: fail-close `Error: fullback は decision_outcome=confirmed のみ許可 (rejected/pivot は不可)` / 終了コード 1

#### AC-FR-23-03 (境界系: 複数 PoC 同時 fullback)
- **Given**: 同時に 3 件の confirmed PoC が存在
- **When**: `ut-tdd reverse --type fullback --batch`
- **Then**: 各 PoC 個別に F0-F4 生成 / 優先度順 (PLAN-id 昇順) で逐次実行 / 全件成功で終了コード 0

---

### FR-24: Add-feature ワークフロー (workflow core、A-50)

- **L1 上流**: FR-L1-24
- **入力**: 既存 PLAN、追加要求
- **出力**: add-design / add-impl PLAN、影響範囲差分追補ドキュメント
- **振る舞い**: kind=add-design/add-impl で frontmatter.dependencies.parent 必須 (§1.10 E)、既存 PLAN への requires 接続を機械検証

#### AC-FR-24-01 (正常系)
- **Given**: 既存 PLAN-040 (kind=design) に追加機能を実装
- **When**: `ut-tdd plan draft --kind add-impl --parent PLAN-040 --title "X 機能追加"`
- **Then**: PLAN-NNN (kind=add-impl) 生成 / frontmatter.dependencies.parent = PLAN-040 / 影響範囲差分 doc 追補生成

#### AC-FR-24-02 (異常系: parent なし)
- **Given**: parent 未指定で add-impl PLAN 起票試行
- **When**: schema 検証
- **Then**: fail-close `Error: kind=add-* は dependencies.parent 必須 (§1.10 E)` / 終了コード 1

#### AC-FR-24-03 (境界系: parent が archived)
- **Given**: parent=PLAN-040 が status=archived
- **When**: add-impl 起票
- **Then**: warn `Warning: parent PLAN-040 は archived (差分追補対象として再活性化推奨)` / 起票続行可

---

### FR-25: Refactor ワークフロー (workflow core、A-50、振る舞い不変ガード)

- **L1 上流**: FR-L1-25
- **入力**: 対象コード、既存テスト (保護網)
- **出力**: refactor PLAN、module、テスト緑確認結果 (axis-11 regression 機械検証)
- **振る舞い**: kind=refactor、振る舞い不変を axis-11 regression で機械検証、G7 通過後 Forward 復帰

#### AC-FR-25-01 (正常系)
- **Given**: 既存 src/X.ts (test 保護網あり) を refactor、kind=refactor PLAN 起票
- **When**: `ut-tdd sprint check --regression-only`
- **Then**: 既存 test 全件 green 維持確認 / axis-11 regression pass / 振る舞い不変 audit 記録

#### AC-FR-25-02 (異常系: 既存テスト fail)
- **Given**: refactor 後に既存 test 1 件 fail
- **When**: sprint check
- **Then**: fail-close `Error: refactor で既存 test 破壊 (振る舞い不変違反、FR-25)` / 終了コード 1

#### AC-FR-25-03 (境界系: test 保護網が薄い)
- **Given**: refactor 対象 module の test coverage < 60%
- **When**: refactor PLAN 起票
- **Then**: warn `Warning: test 保護網が薄い (coverage 60% 未満、refactor リスク高)` / 起票続行可 / next_action `先に test 補強 PLAN 起票推奨`

#### AC-FR-25-04 (正常系: TDD brush-up green requires test IDs)
- **Given**: kind=refactor PLAN が既存振る舞いを変えずに構造変更を完了した
- **When**: `assertRefactorInvariant` を評価する
- **Then**: before/after behavior が一致し、regression exit_code=0 で、少なくとも 1 件の regression `test_id` が紐づく場合のみ Green とする

#### AC-FR-25-05 (DB trigger: relation graph / feedback 起点)
- **Given**: `harness.db` の `findings` / `quality_signals` / `feedback_events` / `impact_results` / `artifact_progress` に structural debt、missing dependency check、missing linked test ID のいずれかが記録されている
- **When**: Refactor 候補を抽出する
- **Then**: `debt_degradation` / `code_smell` / `structural` signal として kind=refactor PLAN 入力を生成でき、source docs は直接書き換えない

#### AC-FR-25-06 (異常系: dependency impact 未解消)
- **Given**: refactor 対象ファイルに relation-graph の open action が残っている
- **When**: PLAN を Green / completed 扱いにしようとする
- **Then**: Red のまま維持し、required action (sibling test / L6 contract review / paired design update / DB rebuild check) を evidence として返す

---

### FR-26: Retrofit ワークフロー (workflow core、A-50、段階移行)

- **L1 上流**: FR-L1-26
- **入力**: 移行対象構造・依存
- **出力**: retrofit-matrix、config、回帰テスト結果
- **振る舞い**: kind=retrofit、影響評価 retrofit-matrix 必須生成、段階 config 更新で L4-L7 段階移行

#### AC-FR-26-01 (正常系)
- **Given**: 既存構造 A を構造 B へ段階移行
- **When**: `ut-tdd plan draft --kind retrofit --target-structure B`
- **Then**: retrofit-matrix.yaml 生成 (影響: 依存 / インターフェース / テスト 3 軸) / 段階 config 提示 / G4 通過

#### AC-FR-26-02 (異常系: retrofit-matrix 欠落)
- **Given**: retrofit PLAN で matrix 未生成のまま G4 試行
- **When**: G4 ゲート
- **Then**: fail-close `Error: kind=retrofit は retrofit-matrix.yaml 必須 (FR-26)` / 終了コード 1

#### AC-FR-26-03 (境界系: 段階移行中の rollback)
- **Given**: 段階 2 / 4 で問題発覚、rollback 要請
- **When**: `ut-tdd cutover --to <previous-stage>`
- **Then**: 前段階 config に戻す / rollback 履歴 audit 記録 / Forward 復帰

---

### FR-27: Research ワークフロー (workflow core、A-50、ADR 生成)

- **L1 上流**: FR-L1-27
- **入力**: 調査課題、選択肢・制約
- **出力**: research-memo、ADR (architecture decision record)
- **振る舞い**: kind=research、generates=adr_snapshot 必須、ADR 生成後 L4 基本設計に合流

#### AC-FR-27-01 (正常系)
- **Given**: 技術選定調査を kind=research で起票
- **When**: `ut-tdd plan draft --kind research --topic "X library 選定"`
- **Then**: research-memo.md 生成 / 比較評価 + ADR draft / generates=adr_snapshot 自動設定

#### AC-FR-27-02 (異常系: generates 欠落)
- **Given**: kind=research で generates 未設定
- **When**: G3 ゲート (research → L4 合流前)
- **Then**: fail-close `Error: kind=research は generates=adr_snapshot 必須 (FR-27)` / 終了コード 1

#### AC-FR-27-03 (境界系: ADR 候補なし)
- **Given**: research の結論「既存案で十分、新規 ADR 不要」
- **When**: research close
- **Then**: ADR ではなく research-memo のみで完了 / status=completed / decision_outcome=rejected 同等 audit / 終了コード 0

---

### FR-29: 画面設計ワークフロー (L2、workflow core、A-50)

- **L1 上流**: FR-L1-29
- **入力**: L1 要求定義 (画面要求 14 件、business / functional)
- **出力**: L2 成果物 (screen-list / screen-flow / ui-element / wireframe)、G2 モック凍結証跡
- **振る舞い**: `ut-tdd plan draft --layer L2 --sub-doc screen` で 4 sub-doc 起票、Low-Fi default、High-Fi はケース別 (harness 内 OR 外部依頼、A-40 整合)

#### AC-FR-29-01 (正常系)
- **Given**: L1 G1 PASS 後、L2 画面設計起票
- **When**: `ut-tdd plan draft --kind design --layer L2 --sub-doc screen-list`
- **Then**: `docs/design/harness/L2-screen/screen-list.md` 起票 / 15 画面 (PM/HM/GD) baton 引継ぎ確認

#### AC-FR-29-02 (異常系: L1 未 PASS で L2 着手)
- **Given**: G1 未通過状態で L2 PLAN 起票試行
- **When**: G2 ゲート
- **Then**: fail-close `Error: G1 未通過、L2 着手不可 (V-model 順序遵守)` / 終了コード 1

#### AC-FR-29-03 (境界系: wireframe 外部依頼)
- **Given**: PLAN-L2-03 wireframe で外部依頼選択 (Figma / Excalidraw 等)
- **When**: 外部成果物が戻る → harness レビュー
- **Then**: L1 screen / business / functional と照合 / 不整合あれば **要件 back-propagation** (G1-trace 再検証必須、A-40 整合) / L10 UX refinement へ

---

### FR-30: フロントデザイン UX ワークフロー (L10、workflow core、A-50)

- **L1 上流**: FR-L1-30
- **入力**: L9 総合テスト結果、L2 ワイヤーフレーム、デザイントークン候補
- **出力**: L10 成果物、デザイントークン SSOT、a11y チェック結果、ビジュアル回帰結果
- **振る舞い**: L10 UX 磨きで visual design → token SSOT → a11y → visual regression → L11 引き渡し

#### AC-FR-30-01 (正常系)
- **Given**: L9 G9 通過後、L10 UX 起票
- **When**: `ut-tdd plan draft --layer L10 --sub-doc visual-design`
- **Then**: デザイントークン SSOT (`docs/design/harness/L10-ux/tokens.yaml`) 生成 / a11y チェック script 配置 / 終了コード 0

#### AC-FR-30-02 (異常系: token 二重定義)
- **Given**: L10 で既存 token 名と衝突 (例: `color.primary` 重複)
- **When**: token SSOT lint
- **Then**: fail-close `Error: token 名衝突 (color.primary は既定義、FR-30)` / 終了コード 1

#### AC-FR-30-03 (境界系: a11y warn 多発)
- **Given**: WCAG 2.1 AA チェックで warn 10 件以上
- **When**: G10 ゲート (UX 磨き完了確認)
- **Then**: warn 集約レポート出力 / 通過は許可 (warn は block しない) / next_action `critical 操作の keyboard 操作対応優先`

---

### FR-45: doc-reviewer 必須召喚 (BR-08 派生、L1 FR-L1-45 と 1:1 対応、A-47 → A-49 back-propagation)

- **L1 上流**: BR-08 (doc 品質の継続レビュー) → FR-L1-45 (L3 back-propagation で L1 追加)
- **入力**: 大規模 doc 改定 / gate evidence 提出 / pair freeze の trigger event
- **出力**: doc-reviewer (pmo-sonnet とは責務分離した read-only reviewer) 召喚記録 / 品質観点 (整合/網羅/一貫/明確) チェック結果
- **振る舞い**: trigger event 発火時に doc-reviewer 必須召喚を機械強制、未召喚で gate (G1/G3/G7/G11) 通過禁止
- **ID 補番注記 (A-49)**: 当初 L3 FR-19 として起草 (A-47 Critical C-02) → L1 FR-L1-19 (Learning Engine、P1) と ID 衝突発覚 → **FR-45 にリネーム + L1 FR-L1-45 として back-propagation** (PO 指摘 2026-05-28)

#### AC-FR-45-01 (正常系)
- **Given**: 大規模 doc 改定 (例: L3 sub-doc 本起草 commit) を実行、doc-reviewer 召喚
- **When**: `ut-tdd review --uncommitted --reviewer doc-reviewer`
- **Then**: 品質観点 4 軸 (整合/網羅/一貫/明確) チェック結果が `.ut-tdd/audit/doc-reviews/<timestamp>.json` 記録 / pass で次工程 (gate) 許可 / 終了コード 0

#### AC-FR-45-02 (異常系: 未召喚で gate 試行)
- **Given**: 大規模 doc 改定後、doc-reviewer 未召喚で `ut-tdd gate G3` 実行
- **When**: G3 ゲート判定
- **Then**: fail-close `Error: G3 通過には doc-reviewer 召喚必須 (BR-08 / FR-45)` / next_action `ut-tdd review --uncommitted --reviewer doc-reviewer 実行` / 終了コード 1

#### AC-FR-45-03 (境界系: bypass = PO 専属)
- **Given**: PO が `UT_TDD_DOC_REVIEWER_BYPASS=1` で bypass 試行 (緊急 hotfix 等)
- **When**: G3 ゲート判定
- **Then**: bypass + audit `.ut-tdd/audit/doc-reviewer-bypass/<timestamp>.json` (PO ID + 理由必須) / KPI D-08 集計 / 終了コード 0

---

## §3 carry 宣言 (P1 / P2 / Phase B)

| FR-L1 | 優先度 | carry 先 | 理由 |
|-------|--------|---------|------|
| FR-L1-19 (Learning Engine) | P1 | Phase B carry | telemetry 整備後の本実装 |
| FR-L1-20 (観測・計測層) | P1 | L4 carry + Phase B 拡張 | invocation_log / accuracy_score 等の集計アーキは L4 / Phase B telemetry は別途 |
| **FR-L1-23/24/25/26/27/29/30 (Scrum/Add-feature/Refactor/Retrofit/Research/画面設計/フロントUX)** | **P1** | **L3 直接詳細化 (A-50、workflow core = harness ガードレール)** | **PO 指摘「ワークフローがガードレールだからハーネスとしてのコア」**: L4 carry にすると harness の核心価値を外す。L3 で FR-23/24/25/26/27/29/30 + AC 21 件 + AT 21 件で詳細化 |
| FR-L1-21/22 (FE detector / 観点 W 字ゲート) | P1 | L4 carry | detector 詳細仕様は L4 基本設計 |
| FR-L1-28 (W 2 段設計 Phase 1+2 agent 昇華) | P1 | L4 carry | drive=agent 拡張は L4 carry |
| FR-L1-31〜35 (コンテキスト / フォルダ / 棚卸し / 穴管理 / 整備可視化) | P2 | L4 carry | 整備系は L4 / Phase B carry |
| FR-L1-37/39/40/41/42/44 (model 推挙 / 難易度 / drive 別 state / drive 自動判定 / provider 引継ぎ / onboarding) | P1 | L4 carry | drive 軸拡張は L4 データ設計連動 / onboarding は L4 設計連動 |
| FR-L1-46 / FR-L1-47 / FR-L1-48 / FR-L1-49 (内部資産 UT-TDD 化: subagent roster / skill pack curate / command CLI 化 / drift lint) | P1 | L4-L6 carry | BR-22 派生、Recovery PLAN-RECOVERY-01。roster=W6/W7・skill pack=W10・command=W11/W12/W16・drift lint=IMP-033 (L6-L7)。棚卸 = internal-asset-inventory.md |
| FR-L1-50 (DDD/TDD strictness automation) | P1 | L6-L8 Add-feature carry | PO directed 2026-06-09。domain boundary / invariant trace / Red-first evidence / oracle strength / integration GWT を PLAN-L6-26..30 / PLAN-L7-27..31 / PLAN-REVERSE-26..30 で機械化 |
| FR-L1-51 (artifact progress color projection) | P1 | L4-L7 fullback carry | PLAN-L7-56 で実装が先行した artifact 単位の赤/黄/緑進捗を、PLAN-REVERSE-56 で L1 要件・L4 機能・L5 physical-data へ fullback。green は linked test + dependency clear、yellow は実装中/未テスト、red は依存未確認/未回収 |
| FR-L1-05/06/07/17/18/19/20/24/49/50 A-124 extension | P1 | L5-L7 Add-feature carry + Phase 4 DB implementation | 横断 relation graph、impact expansion、diagram export、tool adapter normalization を requirements §6.8.9 / physical-data §9.5 / ADR-002 A-124 addendum で back-propagation。`ut-tdd graph impact` / `ut-tdd graph export` / optional dependency-cruiser・Knip・Madge・Graphviz・Mermaid・D2 adapter を後続 PLAN で機械化 |
| FR-L1-05/06/07/17/18/19/20/24/45/49/50 A-125 extension | P1 | L5-L7 Add-feature carry + Phase 4 DB implementation | MCP server profile、MCP Inspector smoke、external verification profile recommendation、profile security gate を requirements §6.8.10 / physical-data §9.6 / ADR-002 A-125 addendum で back-propagation。`ut-tdd mcp profile` / `ut-tdd mcp inspect` / `ut-tdd verify recommend` / `ut-tdd verify run` を後続 PLAN で機械化 |
| FR-L1-05/06/07/17/18/20/24/33/45/50 A-126 extension | P1 | L5-L7 Add-feature carry + Phase 4 DB implementation | 企画・要件定義・詳細設計・PLAN・ADR・テスト設計の正本ドキュメントを CSV / Markdown summary / XLSX / PPTX へ変換する document export を requirements §6.8.11 / physical-data §9.7 / ADR-002 A-126 addendum で back-propagation。`ut-tdd export docs --kind ... --format ...` を後続 PLAN で機械化 |
| FR-L1-36 (skill 評価) / FR-L1-38 (model 評価) / FR-L1-43 (PoC 計測) | P2 | **PLAN-L3-02 (business-detail.md) に委譲** (FR-L1-36 / FR-L1-38 / FR-L1-43 はすべて PLAN-L7-53 で実装済み、2026-06-15) | BR-21 経路で扱う (重複回避) |

### §3.1 P1 残 carry 明示 note (A-47 + A-50、L4 PLAN 起票時の必須参照)

A-50 で workflow core 7 件 (FR-L1-23/24/25/26/27/29/30) を L3 直接詳細化 (FR-23〜30) に格上げしたため、残 P1 carry は以下:

| FR-L1-ID | L4 carry 先 | 受入条件 placeholder (L4 PLAN で詳細化) |
|----------|------------|--------------------------------------|
| FR-L1-21 (テスト観点 W 字ゲート) | PLAN-L4-NN-test-perspective-gate | 設計項目へのテスト観点抜け検出 + レベル間重複検出 (static fail-close) |
| FR-L1-22 (FE detector 5 軸) | PLAN-L4-NN-fe-detector | mock-promotion / design-token-drift / a11y-regression / visual-regression / state-transition-drift |
| FR-L1-28 (W 2 段設計) | PLAN-L4-NN-w2-stage | Phase 1 (一般) + Phase 2 (agent 昇華) を L10 合流、drive=agent 追加 |
| FR-L1-37 (model 推挙) | PLAN-L4-NN-model-suggestion | task × drive × L 別の model + reasoning effort 動的選定 |
| FR-L1-39 (タスク難易度) | PLAN-L4-NN-task-complexity | 規模 / 依存 / 不確実性 × drive 別スコアリング |
| FR-L1-40 (drive 別 state 分離) | PLAN-L4-NN-drive-state-isolation | drive 軸 state 区画 (`.ut-tdd/drive/<drive>/`) + skip_sub_doc 機械強制 (FR-L1-06 の drive 拡張、A-54 で §3.1 明示追加) |
| FR-L1-41 (drive 自動判定) | PLAN-L4-NN-drive-auto-classify | PLAN/コード/拡張子から drive 自動分類 → orchestration_mode routing (FR-L1-08 の drive 拡張)。AC-FR-08 の drive 判定入力 shape を本 PLAN で確定 (A-54 で §3.1 明示追加) |
| FR-L1-42 (provider 引継ぎ) | implemented 2026-06-08 (`provider-handover.v1`) | Claude ↔ Codex の context+PLAN+budget 連携渡し |
| FR-L1-44 (onboarding) | PLAN-L4-NN-onboarding | 既存 repo への harness baseline 確立、`.ut-tdd/` 初期 baseline |
| FR-L1-50 (DDD/TDD strictness automation) | PLAN-L6-26..30 / PLAN-L7-27..31 / PLAN-REVERSE-26..30 | DDD/TDD SSoT、workflow anchor、Red-first evidence、test oracle、integration GWT を機械検出し、重要 gate では定量 evidence と定性 review evidence を抱き合わせる |
| FR-L1-51 (artifact progress color projection) | PLAN-L7-56 / PLAN-REVERSE-56 | artifact ごとの進捗色を `artifact_progress` として DB projection 化し、依存未確認/未回収を red、実装中/未テストを yellow、linked test + dependency clear を green として機械検索可能にする |
| FR-L1-02/06/07/17/18/20/45/50 A-122 extension | PLAN-L5-08 + A-122 addendum / Phase 3-4 seed IMP-107..116 | UT evidence history (`test_cases/test_runs/test_results/test_flake_events`)、GreenDefinition、Bun `bun:sqlite` collector/rebuild/migration、CI/hook/OS evidence matrix を requirements-level acceptance として束ねる。新 FR 採番ではなく既存 FR の DB/自動化/定量+定性 bundle 強化 |
| FR-L1-05/06/07/17/18/19/20/24/49/50 A-124 extension | PLAN-L5-08 + A-124 addendum / Phase 4 seed IMP-118..120 | `graph_nodes/dependency_edges/impact_rules/impact_results/tool_runs/diagram_artifacts/graph_snapshots` を DB projection に追加し、変更ファイルから関連設計・コード・テスト・DB・図を列挙する。外部ツールは optional adapter、gate は正規化DB rowで判定 |
| FR-L1-05/06/07/17/18/19/20/24/45/49/50 A-125 extension | PLAN-L5-08 + A-125 addendum / Phase 4 seed IMP-121..124 | `mcp_server_profiles/mcp_profile_triggers/mcp_server_runs/verification_profiles/verification_recommendations/external_tool_findings` を DB projection に追加し、relation graph impact から MCP / browser / DB container / API mock / GitHub workflow verification profile を推薦・検証・記録する。 |
| FR-L1-05/06/07/17/18/20/24/33/45/50 A-126 extension | PLAN-L5-08 + A-126 addendum / Phase 4 seed IMP-126 | `document_export_profiles/document_export_runs/document_export_datasets/document_export_artifacts` を DB projection に追加し、企画・要件定義・詳細設計・PLAN・ADR・テスト設計から source anchor 付き spreadsheet / Excel / PPTX 変換物を生成・記録する。 |
| FR-L1-31〜35 (P2 コンテキスト/フォルダ/棚卸し/穴管理/整備可視化) | PLAN-L4-NN-infra-readiness | 整備系、Phase B carry 含む |

> **A-50 で 6 件削減** (FR-L1-23/24/25/26/27/29/30 = workflow core 7 件を L3 詳細化に格上げ)。**A-54 で FR-L1-40/41 を本 §3.1 表に明示追加** (§3 主表に L4 carry 宣言済だが §3.1 詳細表から漏れていた不整合を解消、audit 軸2 C-01/C-02)。残 P1 L4 carry = 9 件 (FR-L1-21/22/28/37/39/40/41/42/44) + P2 (FR-L1-31〜35) + Phase B (FR-L1-19/20)。いずれも workflow core ではないため L4 carry を維持。

### §3.2 UX-01 (3 バランス価値体験) AC + AT 追加 (C-01 補完)

UX-01 (process / safety / automation の 3 バランス) は全画面横断宣言のみで AT 未設定だったため、本 sub-doc で AC 追加:

#### AC-UX-01-01 (3 バランス被覆確認)
- **Given**: 1 sprint で複数 PLAN を実行
- **When**: sprint 末 KPI 集計
- **Then**: process 指標 (D-03 V-model 順序遵守違反 = 0) + safety 指標 (D-04 回帰検出率 ≥ 80% + D-06 bypass 0 努力目標) + automation 指標 (D-07 AI 委譲時間率 ≥ 70%) の **3 軸全てで閾値 pass**。1 軸のみ突出 (例: D-07 高だが D-04 低) は warn

> 対応 AT は L12 受入テスト §1.2 末尾 AT-UX-01 で追加。

## §4 画面 trace (L2 deep-link、screen §5 G1-trace 継承)

screen §5 G1-trace マトリクスを継承し、L3 FR-* × 15 画面 (PM/HM/GD) の trace を AC レベルに展開する。

**継承元**: `docs/design/harness/L1-requirements/screen-requirements.md` §5.3 (FR-L1 P0 ⇔ 画面 trace)

**L3 拡張**: 各 FR-* の AC-* について、画面紐付き必要時に AT-* (L12 受入テスト) で画面 lift 確認を pair 化する (L12 受入テスト設計担当)。

| FR-ID | 主画面 (継承) | AC レベル画面拡張 |
|-------|-------------|---------------|
| FR-01 | PM-02 / PM-01 | AC-FR-01-01 → PM-02 起票画面 lift / AC-FR-01-02 → エラーメッセージ表示 |
| FR-03 | PM-04 / HM-07 | AC-FR-03-01 → PM-04 trace ビュー / AC-FR-03-02 → HM-07 Doctor 結果 |
| FR-05 | PM-03 / HM-07 | AC-FR-05-01 → PM-03 Gate 判定 / AC-FR-05-03 → HM-05 audit log |
| FR-09 | HM-05 / HM-03 | AC-FR-09-01〜03 → HM-05 agent guard audit ログ表示 |
| FR-10 | HM-06 / PM-03 | AC-FR-10-01 → HM-06 CLI ロールバックコマンドコピー UI / S5=b 整合 |
| FR-18 | HM-07 / PM-04 | AC-FR-18-01〜03 → HM-07 Doctor 結果ビュー、severity 別表示 |

(残 12 FR の AC レベル拡張は L2-screen 本起票 + L12 AT-* 起票時に確定)

## §5 9 mode × FR 整合 + drive タグ + 人間判断点 (CC2 carry)

§2 表の「対応 mode」「対応 drive」「人間判断点」列で全 FR-* に明示済み。**CC2 (人間主導 + AI 補助原則) carry 充足**: 全 18 FR で人間判断点が明示され、AI 単独自動化に依存しない設計。

### §5.1 9 mode 被覆確認 (A-50 で全 9 mode 直接被覆達成)

| mode | 被覆 FR | 備考 |
|------|--------|------|
| Forward | FR-01 / FR-02 / FR-13 | 主線 mode、L0-L14 主要 FR |
| Reverse | FR-14 (専用) / FR-03 | R0-R4 + RGC + trace 検証 |
| Discovery | FR-15 (専用) / FR-08 (自動起動) | S0-S4 + 仮説判定 |
| Incident | FR-16 (専用) / FR-08 / FR-10 | 緊急 hotfix + Recovery |
| Recovery | FR-10 (専用) / FR-08 | 暴走収束 |
| **Refactor** | **FR-25 (専用、A-50)** / FR-08 (自動起動) | axis-11 regression 振る舞い不変機械検証 |
| **Retrofit** | **FR-26 (専用、A-50)** / FR-08 (自動起動) | retrofit-matrix 影響評価 + 段階移行 |
| **Add-feature** | **FR-24 (専用、A-50)** | parent PLAN requires 接続、差分追補 |
| **Scrum** | **FR-23 (専用、A-50)** | inkrement → reverse fullback → V モデル昇華 |
| **screen-design (L2 専門)** | **FR-29 (専用、A-50)** | L2 IA → 画面一覧 → 遷移 → wireframe |
| **frontend-design (L10 専門)** | **FR-30 (専用、A-50)** | visual → token SSOT → a11y → visual regression |
| Research | **FR-27 (専用、A-50)** | kind=research、generates=ADR |

> **9 mode + 工程専門 2 = 11 mode 全件 L3 で直接被覆達成 (A-50)**。PO 指摘「ワークフローがガードレールだからハーネスとしてのコア」反映、L4 carry → L3 直接詳細化に格上げ。

### §5.2 drive 軸被覆確認

全 FR で drive=all (汎用) を default とし、drive 固有要件は以下のみ:
- FR-09 (AI ガード): drive=agent 主、他 drive でも適用
- FR-06 (state 一元管理): drive 別区画 (FR-L1-40 連動、L4 carry)

### §5.3 人間判断点全件サマリ

| 判断点種別 | 該当 FR | 主担当 |
|-----------|--------|--------|
| gate サインオフ | FR-05 / FR-13 | PO (G1/G3/G7/G11) / TL (G4-G6) |
| bypass / override | FR-05 / FR-09 / FR-16 | PO 専属 (S-03) |
| 修正方針判断 | FR-03 / FR-10 / FR-17 / FR-18 | TL / 運用者 |
| 起票 / 仕様判断 | FR-01 / FR-04 / FR-14 / FR-15 | PO / TL |
| optional 確認 | FR-02 / FR-06 / FR-07 / FR-11 / FR-12 | TL / 運用者 |

## §6 関連 doc

- L1 機能要求 (上流): `docs/design/harness/L1-requirements/functional-requirements.md`
- L1 業務要求 (上流): `docs/design/harness/L1-requirements/business-requirements.md`
- L1 画面要求 (上流、§5 trace 継承): `docs/design/harness/L1-requirements/screen-requirements.md`
- L1 NFR (上流): `docs/design/harness/L1-requirements/nfr.md`
- L2-screen (deep-link 接続): `docs/design/harness/L2-screen/`
- L3 business-detail (BR-21 経路): `docs/design/harness/L3-functional/business-detail.md`
- L3 nfr-grade (NFR 閾値): `docs/design/harness/L3-functional/nfr-grade.md`
- L12 受入テスト設計 (W pair): `docs/test-design/harness/L3-acceptance-test-design.md`
- L0 概念層: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- PLAN: `docs/plans/PLAN-L3-01-functional-detail.md`

## §7 carry / 次工程 (L4) への引き継ぎ

- **L4 基本設計 (PLAN-L4-01〜05)**:
  - 各 FR-* の実現アーキ (state schema / CLI コマンド設計 / hook 実装方式) は L4 基本設計で確定
  - 残 P1 件 + P2 5 件は L4 / Phase B / PLAN-L3-02 で AC + 詳細化
- **L4 データ設計 (PLAN-L4-04)**: business §10.2 L4 carry 表 7 項目 (集約境界 / 値オブジェクト等) + 各 FR の入出力データ構造を L4 で確定
- **A-122 requirements back-propagation**: UT evidence history、GreenDefinition、DB collector/rebuild/migration、CI/hook/OS evidence matrix は、L1 functional §7 と requirements §6.8.7 に戻した。L4/L5/L6 では `FR-L1-02/06/07/17/18/20/45/50` の既存 FR 拡張として AC/DbC/IT を追加し、新 FR 採番は行わない。
- **L7 実装スプリント**: 各 AC-* を TDD Red の入力として使用。Given-When-Then 形式を vitest describe-it に直接変換可能
- **L12 受入テスト設計**: 全 54+ AC-* を AT-* で被覆 (孤児 0)。本 sub-doc 完成後に L12 担当 sub-doc 本起草
- **G3 lint 実装** (`ut-tdd plan lint --gate G3-trace`): R1 (BR/UX/FR-L1 → L3) / R2 (FR-* → AC → AT) / R3 (AT → 要求) / R4 (NFR → 閾値 → AT) は L7 実装済みで、`ut-tdd doctor` hard gate に集約される
- **CC2 carry 強化**: L4 / L5 / L6 設計で「人間判断点」明示を継承 (各設計 layer に対応列追加)

### §7.1 OSS フォーク候補 (tech-fork 調査 A-46、L4 ADR 入力)

| 領域 | 採用候補 | license | 推奨度 | 役割 |
|------|---------|---------|--------|------|
| BDD/AC framework | **vitest BDD plugin + chai-as-promised** (調査中、@cucumber/cucumber TS adapter 候補) | MIT | 推奨 | AC Given-When-Then を vitest describe-it に直接マップ |
| DDD entity 管理 | **zod + drizzle-orm**(zod 既採用) | MIT/Apache | 強推奨 | entity schema 正本、永続化は JSON ファイル (LowDB) |
| CLI library | **commander + @clack/prompts** | MIT | **強推奨** | subcommand ディスパッチ + 対話 UX (next_action) |
| state management | **lowdb** (Phase A) + **xstate** (Phase B 状態遷移) + **PGlite** (Phase B SQL) | MIT/Apache | 強推奨 | ファイルベース state、9-mode 状態遷移、Phase B 集計 |
| hook framework | **lefthook + lint-staged** | MIT | **強推奨** | git + Claude Code + Codex 3 系統 hook 統制 |
| coding standards | **Biome v2 (既採用) + knip** | MIT/Apache/ISC | **強推奨** | formatter + linter + dead code 検出、Bun ネイティブ |

### §7.2 PdM 提案 (pdm 調査 A-46、Phase A 即適用 / Phase B carry)

| 提案 ID | 内容 | 適用 | L1/L3 接続 |
|---------|------|------|-----------|
| **D-10〜D-13** (DORA) | Deployment Freq / Lead Time / CFR / MTTR を KPI 追加 (9-mode 別集計) | Phase A NFR | business §6.5 KPI 拡張 |
| **D-14** (SPACE Satisfaction) | reviewer cognitive load Likert 1-5 (G2/G4/G7 後) | Phase A NFR | CC2 measurable proxy、HM-08 連動 |
| **D-15** (SPACE Communication) | handover record 完全性 score (D-09 拡張) | Phase A NFR | 9-mode 切替時 context loss 直撃指標 |
| **D-16** (SPACE Efficiency) | gate G2-G7 待機時間 (block time、flow efficiency) | Phase A NFR | bottleneck phase identify |
| **D-17** (LinearB) | PLAN diff median LOC soft target 300 | Phase A NFR | AI 委譲大型 diff 防止 |
| **BR-JTBD-01** | 3 層 job 明文化 (Functional/Emotional/Social) + UX-04 audit evidence 可視化新設 | Phase A add-design 候補 | business §1 / UX 拡張 |
| **BR-NSM-01** | NSM = Verified AI delivery rate (D-10 候補、process × safety × automation 統合) | Phase A add-design 候補 | KPI 集約 |
| **BR-TTV-01** | Aha moment + TTV ≤ 15 分 (FR-L1-44 連携) | Phase A→B 橋渡し | sample repo + migration tool + 教育資料 + CI template = whole product |
| **BR-multi-01/02 + FR-L1-multi-01/02** | tenant 分離 + cross-team handover + team dashboard + policy inheritance | Phase B carry | multi-team 拡張時に活性化 |

### §7.3 設計手法 carry (tech-docs 調査 A-46、L4 governance)

- **back-propagation protocol 4-step** (`docs/governance/back-propagation-protocol.md` L4 起票): kind=reverse + confirmed_reverse_type=design による下流→上流 entity 進化記録手順
- **NFR 3-tier classification** (`docs/design/nfr-classification.md` L4 起票): A doctor 自動 / B CI 後人間確認 / C PO 合意のみ
- **Neurosymbolic Guard Pattern** (ADR-002 候補): LLM 判断ではなく TS 決定論コード + audit append-only (agent-guard.ts 既存実装の正本化)
- **Testable Contract as Freeze Gate** (L7 carry): V-model 各 layer exit = artifact テスト可能性の機械検証 (`vmodel_validator` 実装)

> **process 改善 carry (A-46 + PO 指摘 2026-05-28)**:
> 1. PLAN 起票時に Web 検索 + OSS フォーク + pdm 調査を組み込む process 改善 (現状: PLAN-L3-01〜03 §3 ヒアリング項目に Step 0 = 外部調査を追加)
> 2. agent-guard に opus pdm-* 系の追加制約 (明示 --allow 必要、weekly quota 保護)
> 両件、別 commit で governance に反映予定。
## A-124 BACKPROP NOTE

A-124 requirements back-propagation: cross-artifact relation graph, impact expansion, diagram export, and tool adapter normalization have been returned to L1 functional §7 and requirements §6.8.9. L5 physical-data §9.5 defines the DB projection tables and invariants. L6/L7 follow-up work must implement graph impact, graph export, and optional tool adapter normalization as extensions of existing FR-L1-05/06/07/17/18/19/20/24/49/50, without allocating new FR IDs.

## A-125 BACKPROP NOTE

A-125 requirements back-propagation: MCP server profiles, external verification profiles, MCP Inspector smoke, profile-trigger automation, and profile security gates have been returned to L1 functional §7 and requirements §6.8.10. L5 physical-data §9.6 defines the DB projection tables and invariants. L6/L7 follow-up work must implement profile probing, Inspector smoke, verification recommendation, and allow-listed verification runs as extensions of existing FR-L1-05/06/07/17/18/19/20/24/45/49/50, without allocating new FR IDs.

## A-126 BACKPROP NOTE

A-126 requirements back-propagation: canonical document export for concept/planning, requirements, detailed design, PLAN, ADR, and test-design documents has been returned to L1 functional §7 and requirements §6.8.11. L5 physical-data §9.7 defines the DB projection tables and invariants. L6/L7 follow-up work must implement document structure parsing, export dataset generation, built-in CSV/Markdown rendering, optional XLSX/PPTX renderer readiness, and artifact stale detection as extensions of existing FR-L1-05/06/07/17/18/20/24/33/45/50, without allocating new FR IDs.
## TDD-drive extension: 駆動モデル別 TDD 適性と DB 発火

- **L1 upstream**: FR-L1-08 / FR-L1-25 / FR-L1-29 / FR-L1-30
- **Input**: drive/mode, `findings`, `quality_signals`, `feedback_events`,
  `graph_nodes`, `dependency_edges`, `impact_results`, `artifact_progress`
- **Output**: TDD compatibility (`strong` / `partial` / `weak`), Red triggers,
  Yellow state, Green requirements
- **Behavior**: `classifyDriveTddFits` returns the TDD-style fit for every drive
  model and design specialty. DB projection rows may fire workflow signals or
  PLAN inputs, but DB remains a projection and must not directly edit authored
  PLAN/docs/source.

### FR-L1-39 addendum: proposal document coverage classification

- **Function**: `classifyProposalDocumentCoverage`
- **Purpose**: derive the minimum design/test-design document pack from proposal
  or task text before implementation work starts.
- **Output**: additive required design docs, required test-design docs, required
  evidence, gates, research adoption decisions, rejected research inputs,
  escalators, guardrails, and findings.
- **Coverage packs**: screen/UI, business flow, frontend design, UX/usability,
  API/IF, data/DB, batch/report, report output, async/job flow,
  notification/message, common component, security/privacy,
  error/observability/audit, ops/release/migration, NFR/quality, test design,
  backend function, workflow/gate, agent orchestration, discovery, and baseline.
- **Research split**: external templates are separated into `incorporate`,
  `reference`, `ut-tdd-specific`, and `exclude`. Template material may add
  required evidence, but it cannot remove UT-TDD-required documents.
- **Test-design routing**:
  `docs/test-design/harness/proposal-document-coverage-routing.md` defines the
  L7/L8/L9/L12/L14 test-design response for each coverage pack and tier.
- **Guardrail**: LLM or prose claims such as `minor`, `simple`, `skip`, or
  `not needed` are findings only. They do not lower granularity or remove
  required artifacts.

### AC-FR-TDD-01: strong targets

- **Given**: mode = design / add-feature / refactor / reverse / retrofit /
  recovery / incident / screen-design / frontend-design
- **When**: `classifyDriveTddFits` evaluates the modes
- **Then**: each returns `compatibility=strong` with Red trigger sources,
  Yellow state, and Green requirements.

### AC-FR-TDD-02: partial / weak targets

- **Given**: mode = discovery / scrum / research
- **When**: TDD compatibility is evaluated
- **Then**: discovery/scrum return `partial`, research returns `weak`; they are
  not treated as normal Red-Green-Refactor completion loops.

### AC-FR-TDD-03: DB-triggered Red

- **Given**: DB projection has structural debt, design gap, dependency impact,
  a11y/VRT/token drift, regression, or artifact progress red/yellow
- **When**: workflow signal generation runs
- **Then**: the row can become a Red trigger for the matching drive/mode and a
  PLAN input, while authored source remains unchanged until an explicit PLAN
  updates it.
