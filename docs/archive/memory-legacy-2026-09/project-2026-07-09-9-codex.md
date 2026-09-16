---
memory_id: memory:project:2026-07-09-9-codex
kind: project
title: "システム全体監査 観測レポート(2026-07-09): 新規バグ9件・Codex並行作業との関係"
tags: ["audit", "claude", "codex", "digest", "handover", "route-mode", "spec-ir"]
updated_at: 2026-07-09T02:41:56.994Z
---

2026-07-09、Claude実施のシステム全体監査(`/goal システム全体監査`起点、Ultracodeワークフロー: 6クラスタ調査→12件のバグ候補を敵対的検証)の観測レポート。担当はCodex(下記9件の修正)。検収責任はPO。

## 前提: 既に修正済み(対象外)
PLAN-L7-397(relation-graph docs/root ledger欠落)/PLAN-L7-398(session-log summarize path truncation)/PLAN-L7-399(agent-guard capability floor化)は本監査中にClaudeが修正・commit済み。以下はそれ以外で新規に見つかった9件。

## 確認済み新規バグ 9件(敵対的検証で"real"判定、独立再現済み)

### medium (4件)
1. **spec-ir-invalid-subdoc 過剰発火**: `src/state-db/spec-ir-projections.ts` `analyzeSpecIrIntegrity`(~1624-1642行)が `def.spec_kind`/PLANのkind・master_hubを見ずに発火するため、sub_docを構造的に持たない plan(kind=research/add-design/master_hub)・test_design文書にまで誤検知。harness.db open findings 446件中206件超(約46%)が恒久的に解消不能。推奨: `def.spec_kind === "design_doc"` かつ схема上の `kind==="design" && !master_hub` 条件でgateする。
2. **spec-ir-orphan-relation 対象範囲過小**: 同ファイルの `loadSpecIrSources`/`sourceKind`(379-450行)がspec-ir取り込み対象(docs/plans, docs/design/harness, docs/test-design/harness, 一部governance)外への正当な参照(docs/adr, docs/process, src/, tests/等。`plan lint`は正常判定)を"orphan"と誤検知。199件中189件(95%)。推奨: 取り込み対象をdocs/adr/**, docs/process/**, docs/migration/**, .ut-tdd/audit/**, src/**, tests/**まで広げる、または該当ドメイン外参照をrelation構築対象から除外する。
3. **stableId() Unicode衝突→spec_defsサイレント消失(実データ損失)**: `stableId()`(251-253行)が非ASCIIを全除去。`docs/design/harness/L4-basic-design/architecture.md`の異なる2見出し("背景.../ "決定...")が同一spec_idに衝突し、`spec_defs`の1行が上書き消失(live harness.dbで確認済み)。**TL検証により脆弱な同一正規表現の重複箇所は5箇所ではなく7箇所と判明**: `src/workflow/contracts.ts:43`, `contracts-extras.ts:21`, `src/feedback/engine.ts:131`, `src/feedback/surface.ts:76`, `src/skill-engine/recommend.ts:155`, `src/state-db/projection-writer.ts:204`, `src/state-db/spec-ir-projections.ts:252`。推奨: 既存`slug()`と同じkana/kanji保持レンジを使うか、生値ハッシュsuffixで一意化。7箇所共通ヘルパー化を前提に一括修正。
4. **ROUTE_MODE_ALLOWED_KINDS 未完(SSoT gap)**: `src/plan/lint-policy.ts`の`ROUTE_MODE_ALLOWED_KINDS`が11個の正規entry modeのうち5個(discovery/scrum/retrofit/research/design-bottomup)を未登録。troubleshoot/incidentで実際にfail-closeを起こした(PLAN-L7-397/398/399)のと同種のSSoTギャップ。TL確認: `docs/design/harness/L4-basic-design/function.md`§3.1(105-164行)にkindが定義済み(discovery/scrum=poc, retrofit=retrofit, research=research, design-bottomup=add-design/add-impl)なので導出は一意。**現在使用PLANは0件のため実害は低い(fail-closeで弾かれるだけ、サイレント誤受理ではない)**が、PLAN-RECOVERY-10 Stage1のスコープなので同umbrella内で完結させるのが妥当。推奨: RECOVERY-10配下で5mode登録+回帰テスト(全11modeが§3.1と一致して登録済みをassert)+doctor drift gate(ROUTE_MODE_ALLOWED_KINDS ↔ §3.1表の機械照合)を同時投入。

### low (5件)
5. spec-ir-invalid-subdocが1見出しにつき1finding生成するため実質15〜21ファイル相当が446件に膨張(#1の副症状、#1修正で自動解消見込み)。
6. spec-ir関連解決がshort-form plan_id(`parent: PLAN-L7-65`等)をフルID完全一致でしか解決できず、最低7ファイルで解決失敗。推奨: byPlanId解決時にprefix/numeric-idマッチのfallbackを追加。
7. `tests/context-doc-router.test.ts`(9件)と`tests/distribution-scratch-ignore.test.ts`(1件)がPLANの`generates`未登録(PLAN-L7-143と同種の既知パターン)。推奨: PLAN-L7-302のgeneratesに前者を追加、後者は新規/既存PLANへ登録。
8. PLAN-L7-393(impl)/PLAN-L6-48(design)/PLAN-REVERSE-393(reverse-backfill)の3姉妹PLANが同一テストファイル(`tests/vmodel-forward-freeze-contracts.test.ts`)へ同一の誤ったoutput_digestをコピー転記(実digestと不一致、`plan digest-migrate`でsuspect判定)。既存のgreen-command-digest burn-down(PLAN-L7-132/303)の範囲内で処理すればよく、個別PLAN化は不要とTL判断。
9. `plan-reference-freshness`の16件のstale code-line参照は機械的一括修正が危険(移動済み/廃止済みコードを指すケースあり、`lint.ts`のようにbasenameが複数ファイルで曖昧なケースあり)。ドキュメント衛生問題であり機能欠陥ではない。手動ケース単位で対応、自動一括修正は禁止。

## 反証済み(対応不要、参考)
- `pair_artifact: self`未対応 → PLAN-RECOVERY-09でPO自身がself-pair運用を廃止済み。現状の"orphan"判定は正しい。
- 全ゼロdigest(PLAN-L7-256)"が野放し" → green-command-digest gate(PLAN-L7-132/303)が既に検知対象にしている(doctorのnote 519〜522件不一致に含まれる既知分)。
- digest-migrateのsuspect件数増加(4→17件等) → hybrid環境の作業ツリーが検証中に動いた影響のノイズで、コード上の欠陥ではない。

## TL(opus)レビューの結論
- 9件はどれも現状doctor/CIをfailさせておらず、能動的被害はゼロ(gate配線前の信号衛生問題)。
- 今すぐ直してよいのは#4のみ。#1/#2/#3/#5/#6はテーマが同一(spec-ir検出器の精度&id一意性)なので1本のPLANに束ねるのが妥当。#8は既存digest burn-downの範囲内。#7/#9はbacklog止め。
- 「444/199件の誤検知」は響きが強いが、ワークフロー阻害度は現状ゼロである点をPOへ提示する際に明示すべき。

## Codexの並行作業との関係(重要: 委譲順序の注意点)
監査完了時点でCodexが"vmodel round3 / PLAN-RECOVERY-10 right-lung quality assurance"(document scale profile機構、right-lung doc governance、workflow-quality gate)を並行して未commit状態で作業中(33ファイル+876行、`git diff --stat`で確認)。この作業は上記9件とは**テーマが異なり重複しない**が、以下の**同一ファイルを編集中**: `src/plan/lint-policy.ts`(ROUTE_MODE_LAYER_BANDS追加のみ、#4のROUTE_MODE_ALLOWED_KINDS修正はまだ入っていない)、`src/plan/lint.ts`、`src/schema/frontmatter.ts`、`src/state-db/spec-ir-projections.ts`(+269行、document_scale_profile機構の追加のみで#1/#2/#3の修正は含まれない)。

**したがって#1/#2/#3/#4の実装着手はCodexがこれらのファイルをcommitするまで待つこと**。work-guardの「他ランタイムのuncommitted作業を保護する」原則どおり、今この4ファイルへ同時に手を入れるのは衝突リスクが高い。Codexがcommitしたら、このメモリの9件リストを起点にPLAN化・実装を進めてよい。

## 副次観測(要否未確定、参考情報)
- Codexの未commit`docs/plans/PLAN-L7-397-right-lung-doc-governance.md`のreview_evidenceに`sha256:7777...7`/`sha256:8888...8`というrepeating-digitのプレースホルダdigestが記載されている(#8と同種の"fake evidence"パターン)。commit前のWIPなのでCodex側で実digestに直る可能性があり、commit後に実際の値のままなら要指摘。
- PLAN番号`L7-397`が2つの別PLANに割り当てられている(Claude committed済み`PLAN-L7-397-relation-graph-docs-root-ledger-coverage` / Codex未commit`PLAN-L7-397-right-lung-doc-governance`)。plan_id文字列自体は別なので`plan lint`は通るが、short-form参照(`PLAN-L7-397`のみでの言及)は#6と同種の曖昧化リスクを持つ。番号採番の衝突回避運用(次番号を採る前にdocs/plans/を確認する等)の徹底が望ましい。

## 未消化領域(この監査ではスコープ外、TL指摘)
`missing-test-oracle-id`(778件、severity=info)、`unresolved-join`(578件、severity=warn、主にhook_eventsとsession_start周りのjoin失敗)は、今回の12クラスタ調査(444/199件中心)より件数が多いにもかかわらず未調査。Codexの現在の並行作業でも触られていない。severity=infoのoracle-id分は優先度低、unresolved-join(warn)は次回監査ラウンドでの調査対象として残す。
