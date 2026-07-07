---
layer: L3
sub_doc: screen-functional
status: confirmed
parent_doc: docs/design/harness/L2-screen/screen-list.md
pair_artifact: docs/test-design/harness/L12-acceptance-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l1_screen: docs/design/harness/L1-requirements/screen-requirements.md
related_l2_screen_list: docs/design/harness/L2-screen/screen-list.md
related_l2_ui_element: docs/design/harness/L2-screen/ui-element.md
plan: docs/plans/PLAN-L3-06-screen-functional-body.md
next_pair_freeze: L12
created: 2026-06-30
updated: 2026-06-30
---

# L3 画面機能要求

本書は中央 UT-TDD dashboard の L3 FE/UI functional layer である。L1 screen requirements と L2 screen/UI model を、screen-level functional requirements と acceptance criteria へ落とし込む。visual style、component internals、implementation code は定義しない。

## 1. Scope

product UI scope は L1/L2 で定義した 15 画面 central dashboard とする。

- PM: PM-01 through PM-06
- HM: HM-01 through HM-08
- GD: GD-01

すべての screen は read-only とする。UI は navigation、filter、sort、local projection refresh、detail expansion、CLI-ready text copy を行ってよい。ただし AI provider の実行、project state の mutate、gate approval、recovery start、file write は行わない。

## 2. 画面横断の機能不変条件

| ID | 要件 | 受入条件 |
|---|---|---|
| SF-RO | Read-only surface | Given 任意の screen が open、When user が primary control を click、Then 結果は navigation、filtering、expansion、refresh、copy-only text generation のいずれかになる。 |
| SF-CLI | CLI handoff | Given command-producing control を使用、When user が copy、Then UI は clipboard へ text を書き込み、command は実行しない。 |
| SF-STATE | URL state | Given filter、selected project、layer、status、screen tab が変更済み、When page を reload または share、Then 同じ view state が URL から復元される。 |
| SF-EVIDENCE | Evidence links | Given card、table row、graph node が harness state を summarize、When user が detail を open、Then underlying artifact path、PLAN id、gate id、DB projection source が visible になる。 |
| SF-EMPTY | Empty/error/loading | Given data set が empty、stale、failing、loading のいずれか、Then screen は L4 ui-standard の common five-state model を使い、理由を隠さない。 |
| SF-TRACE | V-model trace | Given screen が layer、gate、trace、review status を render、Then upstream/downstream artifact は explicit link で navigate 可能なままにする。 |

## 3. 画面別の機能要件

| 画面 | 機能 | 受入条件 |
|---|---|---|
| PM-01 Project Portfolio Dashboard | portfolio level で project x L0-L14 health、active carry、gate status を表示する。 | Given project data が存在、When dashboard が load、Then 各 project row は raw DB inspection を要求せず layer status、open carry、next action を公開する。 |
| PM-02 Process View | 1 project の workflow/deep-dive を active phase と sub-doc 横断で表示する。 | Given user が project/layer を選択、When PM-02 が open、Then screen は関連 PLAN、sub-doc、pair status、stale/blocked work を list する。 |
| PM-03 Gate & Summary View | gate result、evidence、generated next-action text を表示する。 | Given gate が pass/fail 済み、When gate row を open、Then status、evidence path、failure reason、copy 可能な remediation prompt が visible になる。 |
| PM-04 Trace View | four-artifact trace と V-pair consistency を表示する。 | Given PLAN、artifact、test、gate node が存在、When node を select、Then upstream/downstream trace edge を表示し、missing edge を highlight する。 |
| PM-05 Handover View | current handover state と carry continuity を表示する。 | Given handover state が存在、When PM-05 が load、Then current next action、stale age、carry list、archive reference が visible になる。 |
| PM-06 Design Document Viewer | L0-L14 design document を Markdown、YAML frontmatter、Mermaid、ASCII diagram 付きで render する。 | Given document path が selected、When PM-06 が render、Then frontmatter、heading、diagram、source link は inspect 可能なままにする。 |
| HM-01 Feature Inventory View | FR/feature implementation status を表示する。 | Given FR registry と implementation projection が存在、When HM-01 が load、Then status count、drilldown row、evidence link が visible になる。 |
| HM-02 Coverage Heatmap View | feature、test、telemetry、weak-point coverage を表示する。 | Given coverage projection が存在、When cell を select、Then screen は coverage source、status、unresolved gap を説明する。 |
| HM-03 Runtime Wiring View | static architecture と runtime error surface を表示する。 | Given runtime wiring data が存在、When HM-03 が load、Then provider、hook、adapter、failure boundary が visible になる。 |
| HM-04 Database Browser View | harness DB table health と projected row を表示する。 | Given DB metadata が存在、When table を select、Then column、row count、index、projection provenance を表示する。 |
| HM-05 Audit Log View | AI execution、guard、budget、skill evidence を表示する。 | Given hook/model/review telemetry が存在、When user が session または plan で filter、Then event と provenance class は visible のままにする。 |
| HM-06 Recovery View | forced-stop、rollback、resume guidance を表示する。 | Given recovery signal が存在、When HM-06 が open、Then user は direct execution ではなく copy 可能な CLI text と evidence reference を得る。 |
| HM-07 Doctor Results View | `ut-tdd doctor` check と remediation cue を表示する。 | Given doctor output が存在、When HM-07 が load、Then pass/fail/advisory group、evidence、next command text が visible になる。 |
| HM-08 AI Effect Data & Learning View | model、skill、recipe、learning-engine metric を表示する。 | Given telemetry が存在、When HM-08 が load、Then real runtime provenance は projected/advisory evidence と分離する。 |
| GD-01 Guide & Docs View | static knowledge、ADR、governance docs を表示する。 | Given guide または ADR が selected、When GD-01 が render、Then link、frontmatter、source path は visible のままにする。 |

## 4. 受入シナリオ群

### SF-GWT-01 読み取り専用コマンド引き渡し

Given ユーザーが HM-06 の復旧ガイダンスを見ている。
When ユーザーがコマンド操作部をクリックする。
Then UI は CLI コマンド文字列をコピーする。
And UI は復旧コマンドを実行しない。

### SF-GWT-02 証跡ドリルダウン

Given PM-03 が失敗中の gate を表示している。
When ユーザーが失敗中 gate の詳細を開く。
Then UI は gate id、source artifact、failure message、コピー可能な remediation prompt を表示する。

### SF-GWT-03 trace ナビゲーション

Given PM-04 が V-model trace node を表示している。
When ユーザーが node を選択する。
Then UI は upstream/downstream artifact link を表示する。
And 欠落した trace edge は passing edge と視覚的に分離される。

### SF-GWT-04 telemetry provenance の分離

Given HM-05 または HM-08 が test、skill、model、guard telemetry を表示している。
When data row が runtime capture ではなく projection から来ている。
Then provenance は projected/advisory と表示され、fired runtime evidence として扱わない。

## 5. 下流 contract

- L4 `ui-standard` は shared state、color、layout density、component、accessibility constraint を提供する。
- L5 `ui-detail` は state、routing、data loading、component decomposition を read-only command-handoff boundary 内に保つ。
- L6 `screen-spec` は §3 の各 row を item/event/validation/transition-level screen spec に変換する。
- L12 acceptance test は production release claim 前に、UI product surface に対して §4 の scenario family を exercise する。
