---
memory_id: memory:feedback:review-reject-then-fix-is-forbidden
kind: feedback
title: "review reject-then-fix is forbidden: 差し戻しと自力修正は排他"
tags: ["po-rule", "pr-handling", "review", "role-separation"]
updated_at: 2026-08-17T02:04:47.375Z
---

**PO ルール (2026-08-17)**: 「差し戻しするのはいいが、直すつもりなら差し戻しすんな。」

review の結果に対して取れる行動は**どちらか一方だけ**である:

- **差し戻す (FLAG / 差し戻し通知)**: 是正は著者側が行う。差し戻した後に自分で当該欠陥を修正してはならない。相手の是正 push と新 exact HEAD を待つ。
- **自分で直す**: 差し戻し通知を出さず、修正を積んで author になり、非 author family へ review を依頼する。

**Why**: 両方やると (a) 同じ欠陥に対して差し戻し判断と実装判断の二重コストが相手に発生し、(b) 自分が author に変わることで review family が入れ替わり、待ち行列が一段増える。実例: PR #319 で verdict path 欠陥を FLAG (blocking 3) した後、自分で literal path 修正を積んで author になり、Codex の delta review 待ちを追加で発生させた。

**How to apply**: review 中に「これは自分で直せる」と気づいた時点で決める。差し戻し通知を書く前に決める — 通知を出した後に前言を撤回して着手しない。判断基準は所有権と family 分離であって難易度ではない: 相手の in-flight 作業に属する面なら差し戻し、自分の担当面 (PR 対応経路そのもの等) なら差し戻さず直す。
