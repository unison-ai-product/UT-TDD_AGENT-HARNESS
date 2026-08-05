---
plan_id: PLAN-L7-474-worktree-topology-detector
title: "PLAN-L7-474 (add-impl): worktree topology 健全性・寿命検出の契約 freeze"
kind: add-impl
layer: L7
drive: be
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-05
updated: 2026-08-05
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - freeze済み facts collector / 純粋 analyzer / doctor advisory 契約を実装する"
  - role: qa
    slot_label: "QA - CANDIDATE-WTTOPO-001〜018 の実装テストと fail-safe 境界を検証する"
  - role: tl
    slot_label: "TL - advisory境界と移設acceptance oracleの独立レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-474-worktree-topology-detector.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-222-doctor-runtime-surface-extraction.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L4-34-repository-runtime-placement-topology.md
    - docs/plans/PLAN-REVERSE-474-worktree-topology-detector-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/232
review_evidence: []
---

# PLAN-L7-474: worktree topology 健全性・寿命検出の契約 freeze

## 目的

Issue #232 の worktree link 健全性と終了判定を、配置移設
(`PLAN-L4-34-repository-runtime-placement-topology`) の前後比較に使える
**advisory の acceptance oracle** として設計固定する。

本PRは pair-freeze だけである。collector、analyzer、doctor配線、テストコード、実行結果は
まだ出荷物として宣言しない。後続の add-impl PR が本PLANを確認済みにし、そのとき初めて
実装出荷物を `generates` へ追加する。

## 固定する契約

1. 実装は Git I/O を行う薄い facts collector と、facts だけを入力にする純粋 analyzer を分離する。
   同じ入力集合は入力順にかかわらず同じ findings、counts、retirable を返す。
2. link は worktree→admin と admin→worktree の両方向を検査する。worktree `.git` の
   gitdir 参照不整合、admin back pointer 不整合は `link_broken` とする。登録された
   worktree directory 不在は `dir_missing`、未登録admin entryは `orphan_admin` とする。
3. liveness は排他的に `dirty > detached > merged > active` で分類する。
   `dirty` は他条件に優先し、main worktree は liveness/retirable から除外する。
4. `retirable` は finding の無い clean `merged`、または clean `detached` かつそのHEADが
   main以外を含む保持対象refから到達可能と証明できるものだけである。固有commitまたは
   到達可能性を観測できないdetached worktreeはreview-requiredとして除外する。
   link/dir の観測不能面は `dirty=false` 等の既定値を信用せず retirable から除外する。
   保持対象refは `refs/heads/*`、`refs/remotes/origin/*`、`refs/tags/*` の明示allowlistだけとする。
   `refs/pull/*`、`refs/stash`、reflog、他remote-tracking namespaceは保持根拠にしない。ref列挙・
   reachability判定失敗もreview-requiredへ倒す。
5. 診断は doctor の advisory surface に置き、hard gate / CI成功判定を変更しない。
   worktree が無いCI環境は empty facts として診断を出さない。
6. `healthy` は link/dir finding の無い登録 worktree の件数に加え、normalized worktree path、
   admin path、HEAD、main/non-main属性のstable identity集合とそのcanonical digestを返す。
   配置移設のacceptanceは件数一致ではなく、許可されたpath remapを適用したidentity集合一致と
   findings 0を要求する。同数の別worktreeへの置換を成功扱いしない。main worktreeもfindingが
   無ければ`healthy`とidentity集合へ含め、`mainCount=1`とする。ただしliveness/retirableには含めない。
7. collectorはGitのporcelain出力と`.git`/admin pathをtyped factsへ変換し、parse不能・相対pathの
   root外解決・Git command失敗を正常値へ丸めず観測不能findingへ変換する。doctor consumerは
   empty factsでno-op、findingがあってもadvisoryのままとしhard-gate結果を変更しない。
8. format version 1を次で固定する。
   - `TopologyFinding`は`kind = link_broken | dir_missing | orphan_admin | collector_parse_error |
     collector_command_error | path_escape | reachability_unavailable`、必須fieldは`operation`、`evidenceCode`、
     関係する場合の`worktreePathKey`/`adminPathKey`。生command/stdout/secretはevidenceへ入れない。
   - `TopologyIdentity`は`{worktreePathKey, adminPathKey, headOid, isMain}`。path keyは
     `realpath.native`相当でreparse/symlinkを解決した絶対path、separatorを`/`へ統一、末尾separatorを
     root以外で除去し、Windowsはdrive letterだけuppercase化する。存在せずrealpath不能ならidentityを
     作らずfindingへ倒す。path全体をcase-foldしない。
   - identityは`worktreePathKey`、`adminPathKey`、`headOid`、`isMain(0|1)`のUTF-8 byte昇順でsortし、
     各fieldを`uint32be(byteLength)||rawBytes`でframeして連結し、`topology-v1:`を先頭に加えた
     SHA-256 lowercase hexをdigestとする。
   - `AllowedPathRemap`はversion 1の`[{fromPrefix,toPrefix}]`。canonical path境界のprefixだけに適用し、
     longest-prefix優先、同一from・重複from・変換後collision・root外escapeを拒否する。worktree/admin
     両pathへ同じ規則を適用し、identity比較前だけに使う。

## 設計と検証の対

oracle の正本は `docs/test-design/harness/L7-unit-test-design.md` の
`CANDIDATE-WTTOPO-001`〜`018` である。これは #234 の実装候補から抽出して契約化したものであり、
本PRでは test code の存在・green・実リポジトリの計測値を主張しない。
後続の実装PRは各candidateとテストcitationを同じcommitで追加し、その時点でのみ
対応する確定 `U-*` IDへ原子的に昇格する。

## スコープ外

- worktree の削除、回収、`git worktree prune` 実行。
- 配置移設そのものと、移設の完了判定。
- doctor advisory を required check / fail-close へ変えること。

## 後続の実装受入条件

- AC-1: `CANDIDATE-WTTOPO-001`〜`018` をテストコードで実装し、同じcommitで
  対応する確定 `U-*` IDへ昇格して全件を検証する。
- AC-2: facts collector と純粋 analyzer のI/O境界、双方向link検査、fail-safe retirable除外を
  非author familyがレビューする。
- AC-3: doctorへのadvisory配線が hard gate / CIの成功判定を変えないことを実測で示す。
- AC-4: `PLAN-REVERSE-474` の R0〜R4 を完了し、L4/L6への必要最小限の合流を判定する。
- AC-5: detached固有commitをretirableへ入れず、移設前後はidentity集合で照合する。
- AC-6: finding/identity/digest/remap format v1をbyte-level oracleで実装し、Windows path差を
  暗黙case-foldやseparator差で吸収しない。

## Schedule

1. [完了] 設計と L7 oracle を pair-freeze する。
2. [直列] 別 add-impl PR で collector / analyzer / doctor advisory / テストを実装する。
3. [直列] Reverse R0〜R4、cross-review、trace-freeze を実施して確認する。
