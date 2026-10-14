---
layer: L6
artifact_type: design_doc
status: draft
sub_doc: function-spec
artifact_role: topic_vmodel_unimplemented_gates
pair_artifact: docs/test-design/harness/L7-vmodel-unimplemented-gates-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
---

# V モデル由来の未実装 gate / 生成物 — 目標契約 (issue #958 還流)

## 1. 位置付け

本書は、ZIP 比較監査 (2026-07-08) で起票され、実装が `src/` に無いまま draft で残っていた PLAN の設計契約を、
PLAN から設計文書へ移したものである。**本書の契約はすべて未実装の目標契約**であり、`src/` / `tests/` に
対応する実装は無い (実測: `substance-fill` / `adr-ledger` / `unrecorded change` / `undeclared-doc` /
`digest-export` / `immediate-revalid` を `src/` で検索して 0 件)。実装時は、本書を契約として freeze し、
review してから実装 PR を出す。対になる oracle は `docs/test-design/harness/L7-vmodel-unimplemented-gates-test-design.md`
の `CANDIDATE-VMUG-*` である。

共通方針: 検出器は設計・ID・台帳を補完創作せず、authoring source と harness.db projection から再構築する。
fail-close を入れる gate は、実 repo 回帰テストで false positive 0 を実測してから昇格する (prose 断言禁止)。

## 2. 中身充足 fill gate (VMG-FILL、旧 PLAN-L6-51)

- 目的: `done` / `confirmed` を宣言した artifact の中身が空であることを検出する (「coverage ≠ substance」の機構化)。
- 検出対象: 表セルの記入率、裸の `TBD` / `TODO`、プレースホルダの残り。doctor gate で fail-close する。
  閾値・対象 block 種別・除外規約は実装前の freeze で固定する。
- 粒度乖離 (詳細宣言なのに薄い、簡易宣言なのに厚い) は**情報表示にとどめ、赤にしない**。false positive を gate へ入れない。
- 既存の readability gate (mojibake fail-close) と artifact progress read model に統合し、多重検出を避ける。
  `confirmed-document-placeholder-detection.md` との責務境界を実装前に確定する。

## 3. 敵対検証機構 (VMG-ADV、旧 PLAN-L6-53)

3 層防御の第 2 層 (敵対検証) と第 3 層 (人間の抜き打ち・検出器劣化監視) の契約。

1. リスク加重抽出: fail / blocked 履歴、証跡の薄さ、高ファンアウト、直近更新から検証対象 ID を機械抽出し、
   ブラインドパケットを生成する。全 ID に基礎点 1 を残す (ランダム床。リスクスコアを低く保つ回避を成立させない)。
2. 攻撃者 / 防御者の分離: 別セッション・別 provider。作成に関与したモデルはどちらの役にも就けない。
3. 判定規約: 有効な攻撃は 4 種 (二読みの実証 / テスト未被覆の境界 / 証跡から再確認手順が組めない / テスト緑でも要件未充足の反例)。
   反駁されない攻撃が 1 つでもあれば FLAG、全て反駁されれば PASS、`no_attack` は PASS-WEAK。
   防御者は提示情報の引用だけを根拠に反駁する。`no_attack` は試行した攻撃と不成立理由を 3 件以上の試行ログとして必須とし、
   ログなしは無効とする。
4. 第 3 層: PASS 群の約 1 割と PASS-WEAK を人間の抜き打ちへ機械指名する。指名は seed 固定で冪等とし、
   `human_check` が記入されるまで同じ対象を指し続ける。seed は人間管理の環境変数または AI 非可読の外部保管とし、
   ソース・DB に埋め込まない (ソースを読める監査対象が指名を事前計算できるため)。検出器自身への定期的な敵対検証 (年 1 回相当) を工程管理表へ登録する。
5. `attacks` / `verdicts` は追記のみとし、改変を guard / doctor で機械強制する。
6. 命名: `src/team/advisor-policy.ts` の `AdvisorConsultationMode = "adversarial"` (単一モデルへの frontier 相談) は
   本機構と別物である。実装で `adversarial` を再利用する場合は既存モードと衝突しない名前にする。
   現行の PASS-WEAK は review custody の verdict 語彙 (`src/feedback/review-custody.ts` ほか) にあり、
   本機構の PASS-WEAK はこれと同義で使う (reviewer が反証試行を残さない PASS の格下げ)。

## 4. 記録なき変更検出 (VMG-DIFF、旧 PLAN-L6-54)

- 意味単位 (ID の追加・削除・改版履歴) の差分を、旧 snapshot (git rev または前回投影) と現在の `spec_defs` projection の間で機械算出する。
- 差分があるのに history / PLAN / typed-spec ledger のいずれにも記録が無い場合、「記録なき変更」finding として fail-close する。
- typed-spec ledger / body-sync gate (宣言済み台帳と本文の整合) とは**独立した gate** とする。前者は宣言整合、
  本書は変更差分そのものを対象とし、二重検出にしない。
- 工程管理表の矛盾検出 (`selectScheduleLiveState`、実行時 signal 軸) とも統合しない。本 gate は spec 内容軸である。

## 5. 未宣言ドキュメントの trace ギャップ検出 (VMG-UNDECL、旧 PLAN-L6-55)

- trace-closure gate は宣言済み集合の内側でしか回らず、未宣言 doc は空虚に green を通る。これを埋める。
- lite 導出: full 導出ではなく、trace 未宣言 doc の**検出レポート**に縮退する。fail-close は段階導入 (初期は warn、閾値到達後に gate へ昇格)。
- 三層分類: 全 doc を「宣言元 (型宣言を持つ定義元)」「詳細化 (正本 ID を参照)」「記述 (ID 不要の方針書)」に分類し、
  正本カバレッジと未宣言ギャップを可視化する。
- サンセット条件: typed-spec カバレッジが閾値 N% に到達した時点で本機構を deprecate する。N は実装前の freeze で TL が数値で確定する
  (数値の無い「過渡的」判断は禁止)。
- trace closure (宣言済みの閉包検証) および activation profile join とは検出範囲を重ねない。

## 6. ADR と台帳の双方向整合 (VMG-ADR、旧 PLAN-L6-56)

- `docs/adr/` の決定事項と、対応する台帳 (typed-spec ledger、schedule authoring source など) を双方向に検査する。
  (a) ADR の決定が台帳に未反映、(b) 台帳の記載が対応する ADR を持たない。
- 用語ドリフト検出 (コード識別子と L0 glossary の突合) とは別軸である。同一 doctor group へ統合するか別 gate にするかは、
  実装前の freeze で設計判断として記録する。

## 7. agent contract の digest export (VMG-DIGEST、旧 PLAN-L6-58)

- `agent_contracts` projection から、実装リポジトリへ持ち込む digest を生成する。ビューはアーキテクチャ / コーディング規約 /
  テスト方針 / 設計方針の複数種とする。
- 生成物は読み取り専用ビューとし、正本 (`docs/governance/vmodel-agent-contracts.md`) への書き戻しを防ぐ編集禁止マーカーを付ける。
- 契約検出 (`analyzeAgentContractIntegrity`) の契約は変更しない。本機能はその上に非破壊で積む。

## 8. 編集直後の fail-close 即時再検証 hook (VMG-HOOK、旧 PLAN-L6-65)

- 現状: `PostToolUse` の `hook post-tool-use` はログ記録のみで、編集直後に gate を再実行して赤ならブロックする経路は無い。
  この記録機能は壊さない (非破壊拡張)。
- 目標: `docs/design/` / `docs/plans/` などへの Edit / Write 直後に、doctor の関連サブセット (影響範囲の狭い軽量 check のみ) を即時実行し、
  赤なら非ゼロ終了で通知する。CI の full scan と二重負荷にならない粒度を実装前に決める。
- Claude hook と Codex hook (`apply_patch` ヘッダ解析など固有の呼び出し形式) を同一スコープで設計し、対象 tool 名の差、
  timeout / debounce、再帰防止、fail-close 対象の最小集合が両 runtime で非対称にならないようにする。

## 9. 依存

実在する依存は次のとおり。それ以外 (起票順など) は持たない。

| 責務 | 依存先の成果 |
|---|---|
| VMG-DIFF | typed-spec ledger / body-sync gate が前提とする `spec_defs` projection |
| VMG-UNDECL | typed-spec trace closure (`spec_defs` / `spec_relations`) と document catalog |
| VMG-ADR | typed-spec ledger と schedule authoring source |
| VMG-DIGEST | `agent_contracts` projection (実装済み。`parseAgentContractRows`) |
| VMG-ADV | route filing / review custody の verdict 語彙 |
