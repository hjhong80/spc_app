package com.spc.spc_back.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;

import org.junit.jupiter.api.Test;

class ApplicationPropertiesRegressionTest {

    @Test
    void 운영설정은프록시전달헤더를신뢰한다() throws IOException {
        Properties properties = new Properties();

        try (InputStream inputStream = Files.newInputStream(Path.of("src", "main", "resources", "application.properties"))) {
            properties.load(inputStream);
        }

        assertThat(properties.getProperty("server.forward-headers-strategy")).isEqualTo("framework");
    }
}
