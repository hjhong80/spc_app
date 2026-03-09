# Excel Upload Streaming Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 대용량 Excel 업로드를 하이브리드 2단계 파싱과 batch insert로 최적화하고, 응답은 전체 행 대신 요약 정보와 일부 preview 샘플만 반환하도록 바꾼다.

**Architecture:** `WorkbookFactory`는 메타데이터와 좌표 기반 source 해석에만 사용하고, 실제 측정 데이터 구간은 EasyExcel 스트리밍으로 읽는다. 서비스는 스트리밍 중 preview 샘플과 저장 버퍼만 유지하며, serial duplicate exists 쿼리와 `insp_data_tb` batch insert를 통해 저장 경로를 경량화한다.

**Tech Stack:** Spring Boot, MyBatis, EasyExcel 4.x, Apache POI, JUnit 5, MockMvc, Testcontainers(MySQL)

---

### Task 1: 응답 계약과 저장 최적화 테스트를 먼저 고정

**Files:**
- Modify: `C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/test/java/com/spc/spc_back/service/InspectionServiceBatchSaveIntegrationTest.java`
- Modify: `C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/test/java/com/spc/spc_back/controller/spcdata/excel/ExcelControllerMockMvcTest.java`
- Modify: `C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/test/java/com/spc/spc_back/service/InspectionServiceParseAndPreviewIntegrationTest.java`
- Create: `C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/test/java/com/spc/spc_back/service/StreamingUploadAccumulatorTest.java`

**Step 1: Write the failing test**

```java
assertThat(preview.getParsedRowCount()).isEqualTo(950);
assertThat(preview.getParsedRows()).hasSizeLessThanOrEqualTo(20);
assertThat(preview.getSkippedDuplicateSerialNo()).isFalse();
```

**Step 2: Run test to verify it fails**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=StreamingUploadAccumulatorTest,InspectionServiceParseAndPreviewIntegrationTest,ExcelControllerMockMvcTest test`
Expected: FAIL because accumulator class, preview 제한, inserted/skipped 집계가 아직 구현되지 않음

**Step 3: Add minimal test fixtures**

```java
for (int row = 0; row < 950; row += 1) {
    rows.add(sampleRow(row));
}
```

**Step 4: Run test to confirm failure message is meaningful**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=InspectionServiceParseAndPreviewIntegrationTest#대용량업로드는미리보기샘플만반환한다 test`
Expected: FAIL with parsed row list too large or missing new counters

**Step 5: Commit**

```bash
git add spc_back/src/test/java/com/spc/spc_back/service/InspectionServiceBatchSaveIntegrationTest.java spc_back/src/test/java/com/spc/spc_back/controller/spcdata/excel/ExcelControllerMockMvcTest.java spc_back/src/test/java/com/spc/spc_back/service/InspectionServiceParseAndPreviewIntegrationTest.java spc_back/src/test/java/com/spc/spc_back/service/StreamingUploadAccumulatorTest.java
git commit -m "test: lock excel upload streaming contract"
```

### Task 2: DTO와 mapper 계약 확장

**Files:**
- Modify: `C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/dto/spcdata/ExcelParsePreviewRespDto.java`
- Modify: `C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/mapper/InspectionReportMapper.java`
- Modify: `C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/mapper/InspectionDataMapper.java`
- Modify: `C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/resources/mapper/inspection_report_mapper.xml`
- Modify: `C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/resources/mapper/inspection_data_mapper.xml`

**Step 1: Write the failing test**

```java
assertThat(preview.getInsertedRowCount()).isEqualTo(900);
assertThat(preview.getSkippedRowCount()).isEqualTo(50);
assertThat(inspectionReportRepository.existsBySerialNo("LOT-BATCH-NEW")).isTrue();
```

**Step 2: Run test to verify it fails**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=InspectionServiceBatchSaveIntegrationTest test`
Expected: FAIL because DTO fields, mapper methods, SQL mappings do not exist

**Step 3: Write minimal contract changes**

```java
boolean existsBySerialNo(String serialNo);
int insertInspectionDataBatch(@Param("items") List<InspectionData> items);
```

**Step 4: Run test to verify the project compiles up to SQL/service failures**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=InspectionServiceBatchSaveIntegrationTest test`
Expected: FAIL in service behavior, not in missing method signatures

**Step 5: Commit**

```bash
git add spc_back/src/main/java/com/spc/spc_back/dto/spcdata/ExcelParsePreviewRespDto.java spc_back/src/main/java/com/spc/spc_back/mapper/InspectionReportMapper.java spc_back/src/main/java/com/spc/spc_back/mapper/InspectionDataMapper.java spc_back/src/main/resources/mapper/inspection_report_mapper.xml spc_back/src/main/resources/mapper/inspection_data_mapper.xml
git commit -m "feat: add excel upload batch persistence contracts"
```

### Task 3: 스트리밍 집계기와 batch writer 구현

**Files:**
- Create: `C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/service/excel/StreamingUploadAccumulator.java`
- Create: `C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/service/excel/InspectionBatchWriter.java`
- Modify: `C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/test/java/com/spc/spc_back/service/StreamingUploadAccumulatorTest.java`
- Modify: `C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/test/java/com/spc/spc_back/service/InspectionServiceBatchSaveIntegrationTest.java`

**Step 1: Write the failing test**

```java
accumulator.recordPreview(row);
accumulator.recordSkipped();
assertThat(accumulator.toPreviewRows()).hasSize(20);
```

**Step 2: Run test to verify it fails**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=StreamingUploadAccumulatorTest test`
Expected: FAIL because accumulator and batch writer classes do not exist or counters are wrong

**Step 3: Write minimal implementation**

```java
public void addPreview(ParsedRow row) {
    parsedRowCount += 1;
    if (previewRows.size() < previewLimit) {
        previewRows.add(row);
    }
}
```

**Step 4: Run tests to verify accumulator behavior**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=StreamingUploadAccumulatorTest,InspectionServiceBatchSaveIntegrationTest test`
Expected: PASS for accumulator, FAIL only where service still uses old parse path

**Step 5: Commit**

```bash
git add spc_back/src/main/java/com/spc/spc_back/service/excel/StreamingUploadAccumulator.java spc_back/src/main/java/com/spc/spc_back/service/excel/InspectionBatchWriter.java spc_back/src/test/java/com/spc/spc_back/service/StreamingUploadAccumulatorTest.java spc_back/src/test/java/com/spc/spc_back/service/InspectionServiceBatchSaveIntegrationTest.java
git commit -m "feat: add excel upload streaming accumulator"
```

### Task 4: 메타 reader와 EasyExcel 스트리밍 reader로 서비스 리팩터링

**Files:**
- Modify: `C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/service/InspectionServiceImpl.java`
- Modify: `C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/listener/InspectionDataListener.java`
- Create: `C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/service/excel/ExcelUploadMetaReader.java`
- Create: `C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/main/java/com/spc/spc_back/service/excel/StreamingInspectionRowReader.java`
- Modify: `C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/test/java/com/spc/spc_back/service/InspectionServiceParseAndPreviewIntegrationTest.java`

**Step 1: Write the failing test**

```java
ExcelParsePreviewRespDto preview = inspectionService.parseAndPreview(file, "LOT-950", 1L);
assertThat(preview.getParsedRows()).hasSizeLessThanOrEqualTo(20);
assertThat(preview.getInsertedRowCount()).isEqualTo(950);
```

**Step 2: Run test to verify it fails**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=InspectionServiceParseAndPreviewIntegrationTest test`
Expected: FAIL because service still loads all rows and uses per-row insert

**Step 3: Write minimal implementation**

```java
UploadMeta meta = excelUploadMetaReader.read(file, project, lotNo);
if (inspectionReportRepository.existsBySerialNo(meta.serialNo())) {
    return duplicatePreview(meta);
}
streamingInspectionRowReader.read(file, meta, row -> batchWriter.accept(row));
```

**Step 4: Run targeted tests**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=InspectionServiceParseAndPreviewIntegrationTest,InspectionServiceBatchSaveIntegrationTest test`
Expected: PASS

**Step 5: Commit**

```bash
git add spc_back/src/main/java/com/spc/spc_back/service/InspectionServiceImpl.java spc_back/src/main/java/com/spc/spc_back/listener/InspectionDataListener.java spc_back/src/main/java/com/spc/spc_back/service/excel/ExcelUploadMetaReader.java spc_back/src/main/java/com/spc/spc_back/service/excel/StreamingInspectionRowReader.java spc_back/src/test/java/com/spc/spc_back/service/InspectionServiceParseAndPreviewIntegrationTest.java
git commit -m "feat: stream excel upload rows"
```

### Task 5: API 응답/문서 정리와 최종 검증

**Files:**
- Modify: `C:/Users/USER/Documents/MyProjects/spc_project/spc_back/src/test/java/com/spc/spc_back/controller/spcdata/excel/ExcelControllerMockMvcTest.java`
- Modify: `C:/Users/USER/Documents/MyProjects/spc_project/README.md`
- Modify: `C:/Users/USER/Documents/MyProjects/spc_project/TODO.md`
- Modify: `C:/Users/USER/Documents/MyProjects/spc_project/docs/plans/2026-03-09-excel-upload-streaming-design.md`

**Step 1: Write the failing test**

```java
.andExpect(jsonPath("$.data.parsedRowCount").value(950))
.andExpect(jsonPath("$.data.parsedRows.length()").value(20));
```

**Step 2: Run test to verify it fails**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=ExcelControllerMockMvcTest test`
Expected: FAIL if controller/service response shape or sample size is not finalized

**Step 3: Update docs minimally**

```markdown
- 업로드 응답은 전체 parsed row 대신 샘플 preview 행만 반환합니다.
- 엑셀 업로드 최적화 1차 완료: duplicate exists, batch insert, streaming parse
```

**Step 4: Run final verification**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=StreamingUploadAccumulatorTest,InspectionServiceBatchSaveIntegrationTest,InspectionServiceParseAndPreviewIntegrationTest,ExcelControllerMockMvcTest test`
Expected: PASS

**Step 5: Commit**

```bash
git add spc_back/src/test/java/com/spc/spc_back/controller/spcdata/excel/ExcelControllerMockMvcTest.java README.md TODO.md docs/plans/2026-03-09-excel-upload-streaming-design.md
git commit -m "docs: finalize excel upload streaming changes"
```
