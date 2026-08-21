import { NextResponse } from "next/server";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { requireUserId } from "@/lib/firebase/admin";

export const runtime = "nodejs";
// Claude Vision으로 사진 여러 장을 분석하면 10초 넘게 걸릴 수 있어 Vercel Hobby 플랜의
// 기본 함수 제한시간(10초)에 걸린다. 허용 가능한 최대치로 늘려둔다.
export const maxDuration = 60;

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

const MAX_IMAGES = 3;

export async function POST(request: Request) {
  try {
    await requireUserId(request);
  } catch {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rawImages: unknown[] = Array.isArray(body?.images) ? body.images : [];
  const images = rawImages
    .slice(0, MAX_IMAGES)
    .filter(
      (img): img is { base64: string; mediaType: AllowedMediaType } =>
        typeof img === "object" &&
        img !== null &&
        typeof (img as { base64?: unknown }).base64 === "string" &&
        (img as { base64: string }).base64.length > 0 &&
        isAllowedMediaType((img as { mediaType?: unknown }).mediaType as string)
    );

  if (images.length === 0) {
    return NextResponse.json({ error: "이미지가 올바르지 않아요." }, { status: 400 });
  }

  const content: Anthropic.MessageParam["content"] = [
    ...images.map(
      (img) =>
        ({
          type: "image",
          source: { type: "base64", media_type: img.mediaType, data: img.base64 },
        }) as const
    ),
    {
      type: "text",
      text:
        images.length > 1
          ? "이 사진들은 같은 인바디 결과지를 여러 장으로 나눠 찍은 것일 수 있어요. 모든 사진을 종합해서 체중, 골격근량, 체지방률, 체지방량을 읽어줘."
          : "이 인바디 결과지에서 체중, 골격근량, 체지방률, 체지방량을 읽어줘.",
    },
  ];

  try {
    const response = await anthropic.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      output_config: {
        effort: "low",
        format: zodOutputFormat(InbodySchema),
      },
      system:
        "당신은 인바디(InBody) 체성분 분석 결과지 사진에서 수치를 읽어내는 어시스턴트입니다. 사진 한 장에 모든 정보가 안 담겨 여러 장으로 나눠 찍힌 경우, 모든 사진의 정보를 종합해서 하나의 결과로 합쳐주세요. 체중(kg), 골격근량(kg), 체지방률(%), 체지방량(kg)을 정확히 읽어 반환하세요. 어떤 사진에서도 값을 확인할 수 없으면 null로 두세요.",
      messages: [{ role: "user", content }],
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
