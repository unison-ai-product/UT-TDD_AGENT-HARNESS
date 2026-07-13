---
plan_id: PLAN-L7-260-sensitive-scan-boundary
title: "PLAN-L7-260 (impl): 機密スキャン境界の拡張 (.ut-tdd/audit・logs・docs 全域)"
kind: impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-13
owner: PM / PO
agent_slots:
  - role: tl
    slot_label: "TL - 検出パターン設計 (self-trigger 回避 + 誤検知境界) レビュー"
  - role: se
    slot_label: "SE - スキャン lint 実装 + pre-push 対象見直し"
parent_design: docs/plans/PLAN-L6-62-design-doc-secret-scan-gate.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
generates:
  - artifact_path: docs/plans/PLAN-L7-260-sensitive-scan-boundary.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-62-design-doc-secret-scan-gate.md
  requires:
    - docs/plans/PLAN-L6-62-design-doc-secret-scan-gate.md
  references:
    - .ut-tdd/audit/A-178-control-layer-gap-audit-2026-07-02.md
    - src/export/document-export.ts
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
    - docs/design/harness/L6-function-design/secret.md
    - scripts/git-hooks/pre-push
    - scripts/git-hooks/secret-scan-diff.ts
    - tests/secret-scan-diff.test.ts
---

# PLAN-L7-260 (impl): 機密スキャン境界の拡張

## Status

draft 継続 (2026-07-13 更新)。`PLAN-L6-62` の L6 secret-scan 契約から降下し、
`src/lint/secret-scan.ts`、doctor hard gate、distribution materialize 前 preflight、
`tests/secret-scan.test.ts` までは実装済み。pre-push hook 対象見直し (Step 4) は
PO 採択案 A (tracked 化 + scanner 再利用) で実装した。warn-only 導入のため fail-close
昇格の運用実績が無く、本 PLAN 自体はまだ confirmed にしない。

## 背景 — 監査証跡ディレクトリが検査の空白地帯

- pre-push の PII 検査対象は `*CLAUDE.md` / `*SKILL.md` / references 配下 `*.md` の 3 パターンのみ
  だった (2026-07-13 に撤廃、下記 Step 4 参照)。
- docexport redaction は docs/ の 6 正本 family のみ走査。
- **`.ut-tdd/audit/` と `.ut-tdd/logs/` (追跡・commit される監査証跡) はフリーテキスト機密 (氏名/住所/内部 URL/個人パス) の検査がゼロ** — 防波堤は pre-commit の API key regex のみ。A-1xx 監査レポートを量産する現運用と整合しない。

## スコープ

1. **スキャン lint (doctor 配下)**: `.ut-tdd/audit/`・`.ut-tdd/logs/`・`.ut-tdd/memory`・docs/ 全域を対象に
   credential marker を検査する。fail-close は secret 系。PII 疑い系は本 PLAN では扱わず、別 security/privacy
   起票へ分離する。
2. **self-trigger 回避設計**: 検出器を説明する doc がパターン素書きで自己発火した前例を踏まえ、テスト用 token は
   runtime 連結で生成し、dummy / placeholder 例外は同一行 marker 必須にする。
3. **distribution preflight**: `sync-stage` / `sync-pack` / `package` の copy/prune/tar 前に同じ scanner を走らせる。
4. **pre-push 対象見直し**: PO 採択案 A (2026-07-13) で実装した。`scripts/git-hooks/pre-push` +
   `scripts/git-hooks/secret-scan-diff.ts` を tracked 化し、`src/lint/secret-scan.ts` の
   `analyzeSecretScan` を再利用する。3 パターン限定を撤廃し、push される commit 群それぞれの
   **commit 時点の blob** (`git show <sha>:<path>`) のうち docs/・.ut-tdd/audit/・
   .ut-tdd/logs/・.ut-tdd/memory を widened scan surface として検査する。旧 `.git/hooks/pre-push`
   (helix 世代、untracked) の PII 系正規表現 (電話番号/郵便番号/email/internal URL) は後退させず、
   `secret-scan-diff.ts` 内で温存する (置換ではなく対象拡大 + 温存)。
   **設計修正 (blind review 指摘、2026-07-13)**: 初期実装は変更ファイル一覧を working tree
   (disk) から読んでいたため、同一 push 内で先行 commit が secret を追加し後続 commit が
   working tree 上だけクリーン化するケースを素通りさせる bypass があった。`pre-push` を
   push 対象の全 commit を列挙する方式に、`secret-scan-diff.ts` を各 commit 時点の blob を
   個別に読む方式に修正し、`tests/secret-scan-diff.test.ts` に bare remote + hooksPath 経由の
   git fixture e2e (途中 commit 追加 → 後続 commit 削除のケースを実際に push して fail-close
   することを確認) を追加した。

## 運用手順 (pre-push hook の有効化、2026-07-13 追記)

初回導入は自動組込みしない (別 slice)。手動で有効化する場合:

```sh
git config core.hooksPath scripts/git-hooks
```

- 既定は **warn-only**。credential / PII marker が見つかっても push は継続し、
  `[ut-tdd pre-push] warn-only: ...` を出す。
- `UT_TDD_PRE_PUSH_SECRET_SCAN_MODE=fail-close` を設定すると fail-close へ昇格し、
  violation があれば push を止める (`exit 1`)。fail-close 昇格は運用実績を見てから
  既定化を検討する (本 PLAN を confirmed にする条件の一つ)。
- `ut-tdd setup` 等への自動組込みは本 PLAN のスコープ外 (別 slice)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | パターン設計 + self-trigger 回避書式の確定 (TL) | 完了 |
| 2 | スキャン lint 実装 + 初回棚卸し | 完了 |
| 3 | distribution preflight + regression test | 完了 |
| 4 | pre-push 対象見直し (PO 採択案 A: tracked 化 + scanner 再利用、warn-only 導入) | 完了 |

## DoD

- [x] `.ut-tdd/audit/` / `.ut-tdd/memory` を含む active runtime surface が doctor で検査される。
- [x] 検出器自身の doc/テストが self-trigger しないよう、テスト token は runtime 連結で生成する。
- [x] distribution materialize 前に secret-scan が fail-close する。
- [x] pre-push hook が tracked 化され (`scripts/git-hooks/pre-push` +
      `scripts/git-hooks/secret-scan-diff.ts`)、3 パターン限定を撤廃した widened surface
      (docs/・.ut-tdd/audit/・.ut-tdd/logs/・.ut-tdd/memory) を検査する
      (`tests/secret-scan-diff.test.ts`)。
- [x] 旧 PII 系正規表現 (電話番号/郵便番号/email/internal URL) を後退させず温存する
      (dummy/placeholder 例外は legacy 同様に適用しない)。
- [x] push される全 commit の**commit 時点の blob** を検査し、working tree の一時的な
      クリーン化 (途中 commit で追加 → 後続 commit で削除) では bypass できないことを
      bare remote + hooksPath 経由の git fixture e2e で固定する
      (`tests/secret-scan-diff.test.ts`)。
- [ ] fail-close 既定化は運用実績待ち。warn-only 運用で violation 傾向を確認してから判断する。
