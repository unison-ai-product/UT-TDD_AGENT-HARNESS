---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_gate_run_evidence_warning
pair_artifact: docs/test-design/harness/L7-gate-run-stderr-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1359
---

# gate-run 証跡保存失敗時の警告境界 (Issue #1359)

> **L6 contract marker**: `runGate(gId) => exit status` のうち、`writeGateRunEvidence` が失敗した場合の警告境界を対象とする unit-test-granularity contract である。DbC oracle の詳細 (`U-GATE-011`) は対になる L7 に置く。

## 1. 位置付け

対になる設計文書は `docs/test-design/harness/L7-gate-run-stderr-test-design.md` である。
gate の判定と証跡書込の詳細は `docs/design/harness/L6-function-design/function-spec.md` §2.2 を参照する。

## 2. 契約

gate verdict は `evaluateGateReview` + `evaluateStaticGate` の合成であり、証跡書込の失敗も verdict / exit を変えず stderr 警告にする。
