# テスト設計 (候補): CI・検証契約系の未起票 oracle

`docs/design/harness/L6-function-design/ci-verification-contracts.md` と `forward-escape-reentry-merge.md` の未実装契約に対する oracle 候補。実装時に `U-*` へ昇格し、tests 内の citation を必須とする。

| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| `CANDIDATE-U-NFRGATE-001` | NFR gate 9 条件 | (a)〜(i) を 1 件ずつ満たす evidence | 各々対応する finding で fail-close、宙吊り条件 0 |
| `CANDIDATE-U-NFRGATE-002` | 統計判定 | 単発・mean-only・warmup 不足の evidence (verdict=pass) | reject |
| `CANDIDATE-U-NFRGATE-003` | adapter 責務 | adapter が verdict を返す fixture | verdict は gate core だけが決め、adapter 出力は拒否 |
| `CANDIDATE-U-LVC-001` | 必須 field 欠落 | invariant / oracle / evidence_source / verdict_rule / command を各 1 件欠落 | fail-close |
| `CANDIDATE-U-LVC-002` | oracle 実在 (A-189 型) | pair test-design に無い oracle ID を持つ PLAN の confirmed 化 | 拒否 |
| `CANDIDATE-U-LVC-003` | unchecked DoD | unchecked DoD を持つ PLAN の confirmed / merge | 拒否 |
| `CANDIDATE-U-LVC-004` | orphan / claim-only | AC から trace されない oracle、digest・command を持たない evidence | finding 化、evidence と認めない |
| `CANDIDATE-U-LVC-005` | scope (PR #103 型) | 宣言 scope より狭い Green で全体 Green を主張 | 拒否 |
| `CANDIDATE-U-LVC-006` | supersede 双方向 | reciprocal back-reference 欠落 | 拒否 |
| `CANDIDATE-U-LVC-007` | post-merge aggregate | pair test-design の oracle 削除 | 検出し Issue projection へ戻す |
| `CANDIDATE-U-CIRESP-001` | 責務欠落 | 内部/外部どちらにも属さない gate | fail-close |
| `CANDIDATE-U-CIRESP-002` | 外部 skip 禁止 | 内部 green を理由に外部 required context を skip する構成 | detector が拒否 |
| `CANDIDATE-U-CIRESP-003` | 分類不能 | 分類不能な変更種別 | 全 gate 実行へ fall back |
| `CANDIDATE-U-CIRESP-004` | 実測 4 例の回帰 | memory frontmatter / requires_not_ready / runner enum / reviewed_at 順序 | push 前に全件検出 |
| `CANDIDATE-U-CIRESP-005` | 乖離 A | 内部 green→外部 fail | gate 穴として記録・起票 |
| `CANDIDATE-U-CIRESP-006` | 時間予算 | full vitest / full doctor を含む内部 gate | 拒否 |
| `CANDIDATE-U-REENTRY-001` | 三証拠 | 全 drive model で E6 / E8 / E11 のいずれかを欠く | E9 発行不可 / E12 不可 |
| `CANDIDATE-U-REENTRY-002` | stale | target revision 更新・subject commit 不一致・digest 欠落・時刻逆転 | stale / rejected |
| `CANDIDATE-U-REENTRY-003` | impact 未処理 | 未処理 artifact が 1 件でもある | reentry 拒否、backprop route を返す |
| `CANDIDATE-U-REENTRY-004` | replay | 重複 command・順序入替 | state を不正昇格しない |
| `CANDIDATE-U-PRFLOW-001` | 一度だけ | eligible certificate から draft PR を 2 回作る | 1 件 |
| `CANDIDATE-U-PRFLOW-002` | HEAD 一致 | CI run SHA / reviewed SHA / certificate SHA / PR HEAD のどれかを変異 | accept / merge 不可 |
| `CANDIDATE-U-PRFLOW-003` | review 資格 | 同一 provider・FLAG 残存・tests-before-review 違反 | 拒否 |
| `CANDIDATE-U-PRFLOW-004` | 順序 | draft 解除・accept・merge の順序を飛ばす event 列 | terminal success へ到達しない |
| `CANDIDATE-U-PRFLOW-005` | 障害 | timeout 直後の remote 成功・rate-limit・5xx・circuit open・再開 | PR / merge が重複しない |
| `CANDIDATE-U-PRFLOW-006` | merge 直前変化 | force-push・base 更新 | stale 化し古い CI/review を流用しない |
| `CANDIDATE-U-PRFLOW-007` | merge 後退行 | merge 後 main CI failure | off-Forward Issue と Recovery/Incident route を生成 |
| `CANDIDATE-U-EXISSUE-001` | 境界 | 通常 Forward 辺と off-Forward 辺 | 前者は Issue 不要、後者だけ要求 |
| `CANDIDATE-U-EXISSUE-002` | drive 三面 | drive_model 空・未知・技術 drive 混入・三面不一致 | fail-close |
| `CANDIDATE-U-EXISSUE-003` | stale origin | stale `origin_revision_id`、不正な L/state 組合せ | 拒否 |
| `CANDIDATE-U-EXISSUE-004` | 冪等 | command 再送、同一 ID で payload 差分 | Issue 重複なし / 後者は拒否 |
| `CANDIDATE-U-EXISSUE-005` | 障害 | GitHub timeout / rate-limit / 5xx | Ledger event を失わず同一 projection を再開 |
| `CANDIDATE-U-EXISSUE-006` | 本文改変 | Issue 本文から origin / reentry / drive model を除く | 検出 |
