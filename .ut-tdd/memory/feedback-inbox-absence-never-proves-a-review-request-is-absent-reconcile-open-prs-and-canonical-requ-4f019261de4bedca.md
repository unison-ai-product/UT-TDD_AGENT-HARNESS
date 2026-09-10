---
memory_id: memory:feedback:inbox-absence-never-proves-a-review-request-is-absent-reconcile-open-prs-and-canonical-requests-by-shell-free-pull-commands--f45fb1f93609
kind: feedback
title: "Inbox absence never proves a review request is absent: reconcile open PRs and canonical requests by shell-free pull commands"
tags: ["clean-checkout", "inbox", "memory-canon", "pull-vs-push", "review-detection"]
updated_at: 2026-09-10T01:42:11.419Z
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
(未計測のままゲート化しない)。突き合わせは次の 2 本で足りる。いずれも shell 文字列を経由せず
`execFileSync` に引数配列で `gh` を渡すので、Windows (Node の既定 shell = cmd.exe) でも POSIX でも
同じ挙動になる。`.ut-tdd/review/requests/` と `.ut-tdd/review/receipts/` は runtime projection であり
clean checkout には存在しないので、不在は「未消費 request 0 件」として扱う (ENOENT だけを空に読み替え、
権限エラー・JSON 破損・schema 不一致はそのまま fail-close する)。

```bash
# open PR 一覧 (number / head 8 桁 / draft / title)
node -e '
const {execFileSync}=require("child_process");
for(const p of JSON.parse(execFileSync("gh",["pr","list","--state","open","--json","number,headRefOid,isDraft,title"],{encoding:"utf8"})))console.log("#"+p.number,p.headRefOid.slice(0,8),"draft="+p.isDraft,p.title)'
```

```bash
# 現 head を指す未消費の canonical request だけを出す (superseded head の残骸を除く)。
# requests 直下には .md の手書き packet も置かれるので .json だけを読む。
# requests / receipts ディレクトリが無い clean checkout では空として扱う。
node -e '
const fs=require("fs"),{execFileSync}=require("child_process");
const ls=d=>{try{return fs.readdirSync(d)}catch(e){if(e.code==="ENOENT")return [];throw e}};
const fail=message=>{throw new Error("invalid review projection: "+message)};
const text=v=>typeof v==="string"&&v.trim().length>0;
const head=v=>typeof v==="string"&&/^[0-9a-f]{40}$/.test(v);
const request=v=>v&&typeof v==="object"&&text(v.memoryId)&&Number.isInteger(v.pr)&&v.pr>0&&head(v.exactHead)&&text(v.reviewRevision)&&["claude","codex"].includes(v.authorFamily)&&text(v.requestedAt);
const receipt=v=>{if(!v||typeof v!=="object"||!text(v.memoryId)||!Number.isInteger(v.pr)||v.pr<1||!head(v.head)||!text(v.reviewRevision)||!["claude","codex"].includes(v.reviewerFamily)||!["acknowledged","in_review","verdict"].includes(v.kind)||!text(v.at))return false;if(v.kind!=="verdict")return !Object.hasOwn(v,"verdict")&&!Object.hasOwn(v,"blockingFindings");if(!["PASS","PASS-WEAK","FLAG"].includes(v.verdict))return false;if(v.verdict==="FLAG")return Array.isArray(v.blockingFindings)&&v.blockingFindings.length>0&&v.blockingFindings.every(text);return !Object.hasOwn(v,"blockingFindings")||(Array.isArray(v.blockingFindings)&&v.blockingFindings.length===0)};
const open=new Map(JSON.parse(execFileSync("gh",["pr","list","--state","open","--json","number,headRefOid"],{encoding:"utf8"})).map(p=>[p.number,p.headRefOid]));
const rq=".ut-tdd/review/requests", rc=".ut-tdd/review/receipts";
const done=new Set();
for(const f of ls(rc).filter(f=>f.endsWith(".json"))){let r;try{r=JSON.parse(fs.readFileSync(rc+"/"+f,"utf8"))}catch(e){fail(`${rc}/${f}: malformed JSON`)}if(!receipt(r))fail(`${rc}/${f}: receipt schema`);done.add(f.slice(0,-5));}
for(const f of ls(rq).filter(f=>f.endsWith(".json"))){const d=f.slice(0,-5);if(done.has(d))continue;
 let j;try{j=JSON.parse(fs.readFileSync(rq+"/"+f,"utf8"))}catch(e){fail(`${rq}/${f}: malformed JSON`)}
 if(!request(j))fail(`${rq}/${f}: request schema`);
 if(open.get(j.pr)===j.exactHead)console.log("PENDING pr="+j.pr+" head="+j.exactHead.slice(0,8));}'
```

EOD close-out の未 push commit / open PR 確認 (`CLAUDE.md` §定期棚卸し) はこの pull 突き合わせと同じ目的であり、
セッション中も同じ観測を回す。

**注記 (この memory 自体の来歴):** 同じ規則を述べた先行 memory は 3 世代あり、いずれも配送から除外した。
第 1 世代は「head 5737752d を 02:30Z に open した」と記していたが、`gh pr view 546 --json createdAt` は
`2026-09-09T02:03:25Z` を返し、`5737752d` の commit 時刻が 02:30:10Z であって、PR open 時刻と head commit
時刻を取り違えていた。第 2 世代は上記 2 本のコマンドを `execSync` の shell 文字列 (単一引用符の jq 式) で
書いており、Windows では cmd.exe が `|` をパイプと解釈して exit 1 になり「2 本で足りる」が再現しなかった
(加えて requests 直下の `.md` を JSON.parse して落ちる潜在欠陥もあった)。第 3 世代は `execFileSync` 化したが
`fs.readdirSync` を無条件に呼び、requests / receipts が無い clean checkout で ENOENT (exit 1) になった。
時点事実やコマンドを書くときは、その値・終了コードを両 OS かつ clean checkout で再現できる形で併記すること。
