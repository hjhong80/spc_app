package com.spc.spc_back.entity.user;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class User {
    private Long userId;
    private String username;
    @JsonIgnore
    private String password;
    private LocalDateTime createDt;
    private LocalDateTime updateDt;

    private List<UserRole> userRoleList;
}
