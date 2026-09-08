# 元PR #517の要件別・版対応

生成元：data/requirement_trace.json。**59要件の計画上の割当**であり、実装coverage/完成率ではない。開始は共通型/前提を先に整える版、一式受入は要件全体の機械動作を閉じる目標版。元BR/FR/ACは改番しない。

| FR / 要約 | BR | AC | 先行 → 一式 | 補足 |
|---|---|---|---|---|
| UTV4-FR-001 人間authorityの分離 | UTV4-BR-001 | UTV4-AC-001 | R01 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-002 層別human-on-the-loop | UTV4-BR-002 | UTV4-AC-002, UTV4-AC-003 | R01 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-003 exactly-one owner | UTV4-BR-003 | UTV4-AC-004, UTV4-AC-005 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-004 共通work item | UTV4-BR-003 | UTV4-AC-006, UTV4-AC-038 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-005 leaseと衝突防止 | UTV4-BR-004 | UTV4-AC-007, UTV4-AC-008, UTV4-AC-009, UTV4-AC-010 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-006 artifact別正本 | UTV4-BR-005 | UTV4-AC-011, UTV4-AC-012 | R01 → R03 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-007 PLAN frontmatter段階移行 | UTV4-BR-005 | UTV4-AC-013 | R01 → R07 | R03はadapter/移行契約、R05は対象active PLANの段階切替、R07で対象scopeの移行受入。全履歴変換は非目標。 |
| UTV4-FR-008 生成view・スプシ同期 | UTV4-BR-006 | UTV4-AC-014, UTV4-AC-015, UTV4-AC-048 | R03 → R04 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-009 admission経由の書戻し | UTV4-BR-006 | UTV4-AC-016, UTV4-AC-017 | R03 → R04 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-010 改善候補と正規還流 | UTV4-BR-007 | UTV4-AC-018, UTV4-AC-019 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-011 人間向け改善digest | UTV4-BR-007 | UTV4-AC-020 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-012 事実からの進捗 | UTV4-BR-008 | UTV4-AC-021 | R03 → R05 | R04に現行PR/CI/receipt view、R05でticket/wait/actual graphへ拡張。 |
| UTV4-FR-013 独立reviewとexact identity | UTV4-BR-013 | UTV4-AC-022 | R03 → R08 | 現行独立性は全版で維持。新profile条件を含む要件全体はR08。 |
| UTV4-FR-014 current/legacy分離 | UTV4-BR-014 | UTV4-AC-023 | R00 → R00 | 現行M0のBun/current境界を成立。以降のschema/role更新にも同じ原則を継承。 |
| UTV4-FR-015 要求intake | UTV4-BR-009 | UTV4-AC-024 | R03 → R07 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-016 discoveryからIR compile | UTV4-BR-009 | UTV4-AC-025 | R03 → R07 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-017 PoC別axisとS4 | UTV4-BR-010 | UTV4-AC-026 | R03 → R07 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-018 prototype反応とproduction昇格 | UTV4-BR-010 | UTV4-AC-027 | R03 → R07 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-019 Memory retirement | UTV4-BR-011 | UTV4-AC-028 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-020 学習資産ownerと失効 | UTV4-BR-011 | UTV4-AC-029 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-021 skill applicability registry | UTV4-BR-012 | UTV4-AC-030 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-022 最小packet・telemetry・昇格 | UTV4-BR-012 | UTV4-AC-031 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-023 provider topology | UTV4-BR-013 | UTV4-AC-032, UTV4-AC-033 | R03 → R08 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-024 single-provider補償統制 | UTV4-BR-013 | UTV4-AC-034 | R03 → R08 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-025 surface分類と退役 | UTV4-BR-014 | UTV4-AC-035 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-026 legacy inventory・schema退役 | UTV4-BR-014 | UTV4-AC-036 | R01 → R09 | BunはR00、更新/記録inventoryはR02/R03、他surfaceの原子的退役はR09。 |
| UTV4-FR-027 receipt custody・GC・projection | UTV4-BR-014, UTV4-BR-004 | UTV4-AC-037 | R03 → R05 | M0/R02の必要な既知事故修理は先行。新共通custody/GC全体はR05。 |
| UTV4-FR-028 上流PoC/proto ticket | UTV4-BR-010, UTV4-BR-003 | UTV4-AC-039 | R03 → R07 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-029 層別owner | UTV4-BR-015 | UTV4-AC-040 | R01 → R07 | 管理定義はR01、機械強制はR03/R05、全上流owner適用はR07。 |
| UTV4-FR-030 統合ticketとtakeover | UTV4-BR-016, UTV4-BR-004 | UTV4-AC-041 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-031 差戻し回数と上流回帰 | UTV4-BR-016 | UTV4-AC-042 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-032 rebase/exact-head merge | UTV4-BR-016, UTV4-BR-004 | UTV4-AC-043 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-033 人数不変性 | UTV4-BR-017 | UTV4-AC-044 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-034 人間統括/WIP判断 | UTV4-BR-008, UTV4-BR-015 | UTV4-AC-045 | R01 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-035 ticket compiler | UTV4-BR-017, UTV4-BR-003 | UTV4-AC-046 | R03 → R07 | R05で確定済みL4行列→下流、R07でL2/検証発行まで全入口を受入。 |
| UTV4-FR-036 大中小原子の階層 | UTV4-BR-003, UTV4-BR-017 | UTV4-AC-047 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-037 stop-the-line incident | UTV4-BR-018 | UTV4-AC-049 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-038 project改善intake/export | UTV4-BR-019 | UTV4-AC-050 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-039 L3/L5製本 | UTV4-BR-020 | UTV4-AC-051 | R03 → R07 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-040 実録provenanceのskill | UTV4-BR-021 | UTV4-AC-052 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-041 judgement record | UTV4-BR-023 | UTV4-AC-053 | R03 → R03 | judgement型と新判定のwriterをR03で受入。過去判定の捏造backfill禁止。 |
| UTV4-FR-042 calibrationと機械判断化 | UTV4-BR-023 | UTV4-AC-054 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-043 cost/tier降格 | UTV4-BR-022 | UTV4-AC-055 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-044 良否と選好の分離 | UTV4-BR-024 | UTV4-AC-056 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-045 判断/学習の人間view | UTV4-BR-025 | UTV4-AC-057 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-046 依存/画面/ER図の生成 | UTV4-BR-026 | UTV4-AC-058 | R03 → R07 | R04で既存typed sourceとER/依存view、R05でticket図、R07でproto/上流の全入力を接続。 |
| UTV4-FR-047 discrepancyとdiagram drift | UTV4-BR-026 | UTV4-AC-059 | R03 → R04 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-048 backflow集約と再compile | UTV4-BR-027 | UTV4-AC-060 | R03 → R07 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-049 論理role/native生成 | UTV4-BR-028 | UTV4-AC-061 | R03 → R08 | 最小のlogical role契約はR03/R05から使用、native生成の全切替はR08。 |
| UTV4-FR-050 Control Plane dispatch | UTV4-BR-028 | UTV4-AC-062 | R03 → R08 | R05は既存adapterに安全dispatch、R08で全profile/nativeへ展開。 |
| UTV4-FR-051 blind review偏見対策 | UTV4-BR-013, UTV4-BR-014 | UTV4-AC-063 | R03 → R08 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-052 階層refactor責務 | UTV4-BR-029 | UTV4-AC-064 | R03 → R05 | R05で中の検査/必要なrefactor発行。無修正で合格する判定を候補との整合審査にかける。 |
| UTV4-FR-053 refactor発火条件 | UTV4-BR-029 | UTV4-AC-065 | R03 → R09 | 構造違反判定はR05、使用実測による全surface発火はR09。 |
| UTV4-FR-054 admission ticket三者分離 | UTV4-BR-030 | UTV4-AC-066 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-055 人間reviewの傾斜 | UTV4-BR-030, UTV4-BR-003 | UTV4-AC-067 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-056 画面proto工程・深度 | UTV4-BR-031 | UTV4-AC-068, UTV4-AC-070 | R03 → R07 | R03/R04自身のUIも既存手順でprototypeし記録。汎用エンジン全体はR07。 |
| UTV4-FR-057 製本前段の必要条件 | UTV4-BR-031 | UTV4-AC-069 | R03 → R07 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-058 provisional/frozen | UTV4-BR-032 | UTV4-AC-071 | R03 → R07 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |
| UTV4-FR-059 PoC budget/超過検知 | UTV4-BR-005, UTV4-BR-032 | UTV4-AC-072 | R03 → R07 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 |

## BR32の対応
| BR | 下流FR | 一式受入の分布 |
|---|---|---|
| UTV4-BR-001 | UTV4-FR-001 | R05 |
| UTV4-BR-002 | UTV4-FR-002 | R05 |
| UTV4-BR-003 | UTV4-FR-003, UTV4-FR-004, UTV4-FR-028, UTV4-FR-035, UTV4-FR-036, UTV4-FR-055 | R05, R07 |
| UTV4-BR-004 | UTV4-FR-005, UTV4-FR-027, UTV4-FR-030, UTV4-FR-032 | R05 |
| UTV4-BR-005 | UTV4-FR-006, UTV4-FR-007, UTV4-FR-059 | R03, R07 |
| UTV4-BR-006 | UTV4-FR-008, UTV4-FR-009 | R04 |
| UTV4-BR-007 | UTV4-FR-010, UTV4-FR-011 | R09 |
| UTV4-BR-008 | UTV4-FR-012, UTV4-FR-034 | R05 |
| UTV4-BR-009 | UTV4-FR-015, UTV4-FR-016 | R07 |
| UTV4-BR-010 | UTV4-FR-017, UTV4-FR-018, UTV4-FR-028 | R07 |
| UTV4-BR-011 | UTV4-FR-019, UTV4-FR-020 | R09 |
| UTV4-BR-012 | UTV4-FR-021, UTV4-FR-022 | R09 |
| UTV4-BR-013 | UTV4-FR-013, UTV4-FR-023, UTV4-FR-024, UTV4-FR-051 | R08 |
| UTV4-BR-014 | UTV4-FR-014, UTV4-FR-025, UTV4-FR-026, UTV4-FR-027, UTV4-FR-051 | R00, R05, R08, R09 |
| UTV4-BR-015 | UTV4-FR-029, UTV4-FR-034 | R05, R07 |
| UTV4-BR-016 | UTV4-FR-030, UTV4-FR-031, UTV4-FR-032 | R05 |
| UTV4-BR-017 | UTV4-FR-033, UTV4-FR-035, UTV4-FR-036 | R05, R07 |
| UTV4-BR-018 | UTV4-FR-037 | R05 |
| UTV4-BR-019 | UTV4-FR-038 | R09 |
| UTV4-BR-020 | UTV4-FR-039 | R07 |
| UTV4-BR-021 | UTV4-FR-040 | R09 |
| UTV4-BR-022 | UTV4-FR-043 | R09 |
| UTV4-BR-023 | UTV4-FR-041, UTV4-FR-042 | R03, R09 |
| UTV4-BR-024 | UTV4-FR-044 | R09 |
| UTV4-BR-025 | UTV4-FR-045 | R09 |
| UTV4-BR-026 | UTV4-FR-046, UTV4-FR-047 | R04, R07 |
| UTV4-BR-027 | UTV4-FR-048 | R07 |
| UTV4-BR-028 | UTV4-FR-049, UTV4-FR-050 | R08 |
| UTV4-BR-029 | UTV4-FR-052, UTV4-FR-053 | R05, R09 |
| UTV4-BR-030 | UTV4-FR-054, UTV4-FR-055 | R05 |
| UTV4-BR-031 | UTV4-FR-056, UTV4-FR-057 | R07 |
| UTV4-BR-032 | UTV4-FR-058, UTV4-FR-059 | R07 |

根拠：[GH-PR517-FR/AC/BR](../SOURCES.md)。要約は読みやすさのための編集文であり、元の意味authorityを置換しない。
