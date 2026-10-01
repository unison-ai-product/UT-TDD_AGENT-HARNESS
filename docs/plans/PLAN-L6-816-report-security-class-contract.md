---
plan_id: PLAN-L6-816-report-security-class-contract
title: "PLAN-L6-816 (design): Pack 利用者からのトラブル報告の書き込みセキュリティ契約 (S1)"
kind: design
layer: L6
drive: agent
route_signal: forward
route_mode: forward
created: 2026-10-01
updated: 2026-10-01
owner: PO / Claude (author) · Codex gpt-6.1-sol (非著者 closing review) ·
  security-audit (非著者 必須)
parent_design: docs/design/harness/L6-function-design/secret.md
pair_artifact: docs/test-design/harness/L7-report-write-security-test-design.md
next_pair_freeze: L7
backprop_decision: not_required
backprop_decision_reason: 本 PLAN は design 契約の新設のみで、実装は後続の add-impl PLAN が
  Reverse 対を持つ。本 PLAN 自体は production source を変更しない。
agent_slots:
  - role: se
    slot_label: Claude (author) - S1 契約の設計文書化。実装は Codex 側 worker が後続 PR で行う
  - role: qa
    slot_label: security-audit - 非著者の必須 review。redaction 順序、fail-close、無出力、leak
      oracle を判定する
  - role: tl
    slot_label: Codex gpt-6.1-sol - exact HEAD の非著者 closing review
generates:
  - artifact_path: docs/plans/PLAN-L6-816-report-security-class-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/design/harness/L6-function-design/secret.md
  requires:
    - docs/plans/PLAN-L6-62-design-doc-secret-scan-gate.md
  blocks: []
  references:
    - docs/plans/PLAN-L7-260-sensitive-scan-boundary.md
    - docs/test-design/harness/L7-report-write-security-test-design.md
    - src/lint/secret-scan.ts
    - src/secret.ts
    - src/cli/distribution.ts
    - scripts/git-hooks/secret-scan-diff.ts
    - src/setup/templates.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/815
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/809
review_evidence: []
sub_doc: class-design
admission_receipt:
  schema_version: v2
  receipt_id: certificate:fab8627bb3f8bdca94a954318bff8355
  command_id: plan-draft:issue-815:report-write-security:5
  admitted_at: 2026-10-01T11:38:28.838Z
  source_digest: sha256:5f711577f71d0bfb3e34033c3538b31961476d1950cac267541eb6215a2e8d4b
  decision_digest: sha256:d608a20c7acbea9656aa8d79ed9615c479613d5dddf51d4d3f99caed7a14ef4d
  receipt_digest: sha256:bd0e776f6e7f76b2dfa2f7e9857c7b038958c96ad08fd1adad85227ba2f77f06
  binding:
    path: docs/plans/PLAN-L6-816-report-security-class-contract.md
    plan_id: PLAN-L6-816-report-security-class-contract
    asset_id: plan:fab8627bb3f8bdca94a954318bff8355
    revision: 1
    content_digest: sha256:5f711577f71d0bfb3e34033c3538b31961476d1950cac267541eb6215a2e8d4b
  route:
    signal: forward
    mode: forward
---

# PLAN-L6-816 (design): トラブル報告の書き込みセキュリティ契約 (S1)

## 1. 目的

社内で Pack を使う利用者がハーネスのトラブルを報告するとき、**報告の束を出力する前に**、
機密と社内情報が公開面へ漏れないことを保証する契約を凍結する。Issue #815 の slice S1 だけを扱う。
PO 判断 (2026-10-01): 書き込みセキュリティを先に通し、報告の仕組み本体は後続 slice で作る。

本 PLAN は design 契約のみで docs 変更に限る。production source と test code は追加しない。

## 2. 実測した背景 (main 6b5effbc)

| 事実 | 根拠 (再現コマンド) |
|---|---|
| 既存 scanner `analyzeSecretScan` は `SECRET_SCAN_PATTERNS` 6 種を行単位で検査し、`ALLOW_LINE_MARKERS` (dummy / placeholder / redacted / example / fake / fixture / test-only 等) を含む行を**無条件で免除**する。利用者の自由文が `example` と書くだけで token が素通りする | `grep -n ALLOW_LINE_MARKERS src/lint/secret-scan.ts` |
| `analyzeSecretScan` は option を取らず、免除を切る手段がない。報告用途では引数追加 (既定は現挙動) が必要 | `src/lint/secret-scan.ts:51` |
| 1 pattern につき最初の 1 行しか報告しない (`firstMatchLine`)。違反の全件列挙ではない | `grep -n firstMatchLine src/lint/secret-scan.ts` |
| PII (電話・郵便番号・email・internal URL) の検査は scanner の外、`scripts/git-hooks/secret-scan-diff.ts` の `PII_SCAN_PATTERNS` に局在する。`src/` からは再利用できない | `grep -n PII_SCAN_PATTERNS scripts/git-hooks/secret-scan-diff.ts` |
| `runDistributionSecretScan` は distribution の copy / prune / tar の**前**に走り、違反があれば止める。出力前 gate の先例である | `grep -n runDistributionSecretScan src/cli/distribution.ts` (定義 1 + 呼出し 3) |
| 認証 env を `/AUTH\|TOKEN\|SECRET\|CREDENTIAL\|API_KEY/i` で探す方式は `GH_*` / `GITHUB_*` を拾えない (#809 指摘 3) | `gh issue view 809` |
| 報告先候補の Pack repo と source repo はどちらも PUBLIC。setup が置く issue template は consumer 自身の repo 向けで、ハーネスへの報告経路ではない | Issue #815 本文 (`src/setup/templates.ts:753-761`) |

重複確認: `PLAN-L7-260-sensitive-scan-boundary` は「リポジトリ内 artifact の credential 検査」の正本であり、
本 PLAN は **実行時に利用者の入力・診断から作る束の出力前 gate** を扱う。対象面が異なるため新規 PLAN とし、
scanner 本体は L7-260 の成果を再利用する (複製しない)。

## 3. 設計判断

### 3.1 処理順序と fail-close (採択 A)

束はメモリ内だけで組み立て、次の順で処理する。**どの段でも違反・検査失敗・例外があれば出力を一切行わない**
(ファイル・stdout・stderr・ログ・一時ファイル・例外メッセージのいずれにも、入力全文と検出値を出さない)。

1. 入力検査: 生の入力に対し secret scan と PII scan を実行する (伏せ字化の前に検査し、隠して見逃す事態を防ぐ)。
2. path redaction: ホームディレクトリ・社内絶対パスを固定 placeholder へ置換する。
3. env 処理: key allowlist に載る key だけを残し、値にも scan を適用する。
4. **最終 leak 検査**: 変換後の全文に対し独立にもう一度 secret / PII / path / 内部 host の検査を行う。
5. 利用者確認 (§3.3) を経て初めて出力する。

| 案 | 採否 | 理由 |
|---|---|---|
| A: scan → redact → allowlist → 最終検査、違反は無出力 | **採択** | 多段で漏れを塞ぎ、失敗時の公開面への書き込みが 0 |
| B: 伏せ字化後に scan するだけ | 却下 | 伏せ字化が壊した token を scan が見逃す。原本の検査が消える |
| C: 違反箇所を伏せて継続出力 | 却下 | 検出漏れを公開へ持ち込む。fail-close に反する |

### 3.2 redaction 規則の置き場所 (SSoT) と scanner の再利用 (採択 A)

- credential の検出規則は `src/lint/secret-scan.ts` を唯一の正本とし、規則を複製しない。
- 報告用に **免除なしモード** を追加する (`analyzeSecretScan` へ option を足す。既定は現挙動のまま)。
  `ALLOW_LINE_MARKERS` を報告経路で無効にする。利用者入力の語で検査を免除させない。
- PII の正規表現は `scripts/git-hooks/secret-scan-diff.ts` から `src/lint/` 配下の共有モジュールへ**移して**
  pre-push と報告の両方が import する (複製ではなく移設。pre-push の挙動は変えない)。
- 報告固有の変換 (path redaction、env allowlist、確認表示) は新規 `src/report/` に置く。
- 違反の報告形式は marker と件数だけにして、検出値と周辺文字列を含めない。

| 案 | 採否 | 理由 |
|---|---|---|
| A: scanner を option 拡張 + PII 規則を共有化 + `src/report/` に変換 | **採択** | 規則の SSoT を保てる。変更は 2 箇所 (option と移設) に閉じる |
| B: `src/report/` に規則を丸ごと複製 | 却下 | drift 源 (CLAUDE.md の Rule Placement の趣旨と同じ) |
| C: 免除のまま利用 | 却下 | 実測した bypass (§2) を放置する |

### 3.3 利用者確認 (採択 A)

- 変換・最終検査を通った**全文**をそのまま表示し、明示的な `yes` の入力を必須にする。
- 表示した内容と出力する内容は同一の byte 列とする (表示後に再生成しない)。
- 非対話実行 (TTY なし、確認入力なし) は fail-close。`--yes` のような確認の迂回 option は設けない。
- 自動送信はしない。送信や保存の経路は S3 で別途 freeze する。

| 案 | 採否 | 理由 |
|---|---|---|
| A: 全文表示 + 明示 yes、非対話は fail-close | **採択** | 公開面への最後の人間確認を維持する |
| B: `--yes` で CI 向けに自動化 | 却下 | 確認の迂回経路となり、S1 の目的を損なう。自動化の需要は S3 で別途判断する |
| C: 差分だけ表示 | 却下 | 利用者が全文を見られず、確認が形骸化する |

### 3.4 env の扱い (採択 A)

- **許可 key の allowlist** 方式にする。「報告に含めてよい key」だけを列挙し、未知の key は除外する。
- 初期の allowlist は診断に必要な最小集合 (OS / Node の版を示す key 等) とし、確定は実装 PR の設計判断節で行う。
- 許可 key の値にも secret / path 検査を適用する。
- 名前の regex (認証らしい語の一致) による除外判定は用いない (#809 の教訓)。
  `GH_*` と `GITHUB_*` の key は除外されることを回帰 oracle に含める。

### 3.5 path / URL / project 名

- redaction 対象: Windows 形式 (ユーザー home 配下、区切りが `\` / `/` / 混在、drive letter の大小、UNC)
  と Linux / macOS 形式 (`/home/<user>`、`/Users/<user>`、`~`)、および環境上の実 home・cwd・project root の文字列。
- 内部 URL: host 名、IP、userinfo、query 内の秘密を定義した判定で伏せる。判定基準は実装 PR の設計判断節で確定し、
  scanner の PII 規則と同じ共有モジュールに置く。
- consumer の project 名・remote URL は既定で伏せ字にする。

### 3.6 review (採択)

非著者の **security-audit review を必須**とする。判定項目は、無出力の担保、免除の無効化、表示と出力の同一性、
leak oracle の網羅 (§5) である。cross review は Claude 著の本 PLAN を Codex gpt-6.1-sol が行う。

### 3.7 advisor 記録

`ut-tdd advisor --decision implementation` (gpt-6.1-sol、2026-10-01) の回答を実測で照合した。

- 採用した助言: 無出力の範囲を全出力経路へ拡張 / 免除無効化を AC に昇格 / 表示と出力の同一 / env を allowlist に限定し
  許可 key の値も検査 / 内部 URL の判定基準の明確化 / 最終 leak 検査の追加。
- 実測で確かめた前提: 免除と option 不在は `src/lint/secret-scan.ts` で事実。PII 規則の局在は
  `scripts/git-hooks/secret-scan-diff.ts` で事実。advisor が「不足」とした現行 scanner の免除挙動は §2 で実測済み。
- 追加した実測 (advisor 未指摘): `firstMatchLine` が 1 pattern 1 行しか報告しない点。

## 4. 受入条件 (反証可能)

各項目の oracle は pair test-design の `CANDIDATE-*` で定義する。正規 ID 昇格と実装は後続 PR。

1. 違反が 1 件でもあれば、出力経路 (file / stdout / stderr / log / temp / 例外文言) への書き込みが 0 であり、検出値が現れない。
2. 免除語 (dummy / example / fake 等) を含む行でも、報告経路では credential が検出される。既存の repo scan の挙動は不変。
3. 許可外 env key (`GH_*` / `GITHUB_*` を含む) の値が出力に現れない。許可 key でも値に secret があれば fail-close。
4. Windows 形式と Linux 形式の path の全変種が出力に現れない。
5. 内部 URL・IP・userinfo・project 名・remote URL が既定で出力に現れない。
6. 表示した全文と出力が byte 一致する。確認なし・非対話では出力 0。確認迂回 option が存在しない。
7. 最終 leak 検査が、前段の変換の取りこぼしを単独で検出する (前段を無効化した mutation で Red になる)。
8. PII 規則を共有化しても pre-push hook の既存テストが Green のまま。

## 5. oracle 候補 (leak oracle)

- token は実在形式に合わせるが、**runtime 連結で生成**し、リポジトリ内に素書きしない (L7-260 の self-trigger 回避書式を踏襲)。
  fixture に免除語を入れない行と入れる行の両方を用意する。
- 形式: GitHub token 系、`sk-` 系、AWS key、private key block、Bearer、`secret=` 代入、`GH_*` / `GITHUB_*` の env 値。
- path の matrix: 区切り (`\` / `/` / 混在)、drive letter 大小、UNC、`/home` / `/Users` / `~`、実 cwd。
- 変異: 各段 (入力検査 / path / env / 最終検査) を 1 つずつ外して該当 oracle が Red になることを確認する。
  どの出現を除去した mutant かを記録する (重複した出現が mutant を吸収しないこと)。
- 詳細は pair artifact `docs/test-design/harness/L7-report-write-security-test-design.md`。

## 6. PR 分割 (1 PR = 1 論点)

| PR | 内容 | 前提 |
|---|---|---|
| PR-0 (本 PR) | 本 PLAN + pair test-design (docs のみ) | なし |
| PR-1 | PII 規則の共有モジュール化 (移設) + pre-push の回帰 Green | PR-0 の contract freeze |
| PR-2 | `analyzeSecretScan` の免除無効 option + `src/report/` の redaction (path / env allowlist) と最終検査 | PR-1 |
| PR-3 | 確認表示と非対話 fail-close、無出力の oracle | PR-2 |
| PR-4 | security-audit 非著者 review の記録と PLAN confirm | PR-3 |

CLI surface (`ut-tdd report`) は含めない。

## 7. 順序

実装着手は **v0.2.0-canary.3 の公開と受入 (#676 / #418) の後**。本線には混ぜない。PR-0 (契約 freeze と review) は
受入作業と並行して進めてよい。docs のみで canary の検証対象を変えない。

## 8. スコープ外 (後続 slice)

- S2: 受付先の決定 (公開 repo に直接書かせない。private な受付先の選択)。PO の承認事項。
- S3: `ut-tdd report` コマンド、診断の束の内容、issue フォーム。
- S4: 受付先から source repo の issue へ起こし直す triage 手順。

## 9. PO への未決事項

- S2 の受付先 (新規 private repo か既存の社内 repo か)。本 PLAN は決めない。
- 高影響境界 (PII / secret) に関わるため、S1 の実装着手前に本契約の PO 承認を得る。

## 10. 利用不能 reviewer の記録

Claude Opus は週次上限により 2026-10-04 16:00 JST まで利用できない。本 PLAN の著者は Claude Sonnet 5.5 で、
非著者 review は Codex gpt-6.1-sol を用いる。Opus 上限解除後も本 PLAN の判断ゲートは Codex 側で完結する。
