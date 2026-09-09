---
memory_id: memory:project:pr-457-4b641cd2-review-flag-blocking-2-anchor-digest-mismatch-ci--45edd1d09f3b
kind: project
title: "PR #457 4b641cd2 review: FLAG blocking 2 (anchor-digest-mismatch が CI を赤化)"
tags: ["ci-red", "green-command-digest", "plan-l7-515", "pr-457", "review"]
updated_at: 2026-08-28T02:59:33.069Z
---

PR #457 exact HEAD 4b641cd2b032c71ed7c5a06118c877118f8d0225 の非著者 closing review は
FLAG / blocking 2。canonical receipt 5b776041bdd4f34b3f8a96fa4184dd413bf8824ef5aea283736be3e096490507
(2026-08-28T02:43:41.648Z, reviewer claude-opus-5)。

根本原因は 1 件: PLAN-L7-515 の green_commands entry で output_digest が commit 4b641cd2 の
test-design bytes (sha256:34cd8bf5...) なのに anchor_commit が先行 commit 92d16905 を指しており、
92d16905 時点の実 hash は sha256:d2ae4a8c... で一致しない (anchor-digest-mismatch)。

帰結として CI が赤化している。.github/workflows/harness-check.yml:128 が
doctor --strict-green-command-digest を実行し src/doctor/check-definition-groups.ts:303 が
strict 時 ok = mismatches.length === 0 で fail-close するため。run 33136374689 の
harness-check-linux は doctor で exit 1 となり test / doc lane checks / lint / audit quality は
すべて skipped。引用されていた Green run 33134090758 は先行 HEAD 92d16905 のものであり、
本 delta が新規追加した green_commands entry はそこには存在せず未検証だった。

推奨是正は output_digest を sha256:d2ae4a8c... へ差し替えて anchor_commit 92d16905 を維持する側。
同 entry の plan_revision / subject_head / 引用 receipt fc1c3585 / green run はすべて 92d16905 に
束ねられており、anchor を 4b641cd2 へ動かすと entry 内で二つの HEAD が混在するため。

副次観測 (issue #367 へ追記済み): PLAN-L7-476 の anchor_commit 726db0b0c5d0dadeabf0085f482bf5f8353262e2
はローカルにのみ存在しどのブランチからも到達できない未 push commit。ローカルでは
anchor-digest-mismatch になるが CI では commit 不在で readBlobAtCommit が unverifiable を返し skip
されるため恒久的に fail しない。checkout の shallow / full は無関係で workflow は fetch-depth: 0。
見た目が正当な SHA のため目視でも検出できず、永続検証層 PLAN-L7-303 の前提が壊れている。

通過確認: receipt fc1c3585 の verdict PASS-WEAK / blocking 0 / head 92d16905 / at 02:24:23.877Z は
PLAN 記述と逐語一致、cross_agent の gpt-5.6-sol と claude-opus-5 は別 provider、
tests_green_at <= reviewed_at、PLAN-REVERSE-515 は draft / R1 維持、plan lint は本 HEAD で Green
(checked=929)。
