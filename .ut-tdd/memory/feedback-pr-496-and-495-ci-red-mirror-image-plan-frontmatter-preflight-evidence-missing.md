---
memory_id: memory:feedback:pr-496-and-495-ci-red-mirror-image-plan-frontmatter-preflight-evidence-missing
kind: feedback
title: "PR 496 and 495 CI red mirror image PLAN frontmatter preflight evidence missing"
tags: ["ci-red", "plan-frontmatter", "pr"]
updated_at: 2026-08-31T06:43:26.190Z
---

# PR #496 exact-head `3ee19e6d` — closing review 保留、CI Red の原因は PLAN frontmatter 1 箇所

request `fdb5c7b9...` (2026-08-31T06:31:20Z) を受領しました。依頼は「required CI Green を
待ってから Claude Opus の非著者 closing review + canonical receipt」なので、
**CI が Green でない現時点では canonical receipt を発行していません**。

- `harness-check-linux` = **FAILURE** (run `33364094528` / job `99401079196`)
- `harness-check-windows` = FAILURE
- `harness-check` (aggregate) = FAILURE

## Linux 失敗の実因 (単一)

doctor step の exit 1 です。全 check のうち violation は 1 件だけでした:

```
doctor: review-evidence — ⚠ review 前置証跡なしで confirmed の design/impl PLAN 1 件
  (PLAN-L7-524-pack-consumer-generated-bun-removal):
  frontmatter review_evidence に reviewer/review_kind/verdict を記録 (review 前置 MUST、IMP-071)
```

`PLAN-L7-524` は `kind: add-impl` / `status: confirmed` でありながら
`review_evidence: []` です。confirmed の add-impl は前置証跡が MUST なので fail-close します。
`merged-plan-status` / `duplicate-artifact-ownership` / `impl-plan-trace` /
`green-command-digest` はいずれも OK でした。

## 直し方 — 私の closing review を待つ必要はありません

close gate が要求する「exact HEAD の非著者 closing review PASS + canonical receipt」と、
confirm が要求する「**preflight** review_evidence」は別物です
(`merged-plan-status` の是正手順が明示: 「これは merge 前に PLAN の review_evidence へ
書き戻す要件ではない」)。

したがって現 HEAD `3ee19e6d` で preflight を取り直し、
`reviewer` / `review_kind` / `verdict` / `tests_green_at <= reviewed_at` /
`green_commands` (kind/command/runner/scope/exit_code/completed_at/evidence_path/
output_digest/anchor_commit 完備) を `anchor_commit: 3ee19e6d…` へ束縛して 1 件記録すれば
Linux は通ります。closed #478 が持っていた entry は anchor が本 PR の履歴に無いため
そのままでは再利用できません。**空にするのではなく再 anchor** してください。

## 姉妹 PR #495 は鏡像のミスです

同じ再著者化で、#495 の `PLAN-L7-527` は逆方向に振れています:

| PR | PLAN | status | review_evidence | 失敗する gate |
|---|---|---|---|---|
| #496 | PLAN-L7-524 | `confirmed` | `[]` | `review-evidence` (前置証跡なし) |
| #495 | PLAN-L7-527 | `draft` | `[]` | `merged-plan-status` (draft × landing generates) |

正しい設定はどちらも同じ一点です: **`status: confirmed` + 現 HEAD へ再 anchor した
preflight `review_evidence` 1 件**。#495 は head を `0e607275` へ進めましたが
frontmatter は `draft` / `[]` のままで、同じ violation が再現しています。

## 内容面

CI Green 後に exact HEAD 全体を読んで canonical receipt を出します。
参考として、closed #478 (`8a7dd2c1`) に対しては blocking 0 / PASS-WEAK、
非 blocking 2 件 (doctor smoke の `wrapper-launcher-contract` が `windowsHide: true` の
assert を落としたこと、外側 process の signal 転送喪失) を出しています。
`3ee19e6d` がそれらを含む同一実体かどうかは Green 後に確認します。
