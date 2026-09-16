---
memory_id: memory:project:plan-l7-419-forward-fsm-opus-pre-gate-at-main-2f3f15af-flag-not-admissible-7-of-8-fsm-oracles-never-registered-imp-156-is-stale-bookkeeping-not-a-real-gap
kind: project
title: "PLAN-L7-419 Forward FSM Opus pre-gate at main 2f3f15af: FLAG not admissible, 7 of 8 FSM oracles never registered, IMP-156 is stale bookkeeping not a real gap"
tags: ["corrected", "exact-main", "flag", "forward-fsm", "imp-156", "plan-l7-419", "pre-gate", "red-freeze"]
updated_at: 2026-08-19T11:20:38.207Z
---

> **訂正 (2026-08-19、本 memory の title は誤りである)**
>
> title の「7 of 8 FSM oracles never registered」は **誤り**。実際には main 2f3f15af の
> docs/test-design/harness/L7-unit-test-design.md:1341-1348 に `CANDIDATE-FSM-001` 〜
> `CANDIDATE-FSM-007` と `CANDIDATE-P-FSM-001` の **8 件すべてが既に登録されていた**。
> Claude が `U-FSM|P-FSM` で grep したため、`U-` prefix を持たない `CANDIDATE-FSM-00X` を
> 取りこぼした。「0 件」は検出の失敗であって不在ではない。
>
> 背景として、設計正本 `PLAN-L6-72:64,71` は `U-FSM-001..007` と書くのに台帳は
> `CANDIDATE-FSM-001..007` (U- 欠落) であり、**U 系列だけ prefix が落ちている drift** が
> 元から存在した。これが取りこぼしの原因。
>
> この誤りは PR #343 に伝播し、既存 7 行と重複する `CANDIDATE-U-FSM-001..007` の新規追加を
> 招いた (blocking FLAG)。正しい判定と最小修正は
> [[feedback-pr-343-closing-review-at-0a75fada-flag-duplicate-fsm-candidate-ledger-caused-by-my-own-pre-gate-grep-miss-candidate-fsm-001-007-already-existed-without-the-u-prefix]] を正本とすること。
>
> **下記 B-3 の記述は無効。B-1 / B-2 / B-4 / B-5 / B-6 と (1) (3) の内容は有効。**
>
> 教訓: oracle 台帳の不在を主張する前に、prefix 違いを含む表記ゆれで再 grep すること。
> 設計正本と台帳で ID 表記が食い違っている場合、片方の表記だけで引くと必ず取りこぼす。


PLAN-L7-419 Forward FSM の Opus pre-gate。exact main SHA = 2f3f15af0e221deff792fc137c6fe2f6c61aad44。**verdict = FLAG (実装 admission 不可、blocking 6)**。luna は起動しない。read-only 監査であり、ファイル編集 / Issue / PR / PLAN 変更は一切行っていない。

## (1) U-PA-043..048 / IMP-156 / EvidenceRecord・reservation custody は **実質満たされている**

実行可能 oracle の実在 (main の tree を git grep):
- U-PA-043 = tests/plan-asset/reservation-service.test.ts (7-field length-prefixed HMAC input と known vector の凍結 / raw lease を一度だけ発行し hash のみ保存して同一 replay を復元 / replay payload drift を拒否し利用不能な historical key を置換しない / raw release token を ledger 境界を越える前に hash 化 / ローカル発行分を破棄して race 勝者 version を復元)
- U-PA-044 = tests/plan-asset/ledger-application.test.ts:152 (event/current/receipt を境界 fault ごとに rollback)
- U-PA-045/046/048 = tests/plan-asset/evidence-policy.test.ts (typed requirement の cross-kind 二重計上なし / unbranded argv・unknown kind・producer・self-supersession・digest drift の拒否 / policy rule の deep-freeze / trusted authority による attest のみ受理・producer/digest 束縛・replay 拒否・rotated historical key 検証 / negative claim と因果逆転 supersession の拒否 / unknown discriminator の拒否 / supersession chain の還元と orphan・fork・cycle の拒否)
- U-PA-047 = tests/plan-asset/ledger-schema.test.ts (空 reservation の v2→v3→v4 atomic upgrade / 非空 hash-only v2 を custody manifest なしに触らない / 中断された v2→v3 の byte 単位 rollback / 中断された admission v4 拡張の rollback)

Green の根拠 (prose ではなく実行証跡): CI run 32243313698、`harness-check-linux` の step「test — 全回帰 (vitest run)」= `npm run test` (.github/workflows/harness-check.yml:131-139) が SUCCESS。この run の headSha 19d26a47 と main 2f3f15af は `git diff --stat 19d26a47 2f3f15af` が空 = tree 完全一致なので、main に対する全回帰 green として読める。Windows leg は fast 系のため全回帰の根拠は Linux leg を使う。

IMP-156 の 要件 (docs/improvement-backlog.md:251) は「token issuer/clock port、hash-only ledger、再送 lease recovery 方式を設計 freeze し、transaction fault injection で 3 表 delta 0 を証明する」。上記のとおり前半は U-PA-043 が、後半 (3 表 = event/current/receipt) は U-PA-044 が閉じている。**にもかかわらず IMP-156 の status は `observed` のまま**。これは実体のある gap ではなく **台帳の stale**。IMP-167 (docs/improvement-backlog.md:272、v1 履歴と汎用 rebuild) も `observed` のままだが、こちらは自身が「後続 Reverse で閉じる」と明記しており 419 の前提ではない。

結論: PLAN-L7-418:212 の gate「U-PA-043〜048 が Green になるまで Reverse-418 と L7-419 依存を閉じない」は **条件成就している**。419 の `requires` 昇格を阻む実体は無い。阻んでいるのは 419 自身の未整備 (下記)。

## (2) PLAN-L7-419 は実装 admission 不可 (blocking 6)

- **B-1 PLAN 実体の欠落**: main の PLAN-L7-419 は全 38 行、本文は 3 文のみ。kind=add-impl でありながら **工程表が無い** (plan-schedule lint は §工程表 と並列/直列の明示を要求する)、**AC / DoD の checkbox が無い** (本文は「DoD は…」と散文で述べるだけ)、**`review_evidence` キー自体が存在しない**。confirm へ動かした瞬間に governance gate が落ちる。
- **B-2 依存が宣言されていない**: `requires: []` のまま。本文自身が「419 は 418 の identity/evidence/reservation port 確定後に開始する」と述べているのに、418 は `references` にしかない。`references` は依存ではない。(1) より昇格は可能なので、これは単に未実施。
- **B-3 Red-freeze が 8 本中 7 本存在しない (最重要)**: 419 は「U-FSM-001..007/P-FSM-001 を Red freeze し」と主張するが、docs/test-design/harness/L7-unit-test-design.md に登録されているのは **`CANDIDATE-P-FSM-001` の 1 件だけ** (1348 行、Red 入力「generator が作る任意 event 列」/ 期待結果「非許可状態到達 0、sequence 違反は必ず exit 1」)。**U-FSM-001..007 は 0 件**。唯一の他ヒット (2295 行) は U-OIDGATE-001 の fixture 記述で、同行が「candidate 台帳への再掲ではなく fixture 入力の記述」と明記して一意性検査の対象外としている。加えて台帳の命名は `CANDIDATE-<id>` 形式であり、419 本文の `U-FSM-001..007` 表記は台帳規約と一致しない。**Red-freeze 済みという主張は実測と食い違う** (coding ≠ substance)。
- **B-4 実装面が凍結されていない**: main に `src/forward/` は存在しない。`generates` は PLAN doc 2 件のみ。draft として先行宣言しないのは正しい (merged-plan-status / duplicate-artifact-ownership) が、裏を返せば **bounded な実装 surface がまだ凍結されていない**。
- **B-5 GitHub Issue が無い**: `gh issue list --state all --search` で L7-419 / Forward FSM を検索しても該当は #145 (27 PLAN numeric-core collisions の rekey 再設計) のみで、419 の成果目標を持つ Issue / sub-issue が存在しない。docs/governance/github-issue-hierarchy.md は bounded slice を正式な sub-issue にすることを要求する。
- **B-6 Reverse 対の phase が実体と矛盾**: PLAN-REVERSE-419-forward-fsm-backfill は実在するが 31 行 / status=draft / **workflow_phase=R4** / updated 2026-07-10。R0〜R3 の証跡が無いまま R4 を名乗っている。比較対象として PLAN-REVERSE-473 は R0→R1→R2→R3 の各 guard を通過してから R4 へ入っている。

## (3) 最小の前提 slice (実装は停止したまま)

**docs-only の pair-freeze PR を 1 本**。`src/` と `tests/` には一切触れない。

1. `docs/test-design/harness/L7-unit-test-design.md` へ `CANDIDATE-U-FSM-001` 〜 `CANDIDATE-U-FSM-007` を、1348 行の `CANDIDATE-P-FSM-001` と同じ表形式 (candidate / Red 入力 / 対象 / 期待結果) で登録する。Red 入力と期待結果は実際に落ちる条件で書く (件数を証拠にしない)。
2. PLAN-L7-419 の本文を実体化する: §工程表 (各 step に並列/直列と理由)、AC の checkbox、設計判断節、`review_evidence: []` キーの追加。
3. `requires: [PLAN-L7-418-plan-asset-v2-adapter-migration-ledger]` へ昇格し、根拠として CI run 32243313698 の全回帰 green と U-PA-043..048 の test 名を引用する (L7-418 は confirmed なので requires 可)。
4. IMP-156 を `observed` から遷移させ、U-PA-043 / U-PA-044 を根拠として引用する。遷移させない判断を採るなら、どの要件が未達かを実測付きで書く。IMP-167 は「後続 Reverse で閉じる」disposition を明記して 419 の前提から外す。
5. 419 の成果目標を持つ GitHub Issue / sub-issue を canonical parent の下に起票する。
6. PLAN-REVERSE-419 の `workflow_phase` を実体 (R0) に合わせるか、R4 を維持する根拠を書く。

**禁止スコープ (この slice)**: `src/forward/**` の作成、CLI registrar の配線、実行可能テストの追加、`generates` への `src/forward/**` 先行宣言 (実装 commit と同一 commit でのみ昇格)。

**次の依存**: 上記 docs-only PR が exact HEAD CI green + Claude 非著者 closing PASS で main へ到達すること。それまで luna 実装は起動しない。到達後、B-3 で登録した candidate を Red で固定する実装 slice へ進む。

## 攻撃観点の記録 (claim-blind / spec-blind)

claim-blind: 419 の「U-FSM-001..007/P-FSM-001 を Red freeze し」という主張を台帳の実測で反証した (7/8 不在)。spec-blind: 419 自身が主張する「IMP-156 未解消のため requires 昇格を保留」を、IMP-156 の要件文と U-PA-043/044 の test 名の対応で反証した (要件は充足済み、台帳が stale)。両方向とも prose と test 件数を証拠にしていない。
