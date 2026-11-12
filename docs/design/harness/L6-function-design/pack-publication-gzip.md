---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_pack_publication_gzip
pair_artifact: docs/test-design/harness/L7-pack-publication-gzip-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
issue: 881
---

> **L6 contract marker**: `compressPackTar(tar) => Buffer` は unit-test-granularity contract である (未実装の目標契約。関数名は実装で変えてよい)。本書は gzip 層の方式 (パラメータ 4 つの明示、header 10 byte の固定、literal golden と toolchain identity の 2 検査) を凍結する。pre: 入力は ustar の tar bytes。post: 出力は標準の gzip で、gunzip の結果が入力と byte で一致し、同一入力は承認済み toolchain で byte が一致する。invariant: 公開済み release の anchor は変えない。oracle は `docs/test-design/harness/L7-pack-publication-gzip-test-design.md` の `CANDIDATE-U-PACKASSET-007`〜`CANDIDATE-U-PACKASSET-015` が固定する (正式 ID `U-PACKASSET-*` への昇格は、実装 PR が Red テストと同時に行う)。

# Pack publication tar.gz の圧縮方式

## 1. 目的と境界

Pack の公開 asset `ut-tdd-pack-<version>.tar.gz` は、`src/setup/pack-publication-assets.ts` の
`fixedGzip` が作る。現行の `fixedGzip` は deflate の stored ブロック (BTYPE=00) だけで gzip を
組み立てるため、tar とほぼ同じ大きさになる。本書は、決定性を保ったまま圧縮する方式を定める。

本書が決めるのは gzip 層だけである。tar 層 (ustar header、mode、path 分割、末尾のゼロ 2 ブロック)、
asset の名前、checksum ファイルの形式、inventory digest の導出は変えない。

実装は本書の契約を対にする L7 oracle (`docs/test-design/harness/L7-pack-publication-gzip-test-design.md`。
共有の `L7-unit-test-design.md` には足さない) を先に Red にしてから行う。本書の確定は契約の確定であり、実装の開始は oracle を `CANDIDATE-U-` から正式 ID へ昇格する Red テストが先に入ることを条件とする。

## 2. 事実 (2026-11-12 実測、Issue #881)

| 項目 | 値 |
| --- | --- |
| 現行の公開 asset | `v0.2.0-canary.7.tar.gz` 11,698,065 byte (展開後 tar は 11,697,152 byte、圧縮率 -0.0%) |
| canary.3 の公開 asset (Issue 記載値) | 2,604,689 byte (システムの gzip 由来) |
| 方式 B の出力 | 同じ tar を level 9 で圧縮して 2,683,218 byte (tar の約 22.9%、約 4.36 倍小さい)、gunzip で元の tar と一致 |
| 処理時間 | 約 1.3〜1.5 秒 (Windows、同じ入力で 2 回) |
| 同一環境の再現 | Windows で 2 回、Linux (WSL) で 2 回、それぞれ全 byte が一致 |
| 環境差 | Windows は Node 24.22.3 / zlib `1.3.2.1-motley-285e94b`、Linux は Node 24.13.0 / zlib `1.3.1-470d3a2`。zlib の版が異なるが、gzip header の OS byte (byte 9。Windows `0a`、Linux `03`) を `ff` へ置き換えると全体の SHA-256 が一致した (`82c74372dbd448835b23ea2ed1043f47a63b99bf4c3868de9d915d9f2de8a820`) |

方式 B の測定パラメータは `level 9 / memLevel 9 / windowBits 15 / Z_DEFAULT_STRATEGY` である。

測定の範囲と限界:

- 入力は canary.7 の tar 1 件だけである。ほかの入力や、ほかの Node / zlib の版での一致は確かめていない。
- 2026-10-09 に Codex lane が、canary.6 の tar (Windows Node 24.13.0 と WSL Node 24.13.0、同じ zlib `1.3.1-470d3a2`)
  で同様に一致することを測っている (Issue #881 のコメント)。今回の測定は、zlib の版が異なる 2 環境でも
  一致した点が追加の事実である。
- リポジトリの Node pin は `>=24.22.1 <25` (`package.json` `engines.node`、`.node-version` は 24.22.1) であり、
  Issue 起票時の 24.13 ではない。pin の範囲内でも zlib の版は動き得る。
- CI での Linux / Windows 実測は未実施である。本書の契約が要求する受入証拠 (§5) として、実装 PR で取る。

## 3. 選択肢

| 案 | 内容 | 長所 | 短所 |
| --- | --- | --- | --- |
| A | stored ブロックを仕様として維持し、大きさを文書に書く | 変更なし。deflate の実装差に依存しない | 配布が約 4.4 倍。Issue の指摘が解消しない |
| B | `node:zlib` の gzip を、4 つのパラメータと header の OS byte を固定して使う | 実装は数行。保守は Node に任せる。実測で約 4.4 倍小さく、2 環境で一致 | 出力は zlib の実装に依存し、zlib の版が変わると byte が変わり得る。変わらないことの保証は無い |
| C | 決定的な deflate を自前で実装する | zlib の版に依存しない | 実装と保守の費用が大きい。最小実装の原則に反する。圧縮率の検証も自前で負う |

## 4. 判断

方式 B を採る。A は Issue の問題を残す。C は費用に見合わない。B の弱点 (zlib の版依存) は、
再現性を前提にせず、版の変更を検知する検査と、公開済み release を変えない運用で受ける。

### 4.1 契約

1. **パラメータを明示する**。`level: 9`、`memLevel: 9`、`windowBits: 15`、
   `strategy: Z_DEFAULT_STRATEGY` を、呼び出しで毎回明示する。Node の既定値に任せない。4 つの options は、`node:zlib` の `gzipSync` を呼ぶ唯一の呼び出し点へ 1 つの options object として渡す (別の呼び出し点や、options の分割・後付けを作らない)。`windowBits` と `strategy` は省いても出力 byte が変わらないため (2026-11-12 実測、L7 テスト設計 §3)、golden では明示を検査できず、この呼び出し点で options を観測する oracle (`CANDIDATE-U-PACKASSET-015`) が検査する。`compressPackTar` の引数と戻り値は変えない。
2. **header の固定**。mtime=0、XFL=2 (level 9 の値)、OS=255 (unknown) とする。`gzipSync` の素の出力は
   OS byte が実行環境で異なる (Windows `0a`、Linux `03`) ため、byte 9 を `ff` へ置き換える。
   置き換えは出力の先頭 10 byte だけを対象とし、deflate 本体と trailer (CRC-32 と ISIZE) は変えない。
   現行の header (`1f 8b 08 00 00000000 00 ff`) とは XFL の 1 byte だけが異なる。現行の XFL は 0 であり、
   本書はそれを 2 へ改める。FLG は 0 (名前・コメント・extra なし) のままとする。
3. **検査を 2 つに分ける**。
   - 固定入力の literal golden digest: 固定の tar bytes を入力に、gzip と checksum と inventory の
     digest を literal で照合する (現行 `tests/pack-publication-assets.test.ts` の形)。
   - producer の toolchain identity の検査: `process.version` と `process.versions.zlib` を、期待する
     値の集合と照合する独立した検査を、既存のテスト面に置く。
   golden digest だけでは zlib の版の変更を検知できない (出力が偶然同じなら通る)。逆に版の検査だけでは
   出力の変更を検知できない。2 つは別の失敗を捉えるため、片方で他方を代替しない。
4. **主張しないこと**。上の toolchain identity の検査は、テストを実行した環境の版を示すだけであり、
   公開 asset を圧縮した時点の producer の provenance を直接証明しない。契約はその保証を主張しない。
   新しい receipt の schema は作らない。
5. **公開済み release の扱い**。公開済みの release (stored の gzip を含む) の anchor、checksum、
   inventory digest は更新しない。公開済みの release は、旧生成コードで再現できる状態を保つ。新方式を使うのは、
   新方式を取り込んだ版以降に作る新しい release だけである。tar の内容が同じでも、gzip の bytes が
   変わるため checksum と inventory digest は変わる。
6. **受入の前提**。旧 stored の gzip と新 compressed の gzip の両方を consumer 側の updater が受け入れることは、
   #930 の契約の pair が定める。本書はその受け入れを前提にするだけで、updater の挙動は定めない。
7. **gunzip の互換**。出力は標準の gzip であり、標準の gunzip で展開した tar が、無圧縮の版と byte で一致すること。
8. **保証の範囲**。byte の一致は「承認済みの toolchain (Node と zlib の版の集合)」の中だけで契約する。任意の版で
   同じ byte になることは主張しない。承認済みの集合に無い版では、release の生成は止まる。
9. **版を上げるとき**。golden を自動で更新しない。byte の差、展開結果、環境間の一致を review して承認してから更新する。

### 4.2 しないこと

- tar 層、asset 名、checksum の形式、inventory digest の導出式は変えない。
- canary.7 の必須条件にしない。#930 と独立した変更として扱い、順序は control が決める。
- stored 方式の関数は、旧 release の再現に必要な範囲で残す。新 release の生成だけを新方式に切り替える
  (旧 release の再現を、旧 commit の checkout に任せるか、関数を残すかは実装 PR で決め、PR 本文に書く)。

## 5. 受入証拠

実装 PR は次を満たす。

1. Windows と Linux の CI で、固定入力の gzip bytes が literal golden と一致する。
2. 同じ入力から同一環境で 2 回作った gzip が byte で一致する。
3. 展開した tar が、元の tar と byte で一致する。
4. zlib 版の検査が、期待する版の集合から外れたときに赤になる。
5. 圧縮後の大きさが、stored の版より小さい (実測値を PR 本文に書く)。

## 6. 相談の記録

- 2026-10-07 外部監査の推奨: Node の pin と level の固定、再現性の回帰テスト。自前の deflate は非推奨。
- 2026-10-09 control (advisor `gpt-6.1-sol` を踏まえた決定、Issue #881 のコメント): 方式 B。pin と level の固定で
  再現性が保証される、という前提は成り立たない。そのため上の 3 と 4 を契約に書く。
- 2026-11-12 本書の起草時の advisor 相談: §7 に記録する。

## 7. advisor 相談の結果

相談先は `gpt-6.1-sol` (codex、`ut-tdd advisor --decision implementation`、exit 0)。質問には §2 の実測値と §4.1 の案を載せた。

回答の要約:

- B を条件付きで採る。C を選ぶ根拠は不足している。契約は「任意の Node / zlib の版で同じ byte」ではなく、
  「承認済みの toolchain で同じ byte」と書く。
- 固定パラメータと header の正規化だけでは、zlib 更新後の byte の一致は保証できない。2 環境での一致は
  有力な観測だが、将来の版への保証ではない。
- `process.versions.zlib` と Node の版の検査は環境の変更を検知するだけで、同じ版でもビルドの差は識別しきれない。
  release 用の Node 配布物も固定する。
- 小さな literal golden は番兵にすぎない。32 KiB の窓を越える、反復と非反復を含む固定 fixture も要る。
- release gate では承認済みの版を独立に検査し、実際の固定 tar を Windows と Linux で生成して digest を比べ、
  未知の版では止まる。版を上げるときは golden を自動で更新せず、byte の差・展開結果・環境間の一致を review して承認する。
- #930 の updater が旧 stored と新 compressed の両方を扱うことが未検証なら、導入の前提が成り立たない。

前提の照合: advisor が前提とした実測値 (2 環境の一致、圧縮率、時間) は、本書 §2 の実測と同じである。
advisor の「小さな golden では足りない」は、本書の当初案 (§4.1 の 3) に無かったため採り入れた。
「release 用 Node 配布物を固定する」は、本リポジトリの pin が `>=24.22.1 <25` の範囲であり、
範囲内でも zlib の版が動き得るという §2 の事実と整合する。ただし配布物のハッシュ固定の仕組みは
本書では定めず、実装 PR 前に control が判断する (未決として §8 に置く)。

## 8. 判断の記録

- **採用**: 方式 B。理由は、圧縮率が約 4.4 倍で、実装が数行で済み、実測した 2 環境 (zlib の版が異なる) で
  header の OS byte を正規化すると byte が一致したため。A は問題を残し、C は最小実装の原則に反する。
- **advisor の助言の採否**: 契約の保証範囲を「承認済みの toolchain」に限る (採用、§4.1 の 8)。
  大きな固定 fixture を golden に加える (採用、`CANDIDATE-U-PACKASSET-007`)。版を上げるときに golden を自動更新しない
  (採用、§4.1 の 9)。#930 の両形式対応を前提にする (採用、§4.1 の 6)。
  Node 配布物の固定は、下の決定で追加不要とした。
- **未決 (下の決定で解消)**: 承認済み toolchain の版の集合の具体値と置き場、Node 配布物の固定の要否。
- **未検証**: 他の入力、他の Node / zlib の版での一致。CI 上の Linux と Windows での一致。
- **決定 (control、2026-11-12、PR #1654 コメント)**: 承認済み toolchain は既存の Node の固定 (`.node-version`、`package.json` の engines、`docs/governance/node-toolchain-provenance.json` と registry、`src/lint/toolchain-pin.ts` が照合する値) そのものとし、gzip 用の別の版の一覧と追加の Node 配布物の固定は持たない (二重管理を避ける。sealed の Node は provenance で archive と member の sha256 まで固定済みで、zlib はその Node に同梱される)。Node の固定を上げる PR で golden digest の検査が赤になったら、golden を自動では更新せず、その PR の中で差分を確かめてから手で更新する。
