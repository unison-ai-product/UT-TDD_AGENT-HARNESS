/**
 * oracle ID の canonical 宣言 provenance 衝突 baseline (Issue #206)。
 *
 * 値は `ID\\t正規化済み宣言説明` で固定する。概要/候補表と confirmed/freeze 表の
 * 構造的な再掲は collector 側で canonical 宣言へ畳み込むため、ここには載せない。
 * 現在残る既知の canonical 衝突だけを ratchet し、新しい説明の追加は fail-close する。
 */
export const ORACLE_ID_DUPLICATE_BASELINE: ReadonlySet<string> = new Set([
  "IT-MODULE-01\tA module import graph containing expected schema-first dependency direction. | Import graph check walks public and internal module imports. | No cycle exists and schema remains one-way dependency root. | src module graph -> dependency analyzer boundary. | Cycle count 0; forbidden reverse import count 0. | Injected cycle, helper importing CLI, lint importing doctor.",
  "IT-MODULE-01\tengine-swap module graph | dependency auditを実行する | domain逆依存、barrel cycle、doctor/CLI逆importが0になる | module graph、cycle count 0",
]);
