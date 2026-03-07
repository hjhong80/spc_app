package com.spc.spc_back.controller.user;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.spc.spc_back.dto.ApiRespDto;
import com.spc.spc_back.dto.user.ChangePasswordReqDto;
import com.spc.spc_back.dto.user.PrincipalRespDto;
import com.spc.spc_back.security.model.PrincipalUser;
import com.spc.spc_back.service.user.AccountService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(value = "/account", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class AccountController {
    private final AccountService accountService;

    @PostMapping("/password")
    public ResponseEntity<ApiRespDto<Void>> changePassword(
            @Valid @RequestBody ChangePasswordReqDto changePasswordReqDto,
            @AuthenticationPrincipal PrincipalUser principalUser) {
        return ResponseEntity.ok(accountService.changePassword(changePasswordReqDto, principalUser));
    }

    @PostMapping("/signout/{userId}")
    public ResponseEntity<ApiRespDto<Void>> signout(
            @PathVariable Long userId,
            @AuthenticationPrincipal PrincipalUser principalUser) {
        return ResponseEntity.ok(accountService.signout(userId, principalUser));
    }

    @GetMapping("/principal")
    public ResponseEntity<ApiRespDto<PrincipalRespDto>> getPrincipal(
            @AuthenticationPrincipal PrincipalUser principalUser) {
        return ResponseEntity.ok(accountService.getPrincipal(principalUser));
    }
}
