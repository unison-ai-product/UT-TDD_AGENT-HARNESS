# Issue #959：release-channel L7 群の設計還流証跡

## 範囲と固定入力

本書は、既存の `docs/design/harness/L6-function-design/release-channel-manifest.md` へ責務を対応づけるための限定証跡である。候補分類・PLAN本文・台帳の変更、未実装機能の実装、個別PLANや上位release/promotion作業の完了・廃止を宣言しない。以下の依存・未達項目を設計へ移したもの、工程順だけで剥離できるもの、別途確認を要するcarryとして区別する。未確認事項を「存在しない」とは扱わない。

- 候補配列固定ref：`d5ad67fb50c148ea8dd6d5475bab4b88f2d4cd4c`（L7一次配列543件、配列indexは1始まり）。
- PLAN本文固定ref：`3ca0692d6c6a180b058c492475080be2a140e667`。
- 設計・実装・test-design三者照合の固定ref：`d5ad67fb50c148ea8dd6d5475bab4b88f2d4cd4c`。
- 下表の完全ID、blob OID、blob bytes SHA-256は固定入力のprovenanceであり、本書で再分類しない。

| 配列index | PLAN完全ID | 固定PLAN blob OID | 固定blob bytes SHA-256 | この設計で保持する責務 |
| ---: | --- | --- | --- | --- |
| 423 | `PLAN-L7-479-release-manifest-pf1-pure-domain` | `ad17d93a7b0c7b60535986bcac584269daa22be7` | `8d14c4945b1e3fc19af13ed4cd6c7cd01042a68f547cb29d92c376abfeceb3b6` | PF-1厳密parse、immutable release identity、own-key channel解決。`U-RELMAN-001/002/007/009/013`。 |
| 431 | `PLAN-L7-486-release-materializer-pf2` | `ed89055afc34a0a0464722c235a104bbf28fb57b` | `cc6e2cb2ab8a81d65d1924bd55ff7fa71a6e6796b2258ab2b3881f2a18ed1848` | PF-2 pure materialization、byte framing、version token境界。`U-RELMAN-011`。 |
| 432 | `PLAN-L7-487-isolated-git-artifact-resolver-pf3` | `13d5eddf9a9af025f2eea59cf5a1ccd8669063e4` | `14dfd7665b174ec4a7d7f81523ba7690a5bb4fde05f5997e3543bafe6a030243` | PF-3 local Git object解決とPF-2 port境界。`U-RELMAN-012`。 |
| 434 | `PLAN-L7-489-pf4-sync-pack-channel-adapter-pair-freeze` | `e06ec1170e866a98b4ca2e66ca997d45ab0969f4` | `aa38aa5c74ceefb84d86cec6956c14d38a575455ca83c6e01f9ecbbe7899fc36` | PF-4三値attestationとidentity/error境界。`U-RELMAN-006/018`。 |
| 438 | `PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze` | `1de44ab62e76e1ef9a16ccb38e95870e6fb29cfe` | `3363047f204afbcb1dd4fbf6b0a3e9b29dc8cdbf4ad52d136207b039800d73bb` | PF-5 v1 exactly-one mappingと既存sealed apply/rollback境界。`U-RELMAN-014..017`。 |
| 516 | `PLAN-L7-742-release-aggregate-v2-inventory-cardinality` | `dacd0cc30143ad0d40fc248cb677b3c983452c31` | `423f8300f05302251ffed16ba5f4eeeb85b266bc6ecfab68009e98dd8181a5b5` | PF-5 v2 ordered mapping/artifact cardinality、sealed entries path binding。`CANDIDATE-U-RELAGGV2-*`は正式`U-*`と区別する。 |

## PLANごとの依存・DoD・carryの追跡

| PLAN | 固定本文の requires / blocks | 固定本文の未達DoD・carry | 設計への写像と残る扱い |
| --- | --- | --- | --- |
| #479 PF-1（本文frontmatter 27–37行、Exit 104–108行） | `requires: []`、`blocks: []`。親は#473。`backprop_decision: not_required`の理由は、PF-1がfreeze済みpartitionのpure domain追加でL0–L6・外部仕様を変えず、副作用契約はPF-5 REDに残るため。 | 固定本文Exitは、5 candidateについて後続実装PRが実装test citationを同一commitで`U-RELMAN-*`へ昇格する工程を指定。本文のreview evidenceはPR #307 exact HEADのPASSを記録している。 | L6 §2.1–2.2（27–28行）に`parseReleaseManifest` / `resolveReleaseChannel`を保持し、対応oracleはL7 test-design 2158–2160行に存在する。実装名は`src/schema/release-manifest.ts:340,357`。後続昇格工程は固定本文上の記録であり、本証跡は新たな昇格・全体終了を主張しない。 |
| #486 PF-2（本文frontmatter 27–41行、Exit 159–170行） | `requires: [docs/plans/PLAN-L7-479-release-manifest-pf1-pure-domain.md]`、`blocks: []`。PF-1→PF-2の順序を保持する。backprop不要の理由は上流合流を`PLAN-REVERSE-473`が所有すること。 | Exit 170行はexact-HEAD CI greenとnon-author closing PASSを未チェック。review evidence 47–53行もtargeted 30 testsの成功に留まり、closing review未実施と明記。 | L6 §3.1（62–73行）にpure materializerの入出力、framing、禁止するGit/worktree/network/writeを保持。実装`src/setup/release-materializer.ts:130`、test `tests/release-materializer.test.ts:53`、oracle `U-RELMAN-011`（L7 test-design 2175行）。未達review/CIは別途検証が必要なlifecycle carryであり、設計追補で完了扱いにしない。 |
| #487 PF-3（本文frontmatter 27–41行、Exit 186–199行） | `requires: [docs/plans/PLAN-L7-486-release-materializer-pf2.md]`、`blocks: []`。PF-2→PF-3の順序を保持する。backprop不要の理由は上流合流を`PLAN-REVERSE-473`が所有すること。 | Exit 199行はexact-HEAD CI greenとnon-author closing PASSを未チェック。review evidence 47–52行は8群のtargeted test・blocking 0を記録する一方、上記closing/CIを未実施と明記。 | L6 §3.2（75–87行）にlocal object解決、PF-2とのport責務、worktree/remote fallback/copy/write禁止を保持。実装`src/setup/release-artifact-resolver.ts:308`、test `tests/release-artifact-resolver.test.ts:97`、oracle `U-RELMAN-012`（L7 test-design 2176行）。未達review/CIは未完carryとして残す。 |
| #489 PF-4（本文frontmatter 31–41行、§0–4 67–117行） | `requires: [PLAN-L7-487-isolated-git-artifact-resolver-pf3]`、`blocks: []`。PF-3後にPF-4を置く。 | 固定review evidenceはPR #329 docs-only pair-freezeの契約レビューを対象とし、実装挙動/U-RELMAN-006実装検証は対象外、#330 closing reviewで別途判定と明記（frontmatter scope）。本照合では#330のclosing結果を独立確認していない。 | L6 §2.4、PF-4行（31行）に`attestReleaseChannel`の既存signature、三値、identity/digest照合と副作用境界を保持。実装`src/setup/release-channel-adapter.ts:60–90`、test `tests/release-channel-adapter.test.ts:57`、test-design 2163–2164行。#330の結果は別途確認が必要で、設計対応だけでは閉じない。 |
| #492 PF-5 v1（本文frontmatter 30–42行、工程・境界135–149行） | `requires: [PLAN-L7-489-pf4-sync-pack-channel-adapter-pair-freeze]`、`blocks: []`。§3工程138行は実装PRが#489を`requires`へ束縛し、`PLAN-REVERSE-473` R3/R4 backfill対象にするよう要求。 | 固定本文に`backprop_decision: required`。後続#742訂正注記はv1 exactly-oneを不変にし、v2改訂を#742へ分離する（訂正注記149行以降）。`PLAN-REVERSE-473` R3/R4の現在の達成状態はこの照合では確認していない。 | L6 §4（32–33行）にv1 aggregate admission/applyと`U-RELMAN-014..017`を、v2と混ぜず保持。実装`src/setup/release-aggregate-admission.ts:237,305`、直接test `tests/release-aggregate-admission.test.ts:394,617`、oracle表2178–2181行。Reverse-473 R3/R4は未確認carryとして維持する。 |
| #742 PF-5 v2（本文frontmatter 14–18, 31–49, 92–129行、§2–7 180–390行） | `requires`: #492、#494、#499、#628。`blocks`: #531。#492はこの文書でPF-5 v1/v2境界として接続する。#494 promotion/rollback gate、#499 publication manifest、#628 producer/validator、#531 canaryは別所有文書・作業であり、このL6文書だけで依存達成を証明しない。 | backprop required。§2.3はpromotion/rollback責務を#494およびL6-102へ、§2.4はcanary-channel判定を別findingへ分離。§3/§4は変更対象・非対象を限定。AC 1–9（343–357行）には候補oracle Red/Green、M1–M7、回帰、finding enum不変、destination単一正本、変更外file不変、#492/#494訂正とdoctor、非著者closing、Reverse-742 R4が含まれる。§7（359–370行）はS1→S2→S3と#531 PR-1の順序を要求する。fixed test-designでは`CANDIDATE-U-RELAGGV2-001..009`の候補statusが残り、これを正式`U-*`へ読み替えない。 | L6 §8（128–198行）にordered equality、`entries[].path`を単一destination正本とする契約、v1不変を保持。直接test `tests/release-aggregate-admission.test.ts:218–337`に001候補等の実測はあるが、候補の一部であり全AC達成証拠ではない。#494/#499/#628のrequires、#531のblocks、Reverse-742 R4、AC 1–9の残るCI/review/doctor/回帰/非対象差分/実装順の達成状況は本証跡で未検証のcarry。対応する所有設計・test-design・PLANで個別追跡を要し、未知の達成/欠落を推定で埋めない。 |

## L6設計・oracle・実装・testの対応

- PF-1は`release-channel-manifest.md:27–28`にあり、実際のAPI名は`parseReleaseManifest`と`resolveReleaseChannel`。固定実装は`src/schema/release-manifest.ts:340,357`、直接testは`tests/release-manifest.test.ts`、oracle行は`docs/test-design/harness/L7-unit-test-design.md:2158–2160`。候補要約に現れる実在しない`parseCanonicalReleaseManifest`へ読み替えない。
- PF-2はL6 `:29`および§3.1 `:62–73`、`U-RELMAN-011`はL7 test-design `:2175`。APIは`src/setup/release-materializer.ts:130`、suiteは`tests/release-materializer.test.ts:53`。pure変換以外のGit読取・worktree/network・writeはその責務に加えない。
- PF-3はL6 `:30`および§3.2 `:75–87`、`U-RELMAN-012`はL7 test-design `:2176`。APIは`src/setup/release-artifact-resolver.ts:308`、suiteは`tests/release-artifact-resolver.test.ts:97`。PF-2 materialization、PF-3 object解決、PF-4 digest attestationを別責務として保つ。
- PF-4は`src/setup/release-channel-adapter.ts:60–90`と`tests/release-channel-adapter.test.ts:57`で照合。L7 test-design `:2163–2164`は`U-RELMAN-006/018`をPF-4/#489に割り当てる。L6へ既存API signatureと状態を追加し、新oracleや呼出必須条件は作らない。
- PF-5 v1はL6 `:32–33`、oracle `:2178–2181`。APIは`src/setup/release-aggregate-admission.ts:237,305`、直接検証箇所は`tests/release-aggregate-admission.test.ts:394,617`。v1 exactly-oneをv2 cardinalityへ置換しない。
- PF-5 v2はL6 §8 `:128–198`。固定source predicateは`src/setup/release-aggregate-admission.ts:126–141`、sealingは`:237–301`。直接test `tests/release-aggregate-admission.test.ts:218–337`は候補IDを含む。`CANDIDATE-U-RELAGGV2-*`を正式`U-*` oracleへ昇格したとは扱わない。

## 責務誤対応の訂正と除外境界

従前のL6表は`applySealedReleaseAggregate`に`U-RELMAN-017`と`U-RELMAN-018`の両方を割り当てていた。しかし固定L7 test-design `:2164`では`U-RELMAN-018`は#489 PF-4 adapter hardening、`:2181`では`U-RELMAN-017`はPF-5 apply/fault/restoreである。今回のL6差分はPF-4行へ既存の`attestReleaseChannel`と`U-RELMAN-006/018`を割り当て、apply行を`U-RELMAN-017`だけにする責務訂正である。新しいtest-design行・source挙動・oracleは追加していない。

隣接#473はS1契約freezeで、固定設計が後続S2実装を明示しているため、この実装責務束へ含めない。#499/#500/#508/#515/#565はexact L6 function owner/oracleを本照合で確立していないため、話題の類似だけで本書へ混ぜない。各PLANのstatus、historical review scope、未達DoD、依存、候補oracle状態、Reverse/親Issueのlifecycleは固定記録どおり別途残る。本証跡はそれらの完了・解消・廃止、全体release作業の完了を主張しない。
