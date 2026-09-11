# セキュリティ・安全性と有効化条件

R01で保護対象/脅威/owner、R03で信頼/権限/証拠契約、R04のCI/controller読取機能で対象安全性を受入、R05で書込みworkerの実行/情報隔離、R06以降の新scopeごとに追加受入。

安全性を最後の大型機能にしない。一方、R00へ全新機構を後付けせず、現行で確認された重大欠陥は通常incidentの正規手順で即時是正する。

| 境界 | 対策 | 正負/回復の最低検証 |
|---|---|---|
| authorityと外部入力 | Issue/comment/tool/log/Memoryを非信頼データとして出所保持 | 指示混入でrole/予算/検査条件を変更できない、正常資料は読める |
| actor/権限 | 旧有効policyで認可、scope/期限/代理/失効 | 自己昇格/旧委任replayを拒否、正規引継ぎ可 |
| 実行環境 | 必要最小tool/credential、OSまたはプロセス隔離、制限されたmount/送信 | scope外read/write、symlink/junction、secret送信を拒否 |
| project/reviewer情報 | identity・namespace・retrieval ACL・blind packet | 他projectやauthor履歴を要約/検索経由でも漏らさない |
| receipt/release | trusted issuer/custody、subject/policy/attempt/OS/digest | author製偽receipt、別HEAD/attempt、改変artifact拒否 |
| 外部副作用 | dry-run、明示承認、idempotency、journal、安全停止 | 二重merge/公開/請求を防ぎ、回復不可能な作用をrollback可と表示しない |
| supply chain/CI | 出所/immutable ref/依存risk/資格情報分離 | workflow権限拡大、不明artifact、脆弱性鮮度切れを安全扱いしない |
| 開発されるアプリ | 対象stack/riskに応じたauthn/authz/tenant/input/回復のAC | 正常利用と権限逸脱/別tenantアクセス/不正入力を検証 |

leaseとworktreeは協調用の分離でありsandboxではない。JSON schemaやhashは発行者の正当性の証明ではない。promptの注意やLLM guardは補助でありモデル外認可の代替にはしない。

## 配置/費用

安価な関連差分検査は早期、重いattack/依存full/動的検査はrisk変更・定期・releaseへ。無変更sourceでも依存脆弱性情報、model/SDK/tool/context方式が変われば再評価する。無料/既存toolで基本運用し、特定有料security SaaSを必須にしない。

## BugBot/dispatcher開始前のHARDゲート

- 対象scopeの共通JSON、正規route/PLAN/V-pair、actual readiness、owner/lease/操作認可が実装・受入済み。
- 独立review/admissionの証拠が機械検査され、Bot/controllerが自分のtest/正解/鍵/権限を自己承認できない。
- 停止/中断/ack-loss/retry/terminalが正規経路で閉じ、実行/送信/秘密境界の正負試験が通る。
- 非適用は対象機能が本当に存在しない場合の根拠付き。未実装を非適用にして書込みを許可しない。

## 公開OSSの保守

SECURITY等に実在する非公開連絡方法、影響version、修正/封じ込め、公開判断、回復/残余riskを定義。詳細な漏洩情報や攻撃資料を公開Issueや共有学習corpusへ自動転載しない。件数0を脆弱性0と呼ばず、試験した脅威集合と残余riskを公開判断へ渡す。
