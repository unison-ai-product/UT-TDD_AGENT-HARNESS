---
plan_id: PLAN-L7-448-source-repo-windows-ci-job
title: "PLAN-L7-448 (add-impl): source repo harness-check への windows job 追加 (issue #81)"
kind: add-impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-17
updated: 2026-07-17
owner: PO / Claude (起票) / Codex (実装)
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - harness-check への windows-latest job 追加 (bun setup / パス差異 / SQLite handle)"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-L7-448-source-repo-windows-ci-job.md
    artifact_type: markdown_doc
  - artifact_path: .github/workflows/harness-check.yml
    artifact_type: config
dependencies:
  parent: null
  requires: []
  references:
    - .github/workflows/harness-check.yml
    - docs/plans/PLAN-L7-235-pack-windows-ci-job.md
---

# PLAN-L7-448 (add-impl): source repo harness-check への windows job 追加

## Status

draft 起票 (2026-07-17、GitHub issue #81 の PLAN 化)。着手時に Reverse pairing を起票して昇格する
(route_mode=add-feature)。

## 背景 (issue #81、2026-07-16 監査所見)

- README / governance は native Windows first-class を宣言する (`.claude/CLAUDE.md` Guard Rules) が、
  CI `harness-check` は ubuntu-latest のみで走る。
- Windows 固有経路 — reference seal / sealing、path separator、SQLite handle 解放遅延 (EBUSY)、
  `.cmd` provider spawn — に CI 被覆が無い。`.cmd` spawn は Linux CI では構造的に検証不能な既知の
  永続盲点 (A-147 実退行の実績)。
- **PLAN-L7-235 は Pack repo の CI (`docs/templates/github/common/pack-harness-check.yml`) が対象**で、
  「source repo CI への同時追加は本 PLAN のスコープ外 (別判断)」と明記している。本 PLAN がその別判断を
  source repo 側で引き受ける (重複ではなく分担)。

## スコープ

1. `.github/workflows/harness-check.yml` へ windows-latest job を 1 leg 追加する。
   最小構成: bun setup + typecheck + `test:fast` (or 相当の scoped suite) + scoped doctor
   (`--scope toolchain` 等)。full doctor はローカル 10 分超 (issue #70) のため CI では scope を絞る。
2. パス差異 (separator / temp dir)、SQLite handle 解放 (EBUSY retry)、行末 (`.gitattributes` eol=lf)
   に起因する Windows 固有 Red はこの job で顕在化させ、修正は個別 PLAN / debt route へ分離する
   (本 PLAN は CI 被覆の確立まで)。
3. 実行時間とコスト次第で push 毎 / PR 毎の発火条件を調整する (設計判断は Step 1 で確定)。

## 非対象

- Pack repo CI への windows job は PLAN-L7-235 のスコープ。
- windows job で発見された個別バグの修正 (別起票 / debt route)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | job 構成設計 (scope / 発火条件 / タイムアウト) | 直列 |
| 2 | harness-check.yml へ windows job 追加 + 実 run green 確認 | 直列 |
| 3 | 顕在化した Windows 固有 Red の棚卸しと debt route | 直列 |

## DoD

- [ ] source repo の harness-check が ubuntu + windows の 2 job で green (実 CI run の URL を
      review_evidence の green_commands に記録)。
- [ ] windows job が typecheck + scoped test + scoped doctor を被覆する。
- [ ] 顕在化した Windows 固有 Red が全件、修正 or 起票 (debt route) のどちらかに落ちている。
