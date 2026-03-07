# Chart Performance E2E Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 배포 기준 차트 진입/전환 시간을 Playwright와 런타임 성능 훅으로 자동 검증한다.

**Architecture:** 차트 페이지는 테스트 모드에서만 전역 성능 상태를 기록하고, Playwright는 preview 서버에서 route state와 API mock을 주입해 일관된 차트 화면을 만든 뒤 임계값을 검증한다. 기존 개발용 성능 배지는 유지하고, 배포 성능 자동화는 별도 helper와 spec으로 분리한다.

**Tech Stack:** React 19, Vite, Vitest, Playwright

---

### Task 1: failing test를 먼저 추가한다

**Files:**
- Create: `spc_front/src/features/chart/chartPerfMonitor.test.js`
- Create: `spc_front/e2e/chart-performance.spec.js`

**Step 1: Write the failing test**

- `chartPerfMonitor` helper의 전역 상태 기록 테스트를 작성한다.
- Playwright에서 `/chart` 진입 후 `window.__SPC_CHART_PERF__`를 읽어 임계값을 검증하는 spec을 작성한다.

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- chartPerfMonitor.test.js`
Expected: FAIL because helper does not exist yet.

Run: `npx playwright test e2e/chart-performance.spec.js`
Expected: FAIL because perf state is not exposed yet.

### Task 2: 런타임 성능 훅을 구현한다

**Files:**
- Create: `spc_front/src/features/chart/chartPerfMonitor.js`
- Modify: `spc_front/src/page/Chart.jsx`

**Step 1: Add helper**

- 테스트 플래그 확인
- 전역 상태 생성/갱신
- main/detail/distribution 측정 기록 API 제공

**Step 2: Wire Chart page**

- 메인 차트 준비 완료 시 helper 기록
- detail 전환 시작/완료 기록
- 기존 distribution perf finalize 시 helper도 같이 기록

**Step 3: Run targeted unit test**

Run: `npm run test:unit -- chartPerfMonitor.test.js`
Expected: PASS

### Task 3: preview 기반 Playwright 성능 테스트를 구현한다

**Files:**
- Modify: `spc_front/playwright.config.js`
- Modify: `spc_front/e2e/chart-performance.spec.js`

**Step 1: Use preview server**

- webServer command를 `build + preview`로 변경한다.

**Step 2: Prepare deterministic chart page**

- `addInitScript`로 perf flag와 chart route state를 주입한다.
- `page.route()`로 차트 관련 API를 mock한다.

**Step 3: Assert thresholds**

- main/detail/distribution/cached distribution의 실제 ms를 읽어 임계값 이하인지 검증한다.

**Step 4: Run targeted E2E**

Run: `npx playwright test e2e/chart-performance.spec.js`
Expected: PASS

### Task 4: 문서 반영과 전체 검증

**Files:**
- Modify: `README.md`

**Step 1: Update docs**

- preview 기반 성능 E2E 실행 방법과 측정 대상 임계값을 추가한다.

**Step 2: Run full frontend verification**

Run: `npm run test:unit`
Expected: PASS

Run: `npm run test:e2e`
Expected: PASS

Run: `npm run build`
Expected: PASS

**Step 3: Summarize next tuning target**

- 측정 결과 기반으로 다음 병목 분리 작업(fetch/build/mount 분리)을 남은 TODO로 정리한다.
