---
memory_id: memory:feedback:pr-336-re-review-at-ba26a580-audit-sink-outside-fence-exemption-same-model-retry-unauthorized-gitignore-is-not-fence-exemption
kind: feedback
title: "PR 336 re-review at ba26a580: audit sink outside fence exemption, same-model retry unauthorized, gitignore is not fence exemption"
tags: ["d3a", "design-freeze", "pr-336", "review", "test-fence", "verdict-custody"]
updated_at: 2026-08-19T01:10:36.799Z
---

PR #336 (PLAN-L7-493 D3a repo-local verdict custody freeze) exact HEAD ba26a5807bcfd5a9d3e5b312861d8638f2290bb0 に対する Claude non-author closing review: FLAG (blocking 2 / advisory 4)。CI は exact HEAD で 3 job 全 pass (run 32135638142)。

解消: 前回 B-4 (model escalation retry deadlock) は attempts/<attempt>/verdict.txt 分離 + consumer 採番 + envelope 必須 field 化で解消。前回 A-2 (verdicts が review-guard fence 外) は §3.4 の regex 拡張契約で解消。前回 A-1 (.gitkeep/ignore) は §3.1 の check-ignore regression 必須化で freeze 粒度として充足。ba26a580 の family 不変条項は authorFamily が request identity digest 構成要素であるため digest から導け整合。

blocking B-1 = 新設の superseded_attempt append 先 .ut-tdd/audit/review-custody.jsonl が fence 除外契約の外。§3.4 の除外は verdicts 配下 descendant のみ。実測: captureWorkspaceInventory は root 直下 .git / node_modules だけ除外して全ファイルを content hash し、volatileRuntimeFiles は harness.db 4 件のみ、assertGitWorkspaceUnchanged は inventoryDigest を含む fingerprint 全体を比較する。.ut-tdd/audit/*.jsonl は gitignored (.gitignore:13) だが inventory には出るため gitignore は fence 通過の根拠にならない。U-RVATT-034/035/036 (特に「実repo E2E」) を起動元 worktree で走らせると消してはならない audit 行が残り真の残留として fence trip する。freeze で root 選択 (fixture/temp clone/起動元) と audit sink の扱いを決める必要がある。

blocking B-2 = 同一 model 再試行の書き込み先が契約上不在。許可文は「provider/model/effort が異なる再試行」にしか掛からず、attempt-1 は不変。crash / 空出力 / stall 後 terminate の同一 model 再試行が未許可となり B-4 と同型の残余。次 attempt への再試行を理由を問わず許可する 1 行で閉じる。

advisory: (A-1) 利用上限による同族 fallback (intra_runtime_subagent) に custody path が無く上限中は merge が塞がる帰結を freeze に明記。(A-2) superseded_attempt の「旧 attempt の digest」は verdict 不在が典型なので欠落時の値を決める。(A-3) <attempt> が path segment attempt-1 と integer 1 の 2 つの字面を兼ねており対応規則が未定義。(A-4) §3.1 の「tracked の requests/ receipts/」は実測と不一致 — git ls-files .ut-tdd/review は *.md 6 件のみ、git status は ?? .ut-tdd/review/requests/、receipts は空。check-ignore regression の assertion を「untracked かつ ignored でない」へ直す必要がある。

教訓: gitignore してあることは test workspace fence 通過の根拠にならない。fence の inventory は .git / node_modules 以外の全ファイルを hash するため、監査 sink など「消さない」設計の書き込み先は fence 除外契約と対で凍結する。
