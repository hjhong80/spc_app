# InspectionService 저장 경로 리팩터링 설계

## 작업 목적
- 업로드 API의 저장 로직을 `InspectionService` 내부 공통 저장 진입점으로 정리한다.
- 외부 API 계약은 유지하면서, 내부 구조는 `preview`와 `save` 책임을 분리해 다음 단계의 API 분리를 쉽게 만든다.

## 현재 문제
- [`InspectionServiceImpl.parseAndPreview(...)`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/service/InspectionServiceImpl.java)는 파싱, preview 응답 생성, DB 저장을 모두 수행한다.
- [`InspectionService.saveBatch(List<ExcelInputReqDto>, String)`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/service/InspectionService.java#L11)는 legacy 시그니처만 있고 실제 저장은 비어 있다.
- `InspectionDataListener` 경로는 현재 저장에 필요한 `projId`, `serialNo`, `inspDt`, `measuredValue`를 충분히 전달하지 못해 실제 저장 규칙과 맞지 않는다.

## 목표
- 업로드 API는 기존처럼 `parseAndPreview(...)`를 호출하고 같은 응답 구조를 유지한다.
- 내부에서는 preview 결과를 공통 저장 command로 변환해 하나의 저장 진입점으로 보낸다.
- legacy `saveBatch(List<ExcelInputReqDto>, String)`는 현재 메타데이터 부족을 명시적으로 드러내는 fail-fast 경로로 정리한다.

## 설계

### 1. 책임 분리
- `parseAndPreview(...)`
  - 파일 파싱
  - `serialNo`, `inspDt` 추출
  - preview DTO 생성
  - 공통 저장 command 생성 및 저장 호출
- 내부 저장 진입점
  - 프로젝트 특성치 lookup
  - 중복 serialNo 검사
  - `InspectionReport` 생성
  - `InspectionData` 저장
  - 저장 결과를 담은 내부 result 반환

### 2. 내부 모델
- `InspectionBatchSaveCommand`
  - `projId`
  - `serialNo`
  - `inspDt`
  - `parsedRows`
- `InspectionBatchSaveResult`
  - `inspReportId`
  - `insertedDataCount`
  - `skippedRowCount`

### 3. legacy 경로 처리
- `saveBatch(List<ExcelInputReqDto>, String)`는 바로 예외를 던져 현재 계약으로는 저장 불가함을 명확히 한다.
- 메시지에는 `projId/serialNo/inspDt/measuredValue`가 필요하다는 점을 포함한다.
- `InspectionDataListener`는 아직 공통 저장 command를 만들 수 없으므로 현 단계에서는 실제 사용 경로가 아님을 유지한다.

### 4. 테스트 전략
- 서비스 단위 테스트:
  - legacy `saveBatch(...)`가 fail-fast 하는지
- 통합 테스트:
  - `parseAndPreview(...)`가 공통 저장 진입점을 통해 `insp_report_tb`, `insp_data_tb`를 저장하는지
  - duplicate serialNo면 저장을 생략하는지

## 주요 변경 사항
- `InspectionServiceImpl` 내부 저장 command/result 추가
- `parseAndPreview(...)` 저장 경로 공통화
- legacy `saveBatch(...)` fail-fast 처리
- 저장 리팩터링 테스트 추가

## 검증 결과
- 설계 단계이므로 아직 미검증

## 남은 TODO
- failing test 작성
- 공통 저장 진입점 구현
- upload 저장 경로 테스트 추가
- README 반영 여부 점검
