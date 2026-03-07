# Distribution Fetch Index Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** distribution fetch 병목을 줄이기 위해 실서비스 스키마와 테스트 스키마에 인덱스를 추가하고 성능 테스트로 재검증한다.

**Architecture:** `distribution` 쿼리의 필터/정렬 축에 맞춘 인덱스를 `insp_data_tb`와 `insp_report_tb`에 추가한다. 프로덕션 mapper SQL은 기능을 바꾸지 않는 범위에서 유지하고, 기존 분리 계측 테스트로 `fetchMedianMs` 변화를 확인한다.

**Tech Stack:** MyBatis XML, MySQL DDL, Spring Boot Test, Testcontainers MySQL

---

### Task 1: 실서비스 스키마/마이그레이션 위치 확인 및 인덱스 설계 반영

**Files:**
- Modify: 실서비스 DDL 또는 마이그레이션 파일
- Modify: `spc_back/src/test/resources/schema.sql`

**Step 1: Write the failing test**

- 기존 성능 테스트를 기준으로 인덱스가 아직 없는 상태를 확인한다.
- 필요하면 테스트 이름이나 로그 비교 포인트를 명확히 적는다.

**Step 2: Run test to verify current baseline**

Run: `./mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest test`

Expected: PASS with current baseline logs.

**Step 3: Write minimal implementation**

- `insp_data_tb(char_id, insp_report_id, insp_data_id)` 인덱스 추가
- `insp_report_tb(insp_dt, insp_report_id)` 인덱스 추가
- 테스트 schema에도 동일 반영

**Step 4: Run test to verify it still passes**

Run: `./mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest test`

Expected: PASS with improved or at least non-regressed fetch timings.

**Step 5: Commit**

```bash
git add spc_back/src/test/resources/schema.sql <real-ddl-or-migration-files>
git commit -m "perf: add distribution fetch indexes"
```

### Task 2: 문서와 결과 정리

**Files:**
- Modify: `README.md`

**Step 1: Write the failing doc change**

- README에 분포 성능 최적화 내용과 인덱스 전략을 추가할 위치를 정한다.

**Step 2: Run target verification**

Run: `./mvnw.cmd -f spc_back/pom.xml -Dtest=ReportServiceDistributionPerformanceIntegrationTest test`

Expected: PASS

**Step 3: Write minimal documentation**

- distribution fetch 병목이 인덱스 기준으로 조정되었다는 점
- 테스트로 `fetch/aggregate`를 계속 관찰할 수 있다는 점

**Step 4: Run final verification**

Run: `./mvnw.cmd -f spc_back/pom.xml test`

Expected: PASS

**Step 5: Commit**

```bash
git add README.md spc_back/src/test/resources/schema.sql <real-ddl-or-migration-files>
git commit -m "docs: document distribution index optimization"
```
