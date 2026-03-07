# Detail Month Query Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `detail` 월조회가 month 전용 SQL 경로를 사용하도록 바꿔 fetch 병목과 `Using filesort`를 줄인다.

**Architecture:** `inspection_data_mapper.xml`에 월조회 전용 row source SQL을 추가하고, `ReportService`는 `month`일 때 그 경로만 사용한다. 일조회는 기존 경로를 유지해 변경 범위를 제한한다.

**Tech Stack:** Spring Boot, MyBatis, MySQL, JUnit 5, Testcontainers

---

### Task 1: 성능/EXPLAIN 테스트를 새 month 전용 경로 기준으로 red 상태로 만든다

**Files:**
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\spc_back\src\test\java\com\spc\spc_back\service\spcdata\ReportServiceDetailPerformanceIntegrationTest.java`

**Step 1: Write the failing test**

- EXPLAIN 대상 쿼리를 새 month 전용 SQL 기대 형태로 바꾼다.
- `Using filesort`가 없어야 하고, `proj_id + 기간 + char_id` 필터가 SQL에서 처리되어야 함을 assertion으로 표현한다.

**Step 2: Run targeted test to verify it fails**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDetailPerformanceIntegrationTest test`
Expected: FAIL because production mapper/service does not yet provide the new month query path.

### Task 2: month 전용 SQL과 서비스 분기를 구현한다

**Files:**
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\spc_back\src\main\resources\mapper\inspection_data_mapper.xml`
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\spc_back\src\main\java\com\spc\spc_back\service\spcdata\ReportService.java`
- Modify: repository 연계 파일들

**Step 1: Write minimal implementation**

- month 전용 mapper query 추가
- `ReportService.getCharacteristicChartDetail(...)`에서 `month`면 새 query 사용
- month 조립 로직은 새 row source를 바로 bucket으로 묶도록 단순화

**Step 2: Run targeted tests**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDetailIntegrationTest,ReportServiceDetailPerformanceIntegrationTest test`
Expected: PASS

### Task 3: 문서와 전체 검증

**Files:**
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\README.md`

**Step 1: Update docs**

- detail month 조회가 전용 SQL 경로를 사용한다는 점과 성능 테스트 기준을 기록한다.

**Step 2: Run final verification**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml test`
Expected: PASS with improved detail fetch/explain characteristics
