# TODO

## 작업 목적
- 엑셀 대량 등록 성능을 개선한다.
- 운영 환경에서 남아 있는 최소 후속 점검 항목만 관리한다.

## 해야 할 일
- 엑셀 대량 등록 성능 개선
  - 업로드 900건 수준에서 체감 저하가 있는지 재현 조건 정리
  - `InspectionServiceImpl.persistBatch()`의 측정 데이터 건별 insert를 batch insert로 전환 검토
  - `selectInspectionReportBySerialNo` 기반 중복 체크를 존재 확인용 경량 쿼리로 분리
  - 업로드 시 행별 `INFO` 로그 출력량 축소 또는 `DEBUG` 전환 검토
  - 필요 시 `WorkbookFactory` 기반 전체 로딩 대신 streaming/EasyExcel 경로 전환 검토

## 참고 메모
- 차트 조회 성능은 현재 매우 양호하며, 우선 최적화 대상은 조회보다 엑셀 업로드 저장 경로에 가깝다
