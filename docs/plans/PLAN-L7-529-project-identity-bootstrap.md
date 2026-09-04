---
plan_id: PLAN-L7-529-project-identity-bootstrap
title: "PLAN-L7-529 (add-impl): setup で tracked project identity を bootstrap する"
kind: add-impl
layer: L7
drive: fullstack
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-09-04
updated: 2026-09-04
owner: PO / TL
github_issue_id: 432
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
pair_artifact: docs/test-design/harness/L7-project-identity-bootstrap-test-design.md
backprop_decision: required
backprop_decision_reason: "read/create/commit-policy の fail-close 境界と namespace 分離を Forward/Reverse で同じ candidate に固定する。"
agent_slots:
  - role: se
    slot_label: "SE - tracked project identity の read/create 決定性契約を実装する"
  - role: qa
    slot_label: "QA - HEAD drift、junction/symlink/8.3/CRLF/BOM、stale identity 差し替えを独立変異で検証する"
generates:
  - artifact_path: docs/plans/PLAN-L7-529-project-identity-bootstrap.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-project-identity-bootstrap-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
  requires: []
  blocks: []
  references:
    - src/plan-asset/adapters/project-identity-loader.ts
    - src/plan-admission/node-plan-revision-runner.ts
    - src/plan-asset/adapters/legacy-plan-inventory.ts
    - src/runtime/project-memory-root.ts
    - src/runtime/repo-root.ts
    - docs/plans/PLAN-L7-512-project-scoped-memory-root.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/432
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/424
review_evidence: []
---

# PLAN-L7-529: setup で tracked project identity を bootstrap する

## 1. Outcome

`ut-tdd.project.json` (schema `ut-tdd.project/v1`) は、tracked な project identity の唯一の正本である。
本 PLAN は次の決定性契約だけを freeze する:

- **read**: 既存 tracked identity は常に HEAD の Git blob から厳密に読む。working tree の変更・
  HEAD drift・改変は fail-close (typed deny) であり、黙って受理しない。
- **create**: identity が HEAD に存在しない clean consumer で、`setup` が決定的な入力
  (git `origin` remote から導出した `owner/repo` 文字列) だけから canonical JSON を書く。
  同じ入力なら byte-identical。既存 identity がある repo での再実行は no-op read であり、
  書き換えない。
- **commit**: `setup` は作成した working tree ファイルを **暗黙に commit しない**。identity は
  HEAD に乗って初めて authoritative になる (§3.3)。
- **namespace**: 異なる origin を持つ project は disjoint な identity を持ち、repository の移動や
  linked worktree の追加で値は変わらない (絶対path・hostname・worktree pathを埋め込まない)。

対象外 (Issue #432 の非Scope、および本 pair-freeze のスコープ外): consumer runtime placement
(#420/#463)、Node generation producer (#485/#515)、Pack publication、global memory 本文、
remote mutation、semantic ranking。

## 2. 起点の実測 (再現コマンド付き、基準 ref = `7b18ee4e`)

### 2.1 `setup` は `ut-tdd.project.json` を一度も生成しない

```bash
git grep -n "ut-tdd.project.json" -- src/setup/ 7b18ee4e
# (該当なし: 0 件)
ls src/setup
#   authoring-template-inventory.ts branch-protection.ts consumer-local-runtime-admission.ts
#   distribution.ts index.ts pack-authoring-smoke.ts pack-publication-adapter.ts
#   pack-publication-assets.ts pack-publication-staging.ts release-aggregate-admission.ts
#   release-artifact-resolver.ts release-channel-adapter.ts release-materializer.ts
#   release-promotion-rollback-gate.ts templates.ts update-check.ts
```

`src/setup/` には project identity を書き出す module が存在しない。clean consumer は
事前 seed なしに `loadProjectIdentityFromHead` を満たせない。

### 2.2 read は HEAD の Git blob から厳密に再取得する (working tree は入力にならない)

`src/plan-asset/adapters/project-identity-loader.ts:61-91` (`loadProjectIdentityFromHead`) は
`git ls-tree HEAD -- ut-tdd.project.json` の mode/blob を正規表現で検証し
(`^100644 blob ([a-f0-9]{40|64})\t...$`、L72-75)、一致した blob だけを
`git show HEAD:ut-tdd.project.json` (L76) で取得する。`validReceipt` (L118-126) は
`blobOid`/`contentDigest` を bytes から再計算し、宣言値と一致しない receipt を拒否する。
working tree の同名ファイルはこの経路のどこにも読まれない。

```bash
git show HEAD:ut-tdd.project.json
#   {
#     "schema_version": "ut-tdd.project/v1",
#     "repository_identity": "unison-ai-product/UT-TDD_AGENT-HARNESS"
#   }
git ls-tree HEAD -- ut-tdd.project.json
#   100644 blob b978291662c86e8aa6e29531743d1838a4d98d36	ut-tdd.project.json
```

このリポジトリ自身は既に tracked identity を持つ。本 PLAN が対象とするのは、これを**持たない
clean consumer** での bootstrap である。

### 2.3 identity grammar は `owner/repo` 形式に限定される

`validIdentity` (`src/plan-asset/adapters/project-identity-loader.ts:128-135`) は
`/^[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,38})\/[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,99})$/` かつ
NFC 正規化・trim済み・`.git` 非終端を要求する。絶対path、hostname、worktree pathの文法は
この regex を満たさない (`/` は1個だけ許容され、Windows path 区切り `\` や drive letter は
一致しない)。**identity は構造的に path を埋め込めない。**

### 2.4 identity は複数の呼び出し元から共有される信頼根である

```bash
grep -rln "project-identity-loader" src
#   src/doctor/test-repository-isolation.ts
#   src/plan-admission/node-plan-revision-runner.ts
#   src/plan-asset/adapters/legacy-plan-inventory.ts
```

`node-plan-revision-runner.ts:381-385` は `repositoryIdentity()` port として
`loadProjectIdentityFromHead` を呼び、`legacy-plan-inventory.ts:40-41` は
`buildLegacyPlanInventory` の入口で同じ関数を呼ぶ。**identity の bootstrap を誤ると、
plan revision 台帳と legacy inventory の両方が connectionできなくなる。**

### 2.5 project-scoped memory root は独立実装で同じ marker を読む (PLAN-L7-512 が既に freeze 済み)

`src/runtime/project-memory-root.ts:168-195` (`projectIdentityFromHead`) は
`project-identity-loader.ts` と**別実装**で同じ `HEAD:ut-tdd.project.json` を読み、同じ
grammar (`validRepositoryIdentity`, L201-208) を検証する。`resolveProjectMemoryRootWithPorts`
(L72-128) は `currentProjectId !== canonicalProjectId` を `project_identity_drift` として
deny し (L100-102)、namespace は `sha256("ut-tdd-project\0" + projectId)` (L42-44) で
project ごとに disjoint になる。本 PLAN はこの既存契約 (PLAN-L7-512、confirmed) を変更せず、
その入力である identity の create/read/commit 境界だけを追加で freeze する。

### 2.6 `resolveRuntimeRepoRoot` は identity marker の有無を repo root 判定に使う

`src/runtime/repo-root.ts:38-45` (`isRepoRoot`) は `ut-tdd.project.json` の存在または
`.git`/`package.json`/`AGENTS.md`/`CLAUDE.md`/`.claude/CLAUDE.md` の全存在のどちらかで
repo root を判定する。identity ファイルは**存在するかどうか**だけがこの判定に効き、
中身の path 依存性は無い。

## 3. 設計判断

### 3.1 read: HEAD-strict、working tree drift は fail-close

`loadProjectIdentityFromHead` は既存実装のまま凍結する。working tree の同名ファイルの
存在・内容・変更は read 判定の入力にしない。HEAD の tracked entry が無い・mode不一致・
blob不一致・grammar不一致・(渡された場合) `expectedRepositoryIdentity` 不一致は、いずれも
typed deny (`plan-repository-identity-missing` / `plan-project-config-invalid` /
`plan-repository-identity-invalid` / `plan-repository-identity-provenance-invalid`) とし、
どれか一つでも working tree の値やユーザー宣言へのフォールバックを許さない。

### 3.2 create: 決定的入力・所有者・再実行規則

HEAD に tracked identity が無い場合、`setup` だけが以下の契約で `ut-tdd.project.json` を
working tree に書く:

- **入力**: `git remote get-url origin` を正規化した `owner/repo` 文字列のみ。
  `origin` remote が無い、`git@host:owner/repo.git` / `https://host/owner/repo.git` 等の
  既知形式に一致しない、正規化結果が `validIdentity` の grammar (§2.3) を満たさない場合は
  **作成せず typed deny** する (directory 名、hostname、絶対path、UUID 生成へのフォールバックを
  許さない)。
- **決定性**: 同じ `origin` remote に対する複数回の実行は byte-identical な出力を生成する。
  canonical serialization は field 順 `schema_version` → `repository_identity`、UTF-8 (BOM無し)、
  LF 改行、2-space indent、末尾改行 1 個で固定する。
- **所有者**: identity の作成は `setup` コマンドの専用経路に限る。`doctor` / `plan lint` /
  `node-plan-revision-runner` / `legacy-plan-inventory` など read 専用の呼び出し元は、
  identity が無ければ create を試みず deny をそのまま返す (read/create の権限分離)。
- **再実行**: HEAD に既に tracked identity がある repo で `setup` を再実行しても no-op read
  であり、書き換え・再生成をしない。working tree に未commitの生成物が既にある状態で再実行しても
  同じ入力からは同じ bytes を再生成するだけで、内容を変えない (既存の未commitファイルを
  上書きしても差分が出ない、が新規に別contentへ書き換えることはしない)。

### 3.3 commit policy (設計判断エリシテーション形式)

**前提**: `setup` が identity を新規作成した直後、working tree にはコミットされていない
`ut-tdd.project.json` が存在する。`loadProjectIdentityFromHead` は HEAD の blob しか読まない
ため、commit するまで生成した identity は read 経路から見えない。setup がこの単発の commit を
自動実行するか、明示 commit を要求するかを固定する必要がある。

| 案 | 内容 | 得るもの | 失うもの |
|---|---|---|---|
| A | `setup` が生成直後に自動 `git commit` する | 1 コマンドで read 可能な状態まで到達する | `setup` が Git 履歴を暗黙に変更する副作用を持つ。CI dry-run や read-only 検証コンテキストで意図しない commit が発生しうる。ADR/PO 既存原則 (§Git Rules「明示 commit」) と衝突する |
| B (推奨) | `setup` はファイルを書いて report するだけに留め、commit は human/runtime の明示操作に委ねる | `setup` は non-mutating (Git 履歴を変えない) のまま保たれる。既存の hybrid commit 協調規律 (CLAUDE.md §Hybrid 多ランタイム commit 協調) と同じく「commit は明示操作」という既存原則に合流する。identity が authoritative になるタイミング (HEAD到達) が commit という 1 箇所に集約され、read 側の HEAD-strict 契約 (§3.1) と整合する | 2 手順 (setup → commit) が必要。commit を忘れると read が deny のまま (ただし fail-close は本 PLAN の目的そのものであり、暗黙受理より安全) |
| C | `setup` は commit まで含めた 1 トランザクションを提供するが `--no-commit` フラグで A/B を選択可能にする | 呼び出し側が用途に応じて選べる | 実装・契約・test 面が増える (1 PLAN = 1 論点の PR スコープ規律に反する)。デフォルト挙動の決定を先送りするだけで、本 pair-freeze が固定すべき契約を残す |

**採択: B**。理由は 1 行: `setup` を non-mutating (Git 履歴に対して) に保つことは
`CLAUDE.md` の Git Rules と Hybrid 多ランタイム commit 協調が要求する「commit は明示操作」
という既存契約から一意に導け、read 側の HEAD-strict 決定 (§3.1、identity は HEAD に乗って
初めて authoritative) と対称になるため。C の柔軟性はこの pair-freeze のスコープ外
(1 PLAN = 1 論点) であり、実装が必要になった時点で別 PLAN として起票する。

この決定は trade-off の残る design 判断であり、advisor 相談は不要な既存契約からの一意な帰結
(反射的エスカレーション禁止の対象外) — Git Rules と Hybrid commit 協調が「commit は明示操作」
であることを既に確定させており、本節はその適用に過ぎない。

### 3.4 owner/repository identity binding と namespace 分離

`repository_identity` の値は `origin` remote から導出した `owner/repo` 文字列のみであり、
絶対path・hostname・worktree path・UUID を含まない (§2.3、§3.2)。したがって:

- 異なる `origin` を持つ project は異なる `repository_identity` を持ち、
  `project-memory-root.ts` の `projectNamespace` (sha256 digest) は disjoint になる
  (既存契約、PLAN-L7-512)。
- repository directory の rename/move は `origin` remote 文字列を変えないため
  `repository_identity` は不変。
- linked worktree ("`git worktree add`") はメイン worktree と同じ `HEAD` blob (共有
  `.git` 経由) を指すため、同じ `repository_identity` を返す。`project-memory-root.ts` の
  `currentProjectId !== canonicalProjectId` drift チェックはこの一致を既に検証している
  (§2.5)。

### 3.5 負系 (Linux/Windows)

以下はいずれも fail-close の対象であり、既存 loader の入力経路 (Git object 経由の read、
grammar 検証) から導かれる。実装 slice でこれらを独立変異として固定する:

- **symlink/junction escape**: tracked entry の Git mode が `100644` (regular blob) でない
  場合 (`120000` symlink 等) は `loadProjectIdentityFromHead` の正規表現 (§2.2) が一致せず
  `plan-repository-identity-missing` で deny する。repo root 自体が junction/reparse point の
  場合は `project-memory-root.ts` の `realpath` 経由の解決 (既存契約) に委ね、本 PLAN は
  read/create の入力を Git object 経由に固定することで escape 経路を作らない。
- **8.3 short-name escape**: `repoRoot` を Git コマンドに渡す前に長い正規path
  (real path) へ解決してから使う。short-name 表記 (`C:\PROGRA~1\...`) と正規表記が
  同じ repo を指す場合、両者から得る `repository_identity` は同一でなければならない。
- **case-only path difference**: 大小文字違いの path 表記が同一 repo (同じ inode/volume) を
  指す場合、identity 生成・解決の結果は同一でなければならない (二重 identity を作らない)。
- **CRLF/BOM mutation**: BOM 付与は `TextDecoder("utf-8", { fatal: true })` の decode 結果に
  `U+FEFF` を残し、JSON 先頭文字が `{` でなくなるため `JSON.parse` が失敗し
  `plan-project-config-invalid` で deny する (既存 `decodeConfig` 実装、
  `project-identity-loader.ts:93-116`)。CRLF 化は `contentDigest`/`blobOid` を変えるため
  `validReceipt` の再計算比較で検出可能である。**create 契約 (§3.2) は LF のみを生成し、
  CRLF/BOM を書き出さない。**
- **stale identity copied from another repository**: 別 repo からコピーされた
  syntactically-valid な `ut-tdd.project.json` は grammar 検証を通過しうるため、
  `loadProjectIdentityFromHead` の呼び出し側は **可能な限り
  `expectedRepositoryIdentity` (自リポジトリの `origin` から独立に導出した値) を渡し、
  不一致を `plan-repository-identity-missing` として deny する**。`expectedRepositoryIdentity`
  を渡さない呼び出しでは stale identity を防げないため、`setup` の bootstrap 経路は
  「create する前に必ず `origin` から期待値を導出し、既存ファイルがあればそれと比較する」
  ことを contract に含める (create-before-check ではなく check-before-create)。

## 4. Fail-close contract

| 境界 | 正常条件 | 変異時の oracle |
|---|---|---|
| read (HEAD-strict) | HEAD の tracked blob が mode/grammar/expected identity 全て一致 | working tree改変、HEAD drift、mode不一致、grammar不一致、expected不一致は typed deny |
| create 入力 | `origin` remote が既知形式で `owner/repo` grammar に正規化できる | remote無し・未知形式・grammar不一致は作成せず deny (fallback無し) |
| create 決定性 | 同一 origin から同一 canonical bytes | field順/改行/BOM/末尾改行の変異は非決定と見なし Red |
| create 所有者 | `setup` 専用経路のみが create を試みる | read専用呼び出し元 (doctor/plan-admission/legacy-inventory) が create を試みたら Red |
| rerun | 既存 identity がある repo で `setup` は no-op read | 既存ファイルを書き換えたら Red |
| commit policy | `setup` は working tree に書くのみ、commit しない (§3.3 B) | `setup` が `git commit` を実行したら Red |
| namespace | 異なる origin は disjoint identity/namespace、repo移動・worktree追加で不変 | 同一 origin で異なる identity、または移動/worktreeで値が変わったら Red |
| path非埋め込み | identity 文字列に絶対path/hostname/worktree pathを含まない | 埋め込みが検出されたら Red |
| 負系 | junction/symlink/8.3/大小文字/CRLF/BOM/stale copy はいずれも deny または既存正規化で吸収 | いずれかが silent accept になったら Red |

## 5. Implementation slices (将来の実装 PR)

1. `origin` remote 正規化 (`git@`/`https://` 形式 → `owner/repo`) と grammar 検証。
2. `setup` 専用の create 経路 (canonical serialization、所有者制限、rerun no-op)。
3. `expectedRepositoryIdentity` を bootstrap 経路の check-before-create に接続 (stale copy 検出)。
4. `repoRoot` の real path 解決を Git コマンド呼び出し前に固定 (8.3/大小文字/junction 対策)。
5. `CANDIDATE-U-PROJID-001..030` と `CANDIDATE-P-PROJID-001..003` を同じ oracle で検証する。

consumer runtime placement、Node generation producer、Pack publication、global memory 本文、
remote mutation、semantic ranking は本 plan の実装 slice に含めない。

## 6. Scope boundary

本 pair-freeze は read/create/commit-policy の決定性契約と candidate/oracle の整合だけを
確定する。実装 Green、Reverse R4、Issue #432 完了、#424 provider parity E2E の接続を意味しない。

## 6.1 Candidate ID inventory

Forward/Reverse/test-design が共有する全 U oracle は次のとおりである:

CANDIDATE-U-PROJID-001 CANDIDATE-U-PROJID-002 CANDIDATE-U-PROJID-003 CANDIDATE-U-PROJID-004 CANDIDATE-U-PROJID-005 CANDIDATE-U-PROJID-006 CANDIDATE-U-PROJID-007 CANDIDATE-U-PROJID-008 CANDIDATE-U-PROJID-009 CANDIDATE-U-PROJID-010 CANDIDATE-U-PROJID-011 CANDIDATE-U-PROJID-012 CANDIDATE-U-PROJID-013 CANDIDATE-U-PROJID-014 CANDIDATE-U-PROJID-015 CANDIDATE-U-PROJID-016 CANDIDATE-U-PROJID-017 CANDIDATE-U-PROJID-018 CANDIDATE-U-PROJID-019 CANDIDATE-U-PROJID-020 CANDIDATE-U-PROJID-021 CANDIDATE-U-PROJID-022 CANDIDATE-U-PROJID-023 CANDIDATE-U-PROJID-024 CANDIDATE-U-PROJID-025 CANDIDATE-U-PROJID-026 CANDIDATE-U-PROJID-027 CANDIDATE-U-PROJID-028 CANDIDATE-U-PROJID-029 CANDIDATE-U-PROJID-030

実 repo regression は `CANDIDATE-P-PROJID-001`、`CANDIDATE-P-PROJID-002`、
`CANDIDATE-P-PROJID-003` とする。
