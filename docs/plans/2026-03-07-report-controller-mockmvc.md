# ReportController MockMvc 테스트 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `ReportController`의 전체 차트/리포트 엔드포인트를 `MockMvc`로 검증한다.

**Architecture:** `@SpringBootTest + @AutoConfigureMockMvc`로 실제 `SecurityFilterChain`을 띄우고, `ReportService`만 mock 처리한다. 각 요청은 `PrincipalUser` 인증 객체를 직접 주입해 `@AuthenticationPrincipal` 경로와 서비스 인자 전달을 검증한다.

**Tech Stack:** Spring Boot Test, MockMvc, Spring Security Test, Mockito, JUnit 5

---

### Task 1: 컨트롤러 MockMvc 테스트를 failing case부터 추가한다

**Files:**
- Create: `spc_back/src/test/java/com/spc/spc_back/controller/spcdata/report/ReportControllerMockMvcTest.java`

**Step 1: Write the failing test**

- 인증 없이 `/spcdata/report/recently-project/list` 호출 시 차단되는 테스트를 작성한다.
- 인증 상태에서 `recently-project`, `chart-stats`, `detail`, `distribution`, `report-count` 호출 테스트를 작성한다.

**Step 2: Run test to verify it fails**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=ReportControllerMockMvcTest test`
Expected: FAIL because the new test class does not exist yet.

**Step 3: Write minimal implementation**

- `@SpringBootTest + @AutoConfigureMockMvc` 기반 테스트 클래스를 추가한다.
- `ReportService`를 mock 처리한다.

**Step 4: Run test to verify it passes**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=ReportControllerMockMvcTest test`
Expected: PASS

### Task 2: 서비스 인자 전달과 JSON 구조 검증을 강화한다

**Files:**
- Modify: `spc_back/src/test/java/com/spc/spc_back/controller/spcdata/report/ReportControllerMockMvcTest.java`

**Step 1: Tighten assertions**

- `projId`, `charId`, `scale`, `baseDate`가 서비스로 그대로 전달되는지 `verify(...)`로 확인한다.
- `PrincipalUser`가 null이 아닌지 검증한다.
- JSON path로 각 응답 필드를 고정한다.

**Step 2: Run targeted verification**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=ReportControllerMockMvcTest test`
Expected: PASS

### Task 3: 문서 반영과 전체 검증

**Files:**
- Modify: `README.md` (필요 시)

**Step 1: Update docs**

- MockMvc 컨트롤러 테스트 실행법을 README에 최소 반영한다.

**Step 2: Run full backend verification**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml test`
Expected: PASS

**Step 3: Summarize remaining gaps**

- 아직 컨트롤러 테스트가 없는 영역과 다음 우선순위를 정리한다.
