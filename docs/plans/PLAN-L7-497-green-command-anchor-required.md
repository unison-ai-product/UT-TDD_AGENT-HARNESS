---
plan_id: PLAN-L7-497-green-command-anchor-required
title: "PLAN-L7-497 (add-impl): green_command の anchor_commit を全 entry で必須化する (issue #191)"
kind: add-impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-08-21
updated: 2026-08-21
owner: PO / Claude
github_issue_id: 191
parent_design: docs/design/harness/L6-function-design/review-evidence.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: aim
    slot_label: "AIM - 『いつから必須か』の判定入力を自己申告値に置かない境界の確定"
  - role: qa
    slot_label: "QA - missing_anchor_commit / invalid_anchor_commit の 2 面と、既存 entry の全件通過を実測する"
generates:
  - artifact_path: docs/plans/PLAN-L7-497-green-command-anchor-required.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/review-evidence.ts
    artifact_type: source_module
  - artifact_path: tests/review-evidence.test.ts
    artifact_type: test_code
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-303-digest-commit-anchor.md
  requires:
    - PLAN-L7-303-digest-commit-anchor
  blocks: []
  references:
    - docs/plans/PLAN-L7-108-review-green-command-evidence.md
    - docs/plans/PLAN-L7-132-green-command-digest-integrity.md
    - docs/plans/PLAN-L7-194-green-command-digest-hard-gate.md
    - docs/plans/PLAN-REVERSE-497-green-command-anchor-backfill.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/191
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence: []
---

# PLAN-L7-497: green_command の anchor_commit 必須化

## 1. 動機と、これが新契約である理由

`anchor_commit` を持たない `green_commands[].output_digest` は **working tree の現在値**と照合される
(`src/lint/green-command-digest.ts` の二層照合。anchor があればその時点の blob、無ければ現在値)。
したがって **無関係な PR が同じ `evidence_path` に触れた瞬間に不一致になる**。証跡の内容は正しいのに
落ちるため、「digest を現在値へ書き換える」という**誤った直し方**を誘発し、証跡が測定時点ではなく
現在の状態を指すようになる (issue #191、2026-07-29 に 3 件連続発火)。

`PLAN-L7-303` が anchor 方式を導入し、`digest-migrate --execute` で既存 772 件へ back-fill 済みである。
**運用としては既にほぼ全件が anchor を書いており、欠けているのは gate だけ**である (main `5604874b` 実測:
`green_commands` entry 980 件中 anchor 付き 972 件 = 99.2%、形式外 0 件)。

本 PLAN が追加するのは「anchor 無し entry を violation にする」という**新しい fail-close 条件**である。
これは lint 内部の診断区分ではなく、**以後すべての PLAN 著者が満たさねばならない記入契約**であり、
consumer 契約面が動く。よって `kind=impl` の単純修理ではなく `kind=add-impl` として Reverse 対
(`PLAN-REVERSE-497`) を持つ。非著者 reviewer が exact HEAD `9f2089d1` に対して同旨の FLAG を出しており
(canonical receipt `44239beb5312257c`)、本 PLAN はその是正である。

## 2. 設計判断 (freeze)

### 判断点: 「いつから必須か」を何で判定するか

| 案 | 内容 | 判定 |
|---|---|---|
| A | `completed_at` が発効時刻 (`2026-08-20T00:00:00Z`) 以降の entry だけ必須 | **撤回** |
| B | **全 entry で必須**にする | **採択** |
| C | baseline 集合を持ち、既知の anchor 無し entry を明示的に免除する | 不採択 |

**A を撤回した理由 (非著者 FLAG B-1)**: `completed_at` は **書き手の自己申告値**である。発効時刻より前の
日時を書くだけで gate を迂回できるため、fail-close として成立しない。「新規だけ必須」という一見穏当な
段階導入が、実際には**迂回可能な gate**を作る。

**B を採る理由**: 実測で anchor 無しは 8 件しか無く、その 8 件は本 PR で anchor を補える。全 entry 必須なら
判定入力が **PLAN 本文の存否**だけになり、自己申告値に依存しない。

**C を採らない理由**: baseline 集合は「縮小を忘れると死蔵する」既知の失敗形であり (issue #209 の
自己 supersede 7 件が現に死蔵している)、8 件のために新しい死蔵候補を作る割に合わない。

### 判断点: anchor の形式

`^[0-9a-f]{7,40}$` (short/full の git object name) のみを認める。`main` のような**可変参照を anchor と
認めない** — 可変参照では「測定時点の固定」という目的そのものを達成できない。

### 判断点: anchor の実在検査は行わない (撤回済み)

当初は anchor commit が repo に実在するかを検査したが、**squash merge 運用では判定不能**であり実測で
29 件の false positive を出したため撤回した (HEAD `9f2089d1`)。実在検査は issue #367 の守備範囲とし、
本 PLAN では形式検査までに留める。

## 3. 実装契約

`greenCommandViolationReason` に 2 つの violation reason を追加する:

| reason | 条件 |
|---|---|
| `missing_anchor_commit` | `anchor_commit` が無い / 空白のみ |
| `invalid_anchor_commit` | `anchor_commit` が `^[0-9a-f]{7,40}$` に一致しない |

既存の `green-command-digest` 側の判定 (anchor があればその時点の blob と照合、無ければ working tree)
は**変更しない**。本 PLAN は「anchor を書かせる」側だけを締める。

## 4. 受入条件

1. anchor を持たない green_command entry を含む PLAN で doctor が fail-close する。
2. anchor が `main` 等の可変参照である entry で doctor が fail-close する。
3. **main の既存 entry 全件が本変更後も通過する** (実測で確認する。prose の claim で代替しない)。
4. doctor の出力文言が実装の判定条件と一致する (段階導入を撤回したので「2026-08-20 以降」表記を残さない)。

## 5. TDD と trace

oracle は `docs/test-design/harness/L7-unit-test-design.md` §1.15 の **U-REVIEW-009〜013** として宣言し、
`tests/review-evidence.test.ts` の同名 `it` が実体である (test-label 双方向 citation)。

| U-ID | 何を殺すか |
|---|---|
| U-REVIEW-009 | 発効時刻より前の `completed_at` を自己申告して anchor 必須を迂回する経路 |
| U-REVIEW-010 | `anchor_commit` 欠落 |
| U-REVIEW-011 | 正常な git object name を誤検知しないこと (過検知回避) |
| U-REVIEW-012 | `main` のような可変参照を anchor と認めてしまう経路 |
| U-REVIEW-013 | 既存 corpus を壊す変更 (実 repo ガード) |

```
node node_modules/vitest/vitest.mjs run tests/review-evidence.test.ts
```

## 6. 実装先行の記録

実装 (`src/lint/review-evidence.ts` / `tests/review-evidence.test.ts`) は本 PLAN 起票に先行して
PR #361 で書かれた。通常の「事前 freeze 済み」ではない。非著者 closing review の FLAG を受けて
owning PLAN と Reverse 対を後追いで正規化したものであり、この事実を隠さず記録する。
