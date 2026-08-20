---
memory_id: memory:project:issue-344-forward-fsm-implementation-admission-pre-gate-at-main-f4c1bac2-flag-l6-72-declares-transition-and-evidence-policy-tables-it-never-contains-so-luna-would-have-to-invent-event-vocabulary-exception-edges-policy-rows-and-cli-envelope
kind: project
title: "Issue 344 Forward FSM implementation admission pre-gate at main f4c1bac2: FLAG, L6-72 declares transition and evidence policy tables it never contains, so luna would have to invent event vocabulary, exception edges, policy rows and CLI envelope"
tags: ["admission", "exact-main", "flag", "forward-fsm", "issue-344", "plan-l6-72", "plan-l7-419", "pre-gate"]
updated_at: 2026-08-19T11:52:32.096Z
---

Issue #344 (Forward FSM bounded implementation、PLAN-L7-419) の Opus 実装 admission pre-gate。exact main = f4c1bac2f63321b00370e6bd6646b3175c93dd26。**verdict = FLAG (実装 admission 不可、blocking 1)**。**luna を起動しない**。read-only 判定であり編集 / 起票 / PR は行っていない。

前提の確認: PR #343 は merge 済 (main f4c1bac2)、Issue #342 は CLOSED、Issue #344 は OPEN で #108 の子。pair-freeze 側の形式要件 (工程表 / AC / requires / github_issue_id / Reverse R0 / scope 境界 / generates 非先取り) は #343 review で PASS 済み。

## 満たされている条件 (実装に必要な材料のうち存在するもの)

- **state 集合は定義済み**。PLAN-L4-23-forward-fsm-plan-asset-v2 (kind=add-design, status=**confirmed**) の §2-1 が正規遷移を 13 state の列として明示する: `proposed→planned→pair_freeze_ready→pair_frozen→red_frozen→implementing→implementation_complete→trace_freeze_ready→trace_frozen→review_ready→reviewed→accepted→archived`。§2-2 が例外 state `blocked|superseded|rejected|reopened` を「理由と revision/exception event 必須」として定める。
- **admission 規則 4 本は定義済み** (L4-23 §3): pair freeze 前 implement 拒否 / Red evidence 無し implement 拒否 / trace freeze 前 review 拒否 / review・test 不足 accept 拒否。
- **typed error code 5 種は台帳に実在** (docs/test-design/harness/L7-unit-test-design.md): `forward-transition-illegal` / `forward-red-evidence-missing` / `forward-trace-freeze-missing` / `forward-accept-evidence-missing` / `forward-exception-context-missing`。
- **oracle は 1:1 で登録済み**。#343 merge 後、`CANDIDATE-U-FSM-001..007` = 7 件 + `CANDIDATE-P-FSM-001` = 1 件。旧 `CANDIDATE-FSM-00X` は 0 件で重複なし。設計正本 PLAN-L6-72 の `U-FSM-001..007` 表記とも一致。
- **property oracle の parameter は具体的** (L6-72): seed、0〜64 event、全 state×command、10,000 列、決定論的 shrinker。
- **ledger 結合規則は定義済み** (L4-23 §2-4): append-only、subject revision / source commit / digest / expiry の結合。
- **port 再利用の方針は明確** (L7-419 §1.3): EvidenceRecord / reservation / migration ledger の identity と transaction 境界は PLAN-L7-418 を注入 port として再利用し、Forward 固有の新型を先に作らない。L7-418 は confirmed で U-PA-043/044 が green (CI run 32243313698 の全回帰)。

## blocking: 「table として固定する」と宣言された表が、どこにも書かれていない

PLAN-L6-72 (kind=add-design, status=**confirmed**) は Forward FSM 遷移契約の設計正本だが、本文は 8 行の箇条書きであり、次を **「固定する」と宣言するだけで表そのものを含まない**:

- 「`proposed→archived` の正規遷移、`blocked/superseded/rejected/reopened` の理由・revision・evidence policy を **table として固定する**」 → 表が無い
- 「evidence kind/cardinality/expiry/producer/subject revision/exit rule を **typed policy 表で固定し**」 → 表が無い
- 「`workflow status|transition|explain` は共通 JSON envelope/rule ID/verdict と exit 0/1/2/3 を共有し」 → envelope schema と exit code の対応が無い

PLAN-L7-419 §1.1 も「許可された `state × event × evidence` から next state を一意に導く transition policy を唯一の正本とする」と **SSoT 原則を宣言するだけ**で、表を持たない。

実測で不在なのは具体的に 4 点:

1. **event 語彙**。state 集合は L4-23 にあるが、遷移を駆動する event の列挙がどの層にも無い (`git grep -nE "event (名|vocabulary|一覧)|event kind|EventType|ForwardEvent"` を L4-23 / L6-72 / L7-419 に対して実行し 0 件)。
2. **例外 edge の行列**。`blocked|superseded|rejected|reopened` へ **どの state から入れて、どの state へ戻れるか** が未定義。L4-23 は「理由と revision/exception event を必須にする」としか書かない。`CANDIDATE-U-FSM-002` は「逆行、terminal 後 command を拒否」を要求するが、**terminal state がどれかの定義も無い** (L6-72 は「terminal state を固定する」と書くのみ)。
3. **typed evidence policy 表**。kind / cardinality / expiry / producer / subject revision / exit rule の実際の行が無い。`CANDIDATE-U-FSM-003/005` はこの表に照らした fail-close を要求するので、表が無ければ oracle を書けない。
4. **CLI JSON envelope と exit 0/1/2/3 の対応**。`CANDIDATE-U-FSM-001` は「exit 0 / exit 1」を期待結果に含むが、どの verdict がどの exit へ落ちるかの規約が無い。

この状態で実装へ進むと、luna は上記 4 点を **実装 PR の中で発明する**ことになる。これは CLAUDE.md §PR スコープ規律 (PO ルール 2026-08-03) の「**独自方式のその場開発を禁止する — 契約に無い方式が必要になったら実装を止めて契約改訂へ戻る**」および「契約 freeze が実装 PR の前提 (pair-freeze の復元)」に正面から抵触する。#343 が形式要件を整えたことは、**方式契約が揃ったことを意味しない**。

## 最小の前提 slice (docs-only、実装は停止したまま)

PLAN-L6-72 が既にこれらの表の所有を宣言しているため、**新規 PLAN を作らず L6-72 を改訂する**のが筋。ただし L6-72 は confirmed なので、表の追記が既存主張の訂正に当たるか単なる具体化かを判断する。**具体化 (宣言済みで未記載の表を書く) であれば supersede 不要、日付付き追記で足りる**。表の内容が L6-72 の既存記述と矛盾する場合のみ successor / 訂正注記を検討する。

freeze すべき 4 点:

1. **event 語彙の列挙**と、各 event が要求する evidence の種別。
2. **state × event → next state の完全表**。13 正規 state + 4 例外 state について、許可 edge と禁止 edge を網羅する。terminal state の定義を含む (`archived` のみか、`rejected`/`superseded` も terminal か)。例外 state からの復帰 edge (`reopened` → どこへ) を明示する。
3. **typed evidence policy 表**: kind / cardinality / expiry / producer / subject revision / exit rule の行。既存の 5 typed error code との対応を付ける。
4. **CLI 共通 JSON envelope schema** と **verdict → exit 0/1/2/3 の対応表**。

注意: L6-72 の review_evidence は `intra_runtime_subagent` で worker_model = reviewer_model = `gpt-5` (同一 model)。単一 runtime の fallback として規約上は許容だが、**この設計は cross-review を受けていない**。表を追記する改訂は cross-family review (Claude 非著者) を通すこと。

## admission 条件 (これが揃えば luna を起動してよい)

- 上記 4 表が L6-72 (または successor) に記載され、docs-only PR が exact HEAD CI green + Claude 非著者 closing PASS で main へ到達している。
- その時点で `CANDIDATE-U-FSM-001..007` / `CANDIDATE-P-FSM-001` の期待結果が、表を参照して**一意に判定可能**であること (現在は 001 の exit code、002 の terminal、003/005 の policy 参照先が未定義で判定不能)。

## 実装 slice の契約 (admission 成立後に有効)

- **所有 surface**: `src/forward/{domain,application,ports,adapters}`、event/evidence projection、CLI registrar、`tests/forward/**` のみ。
- **禁止**: Episode E0-E15、D1/D2/D3 custody、PF-5 Pack/copy、promotion/rollback、非 Forward の修理キュー。
- **generates**: 実装 commit と同一 commit で昇格する。`src/forward/**` は新規なので単独 owner だが、`docs/test-design/harness/L7-unit-test-design.md` は ownership baseline 登録済みなので宣言可。
- **worker**: gpt-5.6-luna (effort high)、Opus は非著者 post-gate / claim-blind review。1 Issue = 1 PR、merge は exact HEAD CI green + Claude closing PASS 後に Claude が行う。

## PO 判断 / advisor について

本判定は PO 判断を要さない。高影響境界 (production infra / destructive data / auth / payment / PII / secret / licensing / 外部 API) に該当せず、「契約 freeze が実装 PR の前提」という既存の明文規律から一意に決まるため、advisor 相談も不要と判断した (trade-off が実在しない — 「表を先に書く」以外の選択肢は明文で禁止されている)。
