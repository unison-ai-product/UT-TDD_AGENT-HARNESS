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
   (第 4 節の表)。後継が draft のままだと、「残った契約」の行き先が旧 PLAN と後継 draft の両方 (どちらも E1 / アーカイブ)
   になる。第 4 節で判断待ちにした理由の 1 つである。

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
| PLAN-DISCOVERY-03-skill-design | skill の PoC 工程。score 飽和 / category carry の discharge 先は PLAN-L6-37 |
| PLAN-DISCOVERY-04-process-workflows | PoC 工程。process の正本化は PLAN-REVERSE-01 へ移管済み |
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

A 区分 (`superseded-link-confirmed`) は 12 件で、#1078 は 11 件を部分 supersede と書いた。機械一次の `H:supersede-partial` は 10 件で、
それに T3 が見送った L7-102 を足すと 11 件になる。12 件目の `PLAN-L7-532-pack-publication-driver` は draft (E1) で、部分かどうかは確認していない。

後継 PLAN が引き取った範囲の確定は、#1078 の不足 1 (gate 契約改訂) と連動して未決である。**決まれば動く条件 = 範囲の確定方法の決定**
である。本書は 11 件を 1 件ずつ設計文書と照合していない。

| ID | 候補 (旧 PLAN) | 後継 PLAN (status) | 処置 | 行き先 | 根拠 |
|---|---|---|---|---|---|
| A5-C28 | PLAN-L6-72-forward-fsm-evidence-policy-contracts | PLAN-L6-89 (draft) | 判断待ち | 範囲確定後に設計文書へ | 一次インベントリ `confirmedSupersededBy`。後継が draft |
| A5-C29 | PLAN-L7-102-web-dashboard-phase-b | PLAN-L7-141 (draft、画面カット E4) | 判断待ち | 範囲確定後。画面ごと消えるなら例外へ移せる (推測) | T3 でも見送り。後継 L7-141 は #1084 group 13 の対象 |
| A5-C30 | PLAN-L7-139-codex-hook-adapter | PLAN-L7-668 (confirmed) | 判断待ち | 範囲確定後に設計文書へ | 同上。`architecture.md:188` が adapter の判定本体を既に記述 (残りの範囲は未照合) |
| A5-C31 | PLAN-L7-143-harness-db-warn-remediation | PLAN-L7-144 (confirmed) | 判断待ち | 範囲確定後に設計文書へ | 同上 |
| A5-C32 | PLAN-L7-465-cross-review-author-binding | PLAN-L7-517 (draft) | 判断待ち | 範囲確定後に設計文書へ | 同上。後継が draft |
| A5-C33 | PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze | PLAN-L7-742 (confirmed) | 判断待ち | 範囲確定後に設計文書へ | 同上。`release-channel-manifest.md:31` が `admitReleaseAggregate` を既に記述 (残りの範囲は未照合) |
| A5-C34 | PLAN-L7-494-release-promotion-rollback-gate | PLAN-L7-742 (confirmed) | 判断待ち | 範囲確定後に設計文書へ | 同上 |
| A5-C35 | PLAN-L7-512-project-scoped-memory-root | PLAN-L6-104 (draft) | 判断待ち | 範囲確定後に設計文書へ | 同上。後継が draft |
| A5-C36 | PLAN-L7-515-pack-remote-canary-publication | PLAN-L7-565 (draft) | 判断待ち | 範囲確定後に設計文書へ | 同上。後継が draft |
| A5-C37 | PLAN-L7-57-token-telemetry-tracker | PLAN-L6-789 (draft) | 判断待ち | A5-C07 と同時 (#789 の退役実行) | 同上。token の取得層と表示経路は存続する (`PLAN-L6-789` §3、設計側は function-spec.md:942 が「手動 `telemetry scan` の所有整理は別 slice」と書く) |
| A5-C38 | PLAN-L7-86-merged-plan-status-deliverable-scope | PLAN-L7-87 (confirmed) | 判断待ち | 範囲確定後に設計文書へ | 同上 |

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
| A5-C51 | PLAN-DISCOVERY-03-skill-design / PLAN-DISCOVERY-04-process-workflows | T3 見送り | 例外 | - (E2 に既出) | PoC 工程の履歴。discharge 先と移管先が E2 の表 (L6-37、REVERSE-01) に記録済み |

## 集計

名指しの候補 51 行 (A5-C01〜C51)。1 行が複数の PLAN を含むものがある (C08、C51)。件数は第 4 節の表を再現コマンド 6 で数えた値である。

| 処置 | 行数 | 行 ID |
|---|---|---|
| 移管 | 10 | C01, C02, C04, C05, C06, C11, C12, C13, C14, C26 |
| 例外 | 22 | C08, C09, C10, C15, C16, C17, C18, C19, C20, C22, C23, C24, C25, C27, C40, C43, C44, C47, C48, C49, C50, C51 |
| 判断待ち | 19 | C03, C07, C21, C28〜C39, C41, C42, C45, C46 |
| 合計 | 51 | |

読み方:

- 移管 10 行のうち、設計文書への追記で閉じるものは 8 行 (C01 / C04 / C05 / C06 / C11 / C12 / C13 / C14)。新規 Issue の起票が要るものは 2 行 (C02、C26)。C02 の Issue は defer の記録であり、配線の実施 (高影響境界、PO 承認が要る) とは別である。
- 判断待ち 19 行の内訳: 部分 supersede の範囲確定待ち 10 行 (C28〜C36、C38)、#789 の退役実行待ち 3 行 (C07 / C37 / C39。C37 は部分 supersede でもある)、#762 / #1083 の範囲確定待ち 2 行 (C41 / C42)、governance の改訂手続き 1 行 (C45)、移し先の決定 2 行 (C03 / C46)、#977 の所有照合 1 行 (C21)。10 + 3 + 2 + 1 + 2 + 1 = 19。
- 例外 22 行のうち 17 行は「設計文書に既に書かれていた」ものである。C44 は、PLAN 機構の規約として PLAN と共に退役させる文言である。C47〜C50 の 4 行は、T3 で照合が量的に終わらなかったが名指しの根拠が無いもので、リスク 1 として受け入れる。
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
