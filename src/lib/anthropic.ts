import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const CLAUDE_MODEL = "claude-opus-5";

/** Claude API 에러를 사용자에게 보여줄 수 있는 구체적인 메시지로 바꾼다 (디버깅용으로 노출). */
export function claudeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Anthropic.APIError) {
    return `Claude API 오류(${error.status ?? "-"}): ${error.message}`;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
