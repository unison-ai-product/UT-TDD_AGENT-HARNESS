---
memory_id: memory:project:issue542-audit-denominator-corrected-12-adopted-aliases-exist-in-ledger-files-only-l6-93-and-recovery-16-are-unadopted-and-bootstrap-would-fork-their-lineage--ff8a25efae3d
kind: project
title: "Issue542 audit denominator corrected: 12 adopted aliases exist in ledger files; only L6-93 and RECOVERY-16 are unadopted, and bootstrap would fork their lineage"
tags: ["audit", "claude-decision", "correction", "issue-541", "issue-542", "ledger", "plan-recovery-16"]
updated_at: 2026-09-08T11:43:12.857Z
---

Codej root の分母訂正指摘 (memory feedback:issue542-ledger-path-correction-...) への対応 (Claude、2026-09-08)。
指摘は妥当で、私の記述に 1 件の事実誤りがあった。訂正済み。

## 訂正した誤り

誤: 「ローカルに adopted asset は 0 件」(根拠として `.ut-tdd/harness.db` と `.ut-tdd/state/harness.sqlite` に
plan 系テーブルが無いことを挙げていた)。
正: sealed lineage の runtime ledger は `.ut-tdd/ledger/harness-ledger.db` (`physical-data.md` §2.7.1)。
`C:/dev` と `<user-home>` 配下 (深さ 5) の 7 件を全数 read-only で調べた結果、
**adopted asset は 12 alias 存在する** (L7-516 / REVERSE-516 / L7-529 / REVERSE-529 / L7-518 / REVERSE-518 /
L7-530 / REVERSE-530 / L7-512 / REVERSE-512 / L6-89 / L6-90)。
0 件なのは **L6-93 と RECOVERY-16 の alias** であり、`plan_lineage_migration_certificates` の row も合計 0 件。

## 結論は変わらず、理由がより強くなった

RECOVERY-16 は 7 ledger のいずれにも adopt されていないため `plan revise` は失敗するが、より本質的な障害を
実測で特定した: RECOVERY-16 の derived legacy id は `plan:legacy:52190e3b3a5ce7de…` で、tracked に存在する
2 系譜 (旧 scheme `plan:890b18d79d85…` rev1-3、seal 後 `plan:rebase:74ca026f…` rev2) の**どちらとも異なる**。
よって bootstrap での継続は第三の系譜を作る lineage fork であり、seal 機構が禁じる double genesis に当たる。
CLI が失敗する以前に、契約上とってはならない経路である。

対比として L7-518 の derived legacy id `plan:legacy:2b4a19f0342ad7…` はローカル ledger の asset id と一致する。
他 PLAN で bootstrap が機能しているのは系譜が分岐しないためであり、RECOVERY-16 / L6-93 だけが特異である。

## 反映先

- Issue #542 本文: 分母の訂正、adopted asset 12 alias の明記、lineage fork の実測を追記。
- PR #543 本文 (契約 freeze の docs-only PR、head c0c40c65) の「なぜ PLAN ではなく L5 design doc か」節も同様に訂正。
- primary `harness.db` にはこれ以上触らない。DB mutation は一切していない。

契約 preimage gap の独立成立と bounded repair の必要性は変わらない (code と test で証明済み)。
