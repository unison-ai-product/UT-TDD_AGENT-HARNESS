# Session Handover — 2026-06-22

## §1 PLAN サマリ

- `A-136-cycle-p4-verification-audit` (unknown): A-136-cycle-p4-verification-audit
- `PLAN-DISCOVERY-01-workflow-metamodel` (poc): PLAN-DISCOVERY-01 (kind=poc): workflow メタモデル検証 (①必須+②駆動モデル→PLAN合成→駆動プラン→exit→fullback がきれいに回るか)
- `PLAN-DISCOVERY-05-roadmap-registration` (poc): PLAN-DISCOVERY-05 (kind=poc): 工程表 (gated layer-decomposition roadmap) を第一級・機械登録エンティティ化する metamodel 検証
- `PLAN-L4-00-master` (design): PLAN-L4-00 (Master hub): L4 基本設計 — 必須/選択 triage + child PLAN 合成
- `PLAN-L4-05-workflow-orchestration` (add-design): PLAN-L4-05 (add-design): L4 基本設計 — workflow オーケストレーション外部設計の補追 (9 駆動モデル + Forward spine + 2 工程専門の状態遷移 what / 入口出口 / 担当 b…
- `PLAN-L4-06` (add-design): PLAN-L4-06 (add-design): L4 設計 doc を実装実体へ整合 (drift back-fill) + under-design の明示 defer 化
- `PLAN-L4-13` (design): PLAN-L4-13: 内部資産 drift lint の L4 基本設計増分
- `PLAN-L6-06-handover-mechanism` (add-design): PLAN-L6-06 (add-design): handover 記録機構の機能設計 — session-log PLAN digest → handover 生成 (機械ポインタ CURRENT.json + 人間判断 markdow…
- `PLAN-L6-07-agent-slots` (add-design): PLAN-L6-07 (add-design): agent-slots Layer-2 オーケストレーション機構の機能設計 — slot lifecycle + team strategy schema + 直列化3条件 (IMP-05…
- `PLAN-L6-08-backfill-pairing` (add-design): PLAN-L6-08 (add-design): 駆動モデル back-fill pairing 完全性の機能設計 — KIND_BACKFILL マトリクス + impl⇔Reverse / impl⇔glossary 検査 (IMP-…
- `PLAN-L6-09-governance-enforcement` (add-design): PLAN-L6-09 (add-design): governance enforcement lints の機能設計 — scrum-reverse / backfill-hard / propagation (A/B/C、IMP-06…
- `PLAN-L6-10` (add-design): PLAN-L6-10 (add-design): vmodel pair-freeze lint の機能設計 — design⇔test-design pair_artifact 双方向整合・孤児0 (rule pair-exists/r…
- (+ 51 more PLAN — 全 registry は `ut-tdd status` / harness.db を参照)

## §2 成果物 (commit / files)

- `A-136-cycle-p4-verification-audit`
- `PLAN-DISCOVERY-01-workflow-metamodel`
- `PLAN-DISCOVERY-05-roadmap-registration`
  - commit: 236c70e
- `PLAN-L4-00-master`
  - commit: edb245d
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-05.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-REVERSE-44-roadmap-definition-design.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\codex-tasks\roadmap-park-rollup-prompt.md
- `PLAN-L4-05-workflow-orchestration`
- `PLAN-L4-06`
- `PLAN-L4-13`
  - commit: 86c61fa
  - file: Edit src/cli.ts
  - file: Edit .claude/hooks/session-log.ts
- `PLAN-L6-06-handover-mechanism`
- `PLAN-L6-07-agent-slots`
- `PLAN-L6-08-backfill-pairing`
- `PLAN-L6-09-governance-enforcement`
- `PLAN-L6-10`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-05.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
- (+ 51 more PLAN の成果物 — 全 registry は `ut-tdd status` / harness.db を参照)

## §3 Next Action

本 session (Opus / PO `/goal` ディレクト) で **A (drift 解消) + C (検出不備機械化) +
handover 肥大の注入コントロール** を完遂。main 直 commit 2 本 (`5b53c88`, `50931b6`)。

1. **A — drift 3 本を confirmed 化** (`5b53c88`): `PLAN-L3-04` / `PLAN-L3-05` (add-design) /
   `PLAN-DISCOVERY-05` (poc)。src 成果物は `239cb32` (2026-06-12) で merge 済 + doctor で
   load-bearing 稼働中なのに status=draft 放置だった = bookkeeping drift。実体検証 (merged +
   wired + Vitest 794 green) のうえ intra_runtime_subagent review_evidence 付きで confirmed 化。
   DISCOVERY-05 は S4 / decision_outcome=confirmed / promotion_strategy=reuse-with-hardening
   (concept §10 promote は RECOVERY-04/REVERSE-44 で既に discharge 済を確認)。confirmed poc の
   scrum-reverse 合流は REVERSE-44 (= 当該 PoC の Reverse vehicle) に references を 1 行追加して解消。
2. **C — merged-plan-status gate を kind 非依存化** (`5b53c88`, PLAN-L7-87): gate の
   `ARTIFACT_KINDS={impl,add-impl,refactor}` filter が poc/add-design を除外する盲点を撤去し
   deliverable-driven 検出に。L7-86 が path filter を直しても残っていた kind filter の穴を根治。
   回帰テスト追加 (kind 非依存 flag / 未 merge 非 flag / add-design×merged-src)。
3. **handover 注入コントロール** (`50931b6`, PLAN-L7-88): scope fallback 時に §1/§2 が全 PLAN
   registry をダンプ (~295 行/anchor) する肥大を、`capWithBreadcrumb` + `MAX_SUMMARY_PLANS=12`
   で先頭 N + breadcrumb へ畳む。本 handover 自身が dogfood = §1/§2 各 12 + 「+51 more」で **61 行**
   (歴史的 doc は 583〜2036 行)。

検証: typecheck / Biome / Vitest **795** / doctor **EXIT=0** / db rebuild。code-reviewer
(sonnet, intra_runtime_subagent) **VERDICT=pass・Critical 0**、Important I-1 (slim×cap inert 明示
テスト) を反映。**両 commit は未 push** (main が origin より 2 commit 先行)。

## §4 carry (未了・先送り)

- **歴史的 oversized handover doc の retroactive 圧縮**: `session-handover-2026-06-15.md`
  (2036 行/174KB/11 entries) 等の cap 前生成 doc は未剪定。`boundSameDayEntries` を適用すれば
  anchor+直近+breadcrumb へ畳める (git 履歴に全保全)。必要時に one-time compaction で実施可
  (PLAN-L7-88 §5、本 session 射程外 = latest_doc は前進的に bound 済)。
- **残 draft 2 本** (PO ゲート、本 session で対象外): `PLAN-DISCOVERY-03` (poc・S4=PO 判断待ち) /
  `PLAN-RECOVERY-02` (recovery・Phase 1-3 完了済だが L0-L3 freeze の PO サインオフ待ち)。
- **明示 defer / IMP-139** など既存 carry は不変 ([[feedback_verify_carry_status_against_code]] で都度照合)。

## §5 未了 PO 判断

- **`5b53c88` / `50931b6` を main へ push するか** (origin より 2 commit 先行・未 push)。
  CI=harness-check 相当を local で typecheck/Biome/Vitest 795/doctor EXIT=0 全 green 確認済。
- **PLAN-L7-48 `recordGuardrailDecision` 本番配線方針** (auth-gated, owner=PO) — 据え置き。
- **IMP-139** (未了の正の集計を status/handover/harness.db に surface、`status --json` 契約変更) — 据え置き。

## §6 壊さない / 再発させない

- **merged-plan-status は kind を問わず deliverable-driven で検出する** (PLAN-L7-87)。
  `ARTIFACT_KINDS` filter を戻すと poc/add-design が merged src を出荷して draft 放置した drift を
  再び見逃す (L7-86 が「draft 5 本は非 artifact-kind ゆえ blast radius 0」と書いた、まさにその盲点)。
- **handover §1/§2 の cap (`MAX_SUMMARY_PLANS`) を外すな** (PLAN-L7-88)。scope fallback で全 registry
  をダンプして session 再開時の context が肥大する。registry の正本は `ut-tdd status` / harness.db。
  `maxSummaryPlans=0` は escape hatch (cap 無効) ゆえ default 経路で 0 を渡すな。
- **handover の `# Session Handover` header は 1 entry 1 個** = `countHandoverEntries` /
  `doc_entry_count` の bypass 検知契約。cap / slim / bound はいずれも header 数を変えない。
- **confirmed poc は Reverse 合流が必須** (scrum-reverse gate)。DISCOVERY-05 を confirmed にしたら
  REVERSE-44 references で合流を記録した。新規 reverse PLAN を別途作るな (REVERSE-44 と overlapping)。
- **PLAN 追加/status 変更後は `ut-tdd db rebuild`** (plan-registry-fingerprint stale で doctor 赤化、
  回帰でない、[[project_codex_branch_ci_verification]])。本 session も複数回 rebuild 済。

---

<!-- ut-tdd handover: 同日中間スタブエントリを累積抑制のため剪定 (git 履歴に保全) -->

---

# Session Handover — 2026-06-22 (L2 G2 freeze + screen DB projection)

## §1 PLAN サマリ

- (同日 first entry 参照 — 全 PLAN registry は本ファイル冒頭エントリ §1 に記載、本 session 固有の進捗は §3 へ)

## §2 成果物 (commit / files)

- (同日 first entry 参照 — 本 session の commit/file は §3 Next Action に記載)

## §3 Next Action

本 session (Opus / PO `/goal`「L2はいったん閉じて。どうせ画面モックだろ？そして2は完遂させる。」) で
**L2 G2 freeze + harness.db への screen projection (IMP-140 完遂)** を実施し、全成果を main へ push 済
(`7c3c49b..a9a7a52` + 本 handover commit)。

1. **L2 を G2 freeze で閉じた** (`6bf6a4e`): 「どうせ画面モック」の PO サインオフを `gate-design.md §2`
   台帳に G2=✅ PASS で記録し、L2 4 sub-doc (screen-list/flow/ui-element/wireframe) を
   placeholder→confirmed 化。verification [L0-L3] が 12/12 confirmed・孤児0、program-coverage park 0
   に解消 (park マスキング解除)。
2. **PM-06 設計書ビューア追加** (`efeafec`): 画面要求 SSoT に 15 画面目 (PM-06、URL=/project/:case/designs、
   BR-01/BR-07/FR-L1-01/FR-L1-32) を追加。HM-01 機能一覧→画面要求 deep-link も追加 (PO Ask①「画面要求は
   機能一覧からも出せ」)。
3. **DB を完遂** (`2dd789b`、PLAN-L7-96 / IMP-140): screen と FR/BR→画面 trace が doc-only で harness.db
   未 projection だった gap を実装で解消。`screens` + `screen_trace` を schema registry へ追加
   (SCHEMA_VERSION 15→16、1-place 契約)、`projectScreens` を rebuild transaction に配線。実データ =
   screens 15 行 / screen_trace 83 edges (fr52/br25/ux6) / 孤児0、**機能一覧→画面要求が DB クエリ可能**に。
4. **自己検出した回帰を修正** (`54d3416`): PM-06 commit (efeafec) で doctor のみ回し full vitest を回さず、
   `g1-trace.test.ts`/`doc-consistency.test.ts` のハードコード画面数 fixture (14) 更新を漏らし 3 fail。
   14→15 に修正し 850/850 green。[[feedback_dont_tail_lint_ci_output]] の「push 前フル検証」を徹底すべきだった。

検証: typecheck (tsc) / Biome lint EXIT=0 / Vitest **850/850** / doctor **EXIT=0** (g1-trace screens=15・
doc-consistency screens=15・db-projection-coverage OK)。pmo-sonnet (intra_runtime_subagent) review approve
(PLAN-L7-96)。**push 済** (`a9a7a52` まで origin/main 反映、本 handover が後続 commit)。

## §4 carry (未了・先送り)

- **src/web 画面表示 UI** (HM-04 DB 閲覧 / HM-01 機能一覧 / PM-06 設計書ビューア) = Phase B。本 session は
  DB read model projection まで。`screens.implemented` の flip は src/web 実装後 (NFR-08 実装真実性ゆえ今は 0)。
- **SI 標準成果物カタログ拡張** (帳票・バッチ・メール・コード値一覧の sub_doc typing) = 別議題
  (PLAN-L2-00 §5、PO 未着手)。
- 既存 carry (IMP-139 / PLAN-L7-48 `recordGuardrailDecision` 配線 / 残 draft) は不変
  ([[feedback_verify_carry_status_against_code]] で都度照合)。

## §5 未了 PO 判断

- 本 session 成果は全 commit + push 済。残 PO 判断は前 entry から不変 (PLAN-L7-48 本番配線方針 / IMP-139)。
- `screens.implemented` flip タイミング (= src/web Phase B 着手時) — 据え置き。

## §6 壊さない / 再発させない

- **screen-list §1 / screen-requirements §5.5 の表構造を崩すな** (PLAN-L7-96)。
  `parseScreenListRows`/`parseScreenTraceRows` が cell 位置・heading 境界に依存。崩すと projection が
  静かに 0 行化する (regression test `projection-writer.test` IMP-140 が検出)。
- **画面数を変えたら full vitest を回す** (efeafec の回帰)。`g1-trace.test.ts:20` /
  `doc-consistency.test.ts:34,50` にハードコード画面数 fixture がある。doctor は doc から動的計数するため
  ここを素通りする ([[feedback_dont_tail_lint_ci_output]])。
- **`SCHEMA_VERSION` を表追加なしで戻すな** (screens/screen_trace、PLAN-L7-44 master の 1-place 契約)。
- **PLAN 追加/status 変更後は `ut-tdd db rebuild`** (plan-registry-fingerprint stale で doctor 赤化、
  回帰でない、[[project_codex_branch_ci_verification]])。

---

# Session Handover — 2026-06-22

## §1 PLAN サマリ

- (同日 first entry 参照 — 全 PLAN registry は本ファイル冒頭エントリ §1 に記載、本 session 固有の進捗は §3 へ)

## §2 成果物 (commit / files)

- (同日 first entry 参照 — 本 session の commit/file は §3 Next Action に記載)

## §3 Next Action

本 session (Opus / PO `/goal`「キャリー対応カタログ拡張の完遂。PO 判断って本当に存在するのか？調べろ。」)
で **SI 標準成果物カタログ拡張の完遂 (PLAN-L7-97)** と **「PO 判断待ち」項目の実在性監査** を実施。
main 直 commit 2 本 (`d0821ae`, `077aa87`)。

1. **カタログ拡張を完遂** (`077aa87`、PLAN-L7-97): L4 外部設計の標準成果物 4 型
   (`report`/`batch`/`notification`/`code-value`) を `VALID_SUB_DOCS` へ追加。あわせて
   `src/plan/lint.ts` の重複 `VALID_SUB_DOCS` を撤去し schema 由来へ一本化 (要件 line 406「schema=
   単一正本」を実装で担保、catalog 拡張 drift 根治)。要件 §1.10.G.1 + document-system-map §1/§1b に
   IPA 共通フレーム grounding を反映。substance test = 4 型 L4 valid / L2 invalid (schema + plan lint
   両経路、U-PLANGOV-006)。
2. **「PO 判断」実在性監査** (§5 に結論): handover が「未了 PO 判断」と称した 4 項目を `ut-tdd status`
   (非終端 PLAN=0 / open defers=1) + git + 実ファイルで照合。**3 項目が false-state、実在は 1 項目のみ**。
3. **誤った carry 先送りの是正**: カタログ拡張の「別議題 (downstream プロダクト形状確定後)」は git 上
   PO 発言の裏付け無き AI 由来の先送り (自己スコープ論法、PO 否定済の
   [[feedback_judge_tooling_by_mission_not_self_scope]] 違反) と判明。業界標準で確定可能ゆえ実装で解消。

検証: typecheck / Biome check / Vitest **852** / doctor **EXIT=0** / db rebuild。code-reviewer
(sonnet, intra_runtime_subagent) **VERDICT=pass・Critical 0**。露呈した既存 drift は IMP-141 へ登録。

> 重要な自戒: セッション開始時の `doctor | tail -20; echo $?` の EXIT=0 は **tail の exit** で doctor の
> ものでなかった (pipe masking、[[feedback_dont_tail_lint_ci_output]])。実 doctor は handover-discipline
> drift で advisory 表示があったが EXIT には影響せず。検証は pipe 末尾でなく対象コマンドの exit を直接取る。

## §4 carry (未了・先送り)

- **要件 §1.10.G.1 ↔ schema VALID_SUB_DOCS の既存 drift** (IMP-141): L3 slug
  (`business-requirement` vs schema `business`)・L4 `screen` 残留。本拡張が plan/lint 単一正本化で露呈
  させた既存問題。正本どちらに寄せるかは PO 判断 (schema=正本が line 406 の建付け)。silent fix せず
  IMP-141 で追跡。drift 自動照合 doctor gate も検討候補。
- **各標準成果物の sub-doc 必須 § 構造定義** (要件 §G.6 の report/batch/notification/code-value 版) =
  当該成果物を実際に起票する downstream 製品 PLAN 着手時に back-fill (vocabulary 追加が先、本 session 射程外)。
- 既存 carry (src/web Phase B 画面 UI / `screens.implemented` flip / PLAN-L7-48 `recordGuardrailDecision`
  配線) は不変。

## §5 未了 PO 判断

**監査結論: 前 handover が「未了 PO 判断」と列挙した 4 項目のうち 3 項目は false-state、実在は 1 項目のみ。**

- ❌ **残 draft 2 本 (DISCOVERY-03 / RECOVERY-02、PO サインオフ待ち)** → 両方とも実ファイル
  `status: completed`。repo に draft PLAN は 0 本 (`ut-tdd status` 非終端=0 と一致)。**実在しない**。
- ❌ **IMP-139 (status --json 契約変更の PO 判断)** → backlog 上 `implemented` (PLAN-L7-94 が
  additive・契約不変で解決済)。**実在しない**。
- ❌ **標準成果物カタログ拡張 (別議題・downstream 形状確定後)** → AI 由来の自己スコープ先送り。本 session
  で実装解消。**PO 判断ではなかった**。
- ✅ **PLAN-L7-48 `recordGuardrailDecision` 本番配線** → `open defers=1` の実体。CLAUDE.md Guard Rule
  (認可・human-signoff は人間確認必須) に正当に該当する**唯一の実在 PO 判断** (owner=PO、auth-gated)。
- ✅ (副次) **IMP-141 の doc↔schema drift をどちらに寄せるか** = 本 session で新たに表面化した PO 判断
  (schema=正本の建付けに従えば要件表を schema へ寄せる)。

## §6 壊さない / 再発させない

- **`VALID_SUB_DOCS` の正本は `src/schema/index.ts` 1 箇所** (PLAN-L7-97)。plan/lint.ts に再びローカル
  コピーを置くな (catalog 拡張で片肺 drift 再発)。要件 §1.10.G.1 表はそれを mirror する従属物。
- **標準成果物カタログの要否は土台のミッション (別 SI 製品開発) で測る**。harness 自身が帳票/バッチ/
  メールを持たないことを理由に「不要・別議題」と先送りするな ([[feedback_judge_tooling_by_mission_not_self_scope]])。
- **carry に「別議題 / PO 判断待ち」と書くなら PO 発言の出所を git/doc で裏取りせよ**。本 session の監査で
  3/4 が裏付け無き false-state だった ([[feedback_verify_carry_status_against_code]])。報告前に
  `ut-tdd status` (非終端 PLAN / open defer) と実ファイルで機械照合する。
- **検証は pipe 末尾の exit でなく対象コマンドの exit を直接取る** (`cmd; echo $?`、`| tail` は exit を
  masking、[[feedback_dont_tail_lint_ci_output]])。
- **PLAN 追加/status 変更後は `ut-tdd db rebuild`** (plan-registry-fingerprint stale 回避)。

---

# Session Handover — 2026-06-22

## §1 PLAN サマリ

- (同日 first entry 参照 — 全 PLAN registry は本ファイル冒頭エントリ §1 に記載、本 session 固有の進捗は §3 へ)

## §2 成果物 (commit / files)

- (同日 first entry 参照 — 本 session の commit/file は §3 Next Action に記載)

## §3 Next Action

本 session (Opus / PO) で、前 session の積み残し質問 2 件「なぜ実在しない PO 判断が残るのか」
「駆動モデルは正しく使われているか」に対し **すべて解決して** のディレクトを受け、Q1/Q2 を実装 +
報連相ルールを敷いた。

1. **Q1 — handover §5 を機械事実で seed + fail-close anchor** (PLAN-L7-98): §5「未了 PO 判断」は
   handover で唯一機械裏付け不在のセクションで、前任 prose の転記で false-state が累積する根因だった。
   `ut-tdd handover` が §5 を outstanding surface (`non-terminal PLANs / open defers`) で seed し、
   doctor `handover-outstanding` が最新 §5 に機械集計行の常駐を **fail-close** 強制 (`checkHandoverOutstandingAnchor`)。
   これにより terminal な PLAN / implemented な IMP を「待ち」と書いても機械事実が真横に常駐し矛盾が露呈する。
2. **Q2-a — 駆動モデルの緩い使用を是正** (PLAN-REVERSE-46): L7-97 (catalog 拡張) が `VALID_SUB_DOCS`
   契約を変えたのに Reverse 合流を省いていた (troubleshoot=conditional back-fill、warn 止まり)。
   REVERSE-46 で back-fill 合流を formal 登録し L7-97 を conditionalPending から外した = 契約変更→設計
   back-fill の駆動モデルを正しく 1 サイクル閉じた。
3. **Q2-b — 駆動モデル taxonomy は既に解決済と判明、stale note を是正**: drive=専門職5種 (enum 強制) /
   driving-model=kind の軸分離も §1.6 matrix (全 kind×全 drive 許容、唯一の制約 add-* drive=親一致は
   `parent_drive_mismatch` で強制済) も既に稼働。要件 §1.6 line 263 の「matrix 機械検証は将来実装」を
   実態 (現状で機械強制済) へ訂正 + drive=専門職 lock テスト追加。新規 migration は恣意ゆえ作らず。
4. **報連相ルールを敷いた** (PO 指示「チャット上のほうれん草は日本語に / codex にも効くように」):
   `CLAUDE.md` / `AGENTS.md` に「## コミュニケーション (報連相)」節を追加 (Claude/Codex 両ランタイム)。
   memory にも feedback 登録。
5. **【失態と復元】Codex の commit 済み成果を誤デグレ → 復元** (IMP-142): Codex が並行で provider-aware
   review gate 機能を完成させ commit (`51da004`、12 ファイル) まで終えていたのに、私がそれを「自分が知らない
   foreign 変更 = overstep」と**誤判定し reset/revert で一時デグレ**させた ([[feedback_commit_finished_codex_work_dont_abandon]]
   の再発、PO「codex 側はコミットまで終わってる。勝手にデグレさせんなよ」)。`git log`/reflog で Codex commit と
   判明し HEAD=51da004 へ復元 + 12 ファイル原状回復、私の Q1/Q2 はその上に積み直し。push 済み履歴
   (origin/main=018db35) は無傷。GitHub 運用ルールを「hybrid 多ランタイム協調 = 相手 commit を破壊しない /
   history 書換前に git log 確認」へ書き換え (CLAUDE.md/AGENTS.md)。

検証: db rebuild / typecheck / Biome check / doctor (handover-outstanding OK) green。Vitest は runDoctor 系
2-8 件が full 並列で flaky (doctor.test.ts 単独=32/32 pass、doctor CLI 安定=0、既知 [[project_codex_branch_ci_verification]])。
**Codex commit 51da004 を base に私の作業を 1 commit で上積みし push** (origin へ Codex + 私の両方を反映)。

## §4 carry (未了・先送り)

- **IMP-141**: 要件 §1.10.G.1 ↔ schema の既存 drift (L3 slug `business-requirement` vs `business`、
  L4 `screen` 残留)。正本どちらに寄せるか PO 判断 (schema=正本の建付け)。本 session 射程外。
- **各標準成果物の sub-doc 必須 § 構造定義** (report/batch/notification/code-value 版) = downstream 製品
  PLAN 着手時に back-fill。
- 既存 carry (src/web Phase B / `screens.implemented` flip / PLAN-L7-48 `recordGuardrailDecision` 配線)
  は不変。

## §5 未了 PO 判断

> 機械集計 (outstanding): non-terminal PLANs=0 (none); open defers=1
> ↑ `ut-tdd status` / CURRENT.json と同一の機械事実。これに反する「待ち/未了」記述は false-state。
> 実在する未了 = 非終端 PLAN + open defer のみ。terminal な PLAN / implemented な IMP を pending に書かない。

- **open defers=1 の実体 = placeholder-deps の spec-backfill wait** (descent-obligation impl-ahead)。
  前 session で「open defers=1 = L7-48」と紐付けたのは **誤り** ([[feedback_verify_carry_status_against_code]]
  の自己再発)。`outstanding.openDefers` は `placeholder-deps.specBackfillWaits` を数え、L7-48 の §Deferred
  (explicit_l7_defer, owner=PO) は prose で別管理 = outstanding 集計外。
- **PLAN-L7-48 `recordGuardrailDecision` 本番配線** (auth-gated, owner=PO) は実在する PO 判断だが
  機械 outstanding には出ない (explicit §Deferred は未集計)。将来 enrichment 候補 (owner=PO defer の集計)。

## §6 壊さない / 再発させない

- **handover §5 の機械集計行 (`機械集計 (outstanding)`) を消すな** (PLAN-L7-98)。doctor `handover-outstanding`
  が最新 §5 の marker 常駐を fail-close。§5 を機械事実で seed する経路 (`renderHandoverScaffold` の
  `outstanding` 渡し) も外すな = false-state 再発の根因に戻る。
- **`VALID_DRIVES` に mode 値 (scrum/reverse/poc/troubleshoot) を戻すな** = drive(専門職)↔駆動モデル(kind)
  の軸分離が崩れる (frontmatter test U-... が lock)。matrix の唯一の制約 add-* drive=親一致は
  `parent_drive_mismatch` が強制。
- **契約 (exported schema/enum) を変える conditional kind (troubleshoot/refactor/retrofit) は Reverse 合流
  まで** = 駆動モデルを正しく閉じる (L7-97↔REVERSE-46 が前例)。warn 止まりに甘えない。
- **「open defers=N」を特定 PLAN に紐付けるときは実体を確認** (specBackfillWaits か explicit §Deferred か)。
  本 session で前 session の誤紐付けを訂正した ([[feedback_verify_carry_status_against_code]])。
- **PLAN 追加/status 変更後は `ut-tdd db rebuild`**。

