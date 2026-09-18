---
memory_id: memory:feedback:pr-338-at-2028ab73-ci-red-root-cause-is-unpinned-headsnapshot-callsite-count-and-windows-ci-excludes-doctor-test-ts-so-the-order-regression-cannot-be-caught-by-green
kind: feedback
title: "PR 338 at 2028ab73: CI red root cause is unpinned headSnapshot callsite count, and Windows CI excludes doctor.test.ts so the order regression cannot be caught by green"
tags: ["ci-red", "doctor", "issue-314", "plan-l7-455", "pr-338", "test-exclusion"]
updated_at: 2026-08-19T03:16:39.469Z
---

PR #338 exact HEAD 2028ab735183d83807b6f3ed2c52b64d260a3346: 依頼側が「CI 赤のため closing review 依頼は保留」へ切替 (operation pr338-ci-red-2028ab73-handoff)。Claude は closing verdict を出さず、CI 赤の根因実測のみ返した。run 32210814628 は Linux / Windows / aggregate 全 FAILURE。

CI 赤の根因 (実測、1 件): doctor lane の "test-repository-isolation - violation: callsite-drift:tests/doctor.test.ts:head_snapshot:expected=18:actual=20"、および Windows vitest の "FAIL tests/doctor-test-repository-isolation.test.ts > U-TESTHYGIENE-015" (AssertionError: expected false to be true)。Windows は Test Files 1 failed / 262 passed、Tests 1 failed / 2916 passed。原因は U-CIPOL-027 が headSnapshotRoot() callsite を 2 件増やしたのに pin が未更新であること。pin は src/doctor/test-repository-isolation.ts:84 の mode_calls: { head_snapshot: 18, isolated_fixture: 8 }。

重要: この callsite-drift violation は**旧 HEAD 7850143b の CI ログにも既に出ていた** (grep -c callsite-drift /tmp/j338.log = 1)。依頼側の診断「prior CI failure was traced to duplicate ownership」は不完全で、旧 HEAD には violation が 2 件あり片方 (duplicate-artifact-ownership) だけを是正したため全 job が再度赤になった。

是正時の罠: src/doctor/test-repository-isolation.ts は PLAN-L7-421-test-hygiene-live-tree-fence.md:36 の generates が所有している。pin 更新のために PLAN-L7-455 の generates へ同 path を追加すると、直前に是正した duplicate-artifact-ownership と同型の gate で再度落ちる。

旧 HEAD で出した blocking B-2 / B-3 は新 HEAD 2028ab73 でも成立 (isolated worktree で PR head の実ソースを実測): selectDoctorCheckDefinitions(defs,"full") の戻り順は definitions 順と一致せず (defs 102 / FULL_DOCTOR_OUTPUT_IDS 102、集合一致・順序相違)、tests/doctor.test.ts:1718-1720 の toEqual(checkIds) は不成立。実行順では review-evidence idx 58 / pair-freeze idx 6 で順序意図が反転する。

さらに判明した重大点: **CI はこの回帰を検出できない**。package.json の test:fast が `--exclude tests/doctor.test.ts` を含み、harness-check.yml の Windows leg (L219) は test:fast を、Linux leg (L139) は npm run test を走らせる。Windows 面では doctor.test.ts が除外されるため、B-2 の assertion 破れは Windows CI green では clear されない。「CI 3 jobs Green なら blocking 0」という依頼側の判定条件は、この test に関しては成立しない。

教訓: CI の green を「全テストが通った」と読んではならない。exclude list を持つ lane (test:fast) がある repo では、変更した既存 assertion がその lane から除外されていないかを確認してから green を根拠にする。今回は変更対象そのもの (doctor.test.ts) が Windows lane の除外リストに載っていた。
