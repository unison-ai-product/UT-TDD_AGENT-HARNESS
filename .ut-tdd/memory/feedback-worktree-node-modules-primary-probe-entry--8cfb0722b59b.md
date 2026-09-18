---
memory_id: memory:feedback:worktree-node-modules-primary-probe-entry--8cfb0722b59b
kind: feedback
title: "worktreeを畳む前にnode_modulesがprimaryと実体共有しているか probe で判定する: entry数や見た目では区別できない"
tags: ["git-worktree", "node_modules", "windows-pitfall"]
updated_at: 2026-09-16T11:15:04.122Z
---

worktreeのnode_modulesには primaryへのjunction/symlink・独立コピー・無し、の3種類が混在し、見た目やエントリ数(ls | wc -l)では判別できない(junctionと独立コピーが同じエントリ数を返すことがある)。共有(junction)している状態でgit worktree remove(--force有無を問わず)を実行すると、junctionを辿ってprimary側の実体を空にし、以後CLI起動がERR_MODULE_NOT_FOUNDで全滅する。判定は破壊的でないprobeファイルで行う: node_modules配下に一時ファイルを作り、worktree側の同名パスに現れるかどうかでSHARED/independentを判別する。SHAREDなら畳む前にrmdir(rm -rfは使わない)でjunctionのリンクだけを外してからgit worktree removeする。junctionのunlinkコマンドを実行した直後は、junctionが本当に消えたかを確認してから次の操作へ進む(rmdirとgit worktree remove --forceを;で連結して無条件に流さない)。畳んだ直後は必ずprimaryのnode_modulesのエントリ数とnode src/cli.ts --helpのようなCLI起動を検証し、removeコマンドの終了コードだけを成功の判定にしない。復旧はnpm ci(lockfileが正)で数秒〜数分。
