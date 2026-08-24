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
updated: 2026-08-24
owner: PO / Claude
github_issue_id: 242
parent_design: docs/plans/PLAN-L7-189-shared-harness-memory-cross-runtime.md
backprop_decision: not_required
backprop_decision_reason: "既存 `memory-sync` 判定の結果を Stop summary へ advisory 表示するだけの純 surface 修理へ縮小した (2026-08-24、非著者 FLAG B-3 の是正)。判定契約・event schema・workflow・env 注入のいずれも動かさない。新契約を要する 4 論点 (計測 schema / 観測窓と期限 / CI 文脈注入 / Phase 2 昇格) は本 PLAN から分離し、Reverse 対を持つ後続 slice で起票する。"
agent_slots:
  - role: aim
    slot_label: "AIM - Stop summary へ出す surface の境界確定 (計測・期限・CI 文脈は本 PLAN から分離済み)"
  - role: qa
    slot_label: "QA - advisory 表示 / mtime 取得失敗時の縮退 / 検出層差分 0 の回帰"
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
- **新規機構を建てない。** 本 slice が足すのは **Stop summary への 1 経路のみ**である (非著者 FLAG 3 巡目 B-2 の是正: CI 出力の文言訂正は §2 の案 C として別 slice へ分離済みであり、本 slice の Exit に CI 出力は含まれない)。
- **計測なしに fail-close 化しない。** 未計測のままゲート化しない (CLAUDE.md の既存規律)。

## 2. 設計判断 (freeze)

方式選択に trade-off が実在するため、着手前に `ut-tdd advisor` で合意形成した。

### 検討した案

| 案 | 内容 | 判定 |
|---|---|---|
| A | pre-push hook で未配送があれば **fail-close** | 本 PLAN では採らない (計測前の fail-close 禁止) |
| B | **Stop summary へ既存 `memory-sync` の判定結果を advisory 表示する** | **採択 (本 PLAN の全スコープ)** |
| C | CI 出力の文言訂正 (`skipped` 表記 + 文脈注入) | **別 slice へ分離** |
| D | `ut-tdd memory add` が commit まで行う | **refuted** |

**採択は案 B の surface 部分だけである。** セッション終了時は「書いたのに送っていない」に最も近い
タイミングであり、ローカルにしか存在しない情報をローカルの出口で出すのが素直である。表示は
advisory (fail-open) で、作業を止めない。

**案 D は refuted。** hybrid では foreign branch に対して commit できない場面が常時あり、
`memory add` が commit まで行うと、そこで詰まったときに「メモリを退避・削除する」か
「hook を迂回する」しか逃げ道が無くなる。CLAUDE.md §Hybrid 多ランタイム commit 協調 の commit
規律と正面衝突する。

### 本 PLAN のスコープを縮小した (非著者 FLAG B-3 の是正)

前版は surface に加えて **新 event schema (`memory_sync_backlog`)、観測窓 state の永続化、
判断期限の発火機構、`UT_TDD_MEMORY_SYNC_CONTEXT=ci` の workflow → doctor 注入契約、Phase 2a/2b
昇格手続き**を同一 PLAN へ積んでいた。これは:

- frontmatter の `backprop_decision: not_required` (「契約面を動かさない」) と**本文が現に矛盾する**。
  新 schema・新 state・新 env 注入契約はいずれも上流契約面である。
- `kind: recovery` / `route_mode: recovery` の性格から外れる (新契約は add-impl 相当で Reverse 対が要る)。
- PR スコープ規律 §3「1 PR = 1 論点」および §4 (scope 構造への FLAG は close→分割再出が既定) に反する。
  実際この PLAN は 5 論点を抱え、FLAG 是正のたびに本文が倍増していた。

**したがって本 PLAN は「既存 `memory-sync` の判定結果を Stop summary へ advisory 表示する」純 surface
修理へ縮小する。** これにより `backprop_decision: not_required` が真になる (判定契約・schema・
workflow・env のいずれも動かさず、既存判定の出力先を 1 つ増やすだけ)。

分離する論点と、分離先で凍結すべき事項:

| 分離する論点 | 分離先で凍結すべきこと |
|---|---|
| 計測 event schema (`memory_sync_backlog`) と sink | event 名・field・sink path、Reverse 対 (session-log / test-design への backprop) |
| 観測窓と判断期限の機構 | clock port の注入形、窓 state の path/schema、満了評価、**満了後表示の終了条件** (後続 PLAN 起票時に窓 state を解消する経路)、state 欠落/破損時の倒し方 |
| CI 文脈の注入 (`UT_TDD_MEMORY_SYNC_CONTEXT=ci`) と `skipped` 表記 | 誰がどこで注入するか、gate 合否に使わないこと、欠落時の fail-open |
| Phase 2a (pre-push warn-only) / 2b (fail-close) の昇格手続き | 昇格判定の手続き (閾値は計測後に決める) |

いずれも issue #242 の後続 slice として別 PLAN で起票する (本 PLAN では起票しない。draft PLAN の
`generates` に未実在成果物を積まないため)。

### 表示に必要な最小の値だけを凍結する (非著者 FLAG B-2 の該当部分)

本 PLAN は計測 event を持たないが、**表示に最古 age を出す**ため age の起点だけは凍結が要る。

- **age の起点は未追跡ファイルの mtime を正本とする。** `.ut-tdd/memory` は `ut-tdd memory add`
  経由でのみ作られる規律 (手書き禁止) なので、未追跡で滞留している通常経路では mtime ≈ 作成時刻で
  ある。「初回観測時に state へ記録した first_seen」は、**観測開始前から滞留していた分の age が 0 へ
  潰れる** (本事故そのものを過小表示する) うえ、stale 化しうる state 層を新設することになるため採らない。
- **mtime を取得できないファイルは件数にだけ数え、最古 age の計算から除外する** (fail-open)。
  表示が保守的になるだけで、件数の検出は従来どおり動く。

**どの非共有状態を count / age に入れるかも凍結する** (非著者 FLAG 3 巡目 B-1 の是正)。
`memory-sync` は `untracked` / `uncommitted-change` / `not-on-origin` の 3 状態を返す:

| 状態 | count | age | 根拠 |
|---|---|---|---|
| `untracked` | **数える** | **mtime 起点で計算する** | 「書いたのに送っていない」の主型。本事故 (65→128 件) はこれ |
| `uncommitted-change` | **数える** | **age 計算から除外する** (count のみ) | tracked file の作業中編集にも出る状態で、mtime は「最後に触った時刻」でしかなく滞留 age の意味を持たない。数えないと detector 結果を黙って欠落させる |
| `not-on-origin` | **数える** | **age 計算から除外する** (count のみ) | commit 時刻は取れるが「push し忘れ」の滞留は commit age と一致しない (rebase / amend で動く)。count のみで可視化する |

表示は状態別の内訳 (例: `untracked 3 / uncommitted 1 / unpushed 2`) を出し、**detector が返した
どの状態も黙って落とさない**。oldest age は untracked のみから導出し、その旨を表示に明記する
(`oldest age (untracked): N days`)。

**`not-on-origin` は常に「未 push」の証明ではない** (非著者 FLAG 4 巡目の是正)。既存 loader は
origin/main と origin/HEAD の双方が解決不能なとき、全 tracked memory を `not-on-origin` に置き
つつ `originResolved=false` を別に保持する。offline / origin 未設定の環境で全件を「unpushed」と
誤報しないため、表示を `originResolved` で分岐する:

| originResolved | `not-on-origin` の表示 |
|---|---|
| `true` | `unpushed N` (通常どおり数える) |
| `false` | `origin unresolved: N 件は判定不能` — **unpushed とは名乗らない**。件数は出す (黙って落とさない) が「未 push の証明ではない」ことを label で明示する |

判定契約は変更しない (`originResolved` は loader が既に返している値を読むだけ)。
- 観測窓・期限の state はこの PLAN では持たない (分離済み)。したがって「窓 state 欠落時の挙動」は
  本 PLAN の凍結対象ではない。

### issue #236 との境界 (freeze)

**前版の「同一判定である」は誤りだった。実測すると意味論が違う。**

| | 判定 | 結果 |
|---|---|---|
| 現行 `memory-sync` (`src/lint/memory-sync.ts`) | `untracked` / `uncommitted-change` | **hard violation** (`ok=false`) |
| 同 | `not-on-origin` | warning |
| #236 `unshared_canonical` | 未追跡かつ非 ignored かつ**滞留日数が閾値超過** | **advisory のみ** |

そのまま `docs/` `src/` `tests/` へ一般化すると、通常の tracked 編集 (`uncommitted-change`) まで
hard violation になり運用不能である。凍結する境界:

1. **detector は統合しない。** `memory-sync` は `.ut-tdd/memory/` に対する既存 hard gate のままとし、
   意味論も変えない。`loadMemorySyncInput` は触らない。
2. **本 PLAN が足すのは surface だけ**である。既存 `memory-sync` の結果を読んで表示するだけで、
   新しい述語を作らない。
3. **#236 の `unshared_canonical` は別述語として実装してよい。** 二重報告の回避は **#236 側の責務**
   とする (本 PLAN は述語を持たないため、両者が同時に報告する状態を本 PLAN の AC では検出できない。
   この不在を暗黙にせず #236 側の凍結事項として明記する)。

### 相談記録

- advisor: `--decision design --current-model claude-opus-5` (一次 `claude-fable-5`、2026-08-24)。
  B-1 は「AC-3 を満了前へ限定するだけでは不十分 (満了後表示の AC 化と終了条件が要る)」、B-2 は
  「age 起点は mtime、窓 state 欠落は満了扱い」、B-3 は「(B) 分割再出を採るべき」との判定。
- **採択**: B-3 = 分割。期限機構そのものを本 PLAN から分離したため、B-1 が指摘した「満了後表示の
  終了条件」は分離先の凍結事項へ移した (本 PLAN に満了後表示が無くなるので AC-3 の自己矛盾も解消)。
  B-2 の mtime 起点は表示用として本 PLAN に残した。
- override なし。実装は本改訂の cross-review 後に着手する (pair-freeze 順守)。

## 3. 受入条件

1. セッション終了時、未配送の `.ut-tdd/memory` エントリが 1 件以上あれば、**3 状態
   (`untracked` / `uncommitted-change` / `not-on-origin`) の状態別内訳つき件数**と、untracked のみ
   から導出した最古 age (mtime 起点) が表示される。detector が返したどの状態も表示から欠落しない
   (3 状態それぞれを fixture 化して実測する)。
1b. `originResolved=false` の fixture (origin 不在 / 解決不能 repo) で、`not-on-origin` 件数が
   `unpushed` と表示されず「origin unresolved (判定不能)」として表示される (missing-origin 回帰)。
   `originResolved=true` では従来どおり `unpushed` と表示される (両面を実測する)。
2. 表示は advisory であり、**セッションを失敗させない** (fail-open)。
3. 未配送 0 件のときは何も出さない (常時ノイズにしない)。本 PLAN は期限表示を持たないため、
   この条件は本文のどの規則とも競合しない。
4. mtime を取得できないエントリ、および `uncommitted-change` / `not-on-origin` のエントリは件数に
   数え、最古 age から除外する (各面を回帰で実測する)。
5. 検出層 (`loadMemorySyncInput` / `memory-sync` の判定) の差分が **0** であることをテストで固定する。
6. 上記 1〜5 が、`.ut-tdd/memory` を fixture として持つ回帰テストで実測される
   (prose の claim で代替しない)。

計測・観測窓・期限・CI 文言・Phase 2 昇格は本 PLAN のスコープ外であり、後続 slice の AC で閉じる。

## 4. 未達 / 持ち越し

- **`loadMemoryCorpus` の findings が非空であることを surface する経路が無い** (issue #242 の副次欠陥)。
  schema 外 `kind` を持つ手書きメモリが黙って読み飛ばされていた実例がある。本 PLAN では扱わない。
- 未配送の閾値 (何件・何日で fail-close にするか) は計測前に決めない。計測 slice の結果を待つ。
- 分離した 4 論点 (計測 schema / 観測窓と期限 / CI 文脈注入 / Phase 2 昇格) の PLAN 起票。
