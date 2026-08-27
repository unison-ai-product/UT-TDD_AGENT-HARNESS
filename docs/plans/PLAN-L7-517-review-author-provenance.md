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

### 3.2 trust root — authoring provenance を新設する (採択)

既存の commit metadata (0% / 10.2%) も既存 attestation (authoring 分は皆無) も信頼根になりえない
ため、**authoring provenance 記録を新しい obligation として導入する**。記録は commit sha を key に
provider family を束縛し、request の外側に置く (request が自分の正しさを証明できてはならない)。

**採択しなかった案と理由**:

- commit author 文字列を正本にする案 — 実測 0%。
- family trailer を正本にする案 — 実測 10.2%。かつ trailer は commit 作成者が自由に書けるため、
  誤申告に対する独立性が無い (申告値をもう 1 箇所に書き写すだけになる)。
- 既存 `model_runs` の時刻近接で推定する案 — 7,985,466 行あるが commit sha を持たず、時刻近接は
  複数ランタイム並行時に一意にならない。**推定を信頼根にしない**。

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

### 3.4 identity digest の互換 — schemaVersion bump と in-flight 移行を契約で固定する (採択)

`authorFamily` は `reviewIdentityObject` の構成要素であり `reviewIdentityDigest` の入力である
(`src/feedback/review-verdict-custody.ts`)。したがって author family の意味論を変えると、既存の
request / receipt / `rv1-` revision との互換が壊れる。実測でも `authorFamily` を codex から claude へ
訂正しただけで digest が
`55b815ea…` から `6c99f904…` へ変わることが確認されている (Issue #437 本文)。

契約として固定する:

- **`REVIEW_REQUEST_SCHEMA_VERSION` を bump する。** 旧 schema の request は旧規則で解釈し、
  新規 mint のみ新規則を適用する。
- **旧 request を新 schema へ再解釈しない。** 遡って digest を再計算すれば既存 receipt との
  対応が全滅する。
- **in-flight (未 close) の旧 schema request の扱いを明示する。** 本 PLAN では旧規則のまま
  close させ、新規則は新 mint から適用する。
- これらは**実装 PR で発明してはならない**。方式変更が必要になったら実装を止めて本節を改訂する。

### 3.5 双方向性

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

- request の `authorFamily` が authoring provenance と一致しない場合、`beginReviewAttempt` を
  typed deny する。deny は reviewer provider の当否より先に評価する。
- provenance が `unknown` の場合、`beginReviewAttempt` を typed deny する。申告値へ fallback しない。
- merge gate は、受理点と同じ照合を独立に再実行する。review 側だけで判定を完結させない。
- 1 PR の commit が複数 family にまたがる場合を typed に扱う。`mixed` を単一 family として
  丸めない。混在時にどちらの family を著者とみなすかは実装 slice の前に本節へ freeze する。
- provenance 記録の書き込み失敗を成功扱いしない。書けなかった場合は unknown として扱い、
  「記録できたことにする」経路を作らない。
- 旧 schemaVersion の request に新規則を遡及適用しない。

## 5. Implementation slices

本 PR は契約と対になる candidate だけを freeze する。次の成果物は pair-freeze 後の原子的な実装 PR が
所有し、本 PR の `generates` へ先行登録しない。

1. authoring provenance 記録 (commit sha → provider family) と、その書き込み経路。
2. `beginReviewAttempt` での受理時照合と typed deny。
3. merge gate 側の独立再照合。
4. `REVIEW_REQUEST_SCHEMA_VERSION` bump と旧 schema request の共存。
5. unknown 解消経路と、混在 family の typed 扱い。

## 6. Scope boundary

本 PLAN の `confirmed` は、契約と対になる test-design が非著者 pair-freeze review、docs CI、
canonical receipt を満たし、実装開始条件として固定されたことだけを表す。実装 candidate の Green、
Reverse R4、Issue #437 の完了は意味しない。

現行 release Forward の PR (#431 #435 #436 #438 #440 #441) を巻き戻さない。本 PLAN の実装は
新規 mint から適用され、既に close した review の receipt を無効化しない。
