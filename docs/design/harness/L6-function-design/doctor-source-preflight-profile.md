---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_doctor_source_preflight_profile
pair_artifact: docs/test-design/harness/L7-doctor-source-preflight-profile-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1037
---

> **L6 contract marker**: `resolveDoctorRunProfile(options: DoctorRunProfileResolutionOptions) => DoctorRunProfile` に、PR を出す前の点検用の名前付き profile `source-preflight` を足す unit-test-granularity contract である。候補 oracle は `CANDIDATE-U-PREFLIGHT-001` から `CANDIDATE-U-PREFLIGHT-014`。oracle の詳細は `docs/test-design/harness/L7-doctor-source-preflight-profile-test-design.md` が固定する。

> **状態**: 本書は issue #1037 の最初の切り出しに対する**未実装の目標契約**である。実装 (Green) は本書と対の L7 を凍結し、Red を入れた後に別 PR で行う。方式の変更が必要になったら実装を止め、本書と対の L7 を同時に改訂する。

# doctor の pre-flight 用 profile — 関数設計 (issue #1037)

## 1. 目的

PR の CI (`harness-check`) を赤にする hard gate のうち、よく踏むものを、著者が push の前に手元で短時間に流せるようにする。2026-11-12 には契約 PR #1653 と #1654 が、手元で流していなかった `doc-split` / `l6-completion` / `oracle-test-trace` で CI を赤にした。同じ日に #1652 が `code-size` で赤になった。それより前にも #1009 / #1029 / #1034 が `l6-completion` で止まった。どれも手元で該当の check を 1 回流せば push の前に分かった失敗である。

全件の doctor は手元で 10 分を超えることがある (issue #70)。著者が毎回流す前提にはできないので、よく踏む check だけを束ねた名前付き profile を用意する。

## 2. 範囲と範囲外

範囲は、doctor の名前付き profile を 1 つ足すことに限る。profile の id、流す check の集合、終了コード、出力の扱いを定める。

範囲外 (#1037 に残す。§9):

- 新しい subcommand、pre-push hook、`ut-tdd pr create` の wrapper。
- 変更した path から流す check を選ぶこと (diff に応じた選択)。
- 赤の理由に、それを解消する issue / PR の番号を添えること。
- CI 側の変更。CI は本 profile を使わない。

## 3. 決めたこと (control lane の判断と理由)

control lane が決め、本書はそれを記録する。再検討の対象にしない。

| 判断 | 内容 | 理由 |
|---|---|---|
| D1 入口 | 新しい doctor の run profile `ut-tdd doctor --profile source-preflight` にする | profile の追加は `src/cli.ts` の変更を要しない (§6 で実測)。`src/cli.ts` は S7 が終わるまで Issue #1379 が押さえている。doctor の singleton lock もそのまま使える |
| D2 check 集合 | §4.2 の 8 件に固定する | 2026-11-12 の #1653 / #1654 (`doc-split` / `l6-completion` / `oracle-test-trace`)、#1652 (`code-size`)、それ以前の #1009 / #1029 / #1034 (`l6-completion`) が赤になった実例から選んだ |
| D3 選び方 | この切り出しでは diff から選ばない。集合は固定する | 選び方の規則は別の契約で決める (§9)。固定集合なら、流したものと流していないものが著者に常に同じに見える |
| D4 終了と出力 | 既存の profile と同じ。member の check は既存の hard gate と同じく fail-close する | 新しい判定の論理を足さない (§5 の I2) |
| D5 位置付け | 著者向けの助言であり、merge の権限は CI `harness-check` に残る | 本 profile は CI の部分集合なので、pre-flight が緑でも CI が緑とは限らない (§4.4) |

#1037 の本文は「CI の doctor が fail-close する check の集合と同じにする」としていた。D2 / D3 はこれを狭め、固定の部分集合から始める。CI と同じ集合を手元で流すことは、全件の doctor (`--profile source-full`、既定) で今もできる。

## 4. 正規契約

### 4.1 profile の定義

`DOCTOR_RUN_PROFILES` に次の entry を足し、`DOCTOR_RUN_PROFILE_IDS` に id を 1 回だけ足す。

| field | 値 |
|---|---|
| `id` | `source-preflight` |
| `audience` | `source` |
| `invocation` | `registry` |
| `scope` | `full` |
| `setupSmoke` | `false` |
| `outputIds` | §4.2 の 8 件 (宣言順) |
| `sourceOnly` | `true` |

`DOCTOR_RUN_PROFILE_IDS` の並びは `source-full`、`source-doc-lane`、`source-preflight`、`source-toolchain`、`consumer-toolchain`、`consumer-setup-smoke` とする。source の profile を先にまとめる既存の並びに合わせる。`sourceOnly: true` なので、consumer 向けの経路 (`consumerSafeDoctorRunProfiles()`、`doctorRunProfilesForAudience("consumer")`) には現れない。

既定の解決は変えない。`resolveDoctorRunProfile({})` は今と同じく `source-full` を返す。

### 4.2 check 集合

`outputIds` は次の 8 件と完全に一致する。過不足を許さない。どれも `FULL_DOCTOR_OUTPUT_IDS` に既にある output id であり、registry に scope `full` の定義がある (§6)。

| 宣言順 | output id | 主に捕まえるもの |
|---|---|---|
| 1 | `doc-split` | L6 / L7 の文書が行数・責務数の上限を超える、baseline 済みの文書が増える |
| 2 | `code-size` | `src/` などの code が大きさの上限を超える |
| 3 | `l6-completion` | 新しい L6 文書の frontmatter・対の L7・unit contract の欠け |
| 4 | `l6-fr-coverage` | FR と L6 unit contract / oracle の接続の欠け |
| 5 | `oracle-test-trace` | 宣言した oracle に tests の citation が無い、ID の重複 |
| 6 | `test-repository-isolation` | test が実 repo の状態に触れる |
| 7 | `rule-drift` | adapter 間の規則の marker のずれ |
| 8 | `readability` | 文書の文字化け marker |

定数名は `SOURCE_PREFLIGHT_OUTPUT_IDS` とし、`SOURCE_DOC_LANE_OUTPUT_IDS` と同じ形で置く。

### 4.3 実行と終了コード

既存の registry 型 profile (`source-doc-lane`) と同じ経路を通る。新しい分岐は足さない。

- 実行は `collectDoctorCheckRun` が行う。選ぶ definition は 8 件だけで、scope `full` の全件へ広げない。実行の順は registry の定義順、結果 (`checkIds` / `checks`) の順は §4.2 の宣言順になる。
- 8 件がすべて OK なら終了コード `0`。1 件でも violation があれば `buildDoctorResult` の `ok` が `false` になり、終了コード `1`。
- profile の指定が `DOCTOR_RUN_PROFILE_IDS` に無ければ、今と同じく `doctor: invalid --profile "<値>" (expected: ...)` を出して終了コード `1`。lock は取らず、check は流さない。expected の一覧には `source-preflight` が載る。
- 別の doctor が lock を持っていれば、今と同じく終了コード `2` で止まり、check は流さない。
- `--json` と `--timing` は既存どおり使える。`--result-file` で書く envelope は `profile` が `null` でないため、CI の vitest fence は消費しない (`src/doctor/result-file.ts` の `profile-set`)。

### 4.4 保証しないこと

- **pre-flight の緑は CI の緑を意味しない**。CI の source lane は全件の doctor・typecheck・全回帰・biome lint を流す。本 profile はその doctor の 8 件だけである。
- 8 件以外の hard gate (`plan-governance`、`pair-freeze`、`design-language` など) の違反は捕まえない。
- 手元の working tree を測るので、未 commit の変更や他レーンの書きかけも結果に入る。merge の判断の根拠にはしない。

## 5. 不変条件

| ID | 不変条件 |
|---|---|
| I1 | `source-preflight` の `outputIds` は `FULL_DOCTOR_OUTPUT_IDS` の部分集合である。CI が流さない check を足さない |
| I2 | 新しい check の論理を足さない。member の check は registry の既存の定義をそのまま呼ぶ |
| I3 | doctor singleton を守る。lock の取得は既存の CLI 経路のまま全 profile に共通で、本 profile だけの迂回路を作らない |
| I4a | 小さい既存 profile (`source-doc-lane`、`source-toolchain`、`consumer-toolchain`、`consumer-setup-smoke`) の check 集合 (`outputIds`) と、consumer 向けの profile 一覧は変えない。この 4 つの集合を契約として持つのは本書であり、L7 が固定値の oracle で常に検査する。固定値は origin/main `09ce4e761` 時点で次のとおりである: `source-doc-lane` = `["readability", "runtime-readability", "rule-drift", "secret-scan"]`、`source-toolchain` と `consumer-toolchain` = `["toolchain-pin", "claude-version-floor"]` (PR #1662、commit `f2d9558e4` が `TOOLCHAIN_DOCTOR_OUTPUT_IDS` に `claude-version-floor` を足した。契約 PR #1663 が固定した `["toolchain-pin"]` は、その 4 分後の #1662 で古くなった)、`consumer-setup-smoke` = `[]`。集合を変えるときは、先に本書のこの行を改訂して著者でない family の review を通し、実装 PR で test の literal を改訂後の文面に合わせる。reviewer は literal を改訂後の文面と照合し、`src/doctor/profiles.ts` の定数とは照合しない |
| I4b | 本切り出しの Green PR は `FULL_DOCTOR_OUTPUT_IDS` と `source-full` の entry を変えない。**unit の oracle では機械検査しない**。`source-full` は check が足されるたびに正規に増える集合なので、固定値を test に持つと定数と同時に書き換える台帳になり、co-edit を止められず、導出できる一覧を手で保守しない原則 (Issue #587) と最小実装の原則にも反する (control の決定)。代わりに Green PR の review で、§8 の受け入れ条件として確かめる |
| I5 | 結果は助言であり、merge の gate (`ut-tdd pr merge`、CI `harness-check`) は本 profile の結果を読まない |

## 6. origin/main で確かめた事実

2026-11-13、origin/main `c3123d000` で確かめた。

- `src/doctor/profiles.ts`: profile は `outputIds` (output id の配列) で check を選ぶ。§4.2 の 8 件はすべて `FULL_DOCTOR_OUTPUT_IDS` にあり、`src/doctor/check-definition-groups.ts` に `full("<id>", ...)` の定義がある。id はどれも §4.2 の表記どおりである。
- `src/cli.ts`: `--profile` の help (673 行) と受理の検査 (708 行) は、どちらも `DOCTOR_RUN_PROFILE_IDS` から組み立てている。新しい id を足しても `src/cli.ts` は変えなくてよい。lock の取得 (731 行) は profile の受理の検査より後、profile の解決と check の実行より前にあり、全 profile に共通である。
- `src/doctor/runner.ts`: registry 型 profile は `profile.outputIds` だけを流し、結果を宣言順に並べる。定義が見つからない id は `missing doctor check result` の violation になる。
- CI: `.github/workflows/harness-check.yml` の source lane は `node src/cli.ts doctor` (全件)、doc lane は `--profile source-doc-lane` を流す。設計文書の変更は source lane に入る。
- 8 件を check 関数で直接流した時間は、この端末で合計およそ 32 秒だった (`code-size` 13 秒、`test-repository-isolation` 6 秒、`doc-split` 4 秒、`oracle-test-trace` 4 秒、残りは各 2 秒以下)。
- `git grep -n "1037" origin/main -- docs` で、#1037 の契約文書はまだ無い。`U-PREFLIGHT` の接頭辞も docs / tests に無い。

## 7. 実装の要点 (Green PR で変えるファイル)

- `src/doctor/profiles.ts`: `DoctorRunProfileId` と `DoctorRunProfile` の union に `source-preflight` を足す。`SOURCE_PREFLIGHT_OUTPUT_IDS`、`DOCTOR_RUN_PROFILES` の entry、`DOCTOR_RUN_PROFILE_IDS` の要素を足す。
- 既存の test の固定値を更新する: `tests/doctor.test.ts` (profile id の一覧、source の profile 一覧、`sourceOnly` の profile 一覧) と `tests/cli-surface.test.ts` (`--profiles --json` の一覧、未知の profile の message の expected 一覧)。どちらも共有のテストなので、他の PR と並行させない。
- 候補 oracle の Red は別の test file に先に入れ、Red の PR には production の変更を入れない。前提 (登録) を要する oracle の扱いと、本来の理由で落ちることの確かめ方は L7 §6 が定める。Green で全件が走って緑になったとき、正式 ID へ昇格する。
- `src/cli.ts`、`src/doctor/runner.ts`、`src/doctor/check-definition-groups.ts`、CI の workflow は変えない。

## 8. 受け入れ条件

- [ ] `ut-tdd doctor --profiles --json` に `source-preflight` が載り、§4.1 の field を持つ。
- [ ] `ut-tdd doctor --profile source-preflight` が §4.2 の 8 件だけを流し、それ以外の check を流さない。
- [ ] member の 1 件が violation のとき終了コード `1`、全件 OK のとき `0`。
- [ ] 未知の profile は終了コード `1` で拒否され、既定の profile の check 集合は変わらない。
- [ ] (I4b、review で確かめる) `git diff $(git merge-base origin/main <head>)..<head> -- src/doctor/profiles.ts` の差分が §7 に挙げた追加だけであり、reviewer が merge-base と head のそれぞれで評価した `FULL_DOCTOR_OUTPUT_IDS` が同じ配列であることを verdict に記録している (手順は L7 §4.2)。
- [ ] L7 の候補 oracle がすべて正式 ID に昇格し、Red → Green → Refactor の順で入っている。

## 9. #1037 に残るもの

- 入口の自動化: pre-push hook か `ut-tdd pr create` の wrapper か。
- 変更した path から check を選ぶ規則 (#1597 の「push の前に、変えた src を参照するテストを洗い出す」と同じ契約にまとめる候補)。
- 赤の理由に、解消する issue / PR の番号を添える表示。
- #1037 の完了条件「新しい L6 文書を足した branch で PR の作成が止まる」は、入口を自動化した後に確かめる。本切り出しでは、著者が手で流せば同じ状況で止まれることまでを満たす。
