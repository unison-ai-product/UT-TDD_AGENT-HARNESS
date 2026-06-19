# A-138 — carry disposition TL cross-review (2026-06-19)

- review_kind: `cross_agent`
- worker/PM: Claude (claude-opus-4-8) — self-review + disposition author
- reviewer/TL: Codex (gpt-5.5) via `ut-tdd codex --role tl --task-file .ut-tdd/codex-tasks/carry-disposition-tl-review-v2.md --execute`
- session id: 019edf16-7343-7220-a948-b38ee2fa4073 / tokens 32,392
- 対象: §5 PO-pending 判断 4 件 (#7 status taxonomy / #9 skill suggest / false-confidence backlog / handover 累積)
- 結果サマリ: ITEM-1 adjust (`next_action`→carry) / ITEM-2 adjust (`--text` flat-list のみ, 3-bucket→PO) /
  ITEM-3 agree (IMP-082/083=Reverse先, IMP-085/107=既存FR拡張で実装可) / ITEM-4 agree (header数不変で契約安全)

---

## Codex (TL/gpt-5.5) verdict 全文

### ITEM-1 VERDICT: adjust

4 fields 一律 `future` は少し粗いです。

`optional_adapters` / `enabled_commands` / `disabled_commands` は、adapter/command surface の将来公開契約なので `future` が妥当です。一方 `next_action` は既に standalone mode の判断ゲート提示で意味が要件本文に出ているため、単なる future capability ではなく **carry** に上げるのが妥当です。

代案:

- `next_action`: `carry`
  - 最小スライス: `status --json` に camelCase 契約を壊さず `next_action` / `nextAction` のどちらを正式名にするか決め、standalone/hybrid での値域を PLAN 化。
- `optional_adapters`, `enabled_commands`, `disabled_commands`: `future`
  - adapter/command surface の設計が固まるまで実装しない。

区分ルールは妥当です。

- `current`: 実装済みかつ公開契約
- `future`: 要件上の着地予定はあるが未実装、追跡 PLAN まではまだない
- `carry`: 能動 defer で追跡 PLAN / gate がある

この分類ルール自体は TL 裏取りで足ります。PO が必要なのは、分類が公開契約・優先度・要件本文の意味を変える場合です。

### ITEM-2 VERDICT: adjust

`--text` additive 実装は同意です。ただし最小スライスは **flat ranked list のまま** に限定すべきです。

`--plan` requiredOption を「`--plan` または `--text` のどちらか必須」に緩和するのは後方互換です。既存 `--plan` 呼び出しと既存出力を壊さないため、AI-decidable です。

代案:

- 今実装可能な最小スライス:
  - `ut-tdd skill suggest --plan <id>` は現行互換維持
  - `ut-tdd skill suggest --text "<task>"` を追加
  - `--plan` と `--text` は **相互排他** にする
  - 出力は現行 flat ranked rows を維持
- 3-bucket 出力は別 bucket / API 決定に分離

3-bucket の素案としては以下が妥当です。

- `required`: 実行前に読まないと gate / workflow 違反になり得る skill
- `recommended`: タスク品質・安全性に強く寄与するが必須ではない skill
- `optional`: 補助的・状況依存の skill

ただしこれは公開出力契約です。bucket 名、閾値、同一 skill の bucket 移動条件、flat list との互換形式は PO/API 判断が必要です。

### ITEM-3 VERDICT: agree

分類は自己 disposition どおりで妥当です。

IMP-082 は Reverse FR 起票が先です。FR-ID 登録や link 存在ではなく、「FR が実際に設計内容へ分解されたか」を見る substance 検査は、既存 lint の精緻化ではなく検査カテゴリ追加です。要件化なしに実装すると governance gate を後付けする形になります。

IMP-083 も Reverse FR 起票が先です。GWT/ST/U の実ケースが骨格でないことを判定するのは、単なる存在確認ではなく test-design の品質判定です。これも Type② として正本要件に検査カテゴリを追加すべきです。

IMP-085 は既存 FR 拡張として今実装可能寄りです。feedback-log の domesticated 非空、参照先実在、status 整合は、improvement-backlog lint と同型の existence / consistency lint です。新しい判断カテゴリというより、既存 lint 対象の拡張として扱えます。

IMP-107 も既存 FR 拡張として今実装可能寄りです。`placeholder_deps.waiting_layer` の 2 類型は、既存 pair-freeze / vmodel lint の精緻化です。placeholder dependency の存在自体が既存検査対象なら、新規 FR ではなく値域・分岐ルールの追加で足ります。

Reverse 最小スライス案:

- IMP-082:
  - bucket: requirements / V-model descent substance gate
  - FR 族: `FR-vmodel-descent-substance` または既存 vmodel/pair-freeze FR 配下
  - 最小内容: FR-ID が design § / DbC / module assignment のいずれかへ具体分解されていることを検査対象化
- IMP-083:
  - bucket: requirements / test-design freeze gate
  - FR 族: `FR-test-design-substance` または既存 pair-freeze test gate 配下
  - 最小内容: GWT/ST/U が空骨格でないこと、少なくとも対象 FR と観測可能期待結果を持つことを検査対象化

### ITEM-4 VERDICT: agree

`countHandoverEntries` / bypass 検知契約は壊しません。鍵は自己 disposition の通り、1 回の `runHandover` がちょうど 1 個の `# Session Handover` header を追加し続けることです。§1/§2 を slim stub にしても header 数と pointer の `doc_entry_count` 照合意味論は維持されます。

ただしこれは doc scaffold の人間可読フォーマット変更なので、実装判断と PO 確認を分けるのがよいです。

最小スライス:

- 同日 1 件目: 現行 scaffold のまま
- 同日 2 件目以降: §1/§2 は「same-day first entry参照」の slim stub
- §3-§6: per-session 固有情報なので全文維持
- `# Session Handover`: 各 entry 1 個を維持
- handover tests: header count、pointer count、2 件目以降 slim 化を追加

AI-decidable な安全性判断は「header count 契約は不変」。PO 確認が必要なのは、slim stub が handover の運用上読みやすいかというフォーマット嗜好部分です。

### RESIDUAL_FOR_PO

- ITEM-1: `next_action` を `carry` として PLAN 化する優先度の最終承認。
- ITEM-2: 3-bucket 出力の公開 API 契約、bucket 名、振り分け基準、flat list との互換形式。
- ITEM-4: 同日 2 件目以降の handover §1/§2 slim stub を人間可読フォーマットとして採用するか。
SUCCESS: The process with PID 11808 (child process of PID 2120) has been terminated.
SUCCESS: The process with PID 2120 (child process of PID 21120) has been terminated.
SUCCESS: The process with PID 21120 (child process of PID 3396) has been terminated.
SUCCESS: The process with PID 3396 (child process of PID 11576) has been terminated.
tokens used
