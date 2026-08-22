/** 공통 운동 DB 등록처럼 관리자 전용 기능을 클라이언트에서 가리는 용도.
 * 실제 접근 제어는 firestore.rules에서 이 UID로 강제한다. */
export function isAdmin(uid: string | null | undefined): boolean {
  return !!uid && uid === process.env.NEXT_PUBLIC_ADMIN_UID;
}
