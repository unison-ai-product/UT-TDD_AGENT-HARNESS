---
layer: L6
artifact_type: design_doc
status: draft
sub_doc: function-spec
artifact_role: topic_plan_retirement_gate
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1078
---

> **L6 contract marker**: `analyzePlanRetirement(input: PlanRetirementInput) => PlanRetirementResult` は unit-test 粒度の contract とする (純関数)。`loadPlanRetirementInput(repoRoot, base, head) => PlanRetirementInput` は repo を読む loader で、判定を持たない。DbC pre/post/invariant は §6 にまとめる。oracle の索引は共有の `docs/test-design/harness/L7-unit-test-design.md` (§PLAN 退役 gate) に置き、詳細 (`CANDIDATE-U-PLRET-001`〜) は専用の `docs/test-design/harness/L7-plan-retirement-gate-test-design.md` が固定する。

> **状態**: 本書は **未実装の目標契約** である (issue #1078)。§2 の「現状」は 2026-10-19 時点の実測で、§3 以降の「目標」はまだ実装されていない。実装は §10 の順に別 PR で入れる。実装 PR は本書の方式を変えない (方式変更が要るなら PR を止めて本書の改訂へ戻る)。

# PLAN 退役 gate — 関数設計 (issue #1078)

## 1. 目的

`docs/plans/` の PLAN を物理削除する PR に対して、**削除される各 PLAN** の意味 (契約・規則・判断理由・作業単位) が行き先へ移ったことを機械で確かめ、欠けていれば fail-close する。#958 の出口条件 (d)「ずれ判定が全件終わる」の機械化であり、PLAN にしかない契約を残したまま削除する事故 (意味の落下) を、削除 PR の merge 前に止める。検査の対象は「全 PLAN」ではなく「この PR で削除される PLAN」に限る (案B。issue #1078 の 2026-10-19 設計判断。ロット単位で順に削除できる)。全件の最終化率は gate に混ぜず、EOD の棚卸しのコマンドで見る (案C は不採用)。

新しい台帳は作らない。既存の処分 JSON (§3) を正本とし、gate はそれを**読むだけ**である。人手の最終化 (ロット単位) は本 gate の範囲外で、gate が通ることがその完了の機械的な証明になる。

## 2. 現状 (実測、2026-10-19、origin/main = `7e8d67be7`)

| 項目 | 値 | 測定 |
|---|---|---|
| tracked PLAN | 1,008 件 | `git ls-files docs/plans \| grep -c 'docs/plans/PLAN-'` |
| 処分 JSON の `plans[]` | 1,007 件 | `06_PLAN_DISPOSITION_FIRST_PASS.json` (source commit `3ca0692d`) |
| 処分 JSON に無い tracked PLAN | 1 件: `PLAN-L6-971-consumer-trace-gates.md` | 上の差集合 (JSON の `sourcePath` 集合と `git ls-files` の比較) |
| `wholeSourceDisposition` | 1,007 件すべて `not-finalized` | JSON の集計 |
| `preliminaryState` | `hold` 995 / `superseded-link-confirmed` 12 | 同上 |
| 人手判定 (b / d / f) | 543 / 246 / 218 = 1,007 件。b は 生きている 251 / 保留 292、d は 保留 127 / 生きている 118 / 廃止予定 1、f は 廃止予定 14 / 保留 98 / 生きている 106。いずれも `classificationIsFinal: false` | `issue959-human-disposition-{b,d,f}-20261013.json` |
| drift 判定 (#977) | 65 件 (redesign 0 / red_green_fix 0 / design_follow 6 / hold 9 / retire_or_planned 25 / false_positive 25) | `issue977-drift-judgments-20261013.json` の `counts` |

つまり (1) 最終処分は 0 件、(2) 行き先を持つ記録形式がまだ無い、(3) 処分 JSON は固定 commit の一次インベントリで、その後に起票された PLAN を含まない (1 件欠落を実測)。したがって、現状で `docs/plans/` を削除する PR を出すと、gate が無ければ意味を落としても誰も止められない。欠落 1 件は、その PLAN を削除する PR でだけ gate が落とす (削除しない PLAN の欠落は止めない)。

## 3. 入力 (正本)

### 3.1 処分 JSON

- path: `docs/governance/candidates/v4-roadmap/migration/06_PLAN_DISPOSITION_FIRST_PASS.json` (定数 `PLAN_DISPOSITION_PATH`)。
- 構造: `{ schemaVersion, source, primaryReviewIsIncomplete, finalDispositionsClassified, summary, supersessionAudit, plans[] }`。`plans[]` の 1 要素が 1 PLAN。gate が読む既存フィールドは `planId` / `sourcePath` / `wholeSourceDisposition` / `confirmedSupersededBy` (後継 PLAN の `planId` 配列。非自己の双方向 link が確認できた分だけ入る)。
- 既存の `wholeSourceDisposition` は現在 `not-finalized` の 1 値だけである。本設計は、最終化のときにこれと次の 2 フィールドを同じ要素へ書き足す形式を決める (新しいファイルは作らない)。

### 3.2 最終化の記録形式 (本書が固定する)

| フィールド | 型 | 内容 |
|---|---|---|
| `wholeSourceDisposition` | `"transferred" \| "merged" \| "retired" \| "not-finalized"` | 移管 / 統合 / 廃止 / 未最終化。`not-finalized` は gate では未完了として扱う。 |
| `destinations` | `Destination[]` | `transferred` / `merged` は 1 件以上必須。`retired` は空でもよい。 |
| `retirementReason` | `string` | `retired` は非空 (空白のみは空とみなす) 必須。他の処分では任意。 |
| `reconciliation` | `Reconciliation` | 全処分で必須 (§3.3)。 |

`Destination` は次のいずれか。

- `{ kind: "design", path, section }` — 設計文書への移管。`path` は `docs/design/` または `docs/test-design/` 配下の tracked file、`section` は見出し文字列 (§4 規則 3 の一致規則)。
- `{ kind: "issue", number }` — 作業単位の行き先となる GitHub issue。`number` は 1 以上の整数。

`transferred` / `merged` の `destinations` は `design` か `issue` を少なくとも 1 件含む (どちらでも可。契約が設計文書へ、作業単位が issue へ移るのが通常で、両方を要求しない)。

### 3.3 照合証跡 `Reconciliation`

| `kind` | 形 | 意味 |
|---|---|---|
| `three-way` | `{ kind, verdict, evidencePath, evidenceId }` | PLAN ⇔ 設計文書 ⇔ コードの三者照合 (#648 の手順) の結果。`verdict` は `consistent` (3 者が一致) か `plan-stale` (PLAN 側だけが古く、設計文書とコードが正しい) のみ有効。`evidencePath` は照合の記録 (`docs/` 配下の tracked file) で、本文に `evidenceId` の文字列を含むこと (例: #977 の `CD-01`、#959 lot の `planId`)。 |
| `supersedes-two-sided` | `{ kind }` | 後継 PLAN との supersedes が双方向 (後継の宣言 + 対象本文の back-reference) で確認済みであること。値は JSON の `confirmedSupersededBy` が 1 件以上であることに加え、**連鎖が PLAN 以外の行き先で閉じていること** (§4 規則 4 の終端条件) で判定する。 |

`verdict` が `consistent` / `plan-stale` 以外 (例: `conflict` / `pending` / 欠落) は照合が解決していない。この場合、処分は最終化できない (設計または実装の齟齬を先に直す)。

## 4. 判定規則

`records` = 処分 JSON の `plans[]`。対象 PLAN 集合 `S` = **この PR で削除される** `docs/plans/PLAN-*.md` (§5)。規則 1〜4 は `S` の各 PLAN だけを検査し、削除しない PLAN の欠落・未最終化は落とさない。規則 5 は削除しない側の残存参照を検査する。規則と reason は次のとおり。

| # | 規則 | reason |
|---|---|---|
| 0 | 処分 JSON が存在し parse でき、`plans` が配列である。 | `disposition_unreadable` |
| 1 | `S` の各 PLAN に、`sourcePath` が一致する記録がちょうど 1 件ある (欠落・重複の両方を落とす)。処分 JSON に無い PLAN (§2 の欠落 1 件) は、削除される PR でこの規則により落ちる。 | `plan_not_in_disposition` / `duplicate_disposition` |
| 2 | 記録の `wholeSourceDisposition` が `transferred` / `merged` / `retired` のいずれか。`not-finalized` や未知値は落とす。 | `not_finalized` / `invalid_disposition` |
| 3 | 行き先。`transferred` / `merged` は `destinations` が §3.2 の条件を満たす。`design` の `path` が実在しない、または `section` が一致する見出しを持たない場合も落とす。`issue` の `number` が正の整数でない場合も落とす。`retired` は `retirementReason` が非空。 | `missing_destination` / `destination_path_missing` / `destination_section_missing` / `invalid_issue_ref` / `missing_retirement_reason` |
| 4 | 照合証跡。`reconciliation` が §3.3 のいずれかで、`three-way` は `verdict` が有効、`evidencePath` が実在し本文に `evidenceId` を含む。`supersedes-two-sided` は `confirmedSupersededBy` が 1 件以上で、かつ**終端条件**を満たす: いずれかの後継 PLAN が (i) head の tree に存在し、この PR で削除されない、または (ii) 後継自身の記録が `transferred` / `merged` で、`design` / `issue` の行き先を持ち規則 2・3 を満たす (後継がこの PR で同時に削除される場合も (ii) で受理する)。後継の `supersedes-two-sided` や `retired` は終端に数えない (連鎖は PLAN 以外の行き先で閉じる。再帰しない)。 | `missing_reconciliation` / `reconciliation_unresolved` / `reconciliation_evidence_missing` / `supersedes_chain_open` |
| 5 | 参照の残存。**削除されない** PLAN の frontmatter の `requires` / `parent` / `supersedes` / `references`、および `docs/design/` `docs/test-design/` の文書 frontmatter の owning-plan 欄 (`plan:`) が、`S` の PLAN (`plan_id` または `docs/plans/<file>.md` の path) を指していれば落とす。violation の `path` は参照元の file。**本文中の PLAN ID の言及は履歴参照であり、対象外 (止めない)**。 | `dangling_plan_reference` |

規則 5 の範囲の注記: `references` は既存の lint では未検査 (advisory) だが、削除後に指す先が消える点は他の欄と同じなので対象に含める。CLAUDE.md §PLAN Filing Rules の「draft への依存は `references` へ」は**どこへ書くか**の規則で、本規則は**削除時に残さない**規則であり、両立する (削除する側が参照元を先に直す)。

「節が一致する」の規則: 行き先文書の markdown 見出し行 (`^#{1,6}\s+(.+)$`) の本文を trim したものが、`section` を trim した文字列で**始まる**ものが 1 つ以上あること。見出しの装飾 (`§` 番号等) を含めて指定してよい。コードフェンス内の行は見出しとして数えない。

出力順は決定的にする: `path` の辞書順、同一 path は規則番号順。

## 5. 発火条件

| 条件 | 動作 |
|---|---|
| PR の base...head の差分に `docs/plans/PLAN-*.md` の**削除** (name-status が `D`、または `R` で旧 path が `docs/plans/PLAN-*.md` かつ新 path が `docs/plans/` 外) が 1 件以上ある | 削除された PLAN を `S` とし、§4 を適用する。violation が 1 件でもあれば fail-close。 |
| 削除が 0 件 (追加・変更・`docs/plans/` 内の rename だけを含む) | **何も検査せず pass**。削除を含まない PR には影響しない。 |
| 処分 JSON 自体を同じ PR で削除する | 削除を含む PR なので発火し、規則 0 で落ちる (head 側に JSON が無い)。 |

`loadPlanRetirementInput` は `git diff --name-status -M <base>...<head> -- docs/plans/` で削除 (`S`) を読み、head の作業ツリーで処分 JSON・行き先文書・証跡文書、削除されない PLAN の frontmatter、設計文書の `plan:` 欄を読む。base / head の解決は設計保護 gate (`src/github/design-protection.ts`) の `readDesignProtectionChanges` と同じ解決 (同じ引数形式) に揃える。起動点 (CI への配線、`ut-tdd` コマンド化) は実装 PR で design-protection と同じ層に置き、本書は配線の形を固定しない。

## 6. 関数 (シグネチャ)

```ts
// src/lint/plan-retirement-gate.ts (実装 PR で新設。src/lint の「純関数 analyzer + loader」の流儀)
export type PlanRetirementReason =
  | "disposition_unreadable" | "plan_not_in_disposition" | "duplicate_disposition"
  | "not_finalized" | "invalid_disposition"
  | "missing_destination" | "destination_path_missing" | "destination_section_missing"
  | "invalid_issue_ref" | "missing_retirement_reason"
  | "missing_reconciliation" | "reconciliation_unresolved" | "reconciliation_evidence_missing"
  | "supersedes_chain_open" | "dangling_plan_reference";

export interface PlanRetirementViolation { path: string; reason: PlanRetirementReason }

export interface PlanRetirementInput {
  deletedPlanPaths: string[];          // 対象集合 S: base...head で削除された docs/plans/PLAN-*.md
  headPlanPaths: string[];             // head の tree に残る docs/plans/PLAN-*.md (後継の存在判定用)
  planReferrers: { path: string; refs: string[] }[]; // 削除されない PLAN の requires/parent/supersedes/references の値
  designOwners: { path: string; plan: string | null }[]; // docs/design・docs/test-design 文書の plan: 欄
  disposition: unknown | null;         // 処分 JSON の parse 結果 (読めなければ null)
  fileHeadings: Record<string, string[] | null>; // 参照された path -> 見出し本文 (不在は null)
  fileTexts: Record<string, string | null>;      // 証跡 path -> 本文 (不在は null)
}

export interface PlanRetirementResult { violations: PlanRetirementViolation[]; ok: boolean }

export function analyzePlanRetirement(input: PlanRetirementInput): PlanRetirementResult;
export function loadPlanRetirementInput(repoRoot: string, base: string, head: string): PlanRetirementInput;
export function planRetirementMessages(result: PlanRetirementResult): string[]; // "path:reason"
```

DbC:

| 区分 | 内容 |
|---|---|
| pre | `analyzePlanRetirement` は I/O をしない。`deletedPlanPaths` が空ならその場で `{ ok: true, violations: [] }` を返す。`planReferrers` / `designOwners` / `headPlanPaths` は loader が head の tree から作る。`fileHeadings` / `fileTexts` は loader が、`disposition` の `destinations[].path` と `reconciliation.evidencePath` を全て先読みして埋める (欠落キーは「不在」と同義)。 |
| post-1 | `ok === (violations.length === 0)`。出力は §4 の決定的な順序。 |
| post-2 | 規則 0 が落ちるときは他の規則を評価せず、`path` を処分 JSON の path とする violation 1 件だけを返す。 |
| post-3 | 規則 1〜4 の violation の `path` は `deletedPlanPaths` の要素だけ、規則 5 の `path` は削除されない参照元だけである。削除しない PLAN の処分記録の欠落・未最終化は violation にならない。 |
| invariant-1 | 削除を含まない入力では常に `ok: true` (処分 JSON が壊れていても)。 |
| invariant-2 | 判定は `disposition` と引数だけから導く。実行時の `Date`・環境変数・network (gh) を使わない。`issue.number` の実在確認は行わない (形式のみ。issue の実在は人手最終化と review が担う。§8)。 |
| invariant-3 | loader は処分 JSON を**書き換えない**。生成スクリプト (`06_PLAN_DISPOSITION_FIRST_PASS.mjs`) は最終化後に `--write-json` で上書きしてはならない (§9)。 |

## 7. fail-close の出力

1 行 1 violation で `path:reason` 形式とする。`path` は削除される PLAN の path (規則 1〜4)、削除されない参照元の path (規則 5)、または処分 JSON の path (規則 0)。exit code は violation があれば非 0。例:

```
docs/plans/PLAN-L6-971-consumer-trace-gates.md:plan_not_in_disposition
docs/plans/PLAN-L7-01-session-log.md:not_finalized
docs/plans/PLAN-L7-02-keep.md:dangling_plan_reference
```

(1 行目と 2 行目はそれぞれの PLAN を削除する PR の場合、3 行目は削除されない PLAN が削除対象を参照している場合)

## 8. 範囲外と既存 gate との境界

| 項目 | 扱い |
|---|---|
| 処分 JSON の最終化 (1,007 + 1 件の人手判定) | 範囲外。ロット単位の別作業で、本 gate が通ることがその完了条件 (issue 完了条件 2)。 |
| PLAN の物理削除 PR | 範囲外 (issue 完了条件 3)。本 gate は削除の可否を判定するだけで、削除自体はしない。 |
| 行き先の**内容の正しさ** (その節が本当に PLAN の意味を担っているか) | 機械では判定しない。非著者 review と三者照合の `verdict` が担う。gate は path・節・証跡の存在と形式の検査に留まる。 |
| issue の実在・状態 | 検査しない (offline・決定的な gate を保つ)。 |
| 設計保護 gate (`design-protection.ts`) | 別の軸。向こうは `docs/design/` `docs/test-design/` と `src/` の混在を扱い、本 gate は `docs/plans/` の削除だけを扱う。互いの入力・出力を共有しない。 |
| `merged-plan-status` / `duplicate-artifact-ownership` / `plan-supersession` | PLAN が存在する間の整合を見る lint。本 gate は PLAN が消えるときだけ発火し、重ならない。`supersedes-two-sided` の判定は処分 JSON の記録値を使い、`plan-supersession` を再実行しない。 |
| PLAN 本文中の PLAN ID の言及 | 履歴参照として止めない (規則 5 の対象外)。削除後も本文の言及は文字列として残る。 |
| 削除しない PLAN の最終化率 (全件の進捗) | gate に混ぜない (案C 不採用)。EOD の棚卸しのコマンドで数える。 |
| 新規 PLAN の発行 | 範囲外 (停止の方向)。本 PR・実装 PR とも PLAN を起票しない。 |

## 9. 処分 JSON の凍結

最終化の記録を同じファイルへ書くので、一次インベントリの生成スクリプトが再実行で上書きすると記録が消える。実装 PR は、生成スクリプトに「`plans[]` のいずれかが `not-finalized` 以外なら `--write-json` を拒否する」ガードを足す (最小実装。新しい台帳・別ファイルは作らない)。ガードは本 gate の oracle (`CANDIDATE-U-PLRET-016`) で固定する。

## 10. 実装順序

1. **契約 PR (本書 + 専用 L7 + 共有 L7 の索引)**: docs だけ。
2. **登録 + Red**: `tests/` に `it.fails` を `CANDIDATE-U-PLRET-*` で引用して入れる。開発 repo を読む oracle (`CANDIDATE-U-PLRET-015` / `016`) があるので、`test-repository-isolation` の登録行 (`src/doctor/test-repository-isolation.ts` の `repositoryReadContracts`) をこの PR の `src/` 変更として入れる (設計保護 gate の L6 `design-protection-diff-gate.md` §10.3 の三段階に従う)。
3. **昇格 (src/ を含まない)**: 候補を正式 `U-PLRET-*` へ昇格し、テスト名の引用を書き換える。
4. **実装 PR**: `it.fails` を `it` に戻す最小実装 (`src/lint/plan-retirement-gate.ts` + §9 のガード + 最小配線)。実装 PR は `docs/test-design/` を変えない。
5. **処分 JSON の最終化** (人手、ロット単位。別 issue / PR)。
6. gate が通った状態で PLAN 削除 PR。

## 11. 非目標

- PLAN 本文の意味の自動抽出・自動分類。
- 処分 JSON 以外の台帳・projection (harness.db への投影を含む) の新設。
- `docs/plans/` 以外の削除 (設計文書・テスト設計の削除) の検査。
