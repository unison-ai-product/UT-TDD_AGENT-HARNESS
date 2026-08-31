---
title: "L7 review author provenance test design (Git facts only)"
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-517-review-author-provenance
updated: 2026-08-31
---

# Review author provenance test design

対になる Forward は `docs/plans/PLAN-L7-517-review-author-provenance.md`、Reverse は
`docs/plans/PLAN-REVERSE-517-review-author-provenance-backfill.md` である。candidate は正式 oracle ID へ
未昇格で、実装 Green を意味しない。唯一の machine authority は同じ repository の Git object facts
(repository identity、OID、parent/tree、author/committer、timestamp、検証済み署名結果) と、その
canonical digest/snapshot である。provider/model/worker/dispatch/family は claim、`human_attested` は
申告事実としてのみ保存する。

## Git facts と受理点 (§3.1/§3.2/§4)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-AUTHPROV-001 | Git object facts が再取得結果と一致する request | facts integrity を受理。reviewer との非同一性はこの slice で証明せず、family claim は判定入力にしない |
| CANDIDATE-U-AUTHPROV-002 | `authorFamily=codex` を `claude` に反転するが Git facts は同一 | facts の判定は変わらない。claim 不一致だけで authority を得ない |
| CANDIDATE-U-AUTHPROV-003 | 002 の逆向き反転 | 002 と同じ。family の双方向 claim は authority にならない |
| CANDIDATE-U-AUTHPROV-004 | facts conflict/欠落と family/provider claim mismatch が同時成立 | facts の `unknown`/deny を先に返し、claim で補完しない |
| CANDIDATE-U-AUTHPROV-005 | deny 済み attempt に merge gate を評価 | merge gate も独立再照合して deny |
| CANDIDATE-U-AUTHPROV-006 | request/receipt/merge が同一 verified Git snapshot | `merge_ready` |

## unknown と backfill (§3.3)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-AUTHPROV-007 | Git facts が無い PR の request mint | mint は成功し typed `unknown` を記録 |
| CANDIDATE-U-AUTHPROV-008 | unknown request の attempt | typed deny。申告値へ fallback しない |
| CANDIDATE-U-AUTHPROV-009 | unknown request の merge gate | `merge_ready` に到達しない |
| CANDIDATE-U-AUTHPROV-010 | receipt 前に human claim を backfill | append はできるが `human_attested` のまま。facts unknown の attempt は deny |
| CANDIDATE-U-AUTHPROV-011 | Git record write failure | 成功扱いにせず unknown |

## 複数 commit と digest (§3.4/§3.5)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-AUTHPROV-012 | 1 PR に複数の Git-recorded author facts | exact multi-author facts として保持し family に丸めない |
| CANDIDATE-U-AUTHPROV-013 | mixed family claim を追加 | Git facts の判定は変わらない |
| CANDIDATE-U-AUTHPROV-014 | commit 群の一部だけ facts あり | unknown/deny。部分的既知で通さない |
| CANDIDATE-U-AUTHPROV-015 | 旧 schema request を読む | 旧 digest を保存し再計算しない |
| CANDIDATE-U-AUTHPROV-016 | 旧 request、verified facts で close | close 可。旧 digest は不変 |
| CANDIDATE-U-AUTHPROV-017 | 新 schema の同一 identity request | version/facts を含む新 digest は旧 digest と一致しない |
| CANDIDATE-U-AUTHPROV-018 | 既存 receipt を新 schema で再検証 | receipt 対応を壊さず digest を再計算しない |

## writer/actor/provider claim の非権威化 (§3.2.1/§3.2.2)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-AUTHPROV-019 | worker が writer/family claim 付き record を自力作成 | writer claim は認証根にならない。facts 欠落なら deny、verified facts の結果は変えない |
| CANDIDATE-U-AUTHPROV-020 | dispatch identity の無い record | identity claim は facts を補完しない |
| CANDIDATE-U-AUTHPROV-021 | 開始/完了 family claim が不一致 | claim は authority を変えない。Git facts mismatch の場合だけ unknown |
| CANDIDATE-U-AUTHPROV-022 | worker の actor claim で backfill | 監査 claim のみ。human/verified に昇格しない |
| CANDIDATE-U-AUTHPROV-023 | dispatch の actor claim で backfill | 022 と同じ。actor claim のみで受理/merge authority を得ない |
| CANDIDATE-U-AUTHPROV-024 | dispatch=codex、worker model=claude | provider mismatch は unverified claim。facts 判定を変えない |
| CANDIDATE-U-AUTHPROV-025 | 未知 model 名 | family を推定せず unverified claim として保存 |
| CANDIDATE-U-AUTHPROV-026 | model alias 表記 | alias 解決しても authority は増えない |
| CANDIDATE-U-AUTHPROV-027 | human/manual commit claim | human claim としてのみ保存し codex/claude に丸めない |
| CANDIDATE-U-AUTHPROV-028 | subagent record に親 dispatch claim が無い | claim 欠落は Git facts を補完しない |
| CANDIDATE-U-AUTHPROV-029 | 複数 worker claim が同じ commit を指す | family を一つに丸めず exact Git facts を保持 |

## collision/replay/mutation/TOCTOU (§3.3.1)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-AUTHPROV-030 | 同一 repo/commit に異なる Git facts record が2件 | conflict として保持し先勝ちにせず deny |
| CANDIDATE-U-AUTHPROV-031 | 別 repository identity の同一 OID record | cross-repo replay を typed deny |
| CANDIDATE-U-AUTHPROV-032 | record の overwrite/delete | deny。訂正は append + supersede のみ |
| CANDIDATE-U-AUTHPROV-033 | issuer/attestation claim の欠落・変更 | claim は authority を作らず、Git facts だけで判定 |
| CANDIDATE-U-AUTHPROV-034 | receipt 後・merge 前の provenance snapshot 差し替え | merge gate が snapshot 不一致を typed deny |
| CANDIDATE-U-AUTHPROV-035 | request/receipt/merge が同一 snapshot | `merge_ready` |

## legacy non-grandfather (§3.4)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-AUTHPROV-036 | 旧 schema を facts 照合なしで close | typed deny |
| CANDIDATE-U-AUTHPROV-037 | 旧 schema の facts が unknown | `unknown_provenance_unresolved` の live/merge-blocking を保持 |
| CANDIDATE-U-AUTHPROV-038 | 旧 schema の facts が verified | close 可、旧 digest は不変 |
| CANDIDATE-U-AUTHPROV-039 | PR #430 型の誤 `authorFamily` claim | grandfather せず exact facts 規則を適用。claim だけで deny/accept を決めない |

## exact contributor facts (§3.5)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-AUTHPROV-040 | reviewer claim が Git-recorded author 文字列と同一 | 文字列一致だけで self-review authority を作らず、既存 review gate の判定を変えない |
| CANDIDATE-U-AUTHPROV-041 | reviewer claim が別の Git-recorded author 文字列と同一 | 040 と対称に、文字列だけで non-author も self-review も確定しない |
| CANDIDATE-U-AUTHPROV-042 | contributor facts に unknown 1件 | typed deny。部分既知で通さない |
| CANDIDATE-U-AUTHPROV-043 | human family claim のみ | identity を作れず unknown/deny |
| CANDIDATE-U-AUTHPROV-044 | reviewer claim が全 Git-recorded author 文字列と異なる | 差異だけで non-author authority を付与せず、family claim も判定に使わない |
| CANDIDATE-U-AUTHPROV-045 | family 多数派へ丸める経路を探索 | 丸め込み経路なし |
| CANDIDATE-U-AUTHPROV-046 | single commit に複数 family claim | claim conflict として保持し Git facts を変更しない |

## receipt、human grade、runtime observation (§3.2.2/§3.3.1)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-AUTHPROV-047 | receipt 発行後に backfill/snapshot を変更 | typed deny |
| CANDIDATE-U-AUTHPROV-048 | worker 子から human backfill を申告 | actor claim は認証されず facts unknown のまま deny |
| CANDIDATE-U-AUTHPROV-049 | human backfill を append し attempt | `human_attested` を伝播するが facts unknown の attempt/merge は deny |
| CANDIDATE-U-AUTHPROV-050 | runtime env/key custody を観測 | trust root にせず、観測だけで authority を与えない |
| CANDIDATE-U-AUTHPROV-051 | human/reviewer family claim が一致 | claim だけで self-review を判定せず、既存の独立 review gate の結果を変えない |
| CANDIDATE-U-AUTHPROV-052 | `human_attested` が `verified` として伝播 | Red。昇格禁止 |

## 実 repo regression

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-P-AUTHPROV-001 | 実 repo の commit 群を解決 | author 文字列から family を導出せず、canonical Git fields のみを記録 |
| CANDIDATE-P-AUTHPROV-002 | PR #430 型の誤 family claim fixture | claim は authority にならず、Git-recorded facts だけで self-review/non-author を決めない |
| CANDIDATE-P-AUTHPROV-003 | wrapper 内外の commit を混在 | provider claim は無視し、Git facts verified/unknown を適用 |

## canonical digest/Git blob mutation design

テスト fixture は canonical field 順、UTF-8、null/array 規則を固定し、digest を payload に戻さない。
対象 commit/tree と canonical record blob を Git object API で再取得して OID/bytes を比較する。working tree、
provider、secret、actor claim を入力にせず、receipt 後の blob/snapshot mutation は 034/047 で deny する。
039、051、052 は family/human claim を mutation しても authority が増えないことを測る。

## Scope guard

本 test-design は docs-only pair-freeze であり、Node generation/runtime verifier、Bun deletion、CI、consumer、
実装 Green、PR 更新を行わない。candidate は Forward/Reverse と同じ番号・同じ oracle を持つ。
