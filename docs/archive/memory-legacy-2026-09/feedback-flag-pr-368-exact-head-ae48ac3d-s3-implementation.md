---
memory_id: memory:feedback:flag-pr-368-exact-head-ae48ac3d-s3-implementation
kind: feedback
title: "FLAG PR 368 exact HEAD ae48ac3d S3 implementation"
tags: ["flag", "issue-363", "plan-l7-494", "pr-368", "review-technique", "verdict"]
updated_at: 2026-08-20T12:02:20.089Z
---

Claude (claude-opus-5) が PR #368 (Issue #363 / PLAN-L7-494 S3 promotion rollback gate 実装) の非著者 closing review を exact HEAD ae48ac3d91f4b4b36f824a2ca435e7dbe796ee78 で実施し FLAG (blocking 1) を返した。verdict: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/368#issuecomment-5355590364 merge はしていない。

B-1 (blocking): PLAN-L7-494 の output_digest 2 件が anchor の実 blob と不一致で、これが CI linux 赤の原因である。src/setup/release-promotion-rollback-gate.ts は記載 sha256:4bd37d34 に対し anchor c1a3a67a の実 hash が f3fe31c9、tests/release-promotion-rollback-gate.test.ts は記載 sha256:17d515f6 に対し実 hash が b93cd429。anchor 自体は正しく c1a3a67a は ae48ac3d の祖先で、かつ anchor 時点と exact HEAD 時点でこの 2 ファイルの内容は同一だった。つまり記載 digest が c1a3a67a より前の版で測ったもので、fix(release): separate control and artifact identities で中身を直した後に anchor だけ更新して digest を測り直していない。是正は digest 側を anchor 時点の実 hash へ更新することであり、anchor を digest に合う古い commit へ戻してはならない。証跡が実際にテストを走らせた版を指さなくなる。PLAN-L7-476 にも 1 件 mismatch があるが origin/main に既存で、CI では anchor 解決不能により unverifiable として skip されるため本 PR の責任ではない。

CI の仕組みとして重要な発見を記録する。harness-check.yml:127-129 は node src/cli.ts doctor --strict-green-command-digest で回しており、green-command-digest は CI では advisory ではなく hard gate である。src 側の doc comment は非破壊 advisory と書いているが CI 経路では strict flag が付く。grep で strict flag を探すとき run: >- の折り返しブロックに入っていると 1 行 grep では見つからないので、workflow の該当 step を直接読む。

PASS 側で確認した事実も残す。CANDIDATE-RELMAN 10 件すべてが U-RELMAN へ 1:1 昇格し CANDIDATE は 0 件、ID は 001 から 023 で連番、別 ID の発明は無い。ReviewGateEvidence は派生コピーを作らず ReviewDispatchEntry / MergeGateDecision / MergeGateFacts / ReviewReceiptSource の実型をそのまま束縛する形になり、freeze 段階で私が指摘した 3 点 (decision allow が MergeGateDecision に無い / reason は実は state / evaluatedHeadSha は facts 側) が構造ごと解決した。narrowed literal 型が runtime 検査へ移った分は reviewIsReady が全て埋め、reviewIdentityMatches が facts.headSha と evaluatedHeadSha と d2.headSha と d1.exactHead の同値を要求している。reason precedence は凍結順と完全一致で、missing と mismatch も混ざらない。deny 時 side-effect 0 は vi.fn spy を write/publish/apply へ注入し structuredClone した prior state と突き合わせる形で観測しており、freeze review で私が非 blocking F-1 として挙げた「pure gate に対する write 0 は落ちようがない」が実装で解消されている。U-RELMAN-022 は apply fault と restore fault を同時注入して indeterminate/rollback_failed と restore 呼び出しまで観測する。

非 blocking 2 件: allow の evidenceDigest が JSON.stringify の key 挿入順に依存するので canonical serialization が要る (現状 caller 1 経路で実害なし)。昇格した 10 行が test file を引用列に持たず既存 U-RELMAN 行と書式が違う (oracle-test-trace は逆向きに見るので gate は通る)。
