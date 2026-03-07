# InspectionService 저장 경로 리팩터링 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 업로드 API의 저장 경로를 `InspectionService` 내부 공통 저장 진입점으로 통일하고, legacy `saveBatch(...)`는 명시적 fail-fast 경로로 정리한다.

**Architecture:** `parseAndPreview(...)`는 파싱과 preview 응답 생성을 유지하되, 실제 저장은 내부 `InspectionBatchSaveCommand` 기반 공통 메서드로 보낸다. 저장 공통 메서드는 characteristic lookup, duplicate serialNo 검사, report/data insert를 한 군데에서 처리한다.

**Tech Stack:** Spring Boot, MyBatis, JUnit 5, Spring Boot Test, Mockito

---

### Task 1: failing test를 먼저 추가한다

**Files:**
- Create: `spc_back/src/test/java/com/spc/spc_back/service/InspectionServiceSaveBatchTest.java`
- Create: `spc_back/src/test/java/com/spc/spc_back/service/InspectionServiceParseAndPreviewIntegrationTest.java`

**Step 1: Write the failing test**

- legacy `saveBatch(List<ExcelInputReqDto>, String)`가 예외를 던지는 테스트를 작성한다.
- `parseAndPreview(...)`가 실제 저장까지 수행하는 통합 테스트를 작성한다.
- duplicate serialNo면 skip 응답을 반환하고 저장하지 않는 통합 테스트를 작성한다.

**Step 2: Run test to verify it fails**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=InspectionServiceSaveBatchTest,InspectionServiceParseAndPreviewIntegrationTest test`
Expected: FAIL because test classes do not exist yet.

**Step 3: Write minimal implementation**

- 테스트 클래스를 추가하고 현재 구현과 맞지 않는 실패를 확인한다.

**Step 4: Run test to verify expected red**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=InspectionServiceSaveBatchTest,InspectionServiceParseAndPreviewIntegrationTest test`
Expected: FAIL with current `saveBatch(...)` behavior mismatch or 저장 경로 assertion mismatch.

### Task 2: 공통 저장 진입점을 구현한다

**Files:**
- Modify: `spc_back/src/main/java/com/spc/spc_back/service/InspectionServiceImpl.java`
- Modify: `spc_back/src/main/java/com/spc/spc_back/service/InspectionService.java` (필요 시 문서화 수준 최소 변경)

**Step 1: Implement internal save command/result**

- 내부 command/result 타입을 추가한다.
- 기존 `persistParsedData(...)`를 공통 저장 메서드로 정리한다.

**Step 2: Wire parseAndPreview**

- `parseAndPreview(...)`가 공통 저장 메서드를 호출하도록 연결한다.
- 응답 메시지/동작은 유지한다.

**Step 3: Handle legacy saveBatch**

- 현재 메타데이터 부족을 설명하는 예외로 fail-fast 처리한다.

**Step 4: Run targeted tests**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=InspectionServiceSaveBatchTest,InspectionServiceParseAndPreviewIntegrationTest test`
Expected: PASS

### Task 3: 문서 반영과 전체 검증

**Files:**
- Modify: `README.md` (필요 시)

**Step 1: Update docs**

- 업로드 저장 경로가 공통 저장 진입점으로 정리되었다는 점만 최소 반영한다.

**Step 2: Run full backend verification**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml test`
Expected: PASS

**Step 3: Summarize next step**

- 이후 진짜 API 분리를 하려면 listener/input contract를 어떻게 확장해야 하는지 남은 공백을 정리한다.
