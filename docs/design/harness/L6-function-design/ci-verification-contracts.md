# L6 機能設計: CI trigger・NFR 検証 core・L 別検証契約・内部/外部 CI 責務

PLAN-L6-82 / 87 / 89 / 90 から還流した契約。`function-spec.md` の `GithubCiPolicy` / harness-check aggregate 節は重複させず参照する。実装の有無は節ごとに明記する。

## 1. 全 PR 共通 harness-check trigger (PLAN-L6-82、実装済み: PLAN-L7-434)

1. `pull_request` は base branch を限定しない (`branches` / `branches-ignore` を置かない)。`push` trigger は main 限定を維持する。
2. branch protection の required status check 名は `harness-check` 1 本のまま不変。
3. source workflow・source template・Pack template・setup builtin の 4 artifact が同一 trigger 契約を持ち、detector は profile 重複で mirror を捨てず全件読む。
4. `github-ci-policy` detector は main 限定 trigger への退行、不正な trigger 型、workflow-level path filter、不完全・未知・重複 activity types、push main 限定の欠落を violation にし、`permissions: {contents: read}` 完全一致を直接検査する。workflow 本文から profile を推論せず、構造異常は throw せず violation 化する。
5. branch 命名契約は本契約の範囲外 (branch は隔離だけ、工程の正本は PLAN と harness.db)。

oracle は `docs/test-design/harness/L7-unit-test-design.md` の `U-CIPOL-001..012` に既存。

## 2. NFR Contract / Evidence / Gate core (PLAN-L6-87、未実装の目標契約)

L4-31 の 5 層方式を降ろす機能契約。実装 (zod schema・gate core・adapter) は未着手で、後続の add-impl が所有する。

- NFR Contract: 必須 field (id / category / stage / environment / metrics)、12 category の enum。未知 category・閾値欠落・stage 未定義は parse で reject。metrics 語彙に percentile 指標を含め、平均値のみの性能判定を型で不可能にする。
- Normalized Evidence: `contract_id` / `stage` / `profile_id` / `environment` / `tool.name` / `tool.version` / `measured` / `thresholds` / `verdict` / `executed_at` / `artifact_digest` (sha256) を必須とし、contract の version/digest も持つ。raw ツール出力は evidence artifact として別置し、gate は normalized row だけを参照する。測定回数・warmup・分散が契約宣言を満たさない evidence は verdict=pass でも reject (単発・mean-only を不可能にする)。
- gate core の fail-close 9 条件: (a) 必須契約に evidence なし (b) 対象外環境の流用 (c) tool version 不明 (d) digest 不一致 (e) 閾値超過 (f) 期限切れ (g) stage 不一致 (h) manual evidence の人間承認欠落 (i) contract version/digest 不一致。各条件に finding 型と doctor 統合点を持つ。evidence は `anchor_commit` + append-only receipt へ束縛する (digest は自己申告で単独では改竄検知にならない)。
- Tool Adapter port は `(rawOutput, contract) → NormalizedEvidence` の純関数で、verdict の決定 (閾値判定) は gate core だけが所有する。`verify recommend` は変更ファイル・NFR category・stage・環境から推薦 profile 集合への決定論写像で、既存 `SIGNAL_TO_PROFILE` に NFR signal を足す。
- 未達 DoD: 9 条件それぞれの負系 fixture、gate core の self-proof 方針 (mutation survivor 0) の L7 trace、pass/fail 両再現の oracle (3 profile)。oracle は `docs/test-design/harness/ci-verification-contracts-test-design.md` に `CANDIDATE-` で置いた。
- 依存: gate core は NFR Contract 型契約の schema を入力にする (実在する依存)。

## 3. L 別検証契約 verification_contract (PLAN-L6-89、未実装の目標契約: 所有 PLAN-L7-456)

- L4↔L9、L5↔L8、L6↔L7 の各設計成果物は対の検証層への `verification_contract` を必須で持つ。構造化 field: `invariant` (設計本文の節参照付き) / `oracle` (pair test-design に実在する ID) / `negative_boundary` (欠落・改変・stale・重複) / `evidence_source` (test run / CI run / audit + digest anchor) / `verdict_rule` / `command`。prose の主張は契約と認めない。
- PLAN の DoD/AC 各項目は oracle ID または evidence ID へ双方向に trace する (AC→oracle と oracle→AC。orphan test と claim-only AC を同時検出)。unchecked DoD・oracle 未実在・evidence digest 欠落を持つ PLAN の confirmed 化と merge は fail-close。
- coverage scope: 契約は対象 oracle 集合・成果物集合を宣言し、gate は「宣言 scope ⊆ 実測 Green 集合」を照合する。部分実装の Green を上位設計全体の Green に昇格しない。
- Redesign は origin correction・replacement PLAN・supersedes と back-reference・reentry・implementation target を同一 prospective graph で検証し、graph の一部の Green を全体の完了と判定しない (節点は plan admission receipt と supersession gate の既存機構へ束縛)。
- post-merge aggregate gate が main merge 後の stale 化 (pair test-design の後退・oracle 削除・digest 不一致) を再評価し Issue projection へ戻す。
- 検出器へ設計を合わせない: 契約が正本で、検出器は契約から生成・更新する。矛盾時は契約側の改訂 PLAN を要求し、検出器の黙認緩和 (fail-open 看板替え) を禁じる。
- supersession: 本契約は PLAN-L6-72 の evidence policy 部分を差し替える (Forward FSM 遷移契約 `U-FSM-*` / `P-FSM-*` は存続)。
- 未達 DoD: pair schema と正規形の固定、`U-LVC-*` (CANDIDATE として test-design へ)、PR #103 型・A-189 型 fixture の拒否、requirements/concept/ADR への backprop 方針の記録。

## 4. 内部 CI / 外部 CI の責務分担と pre-push subset gate (PLAN-L6-90、未実装の目標契約: 所有 PLAN-L7-457 想定)

- 不変条件: 全 gate は内部 (著者ローカル、60 秒以内を目標) か外部 (GitHub `harness-check`: 全回帰・OS 依存面・aggregate required context) のどちらかに属し、責務欠落は fail-close。内部は外部の代替ではなく前段で、内部 green は push 可否のみに使い、merge 可否は外部 required context だけが決める。外部 lane の絞り込みは `github-ci-policy` の機械保証下でのみ許可し、内部 gate の存在を理由に外部 gate を削らない。内部 gate は決定論的検査を優先し full vitest・full doctor を含めない。
- pre-push subset gate は変更種別 (PLAN-L7-455 の lane 分類器と同一の分類器を共有) × gate で選ぶ: doc/PLAN 変更 = `plan lint`・変更 PLAN の frontmatter safeParse・review-evidence lint (IMP-077 順序含む)・plan-supersession 解析、src/tests 変更 = `plan lint`・typecheck・biome・変更 module 対応の targeted vitest、memory 変更 = memory frontmatter 検証。分類不能は全 gate 実行 (fail-close)。`scripts/git-hooks/pre-push` に載せ、warn-only から始めて一致率の実績で fail-close へ昇格する (昇格は PO 判断)。
- 一致率計測: push ごとに内部 gate の verdict + digest を記録して外部 CI run と突合する。内部 green→外部 fail は gate の穴として追加候補を自動起票 (検出器は本契約から生成)、内部 fail→push 断念は節約時間として集計し、harness.db projection で可視化する。
- 未達 DoD: 責務マトリクスの oracle 証明、実測 4 例 (memory frontmatter / requires_not_ready / runner enum / reviewed_at 順序) の回帰 fixture、外部 required context が導入前後で不変である detector 証明、各代表 PR で 60 秒以内の実測、乖離 A の起票経路。依存: §1 の trigger 契約 (required context 不変) を前提にする。
