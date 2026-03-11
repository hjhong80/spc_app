package com.spc.spc_back.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;

import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.jdbc.Sql;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import com.spc.spc_back.dto.spcdata.ExcelParsePreviewRespDto;
import com.spc.spc_back.entity.spcdata.InspectionReport;
import com.spc.spc_back.repository.InspectionDataRepository;
import com.spc.spc_back.repository.InspectionReportRepository;

import lombok.extern.slf4j.Slf4j;

@SpringBootTest
@Slf4j
@Testcontainers(disabledWithoutDocker = true)
@Sql(scripts = {
        "classpath:schema.sql",
        "classpath:data.sql",
        "classpath:inspection_parse_project_setup.sql"
})
class InspectionServiceParseAndPreviewIntegrationTest {

    @Container
    static MySQLContainer mysql = new MySQLContainer("mysql:8.4");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
        registry.add("spring.datasource.driver-class-name", mysql::getDriverClassName);
    }

    @Autowired
    private InspectionService inspectionService;

    @Autowired
    private InspectionReportRepository inspectionReportRepository;

    @Autowired
    private InspectionDataRepository inspectionDataRepository;

    @Autowired
    private Environment environment;

    @Test
    void parseAndPreview는파싱후공통저장경로로리포트와측정데이터를저장한다() throws IOException {
        MockMultipartFile file = createExcelFile(LocalDateTime.of(2026, 5, 5, 14, 30), 10.4);

        ExcelParsePreviewRespDto response = inspectionService.parseAndPreview(file, "LOT-NEW", 1L);

        assertThat(response.getSkippedDuplicateSerialNo()).isFalse();
        assertThat(response.getSerialNo()).isEqualTo("LOT-NEW");
        assertThat(response.getInspDt()).isEqualTo("2026-05-05 14:30:00");
        assertThat(response.getParsedRowCount()).isEqualTo(1);
        assertThat(response.getInsertedRowCount()).isEqualTo(1);
        assertThat(response.getSkippedRowCount()).isEqualTo(0);
        assertThat(response.getParsedRows()).hasSize(1);

        InspectionReport savedReport = inspectionReportRepository.selectInspectionReportBySerialNo("LOT-NEW")
                .orElseThrow();
        assertThat(savedReport.getProjId()).isEqualTo(1L);
        assertThat(savedReport.getInspDt()).isEqualTo(LocalDateTime.of(2026, 5, 5, 14, 30));

        assertThat(inspectionDataRepository.selectInspectionDataListByInspReportId(savedReport.getInspReportId())
                .orElseThrow())
                .hasSize(1)
                .first()
                .satisfies(data -> {
                    assertThat(data.getCharId()).isEqualTo(101L);
                    assertThat(data.getMeasuredValue()).isEqualTo(10.4);
                });
    }

    @Test
    void parseAndPreview는중복SerialNo면저장을생략한다() throws IOException {
        MockMultipartFile file = createExcelFile(LocalDateTime.of(2026, 5, 5, 14, 30), 10.4);

        ExcelParsePreviewRespDto response = inspectionService.parseAndPreview(file, "SN-1001", 1L);

        assertThat(response.getSkippedDuplicateSerialNo()).isTrue();
        assertThat(response.getParsedRowCount()).isEqualTo(0);
        assertThat(response.getInsertedRowCount()).isEqualTo(0);
        assertThat(response.getSkippedRowCount()).isEqualTo(0);
        assertThat(response.getParsedRows()).isEmpty();
        assertThat(response.getSkipReason()).contains("이미 등록된 serialNo");
        assertThat(inspectionReportRepository.selectInspectionReportBySerialNo("SN-1001")).isPresent();
        assertThat(inspectionReportRepository.selectInspectionReportBySerialNo("LOT-NEW")).isNotPresent();
    }

    @Test
    void parseAndPreview는대용량업로드에서미리보기샘플만반환한다() throws IOException {
        MockMultipartFile file = createExcelFile(LocalDateTime.of(2026, 5, 5, 14, 30), 950, 10.0);

        ExcelParsePreviewRespDto response = inspectionService.parseAndPreview(file, "LOT-BULK-950", 1L);

        assertThat(response.getSkippedDuplicateSerialNo()).isFalse();
        assertThat(response.getParsedRowCount()).isEqualTo(950);
        assertThat(response.getInsertedRowCount()).isEqualTo(950);
        assertThat(response.getSkippedRowCount()).isEqualTo(0);
        assertThat(response.getParsedRows()).hasSizeLessThanOrEqualTo(12);

        InspectionReport savedReport = inspectionReportRepository.selectInspectionReportBySerialNo("LOT-BULK-950")
                .orElseThrow();
        assertThat(inspectionDataRepository.selectInspectionDataListByInspReportId(savedReport.getInspReportId())
                .orElseThrow())
                .hasSize(950);
    }

    @Test
    void parseAndPreview는900건업로드를로컬기준으로재계측한다() throws IOException {
        MockMultipartFile file = createExcelFile(LocalDateTime.of(2026, 5, 5, 14, 30), 900, 20.0);
        long startedAtNanos = System.nanoTime();

        ExcelParsePreviewRespDto response = inspectionService.parseAndPreview(file, "LOT-BULK-900", 1L);

        long elapsedMillis = (System.nanoTime() - startedAtNanos) / 1_000_000L;

        assertThat(response.getSkippedDuplicateSerialNo()).isFalse();
        assertThat(response.getParsedRowCount()).isEqualTo(900);
        assertThat(response.getInsertedRowCount()).isEqualTo(900);
        assertThat(response.getSkippedRowCount()).isEqualTo(0);
        assertThat(response.getParsedRows()).hasSizeLessThanOrEqualTo(12);
        assertThat(environment.getProperty("spc.upload.preview-row-limit")).isEqualTo("12");
        assertThat(environment.getProperty("spc.upload.streaming-batch-size")).isEqualTo("300");

        InspectionReport savedReport = inspectionReportRepository.selectInspectionReportBySerialNo("LOT-BULK-900")
                .orElseThrow();
        assertThat(inspectionDataRepository.selectInspectionDataListByInspReportId(savedReport.getInspReportId())
                .orElseThrow())
                .hasSize(900);

        log.info(
                "[UploadRemeasure] local 900-row upload elapsedMs={}, parsedRows={}, insertedRows={}, previewRows={}, previewRowLimit={}, batchFlushSize={}",
                elapsedMillis,
                response.getParsedRowCount(),
                response.getInsertedRowCount(),
                response.getParsedRows().size(),
                environment.getProperty("spc.upload.preview-row-limit"),
                environment.getProperty("spc.upload.streaming-batch-size"));
    }

    private MockMultipartFile createExcelFile(LocalDateTime inspDt, double measuredValue) throws IOException {
        return createExcelFile(inspDt, 1, measuredValue);
    }

    private MockMultipartFile createExcelFile(LocalDateTime inspDt, int rowCount, double measuredValueStart) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet("Sheet1");
            var metaRow = sheet.createRow(0);
            var dateCell = metaRow.createCell(7);
            dateCell.setCellValue(inspDt);

            CreationHelper creationHelper = workbook.getCreationHelper();
            CellStyle dateStyle = workbook.createCellStyle();
            dateStyle.setDataFormat(creationHelper.createDataFormat().getFormat("yyyy-mm-dd hh:mm:ss"));
            dateCell.setCellStyle(dateStyle);

            for (int index = 0; index < rowCount; index += 1) {
                var dataRow = sheet.createRow(index + 1);
                dataRow.createCell(0).setCellValue("C-01");
                dataRow.createCell(1).setCellValue("X");
                dataRow.createCell(2).setCellValue(10.0);
                dataRow.createCell(3).setCellValue(0.5);
                dataRow.createCell(4).setCellValue(-0.5);
                dataRow.createCell(5).setCellValue(measuredValueStart + index);
            }

            workbook.write(outputStream);

            return new MockMultipartFile(
                    "file",
                    "inspection-upload.xlsx",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    outputStream.toByteArray());
        }
    }
}
