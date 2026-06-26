---
plan_id: PLAN-L7-157-distribution-clean-pull
title: "PLAN-L7-157 (impl): 配布物を作る — GitHub から自己開発プロジェクト(dogfood)非搭載・画面なしで pull でき、別PCで setup して使える clean 配布チャネル + setup adapter 投影 + install 導線"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-06-25
updated: 2026-06-26
owner: PM (Opus) / PO (人間)
parent_design: docs/design/harness/L1-requirements/technical-requirements.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
agent_slots:
  - role: se
    slot_label: "SE — curated export 機構 / setup adapter 投影 / install(build)導線の実装"
  - role: tl
    slot_label: "TL — clean-pull 不変条件(dogfood 非混入)・S5=b/S-01/CC2/ADR-005 不変・src⇄docs GATE を緩めないことのレビュー"
  - role: qa
    slot_label: "QA — portability smoke (clean clone → setup → doctor green) のテスト戦略"
generates:
  - artifact_path: docs/plans/PLAN-L7-157-distribution-clean-pull.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/index.ts
    artifact_type: source_module
  - artifact_path: src/setup/templates.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
  - artifact_path: tests/distribution-acceptance.test.ts
    artifact_type: test_code
  - artifact_path: docs/templates/adapter/AGENTS.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/CLAUDE.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/CLAUDE.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/settings.json
    artifact_type: template
  - artifact_path: LICENSE
    artifact_type: doc_update
  - artifact_path: package.json
    artifact_type: config
  - artifact_path: docs/design/harness/L6-function-design/setup-solo-team.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/test-design/harness/L3-acceptance-test-design.md
    artifact_type: test_design
  - artifact_path: docs/governance/repository-structure.md
    artifact_type: doc_update
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-03-setup-solo-team.md
  references:
    - docs/adr/ADR-005-distribution-model-and-central-ui.md
    - docs/plans/PLAN-L7-141-web-dashboard-component-derived.md
    - docs/plans/PLAN-L7-146-serverless-readonly-share.md
    - docs/plans/PLAN-DISCOVERY-01-workflow-metamodel.md
    - docs/plans/PLAN-L6-06-handover-mechanism.md
    - docs/plans/PLAN-L7-04-handover-mechanism.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-26T19:36:48+09:00"
    tests_green_at: "2026-06-26T19:36:48+09:00"
    verdict: approve
    scope: "Close PLAN-L7-157 by adding clean distribution planning, adapter projection, preflight/readiness, rollback, tag-pin contract, CI self-sufficiency, monorepo smoke metadata, and MIT license."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts tests\\cli-surface.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T18:37:05+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:bc3e71d18106161f895a895c91a98bf5976675a103edb2387a346e68aed4142b"
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts tests\\cli-surface.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T18:37:05+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:41fc71e2f15560d2afc456e431e6b1176965977f8cf3b66323f7d9a663182aa5"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-26T18:35:12+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:dd3ce89791be3cb7394a69b3c19c79abe44c0fb2604a312808c70e0e7c20ceff"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-26T18:37:05+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:b386146fc6c686d935edf57838f264a36ec0e582d52be8c923fb4066e413e228"
      - kind: smoke
        command: "bun src\\cli.ts distribution plan --tag v0.1.0 --json"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T18:38:19+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:dd3ce89791be3cb7394a69b3c19c79abe44c0fb2604a312808c70e0e7c20ceff"
      - kind: smoke
        command: "bun run vitest run tests\\distribution-acceptance.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T19:36:48+09:00"
        evidence_path: tests/distribution-acceptance.test.ts
        output_digest: "sha256:e897b11cfffafe9dc295467b9bb8ba97629899ad41c86f035925431a4b0251d1"
---

# PLAN-L7-157 (impl): clean 配布物 (dogfood 非搭載・画面なし・別PCで使える)

## 0. なぜ (PO 決定 2026-06-25)

PO 指示: 「リファクタ後に、**画面なし** で、**現在の自己開発プロジェクトが載っていない状態で配布して別の PC で使える** ようにしたい」。
さらに必須要件として「**GitHub からは、この自己開発プロジェクトが載っていない状態で引っ張れないとダメ**」。

= 引っ張れる成果物そのものが clean (engine + 方法論のみ、dogfood 非搭載) でなければならない。
「engine をツール依存で入れれば consumer repo は自動で綺麗」では**不十分**: git pull は repo 全体を引くため、
配布チャネル側で **curated 分離 (clean distribution channel)** を成立させる必要がある。これは ADR-005 が
初回リリースへ deferred にしていた「curated export」を、本 PLAN で機構として確定させるもの。

## 1. 確定要件 (PO 2026-06-25)

- R1. **dogfood 非搭載**: GitHub から pull する配布物に、このリポ固有の自己適用成果物
  (`docs/plans/PLAN-*`, `docs/design/harness/`, `docs/test-design/`, `.ut-tdd/`, `docs/handover/`) が**含まれない**。
- R2. **画面なし**: 中央UI / 画面 (src/web, L7-141/146) は配布物に**同梱しない** (backend-first、フロント後回しは PO 確認済)。
- R3. **別PCで使える + 途中導入 (brownfield)**: pull → `ut-tdd setup` → engine が起動し動く。**空の project に限らず、
  既に作りかけ/既存の project へ「途中から導入」しても動く** (PO 2026-06-25 例「プロジェクトの途中から導入する」)。
- R4. **配布は外向き・不可逆**: 実 cut(初回 tag/release/公開)は **PO 承認後のみ**。本 PLAN は「機構と判断の確定」まで。
- R5. **非破壊な導入・更新 (PO 2026-06-25「プロジェクトを破壊して更新するのはダメ」)**: 導入も更新も **consumer の
  プロジェクトを破壊しない**。2 シナリオを第一級で支える ——
  (a) **途中導入**: 既存の(非空)project に setup しても、既存ファイル (consumer の `src`/`docs`/既存 `CLAUDE.md`/
  `.claude`/`AGENTS.md`/CI 等) を上書き・消去しない。managed 区画に**差し込む**だけ、衝突は検出して報告。
  (b) **作りかけ更新**: 作業途中 (clean checkpoint でない) で更新 (tag-pin bump) しても、consumer 固有成果
  (`docs/plans`/`docs/design`/`src`/`tests`/`.ut-tdd`/custom adapter) を上書き・消去しない。
  両者とも = engine 差し替え + adapter の **managed 区画のみ**の冪等な再投影で、consumer の作業を保全する。
- R6. **環境前提 = preflight (PO 2026-06-25「環境セットアップもいる / ばーん隊長(=Bun)入れてるだろ」)**: 別PCで動かすには
  ホスト前提が要る。最低 = **Bun ≥1.3** (CLI も hooks も bun 駆動) + **git**。GitHub 機能には **gh/auth**、レビュー gate には
  runtime CLI (**claude / codex のいずれか**)。onboarding はこれを **preflight 検査**し、欠落は**明示手順を出して止める**
  (黙って host を書き換えない)。**罠**: compiled binary で CLI を配っても投影 hooks は `bun` を要求 → Bun 前提は消えない。
- R7. **consumer モード確定 + 認証の促し**: onboarding が consumer の runtime (claude/codex の有無) を検出し
  **mode (standalone/claude-only/codex-only/hybrid) を確定**。mode で review_evidence 要件 (cross_agent ⇔
  intra_runtime_subagent) が変わるため投影に反映。各 CLI の**ログイン/サブスク不足は検出して促す** (harness は代行不可)。
- R8. **CI 自己充足**: 投影する CI (`harness-check`) が consumer の CI 環境で**自走**する (Bun setup + 認証 token、
  ADR-005 D1: CI は engine を要求)。**ローカル green / CI red を作らない** (既知の biome/CI drift 教訓)。
- R9. **アンインストール / rollback**: 導入の逆操作 (managed 区画除去 + consumer 成果保全) で**綺麗に外せる**。更新失敗時は
  前 tag へ **rollback** できる (R5 の backup/dry-run と対)。
- R10. **バージョニング / 互換契約**: **semver + tag-pin channel + CHANGELOG/migration note**。engine が consumer に晒す
  **公開契約** (cross-review で拡張) = {CLI surface / adapter marker 形式 / `.ut-tdd` state schema / **hook event schema /
  config schema / team yaml schema / plan schema / review-evidence schema / exit-code・error 契約**} を安定化し、破壊的変更は
  major + migration 手順 + 非破壊 forward migration を伴う (sudden break 禁止)。
- R11. **consumer 向けドキュメント / セットアップガイド (README 拡張派、PO 2026-06-25)**: 別 guide doc を新設せず
  **README の install 節 (`TODO(最終まとめ)` のまま) を拡張**して集約する。章立て = §8 インベントリ (前提環境→install→
  導入(新規/途中)→更新(非破壊)→アンインストール→モード/認証→トラブルシュート)。方法論 doc (governance/adr/process の
  公開分) も同梱。dogfood の開発記録は除外 (R1) しつつ「**入れ方・使い方・更新の仕方が分かる**」状態にする。spec-first で
  **先に README 骨子を書いて setup フロー設計を駆動**し、機構 landing ごとに埋める (未実装段は「target flow / 未実装」と
  明記、完成主張禁止)。
- R12. **配布の信頼性 / サプライチェーン**: consumer は**実行コード** (hooks=PreToolUse で bun script、agent spawn) を引く。
  tag/release の**完全性** (署名/checksum) と出所明示、consumer 側も harness の安全境界 (escalation / secret 非記録 /
  最小権限) を継承する。
- R13. **ライセンス**: 公開配布物に **LICENSE** を同梱し、system=public の配布条件を明記する。
- R14. **adapter テンプレート (CLAUDE.md / AGENTS.md / .claude の書き方見本) (PO 2026-06-25「書き方見本ないよね」)**:
  consumer へ投影する**clean な adapter テンプレが存在しない** (現状 `docs/templates/` は github/plan/prompt/state のみ、
  CLAUDE.md/AGENTS.md 見本は不在。あるのは本リポ dogfood 版のみ)。投影の**投影元**としてこれを新規 author する。テンプレは
  **managed-marker 区画 (setup が投影/更新する正本) と consumer 所有区画 (placeholder、触らない) を明確に分離**した構造とし、
  rule-drift の検査対象 marker と整合させる。`docs/templates/adapter/` に配置 (github テンプレと対称)。
- R15. **ネットワーク/企業環境 (cross-review 追加)**: 別PC導入は **proxy / 社内 CA / GitHub Enterprise / private mirror /
  offline・air-gapped** で失敗しやすい (GitHub/gh pull・Bun install・checksum 検証)。これらでの導入手段 (mirror 経由・
  事前 fetch・検証の代替 root) を preflight と手順に織り込む。
- R16. **クロス OS (cross-review 追加)**: 「Windows-native first-class / WSL2 optional」に寄り過ぎ。別PC配布なら
  **macOS / Linux も第一級**で、shell 差・path quoting・PowerShell⇔bash・`CLAUDE_PROJECT_DIR` 非Claude環境での代替を
  AC に落とす。
- R17. **monorepo / workspace root 判定 (cross-review 追加)**: consumer の **repo root ≠ package root** の場合に
  adapter / CI / `.ut-tdd` / hook path / tag-pin の配置先を誤らないよう、root 判定 (workspace/subdir project) を定義する。

## 2. 設計判断点 (未確定・要 PO 確認 + 設計 descent)

- **D-A. clean channel の実現方式 — 決定 (PO 2026-06-25「正しく渡せるほう」)**: **① 別 clean public repo (curated export を
  fresh-content push、履歴 filter しない) を主 channel + ② 各 tag に署名付き tarball + attestation を完全性層**として付与。
  - 却下: **④ 専用 export ブランチ** (同 repo に dogfood の履歴/オブジェクトが残り pull で漏れる=「正しく渡せない」) /
    **③ files-allowlist + npm** (ADR-005 で却下) / **② tarball 単体** (tag-pin の git 更新モデルが成立しにくい)。
  - 採用理由 = ① のみ「**dogfood 漏洩なし + tag-pin 非破壊更新 (ADR-005 D1) + 署名 tag provenance**」を両立。
  - **「正しく渡せる」の保証実体は channel でなく curated-export の fail-close** (C3 最小公開セット + D-B 漏洩 denylist)。
    channel はその下流。履歴ではなく fresh-content で push するのが漏洩遮断の肝。
  - 実 cut (repo 作成/可視性/初回 tag) は **R4 = PO 承認ゲート**のまま (外向き・不可逆)。
- **D-B. 同梱境界の正本化 + 漏洩経路の網羅 (cross-review 拡張)**: 公開 = engine `src/` + governance/adr/process(方法論) +
  adapter templates + schema。非公開 = R1 の dogfood 一式。memory「system=public / self-application=private」(2026-06-17 PO)
  を doc 正本へ昇格。**dogfood 除外は §8 の粗いリストでは不足**: `tests` fixture / snapshot / README 内リンク /
  package metadata / `scripts` / generated schema / audit examples / migration・archive 由来の self-application 名称など、
  自己開発プロジェクトを漏らす細経路まで denylist + allowlist で fail-close する。
- **D-C. runtime 非結合 + 最小公開セット (cross-review Critical 修正)**: src⇄docs は **GATE 結合** (doctor が本リポの
  docs を検証) であって **runtime 結合**であってはならない。consumer 機では engine は **consumer の docs** を読む。
  **未解決の核 = clean artifact から dogfood を抜きつつ consumer で doctor green が成立する根拠**: engine が動作・doctor
  通過に**必須とする最小公開セット** (schema / governance / 必要な template / 空 project でも green な doctor の振る舞い) を
  **明示列挙して確定**する。これが未定義だと R1(dogfood 非搭載) と AC3(doctor green) が同時成立しない (no-go の主因)。
  **確定方法 = 実証 spike (prose にしない)**: 空 consumer に candidate set だけ置いて `doctor` を実走し、green に必要な
  最小物を**実測**して列挙する (Step 1 後・実装前段で実施)。
- **D-D. 非破壊な導入/更新の方式 (R3 brownfield + R5)**: 導入と更新を **同一機構** (managed 区画のみの冪等投影) で扱う。
  ① engine は consumer content と**物理分離**ゆえ tag-pin 差し替えで consumer をそもそも触らない。
  ② **非破壊の正しい定義 (cross-review Critical 修正)**: 不変条件は「diff が managed 区画のみ」**ではない**
  (初回 brownfield では marker がまだ無く、初回挿入の diff は必ず marker 外に出る=矛盾)。正しくは
  **「consumer の既存行を 1 行も改変・削除しない (verbatim 保全)。追加は setup が作る delimited managed ブロック内に
  限定。初回はそのブロック marker 自体を新設する (= marker 新設の diff は正当)」**。再実行時は managed ブロックのみ更新。
  機械検証は「既存行 = before の strict superset で verbatim」+「追加は managed ブロック内」。
  ③ **構造マージ契約 (cross-review Critical 修正)**: managed-marker だけでは JSON/YAML の非破壊 merge は保証されない。
  `.claude/settings.json` の **hook 配列 merge** (matcher 単位・既存順保持・重複排除・user 独自 hook 保全) と CI workflow の
  **job/step/key 衝突**を構造的に扱う契約を定義する (テキスト marker でなく構造 merge)。解決不能な衝突は fail-close で報告、
  **書き込み前に必ず dry-run diff**。3-way / detect-and-preserve のいずれにするか確定。
  ④ **`.ut-tdd/` 内部境界 (cross-review Critical 修正)**: `.ut-tdd/` を一括 consumer 成果として扱うと更新/uninstall で
  壊す。**managed state (engine 所有、forward migration 対象) と consumer-owned (audit/handover/log、保全のみ) の境界を
  明示**する。projection は git 由来で再生成可、consumer audit/handover は wipe しない。uninstall は managed のみ除去。
  ⑤ 導入/更新前 backup と rollback 手段。冪等性 (同じ setup を 2 回 = no-op) を不変条件にする。
- **D-E. 導入/更新を「agent 駆動 workflow」化 (PO 案 2026-06-25)**: setup/handover を静的ファイル生成でなく
  **workflow driver** にする案。既存資産に接続 = workflow metamodel (DISCOVERY-01) / process workflows
  (DISCOVERY-04) / **handover engine** (`src/handover`, L6-06/L7-04..07/L7-131) を再利用。adoption も update も
  「**既存状態 → harness 状態の reconcile**」= handover と同型ゆえ自然に乗る。**役割分担を不変条件にする**:
  agent は **PROPOSE** (既存 project の scan/classify/merge 案/衝突説明) のみ、安全保証は **mechanical fence が ENFORCE**
  (D-D の managed-marker-only + dry-run + fail-close + 人間承認ゲート)。LLM の「賢いマージ」を安全の根拠にしない
  (coverage≠substance / CC2 人間主導 / S-01)。**fence の具体条件 (cross-review 追加)**: agent 生成の merge 案を機械が
  受ける以上、**schema validation + patch sandbox + path allowlist + 危険 patch の拒否規則 + human approval** の具体条件を
  定義する (どこで機械が拒否するかを曖昧にしない)。**bootstrap 注意**: onboarding workflow は **engine CLI から bare
  project に対して**走る (未導入の adapter/hooks に依存できない) ため、in-project runtime workflow と分離する。
  実装面 = 対象が `src/workflow` (contracts.ts) で Codex リファクタ中 → 実装は Step 1 (green HEAD) 後。
- **D-F. 環境 preflight の方式 + hook path 解決 (R6)**: ① **既定 = detect + instruct** (Bun/git/gh/runtime CLI の
  presence・version を検査し欠落を報告)。**auto-install は明示 opt-in のみ** (host 改変 = 安全境界・escalation、勝手に入れない)。
  ② 既存 `src/runtime/detect.ts` / `adapter.ts` (spawnability 判定、`UT_TDD_*_BIN`、`where.exe`) を再利用しモード確定。
  ③ **投影する hooks は engine の実 install 先を指す**: 現 adapter は `bun "$CLAUDE_PROJECT_DIR/src/cli.ts"` 前提だが、
  engine が dependency の consumer では src が project 内に無い → install path を解決して hook command を書く
  (`$CLAUDE_PROJECT_DIR/src` 直書きを consumer へ projection しない)。④ PATH 健全性 (System32 注入で spawn が壊れた
  既知事例)。⑤ Windows-native first-class / WSL2 optional、PowerShell⇔bash の entrypoint (`scripts/ut-tdd.ps1` / `.sh`)。
- **D-G. バージョニング / 契約安定化 (R10)**: semver 規則と tag-pin bump 手順を確定。**互換契約 = {CLI surface /
  adapter marker schema / `.ut-tdd` state schema}** に **contract test (golden)** を張り、version 間で互換 or migration 付き
  を機械保証。破壊変更は major + 自動 migration + CHANGELOG。**1 マシン複数 project の version 分離** (global 可変単一に
  しない、tag-pin は project ごと) を保証する。
- **D-H. サプライチェーン / 信頼 (R12)**: release の**完全性検証** (gh attestation / sigstore / checksum) と出所明示。
  **検証主体と root of trust を明示 (cross-review 追加)**: consumer が pull 後に**何を・どの root of trust で検証し・
  失敗時に setup を止めるか**を具体化する (prose で済ませない)。hooks が consumer 上で**任意 bun script を PreToolUse
  実行する事実**を透明化し、既定は最小権限・監査残し。`UT_TDD_ALLOW_*` 系 bypass の監査が consumer 側でも継承される
  こと。secret/token を adapter・state・evidence・log へ書かない (安全境界の継承)。
- **D-I. consumer ドキュメント + フィードバック経路 (R11)**: 同梱 doc の curated 範囲を確定 (gray-area =
  `docs/governance`/`docs/adr`/`docs/process` は製品仕様として公開側が自然、memory)。quickstart/install/update/
  uninstall の手順を同梱。consumer からの issue/feedback の戻り経路 (harness の `feedback_events` / issue dry-run queue を
  外部向けにどう開くか) と privacy を確定。

## 3. Scope (実装コンポーネント)

1. **curated export 機構**: clean artifact を生成し、dogfood 除外を機械化。allowlist/denylist を doctor で
   fail-close 検証 (誤って dogfood が混入したら止める)。
2. **adapter テンプレ author + `ut-tdd setup` の adapter 投影 (冪等・非破壊)**: まず **投影元の clean テンプレ
   (`docs/templates/adapter/` の CLAUDE.md / AGENTS.md / .claude `settings.json` 見本、managed/consumer 区画分離) を
   新規 author** (R14、現状不在)。その上で consumer project へ projection。**既存ファイルがあっても上書きせず managed 区画に
   merge/挿入** (途中導入対応)。**現状 setup は GitHub/CI 足場しか吐かない** (dry-run 実測) ため、この投影が未実装。
3. **install 導線**: engine を別PCで使える状態にする (build/install path、`package.json` `private` 解除 or
   git-install 設定、`dist/ut-tdd` 生成の prepare/postinstall or release binary)。
4. **portability + 途中導入検証**: clean clone → setup → `ut-tdd doctor` が **dogfood 無しで** green になる smoke、
   および **既存(非空)project へ setup しても既存ファイルが破壊されない** smoke。
5. **非破壊な導入/更新機構 (R3/R5/D-D)**: `ut-tdd setup` (初回も再実行も) = 冪等な managed 区画投影とし、
   marker 外保全 + 既存ファイル merge + state forward migration。更新 smoke (旧版投影 → consumer がカスタム →
   更新 → 破壊なし) と冪等性 smoke (2 回 setup = no-op) を含む。
6. **環境 preflight (R6/D-F)**: Bun(≥1.3)/git/gh/runtime CLI の presence・version 検査と欠落時の明示診断
   (cryptic crash させない)。既存 `runtime/detect` を再利用しモード確定。投影 hooks の install-path 解決
   (`$CLAUDE_PROJECT_DIR/src` 直書きをやめ engine 実体を指す)。auto-install は明示 opt-in のみ。
7. **モード確定 + 認証促し + CI 自己充足 (R7/R8)**: onboarding が mode を確定し review_evidence 要件を投影、
   runtime CLI 未ログインを検出して促す。投影 CI (`harness-check`) は Bun setup + token を備え consumer CI で自走。
8. **アンインストール/rollback + バージョニング (R9/R10/D-G)**: 逆操作 (managed 除去 + 成果保全)、更新失敗時の前 tag
   rollback、semver/tag-pin、互換 **contract test** (CLI surface / adapter marker / state schema)。
9. **consumer docs + LICENSE + release 完全性 (R11/R12/R13/D-H/D-I)**: quickstart/install/update/uninstall 手順 +
   方法論 doc 同梱、LICENSE、release 署名/checksum と出所明示、feedback 戻り経路。

### スコープ外 (明示)

- 中央UI / 画面実装 (L7-141 / L7-146)。フロントは後回し (PO 確認済、本配布には不要)。

## 4. Acceptance Criteria

- AC1. clean artifact に R1 の dogfood (PLAN-*/design.harness/test-design/.ut-tdd/handover) が**含まれない** (機械検証、混入で fail-close)。
- AC2. clean artifact に中央UI/画面が含まれない。
- AC3. pull → `ut-tdd setup` → engine 起動 + `doctor` が consumer project (空・非空とも) に対して green。
- AC4. `setup` が `.claude` adapter (hooks + `CLAUDE.md` + `AGENTS.md`) を consumer に投影する。
- AC5. 実配布 cut は PO 承認後のみ (外向き・不可逆)。
- AC6. **非破壊更新 (R5)**: 更新 (engine bump + `setup` 再投影) を走らせても consumer の project 成果
  (`docs/plans`/`docs/design`/`src`/`tests`/`.ut-tdd`/custom adapter 編集) が破壊されない。機械検証 =
  **before の consumer 既存行が after に verbatim 残存** (改変・削除 0)、追加は managed ブロック内に限定。
- AC7. **途中導入の非破壊 (R3、cross-review 修正)**: 既存ファイル (consumer の `src`/`docs`/既存 `CLAUDE.md`/`.claude`/
  `AGENTS.md`/CI) を持つ project へ setup しても破壊されない。機械検証 = **既存行 verbatim 保全 + 追加は managed ブロック内**
  (初回は marker 新設の diff を許容)。JSON/YAML は構造 merge で既存 hooks/CI job を保全、解決不能衝突は fail-close。
  setup の冪等性 (2 回 = no-op) も検証。
- AC8. **環境 preflight (R6)**: Bun/git/(gh)/runtime CLI 欠落の host で onboarding が **cryptic crash せず明示診断**
  (何が足りず何を入れるか)。投影 hooks が engine 実 install 先を指し、bun 駆動が consumer で解決する。host への
  auto-install は明示 opt-in 無しに発生しない。
- AC9. **モード確定 + 認証促し (R7)**: onboarding が consumer の mode (standalone/claude-only/codex-only/hybrid) を
  正しく判定し、mode 別 review_evidence 要件を投影。runtime CLI 未ログインを検出して促す (代行しない)。
- AC10. **CI 自己充足 (R8)**: 新規 consumer の CI で `harness-check` が green になる (Bun setup + token を備える)。
- AC11. **アンインストール (R9)**: 除去後、consumer の非 managed 成果が無傷で残り managed 区画のみ消える。更新失敗時に
  前 tag へ rollback できる。
- AC12. **契約互換 (R10/D-G)**: contract test (CLI surface / adapter marker / `.ut-tdd` state schema) が version 間で
  互換、または自動 migration 付き。1 マシン複数 project が異なる tag を干渉なく持てる。
- AC13. **配布の信頼性/ライセンス (R12/R13)**: 配布物に LICENSE + release 完全性検証手段 (署名/checksum) + 出所明示。
  secret/token が adapter・state・evidence・log に書かれない。
- AC14. **adapter テンプレ (R14)**: `docs/templates/adapter/` に clean な CLAUDE.md/AGENTS.md/.claude 見本が存在し、
  dogfood を含まず、managed-marker 区画と consumer 所有区画が分離。setup はこのテンプレから投影し、rule-drift と整合。

## 5. Schedule

- Step 1 (serial, **前提**): リファクタ完了 + `green-command-digest` mismatch 訂正 → **green HEAD 確定** (本 PLAN 着手の前提条件)。
- Step 2 (serial): D-A〜D-I を PO 確認 + `technical-requirements`(L1) / ADR-005 へ反映 (descent)。
- Step 3 (parallel): [a] curated export / [b] setup adapter 投影 / [c] install 導線 / [d] 非破壊導入/更新 /
  [e] 環境 preflight + モード/認証/CI / [f] アンインストール/rollback + バージョニング/契約 test / [g] docs/LICENSE/署名。
- Step 4 (serial): 全シナリオ smoke — clean clone→setup→doctor green / 既存非空→setup→破壊なし / 旧版→custom→更新→
  破壊なし / 2 回 setup = no-op / uninstall→非 managed 無傷 / consumer CI green / contract test 互換。
- Step 5 (serial): PO 承認 → 初回 tag/release。

## 6. 壊さない / 再発させない

- 確定原則 **S5=b / S-01 / CC2 / ADR-005 D2** を一切変えない。
- **導入も更新も consumer プロジェクトを破壊しない** (R3/R5)。途中導入 (既存 project) でも作りかけ更新でも、adapter は
  managed-section marker 経由のみ投影し、marker 外の consumer 編集・既存ファイル・consumer の docs/src/tests/`.ut-tdd`
  を上書きしない (「相手の成果を消さない」と同質の原則)。setup は冪等 (2 回 = no-op)。
- **早すぎる物理分離をしない** (memory: 初回リリース時にまとめて curated export)。本 PLAN は機構と判断の確定で、
  実 cut は PO 承認後。
- 本リポの **src⇄docs GATE 結合を緩めない**: dogfood repo の doctor は従来どおり全 docs を検証。clean artifact は
  別 channel で生成し、本リポのゲートを弱体化させない。
- **host 環境を黙って改変しない** (R6/D-F)。Bun 等の前提は検査・報告が既定、install は明示 opt-in。auth/secret を
  adapter・state・evidence に書かない (安全境界)。

## 7. review / 次工程

- status = **draft**。confirm 前に review_evidence + D-A〜D-I の PO 確認が必須。
- **cross-review 実施 (Codex / gpt-5.5、hybrid 判断ゲート、`ut-tdd codex --role tl`、2026-06-25)** = **判定 no-go**。
  task/出力の監査証跡 = `.ut-tdd/review/cross-review-l7-157.md`。findings と disposition は §9。
- **D-A clean channel = 決定済** (別 clean repo + 署名 tarball、PO 2026-06-25)。**go に残る必須クローズ = D-C 最小公開セット**
  (空 consumer で doctor 実走の spike で実測) + 残 open AC 精緻化 (I6/M2/M3/M4)。
- 着手は **リファクタ + digest 訂正 完了後** (Step 1 前提)。

## 9. cross-review findings (Codex gpt-5.5, no-go) と disposition

判定 = **no-go**「方向は正しいが、非破壊不変条件と clean artifact ⇄ doctor green の同時成立が設計として未閉」。

- **Critical (4) — 全て本 draft へ反映済**:
  - C1 `R3/R5/D-D/AC6/AC7`「diff=managed 区画のみ」が初回 brownfield と矛盾 → **修正**: 不変条件を「既存行 verbatim 保全 +
    追加は managed ブロック内」へ (D-D②, AC6, AC7)。
  - C2 `R5/D-D`: marker のみでは JSON/YAML merge の非破壊性を保証できない → **修正**: 構造 merge 契約 (settings.json hook 配列・
    CI job/key) を D-D③ に追加。
  - C3 `R1/D-C/AC1/AC3`: dogfood 除外と doctor green の同時成立根拠不足 → **修正**: D-C に「engine 必須の最小公開セット明示」を
    追加 (= no-go 主因、**要 PO 確定**)。
  - C4 `R5/R9/D-D`: `.ut-tdd` の managed/consumer-owned 境界欠如 → **修正**: D-D④ に内部境界を追加。
- **Important (9) — disposition**:
  - I1 `D-A` clean channel 方式未決 → **解決 (PO 2026-06-25「正しく渡せるほう」)**: 別 clean repo (fresh-content push) +
    各 tag 署名 tarball。履歴 filter/export ブランチは漏洩ゆえ却下。実 cut は R4 ゲート。
  - I2 `D-B` dogfood 除外が粗い (fixture/snapshot/metadata/scripts/generated/audit/archive 名称) → **D-B 拡張で反映**。
  - I3 `R6/D-F` proxy/社内CA/GHE/mirror/air-gapped 欠落 → **R15 新設**。
  - I4 `D-D` monorepo/workspace root 判定欠落 → **R17 新設**。
  - I5 `R6/D-F` macOS/Linux が二級扱い → **R16 新設**。
  - I6 `R8/AC10` CI が token 種別/最小権限/fork-PR secret 不在/非 Actions CI を未定義 → **open (R8 に CI provider matrix を要追記)**。
  - I7 `R10/D-G` 契約が 3 種に限定 → **R10 拡張** (hook/config/team/plan/review-evidence schema + exit-code/error を追加)。
  - I8 `D-E` fence の入力が agent 生成 patch なら schema 検証/sandbox/path allowlist/承認条件が必要 → **D-E 拡張で反映**。
  - I9 `R12/D-H` 署名/checksum の検証主体・root of trust 不明 → **D-H 拡張で反映**。
- **Minor (4) — disposition**:
  - M1 `R11` README 肥大化 → quickstart と詳細 method docs を分割 (R11 で考慮、**open**)。
  - M2 `R2/AC2` 「画面なし」が `src/web` 除外のみで弱い (web assets/dashboard routes/frontend deps/Playwright residue) → **要 AC2 拡張 (open)**。
  - M3 `R4/AC5` PO 承認の**記録場所/形式**未定義 → **要追加 (open、audit evidence 保存先)**。
  - M4 `AC3/AC8/AC10/AC13` が観測語止まり → expected exit code/検査コマンド/fixture/失敗条件まで落として機械検証可能化 (**open**)。
- **go 前の必須クローズ**: C3 (最小公開セット) + I1/D-A (clean channel) を PO 確定 → 残 open (I6/M2/M3/M4) を AC 精緻化。

## 8. セットアップ必要物 全数インベントリ (洗い出し / completeness map)

PO 指示「セットアップとして必要なものをすべて洗い出して」への完全性マップ。各項を R/D/AC へ写像し、取りこぼし 0 を可視化する。

- **A. 配布チャネル & 成果物**: ① clean channel (dogfood 非搭載で pull 可) `R1/D-A` / ② 同梱境界の正本
  (公開=engine+方法論+adapter templates+schema、非公開=dogfood) `R1/D-B` / ③ 画面非同梱 `R2` / ④ LICENSE `R13` /
  ⑤ consumer doc = **README 拡張** (install/update/uninstall + 方法論) `R11/D-I` / ⑥ release 完全性 (署名/checksum)+出所 `R12/D-H` /
  ⑦ **adapter テンプレ (CLAUDE.md/AGENTS.md/.claude 見本、投影元、現状不在)** `R14`。
- **B. ホスト環境前提 (土台)**: ① Bun ≥1.3 `R6` / ② git `R6` / ③ gh+GitHub auth `R6` / ④ runtime CLI (claude/codex の
  いずれか+ログイン) `R6/R7` / ⑤ PATH 健全性 + OS (Windows-native / WSL2 optional) `D-F` / ⑥ preflight 検査
  (欠落=明示診断、auto-install は opt-in) `R6/D-F/AC8`。
- **C. install / 起動導線**: ① engine install path (`private` 解除 or git-install、dist 生成 prepare/postinstall or
  release binary) `R3` / ② 投影 hooks の install-path 解決 (engine 実体を指す) `D-F/AC8` / ③ 1 マシン複数 project の
  version 分離 (tag-pin per project) `R10/D-G/AC12`。
- **D. project への adapter 投影**: ① **adapter テンプレ (投影元) — CLAUDE.md/AGENTS.md/.claude 見本、現状不在=要 author**
  `R14/Scope2` / ② `.claude/settings.json`(hooks) `Scope2` / ③ `CLAUDE.md`/`AGENTS.md` (managed marker 区画) `Scope2` /
  ④ GitHub/CI 足場 (workflows/commitlint/templates、既存) / ⑤ mode 別 review_evidence 要件の投影 `R7/AC9`。
- **E. 導入/更新の非破壊**: ① 途中導入 (既存非空) 破壊なし `R3/AC7` / ② 作りかけ更新 破壊なし `R5/AC6` / ③ managed-marker
  のみ冪等投影 + dry-run + 衝突 fail-close `D-D` / ④ state forward migration (wipe 禁止) `D-D` / ⑤ backup/rollback/
  アンインストール `R9/AC11`。
- **F. モード/認証/CI**: ① consumer mode 確定 `R7/AC9` / ② runtime CLI 未ログイン検出&促し `R7/AC9` / ③ CI 自己充足
  (Bun+token で self-walk) `R8/AC10`。
- **G. バージョニング/契約**: ① semver + tag-pin + CHANGELOG/migration `R10/D-G` / ② 互換 contract test
  (CLI surface / adapter marker / `.ut-tdd` state schema) `R10/D-G/AC12`。
- **H. オーケストレーション方式 (任意設計)**: setup/handover を agent 駆動 workflow 化 (PROPOSE/ENFORCE 分離、
  handover engine 再利用) `D-E`。
- **I. 安全/信頼**: ① hooks=任意 bun 実行の透明化 + 最小権限 + bypass 監査継承 `D-H` / ② secret/token 非記録 `D-H/AC13` /
  ③ host を黙って改変しない `R6/D-F`。
- **J. 検証 (全数 smoke)**: clean clone→setup→doctor green / 既存非空→破壊なし / 更新→破壊なし / 2 回=no-op /
  uninstall→無傷 / consumer CI green / contract 互換 `Step 4`。
- **K. 前提/段取り**: ① リファクタ完了 + digest 訂正 → green HEAD `Step 1` / ② 実 cut は PO 承認後 (外向き不可逆) `R4/AC5`。

漏れを見つけたらこのインベントリへ追加し、対応 R/D/AC を起こす (洗い出しは living)。
