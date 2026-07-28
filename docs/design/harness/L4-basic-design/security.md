---
layer: L4
sub_doc: security
status: confirmed
pair_artifact: docs/test-design/harness/L9-system-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_nfr: docs/design/harness/L1-requirements/nfr.md
plan: docs/plans/PLAN-L4-16-security-design-slot.md
next_pair_freeze: L9
---

# UT-TDD Agent Harness - L4 基本設計: セキュリティ設計

本書は `PLAN-L4-16` により追加された L4 security slot の正本である。目的は、認証・認可・秘密情報・
監査証跡・配布前検査の方針を L4 基本設計の境界として固定し、下流の L6/L7 検出系がこの設計に従うようにすること。

## 1. 役割

`security` は L4 の外部設計 / 方式設計横断 slot であり、次を扱う。

- 秘密情報を source / docs / audit / DB projection / Pack 配布物へ混入させない方針。
- Claude / Codex / GitHub など外部 CLI の認証情報を harness core が保持しない境界。
- human approval が必要な操作 (本番影響、認証認可、秘密情報、鍵ローテーション、破壊操作) の escalation。
- distribution / release 前に実施する security gate の上流方針。

本書は鍵の実発行、失効、外部サービス設定変更を実行しない。実運用のローテーションや revoke は人間承認 runbook の対象である。

## 2. セキュリティ境界

| 境界 | L4 方針 | 下流 |
|---|---|---|
| AI runtime 認証 | Claude Code / Codex CLI の契約ログインが自己管理する。harness は provider API key を保持しない。 | L4 external-if / L7 runtime adapter |
| GitHub 認証 | `gh` CLI / GitHub Actions secrets が管理する。harness core は token を保存しない。 | L4 external-if / GitHub ops guard |
| docs / plans / audit | 実秘密値を書かない。例示は placeholder か明示的 dummy のみ。 | PLAN-L6-62 docs 横断 secret-scan |
| harness.db / memory / search | 投影・メモリ・検索 row に secret-like payload を保持しない。 | `src/secret.ts` narrow guard / state-db projection |
| distribution | Pack 同期・配布前に secret-scan を通す。検出時は fail-close し、skip は理由付き例外のみ。 | `ut-tdd distribution sync-pack` / doctor |

## 3. 検出責務

既存 `src/secret.ts` は DB / memory / audit / search 取り込み時の narrow guard であり、広域 credential scanner ではない。
docs 横断 secret-scan は `PLAN-L6-62` で L6 契約化し、AWS access key、GitHub token、private key block、
Bearer token、password / credential 直書きのような文書混入リスクを扱う。

検出系は本書の対象範囲・例外方針・配布前 fail-close 方針に従う。検出系の都合で scan 対象、allowlist、
配布ブロック条件を暗黙生成してはならない。

## 4. 例外方針

テスト用 dummy secret、仕様説明上の placeholder、既知の false positive は、例外理由と evidence path を持つ場合だけ許容する。
例外は「秘密情報を保存してよい」という許可ではなく、dummy / placeholder であることを機械的に説明する記録である。

## 5. 脅威モデル (STRIDE 相当、PLAN-L4-29)

本節は HARNESS 自身を対象にした体系的脅威モデルであり、ZIP-DOC-010 (セキュリティ設計書) の中核概念を
実体化する。対象は HARNESS 製品自身の資産であり、統制対象 (governed) プロジェクトの脅威モデルは
`docs/governance/vmodel-document-catalog.md` の profile 判断に委ねる (本書の対象外)。

### 5.1 資産棚卸し

| 資産 | 内容 | 主な露出面 |
|---|---|---|
| docs (governance/design/test-design/plans/audit) | 設計判断・PLAN・監査証跡の正本 | git history / Pack 配布物 |
| `harness.db` (state-db projection) | PLAN/schedule/review/skill 等の投影データ | ローカル filesystem / handover |
| `.ut-tdd/state` `.ut-tdd/logs` `.ut-tdd/memory` `.ut-tdd/audit` | ランタイム状態・監査・メモリ evidence | ローカル filesystem / commit 対象範囲 |
| hooks (`.claude/hooks/*.ts`, `.claude/settings.json`) | Claude Code PreToolUse/PostToolUse/SessionStart 制御 | ローカル実行環境 / 誤設定時の bypass |
| CLI (`ut-tdd`, `src/cli.ts` 配下) | 唯一の正規操作経路 | ローカル実行 / スクリプト経由呼び出し |
| Pack 配布物 (`ut-tdd distribution sync-pack` / `package`) | 外部配布される clean artifact | 配布先リポジトリ / 第三者利用者 |
| git history (commit / push) | 変更履歴・共同 runtime (Claude/Codex) の証跡 | GitHub リモート |
| AI runtime 認証情報 (Claude Code / Codex CLI / `gh` token) | harness core が非保持を宣言する外部認証 | provider 側管理 (harness 側は境界のみ) |

### 5.2 STRIDE 分類 → 対策/受容 trace

| STRIDE | 該当脅威 (資産) | 対策 or 受容判断 | 適用面 |
|---|---|---|---|
| Spoofing (なりすまし) | AI runtime / `gh` token を harness が代理保持し漏えい時に第三者が resource へなりすます | harness core は provider API key / token を保持しない境界を §2 の表で固定。認証は Claude Code / Codex CLI / `gh` CLI 自己管理に委譲 | AI runtime / GitHub 認証面 |
| Tampering (改ざん) | hooks 設定 (`.claude/settings.json`) や CLI 経路を迂回して直接 `codex exec` / raw `claude` を叩き gate を無効化する | `.claude/CLAUDE.md` Native Tool Invocation + Runtime And Delegation で raw invocation を非正規経路と明記。agent-guard hook が allowlist/model floor を fail-close 検証 | hooks / CLI / escalation gate |
| Tampering (改ざん) | 他 runtime (Claude/Codex) の未コミット成果を書き換え・破棄する | `PreToolUse(Edit\|Write\|MultiEdit)` の work-guard が foreign 未コミットファイルの上書きを既定 fail-close、one-shot marker か env override のみ許容 (`.claude/CLAUDE.md` Guard Rules) | hooks / hybrid runtime 協調面 |
| Repudiation (否認) | 誰がどの PLAN 判断・review evidence を残したか後から否認される | PLAN frontmatter の `review_evidence` (reviewer / review_kind / verdict / anchor_commit) を必須化、`doctor checkReviewEvidence` が欠落を fail-close (ST-DATA-05) | docs (PLAN) / harness.db |
| Information Disclosure (情報漏えい) | 秘密情報・PII が docs / harness.db / Pack 配布物へ混入し外部流出する | `src/secret.ts` narrow guard (DB/memory/audit/search 取り込み時) + `PLAN-L6-62` docs 横断 secret-scan + 配布前 preflight (§6.2 に固定) | docs / harness.db / Pack 配布物 |
| Information Disclosure (情報漏えい) | audit / memory evidence に実クレデンシャル例が残る | CLAUDE.md 禁止事項 (API key/secret/PII/credential を書かない) + secret-scan gate が fail-close | docs / audit / memory |
| Denial of Service (可用性侵害) | hook 誤動作・fail-open 化により gate が無効化されワークフロー全体が信頼できなくなる | fail-close をデフォルト方針とし (architecture.md §2/§5)、hook 失敗を無視しない (`.claude/CLAUDE.md` Guard Rules)。ST-ARCH-02 で machine 検証 | hooks / CLI / gate |
| Elevation of Privilege (権限昇格) | AI agent が human 承認なしに本番影響・認証認可・破壊操作を実行する | escalation gate (認証・認可・決済・PII・本番影響は human 確認必須、CLAUDE.md 禁止事項) + agent-guard の allowlist/tier floor (低 tier subagent へのレビュー権限降格を禁止、review は orchestrator 以上の tier のみ) | escalation gate / AI runtime / agent-guard |
| Elevation of Privilege (権限昇格) | `UT_TDD_ALLOW_RAW_AGENT=1` や foreign-edit override marker の濫用で guard を恒常的に bypass する | bypass は PO 明示承認 + audit ログ記録必須 (NFR §5)、foreign-edit marker は one-shot 消費で恒常 bypass 不能 (`.claude/CLAUDE.md` Guard Rules) | agent-guard / work-guard |

本節は `NFR-17` (統合セキュリティグレード: DevSecOps 5 段階 / OWASP Agentic Top 10 / EU AI Act Art.14) の
「詳細は L4 で確定」委譲 (`docs/design/harness/L1-requirements/nfr.md:73`) を本節・§6・§7・§8 で充足する。
OWASP Agentic Top 10 (Prompt Injection / Insecure Tool Use 等) は Tampering / Elevation of Privilege 行に
対応する対策 (native tool-use 限定・raw invocation 非正規化・agent-guard tier floor) として trace 済み。
EU AI Act Art.14 human oversight は Elevation of Privilege 行の escalation gate / agent-guard 行として trace 済み。

## 6. 供給網セキュリティ (ZIP-DOC-056)

本節は ZIP-DOC-056 (供給網セキュリティ設計書) の中核概念を dependency/distribution gate へ統合する
(disposition catalog: merge)。

### 6.1 依存パッケージ (bun) 監査

- HARNESS 実装の依存は `bun.lock` (lockfile) を正本とし、追加/更新は lockfile diff を伴う変更として通常の
  review 経路 (`ut-tdd review`) を通す。lockfile 不在での依存追加は許容しない。
- 依存更新判断 (追加・バージョン更新・削除) は「機能追加/修正のための必要最小限」を原則とし、無関係な
  一括更新を同一コミットに混在させない (Git Rules の「関係ない変更を混在させない」原則の供給網版)。
- 既知脆弱性 (advisory) が報告された依存の扱いは、危険度に応じて即時更新 (高危険度) または次回定期更新へ
  繰り込む (低危険度) の二段階とする。**実行 (実際の bump / advisory 走査ツールの常時自動化) は本設計の
  対象外**で、L6/L7 の具体契約として後続 PLAN が降下する (本書は方針の固定のみ)。
- 依存の実行時信頼境界は architecture.md の adapter 隔離方針 (ST-EXT-04、core が provider SDK に直接依存
  しない) と整合する。

### 6.2 Pack 配布物の完全性

- `ut-tdd distribution sync-pack` / `package` が生成する Pack 配布物は、配布前 secret-scan preflight
  (`PLAN-L6-62` の distribution secret preflight、`src/cli/distribution.ts`) を通過したもののみ materialize
  可能とする。violation 検出時は fail-close し、配布 artifact を生成しない。
- Pack 配布物には legacy runtime 残滓・非追跡ローカル状態 (`legacy local state/` 等) を含めない
  (`docs/governance/repository-structure.md` の distribution 境界と整合)。
- 配布物の完全性検証 (改ざん検知目的のハッシュ付与・署名) は現時点で HARNESS の脅威モデル上 `not_applicable`
  とする。理由: Pack は GitHub リポジトリ経由の clone/pull で配布され、配布経路自体の完全性は GitHub の
  transport (HTTPS/SSH + commit history) に委譲済みであり、別途の署名レイヤーを追加する脅威(改ざんされた
  第三者ミラー配布等)は現行の配布形態 (直接リポジトリ) には存在しない。配布形態が変化した場合
  (バイナリ配布・非 GitHub ミラー等) は本判断を再評価する。

## 7. 鍵・秘密管理 (ZIP-DOC-057)

本節は ZIP-DOC-057 (シークレット鍵管理設計書) のうち HARNESS 自身に関連する部分 (KMS/テナント鍵ではなく
CI/CD 資格情報・API キーのローテーション運用) を実体化する (disposition catalog: merge、`PLAN-L6-62` が
下流契約)。

### 7.1 非保持原則

harness core (`src/`, `.ut-tdd/`) はいかなる provider API key / access token / private key も自身の
state (`harness.db`, `.ut-tdd/state`, `.ut-tdd/memory`) へ永続化しない。認証は §2 の境界表の通り Claude
Code / Codex CLI / `gh` CLI / GitHub Actions secrets が自己管理する。この非保持原則は §5.2 Spoofing 対策の
根拠であり、`PLAN-L6-62` の narrow guard (`src/secret.ts`) と横断 scan (`analyzeSecretScan`) は、この
原則からの逸脱 (誤って秘密値が docs/DB へ混入する) を検出する後段防御である。

### 7.2 rotation / 漏えい時手順 (設計面のみ、実行は human runbook)

- **対象**: CI/CD 資格情報 (GitHub Actions secrets)、AI runtime 認証 (Claude Code / Codex CLI ログイン
  credential)、`gh` CLI token。KMS 階層鍵・テナント鍵 (KEK-DEK) は §9 の通り `not_applicable`。
- **rotation 方針 (設計)**: 定期ローテーション頻度・トリガ条件 (契約更新・メンバー離脱等) の判断は
  provider (GitHub / Anthropic / OpenAI) 側の運用規約に従う。HARNESS 側は rotation 実行そのものを
  実装せず、rotation が発生した場合に harness state 側で追従が必要な箇所 (`.ut-tdd/mode.yaml` の
  provider 設定、hook 経路の再認証) を明示するに留める。
- **漏えい検知時の手順 (設計)**: (1) `PLAN-L6-62` の secret-scan / doctor hard gate が違反を検出し
  fail-close する、(2) 検出された commit / doc の該当箇所を history から除去する判断 (BFG/rebase 等)
  は破壊的操作のため PO 承認必須 (CLAUDE.md 禁止事項の「破壊的データ操作は escalate」に整合)、
  (3) 漏えいした資格情報自体の失効・再発行は provider 側 human runbook の対象であり、本書は実行しない。
- **実行境界の明記**: 本節は方針・トリガ・責務分界の設計のみを扱う。実際の鍵失効・再発行・history
  書き換えの実行操作は本書の対象外であり、`PLAN-L6-62` §1-3 の scope 宣言 (「設計する範囲は方針の明文化の
  みであり、実際のローテーション実行は本 PLAN の scope 外」) と整合を保つ。

## 8. 監査ログ要件

本節は evidence / telemetry / `.ut-tdd/logs` に「何をいつどの粒度で記録するか」の security 観点要件を
固定し、A-174 F-4 の部分被覆残 (監査ログ要件の明文化欠落) を埋める。

| 記録対象 | 記録粒度 (最低限) | 記録先 | 目的 (STRIDE 対応) |
|---|---|---|---|
| agent-guard 判定 (allow/deny) | subagent_type / 要求 model / 判定結果 / bypass 有無 | `.ut-tdd/logs/` (hook 実行時) | Elevation of Privilege 検出 |
| foreign-edit override 行使 | 対象ファイル / 理由文字列 / one-shot 消費有無 | `.ut-tdd/logs/foreign-edit-overrides.jsonl` (既存) | Tampering / hybrid 協調監査 |
| PLAN review evidence | reviewer / review_kind / verdict / anchor_commit / green_commands | PLAN frontmatter (`review_evidence`) → `harness.db` projection | Repudiation 防止 (ST-DATA-05) |
| secret-scan 検出 (violation) | path:line:marker / dummy 例外判定根拠 | doctor 出力 / CI 実行ログ | Information Disclosure 検出 |
| distribution preflight 結果 | violation 件数 / materialize 可否 | CLI 出力 (`sync-pack`/`package` 実行ログ) | Information Disclosure (配布面) 防止 |
| hook 失敗 (fail-close 発火) | hook 名 / exit code / fail-close/fail-open 区分 | セッションログ / CI ログ | Denial of Service (可用性) 監査 |

記録の機械強制 (schema/lint/doctor での必須化) は本節が要求する範囲を確定するのみであり、既存項目
(review_evidence 必須化 = ST-DATA-05、foreign-edit-overrides.jsonl = 既存実装) は実装済み evidence として
参照する。未実装の記録経路 (agent-guard 判定の恒常ログ化等) は L6/L7 契約として後続 PLAN が降下する。

## 9. 非採用 (not_applicable) の明文化

以下はマルチテナント SaaS 前提の概念であり、HARNESS 製品境界 (単一 repo・ローカル実行・provider 非保持)
では `not_applicable` と判断する。disposition catalog の `reference` 判断 (ZIP-DOC-036/067、案件 profile
条件付き採用) と整合させ、デフォルト非採用・条件成立時のみ再評価という判断を明文化する。

| 概念 | 対応 ZIP-DOC | 非採用理由 | 再評価トリガ |
|---|---|---|---|
| RBAC 権限マトリクス (role-based access control の階層設計) | ZIP-DOC-010 の一部 | HARNESS はマルチユーザー SaaS ではなく、単一開発者/チームのローカル CLI + git 権限 (GitHub の repo 権限) に認可を委譲する。独自 RBAC 層を持たない | 将来 server sync (Phase B) でマルチユーザー化する場合 |
| KEK-DEK 鍵階層 (鍵暗号化鍵 / データ暗号化鍵の階層管理) | ZIP-DOC-057 の一部 | §7 の通り harness は秘密情報を非保持とし、自前で暗号化データを保管しない。KMS 階層鍵はテナント毎データ保管を前提とし、HARNESS には該当データストアがない | server sync / harness.db への PII・秘密値保存が必要になった場合 |
| IdP プロビジョニング (SCIM 等による自動アカウント発行/失効) | ZIP-DOC-067 | 認証は Claude Code / Codex CLI / `gh` CLI の個人ログインに委譲し、harness 自身がテナント/ユーザーのライフサイクルを管理しない | マルチユーザー・組織アカウント管理機能を harness 自身が持つ場合 |
| PII 専用ガバナンス (プライバシー設計書の全体、DPIA 等) | ZIP-DOC-036 | HARNESS 自身は業務 PII を扱うデータストアを持たない。ただし統制対象プロジェクトが PII を扱う場合は、当該プロジェクトの `vmodel-document-catalog.md` profile 判断 (高影響承認付き採用) に従う | 統制対象プロジェクトが PII を扱う案件、または harness 自身が telemetry で PII を収集する場合 (nfr.md §6 Phase B carry note) |

上記は disposition catalog の `reference` (profile 条件付き) 判断と矛盾しない: catalog は「案件 profile
成立時のみ高影響承認付きで採用」と宣言しており、本節はその**デフォルト値 (未成立時) が not_applicable
であること**を security.md 側にも明文化する。

## 10. ZIP-DOC → 分類サマリ (受入条件 §3 対応)

`PLAN-L4-29` 受入条件 (ZIP-DOC-010/036/056/057/067 の排他分類、宙吊り 0 件) を機械的に読める形で固定する。

| ZIP-DOC | 中核概念 | 分類 | 実体 (該当節) |
|---|---|---|---|
| ZIP-DOC-010 | セキュリティ設計書 (脅威モデル総体) | 実体化 | §5 脅威モデル (STRIDE) |
| ZIP-DOC-036 | プライバシー設計書 (PII 全体ガバナンス) | not_applicable (profile 条件付き reference) | §9 (PII 専用ガバナンス行) |
| ZIP-DOC-056 | 供給網セキュリティ設計書 | 実体化 | §6 供給網セキュリティ |
| ZIP-DOC-057 | シークレット鍵管理設計書 | 実体化 (KEK-DEK 部分のみ not_applicable) | §7 鍵・秘密管理 / §9 (KEK-DEK 行) |
| ZIP-DOC-067 | アイデンティティ・プロビジョニング設計書 | not_applicable (profile 条件付き reference) | §9 (IdP プロビジョニング行) |

排他性: 各中核概念は「実体化」または「not_applicable」のいずれか一方へ分類される (ZIP-DOC-057 のように
複数概念を含む文書は概念単位で分解した上で各部分が排他分類される)。いずれの分類も持たない
ZIP-DOC-010/036/056/057/067 の中核概念は存在しない (宙吊り 0 件)。

## 11. 右腕接続

本書は L4 基本設計の一部として `docs/test-design/harness/L9-system-test-design.md` と対になる。
L9 では security boundary が external-if / CI / CLI 境界検証に混ざるため、ST-EXT 系の system verification
として扱う。docs 横断 secret-scan の関数粒度 oracle は `PLAN-L6-62` で L7 unit-test-design へ降下する。

security verification (ZIP-DOC-102 相当) は L9 `ST-EXT-06` (§5-§9 の脅威モデル/供給網/鍵・秘密/監査ログ
trace) として `L9-system-test-design.md` §1.4 に追加し、§2 量閉じ一覧の孤児 0 に含める。

## 12. Resource Kernel bundle trust脅威モデル（Issue #152）

| 脅威 | fail-close境界 |
|---|---|
| bundle内自己申告鍵・ambient鍵によるtrust差替え | bundle外のversioned `TrustDecisionPort`だけが署名可否を決定する。port欠測・unknown versionは拒否 |
| companion/protocol/SBOM/D0-N receipt差替え | 全digest、target、required capability、D0-N generation receipt digestをcanonical manifest署名へ含める |
| 古い正規署名manifestのreplay | durableなmonotonic accepted-sequence factのfloor未満、および同sequence別payloadを拒否 |
| rollback名目の旧manifest直接復帰 | 旧componentも再reviewし、現在floorより大きい新sequence manifestとして再署名した場合だけ受理 |
| Node runtime/core/activationの二重所有 | companion bundleはD0-N generation receiptを参照するだけで、Node artifactやactivation stateを含めない |

D0は署名検証のport境界、canonical manifest、単調sequence、fail-closeを固定する。鍵rotation/revocation epoch、
secure clock、re-anchor、installer registry、durable storeの具体方式はinstaller/release後続設計へ委譲し、
未確定の物理方式をD0-Rの受入条件にしない。後続方式が未成立でも、旧direct-spawnや旧manifest replayへfallbackしない。
