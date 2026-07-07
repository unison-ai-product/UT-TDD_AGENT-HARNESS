# route_mode↔kind 整合 debt 台帳 (2026-07-02)

正本: PLAN-L7-263-route-mode-kind-certificate / A-178 G-14・G-15。

`route_mode: add-feature` は kind を `add-design` / `add-impl` に限定する
(add-feature mode は両 kind を内包し、独立 kind を持たない)。`kind: impl` は
`KIND_BACKFILL[impl] = none` のため、この組み合わせは add-feature 駆動の中核義務
(実装→設計 back-fill) を機械免除された形になる。2026-07-02 の `plan lint`
`route_mode_kind_mismatch` 検査導入時点の既存違反を本台帳へ固定する。

台帳とコード側 allowlist (`src/plan/lint-policy.ts` の
`ROUTE_MODE_KIND_LEGACY_LANDED_PLAN_IDS` / `ROUTE_MODE_KIND_DRAFT_DEBT_PLAN_IDS`)
の同期は `tests/plan-lint.test.ts` の台帳同期テストで fail-close に保証する。

## 是正規律

- **legacy landed (恒久免除)**: 既に confirmed で landed 済み。完了成果の kind を
  書き換えると履歴改ざんになるため kind は保持し、back-fill 残債は Reverse 起票で
  個別に返済する。
- **draft debt (着手時昇格)**: draft の間のみ免除。着手 (status が draft 以外へ
  遷移) する前に `kind: add-impl` + Reverse pairing (REVERSE plan の
  `dependencies.parent` 参照。draft 段階の pairing は parent 参照で成立させ、
  requires は landed 後に張る — デッドロック解消 `0d55f5e`) へ昇格する。
  昇格せずに status を進めると `route_mode_kind_mismatch` で fail-close する。

## legacy landed (5 本、恒久免除)

| plan_id | 2026-07-02 時点 status |
|---|---|
| PLAN-L7-212-route-certificate-governance | confirmed (landed 済のため恒久免除) |
| PLAN-L7-213-project-local-setup-wrapper | confirmed (landed 済のため恒久免除) |
| PLAN-L7-214-skill-root-relation-graph-projection | confirmed (landed 済のため恒久免除) |
| PLAN-L7-215-model-effort-advisor-routing | confirmed (landed 済のため恒久免除) |
| PLAN-L7-221-github-ci-policy-gate | confirmed (landed 済のため恒久免除) |

## draft debt (38 本、着手時昇格)

| plan_id | 処置 (disposition) |
|---|---|
| PLAN-L7-232-sync-pack-clean-tree-guard | 未着手 (open) |
| PLAN-L7-233-personal-path-guard-generalization | 未着手 (open) |
| PLAN-L7-234-pack-test-skip-guards | 未着手 (open) |
| PLAN-L7-235-pack-windows-ci-job | 未着手 (open) |
| PLAN-L7-237-research-drive-hardening | 未着手 (open) |
| PLAN-L7-238-retrofit-preflight-doc-command | 昇格済 promoted (2026-07-02) |
| PLAN-L7-239-contract-enforcement-wiring | 未着手 (open) |
| PLAN-L7-240-reverse-right-arm-exit-gate | 未着手 (open) |
| PLAN-L7-241-human-signoff-evidence-gate | 未着手 (open) |
| PLAN-L7-242-mode-exit-enforcement-batch | 未着手 (open) |
| PLAN-L7-243-mode-first-class-db-projection | 昇格済 promoted (2026-07-02) |
| PLAN-L7-244-right-arm-citation-gate | 未着手 (open) |
| PLAN-L7-245-sub-doc-schema-integrity | 未着手 (open) |
| PLAN-L7-246-feedback-event-lifecycle | 未着手 (open) |
| PLAN-L7-247-db-driven-diagram-generation | 未着手 (open) |
| PLAN-L7-249-operational-checklist-output | 未着手 (open) |
| PLAN-L7-250-layer-question-catalog | 未着手 (open) |
| PLAN-L7-251-observation-next-selector | 未着手 (open) |
| PLAN-L7-253-orchestrator-model-identity-advisor-triggers | 昇格済 promoted (2026-07-03) |
| PLAN-L7-254-judgment-gate-reviewer-tier-matrix | 未着手 (open) |
| PLAN-L7-255-delegation-model-effort-injection | 昇格済 promoted (2026-07-03) |
| PLAN-L7-257-orchestration-cell-roster | 未着手 (open) |
| PLAN-L7-258-guard-firing-evidence | 未着手 (open) |
| PLAN-L7-259-hybrid-git-discipline-guards | 未着手 (open) |
| PLAN-L7-260-sensitive-scan-boundary | 未着手 (open) |
| PLAN-L7-261-escalation-boundary-detector | 未着手 (open) |
| PLAN-L7-262-skill-telemetry-provenance | 昇格済 promoted (2026-07-02) |
| PLAN-L7-269-deprecation-mode | 未着手 (open) |
| PLAN-L7-270-spec-change-cycle | 未着手 (open) |
| PLAN-L7-274-mutation-oracle-hardening | 未着手 (open) |
| PLAN-L7-275-glossary-code-consistency | 未着手 (open) |
| PLAN-L7-279-xml-residue-lint | 未着手 (open) |
| PLAN-L7-363-routine-gate-run-projection | 未着手 (open) |
| PLAN-L7-364-reverse-stage-db-obligation | 未着手 (open) |
| PLAN-L7-365-harness-db-currency-hook | 未着手 (open) |
| PLAN-L7-366-takeover-surface-warn-actionable | 未着手 (open) |
| PLAN-L7-367-refactor-candidate-lifecycle | 未着手 (open) |
| PLAN-L7-368-design-lint-db-projection | 未着手 (open) |

disposition は昇格済み時に `promoted (YYYY-MM-DD)` へ更新する (行は削除しない —
台帳同期テストの照合対象)。
