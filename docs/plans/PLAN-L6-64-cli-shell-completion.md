---
plan_id: PLAN-L6-64-cli-shell-completion
title: "PLAN-L6-64 (add-design): CLI シェルコンプリーション機能 (ZIP 90_CLI配布・シェル補完設計書 相当)"
kind: add-design
layer: L6
sub_doc: function-spec
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / Codex
parent_design: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - shell completion コマンドの契約設計、対象シェル (bash/zsh/pwsh) の優先度判断"
generates:
  - artifact_path: docs/plans/PLAN-L6-64-cli-shell-completion.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires:
    - docs/plans/PLAN-REVERSE-395-cli-command-design-backfill.md
  references:
    - docs/design/harness/L4-basic-design/external-if.md
    - src/cli.ts
    - .ut-tdd/audit/A-185-vmodel-docgen-reference-mining-2026-07-07.md
---

# PLAN-L6-64: CLI シェルコンプリーション機能

## 0. 背景 (ZIP 再監査 2026-07-08、advisor 相談済み、PO 指示による起票)

ZIP `90_CLI配布・シェル補完設計書` はパッケージ配布/バージョン確認/シェル補完を定義する。UT-TDD 側
`src/cli.ts` には80以上のコマンドが実装済みだが、grep (`completion|shell`) では shell completion 機能
そのものへの直接該当は無く (ヒットは `work-guard.ts` 等の無関係語のみ)、実装・設計いずれにも存在しない
genuine gap と判定した。本機能は UT-TDD 自身に無関係な product-select 項目ではなく、CLI ツールとしての
利用体験に直結するため起票する。

## 1. 設計スコープ

1. `ut-tdd completion <shell>` 相当のコマンド追加要否を PO 判断のもと設計する。
2. 対象シェル (bash/zsh/PowerShell、Windows ネイティブが first-class という `.claude/CLAUDE.md` 方針を
   踏まえ PowerShell を優先候補とする) の優先順位を決める。
3. サブコマンド一覧の動的取得方法 (`src/cli.ts` の command 定義から生成) を設計する。

## 2. 受け入れ条件 (design freeze 時)

- 対象シェルと補完コマンド体系が L6 function-spec として固定される。
- PO による機能要否判断が記録される (需要が無いと判断された場合は本 PLAN の `status` を `archived` に
  変更し、skip 理由を本文に明記する)。
- `PLAN-REVERSE-395` (CLI コマンド体系 as-is 復元) の R4 合流結果を `requires` として待ち、
  復元されたコマンド一覧・終了コード規約と整合する形でサブコマンド体系を設計する。
