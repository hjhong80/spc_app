# 업로드 진행률 버튼 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 데이터 입력/조회 화면의 업로드 버튼을 파일 단위 계단식 진행률 버튼으로 바꾼다.

**Architecture:** 업로드 루프가 존재하는 `SpcData.jsx`가 전체 파일 기준 진행률 상태를 계산하고, `SpcDataUploadPanel.jsx`는 전달받은 진행률을 버튼 fill UI로 렌더링한다. 진행률 기준은 파일 완료 수이며, 마지막 파일 응답이 끝나기 전까지는 90%를 유지한다.

**Tech Stack:** React 19, MUI 7, Vitest, Testing Library, Axios 기반 API 래퍼

---

### Task 1: 업로드 버튼 진행률 UI 테스트 작성

**Files:**
- Modify: `spc_front/src/component/spc-data/SpcDataUploadPanel.test.jsx`
- Modify: `spc_front/src/component/spc-data/SpcDataUploadPanel.jsx`

**Step 1: Write the failing test**
- 진행률 `30%`일 때 버튼에 `업로드 중 30%` 텍스트가 보이는 테스트를 추가한다.
- `3 / 10 완료` 보조 문구가 보이는 테스트를 추가한다.
- 버튼 fill 레이어가 `30%`에 대응하는 스타일 값을 갖는지 검증한다.

**Step 2: Run test to verify it fails**
- Run: `npm.cmd run test:unit -- SpcDataUploadPanel.test.jsx`
- Expected: FAIL because the current button does not render progress fill or file-count text.

**Step 3: Write minimal implementation**
- 업로드 버튼에 progress fill 레이어와 중앙 텍스트 레이어를 추가한다.
- 버튼 폭을 가로 기준 약 2.5배로 키우고 중앙 정렬한다.

**Step 4: Run test to verify it passes**
- Run: `npm.cmd run test:unit -- SpcDataUploadPanel.test.jsx`
- Expected: PASS

### Task 2: 업로드 진행률 상태 계산 테스트 작성

**Files:**
- Create: `spc_front/src/page/spcDataUploadProgress.test.js`
- Modify: `spc_front/src/page/SpcData.jsx`

**Step 1: Write the failing test**
- 총 10개 파일 기준으로:
  - 시작 시 `0%`
  - 첫 번째 응답 완료 후 다음 파일 전송 단계에서 `10%`
  - 아홉 번째 응답 완료 후 열 번째 파일 전송 단계에서 `90%`
  - 마지막 응답 완료 후 `100%`
- 실패 파일도 “응답 완료” 기준으로 완료 수에 반영되는 테스트를 추가한다.

**Step 2: Run test to verify it fails**
- Run: `npm.cmd run test:unit -- spcDataUploadProgress.test.js`
- Expected: FAIL because no dedicated progress state calculation exists yet.

**Step 3: Write minimal implementation**
- `SpcData.jsx`에 진행률 상태를 추가한다.
- 업로드 루프 시작/파일 완료/최종 완료 시점에 상태를 갱신한다.
- 필요하면 순수 계산 헬퍼를 추출해 테스트 가능하게 만든다.

**Step 4: Run test to verify it passes**
- Run: `npm.cmd run test:unit -- spcDataUploadProgress.test.js`
- Expected: PASS

### Task 3: 업로드 패널과 페이지 연결

**Files:**
- Modify: `spc_front/src/page/SpcData.jsx`
- Modify: `spc_front/src/component/spc-data/SpcDataUploadPanel.jsx`

**Step 1: Write the failing integration expectation**
- `SpcDataUploadPanel`에 진행률 관련 prop이 전달되는지 확인하는 테스트를 추가하거나 기존 테스트를 확장한다.

**Step 2: Run test to verify it fails**
- Run: `npm.cmd run test:unit -- SpcDataUploadPanel.test.jsx spcDataUploadProgress.test.js`
- Expected: FAIL because the panel is not receiving progress props from the page yet.

**Step 3: Write minimal implementation**
- `SpcData.jsx`에서 계산한 진행률 상태를 `SpcDataUploadPanel`로 전달한다.
- 업로드 종료 시 상태 초기화 정책을 정리한다.

**Step 4: Run test to verify it passes**
- Run: `npm.cmd run test:unit -- SpcDataUploadPanel.test.jsx spcDataUploadProgress.test.js`
- Expected: PASS

### Task 4: 최종 검증

**Files:**
- Review only

**Step 1: Run final verification once**
- Run: `npm.cmd run test:unit`
- Expected: PASS

**Step 2: Manual review**
- 버튼이 패널 중앙에 정렬되는지 확인한다.
- 가로 폭만 확대되고 세로 높이는 크게 변하지 않는지 확인한다.
- 진행률 단계가 `0, 10, 20 ... 90, 100` 규칙을 따르는지 확인한다.
