package com.spc.spc_back.dto.user;

import com.spc.spc_back.entity.user.User;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SigninReqDto {
    @NotBlank(message = "username은 필수입니다.")
    private String username;

    @NotBlank(message = "password는 필수입니다.")
    private String password;

    public User toEntity() {
        return User.builder()
                .username(username)
                .password(password)
                .build();
    }
}
