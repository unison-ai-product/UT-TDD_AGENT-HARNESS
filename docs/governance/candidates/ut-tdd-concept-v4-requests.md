---
document_id: UT-TDD-CONCEPT-V4-REQUESTS
status: draft_candidate
concept: docs/governance/candidates/ut-tdd-concept-v4.0.md
plan: docs/plans/PLAN-L1-09-ut-tdd-concept-v4-candidates.md
revision_base_artifact: docs/design/harness/L1-requirements/business-requirements.md
---

# UT-TDD 構想書 v4.0 L1 要求候補 (チーム開発版)

## Authority 境界

本書は PLAN-L1-09 の未承認候補であり、current L1 業務要求 (BR-01〜08 / UX-02) ではない。既存 BR は不変とし、
本書は additive に積む。承認後は `docs/design/harness/L1-requirements/business-requirements.md` §1.2 へ
BR-09〜 として合流し、本書は候補から昇格記録へ役割を変える。

## PO 提示要求 (2026-09-04) からの起点

| PO 要求 | 小項目 |
|---|---|
| A. JSON 化による AI 開発ライク and 人間対応 | A-① 機械可読性の向上 / A-② スプシ・ドキュメントへの即時変換による人間可読性の向上 |
| B. チーム開発におけるコンフリクト対策・進捗マネジメント | B-① チケット型作業項目によるマルチユーザー協調並行開発 / B-② 責務管理と分割 / B-③ ナレッジ共有による永続的ハーネス改善 |

枠組み: human-on-the-loop。ユーザーと AI の境界責務を正しく分離して「作業・定義・改善」を定義する。

## PO 追加指示 (2026-09-04) — 参照元構想から取り込む 4 領域

PO は同日、参照元の個人開発ハーネス (非公開) から次の 4 領域を**部分採用**する意向を示した。いずれも
A / B の 2 大要求を実現する手段面であり、独立した第 3 の要求ではない。

| 領域 | 参照元の骨格 | 本書での受け皿 |
|---|---|---|
| C. 上流要求エンジン | L1 intake (人間 markdown) → L2 discovery (質問・回答・prototype 反応・candidate 分割/統合・矛盾・defer・agreement を append-only event) → L3 compile (strict typed IR、`compile_ready / backflow_required / human_decision_required / rejected` を exactly one) → 人間承認後だけ freeze | UTV4-BR-009 |
| D. PoC / プロトタイプ作成 | Discovery PoC を production 工程と別 axis の case-driven model として持ち、S0 backlog → S1 plan → S2 poc → S3 verify → S4 decide。S3 verified は terminal ではなく、S4 decision record (confirmed / rejected / pivot) が無ければ merge / Forward reentry を推測しない。prototype 反応は自由文と構造化 decision を分離して要求 candidate へ還元する | UTV4-BR-010 |
| E. ハーネスメモリの見直し | memory を最終正本にせず「捕捉 → 正本 (要求 / 設計 / 規則) へ取り込み → 証跡付き退役」の lifecycle を持つ。学習資産は責務 (responsibility) を primary owner とし CASE / SCENE / PATTERN / LOG / VERIFY へ分離、expiry・contradiction・revalidation を状態として持つ | UTV4-BR-011 |
| F. スキル / ナレッジ管理新体制 | skill の適用範囲を typed identity の versioned registry で持ち、assignment ごとに最小 packet を決定的に compile する。firing / 未使用 / miss を telemetry 化し、stale skill は削除ではなく可逆 quarantine。skill → 機構への昇格は shadow + before/after 測定 + 独立 review + rollback | UTV4-BR-015 | チームは、要件 (L3) と基本設計 (L4) を文書単位で 1 名の人間 owner がまとめ、詳細設計・仕様・実装・検証はチケット単位の 1 名 owner へ分担でき、層ごとの owner cardinality が契約として読めること。 | B-② | 原則 3 Responsibility First を層別に具体化。CLAUDE.md §GitHub Issue Hierarchy「canonical parent は 1 件」と整合 |
| UTV4-BR-013 | チームは、利用できる AI provider が 1 社でも本ハーネスを構築・運用でき、独立 review の担保方式 (family 分離 / provider 内 tier・session 分離 / 人間 review) を profile として選び、その evidence tier が receipt に正しく記録されること。 | B-② / 導入可能性 | v3.1 の 4 mode (standalone / claude-only / codex-only / hybrid) を継承し、single-provider を fallback ではなく補償統制付きの第一級 profile へ。CLAUDE.md §委譲と判断層「唯一の回避条件」を profile 契約へ置換 |
| UTV4-BR-014 | チームは、増え続ける command / subagent / skill / rule / 文書 / schema / archive を、利用実測と authority binding に基づいて可逆に縮退でき、縮退の判断が単一 episode や印象ではなく計測 record で残ること。 | B-③ / 縮退 | 参照元の縮退案件 (surface rationalization、legacy consumer inventory、schema / archive 退役、Document Authority Census) を写像。PLAN-L1-09 §2.5 に UT 側 issue を束縛 |
| UTV4-BR-012 |

## L1 要求候補

| ID | 要求 | 起点 | 既存との関係 |
|---|---|---|---|
| UTV4-BR-001 | チームは、複数の人間と複数の AI runtime が並行して開発しても、価値・要求・承認・不可逆作用・責務配分の最終 authority を人間側に保持できること。 | B-② / 北極星 | BR-02 (role 境界の機械強制) を人間↔AI 境界へ拡張。CC2 人間主導原則を層別に具体化 |
| UTV4-BR-002 | チームは、どの層でどの作用に人間が確定・承認・介入するかを一枚の層別境界表で読め、AI はその表の外へ質問を投げず、表の内側を越権しないこと。 | B-② | CLAUDE.md 2026-08-05「反射的エスカレーション禁止」と高影響境界の規約を要求へ昇格 |
| UTV4-BR-003 | チームは、作業をチケット (exactly-one owner、lease、scope、base/HEAD、証拠) の単位で発行・割当・追跡でき、人間ユーザーも AI lane も同じ割当モデルに載ること。 | B-① | U23 Execution Ledger / GitHub Issue projection (PLAN-L4-30 / L5-23 は confirmed、L6-83〜85 / L7-436〜439 は draft) を複数人間ユーザー前提へ改訂。github-issue-hierarchy.md を継承 |
| UTV4-BR-004 | チームは、同一ファイル・同一 PLAN・同一 PR に対する並行編集の衝突を lease と fence で事前に検知し、発生した衝突を所有者へ typed に戻せること。 | B-① | foreign-edit guard / PLAN 採番 (#480) / worktree lifecycle (#384、#426) / review request 分裂 (#421) の個別対処を 1 つの要求へ束ねる |
| UTV4-BR-005 | 利用者は、機械が生成・集計・遷移させる record (チケット・schedule・verdict・receipt・evidence) を構造化正本 (1 record = 1 file) として AI と機械から lossless に読み書きでき、人間が判断のために読む narrative は markdown 正本のまま扱えること。 | A-① | VUP-REQ-03 typed spec IR / VUP-REQ-07 PLAN 資産形式化を継承。charter PLAN-L0-01 §5 第 7 項「DB は authored source を置換しない」と整合 (正本は file、DB は projection) |
| UTV4-BR-006 | 利用者は、構造化正本と markdown 正本の双方から、表 (スプレッドシート)・ドキュメント・ダッシュボードの人間向け view を即時に生成でき、その view からの変更は admission 経由でのみ構造化正本へ戻ること (markdown 正本への機械書き戻しは行わない)。 | A-② | BR-06 / UX-02 (ダッシュボード) を「generated view」として再定義。生成 view は編集禁止 + 生成元 + hash 照合 |
| UTV4-BR-007 | チームは、FLAG・incident・運用観測から得た知見を、authority を無断で書き換えずに改善候補として既存 V-model (Reverse / Requirement Re-entry) へ還流でき、同じ知見を人間向け digest として受け取れること。 | B-③ | HARNESS memory (PLAN-L7-189)、右肺 quality loop (VUP-REQ-05)、#303 / #305 / #413 を継承。人間向け還流面を追加 |
| UTV4-BR-008 | チームは、progress を手作業で更新せず、チケット・PR・CI・review・merge の事実から進捗と詰まりが projection として自動的に見えること。 | B-① / B-② | BR-06 / VUP-REQ-01 (工程管理表の一級化) を team 単位へ拡張 |
| UTV4-BR-009 | チームは、要求を「人間の intake → 発見 (質問・prototype 反応・candidate 遷移の append-only event) → typed IR への compile → 人間承認で freeze」の一本の工程で扱え、AI が未確定値を補完して要求を確定させることがないこと。 | C / A-① / B-② | VUP-REQ-03 typed spec IR (U8〜U12、宣言部のみ) を要求発見工程へ前方拡張。PLAN-L1-07 の additive delta 方式で載せる |
| UTV4-BR-010 | チームは、不確実性の高い課題を production 工程とは別 axis の PoC / プロトタイプとして回し、prototype への反応を要求 candidate へ還元し、S4 判断 record が揃うまで PoC 成果を production 成果と混同しないこと。上流の PoC / 画面プロト作成はチケット (owner 1 名、対象 screen / 仮説、期待する反応) として発行でき、初期画面ルールを freeze した後は複数人で分担できること。 | D / A-② | CLAUDE.md §UT-TDD Workflow の Scrum / PoC (S0〜S4) と `kind=poc` (基準 ref で 10 PLAN) を継承し、S3 ≠ terminal と S4 record 必須を明示 |
| UTV4-BR-011 | チームは、ハーネスメモリを「捕捉 → 正本化 → 証跡付き退役」の lifecycle で扱い、学習資産の owner を責務単位に置き、失効・矛盾・再検証を状態として持てること。memory が正本や進捗の代替にならないこと。 | E / B-③ | PLAN-L7-189 HARNESS memory (基準 ref 586 件)、memory-sync gate、CLAUDE.md「エピソード状態を書かない」規則を lifecycle と状態機械へ昇格。#413 は後続 |
| UTV4-BR-012 | チームは、skill / ナレッジの適用範囲を typed registry で宣言し、作業ごとに必要最小の知識 packet だけを受け取り、skill の効き目を測って可逆に整理でき、skill から機構への昇格を証拠付きでのみ行えること。 | F / B-③ | CLAUDE.md §Skills「Load only relevant skills」、`skills/` (基準 ref 81 entry)、`src/skill-engine/`、`ut-tdd skill suggest` を registry・telemetry・昇格契約へ拡張 |

## 期待する利用体験

人間は意図・要求・体験・承認境界・責務配分を示す。ハーネスは変更契約とチケットを作り、人間ユーザーと AI lane へ
lease 付きで配り、独立検証し、同一 HEAD の証拠で閉じる。衝突は事前に見え、発生しても所有者へ typed に戻る。
知見はハーネスの改善候補と人間向け digest の両方へ流れ、人間に日常的な進捗操作を要求しない。

## 非要求

- 949 PLAN の一括 JSON 化 (record 化は新規種別から段階導入)。
- Issue / DB を意味正本にすること。
- 完全自動化 (human authority の AI への移譲)。
- provider 1 社構成での `cross_family` 僭称、同一 session 内の自己 review の独立 review 化。
- 参照元構想の全面移植 (repository / CLI の rename、Python 恒久意味コア、多軸分類 registry による routeFiling 置換)。
- provider 固定 topology (provider 名を responsibility や authority の identity にしない)。
