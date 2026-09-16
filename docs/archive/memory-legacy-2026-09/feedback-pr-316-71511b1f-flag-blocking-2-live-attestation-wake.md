---
memory_id: memory:feedback:pr-316-71511b1f-flag-blocking-2-live-attestation-wake
kind: feedback
title: "差し戻し通知: PR #316 (71511b1f) FLAG blocking 2 — live attestation の信頼根が無主 / 旧 wake 経路が未封鎖"
tags: ["cross-review", "d3a", "flag", "pr-316"]
updated_at: 2026-08-14T04:48:11.430Z
---

Claude non-author closing review @ exact HEAD 71511b1fe3f4e802c6dff02c4a74ccac4b0b9970: FLAG blocking 2 / non-blocking 3。CI run 31769060356 は 3 job 全 pass / CLEAN、gate も全緑だが pair-freeze の目的 (実装時発明の封止) を 2 点で満たしていない。

blocking A-1: live 経路の reviewerFamily 信頼根が無主。PLAN-L7-465:396-397 は verdict 側入力を『既存 verdict file / provider attestation』とだけ書き、live 経路で誰が attestation を産出するかを決めていない。実コードでは receipt の族は review-attestation.ts:210 の reviewerFamily = input.attestation.provider で決まり、委譲経路では delegation.ts:179 の provider: plan.provider と :185 の exitCode により spawn 事実に束縛されている。live VS Code 経路には child が無く provider/model/role/startedAt/completedAt/exitCode の事実源が存在しないため、CLI 引数の自己申告にするしかない読みが成立する。これは U-RVATT-001 (自己申告で上書き不可、test-design:1599) の保証を live 経路で無効化し、D1 の同族検出 (receipt.reviewerFamily === request.authorFamily) を著者側が任意に回避できる。追加 oracle 023-028 のいずれもこの点を固定していない。是正: live attestation の産出者と事実源を契約で一意に決め、自己申告を排除する oracle を追加する。

blocking A-2: 旧 wake 経路が閉じられず実測 gap が構造的に閉じない。契約 3 (:384) は canonical request 永続化の成功後にだけ memory wake を publish すると定めるが、既存 ut-tdd memory add --notify-claude は cli.ts:3946-3958 で request 無しに publishClaudeInboxEntry を実行する経路のまま。PLAN は :398 で memory add を正本へ昇格させないと述べるだけで、review 用途でのこの経路の封鎖/拒否を規定していない。二読み (a) 新 action のみ許可し旧経路を gate、(b) 併存し運用習慣で使い分け、のうち (b) でも oracle 1 (CANDIDATE-RVATT-023) は新 adapter 内しか見ないため全緑になり、requests=1 / receipts=0 という起点の運用 gap が再発する。是正: review 用途での旧 wake 経路の扱いを明文化し oracle で固定する。

non-blocking 3: A-3 移行手順が無主 (:389-390 の 1 回だけ再 dispatch に主体指定がなく、既存 requests 1 件と merge 済み PR の扱いも未規定) / A-4 oracle 5 の実 repo E2E が二読み (CANDIDATE-RVATT-027 の wrapper は既定 ports が gh 実行、CI は network 不可のため ports 注入の擬似 E2E か実 GitHub かが割れる) / A-5 oracle 6 の検査手段未指定 (import lint は実在するが call graph 検査の手段が repo に無い)。

反駁済み: 識別子・field 整合は完全一致 (ReviewAttestationRequest:22-29)、issueReviewRequest:153 / projectReviewVerdict:177 / analyzeReviewDispatch / evaluateMergeGate すべて実在、U-RVATT-001-022 実在 (grep -c = 26)、CANDIDATE-* が citation 要求を受けないのは仕様 (oracle-test-trace.ts:40-41)、ID 023-028 は衝突なし。

CI red 是正の独立検証: 62cfab64 = total 101 / unique 100 (dup CANDIDATE-RVATT-023)、71511b1f = 100/100 を自前抽出で再現。差分は test-design:1616 の説明文 1 行のみで契約条項・oracle 表 6 行は無改変。U-VMSRC-009 単体実走 1 passed。

verdict 全文: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/316#issuecomment-5289599147 。契約改訂を閉じてから実装 PR へ進むこと。是正後の新 exact HEAD で Claude が delta 再レビューする。
