# ReportService Distribution 통합 테스트 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `ReportService.getCharacteristicDistribution(...)`를 Testcontainers MySQL 환경에서 통합 테스트로 검증한다.

**Architecture:** 새 통합 테스트 클래스가 MySQL 컨테이너를 띄우고, `@Sql`로 최소 schema/data를 주입한 뒤 실제 `ReportService -> Repository -> Mapper` 경로를 호출한다. 기존 Mockito 테스트는 유지하고, SQL 경로 검증은 별도 통합 테스트로 분리한다.

**Tech Stack:** Spring Boot Test, JUnit 5, MyBatis, Testcontainers, MySQL

---

### Task 1: distribution 통합 테스트를 먼저 작성한다

**Files:**
- Create: `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionIntegrationTest.java`
- Create: `spc_back/src/test/resources/schema.sql`
- Create: `spc_back/src/test/resources/data.sql`

**Step 1: Write the failing test**

- 월 기준 distribution 조회 테스트를 작성한다.
- 일 기준 distribution 조회 테스트를 작성한다.
- 실제 DB fixture를 전제로 기대값을 고정한다.

**Step 2: Run test to verify it fails**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=ReportServiceDistributionIntegrationTest test`
Expected: FAIL with missing Testcontainers dependency or missing schema/data

**Step 3: Write minimal implementation**

- 통합 테스트 클래스와 fixture SQL을 추가한다.
- `@Sql`과 `@DynamicPropertySource`로 MySQL 컨테이너를 연결한다.

**Step 4: Run test to verify it passes**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=ReportServiceDistributionIntegrationTest test`
Expected: PASS

### Task 2: Testcontainers 의존성과 테스트 설정을 추가한다

**Files:**
- Modify: `spc_back/pom.xml`

**Step 1: Write the failing verification target**

- 통합 테스트가 Testcontainers 클래스를 참조하도록 작성해 현재 의존성 부족으로 실패하게 둔다.

**Step 2: Run test to verify it fails**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=ReportServiceDistributionIntegrationTest test`
Expected: FAIL with missing container classes or datasource init issues

**Step 3: Write minimal implementation**

- `org.testcontainers:junit-jupiter`
- `org.testcontainers:mysql`
- 필요한 경우 `testcontainers-bom` 또는 명시 버전을 추가한다.

**Step 4: Run test to verify it passes**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=ReportServiceDistributionIntegrationTest test`
Expected: PASS

### Task 3: 최종 검증

**Files:**
- Modify: 없음

**Step 1: Run targeted integration verification**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=ReportServiceDistributionIntegrationTest test`
Expected: PASS

**Step 2: Run broader backend verification**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml test`
Expected: PASS

**Step 3: Summarize results**

- 추가한 fixture, 검증한 SQL 경로, 남은 테스트 공백을 정리한다.
