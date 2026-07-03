# 設計ドキュメント実装即応性規約 (design-doc implementation readiness) — S 粒度の定義系

- **date**: 2026-07-03
- **author**: Claude Fable 5。PO 指示「Sonnet クラスでも余裕で実装できる設計粒度を保つために設計ドキュメントの定義系を見直す」(2026-07-03)。
- **正本性**: 設計 doc (特に L6 機能設計) の**実装可能性粒度**の正本。意味定義の正本は従来どおり `document-system-map.md` §0 (L6 = 関数仕様 = 単体テスト粒度) — 本 doc はそれを**機械判定可能な 7 要素**へ操作化する。機械強制 = PLAN-L7-353。
- **読むタイミング**: ①L4-L6 設計 doc を書く前 (テンプレの根拠) ②設計 doc から実装 PLAN を起こすとき ③LENS-DQ / LENS-GR 監査時の判定基準。

## §1 現状の定義系と穴 (実測 2026-07-03)

設計 doc の定義系は現在 3 層あるが、**粒度を保証する層が無い**:

| 層 | 正本 | 強制範囲 | 実測 |
|---|---|---|---|
| 意味定義 | document-system-map §0/§1 (L6 = 関数仕様 = signature + 事前/事後 + エッジ、IEEE 1016 §5.7) | **prose のみ** | 定義は明確だが遵守は著者規律 |
| frontmatter | schema/frontmatter.ts (kind=design + L1-L6 → sub_doc 必須、pair_artifact 等) | 機械 (fail-close) | メタデータのみ — 本文の粒度は不問 |
| 本文構造 | sub-doc-section-structure lint (`STANDARD_DELIVERABLE_SECTIONS`) | **L4 外部設計 4 種のみ** (report/batch/notification/code-value) | **L5/L6 は対象外** |

結果 (LENS-DQ/A-182 と本日実測): L6 実物 21 本の h2 見出し数は **0〜20 でばらつき** (`fr-unit-coverage.md` は h2 ゼロ)、必須要素の定義なし。「Sonnet 級が設計 doc だけ読んで実装できるか」は doc ごとの運任せであり、優良例 (handover-mechanism.md — 実装と最も密) と最薄例の差が機械には見えない。

## §2 S 粒度の定義 — 7 必須要素 (L6 機能設計)

**S 粒度 = 文脈を持たない Sonnet 級実装者が、この doc と参照先だけで迷わず実装・テストできる状態**。判定は機械検出可能な形で定義する (LENS-GR の PLAN 5 基準の設計 doc 版):

| # | 要素 | 内容 | 機械検出 (L7-353 の lint 判定) |
|---|---|---|---|
| 1 | **配置** | 実装先の `src/` パス・モジュール名の明示 (「どこに書くか」を発明させない) | 本文に `src/` パス literal ≥1 |
| 2 | **IF 契約** | export する関数の signature (名前・引数型・返り値型・throw/返却エラーの区別) を TypeScript で記す | ```ts fence 内に `export` を含む signature ≥1 |
| 3 | **事前/事後条件** | DbC: 各主要関数の pre/post + 不変条件 (「何を保証するか」= 仕様の核) | 「事前」「事後」「不変」いずれかの見出し or 表 |
| 4 | **失敗モード** | fail-open / fail-close の宣言 + 入力異常 (欠損/型不一致/IO 失敗) 時の挙動 | `fail-open` / `fail-close` literal ≥1 |
| 5 | **データ形** | 入出力の**具体例** (実データ 1 件以上。型定義だけでは Sonnet は迷う — 例が oracle の種になる) | json/yaml/ts fence の例示ブロック ≥1 |
| 6 | **エッジケース表** | 境界・異常系の列挙表。**各行が L7 単体テストケース 1 件に対応する**のが「設計粒度 = テスト設計粒度」の機械形 | 表 (行 ≥3) + エッジ/境界/異常の語 |
| 7 | **検証接続** | frontmatter `pair_artifact` (既存強制) + 本文から対応 oracle (U-* / テスト設計 §) への参照 | `pair_artifact` 実在 + oracle 参照 literal ≥1 |

**擬似コード (IEEE 1016 §5.7) は必須にしない** — 非自明な制御フローのみ任意。自明ロジックへの擬似コード強制は doc を腐らせる (実装が正本になる部分は書かない)。

**採点**: S = 7/7、A = 6、B = 4-5、C = ≤3。運用目標: **新規 L6 doc は S 必須 (warn-first → 定着後 hard)**、既存 21 本は baseline 免除 + ratchet (C 級の本数は減るのみ)。

## §3 なぜこれで「Sonnet で余裕」になるか

Sonnet 級の実装失敗は能力不足ではなく**発明の強要**で起きる (A-181 GR-1 の設計 doc 版): 配置の発明 (#1 欠落)、契約の発明 (#2/#3 欠落)、異常系の発明 (#4/#6 欠落)、期待値の発明 (#5/#7 欠落)。7 要素はこの発明余地を塞ぐ。S 粒度の doc があれば、実装 PLAN は「`<doc> §N` を実装せよ + DoD」だけで文脈自足になり (LENS-GR 基準⑤)、PLAN 側の粒度要求も軽くなる — **設計 doc の粒度と PLAN の粒度は片方が厚ければ他方は薄くてよい相補関係**であり、正本は設計 doc 側に置く。

## §4 機械強制計画 (PLAN-L7-353)

1. **テンプレ**: `docs/templates/design/L6-function-spec-template.md` (本規約と同時に着地済み) — 新規 L6 doc と PLAN-L7-329 (L6 back-fill 6 本) はテンプレから書く。
2. **lint `design-ir`** (warn-first): L6 配下の doc を 7 要素で走査し、doc ごとの grade を doctor へ surface。既存 21 本は baseline 台帳 + ratchet test (C 級増加で red)。
3. **段階 hard 化**: 新規 doc (baseline 外) が C 級なら fail — 発火実績を見て PO が判断。
4. 検出は見出し名の完全一致でなく**要素の存在検出** (literal/fence/表) にする — 見出し文言の揺れで偽陰性を出さない (sub-doc-section-structure の h2 一致方式より頑健)。

## §5 L5 / L4 への拡張方針 (スコープ宣言)

- **L6 を先行** (実装に最も近く、Sonnet 実装可能性への効果が最大)。
- **L5 (内部設計)** は次段: 必須 3 要素 (module 境界と依存方向 / 内部データ流れ / 分割単位の責務表) — L6 ほど厚くしない。A-182 DQ-1 (L5 凍結 stale) の是正 (L7-328) が先。
- **L4** は現行 arc42 様式で充足 (A-182 DQ 監査で GREEN、module-drift lint が登録簿を機械保証済み) — 追加不要。

---

*本規約は「粒度の定義」であって「文量の定義」ではない。7 要素が揃っていれば短い doc が最良 — 要素の欠落を長文で補うことはできない (coverage ≠ substance の設計 doc 版)。*
