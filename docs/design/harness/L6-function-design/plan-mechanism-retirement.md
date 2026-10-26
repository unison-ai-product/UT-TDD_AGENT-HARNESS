---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_plan_mechanism_retirement
pair_artifact: docs/test-design/harness/L7-plan-mechanism-retirement-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1364
---

> **L6 contract marker**: 本書は `docs/plans` の物理削除 (#1365) の後に残る PLAN 機構の縮退契約である (未実装の目標契約。実装は本書の凍結後に §8 の sub-issue で行う)。新しく足す関数は Issue 参照の解析 `parseIssueUrl(text: string) => IssueRef | null` だけで、DbC pre/post/invariant は §9 にまとめる。oracle (CANDIDATE-U-PLANRET-001〜) は `docs/test-design/harness/L7-plan-mechanism-retirement-test-design.md` が固定する。行番号は 2026-10-26 の `origin/main` (`a838dae93`) で測った。

# PLAN 機構の縮退 — 関数設計 (issue #1364)

## 1. 目的

PLAN 機構は撤去の方針である (#1078、凍結は #1166)。`docs/plans` の物理削除 (#1365) の後に残るコード・データ・外部の入口を、何を残し、何を退役させ、何を Issue / PR へ付け替えるかを、実装の前に凍結する。PO 判断 (2026-10-26、#1170 の control 記録 issuecomment-6410250433) を契約にする。

- 方針は「縮退であって作り直しではない」。PLAN の代わりになる新しい台帳・検査は作らない (最小実装原則)。
- PLAN の代わりの参照先は、GitHub Issue (番号か URL) と PR に限る。

## 2. 前提 (実測)

| 前提 | 根拠 |
| --- | --- |
| `db rebuild` は同じ DB を in-place で作り直し、registry に登録された表を、永続扱いの 4 表を除いてすべて `DELETE` してから投影し直す | `src/state-db/sqlite-projection-rebuild.ts:4-17`、`src/state-db/projection-writer.ts:2624-2650` |
| `migrate` が触るのは registry に登録された表だけである。`CREATE TABLE IF NOT EXISTS` (`schemaDdl()`)、列の追加 (`addMissingColumns`)、主キー互換 index の追加は、どれも `HARNESS_DB_TABLES` を回す。登録の無い表は作らず、変えず、消さない | `src/state-db/migration.ts:69-86`、`:88-103`、`:128-150` |
| `migrate` の中で `DROP TABLE` を出すのは、版つきの再作成 1 か所だけで、対象は名前を書いた 3 表に限られる。registry から外したことで暗黙に `DROP` が起きる経路は無い | `src/state-db/migration.ts:104-120` |
| 状態表示の `missingTables` と `rowCounts` も registry の表だけを見る | `src/state-db/migration.ts:153-168` |
| PLAN の台帳 DB は harness.db とは別のファイル (`.ut-tdd/ledger/harness-ledger.db`) で、開くコードは `src/plan-asset/ledger/` にしか無い。台帳の migration には旧表の `DROP` がある | `src/plan-asset/ledger/schema.ts:1605`、`:966-967` |
| `docs/plans` が無いとき、DB 鮮度の期待値は空の fingerprint と 0 件になる。削除後の rebuild で DB 側も 0 件になれば、`db-currency` は両辺が一致して通る | `src/state-db/drive-registration.ts:34-36`、`:172-175`、`src/lint/db-currency.ts:29-40` |
| PLAN の原本は tag `plans-archive-20261021` (`fa18faa7`) に残る | `git ls-remote --tags origin plans-archive-20261021` |
| `src/plan-asset/` の一部は PLAN 以外から使われている (Forward FSM の evidence 型、project identity の読み込み) | `src/forward/application/forward-evidence-policy.ts:1-3`、`src/forward/domain/reducer.ts:2`、`src/forward/domain/transition-policy.ts:6`、`src/forward/domain/types.ts:1`、`src/setup/project-identity-bootstrap.ts:8` |
| PLAN を除いた隔離計測 (#1167) で非 OK になった check は 15 個で、§4 の fail-open の check と §5 の right-arm static は含まれない | #1170 issuecomment-6409156615 (計測は #1167 issuecomment-6408738672) |

## 3. データの扱い (凍結点 1)

**コードだけを退役させ、データは残す** (PO 判断 2026-10-26)。どの段でも、PLAN 用の表と台帳ファイルに対して `DROP`・`VACUUM`・`DELETE` を出すコードを新しく書かない。手での直接操作もしない。

| 対象 | 扱い |
| --- | --- |
| 台帳 DB `.ut-tdd/ledger/harness-ledger.db` | ファイルは残す。`src/plan-asset/ledger/**` の退役 (§8 の S7) で、開くコードが無くなる。台帳 migration の `DROP` (`schema.ts:966-967`) もコードとともに消え、二度と走らない |
| harness.db の PLAN 用の表: `plan_registry`、`schedule_entries`、`activation_entries`、`activation_schedule_reviews`、`execution_readiness_projection`、`roadmap_rollups`、`roadmap_band_coverage`、`roadmap_gate_progress` | 表は残す。削除 (#1365) から S7 までは registry に登録したままにする。この間の `db rebuild` は既存の動きどおり行を消して 0 件を投影する (下の「行の扱い」)。S7 で registry から外す |
| Project V2 用の永続表: `github_object_bindings`、`github_project_item_projection`、`github_projection_outbox` | 行も表も残す (rebuild の対象外、`sqlite-projection-rebuild.ts:4-9`)。S5 で書き手が無くなり、S7 で registry から外す |
| 残る表の `plan_id` 系の列 (`drive_runs`、`model_runs`、`feedback_events` など) | 列は残し、新しい行には値を書かない (NULL)。列の削除 (`ALTER TABLE ... DROP COLUMN`) はしない |

**行の扱い (advisor の反証を経て採った案)**: harness.db の PLAN 用の表は `docs/plans` からの投影であり、原本は tag `plans-archive-20261021` に残る。削除後の rebuild で行が 0 件になるのは既存の投影の動きであり、新しい削除操作を足すものではない。行を凍結して残す案は、原本の無い投影を鮮度の保証なしに残すことになり、`db-currency` の比較も外す必要がある (§2 の 6 行目) ので採らない。行が要るときは、tag を checkout して rebuild すれば再生成できる。

**registry から外したときの既存 DB の表** (S7): 次の 4 点を不変条件とする。
- 読まない: registry から外した表を参照する SQL を src に残さない (§9 の不変条件、静的に検査する)。
- 書かない: 投影の書き手 (`projectPlans` ほか) を同じ PR で消す。
- migration で触らない: `migration.ts:104-120` の名前つき再作成の一覧に PLAN 用の表を足さない。`SCHEMA_VERSION` を上げてもよいが、上がるのは `user_version` だけで、登録の無い表は `CREATE`・`ALTER`・`DROP` のどれも受けない (`:72`、`:91`、`:135`)。
- 数えない: `missingTables` / `rowCounts` に出なくなるのは仕様である (`:153-168`)。
- 新規の DB には PLAN 用の表を作らない。既存の DB には物理的に残る。

**PLAN を参照する残りの表の定義**: `vmodel_item_target_edges` は `plan_registry` への外部キー (`src/schema/harness-db-tables-vmodel.ts:115`) と「defer なら `plan_id` 必須」の CHECK (`:129`) を持ち、`github_review_lane_receipts` は `plan_id` を必須にしている (`src/schema/harness-db-tables-github.ts:9`、`:22`)。どちらも PLAN 用の表ではなく、rebuild で作り直せる投影である。既存の DB では `CREATE TABLE IF NOT EXISTS` が古い定義を変えないので、registry 側の定義を変えるだけでは CHECK と NOT NULL が残る。そこで、この 2 表は `migration.ts:104-120` と同じ版つきの再作成 (`SCHEMA_VERSION` を上げ、旧版の DB でだけ作り直す) で、`plan_id` を持たない定義へ移す。行は同じ rebuild で投影し直す。この再作成は PLAN 用の表には使わない。

**既存の自動 VACUUM**: `src/state-db/db-maintenance.ts:83` は rebuild の後に空きページの割合で DB 全体へ `VACUUM` を掛ける既存の保守であり、PLAN 用の表を狙う操作ではない。本書はこれを足しも外しもしない。

## 4. fail-open で残る check の扱い (凍結点 2)

`docs/plans` が無いと空の入力で OK になる check を、退役か PLAN 非依存化かに分ける。基準は「PLAN を外した後に検査する対象が残るか」である。

| check | 現状 (PLAN を読む箇所) | 決定 | 理由 |
| --- | --- | --- | --- |
| `merged-plan-status` | `src/lint/merged-plan-status.ts:149-157` | 退役 | PLAN の `generates` と status の不整合だけを見る。対象が PLAN そのもの |
| `plan-body-substance` | `src/lint/plan-body-substance.ts:68-70` | 退役 | PLAN 本文の有無だけを見る |
| `plan-completion-drift` | `src/lint/plan-completion-drift.ts:96-98` | 退役 | PLAN の完了条件と status だけを見る |
| `review-evidence` (PLAN の `review_evidence` を読む検査) | `src/lint/review-evidence.ts:345` (`loadReviewPlans`) | 退役 | review の証跡は PR ごとの custody receipt と merge gate (`src/feedback/review-merge-gate.ts`) が持つ。`loadReviewPlans` の利用者 (`graph/loader`、`state-db/drive-registration`、`state-db/projection-writer`、`doctor/plan-governance`、`cli.ts`、`lint/bun-final-retirement`) を外した S7 で関数ごと消す |
| `green-command-digest` と CI の `--strict-green-command-digest` | `src/lint/green-command-digest.ts:20`、`:421`、`.github/workflows/harness-check.yml:218` | 退役 (flag ごと) | PLAN の `review_evidence[].green_command` だけを照合する。flag の参照先 `src/cli.ts:762`、`:781`、`:843`、`:867`、`src/doctor/check-definition-groups.ts:304`、`src/doctor/runner.ts:15`、`src/doctor/result-file.ts:14`、`src/lint/advisory-strict-gate-aging.ts:74`、`src/lint/github-ci-policy.ts:515` を同じ PR で外す。doctor の結果 envelope の option に flag が入る (`cli.ts:867`) ので、workflow と vitest fence の照合を同じ PR で揃える |
| `outstanding` | `src/lint/outstanding.ts:83-86` (軸 a: 非終端 PLAN の件数) | PLAN 非依存化 | 軸 b (開いている placeholder defer、`:108-113`) は PLAN と無関係に残る。軸 a と `versionUpParked` を外す。`status --json` から PLAN の件数の field が消えるのは互換の変更として PR 本文に書く |
| `sub-doc-section-structure` | `src/lint/sub-doc-section-structure.ts:106-130` (PLAN の `sub_doc` を見る) | PLAN 非依存化 | 標準成果物の必須節 (要件 §1.10.G.6.1) は製品の設計文書に要る。走査対象を設計文書の root (`resolveVModelRoots` の design root) の frontmatter `sub_doc` に替える。harness 自身の対象は 0 件のまま |
| `ddd-tdd-rules` の `red-first-evidence` | `src/lint/ddd-tdd-rules.ts:146-156`、`:325-350` | この規則だけ退役 | PLAN frontmatter の `red_at` / `green_at` を見る規則。Red → Green → Refactor の順は PR の commit の順 (`docs/design/harness/L6-function-design/merge-gate-refactor-stage.md`) が持つ。他の規則は残す |
| `descent-obligation` の defer 台帳 | `src/lint/descent-obligation.ts:270-276` | PLAN 非依存化 | 走査 root から `docs/plans` だけを外す。`docs/design` と `docs/test-design` の defer は残る |
| `l6-completion` の PLAN の腕 | `src/lint/l6-completion.ts:92-95` (`plan:`)、`:205-214` (PLAN の draft / review)、`:276`、`:291-296` | PLAN 非依存化 | 所有者は frontmatter の `issue:` (正の整数、`:97-103`) だけにする。L6 文書の `plan:` は 0 件 (#1360 で移行済み)。`hasReviewEvidence` の import を外す |
| `drive-db-registration` の `planCount === 0` 分岐 | `src/lint/drive-db-registration.ts:73-77`、`:80-95` | PLAN 非依存化 | PLAN 由来の違反 (`empty_plan_registry`、`stale_plan_registry*`、`plans_without_drive_run`) と、`planCount === 0` のときだけ全検査を飛ばす分岐を外す。orphan 系 (`workflow_orphans`、`model_orphans`、`skill_*_orphans`) は PLAN と無関係に常に検査する。存在要求 (`missing_drive_runs` など) は PLAN の有無で発動を決めていたので、発動条件を「対応する表に 1 行以上ある repo」に替えず、要求ごと外す (空の repo を赤にしないため) |
| `db-currency` | `src/lint/db-currency.ts:29-40` | PLAN 非依存化 | PLAN の件数と fingerprint の比較を外し、`missing_db` だけを残す。PLAN を使わない鮮度の指標は本書では定めない (§10) |

## 5. PLAN を要求する契約の付け替え (凍結点 3)

### 5.1 参照の書き方

- **機械が読む manifest の参照** (defer、`routed_to`、文書処分の defer、V-model 契約の検証先) は、Issue の URL `https://github.com/<owner>/<repo>/issues/<n>` に統一する。既存の `routed_to` が受けている形 (`src/gate/right-arm-static.ts:1230`) と同じである。consumer の repo から harness の repo へ回す参照もあるので、番号だけの形は使わない。
- **文書の frontmatter** は `issue: <n>` (正の整数、同じ repo の Issue) とする。L6 文書の現行の形 (`src/lint/l6-completion.ts:97-103`) と同じである。
- **CLI の引数**は `--issue <n>` (正の整数) とする。
- 存在の確認はしない (形式だけを見る)。今の `docs/plans/<id>.md` の存在検査を GitHub API の照会に置き換えると、offline の gate が外部 API に依存するためである。

```ts
interface IssueRef {
  readonly owner: string;
  readonly repo: string;
  readonly number: number; // 1 以上
}
// 置き場所: src/shared/issue-ref.ts
parseIssueUrl(text: string) => IssueRef | null
```

受理は `^https://github\.com/([A-Za-z0-9-]+)/([A-Za-z0-9._-]+)/issues/([1-9][0-9]*)$` に一致するときだけ。前後の空白、末尾の `/`・`#...`・`?...`、`/pull/`、`PLAN-*` の文字列は `null` を返す。

### 5.2 付け替えの一覧

| 契約 | 現状 | 付け替え後 |
| --- | --- | --- |
| right-arm static の defer | `defer.plan_id` が `PLAN-*` で `docs/plans/<id>.md` が実在すること (`right-arm-static.ts:1297-1308`) | `defer.issue` が `parseIssueUrl` で解析できること。`plan_id` だけの defer は `stale defer` |
| right-arm static の `routed_to` | PLAN ID か Issue URL。PLAN ID は実在を確かめる (`:1230-1241`) | Issue URL だけ。PLAN ID は「Issue URL でない」違反 |
| right-arm static の L0 charter の引用 (G14 の VALUE case) | `docs/plans/PLAN-L0-*.md` の `plan_id` を引用すること (`:689-700`、`:702-729`、`:1447-1450`) | design root の `L0-planning/*.md` のうち frontmatter `layer: L0` を持つ文書の `doc_type_id` (harness では `DOC-L0-CHARTER`、Pack の雛形 `docs/templates/vmodel/L0-charter.md` も同じ値) を引用すること。違反の文言は「L0 charter の `doc_type_id` を引用する」に替える。`PLAN-L0-*` を引用している既存の test design の行は同じ PR で書き換える |
| 文書処分の defer | `applicability.plan_id` 必須 (`src/document-disposition/domain/document-disposition.ts:91`)、`targets` か `plan_ids` のどちらか必須 (`:122-127`)、catalog の defer は `planId` 必須 (`src/disposition/domain/document-disposition-catalog.ts:483`)、PLAN の別名表 (`src/disposition/adapters/tracked-target-registry.ts:14-20`) | defer は `applicability.issue` (Issue URL) 必須、`targets_or_issues` とする。別名表は退役。既に記録した処分は書き換えない。その digest の再計算 (`src/document-disposition/domain/replay-document-deltas.ts:75`) は、保存されている `plan_ids` をそのまま入力にして同じ値を再現する (読むだけで、新しい記録には書かせない) |
| V-model 契約の検証先 | `verification_plan_id` が `PLAN-<layer>-` で始まること (`src/vmodel-contract/application/contract-compiler.ts:110-112`、`docs/process/vmodel-contract.yaml`) | `verification_issue` (Issue URL) |
| CLI の `--plan` 必須 | `github binding observe` (`src/cli.ts:3899`)、`github pr render` (`:4067`、`--plan-revision` は `:4071`)、`elicit record` (`:4580`)、`workflow status|transition|explain` (`src/forward/adapters/cli-registrar.ts:25`、`:33`、`:48`) | `github binding` は §7 で退役。`github pr render` は `--plan` と `--plan-revision` を外す。`elicit record` と `workflow *` は `--issue <n>` に替える (Forward FSM の subject は Issue 番号になる。FSM の state は PLAN の status と元から独立している)。任意の `--plan` (`src/cli.ts:1638`、`:1690`、`:2044`、`:2826`、`:2981`、`:3106`、`:3196`、`:3340`、`:4563`、`src/cli/delegation.ts:313`、`src/cli/feedback.ts:70`) と current-plan / branch からの PLAN 解決は、代わりを置かずに外す |
| PR の typed trace | `plan_id` 必須、`plan_revision` 任意 (`src/github/pr-trace.ts:10-35`、`:73-78`)、PR template (`.github/PULL_REQUEST_TEMPLATE.md:2`) | marker を `ut-tdd:trace/v2` に上げ、`plan_id` と `plan_revision` を外す。必須は `route_mode`、`subject_head`、`base_sha`、`issue_number`。v2 の検証は `plan_id` を未知の key として扱う。v1 の過去の PR 本文は検証し直さない |
| review custody | receipt の `planId` / `planRevision` (`src/feedback/review-custody.ts:60-61`、`:115-116`、`:283-284`、`:378-379`、`:589-590`、`:642-643`)、runner の env (`src/feedback/review-custody-runner.ts:145-146`、`:264-265`)、workflow の入力 (`.github/workflows/review-attestation.yml:22-29`、`:99-100`、`:118-119`) | schema を `review-custody/v2` に上げ、`planId` / `planRevision` を外す。receipt の対象は既存の `repository`・`prNumber`・`headSha` (PR を指す形) で足りる。workflow の入力 `plan_id` / `plan_revision` と env を外す。v1 の receipt は merge 済みの過去の PR のもので、新しい merge の判定には使わない |

## 6. Pack (凍結点 4)

Pack の PLAN 運用は Issue 参照に置き換える (PO 判断)。**互換性が変わる版**として出し、release note に移行手順 (下の 1 行目) を書く。#961 (自己導入) の前に終える。

| 対象 | 変更 |
| --- | --- |
| 雛形の `plan:` frontmatter (50 本: `docs/templates/design/` 1、`docs/templates/vmodel/` 22、`docs/templates/vmodel/optional/` 27) | `plan: docs/plans/PLAN-<id>.md` を `issue: <Issue 番号>` に替える。consumer の既存文書の `plan:` は §4 の `l6-completion` の変更後に所有者として数えられなくなるので、release note に「`plan:` を `issue:` に替える」と書く |
| PLAN の雛形 `docs/templates/plan/design/template.md`、`docs/templates/plan/impl/template.md` | 退役。`src/setup/authoring-template-inventory.ts:13-17` の登録を外す |
| `docs/templates/state/vmodel.json` の `plan_id` | 外す |
| canary の PLAN 起票 (`scripts/pack-canary-acceptance.mjs:803-811`、`:972-976`、`:1108-1144`) | `plan draft` / `plan lint` と PLAN の雛形・受付記録の生成を外す。代わりに、`issue:` を持つ設計文書の雛形を consumer へ置き、その frontmatter を確かめる手順にする |
| consumer gate の defer | §5.2 の right-arm static の defer (`defer.issue`) と同じ。consumer 用の別仕様は作らない |

## 7. 外部 API (凍結点 5)

| 対象 | 決定 |
| --- | --- |
| `github project sync` (`src/cli.ts:3753-3764` ほか、`src/github/project-v2.ts`) | コマンドごと退役。GitHub の Project 側の item・field は消さない (削除の API を呼ぶコードを書かない)。手元の永続表は §3 のとおり残す |
| `github binding sync` / `observe` (`src/cli.ts:3865-3899`、`src/github/repository-bindings.ts`) | 退役。PLAN を GitHub の object に結び付けて Project へ投影するための入口で、利用者は CLI だけである。`project-v2.ts` の `GhCommandPort` を使うのもこのファイルだけなので、同じ PR で外せる |
| `review-attestation.yml` の入力 | §5.2 の review custody のとおり、PR (`pr` 入力、既存) を指す形にする |

## 8. 縮退の順序と sub-issue (凍結点 6)

**削除 (#1365) の前**: #1365 の前提 (#1354〜#1359、PLAN 台帳専用の check の退役 2/2、#1363) から増やさない。§3 で行を凍結しない案を採ったので、データのための前段は要らない。

**削除の後**: 次の 8 本に分ける。`src/cli.ts` を変える段 (S1、S5、S4、S7) は、この順に直列にする。他の段は、変えるファイルが重ならないので並列でよい。

| 段 | 内容 | 主なファイル | 順序 |
| --- | --- | --- | --- |
| S1 | PLAN 専用 lint の退役 3/3 (§4 の「退役」の行の doctor check、`--strict-green-command-digest`) | `src/lint/{merged-plan-status,plan-body-substance,plan-completion-drift,green-command-digest}.ts`、doctor の登録、`harness-check.yml`、`src/cli.ts` (doctor の option) | 直列 1 |
| S2 | fail-open の check の PLAN 非依存化 (§4 の「PLAN 非依存化」と `red-first-evidence`) | `src/lint/{outstanding,sub-doc-section-structure,ddd-tdd-rules,descent-obligation,l6-completion,drive-db-registration,db-currency}.ts`、`src/state-db/drive-registration.ts` | 並列。`src/cli.ts` の変更が要るなら S1 の後に直列へ入れる |
| S3 | manifest の参照の付け替え (§5.1、§5.2 の right-arm static・文書処分・V-model 契約) と `parseIssueUrl` | `src/shared/issue-ref.ts`、`src/gate/right-arm-static.ts`、`src/document-disposition/**`、`src/disposition/**`、`src/vmodel-contract/**`、`docs/process/vmodel-contract.yaml`、`PLAN-L0-*` を引用する test design | 並列 |
| S4 | CLI の `--plan` の解除、PR の typed trace v2、review custody v2 と `review-attestation.yml`、`github_review_lane_receipts` の再作成 (§3) | `src/cli.ts`、`src/forward/adapters/cli-registrar.ts`、`src/cli/{delegation,feedback}.ts`、`src/github/pr-trace.ts`、`src/feedback/review-custody*.ts`、`.github/workflows/review-attestation.yml`、`.github/PULL_REQUEST_TEMPLATE.md` | 直列 3 |
| S5 | Project V2 同期と binding の退役 (§7) | `src/github/{project-v2,repository-bindings}.ts`、`src/cli.ts` | 直列 2 |
| S6 | Pack の雛形と canary (§6) | `docs/templates/**`、`src/setup/authoring-template-inventory.ts`、`scripts/pack-canary-acceptance.mjs` | S3 と S2 の `l6-completion` の後。#961 の前 |
| S7 | PLAN の CLI・台帳・投影コードの退役と registry からの除外 (§3)。`src/plan/`、`src/plan-admission/`、`src/plan-asset/` を消す。PLAN 以外が使う部分 (§2 の 8 行目) は消さずに `src/forward/` と `src/setup/` の側へ移す。`vmodel_item_target_edges` の再作成、`model_evaluations` の成功判定 (`plan_registry.status` との結合、`src/schema/harness-db-tables-evaluation.ts:31`) の退役 (列は残して NULL)、`src/doctor/test-repository-isolation.ts:45` の登録行の削除 | 上記 3 dir、`src/state-db/**`、`src/schema/harness-db*.ts`、`src/cli.ts` | 直列 4 (S1〜S5 の後) |
| S8 | 規範文書と rule-drift の marker の掃除 (`CLAUDE.md`、`AGENTS.md`、`.claude/CLAUDE.md`、`skills/`、`docs/governance/`) | 規範文書 | S7 の後 |

各段は設計書保護 gate の三段階 (契約 → 登録 + Red → src を含まない昇格 → 実装) に従う。本書が (0) の契約にあたる。退役だけで新しい振る舞いを持たない段 (S1、S5、S8) は Red を持たず、削除と、消えたことを確かめるテストの差分だけにする。

## 9. 不変条件 (DbC)

| 種類 | 内容 |
| --- | --- |
| Pre | `parseIssueUrl` の入力は任意の文字列。他の段は `docs/plans` が無い repo で動く |
| Post | `parseIssueUrl` は §5.1 の正規表現に一致するときだけ `IssueRef` を返し、`number` は 1 以上。同じ入力に同じ出力を返す (純粋)。ネットワークに触れない |
| Invariant (データ) | src に、PLAN 用の表と台帳ファイルへの `DROP`・`VACUUM`・`DELETE` を新しく書かない。`migration.ts` の名前つき再作成の一覧に PLAN 用の表を足さない。S7 の後、src に PLAN 用の表の名前を含む SQL が無い |
| Invariant (参照) | S3〜S6 の後、src・scripts・`.github`・`docs/templates` に、`docs/plans` の実在を確かめるコードと、`PLAN-` で始まる値を必須にする検証が無い。新しい参照は Issue か PR だけを指す |
| Invariant (外部) | GitHub の Project の item・field を消す API を呼ぶコードを書かない |

## 10. 範囲外

- `docs/plans` の物理削除そのもの (#1365)。
- PLAN を使わない DB 鮮度の指標 (`db-currency` の代わり)、モデルの成功率の新しい定義。必要になったら別の Issue で契約する。
- 過去の記録 (PR 本文の trace v1、custody v1 の receipt、`docs/governance/` の履歴的な PLAN の言及、`plan-admission-receipts.json`) の書き換え。
- GitHub の Project 側のデータの整理。

## 11. 根拠

- issue #1364 (親 #1170、方針 #1078、凍結 #1166)。PO 判断と棚卸しは #1170 issuecomment-6410250433、sub-issue の切り方は issuecomment-6409156615。
- 設計判断の相談: `ut-tdd advisor --decision design` (claude-fable-5-1、2026-10-26)。§3 の「行を凍結しない」案は、この相談の推奨を実測で確かめて採った。advisor は「`plan_registry` への外部キーは src に 0 件」と答えたが、実際は `src/schema/harness-db-tables-vmodel.ts:115` に 1 件ある。rebuild は外部キーの逆順で消す (`sqlite-projection-rebuild.ts:13`) ので結論は変わらないが、§3 で `vmodel_item_target_edges` の再作成を定めた。
- 型の手本: `docs/design/harness/L6-function-design/oracle-test-citation-trace.md` §6 (退役契約)、`docs/design/harness/L6-function-design/code-size-gate.md` (pair の構成)。
