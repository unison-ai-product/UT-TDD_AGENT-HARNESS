# 受入候補の版対応

> **2026-11-13 の改訂メモ (#1005 のコメント 6822862705 / 6844628646):** 受入候補 95 件 (release 必須 yes 38 件 / no 57 件) の全行を載せ、「対応FR」を受入候補に揃えた。「release 必須」は受入候補の列、「新しい版」は README の「版のはしご」で、その受入が受ける要求の段のうち最も遅い段 (全要求が 1.0.0 の対象外なら「対象外」) である。「一式受入目標 (旧版)」は版 2.0 の割当のまま残す。表は `node docs/governance/candidates/v4-ledger-check.mjs` が受入候補・要件候補・README と突き合わせる。

**2026-10-08 の注記 (2026-11-13 に改訂):** 「一式受入目標 (旧版)」は旧候補 72 AC の割当です。旧版の割当と新しい版が食い違うときは、「新しい版」の列を使います。

生成元：生成元は無い。2026-11-13 に要件候補・受入候補・README の版のはしごから作り直した表で、再生成の仕組みは UTV4-FR-080 の範囲 (退役した旧 data/requirement_trace.json は `docs/archive/v4-roadmap-pre-20261113/data/` にある)。各候補をtest-designへ降下して実行する計画。すべて未実行であり、表の行があることをテスト通過と数えない。

| AC | 対応FR | 一式受入目標 (旧版) | release 必須 | 新しい版 | 状態 |
|---|---|---|---|---|---|
| UTV4-AC-001 | UTV4-FR-001 | R05 | yes | 0.3.0 | 未実行 |
| UTV4-AC-002 | UTV4-FR-002 | R05 | no | 0.3.0 | 未実行 |
| UTV4-AC-003 | UTV4-FR-002 | R05 | yes | 0.3.0 | 未実行 |
| UTV4-AC-004 | UTV4-FR-003 | R05 | no | 0.3.0 | 未実行 |
| UTV4-AC-005 | UTV4-FR-003 | R05 | no | 0.3.0 | 未実行 |
| UTV4-AC-006 | UTV4-FR-004 | R05 | no | 0.3.0 | 未実行 |
| UTV4-AC-007 | UTV4-FR-005 | R05 | no | 0.3.0 | 未実行 |
| UTV4-AC-008 | UTV4-FR-005 | R05 | no | 0.3.0 | 未実行 |
| UTV4-AC-009 | UTV4-FR-005 | R05 | ― | 廃止 | 廃止 (受入候補に行が無い) |
| UTV4-AC-010 | UTV4-FR-005 | R05 | yes | 0.3.0 | 未実行 |
| UTV4-AC-011 | UTV4-FR-006 | R03 | yes | 0.3.0 | 未実行 |
| UTV4-AC-012 | UTV4-FR-006 | R03 | yes | 0.3.0 | 未実行 |
| UTV4-AC-013 | UTV4-FR-007 (撤回) | R07 | no | 対象外 | 未実行 |
| UTV4-AC-014 | UTV4-FR-008 | R04 | no | 1.0.0 | 未実行 |
| UTV4-AC-015 | UTV4-FR-008 | R04 | no | 1.0.0 | 未実行 |
| UTV4-AC-016 | UTV4-FR-009 (先送り) | R04 | no | 対象外 | 未実行 |
| UTV4-AC-017 | UTV4-FR-009 (先送り) | R04 | no | 対象外 | 未実行 |
| UTV4-AC-018 | UTV4-FR-010 | R09 | no | 0.5.0 | 未実行 |
| UTV4-AC-019 | UTV4-FR-010 | R09 | no | 0.5.0 | 未実行 |
| UTV4-AC-020 | UTV4-FR-011 (先送り) | R09 | no | 対象外 | 未実行 |
| UTV4-AC-021 | UTV4-FR-012 (先送り) | R05 | no | 対象外 | 未実行 |
| UTV4-AC-022 | UTV4-FR-013, UTV4-FR-023 | R08 | yes | 0.4.0 | 未実行 |
| UTV4-AC-023 | UTV4-FR-014 | R00 | yes | 0.3.0 | 未実行 |
| UTV4-AC-024 | UTV4-FR-015 | R07 | no | 0.5.0 | 未実行 |
| UTV4-AC-025 | UTV4-FR-016 (撤回) | R07 | no | 対象外 | 未実行 |
| UTV4-AC-026 | UTV4-FR-017 | R07 | no | 0.5.0 | 未実行 |
| UTV4-AC-027 | UTV4-FR-018 | R07 | yes | 0.5.0 | 未実行 |
| UTV4-AC-028 | UTV4-FR-019 | R09 | yes | 0.4.0 | 未実行 |
| UTV4-AC-029 | UTV4-FR-020 (撤回) | R09 | no | 対象外 | 未実行 |
| UTV4-AC-030 | UTV4-FR-021 (撤回) | R09 | no | 対象外 | 未実行 |
| UTV4-AC-031 | UTV4-FR-022 (撤回) | R09 | no | 対象外 | 未実行 |
| UTV4-AC-032 | UTV4-FR-023 | R08 | yes | 0.4.0 | 未実行 |
| UTV4-AC-033 | UTV4-FR-023 | R08 | yes | 0.4.0 | 未実行 |
| UTV4-AC-034 | UTV4-FR-023, UTV4-FR-024 (先送り) | R08 | yes | 0.4.0 | 未実行 |
| UTV4-AC-035 | UTV4-FR-025 | R09 | no | 0.5.0 | 未実行 |
| UTV4-AC-036 | UTV4-FR-026 | R09 | yes | 0.5.0 | 未実行 |
| UTV4-AC-037 | UTV4-FR-027 | R05 | yes | 0.3.0 | 未実行 |
| UTV4-AC-038 | UTV4-FR-004 | R05 | yes | 0.3.0 | 未実行 |
| UTV4-AC-039 | UTV4-FR-028 (先送り) | R07 | no | 対象外 | 未実行 |
| UTV4-AC-040 | UTV4-FR-029 | R07 | yes | 0.3.0 | 未実行 |
| UTV4-AC-041 | UTV4-FR-030 (撤回) | R05 | no | 対象外 | 未実行 |
| UTV4-AC-042 | UTV4-FR-031 | R05 | no | 0.5.0 | 未実行 |
| UTV4-AC-043 | UTV4-FR-032 | R05 | yes | 0.3.0 | 未実行 |
| UTV4-AC-044 | UTV4-FR-033 | R05 | no | 0.5.0 | 未実行 |
| UTV4-AC-045 | UTV4-FR-034 | R05 | yes | 0.3.0 | 未実行 |
| UTV4-AC-046 | UTV4-FR-035 | R07 | yes | 0.3.0 | 未実行 |
| UTV4-AC-047 | UTV4-FR-036 (撤回) | R05 | no | 対象外 | 未実行 |
| UTV4-AC-048 | UTV4-FR-008 | R04 | no | 1.0.0 | 未実行 |
| UTV4-AC-049 | UTV4-FR-037 | R05 | yes | 0.4.0 | 未実行 |
| UTV4-AC-050 | UTV4-FR-038 (先送り) | R09 | no | 対象外 | 未実行 |
| UTV4-AC-051 | UTV4-FR-039 (先送り) | R07 | no | 対象外 | 未実行 |
| UTV4-AC-052 | UTV4-FR-040 (先送り) | R09 | no | 対象外 | 未実行 |
| UTV4-AC-053 | UTV4-FR-041 (撤回) | R03 | no | 対象外 | 未実行 |
| UTV4-AC-054 | UTV4-FR-042 (先送り) | R09 | no | 対象外 | 未実行 |
| UTV4-AC-055 | UTV4-FR-043 (先送り) | R09 | no | 対象外 | 未実行 |
| UTV4-AC-056 | UTV4-FR-044 | R09 | yes | 0.5.0 | 未実行 |
| UTV4-AC-057 | UTV4-FR-045 (先送り) | R09 | no | 対象外 | 未実行 |
| UTV4-AC-058 | UTV4-FR-046 (先送り) | R07 | no | 対象外 | 未実行 |
| UTV4-AC-059 | UTV4-FR-047 (撤回) | R04 | no | 対象外 | 未実行 |
| UTV4-AC-060 | UTV4-FR-048 | R07 | yes | 0.4.0 | 未実行 |
| UTV4-AC-061 | UTV4-FR-049 | R08 | no | 0.4.0 | 未実行 |
| UTV4-AC-062 | UTV4-FR-050 | R08 | yes | 0.4.0 | 未実行 |
| UTV4-AC-063 | UTV4-FR-051 | R08 | yes | 0.4.0 | 未実行 |
| UTV4-AC-064 | UTV4-FR-052 | R05 | no | 0.3.0 | 未実行 |
| UTV4-AC-065 | UTV4-FR-053 (先送り) | R09 | no | 対象外 | 未実行 |
| UTV4-AC-066 | UTV4-FR-054 | R05 | yes | 0.3.0 | 未実行 |
| UTV4-AC-067 | UTV4-FR-055 | R05 | yes | 0.4.0 | 未実行 |
| UTV4-AC-068 | UTV4-FR-056 (先送り) | R07 | no | 対象外 | 未実行 |
| UTV4-AC-069 | UTV4-FR-057 (先送り) | R07 | no | 対象外 | 未実行 |
| UTV4-AC-070 | UTV4-FR-056 (先送り) | R07 | no | 対象外 | 未実行 |
| UTV4-AC-071 | UTV4-FR-058 | R07 | yes | 0.5.0 | 未実行 |
| UTV4-AC-072 | UTV4-FR-059 (先送り) | R07 | no | 対象外 | 未実行 |
| UTV4-AC-073 | UTV4-FR-060 (撤回) | ― | no | 対象外 | 未実行 |
| UTV4-AC-074 | UTV4-FR-061 (撤回) | ― | no | 対象外 | 未実行 |
| UTV4-AC-075 | UTV4-FR-062 (撤回) | ― | no | 対象外 | 未実行 |
| UTV4-AC-076 | UTV4-FR-063 (先送り) | ― | no | 対象外 | 未実行 |
| UTV4-AC-077 | UTV4-FR-064 | ― | yes | 0.5.0 | 未実行 |
| UTV4-AC-078 | UTV4-FR-065 | ― | yes | 0.5.0 | 未実行 |
| UTV4-AC-079 | UTV4-FR-066 (先送り) | ― | no | 対象外 | 未実行 |
| UTV4-AC-080 | UTV4-FR-067 | ― | yes | 0.5.0 | 未実行 |
| UTV4-AC-081 | UTV4-FR-068 (撤回) | ― | no | 対象外 | 未実行 |
| UTV4-AC-082 | UTV4-FR-069 (先送り) | ― | no | 対象外 | 未実行 |
| UTV4-AC-083 | UTV4-FR-070 (先送り) | ― | no | 対象外 | 未実行 |
| UTV4-AC-084 | UTV4-FR-071 | ― | yes | 0.3.0 | 未実行 |
| UTV4-AC-085 | UTV4-FR-072 (先送り) | ― | no | 対象外 | 未実行 |
| UTV4-AC-086 | UTV4-FR-073 (撤回) | ― | no | 対象外 | 未実行 |
| UTV4-AC-087 | UTV4-FR-074 | ― | yes | 0.4.0 | 未実行 |
| UTV4-AC-088 | UTV4-FR-075 | ― | yes | 0.3.0 | 未実行 |
| UTV4-AC-089 | UTV4-FR-076 (撤回) | ― | no | 対象外 | 未実行 |
| UTV4-AC-090 | UTV4-FR-006, UTV4-FR-007 (撤回), UTV4-FR-013 | ― | no | 0.4.0 | 未実行 |
| UTV4-AC-091 | UTV4-FR-019 | ― | yes | 0.4.0 | 未実行 |
| UTV4-AC-092 | UTV4-FR-077 | ― | yes | 0.4.0 | 未実行 |
| UTV4-AC-093 | UTV4-FR-077, UTV4-FR-078 | ― | yes | 0.4.0 | 未実行 |
| UTV4-AC-094 | UTV4-FR-078 | ― | yes | 0.4.0 | 未実行 |
| UTV4-AC-095 | UTV4-FR-079 | ― | yes | 0.3.0 | 未実行 |
| UTV4-AC-096 | UTV4-FR-080 | ― | no | 0.3.0 | 未実行 |

元の刺激/oracleはPR #517の固定HEADの候補を参照。追加要求は退役した旧 ADDITIONS (`docs/archive/v4-roadmap-pre-20261113/trace/ADDITIONS.md`) と各workstream。sourceへの参照は[出典](../SOURCES.md)。
