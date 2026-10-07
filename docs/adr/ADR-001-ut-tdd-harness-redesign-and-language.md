# ADR-001: UT-TDD harness の再設計方針と実装言語 (core は TypeScript、管理知能は Python)

- **Status**: accepted
- **Date**: 2026-05-27 (最終更新 2026-10-07、改訂履歴は末尾)
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

v4 では、もう 1 つ言語の判断が必要になった。管理知能 (意味分類・チケット発行・工程の進行管理、#575) の実装言語である。管理知能は v4 で別プロセスとして置き (P1)、core とは型付きの JSON 境界だけでやり取りし (P2)、信頼の根にはしない (P3)。信頼の根は Assurance Kernel が担う。

## 決定

> **決定の更新 (2026-06-08, [ADR-007](ADR-007-harness-db-sqlite-projection.md))**: 本 ADR は当初 state を file-based (YAML/JSON) とし SQLite を「必要時 `better-sqlite3`」として deferral していた。その後 PLAN-L5-08 / A-105 で `.ut-tdd/harness.db` を **SQLite projection / フィードバック機構 (設計の柱3)** として採用 (deferral 解除)。本文 §1/§3・技術スタック表は ADR-007 の決定を反映済み (legacy DB schema 流用却下は不変)。決定史は ADR-007 を正本とする。

1. **再設計で進める (流用しない)**: source snapshot からは **設計概念のみ**を取り込み (v3.1/v1.2 に反映済み)、内部は `ut-tdd` として **全面再実装**する。legacy runtime commands・bash ディスパッチャ・legacy DB schema・個人絶対パスは持ち込まない。
2. **実装言語は TypeScript に統一**: core を **TypeScript (strict) / Node runtime** で実装し、**bash 層を廃止**。OS 入口は薄い `ut-tdd.ps1` (Windows) / `ut-tdd` (POSIX) が同一の compiled ESM core を呼ぶだけにする。Bunは新規依存・fallback・検出器runtimeとして禁止し、既存経路だけを期限付きmigration debtとして段階撤去する（Issue #152 / bootstrap envelope #153）。
3. **クロスプラットフォーム規約**: path は Node `path`、`.ut-tdd/` state は YAML + JSON + UT-TDD 独自の SQLite projection DB (`.ut-tdd/harness.db`) とし、core に bash を使わない、`.gitattributes` で改行正規化、subagent 起動は runtime adapter に隔離する。
4. **管理知能は Python で実装する** (PO 決定 2026-10-07、#588 6034909679 / 6035244583)。決定 2 の「TypeScript に統一」は core に適用する。core は Assurance Kernel・gate・CLI・hook・state の writer を含み、引き続き TypeScript / Node である。管理知能だけを Python とし、次の境界を守る。
   - **提案だけを出す**: 管理知能は record を直接書かない。書き込みは TypeScript の共通 writer が admission を経て行う。管理知能の出力は、Assurance Kernel が検証するまで有効にならない。
   - **境界 schema の正本は JSON Schema**: 言語をまたぐ契約は、言語中立の JSON Schema 1 本を正本にする (置き場は配置設計 #883 の `product/contracts/`)。TypeScript 側の zod / 型と Python 側の型は、そこから生成する。zod を正本にして JSON Schema を生成する案は採らない (理由は判断理由の節)。
   - **生成の採用条件**: JSON Schema の draft と使う keyword、生成器の版を固定する。Windows + Node 24 で再生成しても差分が出ないことを示す。生成した TypeScript 側と Python 側の検証が、同じ入力に同じ合否を出すことを試験で示す (欠落と null の区別、未知の field、union、数値の範囲、default、型の自動変換。Python 側は strict に検証する)。生成器が扱えない構文は、生成の時点で拒否する。
   - **鍵を持たない**: LLM の呼び出しは TypeScript 側の provider adapter を経由する。管理知能は API キーを持たない。
   - **無くても core は動く**: 管理知能は任意の companion として配る。無い環境では、core は手動の計画で動き、管理知能が要る機能は fail-close で縮退する。
   - **品質の条件**: Windows を第一級として CI マトリクスに入れる (path、長いパス名、子プロセス、cp932)。版と依存は lock とハッシュで完全に固定し、脆弱性の監査を入れる。lint と型検査は strict を必須にする。プロパティテストと mutation テストを最初から入れる。メモリと時間の上限、singleton lock を設ける。issue の本文などの外部テキストは、非信頼のデータとして扱う (外部監査 P-02、#588 5906948833)。

### 技術スタック

| 領域 | 採用 |
|------|------|
| 言語 / runtime | core: TypeScript (strict) / **Node 24.13.0**。管理知能: Python (版は管理知能の設計で固定する) |
| CLI framework | oclif または commander |
| **schema / enum / 契約** | core 内部は **zod を単一正本** (実行時検証 + 型推論。`VALID_LAYERS` / `RecommendedCommandV1` / `orchestration_mode` 等を 1 定義で型と検証を兼ねる)。言語をまたぐ境界は JSON Schema が正本で、zod と Python の型はそこから生成する (決定 4) |
| test | vitest |
| state | `yaml` + JSON + SQLite projection DB (`.ut-tdd/harness.db`; Node-compatible portを使用し、`bun:sqlite`を段階撤去) |
| 配布 | exact pinしたNode/npmとlock graphから生成するcompiled ESM + sealed build receipt |
| 入口 | 薄い `ut-tdd.ps1` / `ut-tdd` が compiled core を呼ぶ (core に bash 不使用) |

## 判断理由 (言語選定)

TypeScript と Python の技術差は本ツール (型付きルール/検証/ルーティングエンジン + CLI + 外部エージェント起動の orchestrator) において **僅差**と評価。流用ゼロのクリーン rebuild では Python の port 優位が無いため、判断軸ごとの傾きで決定した:

- **市場・エコシステム整合**: UT-TDD が住む **Claude Code / Codex / MCP 圏は TS 中心**。MCP の reference SDK は TypeScript で、Claude Code 本体・隣接 OSS (Cline / Continue 等) も TS/Node。将来の MCP server 化・hook/拡張統合や forkable 参照は TS が有利。
- **スキーマ堅牢性**: 本ツールの本質は enum + schema + gate の塊。**zod を単一正本**にすると **実行時検証とコンパイル時 exhaustive** を 1 本で得られ、要件定義書 §1.10 F が懸念する **enum drift を型で根絶**できる。学習しながらの実装でも品質が落ちにくい構造。
- **配布**: compiled ESMとreceiptを同一generationとして原子的に公開し、Windows/Linuxで同じentrypointを検証できる。
- **戦略的 diversification**: 保守者 (PO) の常用は Python。UT-TDD は CLI + schema + subprocess 中心で奇をてらわず、**TS 学習の題材として適切**。Python に寄り切らず agent-coding ツール領域の主要言語を実プロジェクトで押さえる狙い。
- **技術ペナルティ無し**: 上記により言語選択による技術的不利は無い。

### 管理知能を Python にする理由 (2026-10-07)

- 管理知能は、意味分類・計画・チケットの発行を担う。信頼の根ではなく、提案を出すだけの別プロセスである (P1〜P3)。言語が分かれても、ルール同一性 (concept §2.1.0) は崩れない。判定は TypeScript の Assurance Kernel に残るためである。
- 保守者 (PO) の主言語は Python である。上の「Python で実装」案の再評価条件 (チームの保守事情) に当たる。
- 境界の正本を JSON Schema にする理由 (advisor `gpt-6.1-sol`、2026-10-07): 現行の依存は `zod ^3.23.8` で、zod 4 の標準 JSON Schema 出力を前提にできない。refine / transform は、JSON Schema へ同値に変換できない。既存の内部 zod が多いことは、まだ 1 本も無い境界 schema を zod 正本にする根拠にならない。言語中立の正本なら、Python 側が TypeScript の実装表現に依存しない。zod 正本へ戻すのは、JSON Schema からの生成器が必要な契約を保持できず、境界用に制限した zod なら同値性と決定性を実証できる場合に限る。

## 検討した代替案

| 案 | 判定 | 理由 |
|----|------|------|
| legacy runtime commands をそのまま流用 | **却下** | bash 依存・個人パス・legacy DB schema を引きずり、governance (ut-tdd 単一正本 / クロスプラットフォーム) と矛盾 |
| Python で実装 (core) | **不採用 (僅差)** | port 優位が消えた状態では、市場/エコシステム整合 (MCP/Claude Code 圏) と単一バイナリ配布で TS が上回る。保守者の Python フルエンシーは利点だが、戦略的 diversification と ecosystem fit を優先。**チーム保守が Python 一択化する等あれば再評価**。管理知能だけは 2026-10-07 に Python を採用した (決定 4)。core は TypeScript のまま |
| Go 等 | 却下 | エコシステム不整合 (MCP/Claude Code 圏から外れる) |
| 管理知能の例外を別の ADR (ADR-010) に分ける | **却下** | 言語の決定を知るのに 2 本を読み合わせることになり、正本が 2 つになる (#648)。ADR は本文を更新し、経緯は PR と git の履歴で追う (PO 決定 2026-10-07、#588 6035244583) |

## 結果

- (+) `ut-tdd` TS core が**単一ルール正本**となり、Claude (`.claude/CLAUDE.md` + hook) / Codex (`AGENTS.md`) が同一 core を呼ぶ → concept §2.1.0 ルール同一性を満たす。
- (+) bash を core から排除 → Windows/Linux 同一動作 (環境差異最小)。
- (+) zod 単一正本で schema/enum の drift をコンパイル時に根絶 (§1.10 F 対応)。
- (+) exact lock、subject revision、compiled digestを封印したNode imageでWindows/Linuxの同一性を検証できる。MCP/Claude Code圏との将来統合も自然。
- (+) Bunを禁止する検出器自身もNode上で実行し、禁止対象runtimeへの循環依存を閉じられる。
- (−) Node parity成立まで既存Bun経路を即時削除できない。緩和: 新規Bun依存は即時禁止し、旧経路はinventoryと期限を持つmigration debtとしてのみ残す。
- (−) 保守者の主言語 (Python) と異なるため立ち上がり学習コスト。緩和: 題材が平易 (CLI/schema/subprocess) + TS strict/zod が学習者の誤りをコンパイル時に捕捉 + 表面積を小さく段階実装。
- (−) 管理知能の Python について、toolchain・CI マトリクス・依存監査を TypeScript 側とは別に持つ必要がある。緩和: 決定 4 の品質条件と、任意の companion としての配布 (無くても core は動く)。
- (−) v3.1/v1.2 の Python 前提記述 (§7.1 `python -m ut_tdd.cli` / §9.1 `src/ut_tdd/`+pytest 等) を TS 前提へ更新する必要 (本 ADR 採択に伴い実施)。

## 実装シーケンス (cutover W4-W6 に対応)

1. **配線 + モデル整備 → 機能定義** (v3.1/v1.2 で概念確定済): signal→mode routing / orchestration_mode / gate / checklist。
2. **core エンジン実装** (TS): `route` / `gate` / `vmodel` / `detect` / `plan lint` / `status` (runtime 検出: binary + probe + env)。zod schema を先に固める。
3. **runtime adapter + コマンド呼び方整備**: Claude subagent 起動 / Codex 呼び出しを adapter に隔離し、core は正規化 intent (reviewer/worker を呼べ) のみ発行。

## 後続対応

- 着手前に **tl-advisor (Codex、別 runtime) の adversarial cross-check** を実施する (governance §設計提案 / 本 repo は Codex CLI 検出済み)。
- 本 ADR は source cutover notes の「drive runtime 置換は最後」方針を、UT-TDD 独自実装 (TS) として具体化する。

## 改訂履歴

本文には常に最新の決定だけを書く。経緯は、下の PR と決定の記録で追う。

| 日付 | 変更 | 決定の記録 | PR |
|---|---|---|---|
| 2026-05-27 | 初版 (core は TypeScript / Node) | — | — |
| 2026-06-08 | state に SQLite projection を採用 (ADR-007) | ADR-007 | — |
| 2026-10-07 | 管理知能を Python とし、境界 schema の正本を JSON Schema とする (決定 4) | #588 6034909679 / 6035244583 | (本 PR) |
