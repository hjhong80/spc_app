# 업로드 패널 하단 정렬 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 드래그앤드롭존이 업로드 패널의 남는 높이를 채우고 하단 컨트롤이 패널 하단에 정렬되도록 만든다.

**Architecture:** `SpcDataUploadPanel`을 세 개의 수직 섹션으로 나누고, 가운데 드롭존 섹션에만 가변 높이를 부여한다. 테스트는 섹션 래퍼와 스타일 속성을 기준으로 검증한다.

**Tech Stack:** React, MUI, Vitest, Testing Library

---

### Task 1: 레이아웃 회귀 테스트 작성

**Files:**
- Modify: `spc_front/src/component/spc-data/SpcDataUploadPanel.test.jsx`

**Step 1: Write the failing test**
- 드롭존 섹션 래퍼와 하단 컨트롤 래퍼가 있는지 확인한다.
- 드롭존 섹션이 가변 높이 스타일을 가지는지 확인한다.

**Step 2: Run test to verify it fails**

Run: `npm.cmd run test:unit -- src/component/spc-data/SpcDataUploadPanel.test.jsx`
Expected: 현재 래퍼가 없어서 FAIL

### Task 2: 최소 구현

**Files:**
- Modify: `spc_front/src/component/spc-data/SpcDataUploadPanel.jsx`

**Step 1: Write minimal implementation**
- 상단 정보 영역을 하나의 묶음으로 유지한다.
- 드롭존을 가변 영역 래퍼 안으로 옮긴다.
- `LOT 번호`와 업로드 버튼을 하단 컨트롤 래퍼로 묶는다.

**Step 2: Run test to verify it passes**

Run: `npm.cmd run test:unit -- src/component/spc-data/SpcDataUploadPanel.test.jsx`
Expected: PASS

### Task 3: 최종 검증

**Files:**
- Verify: `spc_front/src/component/spc-data/SpcDataUploadPanel.jsx`
- Verify: `spc_front/src/component/spc-data/SpcDataUploadPanel.test.jsx`

**Step 1: Run project unit tests**

Run: `npm.cmd run test:unit`
Expected: PASS
