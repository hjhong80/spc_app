# 데이터 조회 하단 검색 툴바 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 데이터 조회 패널에서 검색 입력창과 새로고침 버튼을 리스트 박스 아래로 이동한다.

**Architecture:** `SpcProjectListPanel`의 상단/중단 레이아웃 순서만 조정하고 검색, 새로고침, 상태 표시 로직은 그대로 유지한다. 테스트는 빈 상태 메시지와 검색 입력의 DOM 순서를 기준으로 검증한다.

**Tech Stack:** React, MUI, Vitest, Testing Library

---

### Task 1: 레이아웃 회귀 테스트 작성

**Files:**
- Modify: `spc_front/src/component/spc-data/SpcProjectListPanel.test.jsx`

**Step 1: Write the failing test**
- 빈 상태 메시지가 검색 입력보다 먼저 렌더링되는지 확인한다.

**Step 2: Run test to verify it fails**

Run: `npm.cmd run test:unit -- src/component/spc-data/SpcProjectListPanel.test.jsx`
Expected: 현재는 검색 입력이 리스트 박스 위에 있으므로 FAIL

### Task 2: 최소 구현

**Files:**
- Modify: `spc_front/src/component/spc-data/SpcProjectListPanel.jsx`

**Step 1: Write minimal implementation**
- 검색/새로고침 `Stack`을 리스트 박스 아래로 이동한다.

**Step 2: Run test to verify it passes**

Run: `npm.cmd run test:unit -- src/component/spc-data/SpcProjectListPanel.test.jsx`
Expected: PASS

### Task 3: 최종 검증

**Files:**
- Verify: `spc_front/src/component/spc-data/SpcProjectListPanel.jsx`
- Verify: `spc_front/src/component/spc-data/SpcProjectListPanel.test.jsx`

**Step 1: Run project unit tests**

Run: `npm.cmd run test:unit`
Expected: PASS
