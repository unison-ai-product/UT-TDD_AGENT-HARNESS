import { join } from "node:path";

const GENERATED_BY = "ut-tdd-handover";
const HANDOVER_DIR = join(".ut-tdd", "handover");
const POINTER_PATH = join(HANDOVER_DIR, "CURRENT.json");
const PLAN_DIGEST_DIR = join(".ut-tdd", "logs", "plan");
const CURRENT_PLAN_REL = join(".ut-tdd", "state", "current-plan");

export { CURRENT_PLAN_REL, GENERATED_BY, HANDOVER_DIR, PLAN_DIGEST_DIR, POINTER_PATH };
