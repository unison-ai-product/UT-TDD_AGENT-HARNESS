import { vi } from "vitest";

export const runtimePointerIo = vi.hoisted(() => ({
  enabled: false,
  failRenameWithEperm: false,
  failPointerModeRestore: false,
  restorePointerMode: 0,
  renameEpermRaised: false,
  failPointerFsync: false,
  pointerRenameCompleted: false,
  failBundleCleanup: false,
  activePointerPath: "",
  priorBundlePath: "",
  renameCalls: [] as Array<{ source: string; destination: string; before: string; after: string }>,
  cleanupCalls: [] as string[],
  tempWrites: [] as string[],
  directWrites: [] as string[],
  observations: [] as string[],
}));

export function createRuntimeUpdateFsSpy(actual: typeof import("node:fs")) {
  const normalized = (path: unknown) => String(path).replaceAll("\\", "/");
  const observe = () => {
    if (runtimePointerIo.enabled && actual.existsSync(runtimePointerIo.activePointerPath))
      runtimePointerIo.observations.push(
        actual.readFileSync(runtimePointerIo.activePointerPath, "utf8"),
      );
  };
  return {
    ...actual,
    writeFileSync: (...args: Parameters<typeof actual.writeFileSync>) => {
      const target = normalized(args[0]);
      if (runtimePointerIo.enabled) {
        if (target === normalized(runtimePointerIo.activePointerPath))
          runtimePointerIo.directWrites.push(target);
        if (/\/\.active-[^/]+\.tmp$/.test(target)) {
          runtimePointerIo.tempWrites.push(target);
          observe();
        }
      }
      const result = actual.writeFileSync(...args);
      if (
        runtimePointerIo.enabled &&
        (target === normalized(runtimePointerIo.activePointerPath) ||
          /\/\.active-[^/]+\.tmp$/.test(target))
      )
        observe();
      return result;
    },
    truncateSync: (...args: Parameters<typeof actual.truncateSync>) => {
      if (
        runtimePointerIo.enabled &&
        normalized(args[0]) === normalized(runtimePointerIo.activePointerPath)
      )
        runtimePointerIo.directWrites.push(normalized(args[0]));
      return actual.truncateSync(...args);
    },
    openSync: (...args: Parameters<typeof actual.openSync>) => {
      const flags = args[1];
      const writes =
        typeof flags === "string"
          ? /[wax+]/.test(flags)
          : (Number(flags) & (actual.constants.O_WRONLY | actual.constants.O_RDWR)) !== 0;
      if (
        runtimePointerIo.enabled &&
        writes &&
        normalized(args[0]) === normalized(runtimePointerIo.activePointerPath)
      )
        runtimePointerIo.directWrites.push(normalized(args[0]));
      return actual.openSync(...args);
    },
    appendFileSync: (...args: Parameters<typeof actual.appendFileSync>) => {
      if (
        runtimePointerIo.enabled &&
        normalized(args[0]) === normalized(runtimePointerIo.activePointerPath)
      )
        runtimePointerIo.directWrites.push(normalized(args[0]));
      return actual.appendFileSync(...args);
    },
    chmodSync: (...args: Parameters<typeof actual.chmodSync>) => {
      if (
        runtimePointerIo.enabled &&
        runtimePointerIo.failPointerModeRestore &&
        runtimePointerIo.renameEpermRaised &&
        normalized(args[0]) === normalized(runtimePointerIo.activePointerPath) &&
        Number(args[1]) === runtimePointerIo.restorePointerMode
      )
        throw Object.assign(new Error("injected active pointer mode restore failure"), {
          code: "EPERM",
        });
      return actual.chmodSync(...args);
    },
    fsyncSync: (...args: Parameters<typeof actual.fsyncSync>) => {
      if (
        runtimePointerIo.enabled &&
        runtimePointerIo.failPointerFsync &&
        runtimePointerIo.pointerRenameCompleted
      ) {
        runtimePointerIo.failPointerFsync = false;
        throw Object.assign(new Error("injected post-publication fsync failure"), { code: "EIO" });
      }
      return actual.fsyncSync(...args);
    },
    renameSync: (...args: Parameters<typeof actual.renameSync>) => {
      const source = normalized(args[0]);
      const destination = normalized(args[1]);
      if (
        runtimePointerIo.enabled &&
        destination === normalized(runtimePointerIo.activePointerPath)
      ) {
        observe();
        const before = actual.existsSync(destination)
          ? actual.readFileSync(destination, "utf8")
          : "";
        if (runtimePointerIo.failRenameWithEperm) {
          runtimePointerIo.renameEpermRaised = true;
          runtimePointerIo.renameCalls.push({ source, destination, before, after: before });
          throw Object.assign(new Error("injected active pointer EPERM"), { code: "EPERM" });
        }
        const result = actual.renameSync(...args);
        runtimePointerIo.pointerRenameCompleted = true;
        const after = actual.readFileSync(destination, "utf8");
        runtimePointerIo.renameCalls.push({ source, destination, before, after });
        observe();
        return result;
      }
      return actual.renameSync(...args);
    },
    rmSync: (...args: Parameters<typeof actual.rmSync>) => {
      const target = normalized(args[0]);
      if (
        runtimePointerIo.enabled &&
        runtimePointerIo.failBundleCleanup &&
        target.includes("/.ut-tdd/runtime/bundles/") &&
        target !== normalized(runtimePointerIo.priorBundlePath)
      ) {
        runtimePointerIo.cleanupCalls.push(target);
        throw Object.assign(new Error("injected new bundle cleanup EPERM"), { code: "EPERM" });
      }
      return actual.rmSync(...args);
    },
  };
}
