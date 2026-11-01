export interface MoneyMention {
  amount: number;
  index: number;
  raw: string;
}

const MONEY_REGEX = /\$\s?([\d,]+(?:\.\d+)?)\s*(k|m|thousand|million)?\b/gi;

function normalizeAmount(numStr: string, suffix?: string): number {
  let amount = parseFloat(numStr.replace(/,/g, ""));
  const s = suffix?.toLowerCase();
  if (s === "k" || s === "thousand") amount *= 1_000;
  if (s === "m" || s === "million") amount *= 1_000_000;
  return amount;
}

export function extractMoneyMentions(text: string): MoneyMention[] {
  const mentions: MoneyMention[] = [];
  const regex = new RegExp(MONEY_REGEX);
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text))) {
    mentions.push({
      amount: normalizeAmount(match[1], match[2]),
      index: match.index,
      raw: match[0],
    });
  }
  return mentions;
}

function contextAround(text: string, index: number, rawLength: number, radius = 40): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + rawLength + radius);
  return text.slice(start, end).toLowerCase();
}

export interface PromptExpectations {
  fundingTotal?: number;
  awardMin?: number;
  awardMax?: number;
}

/**
 * Pulls the dollar figures a prompt actually asked for, so the checker can compare
 * them against what the model generated (the PROMPT_CONFLICT rule). Heuristic, not
 * a full parser: it covers "up to $X", "$X–$Y" ranges, "N awards of $X", and "$X total/fund".
 */
export function extractPromptExpectations(prompt: string): PromptExpectations {
  const result: PromptExpectations = {};
  // Index ranges already claimed by an award-amount match, so the fundingTotal
  // scan below doesn't reinterpret the same "$25,000" as the fund total just
  // because an unrelated "fund" appears within its context window.
  const claimedRanges: Array<[number, number]> = [];

  const upToMatch = /up to\s*\$\s?([\d,]+(?:\.\d+)?)\s*(k|m|thousand|million)?/i.exec(prompt);
  if (upToMatch) {
    result.awardMax = normalizeAmount(upToMatch[1], upToMatch[2]);
    claimedRanges.push([upToMatch.index, upToMatch.index + upToMatch[0].length]);
  }

  const rangeMatch =
    /\$\s?([\d,]+(?:\.\d+)?)\s*(k|m)?\s*(?:[-–]|to)\s*\$\s?([\d,]+(?:\.\d+)?)\s*(k|m)?/i.exec(prompt);
  if (rangeMatch) {
    result.awardMin = normalizeAmount(rangeMatch[1], rangeMatch[2]);
    result.awardMax = normalizeAmount(rangeMatch[3], rangeMatch[4]);
    claimedRanges.push([rangeMatch.index, rangeMatch.index + rangeMatch[0].length]);
  }

  const fixedAwardMatch = /(\d+)\s+awards?\s+of\s+\$\s?([\d,]+(?:\.\d+)?)\s*(k|m)?/i.exec(prompt);
  if (fixedAwardMatch) {
    const count = parseInt(fixedAwardMatch[1], 10);
    const amount = normalizeAmount(fixedAwardMatch[2], fixedAwardMatch[3]);
    result.awardMin = result.awardMin ?? amount;
    result.awardMax = result.awardMax ?? amount;
    if (!result.fundingTotal) result.fundingTotal = count * amount;
    claimedRanges.push([fixedAwardMatch.index, fixedAwardMatch.index + fixedAwardMatch[0].length]);
  }

  if (!result.fundingTotal) {
    for (const mention of extractMoneyMentions(prompt)) {
      const mentionEnd = mention.index + mention.raw.length;
      const isClaimed = claimedRanges.some(([start, end]) => mention.index < end && mentionEnd > start);
      if (isClaimed) continue;

      const ctx = contextAround(prompt, mention.index, mention.raw.length);
      if (/\bfund\b|\btotal\b|\bgrants?:/.test(ctx)) {
        result.fundingTotal = mention.amount;
        break;
      }
    }
  }

  return result;
}
