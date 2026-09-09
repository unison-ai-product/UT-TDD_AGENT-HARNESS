---
memory_id: memory:project:unpushed-worktree-triage-2026-09-09-issue420-holds-27-commits-absent-from-main-across-two-lanes-8-worktrees-carry-remote-less-work-72-49-folded-with-all-branch-refs-kept--b0b89cf79573
kind: project
title: "Unpushed worktree triage 2026-09-09: issue420 holds 27 commits absent from main across two lanes; 8 worktrees carry remote-less work, 72->49 folded with all branch refs kept"
tags: ["cleanup", "issue420", "triage", "unpushed", "worktree"]
updated_at: 2026-09-09T03:58:08.691Z
---

## 未 push commit を持つ worktree の棚卸し (2026-09-09、root 実測)

`git cherry origin/main <head>` の patch-id 比較で、remote に一切存在しない commit を持つ worktree を
洗い出した。**main に等価な変更が無い 8 件**が以下。ローカル障害で消える露出であり、triage が必要。

| worktree | branch | commit 数 | 最終 | 内容 |
|---|---|---|---|---|
| `C:/dev/ut-issue420-consumer-runtime-impl` | `feat/issue420-consumer-runtime-impl` | **15** | 2026-08-28 | sealed consumer Node runtime 本体、fault oracles、CI leg の Node manifest 整合、generated hook の Node wrapper 経路化 |
| `C:/dev/ut-issue420-runtime-adapter-contract` | `work/add-feature-issue420-consumer-physical-adapter` | **12** | 2026-09-08 | physical consumer runtime adapter、durability / descendant 境界 hardening、predecessor history の検証と負系 |
| `C:/dev/ut-issue418-pack-canary-nonbun` | `feat/issue418-pack-canary-nonbun` | 5 | 2026-09-08 | Pack canary skills の exact-one inventory oracle、materialized bytes 検査 |
| `C:/dev/ut-issue542-sealed-lineage-validation` | `feat/issue542-sealed-lineage-validation` | 3 | 2026-09-09 | sealed lineage preimage の validate 実装 + typed rejection oracles (**#542 AC 1、稼働中と判断し保持**) |
| `C:/dev/ut-issue484-f0b-node-producer` | `feat/issue484-f0b-node-producer` | 1 | 2026-08-31 | sealed F0b generation producer (`rv507` の 6 commit と重複の疑い。ただし `rv507` 側は main 取り込み済み) |
| `C:/dev/ut-issue490-ci-freeze` | `issue/490-ci-freeze` | 1 | 2026-08-31 | Windows CI single snapshot contract の freeze。**patch-id では main 取り込み済みだが固有メモリ 1 件があるため保持** |
| `C:/dev/UT-TDD-agent-harness/.ut-tdd/tmp/rv520` 系 | (detached) | 3〜5 | 2026-09-04 | `origin/design/issue487-bun-final-retirement-contract` に push 済み (露出なし) |
| `<user-home>/ut-issue362-r4` | `docs/issue362-reverse496-close` | 1 | 2026-08-21 | patch-id では取り込み済みだが **PLAN 2 ファイルに tracked 変更 + 固有メモリ 2 件**があるため保持 |

**最大の露出は #420 の 27 commit** (実装 15 + physical adapter 12)。8/28 と 9/08 の 2 系統に分かれており、
どちらも remote に無い。#420 は PO 承認未了の durability scope 論点 (L7-516 の成功範囲) が未解決のまま
保留されている issue であり、実装が push されないまま 2 系統に分岐している状態は、後で統合するときに
どちらが正かの判断材料を失う。所有側で (a) push して PR 化するか、(b) archive branch へ退避するか、
(c) 破棄するかを決めてほしい。root 側では削除も push もしていない。

### root 側で本日畳んだもの

72 → 49 件。判定は「HEAD が origin/main に含まれる」または「patch-id が main に存在する」かつ
「tracked 変更 0」かつ「正本に無い固有メモリ 0」。**ブランチ ref は全て保持**したので未 push commit は
失われていない。畳んだ 7 件の untracked は debug scratch (`tmp-debug/`、`tmp_probe.ts`、env dump) のみ。

### 畳むときの注意 (実測事故)

worktree の `node_modules` が primary と同一実体を共有している場合、`git worktree remove` が
**共有先を空にする**。本日 primary の `node_modules` が 0 になり全 CLI が起動不能になった (`npm ci` で復旧)。
`ls node_modules | wc -l` は共有でも独立コピーでも 92 を返すため判別できない。probe で判定すること。

```bash
touch node_modules/.probe-shared-check
[ -e "<worktree>/node_modules/.probe-shared-check" ] && echo SHARED || echo independent
rm -f node_modules/.probe-shared-check
```

SHARED なら `cmd //c rmdir "<worktree>\node_modules"` でリンクを外してから remove し、直後に
`ls node_modules | wc -l` と `node src/cli.ts --help` で primary を検証する。

### 保全継続 (削除しない)

正本に無い固有メモリ 96 件が 16 worktree に残っている (`C:/dev/ut-gate-main` は 42 件)。
advisor (Sol) 判定は **REFUTED** — byte コピーは confirmed `PLAN-L7-512` の移行契約 (inventory、
同一 ID 異 digest の quarantine、source 再束縛の TOCTOU fence、atomic rollback、digest completion) を
迂回するため不可。`memory add` 再登録も ID 再導出で identity を壊すため不可。**#544 の apply slice 実装を
待つのが正**であり、それまで当該 16 worktree は保全する。
