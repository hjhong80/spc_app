# 업로드 메시지 스낵바 및 히스토리 설계

## 작업 목적
- 업로드 버튼 아래의 보조 텍스트 영역을 제거하고, 업로드 관련 메시지를 모두 스낵바로 통합한다.
- 성공, 경미 경고, 심각 경고를 색상으로 구분해 즉시 전달한다.
- 로그아웃 버튼 오른쪽 메시지 아이콘으로 현재 페이지에서 발생한 업로드 메시지를 다시 볼 수 있게 한다.

## 요구사항 정리
- 업로드 버튼 아래의 `파일 미선택`, `n / total 완료`, `마지막 파일 저장 중` 같은 텍스트는 모두 제거한다.
- 업로드 관련 모든 메시지는 스낵바로 표시한다.
- 메시지 분류:
  - 성공: 녹색 반투명
  - 경미한 경고: 노란색 반투명
  - 심각한 경고: 붉은색 반투명
- 스낵바는 발생 즉시 업로드 버튼 바로 아래에 표시한다.
- 스낵바는 `5초` 동안 보였다가 자동으로 사라진다.
- 헤더에서 로그아웃 버튼 오른쪽에 메시지 아이콘을 두고, 클릭 시 현재 페이지 체류 중 쌓인 업로드 메시지를 다시 볼 수 있어야 한다.
- 메시지 히스토리는 페이지를 떠나면 유지하지 않는다.

## 현재 구조 확인
- [SpcDataUploadPanel.jsx](/Users/USER/Documents/MyProjects/spc_project/spc_front/src/component/spc-data/SpcDataUploadPanel.jsx)는 버튼 아래에 상태 텍스트와 하단 일반 메시지 텍스트를 렌더링한다.
- [SpcData.jsx](/Users/USER/Documents/MyProjects/spc_project/spc_front/src/page/SpcData.jsx)는 업로드 결과를 `uploadMessage`, `uploadStatus` 문자열 상태로만 관리한다.
- [UnifiedHeaderBar.jsx](/Users/USER/Documents/MyProjects/spc_project/spc_front/src/component/common/UnifiedHeaderBar.jsx)는 `rightSlot` 확장을 지원한다.
- [Chart.jsx](/Users/USER/Documents/MyProjects/spc_project/spc_front/src/page/Chart.jsx)는 헤더 우측 아이콘 + `Snackbar`/`Popover` 패턴을 이미 사용 중이다.

## 설계 결정

### 1. 메시지 상태 구조
- [SpcData.jsx](/Users/USER/Documents/MyProjects/spc_project/spc_front/src/page/SpcData.jsx)에 업로드 메시지 센터 상태를 둔다.
- 상태 예시:
  - `uploadNotifications`: 최근 메시지 배열
  - `activeUploadNotification`: 현재 자동 표시 중인 메시지
  - `isUploadSnackbarOpen`: 버튼 아래 스낵바 open 상태
  - `uploadMessageAnchorEl`: 헤더 아이콘 팝오버 anchor
- 메시지 모델:
  - `id`
  - `severity`: `success | warning | error`
  - `message`
  - `createdAt`

### 2. 메시지 분류 정책
- 전체 성공: `success`
- 중복 스킵 포함, fallback 의미의 부분 성공, 사용자 조치가 필요하지만 치명적이지 않은 경우: `warning`
- 일부 실패, 전체 실패, 업로드 시작 자체 불가, 서버 오류: `error`
- 기존 `uploadStatus` 문자열은 제거하거나 내부 분류 함수로 대체한다.

### 3. 스낵바 표시 방식
- [SpcDataUploadPanel.jsx](/Users/USER/Documents/MyProjects/spc_project/spc_front/src/component/spc-data/SpcDataUploadPanel.jsx) 안에 업로드 버튼 바로 아래 `Snackbar`를 렌더링한다.
- `anchorOrigin`만으로는 버튼 바로 아래 고정이 어려우므로, 버튼 아래 전용 컨테이너에 `Snackbar` 또는 `Alert` 스타일 박스를 렌더링하는 편이 더 정확하다.
- 자동 닫힘은 `5000ms`
- 색상 스타일:
  - 성공: 반투명 녹색 배경 + 연녹색 테두리
  - 경고: 반투명 황갈색 배경 + 노란 테두리
  - 오류: 반투명 적갈색 배경 + 붉은 테두리

### 4. 헤더 메시지 아이콘과 다시 보기
- [SpcData.jsx](/Users/USER/Documents/MyProjects/spc_project/spc_front/src/page/SpcData.jsx)에서 [UnifiedHeaderBar.jsx](/Users/USER/Documents/MyProjects/spc_project/spc_front/src/component/common/UnifiedHeaderBar.jsx)의 `rightSlot`에 메시지 아이콘을 넣는다.
- 아이콘은 최근 메시지의 최고 심각도 색을 따른다.
- 아이콘 클릭 시 `Popover`를 열고 최근 업로드 메시지 목록을 렌더링한다.
- 현재 페이지 생명주기 동안만 유지하므로 store나 localStorage는 사용하지 않는다.

## 테스트 전략
- `SpcDataUploadPanel` 테스트:
  - 버튼 아래 보조 텍스트가 렌더링되지 않는지 확인
  - 활성 메시지가 있을 때 버튼 아래 반투명 알림 박스가 렌더링되는지 확인
  - severity별 색상 클래스/스타일이 바뀌는지 확인
- `SpcData` 또는 메시지 헬퍼 테스트:
  - 업로드 결과에 따라 severity가 올바르게 매핑되는지 확인
  - 메시지가 히스토리에 누적되는지 확인
  - 최근 메시지 기준으로 헤더 아이콘 색상이 바뀌는지 확인

## 남은 TODO
- 메시지 히스토리 최대 보관 개수는 구현 시점에 10개 내외로 제한하는 것이 적절한지 검토한다.
- 업로드 진행률 상태와 메시지 노출이 동시에 있을 때 레이아웃이 겹치지 않는지 실제 화면에서 확인한다.
