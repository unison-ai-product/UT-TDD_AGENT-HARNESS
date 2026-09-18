---
memory_id: memory:project:claude-pr-197-exact-head-f4fbfa90-artifact-final-review-request
kind: project
title: "PR #197 FLAG attack 2/3 修正済み — artifact 固定 HEAD f4fbfa90 の非 author review 依頼 (二段階解法の段階 1)"
tags: ["blocking", "codex", "cross-review", "exact-head", "issue-149", "pr-197"]
updated_at: 2026-07-30T19:35:00+09:00
---

# PR #197: FLAG 3 件の処理状況と HEAD X (`f4fbfa90`) の review 依頼

前提: `project-pr-197-exact-head-2f481a13-closing-blockers` (Codex FLAG、attack 3 件) と、同 PR
コメントで Codex が受理した**二段階解法** (artifact 固定 HEAD X で非 author review → PASS/CI/digest を
evidence-only commit Y へ追記 → Y で CI 再取得 → metadata 差分と blob 同一性に対する最終 closing review。
別 ownership PLAN / 新規 PR は不要)。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/197
- **HEAD X = `f4fbfa90`** (artifact 固定。これ以外の HEAD への verdict は無効)
- 直前 HEAD `2f481a13` は FLAG 済みで失効

## attack 2 (oracle exact 集合) — 修正済み

`freezeRows` を `Set` 化してから突合していたため**重複 oracle が無音で吸収**され、重複行を足しても
doctor が green になり得た。生の行列で出現回数を数え、`IT-RGK-PHYS-001..042` の exact 集合検査
(欠番 / 未知 ID / 重複) を `ok` 条件に加えた。`EXPECTED_ORACLE_IDS` は契約側 `C-RGK-01..58` と同じ
導出方式 (`Array.from`) で生成する。

## attack 3 (lane 分布) — 修正済み

L8 §freeze 属性節の散文再掲一覧 (`- \`mock\` 27 件: \`001\`、…`) と実 runner 合計宣言
(`\`real-OS\` 6 件 + \`mock+real-OS\` 9 件 = 15 件`) を parse し、表の `lane` 列と**集合として**突合する
(`parseLaneDeclarations` / `parseRealRunnerTotal`)。宣言と表のどちらか片側だけの書き換えは赤。
さらに宣言の**削除**も violation にし (検査を消して通す fail-open を作らない)、
実 runner lane 合計 0 件 = 全 mock 化は confirmed 昇格条件を消すため構造的に不正として落とす。

## attack 1 (review_evidence の被覆) — 段階 2 で処理

指摘は認めた。Codex 受理の手順に従い、本 HEAD X の PASS + CI run + artifact digest を
**evidence-only commit Y** で `PLAN-L7-469` の `review_evidence` へ追記する。X→Y で artifact blob が
同一であることを PR 上で明示し、Y の CI 再取得後に最終 closing review を依頼する。

## 追加した機械証跡 (prose 主張ではない)

- `U-RGKPAIR-007`: oracle 側の重複 / 欠番 / 未知 ID を synthetic に混入させて fail-close を確認。
- `U-RGKPAIR-008`: lane 反転 (1 行) / 表と宣言を同時に全 mock 化 / 宣言削除の 3 経路。
- `U-RGKPAIR-009`: **doctor 配線経路**の green + 負 test (重複行注入 / 全 mock 化 / doc 不在)。
  負 test は temp repo へ実 doc を写して改竄する形で、analyzer 直呼びではなく
  `checkResourceKernelPairMapping` を通す。
- ローカル実測: `bun x tsc --noEmit` exit 0、`bun src/cli.ts plan lint` green (checked=849)、
  doctor gate 単体の green/violation を実 doc + 改竄 doc で確認。
  **公式 snapshot runner は Windows で無出力ハングするため targeted テストのローカル green は無い**
  ([[feedback-official-vitest-snapshot-runner-hangs-after-test-child-start-on-windows]])。
  テスト実測は CI の Linux/Windows leg を正本とすること。

## 依頼事項

HEAD X `f4fbfa90` に対する claim-blind / spec-blind の closing cross-review を返してほしい。
verdict が返るまで merge しない (incident #189 の再発禁止)。attack 2/3 の修正が
**指摘の意味を満たしているか** (件数の丸め・検査の抜け穴・doctor 経路の空振りが無いか) を主眼に。
