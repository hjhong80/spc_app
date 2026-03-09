# 필드 매핑 포커스 이동 및 업로드 UI 개선 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 필드 매핑 입력 흐름과 데이터 입력/조회 화면의 업로드 경험을 개선한다.

**Architecture:** 필드 매핑 화면은 ref 기반 포커스 제어를 순서 테이블로 단순화하고, 데이터 소스 선택기는 선택 버튼과 실제 입력 간 포커스 연결만 담당한다. 데이터 입력/조회 화면은 업로드 버튼 상태 표현과 패널 제목만 조정해 기존 동작을 유지한다.

**Tech Stack:** React 19, MUI 7, Vitest, Testing Library

---

### Task 1: 필드 매핑 자동 포커스 이동 테스트와 구현

**Files:**
- Modify: `spc_front/src/component/project/ProjectFieldMapperSelector.jsx`
- Test: `spc_front/src/component/project/ProjectFieldMapperSelector.test.jsx`

**Step 1: Write the failing test**
- `제품명` blur 후 `도면 번호`로 포커스 이동
- `도면 번호` blur 후 `시리얼 번호` 첫 입력으로 포커스 이동
- `데이터 시작 행` blur 후 `Characteristic No`로 포커스 이동
- `Measured Value` blur 후 `Upper Tolerance`로 포커스 이동

**Step 2: Run test to verify it fails**
- Run: `npm.cmd run test:unit -- ProjectFieldMapperSelector.test.jsx`
- Expected: FAIL because no focus handoff exists yet.

**Step 3: Write minimal implementation**
- 포커스 순서 테이블 추가
- 대상 입력 ref 등록
- blur 시 유효한 값이면 다음 입력으로 `focus()` 호출

**Step 4: Run test to verify it passes**
- Run: `npm.cmd run test:unit -- ProjectFieldMapperSelector.test.jsx`
- Expected: PASS

### Task 2: 데이터 소스 선택 버튼 포커스 이동 테스트와 구현

**Files:**
- Modify: `spc_front/src/component/project/ProjectFieldMapperSelectorDataSourceSelector.jsx`
- Test: `spc_front/src/component/project/ProjectFieldMapperSelectorDataSourceSelector.test.jsx`

**Step 1: Write the failing test**
- `파일명` 버튼 클릭 시 `시작` 입력 포커스
- `확장자` 버튼 클릭 시 `거리` 입력 포커스
- `셀` 버튼 클릭 시 셀 좌표 입력 포커스
- 셀 좌표 입력 blur 시 자동 이동이 일어나지 않음 확인

**Step 2: Run test to verify it fails**
- Run: `npm.cmd run test:unit -- ProjectFieldMapperSelectorDataSourceSelector.test.jsx`
- Expected: FAIL because toggle click does not move focus today.

**Step 3: Write minimal implementation**
- 모드별 첫 입력 ref 추가
- 토글 선택 변경 시 해당 입력으로 포커스 이동
- 셀 좌표 입력은 자동 이동 로직을 추가하지 않음

**Step 4: Run test to verify it passes**
- Run: `npm.cmd run test:unit -- ProjectFieldMapperSelectorDataSourceSelector.test.jsx`
- Expected: PASS

### Task 3: 업로드 버튼 스피너와 제목 UI 테스트 및 구현

**Files:**
- Modify: `spc_front/src/component/spc-data/SpcDataUploadPanel.jsx`
- Modify: `spc_front/src/component/spc-data/SpcProjectListPanel.jsx`
- Test: `spc_front/src/component/spc-data/SpcDataUploadPanel.test.jsx`
- Test: `spc_front/src/component/spc-data/SpcProjectListPanel.test.jsx`

**Step 1: Write the failing test**
- `isUploading=true`일 때 업로드 버튼 안에 스피너와 `업로드 중...` 텍스트가 보임
- `성적서 등록` 제목이 존재함
- `데이터 조회` 제목이 존재함

**Step 2: Run test to verify it fails**
- Run: `npm.cmd run test:unit -- SpcDataUploadPanel.test.jsx SpcProjectListPanel.test.jsx`
- Expected: FAIL because spinner and right-side title are absent.

**Step 3: Write minimal implementation**
- 업로드 버튼에 `CircularProgress` 조건부 렌더링
- 좌측 제목 font size 상향
- 우측 패널 상단에 `데이터 조회` 제목 추가

**Step 4: Run test to verify it passes**
- Run: `npm.cmd run test:unit -- SpcDataUploadPanel.test.jsx SpcProjectListPanel.test.jsx`
- Expected: PASS

### Task 4: 최종 검증

**Files:**
- Review only

**Step 1: Run final verification once**
- Run: `npm.cmd run test:unit`
- Expected: PASS

**Step 2: Manual review**
- 필드 순서와 예외 규칙이 요구사항과 일치하는지 점검
- 제목 시각 계층이 좌우 패널에서 동일한지 점검
