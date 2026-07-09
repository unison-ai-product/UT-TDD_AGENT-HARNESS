---
plan_id: PLAN-REVERSE-395-cli-command-design-backfill
title: "PLAN-REVERSE-395 (kind=reverse): CLI コマンド体系・終了コード規約 as-is 復元 (ZIP 88_CLIアーキ・コマンド体系設計書 相当)"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: agent
status: confirmed
route_signal: design_gap
route_mode: reverse
created: 2026-07-08
updated: 2026-07-09
owner: PO / Codex
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
forward_routing: L4
promotion_strategy: reuse-as-is
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T14:20:00+09:00"
    tests_green_at: "2026-07-09T14:20:00+09:00"
    verdict: approve
    scope: "PLAN-REVERSE-395 R0→R4。src/cli.ts の commander surface / exit code / JSON 境界を L4 external-if と L9 ST-EXT-05 へ as-is back-fill し、PLAN-L6-64 の completion 入力を固定した。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: lint
        command: "bun run src\\cli.ts plan lint --gate governance"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T14:20:00+09:00"
        evidence_path: docs/design/harness/L4-basic-design/external-if.md
        output_digest: "sha256:c38f639fc1c6b7ff9dcb96aa247a3e1ab09441d6d8b4db48777fff8d07aa62a8"
agent_slots:
  - role: tl
    slot_label: "TL - src/cli.ts 実装からの as-is 復元 (R0-R2) + L4 external-if.md への合流判断 (R3-R4)"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-395-cli-command-design-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/external-if.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L9-system-test-design.md
    artifact_type: test_design
  - artifact_path: docs/governance/vmodel-upgrade-schedule.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/plans/PLAN-L6-64-cli-shell-completion.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - src/cli.ts
    - docs/design/harness/L4-basic-design/external-if.md
    - CLAUDE.md
    - AGENTS.md
    - .ut-tdd/audit/A-185-vmodel-docgen-reference-mining-2026-07-07.md
---

# PLAN-REVERSE-395: CLI コマンド体系・終了コード規約 as-is 復元

## 0. 背景 (ZIP 再監査 2026-07-08、advisor 相談済み、PO 指示による起票)

ZIP `88_CLIアーキ・コマンド体系設計書` はサブコマンド体系/引数規約/終了コードを定義する。UT-TDD 側
`src/cli.ts` には80以上のコマンドが**実装先行で**存在するが、対応するコマンド体系・終了コード規約を
定める設計 doc の正本が無い (`docs/design/harness/L4-basic-design/external-if.md` はサービス境界を
扱うがCLIコマンド体系そのものは対象外)。

advisor 相談の結果、**本件は Forward `add-design` (未実装機能の設計) ではなく Reverse (既存の
未文書化実装を as-is 復元する) が正しい route** と判定した。UTDD taxonomy 上、実装が先行し設計が
追随していないケースは Recovery ではなく Reverse (`reverse <type> R0 -> R4 -> Forward merge`) の対象
であり、`kind=add-design` で新規機能として起票すると実装先行の事実と route が食い違う。

## 1. Reverse スコープ (R0-R2: as-is 復元)

1. `src/cli.ts` の実コマンド一覧・引数パターン・終了コード規約を as-is で棚卸しする。
2. CLAUDE.md の Canonical Commands 節との整合性を確認する (正本が CLAUDE.md 側にあるか、
   専用設計 doc が要るかを R3 で判断)。

## 2. Forward 合流判断 (R3-R4)

- R3: 棚卸し結果を、独立した CLI 設計 doc として新設するか、既存 `external-if.md` の拡張とするかを
  TL/PO が判断する。
- R4: 判断結果に基づき Forward (L4) へ合流する。

## 3. 受け入れ条件

- [x] as-is 復元がテスト・CI で裏取りされた実コマンド一覧と一致する (推測で記述しない)。
- [x] Forward 合流先 (新設 doc か既存 doc 拡張か) が R3 で確定する。
- [x] `forward_routing`/`promotion_strategy` は R0 時点では未確定のため frontmatter に含めない
  (Codex クロスレビュー指摘: R0 で先取り確定すると R3/R4 の判断を骨抜きにする)。R3/R4 到達時に
  確定した値を追記する。

## 4. R0-R2 as-is 復元結果 (2026-07-09)

実装正本は `src/cli.ts` の commander surface である。`bun run src\cli.ts --help` と
`.command(...)` 定義を照合し、top-level command は `status`、`doctor`、`mcp`、`verify`、
`graph`、`trace`、`session`、`hook`、`guard`、`plan`、`handover`、`db`、`progress`、`find`、
`metrics`、`telemetry`、`skill`、`review`、`cutover`、`automation`、`guardrail`、`issue`、
`trouble`、`improvement`、`asset`、`roster`、`builder`、`vmodel`、`route`、`advisor`、`codex`、
`claude`、`gate`、`task`、`team`、`audit`、`branch`、`github`、`feedback`、`setup`、`memory`、
`distribution`、`context` と確認した。

代表的な下位 command は `trace impact/rag`、`graph impact/export`、`db status/rebuild/scope-preview`、
`skill suggest/new`、`task classify/route/roster`、`team suggest/run`、`memory add/list/recall/context/suggest`、
`handover provider export/status` である。Canonical Commands は AGENTS/CLAUDE に代表導線として存在するが、
全 CLI catalog の正本ではない。

終了コード規約は as-is で次の分類に復元する。

- success / dry-run success: exit 0。
- validation failure、doctor / lint / gate failure、missing required input、unknown DB row: exit 1。
- explicit guard block / route command hard block: exit 2。
- provider adapter execution は provider process の `exit_code` を伝播する。

出力規約は text が人間向け、`--json` が automation 向けである。全 command が `--json` を持つわけではないため、
機械利用 command は `--json` 有無を command catalog で識別する。

## 5. R3/R4 合流判断

R3 判断: 新規 doc は作らず、既存 `docs/design/harness/L4-basic-design/external-if.md` に
`CLI user boundary` を追加する。理由は、CLI は外部 service ではないが、人間・hook・CI が呼ぶ product
boundary であり、既存 external-if の境界 DbC / fail-close / degradation と同じ L4 粒度で扱えるため。

R4 結果: `external-if.md` に CLI boundary を back-fill し、L9 `ST-EXT-05` に system test category を追加した。
さらに L6 `buildCommandCatalog` の契約を、shell completion が利用する command registry として明確化し、
L7 `U-FR-L1-48` oracle に JSON 対応有無、exit profile、registrar 所有 command family の観点を追加した。
`PLAN-L6-64` は本 Reverse を `requires` に持ち、completion 設計ではこの as-is command catalog を入力にする。
completion 側で存在しない command path を創作してはならない。
