---
plan_id: PLAN-L7-197-github-ops-workflow-hardening
title: "PLAN-L7-197 (impl): GitHub 運用 workflow hardening"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-06-29
updated: 2026-07-01
owner: PM (Opus) / PO (human)
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE (Codex): audit quality CI 配線、release-plan、branch-type guard、CODEOWNERS 0-team fail-close"
  - role: tl
    slot_label: "TL (Claude/Codex judge): CI/template 互換、外部公開境界、証跡確認"
generates:
  - artifact_path: docs/plans/PLAN-L7-197-github-ops-workflow-hardening.md
    artifact_type: markdown_doc
  - artifact_path: .github/workflows/harness-check.yml
    artifact_type: github_config
  - artifact_path: src/github/ops-guard.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/setup/templates.ts
    artifact_type: source_module
  - artifact_path: tests/github-ops-guard.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-03-setup-solo-team.md
  references:
    - .ut-tdd/audit/A-145-01-distribution-packaging.md
    - .ut-tdd/audit/A-144-02-runtime-config-security.md
    - .ut-tdd/audit/A-145-03-verification-gate-engine.md
review_evidence:
  - reviewer: Codex
    review_kind: intra_runtime_subagent
    reviewed_at: 2026-07-01T18:04:58+09:00
    verdict: pass
    scope: "PLAN-L7-197 local close: GitHub ops guard, CI/template audit quality wiring, release-plan, CODEOWNERS 0-team fail-close"
    tests_green_at: 2026-07-01T18:04:58+09:00
    green_commands:
      - kind: typecheck
        command: bun run typecheck
        runner: bun
        scope: full
        exit_code: 0
        completed_at: 2026-07-01T18:02:24+09:00
        evidence_path: src/cli.ts
        output_digest: "sha256:88c712454d05fc8ec4a543682eedbc235ef5f08302dd358eff73defd08a27c23"
      - kind: lint
        command: bun run lint
        runner: bun
        scope: full
        exit_code: 0
        completed_at: 2026-07-01T18:00:15+09:00
        evidence_path: tests/github-ops-guard.test.ts
        output_digest: "sha256:ede51495fd3cd4b174d943ff49293a3d5f33268cc2e63ca2b549f4457c25a96c"
      - kind: unit_test
        command: bun run vitest run tests/github-ops-guard.test.ts tests/setup.test.ts --reporter=dot
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: 2026-07-01T18:00:27+09:00
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:b07c5edbaf2fa7f17624c8c436e3336052c60227c8dea8c08f1cce7380f96617"
      - kind: smoke
        command: bun run vitest run tests/cli-surface.test.ts -t "release publication|GitHub branch-type|CODEOWNERS team" --reporter=dot
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: 2026-07-01T17:58:38+09:00
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:c0c33af74e47d02355d431cbfa1a04b87b84d7db31bd852ae18ea4e6b4c636f2"
      - kind: smoke
        command: bun src/cli.ts distribution release-plan --tag v0.1.0 --repo unison-ai-product/UT-TDD_AGENT-HARNESS-Pack --json
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: 2026-07-01T18:03:01+09:00
        evidence_path: src/github/ops-guard.ts
        output_digest: "sha256:f45fd0e718bd627d26fa834fd811d1f7ccf72d78f7c6a2ab77bc86b8c8f94164"
      - kind: smoke
        command: bun src/cli.ts audit quality --include-tests --limit 20
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: 2026-07-01T18:03:02+09:00
        evidence_path: tests/github-ops-guard.test.ts
        output_digest: "sha256:ede51495fd3cd4b174d943ff49293a3d5f33268cc2e63ca2b549f4457c25a96c"
---

# PLAN-L7-197 (impl): GitHub 運用 workflow hardening

## 背景

2026-06-29 の GitHub 運用 probe で、GitHub CI と配布テンプレートに次の穴が残っていた。

- `audit quality` は手動 CLI だけで、`harness-check` CI と consumer template に配線されていなかった。
- release tag / `gh release` の運用手順が CLI から再現できず、外部公開操作との境界が曖昧だった。
- `poc/*` / `hotfix/*` / commit subject の branch-type guard がコメント上の予定に留まっていた。
- `setup --team` が team slug 0 件でも CODEOWNERS 生成へ進めるため、SEC-1 の 0-team 通過穴が残っていた。

## Scope

### IN

- dogfood `.github/workflows/harness-check.yml` に `github guard` と `audit quality --include-tests` を追加する。
- consumer `common/harness-check.yml` template に同じ guard / audit / doctor 経路を追加する。
- `src/github/ops-guard.ts` に GitHub 運用 guard を実装する。
- CLI に `github guard` と `distribution release-plan` を追加する。
- `setup --team` は `--tl-team` / `--qa-team` / `--po-team` が 0 件または一部欠落なら fail-close する。
- unit / CLI surface / setup template test で branch-type guard、release-plan、CODEOWNERS 0-team reject を固定する。

### OUT

- 実 tag 作成、`git push --tags`、`gh release create` の実行。
- Pack repo への公開、署名 tarball publish、UAT。
- `audit quality` の検出ロジック自体の拡張。

## 実装結果

- `github guard` は次を fail-close する。
  - `poc/*` から `main` への PR。
  - `hotfix/*` から `main` への PR で `Postmortem` 証跡が無いもの。
  - Conventional Commits 形式ではない commit subject。
- `distribution release-plan` は `git tag -a`、`distribution package`、`gh release create` の command list を表示するだけで、外部公開操作は実行しない。
- dogfood CI と consumer CI template は branch-type guard、typecheck、DB rebuild、test、lint、audit quality、doctor を同じ順序で通す。
- `setup --team` は CODEOWNERS 用 team slug が 0 件なら即時 reject する。

## Acceptance Criteria

- `github guard` が `poc/*` main merge、postmortem 無し hotfix、非 Conventional Commit を検出する。
- `distribution release-plan --tag vX.Y.Z` が非破壊の公開計画を返し、外部公開操作は human/external boundary として残す。
- dogfood CI と consumer template の双方に `audit quality --include-tests` が配線される。
- `setup --team --dry-run` は team slug 0 件を reject する。
- typecheck / lint / targeted vitest / normal doctor が green。

## 判定

実 tag push / GitHub Release 作成 / 署名 publish / UAT は外部公開操作なので、本 PLAN の local close には含めない。
