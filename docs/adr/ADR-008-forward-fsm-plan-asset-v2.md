# ADR-008: Forward FSM・PLAN Asset v2・設計由来 detector

- Status: Proposed
- Date: 2026-07-10
- Decision owners: PO / TL
- Related: `PLAN-L0-01`, `PLAN-L4-22`, `PLAN-L4-23`, `PLAN-L4-24`


> **Runtime errata (2026-07-29)**: 本 ADR 本文の Bun 記述は決定当時の実行手段の記録である。
> runtime は PO 決定 2026-07-22 (Bun 永久 BAN、issue #134) と ADR-001 改訂により **TypeScript / Node** へ
> superseded 済み。撤去の段取りは PLAN-L7-462。本文は歴史記録として書き換えない。

## Context

現行 HARNESS は TypeScript/Bun core、SQLite projection、豊富な lint/doctor、Git履歴を持つ一方、Forward の
実績状態を単一の状態機械として保持しない。PLAN status、工程表RAG、gate表、review evidence、trace検査が別々の
parserと判定で動き、設計変更へ detector が手作業で追随する。checked ZIP 比較でも、109 source document、163
semantic item、21 category、8 profile と、baseline `origin/main@71a023b2` のHARNESS target slot 20件が混同され、L8-L14 PLAN不在とnumeric core衝突18群を
greenのまま許すことが判明した。

## Decision

### 1. chassis と engine の境界

TypeScript/Bun、Gitの非破壊履歴、append-only event、SQLite rebuildable projection、既存CLI adapterを継承する。
Forwardの意味、PLAN identity/revision/evidence、文書disposition、G8-G14 gateは全面改修する。互換性は新設計を
歪める制約ではなく、v1 adapter/compatibility projectionとして隔離する。

### 2. Forward は append-only FSM とする

正規状態は次とする。

```text
proposed → planned → pair_freeze_ready → pair_frozen → red_frozen
→ implementing → implementation_complete → trace_freeze_ready → trace_frozen
→ review_ready → reviewed → accepted → archived
```

`blocked|superseded|rejected|reopened` は例外状態であり、理由、actor、対象revision、source commit、evidenceを持つ
transition event がなければ成立しない。現在状態はevent reductionの結果であり、Markdown statusの直接編集を実績正本にしない。

例外遷移は次の意味で固定する。`block`はaccepted/archive以外の正常状態から入り、元状態を`resume_state`に保存する。
`reject`はplanned〜review_readyまたはblockedから入り、元状態を`resume_state`に保存する。`supersede`はreviewed以前の正常/例外状態からreplacement
asset/revisionを指定してterminalへ入る。blocked/rejectedからだけ`reopen`を許し、次の`resume`で記録済み`resume_state`へ
戻す。ただしresume先のguard/evidenceは再評価し、過去passを流用しない。acceptedからはarchiveだけ、archived/supersededは
terminalとし、変更は新revision/assetで開始する。全正常遷移は上記一本道の隣接stateだけを許し、skip transitionを禁止する。
完全なcommand/from/to/guard/finding表はL6 `function-spec.md`を正本とし、実装側のswitch分岐で例外意味を追加しない。

### 3. PLAN は immutable identity と revision を持つ

PLAN Asset v2 は少なくとも `schema_version`、immutable `asset_id`、human-readable `plan_key`、revision、alias history、
artifact ID、dependency asset ID、workflow expected state、evidence policyを持つ。rename/layer変更でidentityを変えず、
意味変更はrevisionを追加する。evidenceは `subject_asset_id + subject_revision + source_commit + digest` に結合する。

### 4. 文書の3集約を分離する

- SourceArtifact: ZIPの番号付き109文書とprovenance
- SemanticItem: catalogの163 item (21 categoryは分類軸)
- HarnessTargetSlot: HARNESSが保守する設計/test/process成果物

dispositionが3集約をjoinする。profileはsize 3種とproduct 5種の直交軸とし、detectorはauthored decisionを推測しない。

### 5. detectorは宣言型設計contractから導出する

L0-L14、G0.5/G1-G14、V-pair、成果物、case family、evidence、exit criteria、defect routing、approval/profileを
機械可読contractに置く。同じvalidated DTOからplan lint、right-arm detector、doctor definition、roadmap obligationを
導出し、重複定数と手書き分岐のdriftをfail-closeする。

## 互換性と移行

- 既存PLANは一括履歴改変せず、決定論的legacy asset IDでv2 DTOへ読み替える。
- 新規PLANと意味変更PLANはv2 authoringを必須化する。
- numeric core衝突18群はmigration ledgerでwinner/loser/new aliasを固定し、恒久allowlistにはしない。
- 現行DB tableとdetectorはcanonical DTO/ledgerへ接続するまでcompatibility projectionとして維持する。
- G8-G14は各層のverify PLAN/evidenceが閉じるまで完了扱いしない。

## 影響

- schema、workflow、CLI、DB、lint/doctor、全docs、L8-L14検証へ波及する大規模変更になる。
- detector数を先に増やすのではなく、上流contractとmigration oracleを先に凍結する必要がある。
- rebuild可能性と履歴非破壊は維持されるが、mutable frontmatterだけで完了を表す運用は段階的に終了する。

## 受入証拠

ADRをAcceptedへ変更する条件は、L4設計とL9 pair review、v1全件migration dry-run、G8-G14 contract completeness、
frontier model family reviewがgreenであることとする。
