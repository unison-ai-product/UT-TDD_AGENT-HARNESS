/**
 * #145 で解消する既存の PLAN identity 衝突。
 *
 * key は namespace + 数値化した ordinal。値は main で既知の plan_id 集合を完全一致で固定する。
 * key だけの allowlist ではないため、既存座標への3件目追加や slug 差し替えも fail-close する。
 */
export const LEGACY_PLAN_ID_COLLISION_DEBT: Readonly<Record<string, readonly string[]>> = {
  "L6:70": [
    "PLAN-L6-70-source-catalog-profile-resolver-contracts",
    "PLAN-L6-70-vmodel-judgement-skill-pack",
  ],
  "L7:168": ["PLAN-L7-168-g8-integration-workflow", "PLAN-L7-168-verification-profile-type-split"],
  "L7:169": [
    "PLAN-L7-169-g8-integration-evidence-manifest",
    "PLAN-L7-169-relation-graph-type-split",
  ],
  "L7:170": [
    "PLAN-L7-170-external-review-remediation",
    "PLAN-L7-170-g8-evidence-graph-node",
    "PLAN-L7-170-plan-lint-type-policy-split",
  ],
  "L7:171": [
    "PLAN-L7-171-g8-adapter-asset-evidence",
    "PLAN-L7-171-workflow-contracts-type-cleanup",
  ],
  "L7:172": ["PLAN-L7-172-harness-db-catalog-section-split", "PLAN-L7-172-roster-cli-g8-evidence"],
  "L7:173": ["PLAN-L7-173-handover-type-constant-split", "PLAN-L7-173-roster-boundary-g8-evidence"],
  "L7:174": [
    "PLAN-L7-174-green-command-digest-correction",
    "PLAN-L7-174-skill-catalog-g8-evidence",
  ],
  "L7:246": [
    "PLAN-L7-246-doctor-result-aggregation-extraction",
    "PLAN-L7-246-feedback-event-lifecycle",
  ],
  "L7:250": [
    "PLAN-L7-250-doctor-dependency-regression-extraction",
    "PLAN-L7-250-layer-question-catalog",
  ],
  "L7:258": ["PLAN-L7-258-github-branch-ref-normalization", "PLAN-L7-258-guard-firing-evidence"],
  "L7:259": [
    "PLAN-L7-259-hybrid-git-discipline-guards",
    "PLAN-L7-259-pack-github-ci-profile-loader",
  ],
  "L7:325": ["PLAN-L7-325-doctor-lint-gate-extraction", "PLAN-L7-325-goal-workflow-binding"],
  "L7:395": ["PLAN-L7-395-byte-integrity-readability-guard", "PLAN-L7-395-gate-id-format-lint"],
  "L7:397": [
    "PLAN-L7-397-relation-graph-docs-root-ledger-coverage",
    "PLAN-L7-397-right-lung-doc-governance",
  ],
  "L7:398": [
    "PLAN-L7-398-scope-detection-dry-run-preview",
    "PLAN-L7-398-session-log-summarize-path-truncation",
  ],
  "L7:417": [
    "PLAN-L7-417-skill-decision-points-retrofit",
    "PLAN-L7-417-source-disposition-profile-projection",
  ],
  "L7:419": [
    "PLAN-L7-419-forward-fsm-transition-workflow-cli",
    "PLAN-L7-419-hook-failopen-hardening",
  ],
  "L7:420": [
    "PLAN-L7-420-ci-strict-evidence-gates",
    "PLAN-L7-420-vmodel-contract-compiler-registry",
  ],
  "L7:421": [
    "PLAN-L7-421-generic-right-arm-doctor-gate",
    "PLAN-L7-421-test-hygiene-live-tree-fence",
  ],
  "L7:423": [
    "PLAN-L7-423-engine-swap-domain-objects-ports",
    "PLAN-L7-423-gate-minor-hardening-batch",
  ],
  "L7:424": ["PLAN-L7-424-git-hooks-ownership", "PLAN-L7-424-semantic-assessment-debt-router"],
  "L7:425": ["PLAN-L7-425-independent-detector-meta-verifier", "PLAN-L7-425-setup-standardization"],
  "REVERSE:12": ["PLAN-REVERSE-12-review-evidence", "PLAN-REVERSE-12-self-pair-normalization"],
  "REVERSE:395": [
    "PLAN-REVERSE-395-cli-command-design-backfill",
    "PLAN-REVERSE-395-gate-id-format-lint-backfill",
  ],
  "REVERSE:396": [
    "PLAN-REVERSE-396-encoding-byte-integrity-backfill",
    "PLAN-REVERSE-396-verify-gate-binding-backfill",
  ],
};
