---
plan_id: PLAN-L7-493-d3a-repo-local-verdict-custody
title: "PLAN-L7-493 (add-impl): D3a repo-local digest-bound verdict custody 契約 freeze"
kind: add-impl
layer: L7
drive: be
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-18
updated: 2026-08-19
owner: PM / PO / Codex
parent_design: docs/plans/PLAN-L6-94-cross-review-session-attestation.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: "TL - verdict custody の信頼境界、request digest、sandbox 書込許可の独立レビュー"
  - role: se
    slot_label: "SE - 既存 D3a attestation / delegation / review guard への最小降下設計"
  - role: qa
    slot_label: "QA - repo-local write、外部拒否、identity mutation、retry、cleanup の Red oracle"
generates:
  - artifact_path: docs/plans/PLAN-L7-493-d3a-repo-local-verdict-custody.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-94-cross-review-session-attestation.md
  requires:
    - docs/plans/PLAN-L7-465-cross-review-author-binding.md
  blocks: []
  references:
    - docs/plans/PLAN-L6-94-cross-review-session-attestation.md
    - docs/plans/PLAN-L7-465-cross-review-author-binding.md
    - docs/plans/PLAN-REVERSE-465-cross-review-author-binding-backfill.md
    - docs/plans/PLAN-REVERSE-493-d3a-repo-local-verdict-custody-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/feedback/review-attestation.ts
    - src/feedback/review-verdict-contract.ts
    - src/cli/delegation.ts
    - src/runtime/review-guard.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/328
github_issue_id: 328
backprop_decision: required
backprop_decision_reason: "delegated verdict の信頼境界と再合流時のreceipt入力を変更するため、既存Forwardの証跡へReverse検証を戻す。"
review_evidence: []
---

# PLAN-L7-493: D3a repo-local digest-bound verdict custody 契約 freeze

## 1. 目的と起点

Issue #328 は、PR #320 の canonical self-bootstrap で delegated reviewer が正しい verdict を返したにもかかわらず、verdict file の置き場所が repository 外へ固定されていたため、Claude Code の repository sandbox から書き込めず、receipt が生成されなかった欠陥を扱う。これは D3a の custody を閉じない release blocker であり、D2 merge gate の判定ロジックを緩める修理ではない。

既存の `PLAN-L7-465` が request / attestation / receipt の identity と author family を所有している。本 PLAN はその契約を置き換えず、verdict evidence の物理配置、内容束縛、sandbox 境界、retry と cleanup の追加契約だけを freeze する。実装 source、CLI、test-design の昇格は、本 PLAN の cross-review が PASS になった後の別の降下で行う。

## 2. 設計判断（Fable advisor 済み）

### 2.1 採択

`claude-fable-5`（`decision=design`, effort `low`）へ相談済み。採択は **repo-local gitignored runtime 領域**である。

| 案 | 内容 | 得るもの | 失うもの |
| --- | --- | --- | --- |
| A（採択） | `.ut-tdd/review/verdicts/<requestDigest>/verdict.txt`へ書く | provider allowlist の拡張なし、sandbox と同じ repository 境界、既存 text verdict parser を活用 | `.ut-tdd` の runtime cleanup と path admission が必要 |
| B | provider 起動時に repository 外の verdict directory を allowlist へ追加する | 既存の外部一時領域を維持できる | provider ごとの権限 drift と信頼面が増え、consumer 間の再現性が落ちる |
| C | stdout の verdict 行だけを正本にする | file write が不要で実装は短い | identity binding、retry、encoding、truncation、prompt echo の証明が弱くなり、既存 fail-close 契約を後退させる |

Fable の推奨と、Issue #328 の実 provider sandbox 失敗を合わせ、A を正本とする。`verdict.txt` は既存の `extractVerdict` と互換な本文形式を保持し、identity envelope を同じ file に付加する。provider が path を申告・変更する方式は採用しない。

## 3. 凍結する契約

### 3.1 物理配置と path admission

- consumer は、既存の RFC 8785 相当 `canonicalize` / UTF-8 SHA-256 を使い、次の **identity object** を
  canonical JSON 化した bytes から `requestDigest` (64桁 lowercase hex、切り詰めなし) として導出する。
  key の順序は実装言語の locale ではなく canonicalizer の UTF-16 code-unit 順に固定する。
  `schemaVersion` は `review-request/v1` とし、identity の field 集合は
  `schemaVersion`, `memoryId`, `pr`, `exactHead`, `authorFamily` の5つだけとする。
  `exactHead` は既存 strict decoder の lowercase 40-hex、`pr` は正の safe integer、
  `memoryId` は canonical task/memory artifact identity、`authorFamily` は request author の族である。
  reviewer の族は `authorFamily` の反対側から導出し、自己申告の reviewer role は preimage に入れない。
  `requestedAt`、raw task 本文、provider/model、`invocation_nonce` は retry で変化し得る metadata のため除外する。
- `reviewRevision` はこの identity の `rv1-<requestDigest>` と一致しなければならない。任意文字列の revision や
  既存の16桁 digestを新契約へ持ち込まず、consumer は pattern/一致を検証してから path を導出する。
- verdict の custody root は `repoRoot/.ut-tdd/review/verdicts/<requestDigest>/` とする。各 attempt は
  consumer が単調に割り当てる正の safe integer (`attempt-1`, `attempt-2`, …) の下に
  `attempts/attempt-<N>/verdict.txt` として保存し、attempt field は `N`（整数部）で保存する。
  ここで path の `attempt-<N>` と envelope field の `attempt: N` は一対一対応し、`N=1` は `attempt-1` を意味する。
  reviewer の引数、stdout、環境変数から path や attempt を採用しない。
  最初の試行は `attempt-1`、同一 digest の再試行は次の未使用番号へ進む。attempt directory と verdict file は
  一度作成したら上書きせず、receipt 前の失敗を次の attempt で安全に supersede できる構造とする。
- `<requestDigest>` は path-safe な lowercase hexadecimal とし、別 exact HEAD は別 digest / 別 custody root になる。
  request の同一 retry は同じ digest rootへ収束するが、attempt は別の不変ファイルへ分離する。
- `repoRoot` は起動時に一度解決し、親 directory と final file の symlink / junction escape、absolute path override、`..`、NUL、backslash を拒否する。実体が repository 内に containment しない場合は `unavailable` で終了する。
- `.ut-tdd/review/verdicts/` は gitignored runtime state とする。この前提を実装で成立させるため、implementation PR は
  `.gitignore` に **verdicts directoryだけ**の rule と必要な `.gitkeep` を追加し、`*.md` が tracked として残ること、
  `verdicts/` が `git check-ignore` で ignored になること、実際に作成した `requests/<request>.json` が
  `untracked` として認識されることを regression で固定する。空の `receipts/` directory は Git が追跡も
  `untracked` 報告もしないため、存在・untracked 判定の対象にしない。receipt は実ファイルを生成した fixture
  で内容と cleanup を検証する。source、PLAN、test、tracked config の変更を delegated reviewer の成功条件に含めない。

### 3.2 verdict envelope と identity binding

verdict file は、既存の行頭 `VERDICT:` / `FINDING:` 契約を維持したうえで、次の identity fields を canonical な順序で持つ。

```text
schema_version: ut-tdd.review-verdict/v1
request_digest: <requestDigest>
attempt: <positive safe integer>
pr: <positive integer>
exact_head: <40 lowercase hex>
review_revision: rv1-<requestDigest>
reviewer_provider: codex|claude
reviewer_model: <non-empty string>
invocation_nonce: <stable request nonce>
VERDICT: PASS|PASS-WEAK|FLAG
```

- consumer は request、実 child の provider/model/role/exit code、対象 HEAD、review revision、invocation nonce を receipt projection へ渡す。
- `attempt` は consumer が割り当てた path と一致しなければならず、reviewer の自己申告で採番・選択できない。
- `request_digest`、`attempt`、`pr`、`exact_head`、`review_revision`、`reviewer_provider`、`reviewer_model`、`invocation_nonce` のいずれかが欠落・不一致・未知値なら receipt 0、merge gate 0 とする。
- reviewer が envelope の identity または path を自己申告しても、consumer が保持する canonical request と実 spawn facts を上書きできない。
- `PASS` / `PASS-WEAK` は blocking finding 0、`FLAG` は1件以上の blocking findingを要求する。既存の verdict parser の fail-close を弱めない。

### 3.3 retry、stale、cleanup

- `invocation_nonce` は request writer が生成して request に保存し、同一 digest の全 attempt で再利用する。別 HEAD、別 revision、別 reviewer family は別 request / 別 digest とする。
- 同一 digest・同一 attempt・同一 envelope の再投影は content-addressed receipt へ冪等に収束する。同じ attempt の nonce、canonical identity、provider/model、本文を変える試みは
  `verdict_identity_conflict` として拒否する。
- receipt がまだ無い間は、consumer が割り当てた次の attempt へ再試行を許可する。再試行先は
  family 外へは移らず、同一 `reviewer_provider` / `reviewer_family` の範囲で `reviewer_model` 変更を許可する（同一 model でも可）。
  provider/model/effort の変化有無に関わらず、同一 attempt の再試行は許可しない。
  (`superseded_attempt` を経由)。
  ただし同一 attempt を再書きしない。
  `reviewer_provider` の family は `authorFamily` の反対側から導出した値で不変であり、変更できるのは同じ
  reviewer family 内の model / effort（必要な provider binary metadata を含む）だけである。family 変更は
  `verdict_identity_mismatch` として拒否する。
  新 attempt を受理する前に、旧 attempt の digest、番号、provider/model、exact HEAD、理由を raw verdict なしの
  `superseded_attempt` typed event として `<git-common-dir>/ut-tdd-runtime/review-custody/review-custody.jsonl` へ
  append する。旧 attempt の verdict が欠落する場合は `oldAttemptDigest` に `verdict_absent` を書く。監査 sink は
  worktree の fenceRoot と receipt 後 cleanup の対象外であり、`volatileRuntimeIndex` へ追加する必要はない。
  監査書込みに失敗したら
  新 attempt と旧 attempt のどちらも receipt へ投影せず fail-close とする。選択可能な attempt は consumer が検証した
  最新の未supersede attempt ただ1つに限定し、reviewer の自己申告で選べない。旧 attempt の digest 不在時は sentinel を許容する。
- receipt 成功後は新しい attempt の作成・supersede・上書きをすべて拒否する。これにより model escalation は digest を
  変更せずに収束でき、receipt は常に1件だけとなる。
- receipt の canonical write が成功した後にだけ verdict scratch を削除する。削除不能は `<git-common-dir>/ut-tdd-runtime/review-custody/review-custody.jsonl` へ
   `cleanup_pending` として記録するが、既に検証済みの receipt を成功から失敗へ反転させない。receipt 前の削除・上書きは許可しない。
- 古い HEAD の verdict は current request / current HEAD へ再利用せず、consumer は `stale_head` または `verdict_identity_mismatch` で fail-close する。

### 3.4 legacy oracle と review fence の移行境界

- 既存 `U-RVATT-010` は削除して履歴を隠すのではなく、同じ test ID の契約を「review lane が
  consumer-derived repo-local verdict pathを受け取る」に改訂する。旧 `tmpdir()` 固定 assertion は同じ
  implementation commit で退役し、test-design の correction note と citation を残す。
- `isOutsideRepo` は廃止しない。verdict を常に外部へ置く policy から切り離し、repo-local containment の
  汎用 negative predicate（外部 path / symlink escape は true）として `U-RVATT-017` の外部拒否ケースへ転用する。
- `src/runtime/review-guard.ts` の custody projection regex は
  `^\\.ut-tdd/review/(?:requests|receipts|verdicts)/` へ拡張する。verdicts を追加せずに review lane の
  repo-local write を違反扱いする実装は契約不成立とする。
- `cleanup_pending` は receipt 本文へ未定義 fieldを足さず、既存の git-common-dir runtime の
  `<git-common-dir>/ut-tdd-runtime/review-custody/review-custody.jsonl` へ typed event (`kind`, `requestDigest`, `receiptDigest`,
  `exactHead`, `verdictPath`, `recordedAt`, `reason`) を1行 appendする。raw prompt/verdict/stack/secretは保存しない。
- `tests/global-setup.ts` の fenceとの相互作用は、repo-local verdicts 配下の全 descendantを
  `volatileRuntimeIndex` として content hash対象から除外する実装契約とする。git-common-dir の review-custody
  sink は fenceRoot 外なので除外登録を要求しない。fixture repoで「repo-local verdict writeではfenceが変わらない」
  「通常の tracked/test残留は従来どおり赤」を1:1検証する。

### 3.5 sandbox 実測境界

- 実 provider が repository root 配下の gitignored verdict path へ書けることを実測する。
- 同一 provider が repository 外、別 workspace、親 directory、symlink escape 先へ書けないことを実測する。
- test stub は単なる `writeFileSync` ではなく、repository-local allow と外部拒否を再現する制約を持つ。stub の成功だけを実 provider の証拠にしない。
- stdout に verdict が出ても file が欠落または identity 不一致なら receipt を作らない。

## 4. V-model 対応と実装境界

この docs-only slice の対は `docs/test-design/harness/L7-unit-test-design.md` である。PLAN confirm 時に、次の候補を `U-RVATT-030`〜`U-RVATT-036` として1:1宣言し、実装 PR の source/test と同時に generates を昇格する。

| 候補 | 対象 | 失敗時の期待 |
| --- | --- | --- |
| `U-RVATT-030` | digestからの path導出、containment、symlink/junction、path override | `unavailable`、write 0 |
| `U-RVATT-031` | repo-local sandbox write と repo外 write拒否の実 provider / constrained stub | local 成功、外部拒否、receipt 0 |
| `U-RVATT-032` | envelope の8 custody fieldsを1点ずつ mutation（canonical identity 7 fields + consumer attempt） | `verdict_identity_mismatch`、receipt 0 |
| `U-RVATT-033` | nonce混線、stale HEAD、別revision、別provider | canonical request以外を拒否、merge 0 |
| `U-RVATT-034` | 同一 digest・同一 attempt retry、receipt前の別 model escalation（同一 model を含む）、別 HEAD retry | 同一 attempt は冪等、別 attempt は `superseded_attempt` 後に最新 attempt だけを 1 receipt へ投影、別 HEAD は別 digest |
| `U-RVATT-035` | receipt成功後cleanup、cleanup failure、receipt前cleanup | receipt前は0、成功後はreceipt保持 + `cleanup_pending` |
| `U-RVATT-036` | 実 providerを通す dispatch→consume→receipt→wrapper の一回の実repo E2E | current exact HEADだけ allow、外部/欠落は deny |

実装時の最小責務は、既存 `review-attestation.ts` / `review-custody-canonical.ts` の identity projection、
`review-verdict-contract.ts` の envelope/parser、`cli/delegation.ts` の path注入、`review-guard.ts` の
gitignored runtime除外、`.gitignore` / `tests/support/git-workspace-fingerprint.ts` の runtime境界、
audit event writer、および対応する tests に限定する。新しい判定器、GitHub API、merge bypass、stdout-only経路、
別の memory store は追加しない。

## 5. 実装前の検証と順序

1. 実 provider sandbox で §3.5 の local write / outside reject を測定し、少なくとも1 OSの結果を
   `<git-common-dir>/ut-tdd-runtime/review-custody/sandbox-v1.jsonl` へ secret-free に保存する。provider実測が無い間は
   実装へ進めず、CIの constrained stub greenを実provider証拠と扱わない。
2. 本 PLAN の claim-blind / spec-blind cross-review を exact HEAD で実施する。FLAG は設計へ戻し、実装へ進まない。
3. PASS 後に `U-RVATT-030`〜`036` を test-design の正規表へ昇格し、実装 PLAN の `requires` へ本 PLAN を束縛する。
4. 実装 PRでは、request→delegated child→repo-local verdict→receipt→same-head wrapper の順序を変更せず、Linux / Windows の full CI と実 provider E2Eを取得する。
5. receipt / Memory / PR comment の全てに、同一 PLAN revision、exact HEAD、request digest、残存 `cleanup_pending` を記録する。D2 merge gateの恒久 bypassは作らない。

## 6. 非対象

- provider allowlist を repository 外へ拡張すること。
- verdict file を stdout のみへ置換すること。
- merge wrapper の例外、PO手動merge、D1/D2判定入力の新設。
- #335 PF-5 aggregate admission の実装・レビュー・merge。
- Pack配布や複数consumer E2Eの実装。D3a custodyが閉じた後、Forward依存順に別PLANで扱う。

本 PLAN は設計 freeze であり、source / test / `.gitignore` の変更を含まない。`.gitignore`、review-guard、
volatile fence、legacy oracle migrationは implementation PR の必須成果物として予約する。`status: confirmed` への
昇格と implementation PLAN の起票は、cross-review と sandbox 実測が揃った後に行う。
