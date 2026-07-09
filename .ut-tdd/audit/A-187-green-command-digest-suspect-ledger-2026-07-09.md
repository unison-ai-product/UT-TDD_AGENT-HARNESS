# A-187 green-command digest suspect 台帳 (2026-07-09)

- 監査種別: PLAN-L7-303 item 3-execute 後の suspect 台帳化
- 基準コマンド: `bun run src\cli.ts plan digest-migrate`
- 実行結果: `795 green_command: recoverable=0 / suspect=22 / already-anchored=773`
- 方針: recoverable は `anchor_commit` 追記で復旧済み。suspect は履歴上どの commit の blob も claimed `output_digest` に一致しないため、`--execute` では変更しない。

## 判定意味

suspect は「捏造」と断定しない。現時点の意味は、`evidence_path` のファイル blob hash としては、履歴全体から `output_digest` を裏取りできない、である。主な候補は次のいずれか。

- `output_digest` にファイル hash ではなくコマンド出力 hash 等を入れた。
- 記録時点の file path / line ending / encoding / 生成物境界が現在の探索経路とずれている。
- evidence file が後から作成・移動・再生成され、git 履歴上の探索対象と一致しない。
- 実証拠が欠損しており、再実行または欠損認定が必要。

## suspect 一覧

| plan_id | evidence_path | 次アクション |
|---|---|---|
| PLAN-L6-48-vmodel-l2-freeze-l5-verification-design | tests/vmodel-forward-freeze-contracts.test.ts | L6/L7 freeze gate 系の同一テスト証跡として再実行証跡を確認 |
| PLAN-L6-59-design-doc-cross-integrity-check | docs/plans/PLAN-L6-59-design-doc-cross-integrity-check.md | PLAN 自己参照 digest の記録意味を確認 |
| PLAN-L6-62-design-doc-secret-scan-gate | tests/secret-scan.test.ts | secret scan test の実再実行で再束ね可否を確認 |
| PLAN-L7-256-model-id-ssot-drift-gate | tests/model-id-ssot-drift.test.ts | model-id SSoT gate の実再実行で再束ね可否を確認 |
| PLAN-L7-256-model-id-ssot-drift-gate | src/team/model-policy.ts | 実装ファイル digest とテスト実行証跡の混同有無を確認 |
| PLAN-L7-256-model-id-ssot-drift-gate | src/setup/templates.ts | 実装ファイル digest とテスト実行証跡の混同有無を確認 |
| PLAN-L7-282-pack-direct-source-only-guards | tests\projection-writer.test.ts | backslash path と記録時点 commit の再確認 |
| PLAN-L7-329-module-l6-design-backfill | docs/plans/PLAN-L7-329-module-l6-design-backfill.md | PLAN 自己参照 digest の記録意味を確認 |
| PLAN-L7-329-module-l6-design-backfill | src/doctor/db-projection.ts | db-projection 変更履歴と記録時点を確認 |
| PLAN-L7-359-consumer-setup-profile-wiring | tests/project-hook.test.ts | consumer setup profile の再実行証跡を確認 |
| PLAN-L7-359-consumer-setup-profile-wiring | src/lint/project-hook.ts | 実装ファイル digest とテスト実行証跡の混同有無を確認 |
| PLAN-L7-360-db-projection-profiling | src/doctor/db-projection.ts | L7-329 と同一ファイルの重複 suspect として合同調査 |
| PLAN-L7-368-design-lint-db-projection | docs/plans/PLAN-L7-368-design-lint-db-projection.md | PLAN 自己参照 digest の記録意味を確認 |
| PLAN-L7-376-consumer-toolchain-template-guidance | docs/templates/adapter/.claude/CLAUDE.md | template file の生成/同期履歴と digest 境界を確認 |
| PLAN-L7-393-vmodel-l2-freeze-l5-verification-gate | tests/vmodel-forward-freeze-contracts.test.ts | L6-48/REVERSE-393 と同一テスト証跡として合同調査 |
| PLAN-L7-405-spec-ir-detector-precision | tests/spec-ir-projections.test.ts | spec-ir detector test の再実行証跡を確認 |
| PLAN-L7-406-stable-id-helper | .ut-tdd/harness.db | DB binary/state artifact を green_command evidence に置いた妥当性を確認 |
| PLAN-RECOVERY-07-design-bottomup-backmerge | tests\mode-catalog.test.ts | backslash path と記録時点 commit の再確認 |
| PLAN-RECOVERY-07-design-bottomup-backmerge | src\schema\mode-catalog.ts | backslash path と記録時点 commit の再確認 |
| PLAN-RECOVERY-07-design-bottomup-backmerge | tests\drive-model-passage.test.ts | backslash path と記録時点 commit の再確認 |
| PLAN-REVERSE-393-vmodel-l2-freeze-l5-verification-gate-backfill | tests/vmodel-forward-freeze-contracts.test.ts | L6-48/L7-393 と同一テスト証跡として合同調査 |
| PLAN-REVERSE-405-spec-ir-detector-precision-backfill | tests/spec-ir-projections.test.ts | L7-405 と同一テスト証跡として合同調査 |

## hard 化前の出口条件

- 上記 22 件が、再実行証跡で正規 digest に置換、記録誤りとして明示是正、または欠損証跡として個別 close されている。
- `bun run src\cli.ts plan digest-migrate` が `recoverable=0 / suspect=0` になる。
- `bun run src\cli.ts doctor --strict-green-command-digest` が実リポジトリで通る。
- その後に PLAN-L7-303 item 4 として、通常 doctor への hard ratchet 接続を判断する。
