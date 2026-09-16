---
memory_id: memory:feedback:pr-346-closing-review-at-91f3ae86-flag-blocking-2-fsm-state-has-no-defined-relation-to-frontmatter-status-and-explain-exit-code-is-doubly-defined
kind: feedback
title: "PR 346 closing review at 91f3ae86: FLAG blocking 2, FSM state has no defined relation to frontmatter status and explain exit code is doubly defined"
tags: ["contract-tables", "flag", "forward-fsm", "issue-345", "plan-l6-72", "pr-346"]
updated_at: 2026-08-19T12:03:17.042Z
---

PR #346 (PLAN-L6-72 FSM contract tables の具体化、Issue #345) の Claude non-author closing review、exact HEAD 91f3ae86dd365a9cad7bdcde3a7f3b3ba71eb2ef。verdict = FLAG (blocking 2 / advisory 3)。PR comment https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/346#issuecomment-5341827445 に全文。

exact HEAD 検証: gh pr view --json headRefOid と git ls-remote origin refs/pull/346/head の双方で 91f3ae86dd3。通知にあった 91f3ae86d0ed642fc708d8ccfbc6f42aa7fb9658 は先頭 8 桁が同じ別 SHA で remote に存在しない (#341 の e549cd98 と同型の取り違えで、これで 2 例目)。

## 揃っているもの (#344 pre-gate で求めた 4 表)

event 語彙 17 件 (from/next/必須 evidence 付き、正規 12 edge が proposed → … → archived を切れ目なく連結することを 1 本ずつ確認)、closed-world 規則 (表に無い state × event は forward-transition-illegal / state 変更なし / event・outbox・外部 intent 0 件)、typed evidence policy 14 行 (kind/cardinality/expiry/producer/subject revision/exit rule、red-test-run のみ nonzero 許可)、CLI envelope forward-cli/v1 + exit 0/1/2/3 分類。state 集合・admission rule・typed error ID・candidate ID は不変。supersedes を宣言せず日付付き追補としたのは #344 pre-gate の判断 (具体化なので supersede 不要) と一致。

## FLAG-1 (blocking): FSM state と frontmatter status の関係が未定義

本表は 13 正規 state を定めるが、repo の全 PLAN が実際に持つのは status: draft|confirmed|completed だけ (src/schema/frontmatter.ts:140)。両者の対応も「FSM state は ledger 由来で frontmatter とは独立」という宣言も PLAN-L4-23 / L6-72 / L7-419 のどこにも無い (3 PLAN を grep して 0 件)。未定義だと workflow status が既存 PLAN に対し何を返すか決まらず実装者が対応表を発明する。また doctor/lint 群 (plan-dod / review-evidence / merged-plan-status) は status を正本に gate しているので、ledger 由来 state と frontmatter status の 2 つの真実が黙って乖離する余地が残る。

机上でない証拠: 自然な読み (confirmed ≒ accepted) を取ると、block/supersede の from が「13 正規 state のうち archived / accepted 以外」なので **accepted に到達した subject は二度と supersede できない** (archive して terminal に入るのみ)。しかし本 repo は confirmed な PLAN を日常的に supersede する — 実例として PLAN-L6-89 が confirmed の PLAN-L6-72 を supersede し、双方向 back-reference を doctor plan-supersession が強制している。対応関係次第で表が repo の実運用を禁止する。

最小修正 = (a) FSM state は ledger 由来のみで frontmatter status とは独立した軸だと宣言し workflow status が frontmatter を読まないことを明示、または (b) status ↔ FSM state の対応表を書き accepted からの supersede を許可 edge に加える。

## FLAG-2 (blocking): status / explain の exit code が同一呼び出しで二重定義

末尾が「status / explain の valid read-only 結果は exit 0、拒否理由を説明する read-only 結果も exit 1 または 2」と書いており、「拒否理由を正しく説明できた explain」が両方の節に該当する。main へ merge 済みの CANDIDATE-U-FSM-001 が「正例は exit 0、負例は exit 1」を期待結果に持つため oracle の判定が一意にならず、#344 pre-gate の admission 条件「候補の期待結果が表を参照して一意に判定可能であること」を満たさない。最小修正 = explain を説明の成否で決める (deny を正しく説明できたら exit 0、envelope の verdict: deny で表現) か verdict をそのまま exit へ写すかを一方に決める。transition は verdict 写像 / status・explain は説明成否、の分離が素直 (query が deny 報告のたび非零だと script が誤検知する)。

## advisory 3 件

A-1 independent-review の producer 列は codex, claude で「author family と異なる producer を要求する」制約が表の下の散文にしかない。行だけを機械可読契約として読むと cross-family 条件が落ちる。A-2 resume は常に reopened → planned へ戻すため trace_frozen で block されても pair/red/trace の凍結が全て失われる (保守的だが再入コスト最大、意図の明記が望ましい)。A-3 exception-context の cardinality だけ「exactly 1 per exception event」で他 13 行の「exactly 1」と単位が異なる。

次の手: FLAG-1 / FLAG-2 修正 (いずれも追補内の数行、実装スコープに触れない) → exact HEAD 更新 → CI green 確認 → Claude closing PASS → merge。
