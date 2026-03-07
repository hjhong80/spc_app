# JVM Warning Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 백엔드 테스트 실행 시 Lombok `Unsafe` 경고와 Mockito javaagent 기반 CDS 경고를 테스트 실행 환경 설정으로 정리한다.

**Architecture:** Maven JVM 설정과 Surefire fork JVM 설정을 분리한다. 컴파일 단계 경고는 `.mvn/jvm.config`에서 제어하고, 테스트 fork JVM 경고는 Surefire `argLine`에서 제어한다. 설정 자체는 테스트 코드로 회귀를 막는다.

**Tech Stack:** Maven Wrapper, Spring Boot 4, Surefire, JUnit 5

---

### Task 1: 설정 회귀 테스트 추가

**Files:**
- Create: `spc_back/src/test/java/com/spc/spc_back/TestJvmWarningSettingsIntegrationTest.java`

**Step 1: Write the failing test**

- 루트 `pom.xml`과 `spc_back/.mvn/jvm.config`를 읽는다.
- 아래를 검증하는 테스트를 작성한다.
  - `.mvn/jvm.config`에 `--sun-misc-unsafe-memory-access=allow`
  - `pom.xml`에 `<lombok.version>`
  - `maven-surefire-plugin`의 `<argLine>`에 `-Xshare:off`

**Step 2: Run test to verify it fails**

Run:

```bash
.\spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=TestJvmWarningSettingsIntegrationTest test
```

Expected:

- `.mvn/jvm.config` 부재 또는 설정 누락으로 FAIL

**Step 3: Write minimal implementation**

- `spc_back/.mvn/jvm.config` 추가
- `spc_back/pom.xml`에 `lombok.version` 명시
- `lombok` 의존성과 annotationProcessorPaths를 같은 속성으로 고정
- Surefire `argLine`에 `-Xshare:off` 추가

**Step 4: Run test to verify it passes**

Run:

```bash
.\spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=TestJvmWarningSettingsIntegrationTest test
```

Expected:

- PASS

### Task 2: 문서 반영

**Files:**
- Modify: `README.md`

**Step 1: Update docs**

- 테스트 실행 환경에서 JVM 경고를 억제하는 설정 위치를 README에 추가한다.

**Step 2: Verify docs are accurate**

- README의 백엔드 테스트 섹션에 `.mvn/jvm.config`와 Surefire 설정 목적을 짧게 설명한다.

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
- 기존 두 종류의 JVM 경고가 보이지 않음

**Step 2: Record result**

- 최종 응답에 테스트 수, 실패 수, 남은 경고 유무를 함께 적는다.
