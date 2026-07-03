# A-181 - パフォーマンス持続性監査 (全体監査 v2 起票便) 2026-07-03

- **date**: 2026-07-03
- **scope**: PO /goal 指示「ハーネスシステム全体監査 → 最高パフォーマンスを発揮し続けるためのアップデート戦略 → アップデート駆動モデル (version-up) で v2 レベルの改善起票。後続モデル (Opus/Sonnet/Haiku/GPT) が実装で迷わない粒度必須」。
- **前提**: 2026-07-02 のアーキテクチャ全域監査 (A-172〜A-180、台帳 = A-175) は完了・全所見起票済み。本監査は重複せず「**性能の持続**」軸 — ①オーケストレータのコンテキスト/時間経済 ②劣化ベクトル (放置で腐る箇所) ③後続モデルの実装可能性 (draft PLAN 粒度) — を対象とする。
- **測定条件の注意**: 監査時点で Codex が並行リファクタ中 (cli.ts/doctor 抽出系、PLAN-L7-283/284/285 進行中)。doctor exit=1 と drive-db-registration stale は当該 in-flight 作業由来で本監査の所見ではない。tree 測定値は transient であり、基準点は HEAD + 本監査の意図成果物のみ。
- **method**: 3 レーン fan-out (pmo-sonnet ×3: コンテキスト経済 / PLAN 実装粒度 / 劣化ベクトル) + orchestrator 直接プローブ (bun:sqlite readonly、Stopwatch 計時)。主要主張は orchestrator が実ファイル/実データで裏取り済み (下記に検証注記)。

## §1 実測基線 (2026-07-03)

| 項目 | 実測値 | 測定コマンド |
|---|---|---|
| doctor 全走時間 | 86.8s (orchestrator 実測) / 63.2s (subagent 再測、初回 180s timeout) | `[Diagnostics.Stopwatch]` + `bun src/cli.ts doctor` |
| doctor 出力 | 115 行 / 11,830 文字 | `wc` |
| 起動必読 doc 合計 (CLAUDE.md ×2 + governance README + concept v3.1 + requirements v1.2 + extraction-plan + ADR-001) | 4,492 行 / 394,039 文字 ≒ **11.3 万トークン** | `wc -l` / `wc -c` (トークン ≒ 文字/3.5) |
| うち requirements v1.2 + concept v3.1 | 357,541 文字 (**90.7%**) | 同上 |
| harness.db | 57 テーブル / 43,410 行 / **60.9 MB** | bun:sqlite readonly 全テーブル COUNT |
| telemetry 上位 | hook_events 11,150 / feedback_events 6,298 / quality_signals 4,835 / skill_recommendations 2,405 / skill_invocations 1,955 | 同上 |
| feedback_events | **全行 status=open・severity=info** (skill_acceptance_rate 2,395 + skill_firing_rate 2,395 = 76%) | GROUP BY signal_type,status |
| SessionStart surface | open=5,452〜5,462 / actionable=0 / telemetry ≒ 100% | `bun src/cli.ts session start` 実出力 |
| model_runs | 634 行、cost_usd / input_tokens / output_tokens / cached_input_tokens / reasoning_tokens **全行 null** | SELECT (PRAGMA + 最新行確認) |
| 設計済み 0 行テーブル | test_results / diagram_artifacts / memory_entries / model_evaluations / tool_runs / verification_recommendations / retry_events / test_flake_events ほか計 11 | 全テーブル COUNT |
| plan_registry | 481 本 (confirmed 398 / draft 57 / completed 25 / archived 1)。status:draft の実ファイルは 60 本 | SELECT GROUP BY status + grep |
| green-command-digest | **199 件不一致 (86 PLAN)**、note (非ブロック) | doctor 出力 |
| improvement backlog | 146 entries / open 135 (observed 42 / triaged 22 / implemented 71) | doctor + `docs/improvement-backlog.md` |
| .ut-tdd/audit/ | 100 ファイル / 733 KB (直近 2 週で A-163〜A-180 の 18 本追加) | `Get-ChildItem` |
| .ut-tdd/logs/ | 3.3 MB | 同上 |
| skill_recommendations score | distinct 5 種のみ、1.0 が 62%・≥0.8 が 98.4% (rank 無差別) | GROUP BY score |
| drive_runs mode 別 | Add-feature 187 / Forward 114 / Reverse 105 / Incident 91 / Refactor 59 / Discovery 29 / Recovery 10 / Version-up 5 / Verification 2 | GROUP BY mode |

## §2 所見台帳

ID 系列: CE (context economy) / GR (granularity) / DV (decay vector)。「対応」列の PLAN-L7-30x は本監査の v2 起票 (§3)。

### 2.1 コンテキスト/時間経済 (CE)

| ID | 所見 | 実測根拠 | 既存カバー | 対応 |
|---|---|---|---|---|
| CE-1 | 起動必読 doc 11.3 万トークン、91% が requirements+concept の 2 本。毎セッション固定消費 | §1 | 無し (L7-236 は doc drift 修正で対象外) | **PLAN-L7-302** |
| CE-2 | doctor 全走 63〜87 秒。開発ループ 1 回に約 1 分課金 | §1 | doctor 分割 (L7-276/283、Codex 進行中) は構造分割であり実行性能は対象外 | **PLAN-L7-300** |
| CE-3 | SessionStart feedback surface の actionable=0 / telemetry≒100% (S/N ゼロ) | §1、`src/feedback/surface.ts` TELEMETRY_SIGNAL_TYPES | **PLAN-L7-246** (lifecycle + 流量化) が正面カバー | 既存 (起票なし) |
| CE-4 | skill_recommendations score 平坦 (distinct 5 種、上位同点 98.4%) | §1 | **PLAN-L7-277** が正面カバー (前提 L7-262 実装済) | 既存 (起票なし) |
| CE-5 | green-command-digest が毎 doctor 全 483 PLAN × evidence の sha256 を再計算 (キャッシュ無し) | `src/lint/green-command-digest.ts` 構造 | 無し | **PLAN-L7-300** (増分化) |
| CE-6 | docs/plans/ 483 本を doctor 内の 6〜8 check が独立に再走査 (loadReviewPlans 再利用なし) | `src/doctor/index.ts` collectDoctorChecks + grep 10 箇所 | 無し | **PLAN-L7-300** (一括 load 注入) |

### 2.2 draft PLAN 実装粒度 (GR) — 後続モデルの迷子リスク

精読 16 本 + frontmatter 全数 triage (レーン B)。模範例 = PLAN-L7-233 (A: 固定コマンドまで明記) / PLAN-RECOVERY-06 (A-)。

| ID | 系統欠陥 | 該当例 | 後続モデルの迷い方 | 対応 |
|---|---|---|---|---|
| GR-1 | 未決分岐の丸投げ (「方式/閾値/発火条件は TL/PO 判断」と slot だけ置き本文で未確定) | L4-15 (閾値ゼロヒント)、L4-16 (方式 A/B 未決)、L7-245、L7-253 (advisor 発火条件が候補のまま)、L7-269 (退役対象例ゼロ) | 恣意的に方式を「発明」するか無限停止するかの二択。L7-253 は製品仕様根幹の発明リスク | **PLAN-L7-304** |
| GR-2 | 束 PLAN (自己申告束 L7-242 の分割手順が 1 行 / 隠れ束 = 3-4 要件 1 DoD が B 評価群に多数) | L7-242、L7-239/240/244/246/253/256/277 | どれから着手するか・部分実装で commit してよいかが読めない | **PLAN-L7-305** |
| GR-3 | PLAN 番号衝突 (246/250/258/259 の 4 組併存) | 実在確認済み | 短縮参照の曖昧性 | 既存 **PLAN-L7-256** スコープ(d) が正面カバー (起票なし) |
| GR-4 | draft debt 32 本の本文が昇格義務 (kind=add-impl + Reverse pairing) と正本台帳へ **一切リンクしていない** (実読 16 本中 0 本。orchestrator が L7-232 で裏取り済) | ROUTE_MODE_KIND_DRAFT_DEBT_PLAN_IDS 全数 | lint fail の理由と直し方に辿り着けない | **PLAN-L7-309** |
| GR-5 | 行番号引用の stale 化 (精読 16 本中 12 本が `file.ts:NNN` 引用。Codex リファクタ進行中でズレ確実) | L4-15、L7-239/240/244/253/256/272 ほか | ずれた行を触る / 「見つからない」停止 | **PLAN-L7-309** |

### 2.3 劣化ベクトル (DV) — 放置で腐る箇所

分類: A=増え続ける / B=腐り続ける / C=例外固定。

| ID | 分類 | 項目 | 現在値 | 抑制機構 | 判定 | 対応 |
|---|---|---|---|---|---|---|
| DV-1 | A | harness.db telemetry 群 | 60.9 MB、上位 5 テーブルで 2.6 万行 | `src/state-db/maintenance.ts` は migration と row 数報告のみ。retention/prune **無し** | 機構なし | **PLAN-L7-301** |
| DV-2 | A | .ut-tdd/audit/ | 100 ファイル | **PLAN-L7-236** (draft) が受け皿 | 不十分 (draft 止まり) | 既存 (着手待ち) |
| DV-3 | A | .ut-tdd/logs/ jsonl | 3.3 MB | rotation 無し | 機構なし | **PLAN-L7-301** |
| DV-4 | A | docs/plans/ 482 本 (archive 1 のみ) | 週 5〜10 本ペース増 | archive 昇格機構なし | 機構なし | **PLAN-L7-308** |
| DV-5 | B | green-command-digest 不一致 199 件 | 再増殖中 | L7-132 (advisory 機構) / L7-194 (opt-in strict へ訂正済 + A-153 一回性 rerun-bound 是正)。**構造原因: digest が「green 時点の hash」を現在 tree と照合するため、コード進化で不一致が必然的に再増殖** (orchestrator 裏取り: L7-194 は訂正を明記済みで隠れ乖離ではない) | 不十分 (恒常機構なし) | **PLAN-L7-303** |
| DV-6 | B | improvement backlog open 135 | 増加傾向 | 書式 lint のみ (`src/lint/improvement-backlog.ts`)、aging/上限なし | 機構なし | **PLAN-L7-307** |
| DV-7 | B | draft debt 33 本の永久 draft 放置 | 全件 draft | 着手時昇格は fail-close (L7-263)。放置は silent | 不十分 | **PLAN-L7-307** |
| DV-8 | C | LEGACY_LANDED 恒久免除 5 本 | 固定 | 正本台帳に記録済 (意図的恒久免除) | 健全 | 不要 |
| DV-9 | C | LEGACY_CONDITIONAL_BACKFILL 27 本 | 固定 | **L7-119 の台帳双方向同期が実在** (orchestrator 裏取り: `src/lint/backfill-pairing.ts:223-228`) | 健全 (age 検出のみ無し → DV-7 と同枠) | PLAN-L7-307 対象に含む |
| DV-10 | C | ORACLE_TEST_TRACE_BASELINE 89 件 | 固定 | size assertion ratchet あり | 健全 | 不要 |
| DV-11 | C | PM_REVIEW_PLAN_PATHS 4 件 | 固定 | prose 手順のみ (広域 walkFiles 別掃が存在し低 severity) | 軽微 | 不要 |
| DV-12 | C | FORWARD_CONVERGENCE_LEGACY_DEBT | 空 (IMP-146 解消済) | 双方向 hard check | 健全 | 不要 |

### 2.4 データ実在性 (右腕エスカレーション観点)

| ID | 所見 | 実測根拠 | 既存カバー | 対応 |
|---|---|---|---|---|
| DP-1 | model_runs のコスト/トークン 5 列が 634 行**全 null**。L7-57/58 (confirmed、FR-38 cost telemetry) の宣言と DB 実在が乖離し、Model/Effort Routing に実コストのフィードバックが一切無い | §1 実測 | L7-57/58 は取得系の実装。model_runs への population 経路は未起票 | **PLAN-L7-306** |
| DP-2 | 設計済み 0 行テーブル 11 個 (evidence-gated 宣言と実装漏れの区別が台帳化されていない) | §1 実測 + doctor `db-projection-ingestion` は "evidence-gated zero tables: 11" と一括容認 | test_results は **L7-273** が正面カバー。**disposition の制度化**は未起票 | v2 戦略 doc §5 で PLAN-L7-307 の aging と併せ運用 (単独起票は見送り、L7-273 先行) |

### 2.5 発見・観察・検証の手段 (OB) — PO 指摘 2026-07-03 の裏付け

PO 指摘「テスト戦略は十分だが、発見と観察、検証の手段が薄い」は本監査の実測と一致する:

| ID | 所見 | 実測根拠 | 既存カバー | 対応 |
|---|---|---|---|---|
| OB-1 | **発見**が手動監査依存: 監査の方法知 (プローブ + 解釈観点) がオーケストレータのプロンプト内にしか存在せず、セッション/モデル交代で消える | A-172〜A-181 は全て /goal 起点の手動 fan-out | 無し | **監査レンズカタログ** (`docs/governance/audit-lens-catalog.md`、本監査で着地) + 機械配線 **PLAN-L7-310** |
| OB-2 | **観察**が点でしか存在しない: 健康指標 (doctor 秒数 / DB サイズ / draft 数 / digest 不一致) の時系列がなく、劣化は次の大監査まで不可視。実例: digest 不一致は本監査中に 199→203 へ増加したが、連続観測なしでは傾向が見えない | §1 基線 + doctor 再走実測 | L7-251 は観測の**消費**側 (next 選択) で生産側が無い | **PLAN-L7-312** |
| OB-3 | **検証**の実走手段が都度発明: 「projection 単独を verified と認めない」原則 (L7-188) はあるが実走の実施手段が常設されておらず、guard/gate/hook を意図的に発火させて確かめる方法が無い。実例: skill 実発火 0 問題は実経路を誰も走らせていなかったことが原因 | A-180 / 2026-06-29 実例 | L7-258 は実運用中の発火証跡 (受動)。能動プローブは無し | **PLAN-L7-311** |
| OB-4 | **UI/UX 検証態勢の系統的弱さ** (PO 指摘): 実稼働機会がないため画面系の検証観点が痩せたまま — UXV 5 ケース / 15 画面 (1 画面 0.33)、操作必須項目 (空状態/エラー/権限等) の spec 必須欄なし、usability 要求の画面 AC 降下なし、fe-design/fe-a11y の発火実績なし | doctor `g10-ux-workflow` 実測 + screen-impl-pair-freeze (mock 段階) | frontend-design-coverage は doc の存在/§構造のみ (`coverage ≠ substance`) | **PLAN-L7-316** + カタログ LENS-UX 追加 |
| OB-5 | **エンコーディング検査の即時性の穴** (PO 質問): Write/Edit ツールは UTF-8 固定 + readability gate は fail-close (green: 706 docs / marker 0、本日の新規 19 ファイルも strict デコード検証で ALL CLEAN) だが、shell 経由書き込み (PowerShell 既定 UTF-16) の検出が「次の doctor まで」遅延する | utf8-check 実測 2026-07-03 | readability gate は doctor/CI 時点のみ | **PLAN-L7-317** (PostToolUse 即時検査) |

### 2.6 その他 triage

- `.ut-tdd/pack-sync/` 未 tracked (SessionStart gate 所見 missing-projection): Codex 進行中の PLAN-L7-252 系 sync-pack evidence。PO 指示 (2026-07-03「Codex リファクタ中は不問」) により本監査は不介入。Codex 側の PLAN 完了時に解消される見込み。残留する場合のみ追跡。

## §3 v2 起票 (アップデート駆動 = version-up mode、2026-07-03)

すべて `route_signal: version_deferral` + `route_mode: version-up` + `version_target: v2` + `status: draft` (§2.5 version-up、要件 §7.8.1。活性化時は add-feature で Forward 合流)。着手順の推奨は `docs/governance/harness-v2-update-strategy.md` (本監査と同時作成) の wave 表が正本。

| PLAN | 対応所見 | 一言 |
|---|---|---|
| PLAN-L7-300-doctor-scoped-execution | CE-2/5/6 | doctor 一括 load 注入 + per-check 計時 + --scope + digest 増分化。63-87s → scoped ≤10s |
| PLAN-L7-301-telemetry-retention | DV-1/3 | `ut-tdd db prune` + logs rotation + `db-telemetry-retention` check |
| PLAN-L7-302-context-tiering | CE-1 | 常時読みを tier 化、requirements/concept はセクション動的抽出へ (-94% 常時トークン) |
| PLAN-L7-303-digest-commit-anchor | DV-5 | digest を green 時点 commit SHA に anchor → stale/fake 再分類 → 199 件移行是正 → 段階 hard 化 |
| PLAN-L7-304-plan-pending-decision-gate | GR-1 | `pending_decision` frontmatter + confirmed 遷移 fail-close |
| PLAN-L7-305-plan-bundle-split-gate | GR-2 | DoD 項目数閾値で bundle 宣言必須 + 着手時分割強制 |
| PLAN-L7-306-model-run-cost-population | DP-1 | delegation → usage/cost ingest、routing への実コスト還流 |
| PLAN-L7-307-ledger-aging-detection | DV-6/7 (+DV-9 age、DP-2 運用) | 滞留 aging 一元 check (backlog / draft-debt / version-up parked / zero-table) |
| PLAN-L7-308-plan-archive-mechanism | DV-4 | `ut-tdd plan archive` + advisory (低優先) |
| PLAN-L7-309-plan-reference-traceability | GR-4/5 | debt 台帳リンク back-fill + freshness analyzer の doctor 配線。**同日、Codex の PLAN-L7-312-plan-reference-freshness-analyzer (confirmed) が誘導文 + analyzer 基盤を landed** — 本 PLAN は残スライスへ縮小改稿済み (GR-4/5 の一部は当日中に解消) |
| PLAN-L7-310-audit-lens-wiring | OB-1 | 監査レンズカタログ (着地済み) の `ut-tdd audit` + skill 推奨配線 |
| PLAN-L7-311-probe-harness | OB-3 | guard/gate/hook の fixture 駆動実走検証 (能動プローブ) |
| PLAN-L7-313-operational-baseline-sentinel | OB-2 | 健康指標の時系列 snapshot + drift 表示 + 監査カデンス advisory (当初 312 で準備、Codex 先着のため 313 へ改番 — GR-3 のリアルタイム実例) |
| PLAN-L7-315-scope-integrity-gate | 回避台帳 B4/A3 | スコープ無宣言縮小の fail-close + waiver 正規化 (PO 指示 2026-07-03。当初 314、Codex 先着で 315 へ改番 — 同日 2 度目の GR-3 実例) |
| PLAN-L7-316-ux-verification-readiness | OB-4 | UX 検証態勢 (操作必須項目の観点表 + UXV 体系 + fe-design レビュー正規化。L10 pair-freeze 連動で活性化) |
| PLAN-L7-317-write-encoding-guard | OB-5 | 書き込み直後の UTF-8 検査を PostToolUse hook で即時化 |

加えて非 PLAN 成果物 2 本: `docs/governance/audit-lens-catalog.md` (監査ポイント + 解釈観点 + 委譲プロンプト雛形の正本 — PO 指示「システム内に組み込む」の中身側、配線前でも手動運用可) / `docs/governance/scope-integrity-and-evasion-taxonomy.md` (スコープ低下 7 つの瞬間 + 回避の許容/非許容分類 + 仕組化の穴台帳 — PO 指示「資産として残す」の正本)。

## §4 未監査残 (次 round への引き継ぎ)

A-175 §1 の未監査 4 項目 (harness.db provenance 横断 / hook 実発火 telemetry 実走 / CLI surface (リファクタ完了後) / terminology 全数) は本監査でも未着手のまま維持。追加: doctor per-check 実測プロファイル (PLAN-L7-300 Step 1 が兼ねる)。

## §5 コンセプト保全の判定

- 6 本の柱に対する新規逸脱は検出なし。系統リスクは A-175 の「宣言と機械の乖離」に加え、本監査で「**時間経過そのものが敵**」(telemetry 無限成長 / digest 経年腐敗 / draft 滞留 / 固定コンテキスト税) という第 2 軸を特定した。
- 上流正本 (concept/requirements/設計 doc) への変更なし。本起票は draft PLAN 追加 + audit/governance doc 追加のみ。
- 起票は version-up 駆動で routing 済み (route certificate = frontmatter 機械検査、`ut-tdd plan lint` green を起票 evidence とする)。
