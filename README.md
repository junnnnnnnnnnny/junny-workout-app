# Junny Workout

운동 기록 · 식단 기록 · 식단 추천 · 목표 설정 · 인바디 관리를 한 곳에서 하는 개인 트레이닝 앱.
Next.js(App Router) + Firebase(Auth/Firestore/Storage) + Claude API, Vercel 배포 기준으로 만들었습니다.

## 현재 구현 범위

디자인은 아이보리 배경(`#faf7ef`) + 그린 포인트(`#046205`)의 위클리 캘린더 다이어리 스타일을 따릅니다.

- ✅ Google 로그인 (Firebase Auth, 멀티유저)
- ✅ 온보딩 5단계: 환영 → 체성분 입력(사진 OCR/직접 입력) → 운동 목적 → 목표 확인(자동 계산) → 요약
- ✅ 운동 기록: 위클리 캘린더 다이어리, 운동 검색/필터(전체·즐겨찾기·내 헬스장 기구), 무게×횟수 세트 기록, 같은 운동 최근 3회차 비교, 애플 피트니스 결과 붙여넣기 자동 기록(Claude API)
- ✅ 식단 기록: 위클리 캘린더, 끼니별(아침/점심/저녁/간식) 채팅 분석(Claude API) 또는 음식 목록에서 선택, 칼로리/단백질/탄수화물/지방 진행률
- ✅ 식단 추천: 냉장고 재료 관리(유통기한 D-day 표시), 임박 재료 기반 Claude 추천
- ✅ 인바디 관리: 결과지 사진 업로드 → Claude Vision 자동 수치 인식, 최근 기록, 체중 추이 그래프
- ✅ 관리자 메뉴: 목표 수정, 헬스장 보유 기구 선택, 즐겨찾기 운동 관리, 온보딩 다시 보기
- 🚧 운동별 자극 부위는 아직 실제 다이어그램 이미지가 아닌 placeholder 박스로 표시됩니다.

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
