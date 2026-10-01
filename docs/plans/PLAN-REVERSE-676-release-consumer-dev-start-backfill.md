---
plan_id: PLAN-REVERSE-676-release-consumer-dev-start-backfill
title: "PLAN-REVERSE-676: Release consumer 開発開始の逆向き確認"
kind: reverse
layer: cross
drive: agent
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
created: 2026-09-24
updated: 2026-09-24
owner: Claude / Opus (pair-freeze) · Codex worker (implementation)
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: not_required
backprop_decision_reason: PLAN-L6-101 の source 非依存受入と PLAN-L7-529 の identity
  create / commit policy を変更せず、Release consumer が開発を開始するまでの表示・同梱資産の解決順・ design
  root 規約・生成物の実測を L7 へ具体化し、その不足差分だけを L6-101 へ戻すため。
parent_design: docs/plans/PLAN-L7-676-release-consumer-dev-start.md
pair_artifact: docs/test-design/harness/L7-release-consumer-dev-start-test-design.md
agent_slots:
  - role: tl
    slot_label: Claude Opus / Sol - PLAN-L7-529 の frozen 契約と本 PLAN の表示・解決順の整合を逆向き検証する
  - role: qa
    slot_label: Terra - CANDIDATE-U-RCDEV-001..038 を独立照合し、同名 skill による path 乗っ取り・部分
      setup の残留・gate の未判定の隠蔽を攻撃する
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-676-release-consumer-dev-start-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-676-release-consumer-dev-start.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
    - docs/plans/PLAN-L7-529-project-identity-bootstrap.md
    - docs/plans/PLAN-L7-628-pack-consumer-runtime-release-install.md
    - docs/plans/PLAN-L7-531-pack-internal-canary-smoke.md
    - docs/test-design/harness/L7-release-consumer-dev-start-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/676
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 676
admission_receipt:
  schema_version: v2
  receipt_id: certificate:b7b0f3a8cb739680b768affff5f9d9cf
  command_id: plan-revise:issue-676:plan-confirm:reverse:r5:77731b7d7052
  admitted_at: 2026-09-25T06:47:48.414Z
  source_digest: sha256:c66f82bf6aa5b49e4cf0ffed2252a7f14ccbf42f9ee727bc1aa63bd835eaa144
  decision_digest: sha256:84c35e00dacfb9aba2d10e2e7bfd65928e93383f61153bb4ff52697eff53c7ed
  receipt_digest: sha256:ddec99fdd9bd8f4d1319fa8b4dab2d8b848fcf548a124c42c890f44925a601a8
  binding:
    path: docs/plans/PLAN-REVERSE-676-release-consumer-dev-start-backfill.md
    plan_id: PLAN-REVERSE-676-release-consumer-dev-start-backfill
    asset_id: plan:2db3028c656fba04cb6610d7278dfa56
    revision: 5
    content_digest: sha256:c66f82bf6aa5b49e4cf0ffed2252a7f14ccbf42f9ee727bc1aa63bd835eaa144
  route:
    signal: reverse
    mode: reverse
  issue:
    provider: github
    issue_id: 676
    episode_id: E4-676-release-consumer-dev-start
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-628-pack-consumer-runtime-release-install
    revision: 5
    digest: sha256:e29ead3ced26cd437a348ae5ba8199bf22712b787af002e52875fb9c9a2fa6ea
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-676-release-consumer-dev-start
    target_revision: 5
    phase: forward_merge
  escape_reason: "PR #688 Codex Sol r1 FLAG (Forward 契約との 1:1 不一致) の是正: R4 の再合流条件に
    PLAN-L7-676 §4 の全 slice (PR-T1〜PR-T3、PR-G0〜PR-VL 等) を明示し、Scope boundary が
    G8〜G14 の述語新設 (§3.6-4、CANDIDATE-U-RCDEV-029..035) を対象外にしないよう限定した。#690
    の実装後に、issue binding を projection_state: unprojected で再発行する。"
---

# PLAN-REVERSE-676: Release consumer 開発開始の逆向き確認

## R0: 対象境界

対象は `PLAN-L7-676` の identity 失敗表示と復旧手順 (§3.3)、同梱資産の埋め込み・展開・解決順 (§3.1)、
design root resolver (§3.2)、生成物 (§3.4)、rev 2 で加えたテンプレート移植 (§3.5)・consumer 検証 (§3.6)・エージェント確認経路の前提 (§3.7)。identity の create / read / commit policy (`PLAN-L7-529`)、
Release asset 集合と installer (`PLAN-L7-628`)、live-tree fence (`PLAN-L7-421`)、clean fixture E2E (`PLAN-L7-531`)、
launcher の 8.3 alias 等価性 (Issue #678) は対象外であり、再所有しない。

## R1: Forward 契約の逆向き分解

| 上位契約 | 本 PLAN での具体化 | 照合観点 |
| --- | --- | --- |
| `PLAN-L6-101` source 非依存受入 | Release の compiled ESM だけで skills が consumer に届き、`skill suggest` が非空になる (§3.1) | source repo・Pack checkout の skills / templates を実行時に読んでいないか |
| `PLAN-L7-529` §3.2.1 setup 非中断 | origin 無しで部分成功し、typed deny と復旧手順を表示する (§3.3-1) | identity deny を握り潰して成功扱いにしていないか、setup 全体を中断していないか |
| `PLAN-L7-529` §3.3 採択 B 自動 commit なし | commit が必要な旨と手順を表示するだけ (§3.3-3) | setup / session start が暗黙に commit していないか、HEAD-strict read を緩めていないか |
| `PLAN-L7-529` §2.6 marker 判定 | `isRepoRoot` の fallback 条件を変えない (§3.3-2) | fallback を `.git` 単独受理などに緩めて親 repo を誤認していないか |
| `PLAN-L7-628` §1.1 / §3 asset 集合 | 埋め込みは `<tag>.ut-tdd.mjs` の内側に留める (§3.1 案 C) | asset 集合・installer 手順を変えていないか、tarball を展開していないか |
| `vmodel-document-disposition-catalog.md` の採否 | zip テンプレート 57 本を slot source か optional に分類する (§3.5.3) | disposition の target と slot の対応が一意か、zip に無い内容を書き起こしていないか |
| `vmodel-document-scale-profiles.md` / `vmodel-document-catalog.md` の正本性 | zip の管理 yaml を既存正本へ merge し、別ファイルで出荷しない (§3.5.4) | 第 2 の SSoT が生まれていないか |
| `gate-design.md` §1 ゲートモデル / `vmodel-contract.yaml` の右腕 layer 行 | G8〜G14 の述語を contract 行から導出し、残りを review tier に明示する (§3.6-4) | static check が判定内容を超えて承認を代行していないか、未判定を pass と見せていないか |
| ADR-001 (TypeScript/Node) | `tools/*.py` を同梱せず、検査の意味を TS gate で実装する (§3.6-6) | Python 実行経路や `.py` が配布物に入っていないか |
| `PLAN-L6-93` / `PLAN-L7-458` Node generation | 埋め込み対象を esbuild の実 input として通す (§3.1.2) | 埋め込み bytes が receipt の `source_files` に現れているか、builder policy `compiled-esm-only` を保っているか |

## R2: candidate / oracle 対応

| 契約軸 | Candidate |
| --- | --- |
| origin 無しの部分成功・typed deny 表示・終了コード区別 | CANDIDATE-U-RCDEV-001 |
| origin 追加後の再実行の no-op safe | CANDIDATE-U-RCDEV-002 |
| setup 後の 5 経路の root 解決と fence 維持 | CANDIDATE-U-RCDEV-003 |
| commit 要件の表示 | CANDIDATE-U-RCDEV-004 / 005 |
| 埋め込みの provenance | CANDIDATE-U-RCDEV-006 |
| 展開と ignore | CANDIDATE-U-RCDEV-007 |
| adapter prompt の path 実在 | CANDIDATE-U-RCDEV-008 |
| 解決順 (consumer 同名優先・追加 merge) | CANDIDATE-U-RCDEV-009 |
| digest 照合による復元と書き込み 0 | CANDIDATE-U-RCDEV-010 |
| design root resolver と ENOENT 耐性 | CANDIDATE-U-RCDEV-011 / 012 / 013 |
| テンプレート書き出し (`--required` / `--optional`) | CANDIDATE-U-RCDEV-014 / 015 / 038 |
| 生成物 (db 初期化・harness-check・commitlint) | CANDIDATE-U-RCDEV-016 / 017 / 018 |
| テンプレートの slot 網羅と provenance | CANDIDATE-U-RCDEV-019 / 020 / 021 |
| テンプレート形式と skill / ガイドの移植 | CANDIDATE-U-RCDEV-022 / 023 |
| Python 非同梱と第 2 SSoT の禁止 | CANDIDATE-U-RCDEV-024 / 025 |
| gate 定義の埋め込みと G1〜G7 の consumer 判定 | CANDIDATE-U-RCDEV-026 / 027 / 028 |
| G8〜G14 の gate 別述語 (構造・ID・V-pair trace・evidence 型・全行・必須成果物・gate 固有) | CANDIDATE-U-RCDEV-029 (G8) / 030 (G9) / 031 (G10) / 032 (G11) / 033 (G12) / 034 (G13) / 035 (G14) |
| vmodel lint | CANDIDATE-U-RCDEV-036 |
| harness 自身の gate 回帰 (G1〜G10) | CANDIDATE-U-RCDEV-037 |

## R3: gap 分類と backfill

実装後に、次を gap として分類する。

- consumer 同名 skill の優先が injection path の乗っ取りに使える場合: 解決順の契約 (§3.1.1) を変えずに、表示や監査で
  可視化する手当てを本 PLAN 内で追加する (gap-only)。解決順そのものを変える必要が出たら本 PLAN の契約改訂へ戻る。
- compiled ESM が埋め込み以外の repo 内ファイル (vmodel catalog、gate 設計文書など) を実行時に読む場合: 本 PLAN の範囲外の
  runtime 依存であり、`PLAN-L7-531` の E2E で観測したうえで別 slice に起票する。本 PLAN で黙って埋め込み対象を増やさない。
- origin 以外からの identity create が必要と判明した場合: `PLAN-L7-529` の改訂であり、本 PLAN では扱わない。
- zip の Python 検査に TS gate で対応しないものが残った場合: 各 PR-G の PR 本文に「未移植」として列挙し、gate-design.md の判定内容の改訂が要るなら別 PLAN に起票する。
- harness 自身で G8〜G14 の結果が変わった場合: 判定規則 (§3.6-4) に沿った変化なら PR 本文に記録して受け入れ、規則外の変化なら本 PLAN の契約改訂へ戻る。

## R4: Forward 再合流条件

PR-1、PR-2a、PR-2b、PR-2c、PR-3、PR-T1〜PR-T3、PR-G0、PR-G7、PR-GR、PR-G9〜PR-G14、PR-VL (PLAN-L7-676 §4 のスケジュール全 slice) の実測と
非著者 review を同一 exact revision に束縛し、`PLAN-L6-101` へ不足差分だけを backfill する。
`PLAN-L7-531` は本 PLAN のコマンド群を E2E 観測項目として採用する改訂を別 PR で行う。

## Scope boundary

既存 gate (G1〜G7) の判定内容そのものの変更、テンプレートの新規書き起こし、license 切り替え (control lane の別 PR)、CI 上での installer 実行、
catalog / profile / gate 定義と design root の設定による上書き、update / rollback (#364) は本 Reverse の対象外。
G8〜G14 の gate 別述語の新設 (§3.6-4、CANDIDATE-U-RCDEV-029..035、Forward §3.6 が定める判定規則) は Forward 契約に含まれるため
本 Reverse の対象外にしない。
