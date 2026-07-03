---
plan_id: PLAN-L7-362-pack-update-check-advisory
title: "PLAN-L7-362 (add-impl): Pack update-check advisory"
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
    slot_label: "SE - update-check implementation and status wiring"
  - role: tl
    slot_label: "TL - consumer-safe remote resolution review"
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
    scope: "Pack update-check advisory。初回 TL review の High finding は、vendored install で consumer origin を誤読しないこと。修正後は UT_TDD_UPDATE_CHECK_REMOTE override → package.json repository.url → harness root 自身が .git を持つ場合だけ origin fallback の順に限定し、U-UPDCHK-012/013/014/018/020 で固定。status text / --json additive field、UT_TDD_SKIP_UPDATE_CHECK と CI=true opt-out、破損 cache、package.json 異常、CLI --version 同期も確認済み。"
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

# PLAN-L7-362: Pack update-check advisory

## 背景

v0.1.4 release により tag-pin update 手順は成立したが、導入済み consumer が新 release の存在を知る経路が人手依存だった。PO 要望は「入れているやつにバージョンアップ通知ができること」。本 slice は 2 経路を提供する。

- GitHub の **Watch → Custom → Releases** による push 通知を setup guide / README に明記する。
- `ut-tdd status` に fail-open な `update:` advisory 行を additive 追加する。

## 設計判断

1. update-check は **advisory であって gate ではない**。remote 不達、tag 不在、package.json 不備、cache 破損のいずれでも throw せず、status / doctor を赤にしない。
2. 比較基準は consumer cwd ではなく **harness checkout root**。投影導入では consumer cwd の `package.json` / `origin` は利用者自身の project を指すため、local version は harness root の `package.json` から読む。
3. remote の正は `UT_TDD_UPDATE_CHECK_REMOTE` override、次に harness root `package.json` の `repository.url`。vendored / node_modules 導入では harness root が自分の `.git` を持たないため、`origin` を読ませると consumer repo の origin を誤読する。`origin` fallback は harness root 自身が `.git` を持つ場合だけに限定する。
4. remote 結果は harness root 側 `.ut-tdd/state/update-check.json` に 24h TTL で cache する。remote key が変わった cache、壊れた cache、TTL 切れ cache は stale として remote を再確認する。
5. `UT_TDD_SKIP_UPDATE_CHECK=1` と `CI=true` は CI / deterministic tests 用の opt-out。remote 問い合わせ自体を止め、fail-open 表示にする。
6. `ut-tdd status --json` は既存 field を維持したまま `update` field を additive 追加する。text 出力は `update:` 1 行のみ追加する。
7. CLI `--version` は固定文字列ではなく harness root `package.json` の version から読む。

## 変更

- `src/setup/update-check.ts`: semver tag parse、remote tag 取得 deps、cache、fail-open result、status line render。
- `src/cli.ts`: `status` text / JSON への update-check 配線、`--version` の package version 同期。
- `tests/update-check.test.ts`: U-UPDCHK-001..020 の unit / CLI oracle。
- `docs/reference/setup-guide.md` / `README.md` / `CHANGELOG.md`: release 通知経路の説明。

## 検証

- `bun run vitest run tests/update-check.test.ts --reporter=dot`
- `bun run vitest run tests/distribution-acceptance.test.ts tests/setup.test.ts tests/cli-surface.test.ts --reporter=dot`
- `bun run typecheck`
- `bun run lint`

## DoD

- [x] `ut-tdd status` が新 tag 検出時に `update: vX -> vY available` を出す。
- [x] remote 不達、tag 不在、package.json 欠落/不正で throw せず fail-open する。
- [x] vendored install で consumer origin を読まない。
- [x] 24h TTL cache が remote key 付きで機能し、壊れた cache は stale として扱う。
- [x] `status --json` は既存 field 不変で `update` のみ additive 追加する。
- [x] setup guide / README に GitHub Watch Releases と status advisory の両経路が載る。
- [x] CLI `--version` が package.json version と一致する。
