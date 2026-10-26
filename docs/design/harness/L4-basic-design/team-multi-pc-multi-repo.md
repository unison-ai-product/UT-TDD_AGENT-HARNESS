---
layer: L4
sub_doc: architecture
artifact_role: topic_team-multi-pc-multi-repo
status: confirmed
pair_artifact: docs/test-design/harness/L9-team-multi-pc-multi-repo-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L9
created: 2026-10-26
updated: 2026-10-26
issue: 1327
related_issues: [1330, 593]
---

# UT-TDD Agent Harness — L4 基本設計: チーム開発・複数 PC・複数 repo の識別子と共有状態

本書は Issue #1327 (チーム開発と複数 PC) と Issue #1330 (1 つのプロダクトを複数 repo で開発) の設計正本である。
2 つの Issue は識別子 (操作者・PC・repo・プロダクト) を共有するので、1 本の文書で凍結する。対になるテスト設計は
`docs/test-design/harness/L9-team-multi-pc-multi-repo-test-design.md` である。

凍結する範囲は次の 6 点に限る。実装の切り方は §10 の後続 sub-issue に回し、関数の型や CLI の細部は本書で決めない。

1. 識別子の形と保存場所 (§3)
2. 共有状態の正本の分類 (§4)
3. repo へ昇格する guard の範囲 (§5)
4. プロダクトの単位と repo の登録 (§6)
5. repo をまたぐ契約の置き場と、参照側の陳腐化の検知 (§7)
6. repo をまたぐ変更の順序の管理 (§8)

本書は `status: confirmed` で PR に載せ、非著者 family の review が PASS するまで merge しない。PLAN は凍結中 (#1166) の
ため、本書は PLAN を参照しない。

## §1 前提

- PO 判断 (2026-10-23): チーム開発・複数 PC (#1327) と複数 repo (#1330) は v4 の必須要件である。
- 社内の consumer project (非公開、以下 A) で次の 3 件がすでに起きている (#1327 / #1330 のコメント、2026-10-23)。
  - 同じ repo を 2 台の PC で進めたところ、PC2 の Codex が PC1 のレビューのチケットを拾い、返事が PC2 の inbox にだけ届いた。
  - 操作者の識別が無く、利用者が会話ごとに slot 番号を渡していた。
  - 同時に動かす数を PC をまたいで数えられない。
  - 面ごと (編集画面・公開 Web・管理画面) の共有部品の正本が無く、PC 用とスマホ用で同一内容のファイルが 15 組重複している。
  - 別 repo の成果物を参照する仕組みが無く、前の repo を丸ごと複製して参照している。
- v4 要件 (候補、`docs/governance/candidates/ut-tdd-concept-v4-requirements.md`) のうち、本書が従うもの:
  - UTV4-FR-004: チケット本文の正本は repo の tracked ファイル。GitHub は一方向の投影で、正本へ読み戻さない。
  - UTV4-FR-005: 同じチケットの二重着手は claim で防ぐ。2 件目の claim は deny。claim は書き込み権限の根拠にしない。
  - UTV4-FR-006: 機械が遷移させる記録は 1 記録 = 1 ファイルの正本。harness.db は正本から作り直せる索引で、DB にしか無い状態は 0 件。
  - UTV4-FR-030: 担当替えは claim の付け替えの記録 (旧 owner・新 owner・理由・引き取り時の HEAD) を伴い、記録の無い引き取りは deny。
  - path lease は V4D-056 で撤回済みである (requests の撤回表、acceptance の撤回表 AC-008 / AC-009)。本書は lease を作らない。
- #593 (利用者・権限 registry) は人間 principal の source を GitHub の login にする。本書の操作者の識別はこれに合わせる。
  本書は識別だけを定め、権限 (authorization) は変えない。権限を変える実装は #593 の規則どおり、着手前に PO の承認を取る。

## §2 現状の実測 (main `909b26c77`、2026-10-26)

| # | 事実 | 根拠 |
|---|---|---|
| 1 | 通知の宛先は `{ scope: "session", provider, sessionId }` の 3 key だけで、人と PC が無い | `src/runtime/claude-provider-envelope.ts:8` (型)、`:108-114` (3 key を検査)。`src/cli.ts:4508` と `src/cli/review-live.ts:358` が組み立てる |
| 2 | 送り手が不明なときの session id は固定値 `cli:unknown-session` | `src/runtime/session-log.ts:277`、`src/skill-engine/recommend.ts:187` |
| 3 | runtime bus は `<gitCommonDir>/ut-tdd-runtime/projects/<namespace>` にあり、clone 単位で worktree 間は共有される。`namespace` は `sha256("ut-tdd-project\0" + repository_identity)` なので、どの PC でも同じ値になる | `src/memory/project-memory-root.ts:46-47`、`:112-114`。wake の `workspaceId` はこの namespace (`src/runtime/claude-memory-wake.ts:277-279`) |
| 4 | `hostname` を使うのは stop refresh の lease だけで、別 host の owner は TTL でしか生存を判定できない | `src/state-db/stop-refresh-coordinator.ts:249`、`:514-515` |
| 5 | repo の識別は tracked な `ut-tdd.project.json` の `repository_identity` (`owner/name`)。decoder は key が 2 個ちょうどの strict v1 で、key を足すと読めない | `ut-tdd.project.json`、`src/kernel/project-identity.ts:216-238` |
| 6 | review の request / receipt / verdict は `.ut-tdd/review/` の PC ローカル custody にあり、他の PC から見えない | `src/feedback/provider-judgment-composition.ts:109`、`src/feedback/post-merge-backstop.ts:146-160` |
| 7 | merge gate はすでに GitHub を読んでいる (`gh pr view --json headRefOid,state,statusCheckRollup`) | `src/feedback/review-merge-gate.ts:566-588` |
| 8 | worktree 削除の guard (#661) は個人の `~/.claude/hooks/worktree-remove-guard.mjs` にあり、repo では gitignore された `.claude/settings.local.json` からだけ登録されている。repo の `.claude/hooks/` には `agent-guard.ts` / `session-log.ts` / `work-guard.ts` しか無い | `git check-ignore -v .claude/settings.local.json` → `.gitignore:3`、`ls .claude/hooks` |
| 9 | Cursor 起床の `wake-cursor-agent.ps1` は `~/.claude/settings.json` の Stop hook、返事の表示 `agent-inbox-check.mjs` は `~/.agent-inbox` を読む個人の仕組みである | `~/.claude/settings.json` の `hooks.Stop`、`~/.claude/hooks/` |
| 10 | 並列 subagent の上限 8 は PC ローカルの記録 (`.ut-tdd/state/agent-slots.json`) で数える | `src/runtime/agent-slots.ts:56` |

git の ref による排他は、ローカルの bare repo で確かめた。2 つの clone から
`git push origin HEAD:refs/ut-tdd/claims/issue-1 --force-with-lease=refs/ut-tdd/claims/issue-1:` を順に実行すると、
1 本目は exit 0、2 本目は `rejected (stale info)` で exit 1 になった (git 2.52.0)。GitHub 実機での同時 push は未検証であり、
L9 の受入 oracle (CANDIDATE-ST-TEAM-004) で確かめる。

## §3 識別子

| 識別子 | 形 | 保存場所 | 決め方 | 解決できないとき |
|---|---|---|---|---|
| 操作者 (`principal`) | `github:<login>` (login は小文字に正規化) | 保存しない。session の開始時に解決し、session の記録に持つ | `gh api user` の login。git の `user.name` / `user.email` は自由に書けるので識別に使わず、表示にだけ使う | claim・review request・宛先付き通知の送信を fail-close (`actor_unresolved`)。読み取りだけの操作は続けてよい |
| AI lane (`lane`) | `{ provider: "claude" \| "codex", session_id }` | 既存の session の記録 | 既存どおり | 既存どおり。ただし PC をまたぐ操作では `principal` と `machine_id` が必須で、`cli:unknown-session` だけの送り手は認めない |
| PC (`machine_id`) | random UUID v4。表示名 `label` は作成時の hostname | `~/.ut-tdd/machine.json` (`{ schema_version: "ut-tdd.machine/v1", machine_id, label, alias?, created_at }`) | 初回に自動で作る。手動の登録は要らない。`alias` (例: `pc1`) は、特定の PC に作業を振り分けたい場合だけ利用者が付ける | ファイルが壊れていたら fail-close し、作り直しの手順を出す (黙って作り直すと別の PC になり、その PC の claim を失う) |
| repo | 既存の `repository_identity` (`owner/name`) | 既存の tracked `ut-tdd.project.json` (strict v1 のまま変えない) | 既存どおり | 既存どおり |
| プロダクト | home repo の `repository_identity` | §6 の `ut-tdd.product.json` | 複数 repo のときだけ宣言する。1 repo のプロダクトは何も書かず、repo = プロダクトとみなす | 宣言の食い違いは fail-close (§6) |

`machine_id` の範囲と使い道を次のとおり限定する。

- 範囲は「PC 上の 1 OS ユーザ」である。同じ PC の WSL や Docker container は別の machine になる。1 つの PC で同じ repo を
  複数 clone する運用は対象外とし、worktree を使う (runtime bus が clone 単位なので、clone が 2 つあると inbox が 2 つに割れる)。
- 使い道は 4 つ: claim の持ち主、宛先付き通知の宛先、PC 単位の同時実行数、stop refresh の lease の持ち主の同定。
  stop refresh の lease は `hostname` の比較を `machine_id` の比較に寄せるが、別 PC の owner の生存判定が TTL であることは
  変わらない (改善するのは持ち主の同定だけ)。
- 同時実行数の上限 8 (表 §2 #10) は PC の資源を守るためのものなので、PC 単位で数える。provider の利用上限 (A の
  「Codex 3 本」など) は provider の account、つまり `principal` 単位の制約であり、§4 の claim から PC をまたいで数えて
  advisory として表示する。上限で止める仕組みは作らない。

## §4 共有状態の正本

共有する状態を、性質で 3 つに分ける。harness.db はどの分類でも投影 (projection) であり、正本にしない。

| 分類 | 対象 | 正本 | PC をまたぐ伝わり方 |
|---|---|---|---|
| 本文 | チケット・設計文書・テスト設計・共有契約 | repo の tracked ファイル (main) | git main を同期点にする (UTV4-FR-004、V4D-068) |
| 排他・一意の調整状態 | チケットの claim、exact head ごとの review request の一意性 | origin の調整用 ref (`refs/ut-tdd/...`) が指す commit の中の JSON 1 ファイル | `git ls-remote` / 明示の refspec での fetch。GitHub の Issue / PR コメントへ一方向に投影する |
| 通知 | 起床・依頼・返事の知らせ | 正本を持たない (通知は事実の伝達路であり、受け手は正本を読み直して判断する) | 宛先付きの Issue / PR コメント |

### §4.1 claim

- ref は `refs/ut-tdd/claims/<ticket>` とする。`<ticket>` は今の運用では `issue-<number>`、tracked なチケット record
  (UTV4-FR-004) に移った後は `ticket-<ticket_id>` とする。ref はチケットの属する repo の origin に置く。
- ref は、`claim.json` だけを持つ commit の鎖を指す。鎖の 1 commit が 1 記録である (UTV4-FR-006 の 1 記録 = 1 ファイル)。
  `claim.json` は `schema_version: "ut-tdd.claim/v1"`、`ticket`、`state` (`claimed` / `transferred` / `released`)、
  `principal`、`lane`、`machine_id`、`machine_label`、`at` を持ち、`transferred` のときは `previous` (旧 principal と旧
  machine_id)、`reason`、`head` (引き取り時の HEAD) を必須にする。
- 操作は次の 3 つで、すべて `--force-with-lease=<ref>:<期待する oid>` による compare-and-swap で ref を進める。
  - claim: ref が無い、または先頭が `released` のときだけ進める。先頭が `claimed` / `transferred` なら deny し、持ち主の
    `principal` と `machine_label` を返す (UTV4-FR-005)。
  - transfer (担当替え): 先頭の oid を期待値にして進める。`reason` と `head` が無ければ deny する (UTV4-FR-030)。
  - release: 持ち主、または PR の merge / close 時に control lane が進める。
- ref は削除しない。鎖そのものが付け替えの監査記録になる。
- claim は書き込み権限の根拠にしない (UTV4-FR-005)。claim の無い編集を止める仕組みも作らない。
- origin に届かないときは claim を fail-close する。手元の編集は止めない。
- harness.db は ref の鎖から作り直せる (DB を消して作り直した前後で、claim の索引が一致する)。
- tracked なチケット record が入った後は、PR の merge 時に鎖の先頭 oid をチケット record に書き、main の上でも claim の
  結末を読めるようにする。
- `refs/ut-tdd/*` は branch の ruleset の対象外で、書き込み権限のある人は削除できる。claim は信頼できる書き手どうしの
  調整であり、安全機構ではない。投影と ref の食い違い (ref が消えた等) は doctor の advisory にする。

### §4.2 review の依頼

- exact head ごとの review request を `refs/ut-tdd/review-requests/pr-<number>/<head sha>` の作成で一意にする。中身は
  依頼者の `principal`・`machine_id` と、ローカル custody に置いた request の digest である。
- 同じ head に 2 本目の request を出すと deny し、既存の依頼者と PC を返す。これで、2 つの PC から同じ head に request を
  出して merge gate が詰まる事態 (#700 と同じ形) を防ぐ。
- review の receipt と verdict は、今は PC ローカルの custody にある (表 §2 #6)。receipt を git の中に置くか外に置くかは
  v4 要件の未確定事項 U-1 であり、本書では決めない。U-1 が決まるまでは、merge は request の `machine_id` の PC で行う。
  別の PC の `ut-tdd pr merge` は `review_custody_on_other_machine` で拒否し、custody のある PC の `label` を返す。
- custody のある PC が失われた場合は、§4.1 の transfer と同じ形 (理由と HEAD を記録) で request を引き取り、新しい
  request を出し直す。

### §4.3 宛先付き通知

- PC をまたぐ通知は、Issue / PR コメントに機械可読の見出し
  `<!-- ut-tdd:notify v1 to-principal=<principal> to-machine=<machine_id> from-principal=<principal> from-machine=<machine_id> -->`
  を付けて送る。
- 受け手の PC は、`to-machine` が自分の `machine_id` と一致し、かつ `to-principal` が自分の `principal` と一致する通知だけを
  ローカルの inbox に取り込む。宛先の無い通知、宛先が一致しない通知は取り込まない。A の運用規則「ラベルの無いチケットは
  拾わない」を機械にしたものである。
- ローカルの inbox の宛先 `{ scope: "session", provider, sessionId }` は変えない。runtime bus が clone 単位なので、PC は
  物理的な置き場で決まる。
- 通知はどの gate の入力にもしない。受け手は通知を合図に、正本 (main・調整用 ref・custody) を読み直す。

## §5 repo へ昇格する guard

判定の基準: repo の内容・他人の作業・共有状態を壊さないための guard は repo へ昇格させる。個人の道具 (特定の editor、
個人の inbox) に依存する仕組みは個人の設定に残す。

| 仕組み | 今の置き場 | 判定 | 昇格先 |
|---|---|---|---|
| `worktree-remove-guard.mjs` (#661: `node_modules` の junction 作成と、`node_modules` が残る worktree の削除を拒否) | `~/.claude/hooks/`、`.claude/settings.local.json` から登録 | 昇格する | repo の Claude hook (`PreToolUse(Bash\|PowerShell)`) と Codex hook。実体は `ut-tdd` CLI の hook として `src/` に置く |
| `wt-remove.sh` (junction を外してから worktree を消す) | `~/.claude/scripts/` | 昇格する | `ut-tdd` の worktree 削除の操作 (既存の worktree lifecycle 設計へ足す) |
| `wake-cursor-agent.ps1` (Cursor の agent を起こす) | `~/.claude/settings.json` の Stop hook | 昇格しない | 個人の editor 連携。repo の起床は既存の `claude-memory-wake` と §4.3 が担う |
| `agent-inbox-check.mjs` (`~/.agent-inbox` の返事を表示) | `~/.claude/hooks/` | 昇格しない | 個人の inbox。PC をまたぐ返事は §4.3 の宛先付き通知に置き換える |

昇格の実装では、`.claude/CLAUDE.md` の Hooks 一覧と `.claude/settings.json` を同時に変える (U-RDRIFT-007 が機械照合する)。
Codex 側で同じ拒否ができない場合は、非対称を明記し、pre-commit または doctor で補う。

## §6 プロダクトと repo の登録

- プロダクトは repo の上位の単位であり、複数 repo のときだけ宣言する。1 repo のプロダクトは何も書かない。
- 複数 repo のプロダクトは、どれか 1 つの repo を home にする (契約だけを持つ repo を home にしてもよい)。プロダクトの
  識別子は home の `repository_identity` である。
- 各 member repo は tracked な `ut-tdd.product.json` を 1 本持つ。`ut-tdd.project.json` は strict v1 のまま変えない
  (表 §2 #5。key を足すと既存の decoder が読めなくなる)。

| repo | `ut-tdd.product.json` の中身 |
|---|---|
| home | `schema_version: "ut-tdd.product/v1"`、`home` (自分)、`product_name`、`members` (member の `repository_identity` の一覧、home を含む)、`contracts` (契約名 → 所有 repo と path)、`pins` (§7) |
| home 以外の member | `schema_version`、`home`、`pins` |

- 登録は双方向で一致させる。home の `members` に載る repo は自分の `home` に home を書き、`home` を書いた repo は home の
  `members` に載る。片側だけの宣言は、その repo の doctor で fail-close する (`product_membership_mismatch`)。
- 他の repo の main にある tracked ファイルを読むのは、正本の参照である。GitHub の Issue / Projects (投影) を読み戻す
  ことではないので、UTV4-FR-004 に反しない。読む方法 (`gh api` か git の fetch か) は実装で決めるが、1 MB を超える
  ファイルでも digest を取れることを受入条件にする (`gh api .../contents` の既定は 1 MB までしか本文を返さない)。
- プロダクト全体の状況 (チケット・WIP・CI・review) は、home の `members` を辿って読むだけの一方向の集約にし、
  鮮度を必ず表示する (V4D-068)。集約は判定の入力にしない。

## §7 repo をまたぐ契約

- 共有契約 (API スキーマ・共通ドメインなど) の正本は、home の `contracts` が指す所有 repo の tracked ファイルである。
  契約だけを持つ repo を作ってもよいが必須にはしない (所有 repo の一種として扱う)。
- 参照する側 (consumer) は、契約の本文を複製しない。自分の `ut-tdd.product.json` の `pins` に
  `{ name, owner, path, sha256 }` を書き、テスト設計や設計文書からは契約名で参照する。`sha256` は所有 repo の blob の
  bytes の sha256 である。commit は rebase や squash で到達できなくなることがあるので、pin の照合には使わない
  (`observed_commit` を参考として書いてよい)。
- 陳腐化の検知: consumer の doctor は、所有 repo の main の現在の blob の sha256 と `pins.sha256` を比べ、違えば
  `contract_stale` を advisory で出す (契約名、pin の digest、現在の digest を示す)。consumer の文書とテストは pin に
  束縛されているので、pin が古いことが、consumer 側の文書とテストが古いことの検知になる。
- 所有 repo で契約を変える PR には、陳腐化する consumer の一覧を advisory で付ける。止めはしない。

## §8 repo をまたぐ変更の順序

新しい順序の記録は作らない。順序は §7 の pin で表す。

- consumer の PR が `pins` を変えるとき、`ut-tdd pr merge` は新しい `sha256` が、所有 repo の main の first-parent の
  履歴のどこかの blob と一致することを確かめる。一致しなければ、前段 (所有 repo の変更) がまだ merge されていないので
  `contract_pin_not_on_owner_main` で merge を拒否する。例: API の変更はサーバー → WEB → アプリの順で、WEB の PR が先に
  来ると止まる。
- 一致した blob が main の現在の内容でなく履歴の中にあるだけなら、merge を許し、`contract_stale` を advisory で出す。
  所有 repo が先へ進んでも、進行中の consumer の PR を一斉に止めない (lockstep にしない)。
- GitHub に届かないときは merge を拒否する (merge gate はすでに GitHub を読んでいる、表 §2 #7)。
- repo をまたぐ作業の見通しは、GitHub の親 Issue と sub-issue で示してよいが、gate の入力にはしない (投影の読み戻しに
  なるため)。
- 互換期間の強制 (consumer の pin が残る間、所有 repo が古い契約を消す変更を止める) は本書では作らない。必要になったら
  §11 の判断として別に扱う。

## §9 採択した判断と却下した案

advisor との相談は 2 回行った (`ut-tdd advisor --decision design --current-model claude-opus-5-5 --execute`、
相談先 `claude-fable-5-1`、2026-10-26)。前提は repo の実測で確かめ、食い違いは実測で突き返した。

| 論点 | 採択 | 却下した案と理由 |
|---|---|---|
| `machine_id` の保存場所 | `~/.ut-tdd/machine.json` の random UUID (表示名 hostname) | hostname のハッシュ: 名前の衝突と改名に弱い。clone 単位 (`<gitCommonDir>/ut-tdd-runtime/`): 既存の置き場に乗るが、PC 単位の同時実行数と stop refresh の生存判定ドメインを表せない (advisor は使い道の定義を条件に (a) を許容した。使い道は §3 に限定した) |
| claim の正本 | origin の調整用 ref が指す `claim.json` の commit の鎖 (CAS) | GitHub の assignee / コメント: 原子性が無く、2 件目の deny (UTV4-AC-008) を保証できない。main の tracked ファイル: claim のたびに PR と review が要り遅すぎる |
| claim と lease の関係 | lease を作らない | advisor の 1 回目は「V4D-056 の path lease と二重機構になる」と反論したが、V4D-056 は lease を撤回した決定である (requests / acceptance の撤回表)。この実測を突き返し、2 回目で advisor が撤回した |
| claim の監査 | ref の commit の鎖に記録し、ref を削除しない | 投影コメントにだけ監査を残す案: 投影は正本へ読み戻さない (UTV4-FR-004) ので、記録の無い引き取りを deny する判定 (UTV4-FR-030) の入力にならない (advisor 2 回目の指摘を採択) |
| claim の期限 | 期限を持たない。解放は release と transfer | TTL・heartbeat: 期限切れ lease の受入 (旧 AC-009) は行ごと廃止されている |
| review の custody | U-1 が決まるまで PC ローカルのまま、request ref に `machine_id` を記録して merge の PC を束縛する | custody の共有をここで決める案: v4 要件の未確定事項 U-1 を本書が先取りすることになる |
| merge gate のネットワーク依存 | 許す (fail-close) | advisor の 1 回目は「merge gate が新たにネットワーク依存になる」と反論したが、`review-merge-gate.ts:566` がすでに `gh pr view` を呼んでいる。突き返し、2 回目で advisor が撤回した |
| member の登録先 | 新しい `ut-tdd.product.json` | `ut-tdd.project.json` に key を足す案: strict v1 decoder (`project-identity.ts:228`) が読めなくなる。GitHub Projects v2 をプロダクトにする案: 投影を正本にすることになる (UTV4-FR-004 / FR-006) |
| 契約の置き場 | home が登録する所有 repo (契約だけの repo も可) | 契約専用 repo を必須にする案: repo が 1 つ増えるだけで、検知の仕組みは同じ |
| pin の形 | blob の sha256 だけで照合 | `<path>@<commit>` で照合する案: 他 repo の commit は rebase / squash で到達できなくなる (advisor 1 回目の指摘を採択) |
| 順序の正本 | 新しい記録を作らず、consumer の pin を merge gate が照合 | home に順序付きの変更記録を置く案: 順序を決めるたびに第 3 の repo へ PR が要る。GitHub の sub-issue / blocked-by を正本にする案: 投影の読み戻しになる (UTV4-FR-004) |
| pin が現在の main に無いとき | 履歴にあれば許して advisory | 現在の main と一致しなければ拒否する案: 所有 repo が先に進むたびに進行中の consumer PR が一斉に止まる (advisor 2 回目の指摘を採択) |

## §10 後続の実装 (sub-issue に分ける)

本書の凍結後に、1 sub-issue = 1 論点で起票する。順序は上から。

1. `machine_id` と `principal` の解決 (§3)
2. 調整用 ref の claim (§4.1) と、その harness.db への投影
3. review request の一意性と custody の PC 束縛 (§4.2)
4. 宛先付き通知の送受信 (§4.3)
5. worktree 削除 guard の repo 昇格 (§5)
6. `ut-tdd.product.json` と双方向の登録検査 (§6)
7. 契約の pin と陳腐化の検知 (§7)
8. merge gate の pin 照合 (§8)

## §11 残る判断

- 互換期間の強制 (§8 末尾) を作るかどうかは、プロダクトの運用方針 (どこまで lockstep を許すか) に属する。本書では
  advisory に留め、A の運用で必要が出たときに PO に諮る。
- 権限 (authorization) は本書で変えない。他人の claim の transfer を誰に許すかを権限として絞る場合は、#593 の
  registry の実装と同時に、着手前に PO の承認を取る。
