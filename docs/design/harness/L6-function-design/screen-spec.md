---
layer: L6
sub_doc: screen-spec
status: confirmed
parent_doc: docs/design/harness/L5-detailed-design/ui-detail.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l3_screen_functional: docs/design/harness/L3-functional/screen-functional.md
related_l5_ui_detail: docs/design/harness/L5-detailed-design/ui-detail.md
related_l4_ui_standard: docs/design/harness/L4-basic-design/ui-standard.md
plan: docs/plans/PLAN-L6-36-screen-spec-body.md
next_pair_freeze: L7
created: 2026-06-30
updated: 2026-06-30
---

# L6 画面機能仕様

本書は中央 UT-TDD dashboard の per-screen function-level UI behavior を定義する。L7 unit tests の L6 pair であり、L5 architecture より下位、implementation code より上位に保つ。

## 1. 共通機能契約

L6 contract marker: screen spec は L7 向けに deterministic signature、DbC pre/post condition、U-SCREEN oracle family を公開する。

```ts
type ScreenFunctionSpec<TQuery, TViewModel> = {
  screenId: string;
  parseQuery(input: URLSearchParams): TQuery;
  validateQuery(input: TQuery): ValidationResult;
  loadViewModel(input: { projectId: string; query: TQuery }): Promise<ViewState<TViewModel>>;
  handleEvent(event: ScreenEvent, state: TViewModel): ScreenEventResult;
};
```

contract signature:

| Signature | 契約 |
|---|---|
| `parseScreenQuery(input) => ScreenQuery` | URL parameter を typed query state へ parse する。 |
| `validateScreenQuery(query) => ValidationResult` | invalid query value を reject または normalize する。 |
| `loadScreenViewModel(projectId, query) => ViewState` | projection data を read し、1 つの L4 state を作る。 |
| `handleScreenEvent(event, state) => ScreenEventResult` | navigation/filter/expand/refresh/copy-only output を返す。 |

precondition:

- PM/HM/GD project-scoped route では `projectId` が存在する。
- `screenId` は登録済み 15 screen のいずれかに一致する。
- query parameter は文書化された enum value を使うか default へ normalize する。

postcondition:

- 返却される view state は loading、ok、empty、stale、error のいずれかにする。
- event は navigation、filter update、expansion、refresh request、clipboard text のいずれかを返す。
- shell、provider、workflow mutation、file write、gate approval を実行する event は存在しない。

invariant:

- DbC invariant: URL query state だけを durable UI state とする。
- DbC invariant: runtime telemetry claim は runtime provenance field を要求する。
- DbC invariant: command-producing event は clipboard text だけを返す。

## 2. 共通 Event

| Event | 入力 | 出力 | 検証 |
|---|---|---|---|
| `selectProject` | project id | route update | project id が non-empty |
| `selectLayer` | L0-L14 | query update | layer が既知 |
| `setFilter` | key/value | query update | key が screen adapter に属する |
| `sortTable` | column/direction | query update | column が current table に存在する |
| `openDetail` | stable row/node id | local expansion または route update | id が current view model に存在する |
| `copyCommand` | command template id | clipboard text result | template は render-only |
| `refreshProjection` | none | reload request | direct DB mutation なし |

## 3. 画面別 Spec

| Screen | Function | 入力 | Event | 検証と出力 |
|---|---|---|---|---|
| PM-01 | `renderProjectPortfolioDashboard` | projects、layer summaries、gate summaries、carry counts | select project、filter status、open layer | unknown layer/status filter は reject する。portfolio heatmap と next-action row を出力する。 |
| PM-02 | `renderProcessView` | project id、layer、phase、plan list、sub-doc list | select layer、open PLAN、open sub-doc | missing layer は current active layer へ normalize する。process detail と stale marker を出力する。 |
| PM-03 | `renderGateSummaryView` | project id、gate run list、evidence paths | filter gate、open evidence、copy remediation | unknown gate id は empty state を生成する。gate result card と remediation text を出力する。 |
| PM-04 | `renderTraceView` | trace nodes、trace edges、selected artifact | select node、filter missing edges、open artifact | selected node 欠落は graph-level view とする。trace graph と edge table を出力する。 |
| PM-05 | `renderHandoverView` | CURRENT handover、archive list、carry list | open carry、copy next-action、filter stale | CURRENT 欠落は archive fallback 付き empty state を生成する。current handover summary を出力する。 |
| PM-06 | `renderDesignDocumentViewer` | document path、markdown source、frontmatter、diagram blocks | select document、copy path、open source | path は approved docs root 内で解決する。rendered doc と source/frontmatter を出力する。 |
| HM-01 | `renderFeatureInventoryView` | FR registry、implementation status、PLAN links | filter FR、open evidence、sort table | unknown FR filter は無視する。dense FR table と evidence link を出力する。 |
| HM-02 | `renderCoverageHeatmapView` | coverage metrics、weak-point dimensions | select cell、filter dimension | cell id は存在する必要がある。heatmap と source metric detail を出力する。 |
| HM-03 | `renderRuntimeWiringView` | provider config、hooks、adapter graph、runtime errors | select node、copy diagnostic command | unknown node は selection を clear する。wiring graph と diagnostic evidence を出力する。 |
| HM-04 | `renderDatabaseBrowserView` | table metadata、row counts、indexes、projection provenance | select table、filter rows、sort columns | table name は既知である必要がある。schema、count、provenance sample を出力する。 |
| HM-05 | `renderAuditLogView` | hook events、model runs、review evidence、guard events | filter session、filter plan、open event | session/plan filter は optional とする。provenance badge 付き event stream を出力する。 |
| HM-06 | `renderRecoveryView` | forced stops、rollback/update guidance、resume checkpoints | select incident、copy recovery command | detail view では incident id が既知である必要がある。copy-only recovery command text を出力する。 |
| HM-07 | `renderDoctorResultsView` | doctor checks、severities、evidence paths | filter severity、open check、copy command | severity filter は既知である必要がある。grouped pass/fail/advisory row を出力する。 |
| HM-08 | `renderAiEffectLearningView` | model metrics、skill metrics、recipes、learning candidates | filter model、filter skill、open recipe | runtime metric は session/source field を要求する。projected metric は advisory と label する。 |
| GD-01 | `renderGuideDocsView` | guide index、ADR list、selected source | select guide、select ADR、copy link | path は approved guide/doc root 内で解決する。rendered guide と source metadata を出力する。 |

## 4. Validation Rule 検証規則

| Rule | 適用先 | 失敗時の挙動 |
|---|---|---|
| `knownScreenId` | all screen adapters | route registry への evidence path 付き not-found empty state へ route する |
| `knownProjectId` | all project routes | project selection empty state を表示する |
| `knownLayer` | PM-01、PM-02、PM-04 | current active layer へ normalize し warning badge を表示する |
| `knownStatus` | tables/heatmaps | invalid status filter を drop し unfiltered result を維持する |
| `safeDocPath` | PM-06、GD-01 | render を block し error state を表示する |
| `runtimeProvenanceRequired` | HM-05、HM-08 | session/source がない限り row を projected/advisory と label する |
| `copyOnlyCommand` | PM-03、HM-03、HM-06、HM-07 | clipboard 用 text だけを返す |

## 5. L7 Unit Test Target 対象

| Oracle | Unit target | 期待結果 |
|---|---|---|
| U-SCREEN-001 | `parseScreenQuery(input) => ScreenQuery` | missing/invalid query value を文書化済み default へ normalize する。 |
| U-SCREEN-002 | `validateScreenQuery(query) => ValidationResult` | unknown screen id、layer、status、unsafe path は deterministic validation error になる。 |
| U-SCREEN-003 | `handleScreenEvent(event, state) => ScreenEventResult` | event は navigation、filter、expand、refresh、copy result だけを返す。 |
| U-SCREEN-004 | `loadScreenViewModel(projectId, query) => ViewState` | loading、ok、empty、stale、error state を silent collapse せず保持する。 |
| U-SCREEN-005 | `classifyTelemetryProvenance(row) => TelemetryProvenance` | runtime source/session field がない runtime claim を reject する。 |
| U-SCREEN-006 | `buildRouteRegistry(screens) => RouteRegistry` | registry は 15 screen id だけを含み、duplicate path を持たない。 |

これらの U-SCREEN oracles は `screen-spec.md` の L7 unit contract である。
