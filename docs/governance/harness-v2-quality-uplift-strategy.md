# UT-TDD Agent Harness v2 品質底上げ戦略 (実装・設計の実質品質)

- **date**: 2026-07-03
- **author**: Claude Fable 5。監査正本 = `.ut-tdd/audit/A-182-implementation-design-quality-audit-2026-07-03.md`
- **位置づけ**: `harness-v2-update-strategy.md` (アップデート戦略 = 運用・持続性) の**姉妹編**。あちらは「性能を発揮し続ける」ための 4 軸 (正確性の持続/経済性/適応性/後続実装効率)、本 doc は「成果物そのものの実質品質」を底上げする 4 軸を扱う。両者は重複しない (A-182 冒頭の境界宣言)。
- **読むタイミング**: ①リファクタ/設計 back-fill の着手順を計画するとき ②新 lint gate・新コマンド・新モジュールを実装する前 (§1 の軸が実装規範を兼ねる) ③四半期の品質再監査 (レンズ AQ/TQ/DQ/CX) を回すとき。
- **正本性**: 品質底上げの軸・wave 構成・起票候補の正本。着手順の最終決定は常に PO。

## §1 「実装・設計の実質品質」の定義 (判定 4 軸)

| 軸 | 意味 | 現在の主な敵 (A-182) |
|---|---|---|
| **構造衛生** | 変更が 1 箇所に閉じ、hybrid 並行編集が衝突しないコード構造 | megafile 2 本 (cli.ts 2,878 行 / projection-writer.ts 2,703 行)、frontmatter parser 私製 15 実装、walkMarkdown 5 複製 |
| **契約明確性** | 使い手 (特に文脈を持たない後続 AI) が誤用できないインターフェース | doctor --json 不在、--plan 二義性、exit code 2 未文書化、gate シグネチャ 3 世代混在 |
| **検証実質** | テストが欠陥を実際に捕まえ、仕様との対応を機械で辿れること | oracle_id 無し it() ~600、空 evidence の無言 bypass、doctor サブモジュール直接テスト不在 |
| **設計現役性** | 設計 doc が実装判断の現役資料であり続けること | L5 module-decomposition の凍結 stale (lint 5→78)、L6 設計 doc 不在 6 モジュール、PLAN references の設計 doc 断絶 |

原則: この 4 軸は**新規実装の受け入れ規範**を兼ねる。新 lint gate は共通様式 (load/analyze/Messages + shared util) に従い、新コマンドは --json と exit code 契約を持ち、新テストは oracle_id を引用し、新モジュールは L6 設計 doc (または architecture §3.1 拡張) を同時に積む。**底上げとは一括是正ではなく、この規範を機械 gate 化して「以後は自動的に良くなる」状態を作ること** (update 戦略 §4.4「あとで機構を足すは劣化ベクトルの母」と同根)。

## §2 現状基線 (2026-07-03、詳細と測定コマンドは A-182 §1)

- src 188 ファイル / 47,877 行。megafile 4 本 (>800 行)。src/lint 78 ファイルが最大モジュール
- 型安全は優秀: `as any` 0 / `@ts-ignore` 0 / `: any` 1。依存逆流 0 (lint→state-db なし)、L4 登録簿 orphan 0 (機械保証)
- 暗黙 fail-open `catch {` 202 箇所 (意図/握りつぶしの区別なし)
- tests 136 ファイル / expect 密度 3.19 / 実 repo 回帰 52 本 / 主要 gate 3 本の mutation 反転 red 確認 — テスト実質は既に B+
- レーン別判定: AQ = B− / TQ = B+ / DQ = B (L5 のみ RED) / CX = B−

## §3 品質底上げ wave 構成 (起票候補台帳)

方針: **Codex の hot zone (cli.ts / doctor / lint 抽出リファクタ、L7-325/326 進行中) を避けて外周から着手し、構造リファクタは Codex の抽出完了を活性化トリガーにする**。候補 ID は QU-x (quality uplift)。PLAN 番号は起票時に採番する — 本日 L7-325 衝突 (第 5 組) が発生しており、並行起票の番号予約は L7-256(d) 一意性 gate の landing まで PO 承認下で行う (§4)。

### Wave Q0 — docs のみ・即着手可 (コード無変更、Codex と衝突ゼロ)

| 候補 | 内容 | 出典 | 規模 |
|---|---|---|---|
| QU-1 design-stale-backfill | L5 module-decomposition.md の「lint 5 file」「plan/vmodel stub」を実態 (78 本/実装済) へ reverse back-fill。L7 実装証跡 PLAN-ID を明記 | DQ-1/DQ-3 | S (doc 1 本) |
| QU-2 module-l6-design-backfill | L6 設計 doc 不在 6 モジュールの add-design。**guardrail/github は安全境界のため PO エスカレーション先行**、context (DQ-7、L7-302 の子)・memory・graph・secret は通常 add-design | DQ-2/DQ-7 | M (6 doc、並列可) |
| QU-3 test-design-l6-crosswalk | L7-unit-test-design.md へ L6 設計 21 本との対応表を追記 (個別 doc 化はしない最小対処) | DQ-5 | S |

### Wave Q1 — 小粒コード是正 (1 行〜1 ファイル、hot zone 外)

| 候補 | 内容 | 出典 | 規模 |
|---|---|---|---|
| QU-4 cli-contract-polish | ①doctor --json (runDoctor 戻り値は構造化済み — 出力層のみ) ②handover exitCode ③showSuggestionAfterError(true) ④route eval に --json エイリアス ⑤exit code 2 の help 記載 | CX-2/3/5/6/4 | S〜M (**cli.ts を触るため Codex の CLI 抽出フェーズ完了後**) |
| QU-5 shared-util-consolidation | walkMarkdown → shared.ts へ 1 本化 (5 ファイル置換) + normalizedPath 3 ファイルを shared 参照へ。behavior-invariant、regression fence 付き | AQ-2 | S |
| QU-6 frontmatter-parse-ssot | frontmatter 生 parse 15 実装を共通 util (`src/lint/shared.ts` or `src/schema/frontmatter-raw.ts`) へ段階集約。CRLF/閉じ `---` 欠落の挙動を 1 箇所で定義しテスト固定 | AQ-8 | M (12 ファイル、機械的置換 + 回帰テスト) |
| QU-7 registrar-test-hardening | cli-distribution-registrar.test.ts の toBeTruthy を値一致へ昇格 | TQ-5 | XS |

### Wave Q2 — 規範の機械化 (以後の新規実装を自動で良くする gate 群)

| 候補 | 内容 | 出典 | 依存 |
|---|---|---|---|
| QU-8 lint-gate-interface-canon | lint gate カノニカル様式 (load/analyze/Messages + 共通型) を設計 doc + `src/lint/types.ts` で宣言し、新規 gate への適用を warn-first lint 化 | AQ-5 | QU-5/6 後 (共通 util が前提) |
| QU-9 fail-open-annotation | `catch {` の意図宣言規約 (`// fail-open: <理由>` or 共通 `failOpen()` helper)。新規 catch への lint は warn-first、既存 202 箇所は段階 back-fill | AQ-9 | なし |
| QU-10 plan-design-reference-lint | add-impl/refactor 系 PLAN の references に対応 docs/design/ を 1 件以上要求 (warn-first → 段階 hard 化)。L7-312 (鮮度) の姉妹 gate | DQ-4 | なし |
| QU-11 oracle-id-citation-gate | tests/ の it() → docs/test-design/ oracle_id 引用の段階義務化 (新規テスト warn → ratchet)。missing-test-oracle-id 671 件 feedback の恒常解 | TQ-1 | L7-274 (draft) と統合可否を PO/TL 判断 |

### Wave Q3 — 構造リファクタ (Codex 抽出完了がトリガー、大粒)

| 候補 | 内容 | 出典 | 依存 |
|---|---|---|---|
| QU-12 projection-writer-split | projection-writer.ts (2,703 行) を投影ドメイン別 (`src/state-db/projections/`) に分割。集約 entry は薄く維持 | AQ-4/AQ-7 | **Codex doctor/lint 抽出 (L7-325/326 系) 完了後** — 同時進行は最悪の衝突面 |
| QU-13 cli-registrar-completion | cli.ts 残り 80+ command を registerXxxCommands 様式で src/cli/ へ体系分割 + withDb ラッパーで try/finally 複製排除 | AQ-1 | Codex の CLI 抽出フェーズと**統合判断** (重複起票禁止 — 既存 L7-284〜286 の後続として拡張が正か PO/TL 確認) |
| QU-14 cli-lint-direct-import-resolution | cli→lint 直 import を review サービス層または doctor 経由へ整理 | AQ-3 | QU-13 と同時が効率的 |
| QU-15 doctor-submodule-tests | doctor サブモジュール直接 unit test (lint-gates/plan-governance 優先) | TQ-4 | L7-325/326 完了後 (対象構造が固まってから) |

### PO 判断を先行させる項目

- **QU-2 の guardrail/github**: 安全境界の設計 doc 化 — 書く内容自体が escalation 対象範囲を定義するため PO レビュー必須
- **CX-1 (--plan 二義性)**: API 破壊変更。`--plan-file` 分離案 vs `--text-file` 一本化案の選択は PO/TL 決定後に起票 (仕様を発明しない)
- **QU-11 と L7-274 の統合可否**: 既存 draft との重複起票を避ける統合判断
- **QU-13 と Codex CLI 抽出の分担**: hot zone の主担当は Codex が自然 — Claude 側は起票のみで実装は Codex routing が候補

## §4 起票運用の注記 (なぜ本監査は即ファイル化しないか)

A-181 時は起票 21 本を即日ファイル化したが、**本日 PLAN-L7-325 の番号衝突 (第 5 組) が実発生**しており、Codex が現在も新番号 (L7-326+) を消費しながら並行作業中。番号一意性 fail-close (L7-256 scope d) が未 landing の状態で 15 本並行起票するのは衝突再生産になる。よって本監査は**候補台帳 (QU-1〜15) を正本として提示し、PO の着手順決定後に、その時点の最新番号で順次起票する** — これは scope-integrity taxonomy の「宣言された延期 (出口条件付き)」であり、出口 = PO 決定 or L7-256(d) landing の早い方。

起票時の型 (route_mode=version-up, version_target=v2 は使わない — 本戦略は運用改善でなく品質是正なので、修正駆動の既定に従う):

- QU-1/2/3 (docs) = add-design or reverse back-fill (KIND ルールどおり)
- QU-4〜7 (小粒コード) = refactor (behavior-invariant) or add-impl (挙動追加分)
- QU-8〜11 (gate 新設) = add-design + add-impl 対 (Reverse pairing 必須)
- QU-12〜15 (構造) = refactor + regression fence

## §5 着手順の推奨 (PO への提案)

1. **即時 (今日から可能)**: Wave Q0 (QU-1→QU-3→QU-2 の順。QU-2 の guardrail/github は PO エスカレーション回答待ちで他 4 doc 先行)
2. **Codex hot zone 外の小粒**: QU-5 → QU-7 → QU-9 (warn-first 部分のみ)
3. **Codex CLI/doctor 抽出完了を合図に**: QU-4 → QU-6 → QU-8 → Q3 全体
4. **最大 ROI 単品**: **QU-4 の doctor --json** — オーケストレータの毎ループ体験を直接改善し、update 戦略側 L7-300 (doctor 高速化) / L7-313 (baseline sentinel) の実装が JSON 出力を前提にできるようになる。CLI 抽出完了直後の最優先を推奨
5. 四半期再監査はカタログの LENS-AQ/TQ/DQ/CX (本監査で追加) を 4 レーン fan-out — 本 doc §2 の基線と比較する

---

*update 戦略の末尾と同じ言葉で締める: wave の中身が古びたら捨てて構わない。§1 の 4 軸で測り直し、A-18x を 1 本増やし、また起票すればよい。ただし本 doc 固有の追記 — 底上げの本体は QU 番号の消化ではなく、§1 の軸が新規実装の既定になることである。*
