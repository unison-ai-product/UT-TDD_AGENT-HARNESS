# Session Handover — 2026-06-04 (handover 記録機構 Add-feature + doctor/biome carry 潰し)

> PO ゴール「handover とセッションログを正しく記録する仕組みにしてくれる」を受け、(1) handover 記録機構を **Add-feature 経路B (L6 設計 → L7 実装 → Reverse 上位整合)** で完走、(2) 残キャリーのうち doctor-staleness と biome 負債解消を潰した。**本 doc は新機構の 6 セクション構造** (§1-§2 = 機械部、§3-§6 = 人間判断) で記述 (dogfood)。`§6.8.5` 準拠。

## §1 PLAN サマリ

| PLAN | kind | 何を | commit |
|------|------|------|--------|
| `PLAN-L6-06-handover-mechanism` | add-design (L6) | handover 機構の機能設計① + L7 単体テスト設計③ (9 関数 ⇔ U-HOVER-001〜007) | `a413d25` |
| `PLAN-L7-04-handover-mechanism` | add-impl (L7) | src/handover② + tests④ + CLI + session-log 活性化 amendment | `f104a15` |
| `PLAN-REVERSE-05-handover-mechanism` | reverse/fullback | §6.8.5/§6.8.6 + CURRENT.md→.json 同期 + L0 §10 用語 back-fill | `c98c8c5` |
| (3 PLAN confirmed 化) | — | R3 PASS (PO "OK") で L6-06/L7-04/REVERSE-05 を confirmed | `e1cec73` |
| (carry: doctor) | feat | `ut-tdd doctor` に handover stale surface (`checkHandover`) + tests/doctor.test.ts | `59c1421` |
| `PLAN-L7-05-biome-debt` | refactor | repo 全体 biome 負債解消 (13 ファイル、機能不変) | `27efe75` |

**診断した 2 ギャップ (一体で解いた)**:
- **Gap A**: handover 機構が 0% 実装 (schema/コマンド/CURRENT.json すべて無し、手書き md のみ。§6.8.5 が保留した follow-up PLAN が未起票だった)。
- **Gap B**: solo/main 直開発で `.ut-tdd/state/current-plan` を書く機構が無く branch fallback も効かず `plan_id` 恒常 null → digest 不生成 → §6.8.6 結節点が死 (実ログ 5 件すべて `plan_id:null` で実証)。

## §2 成果物 (commit / files)

- **`src/handover/index.ts`** (新規): 9 関数 (resolveHandoverScope / buildPointer / scaffoldFromDigests / renderHandoverScaffold / handoverStale / writePointer / runHandover + nodeHandoverDeps)。機械ポインタ `CURRENT.json` (今どこ) と 人間判断 markdown (③-⑥ placeholder、次どう) を型分離。
- **`src/runtime/session-log.ts`** (amendment): `setActivePlan` / `inferPlanFromCommit` 追加、`onPostToolUse` commit 経路で current-plan 活性化 (fail-open 内側、`-F -` heredoc は no-op)、`resolveActivePlan` 本体不変。
- **`src/cli.ts`**: `ut-tdd handover [--dry-run|--complete|--plan]` / `ut-tdd plan use <id> [--clear]`。
- **`tests/handover.test.ts`** (新規): U-HOVER-001〜007 (16 test)。
- **要件 §6.8.5/§6.8.6 + L0 §10 用語 + CURRENT.md→.json 同期** back-fill (新 FR なし、fr-registry 46 件不変)。
- **carry 潰し**: `src/doctor/index.ts` に `checkHandover` (CURRENT.json 鮮度 surface、§5.3 warning) + `tests/doctor.test.ts` (5 test)。**biome 負債解消** (PLAN-L7-05): g3-trace dead 定数 5 本削除 + cli/detect/session-log/setup/frontmatter/各 test を pinned biome --write (全 13 ファイル、機能不変)。
- 検証: typecheck 0 / vitest **113 pass** (既存 92 + handover 16 + doctor 5) / biome **CLEAN 0** / CLI スモーク OK / code-reviewer review 全 6 周すべて反映・APPROVE。
- **HEAD = `27efe75`**、origin main へ push 済。untracked 2 件 (`helix-process/` `ai-agent-harness-directory-reference.md`) は policy-exempt。

## §3 Next Action

1. **【最優先 carry】CI biome subjob 有効化**: `harness-check.yml` に `bun run lint` を足す変更は確定済 (PLAN-L7-05 Step 4) だが、`.github/workflows` の push に **workflow スコープ PAT** が必要 ([[project_github_push_workflow_scope]])。**PO が「今はいらない」と判断 (2026-06-04) → deferred、ローカル commit も破棄済**。再開時: ① https://github.com/settings/tokens/new?scopes=repo,workflow で PAT 作成 → ② temp file (AppData/Local/Temp) に保存 → ③ `credential.helper=` で GCM bypass push → ④ 即 rm。repo は既に biome CLEAN なので即 green。
2. **handoverStale の lint/pre-push 配線**: §6.8.5「PLAN completed なのに handover 追記なし → warn」/ §5.3「CURRENT.json 24h stale warn」を `handoverStale`+`checkHandover` 基盤に `src/plan/lint.ts` (現 stub) 実装時に配線。現状 human-binding。
3. **運用ディシプリン**: PLAN 着手時に `ut-tdd plan use <id>` で current-plan を活性化すると session-log digest が populate され、終了時 `ut-tdd handover` が機械部を自動 prefill する。本 session は活性化が遅く digest が sparse だったため §1-§2 を git から手記入。

## §4 carry (未了・先送り)

- **CI biome subjob 有効化 (deferred)**: 上記 Next Action 1。PO 判断で今回見送り、token 入手時に follow-up。
- **state DB 登録トリガ (FR-L1-07 hook)** は §6.8.6 結節点の別経路で別 FR。本機構は digest→handover 橋まで。
- ~~repo biome 負債~~ → **解消済** (PLAN-L7-05、`27efe75`)。CI 有効化のみ残 (上記)。
- 前 handover (06-02d) の継続 carry: branch protection gh-api 実適用 / escalation-stale.yml 検出ロジック / kind×layer guard / G8-G14 ゲート。

## §5 未了 PO 判断

1. ~~CURRENT.md 廃止の承認~~ → **PO 承認済 (2026-06-04 "OK")、REVERSE-05 R3 PASS**。
2. ~~CI biome 有効化~~ → **PO「今はいらない」(2026-06-04)、deferred**。再開は §3 Next Action 1。
3. (残) 前 handover からの継続 PO 判断: REVERSE-02 R3 / kind×layer guard (§1.6 確定が前提でブロック中) / HELIX cutover タイミング。

## §6 壊さない / 再発させない

- **CURRENT.json が機械ポインタ正本** (CURRENT.md は廃止)。`handoverStale`/pre-push はこれを読む。二層 = CURRENT.json (機械) + docs/handover md (人間判断) を崩さない。
- **session-log の fail-open を壊さない**: commit 活性化配線は `onPostToolUse` の try/catch 内側。`resolveActivePlan` 本体は不変。
- **renderHandoverScaffold は全自由テキストに sanitize** (tracked md への credential 流出ゼロ)。
- **③-⑥ は AI が捏造しない** (human placeholder)。機械化するもの (今どこ) としないもの (次どう) を型で分離。
- **biome は repo 全体 CLEAN(0)**。`npm run lint` (pinned biome) で確認すること。**`npx biome` は最新版を取得し pinned と rule が違う**ため判定に使わない (本 session で誤判定の実害あり、PLAN-L7-05 §0)。
- **g3-trace.ts の trace 抽出は各 extractor の inline regex が正本** (削除した module 級定数は陳腐化 dead だった)。再び module 定数を足さない。
- **review 前置 MUST** / **subagent model 明示** / commit footer = `Co-Authored-By: Claude Opus 4.8 (1M context)` / **staged は明示ファイルのみ** (untracked 2 件は commit 禁止)。
