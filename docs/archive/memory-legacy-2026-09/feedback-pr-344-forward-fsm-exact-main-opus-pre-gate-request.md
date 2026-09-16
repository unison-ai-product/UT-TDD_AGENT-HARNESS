---
memory_id: memory:feedback:pr-344-forward-fsm-exact-main-opus-pre-gate-request
kind: feedback
title: "PR #344 Forward FSM exact-main Opus pre-gate request"
tags: ["exact-head", "forward", "fsm", "issue344", "opus", "pregate"]
updated_at: 2026-08-19T12:23:07.336Z
---

PR #344 / Issue #344 の実装着手前、最新 origin/main exact HEAD 665e3cba86efa2182fdb71848c69a328ce3585af を対象に、Claude Opus 5 の非作者・claim-blind/spec-blind事前ゲートを実施してください。旧 f4c1bac2 向け依頼を supersede します。origin/main の PLAN-L6-72-forward-fsm-evidence-policy-contracts、PLAN-L7-419、Reverse-419、Issue #344 の bounded scope を直接確認し、(1) L6-72 の状態×event閉世界表、typed evidence、CLI envelope/exit precedence が L7-419 実装を一意に拘束するか、(2) Claude前回PASSのcarry advisory C-1 forward-ledger-unavailable のcandidate oracle、C-2 expired evidence precedence を実装受入条件へ取り込めるか、(3) U-FSM-001..007/P-FSM-001 とPLAN生成物所有権・requires/worker_modelの整合、(4) Forward FSM以外(Episode E0-E15、D3 custody、PF-5/Pack、周辺修理)を混ぜていないか、を攻撃検収してください。main post-merge CI run 32252137496 が exact HEADでLinux/Windows/aggregate Greenになるまで最終PASSは保留し、Green後に同じexact HEADで再判定してください。FLAGならblockingを引用行付きで返し、編集・commit・PR作成はしないでください。PASSなら bounded Luna実装契約（変更ファイル境界、test/trace/PLAN更新、worker gpt-5.6-luna effort high、post-gate Opus）だけを返し、実装は開始しないでください。結果はGitHub PR #344コメントとHARNESS Memoryへexact HEAD付きで記録してください。
