# Session Handover — 2026-06-01b (配布モデル/UI 配置の基盤要件確定 + ディレクトリ構成要件)

> 前 handover (`session-handover-2026-06-01.md`) の続き。本 session は「工程定義 → 駆動モデル → ディレクトリ構成」を辿る中で **より上流の基盤要件 (配布モデル・UI 配置) が未定義**だったと判明し、それを ADR で確定 → 配置正本・L1 要件へ反映、までを完了した。

## §0 現在地 (一言)

L7-L14 工程定義の起票を試みる過程で、PO 指摘により **真の gap = 「ハーネスの配布モデル・Web UI 配置という基盤要件が未定義」**と判明。**ADR-005 で確定** (配布=GitHub-pull / Web UI=中央・全 project 横断) → repository-structure.md・L1 技術要求・screen-requirements・§9.1 へ反映。発端の「工程/駆動モデル定義の置き場が無い」gap は **`docs/process/` 新設で解消**。HEAD = `009d4e5`、main clean、**vitest 70 pass**。`ai-agent-harness-directory-reference.md` (PO 作成参考) と `helix-process/` は untracked のまま。

## §1 本 session 進捗 (収束の記録)

セッション前半は triage 迷走 (Forward/design/poc/reverse を繰り返し誤判定、PO に複数回訂正された)。後半で根本原因を潰し収束:

1. **根本原因修正** (`29ee94f` → `009d4e5` で厳密化): 「PLAN を読まず自己流で起票」の根本 = **§1.10 PLAN 起票ルールが常時コンテキスト注入されていない**こと。`.claude/CLAUDE.md` に §1.10 要点を常時注入。retroactive self-review で Critical 1 + Important 4 を発見し修正 (X(cross)=poc/reverse のみ等)。
2. **PLAN-X-05 起票→撤回** (`971e9f4`→`66c04ca`): 工程定義 Discovery を新規起票したが **PLAN-DISCOVERY-01 (workflow メタモデル PoC) と重複** (起票ルール違反) → 撤回。工程定義の検証は **PLAN-DISCOVERY-01 が正本**。
3. **ADR-005 確定** (`7df446f`): 基盤要件を固定 (下記 §2 前提)。
4. **配置正本・要件へ反映**: repository-structure (`d18c389`) / L1 技術要求 (`534dfd7`) / screen-requirements (`a18a0f9`) / §9.1 (`0ae8d30`)。

### ADR-005 で確定した基盤要件
- **D1 配布 = GitHub-pull**: 本 repo (engine 単一真実) を git dependency で **tag-pin** 消費、更新享受 = tag bump。public npm publish しない (社内)。tool 非依存 package (CLI/CI/Codex 共通)。`ut-tdd setup` が adapter 投影。
- **D2 Web UI = 中央・全 project 横断の team 管理ツール**: GitHub を data backbone に詳細可視化 (GitHub native の工程・詳細版)。project-local でない。14 画面 (screen-requirements)。backend は L2 carry (ADR-003 IMP-031)。
- **D3 plugin = Claude 側の補助チャネル** (主軸でない)。
- **3 層**: ① engine repo (GitHub-pull) / ② project 投影 (adapter via setup) / ③ 中央 UI service (`src/web/` [予定])。
- 概念: **`.ai/` 単一真実 = UT-HARNESS 自身**。CLAUDE.md/.claude/AGENTS.md は adapter。HELIX (個人 global) と対比し、UT-TDD は社内チーム配布。

### 発端 gap の解消
- **工程(L0-L14)/駆動モデル定義の home = `docs/process/` 新設** (repository-structure §2、§9.1 A、`.gitkeep` 実体化済)。機能 home = `src/<domain>/`。

## §2 Next Action (ADR-005 follow-up、順序付き)

| # | follow-up | 状態 |
|---|---|---|
| 1 | L1 技術要求に配布/更新 channel | ✅ `534dfd7` |
| 2 | screen-requirements 中央/横断 明示 | ✅ `a18a0f9` |
| 3 | §9.1 Phase0 に docs/process/・src/web/ 同期 | ✅ `0ae8d30` |
| 4 | **工程/駆動モデル定義の中身を `docs/process/` に起こす** (本セッション発端の本丸、重い) | ⬜ **次** |
| 5 | HELIX cutover (helix 導線→ut-tdd GitHub-pull) | ⬜ (離脱判断 PO 未了) |

**follow-up 4 の進め方** (重要、過去の triage 迷走を繰り返さない):
- 工程定義の検証は **PLAN-DISCOVERY-01 (workflow メタモデル PoC、S3) の scope 内**で進める。**新規 PLAN を作らない** (X-05 撤回の教訓)。
- 駆動モデルは **Forward = L のワークフロー本体、他 (Scrum/Reverse/Recovery/Incident/Refactor/Retrofit/Add-feature/Research) は補助導線**という骨格 (PO 確定)。
- 工程定義は **要件 (L3) レベル**の話 (harness が L4=G4 COND PASS で未クローズ=上流)。Discovery で実証 → L3 要件へ。なぞり禁止 (vendor を読んでから書く)。
- vendor source = `vendor/helix-source/docs/v2/process/L07-L14*.md` + `helix-process/*` (untracked)。

## §3 ⚠ 壊さない / 再発させない

- **PLAN 起票前 MUST** (`.claude/CLAUDE.md` に常時注入済): 既存 PLAN 確認 (重複禁止) + §1.10 Read。plan_id = `PLAN-<layer>-<NN>[-slug]` (slug 省略可)、**X(cross)=poc/reverse のみ**、ファイル名=plan_id 一致。
- **self-review 前置 MUST**: PO へ確定/gate を求める前に code-reviewer / pmo-sonnet を通す。**本セッションで 1 件抜け (29ee94f) を PO に指摘され retroactive 実施**→再発させない。全成果物を必ず通す。
- **triage を独断で確定しない**: 駆動モデル判定 (Forward/design/poc/reverse/add-feature) は過去複数回誤った。②駆動モデルの triage を正本に照らし、不明確なら PO 確認。
- **branch / commit**: main 直 commit 可 (solo maintainer)。commit-msg hook = Conventional Commits (Bash heredoc `git commit -F -`)。footer = `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。
- **untracked 維持**: `helix-process/` と `ai-agent-harness-directory-reference.md` (PO 作成参考) は commit に含めない。

## §4 未了の PO 判断事項 (escalation 済、判断待ち)

1. **HELIX 離脱判断のタイミング** (認識共有済): UT-TDD runtime が揃った時点で helix 依存を切る決定を「どこかで」下す必要 (cutover-strategy 正本)。
2. **recovery=cross の可否**: schema は現状 recovery を layer=cross にできない (実 layer 必須)。recovery PLAN を横断的に X 扱いしたい意図があるなら schema 変更判断 (今回は doc を schema 実挙動=poc/reverse のみ に合わせた)。
3. **§9.1 先在乖離**: `docs/governance/` に `ai-dev-team-concept_v1.1.md` / `ai-dev-team-operations_v1.1.md` が A 必須で載るが repository-structure 未記載。将来 Phase0 存在チェック実装時に齟齬。別 follow-up で整理要。

## §5 本 session commit (時系列、全 main)

- `971e9f4` PLAN-X-05 起票 → `66c04ca` 撤回 (PLAN-DISCOVERY-01 重複、当時は旧 X 体系)
- `29ee94f` PLAN ルール常時注入 → `009d4e5` 厳密化修正 (retroactive review)
- `7df446f` ADR-005 (配布/UI 基盤要件)
- `d18c389` repository-structure (docs/process/ 新設 + 3層)
- `534dfd7` L1 技術要求 (配布 channel)
- `a18a0f9` screen-requirements (中央/横断)
- `0ae8d30` §9.1 同期 (docs/process/・src/web/)
