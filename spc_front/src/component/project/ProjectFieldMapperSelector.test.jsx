import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProjectFieldMapperSelector from './ProjectFieldMapperSelector';
import { parseColumnInput } from '../../utils/fieldMapperParser';

const createProps = () => ({
    fileName: 'SAMPLE-123.xlsx',
    projectName: '',
    onProjectNameChange: vi.fn(),
    projectNumber: '',
    onProjectNumberChange: vi.fn(),
    serialNumberSource: { type: 'filenameRange', value: {} },
    onSerialNumberSourceChange: vi.fn(),
    measurementTimeSource: { type: 'filenameRange', value: {} },
    onMeasurementTimeSourceChange: vi.fn(),
    dataStartRow: 2,
    onDataStartRowChange: vi.fn(),
    fieldInputs: {
        characteristicNo: '',
        axis: '',
        nominal: '',
        measuredValue: '',
        upperTolerance: '',
        lowerTolerance: '',
    },
    onFieldInputChange: vi.fn(),
    columnMapping: {
        characteristicNo: 0,
        axis: 1,
        nominal: 2,
        measuredValue: 3,
        upperTolerance: 4,
        lowerTolerance: 5,
    },
    onSelectionTargetChange: vi.fn(),
    onApply: vi.fn(),
});

describe('ProjectFieldMapperSelector', () => {
    it('moves focus to the next field on blur based on the required order', () => {
        const props = createProps();
        const Harness = () => {
            const [projectName, setProjectName] = useState(props.projectName);
            const [projectNumber, setProjectNumber] = useState(props.projectNumber);
            const [serialNumberSource, setSerialNumberSource] = useState(props.serialNumberSource);
            const [measurementTimeSource, setMeasurementTimeSource] = useState(
                props.measurementTimeSource,
            );
            const [dataStartRow, setDataStartRow] = useState(props.dataStartRow);
            const [fieldInputs, setFieldInputs] = useState(props.fieldInputs);
            const [columnMapping, setColumnMapping] = useState(props.columnMapping);

            const handleFieldInputChange = (fieldKey, value) => {
                setFieldInputs((prev) => ({ ...prev, [fieldKey]: value }));
                setColumnMapping((prev) => ({
                    ...prev,
                    [fieldKey]: parseColumnInput(value),
                }));
            };

            return (
                <ProjectFieldMapperSelector
                    {...props}
                    projectName={projectName}
                    onProjectNameChange={setProjectName}
                    projectNumber={projectNumber}
                    onProjectNumberChange={setProjectNumber}
                    serialNumberSource={serialNumberSource}
                    onSerialNumberSourceChange={setSerialNumberSource}
                    measurementTimeSource={measurementTimeSource}
                    onMeasurementTimeSourceChange={setMeasurementTimeSource}
                    dataStartRow={dataStartRow}
                    onDataStartRowChange={setDataStartRow}
                    fieldInputs={fieldInputs}
                    onFieldInputChange={handleFieldInputChange}
                    columnMapping={columnMapping}
                />
            );
        };

        render(<Harness />);

        const mappingInputs = () => screen.getAllByPlaceholderText('A, B 또는 1');
        const serialStartInput = () => screen.getAllByPlaceholderText('시작')[0];
        const serialEndInput = () => screen.getAllByPlaceholderText('끝')[0];
        const measurementStartInput = () => screen.getAllByPlaceholderText('시작')[1];
        const measurementEndInput = () => screen.getAllByPlaceholderText('끝')[1];

        const projectNameInput = screen.getByPlaceholderText('제품명');
        fireEvent.focus(projectNameInput);
        fireEvent.change(projectNameInput, { target: { value: '제품A' } });
        fireEvent.blur(projectNameInput);
        expect(screen.getByPlaceholderText('도면 번호')).toHaveFocus();

        const projectNumberInput = screen.getByPlaceholderText('도면 번호');
        fireEvent.change(projectNumberInput, { target: { value: 'DWG-1' } });
        fireEvent.blur(projectNumberInput);
        expect(serialStartInput()).toHaveFocus();

        fireEvent.change(serialStartInput(), { target: { value: '1' } });
        fireEvent.change(serialEndInput(), { target: { value: '5' } });
        fireEvent.blur(serialEndInput());
        expect(measurementStartInput()).toHaveFocus();

        fireEvent.change(measurementStartInput(), { target: { value: '2' } });
        fireEvent.change(measurementEndInput(), { target: { value: '8' } });
        fireEvent.blur(measurementEndInput());

        const dataStartRowInput = screen
            .getAllByDisplayValue('2')
            .find((element) => element.getAttribute('inputmode') === 'numeric');
        expect(dataStartRowInput).toBeTruthy();
        expect(dataStartRowInput).toHaveFocus();

        fireEvent.blur(dataStartRowInput);
        expect(mappingInputs()[0]).toHaveFocus();

        fireEvent.change(mappingInputs()[0], { target: { value: 'A' } });
        fireEvent.blur(mappingInputs()[0]);
        expect(mappingInputs()[1]).toHaveFocus();
    });
});
