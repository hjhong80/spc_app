# ReportService Distribution Performance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `ReportService.getCharacteristicDistribution(...)`에 대해 1만 샘플 기준 성능 베이스라인 통합 테스트를 추가한다.

**Architecture:** 기존 기능 정확성 통합 테스트와 분리된 별도 성능 통합 테스트 클래스를 만든다. 테스트는 Testcontainers MySQL 위에서 대상 데이터 1만건을 준비한 뒤 `warm-up 1회 + 실측 3회`로 전체 서비스 호출 시간을 측정한다.

**Tech Stack:** Spring Boot Test, JUnit 5, Testcontainers MySQL, MyBatis, AssertJ

---

### Task 1: 성능 테스트 골격 추가

**Files:**
- Create: `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionPerformanceIntegrationTest.java`
- Modify: `README.md`

**Step 1: Write the failing test**

- `ReportServiceDistributionPerformanceIntegrationTest`를 만든다.
- `@SpringBootTest`, `@Testcontainers`, `@Sql(schema.sql)` 기반으로 골격을 작성한다.
- 테스트 이름은 예를 들어 `distribution월조회는1만샘플기준성능임계값이내여야한다`로 둔다.
- 첫 버전에서는 fixture 준비 메서드 호출 후 `sampleCount == 10000`과 `elapsedMs <= 1500`를 기대한다.

**Step 2: Run test to verify it fails**

Run: `./mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest test`

Expected: FAIL because fixture builder/helper or test setup is missing.

**Step 3: Write minimal implementation**

- 테스트 내부에 프로젝트/특성/성적서/측정값 대량 데이터를 넣는 helper를 작성한다.
- `warm-up` 1회 후 실측 3회를 수행하는 측정 helper를 만든다.
- 최종 기준값은 중앙값 또는 최솟값 중 설계와 일치하는 방식으로 계산한다.

**Step 4: Run test to verify it passes**

Run: `./mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest test`

Expected: PASS with measured ms log output.

**Step 5: Commit**

```bash
git add spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionPerformanceIntegrationTest.java README.md
git commit -m "test: add distribution performance integration test"
```

### Task 2: 대량 fixture 안정화

**Files:**
- Modify: `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionPerformanceIntegrationTest.java`
- Optional Create: `spc_back/src/test/resources/report_distribution_performance_seed.sql`

**Step 1: Write the failing test**

- 노이즈 데이터가 없는 상태와 있는 상태를 구분하는 assertion을 추가한다.
- 대상 `charId=101` 외 데이터가 섞여도 `sampleCount`가 정확히 `10000`인지 검증한다.

**Step 2: Run test to verify it fails**

Run: `./mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest test`

Expected: FAIL because current fixture is insufficient or unfiltered.

**Step 3: Write minimal implementation**

- 다른 `charId`, 다른 `projId` 노이즈 데이터를 소량 추가한다.
- 필요하면 bulk insert 로직을 정리해 테스트 가독성을 유지한다.

**Step 4: Run test to verify it passes**

Run: `./mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest test`

Expected: PASS with exact `sampleCount=10000`.

**Step 5: Commit**

```bash
git add spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionPerformanceIntegrationTest.java spc_back/src/test/resources/report_distribution_performance_seed.sql
git commit -m "test: stabilize distribution performance fixtures"
```

### Task 3: 문서 반영 및 전체 검증

**Files:**
- Modify: `README.md`

**Step 1: Write the failing doc change**

- `README.md`에 백엔드 성능 테스트 실행 명령과 목적을 추가할 위치를 정한다.

**Step 2: Run target verification**

Run: `./mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest test`

Expected: PASS before final doc update.

**Step 3: Write minimal documentation**

- 성능 테스트 목적
- Docker/Testcontainers 필요 조건
- 실행 명령
- 임계값 기준(`10000 samples`, `1500ms`)

**Step 4: Run final verification**

Run: `./mvnw.cmd -f spc_back/pom.xml test`

Expected: PASS

**Step 5: Commit**

```bash
git add README.md spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionPerformanceIntegrationTest.java
git commit -m "docs: document distribution performance baseline test"
```
