---
plan_id: PLAN-L6-64-cli-shell-completion
title: "PLAN-L6-64 (add-design): CLI シェルコンプリーション機能 (ZIP 90_CLI配布・シェル補完設計書 相当)"
kind: add-design
layer: L6
sub_doc: function-spec
drive: agent
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-13
design_decision:
  decided_at: "2026-07-13"
  decided_by: PO
  chosen: "A: PowerShell のみ・動的方式 (completion --list shellout)"
  alternatives_rejected: "B: PS+bash+zsh 一括 / C: 静的生成 / D: archived"
owner: PO / Codex
parent_design: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-blind-reviewer
    review_kind: cross_agent
    reviewed_at: "2026-07-13T18:20:00+09:00"
    tests_green_at: "2026-07-13T18:05:00+09:00"
    verdict: approve
    scope: "Codex (gpt-5.6-sol) blind review 2 周。初回 FLAG 3 件: (1) catalog 必須 metadata が U-FR-L1-48 要求に対し未固定、(2) --list 入力プロトコル (単一文字列 vs argv/cursor) の二読、(3) 常時空候補の退化実装を oracle が排除できない。§4.2/4.3/4.5 を改訂 (argv token + --cursor + prefix filtering 固定、必須 metadata 列挙、正例 oracle 3 件) し再判定で 3 件すべて解消 → PASS。opus 中間レビューで検出した exit-code carve-out 未宣言も §4.2 の REVERSE-395 明示例外として解消済み (Sol 判定で carve-out PASS)。"
    worker_model: claude-fable-5
    reviewer_model: gpt-5.6-sol
    green_commands:
      - kind: lint
        command: "bun src/cli.ts plan lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-13T18:05:00+09:00"
        evidence_path: docs/plans/PLAN-REVERSE-395-cli-command-design-backfill.md
        output_digest: "sha256:44910542f1654319c8f89f88168e6af101b9d542a8b0d5a9196664f678c77cb0"
        anchor_commit: 09a51747dd7f460c4ae56167337a690c60d51e86
agent_slots:
  - role: tl
    slot_label: "TL - shell completion コマンドの契約設計、対象シェル (bash/zsh/pwsh) の優先度判断"
generates:
  - artifact_path: docs/plans/PLAN-L6-64-cli-shell-completion.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires:
    - docs/plans/PLAN-REVERSE-395-cli-command-design-backfill.md
  references:
    - docs/design/harness/L4-basic-design/external-if.md
    - src/cli.ts
    - .ut-tdd/audit/A-185-vmodel-docgen-reference-mining-2026-07-07.md
---

# PLAN-L6-64: CLI シェルコンプリーション機能

## 0. 背景 (ZIP 再監査 2026-07-08、advisor 相談済み、PO 指示による起票)

ZIP `90_CLI配布・シェル補完設計書` はパッケージ配布/バージョン確認/シェル補完を定義する。UT-TDD 側
`src/cli.ts` には80以上のコマンドが実装済みだが、grep (`completion|shell`) では shell completion 機能
そのものへの直接該当は無く (ヒットは `work-guard.ts` 等の無関係語のみ)、実装・設計いずれにも存在しない
genuine gap と判定した。本機能は UT-TDD 自身に無関係な product-select 項目ではなく、CLI ツールとしての
利用体験に直結するため起票する。

## 1. 設計スコープ

1. `ut-tdd completion <shell>` 相当のコマンド追加要否を PO 判断のもと設計する。
2. 対象シェル (bash/zsh/PowerShell、Windows ネイティブが first-class という `.claude/CLAUDE.md` 方針を
   踏まえ PowerShell を優先候補とする) の優先順位を決める。
3. サブコマンド一覧の動的取得方法 (`src/cli.ts` の command 定義から生成) を設計する。

## 2. 受け入れ条件 (design freeze 時)

- 対象シェルと補完コマンド体系が L6 function-spec として固定される。
- PO による機能要否判断が記録される (需要が無いと判断された場合は本 PLAN の `status` を `archived` に
  変更し、skip 理由を本文に明記する)。
- `PLAN-REVERSE-395` (CLI コマンド体系 as-is 復元) は confirmed 済みで合流待ちは解除済み
  (2026-07-13 A-187 監査で本文 stale を訂正。工程管理表 `vmodel-upgrade-schedule.md` と同期)。
  復元されたコマンド一覧・終了コード規約と整合する形でサブコマンド体系を設計する。

## 3. 設計判断記録 (PO 採択 2026-07-13)

設計判断エリシテーション (`docs/governance/design-decision-elicitation.md` 形式) で 4 案を提示し、
PO が **案 A: PowerShell のみ・動的方式** を採択した。

- 却下 B (PS+bash+zsh 一括): bash/zsh の実需要エビデンスが薄い段階での約 3 倍の先行投資のため。
- 却下 C (静的生成): build 時焼き込みの二重管理が `PLAN-REVERSE-395` の警告する SSoT drift
  (`src/cli.ts` と生成物の乖離) を新たに生むため。
- 却下 D (archived): CLI ツールとしての利用体験価値を認め、最小投資 (A) で提供する判断。

## 4. Design freeze (L6 function-spec、本節が正本)

### 4.1 対象シェルと優先度

- **PowerShell (P0、本 PLAN スコープ)**: `Register-ArgumentCompleter -CommandName ut-tdd` による動的補完。
  Windows native first-class 方針 (`.claude/CLAUDE.md`) と直結。
- bash (P1) / zsh (P2、bashcompinit ブリッジ): 本 PLAN のスコープ外。需要シグナルが出た時点で
  後続 PLAN として分離起票する。

### 4.2 コマンド契約

- `ut-tdd completion powershell`: PowerShell 用ローダースクリプトを stdout へ出力する。スクリプトは
  候補列挙ロジックを持たず、実行時に `ut-tdd completion --list` を呼び返す薄いブリッジのみ。
- `ut-tdd completion --list [--cursor <n>] -- <token...>`: 補完文脈の入力プロトコルを次で固定する。
  - 入力は **シェル側で tokenize 済みの argv 配列** (`--` 以降の token 列) とする。単一文字列は受けない
    (引用符・空白の解釈をシェル側 completer の責務に固定し、二読を排除する)。PowerShell 側は
    `Register-ArgumentCompleter` の `$commandAst` から token 列を作って渡す。
  - 補完対象は `--cursor <n>` (0-based token index) の token。省略時は最終 token。
  - 判定規則: cursor token を prefix として、commander tree 上の当該階層の子コマンド名 / フラグ名を
    **prefix filtering** で絞り込み、行区切りで返す。cursor token が空文字列の場合は当該階層の全子要素を
    列挙する。
- **候補は実在する登録済み command path / フラグのサブセットに限る** (存在しない path を創作しない、
  REVERSE-395 / U-FR-L1-48 と同一不変条件)。
- 終了コード: `ut-tdd completion <未対応shell>` は exit 1 (REVERSE-395 終了コード規約の
  validation failure = exit 1 と整合)。
- **終了コード例外宣言 (REVERSE-395 への明示 carve-out)**: `--list` は不正/未確定/欠落した文脈引数でも
  **exit 0 + 空候補** とする。これは REVERSE-395 の「missing required input → exit 1」規則に対する
  本 freeze が宣言する意図的例外である。理由: `--list` の呼び出し元は人間ではなく補完スクリプトであり、
  部分入力は validation failure ではなく通常の補完文脈入力であること、および非 0 終了は
  PowerShell/bash の補完機構でシェル体感を阻害するため。L7 降下時の exit code oracle は本例外を
  正とし、missing-ctx `--list` に exit 0 を assert する。

### 4.3 catalog SSoT 一本化 (前提整備)

- commander `program.commands` を再帰 walk する extractor を新設し、completion の候補源とする。
- extractor が出力する catalog entry の必須 metadata を **U-FR-L1-48 の要求に合わせて固定**する:
  command path (top-level / subcommand 階層)、flags (名前と引数有無)、description、
  `--json` 対応有無、exit profile (REVERSE-395 規約への参照)、registrar family
  (`src/cli.ts` 直接登録 / `registerDistributionCommands` 等の外出し registrar 区分)。
  path のみの縮退出力は AC 未充足とする。
- 既存 `ut-tdd builder catalog` (`src/cli.ts` 内の手書き 7 件配列、実登録 99 コマンドと乖離した drift
  実例) は、同 extractor を `buildCommandCatalog` (`src/workflow/contracts-extras.ts`) の入力源に
  置き換える形で解消する。completion と catalog が同一 SSoT (commander tree) を共有する。

### 4.4 非機能要件

- `--list` パスは通常起動の重い初期化 (`.ut-tdd/` state 読み込み・DB open 等) を skip する軽量早期分岐を
  持つこと (補完レイテンシ = bun 起動 + tree walk のみに抑える)。

### 4.5 L7 降下時の unit oracle (設計宣言)

- catalog 抽出 oracle: extractor の返す command 一覧が commander 登録と一致 (drift 検出) し、
  §4.3 の必須 metadata が全 entry に存在する。
- `--list` subset oracle: 全候補が実在 command path / フラグのサブセット (U-FR-L1-48 同型)。
- `--list` 正例 oracle (**退化実装の排除**): 代表文脈に対する期待候補の包含を固定する。最低限、
  (a) 空文脈 → top-level コマンド群 (例: `status` / `doctor` / `plan`) を含む非空集合、
  (b) `plan` 階層 → `lint` を含む、(c) prefix `doc` → `doctor` を含み prefix 不一致候補を含まない、
  の 3 正例を assert する。空集合を常時返す実装は本 oracle で fail する。
- exit code oracle: §4.2 の終了コード規約 (carve-out 含む) を負系込みで検証。

## 5. 降下先

実装 (extractor + `ut-tdd completion` + oracle) は本 freeze 後に add-impl として後続起票し、
Reverse pairing を宣言する。`src/cli.ts` がホットファイル (Codex 並行ブランチ) のため、実装着手は
`work/l7-421` / `work/vmodel-engine-swap-wave3` 合流後とする。
