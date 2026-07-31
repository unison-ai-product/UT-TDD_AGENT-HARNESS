---
plan_id: PLAN-L7-465-cross-review-author-binding
title: "PLAN-L7-465 (add-impl): cross-review セッション実在照合の実装 — PLAN-L6-94 契約の L7 降下 (U-XREV-*)"
kind: add-impl
layer: L7
drive: be
route_signal: feature_addition
route_mode: add-feature
parent_design: docs/plans/PLAN-L6-94-cross-review-session-attestation.md
status: draft
created: 2026-07-28
updated: 2026-07-28
owner: PM / PO
agent_slots:
  - role: tl
    slot_label: "TL - 突合キーの決定論性と author 導出元 (trailer / session log) の証拠力レビュー"
  - role: se
    slot_label: "SE - 4 検査の実装 + evidence スキーマ拡張 + U-XREV-* 配線"
generates:
  - artifact_path: docs/plans/PLAN-L7-465-cross-review-author-binding.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-94-cross-review-session-attestation.md
  requires:
    - docs/plans/PLAN-L7-14-cross-review-enforcement.md
  blocks: []
  references:
    - docs/plans/PLAN-L6-94-cross-review-session-attestation.md
    - docs/plans/PLAN-L6-13-cross-review-enforcement.md
    - src/lint/review-evidence.ts
    - src/state-db/projection-writer.ts
    - src/team/delegation-routing.ts
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence: []
---

# PLAN-L7-465 (add-impl): cross-review セッション実在照合の実装

**本 PLAN は `PLAN-L6-94-cross-review-session-attestation` (issue #131) の L7 実装**である
(L6-94 §6「降下先」が要求する add-impl + Reverse 対)。照合契約そのもの (4 検査 + 不変条件
4 件) は L6-94 §2 が正本であり、**ここで再定義しない**。

## 重複解消の記録 (2026-07-28)

初稿は L6-94 の存在を知らずに `PLAN-L6-13` を親として起票していた。同日、Codex が
2026-07-22 時点で同じ穴 (cross-review claim が自己申告で痕跡と binding されていない) を
issue #131 / L6-94 として既に起票済みであることを確認したため、**L6-94 の実装 PLAN として
親を張り替え、契約記述を削除**した。L6-94 §6 の「アダプタセッション記録の読み口は既存
session-log / harness.db 投影を再利用し二重実装しない」を本 PLAN の実装制約として引き継ぐ。

## L6-94 実測の追加確認 (2026-07-28、Claude 側)

L6-94 が 2026-07-22 に観測した「`claude-*` 方向の発火ゼロ = Codex→Claude 委譲の素通り」は
その後**是正されている**:

- 2026-07-28 15:50、Codex が正規経路で `ut-tdd claude --role blind-reviewer`
  (子プロセス `claude.exe --print --model claude-opus-5 --effort medium`) を起動し、
  PR #156 の claim-blind / spec-blind 二車線レビューを実行した (プロセス実測)。
- routing は `delegation-routing` どおり族内 frontier tier + Opus 基準 effort (`middle`)。
- したがって stale-direction-drift 検査 (L6-94 §2、既定 7 日) は「過去に発火した実例」を
  持つ状態で実装できる (fixture が理論値でなく実測由来になる)。

## 実装スコープ (L6-94 §2 の 4 検査を機械化)

1. **adapter-session-existence / provider-direction-coherence / fallback-declaration /
   stale-direction-drift** の検査器。既存 gate 基盤へ配線し、痕跡の読み口は
   `.ut-tdd/logs/session/<provider>-<ts>.jsonl` と `hook_events` 投影を**再利用**する
   (L6-94 §6 の二重実装禁止)。
2. **author 導出元の確定**: L6-94 の provider-direction-coherence は「著者が誰か」を要求
   するが、現状 `review_evidence[].worker_model` は PLAN への手書き (自己申告) であり
   binding が無い。実装では **commit author / `Co-Authored-By` trailer** を一次の author
   導出元とし、自己申告のみに依存しない。
   - 実測済みの制約: 正規委譲の session log には **model フィールドが無い** (`ut-tdd codex`
     の 90 件で確認) → **provider 単位の照合は可能、model 単位は不可**。本 PLAN は
     provider 単位に限定する。
3. **照合不能の扱い**: trailer 欠落 / squash merge で消失 / session log 不在は
   `unverified` として明示 surface する。**green に混ぜない** (L6-94 不変条件 3 の
   fail-close 側に倒す実装)。
4. **利用上限による回避条項** (PO ルール 2026-07-28): 担当 family が利用上限で停止して
   いた場合のみ `intra_runtime_subagent` へ格下げして通す。foreign-edit-override 先例に
   倣い非空理由 marker + one-shot 消費 + audit jsonl。空 marker は通さない
   (L6-94 §2 fallback-declaration の運用面)。
5. **evidence スキーマ拡張と移行**: 突合キー形式を既存スキーマ互換で定義し、既存
   confirmed PLAN の evidence を遡及 fail させない (L6-94 AC 3 番目)。

## スコープ外

- 照合契約の定義そのもの (L6-94 §2 が正本)。
- Codex にルールを守らせる行動層の是正 (L6-94 §3 のとおり本 gate は可視化側)。
- アダプタ経路の環境不備検査 (PLAN-L6-95 runtime-env の領分)。
- model 単位の binding (session log に model が無いため。必要なら session log スキーマ
  拡張を別 PLAN で先行)。

## 誠実に明記する限界

- **trailer は偽装可能**。自己申告より一段固いだけで、保証ではない。
- squash merge で trailer が消える経路があるため、`unverified` の扱い (スコープ 3) が
  実効の要になる。

## Schedule

- step 1 (serial): 突合キー (session_id / plan_id / role / timestamp 域) と author 導出
  規則の freeze。L6-94 §2 との対応表を作る
- step 2 (serial): Red — `U-XREV-*` (L6-94 §4 の 6 件) + 申告 provider ≠ 実 author provider
- step 3 (serial): 実装 + 実 repo 実測 (既存 PLAN の evidence を照合し `unverified` 件数を出す)
- step 4 (serial): blind review (非 author provider) → confirm

## AC

- AC-1: L6-94 §4 の `U-XREV-*` 6 件が green (痕跡なし claim / 逆方向 / 正当 claim の
  誤検知負例 / fallback 偽装 / ログ破損 fail-close / 監査スモーク誤採用なし)。
- AC-2: 申告 `worker_model` の provider 族が実 author の provider 族と異なる PLAN を
  fail-close で検出する負例テストが green。
- AC-3: 照合不能ケースが `unverified` として surface され、**green に混ざらない**ことを
  テストで固定 (fail-open 化の禁止)。
- AC-4: 利用上限 marker が非空理由付きで one-shot 消費され audit へ記録されること、
  空 marker が通らないことをテストで固定。
- AC-5: 既存 cross-review gate (PLAN-L7-14 / IMP-076) の検出集合が縮まないこと、および
  既存 confirmed PLAN の evidence が遡及 fail しないことをテストで固定。

## dispatch lifecycle の追記 (2026-07-31、GPT5.6Pro 外部監査を受けて)

L6-94 §2 の 4 検査は「**主張された cross-review が実在したか**」を痕跡と突合する。しかし
2026-07-31 の実測は、その手前に穴があることを示した:

- **PR #201** (Codex 著作、issue #199): `reviews=0` / `comments=0` のまま merge された。
  照合すべき痕跡そのものが存在しない = 「依頼したのに誰も拾わなかった」経路。
- **PR #202** (Claude 著作): 差分小・CI 全 green・artifact freeze 済・exact HEAD 固定済・
  merge 条件明示済でも、verdict が返るまで拘束順序全体が停止した。

外部監査 (GPT5.6Pro) の診断は「実装・CI・証拠は機械化されたのに **review dispatch だけが
半手動** (人間的な『気づいて拾う』に依存)」。本 PLAN は照合の正本なので、**照合対象となる
痕跡を生む dispatch lifecycle** をここに追記する (net-new PLAN は起票しない)。

### D1: dispatch 状態機械 (本 slice)

実装: `src/feedback/review-dispatch.ts` (純粋関数、I/O なし、時刻は `now` 注入)。
テスト: `tests/review-dispatch.test.ts` (`U-RVDISP-001`〜`052`)。

進捗表示: `requested` → `acknowledged` → `in_review`。ただし、D3 の構造化 producer が
まだ存在しない D1 では、現行 exact identity の有効な `verdict` を先行 receipt の有無と
無関係な**終端証拠**として受理する。ack / in_review の欠落は診断に残すが blocking にしない。
逸脱状態: `stale_head` (依頼 exact HEAD と receipt/PR HEAD の不一致)、
`merge_ready` (verdict が PASS 系 + HEAD 三者一致 + CI green + PR OPEN +
fail-close reason 不在の 5 条件全成立)。

機械化する不変条件 (すべて fail-close):

1. **同一 family の自己承認を verdict として受理しない** (`same_family_reviewer`)。
   PLAN-L6-13 の `same_model_approval: forbidden` を dispatch 層でも保つ。ack / in_review は
   承認権限を持たない進捗診断なので、別familyの有効verdictを汚染しない。
2. **exact HEAD 限定**。古い HEAD への PASS で `merge_ready` にしない。PR HEADが進んだ
   requestは`stale_head`終端として未応答SLAを停止し、新HEADのrequestへ収束させる。
3. **verdict 無し merge の検出** (`merged_without_verdict`)。= PR #201 / incident #189 の実事象。
4. **孤児 receipt を無視**。受領だけで「レビューされたこと」を捏造できない。
5. **SLA 超過の検知**は verdict 未到達 60 分の一段だけ
   (`DEFAULT_REVIEW_DISPATCH_SLA`)。閾値ちょうどは breach にしない。
   ack 15 分 / start 30 分は producer 不在で偽陽性になるため D3 完了まで breach にしない。
   **無反応の検知**が目的であり、レビュー内容を急がせない。
6. **決定論**: entries は `(pr 昇順, exactHead 昇順)` で安定。入力順に依存しない。
7. **終端性**: stale HEAD / unmerged CLOSED / MERGED は未応答SLAを継続しない。
   request無しMERGED観測とverdict無しMERGEDは手順違反としてfail-closeする。旧HEAD requestが
   存在しても、merge先HEADのrequestが無ければPR横断照合でfail-closeし、逆にmerge先HEADの
   有効verdictがあれば旧requestを恒久redにしない。

### 後続 slice (本 slice に含めない)

- **D3**: trusted な構造化 receipt producer と reviewer family 証明の永続化。
  同一identity・同一kindは状態変化時に一度だけemitし、再送は同一contentの冪等replayとする。
- **D2**: D3 の trusted receipt を入力にした SLA surface 配線
  (session-start digest / feedback イベント)。
- **D4**: reviewer lane の冗長化 / 再割当 (非 author family 契約は維持)。

D1→D3→D2→D4 の順序契約とする。D1 は**純粋 analyzer のみ**で、永続化・GitHub 取得・
CLI 配線・doctor 配線を含まない。
`ok: false` を CI の hard gate にはまだ繋がない (繋ぐのは D2 以降)。
PLAN-L7-465 は `status: draft` のままであり、本追記は `generates` を増やさない
(deliverable 所有を draft PLAN に持たせると issue #162 の post-merge 罠を踏むため、
`src/feedback/review-dispatch.ts` は本文参照による trace に留める)。
