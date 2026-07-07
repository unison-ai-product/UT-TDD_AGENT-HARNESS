---
plan_id: PLAN-L7-361-setup-noninteractive-package-tar-portability
title: "PLAN-L7-361 (impl): setup 非対話ハング根治 + distribution package tar 可搬性"
kind: impl
layer: L7
drive: be
status: confirmed
route_signal: regression_dev
route_mode: recovery
backprop_decision: not_required
backprop_decision_reason: "PLAN-RECOVERY-06 の実走検証 (2026-07-03) で発見した consumer 実動線の 2 欠陥の是正。setup の非対話既定 (既存保護 skip) と packager の tar 呼び出し可搬化であり、上位要求・業務仕様の意味変更を伴わない。"
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/plans/PLAN-RECOVERY-06-pack-consumer-doctor-profile.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - emitSetup 非対話 skip + package tar 相対パス化"
  - role: qa
    slot_label: "QA - 再現環境での実走検証 (ハング環境 / GNU tar 環境)"
generates:
  - artifact_path: docs/plans/PLAN-L7-361-setup-noninteractive-package-tar-portability.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/index.ts
    artifact_type: source_module
  - artifact_path: src/cli/distribution.ts
    artifact_type: source_module
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
  - artifact_path: tests/distribution-acceptance.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-RECOVERY-06-pack-consumer-doctor-profile.md
  requires: []
  references:
    - docs/plans/PLAN-RECOVERY-06-pack-consumer-doctor-profile.md
    - docs/plans/PLAN-L7-359-consumer-setup-profile-wiring.md
review_evidence:
  - reviewer: claude-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T18:54:00+09:00"
    tests_green_at: "2026-07-03T18:53:30+09:00"
    verdict: note
    scope: "RECOVERY-06 実走検証で発見した 2 欠陥の是正 slice。①emitSetup が isInteractive 不変条件 (「confirm は対話時のみ」、nodeConfirm docstring 明記) に違反し blocking readSync で無限待ち → 非対話は既存保護 skip。②package の tar -f 絶対 Windows パスを GNU tar が remote host 解釈 → 相対 basename + cwd 固定。両修正とも再現環境で実走 green (下記 実走検証)。"
    worker_model: claude-fable-5
    reviewer_model: claude-sonnet-4-6
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/setup.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T18:51:20+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:ff224267adf0ddc6e4ce7849e119bacdf3931c5d32bc07ec5fe4ef153cefd553"
      - kind: unit_test
        command: "bun run vitest run tests/distribution-acceptance.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T18:52:15+09:00"
        evidence_path: tests/distribution-acceptance.test.ts
        output_digest: "sha256:45de473da18bd3d74da85e99b9bc20f706825c1753a365a429eae79b21831b27"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T18:51:15+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:e3c52a39624318d5f67e76fe2d4ff8b0ea3fdb910a05d884a82e6a211f6c742b"
      - kind: lint
        command: "bunx biome check src/setup/index.ts src/cli/distribution.ts tests/setup.test.ts tests/distribution-acceptance.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T18:53:00+09:00"
        evidence_path: src/cli/distribution.ts
        output_digest: "sha256:699e8dd595f7b5e4abab96fa395eaf3dc6495b19be7c34e68503bdeb84229b86"
---

# PLAN-L7-361 (impl): setup 非対話ハング根治 + distribution package tar 可搬性

## 背景 (PLAN-RECOVERY-06 実走検証の所見、2026-07-03)

RECOVERY-06 / L7-359 の end-to-end 検証 (実 tarball → fresh consumer → 生成 CI 実走) で
2 件の実欠陥を発見した:

1. **setup 非対話ハング**: `emitSetup` が既存ファイルの上書き確認で `deps.confirm` を無条件に
   呼ぶが、`nodeConfirm` は blocking `readSync(0)` のため、**stdin が開いたまま無音の非対話環境**
   (CI runner / tool shell) で無限待ちになる。`nodeConfirm` の docstring は「isInteractive 時のみ
   呼ばれる」と不変条件を明記しており、emitSetup がこれに違反していた (runSetup の phase 決定は
   遵守済み)。実配布物には `.github/workflows/harness-check.yml` が同梱されるため、Pack clone 上の
   setup は必ず既存ファイル確認を踏む = 実運用で必ず露出する。
2. **package tar 可搬性**: `distribution package` の `tar -czf <絶対 Windows パス>` を GNU tar
   (Git Bash 同梱) がリモートホスト名と解釈し `Cannot connect to C: resolve failed` で必ず失敗
   (bsdtar では成功)。どの tar が PATH 先頭かで成否が変わる環境依存欠陥。

**誤測の撤回記録** (verification-principles): 当初「tar 失敗でも exit 0 の fail-open」と報告したが、
これは pipe 越しに `tail` の exit code を拾った**計測ミス**。exit 契約は実装済みで正しい
(`process.exitCode = ok ? 0 : 1`、直接計測で exit=1 確認済み)。所見は本 PLAN の 2 件に訂正する。

## 是正

1. `src/setup/index.ts` `emitSetup`: `deps.isInteractive !== true` なら confirm を呼ばず既存 skip
   (非破壊導入の既定 = 既存保護)。対話時の確認フローは不変。
2. `src/cli/distribution.ts` `package`: `tar -czf` を相対 basename + `cwd: outDir` で実行
   (bsdtar / GNU tar 両対応、`-C` 引数は remote 解釈対象外)。失敗時は stdout に
   `tar: error exit=<code> (<stderr 先頭行>) - artifacts not created` を surface。

follow-up (本 PLAN 外): 非対話で意図的に上書きしたい update 経路向けの `--overwrite` フラグは
需要が実測されたら別 PLAN で扱う (managed-block doc は既に prompt 無しで冪等 merge 済み)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | ✅ emitSetup 非対話 skip + package tar 相対化の実装 | 直列 |
| 2 | ✅ test 固定 (U-SETUP-016/016b、acceptance package step) + 再現環境実走 | 直列 |

## 実走検証 (再現環境、2026-07-03)

- ハング環境再現 (PowerShell tool、stdin 開放無音、全生成物既存の consumer dir): 修正前 = 5 分超
  無限待ち (プロンプト `上書きしますか？ [y/N]` で停止) → 修正後 = **exit 0 / 726ms 完走**、既存
  ファイル保護 (上書きプロンプト出力なし)。
- GNU tar 環境 (Git Bash): 修正前 = `Cannot connect to C: resolve failed` / exit 1 / artifact 0 件
  → 修正後 = **`distribution package: ok` / exit 0 / tarball 1,037,196 bytes + sha256 生成**。

## DoD

- [x] 非対話 emitSetup が confirm を呼ばず既存を保護する (tests/setup.test.ts U-SETUP-016 が
      「confirm 呼出 = throw」で固定、U-SETUP-016b が対話上書きの不変を固定)
- [x] package が GNU tar / bsdtar の両方で成功する (tests/distribution-acceptance.test.ts の
      package step が実 tarball 生成 + `tar.exitCode=0` + exit 0 を固定。GNU tar 実機は上記実走)
- [x] 失敗時の tar stderr が stdout に surface される (実装、`tar: error exit=` 行)
