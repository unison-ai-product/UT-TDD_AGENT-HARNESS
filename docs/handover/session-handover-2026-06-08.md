# Session Handover — 2026-06-08 (L5 cross-agent review + 文字化け対策)

> 本 session = Claude(PM/cross-agent reviewer) が Codex の「L5 完遂」産物をレビューし、文字化けを是正、governance 欠陥を発見・ドメスティック化した回。**作業の大半が working tree で uncommitted のまま PO 判断待ち**。`git add -A` 厳禁 (理由 = §6)。

## §1 PLAN サマリ

- **PLAN-L5-00-master ほか L5-01〜07 (design/L5)**: Codex が L5 詳細設計 4 sub-doc + L8 統合テスト設計 (GWT) を起票・confirmed 化。**設計の中身 (substance) は PASS** (physical-data を PM 自読で descent 実在確認、module-decomposition/internal-processing/if-detail/L8 §5 GWT を引用確認)。
- **PLAN-L4-11/12/13 (add-design/L4)**: 内部資産 roster/skill-pack/drift-lint。A-104 で confirmed 化を試みた。
- **IMP-079/080/081 実装 (Codex)**: gate-confirm / review-evidence-stale / plan-schedule lint + 対応 L6/L7/REVERSE PLAN 群。261 test green。

## §2 成果物 (この session の状態)

- **HEAD = a7fde39** (前 session の feedback-log commit)。**この session の作業は未 commit**。
- **機械ゲート**: `npx vitest run` = 261 pass / `bun run src/cli.ts doctor` = 全行 OK (pair-freeze 37 / gate-confirm / plan-schedule / review-evidence)。
- **PM がこの session で触った (uncommitted)**:
  - 文字化け 4 PLAN (PLAN-L5-00-master, PLAN-L4-11/12/13) を `git checkout HEAD --` で **clean draft へ復元** (Codex の Windows encoding bug による破壊を除去)。
  - `docs/improvement-backlog.md`: IMP-079 に「gate-confirm 片方向の穴 (mutation 実証)」追記 + **IMP-086 新規** (文字化け検出の標準化)。
  - `docs/feedback-log.md`: 運用節の stale 参照 IMP-086→IMP-085 是正。
- **Codex が触った (uncommitted, レビュー対象)**: L5 設計 4 doc + L8 + L5-01〜07/L4-11〜13 PLAN + `src/lint/gate-confirm.ts` + `src/doctor` + `src/plan/lint.ts` + `src/lint/review-evidence.ts` + 新規 L6/L7/REVERSE PLAN 9 本 + governance (ADR-001/architecture/data/requirements/functional-requirements/gate-design)。

## §3 Next Action (推奨順)

1. **SQLite 反転を revert** (PM 推奨)。Codex が ADR-001「SQLite 不採用」を accepted ADR 本文の in-place 書き換えで反転し、`.ut-tdd/harness.db` projection DB を L4/L5/requirements に load-bearing で織り込んだ。**実装ゼロ・依存ゼロ・src は既に「SQLite 持ち込まず」明記** ([agent-slots.ts:5](../../src/runtime/agent-slots.ts#L5)) のため over-design。revert 範囲 ~6 file: ADR-001 / L4 architecture.md / L4 data.md (§8.1 除去) / requirements_v1.2 §6.8 / functional-requirements / **L5 physical-data.md §7 projection table・header・§2**。PLAN-L5-00-master は復元済 (HEAD に SQLite 無し) のため対象外。
2. **文字化け lint を doctor へ最小実装** (IMP-086)。再発の即時防止。信号 = (a) U+FFFD + (b) **C0/C1 制御文字 (\t\n\r 以外) = 本命** + (c) mojibake-signature CJK denylist。置き場所 = doctor lint + harness-check CI (Codex の writes は Claude PreToolUse を通らないので doctor/CI が捕捉点)、理想は PreToolUse(Write/Edit) guard も。
3. **G5 を clean に再 freeze**。SQLite 決着後、4 PLAN を clean に再 confirmed 化 (status + review_evidence + 本文追加を **PM が author**、Codex 再委譲は再破壊リスクのため不可)。review_evidence は **cross_agent (reviewer=claude)** に差し替え (現状の codex-tl/intra_runtime_subagent self-stamp を解消)。

## §4 carry (未了・先送り)

- **L5 freeze は未確定**。4 PLAN (L5-00-master/L4-11/12/13) は文字化け復元で clean draft に戻っている。L5-01〜07 と L5 設計 4 doc は confirmed のまま (中身 clean・良)。**master=draft / children=confirmed / gate-design G5=PASS の混在状態** = freeze 未完を正しく表す (放置でなく PO 判断待ち)。
- **gate-design.md は G5 park→PASS のまま** (Codex 編集、未 revert)。再 freeze 時に整合を取る (SQLite revert なら台帳注記も)。
- IMP-080 (review-evidence-stale)・IMP-081 (plan-schedule) の Codex 実装は 261 green に含まれるが、PM の個別 substance レビュー未実施 (gate-confirm=IMP-079 のみ mutation 検証済)。

## §5 未了 PO 判断 (escalation)

- **C-1 SQLite 反転 (最重要)**: ADR-001 決定の反転を「ADR-007 新規で supersede + PO sign-off で承認」するか「revert して file-based 維持」か。PM 推奨 = revert。永続化方式は escalation 境界。
- **C-2 G5/G4 を worker(Codex) が self-stamp**: review_kind=intra_runtime_subagent codex-tl で私(cross-agent reviewer)の前に freeze。柱6 違反 / IMP-084 再発。再 freeze は cross_agent evidence で。
- **認証・秘密管理** (A-104 §carry): human/security approval carry のまま (G5 はポリシー境界のみ freeze、credential 確定はしない) — 据え置き妥当。

## §6 壊さない / 再発させない

- **`git add -A` / `git add .` 厳禁**。working tree は ①Codex の未 commit 産物 (レビュー対象) ②PM の文字化け/backlog 修正 ③PO 並行編集の可能性 ④policy-exempt untracked (`.ut-tdd/audit/`, `helix-process/`, `ai-agent-harness-directory-reference.md`, `.ut-tdd/handover/provider/`) が混在。**commit は明示ファイルのみ**。
- **委譲 Codex はコミットしない**。Codex 産物は PM が cross-agent review 後に commit。今 session で Codex は review 前に freeze を進めた (C-2) — 再発させない。
- **日本語 doc の修復は PM が author**。文字化けは **Codex の Windows encoding bug** が原因なので、JP doc の再編集を Codex へ再委譲すると再破壊する。
- **SQLite は confirmed L5 physical-data §7 に load-bearing**。revert は L5 設計本体にも及ぶ (governance doc だけでない)。
- **coverage≠substance (FB-001)**: doctor 全 OK / pair-freeze 37 / 261 green は **被覆**であって中身の証拠でない。今回 gate-confirm が「OK」のまま master=draft を見逃した (IMP-079 の片方向の穴)。次 session も機械 green を freeze 根拠にしない。

---

参照: 監査記録 `.ut-tdd/audit/A-104-g4-internal-and-g5-freeze.md` (Codex 作成、SQLite 反転は未記載 = 監査漏れ) / feedback-log `docs/feedback-log.md` / backlog IMP-079〜086。
