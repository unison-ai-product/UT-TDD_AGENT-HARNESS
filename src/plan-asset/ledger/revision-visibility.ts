/**
 * v8 authoring groupへ束縛されたrevisionはgroup committedまでreaderから不可視にする。
 * bindingのないv7以前のrevisionは互換性のためvisibleである。
 */
export function committedRevisionPredicate(alias: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(alias)) throw new Error("revision alias invalid");
  return `NOT EXISTS (
    SELECT 1 FROM authoring_command_revision_bindings pending_binding
    WHERE pending_binding.asset_id = ${alias}.asset_id
      AND pending_binding.revision = ${alias}.revision
      AND NOT EXISTS (
        SELECT 1 FROM authoring_command_group_phase_events committed_phase
        WHERE committed_phase.group_id = pending_binding.group_id
          AND committed_phase.event_kind = 'committed'
      )
  )`;
}
