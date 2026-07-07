# A-182 実装・設計品質底上げ監査 (implementation & design quality audit)

- **date**: 2026-07-03
- **author**: Claude Fable 5 (orchestrator) + pmo-sonnet 4 レーン fan-out
- **PO 指示**: 「アップデート遺言書のほかに実装や設計自体の底上げをする HARNESS 戦略を v2 レベルでシステム監査をして提案」
- **A-181 との境界**: A-181 = 運用・持続性 (性能/劣化/粒度/宣言乖離)。本監査 = **成果物そのものの実質品質** — 実装アーキテクチャ (AQ) / テスト実質 (TQ) / 設計⇔実装対応 (DQ) / CLI・API surface (CX)。カタログ既存 8 レンズはいずれも運用系で、この 4 面は初監査。
- **基準点**: HEAD `a13a83d` (branch work/l10-l14-local-close)。Codex 未コミット差分 (src/cli.ts / src/lint/green-command-digest.ts / src/lint/review-evidence.ts / tests/green-command-digest.test.ts, PLAN-L7-303/309 作業) は不問。
- **手法**: 監査レンズカタログ §9 に従い 1 subagent = 1 レンズ × 4 並列 (pmo-sonnet, model=sonnet 明示) + オーケストレータ独自プローブ。各レーン最低 1 主張を裏取り (§4)。
- **戦略・起票案の正本**: `docs/governance/harness-v2-quality-uplift-strategy.md`

## §1 基線実測 (2026-07-03)

| 項目 | 実測値 | 測定コマンド |
|---|---|---|
| src/ 規模 | 188 ファイル / 47,877 行 | `git ls-files 'src/*.ts' \| xargs wc -l` |
| megafile (>800 行) | 4 本: cli.ts 2,878 / projection-writer.ts 2,703 / plan/lint.ts 953 / handover/index.ts 815 | 同上 sort |
| src/lint | 78 ファイル / 17,533 行 (最大モジュール) | `find src/lint -name "*.ts"` |
| cli.ts コマンド登録 | `.command(` 92 / `.action(` 61 | `grep -c` |
| tests/ | 136 ファイル / it 1,391 / expect 4,281 (密度 3.1) | `grep -rc` |
| 型安全 | `as any` 0 / `@ts-ignore` 0 / `: any` 1 | `grep -rn` |
| 暗黙 fail-open | `catch {` (エラー変数なし) **202 箇所** | `grep -rn "catch {" src` |
| frontmatter parser 私製実装 | **15 関数 / 12 ファイル** (schema/frontmatter.ts の zod SSoT と別に生 parse が散在) | `grep -rn "function .*[fF]rontmatter" src` |
| walkMarkdown 複製 | 5 関数 (src/lint 内) | `grep -rn "function walkMarkdown" src/lint` |
| process.cwd() 直参照 | 147 箇所 / 53 ファイル | `grep -rn` |
| PLAN 番号衝突 (新規発見) | **L7-325 が 2 本併存** (doctor-lint-gate-extraction / goal-workflow-binding) = 第 5 組 | `ls docs/plans/ \| grep L7-325` |

## §2 所見台帳

判定列: **未起票** = 新規 gap / **既存** = 既存 PLAN で解決予定 / **部分** = 残差あり / **棄却** = 裏取りで崩れた。

### LENS-AQ 実装アーキテクチャ (レーン報告 + orchestrator 補正)

| ID | 現象 (実測根拠) | 影響 | カバー判定 |
|---|---|---|---|
| AQ-1 | cli.ts megafile: 2,878 行 / 92 command / action 内に openHarnessDb→try/finally→出力の複製 18+ 箇所 | 毎 PLAN のコマンド追加が単一巨大ファイル集中編集。hybrid コンフリクト最大源 | **部分** (L7-223/229/284-286 で delegation/distribution/feedback 抽出済み。残り 80+ command の体系分割は未起票) |
| AQ-2 | walkMarkdown 5 重複製 (design-language/gate-confirm/l7-completion/placeholder-deps/readability、シグネチャ・isFile 確認有無が微妙に相違) + normalizedPath 4 重 (g8/g9/g10 が shared.ts 不使用) | 新 lint gate 実装時の参照迷子と Windows path 一貫性リスク | 未起票 |
| AQ-3 | cli.ts が lint を直 import (change-impact/green-command-digest/outstanding/review-evidence、cli.ts:51-54) — cli→doctor→lint の正規経路と直呼びが併存 | 後続エージェントの経路判断が分岐し続ける | 未起票 |
| AQ-4 | projection-writer.ts 2,703 行に DB 投影全量 + lint 6 モジュール直 import | 新 gate の投影追加ごとに巨大ファイル集中編集 (AQ-1 と並ぶ 2 大コンフリクト源) | 未起票 (L7-147 の検出器は在るが分割 PLAN なし) |
| AQ-5 | lint gate シグネチャ 3 世代混在 (analyze 69 / load 78 / Messages 65 で不揃い、Messages 無し gate 4 本) | 新 gate のカノニカル様式が不在。doctor 集計漏れの温床 | 未起票 |
| AQ-6 | `: any` 残存 1 件 (readability.ts) | 軽微 | 未起票 (XS) |
| AQ-7 | state-db→lint import は正方向 (逆流 0 確認) だが analyze 直呼びで gate 変更が state-db test に波及 | AQ-4 分割で自然緩和 | 部分 |
| AQ-8 | **frontmatter parser 私製 15 実装 / 12 ファイル** (orchestrator 実測。assets/graph/lint×8/plan/state-db×2 に `frontmatterValue`/`markdownFrontmatter`/`frontmatter` が copy-paste。CRLF 処理等の微差が各所に固定) | 1 箇所の parse バグ修正が他 11 ファイルに伝播しない。schema/frontmatter.ts (zod) と生 parse の 2 層が非対応 | 未起票 |
| AQ-9 | **`catch {` 202 箇所の暗黙 fail-open** (orchestrator 実測。上位: doctor/process-quality 17、graph/loader 15、plan-governance 14、cli 14。中身は `return null`/`continue`/既定値 — 意図的 fail-open が大半だが、fail-open 宣言コメントの有無が不統一で「設計」と「握りつぶし」が区別不能) | 実エラー (権限/破損) も「対象なし」に化ける absence-blindness のコード版。レーン報告の「空 catch 0 件」はこの実態を見落としており補正 | 未起票 |

### LENS-TQ テスト実質

| ID | 現象 | 影響 | カバー判定 |
|---|---|---|---|
| TQ-1 | oracle_id (`U-*`) 無し it() ~600/1,391。docs/test-design/ のオラクル定義から機械トレース不能 (missing-test-oracle-id feedback 671 件の実体) | テストが「何の仕様を検証しているか」を機械監査できない | **部分** (L7-274 mutation-oracle-hardening draft に含意。付与義務 lint は未起票) |
| TQ-2 | green-command-digest: 空 evidence_path/空 digest の entry を無言 skip (= pass)。tests/green-command-digest.test.ts:90 が「仕様」として固定 | フィールド空値で digest 検査をゼロコスト回避できる公式 bypass | 部分 (L7-303 進行中 — Codex 当該ファイル作業中のため是正提案は L7-303 完了後に接続) |
| TQ-3 | src/web/ 空 stub (意図的 backend-first) | なし (適正)。UI 着手 PLAN 時に test-design 先行を AC 化 | 既存方針どおり |
| TQ-4 | doctor サブモジュール (lint-gates/plan-governance/runtime-state/setup-smoke) の直接 unit test 不在 (barrel 経由のみ) | barrel 再構成時にカバレッジ喪失 | 未起票 (Codex の L7-325/326 doctor 抽出と同域 — 完了後に接続) |
| TQ-5 | cli-distribution-registrar.test.ts が toBeTruthy 主体 (コマンド削除・改名でも green) | 退行検出力ゼロの smoke | 未起票 (XS) |
| TQ+ | **強み (公平記録)**: expect 密度 3.19 / 実 repo 回帰テスト 52/136 / 主要 gate 3 本 (review-evidence, digest, tier-router) の mutation 反転で red 確認 / fake oracle の DI 外部化により実装ミラー 0 検出 | テスト実質は B+ — 規律は機能している | — |

### LENS-DQ 設計⇔実装対応

| ID | 現象 | 影響 | カバー判定 |
|---|---|---|---|
| DQ-1 | L5 module-decomposition.md:28 が lint を「5 file」と記述 (現物 78)。§6 も 5 lint 前提 | 後続が L5 を信じると新 lint の依存方針を誤る | 未起票 |
| DQ-2 | L6 機能設計 doc 不在モジュール 6: context/guardrail/graph/github/memory/secret (architecture §3.1 の行のみ)。guardrail/github は安全境界 | 設計根拠 2 行で安全境界実装を拡張する事故リスク | 未起票 (guardrail/github は PO エスカレーション対象) |
| DQ-3 | module-decomposition.md:29-30 が plan/vmodel lint を「stub」と記述 (現物 953/427 行完全実装) | 重複実装・矛盾レビューの誘発 | 未起票 (DQ-1 と同一 PLAN で可) |
| DQ-4 | 直近 confirmed PLAN 5 本 (L7-321/322/325/326 等) の references に docs/design/ が 0 件 | 設計 doc が実装判断の現役資料から外れる構造的断絶 | 部分 (L7-312 は鮮度のみ。設計 doc 参照義務 lint は未起票) |
| DQ-5 | test-design は 6 ファイルのみ (L6 設計 21 本 ↔ L7 unit-test-design 1 本の集合 pair)。対応表なし | L6 個別機能のテスト設計粒度が不可視 | 未起票 (個別 doc 化でなく対応表追記が最小対処) |
| DQ-6 | **強み**: L0 用語 10 語 ↔ src 識別子 全一致 (schema zod が anti-corruption として機能)。module-drift lint が L4 登録簿 ⊇ src 実在を機械保証 (orphan 0) | L4 レベルは健全 | — |
| DQ-7 | context モジュール: a13a83d で architecture 登録直後、L6 設計 doc 未作成 (DQ-2 の最新事例) | 最新実装の設計意図が 2 行のみ | 未起票 (L7-302 の add-design 子として最小) |

### LENS-CX CLI/API surface

| ID | 現象 | 影響 | カバー判定 |
|---|---|---|---|
| CX-1 | `--plan` フラグ二義性: task classify/route では「PLAN ファイル**パス**」、handover/advisor/skill suggest/codex では「PLAN **ID**」 | AI が `task route --plan PLAN-L7-xxx` と叩くと silent に無意味入力 | 未起票 (API 変更 = PO gate) |
| CX-2 | **doctor に --json なし** (cli.ts:470-498 実測。オプションは strict×2 + setup-smoke のみ。runDoctor 戻り値は構造化済みなのに CLI で捨てている) | 最頻用 health-check が正規表現パース強制。review --uncommitted は --json 可能で非対称 | 未起票 (追加のみ・非破壊) |
| CX-3 | **handover の exitCode 常時 0** (action 内に exitCode 設定なし、裏取り済) | CI/hook が成否判定不能 | 未起票 (1 行) |
| CX-4 | guard 系 exit code 2 (= blocked) が help/doc 未記載 | 1 (error) と 2 (blocked) の区別に実装読解が必要 | 未起票 (doc のみ) |
| CX-5 | `showSuggestionAfterError` 未設定 — 78+ コマンドで typo 時に suggest なし | AI の再試行ループ誘発 | 未起票 (1 行) |
| CX-6 | route eval のみ `--format json`、他は `--json` (route eval --json は無言で無視) | フラグ規約の分裂 | 未起票 (エイリアス追加で非破壊) |
| CX-7 | distribution の `--repo-dir` (ローカルパス) vs `--repo` (GitHub 名) 揺れ | 低〜中 | 未起票 (次期 distribution PLAN に同乗) |
| CX-8 | executeAdapterPlanForCli の stderr/exitCode 直書き (他モジュールは DI 徹底で良好) | 低 | **既存** (L7-284-286 で自然改善) |
| CX-9 | ~~task classify の canonical 経路乖離~~ | — | **棄却** (裏取り: cli.ts:2216 で top-level `task` 登録済み、`bun src/cli.ts task classify --text` 実走成功。レーンは route サブグループの task と混同) |

### 横断 (GR 系追加証跡)

- **GR-3 実証第 5 組**: PLAN-L7-325 番号衝突が本日も発生 (Codex doctor-lint-gate-extraction vs 既存 goal-workflow-binding)。番号一意性 fail-close (L7-256 scope d) の優先度を再実証。**本監査が起票を即時ファイル化しない運用理由でもある** (並行起票の衝突回避 → 戦略 doc §4)。

## §3 レーン別総合判定

| レンズ | 判定 | 一言 |
|---|---|---|
| AQ 実装アーキ | **B−** | 型安全と依存方向は優秀。megafile 2 本 (cli/projection-writer) と util 複製 (frontmatter 15/walkMarkdown 5) が draft 60 本消化の主リスク |
| TQ テスト実質 | **B+** | coverage≠substance 規律は主要 gate で機械実証済み。最大欠落は oracle_id トレース (~600 件) |
| DQ 設計対応 | **B** (L4 GREEN / L5 RED / L6 YELLOW) | L4 登録簿は機械保証で現役。L5 が凍結 stale、L6 は 6 モジュール空白、PLAN→設計 doc 参照が断絶 |
| CX CLI surface | **B−** | 大半のコマンドは --json/exit code 二層で AI 可読。doctor だけが機械不可読という最悪の非対称 + --plan 二義性 |

## §4 裏取り記録 (カタログ §1.3)

| レーン | 検証した主張 | 方法 | 結果 |
|---|---|---|---|
| AQ | walkMarkdown 5 複製 / megafile 行数 | grep / wc 再実測 | 確認。ただし「空 catch 0 件」は `catch {` 202 箇所の実態を見落とし → AQ-9 として orchestrator が補正 |
| TQ | 空 evidence skip テストの存在 | HEAD の tests/green-command-digest.test.ts:90 | 確認 |
| DQ | module-decomposition「5 file」「stub」 | 当該 doc L28-30 直読 | 確認 |
| CX | doctor --json 無し / handover exitCode 無し / task classify 経路 | cli.ts 470-498, handover action, L2216 + 実走 | CX-2/CX-3 確認、**CX-9 棄却** |

## §5 未監査領域 (次回 A-18x 候補)

- src/state-db スキーマ設計品質 (テーブル正規化・index 設計) — 今回は結合度のみ
- runtime/ (agent-guard, work-guard) のコード品質 — A-178 で発火面は監査済み、実装面は未
- パフォーマンスのアルゴリズム起因 (L7-300 の計時分解後に意味を持つ)
