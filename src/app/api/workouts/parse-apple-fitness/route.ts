import { NextResponse } from "next/server";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { requireUserId } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const ActivitySchema = z.object({
  activityType: z.string().describe("운동/활동 종류 (한국어), 예: '달리기', '사이클', '걷기'"),
  durationMin: z.number().describe("운동 시간 (분)"),
  caloriesBurned: z.number().nullable().describe("소모 칼로리 (kcal), 알 수 없으면 null"),
  distanceKm: z.number().nullable().describe("이동 거리 (km), 해당 없으면 null"),
  avgHeartRate: z.number().nullable().describe("평균 심박수 (bpm), 알 수 없으면 null"),
});

const AppleFitnessSchema = z.object({
  activities: z.array(ActivitySchema),
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
    return NextResponse.json({ error: "붙여넣은 내용이 없어요." }, { status: 400 });
  }

  try {
    const response = await anthropic.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      output_config: {
        effort: "low",
        format: zodOutputFormat(AppleFitnessSchema),
      },
      system:
        "당신은 애플 피트니스(Apple Fitness/Apple Health) 앱에서 사용자가 복사해 붙여넣은 운동 요약 텍스트를 분석하는 어시스턴트입니다. 텍스트에서 개별 운동/활동 항목을 추출해 종류, 시간(분), 소모 칼로리, 거리(km), 평균 심박수를 파악하세요. 값이 명시되지 않은 항목은 null로 두세요. 형식이 불규칙해도 최대한 합리적으로 해석하세요.",
      messages: [{ role: "user", content: text }],
    });

    if (!response.parsed_output) {
      return NextResponse.json({ error: "분석 결과를 해석하지 못했어요." }, { status: 502 });
    }

    return NextResponse.json({ activities: response.parsed_output.activities });
  } catch (error) {
    console.error("apple fitness parse failed", error);
    return NextResponse.json({ error: "분석 중 오류가 발생했어요." }, { status: 500 });
  }
}
