# Feedback Log — UT-TDD Agent Harness

> **目的 (柱3 フィードバック機構の可視化)**: PO からのフィードバック・是正・インシデントを **repo 内 tracked** で記録し、「何を是正し → 何を学び (lesson/principle) → どこにドメスティック化したか (memory / IMP / doc 変更)」の監査トレイルを残す。**フィードバックが chat で消えず、ドメスティック化されたことを PO が検証できる**状態を作る (PO 2026-06-08「memory に書いてドメスティック化して見えなきゃ何にも価値はないぞ」)。
>
> **3 層の役割分担**:
> - **本ログ (`docs/feedback-log.md`、tracked)** = PROJECT のフィードバック記録。PO・Codex・全 agent・将来 session が見える。feedback → lesson → action の単一トレイル。
> - **agent memory (`.claude/projects/.../memory/`、agent-private)** = 私 (Claude Code) の恒久 behavior。本ログの lesson から導出され、毎 session 注入される。PO からは見えないため、本ログがその可視 counterpart。
> - **improvement-backlog (`docs/improvement-backlog.md`)** = lesson から派生した **作る物 (IMP、機械強制)** の list。
>
> **ドメスティック化原則 (MUST)**: フィードバックは**必ず** memory (behavior) / IMP (機械強制) / doc (governance) のいずれかへ落とす。`domesticated to` が空のまま放置=未ドメスティック化=価値ゼロ。`status: open` で残さない。

## エントリ

| FB-ID | 日付 | source | フィードバック (要約) | lesson / principle | domesticated to | status |
|---|---|---|---|---|---|---|
| **FB-001** | 2026-06-08 | PO (L5 監査中) | 要件定義が全然設計に落ちていなかったのに「trace OK」と報告した = 君のミス。fr-registry/pair-freeze の orphan 0 を「設計に落ちた」証拠にした | **coverage (ID 登録/link 存在/件数) ≠ substance (中身が設計/テスト/レビューされたか)**。被覆カウントを中身の証拠にしない。reviewer は中身を読む | memory: [[feedback_verify_descent_not_coverage_count]] + [[feedback_coverage_not_substance]] / IMP-082 (descent lint) | domesticated |
| **FB-002** | 2026-06-08 | PO | 改善案を chat に書くだけでは消えて無価値。memory に書いてドメスティック化して見えなきゃ価値ゼロ | 改善案・lesson は chat で終わらせず **memory + backlog へ即ドメスティック化**し可視化する | memory: [[feedback_coverage_not_substance]] §How3 / 本 feedback-log の新設 (FB-003) | domesticated |
| **FB-003** | 2026-06-08 | PO | フィードバックログみたいなのを設けたら？ | PO フィードバックは agent-private memory だけでなく **repo 内 tracked な feedback-log** に可視化し、ドメスティック化の監査トレイルを残す (柱3 の可視化) | doc: 本ファイル `docs/feedback-log.md` 新設 / IMP-085 (feedback-log discipline lint) | domesticated |
| **FB-004** | 2026-06-08 | PO (harness.db を revert でなく拡張で対応) | 私が SQLite(harness.db) を「実装ゼロ・YAGNI だから revert」と即断推奨した。PO は revert せず PLAN-L5-08 + A-105 で要件→L5 へ正式 descent させ、harness.db を**フィードバック機構 (柱3)**として明確化した | **アーキ決定を over-design/YAGNI と断じて revert 推奨する前に、それが 6 本の設計の柱 (特に柱3=自動化で state 管理を簡単にしフィードバック機構にする / 柱4=context・skill 動的注入) を実体化していないか必ず確認する**。「今 src に実装が無い」は L5 設計段階では revert 根拠にならない (V-model では設計が実装に先行する)。手続き不備 (無記録・self-stamp) と決定自体の良否を分けて指摘する | memory: [[feedback_check_pillar_before_revert]] / 本 FB | domesticated |

## 運用

- 新規フィードバックは末尾に **FB-NNN** で append (連番、repo 内ユニーク)。
- 各エントリは `domesticated to` に**実体への link** (memory `[[name]]` / `IMP-NNN` / doc path) を必ず記す。
- `status`: `open` (未ドメスティック化、要対応) / `domesticated` (memory/IMP/doc へ落とし済) / `superseded`。
- **機械強制 (目標、IMP-085)**: doctor が `status: open` の FB / `domesticated to` 空の FB を surface し、参照先 (memory/IMP/doc) の実在も突合する。「フィードバックがドメスティック化されずに放置」を fail-close で塞ぐ (柱2 doc×機械、柱3 フィードバック機構)。
