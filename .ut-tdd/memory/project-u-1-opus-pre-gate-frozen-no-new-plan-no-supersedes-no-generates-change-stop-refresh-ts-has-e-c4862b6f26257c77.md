---
memory_id: memory:project:u-1-opus-pre-gate-frozen-no-new-plan-no-supersedes-no-generates-change-stop-refresh-ts-has-exactly-one-owner-and-is-not-baseline-exempt
kind: project
title: "U-1 Opus pre-gate frozen: no new PLAN, no supersedes, no generates change; stop-refresh.ts has exactly one owner and is NOT baseline-exempt"
tags: ["governance", "issue-178", "luna", "plan-l7-365", "plan-l7-454", "pre-gate", "token-telemetry", "u-1"]
updated_at: 2026-08-19T10:33:45.564Z
---

U-1 (issue #178 / harness.db 4.73GB) の Opus 事前契約。Codex の補正通知 (feedback-u-1-contract-correction-stop-refresh-unfiltered-on-disk-path-and-plan-l7-454-governance) が Opus pre-gate へ委ねた「successor/supersedes・Reverse/backprop 要否」を実測で確定する。base = origin/main 427e07beb39700fc590097e7688b3231f3fe999a。実装は gpt-5.6-luna、Opus は非著者 closing。

## 確定した統治判断 (実測に基づく。luna は再導出せず従うこと)

1. **新規 PLAN を作らない。** C-1a (集約) は PLAN-L7-454 を拡張する。L7-454 は generates で src/state-db/projection-writer.ts / src/state-db/token-tracker.ts / tests/token-tracker.test.ts を既に所有し、いずれも ownership baseline 登録済み (docs/governance/deliverable-trace-debt-audit.md:345/350/411/441)。**generates への追加は一切不要。**

2. **src/state-db/stop-refresh.ts を他の PLAN の generates に絶対に書かない。** 実測: generates で宣言している PLAN は **PLAN-L7-365 ただ 1 件** (PLAN-L7-458 / L7-460 / PLAN-REVERSE-365 は本文言及のみで generates 非宣言)。かつ deliverable-trace-debt-audit.md に stop-refresh.ts の行は無く **ownership baseline 非登録**。analyzeArtifactOwnership (src/lint/artifact-ownership.ts:17) は planIds.length > 1 かつ baseline 非登録で fail-close するので、2 件目の宣言が入った瞬間に CI が赤化する。2026-08-19 に #338 で 2 回 / #339 で 1 回 CI を赤化させたのと同じ罠。C-1b の編集は L7-365 の既存所有のもとで行う。

3. **supersedes は宣言しない。** 根拠 4 点: (a) L7-454 の AC はどれも反証されていない (AC は ut-tdd db rebuild 経路に限定されており現在も真)。(b) 誤っているのは L7-365 全体ではなく実装節の loadRuntimeSessionUsage 条項 1 個だけ。(c) src/lint/plan-supersession.ts のヘッダ規定どおり、この gate は supersedes を宣言した PLAN のみ双方向 back-reference を検査し非宣言 PLAN は対象外。宣言すれば PLAN 全体の errata 扱い + 相互 back-reference + add-impl の Reverse 対 (PLAN-REVERSE-365) の再作業を 1 条項の訂正のために引き込む。(d) L7-365 自身に in-place 日付付き撤回の前例がある — 2026-07-21 の PR #100 エントリが「上記の『複数 Stop 競合を受容』は撤回し」と書き、後継 PLAN も supersedes も作らず訂正している。よって **L7-365 の実装節へ日付付き訂正注記を入れ、loadRuntimeSessionUsage 条項を撤回して repo scope の正本が L7-454 であることを明記する**方式を採る。

4. **backprop_decision: not_required を維持する。** docs/design/harness/L5-detailed-design/physical-data.md:141 は model_runs の列と PK (run_id) を定義するが **token 行の row grain を一切規定していない**。turn 単位は projectTokenUsage の実装選択であって設計契約ではないため、(runtime,sessionId,model) 集約は新契約ではなく修理。Reverse 対は不要。

## 矛盾の実体 (なぜ 4.73GB になったか、luna が背景として知っておくこと)

confirmed PLAN 2 件が on-disk DB への ingest 契約で矛盾している。PLAN-L7-365 は実装節で明示的に「refreshHarnessDbOnStop — full rebuild + token/cost ingest (telemetry scan 相当を統合、loadRuntimeSessionUsage + projectTokenUsage + projectModelEvaluations)」と無フィルタ経路を指定した。PLAN-L7-454 は設計判断記録で「非採択: 全量 ingest。理由 = 他プロジェクトの usage は帰属外、かつ DB サイズを桁で悪化させる」と決めたが、その決定文は「rebuild は」に限定され Stop 経路へ戻って直していない。L7-365 の DoD が「実ログ regression は未固定 → issue #82 へ送る」と書き、その #82 に答えたのが L7-454 という経緯であり、繋ぎ目が空いたまま残った。4.73GB はその隙間の実現値。

## gate 安全性の実測 (luna は再調査不要)

- **db-telemetry-provenance は on-disk DB を読まない。** src/doctor/db-projection.ts は 69 / 194 / 236 行すべて openHarnessDb(":memory:")。runtime_rows / valued_rows の判定は in-memory overlay 上で行われるので、on-disk 側の変更で壊れない。
- **drive-db-registration の modelRuns > 0 (src/lint/drive-db-registration.ts:94) は on-disk を読む** (loadDriveDbRegistrationStats → defaultHarnessDbPath、src/state-db/drive-registration.ts:163-166)。ただし model_runs には review-evidence 由来の projection 行も入るため、token 行が 0 でもこの gate は満たされる。集約後も当然満たされる。
- **run_id prefix の変更は安全。** token-run prefix の生産者は src/state-db/projection-writer.ts:700 の 1 箇所のみで、consumer は src/ tests/ 全体で 0 件。stableId (src/stable-id.ts) は値が [A-Za-z0-9._:-] だけなら `${prefix}:${value}` をそのまま返すので、id は文字どおり token-run:<runtime>:<sessionId>:<turnIndex> になっている。
- **callsite の注意点**: stop-refresh.ts:88-106 は options.claudeSessionsDir / options.codexSessionsDir を尊重するが、projectRepoScopedTokenUsage (projection-writer.ts:743) は repoScopedSessionDirs() = env のみを見て options を無視する。単純に差し替えると注入経路が消える。最小手は loadRepoScopedRuntimeSessionUsage(repoRoot, dirs) を解決済み dirs で直接呼ぶか、projectRepoScopedTokenUsage に dirs 任意引数を足すこと。tests/db-currency.test.ts:172,907 は空ディレクトリを注入しているのでどちらでも green のまま。

## 実装契約 (C-1a〜C-1d)

- **C-1a**: projectTokenUsage は (runtime, sessionId, model) 単位の集約行を書く。run_id = stableId("token-session", `${runtime}:${sessionId}:${model}`)。turnIndex を id に含めない。input/output/cached_input/reasoning tokens と cost_usd は同一キー内で合算する。
- **C-1b**: stop-refresh.ts:97 の無フィルタ loadRuntimeSessionUsage を repo-scoped 経路へ差し替える。on-disk DB へ書く経路は repo scope フィルタ経由のみとする。options の dirs 注入は保つ (上記 callsite 注意点)。
- **C-1c**: role="session" / plan_id="" / started_at="" の現行意味論は変更しない (PLAN-L7-192 が telemetry provenance を所有しているため provenance の意味論に触れない)。
- **C-1d**: 回帰テストで固定する — (a) 同一 session の複数 turn が 1 行に集約される、(b) 別 model は別行になる、(c) rebuild 後に旧 turn 行が消える、(d) 集約行の token 列が非 NULL で合計値が正しい、(e) repo 外 session が on-disk 経路で取り込まれない。
- **不変条件**: 行数の上界が (repo 帰属 session 数 × model 数) で決まり turn 数に比例しない。既存 DB を DELETE/DROP しない (U-3 の守備範囲)。

## スコープ外 (混ぜない)

U-2 (上限 / typed error)、U-3 (退避 / rebuild)、#340、Forward FSM / R3 / R4、および下記の physical-data.md drift 是正。1 PR = 1 論点。merge は exact HEAD CI green + Claude 非著者 closing PASS まで禁止。PR / merge 運用は Claude 側。

## 別件として起票すべき発見 (U-1 に畳み込まない)

docs/design/harness/L5-detailed-design/physical-data.md:150 は「deterministic `db rebuild` は source projection のままであり、user runtime log は scan しない」と規定するが、PLAN-L7-454 は repo-scoped runtime log ingest を rebuildHarnessDb へ配線した。設計 doc と実装が矛盾している。**ingest を外して直そうとしないこと** — issue #82 の申立て自体が「on-disk model_runs に実測 token 行がゼロ」だったので、外すと #82 を退行させる。stale なのは設計文の側であり、所有 PLAN のもとで doc 訂正が要る。独立 issue として起票する。

## advisor 相談の記録 (捏造しない)

`node src/cli.ts advisor --decision design --current-model claude-opus-5 --execute --plan PLAN-L7-454-runtime-token-telemetry-ingestion --task "<上記 7 点の実測と選択肢 A/B/C>"` を 2026-08-19 18:51 JST に発火。約 40 分で出力 0 バイト、.ut-tdd/logs/session/ に対応する advisor-* エントリも生成されず、応答を得られないまま停止させた。判断を保留せず継続した理由は CLAUDE.md §PO 判断への反射的エスカレーション禁止 に従う — 本件は高影響境界 (production infra / destructive data operation / auth / payment / PII / secret / licensing / 外部 API) に該当せず、上記 1〜4 が既存の層・責務・契約 (ownership baseline、plan-supersession の適用範囲、physical-data.md の row grain 非規定、L7-365 自身の in-place 撤回前例) から一意に決まるため。advisor が復旧したら本判断を事後照合してよいが、実装の着手条件にはしない。
