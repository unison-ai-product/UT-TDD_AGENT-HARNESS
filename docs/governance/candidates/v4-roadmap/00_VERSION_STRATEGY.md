# バージョンをどう上げるか

**2026-10-08 の更新:** 版の割当は v4 完遂までの工程順 ①〜⑪ に従う ([README](README.md) の結論表)。現状値は次のとおりで、下の本文 (版2.0) のうち食い違う箇所はこちらを正とする。

- Pack は 0.2.0-canary.1〜canary.5 を公開済み。canary.6 が工程 ① で、③ でハーネス自身へ自己導入する。
- ライセンスは MPL-2.0 ではなく Apache-2.0 (#682)。下の「その後最初のMPL配布を canary.2 とする案」は取り下げる。
- 「R02 と R03 の開発は R01 後に並行」は取り下げる。v4 機能の実装は工程 ⑧ で行う。0.2.0 stable を ③ の直後に出すか ⑧ の最初に出すかは ⑥ で確定する。

## リリースの切り替え点 (工程 ①〜⑪)

**規則:** 工程の出口で、Pack の配布内容 (clean artifact set) か consumer から見える構造 (path、CLI・hook の起動経路、設定、テンプレート、スキル、schema) が前の版と違えば、その出口をリリースの切り替え点にする。切り替え点では、consumer が前の版から Pack 経由で更新できること、前の版へ rollback できることを受入で確かめる。番号は 0.2.0 系の canary を連番で振る (公開済みの番号は使い回さない。実際に発番するときに番号が使用済みなら、次の未使用番号にする)。工程の途中で blocker を直した場合も、次の canary を出してよい。

| 工程 | 切り替え点になる理由 | 版 | 受入で確かめること |
|---|---|---|---|
| ① 出口 | 現行のリリースパック | 0.2.0-canary.6 | 公開 asset からの AT-DIST-003 (015〜019) と AT-835-008 |
| ② 出口 | (d) で実装を直した場合だけ。設計文書だけの変更なら切り替え点にしない | 次の canary | ① と同じ受入 |
| ③ 途中 | 自己導入した版から上げる先が要る。別プロジェクトのフィードバックで直した blocker もここに入れる | 次の canary | 2 consumer (ハーネス自身と別プロジェクト) で、更新・保持確認・前の版への rollback |
| ④ 出口 | ディレクトリ構成が変わる (path、起動経路、Pack の配布 tree) | 次の canary | 旧構成の consumer が更新で新構成へ移れること、旧 path が残らず参照もされないこと、rollback で旧構成へ戻れること、設計保護 gate が新しい path で効くこと (#913) |
| ⑤ 出口 | 責務分割でコードが変わる (振る舞いは変えない) | 次の canary | ④ と同じ受入を流し、結果に差が無いこと |
| ⑥ 出口 | 要件の凍結だけなら配布内容は変わらない。切り替え点にしない | なし | なし |
| ⑦ 出口 | consumer へ配るテンプレート・スキルが変わる | 次の canary | consumer の既存設計文書が新しいテンプレートで壊れないこと、スキルが配送されること |
| ⑧ 各サイクル | v4 機能を版ごとに足す。最初の版は PLAN の廃止とチケットへの切り替え、簡易の複数人運用 (README の「簡易の複数人運用」) | 0.2.0 stable、0.3.0〜0.9.0 (各版 canary → rc → 正式) | 版ごとの AC (⑥ で確定) |
| ⑨ | 1.0.0 の候補 | 1.0.0-rc.N | ⑨ の完了条件 (⑧ のうちに決める) |
| ⑩ 出口 | フル Pack | 1.0.0 | 構想 v4 の統合受入 |
| ⑪ | 別プロジェクトへのチーム投入 | 1.0.0 以降の patch / minor | 投入先での運用 |

切り替え点を飛ばして次の工程へ進まない。特に ④ は path が一斉に変わるため、④ の版を出さずに ⑤ の変更を重ねると、更新と rollback の失敗がどちらの変更によるものか切り分けられなくなる。

## 四つの番号を混同しない

| 軸 | 現在確認できる値 | 今回の計画 |
|---|---|---|
| 構想/要求の版 | 現行authorityはv3.1、#517は構想v4.0候補 | v4.0を到達対象にし、途中版はcapabilityごとの適用範囲で管理 |
| 実配布packageの版 | main package.jsonは0.2.0-canary.1 | 0.2系→0.3→0.4→0.5→0.6→0.7→0.8→0.9→1.0.0を提案 |
| record/schema/policy版 | ドメイン別に現行を棚卸し | package番号と別。readable/writable schema範囲をmanifestに宣言 |
| この計画書の版 | 前版はv1.3 | 本版v2.0。製品2.0をリリースしたという意味ではない |

**本案では「構想v4の統合受入完了」を配布1.0.0の目標に置く。** 構想の番号だけを理由にpackageを4.0.0へ飛ばさない。これは具体的な版割当提案であり、既発行tag、POの正式なversion採択、runtime実装を意味しない。[GH-PKG][GH-PR517][WEB-SEMVER]

## リリースの進行 (release progression)

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
