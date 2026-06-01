# Session Handover — 2026-06-01 (内部資産 Discovery + 工程ワークフロー定義 gap 発見)

> 次 session の Next Action を最優先で確認すること。本 handover は **PO 新優先順位「V-model 工程ワークフロー定義を先に完成」着手前**の状態を引き継ぐ。

## §0 現在地 (一言)

roster 内部資産を **Discovery (設計→仮実装→検証→確定) → L5 Forward 確定**まで完走。skill Discovery を起票したところで、PO が「工程単位でスキル発火するなら **V-model 工程ワークフローが全部定義されているか**」を指摘 → 棚卸しで **②駆動モデル 7 モード + L7-L14 が未定義 (gap)** と判明。**PO 確定の新優先順位 = skill より先に工程ワークフロー定義を完成**。HEAD = `8ab8cfe` (A-99)、main working tree clean、**vitest 70 pass**。`poc/roster-spike` ブランチに roster spike (throwaway、main 未 merge)。`helix-process/` は untracked のまま (PO 指示)。

## §1 本 session 進捗 (A-95〜A-99)

### 内部資産 roster = Discovery → L5 Forward 完走
- **Discovery `PLAN-X-03-roster-design`** (kind=poc/cross): S1 設計仮説 → S2 spike (Codex SE 8009001d で実装不可・review-only degrade → **PO 承認の PM env-forced TS spike**、`src/roster/` on poc/roster-spike) → S3 検証 (`bun` で scan=19 / capability⊥model / allowlist 15-4-0 / nameMismatches=0、設計成立) → **S4 PO confirmed + redesign**。self-review (code-reviewer) APPROVE。
- **L5 Forward `PLAN-L5-05-roster`** (status=confirmed): 確定設計を module-decomposition / internal-processing / L8 IT-ASSET に反映 (ID=filename stem / capability⊥model / nameMismatch WARN / `roster check`=allowlist 突合 fail-close)。self-review (pmo-sonnet) 整合成立。

### 内部資産 skill = Discovery S1 のみ (土台未完で保留)
- **`PLAN-X-04-skill-design`** (kind=poc/cross/S1): recommender を当初「PLAN/keyword→search」(HELIX gpt-5.4-mini freeform) と枠組んだが **PO 訂正「スキルを category タグ + 工程タグで分けて工程単位で推挙/発火」** → **工程タグ駆動の決定論推挙** (TS-native、LLM 不要、FR-12 `injectByLayer` 同型) に確定。S2 以降は §2 の工程ワークフロー定義完成後に再開。

### 工程ワークフロー定義 gap 棚卸し (pmo-sonnet、本 handover の発端)
- **列挙(enum)=完全**: L0-L14 / G0.5-G14 / 駆動モード / phase(S0-S4・R0-R4) は schema・gate-design に全列挙。
- **中身=部分的**: 定義済 = L0-L6 設計 + Forward/Recovery workflow + Recovery 正本。**gap = ① L7-L14 工程定義未着手 / ② 駆動モード 7/9 (Scrum/Incident/Refactor/Retrofit/Add-feature/Research/Reverse詳細) が 1 行概要のみ・UT-TDD 正本化未 / ③ Discovery メタモデル(PLAN-X-01)が S4 未確定 / ④ L10 テスト設計(L2↔L10)未作成**。
- → skill 工程タグ駆動は「工程の枠」にはタグ付け可だが、**undefined 工程への skill 割当は工程定義に依存** = 土台未完。

## §2 Next Action (新優先順位: 工程ワークフロー定義完成 → その後 skill)

**PROCESS: ad-hoc に書かず PLAN を立てて進める** ([[feedback-process-for-record-not-weight]])。各成果は self-review 前置 (MUST) を通す。

1. **ピース1 (核) = ②駆動モデル 7 モードの UT-TDD 正本化**:
   - 対象: Scrum / Incident / Refactor / Retrofit / Add-feature / Research / Reverse(R0-R4 詳細)。Forward・Recovery は済。
   - 各 mode の **entry 条件 / phase 手順 / exit (decision_outcome 等) / fullback 先** を UT-TDD 正本 doc に定義。
   - **source = `vendor/helix-source/` の各 workflow doc** (Scrum=S0-S4 / Reverse=R0-R4+RGC / 等、SKILL_MAP §Phase R/Scrum 参照) **+ gate-design §1.1**。⚠ **source を読んでから書く** (なぞり/捏造禁止、§3)。
   - 着地先候補: `docs/governance/` に駆動モデル正本 doc (gate-design §1.1 を実体化) or 既存 gate-design §1.1 拡張。PLAN 起票時に決定。
2. **ピース2 = L7-L14 工程定義 + L10**:
   - L7-L14 各工程の目的/entry/exit/成果物を確定 (gate-design G7-G14 + test-design ペアから consolidate。L7=実装で設計 doc なしは意図的、entry/exit は gate 定義)。
   - L10 テスト設計 (L2↔L10) を G2 park 解除時に作成。
3. **ピース3 = PLAN-X-01 S4 確定**: 工程定義 (①spine + ②駆動モデル) が揃った状態でメタモデルを PO confirm。
4. **ピース4 後 = skill 再開**: 工程タグ体系 (spine層 + 駆動モード phase) 確定後、`PLAN-X-04` S2 spike (poc/skill-spike、工程→タグ lookup) を PM env-forced で。続けて drift (FR-L1-49) Discovery 要否判定 (「確証あり」を自己判断しない)。

## §3 ⚠ 壊さないための必須注意

- **命名規約 (§1.10 A)**: plan_id = `PLAN-<layer>-<NN>-slug` (layer=L0〜L14 / X(cross=poc/reverse/recovery) / M(master))。`tests/plan-id-naming.test.ts` が docs/plans 全件を機械検証 (filename=plan_id / token↔frontmatter layer 一致)。**新 PLAN は必ず適合**、起票後 `npx vitest run tests/plan-id-naming.test.ts` で確認。
- **branch 規律 (Discovery)**: `poc/*` spike は **throwaway**・main 直 PR 物理ブロック。**governance(PLAN/設計) は main、spike は poc ブランチ**に分離 (stash で doc を main へ移す手順を本 session で確立)。
- **env-forced fallback (重要)**: **Codex CLI は Windows 8009001d で broken** (impl 委譲が review-only に degrade、再投入も再発)。harness 自己開発の impl は **TS-native (PM-authored TS + bun/vitest)** に切替、helix codex に固執しない ([[feedback-ts-native-over-helix-cli]])。逸脱でなく env-forced、PO 承認 + ledger 記録で正当化。ただし ②駆動モデル正本化は **doc 起草**なので Codex 不要、PM/pmo-sonnet で可。
- **self-review 前置 MUST**: PO へ gate/確定を求める前に code-reviewer / pmo-sonnet を通す (claude-only の tl リオープン代替)。
- **source を読んでから書く**: ②駆動モデル正本化は vendor/helix-source の workflow を**読んでから** UT-TDD 用に書く (前 session の「なぞり/捏造」反省、§5 教訓継続)。
- **helix-process/ は untracked のまま**: PO 指示、commit に含めない (本 session 全 commit で維持確認済)。
- **commit footer**: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` (repo 既存規約)。commit-msg hook が Conventional Commits 強制 (Bash heredoc `git commit -F -`)。

## §4 成果物 (本 session、A-95〜A-99、全て main commit 済)

- **A-95** (`f8f9f0e`): roster Discovery S1 起票 (PLAN-X-03)。「ディスカバリーはやらないのか？」訂正。
- **A-96** (`2576632`): roster S2/S3 (Codex 8009001d→PM spike、検証成立) + PO「TS にそろえる」反映。
- **A-97** (`327f52c`): roster S4 confirmed+redesign + PLAN-X-01 §7.1 back-merge。
- **A-98** (`854b6be`): roster L5 Forward 確定 (PLAN-L5-05、module-decomp/internal-proc/L8)。
- **A-99** (`8ab8cfe`): skill Discovery S1 + PO 訂正「工程タグ駆動」(PLAN-X-04)。
- spike: `poc/roster-spike` (`1472b68`、throwaway、main 未 merge の隔離記録)。

## §5 memory 反映済 (新規)

- **`feedback-ts-native-over-helix-cli`** (新規): helix/codex CLI は UT-TDD が TS 置換中の壊れた legacy (8009001d = ADR-001 の動機)。harness 自己開発の impl を壊れた Codex CLI に固執させず TS-native に切替。impl 委譲の TS path 未整備分は PM-authored TS + 記録で埋める。
