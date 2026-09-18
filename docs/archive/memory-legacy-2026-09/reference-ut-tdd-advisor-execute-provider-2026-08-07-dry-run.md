---
memory_id: memory:reference:ut-tdd-advisor-execute-provider-2026-08-07-dry-run
kind: reference
title: "ut-tdd advisor --execute が両 provider とも無応答 (2026-08-07 実測、dry-run は正常)"
tags: ["advisor", "escalation", "incident", "routing"]
updated_at: 2026-08-07T12:01:01.076Z
---

`ut-tdd advisor --execute` が 2026-08-07 の Claude セッションで**両 provider とも無応答**だった。
dry-run (routing 計算) は正常に返るが、実 spawn が返らない。

## 実測

| 試行 | decision | provider/model | 結果 |
| --- | --- | --- | --- |
| 1 | progress | claude / `claude-fable-5` (effort low) | 15 分でタイムアウト、stdout/stderr とも空 |
| 2 | implementation | codex / `gpt-5.6-sol` (effort low) | 7 分でタイムアウト (exit 124)、stdout/stderr とも空 |

dry-run は正常:

```
$ node src/cli.ts advisor --decision progress --current-model claude-opus-5 --task "..."
advisor: provider=claude model=claude-fable-5 effort=low mode=adversarial decision=progress ... dry-run
  - dispatch: command=claude args=[--print --input-format text --model claude-fable-5 --effort low]
  - fallback on response error: provider=codex model=gpt-5.6-sol effort=low
```

`.ut-tdd/logs/session/advisor-*.jsonl` に**新規ログが書かれない** (最新は 09:02 の別 PLAN 分)。
つまり発火前段で止まっており、routing ではなく子プロセス spawn / 応答待ちが原因。

## Why

CLAUDE.md §PO 判断への反射的エスカレーション禁止 は「PO 判断必須」と書く前に advisor を通すことを
求めるが、**advisor 自体が使えないときの扱いを実行時に判断できる必要がある**。規定は
「Fable/Sol の双方が利用不能なら相談 attempt と failure を記録し、判断を捏造しない。高影響境界は
advisor unavailable の証跡を添えて PO へ上げる。高影響境界に該当せず既存契約から一意に決まる判断は
継続」である。

## How to apply

- advisor が無応答でも**待ち続けない / 別形式で再起動しない**。1 provider あたり 1 回、上限付きで
  試し、失敗したら本メモリのように記録する。
- 記録したうえで、判断が (1) 高影響境界 (authentication/authorization、production infra、
  destructive、payment、PII、secret、licensing、外部 API 前提) に該当するか、(2) 既存の層・責務・
  契約から一意に決まるか、で仕分ける。(2) なら継続し、根拠となる契約条文を引用する。
- **「advisor が使えない」を PO 判断への転送理由にしない。** 高影響境界に該当する場合だけ、
  unavailable の証跡を添えて上げる。
