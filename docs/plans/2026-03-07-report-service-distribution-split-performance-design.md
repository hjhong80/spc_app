# ReportService Distribution Split Performance Design

## 작업 목적

기존 `ReportService.getCharacteristicDistribution(...)` 성능 베이스라인 테스트를 유지하면서, 같은 `1만 measuredValues` 조건에서 시간을 `SQL fetch`와 `Java 집계`로 분리 계측한다.

## 현재 상태

- 전체 베이스라인 테스트는 이미 존재한다.
  - `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionPerformanceIntegrationTest.java`
- 현재 로그는 전체 서비스 호출 시간만 남긴다.
- 병목이 `repository 조회`인지 `서비스 집계`인지 구분되지 않는다.

## 목표 범위

- 프로덕션 코드는 수정하지 않는다.
- 테스트 코드 내부에서만 분리 계측한다.
- 기존 전체 시간 테스트는 유지한다.
- 새 테스트는 원본 데이터 fetch 시간과 aggregate 시간의 상대 비중을 보여준다.

## 선택한 접근

### 1. 서비스 전체 vs repository 단발 비교

전체 서비스 시간과 repository 시간만 각각 재서 비교한다.

- 장점: 가장 단순함
- 단점: aggregate 시간이 간접 추정이라 정확도가 낮음

### 2. 선택안

테스트에서 repository fetch와 aggregate를 같은 데이터셋 기준으로 따로 측정한다.

- 장점: `fetch`와 `aggregate`를 직접 비교 가능
- 장점: 프로덕션 코드 변경이 없음
- 단점: 테스트 내부에 집계 로직이 일부 복제됨

### 3. 세분화 벤치마크

`date parse`, `fetch`, `sort`, `stats build`, `response build`를 모두 따로 잰다.

- 장점: 가장 자세함
- 단점: 지금 단계에는 과함

선택은 2번이다.

## 테스트 설계

### 새 테스트 동작

같은 fixture와 같은 기간 조건으로 다음 3가지를 측정한다.

1. `totalMs`
   - `reportService.getCharacteristicDistribution(...)`
2. `fetchMs`
   - `inspectionDataRepository.selectDistributionSourceListByCharIdAndPeriod(...)`
3. `aggregateMs`
   - fetch 결과를 테스트 내부 helper로 정렬/집계/응답 조립

### 데이터 조건

- `charId=101`
- `projId=1`
- `baseDate=2026-03`
- 총 `sampleCount=10000`
- 다른 특성/다른 프로젝트 노이즈 포함

### 측정 방식

- `warm-up` 1회
- 실측 3회
- 각 회차마다 `total/fetch/aggregate`를 모두 측정
- 최종 비교는 중앙값 기준

### 검증 항목

- `sampleCount == 10000`
- `fetchMedianMs > 0`
- `aggregateMedianMs > 0`
- `splitMedianMs = fetchMedianMs + aggregateMedianMs`
- `splitMedianMs <= totalMedianMs + 200ms`

여기서 `200ms`는 테스트 코드 편차와 추가 객체 생성 비용을 흡수하기 위한 허용 오차다.

## 산출물

- 기존 테스트 파일 수정
  - `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionPerformanceIntegrationTest.java`
- README 갱신
  - 분리 계측 테스트 로그 의미와 실행 명령 반영

## 리스크와 대응

- 테스트 내부 집계 로직이 서비스와 드리프트할 수 있음
  - 현재 서비스 로직을 그대로 따라가고, 목적은 회귀 검증이 아니라 병목 분리임을 명확히 둔다.
- 측정 오차
  - `warm-up + 중앙값 + 허용 오차 200ms`로 완화한다.

## 검증 계획

1. 새 분리 계측 테스트만 먼저 실행
2. 로그가 의도대로 나오는지 확인
3. `mvnw.cmd test` 전체 실행
