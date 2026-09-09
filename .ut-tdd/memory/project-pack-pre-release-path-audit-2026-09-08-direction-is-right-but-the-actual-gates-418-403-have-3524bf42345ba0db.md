---
memory_id: memory:project:pack-pre-release-path-audit-2026-09-08-direction-is-right-but-the-actual-gates-418-403-have-zero-plan-and-zero-branch--21352886f30e
kind: project
title: "Pack pre-release path audit 2026-09-08: direction is right, but the actual gates 418/403 have zero PLAN and zero branch"
tags: ["audit", "issue403", "issue418", "pack", "prerelease", "review-custody", "rework"]
updated_at: 2026-09-08T05:17:24.659Z
---

2026-09-08、PO 依頼で「Pack プレリリースまでの経路に無駄な遠回りが無いか」を issue / PR / branch の実測で監査した結果。宛先は Codex ランタイム。

## 方向は正しい
2026-08-26 以降 main へ merge した PR 54 本のうち、release critical path が約 30 本 (Bun 撤去 #470/#471/#472/#500/#504/#506、Node bootstrap #484/#485/#486/#487、Pack 配布 #414/#482/#420、release identity #474)、plumbing が約 22 本。#418 の HARD 前提のうち #414 は closed、S5 chain (#402/#363/#362) も closed。無関係テーマへの逸脱は検出されなかった。

## 実測された問題 1: ゲート本体が未着手
- `github_issue_id: 418` を持つ PLAN は docs/plans/ 全走査で 0 件。
- origin に 418 / 403 / canary 系ブランチ無し。
- #403 (v2 publication adapter) は HARD 前提 (#402/#389/#368) が全充足なのに 2026-08-25 から 14 日 open、#410 以降 PR 無し。
- #418 も 2026-08-26 起票から PR 無し。
#418 の非 Bun 部分 (clean fixture 構成、source path 参照 0 検査、Windows/Linux smoke) は #487 実装と依存関係が無いため直列化する理由が無い。#487 完了と同時に #418 がゼロ着手になるのが最大の待ち時間リスク。

## 実測された問題 2: review custody の逐次修理
同一クラスの未解決 issue が 8 件並行 (#386/#393/#439/#444/#454/#493/#494/#505)。2026-09-08 の 1 セッション実測で、verdict custody 形式による Opus レビュー 2 回無効化 + peer worktree orphan request による merge gate deny 1 回 (class R retry で 4 回目に receipt) + 完了済み作業の wake 通知再送 5 件。on-path PR 1 本ごとにこの税がかかっている。

## 実測された問題 3: 手戻り
08-26 以降の unmerged close が 10 本 (#492→#495、#478→#496、#453→#463、#447→#466、#428→#435、#520→#521 が作り直し)。同一 issue 複数 PR は #414 が 4 本、#474/#424/#420 が各 3 本。#521 は PLAN revision 10 / review 5 ラウンド (r2 で撤去範囲を誤って外し r3 で復元、r4 で oracle 期待値移行の欠落)。#408 を not planned で close して所有が宙に浮き #450 で回収、PR #415/#411 の 2 本が破棄。origin に `fix/issue408-pack-consumer-node` が残置。

**Why:** プレリリースの残待ちを「Bun 撤去の完了待ち」と認識していると、実際のゲート (#418/#403) が未着手であることが見えない。plumbing は正当な発火だが、同一クラスを単発修理し続ける限り on-path 作業ごとに固定費を払う。

**How to apply:** (1) #418 と #403 の PLAN を起票し Bun 実装と並行化する (#418 の非 Bun 部分は #487 非依存)。(2) review custody を #439 の typed terminal を正本にした 1 本の契約へ畳み、#386/#393/#493/#505 を従属 slice にする。(3) 契約 freeze 前に撤去対象と oracle 凍結期待値の突合 (git show / git grep による実測) を 1 回挟む — #521 が revision 10 まで振れた原因はこれの欠落。(4) 残置ブランチ fix/issue408-pack-consumer-node を畳む。
