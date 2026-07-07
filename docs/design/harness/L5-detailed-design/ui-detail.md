---
layer: L5
sub_doc: ui-detail
status: confirmed
parent_doc: docs/design/harness/L4-basic-design/ui-standard.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
related_l3_screen_functional: docs/design/harness/L3-functional/screen-functional.md
related_l4_ui_standard: docs/design/harness/L4-basic-design/ui-standard.md
related_l2_ui_element: docs/design/harness/L2-screen/ui-element.md
plan: docs/plans/PLAN-L5-09-ui-detail-body.md
next_pair_freeze: L8
created: 2026-06-30
updated: 2026-06-30
---

# L5 UI 詳細設計

本書は中央 UT-TDD dashboard の frontend internal design を定義する。L3 screen-functional requirements と L4 UI standards を、再利用可能な UI modules、state boundaries、routing contracts、integration points へ落とし込む。

## 1. Architecture 構成

| Module | 責務 | 契約 |
|---|---|---|
| `AppShell` | global navigation、project selector、status strip、content outlet。 | current route と project context を受け取り、harness state は mutate しない。 |
| `RouteRegistry` | PM-01..GD-01 の screen id を route path、label、breadcrumb、loader key へ map する。 | 1 つの screen id は必ず 1 つの route definition だけを持つ。 |
| `QueryState` | filter、selected layer、status、detail id を URL query parameter へ encode する。 | URL を durable UI state とし、local component state は transient に限る。 |
| `DataProvider` | local API/file-backed source から prepared projection を読む。 | loading、ok、empty、stale、error の typed result state を返す。 |
| `EvidenceLink` | artifact、PLAN、gate、DB row、command evidence link を normalize する。 | source path または stable id を常に表示し、hidden evidence を作らない。 |
| `CopyButton` | CLI-ready text または prompt を clipboard へ copy する。 | copy-only とし、shell、provider、file write execution は行わない。 |
| `TableView` | sort/filter/detail expansion 付きの dense tabular projection display。 | L4 ui-standard の row height と state を維持する。 |
| `GraphView` | trace、wiring、dependency visualization。 | text fallback と source edge list を提供する。 |
| `MarkdownViewer` | design docs、ADR、guide page を render する。 | sanitized rendering とし、frontmatter と source path を表示し続ける。 |
| `TelemetryBadge` | runtime、projected、advisory、stale、unknown provenance を示す。 | runtime claim は count presence だけでなく session/source evidence を要求する。 |

## 2. State 管理

| State class | 所有者 | 永続化 | 備考 |
|---|---|---|---|
| Project selection | `AppShell` + URL | URL query | shareable view に必要。 |
| Screen route | router | URL path | PM/HM/GD screen id を route へ map する。 |
| Filters and sort | `QueryState` | URL query | reload と copy-paste 後も維持する。 |
| Expanded rows | screen component | in-memory | reload で reset してよい。 |
| Data loading result | `DataProvider` | in-memory | loading、ok、empty、stale、error の 5 state model を使う。 |
| Clipboard result | `CopyButton` | in-memory | success/failure だけを表示し、永続化しない。 |

UI state を harness workflow state の source of truth にしてはならない。UI は repository artifact、local DB projection、command output を写すだけにする。

## 3. Routing 設計

route は stable で screen-id と整合する。

| 区分 | Route pattern | 画面 |
|---|---|---|
| Project management | `/project/:projectId/pm/:screenId` | PM-01..PM-06 |
| Harness management | `/project/:projectId/hm/:screenId` | HM-01..HM-08 |
| Guide/docs | `/project/:projectId/gd/:screenId` | GD-01 |

deep link は、該当する場合 `layer`、`plan`、`artifact`、`gate`、`table`、`session`、`status` query parameter を保持する。

## 4. Data Flow 設計

1. `RouteRegistry` と `QueryState` が route/query parameter を parse する。
2. screen adapter が `DataProvider` から 1 つの typed view model を要求する。
3. `DataProvider` が local projection または prepared command output を読み、provenance を label する。
4. screen が L4-compliant component を render する。
5. user interaction は URL state update、detail expansion、navigation、refresh、text copy のみを行う。

UI は CLI/domain rule を bypass してはならない。command が必要な場合、UI は browser 外で実行する `ut-tdd` または provider CLI 用の text を出すだけにする。

## 5. Screen Adapter Pattern 設計

各 screen は 1 つの adapter を持つ。

```ts
type ScreenAdapter<TQuery, TViewModel> = {
  screenId: string;
  parseQuery(input: URLSearchParams): TQuery;
  load(input: { projectId: string; query: TQuery }): Promise<ViewState<TViewModel>>;
  render(input: ViewState<TViewModel>): JSX.Element;
};
```

adapter rule:

- `parseQuery` は deterministic かつ side-effect free とする。
- `load` は configured `DataProvider` 経由でのみ read してよい。
- `render` は shell、provider、file-write action を trigger してはならない。
- data が non-empty の場合、すべての adapter は 1 つ以上の evidence source を公開する。

## 6. Integration Boundary 境界

| Boundary | 許可 | 禁止 |
|---|---|---|
| Local DB projection | table metadata、row summary、provenance field の read | schema mutation、ad hoc SQL write |
| Repository artifacts | Markdown/YAML/Mermaid source の read | artifact の edit、format、create |
| CLI commands | copy 可能な command text の render | UI からの command execution |
| AI provider state | captured telemetry と handoff text の表示 | Claude/Codex provider の直接起動 |
| Browser storage | transient UI preference のみ | source-of-truth workflow state |

## 7. Accessibility と Density

L4 `ui-standard` token を binding とする。

- tab、table、accordion、copy control の keyboard navigation
- WCAG 2.2 AA contrast を満たす focus-visible styling
- icon と text label による non-color status indicator
- operator が繰り返し使うための dense table layout
- diagram と graph node の text fallback

## 8. L8 Integration Test Target 対象

L8 pair は router、query state、data provider、component rendering の integration を検証する。

- route id が正しい screen adapter へ map される
- URL state が reload/share を通じて round-trip する
- data state が empty/stale/error/loading の間で一貫して render される
- copy control は text を生成し、command を実行しない
- provenance badge が runtime capture と projection/advisory row を区別する
- document viewer が evidence link を失わず Markdown/frontmatter/source path を render する
