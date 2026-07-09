# HARNESS コンテキスト効率監査 (2026-07-09)

> **依頼**: PO `/goal` 指示 (2026-07-09)「HARNESSコンテキスト効率監査をしてレポートにまとめて改善点を挙げてくれ」。
> **監査主体**: Claude (Sonnet 5)、read-only 監査 (コード変更なし)。
> **対象**: UT-TDD Agent Harness が AI エージェント (Claude Code / Codex) のコンテキストへ情報を運ぶ全経路 —
> 静的指示ファイル (`CLAUDE.md` 系)、hook 出力 (SessionStart/PostToolUse/PreToolUse 等)、
> skill/agent 定義のロード、オンデマンド CLI (`ut-tdd status` / `doctor` 等) の出力量。
> **方法**: ソース読解 + 実測 (ファイルサイズ計測、`harness.db` への実クエリ実行、hook 実装の直接確認)。
> 推測ではなく実行結果を根拠とする ([[feedback_verification_principles]] 準拠、coverage ≠ substance)。
> **非対象**: Codex 側 (`AGENTS.md`) の実際の消費経路の実測、グローバル (`~/.claude/`) 環境の是正実行
> (PO 判断が必要な範囲は提案のみ、本監査では変更しない)。
>
> **訂正 (2026-07-09 追記)**: 初版執筆時に既存 `docs/plans/` を検索せず F1 を「新規提案」として
> 記載したが、PO 確認を受けて再検索した結果、**同趣旨の PLAN が既に 2 本存在**することが判明した
> (§2 F1 および §3 参照): `PLAN-L7-302-context-tiering` (2026-07-03 起票、A-181 監査由来、
> `status: draft` / `version_target: v2` で **一部 landed** — doc-router 部分のみ実装済み、canonical
> Read Order 改訂は PO ゲートで parked) と `PLAN-L7-324-memory-compaction-trigger`
> (同日起票、`status: draft` / `version_target: v2` で parked、Claude 自身の persistent memory
> 肥大対策であり本監査の対象とは別層)。F1 は「新規発見」ではなく **PLAN-L7-302 の既存スコープを
> 独立した実測で再確認したもの** と訂正する。F2〜F4 (feedback surface 多様性飢餓 / escalation cap
> 欠如 / グローバル agent 死重) には対応する既存 PLAN は見つからなかった。

## 0. 総括 (Executive Summary)

良い点 (既に機能している設計) が 4 件、改善余地のある検出事項が 6 件 (High 2 / Medium 2 / Low 2)。
最大の懸念は次の 2 点:

1. **統治文書「通常作業で読む」規定の合計量が ~404KB (8 ファイル)** — 個々のファイルは章立てが良く
   on-demand 参照に向くが、「通常作業で読む」という書きぶり自体が全文逐次読みを誘発しうる。
2. **SessionStart の takeover feedback surface に「多様性飢餓」がある** — 実測で、open な
   actionable 群のうち最大クラスタ (`unresolved-join`, 602 件) が **一度も** 表示されず、毎セッション
   同一クラスタ (`detector_route_candidate:spec-ir-invalid-subdoc`) だけが surface される。

いずれも「コンテキストを大量に食う」型ではなく「固定予算の使い方が非効率/偏っている」型の問題であり、
既存の cap 機構 (PLAN-L7-88 / PLAN-L7-366) 自体は正しく機能している点は強調しておく。

## 1. 強み — 既に機能している設計

### S1. PreToolUse / PostToolUse hook は pass 経路で 0 バイト出力

`Edit`/`Write`/`MultiEdit`/`Bash` は 1 セッションで数十〜数百回発火するため、ここに固定コストが
乗ると累積が大きい。実装を確認した結果、pass 経路はいずれも無出力:

- `.claude/hooks/agent-guard.ts:66` — `decision.message` は block/警告時のみ書く。
- `.claude/hooks/work-guard.ts:156` — `blocked` 時のみ `stderr` へ書く。
- `src/cli.ts:985` (`hook post-tool-use`) — 固定 1 行 `session-log: post-tool-use <id>` のみ。

高頻度 hook が「発火のたびに要約文を返す」設計になっていないため、累積コストは実質ゼロ。

### S2. SessionStart の feedback/memory surface は cap 済みで、実際のスケール増にも耐えている

`selectTakeoverFeedback` (既定 limit=10, `src/feedback/surface.ts:159`) と
`selectMemoryEntries` (limit=5, `src/cli.ts:447`) は件数上限 + breadcrumb (`+N more ...`) を持つ
(PLAN-L7-366)。実測で PLAN registry は 199 本 (PLAN-L7-88 時点、2026-06-22) → **659 本**
(本監査時点、`docs/plans/PLAN-*.md` 実カウント) と 3.3 倍に増え、open feedback も 10,000 件超に
増えているが、SessionStart 注入ブロックのサイズは増えていない (cap が機能している実証)。

### S3. handover summary の全 registry ダンプ fallback は cap 済み

`MAX_SUMMARY_PLANS = 12` (`src/handover/handover-constants.ts:9`, PLAN-L7-88) は現在も有効で、
`src/handover/index.ts:346` で使われている。scope fallback 時の「全 199 (→659) 本ダンプ」問題は
再発していない。

### S4. skill 注入パイプラインは最後まで「path のみ」で content を inline しない

`skills/` ディレクトリは約 50 ファイル・206KB あるが、注入経路を追うと:

- `src/skill-engine/recommend.ts` の `rankSkills`/`scoreSkill` は `automation_assets` テーブルの
  メタデータ (trigger/capability/category 等) だけでスコアリングし、ファイル本文は読まない。
- `buildSkillInjectionSet` (`recommend.ts:95-140`) が返すのは `skill_path` (パス文字列) のみ。
- 委譲プロンプト生成 `formatAdapterPrompt` (`src/runtime/adapter.ts:426-437`) も
  `required_paths`/`optional_paths` を `- required skill: <path>` の breadcrumb として列挙するだけで、
  ファイル内容を concat していない。

「関連する skill だけをロードする」(concept pillar 4) が実装レベルで一貫している。206KB の
skill 資産が自動的にどこかのプロンプトへ丸ごと注入される経路は確認できなかった。

## 2. 検出事項 (Findings)

### F1 [High] 統治文書「通常作業で読む」規定の合計量が ~404KB — 逐次読了を誘発しうる書きぶり

> **既存 PLAN との関係**: 本 finding は `PLAN-L7-302-context-tiering` (2026-07-03 起票、
> `status: draft` / `version_target: v2`、A-181 性能持続性監査由来) と同一の問題を指す。
> 同 PLAN は `CLAUDE.md` の Read Order 7 doc を計測し「4,492 行 / 394,039 文字 ≒ 11.3 万トークン
> (要求requirements_v1.2 + 概念concept_v3.1 で 90.7%)」と記録済みで、本監査の実測 (README.md 側の
> 8 doc リストで 413,615 バイト) と規模・結論とも整合する (対象リストが `CLAUDE.md` 版 7 doc と
> `governance/README.md` 版 8 doc でわずかに異なるが、同じ concept/requirements 2 ファイルが
> 9 割超を占める点は同一)。PLAN-L7-302 は doc-router (`src/context/doc-router.ts`) と
> `ut-tdd context suggest --task` を先行実装済みだが、**トークン縮小の実利が出る canonical Read
> Order 改訂そのもの (CLAUDE.md/.claude/CLAUDE.md/AGENTS.md 3 面同時更新) は「正本変更」ゆえ PO
> ゲートで parked** のまま。以下は独立監査としての実測記録であり、改善提案は新規起票でなく
> **PLAN-L7-302 の残スライスを進める根拠の補強**として読むこと。

**根拠 (実測)**:

`docs/governance/README.md` は「Claude Code、Codex、人間レビュアーは通常作業で以下を読む」として
8 ファイルを列挙する (`docs/governance/README.md:8-17`)。実測サイズ:

| ファイル | バイト数 |
|---|---|
| `ut-tdd-agent-harness-concept_v3.1.md` | 136,575 |
| `ut-tdd-agent-harness-requirements_v1.2.md` | 221,275 |
| `ADR-001-ut-tdd-harness-redesign-and-language.md` | 7,727 |
| `repository-structure.md` | 15,784 |
| `vmodel-upgrade-schedule.md` | 8,992 |
| `vmodel-activation-profiles.md` | 5,058 |
| `vmodel-document-catalog.md` | 5,848 |
| `vmodel-typed-spec-definitions.md` | 12,356 |
| **合計** | **413,615 バイト (≈ 404KB)** |

ルート `CLAUDE.md` の「Claude Code Read Order」も同種の 7 項目リストを持ち、上記のうち特に大きい
concept (136,575B) / requirements (221,275B) の 2 ファイルを含む。両リストとも「migration snapshot は
通常起動読みでない」「L3 roadmap は通常起動読みでない」という **明示的な on-demand 指定** を
他の資料には書いているが、concept / requirements の 2 大ファイルにはその指定がない — つまり
「読むな」ではなく「読め、ただし全文逐次でなく該当章だけ引け」という区別が書かれていない。

**緩和要因**: `requirements_v1.2.md` は §1〜§6+ の見出し構造が明確 (`## 1.1` 〜 `# §6` 等) で、
Grep や offset 指定 Read による部分参照に向いている。ドキュメント自体の再構成は不要。

**影響**: 「通常作業で読む」という文言のまま解釈すると、タスク開始前に ~404KB (日本語主体のため
概算 10-15 万トークン規模) をコンテキストへ持ち込む挙動を誘発しうる。1 セッションのコンテキスト予算の
大きな割合を、具体的なタスクに関係しない章まで含めて消費するリスクがある。

**改善提案**: `docs/governance/README.md` §「現行の正本」と `CLAUDE.md` の Read Order に、
既存の migration/L3-roadmap 注記と同じ形式で 1 行足す — 例:「該当章のみをキーワード検索/該当 §
指定で参照し、タスクに無関係な章まで含めて全文を毎回読み切ることを意図しない」。ドキュメント分割は
不要、注記の追加のみで対応可能な低コスト・高効果の修正。

**PLAN-L7-302 との差分**: 同 PLAN の本スコープは doc-router によるセクション索引 + tier 表記への
Read Order 全面改訂 (3 面同期、rule-drift 整合含む) で、トークン縮小の実利を機構として保証する
本格対応。本監査の提案 (注記 1 行の追加) はそれより小さく、PO ゲート判断が長引く場合の**低コストな
暫定緩和策**として PLAN-L7-302 の Step 1-3 着手前に先行させる余地がある、という位置づけで記載する
(PLAN-L7-302 を代替するものではない)。

### F2 [High] takeover feedback surface の「多様性飢餓」— 最大のアクショナブル群が恒久的に不可視

**根拠 (実測、本セッション中に production `harness.db` へ直接クエリして検証)**:

`selectTakeoverFeedback` (`src/feedback/surface.ts:155-259`) は次の順で処理する:

1. open feedback を全件収集し `(bucket, severity, feedback_event_id 辞書順)` でソート
   (`surface.ts:233-238`)。
2. **ソート後に `slice(0, limit)`** で上位 10 件だけ残す (`surface.ts:258`、既定 `limit=10`)。
3. その 10 件だけを `renderGroupedItems` で `(bucket, severity, signal_type)` 単位にグルーピングして
   表示する (`surface.ts:104-146`)。

つまり **グルーピングより先に絞り込みが起きる**。同一 `signal_type` が 10 件超あると、その 1 群だけで
予算を使い切り、他の群は一切表示されない。実際に本セッションでこの現象を確認した:

```
=== 実行時 SessionStart と同じ呼び出し (limit=10) ===
signal_type: すべて "detector_route_candidate:spec-ir-invalid-subdoc" (10/10)

=== 全 open actionable/gate 群 (limit を外して集計) ===
distinct signal_type = 11 種
unresolved-join: 602 件                              ← 最大群、一度も表示されない
detector_route_candidate:spec-ir-invalid-subdoc: 446 件  ← 毎回これだけが表示される
detector_route_candidate:spec-ir-orphan-relation: 199 件
missing-test-plan-id: 10 件
refactor_candidate:externalize-policy: 2 件
(以下 6 種、各 1-2 件)
```

`detector_route_candidate:spec-ir-invalid-subdoc` の `feedback_event_id` 接頭辞 (`detector-route-...`)
が `unresolved-join:...` より辞書順で先に来るため、severity/bucket が同列 (すべて `warn`/`actionable`)
の場合は常にこのクラスタが上位 10 件を占有する。severity/bucket に差がつくまで、`unresolved-join`
(602 件、実質最大の未解決問題群) はこの surface に **絶対に出現しない**。

**影響**: SessionStart の固定行数予算が、毎セッション同じ 1 種類の問題を繰り返し伝えるだけに
使われ、件数で 1.3 倍大きい別種の問題 (`unresolved-join`) が `ut-tdd feedback list --json` を
明示的に叩かない限り見えない。プロジェクト自身が課題視している「absence-blindness」
([[feedback_vmodel_and_descent]] 参照) の実例。

**改善提案**: `selectTakeoverFeedback` を「全 open 集合を先に `(bucket, severity, signal_type)` で
グルーピング → 上位 N **群** を breadcrumb 付きで返す」に変更する (slice と group の順序を入れ替える)。
これにより固定予算内で常に N 種類の異なる問題が surface され、同一クラスタによる独占を防げる。
PLAN-L7-137 (feedback surface taxonomy) / PLAN-L7-366 (今回と同じ surface.ts が対象) の続きとして
1 PLAN で対応可能な規模。

**補足 (`unresolved-join` の経緯)**: この signal type 自体は未知の新規問題ではない。
`PLAN-L7-144-warn-remediation-parity-and-join` (`status: confirmed`、2026-06-24) が
`checkResolvablePlanJoin` の false-positive を修正し、当時「unresolved-join 95→0」まで remediation
した実績がある。しかし本監査時点 (2026-07-09) では 602 件まで再増加している — PLAN registry が
199→659 本に増える過程で新規 PLAN が dangling join を再生産し、remediation ループが以後回っていない
可能性が高い (未確認、別途調査要)。F2 のバグにより **この再増加自体が SessionStart から見えなかった**
点が、absence-blindness の実害を裏付けている。

### F3 [Medium] attempt-escalation surface に上限キャップが無い (他の surface と非対称)

`renderEscalationSignals` (`src/runtime/attempt-escalation.ts:127-138`) は `signals` 全件を
`slice`/breadcrumb なしでそのまま出力する。同じ SessionStart 経路にある feedback surface
(PLAN-L7-366) や memory surface、handover summary (PLAN-L7-88) がいずれも上限+breadcrumb 方式を
採用しているのに対し、この surface だけ無制限。発火条件 (同一 subject への 3 回連続失敗、既定
`DEFAULT_ATTEMPT_THRESHOLD=3`) が比較的稀なため実害は現時点で小さいが、直前 session で多数の
subject が閾値を超えるケース (大規模な連続失敗) では無制限に行が伸びる。既存 cap 方針との
一貫性のため、同じ `capWithBreadcrumb` 相当の処理を適用するのが望ましい。

### F4 [Medium/Low] グローバル agent 定義 5 件 (fe-a11y/fe-component/fe-design/fe-style/fe-test) が
このリポジトリでは絶対に発火できないまま毎セッション注入される

**根拠**: `~/.claude/agents/` (グローバル、全プロジェクト共有) に 12 件の agent 定義があり、うち
`be-api`/`be-logic`/`code-reviewer`/`db-schema`/`devops-deploy`/`qa-test`/`security-audit` の 7 件は
本リポジトリ `.claude/agents/` にプロジェクト版が存在し (プロジェクト版が優先されると想定)、
残る `fe-a11y`/`fe-component`/`fe-design`/`fe-style`/`fe-test` の 5 件 (実測 15,572 バイト) は
プロジェクト版が無く、グローバル定義がそのまま毎セッションの利用可能 agent 一覧に載る (本セッションの
system-reminder でも実際に出現)。

しかし `.claude/CLAUDE.md` の agent-guard allowlist (19 件) にこの 5 件は含まれていない。
つまり **呼び出しても `agent-guard.ts` が exit 2 で必ず block する** agent 定義が、それでも
毎セッション ~15.6KB 分コンテキストへ載り続けている。

**影響**: 絶対量としては小さい (典型的な context window の 0.01 未満相当) が、この harness を使う
すべての Claude Code プロジェクトに横断的に乗る固定コストであり、対応先が本リポジトリでなく
`~/.claude/` (グローバル環境) 側にある。

**改善提案 (PO 判断が必要、本監査では実行しない)**: (a) 実際に FE 作業が動く際は
`.claude/CLAUDE.md` の allowlist に追加して活かす、(b) 使わないなら `~/.claude/agents/` から
移動/削除してグローバルの固定コストを下げる。いずれも repo 外の判断のため提案のみ記載する。

### F5 [Low, 確認事項・対応不要] `CLAUDE.md` / `.claude/CLAUDE.md` の意図的な重複は小さく監視下にある

`CLAUDE.md` (12,987B) と `.claude/CLAUDE.md` (8,235B) は毎セッション無条件ロードされる
(合計 ~21KB)。両ファイルに「UT-TDD Adapter Rule Markers」節が重複して存在するが、これは
「Codex/Claude アダプタの drift を機械検査するため」の意図的な設計であり (両ファイルの当該節に
明記あり)、`rule-drift` lint で同期を保証している。重複分は 1 ファイルあたり 300-400 バイト程度
(結合サイズの ~2%) で、drift 防止という利益に対して十分小さい。**対応不要、現状維持を推奨**。

### F6 [Low, 隣接論点] `ut-tdd doctor` は実行に約 2 分 48 秒、出力 ~14.5KB (129 行)

厳密には「コンテキストへの自動注入」ではなく on-demand 実行だが、エージェントがタスク中に
`ut-tdd doctor` を叩くと待ち時間が発生する点を付記する。実測: `real 2m47.911s` に対し
`user 0m0.138s` / `sys 0m0.356s` — CPU 時間はごく小さく、I/O 待ちが大半を占めている。本リポジトリの
パスが `OneDrive\Desktop\UT-TDD-agent-harness` であることから、OneDrive のクラウド同期フィルタ
ドライバが多数のファイルアクセスに介入している可能性が高い (未確定の推測、追加検証が必要)。
出力サイズ自体 (14.5KB) は許容範囲内。エージェントの作業効率 (コンテキスト効率の隣接論点) として
記録するが、本監査の主題であるコンテキスト注入量の問題ではない。

## 3. 改善提案の優先順位

| # | 対応 | 対象ファイル | コスト | 効果 | 既存 PLAN |
|---|---|---|---|---|---|
| 1a | (暫定/低コスト) Read Order に「該当章のみ参照」注記を追加 | `docs/governance/README.md`, `CLAUDE.md` | 低 (文言追加のみ) | 中 (PO ゲート待ちの間の緩和) | `PLAN-L7-302` 着手前の暫定策として位置づけ |
| 1b | (本対応) canonical Read Order の tier 改訂 + doc-router 活性化 | `CLAUDE.md`, `.claude/CLAUDE.md`, `AGENTS.md`, `src/context/doc-router.ts` | 高 (正本変更、3 面同期、PO 承認必須) | 高 (基線 11.3 万トークン→1 万未満、PLAN-L7-302 DoD) | **`PLAN-L7-302-context-tiering` (draft/v2、既存)** |
| 2 | `selectTakeoverFeedback` を「先にグルーピング→上位 N 群」へ変更 | `src/feedback/surface.ts` | 中 (ロジック変更+テスト) | 高 (absence-blindness の実例を解消、602 件クラスタを可視化) | 無し (新規、PLAN-L7-137/366 の系譜) |
| 3 | `renderEscalationSignals` に既存 cap 方式と同等の上限+breadcrumb を追加 | `src/runtime/attempt-escalation.ts` | 低 | 中 (一貫性、将来の無制限伸長を防止) | 無し (新規) |
| 4 | グローバル agent 定義の allowlist 整合 (使うなら allowlist 追加、使わないなら退避) | `~/.claude/agents/` (repo 外、PO 判断) | 低 | 低〜中 (~15.6KB/セッション、複数プロジェクト横断) | 無し (新規) |

**訂正**: #1 は当初「新規提案」として記載したが、`PLAN-L7-302-context-tiering` (2026-07-03 起票、
draft/v2 parked、一部 landed) が本体対応として既に存在するため 1a (暫定策)/1b (PLAN-L7-302 本体)
に分割した。#2・#3・#4 は既存 PLAN 検索の結果、対応する PLAN が見つからなかった新規事項。
新規 PLAN として起票する場合は #2 は `PLAN-L7-137`/`PLAN-L7-366` を、#1a は `PLAN-L7-302` を
`dependencies.requires`/`references` に張ることを推奨する (起票自体は本監査の範囲外、PO 判断待ち)。
関連: `PLAN-L7-324-memory-compaction-trigger` (draft/v2 parked) は Claude 自身の persistent memory
(`~/.claude/projects/.../memory/`) 肥大対策で、本監査が扱った harness.db 側の surface とは別層だが
「コンテキスト管理」という括りでは同じ v2 backlog に属する。

## 4. 監査手法の記録 (再現性のため)

- ファイルサイズ: `wc -c` による実測 (Bash tool)。
- feedback 多様性飢餓の検証: `selectTakeoverFeedback`/`defaultHarnessDbPath`/`openHarnessDb` を
  実際に import し、本物の `.ut-tdd/harness.db` に対して `limit=10` (本番と同条件) と `limit=100000`
  (全件) の 2 条件で実行し、結果の `signal_type` 分布を比較。加えて `feedback_events` テーブルへ
  直接 `GROUP BY signal_type, severity` で集計し、severity 分布を確認。
- hook の pass 経路出力: `.claude/hooks/agent-guard.ts` / `work-guard.ts` / `src/cli.ts` の
  該当コマンド実装を直接読み、`stdout`/`stderr` への書き込み分岐を追跡。
- `ut-tdd status` / `ut-tdd doctor`: 実行して `wc -lc` で出力量を測定、`time` でウォールクロックと
  CPU 時間を分離計測。
