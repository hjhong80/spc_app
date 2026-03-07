package com.spc.spc_back.service.spcdata;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.assertj.core.api.Assertions.within;

import java.time.LocalDate;
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
import com.spc.spc_back.dto.spcdata.ChartDetailRespDto;
import com.spc.spc_back.entity.user.Role;
import com.spc.spc_back.entity.user.UserRole;
import com.spc.spc_back.security.model.PrincipalUser;
import com.spc.spc_back.util.RoleAccessUtil;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@Sql(scripts = { "classpath:schema.sql", "classpath:data.sql" })
class ReportServiceDetailIntegrationTest {

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
    void 월조회는선택한월의일별버킷만반환한다() {
        ApiRespDto<List<ChartDetailRespDto>> response = reportService.getCharacteristicChartDetail(
                1L,
                101L,
                "month",
                "2026-03",
                createPrincipalUser());

        assertThat(response.getStatus()).isEqualTo("success");
        assertThat(response.getData())
                .extracting(
                        ChartDetailRespDto::getBucketKey,
                        ChartDetailRespDto::getBucketLabel,
                        ChartDetailRespDto::getSampleCount)
                .containsExactly(
                        tuple("2026-03-15", "03-15", 2L),
                        tuple("2026-03-28", "03-28", 1L));

        assertThat(response.getData().get(0).getMeasuredMin()).isCloseTo(9.8, within(0.0001));
        assertThat(response.getData().get(0).getMeasuredMax()).isCloseTo(10.0, within(0.0001));
        assertThat(response.getData().get(0).getMeasuredMean()).isCloseTo(9.9, within(0.0001));
        assertThat(response.getData().get(0).getMeasuredSigma()).isCloseTo(0.1, within(0.0001));

        assertThat(response.getData().get(1).getMeasuredMin()).isCloseTo(10.2, within(0.0001));
        assertThat(response.getData().get(1).getMeasuredMax()).isCloseTo(10.2, within(0.0001));
        assertThat(response.getData().get(1).getMeasuredMean()).isCloseTo(10.2, within(0.0001));
        assertThat(response.getData().get(1).getMeasuredSigma()).isCloseTo(0.0, within(0.0001));
    }

    @Test
    void 일조회는선택한일자의개별측정값을시간순으로반환한다() {
        ApiRespDto<List<ChartDetailRespDto>> response = reportService.getCharacteristicChartDetail(
                1L,
                101L,
                "day",
                "2026-03-15",
                createPrincipalUser());

        assertThat(response.getStatus()).isEqualTo("success");
        assertThat(response.getData())
                .extracting(
                        ChartDetailRespDto::getBucketLabel,
                        ChartDetailRespDto::getInspReportId,
                        ChartDetailRespDto::getSerialNo)
                .containsExactly(
                        tuple("08:00", 1001L, "SN-1001"),
                        tuple("10:00", 1002L, "SN-1002"));

        assertThat(response.getData())
                .extracting(
                        ChartDetailRespDto::getBucketDate,
                        ChartDetailRespDto::getBucketDateTime,
                        ChartDetailRespDto::getMeasuredMean,
                        ChartDetailRespDto::getSampleCount)
                .containsExactly(
                        tuple(LocalDate.parse("2026-03-15"), LocalDateTime.parse("2026-03-15T08:00:00"), 9.8, 1L),
                        tuple(LocalDate.parse("2026-03-15"), LocalDateTime.parse("2026-03-15T10:00:00"), 10.0, 1L));
    }

    @Test
    void 월조회는기준일이없으면최신월을사용한다() {
        ApiRespDto<List<ChartDetailRespDto>> response = reportService.getCharacteristicChartDetail(
                1L,
                101L,
                "month",
                null,
                createPrincipalUser());

        assertThat(response.getStatus()).isEqualTo("success");
        assertThat(response.getData())
                .singleElement()
                .satisfies(detail -> {
                    assertThat(detail.getBucketKey()).isEqualTo("2026-04-03");
                    assertThat(detail.getBucketLabel()).isEqualTo("04-03");
                    assertThat(detail.getSampleCount()).isEqualTo(1L);
                    assertThat(detail.getMeasuredMean()).isCloseTo(10.6, within(0.0001));
                });
    }

    @Test
    void 일조회는기준일이없으면최신일자를사용한다() {
        ApiRespDto<List<ChartDetailRespDto>> response = reportService.getCharacteristicChartDetail(
                1L,
                101L,
                "day",
                " ",
                createPrincipalUser());

        assertThat(response.getStatus()).isEqualTo("success");
        assertThat(response.getData())
                .singleElement()
                .satisfies(detail -> {
                    assertThat(detail.getBucketLabel()).isEqualTo("09:00");
                    assertThat(detail.getBucketDate()).isEqualTo(LocalDate.parse("2026-04-03"));
                    assertThat(detail.getInspReportId()).isEqualTo(1004L);
                    assertThat(detail.getSerialNo()).isEqualTo("SN-1004");
                });
    }

    @Test
    void 월조회는기준일이없고데이터없는특성이면빈결과를반환한다() {
        ApiRespDto<List<ChartDetailRespDto>> response = reportService.getCharacteristicChartDetail(
                1L,
                999L,
                "month",
                null,
                createPrincipalUser());

        assertThat(response.getStatus()).isEqualTo("success");
        assertThat(response.getMessage()).isEqualTo("특성 월단위 상세 차트를 조회했습니다.");
        assertThat(response.getData()).isEmpty();
    }

    @Test
    void 월조회에서기준일형식이잘못되면실패한다() {
        ApiRespDto<List<ChartDetailRespDto>> response = reportService.getCharacteristicChartDetail(
                1L,
                101L,
                "month",
                "2026/03",
                createPrincipalUser());

        assertThat(response.getStatus()).isEqualTo("failed");
        assertThat(response.getMessage()).isEqualTo("baseDate는 YYYY-MM 형식이어야 합니다.");
        assertThat(response.getData()).isNull();
    }

    @Test
    void 일조회에서기준일형식이잘못되면실패한다() {
        ApiRespDto<List<ChartDetailRespDto>> response = reportService.getCharacteristicChartDetail(
                1L,
                101L,
                "day",
                "2026-03",
                createPrincipalUser());

        assertThat(response.getStatus()).isEqualTo("failed");
        assertThat(response.getMessage()).isEqualTo("baseDate는 YYYY-MM-DD 형식이어야 합니다.");
        assertThat(response.getData()).isNull();
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
