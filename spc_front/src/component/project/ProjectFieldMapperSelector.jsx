import React, { useState } from 'react';
import {
    Box,
    TextField,
    Typography,
    Button,
    Stack,
    Chip,
    SnackbarContent,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import TagIcon from '@mui/icons-material/Tag';
import DataSourceSelector from './ProjectFieldMapperSelectorDataSourceSelector';
import {
    getColumnLetter,
    parseCellCoordinateExpression,
} from '../../utils/fieldMapperParser';

// 필드 정보 정의
const FIELDS = [
    { key: 'characteristicNo', label: 'Characteristic No', color: '#4CAF50' },
    { key: 'axis', label: 'Axis (필요할 시)', color: '#607D8B' },
    { key: 'nominal', label: 'Nominal', color: '#2196F3' },
    { key: 'measuredValue', label: 'Measured Value', color: '#f44336' },
    { key: 'upperTolerance', label: 'Upper Tolerance', color: '#FF9800' },
    { key: 'lowerTolerance', label: 'Lower Tolerance', color: '#9C27B0' },
];

// 공통 TextField 스타일
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
            '& fieldset': { borderColor: validationColor || 'neutral.600' },
            '&:hover fieldset': { borderColor: validationColor || 'neutral.500' },
            '&.Mui-focused fieldset': { borderColor: validationColor || 'primary.main' },
        },
        '& .MuiInputBase-input': {
            color: 'neutral.200',
            fontSize: '0.95rem',
            py: 1.2,
        },
    };
};

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const getFieldInputDisplayState = (value, isFocused) => {
    if (isNonEmptyString(value)) {
        return true;
    }

    if (isFocused) {
        return false;
    }

    return null;
};

const isPositiveInteger = (value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed >= 1;
};

const isMappedColumn = (columnIndex) =>
    Number.isInteger(columnIndex) && Number(columnIndex) >= 0;

const isOptionalMappedColumn = (inputValue, columnIndex) => {
    if (typeof inputValue !== 'string' || inputValue.trim().length === 0) {
        return true;
    }
    return isMappedColumn(columnIndex);
};

const isValidDataSource = (sourceConfig) => {
    if (!sourceConfig || typeof sourceConfig !== 'object') {
        return false;
    }

    const type = sourceConfig.type;
    const value = sourceConfig.value || {};

    if (type === 'filenameRange') {
        const start = Number.parseInt(value.start, 10);
        const end = Number.parseInt(value.end, 10);
        return Number.isInteger(start) && Number.isInteger(end) && start >= 1 && end >= start;
    }

    if (type === 'filenameOffset') {
        const offset = Number.parseInt(value.offset, 10);
        const length = Number.parseInt(value.length, 10);
        return Number.isInteger(offset) && Number.isInteger(length) && offset >= 1 && length >= 1;
    }

    if (type === 'cellCoordinate') {
        return Boolean(parseCellCoordinateExpression(value.cell || ''));
    }

    return false;
};

const formatFileNameForDisplay = (rawFileName, maxLength = 44) => {
    if (typeof rawFileName !== 'string') {
        return '-';
    }

    const fileName = rawFileName.trim();
    if (fileName.length === 0) {
        return '-';
    }

    if (fileName.length <= maxLength) {
        return fileName;
    }

    const extensionStartIndex = fileName.lastIndexOf('.');
    if (
        extensionStartIndex <= 0 ||
        extensionStartIndex >= fileName.length - 1
    ) {
        return `${fileName.slice(0, maxLength - 3)}...`;
    }

    const extension = fileName.slice(extensionStartIndex);
    const headLength = Math.max(maxLength - extension.length - 3, 8);
    return `${fileName.slice(0, headLength)}...${extension}`;
};

const FieldMapper = ({
    fileName,
    projectName,
    onProjectNameChange,
    projectNumber,
    onProjectNumberChange,
    serialNumberSource,
    onSerialNumberSourceChange,
    measurementTimeSource,
    onMeasurementTimeSourceChange,
    dataStartRow,
    onDataStartRowChange,
    fieldInputs,
    onFieldInputChange,
    columnMapping,
    onSelectionTargetChange,
    onApply,
    isApplyDisabled = false,
    applyButtonText = '적용',
    successNoticeOpen = false,
    successNoticeMessage = '',
}) => {
    const [focusedFieldKey, setFocusedFieldKey] = useState(null);
    const [touched, setTouched] = useState({
        projectName: false,
        projectNumber: false,
        dataStartRow: false,
        characteristicNo: false,
        axis: false,
        nominal: false,
        upperTolerance: false,
        lowerTolerance: false,
        measuredValue: false,
        serialNumberSource: false,
        measurementTimeSource: false,
    });

    const markTouched = (key) => {
        setTouched((prev) => {
            if (prev[key]) {
                return prev;
            }
            return { ...prev, [key]: true };
        });
    };

    const getValidationState = (key) => (touched[key] ? validations[key] : null);

    const handleInputChange = (fieldKey, value) => {
        markTouched(fieldKey);
        onFieldInputChange(fieldKey, value);
    };

    const compactFileName = formatFileNameForDisplay(fileName);
    const validations = {
        projectName: isNonEmptyString(projectName),
        projectNumber: isNonEmptyString(projectNumber),
        dataStartRow: isPositiveInteger(dataStartRow),
        serialNumberSource: isValidDataSource(serialNumberSource),
        measurementTimeSource: isValidDataSource(measurementTimeSource),
        characteristicNo: isMappedColumn(columnMapping?.characteristicNo),
        axis: isOptionalMappedColumn(fieldInputs?.axis, columnMapping?.axis),
        nominal: isMappedColumn(columnMapping?.nominal),
        upperTolerance: isMappedColumn(columnMapping?.upperTolerance),
        lowerTolerance: isMappedColumn(columnMapping?.lowerTolerance),
        measuredValue: isMappedColumn(columnMapping?.measuredValue),
    };

    const requiredValidationKeys = [
        'projectName',
        'projectNumber',
        'dataStartRow',
        'serialNumberSource',
        'measurementTimeSource',
        'characteristicNo',
        'nominal',
        'upperTolerance',
        'lowerTolerance',
        'measuredValue',
    ];
    const isRequiredInputsValid = requiredValidationKeys.every(
        (key) => validations[key] === true,
    );
    const isApplyButtonDisabled = isApplyDisabled || !isRequiredInputsValid;
    const activateSelectionTarget = (target) => {
        onSelectionTargetChange?.(target);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: 'neutral.700',
                height: '100%',
                minHeight: 0,
                overflow: 'hidden',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 1.5,
                }}
            >
                <Typography
                    variant="subtitle1"
                    sx={{
                        color: 'neutral.200',
                        fontWeight: 600,
                        fontSize: '1.5rem',
                        lineHeight: 1.4,
                        pt: 0.25,
                        flexShrink: 0,
                    }}
                >
                    필드 매핑
                </Typography>

                <Box
                    sx={{
                        width: '100%',
                        maxWidth: '420px',
                        p: 1.25,
                        bgcolor: 'background.default',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: 'neutral.700',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <DescriptionOutlinedIcon
                                sx={{ fontSize: 14, color: '#737373' }}
                            />
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'neutral.500',
                                    fontSize: '0.8rem',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                }}
                            >
                                파일명
                            </Typography>
                        </Box>
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'neutral.300',
                                fontFamily: 'monospace',
                                fontSize: '0.9rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'clip',
                                textAlign: 'right',
                                minWidth: 0,
                                flex: 1,
                            }}
                        >
                            {compactFileName}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* 2단 레이아웃 */}
            <Box
                sx={{
                    display: 'flex',
                    gap: 4,
                    flex: 1,
                    minHeight: 0,
                    overflow: 'auto',
                    pr: 0.25,
                }}
            >
                {/* 왼쪽: 제품명, 도면 번호, 시리얼 번호, 측정 시간 */}
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'start',
                        gap: 4,
                    }}
                >
                    {/* 제품명 */}
                    <Box>
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'neutral.400',
                                mb: 0.5,
                                display: 'block',
                                fontSize: '1rem',
                            }}
                        >
                            제품명(프로젝트명)
                        </Typography>
                        <TextField
                            size="medium"
                            placeholder="제품명"
                            value={projectName || ''}
                            onChange={(e) => {
                                markTouched('projectName');
                                onProjectNameChange(e.target.value);
                            }}
                            onFocus={() =>
                                activateSelectionTarget({
                                    kind: 'projectField',
                                    fieldKey: 'projectName',
                                })
                            }
                            onBlur={() => markTouched('projectName')}
                            fullWidth
                            sx={getValidatedTextFieldSx(getValidationState('projectName'))}
                        />
                    </Box>

                    {/* 도면 번호 */}
                    <Box>
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'neutral.400',
                                mb: 0.5,
                                display: 'block',
                                fontSize: '1rem',
                            }}
                        >
                            도면 번호
                        </Typography>
                        <TextField
                            size="medium"
                            placeholder="도면 번호"
                            value={projectNumber || ''}
                            onChange={(e) => {
                                markTouched('projectNumber');
                                onProjectNumberChange(e.target.value);
                            }}
                            onFocus={() =>
                                activateSelectionTarget({
                                    kind: 'projectField',
                                    fieldKey: 'projectNumber',
                                })
                            }
                            onBlur={() => markTouched('projectNumber')}
                            fullWidth
                            sx={getValidatedTextFieldSx(getValidationState('projectNumber'))}
                        />
                    </Box>

                    {/* 시리얼 번호 */}
                    <DataSourceSelector
                        label="시리얼 번호"
                        icon={<TagIcon sx={{ fontSize: 20, color: '#1976d2' }} />}
                        value={serialNumberSource}
                        onChange={onSerialNumberSourceChange}
                        fileName={fileName}
                        validationState={getValidationState('serialNumberSource')}
                        onTouched={() => markTouched('serialNumberSource')}
                        onCellCoordinateFocus={() =>
                            activateSelectionTarget({
                                kind: 'dataSourceCell',
                                sourceKey: 'serialNumberSource',
                            })
                        }
                        onCellCoordinateDeactivate={() =>
                            activateSelectionTarget(null)
                        }
                    />

                    {/* 측정 시간 */}
                    <DataSourceSelector
                        label="측정 시간"
                        icon={
                            <AccessTimeIcon
                                sx={{ fontSize: 20, color: '#1976d2' }}
                            />
                        }
                        value={measurementTimeSource}
                        onChange={onMeasurementTimeSourceChange}
                        fileName={fileName}
                        validationState={getValidationState('measurementTimeSource')}
                        onTouched={() => markTouched('measurementTimeSource')}
                        onCellCoordinateFocus={() =>
                            activateSelectionTarget({
                                kind: 'dataSourceCell',
                                sourceKey: 'measurementTimeSource',
                            })
                        }
                        onCellCoordinateDeactivate={() =>
                            activateSelectionTarget(null)
                        }
                    />
                </Box>

                {/* 오른쪽: 데이터 시작 행, 필드 매핑 */}
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'start',
                        gap: 4,
                    }}
                >
                    {/* 데이터 시작 행 */}
                    <Box>
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'neutral.400',
                                mb: 1,
                                display: 'block',
                                fontSize: '1rem',
                            }}
                        >
                            데이터 시작 행(헤더 제외)
                        </Typography>
                        <TextField
                            size="medium"
                            value={dataStartRow}
                            onChange={(e) => {
                                markTouched('dataStartRow');
                                onDataStartRowChange(
                                    parseInt(e.target.value, 10) || 1,
                                );
                            }}
                            onFocus={() =>
                                activateSelectionTarget({
                                    kind: 'dataStartRow',
                                })
                            }
                            onKeyDown={(e) => {
                                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                    e.preventDefault();
                                }
                            }}
                            onBlur={() => markTouched('dataStartRow')}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                            }}
                            fullWidth
                            sx={getValidatedTextFieldSx(getValidationState('dataStartRow'))}
                        />
                    </Box>

                    {/* 필드별 입력 (열 매핑) */}
                    <Stack spacing={2}>
                        {FIELDS.map((field) => (
                            <Box key={field.key}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        mb: 1,
                                    }}
                                >
                                    <Chip
                                        size="small"
                                        sx={{
                                            bgcolor: field.color,
                                            color: 'white',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            height: '22px',
                                            minWidth: '28px',
                                        }}
                                        label={
                                            columnMapping[field.key] !== null
                                                ? getColumnLetter(
                                                      columnMapping[field.key],
                                                  )
                                                : '-'
                                        }
                                    />
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: 'neutral.400',
                                            fontSize: '0.85rem',
                                        }}
                                    >
                                        {field.label}
                                    </Typography>
                                </Box>
                                <TextField
                                    size="small"
                                    placeholder="A, B 또는 1"
                                    value={fieldInputs[field.key] || ''}
                                    onChange={(e) =>
                                        handleInputChange(
                                            field.key,
                                            e.target.value,
                                        )
                                    }
                                    onFocus={() =>
                                        {
                                            setFocusedFieldKey(field.key);
                                            activateSelectionTarget({
                                                kind: 'columnMapping',
                                                fieldKey: field.key,
                                            });
                                        }
                                    }
                                    onBlur={() => {
                                        setFocusedFieldKey((prev) =>
                                            prev === field.key ? null : prev,
                                        );
                                    }}
                                    fullWidth
                                    sx={{
                                        ...getValidatedTextFieldSx(
                                            getFieldInputDisplayState(
                                                fieldInputs[field.key],
                                                focusedFieldKey === field.key,
                                            ),
                                        ),
                                        '& .MuiInputBase-input': {
                                            ...getValidatedTextFieldSx(
                                                getFieldInputDisplayState(
                                                    fieldInputs[field.key],
                                                    focusedFieldKey === field.key,
                                                ),
                                            )['& .MuiInputBase-input'],
                                            py: 0.5,
                                        },
                                    }}
                                />
                            </Box>
                        ))}
                    </Stack>
                </Box>
            </Box>

            {/* 적용 버튼 영역 */}
            <Box
                sx={{
                    mt: 1.5,
                    pt: 1.5,
                    borderTop: '1px solid',
                    borderColor: 'neutral.700',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 1.25,
                    flexShrink: 0,
                }}
            >
                {successNoticeOpen && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <SnackbarContent
                            message={successNoticeMessage || '프로젝트 등록이 성공되었습니다.'}
                            sx={{
                                width: '100%',
                                maxWidth: '520px',
                                bgcolor: '#2e7d32',
                                color: 'white',
                                borderRadius: '8px',
                                '& .MuiSnackbarContent-message': {
                                    fontWeight: 600,
                                    textAlign: 'center',
                                    width: '100%',
                                },
                            }}
                        />
                    </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <Button
                        variant="contained"
                        onClick={onApply}
                        disabled={isApplyButtonDisabled}
                        sx={{
                            minWidth: '360px',
                            maxWidth: '100%',
                            bgcolor: 'primary.main',
                            '&:hover': { bgcolor: 'primary.dark' },
                        }}
                    >
                        {applyButtonText}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default FieldMapper;
