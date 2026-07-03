---
plan_id: PLAN-L7-303-digest-commit-anchor
title: "PLAN-L7-303 (impl): green-command digest の commit anchor 化 — 経年腐敗の根絶と段階 hard 化"
kind: impl
layer: L7
drive: db
status: draft
version_target: v2
route_signal: version_deferral
route_mode: version-up
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/review-evidence.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - hard 化の段階移行タイミング承認"
  - role: tl
    slot_label: "TL - anchor 方式 (commit SHA 照合) と後方互換の設計レビュー"
  - role: se
    slot_label: "SE - anchor 実装 + 既存 199 件の移行是正"
generates:
  - artifact_path: docs/plans/PLAN-L7-303-digest-commit-anchor.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
    - docs/governance/harness-v2-update-strategy.md
    - docs/plans/PLAN-L7-132-green-command-digest-integrity.md
    - docs/plans/PLAN-L7-194-green-command-digest-hard-gate.md
---

# PLAN-L7-303 (impl): green-command digest の commit anchor 化

## Status

**部分 landed (2026-07-03) / 残 parked (v2)**。A-181 DV-5。L7-132 (advisory 機構) / L7-194 (opt-in strict へ訂正済) の後継。**L7-194 の claim を errata 扱いにするものではない** — L7-194 は「normal doctor は green 維持 + strict flag は opt-in」への訂正を scope 注記で明示済み。本 PLAN が解くのはその先の構造問題。

**landed スライス (PO /goal 2026-07-03)**: schema 拡張 (item 1) + 照合二層化 (item 2) + migrate dry-run 計画器 (item 3 の非破壊部分) + regression test を実装した。活性化型は先例 (L7-312/314) に倣い refactor (code_smell)。**残 parked = item 3-execute (199 件の anchor_commit back-fill) と item 4 (hard ratchet)** — いずれも committed PLAN の frontmatter 改変 (監査境界) と全体 doctor 赤化リスクを伴い PO ゲート。

**dogfood 実証**: 本スライスの anchor 機構を PLAN-L7-309 の review_evidence で実データ検証済 — `anchor_commit: e57f70b...` を付け、`git show e57f70b:docs/plans/PLAN-L7-232-...md` の blob hash が記録 digest と一致 (working tree が今後変わっても永続 green)。anchor 機構が実リポジトリで機能することの証跡。

**migrate dry-run の実リポジトリ結果 (2026-07-03)**: `ut-tdd plan digest-migrate` を全 PLAN に走らせ、**567 green_command を recoverable=562 / suspect=4 / already-anchored=1 に分類**した。A-181 が「199 件不一致」と数えた中身は、大半 (562) が「健全な進化による正当な stale = 履歴に一致 blob あり → anchor 化で永続復旧可能」であり、真に疑わしいのは 4 件のみと判明。**suspect 4 件** (要 A-18x 個別台帳化、PO ゲート):
- `PLAN-L7-282-pack-direct-source-only-guards` / `tests\projection-writer.test.ts`
- `PLAN-RECOVERY-07-design-bottomup-backmerge` / `tests\mode-catalog.test.ts`, `src\schema\mode-catalog.ts`, `tests\drive-model-passage.test.ts`

suspect = どの履歴 commit の blob も claimed digest に一致しない = output_digest に「ファイル hash でなくコマンド出力 hash」を入れた等の疑い (本 PLAN 実装中に L7-309 で orchestrator 自身が危うく踏みかけた誤りと同型)。捏造断定でなく「file-hash 意味論では未照合」。是正は個別調査 (item 3-execute の PO ゲート)。

**Windows 第一級の副次修正**: migrate の履歴走査は git pathspec を使うため、evidence_path の backslash (`tests\foo.ts`) を `toGitPath` で forward slash に正規化し、backslash path を誤って suspect 分類しないようにした (`tests/green-command-digest.test.ts` の toGitPath 単体)。

## 背景 (実測 2026-07-03、構造分析)

- doctor `green-command-digest` が **199 件不一致 (86 PLAN)** を note で報告し続けている。
- **構造原因**: 現行 digest は「green 時点の evidence_path ファイル hash」を**現在の working tree の hash** と照合する。コードが健全に進化するほど不一致が必然的に再増殖する — つまり現行の不一致は「fake」と「正当な経年 stale」が区別不能に混ざっており、このままでは hard 化 (L7-132 が予告した昇格) が永久に不可能。A-153 の rerun-bound 是正が一回性で終わったのはこのため。
- 是正の本質: 証跡の意味は「**あの時点で** この内容に対して green だった」。照合先を「現在」から「記録時点の commit」へ anchor すれば、証跡は永続的に検証可能になり、不一致 = 改ざん/捏造だけを意味するようになる。

## スコープ (1 要件: digest 証跡を記録時点 commit に anchor し、不一致 0 を恒常状態にして hard 化する)

1. **schema 拡張**: review_evidence の green_commands entry に `anchor_commit` (green 時点の HEAD SHA) を追加。スキーマは `src/schema/` の review_evidence 定義、記録経路は既存の digest 刻印フローに追随。
2. **照合ロジック二層化** (`src/lint/green-command-digest.ts`): `anchor_commit` があれば `git show <sha>:<path>` の blob hash と照合 (永続検証)。無ければ従来どおり working tree と照合 (後方互換)。git object が GC/shallow で取れない場合は `unverifiable` として区別し fail にしない。
3. **既存 199 件の移行是正**: 各 mismatch について git log から evidence 記録時点の commit を特定し `anchor_commit` を back-fill する移行スクリプト (`scripts/` ではなく `ut-tdd plan digest-migrate` サブコマンド、dry-run 既定)。特定不能 or anchor 照合でも不一致 = fake 疑いとして台帳化し個別是正 (A-18x で記録)。
4. **段階 hard 化 (ratchet)**: 移行完了で mismatch 0 到達後、`green-command-digest` を runDoctor.ok 算入 (hard) へ昇格。以後の新規 mismatch は即 fail = L7-132 が予告した昇格条件「全 fake digest 是正後」の恒久的な充足。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | anchor 方式 + 後方互換 + unverifiable 分類の設計 (TL) | 直列 |
| 2 | schema + 照合二層化の実装 | 直列 |
| 3 | 199 件の移行是正 (dry-run → PO 確認 → execute、fake 疑い台帳化) | 直列 |
| 4 | mismatch 0 を実測確認 → hard 化 (runDoctor.ok 算入) | 直列 |
| 5 | regression test (anchor 一致 green / anchor 改ざん fail / anchor 無し従来動作 / unverifiable 非 fail) | 直列 |

## DoD

- [x] anchor_commit 付き digest が commit blob と照合され、working tree 変更で不一致にならない (test 固定 — `tests/green-command-digest.test.ts` anchor 照合、実 repo で L7-309 dogfood)
- [x] anchor 先の内容と合わない digest (捏造) が fail する (test 固定 — anchor-digest-mismatch。unverifiable は非 fail も test 固定)
- [ ] 実リポジトリで mismatch 件数が 0 (doctor 実行の実測値を review_evidence に記録) — **parked (199 件移行 = item 3-execute の PO ゲート)**
- [ ] mismatch 0 到達後の hard 化で、fake digest 注入 fixture が doctor exit 1 になる (real-repo regression test、L7-194 の test 資産を流用) — **parked (item 4 hard ratchet、mismatch 0 到達が前提)**

## 実装ノート (後続モデル向け)

- 触るファイル: `src/lint/green-command-digest.ts`、`src/schema/` の review_evidence 型、`src/cli.ts` (digest-migrate)。着手時に Grep で現物再特定 (Codex リファクタで移動している可能性)。
- `git show` の呼び出しはテスト済みの spawn helper を使う (Windows 第一級: .cmd/quoting 問題を新規に踏まない)。
- 既存 confirmed PLAN の frontmatter を書き換える移行は「監査改ざん」との境界が問題になる — anchor_commit の**追記**は記録の補強であり値の書き換えではない、という原則を Step 1 の設計 doc に明記し TL レビューを通すこと。既存 digest 値そのものは絶対に変更しない。
- PLAN-L7-300 (digest 計算の増分キャッシュ) とは独立・両立 (こちらは正しさ、あちらは速さ)。
