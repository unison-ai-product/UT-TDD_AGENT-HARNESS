---
memory_id: memory:project:issue420-windows-seal-interpretation-current-l7-516-forbids-success-without-directory-durability-so-windows-must-fail-closed-contract-scope-question-escalated-to-po--877243a2cf9d
kind: project
title: "Issue420 Windows seal interpretation: current L7-516 forbids success without directory durability, so Windows must fail closed; contract scope question escalated to PO"
tags: ["claude-decision", "durability", "issue-420", "owner-interpretation", "plan-l7-516", "po-decision", "windows"]
updated_at: 2026-09-08T11:47:53.580Z
---

Issue #420 Windows durable seal の owner-level 解釈 (Claude、2026-09-08)。Codex root の依頼
(memory issue420-pre-pr-windows-durability-boundary-existing-helpers-do-not-satisfy-consumer-seal-contract) への回答。
新 Issue も新 authority も作らない。成功 gate は弱めない。

## 解釈: 現契約 (L7-516 revision 4) の下では Windows 正系を成功にできない

§11.3 step 4 が「全 payload と manifest を fsync/seal」、末尾が「OS が必要な durability/atomicity を提供できない
場合、能力を偽って成功にしない」と定める。directory fsync が EPERM で提供されない Windows で、その失敗を
握り潰して成功を返す実装は本条項に直接反する。PLAN-L7-512 §2 の「保証境界は process crash まで、
power-loss durability は非保証」は **別 slice の契約であり L7-516 を暗黙に上書きしない**。
既存 `node-atomic-draft-publisher.ts` の private helper (`syncDirectory` の win32 EINVAL/EPERM 許容) は
PLAN-L7-435 / L7-441 所有の別契約下の例外であり、無検証の複製は不可 (root の判断に同意)。

advisor (`--decision implementation` → gpt-5.6-sol、adversarial verify) も同結論。選択肢 A (L7-512 と同じ境界を
そのまま適用して成功を返す) は「pair-freeze 済み成功条件の縮小」であり現制約下で採択不能、B (native
FlushFileBuffers / ReplaceFile / MoveFileEx) は directory entry の durability を証明できず
(`REPLACEFILE_WRITE_THROUGH` は Microsoft 文書上 unsupported)、D は能力偽装そのものとして却下された。

## 実装方向 (bounded、契約改訂を待たずに進められる範囲)

1. Linux は正系 durability を実 adapter で証明する (現契約どおり)。
2. Windows は seal 成功を返さず typed failure とし、write 0 / launch 0 / pointer 不変を実 adapter 試験で証明する。
   例外を mock した分岐 coverage は能力証明にしない (実 Node/libuv 呼出しを通す試験であること)。
3. file fsync は writable handle で行う必要があるが、候補は作成直後に `0444` 化し seal 時に再 fsync する順序に
   なっている。**readonly 属性化後の `openSync(path,"r+")` が Windows で成功する証拠は無い**ため、
   書込み fd を保持して fsync してから readonly seal する順序へ変更し、実測すること (advisor 指摘)。
4. advisor が挙げた未証明前提を試験計画に入れる: 未完了 staging を次回起動時に列挙・発見する回復経路が
   現候補に無いこと (marker 残置検出の前提が未実装)、rename 直後の process kill、新 process reconcile、
   部分 bundle、pointer だけ残る状態、同一 volume 判定。

## PO 判断へ上げる論点 (advisor 相談後も残る trade-off)

「consumer seal の保証境界に power-loss durability を含めるか」は契約 scope の決定であり、
Windows を first-class とする repo 規律 (`.claude/CLAUDE.md` §Guard Rules) と、L7-516 の成功条件のどちらを
動かすかという product scope の選択になる。advisor は「Windows 成功が必須なら L7-516 へ
process-crash 境界を明示して再 pair-freeze する必要があるが、それは成功 gate の縮小であり PO が制約自体を
変更しない限り採択不能」と述べている。よって PO へ提示する。Claude は判断を捏造せず、上記 1〜4 の
範囲だけを進行可能として root へ返す。

root は #540 draft と他 worker を継続。Claude は #542 契約 freeze (PR #543、CI 実行中) を継続する。
