# 세부 정규분포 성능 최적화 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 세부 차트 정규분포 전환 시 응답/계산 캐시를 도입해 같은 조합 재진입 시 지연을 줄이고, 이후 README와 `.gitignore` 정리까지 마무리한다.

**Architecture:** `Chart.jsx`에 응답 캐시와 계산 캐시를 추가하고, 캐시 키 생성은 별도 helper로 분리한다. 정규분포 토글 전환은 `startTransition`으로 처리하며, 마지막에 문서와 ignore 규칙을 현재 상태에 맞춰 정리한다.

**Tech Stack:** React 19, Vite, Vitest, Playwright

---

### Task 1: 캐시 키 helper를 TDD로 추가한다

**Files:**
- Create: `spc_front/src/features/chart/detailDistributionCache.js`
- Create: `spc_front/src/features/chart/detailDistributionCache.test.js`

**Step 1: Write the failing test**

- 같은 `charId + scale + baseDate` 조합이 같은 응답 키를 만드는 테스트를 작성한다.
- `curveMode`와 `pointMode`가 다른 경우 계산 키가 달라지는 테스트를 작성한다.

**Step 2: Run test to verify it fails**

Run: `Push-Location spc_front; npm.cmd run test:unit -- src/features/chart/detailDistributionCache.test.js; Pop-Location`
Expected: FAIL with missing helper module

**Step 3: Write minimal implementation**

- 응답 캐시 키 생성 helper를 추가한다.
- 계산 캐시 키 생성 helper를 추가한다.

**Step 4: Run test to verify it passes**

Run: `Push-Location spc_front; npm.cmd run test:unit -- src/features/chart/detailDistributionCache.test.js; Pop-Location`
Expected: PASS

### Task 2: Chart.jsx에 정규분포 응답/계산 캐시를 연결한다

**Files:**
- Modify: `spc_front/src/page/Chart.jsx`

**Step 1: Write the failing test target**

- 새 helper import와 캐시 참조를 연결해, 캐시 구현이 없으면 빌드가 깨지는 상태를 만든다.

**Step 2: Run test to verify it fails**

Run: `Push-Location spc_front; npm.cmd run test:unit; Pop-Location`
Expected: FAIL until helper import와 캐시 로직이 정합해진다

**Step 3: Write minimal implementation**

- `useRef(Map)` 기반 응답 캐시와 계산 캐시를 추가한다.
- fetch 전에 응답 캐시를 확인하고, 있으면 즉시 사용한다.
- 계산 전에 계산 캐시를 확인하고, 있으면 재사용한다.
- 정규분포 토글 전환을 `startTransition`으로 처리한다.

**Step 4: Run test to verify it passes**

Run: `Push-Location spc_front; npm.cmd run test:unit; Pop-Location`
Expected: PASS

### Task 3: README와 ignore 규칙을 현재 상태로 정리한다

**Files:**
- Modify: `README.md`
- Modify: `.gitignore`
- Modify: `spc_front/.gitignore`

**Step 1: Write the failing verification target**

- 현재 README에 테스트 도입 및 검증 명령이 빠진 상태를 확인한다.
- 루트 `.gitignore`가 루트 업로드 기준 생성물을 충분히 무시하지 않는 상태를 확인한다.

**Step 2: Run test to verify it fails**

Run: `Push-Location spc_front; npm.cmd run build; Pop-Location`
Expected: PASS but docs/ignore still outdated by inspection

**Step 3: Write minimal implementation**

- README에 프론트 테스트 실행 방법과 최근 반영 사항을 추가한다.
- 루트 `.gitignore`에 루트 업로드 기준 생성물 무시 규칙을 보강한다.
- 프론트 `.gitignore`는 필요한 항목만 유지/보강한다.

**Step 4: Run test to verify it passes**

Run: `Push-Location spc_front; npm.cmd run build; Pop-Location`
Expected: PASS

### Task 4: 최종 검증

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

- 캐시 구조, 문서 정리, ignore 정리, 남은 리스크를 정리한다.
