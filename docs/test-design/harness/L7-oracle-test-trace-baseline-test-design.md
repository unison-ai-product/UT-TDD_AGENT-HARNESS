---
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
parent_doc: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l6_function_spec: docs/design/harness/L6-function-design/oracle-test-citation-trace.md
---

# oracle-test-trace baseline JSON 正本と縮小専用 ratchet のテスト設計（Issue #1099 草案）

## 1. 適用範囲と本文参照

本書は `docs/design/harness/L6-function-design/oracle-test-citation-trace.md` §7 を補う supplemental 候補設計である。
両文書は本文で相互参照するが、本書は `pair_artifact` を宣言せず、既存 L6 の V-model pair には加えない。
対象は既存 forward oracle-test-trace の baseline authority 移行と縮小専用 ratchet に限る。
既存 `U-OIDGATE-001..015` / `U-OTT-001..006` の意味、共有 index `L7-unit-test-design.md`、
design-protection の protected path を変更しない。本書の候補 ID は実装前の契約であり、
formal oracle 宣言・test citation・実装完了を意味しない。

既存 Red / Green ではなく contract-only draft であるため、ここでは test code や mutation 証跡を追加しない。
後続の Red は本書の候補 ID のみを引用し、初回 migration の値保持と ratchet の各軸を別々に検証する。

## 2. 正本 schema と初回移行

Canonical JSON asset path: `docs/governance/oracle-test-trace-baseline.json`.
概念上の形は次のとおりで、field 追加は versioned schema の改訂なしには許可しない。

```json
{
  "schemaVersion": 1,
  "legacy": ["<exact oracle ID>"],
  "widened": ["<exact oracle ID>"]
}
```

`legacy` と `widened` は異なる debt class であり、ID の完全な要素集合として別々に扱う。
ID 配列の順序は意味を持たないが、ID 重複と両集合の交差は不正である。初回移行は旧 TS 定数の両集合と
JSON 値を要素単位で完全一致させ、oracle の削除・分類替えを同時に行わない。初回 main の値を維持し、legacy は
89 件、widened は317件とする。#1097 の315件を seed に使わない。U-OIDGATE-005 の widened 集合完全一致は
引き続き oracle とし、件数だけの比較に置き換えない。

## 3. 候補 oracle 表

| 候補 ID | 入力 / fixture | 期待 oracle | 主な観測点 |
|---|---|---|---|
| `CANDIDATE-U-OIDBASE-001` | 初回 migration に限り、§4 の不変比較組の `B` の Git tree にある旧 `legacy` / `widened` constants と、`H` の Git tree にある JSON authority を比較 | 両集合が要素単位で完全一致し、legacy は89件、widened は317件。citation 状態や宣言を変更しない。migration 限定であり、migration 後の source-free oracle-retirement contract PR で宣言と test label を同期して退役させる | `checkOracleBaselineRatchet({ authority, ci: { eventName, mergeSha, git } })` の `{ok:true}`、`readFirstParent` と固定 path の `readTextAt(B/H)`。旧定数 blob は限定 bootstrap reader、件数と完全集合差分を証跡化 |
| `CANDIDATE-U-OIDBASE-002` | runtime JSON欠落、JSONのopen/read権限またはI/O失敗、JSON parse不能、schemaVersion違い、必須field欠落、未知field、field型違いを各1つ独立に注入 | すべてfail-closeし、TS constant / 空集合への fallback は起きない | `authority.readText(BASELINE_JSON_PATH)` の `null` と typed `authority_read_failed` を別々に観測し、parse/schema failure reasonも確認 |
| `CANDIDATE-U-OIDBASE-003` | 不正oracle ID、同じ配列内のID重複、legacy/widened間のID重複をそれぞれ注入 | 各入力をfail-closeで拒否し、重複や無効IDを集合化で隠さない | strict decoder の `baseline_id_invalid` / `baseline_id_duplicate` / `baseline_sets_overlap`。集合化前の raw array を入力 |
| `CANDIDATE-U-OIDBASE-004` | 実 subject repository と、同一件数だが要素を1件置換した JSON-backed widened authority | 既存 `U-OIDGATE-005` の完全集合比較が不一致を示し、件数一致をGreenとしない。この mutation は `U-OIDGATE-005` が所有し、独立した継続 oracle にはしない | production `loadOracleTestTraceInput(subjectRoot, ports)` → 既存 `analyzeOracleTestTrace` の stale/orphan result。CI subset reasonを混ぜない |
| `CANDIDATE-U-OIDBASE-005` | 信頼済みPR baseに対し、headのlegacy/widenedから既存IDだけを取り除き、同IDのdebtを解消する入力（宣言を退役するか、対応するtest citationを追加する） | `headSet ⊆ trustedBaseSet` が成立し、同じIDがhead baselineとderived debtの双方から縮小する。削除に伴うanalyzer集合一致も成立し、subset検査がIDを追加しない | CI-only `checkOracleBaselineRatchet` の `{ok:true}` と既存 analyzer の current-derived equality passを別々に観測 |
| `CANDIDATE-U-OIDBASE-006` | baseに無い未citation oracleをheadのwidenedとfixture上のderived debtへ加える。また、これとは独立したcaseでbaseに無いIDをheadのlegacyへ加える | 各caseでderived集合と対応するhead baselineの完全一致が成立しても、widened / legacyそれぞれの `headSet ⊆ trustedBaseSet` 違反で拒否 | `checkOracleBaselineRatchet` が `{ok:false, reason:"baseline_growth"}` を返す。既存 analyzer の complete-set equality がpassする対照は独立して維持 |
| `CANDIDATE-U-OIDBASE-007` | 通常のPRでbase SHA欠落/解決不能、base JSON破損・読取不能、head JSON読取不能 | subset証明をPASS扱いせずfail-close。`origin/main`、branch ref、working-tree値へのfallbackなし | 独立関数へ `eventName` / `mergeSha=github.sha` と `readFirstParent` / `readTextAt` portを渡す。各caseの `{ok:false, reason}` が `pr_context_invalid`、`git_first_parent_missing`、`git_first_parent_read_failed`、`git_baseline_missing`、`git_object_read_failed`、`trusted_baseline_invalid` の対応 literal になることを個別確認 |
| `CANDIDATE-U-OIDBASE-008` | 1つの harness package asset root と別の subject repo root を与え、process cwdだけを変更 | 同じbaseline authorityを読み、明示subject rootだけを走査。cwdやconsumer rootの内容によりbaselineが変わらない | `subjectRoot` の宣言/citation と `authority.readText(BASELINE_JSON_PATH)` を別 root に束縛し、cwd変更前後のloader outputを比較 |
| `CANDIDATE-U-OIDBASE-009` | 実際に生成・展開したclean Pack asset。source checkoutと同じfixtureを使い、Windows/Linuxで異なるcwdから実行 | baseline JSONが配布物に一度含まれ、両OS/両cwdで同じauthorityとして読み込まれる。欠落時はfail-close | build asset inventory / bundle receipt の JSON inclusion と packaged default authority reader の同一 bytes / digest。Pack consumer root は subject のみ |
| `CANDIDATE-U-OIDBASE-010` | 旧TS baseline削除とgovernance JSON追加を含む実Git PR diff | 実際のname-status/rename判定を記録する。`src/`→`docs/governance/` moveとして拒否された場合も、design-protectionを弱める例外を追加して通さない | `git diff --name-status B H` の実分類と既存 `design-protection-diff-gate` 結果。新しい例外・checker は設けない |
| `CANDIDATE-U-OIDBASE-011` | 初回移行PRの trusted base `B` の Git tree に JSON がなく、旧 TS 定数ファイルと正規宣言があり、検証対象 `H` に strict decode 可能な JSON があるケース。併せて base 側 JSON 欠落以外の構造不一致・読取不能・旧集合不一致を注入 | bootstrap route は構造条件を満たす初回移行だけで選ばれ、head JSON と旧 TS 集合の要素完全一致（legacy 89 / widened 317）で成功する。それ以外は fail-close し、branch/cwd/自己申告による route 選択を許さない。初回移行後の source-free oracle-retirement contract PR で宣言と test label を同期して退役させる | `checkOracleBaselineRatchet` の成功 `{ok:true}` と、負例ごとの `{ok:false, reason:"bootstrap_base_invalid"}` / `{ok:false, reason:"bootstrap_value_mismatch"}` を観測。`B` blob の JSON-only absence と2旧定数の存在/正規宣言はGit readerで独立確認 |
| `CANDIDATE-U-OIDBASE-012` | migration merge 後、bootstrap route の削除前後を比較する。JSON が base に存在する通常 PR で旧 TS 定数が残っていてもよい | 通常 PR は JSON-backed trusted-base subset check を使い、初回 bootstrap route はソースから削除されている。route の削除は Refactor に含めず、migration 後の独立 bootstrap-retirement Green PR がこの候補だけを所有する | JSON が `B` に存在する pair で旧定数の有無にかかわらず bootstrap branch が到達不能であることを実 source route と candidate-specific test で観測 |
| `CANDIDATE-U-OIDBASE-013` | `docs/governance/oracle-test-trace-baseline.json` だけを変更するdocs-only PR、PR base情報が不明または解決不能なCI event | change classificationにかかわらずrequired ratchet checkが起動し、base不明・解決不能をFAILにする。check未実行、skip、neutralを成功扱いしない | `.github/workflows/harness-check.yml` の必須ratchet stepが `checkOracleBaselineRatchet` を呼び、`{ok:false, reason:"pr_context_invalid"}` 等の失敗 result を non-zero に投影すること、および docs-only でも step が non-skipped であることを観測。`eventName` / `mergeSha=github.sha` 不在または不正は typed reason として確認 |

`CANDIDATE-U-OIDBASE-005` と `-006` は subset 検査の正負を固定し、集合一致だけでは縮小専用を証明できないことを
示す。`-004` は逆に集合一致自体が引き続き必要であることを固定する。これらを1つのassertに集約して片方の機構を
省略してはならない。

### 既存 oracle との所有対応

既存 formal ID の意味と期待値は増やさない。source を変更しない Red / 正式 oracle 工程で、TS 定数を直接参照している
formal test を既存 production `loadOracleTestTraceInput` の戻り値へ付け替え、実装 target を JSON-backed loader input
へ移す。対応は次のとおりである。

| 既存 formal ID | JSON-backed input に対する既存 assertion (意味は不変) | 候補との関係 |
|---|---|---|
| 既存宣言への参照: `U-OIDGATE-005` | `input.widenedBaseline` と再導出 widened debt の完全な要素集合一致 | `CANDIDATE-U-OIDBASE-004` の同件数置換 mutation を所有する。004 は独立した継続 oracle ではない |
| 既存宣言への参照: `U-OIDGATE-006` | `input.widenedBaseline` に citation 済み実宣言 ID を混入し、既存集合比較が不一致を検出する | JSON-backed widened を通す既存の stale-baseline assertion を維持する |
| 既存宣言への参照: `U-OIDGATE-007` | `input.baseline.size === 89` と、legacy / widened の交差 0 | 初回 migration の旧定数と JSON の一時的な完全一致だけを `CANDIDATE-U-OIDBASE-001` が担う |
| 既存宣言への参照: `U-OTT-006` | production `loadOracleTestTraceInput` の `input.baseline.size === 89` のみ | 既存の 89 件維持 assertion のみを保持する。例外適用など新しい期待は追加しない |

候補の独立した主張は `-002/-003` (strict schema/token rejection)、`-005/-006` (subset ratchet)、`-007` (trusted
base / file read fail-close)、`-008/-009` (明示 root と Pack/OS/cwd)、`-013` (必須 CI 起動) である。`-010` は実 Git
rename 分類の記録であり、独立した合否 oracle や免除を作らない。`-001/-011` は初回 migration に限り、Green 後の
source-free oracle-retirement contract PR で宣言と
test label を同期して退役させる。`-012` はその後の独立 bootstrap-retirement Green PR が唯一所有し、migration PR では
未実装 Red として残す。Refactor の `tests/` 差分は 0 とし、route 削除を Refactor へ移さない。

### 初回 bootstrap の限定条件

初回 migration のみ、必須 PR check は §4 の不変比較組 `B=M^1`, `H=M` を使い、`B` の Git tree を構造検査する。base treeに
JSONがなく、旧TS定数ファイル2つと正規宣言があり、値がlegacy 89 / widened 317として完全に読める場合に限り、headの
strict JSONと旧集合の要素完全一致を検証する。構造や値が不一致・欠落・読取不能ならfail-closeする。branch名、cwd、自己申告
flagによるbootstrap選択は認めない。runtime HEADのJSON欠落・破損は常にfail-closeであり、旧TS定数をruntime fallbackに
使わない。初回 migration Green では `-001` / `-011` を満たすが、`-012` の route 削除は未実装 Red のまま残し、#1099
全体の oracle closure と称さない。migration 後、source を変更しない oracle-retirement contract PR で `-001` / `-011`
の宣言と test label を同期して退役させる。その後の独立 bootstrap-retirement Green PR が route を削除し、候補 `-012`
だけを完了する。Refactor は `tests/` 差分 0 のままとし、route 削除を混ぜない。

## 4. 対象ルートと信頼境界

既存 loader の `repoRoot` は test-design と tests を収集する subject root である。Pack consumer project は harness
baseline asset を所有しないため、authority root / asset reader を別に明示する。`process.cwd()`や任意の環境変数だけで
authority を選ばない。alternate-cwd case は source checkout だけでなく実際の clean Pack asset を使う。

Shrink-only oracle の信頼する commit pair は、GitHub Actions の PR 検証 merge commit `M = github.sha`、base `B = M^1`
（merge commit の第1親）、head `H = M` に固定する。`B` 側は Git object から baseline file を読み、`H` 側は検証対象の
merge tree から読む。両方の集合について subset を比較する。これは既存
`design-protection-diff-gate.md` §7 および `.github/workflows/harness-check.yml` の `BASE_SHA=${{ github.sha }}^1`,
`--head "${{ github.sha }}"` と同一の組である。PR context の信頼元は Actions の `github.event_name == pull_request`
と immutable `github.sha` のみで、event payload の `pull_request.base.sha`、PR branch HEAD、branch 名から推測しない。
subset ratchet は GitHub Actions の required PR CI boundary に限る。通常のローカル loader / doctor / static run は
subset pair を受け付けず、strict decode と current-derived equality のみを行い、subset 証明を主張しない。

## 5. 設計保護境界と移行

`docs/design/harness/L6-function-design/design-protection-diff-gate.md` の規則に従い、protected design/test-design pathと
implementation分類は変更しない。baseline JSONは `docs/governance/` のdata assetであり、保護pathの編集例外ではない。
JSONが変更された場合はpath laneにかかわらずrequired PR ratchet checkを実行する。

初回移行では旧定数からJSONへ値を移すだけとし、後続#1097のwidened縮小や#1093のlegacy stale処理を含めない。
実装時はTS削除がGit上のrenameとして認識されるかを実測し、拒否された場合はpath protectionや
`implementation-moved-out`を弱めず移行順序または表現で解決する。

## 6. 凍結と証跡

本書の候補IDは、正式IDへの昇格前にRed testのstatic labelで引用する。実装PRは候補ごとに該当契約規則をmutationして
Redを確認し、同じ規則だけをGreen化する。Red、Green、Refactorの正規snapshotはexact HEADに結び付ける。

契約merge後、最初のJSON移行は旧定数との要素同一性を証明する。その後にのみbaseline縮小を再開し、#1097では
source定数を変更せずJSON側のwidened setを縮小する。#1093はこの移行とは別の後続契約/実装で扱う。
