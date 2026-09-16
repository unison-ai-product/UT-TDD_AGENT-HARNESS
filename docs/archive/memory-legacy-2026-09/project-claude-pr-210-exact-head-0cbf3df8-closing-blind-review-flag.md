---
memory_id: memory:project:claude-pr-210-exact-head-0cbf3df8-closing-blind-review-flag
kind: project
title: "PR 210 exact head 0cbf3df8 Claude closing blind review — FLAG"
tags: ["blind-review", "cross-review", "flag", "foundation", "github", "pr-210"]
updated_at: 2026-08-03T03:10:00.000Z
---

PR #210 (GitHub Forward Foundation A) の closing blind review 結果。
**exact HEAD `0cbf3df8190f26e16e54b1acb1ea8b0c61926c78`** に対する verdict。
旧依頼 (exact a5337a9c) は head 移動により supersede、現 head で再判定した。

## Verdict: FLAG

- レーン A (claim-blind、対 PLAN-L7-471 / L7 test design §U-GHPROJ/U-GHBIND): **FLAG** (Important 1 件生存)
- レーン B (spec-blind、内部健全性): **PASS**
- 実測: `tests/github-*.test.ts` 5 files / 47 tests green + 隣接 7 files / 168 tests green (計 215/215)、`tsc --noEmit` exit 0。blind packet 内の著者所感 doc は不読で除外。

## 生存した Important (merge block 理由)

**required check 正規化の `NEUTRAL→成功` が unspecified かつ未テストの fail-open 境界**
(`src/github/repository-bindings.ts:62,74` @0cbf3df8)。

反例: `statusCheckRollup=[{name:"harness-check", conclusion:"NEUTRAL"}]` (skip された
workflow は NEUTRAL を返し得る) → `requiredCheck=成功` となり、他条件成立時に merge
closure receipt が発行される。spec (PLAN-L7-471 §3「required harness-check…成功」) は
provider conclusion 対応表を定義しておらず、「成功 = SUCCESS のみ」の読みでは違反。
`tests/github-repository-bindings.test.ts` に NEUTRAL/SKIPPED ケース無し (grep で確認)。

**要求**: NEUTRAL を成功から除外 (1 行) + 回帰テスト 1 件、または spec 側で
NEUTRAL=成功 を明示採択 (plan revise)。是正後、新 exact HEAD で再依頼を。

## Minor (block しない)

1. review 差替えの旧 receipt 採用は exactly-once frontmatter 再照合で拒否されることを
   引用反駁済み。ただし PASS entry を残したまま FLAG entry を**追記**した場合は closure が
   進む (canonical frontmatter が PASS を保持し続ける状態なので spec 違反ではないが注記)。
2. Project field 名重複は Map last-wins で決定的 (spec 要求は欠損 fail-close のみ)。
3. `canonicalFieldValues` の suffix ヒューリスティックは現行 14 field 閉集合内で衝突なし。

## 反駁済み攻撃 (再検不要の根拠)

status-only completion / 手動 check・review・merge 注入 / stale revision・HEAD /
binding identity 再割当 / closure evidence 型・単調性 / truncation 1000 fail-close /
Issue 必須化 / dry-run read-only / 並行 PR evidence 収束 / tx 原子性 / 冪等性 —
いずれもコード引用 + U-GHPROJ/U-GHBIND 系テスト green で反駁。
