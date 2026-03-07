package com.spc.spc_back;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;

@SpringBootTest
class TestLogWarningSettingsIntegrationTest {

    @Autowired
    private Environment environment;

    @Test
    void 테스트환경에서로그경고억제설정이적용된다() {
        assertThat(environment.getProperty("spring.thymeleaf.check-template-location", Boolean.class)).isFalse();
        assertThat(environment.getProperty("springdoc.api-docs.enabled", Boolean.class)).isFalse();
        assertThat(environment.getProperty("springdoc.swagger-ui.enabled", Boolean.class)).isFalse();
    }
}
