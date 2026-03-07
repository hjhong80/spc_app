# Distribution Fetch Index Optimization Design

## 작업 목적

`ReportService.getCharacteristicDistribution(...)`의 병목으로 확인된 `fetch` 구간을 줄이기 위해, 실서비스 스키마와 테스트 스키마에 맞춘 인덱스 전략을 추가한다.

## 현재 상태

- 분포 성능 베이스라인 테스트 존재
- 분리 계측 테스트 존재
- 최근 측정 기준:
  - `totalMedianMs=48`
  - `fetchMedianMs=44`
  - `aggregateMedianMs=2`

즉 현재 병목은 거의 `repository fetch`다.

## 현재 쿼리 구조

대상 SQL:
- `spc_back/src/main/resources/mapper/inspection_data_mapper.xml`
- `selectDistributionSourceListByCharIdAndPeriod`

현재 쿼리 조건:

- `idt.char_id = #{charId}`
- `irt.insp_dt >= #{startDt}`
- `irt.insp_dt < #{endDt}`
- 정렬:
  - `irt.insp_dt`
  - `irt.insp_report_id`
  - `idt.insp_data_id`

## 선택한 접근

### 1. 인덱스만 추가

- 장점: 가장 안전
- 단점: 조인/정렬 의도를 문서화하지 않으면 유지보수성이 떨어짐

### 2. 선택안

실서비스 스키마/마이그레이션, 테스트 스키마, 성능 테스트를 같이 수정한다.

- 장점: 실제 배포 환경과 테스트 환경의 괴리를 줄임
- 장점: 성능 개선을 바로 측정 가능
- 단점: DDL 변경 범위가 늘어남

### 3. SQL 구조까지 크게 변경

집계까지 SQL로 넘긴다.

- 장점: fetch payload까지 줄일 수 있음
- 단점: 현재 계약과 테스트 영향이 큼

선택은 2번이다.

## 인덱스 설계

### `insp_data_tb`

- 인덱스: `(char_id, insp_report_id, insp_data_id)`

이유:
- 선행 필터 `char_id`
- 조인 키 `insp_report_id`
- 정렬 보조 `insp_data_id`

### `insp_report_tb`

- 인덱스: `(insp_dt, insp_report_id)`

이유:
- 기간 필터 `insp_dt`
- 정렬 및 조인 키 `insp_report_id`

## 반영 범위

- 실서비스 DDL 또는 마이그레이션 파일
- 테스트용 `spc_back/src/test/resources/schema.sql`
- 필요 시 mapper SQL 정리
- 성능 테스트 재실행

## 검증 기준

- 기능 테스트는 모두 유지
- 분리 계측 테스트 기준 `fetchMedianMs` 감소 확인
- 최소한 성능 악화가 없어야 함

## 리스크와 대응

- 실제 운영 DB에 이미 비슷한 인덱스가 있을 수 있음
  - 현재 저장소 기준 DDL/마이그레이션 파일을 먼저 확인 후 중복 인덱스는 피한다.
- 테스트 환경에서만 과도하게 좋아질 수 있음
  - 실서비스 스키마/마이그레이션도 같이 반영한다.

## 검증 계획

1. 인덱스 반영 전후 성능 테스트 비교
2. `ReportServiceDistributionPerformanceIntegrationTest` 실행
3. `mvnw.cmd test` 전체 실행
