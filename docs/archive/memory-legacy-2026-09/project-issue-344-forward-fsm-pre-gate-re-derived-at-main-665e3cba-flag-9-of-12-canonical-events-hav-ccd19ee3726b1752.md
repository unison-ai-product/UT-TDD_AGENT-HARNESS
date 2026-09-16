---
memory_id: memory:project:issue-344-forward-fsm-pre-gate-re-derived-at-main-665e3cba-flag-9-of-12-canonical-events-have-required-evidence-but-no-typed-rule-id-and-plan-l7-419-still-points-at-closed-issue-342
kind: project
title: "Issue 344 Forward FSM pre-gate re-derived at main 665e3cba: FLAG, 9 of 12 canonical events have required evidence but no typed rule ID, and PLAN-L7-419 still points at closed issue 342"
tags: ["exact-main", "flag", "forward-fsm", "issue-344", "plan-l6-72", "plan-l7-419", "pre-gate"]
updated_at: 2026-08-19T12:26:59.696Z
---

Issue #344 Forward FSM 実装 admission pre-gate の再導出。exact main = 665e3cba86efa2182fdb71848c69a328ce3585af (PR #346 merge 後)。**verdict = FLAG (blocking 2 / advisory 2)**。luna は起動しない。旧 f4c1bac2 向け判定を supersede する。編集 / commit / PR 作成なし。Issue comment https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/344#issuecomment-5342078658 に全文。

CI: main post-merge run 32252137496 は headSha=665e3cba 一致を確認したが in_progress。最終 PASS は Green 後という依頼だが、下記 blocking は CI 結果に依存しない (契約の欠落であって回帰ではない)。

## B-1 (blocking): 12 正規 event のうち 9 個が必須 evidence を持つのに欠落時の typed rule ID が無い

L6-72 全体の forward-* 識別子は 6 個で確定: forward-transition-illegal / forward-red-evidence-missing / forward-trace-freeze-missing / forward-accept-evidence-missing / forward-exception-context-missing / forward-ledger-unavailable。

一方 §1 の event 表は 12 正規 event すべてに「必須 evidence」列を与えている。typed code が対応するのは begin-implementation (red)、prepare-review (trace-freeze)、accept (accept-evidence)、例外 event (exception-context) の 3 event + 例外群のみ。**plan / prepare-pair-freeze / freeze-pair / freeze-red / complete-implementation / prepare-trace-freeze / freeze-trace / submit-review / archive の 9 event は欠落時 code が無い**。

§4 の envelope は ruleId を必須キーとして定義し (event / nextState すら null で省略しないと明記)、§3 は revision 不一致・期限切れ・producer 不許可・exit rule 不一致を eligible に数えないと定めるので、これら 9 event も fail-close する。つまり実装は 9 通りの ruleId を発明せざるを得ない。#344 初回 pre-gate で blocking にした「契約に無い方式のその場開発」と同型。

最小修正: 汎用コード 1 個 (例 forward-evidence-missing) を定義し、どの policy row が不足したかは envelope の evidence.required / evidence.rejected で表現するのが最短。既存 3 個の特化コードは L4-23 §3 の 4 admission rule に対応する歴史的固有名として残す旨を一文添えれば整合する。9 個個別命名でも可だがその場合は表に列を足す。

## B-2 (blocking): PLAN-L7-419 の github_issue_id が CLOSED な #342 のままで #344 がどこにも現れない

main の L7-419 frontmatter は github_issue_id: 342、references も #108 と #342 のみで #344 参照が無い。#342 は docs-only pair-freeze の完了 Issue で既に CLOSED、bounded implementation を所有するのは #344。このまま実装 PR を出すと成果物の所有 Issue と PLAN の申告が食い違う。最小修正 = github_issue_id: 344 へ更新し references に #344 を追加 (#342 は predecessor として残す)。実装 PR の初回 commit に同梱でよい。

## carry advisory の受入条件化 (取り込み可能)

C-1: forward-ledger-unavailable の oracle は docs/test-design/ と tests/ を通じて **0 件**。exit 3 クラス全体が未カバー。受入条件へ「exit 3 の candidate を 1 本以上追加」を入れる。CANDIDATE-U-FSM-008 相当を新設し Red 入力 = ledger entry 不在 / projection 再構築不能、期待結果 = forward-ledger-unavailable / exit 3 / frontmatter status へ補完しない、が自然。

C-2: 許可 from state にいるが evidence が expiry 超過のケース (例 red_frozen で red-test-run が 24h 超) は precedence 節の列挙に含まれず §3 一般 policy に落ちる。受入条件に「expired evidence は missing と同じ typed code / exit 2 へ倒す」を明記するか precedence 節へ 1 行足す。B-1 の汎用コードを入れれば同時に解ける。

## 整合していた点

requires: [PLAN-L7-418] は L7-418 confirmed + U-PA-043..048 が main 全回帰 green で前提充足。generates は PLAN doc 2 件のみで draft 段階の先取りなし (merged-plan-status / duplicate-artifact-ownership 回避)。candidate は CANDIDATE-U-FSM-00X 7 件 + CANDIDATE-P-FSM-00X 2 件 (台帳 1 + U-OIDGATE-001 fixture 内言及 1)、旧 CANDIDATE-FSM-00X は 0 件で重複なし。review_evidence: [] は実装前として正しい。スコープ混入なし — L7-419 §5 が Project/Issue projection・D1/D2/D3 custody・Episode E0-E15・PF-5 Pack admission・外部 Pack copy・promotion/rollback を明示除外し、Issue #344 も surface を src/forward/** と tests/forward/** に限定。

advisory A-1: Issue #344 本文の Source baseline: origin/main f4c1bac2 は #346 merge で古い (現 main は 665e3cba)。

次: B-1 / B-2 を閉じる docs-only 追補 1 本 → exact HEAD CI green + Claude closing PASS で main 到達 → main post-merge run Green → 同じ exact HEAD で pre-gate 再導出 → PASS なら bounded Luna 契約のみ返す。B-2 単独なら実装 PR 初回 commit 同梱可だが **B-1 は実装前に決めないと 9 通りの命名が実装 PR 内で発明される**。
