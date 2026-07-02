# A-173 - 全駆動モデル (mode) 精査 / 設計カバレッジ監査

- **date**: 2026-07-02
- **scope**: docs/process/modes/ 全 11 doc + docs/process/forward/ 4 doc + gates.md を対象に、①正本 substance ②exit 条件の機械強制 (research 第二 exit 素通り類の横展開) ③設計カバレッジ (出典 anchor → schema → lint → doctor → test の降下鎖) を精査 (PO 依頼)。
- **method**: 並列 subagent 3 面 (modes 前半 5 / modes 後半 6 / Forward+gates) + 機械層 (schema/route-map/lint 配線) の直接照合。critical/high 主張は本 session が抜き打ち再検証 (1 件反証・棄却済み)。
- **baseline**: work/l10-l14-local-close (A-172 と同系列、Pack レビューの後続)。

## 総括

**骨格は堅い**: VALID_KINDS 12 種 = requirements §1.3 一致、VALID_DRIVES 5 種 (mode 値混入は解消済み)、branch prefix ↔ kind 強制 (branch-kind)、signal → mode routing (route-map 14 entry)、frontmatter superRefine (poc/reverse/recovery の layer・phase・必須フィールド) は fail-close で機能。lint-wiring meta-gate = 76 lint 配線 / 死蔵 0。G8/G9/G10 は機械化済み・doctor 配線・green。出典 anchor (concept §2.5-§2.6 / requirements §1.3-§1.8) はほぼ全て実在。

**系統欠陥は 2 パターン**: (A) 最新 mode の back-merge 未着地 (design-bottomup)、(B) 「exit 条件は doc に書いてあるが機械が見ていない」層が全 mode に残る (research 第二 exit と同型の absence-blindness)。特に **contract 関数が実装+テスト済みなのに enforcement 未接続** という中間形態が複数あり、lint-wiring の監視境界 (src/lint/* のみ) の外側が盲点になっている。

## Findings

### F-1 [critical] design-bottomup mode の back-merge 未着地

機械層は稼働済み (`src/schema/route-map.ts:74`、`src/workflow/routing-contracts.ts`、`contracts-policy.ts`、`design-elicitation.ts`) なのに:

- `docs/process/modes/design-bottomup.md` 不在
- modes README §2 台帳・§3 対応表に未掲載
- concept §2.5 は 9-mode のまま (10 mode 化未反映)
- `src/lint/drive-model-passage.ts` EXPECTED_MODES (9 種) に未登録

PLAN-DISCOVERY-07 (status=confirmed) の Step 5 が正にこの back-merge を要求。ただし Step 5 には「PO gate (規範変更は concept/requirements 先行・PO サインオフ必須)」の注記があり、**意図的 PO 待ちか confirmed 先行の逸脱かは PO 確認事項** (deviation 断定はしない)。routing: `deviation -> recovery` 候補として route eval 実走済み (route-approval.jsonl 2026-07-02)。

### F-2 [critical] retrofit.md が存在しないコマンドを必須手順として記載

`docs/process/modes/retrofit.md:34,84` が `ut-tdd doctor --preflight upgrade` を必須と記載するが、該当サブコマンド/フラグは不在。実在は `ut-tdd guard preflight` (`src/cli.ts:893`)。upgrade 高リスク時の必須手順が実行不能 = retrofit 実行者を確実にブロックする。加えて retrofit は exit 4 条件全てが機械未強制で最薄 mode。

### F-3 [important] contract 関数の enforcement 未接続 (横断パターン)

実装+テスト済みだが doctor/gate に未配線:

- `evaluateRetrofitMatrix` (`src/workflow/contracts.ts:435`、test 有) — retrofit-matrix 完了 exit が実質未強制
- `evaluateResearchDecision` (`src/workflow/contracts.ts:449`、test 有) — research の ADR/memo/接続先 exit が実質未強制 (A-156 第二 exit 所見と同根)

lint-wiring は src/lint/* のみ監視するため、workflow/contracts 層の enforcement 資産の死蔵を検出できない (meta 盲点)。

### F-4 [important] Reverse の右腕 exit 未強制 2 件

schema 強制は最厚 (R0-R4 phase / R3 po role = plan/lint.ts:212 / forward_routing+promotion_strategy superRefine) だが:

- ③テスト設計確定 (missing_pair_artifacts 記録 or as-is 復元) を R4 close 前に検証する lint 不在 (`reverse.md:65-66`) — ③不在のまま R4 close 可能
- 再入先 pair-freeze gate (G1/G3/G4/G5) 通過義務 (`reverse.md:85-96`) の cross-PLAN 検証不在 (screen-impl-pair-freeze は UI 専用)
- `--invalidate-forward` は stub (doc 自己申告)

### F-5 [important] 人間サインオフ証拠の fail-close 不在 (横断)

Recovery (tl+po)、Incident (三者確認)、Scrum S4 (po 受入) の人間承認が PLAN body 証拠として検証されない。RouteApprovalPolicy は schema として存在するが PLAN への投影チェックがない。A-156 で既知の approval `policy_missing` と同根 (承認動線が audit 上完結しない)。

### F-6 [important] mode 固有構造の未強制 (各論)

- Incident: 2-PLAN 分割 (troubleshoot + recovery の requires 紐付け) 未強制 (`incident.md:44`)
- Recovery: 再発防止 3 要件 (root cause / guard 具体変更 / L14 route) の body lint 不在 (`recovery.md:100-102`、「①のみの prose 不可」と宣言済みなのに機械は見ない)
- Discovery: `verify/*.sh` の存在/実行成功チェック不在 (`discovery.md:33`)
- Scrum: Reverse fullback の昇華先 (`forward_routing ∈ {L1,L3,L4,L5}`) 検証不在 — 禁止値でも素通り
- Add-feature: add-impl → Reverse 起票の機械確認不在 (KIND_BACKFILL=required は宣言のみ、scrum-reverse lint は poc 限定)
- version-up: exit 条件節が doc に不在、activation 時の version_target 除去 + parked への requires trace 未強制、passage lint EXPECTED_MODES 未登録 (design-bottomup と同様)

### F-7 [important] Forward/gates の被覆 gap

- CLAUDE.md の Forward サイクル末尾 `accept` に対応する canonical コマンドが CLI に不在 (`plan complete` は名称・機能不一致)
- G1-content (5 sub-doc 揃い) の doctor 専用エントリなし / G2・G4・G5 layer pair gate は gate コマンド経由のみで doctor hard chain 未配線 / G14 本体未実装 (l14-close-audit は Close 手順監査で別物)
- G11-G13 は「概念定義・機械化は将来」と gates.md 自身が明記 = 意図的 carry (欠陥ではない)

### F-8 [minor]

- refactor.md:22 の出典が `docs/skills/refactoring.md` (stale path、実体は root `skills/refactoring.md`) — Pack レビュー (A-172) の同所見と同根
- Scrum/Discovery が frontmatter 上区別不能 (§1.10.A 意図的トレードオフだが、mode 起動記録が DB に無く進捗集計が混在)
- kind×drive matrix (§1.6) は依然 schema 未強制 (PO の §1.6 確定待ち、既知)
- modes README §3 の「9-mode」表記は version-up 含め実質 10 (+design-bottomup で 11) と古い
- green-command-digest: 102 件 stale は advisory 扱い (strict flag で fail-close 化可能、PLAN-L7-132 で意図的 soft 化)

### 反証・棄却 (1 件)

- 「checkCodingRules が doctor 未配線」(subagent 報告の critical) は**誤り**: `src/doctor/index.ts:1042` で配線済み。lint-wiring の wired=76 とも整合。抜き打ち検証で棄却。

## Routing (research 第二 exit、実走済み)

| finding | type | route |
|---|---|---|
| F-1 design-bottomup back-merge | `deviation` (PO 確認待ち — 意図的 PO gate の可能性) | Recovery via `regression_dev` |
| F-2 retrofit 誤コマンド | `latent-defect` | Add-feature via `feature_addition` (doc 修正 + doc 内 cited-command 実在 lint 候補) |
| F-3〜F-7 enforcement 未接続群 | `feature-gap` | Add-feature via `feature_addition` (優先順は PO 判断: F-3 配線 → F-4 Reverse 右腕 → F-5 承認証拠 → F-6 各論 → F-7 gates) |
| F-8 minor 群 | `smell` | Refactor via `code_smell` |

route eval 実行証跡は `route-approval.jsonl` (2026-07-02)。auto_create=false、起票は PO 承認後。

## Boundary

本監査は所見の記録と routing 候補接続まで。修正 commit・PLAN 起票は含まない。G11-G13 の意図的 carry と §1.10.A トレードオフは欠陥として扱わない (verify-intent 原則)。
