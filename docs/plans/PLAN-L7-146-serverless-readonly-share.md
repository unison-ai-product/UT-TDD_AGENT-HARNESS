---
plan_id: PLAN-L7-146-serverless-readonly-share
title: "PLAN-L7-146 (impl): 中央UI を無料 serverless(Cloudflare) で read-only 共有 — L2 画面設計から降ろした 15 画面を全 project 横断で多人数閲覧。AI 編集なし・S5=b 維持・$0"
kind: impl
layer: L7
drive: fullstack
status: draft
version_target: future
created: 2026-06-24
updated: 2026-06-26
owner: PM (Opus) / PO (人間)
parent_design: docs/design/harness/L2-screen/screen-list.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
agent_slots:
  - role: se
    slot_label: "SE — Cloudflare Pages/Workers/D1 free deploy + GitHub webhook projection sync (read-only)"
  - role: tl
    slot_label: "TL — read-only/S5=b 不変・free-tier guardrail・escalation 不要のレビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-146-serverless-readonly-share.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L2-03-ui-element.md
  references:
    - docs/plans/PLAN-L7-141-web-dashboard-component-derived.md
    - docs/adr/ADR-005-distribution-model-and-central-ui.md
---

# PLAN-L7-146 (impl): 中央UI 無料 serverless read-only 共有

## 優先度: 後回し / deferred (PO 2026-06-26)

PO 決定 (2026-06-26): **中央UI (画面) は後回し**。先に **配布 (clean distribution channel) を別PCで使える状態に
する** ことを優先する (PO「UI は後回しで配布できるようにしたい」「UI は後程でいい」)。

- 本 PLAN は `status=draft` のまま **deferred** とする。破棄 (archived) **ではない** — UI は「後で」やる。
- 配布の active track = [[PLAN-L7-157-distribution-clean-pull]] (R2: 中央UI/画面 = L7-141/146 は配布物に
  **同梱しない** = 画面なしで配布。本 deferral と整合)。中央UI 本体の再実装も後回し
  ([[PLAN-L7-141-web-dashboard-component-derived]])。
- 再開条件: 配布チャネルが PO 承認・着地した後、PO 指示で本 PLAN を再開する。
- 非終端 (draft) のまま残るため `ut-tdd status` の outstanding には引き続き計上される (後回し = 完了ではない)。

## 0. なぜ (PO 決定 2026-06-24「無料で、AI 編集なしでいけない？」→「OK それでいこう」)

中央UI を **AI 編集なし = read-only の共有ダッシュボードに絞り、Cloudflare 無料枠で $0** 配信する。
これは確定原則 **S5=b**(UI は副作用 API を持たない)/ **S-01**(AI は CLI 経由のみ)/ **CC2**(人間主導)/
**ADR-005 D2**(UI から CLI 直接発動しない)を**一切変えない** = 要件改定も escalation も不要の、最も安全で安い入口。
PO 元来の狙い「全員で進捗・設計書を共有して見る」(ADR-005 D2 中央・全 project 横断)をフルに満たす。

## 1. L2 起点の descent (PO「L2 からな」、段階順を飛ばさない)

本 PLAN は新規発明でなく、**既に L2 で確定した画面設計を起点に descent** する ([[feedback_central_ui_kouteihyou_mission_not_coverage]])。

- **L2 (起点・G2 freeze 済)**: [screen-list](../design/harness/L2-screen/screen-list.md) 15 画面 / [screen-flow](../design/harness/L2-screen/screen-flow.md) / [ui-element](../design/harness/L2-screen/ui-element.md) §2 部品 / [wireframe](../design/harness/L2-screen/wireframe.md)。read-only + CLI コピーのみ (S5=b)、ID↔URL 1:1、30 秒ポーリング (S2=b)。
- **L4 FE 設計標準 (ui-standard ✓ 2026-06-24、PLAN-L4-14)**: [ui-standard](../design/harness/L4-basic-design/ui-standard.md) + [tokens.yaml](../design/harness/L4-basic-design/tokens.yaml)。component-derived 再利用 FE 設計標準 (部品/色)。`data`=DB 設計標準の FE 対応物 (document-system-map §1b)。
- **src/web 実装**: [PLAN-L7-141](./PLAN-L7-141-web-dashboard-component-derived.md)(component-derived 15 画面、read-only)。本 PLAN の `requires`。
- **L10 UX 磨き (impl 後)**: 実装済 UI を磨き WCAG 検証 (L2 の右腕ペア)。配信・実装の前提ではない。
- **本 PLAN (L7-146)**: その read-only UI を **無料 serverless で配信し全 project 横断・多人数で共有**する delivery 層 (ADR-005 D2 Phase B server sync を無料・read-only に具体化)。

> descent 順 (PLAN-L4-14 §3.3): `L2 画面設計(✓) → L4 FE 設計標準 ui-standard(✓) → L6 機能設計 → read-only src/web 実装(L7-141) → 無料 serverless 配信/共有(本 PLAN) → L10 UX 磨き(impl後)`。
> L2/L4 設計標準を飛ばして配信や実装に着手しない (L7-102 table-dumper 失敗の再発防止)。

## 2. Scope

### IN (本 PLAN)
- **配信**: Cloudflare **Pages**(静的 SPA、無料無制限) + **Workers Free**(API/read、10 万 req/日) で read-only UI をホスト。
- **projection 同期**: GitHub push → **webhook (HMAC 署名検証)** → Worker → projection を **D1/KV 無料枠**へ書込 (ADR-005 D2 Follow-up: 正本=各 project の git、中央は非正本 projection)。
- **共有/イベント同期**: 全 project 横断で全員が同一 projection を閲覧。鮮度同期は **30 秒ポーリング (S2=b)** + 定期 reconcile (cron full rebuild、取りこぼし安全網、ADR-005 D2 Follow-up)。WebSocket/Durable Objects は使わない(無料維持)。
- **閲覧アクセス制御**: ダッシュボード閲覧の最小認証 (例: Cloudflare Access、ADR-005 D2 Follow-up「ダッシュボード閲覧アクセス制御」)。
- **secret/PII 非投影**: projection に secret/PII/raw transcript を載せない (physical-data 既定を outward-facing で厳守、SECRET_PATTERN fail-close)。

### OUT (本 PLAN では作らない = 別 PLAN・別決定)
- **AI 編集 / フロント送信 / 副作用 API**: read-only を破る (S5=b 反転)。やらない。将来やるなら要件改定 + 承認ゲート + escalation の別 PLAN。
- **編集ジョブ用 serverless コンテナ (Containers/Sandbox)** と provider API 課金: AI 編集が無いので不要。
- **リアルタイム push (WebSocket/DO)**: 無料維持のため不採用 (必要時は $5 Paid の別 PLAN)。
- **src/web の 15 画面実装そのもの**: L7-141 の所掌 (本 PLAN は配信層)。

## 3. Acceptance Criteria

- 全 project 横断の **read-only ダッシュボードが多人数で共有**でき、各人が同一 projection を見る (ADR-005 D2)。
- **GitHub push → webhook(HMAC 検証) → projection 更新 → ≤ 30 秒ポーリング + 定期 reconcile** で鮮度が保たれる (S2=b / ADR-005 D2 Follow-up)。
- **read-only 不変**: UI に副作用 API・編集・CLI 直接実行が無い (S5=b / S-01 / CC2 / ADR-005 D2)。CLI 文字列コピーのみ。
- **コスト $0**: Cloudflare 無料枠 (Pages 無料 / Workers Free 10 万 req/日 / D1・KV 無料枠) 内で稼働。Paid($5)・provider API 課金を要しない。超過閾値を doc 化。
- secret/PII/raw transcript が projection に載らない (fail-close)。
- doctor / lint / vitest / plan lint green。review evidence を confirmed 前に記録。

## 4. Schedule

- mode: serial。
- Step 0 ✓: L2 画面設計 (G2 freeze) + L4 FE 設計標準 ui-standard (2026-06-24、PLAN-L4-14) の descent 確認 = 起点 (本 PLAN の前提、再設計しない)。
- Step 1: read-only src/web の component-derived 実装到達確認 ([PLAN-L7-141](./PLAN-L7-141-web-dashboard-component-derived.md))。未了なら L7-141 を先に進める (配信は実装の後)。
- Step 2: Cloudflare Pages(静的 SPA) + Workers Free(read API) の最小配信骨格。`workers.dev` で公開、独自ドメインは任意。
- Step 3: GitHub webhook(HMAC) → Worker → D1/KV projection 同期 + 定期 reconcile cron。secret 非投影を fail-close で配線。
- Step 4: 閲覧アクセス制御 (Cloudflare Access 等) + 30 秒ポーリングの多人数共有導通。
- Step 5: 検証 (multi-user read-only / 鮮度 ≤30s / free-tier 内 / S5=b 不変) → review → confirmed。

## 5. 壊さない / 再発させない

- **read-only 不変条件を保持**: S5=b / S-01 / CC2 / ADR-005 D2 を変えない。本 PLAN は配信層のみで、UI に書込/実行 API を一切足さない。足すなら別 PLAN + 要件改定 + escalation。
- **L2/L4 設計標準を飛ばさない**: 配信は `L2→L4 ui-standard→L6→実装 (L7-141)` の descent の下流。段階順違反 (L7-102) を再発させない。L10 (UX 磨き) は impl 後。
- **正本は git/GitHub**: 中央の D1/KV projection は非正本 (再構築可能)。生成物を正本化しない。
- **無料枠を超えたら明示**: 超過時 (req/日・DO/WebSocket・編集ジョブ追加) は $5 Paid または別 PLAN へ昇格を doc 化。silent に課金面へ踏み込まない。

## 6. review / 次工程

- review evidence (cross_agent / intra_runtime_subagent) を confirmed 前に記録 (PLAN claim 規律: $0・read-only 不変は free-tier 単価と S5=b 引用で substantiate)。
- 次: L7-141 (read-only UI) を実装 → 本 PLAN で配信。AI 編集/フロント送信が要件化されたら、本 read-only 共有を土台に承認ゲート付きの別 PLAN へ ([[project_central_ui_editable_front_direction]])。
