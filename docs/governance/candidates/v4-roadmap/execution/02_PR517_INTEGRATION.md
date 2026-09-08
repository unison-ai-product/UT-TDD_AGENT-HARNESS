# PR #517への統合指示（4,000字以内）

編集入力。GitHub反映/承認receiptではない。基準HEAD=`c21b54fb`。着手時に最新HEAD・規約・権限・保留条件を確認。

## 目的

M0〜M6を版別capability・旧新移行・依存・受入へ具体化。元BR32/FR59/AC72と追加11要求を保持し、RM-ADD-12順序予測、13版別移行を追加。正式IDは最新候補で採番し、本書IDを正式PLANとしない。

## 版の提案

構想v4.0とpackage版を区別する。現行0.2.0-canary.1はMITで#418まで閉じ、その後のcanary.2でUT本体をMPL-2.0へ。0.2.0はupdater/A-B/rollbackを含む基盤stable。0.3 JSON、0.4 consumer低コストCI・共有view・read-only順序予測、0.5安全なチケット配布/回復、0.6 BugBot、0.7上流compile/還流、0.8native role、0.9学習/context縮退/予測校正、1.0.0を構想v4の統合受入目標とする。版名は提案で、発番済みではない。

## 反映先

- `ut-tdd-concept-v4.0.md`：到達目標、compiler/planner/dispatcher分離、管理/安全/予測の責務、版別有効化。
- `ut-tdd-concept-v4-requests.md`：追加目的を既存BRへrefinementし、真の追加だけ新BR。
- `ut-tdd-concept-v4-requirements.md`：順序予測、共通JSON、実際のready再検証、CAS/資源/aging/再計画、版互換・移行をFRへ。
- `ut-tdd-concept-v4-acceptance.md`：SCHED-01〜14、版/移行/コスト/権限の正常・拒否・回復を対応付ける。
- `PLAN-L1-09`：版別範囲・MIG/SLの依存・旧新対応・保留/未決と出所を整理。

releaseごとの詳細は`docs/governance/candidates/v4-roadmap/`等の候補サブディレクトリへ分割する案。現在の5文書に要約/参照を置き、同じ全文を複製しない。追加fileはPLANのscope/generatesも正規改訂。5文書の整合を維持。

## 主要条件

1. JSON化は型だけでなくreader/writer/validator/authority更新/回復まで。全Markdown一括変換は不要。R03/R05の受入前に旧proseの仮設BugBotを作らない。
2. plannerは依存/資源/CI・review待ち/critical path/不確実性/手戻り/context費用を考慮する。R04は提案のみ、R05からactual状態を再検査して配布。予測完了を前提成立/承認にしない。R09で実績校正。
3. actor/権限/安全/予算は旧有効policyで認可。任免/代理/失効・単独運用例外を明示し、管理Botを増殖しない。
4. consumer CIの2,000分はsoft目標。必要な超過はpolicy内で許容し、追加固定費を必須にしない。既存CIを無断上書きせず、selectorは全回帰と比較してから適用。
5. コンテキストは一般説明/旧workaroundを対象task/modelで実測削減。現在の要求/HEAD/安全義務は保持。実トラブルをguard/adapter/回帰/上流修正へ対策化し、失効/退役まで管理。
6. license実変更はM0完了後の専用PR。本体が対象で、Pack/第三者/生成物を整合。過去MIT配布を変えない。
7. 全移行に対象集合・旧新id/digest・writer epoch・shadow・fence・変換・reconcile・有効化・旧writer停止・rollbackを持つ。新writer稼働後の無条件snapshot restoreは禁止。
8. #481/#364の運用完成とJSON開発は並行可。v4全機能をstableの新依存にしない。

## 整合と検証

既存候補のL4 ticketing、root ticketのparent、原子path leaseとadmission操作lease、light/checklist、refactorと強制コード変更、単発修理と汎用policy昇格、exact-head/rebaseと証拠継承の衝突を明示解決する。

編集→BR/FR/AC/版/MIG/SL参照検査→必要CI→非著者review→指摘修正→プレリリース保留/人間判断の確認→正規merge。旧PASSの転用、runtime/CI/DB/LICENSE実変更の混入を禁止。対象版/SLと関連契約だけをcontextへ渡す。
