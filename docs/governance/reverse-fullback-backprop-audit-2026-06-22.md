# Reverse fullback backprop 監査 (2026-06-22)

> **姉妹機構注記 (PLAN-L7-459 M5)**: 本監査の `backprop_scope` (fullback Reverse PLAN 用の
> layer 別 backprop 判断 record) と、`conditional-backfill-decision-audit-2026-06-22.md` の
> `backprop_decision: not_required` + `backprop_decision_reason` (refactor/retrofit/troubleshoot
> 等 conditional-kind PLAN 用) は**意図的に別フィールドの姉妹機構**である。対象 PLAN 母集団が
> 異なり、fullback PLAN に `backprop_decision: not_required` を書いても免除にはならない。

この監査は、`kind=reverse` + `workflow_phase=R4` +
`confirmed_reverse_type=fullback` の confirmed/completed PLAN のうち、frontmatter の
`generates` が `docs/design/`、`docs/governance/`、`docs/test-design/` artifact を
生成対象として示していないものを記録する。

2026-06-23 の追加 sweep では、二つ目の legacy pattern も確認した。一部の fullback PLAN は
governance/design/test-design artifact を生成しているが、明示的な `backprop_scope` decision を
宣言していない。この状態では、repository は「何かを変更した」ことまでは示せるが、requirements、
L4 basic design、L5 detailed design が更新済みか、影響なしなのか、defer されたのかを証明できない。

2026-06-22 以降、新規または更新される fullback PLAN は `plan-governance` reason
`reverse_fullback_backprop_missing` で guard される。下記の legacy entry は、各 entry が次のいずれかに
なるまで visible debt として残す。

- 実際の backprop target artifact を `generates` に追加して補正する。
- design/governance/test-design change が不要だった場合は `fullback` 以外へ再分類する。
- 欠落した backprop を実施する新しい Reverse PLAN で置き換える。

## Legacy debt 一覧

### 生成 backprop artifact 欠落

| PLAN | 状態 | route | 観測した問題 |
|---|---|---|---|
| PLAN-REVERSE-02-session-log | confirmed | L3 | body は L1/L3 back-fill を主張するが、`generates` が空。 |
| PLAN-REVERSE-03-forced-stop-feedback | confirmed | L3 | `generates` が空で、backprop target を機械 trace できない。 |
| PLAN-REVERSE-04-setup-solo-team | confirmed | L4 | `generates` が空で、backprop target を機械 trace できない。 |
| PLAN-REVERSE-05-handover-mechanism | confirmed | L1 | `generates` が空。L6 design reference は一つあるが、frontmatter が trace していない。 |
| PLAN-REVERSE-06-workflow-improvements | confirmed | L1 | `generates` が空で、backprop target を機械 trace できない。 |
| PLAN-REVERSE-07-backfill-pairing | confirmed | L1 | `generates` が空で、backprop target を機械 trace できない。 |
| PLAN-REVERSE-09-governance-enforcement | confirmed | L3 | `generates` が空で、backprop target を機械 trace できない。 |
| PLAN-REVERSE-10-vmodel-pair-lint | confirmed | L3 | `generates` が空で、backprop target を機械 trace できない。 |
| PLAN-REVERSE-11-verification-trigger | confirmed | L3 | `generates` が空で、backprop target を機械 trace できない。 |
| PLAN-REVERSE-22-l6-completion-readiness | confirmed | L5 | Reverse PLAN のみを生成。metadata-only または normalization の可能性があり、fullback と証明できない。 |
| PLAN-REVERSE-23-coding-rules-workflow | confirmed | L5 | Reverse PLAN のみを生成し、backprop target を機械 trace できない。 |
| PLAN-REVERSE-24-structured-error-handling | confirmed | L5 | Reverse PLAN のみを生成し、backprop target を機械 trace できない。 |
| PLAN-REVERSE-25-module-boundary-rule | confirmed | L5 | Reverse PLAN のみを生成し、backprop target を機械 trace できない。 |
| PLAN-REVERSE-26-domain-boundary-lint | confirmed | L5 | Reverse PLAN のみを生成し、backprop target を機械 trace できない。 |
| PLAN-REVERSE-27-invariant-test-trace | confirmed | L5 | Reverse PLAN のみを生成し、backprop target を機械 trace できない。 |
| PLAN-REVERSE-28-red-first-tdd-evidence | confirmed | L5 | Reverse PLAN のみを生成し、backprop target を機械 trace できない。 |
| PLAN-REVERSE-29-test-oracle-strength | confirmed | L5 | Reverse PLAN のみを生成し、backprop target を機械 trace できない。 |
| PLAN-REVERSE-30-integration-gwt-lint | confirmed | L5 | Reverse PLAN のみを生成し、backprop target を機械 trace できない。 |
| PLAN-REVERSE-32-cross-artifact-relation-graph | confirmed | L5 | Reverse PLAN のみを生成し、backprop target を機械 trace できない。 |
| PLAN-REVERSE-33-mcp-profile-config-safety | confirmed | L5 | Reverse PLAN のみを生成し、backprop target を機械 trace できない。 |
| PLAN-REVERSE-34-tool-adapter-probes | confirmed | L5 | Reverse PLAN のみを生成し、backprop target を機械 trace できない。 |
| PLAN-REVERSE-35-canonical-document-export | confirmed | L5 | Reverse PLAN のみを生成し、backprop target を機械 trace できない。 |
| PLAN-REVERSE-45-descent-obligation | completed | L5 | Reverse PLAN のみを生成し、backprop target を機械 trace できない。 |

### 生成 artifact はあるが `backprop_scope` が欠落

これらの entry は、`generates` に少なくとも一つの upstream artifact が既に含まれていたため、初回監査では捕捉されなかった。
ただし `PLAN-REVERSE-107` で導入された、より強い `backprop_scope` record は欠落している。

| PLAN | 状態 | route | 生成済み upstream artifact | 観測した問題 |
|---|---|---|---|---|
| PLAN-REVERSE-20-runtime-adapter-session-lifecycle | confirmed | L4 | requirements、L4 basic design | `backprop_scope` がない。body は L7 unit test-design back-fill も主張するが、`generates` に `docs/test-design/harness/L7-unit-test-design.md` がない。 |
| PLAN-REVERSE-21-fr-unit-coverage | confirmed | L5 | L6 function design、L7 unit test design | `backprop_scope` がない。requirements/L4/L5 impact decision が暗黙になっている。 |
| PLAN-REVERSE-31-codex-l7-overstep | confirmed | L5 | requirements、backlog、recovery process | `backprop_scope` がない。process/backlog backprop は見えるが、requirements/L4/L5 impact decision は暗黙になっている。 |

### Non-fullback R4 Reverse の artifact 主張欠落

2026-06-23 の follow-up sweep では、`confirmed_reverse_type=fullback` の外側にも関連する別 pattern を確認した。
R4 Reverse PLAN の body が `docs/design/`、`docs/governance/`、`docs/test-design/` の artifact path を
引用しているにもかかわらず、`generates` に存在しないものがある。これらは reverse back-fill といった文言を使う場合や、
design/governance normalization を Forward layer へ戻す場合でも、fullback-only gate の対象外だった。

2026-06-23 以降、新規または更新される non-fullback R4 Reverse PLAN は `plan-governance` reason
`reverse_r4_claimed_artifact_missing` で guard される。

| PLAN | reverse_type | route | 欠落している claimed artifact |
|---|---|---|---|
| PLAN-REVERSE-12-review-evidence | design | gap-only | `docs/governance/ut-tdd-agent-harness-concept_v3.1.md` が未記録。 |
| PLAN-REVERSE-36-verification-cycle-gate-naming | normalization | L3 | `docs/design/harness/L3-functional/roadmap.md` が未記録。 |
| PLAN-REVERSE-40-orphan-governance | design | L5 | `docs/design/harness/L1-requirements/functional-requirements.md` が未記録。 |
| PLAN-REVERSE-41-substance-lints | design | L5 | `docs/design/harness/L1-requirements/functional-requirements.md`、`docs/governance/repository-structure.md`、`docs/test-design/harness/L7-unit-test-design.md` が未記録。 |
| PLAN-REVERSE-42-regression-dependency-drift | code | L5 | `docs/design/harness/L3-functional/roadmap.md`、`docs/design/harness/L6-function-design/function-spec.md`、`docs/governance/gate-design.md` が未記録。 |
| PLAN-REVERSE-44-roadmap-definition-design | design | L4 | `docs/design/harness/L4-basic-design/`、`docs/design/harness/L6-function-design/`、`docs/governance/ut-tdd-agent-harness-concept_v3.1.md`、`docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` が未記録。 |
| PLAN-REVERSE-46-deliverable-catalog-extension | normalization | L4 | `docs/governance/document-system-map.md`、`docs/governance/ut-tdd-agent-harness-concept_v3.1.md`、`docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` が未記録。 |

### 現在の sweep summary

2026-06-23 時点で、confirmed/completed の R4 fullback PLAN は次のように分類される。

| category | 件数 | 意味 |
|---|---:|---|
| Generated upstream artifact + `backprop_scope` present | 9 | 現行 rule に適合する形。 |
| Generated upstream artifact present, `backprop_scope` missing | 3 | legacy trace が部分的で、scope decision の backfill または PLAN 再分類が必要。 |
| No generated upstream artifact and no `backprop_scope` | 23 | 初回監査表から残る legacy debt。 |

non-fullback R4 Reverse sweep でも、未生成の literal upstream artifact claim を持つ confirmed/completed PLAN が 7 件見つかった。
これらは新しい `reverse_r4_claimed_artifact_missing` guard 配下の legacy debt として扱う。

## 現在の remediation

`PLAN-REVERSE-101-db-projection-backprop-gate` は enforcement date に作成された PLAN であり、legacy debt ではない。
同じ slice で、新しい fullback backprop gate を定義する requirements document を生成して補正済みである。
`PLAN-REVERSE-107-reverse-fullback-scope-gate` は、新規または更新される fullback PLAN 向けに、より強い scope rule を追加する。
上記の legacy scope-missing entry は、更新または再分類されるまで debt として残す。
