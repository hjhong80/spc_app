# Distribution Query Optimization Design

## 작업 목적

`distribution` 조회의 fetch 병목을 줄이기 위해 SQL 정렬 비용과 불필요한 조인 비용을 줄인다.

## 현재 상태

- 성능 분리 계측 결과상 병목은 거의 `fetch` 구간이다.
- 현재 `selectDistributionSourceListByCharIdAndPeriod`는 `char_tb`, `insp_data_tb`, `insp_report_tb`를 한 번에 조인한다.
- SQL에서 `ORDER BY irt.insp_dt, irt.insp_report_id, idt.insp_data_id`를 수행한 뒤, 서비스에서도 같은 기준으로 다시 정렬한다.
- EXPLAIN 상 `Using temporary; Using filesort`가 보인다.

## 접근안 비교

### 1. ORDER BY만 제거

- 장점: 변경 범위가 가장 작다.
- 장점: 현재 서비스 정렬 로직이 이미 있으므로 의미 보존이 쉽다.
- 단점: `char_tb` 조인 비용과 불필요한 메타 반복 조회는 남는다.

### 2. 선택안

`distribution` 조회를 `특성 메타 조회 1건`과 `대량 측정값 조회`로 분리한다.

- 장점: `char_tb`를 대량 row fetch 경로에서 제거할 수 있다.
- 장점: SQL `ORDER BY` 제거와 함께 fetch 비용을 더 줄일 수 있다.
- 장점: 응답 계약은 유지하면서 mapper/repository 책임이 더 명확해진다.
- 단점: mapper, repository, service를 함께 수정해야 한다.

### 3. 통계 SQL까지 분리하는 대수술

- 장점: 추가 최적화 여지가 크다.
- 단점: 현재 단계에서는 변경 폭이 과하다.

선택은 2번이다.

## 설계

### SQL / Mapper

- 기존 `selectDistributionSourceListByCharIdAndPeriod`는 제거하거나 역할을 축소한다.
- 새 조회를 두 개 둔다.
  - `selectDistributionMetaByCharId`
  - `selectDistributionMeasuredValueListByCharIdAndPeriod`
- 대량 측정값 조회 SQL에서는 `char_tb`를 조인하지 않는다.
- SQL `ORDER BY`는 제거한다. 정렬은 서비스가 일관되게 수행한다.

### Repository

- 메타 1건 조회와 측정값 목록 조회를 별도 메서드로 노출한다.
- 기존 distribution repository 메서드는 새 메서드 조합으로 대체한다.

### Service

- `ReportService.getCharacteristicDistribution(...)`는
  1. 기간 파싱
  2. 메타 1건 조회
  3. 측정값 목록 조회
  4. Java 정렬
  5. 응답 조립
  순서로 동작한다.
- 응답 DTO 구조와 API 계약은 유지한다.

### 테스트

- 기존 분포 기능 테스트는 유지한다.
- 성능 테스트는 그대로 재사용해 회귀를 막는다.
- EXPLAIN 테스트는 새 SQL 기준으로 갱신한다.
  - `ct`는 메타 조회 경로에서 검증
  - 대량 측정값 조회는 `idt`, `irt` 인덱스 사용과 `ALL` 방지를 검증

## 반영 범위

- `spc_back/src/main/resources/mapper/inspection_data_mapper.xml`
- `spc_back/src/main/java/com/spc/spc_back/repository/InspectionDataRepository.java`
- `spc_back/src/main/java/com/spc/spc_back/service/spcdata/ReportService.java`
- `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionIntegrationTest.java`
- `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionPerformanceIntegrationTest.java`
- `README.md`

## 검증 계획

1. distribution 관련 테스트를 먼저 실행
2. 성능 테스트에서 `sampleCount`, `median`, `split`을 다시 확인
3. 마지막에 `mvnw.cmd test` 전체 실행
