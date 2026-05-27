# UT-TDD-agent-harness 構想書

> **⚠️ Superseded (2026-05-27)**: 本書は **`ut-tdd-agent-harness-concept_v3.1.md` に置き換えられた旧版**。現行正本ではない。v3.1 で V2 (L0-L14 + W-model) / 9-mode / 配線 / 実装言語 = TypeScript (ADR-001) を反映。参照は v3.1 を使うこと。本書は履歴として残置。

- **Version**: 3.0
- **位置付け**: 構想書 (L1 概念層) / 要件定義書は別ファイル
- **対応構想書**: AI駆動開発チーム構想書 v1.1
- **対応運用ルール書**: AI駆動開発チーム運用ルール書 v1.1
- **想定実装エージェント**: Claude Code (複雑タスク・設計判断) / Codex (自律実行・並列処理)
- **対象 OS**:
  - Windows / macOS / Linux: ネイティブ動作を第一級対応
  - Windows: PowerShell entrypoint を提供し、Git Bash 依存を局所化する
  - macOS / Linux: POSIX shell entrypoint を提供する
  - WSL2: 任意の互換実行環境。必須条件にはしない
  - CI: `ubuntu-latest` を基準にしつつ、Windows smoke を追加する
- **対象リポジトリ言語**: 言語非依存 (`ut-tdd` の test adapter / repository-local test command で吸収)

## 本書の位置付け

本書は **構想書 (concept document)** として、**WHY / WHAT / どう繋がるか** のみを定義する。**HOW** は別ファイル `ut-tdd-agent-harness-requirements_v1.1.md` (要件定義書) で定義し、さらに各 enum・スクリプト・workflow YAML の **詳細実装** は L3 詳細設計 PLAN で詰める。

| ファイル | 役割 | 抽象レベル |
|---------|------|------------|
| 本書 (構想書 v3.0) | 概念 / 経路 / 補助軸 / 役割 | L1 概念 |
| 要件定義書 v1.1 | 受入条件 / enum / fail-close 条件 / Phase 0 受入条件 | L1-L2 要件 |
| 個別 PLAN-XXX (将来) | validator 実装 / workflow YAML / hook script | L3 詳細設計 |

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
├── ut-tdd-agent-harness-concept_v3.0.md
└── ut-tdd-agent-harness-requirements_v1.1.md
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

- 設計判断、要件分解、R4 合流判定、G2/G3/G4 レビューは **現在作業している AI とは別系統の最上位モデルクラス** (`frontier-reviewer`) に依頼する。
- 実装、機械的修正、テスト追加、ドキュメント整形は **実行向けモデルクラス** (`worker`) に依頼する。
- 軽量 lint、要約、差分分類、コマンド生成補助は **低コスト高速モデルクラス** (`fast-checker`) に寄せる。
- 同一 AI / 同一モデルが作った設計を同一モデルだけで承認しない。`hybrid` mode では cross-agent review を原則とし、単体 mode では self-review を P1 warning として記録する。

モデルの実名は変動するため構想書には固定しない。`.ut-tdd/teams/*.yaml` で provider / command / model / role / budget を宣言し、`ut-tdd status` が利用可否を表示する。これにより「Claude Code が中核」「Codex が実装/並列」「optional adapter が補助」という現在の構成を保ちつつ、将来のモデル更新に追従できる。

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
       │ → L4 実装 → 4 artifact trace  │ → R0-R4 → R4 で Forward 合流  │ + 回帰確認
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

| Artifact | 種別 | 担当 layer | 主成果物例 |
|---|---|---|---|
| ① 設計 | 文書 | L1-L3.5 | 要件 doc / CONCEPT / ADR / D-API / endpoint schema |
| ② 実装コード | コード成果物 | L4 | `src/*` |
| ③ テスト設計 | 文書 | L1-L3.5 (① と同層) | 受入/総合/結合/単体テスト設計 doc |
| ④ テストコード | コード成果物 | L4 (② と同層) | `tests/*` |

### 3 段階 freeze (v3.0 で明示分離 — 元 Critical C1 fix)

v2.1 では「4 artifact pair freeze」が L4 実装前後を跨いで曖昧だった。v3.0 では工程順に応じて **3 段階の freeze 概念** に分離する:

| Freeze 段階 | 発火タイミング | 凍結対象 | 担当ゲート |
|------------|---------------|----------|-----------|
| **段階 A: Pair freeze (設計⇔テスト設計)** | L4 実装着手前 | ① + ③ の文書ペア | G1 (L1) / G2 (L2) / G3 (L3 + L3.5) |
| **段階 A2: TDD Red freeze** | ② 実装コード作成前 | ③ + ④ の単体テスト設計/先行テストコード | G3.8 |
| **段階 B: 4 artifact trace freeze** | L4 実装完了時 | ① + ② + ③ + ④ の双方向 trace 6 方向 | G4 |

→ L4 実装前に ② 実装コードを freeze することは概念上ありえない。段階 A は **文書ペアの揃い**、段階 A2 は **受入を先行テストコードで固定する red state**、段階 B は **実装コードを含む 4 artifact の trace 揃い** と理解する。

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

実装上の必須 4 方向は要件定義書 §2 で確定する (① ↔ ② / ① ↔ ③ / ③ ↔ ④)。

### 逆ピラミッド検出 (P0 severity)

「① + ② が存在するが ③ + ④ が無い」状態を **逆ピラミッド** と呼び、G3 / G4 で fail-close する。AI 実装が「テストも書いた」と称しつつ ③ テスト設計 doc を欠く典型パターン。

## 2.4 5 段階セキュリティとの統合 (構想書 v1.1 §3 準拠)

構想書 §3.3 の多層防御を、本ハーネスの各補助軸に分散統合:

| セキュリティ段階 | 統合先 | 具体 tool |
|---|---|---|
| Develop | 経路 1 G3 ゲート (threat model 確認) | (人間判断) |
| Commit | pre-commit hook + commitlint | gitleaks / commitlint |
| Build | workflows の SAST / SCA / Secret Scan | trivy (SCA) / codeql (SAST) — Phase 2 で追加 |
| Deploy | hotfix workflow の incident-log + Protected Branch | `gh` CLI |
| Operate | escalation L0-L3 で異常検知 + L10 観測フェーズで Sentry/Uptime Robot/Dependabot アラートをチーム共有 audit へ記録。個人 `failure_log.jsonl` は local advisory に限定 | Sentry / Uptime Robot / Dependabot |

---

# §3 経路 1: V-model Forward (要件確定時の通常開発)

## 3.1 概念

発注元が要件 Issue を起票し、L1 → L8 (受入) まで V-model に沿って進む通常経路。本ハーネスの中核で、経路 2 (R4 後) と経路 3 もすべて本工程に最終的に合流する。

```
[L0]  基盤整備 (リポジトリ初期化、Branch Protection、Bootstrap)
  │
  ▼
[L1]  要件定義 (po + tl)
       ① 要件 doc / ③ 受入テスト設計 doc
  ↓ G1: 要件完了ゲート (po + tl 承認、L1 ①⇔③ Pair freeze)
[L2]  全体設計 (tl)
       ① CONCEPT / ADR / ③ 総合テスト設計
  ↓ G2: 設計凍結ゲート (tl + adversarial review、L2 ①⇔③ Pair freeze)
[L3]  詳細設計 (tl + uiux)
       ① D-API / D-DB / D-CONTRACT / ③ 結合テスト設計
[L3.5] 機能設計 (tl)
       ① endpoint / 関数 schema / ③ 単体テスト設計 ★UT-TDD の核
  ↓ G3: 実装着手ゲート (API/Schema Freeze + L3 + L3.5 ①⇔③ Pair freeze)
[L3.8] TDD Red (aim / se)
       ④ 単体テストコード先行作成。受入条件を failing test として固定
  ↓ G3.8: Red 固定ゲート (対象テストが実装未完了理由で fail することを確認)
[L4]   実装 (aim → se 委譲)
       ② 実装コード / ④ テストコード
  ↓ G4: 実装凍結ゲート (4 artifact trace freeze、6 pair 双方向)
[L4.5] 結合 (aim)
[L5]   Visual Refinement (uiux、drive 別に要否判断)
  ↓ G5: Visual 凍結 (drive=fe/fullstack/agent のみ)
[L6]   統合検証 (qa)
       ③ L6 QA 追加テスト設計 / ④ E2E / regression / exploratory
  ↓ G6: 品質ゲート
[L7]   デプロイ
  ↓ G7: 安定性ゲート
[L8]   受入 (po)
  ↓ G8: 受入完了
[L9]   デプロイ検証 / [L10] 観測 / [L11] 運用学習
  ↓ G9 / G10 / G11
```

## 3.2 経路 1 で使う kind

- 起点: `design` (L1-L3.5 で複数の設計 doc を起票)
- 実装: `impl` (L4)
- 補助: `research` (L1 前段の技術調査)

詳細 enum は要件定義書 §1 を参照。

## 3.3 ゲートの意味 (概念)

G1-G11 はそれぞれ「次フェーズに進むための足切り」。G1-G4 は設計/実装の品質、G5-G8 はリリース品質、G9-G11 はリリース後品質を判定。判定基準は要件定義書 §2 で機械検証可能な形に確定する。

## 3.4 QA 追加テストの分離 (V-model 補足)

L4 実装完了後に QA が追加する **regression / exploratory / edge-case** テストは、L3 結合テスト設計や L3.5 単体テスト設計に **統合してはいけない**。L6 統合検証 doc として独立レイヤー化する。理由は V-model 原則で「設計時に書いたテスト」と「品質保証時に追加するテスト」を混ぜると追跡不能になるため。

実装後レビューで見つかった不足観点は、L3/L3.5 の frozen test design を直接書き換えず、L6 QA 追加テストまたは `add-design` / `add-impl` の差分 PLAN として扱う。L6 QA 追加テストも、先に `docs/test-design/` の追加テスト設計 doc を正本化し、その doc に対応するテストコードだけを書く。これにより「実装前に固定した受入」と「実装後に発見した品質観点」を混ぜない。

---

# §4 経路 2: Scrum × Reverse 自動 routing (PoC → 文書化)

## 4.1 概念

要件未確定 / 仮説検証フェーズの開発を、確定後に通常開発 (経路 1) へ合流させる経路。Scrum モードで PoC を回し、決着 (S4 decide) 後に Reverse モードで「PoC コード → 設計 doc」を逆復元し、Forward (経路 1) に接続する。

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

R4 で Gap を整理した後、UT-TDD Agent Harness の Forward 経路に接続。R4 outcome に応じて L1 (要件) / L2 (全体設計) / L3 (詳細設計) のどこに合流するかを決める。

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
   ↓ G2/G3 (差分のみ対象)
新規 PLAN-MMM-add-impl 起票 (parent: PLAN-MMM-add-design)
   ↓ 既存コードを変更せず、新規 src + 新規 tests のみ追加
   ↓ CI で既存テスト全 PASS 確認 (回帰確認)
   ↓ G4 (差分の 4 artifact trace + 回帰結果)
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
| `poc/*` | `poc` | 仮説検証 (経路 2 Scrum) |
| `reverse/*` | `reverse` | 設計復元 (経路 2 Reverse) |
| `add/*` | `add-impl` / `add-design` | 既存拡張 (経路 3) |
| `hotfix/*` | `recovery` / `troubleshoot` | 緊急 (補助 1) |
| `refactor/*` | `refactor` / `retrofit` | 内部改善 |

`branch-kind-check` が PR 起票時に prefix と PLAN kind の整合を機械検証する (詳細は要件定義書 §6)。

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
| **TL** (技術責任者) | tl | **上流** | 仕様化 / アーキ / G1-G3 ゲート / adversarial review / ハーネス設計 |
| **QA** (品質責任者) | qa | **下流** | テスト戦略 / G4-G6 ゲート / インシデント指揮 / 観点リスト整備 / failure_pattern Issue 月次レビュー |
| **AI実装・保守** | aim | (中間) | AI 指示 / アラート対応 / エスカレーション初動 / 4 段レビュー Layer 2 |
| **UI/UX デザイン** | uiux | (横断) | Figma / モック / state-events / L5 Visual Refinement |

## 9.2 役割 × 経路マトリクス

| | 経路 1 Forward | 経路 2 Scrum×Reverse | 経路 3 add-* | 補助 1 緊急 |
|---|---|---|---|---|
| **po** | L1 受入条件 / G1 / L8 受入 | **R3 Intent 検証** | (通常は不要) | P0/P1 で連絡 |
| **tl** | L2-L3.5 設計 / G2-G3 | S4 decide / R1-R2 / R4 routing | 既存 doc 整合判断 | 技術対応指揮 |
| **qa** | G4-G6 / L6 統合検証 | (通常は L6 で合流) | 回帰確認 | インシデント指揮 |
| **aim** | L4 実装委譲 / 4 段 Layer 2 | S0-S3 PoC 実装 / R0 証拠 | 既存テスト維持確認 | 初動アラート対応 |
| **uiux** | L3 UI 設計 / L5 Refinement | UX-spike PoC | 既存 UX との整合 | (通常は不要) |

## 9.3 PR レビュー 4 段階 (運用ルール書 §2.4 を実装)

| Layer | レビュアー | 観点 | 応答目安 |
|---|---|---|---|
| **Layer 1** | AI (自動) | コード規約 / 明らかなバグ / 典型的脆弱性 | PR 作成直後 |
| **Layer 2** | aim | テスト不足 / 観点漏れ / 運用影響 / vmodel 整合 | 1 営業日以内 |
| **Layer 3** | tl (必要時) | アーキ判断 / 技術選定の妥当性 / 大規模変更影響 | 1 営業日以内 |
| **Layer 4** | qa (リリース前) | 品質ゲート観点 / E2E / 運用観点 / G6 判定 | リリース前 |

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
| **3 経路** | V-model Forward / Scrum × Reverse / add-* の実装経路 3 種 |
| **4 補助軸** | recovery / GitHub 統制 / 3 層抽象化 (設計仕様書) / チーム責任二極化 |
| **V-model 4 artifact** | ① 設計 (文書) / ② 実装コード / ③ テスト設計 (文書) / ④ テストコード の **4 成果物 (2 文書 + 2 コード)** ※ v3.0 で訂正 |
| **Pair freeze** | 設計 artifact 凍結時にテスト設計 artifact も同時凍結するルール (G1-G3 で発火) |
| **4 artifact trace freeze** | L4 実装完了時に 4 artifact 揃いと双方向 trace 6 pair を凍結するルール (G4 で発火) |
| **双方向 trace 6 pair** | 4 artifact の組み合わせ 6 pair それぞれを双方向 reference で結ぶ (実装上は 12 directed edge) |
| **逆ピラミッド** | ① ② が存在するが ③ ④ が無い / 不完全な状態 (G3/G4 で fail-close) |
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
- `ut-tdd-agent-harness-concept_v3.0.md` (本書)
- `ut-tdd-agent-harness-requirements_v1.1.md` (要件定義書)

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

---

**本書は UT-TDD-agent-harness の概念定義書である。受入条件・enum 詳細・Phase 0 受入条件は `ut-tdd-agent-harness-requirements_v1.1.md` を参照。実装詳細 (validator / workflow YAML / hook script) は将来の個別 PLAN-XXX で詳細設計する。**
