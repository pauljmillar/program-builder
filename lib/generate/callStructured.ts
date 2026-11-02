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

const RETRY_NUDGE =
  "\n\nCall the tool now with your best answer. Don't respond with plain text, and don't decline — " +
  "make a reasonable assumption for anything the description doesn't specify.";

/**
 * One tool-use call forced to a single tool, whose input is parsed through the
 * caller's Zod schema. `strict` mode only accepts a very restricted schema subset
 * (no `minimum`, no `exclusiveMinimum`), so we don't set it — Zod does the real
 * validation on the way back instead of trusting the API's schema enforcement.
 *
 * Retries once if the model responds without calling the tool at all (observed on
 * very vague prompts and on unresolvable repair requests — see build log).
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

  async function attempt(prompt: string) {
    const response = await client.messages.create({
      model: MODEL_ID,
      max_tokens: 8192,
      system: opts.system,
      messages: [{ role: "user", content: prompt }],
      tools: [
        {
          name: opts.toolName,
          description: opts.description,
          input_schema: inputSchema,
        },
      ],
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    const usage: TokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };

    return { toolUse: toolUse?.type === "tool_use" ? toolUse : null, usage };
  }

  const first = await attempt(opts.prompt);
  const final = first.toolUse ? first : await attempt(opts.prompt + RETRY_NUDGE);

  const usage: TokenUsage = {
    inputTokens: first.usage.inputTokens + (first.toolUse ? 0 : final.usage.inputTokens),
    outputTokens: first.usage.outputTokens + (first.toolUse ? 0 : final.usage.outputTokens),
  };

  if (!final.toolUse) {
    throw new Error(`Model did not return a tool_use block for "${opts.toolName}" after a retry`);
  }

  const data = opts.schema.parse(final.toolUse.input);

  return { data, usage };
}
