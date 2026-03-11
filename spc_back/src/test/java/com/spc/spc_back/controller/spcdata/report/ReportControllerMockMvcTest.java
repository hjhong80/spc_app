package com.spc.spc_back.controller.spcdata.report;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.spc.spc_back.dto.ApiRespDto;
import com.spc.spc_back.dto.spcdata.ChartDetailRespDto;
import com.spc.spc_back.dto.spcdata.ChartDistributionRespDto;
import com.spc.spc_back.dto.spcdata.ChartStatRespDto;
import com.spc.spc_back.dto.spcdata.ProjIdAndNameRespDto;
import com.spc.spc_back.dto.spcdata.SerialSearchCandidateRespDto;
import com.spc.spc_back.dto.spcdata.SerialReportContextRespDto;
import com.spc.spc_back.dto.spcdata.SerialReportDetailRespDto;
import com.spc.spc_back.entity.user.Role;
import com.spc.spc_back.entity.user.UserRole;
import com.spc.spc_back.security.model.PrincipalUser;
import com.spc.spc_back.service.spcdata.ReportService;
import com.spc.spc_back.util.RoleAccessUtil;

@SpringBootTest
@AutoConfigureMockMvc
class ReportControllerMockMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ReportService reportService;

    @Test
    void 인증없이최근프로젝트목록을요청하면차단된다() throws Exception {
        mockMvc.perform(get("/spcdata/report/recently-project/list"))
                .andExpect(status().isForbidden());

        verify(reportService, never()).getRecentlyProjectList(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void 최근프로젝트목록을반환한다() throws Exception {
        PrincipalUser principalUser = createPrincipalUser();
        when(reportService.getRecentlyProjectList(same(principalUser)))
                .thenReturn(new ApiRespDto<>("success", "ok", List.of(
                        ProjIdAndNameRespDto.builder()
                                .projId(1L)
                                .projName("Project One")
                                .build())));

        mockMvc.perform(get("/spcdata/report/recently-project/list")
                        .with(authentication(authenticationFor(principalUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data[0].projId").value(1))
                .andExpect(jsonPath("$.data[0].projName").value("Project One"));

        verify(reportService).getRecentlyProjectList(same(principalUser));
    }

    @Test
    void 차트통계를반환한다() throws Exception {
        PrincipalUser principalUser = createPrincipalUser();
        when(reportService.getProjectChartStats(eq(1L), same(principalUser)))
                .thenReturn(new ApiRespDto<>("success", "ok", List.of(
                        ChartStatRespDto.builder()
                                .charId(101L)
                                .charNo("C-01")
                                .measuredMean(10.0)
                                .sampleCount(3L)
                                .build())));

        mockMvc.perform(get("/spcdata/report/project/1/chart-stats")
                        .with(authentication(authenticationFor(principalUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data[0].charId").value(101))
                .andExpect(jsonPath("$.data[0].charNo").value("C-01"))
                .andExpect(jsonPath("$.data[0].measuredMean").value(10.0))
                .andExpect(jsonPath("$.data[0].sampleCount").value(3));

        verify(reportService).getProjectChartStats(eq(1L), same(principalUser));
    }

    @Test
    void 상세차트조회파라미터를전달한다() throws Exception {
        PrincipalUser principalUser = createPrincipalUser();
        when(reportService.getCharacteristicChartDetail(eq(1L), eq(101L), eq("day"), eq("2026-03-15"),
                same(principalUser)))
                .thenReturn(new ApiRespDto<>("success", "ok", List.of(
                        ChartDetailRespDto.builder()
                                .bucketKey("2026-03-15T08:00:00-1001")
                                .bucketLabel("08:00")
                                .bucketDate(LocalDate.parse("2026-03-15"))
                                .bucketDateTime(LocalDateTime.parse("2026-03-15T08:00:00"))
                                .sampleCount(1L)
                                .inspReportId(1001L)
                                .serialNo("SN-1001")
                                .build())));

        mockMvc.perform(get("/spcdata/report/project/1/characteristic/101/detail")
                        .queryParam("scale", "day")
                        .queryParam("baseDate", "2026-03-15")
                        .with(authentication(authenticationFor(principalUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data[0].bucketLabel").value("08:00"))
                .andExpect(jsonPath("$.data[0].inspReportId").value(1001))
                .andExpect(jsonPath("$.data[0].serialNo").value("SN-1001"));

        verify(reportService).getCharacteristicChartDetail(eq(1L), eq(101L), eq("day"), eq("2026-03-15"),
                same(principalUser));
    }

    @Test
    void 분포조회파라미터를전달한다() throws Exception {
        PrincipalUser principalUser = createPrincipalUser();
        when(reportService.getCharacteristicDistribution(eq(1L), eq(101L), eq("month"), eq("2026-03"),
                same(principalUser)))
                .thenReturn(new ApiRespDto<>("success", "ok",
                        ChartDistributionRespDto.builder()
                                .charId(101L)
                                .scale("month")
                                .baseDate("2026-03")
                                .sampleCount(3L)
                                .measuredValues(List.of(9.8, 10.0, 10.2))
                                .build()));

        mockMvc.perform(get("/spcdata/report/project/1/characteristic/101/distribution")
                        .queryParam("scale", "month")
                        .queryParam("baseDate", "2026-03")
                        .with(authentication(authenticationFor(principalUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.charId").value(101))
                .andExpect(jsonPath("$.data.scale").value("month"))
                .andExpect(jsonPath("$.data.baseDate").value("2026-03"))
                .andExpect(jsonPath("$.data.sampleCount").value(3))
                .andExpect(jsonPath("$.data.measuredValues[0]").value(9.8));

        verify(reportService).getCharacteristicDistribution(eq(1L), eq(101L), eq("month"), eq("2026-03"),
                same(principalUser));
    }

    @Test
    void 리포트건수를반환한다() throws Exception {
        PrincipalUser principalUser = createPrincipalUser();
        when(reportService.getProjectReportCount(eq(1L), same(principalUser)))
                .thenReturn(new ApiRespDto<>("success", "ok", 17L));

        mockMvc.perform(get("/spcdata/report/project/1/report-count")
                        .with(authentication(authenticationFor(principalUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data").value(17));

        verify(reportService).getProjectReportCount(eq(1L), same(principalUser));
    }

    @Test
    void serialNo기준성적서상세조회파라미터를전달한다() throws Exception {
        PrincipalUser principalUser = createPrincipalUser();
        when(reportService.getSerialReportDetails(eq("SN-1001"), same(principalUser)))
                .thenReturn(new ApiRespDto<>("success", "ok", List.of(
                        SerialReportDetailRespDto.builder()
                                .charNo("C-01")
                                .axis("X")
                                .nominal(10.0)
                                .uTol(0.5)
                                .lTol(-0.5)
                                .measuredValue(9.8)
                                .createDt(LocalDateTime.parse("2026-03-15T08:00:00"))
                                .updateDt(null)
                                .build())));

        mockMvc.perform(get("/spcdata/report/serial/SN-1001/details")
                        .with(authentication(authenticationFor(principalUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data[0].charNo").value("C-01"))
                .andExpect(jsonPath("$.data[0].axis").value("X"))
                .andExpect(jsonPath("$.data[0].nominal").value(10.0))
                .andExpect(jsonPath("$.data[0].measuredValue").value(9.8))
                .andExpect(jsonPath("$.data[0].createDt").value("2026-03-15T08:00:00"))
                .andExpect(jsonPath("$.data[0].updateDt").isEmpty());

        verify(reportService).getSerialReportDetails(eq("SN-1001"), same(principalUser));
    }

    @Test
    void serialNo기준검색컨텍스트조회파라미터를전달한다() throws Exception {
        PrincipalUser principalUser = createPrincipalUser();
        when(reportService.getSerialReportContext(eq("SN-1001"), same(principalUser)))
                .thenReturn(new ApiRespDto<>("success", "ok",
                        SerialReportContextRespDto.builder()
                                .projId(1L)
                                .serialNo("SN-1001")
                                .inspDt(LocalDateTime.parse("2026-03-15T08:00:00"))
                                .build()));

        mockMvc.perform(get("/spcdata/report/serial/SN-1001/context")
                        .with(authentication(authenticationFor(principalUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.projId").value(1))
                .andExpect(jsonPath("$.data.serialNo").value("SN-1001"))
                .andExpect(jsonPath("$.data.inspDt").value("2026-03-15T08:00:00"));

        verify(reportService).getSerialReportContext(eq("SN-1001"), same(principalUser));
    }

    @Test
    void 프로젝트범위serial후보검색파라미터를전달한다() throws Exception {
        PrincipalUser principalUser = createPrincipalUser();
        when(reportService.searchSerialReportCandidates(eq(1L), eq("SN-10"), eq(8), same(principalUser)))
                .thenReturn(new ApiRespDto<>("success", "ok", List.of(
                        SerialSearchCandidateRespDto.builder()
                                .serialNo("SN-1001")
                                .inspDt(LocalDateTime.parse("2026-03-15T08:00:00"))
                                .build(),
                        SerialSearchCandidateRespDto.builder()
                                .serialNo("SN-1002")
                                .inspDt(LocalDateTime.parse("2026-03-15T10:00:00"))
                                .build())));

        mockMvc.perform(get("/spcdata/report/project/1/serial-search")
                        .queryParam("keyword", "SN-10")
                        .queryParam("limit", "8")
                        .with(authentication(authenticationFor(principalUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data[0].serialNo").value("SN-1001"))
                .andExpect(jsonPath("$.data[0].inspDt").value("2026-03-15T08:00:00"))
                .andExpect(jsonPath("$.data[1].serialNo").value("SN-1002"));

        verify(reportService).searchSerialReportCandidates(eq(1L), eq("SN-10"), eq(8), same(principalUser));
    }

    private Authentication authenticationFor(PrincipalUser principalUser) {
        return new UsernamePasswordAuthenticationToken(
                principalUser,
                null,
                principalUser.getAuthorities());
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
