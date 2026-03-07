package com.spc.spc_back.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.spc.spc_back.entity.user.User;

@Mapper
public interface UserMapper {
    int insertUser(User user);

    User selectUserByUserId(Long userId);

    User selectUserByUsername(String username);

    int updateUser(User user);

    int deleteUser(Long userId);
}
