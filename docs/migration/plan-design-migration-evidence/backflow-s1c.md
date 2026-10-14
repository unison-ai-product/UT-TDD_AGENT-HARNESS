# 設計還流 証跡 (slice s1c、issue #958)

## 目的

PLAN を「使い捨て可」(設計文書への pointer 以外を捨てても何も失われない) か「廃止 / supersede 済み」にするため、PLAN にしか無い未達の DoD・carry・実在する依存・oracle・責務の範囲を設計文書 (`docs/design/`、oracle は `docs/test-design/`) へ移す。本書は、その slice s1c (L3 の PLAN 9 件、L8 / L9 の検証 PLAN 各 1 件、M 系 PLAN 2 件の計 13 件) の判定と移し先を記録する。

- 基準 commit: `6a50a74834bbc008abd69359e91300c96dd7392d` (origin/main)
- 先行の分類候補 (`issue959-human-disposition-f-20261013`) は参考にとどめ、判定の根拠には使っていない。PLAN は全文を読み、`src/` の実装と設計文書を突き合わせた。
- 移行済みの g1〜g5 に、本 slice の PLAN は載っていない。
- L8 / L9 の検証文書の移し先は、V 字の対応表 (`origin/work/docs-issue1019-vmodel-slots-20261014:docs/test-design/harness/vmodel-pair-map.md`) の「L5→L8」「L4→L9」に従った。その branch の文書は main に無いため、そこへ書く内容は備考に「#1021 merge 後に <path> へ」と記した。

## 件数の集計

| 区分 | 件数 | PLAN |
|---|---|---|
| 使い捨て可 | 4 | PLAN-L3-01、PLAN-L3-02、PLAN-L3-03、PLAN-L3-06 |
| 還流済み | 3 | PLAN-L3-05、PLAN-L3-07、PLAN-L3-08 |
| 廃止 | 0 | - |
| 要判断 | 6 | PLAN-L3-00、PLAN-L3-04、PLAN-L8-01、PLAN-L9-01、PLAN-M-00、PLAN-M-01 |
| 合計 | 13 | |

要判断の 6 件は 3 つの問いに分かれる (末尾の「要判断の問い」)。PLAN-L3-04 と L8-01 / L9-01 は、機械が PLAN を直接読む箇所または PLAN id への束縛が残るため、内容を移しても PLAN を捨てると機能が欠ける。

## 触った設計文書・test-design

| path | 変更 |
|---|---|
| `docs/design/harness/L6-function-design/function-spec.md` | Appendix D に D.7 (residual 閉包の lint 群) と D.8 (telemetry / 自己改善の閉包の lint 群) を追加 |
| `docs/design/harness/L3-functional/nfr-grade.md` | §8 NFR Contract catalog (未実装の目標契約) を新設。旧 §8 関連 doc は §9 に繰り下げた |
| `docs/governance/design-decision-elicitation.md` | 「設計判断の記録」と「後続候補 (未実装の目標)」を追加 |
| `docs/test-design/harness/L12-acceptance-test-design.md` | §8 に `CANDIDATE-AT-NFRC-001〜006` を追加 (nfr-grade §8 と対) |
| `docs/test-design/harness/L7-unit-test-design.md` | `CANDIDATE-U-DMP` / `U-RAC` / `U-HOWRD` / `U-TCLOS` / `U-CP4` の候補 17 行を追加 (function-spec D.7 / D.8 と対) |
| `docs/test-design/harness/L8-integration-test-design.md` | 「engine-swap G8 の close 条件」を追加 |
| `docs/test-design/harness/L9-system-test-design.md` | 「engine-swap G9 の close 条件」を追加 |

## PLAN ごとの判定

| PLAN | blob sha256 (origin/main) | 区分 | 移し先 (path と節) | 剥離した依存 | 備考 |
|---|---|---|---|---|---|
| `PLAN-L3-00-master.md` | `583eb1c33bc31891b7370a7ae6f8e0f54b9e0fbd029c10c8d19576562dc570b4` | 要判断 | 移さない | なし | upstream バンドの工程表 host。frontmatter の `roadmap:` (gate `G-REQ.L1` / `G-REQ.L3` と L1 x5、L3 x3 の span) は `src/lint/roadmap-registry.ts` が PLAN から直接読み、`PROGRAM_BANDS` の upstream の被覆根拠になる (`tests/roadmap.test.ts` が実 repo の PLAN-L3-00 を引く)。L3-04 / 05 / 06 / 07 が `parent` で指す。設計文書側には G-REQ の定義が無い。問い 1 |
| `PLAN-L3-01-functional-detail.md` | `6ef334d305ee73dc89e4206d99cb6ee275025f791f637e4908d6d3090d85086f` | 使い捨て可 | 既存: `functional-requirements.md` §1 (スコープ 26 件)、§2 (統合表、AC は GWT・最低 3 件・`AC-{FR-ID}-{NN}`、対応 mode・drive・人間判断点の列)、§3 / §3.1 (P1 / P2 の carry)、§4 (画面 trace)、§5 (9 mode・drive・人間判断点)、§7 (L4 / L7 / L12 への carry) | `requires` の PLAN-L1-01 / 02 / 03 (confirmed、完了済み)。`blocks` は空 | U-L3-1〜11 の決定はすべて設計文書に既存で、移すものは無かった (grep と §3 の読みで照合)。DoD の未チェックと Step 7 の未了は PLAN 側の進捗記録で、review_evidence (A-100 のサインオフ) があり設計文書は confirmed。設計文書の `PLAN:` 行と README の「担当 PLAN」列は pointer だけ |
| `PLAN-L3-02-business-detail.md` | `1f9a9ed606dc44f78f97b04cf861c2926a03ad527b3a9bf594074d66426a9606` | 使い捨て可 | 既存: `business-detail.md` §1 (評価対象)、§2 (5 指標)、§3 (sprint 末 + 手動)、§4 (全件人間承認)、§5 (HM-08 の 4 データソース・30 秒ポーリング・AI 指示 copy UI)、§6 (Phase A / B 境界、Phase B 着手の AND 条件、telemetry の default)、§7 (FR-L1-36 / 38 / 43) | `requires` の PLAN-L1-01 / 02 / 03 (完了済み)。`blocks` は空 | U-BR21-1〜10 の決定を §1〜§7 と突き合わせ、すべて既存。気づいた設計文書間の食い違い (PLAN の問題ではないので直していない): `functional-requirements.md` §3 は FR-L1-36 / 38 / 43 を「PLAN-L7-53 で実装済み」と書く一方、`business-detail.md` §6 / §7 は Phase B のままである |
| `PLAN-L3-03-nfr-grade.md` | `f62703f2f69de538a059cfc7ef5e90e8cd62cb1e1a3e1278348a6656e7740f1b` | 使い捨て可 | 既存: `nfr-grade.md` §1〜§6 (IPA グレード Lv2 / 2 / 3 / 2 / 3 / 3、KPI D-02 >= 90% / D-05 >= 95% / D-06 <= 2 (努力目標 0) / D-09 >= 95%)、§7.1 (NFR-02 / 15 の L4 ADR carry)、§7.2 (NFR-09 の補番)、§7.3 (Phase B の telemetry と NFR-18)、§7.4 / §7.5 | `requires` の PLAN-L1-05 / PLAN-L1-01 (完了済み)。`blocks` は空 | U-NFR3-1〜15 の決定をすべて既存の節と照合した。移すものは無かった |
| `PLAN-L3-04-upstream-schedule-reconciliation.md` | `f31d43b8ccb552e5a24f3f437cbeef38b868996fcfa9c7cb5baa150dfb80f733` | 要判断 | 還流した: `function-spec.md` D.7 (閉包原則、V 字の閉包表の必須列、11 入口 mode の passage certificate、DB 登録 gate (D.4 への参照)、rule automation closure の 5 規則、handover 完了表現 guard)。oracle は `L7-unit-test-design.md` の `CANDIDATE-U-DMP-001〜003` / `U-RAC-001〜003` / `U-HOWRD-001〜003`。fr-roadmap-coverage の契約は既存 (D.5) | `requires` (L1 / L3 の FR・roadmap・PLAN-L7-44・A-133) は完了済み。`blocks` の `PLAN-L7-50-fr-roadmap-coverage-lint` は docs/plans に同名が無い (dangling)。WBS 9 件 (feature flag `ff_*` を含む) は完了した作業手順で、`ff_*` は `src/` に 0 件 | `loadDriveModelPassageDocs` / `loadRuleAutomationClosureDocs` が **PLAN-L3-04 の本文** (節 2.1 と 2.3 の表) を読み、`tests/drive-model-passage.test.ts` も同じ PLAN を引く。D.7 に同じ表を書いたため、入力の付け替えまでは 2 か所に同じ内容がある。設計は移し終わっているので、問い 2 の判断で PLAN を捨てられる。A-133 の residual 表は `.ut-tdd/audit` にあり PLAN には無い |
| `PLAN-L3-05-harness-telemetry-closure.md` | `a68a95e4ad456bbaf43335757d712db255364467da4714be75651adc0ff48bf0` | 還流済み | `function-spec.md` D.8 (閉包原則、closed と呼べない条件、`telemetry-closure` 9 行 / `cycle-p4-verification` 11 行 / `l14-close-audit` 17 行の検査契約)。oracle は `L7-unit-test-design.md` の `CANDIDATE-U-TCLOS-001〜003` / `U-CP4-001〜005` (`U-L14CLOSE-001〜008` は既存)。既存: skill 推薦・割当は `skill-index.md`、project-hook は `function-spec.md` の hook 節、telemetry の表 (`skill_invocations` / `issue_queue` / `trouble_events` / `improvement_log`) は `physical-data.md` | `requires` (L3 FR・function-spec・L8 / L9 test design・A-134) は完了済み。`blocks` の `PLAN-L7-51-skill-injection-runtime` と `PLAN-L7-52-telemetry-feedback-loop` は docs/plans に同名が無い (dangling)。Gap Summary 表は 2026-06-12 時点の状態で、§4 の通り解消済み。WBS 10 件 (feature flag `ff_*` を含む) は完了済みで `ff_*` は `src/` に 0 件 | 3 つの lint は `.ut-tdd/audit` の A-134 / A-136 / A-143 を読み、PLAN は読まない。PLAN の `generates` に列挙された src / tests / audit はすべて実在 |
| `PLAN-L3-06-screen-functional-body.md` | `7f2fa886f988daa5c72396c49c319507c232b15e50ad6e63b7d05123aac41ac0` | 使い捨て可 | 既存: `screen-functional.md` (中央 dashboard 15 画面の PM-01〜06 / HM-01〜08 / GD-01 すべてに機能要件と受入)。`document-system-map.md` に body 在席の記述が既存。`src/lint/frontend-design-coverage.ts` と `tests/frontend-design-coverage.test.ts` が実在 | `requires` の L1 screen / L2 screen-list / L2 ui-element (confirmed)。`blocks` の `PLAN-L7-141-web-dashboard-component-derived` (draft) は、確定済みのこの設計文書の存在に依存するだけ | pair-map の表 1 で `screen-functional.md` は「節が無い」(L12 に名前の言及 0 行)。L12 への節の追加は、#1021 merge 後に pair-map の行に従って `docs/test-design/harness/L12-acceptance-test-design.md` へ入れる別 slice の仕事 |
| `PLAN-L3-07-design-decision-elicitation-format.md` | `9710c03c32aad261fc79b926c152fc2c0bf879566d8ba6642c2f466711d4b820` | 還流済み | `docs/governance/design-decision-elicitation.md` の「設計判断の記録」(3 層で実現・hook 強制の見送り) と「後続候補」(ステージ紐付きのエリシテーション)。既存: 共通ルール、Claude / Codex 側の実装、非対話時の扱い。skill と `CLAUDE.md` / `AGENTS.md` の節も実在 | `requires` は空。`references` の PLAN-L6-53 は参照のみ。後続候補の依存 (Forward FSM、`PLAN-L7-419-forward-fsm-transition-workflow-cli`) は設計文書に責務の依存として書いた | DoD のうち文書・skill・両 adapter の節の 3 項目は成果物の実在を確認した。`plan lint` と `doctor` の green は本 slice では流していない。PLAN の status は draft のまま。成果物の置き場は `docs/governance` (design ではなく governance)。この文書自体に pair の test-design は無い |
| `PLAN-L3-08-nfr-contract-catalog.md` | `23f6319b62286fdc107a561ff43df4b62e2159335a6387c536841b39309f0d38` | 還流済み | `nfr-grade.md` §8 (未実装の目標契約): 必須 field、12 category、fail-close 5 種、`subject` の二重性、supersession、統計的判定の属性、降下の順序、未了の項目。oracle は `L12-acceptance-test-design.md` §8 の `CANDIDATE-AT-NFRC-001〜006` | `requires` の PLAN-L3-03 / PLAN-L1-05 (完了済み)。`blocks` は空。実在する順序の依存は設計文書に書いた: 契約 catalog (L3) -> 方式設計 (L4、PLAN-L4-31) -> L6 契約 (PLAN-L6-87) -> L7 実装 | `src/` と `tests/` に NFR Contract の実装は 0 件 (grep)。未了として残したもの: 12 category の排他分類と 12 種の外の候補の分類 (IMP-174 / 176 / 177)、manual evidence の宣言の具体形 |
| `PLAN-L8-01-engine-swap-integration-verification.md` | `2264eb21ca73191395ab2fae4505289f279d71ed8a7badb31236f19fbb34308a` | 要判断 | `L8-integration-test-design.md` に「engine-swap G8 の close 条件」を追加 (初期の close 対象、manifest の記録項目、exit criteria)。defect の経路は §6 に既存。#1021 merge 後は、pair-map の「L5→L8」の行に合わせて置き場を確認する | `parent` の PLAN-L4-24 (draft) は G8 が前提にする契約の出どころ。順序の都合で、設計文書には依存として書いていない | `docs/process/vmodel-contract.yaml` の L8 が `verification_plan_id: PLAN-L8-01-...` と `evidence_manifest` (`engine-swap.json` は未生成) を持つ。`contract-compiler.ts` は接頭辞しか検査しないが、G8 の実施の追跡が PLAN id に束ねられている。さらに、PLAN の選んだ IT 行以後に追加された `IT-DOCLEDGER-03..07` / `IT-PROJECTION-REBUILD-01..03` の mandatory 区分が未宣言。問い 3 |
| `PLAN-L9-01-engine-swap-system-verification.md` | `7f3101acc3ea87c9bd93f1de07f14103f6573b68d95093a0cd44221ad7939d70` | 要判断 | `L9-system-test-design.md` に「engine-swap G9 の close 条件」を追加 (実行面、G8 の後に実行する順序の依存、manifest の記録項目、exit criteria)。`ST-ENGINE-01..08` は §7 に既存。#1021 merge 後は pair-map の「L4→L9」の行に合わせて置き場を確認する | `parent` の PLAN-L4-24 (draft) と、`references` の PLAN-L8-01 (G8 の pass が G9 の実行の前提 = 設計文書に順序の依存として書いた) | `vmodel-contract.yaml` の L9 が `verification_plan_id: PLAN-L9-01-...` と `evidence_manifest` (`engine-swap.json` は未生成) を持つ。問い 3 |
| `PLAN-M-00-verify-cutover.md` | `8f031d8010fa4bccd2c39123a6442fa2d670b67a26b0af1659819e29e89c05cb` | 要判断 | 移さない。内容は既存: `roadmap.md` §5 (Cycle P4 と L8-L14 の検証 band の完了、L12 / L13 の本番・PO サインオフは local band の外)、`roadmap-registry.ts` の `PROGRAM_BANDS` | `requires` の PLAN-REVERSE-44 / PLAN-L7-44 (完了済み) | 工程表 host (`master_hub: true`、gate `G-VERIFY.A` / `G-VERIFY.B`)。`projection-writer.ts` が `PLAN-M-00-verify-cutover` を定数で持ち、`cycle-p4-verification.ts` が PLAN-M-00 / M-01 の path を固定で読み、`plan/lint.ts` が両 id を legacy-frozen として除外する。問い 1 |
| `PLAN-M-01-cutover-backfill.md` | `ec8e15dc7495bc73502299861e95c98c67f73ea32d6ab9dc37931b7d94e5ce02` | 要判断 | 移さない。内容は既存: `roadmap.md` §5、`docs/migration/helix-to-ut-tdd-cutover-strategy.md` (ADR-001 に合わせて書き直し済み)、`PROGRAM_BANDS` の cutover | `requires` の ADR-001 / helix-source-inventory / PLAN-L7-44 (完了済み)。`parent` の PLAN-M-00 は同じ問いに含まれる | 工程表 host (gate `G-CUTOVER.A` / `G-CUTOVER.B`)。M-00 と同じ機械入力に束ねられている。本番の cutover は範囲外のまま。問い 1 |

## 要判断の問い

1. **工程表 host (PLAN-L3-00、PLAN-M-00、PLAN-M-01)**: 工程表 host の frontmatter `roadmap:` は、`roadmap-registry.ts` (band の被覆判定)・`projection-writer.ts`・`cycle-p4-verification.ts` (固定 path)・`plan/lint.ts` (legacy-frozen id) が PLAN 本文を直接読む。PLAN を使い捨て可にするには、工程表の登録元を設計文書へ移し、機械入力を付け替える実装が要る。この付け替えを #958 の範囲とするか、それとも工程表 host を「使い捨て対象外」と宣言するか。
2. **PLAN-L3-04**: `drive-model-passage` と `rule-automation-closure` の loader、および `tests/drive-model-passage.test.ts` / `tests/rule-automation-closure.test.ts` は、PLAN-L3-04 の本文の表を入力にしている。設計は `function-spec.md` D.7 に移し終えたので、入力を D.7 へ付け替える実装 PR を起こして PLAN を捨てるか、PLAN を機械入力として残すか。
3. **PLAN-L8-01 / PLAN-L9-01**: `docs/process/vmodel-contract.yaml` の G8 / G9 が実施の追跡を `verification_plan_id` (PLAN id) と未生成の `evidence_manifest` に束ねている。#1021 の slot 設計で、この束縛を設計文書側の close 条件へ付け替えるか。併せて、PLAN が選んだ後に追加された IT / ST 行を engine-swap の G8 / G9 で mandatory にするか。
