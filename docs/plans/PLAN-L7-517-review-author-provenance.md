---
plan_id: PLAN-L7-517-review-author-provenance
title: "PLAN-L7-517 (add-impl): review request の author family を独立 provenance で検証する"
kind: add-impl
layer: L7
drive: fullstack
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-27
updated: 2026-08-27
owner: PO / TL
github_issue_id: 437
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
pair_artifact: docs/test-design/harness/L7-review-author-provenance-test-design.md
backprop_decision: required
backprop_decision_reason: "attacker/defender 分離の信頼根を新設するため、受理点での照合と unknown 既定を L7 から Reverse 検証する。"
agent_slots:
  - role: se
    slot_label: "SE - authoring provenance 記録と受理点照合を実装する"
  - role: qa
    slot_label: "QA - 誤申告・provenance 欠落・混在 family・digest 移行を独立変異で検証する"
generates:
  - artifact_path: docs/plans/PLAN-L7-517-review-author-provenance.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-review-author-provenance-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
  requires: []
  blocks: []
  references:
    - src/feedback/review-verdict-custody.ts
    - src/feedback/review-attestation.ts
    - src/feedback/review-merge-gate.ts
    - src/cli/delegation.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/437
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/439
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/421
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/429
review_evidence: []
---

# PLAN-L7-517: review request の author family を独立 provenance で検証する

## 1. Outcome

review の attacker/defender 分離が、request の**自己申告 1 field** ではなく、request の外側にある
authoring provenance 記録との照合で成立する。誤申告された author family で著者本人が自分の PR の
canonical receipt を mint することが機械的に不可能になる。provenance が得られない対象は素通りも
全停止もせず、typed unknown として受理点で fail-close する。

## 2. 起点の実測 (2026-08-27、origin/main 6b5b1d9c)

本 PLAN の方式選択は次の実測に依拠する。Issue #437 が挙げた候補 (A) の前提はここで崩れている。

| 観測 | 実測値 | 取得方法 |
|---|---|---|
| git author 名が family を示す割合 | **0%** (166/166 が `unison-ai-product`) | `git log origin/main -200 --no-merges --format='%H %an %ae'` |
| `Co-Authored-By` trailer を持つ commit | 24.7% (41/166) | 同上 (`%(trailers:key=Co-Authored-By)`) |
| うち family を判別できる trailer | **10.2%** (17/166、`Claude Opus 5 (1M context)`) | 同上。残り 38 件は `unison-ai-product` で family を示さない |
| commit sha と provider を結ぶ harness.db 列 | **存在しない** (85 table 走査) | `model_runs` 7,985,466 行は runtime/model/時刻のみで commit sha 無し。`tool_runs` 0 行。`hook_events` 27,929 行は session_id/plan_id/digest のみ |
| authoring attestation | **存在しない** | `ReviewAttestation` (`src/feedback/review-attestation.ts`) は provider/role/model/pr/head を束縛するが、束縛対象は review であって authoring ではない |

したがって:

- **候補 (A) は成立しない。** 実 commit author から family を導出しようにも、導出元が family 情報を
  0% しか持たない。PR #430 のように GitHub user が author で AI が co-author という形も併存するため、
  commit metadata だけで artifact の author family を一意に決めることはできない。
- **既存 attestation を信頼根にする案は遡及適用できない。** authoring attestation が皆無なので、
  不在を fail-close にすると初日から事実上すべての review が停止する。

## 3. 設計判断

### 3.1 検証時点 — 生成時ではなく受理時に置く (採択)

Issue #437 の候補 (A)(B)(C) は「導出源の変更」「生成時検証」「事後検知」を並べているが、脆弱性の
本体は **受理点が申告値を無検証で信頼していること**である。`beginReviewAttempt`
(`src/feedback/review-verdict-custody.ts`) は `expectedProvider` を request の `authorFamily`
だけから導き、外部の事実と突き合わせない。

よって軸は「導出源の三択」ではなく **trust root × 照合を行う受理点** の 2 軸とする。照合は
**消費時 (`beginReviewAttempt` と merge gate 評価時)** に置く。これにより候補 (B) の弱点
「生成側が壊れれば素通り」と候補 (C) の弱点「事後検知なので merge gate を止められない」が同時に
消える。生成時 (mint 時) の検証は早期失敗として**追加で**行うが、それを唯一の防壁にしない。

**trade-off**: 受理時照合は provenance 取得の失敗が review 実行そのものを止めうる。この代償を
§3.3 の unknown 既定で限定する。

### 3.2 trust root — authoring provenance を新設し、発行権限を worker から分離する (採択)

既存の commit metadata (0% / 10.2%) も既存 attestation (authoring 分は皆無) も信頼根になりえない
ため、**authoring provenance 記録を新しい obligation として導入する**。記録は commit sha を key に
provider family を束縛し、request の外側に置く。

**ただし「request の外側に置く」だけでは自己申告を別ファイルへ移しただけになる。** 記録が信頼根に
なるのは、**発行権限が成果物を書いた worker から分離されているとき**に限る。次を契約として固定する。

- **issuer は dispatch 側である。** provenance record を書けるのは、その worker を起動した委譲経路
  (`ut-tdd codex|claude --role`) の dispatch 側のみとする。**worker 自身は自分の provenance を
  write / backfill できない。** worker が書けるなら申告値と同じ強度しか持たない。
- **dispatch custody を束縛する。** record は「どの dispatch が」「どの worker を」「どの role /
  provider / model で」起動したかを持つ。dispatch identity は request identity とは独立に採番する。
  ただし record の issuer 欄や通常の content digest は worker が同じ値を自己生成できるため、信頼根には
  しない。dispatch custody は worker が書けない append-only の issuer attestation (dispatch identity、
  repository、commit-set、provider、完了時刻を束縛した署名/検証可能な custody envelope) として発行し、
  受理点はその attestation を独立に検証する。
- **completion binding を要求する。** dispatch 開始時点の宣言だけでは、起動後に別 provider が
  commit を作った場合を排除できない。record は dispatch の**完了時**に、その dispatch が実際に
  生成した commit 集合と結び付けて確定する。開始時 record と完了時 binding が一致しないものは
  `unknown` とする (§3.3)。
- **後付け backfill の権限を分離する。** §3.3 の unknown 解消経路で record を後から書く場合も、
  書けるのは dispatch 側または人手 (out-of-band) のみとし、**当該 commit を書いた worker family
  自身による backfill を禁じる**。

**採択しなかった案と理由**:

- commit author 文字列を正本にする案 — 実測 0%。
- family trailer を正本にする案 — 実測 10.2%。かつ trailer は commit 作成者が自由に書けるため、
  誤申告に対する独立性が無い (申告値をもう 1 箇所に書き写すだけになる)。
- 既存 `model_runs` の時刻近接で推定する案 — 7,985,466 行あるが commit sha を持たず、時刻近接は
  複数ランタイム並行時に一意にならない。**推定を信頼根にしない**。
- worker 自身に provenance を書かせる案 — 上記のとおり自己申告と同値であり、Issue #437 の脆弱性を
  記録先を変えて再現するだけである。

### 3.2.1 worker_model / dispatch provider / author family の対応 (採択)

三者の対応が未定義だと mismatch を fail-close できない。次を契約として固定する。

- **provider family は dispatch provider から決まる。** `worker_model` から family を推論しない。
  model 名は alias / 改称 / 新モデル追加で変わるため、model → family の写像を信頼根にしない。
- **model と provider の不一致を typed deny する。** dispatch provider が codex なのに
  `worker_model` が claude 系である等の組合せは、alias 解決後も不一致なら record を `unknown` へ
  倒す。推論で辻褄を合わせない。
- **alias は正規化表を持つ。** 正規化できない model 名は `unknown` とする。未知 model を
  「たぶんこの family」と解決しない。
- **human / manual commit は typed な第三の値とする。** `codex` / `claude` のどちらにも丸めない。
  human commit を含む PR の扱いは §3.5 の contributor family set で決める。
- **subagent は親 dispatch の family を継承する。** 親 dispatch identity を record に含め、
  subagent 単独の record を親から切り離して成立させない。
- **1 commit を複数 worker が生成した場合を typed に扱う。** 単一 family へ丸めず、その commit
  自体を multi-contributor として記録する (§3.5)。

### 3.3 provenance が得られないときの既定 — typed unknown、mint 可・受理 fail-close (採択)

全停止 (どんな unknown も review を拒否) と素通り (unknown を申告値で代替) の中間を採る。

- request の mint は許す。過去 commit や wrapper 外で作られた commit を持つ PR でも、依頼自体は
  出せる。
- **受理は fail-close する。** unknown のまま `beginReviewAttempt` を通さず、unknown のまま
  `merge_ready` へ進めない。typed reason を返す。
- unknown を解消する経路を用意する (provenance の後付け記録)。解消経路は実装 slice が所有する。

**trade-off**: 移行期は provenance 未記録の PR が受理点で止まる。これは意図した設計であり、
「止まったら申告値で代替する」逃げ道を作らない。逃げ道を作れば信頼根が申告値へ戻る。
本判断は cross-review の対象として明示する。

### 3.3.1 collision / replay / mutation / TOCTOU (採択)

provenance record が「書かれた後は正しい」と仮定しない。次を契約として固定する。

- **同一 repo・同一 commit に対する異 family の二重記録を typed deny する。** 先勝ちで黙って
  片方を捨てない。衝突は解決せず `conflict` として保持し、受理点は `conflict` を `unknown` と
  同様に fail-close する。
- **別 repo からの replay を typed deny する。** record は repository identity を束縛し、
  commit sha だけで他 repo の record を流用できないようにする。
- **overwrite / delete を許さない。** record は append-only とし、訂正は新 record の追記と
  supersede 関係で表す。既存 record の書き換え・削除を支援された操作にしない。
- **issuer / digest の mutation を検出する。** record は issuer と内容の digest を持ち、
  受理点で再計算して照合する。issuer attestation も同じ dispatch custody root で検証し、
  worker が issuer と record digest を同時に forge しても受理しない。
- **attempt 後・merge 前の差し替え (TOCTOU) を塞ぐ。** request / receipt / merge gate を
  **同一の provenance digest・provenance schema version・commit-set snapshot** へ束縛する。
  receipt が参照した provenance snapshot と merge 時点の snapshot が一致しない場合は
  typed deny する。「review 時は正しかった」を merge の根拠にしない。
- **束縛の起点は verdict receipt の発行時点とする。** §3.3 の unknown 解消 backfill は
  **verdict receipt が未発行の間のみ許す**。backfill 後の再 attempt は snapshot を当該時点の値へ
  束縛し直す。verdict receipt 発行後の provenance 追記・変更は typed deny する。これにより
  「unknown を解消して再 attempt できる」ことと「snapshot は不変である」ことが両立する
  (前者は receipt 前、後者は receipt 後の規則である)。

### 3.4 identity digest の互換と legacy 移行 — 旧 digest 保存と安全 gate を分離する (採択)

`authorFamily` は `reviewIdentityObject` の構成要素であり `reviewIdentityDigest` の入力である
(`src/feedback/review-verdict-custody.ts`)。したがって author family の意味論を変えると、既存の
request / receipt / `rv1-` revision との互換が壊れる。実測でも `authorFamily` を codex から claude へ
訂正しただけで digest が `55b815ea…` から `6c99f904…` へ変わることが確認されている (Issue #437 本文)。

**ただし「旧規則のまま close させる」は既知脆弱性を grandfather する。** 旧 schema の in-flight
request をそのまま閉じられるなら、PR #430 型の誤 `authorFamily` request が自己 review と merge へ
到達できてしまい、本 PLAN の目的が移行期間中は無効になる。**互換の保存と gate の安全は別の関心事で
あり、分離して契約する。**

- **digest 互換 (保存側)**: `REVIEW_REQUEST_SCHEMA_VERSION` を bump する。旧 schema request の
  digest は**再計算しない**。遡って digest を振り直せば既存 receipt との対応が全滅する。
- **gate 安全 (受理側)**: 旧 schema であることは受理点の照合を免除しない。旧 schema の in-flight
  request も、close する前に **trusted provenance との照合を要求する**。
- **保存側と受理側を分離する。** digest 保存の不変条件 (再計算 0、既存 receipt との対応維持) は
  受理側の照合免除を意味しない。両者を同一の oracle で測らない。
- **照合できない旧 request の扱い**: provenance が `unknown` で照合できない旧 request は、
  旧規則で close させない。`unknown_provenance_unresolved` の typed non-terminal として保持し、
  merge gate を blocking のままにする。#439 の `unclosable` retraction は独立 provenance が確定し、
  #439 §3.2 の機械述語を満たした場合だけ発行できる。unknown のまま自動 retraction/終端や新 schema
  再 mintへ遷移させない (不可能な terminal transition を契約に書かない)。
- **grandfather 条項を作らない。** 「移行期間中は旧 request を無条件に通す」という例外を置かない。
  例外を置けば、その期間は Issue #437 の脆弱性がそのまま残る。

### 3.5 mixed author family — contributor family set として freeze する (採択)

1 PR / 1 commit が複数 family にまたがる場合を「どちらか」に丸めない。**contributor family set**
として扱い、判定を set 上で行う。

- **PR の contributor family set** = その PR の全 commit の provenance が示す family の集合。
  human / manual commit は `human` として set に含め、`codex` / `claude` のどちらにも丸めない。
- **reviewer family が set に含まれるなら typed deny する。** set が `{codex, claude}` なら
  どちらの provider も非著者ではないため、**どの reviewer でも受理しない**。これは
  「混在なら片方を著者とみなす」という丸め込みを禁じることを意味する。
- **unknown contributor を 1 件でも含む set は typed deny する。** 部分的に既知でも、未知の
  contributor がいる限り非著者性を保証できない。§3.3 の unknown 既定を set へ持ち上げたもの。
- **single-commit mixed も同じ規則で扱う。** 1 commit を複数 worker が生成した場合 (§3.2.1)、
  その commit 自体が複数 family を contributor に持つとみなし、PR の set へ合流させる。
- **`human` のみの set は非著者判定の対象外とする。** どの AI family も著者でないため、
  codex / claude いずれの reviewer も非著者として受理できる。

**trade-off**: 混在 PR は本規則により**どの family でも review できなくなる**。これは意図した
設計であり、回避策は PR を family 単位へ分割することである。「混在は多数派 family とみなす」等の
緩和は、誤申告耐性を失うので採らない。

### 3.5.1 双方向性

Issue #437 の「逆向きの同型ケース」を契約に含める。`claude` を著者とする PR を `codex` と申告する
経路と、`codex` を著者とする PR を `claude` と申告する経路は同一機構で成立するため、片側だけの
是正にしない。oracle も両方向を持つ。

### 3.6 本 PLAN が扱わない境界

- **閉じられない / 重複した request の回復経路は扱わない。** それは Issue #439 が所有する
  (typed retraction)。本 PLAN は発生防止のみ。
- **同一 `(pr, exactHead)` に対する競合 mint の一意性は扱わない。** それは Issue #421 の拡張が
  所有する。2026-08-27 の PR #441 で、両ランタイムが異なる `memoryId` で独立に canonical request を
  mint した実例が観測されている。`reviewRevision` は `reviewIdentityDigest` = f(schemaVersion,
  memoryId, pr, exactHead, authorFamily) から導かれるため、`memoryId` が違えば revision も必ず違い、
  #421 の同一 revision ルールでは捕まらない。この不変条件の拡張は別 Issue の責務とする。
- **`review_evidence` の手書き運用の撤廃は扱わない。** Issue #429 が所有する。

## 4. Fail-close contract

**受理点の照合**

- request の `authorFamily` が authoring provenance と一致しない場合、`beginReviewAttempt` を
  typed deny する。deny は reviewer provider の当否より先に評価する。
- provenance が `unknown` または `conflict` の場合、`beginReviewAttempt` を typed deny する。
  申告値へ fallback しない。旧 request も `unknown_provenance_unresolved` の non-terminal として
  merge-blocking に保持し、独立 provenance 無しの retraction/close を発行しない。
- merge gate は、受理点と同じ照合を独立に再実行する。review 側だけで判定を完結させない。

**発行権限 (§3.2)**

- worker family 自身が書いた provenance record を信頼根として受理しない。
- dispatch identity を持たない record を受理しない。
- dispatch 開始時 record と完了時 commit-set binding が一致しない record を `unknown` とする。
- unknown 解消の backfill を、当該 commit を書いた worker family が実行することを禁じる。

**model / provider 対応 (§3.2.1)**

- `worker_model` から family を推論しない。
- dispatch provider と `worker_model` が alias 正規化後も不一致なら `unknown` とする。
- 正規化表で解決できない model 名を既知 family へ丸めない。
- subagent の record を親 dispatch から切り離して成立させない。

**collision / replay / mutation / TOCTOU (§3.3.1)**

- 同一 repo・同一 commit に対する異 family の二重記録を `conflict` として保持し、先勝ちで捨てない。
- repository identity が一致しない record を受理しない (cross-repo replay 禁止)。
- record の overwrite / delete を支援された操作にしない。訂正は追記と supersede で表す。
- issuer attestation の dispatch custody root と record の issuer/content digest を受理点で独立に
  検証し、issuer と内容 digest を同時に forge した record を deny する。
- request / receipt / merge gate を同一の provenance digest・schema version・commit-set snapshot へ
  束縛する。receipt 参照時と merge 時で snapshot が異なる場合は typed deny する。

**legacy 移行 (§3.4)**

- 旧 schemaVersion の request に新規則を遡及適用して digest を再計算しない。
- 旧 schema であることを理由に受理点の照合を免除しない。
- provenance が照合できない旧 request を旧規則で close させない。`unknown_provenance_unresolved`
  として live/merge-blocking に保持し、#439 の typed retraction は provenance 確定後に機械述語を
  満たす場合だけ許可する。unknown のまま終端・自動再 mintへ進めない。
- 移行期間の無条件通過 (grandfather) 条項を置かない。

**mixed family (§3.5)**

- reviewer family が contributor family set に含まれる場合、typed deny する。
- unknown contributor を含む set を typed deny する。
- 混在 set を多数派や先頭 commit の family へ丸めない。
- `human` を `codex` / `claude` のいずれにも丸めない。

## 5. Implementation slices

本 PR は契約と対になる candidate だけを freeze する。次の成果物は pair-freeze 後の原子的な実装 PR が
所有し、本 PR の `generates` へ先行登録しない。

1. authoring provenance record の schema (commit sha / repository identity / provider family /
   issuer / dispatch identity / digest / schema version) と append-only 書き込み経路。
2. dispatch 側 issuer の結線と、worker 自身による write / backfill の禁止。
3. dispatch 完了時の commit-set binding と、開始時 record との一致判定。
4. `beginReviewAttempt` での受理時照合と typed deny。
5. merge gate 側の独立再照合と、provenance snapshot 束縛による TOCTOU 遮断。
6. collision / cross-repo replay / mutation の検出。
7. `REVIEW_REQUEST_SCHEMA_VERSION` bump と、旧 schema request の照合必須化 (#439 retraction 経路への接続)。
8. contributor family set の算出と、reviewer family 判定。
9. unknown 解消経路 (dispatch 側 / 人手のみ)。

実装順序の制約: 1 → 2 → 3 が信頼根の成立条件であり、4 以降の照合はこれらが揃うまで意味を持たない。
7 は #439 の typed retraction が実在してから着地する。

## 6. Scope boundary

本 PLAN の `confirmed` は、契約と対になる test-design が非著者 pair-freeze review、docs CI、
canonical receipt を満たし、実装開始条件として固定されたことだけを表す。実装 candidate の Green、
Reverse R4、Issue #437 の完了は意味しない。

現行 release Forward の PR (#431 #435 #436 #438 #440 #441) を巻き戻さない。本 PLAN の実装は
新規 mint から適用され、既に close した review の receipt を無効化しない。
