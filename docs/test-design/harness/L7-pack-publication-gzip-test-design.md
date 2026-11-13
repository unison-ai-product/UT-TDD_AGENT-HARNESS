---
title: "L7 Pack publication gzip 圧縮 テスト設計"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/pack-publication-gzip.md
status: confirmed
updated: 2026-11-12
issue: 881
---

# Pack publication gzip 圧縮 テスト設計 (issue #881)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/pack-publication-gzip.md` (§4.1 の 1〜7、§5) である。
共有の `docs/test-design/harness/L7-unit-test-design.md` には行を足さない (別 lane が分割・縮小中のため)。
本書が `CANDIDATE-U-PACKASSET-007`〜`CANDIDATE-U-PACKASSET-015` の正本である。既存の `U-PACKASSET-001`〜`006` は共有の L7-unit-test-design.md に
あり、ここへ複写せず ID で参照する。

`U-PACKASSET-002` の「stored-block gzip bytes」と `U-PACKASSET-005` の gzip header の固定 byte は、新方式の
release に対しては下表が置き換える (XFL が 0 から 2 へ変わる)。共有の L7-unit-test-design.md 側の
`U-PACKASSET-002` の stored-block 前提が新契約で置き換わる旨の改訂は、実装 PR が、別 lane の縮小が終わった
あとに行う (本 PR は共有文書を変えない)。旧 stored 方式の release を再現する検査は、旧生成コードに対して残す。
下の ID は、実装 PR の先頭で `it.fails` の Red として入れる。

## 2. oracle

| ID | fixture / mutation | expected |
| --- | --- | --- |
| `CANDIDATE-U-PACKASSET-007` | 固定の tar bytes (65536 byte 超で、32 KiB の窓を越える、反復と非反復の entry を含む) | gzip bytes と checksum と inventory digest が literal golden と一致する。Windows と Linux で同じ literal を使う |
| `CANDIDATE-U-PACKASSET-008` | 同じ入力を同一環境で 2 回、別の呼び出しで圧縮する | 2 回の gzip が byte で一致する |
| `CANDIDATE-U-PACKASSET-009` | 出力の先頭 10 byte | `1f 8b 08 00 00 00 00 00 02 ff` を直接照合する。OS byte (byte 9) は実行環境に依らず `ff`。mtime=0、FLG=0 |
| `CANDIDATE-U-PACKASSET-010` | `gunzipSync` で展開 | 展開した tar が入力の tar と byte で一致する。圧縮できる入力に対して出力が入力より小さい (stored だけではない) |
| `CANDIDATE-U-PACKASSET-011` | `level` / `memLevel` / `windowBits` / `strategy` のいずれか 1 つを、契約と異なる値へ単独で変える mutation | `CANDIDATE-U-PACKASSET-007` の literal golden が赤になる。4 つそれぞれで検査する。これが示すのは「固定した toolchain で出力 byte が契約の値で作られたものと一致する」ことだけで、4 つのパラメータが毎回明示されていることは示さない (§3 の実測を参照) |
| `CANDIDATE-U-PACKASSET-012` | producer の toolchain identity: `process.version` と `process.versions.zlib` | 期待する版の集合と照合する独立のテスト。集合外の値を注入すると赤になり、release の生成は止まる。版を上げるときに golden を自動更新しない。公開 asset を作った時点の provenance を証明しないと明記する (§4.1 の 4) |
| `CANDIDATE-U-PACKASSET-013` | 公開済み release の anchor (stored の gzip を含む既存の digest) | 変更されない。新方式の導入で既存 anchor の literal が書き換わっていないこと (既存 golden の差分 0) |
| `CANDIDATE-U-PACKASSET-014` | Windows と Linux の CI job の出力 digest | 同じ固定入力から同じ gzip digest になる。片方の環境だけでは通らない |
| `CANDIDATE-U-PACKASSET-015` | 圧縮の唯一の呼び出し点 (`node:zlib` の `gzipSync`) に渡る options object を、`vi.mock("node:zlib")` の pass-through spy で観測する。`compressPackTar` の引数と戻り値は変えない | spy が 1 回だけ呼ばれ、options が `level: 9` / `memLevel: 9` / `windowBits: 15` / `strategy: Z_DEFAULT_STRATEGY` の 4 つを own property として持ち、値が契約と等しい。header 正規化は呼び出しの外 (出力の先頭 10 byte の置換) で行う。mutation は 4 つ (`level` を省く / `memLevel` を省く / `windowBits` を省く / `strategy` を省く) で、それぞれこの oracle が赤になる。`windowBits` と `strategy` の省略は出力 byte を変えないため、`CANDIDATE-U-PACKASSET-007` では検出できず、この oracle だけが検出する |

## 3. golden だけでは足りない理由 (2026-11-12 実測)

70000 byte 級の入力 (反復と非反復を含む) を同じ環境で、4 つのパラメータを揃えた場合を基準に、1 つずつ省いて `gzipSync` した結果 (Node v24.22.3、zlib `1.3.2.1-motley-285e94b`):

| 省いたパラメータ | 出力が基準と byte 一致するか |
| --- | --- |
| `level` | 一致しない (既定の level 6 になり、XFL と deflate 本体が変わる) |
| `memLevel` | 一致しない (既定は 8) |
| `windowBits` | 一致する (既定が 15) |
| `strategy` | 一致する (既定が `Z_DEFAULT_STRATEGY`) |

`windowBits` と `strategy` を暗黙の既定値へ戻す退行は、出力 byte を変えないので literal golden では検出できない。`CANDIDATE-U-PACKASSET-015` が options を直接観測する理由である。golden が証明するのは、固定した toolchain での出力 byte であり、パラメータの明示ではない。

updater が旧 stored と新 compressed の両方を受け入れる oracle は、#930 の pair が持つ。この表は持たない。
