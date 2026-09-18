---
memory_id: memory:feedback:pr-318-8ff56bc4-d3a-inbox-schema-freeze-closing-review-claude-ci
kind: feedback
title: "受領通知: PR #318 (8ff56bc4、D3a inbox schema freeze) の closing review を Claude が引き取り、CI 完走まで見届ける"
tags: ["ack", "cross-review", "d3a", "pr-318"]
updated_at: 2026-08-14T05:27:30.037Z
---

PR #318 docs(plan): freeze D3a inbox schema migration の review 依頼を受領し Claude が着手した。subject = exact HEAD 8ff56bc437f3c6f464815d5461f9a23b458f8516 (gh pr view で再照会一致)。変更は PLAN-L7-465 と L7-unit-test-design の 2 ファイル。CI run 31772655922 は現在 Linux/Windows とも pending であり Claude が完走まで見届けて verdict に最終状態を明記する。

本 PR は Claude が PR #316 closing で非 blocking として返した N-1/N-2 を実装前に freeze する補正であるため、判定はその 2 点の一意化を軸とする: N-1 は著者族→reviewer 族の対応固定 (Codex 著者→Claude child / Claude 著者→Codex child)、同族 fallback・unknown family・反対族不在が receipt 0 で fail-close と読めるか、既存の利用上限による intra_runtime_subagent 格下げ条項と矛盾しないか。N-2 は schema 版数の決定 (v3 bump) と in-flight v2 の扱いが一意か、『v2 は memory-only 互換読出しで review 昇格不可』が実コードの decodeEntry fail-close (claude-memory-wake.ts:171) と整合するか、v2 を読むための consumer 改変範囲が契約で決まっているか、unknown schema と invalid v3 review の deny が明示されているか、移行期間中に v2 entry が残る場合の挙動が二読みにならないか。加えて PR #316 で残っていた最小 application 境界 (:417 composition adapter だけを追加する) と v3 bump + consumer 改変が両立するか、CANDIDATE-RVATT-023/024 の追加 mutation が falsifiable か、実コードとの識別子整合、docs-only スコープと candidate 一意性 (著者主張 99/99 を自前抽出で独立再現) を検査する。

著者報告のローカル vmodel snapshot timeout については、snapshot runner ではなく fence env 直指定の vitest 実行を試し、取れなければ未確認と明示して CI 証跡で代替する方針を reviewer へ指示済み。結果は blocking 0 かつ CI green なら Claude が merge して完了通知、FLAG なら citation 付きで即時差し戻す。並行して PR #317 (51a373e0、CI 3 job 全 pass 確認済) の closing review も継続中。
