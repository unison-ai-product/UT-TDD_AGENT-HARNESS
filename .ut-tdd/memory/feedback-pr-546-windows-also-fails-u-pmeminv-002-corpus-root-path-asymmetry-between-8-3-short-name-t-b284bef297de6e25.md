---
memory_id: memory:feedback:pr-546-windows-also-fails-u-pmeminv-002-corpus-root-path-asymmetry-between-8-3-short-name-temp-fixture-and-long-name-implementation-plus-the-module-cycle--8f371a85fc79
kind: feedback
title: "PR #546 windows also fails U-PMEMINV-002: corpus root path asymmetry between 8.3 short name (TEMP fixture) and long name (implementation), plus the module cycle"
tags: ["ci", "issue544", "path-normalization", "pr546", "windows"]
updated_at: 2026-09-09T02:44:50.569Z
---

## 追報: Windows は 2 件失敗しており、2 件目は Windows 固有 (head 5737752d)

先の報告は linux job だけを見たもので不完全でした。訂正します。`harness-check-windows`
(job 102317... / 102315280243) は **Test Files 2 failed** です。

```
FAIL tests/dependency-drift.test.ts > U-DEPD-005: real repo module graph has no cycle
FAIL tests/project-memory-migration.test.ts > U-PMEMINV-002 retains every conflict variant without selecting a winner
```

1 件目は既報の `memory -> runtime -> memory` 閉路 (linux の doctor `dependency-drift` と同一根)。
**2 件目は未報告の別問題で、Windows でのみ再現します** (linux job では tests は通り doctor で止まっている)。

### U-PMEMINV-002 の実体 (`tests/project-memory-migration.test.ts:90`)

```
AssertionError: expected [...] to deeply equal [...]
- "C:/Users/RUNNER~1/AppData/Local/Temp/ut-memory-migration-QY6OnL/linked"   (expected)
+ "C:/Users/runneradmin/AppData/Local/Temp/ut-memory-migration-QY6OnL/linked" (received)
```

`.ut-tdd/memory/a.md` / `b.md` / `c.md` の 3 行すべてで、期待値が **8.3 短縮名** (`RUNNER~1`)、実測が
**長い名前** (`runneradmin`) になっています。値の中身 (どの corpus のどの entry か) は一致しており、
差は corpus root path の表現だけです。

つまり fixture 側 (`mkdtemp` 由来の `TEMP` = 短縮名) と実装側 (topology / root 解決の過程で長い名前へ
正規化される) でパス表現が非対称になっています。Windows の `TEMP` は既定で 8.3 短縮名を含むため、
runner だけでなく短縮名を持つローカル環境でも再現しうる **実装/契約の欠陥**であって、CI 固有のノイズでは
ありません。

### 参考: 同種事象の既存教訓

`.ut-tdd/memory/feedback-pr-300-re-review-flag-2nd-windows-path-form-governance-silent-fail-open.md`
(PR #300 の 2nd review) が同じ「Windows path 表現の非対称が silent fail-open を生む」系の指摘です。
`normalizeTopologyPath` を通す側と通さない側が混在していないかを確認するのが早いと思われます。

比較対象を片方の OS だけで判定したのは私の手落ちです。以後 CI 診断は両 OS の job を突き合わせます。
