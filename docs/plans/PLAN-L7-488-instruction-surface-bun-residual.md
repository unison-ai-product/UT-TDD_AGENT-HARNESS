---
plan_id: PLAN-L7-488-instruction-surface-bun-residual
title: "PLAN-L7-488 (troubleshoot): instruction surface に残った Bun 実行形の撤去と再混入検査 (PLAN-L7-462 残件、Issue #322)"
kind: troubleshoot
layer: L7
drive: agent
route_signal: incident
route_mode: incident
status: draft
created: 2026-08-14
updated: 2026-08-14
backprop_decision: not_required
backprop_decision_reason: "PLAN-L7-462 で決定済みの Node 一本化を instruction surface へ反映する純修理であり、新規契約を追加しない。L0-L6 要件・外部仕様・製品挙動は不変で、対象は AI ランタイムが読む規約文書と既存 rule-drift 検査の拡張のみ。"
owner: PM
agent_slots:
  - role: aim
    slot_label: "AIM - 検査の置き場所 (既存 rule-drift 拡張 / 新規 checker) と検査範囲の設計判断"
generates:
  - artifact_path: docs/plans/PLAN-L7-488-instruction-surface-bun-residual.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-462-bun-runtime-withdrawal.md
  requires:
    - PLAN-L7-462-bun-runtime-withdrawal
  blocks: []
  references:
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/322
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/134
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/321
github_issue_id: 322
review_evidence: []
---

# PLAN-L7-488: instruction surface に残った Bun 実行形の撤去

## §0 位置づけ

`PLAN-L7-462` (Bun runtime 撤退、completed) は hooks / scripts / CI / snapshot runner の Node swap を
完了させたが、**AI ランタイムが読む instruction surface** (`CLAUDE.md` / `.claude/CLAUDE.md` /
`AGENTS.md`) に Bun 実行形の指示が残った。機械設定と指示文が正面から矛盾する状態であり、
本 PLAN はその残件を閉じる。

## §1 事象 (実測)

| 面 | 実測 |
| --- | --- |
| `.claude/settings.json` | hook command **7 件すべて `node`** (bun 出現 0) |
| `.claude/CLAUDE.md` §Hooks | 同じ hook 群を `bun "$CLAUDE_PROJECT_DIR/..."` と記載 |
| `.claude/CLAUDE.md` 他 | agent-guard 起動形 / advisor spot-check / 前提条件が `bun` |
| `CLAUDE.md` / `AGENTS.md` | doctor 規律の再実行形の例示が `bun -e` |
| `package.json` | `engines.bun: ">=1.3"` (同ファイルの `bunAuthority: legacy_migration_debt` と不整合) |

**実害 (2026-08-14)**: instruction surface の記載に従って bun で `ut-tdd pr merge` を実行した結果、
bun 固有の条件 (Windows read-only 属性が付いた既存 dir に対する `mkdirSync(recursive:true)` の
EEXIST。node は許容) で receipt 書込が失敗し、これを D2-B の実バグと誤認した報告から、存在しない
欠陥の修理 issue #321 / PR #323 が起票された (いずれも撤回・close 済み)。人間の読み違いではなく
**規約文書が誤った実行形を能動的に指示していた**ことが原因である。

## §2 設計判断

### 2.1 検査の置き場所: 既存 `rule-drift` の拡張 (採択) vs 新規 checker

| 案 | trade-off |
| --- | --- |
| **(採択) 既存 `rule-drift` へ forbidden marker を追加** | 対象 3 doc の読み込み・報告・doctor 配線が既にある。marker 追加は 1 箇所で、doctor の check 数も CI の gate 数も増えない。反面 `rule-drift` の責務が「adapter 間の marker 整合」から「adapter の内容規律」へ僅かに広がる |
| 新規 checker を建てる | 責務は純粋になるが、doctor 配線・分類台帳・test-design 行・PLAN 所有が新規に必要で、検査 1 個のために gate を 1 個増やす。「未計測のままゲートを建てない」規律にも反する |

**採択理由**: `rule-drift` は既に `FORBIDDEN_ADAPTER_MARKERS` として「adapter doc に**あってはならない**
文字列」を持っており (legacy runtime の command routing / env prefix / state path / agent name)、
本件はその同じ類型である。責務の拡張ではなく既存責務への 1 項目追加として収まる。

### 2.2 検査範囲: 実行指示のみを対象とし、過去の記録は対象外 (採択)

`CLAUDE.md` には incident の記録として「bun runaway ×2」がある。これは実行指示ではなく事実の記録で
あり、検査が拾うと**過去の記録を消す方向へ圧力が掛かる**。よって検出対象は「実行形として書かれた
Bun 起動」に限定し、この境界自体を oracle で固定する (`U-RDRIFT-006`)。

### 2.3 `engines.bun` の扱い: 削除 (採択)

`package.json` の `engines.bun: ">=1.3"` は同ファイルの `bunAuthority: legacy_migration_debt` と
矛盾する。`src/lint/runtime-portability.ts` は `engines.node` を必須とし `engines.bun` は任意
(#134 の残存宣言) として扱うため、削除しても portability 検査は成立する。宣言の矛盾を残すと
「どちらが正本か」を読み手が判断できないため削除する。

## §3 工程表

### Step 1: [直列] instruction surface の是正と検査追加

直列理由: downstream_dependency. 検査を先に入れると現行 doc で fail-close するため、doc 是正と
検査追加は同一 commit で合流させる。

### Step 2: [直列] 非 author family による closing review

直列理由: downstream_dependency. 実装が exact HEAD で揃ってからでないと review 対象を固定できない。
本 PLAN の実装は Claude が著者のため、Codex 側 frontier tier が closing review を行う。

## §3.1 実装計画

1 PR = 1 論点 (instruction surface の Bun 実行形撤去 + 再混入検査) に限定する。`src/` / `tests/` /
`scripts/` 本体の Bun 依存除去は #134 本体が所有し、本 PLAN では扱わない。

## §4 DoD

- [ ] `.claude/CLAUDE.md` §Hooks の各行が `.claude/settings.json` の実 command + args と機械的に
      一致する (`U-RDRIFT-007` が実 repo で照合し、不一致は fail-close)。
- [ ] instruction surface 3 ファイルに実行指示としての Bun 起動形が 0 件 (`U-RDRIFT-005`)。
- [ ] 過去 incident の記録は検出対象外 (`U-RDRIFT-006`)。
- [ ] `package.json` の `engines` と `utTdd.nodeToolchain` の宣言が矛盾しない。
- [ ] 検出器を外すと該当 oracle が RED になる (load-bearing 実証)。
- [ ] 非 author family の closing review が PASS。

## §5 Exit

DoD 全項目が実測で満たされ、closing review PASS 後に merge した時点で confirmed へ遷移する。
