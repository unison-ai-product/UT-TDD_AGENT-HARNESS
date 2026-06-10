# A-129 History Rewrite — Contributor 帰属の unison-ai-product 一本化

Date: 2026-06-10
Status: executed (PO 明示許可「履歴を書き換えて force push して」)

## What / Why

- repo の Contributors に **RetryYN** (個人アカウント) が表示されていた。原因 = 全 259 commit の author email `yoshiyuki0907yn@gmail.com` が GitHub 上で RetryYN に登録されているため。
- PO 判断により **方法 B (履歴書き換え)** を採用: 全 commit の author/committer email を `253932653+unison-ai-product@users.noreply.github.com` へ書き換え (`git filter-branch --env-filter`、author name "yoshiyuki" は不変) → force push。
- 以後の commit も同帰属になるよう repo-local `git config user.email` を同 noreply に設定済み。

## Safety / Rollback

- **書き換え前のフルバックアップ**: `c:\tmp\ut-tdd-pre-rewrite-backup.bundle` (旧 HEAD = `cb2ecf9`)。`git clone ut-tdd-pre-rewrite-backup.bundle` で全履歴を復元可能。
- **全 commit ID が変化**。docs / audit が引用する旧 commit 番号の新旧対応は `.ut-tdd/evidence/history-rewrite-2026-06-10-hash-map.txt` (旧→新、全 259 行) が正本。旧番号を見たらこの map で引く。

## 主要な引用ハッシュの対応 (抜粋、short)

| 旧 | 新 | 引用元の例 |
|---|---|---|
| 86c61fa | (map 参照) | PLAN-L4-13 / handover §2 |
| 0047f5b → f62adbf | | PLAN-L6-22 / handover |
| 154ad8f → d729315 | | IMP-071 hard 化 |
| 50b3749 → da8c10c | | IMP-080/081 |
| 14792e3 → c6615cd | | A-106 (G5 freeze mojibake) |
| 2fb98f0 → 099afa6 | | handover 移行メモ |
| cb2ecf9 (旧 HEAD) | force push 後の新 HEAD | A-128 close |

> 完全な対応は evidence の map ファイルを参照 (本表は人間用の抜粋)。

## 影響しないもの

- ツリー内容・diff・メッセージ・日付は全 commit で不変 (email のみ変更)。
- Co-Authored-By trailer (Claude / Codex) は不変 — Contributors の claude / codex 表示は維持される。
- CI (harness-check) は新 HEAD で再実行される。
