package com.spc.spc_back.entity.user;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserRole {
    private Long userRoleId;
    private Long userId;
    private Long roleId;
    private LocalDateTime createDt;
    private LocalDateTime updateDt;

    private Role role;
}
