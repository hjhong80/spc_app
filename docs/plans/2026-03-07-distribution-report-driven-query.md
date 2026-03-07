# Distribution Report-Driven Query Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `distribution` 대량 조회가 `insp_report_tb` 기간 필터를 먼저 타도록 SQL 조인 시작점을 바꾼다.

**Architecture:** 메타 1건 조회 구조는 유지하고, 대량 측정값 조회만 `irt -> idt` 경로로 재구성한다. EXPLAIN과 성능 테스트로 조인 순서와 실제 효과를 함께 검증한다.

**Tech Stack:** Spring Boot, MyBatis, MySQL, JUnit 5, Testcontainers

---

### Task 1: EXPLAIN failing test 추가

**Files:**
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\spc_back\src\test\java\com\spc\spc_back\service\spcdata\ReportServiceDistributionPerformanceIntegrationTest.java`

**Step 1: Write the failing test**

- EXPLAIN 테스트가 `irt`의 `idx_insp_report_dt_report` 사용을 요구하도록 바꾼다.
- 필요하면 테이블 순서 assertion도 `irt`, `idt` 기준으로 강화한다.

**Step 2: Run test to verify it fails**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest#distribution조회쿼리는의도한인덱스를사용한다 test`
Expected: FAIL because current SQL still starts from `idt`.

### Task 2: mapper SQL 재작성

**Files:**
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\spc_back\src\main\resources\mapper\inspection_data_mapper.xml`

**Step 1: Write minimal implementation**

- `selectDistributionMeasuredValueListByCharIdAndPeriod`를 `irt STRAIGHT_JOIN idt` 형태로 변경한다.

**Step 2: Run targeted test**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest#distribution조회쿼리는의도한인덱스를사용한다 test`
Expected: PASS

### Task 3: 성능/기능 회귀 확인

**Files:**
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\README.md`

**Step 1: Run distribution test set**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml "-Dtest=ReportServiceDistributionTest,ReportServiceDistributionIntegrationTest,ReportServiceDistributionPerformanceIntegrationTest" test`
Expected: PASS

**Step 2: Update docs**

- README에 `distribution` 조회가 기간 필터 중심 조인으로 한 번 더 최적화되었음을 반영한다.

### Task 4: 최종 검증

**Files:**
- None

**Step 1: Run final verification**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml test`
Expected: PASS
