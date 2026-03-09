# Excel 업로드 스트리밍 최적화 설계

## 작업 목적
- 대용량 Excel 업로드에서 메모리 사용량과 저장 시간을 줄인다.
- 현재 업로드 API 계약을 크게 깨지 않으면서 응답을 `요약 정보 + 일부 preview 행` 중심으로 재정의한다.
- 메타데이터 추출 유연성은 유지하고, 실제 측정 데이터 구간은 스트리밍 파싱으로 전환한다.

## 현재 문제
- [`InspectionServiceImpl.parseAndPreview(...)`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/service/InspectionServiceImpl.java)는 `WorkbookFactory`로 워크북 전체를 열고 모든 측정 행을 메모리에 적재한 뒤 저장한다.
- [`InspectionServiceImpl.persistBatch(...)`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/service/InspectionServiceImpl.java)는 `insp_data_tb`를 건별 insert 하므로 업로드 행 수가 커질수록 DB round-trip 비용이 커진다.
- serial 중복 확인은 [`selectInspectionReportBySerialNo`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/resources/mapper/inspection_report_mapper.xml)로 리포트와 측정값까지 함께 읽는 무거운 조회를 사용한다.
- 업로드 응답은 전체 `parsedRows`를 반환하는 구조라 대용량 파일일수록 서버 메모리 사용량과 응답 payload가 커진다.
- 저장소에는 [`InspectionDataListener`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/listener/InspectionDataListener.java)와 EasyExcel 의존성이 남아 있지만, 현재 업로드 경로에는 연결되어 있지 않다.

## 목표
- 메타데이터 추출은 현재 프로젝트별 셀 좌표/범위 규칙을 유지한다.
- 측정 데이터 구간은 EasyExcel 기반 스트리밍으로 읽어 전체 행을 메모리에 보관하지 않는다.
- `insp_data_tb` 저장은 batch insert로 전환한다.
- serial 중복 검사는 존재 여부만 확인하는 경량 쿼리로 분리한다.
- 업로드 응답은 `parsedRowCount` 같은 전체 집계는 유지하되, preview 행은 샘플 N건만 반환한다.
- 개별 행 매핑 실패는 skip 처리하고, 업로드 전체 의미를 잃는 오류만 즉시 실패시킨다.

## 범위
- 포함:
  - 업로드 서비스 파싱 경로 재구성
  - EasyExcel 스트리밍 reader 도입 또는 기존 listener 재활용
  - batch insert 및 duplicate exists 쿼리 추가
  - preview 응답 축소
  - 관련 서비스/통합/API 테스트 갱신
- 제외:
  - 프론트 화면 개편
  - 업로드 API 분리 또는 비동기 처리
  - 프로젝트 설정 포맷 변경

## 설계

### 1. 하이브리드 2단계 파싱
- 1단계 메타 파싱:
  - `WorkbookFactory`를 유지해 첫 시트와 좌표 기반 셀 접근을 처리한다.
  - 여기서 `serialNo`, `inspDt`, `dataStartRow`, 컬럼 인덱스, 파일명 기반 source 해석을 완료한다.
  - duplicate serial 여부도 이 단계에서 판정한다.
- 2단계 측정 행 스트리밍:
  - duplicate가 아니면 같은 파일 input stream을 다시 열어 EasyExcel로 측정 데이터 구간만 순회한다.
  - 헤더 고정 매핑 대신 프로젝트 설정에서 계산한 컬럼 인덱스를 사용해 행 데이터를 `InspectionBatchRowReqDto` 성격의 내부 모델로 변환한다.
  - 전체 행 리스트를 만들지 않고 집계기와 저장 버퍼에만 전달한다.

### 2. 업로드 파이프라인
- `parseAndPreview(...)` 내부 흐름을 아래와 같이 재구성한다.
  - 메타데이터 추출
  - serial 중복 검사
  - 스트리밍 파싱 시작
  - 행 정규화/매핑
  - preview 샘플 누적
  - batch 저장 버퍼 누적
  - 버퍼 단위 DB 저장
  - 전체 집계 DTO 반환
- 저장 시점은 스트리밍 중 배치 단위 flush 또는 스트리밍 종료 후 report/data 저장 순서가 보장되도록 설계한다.
- `InspectionReport`는 업로드당 1건만 생성하고, 이후 `insp_report_id`를 사용해 측정값 batch insert를 수행한다.

### 3. 내부 컴포넌트
- `ExcelUploadMetaReader`
  - 프로젝트 설정과 workbook 좌표 접근을 사용해 `serialNo`, `inspDt`, 컬럼 정보를 읽는다.
- `StreamingInspectionRowReader`
  - EasyExcel reader를 감싸고, 지정된 시작 행 이후의 데이터만 읽는다.
- `StreamingUploadAccumulator`
  - `parsedRowCount`, `insertedRowCount`, `skippedRowCount`, preview 샘플 N건을 유지한다.
  - 메모리에 전체 행을 쌓지 않고, 저장 버퍼 상한만 유지한다.
- `InspectionBatchWriter`
  - `InspectionReport` insert
  - `insp_data_tb` batch insert
  - 필요 시 마지막 남은 버퍼 flush

### 4. 데이터 계약
- [`ExcelParsePreviewRespDto`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/dto/spcdata/ExcelParsePreviewRespDto.java)는 큰 틀을 유지한다.
- `parsedRowCount`는 전체 파싱 건수로 유지한다.
- `parsedRows`는 전체 결과가 아니라 preview 샘플 N건만 담는 필드로 재정의한다.
- 필요하면 `insertedRowCount`, `skippedRowCount`를 추가해 대용량 업로드의 실제 처리 결과를 드러낸다.
- duplicate serial 응답은 현재와 비슷하게 유지하되, `parsedRowCount=0`, preview 빈 배열을 반환한다.

### 5. 저장 최적화
- [`InspectionReportMapper`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/mapper/InspectionReportMapper.java)에 `existsBySerialNo` 성격의 메서드를 추가한다.
- [`inspection_report_mapper.xml`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/resources/mapper/inspection_report_mapper.xml)에는 `SELECT 1 ... LIMIT 1` 또는 `COUNT(*) > 0` 기반 경량 쿼리를 추가한다.
- [`InspectionDataMapper`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/mapper/InspectionDataMapper.java)에 다건 insert 메서드를 추가한다.
- [`inspection_data_mapper.xml`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/resources/mapper/inspection_data_mapper.xml)에는 `<foreach>` 기반 batch insert를 추가한다.
- 서비스는 기존 건별 insert 루프를 제거하고 버퍼 단위 저장으로 전환한다.

### 6. 에러 처리 정책
- 즉시 실패:
  - `projId` 없음
  - 프로젝트 없음
  - `serialNo` 파싱 실패
  - `inspDt` 파싱 실패
  - 프로젝트 컬럼 설정 오류
  - 저장 가능한 행이 0건인 경우
- skip 처리:
  - `charNo` 없음
  - `nominal` 없음
  - `measuredValue` 없음
  - characteristic 매핑 실패
  - axis 누락으로 인한 모호성
- 응답에는 모든 skip 상세를 싣지 않고 총 건수와 preview 샘플만 유지한다.

### 7. 로깅 정책
- 업로드 요약 로그는 유지한다.
- 행별 `INFO` 로그는 제거하거나 `DEBUG`로 낮춘다.
- 대용량 업로드에서는 배치 flush 단위로만 간단한 진행 로그를 남긴다.

## 테스트 전략
- 단위 테스트:
  - preview 샘플 상한이 지켜지는지
  - skip/parsed/inserted 집계가 정확한지
  - duplicate exists 경량 경로가 동작하는지
- 서비스 통합 테스트:
  - 정상 업로드 시 report 1건 + data N건 batch 저장
  - duplicate serial이면 저장 생략
  - axis fallback 및 skip 규칙 유지
  - 900건 이상 fixture에서 전체 `parsedRows`를 반환하지 않고 샘플만 유지
- API 테스트:
  - 응답 메시지 분기 유지
  - `parsedRowCount`는 전체 건수, `parsedRows`는 샘플 건수만 반환

## 접근 방식 비교
- 저장 최적화만 적용:
  - 구현 난도는 낮지만 메모리 절감이 제한적이다.
- 하이브리드 2단계 파싱:
  - 메타 좌표 해석 유연성과 대용량 스트리밍 성능을 같이 확보할 수 있다.
  - 현재 프로젝트에 남아 있는 EasyExcel 자산을 재사용하기 좋다.
- 전면 스트리밍 전환:
  - 최적화 폭은 크지만 현재 셀 좌표 기반 메타 추출 규칙을 거의 다시 만들어야 해 리스크가 크다.
- 본 작업은 하이브리드 2단계 파싱을 채택한다.

## 주요 변경 사항
- 업로드 파싱을 메타 추출과 측정 행 스트리밍으로 분리
- 측정 데이터 저장을 batch insert로 전환
- serial 중복 검사를 exists 경량 쿼리로 분리
- 응답을 전체 row dump 대신 요약 + 샘플 preview 중심으로 변경
- 대용량 업로드용 테스트 시나리오 추가

## 검증 결과
- 설계 단계이므로 아직 미검증

## 남은 TODO
- `ExcelParsePreviewRespDto` 샘플 preview 계약 확정
- EasyExcel 스트리밍 reader와 accumulator 구현
- `insp_data_tb` batch insert mapper 구현
- duplicate exists 쿼리 및 기존 조회 호출 교체
- 서비스/통합/API 테스트 갱신
