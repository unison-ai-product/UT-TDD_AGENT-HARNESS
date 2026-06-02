# Session Handover — 2026-06-02d (runtime-parity audit 確定 + ut-tdd setup solo/team を Add-feature 経路B で完走)

> 前 handover (`session-handover-2026-06-02c.md`、forced-stop) の続き。本 session は (1) 未コミットの **runtime-parity L0-L3 audit** を review→確定→push、(2) PO 依頼の **`ut-tdd setup` solo/team (GitHub 設定の参加規模別出し分け)** を Add-feature 標準ライフサイクル 経路B (L6 機能設計 → L7 実装 → Reverse 上位整合 back-fill) で 1 サイクル完走した。§6.8.5 に基づく。

## §0 現在地 (一言)

HEAD = `c6dd883`、main は本 session 分すべて push 済 (untracked 2 件 `helix-process/` `ai-agent-harness-directory-reference.md` は policy-exempt で維持)。**typecheck 0 / vitest 92 pass (13 files、既存 85 + U-SETUP 7) / fr-registry-audit 46 件不変 / 自作ファイル biome clean / CLI スモーク OK**。`ut-tdd setup` solo/team = ① 設計 + ③ テスト設計 + ② 実装 + ④ テスト + 8 テンプレ + 上位整合 (§6.5 / L4 external-if / L0 §10 用語) back-fill まで揃い、**Add-feature 経路B を 3 例目の実機能で dogfood** (1=session-log / 2=forced-stop / 3=setup)。

## §1 PLAN サマリ (本 session、全 push 済)

| PLAN | kind | 成果物 | commit |
|------|------|--------|--------|
| (audit) | — | runtime-parity-l0-l3-design-audit-2026-06-02.md + 9 defect fix + review 残存 stale 4 件追補 | `4123bf0` |
| PLAN-L6-05-setup-solo-team | add-design (L6) | setup-solo-team.md (①) + L7-unit-test-design §1.7 U-SETUP (③) | `e730109`(PLAN) / `bc11a68`(設計ペア) |
| PLAN-L7-03-setup-solo-team | add-impl (L7) | src/setup/index.ts + cli setup + tests/setup.test.ts (②④) + docs/templates/github/{common,team}/ 8 件 | `3b009b1` |
| PLAN-REVERSE-04-setup-solo-team | reverse/fullback | §6.5 / L4 external-if §3 / L0 §10.3 用語 back-fill | `c6dd883` |

## §2 何を作ったか (機能)

- **`ut-tdd setup`** (フラグ無し): 参加規模を gh で検出 (owner 種別 / collaborator 数 / 既存 CODEOWNERS・protection) → solo(0-A)/team(0-B) を理由つき**提案** → 人間確認 → 確定 phase を `.ut-tdd/state/setup.json` に記録。`--solo`/`--team` 上書き、`--dry-run`、検出不能・非対話は **solo 安全フォールバック**。**数だけで自動確定しない**。
- **GitHub 設定の出し分け**: 共通(A) = harness-check.yml / ISSUE・PR テンプレ / commitlint / escalation-stale.yml。team(B) = CODEOWNERS (team 名は `--tl-team` 等で注入、all-or-nothing) + setup-branch-protection.sh。
- **file vs GitHub-API 境界**: ファイルは harness が emit。branch protection / Required 化は gh-api 操作で **既定 emit-only** (script 生成、適用は admin 人間)。`--apply-branch-protection` + **対話下のみ**ガード付き適用 (非対話は precondition で封鎖)。
- **契約関数 7 本** (`src/setup/index.ts`): detectProjectScale / recommendPhase / planSetup / emitSetup / recordSetupState / applyBranchProtection / runSetup。deps 注入 (gh/fs/confirm/isInteractive/templates)、renderArtifacts は emitSetup 内部 helper。

## §3 確立した概念 / 判断 (再発防止のため明記)

- **`ut-tdd setup` = Phase 0 bootstrap (工程外)**: concept §512 が「リポジトリ初期化・Branch Protection 等の基盤整備は Phase 0 (工程外)」と明示 → setup は L1/L3 の FR ではなく §6.5/§9.1/§10 governance 側の要件。**新 FR を起こさない** (fr-registry-audit 46 件不変)。Reverse R3 PASS の根拠。
- **token を一切持たない**: 検出は gh 認証状態に委譲 (raw token 非読取)、recordSetupState は signals を 4 フィールドに strip、emit 内容に token 非埋込。3 層で test 実証。
- **branch protection 適用 = 認可・本番影響境界**: 既定 emit-only。非対話での無人適用を DbC precondition で封鎖 (CI で confirm-bypass adapter を注入されても適用されない)。
- **検出→提案→確認→記録** 思想 = `ut-tdd status` mode 検出と同型。確定値は state に記録し毎回再推測しない。

## §4 Next Action (順序付き)

| # | action | 状態 |
|---|--------|------|
| 1 | **PLAN-REVERSE-04 R3** | ✅ PASS / クローズ (2026-06-02)。setup=Phase 0 工程外 (concept §512) で新 FR 不要、emit-only/§6.5 整合は L6 で PO 確定済。再エスカレーション不要 |
| 2 | **branch protection の gh-api 実適用 (`--apply-branch-protection`)** の実機検証 (gh PUT field: restrictions=null 等) | ⬜ G7 後保守 (opt-in path、既定 emit-only script が主) |
| 3 | **escalation-stale.yml テンプレの検出ロジック実装** (§6.8.4 差し戻し Issue 自動起票) | ⬜ scaffold skeleton 止まり、利用者 repo 運用時に follow-up |
| 4 | **commitlint 配置** (standalone vs package.json) | ✅ 対象 repo へ standalone emit で確定 (L7-03 Step 3) |
| 5 | (継続) handover-c の Next Action (recovery-workflow.md 正本同期 / 再発防止 doc schema / REVERSE-02・03 carry / kind×layer guard / G8-G14 ゲート / repo biome 負債) | ⬜ 別 PLAN |

## §5 ⚠ 壊さない / 再発させない

- **setup は token を持たない**。gh 認証委譲 / signals strip / 内容非埋込を崩さない。
- **branch protection は既定 emit-only**。非対話での無人 apply を precondition から外さない (ガバナンス暴発防止)。
- **新機能 = Add-feature 経路B** (L6 機能設計→L7 実装→Reverse 上位整合)。setup は **Phase 0 工程外**として新 FR を起こさず §6.5/L4/L0 用語へ back-fill (fr-registry 46 件固定)。
- **TL = Codex は Windows 8009001d で不可** → code-reviewer (設計/実装/Reverse 各段) を TL 代替に使い cross-agent 不在を記録 ([[feedback_ts_native_over_helix_cli]])。impl は PM-authored TS。
- **review 前置 MUST** / **subagent model 明示** / commit footer = `Co-Authored-By: Claude Opus 4.8 (1M context)`。**staged は明示ファイルのみ** (untracked 2 件は commit 禁止)。

## §6 本 session commit (時系列、全 main)

- `4123bf0` docs(governance): runtime-parity L0-L3 audit + 9 defect fix (review 残存 stale 4 件追補)
- `e730109` docs(plans): PLAN-L6-05 setup solo/team 設計を起票・confirmed
- `bc11a68` feat(design): setup solo/team L6 機能設計 + L7 単体テスト設計 (①③ ペア)
- `3b009b1` feat(setup): ut-tdd setup solo/team 実装 (add-impl ②④ + templates)
- `c6dd883` feat(reverse): setup solo/team を上位整合へ back-fill (経路B完結)
- `841d064` docs(handover): 本 handover を起票 (§6.8.5)。※本追記 commit は次番

## §7 未了の PO 判断事項

1. ~~PLAN-REVERSE-04 R3~~ → **クローズ済** (本 session で R3 PASS、§4 #1)。setup feature サイクルに残 PO 判断なし。
2. (継続) handover-c §7 の未了判断 (REVERSE-02 R3 / kind×layer guard / HELIX cutover タイミング 等)。
