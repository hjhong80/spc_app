# 업로드 진행률 버튼 설계

## 작업 목적
- 데이터 입력/조회 화면의 업로드 버튼이 파일 단위 진행 상황을 직관적으로 보여주도록 개선한다.
- 여러 파일 업로드 시 사용자가 현재 얼마나 진행됐는지, 마지막 완료가 언제인지 즉시 이해할 수 있게 한다.

## 요구사항 정리
- 업로드는 현재처럼 파일 1개씩 순차 전송한다.
- 진행률 기준은 바이트가 아니라 `완료된 파일 수 / 전체 파일 수`다.
- 예시: 10개 파일일 때
  - 첫 번째 파일 전송 중 `0%`
  - 두 번째 파일 전송 시점 `10%`
  - 세 번째 파일 전송 시점 `20%`
  - ...
  - 열 번째 파일 전송 시점 `90%`
  - 열 번째 파일의 백엔드 저장 응답이 끝난 시점 `100%`
- 버튼 자체가 차오르는 형태로 표시한다.
- 업로드 버튼은 가로 폭만 기존 대비 약 2.5배 키우고, 패널 내 중앙 정렬한다.
- 세로 높이는 기존과 크게 다르게 하지 않는다.

## 현재 구조 확인
- 프론트 [SpcData.jsx](/Users/USER/Documents/MyProjects/spc_project/spc_front/src/page/SpcData.jsx)에서 `selectedFiles`를 `for` 루프로 순회하며 파일별 `upload()`를 순차 호출한다.
- 업로드 API는 [excel-controller.ts](/Users/USER/Documents/MyProjects/spc_project/spc_front/src/apis/generated/excel-controller/excel-controller.ts)를 통해 파일 한 개씩 전송한다.
- 백엔드 [ExcelController.java](/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/controller/spcdata/excel/ExcelController.java)는 단일 파일 요청에 대해 최종 응답만 반환한다.

## 설계 결정

### 1. 진행률 계산 방식
- 프론트 상태로 `uploadProgressPercent`, `uploadProgressCompletedCount`, `uploadProgressTotalCount`, `uploadProgressPhase`를 관리한다.
- 업로드 시작 직후:
  - `completedCount = 0`
  - `totalCount = selectedFiles.length`
  - `percent = 0`
- 각 파일의 백엔드 응답이 성공 또는 실패로 반환되면 해당 파일은 “완료된 파일”로 간주한다.
- 다음 파일 업로드를 시작하기 전 퍼센트는 `Math.floor((completedCount / totalCount) * 100)`로 계산한다.
- 마지막 파일 전송 중에는 `90%`를 유지하고, 마지막 파일의 응답이 성공적으로 끝난 뒤에만 `100%`를 설정한다.

### 2. 실패 처리 정책
- 중간 파일이 실패해도 현재 구현처럼 다음 파일 업로드는 계속 진행한다.
- 진행률은 “완료된 파일 수” 기준이므로 실패 파일도 응답이 끝났다면 완료 수에 포함한다.
- 최종 메시지에서만 성공/실패 상세를 구분한다.
- 전체 작업이 끝났을 때:
  - 성공/부분 성공/전체 실패 여부와 관계없이 마지막 응답이 끝난 시점에 진행률은 `100%`
  - 이후 짧은 지연 없이 기본 버튼 상태로 복귀한다.

### 3. 버튼 UI
- [SpcDataUploadPanel.jsx](/Users/USER/Documents/MyProjects/spc_project/spc_front/src/component/spc-data/SpcDataUploadPanel.jsx)에서 업로드 버튼을 커스텀 스타일로 렌더링한다.
- 버튼 내부 구성:
  - 배경 베이스 레이어
  - 진행률 fill 레이어
  - 중앙 텍스트 레이어
- 텍스트 예시:
  - 업로드 중: `업로드 중 30%`
  - 보조 문구: `3 / 10 완료`
  - 마지막 응답 대기 중: `마지막 파일 저장 중`
- 버튼 너비는 기존 `140px` 기준 약 `350px` 전후로 조정하고, 가운데 정렬한다.

### 4. 상태 전달 구조
- 진행률 상태는 업로드 루프가 있는 [SpcData.jsx](/Users/USER/Documents/MyProjects/spc_project/spc_front/src/page/SpcData.jsx)에서 계산한다.
- [SpcDataUploadPanel.jsx](/Users/USER/Documents/MyProjects/spc_project/spc_front/src/component/spc-data/SpcDataUploadPanel.jsx)에는 아래 prop을 추가한다.
  - `uploadProgressPercent`
  - `uploadProgressCompletedCount`
  - `uploadProgressTotalCount`
  - `uploadProgressPhase`
- 패널은 전달받은 상태를 그대로 시각화만 한다.

## 테스트 전략
- `SpcDataUploadPanel` 테스트에서 진행률 값에 따라 버튼 fill 너비와 텍스트가 바뀌는지 확인한다.
- `SpcData` 업로드 흐름 테스트 또는 유닛 테스트에서 다중 파일 업로드 시 `0 -> 10 -> ... -> 100` 규칙으로 상태가 갱신되는지 확인한다.
- 마지막 파일 처리 완료 전에는 `90%`가 유지되고, 마지막 응답 완료 후 `100%`가 되는지 확인한다.

## 남은 TODO
- 진행률 100%가 보이자마자 바로 기본 상태로 돌아가면 체감이 약할 수 있으므로, 필요하면 300~500ms 유지 여부를 후속 검토한다.
- 추후 진짜 서버 처리 진행률이 필요해지면 SSE 또는 polling 기반 상태 채널을 별도 설계해야 한다.
