# A5 例外一覧 (issue #1169 / #1078、2026-10-21 草案)

基準 commit は `d4e82e2e` (origin/main、#1206 merge 直後) とする。件数は特記がない限りこの commit で数えた。推測は「推測」と明記する。

## 目的と範囲

#1169 の完了条件は 2 つある。(1) 例外一覧が review で PASS すること。(2) PLAN にしか無い契約がゼロになること。
本書はこの 2 つに対して、次の 2 つを 1 本の一覧にする。

- 移管しないもの (例外) と、その理由、回復経路。
- 移管するもの (名指しの候補) の行き先。行き先が未決のものは「判断待ち」として、何が決まれば動くかを書く。

本書は非著者の review を受ける。本書が PASS しても、「判断待ち」と「移管」の行が実際に閉じるまでは (2) は満たされない。
本書の位置づけは「閉じていない行の一覧」であり、「閉じた」という主張ではない。

前提 (A1、#1165): PLAN 1,008 件は固定 SHA の Git tag (`plans-archive-<日付>`) で読み取り専用に残る。参照は
`git show <tag>:docs/plans/<file>` で行う。**この tag はまだ無い** (`git tag -l 'plans-archive*'` も origin も 0 件を返した)。
A6 (物理削除) の直前に付ける。本書の「回復経路」は、すべてこの tag が付くことを前提にしている。tag が付くまでは
`docs/plans/` 自体が回復経路である。

方針の出典は #1078 の次の 2 コメントである。

- 進め方の切り替え (issuecomment-6265568869): 1,008 件を再審査しない。処分 JSON による削除ごとの gate は採らない。
- control の A5 判断 (issuecomment-6289671147): 判断 1 = draft 300 件は移管対象に含めず、例外一覧に載せる。
  判断 2 = impl-plan-trace は module 単位の検査にする (契約は #1206 で merge 済み。Green は未)。

## 抽出の方法と残るリスク

方法は、再審査をせず、既存の材料が「PLAN にしか無い」「設計が欠けている・古い」と個別に名指ししたものだけを候補にした。
材料は、b/d/f の人手判定 (`issue959-human-disposition-{b,d,f}-20261013`)、confirmed の機械一次判定
(`issue959-confirmed-machine-pass-20261019`)、#977 の drift 判定 (`issue977-drift-judgments-20261013`)、
T3 の照合記録と見送り表 (`issue1149-t3-lot-reconciliation-20261019.md`)、#1147 / #1078 のコメントである。

候補ごとに、行き先の設計文書を実際に開いて、契約が既に書かれているかを確かめた。結果として、棚卸し (a5-inventory) の
作成時点から設計文書側が進んでおり、**名指しの候補のうち 17 行は、設計文書に既に書かれていた** (処置 = 例外、根拠は `path:行`)。
その大半は #977 の design_follow と退役注記で、#977 後続の design patch が merge 済みである。

残るリスクを 4 つ書く。受け入れるリスクとして、review で確認してほしい。

1. **名指しされなかった PLAN の契約は「設計文書側にある」と推定している**。対象は confirmed 679 + completed 26 + archived 3 の
   うち、本書の表に載らない PLAN である。この推定を機械的に裏付けるものは、impl-plan-trace の module 単位検査だけである
   (契約は `docs/design/harness/L6-function-design/module-drift.md:130-152` と U-IPT-007〜011。#1206 で contract merge 済み、
   Green は未)。これが保証するのは「src の module が設計文書に名指しされている」ことだけで、規則・判断理由・受け入れ条件・
   defer 記録といった **PLAN 本文にしか無い意味** は保証しない。
2. 保留 517 件 (b/d/f) は「PLAN にしか無い」ことを意味しない (各 md が明記)。一方で「PLAN にしか無い」ことが
   否定されたわけでもない。本書は 517 件を再審査していない。
3. 取りこぼした規則・判断理由を回復する経路は、A1 のアーカイブから読み直す以外に無い。取りこぼしは、PLAN 撤去後に
   その規則が必要になった時点で初めて気づく (推測)。
4. 部分 supersede の後継 PLAN のうち 6 本 (L6-89 / L7-141 / L7-517 / L6-104 / L7-565 / L6-789) は draft である
   (第 4 節の表)。第 4.4 節は、後継の確定を待たず、旧 PLAN の訂正注記を正本に残った規定を 1 件ずつ照合した
   (#1169 comment 6306590222 の判断 3)。例外の根拠は設計文書か機構だけで、アーカイブは根拠にしていない。残るリスクは 2 つある。
   (a) 後継 draft が confirmed になるとき、後継側が旧 PLAN の残った規定を引き取る範囲を変える可能性がある (推測)。
   その場合は 4.4 の該当行を再照合する。(b) 例外の根拠のうち、test-design の `CANDIDATE-*` だけにある契約
   (C32 の D2-B consumer predicate、C36 の Pack publication の一部) は Green ではない。契約は設計側にあるが、機構の担保は無い。

## 区分別の例外

draft・廃止予定・T3 最終化済みなどの区分である。区分の対象 PLAN は、移管しない代わりに、アーカイブから参照できる。

| 区分 | 件数 | 対象の特定方法 | 移管しない理由 | 回復経路 |
|---|---|---|---|---|
| E1 draft | 300 | `git ls-files 'docs/plans/PLAN-*.md'` の各 frontmatter で `status: draft` (再現コマンド 1) | 判断 1。draft は未着手の計画であり、status で切って移管対象にしない。再審査もしない。例外一覧に載せて review を受けることが安全弁である。reverse の draft 90 件の漏れは、判断 2 (src 所有を設計側に閉じる) で塞ぐ | A1 の固定 SHA アーカイブ (`git show <tag>:docs/plans/<file>`)。それまでは `docs/plans/` |
| E2 b/d/f の廃止予定 | 15 (うち draft と重なるのは 1) | `issue959-human-disposition-{d,f}-20261013.json` の `records[]` で `dispositionCandidate == "廃止予定"` (再現コマンド 2)。b には 0 件 | PLAN 運用面の限定責務で、契約本体は設計・governance・コードに実在すると各 md が記録。ただし `classificationIsFinal: false` で、各 md は「廃止や削除許可ではない」と明記している。ここでは「移管しなくてよい」という判定を review に出す | 同上 |
| E3 T3 で最終化済み | 7 | `issue1149-t3-lot-reconciliation-20261019.md` の L7-63 / L7-64 / L7-67 / L7-66 / L7-400 / REVERSE-45 / REVERSE-46 | 三者照合済み (consistent 6 / plan-stale 1)。契約は設計文書・governance・schema に実在し、移す契約が残っていない | 同上 + 照合記録 |
| E4 画面カット (#1084 group 13) | 11 (L4-14 を除く。うち draft 2、E2 と重なるのは L2-01 の 1) | L1-03 / L2-01〜04 / L3-06 / L5-09 / L6-36 / L7-96、draft の L7-141 / L7-204 (再現コマンド 3) | 画面の設計文書と、画面 ID に依存するコードが #1084 段 2〜4 で撤去される。契約は設計ごと消える (#1147 の順序変更コメント) | 同上。画面の設計文書自体は #1084 の撤去前なら git history |
| E5 #977 の予定済み・退役済み / 誤検出 | 25 + 25 | `issue977-drift-judgments-20261013.json` の `verdict == "retire_or_planned"` / `"false_positive"` (再現コマンド 4) | これは設計と実装の drift 判定であり、PLAN の契約ではない。「PLAN にしか無い契約」の判定対象に入らない。予定済み 25 件の「予定」先は draft PLAN の契約や後続 slice であり、その draft は E1 に入る。誤検出 25 件は実装がある | 同上 + 判定 JSON |
| E6 エピソード状態 | 件数なし | PLAN 本文の進捗・次の一手・handover 類 (機械で列挙できない)。`.ut-tdd/handover/` は tracked 12 ファイル (`git ls-files .ut-tdd/handover`)、他は未追跡 | `CLAUDE.md` の方針で、エピソード状態は PLAN にもメモリにも持たない。stale 化する層を作らない | 同上。永続教訓は HARNESS メモリに昇格済みか別途 |

重なりの実測 (再現コマンド 5): E1 ∩ E2 = 1 (PLAN-REVERSE-533-memory-completion-fence-backfill)。E1 ∩ E4 = 2 (L7-141 / L7-204)。
E2 ∩ E4 = 1 (L2-01)。E1 ∩ E3 = 0。E2 ∩ E3 = 0。したがって E1〜E4 の合計 333 に対して、重複を除いた distinct PLAN は 329 件である
(300 + 15 + 7 + 11 − 1 − 2 − 1 = 329)。E5 は PLAN を指さないので数えない。

注意: #1147 は画面カットの PLAN を「11 件」と書くが、同じコメントの ID を数えると L4-14 を含めて 12 件になる
(L1-03 / L2-01〜04 / L3-06 / L4-14 / L5-09 / L6-36 / L7-96 の 10 件 + draft 2 件)。本書は列挙した ID を数えた。

### E2 の件ごとの理由 (1 行ずつ)

理由は d / f の JSON の `reason` を要約した。いずれも「将来の廃止候補であって削除許可ではない」と各 md が書いている。

| PLAN | 1 行理由 |
|---|---|
| PLAN-REVERSE-533-memory-completion-fence-backfill (draft) | Reverse 本文に未実装撤回の明記。後継 PLAN-L6-104 が名指しされ、Issue #550 は not planned で close |
| PLAN-DISCOVERY-01-workflow-metamodel | S0-S4 の PoC 工程。S4 の promote 先は PLAN-REVERSE-08 と concept §2.5 |
| PLAN-DISCOVERY-03-skill-design | skill の PoC 工程。score 飽和 / category carry の discharge 先は PLAN-L6-37。f の reason は「他の残 carry の消滅を意味しない」と書く。本 PLAN の §6 が挙げる残 carry は 2 つで、どちらも設計側に記録がある: score の de-saturate は `docs/design/harness/L6-function-design/skill-index.md:79` (`scoreSkill`) と U-SKILL-IDX-006 (`docs/test-design/harness/L7-unit-test-design.md:761`)、injector の layer 別注入セット定義は L6 carry として `docs/design/harness/L5-detailed-design/internal-processing.md:152` と `module-decomposition.md:144` (A5-C51) |
| PLAN-DISCOVERY-04-process-workflows | PoC 工程。process の正本化は PLAN-REVERSE-01 へ移管済み。f の reason が「別途残る」と書く cross-mode walkthrough の作成時期 (PO 判断) は、PLAN-REVERSE-01 §2.3 C にしか無く、設計文書と governance に無い (`git grep -i walkthrough` が 0 件)。この残 carry は A5-C52 で移管する。PLAN 自体は例外とする |
| PLAN-DISCOVERY-06-orchestrator-rule-parity | L7-139 が Codex hook を実装、REVERSE-139 が採用モデルを L4 architecture へ移管 (第 4 節 A5-C10) |
| PLAN-DISCOVERY-08-forward-convergence-invariant | invariant は現行の契約として存続し、REVERSE-140 が S4 を正本化。退役候補は PoC 運用面だけ |
| PLAN-DISCOVERY-09-version-up-mode | mode 契約は REVERSE-140 / concept / process へ backfill 済み |
| PLAN-DISCOVERY-10-gpt56-tier-routing-bench | S4 の決定根拠は履歴。L7-415 が実装を記録 |
| PLAN-L2-01-screen-list | AC 全 met。`screen-list.md` が authoring source。E4 と重複 |
| PLAN-L4-13-drift-lint | asset-drift slice は architecture / doctor gate / L5-07 / L6 へ降下済み |
| PLAN-L4-16-security-design-slot | security sub_doc の採択と同期は完了。`security.md` が source pointer、実質は L4-29 |
| PLAN-L4-17-version-up-design-bottomup-band | L4 §3.1 外部設計 backfill は `function.md` と L9 ST-FUNC-08/09 に記載。次版 deferral lint は非対象 carry |
| PLAN-L4-29-security-design-substance | 脅威モデル等は `security.md` §5-9 と L9 ST-EXT-06 に配置済み |
| PLAN-M-00-verify-cutover | local の L8-L14 実行記録と A-132 audit。production 側は human_required で対象外 (第 4 節 A5-C08) |
| PLAN-M-01-cutover-backfill | local の backfill / projection DoD は完了。production cutover は scope 外 (第 4 節 A5-C08) |

## 名指しの候補と処置

処置は 3 種類である。`移管` = 設計文書か Issue へ移す (行き先を書く)。`例外` = 移さない (理由を書く)。
`判断待ち` = 何が決まれば動くかを書く。「根拠」の `path:行` は、worktree (`d4e82e2e`) で実際に開いて確かめた位置である。

### 4.1 T3 の見送り表と #1078 が個別に名指ししたもの

| ID | 候補 | 由来 PLAN | 処置 | 行き先 | 根拠 |
|---|---|---|---|---|---|
| A5-C01 | 表示の既定閾値を下げるときは PO 承認で定数を変更する規則 | PLAN-L7-401 | 移管 | `docs/design/harness/L6-function-design/function-spec.md` の「feedback surface taxonomy 追補」(:76-78) に 1 文 | 規則は `docs/plans/PLAN-L7-401-attempt-escalation-surface-cap.md:89-90` にあり、function-spec.md:76-78 には cap の件数と breadcrumb だけで、この規則は無い (`grep` で「閾値を下げ」を `docs/design` に 0 件) |
| A5-C02 | `recordGuardrailDecision` の本番配線を、PO 判断待ちの defer として持つ | PLAN-L7-48 | 移管 | 新規 Issue (defer の記録。owner = PO)。番号は未採番で、control が起票する | defer の本体は `PLAN-L7-48-readiness-guardrail.md:82-96` の §Deferred。設計側は関数契約 (function-spec.md:724) だけで defer の記録が無い。移管は既存の defer 記録 (対象・根拠・owner・条件) を Issue へ写すだけで、配線の方針は決めない。配線そのものは認可と human-signoff の意味に触れる高影響境界であり、実施するときに PO 承認が要る (PLAN 本文の auth-gated と同じ) |
| A5-C03 | FRC の closure 台帳 R1〜R9 (A-133 audit の「PLAN / WBS」列 9 行がすべて PLAN-L7-50 を指す)。FRC の `planTarget` も同じ | PLAN-L7-50 | 判断待ち | R1〜R9 の契約本文を設計文書か Issue のどちらへ移すか | 解析の契約は function-spec.md:656-668 (D.5) に既にある。残るのは R1〜R9 各バケットの WBS 本文と、audit の列が PLAN を指すこと。`pathFromTarget` は `#` 以降を捨てるので Issue 参照を受け付けない (`src/lint/fr-roadmap-coverage.ts`、a5-inventory §5)。Issue へ移すならコード改訂が要る。**決まれば動く条件**: 移管先 (設計文書 / Issue) の選択と、A-133 audit を残すかの判断 |
| A5-C04 | `analyzeVerificationProfileGate` (verification-profile gate) の契約 | PLAN-L7-59 | 移管 | function-spec.md の lint 節 (D 節) に新規サブ節 | 実装は `src/lint/verification-profile.ts:460`、doctor 配線は `src/doctor/lint-gates.ts:159`。設計側の `verification-profile` 言及は projection の話 (module-drift.md:71-85) で、gate の関数名は `docs/design` に 0 件 |
| A5-C05 | `analyzeChangeSetIntegrity` の契約 | PLAN-L7-60 | 移管 | function-spec.md の lint 節に新規サブ節 | 実装は `src/lint/change-impact.ts:111`、doctor 配線は `src/doctor/lint-gates.ts:125-138`。設計側には関数名が 0 件で、テスト設計 `U-CHGIMPACT-NONGIT-01` (L7-unit-test-design.md:955) が非 git 時の挙動に触れるだけ |
| A5-C06 | runtime-portability guard の契約 | PLAN-L7-62 | 移管 | function-spec.md の lint 節に新規サブ節 (検出器の一覧に既存の記述あり) | `src/lint/runtime-portability.ts` は `docs/design` に名指しの契約が無い。`L7-unit-test-design.md:2380` に検出器名の列挙があるだけ |
| A5-C07 | token ingest の transaction 契約 | PLAN-L7-61 | 判断待ち | #789 の退役実行が完了するか | PLAN-L6-789 は `status: draft`、Issue #789 は OPEN。`projectTokenUsage` は `src/state-db/projection-writer.ts:698` と `src/cli.ts:2022` に残る。設計側に ingest transaction の契約は無い (function-spec.md:174 は FR-L1-38 を退役予定と書くのみ)。**決まれば動く条件**: 退役が完了すれば例外 (E3 と同形)。残れば function-spec.md に契約を移管 |
| A5-C08 | cutover の roadmap registry と A-132 audit の契約 | PLAN-M-00 / PLAN-M-01 | 例外 | (E2 に既出) | 契約は `docs/design/harness/L3-functional/roadmap.md:192` と `docs/design/harness/L4-basic-design/architecture.md:121` に既にあり、証跡は `.ut-tdd/audit/A-132-l8-l14-verification-band-execution.md` に残る。cutover の strategy は `docs/migration/` にある |
| A5-C09 | 工程表定義の製本化 | PLAN-RECOVERY-04 | 例外 | - | 契約は `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md:419-421` (E3「全プログラム被覆」) と `docs/design/harness/L0-planning/charter.md:139` に既にある。T3 見送り表の「移管先が未確定」は、既にあるため不要になった |
| A5-C10 | orchestrator-rule-parity の S4 判断 (ADOPT = reuse-with-hardening) | PLAN-DISCOVERY-06 | 例外 | - (E2 に既出) | 採否と実装先は `docs/design/harness/L4-basic-design/architecture.md:188` に既に記録済み (ADOPT 判定、L7-139 で実装) |

### 4.2 設計文書が実装と食い違う疑いのあるもの

| ID | 候補 | 由来 | 処置 | 行き先 | 根拠 |
|---|---|---|---|---|---|
| A5-C11 | `findReference` の signature | PLAN-L7-47 | 移管 | function-spec.md:39 の行を現行 `(db, query: string)` へ合わせる (設計を実装に合わせる) | 設計は `(query: ReferenceQuery, deps)` (function-spec.md:39)、実装は `findReference(db: HarnessDb, query: string)` (`src/search/index.ts:50`)。現在も食い違っている |
| A5-C12 | asset-catalog の承認 root | PLAN-L7-49 | 移管 | function-spec.md:42 を現行に合わせる | 設計は `SOURCES` = `docs/skills` / `.claude/agents` / `docs/commands` (function-spec.md:42)、実装は `DEFAULT_SKILL_ROOTS = ["skills", "docs/skills"]` (`src/assets/catalog.ts:84`)。食い違いは現在も残る |
| A5-C13 | `drive-db-registration` の violation 一覧 | PLAN-L7-51 | 移管 | function-spec.md:640-648 の `reason` union に `mode_catalog_unmapped` を足す | 実装の union には `mode_catalog_unmapped` がある (`src/lint/drive-db-registration.ts:45`、使用は :118)。設計は散文 (function-spec.md:654) には書くが、union の型 (:640-648) には無い。T3 の指摘は部分的に解消しており、型の列挙だけが残る。**6 WBS 全体の照合は本書で行っていない** |
| A5-C14 | Codex の effort を argv (`-c model_reasoning_effort=`) へ注入する契約 | PLAN-L7-65 | 移管 | function-spec.md の「2026-07-01 model / effort routing 追補」(:770-797) に 1 文 | 実装は `src/runtime/adapter.ts:378`。`agent-slots.md` と function-spec.md の該当節に argv 注入の記述が無い。oracle `U-DELEG-005` はテスト設計 (L7-unit-test-design.md:508) にだけある |
| A5-C15 | `DispositionRecord` の DTO 表が旧名・旧 field (#977 CD-31) | #977 design_follow | 例外 | - | 既に直っている。`function-spec.md:1736` が `DocumentDispositionInput` を載せ、旧 `DispositionRecord` の廃止を注記している |
| A5-C16 | `DocumentProfileCatalogInput` の旧名 (CD-33) | #977 design_follow | 例外 | - | 既に直っている。`function-spec.md:1755-1756` が `createProfileCatalog` の入力と戻り値を載せる |
| A5-C17 | `EvidenceInput` の型名 (CD-34) | #977 design_follow | 例外 | - | 既に直っている。`function-spec.md:1729` が `EvidenceRecordInput` を載せる |
| A5-C18 | `WorkflowContext` の構成 (CD-44) | #977 design_follow | 例外 | - | 既に直っている。`function-spec.md:1733` が `ForwardEvidenceContext` を載せ、旧 `WorkflowContext` との対応を注記している |
| A5-C19 | `setup-solo-team.md` の `onPath` 再利用記述 (CD-53) | #977 design_follow | 例外 | - | 既に直っている。`setup-solo-team.md:133` が「`onPath` は撤去済み」と書く |
| A5-C20 | `release-channel-manifest.md` の DbC 表 (DWI-10) | #977 design_follow | 例外 | - | 既に直っている。`release-channel-manifest.md:27-39` が `parseReleaseManifest` / `parsePublicationManifest` / `admitReleaseAggregate` を載せ、訂正注記に #977 を明記している |

### 4.3 #977 の保留 9 件

#977 の保留は `hold` = 9 件 (CD-02 / 12 / 20 / 21 / 22 / 37 / 38 / 39 / DWI-05) である。結果として 1 件を除き、設計文書側で解決済みだった。

| ID | 候補 | 由来 | 処置 | 行き先 | 根拠 |
|---|---|---|---|---|---|
| A5-C21 | `ClosureReceipt` (run 単位) と `DocumentClosureResult` の関係 (CD-02) | PLAN-L7-467、PLAN-L4-25 / L5-19 (draft) | 判断待ち | `docs/design/harness/L4-basic-design/data.md:293` に「予定 / 実装済み」の注記を足すか、`DocumentClosureResult` へ合わせるか | `data.md:293` は注記なしで `ClosureReceipt` を載せたまま (`#977` / `CD-02` の言及が `data.md` に 0 件)。**決まれば動く条件**: PLAN-L7-467 の完了範囲と、draft の L4-25 / L5-19 の所有照合 |
| A5-C22 | `InvokeResult` の `audit_ref` と重複排除 (CD-12) | L5 if-detail | 例外 | - | 既に決着。`if-detail.md:41` が「`audit_ref` は持たない」と書き、`:53` が「汎用の invoke dedup 契約は退役 (#977)」と書く |
| A5-C23 | typed receipt 3 種 (`ReviewLaneReceipt` / `SessionIdentityReceipt` / `WorkProvenanceEventReceipt`、CD-20 / 21 / 22) | PLAN-L5-26 / L6-93、#134 / #487 | 例外 | - | 既に退役注記がある。`internal-processing.md:588-591` が「退役済みの設計であり、実装予定はない」と書き、#487 の close と #152 / #153 の close を根拠にする |
| A5-C24 | `L6ConfirmationReceipt` の production adapter (CD-37) | PLAN-L6-93、#152 系 | 例外 | - | 同上。`function-spec.md:2406-2410` が「退役済み」と書く |
| A5-C25 | `PlanAssetInput` の dependencies 重複拒否と digest 不一致拒否 (CD-38) | PLAN-L7-418 / L6-71 | 例外 | - | 既に決着。`function-spec.md:1727` が「検査は実装にも PLAN-L6-71 の設計判断にも存在しない (#977 で除去)」と書く |
| A5-C26 | `ProjectionContext` / `ProjectionIdFactory` / rebuild application の残 DoD (CD-39) | PLAN-L7-423 | 移管 | 契約は設計にある。**残 DoD の追跡**だけを新規 Issue へ (control が起票。番号は未採番) | 契約は `function-spec.md:1714-1720` に既にある。しかし `projection-writer.ts` の application orchestration 分割という残 DoD は `PLAN-L7-423-engine-swap-domain-objects-ports.md:113` だけにある。残っているかは本書で実測していない |
| A5-C27 | `sprint check` / `trace check` (L3 FR-02) の処遇 (DWI-05) | L3 FR-02 | 例外 | - | 設計が「未実装の将来形」と明記している (`edge-case.md:68`)。退役か存続かは FR registry の判断で、PLAN の契約ではない |

### 4.4 部分 supersede (旧 PLAN にだけ残った契約が残る疑い)

> **本節の基準 commit**: 本節 (表と下の小節) の `path:行` は、照合を行った origin/main `7950cfae` 時点の行番号である。本書のほかの節の基準 (`d4e82e2e`) とは異なる。その後の main では、`docs/design/harness/L6-function-design/function-spec.md` の Appendix D の後ろに 117 行が入った (#1216) ため、同ファイルの 730 行目より後の行番号はずれている。

A 区分 (`superseded-link-confirmed`) は 12 件で、#1078 は 11 件を部分 supersede と書いた。機械一次の `H:supersede-partial` は 10 件で、
それに T3 が見送った L7-102 を足すと 11 件になる。12 件目の `PLAN-L7-532-pack-publication-driver` は draft (E1) で、部分かどうかは確認していない。

**照合の方式と出典**: #1169 comment 6306590222 の判断 3 に従い、11 件を 1 件ずつ、旧 PLAN 自身の訂正注記を正本にして照合した。
supersede の範囲は、後継 PLAN の確定を待たなくても旧 PLAN の訂正注記が書いている (前版の「範囲確定方法が未決」は誤りだった)。
手順は次のとおり。(1) 訂正注記が「supersede されなかった」とする規定と、注記が触れない本文の規定を列挙する。
(2) 規定ごとに、設計文書に同じ意味の記述があるか (`path:行` を開いて確認)、機構と、それを検査するテストがあるか (src と test 名を grep で確認) を調べる。
(3) どちらも無い規定だけを移管にする。「アーカイブを参照すればよい」だけを理由にした例外は作らない。後継が draft の 6 本 (L6-89 / L7-141 / L7-517 /
L6-104 / L7-565 / L6-789) も、旧 PLAN の残った規定を落とさない。

**処置の決め方**: 1 行 = 1 旧 PLAN。残った規定がすべて例外なら `例外`、1 つでも移管があれば `移管`。今回は判断待ちが残らなかった。
結果は 11 行のうち 例外 6 行 (C29 / C33 / C34 / C36 / C37 / C38)、移管 5 行 (C28 / C30 / C31 / C32 / C35)、判断待ち 0 行である。
規定の単位では、確認した 65 規定のうち、移管は 5 規定 (C28 / C30 / C31 / C32 / C35 に 1 規定ずつ。C32 は 4 検査と関連 AC をまとめて 1 規定と数えた)、例外は 60 規定、判断待ちは 0 規定である。
詳細は表の下の小節に置く。

| ID | 候補 (旧 PLAN) | 後継 PLAN (status) | 処置 | 行き先 | 根拠 |
|---|---|---|---|---|---|
| A5-C28 | PLAN-L6-72-forward-fsm-evidence-policy-contracts | PLAN-L6-89 (draft) | 移管 | `docs/design/harness/L6-function-design/function-spec.md` の「Forward FSM完全遷移表」(:1879-1913) を src の遷移表に合わせて改訂する | 残った規定 8 のうち 1 が移管、7 が例外。移管の理由は「設計文書の遷移表が src と食い違う」こと。詳細は `#### A5-C28 の残った規定` |
| A5-C29 | PLAN-L7-102-web-dashboard-phase-b | PLAN-L7-141 (draft、画面カット E4) | 例外 | - | 残った規定 3 はすべて設計文書にある (`screen-list.md:60-64`、`ADR-005` D2、screen projection は `src/state-db/projection-writer.ts:2485`)。詳細は `#### A5-C29 の残った規定` |
| A5-C30 | PLAN-L7-139-codex-hook-adapter | PLAN-L7-668 (confirmed) | 移管 | `docs/design/harness/L4-basic-design/architecture.md` §6 の Codex parity 行へ `ut-tdd guard preflight` の契約を追記する | 残った規定 9 のうち 1 (guard preflight) が移管、8 が例外。詳細は `#### A5-C30 の残った規定` |
| A5-C31 | PLAN-L7-143-harness-db-warn-remediation | PLAN-L7-144 (confirmed) | 移管 | `docs/design/harness/L5-detailed-design/module-decomposition.md` へ `sub-doc-section-structure` (`src/lint/sub-doc-section-structure.ts`) の module 登録を追記する | 残った規定 5 のうち 1 (orphan module の一部) が移管、4 が例外。詳細は `#### A5-C31 の残った規定` |
| A5-C32 | PLAN-L7-465-cross-review-author-binding | PLAN-L7-517 (draft) | 移管 | 新規 Issue (cross-review 実在照合の 4 検査と AC-2 / AC-3 / AC-4 を、実装するか、D1 / D3 の別機構で置き換えたとして閉じるかを決める。番号は未採番で、control が起票する) | 残った規定 13 のうち 1 (4 検査と関連 AC) が移管、12 が例外。4 検査は src にも設計文書にも 0 件。詳細は `#### A5-C32 の残った規定` |
| A5-C33 | PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze | PLAN-L7-742 (confirmed) | 例外 | - | 残った規定 5 はすべて `release-channel-manifest.md` §4-§6、§8 と `U-RELMAN-014`〜`017` にある。詳細は `#### A5-C33 の残った規定` |
| A5-C34 | PLAN-L7-494-release-promotion-rollback-gate | PLAN-L7-742 (confirmed) | 例外 | - | 残った規定 4 はすべて test-design の oracle `U-RELMAN-003/004/010/019〜023` と、それを検査する `tests/release-promotion-rollback-gate.test.ts` にある。詳細は `#### A5-C34 の残った規定` |
| A5-C35 | PLAN-L7-512-project-scoped-memory-root | PLAN-L6-104 (draft) | 移管 | `docs/design/harness/L6-function-design/memory.md` へ「global 領域に Memory 本文を置かない」を 1 文で追記する | 残った規定 4 のうち 1 が移管、3 が例外。詳細は `#### A5-C35 の残った規定` |
| A5-C36 | PLAN-L7-515-pack-remote-canary-publication | PLAN-L7-565 (draft) | 例外 | - | 残った規定 6 のうち 5 は `L7-pack-publication-remote-test-design.md` にあり、1 (Bun を持ち込まない実行経路) は runtime-portability gate が担保する。詳細は `#### A5-C36 の残った規定` |
| A5-C37 | PLAN-L7-57-token-telemetry-tracker | PLAN-L6-789 (draft) | 例外 | - (#789 の退役実行は C07 / C39 が持つ) | 継承された規定 4 は、取得層の関数は src と test、table schema は設計文書と src にある。詳細は `#### A5-C37 の残った規定` |
| A5-C38 | PLAN-L7-86-merged-plan-status-deliverable-scope | PLAN-L7-87 (confirmed) | 例外 | - | 残った規定 4 はすべて src と test にある。詳細は `#### A5-C38 の残った規定` |

#### A5-C28 の残った規定

旧 PLAN の訂正注記 (`PLAN-L6-72` :66-71) は、evidence policy 契約部分を L6-89 が訂正・拡張し、Forward FSM 遷移契約 (`U-FSM-001..007` / `P-FSM-001`) は存続すると書く。

- **evidence policy の typed 表 (kind / cardinality / expiry / producer / subject revision / exit rule)** → 例外 (設計文書)。`function-spec.md:1914-1956` が同じ意味の policy 表と command→policy 表を持つ。L6-89 は draft だが、設計文書側に既にある。
- **event 空集合は `proposed`、sequence は 1 始まりで連続、command / event 冪等** → 例外 (設計文書)。`function-spec.md:1881-1887`。oracle は `U-FSM-007` (`L7-unit-test-design.md:1458`)。
- **`workflow status|transition|explain` の共通 envelope と exit 0/1/2/3、alias 多義 / future revision の fail-close** → 例外 (設計文書)。`function-spec.md:1958-1976`。
- **property oracle (seed、0〜64 event、10,000 列、決定論的 shrinker)** → 例外 (設計文書と機構)。`function-spec.md:1980-1982`、oracle `P-FSM-001` (`L7-unit-test-design.md:1461`)、テスト `tests/forward/fsm.test.ts:368`。
- **Forward ledger の state は PLAN frontmatter の status と独立。ledger 不在は `forward-ledger-unavailable` / exit 3** → 例外 (設計文書)。`function-spec.md:1974-1975`、oracle `U-FSM-008` (`L7-unit-test-design.md:1459`)。
- **表に無い event は `forward-transition-illegal`、拒否時は event / outbox / 外部 intent を 0 件** → 例外 (設計文書)。`function-spec.md:1969-1976`、oracle `U-FSM-001` / `U-FSM-002`。
- **`PLAN-L7-419` の `github_issue_id` と references を #344 に更新する (訂正注記 :236-239)** → 例外 (対象外)。PLAN の frontmatter の書誌事項であり、設計・実装の契約ではない。PLAN 機構の撤去 (#1078) で意味を失う。C44 と同じ扱いである。
- **正規 event 12 件 + 例外 event 5 件の遷移表 (許可される from state、next state、必須 evidence、欠落時の typed rule)** → **移管**。設計文書の表と src が食い違っている (今回の照合で見つけた)。
  - 設計文書 `function-spec.md:1888-1913` は snake_case の command (`prepare_pair_freeze` 等) と `forward-plan-evidence-missing` 等の個別 rule を持ち、`reject` を `planned〜review_ready` から許し、`resume` を `resumeState` へ戻し、`superseded` を terminal とし、`accepted` からは `archive` 以外を許さない。
  - src の `src/forward/domain/transition-policy.ts:76-198` は旧 PLAN の「表の具体化追補」(`PLAN-L6-72` :82-100) と同じ表で、kebab-case の event、`reject` は `review_ready` / `reviewed` から、`resume` は `planned` へ、`superseded` は `reopen` で再開でき、`supersede` は `archived` 以外の全 normal state (accepted を含む) から許す。
  - 検査するテストは `tests/forward/fsm.test.ts` (`U-FSM-001`〜`009`) で、src の表を検証している。したがって旧 PLAN の表は「機構で担保」されているが、設計文書が別の表を持つので、設計文書を読む者は誤った遷移表を得る。
  - 移管先: `function-spec.md` の「Forward FSM完全遷移表」を src の表 (旧 PLAN の追補と同じ) に改訂し、event 名と rule 名を src に合わせる。どちらを正とするかは、src が既に実装・検査済みなので src とする (推測ではなく `transition-policy.ts:76-198` の実測)。

#### A5-C29 の残った規定

旧 PLAN は archived で、訂正注記 (`PLAN-L7-102` :62-68) が `src/web`・`tests/web.test.ts`・`cli web` の破棄を宣言する。`src/web` は空で、旧 PLAN の本文の規定 (15 画面のダッシュボード、XSS 対策、各 test) は実装ごと破棄された。注記が残すと言う規定は次の 3 つである。

- **`screen` projection (doc 正本 → harness.db) は基盤として保持** → 例外 (設計文書と機構)。`src/state-db/projection-writer.ts:2485` が screen-list の画面表を行に分解し、`tests/doc-consistency.test.ts:48` が `screenIdOrphans` を検査する。この projection の所有 PLAN は L7-96 で、E4 (画面カット) の表に載る。
- **全画面 read-only、CLI コマンドのコピーのみ (S5=b)** → 例外 (設計文書)。`docs/design/harness/L2-screen/screen-list.md:60-64`。
- **中央 server 同期は ADR-005 D2 で direction-only** → 例外 (設計文書)。`docs/adr/ADR-005-distribution-model-and-central-ui.md:27-32`。

#### A5-C30 の残った規定

訂正注記は 2 つある (:324-326 は launcher shim の撤去、:328-334 は `blockOnFailure` と `args` 形式の訂正)。「本 PLAN のその他の契約は維持する」。

- **`.codex/hooks.json` は Claude の guard と同じ entrypoint を、Codex の matcher で mirror する。両アダプタの entrypoint 集合が一方向に食い違えば `entrypoint_drift`** → 例外 (設計文書と機構)。`architecture.md:188`、oracle `U-CXHOOK-005` (`L7-unit-test-design.md:979`)。
- **matcher の tool 名差 (`apply_patch|write_file` 等) と `apply_patch` の patch 本文からの path 抽出 (`extractEditTargets`)** → 例外 (設計文書と機構)。`architecture.md:188` の「偽パリティ caveat」①②、oracle `U-CXHOOK-007` (`L7-unit-test-design.md:981`)。
- **hosted / API ツール経路は `.codex/hooks.json` で intercept されない (`apiToolPathEnforced=false`)** → 例外 (設計文書と機構)。`architecture.md:188` の scope 記述、oracle `U-CXHOOK-009` (`L7-unit-test-design.md:983`)、テスト `tests/codex-hook-adapter.test.ts:122`。
- **`ut-tdd guard preflight`: hosted / API 編集の前に work-guard と同じ判定を流す (対象は `--target` / `--patch-file` / `--stdin`、foreign な uncommitted 対象は exit 2、JSON に `apiToolPathEnforced:false` を出す)** → **移管**。設計文書に 0 件 (`git grep -n "guard preflight" -- docs/design docs/test-design` が 0 件)。機構は `src/cli.ts:1442-1507` にあるが、テストは help の exit code 文言だけ (`tests/cli-surface.test.ts:491-502`) で、foreign 対象を exit 2 にする挙動を検査するテストが見つからない (推測を含む。`guard preflight` を呼ぶテストを grep した結果)。移管先: `architecture.md` §6 の Codex parity 行 (:188) の隣へ、契約を 3 行で追記する。
- **`agent-guard` の Codex 版 (`spawn_agent` / `spawn_agents_on_csv` に同じ判定を掛ける)** → 例外 (設計文書)。`docs/design/harness/L6-function-design/agent-guard-delegation-boundary.md:76`、`:189`。
- **`SubagentStop` だけが Codex では真の N/A** → 例外 (設計文書と test-design)。`architecture.md:188` ③、oracle `U-CXHOOK-006` (`L7-unit-test-design.md:980`)。
- **`HookInvocation { executable, args }` を意味論の正本とし、Claude / Codex の config JSON は runtime 固有 projection。Codex の structured args は実機で証明されるまで既存形式を保つ。`hook-native-launcher.test.ts` は `isolated_fixture` として 1 回だけ root を参照する** → 例外 (設計文書と機構)。`function-spec.md:2218-2224`、`session-log.md:176`、`setup-solo-team.md:180`、`L7-unit-test-design.md:2214-2220`、機構は `src/doctor/test-repository-isolation.ts:6,61,109` (`callsite-drift` で fail-close)。
- **Windows の `windowsHide: true` はコンソール窓の抑止だけで process-tree custody を保証しない。`orphan_count=0` の証拠に使わない。恒久解は #134 の Resource Kernel** → 例外 (設計文書)。`function-spec.md:2222` (「process-tree ancestry の観測は主張しない」)、`L9-system-test-design.md:244-246` (`ST-RGK-01`〜`03`)、`architecture.md:354`。
- **launcher shim の挙動契約は consumer template 側に存続する (訂正注記 :326)** → 例外 (設計文書)。shim は撤去済みで、`setup-solo-team.md:149` と `:183` が「`.ut-tdd/bin/run-bun.ts` は存在しない」と project-local の `ut-tdd.mjs` wrapper の契約を書く。

#### A5-C31 の残った規定

訂正注記 (:165-171) は、same-model advisory を意図的に scoping しないという判断 (§2 / §5 / §7) が誤りで L7-144 が訂正したこと、「Fix1 / Fix2 / Fix3 (same-provider scoping) は正しく有効なまま存続する」ことを書く。

- **Fix1: `sk-` の API key pattern に `\b` を付け、`task-` / `risk-` / `desk-` の部分文字列を過剰に redact しない** → 例外 (機構)。`src/export/document-export.ts:248`、テスト `U-DOCEXPORT-005b` (`tests/document-export.test.ts:98`、`task-classify` / `risk-policy` / `desk-review` が残ることを検査)。oracle の基底は `U-DOCEXPORT-005` (`L7-unit-test-design.md:400`)。
- **Fix3: `same-provider-cross-review` の advisory は `review_kind=cross_agent` に限る (`intra_runtime_subagent` では構造的に不可避なので出さない)** → 例外 (機構)。`src/state-db/projection-writer.ts:964-973`、テスト `tests/guardrail-invariant-advisory.test.ts:96` (cross_agent では発火)、`:142` (intra_runtime_subagent では抑止)。advisory 本体の契約は `function-spec.md:726`。
- **Fix2: 16 テストを単一の traceability anchor として `generates` へ登録する** → 例外 (対象外)。PLAN の `generates` 登録という PLAN 機構の書誌事項で、契約ではない。test-case catalog が PLAN の generates から引く経路 (`src/state-db/projection-writer.ts:2177-2214`、`missing-test-plan-id`) は PLAN 撤去で作り変える対象である (A4 / #1078 の範囲)。低い確信 (後述)。
- **`tests/context-doc-router.test.ts` の anchor。機能所有は `PLAN-L7-302` の DoD に残す** → 例外 (設計文書)。doc-router の契約は `docs/design/harness/L6-function-design/context.md:19-21`、oracle `U-CONTEXT-001..005` (`L7-unit-test-design.md:31`)。
- **未登録だった 9 source module (agent-guard / asset-drift / doc-consistency / entity-coverage / fr-registry-audit / g3-trace / schema / sub-doc-catalog-drift / sub-doc-section-structure) は別の traceability backfill へ残す** → 例外 (設計文書) 8 module、**移管** 1 module。8 module は設計文書に名指しされている (`git grep -l <module名> -- docs/design` の件数: agent-guard 25、asset-drift 8、doc-consistency 9、entity-coverage 5、fr-registry-audit 8、g3-trace 9、schema 47、sub-doc-catalog-drift 1)。`sub-doc-section-structure` は設計文書に 0 件である。移管先: `module-decomposition.md` へ module と責務を追記する。#1206 で contract merge 済みの module 単位の impl-plan-trace (`module-drift.md:130-152`) は Green 未達なので、機構の担保には数えなかった。
- 本 PLAN の対象外と書かれた `unresolved-join` 95 件と `same-model-self-review` 37 件は、契約ではなく範囲外の宣言なので規定に数えない。

#### A5-C32 の残った規定

訂正注記 (`PLAN-L7-465` :167-208) は、supersede されたのは「実装スコープ 2 の author 導出元 (commit author / trailer)」の 1 規定だけで、family 依存の他の規定は有効と書く。本文はほかに、L6-94 の 4 検査、dispatch lifecycle、merge gate (B / D / A)、D3a / D3c / D3d、D2-B を持つ。判断 3 が「本命」と呼んだ範囲である。

- **同一 family の自己承認を verdict として受理しない (`same_family_reviewer`)** → 例外 (機構)。`src/feedback/review-dispatch.ts:457`、テスト `U-RVDISP-007` (`tests/review-dispatch.test.ts:254`)、`U-RVDISP-054` (`L7-unit-test-design.md:1669`)。
- **D1 dispatch の反対族 routing (同族 fallback 禁止、未知 family / 反対族 runtime 不在は delegation 0 / receipt 0 で deny)、consumer の反対族 provider 起動、`U-RVATT-024`** → 例外 (設計文書と機構)。`agent-guard-delegation-boundary.md:76,137,189`、テスト `U-RVATT-024 routes author %s to reviewer %s` と `U-RVATT-024 denies unknown and unavailable opposite providers without writing` (`tests/live-review-projection.test.ts:201,206`)。
- **§D3c の `provider-family-authority.ts` port と `unverified_family` 終端 (承認済み authority が無い間は `custody_admitted` を出さない)** → 例外 (設計文書と機構)。`internal-processing.md:1236-1244` (local artifact を authority にしてはならない)、`:1274-1276` (`custody_admitted` と `unverified_family` を同一視しない)、テスト `U-RVGHA-D3C-017` (`tests/review-custody.test.ts:270`)。
- **exact HEAD 限定、未応答 SLA (verdict 60 分の一段だけ)、`stale_head` 終端** → 例外 (機構)。`src/feedback/review-dispatch.ts:53` (`DEFAULT_REVIEW_DISPATCH_SLA`)、`:505`、テスト `U-RVDISP-008` (`tests/review-dispatch.test.ts:271`)、`U-RVDISP-011` (`:320`)、`U-RVDISP-038` (`:867`)、oracle `U-RVDISP-043`〜`046` (`L7-unit-test-design.md:1664`)。
- **dispatch lifecycle の状態 (requested → acknowledged → in_review)、`merge_ready` の 5 条件、決定論、孤児 receipt の無視、verdict 無し merge の検出** → 例外 (機構)。`src/feedback/review-dispatch.ts:481,513`、テスト `U-RVDISP-001`〜`006` (`tests/review-dispatch.test.ts:131-224`)、`U-RVDISP-009` (`:284`)、`U-RVDISP-010` (`:296`)、`U-RVDISP-012` (`:336`)。
- **merge gate B: `ut-tdd pr merge` の正規経路で `merge_ready` 以外を exact HEAD で fail-close、wrapper receipt を残す** → 例外 (機構)。`src/feedback/review-merge-gate.ts`、テスト `U-RVMG-001` (`tests/review-merge-gate.test.ts:383`)、`U-RVMG-002` (`:428`)、`U-RVMG-003` (`:613`)、`U-RVMG-004` (`:632`)。
- **merge gate D: wrapper receipt 無しの merge (`bypass_merge`) と `merged_without_verdict` を post-merge に検知する** → 例外 (機構)。`src/feedback/post-merge-backstop.ts`、テスト `U-RVMG-015`〜`019` (`tests/post-merge-backstop.test.ts:118-180`)。
- **merge gate A: `harness-ci-aggregate` (非 required) と最終 required `harness-check` を分離し、D1 `merge_ready` AND D3d `custody_admitted` を最終 check へ投影する。最終 check の結果を入力へ戻さない** → 例外 (設計文書)。`function-spec.md:2178-2191`、`internal-processing.md:801`。
- **main protection の観測 (required context は `harness-check`、`enforce_admins`、bypass actor)。required check の green だけでは reviewer family や custody を証明しない** → 例外 (設計文書と機構)。`external-if.md:167-171`、`function-spec.md:2189` (D3d との AND)、`src/setup/branch-protection.ts:27,33`。観測値の bypass actor 0 件は設計文書に書かれていない (`external-if.md:171` は bypass actor を diff しないと書く)。観測値そのものは契約でなく、2026-08-05 の時点の事実なので規定に数えない。
- **D3a: live review の canonical 正本は `.ut-tdd/review/requests` / `receipts`。派生 (memory / wake / PR comment) は入力へ逆流させない。canonical 永続化の成功後にだけ派生を publish。inbox envelope は `purpose` (`memory` / `review`) を持ち、review は canonical request の digest / path / identity を必須とする** → 例外 (設計文書と機構)。`state-channel-consolidation.md:95-112`、テスト `U-RVATT-024` (`tests/live-review-projection.test.ts:96`、`tests/claude-memory-wake.test.ts:633`)、`U-PMEMROOT-007` (`tests/claude-memory-wake.test.ts:260`)。
- **D3d の確定事項: receipt の全 field を closed にする、`artifactDigest` は receipt field にしない、`AdmittedCustody` は CI / merge 由来 field を持たない、workflow は `workflow_dispatch` のみ、`attestation_runtime` role で trigger 逸脱・過剰 permission を fail-close** → 例外 (機構)。`src/lint/github-ci-policy.ts:1012-1024`、テスト `U-RVGHA-D3C-010` (`tests/github-ci-policy.test.ts:1522,1526,1564`)、`U-RVGHA-D3C-014` (`tests/review-custody.test.ts:704`)、`U-RVGHA-D3C-016` (`:770`)。
- **D2-B の consumer predicate (cutoff 以後の verdict は完全な terminal chain がある場合だけ受理) と B-3 の deny entry 束縛 (判定 entry を一意に定められない deny は `verdict: null`)** → 例外 (test-design)。前者は `CANDIDATE-U-RVMG-024`〜`034` (`L7-unit-test-design.md:1742-1752`)。ただし旧 PLAN も「未実装の契約候補」と書いており、テストの実装は無い (Green ではない)。後者は `U-RVMG-002` / `U-RVMG-003` / `U-RVMG-014` (`tests/review-merge-gate.test.ts:428,613,483`)。
- **L6-94 の 4 検査 (adapter-session-existence / provider-direction-coherence / fallback-declaration / stale-direction-drift)、AC-1 の `U-XREV-*` 6 件、AC-2 (申告 provider ≠ 実 author provider の検出)、AC-3 (照合不能は `unverified` で、green に混ぜない)、AC-4 (利用上限 marker の one-shot 消費と audit)** → **移管**。4 検査の名前は src にも設計文書にも test-design にも 0 件 (`git grep -n "adapter-session-existence\|provider-direction-coherence\|fallback-declaration\|stale-direction-drift" -- docs/design docs/test-design src` が 0 件)。`U-XREV-*` は test-design / tests に無い (`U-XREVIEW-001〜` は別の model 相異の検査)。AC-4 の marker 機構も src に無い (「利用上限」の grep は設計文書の `if-detail.md:61` の rate-limit だけ)。実際の同族防止は D1 / D3 の別機構 (上の各規定) で担保されているので、旧 PLAN の 4 検査が実装されないまま PLAN が撤去されると、この意図が落ちる。移管先: 新規 Issue。内容は「4 検査と AC-2〜4 を実装するか、D1 / D3 が置き換えたとして閉じるか」の決定である。前者なら設計文書 (`cross-review-enforcement.md` に節を足す)、後者なら閉じる根拠を Issue に残す。

#### A5-C33 の残った規定

訂正注記 (`PLAN-L7-492` :149-158) は、§1 (C) の channel mapping が v1 の exactly-one を前提にしていた点だけを L7-742 が置き換え、v1 の exactly-one、§1 (A)(B)、apply / rollback 契約、AC は変えないと書く。

- **final tree に対する 3 predicate (A: manifest の一意性と schema、B: allowlist が control manifest を含む、C: channel → revision → destination の写像) を side effect 前に AND 判定し、欠ければ sealed plan と副作用 0** → 例外 (設計文書とテスト)。`release-channel-manifest.md:93-100`、oracle `U-RELMAN-014` (`L7-unit-test-design.md:2273`、`tests/release-aggregate-admission.test.ts:394`)。
- **manifest schema invalid / unknown channel / revision・object unavailable は typed finding で fail-close、`unavailable` を成功や mismatch へ丸めない** → 例外 (設計文書とテスト)。同 `:93-100`、`U-RELMAN-015` (`:535`)、`U-RELMAN-016` (`:547`)。
- **preflight の成功値は immutable な sealed plan だけ。Git の commit / merge 方式、worktree、network を判定入力にしない** → 例外 (設計文書)。`release-channel-manifest.md:93-100` の Post / Invariant。
- **apply は isolated staging へ。staging / apply の各境界の fault で prior state 不変、partial publish 0。restore 失敗は `rollback_failed` / `applied=indeterminate`** → 例外 (設計文書とテスト)。`release-channel-manifest.md:102-111`、`U-RELMAN-017` (`L7-unit-test-design.md:2276`、`tests/release-aggregate-admission.test.ts:617`)。
- **v1 の exactly-one と、CLI / GitHub / network / Pack repo の実 copy を core へ持ち込まない** → 例外 (設計文書)。v1 は `release-channel-manifest.md:175`、境界は `:120-121` (外部 GitHub、Pack repository、force push は本契約の副作用ではない)。

#### A5-C34 の残った規定

訂正注記 (`PLAN-L7-494` :283-291) は、§2 の PF5 sealed plan の strict shape 検証と単一 `mapping` 入力だけを L7-742 が置き換え、reason の列挙・precedence、evidence 束縛、rollback の選択規則、AC は変えないと書く。契約の本文は L6 に無く、test-design の oracle に書かれている (L7-742 が追加した v2 の基数だけが `release-channel-manifest.md:193-200` にある)。

- **`ReviewGateEvidence` は canonical `ReviewRequest` を source anchor とし、D1 / D2 / facts / claim-blind / spec-blind を同じ request identity へ束縛する。caller の expected binding を一括共変異した coherent splice も拒否する** → 例外 (test-design と機構)。`U-RELMAN-003` (`L7-unit-test-design.md:2255`、`tests/release-promotion-rollback-gate.test.ts:561`)、`U-RELMAN-020` (`:2266`、`:737`)。
- **reason precedence は `invalid_input`、`identity_mismatch`、evidence 欠落 / No-Go、channel transition、attestation unavailable、allow の順。attestation は status より先に identity を照合する** → 例外 (test-design と機構)。`U-RELMAN-019` (`:2265`、`:719`)、`U-RELMAN-020`。
- **rollback は直前 channel の attested candidate を 1 件だけ選び、同じ入力から同じ pointer delta と digest を返す。D2 欠落・非 ready では PF5 へ到達しない。`artifactAvailable` の false / 欠落は `artifact_unavailable`** → 例外 (test-design と機構)。`U-RELMAN-004` (`:2256`、`:672`)、`U-RELMAN-010` (`:2264`、`:694`)、`U-RELMAN-021` (`:2267`、`:1021`)、`U-RELMAN-023` (`:2269`、`:1116`)。
- **rollback の apply は既存 PF5 port を再利用し、`rollback_failed` / `applied=indeterminate` を成功や `applied=0` へ丸めない** → 例外 (test-design と機構)。`U-RELMAN-022` (`:2268`、`:1101`)。

#### A5-C35 の残った規定

訂正注記 (`PLAN-L7-512` :246-259) は、Slice 4 (migration / inventory / quarantine / recovery / completion) だけを L6-104 が supersede し、Slice 1 / 3 の project-scoped canonical root、`claude-provider-envelope.ts`、clean Pack parity は「有効なまま継承」と書く。Slice 4 の oracle (`U-PMEMINV` / `U-PMEMQUAR`) は撤回済みで、`L7-project-scoped-memory-root-test-design.md` の「Slice 4 oracle の撤回」節が書く。

- **linked worktree は primary の `.ut-tdd/memory` を唯一の authored corpus とし、common-dir 配下の project digest namespace を通知 bus とする。identity の欠落・drift、common-dir・realpath の escape、別 project の namespace 不一致は typed deny** → 例外 (設計文書とテスト)。`memory.md:401-403` (resolver の配置と、canonical root・HEAD identity・symlink 拒否を現行のまま保つ)、`L7-project-scoped-memory-root-test-design.md:14-17,21-22` の `CANDIDATE-U-PMEMROOT-001`〜`004`・`008`・`009`、テスト `tests/project-memory-root.test.ts:278,296,317,329`。
- **notification envelope は project / memory / operation / producer / target を束縛し、project mismatch は read / claim を 0 にする** → 例外 (設計文書とテスト)。`state-channel-consolidation.md:95-112`、`U-PMEMROOT-007` (`tests/claude-memory-wake.test.ts:260`)、`tests/project-memory-pack-parity.test.ts:161`。
- **clean Pack parity (Pack だけで setup した consumer が CLI・両 provider hook・Memory・Claude wake を保つ)** → 例外 (test-design とテスト)。`L7-project-scoped-memory-root-test-design.md:24` の `CANDIDATE-P-PMEMROOT-002`、テスト `tests/project-memory-pack-parity.test.ts:92`。
- **global 領域に Memory 本文を置かない。global lessons、semantic ranking、cloud memory service は扱わない (Scope boundary)** → **移管**。設計文書に 0 件 (`memory.md` に global / repo 外 / home の記述が無い。`git grep` で `global.*Memory` を検索した結果も該当なし)。移管先: `memory.md` へ「Memory 本文は repo の `.ut-tdd/memory` だけに置き、global 領域には置かない」を 1 文で追記する。

#### A5-C36 の残った規定

訂正注記 (`PLAN-L7-515` :114-118) は、GitHub の PR merge API に expected base OID の原子的 precondition があるという前提だけを L7-565 が置き換え、publication FSM、approval、journal、read-back の契約は維持すると書く。後継 L7-565 が draft でも、残った規定は test-design に書かれている (実装テストの一部は CANDIDATE のまま)。

- **publication FSM、approval receipt、nonce、journal、read-back、同一 operation の reconciliation (consume 済み nonce だけ。未使用 nonce の resume は無い)** → 例外 (test-design)。`L7-pack-publication-remote-test-design.md:79-91` (`CANDIDATE-PACKPUB-003-G`〜`P`)、`:125-129`。
- **stable rollback の自動化は実装しない。回復は別の human-approved supersede-forward intent だけ** → 例外 (test-design)。`L7-pack-publication-remote-test-design.md:130` (supersede-forward は別 intent の参照境界)、`:152` (完全自動 rollback は範囲外)、`L7-pack-publication-driver-test-design.md:81` (`CANDIDATE-PACKPUB-004`)。
- **tag / Release / assets の全監査と visibility transition が完了するまで canary pointer の after snapshot を append しない。観測不能は `unavailable` / `indeterminate`** → 例外 (test-design)。`:83-86` (`CANDIDATE-PACKPUB-003-J`・`K`・`L`・`M1`)、`:87` (`003-M-late`)。
- **cleanup 失敗は publication の成否を上書きせず、独立した typed observation にする** → 例外 (test-design)。`:89` (`CANDIDATE-PACKPUB-003-N`)。
- **入力は sealed staging identity、明示された Pack commit entries、control manifest sidecar、決定論的 tarball と checksum の exact 2 assets だけ。source repository、current worktree、開発用 DB / PLAN / evidence、local Pack checkout、directory walk、glob、環境変数から実行時入力を補完しない** (旧 PLAN :138-143) → 例外 (test-design)。`L7-pack-publication-remote-test-design.md:27-35` (fixture は immutable な `SealedPackPublicationPlan` 相当の値で、source worktree・directory walk・Pack checkout・開発 DB・PLAN 本文・環境変数から entry を補完しない) と `:77` (`CANDIDATE-PACKPUB-003-E`: 暗黙の補完を注入すると fallback を拒否し、最初の remote write が 0)。機構の担保 (Green) はまだ無い。
- **実装言語・実行経路は Node/npm。Bun、`bun`/`bunx`、`setup-bun`、`bun:sqlite`、Bun を暗黙に起動する fallback を持ち込まない** (旧 PLAN :145-146) → 例外 (機構)。repo 全体を対象にする runtime-portability gate (`src/lint/runtime-portability.ts`、function-spec の D.9) が、allowlist の外の Bun spawn・`bun:` import・Bun global を fail-close する。テストは `tests/runtime-portability.test.ts:141` (`U-RPORT-016`)、`:194` (`U-RPORT-017`)、`:209` (`U-RPORT-018`)。publication の実装 (`src/setup/pack-publication-*.ts`) もこの gate の走査範囲に入る。

#### A5-C37 の残った規定

訂正注記 (`PLAN-L7-57` :126-134) は、token ingest (`projectTokenUsage` による `model_runs` への投入、`projectModelEvaluations` の token 集計拡張、対応する AC) だけを L6-789 が supersede し、取得層、`model_runs` / `model_evaluations` の table schema、generates 2 件は継承すると書く。

- **取得層 (`parseClaudeSessionUsage` / `parseCodexSessionUsage` / `computeClaudeCostUsd` / `loadRuntimeSessionUsage`)** → 例外 (機構)。`src/state-db/token-tracker.ts:121,182,245,335`、テスト `tests/token-tracker.test.ts:33` (CLAUDE_PRICING)、`:69` (未知 model は null で、費用を捏造しない)、`:83` (codex)、`:242` (`parseClaudeSessionUsage`)。価格表の正本の扱いは `function-spec.md:749`。Stop / doctor の常時経路が取得層を走査しない契約は `U-TOKSTOP-001` (`L7-unit-test-design.md:3073`)。
- **`model_runs` の table schema** → 例外 (設計文書)。`docs/design/harness/L5-detailed-design/physical-data.md:141`。
- **`model_evaluations` の table schema と `projectModelEvaluations`** → 例外 (設計文書と機構)。契約は `function-spec.md:174` と `functional-requirements.md:63,275` (FR-L1-38。退役予定と明記)。schema は `src/schema/harness-db-tables-evaluation.ts:35`、テスト `tests/model-evaluation.test.ts:70`。
- **generates 2 件の継承** → 例外 (対象外)。PLAN の書誌事項。
- #789 の退役実行 (表示経路 `loadRepoScopedRuntimeSessionUsage` の扱いを含む) は C07 と C39 が持つ。この行はそれに依存しない。

#### A5-C38 の残った規定

訂正注記 (`PLAN-L7-86` :41-48) は、kind filter を据え置くとした記述と「blast radius 0」を L7-87 が誤りとして訂正し、「path-scope 拡張 (src/*.ts → 出荷物ルート) 自体は有効・不変」と書く。

- **merged-artifact の候補を `DELIVERABLE_ROOTS = [src/, tests/, scripts/, .claude/]` 配下の `generates` に拡張する** → 例外 (機構)。`src/lint/merged-plan-status.ts:62,134-147`、テスト `tests/merged-plan-status.test.ts:346` (`.claude/` の出荷物)。
- **`docs/` と `.ut-tdd/` は除外する** → 例外 (機構)。`src/lint/merged-plan-status.ts:147` (ルート前置の filter)、テスト `tests/merged-plan-status.test.ts:372` (docs/ は除外)。`.ut-tdd/` の除外は同じ filter の結果で、個別のテストは見つけていない。
- **`generatesSrcPaths` → `generatesMergedDeliverablePaths` への改名と、誤誘導コメントを残さない** → 例外 (機構)。`src/lint/merged-plan-status.ts:134` が改名後の名前である。契約ではなく実装内の整理である。
- **status / handover が「層内の非終端 PLAN 数 / open explicit-defer 数」を正の集計 signal として surface する機構 (IMP-139、旧 PLAN の範囲外)** → 例外 (機構)。`src/cli.ts:728-745` (`computeOutstandingWork`)、テスト `tests/outstanding.test.ts:13-30`。ただしこの surface は PLAN の status に依存する。PLAN 撤去 (#1078) で作り変える対象で、A4 の範囲である。
- kind filter の据え置き (`ARTIFACT_KINDS`) は L7-87 が撤去したので残った規定ではない (`tests/merged-plan-status.test.ts:136,404` が kind に依らない検出を検査する)。

#### 退役候補だが存続責務を持つもの

| ID | 候補 | 処置 | 行き先 | 根拠 |
|---|---|---|---|---|
| A5-C39 | PLAN-L7-454-runtime-token-telemetry-ingestion (H:partial-retire-named) | 判断待ち | A5-C07 と同時 | 後継 `PLAN-L6-789` §3 が `loadRepoScopedRuntimeSessionUsage` を表示経路として残すと記述。#789 の退役実行待ち |
| A5-C40 | PLAN-L7-472-claude-memory-async-wake (H:retire-candidate) | 例外 | - | wake 基盤の存続は `state-channel-consolidation.md:47` と §A3 の採択 (:77-95) に既にある |
| A5-C41 | PLAN-L7-162-team-run-policy-extraction (H:retire-candidate) | 判断待ち | #762 の削除対象と一致するが契約が未凍結 | 機械一次 md の記録。**決まれば動く条件**: #762 の削除の範囲の確定 |
| A5-C42 | PLAN-REVERSE-238-cited-command-backfill (H:retire-candidate) | 判断待ち | #1083 の対象。契約が未凍結 | 機械一次 md の記録。生成物は `docs/process/modes/README.md` だけ。**決まれば動く条件**: #1083 の範囲の確定 |

### 4.5 規約文・実装トレースと、T3 で照合が終わらなかったもの

| ID | 候補 | 由来 | 処置 | 行き先 | 根拠 |
|---|---|---|---|---|---|
| A5-C43 | impl-plan-trace の 280 path の所有 trace (PLAN 本文からだけ trace される src) | PLAN 本文 | 例外 | - | 契約は既に設計にある。`module-drift.md:130-152` が module 単位の所有検査に改め、`:149` が 40 module のすべてが名指し済みであることを実測し、L5 へ足す行は 0 件とする。テスト設計は U-IPT-007〜011 (L7-unit-test-design.md:297-308)。#1206 で merge 済み。**Green (実装) は未で、A6 の前提**である |
| A5-C44 | G1 の「L3 PLAN は requires に列挙する」規約文 (設計文書側) | PLAN 規約 | 例外 | - | PLAN 機構の規約で、PLAN 撤去と同時に消す文言。移す契約が無い。`git grep -n 'dependencies.requires' HEAD -- docs/design docs/governance/*.md docs/test-design` は 26 件 (L1-requirements、L3 README、L4 function.md、L6 backfill-pairing.md ほか)。26 件のうち G1 規約文に当たるものを 1 件ずつ分類していない。文言の改訂は #1168 系の作業 (範囲の確認は本書で未了) |
| A5-C45 | 同上の governance 側 (concept v3.1 :591 / :700、requirements v1.2 :396 / :404-405 / :566 / :680 / :684 / :873) | PLAN 規約 | 判断待ち | governance 文書の改訂手続き | canonical set の改訂に必要な review の重さと手続き (PLAN 凍結中は設計文書 / Issue 経由) が未確認。**決まれば動く条件**: 改訂の手続きの決定 |
| A5-C46 | PLAN-L4-14 の consumer 向け標準契約 | PLAN-L4-14 | 判断待ち | 移し先の決定 | `ui-standard.md` 自身は画面カットで撤去される対象。consumer 向けの標準契約をどこへ移すかが #1147 で未決。**決まれば動く条件**: 移し先の決定 (E4 から除外した理由) |
| A5-C47 | PLAN-RECOVERY-01-internal-asset-recovery | T3 見送り (照合が量的に終わらず) | 例外 | - | T3 は照合の量で見送っただけで、「PLAN にしか無い」契約を名指ししていない。再審査をしない方針 (#1169) に従い追加照合はせず、名指しされなかった PLAN と同じく「抽出の方法と残るリスク」のリスク 1 として受け入れる |
| A5-C48 | PLAN-RECOVERY-02-vmodel-canonical | 同上 | 例外 | - | 同上 |
| A5-C49 | PLAN-DISCOVERY-02-roster-design | 同上 | 例外 | - | 同上 |
| A5-C50 | PLAN-L7-462-bun-runtime-withdrawal | T3 見送り (大きな troubleshoot、段階移行の残差が複数) | 例外 | - | 同上の理由でリスク 1 として受け入れる。加えて、Bun 撤去の拘束は `.claude/CLAUDE.md` §Hooks (Bun permanent ban、#134) と `package.json` の `utTdd.nodeToolchain.nodeAuthority` にあり、ADR-007 が PLAN-L7-462 を履歴として参照する (`docs/adr/ADR-007-harness-db-sqlite-projection.md:24`)。段階移行の残差の契約が設計側にあるかは照合していない |
| A5-C51 | PLAN-DISCOVERY-03-skill-design | T3 見送り | 例外 | - (E2 に既出) | PoC 工程の履歴。残 carry 2 つの所在: score の de-saturate = `skill-index.md:79` と U-SKILL-IDX-006 (`L7-unit-test-design.md:761`)。injector の注入セット定義 = `internal-processing.md:152` が L6 carry と明記し、`module-decomposition.md:144` が injector の責務を持つ |
| A5-C52 | cross-mode walkthrough (複数 mode を横断する走行例) の作成時期を PO 判断の carry として持つ | PLAN-DISCOVERY-04 → PLAN-REVERSE-01 §2.3 C | 移管 | 新規 Issue (carry の記録。番号は未採番で、control が起票する) | PLAN-REVERSE-01 (confirmed) §2.3 C が「欠陥ではなく未着手の予定作業。作成時期は PO 判断」と書き、最初の 3 本の候補を挙げる。設計文書・governance・`docs/process` に walkthrough の記述は 0 件 (`git grep -n -i walkthrough d4e82e2e -- docs/design docs/governance/*.md docs/process`)。REVERSE-01 も撤去対象なので、Issue へ移す |

## 集計

名指しの候補 52 行 (A5-C01〜C52)。1 行が複数の PLAN を含むものがある (C08)。件数は第 4 節の表を再現コマンド 6 で数えた値である。

| 処置 | 行数 | 行 ID |
|---|---|---|
| 移管 | 16 | C01, C02, C04, C05, C06, C11, C12, C13, C14, C26, C28, C30, C31, C32, C35, C52 |
| 例外 | 28 | C08, C09, C10, C15, C16, C17, C18, C19, C20, C22, C23, C24, C25, C27, C29, C33, C34, C36, C37, C38, C40, C43, C44, C47, C48, C49, C50, C51 |
| 判断待ち | 8 | C03, C07, C21, C39, C41, C42, C45, C46 |
| 合計 | 52 | |

読み方:

- 移管 16 行のうち、設計文書への改訂・追記で閉じるものは 12 行 (C01 / C04 / C05 / C06 / C11 / C12 / C13 / C14 / C28 / C30 / C31 / C35)。新規 Issue の起票が要るものは 4 行 (C02、C26、C32、C52)。C02 の Issue は defer の記録であり、配線の実施 (高影響境界、PO 承認が要る) とは別である。C28〜C38 の 11 行は #1169 comment 6306590222 の判断 3 で旧 PLAN の訂正注記を正本に 1 件ずつ照合し、移管 5 行 (C28 / C30 / C31 / C32 / C35)、例外 6 行 (C29 / C33 / C34 / C36 / C37 / C38) とした。
- 判断待ち 8 行の内訳: #789 の退役実行待ち 2 行 (C07 / C39)、#762 / #1083 の範囲確定待ち 2 行 (C41 / C42)、governance の改訂手続き 1 行 (C45)、移し先の決定 2 行 (C03 / C46)、#977 の所有照合 1 行 (C21)。2 + 2 + 1 + 2 + 1 = 8。部分 supersede の 11 行 (C28〜C38) は判断待ちを残さず閉じた (C37 は #789 の退役実行に依存しないと判定したので、C07 / C39 とは分けた)。
- 例外 28 行のうち 17 行は、棚卸し時点の照合で「設計文書に既に書かれていた」ものである。C29 / C33 / C34 / C36 / C37 / C38 の 6 行は、残った規定の根拠が設計文書または機構 (src と test 名) で、test-design の oracle が契約本文を持つもの (C34 / C36) と、機構だけのもの (C38 の一部) を含む。C44 は、PLAN 機構の規約として PLAN と共に退役させる文言である。C47〜C50 の 4 行は、T3 で照合が量的に終わらなかったが名指しの根拠が無いもので、リスク 1 として受け入れる。
- 棚卸しの時点で未決とされていた #977 の CD-20 / 21 / 22 (C23) は、例外にした。`internal-processing.md:588-591` に退役注記が既にあるためである。

## 再現コマンド

worktree `C:/dev/ut-1169-a5-exceptions` (base `d4e82e2e`) で実行した。リポジトリは変更しない。

```
# 1. status の件数と draft 一覧
git ls-files 'docs/plans/PLAN-*.md' | wc -l                      # 1008
for f in $(git ls-files 'docs/plans/PLAN-*.md'); do grep -m1 '^status:' $f | awk '{print $2}'; done | sort | uniq -c
# archived 3 / completed 26 / confirmed 679 / draft 300
for f in $(git ls-files 'docs/plans/PLAN-*.md'); do grep -q '^status: draft' $f && basename $f; done > drafts.txt

# 2. 廃止予定 15 件 (d と f の JSON)
cd docs/governance/candidates/v4-roadmap/migration
node -e "const d=require('./issue959-human-disposition-d-20261013.json'),f=require('./issue959-human-disposition-f-20261013.json');
 const r=[...d.records,...f.records].filter(x=>x.dispositionCandidate==='廃止予定'); console.log(r.length, r.map(x=>x.planId).join(' '))"

# 3. 画面カット PLAN の status と draft 判定
for id in L1-03 L2-01 L2-02 L2-03 L2-04 L3-06 L4-14 L5-09 L6-36 L7-96 L7-141 L7-204; do
  g=$(ls docs/plans | grep -E "^PLAN-$id-"); echo "$g $(grep -m1 '^status:' docs/plans/$g | cut -d' ' -f2)"; done

# 4. #977 の verdict 別件数
node -e "const j=require('./issue977-drift-judgments-20261013.json'); console.log(j.counts)"
# redesign 0 / red_green_fix 0 / design_follow 6 / hold 9 / retire_or_planned 25 / false_positive 25

# 5. 重なり (E1 と E2 の積。drafts.txt を使う)
grep -c -E 'PLAN-REVERSE-533' drafts.txt                         # 1

# 6. 処置の集計 (本書の表)
grep -E '^\| A5-C[0-9]+ ' <この文書> | grep -oE '\| (移管|例外|判断待ち) \|' | sort | uniq -c   # 表によって列数が違うので、処置の値で数える

# 7. 設計文書側の確認 (候補ごと。例)
grep -n 'mode_catalog_unmapped' docs/design/harness/L6-function-design/function-spec.md
grep -n 'SOURCES\|DEFAULT_SKILL_ROOTS' docs/design/harness/L6-function-design/function-spec.md src/assets/catalog.ts
git grep -n 'dependencies.requires' HEAD -- docs/design docs/governance/*.md docs/test-design
```
