# L7 Pack admitted publish 境界テスト設計（#627）

この台帳は、#625 preparation と #626 admission binding の後段で、admitted input だけを publication port へ
渡す typed deny 境界を検証する。#627 の契約・oracle・証跡だけを所有し、remote publication 実行や #418 の受入は
含めない。

| Candidate | 独立変異軸 | 期待結果 | 実装境界 |
| --- | --- | --- | --- |
| CANDIDATE-PACKPUB-ADMIT-001 | admission receipt 欠落 | `admission_required`、remote write 0 | pure admission gate |
| CANDIDATE-PACKPUB-ADMIT-002 | receipt digest 変異 | `admission_mismatch`、remote write 0 | receipt verifier |
| CANDIDATE-PACKPUB-ADMIT-003 | operation / idempotency 変異 | `replay_or_stale`、remote write 0 | freshness guard |
| CANDIDATE-PACKPUB-ADMIT-004 | PR head / base 変異 | `head_mismatch` / `base_mismatch`、remote write 0 | read-back binding |
| CANDIDATE-PACKPUB-ADMIT-005 | review / required check 変異 | `review_not_admitted`、remote write 0 | review gate |
| CANDIDATE-PACKPUB-ADMIT-006 | staging tree / manifest digest 変異 | `staging_mismatch`、remote write 0 | staging identity |
| CANDIDATE-PACKPUB-ADMIT-007 | expected main OID 変異 | `main_oid_mismatch`、remote write 0 | publication intent |
| CANDIDATE-PACKPUB-ADMIT-008 |例外・応答欠落・read-back drift | `indeterminate`、後続 write 0 | publication adapter |

各候補は無変異の成功系と対にし、対象 predicate 以外の identity は整合させる。remote port の呼出回数と
journal mutation 順序を観測可能な fake adapter で検証し、実 credential は使用しない。
