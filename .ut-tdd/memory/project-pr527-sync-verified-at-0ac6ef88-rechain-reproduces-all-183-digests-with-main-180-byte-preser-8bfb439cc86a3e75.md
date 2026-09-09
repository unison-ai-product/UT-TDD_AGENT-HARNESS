---
memory_id: memory:project:pr527-sync-verified-at-0ac6ef88-rechain-reproduces-all-183-digests-with-main-180-byte-preserved-ci-5-5-pass-opus-non-author-closing-review-remains--58b17ad8ee7c
kind: project
title: "PR527 sync verified at 0ac6ef88: rechain reproduces all 183 digests with main 180 byte-preserved, CI 5/5 pass; Opus non-author closing review remains"
tags: ["claude-owned", "issue-439", "ledger", "pr-527", "rechain", "verification"]
updated_at: 2026-09-08T12:23:08.407Z
---

PR #527 の同期後検証 (Claude、2026-09-08)。root の author-side rechain (memory
pr527-current-main-synchronization-pushed-at-0ac6ef88-claude-verification-handoff) を受けて実施した第一段。

## 台帳 rechain の独立検証: 主張どおり (Claude 再計算)

exact HEAD `0ac6ef88c42026c60cd94d5ed853da15f4c3c997` の
`docs/governance/plan-admission-receipts.json` を kernel の canonical 式
(`trackedReceiptRecordDigest`、`src/kernel/github-closure-receipt.ts:158-176`) で全件再計算した結果:

- records 183 (main 180 + PR 3)
- `record_digest` の mismatch **0 件**、chain 断裂 **0 件**
- main の 180 records は **順序ごと byte 保存** (command_id / receipt_id / receipt_digest / decision_digest /
  binding と record_digest まで完全一致)
- 追加 3 件は PLAN-L7-518 rev2 / PLAN-REVERSE-518 rev2 / PLAN-L7-518 rev3 (PR 固有 record と一致)
- projection sha256 `534fb65503b20059f007cd88d9da3b4ce40758375494c07777ac83ae14f7000a` は root 申告値と一致

つまり #539 と同型の変換 (sequence / previous_record_digest / record_digest のみ再計算) であり、
receipt payload の改変も手書き mint も無い。

## 必須 CI: exact HEAD で 5/5 pass

`harness-check` / `harness-check-linux` / `harness-check-windows` / `node-generation-linux` /
`node-generation-windows` すべて pass。

## 残タスク (次セッション)

- PLAN lint / doc validation を exact HEAD で実行 (CI の doc lane は通っているが、明示実行の証跡を取る)。
- **非著者 canonical closing review を `ut-tdd codex --role blind-reviewer` で依頼** … ただし #527 の著者は
  Codex family (root) であるため、非著者は **Claude family** となる。よって
  `ut-tdd claude --role blind-reviewer --review-pr 527 --review-head 0ac6ef88… --review-author-family codex`
  で Opus に依頼するのが正しい経路 (root の依頼文は「canonical non-author closing review」であり family 指定は
  この向きになる)。旧 head 41ff556d 系 receipt は流用しない。
- merge は verdict PASS 受領後に `ut-tdd pr merge --pr 527` のみ。root は承認・merge しない。
