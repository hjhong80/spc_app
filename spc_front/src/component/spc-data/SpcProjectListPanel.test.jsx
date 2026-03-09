import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SpcProjectListPanel from './SpcProjectListPanel';

describe('SpcProjectListPanel', () => {
    it('renders the data query title and places the search controls below the project list box', () => {
        render(
            <SpcProjectListPanel
                projectList={[]}
                selectedProjectId={null}
                searchKeyword=""
                isLoading={false}
                statusMessage=""
                statusType="info"
                onSearchKeywordChange={vi.fn()}
                onRefresh={vi.fn()}
                onSelectProject={vi.fn()}
            />,
        );

        expect(screen.getByRole('heading', { name: '데이터 조회' })).toBeInTheDocument();
        expect(
            screen.queryByText('프로젝트를 선택해 저장된 데이터를 조회합니다.'),
        ).not.toBeInTheDocument();

        const projectListTitle = screen.getByText('프로젝트 리스트');
        const projectListGuide = screen.getByText('프로젝트를 클릭하면 차트 보기 화면으로 이동합니다.');
        const emptyState = screen.getByText('표시할 프로젝트가 없습니다.');
        const projectSearchInput = screen.getByLabelText('프로젝트 검색');

        expect(projectListTitle.compareDocumentPosition(projectSearchInput)).toBe(
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
        expect(projectListGuide.compareDocumentPosition(projectSearchInput)).toBe(
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
        expect(emptyState.compareDocumentPosition(projectSearchInput)).toBe(
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
    });
});
