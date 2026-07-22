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

  it("U-RGK-NATIVE-003: pins Rust and binds both native OS gates into the aggregate", () => {
    const toolchain = readFileSync(resolve("rust-toolchain.toml"), "utf8");
    const workflow = readFileSync(resolve(".github/workflows/harness-check.yml"), "utf8");

    expect(toolchain).toContain('channel = "1.97.1"');
    expect(toolchain).toContain('components = ["clippy", "rustfmt"]');
    for (const leg of ["resource-kernel-rust-linux", "resource-kernel-rust-windows"]) {
      expect(workflow).toContain(`${leg}:`);
      expect(workflow).toContain(`needs.${leg}.result`);
    }
    expect(workflow.match(/cargo fmt --all --check/g)).toHaveLength(2);
    expect(
      workflow.match(/cargo clippy --workspace --all-targets --locked -- -D warnings/g),
    ).toHaveLength(2);
    expect(workflow.match(/cargo test --workspace --all-targets --locked/g)).toHaveLength(2);
    expect(workflow.match(/Cargo\.lock/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
