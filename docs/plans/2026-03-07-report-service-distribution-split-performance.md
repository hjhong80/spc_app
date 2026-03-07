# ReportService Distribution Split Performance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `ReportService distribution` 성능을 `total`, `fetch`, `aggregate`로 분리 계측하는 테스트를 추가한다.

**Architecture:** 기존 `ReportServiceDistributionPerformanceIntegrationTest`에 동일 fixture를 재사용하는 새 테스트를 추가한다. repository fetch와 테스트 내부 aggregate helper를 별도로 측정하고, 중앙값 기준으로 전체 시간과 비교한다.

**Tech Stack:** Spring Boot Test, JUnit 5, Testcontainers MySQL, MyBatis, AssertJ, JdbcTemplate

---

### Task 1: 분리 계측 테스트 추가

**Files:**
- Modify: `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionPerformanceIntegrationTest.java`

**Step 1: Write the failing test**

- 같은 클래스에 새 테스트를 추가한다.
- 테스트 이름 예시: `distribution성능은fetch와aggregate로분리계측할수있다`
- 기대값:
  - `sampleCount == 10000`
  - `fetchMedianMs > 0`
  - `aggregateMedianMs > 0`
  - `fetchMedianMs + aggregateMedianMs <= totalMedianMs + 200`

**Step 2: Run test to verify it fails**

Run: `./mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest test`

Expected: FAIL because split measurement helper and aggregation helper do not exist yet.

**Step 3: Write minimal implementation**

- `InspectionDataRepository` 주입
- 기간 계산 helper
- repository fetch 측정 helper
- 테스트 내부 aggregate helper
- 회차별 `total/fetch/aggregate` 배열 및 중앙값 계산 helper

**Step 4: Run test to verify it passes**

Run: `./mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest test`

Expected: PASS with split perf logs.

**Step 5: Commit**

```bash
git add spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionPerformanceIntegrationTest.java
git commit -m "test: split distribution performance timings"
```

### Task 2: 로그와 문서 정리

**Files:**
- Modify: `README.md`

**Step 1: Write the failing doc change**

- README에 분리 계측 테스트 로그 의미를 설명할 위치를 정한다.

**Step 2: Run target verification**

Run: `./mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest test`

Expected: PASS before doc update.

**Step 3: Write minimal documentation**

- 기존 성능 테스트가 `total` 기준임을 명시
- 새 로그가 `fetch`와 `aggregate` 비중 분석용이라는 점 추가

**Step 4: Run final verification**

Run: `./mvnw.cmd -f spc_back/pom.xml test`

Expected: PASS

**Step 5: Commit**

```bash
git add README.md spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionPerformanceIntegrationTest.java
git commit -m "docs: describe split distribution performance measurements"
```
