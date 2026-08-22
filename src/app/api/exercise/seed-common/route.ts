import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore, requireUserId } from "@/lib/firebase/admin";
import { isAdmin } from "@/lib/admin";
import type { MuscleGroup } from "@/types";

export const runtime = "nodejs";

// 관리자가 준 운동 목록을 공통 운동 DB(exercises 컬렉션)에 등록하는 1회성 등록용 데이터.
// 한글 이름(nameKo)이 이미 등록돼 있으면 건너뛴다.
const ITEMS: { nameKo: string; name: string; equipment: string; muscleGroups: MuscleGroup[] }[] = [];

export async function POST(request: Request) {
  let uid: string;
  try {
    uid = await requireUserId(request);
  } catch {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  if (!isAdmin(uid)) {
    return NextResponse.json({ error: "관리자만 사용할 수 있어요." }, { status: 403 });
  }

  try {
    const db = getAdminFirestore();
    const existingSnap = await db.collection("exercises").select("nameKo").get();
    const existingNames = new Set(existingSnap.docs.map((d) => d.data().nameKo));

    const toAdd = ITEMS.filter((item) => !existingNames.has(item.nameKo));

    const batchSize = 20;
    for (let i = 0; i < toAdd.length; i += batchSize) {
      const batch = db.batch();
      for (const item of toAdd.slice(i, i + batchSize)) {
        const ref = db.collection("exercises").doc();
        batch.set(ref, {
          ...item,
          createdBy: uid,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    }

    return NextResponse.json({ added: toAdd.length, skipped: ITEMS.length - toAdd.length });
  } catch (error) {
    console.error("seed exercises failed", error);
    return NextResponse.json({ error: "등록 중 오류가 발생했어요." }, { status: 500 });
  }
}
