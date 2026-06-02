---
plan_id: PLAN-REVERSE-04-setup-solo-team
title: "PLAN-REVERSE-04 (reverse/fullback): ut-tdd setup solo/team を上位整合へ back-fill — §6.5 Phase 0-A/0-B 整合 + L4 external-if GitHub 境界契約 (emit-only) + L0 §10 用語。新 FR 不要 (Phase 0 工程外)"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: fullstack
status: confirmed
created: 2026-06-02
updated: 2026-06-02
owner: PM (Opus) / PO (人間)
forward_routing: L4
promotion_strategy: reuse-as-is
agent_slots:
  - role: tl
    slot_label: "TL — as-is 設計復元 / GitHub 境界契約 (emit-only) / 用語 back-merge のレビュー (claude-only は code-reviewer 代替)"
  - role: po
    slot_label: "PO — R3 intent (setup=Phase 0 工程外で新 FR 不要 / branch protection 人間サインオフ) 検証 (§1.8 R3 必須)"
generates: []
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-03-setup-solo-team.md
  blocks: []
---

# PLAN-REVERSE-04 (reverse/fullback): ut-tdd setup solo/team を上位整合へ back-fill

## §0 位置づけ

Add-feature 標準ライフサイクル 経路 B の **収束段**。`PLAN-L6-05` (add-design) + `PLAN-L7-03` (add-impl) で **bottom-up build** した `ut-tdd setup` solo/team 機能の**上位整合 (§6.5 Phase 0-A/0-B / L4 external-if GitHub 境界契約 / L0 §10 用語) が空いている**ため、Reverse fullback で実装事実から back-fill し V-model 左腕の孤児化を解消する。`forward_routing=L4` / `promotion_strategy=reuse-as-is`。

> `forward_routing=L4` は **最前の design-layer 追記 = L4 external-if** を指す (REVERSE-03 の L3=FR 拡張に相当)。§6.5 (要件 governance) と §10.3 (L0 glossary) は同時に行う back-merge であり、design-layer の最前は L4。

## §1 R0-R4 (fullback)

| phase | 作業 | 結果 |
|-------|------|------|
| R0 evidence | 実装事実収集: `src/setup/index.ts` (契約関数 7 本) / `src/cli.ts` ut-tdd setup / `tests/setup.test.ts` U-SETUP-001〜007 (92 pass) / `docs/templates/github/{common,team}/` 8 テンプレ | evidence = 実装 + 92 pass + テンプレ |
| R1 (skip) | GitHub 設定は file emit (CODEOWNERS/workflow/templates) + gh-api 操作 (branch protection) の 2 種。外部契約 = gh CLI I/F + file 投影のみ (setup-solo-team.md §2.4) | observed = gh I/F + file 投影 |
| R2 as-is | `ut-tdd setup` は §6.5 Phase 0-A/0-B の **emission 実装**だが §6.5 側に setup 実装への参照なし。GitHub 境界 (file vs gh-api / emit-only 既定 / branch protection 人間サインオフ) が L4 external-if に未記載。Phase 0-A/0-B・参加規模検出・emit-only が L0 §10 用語に未 back-merge | as-is = 3 つの上位 gap |
| R3 intent (po 検証) | (a) **setup = Phase 0 bootstrap (リポジトリ初期化 / branch protection = concept §512 で「工程外」) → 新 FR を起こさない** (fr-registry-audit 46 件不変) / (b) GitHub 設定操作 (branch protection) は **emit-only 既定・適用は admin 人間サインオフ** (認可・本番影響境界) を L4 external-if に明記 / (c) Phase 0-A/0-B 出し分けが §6.5 2-stage と整合 — の 3 点が intent | **R3 PASS (2026-06-02)**: (a) は concept §512 (Phase 0 = 工程外) + scout 監査 (setup の FR-L1-NN 不在) に grounded、新 top-level 要件にしない / (b)(c) は L6 設計で PO 確定済 (emit-only / 非対話 apply 封鎖 / 数で自動確定しない)。よって R3 intent 充足。PO 認識ずれあれば再エスカレーション |
| R4 gap/routing | `forward_routing=L4`: ① §6.5 に `ut-tdd setup` solo/team が Phase 0-A/0-B emission の実装である旨を追記 / ② L4 external-if に setup GitHub 境界契約 (file emit + emit-only + 人間サインオフ + token 非保持) を追記 / ③ L0 §10.3 機構用語に Phase 0-A/0-B / 参加規模検出 / emit-only を back-merge。`reuse-as-is` (実装変更なし) | back-fill 完了 |

## §2 back-fill 内容 (新規 FR を起こさない = fr-registry-audit 46 件不変)

- **要件 §6.5** (`docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`): Phase 0-A/0-B の定義に「`ut-tdd setup --solo/--team` がこの 2-stage の emission を担う (検出→提案→確認→記録、PLAN-L6-05/L7-03)」を追記。branch protection は emit-only 既定で人間適用。
- **L4 external-if** (`docs/design/harness/L4-basic-design/external-if.md`): VCS・CI 境界に「`ut-tdd setup` の GitHub 設定境界 = ファイル emit (CODEOWNERS / workflow / ISSUE・PR テンプレ) は harness が書く / branch protection・Required 化は gh-api 操作で **emit-only 既定** (script 生成、適用は admin 人間サインオフ) / token は保持しない (gh 認証委譲)」の DbC 境界を追記。
- **L0 §10.3 機構用語** (`docs/governance/ut-tdd-agent-harness-concept_v3.1.md`): Phase 0-A (solo) / Phase 0-B (team) / 参加規模検出 / emit-only を back-merge (§G.9、機構用語)。

> **なぜ新 FR でないか**: `ut-tdd setup` (リポジトリ初期化 + CODEOWNERS/branch protection bootstrap) は concept §512 が明示する **Phase 0 = V-model 工程外の基盤整備**であり、L1/L3 の機能要件 (FR-L1/FR) ではない。要件は §6.5/§9.1/§10 (Phase 0 governance) 側にあり、fr-registry-audit (46 件) を崩さない。

## §工程表

### Step R4-1: 要件 §6.5 に ut-tdd setup solo/team emission を追記
### Step R4-2: L4 external-if に setup GitHub 境界契約 (file emit / emit-only / 人間サインオフ / token 非保持) を追記
### Step R4-3: L0 §10.3 機構用語に Phase 0-A/0-B / 参加規模検出 / emit-only を back-merge
### Step R-review: review 前置 (MUST)
`code-reviewer` で back-fill の妥当性 (新 FR 不要の判断 / GitHub 境界契約が impl と一致 / 用語定義) をレビュー。po (R3) intent 検証は escalation。
### Step R4-4: fr-registry-audit + 全回帰
`npx vitest run` (46 件不変 + 92 pass 維持)。

## §実装計画

| 項目 | 情報源 |
|------|--------|
| as-is 実装事実 | `src/setup/index.ts` / `tests/setup.test.ts` / `docs/templates/github/` (R0 evidence) |
| setup=Phase 0 工程外の判断 | concept §512 (Phase 0 = 基盤整備、工程外) + scout 監査 (FR-L1 不在) |
| GitHub 境界契約 (emit-only / token 非保持) | setup-solo-team.md §2.4 + external-if.md §5 (gh 認証委譲、harness core は token 非保持) |
| §6.5 整合 | 要件 §6.5 Phase 0-A/0-B 2-stage + §10.1/10.2 受入条件 |
| 用語 back-merge | PLAN-L6-05 §6 (Phase 0-A/0-B / 参加規模検出 / emit-only、導入層 L6) |

## §3 成否

- 要件 §6.5 + L4 external-if + L0 §10.3 が追記され、`ut-tdd setup` 実装が上位 (Phase 0 governance / GitHub 境界 / 用語) に trace 可能 (左腕孤児解消)
- **fr-registry-audit 46 件不変** + 全回帰 92 pass
- code-reviewer review APPROVE (L6/L7/Reverse 各段。Critical/Important 全解消)
- **R3 PASS**: (a) setup=Phase 0 工程外で新 FR 不要 は concept §512 + scout に grounded / (b)(c) emit-only・§6.5 整合 は L6 で PO 確定済。再エスカレーション不要でクローズ
- Add-feature 経路 B (L6→L7→Reverse→上位整合) の 1 サイクルが setup solo/team で完結 (session-log / forced-stop に続く dogfood 3 例目)。`status: confirmed`

## §4 carry

- **branch protection 適用の gh-api 実形 (`--apply-branch-protection`)** は opt-in path。実機 gh での PUT field 検証 (restrictions=null 等) は G7 後保守 (現状 emit-only script が主、CLI 直接適用は副)。
- **escalation-stale.yml テンプレの検出ロジック実装** (§6.8.4) は scaffold skeleton 止まり、利用者 repo 運用時に follow-up。
- **commitlint 配置** (standalone vs package.json) は対象 repo へ standalone emit で確定 (L7-03 Step 3)。
