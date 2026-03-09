import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import {
    Box,
    TextField,
    Typography,
    Stack,
    ToggleButtonGroup,
    ToggleButton,
    Tooltip,
} from '@mui/material';

const VALID_BORDER_COLOR = '#5f8a68';
const INVALID_BORDER_COLOR = '#9a6464';

const getBorderColorByValidity = (isValid) => {
    if (isValid === true) {
        return VALID_BORDER_COLOR;
    }
    if (isValid === false) {
        return INVALID_BORDER_COLOR;
    }
    return null;
};

const getValidatedTextFieldSx = (isValid) => {
    const validationColor = getBorderColorByValidity(isValid);

    return {
        '& .MuiOutlinedInput-root': {
            bgcolor: 'background.default',
            '& fieldset': {
                borderColor: validationColor || 'neutral.600',
            },
            '&:hover fieldset': {
                borderColor: validationColor || 'neutral.500',
            },
            '&.Mui-focused fieldset': {
                borderColor: validationColor || 'primary.main',
            },
        },
        '& .MuiInputBase-input': {
            color: 'neutral.200',
            fontSize: '0.95rem',
            py: 1.2,
        },
    };
};

const DataSourceSelector = forwardRef(({
    label,
    icon,
    value,
    onChange,
    fileName,
    validationState,
    onTouched,
    onCellCoordinateFocus,
    onCellCoordinateDeactivate,
    onAdvance,
}, ref) => {
    const touch = () => {
        onTouched?.();
    };

    const [sourceType, setSourceType] = useState(
        value?.type || 'filenameRange',
    );
    const filenameRangeStartInputRef = useRef(null);
    const filenameOffsetInputRef = useRef(null);
    const cellCoordinateInputRef = useRef(null);
    const pendingFocusTypeRef = useRef(null);

    const focusPrimaryInput = (targetType = sourceType) => {
        const focusTargets = {
            filenameRange: filenameRangeStartInputRef,
            filenameOffset: filenameOffsetInputRef,
            cellCoordinate: cellCoordinateInputRef,
        };

        const targetRef = focusTargets[targetType];
        targetRef?.current?.focus();
    };

    useImperativeHandle(
        ref,
        () => ({
            focusPrimaryInput: () => {
                focusPrimaryInput();
            },
        }),
        [sourceType],
    );

    useEffect(() => {
        if (value?.type && value.type !== sourceType) {
            setSourceType(value.type);
        }
    }, [sourceType, value?.type]);

    useEffect(() => {
        if (!pendingFocusTypeRef.current) {
            return;
        }

        focusPrimaryInput(pendingFocusTypeRef.current);
        pendingFocusTypeRef.current = null;
    }, [sourceType, value?.type]);

    const handleSourceTypeChange = (_, newType) => {
        if (newType !== null) {
            touch();
            setSourceType(newType);
            onChange({ type: newType, value: {} });
            pendingFocusTypeRef.current = newType;
            if (newType !== 'cellCoordinate') {
                onCellCoordinateDeactivate?.();
            }
        }
    };

    const handleSourceTypeButtonClick = (targetType) => {
        if (sourceType === targetType) {
            focusPrimaryInput(targetType);
        }
    };

    const handleValueChange = (field, val) => {
        touch();
        onChange({
            type: sourceType,
            value: { ...value?.value, [field]: val },
        });
    };

    const maybeAdvanceToNextField = (overrideValue = {}) => {
        const nextValue = { ...(value?.value || {}), ...overrideValue };

        if (sourceType === 'filenameRange') {
            const start = parseInt(nextValue.start, 10);
            const end = parseInt(nextValue.end, 10);
            if (
                Number.isInteger(start) &&
                Number.isInteger(end) &&
                start >= 1 &&
                end >= start
            ) {
                onAdvance?.();
            }
            return;
        }

        if (sourceType === 'filenameOffset') {
            const offset = parseInt(nextValue.offset, 10);
            const length = parseInt(nextValue.length, 10);
            if (
                Number.isInteger(offset) &&
                Number.isInteger(length) &&
                offset >= 1 &&
                length >= 1
            ) {
                onAdvance?.();
            }
        }
    };

    // 파일명에서 하이라이트 미리보기 생성
    const getFilenamePreview = () => {
        if (!fileName) return null;
        const { start, end } = value?.value || {};
        if (sourceType === 'filenameRange' && start && end) {
            const s = parseInt(start, 10) - 1;
            const e = parseInt(end, 10);
            if (s >= 0 && e > s && e <= fileName.length) {
                return (
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'neutral.400',
                            fontFamily: 'monospace',
                            fontSize: '1rem',
                        }}
                    >
                        {fileName.slice(0, s)}
                        <Box
                            component="span"
                            sx={{
                                bgcolor: 'primary.main',
                                color: 'white',
                                px: 0.3,
                                borderRadius: '2px',
                            }}
                        >
                            {fileName.slice(s, e)}
                        </Box>
                        {fileName.slice(e)}
                    </Typography>
                );
            }
        } else if (sourceType === 'filenameOffset') {
            const offset = parseInt(value?.value?.offset, 10);
            const length = parseInt(value?.value?.length, 10);
            if (offset > 0 && length > 0) {
                const extIndex = fileName.lastIndexOf('.');
                if (extIndex > 0) {
                    const s = extIndex - offset;
                    const e = s + length;
                    if (s >= 0 && e <= extIndex) {
                        return (
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'neutral.400',
                                    fontFamily: 'monospace',
                                    fontSize: '1rem',
                                }}
                            >
                                {fileName.slice(0, s)}
                                <Box
                                    component="span"
                                    sx={{
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        px: 0.3,
                                        borderRadius: '2px',
                                    }}
                                >
                                    {fileName.slice(s, e)}
                                </Box>
                                {fileName.slice(e)}
                            </Typography>
                        );
                    }
                }
            }
        }
        return (
            <Typography
                variant="caption"
                sx={{ color: 'neutral.500', fontSize: '1rem' }}
            >
                {fileName}
            </Typography>
        );
    };

    const validationColor = getBorderColorByValidity(validationState);

    return (
        <Box sx={{ mb: 0 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1,
                }}
            >
                {icon}
                <Typography
                    variant="caption"
                    sx={{
                        color: 'neutral.300',
                        fontWeight: 500,
                        fontSize: '1rem',
                    }}
                >
                    {label}
                </Typography>
            </Box>

            <ToggleButtonGroup
                value={sourceType}
                exclusive
                onChange={handleSourceTypeChange}
                size="small"
                sx={{
                    mb: 1,
                    width: '100%',
                    '& .MuiToggleButton-root': {
                        flex: 1,
                        color: 'neutral.400',
                        borderColor: validationColor || 'neutral.600',
                        fontSize: '0.8rem',
                        py: 0.25,
                        '&.Mui-selected': {
                            bgcolor: 'primary.main',
                            color: 'neutral.100',
                            '&:hover': { bgcolor: 'primary.dark' },
                        },
                    },
                }}
            >
                <ToggleButton
                    value="filenameRange"
                    onClick={() => handleSourceTypeButtonClick('filenameRange')}
                >
                    <Tooltip title="파일명에서 시작~끝 위치">
                        <span>파일명</span>
                    </Tooltip>
                </ToggleButton>
                <ToggleButton
                    value="filenameOffset"
                    onClick={() => handleSourceTypeButtonClick('filenameOffset')}
                >
                    <Tooltip title="확장자 기준 오프셋">
                        <span>확장자</span>
                    </Tooltip>
                </ToggleButton>
                <ToggleButton
                    value="cellCoordinate"
                    onClick={() => handleSourceTypeButtonClick('cellCoordinate')}
                >
                    <Tooltip title="엑셀 셀 좌표">
                        <span>셀</span>
                    </Tooltip>
                </ToggleButton>
            </ToggleButtonGroup>

            {/* 파일명 미리보기 */}
            {(sourceType === 'filenameRange' ||
                sourceType === 'filenameOffset') && (
                <Box
                    sx={{
                        mb: 1,
                        p: 1,
                        bgcolor: 'background.default',
                        borderRadius: '4px',
                        overflow: 'hidden',
                    }}
                >
                    {getFilenamePreview()}
                </Box>
            )}

            {/* 입력 필드들 */}
            {sourceType === 'filenameRange' && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                    <TextField
                        inputRef={filenameRangeStartInputRef}
                        size="small"
                        type="number"
                        placeholder="시작"
                        value={value?.value?.start || ''}
                        onChange={(e) =>
                            handleValueChange('start', e.target.value)
                        }
                        inputProps={{ min: 1 }}
                        onBlur={touch}
                        sx={{
                            ...getValidatedTextFieldSx(validationState),
                            flex: 1,
                            '& .MuiInputBase-input': {
                                ...getValidatedTextFieldSx(validationState)['& .MuiInputBase-input'],
                                py: 0.5,
                            },
                        }}
                    />
                    <Typography sx={{ color: 'neutral.500', fontSize: '1rem' }}>
                        ~
                    </Typography>
                    <TextField
                        size="small"
                        type="number"
                        placeholder="끝"
                        value={value?.value?.end || ''}
                        onChange={(e) =>
                            handleValueChange('end', e.target.value)
                        }
                        inputProps={{ min: 1 }}
                        onBlur={(e) => {
                            touch();
                            maybeAdvanceToNextField({ end: e.target.value });
                        }}
                        sx={{
                            ...getValidatedTextFieldSx(validationState),
                            flex: 1,
                            '& .MuiInputBase-input': {
                                ...getValidatedTextFieldSx(validationState)['& .MuiInputBase-input'],
                                py: 0.5,
                            },
                        }}
                    />
                </Stack>
            )}

            {sourceType === 'filenameOffset' && (
                <Stack direction="row" spacing={0.5}>
                    <TextField
                        inputRef={filenameOffsetInputRef}
                        size="small"
                        type="number"
                        placeholder="거리"
                        value={value?.value?.offset || ''}
                        onChange={(e) =>
                            handleValueChange('offset', e.target.value)
                        }
                        inputProps={{ min: 1 }}
                        onBlur={touch}
                        sx={{
                            ...getValidatedTextFieldSx(validationState),
                            flex: 1,
                            '& .MuiInputBase-input': {
                                ...getValidatedTextFieldSx(validationState)['& .MuiInputBase-input'],
                                py: 0.5,
                            },
                        }}
                    />
                    <TextField
                        size="small"
                        type="number"
                        placeholder="길이"
                        value={value?.value?.length || ''}
                        onChange={(e) =>
                            handleValueChange('length', e.target.value)
                        }
                        inputProps={{ min: 1 }}
                        onBlur={(e) => {
                            touch();
                            maybeAdvanceToNextField({ length: e.target.value });
                        }}
                        sx={{
                            ...getValidatedTextFieldSx(validationState),
                            flex: 1,
                            '& .MuiInputBase-input': {
                                ...getValidatedTextFieldSx(validationState)['& .MuiInputBase-input'],
                                py: 0.5,
                            },
                        }}
                    />
                </Stack>
            )}

            {sourceType === 'cellCoordinate' && (
                <Box>
                    <TextField
                        inputRef={cellCoordinateInputRef}
                        size="small"
                        placeholder="예: B6,B7 또는 B6~B7 또는 B6-B7"
                        value={value?.value?.cell || ''}
                        onChange={(e) => handleValueChange('cell', e.target.value)}
                        onFocus={() => {
                            touch();
                            onCellCoordinateFocus?.();
                        }}
                        onBlur={touch}
                        fullWidth
                        sx={{
                            ...getValidatedTextFieldSx(validationState),
                            '& .MuiInputBase-input': {
                                ...getValidatedTextFieldSx(validationState)['& .MuiInputBase-input'],
                                py: 0.5,
                            },
                        }}
                    />
                    <Typography
                        variant="caption"
                        sx={{ display: 'block', mt: 0.5, color: 'neutral.500', fontSize: '0.85rem' }}
                    >
                        ** 입력 예) b6, b7 또는 b6~b7 또는 b6-b7 **
                    </Typography>
                </Box>
            )}
        </Box>
    );
});

export default DataSourceSelector;
