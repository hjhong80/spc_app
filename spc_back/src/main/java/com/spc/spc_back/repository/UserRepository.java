package com.spc.spc_back.repository;

import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.spc.spc_back.entity.user.User;
import com.spc.spc_back.mapper.UserMapper;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class UserRepository {
    public final UserMapper userMapper;

    public int insertUser(User user) {
        return userMapper.insertUser(user);
    }

    public Optional<User> selectUserByUserId(Long userId) {
        return Optional.ofNullable(userMapper.selectUserByUserId(userId));
    }

    public Optional<User> selectUserByUsername(String username) {
        return Optional.ofNullable(userMapper.selectUserByUsername(username));
    }

    public int updateUser(User user) {
        return userMapper.updateUser(user);
    }

    public int deleteUser(Long userId) {
        return userMapper.deleteUser(userId);
    }
}
