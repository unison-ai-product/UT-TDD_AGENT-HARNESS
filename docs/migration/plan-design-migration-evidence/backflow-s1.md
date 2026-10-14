# PLAN → 設計文書 還流証跡 (slice backflow-s1、issue #958 / #959)

目的: slice s1 (43 PLAN) の使い捨てられないもの (未達 DoD / carry / 実在する依存 / PLAN にしか無い oracle / 責務範囲) を設計文書へ移し、区分を決める。
基準 commit: d5ad67fb50c148ea8dd6d5475bab4b88f2d4cd4c (origin/main)

状態: **途中経過 (処理済み 6 / 43)**。残りは末尾に列挙。区分の集計は処理済み分のみ。

| 区分 | 件数 (処理済み分) |
| --- | --- |
| 使い捨て可 | 4 (DISCOVERY-01, 02, 03 暫定, 06 暫定) |
| 還流済み | 0 |
| 廃止 | 0 |
| 要判断 | 2 (DISCOVERY-04 暫定, DISCOVERY-05) |

「暫定」は、PLAN 内の主張 (他文書への back-fill 済み) を設計文書側の grep で全件は照合していないことを示す。照合が済むまで確定扱いにしない。

| PLAN | blob sha256 (origin/main) | 区分 | 移し先 (path と節) | 剥離した依存 | 備考 |
| --- | --- | --- | --- | --- | --- |
| PLAN-DISCOVERY-01-workflow-metamodel | ca9fc92443a821713918114d5a4978e5da3b7e1a1192caaf7be8aefc4d713ad0 | 使い捨て可 (暫定) | 既存: concept v3.1 §2.5 (PLAN-REVERSE-08 で promote 済と PLAN 本文にある) | なし (requires 空) | DoD 全 [x]。§8 の L6 carry (駆動プラン template 実フィールド / decision_outcome x promotion_strategy 遷移 / promote-gate 品質バー / 検証 toolbox) は設計側の所在を未照合 |
| PLAN-DISCOVERY-02-roster-design | 9757d394b45f259f59c9a9e92a89c24c3be89b47f666bffbec6fa07e3ae93e22 | 使い捨て可 | 既存: docs/design/harness/L5-detailed-design/module-decomposition.md roster 行、internal-processing.md roster list / roster check | なし | 未達 DoD (L5-05 へ反映: capability 直交 / ID=filename stem / nameMismatch) は両文書に実在。差: PLAN は nameMismatch を WARN とするが、設計は実装 (src/assets/catalog.ts) に合わせ fail-close (exit 1) に訂正済み。L6 carry (agents dir パス解決、zod 化) は未照合 |
| PLAN-DISCOVERY-03-skill-design | fda640615ff21674c70bbfb5a450899a06d11e5c27ca9ea43bf7f7a5ed37713e | 使い捨て可 (暫定) | 未照合: score 飽和の de-saturate carry の所在 (L5-06 / L6 skill 設計) | なし | DoD 全 [x]。carry: recommender スコアリング詳細 / injector の layer 別注入セット |
| PLAN-DISCOVERY-04-process-workflows | 602634a015965801d87385135e3f49f68bd95240063d57bf1efa8b054b2a9307 | 要判断 (暫定) | docs/process/README.md, modes/*, gates.md に実体あり。V1-V4 / V7 (drive 概念の歪み: VALID_DRIVES に mode 値が混在) の解消状況は未照合 | なし | 質問: requirements §1.6 の drive 再設計 (専門職のみ) は実施済みか。未実施なら設計改訂が要る |
| PLAN-DISCOVERY-05-roadmap-registration | fecb91b72dd591ff3420bd12a838a92f415e6085553f7cc2844ffdf495752651 | 要判断 | なし (移せない) | なし | frontmatter の roadmap: block (L7 band の gate 5 / span 9) を src/lint/roadmap-registry.ts の loadRoadmaps が docs/plans を走査して読む。PLAN が registry 実体。質問: 工程表 registry の実体を PLAN frontmatter から設計文書 / registry ファイルへ移す方式 (src の読込元変更を伴う) をどうするか。設計側は architecture.md の roadmap-registry park 節のみで、gate / span 実体は設計文書に無い。DoD 5 件 [ ] は PLAN 本文が S4 confirmed 済みと矛盾しており、記録の更新漏れ |
| PLAN-DISCOVERY-06-orchestrator-rule-parity | 1b46071af16e935d46dbef83c44e1be9442fc44c831df8456f00bb1b706f41fb | 使い捨て可 (暫定) | PLAN 本文は L4 architecture §6 へ back-fill 済み、実装は PLAN-L7-139 / PLAN-REVERSE-139 と記す (未照合) | requires PLAN-L7-114-work-guard は完了済みのため剥離 | 残差: global ~/.codex/ 書込みは別途 PO 判断 (責務範囲の記述) |

## 横断所見 (roadmap registry)

`roadmap:` frontmatter block を持つ PLAN は docs/plans の 8 本 (s1 内: DISCOVERY-05, L3-00-master, M-00-verify-cutover, M-01-cutover-backfill。s1 外: L4-00, L5-00, L6-00, L7-44)。`loadRoadmaps` (src/lint/roadmap-registry.ts) が docs/plans を走査して gate / span を読み、doctor の program-coverage が使う。この 4 本は、設計文書へ gate / span を移して src の読込元を変えるまで使い捨て可にならない。同じ判断で決まるので 1 件の要判断にまとめる。

## 未処理 (37 件)

DISCOVERY-07, 08, 09, 10 / L0-01 / L1-01〜09 / L10-01, L11-01, L12-01, L13-01, L14-01 / L2-00〜04 / L3-00〜08 / L8-01, L9-01 / M-00, M-01

事前スキャン (s1 の frontmatter 依存と未チェック DoD の一覧) の所見:
- 未チェック DoD がある: L0-01 (7)、L1-01/02/04/06/08/09、L3-01/02/03/07、DISCOVERY-10 (4)
- requires/blocks が実在: L1-01 が L1-02〜05 と L3-01 を blocks、L2-01〜04 が L2-00 を parent、L3-04/05/06 が L7 PLAN を blocks

## s1a 追記: 12 PLAN (DISCOVERY-07〜10 / L0-01 / L1-01〜07)

基準 commit: 6a50a74834bbc008abd69359e91300c96dd7392d (origin/main、2026-10-14)。上の表と区分の集計は別に数える。

| 区分 | 件数 |
| --- | --- |
| 使い捨て可 | 6 (DISCOVERY-10, L0-01, L1-01, L1-02, L1-05, L1-07) |
| 還流済み | 5 (DISCOVERY-07, 08, 09, L1-03, L1-06) |
| 廃止 | 0 |
| 要判断 | 1 (L1-04) |

L0-01 は、移し先の `docs/design/harness/L0-planning/charter.md` が `origin/work/docs-issue1019-vmodel-slots-20261014` にあり、main にはまだ無い。charter.md の「未達事項」は PLAN-L0-01 の DoD 7 項目・未決 5 件・後続テーマ 8 件を既に写している。このため、L0-01 の「使い捨て可」は #1021 の merge が前提である。

| PLAN | blob sha256 (origin/main) | 区分 | 移し先 (path と節) | 剥離した依存 | 備考 |
| --- | --- | --- | --- | --- | --- |
| PLAN-DISCOVERY-07-design-bottomup-mode | a71a2a7ec7b51655ff6e25e5eb7dbb2cc35935461da16d19493de6f417d19271 | 還流済み | `docs/process/modes/design-bottomup.md` §5 (① engine の出力契約と未実装欄を新設)、`docs/test-design/harness/L7-unit-test-design.md` 「design-bottomup elicitation の候補 oracle」(CANDIDATE-U-DBUP-001〜008)、`docs/design/harness/L5-detailed-design/internal-processing.md` C.2 の注記を実測に合わせて訂正 | requires DISCOVERY-01 / L4-14 は完了済みで剥離。references の L7-141 / L7-146 は version-up parked で、本 PLAN の責務と独立 | 既存: mode 定義 (modes/design-bottomup.md §1〜4)、L4 function.md §3.1 の mode 表、concept §2.5、requirements §7.8。PLAN にしか無かった engine の 4 関数の契約・finding コード・gap signal・stage を §5 に移した。**差**: L5 C.2 は「L4 §3.1 への外部設計 back-fill は carry」と書いていたが、function.md §3.1 に design-bottomup / version-up / Verify の行が掲載済みなので訂正した (band の暫定扱いは U-ROUTE-R1 で一致検証するまで残す)。**未実装・未実施 (§5 に明記)**: engine は CLI・doctor に配線されておらず (呼び出し元は tests/design-elicitation.test.ts のみ)、中央 UI 15 画面での dogfood (PLAN の Step 5) は未実施 |
| PLAN-DISCOVERY-08-forward-convergence-invariant | 9a00a9a67d50cd6cfcc326d367503017042ba0c932eaac4d0eaea10d8d56b8d1 | 還流済み | `docs/design/harness/L6-function-design/function-spec.md` 「forward-convergence 判定契約」(新設)、`docs/test-design/harness/L7-unit-test-design.md` 「forward-convergence 判定の候補 oracle」(CANDIDATE-U-FCONV-001〜013) | requires DISCOVERY-01 は完了済みで剥離。references の L7-157 / 141 / 146 は再分類済み (141 / 146 は version-up、157 は対象外) | 既存: requirements §6.8.8.1 (不変条件・SSoT 非重複・legacy debt・version-up parked)、`docs/governance/forward-convergence-legacy-debt-audit.md`。PLAN にしか無かった 6 bucket の判定順・spine 接続の 3 条件・`local_impl_only` の理由 10 文字・version_target 台帳を function-spec に移した。**差**: PLAN は対象 kind を impl のみと書くが、実装は `{impl, verify}` (tests の 'verify PLANs are convergence-scoped' で固定) なので設計を実装に合わせた。PLAN の baseline 2 件は IMP-146 で解消済みで allowlist は空。**未実施 (function-spec に明記)**: `not_required` 理由の最低長を schema 側にも明記する Step 5 follow-up |
| PLAN-DISCOVERY-09-version-up-mode | 1beb4deb8405f027a04a103bef620273c25e16e2c0e0dc436456df69ad013ef6 | 還流済み | 既存: `docs/process/modes/version-up.md`、L4 function.md §3.1 の version-up 行と parked track の注記。今回: function-spec 「forward-convergence 判定契約」の outstanding 分離段落、L7 test-design CANDIDATE-U-FCONV-009 / 013 | requires DISCOVERY-01 は完了済みで剥離 | mode 定義・`version_target` の draft 限定・ledger・Forward 合流点は既存の設計文書が持つ。PLAN にしか無かった `analyzeOutstandingWork` の分離規則 (versionUpParked / activeDraftTotal) を function-spec に移した。**テストの穴 (L7 に明記)**: PLAN の AC-1 は tests/outstanding.test.ts が分離を検査するとしているが、実際は `versionUpParked: 0` の値しか見ない。AC-3 (L7-141 / 146 に `version_target: future`) は main で成立 |
| PLAN-DISCOVERY-10-gpt56-tier-routing-bench | c335b462e35649c44b2599bb8edd7f8973f0b444b4c25394928ac79afe9cc928 | 使い捨て可 | 移さない | requires は空。references の L7-75 / 254 / 255 / 256 は完了済みで剥離 | S4 の決定 (Terra 主力 / Sol 上位 / Luna 保留) は後継の PLAN-L7-415 (confirmed、retrofit) が実行し、測定で見つけた欠陥は PLAN-L7-413 / 414 (どちらも confirmed) に route 済み。現行の routing は GPT-6 世代 (`src/team/model-policy.ts` の `gpt-6-luna` / `gpt-6.1-sol`、CLAUDE.md の Model / Effort Routing) へ置き換わり、測定した gpt-5.6 世代は現行ではない。S1 DoD 4 件の未チェックは poc が S4 で閉じた後の記録で、実行すべき作業ではない。運用の罠 (codex exec の stdin を閉じる) は `src/cli/delegation.ts` の stdio 指定に実装済み。**移さなかった判断**: g5.md が保留した「レーンごとの paired 比較・僅差なら現職維持」は poc の S1 判定基準で、harness の機械契約ではない。PO 2026-09-30 の「より安い・より良いモデルへ即時切替する」と衝突するので設計文書へ書かない |
| PLAN-L0-01-vmodel-harness-upgrade-charter | 26440d6bbe16e7ed151da5f770a5b3bc472704d8caaca5ad567ff862d54313a5 | 使い捨て可 (#1021 merge が前提) | #1021 merge 後に `docs/design/harness/L0-planning/charter.md` (「未達事項」)。今回 main の文書で受けられるのは、下記の「未決 5 件の解決先」 | requires 5 件 (REVERSE-44 / L7-44 / L6-26 / L6-27 / L6-31) は完了済みで剥離 | charter.md の「未達事項」は DoD 未達 7 項目・未決 5 件・後続テーマ 8 件を写している。**#1021 merge 後に併記する解決先**: 未決1 (`spec.defines` の置き場) は L4 data.md の SpecDef が「所有 artifact 本文の `spec.defines`」と定めている。未決2 (工程管理表) は `docs/governance/vmodel-upgrade-schedule.md` を authoring source、DB の `schedule_entries` を projection とする。未決5 (109 source の target slot) は `docs/governance/vmodel-source-manifest.md` と ADR-008。未決3 (activation / profile と PLAN status の分離) と未決4 (DDD/OOP を L4 主導にするか) は main の設計文書に決定が見つからず、未決のまま |
| PLAN-L1-01-business-requirements | 0fb7cbf8dad6e0f824fd9f87053c5110682917b9ccd7b02a93c379e1272e9ff1 | 使い捨て可 | 既存: `docs/design/harness/L1-requirements/business-requirements.md` §9.1 (carry 一覧)、§10.2 (L4 carry)、§11、G1-trace 注記 | blocks (L1-02〜05 / L3-01) は全て confirmed で剥離 | DoD の未チェック 8 項目は、business-requirements.md が §1〜§10 と §10.1〜10.3 を持ち、frontmatter・冒頭 blockquote も揃っていることで満たされている。carry の BR-21 / B3 (PoC 打ち切り) / §10.2 / G1-trace は §9.1 に既存。FR-L1-36 / 38 / 43 は functional §1.2 で昇格済み (PLAN-L7-53)。**差**: §9.1 の「BR-21: FR-L1-36/38/43 の詳細仕様 → L3 FR (Phase B)」は、昇格済みなので古い。§9.1 の B3 は「2 sprint 強制」の実装が src に無い。`check_business_entity_coverage` は physical-data.md と L9 ST-DATA-04 が設計済みで、src に実装は無い。PLAN §3.6 の整合課題 3 件は `docs/governance/audit-framework.md` 冒頭が「未解決」として保持している。Phase B の「ADR-002 (2 層分離)」は ADR-005 D2 に置き換わった |
| PLAN-L1-02-functional-requirements | 3abe716aa889dc91968d3d26ab15d7a5a5e48352e2c514eb3d3a61b889e351c7 | 使い捨て可 | 既存: `docs/design/harness/L1-requirements/functional-requirements.md` §1 / §1.2 / §5 | requires L1-01 と blocks L3-01 は confirmed で剥離 | DoD の未チェック (§1〜§6、§5 の baton 表、件数) は、現行 51 件 (P0 19 / P1 24 / P2 8) の functional-requirements.md が満たす。PLAN の「47 件」「46 件」は古い数。carry の FR-L1-36 / 43 は PLAN-L7-53 で実装済み、FR-L1-38 は PLAN-L6-789 で退役予定と functional §1.2 / §5 に記載済み。FR-L1 → L3 の詳細化は L3 functional-requirements.md が持つ (L3 は FR-26 件)。**訂正**: functional §5 の Phase B 行が ADR-002 候補と書いていた参照を、ADR-005 D2 へ訂正した (ADR-002 は依存方向の ADR) |
| PLAN-L1-03-screen-requirements | 60c76064bdca7fd32a31ee4606b5412f323ef07f6fa157ca8f9d08078edaff1f | 還流済み | `docs/design/harness/L4-basic-design/ui-standard.md` §6 (画面の実装方式が未決である旨と、parked PLAN への所有を追記) | requires L1-01 / L1-02 は confirmed で剥離。L2 forward carry (PLAN-L2-01〜04) は L2-screen の 4 文書が confirmed (G2 freeze 2026-06-22) で剥離 | DoD は全件 [x]。carry のうち「HM-08 の BR-21 連動」は L3 business-detail.md、「人間主導 + AI 補助 (CC2) を L3 全 FR に明示」は L3 README と各 FR、「L2 の必須 3 文書」は L2-screen が持つ。**移したもの**: 「14 画面の実装方式 (Tauri / Electron / 純 Web) を L4 ADR で確定」は未実施 (src/web は .gitkeep のみ。実装は PLAN-L7-141 / 146 が version-up で parked)。この未決を ui-standard.md に書いた。GD-01 の Learning Engine 半自動更新 (BB3=b) は Phase B carry のまま |
| PLAN-L1-04-technical-requirements | a33fa47f43efc847fe8a97ebb6533eab15b9dd0d1b5eac7773df598262a94959 | 要判断 | 今回の訂正: `docs/design/harness/L1-requirements/technical-requirements.md` §2 (Phase B の候補を ADR-005 D2 へ訂正)、§5 (実装との差を追記)。移せなかったもの: 下記の質問 | requires L1-01 は confirmed で剥離 | 質問: **L1 技術要求が持つ 2 つの要求 (§4 の closure event 契約 `idempotency_key = mode + plan_id + closure_event_id` と rollback・conflict resolution、§7 の週次 detector 起動と detector_runs の週次レポート) は、L4〜L7 に設計も実装も無い (closure_event_id と detector_runs は src にも docs/design にも出ない)。L1 要求として維持して L4 で add-design するか、要求から外すか。** 訂正した差: §5 は 6 フィールドと `docs/skills/<L>-injection.yaml` を書くが、実装 (`src/vmodel/injection.ts`) は `recommended_agents` を持たない 5 key で、値はコード内の drive × layer 表。`orchestration_mode` の値域は 5 値 (pm_lead など) で実行 mode とは別軸。Bun version pinning の DoD は、技術要求が Node.js runtime に改訂済みで失効 |
| PLAN-L1-05-nfr | f4d404317e28fce466e880728872c8ba4b7c36b46bce7189aa06e1d4c0d29370 | 使い捨て可 | 既存: `docs/design/harness/L1-requirements/nfr.md` §6 の carry note (Phase B telemetry)、`docs/design/harness/L3-functional/nfr-grade.md` §7.2 (NFR-09 補番回復 carry) | requires L1-01 は confirmed で剥離 | DoD は全件 [x]。carry の Phase B telemetry (default off / PII redaction / 同意 default) は nfr.md §6 と L3 business-detail.md に既存。NFR-02 の実現方式は ADR-005 D1 (GitHub-pull) と technical §1 に既存。排泄系契約は nfr.md の carry 宣言に既存。NFR-09 (rule parity) は nfr-grade §7.2 が「L4 で再採番判断」と保持している。L4 architecture.md に orchestrator-rule parity があるが、再採番の判断は main に見つからず、nfr-grade §7.2 が所有する未決のまま |
| PLAN-L1-06-vmodel-upgrade-requirements | cc1accf28c26ea25ba886a410f392f874e3585fd9c40997907c1706c9139e120 | 還流済み | `docs/test-design/harness/L14-vmodel-engine-swap-operational-test-design.md` 「VUP-REQ-01〜08 の候補 OT」(CANDIDATE-OT-VUP-001〜008) | requires (L0-01 ほか) は完了済みで剥離 | 要求本体 (VUP-REQ-01〜08) は `vmodel-upgrade-requirements.md` に既存で、DoD 5 件はそれで満たされる。PLAN の Step 4 は L14 の運用検証方針を U7 で追加すると定めたまま未着手だった。実測で、旧 pair とされる `L14-operational-test-design.md` に `VUP` の出現は 0 件。engine-swap delta (L1-07) は「VUP-REQ-01〜08 は旧 confirmed pair へ固定」と書くが、その pair に OT 行が無い。この食い違いを解くため、受入条件を運用 oracle に写した候補 8 件を delta の pair 文書に追記した |
| PLAN-L1-07-vmodel-engine-swap-requirements-delta | 0f34be3aea9ff804339abea103c1fff400af1ed5d3aac2c0cef06358667be03e | 使い捨て可 | 既存: `docs/design/harness/L1-requirements/vmodel-engine-swap-requirements-delta.md`、`docs/test-design/harness/L14-vmodel-engine-swap-operational-test-design.md`、`docs/governance/vmodel-upgrade-schedule.md` (現在地・U18a〜g) | requires L1-06 は confirmed で剥離 | delta の VUP-REQ-08A / 09 / 10 は設計文書と対の OT が既存。PLAN §6 の現在地 (L5〜L14 への降下・全 docs 判定・独立 self-proof は未完) は工程管理表と下流 PLAN (U18a〜g、L5〜L14 の verify PLAN) が持ち、本 PLAN の confirmed は L1 要求 delta の pair-freeze だけを表す (delta §5 に明記)。上の L1-06 行の、旧 pair の食い違いは本 PLAN の記述 (§5) にも及ぶ |

### s1a の要判断

| PLAN | 質問 (1 行) |
| --- | --- |
| PLAN-L1-04 | L1 技術要求の「closure event 契約 (idempotency_key / rollback / conflict resolution)」と「週次 detector 起動 + detector_runs の週次レポート」は、L4〜L7 に設計も実装も無い。L1 要求として維持して L4 で add-design するか、要求から外すか |
