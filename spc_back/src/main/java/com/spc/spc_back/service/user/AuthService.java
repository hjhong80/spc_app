package com.spc.spc_back.service.user;

import java.util.Optional;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spc.spc_back.dto.ApiRespDto;
import com.spc.spc_back.dto.user.SigninReqDto;
import com.spc.spc_back.dto.user.SignupReqDto;
import com.spc.spc_back.entity.user.User;
import com.spc.spc_back.entity.user.UserRole;
import com.spc.spc_back.repository.UserRepository;
import com.spc.spc_back.repository.UserRoleRepository;
import com.spc.spc_back.security.jwt.JwtUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final JwtUtils jwtUtils;

    @Transactional
    public ApiRespDto<Void> signup(SignupReqDto signupReqDto) {
        Optional<User> foundUser = userRepository.selectUserByUsername(signupReqDto.getUsername());

        if (foundUser.isPresent()) {
            log.error("이미 존재하는 사용자입니다.");
            return new ApiRespDto<>("failed", "이미 존재하는 사용자입니다.", null);
        }

        User user = signupReqDto.toEntity(bCryptPasswordEncoder);

        int result = userRepository.insertUser(user);
        if (result == 0) {
            log.error("user_tb DB 저장 실패");
            return new ApiRespDto<>("failed", "회원가입 실패", null);
        }

        Optional<User> foundUserByUsername = userRepository.selectUserByUsername(user.getUsername());
        if (foundUserByUsername.isEmpty()) {
            log.error("회원가입 직후 사용자 조회 실패");
            return new ApiRespDto<>("failed", "회원가입 실패", null);
        }

        UserRole userRole = UserRole.builder()
                .userId(foundUserByUsername.get().getUserId())
                .roleId(3L)
                .build();

        int resultUserRole = userRoleRepository.insertUserRole(userRole);
        if (resultUserRole == 0) {
            log.error("user_role_tb DB 저장 실패");
            return new ApiRespDto<>("failed", "회원가입 실패", null);
        }

        log.info("회원가입 성공: {}", user.getUsername());
        return new ApiRespDto<>("success", "회원가입이 성공했습니다.", null);
    }

    public ApiRespDto<String> signin(SigninReqDto signinReqDto) {
        Optional<User> foundUser = userRepository.selectUserByUsername(signinReqDto.getUsername());

        if (foundUser.isEmpty()) {
            log.error("username 불일치");
            return new ApiRespDto<>("failed", "사용자 정보를 다시 확인해주세요.", null);
        }

        if (!bCryptPasswordEncoder.matches(signinReqDto.getPassword(), foundUser.get().getPassword())) {
            log.error("password 불일치");
            return new ApiRespDto<>("failed", "사용자 정보를 다시 확인해주세요.", null);
        }

        String accessToken = jwtUtils.generateAccessToken(foundUser.get().getUserId().toString());

        log.info("로그인 성공: {}", signinReqDto.getUsername());
        return new ApiRespDto<>("success", "로그인 되었습니다.", accessToken);
    }
}
