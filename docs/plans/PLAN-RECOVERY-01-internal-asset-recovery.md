---
plan_id: PLAN-RECOVERY-01-internal-asset-recovery
title: "PLAN-RECOVERY-01 (recovery): 内部資産 UT-TDD 化の前提抜け — 認識ずれ収束 + L1/L3 fullback"
kind: recovery
layer: cross
drive: fullstack
status: completed
created: 2026-05-29
updated: 2026-06-01
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: aim
    slot_label: "AIM — recovery 観点 (認識訂正の網羅性 / 再発防止 CI チェック案) のレビュー"
  - role: tl
    slot_label: "TL — リオープンポイント (L1/L3 のどこから再開するか) の確認"
  - role: po
    slot_label: "PO — Recovery スコープ承認 (内部資産 FR を L1/L3 に追加してよいか、G1/G3 reopen 可否)"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-01-internal-asset-recovery.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/migration/internal-asset-inventory.md
  references:
    - docs/migration/helix-porting-map.md
    - docs/governance/gate-design.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-RECOVERY-01 (recovery): 内部資産 UT-TDD 化の前提抜け — 認識ずれ収束 + L1/L3 fullback

> **駆動モデル = Recovery** (concept §3.1:384「AI の逸脱・認識ずれ・前提誤読からの再開の収束」)。PO 指示「こういうのは駆動モデルのリカバリーで対応」(2026-05-29) に基づき、前提抜けで進めた工程を Recovery で収束 → 中断工程 (Forward L1/L3) へ fullback する。requires_human_approval = true (tl リオープン確認 + po スコープ承認)。

> **trigger 再分類 (A-78、recovery-workflow §1)**: 当初「認識ずれ」と記述したが、PO 訂正により **(a) 指示無視** = 「内部資産を UT-TDD 用に作り替えよ」という明確な指示の不履行と再分類する (softening しない)。
> **進捗 (A-79)**: Step 1 全部拾う / Step 2 PO 認識確認 (スコープ = L 横断ケース) / Step 3 正常化ポイント特定 (reopen = L1) / **Step 4 top-down 修正 = L1 BR-22 + FR-L1-46〜49 + L3 carry 反映済 (G1/G3 再 readiness 対象)**。L4-L6 設計増分は Forward 継続。
> **進捗 (A-80〜A-86)**: ADR-004 (TS 統制境界、real Codex TL 判断) + PLAN-L4-10 Master + child PLAN-L4-11/12/13 で **L4 内部資産設計増分完了** (architecture §3.1 roster/skills + §4.1 asset-drift / function §1.1 roster + §2 CLI / L9 ST-ASSET-01〜07)。設計原則地盤 (粒度=ペア A-81 / 機能設計=仕様設計 A-82 / placeholder+back-fill A-83 / DB 機械保証 A-84) を確立。**必須再 intra_runtime_subagent review (A-86、PO 指示、code-reviewer checklist) = CONDITIONAL PASS (Critical=0)**、Important/Minor + 連鎖 defect 2 件是正。**G1/G3 内部資産次元 再 readiness 機械確認済** (g3-trace orphanFrL1=[] / fr-registry 46 rows / 2026-06-02 再検証: vitest 85 pass exit 0)。**L5/L6 内部資産関数仕様は placeholder_deps (waiting_layer L6) back-fill** = §6 Step 4-5 参照。

## §1 事故記録

- **timestamp**: 2026-05-29
- **severity**: P2 (開発時の (a) 指示無視。本番影響なし。48h SLA 対象外)
- **impact**: V-model 設計 L1-L6 を **「内部資産 (subagent/skill/command) は HELIX からそのまま使う/後で port」という誤前提**で進行。正しい前提は「**内部資産は UT-TDD 用に作り替える必要がある**」。結果、L1 業務要求・L3 機能要件に「UT-TDD が自前の runtime 資産体系を持つ/既存資産を再構築する」FR が欠落 (FR-level gap)。L4-L6 設計は TS core のみを対象にし、内部資産の次元が丸ごと欠けた。G1/G3 に gap。
- **検知元**: PO 指摘 (「ヘリックス側のスキル資産・サブエージェント・コマンドは TS に作り替えているのか、整理してあるか」→「内部資産を UT-TDD 用に作り替える必要があるのを前提抜けている」)。

## §2 議論順序 timeline

1. L1-L6 設計を Forward で完遂 (A-42〜A-76、内部資産を設計対象に含めず)。
2. PM が「L7 実装 readiness」を宣言 (内部資産前提抜けに無自覚)。
3. PO が runtime 資産 (skill/subagent/command) の TS 化・整理状況を質問。
4. PM 調査: guard 機構は TS 化済だが、資産そのもの (roster/pack/command) は未整理・未設計と判明。
5. PO が前提抜けを明示「内部資産を UT-TDD 用に作り替える必要がある」= FR-level 漏れ。
6. PO が process 指示「Recovery 駆動で対応せよ」。
7. PM が棚卸 (subagent ×19 / skill ×107) を pmo-project-explorer 並行委譲で実施 → [internal-asset-inventory.md](../migration/internal-asset-inventory.md)。
8. 本 recovery PLAN 起票 (認識ずれ収束 + L1/L3 fullback)。

## §3 認識訂正履歴

| # | 当初仮説 (誤) | 実際の状況 (正) | 根拠 |
|---|---|---|---|
| 1 | HELIX 内部資産はそのまま使う / 後で port すれば良い | **UT-TDD 用に作り替える必要がある** (機能要求レベル) | PO 指摘 |
| 2 | guard が TS 化済なら内部資産は統制済 | guard (呼び出しの安全弁) と **資産の中身 (roster/pack)** は別。中身は未整理 | inventory §0 |
| 3 | subagent は active 化されている | original finding: active 19 に HELIX 前提残存。Current: asset-drift で HELIX path residue 0 / legacy command residue 0 を確認 | inventory §1 |
| 4 | skill は参照すれば足りる | original finding: `docs/skills/` = 空 (`.gitkeep`)。Current: curated `docs/skills/` と asset-drift で放置 0 を確認 | inventory §2 |
| 5 | L1-L6 は内部資産も網羅 | L4-L6 は TS core のみ。内部資産は設計対象外 = FR 不在 | inventory §5 |

## §4 中間結論 list

- 棚卸完了: subagent 19 (PMO9/PdM3/review3/BE2/DB1/DevOps1、guard pass15/block4)、skill 107 (core 直結 ~15、drop 候補 ~9)、command 0 (未整備)。詳細 = [internal-asset-inventory.md](../migration/internal-asset-inventory.md)。
- gap の本質: 「機構の FR (FR-09 guard / FR-12 skill 注入)」はあるが「**資産そのものを UT-TDD 用に構築する FR**」が無い。
- 不足 FR 候補 4 件 (FR-AST-1 roster / FR-AST-2 skill pack curate / FR-AST-3 command / FR-AST-4 drift lint、inventory §5)。
- cli/lib は porting-map W1-W17 で既出・TS 再実装対象 (ADR-001) のため本 recovery の対象外。gap は runtime 内部資産側のみ。
- L4-L6 の TS core 設計は **破棄不要** (誤りではなく不完全)。内部資産次元を追加する増分。

## §5 context 再構築 (session 復帰時に必要な前提)

- V-model/W-model 用語は A-74 で是正済 (L0-L14 = V-model / UT-TDD W = AI エージェント 2段V)。harness 自身は単一 V。
- 駆動モデル ② (9-mode) は gate-design §1.1 に統合済。本件は Recovery mode の最初の実適用。
- 設計層 L1-L6 は完了 (G1-G6 passed/conditional) **だが内部資産次元が欠落** = G1/G3 に gap。
- 内部資産の正本: subagent = `.claude/agents/` (UT-TDD-hardened)、skill = curated `docs/skills/`。`vendor/helix-source/skills/` は read-only reference。
- 棚卸 evidence = [internal-asset-inventory.md](../migration/internal-asset-inventory.md)。

## §6 再開ポイント (中断工程への fullback)

**forward_routing = L1 / L3** (FR-level gap のため要求層へ戻す。reopen point = **L1**、PO スコープ承認 = 「L 横断ケースでいい」2026-05-29)。順序と進捗:

1. ✅ **L1 業務要求**に **BR-22** 追加 (自前 runtime 内部資産体系を持つ、HELIX 資産を UT-TDD 用に再構築) + §7 OT-46 + §9 carry (A-79、2026-06-02 OT 衝突是正)。
2. ✅ **L1 機能要求**に **FR-L1-46〜49** 追加 (roster / skill pack curate / command CLI 化 / drift lint、BR-22 trace) + **L3 carry** で R1 被覆 (A-79)。fr-registry-audit (rows 46 / P0:19 P1:22 P2:5) / g3-trace (frL1 46 / orphanFrL1=[]) で trace 接続、**2026-06-02 再検証: vitest 85 pass (exit 0)**。
   - ⚠ **A-79b 是正記録**: 初回 commit 時に test 3 件 fail のまま「66 pass」と誤記録 (fr-registry test の `rows.size`→`rows.length` edit 失敗 + L3 carry のスラッシュ記法 `FR-L1-46/47/48/49` を g3-trace R1 が個別 ID 解決できず 47/48/49 孤児)。intra_runtime_subagent review (code-reviewer checklist) が Critical 2 件として検出 → test 期待値 46 修正 + L3 carry を 4 個別 ID に分解で是正。`vitest \| tail` が exit code を握り潰していたのが誤記録の機序 (以後 `; echo VITEST_EXIT=$?` で検証)。現行再検証は `bun run test` 85 pass。
3. ✅ **G1/G3 を内部資産次元で再 readiness** (A-86): intra_runtime_subagent review (code-reviewer checklist) = tl リオープン代替 = **CONDITIONAL PASS (Critical=0)**。機械確認 = g3-trace orphanFrL1=[] (FR-L1-46〜49 が L1↔L3 双方向被覆) / fr-registry-audit 46 rows / 2026-06-02 再検証 vitest 85 pass (exit 0)。**PO signoff 待ち** (本 §6 承認ゲート、requires_human_approval)。
4. 🟡 Forward で **L4-L6 に内部資産設計を増分** — **L4 = 完了** (A-80〜A-86: architecture §3.1 roster/skills + §4.1 asset-drift / function §1.1 roster + §2 CLI / L9 ST-ASSET、ADR-004 境界準拠)。**L5/L6 = placeholder_deps back-fill** (A-83/A-84 back-fill モデル): 各 subcommand signature / capability resolver / recommender スコア / drift 判定 regex は L6 機能設計 (=仕様設計) で確定 → `waiting_layer: L6` (spec back-fill 型) として doctor が未充足を fail-close 追跡。移行段階 (guard→roster 切替) は `waiting_layer: L7` (実装状態解消型)。porting-map W6/W7 (subagent)・W10 (skill) を後続実装 PLAN 接続。
5. ✅ **fullback 完了条件 (back-fill モデルで再定義、A-83/A-84) = 成立 (A-88、PO close signoff)**: 内部資産が ① 必須スケルトン (Forward spine) に **L4 設計増分として正式に乗る** + **L5/L6 未確定が placeholder_deps で DB(state) 側に登録され doctor が孤児 0 へ収束を機械保証** + 後続実装 PLAN 接続。**= L4 時点で fullback 成立** (L5/L6 を厳密滝で先行完成させる必要なし、back-fill で後追い)。**PO close signoff = 済 (2026-06-01「Close + fullback 承認」) → Recovery close (status=completed)**。Forward 直近 = **L5/L6 内部資産 back-fill 継続** (PO 指示)。

> **FR-AST 採番注記**: inventory §5 の FR-AST-1〜4 は L1 反映時に既存 FR-L1 採番体系に合わせ **FR-L1-46〜49** とした (roster=46 / skill pack=47 / command=48 / drift lint=49)。

> **承認ゲート (Recovery) 状態 (A-88、close 済)**: (1) **po スコープ承認 = 済** (「L 横断ケースでいい」+ FR-L1-46〜49 追加容認、2026-05-29/06-01)。(2) **tl リオープン確認 = intra_runtime_subagent review (code-reviewer checklist) で代替済** (single-agent mode、cross-agent 不在を明示記録、`review_kind: intra_runtime_subagent`、CONDITIONAL PASS)。(3) **po closure signoff = 済** (2026-06-01「Close + fullback 承認」) → **Recovery close、status=completed**。Forward へ正式 fullback、直近 = L5/L6 内部資産 back-fill (PO 指示)。requires_human_approval は全件充足。

## §7 再発防止 (観点リスト / CI チェック追加案)

- **FR-AST-4 (drift lint)**: 内部資産の前提抜けを機械検出する lint を追加 (rule engine IMP-033 のインスタンス):
  - `docs/skills/` が空のまま放置されていないか (curate 未着手検出)
  - `.claude/agents/*.md` に HELIX 絶対パス (`~/ai-dev-kit-vscode/` / `C:\Users\micro`) や `helix codex` 直叩きが残存していないか
  - subagent roster と guard allowlist (15) の整合 (frontmatter model family ↔ agent-guard.ts)
- **lint 逆方向ガード注記** (review 軸2): FR-L1-46〜49 の L1↔L3 整合は **g3-trace R1 (orphanFrL1)** が唯一の逆方向ガード (L1 にあるが L3 carry 不在を検出)。fr-registry-audit は missingInL1 (L3→L1 方向) のみ。carry 記載を消すと g3-trace のみが検出するため、§3 carry 削除時は注意。
- **設計工程チェックリスト**: V-model 着手時に「対象システムの内部資産 (agent/skill/command) を設計スコープに含めたか」を必須確認項目化 (gate-design の 4 軸に「資産次元」を追加検討)。
- **メタモデル接続**: 本件を Recovery mode の参照事例として記録。前提抜け/認識ずれ検知時の標準応答 = recovery kind PLAN ([[feedback-recovery-mode-for-premise-gap]])。
- **improvement-backlog 登録**: IMP として「内部資産 FR 前提抜け」を記録し verified までトラッキング。
