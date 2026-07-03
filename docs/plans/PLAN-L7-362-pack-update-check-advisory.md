---
plan_id: PLAN-L7-362-pack-update-check-advisory
title: "PLAN-L7-362 (add-impl): Pack バージョンアップ通知 (status advisory update-check)"
kind: add-impl
layer: L7
drive: be
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - update-check 実装 (ls-remote + cache + fail-open) と status 配線"
  - role: tl
    slot_label: "TL - fail-open 境界 / harness-root 基準 (consumer cwd 非依存) レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-362-pack-update-check-advisory.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/update-check.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/update-check.test.ts
    artifact_type: test_code
  - artifact_path: docs/reference/setup-guide.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-RECOVERY-06-pack-consumer-doctor-profile.md
  requires: []
  references:
    - docs/plans/PLAN-L7-361-setup-noninteractive-package-tar-portability.md
    - .ut-tdd/audit/A-184-pack-release-v0.1.4-2026-07-03.md
    - docs/reference/setup-guide.md
review_evidence:
  - reviewer: ut-tdd-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T21:02:00+09:00"
    tests_green_at: "2026-07-03T20:53:30+09:00"
    verdict: approve
    scope: "Pack update-check advisory (status の additive 通知行 + --json update フィールド + CLI --version 同期)。TL 初回 request-changes: [High] node_modules ベンダリング導入では harness root が自身の .git を持たず、git ls-remote origin が consumer 自身の origin へ継承解決される (文書化済み導入経路①での実害反例)。是正 = remote の正を package.json repository.url へ変更 (origin fallback は hasOwnGit() のみ、どちらも無ければ advisory 沈黙、U-UPDCHK-012/013/014)。[Medium] CLI 配線回帰テスト欠落 → U-UPDCHK-015/016 + UT_TDD_SKIP_UPDATE_CHECK opt-out 追加。[Medium] 破損 cache オラクル欠落 → U-UPDCHK-014。[Low] defaultHarnessRoot never-throw 化 / detail 2 種区別 (U-UPDCHK-008)。再レビューで全所見の是正を機械オラクルと実走 (status = up-to-date (v0.1.4)、cache remote=Pack repo URL) で確認し追認 approve、残所見なし。"
    worker_model: claude-fable-5
    reviewer_model: claude-sonnet-5
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/update-check.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T20:48:37+09:00"
        evidence_path: tests/update-check.test.ts
        output_digest: "sha256:0cb6b915706f3ec1d9f8f31c41ae3ff354eb3a07ac4f5adc3d9bbfaaeb5f1b1f"
      - kind: unit_test
        command: "bun run vitest run tests/distribution-acceptance.test.ts tests/setup.test.ts tests/cli-surface.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T20:52:30+09:00"
        evidence_path: tests/distribution-acceptance.test.ts
        output_digest: "sha256:d61d7df274007db7e0a848a8f63eb2e1ccf5a6b37372dee3a26a7b51377f400a"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T20:48:33+09:00"
        evidence_path: src/setup/update-check.ts
        output_digest: "sha256:cc5de93c3e2217765cbf1d0b25faaee1773ccb743cd5b5e24b5e416518ea3b08"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T20:53:30+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:12619be045136964b4565abc04917f33d68eda37e5039a18462db3f56aa1bc2b"
---

# PLAN-L7-362 (add-impl): Pack バージョンアップ通知 (status advisory update-check)

## 背景 (PO 依頼 2026-07-03)

v0.1.4 release (A-184) で Pack の tag-pin 更新運用は成立したが、**導入済み consumer が
新 release の存在を知る経路が無い** (setup-guide §4 は「CHANGELOG を確認してから」と書くが、
確認の契機は人間の記憶頼み)。PO 依頼「入れているやつにバージョンアップ通知ってできるの？」→
「両方で」= ①GitHub Watch (Releases) 案内の doc 追記 + ②ハーネス内蔵の update-check advisory
の両方を実施する。

## 設計判断

1. **advisory であって gate ではない** — 通知の失敗 (オフライン / remote 不達 / tag 無し) で
   status / doctor を赤にしない。**全経路 fail-open**。
2. **基準は harness checkout、consumer cwd ではない** — 投影導入 (setup-guide §2) では
   cwd の package.json / origin は利用者自身のプロジェクトを指す。version 比較の local は
   モジュール位置から解決した harness root の package.json から読む。
3. **remote の正は package.json `repository.url`** (TL review 所見1 の是正) — node_modules 配下へ
   ベンダリング導入された harness root は自身の `.git` を持たず、remote 名 `origin` は上位
   (consumer 自身) の `.git` から誤解決される。`repository.url` を正とし、`origin` fallback は
   harness root 自身が `.git` を持つ場合のみ。どちらも無ければ advisory 沈黙。
4. **キャッシュ 24h** — セッション/status 実行のたびに remote へ問い合わせない。
   結果を `.ut-tdd/state/update-check.json` (harness root 側) に remote キー付きで保存し
   TTL 24h で再利用 (remote 不一致・破損 cache は stale 扱い)。remote 失敗時は fail-open
   (キャッシュ書き込みせず、次回再試行)。`git ls-remote` は認証不要・timeout 5s。
   `UT_TDD_SKIP_UPDATE_CHECK=1` で remote 問い合わせ自体を止められる (CI / テスト決定論)。
5. **表示面は `ut-tdd status`** — text 出力に `update:` 行を additive 追加、`--json` は
   `update` フィールドを additive 追加 (既存フィールド不変、A-138 ITEM-1 / IMP-139 の前例に倣う)。
6. **CLI `--version` の 0.1.0 固定を是正** — commander の `.version("0.1.0")` が package.json
   (0.1.4) と乖離していた。update-check と同じ harness root の package.json から読む
   (比較元と表示が同一ソースになる)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | ✅ src/setup/update-check.ts (純関数 + node deps + cache + fail-open) | 直列 |
| 2 | ✅ cli.ts status 配線 (text 1 行 + json additive) + `--version` 動的化 | 直列 |
| 3 | ✅ tests/update-check.test.ts (semver 比較 / cache TTL / fail-open / tag parse / CLI 配線) | 直列 |
| 4 | ✅ docs: setup-guide §4 に GitHub Watch (Releases) + update 行の説明追記 | 直列 |
| 5 | ✅ TL request-changes 所見の是正 (repository.url 正 / opt-out / cache 強化) + 追認 approve | 直列 |

## DoD

- [x] `ut-tdd status` が新 tag 検出時に `update: vX -> vY available` 行を出す
      (tests/update-check.test.ts がレンダリング・検出ロジック U-UPDCHK-003/011 と
      CLI 配線 U-UPDCHK-016 で固定)
- [x] remote 失敗 / tag 無し / package.json 欠落のすべてで throw せず advisory 沈黙
      (fail-open テスト U-UPDCHK-007/008/010/013 で固定)
- [x] ベンダリング導入 (repository 無し + 自身の `.git` 無し) で consumer の origin を
      読まない (U-UPDCHK-013、TL review 所見1)
- [x] キャッシュ TTL 内は remote へ問い合わせない (「呼んだら throw」する fake deps
      U-UPDCHK-005 で固定。破損/remote 不一致 cache は U-UPDCHK-014)
- [x] `--json` の既存フィールドが不変 (additive のみ、U-UPDCHK-015 が実 CLI で固定)
- [x] setup-guide §4 に Watch → Custom → Releases の即時通知経路が載る
- [x] CLI `--version` が package.json version と一致する (実走 `bun src/cli.ts --version` = 0.1.4)
