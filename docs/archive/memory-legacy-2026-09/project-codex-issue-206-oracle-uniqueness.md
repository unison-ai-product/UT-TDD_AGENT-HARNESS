---
memory_id: memory:project:codex-issue-206-oracle-uniqueness
kind: project
title: "Codex Issue #206 oracle uniqueness 非重複レーン回収"
tags: ["codex", "forward", "issue-206", "non-overlap", "oracle-test-trace"]
updated_at: 2026-08-07T09:32:26.958Z
---

CodexがClaudeレーンと非重複で Issue #206 (oracle ID uniqueness) を回収する。codex/issue-206-oracle-uniqueness は main exact HEAD c211ff92f7743766ff116fa49db0e40607d9e6a0 から分離し、Claude側の D3d / PR #286 とファイルを共有しない。PR #204 の実害は U-TESTHYGIENE-021..028 の別意味再利用で、056..063 へ是正済み。検出対象は test-design の宣言 site (ID / 正規化説明 / path / line) であり、tests 側の正当な再引用は対象外。単純な ID 複数ファイル検出と ID 単独 allowlist は採らず、既存の ID→説明集合を provenance ratchet として固定し、新規説明と解消済み baseline 行を fail-close する。既存 collectOracleIds の Set 契約は維持し、#259 cited-but-not-declared 逆向き検出は別PRに分離する。Red test → detector → doctor → exact-head CI → 非author closing review の順で進める。
