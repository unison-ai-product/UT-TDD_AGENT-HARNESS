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
| F. スキル / ナレッジ管理新体制 | skill の適用範囲を typed identity の versioned registry で持ち、assignment ごとに最小 packet を決定的に compile する。firing / 未使用 / miss を telemetry 化し、stale skill は削除ではなく可逆 quarantine。skill → 機構への昇格は shadow + before/after 測定 + 独立 review + rollback | UTV4-BR-012 |

## L1 要求候補

| ID | 要求 | 起点 | 既存との関係 |
|---|---|---|---|
| UTV4-BR-001 | チームは、複数の人間と複数の AI runtime が並行して開発しても、価値・要求・承認・不可逆作用・責務配分の最終 authority を人間側に保持できること。 | B-② / 北極星 | BR-02 (role 境界の機械強制) を人間↔AI 境界へ拡張。CC2 人間主導原則を層別に具体化 |
| UTV4-BR-002 | チームは、どの層でどの作用に人間が確定・承認・介入するかを一枚の層別境界表で読め、AI はその表の外へ質問を投げず、表の内側を越権しないこと。 | B-② | CLAUDE.md 2026-08-05「反射的エスカレーション禁止」と高影響境界の規約を要求へ昇格 |
| UTV4-BR-003 | チームは、作業をチケット (exactly-one owner、lease、scope、base/HEAD、証拠) の単位で発行・割当・追跡でき、人間ユーザーも AI lane も同じ割当モデルに載ること。チケットは大 (リリース切り分け) / 中 (責務・依存) / 小 (機能・path 群 = PR) / 原子 (単一変更契約 = 実行単位) の 4 階層で入れ子の親子を持ち、下から上へ収束すること。 | B-① | U23 Execution Ledger / GitHub Issue projection (PLAN-L4-30 / L5-23 は confirmed、L6-83〜85 / L7-436〜439 は draft) を複数人間ユーザー前提へ改訂。github-issue-hierarchy.md を継承 |
| UTV4-BR-004 | チームは、同一ファイル・同一 PLAN・同一 PR に対する並行編集の衝突を lease と fence で事前に検知し、発生した衝突を所有者へ typed に戻せること。 | B-① | foreign-edit guard / PLAN 採番 (#480) / worktree lifecycle (#384、#426) / review request 分裂 (#421) の個別対処を 1 つの要求へ束ねる |
| UTV4-BR-005 | 利用者は、機械が生成・集計・遷移させる record (チケット・schedule・verdict・receipt・evidence) を構造化正本 (1 record = 1 file) として AI と機械から lossless に読み書きでき、人間が判断のために読む narrative は markdown 正本のまま扱えること。 | A-① | VUP-REQ-03 typed spec IR / VUP-REQ-07 PLAN 資産形式化を継承。charter PLAN-L0-01 §5 第 7 項「DB は authored source を置換しない」と整合 (正本は file、DB は projection) |
| UTV4-BR-006 | 利用者は、構造化正本と markdown 正本の双方から、表 (スプレッドシート)・ドキュメント・ダッシュボードの人間向け view を即時に生成でき、その view からの変更は admission 経由でのみ構造化正本へ戻ること (markdown 正本への機械書き戻しは行わない)。**要求・要件・設計のスプレッドシート同期は必須**であり、人間はこの view を見て判断する。正本は 1 枚に集約せず責務ごとに分散して置く。 | A-② | BR-06 / UX-02 (ダッシュボード) を「generated view」として再定義。生成 view は編集禁止 + 生成元 + hash 照合 |
| UTV4-BR-007 | チームは、FLAG・incident・運用観測から得た知見を、authority を無断で書き換えずに改善候補として既存 V-model (Reverse / Requirement Re-entry) へ還流でき、同じ知見を人間向け digest として受け取れること。 | B-③ | HARNESS memory (PLAN-L7-189)、右肺 quality loop (VUP-REQ-05)、#303 / #305 / #413 を継承。人間向け還流面を追加 |
| UTV4-BR-008 | チームは、progress を手作業で更新せず、チケット・PR・CI・review・merge の事実から進捗と詰まりが projection として自動的に見え、統括 owner 1 名 (人間) がその projection を根拠に発散 / 収束・合流・切り分け・escalation の判断だけを行えること。 | B-① / B-② | BR-06 / VUP-REQ-01 (工程管理表の一級化) を team 単位へ拡張 |
| UTV4-BR-009 | チームは、要求を「人間の intake → 発見 (質問・prototype 反応・candidate 遷移の append-only event) → typed IR への compile → 人間承認で freeze」の一本の工程で扱え、AI が未確定値を補完して要求を確定させることがないこと。 | C / A-① / B-② | VUP-REQ-03 typed spec IR (U8〜U12、宣言部のみ) を要求発見工程へ前方拡張。PLAN-L1-07 の additive delta 方式で載せる |
| UTV4-BR-010 | チームは、不確実性の高い課題を production 工程とは別 axis の PoC / プロトタイプとして回し、prototype への反応を要求 candidate へ還元し、S4 判断 record が揃うまで PoC 成果を production 成果と混同しないこと。上流の PoC / 画面プロト作成はチケット (owner 1 名、対象 screen / 仮説、期待する反応) として発行でき、初期画面ルールを freeze した後は複数人で分担できること。 | D / A-② | CLAUDE.md §UT-TDD Workflow の Scrum / PoC (S0〜S4) と `kind=poc` (基準 ref で 10 PLAN) を継承し、S3 ≠ terminal と S4 record 必須を明示 |
| UTV4-BR-011 | チームは、ハーネスメモリを「捕捉 → 正本化 → 証跡付き退役」の lifecycle で扱い、学習資産の owner を責務単位に置き、失効・矛盾・再検証を状態として持てること。memory が正本や進捗の代替にならないこと。 | E / B-③ | PLAN-L7-189 HARNESS memory (基準 ref 586 件)、memory-sync gate、CLAUDE.md「エピソード状態を書かない」規則を lifecycle と状態機械へ昇格。#413 は後続 |
| UTV4-BR-012 | チームは、skill / ナレッジの適用範囲を typed registry で宣言し、作業ごとに必要最小の知識 packet だけを受け取り、skill の効き目を測って可逆に整理でき、skill から機構への昇格を証拠付きでのみ行えること。 | F / B-③ | CLAUDE.md §Skills「Load only relevant skills」、`skills/` (基準 ref 81 entry)、`src/skill-engine/`、`ut-tdd skill suggest` を registry・telemetry・昇格契約へ拡張 |
| UTV4-BR-013 | チームは、利用できる AI provider が 1 社でも本ハーネスを構築・運用でき、独立 review の担保方式 (family 分離 / provider 内 tier・session 分離 / 人間 review) を profile として選び、その evidence tier が receipt に正しく記録されること。 | B-② / 導入可能性 | v3.1 の 4 mode (standalone / claude-only / codex-only / hybrid) を継承し、single-provider を fallback ではなく補償統制付きの第一級 profile へ。CLAUDE.md §委譲と判断層「唯一の回避条件」を profile 契約へ置換 |
| UTV4-BR-014 | チームは、増え続ける command / subagent / skill / rule / 文書 / schema / archive を、利用実測と authority binding に基づいて可逆に縮退でき、縮退の判断が単一 episode や印象ではなく計測 record で残ること。 | B-③ / 縮退 | 参照元の縮退案件 (surface rationalization、legacy consumer inventory、schema / archive 退役、Document Authority Census) を写像。PLAN-L1-09 §2.5 に UT 側 issue を束縛 |
| UTV4-BR-015 | チームは、要件 (L3) と基本設計 (L4) を文書単位で 1 名の人間 owner がまとめ、詳細設計・仕様・実装・検証はチケット単位の 1 名 owner へ分担でき、層ごとの owner cardinality が契約として読めること。 | B-② | 原則 3 Responsibility First を層別に具体化。CLAUDE.md §GitHub Issue Hierarchy「canonical parent は 1 件」と整合 |
| UTV4-BR-016 | チームは、企画 → 画面モック → 集団プロト → PoC → 要件 → 基本設計 → 詳細 / 仕様チケット → 統合チェック → リリース切り分け → 依存単位実装 → main への随時 merge 受入 → 合流統合 → 検査 → リリース、という標準工程を、発散区間の出口 (event / receipt) と合流点 (統合チケット owner) が機械で読める形で運用できること。 | B-① / B-② | 概念 §標準工程 flow。v3.1 Forward / Reverse / Scrum-PoC を 1 本の team flow へ並べ直す (置換ではない) |
| UTV4-BR-017 | チームは、並行 AI 開発でチケット発行が人手のボトルネックにならないよう、チケットを上流成果物 (基本設計の責務 / 依存行列、画面 / 仮説 id、admission receipt) から機械的に compile し、人は batch 単位の admission と人間 owner の割当だけを行えること。人数が 1 → N → 1 と変わっても工程とゲートを変えずに運用できること。 | B-① / A-① | A. JSON 化の実利。BR-003 チケット model と BR-005 構造化正本の結合点 |
| UTV4-BR-018 | チームは、複数の責務 / チケットに跨る欠陥 (全体影響バグ) を影響範囲の機械判定に基づいて stop-the-line incident として扱い、影響下の admission を止め、修正を原子チケットと Reverse の対で行えること。 | B-① / B-② | 原則 7 Controlled Adaptation。CLAUDE.md §運用規律「独自方式のその場開発禁止」の incident 版 |
| UTV4-BR-019 | チームは、各 project で発生する log・issue・PR・review コメント・finding を project 単位の intake record に集約し、ハーネス自体の改善入力として project 横断の corpus へ一方向 (opt-in、機微遮断) で流せること。 | B-③ | BR-007 / BR-011 の収集点を確定。#413 (project 間隔離) を前提 |
| UTV4-BR-020 | チームは、画面モック / プロトタイプを L3 compile 時と L5 詳細設計時の 2 点で正式文書 (画面仕様 / 画面詳細、generated) へ製本でき、モック画像やプロト実装を正本にしないこと。 | A-② / D | BR-010 の出口。UX-02 / BR-06 |
| UTV4-BR-021 | チームは、一般手順を書いた汎用 skill に依存せず、実録 (receipt / finding / verdict / incident / S4 record) から抽出した知識に provenance を束縛して skill・判断パック・機構を生成・昇格できること。 | B-③ / F | BR-012 / BR-014 の学習面。参照元の GENERIC_PROCEDURE 退役と同型 |
| UTV4-BR-022 | チームは、高価な frontier モデルに依存せず、人間と安価な AI の組み合わせで品質基準を維持したまま開発できること。 | B-③ / F | 費用非依存の品質。判断機構の蓄積と人間ゲートで担保する |
| UTV4-BR-023 | チームは、LLM が下した判断 (verdict / finding / advisor / gate) を record として蓄積し、その後の結果と照合して、繰り返す判断を安価なモデルや決定的 check へ機械判断化できること (自己学習型ハーネス)。 | B-③ / F | log・判断の機械判断化。BR-021 の判断面 |
| UTV4-BR-024 | チームは、良否 (契約への正誤) だけでなく、開発されたプロダクトが人間にとって使いやすいか、および AI が裏側で働いても壊しにくいシステムかという選好の判断軸を実録から skill として蓄積し、レビュー観点へ注入できること。 | A-② / B-③ / F | 判断軸 skill。選好軸の規約化は人間ゲート |
| UTV4-BR-025 | チームは、蓄積された判断・学習・機械化された check を AI だけでなく人間も同じ場所 (スプレッドシート同期と画面モック / プロトの製本物 = ハーネス標準共有機構) で読み、承認・差し戻しができること。 | A-② / D | 二重可読 (原則 6) を判断・学習層へ適用。組織で使える条件 |
| UTV4-BR-026 | チームは、依存グラフ・画面遷移・DB テーブル / ER などを機械が認識している record から自動的に図・表として可視化し、人間の認識との齟齬を記録として検出・解消できること。 | A-② / D | 図は generated view。DB テーブルはスプシ同型。齟齬は discrepancy record |
| UTV4-BR-027 | チームは、下流 (実装・検証・運用) から上流 (要求・要件・設計) への還流を、人数が増えても上流 owner が bottleneck や重複対応にならない形で、record として集約・判断・再配布できること。 | A-① / B-③ | 現行 Reverse のチーム化。人数不変性 (BR-013) の還流面 |
| UTV4-BR-028 | チームは、ハーネス固有の手書き sub-agent 定義に依存せず、provider 非依存の少数の論理 role を各 provider の native な sub-agent 機構へ写像して使え、オーケストレーションを特定の LLM orchestrator に依存させないこと。 | B-③ / E | 二重 role 体系の解消。Provider topology (BR-013 / 014) の実行面 |
| UTV4-BR-029 | チームは、リファクタリングと退役 (削る作業) をチケット階層ごとの責務として持ち、発火条件を機械が検出して refactor チケットを発行でき、機能追加と混ぜずに behavior-invariant として受入できること。 | B-③ / F | 原子 = TDD 内、小 = 任意 compose、中 = 必須ゲート、大 = 逆方向発行 |

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
