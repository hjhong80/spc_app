import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { serialReportDetailColumns } from './serialReportDetailColumns';
import {
    resolveSerialReportScrollState,
    SERIAL_REPORT_TABLE_MAX_HEIGHT,
} from './serialReportDetailScroll';

const NUMERIC_COLUMN_KEYS = new Set([
    'nominal',
    'uTol',
    'lTol',
    'measuredValue',
]);

const CENTER_ALIGNED_COLUMN_KEYS = new Set(['dimensionLabel', 'dateLabel']);

const formatCellValue = (value) => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }
    return String(value);
};

const formatDateTimeText = (value) => {
    const normalizedValue = formatCellValue(value);
    if (normalizedValue === '-') {
        return normalizedValue;
    }

    return normalizedValue.replace('T', ' ');
};

const formatDimensionLabel = (row) => {
    const charNo = String(row?.charNo ?? '').trim();
    const axis = String(row?.axis ?? '').trim();

    if (!charNo) {
        return '-';
    }

    return axis ? `${charNo}_${axis}` : charNo;
};

const formatDateLabel = (row) => {
    const updateDt = String(row?.updateDt ?? '').trim();
    if (updateDt) {
        return `${formatDateTimeText(updateDt)} (수정)`;
    }

    return formatDateTimeText(row?.createDt);
};

const formatNumericText = (value) => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
        return '-';
    }

    return numericValue.toFixed(4);
};

const renderNumericValue = (value) => {
    const formattedValue = formatNumericText(value);
    if (formattedValue === '-') {
        return '-';
    }

    const [integerPart, fractionPart = '0000'] = formattedValue.split('.');

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) auto',
                alignItems: 'baseline',
                width: '100%',
                fontVariantNumeric: 'tabular-nums',
                fontFeatureSettings: '"tnum"',
            }}
        >
            <Box component="span" sx={{ textAlign: 'right' }}>
                {integerPart}
            </Box>
            <Box component="span" sx={{ minWidth: '5ch', textAlign: 'left' }}>
                .{fractionPart}
            </Box>
        </Box>
    );
};

const resolveColumnValue = (row, key) => {
    if (key === 'dimensionLabel') {
        return formatDimensionLabel(row);
    }

    if (key === 'dateLabel') {
        return formatDateLabel(row);
    }

    if (NUMERIC_COLUMN_KEYS.has(key)) {
        return renderNumericValue(row?.[key]);
    }

    return formatCellValue(row?.[key]);
};

const tableCellPaddingSx = {
    px: 2,
    py: 1,
};

const tableColumnWidthSx = {
    dimensionLabel: { width: '133px' },
    nominal: { width: '133px' },
    uTol: { width: '133px' },
    lTol: { width: '133px' },
    measuredValue: { width: '133px' },
    dateLabel: { width: '200px' },
};

const SERIAL_REPORT_SCROLL_STEP = 190;

const SerialReportDetailModal = ({
    open,
    serialNo,
    rows,
    isLoading,
    onClose,
}) => {
    const safeRows = Array.isArray(rows) ? rows : [];
    const tableContainerRef = useRef(null);
    const [scrollState, setScrollState] = useState({
        canScrollUp: false,
        canScrollDown: false,
    });

    const syncScrollState = useCallback(() => {
        const containerElement = tableContainerRef.current;
        if (!containerElement) {
            setScrollState({
                canScrollUp: false,
                canScrollDown: false,
            });
            return;
        }

        setScrollState(
            resolveSerialReportScrollState({
                scrollTop: containerElement.scrollTop,
                clientHeight: containerElement.clientHeight,
                scrollHeight: containerElement.scrollHeight,
            }),
        );
    }, []);

    useEffect(() => {
        if (!open || isLoading) {
            setScrollState({
                canScrollUp: false,
                canScrollDown: false,
            });
            return;
        }

        const frameId = requestAnimationFrame(() => {
            syncScrollState();
        });

        return () => {
            cancelAnimationFrame(frameId);
        };
    }, [isLoading, open, safeRows.length, syncScrollState]);

    const handleTableScroll = useCallback(() => {
        syncScrollState();
    }, [syncScrollState]);

    const handleScrollButtonClick = useCallback(
        (direction) => {
            const containerElement = tableContainerRef.current;
            if (!containerElement) {
                return;
            }

            containerElement.scrollBy({
                top:
                    direction === 'down'
                        ? SERIAL_REPORT_SCROLL_STEP
                        : -SERIAL_REPORT_SCROLL_STEP,
                behavior: 'smooth',
            });

            requestAnimationFrame(() => {
                syncScrollState();
            });
        },
        [syncScrollState],
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ pr: 7 }}>
                성적서 상세
                <IconButton
                    aria-label="닫기"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ px: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary' }}
                    >
                        {serialNo || '-'}
                    </Typography>

                    {isLoading ? (
                        <Typography>
                            성적서 상세를 불러오는 중입니다.
                        </Typography>
                    ) : (
                        <Box sx={{ position: 'relative' }}>
                            <TableContainer
                                ref={tableContainerRef}
                                component={Paper}
                                variant="outlined"
                                onScroll={handleTableScroll}
                                sx={{
                                    maxWidth: '100%',
                                    maxHeight: `${SERIAL_REPORT_TABLE_MAX_HEIGHT}px`,
                                    overflowX: 'hidden',
                                    overflowY: 'auto',
                                    scrollbarWidth: 'none',
                                    '&::-webkit-scrollbar': {
                                        display: 'none',
                                    },
                                }}
                            >
                                <Table
                                    stickyHeader
                                    size="small"
                                    sx={{
                                        width: '100%',
                                        tableLayout: 'fixed',
                                    }}
                                >
                                    <colgroup>
                                        {serialReportDetailColumns.map((column) => (
                                            <col
                                                key={column.key}
                                                style={
                                                    tableColumnWidthSx[column.key]
                                                }
                                            />
                                        ))}
                                    </colgroup>
                                    <TableHead>
                                        <TableRow>
                                            {serialReportDetailColumns.map(
                                                (column) => (
                                                    <TableCell
                                                        key={column.key}
                                                        sx={{
                                                            ...tableCellPaddingSx,
                                                            textAlign: 'center',
                                                            ...(NUMERIC_COLUMN_KEYS.has(
                                                                column.key,
                                                            )
                                                                ? {
                                                                      fontVariantNumeric:
                                                                          'tabular-nums',
                                                                  }
                                                                : {}),
                                                        }}
                                                    >
                                                        {column.label}
                                                    </TableCell>
                                                ),
                                            )}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {safeRows.map((row, index) => (
                                            <TableRow
                                                key={`${row?.charNo || 'row'}-${index + 1}`}
                                            >
                                                {serialReportDetailColumns.map(
                                                    (column) => (
                                                        <TableCell
                                                            key={column.key}
                                                            sx={{
                                                                ...tableCellPaddingSx,
                                                                ...(CENTER_ALIGNED_COLUMN_KEYS.has(
                                                                    column.key,
                                                                )
                                                                    ? {
                                                                          textAlign:
                                                                              'center',
                                                                      }
                                                                    : {}),
                                                                ...(NUMERIC_COLUMN_KEYS.has(
                                                                    column.key,
                                                                )
                                                                    ? {
                                                                          textAlign:
                                                                              'right',
                                                                          fontVariantNumeric:
                                                                              'tabular-nums',
                                                                      }
                                                                    : {}),
                                                                ...(column.key ===
                                                                'dateLabel'
                                                                    ? {
                                                                          whiteSpace:
                                                                              'nowrap',
                                                                      }
                                                                    : {}),
                                                            }}
                                                        >
                                                            {resolveColumnValue(
                                                                row,
                                                                column.key,
                                                            )}
                                                        </TableCell>
                                                    ),
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            {scrollState.canScrollUp ? (
                                <IconButton
                                    aria-label="위로 스크롤"
                                    onClick={() =>
                                        handleScrollButtonClick('up')
                                    }
                                    size="small"
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        right: 8,
                                        transform: 'translateY(-165%)',
                                        zIndex: 2,
                                        border: '1px solid rgba(255,255,255,0.18)',
                                        bgcolor: 'rgba(16, 21, 31, 0.88)',
                                        color: 'common.white',
                                        '&:hover': {
                                            bgcolor: 'rgba(33, 41, 59, 0.95)',
                                        },
                                    }}
                                >
                                    <KeyboardArrowUpIcon />
                                </IconButton>
                            ) : null}
                            {scrollState.canScrollDown ? (
                                <IconButton
                                    aria-label="아래로 스크롤"
                                    onClick={() =>
                                        handleScrollButtonClick('down')
                                    }
                                    size="small"
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        right: 8,
                                        transform: 'translateY(65%)',
                                        zIndex: 2,
                                        border: '1px solid rgba(255,255,255,0.18)',
                                        bgcolor: 'rgba(16, 21, 31, 0.88)',
                                        color: 'common.white',
                                        '&:hover': {
                                            bgcolor: 'rgba(33, 41, 59, 0.95)',
                                        },
                                    }}
                                >
                                    <KeyboardArrowDownIcon />
                                </IconButton>
                            ) : null}
                        </Box>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default SerialReportDetailModal;
