import { join } from "node:path";
import { buildRegistry } from "./registry-lib.ts";

const root = join(import.meta.dirname, "..");
const index = buildRegistry(join(root, "src/modules"), join(root, "public/r"));
console.log(`✓ registro: ${index.length} módulo(s) en public/r/`);
