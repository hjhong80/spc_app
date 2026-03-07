import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Box } from '@mui/material';
import ProjectChooser from './ProjectChooser';
import ExcelPreview from './ProjectFieldMapperExcelPreview';
import FieldMapper from './ProjectFieldMapperSelector';
import { getColumnLetter, parseColumnInput } from '../../utils/fieldMapperParser';
import UnifiedFooterBar from '../common/UnifiedFooterBar';

const INITIAL_PROJECT_FORM = {
    projNum: '',
    projName: '',
    dataStartRow: 2,
    charNoCol: '',
    axisCol: '',
    nominalCol: '',
    uTolCol: '',
    lTolCol: '',
    measuredValueCol: '',
    serialNumberSourceJson: '',
    measurementTimeSourceJson: '',
};

const DEFAULT_SERIAL_NUMBER_SOURCE = {
    type: 'filenameRange',
    value: {},
};

const DEFAULT_MEASUREMENT_TIME_SOURCE = {
    type: 'filenameRange',
    value: {},
};

const FIELD_TO_PROJECT_COLUMN_KEY = {
    characteristicNo: 'charNoCol',
    axis: 'axisCol',
    nominal: 'nominalCol',
    upperTolerance: 'uTolCol',
    lowerTolerance: 'lTolCol',
    measuredValue: 'measuredValueCol',
};

const buildColumnMapping = (inputs) => ({
    characteristicNo: parseColumnInput(inputs.characteristicNo),
    axis: parseColumnInput(inputs.axis),
    nominal: parseColumnInput(inputs.nominal),
    upperTolerance: parseColumnInput(inputs.upperTolerance),
    lowerTolerance: parseColumnInput(inputs.lowerTolerance),
    measuredValue: parseColumnInput(inputs.measuredValue),
});

const parseSourceConfig = (rawValue, fallbackValue) => {
    if (!rawValue || typeof rawValue !== 'string') {
        return fallbackValue;
    }

    try {
        const parsed = JSON.parse(rawValue);
        if (
            parsed &&
            typeof parsed === 'object' &&
            typeof parsed.type === 'string'
        ) {
            return {
                type: parsed.type,
                value:
                    parsed.value && typeof parsed.value === 'object'
                        ? parsed.value
                        : {},
            };
        }
    } catch {
        return fallbackValue;
    }

    return fallbackValue;
};

const isCellEmpty = (value) => {
    if (value === null || value === undefined) {
        return true;
    }

    if (typeof value === 'string') {
        return value.trim() === '';
    }

    return false;
};

const toCellString = (value) => {
    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value === 'string') {
        return value.trim();
    }

    return String(value).trim();
};

const toNumericValue = (value) => {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
        const normalized = value.replace(/,/g, '').trim();
        if (normalized.length === 0) {
            return null;
        }

        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const formatDateForPreview = (value) => {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
        return '';
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    const hour = String(value.getHours()).padStart(2, '0');
    const minute = String(value.getMinutes()).padStart(2, '0');
    const second = String(value.getSeconds()).padStart(2, '0');

    if (hour === '00' && minute === '00' && second === '00') {
        return `${year}-${month}-${day}`;
    }

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const normalizePreviewCellValue = (value) => {
    if (value === null || value === undefined) {
        return '';
    }

    if (value instanceof Date) {
        return formatDateForPreview(value);
    }

    if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE';
    }

    return value;
};

const buildCharacteristicList = ({ excelData, dataStartRow, columnMapping }) => {
    if (!Array.isArray(excelData) || excelData.length === 0) {
        return [];
    }

    const charNoCol = columnMapping?.characteristicNo;
    const axisCol = columnMapping?.axis;
    const nominalCol = columnMapping?.nominal;
    const uTolCol = columnMapping?.upperTolerance;
    const lTolCol = columnMapping?.lowerTolerance;

    const hasInvalidColumn = [charNoCol, nominalCol, uTolCol, lTolCol].some(
        (columnIndex) =>
            !Number.isInteger(columnIndex) || Number(columnIndex) < 0,
    );
    if (hasInvalidColumn) {
        return [];
    }

    const safeDataStartRow = Number.isInteger(dataStartRow)
        ? Math.max(dataStartRow, 1)
        : 1;
    const characteristicList = [];

    for (let rowIndex = safeDataStartRow - 1; rowIndex < excelData.length; rowIndex += 1) {
        const row = Array.isArray(excelData[rowIndex]) ? excelData[rowIndex] : [];

        const charNoRaw = row[charNoCol];
        const axisRaw = Number.isInteger(axisCol) && Number(axisCol) >= 0 ? row[axisCol] : '';
        const nominalRaw = row[nominalCol];
        const uTolRaw = row[uTolCol];
        const lTolRaw = row[lTolCol];

        const hasAnyValue = [charNoRaw, nominalRaw, uTolRaw, lTolRaw].some(
            (value) => !isCellEmpty(value),
        );
        if (!hasAnyValue) {
            continue;
        }

        const characteristic = {
            charNo: toCellString(charNoRaw),
            axis: toCellString(axisRaw),
            nominal: toNumericValue(nominalRaw),
            uTol: toNumericValue(uTolRaw),
            lTol: toNumericValue(lTolRaw),
        };

        if (
            characteristic.charNo.length === 0 ||
            characteristic.nominal === null ||
            characteristic.uTol === null ||
            characteristic.lTol === null
        ) {
            continue;
        }

        characteristicList.push(characteristic);
    }

    return characteristicList;
};

const appendCellCoordinate = (currentValue, nextCoordinate) => {
    const nextToken = String(nextCoordinate || '').trim().toUpperCase();
    if (nextToken.length === 0) {
        return currentValue || '';
    }

    const tokens = String(currentValue || '')
        .split(',')
        .map((token) => token.trim().toUpperCase())
        .filter((token) => token.length > 0);

    if (tokens.includes(nextToken)) {
        return tokens.join(',');
    }

    return [...tokens, nextToken].join(',');
};

const normalizeSourceJson = (sourceConfig, fallbackValue) => {
    const source = sourceConfig || fallbackValue || { type: 'filenameRange', value: {} };
    return JSON.stringify({
        type: typeof source.type === 'string' ? source.type : fallbackValue?.type || 'filenameRange',
        value: source.value && typeof source.value === 'object' ? source.value : {},
    });
};

const buildComparableProjectState = ({
    projectForm,
    serialNumberSource,
    measurementTimeSource,
}) => ({
    projNum: toCellString(projectForm?.projNum),
    projName: toCellString(projectForm?.projName),
    dataStartRow: Number.parseInt(projectForm?.dataStartRow, 10) || 1,
    charNoCol: toCellString(projectForm?.charNoCol),
    axisCol: toCellString(projectForm?.axisCol),
    nominalCol: toCellString(projectForm?.nominalCol),
    uTolCol: toCellString(projectForm?.uTolCol),
    lTolCol: toCellString(projectForm?.lTolCol),
    measuredValueCol: toCellString(projectForm?.measuredValueCol),
    serialNumberSourceJson: normalizeSourceJson(
        serialNumberSource,
        DEFAULT_SERIAL_NUMBER_SOURCE,
    ),
    measurementTimeSourceJson: normalizeSourceJson(
        measurementTimeSource,
        DEFAULT_MEASUREMENT_TIME_SOURCE,
    ),
});

const buildComparableStateFromProject = (project) => {
    if (!project) {
        return null;
    }

    return buildComparableProjectState({
        projectForm: {
            projNum: project.projNum || '',
            projName: project.projName || '',
            dataStartRow: project.dataStartRow || 1,
            charNoCol: project.charNoCol || '',
            axisCol: project.axisCol || project.axiscol || '',
            nominalCol: project.nominalCol || '',
            uTolCol: project.uTolCol || project.utolCol || '',
            lTolCol: project.lTolCol || project.ltolCol || '',
            measuredValueCol:
                project.measuredValueCol || project.measuredvaluecol || '',
        },
        serialNumberSource: parseSourceConfig(
            project.serialNumberSourceJson || project.serialnumbersourcejson,
            DEFAULT_SERIAL_NUMBER_SOURCE,
        ),
        measurementTimeSource: parseSourceConfig(
            project.measurementTimeSourceJson ||
                project.measurementtimesourcejson,
            DEFAULT_MEASUREMENT_TIME_SOURCE,
        ),
    });
};

const ExcelFieldMapperContainer = ({
    onApply,
    isApplyDisabled = false,
    applyButtonText = '적용',
    successNoticeOpen = false,
    successNoticeMessage = '',
    onModeChange,
}) => {
    const [excelData, setExcelData] = useState(null);
    const [fileName, setFileName] = useState('');
    const [projectForm, setProjectForm] = useState(INITIAL_PROJECT_FORM);
    const [serialNumberSource, setSerialNumberSource] = useState({
        ...DEFAULT_SERIAL_NUMBER_SOURCE,
    });
    const [measurementTimeSource, setMeasurementTimeSource] = useState({
        ...DEFAULT_MEASUREMENT_TIME_SOURCE,
    });
    const [fieldInputs, setFieldInputs] = useState({
        characteristicNo: '',
        axis: '',
        nominal: '',
        upperTolerance: '',
        lowerTolerance: '',
        measuredValue: '',
    });
    const [columnMapping, setColumnMapping] = useState({
        characteristicNo: null,
        axis: null,
        nominal: null,
        upperTolerance: null,
        lowerTolerance: null,
        measuredValue: null,
    });
    const [activeSelectionTarget, setActiveSelectionTarget] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);

    const handleProjectFormChange = useCallback((partialForm) => {
        if (!partialForm) {
            return;
        }

        setProjectForm((prev) => {
            const next = { ...prev, ...partialForm };
            if (partialForm.dataStartRow !== undefined) {
                const parsed = parseInt(partialForm.dataStartRow, 10);
                next.dataStartRow = Number.isNaN(parsed)
                    ? 1
                    : Math.max(parsed, 1);
            }
            return next;
        });

        const hasColumnUpdate =
            partialForm.charNoCol !== undefined ||
            partialForm.axisCol !== undefined ||
            partialForm.nominalCol !== undefined ||
            partialForm.uTolCol !== undefined ||
            partialForm.lTolCol !== undefined ||
            partialForm.measuredValueCol !== undefined;

        if (hasColumnUpdate) {
            setFieldInputs((prev) => {
                const next = { ...prev };
                if (partialForm.charNoCol !== undefined) {
                    next.characteristicNo = partialForm.charNoCol || '';
                }
                if (partialForm.axisCol !== undefined) {
                    next.axis = partialForm.axisCol || '';
                }
                if (partialForm.nominalCol !== undefined) {
                    next.nominal = partialForm.nominalCol || '';
                }
                if (partialForm.uTolCol !== undefined) {
                    next.upperTolerance = partialForm.uTolCol || '';
                }
                if (partialForm.lTolCol !== undefined) {
                    next.lowerTolerance = partialForm.lTolCol || '';
                }
                if (partialForm.measuredValueCol !== undefined) {
                    next.measuredValue = partialForm.measuredValueCol || '';
                }
                setColumnMapping(buildColumnMapping(next));
                return next;
            });
        }
    }, []);

    const handleProjectSelect = useCallback(
        (project) => {
            if (!project) {
                setSelectedProject(null);
                setProjectForm(INITIAL_PROJECT_FORM);
                setSerialNumberSource({
                    ...DEFAULT_SERIAL_NUMBER_SOURCE,
                });
                setMeasurementTimeSource({
                    ...DEFAULT_MEASUREMENT_TIME_SOURCE,
                });
                setFieldInputs({
                    characteristicNo: '',
                    axis: '',
                    nominal: '',
                    upperTolerance: '',
                    lowerTolerance: '',
                    measuredValue: '',
                });
                setColumnMapping({
                    characteristicNo: null,
                    axis: null,
                    nominal: null,
                    upperTolerance: null,
                    lowerTolerance: null,
                    measuredValue: null,
                });
                setActiveSelectionTarget(null);
                return;
            }
            setSelectedProject(project);
            handleProjectFormChange({
                projNum: project.projNum || '',
                projName: project.projName || '',
                dataStartRow: project.dataStartRow || 1,
                charNoCol: project.charNoCol || '',
                axisCol: project.axisCol || project.axiscol || '',
                nominalCol: project.nominalCol || '',
                uTolCol: project.uTolCol || '',
                lTolCol: project.lTolCol || '',
                measuredValueCol:
                    project.measuredValueCol || project.measuredvaluecol || '',
                serialNumberSourceJson:
                    project.serialNumberSourceJson ||
                    project.serialnumbersourcejson ||
                    '',
                measurementTimeSourceJson:
                    project.measurementTimeSourceJson ||
                    project.measurementtimesourcejson ||
                    '',
            });
            setSerialNumberSource(
                parseSourceConfig(
                    project.serialNumberSourceJson ||
                        project.serialnumbersourcejson,
                    DEFAULT_SERIAL_NUMBER_SOURCE,
                ),
            );
            setMeasurementTimeSource(
                parseSourceConfig(
                    project.measurementTimeSourceJson ||
                        project.measurementtimesourcejson,
                    DEFAULT_MEASUREMENT_TIME_SOURCE,
                ),
            );
        },
        [handleProjectFormChange],
    );

    const isModifyMode = Boolean(selectedProject?.projId);
    const initialComparableState = useMemo(
        () => buildComparableStateFromProject(selectedProject),
        [selectedProject],
    );
    const currentComparableState = useMemo(
        () =>
            buildComparableProjectState({
                projectForm,
                serialNumberSource,
                measurementTimeSource,
            }),
        [measurementTimeSource, projectForm, serialNumberSource],
    );
    const hasModifyChanges = isModifyMode
        ? JSON.stringify(initialComparableState) !==
          JSON.stringify(currentComparableState)
        : true;

    useEffect(() => {
        onModeChange?.({
            isModifyMode,
            selectedProject,
            hasModifyChanges,
        });
    }, [hasModifyChanges, isModifyMode, onModeChange, selectedProject]);

    const handleFileSelect = useCallback(async (file) => {
        setFileName(file.name);
        const { default: readXlsxFile } = await import('read-excel-file/browser');
        const rows = await readXlsxFile(file, { sheet: 1 });
        const jsonData = rows.map((row) =>
            row.map((value) => normalizePreviewCellValue(value)),
        );

        setExcelData(jsonData);
        setActiveSelectionTarget(null);
    }, []);

    const handleFieldInputChange = useCallback((fieldKey, value) => {
        setFieldInputs((prev) => ({ ...prev, [fieldKey]: value }));
        const columnIndex = parseColumnInput(value);
        setColumnMapping((prev) => ({ ...prev, [fieldKey]: columnIndex }));

        const projectColumnKey = FIELD_TO_PROJECT_COLUMN_KEY[fieldKey];
        if (projectColumnKey) {
            setProjectForm((prev) => ({
                ...prev,
                [projectColumnKey]: value,
            }));
        }
    }, []);

    const handleApply = useCallback(async () => {
        if (isApplyDisabled) {
            return;
        }

        const characteristicList = buildCharacteristicList({
            excelData,
            dataStartRow: projectForm.dataStartRow,
            columnMapping,
        });

        const result = {
            fileName,
            ...projectForm,
            serialNumberSourceJson: JSON.stringify(serialNumberSource || {}),
            measurementTimeSourceJson: JSON.stringify(
                measurementTimeSource || {},
            ),
            serialNumberSource,
            measurementTimeSource,
            mapping: columnMapping,
            fieldInputs,
            characteristicList,
            selectedProject,
            isModifyMode,
            hasModifyChanges,
        };
        console.log('Field Mapping Result:', result);
        if (onApply) {
            await onApply(result);
        }
    }, [
        isApplyDisabled,
        fileName,
        excelData,
        projectForm,
        serialNumberSource,
        measurementTimeSource,
        columnMapping,
        fieldInputs,
        onApply,
    ]);

    const handleExcelCellSelect = useCallback(
        ({ value, coordinate }) => {
            if (!activeSelectionTarget) {
                return;
            }

            const normalizedValue = toCellString(value);

            if (activeSelectionTarget.kind === 'projectField') {
                if (activeSelectionTarget.fieldKey === 'projectName') {
                    handleProjectFormChange({ projName: normalizedValue });
                }
                if (activeSelectionTarget.fieldKey === 'projectNumber') {
                    handleProjectFormChange({ projNum: normalizedValue });
                }
                return;
            }

            if (activeSelectionTarget.kind === 'dataSourceCell') {
                const sourceUpdater =
                    activeSelectionTarget.sourceKey === 'serialNumberSource'
                        ? setSerialNumberSource
                        : setMeasurementTimeSource;

                sourceUpdater((prev) => ({
                    type: 'cellCoordinate',
                    value: {
                        ...prev?.value,
                        cell: appendCellCoordinate(
                            prev?.value?.cell,
                            coordinate,
                        ),
                    },
                }));
                return;
            }
        },
        [activeSelectionTarget, handleProjectFormChange],
    );

    const handleExcelRowSelect = useCallback(
        (rowIndex) => {
            if (activeSelectionTarget?.kind !== 'dataStartRow') {
                return;
            }

            handleProjectFormChange({ dataStartRow: rowIndex + 1 });
        },
        [activeSelectionTarget, handleProjectFormChange],
    );

    const handleExcelColumnSelect = useCallback(
        (colIndex) => {
            if (activeSelectionTarget?.kind !== 'columnMapping') {
                return;
            }

            handleFieldInputChange(
                activeSelectionTarget.fieldKey,
                getColumnLetter(colIndex),
            );
        },
        [activeSelectionTarget, handleFieldInputChange],
    );

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                maxHeight: '100%',
                bgcolor: 'background.default',
                p: 3,
                gap: 2,
                overflow: 'hidden',
            }}
        >
            {/* 硫붿씤 肄섑뀗痢?*/}
            {!excelData ? (
                <Box
                    sx={{
                        display: 'flex',
                        flex: 1,
                        minHeight: 0,
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            width: '100%',
                            maxWidth: '1680px',
                            minHeight: 0,
                            display: 'flex',
                            mx: 'auto',
                        }}
                    >
                        <ProjectChooser
                            onFileSelect={handleFileSelect}
                            projectForm={projectForm}
                            onProjectFormChange={handleProjectFormChange}
                            onProjectSelect={handleProjectSelect}
                        />
                    </Box>
                </Box>
            ) : (
                <Box
                    sx={{
                        display: 'flex',
                        flex: 1,
                        minHeight: 0,
                        minWidth: 0,
                        gap: 2,
                        overflow: 'hidden',
                        alignItems: 'stretch',
                    }}
                >
                    {/* 왼쪽: 엑셀 미리보기 (50%) */}
                    <Box
                        sx={{
                            flex: 1,
                            display: 'flex',
                            minWidth: 0,
                            minHeight: 0,
                            overflow: 'hidden',
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: 'neutral.700',
                            '& > *': {
                                flex: 1,
                                minHeight: 0,
                            },
                        }}
                    >
                        <ExcelPreview
                            data={excelData}
                            columnMapping={columnMapping}
                            dataStartRow={projectForm.dataStartRow}
                            onCellSelect={handleExcelCellSelect}
                            onRowSelect={handleExcelRowSelect}
                            onColumnSelect={handleExcelColumnSelect}
                        />
                    </Box>

                    {/* 오른쪽: 필드 매핑 (50%) */}
                    <Box
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            minHeight: 0,
                            overflow: 'auto',
                        }}
                    >
                        <FieldMapper
                            fileName={fileName}
                            projectName={projectForm.projName}
                            onProjectNameChange={(value) =>
                                handleProjectFormChange({ projName: value })
                            }
                            projectNumber={projectForm.projNum}
                            onProjectNumberChange={(value) =>
                                handleProjectFormChange({ projNum: value })
                            }
                            serialNumberSource={serialNumberSource}
                            onSerialNumberSourceChange={setSerialNumberSource}
                            measurementTimeSource={measurementTimeSource}
                            onMeasurementTimeSourceChange={
                                setMeasurementTimeSource
                            }
                            dataStartRow={projectForm.dataStartRow}
                            onDataStartRowChange={(value) =>
                                handleProjectFormChange({
                                    dataStartRow: value,
                                })
                            }
                            fieldInputs={fieldInputs}
                            onFieldInputChange={handleFieldInputChange}
                            columnMapping={columnMapping}
                            activeSelectionTarget={activeSelectionTarget}
                            onSelectionTargetChange={setActiveSelectionTarget}
                            onApply={handleApply}
                            isApplyDisabled={
                                isApplyDisabled ||
                                (isModifyMode && !hasModifyChanges)
                            }
                            applyButtonText={applyButtonText}
                            successNoticeOpen={successNoticeOpen}
                            successNoticeMessage={successNoticeMessage}
                        />
                    </Box>
                </Box>
            )}
            <UnifiedFooterBar />
        </Box>
    );
};

export default ExcelFieldMapperContainer;

