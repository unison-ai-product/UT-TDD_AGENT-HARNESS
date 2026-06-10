# UT-TDD Agent Harness

## Claude Code Read Order

Claude Code はこの repo では次を正本として扱う。

1. `CLAUDE.md`
2. `.claude/CLAUDE.md`
3. `docs/governance/README.md`
4. `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
5. `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`
6. `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md`
7. `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md`（再設計方針・実装言語）
8. `docs/migration/helix-to-ut-tdd-cutover-strategy.md`

**検証ロードマップは常時参照しない（節目限定の動的参照）**: `docs/design/harness/L3-functional/roadmap.md`（検証ロードマップ、L3 設計層 doc）は **read order に含めない**。**定常は Forward 工程（L0→L14 の設計降下）が本線**であり、検証ロードマップは **V-model 層群（L0-L3 / L4-L6 / L7 / L8-L14 など）の Forward が freeze 完了した節目で検証サイクルを回すときだけ動的に Read する** band である。検証タイミングは V-model 単位に依存して機械発火させる（崩れ防止の全体調整）。定常作業を検証ロードマップの Phase / サイクルで語らない（driver / 主語にしない、[[feedback_roadmap_is_design_doc_level]]）。

`docs/archive/`、`vendor/helix-source/`、`.helix/`、移植前の `.claude/agents` / `.claude/hooks` は正本ではない。HELIX は移植元であり、社内版 UT-TDD の runtime command は `helix` ではなく `ut-tdd` とする。

**実装方針 (ADR-001)**: HELIX は **設計概念のみ**取り込み、内部は **TypeScript (Bun) で全面再実装**する。HELIX/旧 W1-W3a の Python コードは port せず TS で作り直す (`src/ut_tdd/*.py` は superseded)。harness 自身の実装言語は TS だが、UT-TDD が統制する**対象リポジトリの言語は非依存**。

## 概要

UT-TDD Agent Harness は、AI 実装エージェントを社内開発チームで安全に使うための検証・開発基盤である。**この harness 自体を完成させること自体が目的ではなく、これが基盤 (土台) となって別プロダクトの開発を安全に回せるようにすることが目的**である。ゆえに基盤として必要な設計・ドキュメントは、harness の自己開発を早く終わらせる都合で間引かない (**基盤の under-design を許容しない**)。HELIX は移植元の個人プロジェクトであり、この repo では `vendor/helix-source/` に snapshot として隔離する。

## 設計の柱 (中核価値)

この harness が「別プロダクト開発の基盤」として提供する中核価値。設計・実装・レビューは、この 6 本に資するかで判断する (どの柱にも資さない作業は untraceable arbitrary work として疑う)。

1. **基盤であること**: harness 自体の完成でなく、別プロダクト開発を安全に回す土台になること (詳細 = 上記「概要」)。
2. **ドキュメント前提 × 機械処理で厳格化 (融合)**: ドキュメントで前提を回し、機械処理 (schema / lint / doctor / hook) で守らせる。doc だけで止めない (詳細 = 「コーディング規約」MUST、under-design 禁止)。
3. **自動化で state (DB) 管理を簡単にし、フィードバック機構にする**: V-model state DB (`.ut-tdd/`) の整合・孤児検出・進行状況を機械が保ち、人手の DB 管理負担を下げる。設計⇔実装⇔テストのズレを検知して次サイクルに返す**フィードバックループ**として機能させる (同じ不整合を次の PR で再発させない)。
4. **コンテキスト/スキルの動的注入で AI の認知負荷を下げる**: 必要な context・skill を必要な工程でのみ注入し、AI が一度に抱える情報量を絞って判断精度を上げる (全部を常時ロードしない)。
5. **適切なオーケストレーションで開発コストを下げる**: drive × layer に応じた役割分散・並列/直列制御・委譲で、人手と AI の重複作業を排し開発コストを最小化する。
6. **厳格なルールと検証で品質を保つ**: gate / V-model pair freeze / fail-close 検証で、AI 実装の品質を機械的に担保する (テストなし完了宣言禁止・self-review を gate 通過根拠にしない)。

## 正本ドキュメント

- `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`
- `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md`
- `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md`（実装言語 = TypeScript/Bun）
- `docs/governance/repository-structure.md`（リポジトリ構成ルールの正本）
- `docs/migration/helix-source-inventory.md`

## アーキテクチャ

- `docs/`: 社内向け構想・要件・移植計画
- `.ut-tdd/`: UT-TDD runtime state。handover / audit / local state の正本候補
- `.claude/`: Claude Code runtime / hook policy
- `vendor/helix-source/`: HELIX 移植元 snapshot。直接編集しない
- `.helix/`: HELIX 由来 state。移行中の互換・参照用であり、UT-TDD 正本 state にはしない

## コーディング規約

- 実装前に対象ファイルを Read し、既存パターンへ合わせる。
- 命名、フォーマット、エラー処理、テスト配置は既存コードを正本にする。
- テストなしの完了宣言は禁止。
- Codex / Claude Code は API 直叩きではなく、契約プラン + CLI / hook を UT-TDD Agent Harness が管理する対象として扱う。
- `vendor/helix-source/` は read-only source material。移植するときは UT-TDD 所有パスへコピーしてから変更する。
- **クリーンアップ原則 (技術負債防止、MUST)**: 開発原則の誤り・PO 指摘で取り下げた / 方針転換で陳腐化したコード・doc・注記は、**その場で除去 (クリーンアップ)** する。死にコード・矛盾注記・取り下げの残骸を技術負債として残さない。historical 保持が要るものは**保持理由を明記**し、現行と誤認されない形 (superseded banner / 「旧 → 訂正」明示) にする。「間違えたが消していない」「指摘で取り下げたが痕跡が残る」状態で完了扱いにしない。
- **ハードコードは慎重に (MUST)**: マジック値・固定リスト・enum・閾値・パスを直書きするときは ① **根拠をコメントで残す** ② **単一正本化** (同じ値を複数箇所に散在させず、定数 / スキーマ / 設定へ集約) ③ 将来の変更・拡張の容易性を考慮する。「とりあえず固定」の安易な決め打ちを避ける。やむを得ず直書きするなら、なぜ集約せずハードコードにするかの理由を残す。
- **ドキュメント前提 × 機械処理で厳格化 (融合思想、MUST)**: 工程統制・オーケストレーションは「**ドキュメントで前提が回る**」だけで止めず、それを **機械処理 (schema fail-close / lint / doctor / hook) で厳格化 (enforce) する降下先まで用意して 1 セット**にする。設計を「doc に書いた」で完了とせず、**「どの機械チェックがそれを守らせるか」までを設計に含める**。ここで **under-design = 「設計に書いたが、それを守らせる機械担保の着地先を定義しないまま完了 (freeze) 扱いにする」**ことを指す。**設計で明示的に defer すると宣言した項目 (`skip_sub_doc` + reason / carry 宣言) は under-design ではない** (defer は正規手続き、concept §3.1.3.1 / requirements §G.13)。基盤 (別プロダクト開発を回す土台) の中核 = オーケストレーション/工程統制は、この doc⇔機械の対 (pair) を特に妥協しない。

## Git 運用 (この repo の自己開発 = harness 開発)

> **重要**: ここは **harness 自身の開発** (PO 単独 maintainer) の git 規律。**製品が利用者に課す** Issue 起点スパイン / branch-default / PR+CI (requirements §6.8/§6.9) とは **別レイヤー**であり、自分の開発手順に流用しない (harness 開発 vs harness 利用を混同しない)。

- **main 直 commit + push** でよい (PO 単独 maintainer、PR ceremony 不要、branch を切らない)。
- **Conventional Commits 必須** (`feat|fix|docs|refactor|test|chore|...: ...`)。commit-msg hook が fail-close 強制。Bash heredoc (`git commit -F -`) で書く (PowerShell here-string は不可)。
- commit footer は `Co-Authored-By: Claude Opus 4.8 (1M context)`。
- **1 PLAN = 1 commit** を default。段階的に分割する場合は理由を残す。
- **staged は明示ファイルのみ**。`git add -A` / `git add .` を避け、自分が編集したファイルだけ stage する。**並行して PO が編集中のファイル (L0-L3 上流チェック等) を巻き込まない**。(`helix-process/` / `ai-agent-harness-directory-reference.md` は旧「untracked policy-exempt」だったが 2026-06-10 に tracked 参照資料へ変更 — 配置正本 = repository-structure.md §5、A-128 F-1 / IMP-127)。
- **push は作業の区切りで**: PLAN / 駆動サイクル完了時、または PO 依頼時に `origin main` へ push する (commit 止まりで放置しない)。outward-facing のため無断の頻発 push は避け、まとまりで送る。
- **CI = `harness-check`** (`.github/workflows/harness-check.yml`、§6.9 本番ルールを self-dogfood): push/PR (main) で typecheck + 全回帰 (vitest) + biome lint + doctor を実行。**public repo のため GitHub Actions は無料無制限**。§6.3 の branch-type subjob は PLAN 後に追加 (現状 deferred)。
- **`.github/workflows/` を push するには OAuth トークンに `workflow` スコープが必須** (無い場合 GitHub が push を拒否)。GCM/PAT/gh いずれかで付与する。
- **review 前置 MUST**: PO へ確定/gate を求める前に、`hybrid` では別 runtime の `frontier-reviewer`、単体 mode では `intra_runtime_subagent` (`code-reviewer` / `pmo-sonnet` 等) を通す (.claude/CLAUDE.md と整合)。

## ディレクトリ構造

配置の **正本は `docs/governance/repository-structure.md`**（canonical ツリー + 配置ルール + 命名 + tracked/ignored + 境界 + 禁止事項）。要約:

```text
src/                  # harness TS core (cli/schema/plan/vmodel/runtime/doctor)。bash/Python を core に置かない
tests/                # vitest (*.test.ts)
scripts/              # 薄い OS entrypoint のみ (ut-tdd, ut-tdd.ps1)
docs/                 # governance(正本)/adr/plans/templates/design/test-design/migration/archive ...
.ut-tdd/              # runtime state (大半 gitignored)
.claude/              # Claude Code runtime / hook policy
vendor/helix-source/  # HELIX 移植元 snapshot (read-only、直接編集禁止)
```

V-model 4 artifact: ① 設計=`docs/design/` / ② 実装=`src/` / ③ テスト設計=`docs/test-design/` / ④ テストコード=`tests/`（混在禁止、詳細は構成ルール）。

## 将来のコマンド

- 初期化: `ut-tdd setup`
- 状態確認: `ut-tdd status`
- 統合検証: `ut-tdd doctor`
- 計画 lint: `ut-tdd plan lint`
- レビュー: `ut-tdd review --uncommitted`
- Codex 委譲: `ut-tdd codex --role <role> --task "..."`
- Claude Code prompt 生成: `ut-tdd claude --role <role> --task "..." --dry-run`
- 連携実行: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml` (`hybrid` mode のみ)
- タスク判定: `ut-tdd task classify --text "..."` / `ut-tdd task estimate --plan <path>`
- skill 推挙: `ut-tdd skill suggest --plan <path>`

複数 AI を使える場合は、判断と実行を分ける。Claude Code が作業主体なら設計レビューや R4 合流・判断ゲート (G0.5/G2/G4-G7) 判断は別 runtime / 別 model 系統の `frontier-reviewer` へ回し、実装・テスト追加・文書整形は `worker` に委譲する。単体 mode では `intra_runtime_subagent` review を必須とする (cross-agent 不在と代替 reviewer を明示記録、構想書 §2.1.2.1)。

現時点で未移植の機能は `vendor/helix-source/` を参照する。社内版の正本導線として `helix` コマンドを増やさない。

## 禁止事項

- API key、secret、PII、credential を rules / docs / examples に書かない。
- 認証、認可、決済、PII、ライセンス、本番影響、destructive data operation は人間確認なしに仕様確定しない。
- 外部 provider SDK や認証情報を前提にした fallback を通常導線として追加しない。
- `.ut-tdd/` **runtime state** (state/cache/logs/tmp/handover CURRENT/local*)、`.claude/settings.local.json`、`.codex` などのローカル副産物をドキュメント目的で追跡対象にしない。**例外 = 監査証跡** (`.ut-tdd/audit/*.md` / `evidence/` / `handover/provider/`) は tracked (PO 決定 2026-06-10、正本 = repository-structure.md §5)。

## UT-TDD ワークフロー

- Forward: `plan` -> `pair-freeze` -> `implement` -> `trace-freeze` -> `review` -> `accept`
- Reverse: `reverse <type> R0` -> `R1` -> `R2` -> `R3` -> `R4` -> Forward 合流
- Scrum / PoC: `S0 backlog` -> `S1 plan` -> `S2 poc` -> `S3 verify` -> `S4 decide`
- Handover: `.ut-tdd/handover/CURRENT.json` がある場合は内容を確認し、stale でなければ Next Action に従う。
- AI harness: `plan` / `task` の文脈を `status` の mode (`standalone` / `claude-only` / `codex-only` / `hybrid`) に応じて、`codex` / `claude` / `team` / `review` / `handover` で管理する。

## 指示ファイル

- 共有 / Claude Code project context: `CLAUDE.md`
- Claude Code runtime / hook policy: `.claude/CLAUDE.md`
- Codex CLI project rules: `AGENTS.md`
- 個人差分: `CLAUDE.local.md` / `AGENTS.override.md`

## UT-TDD Adapter Rule Markers

This section is machine-checked by `rule-drift` so Codex and Claude adapters do not silently diverge.

- Codex project rules: `AGENTS.md`
- Claude runtime policy: `.claude/CLAUDE.md`
- Modes: `standalone` / `claude-only` / `codex-only` / `hybrid`
- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`
- Handover: `ut-tdd handover`
- Codex delegation: `ut-tdd codex --role <role> --task "..."`
- Claude delegation: `ut-tdd claude --role <role> --task "..."`
- Team run: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`
