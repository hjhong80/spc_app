# SPC DB 스키마

## 1. `proj_tb`
- `proj_id`: long / pk, ai, nn
- `proj_num`: varchar(30) / uq, nn
- `proj_name`: varchar(255) / uq, nn
- `data_start_row`: int / nn
- `char_no_col`: varchar(10) / nn
- `axis_col`: varchar(10)
- `nominal_col`: varchar(10) / nn
- `u_tol_col`: varchar(10) / nn
- `l_tol_col`: varchar(10) / nn
- `measured_value_col`: varchar(10) / nn
- `serial_number_source_json`: text / nn
- `measurement_time_source_json`: text / nn
- `create_dt`: datetime / nn
- `update_dt`: datetime

## 2. `char_tb`
- `char_id`: long / pk, ai, nn
- `proj_id`: long / nn, fk(`proj_tb`)
- `char_no`: varchar(20) / nn
- `axis`: varchar(10)
- `nominal`: double / nn
- `u_tol`: double / nn
- `l_tol`: double / nn
- `create_dt`: datetime / nn
- `update_dt`: datetime

## 3. `insp_report_tb`
- `insp_report_id`: long / pk, ai, nn
- `proj_id`: long / nn, fk(`proj_tb`)
- `serial_no`: varchar(25) / nn, uq
- `insp_dt`: datetime / nn
- `create_dt`: datetime / nn
- `update_dt`: datetime

## 4. `insp_data_tb`
- `insp_data_id`: long / pk, ai, nn
- `insp_report_id`: long / nn, fk(`insp_report_tb`)
- `char_id`: long / nn, fk(`char_tb`)
- `measured_value`: double / nn

## 5. 권장 인덱스

### `insp_data_tb`
- `idx_insp_data_char_report_data (char_id, insp_report_id, insp_data_id)`
- `idx_insp_data_report_char_data (insp_report_id, char_id, insp_data_id)`

### `insp_report_tb`
- `idx_insp_report_dt_report (insp_dt, insp_report_id)`
- `idx_insp_report_proj_dt_report (proj_id, insp_dt, insp_report_id)`

## 6. 초기화(TRUNCATE) 가이드
- FK 체인: `proj_tb -> (char_tb, insp_report_tb) -> insp_data_tb`
- MySQL FK 제약 때문에 부모 테이블 단독 `TRUNCATE`는 실패할 수 있다.
- 아래 순서로 실행한다.

```sql
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE insp_data_tb;
TRUNCATE TABLE insp_report_tb;
TRUNCATE TABLE char_tb;
TRUNCATE TABLE proj_tb;

SET FOREIGN_KEY_CHECKS = 1;
```
