# Issue #541: PLAN-RECOVERY-16 rev6/rev7 正規再発行実測

## 目的

PR #643 の Claude r2 FLAG（rev6 の `admitted_at` が埋込み commit の時刻より
後の手書き値に見える）を、旧 receipt を残すだけの補修ではなく、rev5 から
正規 `plan revise --manifest` で rev6 を再発行し、その postimage を base に
rev7 も再発行することで是正した。

## 共通の安全境界

- 対象 worktree: `C:\dev\ut-541-revise-from-rev5`（detached、一時 checkout）
- 対象 source: `docs/plans/PLAN-RECOVERY-16-plan-revision-authoring.md`
- 対象 projection: `docs/governance/plan-admission-receipts.json`
- primary `C:\dev\UT-TDD-agent-harness\.ut-tdd\harness.db` は操作していない。
  CLI が使用したのは一時 checkout 内の local ledger のみ。
- source frontmatter と tracked projection は直接編集せず、各回とも次の CLI の
  postimage を取り込んだ。

```text
node --experimental-strip-types src/cli.ts plan revise --manifest <manifest>
```

`recorded_at` は各 CLI 呼び出し直前に実行環境の `new Date().toISOString()` で
生成した。固定時刻・手書き時刻は使用していない。

## rev6 の再発行

base は main 同期済み rev5 commit `614cd2923df4f7cdb537d9e0e8ec3c664caeceba`。
rev5 の projection tail `sha256:505fef3b2a6eafab929af49ff41f88eacf6172ca87ec2304a05e5b5c879476cd`
と source blob/content/canonical digest を manifest に固定し、旧 rev6 source を
次 source として `plan revise` へ渡した。

```text
command:    plan-revise:issue-541:recovery-16:12
recorded_at: 2026-09-17T01:36:56.365Z
result:     created
receipt_id: certificate:b5898ab5c8188c3e6895ba3f5771a50c
revision:   6
source_digest:    sha256:ec3c1b83908ef0fd14240307ad65abb3f3cad5b105f771dbe3a59e6f732ef06a
decision_digest:  sha256:21dc57ed315c9a6313237d600f0d52e955bc60fed6548ea6d00f43aec985c38c
receipt_digest:   sha256:12706dc104622ec566c9fdfe17f3ed231d5a4c00434342e94c2bef8f667b7f94
command_payload:  sha256:667951b863f4252d7773ceb0fe386a3bb1cf82e5d2fb8c96b15fb789753d0c76
projection_seq:   273
record_digest:    sha256:1fec18c89d60fac0d8e220091319de5476f1b16bdba8a439538d59116285ae05
previous_record:  sha256:505fef3b2a6eafab929af49ff41f88eacf6172ca87ec2304a05e5b5c879476cd
```

この postimage を commit `fab1cd759c51cc2ad9019dbf407455694db6d634`
（commit 時刻 `2026-09-17T10:37:26+09:00`）へ保存した。従って
`admitted_at` は埋込み commit より前であり、commit 時刻より後という正しい
実行順序になっている。

## rev7 の再チェーン

rev6 commit `fab1cd75` の source blob/content/canonical digest と seq273 の
record digest を新しい base preimage とし、旧 rev7 body（`sub_doc` 除去と
U-PA-REV-040/048, 053..056 の記載を含む）を `plan revise` へ渡した。

```text
command:    plan-revise:issue-541:recovery-16:13
recorded_at: 2026-09-17T01:37:41.202Z
result:     created
receipt_id: certificate:2e18c1fd333d4bb7b83ae0617d37fe7e
revision:   7
source_digest:    sha256:1b6aa397ad9995b717907d3247e02b3bba3d6c4508874b7654f90fd29b388927
decision_digest:  sha256:ca74e564264b9e0e60b9720b1b71599ca20cb4887a4d34088844eb91305600d6
receipt_digest:   sha256:a0cc17907488c1a187d67e203beef3bfb5565df309a498e87686d2e67cdca2f1
command_payload:  sha256:26388dc182ccd29f7fe8914e7996497f92e49dc3ab0dde248ad675638671d765
projection_seq:   274
record_digest:    sha256:c76f6023b13826068f6035bdd917eff816774f918fb2d3777e224e7b41bc6e32
previous_record:  sha256:1fec18c89d60fac0d8e220091319de5476f1b16bdba8a439538d59116285ae05
```

この postimage を commit `8dcff2ec492e50747af31c0fda06a09888ebc80e`
（commit 時刻 `2026-09-17T10:38:08+09:00`）へ保存した。
従って rev7 も rev6 の新 receipt/record に chain しており、旧 seq273/274 と
旧 command `:10`/`:11` は最終 tree の authoritative projection に存在しない。

## 検証結論

最終 projection tail は seq274、rev6→rev7 の
`previous_record_digest` が連続している。rev6/rev7 の `admitted_at` はいずれも
実行時計由来で、埋込み source commit 時刻を後追いする値ではない。旧 PR #643 の
de1 系譜へ追記するのではなく、rev5 から再構築した新しい chain を PR branch へ
移す。
