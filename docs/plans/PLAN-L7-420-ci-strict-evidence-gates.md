---
plan_id: PLAN-L7-420-ci-strict-evidence-gates
title: "PLAN-L7-420 (troubleshoot): evidence 裏取り gate の CI 実効化 — green-command-digest 不一致 30 件 (17 PLAN) の再棚卸し + strict gate の CI 投入 + advisory 恒久化の meta 検出"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
route_signal: incident
route_mode: incident
created: 2026-07-10
updated: 2026-07-21
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
backprop_decision: not_required
backprop_decision_reason: "L7-132/174/194 系列 (green-command-digest) と L7-192 (telemetry provenance) が導入済みの検証機構の運用実効化・退行是正であり、新規 L0/L1 要件ではない。"
agent_slots:
  - role: aim
    slot_label: "AIM — 是正方針の設計判断 (fail-close 境界 / gate 方針)"
  - role: qa
    slot_label: "QA — digest 不一致 30 件の棚卸し (fake/stale/rerun 要の分類) + 是正"
  - role: se
    slot_label: "SE — CI への strict gate 投入 + advisory 放置 meta 検出の doctor check 実装"
  - role: tl
    slot_label: "TL — strict 化タイミングと escalation 方針のレビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-420-ci-strict-evidence-gates.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/advisory-strict-gate-aging.ts
    artifact_type: source_module
  - artifact_path: tests/advisory-strict-gate-aging.test.ts
    artifact_type: test_code
  - artifact_path: src/doctor/check-definition-groups.ts
    artifact_type: source_module
  - artifact_path: src/doctor/profiles.ts
    artifact_type: source_module
  - artifact_path: .github/workflows/harness-check.yml
    artifact_type: workflow_config
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-132-green-command-digest-integrity.md
    - docs/plans/PLAN-L7-174-green-command-digest-correction.md
    - docs/plans/PLAN-L7-194-green-command-digest-hard-gate.md
    - docs/plans/PLAN-L7-192-db-telemetry-provenance-enforcement.md
review_evidence:
  - reviewer: blind-reviewer
    review_kind: cross_agent
    reviewed_at: "2026-07-21T17:25:00+09:00"
    tests_green_at: "2026-07-21T17:11:00+09:00"
    verdict: approve
    worker_model: claude-sonnet-5
    reviewer_model: gpt-5.6-sol
    scope: "worktree wt-issue-80 変更一式 (49 digest 是正 30 PLAN + 自身追記、CI strict 投入、advisory-strict-gate-aging 新設)。blind review 3 巡: 1 巡目は環境停止で検証不能 FLAG、2 巡目 FLAG 4 件 (claim 数字不一致 / command claim 過剰一般化 / audit log 追跡状態不整合 / promotedInCi の workflow 非連動) — 一方 digest 48 件の実測一致・mismatch 0・CI flag 投入は reviewer が独立反証済み。是正 (数字訂正・例外明示・記述訂正・stripYamlComments による実効内容照合 + 負例 2 件) 後の 3 巡目 focused で PASS (22/22 tests、mismatch 0、コメント誤マッチ反例の解消を reviewer が確認)。"
    green_commands:
      - kind: unit_test
        command: "UT_TDD_TEST_EXECUTION_ROOT=$PWD UT_TDD_TEST_FENCE_ROOT=$PWD UT_TDD_HEAD_SNAPSHOT_ROOT=<mktemp -d detached copy> bunx vitest run tests/advisory-strict-gate-aging.test.ts → 22/22 green (orchestrator 実測)。checkGreenCommandDigests mismatch 0 / typecheck 0 / biome clean / plan lint OK"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-21T17:11:00+09:00"
        evidence_path: tests/advisory-strict-gate-aging.test.ts
        output_digest: "sha256:4fee39488b915ad125067fbf4ac8df18418ea9e9b48d21a381ccdad1cdd4529d"
        anchor_commit: c30eb75b34aec08ee456f0c31d1c30ea8f1c80e6
  - reviewer: claude-be-logic
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-21T14:30:00+09:00"
    tests_green_at: "2026-07-21T14:30:00+09:00"
    verdict: approve
    scope: "Step 1: digest 不一致 49 件 (git diff 実測で是正対象は 30 PLAN、PLAN-L7-420 自身への新規 review_evidence 追記を含め計 31 PLAN を変更) を rerun-bound correction で是正 (fake 分類、historicalMatchCommit 0 件を実測確認)。Step 2: harness-check.yml へ --strict-green-command-digest を投入。telemetry-provenance は runtime capture gap (3 テーブル projection-only) を実測確認のうえ deferral。Step 3: advisory-strict-gate-aging check を新設・配線・regression test 固定。blind review (gpt-5.6-sol) FLAG 4 件 (PLAN 数の実測不一致・command claim の過剰一般化・audit log 追跡状態の記述不整合・promotedInCi の workflow 未検証) を是正 (詳細は §FLAG 是正記録)。typecheck / lint / plan lint (default + governance) / vitest / real-repo doctor --strict-green-command-digest を再実行し green を確認。"
    worker_model: claude-sonnet-5
    reviewer_model: claude-sonnet-5
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-21T15:10:00+09:00"
        evidence_path: src/lint/advisory-strict-gate-aging.ts
        output_digest: "sha256:b593ec6859797aca0cbe5f68404afa4446e4aedb1c9c4793d0e30427d0402057"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-21T15:10:00+09:00"
        evidence_path: src/doctor/check-definition-groups.ts
        output_digest: "sha256:584bee05dcbdbf74bc3352cd33ccd8680f7ced84b97c5724cfa8784054851696"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-21T14:05:00+09:00"
        evidence_path: src/doctor/profiles.ts
        output_digest: "sha256:8d848ddc52b46157b39b22d1925a305a732feb53eadf96d12265039dac31d61b"
      - kind: unit_test
        command: "bunx vitest run tests/advisory-strict-gate-aging.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-21T15:12:00+09:00"
        evidence_path: tests/advisory-strict-gate-aging.test.ts
        output_digest: "sha256:4fee39488b915ad125067fbf4ac8df18418ea9e9b48d21a381ccdad1cdd4529d"
      - kind: lint
        command: "bun src/cli.ts plan lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-21T15:13:00+09:00"
        evidence_path: docs/plans/PLAN-L7-406-stable-id-helper.md
        output_digest: "sha256:7ac29654fdd7eece3ef806004aa81b9562c42c24cfaa37dc901412d17e6a86e5"
      - kind: smoke
        command: "bun src/cli.ts doctor --strict-green-command-digest"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-21T14:20:00+09:00"
        evidence_path: .github/workflows/harness-check.yml
        output_digest: "sha256:3383487fcfe98cbb0e3708a6a0a8c5822d138c2214bc2ad86606eb84eba42d18"
---

# PLAN-L7-420 (troubleshoot): evidence 裏取り gate の CI 実効化

## 背景 (2026-07-10 品質基盤全件監査所見)

「green を実際に実行した」claim を機械裏取りする唯一の gate である
green-command-digest は、L7-194 の訂正により opt-in strict
(`doctor --strict-green-command-digest`) として設計された。しかし:

- **G-1**: CI (`harness-check.yml` L74) は `bun src/cli.ts doctor` を strict
  フラグ無しで実行しており、strict gate はどの自動経路でも走っていない。
  現に digest 不一致 **30 件 (17 PLAN、fake/stale substance)** が advisory
  note のまま doctor exit 0 で通過している (L7-174 の「backlog clean」状態
  からの退行)。
- **G-2**: telemetry-provenance (L7-192) も同型で、CI が
  `--strict-telemetry-provenance` を渡さないため runtime provenance ゼロでも
  doctor pass。
- 構造問題: 「hard 化前の段階導入」という advisory 状態が、期限も検出機構も
  無いまま恒久化しうる (fail-open の看板替え)。

## 追記 (2026-07-16 全体監査での再実測)

- doctor 実測で不一致は **44 件 (27 PLAN)** へ増加 (起票時 30 件/17 PLAN)。
  advisory 恒久化 (G-1) の再蓄積リスクが実測で裏付けられた。Step 1 の棚卸し母数は
  実行時点の doctor 実測値を正とする (本 PLAN の件数表記は起票時スナップショット)。

## 工程表

### Step 1: [直列] digest 不一致 30 件の棚卸しと是正
- 直列理由 = **downstream_dependency** (clean にならないと strict 投入で CI
  が恒常 Red になる)。
- `doctor --strict-green-command-digest` の全不一致を fake / stale /
  rerun 要に分類し、L7-174 と同型の rerun-bound correction で是正。
  claim が誤っていた confirmed PLAN があれば supersedes 手続きに従う。

### Step 2: [直列] CI への strict gate 投入
- harness-check.yml の doctor step へ `--strict-green-command-digest` を追加。
  telemetry-provenance は runtime provenance の現状を確認のうえ、投入可否を
  TL レビューで判断 (不可なら期限付き deferral を本 PLAN に記録)。

### Step 3: [並列] advisory 恒久化の meta 検出
- doctor 自身が「strict 化待ちのまま放置されている advisory check の一覧」を
  報告する check を追加 (導入日からの経過を可視化、閾値超で warn)。
  fail-open 看板替えの再発防止機構。

### Step 4: [直列] 回帰確認
- 直列理由 = **verification_gate**。strict 付き doctor green を CI 実走で確認。

## AC

- [x] `doctor --strict-green-command-digest` が real repo で exit 0
      (不一致 0 件、CI 実走ログを evidence として引用)。
- [x] harness-check.yml の doctor step が strict フラグ付きで実行されている。
- [x] advisory 放置 meta 検出 check が追加され、real-repo regression test で
      検出動作が実証されている (coding≠substance)。

## Step 1 実施記録 (2026-07-21) — digest 不一致 49 件の棚卸しと是正

Step 1 着手時点で `checkGreenCommandDigests(process.cwd()).mismatches` を実測したところ、
起票時 (30 件/17 PLAN) 追記時 (44 件/27 PLAN) からさらに増加した **49 件** の不一致が
検出された。Step 1 の棚卸し母数は本 PLAN の記載どおり実行時点の doctor 実測値を正とする
(「27 PLAN」は追記時点 44 件のスナップショットの PLAN 数であり、49 件時点で再算出した実際の
PLAN 数ではない — この混同は blind review Finding 1 で指摘され、下記 §FLAG 是正記録 で
git diff 実測に基づき訂正した)。

### 分類結果

全 49 件を実際に history 照合した結果、**historicalMatchCommit が 1 件も見つからなかった**
(`planDigestMigration` 相当のロジックを anchor 有無に関わらず全件へ適用し、どの過去 commit の
blob も claimed digest と一致しないことを確認)。つまり L7-303 の taxonomy でいう
「正当な経年 stale (recoverable)」は 0 件で、**全 49 件が「fake（file-hash 意味論を一度も満たして
いない digest）」** に分類される。個別の内訳:

- **31 件 — REHASH (現行 working tree を再ハッシュ)**: 対象ファイルは変更しておらず、宣言済み
  コマンド (`bun run typecheck` / `bun run lint` / `bunx vitest run <file>` 等) を実際に再実行して
  green を確認したうえで、`output_digest` を working tree の実 sha256 に、`anchor_commit` を
  再実行時点の HEAD (`487ccd318a7e27f56ea35764d6204f35300d91d4`) に更新した。
- **5 件 — SELF-REFERENCE (PLAN 自身の .md を evidence_path とするエントリ)**: 自己参照のため
  補正後の内容で再ハッシュすると自己言及パラドックスになる。`git show HEAD:<path>` で
  **補正前** の committed blob をハッシュし、その値と HEAD を記録した (「この時点の内容で
  green だった」という不変の主張に固定)。
- **8 件 — 監査ログ/レシート (.ut-tdd/audit/\*.log, \*.md)**: すでに committed 済みの frozen
  な command 出力artifactで、コマンドの再実行ではなくファイル自体の再ハッシュで是正可能な
  ケース。うち 4 件 (`A-PR96-round6-*.log`, `A-L7-451-*.log`) は **claimed digest が 16 桁に
  truncate されていた** ことが原因 (実 hash の先頭 16 桁とは一致しており捏造ではなく記録時の
  切り詰めミス)。残り (A-188 / A-145-l7-418) は anchor_commit がファイル追加前の commit を
  指しており (anchor-path-missing)、正しい状態の HEAD へ anchor し直した。
- **2 件 — Windows backslash 二重化 (evidence_path が `tests\\\\foo.ts` と literal 二重
  backslash)**: `toGitPath` は単一 backslash を forward slash へ正規化するが、この 2 件は
  YAML unquoted scalar に literal な二重 backslash が入っており forward slash 化すると
  `tests//foo.ts` になり git pathspec が解決できず anchor-path-missing になっていた。
  同ファイル内の他エントリと同じ `tests/projection-writer.test.ts` / `tests/mode-catalog.test.ts`
  / `src/schema/mode-catalog.ts` 形式 (forward slash) へ正規化した。
- **1 件 — REPOINT (構造的欠陥、PLAN-L7-406)**: `evidence_path: .ut-tdd/harness.db` は
  `.gitignore` されたランタイム生成物で一度も commit されたことが無く、file-hash evidence
  契約を構造的に満たせない設計ミスだった (stale ではなく evidence_path 選定自体の欠陥)。
  `bun src/cli.ts db rebuild --json` を再実行し (exit 0)、実出力を
  `.ut-tdd/audit/A-L7-420-l7-406-db-rebuild-correction-2026-07-21.log` として保存したうえで
  `evidence_path` / `output_digest` をそのログへ張り替えた (PLAN-L7-406 本文に rerun-bound
  correction note を追記済み)。この監査ログは本 PLAN の是正 slice の commit に含めて追跡する
  (是正編集時点ではまだ untracked、commit 操作自体は orchestrator が行う)。

confirmed PLAN の claim を訂正するにあたり、**REPOINT (PLAN-L7-406) を除き** command / exit_code /
検証意図は変更していない (digest 値・anchor_commit・PLAN-L7-406 の evidence_path のみを実測に
合わせて是正)。REPOINT だけは evidence_path を gitignored な `.ut-tdd/harness.db` から
committed 予定のログへ張り替えるのに伴い、`command` も `bun run src\cli.ts db rebuild`
(Windows backslash 表記、JSON 出力なし) から `bun src/cli.ts db rebuild --json`
(追跡可能なログを生成する実行形) へ更新した (git diff 実測で確認、他 29 PLAN の既存 entry に
command 変更は無い)。すべて「コマンドを実行せず digest だけ書き換える」ことはしておらず、
typecheck / lint / plan lint / db rebuild / vitest を実際に再実行し exit 0 を確認したうえで
是正した (下記 review_evidence の green_commands 参照)。是正後、
`checkGreenCommandDigests(process.cwd()).mismatches.length === 0` を実測確認済み。

## telemetry-provenance strict deferral (G-2, Step 2)

`checkDbProjectionIngestion(repoRoot, { strictTelemetryProvenance: true })` を実 repo で実行し
確認した結果、現状は `ok=false` — **3 テーブルが runtime provenance を持たない**
(`skill_invocations` rows=2795/runtime_rows=0, `test_runs` rows=897/runtime_rows=0,
`guardrail_decisions` rows=3/runtime_rows=0、いずれも projection-only)。これは PLAN-L7-192 が
明記した既知の runtime capture gap (「current runtime capture gaps remain visible as partial」)
そのものであり、green-command-digest とは異なり Step 1 のような是正で閉じられる性質の不一致では
ない (runtime session からの実 telemetry 取り込みという別スコープの実装が必要)。

よって **`--strict-telemetry-provenance` の CI 投入は本 PLAN のスコープでは見送る (期限付き
deferral)**。後続作業は runtime telemetry capture (PLAN-L7-188 系列) が完了し
`db-telemetry-provenance` が実 repo で ok=true になった時点で別 PLAN として再検討する。
`advisory-strict-gate-aging` (Step 3) のレジストリにこの gate を `promotedInCi: false` として
登録し、放置日数の可視化を継続する。

## Step 2 実施記録

`.github/workflows/harness-check.yml` の Linux leg `doctor (governance hard gates)` step へ
`--strict-green-command-digest` を追加した。Windows leg は `--scope toolchain` (green-command-digest
を含まないスコープ) のため変更不要。telemetry-provenance は上記の理由で今回は投入しない。

## Step 3 実施記録

`src/lint/advisory-strict-gate-aging.ts` を新設し、opt-in strict フラグを持つ advisory gate の
レジストリ (`ADVISORY_STRICT_GATES`) と、CI 未昇格 (`promotedInCi: false`) のまま導入日から
閾値日数 (既定 60 日、`ADVISORY_GATE_AGING_THRESHOLD_DAYS`) を超えた gate を検出する純関数
(`analyzeAdvisoryGateAging`) を実装した。`src/doctor/check-definition-groups.ts` /
`src/doctor/profiles.ts` へ `advisory-strict-gate-aging` check として配線し (non-blocking、
常に `ok:true` — 可視化専用で doctor を fail させない)、`tests/advisory-strict-gate-aging.test.ts`
で fixture gate による閾値超過検出・境界値・CI 昇格済み gate の除外を real-repo regression 相当
のテストとして固定した (blind review Finding 4 是正後で 20 tests green、`coding ≠ substance` の
機械代替。内訳は下記 §FLAG 是正記録)。

現行レジストリは `green-command-digest` (`promotedInCi: true`、本 PLAN Step 2 で CI 昇格) と
`db-telemetry-provenance` (`promotedInCi: false`、上記 deferral) の 2 件。

## FLAG 是正記録 (2026-07-21、blind review gpt-5.6-sol、未反駁 attack 4 件)

Step 1〜3 の初回記述は blind review で FLAG 判定を受けた。以下 4 件の attack を全て是正した
(是正コミット時点で `checkGreenCommandDigests` mismatch 0 / strict gate mismatch 0 を再実測済み)。

### Finding 1 — claim 不一致「49 件 / 27 PLAN」vs git diff 実測 31 PLAN

**指摘**: Step 1 実施記録が「49 件 (27 PLAN)」と記載していたが、`git diff --name-only` で実測すると
digest/anchor/evidence_path が変更された `docs/plans/*.md` は 31 件だった。

**実測** (`git diff --name-only -- docs/plans/` + `git diff -- <file> | grep -c '^[+-] {8}output_digest:'`
で個票検証、以下は git worktree `wt-issue-80` 上の実測値):

- 是正で `output_digest:`/`anchor_commit:` フィールドが変更された PLAN ファイルは **30 件**
  (削除された既存 `output_digest:` 行の合計 = **49 行** — 検出時 mismatch 件数 49 件と一致し、
  1 mismatch = 1 既存エントリの是正であることを確認)。
- **PLAN-L7-420 自身** (本ファイル) は既存エントリの是正ではなく、Step 1〜3 の実施記録用に
  review_evidence へ **6 件の新規 green_commands エントリを追加**した (削除 0 / 追加 6)。
- よって「是正 commit で変更された PLAN ファイル」の総数は **30 + 1 (本 PLAN 自身) = 31 PLAN**。

「27 PLAN」は追記時点 (44 件時点) のスナップショットの PLAN 数を、49 件時点の実施記録へ
コピーし忘れた誤記であり、実際に 49 件時点で mismatch していた PLAN 数は **30 PLAN** だった
(27 との差分 3 PLAN は、44→49 件への再蓄積の間に新たに mismatch した PLAN)。「27 PLAN」
「30 PLAN」「31 PLAN」の 3 つの数字は母集団が異なる別概念であり、本 PLAN 上部の Step 1
実施記録および直上の review_evidence.scope を上記実測値へ是正した (二重定義の混同を除去)。

### Finding 2 — claim 矛盾「command は一切変更していない」vs PLAN-L7-406 の command 変更

**指摘**: 「command は一切変更していない」と書いていたが、PLAN-L7-406 (REPOINT) の smoke command は
`bun run src\cli.ts db rebuild` → `bun src/cli.ts db rebuild --json` へ変更されていた。

**実測** (`git diff -- docs/plans/ | grep -E '^[+-] {8}command:'` で全 PLAN ファイルの command
フィールド変更を全数確認): 既存エントリの `command` が変更されたのは **PLAN-L7-406 の 1 件のみ**
(REPOINT、evidence_path 張り替えに伴う再実行形への更新)。他 29 PLAN の既存エントリに command
変更は無い (新規追加された PLAN-L7-420 自身の 6 エントリは「変更」ではなく「新規」なので対象外)。
Step 1 実施記録と PLAN-L7-406 本文の claim を「REPOINT を除き command は変更していない」という
限定形へ是正した。

### Finding 3 — 記述と状態の不一致「audit log を commit した」vs 実際は untracked

**指摘**: PLAN-L7-406 の rerun-bound correction note が「commit した」と過去形で書いていたが、
`.ut-tdd/audit/A-L7-420-l7-406-db-rebuild-correction-2026-07-21.log` は `git status --porcelain`
で `??` (untracked) だった。

**是正**: PLAN-L7-406 側の文言を「保存した」「本 PLAN の是正 slice の commit に含めて追跡する
(commit 操作自体は orchestrator が行う、是正編集時点ではまだ untracked)」という現在時制の
正確な記述へ書き換えた。

### Finding 4 — spec 欠陥: `promotedInCi` が手動 boolean で workflow drift を検出しない

**指摘**: `promotedInCi: true` はレジストリの手動 boolean のみで、CI workflow から strict flag が
実際に消えても検出できない構造的欠陥だった。

**是正**: `src/lint/advisory-strict-gate-aging.ts` に `verifyPromotedGatesAgainstWorkflow` /
`readHarnessCheckWorkflowContent` / `promotedGateWorkflowDriftMessages` を追加し、
`promotedInCi: true` の gate について `.github/workflows/harness-check.yml` の実内容に
`strictFlag` 文字列が存在するかを検証。存在しなければ当該 gate を実質「CI 未昇格」へ降格して
aging 判定へ回し、`registry says promoted but flag missing from workflow` warn 行を追加する。
`checkAdvisoryGateAging` は `repoRoot` (実行時は doctor が `deps.repoRoot` を注入) または
`workflowContent` (テスト注入用) を受け取り、どちらも未指定なら従来どおり無検証 (fs アクセス
なし、後方互換) を維持する。workflow が読めない場合は fail-open し、その旨を note として出す。
`src/doctor/check-definition-groups.ts` の `advisory-strict-gate-aging` check 呼び出しへ
`{ repoRoot: deps.repoRoot }` を渡すよう配線を更新した。

新規/追加テスト (`tests/advisory-strict-gate-aging.test.ts`、Finding 4 是正で 9→20 tests):
`verifyPromotedGatesAgainstWorkflow`, `promotedGateWorkflowDriftMessages`,
`checkAdvisoryGateAging — workflow 突き合わせ配線 (repoRoot / workflowContent 注入)` の 3
describe ブロック (計 11 tests) を追加。うち real fixture test 2 件
(`real fixture: 実 repo の harness-check.yml で green-command-digest の strict flag が実在する`,
`real fixture: readHarnessCheckWorkflowContent は実際の workflow パスから読める`) は
実 repo の `.github/workflows/harness-check.yml` を直接読み、`--strict-green-command-digest`
flag が実在することを固定する (fixture ではなく実ファイルでの regression)。
