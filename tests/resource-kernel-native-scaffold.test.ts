import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const nativeRoot = resolve("native/resource-kernel");

describe("resource-kernel native companion scaffold", () => {
  it("U-RGK-NATIVE-001: exposes a versioned JSON handshake crate", () => {
    const workspace = readFileSync(resolve(nativeRoot, "Cargo.toml"), "utf8");
    const manifest = readFileSync(
      resolve(nativeRoot, "resource-kernel-companion/Cargo.toml"),
      "utf8",
    );
    const source = readFileSync(
      resolve(nativeRoot, "resource-kernel-companion/src/lib.rs"),
      "utf8",
    );

    expect(workspace).toContain('members = ["resource-kernel-companion"]');
    expect(manifest).toContain('serde_json = "1"');
    expect(source).toContain("pub const PROTOCOL_VERSION: u16 = 1;");
    expect(source).toContain("pub struct HandshakeRequest");
    expect(source).toContain("pub struct HandshakeResponse");
  });

  it("U-RGK-NATIVE-002: keeps unsupported custody fail-closed before launch", () => {
    const source = readFileSync(
      resolve(nativeRoot, "resource-kernel-companion/src/lib.rs"),
      "utf8",
    );

    expect(source).toContain("pub struct UnsupportedAdapter;");
    expect(source).toContain("process_created: false");
    expect(source).toContain("Capability::AtomicAttachBeforeUserCode");
    expect(source).toContain("Capability::TreeEmptyProof");
    expect(source).not.toContain("CreateJobObject");
    expect(source).not.toContain("clone3(");
  });
});
