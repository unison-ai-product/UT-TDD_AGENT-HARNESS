---
plan_id: PLAN-L1-09-ut-tdd-concept-v4-candidates
title: "PLAN-L1-09 (research): 構想書 v4.0 候補 (チーム開発版 Verified Change Harness) の L1/L3/L10 分解"
kind: research
layer: L1
drive: fullstack
status: draft
route_signal: research
route_mode: research
created: 2026-09-04
updated: 2026-09-04
owner: PO / Claude
github_issue_id: null
pair_artifact: docs/governance/candidates/ut-tdd-concept-v4-acceptance.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L3
review_evidence: []
agent_slots:
  - role: po
    slot_label: "PO - 2 大要求の提示と concept v4.0 候補の承認"
  - role: tl
    slot_label: "TL - 既存 authority (v3.1 / VUP-REQ / BR / U23) との重複・矛盾検査"
  - role: qa
    slot_label: "QA - L10 受入候補の falsifiability 検査"
  - role: se
    slot_label: "SE - 承認後の L1 delta / charter 追記 / 参照更新"
generates:
  - artifact_path: docs/plans/PLAN-L1-09-ut-tdd-concept-v4-candidates.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/candidates/ut-tdd-concept-v4.0.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/candidates/ut-tdd-concept-v4-requests.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/candidates/ut-tdd-concept-v4-requirements.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/candidates/ut-tdd-concept-v4-acceptance.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  blocks: []
  references:
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/design/harness/L1-requirements/business-requirements.md
    - docs/design/harness/L1-requirements/vmodel-upgrade-requirements.md
    - docs/design/harness/L1-requirements/vmodel-engine-swap-requirements-delta.md
    - docs/governance/vmodel-upgrade-schedule.md
    - docs/plans/PLAN-L4-30-execution-ledger-github-architecture.md
    - docs/governance/github-issue-hierarchy.md
---

# PLAN-L1-09: 構想書 v4.0 候補 (チーム開発版 Verified Change Harness) の L1/L3/L10 分解

## 1. 目的

PO が 2026-09-04 に提示した 2 大要求 (A: JSON 化による AI 開発ライク and 人間対応、B: チーム開発における
コンフリクト対策・進捗マネジメント機構、枠組み = human-on-the-loop) を、**現行 authority を追い越さない候補**
として L1 要求 / L3 要件 / L10 受入へ分解し、PO 承認後に concept v3.1 → v4.0 昇格と L1 delta (VUP-REQ-11〜) を
起こすための入力を作る。PO が提示した個人開発ハーネスの構想 v4.0 候補 (Verified Change
Operating System、非公開) から、チーム開発に必要な部分だけを翻案する。

### 1.1 目的の一文化 (PO 2026-09-04)

「次回の企画はここを高速化することにある」— v4 は上流検証型工程 (§2.6 の実録) の構造を保ったまま、人間 orchestrator 型 (§2.7 の
実録) の速度を出すための機械化である。高速化の対象は判断ではなく、人間が手で回している統合作業 (齟齬照合・チケット切り出し・
PR 別テスト仕様書・依存の暫定 → 確定・合流順・全件目視 review)。速度指標と構造指標を概念 §北極星 に併記した。

## 2. 起点の実測 (基準 ref = `b27720644a7589dc568c76cad7eb5e068654c824`)

### 2.1 既存の将来構想は engine-swap program に集約されている

```bash
git show b2772064:docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md | grep -c "^- \[ \]"   # 7 (完遂条件 8 件中 7 件未達)
git show b2772064:docs/governance/vmodel-upgrade-schedule.md | grep -c "| yellow \| draft"      # 非 green / 非 confirmed 58〜59 行 / 120 行 (grep 実装差: Linux 58、Git Bash 59)
```

charter §4 の後続テーマ 8 本と VUP-REQ-01〜10 に、**構造化正本と generated view (A)、複数人間ユーザーの
チケット / lease (B-①②)、人間へのナレッジ還流 (B-③)、層別 human-on-the-loop 境界** は含まれていない。

### 2.2 チーム協調の欠落は個別 issue として散在する

```bash
gh issue list --state open --limit 100 --json number,title | jq -r '.[]|select(.number==480 or .number==384 or .number==426 or .number==421)|"\(.number) \(.title)"'
```

#480 (PLAN 採番の衝突)、#384 / #426 (worktree lifecycle)、#421 (review request の memoryId 分裂) は、いずれも
「作業単位に owner と lease が無い」ことの症状であり、U23 Execution Ledger (PLAN-L4-30 / L6-83〜85 /
L7-436〜439。基準 ref で L4-30 と L5-23 は confirmed、L6-83〜85 と L7-436〜439 は draft、実装 slice 0) が契約の受け皿だが複数人間ユーザーを前提にしていない。

### 2.3 正本形式の現状

```bash
git show b2772064:docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md | grep -n "DB は authored source を直接置換しない"
git ls-tree -r --name-only b2772064 docs/plans | wc -l   # 949 PLAN (markdown)
```

typed spec IR (U8〜U12) は confirmed だが対象は宣言部のみ。record 類 (verdict / receipt / evidence) は
`.ut-tdd/review/receipts/*.json` のように既に JSON で、PLAN / schedule は markdown である。

### 2.4 PO 追加指示 4 領域 (C〜F) の現状受け皿

```bash
git ls-tree b2772064 skills/ | wc -l                                  # 81 (skill pack root、applicability は frontmatter prose)
git ls-tree -r --name-only b2772064 src/skill-engine | wc -l         # 2 (推薦 / 注入の実装)
git ls-tree -r --name-only b2772064 .ut-tdd/memory | wc -l           # 586 (HARNESS memory、退役機構なし: git grep -il retire b2772064 -- src/memory = 0)
git grep -l "^kind: poc" b2772064 -- docs/plans | wc -l              # 10 (PoC PLAN、S4 decision record 契約なし)
git grep -n "S0 backlog" b2772064 -- CLAUDE.md                       # 1 (Scrum / PoC S0〜S4 は workflow 一行のみ)
```

要求発見 (intake → discovery → compile) の工程は存在せず、typed spec IR (U8〜U12) は宣言部の
compile のみを対象にしている。

### 2.5 参照元の縮退・是正案件からの写像 (issue / merged PR 追突、2026-09-04)

参照元の直近 merged PR と issue を確認した。確認窓は `gh pr list --repo <参照元 repo> --state merged --limit 120 --json number,title,mergedAt` と `gh issue list --repo <参照元 repo> --state all --limit 200 --json number,title,state,labels` の出力 (2026-09-04 実行、各 limit 上限まで返却) であり、repo 名は PO 指示 (2026-09-04) により本文・PR・commit に記載しない。件数はこの limit 窓の上限であって全件数の主張ではない。UT 側の実測痛点と一対一で対応するものを束縛する
(新 issue は起こさない。既存 issue の受入条件へ転記する)。

| # | 参照元の解 (要旨) | UT 側の受け皿 | 候補要件 |
|---|---|---|---|
| A1 | review receipt を candidate workspace と Node authority に束縛 | PR #516 r1 で receipt が worktree 側に書かれた実測、#424 | FR-027 |
| A2 | reviewer session attestation、malformed receipt の訂正世代、admission 失敗の typed reason | #505 / #493 / #386 / #393 | FR-027 |
| A3 | receipt 失効の merge カスケード: 当面は直列運用 (receipt → 即 merge)、恒久案は tree 差分ゼロの update-branch で receipt 継承 | #439 / #218、2026-09-04 merge-order lesson memory | FR-013 (再確認) |
| A4 | GitHub open branch / PR を read-after 付きで走査する PLAN reservation provider | #480 | FR-004 (U23) |
| A5 | 証明ベース gc (ancestor + clean のみ、dry-run 既定、audit)、未 commit 残置と未 push / stale base の doctor 化 | #384 / #426 / #444 | FR-027 |
| A6 | projection writer の silent skip を finding 化 | graph 鮮度 (#169 系)、#242 | FR-027 |
| A7 | `sync-pack --prune-local` の dry-run 既定 + confirm 必須 + repoRoot 祖先拒否 | UT 側は未計測 (要実測、CLAUDE.md §Distribution Repository) | FR-026 |
| B1 | Surface Rationalization (7 class + 利用計測で退役) | `skills/` 81 entry、agent-guard allowlist 19 種 (未計測) | FR-025 |
| B2 | subagent ロスター縮退 (中間 tier 退役、判断 = frontier / 創出 = 量産 tier の 2 層) | CLAUDE.md §Model / Effort Routing (3 層前提) | FR-023 / FR-025 |
| B3 | team run / pair-agent を互換面化し利用実績で段階廃止 | `ut-tdd team run` (Canonical Commands / rule-drift marker) | FR-025 / FR-026 |
| B4 | legacy 出力 consumer inventory (current surface × legacy token 完全行列) | #487 / #450 Bun 撤去、旧 9-mode 残骸 | FR-026 |
| B5 | migration source archive の manifest 化退役、legacy DB schema object の原子的退役 | `docs/migration/` snapshot、harness.db (4.5GB) schema | FR-026 |
| B6 | Claude native memory の明示無効化 + 再出現 fail-close | #454 / #494 (切り分け候補) | FR-019 |
| B7 | Document Authority Census (全 tracked doc の class / owner / authority binding) | 949 PLAN + governance の正本判定 (A. JSON 化の前段) | FR-006 / FR-025 |

保留 (時期尚早・対象外): CI critical-path scheduler / verification plan / shard budget、Functional Release Slice、
post-release lifecycle authority (Pack canary #418 以降)、hosted preflight nonce / capability broker (外部実行 lane 前提)。

### 2.6 社内 project の実録 (UNISON-TECHNOLOGY/AI-office-de-seo、PO 提示 2026-09-04)

並行して要求整理と画面プロト詰めを進めている社内 project を、v4 候補の機構が実運用で成立するかの実録として参照する
(`gh api repos/UNISON-TECHNOLOGY/AI-office-de-seo/git/trees/HEAD?recursive=1`、`gh pr list / gh issue list --repo UNISON-TECHNOLOGY/AI-office-de-seo --state all`、
2026-09-04 実行、default branch main)。

| 現物 (HEAD 2026-09-04) | v4 候補の対応 | 所見 |
|---|---|---|
| L1 要求を 16 分類 (`L1-requirements/categories/`) + logic 5 本に分散、README §3「1 要求 1 正本・ID 参照・UI は計算しない」、`.github/workflows/requirements-audit.yml` → `scripts/audit-requirements.mjs` が REQ / AC の重複・参照切れを検査 | FR-002 / 原則 6 (分散正本)、FR-008 | 分散正本 + 機械照合が実運用で成立している実録 |
| `scripts/build-requirements-sheet-sync.mjs` が分類別要求 + acceptance-trace をスプレッドシート行へ生成 | FR-008 (スプシ同期 view) | 一方向生成の前例。v4 差分 = admission 経由の書き戻し、生成元 id / revision / digest 列 |
| `ai-office-de-seo-requirement-dependency-register_v1.md` (必須 / 条件付き / 任意、未成立時の縮退状態、プロト発見の依存は暫定 → 確定) | FR-046 依存 graph、FR-047 discrepancy record | discrepancy record の原型。暫定 → 確定が人間ゲート |
| README §3.2 順序「L1 → L2 → 画面・遷移・fixture 検証 → 差分を L1/L2 へ反映 → L3 確定」、screen finding、L3 契約は暫定 baseline | FR-039 製本点 (a)、FR-016、FR-048 backflow | 「初期画面でルール固定してから分担」の実装例 |
| `L3-ui-prototype/ai-office-de-seo-prototype-plan_v3.7.md`: 捏造禁止の fixture 契約 (§4)、異常系 fixture 必須セット PT-X、PT-* 受入チェックリスト (§6)、`ui-layout-check.yml` (Playwright) | FR-039 / AC-051、FR-017 | モック画像を正本にしない具体形。fixture が oracle |
| Issue #24〜#29「画面ルールを抽出して既存ルールと照合」(open) | FR-047 齟齬検出 | 現状は人手 issue。v4 では compiler が discrepancy record として発行する対象 |

不足 (v4 で埋める側): typed record が無く markdown + 正規表現抽出 (スプシ同期も同様)、screen finding が prose、チケット / lease /
admission が無く PR 単位の人手、依存台帳の暫定 → 確定が手作業。要求分類・依存台帳・プロト検証の 3 機構は移行コストが低く、
本 project は v4 の最初の適用先候補になる (採否は昇格条件の後、PO 判断)。

### 2.7 社内 project の実録 2: 人間 orchestrator 型 (unison-ai-product/AI-standardization-platform、PO 提示 2026-09-04)

人間が仕様を手で詰め、チケット単位で AI に指示し、自走させていない開発の実録 (`gh api repos/unison-ai-product/AI-standardization-platform/git/trees/HEAD?recursive=1`、
`gh pr list / gh issue list --repo unison-ai-product/AI-standardization-platform --state all`、2026-09-04 実行。PR 168 件 (merged 163 / closed 5 / open 0、最大 PR 番号 336 — 番号は issue と共有) / issue 168 件
(open 84 / closed 84)、実装期間 2026-07-10 handoff 〜 08-07。Sol r6 FLAG (receipt 61bb2bb3) で件数誤記を訂正)。

| 現物 (HEAD 2026-09-04) | v4 候補の対応 | 所見 |
|---|---|---|
| 仕様の正本はオンラインスプレッドシート 4 冊 (要件定義・基本設計・詳細設計・エージェント設計)、md は併読、xlsx は凍結スナップショット (`docs/README_HANDOFF.md`) | FR-008 (スプシ同期 view)、原則 6 | 人間はシートで考える、という実録。v4 は正本を record に置くが、人間の編集面はシートのままにし admission で戻す (書き戻し規律) |
| `docs/mock_ai_platform/` = 「機能なし完成版 = スコープの正本。モックにない要件は追加しない」 | FR-039 製本点 (a)、FR-057 | プロトがスコープ freeze の正本になった実例。v4 では製本物 (generated) がその役を担う |
| GitHub Issue `[ST-x-nn/FE|BE]` を人間が切り、1 PR = 1 ST、`Closes #`、PR ごとの `docs/01_spec/test_specs/PR-<n>.md` (TS-ID → test 関数名) | FR-036 小チケット = 1 PR、FR-034 compiler、原子 receipt | チケット切り出しと PR 別テスト仕様書を人間が手で作っている。v4 では compiler と receipt が生成する |
| `packages/api-types` は `openapi.json` の純関数、conflict は手で解決せず再生成、CI が再生成して差分 0 を検査 | FR-046 (generated view の決定性・digest 一致) | generated view 規律の実運用例 |
| Issue #334「設計ドキュメントの整合性を取り直す (正本シートと実装の齟齬)」、#333 負債整理、PR #313/#314 を close して #323/#324 で main へ載せ直し、#304「存在しない API への推測つなぎで 404」 | FR-047 discrepancy、FR-048 backflow、FR-004 lease、FR-052 refactor 発火 | lease / 依存 graph / discrepancy record が無いときの齟齬・再着地・推測実装のコストが可視 |
| `CLAUDE.md` の「正本の所在」「実装の絶対規約」(層の一方向、LLM 呼出は IF 経由、プロンプト直書き禁止、FE 型は生成物のみ) | FR-044 選好軸 (AI が変更しても壊しにくい)、FR-049 role record | 人間が書いた運用規約は選好軸 skill の抽出元 (実録) |

所見: この型は v4 の **移行元プロファイル** (standalone = 人間 orchestrator) であり、v4 が機械化する対象はここで人間が手で回している
チケット切り出し・テスト仕様書・シート齟齬取り・再生成の 4 作業に一致する。概念 §Provider topology に standalone の実態として追記。

### 2.8 社内 project の実録 3: 途中からハーネス概念を入れた実稼働システム (UNISON-TECHNOLOGY/seo-agent、PO 提示 2026-09-04)

社内 VPS で実稼働中の SEO 自動運用システム (AI-office-de-seo の前身)。2026-02 起点で、ハーネス (旧 HELIX) の Reverse / system-map を
途中 (2026-06〜07) から導入した (`gh api repos/UNISON-TECHNOLOGY/seo-agent/git/trees/HEAD?recursive=1` の blob 数 = tracked 5,636 file (2026-09-04 再計測、truncated なし)、
`gh pr list --state all` = 135 件 (merged 132)、`gh api .../commits` 直近 800 commit の type 分布、2026-09-04 実行)。
PO の狙い: 「設計書の製本の重要性と、変更時の更新の重要性が解ける」実例。

| 現物 (HEAD 2026-09-04) | 観測 | v4 候補が答える箇所 |
|---|---|---|
| `docs/reverse/system-wide/` 80 file (R0 evidence map / R1〜R4 / 契約 40 本超)、README の全 artifact が `draft*`、`RGC-readiness-and-completion-audit.md` = rgc-not-ready、25 gap が全 open | 途中導入の Reverse は「網羅的に書いたが閉じない」状態で止まる。契約が prose で増殖し、閉じる機構 (admission・receipt) が無い | FR-048 backflow record (1 契約 1 record、batch decision で閉じる)、FR-025 退役 record、原則 7 (単一 episode で昇格しない) |
| `docs/system-map/sources.md`: R0 catalog (2026-04-10) の UI 27 ページに対し「現行 33 ページと乖離判明済み」、docs inventory 229 file、gap report 孤児 228 / index mismatch 189 | 設計書が変更時に更新されず、後追いの監査で乖離を数える運用。カタログは手書き prose で digest も生成元も無い | FR-046 (図・inventory は record からの生成、同一 record → 同一 digest)、FR-047 (diagram drift は doctor fail-close)、原則 6 (generated view を編集しない) |
| `docs/system-map/01〜60` の連番監査・設計・WBS 文書、`docs/archive/detailed-design-v3.2-20260410/` (superseded 詳細設計一式)、`docs/archive/mockups-v2-20260410/` | 詳細設計とモックが日付付きで archive へ落ち、現行設計は「連番 doc の最新」を人が追う。製本点が無いので正本がどれか分からない | FR-039 / FR-057 製本点 (製本された screen id のみ正本)、FR-056 modernization register、§ハーネス標準共有機構 (人間はスプシ / 図で読む) |
| `CLAUDE.md` が「決定台帳 = doc23 §ユーザー決定 (確定 17 件)」「契約文書 = doc24〜27」「不干渉領域」を列挙し、運用報告書はスプレッドシート | 決定と契約の所在を人間が CLAUDE.md に手で書いて AI に読ませている。所在が変われば手更新 | FR-041 judgement / decision record、FR-008 スプシ同期 view、FR-049 role record (運用規約を skill 抽出) |
| commit type (直近 800): fix 281 / feat 158 / docs 126 / chore 58 / test 41 / refactor 11 | fix が feat の約 1.8 倍。設計と実装の乖離を fix で埋め続ける形。refactor は 1.4% | FR-052 / FR-053 (中チケットの refactor ゲート、projection 発火)、FR-037 (全体影響バグの stop-the-line) |
| `m1-tl-design-source.md`: Functional Freeze 対象 13 件が「未凍結」表で管理、契約 6 文書へ分割案 | freeze が表の手書き状態で、record でも遷移でもない | FR-058 (provisional / frozen の record 状態と遷移条件) |

結論: 途中導入で起きたことは「文書は増えたが正本が定まらず、変更時に更新されず、閉じない」であり、v4 が製本点・generated view の
drift fail-close・backflow record・退役 record を **最初から** 持つ理由がここにある。後付けで Reverse を回すコスト (80 file、全 draft) は、
初期に record と製本点を置くコストより大きい、という実録として §3 の設計判断の根拠に使う。

### 2.9 社内 project の実録 4: PoC 先行が行き過ぎて再設計 (UNISON-TECHNOLOGY/career-sheet-assistant、PO 提示 2026-09-04)

PoC 前提で作った実装が製品規模へ育ち、2026-08-18〜19 に Reverse R0〜R4 (PR #4〜#13) を 2 日で回して `e4723e4` で凍結、
`reference/poc/` (598 file: backend 120 / frontend 70 / tests 151 / docs 176) へ収容し、L0 企画書 v1.0 → v1.1 から再設計を開始した
(`gh api repos/UNISON-TECHNOLOGY/career-sheet-assistant/git/trees/HEAD?recursive=1` = 652 file、`gh pr list --state all` = 24 件
(merged 22)、2026-09-04 実行)。

| 現物 (HEAD 2026-09-04) | 観測 | v4 候補の対応 |
|---|---|---|
| `reference/README.md`: PoC 文書の `file:line` 引用 472 件のうち内容照合は 28 件のみ、POC-SUMMARY §3 未実証 5 件 / §4 技術負債 9 件、R4 gap register は open のまま | PoC が「動くもの」を優先して文書と実装の照合が追いつかず、製品化の判断材料が後追いになった | FR-017 (別 axis)、FR-018 (S4 を経ない昇格 deny)、**FR-059 (budget record と poc_overrun)** |
| `docs/governance/README.md`: 正本 / 参照 / 旧版の 3 区分、参照は「編集しない・引用しない・昇格させない・削除しない」、PoC 期の AGENT / CLAUDE / CI / hook は引き継がない | 行き過ぎた後の正しい止血。設定を引き継がないと明文化 | FR-059 (設定は設計結論として起こす)、原則 7 |
| `docs/governance/l0-decisions.md` (L0-D01〜D28 の安定 ID) + L1 5 sub-doc の frontmatter `covers` + `scripts/check-l0-coverage.mjs` (孤児 / drift / 未被覆を fail-close) | L0 → L1 のデグレ対策を record と機械ゲートで実装した実例 | FR-002 (contract compilation)、FR-046 (トレース図の生成元)、FR-058 (要求の暫定性: v1.0 → v1.1 の改稿を ID 追従で吸収) |
| PR #25 (open) ADR-002「書類出力は JSON 契約を単一ソースとし 4 系統へ一様変換」、PR #23 (closed) 再検証ハーネス | 再設計側で generated view / 単一 record の方針が採られている | 原則 6 |

所見: PoC が行き過ぎたのは「PoC の終わり」を決める record が無かったため。v4 は PoC に budget (規模・期限) と exit oracle を持たせ、
超過を機械が検知して S4 decision を強制する (FR-059 / AC-072)。再設計側で採られた L0 決定 ID + covers + fail-close gate は、
v4 の contract compilation の最小実装例として §3 の根拠に使う。

### 2.10 ハーネス自身の CI 実測: 画面検証とデータ整合性 (PO 指摘 2026-09-04)

PO 指摘「画面検証系の CI はほとんど作られていない。データ整合性も」。実測 (HEAD、`.github/workflows/harness-check.yml` の run step、
`grep -o 'full("[a-z0-9-]*"' src/doctor/check-definition-groups.ts | wc -l` = 100、`grep -rli playwright package.json .github` = 0 (依存も workflow も無し)。`src/lint/verification-profile-catalog.ts` は browser profile 2 件 (`playwright-mcp` / `vitest-browser-playwright`) を任意カタログとして宣言するが、`grep -rn "verify run" .github/workflows/*.yml` = 0 で CI からは実行されていない):

| 領域 | ある | 無い / 弱い |
|---|---|---|
| 画面検証 | `screen-impl-pair-freeze` (doc の pair-freeze のみ) | browser / layout / 遷移 / 状態表示の機械検証は CI 上 0 (browser profile はカタログ宣言のみで、依存も実行 workflow も無い)。ハーネスに画面が無いためだが、v4 の人間向け面 (スプシ同期 view・図・digest) を持つ時点で必須になる (FR-056 の dogfooding 条項) |
| データ整合性 | CI で `db rebuild`、doctor の `db-currency` / `db-projection-coverage` / `db-projection-ingestion` / `change-set-integrity` / `sub-doc-schema-integrity` / `design-doc-cross-integrity` / `telemetry-closure` | (a) projection 鮮度の fail-close (2026-07-28 の PLAN 重複見逃しは graph_nodes の鮮度が真因、issue #169。`telemetry-closure` は 4 table の provenance 欠落を partial で通す)、(b) receipt ↔ PR head ↔ CI run の三方 join を CI が検証する check (今は review-attestation workflow と `ut-tdd pr merge` 側のみ)、(c) harness.db の schema migration 回帰 (rebuild 以外の保護なし)、(d) generated view の決定性 (同一 record → 同一 digest) を測る check、(e) スプレッドシート / 図の同期実装そのもの (`src/export/document-export.ts` に断片のみ) |

所見: v4 が前提にする「機械の認識を人間に見せる層」とその鮮度・決定性・三方 join の整合性 check は、ハーネス自身に対してゼロから建てる。
工程 (§4) の最初の実装 slice は、この (a)(d)(e) をハーネス自身へ dogfooding する形で切る。

### 2.11 参照元構想の直近動向との照合 (2026-09-03〜04、PO 指示で再確認)

参照元の個人開発ハーネス構想 (名称は PO 指示により記載しない) の 9/3〜9/4 の issue / PR / commit を再取得し、本 PLAN の調査項目と照合した
(取得コマンドは §2.5 と同じ窓、2026-09-04 実行)。こちらの調査への直接回答は無いが、同じ問題へ独立に到達した項目と未着手の項目が分かれる。

| 本 PLAN の論点 | 参照元の直近動向 | 判断 |
|---|---|---|
| AI が要求を勝手に freeze / AI 解釈の authority 化 (FR-058) | P0 issue「AI 解釈を PO authority へ昇格する記録と superseded 再浮上を fail-close」、PR「harness memory は coordination-only」 (typed human_authority_claim / runtime_interpretation 分離) | 同方向。あちらは memory 側、こちらは要求 record 側。両方必要 |
| 製本と変更時更新の drift (FR-046 / 047) | issue「設計書の source_digest pin が実ファイルと照合されず腐る (main 実測 90 pin 中 6 stale)」 | drift fail-close の根拠が 1 件追加 |
| sub-agent の provider-native 化 (FR-049 / 050) | Concept v4.0 候補 Execution Plane: logical lane が第一級、provider 内部 subagent を独立 authority にしない、**Bench で task class × cost × mutation kill を測って割当** | 同方向。Bench による割当はこちらに無く、FR-043 (降格 ladder) の実測根拠として取り込み候補 |
| 大チケット = release slice (FR-036) | Functional Release Slice、Capability / Release Portfolio Management (Slice → Module → Bundle → channel) | 配布側があちらの方が厚い。v4 では 大チケットの受入 (L10〜L12) の先に置く候補 |
| 判断の蓄積 (FR-041〜044) | Adaptation Plane (UIL / RCL / Agentic Audit tier / Synthesis)、shadow verdict promotion | LLM verdict の calibration と cost tier 降格は無い (こちらの追加分) |
| refactor (FR-052 / 053) | Recovery / Refactoring の trigger admission、SR3 の exactly-one route | チケット階層別の責務は無い (こちらの追加分) |
| 画面プロト (FR-056 / 057) | L5 screen applicability prototype (prototype_required 分類、walkthrough ledger、静的画像は代替不可) | 重なる。fixture 契約・異常系必須・深度 profile・discrepancy record は無い |
| スプシ同期 view / 図生成 / discrepancy (FR-008 / 046 / 047)、provisional 状態、PoC budget、4 階層 + admission チケット、人間 review 傾斜、single-provider 偏見対策、費用非依存、チーム規模 backflow | 該当文書 0 件 (sheet / 図 / discrepancy / provisional / budget の語が候補文書に無い) | こちらの追加分として維持 |

取り込み候補 (v4 候補への追記は PO 判断後): Bench による model 割当の実測、Slice / Module / Bundle の配布契約、不変条件のうち
「gate が対象を検査していない状態を pass にしない」「compatibility green で current failure を相殺しない」「replacement evidence なしで
retire しない」の 3 本。

## 3. 設計判断

### 3.1 正本の置き場 (advisor design、claude-fable-5、2026-09-04)

| 案 | 内容 | 評価 |
|---|---|---|
| 1 | markdown 正本を維持し typed block を拡張、双方向 projection を追加 | 双方向書き戻しが lossy。ticket を markdown にすると conflict 率は下がらない |
| 2 | 正本を構造化 JSON/YAML へ全面移行、markdown は view | 949 PLAN の big-bang 移行、人間の diff review 性を損なう。却下 |
| **3 (採択)** | **artifact class 別 hybrid**: narrative は markdown 正本 + typed block、record (チケット / schedule / verdict / receipt / evidence) は 1 record = 1 file の構造化正本、view は generated | conflict が record 単位に局所化、charter §5 第 7 項と整合、既存 spec IR 経路を流用 |

concept 規則: 「正本形式は artifact の主読者で決める。双方向書き戻しは構造化正本に対してのみ admission 経由で
許し、markdown 正本への機械書き戻しは行わない」(候補 concept §原則 6、UTV4-FR-006〜009)。
残リスク: PLAN frontmatter の record 化は専用 Reverse 対で段階移行 (UTV4-FR-007)、generated view の hash gate
(UTV4-FR-008)、U23 との重複は改訂で吸収し新規起票しない (UTV4-FR-004)。

### 3.2 参照元構想 v4.0 からの採否

採る: Sovereignty / Change Contract Compiler / Control Plane / Assurance Kernel / Evidence Ledger / Adaptation の
6 Plane、8 原則のうち 7 (Composable Release は既存 Pack 配布契約へ写像)、exactly-one owner、lease / fence、
startup packet、evidence の段階 (claimed → current)、GitHub を projection とする一方向同期。
PO 追加指示 (2026-09-04) により、上流要求エンジン (L1 intake → L2 append-only discovery → L3 typed IR compile →
人間承認 freeze)、Discovery PoC の別 axis 化と S4 decision record、ハーネスメモリの captured → canonicalized →
retired lifecycle と責務 owner の学習資産、skill applicability の typed registry・最小 packet・telemetry・
可逆 quarantine・shadow 昇格を追加で採る (UTV4-BR-009〜012)。
採らない: Python 恒久意味コア (ADR-001 と衝突)、多軸分類 registry による routeFiling 置換
(別 version-up)、repository / CLI の rename。

### 3.3 Provider topology (advisor design、claude-fable-5、2026-09-04)

| 案 | 内容 | 評価 |
|---|---|---|
| 1 | hybrid の family 分離だけを独立 review とし、single-provider は常に劣化 evidence | 導入障壁が高い (2 社契約が前提)。v3.1 の現状 |
| **2 (採択)** | **独立性を authoring context 遮断 + reviewer attestation + exact HEAD 束縛で定義**し、family 分離を最強の実装、同 provider 別 session・上位 tier を補償統制付きの第一級 profile とする | 1 社でも成立。evidence tier を 3 段で記録するため僭称と相関エラーを事後識別できる。attestation の機械強制が前提 |
| 3 | single-provider は全 merge に人間 review 必須 | 安全だが human-on-the-loop の範囲を超え、チーム開発で回らない |

advisor 回答 (要旨):

- 推奨: 案 2。独立 review の本質は「著者の主張・文脈・確証バイアスからの遮断」であり、provider 族は実装手段の一つ。案 1 は単一 provider 構成 (Pack 配布先の単一契約ユーザー) で harness が成立せず、案 3 は自動化基盤の前提を自壊させる。
- 最小補償統制 4 点: (1) blind packet 必須 (既存 blind-reviewer を昇格)、(2) exact-HEAD 束縛 + attestation を merge 時に一致検証、(3) session / context 分離の機械証跡 (同一 session の review は fail-close、tier 差は維持)、(4) 決定論 oracle (CI green) を verdict の前提条件にし review は残余リスクのみ判定。human sampling は全件でなく merge の 5〜10% の監査 sampling で足りる。
- 主要リスク: 同族モデルの相関エラー (cross-family の唯一の実質的優位)。evidence tier を 3 段 (cross_family > same_family_separated > intra_runtime) で証跡に残す。attestation の形骸化は doctor fail-close で機械強制しない限り採用しない。
- 不足証拠: same-family blind review の欠陥検出率が cross-family と比べてどれだけ落ちるかの実測が無い (本 repo の verdict 履歴から方式別 FLAG / PASS-WEAK 率を集計可能)。単一 provider 需要は仮定のまま。

採択: 案 2。補償統制は FR-024 (高影響境界・release 適格性の人間 review、5〜10% 監査 sampling、CI oracle の mutation
検証) とし、doctor gate で機械強制されるまで第一級昇格を認めない (advisor 条件)。advisor が指摘した不足証拠
(方式別の検出率実測) は工程 8 で取る。concept §Provider topology、UTV4-BR-013、FR-023 / 024、AC-032〜034 へ降下。

### 3.4 設計のチケット化粒度 (PO 指示 2026-09-04)

PO は「詳細と仕様」をチケット化対象とした。採択: 詳細設計 (L5) と仕様 (L6 機能設計 / typed spec block) の
作成・改訂・Reverse を work item record で発行し (owner / lease = 対象 design + 対の test-design path / base・HEAD /
証拠義務 = pair-freeze review・design-language・V-pair 双方向)、L4 基本設計以上の narrative と設計判断は作業としては
チケット対象だが本文はチケットに入れず markdown 正本へ束縛する。現行 PLAN (kind=design / add-design) の frontmatter が
近い形を持つため、FR-007 の PLAN frontmatter record 化は design kind から始める。FR-004 / AC-038 へ降下。

### 3.5 owner cardinality と上流 PoC / 画面プロトのチケット化 (PO 指示 2026-09-04)

PO 指示: 「要件と基本 (設計) は 1 人がまとめる」「上流の PoC / 画面プロトはチケットにし、初期画面でルールを固定したら
分担する (地味に時間がかかる)」。採択: 層別境界表に owner cardinality 列を追加 (L0〜L4 = 文書単位 1 名の人間、
L5〜L7 = チケット単位 1 名、L8〜L12 = author と別の検証 owner 1 名)。PoC / 画面プロトは work item record で発行し、
複数人分担は初期画面ルール freeze record を前提、反応は L2 discovery event へ。BR-015、FR-028 / 029、AC-039 / 040 へ降下。

### 3.6 標準工程 flow (PO 提示 2026-09-04)

PO が提示したチーム開発の工程 (企画書 → 1 名の要求整理と画面モック → 集団プロトで細分化 → 確定 / PoC 割り振り →
集団 PoC と画面接続検証 → 要件定義と集団確認 → 基本設計 1 名 → 責務 / 依存別チケット → 統合チェックと再集計 →
リリース切り分け → 依存単位チケットと main への随時 merge 受入 → 合流点で引き取り統合 → 検査チケット → リリース) を
概念 §標準工程 flow へ写した。統制点 4 つを要件化: 発散区間の出口 = event / receipt (FR-016 / 028)、合流 owner = 統合
チケット + takeover receipt (FR-030)、再集計上限 (FR-031)、受入 = rebase 済み candidate の merge admission (FR-032)。
BR-016、AC-041〜043 へ降下。

### 3.7 人数不変性・統括 owner・チケットの機械発行 (PO 指示 2026-09-04)

PO 指示: 「途中から複数人になるなど柔軟に」「全体の進捗を統括するマネジメント層が必要」「自動チケット発行に
しないと並行 AI 開発は厳しい」。採択: 人数不変性 (FR-033)、統括 owner 1 名 = 判断だけを持つ層で進捗は projection
(FR-034)、チケットは ticket compiler が既定で生成し人は batch admission と人間 owner 割当のみ (FR-035)。前提条件は
L4 基本設計 typed block に責務 × path × 依存の行列を持たせること (A. JSON 化の実利、行列が無い文書からは推測生成
しない)。BR-017、AC-044〜046 へ降下。

### 3.8 チケットの 3 階層と発行の層別勾配 (PO 指示 2026-09-04)

PO 指示: 「要件定義まではチケット発行で割当でよいが設計以下は手では厳しい。上流は人間判断を多めに、下は自動発行」
「大・中・小チケットに分けたほうがよい」。採択: 発行の勾配 (L0〜L3 = 人が発行・割当、L4 = 文書 1 名、L5 以下 = compiler
既定) を FR-035 に固定し、3 階層 (大 = リリース切り分け / 中 = 責務・依存 = 統合チケット兼務 / 小 = path 単位) を
FR-036 として exactly-one parent・lease は小のみ・受入は階層別 (merge admission / 統合 review / release 適格性) で定義。
AC-047 へ降下。github-issue-hierarchy.md の sub-issue 規約は projection 側の表現として継承する。

### 3.9 スプシ同期の必須化・4 階層チケット・全体影響バグ・改善データ・製本点・実録学習 (PO 指示 2026-09-04)

PO 指示: (1) JSON 化した要求 / 要件 / 設計のスプレッドシート同期は必須 (人間はこれを見る)、(2) 書類を 1 枚に
まとめず分散させる、(3) チケットは大・中・小・原子の 4 階層で入れ子に収束、(4) 全体影響バグの対処、(5) 各 project の
log / issue / コメントからハーネス改善データを集める場所、(6) 画面モック / プロトの製本点、(7) 汎用 skill から
実録学習への転換、(8) 思想は人間ゲート付き分散コンピューティング。採択: FR-008 (必須 view + 分散正本)、FR-036
(4 階層、lease は原子のみ)、FR-037 (stop-the-line incident + fence + Reverse 対)、FR-038 (project intake record →
opt-in 一方向 export → Evidence Ledger)、FR-039 (L3 compile と L5 詳細設計の 2 製本点)、FR-040 (実録 provenance 必須、
GENERIC_PROCEDURE 退役)。BR-018〜021、AC-047〜052、概念 §北極星 / 原則 4・6 / §全体影響バグ… へ降下。

### 3.10 候補文書の置き場

参照元構想と同じく `docs/governance/candidates/` に置き、承認前は CLAUDE.md 読込順・`docs/governance/README.md`・
rule-drift marker・doctor gate から参照しない。承認時に v4.0 を `docs/governance/` へ昇格、v3.1 を `docs/archive/`
へ降格し、参照を一方向更新する (前例: v3.0 → v3.1)。

### 3.11 判断の蓄積と機械判断化・費用非依存の品質・選好判断軸 (PO 指示 2026-09-04)

PO 指示: 「LLM の判断を仕組みとして蓄積する自己学習型のハーネス。ログを機械判断化する。目指すのは高価な AI でなくても
人間と AI が品質を守りながら開発できること。良い悪いの判断に加え、人間ユーザーが好むシステム (プロダクトが人間に
使いやすく、AI が裏側で働いても壊しにくい) を作るための判断軸を skill として蓄積する」。

採択: (1) LLM 判断を judgement record として Evidence Ledger に必須記録 (BR-023 / FR-041 / AC-053)。既存の review receipt
(`.ut-tdd/review/receipts/`) と advisor 発火ログ (`.ut-tdd/logs/session/advisor-*.jsonl`) が record 化の起点。
(2) 後続事実の back-annotate による calibration と、LLM → 安価モデル → 決定的 check の機械判断化の階段。昇格は FR-022 の
shadow → before/after → 独立 review を再利用し、単一 episode 昇格を deny (FR-042 / AC-054、原則 7 と不変条件 8 を継承)。
(3) 費用非依存の品質: frontier tier は未学習の判断と人間ゲート直前の独立 review に限定し、routing に降格方向を持たせる
(BR-022 / FR-043 / AC-055)。現行 `escalateShallowResponse` は上方向のみで、下方向は新規契約。
(4) 判断軸を良否 / 選好の 2 軸に分け、選好軸 (人間の使いやすさ・AI 変更耐性) を実録から skill 化して判断パックへ注入、
選好軸の規約化は人間 decision record 必須 (BR-024 / FR-044 / AC-056)。
(5) PO 追補: 「AI が分かるだけでは組織的に使いにくい。人間も分かる面が必要で、それがスプシ同期系と画面モック / プロトによる
ハーネス標準共有機構」— 判断・学習層の全成果物を FR-008 / FR-039 の generated view へ投影し、人間可読 view の無い判断 / skill は
昇格不可とする (BR-025 / FR-045 / AC-057)。
非採用: LLM 判断の自動 authority 化 (approval 代行) — 北極星と原則 1 に反する。tier を品質根拠として記録することも deny。
概念本文には §北極星 (到達点の段落)・§判断の蓄積と機械判断化・不変条件 10 として反映した。

### 3.12 機械認識の可視化と齟齬検出 (PO 指示 2026-09-04)

PO 指示: 「依存グラフや画面遷移などを機械的に可視化する仕組みを入れ、図を作ることで機械が認識していることと人間が認識している
ことの齟齬を減らす。DB テーブルはスプシと相性がよい」。

採択: 図 (依存グラフ / 画面遷移 / ER・テーブル / チケット入れ子) は record からの決定的 generated view とし、生成元 id・revision・
digest を刻む (BR-026 / FR-046 / AC-058)。テーブル定義の正本は schema record で、スプシ同期 view と ER 図はそこから生成する。人間側の図・スプシ編集は
discrepancy record として diff し admission で戻す、diagram drift は doctor fail-close (FR-047 / AC-059)。起点は現行 harness.db の
`graph_nodes` / `dependency_edges` と docs の mermaid 描画 (実測: 2026-07-28 の PLAN-L6-94 / L7-465 重複見逃しは projection 鮮度が
原因であり、図の鮮度を fail-close にする根拠)。非採用: 手描き図・画像の正本化、層ごとの独自描画器。
概念本文には §ハーネス標準共有機構: 機械認識の可視化と齟齬検出 として反映した。

### 3.13 下流→上流還流 (Reverse) のチーム化 (PO 確認 2026-09-04)

PO 質問: 「下流から上流のフィードバック機構は現行でも入っているが、チームでも成立するか」。判断: 現行の Reverse
(R0〜R4 / backprop_decision / supersedes 双方向、1 PLAN 対 1 REVERSE の文書対) は 1 人運用では成立するが、チームでは
上流 owner の bottleneck・重複起票・還流中の下流継続・改訂後の手作業再発行の 4 点で破綻する。採択: backflow record
(集約 = 中チケット単位 exactly-one、batch decision、依存下流の fence、compiler による再 compile) を導入し、既存 Reverse 対
PLAN はその projection とする (BR-027 / FR-048 / AC-060)。新 engine は作らず FR-037 の fence と FR-034 の compiler を再利用。
概念本文には §下流から上流への還流 (Reverse) のチーム化 として反映した。

### 3.14 Sub-agent 機構の provider-native 再編とオーケストレーション形式 (PO 指示 2026-09-04)

PO 指示: 「ハーネス側の固有 sub-agent をなるべく排除して provider 単位に寄せた sub-agent 機構へ再編すべきではないか。それに伴い
オーケストラ形式も変わる」。実測 (HEAD、2026-09-04): `ls .claude/agents | wc -l` = 20 (Claude Code 固有形式、model / tools /
プロンプト焼き付け)、`.claude/CLAUDE.md` に allowlist 再掲、`src/team/delegation-routing.ts` に別系統の role 登録
(GATE_SUBAGENT_ROLES / REVIEW_GATE_ROLES / WORKER_DELEGATION_ROLES)、`.claude/hooks/agent-guard.ts` はファイル名で allowlist と
floor を判定。二重 role 体系で Codex 側に等価物が無い。
採択: 論理 role record (provider 非依存) をハーネス正本にし、provider 固有定義は adapter の generated view、guard は record を
単一根拠、ドメイン特化は skill 注入へ (BR-028 / FR-049 / AC-061)。オーケストレーションは control plane dispatch へ移し、LLM
orchestrator は lane の一種で closing authority を持たない (FR-050 / AC-062)。非採用: provider ごとの独自 role 体系の維持、
orchestrator への approval 代行。移行は既存 20 subagent の role + skill への分解と生成 view 化であり、専用 PLAN で段階実施する。
概念本文には §Sub-agent 機構の再編 として反映した。

### 3.15 single-provider における blind review の偏見対策 (PO 指示 2026-09-04)

PO 指示: 「単一 provider の場合は blind review で偏見を潰すことが重要」。採択: family 分離の欠落を blind packet の厳格さで補う
6 条件 (control plane が packet 生成・author claim 除去 / claim-blind + spec-blind の 2 lane 別 session / memory namespace 非共有 /
reviewer の oracle 再実行 + 反証試行 1 件以上 (ゼロなら PASS-WEAK) / tier・effort は author 以上で別 prompt pack / judgement record
として back-annotate し FR-024 sampling で hybrid 基準比較) を single-provider の admission 条件にする (FR-051 / AC-063)。
現行 v3.1 の blind-reviewer (claim-blind / spec-blind 2 lane、`.claude/agents/blind-reviewer.md`) を継承し、FR-049 の role record
へ移す。非採用: 同 family の同 session 内 review の独立 review 化 (不変条件 5)。概念本文は §Provider topology に段落追加。

### 3.16 削る機構: リファクタリング / 退役の階層別責務と発火条件 (PO 指示 2026-09-04)

PO 提案: 原子は TDD (red → green → refactor) で原子 PR 内に閉じる、小は原則不要 (object 化などの合成は有利)、中は結合テスト
レベルとしてリファクタリングを持つべき、大は機能群統合なので逆に refactor チケットを発行する flow を持つ。採択: そのまま階層責務
として固定し (FR-052 / AC-064)、発火条件を依存 graph・責務行列・計測 record からの projection にする (FR-053 / AC-065)。小の
合成点は任意の compose 原子、中は必須ゲート、大は逆方向発行 + 退役 (FR-025) の owner。共通則は behavior-invariant 受入と機能
原子との非混在 (1 PR = 1 論点、PR スコープ規律の継承)。起点は現行 `refactor-scout` (advisory only、実装しない) と routeFiling の
`refactor` mode (refactor kind の route 条件)。非採用: LLM の気づきだけでの発火、feature PR への refactor 積み増し。
概念本文には §削る機構 として反映した。

### 3.17 三者分離と merge lane のパス (PO 指示 2026-09-04)

PO 提案: 「PR review の merge lane を別の人へパスをつなぐ構造。チケット責務で他人を入れるべき。個人でやるべき範囲で整理」。
採択: author / 独立 reviewer / admitter の三者分離を階層別に固定し、小以上に admission チケット (merge lane、assignee ≠ author) を
compiler が対で発行する (BR-030 / FR-054 / AC-066)。個人でやる範囲 = author と admission 判断、他人へ渡す範囲 = review と
(人が居れば) admission。1 人運用は self-admission を record に印を付けて監査 sampling (FR-024) 対象にし、人が増えれば assignee の
値だけが変わる (人数不変性 FR-033)。admitter は receipt のみを入力とし成果物を書き換えない。現行の `ut-tdd pr merge --pr N` 経路は
admission チケットの消費として位置付ける。非採用: admitter による修正 commit の積み増し (PR スコープ規律 4 と同根)。
概念本文には §三者分離 として反映した。

PO 追補 (同日): 「結合テスト以上の実装は review したほうがよい」。採択: 人間 review を階層で傾斜させ、中 (結合) 以上を人間 review 必須、
対象は結合面に限定 (FR-055 / AC-067)。原子は AI blind のみ、小は AI blind + 別人 admission。1 人運用は AI blind 代替 + self-admission 印。

### 3.18 画面プロト工程の構成 (PO 指示 2026-09-04)

PO 指示: 「この開発では画面プロトの構成が薄いから、しっかり見ておいて欲しい」。実測: v4 候補は製本点 (a)(b) (FR-039) と分担条件
(FR-028) しか持たず、工程本体 (何を作り・何で検証し・何を record にするか) が無かった。採択: 社内 project の L3-ui-prototype 構成
(§2.6: screen inventory / flow / prototype plan / fixture 契約と異常系必須セット PT-X / mock event envelope / screen finding /
依存台帳の暫定 → 確定 / PT-* checklist / Playwright layout CI / modernization register) を record 化して工程本体に採り、
製本点 (a) の前段条件にする (BR-031 / FR-056 / FR-057 / AC-068 / AC-069)。ハーネス自身の人間向け面 (スプレッドシート view・digest・
ダッシュボード・CLI 対話面) も同工程を通す (dogfooding)。非採用: モック画像・自由文反応の正本化、正常系のみのプロト受入。
概念本文には §画面プロト工程の構成 として反映した。

PO 追補 (同日): 社内 project の深さ (簡易 DB・全列照合) は精度が必要で人間認識と AI 認識のずれが起きやすい領域だからであり、毎回そこまで
詰めるとは限らない。採択: 深さを screen id 単位の深度 profile (light / standard / deep) の値にし、必須最小 4 要素 (初期画面ルール・
inventory / flow・fixture 契約・typed finding) 以外は profile に従う。選定根拠は risk 信号 record (精度要求・discrepancy 実績・データ量・
外部依存)、deep は既定にしない (FR-056 / AC-068 改訂)。deep の典型 2 種 (PO 同日): 意味ロジック (独立 Gold ledger + CI 反証照合、社内 project
の Gold 監査 PR #40 / #43 が実録) と、正解のない予測・仮説先行の領域 (仮説 record + S4 decision + 実測 backtest、予測を確定値と
区別表示) (FR-056 追記 / AC-070)。

### 3.19 要求の暫定性と freeze 条件 (PO 指示 2026-09-04)

PO 指摘: AI 間の齟齬で要求が勝手に freeze され、修正しなおしが発生している。要求段階で確定できるのは PoC を通していて要件に固定しても
違和感が無いときか、明示的に「固定で」と言われたときだけで、それ以外は修正が出る前提にする。採択: 要求 / 要件 record に
provisional (既定) / frozen の 2 状態、freeze 遷移は人間 decision record か S4 confirmed + 人間 ack のみ、AI / compiler / verdict による
freeze は deny、provisional 依存チケットは再 compile 前提、view は区別表示、AI 間齟齬は discrepancy record へ (BR-032 / FR-058 / AC-071)。
freeze 率は目標にせず「freeze 後の改訂件数」を測る。非採用: 文書一括 freeze の既定化、AI による確定代行。
概念本文には §要求の暫定性 として反映した。

### 3.20 PoC の budget record と行き過ぎ検知 (PO 提示 2026-09-04)

実録 4 (§2.9) から、Discovery PoC に scope / budget record (問い・期限・許容規模・exit oracle・S4 期日) を必須にし、超過を compiler が
poc_overrun finding として出して S4 decision まで新規 PoC チケットを fence する (FR-059 / AC-072)。PoC 期の設定・CI・規約は production へ
引き継がず設計結論として起こす。非採用: PoC を production 工程へ昇格させる近道、PoC 規模の無制限。概念本文には §要求の暫定性 配下の
「PoC の行き過ぎ検知」として反映した。

## 4. 工程


| 手順 | mode | 内容 |
|---|---|---|
| 1 | serial | 本 PLAN と 4 候補文書を draft PR で起票し、cross-review (Codex family) を受ける |
| 2 | serial | PO が候補 concept / 要求 / 要件 / 受入を承認 (plan 固有 approval、typed provenance) |
| 3 | serial | concept v4.0 昇格 + v3.1 archive + 参照更新 (CLAUDE.md / AGENTS.md / README / repository-structure) |
| 4 | parallel | L1 delta (VUP-REQ-11〜14、additive) を PLAN-L1 系で起票 / charter §4 に後続テーマ 2 行追加 |
| 5 | parallel | U23 (PLAN-L4-30 系) を複数人間ユーザー前提へ改訂する Reverse 対 / record 正本 schema の L4-L6 設計 PLAN |
| 7 | parallel | §2.5 A1〜A7 / B1〜B7 を該当 issue の受入条件へ転記 (issue は新設しない)。B2 / B3 の縮退は利用実測 (FR-025) を先に取る |
| 8 | serial | 既存 verdict 履歴 (`.ut-tdd/review/receipts`、`review_evidence`) から cross_agent と intra_runtime_subagent の FLAG / PASS-WEAK 率を集計し、same_family_separated 昇格の妥当性を実測で裏取りする |
| 6 | parallel | 4 領域 (C〜F) の L3 設計 PLAN: 要求発見 event / IR compile (VUP-REQ-03 拡張)、PoC S4 record (routeFiling poc kind)、memory retirement + 学習資産 (PLAN-L7-189 系 Reverse 対)、skill applicability registry (`src/skill-engine/`) |

## 5. 完了条件

- [ ] 4 候補文書が cross-review PASS を受け、main に候補として存在する。
- [ ] PO 承認 record が typed provenance で残る (memory / chat / AI 解釈から生成しない)。
- [ ] 承認後の昇格・参照更新が 1 PR で行われ、rule-drift / read order gate が green。
- [ ] 既存 authority との重複・矛盾検査 (VUP-REQ-01〜10、BR-01〜08、U23、PLAN-L6-63 系) の結果が本 PLAN に記録される。

## 6. スコープ境界

本 PLAN は候補の materialize と分解のみを行う。runtime 実装、CLI / `.ut-tdd/` state の変更、DB schema 変更、
949 PLAN の移行、Issue の意味正本化は行わない。
