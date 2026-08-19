import { NextResponse } from "next/server";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { requireUserId } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const InbodySchema = z.object({
  weightKg: z.number().nullable().describe("체중 (kg)"),
  skeletalMuscleMassKg: z.number().nullable().describe("골격근량 (kg)"),
  bodyFatPercent: z.number().nullable().describe("체지방률 (%)"),
  bodyFatMassKg: z.number().nullable().describe("체지방량 (kg)"),
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
  const imageBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64 : "";
  const mediaType = typeof body?.mediaType === "string" ? body.mediaType : "";

  if (!imageBase64 || !isAllowedMediaType(mediaType)) {
    return NextResponse.json({ error: "이미지가 올바르지 않아요." }, { status: 400 });
  }

  try {
    const response = await anthropic.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      output_config: {
        effort: "medium",
        format: zodOutputFormat(InbodySchema),
      },
      system:
        "당신은 인바디(InBody) 체성분 분석 결과지 사진에서 수치를 읽어내는 어시스턴트입니다. 사진에서 체중(kg), 골격근량(kg), 체지방률(%), 체지방량(kg)을 정확히 읽어 반환하세요. 사진에서 값을 확인할 수 없으면 null로 두세요.",
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
            { type: "text", text: "이 인바디 결과지에서 체중, 골격근량, 체지방률, 체지방량을 읽어줘." },
          ],
        },
      ],
    });

    if (!response.parsed_output) {
      return NextResponse.json({ error: "이미지를 분석하지 못했어요." }, { status: 502 });
    }

    return NextResponse.json(response.parsed_output);
  } catch (error) {
    console.error("inbody analyze failed", error);
    return NextResponse.json({ error: "인바디 분석 중 오류가 발생했어요." }, { status: 500 });
  }
}
