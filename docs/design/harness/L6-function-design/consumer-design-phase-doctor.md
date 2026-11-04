---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_consumer_design_phase_doctor
pair_artifact: docs/test-design/harness/L7-consumer-design-phase-doctor-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1527
---

> **L6 contract marker**: 設計フェーズの consumer を CI で検査する doctor profile `consumer-design-phase` と、実装前の `consumer-toolchain` を「対象外」にする規則の契約である (未実装の目標契約)。新しい公開名は profile id `consumer-design-phase` と結果状態 `not-applicable` だけである。oracle (`CANDIDATE-U-CDPD-001`〜) は `docs/test-design/harness/L7-consumer-design-phase-doctor-test-design.md` が固定する。

# consumer 設計フェーズ doctor profile — 関数設計 (issue #1527)

## 1. 目的

consumer の実運用で観測した欠陥は次のとおりである。

- consumer 向けの CI gate が `doctor --setup-smoke` だけで、設計フェーズの gate (G1〜G3 の trace、layer-pair / pair-freeze) を CI で回せない。合否を人手で見ている。
- full `doctor` は source repo 向けで、consumer では赤が確定する。
- `src/` も `package.json` も無い実装前の consumer で、`consumer-toolchain` が赤になる。

本書は、設計フェーズの consumer が CI で設計 gate を回せる profile と、実装前の toolchain 検査の扱いを凍結する。G1 / G3 の ID 接頭辞と必須文書の欠陥 (#971、#972) は `consumer-trace-gates.md` の範囲であり、本書では参照するだけで扱わない。

## 2. 前提 (実測)

| 前提 | 根拠 |
| --- | --- |
| profile は `DoctorRunProfileId` の union と `DOCTOR_RUN_PROFILES` で定義され、consumer 向けは `consumer-toolchain` (`outputIds` は `toolchain-pin` だけ) と `consumer-setup-smoke` の 2 つである | `src/doctor/profiles.ts:3-8`、`:156`、`:192-208`、`:213-218` |
| `--profile <id>` は `DOCTOR_RUN_PROFILE_IDS` で検証され、未登録 id は拒否される | `src/cli.ts:751`、`:785-788` |
| `consumer-toolchain` は doctor check `toolchain-pin` だけを回し、生成 workflow 系の node 実行観測が `doctor --profile consumer-toolchain` を呼ぶ | `src/doctor/check-definition-groups.ts:199`、`src/cli.ts:3414` |
| 生成 workflow の consumer CI gate は `doctor --setup-smoke` だけである | `src/setup/templates.ts:447-452` |
| `pair-freeze` は full 専用の doctor check である | `src/doctor/check-definition-groups.ts:147` |
| G1 / G2 / G3 は `ut-tdd gate <id>` から `evaluateStaticGate` を経て評価され、G1 / G3 の trace は consumer 分岐を持つ | `src/cli.ts:2760`、`src/gate/static.ts:256-274`、`consumer-trace-gates.md` §2 / §3 |
| V-model の設計・テスト設計の root は `resolveVModelRoots(repoRoot)` が決める (harness layout 優先、無ければ consumer の `docs/` 直下) | `src/shared/design-root.ts:26-31` |

## 3. profile `consumer-design-phase` (凍結点 1)

- id は `consumer-design-phase`、`audience: "consumer"`、`sourceOnly: false` (consumer-safe) とする。`consumer-toolchain` と同じ `invocation: "registry"` で、`--profile consumer-design-phase` で選べる。`--profiles` の一覧にも出す。
- 実行する検査は次の 4 つだけである。
  1. vmodel pair-freeze (doctor check `pair-freeze`)。
  2. G1 の静的 gate。
  3. G2 の静的 gate。
  4. G3 の静的 gate。
- 2〜4 は `ut-tdd gate G1|G2|G3` と同じ評価 (`evaluateStaticGate`) を使い、consumer 分岐は `consumer-trace-gates.md` の契約に従う。新しい gate 実装は作らない。
- 読む root は `resolveVModelRoots(repoRoot)` だけで決める。`src/`、`package.json`、`harness.db`、PLAN corpus を要求しない (§5)。
- 適用判定: gate が読む入力層 (G1 は L1、G2 は L2、G3 は L3) の設計文書が `designRoot` に 1 本も無いとき、その gate は **`not-applicable`** と報告する。pass にも fail にもしない。入力層の文書が 1 本でもあれば通常どおり評価し、違反は fail にする。
- pair-freeze は、設計文書が存在する層の対だけを検査し、違反があれば profile 全体を fail にする。設計文書が `designRoot` に 1 本も無いときは、pair-freeze も `not-applicable` とする。
- profile は、1 つでも fail があれば fail (exit 1)、fail が無ければ exit 0 とする。`not-applicable` は exit code を変えないが、§6 に従い常に可視にする。

## 4. `consumer-toolchain` の実装前判定 (凍結点 2)

実装の有無は、`repoRoot` 直下だけを見て次のとおり決める。

| 状態 | 判定 |
| --- | --- |
| `src/` がディレクトリとして存在する、または `package.json` がファイルとして存在する | 実装あり。toolchain 検査は現状どおり実行し、結果 (pass / fail) をそのまま報告する |
| `src/` も `package.json` も存在しない | 実装前。toolchain 検査は実行せず `not-applicable (実装前)` と報告する |

- 判定は「どちらか 1 つでも存在すれば実装あり」である。両方無いときだけ対象外にする。`src/` が空ディレクトリでも存在すれば実装ありとする (存在だけを見る。中身は見ない)。
- 対象外の理由は固定文言 `実装前` を含める。理由なき対象外を出さない。
- この規則は `consumer-toolchain` だけに適用する。`consumer-setup-smoke` と `consumer-design-phase` の結果状態は変えない。
- `src/` か `package.json` が後から現れたら、次の実行から通常の検査に戻る (状態を保存しない。毎回 `repoRoot` から判定する)。

## 5. 非要件

- `consumer-design-phase` は `src/`、`package.json`、`harness.db` を要求しない。これらが無くても実行でき、有無で結果が変わらない。
- full `doctor` の check を consumer-safe にする拡張はしない (source repo 向けのまま)。
- gate が読む root と見出し規約を `ut-tdd.project.json` で指定する案 (issue の対策案 3) は本書の範囲外である (#676 の B3 と範囲が重なるため、別の契約で判断する)。
- G1 / G3 の ID 接頭辞と必須文書 (#971、#972) は `consumer-trace-gates.md` が扱う。

## 6. 結果の状態と summary (凍結点 4)

- 各検査の結果状態は `pass` / `fail` / `not-applicable` の 3 つとする。`not-applicable` は出力に検査名と理由を必ず表示する。
- summary は `pass` / `fail` / `not-applicable` を別々に数える。`not-applicable` を `pass` の件数に含めてはならない。「全件 pass」と表示してよいのは、`fail = 0` かつ `not-applicable = 0` のときだけである。`not-applicable` が 1 件以上あるなら、その件数を併記する。
- 全検査が `not-applicable` の実行も exit は 0 とするが、summary は「検査された項目なし」を明示する。silent green を作らない。
- JSON 出力 (`--json`) にも同じ 3 状態と理由を出す。

## 7. 生成 workflow への要求 (凍結点 3)

生成する consumer workflow は、setup smoke の step の後に `doctor --profile consumer-design-phase` の step を追加する。生成 workflow 本文そのものは #1522 の契約 PR が変更するので、本書は要求の宣言だけを持ち、workflow の YAML は書かない。実装は #1522 の契約の凍結後に行う。

## 8. DbC

| 区分 | 契約 |
| --- | --- |
| pre | `repoRoot` が読めること。profile id が `DOCTOR_RUN_PROFILE_IDS` に含まれること |
| post | 実行した検査と `not-applicable` の検査が、すべて出力に列挙される。fail が 1 件でもあれば exit 1 |
| invariant | `not-applicable` は pass の件数に入らない。`consumer-design-phase` は `src/` / `package.json` の有無で結果を変えない。`consumer-toolchain` の実装前判定は `repoRoot` 直下の `src/` と `package.json` だけで決まる |

## 9. 単位の契約 (DbC)

本書が定める契約上の関数は次の 2 つである (名前は契約上のもので、実装は `src/doctor/profiles.ts` の既存の profile 定義へ合わせる)。

- `runConsumerDesignPhase(repoRoot) => CheckOutcome[]`: profile `consumer-design-phase` の 4 検査 (pair-freeze、G1、G2、G3) を実行し、各結果を `pass` / `fail` / `not-applicable` で返す (§3、§6)。
- `isPreImplementation(repoRoot) => boolean`: `repoRoot` 直下に `src/` も `package.json` も無いとき真を返し、`consumer-toolchain` を `not-applicable (実装前)` にする (§4)。

- pre: `repoRoot` が読めること。profile id が `DOCTOR_RUN_PROFILE_IDS` に含まれること (§8)。
- post: 実行した検査と `not-applicable` の検査がすべて出力に列挙され、fail が 1 件でもあれば exit 1 (§8)。
- invariant: `not-applicable` は pass の件数に入らない。`consumer-design-phase` は `src/` / `package.json` の有無で結果を変えない (§5、§8)。
- oracle: CANDIDATE-U-CDPD-001〜012 が上記を固定する。
