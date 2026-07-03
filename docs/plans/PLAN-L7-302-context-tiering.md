---
plan_id: PLAN-L7-302-context-tiering
title: "PLAN-L7-302 (impl): 起動コンテキスト tier 化 — 常時必読 11.3 万トークンの動的ロード化"
kind: impl
layer: L7
drive: agent
status: draft
version_target: v2
route_signal: version_deferral
route_mode: version-up
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/handover-mechanism.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - canonical read order 変更の承認 (CLAUDE.md は正本、PO ゲート必須)"
  - role: tl
    slot_label: "TL - tier 境界とセクション抽出の設計レビュー"
  - role: se
    slot_label: "SE - doc-router 実装 + read order 更新"
generates:
  - artifact_path: docs/plans/PLAN-L7-302-context-tiering.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
    - docs/governance/harness-v2-update-strategy.md
    - CLAUDE.md
---

# PLAN-L7-302 (impl): 起動コンテキスト tier 化

## Status

**version-up parked (v2)**。A-181 CE-1。CLAUDE.md の Read Order 変更は正本変更なので活性化・設計とも PO ゲート。

## 背景 (実測 2026-07-03)

- CLAUDE.md の「Claude Code Read Order」が canonical 指定する 7 doc の合計 = 4,492 行 / 394,039 文字 ≒ **11.3 万トークン** (`wc -l` / `wc -c`、トークン ≒ 文字/3.5)。
- うち requirements_v1.2 (221,275 文字) + concept_v3.1 (136,266 文字) で **90.7%**。Sonnet 200k window の半分超を「読むだけ」で消費し、plan lint / status 確認のような軽いループでは圧倒的に割高。
- 既に read order には「migration snapshot / 検証 roadmap は動的読み」の前例があり、tier 化は既存思想の延長 (新規概念ではない)。

## スコープ (1 要件: セッション常時コンテキストを役割相応へ縮小し、全文が必要な場面でだけ全文を読む)

1. **tier 定義** (CLAUDE.md Read Order の改訂、PO 承認必須):
   - Tier 0 (常時): `CLAUDE.md` / `.claude/CLAUDE.md` / `docs/governance/README.md` (~6.4k トークン)
   - Tier 1 (タスク種別で動的): concept v3.1 / requirements v1.2 の**該当セクションのみ** (設計判断時は concept §2 系、要件参照時は requirements 該当 §)
   - Tier 2 (明示参照時のみ): extraction-plan / ADR-001 / 全文読み
2. **セクション索引**: `src/context/doc-router.ts` (新規) — concept/requirements の見出しレベル索引 (§番号 → 行範囲) を生成し、`ut-tdd context suggest --task "..."` がタスク分類 (`ut-tdd task classify` と同じ signal 語彙) から読むべきセクション一覧を返す。skill suggest と同型の「関連物だけ注入」機構 (柱 4 の doc への適用)。
3. **CLAUDE.md 改訂**: Read Order を tier 表記に更新し、「全文読みが必要な場面」(freeze レビュー / 上流デグレ監査 / R0) を明記。**削るのは常時性であり canonical 性ではない** — 正本の地位は不変と明記する。
4. **索引の drift 防止**: doc 更新でセクション行範囲がずれるため、索引は commit 時静的生成ではなく実行時 parse (キャッシュ可) とする。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | tier 境界の設計 + PO 承認 (どの作業に全文が必須かの合意) | 直列 |
| 2 | doc-router (見出し索引 + context suggest) 実装 | 直列 |
| 3 | CLAUDE.md / .claude/CLAUDE.md の Read Order 改訂 (rule-drift marker 整合を保つ) | 直列 |
| 4 | regression test (索引が実 doc の見出しと一致 / 未知タスク種別は Tier 1 全文へ fail-open) | 直列 |

## DoD

- [ ] `ut-tdd context suggest` がタスク文からセクション一覧 (path + 行範囲 + 見出し) を返す (test 固定)
- [ ] 索引が concept/requirements の実見出しから生成され、見出し改変に追随する (test 固定)
- [ ] CLAUDE.md Read Order が tier 表記になり、`rule-drift` gate が green のまま (doctor 確認)
- [ ] 常時 tier の合計トークンが基線 11.3 万から 1 万未満へ縮小 (wc 実測を review_evidence に記録)

## 実装ノート (後続モデル向け)

- 触るファイル: `CLAUDE.md`、`.claude/CLAUDE.md`、`src/context/doc-router.ts` (新規)、`src/cli.ts` (context suggest)。AGENTS.md (Codex 側) にも同じ tier を反映しないと rule-drift が fail する — アダプタ 3 面 (CLAUDE.md / .claude/CLAUDE.md / AGENTS.md) を同時に更新すること。
- 抽出の粒度は「見出しセクション丸ごと」。文単位の要約はしない (要約は substance を壊す)。
- fail-open 設計: 分類不能タスクは「全文読み推奨」を返す。読み過ぎは安全側、読み漏れは危険側。
