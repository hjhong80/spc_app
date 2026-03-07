# ReportService Distribution Performance Test Design

## 작업 목적

`ReportService.getCharacteristicDistribution(...)`의 배포 기준 성능 베이스라인을 만든다.  
대상 규모는 `1만 measuredValues`이며, `Testcontainers MySQL` 환경에서 재현 가능한 통합 테스트로 측정한다.

## 현재 구조 요약

- 서비스 진입점: `spc_back/src/main/java/com/spc/spc_back/service/spcdata/ReportService.java`
- SQL 조회: `spc_back/src/main/resources/mapper/inspection_data_mapper.xml`
- 기존 검증: `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionIntegrationTest.java`

현재 `distribution` 경로는 다음 순서로 동작한다.

1. `projId`, `charId`, `scale`, `baseDate`, 권한 검증
2. 기간 계산
3. `selectDistributionSourceListByCharIdAndPeriod(...)` 호출
4. Java에서 정렬
5. `min/max/mean/sigma/sampleCount/measuredValues` 계산

즉 성능은 `SQL fetch + Java 집계`의 합으로 결정된다.

## 목표 범위

- `distribution` API 성능만 우선 측정
- 데이터 규모는 `1만 measuredValues`
- 기능 정확성보다 성능 베이스라인 확보가 우선
- 아직 SQL/서비스 최적화 자체는 하지 않음

## 선택한 접근

### 1. 단순 단발 측정

기존 통합 테스트에 fixture만 늘리고 한 번 측정한다.

- 장점: 구현이 빠름
- 단점: 편차가 커서 신뢰도가 낮음

### 2. 선택안

별도 성능 통합 테스트를 만들고, `warm-up 1회 + 실측 3회`로 베이스라인을 만든다.

- 장점: 재현성이 상대적으로 높음
- 장점: 이후 최적화 전/후 비교 기준으로 재사용 가능
- 단점: fixture 생성과 테스트 코드가 조금 늘어남

### 3. 측정과 최적화를 동시에 수행

성능 테스트와 함께 SQL/서비스 구조를 바로 바꾼다.

- 장점: 바로 성능 개선까지 연결 가능
- 단점: 병목 위치를 실측하기 전에 구조를 바꾸게 되어 리스크가 큼

선택은 2번이다.

## 테스트 설계

### 데이터 전략

- 프로젝트 1개
- 대상 특성 `charId=101` 1개
- 대상 월 안에 `1만 measuredValues`
- 다른 특성/다른 프로젝트 노이즈 데이터 소량 포함

이렇게 하면 다음을 동시에 본다.

- 기간 필터
- 특성 필터
- 프로젝트 검증 경로
- 대량 샘플 집계 비용

### 측정 방식

- `Testcontainers MySQL` 사용
- `warm-up` 1회
- 실측 3회
- `reportService.getCharacteristicDistribution(...)` 전체 시간을 `System.nanoTime()`으로 측정
- 로그에 각 회차와 최종 기준값을 남김

### 판정 방식

- 응답 상태는 `success`
- `sampleCount == 10000`
- 최종 기준 시간은 `1500ms 이하`

성능 환경 편차를 줄이기 위해 단순 평균보다 `최솟값` 또는 `중앙값` 기준을 사용한다. 구현에서는 지나치게 느린 첫 호출의 영향을 줄이기 위해 `warm-up` 후 `중앙값`을 우선 후보로 둔다.

## 산출물

- 새 테스트 클래스
  - `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionPerformanceIntegrationTest.java`
- 대량 fixture SQL
  - 별도 SQL 파일 또는 테스트 내부 bulk insert helper
- 문서 반영
  - `README.md`

## 리스크와 대응

- Docker/Testcontainers 환경 편차
  - `warm-up + 3회 측정`으로 완화
- fixture SQL이 너무 커짐
  - 가능하면 테스트 내부 bulk insert helper로 생성
- 임계값이 너무 타이트할 가능성
  - 첫 실행 결과를 보고 `1500ms`를 미세 조정

## 검증 계획

1. 타깃 테스트만 먼저 실행
2. 결과가 안정적이면 `mvnw.cmd test` 전체 실행
3. 최종 문서에 기준과 실행 방법 반영
