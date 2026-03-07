package com.spc.spc_back;

import static org.assertj.core.api.Assertions.assertThat;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.zaxxer.hikari.HikariDataSource;

@SpringBootTest
class TestHikariSettingsIntegrationTest {

    @Autowired
    private DataSource dataSource;

    @Test
    void 테스트환경에서hikari설정이적용된다() {
        assertThat(dataSource).isInstanceOf(HikariDataSource.class);

        HikariDataSource hikariDataSource = (HikariDataSource) dataSource;
        assertThat(hikariDataSource.getMinimumIdle()).isEqualTo(0);
        assertThat(hikariDataSource.getMaximumPoolSize()).isEqualTo(2);
        assertThat(hikariDataSource.getIdleTimeout()).isEqualTo(10_000L);
        assertThat(hikariDataSource.getMaxLifetime()).isEqualTo(30_000L);
    }
}
