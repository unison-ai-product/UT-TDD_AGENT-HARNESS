# Session Handover — 2026-06-05 (Phase 2 着手: vmodel pair-freeze lint + L4 doc カバレッジ改善)

> PO /goal「L4 完遂と進行を円滑に進めるためにカバーすべき機能を Feature/Discovery で起票して対応 + 進行中に doc カバレッジが適切かを review・改善」。Phase 2 (L4) 着手の最大 enabler = **doc カバレッジを機械 review する基盤** (vmodel-lint stub) を Add-feature で実装し、実 repo に当てて L6 doc の検査漏れ (frontmatter 欠落) を検出・補完。§1-§2 は git から手記入 (handover digest は前 session ノイズ = IMP-048 既知限界)。

## §1 PLAN サマリ

| PLAN | kind | 何を | commit |
|------|------|------|--------|
| (前段) L0-L3 pair-freeze 対称性是正 | docs | A-100 freeze のテスト設計③ (L1-operational/L3-acceptance) を confirmed へ flip、gate 台帳 A-100 追補 | `7a13637` |
| `PLAN-L6-10-vmodel-pair-lint` | add-design | pair-freeze lint の機能設計 (loadPairDocs/analyzePairFreeze/pairFreezeMessages + 対象選定規約) + L7-unit §1.13 U-VPAIR | `fd7aa62` |
| `PLAN-L7-11-vmodel-pair-lint` | add-impl | src/vmodel/lint.ts 本実装 + doctor checkPairFreeze (warn-first) + tests/vmodel-pair.test.ts | `fd7aa62` |
| `PLAN-REVERSE-10-vmodel-pair-lint` | reverse/fullback | requirements §6.8.3/§2.4 整合 + L6 frontmatter 規約 + concept §10 用語 back-fill | `fd7aa62` |

## §2 成果物 (commit / files)

- **`src/vmodel/lint.ts`** (stub → 本実装): design doc (①) ⇔ test-design doc (③) の `pair_artifact` 双方向整合・孤児0 を検査。rule **pair-exists / ref-resolves / trace-bidir** (function-spec §4 の最小インスタンス化)。self-pair (wireframe) / L2 group / README・roadmap 除外 / ルート直下 stub 除外。**G7 の 4 artifact 12-edge trace はスコープ外** (L7 trace freeze の別マイルストーン)。
- **`src/doctor/index.ts`**: `checkPairFreeze` を **warn-first** で配線 (runDoctor.ok に非連動。hard 化は実 repo green 安定後)。既存 hard 条件 (backfill/scrum-reverse/propagation) 不変。
- **`tests/vmodel-pair.test.ts`** (新規): U-VPAIR-001〜006 (7 test) + 実 repo 完全性ガード (孤児0)。
- **doc カバレッジ改善 (lint が穴を検出 → 補完)**: L6 の **6 doc** (session-log/handover-mechanism/agent-slots/backfill-pairing/forced-stop-feedback/setup-solo-team) が **layer/pair_artifact frontmatter 欠落** (HTML コメントのみ) で lint を素通りしていた穴を検出 → YAML frontmatter 補完。lint 対象選定を **path ベース** (`designLayerFromPath`) に改修し layer 欠落も孤児検出。**24→30 pair 孤児0**。
- **back-fill**: concept §10 用語 (pair-freeze lint / self-pair) merge、improvement-backlog IMP-067。
- 検証: typecheck 0 / **vitest 184 pass** (177→+7) / biome CLEAN / **doctor.ok=true** (pair-freeze 30 pair 孤児0 / backfill/scrum-reverse/propagation OK)。
- review 前置 = code-reviewer **2回とも大 diff で truncate** (handover session 8 §4 既知問題) → **PM 精査 + 明示検算** (regex マッチ 33 − EXCLUDED 3 = 30 = pairs、見逃し0/誤検出0、trace-bidir slash 境界・stub 除外を bun 検算) で補完。
- HEAD = `fd7aa62`、origin main へ push 済。untracked 3 件 (audit + policy-exempt 2) は commit 禁止。

## §3 Next Action

1. **Phase 2 (L4) 継続: カバーすべき機能の次手**。explorer 調査 (本 session) で L4 完遂 enabler を列挙済 — ① **plan lint engine 最小** (src/plan/lint.ts stub、G4 audit A2 機械化) ② **G4 再 audit** (TL/frontier-reviewer サインオフ、park → PASS) ③ **L5 テスト設計 doc の左腕 doc 起票** (roadmap Phase 2 観点 B)。いずれも Add-feature/Discovery で起票して対応する (PO /goal 方針)。
2. **pair-freeze lint の hard 化検討**: 現状 warn-first (doctor.ok 非連動)。実 repo 30 pair 孤児0 で安定。次 cycle で backfill/scrum-reverse/propagation と同じ doctor.ok hard-fail へ昇格を検討 (CI vitest ガードは既に fail-close = U-VPAIR-005)。
3. **L1-business-requirements.md (moved stub) の整理**: docs/design/harness 直下の `# (moved)` 残骸。pair-freeze は2階層 regex で対象外にしているが、stub 自体の archive/削除は別 carry。

## §4 carry (未了・先送り)

- **L4 完遂 enabler の残**: plan lint engine 本体 / G4 再 audit (park) / L5 テスト設計 doc 起票。
- **pair-freeze hard 化** (warn-first → doctor.ok 連動)。
- **L1-business-requirements.md stub 整理** (Next Action 3)。
- 継続: CI biome subjob (workflow PAT、deferred) / kind×layer guard (§1.6) / IMP-047〜051 残配線 (lint トークン/pre-push/team_runner 本体) / IMP-052 G8-G14 機械化。
- **review 前置の truncate 対処**: 大 diff で code-reviewer が cut-off する既知問題 (session 8 から継続)。diff 分割 or PM 精査+検算での補完を workflow 改善候補として継続観察。

## §5 未了 PO 判断

- **PO /goal は継続中** (L4 完遂と進行円滑化のための機能起票・doc カバレッジ改善)。本 cycle で 1 機能 (pair-freeze lint) + doc 改善を完遂。次の「カバーすべき機能」(plan lint / G4 audit / L5 テスト設計) に進んでよいか、別の優先があるか。
- (任意) pair-freeze を warn-first で導入した粒度 (即 hard 化でなく段階導入) に異論があれば指摘。
- (任意) L6 6 doc を status:draft で frontmatter 補完した判断 (G6 未 freeze に整合) に異論があれば指摘。

## §6 壊さない / 再発させない

- **pair-freeze lint は設計層 (①⇔③ pair) のみ**。G7 の 4 artifact 12-edge trace (traceCheck) は別レイヤーで未実装。混同しない。
- **対象選定は path ベース** (`designLayerFromPath` = `docs/design/harness/L<N>-<topic>/<file>.md` の2階層)。README/roadmap は basename 除外、ルート直下 stub は2階層 regex で対象外。**frontmatter layer 欠落でも path で対象に入れる** (HTML コメントのみの doc が検査を素通りする穴を塞いだ。再発させない)。
- **L6 機能設計 doc は YAML frontmatter (layer + pair_artifact) を持つ** (機械検査の前提)。新規 L6 doc を HTML コメントのみで作らない。
- **doctor.ok の hard/warn 分離を崩さない**: backfill/scrum-reverse/propagation = hard、handover/agent-slots/**pair-freeze** = warn-first。
- **trace-bidir の dir 集合参照は trailing slash 正規化 + startsWith 境界固定** (別 dir の prefix 誤マッチ防止)。
- **検算で見逃しを担保**: pairs == 検査対象数 (regex マッチ − EXCLUDED) を確認すれば孤児見逃しゼロ。実 repo ガード U-VPAIR-005 が CI fail-close。
- review 前置 MUST / subagent model 明示 (本 session pmo-project-explorer / pmo-sonnet / code-reviewer すべて sonnet) / commit footer = `Co-Authored-By: Claude Opus 4.8 (1M context)` / staged は明示ファイルのみ (untracked 3 件は禁止)。

---

# Session Handover — 2026-06-05 (session 2: 検証ロードマップ改称 + 検証発火 機械化 + クリーンアップ原則)

> PO 是正: ① 報告で「Phase 2 / 1 サイクル」と roadmap フレームを多用し「ロードマップの影響を受けすぎ、ロードマップばかり意識してうざい。**定常は Forward、ロードマップは検証サイクル**」② 「検証タイミングを **V-model 単位で機械発火**させろ。崩れ防止の全体調整」③ 「**クリーンアップ原則とハードコード慎重**を開発原則に」。

## §1-§2 成果 (commit)

| commit | 何を |
|---|---|
| `0e456cf` | **検証ロードマップへ改称 + 常時参照撤廃**。CLAUDE.md Read Order / AGENTS.md Core Reads から roadmap を外し、**節目 (V-model 層群 freeze 完了時) 限定の動的参照**に。frontmatter doc_type=verification-roadmap |
| `b3035d4` | **検証発火 verification trigger (IMP-068)**: V-model 層群 (L0-L3/L4-L6/L0-L6) の Forward freeze 完了を doctor が surface。pair-freeze lint (IMP-067) の status 拡張。PLAN-L6-11/L7-12/REVERSE-11 |
| `886ce4d` | **クリーンアップ原則 + ハードコード慎重原則**を CLAUDE.md コーディング規約に MUST 追加 |

- **検証発火実装**: `src/vmodel/lint.ts` `analyzeVerificationGroups` (freeze = draft 0 + pair 孤児0 + confirmed≥1、**placeholder=park** で発火を妨げない) + doctor `checkVerificationGroups` (note、ok 非連動)。実 repo: **L0-L3 ✅ freeze 完了 (8/12 confirmed, 4 park, 孤児0) → 検証サイクル発火可 / L4-L6 Forward 進行中** = A-100 整合。U-VTRIG-001〜005。
- concept §10 用語 (検証発火/検証層群) back-merge、検証ロードマップに機械発火反映。
- 検証: typecheck 0 / **vitest 189 pass** (184→+5) / biome CLEAN / doctor backfill green / **pmo-sonnet APPROVE** (P-1 layers 注記 / P-3 review DoD 反映)。

## §3 Next Action (session 2)

1. **定常 = Forward で L4 基本設計を降ろす** (検証ロードマップの Phase/サイクルで語らない)。L4-L6 が freeze 完了したら doctor `checkVerificationGroups` が「L4-L6 検証サイクル発火可」を機械的に surface する。検証はそのタイミングで回す。
2. **検証発火の発展** (後続 carry): verification を hard 化 (現状 note) / 層群 freeze → 検証 PLAN 自動起票 (現状 surface まで、起票は人間)。
3. session 1 からの継続: plan lint engine 最小 (G4 audit A2) / G4 再 audit / L5 テスト設計 doc 起票。

## §6 壊さない / 再発させない (session 2)

- **定常は Forward、検証ロードマップは節目の検証サイクル** (混同禁止)。L4 着手等の定常作業を「Phase N / サイクル」で語らない (PO「うざい」の正体)。検証ロードマップは read order に無く、層群 freeze 完了の節目で動的参照する band。[[feedback_roadmap_is_design_doc_level]]。
- **クリーンアップ原則 / ハードコード慎重** (CLAUDE.md、MUST): 誤り・取り下げ・陳腐化の残骸を残さない / ハードコードは根拠コメント + 単一正本 + 拡張性。
- **検証発火 = surface まで** (検証 PLAN 起票は人間トリガー、§2.6 signal→mode と同様)。**placeholder=park は freeze を妨げない** (L2 screen track G2 DEFER)。draft があれば Forward 進行中。
- **VERIFICATION_GROUPS の id は表示用レンジ、layers は実在層のみ** (L0 は価値検証で design doc なし)。id と layers の非対称はコメントで根拠明示済。

---

# Session Handover — 2026-06-05 (session 3: L4 基本設計 G4 freeze — **L4 完遂**)

> PO /goal「**L4完遂を進めろ**。事前に必要なものは Discovery/Feature で実装」。前 session で機能起票 (lint) に終始し **L4 本体を進めていない**ことを PO 指摘 → **L4 完遂 (G4 freeze) を実行**。L4 完遂に新規前提機能は不要 (既存 vitest/doctor/pair-freeze で機械証跡充足) と判定し、G4 audit → status flip で freeze。

## §1-§2 成果 (commit `770333a`)

- **G4 audit 4 軸 PASS** (intra_runtime_subagent = pmo-sonnet、TL サインオフ代替、最終報告到達):
  - A1 上流 trace (FR 26件漏れ0/FR-L1-46〜49 着地/ADR-004) / A2 DoD (L5 降下適性) / A3 V-pair 孤児0 (L4⇔L9 双方向 + pair-freeze 30 pair) / A4 sub-doc 整合 (Critical 0)。
- **freeze 10 ファイル** (draft → confirmed): L4 core 4 doc (architecture/data/function/external-if) + L9 + PLAN-L4-00〜04。
- **carry 許容**: L9 骨格 (Given-When-Then は Phase 2 後続) / ST-ASSET (L6/L7 待ち) / **内部資産 L4-10〜13 (別スコープ、未 freeze)**。
- gate-design §2: G4 park → **PASS (A-101)**、旧 A-91 (正規式前) は historical。`.ut-tdd/audit/A-101-g4-l4-freeze.md` (gitignored)。PLAN-L4-00-master §5 に A-101 再確定追記。
- P1 carry IMP 化: **IMP-069 (mode taxonomy reconcile)** / **IMP-070 (commander ADR)**。
- **機械証跡**: doctor verification = **L4-L6 4/18 confirmed へ前進** (L4 freeze が機械に反映)。vitest 189 pass / doctor exit 0 / pair-freeze 30 孤児0。

## §3 Next Action (session 3)

1. **L5 詳細設計を Forward で起票・降下** (PLAN-L5-00-master)。L4 freeze 完了で L5 降下可。正規式 L5⇔L8 結合。
2. **L5 起票前に IMP-069 (mode taxonomy reconcile)** を確定 (L0 §2.5 9-mode vs function §3 10-mode、L5 workflow 設計の揺れ防止)。IMP-070 (commander ADR) も L5 前に。
3. L4-L6 層群が全 freeze したら doctor verification が「L4-L6 検証サイクル発火可」を機械 surface → そのタイミングで Phase 2 検証 (検証ロードマップ band)。

## §6 壊さない / 再発させない (session 3)

- **L4 = G4 freeze 済 (A-101)**。L4 core 4 doc + L9 + PLAN-L4-00〜04 を draft へ戻さない。規範変更は Reverse/Recovery。
- **内部資産 L4-10〜13 は未 freeze** (ST-ASSET、L6/L7 待ち placeholder_deps)。L4 core freeze と混同しない。
- **G4 freeze 記録 = gate §2 台帳 (A-101) + .ut-tdd/audit/A-101** (concept/requirements は prose 見出しで status を持たない、A-100 同様)。
- **L4 完遂は「設計の新規降下」でなく「既存 L4 doc の G4 audit + freeze」だった** (doc は実質書けていた、explorer/audit 確認)。
- **ゴール (L4完遂) を見失わない**: 機能起票 (lint) は L4 完遂を円滑にする手段、L4 完遂が目的 (前 session の反省 = lint に終始して本体未進行を PO 指摘)。

---

# Session Handover — 2026-06-05 (session 4: CLAUDE.md 原則明文化 + L4 workflow オーケストレーション外部設計 補追 = under-design 解消・真の L4 完遂)

> PO 指示の流れ: ① L4 が設計ドキュメント定義に準拠しているか → 粒度監査 (要件→基本設計) で **under-design 2 件** 検出 → ② PO「改善して L4 完遂。harness は別プロダクト開発の基盤でありオーケストレーション設計が薄いのは doc×機械厳格化思想に反する」→ ③ PO「Claude.md 記載案件レベル」で上位思想を CLAUDE.md へ明文化 → ④ /goal「OK.改善してL4完遂」で実装。

## §1 PLAN サマリ

| commit | kind | 何を |
|---|---|---|
| `1aa3322` | docs(governance) | CLAUDE.md: 基盤目的 (harness 完成が目的でなく別プロダクト開発の基盤) + doc×機械厳格化の融合思想 (under-design 禁止、正規 defer は除外) を開発原則に追加 |
| `5c3927e` | docs(governance) | CLAUDE.md「設計の柱 (中核価値 6 本)」: 1 基盤 / 2 doc×機械融合 / 3 自動化で DB 管理+FB 機構 / 4 context/skill 動的注入 / 5 オーケストレーションで開発コスト減 / 6 厳格ルール+検証で品質 |
| `8652e6c` | feat(l4) | **add-design PLAN-L4-05**: function §3 を workflow オーケストレーション外部設計へ deepening + L9 ST-FUNC ペア + IMP-069/070 解消 + ADR-006。**A-102 G4 add-design freeze** |

## §2 成果物

- **粒度監査 (2 軸、pmo-project-explorer + pmo-sonnet)**: coverage ✅ (26 FR orphan 0) / altitude 上 ✅ (over-design 1 minor) / grounding ✅ (arc42/DDD/ADR 充足) / **altitude 下 = under-design 2 件**: workflow mode 群 + FR-12 skill が function §3 で「将来 module 一括 defer」= 外部設計判断なし。
- **function.md §3 deepening**: `Forward spine + 9 駆動モデル + 2 工程専門` の外部設計。§3.1 駆動モデル 9 種 (入口 signal / 状態遷移 phase / 出口 contract+Forward 合流 L / gate・サインオフ) / §3.2 signal→mode routing 全順序 (Incident>Recovery>Reverse>Refactor の 4 失敗 rank + 他は固有 signal) + mode↔kind 非1:1 / §3.3 工程専門 (screen/frontend) / §3.4 FR-12 skill 外部形状 / §3.5 担当 building block / §3.6 実行モード×オーケストレーション (claude/codex/mix/standalone、追補) / §3.7 carry 明示。
- **L9 ST-FUNC ペア**: ST-FUNC-01 (遷移) / 01b (Forward 合流) / 04 (routing 全順序) / 05 (mode↔kind) / 06 (サインオフ gate) / 07 (skill)。§2 量閉じ孤児0。
- **IMP-069 reconcile**: PO「Forward=spine」確定。operational 正本 = Forward spine + 9 駆動モデル (= `docs/process/modes/` の 9、Research 含む) + 2 工程専門。concept §2.5 の legacy「9-mode (Forward+8、Research 除く)」とは同一 universe の別グルーピングで、**橋渡し = modes/README §3**。function §3 / concept §2.5 intro / §10.2 (新語 2 + legacy 9-mode 項) を全て bridge 注記で整合。→ backlog IMP-069→resolved。
- **IMP-070**: commander を **ADR-006** で確定 (ADR-005 は distribution で既使用)。architecture §2 floating 注記 + §7 ADR 一覧を更新。→ backlog IMP-070→resolved。
- **glossary back-merge**: concept §10.2 に「駆動モデル (entry mode、9 種)」「Forward spine」。
- **A-102 G4 add-design freeze**: 4 軸 PASS。gate §2.1 A-102 注記 + G4 行追記 + `.ut-tdd/audit/A-102` (gitignored)。PLAN-L4-05 `confirmed`、function.md/L9 は confirmed 維持。
- **review 前置**: code-reviewer (sonnet) REQUEST_CHANGES → **I-1 (Research/9-mode 帰属の二重 framing)** + **I-2 (routing 優先度 P0/P0 曖昧 vs ST-FUNC-04 全順序)** を修正後 freeze。M-1/M-2/M-4 = minor carry。cross-agent 不在 = intra_runtime_subagent 代替。
- 検証: typecheck 0 / **vitest 189 pass** / doctor exit 0 / pair-freeze 30 孤児0。HEAD = `8652e6c`、push 済。

## §3 Next Action (session 4)

1. **L5 詳細設計を Forward で起票・降下** (`PLAN-L5-00-master`)。L4 完遂 (core A-101 + workflow A-102) で L5 降下可。正規式 L5⇔L8 結合。**IMP-069 確定済**なので mode カウントは operational 正本 (Forward spine + 9 駆動モデル + 2 工程専門) に従う (L5 で揺れない)。
2. **L5 内部処理設計で workflow orchestration module の how を降ろす**: function §3.7 (carry) で defer した CLI signature (L5 D-API) / 状態遷移 pseudocode (L6) / orchestration_mode cell matrix (requirements §1/§7) / 30-cell matrix (requirements §3) を L5 で確定。
3. minor carry (M-1 Refactor 保護網 / M-2 ST-FUNC-06 carry 記述 / M-4 building block クロスリンク) を L5/L6 deepening 時に解消。

## §4 carry (未了・先送り)

- **function §3.7 (carry) の defer 群** (L5/L6/requirements 着地)。
- pair-freeze hard 化 (warn-first → doctor.ok) / plan lint engine 本体 / CI biome subjob。
- **L4-screen sub-doc** (画面設計、5 番目の L4 要素) は L2 モック (G2) 後に別途起票の defer 継続 (PO 承認済、under-design でない正規 skip)。
- 内部資産 L4-10〜13 未 freeze (ST-ASSET、L6/L7 待ち)。

## §6 壊さない / 再発させない (session 4)

- **mode taxonomy の operational 正本 = Forward spine + 9 駆動モデル (Research 含む) + 2 工程専門** (function §3 / §10.2)。concept §2.5 の「9-mode (Forward+8)」は legacy framing、橋渡しは modes/README §3。**L5 以降で mode を数えるときは operational 正本に従う** (再び「9 か 10 か」で揺らさない)。
- **function §3 は L4 外部設計 (what/形状)**。CLI signature・pseudocode・cell matrix は §3.7 (carry) で L5/L6/requirements へ明示 defer = under-design でない (§3.6 = 実行モード×オーケストレーション設計)。**新原則 (CLAUDE.md): doc を書いただけで機械担保の着地先未定義のまま freeze にするのが under-design、defer 宣言は under-design でない**。
- **CLAUDE.md「設計の柱 6 本」が判断基準**: 設計・実装・レビューは「どの柱に資するか」で判断、どの柱にも資さない作業は untraceable arbitrary work として疑う。
- **G4 freeze 記録の二層**: A-101 (core 4 doc) + A-102 (workflow orchestration add-design)。両方 gate §2.1 + .ut-tdd/audit に記録。function.md は両 audit で bless された confirmed (draft へ戻さない、規範変更は Reverse/Recovery)。
- **粒度監査は「準拠 (coverage/altitude/grounding) + 完遂 (under-design 解消)」の両輪**。freeze 済でも under-design が残れば「doc 書いたが機械着地なし」で完遂と誤認しない (本 session の起点 = PO「L4 は定義に準拠しているか」の問い)。

---

# Session Handover — 2026-06-05 (session 5: review 前置の機械強制 — 設計上の問題を実装で解消、IMP-071)

> PO 指摘の連鎖: ① §3.6 を review 前置スキップで freeze → ② PO「なぜ review を飛ばす? ワークフロー上の問題? プラン起票ルールの問題? **やらなかったことは許すが設計上の問題は許さない**」→ ③ 診断 = review 前置が doc-only で機械強制ゼロ (柱 2 違反の under-design)、しかも同 session で「vitest red を確認せず commit」も再演 (機械ゲート無い箇所は規律依存で漏れる実証) → ④ PO「OK」で実装。

## §1-§2 成果 (commit)

| commit | 何を |
|---|---|
| `67b33f1` | §3.6 追補の事後 review (code-reviewer) 指摘修正 (handover §3.6→§3.7 stale / dangling PLAN ref) + **IMP-071 起票** |
| `50f9ea3` | IMP-071 candidate 無効 enum (schema) 修正 — backlog lint が即捕捉 (機械強制が効く箇所の実例) |
| `bef0c2a` | **review 前置の機械強制 feature** (PLAN-L6-12 設計 / L7-13 実装 / REVERSE-12 back-fill) |

- **診断 (証拠ベース)**: review 前置 MUST (CLAUDE.md / requirements §7.8.7 / concept §2.1.2.1) は doc-only。src grep 0 / plan lint=stub / doctor 非検査 → freeze (status→confirmed) / commit が review 証跡ゼロで素通り。concept §2.1.2.1 は「review 記録なければ gate exit 1」と機械ゲート設計済だが**未実装**だった = harness が柱 2 を自分のレビュー規律で破る under-design。
- **機構**: `src/schema/frontmatter.ts` review_evidence (array of reviewer/review_kind=cross_agent\|intra_runtime_subagent\|human/reviewed_at/verdict/scope) + `src/lint/review-evidence.ts` (analyze/loader/messages、対象=confirmed の design/add-design/impl/add-impl で evidence 無し) + `src/doctor/index.ts` checkReviewEvidence (warn-first、ok 非連動) + tests U-REVIEW-001〜006 + L6 設計 review-evidence.md ↔ L7-unit §1.15 ペア。
- **governance**: requirements §7.8.7 機械着地注記 (「記録欠落→exit 1」の実装着地 = review_evidence/checkReviewEvidence) + concept §10.3 用語 back-merge。
- **review 前置 (本 feature 自身)**: code-reviewer APPROVE (Critical 0) → I-1 (loader PLAN- prefix guard) / I-2 (テストコメント正確化) / m-3/m-4 修正後、feature 3 PLAN を confirmed + review_evidence 記録。**「未実施 review を証跡に書かない」ため review 通過まで draft 維持** (本 feature が防ぐ行為を自分でしない規律を実演)。
- **back-fill**: 履歴 design/impl PLAN 13 件 (L1/L3=A-100 / L4-core=A-101 の citable review) に review_evidence。**missing 29→15** (残 L5/L6/L7 feature 15 件は handover に review 記録、warn-first surfaced queue)。
- 検証: typecheck 0 / **vitest 195 pass** (189→+6) / doctor exit 0 / pair-freeze 31 孤児0 / backfill OK。HEAD = `bef0c2a`。

## §3 Next Action (session 5)

1. **IMP-071 残: 履歴 15 件 (L5/L6/L7 feature) の review_evidence back-fill** (handover の review 記録から)。完了後 **warn-first → hard 化** (runDoctor.ok に reviewEvidence.ok 連動 + U-REVIEW-006 を missing==[] 昇格 + CI fail-close、REVERSE-12 §8 hard checklist)。これで新規 design/impl PLAN の review-skip freeze が機械で止まる。
2. **L5 詳細設計** (PLAN-L5-00-master) を Forward で降下 (L4 完遂済、IMP-069 確定済)。
3. **増分設計変更の review ゲート**: freeze 後追補 (本事故の核) に review_evidence entry を確実に append させる運用 (将来 hook 候補、review-evidence.md §7 carry)。

## §6 壊さない / 再発させない (session 5)

- **review 前置は機械強制対象 (IMP-071)**: design/impl/add-* PLAN を confirmed にする前に review_evidence (reviewer/review_kind/verdict) を記録。doctor checkReviewEvidence が surface (warn-first→hard)。**freeze 後の増分追補も review→evidence append** (§3.6 を review スキップで freeze した事故を再発させない)。
- **未実施の review を証跡に書かない**: review_evidence は review 通過後に記録、それまで PLAN は draft。事前に「approve」と書くのは本 feature が防ぐ行為そのもの。
- **commit 前に vitest 結果を確認**: 本 session で red のまま commit (67b33f1) を再演。機械ゲートが無い箇所 (review 前置 / test green 確認) は規律に依存して漏れる = IMP-071 の論拠そのもの。
- **warn-first → hard の昇格パス**: 履歴 back-fill 完了後に runDoctor.ok 連動 (pair-freeze/backfill と同パス)。review-evidence は現状 warn-first (doctor.ok 非連動)。
- review_kind enum = concept §2.1.2.1 の 3 tier と一致 (cross_agent/intra_runtime_subagent/human)。崩さない。

---

# Session 6 — IMP-071 完遂 (warn-first → hard 化 + 履歴 15 件 back-fill)

> PO「キャリーの解決は必要そう？」→ 判定提示 (hard 化=本丸、back-fill=前提だが捏造禁止の棚卸し要) → PO「a で」(締める)。

## 成果 (1 commit、20 files)

- **棚卸し (pmo-sonnet)**: 残 15 件の実 review 記録の実在を確認。**捏造防止**のため実在記録のみ転記。結果 = 11 件 (handover/PLAN 本文に code-reviewer/pmo-sonnet APPROVE 実在) / partial 4 件 (L6-09・L7-10 = code-reviewer 2回 cut-off + PM 補完 → scope に truncate 明記の honest 記録 / L6-08・L7-09 = verdict 記録ゼロ → **今 session code-reviewer 事後 review APPROVE Critical 0** して記録) / no=0 件。
- **back-fill**: 15 件 frontmatter に review_evidence 追記 (deterministic script、転記のみ)。**missing 29→0**。
- **hard 化**: `src/doctor/index.ts` runDoctor.ok に `reviewEvidence.ok` 連動 (backfill/scrumRev/propagation と同 hard 群) + `src/lint/review-evidence.ts` コメント hard 化。
- **CI fail-close**: `tests/review-evidence.test.ts` U-REVIEW-006 を `missing==[]` 昇格 (U-BACKFILL-006 と同パターンの実 repo 回帰ガード = 今後 review なし design/impl PLAN を red 化)。
- **docs**: PLAN-REVERSE-12 §8 hard checklist [x] / L6 design review-evidence.md §4/§5/§7 を hard 化済へ更新 (旧 "warn-first (将来)" を実態へクリーンアップ)。
- **review 前置 (本作業自身)**: hard 化 + back-fill honesty を code-reviewer に通し **APPROVE Critical 0** → Important 2 (warn-first コメント残留 = クリーンアップ原則違反) を**即修正** (routing で逃げず implement) → REVERSE-12 に 2 件目の review_evidence 追記。
- 検証: typecheck 0 / **vitest 195 pass** / doctor exit 0 / review-evidence OK (全件あり)。

## これで閉じたこと

**「review を飛ばせた設計上の問題」が機構として完全閉鎖**: 新規 design/impl/add-* PLAN を review_evidence なしで confirmed にすると doctor.ok=false + U-REVIEW-006 red で CI が止まる。warn-first 段階 (silent 可視化) → hard (fail-close) へ昇格完了。

## §3 Next Action (session 6)

1. **L5 詳細設計** (PLAN-L5-00-master) を Forward で降下 (L4 完遂 + IMP-071 完遂済)。
2. carry: forced-stop 再発防止の仕組み化 (concept §2.6.1 / recovery.md §3 の exit 契約ギャップ、[[feedback_forced_stop_high_severity_recovery]]) / backfill-pairing `checkBackfill` comment="warn-first" vs 実挙動=hard の不整合 (code-reviewer Important #3) + `normalizeTerm` 単体テスト / freeze 後増分追補の review append 運用補助 (将来 hook)。

## §6 壊さない (session 6)

- **review-evidence は hard 判定**: doctor.ok 連動済。design/impl/add-* PLAN は review_evidence (reviewer/review_kind/verdict) なしで confirmed にできない (CI red)。
- **back-fill は実在記録の転記のみ**: review 記録が無い PLAN へ evidence を貼るのは本 feature が禁じる捏造。未記録なら今 review を通すか honest warn のまま残す (L6-08/L7-09 は事後 review、L6-09/L7-10 は truncate を scope 明記)。

---

# Session 7 — L4 見直し・改善 (PLAN-L4-06: drift back-fill + under-design 明示 defer)

> PO /goal「L4の見直し。改善を。」。L4 core 4 doc を新鮮な adversarial 監査 (pmo-sonnet ×4) → 2 種の問題を確定し add-design PLAN-L4-06 で改善。G4 再 bless A-103。

## 確定した 2 種の問題

1. **drift (実装 ahead-of-design、meta 所見)**: 実装済かつ review 済の feature が L4 設計 doc へ back-fill されていなかった = **harness 自身が IMP-051 (impl→design 戻し) を L4 で破った**。
   - data §3 Drive=9 (mode 値混入) vs `VALID_DRIVES`=5 / lint=5 記載 vs src/lint=9 / handover・setup・web「将来」vs 実装済 / runtime=2 vs 5 ファイル / ADR-005 欠落 / review_evidence (IMP-071) §6 未着地 / external-if codex-only 欠落。**全て src 直照合で verify**。
2. **under-design (機械担保着地先未定義、柱 2 違反)**: GateId 形式 lint (data §4 空白) / Research 出口 gate 機械条件 / review_kind 着地。

## 成果 (1 commit、8 files)

- **Tier1 drift 整合**: data (Drive 5種/review_evidence 不変条件) + architecture (lint 9/runtime 5/handover・setup・web building block/ADR-005/commit-msg・session-log hook) + external-if (codex-only/typo trishe→triage)。
- **Tier2 under-design→明示 defer**: GateId=IMP-072 carry / Research gate=IMP-052 carry / review_kind→review_evidence 着地 / Discovery・Scrum→Reverse=checkScrumReverse 参照 (実は enforce 済を可視化) / Scrum L8-L14=ForwardRouting enum 着地。
- **L9 再ペア**: ST-DATA-05 (review_evidence) / ST-EXT-02 (codex-only) + 量閉じ 10 不変条件→5 ST (孤児0)。
- **IMP-072〜075 起票** (IMP-075 = architecture↔src module drift lint = 本 meta drift の再発防止) + IMP-071 hard 化反映。
- **review 前置**: pmo-sonnet **VERDICT=PASS / Critical 0** (drift 精度 5 点 src 直照合 OK)。**code-reviewer は 2 回 truncate (IMP-009 再発、計 74 tool-use)** のため完全 verdict が出る pmo-sonnet で確定 + PM が src 直照合 (honest 記録、review_evidence に明記)。
- 検証: typecheck 0 / **vitest 195 pass** / doctor exit 0 / pair-freeze 31 孤児0 / review-evidence OK。

## G4 再 bless

- **A-103** (`.ut-tdd/audit/A-103-g4-l4-design-refresh.md`、gitignored) + gate-design §2 台帳 G4 行 + §2.1 A-103 注記。4 軸 PASS。
- L4 4 doc/L9 は confirmed 維持 (refresh を A-103 が bless)、PLAN-L4-06 を draft→confirmed。

## §3 Next Action (session 7)

1. **L5 詳細設計** (PLAN-L5-00-master) を Forward で降下 → G5 (L4 完遂 + IMP-071 完遂 + A-103 済)。
2. carry: **IMP-075** (architecture↔src module drift lint = 本 meta drift 再発防止、最優先) / IMP-072 (gate-id-format lint) / IMP-073 (external-if (c)(d) ST 被覆) / IMP-074 (asset-drift carry PLAN id)。

## §6 壊さない (session 7)

- **L4 設計 doc は実装実体と一致させる (drift 禁止)**: data Drive=5 / lint=9 / runtime=5 / handover・setup・web 実装済 / ADR-005。実装が先行したら L4 設計 doc へ back-fill する (IMP-051 を L4 でも守る)。再発防止の機械化 = IMP-075。
- **code-reviewer truncate 時 (IMP-009)**: 完全 verdict が出る pmo-sonnet を代替に使い + drift 精度は PM が src 直照合で一次検証。**truncate を verdict 捏造で埋めない** (scope に明記)。
- **under-design は明示 defer (carry+IMP 紐付け)**: 「doc に書いたが機械担保着地先未定義」を放置しない。defer なら plan_id/IMP を残す。

## Session 7 追補 — PO 問い「実装タスクの ClaudeCode/Codex subagent + クロスレビュー設計は?」

調査結果 (honest):
- **実装 worker 設計 = L4 で外部設計済**: 実装は Claude subagent でなく Codex worker 委譲 (agent-guard allowlist 15 = PMO/PdM/review の判断・レビュー系のみ、be-*/general-purpose block→Codex SE/PE)。具体 Codex model 割当は runtime policy (.claude/CLAUDE.md) = altitude 外。function §3.6 に明記追加。
- **クロスレビュー = concept §2.1.2.1 robust 設計 + L4 §3.6 wiring 済**。
- **GAP = cross-review semantic 強制が未実装** (IMP-071 が presence+review_kind を閉じた続き): ① same_model_approval=forbidden (worker≡reviewer 同一モデル弾き) ② review_kind↔mode 整合 (claude-only の cross_agent 僭称弾き) ③ checklist 逐条記録。worker 識別子 (provider,model) の記録が前提のため **IMP-076 で明示 defer** (機械着地予定)。
- function §3.6 に 2 bullet 追加 (worker 委譲設計 + semantic 強制 gap→IMP-076)。pmo-sonnet review PASS_WITH_FIXES (Critical 0、IMP 番号順のみ修正、§2.1.0 は repo 既存規約で据え置き)。
- 残 carry: **IMP-076** (cross-review semantic enforcement = review_evidence に worker field + same_model/kind↔mode 検査、schema 契約) を IMP-071 の続きとして実装する選択肢。
