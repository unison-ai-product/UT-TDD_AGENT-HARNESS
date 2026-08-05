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
updated: 2026-08-05
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
3. **A (摩擦・可視化、薄く)**: `enforce_admins=false` の solo 運用では required
   check は block にならない (実測: 全 push が "Bypassed rule violations")。よって
   A は block でなく「事故 merge を意図的行為へ格上げする」摩擦として CI に薄く併設
   し、bypass の事実自体を監査シグナルとする。

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
   `merge_ready` へ昇格しない。
4. family を機械的に強証明する provider 別 GitHub App / bot / OIDC subject 等は、
   authentication / authorization を変える外部権限設計である。本 freeze では方式を
   仮決めせず、PO の明示承認を得る D3d 境界へ送る。
5. D1 の現行 SSoT は `analyzeReviewDispatch` が返す `merge_ready` 状態である。D2 の
   `evaluateMergeGate` はその後段 consumer であり、D3d 実装前の構造・順序・CI 判定器として
   存続する。D3d 後は D1 `merge_ready` AND D3d `custody_admitted` だけを D2 が受理する。
   GitHub Check Run はこの単一判断の投影であり、独立した第二の判定器にしない。

`D3a` は review request/response の配送、`D3b` は judgment payload の schema・digest 検証、
`D3c` は本契約 freeze、`D3d` は GitHub provenance と provider-family authority を検証する
adapter 実装を指す。D3b は payload の意味と family の外部真正性までは証明しない。

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
| `mergeSha` / `mergeMethod` / `mergedAt` | post-mergeだけ必須。pre-mergeへ注入、post-mergeで欠落はいずれも拒否 |
| `planId` / `planRevision` / `reviewRevision` | `reviewRevision`はcanonical request digest由来の`rv1-<64 lowerhex>`だけを受理 |
| `judgmentDigest` / `receiptDigest` / `artifactDigest` | SHA-256 lowerhex。本文を複製せず、検証済み対象との一致を要求 |
| `workflowRef` / `workflowSha` / `runId` / `runAttempt` / `issuer` | Artifact Attestation と GitHub API factsへ束縛 |
| `providerEvidenceRef` | D3bの検証済みprovider judgment参照。存在だけではfamily強証明にしない |

予測不能 `nonce` は採用しない。同一subjectと同一contentの再送は同一canonical digestとなる
冪等 replay とし、repository / PR / HEAD / revision / kind のいずれかが変わったreceiptは別
subjectとして旧receiptを利用できない。

canonicalization は RFC 8785 JSON Canonicalization Scheme → UTF-8 → SHA-256 lowerhex とする。
`reviewRevision` の preimage は exact request object
`{schemaVersion:"review-request/v1",memoryId,pr,exactHead,authorFamily,requestedAt}`、
`receiptDigest` の preimage は上表の全fieldから `receiptDigest` と外部attestation/signature bytesを
除いた exact object とし、field追加や独自並べ替えを許さない。`artifactDigest` は完成したreceipt
artifact bytesをGitHubが証明するdigestであり、自己参照させない。既存の16桁digest、`REV-000`、
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
3. required `harness-check`は同一HEADのLinux/Windows/aggregateが全てsuccessの場合だけ受理する。
   missing / failure / cancelled / skipped / stale HEADは全てmerge非適格とする。main protectionの
   `enforce_admins=true`は実効blockの検証対象だが、receiptの真正性そのものの代替ではない。
4. attestation不在、signature/issuer/binding不一致、artifact retention切れ、`gh attestation
   verify`不能を成功へ丸めない。不在は`missing`、署名不正は`signature_unverified`、issuer不一致は
   `signer_mismatch`、取得・検証不能は`audit_unavailable`とし、いずれも`merge_ready`に数えない。
5. token、credential、raw transcript、raw exception/stack、personal absolute path、PR本文由来の
   実行命令をreceiptへ保存しない。provider timeout/rate limit retryは有界で、exhaustion時は
   receipt 0件 + typed reasonとする。

### Fail-close reason

`missing` / `signature_unverified` / `signer_mismatch` / `identity_mismatch` /
`receipt_corrupt` / `head_raced` / `provider_failed` / `verdict_flagged` /
`unverified_family` / `audit_unavailable` を区別する。`missing`への平坦化や、判定不能を
PASSへ寄せるfallbackは禁止する。

### D3c freeze 完了条件

- [ ] 上記の信頼根、receipt schema、TOCTOU、安全workflow、fail-close分類がL7 RED oracleと対になる。
- [ ] claim-blindで各契約にcitation付き反駁が成立し、spec-blindで3 attack trial以上を記録する。
- [ ] non-author Claude familyのOpus reviewで未解決FLAGがない。
- [ ] 実装・workflow・CLI・外部権限変更が本doc-only sliceに混入していない。
