/**
 * 이미지를 캔버스로 리사이즈/재인코딩해서 base64로 반환한다.
 * 폰 카메라 원본 사진(수 MB~수십 MB)을 그대로 API로 보내면 Vercel 서버리스 함수의
 * 요청 본문 제한(4.5MB)에 걸려 JSON이 아닌 응답이 오는 문제를 막기 위함.
 */
export async function fileToResizedBase64(
  file: File,
  maxDimension = 1600,
  quality = 0.82
): Promise<{ base64: string; mediaType: "image/jpeg" }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 처리하지 못했어요.");
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("이미지 변환에 실패했어요."))), "image/jpeg", quality);
  });

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("이미지를 읽지 못했어요."));
    reader.readAsDataURL(blob);
  });

  return { base64, mediaType: "image/jpeg" };
}
