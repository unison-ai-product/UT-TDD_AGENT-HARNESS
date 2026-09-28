import YAML from "yaml";
import { readGateAssetText } from "../../lint/gate-confirm.ts";
import {
  type CompiledRightArmRegistry,
  compileRightArmContract,
} from "../application/contract-compiler.ts";

export const VMODEL_CONTRACT_PATH = "docs/process/vmodel-contract.yaml";

export function loadCompiledRightArmRegistry(repoRoot = process.cwd()): CompiledRightArmRegistry {
  const source = readGateAssetText(repoRoot, VMODEL_CONTRACT_PATH);
  return compileRightArmContract(YAML.parse(source));
}
