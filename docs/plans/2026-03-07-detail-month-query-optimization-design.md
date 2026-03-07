# Detail Month Query Optimization Design

## 작업 목적

`ReportServiceDetailPerformanceIntegrationTest`에서 확인된 `detail` 월조회 병목 중 `fetch` 비용과 `Using filesort`를 줄이기 위해, 월조회 전용 SQL 경로를 추가한다.

## 현재 상태

- `detail` 월조회는 현재 다음 순서로 동작한다.
  1. `selectInspectionReportListByProjId(projId)`로 프로젝트 전체 성적서 조회
  2. `selectInspectionDataListByCharId(charId)`로 특성 전체 측정값 조회
  3. Java에서 `insp_report_id` 기준 join
  4. Java에서 월 필터/정렬/일별 bucket 집계
- 최신 성능 로그 기준 `fetch`가 `aggregate`보다 훨씬 크다.
- EXPLAIN 기준 `selectInspectionDataListByCharId`는 `Using filesort`를 남긴다.

## 접근안 비교

### 1. 최소 변경안

기존 `selectInspectionDataListByCharId`에서 `ORDER BY`만 제거하고 Java 정렬만 유지한다.

- 장점: 수정 범위가 작다.
- 단점: `projId`, 기간 필터가 SQL에 반영되지 않아 fetch 병목 개선이 제한적이다.

### 2. 선택안

`detail month` 전용 SQL을 새로 추가하고, 월조회는 필요한 row만 SQL에서 바로 가져오게 바꾼다.

- 장점: `projId + charId + month 기간` 필터를 SQL에서 먼저 적용할 수 있다.
- 장점: `report 전체 조회 + data 전체 조회 + Java join` 구조를 제거할 수 있다.
- 장점: EXPLAIN 기준 `Using filesort`와 fetch 병목을 같이 다룰 수 있다.
- 단점: 월조회와 일조회 경로가 일부 분리된다.

### 3. SQL 집계 대수술안

일별 bucket 집계까지 SQL에서 `GROUP BY DATE(insp_dt)`로 처리한다.

- 장점: 가장 큰 fetch 감소 가능성이 있다.
- 단점: 응답 계약과 검증 복잡도가 커지고 지금 단계에는 과하다.

선택은 2번이다.

## 설계

### 새 mapper 조회

- 파일: `spc_back/src/main/resources/mapper/inspection_data_mapper.xml`
- 새 쿼리:
  - `selectMonthDetailSourceListByProjIdAndCharIdAndPeriod`
- 조회 컬럼:
  - `charId`, `charNo`, `axis`, `nominal`, `uTol`, `lTol`
  - `measuredValue`
  - `inspReportId`, `serialNo`, `inspDt`
- 조인 전략:
  - `insp_report_tb`를 `proj_id + 기간`으로 먼저 좁힘
  - `insp_data_tb`를 `insp_report_id + char_id` 기준으로 조인
  - 필요한 특성 메타는 `char_tb` 한 번 조인

### 서비스 분기

- 파일: `spc_back/src/main/java/com/spc/spc_back/service/spcdata/ReportService.java`
- `getCharacteristicChartDetail(...)`에서:
  - `month`일 때는 새 month 전용 SQL 경로 사용
  - `day`일 때는 기존 `reportList + inspectionDataList` 구조 유지
- Java 쪽은 새 source row 목록을 날짜별로 bucket만 묶는다.
- 기존 DTO 계약은 유지한다.

### 테스트

- `ReportServiceDetailPerformanceIntegrationTest`
  - EXPLAIN을 새 month 전용 SQL 기준으로 갱신
  - `Using filesort` 제거 여부 확인
  - 성능 로그 `total/fetch/aggregate` 재측정
- `ReportServiceDetailIntegrationTest`
  - 월조회 응답 계약이 기존과 같은지 유지 확인

## 반영 범위

- `spc_back/src/main/resources/mapper/inspection_data_mapper.xml`
- `spc_back/src/main/java/com/spc/spc_back/service/spcdata/ReportService.java`
- 필요 시 `InspectionDataRepository` 연계 코드
- `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDetailPerformanceIntegrationTest.java`
- `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDetailIntegrationTest.java`
- `README.md`

## 검증 계획

1. 성능/EXPLAIN 테스트를 먼저 실패시키고, 새 SQL 경로가 필요함을 확인한다.
2. month 전용 SQL과 서비스 분기를 구현한다.
3. targeted `ReportServiceDetailIntegrationTest`, `ReportServiceDetailPerformanceIntegrationTest`를 통과시킨다.
4. 마지막에 전체 `mvnw.cmd test`를 fresh run 한다.
