---
audit_id: A-144
plan_id: PLAN-L7-430-task-kind-model-routing-v2
kind: review_test_receipt
created_at: 2026-07-14T19:27:48+09:00
anchor_commit: ddbdc2f9
---

# PLAN-L7-430 review test receipt

- command: `bun test tests/team-model-policy.test.ts tests/team-run.test.ts`
- exit_code: `0`
- result: `52 pass / 0 fail / 178 expect`
- test_files: `2`
- raw_output_sha256: `496ce55c30d58a52d25c009e84551ea179ad65087f2f03b8d2c9abc922166ef0`

このreceiptは、routing本体とteam定義からmodel selectionまでの構造化`intent`配線を
レビュー前に再実行した結果を固定する。`raw_output_sha256`はPowerShell内でコマンドの
標準出力・標準エラーをUTF-8 bytesへ変換して算出した値である。
