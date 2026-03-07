# Distribution, Detail Fallback, Cache Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 분포 API 데이터 격리, month fallback 빈 응답 처리, 프론트 정규분포 캐시 상한을 추가해 업로드 전 마지막 런타임 리스크를 제거한다.

**Architecture:** 백엔드는 `projId`를 실제 `distribution` SQL에 포함시키고, month fallback 에서는 형식 오류와 데이터 없음 경로를 분리한다. 프론트는 정규분포 캐시를 helper 기반 bounded map으로 전환해 무한 성장 리스크를 없앤다.

**Tech Stack:** Spring Boot 4, MyBatis, JUnit 5, React 19, Vitest

---

### Task 1: 백엔드 회귀 테스트 추가

**Files:**
- Modify: `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionIntegrationTest.java`
- Modify: `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDetailIntegrationTest.java`

**Step 1: Write the failing tests**

- `distribution`에서 `projId=1, charId=201` 같은 잘못된 조합이 섞이지 않음을 검증한다.
- `detail month`에서 `projId=1, charId=999 또는 데이터 없는 charId`와 `baseDate=null`일 때 빈 성공 응답을 검증한다.

**Step 2: Run tests to verify they fail**

Run:

```bash
.\spc_back\mvnw.cmd -f spc_back\pom.xml "-Dtest=ReportServiceDistributionIntegrationTest,ReportServiceDetailIntegrationTest" test
```

Expected:

- 현재 구현에서는 분포 격리 또는 month fallback 테스트가 실패

**Step 3: Write minimal implementation**

- repository/mapper/sql에 `projId` 조건 추가
- month fallback 에서 데이터 없음은 빈 리스트 반환

**Step 4: Run tests to verify they pass**

Run:

```bash
.\spc_back\mvnw.cmd -f spc_back\pom.xml "-Dtest=ReportServiceDistributionIntegrationTest,ReportServiceDetailIntegrationTest" test
```

Expected:

- PASS

### Task 2: 프론트 캐시 eviction 테스트 추가

**Files:**
- Modify: `spc_front/src/features/chart/detailDistributionCache.test.js`

**Step 1: Write the failing test**

- bounded cache insert helper가 상한을 넘으면 가장 오래된 key를 제거하는 테스트를 추가한다.

**Step 2: Run test to verify it fails**

Run:

```bash
cd spc_front
npm run test:unit -- detailDistributionCache
```

Expected:

- helper 부재로 FAIL

**Step 3: Write minimal implementation**

- `detailDistributionCache.js`에 bounded insert helper 추가
- `Chart.jsx`가 helper를 사용하게 바꾼다

**Step 4: Run test to verify it passes**

Run:

```bash
cd spc_front
npm run test:unit -- detailDistributionCache
```

Expected:

- PASS

### Task 3: 최종 검증

**Files:**
- Verify only

**Step 1: Run backend tests**

```bash
.\spc_back\mvnw.cmd -f spc_back\pom.xml test
```

**Step 2: Run frontend unit tests**

```bash
cd spc_front
npm run test:unit
```

**Step 3: Run frontend build**

```bash
cd spc_front
npm run build
```

Expected:

- 전체 통과
- 기존 성능/기능 테스트 유지
