# 데이터 조회 패널 레이아웃 정리 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 데이터 조회 패널에서 설명 문구를 제거하고 검색 영역을 프로젝트 리스트 섹션 아래로 이동한다.

**Architecture:** `SpcProjectListPanel`의 상단 레이아웃 순서만 조정하고 기존 데이터 로딩, 검색, 새로고침, 리스트 선택 로직은 그대로 유지한다. 테스트는 패널 텍스트와 DOM 순서를 기준으로 검증한다.

**Tech Stack:** React, MUI, Vitest, Testing Library

---

### Task 1: 레이아웃 회귀 테스트 작성

**Files:**
- Modify: `spc_front/src/component/spc-data/SpcProjectListPanel.test.jsx`

**Step 1: Write the failing test**
- 설명 문구가 제거되었는지 확인한다.
- `프로젝트 리스트`와 안내 문구가 검색 입력보다 앞에 있는지 확인한다.

**Step 2: Run test to verify it fails**

Run: `npm.cmd run test:unit -- src/component/spc-data/SpcProjectListPanel.test.jsx`
Expected: 현재 배치 때문에 DOM 순서 검증이 실패한다.

### Task 2: 최소 구현

**Files:**
- Modify: `spc_front/src/component/spc-data/SpcProjectListPanel.jsx`

**Step 1: Write minimal implementation**
- 상단 설명 문구를 제거한다.
- 검색/새로고침 `Stack`을 `프로젝트 리스트` 섹션 아래로 이동한다.

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
