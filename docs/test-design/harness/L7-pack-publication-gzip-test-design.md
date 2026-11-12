---
title: "L7 Pack publication gzip 圧縮 テスト設計"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/pack-publication-gzip.md
status: draft
updated: 2026-11-12
issue: 881
---

# Pack publication gzip 圧縮 テスト設計 (issue #881)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/pack-publication-gzip.md` (§4.1 の 1〜7、§5) である。
共有の `docs/test-design/harness/L7-unit-test-design.md` には行を足さない (別 lane が分割・縮小中のため)。
本書が `U-PACKASSET-007`〜`014` の正本である。既存の `U-PACKASSET-001`〜`006` は共有の L7-unit-test-design.md に
あり、ここへ複写せず ID で参照する。

`U-PACKASSET-002` の「stored-block gzip bytes」と `U-PACKASSET-005` の gzip header の固定 byte は、新方式の
release に対しては下表が置き換える (XFL が 0 から 2 へ変わる)。共有の L7-unit-test-design.md 側の
`U-PACKASSET-002` の stored-block 前提が新契約で置き換わる旨の改訂は、実装 PR が、別 lane の縮小が終わった
あとに行う (本 PR は共有文書を変えない)。旧 stored 方式の release を再現する検査は、旧生成コードに対して残す。
下の ID は、実装 PR の先頭で `it.fails` の Red として入れる。

## 2. oracle

| ID | fixture / mutation | expected |
| --- | --- | --- |
| `U-PACKASSET-007` | 固定の tar bytes (65536 byte 超で、32 KiB の窓を越える、反復と非反復の entry を含む) | gzip bytes と checksum と inventory digest が literal golden と一致する。Windows と Linux で同じ literal を使う |
| `U-PACKASSET-008` | 同じ入力を同一環境で 2 回、別の呼び出しで圧縮する | 2 回の gzip が byte で一致する |
| `U-PACKASSET-009` | 出力の先頭 10 byte | `1f 8b 08 00 00 00 00 00 02 ff` を直接照合する。OS byte (byte 9) は実行環境に依らず `ff`。mtime=0、FLG=0 |
| `U-PACKASSET-010` | `gunzipSync` で展開 | 展開した tar が入力の tar と byte で一致する。圧縮できる入力に対して出力が入力より小さい (stored だけではない) |
| `U-PACKASSET-011` | `level` / `memLevel` / `windowBits` / `strategy` のいずれか 1 つを単独で変える mutation | `U-PACKASSET-007` の literal golden が赤になる。4 つそれぞれで検査する (パラメータが暗黙の既定値でないことの証明) |
| `U-PACKASSET-012` | producer の toolchain identity: `process.version` と `process.versions.zlib` | 期待する版の集合と照合する独立のテスト。集合外の値を注入すると赤になり、release の生成は止まる。版を上げるときに golden を自動更新しない。公開 asset を作った時点の provenance を証明しないと明記する (§4.1 の 4) |
| `U-PACKASSET-013` | 公開済み release の anchor (stored の gzip を含む既存の digest) | 変更されない。新方式の導入で既存 anchor の literal が書き換わっていないこと (既存 golden の差分 0) |
| `U-PACKASSET-014` | Windows と Linux の CI job の出力 digest | 同じ固定入力から同じ gzip digest になる。片方の環境だけでは通らない |

updater が旧 stored と新 compressed の両方を受け入れる oracle は、#930 の pair が持つ。この表は持たない。
