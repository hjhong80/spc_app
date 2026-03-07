package com.spc.spc_back.service.spcdata;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.spc.spc_back.dto.ApiRespDto;
import com.spc.spc_back.dto.spcdata.ChartDistributionRespDto;
import com.spc.spc_back.dto.spcdata.ChartDistributionSourceDto;
import com.spc.spc_back.entity.spcdata.Project;
import com.spc.spc_back.entity.user.Role;
import com.spc.spc_back.entity.user.UserRole;
import com.spc.spc_back.repository.InspectionDataRepository;
import com.spc.spc_back.repository.InspectionReportRepository;
import com.spc.spc_back.repository.ProjectRepository;
import com.spc.spc_back.security.model.PrincipalUser;
import com.spc.spc_back.util.RoleAccessUtil;

@ExtendWith(MockitoExtension.class)
class ReportServiceDistributionTest {

    @Mock
    private InspectionDataRepository inspectionDataRepository;

    @Mock
    private InspectionReportRepository inspectionReportRepository;

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private ReportService reportService;

    @Test
    void 월정규분포는해당월기간만조회한다() {
        PrincipalUser principalUser = createPrincipalUser();
        when(projectRepository.selectProjectByProjId(1L)).thenReturn(Optional.of(new Project()));
        when(inspectionDataRepository.selectDistributionMetaByProjIdAndCharId(1L, 10L))
                .thenReturn(Optional.of(createDistributionMeta(10.0, 0.5, -0.5)));
        when(inspectionDataRepository.selectDistributionMeasuredValueListByCharIdAndPeriod(
                eq(1L),
                eq(10L),
                eq(LocalDateTime.of(2026, 3, 1, 0, 0)),
                eq(LocalDateTime.of(2026, 4, 1, 0, 0))))
                        .thenReturn(Optional.of(List.of(
                                createMeasuredRow(9.8, LocalDateTime.of(2026, 3, 3, 9, 0)),
                                createMeasuredRow(10.0, LocalDateTime.of(2026, 3, 11, 9, 0)),
                                createMeasuredRow(10.2, LocalDateTime.of(2026, 3, 27, 9, 0)))));

        ApiRespDto<ChartDistributionRespDto> response = reportService.getCharacteristicDistribution(
                1L,
                10L,
                "month",
                "2026-03",
                principalUser);

        verify(inspectionDataRepository).selectDistributionMetaByProjIdAndCharId(1L, 10L);
        verify(inspectionDataRepository).selectDistributionMeasuredValueListByCharIdAndPeriod(
                1L,
                10L,
                LocalDateTime.of(2026, 3, 1, 0, 0),
                LocalDateTime.of(2026, 4, 1, 0, 0));
        assertThat(response.getStatus()).isEqualTo("success");
        assertThat(response.getData()).isNotNull();
        assertThat(response.getData().getMeasuredValues()).containsExactly(9.8, 10.0, 10.2);
        assertThat(response.getData().getMeasuredMean()).isCloseTo(10.0, within(0.0001));
        assertThat(response.getData().getMeasuredSigma()).isCloseTo(0.163299, within(0.0001));
        assertThat(response.getData().getSampleCount()).isEqualTo(3L);
    }

    @Test
    void 일정규분포는해당일기간만조회한다() {
        PrincipalUser principalUser = createPrincipalUser();
        when(projectRepository.selectProjectByProjId(1L)).thenReturn(Optional.of(new Project()));
        when(inspectionDataRepository.selectDistributionMetaByProjIdAndCharId(1L, 10L))
                .thenReturn(Optional.of(createDistributionMeta(20.0, 1.0, -1.0)));
        when(inspectionDataRepository.selectDistributionMeasuredValueListByCharIdAndPeriod(
                eq(1L),
                eq(10L),
                eq(LocalDateTime.of(2026, 3, 15, 0, 0)),
                eq(LocalDateTime.of(2026, 3, 16, 0, 0))))
                        .thenReturn(Optional.of(List.of(
                                createMeasuredRow(19.5, LocalDateTime.of(2026, 3, 15, 8, 0)),
                                createMeasuredRow(20.5, LocalDateTime.of(2026, 3, 15, 10, 0)))));

        ApiRespDto<ChartDistributionRespDto> response = reportService.getCharacteristicDistribution(
                1L,
                10L,
                "day",
                "2026-03-15",
                principalUser);

        verify(inspectionDataRepository).selectDistributionMetaByProjIdAndCharId(1L, 10L);
        verify(inspectionDataRepository).selectDistributionMeasuredValueListByCharIdAndPeriod(
                1L,
                10L,
                LocalDateTime.of(2026, 3, 15, 0, 0),
                LocalDateTime.of(2026, 3, 16, 0, 0));
        assertThat(response.getStatus()).isEqualTo("success");
        assertThat(response.getData()).isNotNull();
        assertThat(response.getData().getMeasuredValues()).containsExactly(19.5, 20.5);
        assertThat(response.getData().getMeasuredMean()).isCloseTo(20.0, within(0.0001));
        assertThat(response.getData().getMeasuredSigma()).isCloseTo(0.5, within(0.0001));
        assertThat(response.getData().getNominal()).isEqualTo(20.0);
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

    private ChartDistributionSourceDto createDistributionMeta(
            double nominal,
            double uTol,
            double lTol) {
        return ChartDistributionSourceDto.builder()
                .charId(10L)
                .charNo("C-01")
                .axis("X")
                .nominal(nominal)
                .uTol(uTol)
                .lTol(lTol)
                .build();
    }

    private ChartDistributionSourceDto createMeasuredRow(
            double measuredValue,
            LocalDateTime inspDt) {
        return ChartDistributionSourceDto.builder()
                .charId(10L)
                .measuredValue(measuredValue)
                .inspReportId(100L)
                .serialNo("SN-1")
                .inspDt(inspDt)
                .build();
    }
}
