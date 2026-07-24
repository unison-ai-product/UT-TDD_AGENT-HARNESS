# ADR-001: UT-TDD harness の再設計方針と実装言語 (TypeScript)

- **Status**: accepted
- **Date**: 2026-05-27
- **Deciders**: PM (Opus) + PO (ユーザー)
- **関連**: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md` / `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` / archived source cutover notes

## 背景

UT-TDD Agent Harness の実体実装に着手するにあたり、2 つの基盤判断が必要になった。

1. **legacy source の扱い**: 当初は legacy runtime command setをそのまま流用する案があった。しかし source snapshot から取り込みたいのは **設計概念のみ**であり (その概念は既に governance v3.1/v1.2 に吸い出し済み)、内部はチーム開発向けに **全面再実装**したい。
2. **実装言語**: 環境は Windows がメイン、VPS は Linux。環境差異を最小化したい。候補は Python と TypeScript (Node/Bun)。

制約・前提:

- legacy CLI dispatchers は **bash ディスパッチャ**で、これが Windows との環境差異・不安定 (path 変換 / CRLF / Codex `8009001d` sandbox 等) の主因。再設計の核心は bash 層の廃止。
- governance 2 マスト原則 (concept §2.1.0): ① ルール同一性 (Claude/Codex が同一 core を呼び同一判定) ② hybrid 機能分散。
- 流用ゼロのクリーン rebuild 前提のため、「既存 Python ロジックの port」優位は消える。

## 決定

> **決定の更新 (2026-06-08, [ADR-007](ADR-007-harness-db-sqlite-projection.md))**: 本 ADR は当初 state を file-based (YAML/JSON) とし SQLite を「必要時 `better-sqlite3`」として deferral していた。その後 PLAN-L5-08 / A-105 で `.ut-tdd/harness.db` を **SQLite projection / フィードバック機構 (設計の柱3)** として採用 (deferral 解除)。本文 §1/§3・技術スタック表は ADR-007 の決定を反映済み (legacy DB schema 流用却下は不変)。決定史は ADR-007 を正本とする。
>
> **決定更新 (2026-07-22, [ADR-009](ADR-009-resource-kernel-native-custody-companion.md))**: product domain、rule、policy、journalの正本はTypeScriptのまま維持し、target runtimeをNode、privileged OS custodyをRust companionとする。Bunは永久BAN（新規依存即時禁止）とし、既存Bun経路だけを期限付きmigration debtとして段階撤去する。配布は署名済platform bundleへ更新する。

1. **再設計で進める (流用しない)**: source snapshot からは **設計概念のみ**を取り込み (v3.1/v1.2 に反映済み)、内部は `ut-tdd` として **全面再実装**する。legacy runtime commands・bash ディスパッチャ・legacy DB schema・個人絶対パスは持ち込まない。
2. **domain/control planeはTypeScriptに統一**: target runtimeは**Node**、privileged Resource KernelはADR-009のRust companionとする。Bun新規依存は禁止し、既存Bunはcompatibility期限までのmigration debtとする。bash層は廃止し、薄いOS入口が同一control planeを呼ぶ。
3. **クロスプラットフォーム規約**: path は Node `path`、`.ut-tdd/` state は YAML + JSON + UT-TDD 独自の SQLite projection DB (`.ut-tdd/harness.db`) とし、core に bash を使わない、`.gitattributes` で改行正規化、subagent 起動は runtime adapter に隔離する。

### 技術スタック

| 領域 | 採用 |
|------|------|
| 言語 / runtime | TypeScript (strict) / **Node target runtime**。既存Bunは期限付きmigration debt、RustはOS custody companion限定 |
| CLI framework | oclif または commander |
| **schema / enum / 契約** | **zod を単一正本** (実行時検証 + 型推論。`VALID_LAYERS` / `RecommendedCommandV1` / `orchestration_mode` 等を 1 定義で型と検証を兼ねる) |
| test | vitest |
| state | `yaml` + JSON + SQLite projection DB (`.ut-tdd/harness.db`; Node-compatible SQLite portを使用し、`bun:sqlite`を段階撤去) |
| 配布 | TypeScript/Node control plane + target別Rust companionの署名済platform bundle |
| 入口 | 薄い `ut-tdd.ps1` / `ut-tdd` が compiled core を呼ぶ (core に bash 不使用) |

## 判断理由 (言語選定)

TypeScript と Python の技術差は本ツール (型付きルール/検証/ルーティングエンジン + CLI + 外部エージェント起動の orchestrator) において **僅差**と評価。流用ゼロのクリーン rebuild では Python の port 優位が無いため、判断軸ごとの傾きで決定した:

- **市場・エコシステム整合**: UT-TDD が住む **Claude Code / Codex / MCP 圏は TS 中心**。MCP の reference SDK は TypeScript で、Claude Code 本体・隣接 OSS (Cline / Continue 等) も TS/Node。将来の MCP server 化・hook/拡張統合や forkable 参照は TS が有利。
- **スキーマ堅牢性**: 本ツールの本質は enum + schema + gate の塊。**zod を単一正本**にすると **実行時検証とコンパイル時 exhaustive** を 1 本で得られ、要件定義書 §1.10 F が懸念する **enum drift を型で根絶**できる。学習しながらの実装でも品質が落ちにくい構造。
- **配布**: target別の署名済platform bundleでNode control planeとRust companionのrevisionを一体化する。
- **戦略的 diversification**: 保守者 (PO) の常用は Python。UT-TDD は CLI + schema + subprocess 中心で奇をてらわず、**TS 学習の題材として適切**。Python に寄り切らず agent-coding ツール領域の主要言語を実プロジェクトで押さえる狙い。
- **技術ペナルティ無し**: 上記により言語選択による技術的不利は無い。

## 検討した代替案

| 案 | 判定 | 理由 |
|----|------|------|
| legacy runtime commands をそのまま流用 | **却下** | bash 依存・個人パス・legacy DB schema を引きずり、governance (ut-tdd 単一正本 / クロスプラットフォーム) と矛盾 |
| Python で実装 | **不採用 (僅差)** | port 優位が消えた状態では、市場/エコシステム整合 (MCP/Claude Code 圏) と単一バイナリ配布で TS が上回る。保守者の Python フルエンシーは利点だが、戦略的 diversification と ecosystem fit を優先。**チーム保守が Python 一択化する等あれば再評価** |
| Go 等 | 却下 | エコシステム不整合 (MCP/Claude Code 圏から外れる) |

## 結果

- (+) `ut-tdd` TS core が**単一ルール正本**となり、Claude (`.claude/CLAUDE.md` + hook) / Codex (`AGENTS.md`) が同一 core を呼ぶ → concept §2.1.0 ルール同一性を満たす。
- (+) bash を core から排除 → Windows/Linux 同一動作 (環境差異最小)。
- (+) zod 単一正本で schema/enum の drift をコンパイル時に根絶 (§1.10 F 対応)。
- (+) 署名済platform bundleでcontrol plane/native custodyの完全revisionを固定できる。MCP/Claude Code圏との将来統合もTypeScriptのまま維持する。

### Bun migration debt（ADR-009で更新）

- **即時禁止**: 2026-07-22以降の新規Bun依存・専用API・production/runtime/test経路追加。
- **互換期限**: 最初のproduction Resource Kernel bundle切替時。延長は新ADRとPO採択を必須とする。
- **撤去順**: Node parity oracleをRed→Green固定してからproduction、runtime adapter、test/CI、lockfile/toolingを段階撤去する。現CIを保つ既存Bun経路を先に消してGreenを偽装しない。
- **exit**: Bun不在clean install、doctor、Windows/Linux L7-L9、aggregate CI、Pack acceptanceがGreen、tracked Bun実行依存0、migration debt/compatibility code/例外を同時close。
- (−) 保守者の主言語 (Python) と異なるため立ち上がり学習コスト。緩和: 題材が平易 (CLI/schema/subprocess) + TS strict/zod が学習者の誤りをコンパイル時に捕捉 + 表面積を小さく段階実装。
- (−) v3.1/v1.2 の Python 前提記述 (§7.1 `python -m ut_tdd.cli` / §9.1 `src/ut_tdd/`+pytest 等) を TS 前提へ更新する必要 (本 ADR 採択に伴い実施)。

## 実装シーケンス (cutover W4-W6 に対応)

1. **配線 + モデル整備 → 機能定義** (v3.1/v1.2 で概念確定済): signal→mode routing / orchestration_mode / gate / checklist。
2. **core エンジン実装** (TS): `route` / `gate` / `vmodel` / `detect` / `plan lint` / `status` (runtime 検出: binary + probe + env)。zod schema を先に固める。
3. **runtime adapter + コマンド呼び方整備**: Claude subagent 起動 / Codex 呼び出しを adapter に隔離し、core は正規化 intent (reviewer/worker を呼べ) のみ発行。

## 後続対応

- 着手前に **tl-advisor (Codex、別 runtime) の adversarial cross-check** を実施する (governance §設計提案 / 本 repo は Codex CLI 検出済み)。
- 本 ADR は source cutover notes の「drive runtime 置換は最後」方針を、UT-TDD 独自実装 (TS) として具体化する。
