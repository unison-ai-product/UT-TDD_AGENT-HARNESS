---
title: "上流スケジュール調整 — L6 reader 契約"
layer: L6
artifact_type: design_doc
issue: 959
status: draft
sub_doc: function-spec
artifact_role: topic_upstream_schedule_reader
pair_artifact: docs/test-design/harness/L7-upstream-schedule-reconciliation-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_plan: docs/plans/PLAN-L3-04-upstream-schedule-reconciliation.md
next_pair_freeze: L7
created: 2026-10-15
updated: 2026-10-15
---

# 上流スケジュール調整 — L6 reader 契約 (Issue #959)

## §1 位置付けと実装状態

本書は `drive-model-passage` と `rule-automation-closure` の reader が、PLAN-L3-04 ではなく L3 topic `docs/design/harness/L3-functional/upstream-schedule-reconciliation.md` を正本として読むための L6 契約候補である。`function-spec.md` は 2,500 行を超える共有契約集のため、本 topic をそこへ追加せず専用 addendum に分ける。frontmatter の `related_plan` は移設元の履歴参照であり、reader 入力ではない。

現行実装 (`src/lint/drive-model-passage.ts`、`src/lint/rule-automation-closure.ts`) の loader は PLAN-L3-04 を読む。本契約 PR はその実装変更・検証ではなく、実装時に守るべき未実装契約を記録する。したがって本書も L3 topic も `status: draft` であり、読取切替済み、PLAN 読取 0、正式 oracle、Green の証跡を主張しない。

## §2 入力選択と読み取り境界

| 関数契約 | pre | post | invariant | 候補oracle |
|---|---|---|---|---|
| `loadDriveModelPassageDocs(repoRoot) => DriveModelPassageDoc[]` | 対象repository rootが指定される | L3正本1文書を返す。欠落時は空結果をdoctorが拒否する | PLANの存在確認・読取・fallbackは0 | CANDIDATE-U-UPSTREAM-SCHEDULE-001..003 |
| `loadRuleAutomationClosureDocs(repoRoot) => RuleAutomationClosureDoc[]` | 対象repository rootが指定される | 同じL3正本1文書を返す。欠落時は空結果をdoctorが拒否する | 他文書・cacheで補完しない | CANDIDATE-U-UPSTREAM-SCHEDULE-001..003 |
| `analyzeDriveModelPassage(docs) => DriveModelPassageResult` | §3.1の節・列を持つ文書集合 | 既存reasonを保持し、欠落・不正をviolationsに残す | 日本語訳と移設元の意味は等価 | CANDIDATE-U-UPSTREAM-SCHEDULE-004 |
| `analyzeRuleAutomationClosure(docs) => RuleAutomationClosureResult` | §3.2の節・列を持つ文書集合 | 既存reason・openRowsの区別を保持する | 不正を省略して成功させない | CANDIDATE-U-UPSTREAM-SCHEDULE-004 |

`loadDriveModelPassageDocs(repoRoot)` と `loadRuleAutomationClosureDocs(repoRoot)` は、それぞれ L3 topic の repo-relative path を唯一の入力先とする。成功時は1文書を返し、その `file` は `docs/design/harness/L3-functional/upstream-schedule-reconciliation.md`、`content` は同ファイルの UTF-8 本文とする。PLAN-L3-04 は存在確認・読取・fallback のいずれにも使わない。L3 topic が無い場合に別文書やキャッシュを代替入力にしてはならない。

L3 §2.1 と §2.3 は日本語見出し・列見出しを持つ。reader は次の対応を使い、意味を保ったままこれらの表を解析する。

| Reader | 対象節 | 必須列見出し | 解釈 |
| --- | --- | --- | --- |
| `drive-model-passage` | `## §2.1 各駆動モデルに通過証明書を必須とする` | `駆動モデル／入口モード`、`必須の通過証明書列` | 各 mode と証明書列を1行として読む。 |
| `rule-automation-closure` | `## §2.3 規則の自動化責務割当てを必須とする` | `規則`、`必須の自動化責務`、`現在の状態` | 各 rule、owner、status を1行として読む。 |

節の抽出範囲は対象見出しから次の `##` 見出し直前までとし、表は Markdown pipe rows として読む。節・表・必須列・行が壊れている場合に空表や他の節から値を補完しない。L3 §2.2 の DB registration table はこの二つの既存 analyzer が解析する入力ではない。本書はその表の存在・意味を L3 契約として維持するが、この二つの analyzer が DB row を検証すると主張しない。

## §3 Analyzer の結果・fail-close 契約

### §3.1 `drive-model-passage`

既存の `analyzeDriveModelPassage` 結果 shape (`checked`, `rows`, `violations`, `ok`) と reason enum を維持する。表が欠落すれば `missing_section` / `missing_table` / `malformed_row` を finding とし、各 mode には空でない mode と certificate columns を要求する。現行 source は英語語句のみを signal としているが、日本語化した L3 表を受ける reader 契約では、Forward target signal を有限の同義語集合 (`forward` / `re-entry` / `route` / `target` / `routing` / `対象` / `経路` / `再入`) で、残余状態 signal を (`residual status` / `status` / `gap` / `parked` / `po decision` / `残余状態`) で認識する。これは翻訳された列値で同じ概念を読むための追加であり、任意の非空文言を通すものではない。

11 個の既定 mode (`Discovery`, `Scrum`, `Reverse`, `Recovery`, `Incident`, `Refactor`, `Retrofit`, `Add-feature`, `Research`, `Design-bottomup`, `Version-up`) の欠落は `missing_expected_mode`、mode／certificate cell 欠損は `malformed_row`、Forward 証拠欠損は `missing_forward_target`、残余状態欠損は `missing_residual_status` とする。未読込 (`checked=0`) は既存 message `passage certificate table not found` で fail-close する。対象ファイル名は各 finding の `file` に残し、mode が特定できる finding には `mode` も残す。結果の `ok` は violations が空の場合に限り true とする。

この analyzer は現在、mode の重複排除、追加 mode の拒否、§2.2 DB 行の検証を行わない。今回の契約移設を理由にその挙動を追加・変更しない。

### §3.2 `rule-automation-closure`

既存の `analyzeRuleAutomationClosure` 結果 shape (`checked`, `rows`, `openRows`, `violations`, `ok`) と reason enum を維持する。表が欠落すれば `missing_section` / `missing_table` / `malformed_row` を finding とする。rule、owner、status のいずれかの空欄は現行分岐順により `malformed_row` となる (`missing_owner` enum の分岐は空欄 guard の後にあるため通常到達しない)。現行 source の owner pattern は英語語句のみだが、移設後は以下の有限な日本語同義語も同じ責務名として認識する。doctor→`doctor`、plan-lint→`plan-lint`、vmodel→`vmodel`、hook→`hook`、db/database→`db` / `database` / `DB`、ci→`ci` / `CI`、projection→`projection` / `投影`、writer→`writer` / `書込み`、analyzer→`analyzer` / `解析器`、checker→`checker` / `チェッカー` / `検査器`、lint→`lint`、handover→`handover` / `引継ぎ`、fr-roadmap-coverage→`fr-roadmap-coverage`。非空 owner がこの有限集合に当たらない場合は `unknown_owner` とする。status は `closed`, `scheduled`, `gap`, `parked`, `PO decision` のみを受理し、それ以外は `unknown_status` とする。

有効な行は `rows` に出し、`closed` 以外は `openRows` に残す。表または row の解析違反は `violations` に記録し、違反がある結果を成功扱いしない。`checked=0` は既存 message `closure table not found` で fail-close する。message は violations の件数と最大8件の path/rule/reason sample を示し、非 closed row は status 別件数と最大5件の sample を示す。

現行 analyzer は valid status の5種類を受理し、未知の status と非 closed row を区別する。表の特定5 rule がすべて存在するか、重複 rule がないかは検証しない。L3 の5行・識別子・状態値を移設時に保つことと、analyzer が必要行集合を検証することは別の契約であり、後者を本 scope で追加しない。

## §4 Doctor 接続と scope fence

`src/doctor/process-quality.ts` は両 analyzer の message を doctor finding として表示する責務を持つ。reader の入力切替後も、読み込み不能・節／表の欠落が doctor 上で見逃されず、上記 analyzer の fail-close 結果が利用者に伝わること。具体的な source wiring とその検証は後続実装 scope であり、本書は実装済みとは扱わない。

本契約は読取元と既存 parser の日本語 L3 表への適合だけを扱う。L3 の11 mode、§2.2 DB table の4行、§2.3 closure table の5行・状態値・意味を変更しない。source、test、共有 `function-spec.md`、PLAN-L3-04、doctor wiring はこの契約 PR の変更対象外である。
