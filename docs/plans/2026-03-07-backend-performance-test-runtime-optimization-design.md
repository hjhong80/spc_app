# Backend Performance Test Runtime Optimization Design

## 작업 목적

백엔드 전체 테스트 실행 시간의 대부분을 차지하는 성능 테스트 2개의 준비 비용을 줄여, 전체 `mvnw test` 실행 시간을 단축한다.

## 현재 상태

- 최근 `surefire` 결과 기준:
  - `ReportServiceDetailPerformanceIntegrationTest`: 약 190초
  - `ReportServiceDistributionPerformanceIntegrationTest`: 약 170초
- 두 테스트는 공통으로 다음 비용을 반복한다.
  - `mysql:8.4` Testcontainers 기동
  - `schema.sql`, `data.sql` 재적용
  - `1만건 + 노이즈 데이터` batch insert
  - warm-up 및 실측 반복
- 특히 성능 테스트 클래스는 클래스 레벨 `@Sql`을 사용하고 있어, 메서드마다 스키마와 기본 데이터가 반복 적용된다.

## 접근안 비교

### 1. 측정 횟수/샘플 수 축소

- 장점: 가장 빠르게 시간을 줄일 수 있다.
- 단점: 지금까지 쌓은 베이스라인 의미가 약해진다.
- 단점: 성능 회귀 탐지 민감도가 떨어진다.

### 2. 선택안

성능 테스트 전용 공통 베이스를 도입하고, 컨테이너와 fixture 준비를 클래스 단위 1회로 줄인다.

- 장점: 측정 기준은 유지하면서 준비 비용만 줄일 수 있다.
- 장점: 중복된 Testcontainers 설정과 seed 로직 구조를 정리할 수 있다.
- 장점: 전체 테스트 기준 시간을 실제로 줄이는 효과가 크다.
- 단점: 성능 테스트 클래스 구조를 조금 손봐야 한다.

### 3. 성능 테스트를 기본 suite에서 분리

- 장점: 전체 테스트는 가장 빨라진다.
- 단점: 기본 `mvnw test`에서 성능 회귀를 놓칠 수 있다.
- 단점: 사용자가 원하는 “전체 테스트 실행시간 완화”의 1차 해법으로는 맞지 않는다.

선택은 2번이다.

## 설계

### 공통 Testcontainers 베이스

- 파일: `spc_back/src/test/java/com/spc/spc_back/service/spcdata/AbstractReportPerformanceIntegrationTest.java`
- 역할:
  - `MySQLContainer`를 공통 싱글턴으로 관리
  - `DynamicPropertySource`에서 datasource 등록
  - 공통 `JdbcTemplate` helper와 one-time setup helper 제공

### 클래스 단위 fixture 준비

- 두 성능 테스트는 `@Sql`을 제거하거나 메서드 단위 적용을 피하고, 클래스 시작 시 한 번만 `schema.sql`, `data.sql`을 적용한다.
- 대량 seed도 각 테스트 메서드가 아니라 클래스 단위 setup에서 한 번만 넣는다.
- 각 테스트 메서드는 이미 준비된 데이터를 읽고 측정만 수행한다.

### 유지할 것

- `1만 measuredValues` 기준
- warm-up 1회 + 실측 3회
- total/fetch/aggregate 분리 로그
- EXPLAIN 검증

## 반영 범위

- `spc_back/src/test/java/com/spc/spc_back/service/spcdata/AbstractReportPerformanceIntegrationTest.java`
- `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDetailPerformanceIntegrationTest.java`
- `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionPerformanceIntegrationTest.java`
- `README.md`

## 검증 계획

1. 공통 베이스/one-time setup이 실제로 한 번만 수행되는지 targeted 성능 테스트로 확인한다.
2. `ReportServiceDetailPerformanceIntegrationTest`, `ReportServiceDistributionPerformanceIntegrationTest`를 각각 재실행해 시간 감소를 확인한다.
3. 마지막에 전체 `mvnw.cmd test`를 fresh run 하고, `surefire` 시간표를 다시 비교한다.
