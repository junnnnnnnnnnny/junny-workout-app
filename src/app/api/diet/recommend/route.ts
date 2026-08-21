import { NextResponse } from "next/server";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, claudeErrorMessage, CLAUDE_MODEL } from "@/lib/anthropic";
import { requireUserId } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const RecommendSchema = z.object({
  title: z.string().describe("추천 메뉴 이름 (한국어)"),
  description: z.string().describe("메뉴 설명 및 조리 팁, 2~3문장"),
  estimatedCalories: z.number().describe("추정 칼로리 (kcal)"),
  estimatedProteinG: z.number().describe("추정 단백질 (g)"),
});

export async function POST(request: Request) {
  let uid: string;
  try {
    uid = await requireUserId(request);
  } catch {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  void uid;

  const body = await request.json().catch(() => null);
  const items: { name: string; quantity: string; expiryDate?: string }[] = Array.isArray(body?.items)
    ? body.items
    : [];
  const priorityItems: string[] = Array.isArray(body?.priorityItems) ? body.priorityItems : [];
  const goalSummary = typeof body?.goalSummary === "string" ? body.goalSummary : "";

  if (items.length === 0) {
    return NextResponse.json({ error: "냉장고에 재료를 먼저 추가해주세요." }, { status: 400 });
  }

  const itemsText = items.map((i) => `${i.name} (${i.quantity})`).join(", ");
  const priorityText = priorityItems.length
    ? `특히 이 재료들을 우선적으로 소진해야 해요: ${priorityItems.join(", ")}.`
    : "";

  try {
    const response = await anthropic.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      output_config: {
        effort: "medium",
        format: zodOutputFormat(RecommendSchema),
      },
      system:
        "당신은 한국인의 식습관에 맞는 식단을 추천하는 영양 코치입니다. 사용자의 냉장고 재료와 목표(칼로리/단백질)를 기반으로 현실적으로 만들 수 있는 한 끼 메뉴 하나를 추천하세요. 냉장고에 없는 재료가 필요하면 최소화하고, 목표에 맞는 매크로를 추정하세요.",
      messages: [
        {
          role: "user",
          content: `냉장고 재료: ${itemsText}\n${priorityText}\n${goalSummary ? `목표: ${goalSummary}` : ""}`,
        },
      ],
    });

    if (!response.parsed_output) {
      return NextResponse.json({ error: "추천 결과를 해석하지 못했어요." }, { status: 502 });
    }

    return NextResponse.json(response.parsed_output);
  } catch (error) {
    console.error("diet recommend failed", error);
    return NextResponse.json(
      { error: claudeErrorMessage(error, "추천 생성 중 오류가 발생했어요.") },
      { status: 500 }
    );
  }
}
