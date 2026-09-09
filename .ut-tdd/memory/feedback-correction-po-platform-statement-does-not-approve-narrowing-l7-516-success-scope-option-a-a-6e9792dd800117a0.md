---
memory_id: memory:feedback:correction-po-platform-statement-does-not-approve-narrowing-l7-516-success-scope-option-a-adoption-withdrawn-and-durability-trade-off-stays-unresolved--a72999089f48
kind: feedback
title: "Correction: PO platform statement does not approve narrowing L7-516 success scope; option A adoption withdrawn and durability trade-off stays unresolved"
tags: ["correction", "durability", "issue-420", "plan-l7-516", "po-decision", "unresolved", "windows"]
updated_at: 2026-09-08T12:21:54.447Z
---

**訂正**: 先行 memory `issue420-po-decision-option-a-adopted-windows-is-the-actual-platform-...` の
「PO 決定として選択肢 A を採択」という記述を撤回する (Claude、2026-09-08)。root の指摘
(memory feedback:issue420-windows-platform-statement-does-not-alone-establish-durability-scope-approval) は妥当である。

## 何が誤りだったか

PO 発言は「この環境 Windows なんだけど」の一文のみである。これが確立するのは **Windows が実行環境であり
first-class 対応が必要であること** だけで、**power-loss durability を PLAN-L7-516 の成功条件から除外することへの
明示承認ではない**。Claude はこの一文から選択肢 A の採択を導いたが、これは PO 発言の過剰解釈であり、
confirmed 済み成功条件 (pair-freeze 済み) の縮小を承認なしに既決扱いした点で規律違反である。

## 現時点の正しい状態

- **確定していること**: Windows は実環境であり、「Windows では seal 成功を返さない」だけで済ませる選択肢 C は
  製品として成立しない (`.claude/CLAUDE.md` §Guard Rules の Windows first-class とも整合)。
- **未確定のまま保留すること**: consumer seal の保証境界に power-loss durability を含めるか。
  これは pair-freeze 済み成功条件の縮小であり PO の明示承認を要する。advisor (gpt-5.6-sol、adversarial verify) も
  「PO が制約自体を変更しない限り A は採択不能」と述べている。
- したがって **PLAN-L7-516 revision 5 の発行はまだ行わない**。root の「confirmed success scope を改訂しない」
  という判断を支持する。
- 先行 memory に列挙した 5 要件は、A が承認された場合の契約改訂案として保持する (確定した契約ではない)。
  うち 2〜4 (fsync 順序、起動時 staging 回復経路、実 adapter 試験要件) は A/C いずれでも必要な項目であり、
  現契約のまま進められる。

## PO へ再提示する論点 (未解決)

前提: 現行 L7-516 §11.3 は「全 payload と manifest を fsync/seal」「必要な durability を提供できなければ
成功にしない」と定める。Windows は directory fsync を EPERM で拒否する。実測済み。

- 案 A: L7-516 へ「保証境界は同一 host の process crash まで、power-loss durability は非保証、未完了 marker と
  現物不一致を次回起動で fail-close」を明記して再 pair-freeze する。Windows 正系が通る。成功条件は縮小する。
  先例: PLAN-L7-512 §2 が Memory 側で同じ境界を既に採用している。
- 案 C: 現契約のまま。Windows は typed failure で fail-close し、Linux のみ正系成功。成功条件は無傷だが
  Windows での導入が完了しない。

Claude の推奨は A (Windows first-class と L7-512 との一貫性)。ただし **成功条件の縮小は PO 権限**であり、
明示承認が出るまで保留する。承認が出た場合のみ root が revision 5 を発行し、Claude が cross-review する。
