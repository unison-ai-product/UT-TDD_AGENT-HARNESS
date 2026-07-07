---
plan_id: PLAN-RECOVERY-09-test-design-right-arm-placement
title: "PLAN-RECOVERY-09 (recovery): テスト設計 doc 所属層の作り込み誤り収束 — 右腕層所属への統一 + L10 UX ③ 欠落"
kind: recovery
layer: cross
drive: be
status: draft
route_signal: regression_dev
route_mode: recovery
created: 2026-07-07
updated: 2026-07-07
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL — reopen point 確認 + 機構 (loader/lint ハードコード path) 影響レビュー (人間サインオフ必須)"
  - role: po
    slot_label: "PO — スコープ承認 + 右腕層所属標準の確定サインオフ (人間サインオフ必須)"
  - role: aim
    slot_label: "AIM — filename 依存の全数調査と修正順序の整合確認"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-09-test-design-right-arm-placement.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/test-design/harness/L1-operational-test-design.md
    - docs/test-design/harness/L3-acceptance-test-design.md
    - docs/test-design/harness/L8-integration-test-design.md
    - docs/test-design/harness/L9-system-test-design.md
    - src/lint/ddd-tdd-rules.ts
    - src/vmodel/lint.ts
    - docs/design/harness/L5-detailed-design/internal-processing.md
---

# PLAN-RECOVERY-09 (recovery): テスト設計 doc 所属層の作り込み誤り収束

## Status

draft 起票 (2026-07-07、PO 指摘「テスト設計が片方に置かれるのはおかしい。L8 以降にドキュメントがあるべき」
→ PO 裁定「起票はリカバリー」)。tl/po 人間サインオフ待ち。

## Step 1: 全事象収集

③テスト設計 doc の所属層が作り込み時点から不整合 (dev 回帰 = 構造の作り込み誤り):

| 現状 doc | 命名層 | あるべき所属 (右腕層) |
|---|---|---|
| L8-integration-test-design.md | 右腕 L8 | ✓ そのまま |
| L9-system-test-design.md | 右腕 L9 | ✓ そのまま |
| L7-unit-test-design.md | 谷 L7 | ✓ そのまま (谷は L6⇔L7 の 3 点合算) |
| **L1**-operational-test-design.md | 左腕 L1 | **L14**-operational-test-design.md |
| **L3**-acceptance-test-design.md | 左腕 L3 | **L12**-acceptance-test-design.md |
| (不在) | — | **L10**-ux-validation-test-design.md (uxv manifest 5 件のみで doc 無し) |

filename は機構にハードコードされている (`src/lint/ddd-tdd-rules.ts` の L8 path 直参照ほか、R1 相当の
全数調査が必要) ため、rename は doc 移動と機構更新の同時修正を要する。

## Step 2: PO 提示・認識確認

- 確定原理 (PO 2026-07-07): **doc の所属 = 右腕層** (③はその右腕層の検証を設計する文書。L8 以降の各層が
  自層のドキュメントを持ち、Forward 完備集合が全層で成果物を持つ)。**作成・freeze のタイミング = 左腕
  ペア①と同一 PLAN・同一 freeze** (所属層と freeze 契機は別軸で両立)。
- internal-processing.md Appendix C.2b (stage-aware intake) と整合。

## Step 3: reopen point 特定

- reopen point = **③テスト設計資産の組織 (docs/test-design/harness の命名標準)**。③の内容・ペア関係・
  freeze 履歴は有効であり破棄しない。誤っていたのは所属層の命名のみ。

## Step 4: top-down 修正

> **着手条件 (PO 2026-07-07「どう直すのかを定義してから触れ」)**: 本 Step の実行前に、下記 4 点を
> **本 PLAN へ追記し tl/po サインオフを得る**こと。定義完了前の本体 (docs/test-design/* と src/*) への
> 変更は禁止 (fail-close)。
> (i) filename 依存の全数調査結果 (loader / lint / doctor / PLAN pair_artifact / テンプレの直参照一覧)、
> (ii) 変更手順 (git mv と機構 path 更新の適用順序、1 commit で閉じる原子性の担保)、
> (iii) 検証手順 (rename 前後で pair-freeze 孤児 0 / 対象 lint green / doctor full green を比較する
> regression fence)、
> (iv) rollback 手順 (失敗時に単一 revert で戻せること)。

### Step 4 手順定義 (着手条件 (i)-(iv)、2026-07-07 全数調査済み、tl/po サインオフ待ち)

**(i) filename 依存の全数調査結果** (`grep -rn 'L1-operational-test-design|L3-acceptance-test-design'`、
runtime state 除外):

| 面 | 参照 | 扱い |
|---|---|---|
| src (機構) | `src/lint/g3-trace.ts:44` (1) / `src/task/proposal-document-packs-core.ts` (4) / `src/task/proposal-document-packs-operations.ts` (7) | **同 commit で新 path へ更新** |
| tests | `tests/plan-lint.test.ts:1148,1150` (2) | 同 commit で更新 |
| docs/design (pair_artifact frontmatter + 本文参照) | L1-requirements 5 doc (business/functional/nfr/technical/screen) + L3-functional 5 doc | 同 commit で更新 (①⇔③ 双方向) |
| ③ファイル自身の frontmatter | `layer: L1 / executed_at_layer: L14` (L3 側も同型) | **不変**。pair 機構は filename でなく frontmatter をキーとするため、rename は frontmatter に触れない (所属=右腕は filename/配置の標準、pair anchor=左腕 layer + executed_at_layer=右腕 の 2 軸表現は concept 正規) |
| governance/handover/audit (歴史 doc) | gate-design.md A-100 注記 / readiness-report / session-handover 群 | **書き換えない** (履歴改ざん禁止、accepted-historical) |
| .ut-tdd (runtime state) | plan digest / pack-sync manifest | 手編集しない。rename 後 `db rebuild` で再投影 |
| Pack 配布 | sync-pack manifest 経由 | 通常の `ut-tdd distribution sync-pack` propagation (別途 human-reviewed step) |

**(ii) 変更手順 (1 commit 原子性)**: ① `git mv` 2 件 (L1-operational→L14-operational / L3-acceptance→
L12-acceptance) → ② src 12 行 + tests 2 行を新 path へ → ③ docs/design の pair_artifact/本文参照を新 path
へ → ④ `bun run src/cli.ts db rebuild`。L10 doc 新設 (uxv manifest 昇華) は同 PLAN 内の**別 commit**
(rename と独立、順序は rename 先行)。命名標準 lint の追加も別 commit。

**(iii) 検証手順 (regression fence)**: rename 前後で ① `bun run src/cli.ts doctor` full EXIT=0 維持
(pair-freeze 50 pair 孤児 0 含む) / ② `bun run vitest run tests/plan-lint.test.ts` + 影響 lint の
targeted green / ③ `bun run typecheck` / ④ canonical 面 (src/tests/docs/design) で旧 filename の grep
が 0 件 (歴史 doc 除く)。

**(iv) rollback 手順**: 単一 commit revert (`git revert <rename-commit>`) + `db rebuild`。L10 新設
commit も独立 revert 可能。

### Step 4 手順定義 — L10 UX ③ back-fill (self-pair 根絶、2026-07-07 全数調査済み、po サインオフ待ち)

**性質の確定 (PO 2026-07-07)**: 「L10 独立 test-design doc を作らない」(self-pair 規約、IMP-039/058)
は **PO 裁定ではなく AI が監査サイクル中に発明した無承認の作り込み** (improvement-backlog 原本で
確認: IMP-039 = 暗黙慣行の追認成文化、IMP-058 = lint 孤児誤検知を黙らせる例外発明)。よって扱いは
「正当な旧判断の supersession」ではなく **無承認デグレの根絶**。検出機構自身が欠落を隠蔽する例外
(absence-blindness) を撤去する。

**(i) self-pair 依存の全数調査結果**:

| 面 | 参照 | 扱い |
|---|---|---|
| 機構 | `src/vmodel/lint.ts` (`pa === "self"` 分岐 + L2 group-hub-self 分岐) / `src/lint/g10-ux-workflow.ts` (UXV 正本 = visual-design.md を parse) / `src/gate/static.ts` (G2 `mockMissing` が `pair_artifact === "self"` を要求 — **実施中の追加発見**、同 commit で新配線要求へ更新) | **撤去 / ③ doc へ repoint** (同 commit) |
| tests | `tests/vmodel-pair.test.ts` (self fixture) / `tests/gate-static.test.ts` / `tests/g10-ux-workflow.test.ts` | 同 commit で更新 |
| docs/design frontmatter | wireframe.md (`pair_artifact: self`) + L2 sub-doc 5 件 (business-flow/screen-detail/screen-flow/screen-list/ui-element → wireframe.md hub 参照) + visual-design.md (コメントで self-pair 主張) | 同 commit で ③ doc へ配線替え |
| ③ 対応 L6 設計 | `docs/design/harness/L6-function-design/vmodel-pair-freeze.md` §self-pair 節 / `docs/test-design/harness/L7-unit-test-design.md` U-VPAIR-001/004 | 同 commit で撤去・書換 (design↔code drift 防止) |
| 正本 (living) | concept_v3.1 用語集 self-pair 項 / roadmap §2 注記 / L2-screen/README / L4 function.md §screen-design 行 (self-pair 記述、実施中の追加発見) | **Step 5 fullback Reverse で抹消** (branch→main 合流、exit 条件) |
| 歴史 PLAN / 記録 | PLAN-L6-10 / PLAN-REVERSE-10 / PLAN-L2-04 / IMP-039・058・063 行 / A-174 | 書き換えない。IMP 行と歴史 PLAN に誤り注記 (RECOVERY-09 を後継として明記、errata 双方向) |

**(ii) 変更手順 (commit A、原子)**: ① `docs/test-design/harness/L10-ux-validation-test-design.md`
新設 — frontmatter `layer: L2 / executed_at_layer: L10 / pair_artifact: docs/design/harness/L2-screen/`
(dir 集合参照、既存 ③ doc と同型)。内容 = 3 点セット (③ = UXV 5 件を GWT で L2 画面粒度に昇華 /
検証戦略 = G10 workflow 連鎖 + evidence manifest / 検証設計 = 環境・実データ実在性・計測・評価基準)。
② L2 sub-doc 6 件の `pair_artifact` を ③ doc path へ配線替え (hub 経由をやめ全 doc 直接参照 =
rule 3 双方向の正規形)。③ visual-design.md: UXV case 定義を ③ doc へ移し、設計内容 (視覚方針) のみ
残す。pair コメントを新標準へ更新。④ `src/vmodel/lint.ts` の self 分岐 + group-hub-self 分岐を撤去、
`src/lint/g10-ux-workflow.ts` の UXV 正本 path を ③ doc へ repoint。⑤ vmodel-pair-freeze.md /
L7-unit U-VPAIR の該当節を同期。⑥ tests 3 件更新。⑦ `db rebuild`。命名標準 lint の追加は
**別 commit B** (A の後)。

**(iii) 検証手順 (regression fence)**: ① `doctor` full EXIT=0 (pair-freeze pair 数維持+孤児 0、
g10-ux-workflow OK 含む) / ② `vitest run tests/vmodel-pair.test.ts tests/g10-ux-workflow.test.ts
tests/gate-static.test.ts` green / ③ `typecheck` / ④ canonical 面 (src/tests/docs/design) で
`pair_artifact: self`・self-pair 残存 grep 0 件 (歴史 doc / IMP 台帳を除く) / ⑤ design-language・
readability green。

**(iv) rollback 手順**: commit A 単一 revert + `db rebuild`。commit B (命名 lint) も独立 revert 可。

1. 命名標準確定: `L<right>-<verification-kind>-test-design.md` を③ doc の正本命名とする。
2. rename: L1-operational → L14-operational / L3-acceptance → L12-acceptance (git mv + 機構内
   ハードコード path の同時更新。歴史的 PLAN の pair_artifact 参照は書き換えない — 履歴改ざん禁止。
   必要なら旧位置に移行注記 stub を残す判断を含む)。
3. **L10 UX ③ back-fill**: L2↔L10 ペアの③ doc (L10-ux-validation-test-design.md) を新設し、既存 uxv
   manifest 5 件を doc へ昇華 (g10-ux-workflow doctor との整合維持)。
4. 検証: pair-freeze 孤児 0 / 関連 lint (ddd-tdd-rules 等) green / doctor full green。

## Step 5: fullback (再発防止 + 上位整合)

- concept §2.3 / repository-structure.md への所属標準の back-fill は **Recovery exit 後の Reverse
  (fullback)** で L設計正本へ昇華する (branch→main 合流義務)。
- 再発防止: 命名標準を lint 化 (test-design 配下の filename が右腕層命名に従うことの機械検査) を
  修正内で追加する。

## DoD

- [ ] tl/po 人間サインオフ (Step 2/3) が review_evidence に記録される。
- [ ] rename + 機構 path 更新後、`ut-tdd doctor` full green (pair-freeze 孤児 0 含む)。
- [ ] L10-ux-validation-test-design.md が新設され g10-ux-workflow と整合する。
- [ ] 命名標準 lint が追加され fail-close する。
- [ ] concept/repository-structure への back-fill Reverse が起票される (exit 条件)。
