# 프론트엔드 의존성 취약점 정리 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 프론트엔드 `npm audit` 결과를 0에 가깝게 줄이고, 변경 후 테스트와 빌드가 유지되도록 한다.

**Architecture:** 직접 의존성은 명시적으로 상향하고, 전이 취약점은 가능한 경우 상위 도구 업데이트로 해소한다. 남는 취약점만 `overrides`로 통제해 lockfile을 갱신하고, 마지막에 audit과 테스트와 빌드를 한 번씩 검증한다.

**Tech Stack:** npm, Vite, Vitest, Playwright

---

### Task 1: 취약점 유발 패키지 버전을 조정한다

**Files:**
- Modify: `spc_front/package.json`

**Step 1: Write the failing verification target**

- 취약점 해소 버전을 참조하는 `package.json` 변경을 먼저 반영한다.
- 설치 전 상태에서는 lockfile과 실제 해상 결과가 아직 맞지 않게 둔다.

**Step 2: Run test to verify it fails**

Run: `Push-Location spc_front; npm.cmd audit; Pop-Location`
Expected: FAIL with existing vulnerabilities still present

**Step 3: Write minimal implementation**

- `axios`를 안전 버전으로 상향한다.
- `vite`를 필요한 경우 안전 범위로 상향한다.
- 필요한 `overrides` 초안을 추가한다.

**Step 4: Run test to verify it passes**

Run: `Push-Location spc_front; npm.cmd install; npm.cmd audit; Pop-Location`
Expected: vulnerabilities reduced or only residual items remain

### Task 2: 남는 전이 취약점을 overrides로 정리한다

**Files:**
- Modify: `spc_front/package.json`
- Modify: `spc_front/package-lock.json`

**Step 1: Write the failing verification target**

- 첫 설치 후에도 남는 `ajv`, `minimatch`, `markdown-it`, `rollup` 취약점이 있으면 그 결과를 기준으로 override가 필요함을 확인한다.

**Step 2: Run test to verify it fails**

Run: `Push-Location spc_front; npm.cmd audit; Pop-Location`
Expected: FAIL with residual transitive vulnerabilities

**Step 3: Write minimal implementation**

- 필요한 최소 `overrides`만 추가한다.
- lockfile을 갱신해 실제 설치 결과를 일치시킨다.

**Step 4: Run test to verify it passes**

Run: `Push-Location spc_front; npm.cmd install; npm.cmd audit; Pop-Location`
Expected: audit clean or near-zero with explicit residual explanation

### Task 3: 최종 검증

**Files:**
- Modify: 없음

**Step 1: Run audit verification**

Run: `Push-Location spc_front; npm.cmd audit; Pop-Location`
Expected: clean or clearly reduced results

**Step 2: Run unit and E2E verification**

Run: `Push-Location spc_front; npm.cmd run test:unit; npm.cmd run test:e2e; Pop-Location`
Expected: PASS

**Step 3: Run build verification**

Run: `Push-Location spc_front; npm.cmd run build; Pop-Location`
Expected: PASS

**Step 4: Summarize results**

- 해소된 취약점, 남은 취약점, 적용한 overrides, 회귀 여부를 정리한다.
