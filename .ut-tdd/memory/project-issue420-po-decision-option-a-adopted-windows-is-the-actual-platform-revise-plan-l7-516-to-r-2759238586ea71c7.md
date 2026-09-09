---
memory_id: memory:project:issue420-po-decision-option-a-adopted-windows-is-the-actual-platform-revise-plan-l7-516-to-revision-5-with-explicit-crash-boundary-fsync-ordering-startup-recovery-and-real-adapter-windows-oracles--cca4f3a1dccd
kind: project
title: "Issue420 PO decision: option A adopted (Windows is the actual platform), revise PLAN-L7-516 to revision 5 with explicit crash-boundary, fsync ordering, startup recovery and real-adapter Windows oracles"
tags: ["contract-revision", "durability", "issue-420", "plan-l7-516", "po-decision", "windows"]
updated_at: 2026-09-08T11:53:55.260Z
---

Issue #420 Windows durable seal の PO 判断 (2026-09-08、PO 発言「この環境 Windows なんだけど」)。

## 決定: 選択肢 A を採る (C は却下)

実行環境が Windows であるため、「Windows では seal 成功を返さない」(選択肢 C) は製品として成立しない。
`.claude/CLAUDE.md` §Guard Rules の「Native Windows behavior is first-class」とも整合する。
したがって **PLAN-L7-516 の成功条件へ保証境界を明記する契約改訂 (A) を PO 決定として採択**する。
これは pair-freeze 済み成功条件の縮小であり、PO 承認が前提だった論点である (advisor gpt-5.6-sol の
adversarial verify は「PO が制約自体を変更しない限り A は採択不能」と述べていた。その前提条件が満たされた)。

## 契約改訂の内容 (L7-516 revision 5、著者 = Codex root)

L7-516 は `ut-issue420-runtime-adapter-contract` の ledger で adopted (asset plan:legacy:d28966ed…、maxRev 4)
なので、正規 `plan revise` で revision 5 を発行できる。改訂に含めるべき点:

1. **保証境界の明文化** (PLAN-L7-512 §2 と同じ線): consumer seal の transaction 保証境界は同一 host 上の
   process crash / 強制終了までとする。Windows で directory fsync が提供されない面の power-loss durability は
   本 slice の保証に含めず、未完了 marker または現物不一致を次回起動時に fail-close する。
   §11.3 末尾の「能力を偽って成功にしない」は維持し、**この境界の範囲内で** 成功を定義する
   (境界外を成功と偽らない、という形に精緻化する。条項の削除ではない)。
2. **file fsync の順序** を契約側でも規定: writable fd を保持して fsync してから readonly (0444) seal する。
   readonly 化後の `openSync(path,"r+")` に依存しない (Windows での成功証拠が無い)。
3. **回復経路の追加** (advisor 指摘、現候補に未実装): 未完了 staging を次回起動時に列挙・発見する経路を
   契約に入れる。これが無いと「marker 残置時に fail-close できる」という 1 の前提が成立しない。
4. **Windows 実 adapter 試験の要件**: directory fsync の EPERM/EINVAL 許容は win32 限定かつ typed に扱い、
   例外を mock した分岐 coverage を能力証明にしない。rename 直後の process kill、新 process reconcile、
   部分 bundle、pointer のみ残存、同一 volume 判定を対で検証する。
5. 既存 `node-atomic-draft-publisher.ts` の private helper は PLAN-L7-435 / L7-441 所有のままとし、複製ではなく
   本契約側で独立に規定する (所有境界を越えない)。

## 進め方

- 契約改訂 (revision 5) は L7-516 の著者である Codex root が発行し、非著者 (Claude) が cross-review する。
  実装 PR はその改訂の後に出す (pair-freeze の順序、CLAUDE.md §PR スコープ規律 2)。
- 実装は Windows 正系 + Linux 正系の双方を実 adapter 試験で証明する。成功 gate の弱体化 (能力偽装) は不可のまま。
- Claude 側は #542 の契約 freeze (PR #543、CI 5/5 green、Codex 非著者 review 手配中) を継続する。
