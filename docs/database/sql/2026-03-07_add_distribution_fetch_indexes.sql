-- distribution/detail fetch 최적화를 위한 인덱스 추가
-- 목적:
-- 1) insp_data_tb의 char_id / insp_report_id 조인 경로 최적화
-- 2) insp_report_tb의 insp_dt / proj_id 기간 필터 최적화
-- MySQL 버전 호환: CREATE INDEX IF NOT EXISTS 미지원 환경 대응

SET @schema_name = DATABASE();

SET @sql = IF(
    EXISTS(
        SELECT 1
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = @schema_name
          AND TABLE_NAME = 'insp_data_tb'
          AND INDEX_NAME = 'idx_insp_data_char_report_data'
    ),
    'SELECT ''skip: idx_insp_data_char_report_data already exists''',
    'CREATE INDEX idx_insp_data_char_report_data ON insp_data_tb (char_id, insp_report_id, insp_data_id)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS(
        SELECT 1
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = @schema_name
          AND TABLE_NAME = 'insp_report_tb'
          AND INDEX_NAME = 'idx_insp_report_dt_report'
    ),
    'SELECT ''skip: idx_insp_report_dt_report already exists''',
    'CREATE INDEX idx_insp_report_dt_report ON insp_report_tb (insp_dt, insp_report_id)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS(
        SELECT 1
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = @schema_name
          AND TABLE_NAME = 'insp_data_tb'
          AND INDEX_NAME = 'idx_insp_data_report_char_data'
    ),
    'SELECT ''skip: idx_insp_data_report_char_data already exists''',
    'CREATE INDEX idx_insp_data_report_char_data ON insp_data_tb (insp_report_id, char_id, insp_data_id)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS(
        SELECT 1
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = @schema_name
          AND TABLE_NAME = 'insp_report_tb'
          AND INDEX_NAME = 'idx_insp_report_proj_dt_report'
    ),
    'SELECT ''skip: idx_insp_report_proj_dt_report already exists''',
    'CREATE INDEX idx_insp_report_proj_dt_report ON insp_report_tb (proj_id, insp_dt, insp_report_id)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
