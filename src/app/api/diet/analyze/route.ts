import { NextResponse } from "next/server";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { requireUserId } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const MealItemSchema = z.object({
  name: z.string().describe("음식 이름 (한국어)"),
  quantity: z.string().describe("수량/양 표현, 예: '1공기', '200g', '1개'"),
  calories: z.number().describe("추정 칼로리 (kcal)"),
  proteinG: z.number().describe("추정 단백질 (g)"),
  carbsG: z.number().describe("추정 탄수화물 (g)"),
  fatG: z.number().describe("추정 지방 (g)"),
});

const DietAnalysisSchema = z.object({
  meals: z.array(MealItemSchema),
});

export async function POST(request: Request) {
  try {
    await requireUserId(request);
  } catch {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "먹은 내용을 입력해주세요." }, { status: 400 });
  }

  try {
    const response = await anthropic.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      output_config: {
        effort: "medium",
        format: zodOutputFormat(DietAnalysisSchema),
      },
      system:
        "당신은 한국어 식단 기록을 분석하는 영양 분석 어시스턴트입니다. 사용자가 채팅하듯 편하게 적은 오늘 먹은 음식 설명을 개별 음식 항목으로 나누고, 일반적인 한국 기준 1인분/조리법을 가정해 칼로리(kcal)와 단백질/탄수화물/지방(g)을 최대한 합리적으로 추정하세요. 양이 명시되지 않으면 표준 1인분을 가정합니다. 음료나 간식도 빠뜨리지 말고 포함하세요.",
      messages: [{ role: "user", content: text }],
    });

    if (!response.parsed_output) {
      return NextResponse.json({ error: "분석 결과를 해석하지 못했어요." }, { status: 502 });
    }

    return NextResponse.json({ meals: response.parsed_output.meals });
  } catch (error) {
    console.error("diet analyze failed", error);
    return NextResponse.json({ error: "식단 분석 중 오류가 발생했어요." }, { status: 500 });
  }
}
