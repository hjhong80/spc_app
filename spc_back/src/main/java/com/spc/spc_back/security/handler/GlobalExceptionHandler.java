package com.spc.spc_back.security.handler;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.spc.spc_back.dto.ApiRespDto;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiRespDto<Void>> handleRuntimeException(RuntimeException e) {
        return ResponseEntity.ok(new ApiRespDto<>("failed", "문제가 발생하였습니다 : " + e.getMessage(), null));
    }
}
