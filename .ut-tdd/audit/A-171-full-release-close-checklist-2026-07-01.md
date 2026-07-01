# A-171 - Full Release Close Checklist

- **date**: 2026-07-01
- **scope**: local close / Pack-ready 後に full public / production release close へ進むための外部・人間境界 checklist。
- **baseline**: source / Pack worktree clean、`status --json` は active draft `0`、open defers `0`、non-terminal L7 `3` はすべて `versionUpParked`。
- **release target**: `unison-ai-product/UT-TDD_AGENT-HARNESS-Pack` `v0.1.3`

## Local Preconditions

これらは local close 側で充足済み。

- `bun src\cli.ts doctor --strict-green-command-digest` が pass。
- `bun src\cli.ts db rebuild --json` が `ok=true`。
- source `harness-check` CI が pass。
- Pack main / Pack release assets は clean artifact set 由来。
- Pack `v0.1.3` Release には `v0.1.3.tar.gz`、`v0.1.3.tar.gz.sha256`、`v0.1.3.manifest.json` がある。
- Pack `.sig` は未公開であり、full release close の未充足境界として残す。

## External Close Checklist

| Boundary | 実行者 | 必要操作 | 必要証拠 | Close 更新先 |
|---|---|---|---|---|
| signed tarball signature | PO / release operator | approved signing key/tool で `v0.1.3.tar.gz.sig` を作成し、GitHub Release asset として公開する | signing command、署名ファイル hash、`gh release view` asset 一覧、signature verification result | A-143 `clean-distribution-package` / `release-publication-boundary` |
| PO / user UAT | PO / user | Pack release を実 consumer candidate で確認し、accept / reject を明示する | UAT 対象 repo、実行日時、受入結果、reject 時の finding / follow-up PLAN | A-143 `l11-uat-boundary` / `l12-release-acceptance-boundary` |
| real consumer tag-pin update | release operator | 既存 consumer を `v0.1.3` から承認済み target へ tag-pin 更新し、`setup --dry-run` と `setup --solo` を実行する | before/after tag、dry-run output、managed paths diff、consumer `doctor --setup-smoke` | A-143 `version-up-nonbreaking` |
| rollback acceptance | release operator / PO | consumer で update 前状態へ rollback できることを確認する | rollback command、restored paths、post-rollback smoke result | A-143 `version-up-nonbreaking` / `l13-post-deploy-boundary` |
| post-release telemetry | release operator | 実 consumer 利用後の hook/session/setup-smoke/feedback evidence を採取する | `feedback_events` / hook telemetry / issue findings / no red gate summary | A-143 `l13-post-deploy-boundary` / `l14-ops-feedback-boundary` |

## Non-Goals

- local test green だけで UAT / post-release close を代替しない。
- unsigned `.sig` placeholder を作らない。
- source repo の dogfood docs / `.ut-tdd` / DB を Pack に混ぜない。
- Pack tag / Release の公開済み履歴を破壊的に書き換えない。

## Current Judgement

この checklist の全 boundary が evidence 付きで埋まるまで、goal 全体は full release complete ではない。現状態は **local L10-L14 close / Pack-ready complete**、かつ **full release close external/human required** である。
