# Issue #959：release-channel L7 群の設計還流証跡

## 範囲と固定入力

本書は既存の `docs/design/harness/L6-function-design/release-channel-manifest.md` への責務対応を記録し、authorによる6 PLANの具体的なdisposition提案を付す。「区分案」はcontrolの最終採択ではないが、採択権を理由に判定を空欄にはしない。固定本文、現在の設計・実装・test、および閉じた工程証跡から各案を導く。PLAN本文・台帳・候補一次分類の変更、未実装機能やtestの追加、CI/reviewの再実行は行わない。完了した工程証跡は歴史記録として剥離し、未達の規範的carryは具体的な設計節へ残す。未確認事項を「存在しない」とは扱わない。

- 候補配列固定ref：`d5ad67fb50c148ea8dd6d5475bab4b88f2d4cd4c`（L7一次配列543件、配列indexは1始まり）。
- PLAN本文固定ref：`3ca0692d6c6a180b058c492475080be2a140e667`。
- 設計・実装・test-design三者照合の固定ref：`d5ad67fb50c148ea8dd6d5475bab4b88f2d4cd4c`。
- 下表の完全ID、blob OID、blob bytes SHA-256は固定入力のprovenanceであり、変更しない。dispositionのauthor区分案は後表に記す。
- #742 Reverse R4の現状確認は上記`3ca...` PLAN snapshotとは別に扱う。候補/設計照合ref `d5ad67fb50c148ea8dd6d5475bab4b88f2d4cd4c`、旧照合HEAD `998b283b3ec0501c26001da7e1af625dcd284112`、および本WT source HEAD `ab41804f2baf6ff6d3cc08df9089b8b2060a9ff5`を確認した。`docs/plans/PLAN-REVERSE-742-release-aggregate-v2-inventory-cardinality-backfill.md`は各refでblob OID `3fd36b293797dd524ab9e665cef935bfb7285040`、raw bytes SHA-256 `e35d5fc63b88f46b77149b4675e71774897c7c0285d4850146c6324f243c6b4d`（本WTで8570 bytes）で一致する。R4 confirmedの根拠を古い`3ca...` PLAN snapshotに遡及させていない。

| 配列index | PLAN完全ID | 固定PLAN blob OID | 固定blob bytes SHA-256 | この設計で保持する責務 |
| ---: | --- | --- | --- | --- |
| 423 | `PLAN-L7-479-release-manifest-pf1-pure-domain` | `ad17d93a7b0c7b60535986bcac584269daa22be7` | `8d14c4945b1e3fc19af13ed4cd6c7cd01042a68f547cb29d92c376abfeceb3b6` | PF-1厳密parse、immutable release identity、own-key channel解決。`U-RELMAN-001/002/007/009/013`。 |
| 431 | `PLAN-L7-486-release-materializer-pf2` | `ed89055afc34a0a0464722c235a104bbf28fb57b` | `cc6e2cb2ab8a81d65d1924bd55ff7fa71a6e6796b2258ab2b3881f2a18ed1848` | PF-2 pure materialization、byte framing、version token境界。`U-RELMAN-011`。 |
| 432 | `PLAN-L7-487-isolated-git-artifact-resolver-pf3` | `13d5eddf9a9af025f2eea59cf5a1ccd8669063e4` | `14dfd7665b174ec4a7d7f81523ba7690a5bb4fde05f5997e3543bafe6a030243` | PF-3 local Git object解決とPF-2 port境界。`U-RELMAN-012`。 |
| 434 | `PLAN-L7-489-pf4-sync-pack-channel-adapter-pair-freeze` | `e06ec1170e866a98b4ca2e66ca997d45ab0969f4` | `aa38aa5c74ceefb84d86cec6956c14d38a575455ca83c6e01f9ecbbe7899fc36` | PF-4三値attestationとidentity/error境界。`U-RELMAN-006/018`。 |
| 438 | `PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze` | `1de44ab62e76e1ef9a16ccb38e95870e6fb29cfe` | `3363047f204afbcb1dd4fbf6b0a3e9b29dc8cdbf4ad52d136207b039800d73bb` | PF-5 v1 exactly-one mappingと既存sealed apply/rollback境界。`U-RELMAN-014..017`。 |
| 516 | `PLAN-L7-742-release-aggregate-v2-inventory-cardinality` | `dacd0cc30143ad0d40fc248cb677b3c983452c31` | `423f8300f05302251ffed16ba5f4eeeb85b266bc6ecfab68009e98dd8181a5b5` | PF-5 v2 ordered mapping/artifact cardinality、sealed entries path binding。`CANDIDATE-U-RELAGGV2-*`は正式`U-*`と区別する。 |

## PLANごとの依存・DoD・carryの追跡

以下は固定PLAN本文の義務と、現行の設計・実装・工程証跡を突き合わせた表である。区分案は後表に各PLANごと明示する。

| PLAN | 固定本文の requires / blocks | 固定本文の未達DoD・carry | 設計への写像と残る扱い |
| --- | --- | --- | --- |
| #479 PF-1（本文frontmatter 27–37行、Exit 104–108行） | `requires: []`、`blocks: []`。親は#473。`backprop_decision: not_required`の理由は、PF-1がfreeze済みpartitionのpure domain追加でL0–L6・外部仕様を変えず、副作用契約はPF-5 REDに残るため。 | 固定本文Exitは、5 candidateについて後続実装PRが実装test citationを同一commitで`U-RELMAN-*`へ昇格する工程を指定。本文のreview evidenceはPR #307 exact HEADのPASSを記録している。 | L6 §2.1–2.2（27–28行）に`parseReleaseManifest` / `resolveReleaseChannel`を保持し、対応oracleはL7 test-design 2158–2160行に存在する。実装名は`src/schema/release-manifest.ts:340,357`。後続昇格工程は固定本文上の記録であり、本証跡は新たな昇格・全体終了を主張しない。 |
| #486 PF-2（本文frontmatter 27–41行、Exit 159–170行） | `requires: [docs/plans/PLAN-L7-479-release-manifest-pf1-pure-domain.md]`、`blocks: []`。PF-1→PF-2の順序を保持する。backprop不要の理由は上流合流を`PLAN-REVERSE-473`が所有すること。 | review evidence 47–53行は当時のtargeted 30 testsと「その時点で」exact-HEAD CI/non-author closing未実施を記録。これは工程時点の歴史的スナップショットであり、現在の振る舞い義務ではない。 | L6 §3.1（62–73行）にpure materializerの入出力、framing、禁止するGit/worktree/network/writeを保持。実装`src/setup/release-materializer.ts:130`、test `tests/release-materializer.test.ts:53`、oracle `U-RELMAN-011`（L7 test-design 2175行）。過去のCI/review欄をL6/L7規範へ転記せず、このbackflowのための再CIも要求しない。 |
| #487 PF-3（本文frontmatter 27–41行、Exit 186–199行） | `requires: [docs/plans/PLAN-L7-486-release-materializer-pf2.md]`、`blocks: []`。PF-2→PF-3の順序を保持する。backprop不要の理由は上流合流を`PLAN-REVERSE-473`が所有すること。 | review evidence 47–52行は当時の8群targeted test・blocking 0と「その時点で」exact-HEAD CI/non-author closing未実施を記録。これは工程時点の歴史的スナップショットであり、現在の振る舞い義務ではない。 | L6 §3.2（75–87行）にlocal object解決、PF-2とのport責務、worktree/remote fallback/copy/write禁止を保持。実装`src/setup/release-artifact-resolver.ts:308`、test `tests/release-artifact-resolver.test.ts:97`、oracle `U-RELMAN-012`（L7 test-design 2176行）。過去のCI/review欄をL6/L7規範へ転記せず、このbackflowのための再CIも要求しない。 |
| #489 PF-4（本文frontmatter 31–41行、§0–4 67–117行） | `requires: [PLAN-L7-487-isolated-git-artifact-resolver-pf3]`、`blocks: []`。PF-3後にPF-4を置く。 | 固定review evidenceはPR #329 docs-only pair-freeze契約レビューを記録し、実装挙動/U-RELMAN-006実装検証を対象外として#330を別工程に指定した。#330はexact head `f75798ab76a24fdbfb6060fd48e1028042002c8f`で非著者PASS、CI run `32087980604`成功、merge済み。 | L6 §2.4、PF-4行（31行）に`attestReleaseChannel`の既存signature、三値、identity/digest照合と副作用境界を保持。実装`src/setup/release-channel-adapter.ts:60–90`、test `tests/release-channel-adapter.test.ts:109–148`、test-design 2163–2164行。後続PRで検証済みのため#330のclosing/CIは完了済み工程として剥離する。 |
| #492 PF-5 v1（本文frontmatter 30–42行、工程・境界135–149行） | `requires: [PLAN-L7-489-pf4-sync-pack-channel-adapter-pair-freeze]`、`blocks: []`。§3工程138行は実装PRが#489を`requires`へ束縛し、`PLAN-REVERSE-473` R3/R4 backfill対象にするよう要求。 | 固定本文に`backprop_decision: required`。後続#742訂正注記はv1 exactly-oneを不変にし、v2改訂を#742へ分離する。Reverse-473は本WT HEADでrev2 / `workflow_phase: R4` / `status: confirmed`。ただしR4のPF-5 advisory A-1–A-3は未完carryとして残る。 | L6 §4（32–33行）にv1 aggregate admission/applyと`U-RELMAN-014..017`を、v2と混ぜず保持。実装`src/setup/release-aggregate-admission.ts:237,305`、直接test `tests/release-aggregate-admission.test.ts:394,617`、oracle表2178–2181行。A-1（attested後identity再照合）/A-2（cleanup・restore失敗時`indeterminate`）/A-3（snapshot destination境界）はL6 §1（22行）と§6（117行以降）でPF-5の追加mutationが必要と明示され、L7 test-design `:2218–2220`ではgreen化まで未完了と保持される。義務はPLANだけに残っていないが、完了・廃止は主張しない。 |
| #742 PF-5 v2（本文frontmatter 14–18, 31–49, 92–129行、§2–7 180–390行） | `requires`: #492、#494、#499、#628。`blocks`: #531。WT HEADの各対象PLANは`status: confirmed`。これらの関係は履行済み工程順であり、各PLANが所有する別契約をこのL6へ取り込まない。 | backprop required。§2.3はpromotion/rollback責務を#494およびL6-102へ、§2.4はcanary-channel判定を別findingへ分離。§3/§4は変更対象・非対象を限定。AC 1–9（343–357行）は候補oracle Red/Green、M1–M7、回帰、finding enum不変、destination単一正本、変更外file不変、#492/#494訂正とdoctor、非著者closing、Reverse-742 R4が対象。§7（359–370行）はS1→S2→S3と#531 PR-1の順序を要求。候補`CANDIDATE-U-RELAGGV2-001..009`を正式`U-*`へ読み替えない。 | L6 §8（128–198行）にordered equality、`entries[].path`を単一destination正本とする契約、v1不変を保持。直接test `tests/release-aggregate-admission.test.ts:218–337`。AC1–9は下表で個別判定する。Reverse-742 R4は本WT HEADのPLAN `workflow_phase: R4` / `status: confirmed` / `backprop_decision: not_required`（frontmatter 14–18, 45行、本文132–143行）であり、未解決carryではなく完了済み工程記録。L6-102の単数表現は軽微な文言gapとして次回所有者改訂へroutingされ、新たな意味変更は要求されていない。 |

## authorによるdisposition区分案と未達carryの決定

| PLAN | 区分案 | 理由・依存の扱い |
| --- | --- | --- |
| #479 PF-1 | 使い捨て可 | PF-1の5 candidateはPR #307で実装test citation付きの正式`U-RELMAN-001/002/007/009/013`へ昇格済み。parse/channel契約はL6 §2.1–2.2に保持。PF-2より前という依存順は完了済み工程で剥離する。 |
| #486 PF-2 | 使い捨て可 | L6 §3.1、`U-RELMAN-011`、現行materializer/testが契約を保持。fixed PLANに残るpair-freeze時点のclosing pendingは後続PR #315で解消され、非著者PASS exact `aa38cc6736b865a9796e48ff093dbccc68fc55f6`、CI `31769172343`、PR mergeを確認した。#479 `requires`は履行済み順序として剥離。 |
| #487 PF-3 | 要判断 | L6 §3.2、`U-RELMAN-012`、現行resolver/testへの規範還流は済み。PR #320のclosing PASS/CIは`bdda726a900a06ea90c78a6016d6861bbe78334d`に対するもの。その後のmerge-conflict解消HEAD `35b808c8c2eb4b9f5a211f370f8dd4f137ce5b12`について、PRコメントはCodex delta reviewを依頼し「CI greenとdelta review後にmerge」と記す。PRはmerge済みだが、確認したコメントに新HEAD delta PASSはなく、固定PLANにも残存gate記録がある。過去PASSをdeltaへ流用しない。controlが既存custodyでdelta PASSを確認できるまでは、機能契約は還流済みでもPLAN記録自体は捨てない。 |
| #489 PF-4 | 使い捨て可 | L6 function table PF-4 row（31行）、正式`U-RELMAN-006/018`、実装/testが三値・identity/digest・port境界を保持。PR #330はexact `f75798ab76a24fdbfb6060fd48e1028042002c8f`で非著者PASS、CI `32087980604`、mergeを確認。PR時のadvisoryに挙がったidentity drift/throw/typed reasonも現行test `tests/release-channel-adapter.test.ts:109–148`で確認でき、残存DoDではない。#487 `requires`とPF-5開始順は履行済み工程として剥離。 |
| #492 PF-5 v1 | 使い捨て可 | v1 exactly-oneと既存apply/rollbackはL6 §4–5および§8.1に維持。v2前提だけは#742が部分置換し、v1全体の廃止ではない。Reverse-473は現HEADでR4 confirmedだが、A-1–A-3は未実装carryとしてL6 §1/§6とL7 2218–2220に明示保持される。未達carryを完了扱いせず設計へ移しているため、#492自体は使い捨て可と提案する。 |
| #742 PF-5 v2 | 要判断 | v2契約はL6 §8.1–8.3に保持され、`#492/#494/#499/#628 requires`と`#531 blocks`は本WT HEADでconfirmedのため工程依存は剥離候補。AC2のM1–M7はPR #751 bodyのexact-head mutation packetで確認できる。一方、AC1のcandidate単位Red/Green全件とAC7の`doctor plan-supersession`固有実行結果は未確認である。該当する歴史artifactのcustodyを確認できるまでは#742全体を使い捨て可としない。未完A-1–A-3は別途Reverse-473 carryとして保持。 |

### #742 AC 1–9 の個別判定

| AC | 判定 | L6への保持 / 剥離根拠 |
| ---: | --- | --- |
| 1 | 未確認の歴史証拠・要判断 | 固定PLAN `docs/plans/PLAN-L7-742-release-aggregate-v2-inventory-cardinality.md@3ca0692d6c6a180b058c492475080be2a140e667` §6 AC1はpositive 001/002/007の実装前Redと、positive fixture成立後のnegative Greenを要求する。全9候補を実装前Redにする要求ではない。[PR #751 review packet](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/751)は初回18 fail/81 passを記録するが、002にはfixture cleanup不備が含まれ、全failを契約Redとは主張していない。既存Memoryのaggregate/consumer/promotion Red要約だけでは指定positiveとの対応を全件確認できない。AT-DIST-001の別CI Redを代用せず、指定positive Redと後続negative Greenの対応履歴を確認するまで充足・剥離可とはしない。現在のv2契約はL6 §8.1–8.3に保持。 |
| 2 | 充足済みの歴史的mutation証拠として剥離 | 固定PLAN `docs/plans/PLAN-L7-742-release-aggregate-v2-inventory-cardinality.md@3ca0692d6c6a180b058c492475080be2a140e667` §5 M1–M7/§6 AC2と照合。PR #751 body（[review packet](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/751)）はexact d19c1c26の独立clone `C:/dev/_harness-temp/issue742-mutation-atLAdA/results.json` を記録し、unique9未変異probe全pass後、8 mutants/11 probesが全て対象assertionをRedにしたと列挙する: M1a→001/002、M1b→007、M2→003(d,e)/008(a-f)、M3→008(a,b,e)、M4a→005(b)、M4b→008(f)、M5→004(a-c)、M6→008(g)、M7→009(b)。各失敗は対象assertionで、compile/import/timeout由来ではなく、source byte復元も記録済み。これはd19c1c26に束縛された一回限りのmutation証拠であり、後続4d270902への実行Greenとは扱わない。未達carry A-1–A-3とは別。
| 3 | 充足済み回帰証拠として剥離 | 固定PLAN §6 AC3の対象に対し、[PR #751 review packet](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/751)はexact d19c1c26のcanonical session52801でaggregate22、consumer-local41、promotion/rollback15、producer/installer21、physical runtime7の計106テスト成功、fence/cleanup後exit0を記録する。後続4d2709028a18bf0d65fc3ec9fadaa9676a78f23aは配布acceptance fixtureのみを訂正し、同ファイル8/8成功と[CI run36546882004](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/36546882004)へ接続する。d19の実走を4dの同一実走とはせず、generic doctor結果もtest証拠に読み替えない。現在の意味はL6 §§2–8に保持。 |
| 4 | 充足済み範囲証拠として剥離 | `ReleaseAggregateFinding` enum不変はPR差分条件であり、設計上のruntime義務ではない。L6 §8.1は既存`missing_channel_mapping`/`invalid_artifact`を保持する。 |
| 5 | **規範carryとして保持** | v2 sealed planにscalar/parallel destination記録を許さず`entries[].path`だけを正本にする。L6 §8.2–8.3が保持し、promotion/rollback shapeも同一正本へ束縛する。 |
| 6 | 充足済み差分scope証拠として剥離 | CLI distribution / setup index / consumer runtime releaseのdiff 0はS2のbounded path条件であり、後続の不変要件ではない。外部publish/CLIをこのL6関数責務へ混入しない境界は§1/§5に残る。 |
| 7 | 未確認の歴史証拠・要判断 | #492/#494訂正注記は固定PLAN `docs/plans/PLAN-L7-742-release-aggregate-v2-inventory-cardinality.md@3ca0692d6c6a180b058c492475080be2a140e667` §7.1–7.2に存在する。一方、本WT HEADのPLAN `review_evidence[0].green_commands[0]`はgeneric `node src/cli.ts doctor --strict-green-command-digest --result-file ...`であり、`doctor plan-supersession`の実行結果ではない。PR #751のCI run `36546882004`もその固有subcommandを直接証明しない。既存の具体的なsubcommand実行artifactを確認できるまで未確認として保持し、generic doctor GreenをAC7充足に読み替えない。
| 8 | 充足済みreview証拠として剥離 | merge head `4d2709028a18bf0d65fc3ec9fadaa9676a78f23a`への非著者Opus exact-head PASSは、本WT HEADの固定PLAN `docs/plans/PLAN-L7-742-release-aggregate-v2-inventory-cardinality.md` frontmatter `review_evidence[0]`（subject_head一致、verdict pass、2026-09-29T10:55:46Z）に記録される。対応CIはPR #751 [run 36546882004](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/36546882004)でLinux/Windows success。レビュー再実行・L6転記は不要。
| 9 | 充足済みReverse工程証拠として剥離。ただしA-1–A-3は未完carry | Reverse-742は本WT HEADでR4/confirmed/`backprop_decision: not_required`。R4 routing outcomeとv2契約はL6 §8.1–8.3に保持。一方Reverse-473 A-1–A-3は別の未実装義務としてL6 §1/§6およびL7 2218–2220に残り、R4や#742完了から達成を推定しない。 |

この判定では「未確認事項なし」とはしない。#487はPR #320の新HEAD delta-review custody、#742はAC1/AC7の歴史artifactが未確認のため要判断として保持する。AC2のmutation履歴は確認済みである。これらの未確認履歴を実施済みと捏造せず、現行機能規範の不足とも混同しない。#492のPF-5 A-1–A-3は正規設計へ明記された未完carryであり、新しい機能・test実装を本還流の条件に追加しない。

## L6設計・oracle・実装・testの対応

- PF-1は`release-channel-manifest.md:27–28`にあり、実際のAPI名は`parseReleaseManifest`と`resolveReleaseChannel`。固定実装は`src/schema/release-manifest.ts:340,357`、直接testは`tests/release-manifest.test.ts`、oracle行は`docs/test-design/harness/L7-unit-test-design.md:2158–2160`。候補要約に現れる実在しない`parseCanonicalReleaseManifest`へ読み替えない。
- PF-2はL6 `:29`および§3.1 `:62–73`、`U-RELMAN-011`はL7 test-design `:2175`。APIは`src/setup/release-materializer.ts:130`、suiteは`tests/release-materializer.test.ts:53`。pure変換以外のGit読取・worktree/network・writeはその責務に加えない。
- PF-3はL6 `:30`および§3.2 `:75–87`、`U-RELMAN-012`はL7 test-design `:2176`。APIは`src/setup/release-artifact-resolver.ts:308`、suiteは`tests/release-artifact-resolver.test.ts:97`。PF-2 materialization、PF-3 object解決、PF-4 digest attestationを別責務として保つ。
- PF-4は`src/setup/release-channel-adapter.ts:60–90`と`tests/release-channel-adapter.test.ts:57`で照合。L7 test-design `:2163–2164`は`U-RELMAN-006/018`をPF-4/#489に割り当てる。L6へ既存API signatureと状態を追加し、新oracleや呼出必須条件は作らない。
- PF-5 v1はL6 `:32–33`、oracle `:2178–2181`。APIは`src/setup/release-aggregate-admission.ts:237,305`、直接検証箇所は`tests/release-aggregate-admission.test.ts:394,617`。v1 exactly-oneをv2 cardinalityへ置換しない。
- PF-5 v2はL6 §8 `:128–198`。固定source predicateは`src/setup/release-aggregate-admission.ts:126–141`、sealingは`:237–301`。直接test `tests/release-aggregate-admission.test.ts:218–337`は候補IDを含む。`CANDIDATE-U-RELAGGV2-*`を正式`U-*` oracleへ昇格したとは扱わない。

## 責務誤対応の訂正と除外境界

従前のL6表は`applySealedReleaseAggregate`に`U-RELMAN-017`と`U-RELMAN-018`の両方を割り当てていた。しかし固定L7 test-design `:2164`では`U-RELMAN-018`は#489 PF-4 adapter hardening、`:2181`では`U-RELMAN-017`はPF-5 apply/fault/restoreである。今回のL6差分はPF-4行へ既存の`attestReleaseChannel`と`U-RELMAN-006/018`を割り当て、apply行を`U-RELMAN-017`だけにする責務訂正である。新しいtest-design行・source挙動・oracleは追加していない。

隣接#473はS1契約freezeであり、ここで扱う6件へ含めない。#499/#500/#508/#515/#565もexact設計所有先を確立していないため混ぜない。author案は4件を「使い捨て可」、#487/#742の2件を「要判断」とし、根拠・残件を上表に限定した。最終破棄操作や全体release完了は宣言しない。未確認の歴史custodyの最終採択はcontrolが行い、設計に保持したReverse-473 A-1–A-3を実装済みとは扱わない。
