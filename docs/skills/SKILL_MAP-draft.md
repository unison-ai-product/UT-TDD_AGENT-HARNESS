---
schema_version: skill-map.v0-draft
name: SKILL_MAP-draft
skill_type: skill-map-curate-draft
applies_to:
  layers:
    - L7
  drive_models:
    - Forward
---

> **SUPERSEDED**: このファイルは W10 curate の first-pass draft であり、2026-06-15 に
> `docs/skills/SKILL_MAP.md` (canonical) へ昇格済み。現行正本は SKILL_MAP.md を参照せよ。
> 本ファイルは historical reference として保持する (クリーンアップ原則: 昇格済みのため削除でなく banner 方式)。

# UT-TDD SKILL_MAP — W10 curate DRAFT first-pass (FR-L1-47) [SUPERSEDED]

> **DRAFT NOTICE**: これは W10 (FR-L1-47 skill pack curate) の **first-pass 叩き台**であり最終分類ではない。
> 軸 (core / optional / drop) は FR-L1-47 設計に準拠する。各スキルへの criteria 適用は**本提案であり PO 調整を前提**とする。
> 確定後に各 core/optional スキルの本文を vendor 由来 (`vendor/helix-source/skills/`) から UT-TDD 用に curate し、旧 CLI trigger を `ut-tdd` 相当へ機械置換、レガシー用語を除去して `docs/skills/<name>.md` の正本にする。
> 生成元 = pmo-helix-explorer サンプリング (2026-06-15、PLAN-L7-52 C-5)。vendor 107 件のカテゴリ構造 + 代表サンプル読解による推定分類で、全件深読みはしていない。

## 分類軸と適用原則 (proposal、PO 調整対象)

- **core** = UT-TDD 中核ワークフロー (V-model / gate / drive モデル / orchestration / 工程統制) を直接支えるスキル。
- **drop** = レガシー runtime 固有 (旧 CLI 専用機構前提) で UT-TDD の TS 再実装に置換済 or 開発工程に非該当。
- **optional** = 汎用開発スキルで有用だが UT-TDD 必須でない (対象 repo の駆動種別に依存)。

## カテゴリ別件数分布 (vendor SKILL_MAP 記載)

| カテゴリ | 件数 | core | optional | drop | 未確認 |
|---|---|---|---|---|---|
| workflow/ | 31 | ~22 | ~9 | 0 | 0 |
| common/ | 12 | 7 | 5 | 0 | 0 |
| project/ | 3 | 2 | 1 | 0 | 0 |
| advanced/ | 9 | 1 | 8 | 0 | 0 |
| tools/ | 4 | 2 | 2 | 0 | 0 |
| integration/ | 3 | 3 | 0 | 0 | 0 |
| agent-skills/ | 23 | 12 | 9 | 1 | ~1 |
| writing/ | 5 | 0 | 2 | 3 | 0 |
| design-tools/ | 5 | 0 | 2 | 3 | 0 |
| automation/ | 8 | 0 | 3 | 5 | 0 |
| **合計** | **~107** | **~37** | **~45** | **~12** | **~13** |

## 区分別 代表スキル (proposal)

### core (~37) — UT-TDD 中核に直結
- **検証/ゲート**: verification, quality-lv5, adversarial-review, gate-planning, dependency-map
- **設計/契約 (V-pair)**: design-doc, api-contract, project/api, project/db, tech-selection, threat-model
- **drive モデル**: reverse-analysis, reverse-r0〜r4, reverse-rgc (Reverse), poc/research (Scrum 前段), refactoring (normalization), error-fix (Recovery)
- **orchestration/agent**: agent-cost-design, agent-design, agent-teams, ai-coding
- **工程/引継ぎ/記憶**: requirements-handover, project-management, estimation, context-memory, debt-register
- **テスト/レビュー/文書**: common/testing, common/code-review, common/security, common/documentation, common/git
- **agent-skills (MIT upstream)**: spec-driven-development, test-driven-development, planning-and-task-breakdown, incremental-implementation, context-engineering, code-review-and-quality, security-and-hardening, debugging-and-error-recovery, source-driven-development, documentation-and-adrs, system-design-sizing, api-and-interface-design

### optional (~45) — 対象 repo 依存で有用
deploy, observability-sre, runbook, incident, postmortem, schedule-wbs, compliance, dev-policy, dev-setup (workflow) / infrastructure, performance, visual-design, design, coding (common) / project/ui / legacy, migration, external-api, i18n, ai-integration, tech-innovation, marketing-innovation, innovation-mgr (advanced) / ai-search, ide-tools (tools) / mock-driven-development, technical-writing, idea-refine, frontend-ui-engineering, performance-optimization, ci-cd-and-automation, deprecation-and-migration, shipping-and-launch, browser-testing-with-devtools, using-agent-skills (agent-skills) / japanese, explain (writing) / diagram, web-system (design-tools) / browser-script, flow-optimize, observability (automation)

### drop (~12) — 非該当 or TS 置換済
- **CLI 前提で UT-TDD 再実装待ち**: agent-skills/helix-scrum (Scrum drive を TS 再実装するまで参照専用、§PO論点1)
- **`ut-tdd setup` で代替**: automation/init-setup
- **開発工程と無関係**: writing/story, writing/presentation, writing/social, design-tools/pptx, design-tools/graphic, design-tools/character, automation/site-mapping, automation/scheduler, automation/job-queue, automation/lock

## PO 確認が必要な論点 (criteria 確定)

1. **Scrum 系スキルの扱い**: 概念は UT-TDD Scrum drive と整合するが旧 CLI 記述が浸透。「drop」でなく「hold (参照専用)」とする選択肢あり。TS Scrum 実装の有無で決まる。
2. **core スキルの trigger 書き換え方針**: core 採用スキルの旧 CLI trigger を `ut-tdd` へ一括機械置換でよいか、個別判断が要るか。
3. **MIT upstream (agent-skills 19 件) のライセンス表記**: UT-TDD 版へ取込む際の upstream 帰属表記方針 (vendor SKILL_MAP は `upstream:` フィールドで記録)。
4. **optional の CLI trigger**: optional は trigger を空にして対象 repo 判断に委ねるか、`ut-tdd skill suggest` で推薦するか。
5. **未確認 ~13 件** (agent-skills/automation 残りのサンプリング外): 確定前に全件確認が必要。

## 次工程 (criteria 確定後)

1. 本 draft の core/optional/drop を PO が確定 → 確定版 `docs/skills/SKILL_MAP.md` に昇格。
2. core/optional スキルの本文を vendor 由来から curate し `docs/skills/<name>.md` 正本化 (旧 CLI trigger → `ut-tdd`、レガシー用語除去)。
3. `catalogSkills` / `recommendSkills` (FR-L1-47, function-spec) が読む `automation_assets` 投影と整合させる。
4. asset-drift lint (legacy path/command residue 0、docs-skills 非空) green を維持。
