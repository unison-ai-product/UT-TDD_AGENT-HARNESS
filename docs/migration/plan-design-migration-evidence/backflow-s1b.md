# 設計還流 slice s1b の証跡 (issue #958)

## 目的

PLAN 12 件が「使い捨て可」(設計文書への pointer 以外を捨てても何も失われない) か「廃止」になっているかを、PLAN 本文の全文読みと
設計文書・test-design の実測で確かめる。使い捨てられないもの (未達の DoD、carry、実在する依存、PLAN にしか無い oracle、責務の範囲) は
設計文書または test-design へ移す。上流の判断が要るものは `要判断` とし、移さない。

- 基準 commit: `6a50a74834bbc008abd69359e91300c96dd7392d` (`origin/main`)
- V 字の対の移し先は、`origin/work/docs-issue1019-vmodel-slots-20261014` の `docs/test-design/harness/vmodel-pair-map.md` による。

## 件数の集計

| 区分 | 件数 | PLAN |
|---|---|---|
| 使い捨て可 | 7 | PLAN-L11-01、PLAN-L13-01、PLAN-L2-00 〜 04 |
| 還流済み | 3 | PLAN-L10-01、PLAN-L12-01、PLAN-L14-01 |
| 廃止 | 0 | - |
| 要判断 | 2 | PLAN-L1-08、PLAN-L1-09 |

## 表

| PLAN | blob sha256 (origin/main) | 区分 | 移し先 (path と節) | 剥離した依存 | 備考 |
|---|---|---|---|---|---|
| PLAN-L1-08-design-harness-internalization | 0b00949bcdc0d80591b698a38e4d92044d7361620a9524a15fa3b8e13329c09c | 要判断 | (移さない) | - | 下の「要判断」1 |
| PLAN-L1-09-ut-tdd-concept-v4-candidates | 65ebea8d628a64145422496b7ee8e44ca4c09497022e9b1936b27b906c0b85c9 | 要判断 | (移さない) | - | 下の「要判断」2 |
| PLAN-L10-01-engine-swap-ux-validation | 3d00cb91ceabebd731db2342944aa2abd85db4092d1860a8cb2c843912edcc9b | 還流済み | `docs/test-design/harness/L10-ux-validation-test-design.md` §2.1 (新設、CANDIDATE-G10ENG-01〜03) | `dependencies.parent` PLAN-L4-24、`references` の PLAN-L1-07 / L9-01 / L6-72 (順序は UXV-REVIEW-02 の前提「G9 が green」に既存) | 備考 A |
| PLAN-L11-01-engine-swap-uat-review | 60e642b33310cec0092da1f565804034a837667186835d9e6b8a1189d2ce7775 | 使い捨て可 | 既存: `docs/process/evidence/g11-uat-review-design.md` (G11-WORKFLOW、UAT-ENGINE-01〜03)。L11 は pair-map 表 2 の置き場 | `parent` PLAN-L4-24、`references` | 備考 A。case coverage、manifest の項目、exit criteria (3/3 pass、未承認 scope 0、open blocker 0、PO decision)、defect routing はすべて既存と一致 |
| PLAN-L12-01-engine-swap-acceptance-deploy | d014ce524b5e4a8d93759b03cc89bf698a7d116db823441ef598192174b506e9 | 還流済み | `docs/test-design/harness/L12-acceptance-test-design.md` §7 末尾 (CANDIDATE-AT-ENGINE-05) | `parent` PLAN-L4-24、`references` (順序は AT-ENGINE-01 の前提「G11 UAT 3/3 pass」に既存) | 備考 A。既存は AT-ENGINE-01〜04 と defect routing。不足していた「既知の blocker 0」「release decision の記録」と manifest の項目を候補として追加 |
| PLAN-L13-01-engine-swap-post-deploy-verification | f8aa4691a810973bd176f138b3ecd5cef8b12188c493ef9aee8153997e37fe84 | 使い捨て可 | 既存: `docs/process/evidence/g13-post-deploy-verification-design.md` (G13-WORKFLOW、SMOKE-ENGINE-01〜03、SLI-ENGINE-01)。L13 は pair-map 表 2 の置き場 | `parent` PLAN-L4-24、`references` | 備考 A。PLAN の 4 項目 (case coverage、manifest、exit criteria、routing) は既存に全て含まれる |
| PLAN-L14-01-engine-swap-operational-value-verification | 64647ea88be9c2144d79a18ba7bb1b48d36994bddc6561058cdc7e9d955a8563 | 還流済み | `docs/test-design/harness/L14-vmodel-engine-swap-operational-test-design.md` 末尾の「候補 oracle」(CANDIDATE-OT-ENGINE-01、02) | `parent` PLAN-L4-24、`references` | 備考 A。既存は OT-VUP-008A / 009 / 010 と G14-WORKFLOW。不足していた継続運用の KPI、value outcome、残 debt の承認、program exit decision を候補として追加。KPI の具体値は未確定と本文に明記 |
| PLAN-L2-00-master | 9bf1fe93358326bd744bd625a66d1cdeef3ca3df6f9e17b49e95143fb15abd24 | 使い捨て可 | 既存: `docs/design/harness/L2-screen/` の 4 sub-doc (confirmed、G2 freeze)。索引 `README.md` の古い記述を訂正 (備考 B) | `requires` PLAN-L1-03 (confirmed、完了済み) | 全 AC が [x]。Sequence 1〜4 は完了。Out of scope (src/web 実装は L10 確定後) は `wireframe.md` 末尾と L10 test-design の「実行時期」に既存。③ pair=self の記述は PLAN-RECOVERY-09 で撤去済みで、L10 test-design が pair の正本 |
| PLAN-L2-01-screen-list | b4abc01dd263562d9c66d20219bb960bb3eb0ff5454782c8ca01f8d7291271c5 | 使い捨て可 | 既存: `docs/design/harness/L2-screen/screen-list.md` (URL 設計、ID と URL の 1:1、認証認可、ステート保持、PM-06) | `requires` PLAN-L1-03、PLAN-L2-00 (完了済み)、`parent` | 備考 B |
| PLAN-L2-02-screen-flow | 93632094a0a32688cf0dc6e4ae4904ff1f0456287fb1e73e5a3a4c2a944f2ffb | 使い捨て可 | 既存: `docs/design/harness/L2-screen/screen-flow.md` (6 シナリオ、遷移エッジ、auto 表示、deep-link、drift 訂正の注記) | `requires` 完了済み | 備考 B |
| PLAN-L2-03-ui-element | 166c4a88704073f2978274a49ada7e7d7a23b523b7367665844aaa3ae3b87e0b | 使い捨て可 | 既存: `docs/design/harness/L2-screen/ui-element.md` (共通 catalog、15 画面の部品、token、a11y、responsive) | `requires` 完了済み (L2-01、L2-02 を含む) | 備考 B |
| PLAN-L2-04-wireframe | f1d61053baa30df0933cb32db2f2f30b0a2f249fae2fe79373470d8fe4724e95 | 使い捨て可 | 既存: `docs/design/harness/L2-screen/wireframe.md` (骨格、主要 7 画面、High-Fi 方針、back-propagation フロー) | `requires` 完了済み | 備考 B |

### 備考 A: L10〜L14 の verify PLAN に共通

- 5 本とも `status: draft` で、実行 (G10〜G14 の検証) は未了である。実行の状態は、各 gate の evidence manifest
  (`.ut-tdd/evidence/g1x-*/engine-swap.json`) と test-design の status が持つ。PLAN は実行の記録を持たない。
- 逆方向の参照: `docs/process/vmodel-contract.yaml` の L10〜L14 の行が `verification_plan_id` でこれらの PLAN を指し、
  `src/vmodel-contract/application/contract-compiler.ts` が PLAN-L12-01 を指す。`g11` / `g13` の process 文書は
  `owning_plan` で指す。これらは pointer であり、PLAN を退役する時に差し替える必要がある (本 slice では触れない)。
  exit criteria、defect routing、evidence manifest の path は、contract yaml 側にも機械形で既存。
- V 字の対: L10 の対は L2、L12 は L3、L14 は L1 / L0 (`V_MODEL_PAIRS`、pair-map 表 1 と 2)。L11 / L13 は工程単体の文書で、
  置き場は pair-map 表 2 のとおり `docs/process/evidence/` に既存。
- 追加した CANDIDATE は、正式 oracle ではなく昇格前の候補である。数値 (成功率の閾値、KPI) は PLAN にも無いため、未確定と明記した。

### 備考 B: L2 の PLAN に共通

- 4 sub-doc は `plan:` frontmatter で各 PLAN を指す (pointer)。`business-flow.md` と `screen-detail.md` は `plan:` で L2-02 / L2-01 を指す。
  他の PLAN (PLAN-L7-102 / 141 / 146 / 204 / 429 / 96 / 97、PLAN-RECOVERY-09、PLAN-L1-03) も参照するが、いずれも参照 (`references` 等) で、責務の依存ではない。
- 設計 (`L2-screen`) の実測との差: `README.md` が sub-doc の status を placeholder とし、materialization 状況も「placeholder 維持」と
  書いていた (実際は 4 sub-doc とも confirmed、G2 freeze 済み)。README の注記と構成表の status 4 セルを実測に合わせて訂正した。
  README の「Forward handling」の記述は L2 起票前の履歴であり、注記で履歴と明示した。
- 未実装の L2 画面 (`screen-list.md` の `implemented_screens`) は設計文書の frontmatter が持つ。L10 の実行 (実レンダリング検証) は
  src/web 実装 (PLAN-L7-141) の後と、L10 test-design の「実行時期」が既に書いている。

## 要判断

1. **PLAN-L1-08** (Design Harness 内蔵化、UX-FE Continuity Contract): 受け皿が無い。PLAN にしか無いもの: 設計判断 D8〜D12 と
   判定権限 (PO 採択 2026-07-15)、hard invariants、program bands (P0〜P9)、master AC 6 件 (全て未達)、設計正本 ZIP への pointer
   (リポジトリ root の untracked ZIP、v0.2-r27)。PO 決定 V4D-039 (2026-09-28) は「v4 で扱う。ZIP は削除しない」とし、
   `v4-decision-ledger.json` が `UTV4-BR-031` へ写像するが、D8〜D12 と invariants と AC を持つ設計文書は無い
   (`issue959-human-disposition-f` の `L1-08-RESEARCH-TRANSFER-UNRESOLVED` と同じ所見)。
   質問: これらの繰延内容の受け皿を、v4 の候補文書 (`UTV4-BR-031` の下) にするか、L1 の設計文書 (`docs/design/harness/L1-requirements/`、
   confirmed 文書への additive revision になる) にするか。
2. **PLAN-L1-09** (構想 v4.0 候補の L1/L3/L10 分解、issue #530 は OPEN): 契約の本体は候補文書 4 本と `v4-decision-ledger.json` と
   `v4-roadmap/` に既存 (§3.21 の版割当と §3.22 の DEC-01〜16、§3.23 の MIG-01〜20 は `v4-roadmap/` の原本への写像、§3.25〜3.27 は concept v4.0 と
   UTV4-BR-039 / 041、FR-066 / 068 に既存)。使い捨てられない理由は 3 つある。(a) 台帳の 28 件の `source.path` が本 PLAN の節 (§1、§3.2、§3.4〜3.20) を
   指す (本 PLAN の退役で出所が消える)。(b) §2 の実測 (起点の実録、2.1〜2.12) と §3.1〜3.3 の採否理由は、候補文書に本文として無い。
   (c) §4 の手順 5〜8 (U23 の複数人間化 Reverse、C〜F の L3 設計 PLAN、§2.5 の A1〜A7 / B1〜B7 を既存 issue の受入条件へ転記、
   FLAG / PASS-WEAK 率の実測) と §5 の完了条件 5 件 (concept の昇格条件 1〜6 と重なる) は、carry として PLAN にしか無い。
   質問: 昇格前の v4 候補は、PLAN を台帳の出所として残す (退役しない) か、台帳の `source` を候補文書の節へ付け替えて §2 / §3 の根拠を
   候補文書へ移したうえで退役するか。後者なら、(c) の carry の置き場 (concept v4.0 の昇格条件か #530) も決める。
