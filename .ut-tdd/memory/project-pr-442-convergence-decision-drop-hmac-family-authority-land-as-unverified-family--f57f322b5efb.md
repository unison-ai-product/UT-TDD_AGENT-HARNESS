---
memory_id: memory:project:pr-442-convergence-decision-drop-hmac-family-authority-land-as-unverified-family--f57f322b5efb
kind: project
title: "PR 442 convergence decision drop HMAC family authority land as unverified_family"
tags: ["convergence", "decision", "pr"]
updated_at: 2026-08-31T08:38:08.037Z
---

# PR #442 収束方針: HMAC 方式を降ろし `unverified_family` で着地させる

7 round 回して blocking が 5 → 2 → 3 と減っていません (canonical request/receipt 実測)。
方式を保ったまま iteration しても閉じないので、**方式側を変えます**。
これは PO 判断ではなく、`PLAN-L7-465` の既存契約から一意に決まる技術判断として決定します
(`ut-tdd advisor --decision progress` = claude-fable-5 に諮り、前提を repo 実測で検証済み)。

## 閉じない理由 (構造)

`d127defa` は検証鍵として

> **検証鍵**: 対称鍵 (HMAC-SHA256) とし、versioned key ring を持つ。既存の
> `src/plan-asset/adapters/hmac-lease-token-key-ring.ts` /
> `hmac-evidence-attestation-authority.ts` /
> `kernel/hmac-evidence-attestation-verifier.ts` を [再利用]

を freeze しています。一方 `PLAN-L7-465` は同じ資産について所有境界節で

> 同期booleanかつ`hmac-sha256`固定の既存`src/plan-asset/ports/evidence-attestation.ts`は変更せず、
> **GitHub信頼根にもprovider-family証明にも使わない**。

と明記し、§信頼根を誇張しない item2 でも
「local JSON/HMAC、同一 OS user が利用できる鍵は provider family の信頼根にしない」
と名指しで禁じています (いずれも逐語確認済み)。

つまり **Sol の blocking 1 / 2 は方式の核に当たっており、iteration では閉じません。**
item4 は充足しうる唯一の方式 (provider 別 GitHub App / bot / OIDC subject) を
「本 freeze では方式を仮決めせず PO の明示承認を得る D3d 境界へ送る」と**既に defer 済み**です。
したがって #442 の中でその方式を採ることもできません。

## 決定

**family authority の主張を降ろし、`unverified_family` で着地させる。**

`PLAN-L7-465` item3 は family の強証明が無い状態を `unverified_family` として**正式に定義**しており、
D3d の live 実測 (run `31163323673` / `31163381133`) も `unverified_family` 終端で closed しています。
これは契約破りではなく sanctioned state です。外部 authority 方式の採用だけが高影響境界
(authentication / authorization) であり、それは item4 が既に別 track へ送っています。

### 具体的な rescope

1. **検証鍵の節を削除する。** HMAC key ring / `hmac-evidence-attestation-authority` の再利用を
   撤回する。`PLAN-L7-465` の所有境界に触れる資産を #442 から外す。
   → Sol blocking 1 が閉じる。
2. **`human_attested` を authority ではなく `unverified_family` の一形態として再定義する。**
   検証不能な family 申告を review authority へ昇格させない。判別 oracle を持たない以上、
   持てるのは「申告があった」という事実の記録だけである、と契約に書く。
   → Sol blocking 2 が閉じる (判別 oracle 不在という指摘自体が解消する)。
3. **機械的に証明できる部分だけを #442 の成果として残す。** authorship の Git 由来事実
   (commit author / committer / tree / trailer の存在) は mechanical binding として有効で、
   item2 に触れません。これを `unverified_family` と組み合わせた形へ契約を縮小する。
4. **Forward / Reverse / test design の worker write/forge 保証の不一致を解消し、
   env-scrub oracle の引用を `CANDIDATE-U-AUTHPROV-047` → `CANDIDATE-U-AUTHPROV-050` へ訂正する。**
   正 ID は `docs/test-design/harness/L7-review-author-provenance-test-design.md:63` で確認済み。
   → Sol blocking 3 が閉じる (これは 1-3 と独立の機械的修正)。

### §3.5 と混在 family PR について

Sol が付記した「§3.5 は混在 contributor PR を unlock しない」は、本 rescope では**そもそも
論点でなくなります**。family authority を主張しない以上、contributor set による reviewer family
の否認も発生しません。混在 PR は `unverified_family` として通常の非著者 review を受けます。
なお当該 PR #492 は既に close 済み (後継 #495) なので、この経路への依存も消えています。

## custody の注意

現 HEAD `d127defa` には canonical request が存在せず、Sol の FLAG/3 は frontmatter 欠落の
memory ファイルにしか残っていません (`ut-tdd memory add` 未経由)。rescope 後は新 exact HEAD に
対して `review live-dispatch` を発行してください。#442 は Claude 著者なので、closing gate は
Codex 側 (`gpt-5.6-sol`) です。

## 優先順位

#442 は Bun 撤去 program (#450 / #470 / #471) を **block しません**。#470/#471 は PO 既決の
Bun permanent ban (#134) 配下で独立に進みます。#442 の rescope はそれと並行で構いません。
