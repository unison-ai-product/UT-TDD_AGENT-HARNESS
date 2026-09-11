# consumerへの配布・更新・版間互換

対象：全版、主にMIG-15。#481の一つのupdaterを使用し、各featureが独自更新機構を持たない。[GH-481]

## バージョン更新の一本道

`check → plan/dry-run → compatibility判定 → human approval → isolated staging → identity再検査 → writer停止/drain → state migration → generation pointer切替 → doctor/smoke → read-after → success`

失敗phaseと適合状態に応じ旧generationへ戻すかwriteを停止する。consumerのソース/要求/PLAN/Memory/DB/evidenceをruntime bytesで上書きしない。runtime更新承認を、CI削減・権限拡大・学習供出・自動mergeの承認へ流用しない。

## 版間の実際の扱い

| from → to | 主な移行 | 書込みと回復 |
|---|---|---|
| 0.2-canary.1 → canary.2 | MPL表示/対象source案内、runtime contractは維持 | license説明とconsumer同意。過去assetを修正しない |
| canary.2 → 0.2.0 | updater/generation/互換検査・履歴 | A/B・Windows lock・各fault pointを受入 |
| 0.2 → 0.3 | 新JSON共通reader/writer、actor/decision/検証record | 対象scope移行、旧writer fence、未移行はlegacy明示 |
| 0.3 → 0.4 | view/verification plan/schedule proposal | consumer CIはdiffと承認。scheduleはread-only |
| 0.4 → 0.5 | ticket/lease/attempt/controller、実配布 | active作業をdrain/checkpoint。旧dispatcherと同時起動禁止 |
| 0.5 → 0.6 | BugBot capability | default offで更新。scope/予算/安全の受入後のみopt-in |
| 0.6 → 0.7 | active PLAN/Reverse/proto/discovery移行 | 旧新ID/approvalを保持。provisionalの勝手なfreeze禁止 |
| 0.7 → 0.8 | native role/adapter生成とtopology | role/権限/evidence同値確認。profile選択はconsumer判断 |
| 0.8 → 0.9 | asset/context/学習・予測profile | 実測済みprofileのみ切替。旧packetのrollback先を保持 |
| 0.9 → 1.0 | active旧writer廃止、public API安定 | 全採択要件/移行/運用を統合受入 |

飛び級更新は、途中のmigrationをcomposeしたsealed planがある場合だけ許す。直接latest取得で旧stateを新writerへ渡さない。旧runtimeが新recordを理解できなければ、読める範囲を明示してwriteを拒否する。ルートmanifestにcompatibleと書いた自己申告だけでは通さない。

## A/B・保守の運用

Aを最新、Bを旧正常版で維持できること。Aの停滞/切戻し/学習例外がBに影響しないこと。worker・検証・receipt・policyもconsumer identityへ束縛する。版のサポート範囲は通常release時に公開し、保守できない旧版を自動的に安全扱いしない。

## 配布時の必要情報

package/source/Pack commit、tree/asset digest、capability manifest、supported schemasとmigration計画、ライセンス/第三者notice、対象sourceへの案内、必要CI/非著者review、公開判断を束縛する。public API manifestの変更にはschema/CLI/help/docの照合を付ける。manifest項目を増やす場合は既存のasset件数/公開契約も改訂する。

## 無承認変更を防ぐ

既存workflow保護、credential、送信先、学習opt-in、role任免、支出上限は更新前policyで認可する。更新packageが新しい自己申告policyを持ってきても、そのpolicy自身を根拠に適用しない。
