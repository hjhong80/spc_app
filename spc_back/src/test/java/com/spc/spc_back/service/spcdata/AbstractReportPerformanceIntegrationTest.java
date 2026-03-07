package com.spc.spc_back.service.spcdata;

import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

@Testcontainers(disabledWithoutDocker = true)
abstract class AbstractReportPerformanceIntegrationTest {

    protected static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");

    static {
        MYSQL.start();
    }

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.datasource.driver-class-name", MYSQL::getDriverClassName);
    }

    protected void resetDatabase(JdbcTemplate jdbcTemplate) {
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator(
                new ClassPathResource("schema.sql"),
                new ClassPathResource("data.sql"));
        populator.execute(jdbcTemplate.getDataSource());
    }

    protected void analyzePerformanceTables(JdbcTemplate jdbcTemplate) {
        jdbcTemplate.execute("ANALYZE TABLE proj_tb");
        jdbcTemplate.execute("ANALYZE TABLE char_tb");
        jdbcTemplate.execute("ANALYZE TABLE insp_report_tb");
        jdbcTemplate.execute("ANALYZE TABLE insp_data_tb");
    }
}
