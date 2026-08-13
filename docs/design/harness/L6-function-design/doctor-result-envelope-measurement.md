---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_doctor_result_envelope_measurement
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
plan: docs/plans/PLAN-L6-99-doctor-result-envelope-measurement-contract.md
---

# doctor result envelope 実測面契約

## 1. 目的

`doctor --result-file` は同一 job の consumer が doctor の再実行を省略するための測定 receipt である。
receipt が再利用可能なのは、producer が実際に走らせた検査面と consumer の期待面が完全一致する場合だけ
である。CLI option や full registry から検査面を再計算してはならない。

## 2. 入力と出力

入力は `DoctorOptions`、doctor dependencies、実行時 HEAD/ref/root とする。doctor 実行は次を同じ
`DoctorMeasurement` として返す。

- `result`: 実行した検査から構成した判定と messages
- `checkIds`: 実際に呼び出した check definition ID の集合
- `profile`: `resolveDoctorRunProfile` が採用した profile

envelope writer はこの measurement と実際に適用した strict options だけを受け取り、full registry を
再走査しない。

## 3. 契約

### `runDoctorMeasured`

`runDoctorMeasured(options) => DoctorMeasurement`

- pre: options は CLI が受理した値である。
- post: registry 実行では `checkIds` が実際に呼び出した definition と一致する。
- post: setup-smoke では `profile=consumer-setup-smoke`、`scope=setup-smoke`、
  `checkIds=[setup-smoke]` を投影可能にする。
- invariant: `runDoctor` は同じ measured path の `result` projection であり、判定ロジックを二重化しない。

### envelope生成器

- pre: `DoctorMeasurement` は直前の同一実行から得た値である。
- post: `scope` / `profile` / `check_ids` は measurement と起動形の実態を表す。
- post: `strict_green_command_digest` / `strict_telemetry_provenance` / `timing` を全て明示する。
- invariant: 不明・縮小・option不一致の envelope は consumer が自走へ落とす。

## 4. 検証対

L7 の検証正本は `docs/test-design/harness/L7-unit-test-design.md` にある。`U-DOCTORENV-012` は
setup-smoke の実測profile/check IDs、`U-DOCTORENV-013` はwriterの実測集合保持、
`U-DOCTORENV-014` はstrict telemetry差の拒否、`U-DOCTORENV-015` は縮小面をfull consumerが
拒否することをそれぞれ検証する。

## 5. 失敗契約

- `--setup-smoke --result-file` を full / profile null / full check IDs として書かない。
- named profile と `scope=toolchain` を full として書かない。
- strict telemetry の差を省略で同一視しない。
- envelope 書き出し不能は従来どおり測定自体を覆さず、consumer を自走へ落とす。

## 6. 非対象

doctor profile 自体の検査集合再設計、CI job構成、暗号署名、別job間artifact共有は変更しない。
