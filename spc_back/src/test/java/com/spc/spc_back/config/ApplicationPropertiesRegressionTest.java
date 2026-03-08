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
        Properties properties = loadProperties(Path.of("src", "main", "resources", "application.properties"));

        assertThat(properties.getProperty("server.forward-headers-strategy")).isEqualTo("framework");
    }

    @Test
    void 운영설정은스웨거토글환경변수를노출한다() throws IOException {
        Properties properties = loadProperties(Path.of("src", "main", "resources", "application.properties"));

        assertThat(properties.getProperty("springdoc.api-docs.enabled"))
                .isEqualTo("${SPC_SPRINGDOC_API_DOCS_ENABLED:true}");
        assertThat(properties.getProperty("springdoc.swagger-ui.enabled"))
                .isEqualTo("${SPC_SPRINGDOC_SWAGGER_UI_ENABLED:true}");
    }

    private Properties loadProperties(Path path) throws IOException {
        Properties properties = new Properties();

        try (InputStream inputStream = Files.newInputStream(path)) {
            properties.load(inputStream);
        }

        return properties;
    }
}
