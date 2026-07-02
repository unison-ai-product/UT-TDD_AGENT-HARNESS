# A-178: 制御層ギャップ監査 (hook 実配線 / prose-only 規則 / skill・session 強制) — 2026-07-02

- 監査種別: アーキテクチャ監査 (A-172〜A-177 系列)。PO 依頼 2026-07-02「ほかにも制御層に穴がありそう。まだ見てないものを探し出して」
- 対象: A-177 までで未踏の制御面 — ①hook 層の実配線と fail-open/fail-close 設計 + 実発火証跡、②MUST 級規則の機械裏付け有無、③skill 注入・session/handover ライフサイクル強制、④doctor advisory 区分と CI 被覆差 (orchestrator 直査)
- 方法: 並列調査 3 系統 (pmo-project-explorer sonnet ×3) + orchestrator 裏取り (`.codex/hooks.json` SubagentStop 0 件 / `src/cli.ts:340-345,865-879` 未 catch / pre-push 対象限定 / `KIND_REVIEW_REQUIRED` 意図コメント / `resolveSkillContextInjection` `:memory:`+silent undefined / `resolveVmodelInjection` 呼び出し元 1 箇所、いずれも実コードで確認)
- 処置: 起票のみ (実装しない)

## §0 結論サマリ

制御層の穴は 3 パターンに分類できる: **(a) 発火しているが記録されない** (guard 系 hook の証跡ゼロ)、**(b) 宣言されているが検出器が無い** (escalation boundary / hybrid git 規律 / raw exec 禁止)、**(c) 制御は在るが発火点・接続が無い** (strict evidence gate / vmodel 注入 / skill telemetry の偽装構造)。既知の「skill_invocations 全部 auto-projection」と同型の空洞が hook 層にもう 1 系統 (PreToolUse/SubagentStop) 存在する。

## §1 所見

### 領域 1: hook 層 (実配線・fail 設計・実発火)

**G-1 [medium] guard 系 hook の発火証跡が皆無** — hook_events (10,588 行) は session jsonl の projection であり、その jsonl に PreToolUse (agent-guard / work-guard) と SubagentStop が**一切書かれない**。agent-guard は pass 時 `agent-slots.json` に slot を書くのみ、work-guard の block/bypass は audit jsonl (override 時のみ) 以外無記録。ブロックが「起きたか」を後から監査できない — skill 空洞と同型 (検証戦略 memory: 設計時観測点の欠落)。

**G-2 [medium] Codex 側 SubagentStop 未登録** — `.codex/hooks.json` に SubagentStop エントリ 0 件 (grep 裏取り済)。Codex 側 subagent 終了で slot release が発火せず leak (現 `agent-slots.json` に 14 残存、SessionStart sweep 依存)。並列上限 warn の false positive 要因。PLAN-L7-139 の残差。

**G-3 [low] fail-open 意図に対する未 catch 実装 2 箇所** — Stop hook の `writeHandoverWarnings` (`src/cli.ts:340-345`) と `hook subagent-stop` action (`src/cli.ts:865-879`, 説明文に "fail-open" と明記) に try/catch が無く、内部 throw で CLI が非 0 終了し得る。`blockOnFailure` 未設定のため runtime は続行するが、digest 欠損がサイレントに起きる。他 hook (SessionStart/PostToolUse) は catch 済みで、この 2 箇所だけ非対称。

**G-3b [low] Codex hooks の相対パス依存** — `.codex/hooks.json` は `bun src/cli.ts` (相対)、Claude 側は `$CLAUDE_PROJECT_DIR` (絶対)。cwd が repo root でない Codex 起動でサイレント失敗し得る (推測含み、実測未)。

fail-open/fail-close の設計整合自体は**良好**: agent-guard = fail-close (stdin 不正も block)、work-guard = 確証時のみ block・内部エラー fail-open、いずれも doc 宣言どおり (バグではない)。

### 領域 2: 宣言規則 × 機械裏付け (prose-only の穴)

機械強制が確認できたもの: Conventional Commits (commit-msg hook)、staged secret 検査 (pre-commit)、review-evidence 前置 (fail-close)、plan-dod、rule-drift、subagent allowlist/model (agent-guard)、foreign edit (work-guard)。

**G-4 [high] escalation boundary (auth/payments/PII/destructive/production infra) に検出器ゼロ** — CLAUDE.md/AGENTS.md の MUST 中核だが、src/lint 76 本にも hook にも該当領域の変更を検出・警告する層が無い。エージェントの自己判断のみ。柱 2 の最大例外領域。

**G-5 [high] hybrid git 規律が全て prose のみ** — ①`git add -A`/`git add .` 禁止: pre-commit は staged 内容の secret しか見ず staging 方法は無検査。②他ランタイム commit の reset/revert/force 禁止: pre-rebase 等は git sample のまま。③force-push 防止: pre-push は PII 検査のみで force は素通り、GitHub branch protection は opt-in (`--apply`+interactive) で常時適用の証跡なし。相手成果の巻き込み・履歴破壊 (過去に実事故系列あり) を機械では防げない。

**G-6 [medium] 機密検査のディレクトリ盲点** — pre-push の PII 検査対象は `*CLAUDE.md`/`*SKILL.md`/`*/references/*.md` のみ (`.git/hooks/pre-push` 裏取り済)。docexport redaction は docs/ 6 正本 family のみ。**`.ut-tdd/audit/` と `.ut-tdd/logs/` (追跡対象の監査証跡) はフリーテキスト機密の検査ゼロ** (pre-commit の API key regex のみが防波堤)。監査レポート量産運用 (A-1xx 系) と相性が悪い。

**G-7 [low] raw `codex exec` / raw `claude` 常用の検出なし** — wrapper 迂回は session/audit 記録漏れに直結するが自己申告依存。

意図確認済みでバグ扱いしないもの: review-evidence の kind 限定 (`review-evidence.ts:24-27` に過検知回避の意図明記)、work-guard fail-open、doctor の handover/agent-slots warning 扱い (§5.3 exit 0 warning のコメント明記)。

### 領域 3: skill 注入・session/handover 強制

**G-8 [critical] skill telemetry の偽装構造が未是正のまま増加** — skill_invocations 1,850 件中 1,840 件 (99.5%) が `auto-projection:review-evidence` (rebuild 時の単一バースト生成、実発火でない)。実 runtime 発火は 10 件のみ。`skill_firing_rate`/`skill_acceptance_rate` の feedback 355 件×2 もこの偽データ由来。PO 確定所見 (2026-06-29) 後、件数は 1,580→1,840 に増えており構造は放置。runtime 検出経路 (PLAN-L7-201 の `runtime-hook:skill-suggest`) は実装済みだが、偽データと同じテーブル・同じ metrics に混在。

**G-9 [high] skill 系テーブルの session_id 欠落** — skill_recommendations (2,195 件) / skill_invocations (auto-projection 分) は全件 `session_id=""` (`skill-projections.ts:93,109`)。hook_events は session_id 貫通しているのに skill 系だけ lifecycle と切断され「どのセッションが何を推奨・使用したか」を DB から追えない。

**G-10 [high→既起票側で対応] vmodel injection が表示止まり** — `resolveVmodelInjection` の呼び出し元は `vmodel show` (表示) の 1 箇所のみ (grep 裏取り済)。mandatory_agents / recommended_skills / orchestration_mode の 5 key 注入が委譲・team run に流れない。**対応は PLAN-L7-257 (cell→roster + injection 接続) の活性化に内包** — 新規起票せず 257 の根拠として本所見を追記参照。

**G-11 [low-medium] skill 注入の silent fail-open** — `resolveSkillContextInjection` (`src/cli.ts:238-262`) は `:memory:` rebuild 失敗時に **無言で undefined を返し、注入なしのまま委譲が続行**する。注入されなかった事実がどこにも記録されない (柱 4 の実効性を検証不能にする)。

**G-12 [note] Stop→DB 反映は rebuild 依存の非同期 / CURRENT.json stale は warning のみ** — いずれも設計意図の範囲 (handover 正本は DB、doctor warning surface は §5.3 明記)。stale 情報の消費防御は PLAN-L7-246/251 の範囲で扱う。ProviderHandover 記録 8 件のみ (手動依存) は L7-251 の観測源整備と合流。

### 領域 4: doctor/CI (orchestrator 直査)

**G-13 [medium] strict evidence-integrity gate に発火点が無い** — green_command digest 不一致は既定 advisory (`doctor/index.ts:1031-1039`)、strict 化は `--strict-green-command-digest` opt-in。opt-in 化自体は PLAN-L7-194 (confirmed) の意図的決定だが、**CI (`harness-check.yml:72` は素の doctor) にも運用 checklist にも strict 実行点が存在しない** = fake substance 検知が定常運用のどこでも回らない。対応は新ゲートでなく「発火点の設置」(release checklist = PLAN-L7-249 への機械判定項目追加 + CI optional job 判断)。

## §2 起票 map (すべて draft、着手は PO 判断)

| PLAN | 対応所見 | 骨子 |
|---|---|---|
| PLAN-L7-258-guard-firing-evidence | G-1, G-2, G-3, G-7 | guard 系 hook (agent-guard pass/block、work-guard block/bypass、SubagentStop release) の session jsonl/DB 証跡化 + Codex SubagentStop 登録 + 未 catch 2 箇所の fail-open 整備 + raw exec 検出 (session command scan、warn) |
| PLAN-L7-259-hybrid-git-discipline-guards | G-5 | stage 方法検査 (session 非接触 file の staged 検知) / history 破壊操作の検知 (pre-rebase・force-push warn) / branch-protection 適用状態の doctor surface |
| PLAN-L7-260-sensitive-scan-boundary | G-6 | 機密スキャン境界の拡張: `.ut-tdd/audit/`・`.ut-tdd/logs/`・docs 全域への secret/PII lint (redaction self-trigger 回避設計込み)、pre-push 対象の見直し |
| PLAN-L7-261-escalation-boundary-detector | G-4 | escalation 対象領域 (auth/payments/PII/destructive/infra) の変更検出器 — 宣言的対象 map + diff 照合、warn-first (自動 block は誤検知評価後に PO 判断) |
| PLAN-L7-262-skill-telemetry-provenance | G-8, G-9, G-11 | provenance 分離 (auto-projection を metrics から除外 or 別系列化)、skill 系 session_id 貫通、注入実績/注入失敗の記録 (silent fail-open の可視化) |
| (既存拡張) PLAN-L7-249 | G-13 | release checklist の機械判定項目に `doctor --strict-green-command-digest` を追加 (発火点の設置) |
| (既存参照) PLAN-L7-257 | G-10 | vmodel injection 表示止まり所見を活性化根拠に追記 |

## §3 裏取り記録

- `.codex/hooks.json`: SubagentStop grep 0 件。`src/cli.ts:340-345` / `865-879`: try/catch 不在を実読で確認。
- `.git/hooks/pre-push`: `is_protected_markdown` の 3 パターン限定を実読で確認。
- `review-evidence.ts:24-27`: kind 限定の意図コメント確認 → バグ認定回避。
- `src/cli.ts:238-262`: `:memory:` + rebuild 失敗時 silent undefined を実読で確認。
- `resolveVmodelInjection` 呼び出し元: `src/cli.ts:1855` の 1 箇所のみ (grep)。
- `--strict-green-command-digest`: 定義は `src/cli.ts:479` に実在、`.github/` 参照 0 件、`harness-check.yml:72` は素の doctor。PLAN-L7-194 confirmed の意図確認済み。
- 調査 subagent 3 体中 2 体が途中停止/空 final → SendMessage 再開で回収 (narration≠成果の規律適用)。
