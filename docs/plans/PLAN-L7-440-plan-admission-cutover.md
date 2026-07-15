---
plan_id: PLAN-L7-440-plan-admission-cutover
title: "PLAN-L7-440 (add-impl): PLAN Admission保護main epoch cutover"
kind: add-impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-15
updated: 2026-07-15
owner: PO / Codex / Claude
parent_design: docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - protected-main ceiling・inventory・activation verifier"
  - role: qa
    slot_label: "QA - genesis/commit-edge/merge-parent/pre-push parity oracle"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-L7-440-plan-admission-cutover.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/plan-admission-activation.json
    artifact_type: json_config
  - artifact_path: docs/governance/plan-admission-migration-inventory.json
    artifact_type: json_config
  - artifact_path: docs/governance/plan-admission-cutover-receipt.json
    artifact_type: json_config
  - artifact_path: .github/workflows/harness-check.yml
    artifact_type: github_config
  - artifact_path: scripts/git-hooks/pre-push
    artifact_type: hook
  - artifact_path: tests/plan-admission-cutover.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
  requires:
    - docs/plans/PLAN-L7-435-drive-plan-admission-impl.md
    - docs/plans/PLAN-L7-441-plan-draft-recovery-v4.md
  references:
    - docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
    - docs/plans/PLAN-L7-435-drive-plan-admission-impl.md
    - docs/plans/PLAN-L7-441-plan-draft-recovery-v4.md
  blocks: []
---

# PLAN-L7-440: PLAN Admission保護main epoch cutover

## 目的

`PLAN-L7-435`でlandingしたAdmission engine、draft Saga、receipt projection、Git blob検査を、
保護mainを信頼境界にしてhook、pre-push、PR CIへ強制接続する。導入PRの作者が任意のfeature branch
commitをlegacy ceilingに指定できないよう、engine landingとenforcement activationを別PR・別検収にする。

## Genesis契約

0. live GitHub APIからrepository ID、default branch、main SHA、protection/ruleset ID、required PR review、
   required status check、force-push/delete禁止、admin bypass方針を正規化したprotection snapshotを取得する。
   `protected=false`、`unknown`、403、必須control欠落はhard stopし、inventory、activation、receipt、projectionを
   1 byteも生成しない。
1. `PLAN-L7-435`をPO/Claude検収でmainへmergeする。
2. protection有効化後の最新保護main `C0`からfresh `add/plan-admission-cutover` branchを作る。過去の未保護履歴を
   遡及的にtrusted扱いせず、`C0`全量inventoryとPO/Claude bootstrap attestationを新たな信頼起点にする。
3. G0で観測したmain SHA、`C0`、cutover PR baseを一致させ、`C0`のcommit SHA、tree SHA、
   全`docs/plans/PLAN-*.md`のpath、plan ID、Git blob OID、
   canonical content digestを決定論的inventoryへexactly onceで記録する。
4. activation、inventory、cutover receipt、genesis projectionを同一transitionで生成し、相互digestと
   protection snapshot digestを束縛する。
5. genesis transition内で変更するPLANはlegacy inventoryで免除せず、通常の`plan draft` receiptを必須にする。
6. genesis検証Greenとcross-family review後にだけworkflowとpre-pushをenforcedへ切り替える。

path/PLAN/PR番号の一般allowlistは作らない。ceiling時点と同一blobだけをlegacy baselineとして保持し、
ceiling後の1 byte変更、rename、deleteは通常Admissionへ送る。activation artifactとinventoryはlanding後immutableとし、
downgrade、削除、ceiling差替えをfail-closeする。

## 検査範囲

- PR CIはbase/head最終差分だけでなく`base..head`の全commit edgeを検査する。
- merge commitは全parentからmerge commitへのedgeを検査し、second-parent経由の洗浄を拒否する。
- pre-pushはCIと同じcommit列・同じepoch判定を再利用する。
- PR CIはlive protection snapshotを再取得し、生成時からの無効化、ruleset drift、観測SHAとPR baseの不一致を
  fail-closeする。API取得不能を「変更なし」と解釈しない。
- local SQLiteのunfinished journalはfresh CIから観測不能である。CIはtracked tree、receipt projection、
  recovery-clearance projectionを検証し、local journal gateはsession start/pre-pushが担当する。

## AC

- [ ] ceiling SHA/treeが保護mainのPR baseと一致し、feature branch任意commitをceilingにできない。
- [ ] `protected=false` / `unknown` / 403 / required control不足では副作用0でRedになる。
- [ ] protection snapshotの観測SHA=`C0`=PR baseであり、そのdigestをcutover receiptへ束縛する。
- [ ] PR CI再検査でprotection無効化・ruleset drift・SHA driftをRedにする。
- [ ] inventoryが`C0`のPLAN集合と欠落・余剰・重複・digest差0で一致する。
- [ ] activation/inventory/cutover receipt/projectionの相互digestが一致する。
- [ ] genesis内PLAN変更、activation後変更、rename、delete、後続commit洗浄をfail-closeする。
- [ ] merge全parent、pre-push、CIが同じcommit edgeに同じfindingを返す。
- [ ] PO/Claude cross-review証拠とbranch protectionをissuer authenticity境界として記録する。

## Red oracle

inventory欠落/余剰/順序差、ceiling SHA/tree偽装、activation単独、receipt単独、projection単独、
legacy blob変更、rename/delete、後続commitでのreceipt洗浄、merge second-parent持込み、activation downgradeを
各一項変異でRedにする。protection false/403/部分保護、観測SHA不一致、ruleset driftはartifact副作用0でRedにする。
protection gate、ceiling ancestry、完全集合比較、全parent検査、immutability検査を削るmutationをsurvivor 0にする。
