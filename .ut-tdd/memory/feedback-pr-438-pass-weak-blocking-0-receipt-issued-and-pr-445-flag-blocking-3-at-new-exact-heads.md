---
memory_id: memory:feedback:pr-438-pass-weak-blocking-0-receipt-issued-and-pr-445-flag-blocking-3-at-new-exact-heads
kind: feedback
title: "PR 438 PASS-WEAK blocking 0 receipt issued and PR 445 FLAG blocking 3 at new exact heads"
tags: ["closing-review", "flag", "pr-438", "pr-445", "receipt"]
updated_at: 2026-08-27T09:13:37.069Z
---

新 exact HEAD への Claude non-author closing review を両方実施し、**canonical receipt を 2 件とも生成**した。
HEAD を進めて古い request を stale_head へ落とす回復手段は正しく機能した (request 削除なし、
PLAN-L7-518 §3.5 遵守)。

## PR #438 — PASS-WEAK / blocking 0

- exact HEAD `2923c66e7431fffe6c41567fd8da7cf5acd7a158`
- receipt digest `aa5de895296cdde17526af2604645d52c8c468940784fcac402be3a7e5fe82c0`
- `reviewerFamily: claude`, `verdict: PASS-WEAK`, `blockingFindings: []`, at `2026-08-27T09:11:24.890Z`

draft のままなので、Codex が draft を外せば `ut-tdd pr merge --pr 438` を実行する。

## PR #445 — **FLAG / blocking 3**

- exact HEAD `33ce0738c1efa6360fa289a8914013ce824cdf3b`
- receipt digest `a512848a9c714000c965cb523dc5dc0d7af434f8c15cf7d59563780c8cab7612`

前 HEAD `345a3691` で weakness として挙げた W1 / W2 が**修正されず、confirmed 契約へ昇格された**ため
blocking へ格上げになった。3 件とも「テストが恒真で mutation 感度が無いのに、機械実測済み契約として
PLAN / test-design に昇格している」という同一の構造。

### blocking 1: `U-PACKISO-007` の pointer/publish deny-0 観測が恒真

`ReleaseAggregateApplyDependencies` (`src/setup/release-aggregate-admission.ts:76-89`) は
snapshotDestination / writeStaging / applyDestination / discardStaging / restoreDestination の
**5 port のみ**で、**pointer / publish port は composition に存在しない**。
`tests/consumer-local-runtime-admission.test.ts:127-146` の `pointerWrite` / `publish` は
harness 自身の `run()` が `if (result.ok)` 配下で呼ぶ test-local fake であり、同 test が
`toMatchObject({ ok:false, phase:"admission", error })` を先に表明している以上、
`toHaveBeenCalledTimes(0)` は ok:false から**論理的に導かれる**。
src/ 側のいかなる mutation でもこの 2 assertion は落とせない。

にもかかわらず本 HEAD は `status: confirmed` の PLAN-L7-496 §契約・§5 と
`docs/test-design/harness/L7-unit-test-design.md` の CANDIDATE-PACKISO-007 行へ
「pointer/publish を全て 0 回」「admission bypass mutation を検出する」を
**機械実測済み契約として昇格**させている。CLAUDE.md / .claude/CLAUDE.md の PLAN claim discipline
(falsifiable な安全性 claim は実 regression test を引用、prose 代替禁止、`coding ≠ substance`) 違反。

**具体的失敗シナリオ**: #414 remote publication が publish port を composition へ追加する際、
admission deny 前に publish を呼ぶ配線を入れても U-PACKISO-007 は緑のまま通過し、
test-design を根拠に「publish の deny 副作用境界は既に enforce 済み」と誤読される。

### blocking 2: `validReceipt` の新規 string 検査が無検証で出荷

`src/setup/consumer-local-runtime-admission.ts:196-204` の `consumerRoot` / `runtimeRoot` string 検査は
本 PR の 8 deny 軸のどれからも到達されず pinning test が無い。これは typed deny 契約に直結する挙動変更:

- 変更前: `receipt.consumerRoot` が非 string の場合 `validIdentity` (identity 4 field のみ検査) を通過し、
  line 287 の productId 比較も抜けて line 291 の `samePath` → `canonicalPath` → `resolve(nonString)` で
  **TypeError を送出**。`installConsumerLocalRuntime` は admission 呼び出しを try/catch していない (line 347) ため、
  この throw は typed `ConsumerLocalRuntimeInstallResult` を返さず top-level へ脱出する。
- 変更後: `identity_mismatch` を返す。

新規 deny 軸「invalid input」(`tests/…:672-676`) は top-level input の consumerRoot/runtimeRoot のみを
null にしており receipt には触れないため、この分岐を通らない。既存 test にも非 string receipt path を
与える case は無い (line 253 / 585 はいずれも string)。よって「throw → typed deny」への転換が
**無検証で確定**され、将来 `validReceipt` から当該 2 行を削除しても全 test が緑のまま退行する。

### blocking 3: 「consumer prior bytes/mode/path/version/history tree 不変」も恒真

write port が全て no-op の `vi.fn()` である以上、admit / deny いずれの結末でも成立し、
deny 分岐の証拠にならない (admission 関数自身の副作用自由度を狭く fence する意味しか持たない)。
結果として U-PACKISO-007 が U-PACKISO-006 (`tests/…:589-605`、既に同一 5 port の 0 回を
deny 軸横断で観測済み) に対して実際に追加した mutation 感度は「invalid input」**1 軸のみ**であり、
「8 独立 deny 軸ぶんの新規 enforcement」という PLAN の記述と実測が乖離している。

## 是正方針 (提案)

1. pointer / publish を **production の composition へ実際に足す** か、composition に無いことを
   契約側に明記して「0 回観測」の主張を撤回する。恒真アサーションを contract claim に昇格させない。
2. `validReceipt` の新規分岐に、**非 string receipt path を与える負 oracle** を 1 本足す。
3. PLAN-L7-496 §5 / CANDIDATE-PACKISO-007 の「8 独立 deny 軸」の記述を実測 (1 軸) に合わせる。
   status: confirmed 済みなので、訂正は successor PLAN + `supersedes` 双方向で行う
   (`doctor plan-supersession` が fail-close する)。
