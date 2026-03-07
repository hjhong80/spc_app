# Distribution EXPLAIN Plan Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** distribution SQL의 EXPLAIN 실행 계획에서 의도한 테이블/인덱스 사용을 테스트로 고정한다.

**Architecture:** 기존 `ReportServiceDistributionPerformanceIntegrationTest`에 `JdbcTemplate` 기반 EXPLAIN 테스트를 추가한다. 전체 실행 계획 문자열이 아니라 핵심 컬럼(`table`, `type`, `key`)만 assertion 하여 환경 차이에 덜 민감하게 만든다.

**Tech Stack:** Spring Boot Test, JUnit 5, Testcontainers MySQL, JdbcTemplate, MySQL EXPLAIN

---

### Task 1: EXPLAIN 테스트 추가

**Files:**
- Modify: `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionPerformanceIntegrationTest.java`

**Step 1: Write the failing test**

- 테스트 이름 예시:
  - `distribution조회쿼리는의도한인덱스를사용한다`
- assertion:
  - `idt`, `irt`, `ct`가 계획에 등장
  - `idx_insp_data_char_report_data` 사용
  - `idx_insp_report_dt_report` 사용
  - `type != ALL`

**Step 2: Run test to verify it fails**

Run: `./mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest#distribution조회쿼리는의도한인덱스를사용한다 test`

Expected: FAIL because EXPLAIN test/helper is not implemented yet.

**Step 3: Write minimal implementation**

- `JdbcTemplate.queryForList(...)`로 EXPLAIN 실행
- `table`, `type`, `key`, `Extra`를 읽는 helper 추가
- 최소 assertion을 통과할 만큼만 구현

**Step 4: Run test to verify it passes**

Run: `./mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest#distribution조회쿼리는의도한인덱스를사용한다 test`

Expected: PASS

**Step 5: Commit**

```bash
git add spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionPerformanceIntegrationTest.java
git commit -m "test: lock distribution explain plan"
```

### Task 2: 성능 테스트와 전체 테스트 재검증

**Files:**
- Modify: `README.md`

**Step 1: Write the failing doc change**

- README에 EXPLAIN 테스트 목적을 적을 위치를 정한다.

**Step 2: Run target verification**

Run: `./mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest test`

Expected: PASS

**Step 3: Write minimal documentation**

- EXPLAIN 테스트가 인덱스 반영 여부를 검증한다는 점 추가

**Step 4: Run final verification**

Run: `./mvnw.cmd -f spc_back/pom.xml test`

Expected: PASS

**Step 5: Commit**

```bash
git add README.md spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionPerformanceIntegrationTest.java
git commit -m "docs: describe distribution explain verification"
```
