package com.spc.spc_back.controller.spcdata.excel;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.spc.spc_back.dto.spcdata.ExcelParsePreviewRespDto;
import com.spc.spc_back.entity.user.Role;
import com.spc.spc_back.entity.user.UserRole;
import com.spc.spc_back.security.model.PrincipalUser;
import com.spc.spc_back.service.InspectionService;
import com.spc.spc_back.util.RoleAccessUtil;

@SpringBootTest
@AutoConfigureMockMvc
class ExcelControllerMockMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private InspectionService inspectionService;

    @Test
    void 빈파일이면실패를반환한다() throws Exception {
        PrincipalUser principalUser = createPrincipalUser();
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                new byte[0]);

        mockMvc.perform(multipart("/excel/upload")
                        .file(emptyFile)
                        .param("lotNo", "LOT-001")
                        .param("projId", "1")
                        .with(authentication(authenticationFor(principalUser)))
                        .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("failed"))
                .andExpect(jsonPath("$.message").value("Excel file is empty."))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    void 정상저장이면성공메시지를반환한다() throws Exception {
        PrincipalUser principalUser = createPrincipalUser();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "upload.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "dummy".getBytes());

        ExcelParsePreviewRespDto preview = ExcelParsePreviewRespDto.builder()
                .projId(1L)
                .serialNo("LOT-001")
                .inspDt("2026-05-05 14:30:00")
                .skippedDuplicateSerialNo(false)
                .skipReason("")
                .parsedRowCount(1)
                .build();

        when(inspectionService.parseAndPreview(same(file), eq("LOT-001"), eq(1L)))
                .thenReturn(preview);

        mockMvc.perform(multipart("/excel/upload")
                        .file(file)
                        .param("lotNo", "LOT-001")
                        .param("projId", "1")
                        .with(authentication(authenticationFor(principalUser)))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").value("Excel upload/parse 및 DB 저장이 완료되었습니다."))
                .andExpect(jsonPath("$.data.serialNo").value("LOT-001"))
                .andExpect(jsonPath("$.data.parsedRowCount").value(1));

        verify(inspectionService).parseAndPreview(same(file), eq("LOT-001"), eq(1L));
    }

    @Test
    void 중복시리얼이면스킵사유메시지를반환한다() throws Exception {
        PrincipalUser principalUser = createPrincipalUser();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "upload.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "dummy".getBytes());

        ExcelParsePreviewRespDto preview = ExcelParsePreviewRespDto.builder()
                .projId(1L)
                .serialNo("SN-1001")
                .skippedDuplicateSerialNo(true)
                .skipReason("이미 등록된 serialNo 입니다: SN-1001")
                .parsedRowCount(0)
                .build();

        when(inspectionService.parseAndPreview(same(file), eq("SN-1001"), eq(1L)))
                .thenReturn(preview);

        mockMvc.perform(multipart("/excel/upload")
                        .file(file)
                        .param("lotNo", "SN-1001")
                        .param("projId", "1")
                        .with(authentication(authenticationFor(principalUser)))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").value("이미 등록된 serialNo 입니다: SN-1001"))
                .andExpect(jsonPath("$.data.skippedDuplicateSerialNo").value(true))
                .andExpect(jsonPath("$.data.parsedRowCount").value(0));
    }

    @Test
    void 서비스검증실패는BadRequest로매핑된다() throws Exception {
        PrincipalUser principalUser = createPrincipalUser();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "upload.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "dummy".getBytes());

        when(inspectionService.parseAndPreview(same(file), eq("LOT-001"), eq(999L)))
                .thenThrow(new IllegalArgumentException("프로젝트를 찾을 수 없습니다. projId=999"));

        mockMvc.perform(multipart("/excel/upload")
                        .file(file)
                        .param("lotNo", "LOT-001")
                        .param("projId", "999")
                        .with(authentication(authenticationFor(principalUser)))
                        .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("failed"))
                .andExpect(jsonPath("$.message").value("프로젝트를 찾을 수 없습니다. projId=999"))
                .andExpect(jsonPath("$.data").doesNotExist());
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
