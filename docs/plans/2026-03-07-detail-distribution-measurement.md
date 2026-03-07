# 세부 정규분포 전환 시간 계측 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 세부 정규분포 전환 시간을 실제 브라우저 기준으로 측정하고, 개발 모드에서 측정값과 캐시 상태를 바로 확인할 수 있게 한다.

**Architecture:** `Chart.jsx`에서 정규분포 토글 시작 시각과 응답/계산 캐시 상태를 저장하고, 정규분포 시리즈가 준비되면 측정을 완료한다. 개발 모드에서만 배지와 콘솔 로그를 노출한다.

**Tech Stack:** React 19, Vite, Vitest

---

### Task 1: 계측 요약 helper를 TDD로 추가한다

**Files:**
- Create: `spc_front/src/features/chart/detailDistributionPerf.js`
- Create: `spc_front/src/features/chart/detailDistributionPerf.test.js`

**Step 1: Write the failing test**

- 응답/계산 캐시 상태와 duration을 받아 요약 문자열을 만드는 테스트를 작성한다.
- 개발 로그 payload를 안정적으로 만드는 테스트를 작성한다.

**Step 2: Run test to verify it fails**

Run: `Push-Location spc_front; npm.cmd run test:unit -- src/features/chart/detailDistributionPerf.test.js; Pop-Location`
Expected: FAIL with missing helper module

**Step 3: Write minimal implementation**

- 요약 문자열 생성 helper를 추가한다.
- 로그 payload 생성 helper를 추가한다.

**Step 4: Run test to verify it passes**

Run: `Push-Location spc_front; npm.cmd run test:unit -- src/features/chart/detailDistributionPerf.test.js; Pop-Location`
Expected: PASS

### Task 2: Chart.jsx에 측정 상태와 개발 모드 표시를 연결한다

**Files:**
- Modify: `spc_front/src/page/Chart.jsx`

**Step 1: Write the failing test target**

- helper import를 먼저 연결해 미구현 상태에서 테스트가 깨지는 지점을 만든다.

**Step 2: Run test to verify it fails**

Run: `Push-Location spc_front; npm.cmd run test:unit; Pop-Location`
Expected: FAIL until helper import와 측정 로직이 맞춰진다

**Step 3: Write minimal implementation**

- 토글 시작 시각과 캐시 상태를 `useRef` 또는 state로 저장한다.
- 응답 캐시 hit/miss, 계산 캐시 hit/miss를 기록한다.
- 정규분포 시리즈 준비 후 총 시간을 계산한다.
- 개발 모드에서만 우측 상단 배지와 콘솔 로그를 노출한다.

**Step 4: Run test to verify it passes**

Run: `Push-Location spc_front; npm.cmd run test:unit; Pop-Location`
Expected: PASS

### Task 3: 최종 검증

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

- 측정 위치, 표시 방식, 다음 튜닝 포인트를 정리한다.
