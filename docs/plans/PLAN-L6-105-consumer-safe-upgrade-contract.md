---
plan_id: PLAN-L6-105-consumer-safe-upgrade-contract
title: "PLAN-L6-105 (add-design): consumer の upgrade で既存の設定・state
  を壊さず新しい版へ変換する契約 freeze"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-10-01
updated: 2026-10-01
owner: Claude control lane (契約起草、Opus 週次上限のため Sonnet 代替) / Codex (実装 PR) / 非著者
  frontier reviewer (Codex Sol)
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
pair_artifact: docs/test-design/harness/L7-consumer-safe-upgrade-test-design.md
next_pair_freeze: L7
backprop_decision: not_required
backprop_decision_reason: 既存の setup 非破壊導入契約 (PLAN-L7-361) と managed block 方式を
  upgrade へ拡張する L6 契約であり、L0-L3 要件の意味は変えない。実装 PR で新契約が生じた場合のみ Reverse を起票する。
agent_slots:
  - role: tl
    slot_label: TL - 所有権分類 SSoT と、conflict 時 fail-close の境界を freeze する
  - role: se
    slot_label: SE - migration registry、on-disk backup、crash 回復の手順を定義する
  - role: qa
    slot_label: QA - consumer 書込 bytes 不変と失敗後 tree 一致の oracle を Windows / Linux で定義する
generates:
  - artifact_path: docs/plans/PLAN-L6-105-consumer-safe-upgrade-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/design/harness/L6-function-design/setup-solo-team.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-361-setup-noninteractive-package-tar-portability.md
    - docs/plans/PLAN-L7-628-pack-consumer-runtime-release-install.md
    - docs/plans/PLAN-L7-362-pack-update-check-advisory.md
    - docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
    - docs/plans/PLAN-L6-102-release-promotion-rollback-gate.md
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/test-design/harness/L7-consumer-safe-upgrade-test-design.md
    - src/setup/index.ts
    - src/setup/templates.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/814
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/364
review_evidence: []
status: draft
sub_doc: function-spec
github_issue_id: 814
admission_receipt:
  schema_version: v2
  receipt_id: certificate:d3f0150857538128d3a0a791ff04b1be
  command_id: plan-draft:issue-814:consumer-safe-upgrade-contract:rechain-1
  admitted_at: 2026-10-05T01:54:51.927Z
  source_digest: sha256:3f107208199bfa56f3df90f1128bd9240fad175acd12e2edd5668f61a1b7f7ba
  decision_digest: sha256:f4053860fd1cab60b09540cf5f1f5e8592ad433d823a3cfc18580984ed8002f2
  receipt_digest: sha256:b1ab758475600b77ca82cf7ddf088344a26a02ac70df6c051cb8b50e0159ba3b
  binding:
    path: docs/plans/PLAN-L6-105-consumer-safe-upgrade-contract.md
    plan_id: PLAN-L6-105-consumer-safe-upgrade-contract
    asset_id: plan:d3f0150857538128d3a0a791ff04b1be
    revision: 1
    content_digest: sha256:3f107208199bfa56f3df90f1128bd9240fad175acd12e2edd5668f61a1b7f7ba
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 814
    episode_id: E4-814-consumer-safe-upgrade
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-628-pack-consumer-runtime-release-install
    revision: 11
    digest: sha256:604fcda0ef7e101ecd8df79e682704d0475dc9be62f6afb077916114f192df52
  reentry:
    target_plan_id: PLAN-L6-105-consumer-safe-upgrade-contract
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue 814 (親 364): consumer upgrade の安全性契約が既存 PLAN に無いため、setup
    非破壊導入と Pack consumer runtime の延長として新契約を L6 に freeze する"
---

# PLAN-L6-105: consumer の安全な upgrade 契約

## 1. 目的

consumer がハーネスの新しい版を取り込むとき、consumer 自身が加えた設定・state を壊さずに新しい版の形へ変換する。PO 判断 (2026-10-01): 「安全にアップデートできることは大事」。親 #364 の A/B 共存・片系 upgrade / rollback を、consumer 内ファイルの粒度で支える契約である。

**本 PLAN は契約 freeze のみ**。production source と test code は追加しない。実装は §7 の PR 列で、v0.2.0-canary.3 の公開と受入 (#676 / #418) の後に着手する。方式は実装 PR の中で発明せず、本 PLAN の改訂へ戻す (PR スコープ規律 2)。

> 本 PLAN の起草者は Claude Sonnet である (Opus が週次上限で 2026-10-04 16:00 JST まで停止)。族分離は変えず、非著者 reviewer は Codex Sol とする。

## 2. 実測 baseline (main 6b5effbc、read-only)

| # | 事実 | 根拠 (再実行可能) |
| --- | --- | --- |
| F1 | managed block で混ぜられるのは `AGENTS.md` / `CLAUDE.md` / `.claude/CLAUDE.md` の 3 つだけ。block の外は保たれる | `grep -n "MERGEABLE_ADAPTER_DOCS" src/setup/index.ts` (647, 812)、`mergeManagedBlock` 786-803 |
| F2 | それ以外の既存ファイルは非対話なら skip、対話で `y` なら**差分表示も backup もなく丸ごと上書き** | `src/setup/index.ts:818-828`、`grep -n "U-SETUP-016b" tests/setup.test.ts` (361) が `y` での上書きを固定している |
| F3 | `COMMON_FILES` の `category` は全件 `"A"` で、所有権を表す属性は無い | `grep -c 'category: "A"' src/setup/templates.ts`、`COMMON_FILES` 645-774 |
| F4 | rollback の snapshot は process 内の Buffer (in-memory)。disk に残らず、process 死亡で復旧できない | `captureSetupFiles` (`src/setup/index.ts:1051-1062`)、`restoreSetupFiles` 1079-1094 |
| F5 | snapshot を取るのは `runSetupAsync` かつ `consumerRuntime` 指定時のみ。素の `runSetup` に rollback は無い | `src/setup/index.ts:959-975` |
| F6 | `harness.db` は snapshot 対象外。`runSetup` は snapshot の外で既存 DB に `rebuildHarnessDb` を呼ぶ (migrate + 1 transaction での truncate / 再 projection) | `src/setup/index.ts:931-939`、`src/state-db/projection-writer.ts:2624-2650`。truncate は `clearRebuildableProjectionTables` のみで、rebuildable でない表の有無は**未測** (§9 M2) |
| F7 | `.gitignore` は `ensureSkillAssetsIgnored` で目印範囲だけ差し替える。利用者の行が保たれることを名指しで固定する test は `tests/` に無い | `src/setup/index.ts:906-913`、`grep -rn "ensureSkillAssetsIgnored" tests` が 0 件 |
| F8 | setup の state / identity に `schema_version` を持つ記述は `src/setup/index.ts` と `src/setup/templates.ts` に無い (`.ut-tdd/state/setup.json` は `STATE_PATH`、642) | `grep -n "schema_version" src/setup/index.ts src/setup/templates.ts` が 0 件 |
| F9 | #364 系の rollback 契約 (PLAN-L6-63 / L6-102) は Pack release 単位の revert / channel pointer であり、consumer 内ファイルの backup 形式は定めていない | `grep -n "backup" docs/plans/PLAN-L6-63-pack-staged-release-rollback.md` に consumer file backup の定義が無い |
| F10 | 非対話で `package.json` / `commitlint.config.js` / 設計文書を書かない | `src/setup/index.ts:922-930`、1201-1216 (Issue #814 の監査) |

## 3. 設計判断

advisor 相談: `ut-tdd advisor --decision design --current-model claude-sonnet-5 --execute` (provider=claude model=claude-fable-5 exit=0、2026-10-01)。advisor の前提を repo 実測で検証し、食い違いは各判断の「実測照合」に記す。回答は鵜呑みにしていない。

### D1 所有権分類

- **採用**: 所有権 SSoT 表を 1 か所に置く。値は 3 種。
  - `harness-owned`: 全体を置換してよい。ただし置換の条件は「存在しない」または「既存 bytes が、過去にハーネスが配布したいずれかの版の digest と一致する (consumer 未編集)」。
  - `consumer-owned`: 一切触らない (`package.json`、`commitlint.config.js`、設計文書)。
  - `marker-mixed`: 管理範囲の目印の外は byte 単位で保つ (`AGENTS.md` / `CLAUDE.md` / `.claude/CLAUDE.md` / `.gitignore`)。
- `harness-owned` で既存 bytes がどの配布版 digest とも一致しない (consumer が編集済み) ときは、**自動 merge せず conflict として停止する**。対象は `.claude/settings.json`、`.codex/config.toml`、`.codex/hooks.json`、`.github/workflows/*`、`commitlint.config.cjs` など。
- 表は `COMMON_FILES` と setup 対象 path (`setupTargetPaths`) の全てを覆う。未分類 path があれば test で fail-close する。
- **棄却**: 汎用 3-way merge。base (配布時点の原本) を consumer 側に永続保持する新しい信頼根が要り、JSON / TOML / YAML / markdown で conflict の意味が揃わない。「未編集か」の判定だけなら配布版 digest 集合で足りる。
- **棄却**: JSON / TOML の key 単位 merge。再 serialize で consumer の整形・コメントが変わり、受入条件「consumer 書込 bytes は 1 byte も変わらない」を破る。必要になれば別契約 (§10 O4)。
- **実測照合**: advisor は「mixed は 3 ファイル程度」と推定した。F1・F3 で marker-mixed が 3 つ (+ `.gitignore`) であることは確認できたが、consumer が実際に編集している率は**未測** (§9 M3)。結論には影響しない (編集済みなら conflict 停止に倒れる)。

### D2 版付き migration registry

- **採用**: settings / state schema に版を持たせ、`vN -> vN+1` の step を registry に登録する。step は「入力 bytes -> 出力 bytes」の純関数で、source / target の版を宣言する。連鎖で現行版まで進める。
- **版の記録が無い既存 consumer は、registry が明示登録した `v0` として扱う** (暗黙推定ではなく v0 -> v1 を最初の step として登録する)。登録外の版、現行より新しい版、parse 不能な版は **fail-close** (書込 0)。
- **棄却**: 版が無ければ fail-close。F8 の通り現行 consumer の state に版が無く、初回 upgrade で全員が停止する。
- **実測照合**: advisor の指摘 (版マーカーの有無が v0 規則を決める) を F8 で確認した。`.ut-tdd/state/setup.json` の実内容は未確認で、実装前の測定 PR で実測する (§9 M4)。

### D3 dry-run 必須と conflict 停止

- **採用**: 書込の前に必ず plan を作る。plan は path ごとに `{owner, action: create | replace | marker-merge | keep | conflict, diff}` を持つ。conflict が 1 件でもあれば **何も書かず非 0 で終了**する。apply は同一 process 内で作った plan だけを消費する (別 invocation の古い plan を適用しない)。
- 非対話での silent skip は廃止し、「conflict のため停止した」と path と理由を出力する。「upgrade したつもりで古いまま」を作らない。
- marker-mixed で目印が壊れている (開始だけ・順序逆転など) 場合も conflict として停止に合流させる。現行 `mergeManagedBlock` は目印が無いときに末尾追記する (`src/setup/index.ts:796-802`) ため、壊れた目印の扱いはこの点で挙動が変わる。
- **棄却**: 即書込 (dry-run 任意)。trade-off は無い。

### D4 backup の置き場と rollback

- **採用**: on-disk の `.ut-tdd/upgrade-backup/<upgrade_id>/` に、対象 path ごとの元 bytes・mode・存在有無と manifest (path / sha256 / mode / existed) を書く。manifest は `prepared` -> `committed` の 2 段階で、`prepared` のまま残っていたら次回起動時に rollback してから先へ進む (process 死亡の回復)。個々の書込は一時ファイル + rename。
- 復元の意味論 (bytes + mode の復元、新規作成物の削除、directory は深い順) は既存 `restoreSetupFiles` と同じにし、実装は共有する。**#364 と共有するのは復元意味論と per-runtime-root 隔離**である。F9 の通り #364 系に consumer ファイル backup の置き場・形式の既存仕様は無いため、「同じ置き場を再利用」ではなく本契約が置き場を定める。backup は各 consumer 自身の `.ut-tdd/` 配下にあるので、A/B の片系 upgrade は互いの backup を見ない。
- backup 配下は projection / doctor / git の走査対象から除外し、世代は直近 3 を上限とする (具体数は §10 O2)。
- `harness.db` は backup しない。F6 の通り rebuildable な projection は `ut-tdd db rebuild` で復元できる。**rebuildable でない表の有無が未測のため (M2)、upgrade の file transaction の中では `rebuildHarnessDb` を呼ばない**。DB の版変換は D2 の registry の別 step として、実測後の別 PR で扱う。
- **棄却**: in-memory snapshot の継続。F4・F5・F6 の通り、process 死亡・素の `runSetup`・DB の rebuild で巻き戻せない窓が実在する。
- **実測照合**: advisor は「#364 と同じ置き場・同じ復元経路を再利用」と述べたが、F9 で #364 側に該当仕様が無いと確認したため、上記のように修正した。

### D5 対話時の丸ごと上書き

- **採用**: **既定で禁止**する。`y` で consumer 編集済みファイルを丸ごと置換する経路を廃止する。`harness-owned` の未編集置換は D1 で安全に行え、編集済みは conflict 停止となるため、丸ごと上書きという操作自体が不要になる。どうしても置換したい利用者向けには path 明示の `--replace <path>` だけを残し、これは D3 の diff 表示と D4 の backup を必須通過する。
- **棄却**: 「diff + backup 付きで `y` 上書きを許す」。所有権分類と二重経路になり drift 源になる。
- **破壊的変更フラグ**: U-SETUP-016b (`y` で既存ファイルを上書きする test) は新契約と衝突するため、実装 PR で test-design の凍結 oracle ごと改訂する。これは契約改訂であり、軽作業の是正ではない。

## 4. 受入条件 (反証可能)

各条件は pair test-design (`docs/test-design/harness/L7-consumer-safe-upgrade-test-design.md`) の `CANDIDATE-U-SAFEUP-*` へ対応づける。実装 PR で正規 ID へ昇格する。

- [ ] AC1 (所有権): `COMMON_FILES` と `setupTargetPaths` の全 path が SSoT 表で分類済み。未分類 path が 1 つでもあれば test が fail する (CANDIDATE-U-SAFEUP-001)。
- [ ] AC2 (consumer 書込不変): consumer が書いた行・設定は upgrade の後も 1 byte も変わらない。marker-mixed は目印外、consumer-owned は全体、conflict 停止時は全 path。CRLF / LF 混在、BOM、末尾改行なしを含む (CANDIDATE-U-SAFEUP-002、Windows / Linux)。
- [ ] AC3 (失敗後の tree 一致): upgrade の途中のどの段階で失敗させても、失敗後の tree は upgrade 前と bytes・存在有無まで一致する (POSIX は mode も)。失敗注入は書込 N 件目ごとに全点で行う (CANDIDATE-U-SAFEUP-003、Windows / Linux)。
- [ ] AC4 (crash 回復): `prepared` の backup が残る状態から再開すると、先に rollback して upgrade 前の tree に戻る (CANDIDATE-U-SAFEUP-004)。
- [ ] AC5 (migration): `v0 -> 現行` の連鎖が登録順に進む。登録外の版・新しすぎる版・parse 不能は書込 0 で fail-close (CANDIDATE-U-SAFEUP-005)。
- [ ] AC6 (dry-run / conflict): conflict が 1 件でもあれば書込 0 で非 0 終了し、path と理由を出力する。非対話でも silent skip しない (CANDIDATE-U-SAFEUP-006)。
- [ ] AC7 (丸ごと上書き禁止): 対話 `y` で consumer 編集済みファイルが置換されない。`--replace <path>` は diff と backup を必ず作る (CANDIDATE-U-SAFEUP-007)。
- [ ] AC8 (A/B 隔離): consumer A の upgrade・rollback が consumer B の tree と backup を変えない (CANDIDATE-U-SAFEUP-008)。
- [ ] AC9 (未確認事項の実測): `.gitignore` の利用者行の保存 (M1) と既存 `harness.db` の扱い (M2) を実測し、必要なら oracle を追加する (CANDIDATE-U-SAFEUP-009 / 010)。

## 5. Windows / Linux の差

oracle は両 OS で実行する。差が出る点を契約として固定する。

- 改行・BOM: bytes 比較で確認し、正規化しない (`.gitattributes` の eol=lf は consumer 側の設定であり upgrade が書き換えない)。
- mode: Windows の `chmod` は実質 no-op。mode 一致の assert は POSIX のみとし、Windows は存在有無と bytes で代替する (代替であることを test に明記する)。
- rename: Windows は open handle・ウイルス対策による `EBUSY` / `EPERM` があり得る。有限回の retry の後に失敗し、失敗時は rollback する。
- 大文字小文字・path 区切り: SSoT 表の key は正規化済み相対 path とし、Windows の case-insensitive な衝突は conflict として停止する。

## 6. 順序

1. 本 PLAN (PR-0、docs のみ) は canary.3 の受入を待たず起票してよい。
2. **実装 PR は v0.2.0-canary.3 の公開と受入 (#676 / #418) の後に着手する**。本線の canary 作業には混ぜない。
3. 実装 PR の前に、本 PLAN と pair test-design を非著者 frontier reviewer が review して freeze する。

## 7. PR 分割 (1 PR = 1 論点)

| PR | 論点 | 新規 source_module | 備考 |
| --- | --- | --- | --- |
| PR-0 | 本契約 + pair test-design (docs のみ) | 0 | 本 PR |
| PR-1 | 所有権 SSoT 表と AC1 | 1 (`src/setup/ownership.ts` 想定) | 配線なし |
| PR-2 | 測定のみ: M1 (`.gitignore` 行の保存)、M2 / M4 (DB・setup.json) の test | 0 | read-only の test 追加。結果次第で本 PLAN を改訂 |
| PR-3 | migration registry と v0 規則 (AC5) | 1 | 配線なし |
| PR-4 | upgrade plan (dry-run diff / conflict) の純関数 (AC6) | 1 | 書込なし |
| PR-5 | on-disk backup / rollback / crash 回復 (AC3, AC4, AC8) | 1 | 復元意味論は `restoreSetupFiles` と共有 |
| PR-6 | setup への配線、対話上書きの廃止、`--replace`、U-SETUP-016b の改訂 (AC2, AC7)、CLI surface | 0 (配線のみ) | 破壊的変更。CLI の最終形は §10 O1 |

PR-2 は PR-1 と並行してよい。順序は PR-1 -> PR-3 -> PR-4 -> PR-5 -> PR-6。依存する正本が閉じる前に下流を着工しない。

## 8. 非対象

- Pack release 単位の publication・rollback (PLAN-L6-63 / L6-102 / L6-101 が所有)。
- `ut-tdd update-check` の advisory (PLAN-L7-362 が所有)。version 比較・通知は本 PLAN で再定義しない。
- JSON / TOML の key 単位 merge、汎用 3-way merge (§3 D1 で棄却、将来別契約)。
- `harness.db` の schema 変換と backup (M2 の実測後に別 PLAN)。
- consumer の `package.json` / 設計文書の自動変更 (consumer-owned として触らない)。
- 認証・認可・課金・PII・secret・外部 API 前提の変更 (本契約は触れない)。

## 9. 未確認事項 (実測予定、PR-2)

- M1: `.gitignore` の利用者の行が upgrade 後も保たれるか。現状は名指しの test が無い (F7)。
- M2: 既存 `harness.db` に対する `rebuildHarnessDb` が、rebuildable でない表を消さないか。`clearRebuildableProjectionTables` の対象外の表を列挙する。
- M3: 全 `COMMON_FILES` について、consumer が実際に編集している率 (mixed の想定が妥当か)。
- M4: `.ut-tdd/state/setup.json` と `ut-tdd.project.json` の実内容と版の有無 (v0 規則の入力)。

## 10. open questions (PO 判断ではない。実装前に advisor / 契約改訂で閉じる)

- O1: upgrade の入口を新 verb (`ut-tdd upgrade`) とするか、`ut-tdd setup` の既存 consumer 検出時の挙動とするか。PR-6 の前に PLAN を改訂して freeze する。
- O2: backup の世代上限 (3 は暫定) と、世代を超えた backup の掃除方式。
- O3: 配布版 digest 集合の保管場所 (Pack manifest 由来か `src/` 内の表か)。Pack の独立性 (source repo を実行時入力にしない) と矛盾しない側を選ぶ。
- O4: JSON / TOML の key 単位 merge を将来導入するか。導入する場合は byte 不変条件 (AC2) との両立方式から契約化する。

PO 権限を要する trade-off は現時点で無い (production infrastructure・破壊的 data 操作・認証認可・課金・PII・secret・licensing・外部 API の高影響境界にいずれも触れない)。

## 11. Schedule (serial)

PR-0 (本 PR) -> 非著者 review -> freeze -> (canary.3 受入後) PR-1 と PR-2 (並行可) -> PR-3 -> PR-4 -> PR-5 -> PR-6。
