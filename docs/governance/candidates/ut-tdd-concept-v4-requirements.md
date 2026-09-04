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
| UTV4-FR-003 | actionable behavior・チケット・finding・learning asset は exactly-one primary owner を持つ。owner は人間ユーザー identity または logical lane であり、provider 名・model 名を owner にしない。多重 owner・owner 不在は fail-close。 | BR-003 | HELIX HCV4-FR-003 の翻案。routeFiling / delegation-routing の family 分離と整合 |
| UTV4-FR-004 | system はチケット (work item record) を assignment・owner・scope (allowed / forbidden path)・base・HEAD・lease・fence・budget・証拠義務を持つ構造化 record として発行し、人間ユーザーと AI lane を同一 model に載せる。 | BR-003 | U23 Execution Ledger (PLAN-L4-30 / L5-23 / L6-83〜85 / L7-436〜439) を複数人間ユーザー前提へ改訂。新規機構を作らず既存 draft を version-up |
| UTV4-FR-005 | 書き込み (file 編集・commit・push・PR 更新) は有効な lease を持つ owner だけが行え、lease の無い書き込み、同一 path への重複 lease、期限切れ lease は typed conflict として所有者へ戻す。foreign-edit guard、PLAN 採番予約、worktree lifecycle、review request 一意性はこの lease model の適用面とする。 | BR-004 | #480 / #384 / #426 / #421 / foreign-edit-override を 1 契約へ統合 |
| UTV4-FR-006 | 正本形式は artifact class で決める。narrative (設計・要求・PLAN 本文) は markdown 正本 + typed spec block。record (チケット・schedule・verdict・receipt・evidence) は 1 record = 1 JSON/YAML file の構造化正本。harness.db は projection、GitHub は projection。dual authority を作らない。 | BR-005 | charter PLAN-L0-01 §5 第 7 項、VUP-REQ-03 / 07 と整合。advisor (claude-fable-5、2026-09-04) 推奨 Option 3 |
| UTV4-FR-007 | PLAN frontmatter の record 化 (status / dependencies / review_evidence の構造化正本への引き剥がし) は本 concept の範囲で決めず、専用の Reverse 対 PLAN で段階移行する。実装 PR 内での場当たり分割を禁止する。 | BR-005 | PR スコープ規律 (2026-08-03) との整合。advisor 指摘リスク 1 |
| UTV4-FR-008 | 人間向け view (表 / doc / ダッシュボード) は構造化正本と markdown 正本から決定的に生成し、生成元 identity・digest・「編集禁止」を埋め込む。view と正本の hash 不一致は doctor gate で fail-close。 | BR-006 | BR-06 / UX-02 の実装形。advisor 指摘リスク 2 |
| UTV4-FR-009 | view からの変更は構造化正本への admission transaction 経由でのみ受理し、markdown 正本への機械書き戻しは行わない。admission は actor・source view・target record・revision を receipt に残す。 | BR-006 | HELIX の Issue admission (GitHub 側編集の逆流) を view 一般へ翻案 |
| UTV4-FR-010 | FLAG 類型・incident・運用観測・外部技術変化は proposal / evidence / delta だけを生成し、既存 V-model (Reverse / Requirement Re-entry) へ route する。authority への直接 write を拒否し、単一 episode で規則・機構へ昇格しない。 | BR-007 | VUP-REQ-05 右肺 quality loop、#303 / #305、CLAUDE.md「未計測のまま機構を建てない」 |
| UTV4-FR-011 | 同じ改善候補を人間向け digest (generated view) としてチームへ配り、採否は人間の decision record として残す。project 横断のナレッジ共有 (#413) は record 正本の namespace 分離 (PLAN-L7-512 / 529 の project identity) を前提に別 slice で扱う。 | BR-007 | HARNESS memory を人間可読へ延長。#413 は後続 |
| UTV4-FR-012 | 進捗・詰まり・アクティブフロンティアはチケット・PR・CI・review・merge の事実から projection として導出し、人間の手作業更新やモデルの自己申告を入力にしない。 | BR-008 | VUP-REQ-01 工程管理表 / BR-06 を team 単位へ拡張 |
| UTV4-FR-013 | 独立 review は authoring context から分離し、candidate HEAD と CI generation へ exact 束縛する。author runtime の内部 review を独立 review へ昇格せず、wrong HEAD の receipt を再利用しない。 | 共通 | v3.1 §2.1.2 / PLAN-L7-465 / 517 を継承 (変更なし、再確認) |
| UTV4-FR-014 | current identity と compatibility identity を分離し、legacy (Bun、personal path、旧 memory 中心継続) の green で current の failure を相殺しない。 | 共通 | ADR-001、Bun BAN (#450) を継承 |

## Compatibility

v3.1 の L0-L14、正規 V-pair、Forward / Reverse / Recovery、9-mode + routeFiling SSoT、fail-close、cross-family
review、TypeScript/Node 一本、Pack 配布契約 (PLAN-L6-63 系) は継承する。本書は既存要件を撤回せず、
UTV4-FR-013 / 014 は再確認である。
