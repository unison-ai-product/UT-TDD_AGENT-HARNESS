# 工程 ②(d) 対応表のずれ候補の原因判定 (issue #977)

入力は #960 の対応表 (`issue960-module-design-inventory-20261013.json`、source commit 3ca0692d) の候補 65 件です。内訳は、実装の無い設計 12 件 (`DWI-*`) と内容のずれの候補 53 件 (`CD-*`) です。設計の無い実装は 0 件でした。

各候補は 2026-10-13 時点の origin/main で調べました。根拠 (file:line と実行したコマンド) は同じディレクトリの `issue977-drift-judgments-20261013.json` の `evidence` にあります。

## 判定の区分と件数

| 区分 | 意味 | 件数 |
|---|---|---|
| 設計を直す (Redesign) | 設計に欠陥がある。既存設計を supersede して設計から作り直す | 0 |
| 実装を直す (Red / Green) | 設計は正しく、実装が無いか誤っている | 0 |
| 設計を実装に合わせる | 実装は正しく、設計の記述が古い | 7 |
| 保留 | repo の証拠だけでは決められない。理由と、決めるために要るものを書く | 9 |
| 予定済み・退役済み | draft の契約・後続 slice・将来版など、実装が後に来ると明記されている | 25 |
| 誤検出 | 実装がある。字句の照合が別名・別 module・否定文を拾った | 24 |
| 合計 | | 65 |

設計を直すものと実装を直すものは 0 件でした。実装の不具合として直すべきずれは、この 65 件の中には見つかっていません。

下書きは Claude Opus の subagent 4 本が作り、control (Claude) が確かめました。DWI-03 は下書きの「実装を直す」を「予定済み」へ変えました (理由は表に記載)。誤検出のうち CD-01 / CD-10 / CD-24 / CD-30 は、control が引用先を開いて実装を確かめました。

## 設計を実装に合わせる (7 件)

| ID | 設計文書 | 対象 | 実装 | 判定理由 | 次の一手 |
|---|---|---|---|---|---|
| CD-11 | `L4-basic-design/security.md` | `review_evidence` | `src/schema/frontmatter.ts:219`<br>`src/doctor/plan-governance.ts:226` | review_evidence と checkReviewEvidence は実装済みである。ただし anchor_commit は entry 直下の必須項目ではなく green_commands 内の optional であり、設計の記述が実装の構造とずれている。 | security.md の Repudiation 行に書かれた必須項目を、実装に合わせて直す doc 修正 PR を出す (reviewer/review_kind/reviewed_at/verdict は必須、anchor_commit は green_commands 内の optional)。 |
| CD-31 | `L6-function-design/function-spec.md` | `DispositionRecord` | `src/document-disposition/domain/document-disposition.ts`<br>`src/document-disposition/domain/analyze-repository-document-closure.ts` | disposition record は DocumentDispositionInput として実装され、同一文書 :953 も新名を使っているため、:1614 の DTO 表だけが旧名・旧 field (blobOid/zone/impactTags) のまま残っている。 | function-spec.md:1614 の DTO 行を DocumentDispositionInput の現行 field (baselinePath, applicability 等) へ合わせる design patch PR。zone/impactTags の廃止有無は PR 内で document-disposition の上位設計と照合する。 |
| CD-33 | `L6-function-design/function-spec.md` | `DocumentProfileCatalogInput` | `src/profile/domain/resolver.ts`<br>`src/profile/adapters/tracked-profile-loader.ts` | strict loader 出力と catalog 生成は TrackedDocumentProfileCatalog / createProfileCatalog / ProfileCatalog として実装され、sourcePath/digest は loader 側へ分離、knownDocTypeIds 等が入力に加わっている。設計の型名と入力構成が古い。 | function-spec.md:1633-1634 を createProfileCatalog / ProfileCatalog / TrackedDocumentProfileCatalog の現行名と入力 field へ更新する design patch PR。 |
| CD-34 | `L6-function-design/function-spec.md` | `EvidenceInput` | `src/plan-asset/domain/evidence-types.ts` | 契約は EvidenceRecordInput として field 完全一致で実装されており、設計の型名だけが古い。 | function-spec.md:1608 の型名を EvidenceRecordInput へ改める design patch PR (field 変更なし)。 |
| CD-44 | `L6-function-design/function-spec.md` | `WorkflowContext` | `src/forward/domain/types.ts`<br>`src/forward/domain/workflow.ts` | 契約 (event/evidence の subject 不一致を fail-close / 不採用) は confirmed の PLAN-L7-419 実装で満たされているが、単一 DTO WorkflowContext ではなく ForwardSubject・reconstruct の events・ForwardEvidenceContext に分割され、policyRevision は policy object 側に移っている。設計の DTO 名と field 構成が実装より古い。 | docs-only PR で function-spec.md:1611 の WorkflowContext 行を ForwardSubject + ForwardEvidenceContext (evidence, now, authorFamily, evidencePolicy) と reconstruct(subject, events) の構成へ書き換える。同表の WorkflowCommand/WorkflowError 行も ForwardCommand/ForwardError へ揃えるかを同じ PR で確認する。 |
| CD-53 | `L6-function-design/setup-solo-team.md` | `onPath` | `src/setup/index.ts`<br>`src/runtime/detect.ts` | gh 不在時の安全側フォールバック (unknown → solo) は GhRunner の失敗吸収で実装されており正しく動くが、設計が参照する detect.ts の onPath は 873112115 で削除済み。設計の再利用記述が古い。 | docs-only PR で setup-solo-team.md:133 の onPath 再利用記述を「gh の有無は GhRunner (nodeGh) の実行失敗を ok:false として扱い unknown→solo へ倒す」へ書き換える。 |
| DWI-10 | `L6-function-design/release-channel-manifest.md` |  | `src/schema/release-manifest.ts`<br>`src/setup/release-materializer.ts` | 段階リリースの部品は実装済みだが、設計 doc の関数名 (parseCanonicalReleaseManifest、§4 の buildCleanDistributionPlan) が実装と食い違っている。後者は既存の別関数を指しており、errata が記録済みのまま doc に反映されていない。 | design-follow PR で release-channel-manifest.md の DbC 表と §3/§4 を parseReleaseManifest / parsePublicationManifest と admitReleaseAggregate に合わせ、oracle 割当 (U-RELMAN-001/014-016) との対応を確認する。 |

## 保留 (9 件)

| ID | 設計文書 | 対象 | 実装 | 判定理由 | 次の一手 |
|---|---|---|---|---|---|
| CD-02 | `L4-basic-design/data.md` | `ClosureReceipt` | `src/document-disposition/domain/analyze-repository-document-closure.ts:52` | run 単位の ClosureReceipt は、L6 で後続候補とされた reference closure slice に依存する。現行の DocumentClosureResult がその部分実装なのか別物なのかは、本調査では判定できない。confirmed の PLAN-L7-467 が planned deliverables をすべて満たしていない点も整理されていない。 | PLAN-L7-467 の完了範囲と、PLAN-L4-25/L5-19 (draft) の reference closure slice の所有を照合する。そのうえで ClosureReceipt を後続 slice の予定とするか、DocumentClosureResult への design_follow とするかを決める。 |
| CD-12 | `L5-detailed-design/if-detail.md` | `InvokeResult` | `src/runtime/adapter.ts:69`<br>`src/runtime/adapter.ts:411` | 型自体は存在する。しかし設計の audit_ref と重複排除の契約に対応する実装が見つからない。監査との連結が別経路 (session log) で満たされていれば design_follow、未実装なら red_green_fix になるが、本調査では判別できない。 | invoke の監査記録と重複実行防止がどこで担保されているか (src/runtime の session log 書き込み) を確認し、design_follow か red_green_fix かを決める。 |
| CD-20 | `L5-detailed-design/internal-processing.md` | `ReviewLaneReceipt` | `src/schema/cutover-transition.ts`<br>`src/runtime/cutover-transition.ts` | ReviewLaneReceipt を含む typed review/identity receipt 群は confirmed 設計 (PLAN-L5-26/L6-93) に残るが、実装は review.bundle を不透明 digest として扱うだけで当該 receipt は存在しない。Bun 撤去 (#487) は sealed edge 無しで close 済みのため、実装すべき残契約か退役すべき設計かを repo 実測だけでは決められない。 | cutover chain の sealed edge と typed review lane/session/work-provenance receipt を実装するか退役するかを #134 系で判断し (advisor progress)、退役なら L5 §Node切替receipt chain に退役注記を入れる design PR、実装なら Red/Green PR を起こす。 |
| CD-21 | `L5-detailed-design/internal-processing.md` | `SessionIdentityReceipt` | `src/schema/cutover-transition.ts`<br>`src/runtime/cutover-transition.ts` | SessionIdentityReceipt を含む typed review/identity receipt 群は confirmed 設計 (PLAN-L5-26/L6-93) に残るが、実装は review.bundle を不透明 digest として扱うだけで当該 receipt は存在しない。Bun 撤去 (#487) は sealed edge 無しで close 済みのため、実装すべき残契約か退役すべき設計かを repo 実測だけでは決められない。 | cutover chain の sealed edge と typed review lane/session/work-provenance receipt を実装するか退役するかを #134 系で判断し (advisor progress)、退役なら L5 §Node切替receipt chain に退役注記を入れる design PR、実装なら Red/Green PR を起こす。 |
| CD-22 | `L5-detailed-design/internal-processing.md` | `WorkProvenanceEventReceipt` | `src/schema/cutover-transition.ts`<br>`src/runtime/cutover-transition.ts` | WorkProvenanceEventReceipt を含む typed review/identity receipt 群は confirmed 設計 (PLAN-L5-26/L6-93) に残るが、実装は review.bundle を不透明 digest として扱うだけで当該 receipt は存在しない。Bun 撤去 (#487) は sealed edge 無しで close 済みのため、実装すべき残契約か退役すべき設計かを repo 実測だけでは決められない。 | cutover chain の sealed edge と typed review lane/session/work-provenance receipt を実装するか退役するかを #134 系で判断し (advisor progress)、退役なら L5 §Node切替receipt chain に退役注記を入れる design PR、実装なら Red/Green PR を起こす。 |
| CD-37 | `L6-function-design/function-spec.md` | `L6ConfirmationReceipt` | `src/runtime/cutover-transition.ts` | CutoverAdmission 側の direct ref と検証 port は実装されているが、function-spec.md:2259-2263 が定める L6ConfirmationReceipt の record 構造と PLAN-L6-93 exact 再検証を行う production adapter は src に見当たらない。production cutover が未着地の計画段階なのか実装欠落なのかを判別する証拠が足りない。 | Issue #152 系の cutover 実装 PLAN の generates/残 DoD を確認し、production 用 validateDirectReceipt("l6-confirmation") adapter が計画済みなら retire_or_planned、計画外なら red_green_fix (adapter + record 型) に確定する。 |
| CD-38 | `L6-function-design/function-spec.md` | `PlanAssetInput` | `src/plan-asset/domain/plan-asset.ts` | PlanAsset.create は確定実装 (PLAN-L7-418 confirmed) だが、DTO 表の dependencies[] 重複拒否と payload digest 不一致拒否は実装にもテスト設計にも無い。dependencies を payload 内に畳む現行形が意図どおりで設計が古いのか、domain 検証の欠落なのかを決める根拠が無い。 | PLAN-L6-71 の設計 owner に dependencies 検証の所在 (domain か plan lint か) を確認する。前者なら red_green_fix、後者なら DTO 表を PlanAsset.create の現行入力へ合わせる design_follow。 |
| CD-39 | `L6-function-design/function-spec.md` | `ProjectionContext` | `src/projection/domain/plan-projection.ts`<br>`src/state-db/sqlite-projection-store.ts` | PLAN projector だけが部分的に契約形 (PlanProjectionContext) で実装され、immutable ProjectionContext・ProjectionIdFactory・rebuild application 群は未実装。節自体が残 DoD と明記しており、残 DoD の追跡先 (PLAN/issue) が確認できないため保留する。 | PLAN-L7-423 (confirmed) の残 DoD がどの後継 PLAN/issue に引き継がれているかを確認する。引き継ぎ先があれば retire_or_planned、無ければ追跡 issue 起票のうえ red_green_fix。PlanProjectionContext の名前差は実装時に揃える。 |
| DWI-05 | `L6-function-design/edge-case.md` |  | `src/runtime/agent-guard.ts`<br>`src/runtime/detect.ts` | §1 の関数は実装済みなので、§1 は false positive。一方 §2 の `sprint check` / `trace check` は上流 L3 FR-02 の AC ごと未実装で、retire・planned・未実装のどれなのかを本 doc だけでは判定できない。marker の oracle ID も本文と食い違っている。 | L3 FR-02 (sprint check) の処遇を FR registry / PLAN で確定させてから判定する。retire なら edge-case §2 と marker の ID を design-follow PR で直し、存続なら sprint check を Red/Green 実装 PR に回す。 |

## 予定済み・退役済み (25 件)

| ID | 設計文書 | 対象 | 実装 | 判定理由 | 次の一手 |
|---|---|---|---|---|---|
| CD-04 | `L4-basic-design/data.md` | `DocumentReferenceParseReceipt` |  | typed reference reader と parse receipt は、L6 で後続 slice 候補と明示されている。oracle も未採番であり、予定項目にあたる。 |  |
| CD-07 | `L4-basic-design/function.md` | `DriveSelectionPolicy` |  | Appendix C の episode domain 一式は、実装 PLAN (L7-436/437) が draft のままであり、未着手の予定実装である。 |  |
| CD-08 | `L4-basic-design/function.md` | `MergeAuthorizationPolicy` | `src/kernel/github-closure-receipt.ts:23`<br>`src/feedback/review-dispatch.ts:46` | review・CI・HEAD の判定は、現行の pr merge 経路に部分的に存在する。しかし re-entry 証拠まで含めて集合判定する MergeAuthorizationPolicy は、episode domain の予定実装 (draft PLAN) に属する。 |  |
| CD-09 | `L4-basic-design/function.md` | `ReentryCertificatePolicy` |  | 再入証明は ExecutionEpisode 集約の一部である。実装 PLAN が draft のため、予定項目にあたる。 |  |
| CD-15 | `L5-detailed-design/internal-processing.md` | `AggregateCiReceipt` | `src/feedback/review-dispatch.ts:46` | AggregateCiReceipt は、PLAN-L7-465 で後続 D2 slice と明示された未実装の予定項目である。 |  |
| CD-16 | `L5-detailed-design/internal-processing.md` | `CandidateAuthorshipReceipt` |  | oracle は候補 (CAND-*) のままで U-* へ昇格していない。実装も後続 slice とされており、予定項目にあたる。 |  |
| CD-17 | `L5-detailed-design/internal-processing.md` | `ExecuteRequest` |  | Resource Kernel の wire protocol は、設計 PLAN・実装 PLAN とも draft であり、未着手の予定項目である。 |  |
| CD-18 | `L5-detailed-design/internal-processing.md` | `L6ConfirmationReceipt` | `src/runtime/cutover-transition.ts:74`<br>`src/runtime/cutover-transition.ts:359` | cutover 遷移は port 経由の受理判定だけを実装している。receipt の exact schema は候補 oracle 段階であり、予定項目にあたる。 |  |
| CD-19 | `L5-detailed-design/internal-processing.md` | `ProbeRequest` |  | ProbeRequest は draft の PLAN-L5-25/L7-466 が将来の最初の TDD 修正として予定している Resource Kernel ワイヤ型であり、未実装は計画どおりである。 |  |
| CD-23 | `L5-detailed-design/internal-processing.md` | `promote_by` | `src/plan/lint-policy.ts`<br>`src/plan/lint.ts` | route-mode-kind 免除台帳の promote_by 期限 gate は未実装だが、L7 テスト設計と PLAN-L7-263 が明示的に別 slice への carry と記録している計画済み項目である。 | C.4 carry を担う slice (PLAN-RECOVERY-08 系、draft) の着手時に台帳 promote_by 列と期限 fail-close を Red/Green で入れる。 |
| CD-28 | `L6-function-design/function-spec.md` | `AggregateCiReceipt` | `.github/workflows/harness-check.yml` | AggregateCiReceipt は D2 target 契約として明示的に未着工と記録された計画項目であり、現行は opaque checksGreen である。 |  |
| CD-41 | `L6-function-design/function-spec.md` | `SelfProofDeps` |  | self-proof meta-verifier は L6 契約 (PLAN-L6-77) と L7 実装 (PLAN-L7-425) がともに draft で、テスト設計も CANDIDATE 扱いの計画済み項目。実装が無いのは drift ではない。 | PLAN-L7-425 着手時に実装する。本監査での対応は不要。 |
| CD-42 | `L6-function-design/function-spec.md` | `SelfProofRequest` |  | CD-41 と同じく、self-proof は draft PLAN の計画済み契約であり実装前である。 | PLAN-L7-425 着手時に実装する。本監査での対応は不要。 |
| CD-43 | `L6-function-design/function-spec.md` | `SemanticAssessmentInput` |  | semantic assessment は L6 契約 (PLAN-L6-76) と L7 実装 (PLAN-L7-424) がともに draft の計画済み項目で、実装が無いのは想定どおり。 | PLAN-L7-424 着手時に実装する。本監査での対応は不要。 |
| CD-46 | `L6-function-design/memory.md` | `bound_to` |  | 設計 (PLAN-L6-97 draft、issue #963 open) が 2026-10-13 に凍結されたばかりで、実装 PLAN/PR はまだ無い。設計に先行する計画済み項目であり drift ではない。 | #963 の実装 PR (memory add の --lifecycle/--bound-to と memory retire) で実装する。本監査での対応は不要。 |
| CD-47 | `L6-function-design/memory.md` | `durable` |  | 設計 (PLAN-L6-97 draft、issue #963 open) が 2026-10-13 に凍結されたばかりで、実装 PLAN/PR はまだ無い。設計に先行する計画済み項目であり drift ではない。 | #963 の実装 PR (memory add の --lifecycle/--bound-to と memory retire) で実装する。本監査での対応は不要。 |
| CD-48 | `L6-function-design/memory.md` | `lifecycle` |  | 設計 (PLAN-L6-97 draft、issue #963 open) が 2026-10-13 に凍結されたばかりで、実装 PLAN/PR はまだ無い。設計に先行する計画済み項目であり drift ではない。 | #963 の実装 PR (memory add の --lifecycle/--bound-to と memory retire) で実装する。本監査での対応は不要。 |
| CD-49 | `L6-function-design/memory.md` | `lifecycle_source` |  | 設計 (PLAN-L6-97 draft、issue #963 open) が 2026-10-13 に凍結されたばかりで、実装 PLAN/PR はまだ無い。設計に先行する計画済み項目であり drift ではない。 | #963 の実装 PR (memory add の --lifecycle/--bound-to と memory retire) で実装する。本監査での対応は不要。 |
| CD-50 | `L6-function-design/memory.md` | `parse_failed` |  | 設計 (PLAN-L6-97 draft、issue #963 open) が 2026-10-13 に凍結されたばかりで、実装 PLAN/PR はまだ無い。設計に先行する計画済み項目であり drift ではない。 | #963 の実装 PR (memory add の --lifecycle/--bound-to と memory retire) で実装する。本監査での対応は不要。 |
| CD-51 | `L6-function-design/memory.md` | `retirable` |  | 設計 (PLAN-L6-97 draft、issue #963 open) が 2026-10-13 に凍結されたばかりで、実装 PLAN/PR はまだ無い。設計に先行する計画済み項目であり drift ではない。 | #963 の実装 PR (memory add の --lifecycle/--bound-to と memory retire) で実装する。本監査での対応は不要。 |
| CD-52 | `L6-function-design/memory.md` | `untracked_durable` |  | 設計 (PLAN-L6-97 draft、issue #963 open) が 2026-10-13 に凍結されたばかりで、実装 PLAN/PR はまだ無い。設計に先行する計画済み項目であり drift ではない。 | #963 の実装 PR (memory add の --lifecycle/--bound-to と memory retire) で実装する。本監査での対応は不要。 |
| DWI-01 | `L4-basic-design/ui-standard.md` |  |  | ui-standard が指す L7 src/web 実装は PLAN-L7-141 で version_target: future として PO 決定により将来版へ繰り延べられている。設計の欠陥ではなく、計画済みの将来機能である。 |  |
| DWI-02 | `L5-detailed-design/ui-detail.md` |  |  | ui-detail は中央 dashboard の FE 内部設計であり、その実装 PLAN-L7-141 は将来版として明示保全されている。未実装は計画どおりの状態である。 |  |
| DWI-03 | `L6-function-design/confirmed-document-placeholder-detection.md` |  |  | Issue #894 の L6 契約 (PLAN-L6-833) は確定の手続き中で、完了条件に「後続実装への引き渡し」が残っている。契約を先に凍結して実装が後に続く正規の順序であり、ずれではない。 | PLAN-L6-833 の confirm 後に、#894 の実装 (findUnfilledTemplatePlaceholders) を lane へ引き渡す。 |
| DWI-12 | `L6-function-design/screen-spec.md` |  |  | screen-spec は中央 dashboard の画面機能仕様であり、その L7 実装は PLAN-L7-141 で将来版として明示保全されている。 |  |

## 誤検出 (24 件)

| ID | 設計文書 | 対象 | 実装 | 判定理由 | 次の一手 |
|---|---|---|---|---|---|
| CD-01 | `L4-basic-design/data.md` | `ActivationEntry` | `src/state-db/spec-ir-projections.ts:88`<br>`src/schema/harness-db-tables-spec-ir.ts:57` | ActivationEntry は L4 のドメイン名であり、実装には ActivationEntryRow と activation_entries table がある。名前の差は投影行に付ける Row 接尾辞だけで、許容範囲である。 |  |
| CD-03 | `L4-basic-design/data.md` | `DocumentCatalogEntry` | `src/state-db/spec-ir-projections.ts:124`<br>`src/schema/harness-db-tables-spec-ir.ts:97` | 設計が述べる document_catalog_entries projection とその列は実装済みである。型名に Row 接尾辞が付いている点だけが異なる。 |  |
| CD-05 | `L4-basic-design/data.md` | `DocumentScaleProfileEntry` | `src/state-db/spec-ir-projections.ts:142`<br>`src/schema/harness-db-tables-spec-ir.ts:118` | 規模 profile ごとの文書採用・skip・理由を持つ projection は実装済みである。型名に Row 接尾辞が付いている点だけが異なる。 |  |
| CD-06 | `L4-basic-design/data.md` | `ScheduleEntry` | `src/state-db/spec-ir-projections.ts:71`<br>`src/state-db/spec-ir-projections.ts:497` | 工程管理表を正本とする ScheduleEntry projection は、ScheduleEntryRow / schedule_entries として実装済みである。ただし、工程表を PLAN fallback より優先する順序の厳密な検証は本調査では行っていない。 |  |
| CD-10 | `L4-basic-design/function.md` | `checkScrumReverse` | `src/doctor/plan-governance.ts:66`<br>`src/doctor/check-definition-groups.ts:160` | src/doctor に実装されている。自動照合の対象 module に src/doctor が含まれていなかったため、未検出と判定された。 |  |
| CD-13 | `L5-detailed-design/if-detail.md` | `absent` | `src/runtime/adapter-policy.ts:18`<br>`src/runtime/adapter-policy.ts:57` | absent のときの降格動作は、adapter-policy に設計どおり実装されている。自動照合の対象 module に src/runtime が含まれていなかった。 |  |
| CD-14 | `L5-detailed-design/if-detail.md` | `auth` | `src/runtime/adapter-policy.ts:80` | auth を CLI の未ログインとして fail-close し、ログイン案内を返す実装がある。設計にある gh auth は provider 外の例示であり、問題にならない。 |  |
| CD-24 | `L6-function-design/descent-obligation.md` | `active` | `src/lint/descent-obligation.ts` | condition: active は src/lint/descent-obligation.ts に実装されており、検査対象 source の列挙漏れによる誤検出である。 |  |
| CD-25 | `L6-function-design/descent-obligation.md` | `checkDescentObligation` | `src/doctor/lint-gates.ts`<br>`src/doctor/check-definition-groups.ts` | 設計どおり doctor 側 (src/doctor/lint-gates.ts) に純関数群と分離して実装されている。対応 module の source 一覧に該当 doctor file が無かったための誤検出である。 |  |
| CD-26 | `L6-function-design/descent-obligation.md` | `deferred` | `src/lint/descent-obligation.ts` | E3 の deferred 分類は analyzeDescentObligations 内で実装されている。 |  |
| CD-27 | `L6-function-design/descent-obligation.md` | `unmet` | `src/lint/descent-obligation.ts` | E2 の unmet 分類と fail-close は実装済みである。 |  |
| CD-29 | `L6-function-design/function-spec.md` | `CatalogInput` | `src/disposition/domain/document-disposition-catalog.ts`<br>`src/disposition/adapters/tracked-vmodel-loader.ts` | CatalogInput は src/disposition/domain に実装されており、mapped module の source 列挙漏れによる誤検出である。 |  |
| CD-30 | `L6-function-design/function-spec.md` | `CatalogSource` | `src/disposition/domain/document-disposition-catalog.ts` | 設計の 8 field と同名・同構成で実装されている。 |  |
| CD-32 | `L6-function-design/function-spec.md` | `DocumentClosureResult` | `src/document-disposition/domain/analyze-repository-document-closure.ts` | 設計どおり同名で src/document-disposition に実装されており、module 対応外による誤検出である。 |  |
| CD-35 | `L6-function-design/function-spec.md` | `EvidencePolicy` | `src/plan-asset/domain/evidence-policy.ts`<br>`src/forward/application/forward-evidence-policy.ts` | EvidencePolicy は src/plan-asset/domain に同名で実装され、requirements の field も一致する (maxAge は単位付き maxAgeMs)。plan-asset module が対応外だったための誤検出である。 |  |
| CD-36 | `L6-function-design/function-spec.md` | `GithubCiPolicy` | `src/lint/github-ci-policy.ts`<br>`src/doctor/runtime-surface.ts` | GithubCiPolicy は analyzeGithubCiPolicy / checkGithubCiPolicy として profile 明示入力つきで実装されている。D2 target topology の要求は設計自身が target 実装 PR までの移行扱いとしており、symbol としては誤検出である。 |  |
| CD-40 | `L6-function-design/function-spec.md` | `ReplayDocumentDeltasInput` | `src/document-disposition/domain/replay-document-deltas.ts` | 同名の型が src/document-disposition に存在し、設計 (function-spec.md:1254-1256) の baseline/final・event 列・decisions・ledger/policy identity・expected chain digest をすべて持つ。検査対象 module の対応付けが src/lint だったための誤検出。 |  |
| CD-45 | `L6-function-design/function-spec.md` | `XSource` | `src/lint/` | 設計は XSource が存在しないことを明示しており、src に無いことは契約どおり。字句検査が否定文中の記号を拾った誤検出。 |  |
| DWI-04 | `L6-function-design/doctor-result-envelope-measurement.md` |  | `src/doctor/index.ts`<br>`src/doctor/result-file.ts` | 設計が定める runDoctorMeasured と envelope 生成器は src/doctor に実装されており、対応 oracle テストもある。設計 doc は src path を書いていないので、inventory 側の未解決にすぎず doc の修正は不要。 |  |
| DWI-06 | `L6-function-design/fr-unit-coverage.md` |  | `src/lint/l6-fr-coverage.ts`<br>`src/doctor/process-quality.ts` | marker の analyzeL6FrCoverage は src/lint/l6-fr-coverage.ts に実装され、doctor から配線されている。doc は src path を書いていないため、修正は不要。 |  |
| DWI-07 | `L6-function-design/gate-confirm.md` |  | `src/lint/gate-confirm.ts`<br>`src/doctor/rule-quality.ts` | §2 の関数表は src/lint/gate-confirm.ts と完全に一致し、oracle テストもある。doc に src path の記載がないので、inventory 側の未解決にすぎない。 |  |
| DWI-08 | `L6-function-design/oracle-test-citation-trace.md` |  | `src/lint/oracle-test-citation.ts`<br>`src/lint/oracle-test-citation-baseline.ts` | 設計の逆向き citation collector は src/lint/oracle-test-citation.ts に実装され、oracle-test-trace gate に組み込まれている。doc に path の記載がないので、修正は不要。 |  |
| DWI-09 | `L6-function-design/plan-schedule-lint.md` |  | `src/plan/lint.ts` | 関数表は src/plan/lint.ts と一致する。実装は src/lint ではなく src/plan 配下にあるが、doc は path を書いていないので修正は不要。 |  |
| DWI-11 | `L6-function-design/review-evidence-stale.md` |  | `src/lint/review-evidence.ts` | stale approval の検出は src/lint/review-evidence.ts に実装され、oracle テストもある。doc に path の記載がないので、修正は不要。 |  |

## 後続の進め方

- **設計を実装に合わせる (7 件)**: 設計文書だけを直す契約 PR にまとめます (src を含まない)。設計書保護 gate の対象なので、実装 PR には混ぜません。
- **保留 (9 件)**: 表の「次の一手」にある判断材料をそろえてから、別の判定に移します。review receipt 3 種 (CD-20〜22) は #134 系の進め方と合わせて control が判断します。
- **予定済み・退役済み (25 件)**: 対応する PLAN / issue の進行に任せます。この表では追跡しません。
- **誤検出 (24 件)**: 対応は不要です。照合の対象 module から `src/doctor` や `src/runtime` が漏れていた件は、次に対応表を作り直すときの改善点です。
