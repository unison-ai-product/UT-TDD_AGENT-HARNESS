# T3 ロット 照合記録 (issue #1149 / #1078、2026-10-19)

処分 JSON `06_PLAN_DISPOSITION_FIRST_PASS.json` で `status` が `completed` の 26 件と `archived` の 3 件のうち、
三者照合 (PLAN ⇔ 設計文書 ⇔ コード) を実施し、最終化できた 7 件の記録である。正本は
`docs/design/harness/L6-function-design/plan-retirement-gate.md` §3.3。

- `consistent`: PLAN・設計文書・コードの三者が一致する。
- `plan-stale`: PLAN 側だけが古く、設計文書とコードが正しい。
- 上記のどちらでもないもの (設計文書かコードが欠けている、または両者がずれている) は最終化していない。末尾の
  「見送った PLAN」を参照。
- 画面カット (#1084 group 13) の PLAN は設計文書の撤去が先なので、この ロットでは扱っていない。

## PLAN-L7-63 の照合

evidenceId: `PLAN-L7-63-plan-registry-fingerprint`。処分: `transferred`、verdict: `consistent`。

- PLAN の契約: `plan_registry.source_hash` (PLAN markdown 全体の sha256) を DB へ投影し、件数が同じでも内容が古い
  persisted harness.db を `stale_plan_registry_fingerprint` で検出する。
- 設計文書: `docs/design/harness/L6-function-design/function-spec.md` の見出し
  「D.4 `src/lint/drive-db-registration.ts`」に、`DriveDbRegistrationStats` の
  `planRegistryFingerprint` / `expectedPlanRegistryFingerprint` と、violation の `stale_plan_registry_fingerprint`
  が記載されている。`plan_registry` の `source_hash` 列は `docs/design/harness/L5-detailed-design/physical-data.md`
  の表にも載っている。
- コード: `src/lint/drive-db-registration.ts` の `analyzeDriveDbRegistration` が、
  `expectedPlanRegistryFingerprint` と不一致なら `stale_plan_registry_fingerprint` を積む。
  `src/projection/domain/plan-projection.ts` が `source_hash: context.hash(source.content)` を投影し、
  `src/schema/harness-db-tables-core.ts` が列を宣言し、`src/state-db/migration.ts` の `addColumnSql` が
  既存 DB へ列を足す。`src/state-db/drive-registration.ts` が `source_hash` から集約値を作る。
- テスト: `tests/drive-db-registration.test.ts` の `U-DDBREG-006`。

## PLAN-L7-64 の照合

evidenceId: `PLAN-L7-64-team-runner-launch`。処分: `transferred`、verdict: `consistent`。

- PLAN の契約: `ut-tdd team run` は Claude / Codex 共通の launch plan を作り、既定は dry-run、`--execute` のときだけ
  provider を起動する。実行は `team_runner` slot で囲み、`strategy=parallel` は `max_parallel` ごとの batch で動かす。
- 設計文書: `docs/design/harness/L6-function-design/agent-slots.md` の「§4 carry / 次工程」の
  「`ut-tdd team run` 配線」が、dry-run 既定、`--execute` 時の `executeTeamRunPlan` と
  `fireSlot(slot_source="team_runner")`、`max_parallel` batch、serialization 時の sequential 縮退を記述している。
  `docs/design/harness/L4-basic-design/architecture.md` の「§3.1 Level 1 — サブシステム」の team 行にも、
  共通 launch plan と明示 `--execute` が書かれている。
- コード: `src/team/run.ts` の `buildTeamRunPlan` (`dry_run: !input.execute`)、`executeMember` の
  `slot_source: "team_runner"`、`executeTeamRunPlan` の `max_parallel` 単位の batch。`src/cli.ts` の
  `team run` に `--execute` option がある。
- テスト: `tests/team-run.test.ts`。

## PLAN-L7-67 の照合

evidenceId: `PLAN-L7-67-team-launch-policy`。処分: `transferred`、verdict: `consistent`。

- PLAN の契約: `recommendTeamLaunch` が task 文から launch 可否・trigger・difficulty を決定論で返す。
  `hybrid` 以外は `unavailable` を返し、暗黙の代替をしない。`ut-tdd team suggest` を CLI 面とする。
- 設計文書: `docs/design/harness/L6-function-design/agent-slots.md` の「§2.2 team.ts (zod single source 設計)」の
  「launch policy (`ut-tdd team suggest`)」の段落が、trivial / simple は単独、standard 以上と risk term は
  hybrid team、非 hybrid は `trigger="unavailable"`、complex / critical の reviewer が `serialize_after: se`、
  critical は `qa` を追加する点まで定めている。oracle `U-TEAM-003` は同ファイル「§3 テスト指針」と
  `docs/test-design/harness/L7-unit-test-design.md` にある。
- コード: `src/team/launch-policy.ts` の `recommendTeamLaunch` (`input.mode !== "hybrid"` で `trigger: "unavailable"`、
  `RISK_TERMS`、critical で `role: "qa"` を追加、`TeamLaunchTrigger`)。`src/cli.ts` に `team suggest`。
- テスト: `tests/team-launch-policy.test.ts`。

## PLAN-L7-66 の照合

evidenceId: `PLAN-L7-66-existing-repo-onboarding-readme`。処分: `transferred`、verdict: `plan-stale`。

- PLAN の契約: 対象 repo に `docs/templates/github/` が無くても `loadTemplates` が組み込みテンプレートで動き、
  対象 repo 側にあればそれで上書きできる。あわせて README に「source checkout からの既存 repo 導入」を書く。
- 設計文書: `docs/design/harness/L6-function-design/setup-solo-team.md` の「§2.6 ストレージ / 配置 / hook」に、
  `BUILTIN_GITHUB_TEMPLATES` を fallback とし、対象 repo の `docs/templates/` が上書きできると明記されている。
  設計文書とコードは一致している。
- コード: `src/setup/index.ts` の `loadTemplates` が `BUILTIN_GITHUB_TEMPLATES` を初期値にして、
  `docs/templates/github` と `docs/templates/adapter` で上書きする。
- テスト: `tests/setup.test.ts` の `U-SETUP-004b`。
- PLAN だけが古い点: README の導入手順は、source checkout ではなく release asset を使う方式
  (README.md「導入」節、Pack の clone と `npm ci` は不要) に置き換わっている。PLAN の README 関連の記述
  (source checkout、`bunx`) は現行と合わないが、正しい側は README と設計文書である。

## PLAN-REVERSE-45 の照合

evidenceId: `PLAN-REVERSE-45-descent-obligation`。処分: `retired`、verdict: `consistent`。

- PLAN が主張する内容: L7 の descent-obligation 実装を L6 の設計と U-DESC テスト契約へ結び付ける Reverse の登録。
  契約本体は持たず、登録 (簿記) だけの PLAN である。
- 設計文書: `docs/design/harness/L6-function-design/descent-obligation.md` が「§1 関数仕様 (signature + DbC)」を持ち、
  oracle `U-DESC-001`〜は `docs/test-design/harness/L7-unit-test-design.md` にある。結び付けは設計文書側に実在する。
- コード: `src/lint/descent-obligation.ts` と `tests/descent-obligation.test.ts` が実在する。
- 廃止の根拠: 契約が PLAN にはなく、結び付け先の設計文書・テスト設計・コードに直接実在する。PLAN を残す理由は
  backfill-pairing gate への登録だけであり、PLAN 退役 (#958 の出口条件、#1078 の gate) と同時に不要になる。

## PLAN-REVERSE-46 の照合

evidenceId: `PLAN-REVERSE-46-deliverable-catalog-extension`。処分: `retired`、verdict: `consistent`。

- PLAN が主張する内容: `PLAN-L7-97` が拡張した `VALID_SUB_DOCS` (L4 に report / batch / notification / code-value を追加)
  を、要件と governance 正本へ back-fill 済みであることの登録。契約本体は持たない。
- 設計文書側の実在: `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` の「G.1 sub-doc 種別 enum」に
  L4 標準成果物カタログ拡張の注記があり、`docs/governance/document-system-map.md` の「§1b 外部設計 標準成果物カタログ」に
  4 型が並ぶ。いずれも docs/design の外にある governance 正本であり、本 PLAN が移す契約は残っていない。
- コード: `src/schema/index.ts` の `VALID_SUB_DOCS` が正本で、`src/plan/lint.ts` は import して使う (重複コピーなし)。
- 廃止の根拠: 登録だけの PLAN で、back-fill の実体は上記の正本と schema に実在する (#958 の PLAN 退役方針、#1078)。

## PLAN-L7-400 の照合

evidenceId: `PLAN-L7-400-feedback-surface-group-before-slice`。処分: `merged`、verdict: `consistent`。

- PLAN の契約: `selectTakeoverFeedback` は group 化してから上位 group を選ぶ (slice より先に group する)。
  実装は `PLAN-L7-403-feedback-surface-context-efficiency` へ統合済みで、本 PLAN は archived の分解起票。
- 設計文書: `docs/design/harness/L6-function-design/function-spec.md` の
  「2026-06-23 feedback surface taxonomy 追補」に、「group-first cap」の規則が記載されている。oracle
  `U-FEEDBACK-SURFACE-001` は `docs/test-design/harness/L7-unit-test-design.md` にある。
- コード: `src/feedback/surface.ts` の `selectTakeoverFeedback` が group を作ってから `.slice(0, limit)` する。
- テスト: `tests/feedback-surface.test.ts` の「selects diverse signal groups before applying the takeover surface limit」。

## 見送った PLAN の一覧と理由

最終化していない 22 件。いずれも処分 JSON は `not-finalized` のまま変更していない。

| PLAN | 見送り理由 |
|---|---|
| PLAN-L7-47-search-metrics-feedback | 設計文書 (`function-spec.md`) の `findReference` signature が `(query, deps)` で、コードは `(db, query: string)`。設計文書とコードがずれている |
| PLAN-L7-48-readiness-guardrail | `recordGuardrailDecision` の本番配線を PO 判断待ちの defer として PLAN にだけ持つ。PLAN にしかない契約が残る |
| PLAN-L7-49-asset-catalog | 設計文書は承認 root を定数 `SOURCES` (`docs/skills` 固定) とするが、コードは `skills` と `docs/skills` の fallback。設計文書とコードがずれている |
| PLAN-L7-50-feature-list-residual-closure | A-133 audit (`.ut-tdd/audit/`) の closure 契約が中心で、設計文書側の照合先が未確認 |
| PLAN-L7-51-descent-obligation | 6 つの WBS をまたぐ。`drive-db-registration` の設計文書の violation 一覧にコードの `mode_catalog_unmapped` が無く、設計文書がコードより古い |
| PLAN-L7-59-detector-hardening | `analyzeVerificationProfileGate` に対応する設計文書が見つからない (設計文書が欠けている) |
| PLAN-L7-60-change-set-integrity | `analyzeChangeSetIntegrity` に対応する設計文書が見つからない (設計文書が欠けている) |
| PLAN-L7-61-telemetry-ingestion-metatest | token ingest の transaction 契約を持つ設計文書が無い。token ingest 退役 (PLAN-L6-789) との関係も未整理 |
| PLAN-L7-62-runtime-portability-guard | `runtime-portability` の設計文書が見つからない (設計文書が欠けている) |
| PLAN-L7-65-deterministic-model-policy | 設計文書 (`agent-slots.md`) は Codex の effort を metadata に留めると書くが、コード (`src/runtime/adapter.ts`) は `-c model_reasoning_effort=` を注入している。設計文書がコードより古い |
| PLAN-M-00-verify-cutover | roadmap registry と A-132 audit の契約。設計文書側の照合先が未確認 |
| PLAN-M-01-cutover-backfill | 同上 (cutover の strategy 文書は `docs/migration/` で、設計文書ではない) |
| PLAN-RECOVERY-01-internal-asset-recovery | 照合が量的に終わらず、確実なものを優先して見送り |
| PLAN-RECOVERY-02-vmodel-canonical | 同上 |
| PLAN-RECOVERY-04-roadmap-definition | 工程表定義の製本化。契約が concept / requirements 側にあり、設計文書への移管先が未確定 |
| PLAN-DISCOVERY-02-roster-design | 照合が量的に終わらず見送り |
| PLAN-DISCOVERY-03-skill-design | 同上 |
| PLAN-DISCOVERY-04-process-workflows | 同上 |
| PLAN-DISCOVERY-06-orchestrator-rule-parity | PoC の S4 判断記録。「SSoT + materializer + rule-drift 拡張」の採否の行き先を確認できていない |
| PLAN-L7-462-bun-runtime-withdrawal | 大きな troubleshoot PLAN。段階移行の残差が複数あり、確実に照合できていない |
| PLAN-L7-401-attempt-escalation-surface-cap | PLAN にしか書かれていない規則が残っている。表示の既定閾値を下げたいときは PO 承認で定数を変更する規則 (PLAN 本文 §2) が、function-spec.md の該当節にも統合先 PLAN-L7-403 にも無い。コードと設計文書の cap 契約 (既定 10 件、total 維持、breadcrumb) 自体は一致している (Sol r1 の指摘で見送りへ戻した) |
| PLAN-L7-102-web-dashboard-phase-b | 後継 (PLAN-L7-141) への部分 supersede の疑い。部分 supersede は契約上、最終化しない |
