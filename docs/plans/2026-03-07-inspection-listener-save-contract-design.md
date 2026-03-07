# InspectionDataListener 저장 계약 확장 설계

## 작업 목적
- `InspectionDataListener` 경로가 실제 DB 저장까지 수행할 수 있도록 입력 계약을 확장한다.
- 업로드 API의 `parseAndPreview(...)`와 listener 저장 경로가 같은 공통 저장 규칙을 사용하도록 정리한다.

## 현재 문제
- [`InspectionDataListener`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/listener/InspectionDataListener.java)는 `List<ExcelInputReqDto> + lotNo`만 넘기고 있어 저장에 필요한 `projId`, `serialNo`, `inspDt`, `measuredValue`를 전달하지 못한다.
- [`ExcelInputReqDto`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/dto/spcdata/ExcelInputReqDto.java)는 `qualityIndicator`, `nominal`만 포함해 실제 특성치 매핑과 저장 규칙에 필요한 값이 부족하다.
- [`InspectionServiceImpl`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/service/InspectionServiceImpl.java)는 내부 `InspectionBatchSaveCommand`로 공통 저장 코어를 이미 갖고 있지만, 외부 listener 경로에서는 접근할 수 없다.

## 목표
- listener 경로와 upload preview 경로가 같은 공통 저장 코어를 사용한다.
- listener 입력 DTO는 EasyExcel 행 파싱에 필요한 필드만 명확하게 가진다.
- 저장 메타데이터(`projId`, `serialNo`, `inspDt`)는 row DTO가 아니라 batch command에 모은다.

## 설계

### 1. 공통 저장 요청 모델 분리
- 새 DTO `InspectionBatchSaveReqDto`
  - `projId`
  - `serialNo`
  - `inspDt`
  - `rows`
- 새 DTO `InspectionBatchRowReqDto`
  - `excelRowNo`
  - `charNo`
  - `axis`
  - `nominal`
  - `uTol`
  - `lTol`
  - `measuredValue`
- `InspectionService`는 listener와 preview 경로 모두에서 사용할 `saveBatch(InspectionBatchSaveReqDto request)`를 노출한다.

### 2. listener 전용 입력 모델 분리
- 기존 `ExcelInputReqDto`는 유지하되 legacy/미사용 계약으로 둔다.
- listener가 실제로 읽을 새 DTO `InspectionExcelRowReqDto`를 추가한다.
- `InspectionDataListener`는 생성자에서 `projId`, `serialNo`, `inspDt`를 받고, 읽은 row를 `InspectionBatchRowReqDto`로 변환해 flush 시 공통 저장 요청으로 전달한다.

### 3. 서비스 연결 방식
- `InspectionServiceImpl.parseAndPreview(...)`
  - 기존 `ParsedRow` 목록을 `InspectionBatchRowReqDto` 목록으로 변환
  - `saveBatch(InspectionBatchSaveReqDto request)` 호출
- `InspectionServiceImpl.saveBatch(List<ExcelInputReqDto>, String)`
  - 현재처럼 fail-fast 유지
- `InspectionServiceImpl.saveBatch(InspectionBatchSaveReqDto request)`
  - 기존 내부 저장 코어를 이 메서드로 승격
  - 특성치 lookup, fallback, `InspectionReport`/`InspectionData` insert는 그대로 재사용

### 4. 테스트 전략
- listener 단위 테스트
  - `BATCH_COUNT`를 넘기면 flush 시 공통 저장 메서드가 호출되는지
  - `doAfterAllAnalysed()`가 잔여 데이터를 저장하는지
- 서비스 통합 테스트
  - 공통 저장 DTO 기반 `saveBatch(...)`가 실제 MySQL Testcontainers 환경에서 `insp_report_tb`, `insp_data_tb`를 저장하는지
  - listener용 row DTO에서 `charNo + axis + nominal` 매핑이 preview 경로와 동일하게 작동하는지

## 주요 변경 사항
- 공통 저장 DTO 추가
- listener 전용 Excel row DTO 추가
- `InspectionService` 공통 save 시그니처 추가
- `InspectionDataListener` flush 경로를 실제 저장 가능 계약으로 교체

## 검증 결과
- 설계 단계이므로 아직 미검증

## 남은 TODO
- listener 단위 failing test 작성
- 공통 저장 통합 테스트 작성
- 서비스/DTO/listener 구현
- README와 후속 남은 공백 업데이트
