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
| 判断期限 | 観測期間の満了日。**Phase 1 の Stop summary 自身が期限を評価し、経過後は「観測窓が満了した。Phase 2 判断 PLAN を起票せよ」を表示する** (下記「期限を機械で発火させる」) |
| 起票責任者 | 本 PLAN の owner (PO / Claude)。期限日に後続 PLAN を起票する |
| 昇格判定 | **本 PLAN では閾値を凍結しない** (下記「閾値を今決めない理由」)。期限到来時に観測分布を添えた後続 PLAN を起票し、そこで閾値と昇格可否を決める |

#### 閾値を今決めない理由 (非著者 FLAG B-2 の再是正)

前版は昇格境界を「セッション比率 20% 未満」と凍結したが、これは誤りだった。**実測根拠・リスク
根拠・母数下限のいずれも無く**、19% と 20% で fail-close 可否が反転する根拠が無い。少数セッション
窓では偶然値で方式が決まる。

さらに本 PLAN 自身が「Phase 1 の計測を **Phase 2 の閾値設計の入力**にする」と書いている。
**入力を得る前に出力 (閾値) を凍結する**のは自己矛盾であり、計測を形式化するだけで実質的には
決め打ちになる。これは本 PLAN が批判している「gate の形式だけ満たす」型そのものである。

したがって凍結するのは**閾値ではなく決定手続き**とする:

1. 期限到来時、観測窓の `unshared_count` / `oldest_age_days` の**分布**を集計する。
2. その分布を証跡として添えた後続 PLAN を起票する。
3. 閾値と昇格可否 (Phase 2a へ進む / 書き手側の運用を先に直す / Phase 1 のまま据え置く) は
   **その PLAN の設計判断節で、実測を根拠に決める**。
4. 本 PLAN は「期限に必ず判断が起票される」ことだけを保証し、判断の中身を先取りしない。

#### 期限を機械で発火させる (非著者 FLAG B-3 系の指摘)

前版は「期限到来そのものが判断イベントであり、誰かが気付くことを条件にしない」と書いたが、
**それを発火させる経路を契約に持っていなかった**。scheduler も CLI check も workflow も無く、
実態は「人が暦を見る」ままだった。本 issue の真因 (規律で解こうとして 2 週間漏れた) の再生産である。

新しい機構は建てない。**Phase 1 が実装する Stop summary の advisory 自身に期限評価を含める**:

- 観測窓の開始日を Phase 1 着地時に記録する。
- 毎回のセッション終了時、Stop summary が現在日と窓満了日を比較する。
- 満了前: 未配送件数と最古 age に加えて「観測窓 残り N 日」を表示する。
- 満了後: **未配送が 0 件でも**「観測窓が満了した。Phase 2 判断 PLAN を起票せよ」を表示し続ける。

未配送 0 件でも表示し続けるのが要点である。「未配送が出たときだけ何か表示される」設計だと、
静かな窓ほど期限が見えなくなる。

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

### issue #236 との境界 (freeze、非著者 FLAG B-3 の再是正)

**前版の「同一判定である」は誤りだった。実測すると意味論が違う。**

| | 判定 | 結果 |
|---|---|---|
| 現行 `memory-sync` (`src/lint/memory-sync.ts`) | `untracked` / `uncommitted-change` | **hard violation** (`ok=false`) |
| 同 | `not-on-origin` | warning |
| #236 `unshared_canonical` | 未追跡かつ非 ignored かつ**滞留日数が閾値超過** | **advisory のみ** |

前版はこの差を見ずに「detector を `memory-sync` 1 本に統合し、対象ディレクトリ集合を入力に取る形へ
一般化する」と書いた。**そのまま `docs/` `src/` `tests/` へ一般化すると、通常の tracked 編集
(`uncommitted-change`) まで hard violation になる。** 作業中の編集が常に gate を落とすので運用不能である。
加えて「`loadMemorySyncInput` を一般化する」という指示は、本 PLAN の AC-5「検出層の差分 0」と
両立しない。前版は矛盾した 2 つの要求を同時に置いていた。

**凍結し直す境界:**

1. **detector は統合しない。** `memory-sync` は `.ut-tdd/memory/` に対する既存の hard gate の
   ままとし、意味論も変えない。`loadMemorySyncInput` は触らない (AC-5 と一致)。
2. **本 PLAN が足すのは surface だけ**である。Stop summary へ「未配送件数 / 最古 age / 観測窓の
   残り日数」を advisory 表示する。判定は既存 `memory-sync` の結果を読むだけで、新しい述語を
   作らない。
3. **#236 の `unshared_canonical` は別述語として実装してよい。** 対象範囲 (共有正本ディレクトリ全般)
   も判定 (age 閾値つき advisory) も `memory-sync` と異なるためである。ただし
   `.ut-tdd/memory/` について**二重に報告しない**よう、#236 側が同ディレクトリを対象から外すか、
   本 PLAN の surface を置き換えるかを #236 の設計判断で決める。**本 PLAN はどちらでも壊れない**
   (surface しか持たないため)。
4. 共有するのは**計測データ**である。Phase 1 が `.ut-tdd/logs/session/` へ書く
   `memory_sync_backlog` イベントは、#236 が滞留日数の分布を設計するときの実測入力として
   そのまま使える。

前版が「1 本に統合する」と書いた動機 (detector 2 本による閾値 drift の回避) は、**そもそも
閾値を持つのが #236 側だけ**なので成立しない。本 PLAN は閾値を持たない。

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
