---
plan_id: PLAN-L7-498-green-command-anchor-reachability
title: "PLAN-L7-498 (add-impl): 新規 green_command entry の anchor 到達可能性を PR 基準で検査する (issue #367)"
kind: add-impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-08-21
updated: 2026-08-24
owner: PO / Claude
github_issue_id: 367
parent_design: docs/design/harness/L6-function-design/test-before-review.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: aim
    slot_label: "AIM - 検査基準点を main ではなく PR に置く境界と、基準点が解決できない面の縮退規則の確定"
  - role: qa
    slot_label: "QA - squash merge 済み anchor と捏造 anchor の両方を fixture 化し、CI の clone 形状で実測する"
generates:
  - artifact_path: docs/plans/PLAN-L7-498-green-command-anchor-reachability.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-497-green-command-anchor-required.md
  requires:
    - PLAN-L7-497-green-command-anchor-required
  blocks: []
  references:
    - docs/plans/PLAN-L7-303-digest-commit-anchor.md
    - docs/plans/PLAN-REVERSE-498-green-command-anchor-reachability-backfill.md
    - src/lint/review-evidence.ts
    - src/lint/green-command-digest.ts
    - src/lint/merged-plan-target-evidence.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/367
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence: []
---

# PLAN-L7-498: 新規 green_command entry の anchor 到達可能性検査

## 1. 事故と、なぜ字面検査では足りないか

`PLAN-L7-497` (issue #191) で `anchor_commit` を全 entry 必須にしたが、検査は
**`^[0-9a-f]{7,40}$` の字面のみ**である。したがって `0000...0` のような**実在しない 40 桁**を
書いても `review-evidence` gate を通る。

さらに `green-command-digest` は commit 不在を `unverifiable` として**無視する**
(GC / shallow 対応の意図的な fail-open)。よって捏造 anchor は digest 監査も素通りする。

結果、「anchor があるので証跡は永続検証可能」という主張が**実在しない anchor でも成立する**。
`PLAN-L7-303` が anchor 方式で得ようとした「測定時点の固定」は、字面だけでは成立しない。

## 2. 設計判断 (freeze)

### 判断点 1: 基準点をどこに置くか

| 案 | 内容 | 判定 |
|---|---|---|
| A | main から到達可能かを検査する | **実測で棄却済み** |
| B | **PR が新規追加した entry の anchor を、その PR の head から到達可能かで検査する** | **採択** |
| C | 検査しない (現状維持) | 不採択 |

**A を棄却した根拠 (issue #367 の実測)**: `PLAN-L6-101` の anchor `040a9f85` は PR #358 の
pre-merge head であり、その head で CI が 3/3 green を出して merge の根拠になった**正しい anchor**
である。しかし #358 は squash merge で `03e61b86` になり branch も削除されたため、main から到達
不能である。CI の fresh clone には object 自体が無い。**squash merge 運用では「anchor が main から
到達不能」ことが正常状態**であり、捏造と区別できない。実測で 29 件の false positive を出した。

**B を採る根拠**: 記録した本人の branch 上なら anchor は必ず到達可能なので、捏造 anchor は落ちる。
merge 後に到達不能になっても、その時点で検査済みなので再検査しない = squash merge と両立する。

### 判断点 2: 「新規追加した entry」をどう判定するか

**PR diff (`mergeBase..HEAD` の `docs/plans/*.md` 差分) から導出する。自己申告値を使わない。**

`PLAN-L7-497` の初版は `completed_at` (書き手が編集できる値) で新旧を判定しようとして迂回可能に
なった。同じ轍を踏まない。diff は書き手が偽装できない (偽装するには実際にその内容を commit する
必要があり、その時点で anchor も branch 上に存在することになる)。

**凍結する比較キー (非著者 FLAG B-2 の是正)**: 前版は「PR diff から導出する」としか書いておらず、
何を 1 entry の同一性とみなすかを定義していなかった。字面の追加行検出では YAML の字下げ・key 順・
整形だけで「新規」と誤判定し、構造照合でも add / modify / reorder の扱いが実装者裁量になる。
実装前に以下を凍結する。

1. **比較は字面ではなく parse 後の値で行う。** `mergeBaseSha` 側と `subjectHeadSha` 側の
   `docs/plans/*.md` をそれぞれ parse し、`green_command` entry を取り出す。
2. **意味的キーは `(plan file path, entry の anchor_commit 値)` の組**とし、**比較は集合ではなく
   正規化 multiset (キーごとの出現数) の差**で行う (非著者 FLAG 2 巡目 B-2 の是正)。検査対象は
   **HEAD 側の出現数が mergeBase 側の出現数を上回るキー**であり、上回った分の各出現を新規 entry と
   みなす。
3. 帰結として: **key 順・字下げ・整形・コメント・他 field (`command` / `completed_at` 等) の編集・
   entry の並べ替えでは発火しない** (キーと出現数が不変のため)。**新しい anchor_commit 値の導入と、
   既存値の出現数増加だけが発火する**。
4. **同値重複を 1 キーへ畳んではならない。** 集合差にすると、mergeBase 側に grandfathered な到達
   不能 anchor A を持つ PLAN へ、PR が別 command の新 entry を同じ A で追加したとき差が 0 になり
   検査を迂回できる (Codex 指摘の反例)。新しい主張 (entry) が既存 anchor 値を再利用する場合も、
   その entry は新規であり到達可能性検査を受ける。
5. **parse に失敗した面は検査ごと落とす** (判断点 4 の縮退と同じ規律。字面 fallback を持たない)。

### 判断点 3: 到達可能性の判定方法

**`git merge-base --is-ancestor <anchor> <PR head>` を使う。`git cat-file -e` を使わない。**

`cat-file -e` は **object がローカルに存在するか**を見るだけで、環境依存である。実際 PR #361 の
実在検査はローカル clone に fetch 残骸があったため全件通り、**CI で初めて 29 件落ちた**。
`--is-ancestor` は祖先関係という実在の関係を見るので、fetch 状態に左右されにくい。

### 判断点 4: 基準点が解決できない面をどうするか

**欠け方 2 通りを同じ扱いにしない (非著者 FLAG 2 巡目 B-1 の是正)。**

| 欠け方 | 意味 | 扱い |
|---|---|---|
| (a) PR event が無い (ローカル doctor / 非 PR 実行) | 本検査の対象面ではない | **skip** (検査ごと落とす縮退。推測で violation を作らない) |
| (b) PR event は在るが `mergeBaseSha` / `subjectHeadSha` のいずれかの object を解決できない (fetch-depth drift / base object 欠落) | required gate が走るべき面で入力が壊れている | **fail-close** (violation `anchor_baseline_unresolvable`) |

前版は (a)(b) を「どちらも分からないので同じ」として一律 skip にしたが、これは **workflow drift
(例: checkout の fetch-depth が 0 から浅い値へ変わる) で required gate を無音で無効化できる**
契約だった (Codex 指摘)。(b) は「分からない」ではなく「required 面の前提が壊れた」であり、壊れた
前提は修理されるまで赤くあるべきである。(a) の skip は維持する — 非 PR 面には required の約束が
そもそも無い。

CI の `pull_request` run では正常時に両方が揃い、揃わない run は (b) として fail-close する。

### 判断点 5: 評価される subject commit の正体と checkout 契約 (非著者 FLAG B-3 の是正)

前版は AC-4 に「CI の clone 形状を確認する」と書いただけで、**どの commit が subject になるかを
契約として凍結していなかった**。実測して凍結する。

- `harness-check.yml` の checkout は `actions/checkout@v5` + `fetch-depth: 0` のみで、
  **`ref:` を `pull_request.head.sha` へ固定していない** (実測: `.github/workflows/harness-check.yml`
  の checkout step に `ref` が無い)。
- `resolveMergedPlanTargetEvidence` の `subjectHeadSha` は **`git rev-parse HEAD`** である
  (実測: `src/lint/merged-plan-target-evidence.ts:104`)。event payload の `head.sha` ではない。
- したがって `pull_request` run で評価される subject は **PR head ではなく synthetic merge commit**
  (`refs/pull/N/merge`) である。

**凍結する契約**: 到達可能性は「PR head から」ではなく **「評価された subject commit から」** と定義
する。`pull_request` run ではそれが merge commit であり、PR head は merge commit の親なので
**PR branch 上の anchor は必ず通る** (検査したい捏造 anchor は落ちる)。同時に **base main 側から
到達可能な anchor も通る**。これは検出力の弱化だが、main 上の commit は実在し永続するので
「測定時点の固定」という `PLAN-L7-303` の目的は損なわれない。**この弱化を暗黙にせず契約として
明示する**のが本判断点の要点である。

AC で機械化する (prose の前提にしない): merge commit checkout を模した fixture
(HEAD = base main と PR head を親に持つ merge commit) で、(a) PR branch 上のみに在る anchor が
通ること、(b) base main 上のみに在る anchor が通ること、(c) どちらからも到達不能な anchor が
落ちることを実測する。

### 判断点 6: 依存 PR の evidence を引用する場合の anchor provenance (非著者 FLAG B-1 の是正)

FLAG は「依存 PR の pre-squash head を引用した正当な cross-PR entry を false-reject する」と指摘した。
実測すると **本 repo に pre-squash head を cross-PR で引用した entry は観測されない** (サンプル検査
した anchor はいずれも導入 commit の祖先) ため、これは仮説だが、方式は凍結する必要がある。

| 案 | 内容 | 判定 |
|---|---|---|
| A-dash | **現行の到達可能性を維持し、cross-PR 引用の記録規則を 1 つ足す** | **採択** |
| B | 依存 PR の pre-squash head を GitHub API の存在/到達性検査で別途認証する | 不採択 |
| C | anchor を `CI run id + head sha` の組へデータ形式変更する | 不採択 |

- **B の不採択理由**: lint gate に外部 API という新しい信頼根とネットワーク依存を持ち込む
  (最小実装原則違反)。「削除済み branch の dangling object を API から引ける」は GitHub の現行
  挙動であって契約保証ではない。
- **C の不採択理由**: `PLAN-L7-303` の二層 digest 契約と `PLAN-L7-497` の必須化を壊す。本 PLAN の
  非目標 (既存契約を変更しない) と正面衝突する。

**採択案で凍結する記録規則**: 依存 PR の green を引用する entry は、**依存 PR が merge された後の
main commit (squash 後の sha) を anchor に書く**。この commit は subject から必ず到達可能である。
squash 後 commit の tree が測定時の tree と一致するのは **依存 PR が main の先端から分岐していた
場合に限る**ので、main が進んでいた場合は tree 同一性を主張してはならない — その場合は
**引用元の run を `command` 側の記録に残したうえで、自分の head で green を測り直す**。

到達不能な pre-squash head を書いた entry は **記録方法の誤り**として落とす。落ちたときの是正手順
(上記 2 通り) を violation message に載せる。

**AC で機械化する**: 依存 PR 由来の 2 ケース — (a) pre-squash head を anchor にした entry が
`unreachable_anchor_commit` で落ちること、(b) squash 後 main commit を anchor にした同内容の entry が
通ること — を実装前に回帰として書く。

## 3. 実装契約

`review-evidence` へ violation reason を 1 つ追加する:

| reason | 条件 |
|---|---|
| `unreachable_anchor_commit` | PR が新規追加した green_command entry の `anchor_commit` が評価 subject から到達不能 |
| `anchor_baseline_unresolvable` | PR event が在るのに `mergeBaseSha` / `subjectHeadSha` のいずれかの object を解決できない (判断点 4 の (b)。fetch-depth drift / base object 欠落) |

既存の `missing_anchor_commit` / `invalid_anchor_commit` (`PLAN-L7-497`) と
`green-command-digest` の `unverifiable` fail-open は**変更しない**。本 PLAN は「新規 entry の
anchor が実在すること」だけを足す。

入力は `resolveMergedPlanTargetEvidence` が既に持つ `mergeBaseSha` / `subjectHeadSha` を再利用し、
新しい解決経路を作らない。

## 4. 受入条件

1. 新規追加 entry が `0000...0` のような到達不能 anchor を持つとき fail-close する。
2. **squash merge 済みで main から到達不能な既存 entry は落ちない** (実 repo の全 entry が通過する
   ことを実測で確認する。prose の claim で代替しない)。
3. 基準 SHA が解決できない面は PR event の有無で分かれる (判断点 4): **PR event が無い**面では
   検査ごと落ちる (skip)。**PR event が在る**のに `mergeBaseSha` / `subjectHeadSha` のいずれかを
   解決できない面では `anchor_baseline_unresolvable` の violation になる (fail-close)。両面とも回帰化する。
4. **CI の clone 形状を前提条件として明示的に確認する。** 「ローカルで通った」を根拠にしない
   (issue #367 の注意書き。PR #361 の実在検査がこれで 29 件の false positive を出した)。
5. **merge commit checkout の fixture 回帰** (判断点 5): PR branch 上のみの anchor が通る /
   base main 上のみの anchor が通る / どちらからも到達不能な anchor が落ちる、の 3 面を実測する。
   `subjectHeadSha` が `git rev-parse HEAD` 由来であることをテストで固定し、event payload 由来へ
   すり替わったら赤になるようにする。
5b. **基準 SHA 欠落の 2 面回帰** (判断点 4): PR event あり + base object 解決不能 (shallow clone /
   fetch-depth drift を模した fixture) で `anchor_baseline_unresolvable` の violation になる。
   PR event なしでは skip する。**skip へ倒す実装 mutation (fail-close 分岐の削除) が RED になる**
   oracle を必須とする (CI green では反証できない論理反例のため、mutation oracle で固定する)。
6. **新規 entry 判定キーの回帰** (判断点 2): 整形・key 順・並べ替え・他 field 編集では発火せず、
   新しい `anchor_commit` 値の導入と既存値の出現数増加だけが発火することを実測する。**multiset
   固有の 2 面を必須とする**: (a) mergeBase 側に同値 anchor を持つ PLAN へ同値の新 entry を追加した
   fixture が検査対象になる (集合差実装なら GREEN のまま生き残る mutation を書き、multiset 実装で
   RED になることを確認する)、(b) 出現数が減る編集 (entry 削除) では発火しない。parse 失敗面で
   検査ごと落ちることも固定する。
7. **依存 PR 引用の 2 ケース回帰** (判断点 6): pre-squash head anchor が落ち、squash 後 main commit
   anchor が通る。violation message に是正手順が含まれることも固定する。

## 4.1 相談記録 (2026-08-24、非著者 FLAG 3 件の是正時)

- advisor: `--decision design --current-model claude-opus-5` (一次 `claude-fable-5`)。B-1 の
  選択肢 B / C は refuted、到達可能性維持 + 記録規則の追記を採択。B-2 / B-3 は同一 PLAN 改訂に
  含める判定 (slice 分割は pair-freeze を二度走らせるだけでコストが上回る)。
- **advisor の前提を 1 点実測で訂正した**: advisor は「PLAN が入力に使う `subjectHeadSha` は event
  payload 由来」としたが、実測では `src/lint/merged-plan-target-evidence.ts:104` の
  `git rev-parse HEAD` である。したがって subject は merge commit であり、判断点 5 はこの実測に
  基づいて凍結した (advisor の推奨より弱い検出力を明示する形へ倒した)。
- override なし。実装は本改訂の cross-review 後に着手する (pair-freeze 順守)。

## 5. 非目標

- 既存 entry の anchor 実在検査 (squash merge 後は原理的に判定不能)。
- merge 後の再検査。
- `green-command-digest` の `unverifiable` を fail-close へ変えること (GC / shallow で正当に
  検証不能な面が実在するため)。
