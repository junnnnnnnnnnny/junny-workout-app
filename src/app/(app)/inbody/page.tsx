import { ComingSoon } from "@/components/layout/ComingSoon";

export default function InbodyPage() {
  return (
    <ComingSoon
      emoji="📊"
      title="인바디 관리"
      description="인바디 결과지를 촬영해서 올리면 Claude가 자동으로 수치를 인식해 기록해드릴 예정이에요."
      planned={[
        "인바디 사진 업로드 → 자동 OCR 등록",
        "체중/골격근량/체지방률 추이 그래프",
        "목표 설정 및 다른 메뉴 연동 추천",
      ]}
    />
  );
}
