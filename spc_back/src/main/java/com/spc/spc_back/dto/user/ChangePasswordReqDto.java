package com.spc.spc_back.dto.user;

import com.spc.spc_back.util.MyConstants;

import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChangePasswordReqDto {
    private String oldPassword;

    @Pattern(regexp = MyConstants.PASSWORD_REGEX, message = MyConstants.PASSWORD_MSG)
    private String newPassword;
}
