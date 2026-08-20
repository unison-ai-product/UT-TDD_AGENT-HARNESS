---
memory_id: memory:project:pack-release-endpoint-audit-at-source-2f3f15af-vs-pack-7e11ec15-flag-pf-1-to-pf-5-have-zero-callers-no-canonical-manifest-anywhere-pack-main-is-6-weeks-stale-and-merged-l6-section-4-names-the-wrong-function
kind: project
title: "Pack release-endpoint audit at source 2f3f15af vs Pack 7e11ec15: FLAG, PF-1 to PF-5 have zero callers, no canonical manifest anywhere, Pack main is 6 weeks stale, and merged L6 section 4 names the wrong function"
tags: ["audit", "flag", "issue-224", "pack", "pf5", "plan-l6-63", "plan-l7-473", "release-endpoint"]
updated_at: 2026-08-19T11:06:26.164Z
---

Pack release-endpoint の Opus read-only 監査。source origin/main = 2f3f15af0e221deff792fc137c6fe2f6c61aad44、Pack main = 7e11ec153322e0d664c2d303a46903e88347d44a (git ls-remote で照合)。**verdict = FLAG (release endpoint 未成立、blocking 4)**。luna は起動しない。ファイル編集 / Issue 起票 / branch / PR / merge は一切行っていない。

## 決定的な実測: PF-1〜PF-5 は **呼び出し元ゼロの島** である

`applySealedReleaseAggregate` を src/ 全体で grep した結果、参照は 2 箇所のみ — 自身の定義 (src/setup/release-aggregate-admission.ts:233) と、src/setup/index.ts:40,51 の **re-export だけ**。CLI からも distribution 経路からも呼ばれていない。

`src/cli/distribution.ts` が setup/index.ts から import しているのは buildCleanDistributionPlan / buildConsumerReadinessPlan / buildPackSyncPlan / cleanDistributionSourcePath / DEFAULT_PACK_REPO / gitAddPathspecCommands / transformCleanDistributionArtifact の 7 個で、**PF-1〜PF-5 の関数は 1 つも含まれない**。`distribution sync-pack` (src/cli/distribution.ts:402) は従来の legacy 経路のままである。

したがって「PF-5 完了」は **source 側 domain code の完成であってリリースではない**。依頼の切り分け (source-side PF-5 completion / Pack propagation / consumer admission) は正しく、実測がそれを裏づける。

## Pack 側の実測 (GitHub contents API、ref=7e11ec15)

- ABSENT: src/schema/release-manifest.ts / src/setup/release-aggregate-admission.ts / src/setup/release-channel-adapter.ts / src/setup/release-materializer.ts / src/setup/release-artifact-resolver.ts / release/manifest.yaml
- PRESENT: src/setup/distribution.ts (legacy のみ)
- **Pack main の HEAD commit 日付は 2026-07-07T07:09:52Z** (msg: "test: add direct doctor runtime-state checks")。source main (2026-08-19) から **約 6 週間 stale**。

source 側にも `release/` ディレクトリ自体が存在しない (git ls-tree 2f3f15af release/ が空)。つまり **PF stack が parse するはずの canonical control manifest がどこにも実在しない**。依頼の前提記述はすべて実測と一致した。

注意 (自己訂正): 最初の presence 判定で `gh api ... --jq '.sha'` の出力有無で判定したところ 404 を PRESENT と誤読した。exit code で判定し直した上記が正しい。

## blocking

- **B-1 canonical control manifest 不在**: PF-1 の `parseCanonicalReleaseManifest` は「正規 manifest path から得た UTF-8 bytes」を入力とする契約だが、その正規 path の実体 (source 側 `release/manifest.yaml` 等) が repo に無い。manifest が無ければ channel 解決も digest identity も起動しない。S2 dogfood の起点がここ。
- **B-2 実行入口の不在**: admitReleaseAggregate / applySealedReleaseAggregate に CLI registrar が無い。tests/cli-distribution-registrar.test.ts は既存 distribution 経路の registrar を対象としており、release aggregate の surface は登録されていない。
- **B-3 Pack propagation 未実行**: Pack main が 6 週間 stale で PF 成果物を 1 つも持たない。`ut-tdd distribution sync-pack` は commit/push しない設計 (CLAUDE.md) なので、伝播は human review を挟む別工程として未実施のまま。
- **B-4 consumer admission の証跡が無い**: 「隔離された 2 消費者製品が同時に走る」ことを示す acceptance 証跡が存在しない。tests/distribution-acceptance.test.ts は存在するが、2 面同時稼働の oracle ではない (buildConsumerReadinessPlan は src/setup/distribution.ts:285 の legacy 経路)。

## 併せて検出した契約の誤り (PR #341 で merge 済の R4 成果物、私の R4 review が見落とした)

merge 済 `docs/design/harness/L6-function-design/release-channel-manifest.md` の §4 は関数を
`buildCleanDistributionPlan(manifest, artifactSet, allowlist) => SealedPlan` と規定し、oracle に U-RELMAN-014/015/016 を割り当てている。しかし:

- `buildCleanDistributionPlan` は **既に main に実在する別関数**であり、署名は `src/setup/distribution.ts:245` の `buildCleanDistributionPlan(input: { paths: string[]; sourceTag?: string; cleanRepo?: string }): CleanDistributionPlan`。同じ barrel (src/setup/index.ts:33-38) から export され、`src/cli/distribution.ts` が現に使用中。
- 一方 U-RELMAN-014/015/016 は L7 test-design (docs/test-design/harness/L7-unit-test-design.md:1910-1912) でも実テスト (tests/release-aggregate-admission.test.ts:94,235,247) でも **`src/setup/release-aggregate-admission.ts`** を対象にしている。実装関数は `admitReleaseAggregate` (同 175 行) である。

つまり **L6 §4 は関数名を取り違えている**。§4 を字義どおり実装すると、CLI が使用中の既存 export と衝突する。実害はまだ無い (§4 の実装者がいないため) が、S2 実装前に必ず訂正が要る。私の #341 R4 closing review はこれを検出できなかった。confirmed 成果物の誤りなので、successor/訂正注記の扱いは PLAN-REVERSE-473 の errata 規律に従って決めること。

## owner / dependency map

- S2 (release manifest + channel domain model、dogfood Pack) = PF-1〜PF-5 として **実装済みだが未配線**。owner PLAN は PLAN-L7-473 (status: draft、S1)。PLAN-REVERSE-473 は R4 confirmed。
- Pack tag/release/revert runbook = **PLAN-L6-63-pack-staged-release-rollback (kind: add-design、status: draft、updated 2026-07-08)** が所有。6 週間動いていない。
- Issue #224 (OPEN) の slice 計画は S1 spec / S2 domain / S3 昇格 gate 結線 / S4 下流一般化。B-1〜B-4 は **S2 の未完部分と S3 の入口**に相当し、**専用の sub-issue は存在しない** (open issue で Pack を含むのは #224 / #134 / #98 のみで、後二者は Bun 退役と snapshot cache であり別軸)。
- 重複確認: PLAN-L7-419 (Forward FSM、draft) / PLAN-L7-436 (Execution Episode、draft、2026-07-15) / PLAN-L7-439 (cross-review merge gate、draft、2026-07-15) はいずれも release channel の成果物を宣言しておらず、**B-1〜B-4 と重複しない**。ただし S3 の「昇格条件の機械束縛」は #224 本文が cross-review receipt を証跡条件に挙げているため、将来 PLAN-L7-439 と接点を持つ。今は着手しないので衝突しない。

## 次の 1 手 (実装は停止したまま)

luna 契約は **出さない**。dependency-cleared な bounded slice が存在しないため。先に必要なのは **#224 直下の S2 完了 sub-issue 1 件と、その pair-freeze** であり、freeze すべき内容は:

1. canonical control manifest の **実 path と schema 実体** (source 側に checked-in する path、Pack 側に配置される path、両者の関係)。PF-1 の契約が参照する「正規 manifest path」を実体化する。
2. **実行入口の契約**: admitReleaseAggregate → applySealedReleaseAggregate を呼ぶ CLI surface 名、dry-run / apply の分離、既存 `distribution sync-pack` との責務境界 (置換か併存か)。
3. **L6 §4 の関数名訂正** (上記)。実装前に必須。
4. **consumer admission の受入証跡の定義**: 「隔離された 2 消費者製品が同時に走る」を機械で示す oracle (どの fixture、どの isolation 境界、何を以て同時稼働とするか)。件数やテスト名の存在を証拠にしない。

受入証跡として最低限必要なもの: 実 manifest を入力にした admit → apply の end-to-end 実測、Pack repo に成果物が到達したことの SHA、消費者 2 面の同時稼働 oracle green。**これらが揃うまで「リリース」と呼ばない。**
