# Uni - AI University Companion App 🎓

대학생을 위한 AI 기반 올인원 캠퍼스 라이프 앱 **Uni**입니다.
이 프로젝트는 React Native와 Expo를 사용하여 개발되었습니다.

## 📱 프로젝트 소개 (Project Description)

**Uni**는 대학생들의 학교 생활을 돕기 위해 다음과 같은 기능을 제공합니다:

*   **🤖 AI 홈 (AI Home)**: 
    *   AI 챗봇 'Uni'와 대화하여 맛집 추천, 교수님 평가, 여행 계획 등 다양한 정보를 얻을 수 있습니다.
    *   실시간 날씨 및 등하교 버스(교통) 정보를 제공합니다.
*   **🗺️ 맛집 지도 (Map/Restaurants)**: 학교 주변 맛집 정보를 지도에서 확인하고 추천받을 수 있습니다.
*   **📅 시간표 (Timetable)**: 수업 시간표를 관리할 수 있습니다.
*   **💬 커뮤니티 (Community)**: 학우들과 소통할 수 있는 익명/실명 커뮤니티 공간입니다.
*   **🔍 검색 (Search)**: 학교 생활에 필요한 정보를 통합 검색할 수 있습니다.

## 🛠️ 기술 스택 (Tech Stack)

*   **Framework**: [Expo](https://expo.dev/) (React Native)
*   **Language**: TypeScript / JavaScript
*   **Routing**: Expo Router
*   **Navigation**: React Navigation (Bottom Tabs)

## 🚀 실행 방법 (Getting Started)

1. **의존성 설치 (Install dependencies)**

   ```bash
   npm install
   ```

2. **앱 실행 (Start the app)**

   ```bash
   npx expo start
   ```

   실행 후 나타나는 QR 코드를 모바일의 Expo Go 앱으로 스캔하거나, 에뮬레이터(Android/iOS)에서 실행할 수 있습니다.

## 📂 프로젝트 구조 (Project Structure)

```
uni-app/
├── app/
│   ├── (tabs)/          # 하단 탭 내비게이션 화면들
│   │   ├── index.tsx    # AI 홈 화면
│   │   ├── map.tsx      # 맛집 지도 화면
│   │   ├── community.tsx # 커뮤니티 화면
│   │   ├── timetable.tsx # 시간표 화면
│   │   ├── search.tsx   # 검색 화면
│   │   └── _layout.tsx  
│   ├── _layout.tsx      # 루트 레이아웃
│   └── ...
├── components/          # 재사용 가능한 컴포넌트
├── assets/              # 이미지 및 리소스
└── ...
```

## 🔗 저장소 (Repository)

[https://github.com/dnf98083-cmyk/projackt](https://github.com/dnf98083-cmyk/projackt)
