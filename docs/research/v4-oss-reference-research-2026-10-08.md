# OSS 参考調査 (v4 設計用) 2026-10-08

## 0. 前提 (PO 決定 2026-10-08)
- OSS は dependency として採用しない。参考にするだけ。
- よって adopt / adapt / avoid の判定は付けない。
- 各項目は 4 点で書く: (1) 借りる着想・データモデル、(2) 効く UTV4-FR、(3) 自前で最小に作るもの、(4) ライセンス注記。
- 「工数」は自前で再実装する場合の見積もり (S=1〜2日 / M=3〜7日 / L=2週間以上)。
- ライセンス注記は「着想・パターンを真似るとき」に効く点だけ。コードは写さない。
- 数値は gh api で 2026-10-08 に実測。実測できなかったものは「未確認」と明記。
- 参照した要件の ID は ut-tdd-concept-v4-requirements.md の UTV4-FR-001〜056 から。FR 番号の内容は先頭 90 字だけ確認した。細部は未読。
- 実装方針の注意: Windows 第一、Node 24、Bun 禁止。参考元が Go/Rust/Python でも、自前実装は TS/Node (管理知能は Python)。

## 1. 先に結論 (一番効く参考 5 つ)
1. in-toto の Statement / predicate 構造 → receipt の schema 設計 (FR-013, FR-027, FR-041)。
2. dependency-cruiser の rule 形式 (forbidden / allowed / severity) → 配置レジストリと patrol (FR-005, FR-046)。
3. StrictDoc / Doorstop / OpenFastTrace の「ID + 親リンク + 双方向の欠落検査」 → 設計 ⇔ テスト設計の対 (FR-004, FR-054)。
4. git-bug の「issue を git object として持つ」モデルと、dedupe 用の ID 方式 → チケット tracked ファイル (FR-004, FR-036)。
5. Codex CLI の approval policy × sandbox mode の 2 軸 → RACI の admit/deny (FR-002, FR-023)。

## 2. 領域別

### (a) エージェントハーネス / オーケストレーション

| 名称 | URL | license | stars | 最新 release | 活動 |
|---|---|---|---|---|---|
| OpenHands | https://github.com/OpenHands/OpenHands | MIT | 90,208 | v1.25.0 (2026-10-06) | 非常に活発 (push 当日) |
| SWE-agent | https://github.com/SWE-agent/SWE-agent | MIT | 20,498 | v1.1.0 (2025-05-22) | push は 10-06。release は止まり気味 |
| Aider | https://github.com/Aider-AI/aider | Apache-2.0 | 49,413 | v0.86.0 (2025-08-09) | 最終 push 2026-05-22。停滞気味 |
| Goose | https://github.com/aaif-goose/goose | Apache-2.0 | 55,044 | v1.53.0 (2026-10-02) | 非常に活発 |
| Codex CLI | https://github.com/openai/codex | Apache-2.0 | 128,206 | rust-v0.161.0 (2026-10-07) | 非常に活発。issue 21k |
| Claude Agent SDK (TS) | https://github.com/anthropics/claude-agent-sdk-typescript | 未確認 (API は NOASSERTION) | 1,788 | v0.3.293 (2026-10-07) | 活発 |

- OpenHands
  - (1) 着想: agent を event stream (Action / Observation の追記ログ) で表す。実行は Docker sandbox (runtime) に隔離する。controller と runtime の分離。
  - (2) FR-050 (control plane が dispatch)、FR-038 (event を記録として集める)、FR-013 (authoring 文脈との分離)。
  - (3) 自前: 既存 hook_events を「型付き event の追記ログ」に揃える。sandbox は Docker を前提にしない (Windows 第一)。作業 tree の分離は git worktree で足りる。工数 S。
  - (4) MIT。ただし enterprise ディレクトリは別ライセンスの可能性 (未確認)。着想だけなら問題なし。
- SWE-agent
  - (1) ACI (agent-computer interface)。agent に渡す tool を絞り、出力形式を固定し、失敗を短い定型文で返す。trajectory (行動履歴) を丸ごと保存する。
  - (2) FR-041 (LLM 判断の記録)、FR-042 (後続事実との突き合わせ)。
  - (3) 自前: 「judgement record + trajectory 参照」の対。tool の絞り込みは既存 agent-guard の allowlist で足りる。工数 S。
  - (4) MIT。着想のみで問題なし。
- Aider
  - (1) repo-map (tree-sitter で要約した地図を文脈に入れる)。1 編集 = 1 git commit の原則。lint/test を編集直後に自動で回す。
  - (2) FR-046 (依存グラフ)、FR-022 (assignment ごとの知識 packet)。
  - (3) 自前: packet に「触る path の依存地図」を入れる。dependency-cruiser の JSON 出力を要約すれば足りる。工数 S。
  - (4) Apache-2.0。着想のみ。
- Goose
  - (1) recipe (YAML で role・手順・拡張を宣言)。MCP を拡張口にする。
  - (2) FR-049 (論理 role)、FR-021 (skill の versioned registry)、FR-023 (provider topology profile)。
  - (3) 自前: role 宣言を YAML/JSON で持つ形は既存 team 定義とほぼ同じ。新規に作る必要は薄い。工数 S。
  - (4) Apache-2.0。着想のみ。
- Codex CLI
  - (1) approval policy (untrusted / on-request / never 等) と sandbox mode (read-only / workspace-write / full-access) の直交 2 軸。hooks の schema。
  - (2) FR-002 (admit/deny を表で決める)、FR-005 (区分外は提案に落とす)、FR-023。
  - (3) 自前: RACI 表の各セルを「approval 軸 × 書き込み範囲軸」に写す。区分外の書き込みは「提案」に落とす、という既存の方針と相性が良い。工数 S。
  - (4) Apache-2.0。着想のみ。hooks schema は本リポの別 memory (#668) に実測あり。
- Claude Agent SDK
  - (1) permission callback (canUseTool)、hook event (PreToolUse 等)、subagent 定義。
  - (2) FR-005、FR-050。
  - (3) 自前: 既に Claude Code hook で同等を使っている。新規は不要。SDK の型を読んで event 名を揃える程度。工数 S。
  - (4) 利用規約に従う。コードは写さない。
- 総評: どれも「sandbox / review / provenance」を v4 のように機械束縛して持つ製品はない。review の家族分離 (FR-013, FR-051) と exact-head receipt は自前の強みで、参考元は無い。

### (b) サプライチェーン来歴・リリース完全性

| 名称 | URL | license | stars | 最新 release | 活動 |
|---|---|---|---|---|---|
| SLSA (仕様) | https://github.com/slsa-framework/slsa | NOASSERTION (仕様文書。CC 系の可能性、未確認) | 1,940 | release 無し | 活発 (10-06) |
| in-toto | https://github.com/in-toto/in-toto | NOASSERTION (Apache-2.0 の認識、未確認) | 1,050 | v3.1.0 (2026-05-04) | 中程度 |
| cosign | https://github.com/sigstore/cosign | Apache-2.0 | 6,354 | v3.1.3 (2026-08-06) | 活発 |
| sigstore-js | https://github.com/sigstore/sigstore-js | Apache-2.0 | 184 | @sigstore/cli 0.10.3 (2026-08-04) | 活発 |
| Witness | testifysec/witness は 0 star の残骸。移管先 (in-toto/witness か) は未確認 | 未確認 | 未確認 | 未確認 | 要追加調査 |
| actions/attest-build-provenance | https://github.com/actions/attest-build-provenance | MIT | 1,051 | v4.2.2 (2026-08-06) | 活発 |
| slsa-github-generator | https://github.com/slsa-framework/slsa-github-generator | Apache-2.0 | 603 | v2.1.0 (2025-02-24) | 低調 |

- SLSA
  - (1) レベル表 (L1〜L3) と「ビルドは誰が・何から・どう作ったか」の来歴要件。ビルド基盤と署名鍵を build 本体から分ける考え方。
  - (2) FR-027 (receipt を workspace と repo identity に束縛)、release canary 関連の FR。
  - (3) 自前: release acceptance の項目に「どの SLSA レベル相当を満たすか」を設計時に宣言する欄を足す。仕様を読むだけ。工数 S。
  - (4) 仕様の文章は写さず、レベルの考え方だけ使う。
- in-toto
  - (1) Statement = subject (対象 + digest) + predicateType + predicate。layout (期待する手順と担当) と link (実際の手順の記録) を分け、検証側が突き合わせる。
  - (2) FR-027 / FR-013 (receipt の束縛)、FR-001 (別 identity の束縛)、FR-006 (証跡を ID で引く)。
  - (3) 自前: exact-head receipt を「subject = HEAD tree digest、predicate = verdict + reviewer family」の JSON にする。Statement 形に揃えれば将来 attestation と接続できる。工数 S〜M。
  - (4) 仕様 (Statement 形式) は公開仕様なので形を真似てよい。実装コードは写さない。
- cosign / sigstore-js
  - (1) keyless 署名 (OIDC → 短命証明書 → 透明性ログ)。bundle 形式 (署名 + 証明書 + log 証拠を 1 ファイル)。
  - (2) release canary と release-blocking acceptance の署名面。FR 番号は未特定。
  - (3) 自前: 署名自体は自前実装しない方がよい (暗号を作らない)。参考にするのは bundle の「1 ファイルに証拠を束ねる」形だけ。PO 方針で dependency 不可なら、署名は GitHub の機能を CI から呼ぶ運用に留める判断が要る。要 PO 確認。工数 S (形だけ) / L (自前署名は非推奨)。
  - (4) Apache-2.0。形式を真似るだけなら問題なし。
- Witness
  - (1) 「CI の各手順を実行しながら attestation を作る」ラッパーと、policy で attestation 群を検証する発想。
  - (2) atomic CI、FR-027。
  - (3) 自前: 手順ごとに receipt を吐き、最後に policy で束ねる流れだけ参考にする。リポ位置が不明なので詳細は要追加調査。
  - (4) 未確認。
- GitHub artifact attestations / attest-build-provenance
  - (1) workflow 内で provenance を作り、`gh attestation verify` で検証する。リポ identity と workflow 参照を証明に含める。
  - (2) release acceptance、FR-027。
  - (3) 自前: 配布 Pack (product/) の検証手順に「provenance の repo / workflow / commit が期待値と一致」を 1 項目として設計時に宣言する。GitHub の機能の利用であり、この action を dependency にするかは PO 判断。工数 S。
  - (4) MIT。
- Node の reproducible build
  - 専用ツールは今回の調査では実在確認できず (要追加調査)。実務上は「lockfile 固定 + `npm pack` を 2 回作って digest 比較」で足りる。pnpm (MIT、36,758 star、v12.10.1) も lockfile 検証の参考になるが、Bun 禁止・npm 前提の現行方針とは別論点。自前: 2 回ビルド比較の canary を 1 本。工数 S。

### (c) policy-as-code / gate

| 名称 | URL | license | stars | 最新 release | 活動 |
|---|---|---|---|---|---|
| OPA | https://github.com/open-policy-agent/opa | Apache-2.0 | 12,331 | v1.21.1 (2026-09-29) | 活発 |
| Conftest | https://github.com/open-policy-agent/conftest | NOASSERTION (Apache-2.0 の認識、未確認) | 3,278 | v0.71.1 (2026-10-06) | 活発 |
| danger-js | https://github.com/danger/danger-js | MIT | 5,509 | 14.0.6 (2026-08-27) | 活発 |
| reviewdog | https://github.com/reviewdog/reviewdog | MIT | 9,642 | v0.21.2 (2026-09-18) | 活発 |
| Kyverno | repo 未実測 | 未確認 | 未確認 | 未確認 | 未確認 |

- OPA / Conftest
  - (1) 「入力は構造化データ、規則は宣言的、出力は violation の配列 (msg + 位置)」という分離。deny / warn / violation の 3 区分。テスト可能な規則。
  - (2) FR-002 (admit/deny)、FR-004 (正本と投影のずれは advisory、fail-close にしない)、FR-025 (surface class)。
  - (3) 自前: gate の戻り値を `{ severity: deny|warn, rule_id, path, message }[]` に統一する。規則言語 (Rego) は取り入れない。TS の純関数で足りる。工数 S。
  - (4) 着想のみ。Rego を書かないのでライセンス影響なし。
- danger-js
  - (1) PR 単位の「ルール = JS 関数」と、結果を PR コメントに 1 本化して更新する方式。
  - (2) FR-004 (PR は投影)、FR-012 (進捗は事実から)。
  - (3) 自前: gate 結果を PR コメント 1 件に集約し、更新で上書きする。既存 ut-tdd に近い機能があるか要確認。工数 S。
  - (4) MIT。着想のみ。
- reviewdog
  - (1) 任意 linter の出力 (rdjson 形式) を共通形式に変換し、差分行だけに指摘を出す (diff filter)。
  - (2) FR-005 / FR-046 (patrol の report-only 出力)。
  - (3) 自前: patrol 結果を共通 schema の JSON にし、「変更行に関係する指摘だけ」を抽出するフィルタを足す。工数 S。
  - (4) MIT。rdjson 形式 (公開仕様) の形を真似るのは自由。
- Kyverno 型
  - Kubernetes 用なので直接の参考は薄い。「validate / mutate / generate の 3 種」の分類だけ借りる余地がある (write-time guard = validate、提案生成 = generate)。未調査のため参考度は低。

### (d) 要件・トレーサビリティ as code

| 名称 | URL | license | stars | 最新 release | 活動 |
|---|---|---|---|---|---|
| StrictDoc | https://github.com/strictdoc-project/strictdoc | NOASSERTION (Apache-2.0 の認識、未確認) | 408 | 0.30.1 (2026-09-16) | 活発 |
| Doorstop | https://github.com/doorstop-dev/doorstop | NOASSERTION (LGPL の認識、未確認) | 674 | v3.2 (2026-07-10) | 中程度 |
| sphinx-needs | https://github.com/useblocks/sphinx-needs | MIT | 309 | 本体 release 名は未確認 | 非常に活発 (10-08) |
| OpenFastTrace | https://github.com/itsallcode/openfasttrace | GPL-3.0 | 198 | 4.10.0 (2026-09-20) | 活発 |
| ReqIF 系 | 未特定 | 未確認 | 未確認 | 未確認 | 要追加調査 |

- StrictDoc
  - (1) 要件を専用の文書形式 (SDoc) に書き、UID・親リンク・種別を持たせる。文書⇔コード⇔テストの trace を機械検査し、HTML/ReqIF へ出力する。
  - (2) FR-004 (「ゴールの検証」と親参照)、FR-054 (実行と検収を対にする)、FR-006 (ID で引く)、FR-008/009 (view は構造化正本の派生)。
  - (3) 自前: 設計 doc の frontmatter に `id`・`parent`・`verifies` を持たせ、孤児 (親なし) と未検証 (対のテスト設計なし) を検出する lint。既存の doc lint 上で足せる。工数 M。
  - (4) 着想のみ。ライセンス表記が取得できなかったので、コードは見ない前提を維持。
- Doorstop
  - (1) 1 要件 = 1 YAML ファイル。ファイルが tracked で、git で差分が取れる。親子リンクに「リンク先の内容 digest」を持ち、親が変わると子が「要レビュー (suspect)」になる。
  - (2) FR-004 (tracked ファイルが正本)、FR-042 (後続事実による再検)、FR-048 (還流)。
  - (3) 自前: 設計 doc の digest をリンクに記録し、digest が変わったら下流を suspect にする。CLAUDE.md の「上流の設計 revision digest」と同じ発想なので、機械検出に格上げするだけ。最も効く着想。工数 S〜M。
  - (4) LGPL の可能性 (未確認)。着想のみなら影響なし。
- sphinx-needs
  - (1) 「need」という型付き要素 (req / spec / test) と、要素間の型付きリンク。リンク型ごとの検証規則 (例: spec は少なくとも 1 つの test に links)。filter 式で表を生成。
  - (2) FR-008 (人間向け view は正本の派生)、FR-004、FR-054。
  - (3) 自前: リンク型ごとの必須ルールを JSON Schema 風の設定に書く。表示 (view) は生成物とする。工数 M。
  - (4) MIT。着想のみ。
- OpenFastTrace
  - (1) 文書内のタグ (`req~名前~版`) を走査して、「needs coverage」の欠落を報告する。版 (revision) がずれたら outdated になる。
  - (2) FR-054、FR-004、FR-006。
  - (3) 自前: タグ走査はテキスト正規表現で足りる。「版が違えば古い」を検出する仕組みを入れる。工数 S。
  - (4) GPL-3.0。コードは見ない。タグ形式の考え方だけ使う。
- ReqIF
  - 交換形式は XML で重い。v4 は構造化正本が JSON なので、輸出が必要になるまで見送ってよい。具体ツールは今回未調査。

### (e) チケットをファイルで持つ / 一方向 GitHub 同期

| 名称 | URL | license | stars | 最新 release | 活動 |
|---|---|---|---|---|---|
| git-bug | https://github.com/git-bug/git-bug | GPL-3.0 | 10,733 | v0.11.0 (2026-09-22) | 活発 |
| git-issue | https://github.com/dspinellis/git-issue | GPL-3.0 | 885 | release 無し | 最終 push 2025-10-17。低調 |
| TrackDown | repo 未実測 | 未確認 | 未確認 | 未確認 | 未確認 |

- git-bug
  - (1) issue を working tree ではなく git object (refs 配下) に保存する。操作 (作成・コメント・状態変更) を追記専用の operation の列として持ち、その列を畳んだものが現在状態。ID は最初の操作の hash。ブリッジ (GitHub 等) は import/export を別コマンドで持つ。
  - (2) FR-004 (正本は tracked、GitHub は一方向投影)、FR-036 (Issue / Sub-issue / PR の 3 段)、FR-001 (別 identity)。
  - (3) 自前: v4 は tracked ファイルを正本と決めたので、refs 方式は採らない。借りるのは「追記専用 operation 列 + 畳み込み」と「ID = 内容 hash」。1 チケット 1 JSON ファイルに状態を持つ案との比較材料にする。GitHub 投影側は「正本 → GitHub」の片方向で、投影先の ID を正本の `projection` 欄に書き戻すだけ。読み戻さない。工数 M。
  - (4) GPL-3.0。着想のみでコードは写さない。
- git-issue
  - (1) シェルスクリプトで、issue を 1 ディレクトリ 1 issue のプレーンファイルで持つ。GitHub/GitLab との import/export あり。
  - (2) FR-004。
  - (3) 自前: ディレクトリ配置の単純さが参考。低調なので比較対象としては弱い。工数 S。
  - (4) GPL-3.0。着想のみ。
- TrackDown / 類似
  - 未調査。Markdown 1 ファイルで課題管理する方式という認識のみ (未確認)。FR-004 に対しては git-bug と Doorstop で十分に着想が取れる。

### (f) アーキテクチャ / 配置 lint

| 名称 | URL | license | stars | 最新 release | 活動 |
|---|---|---|---|---|---|
| dependency-cruiser | https://github.com/sverweij/dependency-cruiser | MIT | 7,264 | v18.5.0 (2026-09-30) | 活発 |
| eslint-plugin-boundaries | https://github.com/javierbrea/eslint-plugin-boundaries | MIT | 997 | v7.2.0 (2026-08-09) | 活発 |
| madge | https://github.com/pahen/madge | MIT | 10,169 | release 無し | 最終 push 2026-01-21。低調 |
| ArchUnitTS | slug 不一致で 404。正しい URL は未確認 | 未確認 | 未確認 | 未確認 | 要追加調査 |

- dependency-cruiser
  - (1) 規則 = `forbidden` (from / to のパターン + severity: error|warn|info)、`allowed`、`required`。例外の一覧 (baseline / known violations) を JSON で保存し、新規違反だけを落とす。
  - (2) FR-046 (依存グラフ)、FR-005 (区分外は提案)、product/ vs dev/ 分離の強制。
  - (3) 自前: 配置レジストリを `{ zone, pathPattern, allowedImportsFrom }` の表にし、product/ から dev/ への import を forbidden にする。baseline 方式は既存違反の段階解消に有効。write-time guard は同じ表を 1 ファイル分だけ評価すればよい。工数 M。
  - (4) MIT。着想のみ。
- eslint-plugin-boundaries
  - (1) 「要素 (element) の種別」を path pattern で宣言し、種別間の import 可否を行列で書く。
  - (2) FR-005、FR-046。
  - (3) 自前: dependency-cruiser と同じ着想。行列表の書式 (種別 × 種別) は人が読みやすく、RACI 表と同じ形で書ける点が参考になる。工数 S。
  - (4) MIT。
- madge
  - (1) 循環依存の検出と図の出力。更新が止まり気味なので参考度は低い。工数 S。
  - (4) MIT。
- ArchUnitTS
  - テストコードとして アーキテクチャ規則を書く発想 (ArchUnit の TS 版)。リポ未特定のため詳細は要追加調査。

### (g) JSON Schema → TS/zod + Python と等価性検証

| 名称 | URL | license | stars | 最新 release | 活動 |
|---|---|---|---|---|---|
| quicktype | https://github.com/glideapps/quicktype | Apache-2.0 | 13,884 | v26.0.0 (2026-07-20) | 活発 |
| json-schema-to-zod | https://github.com/StefanTerdell/json-schema-to-zod | ISC | 533 | release 無し | archived (2026-04-01 が最後) |
| datamodel-code-generator | https://github.com/datamodel-code-generator/datamodel-code-generator | MIT | 4,031 | 0.83.0 (2026-09-24) | 活発 |
| ajv | https://github.com/ajv-validator/ajv | MIT | 14,853 | v8.20.0 (2026-04-24) | 中程度 |

- 共通の着想
  - JSON Schema を唯一の正本にし、各言語の型・検証器は生成物にする。生成物は commit し、CI で「再生成して差分ゼロ」を検査する。
  - 等価性は「共有の fixtures (valid / invalid の JSON 集合)」を TS と Python の両方で検証して、結果 (受理/拒否 + 理由カテゴリ) を突き合わせる。JSON-Schema-Test-Suite の方式 (公開されたテストケース集) が参考になる (未実測)。
  - (2) FR: Python 管理知能との境界の FR (番号未特定)、FR-041 (judgement record の形)。
  - (3) 自前: スキーマから型を生成する代わりに、「スキーマ + fixtures 表」だけを正本にして、TS 側は既存の zod 手書き、Python 側は pydantic 手書きでもよい。等価性テストが本体で、生成は任意。fixtures runner は 50 行程度。工数 S〜M。
- json-schema-to-zod
  - archived。参考にする意味は薄い。変換が欠落する構文 (`$ref` 循環、`if/then/else` 等) の一覧を知る材料にはなる。
- ajv
  - (1) strict mode (未知キーワードを拒否) と、エラーを構造化して返す形。
  - (3) 自前: schema 書式の「strict に倒す」方針だけ借りる。
- datamodel-code-generator / quicktype
  - 生成コードの命名・Optional の扱いが言語間でずれる点が、等価性テストを要する理由。fixtures で押さえる。

### (h) ADR ツール

| 名称 | URL | license | stars | 最新 release | 活動 |
|---|---|---|---|---|---|
| adr-tools | https://github.com/npryce/adr-tools | NOASSERTION (未確認) | 5,726 | 3.0.0 (2018-07-25) | 最終 push 2024-04。事実上停止 |
| log4brains | https://github.com/thomvaill/log4brains | Apache-2.0 | 1,600 | v1.1.0 (2024-12-17) | 最終 push 2024-12。停止気味 |

- (1) 着想: ADR を連番ファイル + status (proposed / accepted / superseded by N) で持ち、supersede を双方向リンクにする。log4brains は ADR からサイトを生成し、リンク切れを検査する。
- (2) FR-001 (decision の identity と束縛)、decision ledger (JSON) との関係。
- (3) 自前: 既に docs/adr/ と supersession の双方向検査 (plan-supersession) があるため、新規は不要。ADR を ledger の view にするかどうかは設計判断。工数 S。
- (4) 着想のみ。両者とも更新が止まっているので、将来性の期待はしない。

## 3. FR 別の「何を借りるか」早見表

| FR | 借りる着想 | 参考元 | 工数 |
|---|---|---|---|
| FR-001 | identity の束縛 / Statement 形 | in-toto | S |
| FR-002 | approval × sandbox の 2 軸、行列表 | Codex CLI, eslint-plugin-boundaries | S |
| FR-004 | 1 ファイル 1 record / 追記 operation / 投影 ID の書き戻し | Doorstop, git-bug | M |
| FR-005 | forbidden 規則 + baseline、区分外は提案 | dependency-cruiser | M |
| FR-006 | ID で引く証跡 / 版付きタグ | OpenFastTrace, StrictDoc | S |
| FR-008/009 | view は派生物 | sphinx-needs, StrictDoc | M |
| FR-013/027 | receipt を subject digest に束縛 | in-toto, SLSA | S〜M |
| FR-041/042 | trajectory + 後続事実の突き合わせ | SWE-agent, OpenHands | S |
| FR-046 | 依存グラフと repo-map | dependency-cruiser, Aider | S |
| FR-054 | 要件 ⇔ 検証の欠落検出、suspect link | Doorstop, OpenFastTrace | S〜M |
| 境界 (Python) | スキーマ + fixtures の等価性 | JSON-Schema-Test-Suite 方式 | S〜M |
| gate 出力 | severity 付き violation 配列、差分行フィルタ | OPA/Conftest, reviewdog | S |

## 4. 未確認・要追加調査
- Witness の現在のリポ (testifysec/witness は 0 star の残骸。移管先を確認していない)。
- ArchUnitTS の正しい URL。
- Kyverno・TrackDown・ReqIF 系ツールは repo 実測せず。
- NOASSERTION と出たライセンス (SLSA / in-toto / Conftest / StrictDoc / Doorstop / adr-tools) は、GitHub API が判定できなかっただけ。上の「認識」は推定であり、結論には使わない。コードを写さないので判断には影響しない。
- Node 向け reproducible build 専用ツールの有無。
- 各 FR の本文は先頭 90 字だけ確認。細部と FR 番号の対応は設計者が最終確認すること。
- stars・release は 2026-10-08 時点。Claude Agent SDK のライセンスは未確認。

## 5. 実装の優先順 (参考に基づく提案)
1. Doorstop 型の「上流 digest 変更 → 下流 suspect」検出。CLAUDE.md の手書き digest 運用を機械化する。効果大、工数 S〜M。
2. dependency-cruiser 型の配置レジストリ表 + baseline。product/ ⇔ dev/ 分離の強制に直結。工数 M。
3. 共通の violation 配列 schema (OPA 型 severity + reviewdog 型の差分行フィルタ)。全 gate の出力を揃える。工数 S。
4. in-toto Statement 形に揃えた receipt。署名は後回し。工数 S〜M。
5. スキーマ + 共有 fixtures の等価性テスト。Python 境界の最初の砦。工数 S〜M。
