---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_secret
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-01-function-spec.md
---

# L6 機能設計: secret

> **L6 contract marker**: `SECRET_PATTERN` と `isSecretLike` は unit-test 粒度の contracts とする。DbC pre/post/invariant は §2-§3、L7 oracle family は U-SECRET-001..005。

## §1 概要

`secret` module は、memory / projection / audit / search など複数 module が共有する secret-like token の一次検出 guard である。依存を持たない正規表現ベースの薄い module として、低レベル module が state-db などに循環依存せず同じ pattern を使えるようにする。

本 module は網羅的 credential scanner ではない。既知 prefix の narrow guard として使い、広範な検出は別 scanner の責務とする。

> **非共有の明示 (PLAN-L7-459 M12)**: `session-log` module の `sanitize()`
> (`src/runtime/session-log.ts`) は本 module の `SECRET_PATTERN`/`isSecretLike` を共有しない
> **意図的な独立実装** (session-log は fail-open hook 経路であり、低レベル依存を増やさない)。
> `SECRET_PATTERN` を拡張する際は session-log 側 sanitize の追随要否を個別に判断すること
> (自動では追随しない)。統合するかは refactor 候補として別途判断。

`PLAN-L6-62` 以降、広範な検出は `secret-scan` lint family の責務として本書に同居させる。
これは既存 `SECRET_PATTERN` / `isSecretLike` を拡張して巨大化するものではなく、docs / audit / memory /
Pack 配布物を対象にした別契約である。検出系は L4 security slot の方針に従い、検出器の都合で対象範囲や
例外を暗黙生成してはならない。

## §2 IF 契約

| 関数 | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `SECRET_PATTERN` | SECRET_PATTERN: RegExp | なし | `sk-` / `ghp_` / `github_pat_` / `xox[baprs]-` 系の長い token に match する | 定数。runtime state に依存しない | U-SECRET-001 |
| `isSecretLike` | isSecretLike(value: string) => boolean | `value` は任意文字列 | pattern に match すれば `true`、それ以外は `false` | 純関数。副作用なし、例外を投げない | U-SECRET-002 |
| `analyzeSecretScan` | `(artifacts: SecretScanArtifact[]) => SecretScanResult` | artifact は path/text を持つ active prose/runtime/distribution surface | AWS access key、GitHub token、private key block、Bearer token、password/credential 直書きを marker/line 付き violation にする | 純関数。dummy/placeholder/redacted 明示行は例外扱い | U-DOCSECRET-001..003 |
| `loadSystemSecretScanArtifacts` | `(repoRoot) => SecretScanArtifact[]` | repoRoot は UT-TDD source checkout | `docs/`、root canonical docs、`.ut-tdd/audit`、`.ut-tdd/handover`、`.ut-tdd/logs`、`.ut-tdd/memory` の active text artifact を収集する | vendor/archive 由来の歴史資料は通常 scan band に入れない | U-DOCSECRET-004 |
| `checkSecretScan` | `(repoRoot) => LintResult-like` | doctor full profile から呼ばれる | artifact 読込不能または violation>0 なら fail-close | doctor hard gate。warning ではない | U-DOCSECRET-005 |
| `distribution secret preflight` | `artifactPaths -> analyzeSecretScan` | clean Pack materialize 前 | `sync-stage` / `sync-pack` / `package` は copy/prune/tar 前に scan し、violation があれば成果物生成を止める | 人間承認でも秘密混入を配布してよい例外にはしない | U-DOCSECRET-006 |
| `pre-push widened scan` | `runSecretScanDiff(repoRoot, entries: {sha,path}[], mode, readBlob)` (`scripts/git-hooks/secret-scan-diff.ts`) | `git config core.hooksPath scripts/git-hooks` で有効化した pre-push が、push される commit 群それぞれの (sha, path) ペアを渡す (working tree ではなく各 commit 時点の blob を対象にする — 途中 commit で追加され後続 commit で削除される secret を working tree のクリーン化で bypass させないための設計、blind review 指摘反映 2026-07-13) | `analyzeSecretScan` を再利用し、docs/・`.ut-tdd/audit`・`.ut-tdd/logs`・`.ut-tdd/memory` を含む widened surface (3 パターン限定を撤廃) の credential marker を、各 (sha, path) の `git show <sha>:<path>` blob 内容から検出する。旧 pre-push (helix 世代、untracked) の PII 正規表現 (電話番号/郵便番号/email/internal URL) は後退させず併存する | 初回導入は warn-only が既定。`UT_TDD_PRE_PUSH_SECRET_SCAN_MODE=fail-close` でのみ fail-close へ昇格する。widened surface 外 (`src/` など) は対象外のまま | U-DOCSECRET-007 |

## §3 失敗方針

- module 自体は throw しない。fail-close / fail-open の判断は caller が行う。
- memory authoring など永続化 surface では `isSecretLike` の `true` を fail-close として扱う。
- 未知形式の credential は false になる可能性があるため、網羅的 scan の代替として扱わない。
- `secret-scan` は doctor / distribution の呼び出し点で fail-close とする。scan 対象の読込不能も
  「検査できないので通す」ではなく violation として扱う。
- 例外は dummy / placeholder / redacted / fixture / test-only 等が同一行に明示された場合に限る。
  例外は実秘密値の保存許可ではなく、テスト用・説明用であることを機械判定可能にするための記録である。

## §4 エッジケース

| # | ケース | 期待挙動 | oracle |
|---|---|---|---|
| 1 | 空文字列 | `false` | U-SECRET-001 |
| 2 | `sk-` prefix かつ十分長い token | `true` | U-SECRET-002 |
| 3 | `ghp_` / `github_pat_` / `xox[baprs]-` family | `true` | U-SECRET-003 |
| 4 | prefix はあるが短い | `false` | U-SECRET-004 |
| 5 | 長文中に token が埋め込まれる | 部分 match で `true` | U-SECRET-005 |
| 6 | docs に AWS access key / GitHub token / private key block / Bearer token / password 直書きがある | `secret-scan` violation | U-DOCSECRET-001 |
| 7 | dummy / placeholder と明示された説明行 | violation なし | U-DOCSECRET-002 |
| 8 | `.ut-tdd/memory` / audit / handover に secret-like payload が混じる | `secret-scan` violation | U-DOCSECRET-004 |
| 9 | Pack 配布対象に secret-like payload が混じる | materialize 前に distribution command が blocked | U-DOCSECRET-006 |
| 10 | pre-push が渡す (sha, path) 群に widened surface 外 (例: `src/`) の path が含まれる | scan 対象から除外する (widened surface のみ検査) | U-DOCSECRET-007 |
| 10b | 同一 push 内で先行 commit が secret を追加し後続 commit が working tree 上だけクリーン化する | 先行 commit の blob 時点で violation を検出する (working tree の状態に影響されない) | U-DOCSECRET-007 |
| 11 | pre-push の widened surface に credential/PII marker があり、mode が既定 (warn) | violation を報告するが push は継続する (exit 0) | U-DOCSECRET-007 |
| 12 | 同条件で `UT_TDD_PRE_PUSH_SECRET_SCAN_MODE=fail-close` | push を止める (exit 1) | U-DOCSECRET-007 |

## §5 検証接続

L7 unit-test design の U-SECRET-* / U-DOCSECRET-* が本 doc の contract を検証する。
`tests/memory.test.ts` / `tests/projection-writer.test.ts` / `tests/search-feedback.test.ts` は narrow guard の回帰 fence、
`tests/secret-scan.test.ts` と distribution CLI tests は広域 scanner / 配布前 fail-close の回帰 fence、
`tests/secret-scan-diff.test.ts` は pre-push widened scan (credential 再利用 + 温存 PII regex + warn/fail-close mode) の回帰 fence になる。
