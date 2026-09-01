---
plan_id: PLAN-L7-528-pack-authoring-template-scope
title: "PLAN-L7-528 (add-impl): Pack authoring template scope pair-freeze"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-09-01
updated: 2026-09-01
owner: Codex / Luna
worker_model: gpt-5.6-luna
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
pair_artifact: docs/test-design/harness/L7-pack-authoring-template-scope-test-design.md
next_pair_freeze: L7
transition_direction: design_to_implementation
implementation_disposition: none
github_issue_id: 482
agent_slots:
  - role: se
    slot_label: "SE - clean Pack authoring template inventory and materializer projectionを実装する"
  - role: qa
    slot_label: "QA - clean plan / materializer / tar / Pack-only smokeと単軸mutationを実測する"
  - role: tl
    slot_label: "TL - source-only / runtime-state / path / toolchain境界を非著者検収する"
generates:
  - artifact_path: docs/plans/PLAN-L7-528-pack-authoring-template-scope.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-pack-authoring-template-scope-test-design.md
    artifact_type: test_design
  - artifact_path: src/setup/authoring-template-inventory.ts
    artifact_type: source_module
  - artifact_path: src/setup/pack-authoring-smoke.ts
    artifact_type: source_module
  - artifact_path: tests/pack-authoring-template-scope.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
  requires:
    - PLAN-L6-101-pack-independent-multi-consumer-acceptance
  blocks:
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418
  references:
    - docs/plans/PLAN-REVERSE-528-pack-authoring-template-scope-backfill.md
    - docs/plans/PLAN-L7-157-distribution-clean-pull.md
    - docs/plans/PLAN-L7-190-distribution-runtime-asset-projection.md
    - docs/plans/PLAN-L7-232-sync-pack-clean-tree-guard.md
    - docs/plans/PLAN-L7-496-pack-independent-consumer-runtime.md
    - docs/design/harness/L6-function-design/setup-solo-team.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/setup/distribution.ts
    - src/setup/release-materializer.ts
    - src/setup/pack-publication-assets.ts
    - src/schema/team.ts
    - tests/distribution-acceptance.test.ts
    - tests/distribution-scratch-ignore.test.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/482
review_evidence: []
backprop_decision: required
backprop_decision_reason: "Pack-only authoring assetsのallowlistとsource/runtime deny境界をL6-101のconsumer独立受入へReverseで戻す。"
---

# PLAN-L7-528: Pack authoring template scope pair-freeze

## 1. 目的と位置付け

Issue #482 の bounded slice として、clean Pack から source repository なしで PLAN、L6 design、
V-model state、effort prompt、team definition の authoring を開始できる配布範囲を凍結する。
team definition は Issue #482 の scope-audit で追加された一件の再利用可能な sample として含める。
本書は実装前の契約であり、`src/setup/distribution.ts`、materializer、tar writer、Pack repository、
version、publication、runtime の変更や test code の追加を行わない。

`PLAN-L7-166-setup-template-catalog-split` は変更しない。同 PLAN は setup template catalog の
module split を所有し、本 slice は clean distribution の出荷集合だけを所有する。

## 2. 基準点と worker 固定

契約の入力 source revision は `3cc0cffd`（current main）に固定する。worker は
`worker_model=gpt-5.6-luna` とし、実装開始時にこの PLAN の pair artifact と同じ exact revisionへ
再束縛する。pair-freeze は implementation、Green、publication、canary 完了を主張しない。

PLAN ID は `docs/plans/` 全体と repository text を走査し、候補
`PLAN-L7-519-pack-authoring-template-scope` が既存 `PLAN-L7-519-pack-publication-adapter` と
衝突することを確認したため採用しない。未使用の `PLAN-L7-528-pack-authoring-template-scope` を
本 slice の ID とする。

## 3. 単一 inventory source

後続実装は `AUTHORING_TEMPLATE_INVENTORY` 相当の**一つの inventory**を正本とし、allow prefix、
required artifact、source-to-artifact projection、materializer/tar の検証対象を別々に再記述しない。
次表の source は `git ls-files` で収集し、artifact path は表の値だけを出力する。

| family | source inventory | Pack artifact | required |
| --- | --- | --- | --- |
| PLAN | `docs/templates/plan/**` | 同じ `docs/templates/plan/**` | `design/template.md`, `impl/template.md` |
| design | `docs/templates/design/**` | 同じ `docs/templates/design/**` | `L6-function-spec-template.md` |
| state | `docs/templates/state/**` | 同じ `docs/templates/state/**` | `vmodel.json` |
| prompt | `docs/templates/prompts/**` | 同じ `docs/templates/prompts/**` | `effort-classify.md` |
| team projection (explicit) | `.ut-tdd/teams/example-review-team.yaml` | `docs/templates/team/example-review-team.yaml` | 1 file |

`docs/templates/plan/**`、`docs/templates/design/**`、`docs/templates/state/**`、
`docs/templates/prompts/**` は明示した family prefix のみを許可する。team は
`.ut-tdd/**` の例外 allow ではなく、上記一件の明示的 projection として扱う。`.ut-tdd/teams/.gitkeep`
は artifact ではない。

### 3.1 明示 projection の境界

team sample を残す判断は `DD-PACKTPL-001` として固定する。これは `.ut-tdd/**` を clean Pack の
allowlist に追加する判断ではなく、選択 revision の Git blob 一件を配布用 template へ変換する
read-only input adapter である。後続実装は次の順序と不変条件を満たす。

1. inventory の当該 entry に記載した source path を、選択 revision の `git ls-files` と blob から
   exact に解決する。作業ツリー、別 worktree、DB、Memory、環境変数から補完しない。
2. source blob が存在し、通常ファイルで、entry の一意な source と一致することを確認してから、
   `docs/templates/team/example-review-team.yaml` へ bytes を read-only projection する。
3. projection を解決した後に、通常の clean path allow/deny 検査を**出力 artifact path**へ適用する。
   `.ut-tdd/teams/example-review-team.yaml` は input として記録されるが、artifact set、manifest、tar、
   Pack tree には一切現れてはならない。
4. source の欠落、複数候補、symlink／path escape、destination の重複、bytes または mode の変化は
   typed deny とし、暗黙の別 source fallback や `.ut-tdd/**` wildcard を認めない。

この順序を契約に含めることで、runtime-state deny と一件の再利用 sample projection を同時に成立させる。
任意の team 定義、追加の `.ut-tdd` state、team catalog の移行は本 slice 外の後続 Issue とする。

既存の curated skills はこの inventory に吸収しない。現行 `skills/**`（`SKILL_MAP.md`、
`review-checklist.yaml`、curated skill documents を含む 81 tracked files）は既存の clean Pack
対象として保持し、今回の変更で追加・再命名・別 root への写像をしない。

## 4. 出荷経路の契約

同じ inventory 集合を次の全てで検査する。

1. **clean plan**: `buildCleanDistributionPlan(git ls-files)` は required 6 artifactを各 exactly once
   出力し、明示 projection の source path を artifact として出力せず、source-only と denied output を
   除外する。inventory entry の欠落・重複・unknown extra は `ok=false` とする。
2. **materializer**: `distribution sync-stage --json` と
   `materializeReleaseArtifacts` は source path と artifact path の対応を一つの inventory から
   解決する。materialized path、mode、UTF-8 bytes、LF を検証し、source checkout / local Pack
   checkout / runtime state から補完しない。
3. **tar**: `buildPackPublicationAssets` / `derivePackPublicationAssets` の deterministic tar
   manifest は materialized artifact setと同一の path・mode・size・content digest を持つ。tar/gzip/
   checksum の再計算値が一致し、required artifactを別名・重複 entry・暗黙補完で表現しない。
4. **Pack-only authoring smoke**: clean Packを一時 consumerへ展開し、source repository、source
   worktree、local Pack checkout を除去した後も、PLAN/design/state/promptを読み、team projectionを
   `teamDefinitionSchema` で parse できることを確認する。生成した starter は consumer側 bytesだけで
   利用でき、publication や version 更新は実行しない。

## 5. deny 契約

最終 artifact set と materialized/tar/Pack tree の全てで、次を fail-close する。

- source-only: `docs/plans/**`、`docs/design/harness/**`、`docs/test-design/**`、および既存 policy が
  denyする audit-only governance。clean Pack baselineで許可済みの canonical governanceは変更せず、
  新しい authoring template familyを理由に source tree 全体を許可しない。
- runtime state: `.ut-tdd/**` は deny。許可されるのは inventory に記載した一件の team sourceを
  選択 revision の blobから `docs/templates/team/example-review-team.yaml` へ投影する read-only
  mappingだけで、`.ut-tdd` の path自体は出荷しない。source解決前の deny filterを理由に mappingを
  省略せず、mapping以外の `.ut-tdd` path は全て拒否する。
- personal/source path: personal absolute path、home/Temp/OneDrive、source checkout、local Pack
  checkout、`~`、`$HOME`、`%APPDATA%` 等の path を content・manifest・commandへ到達させない。
- Bun: `bun` / `bunx`、Bun shebang、Bun install/setup/action、Bun実行 command を authoring asset、
  manifest、Pack smokeの実行経路に許可しない。既存 source rollback build の責務は本 slice外である。
- legacy-HELIX: legacy HELIX runtime command、environment prefix、`pmo-helix-*`、source-derived
  runtime path を許可しない。vmodel metadataの歴史的参照文字列だけを実行経路と誤認して許可判定を
  弱めない。

deny は input sourceを理由なく全件 violationにするのではなく、最終 artifact setへの到達を検査する。
projection sourceは出力へ到達しないため、`.ut-tdd/**` denyと team projectionを同時に成立させる。

## 6. paired test design と mutation oracle

対の test design は `docs/test-design/harness/L7-pack-authoring-template-scope-test-design.md` とする。
実装 PR は同 doc の `CANDIDATE-PACKTPL-*` を独立 testへ昇格し、inventory entryを省略したまま
Greenと主張しない。familyごとの削除、全体過剰許可、source/runtime/path/toolchain denyの各軸は
一度に一つだけ変異させ、期待 finding、artifact set、tar manifest、Pack smoke結果を直接照合する。

## 7. 受入条件 / 非スコープ

- [ ] 本 PLAN と paired test design が同じ contract、inventory、deny、worker revisionを参照する。
- [ ] clean plan、materializer、tar、Pack-only smoke が同一 inventory を検査し、明示 projection の
      source解決→output deny検査順を共有する設計になっている。
- [ ] skills既存集合を保持し、source-only / `.ut-tdd/**` / personal path / Bun / legacy-HELIX の denyを
      各々独立 mutationで検出できる。
- [ ] Reverse R0/backfill linkを宣言し、L6-101へ戻す差分だけを後続R4の候補として残す。
- [ ] 実装、test code、distribution publication、Pack remote mutation、version変更、#418 canaryは
      本 PLAN の完了条件に含めない。

### 7.1 Scope decision record

- `DD-PACKTPL-001` (2026-09-01): #482 の scope-audit comment で要求された再利用 team sample を、
  任意の runtime state 配布ではなく上記一件の explicit projection として含める。受入条件は required
  6 artifact、projection bytes／schema／identity、source path 非出力を含む。
- この decision は設計契約の追加であり、実装 PRで新たな projection方式を発明することを許可しない。
  後続実装は §3.1 の固定 map と fail-close 条件だけを実装する。任意 team catalog は別 Issue へ送る。
- advisor 合意形成: `claude-fable-5` / effort `low` / decision `design` を
  `2026-09-01T10:32:35Z` に実行し、session log
  `.ut-tdd/logs/session/advisor-claude-1788258711530.jsonl` へ記録した。案A（`.ut-tdd/**`
  全体 allow）は blast radius が大きいため却下、案B（選択 revision の tracked blob 一件を
  固定 destination へ投影）を推奨し、pinned blob、明示列挙、source解決→output deny、content
  scan、HEAD drift検知を条件とした。本 PLAN は既存の #482 要求と runtime source ownershipを
  保持するため案Bを採用し、drift warning と任意 catalog は後続実装へ送る。
- 採用 revision `3cc0cffd` の blob `0c5e267a46b97699bd5ce7956eba41b3b6138fbf` を実測し、
  mode `100644`、UTF-8 bytes `977`、secret-like／Windows・POSIX personal path／OneDrive／Bun／
  legacy-HELIX／email marker は全て検出 0。実装側は同じ content precondition を fail-close で再検証する。

用語更新なし。機能要求更新なし。
