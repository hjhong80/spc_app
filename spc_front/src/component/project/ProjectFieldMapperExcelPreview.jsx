import React from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
} from '@mui/material';
import { getColumnLetter } from '../../utils/fieldMapperParser';

// 필드별 하이라이트 색상
const FIELD_COLORS = {
    characteristicNo: 'rgba(76, 175, 80, 0.3)', // 초록
    axis: 'rgba(96, 125, 139, 0.3)', // 블루그레이
    nominal: 'rgba(33, 150, 243, 0.3)', // 파랑
    upperTolerance: 'rgba(255, 152, 0, 0.3)', // 주황
    lowerTolerance: 'rgba(156, 39, 176, 0.3)', // 보라
    measuredValue: 'rgba(244, 67, 54, 0.3)', // 빨강
};

// 셀 폭 고정 (숫자 10자 정도: -1234.5678)
const CELL_WIDTH = '90px';

const ExcelPreview = ({
    data,
    columnMapping,
    dataStartRow = 2,
    onCellSelect,
    onRowSelect,
    onColumnSelect,
}) => {
    if (!data || data.length === 0) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'neutral.500',
                }}
            >
                <Typography>데이터가 없습니다</Typography>
            </Box>
        );
    }

    const maxColumns = Math.max(...data.map((row) => row.length));
    const displayData = data.slice(0, 100); // 최대 100행

    // 열 인덱스에 해당하는 필드 색상 가져오기
    const getColumnColor = (colIndex) => {
        for (const [field, mappedCol] of Object.entries(columnMapping || {})) {
            if (mappedCol === colIndex) {
                return FIELD_COLORS[field];
            }
        }
        return null;
    };

    return (
        <TableContainer
            component={Paper}
            sx={{
                height: '100%',
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                minHeight: 0,
                overflow: 'auto',
                bgcolor: 'background.paper',
                '& .MuiTableCell-root': {
                    borderColor: 'neutral.700',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    width: CELL_WIDTH,
                    minWidth: CELL_WIDTH,
                    maxWidth: CELL_WIDTH,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                },
            }}
        >
            <Table
                stickyHeader
                size="small"
                sx={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}
            >
                <TableHead>
                    <TableRow>
                        {/* 행 번호 헤더 */}
                        <TableCell
                            sx={{
                                bgcolor: 'background.default',
                                color: 'neutral.400',
                                fontWeight: 600,
                                width: '32px',
                                minWidth: '32px',
                                maxWidth: '32px',
                                textAlign: 'center',
                                fontSize: '0.65rem',
                            }}
                        >
                            #
                        </TableCell>
                        {/* 열 문자 헤더 (A, B, C...) */}
                        {Array.from({ length: maxColumns }, (_, i) => (
                            <TableCell
                                key={i}
                                sx={{
                                    bgcolor:
                                        getColumnColor(i) ||
                                        'background.default',
                                    color: 'neutral.300',
                                    fontWeight: 600,
                                    textAlign: 'center',
                                    cursor: onColumnSelect ? 'pointer' : 'default',
                                }}
                                onClick={() => onColumnSelect?.(i)}
                            >
                                {getColumnLetter(i)}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {displayData.map((row, rowIndex) => {
                        const isHeaderRow = rowIndex < dataStartRow - 1;
                        return (
                            <TableRow key={rowIndex}>
                                {/* 행 번호 */}
                                <TableCell
                                    sx={{
                                        bgcolor: 'background.default',
                                        color: 'neutral.500',
                                    textAlign: 'center',
                                    fontWeight: 500,
                                    width: '32px',
                                    minWidth: '32px',
                                    maxWidth: '32px',
                                    fontSize: '0.65rem',
                                    cursor: onRowSelect ? 'pointer' : 'default',
                                }}
                                    onClick={() => onRowSelect?.(rowIndex)}
                                >
                                    {rowIndex + 1}
                                </TableCell>
                                {/* 데이터 셀 */}
                                {Array.from(
                                    { length: maxColumns },
                                    (_, colIndex) => {
                                        const columnColor =
                                            getColumnColor(colIndex);
                                        return (
                                            <TableCell
                                                key={colIndex}
                                                title={String(
                                                    row[colIndex] ?? '',
                                                )}
                                                sx={{
                                                    bgcolor:
                                                        columnColor ||
                                                        'transparent',
                                                    color: isHeaderRow
                                                        ? 'neutral.500'
                                                        : 'neutral.200',
                                                    opacity: isHeaderRow
                                                        ? 0.6
                                                        : 1,
                                                    fontStyle: isHeaderRow
                                                        ? 'italic'
                                                        : 'normal',
                                                    cursor: onCellSelect
                                                        ? 'pointer'
                                                        : 'default',
                                                }}
                                                onClick={() =>
                                                    onCellSelect?.({
                                                        rowIndex,
                                                        colIndex,
                                                        value: row[colIndex],
                                                        coordinate: `${getColumnLetter(colIndex)}${rowIndex + 1}`,
                                                    })
                                                }
                                            >
                                                {row[colIndex] ?? ''}
                                            </TableCell>
                                        );
                                    },
                                )}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ExcelPreview;
