# Test Log Warning Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 백엔드 테스트 실행 시 남아 있는 Thymeleaf, SpringDoc 경고 로그를 테스트 전용 설정으로 정리한다.

**Architecture:** 테스트 공통 설정 파일에 경고 억제용 property를 추가하고, 별도 스모크 테스트로 실제 반영 여부를 검증한다. 운영 설정은 유지하고 테스트 컨텍스트만 조정한다.

**Tech Stack:** Spring Boot Test, JUnit 5, AssertJ

---

### Task 1: 경고 억제 설정 검증 테스트 추가

**Files:**
- Create: `C:\Users\USER\Documents\MyProjects\spc_project\spc_back\src\test\java\com\spc\spc_back\TestLogWarningSettingsIntegrationTest.java`

**Step 1: Write the failing test**

- `Environment`를 주입받아 아래 값이 `false`인지 검증한다.
  - `spring.thymeleaf.check-template-location`
  - `springdoc.api-docs.enabled`
  - `springdoc.swagger-ui.enabled`

**Step 2: Run test to verify it fails**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml -Dtest=TestLogWarningSettingsIntegrationTest test`
Expected: FAIL because test용 application.properties에 해당 설정이 아직 없다.

### Task 2: 테스트 전용 설정 반영

**Files:**
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\spc_back\src\test\resources\application.properties`

**Step 1: Write minimal implementation**

- 경고 억제용 test property 3개를 추가한다.

**Step 2: Run targeted test**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml -Dtest=TestLogWarningSettingsIntegrationTest test`
Expected: PASS

### Task 3: 문서와 전체 검증

**Files:**
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\README.md`

**Step 1: Update docs**

- 테스트 전용 로그 경고 억제 설정이 추가되었음을 기록한다.

**Step 2: Run final verification**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml test`
Expected: PASS and reduced test warning logs
