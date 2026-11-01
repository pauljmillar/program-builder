import fs from "node:fs";
import path from "node:path";

export function loadPrompt(version: string, name: string): string {
  return fs.readFileSync(path.join(process.cwd(), "lib", "prompts", version, `${name}.md`), "utf8");
}
