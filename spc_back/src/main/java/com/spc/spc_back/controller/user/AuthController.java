package com.spc.spc_back.controller.user;

import lombok.RequiredArgsConstructor;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.spc.spc_back.dto.user.SigninReqDto;
import com.spc.spc_back.dto.user.SignupReqDto;
import com.spc.spc_back.service.user.AuthService;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;

import com.spc.spc_back.dto.ApiRespDto;

@RestController
@RequestMapping(value = "/auth", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiRespDto<Void>> signup(@Valid @RequestBody SignupReqDto signupReqDto) {
        return ResponseEntity.ok(authService.signup(signupReqDto));
    }

    @PostMapping("/signin")
    public ResponseEntity<ApiRespDto<String>> signin(@Valid @RequestBody SigninReqDto signinReqDto) {
        return ResponseEntity.ok(authService.signin(signinReqDto));
    }
}
