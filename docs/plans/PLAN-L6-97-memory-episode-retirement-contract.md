---
plan_id: PLAN-L6-97-memory-episode-retirement-contract
title: "PLAN-L6-97 (add-design): 共有メモリの episode/durable 分類と回収契約"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-08-05
updated: 2026-08-05
owner: PO / TL
parent_design: docs/plans/PLAN-L6-68-memory-telemetry-lifecycle-contract.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: "TL - episode/durable 分類の境界と、doctor 検出を advisory に留める契約"
  - role: se
    slot_label: "SE - frontmatter 拡張と memory add / projection の後方互換"
  - role: qa
    slot_label: "QA - 未宣言 memory・bound_to 解決不能・オフライン時の oracle"
generates:
  - artifact_path: docs/plans/PLAN-L6-97-memory-episode-retirement-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-68-memory-telemetry-lifecycle-contract.md
  requires:
    - docs/plans/PLAN-L6-68-memory-telemetry-lifecycle-contract.md
    - docs/plans/PLAN-L7-189-shared-harness-memory-cross-runtime.md
  references:
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/175
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/187
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/227
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/236
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/242
    - docs/plans/PLAN-L7-392-memory-promotion-handover-digest.md
    - docs/plans/PLAN-L7-324-memory-compaction-trigger.md
github_issue_id: 175
backprop_decision: not_required
backprop_decision_reason: >-
  新規契約 (memory の lifecycle 分類と回収) の genesis 設計であり、既存実装を正本として設計へ
  引き戻す Reverse ではない。kind=add-design は KIND_BACKFILL 上も Reverse 対必須ではない
  ("none"、src/lint/backfill-pairing.ts)。add-impl へ降下する時点で再評価する。
review_evidence: []
---

# PLAN-L6-97: 共有メモリの episode/durable 分類と回収契約

## 0. 起票理由

issue #175 (2026-07-28) が「共有メモリに完了エピソードの回収機構が無い」と指摘した。8 日後の
2026-08-05 に PR #241 が未追跡 65 件の一括 commit を試み、**「完了済み PR の依頼を再配送する
行為であり #175 の意図 (回収) と逆行する」として blocking review で却下**された。

さらに同日、issue #228 の配送経路修正が入った直後、**滞留していた旧 backlog (merge 済み
PR #220 / #225 宛の依頼) が「新着」として Claude セッションへ replay された** (実測、本 PLAN
起票と同一セッション)。分類の無い配送は、経路を直すほど stale 依頼の再配送を悪化させる。

つまり現状は「溜まる機構も無ければ捨てる機構も無い」のではなく、**溜め続ける経路だけがあり、
それを止める判断基準が機械に存在しない**。基準が無いので、配送しても却下され、放置しても
`memory-sync` が赤になる。どちらも正しくない状態が固定している。

## 1. 実測 (2026-08-05、origin/main)

| 指標 | 実測 |
|---|---|
| `.ut-tdd/memory` 総数 | **139 件** |
| ファイル名に PR/issue 番号を持つ | **60 件 (43%)** |
| 参照先の distinct PR/issue | 37 件 |
| うち closed / merged | **35 件 (95%)** |
| 完了参照に紐づく memory ファイル | **63 件 (45%)** |

さらに 60 件のタイトルを分類した:

| 分類 | 件数 | 例 |
|---|---|---|
| レビュー依頼 / verdict / 再依頼 | 29 | 「PR #214 exact head 245d649c codex closing cross-review re-request」 |
| 依頼・所見・CI 赤の連絡 | ~23 | 「依頼: PR #104 クロスレビュー・マージ対応 (Codex 宛)」 |
| **永続教訓 (PR は根拠引用)** | **~8** | 「プルリク大量同時リクエスト禁止 (2026-07-14 の苦労)」「Incident: PR 210 が FLAG 未解消のまま merge された」 |

**「PR 番号を含む = エピソード」は成り立たない。** incident 記録と教訓は根拠として PR を引用する
のが正しい書き方であり、参照先が closed であることは stale の証拠にならない。ただし実測では
その割合は少数 (~8/60) であり、backfill は「実作業の大半」ではない。

## 2. 設計判断 (advisor 合意、2026-08-05)

`ut-tdd advisor --decision design --current-model claude-opus-5 --execute`
(provider=claude / model=`claude-fable-5` / effort=low / mode=adversarial、exit=0)。

### 選択肢

| 案 | 方式 | trade-off |
|---|---|---|
| **A (採択)** | frontmatter に `lifecycle: durable\|episode` と `bound_to: <PR/issue URL>` を足し、doctor が bound_to closed かつ未昇格の episode を検出する | 書き込み経路が `ut-tdd memory add` 単一路なので**宣言の存在と形式**は機械強制できる (分類の正しさ自体は作者申告のままで、機械が保証するのは「未分類の新規 memory が存在しない」こと)。既存 139 件は backfill が要る |
| B | フィールドを足さず、doctor がファイル名/本文の PR 参照を GitHub 状態と突合して警告する | 実測のとおり durable 教訓 (~8 件) を誤検知する構造的欠陥。警告がノイズ化すれば gate として死ぬ (fail-open 看板化) |
| C | レビュー依頼は memory ではなく既存 `.ut-tdd/review/requests` チャネルへ構造分離し、memory は永続教訓のみとする | PR #241 型の再発防止としては正しいが、**既存 63 件の backlog に何も作用しない**。新方式ではなく既存ルール (CLAUDE.md §Hybrid 協調) の再締結 |

### 採択: A。C は規律参照として併記し、機構は建てない

advisor の反論を受けて **freeze する契約点を 2 つ追加**する:

1. **doctor の検出は fail-open advisory + キャッシュ**。`bound_to` の closed 判定は GitHub API を
   要し、doctor は現状ローカル read-only singleton である。network 依存・rate limit・オフラインで
   doctor の性格を変えてはならない。解決不能は `unknown` として finding と区別する
   (#242 で学んだ「未評価と OK を混同しない」を踏襲)。
2. **backfill は別 PR**。`ut-tdd memory add` の CLI/schema 変更は memory projection (db rebuild) の
   契約変更であり pair-freeze 対象。実装 PR 内で発明しない (PR #219 の再発形を避ける)。

### advisor 推奨に対する実測差し戻し

advisor は B を却下する根拠として「63 件の PR 参照のうち**相当数**は永続教訓の出所引用」と
述べたが、タイトル分類の実測では **~8/60 (13%)** であり「相当数」は過大である。結論 (B 却下) は
変えない — 8 件でも誤検知すれば gate は信用を失うため — が、**backfill 工数の見積りは advisor の
「実作業の大半」より小さい**。この差は AC-4 のサンプリング要件で確定させる。

## 3. 契約 (freeze 対象)

1. **分類フィールド**: `lifecycle` は `durable` | `episode` の 2 値。`episode` は `bound_to` 必須。
   `bound_to` は GitHub の PR / issue URL とし、path や PLAN ID は取らない (解決可能性を型で担保)。
2. **既定値と後方互換 (既存分のみ)**: `lifecycle` 未宣言の**既存** memory (backfill 完了前の
   139 件) は `durable` として扱う。**不明を episode 側へ倒さない** — 誤って回収すると教訓が
   消えるためで、fail-safe の向きは保持側である。既存分の分類確定は AC-4 の backfill が行う。
3. **書き込み時の強制 (新規は宣言必須)**: `ut-tdd memory add` は **`--lifecycle` 省略で
   fail-close** し、`--lifecycle episode` は `--bound-to` 無しで fail-close する。
   **省略を durable へ倒すのは既存分の読み取り時だけであり、新規書き込みには適用しない** —
   さもないと「宣言しなければ検査の外」という回避経路が残り、案 A の採択理由 (単一経路での
   機械強制) が成立しなくなる (blind review FLAG 2026-08-05 の指摘 1)。機械強制されるのは
   宣言の存在と形式であり、分類の正しさ自体は作者の自己申告のまま — この残余は backfill
   (AC-4) と回収報告のレビューで補う、と明示しておく。
4. **回収判定**: `bound_to` が closed / merged かつ `lifecycle: episode` の memory を
   `retirable` として報告する。**削除は自動化しない** — 報告までを機構の責務とし、削除は
   人間または明示コマンドの操作とする。
5. **unknown の扱い**: GitHub 到達不能・URL 解決不能は `unknown` とし、`retirable` にも `ok` にも
   混ぜない三値。「判定できなかった」を「回収不要」と言わない。
6. **配送側の消費**: 即時配送 (claude-memory-wake) は `lifecycle: episode` かつ `bound_to` が
   **確定的に closed** の entry を**配送しない** (stale replay の抑止。2026-08-05 実測: #228
   修正直後に merge 済み PR #220/#225 宛の依頼 4 件が新着として replay された)。
   **`unknown` (GitHub 不達・URL 解決不能) は配送する** — 配送は message bus であり、生きた
   依頼を offline を理由に落とす方が stale replay より高くつく。抑止は「closed と確定した」
   場合に限る (doctor 三値の unknown を配送側では可用性側へ倒す。向きが doctor と逆になる
   理由ごと freeze する — blind review FLAG 2026-08-05 の指摘 2)。
7. **既存ルールとの関係 (C 相当)**: レビュー依頼・verdict・進捗連絡は `lifecycle: episode` で
   書くのではなく、そもそも `.ut-tdd/review/requests` / `receipts` へ置く。これは CLAUDE.md の
   「エピソード状態はメモリに書かず DB/HEAD 由来の digest に任せる」の再掲であり本 PLAN は
   新機構を作らない。

## 4. AC

- **AC-1**: `lifecycle` / `bound_to` の schema と既定値が L6 function-spec に記述され、
  `ut-tdd memory add` の引数契約と一致する。
- **AC-2**: doctor の回収検出が `retirable` / `ok` / `unknown` の三値で、GitHub 不達時に
  doctor 全体を fail させない (advisory)。オフライン実行の oracle を持つ。
- **AC-3**: `lifecycle` 未宣言の既存 139 件が `durable` 扱いになり、既存 db rebuild / projection が
  壊れない (後方互換の回帰網)。
- **AC-4**: backfill 対象の分類は**実測サンプリングを先行**させる。60 件全数のタイトル+本文を
  分類し、durable 混入率を数値で確定してから backfill PR を出す。本 PLAN では実施しない。
- **AC-5**: 削除は自動化されていないこと (報告のみ) をテストで固定する。
- **AC-6**: 新規 `memory add` の `--lifecycle` 省略が fail-close であり、既定値へ silent に
  倒れないことをテストで固定する (省略回避経路の封鎖)。
- **AC-7**: 配送側の三値の倒し方 (closed=抑止 / open=配送 / unknown=配送) がテストで固定され、
  doctor 側の unknown の扱い (retirable にも ok にも混ぜない) と**向きが逆である理由**が
  L6 function-spec に記述されている。

## 5. 設計と検証の対 (未実装 oracle は CANDIDATE 表記)

| CANDIDATE | 検証内容 | 期待 |
|---|---|---|
| `CANDIDATE-MEMEPI-001` | `lifecycle: episode` + `bound_to` 無し | fail-close (exit 1) |
| `CANDIDATE-MEMEPI-002` | `lifecycle` 未宣言の既存 memory | `durable` 扱い、projection 不変 |
| `CANDIDATE-MEMEPI-003` | `bound_to` が merged PR の episode | `retirable` |
| `CANDIDATE-MEMEPI-004` | `bound_to` が open PR の episode | `ok` |
| `CANDIDATE-MEMEPI-005` | GitHub 到達不能 | `unknown` (doctor は fail しない) |
| `CANDIDATE-MEMEPI-006` | `bound_to` が URL でない (PLAN ID / path) | 書き込み時に reject |
| `CANDIDATE-MEMEPI-007` | `retirable` 検出後にファイルが残存 | 自動削除されていない |
| `CANDIDATE-MEMEPI-008` | `lifecycle: durable` + `bound_to` あり (教訓の根拠引用) | `retirable` にしない |
| `CANDIDATE-MEMEPI-009` | closed 参照つき episode の即時配送 | 配送しない (stale replay 抑止) |
| `CANDIDATE-MEMEPI-010` | `bound_to` 解決不能 (unknown) な episode の即時配送 | **配送する** (message bus の可用性側へ倒す) |
| `CANDIDATE-MEMEPI-011` | 新規 `memory add` で `--lifecycle` 省略 | fail-close (exit 1、既定へ倒さない) |

`CANDIDATE-*` は未 freeze 候補であり実テスト citation として数えない。実装 slice 開始時に
Red test を追加してから `U-MEMEPI-*` へ昇格する
(`docs/test-design/harness/L7-unit-test-design.md` の CANDIDATE 節)。

## 6. 降下と非scope

- **降下先 (future add-impl)**: schema 拡張 + `memory add` 引数 + doctor check + 配送 filter +
  backfill の 5 slice。
- **非 scope**: 未配送 (untracked) の検出は #242 / `memory-sync` が所有する。本 PLAN は
  「届いた後に残り続ける」側だけを扱い、配送の穴を再実装しない。
- **非 scope**: `PLAN-L6-68` の memory 昇格 nudge (書かれなかったことの検出) と重複しない。
  本 PLAN は「書かれたものが完了後も残ること」を扱う逆向きの契約である。
