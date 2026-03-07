# Distribution Query Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `distribution` 조회를 메타 조회와 대량 측정값 조회로 분리해 fetch 비용과 SQL 정렬 비용을 줄인다.

**Architecture:** `char_tb` 메타는 1건 조회로 분리하고, 대량 fetch는 `insp_data_tb + insp_report_tb`만 조회한다. 정렬은 SQL이 아니라 서비스에서 일관되게 수행해 응답 의미를 유지한다.

**Tech Stack:** Spring Boot, MyBatis, MySQL, JUnit 5, Testcontainers

---

### Task 1: failing test로 새 조회 구조를 고정

**Files:**
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\spc_back\src\test\java\com\spc\spc_back\service\spcdata\ReportServiceDistributionPerformanceIntegrationTest.java`
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\spc_back\src\test\java\com\spc\spc_back\service\spcdata\ReportServiceDistributionIntegrationTest.java`

**Step 1: Write the failing test**

- EXPLAIN 테스트를 새 대량 조회 SQL 기준으로 바꾼다.
- 필요하면 메타 조회가 별도로 존재함을 확인하는 assertion을 추가한다.
- distribution 기능 테스트에서 기존 응답 계약이 유지되는지 확인한다.

**Step 2: Run test to verify it fails**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest,ReportServiceDistributionIntegrationTest test`
Expected: FAIL because mapper/repository/service가 아직 새 구조를 지원하지 않는다.

### Task 2: mapper와 repository를 최소 변경으로 분리

**Files:**
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\spc_back\src\main\resources\mapper\inspection_data_mapper.xml`
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\spc_back\src\main\java\com\spc\spc_back\repository\InspectionDataRepository.java`

**Step 1: Write minimal implementation**

- `selectDistributionMetaByCharId`
- `selectDistributionMeasuredValueListByCharIdAndPeriod`
- repository 메서드 추가

**Step 2: Run targeted test**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest test`
Expected: EXPLAIN 또는 통합 테스트가 일부만 더 진행되고, 서비스 계층 때문에 아직 실패할 수 있다.

### Task 3: service를 새 조회 구조로 전환

**Files:**
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\spc_back\src\main\java\com\spc\spc_back\service\spcdata\ReportService.java`

**Step 1: Write minimal implementation**

- 메타 1건 조회
- 측정값 목록 조회
- Java 정렬 유지
- 기존 응답 DTO 조립 유지

**Step 2: Run targeted test**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest,ReportServiceDistributionIntegrationTest test`
Expected: PASS

### Task 4: 문서와 최종 검증

**Files:**
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\README.md`

**Step 1: Update docs**

- distribution 최적화 내용
- EXPLAIN 테스트가 이제 대량 조회 SQL 기준임을 명시

**Step 2: Run final verification**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml test`
Expected: PASS, distribution 성능 로그가 유지되며 회귀가 없어야 한다.
