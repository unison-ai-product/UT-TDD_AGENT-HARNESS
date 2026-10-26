---
layer: L4
executed_at_layer: L9
artifact_type: test_design
status: draft
pair_artifact: docs/design/harness/L4-basic-design/team-multi-pc-multi-repo.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
created: 2026-10-26
updated: 2026-10-26
issue: 1327
related_issues: [1330, 593]
---

# L9 テスト設計: チーム開発・複数 PC・複数 repo の識別子と共有状態

`docs/design/harness/L4-basic-design/team-multi-pc-multi-repo.md` の対である。この文書の oracle はすべて候補 (CANDIDATE) で、
まだ実装も実行もしていない。GREEN を意味しない。実装の sub-issue (設計 §10) で `ST-` に昇格する。

受入シナリオは、社内の consumer project (非公開、以下 A) で起きた事例 (設計 §1) を再現する形で書く。

## 実行環境

- **2 PC の模擬**: 1 つの bare repo を origin にし、clone を 2 つ作る。それぞれに別の HOME (`~/.ut-tdd/machine.json` が別) と
  別の `gh` の login を与える。`gh` は fixture の stub で置き換えてよい。
- **2 repo 以上の模擬**: bare repo を 3 つ (サーバー = 契約の所有 repo かつ home、WEB、アプリ) 作り、各 clone を 1 PC に置く。
  他 repo の main を読む経路は fixture で差し替えてよい。
- **GitHub 実機**: CANDIDATE-ST-TEAM-004 と CANDIDATE-ST-MREPO-006 だけは、検証用の GitHub repo に対して 1 回実行し、
  結果 (push の exit code、ref の最終値、取得した digest) を証跡に残す。

## oracle 候補: 人と PC (#1327)

| ID | 対象 (設計の節) | Red (失敗とする状態) | Green (合格とする状態) |
|---|---|---|---|
| CANDIDATE-ST-TEAM-001 | `machine_id` (§3) | 同じ PC・同じ OS ユーザの 2 つの worktree で `machine_id` が違う。`machine.json` が壊れているのに黙って作り直す | `machine.json` が無ければ 1 回だけ作り、以後は全 worktree で同じ値。壊れていれば fail-close し、作り直しの手順を出す |
| CANDIDATE-ST-TEAM-002 | `principal` (§3) | git の `user.name` を書き換えると操作者が変わる。`gh` が使えないのに claim が通る | 操作者は `gh` の login (小文字化) だけで決まる。`gh` が使えなければ claim・review request・宛先付き通知の送信が `actor_unresolved` で止まり、読み取りは続く |
| CANDIDATE-ST-TEAM-003 | 二重 claim の拒否 (§4.1) — A の事例「PC2 が PC1 のチケットを拾う」 | PC1 が `issue-1` を claim した後、PC2 の claim が通る。拒否の理由に持ち主が出ない | PC2 の claim は deny され、持ち主の `principal` と PC1 の `machine_label` が返る。ref の先頭は PC1 の `claim.json` のまま |
| CANDIDATE-ST-TEAM-004 | 同時 claim の原子性 (§4.1、GitHub 実機) | 2 PC がほぼ同時に同じチケットを claim し、両方が成功を返す。ref が後勝ちで上書きされる | ちょうど 1 本だけが成功し、もう 1 本は deny。ref の先頭は成功した側の `claim.json` |
| CANDIDATE-ST-TEAM-005 | 担当替え (§4.1) | `reason` または `head` の無い transfer が通る。transfer で ref の鎖が切れる (旧記録が失われる) | 記録の欠けた transfer は deny。通った transfer は旧 principal・旧 machine_id・理由・HEAD を持ち、鎖を辿ると claim → transfer → release が読める |
| CANDIDATE-ST-TEAM-006 | claim と権限 (§4.1) | claim があることで書き込みが許され、claim が無いことで手元の編集が止まる | claim は編集の可否に影響しない |
| CANDIDATE-ST-TEAM-007 | 宛先付き通知 (§4.3) — A の事例「返事が別の PC の inbox に届く」 | PC1 宛ての通知を PC2 が取り込む。宛先の無い通知をどちらかが取り込む。`cli:unknown-session` だけの送り手の通知が送れる | PC1 宛ては PC1 だけが取り込み、PC2 は取り込まない。宛先の無い通知は誰も取り込まない。`principal` と `machine_id` の無い送り手は送信が止まる |
| CANDIDATE-ST-TEAM-008 | review request の一意性 (§4.2) | 同じ PR の同じ head に、PC1 と PC2 から request が 1 本ずつ立つ。PC2 の `ut-tdd pr merge` が PC1 の custody を見ずに進む、または理由なく詰まる | 2 本目の request は deny され、既存の依頼者と PC が返る。PC2 の merge は `review_custody_on_other_machine` で止まり、PC1 の `label` が返る |
| CANDIDATE-ST-TEAM-009 | 投影の作り直し (§4、UTV4-FR-006) | harness.db を消して作り直すと、claim の索引が変わる、または欠ける | 作り直しの前後で claim の索引が一致する (入力は調整用 ref の鎖だけ) |
| CANDIDATE-ST-TEAM-010 | origin に届かないとき (§4.1) | origin に届かないのに claim が成功を返す。手元の編集まで止まる | claim は fail-close し、手元の編集は止まらない |
| CANDIDATE-ST-TEAM-011 | guard の repo 昇格 (§5) | 個人の `~/.claude` を持たない新しい clone で、`node_modules` への junction の作成や、`node_modules` の残る worktree の削除が通る | repo の hook だけで両方が拒否される。Codex 側は同じ拒否、または明記した非対称と補う検査の記録がある。`.claude/CLAUDE.md` の Hooks 一覧と `.claude/settings.json` が一致する |
| CANDIDATE-ST-TEAM-012 | 同時実行数の表示 (§3) — A の事例「PC をまたいで数えられない」 | provider ごとの claim 中の数を、PC をまたいで数えられない | 同じ `principal` の claim を provider ごとに PC をまたいで数えて表示する (止めはしない)。上限 8 は PC 単位で従来どおり |

## oracle 候補: repo とプロダクト (#1330)

| ID | 対象 (設計の節) | Red (失敗とする状態) | Green (合格とする状態) |
|---|---|---|---|
| CANDIDATE-ST-MREPO-001 | 1 repo のプロダクト (§6) | `ut-tdd.product.json` の無い repo で、プロダクトに関する検査が失敗や警告を出す | 何も宣言しない repo では、プロダクトの検査が何も出さない |
| CANDIDATE-ST-MREPO-002 | 双方向の登録 (§6) | home の `members` に載らない repo が `home` を宣言しても通る。逆に、home の `members` に載るのに自分の `home` を書かない repo が通る | どちらの片側宣言も、その repo の doctor で `product_membership_mismatch` の fail-close になる |
| CANDIDATE-ST-MREPO-003 | 陳腐化の検知 (§7) — 片側の契約変更で他方の陳腐化を検知する | サーバーが契約を変えて main に入れた後も、WEB の doctor が何も出さない | WEB の doctor が `contract_stale` を出し、契約名・pin の digest・現在の digest を示す |
| CANDIDATE-ST-MREPO-004 | 順序違反の merge を止める (§8) | サーバーの契約変更が main に入る前に、新しい digest を pin した WEB の PR が merge される | WEB の merge は `contract_pin_not_on_owner_main` で拒否される。サーバーの PR が merge された後は、同じ WEB の PR が merge できる |
| CANDIDATE-ST-MREPO-005 | lockstep にしない (§8) | サーバーが契約をさらに進めた後、1 つ前の digest を pin した進行中のアプリの PR が merge できない | 1 つ前の digest が所有 repo の main の first-parent の履歴にあれば merge でき、`contract_stale` が advisory で出る |
| CANDIDATE-ST-MREPO-006 | 大きな契約 (§6、GitHub 実機) | 1 MB を超える契約ファイルの digest が取れず、陳腐化の検知や pin の照合が黙って通る | 1 MB を超えるファイルでも正しい sha256 が取れる。取れなかったときは fail-close する |
| CANDIDATE-ST-MREPO-007 | GitHub に届かないとき (§8) | 所有 repo の main を読めないのに、pin を変えた PR の merge が通る | merge は拒否され、理由が読めなかったことを示す |

## 受入の組み合わせ

| A の事例 (設計 §1) | 確かめる oracle |
|---|---|
| PC2 の Codex が PC1 のレビューのチケットを拾った | CANDIDATE-ST-TEAM-003、CANDIDATE-ST-TEAM-004、CANDIDATE-ST-TEAM-008 |
| 返事が PC2 の inbox にだけ届いた | CANDIDATE-ST-TEAM-007 |
| 操作者の識別が無く、slot 番号を手で渡していた | CANDIDATE-ST-TEAM-001、CANDIDATE-ST-TEAM-002 |
| 同時に動かす数を PC をまたいで数えられない | CANDIDATE-ST-TEAM-012 |
| 共有部品の正本が無く、PC 用とスマホ用で重複 | CANDIDATE-ST-MREPO-003 (repo 分割後。1 repo の中の面どうしの重複は本書の範囲外) |
| 別 repo の成果物を複製して参照している | CANDIDATE-ST-MREPO-002、CANDIDATE-ST-MREPO-003 |
| (新しい repo 分割後) サーバー → WEB → アプリの順の変更 | CANDIDATE-ST-MREPO-004、CANDIDATE-ST-MREPO-005 |
