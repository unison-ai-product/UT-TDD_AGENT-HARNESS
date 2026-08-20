---
memory_id: memory:feedback:pr-315-ec02fc12-flag-blocking-1-validsymlink-backslash-target
kind: feedback
title: "差し戻し通知: PR #315 (ec02fc12) FLAG blocking 1 — validSymlink が backslash target を素通し"
tags: ["cross-review", "flag", "pr-315"]
updated_at: 2026-08-14T03:58:37.392Z
---

Claude non-author closing review @ exact HEAD ec02fc12912a7c8f5c0a3fcd54e5832fc0e753f3: FLAG blocking 1 / non-blocking 6。CI run 31766555136 は 3 job 全 pass / CLEAN で、手元実測と CI に乖離なし。

blocking: src/setup/release-materializer.ts:64-82 validSymlink() が backslash 形式の symlink target を fail-close させない。probe 実測で target '..\..\..\outside' と '..\outside' と '\x' がいずれも ACCEPTED (期待は typed invalid)。一方 '\?\C:\x' '\server\share' 'C:' 'c:x' は rejected。freeze L111-113 は絶対 path / drive / UNC / Pack root 外へ出る target の typed invalid 拒否を要求している。実装自身が /^[A-Za-z]:/ と startsWith(backslash x2) という Windows 固有形式を明示実装しており POSIX 限定の読みは成立しない。destination 側は :52 で backslash を全面拒否しており target 側だけ非対称。oracle の穴であり環境差ではない — tests/release-materializer.test.ts:242-250 の it.each に backslash traversal と単一 backslash absolute のケースが無い。PF-5 (CANDIDATE-RELMAN-017) は staging fault 注入が責務で symlink target 検証を持たないため穴は下流に残る。

是正: validSymlink() で backslash を含む target を正規化して root escape / absolute 判定に載せる (または destination 側と同様に全面拒否)。併せて U-RELMAN-011 の symlink it.each へ '..\..\outside' と '\x' を追加。POSIX 限定の読みを採るなら C:/UNC check の存置理由の明記と oracle 行追加が必要。

non-blocking 6: excluded entry に unsupported mode 検査が及ばない / テスト digest ヘルパが実装と同一式の同語反復 (ただし :154-156 の literal golden があり framing mutant は kill されるため oracle 成立) / :142 の同一 source 重複拒否が freeze より厳格な独自追加で oracle 行に無い / symlink target の lone surrogate が U+FFFD へ黙って置換され accept (destination 側は拒否で非対称) / validPath と validSymlink の backslash 扱いの内部非一貫 / :157 の防御コピーが冗長 (M18 は等価変異)。

freeze 遵守を実測確認した項目: artifact 空間起点写像 / workflow content mode が template source 由来 (M9 kill) / control manifest 明示除外コードが実在 (M1 kill、synthetic plan で allowlist 到達時を pin しており偶然依存でない) / version token 完全一致 / dedupe 前衝突検出 (M2 kill) / 範囲外遵守 (fs network git CLI の import 0) / PF-3-5 candidate は RED 維持 / 返却値 immutability (M8 kill)。

実測: snapshot 28 passed / tsc 0 / biome 0 / plan lint 872 / gate 直呼び 5 種 ok / mutation 18 件中 17 KILLED (survive 1 は等価変異)。是正後の新 exact HEAD で Claude が delta 再レビューする。verdict 全文: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/315
