---
memory_id: memory:project:issue-450-bun-sea-ac3-l6-93-5-2-slice-1-2--9bf45845dc4d
kind: project
title: "Issue #450 Bun 撤去: 循環は誤り / SEA 案撤回 / AC3 が L6-93 §5.2 と衝突 / Slice 1-2 分割"
tags: ["advisor", "bun-ban", "claude-owned", "issue-134", "issue-450", "plan-l6-93", "release-blocker"]
updated_at: 2026-08-28T04:59:03.185Z
---

Issue #450 (Bun permanent ban、canonical parent #134) を Claude lane で受領した。Codex は Memory 通知
だけでは回収されなかったため同じ内容を Issue #450 へ fallback 投影した (2026-08-28T04:51:17Z)。
Memory 通知経路では届いておらず、issue コメントを直接読んで把握した。

ut-tdd advisor --decision design --current-model claude-opus-5 --execute (provider=claude,
model=claude-fable-5) で方式合意を取り、前提を repo 実測で検証した。初期見立て 2 点が反証された。

訂正1: 「循環している」は誤り。#450 の AC1 は sealed runtime を要求しておらず、
「Bun 未導入 clean consumer で readiness ok:true」= distribution.ts:373 の bunOk 撤去のみを求める。
循環は PR #463 が (sealedRuntime ? true : bunOk) という分岐を選んだ時点で生じたもので構造的制約ではない。
PLAN-L6-93 §5.1 は削除禁止条項の保護対象を (1) package.json の build script (2) node src/cli.ts の
2 つに限定しており、consumer readiness の bunOk は保護集合外。よって readiness の Bun 検査を
Node 検査へ差し替えるのは契約改訂ではなく PR #463 の設計修正。

訂正2: 「Node SEA (--experimental-sea-config + postject) で循環だけ先に切る」は取れない。撤回した。
PLAN-L6-93 §1 の buildNodeGeneration は immutable generation と receipt を生成する = sealed runtime
生成そのものが producer の責務であり別種の receipt 生成ではない。build backend の差し替えは §5.2 が
freeze した rollback 経路の置換で、§5.4 の tuple (generation_id / artifact_digest は producer 産) を
経ずに build script を触ると CAND-NODEBOOT-023 が fail-close する。実装 PR 内のビルド方式発明は
PR スコープ規律 §2 違反でもある。

新規発見: #450 の AC3 「dist/ut-tdd 相当の sealed runtime を Node のみで生成できることの実測
(package.json:31 の置換)」が PLAN-L6-93 §5.2/§5.4 と正面衝突する。§5.2 は build script を
sealed build receipt と Node parity receipt が双方成立するまで維持すると明示し片側成立での撤去を禁止、
§5.4 は subject_revision / generation_id / artifact_digest / retirement_subject の 4 要素 tuple の
完全一致を要求して部分一致撤去を CAND-NODEBOOT-023 で fail-close する。AC3 の「置換」は §5.2 が
禁じる「撤去」に読め、かつ撤去条件成立には producer が必要なので AC3 は定義上 producer 完成前に
閉じられない。

決定 (PO 判断не要と判断、既存責務境界から一意): L6-93 §5.4 が「撤去境界の唯一の正本」と自ら宣言して
いるため、AC3 は「bun build を削除する」ではなく「Node-only の sealed generation 経路を
buildNodeGeneration として実装し §5.4 の 2 receipt + tuple 一致を成立させる」と読む。
package.json:31 の実削除は条件成立後の別 commit とする。issue #450 へ記録済み、異議受付中。

実行計画: AC を producer 依存で二分。
Slice 1 (今すぐ着手可、producer 非依存、1 PR = 1 論点で 3 本、順序 S1-b → S1-a → S1-c):
  S1-a distribution.ts の readiness から bunOk / hasMinimumBun 撤去 → Node 検査 (AC1)
  S1-b templates.ts の生成物から Bun 除去 (shebang / run-bun.ts / findBun / 生成 consumer CI の
       setup-bun@v2 / bun install / bun run / 案内文)、negative control 付き (AC2)
  S1-c harness-check.yml から setup-bun x2 撤去 (AC4)
  S1 は package.json:31 に触らない (§5.2 の維持対象)。
Slice 2 (L6-93 待ち、AC3): PLAN-L6-93 を confirm し buildNodeGeneration / publishActivation /
  loadNodeGeneration を PLAN-L7-458 系列で実装。現状 src に 0 件、L6-93 / L7-458 とも draft。

#418 は Slice 1 完了時点で HARD 条件を満たせる可能性がある (L6-93 §5.3 実測: Pack 配布は dist/ を
運ばず consumer 経路は bun build に到達しない)。Slice 1 完了後に #418 本文と突き合わせる。

PR #463 は draft のまま維持 (consumer 側で producer を捏造しない)。ただし distribution.ts:390 の
(sealedRuntime ? true : bunOk) は S1-a で bunOk 自体が消えるため競合する。S1-a を出す前に
#463 側の意向を確認する。

運用教訓: issue 単位の task dispatch は wake inbox に現れない (本日届いた通知は全て
purpose: review の PR 単位)。能動的に issue を見に行かないと気づけない非対称がある。
CLAUDE.md §定期棚卸し の gh issue list --state open をセッション中盤にも 1 度流して塞ぐ。
機構化は PLAN-L7-437 (blocked) の守備範囲なので凍結中に先回り実装しない。
