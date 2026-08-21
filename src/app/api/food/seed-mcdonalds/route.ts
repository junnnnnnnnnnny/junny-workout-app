import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore, requireUserId } from "@/lib/firebase/admin";

export const runtime = "nodejs";

// 사용자가 캡처해 준 맥도날드 코리아 영양성분표 기반 1회성 등록용 데이터.
// 표에 포화지방/당만 있고 총 탄수화물/총 지방 수치가 없어 carbsG/fatG는 0으로 둠(추후 보완 필요).
const ITEMS: [string, string, number, number][] = [
  ["맥도날드 에그맥머핀", "140g", 306, 19],
  ["맥도날드 베이컨에그맥머핀", "137g", 327, 19],
  ["맥도날드 베이컨토마토에그머핀", "196g", 341, 17],
  ["맥도날드 소시지에그맥머핀", "168g", 432, 23],
  ["맥도날드 디럭스 브렉퍼스트", "312g", 768, 29],
  ["맥도날드 핫케익2조각", "100g", 223, 6],
  ["맥도날드 핫케익3조각", "150g", 335, 9],
  ["맥도날드 치킨치즈머핀", "178g", 498, 23],
  ["맥도날드 그릴드치킨모닝버거", "164g", 358, 19],
  ["맥도날드 더블그릴드치킨모닝버거", "209g", 414, 30],
  ["맥도날드 진주고추크림치즈머핀", "228g", 523, 23],
  ["맥도날드 해쉬브라운", "57g", 162, 2],
  ["맥도날드 상하이치킨스낵랩", "112g", 300, 11],
  ["맥도날드 골든모짜렐라치즈스틱2조각", "47g", 165, 8],
  ["맥도날드 골든모짜렐라치즈스틱4조각", "94g", 330, 16],
  ["맥도날드 맥너겟4조각", "64g", 163, 10],
  ["맥도날드 맥너겟6조각", "96g", 244, 15],
  ["맥도날드 맥스파이시치킨텐더2조각", "79g", 190, 14],
  ["맥도날드 후렌치후라이스몰", "74g", 210, 4],
  ["맥도날드 후렌치후라이미디엄", "114g", 324, 5],
  ["맥도날드 후렌치후라이라지", "140g", 397, 7],
  ["맥도날드 디핑소스스위트앤사워", "25g", 40, 0],
  ["맥도날드 디핑소스스위트칠리", "25g", 52, 0],
  ["맥도날드 디핑소스케이준", "22g", 79, 0],
  ["맥도날드 코울슬로", "100g", 179, 1],
  ["맥도날드 맥윙2조각", "84g", 228, 14],
  ["맥도날드 맥윙4조각", "168g", 455, 28],
  ["맥도날드 맥윙8조각", "336g", 910, 56],
  ["맥도날드 게살크림크로켓스낵랩", "101g", 285, 7],
  ["맥도날드 진주고추매콤소스", "18g", 72, 0],
  ["맥도날드 빅맥", "223g", 582, 27],
  ["맥도날드 맥스파이시상하이버거", "246g", 528, 22],
  ["맥도날드 1955버거", "264g", 572, 29],
  ["맥도날드 맥치킨모짜렐라", "293g", 735, 29],
  ["맥도날드 맥치킨", "206g", 515, 19],
  ["맥도날드 더블불고기버거", "237g", 635, 26],
  ["맥도날드 불고기버거", "167g", 408, 14],
  ["맥도날드 슈슈버거", "225g", 431, 13],
  ["맥도날드 슈비버거", "269g", 573, 22],
  ["맥도날드 더블쿼터파운더치즈", "275g", 770, 50],
  ["맥도날드 베이컨토마토디럭스", "247g", 570, 29],
  ["맥도날드 쿼터파운더치즈", "198g", 536, 31],
  ["맥도날드 치즈버거", "115g", 318, 16],
  ["맥도날드 더블치즈버거", "167g", 479, 27],
  ["맥도날드 햄버거", "101g", 266, 13],
  ["맥도날드 트리플치즈버거", "216g", 640, 38],
  ["맥도날드 토마토치즈비프버거", "200g", 402, 18],
  ["맥도날드 더블맥스파이시상하이버거", "362g", 867, 38],
  ["맥도날드 맥크리스피치킨디럭스", "275g", 578, 23],
  ["맥도날드 맥크리스피치킨클래식", "209g", 567, 23],
  ["맥도날드 진주고추크림치즈비프버거", "253g", 586, 28],
  ["맥도날드 진주고추크림치즈치킨버거", "236g", 590, 24],
];

export async function POST(request: Request) {
  let uid: string;
  try {
    uid = await requireUserId(request);
  } catch {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const db = getAdminFirestore();
    const existingSnap = await db.collection("foods").select("name").get();
    const existingNames = new Set(existingSnap.docs.map((d) => d.data().name));

    const toAdd = ITEMS.filter(([name]) => !existingNames.has(name));

    const batchSize = 20;
    for (let i = 0; i < toAdd.length; i += batchSize) {
      const batch = db.batch();
      for (const [name, unit, calories, proteinG] of toAdd.slice(i, i + batchSize)) {
        const ref = db.collection("foods").doc();
        batch.set(ref, {
          name,
          unit,
          calories,
          proteinG,
          carbsG: 0,
          fatG: 0,
          createdBy: uid,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    }

    return NextResponse.json({ added: toAdd.length, skipped: ITEMS.length - toAdd.length });
  } catch (error) {
    console.error("seed mcdonalds foods failed", error);
    return NextResponse.json({ error: "등록 중 오류가 발생했어요." }, { status: 500 });
  }
}
