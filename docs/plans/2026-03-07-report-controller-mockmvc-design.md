# ReportController MockMvc 테스트 설계

## 작업 목적
- `ReportController`의 전체 엔드포인트를 `MockMvc`로 검증한다.
- 라우팅, 파라미터 바인딩, JSON 응답 형태, 인증 유무에 따른 보안 동작이 기대대로 유지되는지 확인한다.

## 현재 문제
- 백엔드는 `ReportService` 레벨에서 MySQL 통합 테스트가 추가됐지만, 컨트롤러 계층은 아직 자동 검증이 없다.
- [`ReportController`](../../spc_back/src/main/java/com/spc/spc_back/controller/spcdata/report/ReportController.java)는 `@AuthenticationPrincipal`, path variable, query parameter에 의존하므로 리팩터링 중 매핑이 조용히 깨질 수 있다.

## 목표
- `recently-project`, `chart-stats`, `detail`, `distribution`, `report-count` 전 엔드포인트를 한 번에 검증한다.
- 인증 없는 요청은 차단되는지 확인한다.
- 인증 있는 요청은 `200`과 기대 JSON을 반환하는지 확인한다.
- 컨트롤러가 서비스에 전달하는 `projId`, `charId`, `scale`, `baseDate`, `PrincipalUser`가 유지되는지 확인한다.

## 설계

### 1. 테스트 종류
- `@SpringBootTest + @AutoConfigureMockMvc`
- 서비스는 mock 처리해 컨트롤러/보안에 집중
- `MockMvc` 요청에는 `UsernamePasswordAuthenticationToken`으로 `PrincipalUser`를 직접 넣어 `@AuthenticationPrincipal` 주입을 검증

### 2. 검증 범위
- `GET /spcdata/report/recently-project/list`
- `GET /spcdata/report/project/{projId}/chart-stats`
- `GET /spcdata/report/project/{projId}/characteristic/{charId}/detail`
- `GET /spcdata/report/project/{projId}/characteristic/{charId}/distribution`
- `GET /spcdata/report/project/{projId}/report-count`

### 3. 테스트 시나리오
- 인증 없음:
  - 대표 엔드포인트 하나 이상에서 `401` 또는 인증 차단 확인
- 인증 있음:
  - 각 엔드포인트별 `200`
  - 공통 응답 필드 `status`, `message`, `data`
  - 배열/단일 객체/숫자 응답 형태 확인
  - 서비스 호출 인자 검증

## 주요 변경 사항
- 컨트롤러 MockMvc 테스트 클래스 추가
- README에 백엔드 컨트롤러 테스트 실행법 추가 여부 점검

## 검증 결과
- 설계 단계이므로 아직 미검증

## 남은 TODO
- MockMvc 테스트 failing case 작성
- 서비스 mock 응답 고정
- 인증/보안 동작 확인
- 전체 백엔드 테스트 재검증
