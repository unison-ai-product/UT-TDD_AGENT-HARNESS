# PLAN 設計還流 証跡 (slice backflow-s6a、issue #958 / #959)

目的: L6 前半 47 PLAN を、使い捨て可 / 還流済み / 廃止 / 要判断 に区分する。
基準 commit: origin/main `d5ad67fb50c148ea8dd6d5475bab4b88f2d4cd4c`

状態: 途中。処理済み 16 件 (PLAN-L6-00 〜 PLAN-L6-15)。残り 31 件は未処理。

集計 (処理済み 16 件): 使い捨て可 15 / 還流済み 1 (PLAN-L6-00) / 廃止 0 / 要判断 0

| PLAN | blob sha256 (origin/main) | 区分 | 移し先 (path と節) | 剥離した依存 | 備考 |
| --- | --- | --- | --- | --- | --- |
| PLAN-L6-00-master | 901711bde575cd0af7cca682b8a0460ec24eacc46bc85d1ec988eb0aa9a9caf8 | 還流済み | function-spec.md「L6 completion の範囲と inventory」(新設。範囲規則・G6 audit 入力条件・最終完了条件・設計文書 → 所有 PLAN → L7 oracle family の表)。class-design 縮退 / WBS は §3 / §5 に既存 | requires: L5 設計 4 件 (完了済み、剥離)。実在する依存 (L7-unit-test-design の parent_doc と範囲指定が PLAN-L6-00 を指していた) は function-spec へ付け替え | Sol FLAG #1013 を反映。L7-unit-test-design.md の parent_doc と pair-scope addendum の参照を function-spec.md へ変更。DoD 未チェックは stale
| PLAN-L6-01-function-spec | 14b697ebacc481289c08ab3a35e30076b951cf01a2b186cb9e8b91ba0821874b | 使い捨て可 | function-spec.md §1-§5 (既存) | parent/requires: L6-00・L5 設計 (完了済み、剥離) | DoD 未チェック 7 件は §1 signature / §2 pseudocode / §3 型 / §4 IMP-033 / §5 WBS の実在で充足 (grep 確認) |
| PLAN-L6-02-edge-case | aa1f17d7a69390212b61329e99f292d19feea647791cc6ac8b86d2c46e2e5012 | 使い捨て可 | edge-case.md §1-§5 (既存) | requires: function-spec (完了済み、剥離) | 4 観点 edge と U-* trace 方針が実在 (§1 §4)。DoD 未チェックは stale |
| PLAN-L6-03-session-log | 21897229937df6072d99d43dc90a19c6ec31961b31a8e586c3cccc3f57028c6f | 使い捨て可 | session-log.md / L7-unit §1 U-SLOG-001..004 (既存) | なし | 関数 signature・fail-open・圧縮契約・ストレージ・U-ID が設計文書に存在 (grep) |
| PLAN-L6-04-forced-stop-feedback | 810f0e13670484df5575d28d2816e31e56d157a31c77c03d641fe8c656f9f8f6 | 使い捨て可 | forced-stop-feedback.md / L7-unit U-FSF-001..005 (既存) | requires: L6-03 (完了済み、剥離。設計文書は session-log を参照済み) | PO 確定 4 点 (mistake 非記載・自動起票なし・Haiku 分類) は設計文書に既存 |
| PLAN-L6-05-setup-solo-team | e312f59ff788b0d12e871ae09a9c475e43be0f03e77240d0f25bdeb75deb75b1 | 使い捨て可 | setup-solo-team.md / L7-unit U-SETUP (既存) | なし | emit-only・apply-branch-protection・token 非記録・setup.json 正本が既存 |

| PLAN-L6-06-handover-mechanism | 7dad331d8ed53e01950f31fe7125b681e85246dee0a222ad572e70f046edf238 | 使い捨て可 | handover-mechanism.md / L7-unit U-HOVER (既存) | なし | HandoverPointer・CURRENT.json・dry-run 非破壊・TODO(human) placeholder・inferPlanFromCommit が既存 (grep) / PLAN 本文を全文読み直し (FLAG #1013 対応)。出力契約・責務範囲・依存は設計文書に既存、PLAN にだけ残るものなし |
| PLAN-L6-07-agent-slots | 444220a50b3fb9ebc3c6c846b7ec0dac4243a5392545df4745d6fd328e039420 | 使い捨て可 | agent-slots.md / L7-unit §1.9 U-SLOT §1.10 U-TEAM (既存) | parent: L6-05 (完了済み、剥離) | fireSlot・releaseSlot・peakParallel・recordGuardFire・mustSerialize・3 条件が既存 / PLAN 本文を全文読み直し (FLAG #1013 対応)。出力契約・責務範囲・依存は設計文書に既存、PLAN にだけ残るものなし |
| PLAN-L6-08-backfill-pairing | a5b110a47d2a997ca0e3db41defab59c2b42ff7bc0b0c1254986683a8307d8aa | 使い捨て可 | backfill-pairing.md §1-§3 (既存) | parent: L6-06 (完了済み、剥離) | PLAN 内の関数名 checkReversePairing/checkGlossaryMerge は実装の analyzeBackfill に統合済みで、設計文書は実装 (src/lint/backfill-pairing.ts) と一致。KIND_BACKFILL 表も設計文書に既存 / PLAN 本文を全文読み直し (FLAG #1013 対応)。出力契約・責務範囲・依存は設計文書に既存、PLAN にだけ残るものなし |
| PLAN-L6-09-governance-enforcement | 16cef16e0683432746cbff93e090d6c9d4afc6a21d155944522166339f5a00f7 | 使い捨て可 | governance-enforcement.md / L7-unit U-SCRUMREV U-PROP (既存) | なし | analyze 契約と U-ID が既存 / PLAN 本文を全文読み直し (FLAG #1013 対応)。出力契約・責務範囲・依存は設計文書に既存、PLAN にだけ残るものなし |
| PLAN-L6-10-vmodel-pair-lint | 48b0a9ff2d89ef167a03170ee3249bbc52758c4650b1fdca137e5c62cd8858d7 | 使い捨て可 | vmodel-pair-freeze.md / L7-unit §1.13 U-VPAIR (既存) | なし | DoD 未チェック 3 件は設計文書と U-VPAIR の実在で充足 (stale) / PLAN 本文を全文読み直し (FLAG #1013 対応)。出力契約・責務範囲・依存は設計文書に既存、PLAN にだけ残るものなし |

| PLAN-L6-11-verification-trigger | baac96798e1ba93f348f6204ea36c4fcf04594e574aa757f224f44eb3ca5c149 | 使い捨て可 | vmodel-pair-freeze.md §7 / L7-unit §1.14 U-VTRIG (既存) | なし | 検証発火単位 (層群) §7.1 が既存。DoD 未チェックは stale |
| PLAN-L6-12-review-evidence | 5b4d9149a89e050ea8367b82c7e92a31cdc92c2237210ae822f7dd6bc4b26f37 | 使い捨て可 | review-evidence.md / L7-unit U-REVIEW (既存) | なし | DoD 全 [x]。対象選定・schema・U-REVIEW が既存 |
| PLAN-L6-13-cross-review-enforcement | 254011efa3a5c148fe7ff5d4c648a76f3e5d78e99303e995c398cf068ac8d080 | 使い捨て可 | cross-review-enforcement.md / U-XREVIEW (既存) | requires: L6-12 (完了済み、剥離。設計文書は review-evidence を参照済み) | worker_model/reviewer_model・same_model 弾き・scope OUT (subagent 配置) が既存 |
| PLAN-L6-14-test-before-review | f8cc8ac6156c891fa0e5f04fc756dd4bb489a612cb7c86831d55d96f6d29b34e | 使い捨て可 | test-before-review.md / U-TORDER (既存) | requires: L6-12 (完了済み、剥離。設計文書は review-evidence を参照済み) | tests_green_at ≤ reviewed_at 不変条件と review_before_test が既存 |
| PLAN-L6-15-module-drift | 5b9b9817658b63b5bae09df939106008a1096d15275b1f893f88869f081d6e55 | 使い捨て可 | module-drift.md / architecture.md §4.1 (L161-163、IMP-074/075 の実装証跡と carry plan_id) (既存) | なし | PLAN の Step 2 (architecture §4.1 carry plan_id 明示) は architecture.md に実在 (grep)。PLAN-REVERSE-15 参照は PLAN 側の back-fill 記録で設計責務ではない |

## 未処理 (次の worker へ)

PLAN-L6-16 〜 PLAN-L6-46 (s6-00 の 17 行目以降の 31 件)。

観察 (引き継ぎ用): 仮判定の傾向は、ほとんどが confirmed の add-design で DoD [x]、設計文書が正本として存在し使い捨て可と見込まれる。
個別に確認が要るもの: L6-10/11/17/18/19 (DoD 未チェック、設計文書で充足確認)、L6-15 (architecture §4.1 carry plan_id)、
L6-20 (readHookInput が session-log.md に無い)、L6-33 (IMP-131 scope 改訂 = setup graph-tools が module-drift.md に無い)、
L6-35/37/38/45/46 (設計文書に無い語が多い。要内容照合)、L6-36 (blocks L7-141)、L6-39 (blocks L7-381)。
