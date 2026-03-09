package com.spc.spc_back.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.jdbc.Sql;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import com.spc.spc_back.dto.spcdata.InspectionBatchRowReqDto;
import com.spc.spc_back.dto.spcdata.InspectionBatchSaveReqDto;
import com.spc.spc_back.entity.spcdata.InspectionReport;
import com.spc.spc_back.repository.InspectionDataRepository;
import com.spc.spc_back.repository.InspectionReportRepository;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@Sql(scripts = {
        "classpath:schema.sql",
        "classpath:data.sql"
})
class InspectionServiceBatchSaveIntegrationTest {

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

    @Test
    void 공통saveBatch는리포트와측정데이터를저장한다() {
        inspectionService.saveBatch(InspectionBatchSaveReqDto.builder()
                .projId(1L)
                .serialNo("LOT-BATCH-NEW")
                .inspDt(LocalDateTime.of(2026, 5, 5, 14, 30))
                .rows(List.of(
                        InspectionBatchRowReqDto.builder()
                                .excelRowNo(2)
                                .charNo("C-01")
                                .axis("X")
                                .nominal(10.0)
                                .uTol(0.5)
                                .lTol(-0.5)
                                .measuredValue(10.4)
                                .build()))
                .build());

        InspectionReport savedReport = inspectionReportRepository.selectInspectionReportBySerialNo("LOT-BATCH-NEW")
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

        assertThat(inspectionReportRepository.existsBySerialNo("LOT-BATCH-NEW")).isTrue();
    }

    @Test
    void 공통saveBatch는axis가비어도유일한charNoNominal이면fallback매핑한다() {
        inspectionService.saveBatch(InspectionBatchSaveReqDto.builder()
                .projId(1L)
                .serialNo("LOT-BATCH-FALLBACK")
                .inspDt(LocalDateTime.of(2026, 5, 6, 9, 15))
                .rows(List.of(
                        InspectionBatchRowReqDto.builder()
                                .excelRowNo(2)
                                .charNo("C-01")
                                .axis("")
                                .nominal(10.0)
                                .uTol(0.5)
                                .lTol(-0.5)
                                .measuredValue(9.9)
                                .build()))
                .build());

        InspectionReport savedReport = inspectionReportRepository.selectInspectionReportBySerialNo("LOT-BATCH-FALLBACK")
                .orElseThrow();

        assertThat(inspectionDataRepository.selectInspectionDataListByInspReportId(savedReport.getInspReportId())
                .orElseThrow())
                .hasSize(1)
                .first()
                .satisfies(data -> {
                    assertThat(data.getCharId()).isEqualTo(101L);
                    assertThat(data.getMeasuredValue()).isEqualTo(9.9);
                });
    }

    @Test
    void 공통saveBatch는저장불가행을건너뛰고집계를반영한다() {
        inspectionService.saveBatch(InspectionBatchSaveReqDto.builder()
                .projId(1L)
                .serialNo("LOT-BATCH-SKIP")
                .inspDt(LocalDateTime.of(2026, 5, 7, 9, 15))
                .rows(List.of(
                        InspectionBatchRowReqDto.builder()
                                .excelRowNo(2)
                                .charNo("C-01")
                                .axis("X")
                                .nominal(10.0)
                                .uTol(0.5)
                                .lTol(-0.5)
                                .measuredValue(10.1)
                                .build(),
                        InspectionBatchRowReqDto.builder()
                                .excelRowNo(3)
                                .charNo("")
                                .axis("X")
                                .nominal(10.0)
                                .uTol(0.5)
                                .lTol(-0.5)
                                .measuredValue(10.2)
                                .build()))
                .build());

        InspectionReport savedReport = inspectionReportRepository.selectInspectionReportBySerialNo("LOT-BATCH-SKIP")
                .orElseThrow();

        assertThat(inspectionDataRepository.selectInspectionDataListByInspReportId(savedReport.getInspReportId())
                .orElseThrow())
                .hasSize(1)
                .first()
                .satisfies(data -> {
                    assertThat(data.getCharId()).isEqualTo(101L);
                    assertThat(data.getMeasuredValue()).isEqualTo(10.1);
                });
    }
}
