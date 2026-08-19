import { ComingSoon } from "@/components/layout/ComingSoon";

export default function DietRecommendPage() {
  return (
    <ComingSoon
      emoji="🥗"
      title="식단 추천"
      description="냉장고 속 재료와 목표를 기반으로 Claude가 식단을 추천해드릴 예정이에요."
      planned={[
        "냉장고 재고 관리 메뉴",
        "목표(칼로리/단백질) 기반 추천",
        "유통기한 임박 재료 우선 추천",
      ]}
    />
  );
}
