# 元PR #517の要件別・版対応

> **2026-11-13 の改訂メモ (#1005 のコメント 6822862705 / 6844628646):** 現行の要件候補 80 件 (残す 12 / 簡素化 32 / 先送り 21 / 撤回 15) の全行を載せた。BR と AC の列は要件候補・受入候補に揃え、右端に「新しい版」(README の「版のはしご」。先送り・撤回は「対象外」) と「区分」(要件候補の最初の表の行頭の印) の列を足した。「先行 → 一式 (旧版)」は版 2.0 の割当のまま残す。番号 060〜080 の行は 2026-11-13 に足した。下の「BR32の対応」は旧候補の表で、再計算していない。表は `node docs/governance/candidates/v4-ledger-check.mjs` が要件候補・README と突き合わせる。

**2026-10-08 の注記 (2026-11-13 に改訂):** 「先行 → 一式 (旧版)」は PR #517 時点の旧候補 (32 BR / 59 FR / 72 AC) の割当です。旧版の割当と新しい版が食い違うときは、「新しい版」の列を使います。

生成元：生成元は無い。2026-11-13 に要件候補・受入候補・README の版のはしごから作り直した表で、再生成の仕組みは UTV4-FR-080 の範囲 (退役した旧 data/requirement_trace.json は `docs/archive/v4-roadmap-pre-20261113/data/` にある)。**80要件の計画上の割当**であり、実装coverage/完成率ではない。開始は共通型/前提を先に整える版、一式受入は要件全体の機械動作を閉じる目標版。元BR/FR/ACは改番しない。

| FR / 要約 | BR | AC | 先行 → 一式 (旧版) | 補足 | 新しい版 | 区分 |
|---|---|---|---|---|---|---|
|---|---|---|---|---|
| UTV4-FR-001 人間authorityの分離 | UTV4-BR-001 | UTV4-AC-001 | R01 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.3.0 | 簡素化 |
| UTV4-FR-002 層別human-on-the-loop | UTV4-BR-002 | UTV4-AC-002, UTV4-AC-003 | R01 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.3.0 | 簡素化 |
| UTV4-FR-003 exactly-one owner | UTV4-BR-001, UTV4-BR-003 | UTV4-AC-004, UTV4-AC-005 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.3.0 | 残す |
| UTV4-FR-004 共通work item | UTV4-BR-003 | UTV4-AC-006, UTV4-AC-038 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.3.0 | 簡素化 |
| UTV4-FR-005 leaseと衝突防止 | UTV4-BR-004 | UTV4-AC-007, UTV4-AC-008, UTV4-AC-010 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.3.0 | 簡素化 |
| UTV4-FR-006 artifact別正本 | UTV4-BR-005 | UTV4-AC-011, UTV4-AC-012, UTV4-AC-090 | R01 → R03 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.3.0 | 簡素化 |
| UTV4-FR-007 PLAN frontmatter段階移行 | UTV4-BR-038 | UTV4-AC-013, UTV4-AC-090 | R01 → R07 | R03はadapter/移行契約、R05は対象active PLANの段階切替、R07で対象scopeの移行受入。全履歴変換は非目標。 | 対象外 | 撤回 |
| UTV4-FR-008 生成view・スプシ同期 | UTV4-BR-006 | UTV4-AC-014, UTV4-AC-015, UTV4-AC-048 | R03 → R04 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 1.0.0 | 簡素化 |
| UTV4-FR-009 admission経由の書戻し | UTV4-BR-006 | UTV4-AC-016, UTV4-AC-017 | R03 → R04 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 対象外 | 先送り |
| UTV4-FR-010 改善候補と正規還流 | UTV4-BR-007 | UTV4-AC-018, UTV4-AC-019 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.5.0 | 簡素化 |
| UTV4-FR-011 人間向け改善digest | UTV4-BR-007 | UTV4-AC-020 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 対象外 | 先送り |
| UTV4-FR-012 事実からの進捗 | UTV4-BR-008 | UTV4-AC-021 | R03 → R05 | R04に現行PR/CI/receipt view、R05でticket/wait/actual graphへ拡張。 | 対象外 | 先送り |
| UTV4-FR-013 独立reviewとexact identity | UTV4-BR-013 | UTV4-AC-022, UTV4-AC-090 | R03 → R08 | 現行独立性は全版で維持。新profile条件を含む要件全体はR08。 | 0.4.0 | 残す |
| UTV4-FR-014 current/legacy分離 | UTV4-BR-014 | UTV4-AC-023 | R00 → R00 | 現行M0のBun/current境界を成立。以降のschema/role更新にも同じ原則を継承。 | 0.3.0 | 残す |
| UTV4-FR-015 要求intake | UTV4-BR-009 | UTV4-AC-024 | R03 → R07 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.5.0 | 簡素化 |
| UTV4-FR-016 discoveryからIR compile | UTV4-BR-009, UTV4-BR-010 | UTV4-AC-025 | R03 → R07 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 対象外 | 撤回 |
| UTV4-FR-017 PoC別axisとS4 | UTV4-BR-010 | UTV4-AC-026 | R03 → R07 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.5.0 | 簡素化 |
| UTV4-FR-018 prototype反応とproduction昇格 | UTV4-BR-010 | UTV4-AC-027 | R03 → R07 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.5.0 | 簡素化 |
| UTV4-FR-019 Memory retirement | UTV4-BR-011 | UTV4-AC-028, UTV4-AC-091 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.4.0 | 簡素化 |
| UTV4-FR-020 学習資産ownerと失効 | UTV4-BR-011 | UTV4-AC-029 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 対象外 | 撤回 |
| UTV4-FR-021 skill applicability registry | UTV4-BR-012 | UTV4-AC-030 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 対象外 | 撤回 |
| UTV4-FR-022 最小packet・telemetry・昇格 | UTV4-BR-012 | UTV4-AC-031 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 対象外 | 撤回 |
| UTV4-FR-023 provider topology | UTV4-BR-013 | UTV4-AC-022, UTV4-AC-032, UTV4-AC-033, UTV4-AC-034 | R03 → R08 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.4.0 | 簡素化 |
| UTV4-FR-024 single-provider補償統制 | UTV4-BR-013 | UTV4-AC-034 | R03 → R08 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 対象外 | 先送り |
| UTV4-FR-025 surface分類と退役 | UTV4-BR-014 | UTV4-AC-035 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.5.0 | 簡素化 |
| UTV4-FR-026 legacy inventory・schema退役 | UTV4-BR-014 | UTV4-AC-036 | R01 → R09 | BunはR00、更新/記録inventoryはR02/R03、他surfaceの原子的退役はR09。 | 0.5.0 | 簡素化 |
| UTV4-FR-027 receipt custody・GC・projection | UTV4-BR-013, UTV4-BR-014 | UTV4-AC-037 | R03 → R05 | M0/R02の必要な既知事故修理は先行。新共通custody/GC全体はR05。 | 0.3.0 | 残す |
| UTV4-FR-028 上流PoC/proto ticket | UTV4-BR-010, UTV4-BR-031 | UTV4-AC-039 | R03 → R07 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 対象外 | 先送り |
| UTV4-FR-029 層別owner | UTV4-BR-015 | UTV4-AC-040 | R01 → R07 | 管理定義はR01、機械強制はR03/R05、全上流owner適用はR07。 | 0.3.0 | 簡素化 |
| UTV4-FR-030 統合ticketとtakeover | UTV4-BR-016, UTV4-BR-004 | UTV4-AC-041 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 対象外 | 撤回 |
| UTV4-FR-031 差戻し回数と上流回帰 | UTV4-BR-030, UTV4-BR-016 | UTV4-AC-042 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.5.0 | 簡素化 |
| UTV4-FR-032 rebase/exact-head merge | UTV4-BR-016, UTV4-BR-004 | UTV4-AC-043 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.3.0 | 残す |
| UTV4-FR-033 人数不変性 | UTV4-BR-017 | UTV4-AC-044 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.5.0 | 簡素化 |
| UTV4-FR-034 人間統括/WIP判断 | UTV4-BR-017, UTV4-BR-008 | UTV4-AC-045 | R01 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.3.0 | 簡素化 |
| UTV4-FR-035 ticket compiler | UTV4-BR-017 | UTV4-AC-046 | R03 → R07 | R05で確定済みL4行列→下流、R07でL2/検証発行まで全入口を受入。 | 0.3.0 | 簡素化 |
| UTV4-FR-036 大中小原子の階層 | UTV4-BR-003 | UTV4-AC-047 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 対象外 | 撤回 |
| UTV4-FR-037 stop-the-line incident | UTV4-BR-018 | UTV4-AC-049 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.4.0 | 簡素化 |
| UTV4-FR-038 project改善intake/export | UTV4-BR-019 | UTV4-AC-050 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 対象外 | 先送り |
| UTV4-FR-039 L3/L5製本 | UTV4-BR-020 | UTV4-AC-051 | R03 → R07 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 対象外 | 先送り |
| UTV4-FR-040 実録provenanceのskill | UTV4-BR-021 | UTV4-AC-052 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 対象外 | 先送り |
| UTV4-FR-041 judgement record | UTV4-BR-023 | UTV4-AC-053 | R03 → R03 | judgement型と新判定のwriterをR03で受入。過去判定の捏造backfill禁止。 | 対象外 | 撤回 |
| UTV4-FR-042 calibrationと機械判断化 | UTV4-BR-023 | UTV4-AC-054 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 対象外 | 先送り |
| UTV4-FR-043 cost/tier降格 | UTV4-BR-022 | UTV4-AC-055 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 対象外 | 先送り |
| UTV4-FR-044 良否と選好の分離 | UTV4-BR-024 | UTV4-AC-056 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.5.0 | 簡素化 |
| UTV4-FR-045 判断/学習の人間view | UTV4-BR-025 | UTV4-AC-057 | R03 → R09 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 対象外 | 先送り |
| UTV4-FR-046 依存/画面/ER図の生成 | UTV4-BR-026 | UTV4-AC-058 | R03 → R07 | R04で既存typed sourceとER/依存view、R05でticket図、R07でproto/上流の全入力を接続。 | 対象外 | 先送り |
| UTV4-FR-047 discrepancyとdiagram drift | UTV4-BR-026 | UTV4-AC-059 | R03 → R04 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 対象外 | 撤回 |
| UTV4-FR-048 backflow集約と再compile | UTV4-BR-027 | UTV4-AC-060 | R03 → R07 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.4.0 | 簡素化 |
| UTV4-FR-049 論理role/native生成 | UTV4-BR-028 | UTV4-AC-061 | R03 → R08 | 最小のlogical role契約はR03/R05から使用、native生成の全切替はR08。 | 0.4.0 | 簡素化 |
| UTV4-FR-050 Control Plane dispatch | UTV4-BR-028 | UTV4-AC-062 | R03 → R08 | R05は既存adapterに安全dispatch、R08で全profile/nativeへ展開。 | 0.4.0 | 簡素化 |
| UTV4-FR-051 blind review偏見対策 | UTV4-BR-013 | UTV4-AC-063 | R03 → R08 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.4.0 | 簡素化 |
| UTV4-FR-052 階層refactor責務 | UTV4-BR-029 | UTV4-AC-064 | R03 → R05 | R05で中の検査/必要なrefactor発行。無修正で合格する判定を候補との整合審査にかける。 | 0.3.0 | 残す |
| UTV4-FR-053 refactor発火条件 | UTV4-BR-029 | UTV4-AC-065 | R03 → R09 | 構造違反判定はR05、使用実測による全surface発火はR09。 | 対象外 | 先送り |
| UTV4-FR-054 admission ticket三者分離 | UTV4-BR-030 | UTV4-AC-066 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.3.0 | 簡素化 |
| UTV4-FR-055 人間reviewの傾斜 | UTV4-BR-030 | UTV4-AC-067 | R03 → R05 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.4.0 | 残す |
| UTV4-FR-056 画面proto工程・深度 | UTV4-BR-031 | UTV4-AC-068, UTV4-AC-070 | R03 → R07 | R03/R04自身のUIも既存手順でprototypeし記録。汎用エンジン全体はR07。 | 対象外 | 先送り |
| UTV4-FR-057 製本前段の必要条件 | UTV4-BR-031 | UTV4-AC-069 | R03 → R07 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 対象外 | 先送り |
| UTV4-FR-058 provisional/frozen | UTV4-BR-032 | UTV4-AC-071 | R03 → R07 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 0.5.0 | 残す |
| UTV4-FR-059 PoC budget/超過検知 | UTV4-BR-010 | UTV4-AC-072 | R03 → R07 | 後続consumerの適用も同じ共通契約を使用。表は計画上の対応であり、実装済み/受入済みを意味しない。 | 対象外 | 先送り |
| UTV4-FR-060 管理知能 | UTV4-BR-033 | UTV4-AC-073 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 対象外 | 撤回 |
| UTV4-FR-061 管理知能の実装言語 | UTV4-BR-034 | UTV4-AC-074 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 対象外 | 撤回 |
| UTV4-FR-062 二言語の型生成 | UTV4-BR-034 | UTV4-AC-075 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 対象外 | 撤回 |
| UTV4-FR-063 作業順序予測 | UTV4-BR-035 | UTV4-AC-076 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 対象外 | 先送り |
| UTV4-FR-064 CIの並列分割 | UTV4-BR-036 | UTV4-AC-077 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 0.5.0 | 簡素化 |
| UTV4-FR-065 ATの流用 | UTV4-BR-037 | UTV4-AC-078 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 0.5.0 | 簡素化 |
| UTV4-FR-066 層番号の振り直し | UTV4-BR-039 | UTV4-AC-079 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 対象外 | 先送り |
| UTV4-FR-067 as-built仕様書と設計の照合 | UTV4-BR-040, UTV4-BR-038 | UTV4-AC-080 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 0.5.0 | 簡素化 |
| UTV4-FR-068 右腕の定常engine | UTV4-BR-041 | UTV4-AC-081 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 対象外 | 撤回 |
| UTV4-FR-069 L6の重複整理 | UTV4-BR-042 | UTV4-AC-082 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 対象外 | 先送り |
| UTV4-FR-070 ディレクトリ再編 | UTV4-BR-043 | UTV4-AC-083 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 対象外 | 先送り |
| UTV4-FR-071 release harnessによる開発 | UTV4-BR-044 | UTV4-AC-084 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 0.3.0 | 残す |
| UTV4-FR-072 費用・所要時間の手測り | UTV4-BR-045 | UTV4-AC-085 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 対象外 | 先送り |
| UTV4-FR-073 WBSエンジン | UTV4-BR-046 | UTV4-AC-086 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 対象外 | 撤回 |
| UTV4-FR-074 外部ライブラリの登録簿 | UTV4-BR-047 | UTV4-AC-087 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 0.4.0 | 簡素化 |
| UTV4-FR-075 メンバーと権限 | UTV4-BR-048, UTV4-BR-001 | UTV4-AC-088 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 0.3.0 | 簡素化 |
| UTV4-FR-076 設計判断の8原則lint | UTV4-BR-049 | UTV4-AC-089 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 対象外 | 撤回 |
| UTV4-FR-077 ハーネス自身のレッドチーム | UTV4-BR-050 | UTV4-AC-092, UTV4-AC-093 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 0.4.0 | 残す |
| UTV4-FR-078 製品の攻撃検証 | UTV4-BR-050 | UTV4-AC-093, UTV4-AC-094 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 0.4.0 | 簡素化 |
| UTV4-FR-079 記録の版互換 | UTV4-BR-014 | UTV4-AC-095 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 0.3.0 | 残す |
| UTV4-FR-080 派生一覧の再生成 | UTV4-BR-006 | UTV4-AC-096 | ― | 2026-11-13 に足した行。旧版の割当は無い。 | 0.3.0 | 残す |

## BR32の対応
| BR | 下流FR | 一式受入の分布 |
|---|---|---|
| UTV4-BR-001 | UTV4-FR-001 | R05 |
| UTV4-BR-002 | UTV4-FR-002 | R05 |
| UTV4-BR-003 | UTV4-FR-003, UTV4-FR-004, UTV4-FR-028 (先送り), UTV4-FR-035, UTV4-FR-036 (撤回), UTV4-FR-055 | R05, R07 |
| UTV4-BR-004 | UTV4-FR-005, UTV4-FR-027, UTV4-FR-030 (撤回), UTV4-FR-032 | R05 |
| UTV4-BR-005 | UTV4-FR-006, UTV4-FR-007 (撤回), UTV4-FR-059 (先送り) | R03, R07 |
| UTV4-BR-006 | UTV4-FR-008, UTV4-FR-009 (先送り) | R04 |
| UTV4-BR-007 | UTV4-FR-010, UTV4-FR-011 (先送り) | R09 |
| UTV4-BR-008 | UTV4-FR-012 (先送り), UTV4-FR-034 | R05 |
| UTV4-BR-009 | UTV4-FR-015, UTV4-FR-016 (撤回) | R07 |
| UTV4-BR-010 | UTV4-FR-017, UTV4-FR-018, UTV4-FR-028 (先送り) | R07 |
| UTV4-BR-011 | UTV4-FR-019, UTV4-FR-020 (撤回) | R09 |
| UTV4-BR-012 | UTV4-FR-021 (撤回), UTV4-FR-022 (撤回) | R09 |
| UTV4-BR-013 | UTV4-FR-013, UTV4-FR-023, UTV4-FR-024 (先送り), UTV4-FR-051 | R08 |
| UTV4-BR-014 | UTV4-FR-014, UTV4-FR-025, UTV4-FR-026, UTV4-FR-027, UTV4-FR-051 | R00, R05, R08, R09 |
| UTV4-BR-015 | UTV4-FR-029, UTV4-FR-034 | R05, R07 |
| UTV4-BR-016 | UTV4-FR-030 (撤回), UTV4-FR-031, UTV4-FR-032 | R05 |
| UTV4-BR-017 | UTV4-FR-033, UTV4-FR-035, UTV4-FR-036 (撤回) | R05, R07 |
| UTV4-BR-018 | UTV4-FR-037 | R05 |
| UTV4-BR-019 | UTV4-FR-038 (先送り) | R09 |
| UTV4-BR-020 | UTV4-FR-039 (先送り) | R07 |
| UTV4-BR-021 | UTV4-FR-040 (先送り) | R09 |
| UTV4-BR-022 | UTV4-FR-043 (先送り) | R09 |
| UTV4-BR-023 | UTV4-FR-041 (撤回), UTV4-FR-042 (先送り) | R03, R09 |
| UTV4-BR-024 | UTV4-FR-044 | R09 |
| UTV4-BR-025 | UTV4-FR-045 (先送り) | R09 |
| UTV4-BR-026 | UTV4-FR-046 (先送り), UTV4-FR-047 (撤回) | R04, R07 |
| UTV4-BR-027 | UTV4-FR-048 | R07 |
| UTV4-BR-028 | UTV4-FR-049, UTV4-FR-050 | R08 |
| UTV4-BR-029 | UTV4-FR-052, UTV4-FR-053 (先送り) | R05, R09 |
| UTV4-BR-030 | UTV4-FR-054, UTV4-FR-055 | R05 |
| UTV4-BR-031 | UTV4-FR-056 (先送り), UTV4-FR-057 (先送り) | R07 |
| UTV4-BR-032 | UTV4-FR-058, UTV4-FR-059 (先送り) | R07 |

根拠：[GH-PR517-FR/AC/BR](../SOURCES.md)。要約は読みやすさのための編集文であり、元の意味authorityを置換しない。
