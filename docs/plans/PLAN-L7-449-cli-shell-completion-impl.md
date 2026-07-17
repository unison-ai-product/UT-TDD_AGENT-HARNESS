---
plan_id: PLAN-L7-449-cli-shell-completion-impl
title: "PLAN-L7-449 (add-impl): CLI シェルコンプリーション実装 (PowerShell 動的補完 + catalog extractor SSoT)"
kind: add-impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-17
updated: 2026-07-17
owner: PO / Claude (起票) / Codex (実装)
parent_design: docs/plans/PLAN-L6-64-cli-shell-completion.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - commander tree extractor + completion command + PowerShell loader 実装"
  - role: qa
    slot_label: "QA - §4.5 unit oracle (catalog drift / subset / 正例 / exit carve-out) の Red 先行"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-L7-449-cli-shell-completion-impl.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-449-cli-shell-completion-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-64-cli-shell-completion.md
  requires:
    - docs/plans/PLAN-L6-64-cli-shell-completion.md
  references:
    - docs/plans/PLAN-REVERSE-395-cli-command-design-backfill.md
    - src/cli.ts
    - src/workflow/contracts-extras.ts
---

# PLAN-L7-449 (add-impl): CLI シェルコンプリーション実装

## Status

draft 起票 (2026-07-17)。PLAN-L6-64 §5 降下先宣言に従う add-impl。Reverse pairing は
PLAN-REVERSE-449 (実装観測の L6/test-design への gap-only backfill)。

**着手前提 (L6-64 §5 の hot-file 制約)**: `src/cli.ts` がホットファイルのため、実装着手は
Codex 並行ブランチ (`work/l7-421` / `work/vmodel-engine-swap-wave3` 系) の合流後とする。
本 PLAN の起票自体は先行してよい (blocker 解除済み: REVERSE-395 R4 合流済み)。

## 契約の正本

実装契約は **PLAN-L6-64 §4 (design freeze) が正本**であり、本 PLAN は再定義しない。要点参照:

- §4.1: PowerShell (P0) のみ。bash/zsh は後続分離起票。
- §4.2: `ut-tdd completion powershell` (薄い loader) / `ut-tdd completion --list [--cursor <n>] -- <token...>`
  (tokenize 済み argv、prefix filtering)。未対応 shell = exit 1、`--list` は不正文脈でも
  exit 0 + 空候補 (REVERSE-395 への明示 carve-out)。
- §4.3: commander tree 再帰 walk extractor を catalog SSoT とし、必須 metadata (command path /
  flags / description / --json 対応 / exit profile / registrar family) を固定。手書き 7 件配列の
  `builder catalog` drift を同 extractor で解消。
- §4.4: `--list` は重い初期化 (state 読み込み / DB open) を skip する軽量早期分岐。

## Steps (TDD Red 先行)

| Step | 内容 | mode |
|---|---|---|
| 1 | §4.5 oracle の Red 作成 (catalog drift / subset / 正例 3 件 / exit carve-out 負系込み) | 直列 |
| 2 | commander tree extractor 実装 + `buildCommandCatalog` 入力源の置換 | 直列 |
| 3 | `ut-tdd completion` command (powershell loader + --list) 実装 | 直列 |
| 4 | 軽量早期分岐 (§4.4) + レイテンシ確認 | 3 と直列 |
| 5 | cross-provider blind review (非 author runtime) → confirm | 直列 |

## DoD

- [ ] §4.5 の 4 oracle 群 (catalog 抽出 / subset / 正例 / exit code) が Red→Green で固定されている。
- [ ] `builder catalog` が extractor SSoT 化され、実登録 command との drift 0 を oracle が検証する。
- [ ] `ut-tdd completion powershell | Out-String | Invoke-Expression` で実 PowerShell 補完が動作する
      (実走 evidence を review_evidence の green_commands に記録)。
- [ ] PLAN-REVERSE-449 R0-R4 で実装観測が L6-64 / L7 test-design へ gap-only backfill されている。
