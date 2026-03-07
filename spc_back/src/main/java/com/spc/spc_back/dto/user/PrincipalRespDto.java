package com.spc.spc_back.dto.user;

import java.util.Collections;
import java.util.List;

import com.spc.spc_back.security.model.PrincipalUser;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrincipalRespDto {
    private Long userId;
    private String username;
    private List<Long> roleIds;
    private List<String> roleNames;

    public static PrincipalRespDto fromPrincipal(PrincipalUser principalUser) {
        if (principalUser == null) {
            return null;
        }

        List<Long> mappedRoleIds = principalUser.getUserRoleList() == null
                ? Collections.emptyList()
                : principalUser.getUserRoleList().stream()
                        .filter(userRole -> userRole != null && userRole.getRoleId() != null)
                        .map(userRole -> userRole.getRoleId())
                        .toList();

        List<String> mappedRoleNames = principalUser.getUserRoleList() == null
                ? Collections.emptyList()
                : principalUser.getUserRoleList().stream()
                        .filter(userRole -> userRole != null && userRole.getRole() != null)
                        .map(userRole -> userRole.getRole().getRoleName())
                        .toList();

        return PrincipalRespDto.builder()
                .userId(principalUser.getUserId())
                .username(principalUser.getUsername())
                .roleIds(mappedRoleIds)
                .roleNames(mappedRoleNames)
                .build();
    }
}
