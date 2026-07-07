# A-174 - Forward 設計群 + テスト設計ペアの適切性監査

- **date**: 2026-07-02
- **scope**: Forward で作成する設計群 (docs/design/harness/ 51 本、L1-L6+L10) が適切か、テスト設計側 (docs/test-design/harness/ 5 本) と合わせて監査 (PO 依頼)。規定 (L00-L06-design-phase.md / document-system-map / VALID_SUB_DOCS) ⇔ 実体の 3 者突合、substance 読解、V-pair 粒度、oracle→tests 実接続まで。
- **method**: 並列 subagent 2 面 (設計側 substance / テスト側 pairing) + 機械 gate 実測 (vmodel lint、doctor 各 gate) + critical 主張の抜き打ち再検証。
- **disposition**: A-173 と同じく **record-only** (PO 2026-07-02、修正作業・PLAN 起票はしない)。

## 総括

**左腕 (設計降下) は実質的に健全**。機械 gate 全緑 (pair-freeze 46 pair/孤児 0、descent-obligation 255 graded、l6-fr-coverage 51 FR 全接続、l6-completion G6 PASS) に加え、substance 読解でも L1/L3/L4/L6 の主要 doc に設計判断が実在し、FR descent サンプル 3 件中 2 件は L1→L6 全層で中身が具体化されている。設計 slot の規定⇔schema⇔実体 3 者もほぼ整合。

**右腕 (テスト上昇) の L8/L9 帯に宣言ベースの false-confidence が残る** — これが本監査の最重要所見であり、既知の教訓「テスト戦略だけでは V-model 右腕が片肺」([[feedback_verification_strategy_design_time_logging]] 系) の残存形。

## Findings

### F-1 [important] L8/L9 の oracle→tests 接続が gate 盲点で素通り

- `IT-CONTRACT-01〜03` (L8-integration-test-design.md:42-47 で宣言) は tests/ に **実装 0 件、defer 宣言も無し** (`grep -rn "IT-CONTRACT" tests/` = 0)。
- ST-* (L9) は個別 vitest 実装 0 件。`g9-system-workflow.test.ts` は ST-ID のテキスト実在を見るメタテストで、シナリオ実行証拠にならない (§4 で「L9 本起票で展開」の prose carry はあるが frontmatter/機械追跡なし)。
- 構造原因: `src/lint/oracle-test-trace.ts:21` の `ORACLE_ID = /\b(?:U|IT)-[A-Z0-9]+-[0-9]{3}\b/` が **3 桁採番のみ**対象。L8 doc の IT-* は 2 桁採番 (IT-CONTRACT-01) のため全件 regex 外、ST-* はパターン自体に無い。= 右腕 band の citation gate が U-* にしか効いていない。
- 「未実装」と「明示 defer」の機械区別が無く、G8/G9 close 時に未実証のまま通過し得る。

### F-2 [important] 設計 doc の実装宣言 drift (NFR-08 実装宣言真実性に抵触候補)

confirmed 設計 doc に古い実装状態が残存:

- `module-decomposition.md:29-30` — plan / vmodel module が「stub（仮実装）」のまま (実体は plan lint / 46-pair vmodel lint として本稼働中)
- `architecture.md:108` — Evaluation 集約「(将来 telemetry module)」のまま (実体 `src/feedback/engine.ts` 実装済)
- `function.md:36` — C9 doc-review「(将来 review module)」vs L5 側「実装済」の層間不整合 (FR-L1-45 descent 追跡で検出)

### F-3 [important] nfr-grade.md の AC placeholder 未着地

`nfr-grade.md:56,60,148-149` — NFR-02 (更新性) / NFR-09 の AC が「L4 carry placeholder」宣言のまま節本文なし。性能/容量の数値閾値確定が宙に浮いており、欠落 slot 分析でも「性能/容量設計 = 部分被覆 (AC 未確定)」と判定。

### F-4 [important] 設計 slot の欠落候補: セキュリティ設計

NFR-17 は L1 nfr.md で親宣言 (「詳細は L4 方式設計 sub-doc で確定」) だが、L4 に security の独立節/sub-doc slot が無く ADR 参照のみ。VALID_SUB_DOCS[L4] にも security 系 slot 不在。escalation gate (auth/PII/破壊操作) を製品機能として持つハーネスとして、脅威モデル/DevSecOps 設計の置き場が未定義。ロギング横断方針 (何をいつどの粒度で) も部分被覆。エラーハンドリング/migration/配布は代替被覆ありで欠落ではない。

### F-5 [minor] schema と設計 doc frontmatter の不整合 (lint 誤判定源)

- L2: business-flow.md / screen-detail.md が primary doc と同一 `sub_doc` (screen-flow / screen-list) を supplemental_* role で重複宣言 — 1:1 前提の lint には誤判定源
- L6: skill-index.md (`sub_doc: skill-index`)、governance-enforcement.md (`sub_doc: function-spec-addendum`) が VALID_SUB_DOCS[L6] 外の値

### F-6 [minor] 残渣

- `L7-unit-test-design.md:42` 見出しに「placeholder skeleton」が残存 (superseded 注記はあるが誤読リスク)
- oracle known-debt baseline 89 件 (U-FRCOV / U-DBPROJ-ATOMIC 等) は縮小のみ可ルールで制御下 (現状維持で可)

### 健全確認 (実測)

- pair-freeze 46 pair の除外 5 本は全て正当 (README/roadmap/moved/L10 placeholder。L10 は lint の L1-L6 regex ですり抜けるが IMP-039/058 の明示 park)
- oracle→tests 実接続サンプル 10 件中 8 GREEN、RED 2 件は known-debt baseline 収載済
- missing-test-oracle-id telemetry (623→634 件) は `projectTestCaseCatalog` (projection-writer.ts:2097) による「oracle ID 無しの it() ブロック数」の設計どおりの可視化で、oracle-test-trace green と矛盾しない (逆方向の計測)。tests/ の it() 約 1,530 件中 ~600 件が ID 無し、という実態表示
- L3-acceptance (AT 117 件) / L1-operational (OT 47 件) の carry/park は全て理由明示の正規 defer

## Routing (第二 exit、record-only)

| finding | type | route |
|---|---|---|
| F-1 右腕 gate 盲点 (IT/ST citation) | `feature-gap` | Add-feature (ORACLE_ID regex の桁/ST 拡張 + defer の機械追跡) |
| F-2 実装宣言 drift | `smell` | Refactor (doc 訂正 + NFR-08 系 lint 候補) |
| F-3 nfr-grade AC 未着地 | `feature-gap` | Add-feature (L4 carry の解消起票) |
| F-4 セキュリティ設計 slot | `feature-gap` | Add-feature (slot 定義は PO 判断) |
| F-5 sub_doc schema 不整合 | `latent-defect` | Add-feature |
| F-6 残渣 | `smell` | Refactor |

## Boundary

record-only。修正・起票は将来の PO 指示時。L8 IT-RELGRAPH/IT-DOCEXPORT 7 件・L9 全般・L1 not-implemented 群の明示 defer は逸脱として扱わない (verify-intent 原則)。
