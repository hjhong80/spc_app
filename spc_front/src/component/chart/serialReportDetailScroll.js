export const SERIAL_REPORT_VISIBLE_ROW_COUNT = 15;
const SERIAL_REPORT_HEADER_HEIGHT = 44;
const SERIAL_REPORT_ROW_HEIGHT = 38;
export const SERIAL_REPORT_TABLE_MAX_HEIGHT =
    SERIAL_REPORT_HEADER_HEIGHT +
    SERIAL_REPORT_ROW_HEIGHT * SERIAL_REPORT_VISIBLE_ROW_COUNT;

export const resolveSerialReportScrollState = ({
    scrollTop = 0,
    clientHeight = 0,
    scrollHeight = 0,
}) => {
    return {
        canScrollUp: scrollTop > 1,
        canScrollDown: scrollTop + clientHeight < scrollHeight - 1,
    };
};
