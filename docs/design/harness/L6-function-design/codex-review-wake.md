---
artifact_type: design_doc
layer: L6
status: draft
sub_doc: function-spec
plan: docs/plans/PLAN-L6-600-codex-review-wake-contract.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
---

# Codex review wake の契約 (#600)

状態: 未実装の目標契約。`src/cli/review-live.ts` は `publishCodexReviewWake` を optional な依存として受けるだけで、production の `src/cli.ts` は注入しないため、現行は `codex_review_wake_unavailable` に落ちる。`hook codex-memory-wake`、Codex inbox、claim / terminal marker、backlog store は `src/` に存在しない (2026-10-14 実測: `git grep -i codex-memory-wake -- src .codex` が 0 件)。本文書は実装 PR が方式をその場で発明しないための契約である。

対象は、Claude 著 PR の canonical review request が永続化された後に、Codex reviewer へ typed wake を配送する経路である。Claude 側 wake の既存契約、`#540` cutover、review custody と receipt の信頼根は変更しない。

## 責務と依存

| 責務 | 内容 | 依存する責務 |
|---|---|---|
| R1 request-before-wake | canonical request の永続化と wake 発行の順序、失敗時の backlog | なし |
| R2 project-scoped Codex inbox | 宛先 path、envelope、publish の冪等 | R1 の request identity |
| R3 hook surface | SessionStart / Stop から返す machine-readable な状態 | R2 の inbox |
| R4 claim / consume / terminalize | claim、lease、FIFO、terminal marker、orphan | R2、R3 |
| R5 production composition | production CLI に Codex publisher を必須注入する | R1 |

R4 は R2 と R3 の成果 (inbox entry と surface) を使う。R1 の backlog 再配送は R2 の publish を使う。

## R1 canonical request と wake の順序

`review live-dispatch` は subject (exact HEAD と PR binding) を検証し、canonical request を `.ut-tdd/review/requests/<requestDigest>.json` へ content-addressed に永続化した後にだけ typed Codex wake を発行する。同一 path・同一 canonical bytes の再発行は冪等成功、同一 path の異 bytes は conflict で拒否し上書きしない。request を作れない、または identity が不正なときは、Codex inbox・hook surface・backlog への downstream write を 0 にする。

request 永続化後の wake 失敗は次の result shape に収束させる。

```ts
type CodexWakeDispatchFailure = {
  ok: false;
  reason:
    | "codex_review_wake_unavailable"
    | "review_wake_publish_failed"
    | "codex_review_wake_projection_conflict";
  backlog: { requestDigest: string; requestPath: string };
};
```

`backlog` は request を再発行せずに再配送するための typed state であり、既存 request の削除・上書き・再 mint は禁止する。production adapter が `CodexReviewWakeBacklogStore` を所有し、`<runtimeBusRoot>/codex-memory-wake/backlog/<requestDigest>.json` へ mode `0600` で create-or-validate する。SessionStart / Stop の hook が consumer を起動するたび、inbox を surface する前に `createdAt`、同値なら `requestDigest` の順で 1 件を再 publish する。同一 bytes は冪等、異内容・request 欠落・project 不一致は typed conflict として bytes を保持する。成功時だけ backlog entry を terminal marker へ移し、失敗時は保持する。

## R2 project-scoped Codex inbox

宛先は `requireProjectMemoryRoot(repoRoot)` が返す `runtimeBusRoot` (`<git-common-dir>/ut-tdd-runtime/projects/<projectNamespace>`) を正本とし、`<runtimeBusRoot>/codex-memory-wake/inbox/<entryStem>.json` だけを使う。current worktree、PID、global broadcast、PR comment、利用者 home 固定値から宛先を推測しない。Claude inbox と同じ directory に混ぜず、project namespace を越えて読まない。

entry は provider envelope v4 (`schemaVersion = "ut-tdd.claude-inbox/v4"`) を使い、`purpose="review"`、`target.scope="session"`、`target.provider="codex"` と、project ID、memory ID、request digest / path、PR、exact HEAD、review revision、author family を束縛する。producer は `provider="claude"`、論理受信 session は `CODEX_REVIEW_TARGET_SESSION` で固定する。この環境変数が未設定または空なら、inbox・hook surface・backlog のいずれにも書かず `codex_review_target_session_unavailable` で fail-close し、既定値・PID・任意 session で補完しない。

publish は inbox directory を安全に作成した後、mode `0600` で exclusive-create する。同一 path・同一 canonical bytes は成功扱い、異 bytes または entry identity / path の不整合は `codex_review_wake_projection_conflict` で fail-close し、既存 bytes を変更しない。

## R3 machine-readable hook surface

Codex の `SessionStart` と `Stop` の両方から、同じ project の `node src/cli.ts hook codex-memory-wake` を呼ぶ。stdout の JSON object と exit code が契約で、schema は `ut-tdd.codex-memory-wake/v1`。`deliveryConfirmed` は常に `false` で、surface の観測を配送成功や receipt として扱わない。

| status | 条件 | exit | 追加 field |
|---|---|---|---|
| `pending` | valid entry が 1 件以上 | 2 | `envelopePath`、`requestDigest`、`pr`、`exactHead`、`reviewRevision`、`invalidCount`、`reason: "codex_review_pending"` |
| `empty` | entry なし | 0 | なし |
| `invalid` | valid 0 件・invalid 1 件以上 | 2 | `invalidCount`、`reason: "codex_review_wake_envelope_invalid"` |

valid と invalid が混在するときは valid を surface し、同じ scan で検出した invalid 数を `invalidCount` に必ず入れる。未知 schema、project / target 不一致、path escape、破損 JSON は surface から除外する。invalid entry の元 bytes は削除・再配送・receipt 化せず保持する。hook の stdout / stderr を review verdict、receipt、merge authority の入力にしない。

## R4 claim、consume、terminalize、FIFO、orphan

- **claim**: Codex は surface が返した exact `envelopePath` を `codex-memory-wake/claims/<entryStem>.<targetSessionId>.json` へ atomic rename して claim し、`node src/cli.ts review live-consume --envelope <path> --json` へ渡す。surface だけでは claim 済みと見なさない。rename に成功した 1 session だけが consume でき、`targetSessionId` は envelope の target session と一致必須。失敗時は同一 bytes を inbox へ atomic restore し、claim と inbox の両方が残る片肺状態を許さない。
- **consume の再検証**: canonical request、envelope v4、project / target、PR、exact HEAD、review revision、反対族 provider を再検証する。Codex の reviewer delegation と canonical receipt projection が成功した後だけ inbox を terminalize する。
- **lease**: claim marker は `claimedAt`、`leaseExpiresAt`、`targetSessionId`、entry identity を必須とし、`leaseExpiresAt <= claimedAt + 15 分`。consumer は同じ project namespace 内で heartbeat を更新できる。terminal marker が無く lease が切れた claim は、次の SessionStart / Stop で同一 bytes を inbox へ atomic restore して再取得可能にする。期限前の active claim、foreign project の claim、terminal marker と identity が一致する claim は回収・削除しない。
- **terminal**: 成功時に entry identity、request identity、PR、HEAD、revision、author family、terminal reason `claimed` を持つ terminal marker を mode `0600` で exclusive-create し、対応する inbox projection だけを削除する。terminal 判定は process exit code ではなく、canonical request identity に一致する canonical receipt の存在と再検証結果で決める。receipt が無い provider unavailable、identity mismatch、verdict / receipt 書き込み失敗は typed fail-close で restore する。receipt が正しく永続化済みなら、`derived_verdict_publish_failed` などの non-zero exit は terminalize を妨げず、派生表示の失敗を別の監査事象として残す。
- **marker の保持**: terminal marker は作成から 7 日間保持し、それ以前の prune を拒否する。7 日到達後の SessionStart / Stop だけが project namespace 内の marker を prune でき、foreign project・active claim・inbox・backlog は削除しない。
- **FIFO**: valid entry を `createdAt`、同値なら entry identity の決定的な順で 1 件ずつ surface する。古い entry の失敗や orphan が後続の valid request を head-of-line block しないが、orphan を valid receipt として進めず、黙って削除もしない。
- **invalid の扱い**: malformed、schema 非互換、project / target 不一致、entry stem / path 不一致、terminal marker との identity 不一致は `codex_review_wake_envelope_invalid` 相当の typed invalid state で fail-close し、元 bytes を保持して修復・再発行を可能にする。

## R5 production composition

`registerLiveReviewCommands` は注入された test port を受けられるが、production CLI は Codex publisher を必須注入する別 entrypoint (実装案: `registerProductionLiveReviewCommands`) で組み立てる。`src/cli.ts` の production assembly が optional publisher に戻る変異は、実 composition を起動する test oracle が検出する。Claude publisher と Codex publisher は同一の request identity を共有するが、互いの inbox / consumer を読み替えない。

## 範囲外

source 実装、`.codex/hooks.json` の変更、CLI command の追加、consumer / delegation の実体、既存 inbox の replay / GC、receipt / custody、Claude wake、#540 cutover、Issue close、merge は本契約の範囲外で、契約 freeze 後に 1 PR = 1 論点で実装する。

## 検証 oracle

`CANDIDATE-CODEXWAKE-001`〜`011` は `docs/test-design/harness/L7-unit-test-design.md` の `CANDIDATE-CODEXWAKE-*` 節が正本である。実装 PR は各 candidate に test path、write count、exact identity、exit code、再配送結果を引用し、実測できたものだけ `U-*` へ昇格する。
