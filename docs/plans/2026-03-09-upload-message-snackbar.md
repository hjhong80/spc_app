# 업로드 메시지 스낵바 및 히스토리 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 업로드 관련 메시지를 버튼 아래 반투명 스낵바와 헤더 메시지 히스토리로 통합한다.

**Architecture:** `SpcData.jsx`가 업로드 메시지 센터 상태와 메시지 분류를 관리하고, `SpcDataUploadPanel.jsx`는 현재 활성 메시지를 버튼 아래에 표시한다. 헤더의 `rightSlot`에는 차트 페이지 패턴을 참고한 메시지 아이콘과 팝오버 히스토리를 추가한다.

**Tech Stack:** React 19, MUI 7, Vitest, Testing Library

---

### Task 1: 업로드 패널 메시지 영역 테스트 작성

**Files:**
- Modify: `spc_front/src/component/spc-data/SpcDataUploadPanel.test.jsx`
- Modify: `spc_front/src/component/spc-data/SpcDataUploadPanel.jsx`

**Step 1: Write the failing test**
- 버튼 아래 기존 보조 텍스트가 더 이상 렌더링되지 않는 테스트를 추가한다.
- `activeNotification`이 있을 때 버튼 아래 반투명 알림 박스가 보이는 테스트를 추가한다.
- severity가 `success`, `warning`, `error`일 때 스타일 또는 테스트용 속성이 달라지는지 확인하는 테스트를 추가한다.

**Step 2: Run test to verify it fails**
- Run: `npm.cmd run test:unit -- SpcDataUploadPanel.test.jsx`
- Expected: FAIL because the panel still renders plain text messages and has no notification box.

**Step 3: Write minimal implementation**
- 업로드 패널 하단 텍스트를 제거한다.
- 버튼 바로 아래에 severity 기반 알림 박스를 렌더링한다.

**Step 4: Run test to verify it passes**
- Run: `npm.cmd run test:unit -- SpcDataUploadPanel.test.jsx`
- Expected: PASS

### Task 2: 업로드 메시지 센터 상태와 분류 테스트 작성

**Files:**
- Create: `spc_front/src/page/spcDataUploadNotifications.js`
- Create: `spc_front/src/page/spcDataUploadNotifications.test.js`
- Modify: `spc_front/src/page/SpcData.jsx`

**Step 1: Write the failing test**
- 업로드 결과 메시지를 severity별로 분류하는 테스트를 추가한다.
- 메시지 추가 시 히스토리에 누적되고 최근 메시지가 활성 메시지로 설정되는지 확인한다.
- 심각도 우선순위에 따라 헤더 아이콘 표시 색을 결정하는 테스트를 추가한다.

**Step 2: Run test to verify it fails**
- Run: `npm.cmd run test:unit -- spcDataUploadNotifications.test.js`
- Expected: FAIL because no upload message notification helper exists yet.

**Step 3: Write minimal implementation**
- 메시지 생성/누적/최근 심각도 판정 헬퍼를 추가한다.
- `SpcData.jsx` 업로드 완료/경고/실패 경로에서 헬퍼를 사용하도록 바꾼다.

**Step 4: Run test to verify it passes**
- Run: `npm.cmd run test:unit -- spcDataUploadNotifications.test.js`
- Expected: PASS

### Task 3: 헤더 메시지 아이콘과 다시 보기 연결

**Files:**
- Modify: `spc_front/src/page/SpcData.jsx`
- Modify: `spc_front/src/component/common/UnifiedHeaderBar.jsx` (필요 시 only usage level)

**Step 1: Write the failing expectation**
- 헤더 `rightSlot`에 메시지 아이콘이 표시되는 테스트 또는 로직 테스트를 추가한다.
- 아이콘 클릭 시 최근 메시지 목록 팝오버가 열리는 테스트를 추가한다.

**Step 2: Run test to verify it fails**
- Run: `npm.cmd run test:unit -- SpcDataUploadPanel.test.jsx spcDataUploadNotifications.test.js`
- Expected: FAIL because no header message history exists yet.

**Step 3: Write minimal implementation**
- 차트 페이지 패턴을 참고해 메시지 아이콘과 팝오버를 `SpcData.jsx` 헤더에 연결한다.
- 현재 페이지 생명주기 동안만 메시지 배열을 유지한다.

**Step 4: Run test to verify it passes**
- Run: `npm.cmd run test:unit -- SpcDataUploadPanel.test.jsx spcDataUploadNotifications.test.js`
- Expected: PASS

### Task 4: 최종 검증

**Files:**
- Review only

**Step 1: Run final verification once**
- Run: `npm.cmd run test:unit`
- Expected: PASS

**Step 2: Manual review**
- 업로드 버튼 아래 텍스트가 완전히 제거되었는지 확인한다.
- 버튼 아래 알림 박스가 5초 후 사라지는지 확인한다.
- 로그아웃 버튼 오른쪽 메시지 아이콘과 다시 보기 팝오버가 동작하는지 확인한다.
