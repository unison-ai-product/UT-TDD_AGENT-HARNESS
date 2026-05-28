# UT-TDD-agent-harness 構想書

- **Version**: 3.1
- **位置付け**: 構想書 (L1 概念層) / 要件定義書は別ファイル
- **対応構想書**: AI駆動開発チーム構想書 v1.1
- **対応運用ルール書**: AI駆動開発チーム運用ルール書 v1.1
- **工程層体系**: v3.1 で **V2 (HELIX-workflows) の L0-L14 + W-model を base に採用** (移植元 `vendor/helix-source/docs/v2/process/`)
- **想定実装エージェント**: Claude Code (複雑タスク・設計判断) / Codex (自律実行・並列処理)
- **対象 OS**:
  - Windows / macOS / Linux: ネイティブ動作を第一級対応
  - Windows: PowerShell entrypoint を提供し、Git Bash 依存を局所化する
  - macOS / Linux: POSIX shell entrypoint を提供する
  - WSL2: 任意の互換実行環境。必須条件にはしない
  - CI: `ubuntu-latest` を基準にしつつ、Windows smoke を追加する
- **対象リポジトリ言語**: 言語非依存 (`ut-tdd` の test adapter / repository-local test command で吸収)

## 本書の位置付け

本書は **構想書 (concept document)** として、**WHY / WHAT / どう繋がるか** のみを定義する。**HOW** は別ファイル `ut-tdd-agent-harness-requirements_v1.2.md` (要件定義書) で定義し、さらに各 enum・スクリプト・workflow YAML の **詳細実装** は L5 詳細設計 PLAN で詰める。

| ファイル | 役割 | 抽象レベル |
|---------|------|------------|
| 本書 (構想書 v3.1) | 概念 / モード / 経路 / 配線 / 補助軸 / 役割 | L1 概念 |
| 要件定義書 v1.2 | 受入条件 / enum / fail-close 条件 / Phase 0 受入条件 | L1-L3 要件 |
| 個別 PLAN-XXX (将来) | validator 実装 / workflow YAML / hook script | L5 詳細設計 |

## v3.0 の主旨 (v2.1 からの分離 + TL Round 3 Critical 反映)

v2.1 (2215 行) を構想書 v3.0 と要件定義に分離し、現行要件は v1.1 を正本とする。Round 3 で TL から指摘された **概念レベルの Critical 5 件** を本書で fix:

| # | 元 Critical | v3.0 での fix |
|---|-------------|---------------|
| C1 | Pair freeze 工程曖昧 | §2.3 / §3 で **L4 前 = ①⇔③ペア freeze (G2/G3)** と **L4 後 = ②⇔④含む 4 artifact trace freeze (G4)** を明示分離 |
| C4 | R1 skip 判定が scrum_type 固定 | §4.4 で「R1 skip 判定は解決済み reverse_type を主キーに」と概念明記 (詳細は要件定義書 §3) |
| C6 | Required Status Checks の OR/skip 前提誤り | §7.2 で「共通 required check 1 本に集約し内部で branch type 分岐」と方針確定 |
| C7 | failure_log の git 管理矛盾 | §8.5 で「failure_log は local 個人作業ログ。チーム共有 audit は別経路」と明記 |
| C8 | escalation level +1 漸進設計 | §8.3 で「level は閾値を満たす最大値を冪等に算出 (差分 +1 ではない)」と明示 |
| I22 | 用語集「4 文書」誤り | §10 で「4 artifact (2 文書 + 2 コード成果物)」へ修正 |

## v3.1 の主旨 (V2 工程・モード・配線の取り込み)

v3.1 は、移植元 V2 (HELIX-workflows、`vendor/helix-source/docs/v2/`) の **開発工程・開発モード・配線 (routing/injection)** を UT-TDD のチーム開発向けに翻案して取り込む。コード/state DB は移植せず、**工程・フロー・仕組み**を概念層に統合する。

| # | 取り込み | v3.1 での反映 |
|---|----------|---------------|
| V1 | **L0-L14 + W-model** 工程体系 | §3 を V2 の 15 工程 + 左右対 (L1↔L14 / L2↔L10 / L3↔L12 / L4↔L9 / L5↔L8 / L6↔L7) に作り替え。旧 L0-L11+小数層は廃止し L0-L14 へ remap (要件定義書 §1.4 VALID_LAYERS 連動) |
| V2 | **9-mode ecosystem** | §2.5 新設。入口を 9 mode + 2 工程専門に分け、出口は必ず Forward L0-L14 へ合流。Discovery / Refactor / Retrofit / screen-design / frontend-design を新規追加し、旧「経路 2/補助 1」を mode へ格上げ |
| V3 | **配線 (signal→mode→command + layer-context 注入 + 横断検出)** | §2.6 新設。検出 signal からの mode 自動 routing、推奨コマンドの機械契約 (safety フラグ)、drive×layer の `orchestration_mode` 注入、横断検出器を概念化 |
| V4 | **orchestration_mode** | §2.6 で drive×layer 別の「誰が判断し誰が実装するか」を 5 値 (pm_lead / claude_judge / claude_judge_codex_impl / codex_impl_qa_verify / claude_design_impl) で定義。実行モード (§2.1.1) より細粒度 |
| V5 | **工程別アンチパターン** | §3.5 新設。AI 実装が踏みがちな V-model 違反を概念列挙 |

**チーム翻案の原則** (V2 の個人前提 → UT-TDD のチーム前提):

- V2 の `helix *` コマンド・個人絶対パス・`helix.db` 依存は持ち込まず、`ut-tdd *` 相当・`.ut-tdd/` state・package-local に読み替える (要件定義書 §7 で機械化)。
- V2 の「PM=AI / PO=本人」固定を、**PM/TL/PO が別々の人間**になる前提へ翻案。各ゲートは人間サインオフ点、`safety.requires_human_approval` は「誰の承認か」を具体化する (§2.6 / §9)。
- cross-agent review は「人を跨ぐレビュー」へ拡張 (§9、要件定義書 §6 CODEOWNERS)。
- `vendor/helix-source/` は read-only。V2 文言は概念参照のみで、UT-TDD 正本は本書と要件定義書に再記述する。

---

# §1 Why — なぜ UT-TDD-agent-harness か

## 1.1 チーム開発で起こる 4 問題

構想書 v1.1 / 運用ルール書 v1.1 + AI 駆動開発の現実観察から、以下 4 問題が常態化している:

| # | 問題 | 具体的影響 |
|---|------|------------|
| **P1** | 設計・実装・テストの乖離 | AI が「テストも書いた」と言うが設計 doc とテストコードが対応しない、逆ピラミッド化 |
| **P2** | 役割境界が曖昧 | TL/QA/AI実装・保守/UI/UX/発注元 の責任が PR ごとに食い違う、CODEOWNERS 未整備 |
| **P3** | PoC が独り歩き | 仮説検証で書いた PoC コードが本実装で再実装される、知見が文書化されない |
| **P4** | 既存実装への破壊的追加 | AI が「より良い形」と称して既存設計を改変、既存テストを書き換えて回帰検知不能 |

`UT-TDD-agent-harness` はこの 4 問題に **3 つの実装経路 + 4 つの補助軸** で構造的に対処する。

## 1.2 名前の意味

| 部分 | 意味 |
|---|---|
| **UT**(Unit Test) | 機能設計 ① + 単体テスト設計 ③ + 単体テストコード ④ の triple freeze。設計とテストの 1:1 対応を機能粒度で強制 |
| **TDD**(Test-Driven Development) | 設計 ① ↔ テスト設計 ③ pair freeze。テスト設計 doc が無ければ実装段階に進めない |
| **agent** | AI 実装 (② コード) が ① 設計と ④ テストコードに挟まれる構造で、AI を「設計とテストの間の自動化層」として位置付ける |
| **harness** | 上記を YAML / hook / GitHub Actions で **機械強制** する土台 (構想書 v1.1 用語集「AI エージェントを安全に動かす土台」) |

## 1.3 既存 2 構想書との関係

本書は以下 2 文書を **前提とした実装層** であり、置換するものではない:

| 文書 | 役割 | 本書との関係 |
|---|---|---|
| 構想書 v1.1 | チーム構造・理念・5 段階セキュリティ | 本書 §2-§9 でこれを実装層に落とす |
| 運用ルール書 v1.1 | 日常フロー・PR/ブランチ規約・インシデント | 本書 §6-§7 + §9 でこれを CI / ハーネス層に組み込む |

3 文書は `docs/governance/` 配下に共存する:

```
docs/governance/
├── ai-dev-team-concept_v1.1.md
├── ai-dev-team-operations_v1.1.md
├── ut-tdd-agent-harness-concept_v3.1.md
└── ut-tdd-agent-harness-requirements_v1.2.md
```

## 1.4 失敗を仕組みに変換する原則

UT-TDD Agent Harness は、失敗事例を隠すための管理ツールではない。AI 開発で実際に起きる失敗を観測し、次回以降の実行品質を上げるための **再利用可能な制御構造** に変換するための harness である。

失敗は以下のように扱う。

| 失敗の種類 | 変換先 | 目的 |
|---|---|---|
| 設計・実装・テストのずれ | `vmodel_lint` / trace freeze / 追加 PLAN | 同じ不整合を次の PR で再発させない |
| レビュー指摘・テスト不足 | L6 QA 追加テスト設計 / regression test / `test-pack` | 指摘を一回限りのコメントで終わらせない |
| session 断絶・認識ずれ | `handover` / `recovery` PLAN / failure log | 次の AI session が同じ前提誤読から始まらない |
| PoC の独り歩き | Reverse R0-R4 / `promotion_strategy` | 検証成果を契約化してから Forward に合流させる |
| 繰り返し失敗 | escalation L0-L3 / postmortem / debt register | 閾値を超えた時点で人間判断へ戻す |
| AI 判断の過信 | cross-agent review / `frontier-reviewer` | 同一 AI / 同一モデルによる自己承認を避ける |

このため、UT-TDD では「失敗をログに残す」だけでは不十分とする。失敗は、可能な限り **gate、validator、test、skill pack、handover、postmortem、orchestration policy** のいずれかに還元する。

チーム共有の失敗 corpus はローカル作業ログではなく、GitHub を正本にする。PR / GitHub Actions / Checks / job summary / artifact / label / review comment から失敗 event を pull し、同種失敗の反復、失敗種別、再発防止の有無を集計する。ローカル `failure_log.jsonl` は個人 advisory に留め、組織としての学習・escalation・regression 化は GitHub 上の証跡から行う。

---

# §2 ハーネスの設計骨格

## 2.1 3 経路 + 4 補助軸

UT-TDD-agent-harness は **チーム開発で発生する全実装パターン** を 3 つの経路で網羅し、4 つの補助軸で支える。

### 2.1.0 2 つのマスト原則 (runtime 非依存性)

実行主体 (Claude Code / Codex) が変わってもハーネスが破綻しないために、以下 2 点を **MUST** とする。これが満たされない実装・運用は受入不可。

1. **ルール同一性 (rule parity)** — Claude Code と Codex は **同じルールで動く**。gate / V-model / checklist / enum / route / 配線 の **正本は `ut-tdd` core + 本 governance docs に単一定義**し、`.claude/CLAUDE.md` (Claude) と `AGENTS.md` (Codex) は **それを指す薄い runtime adapter** に限る (ルールを再定義・分岐・上書きしない)。同一入力 (PLAN / diff) に対し、runtime や mode によらず **同一判定・同一 exit code** を返す。ルールが runtime ごとに枝分かれした時点でゲートは信頼できなくなる。

2. **hybrid の機能分散 (distributed by role)** — 両 runtime が揃う `hybrid` では、**機能を分けて分散動作する**ことを必須とする。判断系 (`frontier-reviewer`) と実行系 (`worker`) を **別 runtime に割り当て**、同一作業を二重実行しない。cross-agent review (§2.1.2.1) と orchestration_mode の `*_codex_impl` 系 (§2.6.4) は、この役割分散の上でのみ成立する。「両方ある」だけで分散していない hybrid は、cross-agent review が形骸化する。

> 補足: 「同じルール」と「単体時のレビュー縮退 (§2.1.2.1)」は両立する。**ルール (どのゲートで何を要求するか) は runtime によらず同一**で、その **満たし方 (① cross-agent / ② 専門サブエージェント / 人間)** が利用可能な agent 数で決まるだけである。ルール自体は分岐しない。

## 2.1.1 実行モード (単体 / 連携)

本ハーネスは Claude Code と Codex の連携を必須にしない。`ut-tdd` CLI と workflow / hook は、現在利用できる実行主体を検出し、以下 4 mode のいずれでも同じ状態モデルを扱う。

| mode | 利用主体 | 目的 | 必須条件 |
|------|----------|------|----------|
| `claude-only` | Claude Code + `.claude/` hook | 対話 UI と hook による設計・実装・停止時検証 | `ut-tdd` CLI + Claude Code project context |
| `codex-only` | Codex CLI + `AGENTS.md` | Codex 単体での TL 駆動実装・レビュー・検証 | `ut-tdd` CLI + Codex project rules |
| `hybrid` | Claude Code + Codex CLI | 役割分担、handover、review、team run | `claude-only` と `codex-only` の両方 |
| `standalone` | `ut-tdd` CLI のみ | setup / doctor / lint / gate のローカル検証 | Claude Code / Codex なし |

`ut-tdd status` / `ut-tdd doctor` は mode、検出済み runtime、欠落 runtime、推奨 next action を表示する。`hybrid` 専用の委譲コマンドは、片方しか無い環境では fail ではなく明示的な `not-available` と fallback 手順を返す。

Cursor / Google Antigravity / GitHub Copilot などの周辺 AI IDE は、必須 runtime ではなく **optional adapter** として扱う。検出できた場合は `ut-tdd status` に表示し、CLI 経由で安全に呼べる範囲だけ `ut-tdd adapter <name> ...` に公開する。公開 CLI や automation API が不安定な adapter は、状態検出と手順提示までに留める。

Antigravity のように内部から Claude Code を呼べる可能性がある IDE は、Claude Code 本体とは分けて **adapter-hosted runtime** として扱う。つまり `claude-only` / `hybrid` の判定に直結させず、`optional_adapters[].hosted_runtimes` として「Antigravity 経由で Claude Code 相当が使える」ことを表示する。

## 2.1.2 複数 AI orchestration 原則

複数 runtime / adapter が使える場合、UT-TDD は「判断」と「実行」を分離して割り当てる。

- 設計判断、要件分解、R4 合流判定、**判断ゲート (G0.5 企画突合 / G2 / G4-G7 設計・実装凍結) のレビュー**は **現在作業している AI とは別系統の最上位モデルクラス** (`frontier-reviewer`) に依頼する。
- 実装、機械的修正、テスト追加、ドキュメント整形は **実行向けモデルクラス** (`worker`) に依頼する。
- 軽量 lint、要約、差分分類、コマンド生成補助は **低コスト高速モデルクラス** (`fast-checker`) に寄せる。
- 同一 AI / 同一モデルが作った設計を同一モデルだけで承認しない。`hybrid` mode では cross-agent review を原則とし、単体 mode では **専門サブエージェント review を必須**とする (§2.1.2.1。naive self-review を判断ゲートの通過根拠にしない)。

モデルの実名は変動するため構想書には固定しない。`.ut-tdd/teams/*.yaml` で provider / command / model / role / budget を宣言し、`ut-tdd status` が利用可否を表示する。これにより「Claude Code が中核」「Codex が実装/並列」「optional adapter が補助」という現在の構成を保ちつつ、将来のモデル更新に追従できる。

### 2.1.2.1 実行モードによるレビューゲート切り分け (gate 崩壊防止)

cross-agent review は **別 runtime / 別モデルのレビュアー**を前提とする。単一エージェント環境 (claude-only / codex-only) ではこれが物理的に不可能なため、execution mode (§2.1.1) を参照せず判断ゲートを「レビュー済み」で通すと、**self-review が cross-agent review に化けてゲートが崩れる**。`ut-tdd gate` は必ず `ut-tdd status` の mode を参照する。

#### レビュー強度の 3 ティア

| ティア | 実体 | 強度 |
|---|---|---|
| **① cross-agent review** | 別 runtime / 別 model のレビュアー (hybrid) | full。cross-provider 要件を満たす |
| **② 専門サブエージェント review** | 同一 runtime 内・別 context/persona・adversarial・**明文化 checklist 駆動** の専用レビュアー (例 claude-only の `.claude/agents/code-reviewer`、codex-only の reviewer-role 呼び出し) | 中間。self より強いが cross-provider は満たさない |
| **③ naive self-review** | 実装者が自分の出力を読み直す | 最弱。判断ゲートの通過根拠として **不可** |

②は同一モデルである事実を必ず記録し (`review_kind: intra_runtime_subagent`)、cross-provider 要件には数えない。

#### execution mode 別の判断ゲート挙動

| execution mode | cross-agent review | 判断ゲート (G0.5 / G2 / G4-G7 / R4) の扱い |
|---|---|---|
| `hybrid` | 可能 (worker ≠ frontier-reviewer) | full enforce。worker と reviewer の (provider, model) 同一なら承認無効化し exit |
| `claude-only` / `codex-only` | 不可 | **② 専門サブエージェント review を必須化** (hard)。明文化 checklist の逐条実行記録が無ければ gate を **exit 1** で止める。実行時は `review_kind: intra_runtime_subagent` + `cross_agent_review: unavailable` を記録 |
| `standalone` | 不可 (AI なし) | サブエージェントも起動不可 → 機械 lint のみ pass し、判断ゲートは **人間レビュー必須** を `next_action` に出す (自動 pass 不可) |

#### 核心ルール

1. **self-review (③) を判断ゲートの通過根拠にしない**。単一エージェント時は ② 専門サブエージェント review を hard 要件とし、未実行なら exit 1 (silent pass 禁止)。
2. ② は同一モデルのため **cross-provider 要件を満たさない**。`same_model_approval: forbidden` を実行時強制し、worker と reviewer の (provider, model) 一致時は承認を無効化して gate を止める (hybrid でも同一モデル割当を弾く)。
3. ② のレビュー観点は曖昧にせず **明文化された checklist を逐条評価** し、各項目に pass/fail/n-a + 根拠を記録する (checklist 正本は要件定義書 §7.8.7)。
4. `orchestration_mode` (§2.6.4) が要求する agent が execution mode で不在なら、silent fallback せず **縮退規則**で別 mode に落とすか人間に委ねる (不在を明示記録)。例: `claude_judge_codex_impl` は hybrid のみ完全実体化。claude-only では実装も Claude が担い review は ② に縮退、codex-only では Codex 主導 + ②。
5. **escalation 境界 (本番影響 / 認証 / 認可 / 決済 / PII / ライセンス / destructive) は execution mode を問わず人間サインオフ必須** (② でも代替不可。hard-block。§8 エスカレーションと整合)。

機械検証要件と checklist 正本は要件定義書 §7.8.7。

## 2.1.3 タスク判定 / 見積もり / skill 推挙

UT-TDD は PLAN 起票前後に、タスクの難易度・エフォート・適用 skill を機械的に仮判定する。これは実装を止める gate ではなく、経路選択、orchestration、レビュー強度、必要 skill pack を決めるための事前分類である。

- `ut-tdd task classify`: 入力文または PLAN から kind / drive / size / complexity / split_required を判定する。
- `ut-tdd task estimate`: 三点見積もりとリスク係数で effort_hours / story_points / buffer を出す。
- `ut-tdd skill suggest`: PLAN の kind / layer / drive / touched files から `docs/skills/*.md` の候補を推挙する。

基本は rule-based で動作し、AI runtime が無い `standalone` でも利用できる。複数 AI がある場合は軽量分類を `fast-checker`、曖昧な L/XL 判定や本番影響を含む見積もりレビューを `frontier-reviewer` に回す。

### 3 つの実装経路

| # | 経路 | トリガー | 主な kind |
|---|------|----------|-----------|
| **経路 1** | V-model Forward | 発注元 Issue (要件確定) | `design` + `impl` |
| **経路 2** | Scrum × Reverse 自動 routing | 仮説 (要件未確定) | `poc` + `reverse` |
| **経路 3** | add-design / add-impl | 既存 PLAN への拡張要求 | `add-design` + `add-impl` |

### 4 つの補助軸

| # | 補助軸 | 内容 |
|---|--------|------|
| **補助 1** | 緊急経路 (recovery) | hotfix template / session 終了前 fail-close / postmortem 強制 |
| **補助 2** | GitHub 統制 | ブランチ / workflows / PR / CODEOWNERS / commitlint / Protected Branch |
| **補助 3** | 3 層抽象化 (設計仕様書) | スキル / ワークフロー / ハーネスの YAML を **設計仕様書** として参照、interpreter は導入しない |
| **補助 4** | チーム責任二極化 | TL 上流 / QA 下流 / AI実装・保守 / UI/UX / 発注元 の 5 役割マトリクス |

> **v3.1 注記**: この「3 実装経路 + 4 補助軸」は v3.1 で **9-mode ecosystem (§2.5)** に再編した。経路 1=Forward、経路 2=Reverse / Scrum / Discovery、経路 3=Add-feature、補助 1=Recovery / Incident に対応し、さらに Refactor / Retrofit / screen-design / frontend-design を追加する。入口 (mode) は状況で分岐するが、出口は必ず Forward L0-L14 (§3) に合流する。mode の自動判定と委譲の配線は §2.6。

## 2.2 全体像

```
                       ┌──────────────────────────────────────┐
                       │       発注元 (プロダクトオーナー)      │
                       │   WHY / WHAT / 受入基準 / R3 検証     │
                       └────────────────┬─────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
   [要件確定]                       [仮説]                           [既存拡張]
        │                               │                               │
        ▼                               ▼                               ▼
  ┌──────────┐                  ┌──────────────┐               ┌──────────────┐
  │ 経路 1   │                  │   経路 2     │               │   経路 3      │
  │ V-model  │                  │ Scrum×Reverse│               │  add-* 差分    │
  │ Forward  │                  │ 自動 routing │               │     実装      │
  └────┬─────┘                  └──────┬───────┘               └──────┬───────┘
       │                               │                               │
       │ 設計⇔テスト設計の Pair freeze  │ S4 decide → matrix lookup    │ 既存テスト維持
       │ → L7 実装 → 4 artifact trace  │ → R0-R4 → R4 で Forward 合流  │ + 回帰確認
       │                               │                               │
       └───────────────┬───────────────┴───────────────┬───────────────┘
                       │                               │
                       ▼                               ▼
              ┌──────────────────────────────────────────────┐
              │  補助 2: GitHub 統制 (全経路の共通基盤)        │
              │   ブランチ × workflows × CODEOWNERS           │
              └──────────────────────┬───────────────────────┘
                                     │
                       ┌─────────────┴─────────────┐
                       │                           │
                       ▼                           ▼
              ┌────────────────┐         ┌────────────────┐
              │ 補助 3: 3 層    │         │ 補助 4: チーム  │
              │ 抽象化 (設計   │         │ 責任二極化      │
              │ 仕様書) +      │         │ + 4 段レビュー  │
              │ エスカレーション│         │                │
              └────────────────┘         └────────────────┘

              ┌──────────────────────────────────────────────┐
              │ 補助 1: 緊急経路 (P0/P1 インシデント発生時)   │
              │   hotfix template + session 終了前チェック    │
              │   + postmortem doc 強制                       │
              └──────────────────────────────────────────────┘
```

## 2.3 V-model 4 artifact と 3 段階 freeze (中核)

ソフトウェア工学 V-model の原則に従い、本ハーネスは **4 つの artifact を別文書/別成果物として独立** させ、双方向 reference で trace する。

```
   ① 設計 (文書)         ←対応関係→        ③ テスト設計 (文書)
   docs/design/                            docs/test-design/
        │                                        │
        ▼ 実装                                   ▼ 実装
   ② 実装コード         ←対応関係→        ④ テストコード
   src/                                    tests/
```

| Artifact | 種別 | 担当 layer (L0-L14) | 主成果物例 |
|---|---|---|---|
| ① 設計 | 文書 | L0-L6 (企画/要求/画面/要件/基本/詳細/機能) | 企画書 / 業務要求 / 画面設計 / 要件 (FR+AC) / ADR / D-API / 関数 schema |
| ② 実装コード | コード成果物 | L7 (実装) | `src/*` |
| ③ テスト設計 | 文書 | L1/L3/L4/L5/L6 (① と同層、W-model 左) | 運用/受入/総合/結合/単体テスト設計 doc |
| ④ テストコード | コード成果物 | L7 先行作成、L7-L14 で実施 (② と同系) | `tests/*` |

### W-model: 左 (設計) ↔ 右 (検証) の対 (v3.1 で L0-L14 化)

V2 の L0-L14 は左右が 1:1 で対になる W-model を成す。左側で書いた設計には、同層で **③ テスト設計** を対にして凍結し、右側の対応工程で **④ テストコード** として実施する。

| 左 (設計層) | ③ テスト設計 (左で作成) | 右 (実施工程) |
|---|---|---|
| L1 要求定義 | 運用テスト設計 | L14 運用検証 |
| L2 画面設計 | (ワイヤーモック自体がペア) | L10 UX 磨き |
| L3 要件定義 (FR+AC) | 受入テスト設計 | L12 デプロイ+受入 |
| L4 基本設計 | 総合テスト設計 | L9 総合テスト |
| L5 詳細設計 | 結合テスト設計 | L8 結合テスト |
| L6 機能設計 | 単体テスト設計 | L7 実装内 単体テスト |

### 3 段階 freeze (v3.0 で明示分離 — 元 Critical C1 fix。v3.1 で L0-L14 へ remap)

v2.1 では「4 artifact pair freeze」が実装前後を跨いで曖昧だった。工程順に応じて **3 段階の freeze 概念** に分離する:

| Freeze 段階 | 発火タイミング | 凍結対象 | 担当ゲート |
|------------|---------------|----------|-----------|
| **段階 A: Pair freeze (設計⇔テスト設計)** | L7 実装着手前 | ① + ③ の文書ペア (W-model 左各層) | G1 (L1) / G2 (L2 mock) / G3 (L3) / G4 (L4) / G5 (L5) / G6 (L6) |
| **段階 A2: TDD Red freeze** | ② 実装コード作成前 | ③ + ④ の単体テスト設計/先行テストコード | L7 entry (G6 通過直後) |
| **段階 B: 4 artifact trace freeze** | L7 実装完了時 | ① + ② + ③ + ④ の双方向 trace 6 方向 | G7 |

→ L7 実装前に ② 実装コードを freeze することは概念上ありえない。段階 A は **文書ペアの揃い**、段階 A2 は **受入を先行テストコードで固定する red state**、段階 B は **実装コードを含む 4 artifact の trace 揃い** と理解する。

### 双方向 trace の 6 方向

4 artifact は無向 6 pair = **双方向 12 edge** で結ばれる。本書では慣用的に「6 方向 trace」と呼ぶが、これは「6 pair それぞれを双方向 reference で結ぶ」の意味であり、実装上は 12 edge を個別検証する。

| Pair | From → To 方向 | To → From 方向 |
|------|---------------|---------------|
| ①⇔② | 設計 → 実装ファイル指定 | 実装 docstring → 設計参照 |
| ①⇔③ | 設計 → テスト設計指定 | テスト設計 → 設計参照 |
| ①⇔④ | (派生的) | (派生的) |
| ②⇔③ | (派生的) | (派生的) |
| ②⇔④ | 実装 → テストコード対応 | テストコード → 実装対応 |
| ③⇔④ | テスト設計 → テストコード対応 | テストコード → テスト設計対応 |

実装上の**必須 8 directed edge** (4 artifact の 6 pair 双方向 = 12 edge のうち必須分) は要件定義書 §2.4 で確定する。

### 逆ピラミッド検出 (P0 severity)

「① + ② が存在するが ③ + ④ が無い」状態を **逆ピラミッド** と呼び、G6 (機能設計凍結) / G7 (実装凍結) で fail-close する。AI 実装が「テストも書いた」と称しつつ ③ テスト設計 doc を欠く典型パターン。

## 2.4 5 段階セキュリティとの統合 (構想書 v1.1 §3 準拠)

構想書 §3.3 の多層防御を、本ハーネスの各補助軸に分散統合:

| セキュリティ段階 | 統合先 | 具体 tool |
|---|---|---|
| Develop | Forward G4 基本設計ゲート (threat model 確認) | (人間判断) |
| Commit | pre-commit hook + commitlint | gitleaks / commitlint |
| Build | workflows の SAST / SCA / Secret Scan | trivy (SCA) / codeql (SAST) — Phase 2 で追加 |
| Deploy | Incident mode の incident-log + Protected Branch (L12 デプロイ) | `gh` CLI |
| Operate | escalation L0-L3 で異常検知 + L13/L14 (デプロイ後検証・運用検証) フェーズで Sentry/Uptime Robot/Dependabot アラートをチーム共有 audit へ記録。個人 `failure_log.jsonl` は local advisory に限定 | Sentry / Uptime Robot / Dependabot |

## 2.5 開発モード・エコシステム (9-mode、V2 由来)

入口の状況に応じて **9 mode + 2 工程専門 workflow** を使い分け、**出口は必ず Forward L0-L14 (§3) に合流** させる。mode は「入口条件」と「文脈遷移 (昇華)」を明示するだけで、完了先 (設計・実装・検証・運用の同一接続) を分断しない。これにより入口を散らさず工程を一本化する。

| mode | 入口条件 (要約) | 対応する旧 v3.0 経路 | チーム owner | Forward 合流点 |
|------|----------------|---------------------|--------------|----------------|
| **Forward** | 要件・設計・契約が明確 | 経路 1 | 全工程 (§3) | — (本体) |
| **Reverse** | 既存資産に逆向き事実 (drift / 未知設計) | 経路 2 (の Reverse) | tl | R4 後 → L3/L4 |
| **Discovery** | 要件・成功条件 未確定 / 実現性 不透明 | (新規) | po + tl | 確定後 → L1 |
| **Refactor** | 振る舞い維持の構造改善 | (新規) | se + tl | 完了後 → 回帰確認 |
| **Retrofit** | 依存・基盤・設定の移行/更新 | (新規) | se + tl | upgrade 後 → L4 |
| **Recovery** | AI の逸脱・暴走・再開不能の収束 | 補助 1 | tl + po (承認必須) | 収束後 → 中断工程 |
| **Scrum** | 要件を反復で固める | 経路 2 (の Scrum) | po + aim | S4 decide → L1 |
| **Incident** | 本番稼働中の障害・hotfix 直行 | 補助 1 | オンコール + tl + pm (承認必須) | 収束後 → L12/L13 |
| **Add-feature** | 既存基盤への機能差分追加 | 経路 3 (add-*) | aim + tl | 既存維持 + L3/L7 差分 |
| screen-design | L2 画面設計 (UI/wireframe) 専門 | — | uiux | Forward L2 内 |
| frontend-design | L10 前後 UX/ビジュアル/表現品質 専門 | — | uiux / fe | Forward L10 内 |

- 旧「3 経路 + 4 補助軸」(§2.1) は本 9-mode に再編した。**Discovery / Refactor / Retrofit / screen-design / frontend-design が v3.1 新規追加**。
- screen-design / frontend-design は独立経路ではなく **Forward の設計文脈内の工程専門** (L2 / L10) として運用する。
- 各 mode の入口判定・推奨コマンド・委譲は §2.6 の配線で機械化する。

## 2.6 配線 (signal → mode → command / layer-context 注入 / 横断検出)

mode と工程を「絵」で終わらせず自動で繋ぐ仕組み。V2 の routing/injection を UT-TDD のチーム前提に翻案する (helix → ut-tdd、helix.db → `.ut-tdd/` state、個人パス排除)。

### 2.6.1 signal → mode 自動 routing

検出 signal から mode を機械判定する (V2 `SIGNAL_TO_MODE` / `DRIFT_TYPE_TO_ROUTE` 相当を `ut-tdd` config に再定義)。例:

| signal | mode | 備考 |
|--------|------|------|
| `drift` (drift_type=schema/contract) | Reverse | normalization |
| `debt_degradation` / `code_smell` / `structural` | Refactor | |
| `dependency_outdated` / `upgrade` / `config_drift` | Retrofit | upgrade は preflight 要 |
| `agent_runaway` / `context_exhaustion` / `regression_dev` / `runaway` | Recovery | 承認必須 |
| `production_incident` / `hotfix_required` / `regression_prod` | Incident | env=prod、承認必須 |
| `feature_addition` / `scope_extension` | Add-feature | |
| `user_feedback_iteration` / `requirement_continuous_refinement` | Scrum | |
| (要件未確定 / 実現性不透明) | Discovery | 上流委譲 |

`env=prod` や regression 系は優先的に Incident/Recovery に倒す。

### 2.6.2 4 象限 priority/action (uncertainty × impact)

| | impact 低 | impact 高 |
|---|---|---|
| **uncertainty 低** | P3 / suggest_only | P1 / 即 PLAN 起票 |
| **uncertainty 高** | P2 / Discovery 先行 | P0 / 緊急 routing |

### 2.6.3 mode → command の機械契約 (RecommendedCommandV1)

route 結果は **人間向け表示 (`suggest_command`)** と **機械契約 (`recommended_command`)** を分離する。機械契約は JSON で、`schema_version / command / args / safety` を持つ。`safety` の 3 フラグ:

- `auto_apply`: agent が確認なしに即実行してよいか (default: false)
- `requires_human_approval`: **人間承認必須** (Recovery / prod Incident / config_drift Retrofit で true)
- `requires_preflight`: 前段 preflight 必須 (upgrade 高リスク時)

**チーム翻案 (最重要)**: V2 の `requires_human_approval: true` は「止まるシステム」しか示さない。UT-TDD では **「誰がサインオフするか」** を定義しないと形骸化する。

| 引き金 | 承認者 (人間サインオフ) |
|--------|------------------------|
| Recovery 起動 | tl がリオープンポイント確認 + po がスコープ承認 |
| prod Incident | オンコール担当 + tl + pm の三者確認 |
| config_drift Retrofit | tl 単独承認 (環境影響限定) |

この承認者定義は `.ut-tdd/` policy または `.claude/CLAUDE.md` Guard Rules に置き、`requires_human_approval` が立ったとき自動参照する (要件定義書 §7)。`command` の値は `helix *` ではなく `ut-tdd *` 相当に置換する。

### 2.6.4 layer-context 注入 (drive × layer) と orchestration_mode

各 drive × layer に **owner_role / mandatory_agents / recommended_skills / recommended_commands / orchestration_mode** を注入する (V2 `vmodel-semantics.yaml` 相当)。`orchestration_mode` が、あなたの言う「開発のモード」= **工程ごとに誰が判断し誰が実装するか** を 5 値で表す。実行モード (§2.1.1 standalone/hybrid) より細粒度。

| orchestration_mode | 意味 |
|--------------------|------|
| `pm_lead` | PM 単独主導 (planning 層)。AI 委譲なし |
| `claude_judge` | Claude (PM/PMO) が判断主体 (requirement 層) |
| `claude_judge_codex_impl` | Claude が設計・判断、Codex (worker) が実装 (architecture/detailed 層) |
| `codex_impl_qa_verify` | Codex が実装、QA が検証 (functional 層) |
| `claude_design_impl` | Claude が設計+実装 (FE の mock 駆動 architecture/detailed) |

drive で owner_role / orchestration_mode が変わる (例: architecture 層は be→tl / fe→fe role + `claude_design_impl` / db→dba 相当)。値の enum は要件定義書 §1 / §7 で確定する。

**execution mode との結合 (重要)**: `orchestration_mode` は両エージェント存在を前提とする値 (`claude_judge_codex_impl` / `codex_impl_qa_verify`) を含む。これらは `hybrid` でのみ完全実体化し、単一エージェント (claude-only / codex-only) では §2.1.2.1 の縮退規則に従って別 mode へ落とす。**この縮退時に cross-agent review が self-review に化けないよう、判断ゲートは必ず execution mode を参照する** (§2.1.2.1)。orchestration_mode と execution mode を独立に扱うとレビューゲートが崩れる。

### 2.6.5 横断検出 (全工程・全 mode から発動)

| 機構 | 検出 | 接続先 mode |
|------|------|-------------|
| interrupt | 開発中の割り込み (design_gap / new_requirement / constraint / po_change) | 重大・暴走なら Recovery |
| debt | 技術負債台帳の蓄積 | Refactor |
| drift-check | D-API / D-CONTRACT / D-DB の乖離 | Reverse normalization |
| readiness | deferred finding (ゲート通過保留) | 後工程 PLAN へ carry (PM 承認要) |
| doctor: relation-graph / doc-drift / connection-deficiency / regression | 依存漏れ / 契約漏れ / 接続欠損 / 回帰 | Reverse / 本番→Incident・開発中→Recovery |
| **test-perspective-gate** | W-model 各ペアの **観点網羅** (抜け) + **レベル間非重複** (重複) | fail-close (`--static-only`) |

これら検出器は `.ut-tdd/` state を参照し、`ut-tdd doctor` / `ut-tdd plan lint` に束ねる (要件定義書 §7)。

---

# §3 Forward mode: V-model L0-L14 (要件確定時の通常開発)

## 3.1 概念 (V2 L0-L14 + W-model)

Forward は要件・設計・契約が確定した状態から **L0 → L14 を V-model (左=設計降下 / 右=検証上昇)** で進む中核経路。他の全 mode (§2.5) は最終的に本経路へ合流する。左側の各設計層では **同層で ③ テスト設計を対に凍結** し (W-model 左)、右側の対応工程で **④ テストコードを実施** する。

```
左 (設計降下)                              右 (検証上昇)
L0 企画         (po+tl)  企画書①                          L14 運用検証+改善 (pm+po)
  └ G0.5 企画突合 (frontier-reviewer adversarial check 必須)        ▲ G14
L1 要求定義     (po主体) 業務要求 BR-*/NFR-* ① + 運用テスト設計③ ──→ L14 で実施
  └ G1 (po+tl)                                                     ▲ G12
L2 画面設計     (uiux)   ワイヤーモック ① ─────(mock がペア)─────→ L10 UX 磨き (uiux) G10
  └ G2 (pm+uiux)
L3 要件定義     (tl主体) FR-*/AC-* ① (BR-* から trace) + 受入テスト設計③ ──→ L12 デプロイ+受入 (pm+po)
  └ G3 (po+tl)                                                     ▲ G9
L4 基本設計     (tl)     アーキ/ADR ① + 総合テスト設計③ ──────────→ L9 総合テスト (qa) G9
  └ G4 (tl+pm, tl-advisor 必須)                                    ▲ G8
L5 詳細設計     (tl+se)  D-API/D-DB/D-CONTRACT ① + 結合テスト設計③ ─→ L8 結合テスト (aim/qa) G8
  └ G5 API/Schema Freeze                                          ▲ (L7 内)
L6 機能設計     (tl+aim) 関数 schema/エッジケース+WBS ① + 単体テスト設計③ ─→ L7 実装内 単体テスト
  └ G6 関数 signature 確定 + WBS 完備
        │
        ▼
L7 実装スプリント (aim→se)  ② 実装コード / ④ テストコード
   TDD Red → 本体実装 → 3点レビュー → テストパターン追加 → 実施 → 修正
  └ G7 実装凍結 (4 artifact trace freeze、6 pair 双方向)
        │
        ▼
L8 結合 →G8→ L9 総合 →G9→ L10 UX磨き →G10→ L11 総合レビュー+UAT (pm+po) →G11
   → L12 デプロイ+受入 (pm+po) →G12→ L13 デプロイ後検証 (自動/pm) →G13
   → L14 運用検証+改善 (pm+po) →G14→ 次サイクル L0 へ feedback
```

各工程の owner / 人間サインオフ / mandatory subagent / orchestration_mode の配線は §2.6、要件定義書 §1.4 / §7 で機械化する。以下は v3.1 で V2 から取り込んだ工程概念の要点。

### 3.1.1 L0 企画工程の独立 (V2 由来)

L0 は「リポジトリ初期化」ではなく **企画工程**。企画書 PLAN は背景・目的・スコープ (高レベル方向性) を持つ **feed-forward 文書**であり、L1 へ渡すことが役割。**社内システム/開発基盤では ROI・KGI/KPI の定量化を企画書段階で強制しない** (定量指標・受入条件は L1 業務要求 / L3 で定義し、企画書との二重記述を避ける)。想定リスクは判明分のみ任意。企画書は `kind=charter` (layer=L0、`parent_design` 不要 = root) で起票し、必須 role は `po` (要件定義書 §1.8)。**G0.5 企画突合**は軽量ゲートで、高レベル方向性が L1 業務要求へ trace できるか + 整合性破綻がないかだけを軽く確認する (完全性は求めない。書きすぎ = L1/L3 相当の詳細は穴とせず L1 へ降ろす。軽い他者レビューを推奨するが hard 必須にしない。fail 条件は要件定義書 §2.1.1)。リポジトリ初期化・Branch Protection 等の基盤整備は Phase 0 (要件定義書 §10) として工程外で扱う。

### 3.1.2 L1 / L3 の二段分割 (業務要求 vs システム機能要件)

V2 は要件を二段に分ける。**L1 = 業務要求 (BR-* / NFR-*) のみ** (FR を書かない)、**L3 = システム機能要件 (FR-*) + 受入条件 (AC-*)** で、FR-* は L1 の BR-* から双方向 trace する。チーム: L1 は po 主体 (業務要求まで)、L3 は tl 主体 (FR+AC 確定)。G1 を業務要求ゲート、G3 を FR+AC ゲートとして人間サインオフを分離する。

### 3.1.2.1 L1 sub-doc 構造 (V2 HELIX-workflows 5 PLAN 正本)

V2 HELIX-workflows 正本 (`vendor/helix-source/docs/v2/process/L01-requirements-and-operational-test-design.md`) は **L1 を 1 doc にまとめず 5 sub-doc に分割**する (PLAN は機能=doc 単位で起票)。UT-TDD はこれを正本として採用する:

| sub-doc (5 種) | 主な記載内容 (HELIX-workflows 原文) | PLAN 命名 (UT-TDD) |
|----------------|------------------------------------|--------------------|
| **業務要求** | 目的・背景 (WHY/WHAT/WHO) / 対象業務一覧 / 業務フロー / ステークホルダー / 現状課題 → あるべき姿 | `PLAN-L1-01-business-requirements` |
| **機能要求** | 機能一覧 / 利用シナリオ (ユースケース) / 操作とデータの流れ / 入出力 | `PLAN-L1-02-functional-requirements` |
| **画面要求** | 画面一覧 / 画面遷移の要望 / 表示・操作への要望 (具体的画面設計は L2) | `PLAN-L1-03-screen-requirements` |
| **技術要求** | 採用技術・技術制約 / 外部連携・インターフェース要望 / 既存システム制約 | `PLAN-L1-04-technical-requirements` |
| **非機能要求** | 可用性 / 性能・拡張性 / 運用・保守性 / 移行性 / セキュリティ / システム環境・エコロジー (**IPA 非機能要求グレード 6 大項目に準拠**) | `PLAN-L1-05-nfr` |

> **L1 機能要求 ≠ L3 機能要件**: L1 機能要求 (FR-L1-*) は「ユーザー視点で何の機能を望むか」= **要求**、L3 機能要件 (FR-*) は「システムが満たすべき仕様 + AC」= **要件**。L1 の 5 sub-doc は L3 で確定される FR-*/AC-* の **入力**であり別物。
> **L1 = 1 PLAN にまとめる旧運用は誤り** (§3.5 AP-11)。
> L1 全 sub-doc ↔ L14 運用テスト設計 1 doc の pair (G1↔L14、W-model)。

### 3.1.3 設計の 3 段分割 (L4 基本 / L5 詳細 / L6 機能)

V2 は設計を **L4 基本設計 (外部設計: アーキ/ADR)** → **L5 詳細設計 (内部設計: D-API/D-DB/D-CONTRACT、API/Schema Freeze)** → **L6 機能設計 (関数 signature・エッジケース + WBS)** の 3 段に分け、それぞれ G4/G5/G6 で独立凍結する。旧 UT-TDD の L2 全体設計 / L3 詳細 / L3.5 機能はこの L4 / L5 / L6 に remap される。

### 3.1.3.1 L2-L6 sub-doc 構造 (V2 HELIX-workflows 正本)

各設計層も sub-doc 分割を取る (V2 HELIX-workflows 各 process doc の正本抽出セクションから転写):

| layer | sub-doc 構造 (HELIX-workflows 正本) | 数 |
|-------|------------------------------------|-----|
| **L2 画面設計** | 画面一覧 (画面 ID・各画面の役割) / 画面遷移 (遷移図・条件・イベント) / ワイヤーフレーム (各画面のレイアウト・情報配置) / UI 要素 (主要 UI コンポーネント・入力/表示/操作要素) | 4 |
| **L3 要件定義** | 業務要件 (業務フロー確定版・業務ルール・対象業務範囲) / 機能要件 (機能一覧確定版・機能仕様・入出力定義) / 非機能要件 (IPA 非機能要求グレードのグレード値で確定) | 3 |
| **L4 基本設計** | 方式設計 (システム構成・アーキ・技術スタック) / 機能設計 (機能構成・機能間連携) / 画面設計 (画面レイアウト確定・画面項目定義) / データ設計 (論理データモデル・テーブル概要・ER 図) / 外部 IF 設計 (外部システム連携・API 概要) | 5 |
| **L5 詳細設計** | 内部処理設計 (モジュール内部処理・処理フロー) / モジュール分割 (モジュール構成・責務分担) / 物理データ設計 (物理テーブル・インデックス戦略) / IF 詳細設計 (入出力詳細・エラー処理) | 4 |
| **L6 機能設計** | 関数仕様 (関数/メソッド仕様・引数・戻り値) / クラス設計 (クラス構成・責務) / エッジケース (境界値・例外・エラー処理パターン) | 3 |

各 sub-doc は単独 PLAN で起票 (PLAN 命名: `PLAN-L<N>-<NN>-<sub-doc-slug>`)。drive 不適合 sub-doc (例: be 駆動なら L2 画面設計の sub-doc 群を skip) は **skip 理由を PLAN frontmatter `skip_sub_doc:` に明記**することで省略可。drive 別の skip/必須は §3.7 駆動別 L2-L11 挙動表を正本とする。

### 3.1.4 L7 実装スプリントの 7 ステップ (3 点レビュー)

L7 は単なる「実装」ではなく、**TDD Red → 本体実装 → 3 点レビュー → テストパターン追加 → テスト実施 → 修正** の順序を持つ。3 点レビューは **① 設計 ⇔ ③ テスト設計 ⇔ ② 実装コード** の三位一体確認で、矛盾があれば設計工程 (L4/L5/L6) に差し戻す (チーム: aim セルフ + G7 時 frontier-reviewer、差し戻しは aim→tl エスカレーション)。実装 PLAN は `parent_design:` (L6 機能設計 doc への path) を必須とする (要件定義書 §1.1)。

**レビュー範囲は単一スコープに閉じない**。diff だけを見ると依存関係の誤りや重複実装を見逃す。レビューは少なくとも次の 3 スコープで行う:

- **関数単位**: 変更関数自体 (signature / 契約整合 / ロジック / 境界)。
- **機能単位**: 機能内の関数群の整合・**依存関係の正しさ** (呼び出し/import グラフの orphan・cycle・missing、レイヤリング違反) ・インターフェース断片化の有無。
- **横断 (repo)**: **重複実装 / 機能被り**の検出 — 同等機能が既存に無いか。L7 着手前に既存資産の流用候補を確認し (重複防止)、被りがあれば再実装せず Add-feature / Refactor mode へ回す。

依存・重複の機械検出は §2.6.5 の横断検出 (relation-graph / connection-deficiency) と code-index (`ut-tdd code find` / `dup` 相当) を用いる。具体チェック項目は要件定義書 §7.8.7.1 (DEP / DUP / MOD)。

### 3.1.5 右腕工程の差し戻しルール (L8 結合 / L9 総合)

右側の検証工程で失敗した場合、差し戻し先を明示する: **L8 結合テスト失敗 → L5 詳細設計 または L7 実装へ**、**L9 総合テスト失敗 → L4 基本設計へ**。差し戻し記録は PLAN の carry log に残す。**右側工程で「ペア凍結されていないテスト設計」を新規起票することは W-model 違反** (テスト設計は必ず左側の対応層で凍結済みであること)。

### 3.1.6 L11 総合レビュー + UAT (要件巻き取り)

L11 は **L1 業務要求 + L3 要件 ↔ 実装・テスト結果の全体突合** と **ユーザー検証 (Beta/UAT)**、および **フィードバックの L1/L3 巻き取り** を担う独立工程。チーム: pm+po が主体、UAT は po 主体で aim が補助、巻き取りは tl が L1/L3 doc を更新する。

## 3.2 Forward で使う kind

- 起点: `design` (L0-L6 で企画/要求/画面/要件/基本/詳細/機能の設計 doc を起票)
- 実装: `impl` (L7。`parent_design:` 必須)
- 補助: `research` (L1 前段の技術調査)

詳細 enum は要件定義書 §1 を参照。

## 3.3 ゲートの意味 (概念)

G0.5-G14 はそれぞれ「次工程に進むための足切り」。G0.5 企画突合 / G1-G6 は設計・テスト設計のペア品質、G7 は実装凍結 (4 artifact trace)、G8-G10 は検証品質、G11-G14 はレビュー・リリース・運用品質を判定する。各ゲートは **人間サインオフ点** であり、誰が承認するか (owner) は §2.6 / §9 で定義する。判定基準は要件定義書 §2 で機械検証可能な形に確定する。

## 3.4 QA 追加テストの分離 (V-model 補足)

L7 実装完了後に QA が追加する **regression / exploratory / edge-case** テストは、左側で凍結した結合テスト設計 (L5) や単体テスト設計 (L6) に **統合してはいけない**。L8/L9 の検証工程で発見した品質観点は独立の追加テスト設計 doc として正本化する。理由は V-model 原則で「設計時に書いたテスト」と「品質保証時に追加するテスト」を混ぜると追跡不能になるため。

実装後レビューで見つかった不足観点は、左側 (L5/L6) の frozen test design を直接書き換えず、QA 追加テストまたは `add-design` / `add-impl` (Add-feature mode、§2.5) の差分 PLAN として扱う。追加テストも、先に `docs/test-design/` の追加テスト設計 doc を正本化し、その doc に対応するテストコードだけを書く。

## 3.5 工程別アンチパターン (V-model 違反、AI 実装が踏みがち)

以下は AI 実装が踏みやすい V-model / W-model 違反。`ut-tdd plan lint` / `vmodel_validator` で機械検出し、`frontier-reviewer` の 3 点レビュー観点にも組み込む (要件定義書 §2 / §7)。

| # | アンチパターン | 違反内容 |
|---|----------------|----------|
| AP-1 | ① 設計と ② 実装コードを同一文書に書く | D-API 内にコード本体を埋め込む |
| AP-2 | ① 設計と ③ テスト設計を同一文書に書く | D-API 内に test case 列挙を埋め込む |
| AP-3 | ③ テスト設計と ④ テストコードを同一文書に書く | test ファイル先頭の長文 docstring に case 設計 |
| AP-4 | AC なしで G3 を通す | L3 要件に受入条件が無いまま実装着手 |
| AP-5 | `parent_design` 不在で L7 実装 PLAN 起票 | 機能設計 doc に紐づかない実装 |
| AP-6 | L1 に FR を書く | 業務要求工程にシステム機能要件が混入 |
| AP-7 | 右側工程でペア未凍結のテスト設計を新規起票 | L8/L9 でテスト設計を後付け (W-model 違反) |
| AP-8 | 逆ピラミッド (① + ② はあるが ③ + ④ が無い) | 「テストも書いた」と称し ③ テスト設計 doc を欠く |
| AP-9 | 重複実装 / 機能被り | 既存に同等機能があるのに再実装する (着手前の `ut-tdd code find` 流用確認を怠る。被りは Add-feature / Refactor へ回す) |
| AP-10 | 依存関係違反 | 呼び出し/import グラフに orphan・cycle・missing、またはレイヤリング違反を生む (機能単位レビューで検出) |
| AP-11 | L1 を 1 PLAN / 1 doc にまとめる | V2 HELIX-workflows 正本では L1 = 5 sub-doc (業務/機能/画面/技術/非機能、§3.1.2.1)。1 doc 統合は要求の関心混在で再番号化リスク |
| AP-12 | L2-L6 sub-doc 構造を持たない設計 PLAN | V2 HELIX-workflows 正本では L2=4 / L3=3 / L4=5 / L5=4 / L6=3 sub-doc (§3.1.3.1)。複数関心を 1 PLAN に混在させる起票は禁止 |
| AP-13 | PLAN に工程表 + 実装計画が内蔵されていない | V2 HELIX-workflows 正本では PLAN = 機能 (doc) 単位で工程表 + 実装計画を内蔵 (§3.6)。本文 0 行・成果物 declare のみの PLAN は無効 |

## 3.6 PLAN 内蔵物原則 (V2 HELIX-workflows 共通)

V2 HELIX-workflows 正本に従い、**PLAN は機能 (=ドキュメント) 単位で起票し、以下 2 要素を内蔵する**:

| 内蔵要素 | 内容 |
|----------|------|
| **工程表 (作成手順 + 進捗)** | そのドキュメントを完成させる手順 (例: 参考調査 Web 検索 → 既存資料整理 → ドラフト → TL レビュー → 確定) と各手順の進捗 (`☐ / 🔄 / ✅`) |
| **実装計画** | 記載項目をどう埋めるかの計画 (情報源 / Web/TL 調査が必要か / 人間 PO ヒアリングが必要か / 自動生成可能か 等) |

PLAN 本文は「ヒアリング項目・メモ・調査結果」の **中間準備ドシエ**であり、**正本 doc (上記 sub-doc) とは別文書**。正本 doc は PLAN §0 の `generates` で declare する成果物。

工程表 Step には **review (self / pmo-sonnet / tl-advisor) を必ず固定 Step として組み込む** (self-review 前置原則と整合、`.claude/CLAUDE.md` Guard Rules)。

## 3.7 駆動別 L2-L14 挙動表 (V2 HELIX SKILL_MAP 正本 + V2 process L 番号 remap)

各 drive (be / fe / fullstack / db / agent) で L2-L14 の中身とゲート判定が変わる。**正本は `vendor/helix-source/skills/SKILL_MAP.md §駆動タイプ別 L2〜L11`** を V2 process docs (`vendor/helix-source/docs/v2/process/L00-L14`) の L 番号に remap して転写したもの:

| フェーズ | be | fe | db | fullstack | agent |
|---------|----|----|----|-----------|----|
| **L2 画面設計** | (UI 不在で skip / 軽量) | **モック駆動設計** (方針 + token + `mock.html` + `state-events.md`) | (UI 不在で skip / 軽量) | BE 方針 + FE 方針 (**mock 含**) + 接続契約方針 (同時策定) | 会話 UI モック / プロンプト UI 設計 |
| **L3 要件定義** | API 契約 + DB + 工程表 | TL が `state-events.md` から **API 契約導出** + DB + 工程表 | マイグレーション + API 契約 + 工程表 | D-API + D-UI + D-CONTRACT + D-DB + D-STATE + **mock** + 工程表 | ツール契約 + 統合要件 + 工程表 |
| **L4 基本設計** | アーキ・API 方針・ADR | mock 凍結後のアーキ反映 + Contract | ER 図・スキーマ方針 | BE 方針 + FE 方針 + Contract 三点凍結 | ツール定義・オーケストレーション方針 |
| **L5 詳細設計** | D-API / D-DB / D-CONTRACT | mock→API 契約導出 + D-API/D-DB | D-DB 中心 + D-API | 全 D-* + mock | ツール契約詳細 + state-events |
| **L6 機能設計** | 関数 signature | コンポーネント仕様 + 関数 signature | CRUD 関数 + マイグレーション | 全領域 | ツール関数 + プロンプトテンプレ |
| **L7 実装順** | ロジック → API → FE | BE (契約 base) ∥ FE (**モック → 本実装昇格**) → 統合 | スキーマ → CRUD → API → FE | Phase A: BE Sprint ∥ FE Sprint (**mock 起点**) → Phase B: L5/L8 結合 | ツール → オーケストレーション → UI |
| **L10 UX 磨き** | 薄い (表示確認) | **厚い** (デザイン駆動) | 薄い (管理画面確認) | 標準 (結合後に Visual Refinement) | 会話 UI / デモ確認 |
| **L13 デプロイ後検証** | 標準 | 標準 | 薄い | 標準 | 薄い |
| **L14 運用検証** | 標準 | 標準 | 薄い | 標準 | 標準 |
| **G2 凍結** | (UI なしなら skip 可) | **モック凍結** (UX 承認) | (UI なしなら skip 可) | 接続契約方針凍結 (BE + FE + Contract 三点セット) | 会話 UI モック凍結 |
| **G5 着手** (API/Schema Freeze) | API/Schema Freeze | **モック + API/Schema Freeze** | Migration Freeze | API/Schema/UI/Contract 全凍結 | Tool Contract Freeze |

### L10 (UX 磨き) 要否 (drive 別)

| drive | L10 必要条件 |
|-------|-------------|
| be | UI を持つ場合のみ (be 単独 BE-only なら skip) |
| fe | **常に必要** (FE 駆動の核心) |
| db | UI を持つ場合のみ |
| fullstack | **常に必要** (結合後の Visual Refinement) |
| agent | **常に必要** (会話 UI / デモ) |

### L2 sub-doc skip ルール (drive 別)

| drive | L2 sub-doc 4 種 (画面一覧/遷移/ワイヤー/UI 要素) の扱い |
|-------|-------------------------------------------------------|
| be (BE-only) | 全 skip 可 (frontmatter `skip_sub_doc: ["L2-*"]` + 理由 `"BE-only, no UI"`) |
| fe | 全必須 |
| db (UI 無し) | 全 skip 可 |
| fullstack | 全必須 |
| agent | 全必須 (会話 UI を要素として扱う) |

L4 画面設計、L5 物理データ設計 等の sub-doc skip も同様に drive で判定 (PLAN frontmatter `skip_sub_doc:` で明示)。

> 注: SKILL_MAP では L9-L11 が「デプロイ検証 / 観測 / 運用学習」だったが、UT-TDD は V2 process docs を正本として L9=総合テスト / L10=UX 磨き / L11=総合レビュー+UAT / L12=デプロイ+受入 / L13=デプロイ後検証 / L14=運用検証 を採用。本表は SKILL_MAP の挙動を V2 process L 番号に合わせて remap している。

---

# §4 経路 2: Scrum × Reverse 自動 routing (PoC → 文書化)

> **v3.1 mode 対応**: 本 §4 (経路 2) は 9-mode (§2.5) の **Scrum / Reverse / Discovery** に、§5 (経路 3) は **Add-feature** に、§6 (緊急経路) は **Recovery / Incident** に対応する。各 mode の入口判定・推奨コマンド・承認者は §2.6 の配線で決まる。Forward 合流先の層番号は L0-L14 (§3) を正とする (旧 L0-L11 表記が本節以降に残る場合は §3 に読み替える)。

## 4.1 概念

要件未確定 / 仮説検証フェーズの開発を、確定後に通常開発 (Forward mode) へ合流させる経路。Scrum モードで PoC を回し、決着 (S4 decide) 後に Reverse モードで「PoC コード → 設計 doc」を逆復元し、Forward に接続する。

## 4.2 Scrum モード (S0-S4)

仮説の性質に応じて **6 type** に分類:

- hypothesis-test (基本仮説検証)
- tech-spike (技術検証)
- design-spike (設計検証)
- perf-spike (性能検証)
- security-spike (セキュリティ検証)
- ux-spike (UX 検証)

各 type は S0 (Backlog) → S1 (Sprint Plan) → S2 (PoC 実装) → S3 (Verify) → S4 (Decide: confirmed / rejected / pivot) のフェーズを辿る。`agent_slots` の `aim` が PoC 実装を担当、`tl` が S4 decide を担当。

## 4.3 Reverse モード (R0-R4)

S4 で confirmed になった PoC を本実装に昇格させるため、PoC コードから設計 doc を逆復元する。**5 type** に分類:

- code (コードから設計復元 — 標準)
- design (デザイン資産から復元、R1 skip)
- upgrade (既存 system + 新版差分から)
- normalization (設計 drift 修正、R1 skip)
- fullback (実装完遂後の文書整合)

各 type は R0 (Evidence) → R1 (Observed Contracts、type により skip) → R2 (As-Is Design) → R3 (Intent 仮説、**po 検証**) → R4 (Gap & Forward Routing) を辿る。

## 4.4 30 cell matrix (Scrum 6 type × Reverse 5 type — 元 Critical C4 fix)

Scrum 6 type と Reverse 5 type の組み合わせで「どの routing を使うか」を機械判定する。

**R1 skip 判定の主キーは解決済み reverse_type を採用する**。v2.1 では `scrum_type` 固定で「tech-spike → R1 skip」のように決め打ちしていたが、Alternative reverse routing (例: tech-spike × upgrade) が許容されているため、scrum_type 単独では判定不能。**R1 実施/skip 列は 30 cell に明示的に持つ**。

30 cell の具体表は要件定義書 §3 に確定する。

## 4.5 経路 2 → 経路 1 合流

R4 で Gap を整理した後、UT-TDD Agent Harness の Forward 経路に接続。R4 outcome に応じて L1 (要求定義) / L3 (要件定義 FR+AC) / L4 (基本設計) / L5 (詳細設計) / gap-only (差分集約のみ、新規層なし) のどこに合流するかを決める (L0-L14 体系。旧 L2/L3 = 全体設計/詳細設計 は L4/L5 に remap。要件定義書 §3.4)。

このとき PoC / 検証成果を **そのまま機能として活かすか**、**再設計して導入するか** は `promotion_strategy` として別判定にする。`forward_routing` は合流レイヤー、`promotion_strategy` は成果物の扱いを表す。PoC コードをそのまま main に入れることは原則禁止で、reuse する場合も trace / test / security 条件を満たしたものだけに限定する。

---

# §5 経路 3: add-design / add-impl (追加実装対応)

## 5.1 概念

既存 PLAN が completed 後、機能拡張・追加実装が必要になったときの経路。問題 P4 (既存実装への破壊的追加) に対処する。

### 経路 3 の禁則 (3 原則)

| 原則 | 内容 |
|------|------|
| **既存設計を改変しない** | 既存 PLAN の ① 設計 doc は不可変。差分は新規 add-design doc に分離 |
| **既存テストを変更しない** | 既存 ④ テストコードは不可変 (回帰検知の生命線)。新規テストのみ追加 |
| **回帰確認必須** | add-impl の merge 前に既存テスト全 PASS を CI で確認 |

## 5.2 経路 3 で使う kind

- `add-design`: 既存 PLAN への設計追補
- `add-impl`: 既存 PLAN への実装追加

両者とも `dependencies.parent` で既存 PLAN を指定する。

## 5.3 経路 3 の流れ (概念)

```
既存 PLAN-NNN completed
   ↓
新規 PLAN-MMM-add-design 起票 (parent: PLAN-NNN)
   ↓ 既存設計を変更せず差分追加、③ 新規テスト設計も pair
   ↓ G3-G6 (差分の設計層のみ対象、W-model 左)
新規 PLAN-MMM-add-impl 起票 (parent: PLAN-MMM-add-design)
   ↓ 既存コードを変更せず、新規 src + 新規 tests のみ追加
   ↓ CI で既存テスト全 PASS 確認 (回帰確認)
   ↓ G7 (差分の 4 artifact trace + 回帰結果)
   ↓
merge → 既存 PLAN との双方向 reference 更新
```

---

# §6 補助 1: 緊急経路 (recovery / hotfix)

## 6.1 概念

P0/P1 インシデント発生時、または AI session 中の認識ずれ・session 断絶からの再開のために、通常経路を一時迂回する経路。

## 6.2 recovery kind

session 断絶・認識ずれからの再開を文書化するための kind。`agent_slots` に `aim` を必須化し、本文に **7 必須セクション** (事故記録 / 議論順序 / 認識訂正履歴 / 中間結論 / context 再構築 / 再開ポイント / 再発防止) を持つ。

## 6.3 hotfix ブランチ + ワークフロー

P0/P1 障害の即時修正用ブランチ。Branch Protection で hotfix postmortem doc の存在 + recovery PLAN 紐付けを必須化する。

## 6.4 session 終了前 fail-close (概念)

AI session が context 限界 / commit 直前で「やり残し」を残さないため、push 前に以下を必須チェックする (具体的 4 項目と判定方法は要件定義書 §5):

- 設計 ⇔ 実装 ⇔ テストの整合性
- 未 commit ファイルの取り残し
- 認識ずれの記録
- 次セッションへの引き継ぎメモ

---

# §7 補助 2: GitHub 統制 (全経路の共通基盤)

## 7.1 概念

3 経路を **GitHub Flow** 上で機械強制する基盤。Branch Protection / CODEOWNERS / commitlint / Required Status Checks を組み合わせる。

## 7.2 Required Status Checks の方針 (元 Critical C6 fix)

v2.1 では「branch type 別 workflow を OR 条件で扱う」「該当 workflow が走らない場合 GitHub が自動 skip 判定」と書いていたが、これは GitHub の実挙動と不整合。v3.0 では以下方針に確定する:

**方針: 共通 required check 1 本 (`harness-check`) に集約し、内部で branch type ごとに fail-close 分岐する**。

- 全 PR で `harness-check` のみを Required Status Checks に指定
- `harness-check` 内部で `feature/*` / `poc/*` / `hotfix/*` / `refactor/*` 等を識別し、branch type 固有のチェックを呼び分け
- branch type 固有チェック (poc-no-merge-guard 等) は `harness-check` の subjob として実装し、それ自体は Required Status Checks に登録しない

これにより GitHub の「pending で詰まる」問題と「branch type 固有 check が merge gate にならない」問題を同時に解決する。詳細は要件定義書 §6 / 個別 PLAN-XXX の workflow 詳細設計。

コストと開発体験のため、ローカル hook は harness 自身の小さな self-test / lint / 差分検査だけに限定する。PR 通過要件は GitHub Actions の `harness-check` に集約し、全量テスト・重い vmodel 検証・回帰確認は PR 上で実行する。

## 7.3 ブランチタイプと kind の対応

| ブランチ prefix | 対応 kind | 用途 |
|----------------|-----------|------|
| `feature/*` | `impl` | 通常実装 (経路 1) |
| `design/*` | `design` / `charter` | 設計 doc・L0 企画書起票 (経路 1 / 前段) |
| `research/*` | `research` | 技術調査 (経路 1 前段) |
| `poc/*` | `poc` | 仮説検証 (経路 2 Scrum) |
| `reverse/*` | `reverse` | 設計復元 (経路 2 Reverse) |
| `add/*` | `add-impl` / `add-design` | 既存拡張 (経路 3) |
| `hotfix/*` | `recovery` / `troubleshoot` | 緊急 (補助 1) |
| `refactor/*` | `refactor` / `retrofit` | 内部改善 |
| `docs/*` | (PLAN 不要、例外) | ドキュメントのみ修正 |
| `chore/*` | (PLAN 不要、例外) | 雑務 (依存更新 / CI 設定変更等) |

`branch-kind-check` が PR 起票時に prefix と PLAN kind の整合を機械検証する。**正本は要件定義書 §6.1** (本表はその要約。全 12 kind 網羅・例外 branch の扱いは §6.1 / §7.4)。

## 7.4 PoC → main 直 merge 禁止 (概念)

`poc/*` から main への直接 PR は **物理ブロック**。S4 decide で confirmed になった後、Reverse R0-R4 を経由して `feature/*` ブランチで再実装する経路を強制する。これにより問題 P3 (PoC が独り歩き) を構造的に防ぐ。

具体的な workflow event 設定は要件定義書 §6 で確定する (v2.1 の C5 指摘を fix)。

---

# §8 補助 3: 3 層抽象化 + エスカレーション

## 8.1 概念 (v3.0 重要)

`workflows/*.yaml` / `harness/*.yaml` は **人間と AI が参照する設計仕様書** として位置付け、**実行する interpreter は導入しない**。共有のエスカレーション判定は `scripts/check-escalation-level.sh` + GitHub Actions artifact / job summary で実現し、個人 `failure_log.jsonl` は local advisory に限定する。これにより外部依存 (Temporal / Prefect 等) を避け、軽量実装を保つ。

## 8.2 3 層の役割

```
[層 1] スキル層 (docs/skills/*.md)
  ← 「何をすべきか」の知識 (個別技術 / 観点リスト)
         ↓ 組み合わせ定義 (設計参照のみ)
[層 2] ワークフロー層 (workflows/*.yaml)
  ← スキル呼び出し順序の DAG 定義 (設計仕様書、人間と AI が参照)
         ↓ 設計参照
[層 3] ハーネス層 (harness/*.yaml)
  ← ワークフロー自動実行条件 + ゲート発火 + レビュー注入強度 (設計仕様書)
```

AI (Claude Code / Codex) は PLAN 起票時に層 2/3 YAML を **自然言語指示として** 読み、step 順序と on_failure 規約を適用する。専用 interpreter は無い。

HELIX 由来のスキル群は、個人プロジェクト用の原文をそのまま使わず、UT-TDD 向けの **skill pack** として `docs/skills/*.md` に正本化する。移植対象は「追加機能設計」「ドキュメント」「実装」「テスト」「Reverse」「運用」の単位に分け、各 skill pack は必ず workflow / harness / gate のどれに接続するかを明記する。

特に、追加機能設計では既存設計を破壊しない `add-design` / `add-impl` 原則、ドキュメント・実装・テストの成果物一致では 4 artifact trace / L6 QA doc-first / review 後の追加 regression を skill pack 側から参照できるようにする。skill は知識と観点の層に閉じ、実行条件や fail-close は harness-check 側で機械強制する。

## 8.3 エスカレーション L0-L3 (元 Critical C8 fix)

reviewer の自動切替レベル:

| Level | reviewer | 動作 |
|---|---|---|
| L0 | agent | AI レビューのみ |
| L1 | aim | AI実装・保守の人間レビュー追加 |
| L2 | council | tl + qa + aim 3 者会議 |
| L3 | human | po 直接通知 + 作業一時停止 |

**昇格判定の概念 (v3.0 で訂正)**: level は「同種失敗 N 回 / 再失敗 M 回」の **閾値を満たす最大値を冪等に算出**する。v2.1 で記述していた「current_level + 1 漸進」は誤り (N=15 を初回観測した場合 L1 止まりになり Human 停止が遅れる)。

例: 同種失敗 N=15 を初回観測した時点で `target_level = max(L1=3, L2=7, L3=15 を満たす)` = L3 と判定し、即 Human 通知。具体的算出ロジックは要件定義書 §8 で確定。

## 8.4 降格判定

`scripts/check-escalation-stale.sh` で定期実行 (週次):

- 違反検出ゼロ 90 日継続 → 降格 **推奨表示のみ** (自動降格しない)
- 未使用 30 日 → warning
- 未使用 90 日 → archive 候補 (human 確認後に非アクティブ化)

降格 / archive は **human (po または tl) 確認後にのみ実行**。

## 8.5 failure_log の取扱い (元 Critical C7 fix)

v2.1 では `failure_log.jsonl` を「git 管理対象」かつ「pre-push hook で書き込み」としていたが、これは矛盾 (push 失敗時の追記は commit に含まれず作業ツリーを dirty 化するだけ)。v3.0 では以下方針に確定する:

**方針: failure_log.jsonl は個人作業ログ (local-ignore) として扱い、チーム共有 audit trail は別経路で実現する**。

| ログ種別 | 位置 | git 管理 | 書き込み主体 |
|---------|------|---------|--------------|
| **個人作業ログ** | `.ut-tdd/audit/failure_log.jsonl` | **`.gitignore`** | ローカル pre-push hook / `scripts/log-failure.sh` |
| **チーム共有 audit** | GitHub Actions job summary + artifact / PR comment。PR label は状態表示のみ | (Actions が管理) | CI job |
| **escalation 集計** | チーム共有 audit のみを正本入力にする。個人ログは local advisory | — | `check-escalation-level.sh` |

詳細は要件定義書 §8 で確定する。

---

# §9 補助 4: チーム責任二極化

## 9.1 5 役割の責任マトリクス

構想書 v1.1 §2.3 の 5 役割を、本ハーネスの全要素にマッピング:

| 役割 | 略号 | 上流 / 下流 | 主責任 |
|---|---|---|---|
| **発注元** | po | (両端) | WHY / WHAT / 受入基準 / R3 Intent 検証 / リリース承認 |
| **TL** (技術責任者) | tl | **上流** | 仕様化 (L3 FR+AC) / アーキ (L4-L6) / G0.5-G6 ゲート / adversarial review / ハーネス設計 |
| **QA** (品質責任者) | qa | **下流** | テスト戦略 / G8-G9 ゲート (L8 結合・L9 総合) / インシデント指揮 / 観点リスト整備 / failure_pattern Issue 月次レビュー |
| **AI実装・保守** | aim | (中間) | AI 指示 / L7 実装委譲 / 3 点レビュー / アラート対応 / エスカレーション初動 / 4 段レビュー Layer 2 |
| **UI/UX デザイン** | uiux | (横断) | Figma / モック (L2 画面設計) / state-events / L10 UX 磨き (screen-design / frontend-design mode) |

## 9.2 役割 × mode マトリクス

mode は §2.5 の 9-mode。旧「経路 1/2/3 + 補助 1」を mode 名へ読み替えた。

| | Forward | Reverse / Scrum / Discovery | Add-feature | Recovery / Incident |
|---|---|---|---|---|
| **po** | L1 業務要求 / L3 受入条件 / G1·G3 / L11 UAT / L12 受入 | **R3 Intent 検証** / Discovery 成功条件 | (通常は不要) | P0/P1 で連絡 / Recovery スコープ承認 |
| **tl** | G0.5 企画突合 / L4-L6 設計 / G4-G6 | S4 decide / R1-R2 / R4 routing | 既存 doc 整合判断 | 技術対応指揮 / リオープン確認 |
| **qa** | G8-G9 / L8 結合・L9 総合テスト | (通常は L8/L9 で合流) | 回帰確認 | インシデント指揮 |
| **aim** | L7 実装委譲 / 3 点レビュー / 4 段 Layer 2 | S0-S3 PoC 実装 / R0 証拠 | 既存テスト維持確認 | 初動アラート対応 |
| **uiux** | L2 画面設計 / L10 UX 磨き | UX-spike PoC | 既存 UX との整合 | (通常は不要) |

## 9.3 PR レビュー 4 段階 (運用ルール書 §2.4 を実装)

| Layer | レビュアー | 観点 | 応答目安 |
|---|---|---|---|
| **Layer 1** | AI (自動) | コード規約 / 明らかなバグ / 典型的脆弱性 | PR 作成直後 |
| **Layer 2** | aim | テスト不足 / 観点漏れ / 運用影響 / vmodel 整合 | 1 営業日以内 |
| **Layer 3** | tl (必要時) | アーキ判断 / 技術選定の妥当性 / 大規模変更影響 | 1 営業日以内 |
| **Layer 4** | qa (リリース前) | 品質ゲート観点 / E2E / 運用観点 / G9·G11 判定 | リリース前 |

CODEOWNERS で Layer 3 / Layer 4 が自動アサインされる (具体的 path → owner マッピングは要件定義書 §6)。

## 9.4 インシデントエスカレーション (運用ルール書準拠)

```
発見
  ↓
#incident チャンネル投稿 (誰でも、状況 + 影響 + タイムスタンプ)
  ↓
[aim 初動]      影響範囲確認 / 緊急度 P0-P3 判定
  ↓
[qa 指揮]      対応方針 / 関係者招集
  ↓
[tl 技術]      原因切り分け / 修正方針 / hotfix ブランチ作成
  ↓
[該当者]      修正実施 (または se 委譲)
  ↓
[po]           顧客対応判断 (必要時)
  ↓
収束 → postmortem (48h 以内、P0/P1 必須)
  ↓
[全員]        再発防止策を観点リスト / AGENTS.md / CI に反映
```

## 9.5 役割不在時の代行

| 不在 | 代行 |
|---|---|
| tl | qa が技術判断も代行 (慎重に) |
| qa | aim が初動、リリースは保留 |
| po | 顧客影響を判断、不可逆な変更は保留 |
| 全員 (深夜等) | 影響軽微なら翌朝、重大なら誰かに連絡 |

---

# §10 用語集

| 用語 | 定義 |
|---|---|
| **ハーネス** | AI エージェントを安全に動かす土台 (構想書 v1.1 用語集) |
| **9-mode ecosystem** | Forward / Reverse / Discovery / Refactor / Retrofit / Recovery / Scrum / Incident / Add-feature の 9 mode + screen-design / frontend-design の 2 工程専門 (§2.5)。旧「3 経路 + 4 補助軸」を再編した入口分類 |
| **配線** | signal → mode 自動 routing / mode → command 機械契約 (RecommendedCommandV1) / drive×layer 注入 (orchestration_mode 等) / 横断検出 の連携機構 (§2.6) |
| **orchestration_mode** | drive×layer ごとの「誰が判断し誰が実装するか」(pm_lead / claude_judge / claude_judge_codex_impl / codex_impl_qa_verify / claude_design_impl) |
| **L0-L14 + W-model** | V2 由来の 15 工程。左 (設計 L0-L6) と右 (検証 L8-L14) が対 (L1↔L14 / L2↔L10 / L3↔L12 / L4↔L9 / L5↔L8 / L6↔L7) |
| **V-model 4 artifact** | ① 設計 (文書) / ② 実装コード / ③ テスト設計 (文書) / ④ テストコード の **4 成果物 (2 文書 + 2 コード)** ※ v3.0 で訂正 |
| **Pair freeze** | 設計 artifact 凍結時にテスト設計 artifact も同時凍結するルール (W-model 左各層 G1/G3/G4/G5/G6 で発火) |
| **4 artifact trace freeze** | L7 実装完了時に 4 artifact 揃いと双方向 trace 6 pair を凍結するルール (G7 で発火) |
| **双方向 trace 6 pair** | 4 artifact の組み合わせ 6 pair それぞれを双方向 reference で結ぶ (実装上は 12 directed edge) |
| **逆ピラミッド** | ① ② が存在するが ③ ④ が無い / 不完全な状態 (G6/G7 で fail-close) |
| **Scrum 6 type** | hypothesis-test / tech-spike / design-spike / perf-spike / security-spike / ux-spike |
| **Reverse 5 type** | code / design / upgrade / normalization / fullback |
| **30 cell matrix** | Scrum 6 type × Reverse 5 type の自動 routing 表 (R1 skip 列を含む) |
| **R3 Intent 検証** | 発注元 (po) が Reverse R3 で意図仮説を直接検証するステップ |
| **PLAN** | 工程ルール doc。frontmatter + 本文 |
| **PLAN-MM-NNN** | Master Plan。複数子 PLAN を親 hub として束ねる設計プラン |
| **kind / layer / drive / workflow_phase / artifact_type** | PLAN frontmatter の主要 enum 軸 (定義は要件定義書 §1) |
| **agent_slots** | PLAN で割り当てる役割スロット (po / tl / qa / aim / uiux / se / docs) |
| **3 層抽象化** | スキル / ワークフロー / ハーネスの YAML 階層 (v2.1: **設計仕様書**として位置付け、interpreter 不要) |
| **エスカレーション L0-L3** | reviewer 自動切替レベル (agent / aim / council / human)。level は閾値を満たす最大値を冪等に算出 |
| **recovery kind** | session 断絶・認識ずれからの再開のための PLAN 種別 |
| **session 終了前 fail-close** | commit/push 前の必須チェック (具体項目は要件定義書 §5) |
| **CODEOWNERS** | GitHub ファイル領域 × レビュアー責任マトリクス |
| **Conventional Commits** | コミットメッセージ規約 |
| **vmodel_lint** | 4 artifact 揃い + 双方向 trace を検証する CLI (実装詳細は要件定義書 §7 + 個別 PLAN) |
| **ut-tdd doctor** | 統合検証 CLI |
| **branch-kind-check** | ブランチ prefix と PLAN kind の整合性検証 |
| **failure_log** | 個人作業ログ (local-ignore)。チーム共有 audit trail は別経路 (§8.5) |
| **harness-check** | 全 PR 共通の Required Status Check (内部で branch type 分岐) |

---

# §11 参考文献

## 内部参考 (`docs/governance/` 配下)

- `ai-dev-team-concept_v1.1.md` (AI 駆動開発チーム構想書 v1.1)
- `ai-dev-team-operations_v1.1.md` (AI 駆動開発チーム運用ルール書 v1.1)
- `ut-tdd-agent-harness-concept_v3.1.md` (本書)
- `ut-tdd-agent-harness-requirements_v1.2.md` (要件定義書)

## 業界 standard

### V-model + 4 artifact 双方向 trace

- NASA SW Engineering Handbook Appendix (V&V 構造)
- IEEE Wikipedia: V-model (software development)
- DO-178C 開発ライフサイクル仕様
- Parasoft: ISO 26262 Requirements Traceability
- CMMI v2.0 SP 1.4 Requirements Management
- IEEE 829-2008 テスト成果物
- ISO/IEC/IEEE 29119-2 テスト設計仕様

### Scrum + Reverse engineering

- Scrum.org — What is a Spike?
- Agile Alliance — Spikes
- Martin Fowler — Exploratory Testing
- SAFe — Spikes (enabler spike)
- Mike Cohn — Spikes (time-box + validated)
- Basecamp Shape Up — Uncertainty Reduction
- OMG MOF 2.0 — Model-Driven Architecture
- arc42 — Reverse Engineering Integration

### GitHub Actions + ブランチパイプライン

- Conventional Commits v1.0.0 specification
- commitlint official docs — @commitlint/config-conventional
- GitHub branch protection rules — required status checks
- GitHub Actions — workflow syntax / job ids / status check names
- CODEOWNERS syntax and examples
- Atlassian — Branch per feature workflow

### 3 層抽象化 + エスカレーション (参考、interpreter は採用せず)

- AWS Step Functions — State Machine Abstraction (参考のみ)
- Temporal.io Workflow Abstraction (参考のみ)
- Prefect Flows & Tasks (参考のみ)
- PagerDuty Escalation Policy Design
- AWS Incident Manager Escalation Plans
- Martin Fowler: Approval Workflow Pattern
- Google SRE — Escalation chapter
- LaunchDarkly Flag Lifecycle (30/90 日閾値)

---

# §12 改定履歴

| Version | 日付 | 変更内容 | 策定者 |
|---|---|---|---|
| 2.1 | 2026-05-20 | (旧版) TL レビュー第 1+2 回 計 29 件反映、構想 + 要件 + 実装詳細を統合 | PM + TL |
| **3.0** | **2026-05-20** | **構想書と要件定義書に分離。本書は構想 (WHY/WHAT/どう繋がるか) のみ。TL Round 3 の概念レベル Critical 5 件 (C1/C4/C6/C7/C8) + I22 を反映** | **PM + TL** |
| **3.1** | **2026-05-27** | **V2 (HELIX-workflows、`vendor/helix-source/docs/v2/`) の工程・モード・配線をチーム開発向けに取り込み。(V1) §3 を L0-L14 + W-model に作り替え (旧 L0-L11+小数層を remap)。(V2) §2.5 9-mode ecosystem 新設 (Discovery/Refactor/Retrofit/screen-design/frontend-design 追加)。(V3) §2.6 配線新設 (signal→mode routing / RecommendedCommandV1 safety / 横断検出)。(V4) orchestration_mode 5 値。(V5) §3.5 工程別アンチパターン。`requires_human_approval` を「誰が承認するか」へチーム翻案。(V6) §2.1.2.1 execution mode × レビューゲート切り分け新設 (self-review が cross-agent review に化ける gate 崩壊を防止)。レビュー強度 3 ティア (① cross-agent / ② 専門サブエージェント / ③ self) を定義し、**単一エージェント時は ② 専門サブエージェント review を hard 要件化** (明文化 checklist 駆動、要件定義書 §7.8.7.1)。レビュー範囲を関数単位/機能単位/横断に拡張し、依存関係・重複実装の検出を §3.1.4 / AP-9・AP-10 に追加。(V8) ADR-001 で実装言語を **TypeScript (Bun)** に確定 (HELIX は概念のみ + 全面再実装、旧 W1-W3a Python は superseded)。(V7) §2.1.0 に 2 つのマスト原則 (① ルール同一性: Claude/Codex は同一ルール・同一判定・同一 exit code、CLAUDE.md/AGENTS.md は薄い adapter / ② hybrid 機能分散: 判断系↔実行系を別 runtime、二重実行禁止) を MUST 化。要件定義書は v1.2 連動** | **PM (Opus)** |

---

**本書は UT-TDD-agent-harness の概念定義書である。受入条件・enum 詳細・Phase 0 受入条件は `ut-tdd-agent-harness-requirements_v1.2.md` を参照。実装詳細 (validator / workflow YAML / hook script) は将来の個別 PLAN-XXX で詳細設計する。**
