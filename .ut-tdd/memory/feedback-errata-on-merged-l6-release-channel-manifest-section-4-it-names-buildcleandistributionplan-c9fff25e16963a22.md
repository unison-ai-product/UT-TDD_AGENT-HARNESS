---
memory_id: memory:feedback:errata-on-merged-l6-release-channel-manifest-section-4-it-names-buildcleandistributionplan-which-is-an-existing-different-function-the-contract-s-real-implementation-is-admitreleaseaggregate
kind: feedback
title: "Errata on merged L6 release-channel-manifest section 4: it names buildCleanDistributionPlan, which is an existing different function; the contract's real implementation is admitReleaseAggregate"
tags: ["errata", "l6-design", "pf5", "plan-reverse-473", "pr-341", "release-channel-manifest", "s2-blocker"]
updated_at: 2026-08-19T11:14:57.634Z
---

merge 済 confirmed 成果物の errata。`docs/design/harness/L6-function-design/release-channel-manifest.md` §4 が関数名を取り違えている。main 2f3f15af0e221deff792fc137c6fe2f6c61aad44 で実測。**S2 実装の前に訂正必須**。

## 誤り

L6 doc §4 (「許可済み配布計画の契約」) と冒頭 DbC 表は関数を

    buildCleanDistributionPlan(manifest, artifactSet, allowlist) => SealedPlan

と規定し、検証 oracle に `U-RELMAN-014` / `U-RELMAN-015` / `U-RELMAN-016` を割り当てている。

## 実測との食い違い

1. **`buildCleanDistributionPlan` は既に main に実在する別関数**である。定義は `src/setup/distribution.ts:245`、署名は

       export function buildCleanDistributionPlan(input: { paths: string[]; sourceTag?: string; cleanRepo?: string }): CleanDistributionPlan

   これは legacy の clean distribution planner であり、`src/setup/index.ts:33-38` から export され、`src/cli/distribution.ts` が現に import して使用している (同 file の import list に buildCleanDistributionPlan が含まれる)。

2. **§4 が割り当てた oracle は別の module を対象にしている**。`docs/test-design/harness/L7-unit-test-design.md:1910-1912` は U-RELMAN-014/015/016 の対象を `src/setup/release-aggregate-admission.ts` と明記し、実テスト `tests/release-aggregate-admission.test.ts:94,235,247` も同 module を叩いている。

3. **その契約の実装関数は `admitReleaseAggregate`** である (`src/setup/release-aggregate-admission.ts:175`、戻り値型 `SealedReleaseAggregatePlan`、`src/setup/index.ts:39-52` から export)。§4 が記述している「三条件を side effect 前に AND 判定し sealed plan を発行する」挙動は admitReleaseAggregate のものである。

## 影響

§4 を字義どおり実装すると、CLI が使用中の既存 export と同名衝突する。現時点で実害は無い (§4 の実装者がまだいない、PF stack は呼び出し元ゼロの島) が、S2 実装に入った瞬間に (a) `distribution sync-pack` を壊すか、(b) freeze に無い rename を実装 PR の中で発明するか、の二択を強いる。後者は「契約に無い方式のその場開発」禁止に抵触する。

## 由来と扱い

この誤りは PR #341 (merge commit 2f3f15af、PLAN-REVERSE-473 R4 backfill) で main へ入った。**Claude の #341 R4 closing review (exact HEAD 19d26a47、PASS) はこれを検出できなかった**。PLAN-REVERSE-473 は R4 / confirmed であり、confirmed 成果物の誤りなので silent overwrite にしない。訂正注記か successor かの選択は PLAN-REVERSE-473 の errata 規律 (CLAUDE.md の PLAN claim discipline、doctor plan-supersession) に従って決めること。

## 最小訂正案

§4 の関数名を `admitReleaseAggregate(input) => ReleaseAggregateAdmissionResult` (sealed plan は `SealedReleaseAggregatePlan`) へ改め、冒頭 DbC 表の該当行も同時に直す。§5 の `applySealedReleaseAggregate` は実在名と一致しているので変更不要。訂正時に L6 doc の他 4 関数名も実在 export と突合すること (parseCanonicalReleaseManifest / resolveReleaseChannel / materializeReleaseArtifacts は PF-1〜PF-2 側の実在名との一致を未確認)。

## 教訓

L6 関数契約 doc の review では、**記載された関数名を repo の実在 export と機械的に突合する**こと。今回は oracle 対応表 (L7 test-design) と実テストが正しい module を指していたので、doc の関数名だけが浮いていた。名前が既存 export と衝突する場合は特に、doc 内の整合だけでは検出できない。

## 追加実測 (2026-08-19、全 5 関数を実在 export と突合した結果)

前記の教訓どおり L6 doc の全関数名を `git grep "export function <name>" 2f3f15af -- src/` で機械的に突合した。**誤りは §4 だけではなく 2 件あった**。

| L6 doc の記載 | 実在 export | 判定 |
|---|---|---|
| `parseCanonicalReleaseManifest` (§2) | **存在しない**。実体は `parseReleaseManifest(input: unknown)` (src/schema/release-manifest.ts:140) | **誤り (2 件目)** |
| `resolveReleaseChannel` (§2) | src/schema/release-manifest.ts:147 | 一致 |
| `materializeReleaseArtifacts` (§3) | src/setup/release-materializer.ts:116 | 一致 |
| `buildCleanDistributionPlan` (§4) | **別関数が実在**。契約の実体は `admitReleaseAggregate` (src/setup/release-aggregate-admission.ts:175) | **誤り (1 件目、既報)** |
| `applySealedReleaseAggregate` (§5) | src/setup/release-aggregate-admission.ts:233 | 一致 |

`parseCanonicalReleaseManifest` の誤りは §4 と性質が異なる: **同名の既存 export が無い**ため衝突は起きず、実装時に「存在しない関数名を新規に作る」形になる。結果として PF-1 の実体 `parseReleaseManifest` と重複した parse 入口が二重に生まれうる。§4 (衝突する) ほど破壊的ではないが、契約と実装の対応が切れる点は同じ。

**訂正は 2 箇所**: §2 の見出しと本文 `### \`parseCanonicalReleaseManifest(input)\`` → `parseReleaseManifest`、§4 の `buildCleanDistributionPlan` → `admitReleaseAggregate`。冒頭 DbC 表の対応する 2 行も同時に直す。§3 / §5 と `resolveReleaseChannel` は変更不要。

補足: Claude の R3 review が引用した `createImmutableManifest` (src/schema/release-manifest.ts:115) と `calculateReleaseId` (同 41) は **module 内部の非 export 関数として実在する**。R3 の記述は正確だが、公開入口ではなく内部実装を指していた。L6 doc が公開契約を書く場所である以上、記載すべきは `parseReleaseManifest` である。

**教訓の更新**: 「doc 内の整合だけでは検出できない」に加えて、**doc の関数名は 1 つ通ったら全部通ると仮定してはならない**。今回は 5 個中 3 個が一致していたため、部分照合で止めていれば 2 件目を見逃していた。全数突合が必要。
