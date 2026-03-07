# Report Service Detail Performance Design

## 작업 목적

`detail` 월단위 조회에 대해 `distribution`과 같은 수준의 성능 베이스라인과 분리 계측 기준을 만든다.

## 현재 상태

- `getCharacteristicChartDetail(...)`는
  - 프로젝트 전체 `insp_report_tb` 조회
  - 특정 `charId`의 `insp_data_tb` 전체 조회
  - Java에서 join/filter/sort
  - Java에서 month/day bucket 집계
  구조로 동작한다.
- 현재는 기능 통합 테스트만 있고, 성능/EXPLAIN 기준은 없다.
- 병목 후보가 report fetch, inspection data fetch, Java 집계로 나뉘어 있다.

## 접근안 비교

### 1. total 시간만 측정

- 장점: 구현이 가장 빠르다.
- 단점: 병목 위치를 알 수 없다.

### 2. 선택안

`month detail`에 대해 `total + split(fetch/aggregate)` 성능 테스트와 EXPLAIN 테스트를 같이 둔다.

- 장점: 병목 위치를 바로 분리해 볼 수 있다.
- 장점: 이후 SQL 최적화 전에 기준선을 확보할 수 있다.
- 장점: `distribution` 계측 체계와 형식이 맞아 유지보수가 쉽다.
- 단점: 테스트 파일과 seed helper가 조금 늘어난다.

### 3. 구조 변경부터 진행

- 장점: 바로 최적화로 들어갈 수 있다.
- 단점: 기준선 없이 바꾸게 된다.

선택은 2번이다.

## 설계

### 성능 테스트 범위

- 대상: `getCharacteristicChartDetail(projId=1, charId=101, scale=month, baseDate=2026-03, ...)`
- 데이터 기준:
  - 목표 샘플 1만건
  - 같은 달 내 데이터
  - 다른 `charId`, 다른 `projId` 노이즈 포함

### 측정 구간

- `totalMs`
  - 서비스 전체 호출 시간
- `fetchMs`
  - `selectInspectionReportListByProjId`
  - `selectInspectionDataListByCharId`
  두 조회를 합친 시간
- `aggregateMs`
  - source row 변환
  - 기간 필터
  - 정렬
  - 월 bucket 집계

### EXPLAIN 기준

- `selectInspectionDataListByCharId`
  - `insp_data_tb`에서 `char_id` 필터가 적절히 사용되는지
- `selectInspectionReportListByProjId`
  - `proj_id` 조건 기준으로 불필요한 풀스캔이 없는지

### 검증 항목

- 응답 상태 성공
- bucket 수와 샘플 수 기대값 확인
- `fetchMs > 0`, `aggregateMs > 0`
- split 합이 total을 대체로 설명하는지
- EXPLAIN에서 핵심 테이블이 `ALL` 풀스캔으로 떨어지지 않는지

## 반영 범위

- `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDetailPerformanceIntegrationTest.java`
- 필요 시 기존 repository/mapper 참조
- `README.md`

## 검증 계획

1. detail 성능 테스트만 먼저 실행
2. 전체 백엔드 테스트 실행
3. 이후 테스트 로그 경고 정리 단계로 전환
