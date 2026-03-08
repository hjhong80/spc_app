# 로컬 환경파일 복구 및 실행 경로 정리 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 루트 `spc.env` 기준으로 로컬 실행을 복구하고 환경파일 예시 및 ignore 규칙을 정리한다.

**Architecture:** 백엔드는 루트 `spc.env`를 읽는 실행 경로를 기준으로 정리하고, 프론트는 로컬 개발 서버에서 백엔드 `http://localhost:8080/spc/api`를 기본 API 대상으로 삼는다. 환경파일 ignore 규칙은 루트 `.gitignore`에 집중시켜 배포 준비 시 혼선을 줄인다.

**Tech Stack:** Spring Boot properties, Vite env, PowerShell, Git ignore rules, Markdown docs

---

### Task 1: 루트 환경파일 기준 문서화

**Files:**
- Modify: `README.md`
- Modify: `deploy/spc.env.example`
- Modify: `spc_front/.env.example`
- Create: `spc.env`

**Step 1: Write the failing expectation**

- README와 예시 파일이 현재는 배포 중심 값이라 로컬 실행 기준이 모호한 상태임을 확인한다.

**Step 2: Update docs and examples**

- 루트 `spc.env` 생성 방법, JWT Base64 생성 예시, 로컬 실행 명령을 반영한다.
- 프론트 예시 파일은 로컬 개발 기준 API URL을 사용하도록 정리한다.

### Task 2: 설정 로딩 기준 정리

**Files:**
- Modify: `spc_back/src/main/resources/application.properties`
- Modify: `spc_back/application-example.properties`

**Step 1: Adjust config loading**

- 루트 실행 기준 `spc.env`를 우선으로 읽고, 배포 예시 파일 위치도 유지한다.
- 문서와 실제 설정이 같은 경로 규칙을 사용하도록 맞춘다.

### Task 3: `.gitignore` 규칙 통합

**Files:**
- Modify: `.gitignore`
- Modify: `spc_back/.gitignore`
- Modify: `spc_front/.gitignore`

**Step 1: Consolidate rules**

- 환경파일 관련 패턴은 루트 `.gitignore`로 통합한다.
- 하위 `.gitignore`에서는 중복 규칙을 제거하고 산출물/IDE 규칙만 유지한다.

### Task 4: 하드코딩 경로 점검과 최종 검증

**Files:**
- Verify only

**Step 1: Search hardcoded runtime values**

- 런타임 기본값에 영향을 주는 `localhost`, `127.0.0.1`, `/spc/api`, 환경파일 경로를 검색한다.
- 테스트나 문서 목적의 허용 항목과 실제 런타임 기본값을 구분한다.

**Step 2: Run final verification**

- 백엔드 테스트와 프론트 빌드를 마지막에 한 번만 실행한다.
- 관리자 권한이 필요하면 승격해서 실행한다.
