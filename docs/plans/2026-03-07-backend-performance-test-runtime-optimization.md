# Backend Performance Test Runtime Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 백엔드 성능 테스트 2개의 중복 컨테이너/fixture 준비를 줄여 전체 `mvnw test` 실행 시간을 단축한다.

**Architecture:** 공통 성능 테스트 베이스에서 Testcontainers datasource 구성을 공유하고, 각 성능 테스트 클래스는 schema/data/대량 seed를 클래스 단위 1회만 준비한다. 측정 로직과 임계값은 유지해 성능 회귀 탐지 의미를 보존한다.

**Tech Stack:** Spring Boot Test, Testcontainers MySQL, JdbcTemplate, JUnit 5

---

### Task 1: 공통 성능 테스트 베이스 추가

**Files:**
- Create: `C:\Users\USER\Documents\MyProjects\spc_project\spc_back\src\test\java\com\spc\spc_back\service\spcdata\AbstractReportPerformanceIntegrationTest.java`

**Step 1: Write the failing test**

- 기존 성능 테스트 클래스 중 하나를 베이스 상속 구조로 바꿀 준비를 한다.
- 베이스에서 `mysql`과 `DynamicPropertySource`를 제공하도록 설계한다.

**Step 2: Run targeted test to verify current structure still depends on per-class setup**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest test`
Expected: PASS but still uses existing per-class container/setup

**Step 3: Write minimal implementation**

- 공통 베이스에 singleton-style `MySQLContainer`, datasource property registration, SQL script 실행 helper를 추가한다.

### Task 2: 분포 성능 테스트를 클래스 단위 one-time setup으로 전환

**Files:**
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\spc_back\src\test\java\com\spc\spc_back\service\spcdata\ReportServiceDistributionPerformanceIntegrationTest.java`

**Step 1: Write the failing test**

- one-time seed를 전제로 중복 seed 없이도 기존 4개 테스트가 통과해야 한다는 구조로 바꾼다.

**Step 2: Run targeted test to verify it fails if setup is incomplete**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest test`
Expected: FAIL if schema/data/seed one-time setup is not yet complete

**Step 3: Write minimal implementation**

- 베이스 상속으로 전환
- `@Sql` 제거 또는 메서드 단위 반복 적용 방지
- `@BeforeAll` 기반 클래스 단위 setup에서 schema/data와 seed를 한 번만 적용

**Step 4: Run targeted test**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest test`
Expected: PASS with reduced runtime

### Task 3: 상세 성능 테스트를 클래스 단위 one-time setup으로 전환

**Files:**
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\spc_back\src\test\java\com\spc\spc_back\service\spcdata\ReportServiceDetailPerformanceIntegrationTest.java`

**Step 1: Write the failing test**

- one-time seed를 전제로 중복 seed 없이도 기존 3개 테스트가 통과해야 한다는 구조로 바꾼다.

**Step 2: Run targeted test to verify it fails if setup is incomplete**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDetailPerformanceIntegrationTest test`
Expected: FAIL if schema/data/seed one-time setup is not yet complete

**Step 3: Write minimal implementation**

- 베이스 상속으로 전환
- `@Sql` 제거 또는 메서드 단위 반복 적용 방지
- `@BeforeAll` 기반 클래스 단위 setup에서 schema/data와 seed를 한 번만 적용

**Step 4: Run targeted test**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDetailPerformanceIntegrationTest test`
Expected: PASS with reduced runtime

### Task 4: 문서와 전체 검증

**Files:**
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\README.md`

**Step 1: Update docs**

- 성능 테스트는 공통 Testcontainers 베이스와 클래스 단위 one-time seed를 사용한다고 기록한다.

**Step 2: Run final verification**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml test`
Expected: PASS and lower total runtime than the previous ~6m51s baseline
