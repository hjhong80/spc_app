# 차트 성능 알림 위치 조정 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 차트 성능 알림을 토글 버튼 아래의 반투명 floating alert로 전환한다.

**Architecture:** 성능 알림의 표현 규칙은 `chartNotifications` helper에 추가하고, `Chart.jsx`는 `ToggleButtonGroup` 래퍼 ref를 앵커로 사용해 `Popper`를 렌더링한다. 일반 메시지 히스토리와 배지 로직은 그대로 유지한다.

**Tech Stack:** React, MUI, Vitest, Testing Library

---

### Task 1: 프레젠테이션 규칙 테스트 작성

**Files:**
- Modify: `spc_front/src/page/chartNotifications.test.js`

**Step 1: Write the failing test**
- `info` 메시지만 floating 알림인지 검증한다.
- `info` 스타일이 반투명 배경색을 반환하는지 검증한다.

**Step 2: Run test to verify it fails**

Run: `npm.cmd run test:unit -- src/page/chartNotifications.test.js`
Expected: helper 함수 부재로 FAIL

### Task 2: helper 확장

**Files:**
- Modify: `spc_front/src/page/chartNotifications.js`

**Step 1: Write minimal implementation**
- floating 알림 여부와 알림 표면 스타일 계산 함수를 추가한다.

**Step 2: Run test to verify it passes**

Run: `npm.cmd run test:unit -- src/page/chartNotifications.test.js`
Expected: PASS

### Task 3: Chart 렌더링 전환

**Files:**
- Modify: `spc_front/src/page/Chart.jsx`

**Step 1: Write minimal implementation**
- 토글 버튼 그룹 래퍼 ref 추가
- `info` 성능 알림은 `Popper`로 렌더링
- 나머지 알림은 기존 top-right `Snackbar` 유지

**Step 2: Run project unit tests**

Run: `npm.cmd run test:unit`
Expected: PASS
