import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProjectFieldMapperSelectorDataSourceSelector from './ProjectFieldMapperSelectorDataSourceSelector';

const createProps = () => ({
    label: '시리얼 번호',
    icon: <span>icon</span>,
    value: { type: 'filenameRange', value: {} },
    onChange: vi.fn(),
    fileName: 'TEST-123.xlsx',
    validationState: null,
    onTouched: vi.fn(),
    onCellCoordinateFocus: vi.fn(),
    onCellCoordinateDeactivate: vi.fn(),
});

describe('ProjectFieldMapperSelectorDataSourceSelector', () => {
    it('focuses the first input for each selected source type', () => {
        const props = createProps();
        const onAdvance = vi.fn();

        const Harness = () => {
            const [value, setValue] = useState(props.value);

            return (
                <ProjectFieldMapperSelectorDataSourceSelector
                    {...props}
                    value={value}
                    onChange={setValue}
                    onAdvance={onAdvance}
                />
            );
        };

        render(<Harness />);

        fireEvent.click(screen.getByRole('button', { name: '파일명에서 시작~끝 위치' }));
        expect(screen.getByPlaceholderText('시작')).toHaveFocus();

        fireEvent.click(screen.getByRole('button', { name: '확장자 기준 오프셋' }));
        expect(screen.getByPlaceholderText('거리')).toHaveFocus();

        fireEvent.click(screen.getByRole('button', { name: '엑셀 셀 좌표' }));
        const cellInput = screen.getByPlaceholderText(
            '예: B6,B7 또는 B6~B7 또는 B6-B7',
        );
        expect(cellInput).toHaveFocus();

        fireEvent.blur(cellInput);
        expect(onAdvance).not.toHaveBeenCalled();
    });
});
