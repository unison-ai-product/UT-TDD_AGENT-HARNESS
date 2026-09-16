---
memory_id: memory:feedback:flag-pr-358-exact-head-bb857f14-l6-freeze
kind: feedback
title: "FLAG PR 358 exact HEAD bb857f14 L6 freeze"
tags: ["flag", "issue-357", "pack-isolation", "plan-l6-101", "pr-358", "verdict"]
updated_at: 2026-08-20T09:00:22.711Z
---

Claude (claude-opus-5) が PR #358 (Issue #357 / PLAN-L6-101 Pack 単独・2 consumer 隔離受入の L6 freeze) の非著者 closing review を exact HEAD bb857f1476c86ef97afd47c91e9d5d2ac4f7ee60 で実施し FLAG (blocking 2) を返した。verdict: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/358#issuecomment-5353709548 merge はしていない。

B-1 (blocking): frontmatter が requires 空で Issue #357 の AC-3 「requires を明記する」を満たしていない。PLAN-L7-492 (PF-5) は status confirmed であり、本 PLAN §1.4 が「受入入力は PF-5 が成功として返した sealed release artifact だけ」と書く硬い依存なので requires へ置ける。references 止まりでは dependency_edges に依存辺が立たず影響範囲判定の入力にもならない。PLAN-L6-63 と PLAN-L7-473 は draft なので references のままで正しく、移すべきは PLAN-L7-492 の 1 件だけ。

B-2 (blocking): consumer 側が artifact digest を独立に再計算するのか PF-5 の receipt / attestation の申告値を信用するのかが契約に書かれていない。CANDIDATE-PACKISO-006 は digest mismatch で fail-close を Green oracle にしているが、後者なら receipt の digest 欄を書き換えれば mismatch が消えるので oracle が何も固定しない。方式判断を freeze で決めずに実装 PR へ残すと実装側が発明することになる。同型の欠陥が同日 merge の PR #354 で実際に起きており、evaluateTopologyMigration が after 側 digest を自己申告のまま信用していて forged report が accepted true になることを実測して blocking を立てた前例がある。§1.4 か §3 に一文足せば閉じる。

非 blocking 3 件: F-1 §2 のシナリオ表と CANDIDATE-PACKISO-001..006 の対応が 1:1 でなく (独立導入は 002、source 不在が 001) 対応列が無いため昇格時に取り違えうる。F-2 Issue #357 の成果目標が「同時並行運用」なのに §2 の 6 シナリオは全て逐次で、A の upgrade 中に B を実行する Red 入力が無い。F-3 parent_design の PLAN-L6-63 が draft のまま (gate 違反ではないが祖先契約が未凍結)。

誤読の注意として記録する: git diff origin/main bb857f14 の 2 点比較だと U-WTTOPO-013/018 を CANDIDATE へ差し戻しているように見えるが、これは #354 merge で main が進んだことによる見かけである。merge base 5b78676b からの 3 点比較では 126 insertions / deletion 0 で差し戻していない。PR レビューで基準点を取り違えると存在しない blocking を立てるので、必ず三点比較 (origin/main...HEAD) を使う。

PASS 側として独立確認した事実: exact HEAD で node src/cli.ts plan lint を自分で実行し plan-schedule / plan-governance とも checked=886 で OK。route certificate は src/schema/route-filing.ts:94 の add-feature が allowed_kinds add-design / layer_band L3-L6 を許すので妥当で、Reverse 対の義務は add-impl のみのため不在は規約どおり。generates が自 PLAN doc だけなので draft 規律も満たす。
