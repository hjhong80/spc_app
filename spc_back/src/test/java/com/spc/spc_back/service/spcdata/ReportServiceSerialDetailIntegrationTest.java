package com.spc.spc_back.service.spcdata;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

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

import com.spc.spc_back.dto.ApiRespDto;
import com.spc.spc_back.dto.spcdata.SerialSearchCandidateRespDto;
import com.spc.spc_back.dto.spcdata.SerialReportContextRespDto;
import com.spc.spc_back.dto.spcdata.SerialReportDetailRespDto;
import com.spc.spc_back.entity.user.Role;
import com.spc.spc_back.entity.user.UserRole;
import com.spc.spc_back.security.model.PrincipalUser;
import com.spc.spc_back.util.RoleAccessUtil;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@Sql(scripts = { "classpath:schema.sql", "classpath:data.sql" })
class ReportServiceSerialDetailIntegrationTest {

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
    private ReportService reportService;

    @Test
    void serialNo기준성적서상세를charNo오름차순으로반환한다() {
        ApiRespDto<List<SerialReportDetailRespDto>> response = reportService.getSerialReportDetails(
                "SN-1001",
                createPrincipalUser());

        assertThat(response.getStatus()).isEqualTo("success");
        assertThat(response.getMessage()).isEqualTo("serialNo 기준 성적서 상세를 조회했습니다.");
        assertThat(response.getData())
                .extracting(
                        SerialReportDetailRespDto::getCharNo,
                        SerialReportDetailRespDto::getAxis,
                        SerialReportDetailRespDto::getNominal,
                        SerialReportDetailRespDto::getUTol,
                        SerialReportDetailRespDto::getLTol,
                        SerialReportDetailRespDto::getMeasuredValue,
                        SerialReportDetailRespDto::getCreateDt,
                        SerialReportDetailRespDto::getUpdateDt)
                .containsExactly(
                        tuple(
                                "C-01",
                                "X",
                                10.0,
                                0.5,
                                -0.5,
                                9.8,
                                LocalDateTime.parse("2026-03-15T08:00:00"),
                                null),
                        tuple(
                                "C-02",
                                "Y",
                                20.0,
                                1.0,
                                -1.0,
                                21.5,
                                LocalDateTime.parse("2026-03-15T08:00:00"),
                                null));
    }

    @Test
    void serialNo가비어있으면실패한다() {
        ApiRespDto<List<SerialReportDetailRespDto>> response = reportService.getSerialReportDetails(
                " ",
                createPrincipalUser());

        assertThat(response.getStatus()).isEqualTo("failed");
        assertThat(response.getMessage()).isEqualTo("serialNo는 필수입니다.");
        assertThat(response.getData()).isNull();
    }

    @Test
    void serialNo조회결과가없으면실패한다() {
        ApiRespDto<List<SerialReportDetailRespDto>> response = reportService.getSerialReportDetails(
                "SN-9999",
                createPrincipalUser());

        assertThat(response.getStatus()).isEqualTo("failed");
        assertThat(response.getMessage()).isEqualTo("일치하는 성적서 상세가 없습니다. serialNo=SN-9999");
        assertThat(response.getData()).isNull();
    }

    @Test
    void serialNo기준검색컨텍스트를반환한다() {
        ApiRespDto<SerialReportContextRespDto> response = reportService.getSerialReportContext(
                "SN-1001",
                createPrincipalUser());

        assertThat(response.getStatus()).isEqualTo("success");
        assertThat(response.getMessage()).isEqualTo("serialNo 기준 검색 컨텍스트를 조회했습니다.");
        assertThat(response.getData()).isNotNull();
        assertThat(response.getData().getProjId()).isEqualTo(1L);
        assertThat(response.getData().getSerialNo()).isEqualTo("SN-1001");
        assertThat(response.getData().getInspDt()).isEqualTo(LocalDateTime.parse("2026-03-15T08:00:00"));
    }

    @Test
    void serialNo기준검색컨텍스트조회결과가없으면실패한다() {
        ApiRespDto<SerialReportContextRespDto> response = reportService.getSerialReportContext(
                "SN-9999",
                createPrincipalUser());

        assertThat(response.getStatus()).isEqualTo("failed");
        assertThat(response.getMessage()).isEqualTo("검색 결과가 없습니다. serialNo=SN-9999");
        assertThat(response.getData()).isNull();
    }

    @Test
    void 프로젝트범위serial후보검색을prefix오름차순으로반환한다() {
        ApiRespDto<List<SerialSearchCandidateRespDto>> response = reportService.searchSerialReportCandidates(
                1L,
                "SN-10",
                8,
                createPrincipalUser());

        assertThat(response.getStatus()).isEqualTo("success");
        assertThat(response.getMessage()).isEqualTo("serialNo 후보를 조회했습니다.");
        assertThat(response.getData())
                .extracting(SerialSearchCandidateRespDto::getSerialNo, SerialSearchCandidateRespDto::getInspDt)
                .containsExactly(
                        tuple("SN-1001", LocalDateTime.parse("2026-03-15T08:00:00")),
                        tuple("SN-1002", LocalDateTime.parse("2026-03-15T10:00:00")),
                        tuple("SN-1003", LocalDateTime.parse("2026-03-28T09:00:00")),
                        tuple("SN-1004", LocalDateTime.parse("2026-04-03T09:00:00")));
    }

    @Test
    void 프로젝트범위serial후보검색은프로젝트를넘지않고limit를적용한다() {
        ApiRespDto<List<SerialSearchCandidateRespDto>> response = reportService.searchSerialReportCandidates(
                1L,
                "SN-",
                2,
                createPrincipalUser());

        assertThat(response.getStatus()).isEqualTo("success");
        assertThat(response.getData())
                .extracting(SerialSearchCandidateRespDto::getSerialNo)
                .containsExactly("SN-1001", "SN-1002");
    }

    private PrincipalUser createPrincipalUser() {
        return PrincipalUser.builder()
                .userId(1L)
                .username("tester")
                .password("pw")
                .userRoleList(List.of(UserRole.builder()
                        .roleId(RoleAccessUtil.ROLE_ID_USER)
                        .role(Role.builder()
                                .roleId(RoleAccessUtil.ROLE_ID_USER)
                                .roleName(RoleAccessUtil.ROLE_NAME_USER)
                                .build())
                        .build()))
                .build();
    }
}
