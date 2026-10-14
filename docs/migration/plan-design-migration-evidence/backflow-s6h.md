# PLAN → 設計文書 設計還流 証跡 (slice s6h、issue #958)

目的: PLAN に残る「使い捨てられないもの」(未達の DoD、carry、実在する依存、PLAN にしか無い oracle、責務の範囲) を設計文書 (`docs/design/`)・test-design へ移し、
PLAN を「使い捨て可」または「廃止 / supersede 済み」にする。担当は L6 12 件と L5 2 件の計 14 件。

基準 commit: origin/main `a950384fecb478bc5adfd6bacf8af624bb750ec0`

## 件数

| 区分 | 件数 | PLAN |
|---|---:|---|
| 使い捨て可 | 3 | L6-62, L6-75, L5-26 |
| 還流済み | 9 | L6-48, L6-63, L6-64, L6-71, L6-72, L6-74, L6-78, L6-79, L6-80 |
| 廃止 | 0 | |
| 要判断 | 2 | L6-81, L5-25 |

移し先の略称: FS = `docs/design/harness/L6-function-design/function-spec.md`、RCM = `.../release-channel-manifest.md`、PF = `.../vmodel-pair-freeze.md`、
MD = `.../module-drift.md`、GE = `.../governance-enforcement.md`、IP = `docs/design/harness/L5-detailed-design/internal-processing.md`、
L7U = `docs/test-design/harness/L7-unit-test-design.md`。

| PLAN | blob sha256 (origin/main) | 区分 | 移し先 (path と節) | 剥離した依存 | 備考 |
|---|---|---|---|---|---|
| PLAN-L6-48-vmodel-l2-freeze-l5-verification-design | `c984319ad20a19cd1cb8fbe37cb172093decc291193e4a2cf1d227da8aee337f` | 還流済み | PF §8 (L2 prototype 合意 / L5 検証設計の被覆。実装 `src/vmodel/lint.ts` `analyzeForwardFreezeContracts` に合わせた条件表・違反 reason・不変条件)。oracle `U-FREEZE-CONTRACT-001..004` は L7U に既存 | requires PLAN-L7-391 (完了済み) | spec ブロックあり (VMS-010)、退役時に移設。`vmodel-typed-spec-definitions.md` の `ledger_sources` もこの PLAN を指す |
| PLAN-L6-62-design-doc-secret-scan-gate | `610d332e78fa0b1893fd1299881eeef3237bd8801f5ba9364f5d70aec59c2c41` | 使い捨て可 | 既存: `secret.md` §2 契約表 (`analyzeSecretScan` / `loadSystemSecretScanArtifacts` / `checkSecretScan` / distribution preflight / pre-push)、L4 `security.md` (ローテーション運用は方針の明文化のみ・実行は別 runbook)、L7U `U-DOCSECRET-001..007` | requires PLAN-L4-16 (完了済み) | 契約表・fail policy・発火点・scope 外 (鍵の失効 / 再発行) のいずれも設計側に既存で、ずれなし |
| PLAN-L6-63-pack-staged-release-rollback | `970a4d052232f2b7a3f83163bc110d9da4c475b2d424b94e9ae65cde7eea380c` | 還流済み | RCM §9 (公開 object と可変範囲、tar / gzip / asset inventory / control snapshot の byte 契約、一方向 DAG、段階公開、remote mutation receipt、公開 FSM と rollback FSM、持ち越し、oracle の対)。§7 は g1 で移行済み | requires PLAN-L7-494 / 496 / 499 / 500 (完了済み)、blocks PLAN-L7-473 / PLAN-L6-102 (設計側に責務として RCM §8.3 / §9 が持つ) | PLAN 本文の control snapshot digest 記述は実装より簡略で、実装 (`pack-publication-staging.ts`) に合わせて書いた。stable pointer と rollback FSM は未実装と明記 (adapter の遷移は canary まで)。least-privilege profile は持ち越しとして残した。二 consumer 受入は PLAN-L6-101 の責務。oracle `CANDIDATE-PACKPUB-001..004` は L7U に既存 |
| PLAN-L6-64-cli-shell-completion | `2180349cb70e1973ae9967de656eb7f5a769698b7ba88e38d4ff919fabadb5ba` | 還流済み | L4 `external-if.md` §9 は g4 で移行済み。今回は L7U に `CANDIDATE-U-CLICOMP-001..007` (catalog 抽出 / 必須 metadata / 部分集合 / 正例 3 件 / 入力 protocol / exit carve-out / 軽量早期分岐) | requires PLAN-REVERSE-395 (完了済み) | 実装の所有は PLAN-L7-449 (draft)。`completion` command は `src/cli.ts` に無い |
| PLAN-L6-71-plan-asset-canonical-migration-contracts | `775517a1049eb499d02118e401f9322ef4d5ef8cdf5aa8e793ea1b35010744ec` | 還流済み | FS (reservation 契約の前、legacy 移行の節): legacy asset ID の導出 (`deriveLegacyAssetId`) と revise の不変性。他の契約 (DTO / error / reservation FSM / alias collision) は FS に既存、oracle は L7U `U-PA-001..007` に既存 | blocks PLAN-L7-418 (完了済み) | 新設は asset ID 導出式のみ。実装 (`legacy-plan-adapter.ts:48-57`、`plan-asset.ts:105-135`) と一致を確認 |
| PLAN-L6-72-forward-fsm-evidence-policy-contracts | `815f3f3e6673ee067ce865769c1aa624301a0131d202550b55a1622c45b7d636` | 還流済み | FS「Forward FSM の実装正本」(event 語彙 17 件の closed-world 表、evidence policy 行、CLI envelope `forward-cli/v1`、exit 割当)。oracle `U-FSM-001..009` / `P-FSM-001` は L7U に既存 | references PLAN-L6-71、blocks PLAN-L7-419 (完了済み) | FS の既存「完全遷移表」は event 名 (underscore)・`resume` の復帰先・envelope が実装と食い違っていたため、実装 (`transition-policy.ts`、`forward-workflow.ts`) に合わせて差を明記した (既存の表は消さず、食い違う箇所は新節を正とした)。PLAN 本文の訂正注記が指す PLAN-L6-89 (evidence policy の訂正) は担当外 |
| PLAN-L6-74-repository-docs-disposition-auditor-contracts | `56654a9e31e9f7a5c0ce90f4286ecc945e8e5edf0900d70974152e115578a2cf` | 還流済み | FS「リポジトリ文書snapshot／disposition／reference closure」節の末尾に CLI の command / query 分離を追記 (`init` / `materialize` / `set` と `diff` / `references check` / `check` / `report`、exit 0 / 1 / 2)。他は FS と L7U / L8 / L9 の `*-DOCLEDGER-*` に既存 | (なし) | draft。実測で snapshot capture と closure analyzer の domain / application だけが実装され、CLI と reference reader は未実装 (未実装の目標契約と明記) |
| PLAN-L6-75-engine-swap-domain-method-port-contracts | `8efc9f158114ce2bad919b21a4ce037e78ca05828bb2e4a044d2f09c0cf6acd1` | 使い捨て可 | 既存: L5 `module-decomposition.md` C.1〜C.3 (依存規則、80 行 / CC12 / nesting 3 / cycle 0、CQS、二段階初期化禁止)、FS の `DbIntrospectionPort`、reservation 契約、L7 ownership DAG | (なし) | 全項目が設計側に既存。ずれなし |
| PLAN-L6-78-coding-structure-rules-contract | `a66ecec1ffd81883c4fcf49c66c873896f9300a9f1dbd8c32c097e663cd58202` | 還流済み | MD「Coding Rules 追補」に構造規約 analyzer の契約 (排他分類、関数契約、段階導入、oracle) を追記。L7U に `CANDIDATE-U-CODSTRUCT-001..006` | (なし) | draft。実測で構造規約を検査するコードは `src/` に無く、宣言のみの規約。CQS と guard clause を review 責務とする分類は L4 の「限定 pattern から始める」を受けた暫定で、analyzer 実装 PLAN が確定する |
| PLAN-L6-79-plan-number-allocation-uniqueness | `e99ba9467ae2c04dabe4551a7cd280fc4fd2ba7963715e46a8536fcd70af0bbe` | 還流済み | FS (reservation 契約の直後) に PLAN 番号一意性の契約。oracle `U-PLANGOV-002a..d` は L7U に既存 | (なし) | draft。検出 (`duplicate_plan_identity` と `LEGACY_PLAN_ID_COLLISION_DEBT` の exact set) は実装済み。予約台帳の `plan draft` への配線は実測で無く、未実装の目標契約として明記 |
| PLAN-L6-80-doctor-decomposition-check-contract-pairs | `ff278bccbb40f406a856a589f84fb036a55ffe227318a5e00b8499bef8db85ed` | 還流済み | GE §9 (check の 3 点 trace、pure core / adapter 分離、環境検査の隔離、挙動不変)。L7U に `CANDIDATE-U-DOCPAIR-001..004` | (なし)。範囲外の meta-verifier は PLAN-L7-425 / PLAN-L6-77 の責務 | draft。未実装の目標契約 |
| PLAN-L6-81-vmodel-specialist-agent-registry | `45b1e2c8ea526b727689a1969cc16ca61e7c6ea67a3e1f85e7b2886d82d2396f` | 要判断 | 移していない | (なし) | 質問: 「HARNESS 所有の agent 定義正本 (`.ut-tdd/agents/*.yaml`) から `.claude/agents` と `.codex/agents` を射影する registry」をこれからも設計目標として残すか、廃止か。PLAN は旧 model 名 (Terra / spark / mini) と subagent 前提で書かれ、実測では registry も `ut-tdd agents sync` も無く、GUI-first (2026-10-08) と GPT-6 の 3 モデル割当への再編後の方針が PLAN に反映されていない |
| PLAN-L5-25-resource-kernel-physical-protocol | `b5af4314765133086e5a5fbf6ff942f6d152fcc74f68334449aff8c2475fedc7` | 要判断 | IP 付録 D.5〜D.9 (責務配置と禁止、wire のスキーマと故障の分類、token / lease / recovery observation の field と variant、dispatch record の状態機械、custody 状態と release 式、deadline と recovery の式、二重 crash、pair-freeze 条件)。oracle `IT-RGK-PHYS-001..042` は L8 に既存 | blocks PLAN-L6-92 (設計側に D.5〜D.9 が責務として持つ) | 質問: doctor gate `resource-kernel-pair-mapping` と `resource-kernel-fixture-manifest` が PLAN §7.1 の契約 `C-RGK-01..58` 写像表を直接読む (`src/doctor/doc-registry.ts`) ため、PLAN を使い捨てにするには読み先を設計文書へ付け替える src 変更が先に要る。付け替えの PLAN を起こしてよいか。写像表は同じ契約を 2 か所に書かないよう今回は複製しなかった。設計本体は還流済み (未実装の目標契約。`src/resource-kernel/` は無い)。PLAN は draft・自己 supersede の記載あり |
| PLAN-L5-26-node-generation-activation | `dcaf0807a6ee3c6d31b6b89e12eacdea91b227957d77d34fae4b159a1a4dce9d` | 使い捨て可 | 既存: IP「Node build generation内部処理」(activation protocol 7 手順、lock の永久 fail-close、F0 rollback、GC 禁止) と「Node切替receipt chain」(#977 で退役済みと注記)。L8 の `CAND-NODEBOOT-101..106` / `CAND-CUTOVER-101..113` に対が既存 | (なし) | PLAN §3 の cutover receipt chain は退役済みの設計で、設計文書側に退役注記がある。移さない |
