/** 인증된 POST 요청 후 JSON을 안전하게 파싱한다. 서버가 빈 응답/HTML 에러 페이지를 반환해도
 *  (예: Vercel 서버리스 함수 요청 크기 제한 초과) 사용자에게 이해 가능한 에러 메시지를 준다. */
export async function postJson<T>(url: string, token: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    throw new Error(`서버 응답을 처리하지 못했어요. (status ${res.status})`);
  }

  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error;
    throw new Error(message ?? "요청에 실패했어요.");
  }

  return data as T;
}
