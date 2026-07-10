---
plan_id: PLAN-DISCOVERY-10-gpt56-tier-routing-bench
title: "PLAN-DISCOVERY-10 (kind=poc): GPT-5.6 (Sol/Terra/Luna) レーン別 replay ベンチ — orchestration routing への組み込み判断"
kind: poc
layer: cross
workflow_phase: S4
scrum_type: hypothesis-test
drive: agent
status: confirmed
decision_outcome: confirmed
promotion_strategy: redesign
route_signal: discovery
route_mode: discovery
created: 2026-07-10
updated: 2026-07-10
owner: PM (Claude) / PO (人間)
agent_slots:
  - role: po
    slot_label: "PO — S4 routing 変更採否 (MODEL_IDS SSoT 更新 = 規範変更ゲート)"
  - role: aim
    slot_label: "AIM — 仮説→lane→oracle の測定設計と S4 判断材料の整理"
  - role: tl
    slot_label: "TL (別 runtime) — ベンチ設計と判定基準のクロスレビュー"
  - role: se
    slot_label: "SE — S2 replay ベンチ実行 + 計測記録"
generates:
  - artifact_path: docs/plans/PLAN-DISCOVERY-10-gpt56-tier-routing-bench.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-75-cost-tiered-provider-router.md
    - docs/plans/PLAN-L7-254-judgment-gate-reviewer-tier-matrix.md
    - docs/plans/PLAN-L7-255-delegation-model-effort-injection.md
    - docs/plans/PLAN-L7-256-model-id-ssot-drift-gate.md
    - src/team/model-policy.ts
review_evidence:
  - reviewer: po
    review_kind: human
    reviewed_at: "2026-07-10T14:35:00+09:00"
    tests_green_at: "2026-07-10T14:20:00+09:00"
    verdict: approve
    scope: "S4 決定 (H2 worker→gpt-5.6-terra 採用 / H1 frontier→gpt-5.6-sol 採用 / H3 luna 保留)。実測は本 PLAN §5 の全 lane 記録 (W2 凍結テスト oracle 実走 = wt-bench での vitest green 62 件、W3 red/green 二面 oracle、W1 正解キー照合) に基づく。PO はチャットで仮説再定義 (Terra=主力/Sol=escalation、2026-07-10) から S4 採否まで段階承認。実装は後継 PLAN-L7-415 (kind=retrofit) に委譲し、本 PLAN は測定と決定の記録で閉じる。"
    green_commands:
      - kind: lint
        command: "bun src/cli.ts plan lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-10T14:20:00+09:00"
        evidence_path: docs/plans/PLAN-DISCOVERY-10-gpt56-tier-routing-bench.md
        output_digest: "sha256:db8d825c3b4b5c1679a365d0f3e95a3ab41fd8a741a49fc292fa1b28f2e1dbc4"
        anchor_commit: 9af32ba86bc658d5edde73bcd0664c5d8022063d
      - kind: smoke
        command: "bunx vitest run tests/session-log.test.ts tests/agent-guard.test.ts tests/relation-graph-loader.test.ts tests/setup.test.ts (W2 oracle: fix commit worktree にモデル出力を適用して凍結テストを実走、terra 4/4 green / gpt-5.5 3/4)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T14:20:00+09:00"
        evidence_path: tests/session-log.test.ts
        output_digest: "sha256:363b44844882f342615a786777263a86b41b9ac6491e5d873bf2b07c81e2f670"
        anchor_commit: 80a1b3830acb61fbb69d665629a0fde8b0d49a32
---

# PLAN-DISCOVERY-10 (kind=poc): GPT-5.6 レーン別 replay ベンチ

## 0. Objective (PO 指示 2026-07-10)

GPT-5.6 が Sol / Terra / Luna の 3 ティア構成で登場した。orchestration (tier-router /
judgment gate / 軽量並列 lane) へ組み込むため、**この harness の実レーンで現職モデルに
勝つか** を測り、routing 変更の採否を S4 で決める。

汎用ベンチスコアは routing 判断に使わない。判断はレーンごとの **現職との paired 比較**
のみで行い、明確な優位が出たティアだけ採用する (僅差なら現職維持。routing 変更自体に
コストがあるため)。

## 1. 前提 (確認済み、2026-07-10)

- Codex CLI を 0.128.0 → **0.144.1** に更新済 (npm global)。0.144.0 で GPT-5.6 ファミリ
  対応 (models.json 更新) が入っている。
- バイナリ model catalog に `gpt-5.6-sol` / `gpt-5.6-terra` / `gpt-5.6-luna` の 3 ID を確認。
- 3 モデルとも `codex exec -m <model> -s read-only` で live 疎通成功 (exit=0、応答一致)。
  本アカウントは preview アクセスあり。
- 運用上の罠 (S2 実行時に必須):
  - `codex exec` は stdin を読み続けるため、非対話実行では **stdin を閉じる**
    (`< /dev/null` 相当)。閉じないと無応答ハングする (2026-07-10 実測 20 分+)。
  - git repo 外の作業ディレクトリでは `--skip-git-repo-check` が必要。
- リスク: GPT-5.6 は limited preview 中 (GA は数週間後)。rate limit / 挙動変更の可能性が
  あるため、S2 の計測値には CLI version と実行日時を必ず添える。

## 2. 仮説表 (routing 仮説、S1 で凍結)

現職は `src/team/model-policy.ts` の `MODEL_IDS.codex` (SSoT) を基準とする。

| # | ティア | 対象レーン | 現職 (比較相手) | 採用基準 (合格ライン) |
|---|---|---|---|---|
| H1 | gpt-5.6-sol | **エスカレーション先** (frontier 相談 / 最上位 review gate)。Claude 側 Fable 5 と対称の GPT 側 top 帯 | gpt-5.5 (`MODEL_IDS.codex.frontier`)。参照比較として Fable 5 / Opus | gpt-5.5 に対し **品質で明確優位** (recall・false-accept 率)。優位でなければ「エスカレーション先」の意味がないため不採用 |
| H2 | gpt-5.6-terra | **主力実装帯** — 現在 gpt-5.5 が担う仕事の置換 (worker lane の底上げ兼コスト削減) | **gpt-5.5** (PO 方針 2026-07-10: 大半の実装は 5.5 で網羅できる前提。5.5 同等品質を半額で出せるかが判断点) | 5 工程で gpt-5.5 と **品質同等** (統計的に劣後しない) **かつ** $/解決タスクが下回る |
| H3 | gpt-5.6-luna | T2 軽量並列 lane (spark/mini、closing authority なし) | gpt-5.3-codex-spark / gpt-5.4-mini | 分類一致率が現職同等以上 **かつ** latency・$/タスクが現職以下 |

PO 方針 (2026-07-10): routing の将来像は **Terra = 主力 (5.5 の仕事を半額で) / Sol =
上位エスカレーション先 (Claude 側の Fable 5 と対称的な扱い)**。したがって H2 の比較相手は
gpt-5.4 ではなく gpt-5.5 本体であり、H1 は「5.5 より上か」だけを問う (同等では不採用)。
gpt-5.4 worker lane との比較は H2 成立時の付随確認に格下げする。

## 3. 測定設計: V-model 5 工程 × 機械 oracle の replay (PO 指示 2026-07-10 改訂)

測定対象は **設計・実装・テスト・レビュー・検証の 5 工程** (V-model の仕事の種類)。
private repo の完了済み成果物を問題セットにする (学習データ汚染なし)。判定は機械 oracle
を最優先し、モデル判定が必要な箇所は **別ファミリ (Claude 側) が cross-grade** する
(自画自賛バイアス排除、hybrid 原則)。

**共有コーパス**: 過去の fix commit (親 commit = 既知バグ版 / 当該 commit = 修正版) は
W3 (red 面 oracle)・W4 (既知欠陥)・W5 (誤った完了主張) の 3 工程で使い回す。

| # | 工程 | タスク | oracle (機械優先) | 主対象ペア |
|---|---|---|---|---|
| W1 | 設計 | freeze 済み上位要求から設計 doc を再生成 | vmodel doc lint / typed-spec gate 通過 + 実 freeze 済設計 (PO 承認済) との blind cross-grade (別ファミリ採点) | Sol vs gpt-5.5 / Terra |
| W2 | 実装 | spec / freeze 済テスト設計から実装 replay (親 commit へ checkout) | freeze 済テスト green (pass@1) + typecheck / lint / doctor gate 通過率、$/解決タスク | Terra vs gpt-5.4 |
| W3 | テスト | spec + 実装からテストコードを書かせる | **red/green 二面 oracle**: 修正版で green **かつ** 既知バグ版 (fix commit の親) で red になるか (バグを殺せないテストは coverage だけの器) | Terra vs gpt-5.4 / Luna |
| W4 | レビュー | 既知欠陥入りコード/diff のレビュー | 確認済み欠陥の検出 recall + false positive 率 (ノイズを撒く review gate は現職より悪い、recall 単独で判断しない) | Sol vs gpt-5.5 |
| W5 | 検証 | 完了主張 + 証跡の受入判定 (ACCEPT/REJECT) | 既知の「後で誤りと判明した主張」(supersedes / errata、修正前状態での完了主張) を REJECT し、確認済み主張を ACCEPT できるか。**false-accept 率が主指標** (検証 lane は悲観的でなければならない) | Sol vs gpt-5.5 |

補助 lane (H3 用): `ut-tdd task classify` / skill suggest / doctor finding triage 相当の
軽量分類で確定ラベルとの一致率 + latency + コスト (Luna vs spark/mini)。

W1 の設計採点だけは完全機械化できないため、構造 gate (lint) を一次 fail-close にし、
内容は「実際に freeze を通った設計」を参照解として別ファミリが blind rubric 採点する。
採点者にはどちらがどのモデルの産出物か伏せる。

## 4. スケジュール

| Phase | mode | 内容 |
|---|---|---|
| S1 (本 PLAN) | serial | 仮説表・測定設計・採用基準の凍結。TL クロスレビュー |
| S2 PoC | parallel | Lane A / B / C を並列実行 (各レーン独立、レーンあたり 10–15 タスク) |
| S3 verify | serial | 計測集計、paired 比較、cross-grade 検証。claim は green_commands で裏取り |
| S4 decide | serial | decision_outcome 確定。採用ティアがあれば後継 impl PLAN (MODEL_IDS SSoT / tier roster / agent-guard family 序列の更新) を起票 |

S4 で routing 変更を採用する場合、変更本体は本 PLAN では行わず、後継の kind=impl PLAN
(PLAN-L7-256 の SSoT drift gate 配下) に routeする。agent-guard の capability family 序列
への Sol/Terra/Luna 挿入位置も、そのベンチ結果を review_evidence として決める。

## 5. S2 パイロット結果 — 第1スライス (2026-07-10 実測)

条件: Codex CLI 0.144.1 / `codex exec` / effort=medium 固定 / n=1 / sandbox read-only。
コーパス = 実 fix commit 4 件 (80a1b383 session-log 切り詰め / 18da439c agent-guard
family pin / a87f8275 loader ledger 未登録 / ec072598 setup 非対話ハング)。
W4 = 4 問 (うち 1 問は症状提示型)、W5 = 6 問 (REJECT 正解 4 + ACCEPT 正解 2)。
採点 = Claude (Fable 5) cross-grade。**W1/W2/W3 は未実施** (次スライス)。

| 指標 | gpt-5.6-sol | gpt-5.6-terra | gpt-5.5 (現職) |
|---|---|---|---|
| W4 植込み欠陥 recall | 2/4 | 2/4 | 2/4 |
| W5 verdict 正答 | **6/6** | **6/6** | 5/6 |
| W5 false-accept (主指標) | 0 | 0 | 0 |
| W5 false-reject | 0 | 0 | 1 (修正版を過剰懐疑で REJECT) |
| 総トークン (10 問) | 85,068 | 105,914 | 141,422 |
| 総実行時間 | 261s | 328s | 333s |

所見 (n=1 の初期シグナル、確定判断には次スライスが必要):

1. **H2 支持**: Terra は 2 lane で gpt-5.5 と同等〜上回り (W5 6/6 vs 5/6)、単価半額
   かつ消費トークンも少ない。「5.5 の仕事を半額で」の初期シグナルは肯定的。
2. **H1 未証明**: Sol は本コーパスでは Terra と同スコアで、エスカレーション先としての
   上積みを示せていない。天井を測るには本コーパスは易しすぎる — 次スライスは
   より難しい欠陥 (跨モジュール・並行性・設計整合) で天井差を測る。
3. **lane 設計への知見**: 3 モデル全てが同じ 2 問 (session-log 切り詰め / agent-guard
   pin) をブラインドレビューで落とし、同じ 2 問を W5 で主張として突きつけられれば
   全モデル正しく見抜いた。「気付く力」と「指差し検証する力」は別能力であり、
   review gate には「何を主張 (claim) として渡すか」の設計が recall を支配する。
4. **運用所見**: モデルが sandbox 内でシェル実行を試みると Windows sandbox spawn error
   (CreateProcessAsUserW 1312) が発生 (gpt-5.5 / Terra で観測、回答へは自力復帰)。
   W2 実装 lane はシェル実行が本質なので、workspace-write sandbox の動作確認が前提。

raw log はローカル scratch (/tmp/bench)。プロンプトは上記 fix commit の親/当該版から
機械的に再生成可能 (再現手順は本 PLAN §3 と run-model.sh 形式)。

### 5.2 W1 設計 lane — 実課題 2 題 (2026-07-10 実測、PO 題材指定)

題材 (PO 指定): D1 = 多言語対応 (Python/PHP/Go を同等の機械 gate で統治する設計)、
D2 = Pack クリーン配布の構造妥当性監査。effort=high / read-only / 素材バンドル同一。
採点 = Claude cross-grade。D2 正解キー = A-172 の確認済み findings のうち現在も open
のもの (C-1 は配布材料の CI テンプレ内コメントに答えが残存していたため採点除外)。

| 指標 | gpt-5.6-sol | gpt-5.6-terra | gpt-5.5 |
|---|---|---|---|
| D1 結合点列挙 | 54 項目 (最網羅) | ~20 項目 + 急所先出し | 19 項目 (全て接地) |
| D1 設計品質 (rubric/10) | 8.5 | 8 | 7.5 |
| D2 正解キー recall | **6/6 + 新規 3 (裏取り済 2)** | 5/6 + 新規 4 (裏取り済 1) | 5/6 + 新規 2 |
| tokens (D1+D2) | 126k | 96k | 63k |
| 時間 | 719s | 293s | 264s |

(Sol D2 は初回 usage limit で失敗、アカウント切替後の再実行で完走: 30k tokens / 251s。)

所見:

1. **Terra が D2 で現行コードの実バグを新規発見**: sync-stage が自分の書く manifest
   (`.ut-tdd-pack-sync-manifest.json`) を次回実行の unmanaged 検出で fail させる
   **非冪等バグ** (`src/cli/distribution.ts` collectDistributionCandidatePaths の除外が
   `.git`/`node_modules`/`dist` のみであることを実コードで裏取り済み)。TOCTOU
   (scan→copy 競合)・非トランザクション sync・「secret スキャン ≠ データ分類境界」
   (no-go 核心) も構造的に妥当な指摘。→ **要 routeFiling (別 PLAN で起票)**。
2. Sol の D1 は最も網羅的・精緻 (toolchain 粒度 profile ID、pytest 0 件収集 guard 等)
   だが、トークン 3 倍・時間 3 倍。**「同等品質を半額の Terra」対「上積みに 3 倍払う
   Sol」の構図が設計 lane でも再現**。Sol D2 は usage limit (15:05 回復) で未測。
3. 全モデル共通の設計急所一致: 「harness 自身は TS/Bun のまま、切るのは対象リポジトリ
   統治の結合」「runner enum は neutral な provenance へ」— 多言語対応の設計方針として
   そのまま採用可能な収束。
4. Terra の弱点も観測: バンドル外パスをあたかも読んだかのように引用する **citation
   非接地** (実在ファイルだが提示材料に無い)。エスカレーション先ではなく主力帯として
   使う分には gate 側で担保可能。
5. 採点材料の教訓: 過去監査の修正がコード/テンプレにコメントとして残るため、**実リポ
   由来の題材は正解キー漏洩の混入チェックが必須** (今回 C-1 で実際に発生)。
6. **Sol D2 (再実行) は正解キー 6/6 全 hit + 新規 3 件、うち 2 件を実コードで裏取り確認**:
   (a) denylist 空洞化 — `buildCleanDistributionPlan` は denied path を先に filter 除外して
   から `denylistViolations` を計算するため、violation はほぼ構造的に空 = **denylist が
   fail-close でなく silent exclude に落ちている** (`src/setup/distribution.ts:238-244`)。
   (b) 削除の非伝播 — `gitAddPathspecCommands` は現行 artifact のみ `git add` し、削除
   path を stage しないため、Pack から消したファイルが公開 commit に残り続ける
   (`src/setup/distribution.ts:200-213`)。(c) skills/ と docs/skills/ の書換衝突 shadowing
   (構造妥当、未実証)。(a)(b) も **要 routeFiling**。convergence 欠如 (DEFECT 5) の定式化
   は 3 モデル中最も完全で、「非破壊不変条件 + clean artifact 同時成立が未閉」という
   no-go 判断の機械的根拠をそのまま与える。
7. エスカレーション先としての Sol 像が確定的: D2 単体では 30k tokens / 251s と Terra 並の
   コストで最深の監査を出した (D1 の 3 倍コストは網羅列挙の性質による)。**「難所の監査・
   検証に限り Sol へ上げる」運用 (Fable 5 対称) は価格性能的に成立する**。

### 5.3 参考: Claude 側ブラインド D2 (2026-07-10)

同一バンドルで Claude 側 2 点を測定 (採点者 Claude 本体は答え既見のため、未汚染の
別コンテキストで実行)。**条件差の留保**: Opus は Agent tool (subagent、bundle 限定指示)、
Fable は advisor 経路 (`ut-tdd advisor --execute`) で repo 常駐コンテキスト (CLAUDE.md 等)
を持つため、GPT 勢との厳密同条件ではない。

| 指標 | claude-opus-4-8 | claude-fable-5 (advisor 経由) |
|---|---|---|
| D2 正解キー recall | 4/6 + partial 2 | 5/6 + partial 1 |
| 新規指摘 | 4 (denylist 空洞化を独立発見) | 5 (manifest 非冪等を独立発見、readiness 恒真・package の exportPlan.ok 非ゲート・docs/skills remap の governance 矛盾) |
| 特記 | no-go 核心を catch-22 として最鋭利に定式化 | 唯一「根因単一修正」(git archive + dirty fail-close) まで提示。tag 生成が標準動線 nextCommands に無い欠落も唯一発見 |
| 実行 | 136s / 48.5k tokens | 131s / tokens 不明 (advisor 経由) |

Sol の denylist 空洞化を Opus が、Terra の manifest 非冪等を Fable が、それぞれ独立に
再発見しており、**モデル横断の独立一致は finding の実在性の強い証拠** (adversarial
verification が自然成立)。agent-guard が model=fable を正規化できない事象も本測定で
発見 (`ModelFamily`/`FAMILY_RANK` に Claude 5 世代が無い)。修正方針は「fable を最上位
rank に追加しつつ worker role 割当は policy で禁止」(判断頂点の非消費原則、§6 参照)。

### 5.4 W2 実装 lane (2026-07-10)

形式: fix commit の親 (バグ版) source + 凍結テスト全文を渡し、修正版全文を single-shot
出力 → worktree (当該 fix commit) に適用して凍結テストを実走 (codex sandbox の Windows
spawn 不能を回避する replay 形式)。effort=medium、4 課題。

| 指標 | gpt-5.6-terra | gpt-5.5 |
|---|---|---|
| pass@1 | **4/4** (13+20+4+25 tests green) | 3/4 (loader が esbuild transform error = 構文不正) |
| tokens | 73.7k | 98.5k |
| 時間 | 341s | 352s |

### 5.5 W3 テスト lane (2026-07-10)

形式: 挙動契約からテストを書かせ、red/green 二面 oracle (修正版で green かつバグ版で
red = KILLS-BUG) を実走。有効課題 = agent-guard のみ (session-log 課題は出題側の API
記述不足 — 返り値型未指定 + 誤誘導的な Bash 例 — で両モデル同時 fail したため**課題無効**)。

- agent-guard: **Terra / gpt-5.5 両モデル KILLS-BUG 達成** (1/1)。
- 出題教訓: W3 は対象 API を厳密に固定した場合のみ有効な測定になる (agent-guard は
  API を明記して両者成功、session-log は未指定で両者が別々の形に誤推定)。

### 5.6 軽量分類 lane (H3、2026-07-10)

実 commit 12 件の Conventional Commits type 分類 (prefix 除去 + file list 提示、effort=low):
luna 5/12 / mini 6/12 / spark 5/12、latency は luna 最速 (9s)。**有意差なし**。本 repo の
feat commit は docs も大量に触るため file list が誤誘導する等、課題側の識別力不足も併記
(H3 は未決のまま — Luna 採用の積極根拠は現時点なし)。

## 6. S3 verify まとめと S4 提言 (draft — S4 確定は PO ゲート)

全 lane 集計 (W4 レビュー / W5 検証 / W1 設計×2 / W2 実装 / W3 テスト):

- **H2 (Terra = 主力実装帯) — 採用提言**。全 lane で gpt-5.5 と同等以上 (W5 6/6 vs 5/6、
  W1-D2 で新規実バグ発見、W2 pass@1 4/4 vs 3/4)、消費トークンも一貫して少なく単価半額。
  → `MODEL_IDS.codex.worker` を `gpt-5.4` から `gpt-5.6-terra` へ更新する提言
  (5.5 級品質を worker 単価で常用する、PO 意図の実装形)。
- **H1 (Sol = エスカレーション先) — 採用提言**。難所 (W1-D2) で recall 6/6 + 裏取り済
  新規欠陥 2 件と明確な上積み。routine 難度では Terra と差が出ないため常用は不経済。
  → `MODEL_IDS.codex.frontier` を `gpt-5.5` から `gpt-5.6-sol` へ更新し、advisor の GPT 側
  相談先・最上位 review gate を Sol に置く提言 (Fable 5 対称の escalation 席。7/13 以降
  Fable がプラン外に落ちる想定下で実効 frontier 席になる)。
- **H3 (Luna = 軽量帯) — 保留**。spark/mini との有意差を示せず。課題設計を改善した
  再測まで現状維持。
- 実施形: S4 confirmed 後、後継 impl PLAN で `MODEL_IDS` SSoT (PLAN-L7-256 系) +
  tier roster + advisor policy を更新。agent-guard の family 対応は PLAN-L7-414。
  gpt-5.6 系の family 序列挿入位置は本 PLAN の実測を review_evidence として引用する。

## 7. S1 DoD

- [ ] 仮説表 (H1–H3) と採用基準が PO / TL レビューで凍結される。
- [ ] Lane A の replay 対象 PLAN 候補リストが確定する (freeze 済テスト設計を持つこと)。
- [ ] Lane B の既知欠陥コーパス (ラベル付き) が確定する。
- [ ] S2 実行手順 (codex exec 呼び出し形・stdin close・ログ保存先) が固定される。
