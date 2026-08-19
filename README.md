# Junny Workout

운동 기록 · 식단 기록 · 식단 추천 · 목표 설정 · 인바디 관리를 한 곳에서 하는 개인 트레이닝 앱.
Next.js(App Router) + Firebase(Auth/Firestore/Storage) + Claude API, Vercel 배포 기준으로 만들었습니다.

## 현재 구현 범위

- ✅ Google 로그인 (Firebase Auth, 멀티유저)
- ✅ 온보딩: 첫 로그인 시 목표(칼로리/단백질/둘 다) 설정
- ✅ 운동 기록: 웨이트 트레이닝 운동 선택 → 무게×횟수 세트 기록, 같은 운동의 최근 3회차 기록 비교
- ✅ 식단 기록: 채팅처럼 편하게 입력하면 Claude API가 음식/칼로리/단백질/탄수화물/지방으로 분석, 목표 대비 진행률 표시
- ✅ 관리자 메뉴: 목표 수정
- 🚧 준비 중 (스캐폴드만 있음, UI에 "준비 중" 표시): 식단 추천(냉장고 관리 포함), 인바디 사진 자동 등록, 애플 피트니스 결과 붙여넣기 자동 기록, 운동 자극 부위 이미지, 헬스장 기구 기반 운동 추천/즐겨찾기

## 스택

- **Frontend/Backend**: Next.js 15 (App Router, TypeScript, Tailwind CSS v4)
- **Auth/DB/Storage**: Firebase (Auth, Firestore, Storage)
- **AI**: Anthropic Claude API (`claude-opus-5`) — 서버 API 라우트에서만 호출, 클라이언트에 키 노출 없음
- **배포**: Vercel

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Firebase 프로젝트 설정

1. [Firebase 콘솔](https://console.firebase.google.com/)에서 새 프로젝트 생성 (무료 Spark 플랜으로 충분)
2. **Authentication** → 로그인 방법 → **Google** 활성화
3. **Firestore Database** 생성 (프로덕션 모드로 시작해도 무방 — 아래 규칙을 배포하면 됨)
4. **Storage** 활성화 (인바디 사진 업로드용, 추후 기능에서 사용)
5. 프로젝트 설정 → 일반 → "내 앱" → 웹 앱 추가 → 아래 값들을 복사해 `.env.local`에 입력
6. 프로젝트 설정 → 서비스 계정 → "새 비공개 키 생성" → 다운로드한 JSON에서 `project_id`, `client_email`, `private_key`를 `.env.local`에 입력 (`private_key`는 개행을 `\n`으로 이스케이프된 상태 그대로 한 줄에 붙여넣기)

### 3. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local`을 열어 Firebase 웹 앱 설정값, Firebase 서비스 계정 값, `ANTHROPIC_API_KEY`를 채워주세요.
`ANTHROPIC_API_KEY`는 [Anthropic Console](https://console.anthropic.com/)에서 발급받을 수 있습니다.

### 4. Firestore 인덱스 & 보안 규칙 배포

이 저장소에는 `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`가 포함되어 있습니다.

```bash
npm install -g firebase-tools   # 최초 1회
firebase login
firebase use --add               # 위에서 만든 프로젝트 선택
firebase deploy --only firestore:rules,firestore:indexes,storage
```

> 보안 규칙은 `users/{본인 uid}` 하위 데이터만 본인이 읽고 쓸 수 있도록 제한합니다. 인덱스는 "최근 3회차 운동 기록", "오늘 날짜 식단 기록" 조회 쿼리에 필요합니다.

### 5. 로컬 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 접속.

## Vercel 배포

1. 이 저장소를 Vercel에 Import
2. Project Settings → Environment Variables에 `.env.local`과 동일한 키/값을 등록
   - `NEXT_PUBLIC_*` 값들은 클라이언트에 노출되는 값이라 그대로 등록해도 안전합니다.
   - `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PROJECT_ID`, `ANTHROPIC_API_KEY`는 서버 전용이니 Vercel의 환경변수(Encrypted)로만 등록하고 절대 커밋하지 마세요.
3. Deploy

## 데이터 구조 (Firestore)

```
users/{uid}
  (profile fields: displayName, email, photoURL, onboardingCompleted)
  goals/current            -> 목표 (mode, calorieTarget, proteinTarget, targetWeightKg)
  workoutLogs/{id}         -> 운동 기록 (exerciseId, exerciseName, sets[], date)
  dietLogs/{id}            -> 식단 기록 (rawInput, meals[], totalCalories, totalProteinG, date)
  fridgeItems/{id}         -> 냉장고 재료 (준비 중)
  inbodyRecords/{id}       -> 인바디 기록 (준비 중)
```

운동 카탈로그는 `src/data/exercises.ts`에 정적으로 정의되어 있습니다 (관리자 메뉴에서 헬스장 기구 기반 커스터마이징은 다음 단계 예정).
