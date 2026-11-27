# v0.2.0-canary.10 リリースノート (下書き)

> 状態: **下書き**。`<TBD>` の値は、公開前に pack-release-runbook.md §3〜§6 の手順で確定させてから埋めてください。公開は PO の承認後です。

- tag: `v0.2.0-canary.10` (prerelease。`latest` は変えません)
- 固定した source の SHA: `<TBD>`
- C1 (Pack の commit) の SHA: `<TBD>`
- C2 (`release/` の manifest) の SHA: `<TBD>`
- ビルド入力の件数: `<TBD>` 件 (`pack-release-runbook.md` §4.1 の照合で、全件 `ok` であったこと)

## 変更点

### 版上げを main root でその場で行えるようになりました (#930)

導入済みの runtime を、新しい版の asset で **main root の中で** 上げられるようになりました。新しい clone を作り直す必要はありません。

- 新しい版の asset 5 つで `setup --solo --consumer-runtime-release` を流し直すと、新しい版へ切り替わります。
- 切り替えは、新しい版の検証と bundle の検証がすべて通った後にだけ行われます。切り替えより前に失敗した場合は、旧版がそのまま動きます。切り替えの後の失敗と、復元できなかった失敗は `consumer_runtime_indeterminate` で止まり、どちらの版が動くかは保証しません (setup-guide.md §3)。
- launcher (`.ut-tdd/bin/ut-tdd.mjs`) は書き換えません。
- 旧版の bundle は消さずに残ります。
- 同じ版を指定した場合は `already-installed` で、何も変わりません。

手順は `docs/reference/setup-guide.md` §3 の「その場で新しい版へ上げる手順」にあります。

### linked worktree からの導入を入口で拒否するようになりました (#2018)

linked worktree の中で `setup --solo --consumer-runtime-release` を実行すると、入口で拒否されます (`worktree_entry_options_invalid`、exit 1)。何も書き込まれません。main root で実行してください。worktree で使う場合は、拒否のメッセージが示す `setup --worktree <worktree の絶対パス>` を使います。

## 既知の制限

- release asset から入れた環境では、`ut-tdd status` の更新通知が動きません (#867)。新しい版は Pack の Releases を Watch して知ってください。
- **linked worktree は版上げの対象外です。** main を上げても、linked worktree は旧版のまま動きます。linked worktree からは版上げできません。worktree の版を main に追従させる手段は、別の Issue で扱います。対応の版は `<TBD>` です。
- **canary.9 以前の版から上げる場合は、launcher の互換を確認してください。** canary.8 と canary.9 の launcher は同一で、互換の条件を満たすことを確認しています。canary.7 以前の launcher との互換は、公開前のリハーサル (AT-CANARY-UPGRADE-001) で確かめます。結果: `<TBD>`。確認が取れるまでは、canary.7 以前の環境では「新しい clone へ入れ直す手順」を使ってください。
- 動作保証は Windows だけです。macOS は検証していません。Linux / WSL2 はベストエフォートです (#928)。
- 新しい clone へ入れ直す手順は、canary.7 から canary.8 への 1 回の実測だけです (#1879)。

## 版上げの注意

- 版上げの手順、残す旧版、エラーの意味は `docs/reference/setup-guide.md` §3 と §5 を見てください。
- 旧版の bundle は消えません。残す世代数の上限と掃除は、まだ決めていません (#481)。
- 戻す手順は定めていません。切り替え後の起動確認と自動の rollback は #481 で扱います。

## 受け入れ手順 (公開前の確認)

公開前に、次を確かめます。結果は公開 Issue のコメントに残します。

1. **Windows で新しい導入**: 新しい空の directory と、origin のある新しい git repository を作り、公開した asset だけで導入します。`setup-guide.md` §1〜§2 の手順で `setup` と `doctor --setup-smoke` を流し、どちらも exit 0 になることを確かめます。手順は `pack-release-runbook.md` §8 のとおりです。
2. **既存の repository での版上げ (canary.7 から)**: canary.7 を入れた既存の repository で、main root の中で canary.10 の asset を使って版上げします。版上げの前後で launcher の bytes が変わらないこと、`status` と `doctor` が成功することを確かめます。
3. **旧 pointer への手動の戻し (受入担当が、受入専用に作って捨てる fixture の中だけで行う)**: 利用中の repository では行わないでください。L12 AT-CANARY-UPGRADE-002 の隔離 fixture の中で、切り替え後に、保存しておいた旧 `active.json` の bytes で pointer を手で戻し、旧版の `status` と `doctor` が動くことを確かめます。手動の戻し手順は設計で定めていないため、この確認は受入の項目として行います。
4. **VS Code の session の確認**: 切り替えをまたぐ session で、cold 1 回と warm 2 回の順で hook の判定を確かめます。計測の手順は、受入テスト設計 (AT-CANARY-UPGRADE-005) とセッション開始の順序の設計 (AT-835-008) に従います。

## 再導入の注意

- 版上げを使えないとき (canary.7 以前からの移行、または版上げが失敗したとき) は、`docs/reference/setup-guide.md` の「新しい clone へ入れ直す手順」を使ってください。
- 未 push の commit は、新しい clone を作る前に push してください。
- 古い clone の `.ut-tdd/` (`.ut-tdd/state/` や evidence) は、新しい clone に引き継がれません。新しい clone へ移す方法は検証していないので、移すことは勧めません (setup-guide.md §3)。古い clone は削除せず、別の directory へ移して残してください。

## 5 つの asset と sha256

| asset | sha256 |
|---|---|
| `v0.2.0-canary.10.tar.gz` | `<TBD>` |
| `v0.2.0-canary.10.tar.gz.sha256` | `<TBD>` |
| `v0.2.0-canary.10.ut-tdd.mjs` | `<TBD>` |
| `v0.2.0-canary.10.consumer-runtime.json` | `<TBD>` |
| `v0.2.0-canary.10.consumer.sha256` | `<TBD>` |

consumer anchor (`sha256:...`): `<TBD>`
