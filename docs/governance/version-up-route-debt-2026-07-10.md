# version-up parked契約のlanded負債 (2026-07-10)

## 1. 発見

version-upを`status=draft + version_target + kind=impl + layer=L7`の将来保全trackに限定する正本と照合した結果、
`PLAN-L7-303-digest-commit-anchor`だけが`status=confirmed`かつ`version_target`なしでlandedしていた。

## 2. 処置

- 履歴を書き換えず、現tupleをimmutable legacy debtとして保持する。
- PLAN Asset v2 migration時にlegacy alias/revision/evidenceへ移管する。
- plan ID、status、route_mode、kind、layer、version_targetのいずれかが変わればfail-closeする。
- 新しい例外を本台帳へ自動追加しない。新規version-upはparked契約に従い、active workはadd-featureへ入る。

## 3. 変更禁止tuple

| `plan_id` | `status` | `route_mode` | `kind` | `layer` | `version_target` |
|---|---|---|---|---|---|
| PLAN-L7-303-digest-commit-anchor | `confirmed` | `version-up` | `impl` | `L7` | `(none)` |
