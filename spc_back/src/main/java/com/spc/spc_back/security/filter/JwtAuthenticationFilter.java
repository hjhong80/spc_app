package com.spc.spc_back.security.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.spc.spc_back.entity.user.User;
import com.spc.spc_back.repository.UserRepository;
import com.spc.spc_back.security.jwt.JwtUtils;
import com.spc.spc_back.security.model.PrincipalUser;

import java.io.IOException;
import java.util.Optional;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws IOException, ServletException {
        String authorization = request.getHeader("Authorization");
        if (authorization == null || !jwtUtils.isBearer(authorization)) {
            filterChain.doFilter(request, response);
            return;
        }

        String accessToken = jwtUtils.removeBearer(authorization);
        try {
            Claims claims = jwtUtils.getClaims(accessToken);
            String userIdClaim = claims.getId();

            if (userIdClaim == null || userIdClaim.isBlank()) {
                log.warn("JWT 인증 실패: userId 클레임(jti)이 없습니다.");
                filterChain.doFilter(request, response);
                return;
            }

            Long userId;
            try {
                userId = Long.parseLong(userIdClaim);
            } catch (NumberFormatException e) {
                log.warn("JWT 인증 실패: userId 클레임(jti)이 숫자가 아닙니다. (userIdClaim: {})", userIdClaim);
                filterChain.doFilter(request, response);
                return;
            }

            Optional<User> foundUser = userRepository.selectUserByUserId(userId);
            foundUser.ifPresentOrElse(user -> {
                if (SecurityContextHolder.getContext().getAuthentication() != null) {
                    return;
                }

                PrincipalUser principalUser = PrincipalUser.builder()
                        .userId(user.getUserId())
                        .username(user.getUsername())
                        .password(user.getPassword())
                        .userRoleList(user.getUserRoleList())
                        .build();

                Authentication authentication = new UsernamePasswordAuthenticationToken(
                        principalUser,
                        null,
                        principalUser.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }, () -> log.warn("JWT 인증 실패: 해당 사용자 정보가 없습니다. (userId: {})", userId));
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("JWT 인증 처리 실패: {}", e.getMessage(), e);
        }

        filterChain.doFilter(request, response);
    }
}
