---
plan_id: PLAN-RECOVERY-21-memory-sync-local-surface
title: "PLAN-RECOVERY-21 (recovery): memory-sync を人が見る経路へ出す (issue #242 機構側)"
kind: recovery
layer: cross
drive: be
status: draft
route_signal: regression_dev
route_mode: recovery
created: 2026-08-21
updated: 2026-08-21
owner: PO / Claude
github_issue_id: 242
parent_design: docs/plans/PLAN-L7-189-shared-harness-memory-cross-runtime.md
backprop_decision: not_required
backprop_decision_reason: "memory-sync gate の判定契約 (未追跡の .ut-tdd/memory エントリを未配送として検出する) は一切変更しない。既存判定の出力先を、原理的に入力が存在しない CI から、入力が実在するローカルの入口へ増やすだけである。要求 / 設計 / テスト設計の契約面を動かさないため上流 backprop 対象が無い。"
agent_slots:
  - role: aim
    slot_label: "AIM - 『どこで surface するか』の境界確定 (fail-close 化の前提となる計測条件を含む)"
  - role: qa
    slot_label: "QA - advisory 表示 / 計測 / CI 出力の skipped 表記の回帰"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-21-memory-sync-local-surface.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-189-shared-harness-memory-cross-runtime.md
  requires: []
  blocks: []
  references:
    - src/lint/memory-sync.ts
    - src/doctor/source-trace.ts
    - docs/plans/PLAN-L6-97-memory-episode-retirement-contract.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/242
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-RECOVERY-21: memory-sync を人が見る経路へ出す

## 1. 事故と真因

`.ut-tdd/memory` の未配送 (未追跡のまま滞留) が 2 週間・65 件気付かれなかった (issue #242)。
その後の実測で、滞留はさらに大きく **128 件**まで積み上がっていた (回収は PR #372)。

真因は検出能力ではなく**発火可能性**である。

| | 未追跡ファイルの存在 | `memory-sync` の発火 |
|---|---|---|
| CI (`harness-check`) | **構造的に存在しない** (fresh checkout) | **原理的に発火しない** |
| ローカル full doctor | 存在する | 発火する |

`loadMemorySyncInput` は `git ls-files --others --exclude-standard` を入力にする。fresh checkout に
untracked は無いので、CI では常に 0 件 = 常に green。**「gate がある」ことと「gate が実際に人の目に
触れる経路で走る」ことは別**であり、本件は後者が欠けていた。

これは issue #227 (publish 成功 ≠ 配送) と同型の fail-open ファミリである。

### 本 PLAN が保つ不変条件

- **`memory-sync` の判定契約は変更しない。** 何を未配送とみなすかの定義に手を入れない。
- **full doctor を「毎回回せ」という規律で解かない。** 規律で解こうとして 2 週間漏れたのが本件である。
- **新規機構を建てない。** 既存の Stop summary / CI 出力へ 1 経路ずつ足すに留める。
- **計測なしに fail-close 化しない。** 未計測のままゲート化しない (CLAUDE.md の既存規律)。

## 2. 設計判断 (freeze)

方式選択に trade-off が実在するため、着手前に `ut-tdd advisor` で合意形成した。以下を freeze する。

### 検討した案

| 案 | 内容 | 判定 |
|---|---|---|
| A | pre-push hook で未配送があれば **fail-close** | **段階的に採択 (Phase 2)** |
| B | Stop summary に advisory 表示 + 件数を計測 | **採択 (Phase 1)** |
| C | CI 出力の文言訂正 | **採択 (併走)** |
| D | `ut-tdd memory add` が commit まで行う | **refuted** |

### 採択と理由

**Phase 1 = 案 B。** セッション終了時は「書いたのに送っていない」に最も近いタイミングであり、
ローカルにしか存在しない情報をローカルの出口で出すのが素直である。同時に、未配送件数と最古 age を
記録して **Phase 2 の閾値設計の入力**にする。この時点では advisory (fail-open) とし、作業を止めない。

**Phase 2 = 案 A、ただし warn-only から昇格させる。** Phase 1 の計測で「通常運用では未配送が
恒常的には出ない」ことが確認できてから fail-close へ上げる。いきなり fail-close にすると、
初日から全 push が止まる可能性を計測なしに引き受けることになる。

**案 C は併走で拾う。** 現在の CI は入力が原理的に存在しない状態で `memory-sync OK` と表示しており、
**gate が通ったことを配送の証拠と読める出力になっている**。これは本 issue の真因そのものが
出力面に現れたものなので、`skipped: local working-tree state unavailable` に相当する表記へ改める。
検出ロジックは触らない。

**案 D は refuted。** hybrid では foreign branch に対して commit できない場面が常時あり、
`memory add` が commit まで行うと、そこで詰まったときに「メモリを退避・削除する」か
「hook を迂回する」しか逃げ道が無くなる。同じ理由で「Phase 1 を飛ばして即 fail-close」も採らない。
これは CLAUDE.md §Hybrid 多ランタイム commit 協調 の commit 規律と正面衝突する。

### 相談記録

- advisor: `--decision progress` (`claude-fable-5` 一次)。
- override なし (推奨をそのまま採択)。
- 本 PLAN 起票時点で実装は着手していない (pair-freeze を先に閉じる)。

## 3. 受入条件

Phase 1 (本 PLAN のスコープ):

1. セッション終了時、未配送の `.ut-tdd/memory` エントリが 1 件以上あれば件数と最古 age が表示される。
2. 表示は advisory であり、**セッションを失敗させない** (fail-open)。
3. 未配送 0 件のときは何も出さない (常時ノイズにしない)。
4. 件数と最古 age が計測として残り、Phase 2 の閾値設計に使える。
5. CI の `memory-sync` 出力が `OK` を名乗らず、入力不在による skip であることを表示する。
6. 上記 1〜5 が、`.ut-tdd/memory` を fixture として持つ回帰テストで実測される
   (prose の claim で代替しない)。

Phase 2 は本 PLAN のスコープ外とし、Phase 1 の計測結果を添えて後続 PLAN で起票する。

## 4. 未達 / 持ち越し

- **`loadMemoryCorpus` の findings が非空であることを surface する経路が無い** (issue #242 の副次欠陥)。
  schema 外 `kind` を持つ手書きメモリが黙って読み飛ばされていた実例がある。本 PLAN では扱わず、
  Phase 2 の起票時に同時に判断する。
- 未配送の閾値 (何件・何日で fail-close にするか) は Phase 1 の計測前に決めない。
