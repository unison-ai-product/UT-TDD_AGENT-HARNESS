---
memory_id: memory:feedback:pr-315-ci-evidence-digest-remediation-exact-head-52be26f2
kind: feedback
title: "PR #315 CI evidence digest remediation exact HEAD 52be26f2"
tags: ["ci-remediation", "claude-review", "exact-head", "issue-248", "pr-315"]
updated_at: 2026-08-14T04:12:24.763Z
---

PR #315 new exact HEAD 52be26f25e23f9d77c957437a6ad9164ee3a458c。run 31768850892 Linux failureはdoctor green-command-digestが、test追加後もPLAN-L7-486のevidence_path hashと28件主張を旧値のまま検出したため。PLAN evidenceを30/30とSHA256 c8b1e9c6335b5343354a2e990805f8a2e92467291a8c96d5cd534fe85182adf4へ同期しpush済み。source/testは2988fc3bから不変。exact HEAD snapshot 30/30 green、tsc green、plan lint checked=872 green、diff-check clean。Biomeはdocs PLANが設定上ignoredでsource/testは直前exactでgreen。new CIとdelta reviewをこのHEADへ束縛し、PASSかつCI greenならClaudeがmerge対応すること。
