# 차트 성능칩 스낵바 전환 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 차트 페이지의 성능 칩을 제거하고 2초짜리 스낵바 및 메시지 배지 체계로 전환한다.

**Architecture:** 메시지 히스토리와 심각도 계산은 별도 헬퍼로 분리하고, `Chart.jsx`는 그 헬퍼를 사용해 성능/성공/경고 메시지를 누적 관리한다. 자동 표시가 필요한 것은 성능 메시지뿐이며, 나머지는 히스토리와 팝오버로 재확인할 수 있다.

**Tech Stack:** React, MUI, Vitest, Testing Library

---

### Task 1: 메시지 히스토리 헬퍼 테스트 작성

**Files:**
- Create: `spc_front/src/page/chartNotifications.test.js`

**Step 1: Write the failing test**
- 메시지 누적, 개수 제한, 최고 심각도 계산, 자동 숨김 시간 계산을 검증한다.

**Step 2: Run test to verify it fails**

Run: `npm.cmd run test:unit -- src/page/chartNotifications.test.js`
Expected: helper 파일이 아직 없어 FAIL

### Task 2: 헬퍼 구현

**Files:**
- Create: `spc_front/src/page/chartNotifications.js`

**Step 1: Write minimal implementation**
- 알림 생성, 누적, 최고 심각도 계산, autoHideDuration 계산 함수를 구현한다.

**Step 2: Run test to verify it passes**

Run: `npm.cmd run test:unit -- src/page/chartNotifications.test.js`
Expected: PASS

### Task 3: Chart 연결

**Files:**
- Modify: `spc_front/src/page/Chart.jsx`

**Step 1: Write minimal implementation**
- 성능 `Chip` 제거
- 메시지 히스토리 상태 추가
- `MessageIcon + Badge` 적용
- 성능 메시지는 2초짜리 스낵바로 자동 표시
- 성공/경고/노이즈 경고는 히스토리에 누적

**Step 2: Run project unit tests**

Run: `npm.cmd run test:unit`
Expected: PASS
