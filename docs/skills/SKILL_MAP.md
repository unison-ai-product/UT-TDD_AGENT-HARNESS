---
schema_version: skill-map.v1
name: SKILL_MAP
skill_type: skill-map
applies_to:
  layers:
    - L7
  drive_models:
    - Forward
---

# UT-TDD SKILL_MAP — canonical (FR-L1-47 W10 curate)

> **canonical**: このファイルは PLAN-L7-52 C-5 (FR-L1-47 skill pack curate) の W10 curate 成果物として
> `docs/skills/SKILL_MAP-draft.md` から昇格した正本である。
> 各区分判定は PO-overridable であり、将来の TS 実装状況・対象 repo 変化に応じて随時改訂する。
> 旧 draft は `docs/skills/SKILL_MAP-draft.md` に superseded banner 付きで保持している。

## 分類軸

- **core** = UT-TDD 中核ワークフロー (V-model / gate / drive モデル / orchestration / 工程統制) を直接支えるスキル。
  UT-TDD 自己開発・別プロダクト開発の基盤として常に参照対象となる。
- **optional** = 汎用開発スキルで有用だが UT-TDD 必須でない (対象 repo の技術スタック / 駆動種別に依存)。
  `ut-tdd skill suggest` による推薦に委ね、trigger は空とする (PO 決定 #4)。
- **hold** = 概念は UT-TDD と整合するが、旧 CLI 記述が浸透し TS 再実装が完了するまで参照専用とする。
  drop はしない。TS 実装完了後に core/optional へ再分類する (PO 決定 #1)。
- **drop** = 旧 HELIX runtime 固有で UT-TDD TS 再実装に置換済み、または開発工程に非該当のもの。
  `docs/skills/` には本文を curate しない。

## 区分別スキル一覧 (107 件)

> 凡例: `upstream: MIT` = addyosmani/agent-skills (MIT) 由来 → upstream フィールドを canonical にも保持 (PO 決定 #3)
> core スキルの旧 CLI trigger は `ut-tdd` 相当へ一括機械置換 + per-skill spot review で更新する (PO 決定 #2)

---

### core (47 件)

UT-TDD 中核ワークフローに直接資するスキル。`docs/skills/<name>.md` に本文 curate 済み (48 本中 47 本が core)。

#### workflow/ (22 件)

| スキル | パス | 根拠 |
|--------|------|------|
| project-management | workflow/project-management | PLAN 管理・工程統制の中核 |
| estimation | workflow/estimation | タスク見積り・工程表スプリント計画 |
| requirements-handover | workflow/requirements-handover | V-model 引継ぎ・context 注入の正規手順 |
| design-doc | workflow/design-doc | L2/L3 設計書 (D-ARCH/D-API/D-DB) 作成の必須スキル |
| api-contract | workflow/api-contract | D-API/D-CONTRACT 凍結 (G3) の中核 |
| dependency-map | workflow/dependency-map | 実装前の依存関係可視化・gate 判定の根拠 |
| quality-lv5 | workflow/quality-lv5 | L6 テスト品質評価・G6 gate の判定基準 |
| verification | workflow/verification | V-model 全層の spec 駆動検証基盤 (L1〜L11 + Reverse) |
| adversarial-review | workflow/adversarial-review | G2/G6 gate で必須の敵対的レビュー |
| context-memory | workflow/context-memory | AI のコンテキスト注入・記憶管理 (柱4 = 動的注入) |
| reverse-analysis | workflow/reverse-analysis | Reverse drive のルーター (R0〜R4 への振り分け) |
| research | workflow/research | G1R 事前調査ゲートの実施手順 |
| poc | workflow/poc | G1.5 PoC ゲート (Scrum S0-S4 前段) |
| gate-planning | workflow/gate-planning | G0.5/G1.5 gate 計画 |
| threat-model | workflow/threat-model | G2 セキュリティ設計 (L2 出力) |
| debt-register | workflow/debt-register | G4 技術負債自動登録・追跡 (柱3 = フィードバックループ) |
| reverse-r0 | workflow/reverse-r0 | Reverse R0 証拠収集フェーズ |
| reverse-r1 | workflow/reverse-r1 | Reverse R1 観測契約フェーズ |
| reverse-r2 | workflow/reverse-r2 | Reverse R2 As-Is 設計復元 |
| reverse-r3 | workflow/reverse-r3 | Reverse R3 要件仮説・PO 検証 |
| reverse-r4 | workflow/reverse-r4 | Reverse R4 Gap → Forward 接続 |
| reverse-rgc | workflow/reverse-rgc | Reverse RGC 閉塞検証ゲート |

#### common/ (7 件)

| スキル | パス | 根拠 |
|--------|------|------|
| testing | common/testing | L4 テストコード作成の正規手順 (V-model 義務) |
| code-review | common/code-review | G4/G6 コードレビュー手順 |
| security | common/security | G2/G4/G6/G7 セキュリティゲートの実施基盤 |
| documentation | common/documentation | 設計書・ADR 作成 (doc⇔機械処理 fusion の前提) |
| refactoring | common/refactoring | Reverse normalization / Refactor drive の実施手順 |
| error-fix | common/error-fix | Recovery drive (error-fix) の中核 |
| git | common/git | commit / branch / PR の運用規律 |

#### project/ (2 件)

| スキル | パス | 根拠 |
|--------|------|------|
| api | project/api | API 設計の参照インデックス |
| db | project/db | DB 設計 (スキーマ / マイグレーション) |

#### integration/ (3 件)

| スキル | パス | 根拠 |
|--------|------|------|
| agent-teams | integration/agent-teams | 複数エージェント協調・分業 (柱5 = orchestration) |
| agent-design | integration/agent-design | 個別 LLM agent の structural design (L2/L3 必須) |
| agent-cost-design | integration/agent-cost-design | エージェント着手前コスト予算・ガードレール (L1 前段必須) |

#### agent-skills/ — MIT upstream (12 件)

> 注: agent-skills/ には非スキルディレクトリとして `hooks/` (runtime artifact) と `references/` (checklist 参照集) が存在するが、スキル件数には含めない (件数外)。

| スキル | パス | 根拠 | upstream |
|--------|------|------|----------|
| spec-driven-development | agent-skills/spec-driven-development | 仕様駆動開発の基本プロセス | MIT |
| test-driven-development | agent-skills/test-driven-development | TDD 手順 (V-model テストコード義務) | MIT |
| planning-and-task-breakdown | agent-skills/planning-and-task-breakdown | タスク分解・スプリント計画 | MIT |
| incremental-implementation | agent-skills/incremental-implementation | マイクロスプリント実装 (L4 core) | MIT |
| context-engineering | agent-skills/context-engineering | コンテキスト最適注入 (柱4) | MIT |
| code-review-and-quality | agent-skills/code-review-and-quality | コードレビュー品質評価 | MIT |
| security-and-hardening | agent-skills/security-and-hardening | OWASP 防止・入力検証・最小権限 | MIT |
| debugging-and-error-recovery | agent-skills/debugging-and-error-recovery | 再現→局所化→修正→ガード | MIT |
| source-driven-development | agent-skills/source-driven-development | 公式ドキュメント根拠の実装 | MIT |
| documentation-and-adrs | agent-skills/documentation-and-adrs | ADR・設計ドキュメント作成 | MIT |
| system-design-sizing | agent-skills/system-design-sizing | システム設計スケーリング (donnemartin/system-design-primer MIT) | MIT |
| api-and-interface-design | agent-skills/api-and-interface-design | 安定インターフェース設計 | MIT |

#### tools/ (1 件)

| スキル | パス | 根拠 |
|--------|------|------|
| ai-coding | tools/ai-coding | AI コーディング運用・gate-policy・Sprint Plan 標準構造の手順正本 |

---

### optional (49 件)

対象 repo の技術スタック・駆動種別に依存して有用になるスキル。trigger は空とし `ut-tdd skill suggest` に委ねる。

#### workflow/ (9 件)

| スキル | パス |
|--------|------|
| dev-policy | workflow/dev-policy |
| compliance | workflow/compliance |
| deploy | workflow/deploy |
| dev-setup | workflow/dev-setup |
| incident | workflow/incident |
| observability-sre | workflow/observability-sre |
| postmortem | workflow/postmortem |
| runbook | workflow/runbook |
| schedule-wbs | workflow/schedule-wbs |

#### common/ (5 件)

| スキル | パス |
|--------|------|
| visual-design | common/visual-design |
| design | common/design |
| coding | common/coding |
| infrastructure | common/infrastructure |
| performance | common/performance |

#### project/ (6 件)

| スキル | パス | 根拠 |
|--------|------|------|
| ui | project/ui | FE 設計知識群のインデックス (L2)。fe/fullstack 駆動の参照ハブ |
| fe-a11y | project/fe-a11y | FE アクセシビリティ (L4)。axe-core + WCAG 2.1 AA 検証。fe/fullstack 駆動案件に依存 |
| fe-component | project/fe-component | FE コンポーネント実装 (L4)。Atomic Design + TypeScript Props。fe/fullstack 駆動案件に依存 |
| fe-design | project/fe-design | FE 情報アーキテクチャ D-IA (L2)。fe/fullstack 駆動案件に依存 |
| fe-style | project/fe-style | FE スタイルシステム (L4)。デザイントークン 3 層。fe/fullstack 駆動案件に依存 |
| fe-test | project/fe-test | FE テスト (L4)。Storybook / Playwright E2E / VRT。fe/fullstack 駆動案件に依存 |

#### advanced/ (6 件)

| スキル | パス |
|--------|------|
| tech-selection | advanced/tech-selection |
| legacy | advanced/legacy |
| migration | advanced/migration |
| external-api | advanced/external-api |
| i18n | advanced/i18n |
| ai-integration | advanced/ai-integration |

#### advanced/ — UT-TDD 対象 repo 依存の革新系 (3 件)

| スキル | パス |
|--------|------|
| tech-innovation | advanced/tech-innovation |
| marketing-innovation | advanced/marketing-innovation |
| innovation-mgr | advanced/innovation-mgr |

#### tools/ (3 件)

| スキル | パス |
|--------|------|
| ide-tools | tools/ide-tools |
| web-search | tools/web-search |
| ai-search | tools/ai-search |

#### writing/ (2 件)

| スキル | パス |
|--------|------|
| japanese | writing/japanese |
| explain | writing/explain |

#### design-tools/ (2 件)

| スキル | パス |
|--------|------|
| diagram | design-tools/diagram |
| web-system | design-tools/web-system |

#### automation/ (3 件)

| スキル | パス |
|--------|------|
| browser-script | automation/browser-script |
| flow-optimize | automation/flow-optimize |
| observability | automation/observability |

#### agent-skills/ — MIT upstream (10 件)

| スキル | パス | 根拠 | upstream |
|--------|------|------|----------|
| idea-refine | agent-skills/idea-refine | アイデア発散収束 (Scrum S0 前段) | MIT |
| frontend-ui-engineering | agent-skills/frontend-ui-engineering | FE 駆動 UI 実装 (対象 repo が UI を持つ場合) | MIT |
| browser-testing-with-devtools | agent-skills/browser-testing-with-devtools | Chrome DevTools MCP ブラウザ検証 (UI あり案件) | MIT |
| performance-optimization | agent-skills/performance-optimization | パフォーマンス計測・最適化 (SLA 要求あり案件) | MIT |
| ci-cd-and-automation | agent-skills/ci-cd-and-automation | CI/CD パイプライン設定 (対象 repo の CI 整備時) | MIT |
| deprecation-and-migration | agent-skills/deprecation-and-migration | 廃止・マイグレーション管理 (legacy あり案件) | MIT |
| shipping-and-launch | agent-skills/shipping-and-launch | 本番リリース・ローンチ準備 (L7/L8 補助) | MIT |
| using-agent-skills | agent-skills/using-agent-skills | スキル選択メタスキル (セッション開始時の探索補助) | MIT |
| mock-driven-development | agent-skills/mock-driven-development | FE/fullstack 駆動時の L2 モック駆動設計 | — |
| technical-writing | agent-skills/technical-writing | 技術文書品質向上 (設計書・ADR 執筆時の補助) | CC-BY (Google) |

---

### hold (1 件)

旧 CLI 記述が浸透しているが概念は UT-TDD と整合する。TS 実装完了まで参照専用とし、drop しない (PO 決定 #1)。

#### agent-skills/ (1 件)

| スキル | パス | 保留理由 |
|--------|------|----------|
| helix-scrum | agent-skills/helix-scrum | Scrum drive (S0-S4 仮説検証) の概念は UT-TDD Scrum drive と整合するが、コマンドが `helix scrum init/plan/poc/verify/decide` に依存している。UT-TDD TS Scrum drive 実装完了後に core へ再分類する。 |

---

### drop (10 件)

旧 HELIX runtime 固有 / 開発工程に非該当のスキル。`docs/skills/` には本文を curate しない。

#### writing/ (2 件) — 開発工程と無関係

| スキル | パス | drop 理由 |
|--------|------|----------|
| presentation | writing/presentation | プレゼン作成。開発工程に非該当 |
| social | writing/social | SNS 投稿。開発工程に非該当 |

> 注: `writing/story` は vendor に存在しない (phantom)。drop からも除去済み。

#### design-tools/ (3 件) — 開発工程と無関係

| スキル | パス | drop 理由 |
|--------|------|----------|
| pptx | design-tools/pptx | PowerPoint 生成。開発工程に非該当 |
| graphic | design-tools/graphic | グラフィック生成。開発工程に非該当 |
| character | design-tools/character | キャラクター設計。開発工程に非該当 |

#### automation/ (5 件) — 旧 CLI 専用 or UT-TDD で代替済み

| スキル | パス | drop 理由 |
|--------|------|----------|
| init-setup | automation/init-setup | `ut-tdd setup` で代替済み |
| site-mapping | automation/site-mapping | サイトクローリング専用。UT-TDD 工程への適合なし |
| scheduler | automation/scheduler | HELIX automation scheduler 専用。UT-TDD 工程外 |
| job-queue | automation/job-queue | HELIX automation job-queue 専用。UT-TDD 工程外 |
| lock | automation/lock | HELIX automation lock 専用。UT-TDD 工程外 |

#### 件数外 (スキル本体ではない) — vendor 構造上存在するが件数に含めない

| パス | 理由 |
|------|------|
| agent-skills/hooks/ | HELIX hooks runtime artifact (shell scripts)。スキル本体ではない |
| agent-skills/references/ | checklist 参照集。スキル単体ではなく依存参照素材 |

#### 件数確認用補足

drop に算入する内訳:
- writing/: 2 件 (presentation / social) ※ story は vendor 非実在 phantom のため除外済み
- design-tools/: 3 件 (pptx / graphic / character)
- automation/: 5 件 (init-setup / site-mapping / scheduler / job-queue / lock)
- agent-skills/hooks/ と agent-skills/references/: スキル本体ではないため件数外 (drop 件数に含めない)

vendor 実数 107 件の内訳:
- core: 47 件
- optional: 49 件
- hold: 1 件
- drop: 10 件
- 合計: 107 件 (hooks/ / references/ は件数外)

---

## 未確認 13 件の分類確定 (Read 根拠付き)

draft の「未確認 ~13 件」として積み残されていたスキルを実際に vendor を Read して分類確定した。

| スキル | 分類 | 根拠 |
|--------|------|------|
| agent-skills/helix-scrum | **hold** | S0-S4 仮説検証の概念は UT-TDD Scrum drive と完全整合。コマンドが `helix scrum *` 専用のため TS 再実装まで参照専用 |
| agent-skills/browser-testing-with-devtools | **optional** | Chrome DevTools MCP 前提の UI ブラウザ検証。L6 統合検証で UI あり案件に有用。UT-TDD 自体は CLI でありハーネス必須ではない |
| agent-skills/mock-driven-development | **optional** | FE/fullstack 駆動での L2 モック駆動設計。fe/fullstack 駆動案件で有用。be/db/agent 駆動では不要 |
| agent-skills/using-agent-skills | **optional** | スキル選択メタスキル。`ut-tdd skill suggest` と役割が近い。セッション開始補助に有用だが必須でない |
| agent-skills/ci-cd-and-automation | **optional** | CI/CD パイプライン設定。対象 repo の CI 整備時に有用。UT-TDD harness-check は別途実装済み |
| agent-skills/shipping-and-launch | **optional** | 本番ローンチ準備チェックリスト。L7/L8 補助として有用だが UT-TDD 必須ではない |
| agent-skills/deprecation-and-migration | **optional** | 廃止・マイグレーション管理。legacy/migration スキルと役割近接。legacy あり案件で有用 |
| agent-skills/technical-writing | **optional** | Google Tech Writing 原則適用。設計書・ADR 執筆品質向上に有用。必須でないが high-value |
| agent-skills/performance-optimization | **optional** | パフォーマンス計測・最適化。SLA 要求案件で有用。事前計測なし最適化禁止原則あり |
| agent-skills/idea-refine | **optional** | アイデア発散収束。Scrum S0 前段で有用。UT-TDD 必須ではない |
| agent-skills/frontend-ui-engineering | **optional** | FE 駆動 UI 実装。対象 repo が UI を持つ場合に有用。CLI 専用案件では不要 |
| automation/flow-optimize | **optional** | L5 UX フロー分析・改善提案。UI あり案件で有用。Playwright trace 入力前提 |
| automation/observability | **optional** | HELIX automation events/metrics 記録・export。`helix observe *` CLI 前提。UT-TDD の observability は別途 |

---

## 5 決定の適用箇所

| PO 決定 | 内容 | 適用箇所 |
|---------|------|---------|
| #1 Scrum 系スキルは hold | helix-scrum を drop でなく hold 区分へ | hold セクション / 未確認分類確定表 |
| #2 core の trigger 書き換え | 旧 CLI trigger → `ut-tdd` へ一括機械置換 + per-skill spot review | 各 core スキル本文 (curate 済 48 本、別 scope で適用) |
| #3 MIT upstream 帰属保持 | agent-skills の `upstream:` フィールドを canonical にも残す | optional/core の agent-skills 行の `upstream` 列 |
| #4 optional の trigger 空 | optional は trigger を空にし `ut-tdd skill suggest` 推薦に委ねる | optional セクション冒頭注記 |
| #5 未確認 13 件の分類確定 | vendor を実際に Read して分類確定 | 未確認 13 件の分類確定セクション |

---

## curate 状況

- `docs/skills/` に本文 curate 済み: 48 本 (commit c184409)
- 内訳: core 37 本 + optional 系 11 本 (approximate)
- skill-assignment lint は `docs/skills/` 配下全 md を検査: 本ファイル (SKILL_MAP.md) は `skill_type: skill-map` のため `projectSkillTelemetry` の ranking 対象外

## 次工程

1. core スキル 48 本の旧 CLI trigger を `ut-tdd` 相当へ一括機械置換 + per-skill spot review (PO 決定 #2 完全適用)。
2. optional スキルの本文 curate (対象 repo 需要に応じて随時)。
3. hold の helix-scrum: UT-TDD TS Scrum drive 実装後に core へ再分類。
4. `catalogSkills` / `recommendSkills` (FR-L1-47 function-spec) が読む `automation_assets` 投影と整合確認。
