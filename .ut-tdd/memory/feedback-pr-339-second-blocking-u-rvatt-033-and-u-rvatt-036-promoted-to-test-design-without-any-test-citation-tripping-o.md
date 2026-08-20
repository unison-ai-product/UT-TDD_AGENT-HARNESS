---
memory_id: memory:feedback:pr-339-second-blocking-u-rvatt-033-and-u-rvatt-036-promoted-to-test-design-without-any-test-citation-tripping-oracle-orphan-fail-close
kind: feedback
title: "PR 339 second blocking: U-RVATT-033 and U-RVATT-036 promoted to test-design without any test citation, tripping oracle orphan fail-close"
tags: ["issue-328", "oracle-orphan", "plan-l7-493", "pr-339", "review", "test-design"]
updated_at: 2026-08-19T08:46:51.180Z
---

PR #339 exact HEAD db0b36bbebc30dfc56d0517a86fb010da7aea470 の verdict を更新: FLAG (blocking 2)。run 32233442817 は 3 job すべて fail。Windows は doctor ではなく vitest step 9 で落ちており B-1 とは独立の別要因。

blocking B-2 (新規) = 宣言した oracle 2 件にテスト citation が無く orphan fail-close。Windows leg の失敗は tests/oracle-test-trace.test.ts の 2 件: U-OTT-004 (実 repo の orphan は 0) が expected ['U-RVATT-033','U-RVATT-036'] to deeply equal []、U-OIDGATE-005 (widened baseline は再導出集合と完全一致) が 327 vs 325。Test Files 1 failed / 264 passed、Tests 2 failed / 2925 passed。

実測した citation 数 (PR HEAD の tests 配下): U-RVATT-030=2、031=1、032=1、033=0、034=1、035=1、036=0。test-design へは 030〜036 の 7 件を昇格させたが実装は 5 件しかない。特に U-RVATT-036 は宣言文自身が tests/review-live-cli.test.ts を名指ししているのに当該テストに ID が書かれておらず、宣言と実装が 1 対 1 で結ばれていない。U-OIDGATE-005 の 327 vs 325 も同根 (test-design 側だけ 2 件先行)。

最小是正は 2 択: 案 A (推奨) = U-RVATT-033 / U-RVATT-036 のテストを本 PR で実装し ID を記載する (036 は宣言どおり tests/review-live-cli.test.ts へ)。案 B = この 2 件の test-design 昇格を本 PR から外し実装と同じ PR で昇格させる。案 A 推奨の理由は U-RVATT-033 (stale HEAD / 別 revision / 同族 provider / wrong nonce の拒否) が D3a custody の中核 fail-close 条件であり、実装 review-verdict-custody.ts (+323) には該当ロジックが入っているはずで、テストを欠いたまま進めると「契約は宣言したが検証していない」状態が残るため。

現時点の blocking: B-1 = generates に既存所有 path 11 件、B-2 = oracle orphan 2 件。実装本体の振る舞い判定は両方の是正後 exact HEAD で 3 job green を確認してから行う (現状は doctor と vitest の双方が途中で落ちており後段ゲートの結果自体が無い)。

教訓: test-design への oracle 昇格は「実装済みの ID だけ」を上げる。宣言が実装より先行すると oracle-test-trace の orphan fail-close と baseline 再導出の件数不一致が同時に出る。PLAN-L7-493 §5 手順 3 も「PASS 後に昇格」であり、7 件まとめて上げる根拠は無かった。
