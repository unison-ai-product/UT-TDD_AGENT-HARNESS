---
memory_id: memory:feedback:pr-317-51a373e0-flag-blocking-1-partial-clone-promisor-lazy-fetch-network-0
kind: feedback
title: "差し戻し通知: PR #317 (51a373e0) FLAG blocking 1 — partial clone の promisor lazy fetch が network 0 契約を素通り"
tags: ["cross-review", "flag", "pf-3", "pr-317"]
updated_at: 2026-08-14T05:35:00.375Z
---

Claude non-author closing review @ exact HEAD 51a373e0f0e3548f79161392999455c65d68e2c6: FLAG blocking 1 / non-blocking 4。CI run 31771889984 は 3 job 全 pass / CLEAN だが、blocking A-1 は CI では原理的に検出できない型である (CI 環境は full clone のため promisor 経路に入らない)。本 PR 内の追記で解消可能で close 不要。

blocking A-1: 実コードの既存欠陥ではなく本 PR が freeze する取得方式契約そのものの穴である (src/setup/release-artifact-resolver.ts は tree に未存在)。master PLAN-L7-473 決定 5 と AC-7 は object 不在時に network fetch も現在 tree からの再構成もせず unavailable で fail-close することを要求する。本 PLAN の証明手段は :99-102 の禁止 argv 列、:118-121 の import 境界 + command allowlist の source-level oracle、:134 の injected reader、:144-145 の静的 import と argv 検査。しかし実測 (git 2.52.0.windows.1、使い捨て repo) で以下を観測した。入力は git clone --no-checkout --filter=blob:none による blobless partial clone で、commit は local にあり blob 0f137e12 は local に無い。観測 1: GIT_NO_LAZY_FETCH=1 git cat-file blob 0f137e12 は fatal bad file (local 不在の確認)。観測 2: 契約どおりの許可 argv git cat-file blob 0f137e12 (PLAN:90 の形そのまま、禁止 argv 0、node network client 0) が hello-artifact-bytes を exit 0 で返し、直後の GIT_NO_LAZY_FETCH=1 git cat-file -e が成功した = blob が wire 越しに取得され local に落ちた。つまり argv allowlist + import 境界 + injected reader は git 内蔵の promisor lazy fetch を原理的に観測できない。反駁の試みはすべて失敗した (観測 2 は Git command 成功 + 許可 argv + network 発生のため :74 の失敗時 unavailable でも潰せない)。GIT_NO_LAZY_FETCH / remote.promisor / partial-clone 検出は PLAN 全 160 行に grep 0 件。是正は 2 点: (1) git 呼出し env に GIT_NO_LAZY_FETCH=1 を固定する (または promisor 無効化)、(2) oracle 3 に実 blobless partial clone fixture で unavailable を追加する (injected reader では代替不能)。

non-blocking 4: A-2 pair-freeze なのに pair artifact を 1 行も更新しておらず test-design:1872 の CANDIDATE-RELMAN-012 行に PLAN-L7-487 参照が無い (PF-2 の freeze commit 21e3efa8 は同表を触って PLAN-L7-486 引用と mutation 列拡張を入れており水準未達、4 gate は ok=true で機械の視野外)。A-3 isolation 方式が master 文言 (isolated temporary tree/archive) から乖離し erratum 無しで二読みが残る (昇格 oracle は tree を要求しないため blocking ではない)。B-1 :76-77 の失敗分類が第一選言に対して意味を成さない (:96 で部分解消)。B-2 blob サイズ / binary stdout 捕捉境界が契約にも 8 群 oracle にも無く、静かに切り詰まると digest が変わる。

反駁済み: PF-4/PF-5 との oracle 所有交錯なし / PF-2 責務侵食なし / 型不整合なし (ReleaseSourceEntry・ReleaseEntryMode・ReleaseIdentity すべて一致、翻訳の発明不要) / tracked tree 全件で常に invalid_distribution_plan は不成立 / 並行競合なし / PLAN filing 規律適合 (plan lint OK 876)。

実測: diff 1 file +160 (docs-only) / plan lint OK / doctor gate 直呼び 4 種 ok / partial clone 実験 / grep 突合。verdict 全文: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/317#issuecomment-5289877563 。A-1 の 2 行追記を求める。同 PR で A-2 と A-3 も閉じれば PF-2 freeze と同水準になる。是正後の新 exact HEAD で Claude が delta 再レビューする。
