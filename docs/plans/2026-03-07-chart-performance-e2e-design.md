# 차트 배포 성능 E2E 계측 설계

## 작업 목적
- 차트 페이지 전환 성능을 배포 기준으로 자동 측정한다.
- `메인 진입`, `세부 차트 전환`, `정규분포 전환`, `정규분포 캐시 재전환` 회귀를 Playwright에서 잡을 수 있게 만든다.

## 현재 문제
- 프론트 차트 성능은 개발 모드 배지와 콘솔 로그로만 수동 측정할 수 있다.
- 기존 Playwright 테스트는 홈/매퍼 스모크만 검증하며, 차트 페이지 성능은 자동화되지 않았다.
- 현재 Playwright는 `vite dev` 기준이라 배포 성능 기준과 다르다.

## 목표
- Playwright를 `build + preview` 기준으로 실행한다.
- 테스트 모드에서만 읽을 수 있는 전역 성능 상태를 차트 페이지가 기록한다.
- 차트 진입/전환 시간 임계값을 넘으면 E2E가 실패한다.

## 설계

### 1. 런타임 성능 훅
- 새 helper `chartPerfMonitor`
- 전역 객체 예시: `window.__SPC_CHART_PERF__`
- 테스트 활성화 조건:
  - Playwright `addInitScript`로 `window.__SPC_ENABLE_PERF__ = true`
  - 일반 사용자 환경에서는 아무 동작 없음
- 저장 항목:
  - `mainReadyMs`
  - `detailReadyMs`
  - `detailDistributionMs`
  - `detailDistributionCachedMs`
  - 각 측정의 `status`, `cache` 정보

### 2. 측정 구간
- 메인 진입:
  - 차트 페이지 mount 시점부터 메인 차트 시리즈 준비 및 렌더 가능한 상태까지
- 세부 차트 전환:
  - 메인 막대 클릭 시점부터 detail view의 시리즈 준비까지
- 정규분포 전환:
  - `정규 분포` 토글 클릭 시점부터 distribution series 렌더 완료까지
- 캐시 재전환:
  - 같은 characteristic/baseDate에서 base -> distribution -> base -> distribution 재진입 시 두 번째 distribution 완료까지

### 3. Playwright 실행 전략
- `playwright.config.js`의 `webServer.command`를 `npm run build && npm run preview -- --host 127.0.0.1 --port 4173`로 변경
- 테스트에서 sessionStorage에 차트 route state를 미리 넣고 `/chart`로 직접 진입
- axios 요청은 `page.route('http://localhost:8080/**')`로 mocking
- 차트에 필요한 API:
  - `chart-stats`
  - `report-count`
  - `detail`
  - `distribution`

### 4. 임계값
- 메인 차트 첫 진입: 3000ms 이하
- 세부 차트 전환: 2000ms 이하
- 정규분포 첫 전환: 3000ms 이하
- 정규분포 캐시 재전환: 1200ms 이하

### 5. 테스트 전략
- Vitest:
  - perf monitor helper가 비활성/활성 모드에서 전역 상태를 올바르게 갱신하는지 검증
- Playwright:
  - 성능 임계값 검증 1개 spec 추가
  - 실패 메시지에 실제 ms와 cache 상태 포함

## 주요 변경 사항
- preview 기반 Playwright 실행
- 차트 성능 전역 helper 추가
- 배포 기준 차트 성능 E2E 추가

## 검증 결과
- 설계 단계이므로 아직 미검증

## 남은 TODO
- helper/Playwright failing test 작성
- 전역 성능 상태 구현
- README 테스트 실행법 갱신
- 전체 프론트 테스트 재검증
