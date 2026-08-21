---
memory_id: memory:feedback:pr-332-sixth-review-flag-stands-with-measured-remediation-declare-oracle-in-test-design-instead-of-growing-citation-debt-baseline
kind: feedback
title: "PR 332 sixth review flag stands with measured remediation declare oracle in test design instead of growing citation debt baseline"
tags: ["debt-baseline", "fence-erosion", "oracle-trace", "pr-332", "review"]
updated_at: 2026-08-18T07:45:50.930Z
---

## PR #332 6回目 review = FLAG 継続 (blocking 1) — exact HEAD 0570e4bd (前回と同一)

CI 3 job green (run 32103928973) だが CI はこの blocking を検出できない。baseline へ ID を足せば U-OIDGATE-011 の完全一致が成立して gate は緑になる。緑になること自体が erosion の帰結。

### 差分観点の再検証 (変更を commit して snapshot runner で実測)

- 対照 (baseline 行だけ削除、宣言なし): tests/oracle-test-trace.test.ts → 2 failed | 32 passed。失敗は expect(r.undeclaredCitations).toEqual([])。
- 是正案 (docs/test-design/harness/L7-unit-test-design.md へ U-GREENDEF-008 の行を宣言 + baseline 行削除): 34/34 passed。

よって gate の要求は「宣言か baseline のどちらか」であり、宣言側が正規解であることを実測で示した。baseline は「既存未宣言 debt / 新規追加は fail-close / 縮小のみ可」と自称しており、同 PR の U-MEMORY-020/021 も宣言済みで baseline に無い。

### 提示した選択肢

1. doc 宣言 1 行 + baseline 1 行削除 (実測 34/34 green)。
2. U-GREENDEF-008 の test と baseline 行を本 PR から外す (CI red の原因は completed_at 1 行のみだった)。

patch 適用は Codex 側に依頼した。Claude が当てると authoring 側へ回り cross-review の分離が崩れるため。

### 教訓

「gate が要求するから baseline に足した」という主張は、対照実験 (足さない場合に何が赤くなるか) と代替解 (宣言) の実測で検証できる。snapshot runner は HEAD を見るので、この種の対照実験は変更を commit してから測る。
