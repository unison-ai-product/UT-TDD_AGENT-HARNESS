---
layer: L2
sub_doc: screen-list
status: confirmed
artifact_role: supplemental_screen_detail
parent_doc: docs/design/harness/L1-requirements/screen-requirements.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
related_docs:
  - docs/design/harness/L2-screen/screen-list.md
  - docs/design/harness/L2-screen/screen-flow.md
  - docs/design/harness/L2-screen/ui-element.md
  - docs/design/harness/L2-screen/wireframe.md
pair_artifact: docs/test-design/harness/L10-ux-validation-test-design.md  # L2↔L10 pair (旧 hub 参照は RECOVERY-09 で撤去)
next_pair_freeze: L10
plan: docs/plans/PLAN-L2-01-screen-list.md
created: 2026-06-24
updated: 2026-06-24
---

# L2 画面詳細設計

本書は screen list、transition design、UI component catalog、low-fi wireframes の間をつなぐ。reviewer が「何を表示するか」「data はどこから来るか」「user は何をできるか」「error 時に何が起きるか」「どの upstream requirement を満たすか」を確認するための per-screen design sheet である。

正本の screen ID と URL は [screen-list.md](./screen-list.md) に置く。正本の transition edge は [screen-flow.md](./screen-flow.md) に置く。component 定義は [ui-element.md](./ui-element.md) に置く。layout sketch は [wireframe.md](./wireframe.md) に置く。

## 1. 詳細 sheet schema

すべての screen detail entry は以下の field を必ず扱う。

| Field | 必須 | 定義 |
|---|---:|---|
| Screen ID | yes | PM-01..PM-06、HM-01..HM-08、GD-01 のいずれか。 |
| Purpose | yes | screen が支える user decision または review task。 |
| Persona | yes | 主たる human user。AI runtime は UI を直接操作しない。 |
| Route | yes | `screen-list.md` の canonical URL。 |
| Inputs | yes | screen render に使う path param、query param、local state、file、DB projection、command output。 |
| Display Blocks | yes | 読み順に並ぶ主要 visual/data region。 |
| Controls | yes | read-only navigation、filter、expander、copy action、manual refresh。後続 requirement が明示許可しない限り direct mutation action は禁止する。 |
| Validation / Empty State | yes | data が missing、stale、invalid、partial projection のときに screen が表示する内容。 |
| Error State | yes | fail-close behavior、fallback rendering、next_action guidance を明示する。 |
| Security / Permission | yes | persona、scope、secret/PII を render するかどうか。 |
| State Persistence | yes | URL query、path、session、local client state、または none。 |
| Trace | yes | screen の根拠となる BR/UX/FR-L1 と L2 document。 |
| Test / Review Hook | yes | screen 実装済みを主張する前に期待される manual または automated check。 |

## 2. 共通ルール

| Rule | Requirement |
|---|---|
| Read-only UI | 将来の sign-off 済み requirement が mutation を追加しない限り、すべての screen は read-only とする。copy button は clipboard への書き込みだけ許可する。 |
| CLI execution | UI は copy 可能な CLI text を表示してよいが、`ut-tdd` command は実行しない。 |
| Unknown data | unknown、stale、not-yet-projected data は blank success ではなく明示 state とする。 |
| Trace links | plan、artifact、gate、document を表示する screen は、利用可能な場合 upstream/downstream trace link を公開する。 |
| Secrets | secret、token、local absolute personal path、private provider payload は render 前に redact する。 |
| Refresh | live state を表示する場所の default auto-refresh は 30 秒とする。manual refresh は display-only とする。 |
| Deep links | review context に影響する screen state は route または query parameter で共有できるようにする。 |

## 3. screen detail matrix の定義

| Screen | 目的 | 入力 | 表示 block | 操作 | empty / error state | trace / test hook |
|---|---|---|---|---|---|---|
| PM-01 Project Overview Dashboard | PO が project/layer progress を見て blocked gate を素早く検出できるようにする。 | project registry、plan digest、gate status、artifact progress projection。query `mode`、`phase`、`status`、`drive`、`tier`。 | hierarchy selector、L0-L14 heatmap、blocked item strip、polling status。 | filter、PM-02 への layer cell navigation、PM-03 への gate-fail navigation、current view URL copy。 | project registry が空なら setup guidance と `ut-tdd status` を表示する。gate failure は next_action 付き red とする。 | BR-01、BR-06、UX-02、FR-L1-01/08/13/20。heatmap count を projection row と照合する。 |
| PM-02 Layer View | reviewer が 1 つの project/layer と plan、carry、stale item、phase state を確認できるようにする。 | `:case`、`:L`、plan registry、carry list、stale detector output、scrum/additive mode field。 | layer summary、plan table、carry list、phase/status row、linked sub-doc list。 | plan row filter、selected gate の PM-03 open、design docs の PM-06 open、plan path copy。 | layer 欠落時は escaped path と PM-01 への return link を持つ 404 を表示する。 | BR-01/04、FR-L1-01/02/04/13/14/15/23/29。linked plan が存在するか missing marked であることを確認する。 |
| PM-03 Gate + Blocker View | PO/TL が gate pass/fail/bypass evidence を確認し、next action を決められるようにする。 | gate run record、review evidence、failing lint/test output、bypass record、generated next_action。 | gate result panel、evidence table、blocker table、next action card、CLI copy block。 | next_action/interrupt/resume command copy、HM-05 audit navigation、GD-01 troubleshooting navigation。 | evidence 欠落は fail-close とする。reviewer/signoff なし bypass は red とする。 | BR-02/05、UX-03、FR-L1-05/11/16/17/45。すべての fail に 1 つの next_action があることを確認する。 |
| PM-04 Trace View | reviewer が upstream/downstream coverage と V-pair status を確認できるようにする。 | trace graph、artifact registry、pair-freeze state、doctor trace output。 | graph、missing edge table、pair status table、trace detail drawer。 | plan/artifact/status filter、PM-06 doc preview open、HM-07 doctor detail open。 | mandatory trace edge 欠落は red とし、remediation guidance へ link する。 | BR-01/03/07、FR-L1-03/18。graph に orphan mandatory artifact がないことを確認する。 |
| PM-05 Handover View | 次 runtime が stale prose なしに正しい state から resume できるようにする。 | `.ut-tdd/handover/CURRENT.json`、handover archive、session digest summary。 | current handover card、next action、carry detail、stale warning、archive list。 | next_action から target screen へ navigation、handover summary copy、archive open。 | handover 欠落は failure ではなく warning とする。stale handover は generated_at と source を表示する。 | UX-03、FR-L1-01/31/42。stale threshold と next_action target を確認する。 |
| PM-06 Design Doc Viewer | PO/TL が harness UI を離れず canonical docs と trace を読めるようにする。 | doc catalog、markdown file、frontmatter、Mermaid/ASCII code block、trace key。 | doc tree、frontmatter panel、markdown preview、TOC、trace link。 | layer/status/drive filter、path copy、PM-04 trace open、internal doc link navigation。 | render できない Markdown は raw escaped text へ fallback する。doc 欠落は catalog error を表示する。 | BR-01/07、FR-L1-01/32。rendering が embedded script を実行しないことを確認する。 |
| HM-01 Feature List | operator が FR implementation status と関連 screen/plan を確認できるようにする。 | FR registry、implementation status projection、plan link、screen trace map。 | hierarchy selector、FR status table、plan link、screen link。 | status/priority/category filter、screen requirement の PM-06 open、visible row export。 | unknown FR status は warning とする。P0 の missing trace は red とする。 | BR-06、UX-02、FR-L1-33/35。P0 FR row が screen trace を持つことを確認する。 |
| HM-02 Coverage Heatmap | operator が perspective と axis ごとの弱い coverage を見つけられるようにする。 | coverage projection、review/audit result、missing artifact count。 | axis selector、8x5 heatmap、cell detail table、recommended task text。 | axis switch、HM-01 filtered list open、remediation prompt copy。 | metric source 欠落は source name 付き gray とする。low coverage は red とする。 | BR-06/22、FR-L1-33/34/35/46/47/48/49。cell total と row detail が一致することを確認する。 |
| HM-03 Wiring View | operator が static architecture と live failure wiring を確認できるようにする。 | hook state、provider state、routing config、mode/drive mapping、connection health。 | architecture diagram、connection table、mode transition arrow、failure overlay。 | connection select、runtime/hook/drive filter、diagnostic command copy。 | failed connection は red とし HM-05/HM-07 evidence へ link する。 | BR-03、FR-L1-07/08/40/42。direct UI execution path がないことを確認する。 |
| HM-04 DB View | operator が `.ut-tdd` state と projection consistency を確認できるようにする。 | SQLite projection、JSON state file、integrity check output。 | table explorer、row detail、integrity summary、orphan/drift list。 | table select、row filter、SQL/read command copy、trace row target open。 | corrupt DB または missing table は fail-close diagnostic を表示し、partial green を出さない。 | BR-05/07/20、FR-L1-06/07/51。row count と integrity summary が一致することを確認する。 |
| HM-05 Audit / Execution Log | operator が runtime action、model use、guard decision、review event を確認できるようにする。 | session log、audit file、guard decision、token/cost telemetry、skill injection record。 | invocation table、guard decision list、skill tab、hook fire tab、evidence link。 | runtime/result/date/role filter、audit path copy、related PM-03 gate open。 | log segment 欠落は segment ID 付き warning とする。guard block は明示する。 | BR-02/03/08、FR-L1-09/12/20。private payload redaction を確認する。 |
| HM-06 Recovery View | operator が recovery run、resume point、rollback guidance を確認できるようにする。 | recovery plan、incident record、handover state、audit trail。 | recovery log、resume point list、rollback copy block、current incident status。 | rollback/resume command copy、PM-03 gate open、HM-05 evidence open。 | safe rollback がない場合は generated destructive command ではなく human-escalation message を表示する。 | UX-03、FR-L1-10/16。destructive command が自動実行されないことを確認する。 |
| HM-07 Doctor Result View | operator が `ut-tdd doctor` の structure と severity を確認できるようにする。 | doctor JSON/text result、check catalog、last run metadata。 | result tree、severity summary、failed check detail、suggested command。 | severity filter、command copy、trace failure の PM-04 trace open。 | doctor unavailable は provider/runtime diagnostic 付き red とする。 | BR-03/05/07、FR-L1-02/11/18。severity mapping を確認する。 |
| HM-08 Learning / Effectiveness View | operator が model/skill effectiveness と feedback recipe を確認できるようにする。 | model metric、skill metric、feedback event、recipe registry。 | KPI card、model/skill table、recipe list、trend placeholder。 | model/skill/task filter、recipe prompt copy、GD-01 learning guide open。 | sample size 不足は warning を表示し ranking claim を隠す。 | BR-21、FR-L1-19/20。sample-size guard を確認する。 |
| GD-01 Guide / Docs | user が operational guidance、troubleshooting、onboarding、CLI reference を読めるようにする。 | guide markdown、category route、related doc link。 | side nav、markdown body、related link、search placeholder。 | category navigation、internal link、CLI snippet copy。 | unknown category は escaped 404 と guide index link を表示する。 | BR-08、UX-03、FR-L1-19/27/32/44。category path escaping を確認する。 |

## 4. screen detail coverage checklist の定義

screen 実装済みを主張する前に、review evidence は以下を必ず含める。

- route と screen ID が `screen-list.md` と一致する
- primary block が `ui-element.md` と一致する
- navigation edge が `screen-flow.md` と一致する
- visible layout に対応する `wireframe.md` section または承認済み L10 high-fi artifact がある
- 上記のすべての error/empty state に test、screenshot、または文書化された manual verification のいずれかがある
- CLI/governance gate を bypass する direct mutation path を含む screen がない

## 5. Carry

- L10 UX refinement では、この detail sheet を actual label、spacing、color contrast、screenshot evidence の high-fi review check に変換する。
- screen 実装開始時、L7/L8/L9 test design は `Test / Review Hook` column を参照する。
- doc catalog が L2 追加分を読むようになったら、PM-06 は本書を design doc tree に含める。
