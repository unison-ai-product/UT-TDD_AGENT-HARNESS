---
plan_id: PLAN-L7-465-cross-review-author-binding
title: "PLAN-L7-465 (add-impl): cross-review セッション実在照合の実装 — PLAN-L6-94 契約の L7 降下 (U-XREV-*)"
kind: add-impl
layer: L7
drive: be
route_signal: feature_addition
route_mode: add-feature
parent_design: docs/plans/PLAN-L6-94-cross-review-session-attestation.md
status: confirmed
created: 2026-07-28
updated: 2026-08-14
owner: PM / PO
agent_slots:
  - role: tl
    slot_label: "TL - 突合キーの決定論性と author 導出元 (trailer / session log) の証拠力レビュー"
  - role: se
    slot_label: "SE - 4 検査の実装 + evidence スキーマ拡張 + U-XREV-* 配線"
generates:
  - artifact_path: docs/plans/PLAN-L7-465-cross-review-author-binding.md
    artifact_type: markdown_doc
  - artifact_path: src/feedback/review-merge-gate.ts
    artifact_type: source_module
  - artifact_path: src/cli/pr-merge.ts
    artifact_type: source_module
  - artifact_path: tests/review-merge-gate.test.ts
    artifact_type: test_code
  - artifact_path: src/feedback/review-custody.ts
    artifact_type: source_module
  - artifact_path: src/feedback/review-custody-canonical.ts
    artifact_type: source_module
  - artifact_path: src/feedback/review-custody-runner.ts
    artifact_type: source_module
  - artifact_path: src/feedback/ports/github-attestation-verifier.ts
    artifact_type: source_module
  - artifact_path: src/feedback/ports/provider-family-authority.ts
    artifact_type: source_module
  - artifact_path: src/feedback/adapters/gh-attestation-verifier.ts
    artifact_type: source_module
  - artifact_path: tests/review-custody.test.ts
    artifact_type: test_code
  - artifact_path: .github/workflows/review-attestation.yml
    artifact_type: yaml_config
  - artifact_path: src/feedback/post-merge-backstop.ts
    artifact_type: source_module
  - artifact_path: tests/post-merge-backstop.test.ts
    artifact_type: test_code
  - artifact_path: src/feedback/live-review-projection.ts
    artifact_type: source_module
  - artifact_path: src/cli/review-live.ts
    artifact_type: source_module
  - artifact_path: tests/live-review-projection.test.ts
    artifact_type: test_code
  - artifact_path: tests/review-live-cli.test.ts
    artifact_type: test_code
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
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/218
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence:
  - reviewer: claude-pr299-blind-re-review
    review_kind: cross_agent
    reviewed_at: "2026-08-07T13:55:53Z"
    tests_green_at: "2026-08-07T13:55:53Z"
    verdict: "blind re-review blocking 0"
    worker_model: gpt-5.6-luna
    reviewer_model: claude-opus-5
    scope: "PR #299 コメント (subject 021cb536) の blind re-review。B-3、oracle 宣言、generates 所有、PLAN-L7-470 追補を残債として特定したうえで blocking 0。rebase 後 HEAD 5215bc23 の closing review は本 slice の検証後に再取得予定。"
    lane: claim-blind
    citations:
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/299#issuecomment-5217956975"
    green_commands:
      - kind: unit_test
        command: "node scripts/run-vitest-snapshot.ts tests/review-merge-gate.test.ts"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-07T13:55:53Z"
        evidence_path: tests/review-merge-gate.test.ts
        output_digest: "sha256:23754e2ad74b4a617922363349c8bde8bea925f9dffc3d13b6c27aa01d9b387a"
        anchor_commit: 021cb536
  - reviewer: codex-closing-285
    review_kind: cross_agent
    reviewed_at: "2026-08-07T07:26:50Z"
    tests_green_at: "2026-08-07T07:19:50Z"
    verdict: approve
    worker_model: claude-opus-5
    reviewer_model: gpt-5.6-sol
    scope: "PR #285 exact HEAD 9dff55704b1c22b1c22272502006a2c24035e0c2; CI run 31156402592 (Linux/Windows/aggregate) green; claim-blind/spec-blind closing review PASS; post-merge live dispatch was deferred until merge by design."
    subject_head: "9dff55704b1c22b1c22272502006a2c24035e0c2"
    attack_trials: 3
    citations:
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/285#issuecomment-5213879263"
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/31156402592"
    green_commands:
      - kind: unit_test
        command: "npm run test"
        runner: ci
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-07T07:19:50Z"
        evidence_path: tests/review-custody.test.ts
        output_digest: "sha256:a5634d67b958d1bc04056ab3993bee80845e5c340e028663c294e5307db2c4ba"
        anchor_commit: 9dff55704b1c22b1c22272502006a2c24035e0c2
      - kind: typecheck
        command: "npm run typecheck"
        runner: ci
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-07T07:19:50Z"
        evidence_path: src/feedback/review-custody-runner.ts
        output_digest: "sha256:ff15ed577f28a9a0ed8cd2b5f6391037d09019ebc7e00f84d2732f671e0d1dd8"
        anchor_commit: 9dff55704b1c22b1c22272502006a2c24035e0c2
---

# PLAN-L7-465 (add-impl): cross-review セッション実在照合の実装

## 訂正注記 (2026-09-01): §実装スコープ 2 の author 導出元は PLAN-L7-517 が supersede した

`PLAN-L7-517-review-author-provenance` が本 PLAN を `supersedes` に宣言している。**supersede されたのは
下記 1 規定のみ**であり、本 PLAN の他の family 依存規定は有効である。

### supersede された規定

**§実装スコープ 2「author 導出元の確定」** — 「実装では **commit author / `Co-Authored-By` trailer**
を一次の author 導出元とし、自己申告のみに依存しない」(本ファイル :159 付近)。

撤回の根拠は 2 つある:

1. **測定**: origin/main 6b5b1d9c 時点で git author 名が provider family を示す割合は
   **0% (166/166 が `unison-ai-product`)**、`Co-Authored-By` trailer は 24.1% (40/166) の自由記載
   claim であり、commit sha と provider を結ぶ harness.db 列は存在しない (PLAN-L7-517 §2)。
2. **この規定は実装されなかった**: `src/feedback/review-attestation.ts` の
   `resolveReviewAuthorFamily` は `explicit` (`--review-author-family`) と `currentRuntime`
   (委譲を実行している runtime) だけを入力とし、commit author も trailer も参照しない。
   本規定は文書に残ったまま実装と乖離していた。

### 既知の限界と後継ポインタ (2026-09-04、PLAN-L7-517 §3.2.2)

本 PLAN の family 依存 gate (`same_family_reviewer` / 反対族 routing / consumer admission) の入力は
`resolveReviewAuthorFamily` 由来の **unverified claim** であり、claim を変えれば通過可否が変わる。これは
provenance ではない process-hygiene 制御であって、verified non-authorship を証明しない (PLAN-L7-517 §3.2.2)。
この限界の解消 (authoring record を commit OID に束縛し Git facts から same-runtime を判定する) は admission
を変える authentication 類似の変更であり、**PO 承認を要する後継 PLAN として保留**する。PLAN-L7-517 は
この解消を取り込まない。

### supersede されていない規定 (有効)

- **§機械化する不変条件 1「同一 family の自己承認を verdict として受理しない (`same_family_reviewer`)」**
  (本ファイル :239 付近)。PLAN-L7-517 §3.5 は「その authority は**既存の独立 review admission / gate
  に留める**」と述べており、これは温存である。判定に使う `authorFamily` は上記のとおり Git 文字列
  由来ではないため、supersede された規定の影響を受けない。
- **D1 dispatch の反対族 routing** (同族 fallback 禁止、未知 family / 反対族 runtime 不在は
  delegation 0 / receipt 0 で deny)、**consumer の反対族 provider 起動**と `U-RVATT-024`。
- **§D3c の `provider-family-authority.ts` port と `unverified_family` 終端**。本 PLAN が既に
  「commit trailer・自己申告・PR marker を family authority として受理してはならない」と freeze
  しており、PLAN-L7-517 と同じ立場である。受理側実装は authentication / authorization を変える
  外部権限設計として **PO の明示承認**を要する。
- **exact HEAD 限定** (§機械化する不変条件 2)、session log の再利用、未応答 SLA、`stale_head` 終端。

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
fail-close reason 不在の 5 条件全成立)。この名前はD1内部の**候補状態**であり、GitHub mergeの
最終authorizationではない。現行実装のCI入力はcaller供給のopaque `checksGreen: boolean`で、
component check名・HEAD・conclusionへのtyped束縛はまだ無い。この未実装gapをD2着工前に閉じる。

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
  (session-start digest / feedback イベント) **+ merge gate 配線** (2026-08-03 改訂、下記)。
- **D4**: reviewer lane の冗長化 / 再割当 (非 author family 契約は維持)。

#### D2 scope 改訂 (2026-08-03、incident #210 対策、advisor: claude-fable-5)

PR #210 が Claude closing FLAG 未解消・再依頼なしのまま merge された
(incident memory: `project-incident-pr-210-merged-with-open-flag-2026-08-03`)。
analyzer (D1) と trusted receipt (D3) が揃っても消費者ゼロでは prose の FLAG は
素通りする。advisor 裁定 (C 採用・重心 B) に従い D2 を次の 3 面で構成する:

1. **B (一次防壁)**: `ut-tdd pr merge --pr <N>` を正規 merge 経路にする。merge 直前に
   `analyzeReviewDispatch` を exact HEAD で評価し、`merge_ready` 以外 (FLAG open /
   verdict 無し / HEAD mismatch / 判定不能) は fail-close で merge しない。HEAD
   mismatch は必ず breach 側へ倒す。wrapper 実行の receipt を残す。
2. **D (backstop、B と対で必須)**: wrapper receipt の無い merge (gh 直叩き迂回) と
   `merged_without_verdict` を post-merge 検知し、session-start digest / feedback
   イベントへ fail-close 表示する (静かに流れる状態の根絶)。B 単独は「迂回が検知
   される」ことに依存するため、D 無しの B は fail-open の看板替えになる。
3. **A (GitHub 強制・可視化)**: D2 は既存の単一 required aggregate check
   `harness-check` を所有し、`D1 merge_ready AND D3d custody_admitted` の最終 AND をその出力へ
   投影する。D2のGitHub adapterは同一HEADの`harness-check-linux` / `harness-check-windows` /
   非required `harness-ci-aggregate`をtyped `AggregateCiReceipt`へ変換し、純粋D1はその入力から
   内部候補`merge_ready`を作る。最終required `harness-check`をCI receiptへ混入してはならない。
   target契約はCI aggregate receipt provider → D1候補 + D3d → D2 → required `harness-check`の
   一方向である。
   **現HEADはまだopaque `checksGreen`のため、この循環除去を実装済みとは扱わない**。D2実装PRが
   現行CI aggregate jobを`harness-ci-aggregate`へrenameし、新しい最終required job
   `harness-check`を追加してprovider bindingとnegative oracleを同時にGreen化した時だけtargetへ到達する。
   現行main保護ではこの最終出力がGitHub mergeの実効blockになる。D3d receipt workflow自体を
   required contextとして増設せず、custody片面だけでgreenを発行しない。

> **訂正注 (2026-08-05、issue #231、main protection read-only実測)**:
> 次の read-only コマンドを実行し、`enforce_admins=true`、required context
> `harness-check`、`strict=false`、active ruleset `main-stage1`、bypass actor `0` を観測した。
>
> ```powershell
> gh api repos/unison-ai-product/UT-TDD_AGENT-HARNESS/branches/main/protection --jq '{enforce_admins:.enforce_admins.enabled,required_status_checks:{contexts:.required_status_checks.contexts,strict:.required_status_checks.strict},required_pull_request_reviews:.required_pull_request_reviews}'
> gh api repos/unison-ai-product/UT-TDD_AGENT-HARNESS/rulesets/19098984 --jq '{id,name,enforcement,bypass_actors:(.bypass_actors|length),bypass_actor_logins:[.bypass_actors[].actor.login]}'
> gh api repos/unison-ai-product/UT-TDD_AGENT-HARNESS/rules/branches/main --jq '.'
> ```
>
> 最後の branch rule でも `harness-check` が required status check として active ruleset
> `main-stage1` から適用されることを確認した。bypass actor が 0 のため、観測時の実行 actor に
> bypass 経路はない。従って required check は単なる摩擦ではなく実効防壁である。ただし、その
> green だけでは reviewer family、judgment provenance、exact-subject custody を証明しないため、
> D3d の代替にはならない。旧solo運用の観測記述は現行判断から**supersede され削除済み**であり、
> 本訂正注のみを現行 protection 前提とする。

#### required check単純案との対効果 (issue #231 BF-5)

| 案 | 得るもの | 残る穴 | 採否 |
|---|---|---|---|
| required `harness-check`だけ | 現行保護下で未green PRのmergeをGitHubがblock | 現在はD1/D3のlive入力を消費せず、family、署名provenance、TOCTOU、receipt replayを証明しない | 単独案は不採用 |
| D3 trusted custodyだけ | judgmentとGitHub provenanceをexact subjectへ束縛しtyped fail-close | 単独ではGitHub mergeをblockせず、未承認family authorityも解決しない | 単独案は不採用 |
| CI aggregate receipt + D1 + D3d + D2 required `harness-check` | D1候補、D3d custody、GitHub実効blockを一方向の単一ANDへ束縛 | provider-family authorityは承認済み外部方式が必要 | 採用 |

D3dは複雑な第二merge gateではなく、D2が消費する信頼入力を作る。targetではD2 adapterが
個別CI証跡をtyped入力へ束縛し、D1は既存名`merge_ready`の内部候補を作り、D2だけが既存の単一
`harness-check`へ最終AND結果を投影する。required contextの増殖、aggregate出力の自己入力、
判定器の重複を避ける。現行opaque boolean経路は未達gapとして残し、Green証拠に数えない。
実装順序`D1 -> D3c -> D3d -> D2 -> D4`は維持し、D2着工時に「片面green禁止」と保護設定driftの
RED oracleを追加する。

両ランタイム規約 (AGENTS.md / CLAUDE.md) へ「merge は `ut-tdd pr merge` 経由」を
同時掲載する (片側のみだと rule-drift の再演)。

D1→D3→D2→D4 の順序契約とする。D1 は**純粋 analyzer のみ**で、永続化・GitHub 取得・
CLI 配線・doctor 配線を含まない。
`ok: false` を CI の hard gate にはまだ繋がない (繋ぐのは D2 以降)。
PLAN-L7-465 は `status: draft` のままであり、本追記は `generates` を増やさない
(deliverable 所有を draft PLAN に持たせると issue #162 の post-merge 罠を踏むため、
`src/feedback/review-dispatch.ts` は本文参照による trace に留める)。

## D3c trusted custody 契約 freeze（2026-08-05）

### 位置づけと順序

本節は D1 が出した judgment を GitHub の検証可能な機械 envelope へ束縛する D3c の
**契約 freeze**である。この slice は PLAN と対になる L7 oracle だけを変更し、source code、
workflow、CLI、永続化、外部認証設定を変更しない。実装順序は `D1 -> D3c freeze -> D3d
provider receipt -> 実 GitHub green/red -> D2 consumer -> D4` とし、D3d が未完の間は D2 を
着工しない。既存 `work/d3-trusted-custody` の spike は設計入力に限り、freeze の成果物へ
含めない。

### 信頼根を誇張しない

1. GitHub Artifact Attestation が証明できるのは、artifact digest と GitHub が検証した
   repository / workflow / run / issuer の provenance、および発行後の非改竄である。
   judgment payload 内の `reviewerFamily` や `reviewerModel` の真実性は証明しない。
2. `reviewerFamily` の自己申告、PR comment marker、HARNESS memory本文、commit trailer、
   local JSON/HMAC、同一 OS user が利用できる鍵は provider family の信頼根にしない。
3. D3b の schema 検証済み judgment payload と D3c mechanical envelope は AND 入力とする。
   片方だけ、または family の強い証明がない状態は `unverified_family` であり、
   D3d の `custody_admitted` へ昇格しない。
4. family を機械的に強証明する provider 別 GitHub App / bot / OIDC subject 等は、
   authentication / authorization を変える外部権限設計である。本 freeze では方式を
   仮決めせず、PO の明示承認を得る D3d 境界へ送る。
5. D1 の現行 SSoT は `analyzeReviewDispatch` が返す `merge_ready` 状態である。ただし現行
   `checksGreen`はopaque booleanであり、CI aggregate receiptへの束縛は未実装である。D2は未着工で、
   現HEADに`evaluateMergeGate`は存在しない。targetではD2 adapterが同一HEADの
   `harness-check-linux` / `harness-check-windows` / 非required `harness-ci-aggregate`をtyped
   `AggregateCiReceipt`へ変換し、D1 `merge_ready`
   AND D3d `custody_admitted`をD2が評価して既存aggregate `harness-check`へ投影する。aggregate
   Check Runは最終出力であり、D1入力に戻さない。現状記述とtarget契約を混同しない。

`D3a` は review request/response の配送、`D3b` は judgment payload の schema・digest 検証、
`D3c` は本契約 freeze、`D3d` は GitHub provenance と provider-family authority を検証する
adapter 実装を指す。D3b は payload の意味と family の外部真正性までは証明しない。

## D3a live review canonical projection 契約 freeze（2026-08-14）

### 実測した運用gap

PR #309 の merge 前実走では、`.ut-tdd/review/requests` は旧PR #300の1件だけ、
`receipts` は0件だった。そのため、Codexの `ut-tdd memory add --notify-claude` からlive Claude
VS Code sessionへ依頼し、PR commentとHARNESS Memoryへverdictを返す現行運用では、
`ut-tdd pr merge --pr 309` が `no_request_for_current_head` / `orphan_pr_observation` でdenyした。
wrapperを迂回したmergeはD2-Dがすべて`bypass_merge`として検知する。

producer未実装が原因ではない。既存`src/feedback/review-attestation.ts`には
`issueReviewRequest()` / `projectReviewVerdict()`があり、正規delegationのreview identity flag
経路ではcanonical request/receiptを作れる。gapは、live VS Code配送がこの既存writerを通らず、
memory wake / PR commentだけで完結する**配線欠落**である。

### 正本と派生表示

1. D1/D2が判定入力として読む唯一の正本は`.ut-tdd/review/requests` / `receipts`とする。
   HARNESS Memory、claude-memory-wake inbox、PR commentは配送・可視化の派生物であり、
   `analyzeReviewDispatch()` / `evaluateMergeGate()`の入力へ逆流させない。
2. schema、validation、content-addressed identityは既存`issueReviewRequest()` /
   `projectReviewVerdict()`を再利用する。別writer、別request/receipt schema、DB先行正本を作らない。
3. live review dispatchはcanonical request永続化の成功後にだけmemory wakeをpublishする。
   requestがinvalid、書込み不能、identity不全ならwakeを0件とし、「通知済みだが判定不能」を作らない。
4. live verdict返却は既存verdict contractを検証し、canonical receipt永続化の成功後にだけ
   PR comment / feedback memoryをpublishする。FLAGを含むinvalid/欠落verdict、identity不一致、
   receipt書込み失敗では派生表示だけを成功させない。
5. current PR HEADが進んだ場合、旧request/receiptを更新・別HEADへ流用せず、新identityで再dispatch
   する。移行時点のopen PRはcurrent exact HEADへ1回だけ再dispatchし、過去HEADのPASSを採用しない。
6. live Claude VS Code sessionは配送・進行のcoordinatorであり、reviewer familyの事実源にはしない。
   canonical verdictを生成できるreviewerは、同sessionが起動する既存の正規delegationのchildだけとする。
   requestの`authorFamily`がCodexなら`ut-tdd claude --role reviewer|blind-reviewer --review-* --execute`、
   Claudeなら`ut-tdd codex --role reviewer|blind-reviewer --review-* --execute`を選び、同族providerへ
   fallbackしない。未知familyまたは反対族runtime不在はdelegation 0 / receipt 0でdenyする。
   `src/cli/delegation.ts`が実spawnしたprovider/model/role/startedAt/completedAt/exitCodeから組み立てた
   attestationだけを`projectReviewVerdict()`へ渡す。interactive session、CLI option、memory本文、tag、
   PR commentからprovider/model/exitCodeを自己申告してreceiptへ投影する経路は作らない。childを起動
   しないlive手動reviewは派生comment/memoryを残せてもcanonical receiptは0で、D1/D2はdenyを維持する。
   このspawn factは既存D1のoperational family factに限り、D3cの強いprovider-family証明へ昇格しない。
   D3c/D3dは従来どおり承認済み外部authority不在なら`unverified_family`を返す。
7. claude inbox envelopeは新規producerが`ut-tdd.claude-inbox/v3`を発行し、必須typed purpose
   (`memory` / `review`) を持つ。既存in-flight `ut-tdd.claude-inbox/v2`は書換えず、consumerが
   `purpose=memory`としてだけ互換読出しする。v2は構造化review identityを持たないため、本文/tagに
   review文言があってもreview delegationへ昇格できない。unknown schemaは従来どおりfail-closeする。既存
   `memory add --notify-claude`は常に`purpose=memory`で、PR番号やreview文言をbody/tagへ書いても
   review dispatch、delegation、receipt projectionを一切起動できない。`purpose=review`は本live
   projection actionだけが、永続化済みrequestのdigest/path/identityを構造化fieldへ束縛してpublish
   できる。v3 review envelopeはcanonical requestのdigest/path/identityを必須fieldとして持ち、欠落・
   不一致をmemoryへdowngradeせずinvalidとして拒否する。consumerはfree-form本文を分類せず、
   `purpose=review`かつcanonical request照合成功時だけ
   正規delegationを起動する。旧wakeを削除せずgeneric通知として維持しながら、review用途への逆流を
   機械的に封鎖する。

### 最小application境界

既存`review` CLI surfaceへlive projection actionを追加し、request側は
`memoryId / pr / exactHead / reviewRevision / authorFamily / memoryPath`を明示入力として
`issueReviewRequest()`成功→`purpose=review`のtyped claude-memory-wake publishの順に実行する。
live consumerは構造化requestを照合後、既存delegation CLIをreview identity flag付きで起動する。
verdict側はそのchildが生成した同一request identity・verdict file・spawn attestationだけを入力として
`projectReviewVerdict()`成功→派生表示の順に実行する。free-form memory本文やtag、interactive sessionの
自己申告からidentity/verdict/provider factsを抽出しない。`memory add`自体をrequest/receipt正本へ
昇格させず、既存writer・delegationを呼ぶcomposition adapterだけを追加する。

移行ownerはlive projection actionとする。初回実行時にopen PRのcurrent exact HEADを列挙し、同identity
のcanonical requestが無いPRだけを1回dispatchする。merge済み/closed PRと旧PR #300 requestは変更・
再利用せず監査履歴として残す。以後はcontent-addressed request identityでretryを収束させる。

### TDD / E2E oracle

`CANDIDATE-RVATT-023`〜`028`を先にRED化し、実装PRで`U-RVATT-023`〜`028`へ昇格する。

1. request永続化失敗時はv3 `purpose=review` wake publish 0、成功時だけrequest 1→review wake 1の順になる。
   `memory add --notify-claude`のv3 `purpose=memory`とin-flight v2へPR review本文/tagを与えてもreview
   delegation/receiptは0。v3 review identity欠落・不一致とunknown schemaもdelegation/receipt 0。
2. interactive自己申告attestation、verdict/identity/receipt失敗時はreceipt・PR comment・feedback memory
   0。Codex著者→Claude child、Claude著者→Codex childのspawn factsに束縛したattestationだけが
   receipt 1→派生表示へ進む。同族fallback、未知author family、反対族runtime不在はreceipt 0。
3. 同一identity retryはrequest/receipt各1へ収束し、wake replayも既存operation identityへ収束する。
4. HEAD更新は新requestを作り、旧HEAD receiptではD1/D2が`merge_ready`にならない。
5. repository snapshot上の実application compositionを、既存merge-gate portsへGitHub fixtureを注入して
   dispatch→request→delegated verdict→receipt→同一HEAD wrapper allowまで通す。実networkは使わず、
   request欠落・receipt欠落・別HEADはdenyする。wrapper成功receiptをD2-Dへ渡した後の
   `bypass_merge`は0。
6. repo既存のimport-boundary検査でmemory/comment readerからD1/D2判定器へのimport edgeが0であることを
   固定する。未実装のcall graph解析器は追加しない。

本sliceはdocs-only pair-freezeであり、source、CLI、hook、memory schema、GitHub設定を変更しない。
実装はこのfreezeの非author cross-review完了後、Issue #218のD3a単独PRとして行う。

### D3a live projection実装（2026-08-14）

実装の第一原子sliceとして、canonical requestを先に永続化してからtyped review wakeを発行する
producerを`src/feedback/live-review-projection.ts`へ合成し、`review live-dispatch`へ最小配線した。
claude inboxはv3 `purpose=memory|review`へ更新し、v2はmemory限定で互換読出しする。unknown schema、
review identity欠落・不一致、memory本文中のreview文言はdelegationへ昇格しない。

- `U-RVATT-023`: request成功→typed wakeの順序、失敗時wake 0、v2/v3 memoryとinvalid reviewの非昇格。
- `U-RVATT-025`: 同一request/operationのcontent identity収束とv3 publish冪等性。
- exact HEAD `4f1f32a7` snapshot: `tests/live-review-projection.test.ts` 9/9 green。
- 同一source差分で`tests/claude-memory-wake.test.ts` 14/14、`tsc --noEmit`、Biome、diff checkがgreen。

consumerはv3 review envelopeをcanonical requestのpath/digest/exact HEAD/revision/author familyへ照合し、
反対族providerだけを既存delegation CLIで起動する。receiptは実spawn factsとcanonical memory identityへ
束縛し、成功後だけHARNESS memoryとPR commentへ派生投影する。unknown/unavailable/same-family、identity
不一致、request/receipt欠落、stale HEADはfail-closeする。

- `U-RVATT-024`: 反対族routing、実spawn attestation、receipt前の派生出力0。
- `U-RVATT-026`: HEAD更新後の旧request/receipt拒否と再dispatch要求。
- `U-RVATT-027`: `tests/review-live-cli.test.ts`で実CLI compositionとprovider stubを通し、spawn facts由来receiptを生成する。実repo上のdispatch→receipt→wrapper allow→backstopで`bypass_merge` 0、3負例deny。
- `U-RVATT-028`: 既存dependency analyzerでmemory/comment readerからD1/D2判定器への逆流edge 0。
- exact HEAD `ce0216ef`: `tests/live-review-projection.test.ts` 12/12、
  `tests/cli-delegation.test.ts` 3/3、`tests/dependency-drift.test.ts` 14/14 green。
- 同HEADで`tsc --noEmit`、対象8ファイルのBiome、diff checkがgreen。

provider-family authority が PO 未承認または未実装の間、D3d は `unverified_family` を返し、
`custody_admitted` を生成しない。この trusted-custody 経路に accepting state はなく、既存 D2 の
判定をその保証へ暗黙昇格しない。承認済み `VerifiedProviderIdentity` と残る全条件が揃った時だけ、
D3d は custody を受理できる。

### 既存実装との所有境界

- judgment schemaの意味は既存`src/feedback/review-attestation.ts`と整合させるが、同実装の
  16桁digestや自由形式`reviewRevision`をD3 receiptへ流用しない。
- D3dは非同期・typed resultの専用`GitHubAttestationVerifierPort`を`src/feedback/ports/`へ置く。
  同期booleanかつ`hmac-sha256`固定の既存`src/plan-asset/ports/evidence-attestation.ts`は変更せず、
  GitHub信頼根にもprovider-family証明にも使わない。これは第三signerの追加ではなく、GitHubを
  唯一のartifact provenance verifierとしてapplication portへ隔離する境界である。
- D3dの新規domainはmechanical envelopeのstrict decode、GitHub factsの二重照合、judgmentと
  envelopeのAND評価に限定する。GitHub取得、署名、D1判定の責務をdomainへ複製しない。
- RetryYN/HELIX-HARNESS `main@1ee1bb5bd55078252490d5e3f3f70d7363a00f4a`は、closed
  provider enum、judgment/provenance分離、exact-subject freshness、typed failure、bounded retryの
  参考に限る。`.helix`、HELIX CLI/env/DB/runtime、local authenticity方式はUT-TDDへ導入しない。

### Receipt envelope

receipt は strict schema とし、unknown field、欠落、型違いを拒否する。judgment本文やraw
provider transcriptは含めず、sanitized digest / typed resultだけを参照する。

| field | 契約 |
|---|---|
| `schemaVersion` / `receiptKind` | closed enum。`pre_merge_review` と `post_merge_closure` を混同しない |
| `repository` / `prNumber` / `baseRef` | GitHub API と event payload の双方から再取得して完全一致 |
| `headSha` | immutable 40 hex。PR HEAD、request、judgment、Check Runを同一subjectへ束縛 |
| `mergeSha` / `mergeMethod` / `mergedAt` | post-mergeだけ必須。`mergeSha`/`mergedAt` は GitHub API facts へ束縛し、`mergeMethod` は workflow dispatch の operator-supplied assertion として issue/admit の両 step で一致照合する（GitHub API が方式の真実性を証明する field ではない）。pre-mergeへ注入、post-mergeで欠落はいずれも拒否 |
| `planId` / `planRevision` / `reviewRevision` | `reviewRevision`はcanonical request digest由来の`rv1-<64 lowerhex>`だけを受理 |
| `judgmentDigest` / `receiptDigest` | SHA-256 lowerhex。本文を複製せず、検証済み対象との一致を要求 |
| `workflowRef` / `workflowSha` / `runId` / `runAttempt` / `issuer` | Artifact Attestation と GitHub API factsへ束縛 |
| `providerEvidenceRef` | D3bの検証済みprovider judgment参照。存在だけではfamily強証明にしない |

予測不能 `nonce` は採用しない。同一subjectと同一contentの再送は同一canonical digestとなる
冪等 replay とし、repository / PR / HEAD / revision / kind のいずれかが変わったreceiptは別
subjectとして旧receiptを利用できない。

canonicalization は RFC 8785 JSON Canonicalization Scheme → UTF-8 → SHA-256 lowerhex とする。
`reviewRevision` の preimage は exact request identity object
`{schemaVersion:"review-request/v1",memoryId,pr,exactHead,authorFamily}`とする。`requestedAt`は更新可能な
metadataでありidentityへ含めないため、同一レビューのretryは同じrevisionになる。
`receiptDigest` の preimage は receipt schema のfieldから `receiptDigest` と外部
attestation/signature bytesを除いた exact object とし、field追加や独自並べ替えを許さない。
`artifactDigest` は receipt field ではなく、`receiptDigest`を含む完成receipt artifact bytesから
外部で計算し、GitHub Artifact Attestation と `GitHubAttestationVerifierPort` のbinding入力にする。
receipt自身へ書き戻さないため自己参照やdigest間の循環を作らない。既存の16桁digest、`REV-000`、
自由文字列、再計算不一致は`identity_mismatch`で拒否する。

### 発行・検証境界

1. GitHub factsは開始時と発行直前の2回取得し、event payload、API read 1、API read 2の
   repository / PR / base / head / stateを比較する。race、closed/merged状態のkind不整合、
   fork/別repositoryへの差替えではattestationを0件とする。
2. D3d workflow は固定パス `.github/workflows/review-attestation.yml` に分離する。
   `pull_request_target`を使う場合はdefault branchのpinned workflowだけを実行し、PR HEADの
   checkout、PR code、PR由来artifact/cache、PR制御のscript/actionを実行しない。permissionsは
   `contents: read`、`id-token: write`、`attestations: write`のprofile別allowlistへ閉じる。
   D3dは`github-ci-policy` loaderへこの固定パスの`attestation_runtime` roleを明示追加し、source
   profileで必須、Pack profileで対象外とする。任意globは使わず、欠落・trigger・permission・
   PR入力実行をfail-closeする。既存`harness-check.yml`のstep/permission/required-check契約は変えない。
3. targetではD2 GitHub adapterがCI evidence `harness-check-linux`、`harness-check-windows`、
   非required `harness-ci-aggregate`を同一HEADへ束縛し、純粋D1へtyped入力として渡す。3jobが
   successの場合だけ
   D1内部状態`merge_ready`候補を許し、aggregate `harness-check`はD2だけが所有する最終出力として
   D1入力から拒否する。missing / failure / cancelled / skipped / stale HEADも候補をmerge非適格に
   するが、それだけで正規receiptのcustodyを無効化しない。現行`checksGreen` booleanはこのtargetを
   満たさない。D3dはCI判定やreasonを複製せず、将来D2がD1 `merge_ready` AND D3d
   `custody_admitted`を評価する。main protectionの`enforce_admins=true`は実効blockの検証対象だが、
   receiptの真正性そのものの代替ではない。
4. attestation不在、signature/issuer/binding不一致、artifact retention切れ、`gh attestation
   verify`不能を成功へ丸めない。不在は`missing`、署名不正は`signature_unverified`、issuer不一致は
   `signer_mismatch`、取得・検証不能は`audit_unavailable`とし、いずれも`custody_admitted`に数えない。
5. token、credential、raw transcript、raw exception/stack、personal absolute path、PR本文由来の
   実行命令をreceiptへ保存しない。provider timeout/rate limit retryは有界で、exhaustion時は
   receipt 0件 + typed reasonとする。

### Fail-close reason

`missing` / `signature_unverified` / `signer_mismatch` / `identity_mismatch` /
`receipt_corrupt` / `head_raced` / `provider_failed` / `verdict_flagged` /
`unverified_family` / `audit_unavailable` を区別する。`missing`への平坦化や、判定不能を
PASSへ寄せるfallbackは禁止する。

## D3d 実装 (2026-08-07、trusted remote receipt を main へ着地)

D3c freeze の契約をそのまま実装した。**契約の再定義はしていない** (実装 PR 内での方式発明は
PR スコープ規律 2 の禁止事項)。着手前に `ut-tdd advisor --decision design --current-model
claude-opus-5 --execute` で 3 案 (A: custody_admitted を機械 custody へ再定義 / B: freeze どおり
family authority を AND 入力に据える / C: family 軸を D3e へ分離) を諮り、**案B が生存**した
(advisor: `claude-fable-5`。A/C は D2 の `merge_ready AND custody_admitted` から family 軸が
無言で脱落する fail-open の看板替えとして refuted)。

### 出荷物と責務

| artifact | 責務 |
|---|---|
| `src/feedback/review-custody-canonical.ts` | RFC 8785 JCS → UTF-8 → SHA-256 lowerhex 64 桁。`reviewRevision` = `rv1-<64hex>` を exact request identity から導出 |
| `src/feedback/review-custody.ts` | receipt の strict decode、subject 束縛、TOCTOU、run facts、attestation AND、`custody_admitted` / typed fail-close |
| `src/feedback/ports/github-attestation-verifier.ts` | 非同期 typed の GitHub provenance verifier port |
| `src/feedback/ports/provider-family-authority.ts` | `VerifiedProviderIdentity` port。**受理側実装は本 repo に無い** |
| `src/feedback/adapters/gh-attestation-verifier.ts` | `gh attestation verify` adapter。certificate URI を receipt field 形へ正規化するだけで判定しない |
| `src/feedback/review-custody-runner.ts` | workflow 側 entrypoint (`issue` / `admit`)。I/O のみ |
| `.github/workflows/review-attestation.yml` | 固定パスの独立 workflow。`workflow_dispatch` のみ |

### 契約に対する実装上の確定事項

1. **既存資産を流用しない境界を守った**: `review-attestation.ts` の 16 桁 digest と
   `localeCompare` による key 整列は D3 receipt に使っていない (locale で順序が動くため
   attestation の binding 入力にできない)。`src/plan-asset/ports/evidence-attestation.ts` は
   無変更。
2. **receipt の全 field を pattern / enum / 整数域で閉じた**。自由文字列 field が 1 つも無いので、
   token / raw transcript / raw stack / absolute path / 実行命令は構造的に混入できない
   (`U-RVGHA-D3C-014` がこの性質を検査する)。
3. **`artifactDigest` は receipt field ではない**。完成 receipt bytes から一方向に計算し、
   attestation の subject と突き合わせる。receipt へ書き戻さないので自己参照も digest 間の
   循環も作らない。
4. **`AdmittedCustody` は CI / merge 由来 field を 1 つも持たない** (`U-RVGHA-D3C-016` が key
   集合で固定)。Check Run を第二 SSoT にせず、merge 適格性は D1 `merge_ready` と D2 の所有の
   まま残る。
5. **workflow は `workflow_dispatch` のみ**。freeze は `pull_request_target` を使う場合の条件を
   定めていたが、trigger を dispatch だけに閉じれば PR 由来 code / script / action / artifact /
   cache を実行する経路自体が存在しない (より強い側へ倒した)。`github-ci-policy` に
   `attestation_runtime` role を追加し、trigger 逸脱・過剰 permission・PR 入力実行・
   default branch 非固定・必須 step 欠落を fail-close する。
6. **`attestation_runtime` を `requiredRoles` へは足していない**。あの必須集合は部分 fixture にも
   一律適用されるため、追加すると本 gate と無関係な既存 oracle が 7 件 `missing_workflow` で
   落ちるだけで検出力が増えない (2026-08-07 実測)。workflow の実在は `U-RVGHA-D3C-010` が
   実 repo の `loadGithubCiPolicyDocs` に対して強制する。
7. **`harness-check.yml` / `src/cli.ts` / merge gate には触れていない**。D2 の最終 AND 配線
   (required `harness-check` への投影、`harness-ci-aggregate` への rename) は本 PR の範囲外。

### Merge 後 live dispatch の実測と是正 (2026-08-07)

PR #285 の merge commit `e032e0787a26231c28e939d85b45668ad9915080` 直後に、メモリの手順どおり
`review-attestation.yml` を default branch から dispatch した。Issue receipt と Artifact Attestation
は成功したが、Admit が `identity_mismatch (pre_merge_requires_open_pull_request)` で停止した
(run `31157752744`)。原因は workflow runner が PR の現状態を読んでいたにもかかわらず、receipt と
expected の `receiptKind` を常に `pre_merge_review` に固定していたことである。これは merge 後の
post-merge closure 契約を満たさない実バグであり、既知の provider-family `unverified_family` とは
別の blocking failure として扱う。

是正では次を固定する。

1. GitHub facts の `state=MERGED` から runner が `post_merge_closure` を導出し、`mergeSha` と
   `mergedAt` を API facts と receipt の双方へ束縛する。`OPEN` の場合だけ従来どおり
   `pre_merge_review` を発行する。
2. GitHub API が事後に返さない merge method は `workflow_dispatch` の
   `merge_method` choice input から受け取る operator-supplied assertion とし、
   `merge|squash|rebase` 以外・MERGED 時の欠落を fail-close にする。workflow の issue/admit
   両 step が値を必須取得し、admit は receipt の `mergeMethod` と一致しない値を
   `identity_mismatch` で拒否する。これは step 間の配線同一性を保証するものであり、GitHub API
   facts による merge 方式の真実性証明ではない。
3. `U-RVGHA-D3C-008` に post-merge closure の正常系・`mergedAt` drift の負例を追加し、runner の
   state 導出・pre/post metadata・欠落入力を同じ test lane で検証する。

修正を main へ着地した後、同じ judgment subject を新しい exact HEAD へ更新して live dispatch を
再実行する。期待する終端は provider-family authority 未承認による `unverified_family` であり、
`pre_merge_requires_open_pull_request` や `post_merge_*` の kind 不整合を再発させない。

### `gh attestation verify` 実出力による adapter 是正 (2026-08-07、merge 前)

初版の adapter は `gh attestation verify --format=json` の出力形と引数形を**実出力を見ずに**書いて
いた。merge 前に実測して 2 件の実バグを潰した (gh 2.87.3、
`gh attestation verify gh_2.97.0_windows_arm64.zip --repo cli/cli --format json` を実走)。

1. **`--digest` フラグは存在しない** (実測: `unknown flag: --digest`、exit 1、stdout 空)。subject は
   positional の file path か `oci://` URI でしか渡せない。digest だけを渡す初版は、usage error が
   exit 1 + stdout 空になるため **`missing` (attestation 不在) へ誤分類**していた — 「コマンドが
   動かなかった」を「証跡が無い」と報告する fail-close の質の劣化である。
   `GitHubAttestationQuery.artifactPath` を必須にし、`CustodyAdmissionInput.receiptPath` から
   domain を素通しして port へ渡す (domain は path を読まない)。
2. **subject digest の照合が抜けていた**。実測で `verificationResult.statement.subject` は
   `{name, digest:{sha256}}` の**配列**であり、1 つの attestation が複数 artifact を被覆しうる
   (cli/cli の 1 attestation が全リリース資産を被覆していた)。「attestation が verify できた」
   ことと「それが**この** artifact に対する attestation である」ことは別であり、後者を見て
   いなかった。`GitHubAttestationFacts.subjectDigests` を追加し、membership 判定は domain
   (`attestationFactsMatch`) に置いた。adapter が嘘の facts を返しても別 artifact の attestation を
   流用できない。

certificate の field 名 (`sourceRepositoryURI` / `buildSignerURI` / `buildSignerDigest` /
`runInvocationURI` / `issuer`) と URI 形は実出力と一致していた。実測値を `U-RVGHA-D3C-011` の
fixture として写し、推測が再混入したら赤になるようにした。`--cert-oidc-issuer` も明示指定へ変更
(freeze の issuer 束縛を gh 側でも強制する)。

### 是正後 live dispatch の実測 (2026-08-07、main `c211ff92`)

receipt kind バグの是正 (`#287`、merge commit `c211ff92f7743766ff116fa49db0e40607d9e6a0`) を main へ
着地させたうえで、default branch の `review-attestation.yml` を `workflow_dispatch` で 2 本走らせ、
post-merge closure 経路が終端まで通ることを実測した。両 run とも conclusion は success である。

| run | 入力に供給した author/reviewer family | artifactDigest | 終端 |
| --- | --- | --- | --- |
| 31163323673 | author=codex / reviewer=claude | `fd08ae362f1d358d41b38ecaad60ab027e5ee0232ec63155977e9c3121fa01d9` | `unverified_family` |
| 31163381133 | author=codex / reviewer=claude | `6bd96f9441af19277874e6b857ef2a372df5a63ed220d3d501077bb402205c58` | `unverified_family` |

admit step の出力は両 run で同一である。

```
review-custody admit - OK (mechanical custody verified; terminal state unverified_family,
                           provider family authority is not approved yet)
```

実測から確定したこと。

1. **issue → attest → admit の 3 段が実 GitHub 上で通る。** `actions/attest-build-provenance@v2` が
   発行した attestation を `gh attestation verify` 経由の adapter が読み、subject digest の membership、
   signer workflow、OIDC issuer の照合まで到達している。前段の run `31157752744` が出した
   `identity_mismatch (pre_merge_requires_open_pull_request)` は再現しない。
2. **終端は `unverified_family` であり `custody_admitted` は出ない。** これは freeze が意図した
   fail-close であって欠陥ではない。逆に承認前の実環境で `custody_admitted` が観測されたら、
   それ自体が負の oracle の発火である。
3. **receipt が request 内容に束縛されている。** 2 run は memory id / judgment digest /
   provider evidence ref が異なり、artifactDigest も異なる。同一入力でなければ同じ receipt に
   ならないため、cross-PR replay や入力差し替えは digest 不一致として現れる。

D3 の live 結合試験はこれで閉じる。`unverified_family` を先へ進めるには provider family authority の
信頼根が要り、それは authentication / authorization を変える高影響境界として D2 着工時の PO 承認事案に
残る。

入力の replay / mutation 拒否の一次証拠は `tests/review-custody.test.ts` の
`U-RVGHA-D3C-002` / `U-RVGHA-D3C-012` であり、上記 live 2-run は issue → attest → admit の
実環境整合性を補助的に実測したものへ位置付ける。

### 誠実に明記する未達

- `mergeMethod` は GitHub API の merge facts に含まれないため、Artifact Attestation が保証するのは
  workflow が発行した bytes の provenance だけであり、方式そのものの真実性ではない。本 PR は
  issue/admit 間の一致と enum/欠落の fail-close までを実装し、GitHub facts からの方式判定は別契約へ
  膨らませない。D2 がこの field を merge eligibility の根拠に使う場合は、方式の検証可能性を別 PLAN
  で定義する。

- **provider-family authority は未承認・未実装**。したがって実 GitHub 実行では機械 custody が
  全 green でも終端は `unverified_family` であり、`custody_admitted` は port double を注入した
  単体テスト (`U-RVGHA-D3C-017`) でのみ観測できる。これは freeze の意図した fail-close であって
  欠陥ではないが、**承認前に実環境で `custody_admitted` が観測されたらそれ自体がバグ**という
  負の oracle として機能する。方式承認 (provider 別 GitHub App / bot / OIDC subject 等) は
  authentication / authorization を変える高影響境界であり、PO 承認事案として D2 着工時に残る。
- `U-RVGHA-D3C-009` / `-016` は D3d 所有範囲 (custody が CI 状態から独立であること) までを固定し、
  D2 の CI aggregate receipt provider 配線は D2 component evidence の candidate 表 (CANDIDATE-RVD2 系)
  のまま残す。

### D3c freeze 完了条件

- [x] 上記の信頼根、receipt schema、TOCTOU、安全workflow、fail-close分類がL7 RED oracleと対になる。
  根拠: `U-RVGHA-D3C-001`〜`-018` の 18 件が test-design で宣言され、同じ 18 件が実テストから
  引用されている (`tests/review-custody.test.ts` に 17 件、`tests/github-ci-policy.test.ts` に
  `U-RVGHA-D3C-010`)。宣言集合と引用集合の一致は `U-OIDGATE-005` が機械強制する。
- [x] claim-blindで各契約にcitation付き反駁が成立し、spec-blindで3 attack trial以上を記録する。
  根拠: PR #285 の Codex closing cross-review が citation 付き blocking FLAG を成立させ
  (issuecomment-5213358715、`gh attestation verify` の引数形/出力形が未検証の推測である点)、
  是正後 PASS (issuecomment-5213879263)。`review_evidence[0].attack_trials: 3`。
- [x] non-author Claude familyのOpus reviewで未解決FLAGがない。
  根拠: Codex authored の PR #287 に対する Claude (`claude-opus-5`) closing review が
  blocking FLAG (BL-1: admit 側が `UT_TDD_CUSTODY_MERGE_METHOD` を消費していない) を出し、
  是正後 exact HEAD `ef26c18b` で PASS (issuecomment-5214789116)。未解決 FLAG は残っていない。
- [x] 実装・workflow・CLI・外部権限変更が本doc-only sliceに混入していない。
  根拠: D3c freeze slice は PLAN と L7 oracle のみを変更した。実装・workflow は後続の D3d
  (PR #285) で入れ、CLI 配線と外部権限変更は D2 以降として未着手のまま
  (`src/cli.ts` / `.github/workflows/harness-check.yml` は D3 レーンで未変更)。

## D2-B 実装 (2026-08-13、PR #299)

### 実装範囲と成果物

`ut-tdd pr merge --pr <N>` の正規経路に `evaluateMergeGate` を接続し、D1 の
`merge_ready` 以外を exact HEAD 単位で deny する wrapper を実装した。判定前後の GitHub
観測、intent/result receipt、`--match-head-commit` を同じ HEAD へ束縛し、review input と receipt
は isolated fixture から読む。実装成果物は `src/feedback/review-merge-gate.ts`、
`src/cli/pr-merge.ts`、テスト成果物は `tests/review-merge-gate.test.ts` である。
実テストは `it()` 14 件である。

### A-5 裁定

B 面の deny 対象に custody を含めない。custody は A 面の最終 AND に属する。現状の D3d は
`unverified_family` 固定であるため、B 面へ custody を含めると全 merge が拒否されるためである。

### B-3 deny receipt の束縛

複数 entry が同一 HEAD に存在する場合、deny 候補が exactly 1 件のときだけ、deny の
`verdict` と reviewer identity をその entry へ束縛する。判定 entry を一意に定められない
(deny 候補が 0 件または 2 件以上の) deny では `verdict: null` / `authorizedEntry: null` とし、
先頭 entry 由来の誤導的な証跡を残さない。`U-RVMG-002` / `U-RVMG-003` / `U-RVMG-014` が
この境界を固定する。

### 実装時 review evidence

PR #299 の Claude family blind re-review (subject `021cb536`) は `blocking 0` だった。これは
前回 subject に対する証跡であり、rebase 後 HEAD `5215bc23` に対する closing review は本 slice
の定量検証後に再取得する予定である。frontmatter の `review_evidence` に
`worker_model: gpt-5.6-luna` / `reviewer_model: claude-opus-5` として append した。

#### D2-D 実装契約 freeze (2026-08-13)

D2 scope 改訂 (2026-08-03) §2 の backstop を、B 面 (D2-B、PR #299 merge 済) に対で実装する
契約として本節に freeze する。B は「wrapper 経由の merge を fail-close で deny する」一次防壁
であり、D は「wrapper を迂回した merge を post-merge に検知して可視化する」backstop である。
D 無しの B は迂回が静かに通る fail-open の看板替えになるため対必須 (D2 scope 改訂 §2 既定)。

**検知対象 (2 種、いずれも main への merge を対象)**

1. `bypass_merge`: merge commit を B の wrapper receipt (`.ut-tdd/logs/review-merge-gate.jsonl`
   の `merge_result` 行、decision=merge) と突合できない merge (= `gh` 直叩き等の wrapper 迂回)。
2. `merged_without_verdict`: D1 analyzer (`analyzeReviewDispatch`、
   `src/feedback/review-dispatch.ts:464` の既存 reason) を merge commit の PR exact HEAD で
   評価した結果、この reason を含むもの。

**突合先の正本 = ローカル wrapper receipt JSONL のまま (案 a 採用)**。検知 surface
(session-start digest / `feedback_events`) はローカル実行であり、両ランタイム (Claude /
Codex) は同一機械・同一 repo checkout を共有するため、receipt はどちらの merge でも見える。
receipt を追跡ファイルへ昇格する案 (案 b) は不採用とする — Safety Boundaries が定める
「非追跡 runtime artifact を track しない」境界の例外を増やすだけで、検知精度は上がらず
最小実装原則に反する。trade-off として、**検知は wrapper を実行した機械と同一機械上でのみ
完全**であることをここに明記する。機械横断の検知強化 (receipt の共有ストレージ化等) は
本 freeze の範囲外とし、必要になった時点で別 PLAN を起票する。

**cutoff baseline (ratchet)**: D 実装 commit の merge 時刻より前の merge は検知対象外とする。
B 着地 (PR #299) 以前は wrapper 自体が存在せず、既往 merge を遡って全部 `bypass_merge` 扱い
にすると偽陽性で埋まるため。**baseline の正本は tracked source 内の唯一の定数** (D 実装
module 内に export する ISO UTC 時刻定数 1 個) とし、receipt 初行 anchor 等の untracked 値を
正本にしない (clean checkout / 別 machine で ratchet を再構成できないため。cross-review FLAG
2026-08-13 指摘 1 の是正)。**定数の具体値は「D 実装 branch と origin/main の merge-base commit
の committer date (UTC)」とする** — `git log -1 --format=%cI $(git merge-base HEAD origin/main)`
で branch 作成時点に確定する値であり、source へ書き込んでも変化しない (source 更新で HEAD が
進んでも merge-base は不変。delta FLAG 3 回目 blocking 1 の是正: 「HEAD 日時を HEAD 内容へ
埋める」自己参照の固定点不在を、source 更新で変化しない既知 anchor に置換)。branch を
main へ rebase した場合のみ merge-base が進むため、その際は定数も同じ式で再導出して更新する
(式が固定手続であり実装時発明の余地はない)。merge-base 以降・D 実装 merge 以前の main への
merge は、wrapper 経由 (decision=merge receipt あり) なら偽陽性にならず、receipt 無しなら
`bypass_merge` として検知される — B (PR #299) は既に拘束中のため、これは正しい検知である。
値の根拠 (merge-base SHA + 導出コマンド) を実装 PR の review_evidence citation に固定した上で、
確定後にこの節へ追記する。

**検知の入力**: `gh api` による merged PR 一覧 (merge commit SHA / mergedAt / PR 番号 /
head SHA)。取得は「直近一覧」ではなく **baseline 以降の merged PR を pagination 終端まで
全ページ走査**する契約とする (per_page 上限に依存した窓を作らない。mergedAt が baseline より
古い PR に到達した時点での早期終了は可、ただし sort 順に依存する早期終了はその sort が API
契約で保証される場合に限る)。**途中の page 取得失敗・欠落がある場合、部分結果を「検知 0 件 =
green」として扱わず「検知不能」を明示する** (cross-review FLAG 2026-08-13 指摘 2 の是正 —
検知停止中の merge burst が窓外へ落ちて永久未検知になる経路を塞ぐ)。`gh api` が全体として
到達不能な場合も同様に、検知を無音で skip せず「検知不能」を digest / event へ明示する
(fail-close 表示の一種。判定不能を green へ丸めない D3c 既定の踏襲)。

**表示配線**: session-start digest (`src/handover/session-start-digest.ts`、`SessionStartDigest`
の既存 fail-close 段の並びに追加) に bypass/merged_without_verdict の件数 + PR 番号を出す。
`feedback_events` (`src/feedback/engine.ts` の `emitFeedbackEvents(db)`、`FeedbackEvent` 既存
schema — `signal_type` / `severity` / `next_action` 等の既存 field に従う) へ同内容のイベント行を
投影する。surface は `src/feedback/surface.ts` の既存 selection 経路に乗せ、新しい層・新しい
DB テーブルは作らない。検知は可視化のみであり、自動 revert 等の破壊的動作はしない。

**oracle 対**: `U-RVMG-*` の続番で以下を宣言し、実装 PR で test-design と 1:1 にする。

1. receipt ありの正常 merge (wrapper の `merge_result` decision=merge receipt を持つ merge) が
   誤検知されない (B の実装定義どおり deny は merge しないため、正常経路は decision=merge のみ。
   cross-review important 指摘の是正 — 旧文言「deny 経路を通った merge」は B と矛盾するため削除)。
2. receipt 無し merge が `bypass_merge` として検知される。
3. cutoff baseline より前の merge が検知対象に含まれない (baseline は tracked 定数から読む)。
4. `merged_without_verdict` の PR が検知される。
5. `gh api` 不能時に「検知不能」が digest / event へ明示される (無音 skip の禁止)。
6. merged PR 一覧の pagination 途中失敗 (2 ページ目以降の取得失敗) で、部分結果が green に
   ならず「検知不能」が明示される。
7. 対象 (receipt 無し merge) が **2 ページ目以降にのみ存在する正常 multi-page 系**で検知される
   (先頭 page 固定の実装は RED)。
8. pagination の終端判定: 同一 cursor / 同一 page が反復する応答で無限 loop せず、走査上限
   到達時は結果を green に丸めず「検知不能」へ倒す (bounded traversal)。**上限は定数
   `MAX_MERGED_PR_PAGES = 50` (per_page=100、最大 5,000 PR) とし、D 実装 module 内に export
   する** (本 repo の PR 総数は 2026-08-14 時点で約 320 であり一桁以上の余裕。到達し得るのは
   API 異常のみで、その場合に「検知不能」へ倒すのが正しい)。oracle は「51 ページ目相当の
   応答が続く fixture で上限到達 → 検知不能」を pin する (delta FLAG 3 回目 blocking 2 の是正:
   bound の具体値と導出根拠を freeze し、1 page 打ち切りも実質無限待機も適合実装になり得ない
   ようにする)。
9. HTTP 成功だが必須 field (merge commit SHA / mergedAt / PR 番号) が欠落・malformed な
   partial response は、当該 page 以降を「検知不能」として扱い、部分結果を green に丸めない。

**Reverse 合流**: 本 D2-D 追加契約 (bypass_merge / merged_without_verdict / cutoff baseline /
pagination 全走査 / 検知不能表示) は `PLAN-REVERSE-465` の上流合流 (R1〜R4) 対象に含める。
D 実装の接地後、R1 で L6/L7 設計への back-fill を検証する (形式的 parent/pair だけに依存せず、
新契約の upstream closure を Reverse 側 AC で再検証する。cross-review important 指摘の是正)。

**advisor 諮問記録 (2026-08-13)**: `ut-tdd advisor --decision design --current-model
claude-fable-5 --plan PLAN-L7-465 --execute` を実行し、provider=claude / model=claude-fable-5 /
exit=0 で応答を得た (2026-08-07 の provider 無応答 —
`.ut-tdd/memory/reference-ut-tdd-advisor-execute-provider-2026-08-07-dry-run.md` — からの回復を
実測)。推奨は案 a 採用で本 freeze と一致: 突合式 = 「baseline 以降の merge commit ∖ receipt」、
baseline は tracked に記録、案 b は「複数機械運用が実在した時点で GitHub merge イベント突合へ
escalate する条件付き将来案」として明記、の 3 点。差分の取り込み: baseline は「tracked な定数
(実装 source 内 anchor)」とし cutoff 節の実装 PR 確定条項に反映、案 b の escalate 条件
(複数機械運用の実在) を上記案 b 却下段落の再検討条件として採用する。advisor の
「severity = advisory」は表示が session を block しない意味であり、本節の「fail-close 表示
(無音 skip 禁止)」と矛盾しない (検知は可視化のみ・破壊的動作なしの既定と同義)。
