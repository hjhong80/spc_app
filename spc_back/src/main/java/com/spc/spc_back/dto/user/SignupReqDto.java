package com.spc.spc_back.dto.user;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.spc.spc_back.entity.user.User;
import com.spc.spc_back.util.MyConstants;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SignupReqDto {
    @NotBlank(message = "username은 필수입니다.")
    private String username;

    @Pattern(regexp = MyConstants.PASSWORD_REGEX, message = MyConstants.PASSWORD_MSG)
    private String password;

    public User toEntity(BCryptPasswordEncoder bCryptPasswordEncoder) {
        return User.builder()
                .username(username)
                .password(bCryptPasswordEncoder.encode(password))
                .build();
    }
}
