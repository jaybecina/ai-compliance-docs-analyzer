import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function askClaude(prompt: string) {
  const response = await anthropic.messages.create({
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
