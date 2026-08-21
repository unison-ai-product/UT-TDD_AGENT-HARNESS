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
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/236
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

**Phase 2 = 案 A、ただし warn-only から昇格させる。** 昇格条件を凍結する (非著者 FLAG B-2)。

当初は「計測後」「通常運用では恒常的には出ない」としか書いておらず、観測期間・計測先・判断期限・
起票責任者・昇格判定のいずれも未定義だった。これでは**本事故と同じ人依存の advisory が恒久化できる**。
以下を契約として固定する。

| 項目 | 凍結値 |
|---|---|
| 観測期間 | Phase 1 着地後の **暦 14 日** |
| 計測 sink | `.ut-tdd/logs/session/` の既存 jsonl (新しい sink を建てない) |
| 計測 schema | `{ event: "memory_sync_backlog", unshared_count: number, oldest_age_days: number, at: string }` |
| 判断期限 | 観測期間の満了日。**期限到来そのものが判断イベント**であり、誰かが気付くことを条件にしない |
| 起票責任者 | 本 PLAN の owner (PO / Claude)。期限日に後続 PLAN を起票する |
| 昇格判定 | 観測窓の **`unshared_count > 0` のセッション比率が 20% 未満**なら Phase 2 へ進む。20% 以上なら「通常運用で恒常的に出る」ということなので、fail-close ではなく**書き手側の運用 (memory add 後の commit 導線)** を先に直す |

**Phase 1 は pre-push を実装しない**ので、「warn-only から昇格」の遷移元は Phase 1 には存在しない。
Phase 2 の内部を 2 段に分ける: **Phase 2a = pre-push warn-only の新設**、**Phase 2b = fail-close へ昇格**。
2a と 2b の間にも上表と同じ観測窓を置く。Phase 1 に pre-push を含めない理由は、Stop summary だけで
未配送が可視化されるかを先に測るためであり、可視化で足りるなら 2a 自体が不要になりうる。

**案 C は併走で拾う。ただし当初案は成立しないので訂正する (非著者 FLAG B-1)。**

当初は「CI 出力を `skipped: local working-tree state unavailable` へ改める」と書いたが、
**これは現行の判定入力から導出できない**。fresh checkout で `git ls-files --others --exclude-standard` は
**入力不在ではなく正常に空を返す**ため、検出器から見ると「未配送 0 件のローカル実行」と
区別が付かない。区別を検出器へ持ち込めば §1 の「判定契約は変更しない」に反する。

訂正後の契約: **区別は検出層ではなく報告層で行い、信頼入力を明示的に注入する。**

| 層 | 変更 |
|---|---|
| 検出層 (`loadMemorySyncInput` / memory-sync 判定) | **変更しない**。従来どおり未追跡集合を返す |
| 報告層 (doctor の出力文言) | 実行文脈を受け取り、CI 文脈では `OK` を名乗らない |

信頼入力は `.github/workflows/harness-check.yml` が設定する **`UT_TDD_MEMORY_SYNC_CONTEXT=ci`**
とする。GitHub Actions の `GITHUB_ACTIONS` を暗黙に読むのではなく、**workflow が明示的に注入する**
形にする (誰がどこで注入するかを契約に固定するため。暗黙の環境依存にしない)。

- 注入あり (`ci`) → `memory-sync — skipped: 未追跡入力は fresh checkout に存在しないため判定不能`
- 注入なし (ローカル) → 従来どおり `OK` / violation

この env は **表示ラベルの分岐にのみ使い、gate の合否には使わない**。欠落したらローカル扱いへ
fail-open する (表示が保守的になるだけで、検出は従来どおり動く)。gate 判定に env を持ち込むと
env を消すだけで gate を無効化できてしまうため、その面には触れない。

**案 D は refuted。** hybrid では foreign branch に対して commit できない場面が常時あり、
`memory add` が commit まで行うと、そこで詰まったときに「メモリを退避・削除する」か
「hook を迂回する」しか逃げ道が無くなる。同じ理由で「Phase 1 を飛ばして即 fail-close」も採らない。
これは CLAUDE.md §Hybrid 多ランタイム commit 協調 の commit 規律と正面衝突する。

### issue #236 との境界 (freeze、非著者 FLAG B-3)

issue #236 の検出項目 `unshared_canonical` は、共有正本ディレクトリ配下の未追跡ファイルを
件数と最古滞留日数つきで advisory surface するもので、`.ut-tdd/memory/` を含む。**本 PLAN の
Phase 1 と同一判定である。** 両方を実装すると detector が 2 本になり閾値 drift の源になる。

**凍結する境界: detector は `memory-sync` ただ 1 本とし、#236 はそれを再利用する。**

- `memory-sync` の判定関数は **対象ディレクトリ集合を入力に取る**形へ一般化する。既定は
  `.ut-tdd/memory/` のみ。
- #236 が `unshared_canonical` を実装するとき、**新しい detector を建てず**、この関数へ
  `docs/` `src/` `tests/` `scripts/` `skills/` `.ut-tdd/review/` を足した集合を渡す。
- 閾値と出力書式も `memory-sync` 側が正本とし、#236 は surface (どこに出すか) だけを足す。

逆向き (#236 が新 detector を建て、`memory-sync` がそれを呼ぶ) を採らない理由は、
`memory-sync` が既に hard gate として稼働しており実績があるためである。稼働中の gate を
未実装の機構へ従属させると、#236 が止まった時点で既存 gate も止まる。

**本 PLAN の Phase 1 は #236 の最初の bounded slice**である。`.ut-tdd/memory/` を先に切り出す
根拠は、**実害が実測されている唯一のディレクトリ**だから (2 週間 65 件 → 128 件まで滞留、
回収は PR #372)。他の共有正本ディレクトリでの滞留は未計測であり、「未計測のまま機構を建てない」
規律に従って対象へ含めない。

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
5. `UT_TDD_MEMORY_SYNC_CONTEXT=ci` が注入された実行で、`memory-sync` 出力が `OK` を名乗らず判定不能である旨を表示する。注入が無い実行では従来どおりの出力を保つ (回帰で両面を実測する)。検出層 (`loadMemorySyncInput`) の差分は 0 であることをテストで固定する。
6. 上記 1〜5 が、`.ut-tdd/memory` を fixture として持つ回帰テストで実測される
   (prose の claim で代替しない)。

Phase 2 は本 PLAN のスコープ外とし、Phase 1 の計測結果を添えて後続 PLAN で起票する。

## 4. 未達 / 持ち越し

- **`loadMemoryCorpus` の findings が非空であることを surface する経路が無い** (issue #242 の副次欠陥)。
  schema 外 `kind` を持つ手書きメモリが黙って読み飛ばされていた実例がある。本 PLAN では扱わず、
  Phase 2 の起票時に同時に判断する。
- 未配送の閾値 (何件・何日で fail-close にするか) は Phase 1 の計測前に決めない。
