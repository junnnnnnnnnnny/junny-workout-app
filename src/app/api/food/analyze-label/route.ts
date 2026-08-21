import { NextResponse } from "next/server";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, claudeErrorMessage, CLAUDE_MODEL } from "@/lib/anthropic";
import { requireUserId } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const FoodLabelSchema = z.object({
  name: z.string().nullable().describe("제품명/음식 이름 (라벨에 보이면 그대로, 안 보이면 null)"),
  unit: z.string().nullable().describe("1회 제공량 표현, 예: '100g', '1개(230ml)'"),
  calories: z.number().nullable().describe("1회 제공량 기준 칼로리 (kcal)"),
  proteinG: z.number().nullable().describe("1회 제공량 기준 단백질 (g)"),
  carbsG: z.number().nullable().describe("1회 제공량 기준 탄수화물 (g)"),
  fatG: z.number().nullable().describe("1회 제공량 기준 지방 (g)"),
});

const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

function isAllowedMediaType(value: string): value is AllowedMediaType {
  return (ALLOWED_MEDIA_TYPES as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  try {
    await requireUserId(request);
  } catch {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const image = body?.image;
  const base64 = typeof image?.base64 === "string" ? image.base64 : "";
  const mediaType = typeof image?.mediaType === "string" ? image.mediaType : "";
  if (!base64 || !isAllowedMediaType(mediaType)) {
    return NextResponse.json({ error: "이미지가 올바르지 않아요." }, { status: 400 });
  }

  try {
    const response = await anthropic.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      output_config: {
        effort: "low",
        format: zodOutputFormat(FoodLabelSchema),
      },
      system:
        "당신은 식품 영양성분표 사진을 읽어내는 어시스턴트입니다. 사진 속 영양정보 표에서 1회 제공량과 그 기준의 칼로리(kcal), 단백질/탄수화물/지방(g)을 정확히 읽어주세요. 확인할 수 없는 항목은 null로 두세요.",
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: "이 영양성분표 사진에서 제품명, 1회 제공량, 칼로리, 단백질, 탄수화물, 지방을 읽어줘." },
          ],
        },
      ],
    });

    if (!response.parsed_output) {
      return NextResponse.json({ error: "이미지를 분석하지 못했어요." }, { status: 502 });
    }

    return NextResponse.json(response.parsed_output);
  } catch (error) {
    console.error("food label analyze failed", error);
    return NextResponse.json(
      { error: claudeErrorMessage(error, "성분표 분석 중 오류가 발생했어요.") },
      { status: 500 }
    );
  }
}
