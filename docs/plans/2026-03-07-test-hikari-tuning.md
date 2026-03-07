# Test Hikari Tuning Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Testcontainers 종료 후 반복되는 Hikari datasource 경고를 줄이기 위해 테스트 전용 Hikari 설정을 추가한다.

**Architecture:** 테스트 전용 `application.properties`에 datasource 풀 설정을 공통화하고, 간단한 스모크 테스트로 실제 값 반영을 검증한다. 기존 DynamicPropertySource는 DB 접속 정보만 유지한다.

**Tech Stack:** Spring Boot Test, HikariCP, JUnit 5

---

### Task 1: 설정 검증 테스트 추가

**Files:**
- Create: `C:\Users\USER\Documents\MyProjects\spc_project\spc_back\src\test\java\com\spc\spc_back\TestHikariSettingsIntegrationTest.java`

**Step 1: Write the failing test**

- `HikariDataSource`를 주입받아 `minimumIdle`, `maximumPoolSize`, `idleTimeout`, `maxLifetime`를 기대값으로 검증한다.

**Step 2: Run test to verify it fails**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml -Dtest=TestHikariSettingsIntegrationTest test`
Expected: FAIL because test용 application.properties가 아직 없다.

### Task 2: 테스트 전용 설정 추가

**Files:**
- Create: `C:\Users\USER\Documents\MyProjects\spc_project\spc_back\src\test\resources\application.properties`

**Step 1: Write minimal implementation**

- Hikari 관련 test 설정을 추가한다.

**Step 2: Run targeted test**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml -Dtest=TestHikariSettingsIntegrationTest test`
Expected: PASS

### Task 3: 문서와 전체 검증

**Files:**
- Modify: `C:\Users\USER\Documents\MyProjects\spc_project\README.md`

**Step 1: Update docs**

- 테스트 전용 Hikari 설정이 추가되었음을 기록한다.

**Step 2: Run final verification**

Run: `.\spc_back\mvnw.cmd -f spc_back/pom.xml test`
Expected: PASS
