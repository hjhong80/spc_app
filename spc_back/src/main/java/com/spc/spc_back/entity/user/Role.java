package com.spc.spc_back.entity.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Role {
    private Long roleId;
    private String roleName;
    private String roleNameKor;
}
