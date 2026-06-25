# CROSS-REVIEW TASK — PLAN-L7-157 (distribution / setup) DESK REVIEW

## 厳守スコープ (front-loaded、逸れ禁止)

- これは **DESK REVIEW** = 設計/PLAN レビュー。**read-only**。**いかなるファイルも編集・作成・削除しない**。
- レビュー対象は **`docs/plans/PLAN-L7-157-distribution-clean-pull.md` ただ一つ**。これを読んで評価する。
- **直近の commit / 他の PLAN / 進行中リファクタの working tree は対象外**。working tree には別ランタイム(Codex)の
  リファクタが in-flight で存在するが、**それには触れず・評価対象にもしない**。git history も追わない。
- 出力は **findings のみ** (Critical / Important / Minor)。コードや doc の改変は提案文のみで、実ファイルは変更しない。

## 背景 (最小)

PLAN-L7-157 は UT-TDD ハーネスを「**GitHub から dogfood 非搭載・画面なしで pull → 別PCで `ut-tdd setup` →
既存(作りかけ)プロジェクトへ非破壊で導入/更新できる clean 配布物**」にするための draft。確定原則 = S5=b / S-01 /
CC2 / ADR-005 / ADR-001 を変えない前提。要件 R1-R14、設計判断 D-A〜D-I、AC1-14、§8 全数インベントリ A-K で構成。

## レビュー観点 (adversarial に、欠落と誤りを探す)

1. **完全性**: 配布/導入/更新セットアップに必要な物で **R1-R14 / D-A〜I / §8 インベントリに無い項目**は何か。
   (PO 命題は「セットアップに必要なものを全部洗い出す」。抜けを名指しで挙げる。例: offline/社内 mirror、proxy、
   monorepo、既存 lint/CI 設定衝突、telemetry opt-out、複数 runtime 版差、Windows 以外 等の観点漏れ。)
2. **正しさ/不変条件**: 非破壊 (R3/R5/D-D)・runtime 非結合 (D-C)・clean pull (R1/D-A)・Bun/hook-path (R6/D-F) の
   主張に**穴・誤り・自己矛盾**はないか。「managed-marker 区画のみ更新で既存を壊さない」は本当に成立するか
   (marker が無い既存ファイルへの初回挿入、hook 配列 merge、conflict 検出の取りこぼし等)。
3. **確定原則との整合**: S5=b / S-01 / CC2 / ADR-005 D1·D2 / ADR-001 に反する主張・前提はないか。
4. **設計判断の妥当性**: D-A〜D-I の framing は妥当か。誤った二分法・抜けた選択肢・危険な既定はないか
   (特に D-E の agent 駆動 workflow で「agent=PROPOSE / 機械=ENFORCE」の分離が安全保証として十分か)。
5. **検証可能性**: AC1-14 は機械検証可能な形か。prose だけで substance を欠く AC はどれか。

## 出力フォーマット

- `Critical`: 配布の安全/非破壊不変条件を脅かす、または確定原則違反。
- `Important`: 完全性の重大な抜け、誤った設計前提。
- `Minor`: 表現・整理・将来課題。
- 各 finding に「該当 R/D/AC」と「なぜ問題か」を 1-2 行で添える。最後に **go / no-go (draft 妥当性)** を一言。
