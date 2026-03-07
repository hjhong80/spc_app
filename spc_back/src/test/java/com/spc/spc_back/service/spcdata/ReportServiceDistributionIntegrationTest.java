package com.spc.spc_back.service.spcdata;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

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
import com.spc.spc_back.dto.spcdata.ChartDistributionRespDto;
import com.spc.spc_back.entity.user.Role;
import com.spc.spc_back.entity.user.UserRole;
import com.spc.spc_back.security.model.PrincipalUser;
import com.spc.spc_back.util.RoleAccessUtil;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@Sql(scripts = { "classpath:schema.sql", "classpath:data.sql" })
class ReportServiceDistributionIntegrationTest {

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
    void 월조회는선택한특성과해당월데이터만집계한다() {
        ApiRespDto<ChartDistributionRespDto> response = reportService.getCharacteristicDistribution(
                1L,
                101L,
                "month",
                "2026-03",
                createPrincipalUser());

        assertThat(response.getStatus()).isEqualTo("success");
        assertThat(response.getData()).isNotNull();
        assertThat(response.getData().getMeasuredValues()).containsExactly(9.8, 10.0, 10.2);
        assertThat(response.getData().getMeasuredMean()).isCloseTo(10.0, within(0.0001));
        assertThat(response.getData().getMeasuredSigma()).isCloseTo(0.163299, within(0.0001));
        assertThat(response.getData().getSampleCount()).isEqualTo(3L);
    }

    @Test
    void 일조회는선택한일자의데이터만반환한다() {
        ApiRespDto<ChartDistributionRespDto> response = reportService.getCharacteristicDistribution(
                1L,
                101L,
                "day",
                "2026-03-15",
                createPrincipalUser());

        assertThat(response.getStatus()).isEqualTo("success");
        assertThat(response.getData()).isNotNull();
        assertThat(response.getData().getMeasuredValues()).containsExactly(9.8, 10.0);
        assertThat(response.getData().getMeasuredMean()).isCloseTo(9.9, within(0.0001));
        assertThat(response.getData().getMeasuredSigma()).isCloseTo(0.1, within(0.0001));
        assertThat(response.getData().getSampleCount()).isEqualTo(2L);
    }

    @Test
    void 다른프로젝트특성치는분포조회에서섞이지않는다() {
        ApiRespDto<ChartDistributionRespDto> response = reportService.getCharacteristicDistribution(
                1L,
                201L,
                "day",
                "2026-03-15",
                createPrincipalUser());

        assertThat(response.getStatus()).isEqualTo("success");
        assertThat(response.getMessage()).isEqualTo("선택한 기간의 분포 데이터가 없습니다.");
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
