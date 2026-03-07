DROP TABLE IF EXISTS insp_data_tb;
DROP TABLE IF EXISTS insp_report_tb;
DROP TABLE IF EXISTS char_tb;
DROP TABLE IF EXISTS proj_tb;

CREATE TABLE proj_tb (
    proj_id BIGINT PRIMARY KEY,
    proj_num VARCHAR(50) NOT NULL,
    proj_name VARCHAR(100) NOT NULL,
    data_start_row INT NOT NULL,
    char_no_col VARCHAR(50) NOT NULL,
    axis_col VARCHAR(50) NULL,
    nominal_col VARCHAR(50) NOT NULL,
    u_tol_col VARCHAR(50) NOT NULL,
    l_tol_col VARCHAR(50) NOT NULL,
    measured_value_col VARCHAR(50) NOT NULL,
    serial_number_source_json TEXT NOT NULL,
    measurement_time_source_json TEXT NOT NULL,
    create_dt DATETIME NOT NULL,
    update_dt DATETIME NULL
);

CREATE TABLE char_tb (
    char_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    proj_id BIGINT NOT NULL,
    char_no VARCHAR(50) NOT NULL,
    axis VARCHAR(20) NULL,
    nominal DOUBLE NOT NULL,
    u_tol DOUBLE NOT NULL,
    l_tol DOUBLE NOT NULL,
    create_dt DATETIME NOT NULL,
    update_dt DATETIME NULL,
    CONSTRAINT fk_char_proj
        FOREIGN KEY (proj_id) REFERENCES proj_tb (proj_id)
);

CREATE TABLE insp_report_tb (
    insp_report_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    proj_id BIGINT NOT NULL,
    serial_no VARCHAR(100) NOT NULL,
    insp_dt DATETIME NOT NULL,
    create_dt DATETIME NOT NULL,
    update_dt DATETIME NULL,
    CONSTRAINT fk_report_proj
        FOREIGN KEY (proj_id) REFERENCES proj_tb (proj_id)
);

CREATE TABLE insp_data_tb (
    insp_data_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    insp_report_id BIGINT NOT NULL,
    char_id BIGINT NOT NULL,
    measured_value DOUBLE NOT NULL,
    CONSTRAINT fk_data_report
        FOREIGN KEY (insp_report_id) REFERENCES insp_report_tb (insp_report_id),
    CONSTRAINT fk_data_char
        FOREIGN KEY (char_id) REFERENCES char_tb (char_id)
);

CREATE INDEX idx_insp_data_char_report_data
    ON insp_data_tb (char_id, insp_report_id, insp_data_id);

CREATE INDEX idx_insp_data_report_char_data
    ON insp_data_tb (insp_report_id, char_id, insp_data_id);

CREATE INDEX idx_insp_report_dt_report
    ON insp_report_tb (insp_dt, insp_report_id);

CREATE INDEX idx_insp_report_proj_dt_report
    ON insp_report_tb (proj_id, insp_dt, insp_report_id);
