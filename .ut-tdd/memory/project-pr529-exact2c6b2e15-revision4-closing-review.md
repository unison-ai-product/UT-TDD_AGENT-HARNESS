---
memory_id: memory:project:pr529-exact2c6b2e15-revision4-closing-review
kind: project
title: "PR529 exact2c6b2e15 revision4 closing review"
tags: ["claude-review", "closing", "issue528", "pr-529"]
updated_at: 2026-09-08T07:40:32.032Z
---

PR #529 の非著者closing reviewを依頼します。
https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/529

exact HEAD: 2c6b2e1591904a790119c5e91aa8071eda87cdbc
Issue #528、親 #424。PLAN-L7-512 / PLAN-REVERSE-512 の正規revisionは双方4。
branch: work/add-feature-issue528-project-memory-envelope
worktree: C:/dev/ut-issue528-project-memory-envelope
worker_model=gpt-5.6-luna、effort=high。rootのローカル検収は非著者closingの代替ではありません。

対象はproject-bound provider envelopeとread/claim guard、Memory/review/hookへの最小配線。
現exact HEADでcanonical snapshot 4 files / 55 passed / skipped 0、reference検証・cleanupを含むexit0を2026-09-08T07:25Zに確認。コマンドは node scripts/run-vitest-snapshot.ts tests/claude-wake-generation-upgrade.test.ts tests/claude-memory-wake.test.ts tests/claude-memory-terminal-gc.test.ts tests/runtime-hook-entrypoints.test.ts --reporter=dot。
同HEADのTypeScriptは2026-09-08T07:24:44.973Zにexit0、変更テストBiome/diff checkも成功。旧9634fdf8からの差分はgeneration-upgradeの2入力をv3から正規v4へ変更したテスト修正のみ。既定legacy denyとreplay/authority失効oracle、履歴fixture bytesは保持。
PLAN revision4に登録された6ce594c2の実測は歴史的証跡として維持し、上記55件の現HEAD実測とは区別する。
CI指摘max-source-paramsはオブジェクト引数化、missing_completed_atは新しい実測時刻で是正。production coding-rules・review-evidence analyzerとPLAN admissionは成功。
production binding guard迂回mutationはU-PMEMROOT-007のproject_idでdeliveredを検出してRed（exit1）。
詳細はdocs/test-design/harness/L7-project-scoped-memory-root-test-design.mdの検収実測節。

Linux/Windows/aggregateとNode generation両OSのfresh CI runは34199292715。送信時とclosing判定時に当該HEADのrequired CIを確認してください。旧34197102250はgeneration-upgrade回帰2件でRedであり、Green証拠には使わない。
初回c5dce6c1の公開履歴はarchive/pr529-c5dce6c1-before-subject-repairへ保存済み。旧requestは現HEADのauthorityへ流用しない。
先行0bd363b3のfence失敗runはGreen根拠に採用していません。
Slice4 migration/dedupe/quarantine/recovery、Slice5 Pack parity、親#424完了は未主張です。
canonical receiptによるclosingをお願いします。rootは最終承認・mergeを行いません。
