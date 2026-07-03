# UT-TDD Agent Harness v2 アップデート戦略 (後続オーケストレータへの引き継ぎ正本)

- **date**: 2026-07-03
- **author**: Claude Fable 5 (在任 1 週間の最終成果物)。監査正本 = `.ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md`
- **読者**: 本リポジトリを今後運用する AI オーケストレータ (Claude Opus/Sonnet/Haiku、GPT/Codex 系) と PO。
- **読むタイミング**: 常時読みではない。①マイルストーン/着手順を計画するとき ②version-up parked PLAN の活性化を判断するとき ③新しいオーケストレータが最初に運用方針を掴むとき、の 3 場面で読む。
- **正本性**: v2 の wave 構成と着手順推奨の正本。個々の実装内容の正本は各 PLAN (`docs/plans/PLAN-L7-300` 〜 `309` ほか)。着手順の最終決定は常に PO。

## §1 「最高パフォーマンスを発揮し続ける」の定義 (判定 4 軸)

このハーネスの性能は次の 4 軸で測る。v2 の全起票はこのいずれかを恒常的に改善する。

| 軸 | 意味 | 現在の主な敵 (A-181) |
|---|---|---|
| **正確性の持続** | 機械ゲートの判定が時間経過後も真実を語ること | digest 経年腐敗 (199 件)、宣言と DB 実在の乖離 (cost 全 null) |
| **経済性** | オーケストレータ 1 ループの固定コスト (トークン/秒) が小さいこと | 起動必読 11.3 万トークン、doctor 63-87 秒 |
| **適応性** | 実測データが routing/推奨へ還流し、運用が自己改善すること | cost/telemetry の還流ゼロ、skill score 平坦 |
| **後続実装効率** | どのモデルが PLAN を拾っても迷わず完了できること | 未決分岐の丸投げ、隠れ束、台帳リンク欠落 (GR-1〜5) |

原則 (concept 6 本柱の性能面への適用): 機械チェックの green は「登録・被覆」しか語らない (`coverage ≠ substance`)。性能主張は必ず実測コマンドを添える。本 doc と A-181 の全数値には測定コマンドが付いている — 更新するときも同じ規律で。

補記 (PO 指摘 2026-07-03): このハーネスは**テスト戦略は十分だが、発見 (問題を見つける常設機構)・観察 (自分の実行を見る計器)・検証 (実走で確かめる手段) が薄い**。v2 はこの 3 手段を一級化する — 発見 = 監査レンズカタログ (`docs/governance/audit-lens-catalog.md`、着地済み) + その機械配線 (PLAN-L7-310)、観察 = 運用基線センチネル (PLAN-L7-313)、検証 = probe harness (PLAN-L7-311)。

補記 2 (PO 指摘 2026-07-03): **スコープの無宣言縮小・矮小化の防止**と**回避の許容/非許容分類**は `docs/governance/scope-integrity-and-evasion-taxonomy.md` (着地済み) が正本。機械強制 = PLAN-L7-315。「許容される回避はすべて宣言され、記録され、出口がある」が原理。

補記 3 (PO 指摘 2026-07-03): **UI/UX の検証・観点・デザイン判断は「実際に稼働する機会がない」ため系統的に弱い** (実測: UXV 5 ケース / 15 画面、中央 UI は mock 段階)。監査観点 = カタログ LENS-UX、是正 = PLAN-L7-316 (操作必須項目の観点表 + screen spec 必須欄 + UXV 体系 + fe-design レビュー正規化。活性化は L10 pair-freeze 進入と連動)。

補記 4 (PO 指摘 2026-07-03): **Pack = 自己適用を外した「生の OS」が本当の製品であり、v2 の出口は Pack の version-up である**。source repo は工房、Pack は出荷物 — ここで直したものが Pack に反映されて初めて価値になる。生化 (自己適用の混入なし・自分史ゼロでの起動・self 校正閾値の排除) の監査観点 = カタログ LENS-RW、機械化 = PLAN-L7-319 (purity スキャン + day-0 smoke + Pack lag 検出)。**配布サイクルの正**: wave が source で landed → `ut-tdd distribution sync-pack` (人間レビュー付き) → Pack repo の version-up release。Pack lag (source からの遅延) は放置すると「腐り続けるもの」になるため、L7-319 の lag 検出が出荷忘れの番人になる。

## §2 現状基線 (2026-07-03、詳細は A-181 §1)

- doctor 全走 63〜87 秒 / 起動必読 doc ≒ 11.3 万トークン (91% が requirements+concept)
- harness.db 60.9 MB・retention 機構なし / feedback surface actionable=0・telemetry≒100%
- model_runs コスト列 634 行全 null / 設計済み 0 行テーブル 11
- draft PLAN 60 本 (うち debt 台帳 33 本) / green-command-digest 不一致 199 件 / improvement backlog open 135
- 番号衝突 4 組 (246/250/258/259) が併存中 — 短縮参照時は必ずファイル名 full-match で確認

## §3 v2 アップデート戦略 — wave 構成

方針: **「PLAN を安全に消化する基盤」を先に直し、それから中身を消化する**。draft 60 本を頭から消化するのではなく、wave 1 の粒度ゲート群を先に入れることで以降の全実装の迷子率を下げる。各 wave 内は原則並列可、wave 間は直列 (依存理由を各行に明記)。

### Wave 0 — 即着手可能な高信頼 PLAN (基盤修正を待つ必要がない)

| PLAN | 根拠 |
|---|---|
| PLAN-L7-233-personal-path-guard-generalization | 粒度 A 評価 (固定コマンドまで明記済)。公開 Pack の個人パス漏洩防止で外部影響が大きい |
| PLAN-L7-232-sync-pack-clean-tree-guard | 粒度 A- 評価。配布パイプラインの構造的安全欠陥 (A-172 直結) |
| PLAN-RECOVERY-06-pack-consumer-doctor-profile | consumer setup 生成物が exit 1 になる実害バグ。recovery 系は本質的に優先 |

3 本とも `src/setup/*` / `src/lint/*` で領域重複が薄く並列着手可能。

### Wave 1 — PLAN 消化基盤 (以降の全 draft 消化を安全化する)

| PLAN | 内容 | 依存 |
|---|---|---|
| PLAN-L7-309-plan-reference-traceability (v2 新規) | debt 32 本へ台帳リンク back-fill + freshness analyzer の doctor 配線 (基盤は Codex の PLAN-L7-312 が 2026-07-03 に landed 済 — 残スライスのみ) | なし。**最小侵襲なので wave 1 先頭** |
| PLAN-L7-304-plan-pending-decision-gate (v2 新規) | 未決分岐 (GR-1) の fail-close | なし |
| PLAN-L7-305-plan-bundle-split-gate (v2 新規) | 隠れ束 (GR-2) の宣言強制と着手時分割 | なし |
| PLAN-L7-315-scope-integrity-gate (v2 新規) | スコープ無宣言縮小の fail-close + waiver 正規化 (taxonomy B4/A3) | なし (L7-304/305 と同ファイル群 = 直列) |
| PLAN-L7-256-model-id-ssot-drift-gate のスコープ(d) | PLAN 番号一意性 fail-close (GR-3) | なし |
| PLAN-L7-245-sub-doc-schema-integrity | 他 PLAN の frontmatter 正当性の前提 | なし |
| PLAN-L7-310-audit-lens-wiring (v2 新規) | 監査レンズカタログの機械配線 (PO 指摘: 最高 ROI。カタログ本体は着地済みで手動運用可) | なし |

### Wave 2 — 正確性の持続 (証跡と DB を信頼できる状態に固定する)

| PLAN | 内容 | 依存 |
|---|---|---|
| PLAN-L7-272-red-first-activation | Red-first 証跡。他 add-impl の参照実装 (正規形の手本) として先出し | parent L6-28 |
| PLAN-L7-273-test-results-ingest | test_results 0 行解消 (Red/Green 一次証跡) | L7-272 と対 |
| PLAN-L7-246-feedback-event-lifecycle | feedback close 経路 + actionable→routing 接続 | なし |
| PLAN-L7-243-mode-first-class-db-projection | mode 投影損失是正 (critical、PO gate 含む) | なし |
| PLAN-L7-303-digest-commit-anchor (v2 新規) | digest の commit anchor 化 → 199 件是正 → 段階 hard 化 | なし (L7-300 の増分化と独立) |
| PLAN-L7-311-probe-harness (v2 新規) | guard/gate/hook の実走検証常設化 (検証手段の一級化) | なし (L7-258 と両輪) |
| PLAN-L7-317-write-encoding-guard (v2 新規) | 書き込み直後の UTF-8 即時検査 (readability gate の即時化補完) | なし (readability 実装の再利用) |
| PLAN-L7-323-handover-active-plan-freshness (v2 新規) | active_plan の stale 表示是正 + heredoc commit からの自動更新 (実測: L7-26/31 の stale 値が信頼できる顔で表示) | なし |

### Wave 3 — 経済性 (ループの固定コストを削る)

| PLAN | 内容 | 依存 |
|---|---|---|
| PLAN-L7-300-doctor-scoped-execution (v2 新規) | doctor 一括 load + 計時 + --scope。63-87s → scoped ≤10s | **Codex の doctor 分割 (L7-276/283 系) 完了後** (構造が固まってから) |
| PLAN-L7-301-telemetry-retention (v2 新規) | db prune + logs rotation | L7-246 完了後 (close 済み行の prune が前提) |
| PLAN-L7-302-context-tiering (v2 新規) | 起動必読の tier 化 (-94% 常時トークン) | なし。ただし CLAUDE.md 変更は PO 確認ゲート |
| PLAN-L7-313-operational-baseline-sentinel (v2 新規) | 健康指標の時系列 snapshot + drift 表示 (観察の一級化) | なし (L7-300 計時後に per-check 化) |
| PLAN-L7-320-ci-failure-ingestion (v2 新規) | CI 成否の harness.db ingest + SessionStart/status surface (既知 carry「CI 還流なし」の解除) | **Codex の CLI 抽出完了後** (src/cli.ts が hot zone のため) |
| PLAN-L7-324-memory-compaction-trigger (v2 新規) | memory 肥大の閾値検出 + 圧縮発火 + 標準手順資産化 (Claude adapter) | なし |
| PLAN-L7-236-audit-doc-curation | audit 100 ファイルの整理 | なし |

### Wave 4 — 適応性 (実測→routing の自己改善ループを閉じる)

| PLAN | 内容 | 依存 |
|---|---|---|
| PLAN-L7-306-model-run-cost-population (v2 新規) | cost/token 実データ化 → Model/Effort Routing へ還流 | L7-255 (landed) の delegation 注入点を使う |
| PLAN-L7-307-ledger-aging-detection (v2 新規) | backlog/draft-debt/parked の滞留 aging 一元検出 | なし |
| PLAN-L7-277-skill-recommendation-discrimination | skill score 差別化 | L7-262 (landed) |
| PLAN-L7-308-plan-archive-mechanism (v2 新規) | completed PLAN の archive 経路 (低優先) | なし |
| PLAN-L7-316-ux-verification-readiness (v2 新規) | UX 検証態勢 (観点表 + UXV 体系 + fe-design レビュー正規化) | **L10 pair-freeze 進入と連動して活性化** (それまで parked が正) |
| PLAN-L7-319-raw-os-purity (v2 新規) | Pack 生化純度 (混入スキャン + day-0 smoke + Pack lag 検出) — **配布サイクルの番人** | RECOVERY-06 / L7-232〜235 (wave 0 の Pack 是正群) 消化後が効率的 |

### PO 判断を先行させる PLAN (実装着手前に Try で仕様確定が必要)

GR-1 該当。実装エージェントが仕様を「発明」してはならない。PO/TL の決定を PLAN 本文へ書き戻してから wave へ流す:
**PLAN-L7-253** (advisor 発火条件セット)、**PLAN-L7-269** (退役対象の具体例)、**PLAN-L4-15** (NFR AC 数値)、**PLAN-L4-16** (security slot 方式 A/B)、**PLAN-L7-242** (8 項目の分割優先順)。

## §4 後続モデルへの運用指針 (実装で迷わないために)

### 4.1 draft PLAN 着手プロトコル (毎回この順で)

1. `git log --oneline -10` と `git status` — 相手ランタイムの in-flight 作業を確認。foreign 変更は正規作業とみなし触らない。あわせて `gh run list --limit 5` で**現 branch の CI 成否を確認** (CI 失敗は自動では届かない — L7-320 活性化までは手動確認が唯一の経路。実例: 2026-07-03 に 7 連続 failure が無通知で滞留)。
2. PLAN 本文精読 + `dependencies.requires` の status 確認 (`ut-tdd status`)。
3. **debt 台帳照合**: 対象 plan_id が `src/plan/lint-policy.ts` の `ROUTE_MODE_KIND_DRAFT_DEBT_PLAN_IDS` にあれば、着手前に kind を `add-impl` へ昇格し Reverse pairing (PLAN-REVERSE-xxx) を用意する (正本: `docs/governance/route-mode-kind-debt-audit-2026-07-02.md`、昇格実例第 1 号: PLAN-L7-263 本文)。
4. PLAN 中の `file.ts:NNN` 行番号引用は起票時スナップショット。着手時に必ず Grep で現物を再特定する (Codex リファクタで恒常的にずれる)。
5. 未決分岐 (「TL/PO 判断」slot) が本文にあれば実装せず PO へ返す — 仕様を発明しない。
6. 実装は Red → Green (`bun run test` はフルで見る、`| tail` 禁止)。設計時に観測点/provenance ログを仕込み、実走 evidence を捕捉する (projection 単独を verified と認めない)。
7. 完了時: 意図ファイルのみ `git add <path>` (`-A` 禁止) → `git diff --staged` 確認 → Conventional Commit → review_evidence 記録 → `ut-tdd plan lint` + 対象 doctor check green を確認してから完了宣言。

### 4.2 モデル routing 早見 (CLAUDE.md §Model/Effort Routing の運用注記)

- 実装ワーカー = GPT/Codex 系 (effort middle)、docs = Sonnet、調査 = Haiku、判断ゲート = 別ランタイム/上位 tier (frontier gate)。
- 迷ったら `ut-tdd advisor --task "..." --current-model <model>`。自分の model 名を過小/過大申告しない。
- **注意**: 実コストデータは PLAN-L7-306 完了まで存在しない (model_runs 全 null)。それまでコスト判断は routing 表の既定に従い、独自のコスト推測で routing を上書きしない。

### 4.3 はまりどころ (過去の実損から。詳細な教訓 DB = メモリと feedback ledger)

- **Windows が第一級**: `.cmd` spawn は windowsVerbatimArguments + 外側クォート必須。Linux CI はこの分岐を通らない永続盲点。adapter spawn を触ったら Windows 実機で test + probe。
- **doctor は未コミット tree を読む**: hybrid 並行作業中の doctor fail をまず自分/相手の in-flight と切り分ける。検証の基準点は常に HEAD + 自分の意図変更のみ。
- **測定値の transient**: 共有 tree の全数計測 (テスト件数等) を「repo の状態」として報告しない。
- **coverage ≠ substance**: orphan 0 / N green / lint OK は中身の証拠ではない。中身は読んで検証。falsifiable な主張には必ず実行コマンドを添える。
- **redaction self-trigger**: 検出器を説明する doc に trigger 文字列を素書きしない。
- **`biome lint` ≠ `biome check`**: push 前は lint + vitest + typecheck + doctor を全部フルで回す。
- **完了済み相手成果を放置/破棄しない**: working tree の完了済み Codex 成果はレビュー→補完→cross_agent evidence→コミットまで運ぶ。history 書き換え禁止。

### 4.4 このハーネスで一番壊れやすいもの

機械ゲートは「不在」に盲目 (absence-blindness)。新機能を足すときは必ず「無かったら fail-close する側」に倒す: 新テーブルは ingest 実装か evidence-gated 宣言を必須に、新 allowlist は出口条件と ratchet を同時に定義、新 telemetry は close 経路と retention を同時に設計。**「あとで機構を足す」は v1 で 12 本の劣化ベクトル (A-181 §2.3) を生んだ当の原因**である。

## §5 持続性の再監査手順 (四半期 or 大規模変更後に実行)

**正本 = `docs/governance/audit-lens-catalog.md`** (6 レンズの実測プローブ・解釈観点・委譲プロンプト雛形・fan-out 作法)。以下は最小レシピの抜粋であり、本格監査はカタログからレンズを選んで実施する:

1. `[Diagnostics.Stopwatch]` で `bun src/cli.ts doctor` を計時 → 基線 (63-87s) と比較。PLAN-L7-300 後は scoped ≤10s / full ≤30s を閾値とする。
2. bun:sqlite (readonly) で全テーブル COUNT → telemetry 上位 5 テーブルの増分と DB サイズ (基線 60.9 MB) を確認。PLAN-L7-301 後は retention check green を確認。
3. `bun src/cli.ts session start` の actionable/telemetry 比を確認 (基線 actionable=0)。
4. doctor 出力の green-command-digest / improvement-backlog / plan-governance 行を全文確認 (`| tail` 禁止)。
5. `grep -c "status: draft" docs/plans/*.md` で draft 滞留数を確認し、PLAN-L7-307 の aging 出力と突合。
6. 所見は A-18x 系列で .ut-tdd/audit/ へ、起票は修正駆動 (Recovery/Add-feature/Refactor) または version-up で。既存 PLAN との重複判定を必ず行う (A-181 §2 の「既存カバー」列の作法)。

## §6 version-up parked PLAN の活性化手順

1. PO が活性化を判断 (時期と優先順)。
2. 対象 PLAN の frontmatter から `version_target` を除去し、`route_signal`/`route_mode` を add-feature 系へ更新 (§2.5: version-up の出口 = add-feature で L2/L3→L7 合流)。
3. kind が impl のままなら add-design/add-impl へ昇格し、add-impl は Reverse pairing を用意 (KIND_BACKFILL: add-impl=required)。
4. `ut-tdd plan lint` green を確認してから着手。lint が route_mode×kind 不整合で fail した場合の直し方は `docs/governance/route-mode-kind-debt-audit-2026-07-02.md` を参照。

---

*この doc は在任期間の終わりに書かれた。ここに書いた戦略より、§1 の 4 軸と §4.4 の原則の方が長生きする。wave の中身が古びたら捨てて構わない — 軸と原則で測り直し、A-18x を 1 本増やし、また起票すればよい。それがこのハーネスの設計思想そのものである。*
