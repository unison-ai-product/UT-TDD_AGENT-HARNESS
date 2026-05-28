# Session Handover — 2026-05-27c (L1 業務要求 確定 + 企画書/G0.5 軽量化 + phase-aware PLAN ID + self-review ルール)

> 目的: 27b (cleanup+charter) の後、**harness 自身を W-model で dogfood** し、L0 企画 → G0.5 → **L1 業務要求を確定**するところまで到達した引き継ぎ。
> session: 2026-05-27c (27b から継続。L1 elicitation pivot)。担当: PM (Opus) + PO (人間ヒアリング) + pmo-sonnet (review)。
> **前 `SESSION-2026-05-27b-handover.md` を §2 Next Action について supersede** (背景・cleanup・charter 導入は有効)。

## §0 このセッションでやったこと (27b 以降)

27b の Next Action は「frontmatter schema zod化 (L7 実装)」だったが、PO 指摘で **W-model 順 (L0 済 → 次は L1) を厳守する dogfooding** に方針転換。L7 実装は premature jump として held に。L1 を正しく回した。

## §1 現在の状態

### commit (main 直、push 済の想定)
- `406fa37` cleanup + kind=charter/G0.5 + V-model skeleton (27b 時点)
- `aa1ae4f` **L1 業務要求 確定 + 企画書/G0.5 軽量化 + phase-aware PLAN ID + self-review ルール** (本 session、7 files)

### 確定した正本の変更
1. **企画書/G0.5 軽量化**: ROI/KGI/KPI の企画書必須を撤回 (内部システムに不適)。企画書 = feed-forward 文書、激しくチェックしない。G0.5 の「穴」は **書きすぎ(→L1へ降ろす) / リサーチ不足 / 整合性破綻** の3種のみ。concept §3.1.1 / requirements charter(§1.3) / §2.1.1 を軽量化済。
2. **phase-aware PLAN ID 規約**: `PLAN-<layer>-<NN>-<slug>` (layer=L0〜L14/X=cross/M=master、NN=layer内連番)。ID からフェーズ判別可、**ID layer == frontmatter layer**。requirements §1.10 A + §1.1 例 + design/impl テンプレに反映。旧 flat `PLAN-001..004` (archived) と別名前空間。
3. **HELIX global opt-in 化**: `~/.claude/CLAUDE.md` の HELIX @import 2行を撤去 (毎セッション ~48KB 節約)。UT-TDD は意図的に非ロード ([[memory: project_helix_global_optin]])。
4. **PLAN-L1-01** (`docs/plans/PLAN-L1-01-business-requirements.md`): L1 の **elicitation 計画**。= 要求定義書「体系」の定義 + 不明確項目の抽出 + PO ヒアリング順序 (業務→機能→技術→UX、product-improvement lens)。**PLAN ≠ 要求定義書** (PLAN はヒアリング順序、要求定義書は出力)。
5. **L1 業務要求 確定** (`docs/design/harness/L1-business-requirements.md`、status: confirmed): 専門サブエージェント review 通過 + P0/P1 修正済。
   - **価値の核**: process / safety / automation の3バランス
   - **BR-01〜06**: 設計実装テスト整合(P1) / team が PR で gate(P2) / AI 安全委譲(P4) / PoC 契約化(P3) / plan 管理 phase-aware(BR-05) / **工程表 専用UI ダッシュボード**(BR-06)
   - **NFR-01〜07**: cross-platform native (Win/mac/Linux 全第一級) / **更新性第一** / AI mode 非依存 (Claude+Codex hybrid 主軸) / 統制対象 repo 言語非依存(全種類) / GitHub 正本 / fail-close / 実務完成度 (MVP なし)
   - **UX-01〜03**: 3バランス / ダッシュボード体験 / (確定) gate 失敗時 next_action・DX
   - **成功5条件**: 1案件 L0-L14 通し / team 日常 PR gate / AI 委譲で回帰維持 / 工程表可視化 / PoC 合流
   - **対象**: 社内チーム複数人 (人間 = PO + レビュアー、実装等 = AI)
6. **self-review 前置ルール (MUST)**: 人間に判断/レビュー/確定を求める前に single-agent mode は専門サブエージェント self-review を先に通す。requirements §7.8.7 (方法論) + `.claude/CLAUDE.md` (runtime) に明文化。

### git working tree (未 commit、held)
- `src/schema/index.ts` (decision_outcome/reverse_type/forward_routing/promotion_strategy enum 追加) / `src/schema/frontmatter.ts` / `tests/frontmatter.test.ts` = **L7 frontmatter schema、premature jump で held**。**commit しない。L7 到達時に L1-L6 設計から作り直す** (plan_id regex は旧形式のまま = 新 phase-aware ID 規約と不整合なので、再開時は作り直し前提)。todo に carry して執着しない。

## §2 Next Action (次 session、W-model 順)

L1 業務要求 confirmed の次:

1. **③ 運用テスト設計** (W-model L1↔L14 pair): `docs/test-design/harness/L1-operational-test-design.md` を ① 業務要求と対で起こす (BR/NFR が運用検証で満たされるかの観点)。PLAN-L1-01 Step 5。G1 凍結に必要。
2. **G1 (業務要求ゲート)**: po サインオフ。① 業務要求 ⇔ ③ 運用テスト設計 の pair freeze。
3. **L3 機能要求** (FR-*/AC-*): BR-* から trace。新 PLAN `PLAN-L3-01-functional-requirements` (phase-aware ID) を起票。FR はここで初めて書く (L1 では書かない、AP-6)。
4. L3 で **ダッシュボードの機能仕様** + **工程強制範囲 (L0-L14 全 vs 段階)** + **3経路の実装順** を確定 (L1 の open→forward)。

### 着手前に再読
- `docs/design/harness/L1-business-requirements.md` (L1 confirmed、BR/NFR/UX)
- `docs/plans/PLAN-L1-01-business-requirements.md` (elicitation 設計、§3 不明確項目)
- requirements §2.1.1 (G0.5 軽量) / §2.2 (G1 pair freeze) / §7.8.7 (self-review 前置) / §1.10 A (phase-aware ID)
- [[memory: feedback_elicitation_and_self_review]]

## §3 carry / 持ち越し論点

- ⚠️ **整合課題 (要 L2 解決)**: BR-06 ダッシュボードは **サーバー + V-model 管理 DB + リアルタイム + 複数プロダクト横断** を理想とし、concept の「軽量・interpreter 不要・外部依存避け」(§8.1) と**強く緊張**。さらに V-model 状態を DB で持つのは現行ファイルベース state (`.ut-tdd/`) からの転換含意。L2/L4 で再整合 (concept 更新 or 設計吸収)。L1 では要求として確定済、解消は設計層。
- **held L7 schema** (§1 working tree): commit せず、L7 で設計から作り直す。
- requirements_v1.2 は「L1-L3」を名乗るが中身は L3/システム要件寄り。L1 業務要求層は本 session の `docs/design/harness/L1-business-requirements.md` が埋めた。L3 着手時に requirements_v1.2 との役割整理 (methodology spec vs project 要求) を意識。
- ADR-001 follow-up (tl-advisor 別 runtime cross-check) 依然未実施。

## §4 環境
- Bun 1.3.14 + Node v24.13.0。tsc/vitest/biome devDep。
- commit-msg hook = Conventional Commits 強制。Bash は heredoc (`git commit -F -`) で、PS here-string 不可 ([[memory: project_commit_msg_hook]])。
- main 直運用 (PO 単独 maintainer)。Codex Windows sandbox blocker 継続 (委譲時 task 埋め込み)。

## §5 次 session チェックリスト
1. `git log --oneline -3` で `aa1ae4f` が最新付近か確認。
2. `git status` で held L7 (index.ts/frontmatter.ts/frontmatter.test.ts) のみ未 commit を確認 (commit しない)。
3. 本 handover + L1 業務要求 doc + PLAN-L1-01 + [[memory]] を Read。
4. §2 の ③ 運用テスト設計 から再開 (PLAN-L1-01 Step 5)。実成果物提示の前に subagent self-review を通す (§7.8.7 MUST)。
