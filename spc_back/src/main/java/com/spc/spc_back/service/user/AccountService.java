package com.spc.spc_back.service.user;

import java.util.Optional;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spc.spc_back.dto.ApiRespDto;
import com.spc.spc_back.dto.user.ChangePasswordReqDto;
import com.spc.spc_back.dto.user.PrincipalRespDto;
import com.spc.spc_back.entity.user.User;
import com.spc.spc_back.repository.UserRepository;
import com.spc.spc_back.security.model.PrincipalUser;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;

    @Transactional
    public ApiRespDto<Void> changePassword(
            ChangePasswordReqDto changePasswordReqDto,
            PrincipalUser principalUser) {
        if (principalUser == null) {
            log.error("로그인 사용자 정보가 없습니다.");
            return new ApiRespDto<>("failed", "잘못된 접근입니다.", null);
        }

        Optional<User> foundUser = userRepository.selectUserByUserId(principalUser.getUserId());

        if (foundUser.isEmpty()) {
            log.error("사용자 정보를 찾을 수 없습니다.");
            return new ApiRespDto<>("failed", "사용자 정보를 찾을 수 없습니다.", null);
        }

        User user = foundUser.get();

        if (!bCryptPasswordEncoder.matches(changePasswordReqDto.getOldPassword(), user.getPassword())) {
            log.error("기존 비밀번호가 일치하지 않습니다.");
            return new ApiRespDto<>("failed", "사용자 정보를 다시 확인해주세요.", null);
        }

        user.setPassword(bCryptPasswordEncoder.encode(changePasswordReqDto.getNewPassword()));
        int result = userRepository.updateUser(user);

        if (result == 0) {
            log.error("DB 변경 실패");
            return new ApiRespDto<>("failed", "비밀번호 변경이 실패했습니다.", null);
        }

        log.info("비밀번호 변경 성공");
        return new ApiRespDto<>("success", "비밀번호 변경이 성공했습니다.", null);
    }

    @Transactional
    public ApiRespDto<Void> signout(Long userId, PrincipalUser principalUser) {
        if (principalUser == null) {
            log.error("로그인 사용자 정보가 없습니다.");
            return new ApiRespDto<>("failed", "잘못된 접근입니다.", null);
        }

        if (!principalUser.getUserId().equals(userId)
                && principalUser.getUserRoleList().stream()
                        .filter(role -> role.getRoleId() == 1L).findAny().isEmpty()) {
            log.error("로그인 사용자와 탈퇴 대상 사용자가 일치하지 않습니다.");
            return new ApiRespDto<>("failed", "로그인 사용자와 탈퇴 대상 사용자가 일치하지 않습니다.", null);
        }

        Optional<User> foundUser = userRepository.selectUserByUserId(userId);

        if (foundUser.isEmpty()) {
            log.error("사용자 정보를 찾을 수 없습니다.");
            return new ApiRespDto<>("failed", "사용자 정보를 찾을 수 없습니다.", null);
        }

        int result = userRepository.deleteUser(userId);

        if (result == 0) {
            log.error("DB 변경 실패");
            return new ApiRespDto<>("failed", "회원 탈퇴가 실패했습니다.", null);
        }

        log.info("회원 탈퇴 성공");
        return new ApiRespDto<>("success", "회원 탈퇴가 성공했습니다.", null);
    }

    public ApiRespDto<PrincipalRespDto> getPrincipal(PrincipalUser principalUser) {
        if (principalUser == null) {
            return new ApiRespDto<>("failed", "로그인 상태가 아닙니다.", null);
        }

        return new ApiRespDto<>("success", "사용자 인증 정보를 조회했습니다.", PrincipalRespDto.fromPrincipal(principalUser));
    }
}
