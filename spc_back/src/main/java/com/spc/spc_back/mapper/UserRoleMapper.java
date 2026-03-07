package com.spc.spc_back.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.spc.spc_back.entity.user.UserRole;

@Mapper
public interface UserRoleMapper {
    int insertUserRole(UserRole userRole);

    int updateUserRole(UserRole userRole);
}
