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

## L1 要求候補

| ID | 要求 | 起点 | 既存との関係 |
|---|---|---|---|
| UTV4-BR-001 | チームは、複数の人間と複数の AI runtime が並行して開発しても、価値・要求・承認・不可逆作用・責務配分の最終 authority を人間側に保持できること。 | B-② / 北極星 | BR-02 (role 境界の機械強制) を人間↔AI 境界へ拡張。CC2 人間主導原則を層別に具体化 |
| UTV4-BR-002 | チームは、どの層でどの作用に人間が確定・承認・介入するかを一枚の層別境界表で読め、AI はその表の外へ質問を投げず、表の内側を越権しないこと。 | B-② | CLAUDE.md 2026-08-05「反射的エスカレーション禁止」と高影響境界の規約を要求へ昇格 |
| UTV4-BR-003 | チームは、作業をチケット (exactly-one owner、lease、scope、base/HEAD、証拠) の単位で発行・割当・追跡でき、人間ユーザーも AI lane も同じ割当モデルに載ること。 | B-① | U23 Execution Ledger / GitHub Issue projection (PLAN-L4-30、L6-83〜85、L7-436〜439、draft) を複数人間ユーザー前提へ改訂。github-issue-hierarchy.md を継承 |
| UTV4-BR-004 | チームは、同一ファイル・同一 PLAN・同一 PR に対する並行編集の衝突を lease と fence で事前に検知し、発生した衝突を所有者へ typed に戻せること。 | B-① | foreign-edit guard / PLAN 採番 (#480) / worktree lifecycle (#384、#426) / review request 分裂 (#421) の個別対処を 1 つの要求へ束ねる |
| UTV4-BR-005 | 利用者は、機械が生成・集計・遷移させる record (チケット・schedule・verdict・receipt・evidence) を構造化正本 (1 record = 1 file) として AI と機械から lossless に読み書きでき、人間が判断のために読む narrative は markdown 正本のまま扱えること。 | A-① | VUP-REQ-03 typed spec IR / VUP-REQ-07 PLAN 資産形式化を継承。charter PLAN-L0-01 §5 第 7 項「DB は authored source を置換しない」と整合 (正本は file、DB は projection) |
| UTV4-BR-006 | 利用者は、構造化正本と markdown 正本の双方から、表 (スプレッドシート)・ドキュメント・ダッシュボードの人間向け view を即時に生成でき、その view からの変更は admission 経由でのみ構造化正本へ戻ること (markdown 正本への機械書き戻しは行わない)。 | A-② | BR-06 / UX-02 (ダッシュボード) を「generated view」として再定義。生成 view は編集禁止 + 生成元 + hash 照合 |
| UTV4-BR-007 | チームは、FLAG・incident・運用観測から得た知見を、authority を無断で書き換えずに改善候補として既存 V-model (Reverse / Requirement Re-entry) へ還流でき、同じ知見を人間向け digest として受け取れること。 | B-③ | HARNESS memory (PLAN-L7-189)、右肺 quality loop (VUP-REQ-05)、#303 / #305 / #413 を継承。人間向け還流面を追加 |
| UTV4-BR-008 | チームは、progress を手作業で更新せず、チケット・PR・CI・review・merge の事実から進捗と詰まりが projection として自動的に見えること。 | B-① / B-② | BR-06 / VUP-REQ-01 (工程管理表の一級化) を team 単位へ拡張 |

## 期待する利用体験

人間は意図・要求・体験・承認境界・責務配分を示す。ハーネスは変更契約とチケットを作り、人間ユーザーと AI lane へ
lease 付きで配り、独立検証し、同一 HEAD の証拠で閉じる。衝突は事前に見え、発生しても所有者へ typed に戻る。
知見はハーネスの改善候補と人間向け digest の両方へ流れ、人間に日常的な進捗操作を要求しない。

## 非要求

- 951 PLAN の一括 JSON 化 (record 化は新規種別から段階導入)。
- Issue / DB を意味正本にすること。
- 完全自動化 (human authority の AI への移譲)。
- provider 固定 topology (provider 名を responsibility や authority の identity にしない)。
