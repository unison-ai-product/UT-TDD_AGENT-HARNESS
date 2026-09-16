---
memory_id: memory:feedback:pr-319-exact-head-514d8efd-ci-red-3-3-memory-gate-blocking-1
kind: feedback
title: "PR #319 引取 + 差し戻し: exact HEAD 514d8efd CI red 3/3、memory 格納面の構造境界 gate 違反 (blocking 1)"
tags: ["ci-red", "d3a", "flag", "plan-l7-468", "pr-319"]
updated_at: 2026-08-14T07:39:37.298Z
---

# 差し戻し (CI red) — PR #319 / exact HEAD 514d8efd88d05202a965000173a1a63cd39fa7bf

**Verdict: FLAG (blocking 1)** — レビュー本体には入っていません。CI run 31779894105 が 3 job とも FAILURE のため、review 対象 HEAD を固定できず差し戻します。

## Blocking B-1: memory 格納面の構造境界 gate 違反 (両 leg 共通、実バグ)

`tests/memory-service.test.ts:342` (PLAN-L7-468 AC-4 / `MemoryService … confines memory storage access to the memory module and its projection writer`)

```
AssertionError: expected [ …(2) ] to deeply equal []
+ Array [
+   "feedback/live-review-projection.ts",
+   "runtime/claude-memory-wake.ts",
+ ]
```

- linux leg: 1 failed / 3036 passed (run 31779894105)
- windows leg: 同一 assertion が failed (下記 B-2 と併せて 2 failed / 2849 passed)

**検出源**: 本 PR の新規・改修 2 モジュールが memory 正本ディレクトリの literal を直接持っています。

- `src/feedback/live-review-projection.ts:148` — `resolve(input.repoRoot, ".ut-tdd", "memory")` (containment 判定用)
- `src/runtime/claude-memory-wake.ts:245` — `value.memoryPath.startsWith(".ut-tdd/memory/")` (envelope 検証用)

いずれも本文 read ではなく path 検証用途ですが、当該 gate は**用途を問わず literal の出現面を数える fail-close 構造境界**です。テスト本体のコメントがその意図を明示しています:「allowlist で finding を黙らせるのではなく、面が増えたら赤くする構造境界」。

**是正の方向 (方式選択は実装側判断)**:

1. memory 正本 root の解決を `src/memory/` 側の export へ寄せ、2 モジュールはその helper を呼ぶ (literal の出現面を増やさない)。この場合 gate の allowlist は不変で通ります。
2. `ALLOWED_DIR_ACCESS` / `SCAN_ONLY_DIR_ACCESS` を拡張する。ただしこれは gate の設計意図に逆行するため、採る場合は「path 検証のみで本文 parse をしない」ことを `SCAN_ONLY_DIR_ACCESS` と同等の別 assertion で機械的に固定することが前提です (現状の scan-only 判定は `readFileSync` / `parseMemoryFile` の不在を見ますが、`claude-memory-wake.ts` は `readFileSync` を持つため単純追加では成立しません)。

私は 1 を推奨します。2 を採るなら PLAN-L7-468 の境界契約の改訂側の論点になり、本 PR (1 PR = 1 論点) のスコープを超えます。

## B-2 (windows leg のみ、帰責未確定): `U-HOOKEXEC-001`

`tests/hook-native-launcher.test.ts > Claude native Bun hook launcher (issue #123) > U-HOOKEXEC-001: forwards stdin and every argv token unchanged to a native Bun executable` が windows leg のみで failed (999ms)。

本 PR の diff 13 ファイルに hook launcher 関連は含まれず、linux leg では green です。本 PR 起因か既知の windows flaky かは**私の側では未判別**です。B-1 是正後の再 run で再現するかどうかで切り分けてください。再現するなら本 PR で扱い、消えるなら別 issue です。

## 未実施

B-1 が両 leg 共通の実 red であるため、本体レビュー (claim-blind / spec-blind) は着手していません。是正後の新 exact HEAD で全 CI green を確認してから、closing review を実施します。
