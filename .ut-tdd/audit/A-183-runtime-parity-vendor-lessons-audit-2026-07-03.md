# A-183 ランタイム対称性・ベンダー前提・教訓機構化監査

- **date**: 2026-07-03
- **author**: Claude Fable 5 (orchestrator) + pmo-sonnet 3 レーン fan-out
- **PO 指示**: 「これまでのレポートにない観点で棚卸し・資産化・アップデート・修正の観点はあるか」→ 実例指定「Claude Code は効くけど Codex はプラグイン設定が別だから効かない」→「OK それで進めてくれ」
- **A-172〜182 との境界**: 本監査の 3 レンズは初出 — LENS-PY (ランタイム対称性の全資産仕分け。hook 単体の parity は L7-139/A-178 が既カバー、資産全域は初)、LENS-VD (ベンダー surface 前提の drift 防御)、LENS-LM (prose 教訓→機械強制の変換率)。加えて orchestrator 直轄で OR 系 3 所見 (依存/license、復旧可能性、hot-zone)。
- **基準点**: HEAD 954ae74〜2a41cb1 (監査中に Codex が L7-327/343 を landed — doctor --json / route eval --json)。Codex 未コミット差分は不問。
- **手法**: カタログ §9 (1 subagent = 1 レンズ × 3 並列、pmo-sonnet/model=sonnet) + orchestrator 実測。裏取り記録 = §4 (**PY-1 の leak 実例は裏取りで不成立 → 補正済み**)。

## §1 基線実測 (2026-07-03)

| 項目 | 実測値 | 測定コマンド |
|---|---|---|
| hook parity | Claude 5 イベント ↔ Codex 4 イベント (SubagentStop は codex 0.128.0 に存在せず N/A 宣言済み) | 両 hooks 設定実読 |
| Codex 側の Claude 専用資産 | .claude/agents 19 本 / agent-memory 9 本 / skills 注入 / goal Stop hook — .codex 内 skill 参照 0 件 | ls + grep |
| effort 注入 | claude: `--effort` + env / **codex: args に effort なし** (adapter.ts:334-343) | 実読 (裏取り済) |
| ベンダー前提定数 | CODEX_STDIN_ARGS/`-m` / CLAUDE_STDIN_ARGS/`--model`/`--effort` (adapter-policy.ts:3-9)。照合テストは定数自己参照のみ | grep + tests 実読 |
| service_tier 実害の機械化 | 出現は L7-263 review_evidence の 1 文のみ — 検出器 0 | `grep -rn service_tier` |
| 教訓機構化率 | 対象 20 件: **M=4 (20%) / PA=6 / P=9 (45%) / F=1** (加重 35%) | LM 台帳 (§2) |
| git hooks | pre-commit/pre-push/commit-msg はローカル実在・**git 非追跡・core.hooksPath 未設定** — clone/CI で消失 | `git ls-files` + `git config` (裏取り済) |
| biome drift 実害 | biome 関連 commit 10 件 (うち是正系 4 件以上: 4856c69/6063723/78a5d9a 等) | `git log --oneline \| grep -i biome` |
| 一次データの無防備 | harness.db 59MB + logs/ 3.4MB が**未追跡・バックアップ経路なし** (audit/handover/evidence 121 ファイルは追跡済み) | `git ls-files .ut-tdd/` + du |
| 依存検査 | CI の「audit quality」は自製コード監査。`bun audit` 相当・third-party license 台帳は無し (deps: commander/yaml/zod + dev 5) | harness-check.yml + package.json 実読 |
| toolchain pin | engines `bun>=1.3` のみ。bunfig/.tool-versions なし、biome は `^2.4.15` (caret) | package.json |

## §2 所見台帳

### LENS-PY ランタイム対称性 (所見 PY-1〜8、詳細はレーン報告を本 doc に統合)

parity マトリクス要旨: hook 統制面 (agent-guard/work-guard/session-log/Stop) は L7-139 + 442e279 で **both-effective 達成済み** — PO 指摘の「効かない」は hook 面では概ね解消済みが正確な現状。残る実効非対称は 3 点:

| ID | 現象 | 判定 | カバー |
|---|---|---|---|
| PY-1 | SubagentStop 不在で Codex の slot 解放が Stop まで遅延 (構造)。**レーン報告の「released_at:null 2 件残存」は裏取りで不成立** (現在 0 件 — transient。§4) | 構造は真 / 実例は補正 | 既存 (L7-258 draft に sweep 残差明記 — 着手促進のみ) |
| PY-2 | **effort routing が Codex 委譲に機械注入されない** — AGENTS.md「codex effort=middle」が実行時無効。codex args = exec/-m/- のみ (裏取り済)。telemetry の effort も欠落 (片肺測定) | 漏れ (最大 gap) | 部分 (L7-255 draft へスコープ追記が正 — codex CLI の effort フラグ有無の実機裏取りを先行条件に) |
| PY-3 | Codex hosted/API surface では hooks.json 非発火 (work-guard/agent-guard 素通り) — 意図的 scope boundary 宣言済みだが代替手順の運用ガイドが 1 文のみ | 意図的 / doc 薄い | 未起票 (doc 追記、L7-351 へ) |
| PY-4 | .claude/agent-memory (9 agent 分) に Codex 対応概念なし — 参照可否・書込経路が無宣言 | 漏れ疑い (方針未宣言) | 未起票 (方針宣言 = PO 判断 slot、L7-351 へ) |
| PY-5 | subagent allowlist が AGENTS.md 非転記 — Codex 側から「どの名前なら通るか」を doc で確認できない (block 原因調査が困難) | 漏れ | 未起票 (L7-351 へ) |
| PY-6 | rule-drift は marker 突合のみで prose 節の乖離は非検査 | 既知の設計保留 (DISCOVERY-06 SSoT materializer) | 既存 |
| PY-7 | Codex spawn_agent の実 payload schema (subagent_type/agent/role/name のどれを送るか) が実機未検証 — 不一致なら fail-close で「理由不明 block」 | 漏れ疑い | 未起票 (fixture 化 = L7-351 + VD-1 と同根) |
| PY-8 | guard 発火証跡ゼロは両 runtime 対称の機能欠落 | — | 既存 (L7-258) |

### LENS-VD ベンダー surface 前提 (VD-1〜4)

| ID | 現象 | 判定 | カバー |
|---|---|---|---|
| VD-1 | hook stdin 契約の contract test が自己生成 mock のみ — vendor 実 payload の fixture 化・再捕捉なし。**file_path の構造変更時は work-guard が fail-open (targets=[] → pass) に倒れる** のが最重シナリオ | 無防備 | 部分 (L7-311 probe harness へ「vendor 実体からの再捕捉」をスコープ追記) |
| VD-2 | CLI 引数定数 (adapter-policy.ts:3-9) の照合テストが**定数自己参照** — `codex --help`/`claude --help` 実出力との突合なし。flag 廃止は --execute 時にのみ露見 | 無防備 (裏取り済) | **未起票 → L7-344** |
| VD-3 | service_tier 実害 (2026-07-02) 後も既知非互換 config key の機械検出ゼロ — 同じ障害が無警告で再現可能 | 無防備・実害既往 (裏取り済) | **未起票 → L7-344** (denylist reactive 方式) |
| VD-4 | pmo-tech-news「週次 watch 想定」の起動トリガーが repo に存在しない — vendor changelog を読む定常経路なし | 運用欠落 | 未起票 (L7-344 の運用 step として同乗) |
| VD+ | **強み**: bun:sqlite→node:sqlite の graceful fallback は模範的。codex-hook-adapter の内部一貫性 lint は機能している (VD の論点は「adapter↔vendor 実体」であり内部一貫性の否定ではない) | — | — |

### LENS-LM 教訓→機構変換率 (LM-1〜8、台帳 20 件)

変換率実測: **機械強制 4/20 (20%)、prose のみ 9/20 (45%)**。機械化は「境界が明確な領域」(work-guard/agent-guard/Windows spawn) に偏り、運用規律系 (git add 方法・biome full check・self-trigger 回避) が軒並み prose。既起票 (L7-259/261/279/314) は「起票率 > 変換率」— draft 滞留がボトルネック。

| ID | 現象 | 実害既往 | カバー |
|---|---|---|---|
| LM-1 | biome 版/モードずれ (`lint`≠`check`) が prose のみ — 是正 commit 4 件以上の反復実害 (裏取り済: biome 関連 10 commit) | あり (複数回) | **未起票 → L7-345** |
| LM-2 | redaction self-trigger 回避が完全 prose、記録は個人 memory のみ — 担い手交代で消える典型 | あり (1 件) | **未起票 → L7-346** (L7-279 は XML 専用でスコープ別) |
| LM-4 | HEAD 基準検証の強制なし — doctor が committed/uncommitted 無区別、`review --uncommitted` はあるが使用強制なし | 誤帰責の既往 | 未起票 (doctor surface 軽量案 — 今回は台帳記録に留め起票見送り、L7-313 sentinel と統合余地) |
| LM-5 | green-command-digest の hard 化出口条件が prose のみ | — | 既存 (L7-303 側で管理 — 出口条件の台帳化を L7-303 注記へ) |
| **LM-6** | **git hooks (commit-msg/pre-commit/pre-push) が非追跡・hooksPath 未設定 — 「機械強制済み」と自認していた Conventional Commits / secret 検査が clone/CI では効かない** (機械化済み誤認の実例、A-178 型の新変種。裏取り済) | 構造 | **未起票 → L7-347** |
| LM-7 | 共有 memory (L7-189) は器が実装済みで**中身ゼロ** — 教訓を書く運用が未定着 | — | 未起票 (facilitation のみ、L7-347 実装ノートに注記) |
| LM-3/8 | B4 スコープ縮小 (L7-314 認知済み) / history 書換禁止の F 判定 (意図的 prose) | — | 既存・対応不要 |

### OR 系 (orchestrator 直轄所見)

| ID | 現象 | カバー |
|---|---|---|
| OR-1 | **依存の脆弱性・license 台帳なし** — CI に `bun audit` 相当なし、Pack (MIT 公開) の third-party license 適合表なし。deps 8 本と小さく整備コスト極小 | **未起票 → L7-349** |
| OR-2 | **一次実行証跡の復旧不能** — harness.db (59MB) と logs/ (3.4MB) が未追跡・バックアップ経路なし。projection は db rebuild で再生可能だが、実行由来行 (guardrail_decisions / session jsonl 由来) は消失で戻らない。一次/派生の区分台帳・復旧手順 doc・復旧実走 probe のいずれも無い | **未起票 → L7-348** |
| OR-3 | **hot-zone 事前宣言の機構なし** — work-guard は事後 block、追突回避は毎回 git status の人力。作業域 intent registry (SessionStart で相手へ surface) が無い (PO の追突質問 2026-07-03 への機構的回答) | **未起票 → L7-350** |

## §3 起票 (PO 指示「それで進めてくれ」= A-182 と同型の version-up v2 起票)

新規: **L7-344 vendor-contract-doctor** (VD-2/3/4) / **L7-345 toolchain-pin-gate** (LM-1 + pin 一般化) / **L7-346 redaction-self-trigger-lint** (LM-2) / **L7-347 git-hooks-distribution** (LM-6/7) / **L7-348 runtime-state-recoverability** (OR-2) / **L7-349 dependency-license-inventory** (OR-1) / **L7-350 hot-zone-intent-registry** (OR-3) / **L7-351 runtime-parity-doc-closure** (PY-3/4/5/7)。

既存 PLAN へのスコープ追記: **L7-255** (PY-2: codex effort 注入 — 実機フラグ裏取り先行) / **L7-311** (VD-1: vendor 実 payload の fixture 再捕捉) / **L7-331** (CX-6 が Codex L7-343 で landed 済みの訂正)。

## §4 裏取り記録 (カタログ §1.3)

| レーン | 検証した主張 | 方法 | 結果 |
|---|---|---|---|
| PY | PY-2 effort 非注入 | adapter.ts:326-360 実読 | **確定** (codex args に effort なし、claude のみ --effort+env) |
| PY | PY-1 slot leak 2 件残存 | agent-slots.json の released_at null 全数 | **不成立** (現在 0 件 — transient/sweep 済み。構造的非対称は CODEX_NOT_APPLICABLE で真。所見を「構造は真・実例は補正」へ修正して採用) |
| VD | VD-2 定数自己参照 / VD-3 service_tier 唯一出現 | adapter-policy.ts 実読 + 全 grep | 確定 (2/2) |
| LM | LM-6 hooks 非追跡 / LM-1 biome 実害 | git ls-files + git config + git log | 確定 (2/2、biome 関連 10 commit) |

## §5 未監査領域 (次回 A-18x 候補)

- Codex spawn_agent / hook payload の**実機捕捉** (本監査は静的判定まで — L7-311 拡張の実走で閉じる)
- team run の provider 分岐実装 (PY レーン未達 — cli.ts 内在か要確認)
- state-db スキーマ設計品質 (A-182 §5 から継続 carry)
