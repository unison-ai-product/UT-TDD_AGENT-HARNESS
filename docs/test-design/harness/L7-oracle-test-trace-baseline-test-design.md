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

| 候補 ID | 入力 / fixture | 期待 oracle |
|---|---|---|
| `CANDIDATE-U-OIDBASE-001` | source checkout の旧 `legacy` / `widened` constants と初回 JSON authority | 両集合が要素単位で完全一致し、legacy は89件、widened は317件。citation 状態や宣言を変更しない |
| `CANDIDATE-U-OIDBASE-002` | runtime JSON欠落、JSONのopen/read権限またはI/O失敗、JSON parse不能、schemaVersion違い、必須field欠落、未知field、field型違いを各1つ独立に注入 | すべてfail-closeし、TS constant / 空集合への fallback は起きない |
| `CANDIDATE-U-OIDBASE-003` | 不正oracle ID、同じ配列内のID重複、legacy/widened間のID重複をそれぞれ注入 | 各入力をfail-closeで拒否し、重複や無効IDを集合化で隠さない |
| `CANDIDATE-U-OIDBASE-004` | 実 subject repository と、同一件数だが要素を1件置換した widened authority | U-OIDGATE-005と同じ完全集合比較が不一致を示し、件数一致をGreenとしない |
| `CANDIDATE-U-OIDBASE-005` | 信頼済みPR baseに対し、headのlegacy/widenedから既存IDだけを取り除き、同IDのdebtを解消する入力（宣言を退役するか、対応するtest citationを追加する） | `headSet ⊆ trustedBaseSet` が成立し、同じIDがhead baselineとderived debtの双方から縮小する。削除に伴うanalyzer集合一致も成立し、subset検査がIDを追加しない |
| `CANDIDATE-U-OIDBASE-006` | baseに無い未citation oracleをheadのwidenedとfixture上のderived debtへ加える。また、これとは独立したcaseでbaseに無いIDをheadのlegacyへ加える | 各caseでderived集合と対応するhead baselineの完全一致が成立しても、widened / legacyそれぞれの `headSet ⊆ trustedBaseSet` 違反で拒否 |
| `CANDIDATE-U-OIDBASE-007` | 通常のPRでbase SHA欠落/解決不能、base JSON破損・読取不能、head JSON読取不能 | subset証明をPASS扱いせずfail-close。`origin/main`、branch ref、working-tree値へのfallbackなし |
| `CANDIDATE-U-OIDBASE-008` | 1つの harness package asset root と別の subject repo root を与え、process cwdだけを変更 | 同じbaseline authorityを読み、明示subject rootだけを走査。cwdやconsumer rootの内容によりbaselineが変わらない |
| `CANDIDATE-U-OIDBASE-009` | 実際に生成・展開したclean Pack asset。source checkoutと同じfixtureを使い、Windows/Linuxで異なるcwdから実行 | baseline JSONが配布物に一度含まれ、両OS/両cwdで同じauthorityとして読み込まれる。欠落時はfail-close |
| `CANDIDATE-U-OIDBASE-010` | 旧TS baseline削除とgovernance JSON追加を含む実Git PR diff | 実際のname-status/rename判定を記録する。`src/`→`docs/governance/` moveとして拒否された場合も、design-protectionを弱める例外を追加して通さない |
| `CANDIDATE-U-OIDBASE-011` | 初回移行PRの不変base（merge commit第1親）のGit treeにJSONがなく、旧TS定数ファイルと正規宣言があり、headにstrict decode可能なJSONがあるケース。併せてbase側JSON欠落以外の構造不一致・読取不能・旧集合不一致を注入 | bootstrap routeはbase Git objectの構造条件を満たす初回移行だけで選ばれ、head JSONと旧TS集合の要素完全一致（legacy 89 / widened 317）で成功する。それ以外はfail-closeし、branch/cwd/自己申告によるroute選択を許さない |
| `CANDIDATE-U-OIDBASE-012` | 初回移行後、base treeにJSONが存在するPRで旧TS定数も残したfixture、およびbootstrap実装routeの有無 | JSONをtrusted baseとしたsubset検査を選び、初回routeへ再入しない。#1099 Refactorまたは直後PRで初回routeを削除し、この削除をoracleで固定する |
| `CANDIDATE-U-OIDBASE-013` | `docs/governance/oracle-test-trace-baseline.json` だけを変更するdocs-only PR、PR base情報が不明または解決不能なCI event | change classificationにかかわらずrequired ratchet checkが起動し、base不明・解決不能をFAILにする。check未実行、skip、neutralを成功扱いしない |

`CANDIDATE-U-OIDBASE-005` と `-006` は subset 検査の正負を固定し、集合一致だけでは縮小専用を証明できないことを
示す。`-004` は逆に集合一致自体が引き続き必要であることを固定する。これらを1つのassertに集約して片方の機構を
省略してはならない。

### 初回 bootstrap の限定条件

初回 migration のみ、必須 PR check は不変のPR base（merge commitの第1親）をGit objectから構造検査する。base treeに
JSONがなく、旧TS定数ファイル2つと正規宣言があり、値がlegacy 89 / widened 317として完全に読める場合に限り、headの
strict JSONと旧集合の要素完全一致を検証する。構造や値が不一致・欠落・読取不能ならfail-closeする。branch名、cwd、自己申告
flagによるbootstrap選択は認めない。runtime HEADのJSON欠落・破損は常にfail-closeであり、旧TS定数をruntime fallbackに
使わない。migration merge後はbase JSONが存在するため初回routeへ再入せず、route自体は#1099 Refactorまたは直後のPRで
削除し、その削除を候補 `-012` のoracleで固定する。

## 4. 対象ルートと信頼境界

既存 loader の `repoRoot` は test-design と tests を収集する subject root である。Pack consumer project は harness
baseline asset を所有しないため、authority root / asset reader を別に明示する。`process.cwd()`や任意の環境変数だけで
authority を選ばない。alternate-cwd case は source checkout だけでなく実際の clean Pack asset を使う。

Shrink-only oracle は pull request event で固定された base commit SHA と exact tested head に対して実行する。
base側はGit objectからbaseline fileを読み、head側は検査中のhead treeから読む。両方の集合について subset を比較する。
一般のdoctor/static runにはimmutable PR baseが無いため、そこで履歴比較済みと主張せず、strict current-file decodeと
既存のcurrent-derived equalityを行う。

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
