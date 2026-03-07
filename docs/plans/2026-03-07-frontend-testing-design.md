# 프론트엔드 테스트 도입 설계

## 작업 목적
- 프론트엔드에 기본 테스트 체계를 도입한다.
- 순수 로직, React DOM 상호작용, 실제 브라우저 흐름을 각각 다른 계층에서 검증한다.
- 깃허브 업로드 전 최소한의 회귀 방지 장치를 만든다.

## 현재 구조
- [`spc_front/package.json`](../../spc_front/package.json)에는 테스트 러너가 없다.
- 현재 검증은 `lint`와 `build` 중심이다.
- 최근 추가한 차트 성능 helper 테스트는 `node:test` 기반 임시 형태다.
- 주요 리스크는 차트 페이지, 프로젝트 선택, 업로드/매핑 같은 사용자 흐름에 있다.

## 목표
- 단위 테스트 러너를 정식 도입한다.
- React DOM 테스트 환경을 같이 준비한다.
- 핵심 사용자 흐름을 브라우저 E2E로 최소 1~2개 검증한다.
- 앞으로 테스트 파일을 자연스럽게 추가할 수 있는 스크립트와 폴더 구조를 만든다.

## 도구 선택

### 1. 단위 테스트
- `Vitest`를 사용한다.
- 이유:
  - Vite 기반 프로젝트와 궁합이 좋다.
  - 빠르게 실행된다.
  - 현재 helper 테스트를 쉽게 흡수할 수 있다.

### 2. DOM/컴포넌트 테스트
- `@testing-library/react`와 `@testing-library/jest-dom`을 사용한다.
- 이유:
  - 구현 세부보다 사용자 관점 DOM 검증에 맞다.
  - 향후 차트 주변 UI, 헤더, 업로드 UI 테스트에 확장하기 쉽다.

### 3. E2E 테스트
- `Playwright`를 사용한다.
- 이유:
  - 브라우저 자동화와 다중 브라우저 지원이 강하다.
  - dev 서버 자동 기동과 연동이 쉽다.
  - 차트/라우팅/페이지 전환 검증에 적합하다.

## 테스트 계층 설계

### 1. 단위 테스트 계층
- 대상:
  - 차트 helper
  - 데이터 변환 함수
  - 다운샘플링/시리즈 생성 같은 순수 로직
- 초기 대상:
  - [`chartDownsampling.js`](../../spc_front/src/features/chart/chartDownsampling.js)
  - [`chartSeriesBuilder.js`](../../spc_front/src/features/chart/chartSeriesBuilder.js)

### 2. 컴포넌트 테스트 계층
- 대상:
  - lazy fallback
  - 토글/버튼 클릭
  - 조건부 렌더링
- 초기 대상:
  - [`SpcDataChartPanel.jsx`](../../spc_front/src/component/spc-data/SpcDataChartPanel.jsx)

### 3. E2E 계층
- 대상:
  - 앱 기본 진입
  - 라우팅
  - 핵심 화면 렌더 확인
- 초기 대상:
  - 홈 또는 기본 진입 페이지 로딩
  - 차트 페이지 직접 진입 후 기본 UI 요소 표시

## 파일 구조
- `spc_front/vitest.config.js`
- `spc_front/src/test/setup.js`
- `spc_front/e2e/`
- `spc_front/playwright.config.js`

## 스크립트 설계
- `test:unit`: Vitest 실행
- `test:e2e`: Playwright 실행
- `test`: 단위 테스트 우선 실행, 이후 E2E 실행

## 구현 원칙
- 기존 `node:test` 기반 테스트는 Vitest로 통합한다.
- E2E는 너무 많은 비즈니스 플로우를 한 번에 넣지 않는다.
- 차트처럼 외부 렌더러 의존성이 큰 컴포넌트는 먼저 fallback/컨테이너 수준부터 검증한다.
- 테스트는 향후 CI 연결이 쉬운 형태로 유지한다.

## 제약 및 위험
- 현재 루트는 Git 저장소가 아니므로 루트 문서 커밋은 바로 할 수 없다.
- 차트 페이지는 백엔드 데이터와 라우트 상태 영향을 받을 수 있어 E2E에서 최소 전제 조건이 필요하다.
- Playwright 브라우저 설치가 추가로 필요할 수 있다.

## 주요 변경 사항
- Vitest + Testing Library + Playwright 도입
- 테스트 설정 파일 및 스크립트 추가
- helper 테스트 정식 편입
- 최소 E2E 시나리오 추가

## 검증 결과
- 설계 단계이므로 아직 미검증

## 남은 TODO
- 테스트 스크립트 이름 확정
- E2E 진입 URL 및 데이터 전제 조건 확정
- Playwright 브라우저 설치 여부 확인
- 최종 실행 검증
