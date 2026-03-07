package com.spc.spc_back;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;

class TestJvmWarningSettingsIntegrationTest {

    private final Path projectRoot = Path.of("").toAbsolutePath().normalize().getParent();
    private final Path pomPath = projectRoot.resolve("spc_back").resolve("pom.xml");
    private final Path jvmConfigPath = projectRoot.resolve("spc_back").resolve(".mvn").resolve("jvm.config");

    @Test
    void 테스트실행환경은Unsafe경고억제용MavenJvm옵션을가진다() throws IOException {
        assertThat(jvmConfigPath).exists();

        String jvmConfig = Files.readString(jvmConfigPath, StandardCharsets.UTF_8);

        assertThat(jvmConfig).contains("--sun-misc-unsafe-memory-access=allow");
    }

    @Test
    void pom은jvm경고정리용surefire와lombok설정을명시한다() throws IOException {
        String pomXml = Files.readString(pomPath, StandardCharsets.UTF_8);

        assertThat(pomXml).contains("<lombok.version>");
        assertThat(pomXml).contains("<version>${lombok.version}</version>");
        assertThat(pomXml).contains("<argLine>-Xshare:off -javaagent:");
    }
}
