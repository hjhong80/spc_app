package com.spc.spc_back.util;

import com.spc.spc_back.entity.user.Role;
import com.spc.spc_back.entity.user.UserRole;
import com.spc.spc_back.security.model.PrincipalUser;

public final class RoleAccessUtil {
    public static final long ROLE_ID_ADMIN = 1L;
    public static final long ROLE_ID_USER = 2L;

    public static final String ROLE_NAME_ADMIN = "ROLE_ADMIN";
    public static final String ROLE_NAME_USER = "ROLE_USER";

    public static final String SPC_ACCESS_DENIED_MESSAGE = "권한이 없습니다. role_id 1(관리자) 또는 2(유저) 권한이 필요합니다.";

    private RoleAccessUtil() {
    }

    public static boolean hasSpcDataAccess(PrincipalUser principalUser) {
        if (principalUser == null || principalUser.getUserRoleList() == null) {
            return false;
        }

        return principalUser.getUserRoleList().stream()
                .anyMatch(RoleAccessUtil::isAdminOrUserRole);
    }

    public static boolean isAdminOrUserRoleId(Long roleId) {
        return Long.valueOf(ROLE_ID_ADMIN).equals(roleId) || Long.valueOf(ROLE_ID_USER).equals(roleId);
    }

    private static boolean isAdminOrUserRole(UserRole userRole) {
        if (userRole == null) {
            return false;
        }

        if (isAdminOrUserRoleId(userRole.getRoleId())) {
            return true;
        }

        Role role = userRole.getRole();
        if (role == null || role.getRoleName() == null) {
            return false;
        }

        return ROLE_NAME_ADMIN.equals(role.getRoleName()) || ROLE_NAME_USER.equals(role.getRoleName());
    }
}
