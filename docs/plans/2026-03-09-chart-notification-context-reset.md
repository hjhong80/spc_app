# 차트 메시지 컨텍스트 리셋 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 차트 메시지 히스토리가 월차트 내부에서는 유지되고, 월차트에서 일차트나 전체 차트로 넘어갈 때 초기화되도록 만든다.

**Architecture:** 차트 컨텍스트 키 계산과 리셋 판정은 `chartNotifications` helper로 분리하고, `Chart.jsx`는 그 키 변화만 감시해 히스토리를 초기화한다.

**Tech Stack:** React, Vitest

---

### Task 1: helper 테스트 작성

**Files:**
- Modify: `spc_front/src/page/chartNotifications.test.js`

**Step 1: Write the failing test**
- `main`, `detail-month`, `detail-day` 컨텍스트 키를 계산하는 테스트를 추가한다.
- 월차트 내부 mode 전환은 리셋 안 하고, 월->일/월->전체 전환은 리셋하는 테스트를 추가한다.

**Step 2: Run test to verify it fails**

Run: `npm.cmd run test:unit -- src/page/chartNotifications.test.js`
Expected: helper 함수 부재로 FAIL

### Task 2: helper 구현

**Files:**
- Modify: `spc_front/src/page/chartNotifications.js`

**Step 1: Write minimal implementation**
- 컨텍스트 키 계산 함수와 리셋 판정 함수를 추가한다.

**Step 2: Run test to verify it passes**

Run: `npm.cmd run test:unit -- src/page/chartNotifications.test.js`
Expected: PASS

### Task 3: Chart 연결

**Files:**
- Modify: `spc_front/src/page/Chart.jsx`

**Step 1: Write minimal implementation**
- 현재 차트 컨텍스트 키를 계산한다.
- 컨텍스트 키가 바뀌면 메시지 히스토리, 활성 알림, 팝오버를 초기화한다.

**Step 2: Run project unit tests**

Run: `npm.cmd run test:unit`
Expected: PASS
