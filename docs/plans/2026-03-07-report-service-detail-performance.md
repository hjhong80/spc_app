# Report Service Detail Performance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 월단위 `detail` 조회의 성능 베이스라인, 분리 계측, EXPLAIN 기준을 추가한다.

**Architecture:** Testcontainers MySQL 기반 통합 테스트에서 `1만 샘플` 조건을 만들고, `total/fetch/aggregate`를 분리 측정한다. EXPLAIN은 `report` 조회와 `inspection data` 조회의 핵심 인덱스/풀스캔 여부만 고정한다.

**Tech Stack:** Spring Boot Test, JUnit 5, Testcontainers, JdbcTemplate, MyBatis

---

### Task 1: failing performance/EXPLAIN test 추가

**Files:**
- Create: `C:\Users\USER\Documents\MyProjects\spc_project\spc_back\src\test\java\com\spc\spc_back\service\spcdata\ReportServiceDetailPerformanceIntegrationTest.java`

**Step 1: Write the failing test**

- month detail total 성능 테스트
- split(fetch/aggregate) 테스트
- EXPLAIN 테스트

**Step 2: Run test to verify it fails**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDetailPerformanceIntegrationTest test`
Expected: FAIL because 테스트/seed/helper가 아직 완성되지 않았다.

### Task 2: 최소 구현으로 테스트 통과

**Files:**
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\spc_back\src\test\java\com\spc\spc_back\service\spcdata\ReportServiceDetailPerformanceIntegrationTest.java`

**Step 1: Write minimal implementation**

- bulk seed helper
- `measureDetailSplit()` helper
- month bucket 기대값 계산 helper
- EXPLAIN helper

**Step 2: Run targeted test**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDetailPerformanceIntegrationTest test`
Expected: PASS

### Task 3: 문서 반영과 회귀 확인

**Files:**
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\README.md`

**Step 1: Update docs**

- detail 성능 테스트 실행 방법
- split/EXPLAIN 의미

**Step 2: Run final verification**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml test`
Expected: PASS

### Task 4: 다음 단계 준비

**Files:**
- None

**Step 1: Capture outcomes**

- 최종 로그에서 detail 성능 중앙값과 EXPLAIN 결과를 기록한다.
- 다음 단계인 Thymeleaf/SpringDoc 테스트 로그 경고 정리로 넘어갈 기준을 정리한다.
