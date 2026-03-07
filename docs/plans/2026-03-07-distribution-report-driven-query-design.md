# Distribution Report-Driven Query Design

## 작업 목적

`distribution` 조회에서 남아 있는 fetch 비용을 줄이기 위해, 대량 측정값 조회의 조인 시작점을 `insp_report_tb` 기간 필터 기준으로 바꾼다.

## 현재 상태

- `distribution` 조회는 이미 `특성 메타 1건 조회 + 측정값 대량 조회`로 분리되어 있다.
- `char_tb` 조인 제거와 SQL `ORDER BY` 제거로 `Using filesort`는 사라졌다.
- 현재 EXPLAIN 상 대량 조회는 `idt -> irt` 경로로 읽히며, `irt`는 `PRIMARY/eq_ref`로 붙는다.
- 성능 분리 계측 결과상 병목은 여전히 대부분 `fetch`다.

## 접근안 비교

### 1. 인덱스만 추가

- 장점: 변경 범위가 작다.
- 단점: 현재 조인 시작점이 그대로면 개선 폭이 작을 가능성이 높다.

### 2. 선택안

`insp_report_tb`를 기간 조건으로 먼저 읽고, 그 결과를 `insp_data_tb`와 조인한다.

- 장점: `insp_dt` 조건을 더 직접적으로 사용하게 만들 수 있다.
- 장점: 기존 인덱스 `idx_insp_report_dt_report`, `idx_insp_data_char_report_data`를 모두 활용하기 쉽다.
- 장점: 응답 계약은 그대로 유지된다.
- 단점: EXPLAIN과 성능 테스트를 함께 갱신해야 한다.

### 3. 사전 집계 구조 도입

- 장점: 상한은 가장 높다.
- 단점: 현재 단계에서는 과하다.

선택은 2번이다.

## 설계

### SQL / Mapper

- 대량 측정값 조회 SQL을 `insp_report_tb irt STRAIGHT_JOIN insp_data_tb idt` 형태로 바꾼다.
- `WHERE` 절의 기간 조건은 `irt.insp_dt`에 둔다.
- `charId` 조건은 `idt.char_id`에 둔다.
- 조인 키는 `idt.insp_report_id = irt.insp_report_id`를 유지한다.

### Repository / Service

- repository 메서드 시그니처는 유지한다.
- service 응답 조립, Java 정렬, 메타 1건 조회 구조는 그대로 둔다.

### 테스트

- EXPLAIN 테스트는 다음을 고정한다.
  - `irt`, `idt`만 등장
  - `irt`가 `idx_insp_report_dt_report`를 사용
  - `idt`가 `idx_insp_data_char_report_data`를 사용
  - `ALL` 풀스캔 없음
- 성능 테스트는 기존 `1만 샘플`, `total/fetch/aggregate` 구조를 그대로 사용한다.
- 기능 통합/단위 테스트는 기존 응답 계약이 유지되는지만 확인한다.

## 반영 범위

- `spc_back/src/main/resources/mapper/inspection_data_mapper.xml`
- `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionPerformanceIntegrationTest.java`
- `README.md`

## 검증 계획

1. EXPLAIN 테스트를 먼저 실패시키고 다시 통과시킨다.
2. distribution 관련 테스트 묶음을 실행한다.
3. 마지막에 `mvnw.cmd test` 전체 실행으로 회귀를 확인한다.
