---
memory_id: memory:feedback:inbox-absence-never-proves-a-review-request-is-absent-reconcile-open-prs-and-canonical-requests-by-pull-regenerated-with-reproducible-facts--c6484906d373
kind: feedback
title: "Inbox absence never proves a review request is absent: reconcile open PRs and canonical requests by pull (regenerated with reproducible facts)"
tags: ["inbox", "memory-canon", "pull-vs-push", "review-detection"]
updated_at: 2026-09-09T10:47:10.168Z
---

review 依頼の検知を Stop-hook の `[UT_TDD_CLAUDE_INBOX]` 配信だけに依存すると、依頼メモリを伴わずに立った
PR を取りこぼす。2026-09-09 の実例: Codex が PR #546 (`work/add-feature-issue544-memory-inventory`) を
open したが inbox 通知は来ず、PO の指摘まで気づけなかった。

**Why:** inbox は「相手ランタイムが `memory add --notify-claude` を実行したとき」にしか鳴らない push 経路で、
PR の存在そのものを表す正本ではない。正本は GitHub の open PR 一覧と HEAD であり
(`CLAUDE.md` §引き継ぎ・検証の基準点 = HEAD)、push 通知の不在を「依頼が無い」の証明に使うと偽の否定になる。
配信の有無は依頼側の運用に依存して一定しない。

**How to apply:** 非著者 review を待つ側は、セッション中に open PR 一覧と canonical request の実物を
pull で突き合わせる。inbox 通知は補助であって唯一の入口にしない。repo 側に新しい gate や機構は建てない
(未計測のままゲート化しない)。突き合わせは次の 2 本で足りる。

```bash
gh pr list --state open --json number,author,headRefOid,isDraft,title \
  -q '.[]|"#\(.number) \(.headRefOid[0:8]) draft=\(.isDraft) \(.title)"'
```

```bash
# 現 head を指す未消費の canonical request だけを出す (superseded head の残骸を除く)
node -e '
const fs=require("fs");
const open=new Map(require("child_process").execSync("gh pr list --state open --json number,headRefOid -q \x27.[]|\"\(.number) \(.headRefOid)\"\x27").toString().split(/\r?\n/).filter(Boolean).map(l=>l.split(" ")).map(([n,h])=>[Number(n),h]));
const rq=".ut-tdd/review/requests", rc=".ut-tdd/review/receipts";
const done=new Set(fs.readdirSync(rc).map(f=>f.replace(".json","")));
for(const f of fs.readdirSync(rq)){const d=f.replace(".json","");if(done.has(d))continue;
 const j=JSON.parse(fs.readFileSync(rq+"/"+f,"utf8"));
 if(open.get(j.pr)===j.exactHead)console.log("PENDING pr="+j.pr+" head="+j.exactHead.slice(0,8));}'
```

EOD close-out の未 push commit / open PR 確認 (`CLAUDE.md` §定期棚卸し) はこの pull 突き合わせと同じ目的であり、
セッション中も同じ観測を回す。

**注記 (この memory 自体の来歴):** 先行 memory `memory:feedback:review-request-detection-must-pull-open-prs-and-memory-diffs-not-rely-on-stop-hook-inbox-pu` は
同じ規則を述べていたが、「head 5737752d を 02:30Z に open した」と記していた。実測では
`gh pr view 546 --json createdAt` が `2026-09-09T02:03:25Z` を返し、`5737752d` の commit 時刻が
02:30:10Z であって、**PR open 時刻と head commit 時刻を取り違えていた**。規則そのものは正しいが、
名指しした時点事実が再現しないため配送から除外し、本 memory で再生成した。
時点事実を書くときは、その値を再現できるコマンドを併記すること。
