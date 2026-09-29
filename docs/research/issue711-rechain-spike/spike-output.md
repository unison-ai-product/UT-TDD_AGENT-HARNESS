# spike-repro output

- target: 895ac2e93c1a820e8a5c736bf8787e4f15823e06
- primitives: C:/dev/ut-711-spike3 @ 60099e554b5b66d973bd94e28955c9e81bcf1af5
- hints: 131 entries (120 command_id)
- extra refs: origin/archive/pr529-c5dce6c1-before-subject-repair=c5dce6c13ed6f9d697bba4aced87e13e746f7fb1

| 区分 | 件数 |
| --- | --- |
| projection records | 340 |
| T0 導入 commit が複数 (ambiguous) | 3 |
| T0 導入 commit 不明 | 23 |
| Tier 1 対象 | 314 |
| Tier 1 content_digest 一致 | 314 / 314 |
| advisor 字義式 (receipt 込み) = stripped | 0 / 314 |
| T1-admission-unrecovered | 138 |
| T1-base-record-not-in-projection | 7 |
| T1-legacy-bootstrap | 27 |
| T1-rev1-draft | 26 |
| **Tier 2 対象** | **116** |
| **Tier 2 再導出成功** | **103 / 116** |
| T2-rederived-first-parent | 84 |
| T2-rederived-rewritten-history | 19 |
| T2-undecided-hint-unobtainable | 13 |
| 再導出成功のうち via=hint / via=dictionary | 68 / 35 |
| 再導出成功のうち base=stripped / literal / other | 95 / 0 / 8 |

## Tier 2 の非 first-parent / undecided 行

| seq | plan_id | rev | cls | via | actor | sc | hints | diag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | PLAN-RECOVERY-16-plan-revision-authoring | 2 | T2-undecided-hint-unobtainable | - | - | - | 0 |  |
| 75 | PLAN-L6-89-layer-verification-contract | 2 | T2-undecided-hint-unobtainable | - | - | - | 0 |  |
| 78 | PLAN-L6-90-ci-responsibility-contract | 2 | T2-undecided-hint-unobtainable | - | - | - | 0 |  |
| 143 | PLAN-L7-471-github-forward-foundation | 2 | T2-rederived-rewritten-history | hint | codex | 9b3e5e48be (present-unreachable) | 1 |  |
| 144 | PLAN-L7-471-github-forward-foundation | 3 | T2-rederived-rewritten-history | hint | codex | d9293911f9 (present-unreachable) | 1 |  |
| 172 | PLAN-L7-512-project-scoped-memory-root | 3 | T2-rederived-rewritten-history | dictionary | codex-root | 0bd363b39c (present-unreachable) | 0 |  |
| 173 | PLAN-REVERSE-512-project-scoped-memory-root-backfill | 3 | T2-rederived-rewritten-history | dictionary | codex-root | 0bd363b39c (present-unreachable) | 0 |  |
| 174 | PLAN-L7-512-project-scoped-memory-root | 4 | T2-undecided-hint-unobtainable | - | - | - | 0 |  |
| 175 | PLAN-REVERSE-512-project-scoped-memory-root-backfill | 4 | T2-undecided-hint-unobtainable | - | - | - | 0 |  |
| 194 | PLAN-L7-532-pack-publication-driver | 2 | T2-rederived-rewritten-history | hint | claude-fable-5 | f694a38100 (absent-from-odb) | 1 |  |
| 195 | PLAN-REVERSE-532-pack-publication-driver-backfill | 2 | T2-rederived-rewritten-history | hint | claude-fable-5 | f694a38100 (absent-from-odb) | 1 |  |
| 196 | PLAN-L7-532-pack-publication-driver | 3 | T2-rederived-rewritten-history | hint | claude-fable-5 | a5e1da1463 (absent-from-odb) | 1 |  |
| 197 | PLAN-REVERSE-532-pack-publication-driver-backfill | 3 | T2-rederived-rewritten-history | hint | claude-fable-5 | a5e1da1463 (absent-from-odb) | 1 |  |
| 216 | PLAN-L7-534-d3b-provider-evidence-composition | 2 | T2-rederived-rewritten-history | hint | claude-fable-5 | a301103641 (absent-from-odb) | 1 |  |
| 217 | PLAN-L7-534-d3b-provider-evidence-composition | 3 | T2-rederived-rewritten-history | hint | claude-fable-5 | 9f66d247e3 (absent-from-odb) | 1 |  |
| 218 | PLAN-L7-534-d3b-provider-evidence-composition | 4 | T2-rederived-rewritten-history | hint | claude-fable-5 | d4d0c34e5f (absent-from-odb) | 1 |  |
| 219 | PLAN-REVERSE-534-d3b-provider-evidence-composition-backfill | 2 | T2-rederived-rewritten-history | hint | claude-fable-5 | d4d0c34e5f (absent-from-odb) | 1 |  |
| 220 | PLAN-L7-534-d3b-provider-evidence-composition | 5 | T2-rederived-rewritten-history | hint | claude-fable-5 | 035708b6d8 (absent-from-odb) | 1 |  |
| 221 | PLAN-REVERSE-534-d3b-provider-evidence-composition-backfill | 3 | T2-rederived-rewritten-history | hint | claude-fable-5 | 035708b6d8 (absent-from-odb) | 1 |  |
| 222 | PLAN-L7-534-d3b-provider-evidence-composition | 6 | T2-rederived-rewritten-history | hint | claude-fable-5 | e3023aa522 (absent-from-odb) | 1 |  |
| 223 | PLAN-REVERSE-534-d3b-provider-evidence-composition-backfill | 4 | T2-rederived-rewritten-history | hint | claude-fable-5 | e3023aa522 (absent-from-odb) | 1 |  |
| 224 | PLAN-L7-534-d3b-provider-evidence-composition | 7 | T2-rederived-rewritten-history | hint | claude-fable-5 | dc8cb30338 (absent-from-odb) | 1 |  |
| 225 | PLAN-REVERSE-534-d3b-provider-evidence-composition-backfill | 5 | T2-rederived-rewritten-history | hint | claude-fable-5 | dc8cb30338 (absent-from-odb) | 1 |  |
| 226 | PLAN-REVERSE-534-d3b-provider-evidence-composition-backfill | 6 | T2-rederived-rewritten-history | hint | claude-fable-5 | 95abc07d26 (absent-from-odb) | 1 |  |
| 257 | PLAN-L6-93-node-bootstrap-contract | 31 | T2-undecided-hint-unobtainable | - | - | - | 0 |  |
| 280 | PLAN-L7-627-pack-publication-admitted-publish | 2 | T2-undecided-hint-unobtainable | - | - | - | 0 |  |
| 281 | PLAN-REVERSE-627-pack-publication-admitted-publish-backfill | 2 | T2-undecided-hint-unobtainable | - | - | - | 0 |  |
| 288 | PLAN-L7-530-bun-final-retirement | 14 | T2-undecided-hint-unobtainable | - | - | - | 0 |  |
| 295 | PLAN-L7-628-pack-consumer-runtime-release-install | 2 | T2-undecided-hint-unobtainable | - | - | - | 0 |  |
| 305 | PLAN-L7-626-pack-publication-admission-binding | 15 | T2-undecided-hint-unobtainable | - | - | - | 0 |  |
| 308 | PLAN-L7-676-release-consumer-dev-start | 2 | T2-undecided-hint-unobtainable | - | - | - | 0 |  |
| 323 | PLAN-L7-676-release-consumer-dev-start | 10 | T2-undecided-hint-unobtainable | - | - | - | 0 |  |
