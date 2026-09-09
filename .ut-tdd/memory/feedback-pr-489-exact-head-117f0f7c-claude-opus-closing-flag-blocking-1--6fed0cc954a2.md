---
memory_id: memory:feedback:pr-489-exact-head-117f0f7c-claude-opus-closing-flag-blocking-1--6fed0cc954a2
kind: feedback
title: "PR #489 exact-head 117f0f7c Claude Opus closing FLAG blocking 1"
tags: ["claude-review", "closing-verdict", "pr"]
updated_at: 2026-08-31T05:57:40.613Z
---

# PR #489 non-author Claude Opus closing verdict

- exact_head: `117f0f7c892a8398adc5076356c2015b1c8adc9b`
- base: `7cc607722ef78340c4b71020d38b04e8bc10f1da`
- reviewer: Claude Opus (non-author closing gate)
- prior_receipt: FLAG/2 `98728043301d64c477f429bfc8bdc837fed17842ffd78e95a765269348264b94` (at 0baf7570, NOT reused)
- verdict: FLAG
- blocking: 1

## 先行 blocker の解消確認 (both closed)

- B1 (L5/L6/L8 が attested D0 を要求したままで legacy 例外を宣言していない):
  L5 `internal-processing.md:473-484` が `NODE-SLICE-LEGACY-BACKFILL-REGISTRY-v1` を
  別 registry として宣言、L6 `function-spec.md:2245-2251` が例外節を追加、
  L8 `CAND-CUTOVER-106` (346 行) も別 case として更新済み。→ closed.
- B2 (L7:2125 が attestation binding を落としつつ unsigned/self-hash/forged を negative に残し
  oracle が反証不能):
  L7:2126-2131 が通常 D0 case と legacy backfill case を分離し、legacy 側は
  「unsigned/self-hash/forged を主張せず」固定 source/merge SHA・4 command ID・4 path・
  blob/content digest・record/receipt digest・command authority・receipt producer の
  各 mutation を個別 negative にした。→ 判別 field を持つ negative になり closed.

## blocking 1: legacy backfill registry が F0a 半分を宣言していない (層間矛盾の再発)

`docs/test-design/harness/L8-integration-test-design.md:346` (本 delta で編集) と
`docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md:247` (同) は

> #484 だけが `NODE-SLICE-LEGACY-BACKFILL-REGISTRY-v1` の Git 固定
> `LegacyD0TrackedReceiptSetV1` exact 1 から **D0/F0a 二 receipt** を atomic・exactly once 生成する

と述べる。しかし本 delta が L5 へ追加した当該 registry は **D0 入力行しか宣言していない**
(`internal-processing.md:477-478`「このregistryのD0入力は `LegacyD0TrackedReceiptSetV1` exact 1」)。
L6 `function-spec.md:2248` も mint 対象を `LegacyD0AdmissionBackfillReceiptV1` 単体としている。

一方 `PLAN-L6-93-node-bootstrap-contract.md:174-178` は F0a 側 receipt
`LegacyF0aCustodyBackfillReceiptV1` の入力を F0a source HEAD `76d0f9c72...` / merge
`12aadde9f...` / PR #192 non-author PASS receipt / toolchain-lock custody evidence digest と
規定しており、これらは `LegacyD0TrackedReceiptSetV1` に含まれない。L7:2131 も F0a 側 legacy
positive は別 artifact `LegacyF0aBackfillBundleV1` を使うとしている。

したがって L8/PLAN-L7-458 は「L5 が含まないと定義した入力集合」から F0a receipt が導出されると
主張しており、#484 admission kernel は F0a legacy 行の trust root を自分で選ぶことになる。
これは先行 FLAG の B1 と同一 defect class が F0a 半分に残置された状態である。

### 修正方向 (どれか一つで足りる)

1. L5 `NODE-SLICE-LEGACY-BACKFILL-REGISTRY-v1` に f0a 行を追加し、入力を
   `LegacyF0aCustodyBackfillReceiptV1` の固定 tuple (PLAN-L6-93 §3.2) として宣言する。
   併せて L6 の mint 対象を二 receipt へ拡張する。
2. あるいは L8:346 / PLAN-L7-458:247 の文言を
   「`LegacyF0aBackfillBundleV1` (D0 set + F0a 固定 tuple) から二 receipt」へ訂正し、
   L5 registry が D0 入力のみを所有することを明示する。

## non-blocking

- L5 の新規段落が `AttestedTrackedReceiptRecord` wrapper 記述の**途中**に挿入されており、
  直後の「`tracked_record_digest` は embedded ... exact 一致」「D0 graph へ 4 wrapper を格納し、
  unsigned/self-hash-only/forged/untrusted ... を拒否する」の係り先が legacy 段落と隣接して
  読みにくい。legacy set は `exact 1` (4 行) で wrapper ではないため厳密には曖昧でないが、
  本 PR の主題が両 route の分離である以上、段落順を wrapper 記述完了後へ移すのが望ましい。
