---
layer: L3
executed_at_layer: L12
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L3-functional/
parent_doc: docs/design/harness/L3-functional/README.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l3_functional: docs/design/harness/L3-functional/functional-requirements.md
related_l3_business: docs/design/harness/L3-functional/business-detail.md
related_l3_nfr: docs/design/harness/L3-functional/nfr-grade.md
next_pair_freeze: L3
v2_import: docs/migration/v2-import-ledger.md
created: 2026-05-28
updated: 2026-06-02
---

# UT-TDD Agent Harness — L3 受入テスト設計 (④ / AT-*)

> **layer (作成層 = V-pair key)**: L3 (要件) / **executed_at_layer (実施層)**: L12 (受入) / **artifact**: ④ 受入テスト設計 (V-model 右、② L3 全 sub-doc と対)
> **pair (V-model L3↔L12)**: `docs/design/harness/L3-functional/{functional-requirements,business-detail,nfr-grade}.md` 3 sub-doc 全体 ↔ 本書 1 doc
> **status**: confirmed (A-100 で ① と対の G3 pair freeze 両側揃い、2026-06-04。PLAN-L3-01/02/03 と並行確定)
> **正規式モデル (PLAN-RECOVERY-02、2026-06-04)**: L3⇔L12 の検証本質 = **本番受入** (本番環境で要件 FR+AC が満たせるか)。データ実在性エスカレーションの本番 band (画面の実データ検証 L10 の後に位置)。
> **PLAN**: `docs/plans/PLAN-L3-{01..03}-*.md` Step 6 / DoD で本書参照

## §0 量閉じ原則 (L3 ↔ L12)

- 全 L3 FR-* (26 件 = FR-01〜18 + FR-45 + workflow core 7 件 [FR-23〜27/29/30]) / AT 対応必須
- 全 AC-* (54+ 件、3.section AC) / AT 対応必須
- 全 BR-21 派生 (FR-BR21-36/38/43) / AT 対応必須
- 全 NFR-* (15 件、NFR-09/10 欠番。NFR-17 = 統合セキュリティ A-54 追加) / AT 対応必須 (carry の場合は placeholder AT)
- 孤児 = 0 (機械検証 `ut-tdd plan lint --gate G3-trace`)

## §1 受入テスト (AT-*)

### §1.0a Distribution acceptance addendum (PLAN-L7-157)

| AT-ID | 対応条件 | 受入条件 | 機械検証 |
|-------|---------|---------|---------|
| **AT-DIST-001** | clean distribution / installable same-core CLI environment | Planned clean artifact set を temp repo に展開し、`bun install --frozen-lockfile` 後に `status --json`、`distribution plan --tag v0.1.0 --json`、`typecheck` が通る。外部 clean GitHub repo 作成、tag push、signed tarball publish は PO 承認後の公開操作として本 smoke では実行しない。source repo 用 full `doctor` は dogfood PLAN/design/test-design/runtime artifacts を要求するため、clean distribution の受入条件ではなく consumer doctor profile の別設計対象とする。 | `tests/distribution-acceptance.test.ts` |

### §1.1 functional sub-doc 由来 AT (FR-01〜18 × AC 3 件 = 54+ AT)

| AT-ID | 対応 AC | 受入条件 (Given-When-Then を変換) | 機械検証 |
|-------|---------|------------------------------|---------|
| **AT-FR-01-01** | AC-FR-01-01 (PLAN 起票 正常系) | `ut-tdd plan draft --title "X" --kind design --layer L3 --drive be` 実行 → PLAN ファイル + plan_registry 登録 / 終了コード 0 | vitest CLI test |
| **AT-FR-01-02** | AC-FR-01-02 (重複 plan_id) | 重複 ID 指定 → fail-close error 出力 / 既存ファイル不変 / exit 1 | vitest CLI test |
| **AT-FR-01-03** | AC-FR-01-03 (charter + L4 排他) | kind=charter + layer=L4 → schema 検証 fail / exit 1 | vitest schema test (frontmatter.test.ts 整合) |
| **AT-FR-02-01** | AC-FR-02-01 (TDD Red→Green) | Red test → 本体実装 commit → `ut-tdd sprint check` pass | vitest + git workflow test |
| **AT-FR-02-02** | AC-FR-02-02 (test 無し本体) | 本体 only → fail-close TDD 違反 error / exit 1 | vitest CLI test |
| **AT-FR-02-03** | AC-FR-02-03 (Red 緑のまま) | assertion 緩い test → warn 継続可 | vitest CLI test |
| **AT-FR-03-01** | AC-FR-03-01 (trace 整合 pass) | 4 artifact 全件 → `ut-tdd trace check` pass / report 12/12 edges | vitest trace test |
| **AT-FR-03-02** | AC-FR-03-02 (test 設計欠落) | pair 欠落 → fail-close trace 断絶 error / exit 1 | vitest trace test |
| **AT-FR-03-03** | AC-FR-03-03 (generates 未宣言) | pair_artifact のみ → warn / exit 0 | vitest trace test |
| **AT-FR-04-01** | AC-FR-04-01 (kind enum pass) | kind=design + 依存 PLAN 存在 → lint pass | vitest plan lint test |
| **AT-FR-04-02** | AC-FR-04-02 (循環依存) | 自己 requires → fail-close 循環依存 error / exit 1 | vitest plan lint test |
| **AT-FR-04-03** | AC-FR-04-03 (impl + parent_design 欠落) | kind=impl で parent_design なし → schema fail / exit 1 | vitest schema test (既存 frontmatter.test.ts カバー) |
| **AT-FR-05-01** | AC-FR-05-01 (G3 全 check pass) | G3 条件全件満たす → phase.yaml G3=passed / gate_runs 記録 | vitest gate test |
| **AT-FR-05-02** | AC-FR-05-02 (G3 fail-close trace 孤児) | 孤児 FR-L1 3 件 → fail-close error / next_action 提示 | vitest gate test |
| **AT-FR-05-03** | AC-FR-05-03 (bypass S-03 行使) | UT_TDD_GATE_BYPASS=1 → bypass + audit / phase.yaml bypassed / D-08 集計 | vitest gate + audit test |
| **AT-FR-06-01** | AC-FR-06-01 (drive 別 state) | PLAN drive=be → .ut-tdd/drive/be/ のみ登録 / 区画隔離 | vitest state test |
| **AT-FR-06-02** | AC-FR-06-02 (区画跨ぎ汚染) | 手動複製 → doctor fail-close error / exit 1 | vitest doctor test |
| **AT-FR-06-03** | AC-FR-06-03 (skip_sub_doc) | skip_sub_doc 指定 → G2 通過 / audit に skip 理由 | vitest gate + audit test |
| **AT-FR-07-01** | AC-FR-07-01 (hook 自動登録) | git commit → PostCommit hook → code_catalog 追加 | vitest hook test |
| **AT-FR-07-02** | AC-FR-07-02 (hook 書込失敗) | permission denied → warn / exit 2 / git commit は成功 | vitest hook test |
| **AT-FR-07-03** | AC-FR-07-03 (hook 未実装 skip) | hook placeholder → skip + audit / exit 0 | vitest hook test |
| **AT-FR-08-01** | AC-FR-08-01 (drift → Reverse 提案) | drift 検出 → mode-routing Reverse 提案 / next_action 出力 | vitest doctor + routing test |
| **AT-FR-08-02** | AC-FR-08-02 (複数シグナル優先度) | drift + 劣化 + 暴走 → Recovery routing / 他 warn | vitest routing test |
| **AT-FR-08-03** | AC-FR-08-03 (PO 手動 mode) | `ut-tdd route --mode reverse --force` → warn + audit / routing | vitest CLI + audit test |
| **AT-FR-09-01** | AC-FR-09-01 (許可 subagent pass) | pmo-sonnet + model 明示 → agent-guard pass / audit | vitest agent-guard test (既存カバー) |
| **AT-FR-09-02** | AC-FR-09-02 (許可外 block) | be-api 試行 → fail-close exit 2 | vitest agent-guard test |
| **AT-FR-09-03** | AC-FR-09-03 (PO bypass) | UT_TDD_ALLOW_RAW_AGENT=1 + 理由 → warn + audit / exit 0 | vitest agent-guard test |
| **AT-FR-10-01** | AC-FR-10-01 (Recovery 再開ポイント) | 5 連続 gate fail + budget 超過 → Recovery / cutover コマンド生成 | vitest recovery test |
| **AT-FR-10-02** | AC-FR-10-02 (再開ポイント無し) | 全 gate fail → warn / `ut-tdd reset --to-charter` 案内 | vitest recovery test |
| **AT-FR-10-03** | AC-FR-10-03 (UI 直接実行不可) | HM-06 UI ロールバックボタンクリック → 「CLI 実行のみ」表示 | E2E UI test (L4 carry、Phase A は UI placeholder) |
| **AT-FR-11-01** | AC-FR-11-01 (interrupt 正常) | `ut-tdd interrupt` → PLAN-040 interrupted / PLAN-041 起票 / context handover 保存 | vitest interrupt test |
| **AT-FR-11-02** | AC-FR-11-02 (二重 interrupt) | 既 interrupted PLAN 再 interrupt → fail-close error | vitest interrupt test |
| **AT-FR-11-03** | AC-FR-11-03 (debt 閾値超過) | debt 30 件超過 → readiness warn / 起票続行可 | vitest readiness test |
| **AT-FR-12-01** | AC-FR-12-01 (skill 推奨) | layer=L3 → L3-injection.yaml 5 skill 推奨 + 根拠ログ | vitest skill suggest test |
| **AT-FR-12-02** | AC-FR-12-02 (yaml 不在) | L3-injection.yaml なし → fail-close error | vitest skill suggest test |
| **AT-FR-12-03** | AC-FR-12-03 (skill override) | skill_override 指定 → 推奨より優先 + TL 承認 audit | vitest skill suggest test |
| **AT-FR-13-01** | AC-FR-13-01 (Forward next) | G3 pass 後 → `ut-tdd next` で L4 提示 | vitest next test |
| **AT-FR-13-02** | AC-FR-13-02 (G3 未通過 L4 block) | G3 未通過で L4 PLAN 起票 → fail-close | vitest plan + gate test |
| **AT-FR-13-03** | AC-FR-13-03 (Incident 並行例外) | L3 中に Incident troubleshoot PLAN → 許可 + audit | vitest plan test |
| **AT-FR-14-01** | AC-FR-14-01 (Reverse R0) | `ut-tdd reverse --type code` → R0-evidence.json 生成 | vitest reverse test |
| **AT-FR-14-02** | AC-FR-14-02 (confirmed_reverse_type 欠落) | 欠落 → fail-close error | vitest schema test (既存カバー) |
| **AT-FR-14-03** | AC-FR-14-03 (gap-only routing) | R4 routing=gap-only → Forward 起動なし / gap-register 追加 | vitest reverse test |
| **AT-FR-15-01** | AC-FR-15-01 (Discovery confirmed) | S2 PoC + S3 verify → S4 confirmed 設定可 | vitest discovery test |
| **AT-FR-15-02** | AC-FR-15-02 (S4 decision_outcome 欠落) | 欠落 → schema fail / exit 1 | vitest schema test (既存カバー) |
| **AT-FR-15-03** | AC-FR-15-03 (pivot 仮説変更) | decision_outcome=pivot → 旧 PLAN archive / 新 PLAN 案内 | vitest discovery test |
| **AT-FR-16-01** | AC-FR-16-01 (Incident open P0) | `ut-tdd incident open --severity P0` → troubleshoot PLAN + bypass + audit | vitest incident test |
| **AT-FR-16-02** | AC-FR-16-02 (24h 未収束) | Incident 24h 超 → warn + postmortem next_action | vitest doctor + incident test |
| **AT-FR-16-03** | AC-FR-16-03 (複数 P0/P1 並列) | 同時 open → P0 優先 / P1 queue / audit | vitest incident test |
| **AT-FR-17-01** | AC-FR-17-01 (CI G7 pass) | ローカル G7 pass → GHA workflow G7 pass / PR merge 可 | GHA workflow test |
| **AT-FR-17-02** | AC-FR-17-02 (ローカル/CI divergence) | ローカル pass / CI fail → PR block / divergence 記録 | GHA workflow test |
| **AT-FR-17-03** | AC-FR-17-03 (hotfix skip) | Incident PLAN → G7 のみ pass 必須 / 他 skip 許可 | GHA workflow test |
| **AT-FR-18-01** | AC-FR-18-01 (doctor clean) | 検出 0 件 → HM-07 All clean / exit 0 | vitest doctor test |
| **AT-FR-18-02** | AC-FR-18-02 (doctor 検出 3 件) | error 1 + warn 2 → severity 別表示 / error で exit 1 | vitest doctor test |
| **AT-FR-18-03** | AC-FR-18-03 (detector timeout) | 30s 超 → skip + warn / 他結果集約 | vitest doctor test |
| **AT-FR-09-04** | AC-FR-09-04 (opus override 禁止、A-54 で functional に AC 追加) | `Agent({subagent_type: "pmo-sonnet", model: "opus"})` → fail-close exit 2 / audit block 記録 (pdm-* 以外への opus 指定は block) | vitest agent-guard test 拡張 |
| **AT-FR-45-01** | AC-FR-45-01 (doc-reviewer 召喚正常系) | `ut-tdd review --uncommitted --reviewer doc-reviewer` → `.ut-tdd/audit/doc-reviews/<timestamp>.json` 記録 / pass → 次工程許可 / exit 0 | vitest review test |
| **AT-FR-45-02** | AC-FR-45-02 (未召喚で G3 fail-close) | doc-reviewer 未召喚 + `ut-tdd gate G3` → fail-close error / next_action 提示 / exit 1 | vitest gate + review test |
| **AT-FR-45-03** | AC-FR-45-03 (PO bypass) | `UT_TDD_DOC_REVIEWER_BYPASS=1` + 理由 → bypass + audit / D-08 集計 / exit 0 | vitest gate + audit test |
| **AT-FR-23-01** | (A-50 workflow core) AC-FR-23-01 (Scrum fullback 正常系) | confirmed PoC → `ut-tdd reverse --type fullback` → F0-F4.json 生成 / Forward L3 routing | vitest reverse + scrum test |
| **AT-FR-23-02** | AC-FR-23-02 (rejected で fullback 試行) | rejected PoC で fullback → fail-close error | vitest reverse test |
| **AT-FR-23-03** | AC-FR-23-03 (複数 PoC 同時 fullback) | 3 件並列 → 優先度順逐次実行 / 全件成功 | vitest reverse batch test |
| **AT-FR-24-01** | (A-50 workflow core) AC-FR-24-01 (Add-feature 正常系) | `ut-tdd plan draft --kind add-impl --parent` → PLAN 生成 + dependencies.parent 設定 | vitest plan + add-feature test |
| **AT-FR-24-02** | AC-FR-24-02 (parent なし) | add-impl + parent 未指定 → schema fail / exit 1 | vitest schema test (既存カバー拡張) |
| **AT-FR-24-03** | AC-FR-24-03 (parent archived) | parent archived → warn / 起票続行可 | vitest plan test |
| **AT-FR-25-01** | (A-50 workflow core) AC-FR-25-01 (Refactor 振る舞い不変正常) | 既存 test 緑維持 + axis-11 regression pass | vitest sprint + regression test |
| **AT-FR-25-02** | AC-FR-25-02 (既存 test 破壊) | refactor 後 test fail → fail-close error | vitest sprint test |
| **AT-FR-25-03** | AC-FR-25-03 (test 保護網薄い) | coverage < 60% → warn / 続行可 | vitest sprint test |
| **AT-FR-26-01** | (A-50 workflow core) AC-FR-26-01 (Retrofit matrix 正常) | retrofit-matrix.yaml 生成 + 段階 config + G4 通過 | vitest retrofit + gate test |
| **AT-FR-26-02** | AC-FR-26-02 (matrix 欠落) | matrix 未生成で G4 → fail-close error | vitest gate test |
| **AT-FR-26-03** | AC-FR-26-03 (段階 rollback) | `ut-tdd cutover --to <previous-stage>` → 前段階 config 復帰 + audit | vitest cutover test |
| **AT-FR-27-01** | (A-50 workflow core) AC-FR-27-01 (Research ADR 正常) | research-memo + ADR draft / generates=adr_snapshot 自動 | vitest research test |
| **AT-FR-27-02** | AC-FR-27-02 (generates 欠落) | research + generates なし → fail-close | vitest schema test |
| **AT-FR-27-03** | AC-FR-27-03 (ADR 候補なし) | research-memo のみで完了 / status=completed / audit | vitest research test |
| **AT-FR-29-01** | (A-50 workflow core) AC-FR-29-01 (L2 画面設計起票) | `ut-tdd plan draft --layer L2 --sub-doc screen-list` → 起票 + 15 画面 baton 確認 | vitest plan + L2 test |
| **AT-FR-29-02** | AC-FR-29-02 (G1 未通過で L2) | G1 未通過 + L2 PLAN 起票 → fail-close V-model 順序違反 | vitest gate + plan test |
| **AT-FR-29-03** | AC-FR-29-03 (wireframe 外部依頼) | 外部成果物戻り → 要件 back-propagation (G1-trace 再検証) → L10 へ | vitest L2 + back-prop test (carry placeholder) |
| **AT-FR-30-01** | (A-50 workflow core) AC-FR-30-01 (L10 token SSOT) | L9 G9 通過後 + L10 起票 → tokens.yaml 生成 + a11y script | vitest plan + L10 test |
| **AT-FR-30-02** | AC-FR-30-02 (token 二重定義) | color.primary 衝突 → fail-close | vitest token lint test |
| **AT-FR-30-03** | AC-FR-30-03 (a11y warn 多発) | WCAG warn ≥10 → 集約レポート + 通過許可 | vitest a11y test |

> **AT-FR 合計 = 58 + 21 (A-50 workflow core: FR-23/24/25/26/27/29/30 × 3 AC) = 79 件** (A-49: FR-19 → FR-45 / A-50: workflow core 7 FR L3 詳細化)。一部 (AC-FR-10-03 UI / AC-FR-17-* GHA workflow / AC-FR-29-03 back-propagation) は L4 carry 想定 (L4 で実装後に L12 AT として lift)。

### §1.2 business-detail sub-doc 由来 AT (BR-21 + HM-08 + FR-BR21-36/38/43)

| AT-ID | 対応 AC | 受入条件 | 機械検証 |
|-------|---------|---------|---------|
| **AT-BR21-01** | AC-FR-BR21-01 (5 指標記録) | PLAN close → 5 指標が `.ut-tdd/evaluation/PLAN-005.json` 記録 | vitest evaluation test |
| **AT-BR21-02** | AC-FR-BR21-02 (invocation_log 不在 warn) | Phase A 初期 → token cost skip + warn / 4 指標は記録 | vitest evaluation test |
| **AT-BR21-03** | AC-FR-BR21-03 (model opt-in false) | enabled: false → model 単位 skip | vitest evaluation test |
| **AT-BR21-04** | AC-FR-BR21-04 (sprint 末自動) | G7 通過 hook → evaluation run --auto 起動 | vitest hook + evaluation test |
| **AT-BR21-05** | AC-FR-BR21-05 (頻度上限超過) | 同日 2 回目 → warn / 続行可 (--force) | vitest evaluation test |
| **AT-BR21-06** | AC-FR-BR21-06 (skill 廃止提案) | skill rating < 0.5 → 廃止候補 + AI 指示 copy UI 提案 | vitest evaluation + UI test (L4 carry) |
| **AT-BR21-07** | AC-FR-BR21-07 (自動 skill 削除 block) | 自動削除試行 → fail-close exit 2 | vitest skill delete test |
| **AT-BR21-08** | AC-FR-BR21-08 (HM-08 表示) | バッチ完了 → 4 ソース統合 view / 30 秒ポーリング | E2E UI test (L4 carry) |
| **AT-BR21-09** | AC-FR-BR21-09 (集計バッチ失敗) | invocation_log 破損 → 該当 skip + warn / 他正常集計 | vitest evaluation test |
| **AT-FR-BR21-36-01** | (FR-BR21-36 正常系) | skill 5 PLAN 採用 / 5 件成功 → skill_rating=1.0 / 維持 | vitest evaluation test (Phase B carry) |
| **AT-FR-BR21-36-02** | (FR-BR21-36 境界系) | 30 日採用 0 件 → 廃止候補フラグ true | vitest evaluation test (Phase B carry) |
| **AT-FR-BR21-38-01** | (FR-BR21-38 正常系) | opt-in true → model 比較表 + 推奨 | vitest evaluation test (Phase B carry) |
| **AT-FR-BR21-38-02** | (FR-BR21-38 境界系) | opt-in false → skip | vitest evaluation test |
| **AT-FR-BR21-43-01** | (FR-BR21-43 正常系) | 10 件 PoC (6/3/1) → 成功率 60% 表示 | vitest evaluation test (Phase B carry) |
| **AT-FR-BR21-43-02** | (FR-BR21-43 異常系) | PoC 0 件 → info + 「データ蓄積中」表示 | vitest evaluation test |
| **AT-UX-01** | (C-01 補完、A-47) AC-UX-01-01 (3 バランス被覆) | sprint 末 D-03=0 + D-04 ≥ 80% + D-06 = 0 努力目標 + D-07 ≥ 70% を **3 軸全件 pass**。1 軸突出は warn | vitest KPI 集計 test |

> **AT-BR21 系 合計 = 16 件** = AT-BR21 (BR-21 §1〜§6 直接) 9 件 + AT-FR-BR21 (FR-BR21-36/38/43 派生) 6 件 + AT-UX-01 (補完) 1 件 — **§1.4 件数まとめと一致**。Phase 別の内訳では Phase A 即実装 7 件 + Phase B carry 9 件 (= 16)。category 別 (§1.4) と Phase 別 (本注記) は切り口が異なるだけで合計は同一。

### §1.3 nfr-grade sub-doc 由来 AT (NFR-* 15 件)

| AT-ID | 対応 NFR + AC | 受入条件 | 機械検証 |
|-------|--------------|---------|---------|
| **AT-NFR-01** | NFR-01 / AC-NFR-01 | GHA matrix 3 OS で `bun test` + `ut-tdd plan lint` pass | GHA workflow test |
| **AT-NFR-03** | (C-03 補完、A-47) NFR-03 / AI mode 非依存 | 4 mode (standalone / claude-only / codex-only / hybrid) で P0 FR-01〜18 全件動作 / mode 別差異 0 件 | vitest mode E2E test (4 mode × P0 FR) |
| **AT-NFR-D01** | (A-47 補完) NFR-D01 / KPI D-01 計測 | `ut-tdd plan list --since sprint-start` → PLAN 件数 ≥ 1 を機械計測 / sprint 末 KPI integrated | vitest KPI test |
| **AT-NFR-D04** | (A-47 補完) NFR-D04 / KPI D-04 計測 | CI gate + `ut-tdd trace check --regression` で回帰検出率 ≥ 80% を集計 | vitest trace + KPI test |
| **AT-NFR-04** | NFR-04 / AC-NFR-04-01 | TS/Python/Go/Rust 各 1 repo で動作確認 | E2E test (multi-repo) |
| **AT-NFR-05** | NFR-05 / AC-NFR-05-01 | GHA workflow artifact upload + 90 日永続 | GHA workflow test |
| **AT-NFR-06** | NFR-06 / AC-NFR-06 | agent-guard fail-close exit 2 + 全 fail-close test pass | vitest agent-guard test (既存カバー) |
| **AT-NFR-07** | NFR-07 (MVP なし、§2 OT-01〜05 兼用) | OT-01〜05 全件 pass (L14 OT 連携) | L14 OT 兼用 |
| **AT-NFR-08** | NFR-08 / AC-NFR-08-01 | sprint 末 D-05 ≥ 95% | vitest trace test |
| **AT-NFR-11-01** | NFR-11 / AC-NFR-11-01 | GHA permissions 最小権限 (contents: read) → workflow pass | GHA workflow test |
| **AT-NFR-11-02** | NFR-11 / AC-NFR-11-02 | 未定義 role → schema fail / exit 1 | vitest schema test (既存カバー) |
| **AT-NFR-12-01** | NFR-12 / AC-NFR-12-01 | 直近 sprint D-07 計算式正しく集計 | vitest evaluation test |
| **AT-NFR-13-01** | NFR-13 / AC-NFR-13-01 | sprint D-02 70% → warn / Phase A は block しない | vitest gate + evaluation test |
| **AT-NFR-14-01** | NFR-14 / AC-NFR-14-01 | bypass 1 回 → audit log 生成 / PO ID + 理由必須 | vitest agent-guard + audit test |
| **AT-NFR-14-02** | NFR-14 / AC-NFR-14-02 | sprint bypass 3 件 → warn / block しない | vitest evaluation test |
| **AT-NFR-15** | NFR-15 / AC-NFR-15 | server なしで全 P0 FR 動作 | vitest E2E test |
| **AT-NFR-16** | NFR-16 / AC-NFR-16 | onboarding skip_sub_doc 段階 → G1 段階通過 | vitest gate + onboarding test |
| **AT-NFR-17** | NFR-17 / AC-NFR-17 (統合セキュリティ、A-54 追加) | CI secret-scan fail-close + agent guard fail-close 全件 pass + 判断ゲート human oversight 経路存在 | vitest agent-guard + gate test / secret-scan (Phase A) |
| **AT-NFR-MIGRATION-01** | (移行) / AC-NFR-MIGRATION-01 | cutover wave 完了 → G14 pass | vitest gate test (Phase A G14 carry) |
| **AT-NFR-02** | NFR-02 (L4 ADR carry) | L4 ADR 確定後に lift | L4 carry placeholder |
| **AT-NFR-09** | NFR-09 (L4 carry、parity-check) | L4 ADR 後に lift | L4 carry placeholder |
| **AT-NFR-18** | NFR-18 (Phase B carry、PII redaction、旧 AT-NFR-17 を A-54 でリネーム) | Phase B 着手後に lift | Phase B carry placeholder |

> **AT-NFR 合計 = 19 + 3 = 22 件** (Phase A 即実装 19 件 [A-47 補完: NFR-03 / D-01 / D-04 + A-54: NFR-17 統合セキュリティ] + L4 carry 2 件 [NFR-02/09] + Phase B carry 1 件 [NFR-18 PII redaction])

### §1.4 件数まとめ

| 区分 | 件数 |
|------|------|
| AT-FR (functional 由来: FR-01〜18 ×3 = 54 + AT-FR-09-04 + FR-45 ×3 + workflow core FR-23/24/25/26/27/29/30 ×3 = 21) | 79 |
| AT-UX (UX-01 補完) | 1 |
| AT-BR21 (business-detail 由来、BR-21 §1〜§6) | 9 |
| AT-FR-BR21 (FR-BR21-36/38/43 派生、Phase B carry 中心) | 6 |
| AT-NFR (nfr-grade 由来、Phase A: 18 + NFR-17 統合セキュリティ A-54) | 19 |
| AT-NFR (L4/Phase B carry placeholder: NFR-02/09/18) | 3 |
| **合計** | **117** (Phase A 即実装 105 件 + carry 12 件。A-54 で実数再カウント、旧 95 は集計漏れ) |

## §2 量閉じ一覧 (要求 → AT 被覆、孤児チェック)

### functional sub-doc (L3 FR 26 件 = FR-01〜18 + FR-45 + workflow core 7 件)
- FR-01 → AT-FR-01-01/02/03 / FR-02 → AT-FR-02-01/02/03 / ... / FR-18 → AT-FR-18-01/02/03
- FR-45 + workflow core FR-23/24/25/26/27/29/30 → §1.4 件数まとめ参照 (AT-FR 計 79 件)
- **孤児 FR = 0** (L3 FR 26 件、AT-FR 79 件で全件被覆。§1.4 件数まとめと整合)

### business-detail sub-doc
- BR-21 (§1〜§6) → AT-BR21-01〜09 (9 件、Phase A)
- FR-BR21-36 → AT-FR-BR21-36-01/02 (2 件、Phase B carry)
- FR-BR21-38 → AT-FR-BR21-38-01/02 (2 件)
- FR-BR21-43 → AT-FR-BR21-43-01/02 (2 件)
- **孤児 BR-21 派生 = 0**

### nfr-grade sub-doc
- NFR-01/03/04/05/06/07/08/11/12/13/14/15/16/17 + D01/D04 → AT-NFR-XX (Phase A 即実装)
- NFR-02/09 → AT-NFR-02/09 (L4 carry placeholder)
- NFR-18 (telemetry PII redaction、新規候補) → AT-NFR-18 (Phase B carry placeholder、旧 NFR-17 を A-54 でリネーム)
- **孤児 NFR = 0** (15 件 + carry 全件被覆)

## §3 trace (④ → ②)

本書の各 AT-* は `docs/design/harness/L3-functional/{functional-requirements,business-detail,nfr-grade}.md` の FR-*/AC-*/BR-21 派生/NFR-* と相互 reference する。G3 (機能要件ゲート) で **3 sub-doc 全体 ⇔ 本書 1 doc** の pair freeze を PO サインオフで確定する。

## §4 G3-trace 機械検証 (L1 G1-trace 同構造)

`ut-tdd plan lint --gate G3-trace` で以下 4 軸の双方向 trace 整合を機械検証 (L1 G1-trace R1-R4 と同様):

| ルール | チェック内容 | 結果 (本起草時点) |
|--------|------------|-----------------|
| **R1** (BR/UX/FR-L1 → L3) | 全 BR-01〜08 + BR-21 + BR-22 + UX-01〜03 + FR-L1 P0 19 件 が L3 FR-*/business-detail/nfr-grade/carry のいずれかに紐付き | PASS — functional §2 (FR-01〜18 + FR-45 + workflow core 7 件) + functional §3 carry (FR-L1-46〜49 / BR-22) + business-detail §1-§7 (BR-21 派生) + nfr-grade §1-§6 (NFR-01〜17) で全件被覆 |
| **R2** (FR-* → AC → AT) | 全 L3 FR-* に AC-* と AT-* 対応があり、carry 対象は carry AT / 後続 pair に接続 (孤児 FR-* 禁止) | PASS — L3 FR 26 件 + AT 117 件を trace、workflow core / FR-45 / NFR / BR-21 派生を含め孤児 0 |
| **R3** (AT → 要求) | 全 AT-* が L3 要求 (FR-/AC-/NFR-/BR-21 派生) に紐付き (孤児 AT 禁止) | PASS — 117 AT 全件 trace 確認 (A-54: AT-FR-09-04 に AC-FR-09-04 追加で孤児解消、AT→AC 逆引き lint 機械化) |
| **R4** (NFR → 閾値 → AT) | 全 NFR-* に閾値 (IPA Lv + 数値 / KPI) + AT 紐付き | PASS — 15 NFR + carry 全件紐付き |

> **lint 実装**: `ut-tdd plan lint --gate G3-trace` の R1-R4 ルールは L7 実装済みで、`ut-tdd doctor` の hard gate に集約される。本書は trace 整合の宣言と、機械検証の期待値を兼ねる。

## §5 carry / 次工程

- **L4 carry AT**: AT-FR-10-03 (UI 直接実行不可) / AT-FR-17-01〜03 (GHA workflow) / AT-NFR-02 / AT-NFR-09 → L4 設計 + 実装後に L12 AT として lift
- **Phase B carry AT**: AT-FR-BR21-36-01〜43-02 (6 件) + AT-BR21-06/08 (UI、2 件) / AT-NFR-18 (PII redaction) → Phase B 着手時に lift
- **L7 実装**: 全 AT-* を vitest / GHA workflow に変換、Red 状態で先行作成 (TDD 強制 FR-02)
