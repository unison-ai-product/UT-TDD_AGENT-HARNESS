---
layer: L1
executed_at_layer: L14
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L1-requirements/
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L1
created: 2026-05-29
---

# UT-TDD Agent Harness — L1 運用テスト設計 (③ / OT-*)

> **layer (作成層 = V-pair key)**: L1 (要求) / **executed_at_layer (実施層)**: L14 (運用検証) / **artifact**: ③ 運用テスト設計 (V-model 右、① L1 全 sub-doc と対)
> **pair (V-model L1↔L14)**: `../../design/harness/L1-requirements/{business,functional,screen,technical,nfr}-requirements.md` の 5 sub-doc 全体 ↔ 本書 1 doc (V2 HELIX-workflows 設計概念を参照し、L1 = 5 sub-doc 構造、運用テスト設計は L14 pair として 1 本)
> **status**: confirmed (A-100 で ① と対の G1 pair freeze 両側揃い、2026-06-04。BR-07/08・NFR-08 対応 OT は ① 同様 confirmed。5 sub-doc 化 + 14 画面 PM/HM/GD 再採番 に伴う OT 追加は OT-32〜44 で量閉じ完了。PM-06 設計書ビューア追加 (2026-06-22 PO 指示、L2 materialization back-propagation) は OT-47 で量閉じ、計 15 画面)
> **PLAN**: `../../plans/PLAN-L1-{01..05}-*.md` Step 5 / DoD (5 PLAN すべての DoD で本書を参照)
> 方針: **軽量** (完全性レビューは課さない)。各 BR / FR-L1 / SR / TR / NFR は最低 1 OT に対応させ孤児要求を作らない (量閉じ)。OT は「運用で何を観測すれば満たされたと言えるか」の検証観点であり、実装テストコード (L7/単体) ではない。
> v1.2 構造化: 本書は v1.2 で 5 sub-doc 全体の pair 凍結相手として位置付け直された (構想書 §3.1.2.1)。OT は sub-doc 横断で粒度が変わらないため、引き続き **L14 で 1 本** の運用テスト設計とする (HELIX-workflows 設計概念でも L14 = 単一 doc)。
> **正規式モデル (PLAN-RECOVERY-02、2026-06-04)**: L1⇔L14 の検証本質 = **運用** (実データ × 継続運用で要求が満たせるか)。データ実在性エスカレーションの最上位帯。**L14 の「次サイクル L0 企画へ feedback」が L0 企画の検証ペア (価値検証) を成す** — 運用実績で企画目的・事業価値が実現したかを検証し V の頂点を閉じる (従来 L0 はペア無しの穴埋め、非破壊)。

## 0. 量閉じ原則 (L1↔L14)

L3-acceptance §0 (L3↔L12) と**同形式**で、L1 5 sub-doc の各要求カテゴリを件数で量閉じする (V-pair 構造対称化、IMP-053 2026-06-04)。各件数の OT 被覆内訳は §3 量閉じ一覧が正本:

- 全 BR-* (BR-01〜08 + BR-21/22) / **1 つ以上の OT に被覆**必須 (孤児業務要求 = 0)
- 全 FR-L1-* (**47 件** = FR-L1-01〜35 + 37/39/40/41/42/44/45/46/47/48/49/50) / OT 対応必須 (孤児 = 0。軽量原則で代表 OT へ集約可)。**FR-L1-36/38/43 は上記 47 件から除外** (BR-21 派生の L3 forward carry。L14 時点では OT-18 で宣言確認のみ、FR 詳細化は L3) → G1-trace の孤児誤検知対象外
- 全 SR-* (**15 画面** = PM-01〜06 + HM-01〜08 + GD-01) / OT 対応必須 (孤児 = 0)
- 全 TR-* (state schema 二層 / skill 注入 / 9 mode 基盤 / drift 解消) / OT 対応必須 (孤児 = 0)
- 全 NFR-* (**15 件** = NFR-01〜17、NFR-09/10 欠番。NFR-02 は L14 直接観測が弱く L4↔L9 pair で意図的 carry) / OT 対応必須
- 全 UX-* (UX-01〜03。UX-01 は単独 OT 化せず全 OT の重み付け原則) / OT 対応必須 (孤児 = 0)
- **孤児 = 0** (各カテゴリ末尾「孤児 X = 0」を §3 で宣言。機械検証 = `ut-tdd plan lint --gate G1-trace`)

補足:
- NFR / UX / 成功条件は OT を共有または専用 OT で被覆し、§3 で対応を一覧する。
- 「合否目安」は L14 運用で観測する pass 条件の方向であり、数値しきい値の確定は L3 AC / L12 受入テストへ送る。

## 1. 運用テスト (OT-*)

| OT-ID | 検証する要求 | 運用検証観点 (何を観測するか) | 合否目安 |
|-------|-------------|------------------------------|----------|
| **OT-01** | BR-01 | 1 案件を L0-L14 通しで回し、設計⇔実装⇔テストの 4 artifact trace が切れず、各 gate を通過して完走する | 通し 1 周で trace 断絶 0 / gate silent pass 0 |
| **OT-02** | BR-02 | 複数人 (PO + レビュアー + AI 実装) が日常 PR を出し、gate・レビュー・役割境界が無理なく回る | PR が gate/レビュー経路に乗り、役割逸脱が検知される |
| **OT-03** | BR-03 / NFR-06 | AI に実装委譲した後、既存設計・テストを破壊する変更が回帰検知で止まる (silent に通らない) | 破壊的変更を含む試行が fail-close で block |
| **OT-04** | BR-04 | PoC / 検証成果が契約化を経てから本実装に合流し、契約なしの本実装直行が防がれる | PoC→main 直行が物理 block、契約経由のみ合流 |
| **OT-05** | BR-05 | PLAN を phase-aware ID で起票し、規約違反 (ID 形式 / phase 不整合 / 必須 frontmatter 欠落) が lint で検知される | 規約違反 PLAN が lint で非ゼロ終了 |
| **OT-06** | BR-06 / UX-02 | 複数プロダクト / 案件の工程表・進捗がダッシュボードで横断的に可視化され、詰まり・フェーズが把握できる | 複数案件の進捗が 1 ビューで把握可能 (実現アーキは L2/L4) |
| **OT-07** | BR-07 | 上流 ID 追加 commit に下流対応 ID が無ければ fail-close / 回帰の量的劣化を検知 / 上流→下流 trace 切れを検知 (3 軸) — **観測タイミング**: L14 運用観測 (commit hook + CI gate 経由) / **具体指標 (3 軸の数値しきい値)**: L3 AC で確定 (§0 量閉じ原則、Minor 3 G1 readiness v8 で観測タイミング区分明示 2026-05-28) | デグレ 3 軸のいずれかが該当する試行を機械検知・block |
| **OT-08** | BR-08 | 大規模 doc 改定・gate evidence 提出・pair freeze の前に doc-reviewer が召喚され、品質観点 (整合/網羅/一貫/明確) が検査される | 該当タイミングで doc-reviewer 召喚 coverage が監査される |
| **OT-09** | NFR-01 | harness の主要コマンド・hook が Windows / macOS / Linux で**ネイティブ動作**する (bash/python3 等の環境依存に阻まれない) | 全 OS 第一級で主要経路が動作 (例: subagent guard は bun で環境非依存動作) |
| **OT-10** | NFR-03 / NFR-04 | standalone / claude-only / codex-only / hybrid の各 mode で動作し、統制対象 repo の言語に依存せず回る | 4 mode × 複数言語 repo で基本フローが成立 |
| **OT-11** | NFR-05 | CI / 証跡 / 権限が GitHub を正本として運用される (ローカル副産物を正本にしない) | gate 証跡・権限が GitHub 上で確認可能 |
| **OT-12** | NFR-08 | 設計 doc が主張する CLI / file / schema に実装状態列があり、虚偽の「実装済」宣言が review / lint で検知される | implementation_status 欠落・不整合が検知される |
| **OT-13** | UX-03 | gate / lint 失敗時に next_action が提示され、CLI 出力が分かりやすく、オンボーディングが滑らか | 失敗時に次の一手が明示される |
| **OT-14** | FR-L1 (functional sub-doc 全般) | HELIX-workflows 設計概念参照 FR-L1-01〜35 (P0 18 件) のうち代表 5 機能 (PLAN 起票 / 4 artifact trace / static ゲート / mode 自動 routing / 横断検出) が業務シナリオで実用され、想定通り発火する | 代表 5 機能が運用環境で発火 + 期待動作 |
| **OT-15** | PM-01〜PM-06 (PM 画面群全般) | L1 画面要求として宣言した PM カテゴリ 6 画面 (PM-01 俯瞰ダッシュボード / PM-02 工程ビュー / PM-03 Gate+詰まり要因 / PM-04 Trace+V-pair / PM-05 Handover / PM-06 設計書ビューア) が L2 モックで lift され、PO が「これで業務要求を満たす」と判定できる (PM-06 固有挙動は OT-47) | L2 mock で PO 判定 pass |
| **OT-16** | TR-* (technical sub-doc 全般) | state schema 二層構造 + 工程別 skill 注入機構 + 9 mode 共通基盤 + drift 解消方針 が実装に反映され、HELIX-workflows の「新規 drift 0 件 / week」目標と整合する | 新規 drift 0 件 / week を運用観測 |
| **OT-17** | NFR §7 IPA × ISO 25010 二軸表 | 全 NFR-NN が IPA 大項目 × ISO 25010 特性の二軸でタグ付けされ、対象外特性 (機能適合性 / 使用性) の除外理由も整合 | 二軸表に孤児 NFR 0 / 除外理由が査読 pass |
| **OT-18** | BR-21 (AI 実行成果評価 L3 carry) | business sub-doc §1 に BR-21「AI 実行成果の継続評価と改善サイクル」が宣言されており、L3 forward carry pair (FR-L1-36/38/43) との接続が §7 対応表に明記されていることを確認 | BR-21 宣言が business sub-doc に存在 / §7 pair 表に L3 carry 接続が明記 / 不実装宣言なし (not-implemented) |
| **OT-19** | business §3.3 9 mode 統一合流原則 + Add-feature 例外 | concept §2.5 ecosystem 記述と business sub-doc §3.3 の「9 mode 統一合流原則 + Add-feature 例外注記」が整合していることを確認。Scrum/PoC/Reverse は V モデル昇華で収束、Add-feature のみ差分追補例外の記述が一致 | concept §2.5 と business §3.3 の整合 / 例外注記が逸脱なく記載 |
| **OT-20** | business §4 ステークホルダー権限分離 (S-01〜S-05 + harness 運用者) | business sub-doc §4 に S-01〜S-05 (PO / PM / TL / SE / PE) + harness 運用者ロールが定義されており、各ロールの PLAN 承認権限 / gate 通過権限 / audit 閲覧権限が明示されていることを確認 | §4 権限表に harness 運用者ロールが存在 / 権限境界が査読 pass / 空白ロールなし |
| **OT-21** | business §6.5 業務 KPI D-01〜D-09 | business sub-doc §6.5 の KPI 表 (D-01〜D-09) を観測し、KPI 計測式・目標値・計測場所 (ut-tdd doctor / dashboard / audit log) が整合しており、NFR-13 gate 通過率 ≥90% と矛盾しないことを確認 | D-01〜D-09 全件に計測式・目標値・計測場所が記載 / NFR-13 と矛盾なし |
| **OT-22** | FR-L1-37/39/40/41/42 (新規 P1 5 件) | drive 自動判定 (FR-L1-41) が PLAN frontmatter 未指定リポジトリで drive を推定し補完することを観測。model 推挙 (FR-L1-37) が drive 判定結果を受けて model 候補を提示し、drive 別 state 区画 (FR-L1-40) が skip_sub_doc を機械強制することを代表シナリオで確認 | drive 推定が期待値と一致 / model 推薦リストが提示 / drive 別 state ディレクトリが分離 / skip_sub_doc 違反が block |
| **OT-23** | FR-L1-44 (途中導入 onboarding workflow) | 既存リポジトリ (ut-tdd 未導入) に対して `ut-tdd onboarding` を実行し、baseline PLAN セットが生成され、欠損 sub-doc が skip_sub_doc で段階整備モードに設定されることを確認 | baseline PLAN が生成 / skip_sub_doc 設定が有効 / onboarding 進捗がダッシュボードで可視 |
| **OT-24** | FR-L1-06/08/12/14/16/19/20 (拡張機能代表) | state 一元管理 (FR-L1-06) / 検出ルーティング (FR-L1-08) / L 単位注入 (FR-L1-12) / Reverse (FR-L1-14) / Incident (FR-L1-16) / Learning Engine (FR-L1-19) / 観測計測 (FR-L1-20) の各 extended 部分が P1 機能として宣言されており、代表 1 機能が業務シナリオで発火することを確認 | P1 機能の宣言が functional sub-doc §1 に存在 / 代表 1 機能の発火が観測 / not-implemented 以上の状態で詐称なし |
| **OT-25** | HM-07 (doctor 結果ビュー) | HM-07 doctor 結果ビューが screen sub-doc に定義されており、FR-L1-18 (横断検出) と pair で情報要素 (検出種別 / severity / next_action) / 操作要素 (再実行 / ignore / 詳細展開) / 更新頻度 / 状態種別が記載されていることを確認 | HM-07 が screen sub-doc に存在 / FR-L1-18 との pair 明記 / 情報・操作要素が記載 |
| **OT-26** | PM/HM/GD 3 カテゴリ間遷移 (deep-link 含む) | screen sub-doc §遷移 に PM/HM/GD 3 カテゴリ間の遷移シナリオ (カテゴリ間 deep-link 含む) が記載されており、15 画面間接続が遷移図と整合していることを確認。Recovery / Discovery / doctor 起点の 3 カテゴリ跨ぎ遷移が明記されていることを確認 | 3 カテゴリ間遷移シナリオが存在 / deep-link が 15 画面遷移図と整合 / 孤立画面 0 |
| **OT-27** | FR-L1-40 drive 別 state 区画 integrity | drive 別 state 区画 (`drive-be` / `drive-fe` 等) が technical sub-doc §4 に記載されており、skip_sub_doc 機械強制の検証スクリプトが ut-tdd doctor でパスすることを確認。区画跨ぎ汚染が検出 → block されることを代表ケースで観測 | drive 別 state ディレクトリ分離が機械確認 / 区画跨ぎ書き込みが block / skip_sub_doc 違反が doctor に集約 |
| **OT-28** | FR-L1-42 AI provider 引継ぎ (Claude ↔ Codex handover) | Claude セッション終了 → Codex 起動のシナリオで handover.CURRENT.json が生成・引き継がれ、PLAN registry / audit log の連続性が保たれることを確認。provider 切替後の context 欠損がないことを観測 | handover.CURRENT.json が生成 / PLAN registry 状態が引継ぎ後も一致 / audit log に中断・再開の record が存在 |
| **OT-29** | NFR-16 (onboarding 互換性) 段階導入 block 回避 | NFR-16 要件として、途中導入時に skip_sub_doc 設定が正しく機能し、未整備 sub-doc による gate fail-close が段階整備完了まで block 回避されることを確認 | skip_sub_doc 設定後に gate が段階整備モードで進行 / 完全整備後に通常 gate に切替 / block 回避ログが audit に記録 |
| **OT-30** | NFR-13 (gate 通過率 ≥90% KPI 計測) 観測タイミング | D-07 (gate 通過率) の計測が `ut-tdd doctor` 実行後の audit log / dashboard で観測可能であり、NFR-13 の ≥90% 目標値と KPI D-07 の計測式が整合することを確認 | audit log に gate_pass_rate が記録 / dashboard で D-07 が可視 / NFR-13 目標値と KPI 定義が矛盾なし |
| **OT-31** | NFR-14 (agent guard bypass = PO 承認 + audit) 監査ログ取得 | `UT_TDD_ALLOW_RAW_AGENT=1` bypass 実行時に S-03 (bypass 権限 = PO 専属) チェックと B6 (agent guard bypass 監査) の audit log が生成されることを確認。bypass 理由が会話/final report に記録されており、監査ログが `.ut-tdd/audit/` に永続されることを観測 | bypass 実行時に audit log 生成 / S-03 権限チェック pass / B6 連動で audit エントリ存在 / log が `.ut-tdd/audit/` に永続 |
| **OT-32** | PM-01 (4 階層プルダウン: 俯瞰/工程/割当/詳細) | PM-01 プロジェクト俯瞰ダッシュボードで 4 階層プルダウン (俯瞰/工程/割当/詳細) が切替可能であり、各階層で表示粒度が変化することを確認。俯瞰レイヤーで複数案件横断・工程レイヤーで L0-L14 進捗・割当レイヤーでロール別稼働・詳細レイヤーで PLAN 単位の状態が確認できることを観測 (not-implemented) | 4 階層切替が動作 / 各階層で表示粒度が変化 / 孤立・未接続階層 0 |
| **OT-33** | PM-02 (工程ビュー L0-L14 テンプレート: 進捗/担当/詰まり 3 軸) | PM-02 工程ビューで L0-L14 全工程のテンプレートが表示され、進捗・担当・詰まりの 3 軸のみが可視化され、機能内容 (FR 詳細) が画面に含まれないことを確認。各工程セルの状態 (not-started / in-progress / blocked / done) が PLAN state と整合することを観測 (not-implemented) | L0-L14 全工程が表示 / 3 軸以外の情報 (機能内容) が画面に露出しない / PLAN state 整合 |
| **OT-34** | PM-03 (Gate + 詰まり要因: 現発生中トラブル横断) | PM-03 Gate + 詰まり要因ビューで現在発生中の gate fail / block / 詰まり要因が全 PLAN 横断で一覧表示されることを確認。詰まり要因の severity (critical/warning/info) 別集計と next_action 提示が動作することを観測 (not-implemented) | 現発生中詰まりが横断一覧 / severity 別集計が動作 / next_action が提示 |
| **OT-35** | PM-04 (Trace + V-pair 統合: 4 artifact + 6 pair freeze 状態) | PM-04 Trace ビューで V-model の 4 artifact (設計/実装/テスト設計/テストコード) と 6 pair (L1↔L14 / L2↔L10 / L3↔L12 / L4↔L9 / L5↔L8 / L6↔L7) の freeze 状態が可視化されることを確認。trace 断絶・孤立 artifact が検出されることを観測 (not-implemented) | 4 artifact + 6 pair が表示 / trace 断絶検出が動作 / 孤立 artifact がハイライト |
| **OT-36** | HM-01 (機能一覧: FR-L1 47 件 × implementation_status 全件表示) | HM-01 機能一覧ビューで FR-L1-01〜35/37/39/40/41/42/44/45/46/47/48/49/50 の 47 件が implementation_status (not-implemented / design-only / implemented / deprecated) 付きで全件表示されることを確認。孤児 FR・status 欠落行が 0 件であることを観測 (not-implemented) | FR-L1 47 件が全件表示 / implementation_status 列が存在 / 孤児・欠落 0 |
| **OT-37** | HM-02 (カバレッジヒートマップ: 観点 8 × 軸 5 = 40 通り表示・弱点 cell 検出) | HM-02 カバレッジヒートマップビューで観点 8 軸 × カバレッジ軸 5 = 40 通りのセルが表示され、カバレッジ率が低いセル (弱点) がハイライト・識別されることを確認。全 40 セルが表示可能 (値 0% でも non-null) であることを観測 (not-implemented) | 40 通りセルが全件表示 / 弱点 cell が自動ハイライト / 空セル 0 |
| **OT-38** | HM-03 (配線図 動的: hook/provider/drive エラー赤表示、CC1=a) | HM-03 配線図ビューで hook / provider / drive の接続状態が動的グラフで表示され、エラー状態のノード・エッジが赤 (🔴) でハイライトされることを確認。CC1=a (クリティカルチェーン優先度 a) の接続が正常時は緑 (🟢)、警告時は黄 (🟡) で表示されることを観測 (not-implemented) | 動的グラフが表示 / エラーノードが赤表示 / CC1=a 接続の色分け動作 |
| **OT-39** | HM-04 (DB 閲覧 整合性チェック: orphan record / drift / 不正値検出) | HM-04 データベース閲覧ビューで state ストアの全テーブルが閲覧可能であり、整合性チェック (orphan record / drift / 不正値) の結果が行単位で視覚化されることを確認。不整合検出行が赤 (🔴) でハイライトされ、next_action が提示されることを観測 (not-implemented) | 全テーブル閲覧可能 / 不整合行が赤ハイライト / next_action 提示 |
| **OT-40** | HM-08 (AI 効果データ + Learning Engine: BR-21 L3 carry、L1 宣言確認) | HM-08 AI 効果データ + Learning Engine ビューが screen sub-doc に宣言されており、BR-21 L3 carry との接続が §7 対応表に明記されていることを確認。L1 時点では宣言確認のみ (not-implemented)。L3 FR-L1-36/38/43 詳細化後に実装対象 | HM-08 宣言が screen sub-doc に存在 / BR-21 L3 carry pair が §7 に明記 / 詐称なし (not-implemented) |
| **OT-41** | GD-01 (ガイド統合ビュー: 7 カテゴリ左サイドナビ切替確認) | GD-01 ガイド/ドキュメント統合ビューで左サイドナビの 7 カテゴリ (Troubleshooting / Architecture / Onboarding / Tutorial / CLI / FAQ / Changelog) が切替可能であり、各カテゴリのコンテンツが表示されることを確認。カテゴリ未存在・孤立コンテンツが 0 件であることを観測 (not-implemented) | 7 カテゴリが左サイドナビに全件表示 / 切替動作 / 孤立コンテンツ 0 |
| **OT-42** | §3 横断原則「人間主導 + AI 補助」確認 | 全 15 画面 (PM-01〜06 / HM-01〜08 / GD-01) で AI 指示 copy UI が存在し、S-01「AI は UI 操作なし」と整合することを確認。AI が UI を直接操作する導線が実装上 0 件であることを観測。人間 (PO/PM/TL) が最終判断を行う UX フローが全画面で保たれていることを確認 (not-implemented) | AI 指示 copy UI が全 15 画面に存在 / AI 直接 UI 操作の導線 0 / 人間判断フローが保持 |
| **OT-43** | §3 横断原則「詳細データテーブル必須」確認 | 全 15 画面でサマリ表示のみの画面が 0 件であり、raw data を詳細テーブル形式で表示する UI が各画面に存在することを確認。テーブル表示の粒度 (行単位で個別レコードが確認可能) が全画面で保証されることを観測 (not-implemented) | サマリのみ画面 0 件 / 詳細データテーブルが全 15 画面に存在 / 行単位閲覧が可能 |
| **OT-44** | §3 横断原則「問題箇所視覚化」確認 (🟢/🟡/🔴 色分け) | HM-03 配線図 / HM-04 DB 閲覧 / PM-03 Gate+詰まり要因の 3 画面で正常 (🟢) / 警告 (🟡) / 失敗 (🔴) の色分け表示が動作することを確認。色分けが screen sub-doc §3 横断原則の定義と整合し、他 12 画面でも同一色ルールが適用されることを観測 (not-implemented) | 3 画面で 🟢/🟡/🔴 色分けが動作 / 色ルールが全 15 画面で統一 / 逸脱画面 0 |
| **OT-45** | functional §1 対応画面列 (G1-trace、P0 19 件) + screen §5 trace マトリクス + business §1.2 BR 一覧 | G1-trace 業務 ⇔ 画面 双方向 trace 整合を機械検証する。R1: 全 BR/UX/BR-21/BR-22 (13 件) が最低 1 画面紐付き / R2: 全 15 画面が最低 1 BR/UX/FR-L1 紐付き / R3: FR-L1 P0 19 件全件画面紐付き / R4: L3 PLAN `dependencies.requires` に business + functional + screen の 3 軸列挙。整合確認は `ut-tdd plan lint --gate G1-trace` と `ut-tdd doctor` で実行 | R1〜R4 全条件 pass / 機械検証 fail 時は該当孤児を表示 + 「screen §5 trace マトリクス または L3 PLAN requires を更新してください」next_action 提示 |
| **OT-46** | BR-22 / FR-L1-46〜49 (内部資産 UT-TDD 化) | subagent roster / skill pack / command docs / CLI command asset を UT-TDD 正本へ再構築し、HELIX 絶対パス・`helix` 正本 command・vendor runtime 直参照が残らないことを確認する。実行ロジックは TS/Bun 再実装、markdown/docs/templates は修正転用、vendor/historical は無修正参照のみとして分類されることを観測 (not-implemented) | FR-L1-46〜49 が L1↔L3↔L4 carry に接続 / runtime 無修正転用 0 / W6/W7/W10/W11/W12/W16 + IMP-033 が trace される / drift lint 設計に接続 |
| **OT-47** | PM-06 (設計書ビューア: L0-L14 設計書ツリー + Markdown/YAML/Mermaid 整形プレビュー、2026-06-22 追加) | PM-06 設計書ビューアが screen sub-doc に定義されており、L0-L14 設計書ツリー (layer×sub-doc、status/pair-freeze バッジ) が表示され、選択 doc が Markdown 本文 + YAML frontmatter 構造化 + Mermaid/ASCII 図として見やすくレンダリングされプレビューできることを確認。プロジェクト単位 (`:case`) で read-only (S5=b、編集導線なし)、PM-04 trace への deep-link が動作することを観測 (not-implemented) | 設計書ツリーが L0-L14 全層表示 / Markdown/YAML/Mermaid プレビューが描画 / read-only (編集導線 0) / PM-04 deep-link 動作 |

> **新規 OT-18〜OT-31 (14 件) + OT-32〜OT-44 (13 件) + OT-45〜OT-46 (2 件) + OT-47 (PM-06、2026-06-22) 追加 = 計 47 件** (既存 17 + 新規 30 = 47 件確定、2026-05-28 全面再編更新 + G1-trace 拡張 + 2026-06-02 BR-22 fullback + 2026-06-22 PM-06)

## 2. 成功条件 (§4) の被覆

| 成功条件 | 被覆 OT |
|----------|---------|
| ① 1 案件を L0-L14 通し | OT-01 |
| ② 複数人 team が日常 PR で gate | OT-02 |
| ③ AI 委譲で回帰が壊れない | OT-03 (+ OT-07 デグレ禁止で強化) |
| ④ 工程表で進捗が見える (専用 UI) | OT-06 |
| ⑤ PoC / 検証成果が契約化されて合流 | OT-04 |

NFR-07 (実務で機能する完成度 = 5 条件総合) は上記 5 行の総合成立で被覆。

## 3. 量閉じ一覧 (要求 → OT 被覆、孤児チェック)

L1 5 sub-doc 構造に再編 (v1.2、v2 HELIX-workflows 設計概念参照) に合わせ、sub-doc 別に再構成:

### business sub-doc (BR-*) — `docs/design/harness/L1-requirements/business-requirements.md`
- BR-01→OT-01 / BR-02→OT-02 / BR-03→OT-03 / BR-04→OT-04 / BR-05→OT-05 / BR-06→OT-06 / BR-07→OT-07 / BR-08→OT-08 / BR-22→OT-46。**孤児 BR = 0**。
- BR-21 (新規、AI 実行成果評価 L3 carry) → **OT-18** (宣言確認のみ。実装はL3 FR-L1-36/38/43 carry)。
- business §3.3 9 mode 統一合流原則 + Add-feature 例外 → **OT-19** (concept §2.5 整合確認)。
- business §4 ステークホルダー権限分離 (S-01〜S-05 + harness 運用者) → **OT-20** (権限境界確認)。
- business §6.5 業務 KPI D-01〜D-09 → **OT-21** (KPI 計測式・目標値・計測場所 整合確認)。**孤児 BR = 0**。

### functional sub-doc (FR-L1-*) — `docs/design/harness/L1-requirements/functional-requirements.md`
- FR-L1-01〜35 (HELIX-workflows 設計概念参照) → **OT-14** (代表 5 機能で 1 件、軽量原則)。
- FR-L1-06/08/12/14/16/19/20 (P1 拡張機能代表) → **OT-24** (extended 部分のみ確認)。
- FR-L1-37/39/40/41/42 (新規 P1 5 件、PO directed 2026-05-28) → **OT-22** (drive 自動判定 + model 推挙 + provider 引継ぎ代表シナリオ)。
- FR-L1-44 (途中導入 onboarding workflow、新規 P1) → **OT-23** (baseline 作成シナリオ)。
- FR-L1-36/38/43 (L3 carry、BR-21 経由) → **OT-18** (BR-21 宣言確認と pair。L3 で FR 詳細化)。
- 詳細な機能要件レベルの受入条件は L3 で FR-* + AC-* として詳細化 (本書は L1 軽量、量閉じ確認のみ)。**孤児 FR-L1 = 0** (FR-L1-01〜35 + 37/39/40/41/42/44/45/46/47/48/49/50 = 計 47 件、全被覆)。

### screen sub-doc (SR-*) — `docs/design/harness/L1-requirements/screen-requirements.md`
- PM-01〜PM-06 (PM 画面群 6 画面) → **OT-15** (L2 モック lift で PO 判定)。
  - PM-01 4 階層プルダウン → **OT-32** (俯瞰/工程/割当/詳細 動作確認)。
  - PM-02 工程ビュー L0-L14 → **OT-33** (進捗/担当/詰まり 3 軸表示確認)。
  - PM-03 Gate + 詰まり要因 → **OT-34** (現発生中トラブル横断確認)。
  - PM-04 Trace + V-pair 統合 → **OT-35** (4 artifact + 6 pair freeze 状態確認)。
  - PM-06 設計書ビューア (2026-06-22 追加) → **OT-47** (L0-L14 設計書 Markdown/YAML/Mermaid プレビュー確認)。
- HM-01〜HM-08 (HM 画面群 8 画面):
  - HM-01 機能一覧 → **OT-36** (FR-L1 47 件 × implementation_status 全件表示)。
  - HM-02 カバレッジヒートマップ → **OT-37** (観点 8 × 軸 5 = 40 通り表示・弱点 cell 検出)。
  - HM-03 配線図 (動的) → **OT-38** (hook/provider/drive エラー赤表示確認)。
  - HM-04 DB 閲覧 → **OT-39** (整合性チェック: orphan record / drift / 不正値検出)。
  - HM-05 Audit / 実行ログ → **OT-08** (doc-reviewer 召喚確認と兼用)。
  - HM-06 Recovery → **OT-10** (4 mode 動作確認内で Recovery ビュー被覆)。
  - HM-07 Doctor 結果ビュー → **OT-25** (FR-L1-18 pair 確認、旧 SCR-11 → HM-07 再採番)。
  - HM-08 AI 効果データ + Learning Engine (BR-21 L3 carry) → **OT-40** (L1 宣言確認のみ)。
- GD-01 ガイド統合ビュー → **OT-41** (7 カテゴリ左サイドナビ切替確認)。
- §3 横断原則「人間主導 + AI 補助」→ **OT-42** (全 15 画面 AI copy UI 確認)。
- §3 横断原則「詳細データテーブル必須」→ **OT-43** (全 15 画面サマリのみ画面 0 件確認)。
- §3 横断原則「問題箇所視覚化」→ **OT-44** (🟢/🟡/🔴 色分け HM-03/04 + PM-03 確認)。
- 3 カテゴリ間 deep-link 含む遷移 → **OT-26** (遷移整合確認、旧 6 遷移シナリオを 3 カテゴリ間に拡張)。
- G1-trace 業務 ⇔ 画面 双方向 trace 整合 → **OT-45** (FR-L1 P0 19 件全件画面紐付き / BR/UX 13 件全件最低 1 画面 / 15 画面全件最低 1 要求紐付き 機械検証)。
- BR-22 内部資産 UT-TDD 化 → **OT-46** (FR-L1-46〜49 / W6/W7/W10/W11/W12/W16 / IMP-033 trace、runtime 無修正転用 0)。
- 画面個別の受入観点は L10 UX 磨き + L11 UAT で詳細化。**孤児 SR = 0** (15 画面全被覆)。

### technical sub-doc (TR-*) — `docs/design/harness/L1-requirements/technical-requirements.md`
- TR-* (state schema 二層 / 工程別 skill 注入 / 9 mode 共通基盤 / drift 解消) → **OT-16** ("新規 drift 0 件 / week" 観測)。
- drive 別 state 区画 (FR-L1-40、technical §4 追記) → **OT-27** (区画 integrity + skip_sub_doc 機械強制確認)。
- AI provider 引継ぎ (FR-L1-42、technical §5 追記) → **OT-28** (Claude ↔ Codex handover 整合確認)。
- 具体的なアーキ整合は L4 基本設計 / L9 総合テストで確認。**孤児 TR = 0**。

### nfr sub-doc (NFR-*) — `docs/design/harness/L1-requirements/nfr.md`
- NFR-01→OT-09 / NFR-03→OT-10 / NFR-04→OT-10 / NFR-05→OT-11 / NFR-06→OT-03 / NFR-08→OT-12 / **NFR-02→L4 carry (下記、意図的 OT 不立て)**。NFR-07→§2 総合。
- NFR §7 IPA × ISO 25010 二軸表 → **OT-17** (孤児 NFR 0 + 除外理由整合)。
- **NFR-02 (更新性)** は L14 運用での直接観測が弱く、実現方式が L4 ADR 送りのため、ここでは OT を立てず **L4↔L9 pair で被覆** (L1 時点の意図的 carry)。
- NFR-13 (gate 通過率 ≥90%) → **OT-30** (KPI D-07 計測タイミング確認)。
- NFR-14 (agent guard bypass PO 承認 + audit) → **OT-31** (audit log 取得確認 / S-03・B6 連動)。
- NFR-16 (onboarding 互換性、新規) → **OT-29** (段階導入 block 回避シナリオ確認)。**孤児 NFR = 0** (NFR-01〜17 計 15 件、全被覆)。

### UX-*
- UX-01 (価値バランス) = 全 OT の重み付け原則 (§0/価値) であり単独 OT 化しない / UX-02→OT-06 / UX-03→OT-13。**孤児 UX = 0**。

> **件数確定: 既存 OT-01〜17 (17 件) + 新規 OT-18〜31 (14 件) + 新規 OT-32〜44 (13 件) + OT-45〜46 (2 件) + OT-47 (PM-06) = 計 47 件** (2026-05-28 全面再編更新: 14 画面 PM/HM/GD 再採番 + 横断原則 OT 追加 + G1-trace 拡張、2026-06-02 BR-22 fullback、2026-06-22 PM-06 設計書ビューア追加 OT-47)

## 4. trace (③ → ①)

本書の各 OT は `../../design/harness/L1-requirements/{business,functional,screen,technical,nfr}-requirements.md` の 5 sub-doc 内の BR-*/FR-L1-*/SR-*/TR-*/NFR-* と相互 reference する (v1.2 で 5 sub-doc 構造に再編、構想書 §3.1.2.1)。G1 (業務要求ゲート) で **5 sub-doc 全体 ⇔ 本書 1 doc** の pair freeze を PO サインオフで確定する。具体しきい値・受入条件は L3 AC / L12 受入テスト設計へ送る。
