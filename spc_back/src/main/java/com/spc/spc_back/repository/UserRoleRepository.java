package com.spc.spc_back.repository;

import org.springframework.stereotype.Repository;

import com.spc.spc_back.entity.user.UserRole;
import com.spc.spc_back.mapper.UserRoleMapper;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class UserRoleRepository {
    private final UserRoleMapper userRoleMapper;

    public int insertUserRole(UserRole userRole) {
        return userRoleMapper.insertUserRole(userRole);
    }

    public int updateUserRole(UserRole userRole) {
        return userRoleMapper.updateUserRole(userRole);
    }
}
