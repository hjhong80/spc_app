# ExcelController MockMvc 테스트 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `POST /excel/upload`의 API 계약을 `MockMvc`로 검증한다.

**Architecture:** 컨트롤러는 multipart 요청 처리와 응답 메시지 분기만 담당하고, 실제 저장/파싱은 `InspectionService` mock으로 대체한다. 저장 경로 진짜 동작은 기존 Testcontainers 서비스 통합 테스트가 계속 담당한다.

**Tech Stack:** Spring Boot Test, MockMvc, Mockito, JUnit 5

---

### Task 1: 업로드 컨트롤러 failing test를 먼저 추가한다

**Files:**
- Create: `spc_back/src/test/java/com/spc/spc_back/controller/spcdata/excel/ExcelControllerMockMvcTest.java`

**Step 1: Write the failing test**

- 빈 파일 요청 테스트를 작성한다.
- 정상 저장 응답 테스트를 작성한다.
- duplicate skip 응답 테스트를 작성한다.
- `IllegalArgumentException` 매핑 테스트를 작성한다.

**Step 2: Run test to verify it fails**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=ExcelControllerMockMvcTest test`
Expected: FAIL because the new test class does not exist yet.

**Step 3: Write minimal implementation**

- `@SpringBootTest + @AutoConfigureMockMvc` 기반 컨트롤러 테스트 클래스를 추가한다.
- `InspectionService`를 mock 처리한다.

**Step 4: Run test to verify it passes**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=ExcelControllerMockMvcTest test`
Expected: PASS

### Task 2: 문서 반영과 전체 검증

**Files:**
- Modify: `README.md`

**Step 1: Update docs**

- 업로드 API MockMvc 테스트 실행법을 README에 최소 반영한다.

**Step 2: Run full backend verification**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml test`
Expected: PASS

**Step 3: Summarize remaining gaps**

- listener 입력 계약 확장 같은 다음 단계 공백을 정리한다.
