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
| **IMP-034** | 2026-05-29 | A-77 PO 指摘 (前提抜け) → Recovery | **内部資産 (subagent/skill/command) を UT-TDD 用に作り替える FR が L1/L3 に不在** = FR-level 前提抜け。guard 機構 (FR-09) は TS 化済だが資産そのもの (roster/pack の中身) は未設計。subagent 19 = vendor byte 一致・未改変、`docs/skills/` 空 (curate 未着手)。是正は駆動モデル **Recovery** (PLAN-RECOVERY-01) で実施 → L1/L3 へ fullback (FR-AST-1〜4)。再発防止 = 内部資産 drift lint (HELIX 絶対パス残存検出 / docs/skills 空検出 / roster↔guard 整合) | FR / lint / policy | triaged | PLAN-RECOVERY-01 / internal-asset-inventory.md / FR-AST-1〜4 (L1/L3) / [[feedback-recovery-mode-for-premise-gap]] |
| **IMP-033** | 2026-05-29 | A-73 PO 承認 (A′) | **自動追加型クロスチェックエンジン** = 整合チェックを宣言メタデータ駆動のルールエンジン化 (doc レジストリ + ルールレジストリ + 自動 enroll + gate 束ね + カバレッジマップ)。doc 増加で lint 手書き不要。既存 5 lint をルール型へ吸収。FR-L1-18/05/03 の実現機構 (gate-design.md §4/§5) | lint / policy | triaged | gate-design.md / ADR-002 / IMP-001/002/003/006 統合 / L6-L7 |
| **IMP-029** | 2026-05-29 | A-68 physical-data self-review C-1 | 実在 L3 sub-doc の frontmatter `sub_doc` 値 (`functional` / `business-detail` 等) が requirements §1.10.G.1 VALID_SUB_DOCS.L3 spec (`functional-requirement` / `business-requirement` / `nfr-grade`) と食い違う。IMP-026 (SubDoc zod 化) 実装時に既存 doc が reject される潜在バグ。既存 doc の sub_doc 正規化 or G.1 を実態へ合わせる decision が必要。**PO 決定 (2026-05-29) = (b) G.1 spec を実態 (functional 等の短縮形) へ合わせる** (改修最小)、確定は IMP-026 実装 (L7) 時 | lint / doc | triaged | A-72 決定(b) / IMP-026 / L7 |
| **IMP-035** | 2026-06-01 | A-95 code-review (recovery=cross 解禁) | recovery=cross 解禁で kind=recovery PLAN が schema 通過可能になったが、§1.8 必須 role `aim` は schema superRefine で未検証 (既存設計どおり必須 role 検証は plan lint 側に集約)。recovery も poc/reverse/design と同様 plan lint で aim 必須を検証する。plan lint 実装まで schema 側は未検証 gap | lint / policy | triaged | src/plan/lint.ts / §1.8 / PLAN-RECOVERY-01 |
| **IMP-036** | 2026-06-04 | PO /goal (検証/改善ロードマップ起票) | 「要件定義の後に検証/改善ロードマップ構築フェーズを置く」プロセス挿入を docs/process/forward/ と requirements 該当 § へ Reverse back-fill で反映する (roadmap_v0.1 §6 back-fill 義務)。roadmap doc 自体は L3 設計層 doc として先行起票済 | doc / policy | observed | docs/design/harness/L3-functional/roadmap.md §6 / Reverse PLAN 未起票 |
| **IMP-037** | 2026-06-04 | granularity 監査 (PO /goal) | 右腕 test-design の frontmatter layer 表記が非対称 (L7=作成層L6+executed_at_layer / L8/L9/L3acc=実施層 / L1op欠落)。pair_artifact が左右対応を担保するが layer 意味論が不統一。vmodel lint 設計時に作成層/実施層どちらを正本にするか規約確定 | doc / policy | triaged | REVERSE-01 / vmodel lint / roadmap §1 観点B |
| **IMP-038** | 2026-06-04 | granularity 監査 (PO /goal) | L1-operational-test-design.md に frontmatter ブロックが欠落 (他 test-design は全て有)。lint が frontmatter 参照時に対象外化する穴 → 本 cycle で frontmatter 追加 (layer=L14。実施層 majority=L8/L9/L12 に倣う暫定。作成層 vs 実施層の規約統一は IMP-037 で確定) | doc | implemented | docs/test-design/harness/L1-operational-test-design.md (本cycle) |
| **IMP-039** | 2026-06-04 | granularity 監査 (PO /goal) | L2⇔L10 の「ワイヤーモック自体が③ペア」方針が overview §4・L2-screen/README に未明文化。右腕 doc を書くか否かの根拠が読めない | doc | triaged | REVERSE-01 / overview.md §4 / L2-screen/README |
| **IMP-040** | 2026-06-04 | granularity 監査 (PO /goal) | L7-unit U-RULE-01 が IMP-033 の 10 rule 型を 1 エントリに束ね、L6 edge-case §3 の rule 型単位列挙と粒度差。L7 entry (TDD Red) で rule 型単位の U-ID へ細化が必要 | doc | triaged | L7 entry / IMP-033 / L7-unit-test-design §1.3 |
| **IMP-041** | 2026-06-04 | granularity 監査 (PO /goal) | L9 ST-ASSET-04 が placeholder_deps (L6 確定待ち) だが setup-solo-team/handover の関数 signature が L6-05/06 で確定済 → 確定分の部分 back-fill が可能 | doc | triaged | L9-system-test-design §1.3.1 / PLAN-L6-05 / PLAN-L6-06 |
| **IMP-042** | 2026-06-04 | workflow 監査 (PO /goal) | PLAN-DISCOVERY-01 §1 メタモデル早見表に旧 drive 値 (poc/scrum/reverse、V7 前) が残存。V7 再設計 (drive=専門職5種、2026-06-02) と食い違い誤読源 → 本 cycle で V7 値へ修正 | doc | implemented | PLAN-DISCOVERY-01 §1 (本cycle) / drive_is_specialist_not_mode |
| **IMP-043** | 2026-06-04 | workflow 監査 (PO /goal) | Add-feature 経路B (L6→L7→Reverse→G3) と reverse.md §4 gate 通過義務 (forward_routing=L3 なら G3 前 L7 着手禁止) が衝突。初回 Add-feature の L7 着手が合法か境界条件未定義 | doc / policy | triaged | REVERSE-01 / add-feature.md §1.1 / reverse.md §4 |
| **IMP-044** | 2026-06-04 | workflow 監査 (PO /goal) | Scrum §4 が L11-L14 昇華と書くが forward_routing enum (L1/L3/L4/L5/gap-only) に L8-L14 が無く、どの値で右腕昇華するか未定義 | doc / policy | triaged | REVERSE-01 / scrum.md §4 / reverse.md §4 |
| **IMP-045** | 2026-06-04 | workflow 監査 (PO /goal) | Incident 再発防止テストが③テスト設計ペア起票へ未誘導 (incident.md §4)。①不在で④追加し AP-8 逆ピラミッドを誘発しうる | doc / policy | triaged | REVERSE-01 / incident.md §4 / concept §3.4 |
| **IMP-046** | 2026-06-04 | workflow 監査 (PO /goal) | Research mode の layer 範囲指定 (L1-L4) が VALID_LAYERS 単一値 schema と不整合 + docs/research/ が canonical tree 未登録・実体不在。research PLAN の layer 確定規則と memo 置場が未定 | doc | triaged | REVERSE-01 / research.md §1 / repository-structure.md |
