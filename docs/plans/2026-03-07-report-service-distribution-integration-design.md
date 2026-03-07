# ReportService Distribution 통합 테스트 설계

## 작업 목적
- `ReportService.getCharacteristicDistribution(...)`를 실제 MySQL 환경과 MyBatis SQL 경로에서 검증한다.
- `charId`, 기간 조건, 프로젝트 존재 조건, 집계값 계산이 함께 맞는지 확인한다.

## 현재 문제
- 기존 [`ReportServiceDistributionTest`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionTest.java)는 Mockito 기반 단위 테스트다.
- repository 결과를 모킹하므로 mapper SQL, 조인, 기간 조건, 정렬, 집계 정확도를 검증하지 못한다.

## 목표
- Testcontainers MySQL로 실제 DB를 띄운다.
- 최소 fixture로 월/일 기간 필터와 `charId` 필터가 기대대로 동작하는지 검증한다.
- 선택한 기간의 `measuredValues`, `measuredMean`, `measuredSigma`, `sampleCount`를 확인한다.

## 설계

### 1. 테스트 종류
- `@SpringBootTest` 기반 통합 테스트
- `Testcontainers`의 `MySQLContainer`
- `@Sql`로 schema/data를 매 테스트 전에 로드

### 2. 테스트 데이터
- 프로젝트 2개
- 특성치 3개
- 같은 특성치의 3월 데이터와 4월 데이터
- 다른 프로젝트/다른 특성치 노이즈 데이터

### 3. 검증 시나리오
- 월 조회:
  - `2026-03` 조회 시 3월 데이터만 포함
- 일 조회:
  - `2026-03-15` 조회 시 해당 일 데이터만 포함
- 집계:
  - `measuredValues`
  - `measuredMean`
  - `measuredSigma`
  - `sampleCount`

## 주요 변경 사항
- Testcontainers 의존성 추가
- MySQL 기반 통합 테스트 추가
- 테스트용 schema/data SQL 추가

## 검증 결과
- 설계 단계이므로 아직 미검증

## 남은 TODO
- Testcontainers 설정 추가
- schema/data SQL 작성
- distribution 통합 테스트 구현
- 최종 Maven 테스트 검증
