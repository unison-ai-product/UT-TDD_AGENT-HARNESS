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

---

# Session Handover — 2026-06-04 (session 2: V-model 正規式モデル Recovery — PLAN-RECOVERY-02)

> §1-§2 は session-log digest からの**機械 auto-prefill** (active=PLAN-RECOVERY-02)。digest が当日全 PLAN を含むため重複/`unknown` のノイズあり (→ IMP-048)。**正規式の確定内容は RECOVERY-02 §5、成果と次手は本 §2 末尾・§3 を正**とする。

## §1 PLAN サマリ

- `PLAN-DISCOVERY-01-workflow-metamodel` (poc): PLAN-DISCOVERY-01 (kind=poc): workflow メタモデル検証 (①必須+②駆動モデル→PLAN合成→駆動プラン→exit→fullback がきれいに回るか)
- `PLAN-L6-06-handover-mechanism` (add-design): PLAN-L6-06 (add-design): handover 記録機構の機能設計 — session-log PLAN digest → handover 生成 (機械ポインタ CURRENT.json + 人間判断 markdow…
- `PLAN-L7-04-handover-mechanism` (add-impl): PLAN-L7-04 (add-impl): handover 記録機構の実装 — src/handover + ut-tdd handover / plan use CLI + session-log 限定 amendment (cur…
- `PLAN-L7-04` (unknown): PLAN-L7-04
- `PLAN-L7-05` (unknown): PLAN-L7-05
- `PLAN-RECOVERY-02-vmodel-canonical` (recovery): PLAN-RECOVERY-02 (recovery): V-model 定義の前提欠落 — 正規式モデルへ収束 + L0-L3 fullback/フィックス
- `PLAN-RECOVERY-02` (unknown): PLAN-RECOVERY-02
- `PLAN-REVERSE-05-handover-mechanism` (reverse): PLAN-REVERSE-05 (reverse/fullback): handover 記録機構を上位整合へ back-fill — §6.8.5 follow-up done 化 + CURRENT.md→.json 表記同期 + §…
- `PLAN-REVERSE-05` (unknown): PLAN-REVERSE-05

## §2 成果物 (commit / files)

- `PLAN-DISCOVERY-01-workflow-metamodel`
- `PLAN-L6-06-handover-mechanism`
- `PLAN-L7-04-handover-mechanism`
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\handover\index.ts
- `PLAN-L7-04`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-REVERSE-05-handover-mechanism.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\governance\ut-tdd-agent-harness-requirements_v1.2.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\governance\ut-tdd-agent-harness-concept_v3.1.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\design\harness\L1-requirements\functional-requirements.md
- `PLAN-L7-05`
- `PLAN-RECOVERY-02-vmodel-canonical`
- `PLAN-RECOVERY-02`
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\process\forward\overview.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\process\forward\L07-implementation.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\process\forward\L08-L14-verification-phase.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\process\forward\L00-L06-design-phase.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\process\gates.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\governance\gate-design.md
  - file: Write C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\project_vmodel_canoni…
  - file: Edit C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\MEMORY.md
- `PLAN-REVERSE-05-handover-mechanism`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-04.md
- `PLAN-REVERSE-05`

> **本 session 2 のクリーン成果サマリ**: 検証/改善ロードマップ起票 (`docs/design/harness/L3-functional/roadmap.md`) → 粒度対照性 + WF↔設計対応 監査 (IMP-037〜046) → **V-model 定義の前提欠落を発見 → 正規式モデル確定 → Recovery (PLAN-RECOVERY-02) で docs→workflow→assets を整合**。RECOVERY-02 8 commit (`db79a3e`→`0d298df`)。正規式 = L0⇔価値検証 / 谷=3点合算 / 右腕=データ実在性エスカレーション / L2=L1分離、**非破壊**。vitest 113 pass / 機械 trace green。

## §3 Next Action

1. **【最優先・po-gate】L0-L3 freeze の PO サインオフ**: doc は正規式整合 + 機械 trace green = freeze-ready。PO が G0.5/G1/G3 を承認したら L1/L3 PLAN を confirmed 化し L4 着手起点を整える (RECOVERY-02 requires_human_approval)。
2. **L4 entry**: G3 freeze 後、L4 基本設計を正規式 (L4⇔L9 総合、検証本質=総合) で着手。
3. **【feature 対応・PO 指示】workflow 改善 4 件を Add-feature で実装 (IMP-047〜050)**: 作業効率・改善方針に直結するため **backlog 据え置きにせず feature (Add-feature 駆動: L6 機能設計 → L7 実装 → Reverse back-fill) として起票・実装**する。**次セッション (高性能時) で着手** — 本 session では実装させない (PO 2026-06-04「君は性能が落ちてるからこのまま実装までさせるつもりがない」)。全 4 件 backlog 記録済だが**未実装** (047-049=observed / 050=triaged)。
   - **IMP-047** handover-on-completion 強制: PLAN 完了/節目で handover+log 生成を強制 (`handoverStale` lint / Stop-hook / `doctor checkHandover` surface)。今回 PM が手動生成を忘れ PO 指摘 = workflow ギャップ。
   - **IMP-048** handover prefill digest ノイズ低減: §1-§2 auto-prefill を active plan / セッション境界で絞る + dedup (`src/handover`)。
   - **IMP-049** 直列/並列判定の強制・記録: PLAN §工程表 に各 Step の直列/並列 + 直列理由を明示する規約化 + `ut-tdd task classify/estimate` 判定支援。
   - **IMP-050** HELIX agent-slot Layer-2 移植: `src/runtime/agent-slots.ts` (fire/release/listActive/listStale) + `.ut-tdd/teams/*.yaml` strategy + 直列化 3 条件 (ファイル衝突/後段依存/共有状態) + doctor stale check + agent-guard 並列上限 warn。IMP-049 の機械支援の本体。**大規模 = 単独 Add-feature PLAN** に切り出す。

## §4 carry (未了・先送り)

- **L0-L3 最終 freeze (G1/G3)** = po-gate (Next Action 1)。
- **workflow 改善 feature 4 件 (IMP-047〜050)** = 作業効率/改善方針の feature。**全て未実装** (Add-feature で対応、Next Action 3)。handover-on-completion 強制 (047) / prefill ノイズ低減 (048) / 直列・並列判定の強制記録 (049) / HELIX agent-slot Layer-2 移植 (050、大規模 = 単独 PLAN)。
- session 1 からの継続 carry: CI biome subjob 有効化 / `src/plan/lint.ts` stub 実装 / REVERSE-02 R3 等。

## §5 未了 PO 判断

1. **L0-L3 freeze 承認** (正規式整合 + freeze-ready で G0.5/G1/G3 を freeze してよいか)。
2. RECOVERY-02 スコープに修正があれば指摘 (正規式モデル全表 = RECOVERY-02 §5)。

## §6 壊さない / 再発させない

- **正規式は非破壊**: 既存 L0-L14 番号・6 V-pair を動かさない。追加 (L0⇔価値) と明確化のみ。正本 anchor = concept §2.3。
- **定義修正は駆動モデル (Recovery) を通す**: 「アップデート」という非モデルの ad-hoc 編集をしない (PO 2026-06-04)。
- **PLAN完了/節目では log + handover を作る** (本指摘。IMP-047 で強制化目標)。
- エスカレーション列挙は右腕工程順 (実データ検証 L10 → 本番受入 L12)。

---


# Session Handover — 2026-06-04 (session 3: workflow 改善 feature IMP-047〜050 実装 — /goal B 達成)

> §1-§2 は機械 prefill が前セッション digest で stale だったため git から手記入 (REVERSE-06 の digest は Stop hook 未発火で不在 → IMP-048 の scope fallback が作動)。本 doc 自体が IMP-047 (handover-on-completion) の dogfood。

## §1 PLAN サマリ

| PLAN | kind | 何を | commit |
|------|------|------|--------|
| `PLAN-L7-06-handover-enforcement` | add-impl (IMP-047) | handover 規律の機械強制 — checkHandoverDiscipline + Stop-hook warn (+既存 doctor) | `5b09ee5` |
| `PLAN-L7-07-handover-prefill-scope` | add-impl (IMP-048) | prefill ノイズ低減 — sameFamilyPlan/dedupeDigests 常時 dedup + scopeToActive | `5b09ee5` |
| `PLAN-L6-07-agent-slots` | add-design (IMP-050) | agent-slots Layer-2 機構の機能設計 (slot lifecycle + team schema + 3条件) | `1acda2e` |
| `PLAN-L7-08-agent-slots` | add-impl (IMP-050/049) | src/runtime/agent-slots.ts + src/schema/team.ts + doctor/guard 配線 | `1acda2e` |
| `PLAN-REVERSE-06-workflow-improvements` | reverse/fullback (IMP-047/049/050) | §6.8.5 強制側 + §G.4 直列/並列規約 + 用語を上位整合へ back-fill | `1acda2e` |

## §2 成果物 (commit / files)

- **cluster 1 (`5b09ee5`)**: `src/handover/index.ts` (sameFamilyPlan/dedupeDigests/scopeToActive/readPointer/checkHandoverDiscipline) / `.claude/hooks/session-log.ts` (Stop warn) / `src/cli.ts` (--scope-active) / `tests/handover.test.ts` (U-HOVER-008〜010, +14)。
- **cluster 2 (`1acda2e`)**: `src/runtime/agent-slots.ts` (新規) / `src/schema/team.ts` (新規) / `src/doctor/index.ts` (checkAgentSlots) / `.claude/hooks/agent-guard.ts` (並列 warn) / `tests/agent-slots.test.ts` + `tests/team-schema.test.ts` (新規) / `tests/doctor.test.ts` (checkAgentSlots) / `.ut-tdd/teams/example-review-team.yaml` / `.claude/CLAUDE.md` + requirements §G.4 (直列/並列規約) / `docs/design/.../agent-slots.md` + L7-unit-test-design §1.9/§1.10 / `docs/improvement-backlog.md` (IMP-047〜050 implemented 化)。
- 検証: typecheck 0 / biome CLEAN / **vitest 147 pass** (113→+34) / **code-reviewer 2 周 APPROVE** (Important 全件反映: 閾値統一/単一 load-save/doctor test/推移マージ/drift null/dedup キー固定)。
- HEAD = `1acda2e` (push 前)。untracked 2 件 (`helix-process/` `ai-agent-harness-directory-reference.md`) は policy-exempt。

## §3 Next Action

1. **【最優先・po-gate】REVERSE-06 R3 検証**: 3 intent を PO 検証 — ①handover-on-completion を機械 surface で強制してよいか ②直列化は 3 条件 (file_conflict/downstream_dependency/shared_state) のみを正当理由とし「重いから直列」を排してよいか ③agent-slots は process governance (新 FR 不要) でよいか。OK で REVERSE-06 を confirmed 維持。
2. **session 2 からの継続最優先**: **L0-L3 freeze の PO サインオフ** (G0.5/G1/G3、RECOVERY-02、freeze-ready)。承認で L4 着手起点へ。
3. **L4 entry** (G3 freeze 後、L4⇔L9 総合)。

## §4 carry (未了・先送り)

- **IMP-051 (新規・PO 指摘、最優先 feature 候補)**: impl/add-impl PLAN が **Reverse back-fill + doc 整合 (§6 用語更新の L0 §10 back-merge / 上位 governance 整合) とセットか** を機械未検証。本 session で実装 commit 後に Reverse R4 back-fill を放置 → PO 指摘で完遂 = 再発ギャップ。state DB (V-model pair 完全性) で「Reverse 無き impl」「glossary 未 merge な impl」を `doctor`/`vmodel lint` が fail-close 検知する **新 FR (要件拡張)**。Add-feature で起票・実装、FR scope は PO 確定が前提。
- **IMP-047〜050 の残実装**: ①`src/plan/lint.ts` stub 解消時に handoverStale lint + §G.4 直列/並列トークン検証を配線 (IMP-047/049 の lint surface) ②pre-push hook で handover 強制 (IMP-047) ③team_runner 実行エンジン本体 (ThreadPoolExecutor 相当、hybrid mode 実装時、IMP-050)。いずれも本 cycle の core 実装の上に乗る追加配線で、機能の骨格は完成済。
- session 1-2 継続: CI biome subjob 有効化 (workflow scope PAT) / L0-L3 freeze (G1/G3) / REVERSE-02 R3 / kind×layer guard (§1.6 確定待ち)。

## §5 未了 PO 判断

1. **REVERSE-06 R3** (§3 Next Action 1 の 3 intent)。
2. **L0-L3 freeze 承認** (継続、RECOVERY-02)。
3. 直列/並列規約 (§G.4) の 3 条件で過不足ないか (file_conflict/downstream_dependency/shared_state)。

## §6 壊さない / 再発させない

- **agent-slots 全関数 fail-open / agent-guard は fail-close 不変**: recordGuardFire は guard の block 判定に一切干渉しない (try/catch 隔離)。slot I/O 失敗で Agent 呼び出しを止めない。
- **session-log Stop warn は fail-open**: handover discipline surface の失敗で作業を止めない (内側 try/catch、exit 0)。
- **handover prefill は常時 dedup + scopeToActive opt**: bare/slug ゴーストを畳む。digest は Stop hook 生成のため当該セッション PLAN は handover 時点で不在になりうる (§1-§2 手記入の余地は残る = IMP-048 の構造的限界、別途 carry)。
- **agent-slots.json は gitignored** (`.ut-tdd/state/*`)。runtime state を追跡しない。
- **biome は repo 全体 CLEAN(0)**。`npm run lint` (pinned) で確認、`npx biome` は使わない。
- review 前置 MUST / subagent model 明示 / commit footer = `Co-Authored-By: Claude Opus 4.8 (1M context)` / staged は明示ファイルのみ (untracked 2 件は禁止)。

---
# Session Handover — 2026-06-04 (session 4: 駆動モデル→設計 back-fill 制御機構 IMP-051 — /goal 達成)

> §1-§2 は git から手記入 (REVERSE-07 の digest は Stop hook 未発火で不在)。本機構自身が自分の back-fill 完全性検査を pass する (ドグフード)。

## §1 PLAN サマリ

| PLAN | kind | 何を | commit |
|------|------|------|--------|
| `PLAN-L6-08-backfill-pairing` | add-design (IMP-051) | 駆動モデル back-fill pairing 完全性の機能設計 (KIND_BACKFILL マトリクス + 2 検査) | `af11c82` |
| `PLAN-L7-09-backfill-pairing` | add-impl (IMP-051) | src/lint/backfill-pairing.ts + doctor checkBackfill (warn-first) | `af11c82` |
| `PLAN-REVERSE-07-backfill-pairing` | reverse/fullback (IMP-051) | §1.10.E2 + 起票ルール + L0 §10 用語 back-fill。要件拡張 (V-pair 完全性の対象拡張) | `af11c82` |
| (関連 backlog) | doc | IMP-051 起票→implemented 化 | `1bf58f4`/`af11c82` |

## §2 成果物 (commit / files)

- **`src/lint/backfill-pairing.ts`** (新規): `KIND_BACKFILL` マトリクス (kind→back-fill 要否の機械正本) + `analyzeBackfill` (reverse.requires→impl の向きで「Reverse 無き impl」検出 + §6 用語→L0 §10 照合) + parseRequires / parseGlossaryTerms (/m と $ の罠回避) / normalizeTerm (複合ラベル表記ゆれ吸収) / endsWith 境界固定。
- **`src/doctor/index.ts`**: `checkBackfill` を runDoctor に warn-first 配線 (I/O 失敗は note)。
- **`tests/backfill-pairing.test.ts`** (新規): U-BACKFILL-001〜006 + endsWith 誤判定ガード + **実 repo 完全性回帰ガード** (孤児 0 / glossary gap 0)。
- **governance back-fill** (REVERSE-07 R4): requirements §1.10.E2 (機械検証条件) / .claude/CLAUDE.md 起票ルール (add-impl→Reverse 必須 / §6→§10 back-merge) / concept §10 用語 (back-fill pairing / KIND_BACKFILL マトリクス)。
- **実 repo 孤児解消**: `PLAN-REVERSE-02` の requires に L7-01 追加 (PO 指摘の draft 放置に起因する未 pairing を構造修正)。
- 設計記録: `docs/design/.../backfill-pairing.md` + L7-unit-test-design §1.11 U-BACKFILL。
- 検証: typecheck 0 / biome CLEAN / **vitest 159 pass** (147→+12) / `ut-tdd doctor` backfill 行稼働 / **自己ドグフード pass** (本機構の PLAN 群が自分の検査を通る) / 主要リスク (endsWith 誤判定) 自己 review 反映。
- HEAD = `af11c82`、origin main へ push 済。untracked 2 件は policy-exempt。

## §3 Next Action

1. **【最優先・po-gate】REVERSE-06 + REVERSE-07 の R3 検証** (2 件まとめて):
   - REVERSE-06: ①handover-on-completion 機械強制 ②直列化 3 条件のみ正当 ③agent-slots=新 FR 不要。
   - REVERSE-07: ①駆動モデルは「設計まで戻す」までが 1 サイクル ②add-impl は Reverse 合流必須 / glossary back-merge は impl 完了条件 ③当面 warn-first (fail-close は lint engine 実装時)。
2. **継続最優先**: L0-L3 freeze の PO サインオフ (G0.5/G1/G3、RECOVERY-02、freeze-ready)。
3. **fail-close 昇格**: `src/plan/lint.ts` (stub) 実装時に checkBackfill / handoverStale / §G.4 直列並列トークンを exit code 連動の fail-close へ (現状すべて warn-first)。

## §4 carry (未了・先送り)

- **warn-first → fail-close 昇格**: backfill / handover discipline / §G.4 直列並列 は plan lint engine (`src/plan/lint.ts` stub) 実装時に exit 連動へ。本 session で骨格・surface は完成、強制 (block) のみ残。
- **REVERSE-02 status**: requires は構造修正したが status=draft のまま (R3 PO 検証が前提)。R3 で confirmed 化する。
- IMP-047〜050 残: lint トークン検証 / pre-push / team_runner 実行エンジン本体 (前 session §4 参照)。
- session 1-2 継続: CI biome subjob (workflow PAT) / L0-L3 freeze / kind×layer guard (§1.6 確定待ち)。

## §5 未了 PO 判断

1. **REVERSE-06 + REVERSE-07 R3** (§3 Next Action 1)。
2. **L0-L3 freeze 承認** (継続)。
3. KIND_BACKFILL マトリクスの要否が駆動モデルとして過不足ないか (add-impl=required / refactor 等=conditional / forward impl・recovery=none)。

## §6 壊さない / 再発させない

- **back-fill 完全性は warn-first**: `analyzeBackfill` の ok は required orphan と glossary gap が無いことのみ (conditional は warn、doctor.ok を落とさない)。fail-close 化は段階。
- **検査の向き**: 「Reverse が impl を requires する」向きで pairing を辿る。add-impl 起票時は必ず対応 Reverse の requires に自分を載せる (.claude/CLAUDE.md 起票ルール)。
- **§6 用語更新 は L0 §10 へ back-merge 必須**: 宣言した語が glossary に無いと doctor が warn。impl 名を §6 に書くなら §10 にも載せる (living glossary)。
- **parseGlossaryTerms の section 抽出は /m を付けない** (`$` が行末になり section が空になる罠。コメント済、再発させない)。
- **endsWith 判定は `/`+id+`.md` 境界固定** (別 plan_id の suffix 誤マッチ防止)。
- **「実装したのに Reverse/用語集に戻していない」状態で完了扱いにしない** (本 session の主題。doctor backfill 行で常時確認)。
- review 前置 MUST / subagent model 明示 / commit footer = `Co-Authored-By: Claude Opus 4.8 (1M context)` / staged は明示ファイルのみ。

---

# Session Handover — 2026-06-04 (session 5: 全 Reverse 完全クローズ — /goal 達成)

> PO 委譲「全リバースの検証ならびに実行で完全クローズ」を完遂。draft 残 2 件 (REVERSE-01/02) を検証・残実行して confirmed 化。

## §1 PLAN サマリ

| PLAN | 対応 | commit |
|------|------|--------|
| REVERSE-06 / REVERSE-07 | R3 Intent 検証 (全 6 intent HOLDS) → confirmed | `40e0757` |
| REVERSE-02-session-log | R3 PASS (新 FR 不要 + back-fill 実在 + L7-01 pairing) → confirmed | `0a68e00` |
| REVERSE-01-process-docs | 残実行 (V1 close / V2 tree / V4 §G.1 注記 / PROVISIONAL外し 16 ファイル) + R3 → confirmed | `0a68e00` |

## §2 成果物

- **全 7 REVERSE PLAN が status=confirmed** (01〜07)。R3 はすべて記録済 (03/04/05 は既存 PASS、06/07 は intra_runtime_subagent + 客観 evidence、01/02 は本 session)。
- docs/process/{forward,modes,gates} 16 ファイルの PROVISIONAL→正本化 (grep PROVISIONAL = 0)。
- requirements §1.10.G.1 に内部資産拡張 sub-doc 注記 (V4)。
- 検証: vitest 159 pass / doctor backfill 孤児 0・glossary gap 0 (conditional note のみ)。

## §3 Next Action

1. **継続最優先**: L0-L3 freeze の PO サインオフ (G0.5/G1/G3、RECOVERY-02、freeze-ready)。Reverse が全クローズしたので上流 freeze の障害なし。
2. **L4 entry** (G3 freeze 後)。
3. **fail-close 昇格** (carry): `src/plan/lint.ts` 実装時に backfill/handover/§G.4 直列並列を exit 連動へ。

## §4 carry

- PO 追認 (軽微・非 blocking): ① migration default=fullstack ② mode↔drive 呼称分離 (用語集)。
- warn-first → fail-close 昇格 (plan lint engine 実装時)。
- IMP-047〜051 残配線 (lint トークン / pre-push / team_runner 本体)。
- CI biome subjob (workflow PAT) / kind×layer guard (§1.6 確定待ち)。

## §5 未了 PO 判断

1. L0-L3 freeze 承認 (継続)。
2. PO 追認 2 件 (上記 §4、軽微)。

## §6 壊さない / 再発させない

- **全 Reverse confirmed = V-model 左腕の孤児解消が一巡**。今後 add-impl を起こしたら必ず対応 Reverse をセットで起こす (doctor backfill が孤児を surface)。
- PROVISIONAL外し済の docs/process は運用正本。規範変更は concept/requirements 先行 → docs/process へ反映 (逆流させない)。
- R3 は PO 直接検証が原則だが、PO 委譲時は intra_runtime_subagent + 客観 evidence で代替し PLAN に記録する。

---

# Session Handover — 2026-06-04 (session 6: carry 整理・解消 + フェーズ1 (L0-L3) 見直しサイクル2巡目 — /goal 達成)

> PO /goal「キャリー整理と解消。フェーズ1における見直しサイクル2巡目を完遂する」を受け、roadmap §1 改善サイクル (観点A workflow / 観点B V-pair 同粒度) を L0-L3 へ**2巡目**適用。1巡目残課題の検証 + 新残差抽出 (pmo-sonnet 2体並列委譲) → 解消可能を実装、PO 判断要を §5 記録。§1-§2 は git から手記入 (handover prefill の digest ノイズ = IMP-048 既知限界)。

## §1 サマリ (PLAN ではなく改善サイクル)

| 区分 | 何を | commit |
|------|------|--------|
| 即時 carry (doctor) | agent-slots release 漏れ (最後の guard slot が永久 running) を構造解消 + L7-05 confirmed 化 | (本 commit) |
| Phase1 2巡目 観点A | roadmap 現状接地ドリフト / gates G8-G14 carry / Incident layer 排他読み方 を doc 解消 | (本 commit) |
| Phase1 2巡目 観点B | L1-operational §0 件数表統一 / L3-acc §1.2 注記内訳統一 を doc 解消 | (本 commit) |
| carry living化 | IMP-052〜060 を improvement-backlog へ登録 (implemented 5 / triaged 4 / observed 1) | (本 commit) |

## §2 成果物 (commit / files)

- **`src/runtime/agent-slots.ts`**: `sweepStaleGuardSlots` 新規 (agent_guard 由来 stale active slot を閾値超で cancelled 失効、never-throws fail-open)。release hook 不在で「セッション最後の slot が次 fire まで永久 running」になる構造欠陥を SessionStart self-heal で解消。`recordGuardFire` の対象判定も `status==="running"` を追加し 3 経路 (sweep/recordGuardFire/listActive) で一致 (review I-1)。
- **`.claude/hooks/session-log.ts`**: SessionStart で `sweepStaleGuardSlots` 呼び出し (fail-open、agent-guard の fail-close に非干渉)。
- **`tests/agent-slots.test.ts`**: U-SLOT-007 (失効/部分スキップ/冪等、+3) → vitest **162 pass** (159→+3)。
- **doc 解消**: roadmap §3 現状接地 (L2=5 doc 実在) / gates §1 注記 (G8-G14 carry→IMP-052) / modes README (multi-kind セル= kind 応じた択一、1 PLAN 両載せ不可) / L1-operational §0 (L3-acc §0 と同形式の件数表: BR/FR-L1 46/SR 14画面/TR/NFR 15/UX + 孤児=0 + G1-trace。FR-L1-36/38/43 除外理由明記 = review I-3) / L3-acceptance §1.2 注記 (category 別 9+6+1=16 に統一) / PLAN-L7-05 status=confirmed + `backfill_required:false`。
- **improvement-backlog**: IMP-052〜060 登録。implemented=053/054/055/056/057、triaged=037継続/058/059/060、observed=052。
- **roadmap §5 ログ**: Phase 1 2巡目の行を追記 (living doc 更新)。
- 検証: typecheck 0 / **vitest 162 pass** / biome CLEAN / doctor (handover OK / agent-slots OK / backfill note のみ) / **code-reviewer APPROVE** (件数 FR-L1 46/NFR 15/SR 14 を node 照合・一致確認、I-1/I-3/m-1 反映)。

## §3 Next Action

1. **継続最優先 (PO 判断)**: 下記 §5 の 2 件 — ① **layer 表記規約 (IMP-037/059)** の確定 (4 doc 実施層 vs L7-unit 作成層、vmodel-lint の pairing key に効く新規決定) ② **DISCOVERY-01 S4** decision_outcome 記録 (PO 権限、concept §2.5 promote の前提)。この 2 件が解けると IMP-058 (wireframe pair_artifact) / concept §2.5 back-fill が連鎖で進む。
2. **recovery 正本二重 (IMP-060)**: recovery.md §6 と docs/governance/recovery-workflow.md の差分確認 → 統合/廃止方針を PO 確定後 Reverse/Refactor で解消。
3. **fail-close 昇格 (継続 carry)**: `src/plan/lint.ts` stub 実装時に backfill/handover/§G.4 直列並列 + IMP-035 (recovery aim 必須) を exit 連動へ。

## §4 carry (未了・先送り)

- **PO 判断要 (§5)**: layer 規約 (037/059) / DISCOVERY-01 S4 / recovery 正本二重 (060)。
- **IMP-058** wireframe.md pair_artifact:(TBD) = IMP-037 規約確定と同時解消。
- **IMP-052** G8-G14 機械化 PLAN 未起票 = Phase 3/5 で起票 (carry 所在は gates.md→backlog で追跡可)。
- 継続: CI biome subjob (workflow PAT、deferred) / kind×layer guard (§1.6) / IMP-047〜051 残配線 (lint トークン/pre-push/team_runner 本体)。

## §5 未了 PO 判断

1. **layer 表記規約 (IMP-037/059)**: test-design frontmatter の `layer` を **作成層基準** (L7-unit の `layer:L6`+`executed_at_layer:L7`) と **実施層基準** (他 4 doc の `layer:L8/L9/L12/L14`) のどちらに統一するか。多数決は実施層 4:1 だが、V-pair の pairing key (L6 設計⇔L6 作成の単体テスト設計) としては作成層基準が整合的という反論あり。vmodel-lint が pairing に使うため**正本の確定が必要** (PM 単独確定せず routing 維持)。推奨を出すなら「両保持 (`layer`=作成層 + `executed_at_layer`=実施層) を全 doc へ統一」が情報損失ゼロ。
2. **DISCOVERY-01 S4**: workflow メタモデル PoC の decision_outcome を PO が記録 (S3 verify は完成済)。確定で concept §2.5 Discovery 定義の promote (mode doc が先行拡張した L1/L3-L6 合流点を concept へ back-fill) が解ける。
3. **recovery 正本二重 (IMP-060)**: docs/process/modes/recovery.md (正本化済) と docs/governance/recovery-workflow.md (「当面の正本」注記) の統合/廃止方針。

## §6 壊さない / 再発させない

- **sweepStaleGuardSlots は SessionStart 専用の self-heal** (閾値超の agent_guard slot のみ失効)。within-session の dangling は recordGuardFire の遅延失効 or 次 SessionStart が掃除する設計 = doctor の session 内 stale warn は異常ではない。全 active を無条件失効させない (短時間再起動の running agent 誤失効防止)。
- **agent-slots 全関数 fail-open / agent-guard は fail-close 不変**: session-log hook への sweep 追加は agent-guard の block 判定に非干渉。
- **2巡目で「改善=実装」を徹底**: routing で逃げたのは PO 判断/schema 契約に効く 3 件 (037/S4/060) のみ。doc 残差は同 cycle で実装解消。
- **roadmap・improvement-backlog は living**: 現状接地ドリフト (L2=placeholder) を 2巡目で検出・修正。次サイクルも §5 現在地 + backlog の鮮度を節目で更新する。
- review 前置 MUST / subagent model 明示 (本 session: pmo-sonnet×2 + code-reviewer すべて sonnet 明示) / commit footer = `Co-Authored-By: Claude Opus 4.8 (1M context)` / staged は明示ファイルのみ (untracked 2 件 helix-process/・ai-agent-harness-directory-reference.md は commit 禁止)。

---

# Session Handover — 2026-06-04 (session 7: PO 判断要 3件を解消 + フェーズ1 3巡目 刊行 — /goal 達成)

> PO /goal「3件の問題を解消して、フェーズ1サイクル3巡目を刊行」を達成。2巡目で「PO 判断要」とした 3件を PO「解消して」授権で実装解消し、3巡目サイクルを roadmap §5 に刊行。**review 前置 code-reviewer が process 違反 (PoC confirmed→Reverse 欠落) を検出 → REVERSE-08 起票で解消** (harness の dogfood が harness ルールに従う)。

## §1 解消した 3件 + 3巡目

| # | 懸案 | 解消 | 主 commit |
|---|------|------|-----------|
| 1 | layer 表記規約 (IMP-037/058/059) | 全 5 test-design を `layer`=作成層(V-pair key=next_pair_freeze 一致) + `executed_at_layer`=実施層 に統一 (両保持)、規約を roadmap §2 明文化、L2 pair_artifact 確定 | (本 commit) |
| 2 | DISCOVERY-01 S4 (IMP-064 派生) | decision_outcome=confirmed (reuse-with-hardening) + concept §2.5 promote + **REVERSE-08 vehicle 起票** (§1.2 準拠) | (本 commit) |
| 3 | recovery 正本二重 (IMP-060) | recovery-workflow.md を recovery.md へ統合 (トリガー分類/本線5-step/reopen可変/適用記録)、superseded 化 | (本 commit) |
| — | 3巡目 sweep (IMP-061/063/064) | .gitkeep stale / roadmap §2 self-pair 注記 / PoC→Reverse 欠落 を解消 | (本 commit) |

## §2 成果物 (commit / files)

- **layer 規約**: `docs/test-design/harness/{L1-operational,L3-acceptance,L7-unit,L8-integration,L9-system}-test-design.md` の frontmatter `layer`→作成層 + `executed_at_layer` 追加 + 本文ヘッダ整合。`roadmap.md §2` に規約注記。`L2-screen/{wireframe(self),screen-list,screen-flow,ui-element}.md` の pair_artifact 確定。
- **DISCOVERY-01 promote**: `PLAN-DISCOVERY-01` frontmatter (S4/confirmed/promotion_strategy) + DoD box + §1.1 vehicle 参照。`concept_v3.1.md §2.5` Discovery 行 + 補足 bullet + `§10.2` 用語「確証なき設計」。**新規 `PLAN-REVERSE-08-discovery-metamodel.md`** (reverse/normalization、requires=DISCOVERY-01)。
- **recovery 統合**: `docs/process/modes/recovery.md` §2 トリガー分類 + 本線5-step + reopen可変 + §5.1 適用記録、§6 注記更新。`recovery-workflow.md` superseded banner。`repository-structure.md §2` + `docs/process/.gitkeep` 更新。
- **backlog**: IMP-037/058/059/060/061/063/064 → implemented、IMP-062 → verified。
- **roadmap §5**: 3巡目サイクルを刊行 (ログ追記)。
- 検証: typecheck 0 / **vitest 162 pass** / biome CLEAN / doctor (handover OK / agent-slots OK / backfill 孤児0・glossary merge済) / pmo-sonnet 3巡目整合 A-1〜A-5 OK / **code-reviewer APPROVE** (Critical 0、IMP-064 解消確認、Minor 3 のうち 2 反映)。

## §3 Next Action

1. **Phase 1 主要懸案は全クローズ** (layer 規約 / DISCOVERY-01 S4 / recovery 二重) — **残 PO 判断要 = 0**。次は Phase 2 (L4-L6) 改善サイクル、または L0-L3 Forward freeze の PO 判断 (※これは PO 起点、こちらから急かさない)。
2. **fail-close 昇格 (継続 carry)**: `src/plan/lint.ts` stub 実装時に scrum_reverse_lint (IMP-064 再発防止) / backfill / handover / §G.4 直列並列 / IMP-035 (recovery aim) を exit 連動へ。
3. **IMP-052** G8-G14 機械化 PLAN は Phase 3/5 で起票 (carry、gates.md→backlog で追跡可)。

## §4 carry (未了・先送り)

- **warn-first → fail-close 昇格** (plan lint engine 実装時): scrum_reverse_lint / backfill / handover discipline / §G.4 直列並列。
- IMP-047〜051 残配線 (lint トークン / pre-push / team_runner 本体)。
- CI biome subjob (workflow PAT、deferred) / kind×layer guard (§1.6)。
- Phase 2 (L4-L6) 改善サイクル本検証 (L4/L5 テスト設計 doc 起票含む)。

## §5 未了 PO 判断

- **Phase 1 の PO 判断要 = 0** (3件すべて本 session で解消)。
- (任意) DISCOVERY-01 S4 を PO「解消して」授権で confirmed 記録した点に異論があれば指摘 (decision_outcome は本来 PO 所有。授権解釈で記録、覆せる)。
- (任意) recovery 統合のスコープ (3 固有内容の移管粒度) に過不足あれば指摘。

## §6 壊さない / 再発させない

- **harness の dogfood が harness ルールに従う**: PoC confirmed → 必ず reverse PLAN を vehicle にする (concept §2.5 等への inline promote だけで済ませない = §1.2/scrum_reverse_lint 違反、IMP-064 の再発防止)。confirmed poc に reverse が無い状態を作らない。
- **test-design layer 規約**: `layer`=作成層 (V-pair pairing key = next_pair_freeze 一致) / `executed_at_layer`=実施層。L7-unit が template。vmodel-lint はこの `layer` で左腕設計と pairing する。
- **recovery 正本 = docs/process/modes/recovery.md (単一)**。recovery-workflow.md は superseded (historical)。規範変更は recovery.md 側で。
- **concept は上位正本**: §2.5 promote は DISCOVERY-01 §1.1 の文言に忠実、discovery.md と一致を保つ (逆流させない)。
- **CURRENT.json は forward-slash で書く** (`\h`/`\s` は不正 JSON エスケープ → doctor「壊れています」。前 session の heredoc `\\\\` 起因の実害)。
- **agent-slots は session 内で dangling が出るのが正常** (SessionStart sweep / 次 fire で self-heal)。commit 前に手動 sweep でクリーン化可。
- review 前置 MUST (本 session: pmo-sonnet×3 + code-reviewer×2、全 sonnet 明示) / commit footer = `Co-Authored-By: Claude Opus 4.8 (1M context)` / staged は明示ファイルのみ (untracked 2 件は禁止)。
