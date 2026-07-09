---
title: "Vモデル refactor / QA release gate authoring source"
status: confirmed
owner: PO / TL / QA
updated: 2026-07-08
typed_spec_phase_owner: L6
---

# Vモデル refactor / QA release gate authoring source

## 0. 役割

本書は ZIP 108「リファクタリング設計書」と ZIP 109「QA診断・品質チェックリスト」を
UT-TDD Agent Harness の設計正本へ翻訳する。検出系は本書を読んで gate を構成し、
検出結果から本書を書き換えてはならない。

ZIP 108 は「振る舞い不変の内部構造改善」を定義する。ZIP 109 は「個別テストが走ったか」
ではなく「製品として出せるか」を診断する。したがって本書の対象は Refactor mode の
終了条件と、Release / Accept 前の QA Go/No-Go 判定である。

## 1. 型付き宣言

```yaml
spec:
  defines:
    - id: VMS-012
      kind: refactor-qa-release-authoring-source
      traces_from: [VMS-010]
      traces_to: [VMS-013]
      tests: [TVMS-012]
```

VMS-012 は ZIP 108 の Refactor 不変性・閾値・切り戻しと、ZIP 109 の QA release / Go/No-Go 契約を
HARNESS の governance authoring source として固定する typed spec である。

## 2. ZIP 108 Refactor 契約

Refactor は機能追加でも不具合修正でもない。観測可能な振る舞い、公的 CLI/API 契約、
永続状態 semantics を変えない完全化保守だけを扱う。

### 2.1 実施トリガー

| 指標 | 閾値 | HARNESS の正本 | 発火時の扱い |
| --- | --- | --- | --- |
| 循環的複雑度 | 関数あたり15超 | lint / quality_signals / refactor_candidate | 負債候補へ登録し Refactor PLAN 入力にする |
| 重複コード率 | 5%超 | refactor_candidate / audit evidence | 共通化候補として設計差分と突合する |
| テスト実行時間 | 単体10分超 | test_runs / review_evidence.green_commands | fixture 分割またはテスト構成改善を起票する |
| 変更失敗率 | 同一モジュールで直近3回中2回リグレッション | feedback_events / quality_signals | High 優先で Refactor または Troubleshoot へ route する |

### 2.2 禁止事項

- 仕様変更を refactor と称して混入しない。
- 対象境界の regression / characterization test が赤い状態で着手しない。
- `test_ids` を持たない green evidence だけで Refactor 完了にしない。
- DB projection で見つけた候補を、人間が読める PLAN / feedback へ戻さず自動完了扱いしない。

### 2.3 振る舞い不変の保証

`assertRefactorInvariant` は before / after の観測結果と regression evidence を比較する。
等価性テストがない場合は先に characterization test を追加し、現状の振る舞いを固定する。
この test は仕様の是非を判断するものではなく、Refactor による accidental change を防ぐ
ための fence である。

Refactor が Green になる条件は次の全てである。

- before / after の観測結果が同一である。
- regression evidence の `exit_code=0` である。
- 少なくとも 1 つの `test_ids` が evidence に紐づく。
- relation graph / impact result に未解決の振る舞いリスクがない。
- review は green command 後に実施されている。

### 2.4 切り戻し

| 条件 | 判断 | 処置 |
| --- | --- | --- |
| 等価性テストが2時間以内に緑化できない | Refactor 失敗 | 当該段階を revert し、未完了分を負債候補へ戻す |
| 本番相当で性能5%以上劣化 | 戦略誤り | 該当段階を revert し、設計戦略を再選択する |
| 予定工数が2倍超過 | 分割不足 | 中断して残作業を別 PLAN へ分割する |

## 3. ZIP 109 QA release 契約

QA 診断は「テストが計画通り実施されたか」だけを確認しない。構造、実体、実行、
品質特性、セキュリティ、リリース判断をまとめて Go/No-Go へ閉じる。

### 3.1 ISO/IEC 25010 品質特性診断

| 特性 | 診断内容 | 正本 / evidence |
| --- | --- | --- |
| 機能適合性 | 要件の RAG green と宣言テスト pass が揃う | schedule --live / spec trace |
| 性能効率性 | p95 など測定可能な NFR 目標を満たす | performance evidence / quality_signals |
| 互換性 | 外部 IF の契約テストが緑 | integration evidence |
| 使用性 | 主要画面の a11y 観点が実測済み | UX / accessibility evidence |
| 信頼性 | restore / rollback / recovery exercise が有効 | operational evidence |
| セキュリティ | Critical / High 指摘が 0 | security audit |
| 保守性 | ZIP 108 の複雑度 / 重複率 / High debt 条件を満たす | refactor gate / quality_signals |
| 移植性 | clean setup / Pack smoke が再現する | setup smoke / distribution evidence |

### 3.2 Go/No-Go checklist

| No | 区分 | 判定項目 | 判定 |
| --- | --- | --- | --- |
| G01 | 構造 | doctor / detect が対象 profile で全ゲート緑 | No-Go if red |
| G02 | 実行 | 対象要件の宣言テストが pass し、schedule --live に乖離がない | No-Go if drift |
| G03 | 実体 | review --status の FLAG が 0 件、PASS-WEAK 抜き打ちが済み | No-Go if flag |
| G04 | セキュリティ | Critical / High 指摘が 0 | No-Go if high |
| G05 | 品質特性 | ISO/IEC 25010 診断の High 相当指摘が 0 | No-Go if high |
| G06 | 運用準備 | rollback / monitoring / runbook が対象 release に追従 | No-Go if missing |
| G07 | 移行 | data migration rehearsal が本番相当で成功済み、または対象外理由あり | No-Go if unproven |
| G08 | 合意 | PO / customer acceptance が記録済み | No-Go if unapproved |

条件付き Go は risk acceptance が feedback / issue / PLAN に記録されている場合だけ許可する。
迷う項目は Go ではなく No-Go 側に倒す。

### 3.3 スモーク / 回帰最小集合

Release 直後のスモークは新規 test ID を発明しない。既存の宣言 test ID から、高ファンアウト、
認証、権限、データ境界、不可逆処理を優先して最小集合を選ぶ。失敗時は rollback または
feature flag 停止を選ぶが、誤課金・越権・データ損失は即 rollback とする。

## 4. 検出系への要求

検出系は本書を満たしているかだけを検査する。

- Refactor は `docs/process/modes/refactor.md` と `assertRefactorInvariant` の両方を読む。
- QA release は `Go/No-Go`、`ISO/IEC 25010`、`schedule --live`、`review --status`、
  `G01` から `G08` を揃えた authoring source を読む。
- gate 名は `refactor-qa-release-contracts` とする。
- 下流 DB projection は補助であり、authoring source を置き換えない。
