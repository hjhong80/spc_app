package com.spc.spc_back.security.model;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.spc.spc_back.entity.user.UserRole;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PrincipalUser implements UserDetails {
    private Long userId;
    private String username;
    private String password;

    private List<UserRole> userRoleList;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return userRoleList.stream()
                .map(userRole -> new SimpleGrantedAuthority(userRole.getRole().getRoleName()))
                .collect(Collectors.toList());
    }
}
