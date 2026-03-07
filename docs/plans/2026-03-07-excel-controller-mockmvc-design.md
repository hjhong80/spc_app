# ExcelController MockMvc 테스트 설계

## 작업 목적
- 업로드 API의 요청/응답 계약을 `MockMvc`로 고정한다.
- multipart 파라미터, 성공/실패 상태 코드, duplicate skip 메시지 분기가 기대대로 유지되는지 검증한다.

## 현재 문제
- [`ExcelController`](../../spc_back/src/main/java/com/spc/spc_back/controller/spcdata/excel/ExcelController.java)는 업로드 API의 유일한 진입점이지만 컨트롤러 레벨 테스트가 없다.
- 저장 자체는 [`InspectionServiceParseAndPreviewIntegrationTest`](../../spc_back/src/test/java/com/spc/spc_back/service/InspectionServiceParseAndPreviewIntegrationTest.java#L35)에서 검증하지만, API 응답 메시지와 HTTP 상태 분기는 별도로 고정되지 않았다.

## 목표
- `POST /excel/upload`의 multipart 요청 계약을 검증한다.
- 빈 파일 요청은 `400`과 고정 메시지를 반환하는지 확인한다.
- 정상 저장 응답과 duplicate skip 응답의 메시지 분기를 확인한다.
- 서비스에서 `IllegalArgumentException`을 던지면 `400`으로 매핑되는지 확인한다.

## 설계

### 1. 테스트 종류
- `@SpringBootTest + @AutoConfigureMockMvc`
- `InspectionService`는 mock 처리
- 저장/DB 검증은 기존 서비스 통합 테스트가 담당

### 2. 검증 범위
- `POST /excel/upload`
- 파라미터:
  - `file`
  - `lotNo`
  - `projId`

### 3. 테스트 시나리오
- 빈 파일:
  - `400`
  - `status=failed`
  - `message=Excel file is empty.`
- 정상 저장:
  - `200`
  - `status=success`
  - `message=Excel upload/parse 및 DB 저장이 완료되었습니다.`
- duplicate skip:
  - `200`
  - `status=success`
  - `message=skipReason`
- 서비스 검증 실패:
  - `400`
  - `status=failed`
  - `message=서비스 예외 메시지`

## 주요 변경 사항
- 업로드 API MockMvc 테스트 추가
- README에 실행 명령 최소 반영

## 검증 결과
- 설계 단계이므로 아직 미검증

## 남은 TODO
- failing test 작성
- MockMvc 테스트 구현
- README 반영
- 전체 테스트 재검증
