# PLAN → 設計文書 還流証跡 (slice backflow-s1、issue #958 / #959)

目的: slice s1 (43 PLAN) の使い捨てられないもの (未達 DoD / carry / 実在する依存 / PLAN にしか無い oracle / 責務範囲) を設計文書へ移し、区分を決める。
基準 commit: d5ad67fb50c148ea8dd6d5475bab4b88f2d4cd4c (origin/main)

状態: **途中経過 (処理済み 6 / 43)**。残りは末尾に列挙。区分の集計は処理済み分のみ。

| 区分 | 件数 (処理済み分) |
| --- | --- |
| 使い捨て可 | 4 (DISCOVERY-01, 02, 03 暫定, 06 暫定) |
| 還流済み | 0 |
| 廃止 | 0 |
| 要判断 | 2 (DISCOVERY-04 暫定, DISCOVERY-05) |

「暫定」は、PLAN 内の主張 (他文書への back-fill 済み) を設計文書側の grep で全件は照合していないことを示す。照合が済むまで確定扱いにしない。

| PLAN | blob sha256 (origin/main) | 区分 | 移し先 (path と節) | 剥離した依存 | 備考 |
| --- | --- | --- | --- | --- | --- |
| PLAN-DISCOVERY-01-workflow-metamodel | ca9fc92443a821713918114d5a4978e5da3b7e1a1192caaf7be8aefc4d713ad0 | 使い捨て可 (暫定) | 既存: concept v3.1 §2.5 (PLAN-REVERSE-08 で promote 済と PLAN 本文にある) | なし (requires 空) | DoD 全 [x]。§8 の L6 carry (駆動プラン template 実フィールド / decision_outcome x promotion_strategy 遷移 / promote-gate 品質バー / 検証 toolbox) は設計側の所在を未照合 |
| PLAN-DISCOVERY-02-roster-design | 9757d394b45f259f59c9a9e92a89c24c3be89b47f666bffbec6fa07e3ae93e22 | 使い捨て可 | 既存: docs/design/harness/L5-detailed-design/module-decomposition.md roster 行、internal-processing.md roster list / roster check | なし | 未達 DoD (L5-05 へ反映: capability 直交 / ID=filename stem / nameMismatch) は両文書に実在。差: PLAN は nameMismatch を WARN とするが、設計は実装 (src/assets/catalog.ts) に合わせ fail-close (exit 1) に訂正済み。L6 carry (agents dir パス解決、zod 化) は未照合 |
| PLAN-DISCOVERY-03-skill-design | fda640615ff21674c70bbfb5a450899a06d11e5c27ca9ea43bf7f7a5ed37713e | 使い捨て可 (暫定) | 未照合: score 飽和の de-saturate carry の所在 (L5-06 / L6 skill 設計) | なし | DoD 全 [x]。carry: recommender スコアリング詳細 / injector の layer 別注入セット |
| PLAN-DISCOVERY-04-process-workflows | 602634a015965801d87385135e3f49f68bd95240063d57bf1efa8b054b2a9307 | 要判断 (暫定) | docs/process/README.md, modes/*, gates.md に実体あり。V1-V4 / V7 (drive 概念の歪み: VALID_DRIVES に mode 値が混在) の解消状況は未照合 | なし | 質問: requirements §1.6 の drive 再設計 (専門職のみ) は実施済みか。未実施なら設計改訂が要る |
| PLAN-DISCOVERY-05-roadmap-registration | fecb91b72dd591ff3420bd12a838a92f415e6085553f7cc2844ffdf495752651 | 要判断 | なし (移せない) | なし | frontmatter の roadmap: block (L7 band の gate 5 / span 9) を src/lint/roadmap-registry.ts の loadRoadmaps が docs/plans を走査して読む。PLAN が registry 実体。質問: 工程表 registry の実体を PLAN frontmatter から設計文書 / registry ファイルへ移す方式 (src の読込元変更を伴う) をどうするか。設計側は architecture.md の roadmap-registry park 節のみで、gate / span 実体は設計文書に無い。DoD 5 件 [ ] は PLAN 本文が S4 confirmed 済みと矛盾しており、記録の更新漏れ |
| PLAN-DISCOVERY-06-orchestrator-rule-parity | 1b46071af16e935d46dbef83c44e1be9442fc44c831df8456f00bb1b706f41fb | 使い捨て可 (暫定) | PLAN 本文は L4 architecture §6 へ back-fill 済み、実装は PLAN-L7-139 / PLAN-REVERSE-139 と記す (未照合) | requires PLAN-L7-114-work-guard は完了済みのため剥離 | 残差: global ~/.codex/ 書込みは別途 PO 判断 (責務範囲の記述) |

## 横断所見 (roadmap registry)

`roadmap:` frontmatter block を持つ PLAN は docs/plans の 8 本 (s1 内: DISCOVERY-05, L3-00-master, M-00-verify-cutover, M-01-cutover-backfill。s1 外: L4-00, L5-00, L6-00, L7-44)。`loadRoadmaps` (src/lint/roadmap-registry.ts) が docs/plans を走査して gate / span を読み、doctor の program-coverage が使う。この 4 本は、設計文書へ gate / span を移して src の読込元を変えるまで使い捨て可にならない。同じ判断で決まるので 1 件の要判断にまとめる。

## 未処理 (37 件)

DISCOVERY-07, 08, 09, 10 / L0-01 / L1-01〜09 / L10-01, L11-01, L12-01, L13-01, L14-01 / L2-00〜04 / L3-00〜08 / L8-01, L9-01 / M-00, M-01

事前スキャン (s1 の frontmatter 依存と未チェック DoD の一覧) の所見:
- 未チェック DoD がある: L0-01 (7)、L1-01/02/04/06/08/09、L3-01/02/03/07、DISCOVERY-10 (4)
- requires/blocks が実在: L1-01 が L1-02〜05 と L3-01 を blocks、L2-01〜04 が L2-00 を parent、L3-04/05/06 が L7 PLAN を blocks
