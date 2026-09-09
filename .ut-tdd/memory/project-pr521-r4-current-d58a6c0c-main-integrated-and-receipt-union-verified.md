---
memory_id: memory:project:pr521-r4-current-d58a6c0c-main-integrated-and-receipt-union-verified
kind: project
title: "PR521 r4 current d58a6c0c main integrated and receipt union verified"
tags: ["exact-head", "issue487", "pr521", "review-request"]
updated_at: 2026-09-08T03:18:58.516Z
---

## 対象

Refs #487。#520 の履歴を保持した後継の docs-only pair-freeze。Bun の実削除はこの PR に含めない。

対象 HEAD: d58a6c0cf0871555a1e7c246230e62c2c3b998d0

main 059a35469748c41ce7b2d2046905eb8ab8980247を取り込み済み。唯一の競合だったtracked admission projectionはmain148件/branch165件を167件へ統合。既存parser/digest関数で派生chainを組み立て、両側のcommand/receipt/decision/bindingが全件不変であることを照合した。新しいauthorityやreceiptは作っていない。

- PLAN-L7-530 revision 9 / PLAN-REVERSE-530 revision 10 を既存 ledger の正規 plan revise 経路で発行。Reverse reentryは自身のrevisionではなく上位PLAN-L6-93のbinding revision 27を参照する。
- r3 FLAGへの是正: pathリストは代表例と明示し、非実行の履歴enum/互換ID/認識語彙をretained_compatibility_vocabularyとして区別。全Pack active skills/README、新規runtime projectionも棚卸しに含む。guard弱体化は独立Redで拒否する。
- r3の不存在ファイル/run-bun必須という部分はexact Git objectで反証し、Claudeも古いprimary checkout観測だったと確認済み。FLAG全体の自己解除はしていない。
- package build・bunAuthority・lock と、CLI、DB、hook、snapshot、配布スキル等の到達可能な Bun 経路を棚卸し対象にする。
- 全 tree の候補を個別分類し、履歴・fixture のディレクトリ単位除外はしない。
- #470/#471/#472、#500、Node producer #484/#515 の既存所有境界を維持。
- 同一 tuple の receipt 成立を実削除の前提とし、対になる負系 oracle を契約化。

## ローカル検証

- plan admission-check --base HEAD^1 --head HEAD と --base HEAD^2 --head HEAD: 両parentからPASS、findings 0。
- 両 PLAN lint: PASS。
- 統合前f7605c91のcommitted snapshot: plan-lint / readability / rule-drift 114/114 PASS、cleanup exit0。現HEADへの証跡流用はしない。統合差分は両parentのadmission-checkで検証済み、現HEAD full CIを要求する。
- git diff --check: PASS。

## 残るゲート

この HEAD の GitHub CI と非著者 Opus preflight が必要。旧 HEAD の PASS / CI を流用しない。契約確認前の実装開始・Bun 撤去完了の宣言は行わない。
