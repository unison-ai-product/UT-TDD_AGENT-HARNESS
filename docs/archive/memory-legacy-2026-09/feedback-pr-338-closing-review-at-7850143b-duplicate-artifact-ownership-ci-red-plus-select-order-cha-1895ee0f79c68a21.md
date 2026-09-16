---
memory_id: memory:feedback:pr-338-closing-review-at-7850143b-duplicate-artifact-ownership-ci-red-plus-select-order-change-breaks-existing-registry-order-invariant
kind: feedback
title: "PR 338 closing review at 7850143b: duplicate artifact ownership CI red plus select order change breaks existing registry order invariant"
tags: ["ci-red", "doctor", "issue-314", "plan-l7-455", "pr-338", "review"]
updated_at: 2026-08-19T03:10:05.101Z
---

PR #338 (issue #314 / PLAN-L7-455 doctor profile outputIds 束縛) exact HEAD 7850143b860355a58311b9502472c794eb8180cb に対する Claude non-author closing review: FLAG (blocking 4 / advisory 2)。closing PASS 不成立、merge 未実施。CI は exact HEAD で harness-check-linux fail (run 32210497934 / job 95942095434)、harness-check-windows pending。

blocking B-1 = CI red の実体は doctor gate 行 "deliverable-plan-trace - violation: duplicate-artifact-ownership src/doctor/runner.ts"。PLAN-L7-455 の generates へ src/doctor/runner.ts を追加したが、当該 path は既に PLAN-L7-374-doctor-runner-definition-modules.md:29 の generates が所有 (grep 実測で hit は L7-374 のみ、L7-423 は本文言及)。最小是正は L7-455 から外すこと。所有移転なら supersedes + 相互 back-reference が必要。

blocking B-2 = 既存の registry 順序不変条項 tests/doctor.test.ts:1705-1707 (selectDoctorCheckDefinitions(definitions,"full") == definitions.map(id)) が本 delta で落ちる。select() の戻り順を definitions 順から outputIds 順へ変えたため。実測: definitions(full) 102 件と FULL_DOCTOR_OUTPUT_IDS 102 件は集合一致・順序は index 6 から相違 (defs: review-evidence / out: pair-freeze)。著者の証跡が「full doctor.test.ts は共有資源飽和で hard cutoff、件数は主張しない」とした範囲がまさに回帰の在り処で、-t "U-CIPOL-027" 単体走行では到達しない。

blocking B-3 = scope=full の実行順が definitions 順から outputIds 順へ暗黙変更され、宣言意図が実行面で反転する。実測: 新実行順は pair-freeze idx 6 / review-evidence idx 58、definitions 順は review-evidence idx 6 / pair-freeze idx 7。tests/doctor.test.ts:1721 が表す review-evidence→pair-freeze の順序意図は実行面で逆転し、かつ definition.requires に encode されていないため (requires ベース違反は実測 0 件) 機械が守らない。requires へ encode するか、実行順は definitions 順固定で envelope 順だけ outputIds に合わせる。

blocking B-4 = envelope の checks が outputIds 由来、checkIds が selectedDefinitions 由来で正本が 2 系統。未解決 outputId があると checks に合成 ok:false が入る一方 checkIds から脱落し length/集合が乖離する (fail-close 経路そのもの)。profile の outputIds が全て definition へ解決することを保証する gate は無く、:1703 の arrayContaining は full registry 用で profile 単位を見ていない。最小是正は checkIds: [...outputIds] 一本化 + 全 profile の解決性を registry テストで fail-close。

advisory: (A-1) Windows CI 未完のため是正後も別途 green 取得が必要。(A-2 process) U-CIPOL-027 は追加振る舞いだけを固定し、変更した既存振る舞い (full lane の選択順) を固定していない。resource 飽和で full suite を測れないときは影響する既存 assertion を名指しで 1 件走らせる方が安全。

配送面の観測: この依頼の inbox entry は targetWorkspaceId=2aaf6039... で、本セッションの workspace id 690a776d... と不一致のため Stop hook では配送されなかった。inbox dir (.git/ut-tdd-runtime/claude-memory-wake/inbox) を直接見て発見した。他 workspace 宛の未配送 entry が 69 件滞留しており、うち PR #299 / #319 のように既に閉じた PR 宛のものも scan 対象に残る。

教訓: 既存関数の戻り「順序」を変える delta は、集合を見るテストでは捕まらない。順序意図が requires 等の機械契約に encode されていない場合、定義順に依存した既存 assertion が唯一の守りであり、そこを走らせずに単体テストだけで green を主張すると回帰が通る。
