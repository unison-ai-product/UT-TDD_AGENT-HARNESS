---
memory_id: memory:project:issue-209-blocked-by-redesign-supersede-contract
kind: project
title: "Issue 209 blocked by redesign supersede contract"
tags: ["blocked", "issue-183", "issue-209", "plan-admission", "plan-supersession"]
updated_at: 2026-08-20T09:35:43.777Z
---

issue #209 (自己 supersede 実データ 7 件の解消) は現行 gate では完了条件に到達できないことを実測で確定した。実装 PR は出していない。調査結果は issue へ投稿済み: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/209#issuecomment-5354060505

構造矛盾の実体。src/plan-admission/policy.ts:146 は routeMode redesign のとき supersedes.length === 1 を要求する。一方 src/lint/plan-supersession.ts は自己参照を violation とし PLAN_SUPERSESSION_SELF_BASELINE に 7 件を債務登録している。対象のうち admission_receipt を持つ 6 件は全て route_mode redesign なので、正規経路 ut-tdd plan revise で自己参照を外すと admission が plan-admission-redesign-supersede-required で必ず落ちる。6 件全てで一様に再現した (self は ADMISSION OK、removed は当該 violation、他 PLAN 指定は ADMISSION OK)。つまり自己参照は書き間違いではなく、差し替える別 PLAN が存在しない状況で redesign の 1 件必須を満たすための唯一の書き方になっている。issue #183 が可能性として挙げた「plan_id 粒度の lint が revision 粒度の意味論を表現できていない」が実測で裏付けられた。

issue #209 本文の前提を 1 点訂正した。7 件が top-level と receipt の双方に自己参照を持つとあるが、PLAN-L7-466-resource-kernel-native-companion は admission_receipt を持たない。src/schema/frontmatter.ts の一致検査は if (receipt) の内側なので、この 1 件だけは top-level の直接編集で消せる。対象は 7 件一律ではなく 6 件 + 1 件 (別経路) である。

advisor (gpt-5.6-sol, --decision implementation) の合議結果。案 A (revision 粒度で意味論を分離) を採択するが supersedes_revision 等の新フィールドは追加せず、既存の origin を revision lineage の正本として強化する。新フィールドは origin.plan_id/revision と情報が重複し二つの lineage が食い違う failure mode を作るため。案 B (実際に差し替えた別 PLAN を特定) の一律適用は棄却。PLAN-L4-02 / PLAN-L5-03 / PLAN-L6-01 は escape_reason が formal Forward metadata correction で origin と reentry も自分自身であり、別 PLAN を差し替えた証拠が無い。形式を満たすためだけに他 PLAN を指すと偽の errata edge と偽の back-reference を作る。案 C (redesign 自己参照の恒久 allowlist) は棄却で、自己参照は実在確認と back-reference 確認を自明通過し revision 単調性も内容差分も検査しないため fail-open の恒久化になる。errata の双方向性は同一 asset の旧 revision には適用できず、revision lineage は append-only ledger と receipt で検証し plan-supersession は別 PLAN の訂正だけを双方向検査する、という責務分割が筋になる。

実装前に閉じる必要がある点。redesign が必ず別 PLAN を置換するという L6 契約を変更してよいかは、U-PADM-006 が宣言済み oracle として supersede 対象を要求し (docs/test-design/harness/L7-unit-test-design.md:1730) tests/plan-admission.test.ts:74 に実テストがあるため、コードだけの修正は禁止で契約改訂 (pair-freeze) が先になる。origin の同一 asset / 直前 revision / 単調増加がどの層で機械検証されるかも未確定で、フィールドが在るだけでは案 A の代替証明にならない。

以上は L6 契約の改訂であり Forward レーンの所有物なので、Claude (issue 回収レーン) は実装 PR を出さない。契約が凍結されたら実装は引き受けられる。issue #209 の完了条件 2 (baseline を空へ) も改訂結果に合わせた更新が要る。
