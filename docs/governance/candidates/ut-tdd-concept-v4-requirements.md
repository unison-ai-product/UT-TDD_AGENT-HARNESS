---
document_id: UT-TDD-CONCEPT-V4-REQUIREMENTS
status: draft_candidate
concept: docs/governance/candidates/ut-tdd-concept-v4.0.md
requests: docs/governance/candidates/ut-tdd-concept-v4-requests.md
plan: docs/plans/PLAN-L1-09-ut-tdd-concept-v4-candidates.md
revision_base_artifact: docs/design/harness/L1-requirements/vmodel-engine-swap-requirements-delta.md
---

# UT-TDD 構想書 v4.0 L3 要件候補 (チーム開発版)

## Authority 境界

本書は PLAN-L1-09 の未承認候補であり、current requirements (要件定義書 v1.2、VUP-REQ-01〜10)、Requirement IR、
runtime、DB へ投影しない。承認後は VUP-REQ-11〜 として `vmodel-engine-swap-requirements-delta.md` と同じ
additive 方式の L1 delta 文書へ写し、既存 VUP-REQ-01〜10 は不変とする。

## 要件候補

| ID | 要件 | 要求 | 既存 owner との関係 |
|---|---|---|---|
| UTV4-FR-001 | system は request / selection / approval / decision / disposition を別 identity として source・actor・target・scope・revision へ束縛し、memory・session summary・AI 解釈から approval を生成しない。 | BR-001 | PLAN-L7-517 (author provenance) の「claim は authority にならない」原則を人間 authority へ拡張 |
| UTV4-FR-002 | system は層別 human-on-the-loop 境界表 (層 × 人間の作用 × AI の作用 × 介入点) を authoring source として保持し、AI の PO 向け質問と AI の自律実行の両方をこの表で admit / deny する。表の外の質問は反射的エスカレーションとして deny し、表の内側の越権は fail-close する。 | BR-002 | CLAUDE.md §PO 判断への反射的エスカレーション禁止 / 高影響境界を機械契約化。concept §9 5 役割マトリクスと統合 |
| UTV4-FR-003 | actionable behavior・チケット・finding・learning asset は exactly-one primary owner を持つ。owner は人間ユーザー identity または logical lane であり、provider 名・model 名を owner にしない。多重 owner・owner 不在は fail-close。 | BR-003 | 参照元構想の exactly-one owner 要件の翻案。routeFiling / delegation-routing の family 分離と整合 |
| UTV4-FR-004 | system はチケット (work item record) を assignment・owner・scope (allowed / forbidden path)・base・HEAD・lease・fence・budget・証拠義務を持つ構造化 record として発行し、人間ユーザーと AI lane を同一 model に載せる。 | BR-003 | U23 Execution Ledger (PLAN-L4-30 / L5-23 / L6-83〜85 / L7-436〜439) を複数人間ユーザー前提へ改訂。新規機構を作らず既存 draft を version-up |
| UTV4-FR-005 | 書き込み (file 編集・commit・push・PR 更新) は有効な lease を持つ owner だけが行え、lease の無い書き込み、同一 path への重複 lease、期限切れ lease は typed conflict として所有者へ戻す。foreign-edit guard、PLAN 採番予約、worktree lifecycle、review request 一意性はこの lease model の適用面とする。 | BR-004 | #480 / #384 / #426 / #421 / foreign-edit-override を 1 契約へ統合 |
| UTV4-FR-006 | 正本形式は artifact class で決める。narrative (設計・要求・PLAN 本文) は markdown 正本 + typed spec block。record (チケット・schedule・verdict・receipt・evidence) は 1 record = 1 JSON/YAML file の構造化正本。harness.db は projection、GitHub は projection。dual authority を作らない。 | BR-005 | charter PLAN-L0-01 §5 第 7 項、VUP-REQ-03 / 07 と整合。advisor (claude-fable-5、2026-09-04) 推奨 Option 3 |
| UTV4-FR-007 | PLAN frontmatter の record 化 (status / dependencies / review_evidence の構造化正本への引き剥がし) は本 concept の範囲で決めず、専用の Reverse 対 PLAN で段階移行する。実装 PR 内での場当たり分割を禁止する。 | BR-005 | PR スコープ規律 (2026-08-03) との整合。advisor 指摘リスク 1 |
| UTV4-FR-008 | 人間向け view (表 / doc / ダッシュボード) は構造化正本と markdown 正本から決定的に生成し、生成元 identity・digest・「編集禁止」を埋め込む。view と正本の hash 不一致は doctor gate で fail-close。 | BR-006 | BR-06 / UX-02 の実装形。advisor 指摘リスク 2 |
| UTV4-FR-009 | view からの変更は構造化正本への admission transaction 経由でのみ受理し、markdown 正本への機械書き戻しは行わない。admission は actor・source view・target record・revision を receipt に残す。 | BR-006 | 参照元構想の Issue admission (GitHub 側編集の逆流) を view 一般へ翻案 |
| UTV4-FR-010 | FLAG 類型・incident・運用観測・外部技術変化は proposal / evidence / delta だけを生成し、既存 V-model (Reverse / Requirement Re-entry) へ route する。authority への直接 write を拒否し、単一 episode で規則・機構へ昇格しない。 | BR-007 | VUP-REQ-05 右肺 quality loop、#303 / #305、CLAUDE.md「未計測のまま機構を建てない」 |
| UTV4-FR-011 | 同じ改善候補を人間向け digest (generated view) としてチームへ配り、採否は人間の decision record として残す。project 横断のナレッジ共有 (#413) は record 正本の namespace 分離 (PLAN-L7-512 / 529 の project identity) を前提に別 slice で扱う。 | BR-007 | HARNESS memory を人間可読へ延長。#413 は後続 |
| UTV4-FR-012 | 進捗・詰まり・アクティブフロンティアはチケット・PR・CI・review・merge の事実から projection として導出し、人間の手作業更新やモデルの自己申告を入力にしない。 | BR-008 | VUP-REQ-01 工程管理表 / BR-06 を team 単位へ拡張 |
| UTV4-FR-013 | 独立 review は authoring context から分離し、candidate HEAD と CI generation へ exact 束縛する。author runtime の内部 review を独立 review へ昇格せず、wrong HEAD の receipt を再利用しない。 | 共通 | v3.1 §2.1.2 / PLAN-L7-465 / 517 を継承 (変更なし、再確認) |
| UTV4-FR-014 | current identity と compatibility identity を分離し、legacy (Bun、personal path、旧 memory 中心継続) の green で current の failure を相殺しない。 | 共通 | ADR-001、Bun BAN (#450) を継承 |
| UTV4-FR-015 | L1 intake record は目的・価値・actor・context・scope / non-goal・制約・仮説を保持し、未確定値は AI が補完せず L2 の question event へ送る。 | BR-009 | 要件定義書 v1.2 §L1 / BR-01 の intake を record 化。設計判断エリシテーション規約の機械契約 |
| UTV4-FR-016 | L2 discovery は質問・回答・prototype 反応・candidate の split / merge / reject / accept・矛盾・defer・agreement を append-only event として保持し current candidate を決定論的に再構築する。L3 compiler は L1 / L2 の全 evidence から typed IR へ compile し `compile_ready / backflow_required / human_decision_required / rejected` を exactly one 返す。frozen は人間 approval record の後だけ許し、別 requirement engine・別台帳・別 DB authority を作らない (既存 Requirement IR 経路 U8〜U12 を流用)。 | BR-009 | VUP-REQ-03 / PLAN-L1-07 の additive 方式。FR-001 の approval provenance を要求 freeze に適用 |
| UTV4-FR-017 | Discovery PoC は production 工程 (Forward / Reverse) とは別 axis の case-driven model として識別し、PLAN kind / route mode の代用にしない。S3 verified evidence は terminal ではなく、S4 decision record (allowed_outcome ∈ {confirmed, rejected, pivot}、decision_owner、verified_evidence、acceptance_gap、unresolved_risk、route_impact、forward_route) が揃うまで terminal status / merge / Forward reentry を推測しない。 | BR-010 | CLAUDE.md §UT-TDD Workflow「Scrum / PoC」の S0〜S4 と routeFiling の poc kind (`aim` slot 必須) を厳密化 |
| UTV4-FR-018 | prototype への反応は自由文と構造化 decision を分離して記録し、表示要求を underlying need・actor / task・state / failure / recovery・candidate・AC・prototype revision へ還元する。`poc/*` 成果物は Forward reentry (S4 confirmed + 正規 V-pair) を経ずに production path へ merge しない。 | BR-010 | UX-02 / BR-06 の prototype 面。FR-013 の exact-HEAD review と併用 |
| UTV4-FR-019 | ハーネスメモリは captured → canonicalized (要求 / 設計 / 規則 / test へ取り込み) → retired の lifecycle を持ち、退役は memory_id と取り込み先 path + digest を束縛した retirement record で行う。正本化済み内容の再掲、progress / raw log / secret / PII を含む memory は fail-close する。 | BR-011 | PLAN-L7-189 / memory-sync gate / CLAUDE.md「手書き禁止・エピソード状態を書かない」の機械化。FR-010 の非昇格原則と整合 |
| UTV4-FR-020 | 学習資産 (CASE / SCENE / PATTERN / LOG / VERIFY) の primary owner は responsibility_id とし、folder・文書・agent persona・skill 名・provider 名を owner にしない。asset は stale / contradicted / superseded / expired / revoked / revalidation_required へ縮退でき、provider / model / version drift で revalidation へ戻る。 | BR-011 | FR-003 exactly-one owner を学習資産へ適用。PLAN-L7-512 / 529 の project identity を namespace に使う (#413) |
| UTV4-FR-021 | skill applicability は versioned registry に typed identity (layer × workflow identity の exact pair) の positive / negative 集合として宣言し、unknown identity・同 pair の両極性・未指定の all 展開を fail-close する。recommendation / receipt は registry version と digest を返す。 | BR-012 | `skills/` frontmatter と `ut-tdd skill suggest` (`src/skill-engine/`) の入力契約を registry 化。routeFiling SSoT は複製しない |
| UTV4-FR-022 | assignment ごとの知識 packet (skill / memory / learning asset) は同一 input・同一 registry version から同一 exact set と digest へ決定的に compile し、全 skill / 全 memory の一括注入を禁止する。firing / loaded-but-unused / task miss を telemetry 化し、stale skill は削除せず可逆 quarantine とする。skill・detector・gate への昇格は shadow run + before/after 同一分母測定 + 独立 review + rollback plan を要求し、ACTIVE 機構と同じ規則を skill prose に重複保持しない。 | BR-012 | CLAUDE.md §Skills「bulk-load 禁止」、PLAN-L6-96 (advisor telemetry、条件付き保留)、FR-010「単一 episode で昇格しない」を一契約へ |

## 互換性

v3.1 の L0-L14、正規 V-pair、Forward / Reverse / Recovery、9-mode + routeFiling SSoT、fail-close、cross-family
review、TypeScript/Node 一本、Pack 配布契約 (PLAN-L6-63 系) は継承する。本書は既存要件を撤回せず、
UTV4-FR-013 / 014 は再確認である。UTV4-FR-015〜022 は PO 追加指示 (2026-09-04) の 4 領域 (C〜F) を
既存 owner の refinement として載せたものであり、新 engine・新台帳・新 DB authority を導入しない。
