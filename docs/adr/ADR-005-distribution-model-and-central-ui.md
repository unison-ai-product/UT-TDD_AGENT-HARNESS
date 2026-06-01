# ADR-005: 配布モデル (GitHub-pull) + Web UI 配置 (中央・全 project 横断)

- **Status**: accepted
- **Date**: 2026-06-01
- **Deciders**: PM (Opus) + PO (ユーザー)
- **関連**: `ADR-001` (TS 再実装) / [ADR-003](./ADR-003-runtime-adapter-boundary-subscription-cli.md) (runtime adapter 境界、IMP-031 Web サーバ境界) / [ADR-004](./ADR-004-internal-asset-ts-control-boundary.md) (内部資産 TS 制御境界) / `docs/governance/ut-tdd-agent-harness-concept_v3.1.md` §2.1.0 (ルール同一性) / `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md` (配布単位、本 ADR D1 で置換) / `docs/design/harness/L1-requirements/screen-requirements.md` (14 画面) / `docs/migration/helix-to-ut-tdd-cutover-strategy.md` / `../../ai-agent-harness-directory-reference.md` (PO 作成 参考、repo root 直下・正本外、3 層モデル)

## Context

2026-06-01 セッションで「L7-L14 工程定義 → 駆動モデル → ディレクトリ構成」を辿る中、**より上流の前提 = 「ハーネスをどう配布し、更新をどう享受し、Web UI をどこに置くか」が要件定義されていない**ことが判明 (PO 指摘)。この基盤未定義のため、ディレクトリ構成も工程/駆動モデルの置き場も決まらず収束しなかった。

確定済の周辺事実: extraction-plan は配布を「repo template / setup script」とだけ記述 (global 個人 workspace = HELIX 方式は否定)、ただし **global 中央 / npm / plugin / version-pin 更新は未定義**。screen-requirements に **14 画面 Web UI** (PM 案件横断 / HM harness 診断 / GD) が PO 承認済 (2026-05-28) だが backend 配置は未確定 (IMP-031 で将来境界として予告)。UT-TDD は **社内開発チーム配布パッケージ** (HELIX 単一ユーザー前提と対比)。

「ハーネスの単一真実 (指示/skill/agent/工程/駆動モデル定義 + TS engine) = リファレンス §④の `.ai/` の役割」であり、`CLAUDE.md`/`.claude/`/`AGENTS.md` は各ツールへ供給する **adapter**。

## Decision

### D1. 配布モデル = GitHub-pull (git dependency, tag-pin)

- ハーネス engine + ルール = **GitHub repo** (本 repo)。各 project は **git dependency** で消費 (`bun add github:<org>/ut-tdd-agent-harness#<tag>` 等)、`devDependencies` に **tag pin してコミット** = チーム共有 + 再現性。
- **更新享受** = tag を bump (`bun update`)。社内安全側は **tag pin + 定期 bump** を既定とし、即時全社反映が要る場合のみ branch track を例外採用。
- **public npm publish しない** (社内コード)。internal GitHub から直接 pull。
- **engine は tool 非依存 package** (Claude plugin に閉じ込めない)。CLI / CI (Layer B-remote) / Codex / 将来ツールが同一 engine を呼ぶ (ルール同一性 §2.1.0)。
- `ut-tdd setup` が各 project に adapter (`CLAUDE.md` / `.claude/` / `AGENTS.md`) を投影。単一真実 = package 内、project は投影を受ける。

### D2. Web UI = 中央・全 project 横断の管理ツール (team server)

- Web UI は **project-local でなく中央 (team server)**。**全員の GitHub project 群を data backbone として読み**、harness 工程の粒度で**詳細可視化**する (PLAN/gate 証跡 / V-model 4 artifact trace / 工程進捗 / harness 診断 / audit)。「GitHub native 可視化の harness 工程・詳細版」。
- 14 画面 (screen-requirements: PM-01〜05 案件横断 / HM-01〜08 harness 改善・診断 / GD-01) を **チーム全体・中央**へ昇格。PM-01 の既存「4 階層プルダウン×案件横断」がこの中央横断像と整合。
- **UI から CLI 直接発動しない**: CLI コマンドの copy 提供に留める (screen-requirements S5=b は Recovery/interrupt の CLI コマンドコピーに特化、本 ADR は UI 直接実行禁止を中央 UI 全体方針として採用)。
- backend 実装方式 (Bun HTTP server 等) と通信境界詳細は **L2 設計に carry** (ADR-003 IMP-031 の延長として設計)。本 ADR は「中央/team server・GitHub backbone」の**配置方針**を固定する。

### D3. プラグイン = 補助チャネル (主軸でない)

- Claude Code plugin (`.claude-plugin` marketplace、同 GitHub repo ホスト可) は **Claude 側の任意の追加配信レイヤ**。CI 不可・multi-tool 非対応のため**主軸にしない**。

## Rationale

- **CI が package を要求**: Layer B-remote (`.github/workflows`) は `ut-tdd` lint/doctor を回す最終防壁。CI は Claude plugin を使えず、tool 非依存 package (GitHub-pull) が必須。
- **社内最適**: GitHub-pull は public publish 不要・registry 構築不要で社内導入が最も楽 (PO 判断)。
- **チーム前提**: tag-pin コミットで「チーム共有 + 再現性 + 中央更新享受」を両立。HELIX 個人 global の divergence も repo-template の更新不能も解消。
- **中央 UI = チーム管理**: 全 project 横断の可視化は中央配置でしか成立しない。GitHub を backbone にすれば配布 (D1) と UI (D2) が同一 data source で閉じる。
- ADR-001 (TS package) / ADR-003 (provider 非 API・CLI adapter、IMP-031 Web 境界) と整合。

## Alternatives considered

| 案 | 判定 | 理由 |
|----|------|------|
| public npm publish | 却下 | 社内コードを公開不要。GitHub-pull で足りる |
| Claude plugin を配布主軸 | 却下 | CI 不可 + Claude 専用 (multi-tool 崩す)。補助チャネルに留める (D3) |
| repo-template コミット (extraction-plan §配布単位) | 却下 | 中央更新享受なし (PO 要望に反)。各 repo が diverge。extraction-plan の当該記述は本 ADR D1 で置換 |
| global 個人 workspace (HELIX 方式) | 却下 | 単一ユーザー前提。チームでルール diverge |
| Web UI を project-local | 却下 | 全 project 横断のチーム管理が成立しない |

## Consequences

- (+) チーム共有 + 再現性 + 中央更新享受 を同時達成。public publish 不要。
- (+) CI / multi-tool / Codex / 将来ツールが同一 engine を GitHub から取得。
- (+) 配布と Web UI が GitHub backbone で単一 data source 化。
- (−) private repo auth (gh token / SSH) が dev + CI で必要 (標準範囲)。
- (−) git dependency の build (dist 生成 or source 実行) を要設計。
- (−) 中央 Web UI server インフラ + local↔server 通信境界 (ADR-003 IMP-031、L2 設計)。

## Follow-ups

- **L1 技術要求**: 「配布 = GitHub-pull / 更新 channel = tag-pin bump」を technical sub-doc §1 に追記し L3 で FR 化。
- **screen-requirements 更新**: Web UI を「中央・全 project 横断 (team server)」と明示 (現状は project 文脈で記述)。
- **repository-structure.md / ディレクトリ構成要件**: 3 層 (① engine repo[GitHub-pull] / ② project 投影[adapter via setup] / ③ 中央 UI service) を反映。工程/駆動モデル定義の home (`docs/process/` 候補) と機能 home (`src/<domain>/`) を要件化。
- **HELIX cutover**: 本配布モデルは HELIX 個人 global の「作って差し替え」対象。cutover-strategy に沿って `.claude/CLAUDE.md` の helix CLI 導線を `ut-tdd` GitHub-pull 導線へ置換。
- **IMP-031 更新**: `ADR-003-runtime-adapter-boundary-subscription-cli.md` Follow-ups §IMP-031 (L52) に「Web サーバ配置方針は ADR-005 D2 を参照」を追記。
