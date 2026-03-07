# ReportService Detail 통합 테스트 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `ReportService.getCharacteristicChartDetail(...)`를 Testcontainers MySQL 환경에서 통합 테스트로 검증한다.

**Architecture:** 새 통합 테스트 클래스가 distribution 테스트와 동일한 MySQL 컨테이너/fixture를 재사용하고, 실제 `ReportService`를 호출해 월/일 bucket 결과와 `baseDate` fallback, 형식 검증을 함께 확인한다.

**Tech Stack:** Spring Boot Test, JUnit 5, MyBatis, Testcontainers, MySQL

---

### Task 1: detail 통합 테스트 failing case를 먼저 작성한다

**Files:**
- Create: `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDetailIntegrationTest.java`
- Reuse: `spc_back/src/test/resources/schema.sql`
- Reuse: `spc_back/src/test/resources/data.sql`

**Step 1: Write the failing test**

- `month` happy path 테스트를 작성한다.
- `day` happy path 테스트를 작성한다.
- `baseDate` fallback 테스트를 작성한다.
- 잘못된 `baseDate` 실패 테스트를 작성한다.

**Step 2: Run test to verify it fails**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=ReportServiceDetailIntegrationTest test`
Expected: FAIL because the new integration test class does not exist yet.

**Step 3: Write minimal implementation**

- distribution 테스트와 같은 Testcontainers 설정을 가진 detail 통합 테스트 클래스를 추가한다.
- fixture 기반 기대값을 고정한다.

**Step 4: Run test to verify it passes**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=ReportServiceDetailIntegrationTest test`
Expected: PASS

### Task 2: 결과 구조와 메시지를 최소 범위로 검증한다

**Files:**
- Modify: `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDetailIntegrationTest.java`

**Step 1: Tighten assertions**

- 월 bucket key/label/sampleCount/mean/min/max를 검증한다.
- 일 상세 row의 시간 label, `inspReportId`, `serialNo`를 검증한다.
- 실패 응답의 status/message를 검증한다.

**Step 2: Run targeted verification**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=ReportServiceDetailIntegrationTest test`
Expected: PASS

### Task 3: 문서 정리와 전체 검증

**Files:**
- Modify: `README.md`
- Modify: `.gitignore`
- Modify: `spc_front/.gitignore` (필요 시)

**Step 1: Update docs**

- 백엔드 통합 테스트 실행 방법과 Docker/Testcontainers 전제를 README에 반영한다.
- 업로드 기준 불필요 산출물 ignore가 부족하면 최소 추가한다.

**Step 2: Run full backend verification**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml test`
Expected: PASS

**Step 3: Summarize remaining gaps**

- 아직 통합 테스트가 없는 경로와 다음 후보를 정리한다.
