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
| PLAN の原本は tag `plans-archive-20261102` (`eac0a945`) に残る | `git ls-remote --tags origin plans-archive-20261102` |
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

**行の扱い (advisor の反証を経て採った案)**: harness.db の PLAN 用の表は `docs/plans` からの投影であり、原本は tag `plans-archive-20261102` (`eac0a945`) に残る。削除後の rebuild で行が 0 件になるのは既存の投影の動きであり、新しい削除操作を足すものではない。行を凍結して残す案は、原本の無い投影を鮮度の保証なしに残すことになり、`db-currency` の比較も外す必要がある (§2 の 6 行目) ので採らない。行が要るときは、tag を checkout して rebuild すれば再生成できる。

**registry から外したときの既存 DB の表** (S7): 次の 4 点を不変条件とする。
- 読まない: registry から外した表を参照する SQL を src に残さない (§9 の不変条件、静的に検査する)。
- 書かない: 投影の書き手 (`projectPlans` ほか) を同じ PR で消す。
- migration で触らない: `migration.ts:104-120` の名前つき再作成の一覧に PLAN 用の表を足さない。`SCHEMA_VERSION` を上げてもよいが、上がるのは `user_version` だけで、登録の無い表は `CREATE`・`ALTER`・`DROP` のどれも受けない (`:72`、`:91`、`:135`)。
- 数えない: `missingTables` / `rowCounts` に出なくなるのは仕様である (`:153-168`)。
- 新規の DB には PLAN 用の表を作らない。既存の DB には物理的に残る。

**PLAN を参照する残りの表の定義**: `vmodel_item_target_edges` は `plan_registry` への外部キー (`src/schema/harness-db-tables-vmodel.ts:115`) と「defer なら `plan_id` 必須」の CHECK (`:129`) を持ち、`github_review_lane_receipts` は `plan_id` を必須にしている (`src/schema/harness-db-tables-github.ts:9`、`:22`)。どちらも PLAN 用の表ではなく、rebuild で作り直せる投影である。既存の DB では `CREATE TABLE IF NOT EXISTS` が古い定義を変えないので、registry 側の定義を変えるだけでは CHECK と NOT NULL が残る。そこで、この 2 表は `migration.ts:104-120` と同じ版つきの再作成 (`SCHEMA_VERSION` を上げ、旧版の DB でだけ作り直す) で、`plan_id` を持たない定義へ移す。行は同じ rebuild で投影し直す。この再作成は PLAN 用の表には使わない。

再作成は、その表へ PLAN の無い行を書き始める段と**同じ PR** で行う。分けると、間の段の rebuild が旧い制約で落ちる。

| 表 | 段 | 新しい定義 | 理由 |
| --- | --- | --- | --- |
| `vmodel_item_target_edges` | S3 | `plan_id` 列と `plan_registry` への外部キーを外し、`issue` 列 (Issue URL) を足す。CHECK は「defer なら `issue` が NULL でない」にする | S3 で catalog の defer を Issue 化すると、投影 (`src/state-db/vmodel-projections.ts:86-87` が catalog の行をそのまま upsert する) が旧い CHECK (`harness-db-tables-vmodel.ts:129`) に当たる。足した列も旧い表には無い |
| `github_review_lane_receipts` | S4 | `plan_id`・`plan_revision` を外し、UNIQUE は `lane`・`subject_head` の組にする | S4 の custody v2 の receipt には `plan_id` が無く、旧い NOT NULL (`harness-db-tables-github.ts:9`) に当たる |

2 回の再作成はそれぞれ `SCHEMA_VERSION` を 1 つ上げ、`src/schema/harness-db.ts` と `src/state-db/migration.ts` を変えるので、S3 → S4 の順に直列にする。現在の item target 台帳 (`docs/governance/vmodel-item-target-ledger.md`) に defer の行は無く、`plan_id` はすべて未設定 (`—`) なので、既存の catalog の書き換えは要らない。

**再作成の transaction 境界** (S3・S4 に共通。advisor `gpt-6.1-sol` の反証を実測で確かめて採った): `rebuildHarnessDb` は `migrate()` を投影の transaction **より前**に呼び (`src/state-db/projection-writer.ts:2436` の `rebuildHarnessDb` 内、`time("migrate", () => migrate(db))` の後で `runSqliteTransaction` を開く)、`migrate()` は自前の transaction で commit する (`src/state-db/migration.ts:128-150`)。この順序のまま版つきの `DROP` + `CREATE` を足すと、後続の投影が失敗したときに旧表も旧行も戻らない。そこで次を契約にする。

- 対象表 (`vmodel_item_target_edges`、`github_review_lane_receipts`) の schema 変更と `user_version` の更新、およびその表の再投影は**同じ transaction** で行う。失敗したときは旧 schema・旧 version・旧行へ rollback する。`rebuildHarnessDb` は、版つきの再作成を投影と同じ外側の transaction の中で実行する形に改める。入れ子は `runSqliteTransaction` の既存の savepoint 規律で扱い、新しい transaction 機構は作らない。
- `migrate()` を単独で呼ぶ場合 (rebuild を伴わない)、旧版の DB では対象表を新しい定義で再作成し、`user_version` を上げる。これも `migrate()` の transaction の中で行い、途中で失敗したら旧表・旧 version のまま戻る。旧行は新表へコピーせず空になり、行は次の rebuild が台帳から投影し直す (この 2 表は rebuild で再生成できる投影である)。旧行の `plan_id` から `issue` を推測して詰めることはしない。
- 対象表以外 (PLAN 用の表を含む) は触れない。DB ファイル全体の作り直し (削除して作る、`VACUUM INTO` で差し替える) は、永続表と PLAN 用の表の保全 (本節の冒頭) と両立しないので採らない。
- 新しい migration 層・runner は作らない。既存の `migrate()` の版つきの再作成の型 (`rebuildVersion26ProjectionTables` の `DROP TABLE` と同じ位置) と `runSqliteTransaction` を使う。
- oracle は `CANDIDATE-U-PLANRET-019`・`020` に、旧版 → 新版、再実行 (`applied=false`)、最終 commit の失敗、item FK の維持、`plan_id` 列と PLAN への FK の消滅、無関係な表の保全を要求する (テスト設計 §3)。

**既存の DISPPTR 契約との関係** (S3): `docs/design/harness/L5-detailed-design/physical-data.md` の `vmodel_item_target_edges` は、これまで「`design_path` 列を足し、`plan_id` を legacy として `plan_registry` への外部キーごと保持する」としていた。本書の Issue URL 方式を採択し、この記述は撤回した (physical-data.md の同表の行と `vmodel_item_target_edges` の節を同じ PR で改訂済み)。両方とも confirmed の文書なので、どちらかを黙って優先することはしない。`CANDIDATE-U-DISPPTR-001`〜`008` (`docs/test-design/harness/L7-unit-test-design.md`) の処分は次のとおり。実際の L7 の行の削除・改訂と対応するテスト (`it.fails`、凍結 v29 fixture) の扱いは、S3 の前段 PR (`src` を含まない) で行う。

| 行 | 処分 |
| --- | --- |
| `DISPPTR-002`〜`006` | 期待値 (`design_path` の必須、旧 `plan_id` FK の保持、旧投影行の保存) を撤回し、`issue` 列と本書の再作成 (019) の期待値に置き換える |
| `DISPPTR-001` | item identity・status・target・reason・source_digest の値と集合を変えない、という性質を残す (`design_path` に関する部分だけ `issue` に読み替える) |
| `DISPPTR-003` | `artifact_path` の target に対する既存の tracked 実体の検証を残す |
| `DISPPTR-007` | charter の実体への束縛を残す |
| `DISPPTR-008` | migration と投影の原子性を残す (上の transaction 境界がこの性質を契約にしたもの) |

**既存の自動 VACUUM**: `src/state-db/db-maintenance.ts:83` は rebuild の後に空きページの割合で DB 全体へ `VACUUM` を掛ける既存の保守であり、PLAN 用の表を狙う操作ではない。本書はこれを足しも外しもしない。

## 4. fail-open で残る check の扱い (凍結点 2)

`docs/plans` が無いと空の入力で OK になる check を、退役か PLAN 非依存化かに分ける。基準は「PLAN を外した後に検査する対象が残るか」である。

| check | 現状 (PLAN を読む箇所) | 決定 | 理由 |
| --- | --- | --- | --- |
| `merged-plan-status` | `src/lint/merged-plan-status.ts:149-157` | 退役 | PLAN の `generates` と status の不整合だけを見る。対象が PLAN そのもの |
| `plan-body-substance` | `src/lint/plan-body-substance.ts:68-70` | 退役 | PLAN 本文の有無だけを見る |
| `plan-completion-drift` | `src/lint/plan-completion-drift.ts:96-98` | 退役 | PLAN の完了条件と status だけを見る |
| `review-evidence` (PLAN の `review_evidence` を読む検査) | `src/lint/review-evidence.ts:345` (`loadReviewPlans`) | 退役 | review の証跡は PR ごとの custody receipt と merge gate (`src/feedback/review-merge-gate.ts`) が持つ。`loadReviewPlans` の利用者 (`graph/loader`、`state-db/drive-registration`、`state-db/projection-writer`、`doctor/plan-governance`、`cli.ts`、`lint/bun-final-retirement`) を外した S7 で関数ごと消す |
| `guardrail-invariants` (doctor の wrapper と登録) | `src/doctor/plan-governance.ts:158-220`、`src/doctor/check-definition-groups.ts:265`、`src/doctor/profiles.ts:121` | この check だけ退役 | 入力は PLAN の `review_evidence` の cross entry だけである。同じ族分離は canonical merge dispatch の `same_family_reviewer` が持つ。`inspectGuardrailInvariants` と投影側の利用は残す。`loadReviewPlans` は S7 まで残す |
| `green-command-digest` と CI の `--strict-green-command-digest` | `src/lint/green-command-digest.ts:20`、`:421`、`.github/workflows/harness-check.yml:218` | 退役 (flag ごと) | PLAN の `review_evidence[].green_command` だけを照合する。flag の参照先 `src/cli.ts:762`、`:781`、`:843`、`:867`、`src/doctor/check-definition-groups.ts:304`、`src/doctor/runner.ts:15`、`src/doctor/result-file.ts:14`、`src/lint/advisory-strict-gate-aging.ts:74`、`src/lint/github-ci-policy.ts:515` を同じ PR で外す。doctor の結果 envelope の option に flag が入る (`cli.ts:867`) ので、workflow と vitest fence の照合を同じ PR で揃える |
| `outstanding` | `src/lint/outstanding.ts:83-86` (軸 a: 非終端 PLAN の件数) | PLAN 非依存化 | 軸 b (開いている placeholder defer、`:108-113`) は PLAN と無関係に残る。軸 a と `versionUpParked` を外す。`status --json` から PLAN の件数の field が消えるのは互換の変更として PR 本文に書く |
| `sub-doc-section-structure` | `src/lint/sub-doc-section-structure.ts:106-130` (PLAN の `sub_doc` を見る) | PLAN 非依存化 | 標準成果物の必須節 (要件 §1.10.G.6.1) は製品の設計文書に要る。走査対象を設計文書の root (`resolveVModelRoots` の design root) の frontmatter `sub_doc` に替える。harness 自身の対象は 0 件のまま |
| `ddd-tdd-rules` の `red-first-evidence` | `src/lint/ddd-tdd-rules.ts:146-156`、`:325-350` | この規則だけ退役 | PLAN frontmatter の `red_at` / `green_at` を見る規則。Red → Green → Refactor の順は PR の commit の順 (`docs/design/harness/L6-function-design/merge-gate-refactor-stage.md`) が持つ。他の規則は残す。退役の範囲は検査本体 (`:146-156`、`:325-350`、`DddTddInputs.plans`) に加えて、規則の名簿 `REQUIRED_RULE_IDS` (`:64-71`、policy との過不足を見る `ddd-tdd-policy-missing-rule` / `-unknown-rule` の入力)、方針文書 `docs/governance/ddd-tdd-rules.md` の rule id (`:23-26`) と `DDD-INV-003` (`:55`)、`invariant-test-trace` が要求する L7 の `U-DDDTDD-003` の行 (`:300-309`)、`tests/ddd-tdd-rules.test.ts` の該当 `it` を含む。名簿・方針文書・L7 の行・テストは同時に直す (どれかが残ると policy 過不足か未宣言 citation で fail-close する) |
| `descent-obligation` の defer 台帳 | `src/lint/descent-obligation.ts:270-276` | PLAN 非依存化 | 走査 root から `docs/plans` だけを外す。`docs/design` と `docs/test-design` の defer は残る |
| `l6-completion` の PLAN の腕 | `src/lint/l6-completion.ts:92-95` (`plan:`)、`:205-214` (PLAN の draft / review)、`:276`、`:291-296` | PLAN 非依存化 | 所有者は frontmatter の `issue:` (正の整数、`:97-103`) だけにする。L6 文書の `plan:` は 0 件 (#1360 で移行済み)。`hasReviewEvidence` の import を外す |
| `drive-db-registration` | `src/lint/drive-db-registration.ts:73-77`、`:80-95`、`:119-121`、`src/state-db/drive-registration.ts:61-215` | 退役 | 検査の中身が PLAN の登録の完全性であり、PLAN を外すと残る対象が無い。orphan 系 (`workflow_orphans`、`model_orphans`、`skill_*_orphans`) も `plan_registry` / `drive_runs` への JOIN で定義されている (`drive-registration.ts:110-146`) ので、「PLAN と無関係に常に検査する」とは言えない。PLAN を外した後に 0 件になることは、書き手・rebuild・保存済みデータの前提に依存し、構造的な保証ではない (`hookOrphans` も収集されるだけで違反にならない)。0 件を前提にした文面だけの検査は残さず、**新しい orphan 検査は作らない**。`expectedModes` 未提供時の `LEGACY_REQUIRED_MODES` のフォールバック (5 件の `missing_required_mode`) も同時に消える。`mode_catalog_unmapped` (`docs/process/modes/` と `MODE_CATALOG_DOC_FILES` の差分) を維持するなら、既存の mode catalog の検査 (`src/schema/mode-catalog.ts` の `unmappedModeCatalogDocs` を使う側) に所有させ、`drive-db-registration` の名では残さない。維持するかどうかは S2 の実装 PR が mode catalog 側の既存テスト (`tests/mode-catalog.test.ts`) を根拠に決めて PR 本文に書く |
| `db-currency` | `src/lint/db-currency.ts:29-40` | PLAN 非依存化 | PLAN の件数と fingerprint の比較を外し、`missing_db` だけを残す。PLAN を使わない鮮度の指標は本書では定めない (§10)。`drive-db-registration` の stats 型への依存 (`db-currency.ts:1`) は、stats の PLAN 由来の field を外して `missing_db` に要る最小の形にする。永続 DB を使うかの判定 (`isPersistedPlanRegistryCurrent`) と PLAN の fingerprint 収集 (`collectCurrentPlanRegistryFingerprint`) は、`db-currency` の残存利用を外した時点で削除し、常時 memory rebuild への置換はしない |

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
| right-arm static の L0 charter の引用 (G14 の VALUE case) | `docs/plans/PLAN-L0-*.md` の `plan_id` を引用すること (`:689-700`、`:702-729`、`:1447-1450`) | design root の `L0-planning/*.md` のうち frontmatter `layer: L0` を持つ文書の `doc_type_id` (harness では `DOC-L0-CHARTER`、Pack の雛形 `docs/templates/vmodel/L0-charter.md` も同じ値) を引用すること。違反の文言は「L0 charter の `doc_type_id` を引用する」に替える。`PLAN-L0-*` を引用している既存の test design の行 (`L7-release-consumer-dev-start-test-design.md` の `U-RCDEV-035` など) は、実装 PR では `docs/test-design/` を変更できない (`protected-modified`) ので、S3 の前段 PR (`src` を含まない) で書き換える |
| 文書処分の defer | `applicability.plan_id` 必須 (`src/document-disposition/domain/document-disposition.ts:91`)、`targets` か `plan_ids` のどちらか必須 (`:122-127`)、catalog の defer は `planId` 必須 (`src/disposition/domain/document-disposition-catalog.ts:483`)、PLAN の別名表 (`src/disposition/adapters/tracked-target-registry.ts:14-20`) | defer は `applicability.issue` (Issue URL) 必須、`targets_or_issues` とする。別名表は退役。既に記録した処分は書き換えない。その digest の再計算 (`src/document-disposition/domain/replay-document-deltas.ts:75`) は、保存されている `plan_ids` をそのまま入力にして同じ値を再現する (読むだけで、新しい記録には書かせない)。item target 台帳 (`docs/governance/vmodel-item-target-ledger.md`) の `plan_id` 列は `issue` 列に置き換え、loader の必須 header (`src/disposition/adapters/tracked-vmodel-loader.ts:92-103`) と domain・projection を同期する (現在の値はすべて未設定 `—`)。target kind `plan_alias` は型 (`targetKinds`、`src/schema/harness-db-tables-vmodel.ts`)・入力検証・resolver (`src/disposition/domain/target-resolver.ts`)・別名表を撤去し、入力に現れたら**未知の kind として拒否**する (他の kind へ黙って変換しない。Issue の別名という代替層は作らない)。`U-DISP-004` の本文 (「disposition理由/target/PLAN欠落」) も S3 の前段 PR で改訂する |
| V-model 契約の検証先 | `verification_plan_id` が `PLAN-<layer>-` で始まること (`src/vmodel-contract/application/contract-compiler.ts:110-112`、`docs/process/vmodel-contract.yaml`) | `verification_plan_id` を `verification_issue` (Issue URL、`parseIssueUrl` で検証) に替え、compiled の `planId` も対応する Issue の field に替える。`docs/process/vmodel-contract.yaml` の `source_plan` は削除する (生成元は既存の manifest の path / hash で表せる)。`required_backlinks` の PLAN 固定リスト (`contract-compiler.ts:17-24` の `PAIR_EXCEPTION_BACKLINKS`、drift 検査 `:199-216`、`vmodel-contract.yaml:31,35`) と照合を撤去する。例外の layer・allowed pairs・reason は維持する。現行の backlink は固定値の照合と出力であり、実在する文書の backlink を検証していない。実際の Issue 番号は本書では決めず、S3 の実装 PR が対応先を確かめて書く |
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

**削除 (#1365) の前**: #1365 の前提 (#1354〜#1359、PLAN 台帳専用の check の退役 2/2、#1363) に、PLAN を前提にした実 repo テストの付け替え (#1430、2026-10-28 に追加) を加える。これ以上は増やさない。§3 で行を凍結しない案を採ったので、データのための前段は要らない。

#1430 の扱いは次の規則で決める。テストが守る性質の入力が PLAN の台帳そのもの (§3 の PLAN 用の表、PLAN の `review_evidence`・`generates`・`derives-from`、PLAN を対象にする spec / activation / schedule の行) なら、その assertion かテストを退役させる。それ以外の性質 (rebuild の原子性、再 rebuild の決定性、設計品質の投影、通過証明書の読み取り、relation graph の端点の実在) は、PLAN 以外の実 repo データか fixture に入力を替えて残す。どちらの場合も、`docs/plans` の有無を見て黙って return する分岐を置かない。代わりに、入力が 0 件で空振りしないこと (対象の行や edge が 1 件以上あること) を同じテストで確かめる。oracle は `docs/test-design/harness/L7-plan-mechanism-retirement-test-design.md` §6 が固定する。

**削除の後**: 次の 8 本に分ける。`src/cli.ts` を変える段 (S1、S5、S4、S7) は、この順に直列にする。他の段は、変えるファイルが重ならないので並列でよい。

| 段 | 内容 | 主なファイル | 順序 |
| --- | --- | --- | --- |
| S1 | PLAN 専用 lint の退役 3/3 (§4 の「退役」の行の doctor check、`--strict-green-command-digest`) | `src/lint/{merged-plan-status,plan-body-substance,plan-completion-drift,green-command-digest}.ts`、`src/lint/merged-plan-target-evidence.ts` (`merged-plan-status` だけが使う内部補助。退役する module と一緒に消す)、`plan digest-migrate` (`src/cli.ts:1518`、`green-command-digest` の digest を移行するコマンド。退役する module と一緒に消す)、`src/doctor/plan-governance.ts` (`guardrail-invariants` の wrapper)、doctor の登録、`harness-check.yml`、`src/cli.ts` (doctor の option) (`merged-plan-target-evidence` と `plan digest-migrate` は #1373 のコメント 6573617832 と 6574044618 の回答で範囲に加えた) | 直列 1 |
| S2 | fail-open の check の PLAN 非依存化 (§4 の「PLAN 非依存化」)、`red-first-evidence` の退役、`drive-db-registration` の退役 | `src/lint/{outstanding,sub-doc-section-structure,ddd-tdd-rules,descent-obligation,l6-completion,db-currency}.ts`、`src/lint/drive-db-registration.ts` と `src/state-db/drive-registration.ts` (退役: PLAN の fingerprint 収集 `collectCurrentPlanRegistryFingerprint`・`isPersistedPlanRegistryCurrent` を含む)、`drive-db-registration` の登録 (`src/doctor/check-definition-groups.ts:198`、`src/doctor/profiles.ts:96`)、呼出元 (`src/doctor/process-quality.ts`)、テスト (`tests/drive-db-registration.test.ts`、`tests/db-currency.test.ts` の stats fixture、`tests/mode-catalog.test.ts`)、`package.json` の `test:db` が `tests/drive-db-registration.test.ts` を指す箇所と `src/lint/runtime-portability.ts:269` の同じ照合、`src/doctor/test-repository-isolation.ts` の `CONTRACT_ROWS` (実 repo を読む回数を増減したテストの行)、`ddd-tdd-rules` の `REQUIRED_RULE_IDS` と `docs/governance/ddd-tdd-rules.md` | 並列。`src/cli.ts` の変更が要るなら S1 の後に直列へ入れる。`oracle-test-trace-baseline.json` (2 行だけ) と code-size / doc-split の baseline を変える PR は、S1・S2・S3 のあいだで直列にする |
| S3 | manifest の参照の付け替え (§5.1、§5.2 の right-arm static・文書処分・V-model 契約) と `parseIssueUrl` | `src/shared/issue-ref.ts`、`src/gate/right-arm-static.ts`、`src/document-disposition/**`、`src/disposition/**`、`src/vmodel-contract/**`、`docs/process/vmodel-contract.yaml`、`PLAN-L0-*` を引用する test design、`vmodel_item_target_edges` の再作成 (§3、`src/schema/harness-db*.ts`、`src/state-db/{migration,vmodel-projections,projection-writer}.ts`。§3 の transaction 境界のために `rebuildHarnessDb` の `migrate()` の呼び方を変える)、`docs/governance/vmodel-item-target-ledger.md` と `src/disposition/adapters/tracked-vmodel-loader.ts` の `plan_id` 列、`PAIR_EXCEPTION_BACKLINKS` (`src/vmodel-contract/application/contract-compiler.ts`) | S4 より前 (schema の版を直列にする)。他の段とは並列。`oracle-test-trace-baseline.json` などの baseline を変える PR は S1・S2 と直列にする |
| S4 | CLI の `--plan` の解除、PR の typed trace v2、review custody v2 と `review-attestation.yml`、`github_review_lane_receipts` の再作成 (§3) | `src/cli.ts`、`src/forward/adapters/cli-registrar.ts`、`src/cli/{delegation,feedback}.ts`、`src/github/pr-trace.ts`、`src/feedback/review-custody*.ts`、`.github/workflows/review-attestation.yml`、`.github/PULL_REQUEST_TEMPLATE.md` | 直列 3 |
| S5 | Project V2 同期と binding の退役 (§7) | `src/github/{project-v2,repository-bindings}.ts`、`src/cli.ts` | 直列 2 |
| S6 | Pack の雛形と canary (§6) | `docs/templates/**` (`vmodel/`・`design/`・`state/vmodel.json`・`adapter/**`・`github/common/**`)、`src/setup/authoring-template-inventory.ts`、`src/setup/templates.ts` (`docs/templates/adapter` の生成側のミラー)、`scripts/pack-canary-acceptance.mjs`、テスト (`tests/setup.test.ts`、`tests/pack-canary-acceptance.test.ts`、`tests/pack-internal-canary-boundary.test.ts`、`tests/pack-authoring-template-scope.test.ts`) | S2 の `l6-completion` の PLAN の腕の除去と、S3 の right-arm static の `defer.issue` (consumer gate の defer、§6) の後。#961 の前。S7 と S8 の前提 (S7 が `plan` CLI を消す前に canary から `plan draft` / `plan lint` を外す)。#1002 とは直列にし、S6 の `src/setup/templates.ts` と `docs/templates/adapter/**` の変更を先に通して、#1002 は後からその上に重ねる (S6 の前に #1002 を置かない) |
| S7 | PLAN の CLI・台帳・投影コードの退役と registry からの除外 (§3)。`src/plan/`、`src/plan-admission/`、`src/plan-asset/` を消す。PLAN 以外が使う部分 (§2 の 8 行目) は消さずに `src/forward/` と `src/setup/` の側へ移す。`model_evaluations` の成功判定 (`plan_registry.status` との結合、`src/schema/harness-db-tables-evaluation.ts:31`) の退役 (列は残して NULL)、`src/doctor/test-repository-isolation.ts:45` の登録行の削除 | 上記 3 dir、`src/state-db/**`、`src/schema/harness-db*.ts`、`src/cli.ts` | 直列 4 (S1〜S6 の後。S6 が canary から `plan draft` / `plan lint` を外す前に `plan` CLI を消さない) |
| S8 | 規範文書と rule-drift の marker の掃除 (`CLAUDE.md`、`AGENTS.md`、`.claude/CLAUDE.md`、`skills/`、`docs/governance/`) | 規範文書 (`CLAUDE.md`、`AGENTS.md`、`.claude/CLAUDE.md`、`skills/`、`.claude/commands/`、`docs/governance/` の現行の運用を規定する文書)、`src/lint/rule-drift.ts` と `tests/rule-drift.test.ts` (marker の整理)。対象と対象外の線引きは下の「S6・S8 の補足」のとおり | S7 と S6 の後 |

**S1 の前段と同期 (#1373)**: S1 の退役は、次の 2 系統が既存の gate に触れるので、範囲をここで固定する。

- **S1-0 (`src` を含まない前段の PR)**: `tests/merged-plan-status.test.ts` の `U-MPSTATUS-506-001`〜`004` の 4 件の `it`、それらだけを含む `describe`、`docs/test-design/harness/L7-unit-test-design.md` の「PLAN-L7-506 merged-plan-status landing guidance oracle」の節を、同じ PR で消す。実装 PR は `docs/test-design/` を変更できず (`src/github/design-protection.ts` の `protected-modified`)、宣言だけを先に消すと未宣言の citation になり (`undeclaredCitations`)、テストだけを消すと未 citation の宣言になる。`it` だけを消して `describe` を残すと、空の suite を Vitest が失敗にする。`src` を含まない 1 本の PR なら、どの gate にも触れない。baseline は増やさない。この PR が merge されてから S1 に着手する。
- **S1 本体のテスト**: `tests/{merged-plan-target-evidence,merged-plan-status,green-command-digest,plan-body-substance,plan-completion-drift}.test.ts` をファイルごと退役させる。5 本とも退役する module を import している。`U-TESTHYGIENE-053` は他のテストと baseline にも残るので変えない。
- **S1 本体の L14 close audit**: `src/lint/l14-close-audit.ts` の `REQUIRED_EVIDENCE_BY_ITEM["green-evidence-integrity"]` から `src/lint/green-command-digest.ts` と `tests/green-command-digest.test.ts` を外す。`.ut-tdd/audit/A-143-l14-close-system-foundation-audit.md` の同じ行の 2 path は `plans-archive-20261102:<path>` の表記に替える (`evidencePaths` の対象外になり、実在検査を受けない。#1356 と同じ表記である)。next action は、`green-command-digest` と strict flag が S1 で退役し、review の green 証跡を custody receipt と merge gate が持つことを書く。項目と `closed` の状態は残し、A-155 / A-156 の参照も残す。`tests/l14-close-audit.test.ts` の fixture は同じ PR で合わせる。

**S2・S3 の前段と同期 (#1374・#1375)**: S2 と S3 も、宣言済みの oracle を引用する `it` と宣言を、S1-0 と同じ型で「同じ PR で」直す必要がある。実装 PR は `src` を含むので `docs/design/`・`docs/test-design/` を変更できず (`protected-modified`)、宣言だけ・テストだけを片側で消すと未宣言 citation か未 citation の宣言になる。`it` だけを消して `describe` を残すと空の suite を Vitest が失敗にする。S2・S3 の宣言整理は、**`src` を含まない昇格 PR に同居させてよい** (独立した前段 PR を増やさない)。同居する整理は次のとおり。

- **S2**: `U-DDBREG-*` (`drive-db-registration` の宣言群)、`U-DOCTOR-GATE-04`、`U-L6COMP-007` (`plan:` が実在しない path を指す規則。`U-L6COMP-001`・`002`・`004`・`005` の本文も PLAN を述べるので合わせる)、`docs/design/harness/L6-function-design/function-spec.md` の D.4 (`drive-db-registration` の違反表)、`U-DDDTDD-003` と `docs/governance/ddd-tdd-rules.md` の rule id・`DDD-INV-003` (§4 の `red-first-evidence` の行)。テスト設計の `CANDIDATE-U-PLANRET-009` は、orphan の ok を確かめる行から、`drive-db-registration` が退役して check と登録が無いことの確認へ変える。空になる `describe` (`tests/outstanding.test.ts`、`tests/sub-doc-section-structure.test.ts`) は `it` と一緒に消す。
- **S3**: `CANDIDATE-U-DISPPTR-001`〜`008` の L7 の行とテスト (`tests/disposition/projection.test.ts`、`tests/vmodel-migration.test.ts` の `it.fails` と凍結 v29 fixture) を §3 の処分表のとおりに撤回・置換・維持する。`U-RCDEV-035`、`U-DISP-004` の本文、`PLAN-L0-*` を引用する test design の行、`docs/process/vmodel-contract.yaml` の `VMC-004` (pair exception) の設計・oracle、台帳の列形式と target kind の設計・oracle を `issue` に合わせる。
- **baseline**: 整理で消した citation は `docs/governance/oracle-test-trace-baseline.json` から同じ PR で外す。縮んだ行は `code-size-baseline.json` を、`docs/test-design/harness/L7-unit-test-design.md` が縮めば `doc-split-baseline.json` の同文書の行を、同じ PR で下げる (増やす改訂は `doc-split-baseline-grown` になるので、行数を増やさずに書き換える)。**`oracle-test-trace-baseline.json` は 2 行しかなく、S1・S2・S3 のどれかの PR が変えるたびに衝突するので、baseline を変える PR は直列にする。**

**S6・S8 の補足 (#1378・#1380)**: S6 と S8 の前に、それぞれ `src` を含まない前段の PR を置く。

- **S6 の前段** (3 本、いずれも `src`・`scripts` を含まない): (1) 契約改訂の docs のみの PR。設計 `pack-delivery-inventory-diff.md` (`authoring:docs/templates/plan/design/template.md` を expected に持つ行)、テスト設計 `L7-pack-authoring-template-scope-test-design.md` の必須 artifact 一覧 (PLAN の行)、`L7-pack-delivery-inventory-diff-test-design.md` の `PACKINV-014` を PLAN の雛形の退役に合わせる。(2) 登録 + Red の PR (`CANDIDATE-U-PLANRET-017` を `it.fails` で引用)。(3) `src` を含まない昇格 PR。`docs/templates/**` は設計書保護の対象外なので実装 PR に入れてよい。
- **S6 の範囲** (`docs/templates/**` の `plan:` 以外の PLAN 言及): `docs/templates/vmodel/*.md` の `disposition_target`・本文の PLAN 参照、`docs/templates/github/common/` の PR 雛形の「関連 PLAN」とコメント、`docs/templates/adapter/**` の PLAN の言及 (`argument-hint`、hooks の `statusMessage` と `description`)、`docs/templates/state/vmodel.json` は、Issue か設計文書への参照に書き換えるか削除する。`src/setup/templates.ts` のミラーも同じ内容に揃える (片方だけ直すと乖離する)。検証は `CANDIDATE-U-PLANRET-017` の「`plan:` を持つ雛形が 0 本」に、「`docs/templates/**` と `src/setup/templates.ts` に、`docs/plans` と `ut-tdd plan` の指示と、`PLAN-` で始まる必須値が無い」を足す (§9 の参照不変条件)。`src/setup/distribution.ts` の配布除外 prefix `"docs/plans/"` は除外の一覧で、存在検査ではないので範囲外とする。
- **S6 と #1002 の順序**: #1002 (agent 定義の撤廃) も `src/setup/templates.ts` と `docs/templates/adapter/**` を触る。同じファイルを並行する PR に分けない (CLAUDE.md の PR スコープ規律 6) ので直列にする。S6 の `templates.ts` の変更を先に通し、#1002 は後からその上に重ねる。
- **S8 の marker**: `src/lint/rule-drift.ts` の `SHARED_MARKERS` から PLAN 由来の 2 語 (`route_signal`、`generates`) を外し、`tests/rule-drift.test.ts` の固定 (`:24`、`:57-65`) を更新し、**同じ PR で** 3 adapter の本文からそれらを消す (本文だけ消すと `missingMarkers` で fail-close、marker だけ外すのは安全なので、同一 PR にして順序の事故を避ける)。他の marker (adapter 間の相互参照、禁止 marker、hook parity) は PLAN と無関係なので変えない。
- **S8 の前段** (docs のみの 1 本): `agent-guard-delegation-boundary.md` が「PLAN Filing Rules の `route_signal` / `generates` の記述は書き換えの対象外」と書く節 (`:217`) と、それを実 repo の rule-drift 通過で検証する `U-AGBOUND-033` の記述を、2 語の撤去に合わせて改訂する。S8 の実装 PR は `src` を含むので、この設計文書を同じ PR では変更できない。この PR が S8 の対象ファイルの一覧も表で固定する。
- **S8 の対象の線引き**: 直す範囲は、現行の運用を規定する規範文書 (`CLAUDE.md`、`AGENTS.md`、`.claude/CLAUDE.md`、`skills/`、`.claude/commands/`、`docs/governance/` のうち運用規則・gate 設計・文書体系・リポジトリ構成を述べるもの) とする。§10 のとおり、履歴的な記録 (`docs/governance/candidates/**`、移行・監査の記録 `*-audit-*.md`、`plan-admission-receipts.json`、機械生成の JSON と MJS) と、要件・概念の版つき文書 (`ut-tdd-agent-harness-requirements_v1.2.md`、`ut-tdd-agent-harness-concept_v3.1.md`) の履歴的な PLAN の言及は書き換えない。ファイル単位の一覧は上の S8 の前段 PR が固定する。
- **PLAN 凍結の節の置き換え** (`CLAUDE.md` の §PLAN Filing Rules): S8 で PLAN 凍結の節と PLAN 起票規律・設計系 PLAN の 4 項目の節は、最小の形に置き換える。置き換え後の文言は「新しい作業の正本は設計文書 (`docs/design/` / `docs/test-design/`) と GitHub Issue」とし、PLAN の起票・改訂・参照追加の規則は書かない (PLAN 機構が無いため)。工程 (pair-freeze、改訂の cross-review) の規律はそのまま守る。

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
