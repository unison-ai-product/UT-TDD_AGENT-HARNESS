---
artifact_type: test_design
layer: L7
executed_at_layer: L7
status: draft
plan: PLAN-L6-935-claude-inbox-explicit-ack
pair_artifact: docs/design/harness/L6-function-design/claude-inbox-explicit-ack.md
---

# Claude inbox 明示 ACK の検証対 (#935)

状態: candidate。実装済み・Green・confirmed oracle とは扱わない。
設計正本: `docs/design/harness/L6-function-design/claude-inbox-explicit-ack.md`。

| candidate | 独立して反証する境界 | 期待結果 |
| --- | --- | --- |
| CANDIDATE-U-INBOXACK-001 | ID指定で現在sessionのexact entryをACK | terminalを1件作成し、そのentryのみwake/summaryから除外 |
| CANDIDATE-U-INBOXACK-002 | 別project / workspace / sessionを個別に変異 | 各軸でdeny、対象marker write 0、foreign entry不変 |
| CANDIDATE-U-INBOXACK-003 | authorityのgeneration / sessionを個別に変異 | 既存generation検証でdeny、write 0 |
| CANDIDATE-U-INBOXACK-004 | entry bytesだけをpreview後に変更 | digest mismatchでdeny、write 0 |
| CANDIDATE-U-INBOXACK-005 | before境界の直前 / 等値 / 直後、不正日時 | 直前のみpreview対象、等値・直後を除外、不正はdeny |
| CANDIDATE-U-INBOXACK-006 | preview後、明示承認前に新entryを追加 | inbox snapshot digest不一致で承認無効、集合apply拒否、marker write 0。新entryを含め全entry不変 |
| CANDIDATE-U-INBOXACK-007 | 欠落 / malformed / 重複ID / filename不一致 / session未束縛legacy | 個別deny、対象write 0 |
| CANDIDATE-U-INBOXACK-008 | 同一ACKの再実行と既存v1 terminal | already_terminal、既存marker bytes不変 |
| CANDIDATE-U-INBOXACK-009 | 同じpathに異identity / malformed terminal | conflict、上書き0 |
| CANDIDATE-U-INBOXACK-010 | review ACKと通常Memory ACK | purpose別identityを保持、request/receiptの状態変更0 |
| CANDIDATE-U-INBOXACK-011 | inbox/claim/audit/Memory/request/receiptの前後比較 | ACK対象の新claim dispositionとterminalだけが追加され、既存claim/inbox/audit/Memory/request/receiptは不変 |
| CANDIDATE-U-INBOXACK-012 | ACK claim CAS後・terminal前のcrash / terminal書込失敗 / retry | acked_stale dispositionとidentityをclaimに保全し、再試行は同じterminalを冪等完了。deliveryへ戻らず、新規ACK成功countを二重計上しない |
| CANDIDATE-U-INBOXACK-013 | v1既存4理由とv2 ACK、未知schema/reason | 対応schemaだけ抑止、不正markerを有効ACKにしない |
| CANDIDATE-U-INBOXACK-014 | deliveryとACKを同一existing `.claim` CASで競合させ、順序を制御 | ACK CAS先行はdelivery/配送0、delivery claim先行はACK conflict・既存claim不変・ACK成功count 0。二重成功なし |
| CANDIDATE-U-INBOXACK-015 | preview listのcanonical serializationとdigest | 同一集合は順不同入力でも同じpreview digest。entry ID / purpose / destination / createdAt / bytes digest / inbox snapshotの各変異はdigestを変える |
| CANDIDATE-U-INBOXACK-016 | 承認監査のactor・approvedAt・preview digestを照合 | terminalごとにcontrol承認者、UTC approvedAt、承認済preview digestが一致し、異なる一覧digestや欠落値は成功扱いしない |
| CANDIDATE-U-INBOXACK-017 | 選択対象外を含むpreview後〜承認前のinbox entry追加 / 削除 / bytes・metadata変更 | inbox snapshot digest不一致で承認無効、集合apply拒否、全marker write 0 |
| CANDIDATE-U-INBOXACK-018 | 既存claimのdispositionがdelivery / acked_stale / malformed / empty | delivery・malformed・empty claimをACK成功扱いせず不変保持。same acked_stale claimはfresh successでなくrecovery扱いでterminalを冪等完了 |
| CANDIDATE-U-INBOXACK-019 | 2つのStopが同じapprovalを読み、同じ先頭entry (anchor) のclaim CASで競合 | anchor claimは1つだけ。勝者のみ後続対象へ進み、敗者は未獲得entryをclaimせず、同じdigestの既獲得claimからのterminal recoveryだけが可能 |
| CANDIDATE-U-INBOXACK-020 | anchor CAS前crash / anchor公開後terminal前crash / 重複Stop・旧waiter | anchor前はclaim write 0で承認未消費。anchor後はclaimが論理消費点となり、同claimからterminalを回復し、同じ承認で未獲得tailへの新規claimは0。CAS直前にauthority失効を注入した旧waiterは新claimを作らない |
| CANDIDATE-U-INBOXACK-021 | 候補schemaとidentity binding | preview/snapshot/approval/claim/terminalのcanonical identity・digestが相互一致。`ClaudeProviderTarget` / `ClaudeWakeAuthority` identityのsession・workspace・generation・authorityEpoch変異はdeny/conflict |
| CANDIDATE-U-INBOXACK-022 | 同一preview digestのdescriptorを競合作成・再承認 | `ack-approval-sha256-<hex>.json`をno-clobberで一度だけ作成し、同一bytes再実行はidempotent、異なるbytesはconflict。消費後もdescriptorを保持し、別digestは別descriptor |
| CANDIDATE-U-INBOXACK-023 | snapshot/preview JSONのschema・key・row正規化 | schema文字列不一致、unknown/duplicate key、duplicate entryId、preview/approvalの空entriesを拒否。空snapshotは表現可能。raw inbox/claim bytes digestの変化でsnapshot digestが変わり、entryIdのUTF-8 bytes順でのみ正規化 |
| CANDIDATE-U-INBOXACK-024 | CLI surface | 既存`ut-tdd memory` groupの`inbox-ack preview/approve`のみを確認し、provider委譲commandに混在せず、CLI apply commandがなくclaim獲得はStop hookに限定される |
| CANDIDATE-U-INBOXACK-025 | 複数descriptor・消費済みdescriptor・foreign descriptorの選択と7日cleanup | filename順で自分宛て未完了terminalの回復または未消費ACKの最初の1承認だけ処理。回復を含め最大256entry、同じStopで別descriptorへ続行0。消費済みtailを新規claimしない。foreign descriptor不変。descriptorと未terminal ACK claimを7日cleanupで削除しない |

## 検証実行の境界

retention境界の追加候補: ACK claim獲得後にterminal作成をfaultさせ、7日超へclockを進めてcleanupを実行する。claim dispositionが維持され、配送0、同claimからterminalを冪等回復できることを検証する。空/部分claimを有効ACKへ推測しない負系も分ける。

集合途中の追加候補: 最初のACK獲得後、次entryのCAS前に外部entry/claim変更を注入する。既獲得分を保全し残りを止め、partial/conflictを報告する。全体write 0やrollback成功と偽らない。自身の一致ACK claimだけの増分では次entryを誤拒否しない。retryは同claimのterminal回復であり、新規ACK成功として再計上しない。

fixture runtime root / fake clock / 注入authorityを使い、実 inbox をテスト対象にしない。preview write 0、network呼出0、各deny軸は他identityを整合させた単独変異で検証する。preview digestは契約のcanonical encodingから独立に計算して照合し、承認 actor・時刻・digest の一致と stale snapshot rejection を検証する。claim CASの競合は実際の共有claim pathで順序制御し、claim後crashからのterminal回復と既存claim非変更を検証する。negative oracle のために既存925 foreign-session oracleを弱めない。構造検査だけでなく既存wait/summaryのproduction compositionから抑止と非対象配送を実測する。

受信側Stop hook限定の追加候補: 通常CLIからclaimを獲得できないこと、承認記録のsessionとhook自身のsessionが異なればforeign claim / terminal write 0であることを検証する。同一OS userのfile偽造耐性やstdin sessionの独立認証を、この検証の保証と称しない。actorは申告監査値でありdigest整合性とは分ける。

single-use / 上限の追加候補: 同じ承認を複数Stopから並行・連続replayし、canonical UTF-8 byte順の先頭entryの実 `.claim` CASだけがsingle-use anchorになることを検証する。CAS勝者だけが同一Stop内でtailへ進める。敗者・重複Stop・旧waiterはtailへの新規claimを作らず、同じapproval digestの既存ACK claimからterminalを回復する場合に限り再処理できる。anchor前crashは未消費、完全anchor claim公開後のcrashは消費済みでtailを再開しない。各claimの最終validation前にgeneration失効を注入した旧waiterはpublishしない。generation marker更新とclaim path publishの間を跨ぐ物理atomicityは別primitiveなしには断定できないため、barrier testで既存validationが観測できる範囲と未解決raceを記録し、強いfencing oracleへ昇格する前にcontrol確認を要する。255 / 256 / 257件でanchor込み上限を検証し、上限超過分は新しいpreview/承認を要求する。空集合はpreview / approvalとも拒否する。per-digest immutable descriptorのno-clobber作成、監査用残置、anchor claimだけによる消費を検証する。

完全claim公開の追加候補: temp write中、fsync後・link前、link後・terminal前でprocess faultを注入する。claimは不存在か完全payloadのいずれかであり、link非対応時に上書きrenameや空claimへfallbackしない。Linux/Windowsの実file system上で共有claim pathのno-clobberを検証する。電源断durabilityは保証対象外。

Red→Green、対象回帰、typecheck、CLI/hook両OS smoke、exact HEAD CI、非著者closing reviewは未実施。候補番号の昇格は契約freeze後の実装で行う。
