package com.spc.spc_back;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;

class TestRuntimeLogNoiseSettingsTest {

    private final Path workspaceRoot = Path.of("").toAbsolutePath().normalize().getParent();
    private final Path mainPropertiesPath = workspaceRoot.resolve("spc_back").resolve("src").resolve("main")
        .resolve("resources").resolve("application.properties");
    private final Path testPropertiesPath = workspaceRoot.resolve("spc_back").resolve("src").resolve("test")
        .resolve("resources").resolve("application.properties");

    @Test
    void 메인설정은로컬실행용일반로그억제옵션을가진다() throws IOException {
        String mainProperties = Files.readString(mainPropertiesPath, StandardCharsets.UTF_8);

        assertThat(mainProperties).contains("spring.main.banner-mode=off");
        assertThat(mainProperties).contains("spring.main.log-startup-info=false");
        assertThat(mainProperties).contains("logging.level.com.zaxxer.hikari=WARN");
        assertThat(mainProperties).contains("logging.level.org.springframework.boot.actuate.endpoint.web=WARN");
        assertThat(mainProperties).contains("logging.level.com.spc.spc_back=INFO");
    }

    @Test
    void 테스트설정은스프링테스트와테스트컨테이너로그억제옵션을가진다() throws IOException {
        String testProperties = Files.readString(testPropertiesPath, StandardCharsets.UTF_8);

        assertThat(testProperties).contains("logging.level.org.springframework.test.context=WARN");
        assertThat(testProperties).contains("logging.level.org.springframework.boot.test.context=WARN");
        assertThat(testProperties).contains("logging.level.org.testcontainers=WARN");
        assertThat(testProperties).contains("logging.level.com.github.dockerjava=WARN");
    }
}
