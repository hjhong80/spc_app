# Distribution EXPLAIN Plan Design

## 작업 목적

`distribution` SQL을 더 최적화하기 전에, 현재 실행 계획에서 어떤 테이블과 인덱스가 사용되는지를 테스트로 고정한다.

## 현재 상태

- 인덱스 반영 완료
  - `idx_insp_data_char_report_data`
  - `idx_insp_report_dt_report`
- 성능 테스트 존재
- 분리 계측 결과상 `fetch`가 여전히 병목의 대부분이다.

## 선택한 접근

### 1. 전체 실행 계획 스냅샷

- 장점: 구현이 단순
- 단점: 버전 차이에 매우 취약

### 2. 선택안

일반 `EXPLAIN` 결과의 핵심 컬럼만 검증한다.

- 장점: MySQL 버전 차이에 상대적으로 덜 민감
- 장점: 우리가 원하는 인덱스 사용 여부를 명확히 확인 가능
- 단점: 세부 실행 계획 전체를 보존하진 않음

### 3. 성능 수치만 유지

- 장점: 테스트가 단순
- 단점: 원인 설명이 약함

선택은 2번이다.

## 테스트 설계

### 대상 SQL

`inspection_data_mapper.xml`의 `selectDistributionSourceListByCharIdAndPeriod`와 동등한 SQL을 `EXPLAIN`으로 실행한다.

### 검증 포인트

- `table` 컬럼에 `idt`, `irt`, `ct`가 모두 존재
- `key` 컬럼에 아래 인덱스가 반영
  - `idx_insp_data_char_report_data`
  - `idx_insp_report_dt_report`
- `type` 컬럼이 `ALL` 풀스캔으로 떨어지지 않음
- `Extra`는 로그로 남기되, 지금 단계에서는 강한 assertion 대상에서 제외

## 반영 범위

- `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionPerformanceIntegrationTest.java`
- 필요 시 `README.md`

## 검증 계획

1. EXPLAIN 테스트만 먼저 실행
2. 성능 테스트와 함께 실행
3. `mvnw.cmd test` 전체 실행
