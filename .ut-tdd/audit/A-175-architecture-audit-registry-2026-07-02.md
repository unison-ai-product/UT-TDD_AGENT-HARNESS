# A-175 - アーキテクチャ監査台帳 (concept 全域) + 修正駆動起票

- **date**: 2026-07-02
- **scope**: PO /goal 指示「アーキテクチャとして見るべきものをすべてリスト化して監査レポートにまとめて改善と対応を修正駆動モデルで起票」+ 追加指示「系列ではなく全部見るつもりでコンセプトを守れるようにして」。concept v3.1 (6 本の柱 + V-model + 駆動モデル + harness.db) を守る観点で、アーキテクチャ監査対象の**全域台帳**を定義し、既知所見を修正駆動モデル (Recovery / Add-feature / Refactor) で PLAN 起票した。
- **本台帳の役割**: 監査の抜け漏れ防止の正本。各領域の「守る柱 / 監査状態 / 所見 / 対応 PLAN」を一元化し、未監査領域を明示する (absence-blindness 対策を監査自身に適用)。

## §1 アーキテクチャ監査台帳 (全域)

| # | 領域 | 守る柱 (concept) | 監査状態 | 既知所見 / 対応 |
|---|---|---|---|---|
| 1 | 正本体系 (concept / requirements / ADR / glossary / rule-drift) | 柱2 機械強制 | **部分** (rule-drift / readability gate 稼働。terminology/glossary 整合の全数監査は未) | design-language gate 稼働。次 round 候補 |
| 2 | V-model 左腕 = Forward 設計群 (L0-L6 slot / substance / descent) | 柱1 基盤第一, 柱6 厳格検証 | **済 (A-174)** | 実質健全。drift/carry 所見 → PLAN-L7-236 / PLAN-L4-15 / PLAN-L4-16 / PLAN-L7-245 |
| 3 | V-model 右腕 = テスト設計・検証帯 (L7-L14、oracle/citation/defer) | 柱6 | **済 (A-174、L8/L9 重点)** | citation gate 盲点 → PLAN-L7-244。検証 roadmap 帯の実走査は verification cycle 時 |
| 4 | 駆動モデル (modes 11 種 + Forward、exit 強制、カタログ同期) | 柱5 実用オーケストレーション | **済 (A-173)** | back-merge 未着地 → PLAN-RECOVERY-07。exit 未強制群 → PLAN-L7-240/241/242、誤コマンド → PLAN-L7-238 |
| 5 | Gate / lint / doctor 機械強制層 (G0.5-G14、lint-wiring) | 柱2 | **済 (A-173/A-174 で双方向突合)** | lint-wiring 76/0 green。G1-content/G2/G4/G5/G14 未配線 → PLAN-L7-242 #8、contract 未配線 → PLAN-L7-239 |
| 6 | State DB (harness.db 投影・provenance・feedback・自動検出系) | 柱3 自動状態 | **済 (A-173 F-9 + A-176 焦点監査)** | mode 投影損失 → PLAN-L7-243。**feedback_events 消化 lifecycle 欠落 (全 2027 行 open 固定) → PLAN-L7-246**。guardrail ledger 宙吊り → PLAN-L7-239 追記。skill provenance 空洞は既知対応中。残未監査: provenance 実在性の全テーブル横断 (skill 縦 1 本雛形完了後) |
| 7 | Runtime hook / adapter (Claude/Codex parity、agent-guard/work-guard) | 柱5 | **部分** (L7-139 で Codex hook parity 済。A-172 C-2 で consumer 側配線 gap 検出) | consumer 配線 → PLAN-RECOVERY-06。**未監査: hook 実発火 telemetry の実走検証** |
| 8 | Provider delegation / team run / model routing | 柱5 | **部分** (A-137 全 remediation 済。実 AI task の live E2E は未実施) | live E2E は blocker でない既知 carry |
| 9 | Skill engine (recommend / inject / scaffold / 発火) | 柱4 動的注入 | **既知課題管理下** (実発火 0 問題 = 検証戦略で対応中、skill 縦 1 本雛形化方針) | 既存方針に従う (本監査で新規所見なし) |
| 10 | 配布 (Pack / sync-pack / release / 公開境界) | 柱1 | **済 (A-172)** | consumer 実動線 → PLAN-RECOVERY-06、sync 安全 → PLAN-L7-232、個人パス → PLAN-L7-233、tests → PLAN-L7-234、CI → PLAN-L7-235、doc 残渣 → PLAN-L7-236 |
| 11 | CLI surface (コマンド体系、cli.ts 分割) | 柱2 | **未監査** (cli.ts 3000 行超。Codex が抽出リファクタ進行中: L7-228/229/230 系) | `accept` 欠落は A-173 で検出 → PLAN-L7-242 #7。全面監査はリファクタ完了後が効率的 |
| 12 | 中央 UI (Phase A/B、src/web、screen-impl-pair-freeze) | 柱3 | **park (mock 段階)** | 監査は L10 pair-freeze 進入時に実施 (screen-impl-pair-freeze gate が段階を管理) |
| 13 | セキュリティ / escalation 機構 (安全境界、秘密情報) | Safety Boundaries | **部分 (A-172 leak 監査 + A-174 F-4)** | 設計 slot 欠落 → PLAN-L4-16。redaction self-trigger は既知運用注意 |
| 14 | CI / 検証インフラ (harness-check、Windows 盲点、biome) | 柱6 | **既知課題管理下** (A-147 Windows 盲点 / biome drift / CI feedback gap = 既知 carry) | Pack 側 → PLAN-L7-235。source 側 CI feedback 還流は PO 延期 carry のまま |
| 15 | ドキュメント体系 (document-system-map / readability / redaction / export) | 柱2 | **部分 (A-174 3 者突合済)** | sub_doc 整合 → PLAN-L7-245。mojibake 0 実測済 |
| 16 | Handover / feedback / memory (引き継ぎ動線) | 柱3 | **既知課題管理下** (handover generator defects 既知、canonical=harness.db、PLAN-L7-110 系) | 新規所見なし |
| 17 | リファクタ衛生 (mega-file、digest 波及、behavior-invariant) | 柱2 | **進行中** (contracts.ts 分割 = DISCOVERY-07 系、doctor 分割 = Codex 進行中) | 完了後に #11 と合わせ再監査 |
| 18 | 監査・routing 機構自身 (research 第二 exit、A-156 ledger) | 柱6 | **済 (A-156 dogfood 2026-07-02)** | 素通り/矛盾/policy_missing → PLAN-L7-237 |

**未監査 (次 round 優先順)**: ① #6 harness.db 全テーブル provenance 横断監査 (「fired/used/works は実 provenance 付き実走 evidence」原則の全面適用) ② #7 hook 実発火 telemetry 実走検証 ③ #11 CLI surface (リファクタ完了後) ④ #1 terminology/glossary 全数整合。

## §2 修正駆動モデル起票 (2026-07-02、plan lint green 済)

A-156 ledger の候補を以下へ起票した。すべて status=draft、着手順は PO 判断。

| PLAN | mode (駆動) | 出典 |
|---|---|---|
| PLAN-RECOVERY-06-pack-consumer-doctor-profile | Recovery (premise-gap) | A-172 C-1/C-2 |
| PLAN-RECOVERY-07-design-bottomup-backmerge | Recovery (deviation、PO「未着手」確定) | A-173 F-1 |
| PLAN-L7-232-sync-pack-clean-tree-guard | Add-feature (latent-defect) | A-172 |
| PLAN-L7-233-personal-path-guard-generalization | Add-feature (latent-defect) | A-172 |
| PLAN-L7-234-pack-test-skip-guards | Add-feature (feature-gap) | A-172 |
| PLAN-L7-235-pack-windows-ci-job | Add-feature (feature-gap) | A-172 |
| PLAN-L7-236-audit-doc-curation | **Refactor** (smell 集約) | A-172 / A-173 F-8 / A-174 F-2·F-6 |
| PLAN-L7-237-research-drive-hardening | Add-feature (dogfood 3 件) | A-156 dogfood |
| PLAN-L7-238-retrofit-preflight-doc-command | Add-feature (latent-defect) | A-173 F-2 |
| PLAN-L7-239-contract-enforcement-wiring | Add-feature (feature-gap) | A-173 F-3 |
| PLAN-L7-240-reverse-right-arm-exit-gate | Add-feature (feature-gap) | A-173 F-4 |
| PLAN-L7-241-human-signoff-evidence-gate | Add-feature (feature-gap) | A-173 F-5 |
| PLAN-L7-242-mode-exit-enforcement-batch | Add-feature (起票束、着手時 per-requirement 分割) | A-173 F-6/F-7 |
| PLAN-L7-243-mode-first-class-db-projection | Add-feature (latent-defect critical、PO gate 含む) | A-173 F-9 |
| PLAN-L7-244-right-arm-citation-gate | Add-feature (feature-gap) | A-174 F-1 |
| PLAN-L7-245-sub-doc-schema-integrity | Add-feature (latent-defect) | A-174 F-5 |
| PLAN-L4-15-nfr-grade-ac-landing | Add-feature (design、L4 carry 着地) | A-174 F-3 |
| PLAN-L4-16-security-design-slot | Add-feature (design、slot 新設 = PO gate) | A-174 F-4 |

補足: A-156 routing contract の Refactor 候補 prefix `PLAN-REFACTOR-` は plan_id token 規則 (L0-L14 / DISCOVERY / REVERSE / RECOVERY / M のみ) と不一致のため、schema に従い kind=refactor + PLAN-L7 採番とした (contract 側 prefix の訂正は PLAN-L7-237 のスコープに含める)。

## §3 要件レベル充足・上流デグレ判定 (PO 確認 2026-07-02)

**要件レベルは 2 点の既知未充足を除き充足、上流からのデグレは検出なし。**

- 上流 trace 実測 (起票後の doctor green run): `g1-trace OK (business=13, screens=15, p0Fr=19)`、`g3-trace OK (frL1=51, l3Fr=26, ac=117, at=118, l1Nfr=15, l3Nfr=17)`、`l6-fr-coverage OK (FR 51 件全接続)`、`descent-obligation OK (graded=255, chains=51)`、`entity-coverage OK`。L1→L3→L6 の要件降下鎖は機械・中身 (A-174 descent サンプル 3 件) の両面で維持。
- **要件レベル未充足として特定済みの 2 点** (要件が宙に浮いている箇所、本起票で追跡化): ① NFR-02/09 の AC が L4 carry placeholder のまま (→ PLAN-L4-15) ② NFR-17 (セキュリティ) の L4 降下先 slot 未定義 (→ PLAN-L4-16)。
- 上流デグレ無しの根拠: A-173/A-174 で全 mode/設計 doc の出典 anchor (concept §2.5-§2.6 / requirements §1.3-§1.8) 実在を突合済み。本起票は draft PLAN の追加のみで上流正本 (concept/requirements/設計 doc) に変更を加えていない。起票後の `plan lint` exit 0 / `doctor` exit 0 (db rebuild 後) を確認。
- 注意継続: 実装宣言 drift (A-174 F-2) は「上流が下流の実態より古い」逆方向 drift であり、上流要件のデグレではないが NFR-08 の観点で PLAN-L7-236 が受け皿。

## §4 コンセプト保全の判定

- 6 本の柱それぞれに監査領域が対応付き、柱を守る機械層 (gate/lint/DB/hook) の骨格は健全 (A-172〜A-174 実測)。
- 系統リスクは「宣言と機械の乖離」(exit 未強制 / 未配線 / 投影損失) に集約されており、本起票群 (特に PLAN-L7-239/240/241/243/244) がその解消線。
- 起票は全て修正駆動モデル経由で routing 済み (A-156 ledger + route-approval.jsonl 証跡)。
