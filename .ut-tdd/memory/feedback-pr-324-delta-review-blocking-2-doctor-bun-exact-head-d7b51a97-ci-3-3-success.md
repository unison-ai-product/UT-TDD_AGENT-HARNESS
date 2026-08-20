---
memory_id: memory:feedback:pr-324-delta-review-blocking-2-doctor-bun-exact-head-d7b51a97-ci-3-3-success
kind: feedback
title: "PR #324 delta review 再依頼: blocking 2 是正 (doctor 配線 + Bun 判別の自己矛盾解消)、exact HEAD d7b51a97、CI 3/3 SUCCESS"
tags: ["delta-review", "exact-head", "issue-322", "pr-324", "review-request"]
updated_at: 2026-08-14T13:15:50.452Z
---

PR #324 の FLAG (blocking 2) を是正しました。新 exact HEAD d7b51a97、CI run 31802915810 は 3 job とも SUCCESS です。delta review をお願いします。

## B1 (production 未配線) の是正

analyzeHookParity を checkRuleDrift (doctor rule-drift) へ組み込み、messages と ok を合成するようにしました。指摘どおり従来は unit test からしか呼ばれておらず、doctor / CI の判定に入っていませんでした。

実測 (checkRuleDrift 直呼び):
- baseline: ok=true、messages に 'rule-drift - OK (.claude/CLAUDE.md Hooks == .claude/settings.json)' が出る
- doc の SessionStart 行から引数を 1 つ落とす: ok=false、'rule-drift - violation: hook doc/settings drift 2 (SessionStart:... session, SessionStart:... session start)'

## B2 (自己矛盾) の是正

ご指摘のとおりでした。引数 group を optional にしたため bare bun + 空白が実行形と判定され、'use bun runtime' まで forbidden になっていました。U-RDRIFT-006 が通っていたのは「、bun」の読点前置に助けられていただけで、oracle 自体が弱かったのが原因です。

判別を次の 4 形へ限定しました: (a) code span (bun / bun run test を丸ごと backtick で囲った形)、(b) bun/bunx の直後に引数らしき token (flag / 引用符 / path / ${VAR} / *.ts)、(c) bun.cmd / bun.exe (実行ファイル名で散文には現れない)、(d) bunx <pkg> (bunx は runner なので pkg 名だけで実行形)。

oracle も両側から挟む形へ強化しました:
- U-RDRIFT-006: 散文 6 形へ拡張し、直前文字への依存を排除 (読点前置版と空白前置版の両方、'use bun runtime ...'、'engines.bun は ...' 等)。bare bun を実行形と見なす実装はここで RED になります。
- U-RDRIFT-008: 9 形へ拡張 (code span 2 形 / 引数付き 3 形 / bun.cmd / bun.exe / bunx <pkg> / pipe 後)。取りこぼす実装はここで RED になります。

## 実測

rule-drift + doctor-rule-quality + oracle-test-trace 45 tests green、plan lint OK (877)、tsc 0、biome 警告 0 (651 files)、CI 3/3 SUCCESS。

PASS 済みの項目 (engines.bun 削除 / PLAN-L7-488 と L7-462 の backref / bun.cmd・bun.exe・bunx 検出) は今回の変更で退行していないことを 45 tests で確認しています。
