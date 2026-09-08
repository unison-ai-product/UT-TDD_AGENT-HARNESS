# バージョンをどう上げるか

## 四つの番号を混同しない

| 軸 | 現在確認できる値 | 今回の計画 |
|---|---|---|
| 構想/要求の版 | 現行authorityはv3.1、#517は構想v4.0候補 | v4.0を到達対象にし、途中版はcapabilityごとの適用範囲で管理 |
| 実配布packageの版 | main package.jsonは0.2.0-canary.1 | 0.2系→0.3→0.4→0.5→0.6→0.7→0.8→0.9→1.0.0を提案 |
| record/schema/policy版 | ドメイン別に現行を棚卸し | package番号と別。readable/writable schema範囲をmanifestに宣言 |
| この計画書の版 | 前版はv1.3 | 本版v2.0。製品2.0をリリースしたという意味ではない |

**本案では「構想v4の統合受入完了」を配布1.0.0の目標に置く。** 構想の番号だけを理由にpackageを4.0.0へ飛ばさない。これは具体的な版割当提案であり、既発行tag、POの正式なversion採択、runtime実装を意味しない。[GH-PKG][GH-PR517][WEB-SEMVER]

## release progression

- 初回 `0.2.0-canary.1` は現行MITで受入まで閉じる。
- その後最初のMPL配布を `0.2.0-canary.2` とする案。実発番時に使用済みなら次の未使用canary番号へ移し、計画表を更新する。
- `0.2.0` は更新/rollback/A-B受入を含む運用基盤のnormal release。構想v4全体の完成ではない。
- `0.3.0` 以降は一つずつ利用可能な機能境界を追加。通常は `x.y.0-canary.N → x.y.0-rc.N → x.y.0`。成熟した内部修正のすべてに新しい公開canaryを義務化しない。
- `0.y.z` のpatchは対象版の不具合/脆弱性修正と互換性維持に使う。capability追加、writer切替、schema非互換、権限/配布契約の大変更をpatchへ隠さない。
- `1.0.0` ではpublic CLI/JSON/APIと互換性の基準を定義する。以降の互換性破壊はmajor更新として扱う。0系でも無承認の破壊的consumer更新はしない。
- 公開済みtag/assetは不変。修正は新しい版/identityへ。channel pointerは人間承認した配布先の選択であり、tagの付替えではない。

版番号は未来の予定で、実装予定日や達成率ではない。暦日のdeadlineを捏造せず、各版の前提とAC成立で昇格する。

## branchと作業単位

mainは次の受入済みcandidateを載せるintegration branch。機能は短命な責務別PRと、未公開capability既定offで進める。releaseごとの巨大長寿命branchを常設しない。直前supported minorの緊急修理にだけmaintenance branchを使い、mainへ再合流させる。

R02（updater/stable）とR03（JSON）の**開発**はR01後に並行できる。R07上流とR08 adapter設計も必要な契約がそろえば並行できる。一方、利用者へ出すnormal releaseは受入済み前版を基線にする。開発の依存と公開の順番をdata/releases.jsonで別管理する。

## capabilityが本当の利用可能範囲

release manifestに、concept target、package version、対象source/Pack identity、capability id/revision、状態（planned/shadow/opt-in/default/deprecated/retired）、supported schema、必要なOS/provider/profile、migration参照、evidence参照を持たせる。

manifestの自己申告だけで有効化しない。admissionはその版のschema/実装/実行/独立review証拠を照合する。packageを更新しただけでconsumerのCI/権限/データ供出/自動mergeをonにしない。

## 互換保証と保守範囲の案

基本は「最新の受入済みminor＋移行中の直前minor」を運用対象とする案。日数SLAや永続LTSを約束しない。より古い版はread-only import・段階更新の対象とし、脆弱な版を安全と表示しない。対応期限・例外は実際の保守能力でPOが採択する。

前版から必須機能が欠けるときは、版番号を上げて完成扱いせずcandidateを維持する。scopeを変えるなら要求/影響/受入の正式変更を行う。
