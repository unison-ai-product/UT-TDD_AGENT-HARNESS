---
plan_id: PLAN-L7-413-distribution-export-integrity-defects
title: "PLAN-L7-413 (troubleshoot): distribution export の整合性欠陥 4 件 (PLAN-DISCOVERY-10 ベンチ発見・裏取り済)"
kind: troubleshoot
layer: L7
drive: be
status: confirmed
route_signal: incident
route_mode: incident
created: 2026-07-10
updated: 2026-07-10
owner: PM (Claude) / PO (人間)
backprop_decision: not_required
backprop_decision_reason: "既存 distribution 実装の欠陥修正 (fail-close 化・冪等化・staging 整合)。上位要求の意味変更はない。配布アーキテクチャ自体の再設計 (working tree → git archive 切替等) は本 PLAN の scope 外で、別途 design 判断に委ねる。"
agent_slots:
  - role: tl
    slot_label: "TL — 欠陥修正の境界レビュー (配布アーキ再設計との切り分け)"
  - role: se
    slot_label: "SE — fail-close 化 + regression test 実装"
  - role: aim
    slot_label: "AIM — troubleshoot 分類と配布アーキ再設計 (scope 外) への切り分けレビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-413-distribution-export-integrity-defects.md
    artifact_type: markdown_doc
  - artifact_path: src/cli/distribution.ts
    artifact_type: source_module
  - artifact_path: src/setup/distribution.ts
    artifact_type: source_module
  - artifact_path: tests/distribution-acceptance.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  references:
    - src/cli/distribution.ts
    - src/setup/distribution.ts
    - tests/distribution-acceptance.test.ts
    - docs/plans/PLAN-DISCOVERY-10-gpt56-tier-routing-bench.md
    - .ut-tdd/audit/A-172-pack-comprehensive-review-2026-07-02.md
    - docs/plans/PLAN-L7-157-distribution-clean-pull.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-10T15:51:00+09:00"
    tests_green_at: "2026-07-10T15:50:31+09:00"
    verdict: approve
    scope: "PLAN-L7-413 D-1〜D-4: manifest 冪等性、denylist fail-close、削除 staging、blocked export の package/prune 非実行、および unsigned tarball 契約整合。working tree 読取方式は変更していない。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T15:48:20+09:00"
        evidence_path: src/setup/distribution.ts
        output_digest: "sha256:7aa60c09a8fb635782c93a1fd83b09b47cfbd380db7a748c9f229d8ce3950918"
        anchor_commit: 487ccd318a7e27f56ea35764d6204f35300d91d4
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T15:48:30+09:00"
        evidence_path: src/cli/distribution.ts
        output_digest: "sha256:a80b4ee4655c91138c683121650faa6451b74ccd8cbaf8f45da5aeb65550f421"
        anchor_commit: 487ccd318a7e27f56ea35764d6204f35300d91d4
      - kind: unit_test
        command: "bun x vitest run tests/distribution-acceptance.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T15:50:31+09:00"
        evidence_path: tests/distribution-acceptance.test.ts
        output_digest: "sha256:378f52b4a3780d841556be86344f0257fba8574296fb8f4de3822f7256016b3e"
        anchor_commit: 487ccd318a7e27f56ea35764d6204f35300d91d4
---

# PLAN-L7-413 (troubleshoot): distribution export の整合性欠陥 4 件

## 背景

PLAN-DISCOVERY-10 (GPT-5.6 tier routing bench) の W1-D2 課題「Pack クリーン配布の
構造妥当性監査」を 5 モデル (gpt-5.6-sol / terra / gpt-5.5 / claude-opus-4-8 /
claude-fable-5) に実施した副産物として、現行コードの欠陥が独立発見・裏取りされた。
**複数モデルの独立一致** (D-1 は Terra と Fable、D-2 は Sol と Opus が互いに知らず同一
指摘) があり、全件 Claude (採点者) が実コードで裏取り済み。

## 欠陥 (裏取り済)

### D-1: sync-stage の自己中毒 (非冪等)

- 所在: `src/cli/distribution.ts` sync-stage — manifest (`.ut-tdd-pack-sync-manifest.json`)
  を outDir に書くが、`collectDistributionCandidatePaths` の除外は `.git`/`node_modules`/
  `dist` のみで、`unmanagedExistingPaths` 判定は plannedArtifacts と `.git/` しか除外しない。
- 帰結: **2 回目以降の実行が自分の書いた manifest を unmanaged 扱いして必ず ok=false**。
  運用者が blocked を無視する学習をし、真の unmanaged 検知が狼少年化する。
- 修正方針: manifest パスを unmanaged 判定から除外 (または manifest を outDir 外へ)。
- oracle: 同一 outDir へ sync-stage を 2 回連続実行し 2 回目も ok=true になる regression test。

### D-2: denylist 空洞化 (fail-close のつもりが silent exclude)

- 所在: `src/setup/distribution.ts` `buildCleanDistributionPlan` — `includedSourcePaths` が
  先に `!isDeniedCleanPath` で filter 済みのため、後段の
  `denylistViolations = artifactPaths.filter(isDeniedCleanPath)` は構造的にほぼ常に空
  (非空になり得るのは remap `docs/skills/→skills/` が denied 先へ写像する場合のみ)。
- 帰結: `ok` 条件の `denylistViolations.length === 0` が **恒真の見せかけ安全弁**。
  将来 filter が退行して denied path が混入しても blocked にならず公開される。
- 修正方針: violation 計算を filter **前** の normalized paths に対して行い、denied path の
  存在自体を fail-close にする (silent exclude をやめる) か、除外した denied path を
  excludedPaths と別枠で報告し ok 条件へ組み込む。
- oracle: denied path (例 `.ut-tdd/x`, `docs/plans/x.md`) を input paths に混ぜたとき
  ok=false かつ violation に列挙される regression test (現行実装では fail する = red 起点)。
- **訂正注記 (2026-07-10 followup)**: 上記修正方針の前段 (denied 入力の存在自体を fail) は
  **過剰 fail-close** だった — full repo walk には denied path (.ut-tdd/ 等) が常在し、
  `src/web/` は tracked .gitkeep を持つ意図的 carve-out のため、実 repo の plan が恒常
  blocked になる (PR #42 で実装され cli-surface 実 repo 回帰 5 件で検出、赤のままマージ
  してしまった運用ミスも同時発生)。確定形 = **出力ガード** (`artifactPaths` を deny で監視、
  include filter 退行・remap 衝突時のみ fire) + **構造 fence テスト** (denied 入力が
  artifactPaths に決して現れないことを固定)。oracle も同 followup で書換え済み。D-4 の
  blocked 誘発は denied 入力ではなく missingRequired で行う。

### D-3: 削除の非伝播 (Pack に消したはずのファイルが残留)

- 所在: `src/setup/distribution.ts` `gitAddPathspecCommands` — 現行 artifact のみ
  `git add -- <chunk>` を生成し、**削除された path を stage する手段が動線に無い**。
- 帰結: source で削除・deny 化したファイルが Pack の公開 commit に残り続ける
  (漏洩ファイルの除去が届かない)。`--prune-local` はローカル削除するが staged されない。
- 修正方針: `git add -A -- <pack root>` 相当か、削除 path の明示 `git rm` コマンド生成を
  nextCommands に追加 (非破壊不変条件との整合は TL レビューで判断)。
- oracle: 前回 artifact に在り今回 plan に無い path が nextCommands の staging に含まれる test。

### D-4: package / prune の ok 非ゲート + signature 恒偽

- 所在: `src/cli/distribution.ts` — (a) package の copy/tar/checksum が `secretScan.ok` のみで
  ゲートされ `exportPlan.ok=false` でも tarball 実物が生成される (出力 ok=false でも成果物が
  残り、拾われ得る)。(b) prune (`--prune-local`) が `exportPlan.ok` を見ずに削除を実行
  (`if (repoExists && opts.pruneLocal && secretScan.ok)`)。(c) `signatureRequired: true` /
  `signatureCreated: false` が恒値で、signed channel の署名をどのコードパスも生成・強制しない。
- 修正方針: (a)(b) は exportPlan.ok を前提ゲートに追加し、blocked 時は成果物を残さない
  (生成済みなら削除)。(c) は署名を実装するか、channel 宣言から signed を外して契約と実装を
  一致させる (どちらへ倒すかは PO 判断)。
- oracle: exportPlan.ok=false の入力で tarball 非生成 / prune 非実行を固定する test。

## Scope 外 (別判断へ)

- **working tree → `git archive <tag>` への読み取り元切替 + dirty fail-close** (Fable 提案の
  根因単一修正)。これは配布アーキテクチャの設計変更であり、A-172 以来の「非破壊不変条件 +
  clean artifact 同時成立」問題 (配布 no-go の核心) と一体で design 判断すべき。本 PLAN は
  現行アーキ内の fail-close 欠陥修正に限定する。
- skills/ と docs/skills/ の remap 衝突 shadowing (構造妥当だが未実証、要追加調査)。

## DoD

- [x] D-1〜D-4 それぞれに red→green の regression test が付き、修正が landed (PR #42 +
      D-2 意味論訂正 followup PR #43。D-2 の確定 oracle は「denied 入力が出荷されない」構造 fence)。
- [x] 修正は現行配布アーキの範囲内 (読み取り元切替を含まない) であることを TL が確認
      (Claude cross-review、PR #42/#43)。
- [x] review_evidence に green_commands (targeted vitest + typecheck + lint) を記録。
