INSERT INTO proj_tb (
    proj_id, proj_num, proj_name, data_start_row, char_no_col, axis_col,
    nominal_col, u_tol_col, l_tol_col, measured_value_col,
    serial_number_source_json, measurement_time_source_json, create_dt, update_dt
) VALUES
    (1, 'P-001', 'Project One', 2, 'A', 'B', 'C', 'D', 'E', 'F', '{}', '{}', '2026-03-01 00:00:00', NULL),
    (2, 'P-002', 'Project Two', 2, 'A', 'B', 'C', 'D', 'E', 'F', '{}', '{}', '2026-03-01 00:00:00', NULL);

INSERT INTO char_tb (
    char_id, proj_id, char_no, axis, nominal, u_tol, l_tol, create_dt, update_dt
) VALUES
    (101, 1, 'C-01', 'X', 10.0, 0.5, -0.5, '2026-03-01 00:00:00', NULL),
    (102, 1, 'C-02', 'Y', 20.0, 1.0, -1.0, '2026-03-01 00:00:00', NULL),
    (201, 2, 'C-01', 'X', 30.0, 1.5, -1.5, '2026-03-01 00:00:00', NULL);

INSERT INTO insp_report_tb (
    insp_report_id, proj_id, serial_no, insp_dt, create_dt, update_dt
) VALUES
    (1001, 1, 'SN-1001', '2026-03-15 08:00:00', '2026-03-15 08:00:00', NULL),
    (1002, 1, 'SN-1002', '2026-03-15 10:00:00', '2026-03-15 10:00:00', NULL),
    (1003, 1, 'SN-1003', '2026-03-28 09:00:00', '2026-03-28 09:00:00', NULL),
    (1004, 1, 'SN-1004', '2026-04-03 09:00:00', '2026-04-03 09:00:00', NULL),
    (2001, 2, 'SN-2001', '2026-03-15 09:30:00', '2026-03-15 09:30:00', NULL);

INSERT INTO insp_data_tb (
    insp_data_id, insp_report_id, char_id, measured_value
) VALUES
    (1, 1001, 101, 9.8),
    (2, 1002, 101, 10.0),
    (3, 1003, 101, 10.2),
    (4, 1004, 101, 10.6),
    (5, 1001, 102, 21.5),
    (6, 1002, 102, 19.4),
    (7, 2001, 201, 29.7);
