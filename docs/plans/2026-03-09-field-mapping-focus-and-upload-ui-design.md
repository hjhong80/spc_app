# 필드 매핑 포커스 이동 및 업로드 UI 개선 설계

## 작업 목적
- 프로젝트 필드 매핑 화면에서 입력 완료 후 다음 필드로 자연스럽게 이동하도록 포커스 흐름을 정리한다.
- 시리얼 번호와 측정 시간 데이터 소스 선택 버튼 클릭 시 해당 입력으로 즉시 포커스를 이동시킨다.
- 다중 성적서 업로드 중 업로드 버튼에 스피너를 표시해 진행 상태를 명확히 한다.
- 데이터 입력/조회 화면의 좌우 패널 제목 시각적 위계를 맞춘다.

## 요구사항 정리
- 자동 이동 순서:
  `제품명 -> 도면번호 -> 시리얼번호 -> 측정시간 -> 데이터 시작행 -> Characteristic No -> Axis -> Nominal -> Measured Value -> Upper Tolerance -> Lower Tolerance`
- 자동 이동 시점은 기본적으로 포커스 이탈 시점이다.
- 시리얼 번호와 측정 시간의 `셀` 좌표 입력은 여러 개를 누적할 수 있으므로 자동 이동 대상에서 제외한다.
- 시리얼 번호/측정 시간의 `파일명`, `확장자`, `셀` 버튼 클릭 시 해당 모드의 첫 입력 필드로 포커스를 이동한다.
- 업로드 버튼은 `isUploading` 동안 스피너와 진행 텍스트를 함께 표시한다.
- 좌측 `성적서 등록` 제목은 약 20% 키우고, 우측 패널에도 동일한 시각적 레벨의 `데이터 조회` 표제를 추가한다.

## 설계 결정

### 1. 필드 매핑 포커스 제어
- `ProjectFieldMapperSelector.jsx`에 입력별 ref 맵을 둔다.
- 포커스 이동 순서를 상수 테이블로 정의하고, `onBlur` 시 현재 필드 값이 비어 있지 않거나 유효할 때 다음 ref로 이동한다.
- 제품명, 도면번호, 데이터 시작행, 열 매핑 입력만 자동 이동 대상에 포함한다.
- 시리얼 번호와 측정 시간은 `DataSourceSelector` 내부에서 모드별 입력 ref를 노출하고, 상위 컴포넌트가 아닌 하위 컴포넌트가 직접 해당 입력을 포커싱한다.

### 2. 데이터 소스 선택기 포커스 정책
- `filenameRange` 선택 시 `start` 입력으로 이동한다.
- `filenameOffset` 선택 시 `offset` 입력으로 이동한다.
- `cellCoordinate` 선택 시 `cell` 입력으로 이동한다.
- `cellCoordinate` 입력은 blur 시 자동 이동하지 않는다.
- 토글 버튼 클릭에 따른 포커스 이동은 기존 값 보존과 충돌하지 않도록 `useEffect` 또는 선택 변경 핸들러에서 처리한다.

### 3. 업로드 버튼 상태 표현
- `SpcDataUploadPanel.jsx`의 업로드 버튼에 `CircularProgress`를 `startIcon` 대신 조건부 렌더링한다.
- 업로드 중 텍스트는 `업로드 중...`를 유지한다.
- 버튼 비활성화 정책은 기존과 동일하게 `isUploading || selectedFiles.length === 0`를 유지한다.

### 4. 데이터 입력/조회 화면 제목 정렬
- 좌측 `성적서 등록` 타이포그래피의 `fontSize`를 20% 정도 상향한다.
- 우측 `SpcProjectListPanel.jsx`에도 같은 크기와 상단 여백의 `데이터 조회` 제목을 추가한다.
- 기존 `프로젝트 리스트` 텍스트는 보조 설명 수준으로 낮추거나 제거해 제목 계층이 중복되지 않게 정리한다.

## 영향 파일
- `spc_front/src/component/project/ProjectFieldMapperSelector.jsx`
- `spc_front/src/component/project/ProjectFieldMapperSelectorDataSourceSelector.jsx`
- `spc_front/src/component/spc-data/SpcDataUploadPanel.jsx`
- `spc_front/src/component/spc-data/SpcProjectListPanel.jsx`

## 테스트 전략
- `ProjectFieldMapperSelector` 테스트에서 blur 후 다음 필드로 포커스가 이동하는지 확인한다.
- `DataSourceSelector` 테스트에서 `파일명`, `확장자`, `셀` 버튼 클릭 시 대응 입력이 포커스를 받는지 확인한다.
- `SpcDataUploadPanel` 테스트에서 `isUploading`일 때 버튼 스피너와 `업로드 중...` 문구가 표시되는지 확인한다.
- `SpcProjectListPanel` 테스트에서 `데이터 조회` 제목이 렌더링되는지 확인한다.

## 남은 TODO
- 구현 후 접근성 측면에서 포커스 이동이 스크린 리더 흐름을 해치지 않는지 확인한다.
- 실제 브라우저에서 MUI `ToggleButtonGroup` 포커스 타이밍이 테스트와 동일한지 최종 검증한다.
