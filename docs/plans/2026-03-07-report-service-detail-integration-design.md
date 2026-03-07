# ReportService Detail 통합 테스트 설계

## 작업 목적
- `ReportService.getCharacteristicChartDetail(...)`를 실제 MySQL 환경과 MyBatis SQL 경로에서 검증한다.
- 월/일 상세 조회의 기간 필터, 기본 `baseDate` fallback, 응답 bucket 생성이 기대대로 동작하는지 확인한다.

## 현재 문제
- 현재 백엔드는 [`ReportServiceDistributionIntegrationTest`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionIntegrationTest.java)만 실제 MySQL 컨테이너 기준으로 검증한다.
- 상세 차트 조회는 성적서와 측정 데이터를 메모리에서 재조합하므로, 기간 필터나 기본 날짜 선택이 바뀌면 프론트 상세 차트가 조용히 깨질 수 있다.

## 목표
- Testcontainers MySQL에서 `ReportService -> Repository -> Mapper` 경로를 직접 검증한다.
- `month`, `day` happy path를 고정한다.
- `baseDate` 미입력 시 최신 월/최신 일자 fallback을 검증한다.
- 잘못된 `baseDate` 형식이면 실패 응답이 반환되는지 검증한다.

## 설계

### 1. 테스트 종류
- `@SpringBootTest` 기반 통합 테스트
- `Testcontainers`의 `MySQLContainer`
- `@Sql`로 기존 `schema.sql`, `data.sql` fixture 재사용

### 2. 테스트 데이터
- 기존 distribution 통합 테스트 fixture를 그대로 사용한다.
- 프로젝트 1의 특성 `101`에 대해:
  - `2026-03-15` 2건
  - `2026-03-28` 1건
  - `2026-04-03` 1건
- 다른 특성/프로젝트 노이즈 데이터도 유지해 필터 누락을 잡는다.

### 3. 검증 시나리오
- 월 조회:
  - `2026-03` 조회 시 `03-15`, `03-28` 2개 bucket만 생성
- 일 조회:
  - `2026-03-15` 조회 시 해당 날짜 report 2건만 시간순 반환
- 기본값 fallback:
  - `month`에서 `baseDate`가 비면 최신 월인 `2026-04` 기준 1개 bucket 반환
  - `day`에서 `baseDate`가 비면 최신 일자인 `2026-04-03` 기준 1건 반환
- 실패 응답:
  - `month`에 잘못된 형식이면 `"baseDate는 YYYY-MM 형식이어야 합니다."`
  - `day`에 잘못된 형식이면 `"baseDate는 YYYY-MM-DD 형식이어야 합니다."`

## 주요 변경 사항
- detail 통합 테스트 클래스 추가
- 기존 fixture SQL 재사용
- Testcontainers 2.x 환경에서 실제 MySQL 컨테이너 검증 확장

## 검증 결과
- 설계 단계이므로 아직 미검증

## 남은 TODO
- detail 통합 테스트 failing case 작성
- targeted test로 red 확인
- 테스트 통과 확인
- README와 `.gitignore` 최종 정리
