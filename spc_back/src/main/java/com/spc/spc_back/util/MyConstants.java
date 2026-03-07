package com.spc.spc_back.util;

public class MyConstants {
    public static final String PASSWORD_REGEX = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$";
    public static final String PASSWORD_MSG = "비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.";
    public static final String BEARER_AUTH = "bearerAuth";
}
