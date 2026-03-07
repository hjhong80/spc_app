# 프론트엔드 테스트 도입 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 프론트엔드에 Vitest, Testing Library, Playwright를 도입하고 핵심 단위 테스트와 최소 E2E 시나리오를 추가한다.

**Architecture:** Vite 기반 프론트에 Vitest를 단위/DOM 테스트 러너로 추가하고, Playwright는 dev 서버를 기동해 브라우저 흐름을 검증한다. 기존 helper 테스트는 Vitest로 편입하고, 첫 E2E는 페이지 진입과 차트 화면 기본 렌더만 다룬다.

**Tech Stack:** React 19, Vite, Vitest, Testing Library, Playwright

---

### Task 1: 테스트 도구 의존성과 스크립트를 추가한다

**Files:**
- Modify: `spc_front/package.json`

**Step 1: Write the failing test**

- `test:unit`과 `test:e2e` 스크립트를 먼저 참조하게 바꾼다.
- 아직 도구가 설치되지 않은 상태에서 스크립트 실행이 실패하도록 만든다.

**Step 2: Run test to verify it fails**

Run: `Push-Location spc_front; npm.cmd run test:unit; Pop-Location`
Expected: FAIL with missing script or missing package

**Step 3: Write minimal implementation**

- `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `playwright`, `@playwright/test`를 추가한다.
- `test:unit`, `test:e2e`, `test` 스크립트를 추가한다.

**Step 4: Run test to verify it passes**

Run: `Push-Location spc_front; npm.cmd install; npm.cmd run test:unit; Pop-Location`
Expected: PASS or move to next setup error

### Task 2: Vitest 설정과 공통 테스트 환경을 추가한다

**Files:**
- Create: `spc_front/vitest.config.js`
- Create: `spc_front/src/test/setup.js`
- Modify: `spc_front/vite.config.js`

**Step 1: Write the failing test**

- 기존 helper 테스트를 Vitest 형식으로 옮기기 전에 설정 파일 import를 추가한다.
- 설정 부재 상태에서 테스트가 실패하게 만든다.

**Step 2: Run test to verify it fails**

Run: `Push-Location spc_front; npm.cmd run test:unit; Pop-Location`
Expected: FAIL with missing Vitest config or DOM setup

**Step 3: Write minimal implementation**

- Vitest 환경을 `jsdom`으로 설정한다.
- 공통 matcher setup 파일을 추가한다.
- 필요하면 `vite.config.js`에 테스트 관련 공통 설정을 분리한다.

**Step 4: Run test to verify it passes**

Run: `Push-Location spc_front; npm.cmd run test:unit; Pop-Location`
Expected: PASS or fail only on next missing test migration

### Task 3: 기존 helper 테스트를 Vitest로 통합한다

**Files:**
- Modify: `spc_front/src/features/chart/chartDownsampling.test.js`
- Modify: `spc_front/src/features/chart/chartSeriesBuilder.test.js`

**Step 1: Write the failing test**

- `node:test` 기반 import를 제거하고 Vitest API를 사용하도록 바꾼다.

**Step 2: Run test to verify it fails**

Run: `Push-Location spc_front; npm.cmd run test:unit; Pop-Location`
Expected: FAIL until Vitest import와 assertion 형식이 맞춰진다

**Step 3: Write minimal implementation**

- `describe`, `it`, `expect` 기반으로 테스트를 옮긴다.
- 기존 검증 시나리오는 유지한다.

**Step 4: Run test to verify it passes**

Run: `Push-Location spc_front; npm.cmd run test:unit; Pop-Location`
Expected: PASS

### Task 4: 첫 React DOM 테스트를 추가한다

**Files:**
- Create: `spc_front/src/component/spc-data/SpcDataChartPanel.test.jsx`
- Modify: `spc_front/src/component/spc-data/SpcDataChartPanel.jsx`

**Step 1: Write the failing test**

- lazy chart 로딩 중 fallback 문구가 표시되는 테스트를 작성한다.
- 최소 props로 패널이 렌더되는 테스트를 작성한다.

**Step 2: Run test to verify it fails**

Run: `Push-Location spc_front; npm.cmd run test:unit; Pop-Location`
Expected: FAIL with missing test handling or component behavior mismatch

**Step 3: Write minimal implementation**

- fallback 문구가 안정적으로 테스트 가능한지 확인하고 필요한 최소 조정을 한다.
- 테스트가 의존하는 DOM 텍스트나 역할을 고정한다.

**Step 4: Run test to verify it passes**

Run: `Push-Location spc_front; npm.cmd run test:unit; Pop-Location`
Expected: PASS

### Task 5: Playwright 설정과 첫 E2E 시나리오를 추가한다

**Files:**
- Create: `spc_front/playwright.config.js`
- Create: `spc_front/e2e/app-smoke.spec.js`
- Modify: `spc_front/package.json`

**Step 1: Write the failing test**

- 홈 진입 또는 차트 페이지 직접 진입 스모크 테스트를 작성한다.
- Playwright 설정 없이 테스트가 실패하는 상태를 만든다.

**Step 2: Run test to verify it fails**

Run: `Push-Location spc_front; npx.cmd playwright test; Pop-Location`
Expected: FAIL with missing config or browser setup

**Step 3: Write minimal implementation**

- Vite dev 서버를 자동 기동하는 Playwright 설정을 추가한다.
- 기본 브라우저 프로젝트를 설정한다.
- 첫 E2E는 앱 진입 후 핵심 텍스트 또는 헤더 렌더를 확인한다.

**Step 4: Run test to verify it passes**

Run: `Push-Location spc_front; npx.cmd playwright test; Pop-Location`
Expected: PASS

### Task 6: 최종 검증

**Files:**
- Modify: 없음

**Step 1: Run unit verification**

Run: `Push-Location spc_front; npm.cmd run test:unit; Pop-Location`
Expected: PASS

**Step 2: Run E2E verification**

Run: `Push-Location spc_front; npm.cmd run test:e2e; Pop-Location`
Expected: PASS

**Step 3: Run build verification**

Run: `Push-Location spc_front; npm.cmd run build; Pop-Location`
Expected: PASS

**Step 4: Summarize results**

- 추가된 테스트 도구, 테스트 범위, 실행 방법, 남은 리스크를 정리한다.
