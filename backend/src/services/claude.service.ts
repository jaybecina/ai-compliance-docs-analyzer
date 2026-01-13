import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | null = null;

export function isClaudeConfigured() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return Boolean(apiKey && apiKey.trim());
}

function getAnthropic() {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Claude is not configured (missing ANTHROPIC_API_KEY).");
  }
  cached = new Anthropic({ apiKey: apiKey.trim() });
  return cached;
}

export async function askClaude(prompt: string) {
  const response = await getAnthropic().messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 800,
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }],
  });

  const firstBlock = response.content[0];
  if (firstBlock.type === "text") {
    return firstBlock.text;
  }
  throw new Error("Unexpected response type from Claude");
}

export async function tryAskClaude(prompt: string) {
  if (!isClaudeConfigured()) return null;
  return askClaude(prompt);
}
