---
plan_id: PLAN-L6-72-forward-fsm-evidence-policy-contracts
title: "PLAN-L6-72 (add-design/function-spec): Forward FSM / transition / evidence policy契約"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-08-19
owner: PO / Codex
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: "SE - ForwardWorkflow/reducer/policy/CLI契約"
  - role: qa
    slot_label: "QA - illegal transition/property oracle"
generates:
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L5-17-plan-asset-workflow-ledger-physical-data.md
  references:
    - docs/plans/PLAN-L6-71-plan-asset-canonical-migration-contracts.md
  blocks:
    - docs/plans/PLAN-L7-419-forward-fsm-transition-workflow-cli.md
review_evidence:
  - reviewer: "Codex wave419 design reviewer"
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-10T23:03:00+09:00"
    tests_green_at: "2026-07-10T23:00:20+09:00"
    verdict: approve
    worker_model: gpt-5
    reviewer_model: gpt-5
    scope: "FSM遷移、例外、typed evidence policy、CLI parity、ledger atomicity、property oracleを反復reviewしCritical 0 / Important 0。"
    green_commands:
      - kind: lint
        command: "bun run src/cli.ts plan lint && bunx vitest run tests/design-language.test.ts tests/coding-rules.test.ts --reporter=dot && bunx tsc --noEmit"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T23:00:20+09:00"
        evidence_path: docs/plans/PLAN-L6-72-forward-fsm-evidence-policy-contracts.md
        output_digest: "sha256:ef929a8ee12bc4ba8662869cf42b303fc40d82f0ed0df34332d43b8f6d367dec"
        anchor_commit: bc7b4a2cc0504f380adff576bdda80abfa29656c
---

# PLAN-L6-72: Forward FSM / transition / evidence policy契約

- `ForwardWorkflow.reconstruct/explain/transition`と`reduceForward(events)`を定義し、commandはevent、queryはverdict/stateを返す。
- proposed→archivedの正規遷移、blocked/superseded/rejected/reopenedの理由・revision・evidence policyをtableとして固定する。
- pair freeze前implement、Redなしimplement、trace freeze前review、review/test不足acceptを拒否する。
- evidence kind/cardinality/expiry/producer/subject revision/exit ruleをtyped policy表で固定し、policy不適合exit・別revision・stale evidenceを記録から消さずguardだけで拒否する。Red policyはexpected nonzero exitをusableにできる。
- empty event=`proposed`、sequence 1始まり連続、command/event冪等性、例外resume normal state、terminal stateを固定する。
- `workflow status|transition|explain`は共通JSON envelope/rule ID/verdictとexit 0/1/2/3を共有し、alias多義・future revision・transaction失敗をfail-closeする。
- property oracleはseed、0〜64 event、全state×command、10,000列、決定論的shrinkerを記録する。
- `U-FSM-001..007`と`P-FSM-001`で全正規遷移、skip、例外、reduction決定性、非許可状態到達不能を証明する。

## 訂正注記 (2026-07-21)

本 PLAN の evidence policy 契約部分は PLAN-L6-89-layer-verification-contract が訂正・拡張する
(Issue #108 redesign、supersedes 双方向 back-reference)。PR #103 型の完了誤判定と A-189 型の
pair oracle 未執筆を防ぐ L 別検証契約は L6-89 側が正本となる。Forward FSM 遷移契約
(`U-FSM-001..007` / `P-FSM-001`) は本 PLAN のまま存続する。

## 表の具体化追補 (Issue #345, 2026-08-19)

本追補は、既に宣言していた遷移・例外・evidence policy・CLI envelope を実装可能な
SSoT として具体化するものである。state 集合、admission rule、typed error ID、
`U-FSM-001..007` / `P-FSM-001` の識別子は変更しない。未記載の組合せは暗黙に許可せず、
下表にない `state × event` は `forward-transition-illegal` として拒否する。

### 1. event 語彙と要求 evidence

| event | 許可される from state | next state | 必須 evidence / 追加条件 |
| --- | --- | --- | --- |
| `plan` | `proposed` | `planned` | `scope-approval` |
| `prepare-pair-freeze` | `planned` | `pair_freeze_ready` | `pair-artifact-declaration`, `design-pair-review` |
| `freeze-pair` | `pair_freeze_ready` | `pair_frozen` | `pair-artifact-declaration`, `design-pair-review` |
| `freeze-red` | `pair_frozen` | `red_frozen` | `red-test-run` (expected nonzero を含む) |
| `begin-implementation` | `red_frozen` | `implementing` | `pair-artifact-declaration`, `red-test-run` |
| `complete-implementation` | `implementing` | `implementation_complete` | `implementation-digest`, `targeted-test-run` |
| `prepare-trace-freeze` | `implementation_complete` | `trace_freeze_ready` | `trace-materialization` |
| `freeze-trace` | `trace_freeze_ready` | `trace_frozen` | `trace-closure`, `green-test-run` |
| `prepare-review` | `trace_frozen` | `review_ready` | `trace-closure`, `green-test-run` |
| `submit-review` | `review_ready` | `reviewed` | `independent-review` (非著者 producer) |
| `accept` | `reviewed` | `accepted` | `independent-review`, `gate-run` |
| `archive` | `accepted` | `archived` | `acceptance-decision`, `retention-decision` |
| `block` | 13 正規 state のうち `archived` / `accepted` 以外 | `blocked` | `exception-context.action=block`、reason、subject revision |
| `supersede` | 13 正規 state のうち `archived` / `accepted` 以外 | `superseded` | `exception-context.action=supersede`、reason、replacement subject |
| `reject` | `review_ready` または `reviewed` | `rejected` | `exception-context.action=reject`、reason、subject revision |
| `reopen` | `blocked`、`superseded`、`rejected` | `reopened` | `exception-context.action=reopen`、reason、new revision |
| `resume` | `reopened` | `planned` | `exception-context.action=resume`、reason、new revision |

`archived` は唯一の terminal state であり、追加 event は全て拒否する。`superseded` と
`rejected` は通常の実行を止める exception state だが、replacement / re-entry の audit
context を伴う `reopen` だけを許可する。`blocked` は `reopen` を経由しない直接復帰を
許可しない。イベントは append-only ledger に一度だけ記録し、同一 command ID と同一
payload の再送だけを同一結果へ還元する。

### 2. state × event の閉包規則

上表の `from state` 集合を展開した組合せだけが許可 edge である。すなわち、13 正規
state (`proposed`, `planned`, `pair_freeze_ready`, `pair_frozen`, `red_frozen`,
`implementing`, `implementation_complete`, `trace_freeze_ready`, `trace_frozen`,
`review_ready`, `reviewed`, `accepted`, `archived`) と4 exception state (`blocked`,
`superseded`, `rejected`, `reopened`) の全組合せについて、表に無い event は
`forward-transition-illegal`、state変更なし、event/outbox/外部 intent 0件となる。
これが許可表・禁止表を一つにした closed-world の完全表であり、実装側の追加 event や
暗黙の逆行を許可しない。例外 event は必ず `subjectRevision`、`sourceCommit`、reason、
typed `exception-context` を同一 transaction に束縛する。

### 3. typed evidence policy

全 evidence は `subjectId`、`subjectRevision`、`sourceCommit`、`recordDigest` に束縛し、
policy の revision と一致しない record、期限切れ record、許可 producer 以外、exit rule
不一致は eligible に数えない。`cardinality` は active frontier に適用し、superseded
record を二重計上しない。

| policy row | kind | cardinality | expiry | producer | subject revision | exit rule |
| --- | --- | --- | --- | --- | --- | --- |
| `scope` | `scope-approval` | exactly 1 | revision-bound | `po`, `human` | exact | `exact(0)` |
| `pair` | `pair-artifact-declaration` | exactly 1 | revision-bound | `codex`, `claude`, `human` | exact | `exact(0)` |
| `design-review` | `design-pair-review` | exactly 1 | revision-bound | `codex`, `claude` | exact | `exact(0)` |
| `red` | `red-test-run` | exactly 1 | max age 24h + revision-bound | `codex`, `claude`, `ci` | exact | `nonzero` |
| `targeted` | `targeted-test-run` | at least 1 | max age 24h + revision-bound | `codex`, `claude`, `ci` | exact | `exact(0)` |
| `implementation` | `implementation-digest` | exactly 1 | revision-bound | `codex`, `claude` | exact | `exact(0)` |
| `trace` | `trace-materialization` | exactly 1 | revision-bound | `codex`, `claude`, `ci` | exact | `exact(0)` |
| `trace-closure` | `trace-closure` | exactly 1 | max age 24h + revision-bound | `codex`, `claude`, `ci` | exact | `exact(0)` |
| `green` | `green-test-run` | exactly 1 | max age 24h + revision-bound | `ci` | exact | `exact(0)` |
| `review` | `independent-review` | exactly 1 | revision-bound | `codex`, `claude` | exact | `exact(0)` |
| `gate` | `gate-run` | exactly 1 | max age 24h + revision-bound | `ci` | exact | `exact(0)` |
| `acceptance` | `acceptance-decision` | exactly 1 | revision-bound | `po`, `human` | exact | `exact(0)` |
| `retention` | `retention-decision` | exactly 1 | revision-bound | `po`, `human` | exact | `exact(0)` |
| `exception` | `exception-context` | exactly 1 per exception event | revision-bound | `po`, `human`, `codex`, `claude` | exact | `exact(0)` |

`red-test-run` は期待された Red を記録するため `nonzero` を許可するが、Red が無い
implement は `forward-red-evidence-missing` で拒否する。`independent-review` は author
family と異なる producer を要求する。minimum / maximum cardinality、claims rule、
attestation、supersession の検証は `EvidencePolicy` の既存 contract を再利用し、Forward
専用の evidence 型や reservation を追加しない。

### 4. CLI JSON envelope と exit 対応

`workflow status|transition|explain` は次の envelope を共有する。`transition` 以外でも
`event` / `nextState` は null を返し、キーを省略しない。JSON parse、schema、identity、
ledger projection の不一致は success に補完せず exit 3 へ閉じる。

```json
{
  "schemaVersion": "forward-cli/v1",
  "command": "transition",
  "planId": "PLAN-L7-419-forward-fsm-transition-workflow-cli",
  "subjectId": "asset-id",
  "subjectRevision": 1,
  "state": "planned",
  "event": null,
  "nextState": null,
  "verdict": "deny",
  "ruleId": "forward-transition-illegal",
  "evidence": { "required": [], "accepted": [], "rejected": [] },
  "digest": "sha256:0000000000000000000000000000000000000000000000000000000000000000"
}
```

| exit | verdict / failure class | 例 |
| ---: | --- | --- |
| `0` | allow または valid explain/status | 許可 edge、schema-valid state、reduction success |
| `1` | caller が要求した遷移・入力の policy violation | `forward-transition-illegal`、alias ambiguity |
| `2` | evidence / dependency が不足・stale・expired | `forward-red-evidence-missing`、`forward-trace-freeze-missing`、`forward-accept-evidence-missing`、`forward-exception-context-missing` |
| `3` | ledger / transaction / projection / parser unavailable | DB failure、rebuild digest mismatch、unknown envelope version |

exit code と `ruleId` は envelope と stderr の両方で同じ値を返し、散文から verdict を
推測しない。`status` / `explain` の valid read-only 結果は exit 0、拒否理由を説明する
read-only 結果も exit 1 または2（拒否理由の分類に従う）であり、state/event/outboxの
副作用は0件とする。

この追補により、#344 の実装 admission は表を参照して一意に判定できる。L6-72 の
既存契約を変更するものではなく、宣言済みの「tableとして固定」を実体化した correction
である。実装 PR が `src/forward/**` を生成するとき、PLAN-L7-419 はこの表と candidate
IDを `requires` / `generates` / `review_evidence` で exact revision に束縛する。
