import type { z } from "zod";
import { programSectionJsonSchema } from "@/lib/schema";
import { getAnthropicClient, MODEL_ID } from "@/lib/generate/client";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface StructuredCallResult<T> {
  data: T;
  usage: TokenUsage;
}

/**
 * One tool-use call forced to a single tool, whose input is parsed through the
 * caller's Zod schema. `strict` mode only accepts a very restricted schema subset
 * (no `minimum`, no `exclusiveMinimum`), so we don't set it — Zod does the real
 * validation on the way back instead of trusting the API's schema enforcement.
 */
export async function callStructured<T>(opts: {
  toolName: string;
  description: string;
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
}): Promise<StructuredCallResult<T>> {
  const client = getAnthropicClient();
  const inputSchema = programSectionJsonSchema(opts.schema);

  const response = await client.messages.create({
    model: MODEL_ID,
    max_tokens: 8192,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
    tools: [
      {
        name: opts.toolName,
        description: opts.description,
        input_schema: inputSchema,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(`Model did not return a tool_use block for "${opts.toolName}"`);
  }

  const data = opts.schema.parse(toolUse.input);

  return {
    data,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}
