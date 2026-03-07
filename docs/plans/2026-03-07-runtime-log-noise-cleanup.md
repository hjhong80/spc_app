# Runtime Log Noise Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 백엔드 테스트와 로컬 개발 실행에서 불필요한 일반 INFO 로그를 줄이고, 업로드/차트 관련 도메인 로그는 유지한다.

**Architecture:** 메인 애플리케이션 설정과 테스트 설정을 분리한다. 공통으로 startup/Hikari/Actuator 로그를 낮추고, 테스트에서는 Spring Test/Testcontainers 로그를 추가로 억제한다. 설정 누락은 파일 기반 테스트로 막는다.

**Tech Stack:** Spring Boot 4, application.properties, JUnit 5

---

### Task 1: 설정 회귀 테스트 추가

**Files:**
- Create: `spc_back/src/test/java/com/spc/spc_back/TestRuntimeLogNoiseSettingsTest.java`

**Step 1: Write the failing test**

- 메인/테스트 `application.properties`를 읽는 테스트를 작성한다.
- 아래 키가 존재하는지 검증한다.
  - 메인:
    - `spring.main.banner-mode=off`
    - `spring.main.log-startup-info=false`
    - `logging.level.com.zaxxer.hikari=WARN`
    - `logging.level.org.springframework.boot.actuate.endpoint.web=WARN`
  - 테스트:
    - `logging.level.org.springframework.test.context=WARN`
    - `logging.level.org.springframework.boot.test.context=WARN`
    - `logging.level.org.testcontainers=WARN`

**Step 2: Run test to verify it fails**

Run:

```bash
.\spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=TestRuntimeLogNoiseSettingsTest test
```

Expected:

- 설정 누락으로 FAIL

**Step 3: Write minimal implementation**

- `src/main/resources/application.properties`와 `src/test/resources/application.properties`에 필요한 로그 레벨/스타트업 억제 설정을 추가한다.

**Step 4: Run test to verify it passes**

Run:

```bash
.\spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=TestRuntimeLogNoiseSettingsTest test
```

Expected:

- PASS

### Task 2: 문서 반영

**Files:**
- Modify: `README.md`

**Step 1: Update docs**

- 백엔드 테스트/검증 참고 섹션에 일반 로그 억제 설정 위치를 추가한다.

### Task 3: 최종 검증

**Files:**
- Verify only

**Step 1: Run full backend test suite**

Run:

```bash
.\spc_back\mvnw.cmd -f spc_back\pom.xml test
```

Expected:

- 전체 테스트 통과
- 이전보다 Spring/Testcontainers/Hikari 일반 INFO 로그가 줄어듦

**Step 2: Run local startup check**

Run:

```bash
.\spc_back\mvnw.cmd -f spc_back\pom.xml spring-boot:run
```

Expected:

- 배너와 startup info가 줄어들고, 도메인 로그만 상대적으로 잘 보임
