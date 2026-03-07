# InspectionDataListener 저장 계약 확장 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `InspectionDataListener`가 실제 저장 가능한 입력 계약으로 공통 저장 코어를 호출하게 만들고, upload preview 경로와 listener 경로의 저장 규칙을 통일한다.

**Architecture:** listener와 preview는 각각 자기 입력 모델을 유지하되, 둘 다 `InspectionBatchSaveReqDto` 기반 공통 저장 메서드를 사용한다. listener는 batch metadata(`projId`, `serialNo`, `inspDt`)와 row DTO를 합쳐 flush 시 저장하고, 서비스는 기존 특성치 lookup 및 insert 로직을 재사용한다.

**Tech Stack:** Spring Boot, EasyExcel, MyBatis, JUnit 5, Mockito, Testcontainers(MySQL)

---

### Task 1: listener failing test를 먼저 추가한다

**Files:**
- Create: `spc_back/src/test/java/com/spc/spc_back/listener/InspectionDataListenerTest.java`

**Step 1: Write the failing test**

- `doAfterAllAnalysed()`가 남은 row를 공통 저장 메서드로 전달하는 테스트를 작성한다.
- batch 경계 이상 데이터에서 flush가 발생하는 테스트를 작성한다.

**Step 2: Run test to verify it fails**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=InspectionDataListenerTest test`
Expected: FAIL because listener는 아직 새 저장 계약을 사용하지 않는다.

**Step 3: Write minimal test scaffolding**

- Mockito 기반으로 `InspectionService` 호출 인자를 캡처하는 테스트 클래스를 추가한다.

**Step 4: Run test to verify expected red**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=InspectionDataListenerTest test`
Expected: FAIL with missing method/signature or assertion mismatch.

### Task 2: 공통 저장 DTO 통합 failing test를 추가한다

**Files:**
- Create: `spc_back/src/test/java/com/spc/spc_back/service/InspectionServiceBatchSaveIntegrationTest.java`
- Modify: `spc_back/src/test/resources/schema.sql` (필요 시 fixture 보강)
- Modify: `spc_back/src/test/resources/data.sql` (필요 시 fixture 보강)

**Step 1: Write the failing test**

- `InspectionBatchSaveReqDto`로 `saveBatch(...)` 호출 시 report/data insert가 되는지 검증하는 통합 테스트를 작성한다.
- axis fallback 또는 동일 매핑 규칙이 유지되는지 검증하는 테스트를 작성한다.

**Step 2: Run test to verify it fails**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=InspectionServiceBatchSaveIntegrationTest test`
Expected: FAIL because 공통 저장 DTO와 공개 메서드가 아직 없다.

### Task 3: 최소 구현으로 테스트를 녹색으로 만든다

**Files:**
- Create: `spc_back/src/main/java/com/spc/spc_back/dto/spcdata/InspectionBatchSaveReqDto.java`
- Create: `spc_back/src/main/java/com/spc/spc_back/dto/spcdata/InspectionBatchRowReqDto.java`
- Create: `spc_back/src/main/java/com/spc/spc_back/dto/spcdata/InspectionExcelRowReqDto.java`
- Modify: `spc_back/src/main/java/com/spc/spc_back/service/InspectionService.java`
- Modify: `spc_back/src/main/java/com/spc/spc_back/service/InspectionServiceImpl.java`
- Modify: `spc_back/src/main/java/com/spc/spc_back/listener/InspectionDataListener.java`

**Step 1: Expose common save contract**

- `InspectionService`에 `saveBatch(InspectionBatchSaveReqDto request)`를 추가한다.
- 기존 private command/result를 외부 DTO 기반으로 정리한다.

**Step 2: Wire preview path**

- `parseAndPreview(...)`가 `ParsedRow`를 새 row DTO로 변환해 공개 `saveBatch(...)`를 호출하게 바꾼다.

**Step 3: Wire listener path**

- listener 생성자에 `projId`, `serialNo`, `inspDt`를 받도록 변경한다.
- flush 시 `InspectionBatchSaveReqDto`를 만들어 공통 저장 메서드를 호출한다.

**Step 4: Keep legacy contract explicit**

- `saveBatch(List<ExcelInputReqDto>, String)` fail-fast는 유지한다.

**Step 5: Run targeted tests**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=InspectionDataListenerTest,InspectionServiceBatchSaveIntegrationTest test`
Expected: PASS

### Task 4: 문서 반영과 전체 검증

**Files:**
- Modify: `README.md`

**Step 1: Update docs**

- listener 저장 경로가 공통 저장 계약을 사용한다는 점과 관련 테스트 실행 방법을 추가한다.

**Step 2: Run full backend verification**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml test`
Expected: PASS

**Step 3: Summarize remaining gap**

- listener 입력 경로가 실제 컨트롤러/API와 연결되지 않았다면 남은 작업으로 명시한다.
