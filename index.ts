import { generateText } from "ai";
import * as fs from "node:fs";
import * as path from "node:path";

// Load .env.local if running standalone script
if (!process.env.AI_GATEWAY_API_KEY) {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

async function main() {
  const { text } = await generateText({
    model: "moonshotai/kimi-k3" as any,
    prompt: "Invent a new holiday and describe its traditions.",
  });

  console.log(text);
}

main().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});

