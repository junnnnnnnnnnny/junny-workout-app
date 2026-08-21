import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin이 내부적으로 쓰는 jose(ESM 전용)를 Next.js가 서버 함수 번들에
  // require()로 잘못 포함시키면서 "ERR_REQUIRE_ESM" 에러가 남. 번들링 대상에서
  // 제외하고 실행 시점에 node_modules에서 그대로 불러오게 한다.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
