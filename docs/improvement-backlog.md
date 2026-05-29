# UT-TDD Improvement Backlog (作業ログ → 機能化 pipeline)

> 作業中に発見した「不備・改善」を蓄積し、triage して **lint / FR / policy / doc** へ機能化する living backlog。
> FR-L1-19 (Learning Engine) 本実装までの**手動の橋渡し**であり、ledger (`docs/migration/v2-import-ledger.md` の A-*) と相互参照する。
> ledger = 「採択・反映の決定台帳 (起きたこと)」/ 本 backlog = 「未機能化の改善候補 (これからやること)」の分離。
> 機械検証: `src/lint/improvement-backlog.ts` (要件定義書 §1.10.G.12)。
>
> **status**: `observed` (観測) → `triaged` (分類済) → `implemented` (実装) → `verified` (検証済)
> **自動化候補**: `lint` / `FR` / `policy` / `doc` / `none` (複数は `/` 区切り)

## §1 backlog

| ID | 観測日 | 文脈 (作業 / A-番号) | 不備・改善 | 自動化候補 | status | 紐付け (実装 lint / FR / A-番号) |
|---|---|---|---|---|---|---|
| **IMP-001** | 2026-05-29 | A-54 / A-58 | doc-count を全 sub-doc (business BR / nfr / L12 AT / AC) へ汎用化し、件数宣言 vs 実数を一括検証 | lint | triaged | requirements §1.10.G.11 第2弾 |
| **IMP-002** | 2026-05-29 | A-54 | 同一 ID の二重定義検出 (NFR-17 telemetry vs security 型の衝突)。定義 context の機械的確立が前提 | lint | triaged | requirements §1.10.G.11 第2弾 |
| **IMP-003** | 2026-05-29 | A-22 / G.2 | PLAN frontmatter `parent_design` / `pair_artifact` / `related_l0` の path を fs 実在検証 | lint | triaged | requirements §1.10.G.11 第2弾 |
| **IMP-004** | 2026-05-29 | A-55 | 既存 PLAN (PLAN-L1-* 〜 L5-*) の plan_id (層別 `PLAN-L<N>-<NN>-slug`) が planIdSchema regex (`PLAN-\d{3}` のみ) 不適合 → plan lint 有効化で全件 reject。**PO 決定 (2026-05-29) = (a) 層別 ID を正本** (requirements §395 と一致) とし frontmatter.ts regex を層別対応へ拡張 + テスト | lint | triaged | A-72 決定(a) / L7 frontmatter regex 拡張 |
| **IMP-005** | 2026-05-29 | A-58 retro | ledger / backlog の改善項目を `.ut-tdd/audit/failure_log.jsonl` へ自動連携する経路が無い (手書きのみ) | FR / policy | observed | FR-L1-19 / FR-L1-20 |
| **IMP-006** | 2026-05-29 | A-58 retro | 4 lint (g3-trace / entity-coverage / fr-registry / doc-consistency) の被覆範囲を一覧する lint-coverage-map が無い | doc | observed | HM-01 / HM-02 |
| **IMP-007** | 2026-05-29 | A-53 | commit 後に code-reviewer が不備を発見する手戻り。pre-commit / CI で自動発動する hook 化 (ut-tdd CLI 整備後) | policy | observed | A-53 / .claude hook |
| **IMP-008** | 2026-05-29 | A-57 | FR registry の `導入工程` (provenance) を `出典 doc` 列から正規化列へ昇格 (現状は自由記述に内包) | doc | observed | requirements §1.10.G.10 |
| **IMP-009** | 2026-05-29 | A-54 / A-57 / A-58 | code-reviewer subagent の最終 verdict が途中切れする (SendMessage 不可)。冒頭サマリ強制 / 出力分割で緩和 | policy | observed | A-54 / A-57 / A-58 |
| **IMP-010** | 2026-05-29 | A-58 | carry 宣言 (§3) と詳細表 (§3.1) の整合を機械化 | lint | verified | A-58 doc-consistency carry-consistency |
| **IMP-011** | 2026-05-29 | A-57 | 機能一覧 (FR registry) の漏れ監査を 5 型で機械化 | lint | verified | A-57 fr-registry-audit |
| **IMP-012** | 2026-05-29 | A-56 | ユビキタス言語を各工程更新の living glossary 化 + per-工程 lint | doc / policy | verified | A-56 G.9 |
| **IMP-013** | 2026-05-29 | A-60 G3 audit | FR-L1-20 (invocation_log) を L4 で詳細化する際 business-detail §2/§5 接続を明示 (AC-FR-BR21-02 の Phase A 前提との整合) | doc | triaged | L4 PLAN / business-detail |
| **IMP-014** | 2026-05-29 | A-60 G3 audit | ②実装↔④テスト docstring (双方向 trace edge 5-8、requirements §2.3) 形式を L4 で設計し L7 入口前に凍結 | doc | triaged | L4 / requirements §2.3 |
| **IMP-015** | 2026-05-29 | A-60 G3 audit | L3 functional §0 件数宣言が実件数ドリフト (「L3 FR 18 件」だが A-49/A-50 後の実数 26)。G3 audit で発見・修正 | doc | verified | A-60 (§0 を 26 件に是正) |
| **IMP-016** | 2026-05-29 | A-61 業界標準調査 | 各工程の作成必須ドキュメントを業界標準 (IPA 共通フレーム / ISO 29148 / arc42 / IEEE 1016 / ISO 29119 / DbC) で grounding した document-system-map を作成 | doc | verified | A-61 (document-system-map.md) |
| **IMP-017** | 2026-05-29 | A-61 Z1 | L4 を「方式設計 (arch/ADR、arc42 §4/§9)」と「外部設計 (外部 IF)」の sub-doc に明示分離 | doc | triaged | L4 着手時 |
| **IMP-018** | 2026-05-29 | A-61 Z2 | L4 外部 IF (what/形状) ↔ L5 D-API (how/contract 詳細) の粒度境界を明確化、二重定義回避 | doc | triaged | L4/L5 |
| **IMP-019** | 2026-05-29 | A-61 Z3 | L6 機能設計に IEEE 1016 §5.7 (Pseudocode) を grounding として concept §11 追記 | doc | triaged | L6 |
| **IMP-020** | 2026-05-29 | A-61 Z4 | L10 UX 磨きに WCAG 2.2 / ISO 9241-110 を受入基準 reference 追記 | doc | observed | L10 |
| **IMP-021** | 2026-05-29 | A-61 Z5 | L13 デプロイ後検証を ISO 29119-2 Test Evaluation に接続 (SLO/SLI を test result 扱い) | doc | observed | L13 |
| **IMP-022** | 2026-05-29 | A-61 Z6 | L3 AC を BDD/Gherkin (Given-When-Then) 記述形式候補として §11 追記、L12 受入と機械連携 | doc | triaged | L3/L12 |
| **IMP-023** | 2026-05-29 | A-61 E1 | ADR テンプレート (arc42 §9) を L4 方式設計 sub-doc の必須 artifact 化 | doc / policy | triaged | L4 |
| **IMP-024** | 2026-05-29 | A-61 E2 | テスト設計観点一覧 (ISO 29119-4 技法: 境界値/同値/デシジョンテーブル) を各テスト設計に明記 | doc | observed | test-design 全般 |
| **IMP-025** | 2026-05-29 | A-61 E3 | arc42 §5 (Building Block L1/L2) → L4/L5 sub-doc のビューマッピング表を追加 | doc | triaged | L4 |
| **IMP-026** | 2026-05-29 | A-64 data self-review C-1 | requirements §1.10.G.1 の VALID_SUB_DOCS を src/schema の zod enum 化 (現状 spec のみ、SubDoc 値オブジェクトが機械検証不可) | lint | triaged | L5/impl |
| **IMP-027** | 2026-05-29 | A-64 data self-review m-1 | business §10.2 carry 着地先 §番号 (§1-§7) と L4 data.md 実 §番号 (§2-§8) の +1 ずれを整合 (doctor §参照前に確定) | doc | observed | L4/doctor |
| **IMP-028** | 2026-05-29 | A-65/A-66 self-review C-1/I-3 (反復) | design PLAN §4 DoD の「§6 用語更新 / §7 機能要求更新 が存在」が **artifact の §番号**と誤読され self-review が 4 回連続で false-positive を上げる (artifact §6/§7 は内容節で PLAN §6/§7=delta とは別物、§番号衝突)。delta は **生成元 PLAN の §6/§7** に記録する規約。DoD 文言を「(PLAN 自身の) §6/§7 に記録 + artifact はヘッダで所在明示」へ template 修正 | doc / policy | implemented | A-70 template DoD 文言修正 (docs/templates/plan/design/template.md §4) |
| **IMP-030** | 2026-05-29 | A-71 PO 指摘 (前提ズレ) | external-if/if-detail が AI runtime (Claude/Codex) を **API key 認証前提**で記述 → CLAUDE.md「API 直叩きでなく契約プラン (月額) + CLI/hook」と矛盾。adapter は API key でなく **起動方式 (CLI subprocess / Claude Code Agent・hook)** を吸収、harness は AI provider の API key を保持せず認証は契約プラン CLI 自己管理。是正済 + 再発防止に「AI runtime に API key 前提を書かない」guard (L6/L7 doc + lint 候補) | doc / policy / lint | triaged | external-if.md/if-detail.md 是正済 / L6-L7 guard |
| **IMP-031** | 2026-05-29 | A-72 PO 指摘 (将来境界) | 画面 (14 screen) + DB を **Web サーバ側に配置**する場合、**local harness ↔ Web サーバ間のネットワーク通信境界**が新設される (現状は file-based local でネットワーク非依存)。Phase B / multi-team (L3 §7.2 BR-multi) で ADR-003 adapter 方針の延長として設計 | doc | observed | ADR-003 / external-if §2(e) / Phase B |
| **IMP-032** | 2026-05-29 | A-72 ADR-002 (PO 意図) | **依存関係の自動マップ生成 + 構想 (設計宣言) vs 実装 (実 import グラフ) の drift チェック**機能。architecture §3 / module-decomposition §4 を「期待依存マップ」に形式化し実グラフと照合、循環/逆依存/想定外 edge を fail-close。knip/madge 流用 (L3 §7.1) | lint | triaged | ADR-002 / L7 dependency lint |
| **IMP-029** | 2026-05-29 | A-68 physical-data self-review C-1 | 実在 L3 sub-doc の frontmatter `sub_doc` 値 (`functional` / `business-detail` 等) が requirements §1.10.G.1 VALID_SUB_DOCS.L3 spec (`functional-requirement` / `business-requirement` / `nfr-grade`) と食い違う。IMP-026 (SubDoc zod 化) 実装時に既存 doc が reject される潜在バグ。既存 doc の sub_doc 正規化 or G.1 を実態へ合わせる decision が必要。**PO 決定 (2026-05-29) = (b) G.1 spec を実態 (functional 等の短縮形) へ合わせる** (改修最小)、確定は IMP-026 実装 (L7) 時 | lint / doc | triaged | A-72 決定(b) / IMP-026 / L7 |
