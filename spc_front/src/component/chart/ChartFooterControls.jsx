import React, { useState } from 'react';
import {
    Box,
    IconButton,
    Popover,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

const pickerSx = {
    minWidth: 152,
    '& .MuiInputBase-root': {
        height: 30,
        borderRadius: '10px',
        bgcolor: 'rgba(33,36,41,0.86)',
        color: '#f5f5f5',
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(163,163,163,0.24)',
    },
    '& .MuiInputBase-input': {
        py: 0.45,
        fontSize: '0.82rem',
    },
    '& .MuiInputLabel-root': {
        color: '#a3a3a3',
        fontSize: '0.78rem',
    },
};

const ChartFooterControls = ({
    detailScale,
    selectedMonthValue,
    selectedDateValue,
    onScaleChange,
    onMonthChange,
    onDateChange,
    onResetPeriod,
}) => {
    const [pickerAnchorEl, setPickerAnchorEl] = useState(null);
    const [pickerMode, setPickerMode] = useState(detailScale);

    const handlePickerClose = () => {
        setPickerAnchorEl(null);
    };

    const handleScaleButtonClick = (nextScale) => (event) => {
        if (detailScale !== nextScale) {
            onScaleChange?.(event, nextScale);
        }

        if (pickerAnchorEl && pickerMode === nextScale) {
            handlePickerClose();
            return;
        }

        setPickerMode(nextScale);
        setPickerAnchorEl(event.currentTarget);
    };

    const handleMonthInputChange = (event) => {
        onMonthChange?.(event);
        if (event?.target?.value) {
            handlePickerClose();
        }
    };

    const handleDateInputChange = (event) => {
        onDateChange?.(event);
        if (event?.target?.value) {
            handlePickerClose();
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 0.6,
                minWidth: 0,
            }}
        >
            <ToggleButtonGroup
                size="small"
                exclusive
                value={detailScale}
                sx={{
                    '& .MuiToggleButton-root': {
                        borderColor: 'rgba(163,163,163,0.2)',
                        color: '#cfcfcf',
                        px: 1.05,
                        py: 0.35,
                        minHeight: 30,
                        bgcolor: 'rgba(33,36,41,0.86)',
                        textTransform: 'none',
                        gap: 0.45,
                    },
                    '& .Mui-selected': {
                        bgcolor: 'rgba(45,140,255,0.18) !important',
                        color: '#8ec5ff',
                    },
                }}
            >
                <ToggleButton value="month" onClick={handleScaleButtonClick('month')}>
                    <CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />
                    월단위
                </ToggleButton>
                <ToggleButton value="day" onClick={handleScaleButtonClick('day')}>
                    <TodayOutlinedIcon sx={{ fontSize: 16 }} />
                    일단위
                </ToggleButton>
            </ToggleButtonGroup>

            <IconButton
                size="small"
                onClick={() => {
                    onResetPeriod?.();
                    handlePickerClose();
                }}
                sx={{
                    height: 30,
                    width: 30,
                    borderRadius: '10px',
                    border: '1px solid rgba(163,163,163,0.24)',
                    bgcolor: 'rgba(33,36,41,0.86)',
                    color: '#cfcfcf',
                    '&:hover': {
                        borderColor: 'rgba(142,197,255,0.45)',
                        bgcolor: 'rgba(45,140,255,0.08)',
                    },
                }}
                title="최신 기준"
            >
                <RefreshRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>

            <Popover
                open={Boolean(pickerAnchorEl)}
                anchorEl={pickerAnchorEl}
                onClose={handlePickerClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 0.75,
                            p: 1,
                            minWidth: 184,
                            borderRadius: '12px',
                            border: '1px solid rgba(163,163,163,0.2)',
                            bgcolor: 'rgba(24,27,31,0.96)',
                            boxShadow: '0 18px 30px rgba(0,0,0,0.35)',
                            backdropFilter: 'blur(10px)',
                        },
                    },
                }}
            >
                {pickerMode === 'month' ? (
                    <TextField
                        size="small"
                        type="month"
                        label="조회 월"
                        value={selectedMonthValue}
                        onChange={handleMonthInputChange}
                        sx={pickerSx}
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                    />
                ) : (
                    <TextField
                        size="small"
                        type="date"
                        label="조회 일자"
                        value={selectedDateValue}
                        onChange={handleDateInputChange}
                        sx={pickerSx}
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                    />
                )}
            </Popover>
        </Box>
    );
};

export default ChartFooterControls;
